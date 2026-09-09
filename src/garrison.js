import {BUILDINGS,TILE,UNITS} from './data.js';
import {distance} from './world.js';

export const Garrison={
  wallOccupants(b){return this.units.filter(u=>u.hp>0&&(u.garrison===b.id||u.mountOrder===b.id));},
  garrison(b){
    if(!b?.complete||b.hp<=0||!['wall','palisade','gate'].includes(b.type)){this.notice('Choose a completed wall or gate.');return false;}
    let assigned=0;
    for(const u of this.units.filter(u=>this.selected.includes(u.id)&&['archer','crossbow'].includes(u.type))){
      if(u.garrison===b.id||u.mountOrder===b.id)continue;if(this.wallOccupants(b).length>=2)break;
      if(u.garrison&&!this.dismount(u))continue;
      const entrance=this.accessiblePoint(u,b);if(!entrance)continue;
      u.mountOrder=b.id;u.garrisonEntry=entrance;u.target=null;u.path=[];u.stance='hold';assigned++;
    }
    this.notice(assigned?`${assigned} ranged ${assigned===1?'defender is':'defenders are'} moving onto the wall.`:'Select archers or crossbowmen, leave an accessible wall edge, and allow two defenders per section.');
    return assigned>0;
  },
  dismount(u,fallen=false){
    if(!u.garrison){u.mountOrder=null;return true;}
    const b=this.buildings.find(b=>b.id===u.garrison),tile=this.world.at(u.x,u.y),origin=b||{type:'wall',tx:tile.x,ty:tile.y};
    const candidates=this.world.accessPoints(origin,this.buildings);
    if(fallen&&tile&&this.world.walkable(tile)&&!this.world.buildingAt(this.buildings,tile.x,tile.y))candidates.push({x:(tile.x+.5)*TILE,y:(tile.y+.5)*TILE});
    const point=candidates.sort((a,b)=>distance(a,u.garrisonEntry||u)-distance(b,u.garrisonEntry||u))[0];
    if(!point){this.notice('This wall has no open exit. Clear an adjacent tile to dismount.');return false;}
    u.x=point.x;u.y=point.y;u.garrison=null;u.mountOrder=null;u.path=[];u.pathRevision=-1;u.stance='defend';if(fallen)u.hp-=Math.min(u.maxHp*.25,25);return true;
  },
  updateGarrison(u,dt){
    if(u.garrison){const b=this.buildings.find(b=>b.id===u.garrison&&b.hp>0);if(!b)this.dismount(u,true);return false;}
    if(!u.mountOrder)return false;
    const b=this.buildings.find(b=>b.id===u.mountOrder&&b.hp>0&&b.complete);if(!b){u.mountOrder=null;return false;}
    const entrance=this.accessiblePoint(u,b);if(!entrance){u.mountOrder=null;this.notice('The route to this wall is blocked.');return false;}
    if(this.move(u,entrance,dt)){
      const slot=this.units.filter(v=>v.garrison===b.id).length;u.garrison=b.id;u.mountOrder=null;u.garrisonEntry=entrance;u.x=b.x+(slot?8:-8);u.y=b.y;u.path=[];u.target=null;u.stance='hold';this.sound('ready');
    }
    return true;
  },
  unitRange(u){return UNITS[u.type].range+(u.garrison?60:0);}
};
