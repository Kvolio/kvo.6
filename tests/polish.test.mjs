import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {BOSSES,TILE,nightmareComposition} from '../src/data.js';
import {AudioManager} from '../src/audio.js';

test('full storage preserves cargo, partial delivery and saved loads',()=>{
  const g=new Game(42),u=g.units[0],farm=g.addBuilding('farm',35,30,true);g.assign(u,farm,'gather');
  u.job.stage='return';u.job.carry=16;g.resources.food=g.storage-5;const point=g.accessiblePoint(u,g.keep);Object.assign(u,point);g.worker(u,.1);
  assert.equal(g.resources.food,g.storage);assert.equal(u.job.carry,11);assert.equal(u.job.stage,'return');
  const saved=Game.restore(JSON.parse(JSON.stringify(g.serialize()))),worker=saved.units.find(w=>w.id===u.id);saved.resources.food-=20;saved.worker(worker,.1);
  assert.equal(worker.job.carry,0);assert.equal(saved.resources.food,saved.storage-9);
  g.resources.food=g.storage+100;const before=g.stats.gathered;g.worker(u,.1);assert.equal(u.job.carry,11);assert.equal(g.stats.gathered,before);
});
test('enemy routes use an open pass toward an occupied Keep instead of breaking a closer wall',()=>{
  const g=new Game(4);for(const t of g.world.tiles)Object.assign(t,{type:t.y<3?'water':'grass',resource:null,amount:0});g.buildings=[];
  const keep=g.addBuilding('keep',35,26,true);for(let y=3;y<g.world.rows;y++)if(y!==20)g.addBuilding('wall',30,y,true);
  const path=g.world.path({x:28.5*TILE,y:28.5*TILE},keep,g.buildings,{enemy:true});assert.ok(path.length);assert.ok(path.some(p=>p.x===30.5*TILE&&p.y===20.5*TILE));
  assert.ok(path.every(p=>{const b=g.world.buildingAt(g.buildings,Math.floor(p.x/TILE),Math.floor(p.y/TILE));return !b||b===keep;}));
});
test('every pre-seal Nightmare boss receives an additional ability',()=>{
  for(const type of [...Object.values(BOSSES),'conqueror']){
    const g=new Game(12,'nightmare');for(const t of g.world.tiles)if(t.type!=='water')Object.assign(t,{type:'grass',resource:null,amount:0});const e=g.spawnEnemy(type,g.keep.x+200,g.keep.y);g.addUnit('archer',g.keep.x+100,g.keep.y+60);
    g.nightmareBossAbility(e,g.keep);assert.ok(g.hazards.length||g.enemies.length>1||e.wardUntil||e.rageUntil,type);
    for(const h of g.hazards)assert.ok(h.duration>=1.5,'abilities leave time to react');
  }
});
test('shared routes preserve independent movement and invalidate on construction or terrain changes',()=>{
  const g=new Game(10);for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.buildings=[];g.revision++;
  const from={x:20.5*TILE,y:20.5*TILE},to={x:24.5*TILE,y:20.5*TILE},options={revision:g.revision};
  const first=g.world.path(from,to,g.buildings,options),expected=structuredClone(first);first.shift();first[0].x=0;
  assert.deepEqual(g.world.path(from,to,g.buildings,options),expected);
  g.addBuilding('wall',22,20,true);const next=g.world.path(from,to,g.buildings,{revision:g.revision});assert.ok(next.every(p=>p.x!==22.5*TILE||p.y!==20.5*TILE));
  g.world.tile(23,20).type='mountain';g.revision++;const peak=g.world.path(from,to,g.buildings,{enemy:true,revision:g.revision});assert.ok(peak.every(p=>p.x!==23.5*TILE||p.y!==20.5*TILE));
  g.buildings[0].hp=0;assert.deepEqual(g.world.path(from,to,g.buildings,{revision:g.revision}),g.world.path(from,to,g.buildings));
});
test('summon searches preserve the nearest free land while avoiding distant occupancy scans',()=>{
  const g=new Game(707,'nightmare');for(let i=0;i<30;i++)g.addBuilding('house',30+i%10*3,42+Math.floor(i/10)*3,true);
  let calls=0;const buildingAt=g.world.buildingAt.bind(g.world);g.world.buildingAt=(...args)=>{calls++;return buildingAt(...args);};
  const point={x:g.keep.x+100,y:g.keep.y+70},result=g.nearestOpenLand(point,200),checks=calls;
  const expected=g.world.tiles.filter(t=>g.world.walkable(t)&&!buildingAt(g.buildings,t.x,t.y)).map(t=>({x:(t.x+.5)*TILE,y:(t.y+.5)*TILE})).filter(p=>Math.hypot(p.x-point.x,p.y-point.y)<200).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0];
  assert.deepEqual(result,expected);assert.ok(checks<100,checks+' occupancy scans');
});
test('wave completion waits for already launched hazards and endless repeats demon bosses',()=>{
  const g=new Game(6);g.wave=4;g.active=true;g.telegraph({id:999},'quake',{x:100,y:100},50,2,1);g.update(.1);assert.ok(g.active);for(let i=0;i<21;i++)g.update(.1);assert.equal(g.active,false);
  assert.ok(nightmareComposition(65).includes('archdemon'));assert.ok(nightmareComposition(70).includes('demonlord'));assert.ok(nightmareComposition(500).length<=221);
});
test('a golem instantly breaks its wall target without applying that bonus to nearby units',()=>{
  const g=new Game(8,'nightmare'),wall=g.addBuilding('wall',40,35,true),knight=g.addUnit('knight',wall.x+30,wall.y),golem=g.spawnEnemy('hellfiregolem',wall.x+50,wall.y);
  wall.hp=wall.maxHp=5000;g.hit(golem,wall,.1);assert.ok(wall.hp<=0);assert.ok(knight.hp>100&&knight.hp<knight.maxHp);
});
test('audio preferences migrate safely and persist independently of a kingdom',()=>{
  const values=new Map([['tidehold.sound','true'],['tidehold.audio','{"music":0.25,"effects":8,"ambience":-1}']]),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const a=new AudioManager();a.restore(storage);assert.equal(a.enabled,true);assert.deepEqual(a.levels,{music:.25,effects:1,ambience:0});a.setLevel('effects',.35);a.save(storage);
  const b=new AudioManager();b.restore(storage);assert.equal(b.levels.effects,.35);assert.doesNotThrow(()=>b.restore({getItem(){throw Error('blocked');}}));
});
