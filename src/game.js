import {BUILDINGS,UNITS,ENEMIES,TILE,COLS,ROWS,waveComposition} from './data.js';
import {World,distance,clamp} from './world.js';
export class Game {
 constructor(seed=Date.now(),difficulty='normal',savedTiles=null){
  this.world=new World(seed,savedTiles);this.difficulty=difficulty;this.resources={wood:250,stone:150,food:150,iron:0,gold:100};if(difficulty==='easy')for(const k in this.resources)this.resources[k]*=1.5;
  this.buildings=[];this.units=[];this.enemies=[];this.ships=[];this.effects=[];this.id=0;this.wave=0;this.timer=180;this.active=false;this.speed=1;this.paused=false;this.over=false;this.victory=false;this.endless=false;this.time=0;this.tech=0;this.selected=[];this.revision=0;this.stats={kills:0,built:0,lost:0,gathered:0};this.notice=()=>{};this.sound=()=>{};this.autosave=()=>{};this.saveClock=0;
  this.addBuilding('keep',31,27,true);for(let i=0;i<5;i++)this.addUnit('worker',1260+i*22,1240);
 }
 get keep(){return this.buildings.find(b=>b.type==='keep');}
 get level(){return this.keep?.level||1;}
 get capacity(){return this.buildings.filter(b=>b.complete&&b.hp>0).reduce((n,b)=>n+(BUILDINGS[b.type].pop||0)*b.level,0);}
 get storage(){return 700+this.buildings.filter(b=>b.type==='warehouse'&&b.complete).length*600;}
 afford(cost){return Object.entries(cost).every(([r,n])=>this.resources[r]>=n);}
 spend(cost){if(!this.afford(cost))return false;for(const [r,n]of Object.entries(cost))this.resources[r]-=n;return true;}
 addBuilding(type,tx,ty,complete=false){const d=BUILDINGS[type],b={id:++this.id,type,tx,ty,x:(tx+d.size/2)*TILE,y:(ty+d.size/2)*TILE,hp:d.hp,maxHp:d.hp,progress:complete?d.time:0,complete,level:1,cooldown:0};this.buildings.push(b);this.revision++;return b;}
 place(type,tx,ty){const d=BUILDINGS[type];if(this.over||!d||type==='keep')return false;if((d.level||1)>this.level){this.notice(`Requires Keep level ${d.level}.`);return false;}const reason=this.world.placementReason(type,tx,ty,this.buildings);if(reason){this.notice(reason);return false;}if(!this.spend(d.cost)){this.notice('You need more resources.');return false;}
  const b=this.addBuilding(type,tx,ty);for(let y=ty;y<ty+d.size;y++)for(let x=tx;x<tx+d.size;x++){const t=this.world.tile(x,y);t.resource=null;t.amount=0;}const idle=this.units.filter(u=>u.type==='worker'&&!u.job).sort((a,c)=>distance(a,b)-distance(c,b));for(const u of idle.slice(0,2))this.assign(u,b,'build');this.stats.built++;this.notice(idle.length?`${d.name} planned. Workers are on their way.`:'Construction queued. Assign an idle worker.');this.sound('build');return b;
 }
 addUnit(type,x,y){const d=UNITS[type],u={id:++this.id,type,x,y,hp:d.hp,maxHp:d.hp,cooldown:0,job:null,path:[],pathRevision:-1,stance:'defend',kills:0};this.units.push(u);return u;}
 recruit(type){const d=UNITS[type];if(this.over||!d)return false;const b=this.buildings.find(b=>b.type===d.building&&b.complete&&b.hp>0);if(!b||(d.level||1)>this.level){this.notice(`Requires ${BUILDINGS[d.building].name}${d.level?` and Keep level ${d.level}`:''}.`);return false;}if(this.units.length>=this.capacity){this.notice('Build housing to increase population.');return false;}const pos=this.world.accessPoints(b,this.buildings)[0];if(!pos){this.notice('Clear an exit beside this building before recruiting.');return false;}if(!this.spend(d.cost)){this.notice('Not enough resources to recruit.');return false;}
  this.addUnit(type,pos.x,pos.y);this.notice(`${d.name} ready.`);return true;
 }
 assign(u,b,kind){if(!u||u.type!=='worker')return false;const resource=BUILDINGS[b.type].resource;if(kind==='gather'&&resource!=='food'&&!this.world.deposits(resource,b,u,this.buildings,this.revision).length){this.notice('No reachable deposits for this worker. Open a route or choose another mine.');return false;}u.job={building:b.id,kind,stage:'travel',clock:0,carry:0};u.path=[];u.target=null;return true;}
 assignWorker(b){if(!b)return;const d=BUILDINGS[b.type];const workers=this.units.filter(u=>u.job?.building===b.id);if(b.complete&&(!d.workers||workers.length>=d.workers)){this.notice('No available worker slots.');return;}const u=this.units.find(u=>u.type==='worker'&&!u.job);if(!u){this.notice('No idle workers. Train one at the Keep.');return;}if(this.assign(u,b,b.complete?'gather':'build'))this.notice('Worker assigned.');}
 removeWorker(b){const u=this.units.find(u=>u.job?.building===b.id);if(u){u.job=null;u.path=[];this.notice('Worker is now idle.');}}
 repair(b){if(!b||!b.complete||b.hp>=b.maxHp)return;const u=this.units.find(u=>u.type==='worker'&&!u.job);if(!u){this.notice('An idle worker is needed for repairs.');return;}const cost={wood:Math.ceil((b.maxHp-b.hp)/35),stone:Math.ceil((b.maxHp-b.hp)/60)};if(!this.spend(cost)){this.notice('Not enough wood and stone to repair.');return;}this.assign(u,b,'repair');this.notice('Worker assigned to repairs.');}
 demolish(b){if(!b||b.type==='keep')return;for(const [r,n]of Object.entries(BUILDINGS[b.type].cost))this.resources[r]=Math.min(this.storage,this.resources[r]+Math.floor(n*(b.complete?.3:.8)));b.hp=0;this.clean();this.notice('Site cleared. Some resources recovered.');}
 upgrade(b){if(!b||!b.complete||b.level>=5)return;const cost={wood:100*b.level,stone:100*b.level,gold:50*b.level};if(!this.spend(cost)){this.notice('Upgrade needs '+Object.entries(cost).map(([r,n])=>`${n} ${r}`).join(', ')+'.');return;}b.level++;b.maxHp+=BUILDINGS[b.type].hp*.4;b.hp=b.maxHp;this.notice(`${BUILDINGS[b.type].name} upgraded to level ${b.level}.`);}
 research(){if(!this.buildings.some(b=>b.type==='smith'&&b.complete)){this.notice('Build a Blacksmith first.');return;}if(this.tech>=5)return;if(!this.spend({iron:40*(this.tech+1),gold:50*(this.tech+1)})){this.notice('Research needs more iron and gold.');return;}this.tech++;this.notice('Weapons and armor improved.');}
 command(point,stance='move'){if(!this.world.walkable(this.world.at(point.x,point.y))){this.notice('Choose accessible land. Ground units cannot cross peaks or the sea.');return;}let i=0;for(const u of this.units.filter(u=>this.selected.includes(u.id))){const target={x:clamp(point.x+(i%4)*16,20,COLS*TILE-20),y:clamp(point.y+Math.floor(i/4)*16,20,ROWS*TILE-20)};if(!this.world.walkable(this.world.at(target.x,target.y)))Object.assign(target,point);const t=this.world.at(target.x,target.y);if(!this.world.reachable(u,this.buildings,this.revision).has(t.y*COLS+t.x))continue;u.job=null;u.target=target;u.path=[];u.pathRevision=-1;u.stance=stance;i++;}if(i)this.effects.push({x:point.x,y:point.y,kind:'command',life:1,max:1});else this.notice('No selected unit can reach that destination.');}
 move(u,target,dt,enemy=false){const flying=!!ENEMIES[u.type]?.flying;if(!flying&&!this.world.walkable(this.world.at(target.x,target.y)))return false;if(distance(u,target)<8)return true;const key=`${Math.floor(target.x/TILE)},${Math.floor(target.y/TILE)}`;
  if(!u.path?.length||u.pathRevision!==this.revision||u.pathGoal!==key){u.path=this.world.path(u,target,this.buildings,{enemy,flying:ENEMIES[u.type]?.flying});u.pathRevision=this.revision;u.pathGoal=key;}
  if(!u.path.length)return this.world.at(u.x,u.y)===this.world.at(target.x,target.y);
  const p=u.path[0],block=this.world.buildingAt(this.buildings,Math.floor(p.x/TILE),Math.floor(p.y/TILE));
  if(block&&block.type!=='road'&&(enemy||block.type!=='gate')&&!ENEMIES[u.type]?.flying){if(enemy)this.hit(u,block,dt);else u.path=[];return false;}
  const d=enemy?ENEMIES[u.type]:UNITS[u.type],onRoad=this.world.buildingAt(this.buildings,Math.floor(u.x/TILE),Math.floor(u.y/TILE))?.type==='road';const len=distance(u,p),step=Math.min(len,d.speed*dt*(onRoad?1.3:1)*(!enemy&&this.resources.food<=0?.65:1));const dx=(p.x-u.x)/Math.max(.001,len)*step,dy=(p.y-u.y)/Math.max(.001,len)*step;u.facing=Math.atan2(dy,dx);u.x+=dx;u.y+=dy;if(len<=step+.1)u.path.shift();return !u.path.length&&distance(u,target)<TILE*.5;
 }
 worker(u,dt){const job=u.job;if(!job){if(u.target&&this.move(u,u.target,dt))u.target=null;return;}const b=this.buildings.find(b=>b.id===job.building&&b.hp>0);if(!b){u.job=null;return;}
  if(job.kind==='build'||job.kind==='repair'){
   const goal=this.accessiblePoint(u,b);if(!goal||!this.move(u,goal,dt))return;
   if(job.kind==='build'){b.progress+=dt;if(b.progress>=BUILDINGS[b.type].time){b.complete=true;this.notice(`${BUILDINGS[b.type].name} completed.`);this.sound('build');for(const w of this.units.filter(w=>w.job?.building===b.id)){w.job=BUILDINGS[b.type].resource?{building:b.id,kind:'gather',stage:'travel',clock:0,carry:0}:null;}}}
   else{b.hp=Math.min(b.maxHp,b.hp+35*dt);if(b.hp>=b.maxHp)u.job=null;}return;
  }
  const resource=BUILDINGS[b.type].resource;
  if(job.stage==='return'){
   const points=this.buildings.filter(b=>b.complete&&(b.type==='keep'||b.type==='warehouse')).map(b=>this.accessiblePoint(u,b)).filter(Boolean).sort((a,b)=>distance(u,a)-distance(u,b));const point=points[0];if(!point){this.workerWarning(job,'No reachable storage. Open a route to the Keep or a Warehouse.');return;}
   if(this.move(u,point,dt)){const amount=Math.min(job.carry,this.storage-this.resources[resource]);this.resources[resource]+=amount;this.stats.gathered+=amount;job.carry=0;job.stage='travel';job.warning=null;}return;
  }
  let tile=job.tile!=null?this.world.tiles[job.tile]:null;if(resource!=='food'&&(!tile||tile.resource!==resource||tile.amount<=0||job.navRevision!==this.revision)){
   tile=this.world.deposits(resource,b,u,this.buildings,this.revision)[0];if(!tile){if(job.carry>0){job.stage='return';return;}this.workerWarning(job,`No reachable ${resource} remains near ${BUILDINGS[b.type].name}.`);return;}job.tile=tile.y*COLS+tile.x;job.navRevision=this.revision;job.warning=null;
  }
  const point=resource==='food'?this.accessiblePoint(u,b):{x:(tile.x+.5)*TILE,y:(tile.y+.5)*TILE};if(!point||!this.move(u,point,dt))return;job.clock+=dt;
  if(job.clock>=1.4){job.clock=0;const amount=Math.min(4*b.level,resource==='food'?Infinity:tile.amount);job.carry+=amount;if(tile){tile.amount-=amount;if(tile.amount<=0){tile.resource=null;this.revision++;}}if(job.carry>=16){job.stage='return';u.path=[];}this.effects.push({x:u.x,y:u.y-8,kind:'gather',life:.4,max:.4});}
 }
 accessiblePoint(u,b){const reachable=this.world.reachable(u,this.buildings,this.revision);return this.world.accessPoints(b,this.buildings).filter(p=>reachable.has(Math.floor(p.y/TILE)*COLS+Math.floor(p.x/TILE))).sort((a,c)=>distance(u,a)-distance(u,c))[0];}
 workerWarning(job,message){if(job.warning!==message){job.warning=message;this.notice(message);}}
 startWave(){if(this.active||this.over)return false;this.wave++;this.active=true;this.timer=0;const types=waveComposition(this.wave),lanes=this.wave<15?[18]:this.wave<30?[16,46]:[10,32,53];
  for(let i=0;i<types.length;i+=8){const x=lanes[(i/8)%lanes.length]*TILE;let y=0;while(this.world.at(x,y)?.type==='water')y+=TILE;this.ships.push({x,y:-80-(i/8)*90,targetY:y+10,units:types.slice(i,i+8),landed:false});}
  this.notice(`Wave ${this.wave}: sails on the horizon!`);this.sound('wave');return true;
 }
 spawnEnemy(type,x,y){const d=ENEMIES[type],factor=this.difficulty==='easy'?.75:this.difficulty==='hard'?1.25:1;const e={id:++this.id,type,x,y,hp:d.hp*factor,maxHp:d.hp*factor,cooldown:0,abilityClock:7,path:[],pathRevision:-1};this.enemies.push(e);return e;}
 hit(source,target,dt){if(source.cooldown>0||target.hp<=0)return;const d=ENEMIES[source.type]||UNITS[source.type]||BUILDINGS[source.type];const friendly=!ENEMIES[source.type],armor=(ENEMIES[target.type]?.armor||UNITS[target.type]?.armor||0)+(friendly?0:this.tech);
  const damage=Math.max(1,(d.damage||10)*(friendly?1+this.tech*.15:1)*(source.level||1)-armor);target.hp-=damage;source.cooldown=source.type==='ballista'?1.8:1;this.effects.push({x:source.x,y:source.y,tx:target.x,ty:target.y,kind:d.range>85?'arrow':'hit',life:.25,max:.25});if(target.hp<=0&&ENEMIES[target.type]&&friendly)source.kills=(source.kills||0)+1;
 }
 fight(dt){for(const b of this.buildings){b.cooldown=Math.max(0,b.cooldown-dt);const d=BUILDINGS[b.type];if(!b.complete||!d.damage)continue;const e=this.enemies.find(e=>e.hp>0&&distance(b,e)<d.range);if(e)this.hit(b,e,dt);}
  for(const u of this.units){u.cooldown=Math.max(0,u.cooldown-dt);if(u.type==='worker')continue;const d=UNITS[u.type];const target=this.enemies.filter(e=>e.hp>0&&(!ENEMIES[e.type].flying||d.range>85)).sort((a,b)=>distance(u,a)-distance(u,b))[0];
   if(target&&distance(u,target)<=d.range)this.hit(u,target,dt);else if(u.target){if(this.move(u,u.target,dt)){if(u.stance==='patrol'&&u.patrolOrigin){const old=u.target;u.target=u.patrolOrigin;u.patrolOrigin=old;}else{u.target=null;u.stance='defend';}}}else if(target&&u.stance!=='hold'&&distance(u,target)<d.range+140)this.move(u,target,dt);
  }
  for(const e of [...this.enemies]){if(e.hp<=0)continue;e.cooldown=Math.max(0,e.cooldown-dt);const d=ENEMIES[e.type];let target;
   if(!d.siege)target=this.units.filter(u=>u.hp>0&&distance(e,u)<Math.max(150,d.range)).sort((a,b)=>distance(e,a)-distance(e,b))[0];
   if(!target)target=this.buildings.filter(b=>b.hp>0&&b.type!=='road').sort((a,b)=>(distance(e,a)-(a.type==='keep'?70:0))-(distance(e,b)-(b.type==='keep'?70:0)))[0];if(!target)continue;
   const reach=d.range+(target.tx!=null?BUILDINGS[target.type].size*TILE*.5:0);if(distance(e,target)<=reach)this.hit(e,target,dt);else this.move(e,target,dt,true);
   if(d.boss){e.abilityClock-=dt;if(e.abilityClock<=0){e.abilityClock=10;if(d.ability==='rally'){for(const ally of this.enemies)if(distance(e,ally)<220)ally.hp=Math.min(ally.maxHp,ally.hp+35);}else if(d.ability==='reinforce'){for(let i=0;i<3;i++)this.spawnEnemy('elite',e.x+i*12,e.y);}else{for(const t of [...this.units,...this.buildings])if(distance(e,t)<(d.ability==='fire'?230:130))t.hp-=d.damage*.7;this.effects.push({x:e.x,y:e.y,kind:d.ability,life:.8,max:.8});}}}
  }
 }
 clean(){for(const e of this.enemies.filter(e=>e.hp<=0)){this.stats.kills++;this.resources.gold=Math.min(this.storage,this.resources.gold+(ENEMIES[e.type].boss?80:2));this.effects.push({x:e.x,y:e.y,kind:'death',life:.7,max:.7});if(e.type==='dragon'){this.spawnEnemy('conqueror',e.x,e.y);this.notice('The dragon falls. The Conqueror rises!');this.sound('wave');}}
  const destroyed=this.buildings.filter(b=>b.hp<=0);if(destroyed.some(b=>b.type==='keep')){this.over=true;this.victory=false;this.notice('The Keep has fallen.');}
  if(destroyed.length)this.revision++;this.stats.lost+=this.units.filter(u=>u.hp<=0).length;this.buildings=this.buildings.filter(b=>b.hp>0);this.units=this.units.filter(u=>u.hp>0);this.enemies=this.enemies.filter(e=>e.hp>0);
 }
 update(dt){if(this.paused||this.over)return;dt=Math.min(dt,.1)*this.speed;this.time+=dt;this.resources.food=Math.max(0,this.resources.food-this.units.length*.015*dt);for(const u of this.units)if(u.type==='worker')this.worker(u,dt);
  for(const s of this.ships){if(!s.landed){s.y+=32*dt;if(s.y>=s.targetY){s.landed=true;for(let i=0;i<s.units.length;i++)this.spawnEnemy(s.units[i],s.x+(i%4)*10,s.targetY+20+Math.floor(i/4)*10);s.depart=9;}}else{s.depart-=dt;if(s.depart<5)s.y-=30*dt;}}
  this.ships=this.ships.filter(s=>!s.landed||s.depart>0);this.fight(dt);this.clean();for(const fx of this.effects)fx.life-=dt;this.effects=this.effects.filter(fx=>fx.life>0).slice(-250);
  if(this.over)return;if(this.active&&!this.enemies.length&&!this.ships.some(s=>!s.landed)){this.active=false;this.timer=100;this.notice(`Wave ${this.wave} survived. Repair and prepare.`);if(this.wave===50&&!this.endless){this.over=true;this.victory=true;}this.autosave();}
  if(!this.active){this.timer-=dt;if(this.timer<=0)this.startWave();}this.saveClock+=dt;if(this.saveClock>=30){this.saveClock=0;this.autosave();}
 }
 serialize(){return {version:1,seed:this.world.seed,tiles:this.world.tiles,resources:this.resources,buildings:this.buildings,units:this.units,enemies:this.enemies,ships:this.ships,id:this.id,wave:this.wave,timer:this.timer,active:this.active,time:this.time,tech:this.tech,stats:this.stats,over:this.over,victory:this.victory,endless:this.endless,difficulty:this.difficulty};}
 static restore(data){if(data?.version!==1||!Array.isArray(data.tiles)||data.tiles.length!==COLS*ROWS||!Array.isArray(data.buildings)||!Array.isArray(data.units)||!Array.isArray(data.enemies)||!Array.isArray(data.ships)||!data.resources)throw Error('Invalid save');for(const r of ['wood','stone','food','iron','gold'])if(!Number.isFinite(data.resources[r])||data.resources[r]<0)throw Error('Invalid resources');for(const b of data.buildings)if(!BUILDINGS[b.type]||!Number.isFinite(b.hp)||!Number.isFinite(b.x)||!Number.isFinite(b.y))throw Error('Invalid building');for(const u of data.units)if(!UNITS[u.type])throw Error('Invalid unit');for(const e of data.enemies)if(!ENEMIES[e.type])throw Error('Invalid enemy');const g=new Game(data.seed,data.difficulty,data.tiles);for(const key of ['resources','buildings','units','enemies','ships','id','wave','timer','active','time','tech','stats','over','victory','endless'])g[key]=data[key];g.world.tiles=data.tiles;return g;}
}
