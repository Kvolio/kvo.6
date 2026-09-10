import {BUILDINGS,TILE,UNITS} from './data.js';
import {distance} from './world.js';
const PLATFORM_TYPES=['wall','palisade','gate','tower','ballista'];
export const Garrison={
 isWallPlatform(b){return !!b&&b.hp>0&&b.complete&&PLATFORM_TYPES.includes(b.type);},
 wallCapacity(b){return ['tower','ballista'].includes(b.type)?4:2;},
 wallOccupants(b){return this.units.filter(u=>u.hp>0&&(u.garrison===b.id||u.mountOrder===b.id));},
 wallNeighbors(b){const n=BUILDINGS[b.type].size;return this.buildings.filter(v=>this.isWallPlatform(v)&&v!==b&&((v.tx+BUILDINGS[v.type].size===b.tx||b.tx+n===v.tx)&&v.ty<b.ty+n&&v.ty+BUILDINGS[v.type].size>b.ty||(v.ty+BUILDINGS[v.type].size===b.ty||b.ty+n===v.ty)&&v.tx<b.tx+n&&v.tx+BUILDINGS[v.type].size>b.tx));},
 wallPath(from,to){const origin=this.buildings.find(b=>b.id===from);if(!this.isWallPlatform(origin))return null;const queue=[origin],prev=new Map([[from,null]]);for(let i=0;i<queue.length;i++){const b=queue[i];if(b.id===to){const path=[];for(let id=to;id!==from;id=prev.get(id))path.push(id);return path.reverse();}for(const next of this.wallNeighbors(b))if(!prev.has(next.id)){prev.set(next.id,b.id);queue.push(next);}}return null;},
 garrison(b,ids=this.selected){
  if(!ids.some(id=>this.units.some(u=>u.id===id&&['archer','crossbow'].includes(u.type)))){this.notice('Only foot archers and crossbowmen can use wall platforms.');return false;}
  if(!this.isWallPlatform(b)){this.notice('Choose a completed wall, gate or tower.');return false;}let assigned=0;
  for(const u of this.units.filter(u=>ids.includes(u.id)&&['archer','crossbow'].includes(u.type))){
   if(u.garrison===b.id||u.mountOrder===b.id)continue;if(this.wallOccupants(b).length>=this.wallCapacity(b))break;
   if(u.garrison){const route=this.wallPath(u.garrison,b.id);if(route){u.wallRoute=route;u.mountOrder=b.id;u.target=null;u.path=[];u.stance='hold';assigned++;continue;}if(!this.dismount(u))continue;}
   const platforms=this.buildings.filter(v=>this.isWallPlatform(v)&&this.wallPath(v.id,b.id)!==null).sort((a,c)=>distance(a,u)-distance(c,u));
   let entry=null,entrance=null;for(const v of platforms){const p=this.accessiblePoint(u,v);if(p){entry=v;entrance=p;break;}}
   if(!entry)continue;u.mountOrder=b.id;u.mountEntry=entry.id;u.garrisonEntry=entrance;u.target=null;u.path=[];u.stance='hold';assigned++;
  }
  if(assigned)this.noteAction();this.notice(assigned?assigned+' ranged defenders are repositioning.':'Choose a reachable wall platform with free places.');return assigned>0;
 },
 dismount(u,fallen=false){
  if(!u.garrison){u.mountOrder=null;u.wallRoute=null;return true;}
  const b=this.buildings.find(b=>b.id===u.garrison),tile=this.world.at(u.x,u.y),origin=b||{type:'wall',tx:tile.x,ty:tile.y};
  const candidates=this.world.accessPoints(origin,this.buildings);
  if(fallen&&tile&&this.world.walkable(tile)&&!this.world.buildingAt(this.buildings,tile.x,tile.y))candidates.push({x:(tile.x+.5)*TILE,y:(tile.y+.5)*TILE});
  const point=candidates.sort((a,b)=>distance(a,u.garrisonEntry||u)-distance(b,u.garrisonEntry||u))[0];
  if(!point){this.notice('This wall has no open exit. Reposition along the wall to an exit.');return false;}
  Object.assign(u,{x:point.x,y:point.y,garrison:null,mountOrder:null,mountEntry:null,wallRoute:null,path:[],pathRevision:-1,stance:'defend'});if(fallen)u.hp-=Math.min(u.maxHp*.25,25);return true;
 },
 updateGarrison(u,dt){
  if(u.garrison){
   const b=this.buildings.find(b=>b.id===u.garrison&&b.hp>0);if(!b){this.dismount(u,true);return false;}
   if(!u.mountOrder||u.mountOrder===u.garrison){u.mountOrder=null;u.wallRoute=null;return false;}
   const route=this.wallPath(u.garrison,u.mountOrder);if(!route?.length){u.x=b.x;u.y=b.y;u.mountOrder=null;u.wallRoute=null;return false;}u.wallRoute=route;
   const next=this.buildings.find(b=>b.id===route[0]),len=distance(u,next),step=Math.min(len,UNITS[u.type].speed*.85*dt);if(len){u.facing=Math.atan2(next.y-u.y,next.x-u.x);u.x+=(next.x-u.x)/len*step;u.y+=(next.y-u.y)/len*step;}
   if(len<=step+.1){u.garrison=next.id;if(next.id===u.mountOrder){const slot=this.units.filter(v=>v.garrison===next.id).indexOf(u);u.x+=slot%2?8:-8;u.y+=slot>1?8:-3;u.mountOrder=null;u.wallRoute=null;}}
   return true;
  }
  if(!u.mountOrder)return false;
  const entry=this.buildings.find(b=>b.id===(u.mountEntry||u.mountOrder)),goal=this.buildings.find(b=>b.id===u.mountOrder);if(!this.isWallPlatform(entry)||!this.isWallPlatform(goal)){u.mountOrder=null;return false;}
  const entrance=this.accessiblePoint(u,entry);if(!entrance){u.mountOrder=null;this.notice('The route to this wall is blocked.');return false;}
  if(this.move(u,entrance,dt)){const slot=this.units.filter(v=>v.garrison===entry.id).length;u.garrison=entry.id;u.garrisonEntry=entrance;u.x=entry.x+(slot%2?8:-8);u.y=entry.y;u.path=[];u.target=null;u.stance='hold';if(entry.id===u.mountOrder)u.mountOrder=null;this.sound('ready');}return true;
 },
 unitRange(u){return UNITS[u.type].range+(u.garrison?60:0);}
};
