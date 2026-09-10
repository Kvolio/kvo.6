import {ENEMIES,UNITS,BUILDINGS,TILE,waveComposition} from './data.js';
import {random,distance} from './world.js';

export const Invasions={
  startWave(){
    if(this.active||this.over)return false;
    if(this.difficulty==='nightmare'&&this.wave>=50)return this.startDemonWave();
    const sites=this.world.landingSites();if(!sites.length){this.notice('No landing coast is available.');return false;}
    this.noteAction();if(this.tutorial)this.tutorial.done=true;this.wave++;this.active=true;this.timer=0;
    const rng=random(this.world.seed+this.wave*7919),types=waveComposition(this.wave,this.difficulty),ground=types.filter(t=>!ENEMIES[t].flying);
    // Shuffle with a saved-map seed: repeatable, but each wave can use new beaches.
    const shuffled=[...sites];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    const count=this.world.island?(this.wave<10?2:this.wave<25?3:4):(this.wave<15?1:this.wave<30?2:3),lanes=[];
    // Prefer distinct sides before adding a second landing on an existing side.
    for(const site of shuffled)if(!lanes.some(s=>s.side===site.side)&&lanes.length<count)lanes.push(site);
    for(const site of shuffled)if(!lanes.includes(site)&&lanes.length<count)lanes.push(site);
    for(let i=0;i<ground.length;i+=8){
      const site=lanes[(i/8)%lanes.length],delay=Math.floor(i/8/lanes.length)*2.5;
      this.ships.push({x:site.seaX,y:site.seaY,originX:site.seaX,originY:site.seaY,targetX:site.targetX,targetY:site.targetY,beachX:site.x,beachY:site.y,dx:site.dx,dy:site.dy,side:site.side,delay,units:ground.slice(i,i+8),landed:false,facing:Math.atan2(site.dy,site.dx)-Math.PI/2});
    }
    for(const type of types.filter(t=>ENEMIES[t].flying)){
      const site=lanes[Math.floor(rng()*lanes.length)],e=this.spawnEnemy(type,site.seaX,site.seaY);e.facing=Math.atan2(site.dy,site.dx);e.arriving=true;
    }
    this.notice(`Wave ${this.wave}: ${types.some(t=>ENEMIES[t].flying)?'wings and sails':'sails'} on the horizon!`);this.sound('wave');return true;
  },
  setAutoWave(enabled){this.autoWave=!!enabled;if(this.autoWave&&!this.active&&this.wave>0)this.timer=Math.min(this.timer,5);this.notice(this.autoWave?'Auto waves enabled: the next invasion starts five seconds after victory.':'Auto waves disabled.');},
  isAirborne(entity){return !!ENEMIES[entity.type]?.flying&&entity.airborne!==false;},
  setAirborne(entity,airborne){
    if(!ENEMIES[entity.type]?.flying)return false;
    const tile=this.world.at(entity.x,entity.y);
    if(!airborne&&(!this.world.walkable(tile)||this.world.buildingAt(this.buildings,tile.x,tile.y)))return false;
    entity.airborne=!!airborne;entity.path=[];entity.pathRevision=-1;return true;
  },
  canDamage(source,target){
    if(target.garrison&&ENEMIES[source.type]&&!this.isAirborne(source)&&ENEMIES[source.type].range<=85)return false;
    if(this.isAirborne(target)){const ranged=UNITS[source.type]||ENEMIES[source.type];return (BUILDINGS[source.type]?.range||0)>85||!!ranged&&!ranged.healer&&ranged.range>85;}
    return true;
  },
  updateShips(dt){
    for(const s of this.ships){
      // Migrate an already-sailing legacy north-coast ship without altering its tiles.
      if(s.targetX==null){s.targetX=s.x;s.beachX=s.x;s.beachY=s.targetY+20;s.dx=0;s.dy=1;s.originX=s.x;s.originY=-80;s.facing=0;}
      if(s.delay>0){s.delay-=dt;continue;}
      if(!s.landed){
        const to={x:s.targetX,y:s.targetY},len=distance(s,to),step=Math.min(len,32*dt);
        if(len>1){s.x+=(to.x-s.x)/len*step;s.y+=(to.y-s.y)/len*step;}
        if(len<=step+1){
          const tile=this.world.at(s.beachX,s.beachY),block=this.world.buildingAt(this.buildings,tile.x,tile.y);
          if(block&&block.type!=='road'){
            s.breachClock=(s.breachClock||0)-dt;if(s.breachClock<=0){s.breachClock=1.5;block.hp-=s.units.reduce((n,type)=>n+ENEMIES[type].damage,0)*.5;this.effects.push({x:s.beachX,y:s.beachY,kind:'hit',life:.4,max:.4});this.sound('hit');}continue;
          }
          if(!this.world.walkable(tile))continue;
          s.landed=true;s.depart=9;
          // Stay inside the first free beach tile; never jump a defense line.
          for(let i=0;i<s.units.length;i++)this.spawnEnemy(s.units[i],(tile.x+.5)*TILE+(i%3-1)*8,(tile.y+.5)*TILE+(Math.floor(i/3)-1)*8);
        }
      }else{
        s.depart-=dt;if(s.depart<5){s.x-=s.dx*30*dt;s.y-=s.dy*30*dt;}
      }
    }
    this.ships=this.ships.filter(s=>!s.landed||s.depart>0);
  }
};
