import {BUILDINGS,TILE} from './data.js';
import {distance} from './world.js';

export const LINE_BUILDINGS = ['road','palisade','wall','gate'];

// Cardinal tile runs avoid holes in defensive lines, including diagonal drags.
export function constructionLine(from,to){
  const cells=[{tx:from.tx,ty:from.ty}];let {tx,ty}=from;
  const horizontal=Math.abs(to.tx-tx)>=Math.abs(to.ty-ty);
  const step=axis=>{while((axis==='tx'?tx:ty)!==to[axis]){
    if(axis==='tx')tx+=Math.sign(to.tx-tx);else ty+=Math.sign(to.ty-ty);
    cells.push({tx,ty});
  }};
  step(horizontal?'tx':'ty');step(horizontal?'ty':'tx');return cells;
}

export const Construction = {
  connectionMask(b,layout=this.buildings){
    const family=b.type==='road'?['road']:['wall','palisade','gate','tower','ballista'];
    let mask=0;for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]]){
      const size=BUILDINGS[b.type].size;for(let i=0;i<size;i++){const x=dx<0?b.tx-1:dx>0?b.tx+size:b.tx+i,y=dy<0?b.ty-1:dy>0?b.ty+size:b.ty+i;const neighbor=this.world.buildingAt(layout,x,y);if(neighbor&&family.includes(neighbor.type))mask|=bit;}
    }
    return mask||((b.rotation||0)%2?5:10);
  },
  planConstruction(type,cells,rotation=0){
    const d=BUILDINGS[type],cost={},sites=[],layout=[...this.buildings];
    const fail=reason=>({reason,cost,sites});
    if(this.over||!d||type==='keep')return fail('This building cannot be placed.');
    if((d.level||1)>this.level)return fail(`Requires Keep level ${d.level}.`);
    if(type==='temple'&&(this.buildings.some(b=>b.type==='temple'&&b.hp>0)||cells?.length>1))return fail('Only one Temple may stand in a kingdom.');
    if(!Array.isArray(cells)||!cells.length||cells.length>256)return fail('Choose a shorter building line.');
    const seen=new Set();
    for(const cell of cells){
      const {tx,ty}=cell,key=`${tx},${ty}`;if(seen.has(key))continue;seen.add(key);
      const existing=this.world.buildingAt(layout,tx,ty);
      if(LINE_BUILDINGS.includes(type)&&existing?.type===type)continue;
      const reason=this.world.placementReason(type,tx,ty,layout);if(reason)return fail(reason);
      const site={type,tx,ty,rotation:((rotation%4)+4)%4,hp:1,id:-sites.length-1};sites.push(site);layout.push(site);
      for(const [r,n]of Object.entries(d.cost))cost[r]=(cost[r]||0)+n;
    }
    if(!sites.length)return fail('These sections are already built or queued.');
    if(!this.afford(cost))return fail('Not enough resources for the whole plan.');
    const evacuations=[],occupied=this.world.blocked(layout);
    if(!['road','gate'].includes(type))for(const u of [...this.units,...this.enemies]){
      if(u.hp<=0||this.isAirborne(u)||!sites.some(s=>u.x>=s.tx*TILE&&u.y>=s.ty*TILE&&u.x<(s.tx+d.size)*TILE&&u.y<(s.ty+d.size)*TILE))continue;
      // Search the existing connected region before the footprint becomes solid.
      const reachable=this.world.reachable(u,this.buildings,this.revision);
      let point=null,nearest=Infinity;for(const id of reachable){if(occupied.has(id))continue;const t=this.world.tiles[id],p={x:(t.x+.5)*TILE,y:(t.y+.5)*TILE},d=distance(p,u);if(d<nearest){nearest=d;point=p;}}
      if(!point)return fail('Leave room beside this site for units to move out.');
      evacuations.push({u,point});
    }
    return {reason:'',cost,sites,evacuations};
  },
  placeBatch(type,cells,rotation=0){
    const plan=this.planConstruction(type,cells,rotation);
    if(plan.reason){this.notice(plan.reason);return false;}
    this.spend(plan.cost);this.noteAction();
    for(const {u,point} of plan.evacuations){Object.assign(u,point);u.path=[];u.pathRevision=-1;}
    for(const site of plan.sites){site.coveredResources=[];for(let y=site.ty;y<site.ty+BUILDINGS[type].size;y++)for(let x=site.tx;x<site.tx+BUILDINGS[type].size;x++){const t=this.world.tile(x,y);if(t.resource)site.coveredResources.push({x,y,resource:t.resource,amount:t.amount});Object.assign(t,{resource:null,amount:0,clearing:false});}}
    const result=plan.sites.map(site=>{const b=this.addBuilding(type,site.tx,site.ty);b.rotation=site.rotation;b.coveredResources=site.coveredResources;return b;});
    this.stats.built+=result.length;this.scheduleConstruction();this.sound('build');
    this.notice(`${result.length>1?result.length+' sections':BUILDINGS[type].name} queued. Workers will build automatically.`);
    return result;
  },
  place(type,tx,ty,rotation=0){return this.placeBatch(type,[{tx,ty}],rotation)?.[0]||false;},
  upgradeCost(b,kind='building'){
    const level=kind==='building'?b.level:(b[kind+'Level']||0)+1;
    return kind==='building'?{wood:100*level,stone:100*level,gold:50*level}:{wood:40*level,stone:35*level,iron:15*level};
  },
  upgrade(b,kind='building'){
    if(!b||!b.complete||b.hp<=0||b.upgrade||!['building','range','damage'].includes(kind))return false;
    if(kind==='building'?b.level>=5:!BUILDINGS[b.type].damage||(b[kind+'Level']||0)>=4)return false;
    const cost=this.upgradeCost(b,kind);if(!this.spend(cost)){this.notice('Not enough resources for this upgrade.');return false;}
    this.noteAction();b.upgrade={kind,progress:0,duration:12+8*b.level,cost};this.scheduleConstruction();
    this.notice('Upgrade queued. Workers will complete it on site.');return true;
  },
  cancelUpgrade(b){
    if(!b?.upgrade)return false;
    for(const [r,n]of Object.entries(b.upgrade.cost))this.resources[r]=Math.min(this.storage,this.resources[r]+Math.floor(n*.8));
    b.upgrade=null;for(const u of this.units)if(u.job?.building===b.id&&u.job.kind==='upgrade')this.finishConstructionJob(u);
    return true;
  },
  towerRange(b){return (BUILDINGS[b.type].range||0)*(b.type==='keep'?(this.keepPerk.range||1):1)*(1+.15*(b.rangeLevel||0)+this.researchBonus('range'));},
  towerDamage(b){return (BUILDINGS[b.type].damage||0)*(b.type==='keep'?(this.keepPerk.damage||1):1)*b.level*(1+.2*(b.damageLevel||0))*(1+this.tech*.15)*(1+this.researchBonus('tower'));},
  clearResource(tileId){
    const tile=this.world.tiles[tileId];if(!tile?.resource||tile.amount<=0)return false;
    if(tile.resource==='iron'||tile.resource==='gold')if(this.level<2){this.notice('Upgrade the Keep to level 2 to extract this mineral.');return false;}
    this.noteAction();tile.clearing=true;this.scheduleConstruction();this.notice('Clearing queued. Workers will extract and deliver the resource so the resources can be recovered.');return true;
  },
  finishConstructionJob(u){
    const previous=u.returnJob;u.returnJob=null;u.job=null;u.path=[];u.pathRevision=-1;
    if(previous&&this.buildings.some(b=>b.id===previous.building&&b.hp>0))u.job=previous;
  },
  scheduleConstruction(){
    const tasks=this.buildings.filter(b=>b.hp>0&&(!b.complete||b.upgrade)).map(b=>({building:b.id,kind:b.complete?'upgrade':'build',b}));
    for(let i=0;i<this.world.tiles.length;i++)if(this.world.tiles[i].clearing)tasks.push({kind:'clear',tile:i});
    const workers=this.units.filter(u=>u.type==='worker'&&u.hp>0);
    // Two builders per site; take a gathering worker only between cargo runs.
    // A direct movement command remains under the player's control.
    for(const task of tasks){
      const assigned=workers.filter(u=>u.job?.kind===task.kind&&(task.kind==='clear'?u.job.tile===task.tile:u.job.building===task.building));
      let needed=2-assigned.length;if(needed<=0)continue;
      const tile=this.world.tiles[task.tile],point=task.b||{x:(tile.x+.5)*TILE,y:(tile.y+.5)*TILE};
      const candidates=workers.filter(u=>!u.target&&(!u.job||u.job.kind==='gather'&&!u.job.carry)).sort((a,b)=>Number(!!a.job)-Number(!!b.job)||distance(a,point)-distance(b,point));
      for(const u of candidates){
        const reachable=task.b?this.accessiblePoint(u,task.b):this.world.reachable(u,this.buildings,this.revision).has(task.tile);
        if(!reachable)continue;
        u.returnJob=u.job;u.job={building:task.building,kind:task.kind,tile:task.tile,stage:'travel',clock:0,carry:0};u.path=[];u.pathRevision=-1;
        if(--needed===0)break;
      }
    }
  },
  constructionWorker(u,dt){
    const job=u.job;if(!job||!['build','upgrade','clear'].includes(job.kind))return false;
    if(job.kind==='clear'){
      const tile=this.world.tiles[job.tile];
      if(job.carry>0&&(!tile?.resource||tile.amount<=0))job.stage='return';
      if(job.carry>0&&job.stage==='return'){
        const points=this.buildings.filter(b=>b.complete&&['keep','warehouse'].includes(b.type)).map(b=>this.accessiblePoint(u,b)).filter(Boolean).sort((a,b)=>distance(u,a)-distance(u,b));
        if(!points.length){this.workerWarning(job,'Clearing blocked: no reachable storage.');return true;}
        if(this.move(u,points[0],dt)){
          const amount=Math.min(job.carry,Math.max(0,this.storage-this.resources[job.resource]));
          this.resources[job.resource]+=amount;this.stats.gathered+=amount;job.carry-=amount;
          if(job.carry<=0){job.stage='travel';job.warning=null;}else this.workerWarning(job,'Storage is full. Spend resources or build a Warehouse.');
        }return true;
      }
      if(!tile?.resource||tile.amount<=0){if(tile)tile.clearing=false;this.finishConstructionJob(u);return true;}
      const point={x:(tile.x+.5)*TILE,y:(tile.y+.5)*TILE};
      if(!this.world.reachable(u,this.buildings,this.revision).has(job.tile)){this.workerWarning(job,'Clearing blocked: open a route to the deposit.');return true;}
      if(!this.move(u,point,dt))return true;
      job.clock+=dt;if(job.clock>=1){job.clock-=1;const amount=Math.min(tile.amount,tile.resource==='wood'?12:8);job.resource=tile.resource;this.sound(tile.resource==='wood'?'chop':'mine');tile.amount-=amount;job.carry+=amount;
        if(tile.amount<=0){tile.resource=null;tile.clearing=false;this.revision++;}
        if(job.carry>=32||tile.amount<=0){job.stage='return';u.path=[];}
        this.effects.push({x:u.x,y:u.y,kind:'gather',life:.4,max:.4});
      }return true;
    }
    const b=this.buildings.find(b=>b.id===job.building&&b.hp>0);
    if(!b||job.kind==='build'&&b.complete||job.kind==='upgrade'&&!b.upgrade){this.finishConstructionJob(u);return true;}
    const point=this.accessiblePoint(u,b);
    if(!point){this.workerWarning(job,'Construction blocked: open a route beside the site.');this.finishConstructionJob(u);return true;}
    if(!this.move(u,point,dt))return true;
    job.soundClock=(job.soundClock||0)-dt;if(job.soundClock<=0){job.soundClock=1.2;this.sound('hammer');}
    if(job.kind==='upgrade'){
      b.upgrade.progress+=dt;if(b.upgrade.progress<b.upgrade.duration)return true;
      const kind=b.upgrade.kind;
      if(kind==='building'){b.level++;b.maxHp+=BUILDINGS[b.type].hp*.4;b.hp=Math.min(b.maxHp,b.hp+BUILDINGS[b.type].hp*.4);}
      else b[kind+'Level']=(b[kind+'Level']||0)+1;
      b.upgrade=null;this.notice(`${BUILDINGS[b.type].name} upgrade completed.`);
    }else{
      b.progress+=dt;if(b.progress<BUILDINGS[b.type].time)return true;
      b.complete=true;delete b.coveredResources;this.revision++;if(this.researched.includes('masonry'))this.raiseBuildingLevel(b,2);this.notice(`${BUILDINGS[b.type].name} completed.`);
    }
    this.sound('build');
    for(const w of this.units.filter(w=>w.job?.building===b.id&&['build','upgrade'].includes(w.job.kind))){
      this.finishConstructionJob(w);
      if(!w.job&&BUILDINGS[b.type].resource)this.assign(w,b,'gather');
    }
    return true;
  }
};
