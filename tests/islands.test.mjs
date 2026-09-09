import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {Game} from '../src/game.js';
import {TILE} from '../src/data.js';
const tick=(g,s)=>{for(let t=0;t<s;t+=.1)g.update(.1);};

test('100 island seeds: ocean border, varied repeatable terrain, safe Keep, connected coasts and resources',()=>{
  let previous='',different=0;
  for(let seed=0;seed<100;seed++){
    const w=new World(seed,null,{difficulty:'hard'}),same=new World(seed,null,{difficulty:'nightmare'});
    assert.equal(w.cols,96);assert.equal(w.rows,72);assert.deepEqual(w.tiles,same.tiles);
    const signature=w.tiles.map(t=>t.type[0]).join('');if(signature!==previous)different++;previous=signature;
    const connected=w.flood(w.start.y*w.cols+w.start.x),foot=w.tiles.filter(t=>t.type==='foothill'),grass=w.tiles.filter(t=>t.type==='grass'),mineral=t=>['stone','iron','gold'].includes(t.resource);
    assert.ok(w.ranges.length>=2&&w.ranges.length<=3);assert.ok(connected.size>3000);
    assert.ok(foot.filter(mineral).length/foot.length>grass.filter(mineral).length/grass.length*5);
    assert.equal(new Set(w.landingSites().map(s=>s.side)).size,4);
    for(const site of w.landingSites()){
      assert.ok(connected.has(Math.floor(site.y/TILE)*w.cols+Math.floor(site.x/TILE)));
      assert.equal(w.at(site.targetX,site.targetY).type,'water');
      // Every straight sea approach must remain water until the landing.
      const dist=Math.hypot(site.targetX-site.seaX,site.targetY-site.seaY);
      for(let n=0;n<dist;n+=20){const t=w.at(site.seaX+site.dx*n,site.seaY+site.dy*n);if(t)assert.equal(t.type,'water');}
    }
    for(const [i,t]of w.tiles.entries()){
      if(t.x<3||t.y<3||t.x>=93||t.y>=69)assert.equal(t.type,'water');
      if(Math.hypot(t.x-w.start.x,t.y-w.start.y)<=8)assert.notEqual(t.type,'mountain');
      if(w.walkable(t))assert.ok(connected.has(i));
      if(t.resource)assert.ok(connected.has(i));if(t.type==='foothill'&&mineral(t))assert.equal(t.amount,2100);
    }
    for(const type of ['wood','stone'])assert.ok(w.tiles.some(t=>t.resource===type&&Math.hypot(t.x-w.start.x,t.y-w.start.y)<8));
  }
  assert.equal(different,100);
});
test('Easy and Normal keep the single northern coast, including old Hard saves',()=>{
  for(const difficulty of ['easy','normal']){const g=new Game(2,difficulty);assert.equal(g.world.cols,64);assert.equal(g.world.rows,48);assert.ok(g.world.landingSites().every(s=>s.side==='north'));}
  const old=new Game(3).serialize();old.difficulty='hard';delete old.cols;delete old.rows;delete old.island;const tiles=JSON.stringify(old.tiles),g=Game.restore(old);assert.equal(g.world.cols,64);assert.equal(g.world.island,false);assert.equal(JSON.stringify(g.world.tiles),tiles);
});
test('island pathfinding, workers, placement and saving use dimensions beyond the old boundary',()=>{
  const g=new Game(4,'hard'),w=g.world;assert.equal(g.keep.tx,47);assert.equal(g.keep.ty,39);
  for(const t of w.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.revision++;g.timer=10000;
  const b=g.place('farm',70,50);assert.ok(b);tick(g,100);assert.ok(b.complete);assert.ok(g.stats.gathered>0);
  const save=JSON.parse(JSON.stringify(g.serialize())),restored=Game.restore(save);assert.deepEqual(restored.serialize(),save);assert.equal(restored.world.cols,96);assert.ok(restored.world.path({x:70.5*TILE,y:55.5*TILE},{x:90.5*TILE,y:65.5*TILE},restored.buildings).length);
});
test('island fleets approach every side and unload onto land',()=>{
  const g=new Game(9,'hard');g.wave=29;g.startWave();assert.equal(new Set(g.ships.map(s=>s.side)).size,4);
  for(const s of g.ships){s.x=s.targetX;s.y=s.targetY;s.delay=0;}g.updateShips(.1);
  assert.ok(g.ships.every(s=>s.landed));assert.ok(g.enemies.length>50);assert.ok(g.enemies.every(e=>g.world.walkable(g.world.at(e.x,e.y))));
  const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize())));restored.updateShips(.1);assert.deepEqual(restored.ships.map(s=>s.facing),g.ships.map(s=>s.facing));
});
test('boats cannot unload through shoreline walls',()=>{
  const g=new Game(9,'hard');g.startWave();const s=g.ships[0];s.x=s.targetX;s.y=s.targetY;s.delay=0;const b=g.addBuilding('wall',Math.floor(s.beachX/TILE),Math.floor(s.beachY/TILE),true);
  g.updateShips(.1);assert.equal(s.landed,false);assert.ok(b.hp<b.maxHp);assert.equal(g.enemies.length,0);b.hp=0;g.clean();g.updateShips(.1);assert.ok(s.landed);assert.ok(g.enemies.length);
});
test('dragons fly from the sea independently and ignore melee while ranged defenses can hit them',()=>{
  const g=new Game(8,'hard');g.wave=49;g.startWave();const dragon=g.enemies.find(e=>e.type==='dragon');assert.ok(dragon);assert.ok(g.ships.every(s=>!s.units.includes('dragon')));assert.ok(!g.world.walkable(g.world.at(dragon.x,dragon.y)));
  const melee=g.addUnit('knight',dragon.x,dragon.y),archer=g.addUnit('archer',dragon.x,dragon.y),tower=g.addBuilding('tower',40,40,true),ballista=g.addBuilding('ballista',40,43,true),before=dragon.hp;
  g.hit(melee,dragon,.1);assert.equal(dragon.hp,before);g.hit(tower,dragon,.1);assert.ok(dragon.hp<before);g.hit(archer,dragon,.1);assert.ok(dragon.hp<before);const hp=dragon.hp;g.hit(ballista,dragon,.1);assert.ok(dragon.hp<hp);Object.assign(melee,{x:g.keep.x,y:g.keep.y});Object.assign(archer,{x:g.keep.x,y:g.keep.y});const x=dragon.x,y=dragon.y;g.fight(.1);assert.ok(Math.hypot(dragon.x-x,dragon.y-y)>0);
});
test('optional auto waves wait five seconds, respect pause and persist in saves',()=>{
  const g=new Game(4);g.wave=3;g.active=true;g.setAutoWave(true);g.update(.1);assert.equal(g.active,false);assert.ok(g.timer>=4.8&&g.timer<=5);g.paused=true;tick(g,10);assert.equal(g.wave,3);g.paused=false;tick(g,4.7);assert.equal(g.wave,3);tick(g,.5);assert.equal(g.wave,4);assert.equal(g.active,true);assert.equal(Game.restore(JSON.parse(JSON.stringify(g.serialize()))).autoWave,true);
});
test('landing a flying enemy opens melee targeting; taking off closes it again',()=>{
  const g=new Game(6),tile=g.world.tiles.find(t=>t.type==='grass'&&!g.world.buildingAt(g.buildings,t.x,t.y)),e=g.spawnEnemy('dragon',(tile.x+.5)*TILE,(tile.y+.5)*TILE),u=g.addUnit('knight',e.x,e.y);
  assert.equal(g.canDamage(u,e),false);assert.ok(g.setAirborne(e,false));assert.equal(g.canDamage(u,e),true);const hp=e.hp;g.fight(.1);assert.ok(e.hp<hp);assert.ok(g.setAirborne(e,true));assert.equal(g.canDamage(u,e),false);
  e.x=0;e.y=0;assert.equal(g.setAirborne(e,false),false);assert.equal(g.isAirborne(e),true);
});
