import {BUILDINGS,UNITS} from './data.js';
import {distance} from './world.js';
export const Support={
 get temple(){return this.buildings.find(b=>b.type==='temple'&&b.complete&&b.hp>0);},
 get clericCap(){return (this.temple?.level||0)*2;},
 raiseBuildingLevel(b,level){if(!b||b.level>=level)return;const gain=BUILDINGS[b.type].hp*.4*(level-b.level);b.level=level;b.maxHp+=gain;b.hp=Math.min(b.maxHp,b.hp+gain);},
 heal(source,target,amount){if(target.hp<=0||target.hp>=target.maxHp)return;const gain=Math.min(amount,target.maxHp-target.hp);target.hp+=gain;if(gain>0&&this.effects.length<220)this.effects.push({kind:'heal',x:target.x,y:target.y,life:.65,max:.65});},
 updateSupport(dt){
  for(const u of this.units){u.clericBuff=0;u.clericArmor=0;}
  const temple=this.temple;if(temple){temple.healClock=(temple.healClock||0)-dt;if(temple.healClock<=0){temple.healClock=1;for(const u of this.units)if(distance(u,temple)<=240)this.heal(temple,u,3);}}
  const strength=1+this.researchBonus('healing'),blessing=this.researchBonus('blessing');
  for(const c of this.units.filter(u=>u.hp>0&&u.type==='cleric')){
   const nearby=this.units.filter(u=>u.hp>0&&distance(u,c)<=UNITS.cleric.range);
   for(const u of nearby){u.clericBuff=Math.max(u.clericBuff,blessing*.05);u.clericArmor=Math.max(u.clericArmor,blessing);}
   c.healClock=(c.healClock||0)-dt;c.massHealClock=Math.max(0,(c.massHealClock??12)-dt);
   const wounded=nearby.filter(u=>u.hp<u.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
   if(c.healClock<=0){c.healClock=1;for(const u of wounded.slice(0,3))this.heal(c,u,8*strength);}
   if(this.researched.includes('massheal')&&c.massHealClock<=0&&wounded.length){for(const u of wounded)this.heal(c,u,20*strength);c.massHealClock=12;this.effects.push({kind:'rally',x:c.x,y:c.y,radius:UNITS.cleric.range,life:1,max:1});}
  }
 }
};
