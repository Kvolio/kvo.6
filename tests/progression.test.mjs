import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {TECHNOLOGIES} from '../src/progression.js';
const tick=(g,seconds)=>{for(let t=0;t<seconds;t+=.1)g.update(.1);};
function kingdom(){const g=new Game(2);for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.revision++;g.timer=10000;g.keep.level=3;for(const r in g.resources)g.resources[r]=5000;g.addBuilding('barracks',35,27,true);g.addBuilding('smith',38,27,true);return g;}

test('soldiers train sequentially, reserve population, and charge only once',()=>{
  const g=kingdom(),before=g.resources.wood;assert.ok(g.recruit('militia'));assert.ok(g.recruit('spear'));assert.equal(g.units.length,5);assert.equal(g.queuedPopulation(),2);assert.equal(g.resources.wood,before-35);
  tick(g,11);assert.equal(g.units.length,5);tick(g,2);assert.equal(g.units.length,6);assert.equal(g.units.at(-1).type,'militia');assert.equal(g.queuedPopulation(),1);tick(g,18);assert.equal(g.units.at(-1).type,'spear');assert.equal(g.queuedPopulation(),0);assert.equal(g.resources.wood,before-35);
});
test('queue cap and reserved housing prevent a free instant army',()=>{
  const g=kingdom();g.keep.level=1;for(let i=0;i<3;i++)assert.ok(g.recruit('militia'));const before=g.resources.wood;assert.equal(g.recruit('militia'),false);assert.equal(g.resources.wood,before);g.keep.level=3;assert.ok(g.recruit('militia'));assert.ok(g.recruit('militia'));assert.equal(g.recruit('militia'),false);assert.equal(g.queuedPopulation(),5);
});
test('blocked training exit waits without spawning inside walls and resumes when cleared',()=>{
  const g=kingdom(),b=g.buildings.find(b=>b.type==='barracks');assert.ok(g.recruit('militia'));const blockers=g.world.accessPoints(b,g.buildings).map(p=>g.addBuilding('wall',Math.floor(p.x/40),Math.floor(p.y/40),true));tick(g,20);assert.equal(g.units.length,5);assert.equal(b.training[0].waiting,'Exit blocked');blockers[0].hp=0;g.clean();tick(g,.2);assert.equal(g.units.length,6);assert.equal(b.training.length,0);
});
test('training survives save/load and cancellation releases its reserved slot',()=>{
  const g=kingdom();g.resources.wood=100;g.resources.food=100;g.recruit('militia');g.recruit('militia');tick(g,4);const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize()))),b=restored.buildings.find(b=>b.type==='barracks');assert.ok(b.training[0].progress>3);assert.ok(restored.cancelTraining(b,b.training[1].id));assert.equal(restored.queuedPopulation(),1);assert.equal(restored.resources.wood,85);tick(restored,9);assert.equal(restored.units.length,6);assert.equal(restored.queuedPopulation(),0);
});
test('research tree enforces dependencies, elapsed time, and one active project',()=>{
  const g=kingdom();g.buildings.find(b=>b.type==='smith').level=3;assert.equal(g.research('siegecraft'),false);assert.match(g.researchReason('siegecraft'),/Rangefinding and Tempered blades/);assert.ok(g.research('steel'));assert.equal(g.researchBonus('melee'),0);assert.equal(g.research('fletching'),false);tick(g,54);assert.equal(g.researchBonus('melee'),0);tick(g,2);assert.equal(g.researchBonus('melee'),.2);assert.equal(g.research('steel'),false);assert.ok(g.research('armor'));tick(g,66);assert.equal(g.researchBonus('armor'),3);
});
test('research pauses with simulation and without a Blacksmith, then resumes after restoration',()=>{
  const g=kingdom();g.research('forestry');g.paused=true;tick(g,10);assert.equal(g.researchTask.progress,0);g.paused=false;tick(g,10);const smith=g.buildings.find(b=>b.type==='smith');smith.hp=0;g.clean();const before=g.researchTask.progress;tick(g,10);assert.equal(g.researchTask.progress,before);const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize())));restored.addBuilding('smith',38,27,true);tick(restored,31);assert.ok(restored.researched.includes('forestry'));assert.equal(restored.researchTask,null);
});
test('learned technologies change real damage, armor, tower stats and training speed',()=>{
  const g=kingdom(),u=g.addUnit('militia',1000,1000),e=g.spawnEnemy('raider',1010,1000),hp=e.hp;g.researched=['steel','armor','fletching','surveying','siegecraft','drill'];g.hit(u,e,.1);assert.ok(Math.abs(hp-e.hp-16.8)<.001);const friendlyHp=u.hp;g.hit(e,u,.1);assert.ok(Math.abs(friendlyHp-u.hp-(g.attackDamage(e)-4))<.001);
  const tower=g.addBuilding('tower',40,30,true);assert.equal(g.towerRange(tower),276);assert.ok(Math.abs(g.towerDamage(tower)-21.6)<.001);e.hp=0;g.clean();g.recruit('militia');const n=g.units.length;tick(g,10);assert.equal(g.units.length,n+1);
});
test('all technology branches are acyclic and reachable through their stated prerequisites',()=>{
  const learned=new Set();for(let i=0;i<10;i++)for(const [id,t]of Object.entries(TECHNOLOGIES))if(t.requires.every(id=>learned.has(id)))learned.add(id);assert.equal(learned.size,Object.keys(TECHNOLOGIES).length);assert.equal(new Set(Object.values(TECHNOLOGIES).map(t=>t.branch)).size,5);
});
