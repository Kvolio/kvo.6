import {BUILDINGS,UNITS,ENEMIES,TILE} from './data.js';
import {distance} from './world.js';

// Nearby candidates are scanned without sorting entire armies every frame.
export class CombatGrid{
  constructor(entities){this.cells=new Map();for(const e of entities){if(e.hp<=0)continue;const key=`${Math.floor(e.x/160)},${Math.floor(e.y/160)}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(e);}}
  near(point,radius){const result=[];for(let y=Math.floor((point.y-radius)/160);y<=Math.floor((point.y+radius)/160);y++)for(let x=Math.floor((point.x-radius)/160);x<=Math.floor((point.x+radius)/160);x++)for(const e of this.cells.get(`${x},${y}`)||[])if(e.hp>0&&distance(point,e)<=radius)result.push(e);return result;}
}

export const Combat={
  spawnEnemy(type,x,y){
    const d=ENEMIES[type],factor=this.difficulty==='easy'?.75:this.difficulty==='hard'?1.25:this.difficulty==='nightmare'?1.45:1;
    const e={id:++this.id,type,x,y,hp:d.hp*factor,maxHp:d.hp*factor,cooldown:0,abilityClock:d.boss?5:8,path:[],pathRevision:-1,decisionClock:0};this.enemies.push(e);return e;
  },
  stoneStructure(t){return !!BUILDINGS[t.type]&&(['keep','wall','gate','tower','ballista','quarry','ironmine','goldmine','smith','road'].includes(t.type)||t.level>=3&&!['farm','lumber','palisade'].includes(t.type));},
  ignite(target,duration=5,sourceId=null){
    if(target.hp<=0||this.stoneStructure(target))return;
    target.burn={remaining:Math.max(target.burn?.remaining||0,duration),dps:6,sourceId};
  },
  attackDamage(source){
    const d=ENEMIES[source.type]||UNITS[source.type]||BUILDINGS[source.type];
    if(BUILDINGS[source.type]?.damage)return this.towerDamage(source);
    if(ENEMIES[source.type])return d.damage*(this.difficulty==='easy'?.85:this.difficulty==='hard'?1.15:this.difficulty==='nightmare'?1.3:1)*(1+(source.auraBonus||0)+(source.rallyUntil>this.time?.2:0))*(source.phase===2?1.15:1);
    return d.damage*(1+this.tech*.15)*(1+this.researchBonus(d.range>85?'ranged':'melee'));
  },
  damageEntity(source,target,raw,{area=false,burn=false}={}){
    if(target.hp<=0||this.isAirborne(target)&&!this.canDamage(source,target)||!area&&!this.canDamage(source,target))return 0;
    const d=ENEMIES[target.type]||UNITS[target.type]||BUILDINGS[target.type],armor=burn?0:(d.armor||0)+(UNITS[target.type]?this.tech+this.researchBonus('armor'):0);
    let damage=Math.max(burn?0:1,raw-armor)*(1-(d.defense||0));
    if(target.wardUntil>this.time&&this.enemies.some(e=>e.hp>0&&e.wardFor===target.id))damage*=.35;
    if(target.phase==='healing')damage*=.1;
    target.hp-=damage;target.lastAttacker=source.id;target.lastHitTime=this.time;
    if(target.type==='demonlord'&&!target.phase&&target.hp<=target.maxHp*.5)this.beginDemonLordPhase(target);
    if(target.phase==='healing')target.hp=Math.max(1,target.hp);
    if(target.hp<=0&&ENEMIES[target.type]&&!ENEMIES[source.type])source.kills=(source.kills||0)+1;
    return damage;
  },
  hit(source,target,dt){
    if(source.cooldown>0||source.hp<=0||target.hp<=0||!this.canDamage(source,target))return;
    const d=ENEMIES[source.type]||UNITS[source.type]||BUILDINGS[source.type];
    const wall=BUILDINGS[target.type]&&['wall','palisade','gate'].includes(target.type);
    const damage=d.wallbreaker&&wall?target.hp+100:this.attackDamage(source);
    this.damageEntity(source,target,damage);source.cooldown=d.attackInterval||(source.type==='ballista'?1.8:source.type==='crossbow'?1.3:1);
    if(source.rageUntil>this.time)source.cooldown*=.7;source.attackUntil=this.time+.3;source.facing=Math.atan2(target.y-source.y,target.x-source.x);
    if(d.burn)this.ignite(target,d.burn,source.id);
    if(ENEMIES[target.type]?.thorns&&UNITS[source.type]?.range<=85)this.ignite(source,4,target.id);
    if(d.splash){const splashDamage=this.attackDamage(source)*.55;for(const t of [...this.units,...this.buildings])if(t!==target&&t.hp>0&&distance(t,target)<d.splash)this.damageEntity(source,t,splashDamage,{area:true});}
    this.effects.push({x:source.x,y:source.y,tx:target.x,ty:target.y,kind:d.range>85?'arrow':'hit',life:.25,max:.25});this.sound(d.range>85?'arrow':'hit');
  },
  updateCombatStatus(dt){
    for(const e of this.enemies)e.auraBonus=0;
    for(const source of this.enemies)if(ENEMIES[source.type].aura&&source.hp>0)for(const e of this.enemies)if(e.hp>0&&ENEMIES[e.type].demon&&distance(e,source)<270)e.auraBonus=Math.max(e.auraBonus,ENEMIES[source.type].aura);
    for(const target of [...this.units,...this.enemies,...this.buildings]){
      target.cooldown=Math.max(0,(target.cooldown||0)-dt);
      if(target.burn){const source=this.enemies.find(e=>e.id===target.burn.sourceId)||{type:'infernalarcher'};this.damageEntity(source,target,target.burn.dps*dt,{area:true,burn:true});target.burn.remaining-=dt;if(target.burn.remaining<=0)target.burn=null;}
    }
  },
  friendlyTarget(source,range){
    let best=null,score=Infinity;
    for(const e of this.enemyGrid.near(source,range)){
      if(!this.canDamage(source,e))continue;
      const value=distance(source,e)-(ENEMIES[e.type].taunt?Math.min(130,range*.4):0);
      if(value<score){score=value;best=e;}
    }return best;
  },
  enemyTarget(e){
    const d=ENEMIES[e.type];
    if(d.hunt==='keep'||e.type==='demonlord'&&e.phase===2)return this.keep;
    let structure=null,structureScore=Infinity;
    for(const b of this.buildings){
      if(b.hp<=0||b.type==='road')continue;
      let score=distance(e,b)-(b.type==='keep'?60:0);
      if(d.hunt==='walls'&&['wall','palisade','gate'].includes(b.type))score-=400;
      if(d.hunt==='rear'&&['farm','house','warehouse','range'].includes(b.type))score-=350;
      if(score<structureScore){structureScore=score;structure=b;}
    }
    if(d.hunt==='walls'||d.hunt==='rear')return structure;
    let soldier=null,score=Infinity;
    const candidates=d.hunt==='ranged'?this.units:this.playerGrid.near(e,Math.max(260,d.range+60));
    for(const u of candidates){
      if(u.hp<=0||!this.canDamage(e,u))continue;
      const dist=distance(e,u),value=dist-(d.hunt==='ranged'&&UNITS[u.type].range>85?500:0)-(u.id===e.lastAttacker&&this.time-e.lastHitTime<3?60:0);
      if(value<score){score=value;soldier=u;}
    }
    if(soldier&&(d.hunt==='ranged'||distance(e,soldier)<Math.max(d.range+65,structure?distance(e,structure)+15:260)))return soldier;
    return structure||soldier;
  },
  tryLeap(e,target){
    if(!ENEMIES[e.type].leap||(e.leapUntil||0)>this.time)return false;
    const dx=Math.sign(target.x-e.x),dy=Math.sign(target.y-e.y),tile=this.world.at(e.x,e.y);
    if(!tile)return false;
    for(const [sx,sy]of Math.abs(target.x-e.x)>Math.abs(target.y-e.y)?[[dx,0],[0,dy]]:[[0,dy],[dx,0]]){
      if(!sx&&!sy)continue;const wall=this.world.buildingAt(this.buildings,tile.x+sx,tile.y+sy),landing=this.world.tile(tile.x+sx*2,tile.y+sy*2);
      if(!wall||!['wall','palisade','gate'].includes(wall.type)||!this.world.walkable(landing)||this.world.buildingAt(this.buildings,landing.x,landing.y))continue;
      const fromX=e.x,fromY=e.y;e.x=(landing.x+.5)*TILE;e.y=(landing.y+.5)*TILE;e.path=[];e.leapUntil=this.time+2.5;
      this.effects.push({x:fromX,y:fromY,tx:e.x,ty:e.y,kind:'arrow',life:.3,max:.3});return true;
    }return false;
  },
  fight(dt){
    this.updateCombatStatus(dt);this.enemyGrid=new CombatGrid(this.enemies);this.playerGrid=new CombatGrid(this.units);
    for(const b of this.buildings){if(!b.complete||b.hp<=0||!BUILDINGS[b.type].damage)continue;const e=this.friendlyTarget(b,this.towerRange(b));if(e)this.hit(b,e,dt);}
    for(const u of this.units){
      if(u.hp<=0||u.type==='worker')continue;if(this.updateGarrison(u,dt))continue;
      const range=this.unitRange(u),target=this.friendlyTarget(u,range+(u.stance==='hold'?0:140));
      if(u.target&&u.stance==='move'){if(this.move(u,u.target,dt)){u.target=null;u.stance='defend';}continue;}
      if(target&&distance(u,target)<=range)this.hit(u,target,dt);
      else if(target&&!u.garrison&&u.stance!=='hold')this.move(u,target,dt);
      else if(u.target){if(this.move(u,u.target,dt)){if(u.stance==='patrol'&&u.patrolOrigin){const old=u.target;u.target=u.patrolOrigin;u.patrolOrigin=old;}else{u.target=null;u.stance='defend';}}}
    }
    for(const e of [...this.enemies]){
      if(e.hp<=0)continue;const d=ENEMIES[e.type];e.decisionClock=(e.decisionClock||0)-dt;
      let target=this.units.find(u=>u.id===e.targetId&&u.hp>0)||this.buildings.find(b=>b.id===e.targetId&&b.hp>0);
      if(!target||!this.canDamage(e,target)||e.decisionClock<=0){target=this.enemyTarget(e);e.targetId=target?.id;e.decisionClock=.25;}
      if(this.bossAbilities(e,dt,target)||!target)continue;
      if(this.tryLeap(e,target))continue;
      const reach=d.range+(target.tx!=null?BUILDINGS[target.type].size*TILE*.5:0);
      if(distance(e,target)<=reach)this.hit(e,target,dt);else this.move(e,target,dt,true);
    }
  }
};
