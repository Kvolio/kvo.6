import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {TILE} from '../src/data.js';
const tick=(g,s)=>{for(let t=0;t<s;t+=.1)g.update(.1);};
function kingdom(){const g=new Game(2);for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.revision++;g.timer=10000;const wall=g.addBuilding('wall',36,30,true),archer=g.addUnit('archer',35.5*TILE,32.5*TILE);g.selected=[archer.id];return {g,wall,archer};}
test('ranged defenders physically approach the wall and reserve at most two places',()=>{
  const {g,wall,archer}=kingdom(),second=g.addUnit('crossbow',35.5*TILE,33.5*TILE),third=g.addUnit('archer',35.5*TILE,34.5*TILE);g.selected=[archer.id,second.id,third.id];assert.ok(g.garrison(wall));assert.equal(archer.garrison,undefined);assert.equal(g.wallOccupants(wall).length,2);tick(g,8);assert.equal(archer.garrison,wall.id);assert.equal(second.garrison,wall.id);assert.equal(third.garrison,undefined);assert.equal(Math.floor(archer.x/TILE),wall.tx);assert.equal(g.unitRange(archer),280);
});
test('mounted archers fire at extended range and melee attackers must break the wall',()=>{
  const {g,wall,archer}=kingdom();g.garrison(wall);tick(g,5);g.units=[archer];const e=g.spawnEnemy('raider',archer.x+270,archer.y),hp=e.hp;g.fight(.1);assert.ok(e.hp<hp);const health=archer.hp;g.hit(e,archer,.1);assert.equal(archer.hp,health);e.x=wall.x+25;e.y=wall.y;e.cooldown=0;g.fight(.1);assert.ok(wall.hp<wall.maxHp);assert.equal(archer.hp,health);
});
test('dismounting and movement orders return archers to reachable land',()=>{
  const {g,wall,archer}=kingdom();g.garrison(wall);tick(g,5);g.command({x:40.5*TILE,y:31.5*TILE});assert.equal(archer.garrison,null);tick(g,8);assert.ok(archer.x>39*TILE);assert.equal(g.world.buildingAt(g.buildings,Math.floor(archer.x/TILE),Math.floor(archer.y/TILE)),undefined);
});
test('wall destruction drops defenders safely, dealing fall damage',()=>{
  const {g,wall,archer}=kingdom();g.garrison(wall);tick(g,5);const hp=archer.hp;wall.hp=0;g.clean();tick(g,.2);assert.equal(archer.garrison,null);assert.ok(archer.hp<hp);assert.ok(archer.hp>0);assert.ok(g.world.walkable(g.world.at(archer.x,archer.y)));
});
test('inaccessible and incomplete walls cannot be mounted; mounted state survives saves',()=>{
  const {g,wall,archer}=kingdom();wall.complete=false;assert.equal(g.garrison(wall),false);wall.complete=true;
  const points=g.world.accessPoints(wall,g.buildings);for(const p of points)g.world.at(p.x,p.y).type='mountain';g.revision++;assert.equal(g.garrison(wall),false);g.world.at(points[0].x,points[0].y).type='grass';g.revision++;assert.ok(g.garrison(wall));tick(g,8);const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize()))),u=restored.units.find(u=>u.id===archer.id);assert.equal(u.garrison,wall.id);assert.ok(restored.dismount(u));assert.equal(u.garrison,null);
});
test('kingdom name and each Keep choice persist independently of difficulty and map tiles',()=>{
  for(const keepDesign of [0,1,2]){const g=new Game(3,'hard',null,{name:'Stormwatch',keepDesign});const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize())));assert.equal(restored.kingdomName,'Stormwatch');assert.equal(restored.keepDesign,keepDesign);assert.equal(restored.world.cols,96);assert.deepEqual(restored.world.tiles,g.world.tiles);}
});
