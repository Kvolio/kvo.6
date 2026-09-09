import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {constructionLine} from '../src/construction.js';
import {TILE} from '../src/data.js';

const tick=(g,seconds)=>{for(let t=0;t<seconds;t+=.1)g.update(.1);};
function kingdom(){const g=new Game(9);for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.revision++;g.timer=10000;for(const r in g.resources)g.resources[r]=5000;return g;}

test('drag plans form connected corners, skip existing junctions, and spend once',()=>{
  const g=kingdom(),cells=constructionLine({tx:35,ty:30},{tx:39,ty:33});assert.equal(cells.length,8);
  const before=g.resources.stone,result=g.placeBatch('road',cells,1);assert.equal(result.length,8);assert.equal(g.resources.stone,before-24);
  assert.equal(g.connectionMask(result[4]),12);assert.equal(result[0].rotation,1);
  const extension=g.placeBatch('road',constructionLine({tx:39,ty:33},{tx:41,ty:33}));assert.equal(extension.length,2);assert.equal(g.resources.stone,before-30);
});
test('invalid or unaffordable drag rejects the entire plan without losing resources',()=>{
  const g=kingdom(),cells=constructionLine({tx:35,ty:30},{tx:40,ty:30});Object.assign(g.world.tile(39,30),{type:'mountain'});
  const before={...g.resources};assert.equal(g.placeBatch('palisade',cells),false);assert.equal(g.buildings.length,1);assert.deepEqual(g.resources,before);
  g.world.tile(39,30).type='grass';g.resources.wood=13;assert.equal(g.placeBatch('palisade',cells),false);assert.equal(g.resources.wood,13);assert.equal(g.buildings.length,1);
});
test('workers complete queued sites without manual assignment, then return to their farms',()=>{
  const g=kingdom(),farm=g.addBuilding('farm',34,33,true);for(const u of g.units)g.assign(u,farm,'gather');
  const a=g.place('house',35,27),b=g.place('barracks',38,27),c=g.place('tower',41,27);assert.ok(a&&b&&c);
  tick(g,100);assert.ok([a,b,c].every(b=>b.complete));assert.ok(g.units.every(u=>u.job?.kind==='gather'&&u.job.building===farm.id));
});
test('queued construction starts when a busy worker becomes available and leaves player moves intact',()=>{
  const g=kingdom();g.units=g.units.slice(0,1);const u=g.units[0];g.selected=[u.id];g.command({x:45.5*TILE,y:35.5*TILE});
  const b=g.place('house',35,27);assert.ok(b);assert.equal(u.job,null);tick(g,1);assert.equal(b.progress,0);
  tick(g,90);assert.ok(b.complete);
});
test('resources remain intact until workers extract and deliver them',()=>{
  const g=kingdom();g.resources.wood=0;const tile=g.world.tile(35,30),id=30*64+35;Object.assign(tile,{resource:'wood',amount:36});
  assert.equal(g.place('house',35,30),false);assert.equal(tile.amount,36);assert.equal(g.clearResource(id),true);assert.equal(tile.amount,36);
  tick(g,50);assert.equal(tile.resource,null);assert.equal(tile.amount,0);assert.equal(g.resources.wood,36);assert.equal(g.stats.gathered,36);
  assert.equal(g.units.some(u=>u.job?.kind==='clear'),false);
});
test('inaccessible clearing does not consume a deposit and resumes after opening a pass',()=>{
  const g=kingdom();g.resources.stone=0;const tile=g.world.tile(37,30);Object.assign(tile,{resource:'stone',amount:24});
  for(const [x,y]of [[36,30],[38,30],[37,29],[37,31]])g.world.tile(x,y).type='mountain';g.revision++;
  g.clearResource(30*64+37);tick(g,10);assert.equal(tile.amount,24);g.world.tile(37,31).type='foothill';g.revision++;tick(g,60);assert.equal(g.resources.stone,24);assert.equal(tile.resource,null);
});
test('upgrades take worker time, survive saves, and grant benefits only after completion',()=>{
  const g=kingdom(),b=g.addBuilding('tower',35,28,true),before=g.resources.stone;assert.ok(g.upgrade(b));assert.equal(b.level,1);assert.equal(b.maxHp,700);assert.equal(g.resources.stone,before-100);assert.equal(g.upgrade(b),false);
  tick(g,3);assert.equal(b.level,1);const saved=JSON.parse(JSON.stringify(g.serialize())),restored=Game.restore(saved),tower=restored.buildings.find(t=>t.id===b.id);assert.ok(tower.upgrade);tick(restored,40);assert.equal(tower.level,2);assert.equal(tower.maxHp,980);assert.equal(tower.upgrade,null);
});
test('tower range and damage upgrades are independent and alter real combat',()=>{
  const g=kingdom(),b=g.addBuilding('tower',35,28,true);assert.ok(g.upgrade(b,'range'));tick(g,30);assert.equal(b.level,1);assert.equal(g.towerRange(b),276);assert.equal(g.towerDamage(b),18);
  assert.ok(g.upgrade(b,'damage'));tick(g,30);assert.equal(g.towerRange(b),276);assert.equal(g.towerDamage(b),21.599999999999998);
  const e=g.spawnEnemy('raider',b.x+260,b.y),hp=e.hp;g.fight(.1);assert.ok(e.hp<hp);assert.equal(Math.round(hp-e.hp),22);
});
test('canceling upgrade refunds 80 percent and releases builders without applying it',()=>{
  const g=kingdom(),b=g.addBuilding('tower',35,28,true);g.resources.wood=300;g.resources.stone=300;g.resources.gold=100;assert.ok(g.upgrade(b));assert.ok(g.cancelUpgrade(b));tick(g,30);assert.equal(b.level,1);assert.equal(g.resources.wood,280);assert.equal(g.resources.stone,280);assert.equal(g.resources.gold,90);assert.ok(g.units.every(u=>!u.job));
});
test('rotation persists across save/load, and all four wall connections join',()=>{
  const g=kingdom(),house=g.place('house',35,27,3);assert.ok(house);const center=g.addBuilding('wall',40,35,true);for(const [x,y]of [[39,35],[41,35],[40,34],[40,36]])g.addBuilding('gate',x,y,true);
  assert.equal(g.connectionMask(center),15);const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize())));assert.equal(restored.buildings.find(b=>b.id===house.id).rotation,3);
});
