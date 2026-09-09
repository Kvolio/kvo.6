import {ENEMIES,TILE,nightmareComposition} from './data.js';
import {random,distance} from './world.js';

export const Nightmare={
  campaignLength(){return this.difficulty==='nightmare'?60:50;},
  breakSeal(){
    if(this.difficulty!=='nightmare'||this.sealBroken)return;
    this.sealBroken=true;this.sealTime=this.time;this.notice('The Conqueror falls. The seal breaks. Ten demon invasions remain.');this.sound('seal');
    const sites=this.portalSites();for(let i=0;i<3&&sites.length;i++){const p=sites[Math.floor(i*sites.length/3)];this.openPortal(p,[],{delay:0,linger:8});}
  },
  portalSites(){
    return this.world.tiles.filter(t=>this.world.walkable(t)&&this.world.neighbors(t.y*this.world.cols+t.x).some(id=>this.world.tiles[id].type==='water')).map(t=>({x:(t.x+.5)*TILE,y:(t.y+.5)*TILE}));
  },
  openPortal(point,queue,options={}){
    const p={id:++this.id,x:point.x,y:point.y,queue:[...queue],delay:options.delay??2,clock:0,interval:options.interval??.6,linger:options.linger??4,big:queue.includes('demonlord'),ward:options.ward||null};
    this.portals.push(p);this.sound('portal');return p;
  },
  startDemonWave(){
    const sites=this.portalSites();if(!sites.length){this.notice('The demons are searching for an open coastal rift.');return false;}
    this.wave++;this.active=true;this.timer=0;const types=nightmareComposition(this.wave),rng=random(this.world.seed+this.wave*104729+this.id);
    const portals=Math.min(6,3+Math.floor((this.wave-51)/3)),queues=Array.from({length:portals},()=>[]);
    const boss=types.find(type=>ENEMIES[type].boss);
    types.filter(type=>!ENEMIES[type].boss).forEach((type,i)=>queues[i%portals].push(type));
    for(let i=0;i<portals;i++)this.openPortal(sites[Math.floor(rng()*sites.length)],queues[i],{delay:2+i*.6});
    if(boss)this.openPortal(sites[Math.floor(rng()*sites.length)],[boss],{delay:6,linger:10});
    this.notice(`Wave ${this.wave} / 60: ${boss?ENEMIES[boss].name+' approaches.':'Demon portals open along the island.'}`);this.sound('wave');return true;
  },
  nearestOpenLand(point,maxDistance=Infinity){
    let best=null,bestDistance=maxDistance;
    for(const t of this.world.tiles){const p={x:(t.x+.5)*TILE,y:(t.y+.5)*TILE},d=distance(point,p);if(d>=bestDistance||!this.world.walkable(t)||this.world.buildingAt(this.buildings,t.x,t.y))continue;best=p;bestDistance=d;}
    return best;
  },
  summonNear(source,types,ward=false){
    const result=[];for(let i=0;i<types.length;i++){
      if(this.enemies.length>=350)break;
      const angle=i*Math.PI*2/types.length+this.time,point=this.nearestOpenLand({x:source.x+Math.cos(angle)*55,y:source.y+Math.sin(angle)*55},200);
      if(point){const e=this.spawnEnemy(types[i],point.x,point.y);if(ward)e.wardFor=source.id;result.push(e);}
    }return result;
  },
  telegraph(source,kind,point,radius,delay,damage,options={}){
    const hazard={id:++this.id,sourceId:source.id,kind,x:point.x,y:point.y,radius,remaining:delay,duration:delay,damage,...options};
    this.hazards.push(hazard);source.casting=kind;source.castUntil=this.time+delay;this.sound('warning');return hazard;
  },
  beginDemonLordPhase(e){
    if(e.phase)return;e.phase='healing';e.healRemaining=5;e.hp=Math.max(1,e.hp);e.path=[];
    this.notice('Obsidian rebirth! The Demon Lord heals for five seconds. Spread your defenders.');this.sound('boss');
    this.telegraph(e,'rebirth',e,200,5,90,{burn:4});
  },
  updateNightmare(dt){
    for(const p of this.portals){
      p.delay-=dt;if(p.delay>0)continue;
      if(p.queue.length){p.clock-=dt;if(p.clock<=0&&this.enemies.length<350){
        let point=this.nearestOpenLand(p,200);
        if(!point){
          // A fully fortified shore must not stall the campaign. The visible
          // rift erodes the closest barricade before admitting ground troops.
          p.breachClock=(p.breachClock||0)-dt;if(p.breachClock<=0){p.breachClock=1.5;const block=this.buildings.filter(b=>b.hp>0&&distance(b,p)<240).sort((a,b)=>distance(a,p)-distance(b,p))[0];if(block){block.hp-=120;this.effects.push({x:block.x,y:block.y,kind:'fire',life:.5,max:.5});this.sound('impact');}}
          continue;
        }
        const type=p.queue.shift(),e=this.spawnEnemy(type,point.x,point.y);if(p.ward)e.wardFor=p.ward;p.clock=p.interval;
      }}else p.linger-=dt;
    }
    this.portals=this.portals.filter(p=>p.queue.length||p.delay>0||p.linger>0);
    for(const h of this.hazards){
      h.remaining-=dt;if(h.remaining>0)continue;
      const source=this.enemies.find(e=>e.id===h.sourceId),targets=[...this.units,...this.buildings];
      for(const t of targets)if(t.hp>0&&distance(t,h)<h.radius&&(!h.inner||distance(t,h)>h.inner)){
        this.damageEntity(source||{type:'demonlord',id:h.sourceId},t,h.damage,{area:true});if(h.burn)this.ignite(t,h.burn,source?.id);
      }
      if(h.kind==='dive'&&source){const land=this.nearestOpenLand(h,100);if(land){Object.assign(source,land);this.setAirborne(source,false);source.groundedUntil=this.time+5;}}
      if(h.spawn){const land=this.nearestOpenLand(h,150);if(land)this.spawnEnemy(h.spawn,land.x,land.y);}
      this.effects.push({x:h.x,y:h.y,kind:'blast',radius:h.radius,life:.8,max:.8});this.sound('impact');
    }
    this.hazards=this.hazards.filter(h=>h.remaining>0);
  },
  bossAbilities(e,dt,target){
    const d=ENEMIES[e.type];if(e.type==='demonlord'&&e.hp<=e.maxHp*.5&&!e.phase)this.beginDemonLordPhase(e);
    if(e.phase==='healing'){
      e.healRemaining-=dt;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.08*dt);
      if(e.healRemaining<=0){e.phase=2;e.abilityClock=0;this.notice('The Demon Lord charges the Keep! Reinforce the heart of your kingdom.');this.sound('boss');}
      return true;
    }
    if(e.groundedUntil&&this.time>=e.groundedUntil){this.setAirborne(e,true);e.groundedUntil=null;}
    if(!d.ability)return false;
    e.abilityClock-=dt;if(e.abilityClock>0||!target||distance(e,target)>650)return false;
    e.abilityClock=e.phase===2?3.5:d.abilityInterval||8;const step=e.abilityStep||0;e.abilityStep=step+1;
    if(d.ability==='archdemon'){
      if(step%4===0){const sites=this.portalSites(),rng=random(this.world.seed+e.id+step);if(sites.length)this.openPortal(sites[Math.floor(rng()*sites.length)],['skeleton','hellhound','demonwarrior','infernalarcher','skeleton'],{delay:2});this.notice('The ArchDemon tears open another portal.');}
      if(step%4===1){this.telegraph(e,'dive',target,115,2.5,155,{burn:5});this.notice('Descending blade! Leave the marked ground. The ArchDemon will be vulnerable to melee after landing.');}
      if(step%4===2){e.wardUntil=this.time+10;this.summonNear(e,['dreadguard','demonwarrior'],true);this.notice('Portal ward! Defeat the marked guardians to break the ArchDemon’s shield.');}
      if(step%4===3){for(const [dx,dy]of [[0,0],[135,0],[-135,0],[0,135],[0,-135]])this.telegraph(e,'flamecross',{x:target.x+dx,y:target.y+dy},70,2.2,130,{burn:5});this.notice('Hellfire cross! Move between the marked circles.');}
    }else if(d.ability==='demonlord'){
      this.summonNear(e,e.phase===2?['hellhound','demonknight','skeleton','skeleton','demonwarrior']:['skeleton','demonwarrior','hellhound']);
      if(step%3===0){const b=this.buildings.filter(b=>b.hp>0&&b.type!=='road').sort((a,b)=>distance(e,b)-distance(e,a))[0];if(b){const h=this.telegraph(e,'hurl',b,85,2,130,{spawn:'demonwarrior'});h.fromX=e.x;h.fromY=e.y;this.notice('The Demon Lord hurls a warrior into your rear defenses!');}}
      if(step%3===1){const targets=this.units.filter(u=>u.type!=='worker').slice().sort((a,b)=>distance(e,a)-distance(e,b));for(const t of [target,...targets.filter((_,i)=>i%8===0).slice(0,2)])this.telegraph(e,'eruption',t,105,2.8,180,{burn:6});this.notice('Hellfire eruptions! Split your army and leave the marked circles.');}
      if(step%3===2){this.telegraph(e,'doomring',e,245,2.5,120,{inner:90,burn:4});this.notice('Ring of ruin! Get close to the Demon Lord or retreat beyond the ring.');}
    }else if(d.ability==='summon')this.summonNear(e,['skeleton','skeleton','hellhound']);
    else if(d.ability==='rally'){
      for(const ally of this.enemies)if(distance(e,ally)<260){ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.07);ally.rallyUntil=this.time+6;}
      this.effects.push({x:e.x,y:e.y,kind:'rally',radius:260,life:1,max:1});this.sound('boss');
    }else if(d.ability==='reinforce')this.summonNear(e,['elite','elite','bow','berserker']);
    else if(d.ability==='fire'){
      const angle=Math.atan2(target.y-e.y,target.x-e.x);for(let i=1;i<=3;i++)this.telegraph(e,'dragonfire',{x:e.x+Math.cos(angle)*i*90,y:e.y+Math.sin(angle)*i*90},80,1.8,d.damage*.9,{burn:5});
    }else this.telegraph(e,'quake',d.range>100?target:e,d.range>100?100:145,1.6,d.damage*1.1);
    if(this.difficulty==='nightmare'&&d.boss&&!d.demon&&step%2===1)this.nightmareBossAbility(e,target);
    return false;
  },
  nightmareBossAbility(e,target){
    const d=ENEMIES[e.type],damage=d.damage*.9;
    switch(e.type){
      case 'captain':this.summonNear(e,['raider','raider','bow']);this.notice('Captain’s reserve! Reinforcements rally around the banner.');break;
      case 'chief':this.telegraph(e,'axe sweep',target,115,2,damage);e.rageUntil=this.time+6;this.notice('The Chief enters a frenzy. Evade the axe sweep.');break;
      case 'brute':case 'champion':this.telegraph(e,'boulder',target,95,2.4,damage*1.3);if(e.type==='champion')e.rageUntil=this.time+6;break;
      case 'giant':{const angle=Math.atan2(target.y-e.y,target.x-e.x);for(let i=1;i<=3;i++)this.telegraph(e,'rolling stone',{x:e.x+Math.cos(angle)*i*100,y:e.y+Math.sin(angle)*i*100},65,1.8+i*.35,damage);break;}
      case 'titan':for(let i=1;i<=3;i++)this.telegraph(e,'aftershock',e,120+i*70,1.5+i*.6,damage*.75,{inner:55+(i-1)*70});this.notice('Titan aftershocks! Retreat beyond the rings or stay close.');break;
      case 'blackknight':e.wardUntil=this.time+9;this.summonNear(e,['elite','elite'],true);this.notice('The Black Knight’s oathguard protects him. Defeat the marked guards.');break;
      case 'warlord':this.summonNear(e,['bow','berserker']);for(const u of this.units.filter(u=>u.type!=='worker').slice(0,2))this.telegraph(e,'arrow storm',u,85,2.4,damage);break;
      case 'dragonknight':this.telegraph(e,'cinder ring',target,165,2.4,damage,{inner:65,burn:5});break;
      case 'dragon':this.telegraph(e,'wing tempest',e,240,2.8,damage,{inner:85});this.notice('Wing tempest! Evacuate the marked ring.');break;
      case 'conqueror':for(const u of [target,...this.units.filter(u=>u.type!=='worker').slice(0,2)])this.telegraph(e,'royal reckoning',u,95,2.6,damage*1.2);this.notice('Royal reckoning! Split your defenders before the strikes land.');break;
    }
  }
};
