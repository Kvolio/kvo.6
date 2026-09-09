// Reproducible strategy probes. Openings spend real starting resources and use
// construction/training. Late encounters deliberately use established kingdoms;
// they are encounter comparisons, not claims of a complete organic campaign.
import {Game} from '../src/game.js';
import {BUILDINGS,UNITS,TILE} from '../src/data.js';
import {TECHNOLOGIES} from '../src/progression.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const results=[];
function buildNear(g,type){
  if(!g.afford(BUILDINGS[type].cost))return false;
  const start=g.world.start,candidates=[];for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++)candidates.push({tx:start.x+dx,ty:start.y+dy,score:Math.hypot(dx,dy)+(BUILDINGS[type].damage?(dy>0?6:0):0)});
  candidates.sort((a,b)=>a.score-b.score);
  for(const p of candidates)if(g.world.valid(type,p.tx,p.ty,g.buildings)){const b=g.place(type,p.tx,p.ty);if(b)return b;}return false;
}
function run(g,seconds,policy,oneWave=false){
  const frames=[],events=[];g.notice=message=>{if(/Wave |falls|fallen|rebirth|charges|completed/.test(message))events.push({time:Math.round(g.time),message});};
  for(let i=0;i<seconds*10&&!g.over;i++){
    if(i%10===0&&policy)policy(g,i/10);
    if(g.captureSnapshots&&i%250===0)writeFileSync('artifacts/playtest/citadel-'+Math.round(g.time)+'.json',JSON.stringify(g.serialize()));
    const before=performance.now();g.update(.1);frames.push(performance.now()-before);
    if(oneWave&&!g.active)break;
    assert.ok([...g.units,...g.enemies].every(e=>Number.isFinite(e.x)&&Number.isFinite(e.hp)),'finite simulation state');
  }
  frames.sort((a,b)=>a-b);return {seconds:Math.round(g.time),wave:g.wave,active:g.active,over:g.over,victory:g.victory,keepHP:Math.round(g.keep?.hp||0),kills:g.stats.kills,lost:g.stats.lost,survivors:g.units.length,remaining:g.enemies.length,resources:Object.fromEntries(Object.entries(g.resources).map(([k,v])=>[k,Math.floor(v)])),simulationMs:{mean:frames.reduce((a,b)=>a+b,0)/frames.length,p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1)},events};
}
function opening(seed,difficulty){
  const g=new Game(seed,difficulty),order=['lumber','farm','quarry','house','barracks','tower','range','house','tower','farm','house'];let next=0;
  const policy=(g,t)=>{
    if(next<order.length&&buildNear(g,order[next]))next++;
    const workers=g.units.filter(u=>u.type==='worker');
    if(workers.length+g.buildings.flatMap(b=>b.training||[]).filter(q=>q.type==='worker').length<9&&!g.recruitmentReason('worker'))g.recruit('worker');
    for(const u of workers.filter(u=>!u.job&&!u.target)){
      const jobs=g.buildings.filter(b=>b.complete&&BUILDINGS[b.type].resource&&g.units.filter(w=>w.job?.building===b.id).length<3).sort((a,b)=>g.resources[BUILDINGS[a.type].resource]-g.resources[BUILDINGS[b.type].resource]);
      if(jobs[0])g.assign(u,jobs[0],'gather');
    }
    const army=g.units.filter(u=>u.type!=='worker'),archers=army.filter(u=>u.type==='archer');
    if(army.length+g.queuedPopulation()<12){const type=archers.length<Math.ceil(army.length*.6)?'archer':'militia';if(!g.recruitmentReason(type))g.recruit(type);else if(!g.recruitmentReason('militia'))g.recruit('militia');}
    if(g.active&&t%3===0){const enemy=g.enemies.slice().sort((a,b)=>Math.hypot(a.x-g.keep.x,a.y-g.keep.y)-Math.hypot(b.x-g.keep.x,b.y-g.keep.y))[0];if(enemy&&Math.hypot(enemy.x-g.keep.x,enemy.y-g.keep.y)<600){g.selected=army.map(u=>u.id);g.command({x:enemy.x,y:enemy.y},'attackmove');}}
  };
  const result={scenario:'organic-opening',seed,difficulty,...run(g,700,policy),builtOrder:order.slice(0,next)};results.push(result);console.log(JSON.stringify(result));return g;
}
function encounter(wave,difficulty,formation,dodge){
  const g=new Game(42,difficulty);g.units=[];g.timer=100000;
  // This fixture removes terrain variability so the comparison isolates defenses.
  for(const t of g.world.tiles)Object.assign(t,{type:t.x<4||t.y<4||t.x>=g.world.cols-4||t.y>=g.world.rows-4?'water':'grass',resource:null,amount:0});g.revision++;
  if(process.argv.includes('--validate-routes')){const path=g.world.path.bind(g.world);g.routeChecks={calls:0,mismatches:0,examples:[]};g.world.path=(from,to,buildings,options={})=>{const result=path(from,to,buildings,options),expected=path(from,to,buildings,{...options,revision:null});g.routeChecks.calls++;if(JSON.stringify(result)!==JSON.stringify(expected)){g.routeChecks.mismatches++;if(g.routeChecks.examples.length<3)g.routeChecks.examples.push({from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},options,dead:buildings.filter(b=>b.hp<=0).map(b=>b.type)});}return result;};}
  const endgame=wave>=50,count=formation==='citadel'?220:endgame?140:wave>=30?80:28,level=endgame?5:wave>=30?3:2;
  g.keep.level=level;g.keep.hp=g.keep.maxHp=BUILDINGS.keep.hp*(1+.4*(level-1));g.researched=wave>=30?Object.keys(TECHNOLOGIES):[];
  for(let i=0;i<16;i++){const b=g.addBuilding('house',g.world.start.x-10+i%8*3,g.world.start.y+10+Math.floor(i/8)*3,true);b.level=level;}
  if(formation!=='open'){
    const start=g.world.start;
    for(let i=-6;i<=6;i++)for(const [x,y] of [[start.x+i,start.y-6],[start.x+i,start.y+6],...(Math.abs(i)<6?[[start.x-6,start.y+i],[start.x+6,start.y+i]]:[])]){const b=g.addBuilding(i===0?'gate':'wall',x,y,true);b.level=level;b.hp=b.maxHp=1400*(1+.4*(level-1));}
    for(let i=0;i<(endgame?12:8);i++){const angle=i*Math.PI*2/(endgame?12:8),x=Math.round(start.x+Math.cos(angle)*4),y=Math.round(start.y+Math.sin(angle)*4);const b=g.addBuilding(endgame?'ballista':'tower',x,y,true);b.level=level;b.rangeLevel=formation==='citadel'?4:endgame?2:1;b.damageLevel=formation==='citadel'?4:endgame?2:1;}
  }
  if(formation==='citadel')for(let y=g.world.start.y-11;y<=g.world.start.y+9;y+=4)for(let x=g.world.start.x-11;x<=g.world.start.x+9;x+=4){if(Math.hypot(x-g.world.start.x,y-g.world.start.y)<8)continue;if(!g.world.valid('ballista',x,y,g.buildings))continue;const b=g.addBuilding('ballista',x,y,true);b.level=5;b.rangeLevel=4;b.damageLevel=4;}
  for(let i=0;i<count;i++){const angle=i*Math.PI*2/count,r=formation==='citadel'?130+(i%4)*50:formation==='fortified'?130+(i%3)*25:100;const type=i%4===0?'knight':wave>=30?'crossbow':'archer';const p=g.nearestOpenLand({x:g.keep.x+Math.cos(angle)*r,y:g.keep.y+Math.sin(angle)*r},150);const u=g.addUnit(type,p.x,p.y);u.stance='defend';}
  g.resources.food=700;g.wave=wave-1;if(wave>50)g.breakSeal();g.startWave();
  g.captureSnapshots=formation==='citadel';
  const startingArmy=g.units.length,startingStructures=g.buildings.length;
  const policy=dodge?(g,t)=>{for(const u of g.units){const hazard=g.hazards.find(h=>h.remaining>0&&Math.hypot(u.x-h.x,u.y-h.y)<h.radius+20&&(!h.inner||Math.hypot(u.x-h.x,u.y-h.y)>h.inner-20));if(!hazard||u.target)continue;
    const angle=Math.atan2(u.y-hazard.y,u.x-hazard.x),radius=hazard.radius+65,point=g.nearestOpenLand({x:hazard.x+Math.cos(angle)*radius,y:hazard.y+Math.sin(angle)*radius},120);
    if(point){g.selected=[u.id];g.command(point);}}
  }:null;
  const result={scenario:'established-kingdom',waveRequested:wave,difficulty,formation,dodge,startingArmy,startingStructures,...run(g,300,policy,true)};if(g.routeChecks)result.routeChecks=g.routeChecks;results.push(result);console.log(JSON.stringify(result));return g;
}
await mkdir('artifacts/playtest',{recursive:true});
if(!process.argv.includes('--encounters')&&!process.argv.includes('--finale'))for(const difficulty of ['easy','normal','hard','nightmare'])for(const seed of [42,707])opening(seed,difficulty);
if(!process.argv.includes('--openings')&&!process.argv.includes('--finale'))for(const [wave,difficulty] of [[10,'hard'],[30,'hard'],[50,'hard'],[55,'nightmare'],[60,'nightmare']])for(const [formation,dodge] of [['open',false],['fortified',true]])encounter(wave,difficulty,formation,dodge);
if(!process.argv.includes('--openings'))encounter(60,'nightmare','citadel',true);
await writeFile('artifacts/playtest/'+(process.argv.includes('--openings')?'openings':process.argv.includes('--finale')?'finale':'encounters')+'.json',JSON.stringify(results,null,2));
