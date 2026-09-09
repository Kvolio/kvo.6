import {TILE,COLS,ROWS,BUILDINGS,UNITS,ENEMIES} from './data.js';
import {clamp,random} from './world.js';
import {Art} from './art.js';
import {UnitArtwork} from './unit-art.js';

export class Renderer {
  constructor(canvas,game){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.game=game;this.art=new Art();this.unitArt=new UnitArtwork(this.art);
    this.camera={x:1300,y:1070,zoom:.7};this.terrain=null;this.preview=null;this.selectionBox=null;this.resize();
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);}
  screenToWorld(x,y){return {x:(x-this.width/2)/this.camera.zoom+this.camera.x,y:(y-this.height/2)/this.camera.zoom+this.camera.y};}
  worldToScreen(x,y){return {x:(x-this.camera.x)*this.camera.zoom+this.width/2,y:(y-this.camera.y)*this.camera.zoom+this.height/2};}
  pan(dx,dy){this.camera.x=clamp(this.camera.x-dx/this.camera.zoom,0,this.game.world.cols*TILE);this.camera.y=clamp(this.camera.y-dy/this.camera.zoom,0,this.game.world.rows*TILE);}
  zoom(factor,x=this.width/2,y=this.height/2){const before=this.screenToWorld(x,y);this.camera.zoom=clamp(this.camera.zoom*factor,.35,1.8);const after=this.screenToWorld(x,y);this.camera.x+=before.x-after.x;this.camera.y+=before.y-after.y;}
  center(){this.camera.x=this.game.keep?.x||1300;this.camera.y=(this.game.keep?.y||1100)-60;}
  shoreline(){
    const world=this.game.world,edges=new Map(),add=(a,b)=>{const key=a.join(',');if(!edges.has(key))edges.set(key,[]);edges.get(key).push(b);};
    for(const t of world.tiles){if(t.type==='water')continue;const {x,y}=t;
      if(!world.tile(x,y-1)||world.tile(x,y-1).type==='water')add([x,y],[x+1,y]);
      if(!world.tile(x+1,y)||world.tile(x+1,y).type==='water')add([x+1,y],[x+1,y+1]);
      if(!world.tile(x,y+1)||world.tile(x,y+1).type==='water')add([x+1,y+1],[x,y+1]);
      if(!world.tile(x-1,y)||world.tile(x-1,y).type==='water')add([x,y+1],[x,y]);
    }
    const path=new Path2D();
    while(edges.size){
      const first=edges.keys().next().value,start=first.split(',').map(Number),points=[start];let current=start;
      for(let guard=0;guard<world.tiles.length*4;guard++){
        const key=current.join(','),list=edges.get(key);if(!list?.length)break;
        const next=list.pop();if(!list.length)edges.delete(key);if(next[0]===start[0]&&next[1]===start[1])break;points.push(next);current=next;
      }
      let smooth=points.map(([x,y])=>[x*TILE,y*TILE]);
      for(let iteration=0;iteration<3;iteration++){const next=[];for(let i=0;i<smooth.length;i++){const a=smooth[i],b=smooth[(i+1)%smooth.length];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}smooth=next;}
      smooth.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();
    }
    return path;
  }
  cacheTerrain(){
    const world=this.game.world,tiles=world.tiles;this.terrain=document.createElement('canvas');this.terrain.width=this.game.world.cols*TILE;this.terrain.height=this.game.world.rows*TILE;const c=this.terrain.getContext('2d'),rng=random(world.seed);
    c.fillStyle='#74865a';c.fillRect(0,0,this.terrain.width,this.terrain.height);
    // Large soft patches cross tile boundaries, eliminating the checkerboard.
    for(let i=0;i<900;i++){
      const x=rng()*this.game.world.cols*TILE,y=rng()*this.game.world.rows*TILE,r=25+rng()*100,grad=c.createRadialGradient(x,y,0,x,y,r);
      grad.addColorStop(0,i%2?'#c1bc7628':'#2e573a22');grad.addColorStop(1,'#78935900');c.fillStyle=grad;c.fillRect(x-r,y-r,r*2,r*2);
    }
    for(const t of tiles){const x=t.x*TILE,y=t.y*TILE;
      if(t.type==='water'){c.fillStyle='#345e60';c.fillRect(x,y,TILE,TILE);}
      if(t.type==='sand'){c.fillStyle='#bdb287';c.fillRect(x,y,TILE,TILE);}
      if(t.type==='foothill'||t.type==='mountain'){
        const grad=c.createRadialGradient(x+20,y+20,5,x+20,y+20,40);grad.addColorStop(0,t.type==='mountain'?'#777d70':'#a59c79cc');grad.addColorStop(1,'#9d987500');c.fillStyle=grad;c.fillRect(x-20,y-20,80,80);
      }
    }
    for(const t of tiles){const x=t.x*TILE,y=t.y*TILE;
      if(t.type==='sand'){
        for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1]]){
          const n=world.tile(t.x+dx,t.y+dy);if(n?.type==='grass'){const xx=x+20+dx*20,yy=y+20+dy*20,grad=c.createRadialGradient(xx,yy,0,xx,yy,28);grad.addColorStop(0,'#819160d0');grad.addColorStop(1,'#81916000');c.fillStyle=grad;c.fillRect(xx-28,yy-28,56,56);}
        }
      }
      if(t.resource==='wood'){const grad=c.createRadialGradient(x+20,y+20,0,x+20,y+20,30);grad.addColorStop(0,'#344d2e4a');grad.addColorStop(1,'#344d2e00');c.fillStyle=grad;c.fillRect(x-10,y-10,60,60);}
      if(t.type==='mountain')this.mountain(c,t);
      if(world.walkable(t))for(let j=0;j<8;j++){
        c.fillStyle=j%2?'#e3d7a42b':'#3f573228';const xx=x+rng()*40,yy=y+rng()*40;c.fillRect(xx,yy,1+rng()*3,1);
      }
    }
    this.coastPath=this.shoreline();
    c.strokeStyle='#bdb287';c.lineWidth=26;c.stroke(this.coastPath);
    c.globalCompositeOperation='destination-in';c.fillStyle='#fff';c.fill(this.coastPath);
    c.globalCompositeOperation='destination-over';c.fillStyle='#345e60';c.fillRect(0,0,this.terrain.width,this.terrain.height);c.globalCompositeOperation='source-over';
    c.strokeStyle='#e0d1a787';c.lineWidth=2;c.stroke(this.coastPath);
    this.terrainWorld=world;
  }
  mountain(c,t){
    const x=(t.x+.5)*TILE,y=(t.y+.5)*TILE,v=t.shade;
    const grad=c.createRadialGradient(x-7,y-9,3,x,y,34);grad.addColorStop(0,'#bec4b1');grad.addColorStop(.55,'#899584');grad.addColorStop(1,'#707d6900');c.fillStyle=grad;c.fillRect(x-34,y-34,68,68);
    const rng=random(t.y*512+t.x*27+this.game.world.seed),r=19+v*9,points=[];
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2,rr=r*(.72+rng()*.28);points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}
    const peak=[x-6+v*9,y-5-v*5];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],light=((a[0]+b[0])/2-x+(a[1]+b[1])/2-y)/(r*2);
      this.art.polygon(c,[a,b,peak],`hsl(91 10% ${58-light*15+v*5}%)`);
    }
    c.strokeStyle='#354b3c42';c.lineWidth=.8;
    for(let i=0;i<3;i++){c.beginPath();c.moveTo(peak[0]+i*2,peak[1]+i);c.lineTo(x+8+i*3,y+8);c.lineTo(x+6+i*4,y+17);c.stroke();}
    if((t.elevation||0)>.85&&v>.35)this.art.polygon(c,[[peak[0]-8,peak[1]-5],[peak[0]+6,peak[1]-3],[peak[0]+4,peak[1]+5],[peak[0],peak[1]+2],[peak[0]-6,peak[1]+7]],'#e1e5d4');
  }
  bar(c,x,y,w,value,color){c.fillStyle='#182820e6';c.fillRect(x,y,w,5);c.fillStyle=color;c.fillRect(x+1,y+1,(w-2)*clamp(value,0,1),3);}
  building(c,b,preview=false){
    const d=BUILDINGS[b.type],size=d.size*TILE,x=b.tx*TILE,y=b.ty*TILE;c.save();
    c.globalAlpha=preview?.7:b.complete?1:.55;const mask=this.game.connectionMask(b,this.previewLayout||this.game.buildings),art=this.art.building(b.type,b.level,mask,b.type==='keep'?this.game.keepDesign:0);c.save();c.translate(x+size/2,y+size/2);const turns=['road','wall','palisade'].includes(b.type)?0:b.rotation||0;c.rotate(turns*Math.PI/2);c.drawImage(art,-size/2-12,-size/2-12,size+24,size+24);c.restore();c.globalAlpha=1;
    if(!b.complete&&!preview){c.strokeStyle='#e3c98e';c.lineWidth=2;c.strokeRect(x+2,y+2,size-4,size-4);for(let k=8;k<size;k+=18){c.beginPath();c.moveTo(x+k,y+2);c.lineTo(x+k,y+size-2);c.stroke();}this.bar(c,x,y+size+5,size,b.progress/Math.max(1,d.time),'#dfc58b');}
    if(b.burn&&!preview){for(let i=0;i<4;i++){this.art.circle(c,x+size*(.2+i*.2),y+size*.6,5,'#e87f41cc');this.art.circle(c,x+size*(.2+i*.2),y+size*.6-3,2,'#ffe2a3');}}
    if(b.upgrade&&!preview)this.bar(c,x,y-8,size,b.upgrade.progress/b.upgrade.duration,'#9ac7d1');
    if(b.hp<b.maxHp&&b.complete){this.bar(c,x,y+size+4,size,b.hp/b.maxHp,'#cf8b68');if(b.hp<b.maxHp*.5){c.strokeStyle='#3c372f';c.beginPath();c.moveTo(x+size*.3,y+size*.2);c.lineTo(x+size*.45,y+size*.4);c.lineTo(x+size*.35,y+size*.55);c.stroke();}}
    if(this.game.selected.includes(b.id)){c.strokeStyle='#f4dea4';c.lineWidth=2/this.camera.zoom;c.strokeRect(x-3,y-3,size+6,size+6);if(d.range){c.setLineDash([6,6]);c.strokeStyle='#f4dea455';c.beginPath();c.arc(b.x,b.y,this.game.towerRange(b),0,7);c.stroke();}}
    c.restore();
  }
  unit(c,u,enemy=false,time=0){
    const d=enemy?ENEMIES[u.type]:UNITS[u.type],s=d.scale||(d.boss?(u.type==='titan'?3.3:2.1):['ogre','ram','knight'].includes(u.type)?1.3:1);
    c.save();c.translate(u.x,u.y);
    if(u.garrison){c.strokeStyle='#dcc690';c.lineWidth=2;c.strokeRect(-11,-11,22,22);}
    if(this.game.selected.includes(u.id)){c.strokeStyle='#f4dfa7';c.lineWidth=1.5/this.camera.zoom;c.beginPath();c.arc(0,0,15*s,0,7);c.stroke();}
    if(d.aura||u.wardUntil>this.game.time){c.strokeStyle=d.aura?'#d498be66':'#bd83eeaa';c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.arc(0,0,(24+Math.sin(time*2)*2)*s,0,7);c.stroke();c.setLineDash([]);}
    this.art.circle(c,this.game.isAirborne(u)?12:3,this.game.isAirborne(u)?16:4,11*s,'#17292355');
    c.save();c.scale(s,s);c.rotate(u.facing??-Math.PI/2);
    if(d.flying)this.unitArt.wings(c,u.type,time,this.game.isAirborne(u));
    if(u.attackUntil>this.game.time)c.rotate(Math.sin(time*28)*.1);
    c.drawImage(this.unitArt.sprite(u.type),-48,-48,96,96);c.restore();
    if(u.job?.carry>0)this.art.circle(c,-9*s,6*s,3,'#dfc482');
    if(u.burn){for(let i=0;i<3;i++){this.art.circle(c,(i-1)*6*s,Math.sin(time*8+i)*4*s,3*s,'#e57c38bb');this.art.circle(c,(i-1)*6*s,-2*s,1.5*s,'#ffe5a6');}}
    if(u.wardFor){this.art.polygon(c,[[-5,-23],[0,-30],[5,-23],[0,-17]],'#d8a2f0');}
    if(u.hp<u.maxHp||this.game.selected.includes(u.id)||d.boss)this.bar(c,-15*s,-23*s,30*s,u.hp/u.maxHp,enemy?'#d18d76':'#bed59f');c.restore();
  }
  portal(c,p,time){
    const r=p.big?75:32;c.save();c.translate(p.x,p.y);c.rotate(time*.25);this.art.circle(c,0,0,r,'#27182ddd');
    for(let i=0;i<4;i++){c.strokeStyle=i%2?'#eb805acc':'#b479dacc';c.lineWidth=3;c.beginPath();c.arc(0,0,r-i*6,time*(i%2?1:-1),time*(i%2?1:-1)+Math.PI*1.5);c.stroke();}
    for(let i=0;i<10;i++){const angle=i*Math.PI/5;c.fillStyle='#f4c38b';c.fillRect(Math.cos(angle)*r-2,Math.sin(angle)*r-2,4,4);}c.restore();
  }
  hazard(c,h,time){
    const progress=1-h.remaining/h.duration;c.save();c.translate(h.x,h.y);c.fillStyle='rgba(208,60,35,'+(.09+progress*.16)+')';c.strokeStyle='#ffba80';c.lineWidth=2.5/this.camera.zoom;
    c.beginPath();c.arc(0,0,h.radius,0,7);if(h.inner)c.arc(0,0,h.inner,0,7,true);c.fill('evenodd');c.stroke();c.setLineDash([9,6]);c.beginPath();c.arc(0,0,h.radius*(.2+progress*.8),0,7);c.stroke();c.setLineDash([]);
    c.fillStyle='#ffdfab';c.font='bold '+Math.max(11,13/this.camera.zoom)+'px system-ui';c.textAlign='center';c.fillText(h.kind.toUpperCase()+' · '+Math.max(.1,h.remaining).toFixed(1)+'s',0,-h.radius-9);c.restore();
    if(h.kind==='hurl'){const x=h.fromX+(h.x-h.fromX)*progress,y=h.fromY+(h.y-h.fromY)*progress-Math.sin(progress*Math.PI)*100;this.unit(c,{type:'demonwarrior',x,y,hp:1,maxHp:1,facing:time*4},true,time);}
  }
  ship(c,s,time){
    c.save();c.translate(s.x,s.y);c.rotate(s.facing||0);c.strokeStyle='#c1dfcc24';c.lineWidth=2;c.beginPath();c.moveTo(-22,-25);c.lineTo(-29,-60);c.moveTo(22,-25);c.lineTo(29,-60);c.stroke();
    this.art.polygon(c,[[0,40],[-19,22],[-22,-29],[-12,-41],[12,-41],[22,-29],[19,22]],'#604a33','#c5a477');
    this.art.polygon(c,[[0,31],[-13,16],[-15,-28],[15,-28],[13,16]],'#ac8a59');
    for(let y=-26;y<24;y+=6){c.strokeStyle='#735d3f';c.beginPath();c.moveTo(-13,y);c.lineTo(13,y);c.stroke();}
    for(let y=-18;y<20;y+=12){c.strokeStyle='#b9a278';c.lineWidth=2;c.beginPath();c.moveTo(-15,y);c.lineTo(-30,y+Math.sin(time*2)*4);c.moveTo(15,y);c.lineTo(30,y+Math.sin(time*2)*4);c.stroke();}
    c.fillStyle='#ae634b';c.fillRect(-17,-10,34,16);c.fillStyle='#d4b990';c.fillRect(-17,-3,34,3);this.art.circle(c,0,-2,3,'#493e2a');if(!s.landed)for(let i=0;i<(s.units?.length||0);i++){c.save();c.translate(i%2?8:-8,-23+Math.floor(i/2)*14);c.scale(.4,.4);this.unit(c,{type:s.units[i],x:0,y:0,hp:1,maxHp:1,facing:Math.PI/2},true,time);c.restore();}c.restore();
  }
  draw(time){
    const c=this.ctx,g=this.game;if(!this.terrain||this.terrainWorld!==g.world)this.cacheTerrain();
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#345e60';c.fillRect(0,0,this.width,this.height);c.save();c.translate(this.width/2,this.height/2);c.scale(this.camera.zoom,this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);c.drawImage(this.terrain,0,0);if(this.coastPath){c.strokeStyle=`rgba(237,228,185,${.25+Math.sin(time*.8)*.12})`;c.lineWidth=3+Math.sin(time)*1.2;c.stroke(this.coastPath);}
    const left=this.camera.x-this.width/2/this.camera.zoom-140,right=this.camera.x+this.width/2/this.camera.zoom+140,top=this.camera.y-this.height/2/this.camera.zoom-140,bottom=this.camera.y+this.height/2/this.camera.zoom+140;
    const visible=(x,y)=>x>left&&x<right&&y>top&&y<bottom;
    if(this.occupiedRevision!==g.revision){this.occupied=g.world.blocked(g.buildings,true);this.occupiedRevision=g.revision;}
    for(const t of g.world.tiles){const x=(t.x+.5)*TILE,y=(t.y+.5)*TILE;if(!visible(x,y))continue;
      if(t.type==='water'&&t.shade>.55){c.strokeStyle='#bed5c623';c.lineWidth=1;c.beginPath();c.moveTo(x-12+Math.sin(time*.5+t.y)*5,y);c.quadraticCurveTo(x,y+3,x+15,y);c.stroke();}
      if(t.resource&&!this.occupied.has(t.y*this.game.world.cols+t.x)){if(t.resource==='wood')this.art.tree(c,x,y,.85+t.shade*.3,t.shade);else this.art.ore(c,x,y,t.resource);}
      if(g.selectedTile===t.y*this.game.world.cols+t.x){c.strokeStyle='#f1d895';c.lineWidth=2/this.camera.zoom;c.strokeRect(t.x*TILE+2,t.y*TILE+2,TILE-4,TILE-4);}
    }
    if(g.sealBroken){c.save();c.globalCompositeOperation='color';c.fillStyle='#b03852b3';c.fillRect(left,top,right-left,bottom-top);c.restore();}
    for(const p of g.portals||[])if(visible(p.x,p.y))this.portal(c,p,time);
    for(const b of g.buildings)if(visible(b.x,b.y))this.building(c,b);
    for(const h of g.hazards||[])this.hazard(c,h,time);
    for(const u of g.units)if(visible(u.x,u.y))this.unit(c,u,false,time);
    for(const e of g.enemies)if(visible(e.x,e.y))this.unit(c,e,true,time);
    for(const s of g.ships)if(!(s.delay>0)&&visible(s.x,s.y))this.ship(c,s,time);
    for(const f of g.effects){c.globalAlpha=f.life/f.max;c.strokeStyle=f.kind==='fire'?'#eba864':'#efdab0';c.lineWidth=2;c.beginPath();if(f.kind==='arrow'){c.moveTo(f.x,f.y);c.lineTo(f.tx,f.ty);}else c.arc(f.x,f.y,(1-f.life/f.max)*(f.radius||(f.kind==='fire'||f.kind==='slam'?140:20))+4,0,7);c.stroke();}c.globalAlpha=1;
    if(this.preview){
      const p=this.preview,size=BUILDINGS[p.type].size*TILE;
      c.strokeStyle='#e6e3bd19';c.lineWidth=.7;for(let x=Math.max(0,Math.floor(left/TILE)*TILE);x<Math.min(this.game.world.cols*TILE,right);x+=TILE){c.beginPath();c.moveTo(x,Math.max(0,top));c.lineTo(x,Math.min(this.game.world.rows*TILE,bottom));c.stroke();}for(let y=Math.max(0,Math.floor(top/TILE)*TILE);y<Math.min(this.game.world.rows*TILE,bottom);y+=TILE){c.beginPath();c.moveTo(Math.max(0,left),y);c.lineTo(Math.min(this.game.world.cols*TILE,right),y);c.stroke();}
      const cells=p.cells||[{tx:p.tx,ty:p.ty}],plan=g.planConstruction(p.type,cells,p.rotation||0),valid=!plan.reason;
      this.previewLayout=[...g.buildings,...cells.map(cell=>({...p,...cell,hp:1}))];
      for(const cell of cells){
        this.building(c,{...p,...cell,level:1,hp:1,maxHp:1,complete:true},true);
        c.fillStyle=valid?'#b9df9233':'#e0806333';c.fillRect(cell.tx*TILE,cell.ty*TILE,size,size);c.strokeStyle=valid?'#d5efae':'#ffb499';c.lineWidth=2;c.strokeRect(cell.tx*TILE,cell.ty*TILE,size,size);
      }
      this.previewLayout=null;
    }
    c.restore();if(this.selectionBox){const b=this.selectionBox;c.fillStyle='#e7d79c15';c.strokeStyle='#e7d79c';c.fillRect(b.x,b.y,b.w,b.h);c.strokeRect(b.x,b.y,b.w,b.h);}
  }
  minimap(canvas){
    const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,sx=w/(this.game.world.cols*TILE),sy=h/(this.game.world.rows*TILE);
    for(const t of this.game.world.tiles){c.fillStyle=({grass:'#71865a',sand:'#b9b187',water:'#345e60',mountain:'#b0b5a0',foothill:'#8e8a68'})[t.type];c.fillRect(t.x*TILE*sx,t.y*TILE*sy,TILE*sx+1,TILE*sy+1);if(t.resource==='gold'||t.resource==='iron'){c.fillStyle=t.resource==='gold'?'#ecd18a':'#a0c1ce';c.fillRect((t.x+.3)*TILE*sx,(t.y+.3)*TILE*sy,1.6,1.6);}}
    for(const b of this.game.buildings){c.fillStyle=b.type==='keep'?'#fff0bf':'#c5ac73';c.fillRect(b.tx*TILE*sx,b.ty*TILE*sy,BUILDINGS[b.type].size*TILE*sx,BUILDINGS[b.type].size*TILE*sy);}c.fillStyle='#f49770';for(const e of this.game.enemies)c.fillRect(e.x*sx,e.y*sy,2,2);
    // Clamp fleets outside the world to an edge marker, pointing toward the beach.
    for(const s of this.game.ships){if(s.landed)continue;const x=Math.max(5,Math.min(w-5,s.x*sx)),y=Math.max(5,Math.min(h-5,s.y*sy));
      c.save();c.translate(x,y);c.rotate(Math.atan2((s.targetY-s.y)*sy,((s.targetX??s.x)-s.x)*sx));c.fillStyle='#fff0bd';c.strokeStyle='#873d2c';c.lineWidth=1.5;c.beginPath();c.moveTo(5,0);c.lineTo(-3,-3.5);c.lineTo(-1,0);c.lineTo(-3,3.5);c.closePath();c.fill();c.stroke();c.restore();
    }
    for(const p of this.game.portals||[]){c.fillStyle='#ef92c4';c.fillRect(p.x*sx-2,p.y*sy-2,4,4);}
    c.strokeStyle='#f4dfad';c.lineWidth=1;c.strokeRect((this.camera.x-this.width/2/this.camera.zoom)*sx,(this.camera.y-this.height/2/this.camera.zoom)*sy,this.width/this.camera.zoom*sx,this.height/this.camera.zoom*sy);
  }
}
