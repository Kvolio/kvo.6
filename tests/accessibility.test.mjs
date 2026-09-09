import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {DIFFICULTIES,difficultyValue,waveComposition,TILE} from '../src/data.js';
const tick=(g,s)=>{for(let i=0;i<s*10;i++)g.update(.1);};
const flat=(difficulty='normal')=>{const g=new Game(19,difficulty);for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.revision++;return g;};

test('opening peace waits for successful actions, survives saves, and old saves continue',()=>{
 const g=new Game(19),timer=g.timer,food=g.resources.food;tick(g,12);assert.equal(g.timer,timer);assert.equal(g.resources.food,food);g.place('keep',1,1);assert.equal(g.hasActed,false);
 const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize())));tick(restored,1);assert.equal(restored.timer,timer);
 assert.ok(g.recruit('worker'));tick(g,1);assert.ok(g.timer<timer);const saved=g.serialize();delete saved.hasActed;assert.equal(Game.restore(saved).hasActed,true);
});
test('a valid worker command starts peace and tutorial holds only the invasion timer',()=>{
 const g=flat();g.tutorial={step:2,done:false};g.selected=[g.units[0].id];g.command({x:35.5*TILE,y:32.5*TILE});assert.equal(g.hasActed,true);const timer=g.timer,x=g.units[0].x;tick(g,1);assert.equal(g.timer,timer);assert.notEqual(g.units[0].x,x);
 const restored=Game.restore(JSON.parse(JSON.stringify(g.serialize())));assert.equal(restored.tutorial.step,2);restored.tutorial.done=true;tick(restored,1);assert.ok(restored.timer<timer);
});
test('every difficulty has distinct peace and recovery time, with opt-in auto waves unchanged',()=>{
 let previous=Infinity;for(const difficulty of ['easy','normal','hard','nightmare']){const g=new Game(19,difficulty);assert.ok(g.timer<previous);previous=g.timer;g.wave=1;g.active=true;g.update(.1);assert.ok(Math.abs(g.timer-(DIFFICULTIES[difficulty].interval-.1))<.001);g.setAutoWave(true);assert.equal(g.timer,5);}
});
test('easier modes have weaker, smaller waves and stronger starting supplies; hard openings ramp back',()=>{
 for(const wave of [1,5,10,25,50]){const easy=waveComposition(wave,'easy'),normal=waveComposition(wave,'normal'),hard=waveComposition(wave,'hard');assert.ok(easy.length<normal.length);assert.ok(normal.length<hard.length);}
 for(const key of ['count','hp','damage']){assert.ok(difficultyValue('hard',key,1)<difficultyValue('hard',key,12));assert.equal(difficultyValue('nightmare',key,50),DIFFICULTIES.nightmare[key]);}
 const easy=new Game(1,'easy'),normal=new Game(1);assert.ok(easy.resources.wood>normal.resources.wood);assert.ok(normal.resources.wood>250);
 const boss=easy.spawnEnemy('chief',easy.keep.x+100,easy.keep.y);easy.telegraph(boss,'quake',easy.keep,100,1,100);assert.equal(easy.hazards[0].damage,65);
});
test('building on deposits removes only the footprint and safely relocates workers, soldiers and enemies',()=>{
 const g=flat(),worker=g.units[0];Object.assign(worker,{x:35.5*TILE,y:30.5*TILE});const soldier=g.addUnit('archer',36.5*TILE,31.5*TILE),enemy=g.spawnEnemy('raider',35.5*TILE,31.5*TILE);
 for(const [x,y,r] of [[35,30,'wood'],[36,30,'iron'],[35,31,'gold'],[36,31,'stone'],[37,30,'stone']])Object.assign(g.world.tile(x,y),{resource:r,amount:2100});
 const before={...g.resources},b=g.place('house',35,30);assert.ok(b);assert.equal(g.resources.gold,before.gold);assert.equal(g.resources.iron,before.iron);assert.equal(g.resources.wood,before.wood-50);assert.equal(g.world.tile(37,30).amount,2100);
 for(const u of [worker,soldier,enemy])assert.equal(g.world.buildingAt(g.buildings,Math.floor(u.x/TILE),Math.floor(u.y/TILE)),undefined);
 for(let y=30;y<32;y++)for(let x=35;x<37;x++)assert.equal(g.world.tile(x,y).resource,null);
 enemy.hp=0;g.clean();tick(g,30);assert.equal(b.complete,true);
});
test('failed placement does not remove deposits or move occupied units',()=>{
 const g=flat(),u=g.units[0];Object.assign(u,{x:35.5*TILE,y:30.5*TILE});Object.assign(g.world.tile(35,30),{resource:'wood',amount:2100});g.world.tile(36,31).type='mountain';const before={...g.resources};assert.equal(g.place('house',35,30),false);assert.equal(u.x,35.5*TILE);assert.equal(g.world.tile(35,30).amount,2100);assert.deepEqual(g.resources,before);
});
test('Keep automatically shoots ground and airborne targets, respects range, and scales with upgrades',()=>{
 const g=flat();g.units=[];const k=g.keep,e=g.spawnEnemy('raider',k.x+200,k.y),hp=e.hp;g.fight(.1);assert.ok(e.hp<hp);assert.ok(g.effects.some(f=>f.kind==='arrow'));g.enemies=[];
 const dragon=g.spawnEnemy('dragon',k.x+200,k.y),before=dragon.hp;k.cooldown=0;g.fight(.1);assert.ok(dragon.hp<before);const damage=g.towerDamage(k);k.level=2;assert.equal(g.towerDamage(k),damage*2);
 g.enemies=[];const far=g.spawnEnemy('raider',k.x+500,k.y);k.cooldown=0;g.fight(.1);assert.equal(far.hp,far.maxHp);
});
test('boss abilities resolve automatically without attack-warning popups',()=>{
 const g=flat('nightmare'),messages=[];g.notice=m=>messages.push(m);const e=g.spawnEnemy('archdemon',g.keep.x+150,g.keep.y);e.abilityStep=1;e.abilityClock=0;const hp=g.keep.hp;g.bossAbilities(e,.1,g.keep);assert.equal(messages.length,0);assert.equal(g.hazards.length,1);g.updateNightmare(3);assert.ok(g.keep.hp<hp);assert.equal(g.hazards.length,0);assert.equal(g.isAirborne(e),false);
});

