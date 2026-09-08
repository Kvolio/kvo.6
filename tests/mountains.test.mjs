import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {Game} from '../src/game.js';
import {TILE,COLS} from '../src/data.js';
const point=(x,y)=>({x:(x+.5)*TILE,y:(y+.5)*TILE});
const tick=(g,seconds)=>{for(let t=0;t<seconds;t+=.1)g.update(.1);};
function flat(){const g=new Game(1);for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.world.reachCache.clear();return g;}

test('100 seeds: repeatable ranges, protected start, connected landing routes and richer accessible foothills',()=>{
  for(let seed=0;seed<100;seed++){
    const w=new World(seed);assert.deepEqual(w.tiles,new World(seed).tiles,`repeatability ${seed}`);assert.ok(w.ranges.length>=2&&w.ranges.length<=3);
    const reachable=w.flood(28*COLS+32),foothills=w.tiles.filter(t=>t.type==='foothill'),lowlands=w.tiles.filter(t=>t.type==='grass');
    const mineral=t=>['stone','iron','gold'].includes(t.resource);
    assert.ok(foothills.filter(mineral).length/foothills.length>lowlands.filter(mineral).length/lowlands.length,`density ${seed}`);
    assert.ok(w.tiles.some(t=>t.pass),`passes ${seed}`);
    for(const t of w.tiles){if(Math.hypot(t.x-32,t.y-28)<=8)assert.notEqual(t.type,'mountain');if(w.walkable(t))assert.ok(reachable.has(t.y*COLS+t.x));if(t.type==='foothill'&&mineral(t))assert.equal(t.amount,2100);if(t.resource)assert.ok(reachable.has(t.y*COLS+t.x));}
    for(const lane of [10,16,18,32,46,53]){let y=0;while(w.tile(lane,y).type==='water')y++;assert.ok(reachable.has(y*COLS+lane));}
    for(const resource of ['wood','stone'])assert.ok(w.tiles.some(t=>t.resource===resource&&Math.hypot(t.x-32,t.y-28)<8));
  }
});
test('peaks cannot be built on, crossed by ground units, or breached like walls',()=>{
  const g=flat();for(let y=0;y<48;y++)g.world.tile(30,y).type='mountain';const a=point(29,30),b=point(31,30);
  assert.match(g.world.placementReason('house',30,30,g.buildings),/Peaks/);assert.equal(g.world.path(a,b,g.buildings).length,0);assert.equal(g.world.path(a,b,g.buildings,{enemy:true}).length,0);assert.deepEqual(g.world.path(a,b,g.buildings,{flying:true}),[b]);
  const u=g.addUnit('worker',a.x,a.y);g.selected=[u.id];g.command(point(30,30));assert.equal(u.target,undefined);assert.equal(g.move(u,point(30,30),.1),false);
  g.world.tile(30,30).type='foothill';g.world.tile(30,31).type='foothill';assert.ok(g.world.path(a,b,g.buildings).length);
});
test('mine validation and assignment exclude unreachable minerals',()=>{
  const g=flat();Object.assign(g.world.tile(37,30),{resource:'stone',amount:2100});for(const [x,y]of [[36,30],[38,30],[37,29],[37,31]])g.world.tile(x,y).type='mountain';
  assert.match(g.world.placementReason('quarry',34,28,g.buildings),/No reachable stone/);
  const b=g.addBuilding('quarry',34,28,true),u=g.units[0];assert.equal(g.assign(u,b,'gather'),false);
  Object.assign(g.world.tile(35,33),{type:'foothill',resource:'stone',amount:2100});g.revision++;
  assert.equal(g.assign(u,b,'gather'),true);tick(g,55);assert.ok(g.resources.stone>150);assert.equal(g.world.tile(37,30).amount,2100);
});
test('workers return partial loads from depleted deposits and report a blocked route once',()=>{
  const g=flat();Object.assign(g.world.tile(36,31),{type:'foothill',resource:'stone',amount:3});const b=g.addBuilding('quarry',35,28,true),u=g.units[0],messages=[];g.notice=m=>messages.push(m);assert.ok(g.assign(u,b,'gather'));tick(g,70);assert.equal(g.resources.stone,153);assert.equal(g.world.tile(36,31).resource,null);assert.equal(messages.filter(m=>m.includes('No reachable stone')).length,1);
});
test('existing version 1 maps are loaded verbatim without inserting mountain ranges',()=>{
  const g=flat(),save=JSON.parse(JSON.stringify(g.serialize()));save.tiles=save.tiles.map(({elevation,pass,...t})=>t);const old=JSON.stringify(save.tiles);const restored=Game.restore(save);assert.equal(JSON.stringify(restored.world.tiles),old);assert.equal(restored.world.ranges,undefined);tick(restored,1);assert.equal(JSON.stringify(restored.world.tiles),old);
});
test('new mountain saves preserve terrain, resource amounts and depleted veins',()=>{
  const g=new Game(22),t=g.world.tiles.find(t=>t.resource==='gold'&&t.type==='foothill');t.amount=7;const save=JSON.parse(JSON.stringify(g.serialize()));const restored=Game.restore(save);assert.deepEqual(restored.world.tiles,g.world.tiles);assert.deepEqual(restored.serialize(),save);
});
test('recruitment cannot place workers inside surrounding peaks',()=>{
  const g=flat();for(const p of g.world.accessPoints(g.keep,g.buildings)){g.world.at(p.x,p.y).type='mountain';}const before=g.resources.food;assert.equal(g.recruit('worker'),false);assert.equal(g.resources.food,before);assert.equal(g.units.length,5);
});
