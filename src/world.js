import {TILE,COLS,ROWS,BUILDINGS} from './data.js';
import {islandTerrain} from './terrain.js';
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export function random(seed) {
  return () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
}
export const TERRAIN = {
  grass:{walkable:true,buildable:true}, sand:{walkable:true,buildable:true},
  foothill:{walkable:true,buildable:true}, mountain:{walkable:false,buildable:false},
  water:{walkable:false,buildable:false}
};
export class World {
  constructor(seed=Date.now(),savedTiles=null,options={}) {
    this.seed=seed; this.tiles=[]; this.reachCache=new Map();this.island=options.island??(!savedTiles&&['hard','nightmare'].includes(options.difficulty));this.cols=options.cols||(this.island?96:COLS);this.rows=options.rows||(this.island?72:ROWS);this.start={x:Math.floor(this.cols/2),y:this.island?Math.floor(this.rows*.56):28};
    if(savedTiles){this.tiles=savedTiles;return;}
    const rng=random(seed);
    if(this.island){islandTerrain(this,rng);return;}
    for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){
      const coast=8+Math.sin(x*.15)*2+Math.cos(x*.37);
      this.tiles.push({x,y,type:y<coast?'water':y<coast+2?'sand':'grass',resource:null,amount:0,shade:rng(),elevation:0});
    }
    // Connected ridge spines, kept outside the starting settlement.
    this.ranges=[];
    const count=rng()<.5?2:3;
    for(let i=0;i<count;i++){
      const phase=rng()*6.28, points=[];
      for(let j=0;j<22;j++) points.push(i<2
        ? {x:(i===0?12:50)+Math.sin(j*.2+phase)*3,y:17+j}
        : {x:23+j,y:42+Math.sin(j*.23+phase)*1.3});
      this.ranges.push(points);
      for(const t of this.tiles){
        if(t.type==='water'||t.type==='sand'||Math.hypot(t.x-32,t.y-28)<=8)continue;
        const d=Math.min(...points.map(p=>Math.hypot(t.x-p.x,t.y-p.y)));
        t.elevation=Math.max(t.elevation,clamp(1-d/4.6,0,1));
        if(d<1.65)t.type='mountain';else if(d<4.6&&t.type!=='mountain')t.type='foothill';
      }
      // A useful traversable pass through each range, two tiles wide.
      const mid=points[9+Math.floor(rng()*4)];
      for(const t of this.tiles)if(t.type==='mountain'&&(i<2?Math.abs(t.y-Math.floor(mid.y))<1.1:Math.abs(t.x-Math.floor(mid.x))<1.1)){
        t.type='foothill';t.elevation=.2;t.pass=true;
      }
    }
    this.connectLand();
    for(const t of this.tiles){
      if(!this.walkable(t)||t.type==='sand'||Math.hypot(t.x-32,t.y-28)<5)continue;
      const n=rng();
      if(t.type==='foothill')t.resource=n<.20?'stone':n<.28?'iron':n<.32?'gold':n>.90?'wood':null;
      else t.resource=n<.11+(Math.sin(t.x*.3)*Math.cos(t.y*.24)+1)*.07?'wood':n>.994?'stone':n>.993?'iron':n>.9925?'gold':null;
      t.amount=t.resource==='wood'?300:t.resource?(t.type==='foothill'?2100:1400):0;
    }
    for(const [x,y,resource] of [[26,29,'wood'],[26,30,'wood'],[27,31,'wood'],[38,28,'stone'],[38,29,'stone']]){
      Object.assign(this.tile(x,y),{type:'grass',resource,amount:resource==='wood'?300:1400,elevation:0});
    }
  }
  tile(x,y){if(x<0||y<0||x>=this.cols||y>=this.rows)return null;return this.tiles[Math.floor(y)*this.cols+Math.floor(x)];}
  at(x,y){return this.tile(Math.floor(x/TILE),Math.floor(y/TILE));}
  landingSites(){
    if(this.landingCache)return this.landingCache;
    const sites=[],sides=this.island?['north','east','south','west']:['north'];
    for(const side of sides)for(const fraction of [.28,.5,.72]){
      const vertical=side==='north'||side==='south',direction=side==='north'||side==='west'?1:-1;
      const across=Math.floor((vertical?this.cols:this.rows)*fraction),length=vertical?this.rows:this.cols;
      for(let step=0;step<length;step++){
        const along=direction>0?step:length-1-step,t=vertical?this.tile(across,along):this.tile(along,across);
        if(t.type==='water')continue;
        if(this.walkable(t)){
          const dx=vertical?0:direction,dy=vertical?direction:0,x=(t.x+.5)*TILE,y=(t.y+.5)*TILE;
          sites.push({side,x,y,dx,dy,seaX:vertical?x:direction>0?-80:this.cols*TILE+80,seaY:vertical?(direction>0?-80:this.rows*TILE+80):y,targetX:x-dx*TILE*.65,targetY:y-dy*TILE*.65});
        }break;
      }
    }
    this.landingCache=sites;return sites;
  }
  walkable(tile){return !!TERRAIN[tile?.type]?.walkable;}
  buildable(tile){return !!TERRAIN[tile?.type]?.buildable;}
  neighbors(id){const x=id%this.cols,y=Math.floor(id/this.cols);return [x>0?id-1:-1,x<this.cols-1?id+1:-1,y>0?id-this.cols:-1,y<this.rows-1?id+this.cols:-1].filter(n=>n>=0);}
  flood(start,blocked=new Set()){
    const seen=new Set();if(!this.walkable(this.tiles[start])||blocked.has(start))return seen;
    const queue=[start];seen.add(start);
    for(let head=0;head<queue.length;head++)for(const id of this.neighbors(queue[head])){
      if(!seen.has(id)&&!blocked.has(id)&&this.walkable(this.tiles[id])){seen.add(id);queue.push(id);}
    }
    return seen;
  }
  connectLand(){
    let connected=this.flood(this.start.y*this.cols+this.start.x);
    while(true){
      const target=this.tiles.findIndex((t,id)=>this.walkable(t)&&!connected.has(id));if(target<0)break;
      const prev=new Int32Array(this.cols*this.rows).fill(-1),queue=[target];prev[target]=target;let end=-1;
      for(let head=0;head<queue.length&&end<0;head++)for(const next of this.neighbors(queue[head])){
        if(prev[next]!==-1||this.tiles[next].type==='water')continue;
        prev[next]=queue[head];queue.push(next);if(connected.has(next)){end=next;break;}
      }
      if(end<0)throw Error('Disconnected land cannot be joined');
      for(let id=end;;id=prev[id]){
        const t=this.tiles[id];
        for(const n of [t,this.tile(t.x+1,t.y)])if(n?.type==='mountain')Object.assign(n,{type:'foothill',elevation:.2,pass:true});
        if(id===target)break;
      }
      connected=this.flood(this.start.y*this.cols+this.start.x);
    }
  }
  buildingAt(buildings,x,y){return buildings.find(b=>b.hp>0&&x>=b.tx&&y>=b.ty&&x<b.tx+BUILDINGS[b.type].size&&y<b.ty+BUILDINGS[b.type].size);}
  blocked(buildings,enemy=false){
    const result=new Set();
    for(const b of buildings){if(b.hp<=0||b.type==='road'||(!enemy&&b.type==='gate'))continue;const size=BUILDINGS[b.type].size;
      for(let y=b.ty;y<b.ty+size;y++)for(let x=b.tx;x<b.tx+size;x++)result.add(y*this.cols+x);
    }
    return result;
  }
  reachable(from,buildings,revision=null){
    const start=Math.floor(from.y/TILE)*this.cols+Math.floor(from.x/TILE);
    const version=revision??buildings.filter(b=>b.hp>0).map(b=>`${b.id}:${b.type}:${b.tx}:${b.ty}`).join(';');
    if(this.cacheVersion!==version){this.reachCache.clear();this.cacheVersion=version;}
    if(!this.reachCache.has(start)){if(this.reachCache.size>128)this.reachCache.clear();this.reachCache.set(start,this.flood(start,this.blocked(buildings)));}
    return this.reachCache.get(start);
  }
  accessPoints(b,buildings){
    const size=BUILDINGS[b.type].size,points=[];
    for(let y=b.ty-1;y<=b.ty+size;y++)for(let x=b.tx-1;x<=b.tx+size;x++){
      if(x>=b.tx&&x<b.tx+size&&y>=b.ty&&y<b.ty+size)continue;
      if((x<b.tx||x>=b.tx+size)&&(y<b.ty||y>=b.ty+size))continue;
      const block=this.buildingAt(buildings,x,y);
      if(this.walkable(this.tile(x,y))&&(!block||['gate','road'].includes(block.type)))points.push({x:(x+.5)*TILE,y:(y+.5)*TILE});
    }
    return points;
  }
  deposits(resource,b,from,buildings,revision=null){
    const reachable=this.reachable(from,buildings,revision);
    return this.tiles.filter((t,id)=>t.resource===resource&&t.amount>0&&Math.hypot(t.x-b.tx,t.y-b.ty)<8&&reachable.has(id))
      .sort((a,c)=>Math.hypot(a.x+.5-from.x/TILE,a.y+.5-from.y/TILE)-Math.hypot(c.x+.5-from.x/TILE,c.y+.5-from.y/TILE));
  }
  placementReason(type,tx,ty,buildings){
    const d=BUILDINGS[type];
    if(!d||!Number.isInteger(tx)||!Number.isInteger(ty)||tx<0||ty<0||tx+d.size>this.cols||ty+d.size>this.rows)return 'Choose a site inside the kingdom.';
    for(let y=ty;y<ty+d.size;y++)for(let x=tx;x<tx+d.size;x++){
      if(!this.buildable(this.tile(x,y)))return this.tile(x,y)?.type==='mountain'?'Peaks cannot be built on. Use the foothills.':'Buildings need dry land.';
      if(this.buildingAt(buildings,x,y))return 'Another building occupies this site.';
      if(this.tile(x,y)?.resource&&this.tile(x,y).amount>0)return 'Clear the resources on this site before building.';
    }
    if(d.resource&&d.resource!=='food'){
      const proposed={id:-1,type,tx,ty,hp:1},layout=[...buildings,proposed];
      if(!this.accessPoints(proposed,layout).some(p=>this.deposits(d.resource,proposed,p,layout).length))return `No reachable ${d.resource} deposits within 8 tiles.`;
    }
    return '';
  }
  valid(type,tx,ty,buildings){return !this.placementReason(type,tx,ty,buildings);}
  path(from,to,buildings,{enemy=false,flying=false,revision=null}={}){
    if(flying)return [{x:to.x,y:to.y}];
    const startTile=this.at(from.x,from.y),goalTile=this.at(to.x,to.y);
    if(!this.walkable(startTile)||!this.walkable(goalTile))return [];
    const start=startTile.y*this.cols+startTile.x,goal=goalTile.y*this.cols+goalTile.x;
    // The simulation supplies its terrain/building revision. Unversioned
    // callers always search fresh, including editors and compatibility tests.
    // A structure can die during combat before clean() advances the revision.
    // Include live occupancy so later attackers in that same frame see the gap.
    const topology=revision==null?null:`${revision}:${buildings.reduce((n,b)=>n+(b.hp>0?1:0),0)}`;
    if(topology!=null&&this.routeRevision!==topology){this.routeRevision=topology;this.routeCache=new Map();this.routeBlocks=[this.blocked(buildings),this.blocked(buildings,true)];}
    const routeKey=`${enemy?1:0}:${start}:${goal}`,cached=revision!=null?this.routeCache?.get(routeKey):null;
    if(cached)return cached.map(p=>({...p}));
    const blocked=revision!=null?this.routeBlocks[enemy?1:0]:this.blocked(buildings,enemy);
    // An attack route may finish at its target structure, while every other
    // building remains solid. Otherwise searching for the occupied center
    // always fails and needlessly selects the wall-breaking fallback.
    const targetBuilding=enemy?this.buildingAt(buildings,goalTile.x,goalTile.y):null,targetCells=new Set();
    if(targetBuilding){const n=BUILDINGS[targetBuilding.type].size;for(let y=targetBuilding.ty;y<targetBuilding.ty+n;y++)for(let x=targetBuilding.tx;x<targetBuilding.tx+n;x++)targetCells.add(y*this.cols+x);}
    const search=breakWalls=>{
      const prev=new Int32Array(this.cols*this.rows).fill(-1),queue=[start];prev[start]=start;let found=-1;
      for(let head=0;head<queue.length;head++){
        const id=queue[head];if(id===goal){found=id;break;}
        for(const next of this.neighbors(id)){
          if(prev[next]!==-1||!this.walkable(this.tiles[next])||(!breakWalls&&blocked.has(next)&&!targetCells.has(next)))continue;
          prev[next]=id;queue.push(next);
        }
      }
      if(found<0)return null;const result=[];
      for(let id=found;id!==start;id=prev[id])result.push({x:(id%this.cols+.5)*TILE,y:(Math.floor(id/this.cols)+.5)*TILE});
      return result.reverse();
    };
    const result=search(false)||(enemy?search(true):null)||[];
    if(revision!=null){if(this.routeCache.size>=2048)this.routeCache.delete(this.routeCache.keys().next().value);this.routeCache.set(routeKey,result.map(p=>({...p})));}
    return result;
  }
}
