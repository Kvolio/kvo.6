import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {CombatGrid} from '../src/combat.js';
import {ENEMIES,DEMONS,waveComposition,TILE} from '../src/data.js';
const tick=(g,s)=>{for(let t=0;t<s;t+=.1)g.update(.1);};
function arena(){const g=new Game(7);for(const t of g.world.tiles)Object.assign(t,{type:t.y<4?'water':'grass',resource:null,amount:0});g.revision++;g.timer=10000;g.units=[];return g;}
const index=g=>{g.playerGrid=new CombatGrid(g.units);g.enemyGrid=new CombatGrid(g.enemies);};

test('later sea waves contain complementary forces instead of repeating one enemy',()=>{
  for(let wave=22;wave<=50;wave++){const types=waveComposition(wave);assert.ok(new Set(types).size>=6);assert.ok(types.includes('ram'));assert.ok(types.includes('bow'));assert.ok(types.includes('elite'));}
  assert.ok(waveComposition(30,'hard').length>waveComposition(30).length);assert.ok(ENEMIES.titan.hp>6000);assert.ok(ENEMIES.dragon.damage>70);
});
test('Nightmare covers every requested demon and both milestone bosses',()=>{
  const all=new Set();for(let wave=51;wave<=60;wave++){const types=waveComposition(wave,'nightmare');assert.ok(types.every(t=>ENEMIES[t].demon));types.forEach(t=>all.add(t));}
  assert.deepEqual([...all].sort(),Object.keys(DEMONS).sort());assert.ok(waveComposition(55,'nightmare').includes('archdemon'));assert.ok(waveComposition(60,'nightmare').includes('demonlord'));
});
test('Conqueror defeat breaks the seal only on Nightmare and does not end at wave 50',()=>{
  const g=new Game(8,'nightmare');g.wave=50;g.active=true;g.spawnEnemy('conqueror',g.keep.x+200,g.keep.y).hp=0;g.clean();assert.ok(g.sealBroken);assert.equal(g.portals.length,3);g.update(.1);assert.equal(g.over,false);assert.equal(g.campaignLength(),60);
  const normal=new Game(8);normal.wave=50;normal.active=true;normal.spawnEnemy('conqueror',g.keep.x+200,g.keep.y).hp=0;normal.update(.1);assert.equal(normal.sealBroken,false);assert.equal(normal.victory,true);
});
test('all ten Nightmare waves arrive through coastal portals and victory waits for wave 60',()=>{
  const g=new Game(13,'nightmare');g.wave=50;g.breakSeal();g.timer=10000;
  for(let wave=51;wave<=60;wave++){
    assert.ok(g.startWave());assert.equal(g.wave,wave);assert.equal(g.ships.length,0);assert.ok(g.portals.some(p=>p.queue.length));
    for(const p of g.portals){const t=g.world.at(p.x,p.y);assert.ok(g.world.walkable(t));assert.ok(g.world.neighbors(t.y*g.world.cols+t.x).some(id=>g.world.tiles[id].type==='water'));}
    for(let t=0;t<45;t+=.5)g.updateNightmare(.5);
    assert.ok(g.portals.every(p=>!p.queue.length));assert.ok(g.enemies.length>40);if(wave===55)assert.ok(g.enemies.some(e=>e.type==='archdemon'));if(wave===60)assert.ok(g.enemies.some(e=>e.type==='demonlord'));
    for(const e of g.enemies)e.hp=0;g.update(.1);assert.equal(g.over,wave===60);g.portals=[];
  }assert.ok(g.victory);assert.ok(g.demonLordDefeated);
});
test('nearby threats draw enemy responses while hellhounds seek ranged defenders',()=>{
  const g=arena(),e=g.spawnEnemy('barbarian',1500,1300),u=g.addUnit('militia',1510,1300);g.addBuilding('tower',40,33,true);index(g);assert.equal(g.enemyTarget(e),u);
  const h=g.spawnEnemy('hellhound',1500,1300),archer=g.addUnit('archer',1700,1300);index(g);assert.equal(g.enemyTarget(h),archer);
  const runner=g.spawnEnemy('hellrunner',1500,1300);assert.equal(g.enemyTarget(runner),g.keep);
  const flyer=g.spawnEnemy('wingeddemon',1500,1300),farm=g.addBuilding('farm',42,35,true);assert.equal(g.enemyTarget(flyer),farm);
});
test('dreadguards attract defender attacks and succubi increase nearby demon damage',()=>{
  const g=arena(),a=g.addUnit('archer',1500,1300),warrior=g.spawnEnemy('demonwarrior',1570,1300),guard=g.spawnEnemy('dreadguard',1640,1300);index(g);assert.equal(g.friendlyTarget(a,220),guard);
  const base=g.attackDamage(warrior),succubus=g.spawnEnemy('succubus',1600,1320);g.updateCombatStatus(.1);assert.ok(g.attackDamage(warrior)>base);succubus.hp=0;g.updateCombatStatus(.1);assert.equal(g.attackDamage(warrior),base);
});
test('infernal arrows ignite timber but never stone structures',()=>{
  const g=arena(),e=g.spawnEnemy('infernalarcher',1600,1300),house=g.addBuilding('house',42,33,true),wall=g.addBuilding('wall',44,33,true);g.hit(e,house,.1);assert.ok(house.burn);const hp=house.hp;g.updateCombatStatus(1);assert.ok(house.hp<hp);e.cooldown=0;g.hit(e,wall,.1);assert.equal(wall.burn,undefined);
});
test('brute retaliation burns infantry, golems smash walls, and percentage defenses apply',()=>{
  const g=arena(),u=g.addUnit('knight',1600,1300),brute=g.spawnEnemy('demonbrute',1610,1300);g.hit(u,brute,.1);assert.ok(u.burn);const hp=brute.hp;g.damageEntity({type:'ballista'},brute,108);assert.ok(Math.abs(hp-brute.hp-65)<.001);
  const golem=g.spawnEnemy('hellfiregolem',1700,1300),wall=g.addBuilding('wall',43,32,true),near=g.addUnit('militia',wall.x+30,wall.y);g.hit(golem,wall,.1);assert.ok(wall.hp<=0);assert.ok(near.hp<near.maxHp);
});
test('hellrunners jump walls but never jump onto mountains',()=>{
  const g=arena(),e=g.spawnEnemy('hellrunner',40.5*TILE,30.5*TILE),target={x:50*TILE,y:30.5*TILE};g.addBuilding('wall',41,30,true);assert.ok(g.tryLeap(e,target));assert.equal(Math.floor(e.x/TILE),42);
  e.x=40.5*TILE;e.leapUntil=0;g.world.tile(42,30).type='mountain';assert.equal(g.tryLeap(e,target),false);assert.equal(Math.floor(e.x/TILE),40);
});
test('every airborne enemy rejects melee targeting and accepts ranged damage',()=>{
  for(const type of Object.keys(ENEMIES).filter(t=>ENEMIES[t].flying)){
    const g=arena(),e=g.spawnEnemy(type,1600,1300),melee=g.addUnit('knight',1590,1300),archer=g.addUnit('crossbow',1580,1300);assert.equal(g.canDamage(melee,e),false);const hp=e.hp;g.hit(melee,e,.1);assert.equal(e.hp,hp);g.hit(archer,e,.1);assert.ok(e.hp<hp);assert.ok(g.setAirborne(e,false));assert.ok(g.canDamage(melee,e));
  }
});
test('infernal mages summon demons and their attacks damage groups',()=>{
  const g=arena(),e=g.spawnEnemy('infernalmage',1600,1300),u=g.addUnit('militia',1610,1300),v=g.addUnit('militia',1620,1300);g.hit(e,u,.1);assert.ok(v.hp<v.maxHp);e.abilityClock=0;g.bossAbilities(e,.1,u);assert.ok(g.enemies.some(e=>e.type==='skeleton'));assert.ok(g.enemies.some(e=>e.type==='hellhound'));
});
test('ArchDemon gains extra portals, a telegraphed dive, breakable guardian ward and hellfire cross',()=>{
  const g=arena(),e=g.spawnEnemy('archdemon',1600,1300),target={x:1750,y:1300};
  for(let step=0;step<4;step++){e.abilityClock=0;e.abilityStep=step;g.bossAbilities(e,.1,target);if(step===0)assert.ok(g.portals.length);if(step===1)assert.ok(g.hazards.some(h=>h.kind==='dive'));if(step===2)assert.equal(g.enemies.filter(v=>v.wardFor===e.id).length,2);}
  assert.equal(g.hazards.filter(h=>h.kind==='flamecross').length,5);const hp=e.hp;g.damageEntity({type:'ballista'},e,110);const shielded=hp-e.hp;for(const guard of g.enemies.filter(v=>v.wardFor===e.id))guard.hp=0;const next=e.hp;g.damageEntity({type:'ballista'},e,110);assert.ok(next-e.hp>shielded*2);g.updateNightmare(3);assert.equal(g.isAirborne(e),false);g.time+=6;g.bossAbilities(e,.1,target);assert.equal(g.isAirborne(e),true);
});
test('Demon Lord heals for five seconds before phase II, then increases speed and summons',()=>{
  const g=arena(),e=g.spawnEnemy('demonlord',1600,1300);e.hp=e.maxHp*.49;g.bossAbilities(e,1,g.keep);assert.equal(e.phase,'healing');const hp=e.hp;for(let i=0;i<3;i++)g.bossAbilities(e,1,g.keep);assert.equal(e.phase,'healing');assert.ok(e.hp>hp);g.bossAbilities(e,1,g.keep);assert.equal(e.phase,2);index(g);assert.equal(g.enemyTarget(e),g.keep);e.abilityClock=0;g.bossAbilities(e,.1,g.keep);assert.ok(g.enemies.length>=6);assert.equal(e.abilityClock,3.5);
});
test('Demon Lord hurls demons and warns before eruptions and the ring of ruin',()=>{
  const g=arena(),e=g.spawnEnemy('demonlord',1600,1300);g.addBuilding('house',44,34,true);
  for(let step=0;step<3;step++){e.abilityClock=0;e.abilityStep=step;g.bossAbilities(e,.1,g.keep);}
  assert.ok(g.hazards.some(h=>h.kind==='hurl'&&h.spawn==='demonwarrior'));assert.ok(g.hazards.some(h=>h.kind==='eruption'));assert.ok(g.hazards.some(h=>h.kind==='doomring'&&h.inner===90));const before=g.enemies.length;g.updateNightmare(3);assert.ok(g.enemies.length>before);
});
test('portals, warning timers, guardians and boss phases survive a paused save',()=>{
  const g=new Game(2,'nightmare');g.wave=54;g.sealBroken=true;g.startWave();g.updateNightmare(3);const e=g.spawnEnemy('demonlord',g.keep.x+300,g.keep.y);g.beginDemonLordPhase(e);g.paused=true;const save=JSON.parse(JSON.stringify(g.serialize()));tick(g,5);assert.deepEqual(g.serialize(),save);const restored=Game.restore(save);assert.deepEqual(restored.serialize(),save);assert.ok(restored.hazards.length);assert.ok(restored.portals.some(p=>p.queue.length));assert.equal(restored.enemies.find(e=>e.type==='demonlord').phase,'healing');
});
