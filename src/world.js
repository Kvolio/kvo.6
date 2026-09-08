import {TILE,COLS,ROWS,BUILDINGS} from './data.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function random(seed) { return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}; }
export class World {
 constructor(seed=Date.now()){this.seed=seed;this.tiles=[];const rng=random(seed);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  const coast=8+Math.sin(x*.15)*2+Math.cos(x*.37);let type=y<coast?'water':y<coast+2?'sand':'grass';let resource=null;
  if(type==='grass'&&Math.hypot(x-32,y-28)>5){const n=rng();if(n<.11+(Math.sin(x*.3)*Math.cos(y*.24)+1)*.07)resource='wood';else if(n>.955)resource='stone';else if(n>.94)resource='iron';else if(n>.932)resource='gold';}
  this.tiles.push({x,y,type,resource,amount:resource==='wood'?300:1400,shade:rng()});
 } }
 tile(x,y){return this.tiles[Math.floor(y)*COLS+Math.floor(x)];}
 at(px,py){if(px<0||py<0||px>=COLS*TILE||py>=ROWS*TILE)return null;return this.tile(Math.floor(px/TILE),Math.floor(py/TILE));}
 buildingAt(buildings,x,y){return buildings.find(b=>b.hp>0&&x>=b.tx&&y>=b.ty&&x<b.tx+BUILDINGS[b.type].size&&y<b.ty+BUILDINGS[b.type].size);}
 valid(type,tx,ty,buildings){const d=BUILDINGS[type];if(!d||!Number.isInteger(tx)||!Number.isInteger(ty)||tx<0||ty<0||tx+d.size>COLS||ty+d.size>ROWS)return false;
  for(let y=ty;y<ty+d.size;y++)for(let x=tx;x<tx+d.size;x++){const t=this.tile(x,y);if(t.type==='water'||this.buildingAt(buildings,x,y))return false;}
  if(d.resource&&d.resource!=='food'&&!this.tiles.some(t=>t.resource===d.resource&&t.amount>0&&Math.hypot(t.x-tx,t.y-ty)<8))return false;
  return true;
 }
 // Breadth-first routing on a small fixed grid. Enemy paths may break structures,
 // but movement always stops at the first blocking structure to attack it.
 path(from,to,buildings,{enemy=false,flying=false}={}){
  const sx=clamp(Math.floor(from.x/TILE),0,COLS-1),sy=clamp(Math.floor(from.y/TILE),0,ROWS-1),gx=clamp(Math.floor(to.x/TILE),0,COLS-1),gy=clamp(Math.floor(to.y/TILE),0,ROWS-1);
  if(flying)return [{x:to.x,y:to.y}];
  const blocked=new Set();for(const b of buildings){if(b.hp<=0||b.type==='road'||(!enemy&&b.type==='gate'))continue;const size=BUILDINGS[b.type].size;for(let y=b.ty;y<b.ty+size;y++)for(let x=b.tx;x<b.tx+size;x++)blocked.add(y*COLS+x);}
  const goal=gy*COLS+gx,start=sy*COLS+sx;
  const search=(breakWalls)=>{const prev=new Int32Array(COLS*ROWS).fill(-1),queue=[start];prev[start]=start;let found=-1;
   for(let head=0;head<queue.length;head++){const id=queue[head],x=id%COLS,y=Math.floor(id/COLS);if(id===goal||(blocked.has(goal)&&Math.abs(x-gx)+Math.abs(y-gy)<=1)){found=id;break;}
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;const ni=ny*COLS+nx;if(prev[ni]!==-1||this.tiles[ni].type==='water'||(!breakWalls&&blocked.has(ni)))continue;prev[ni]=id;queue.push(ni);}
   }
   if(found<0)return null;const result=[];for(let id=found;id!==start;id=prev[id])result.push({x:(id%COLS+.5)*TILE,y:(Math.floor(id/COLS)+.5)*TILE});return result.reverse();};
  return search(false)||(enemy?search(true):null)||[];
 }
}
