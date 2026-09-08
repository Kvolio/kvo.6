import {TILE,COLS,ROWS,BUILDINGS,UNITS,ENEMIES} from './data.js';
import {clamp,random} from './world.js';
import {Art} from './art.js';

export class Renderer {
  constructor(canvas,game){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.game=game;this.art=new Art();
    this.camera={x:1300,y:1070,zoom:.7};this.terrain=null;this.preview=null;this.selectionBox=null;this.resize();
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);}
  screenToWorld(x,y){return {x:(x-this.width/2)/this.camera.zoom+this.camera.x,y:(y-this.height/2)/this.camera.zoom+this.camera.y};}
  worldToScreen(x,y){return {x:(x-this.camera.x)*this.camera.zoom+this.width/2,y:(y-this.camera.y)*this.camera.zoom+this.height/2};}
  pan(dx,dy){this.camera.x=clamp(this.camera.x-dx/this.camera.zoom,0,COLS*TILE);this.camera.y=clamp(this.camera.y-dy/this.camera.zoom,0,ROWS*TILE);}
  zoom(factor,x=this.width/2,y=this.height/2){const before=this.screenToWorld(x,y);this.camera.zoom=clamp(this.camera.zoom*factor,.35,1.8);const after=this.screenToWorld(x,y);this.camera.x+=before.x-after.x;this.camera.y+=before.y-after.y;}
  center(){this.camera.x=this.game.keep?.x||1300;this.camera.y=(this.game.keep?.y||1100)-60;}
  cacheTerrain(){
    const world=this.game.world,tiles=world.tiles;this.terrain=document.createElement('canvas');this.terrain.width=COLS*TILE;this.terrain.height=ROWS*TILE;const c=this.terrain.getContext('2d'),rng=random(world.seed);
    c.fillStyle='#74865a';c.fillRect(0,0,this.terrain.width,this.terrain.height);
    // Large soft patches cross tile boundaries, eliminating the checkerboard.
    for(let i=0;i<900;i++){
      const x=rng()*COLS*TILE,y=rng()*ROWS*TILE,r=25+rng()*100,grad=c.createRadialGradient(x,y,0,x,y,r);
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
    c.globalAlpha=preview?.7:b.complete?1:.55;const art=this.art.building(b.type,b.level);c.drawImage(art,x-12,y-12,size+24,size+24);c.globalAlpha=1;
    if(!b.complete&&!preview){c.strokeStyle='#e3c98e';c.lineWidth=2;c.strokeRect(x+2,y+2,size-4,size-4);for(let k=8;k<size;k+=18){c.beginPath();c.moveTo(x+k,y+2);c.lineTo(x+k,y+size-2);c.stroke();}this.bar(c,x,y+size+5,size,b.progress/Math.max(1,d.time),'#dfc58b');}
    if(b.hp<b.maxHp&&b.complete){this.bar(c,x,y+size+4,size,b.hp/b.maxHp,'#cf8b68');if(b.hp<b.maxHp*.5){c.strokeStyle='#3c372f';c.beginPath();c.moveTo(x+size*.3,y+size*.2);c.lineTo(x+size*.45,y+size*.4);c.lineTo(x+size*.35,y+size*.55);c.stroke();}}
    if(this.game.selected.includes(b.id)){c.strokeStyle='#f4dea4';c.lineWidth=2/this.camera.zoom;c.strokeRect(x-3,y-3,size+6,size+6);if(d.range){c.setLineDash([6,6]);c.strokeStyle='#f4dea455';c.beginPath();c.arc(b.x,b.y,d.range,0,7);c.stroke();}}
    c.restore();
  }
  unit(c,u,enemy=false,time=0){
    const d=enemy?ENEMIES[u.type]:UNITS[u.type],s=d.boss?(u.type==='titan'?3:2):['ogre','ram','knight'].includes(u.type)?1.4:1;
    c.save();c.translate(u.x,u.y);
    if(this.game.selected.includes(u.id)){c.strokeStyle='#f4dfa7';c.lineWidth=1.5/this.camera.zoom;c.beginPath();c.arc(0,0,13*s,0,7);c.stroke();}
    c.save();c.scale(s,s);c.rotate(u.facing??-Math.PI/2);this.art.circle(c,3,4,9,'#1d29244d');
    if(d.flying){
      const wing=Math.sin(time*3)*7;this.art.polygon(c,[[20,0],[3,-7],[-10,-38-wing],[-17,-15],[-7,0],[-17,15],[-10,38+wing],[3,7]],'#2c3938','#7b7761');
      this.art.polygon(c,[[18,0],[-23,-5],[-34,0],[-23,5]],'#4c5450');this.art.circle(c,17,-2,1,'#e2a86d');
    }else{
      if(u.type==='knight'){c.fillStyle='#6b5b43';c.beginPath();c.ellipse(0,0,13,6,0,0,7);c.fill();this.art.circle(c,12,0,4,'#a18a65');}
      c.fillStyle=enemy?'#994f3e':u.type==='worker'?'#b9a16b':'#548b91';c.beginPath();c.ellipse(-2,0,6,9,0,0,7);c.fill();
      this.art.circle(c,0,0,4.5,u.type==='worker'?'#d8c083':'#b9c1b2');this.art.circle(c,-1,-1,2.5,u.type==='worker'?'#b9945c':'#e2e0c9');
      c.strokeStyle='#48463a';c.lineWidth=2;c.beginPath();c.moveTo(-4,-10);c.lineTo(12,-10);c.stroke();c.strokeStyle='#d8d3b7';c.beginPath();c.moveTo(8,-10);c.lineTo(15,-10);c.stroke();
      if(d.range>85){c.strokeStyle='#c8ad79';c.lineWidth=1.5;c.beginPath();c.arc(4,-9,7,-1.4,1.4);c.stroke();}
      if(enemy||u.type==='knight'){c.fillStyle=enemy?'#724234':'#426675';c.beginPath();c.ellipse(1,10,5,3,0,0,7);c.fill();}
      if(u.job?.carry>0)this.art.circle(c,-7,4,3,'#c9b077');
    }
    c.restore();if(u.hp<u.maxHp||this.game.selected.includes(u.id))this.bar(c,-13*s,-18*s,26*s,u.hp/u.maxHp,enemy?'#d18d76':'#bed59f');c.restore();
  }
  ship(c,s,time){
    c.save();c.translate(s.x,s.y);c.strokeStyle='#c1dfcc24';c.lineWidth=2;c.beginPath();c.moveTo(-22,-25);c.lineTo(-29,-60);c.moveTo(22,-25);c.lineTo(29,-60);c.stroke();
    this.art.polygon(c,[[0,40],[-19,22],[-22,-29],[-12,-41],[12,-41],[22,-29],[19,22]],'#604a33','#c5a477');
    this.art.polygon(c,[[0,31],[-13,16],[-15,-28],[15,-28],[13,16]],'#ac8a59');
    for(let y=-26;y<24;y+=6){c.strokeStyle='#735d3f';c.beginPath();c.moveTo(-13,y);c.lineTo(13,y);c.stroke();}
    for(let y=-18;y<20;y+=12){c.strokeStyle='#b9a278';c.lineWidth=2;c.beginPath();c.moveTo(-15,y);c.lineTo(-30,y+Math.sin(time*2)*4);c.moveTo(15,y);c.lineTo(30,y+Math.sin(time*2)*4);c.stroke();}
    c.fillStyle='#ae634b';c.fillRect(-17,-10,34,16);c.fillStyle='#d4b990';c.fillRect(-17,-3,34,3);this.art.circle(c,0,-2,3,'#493e2a');c.restore();
  }
  draw(time){
    const c=this.ctx,g=this.game;if(!this.terrain||this.terrainWorld!==g.world)this.cacheTerrain();
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#315650';c.fillRect(0,0,this.width,this.height);c.save();c.translate(this.width/2,this.height/2);c.scale(this.camera.zoom,this.camera.zoom);c.translate(-this.camera.x,-this.camera.y);c.drawImage(this.terrain,0,0);
    const left=this.camera.x-this.width/2/this.camera.zoom-140,right=this.camera.x+this.width/2/this.camera.zoom+140,top=this.camera.y-this.height/2/this.camera.zoom-140,bottom=this.camera.y+this.height/2/this.camera.zoom+140;
    const visible=(x,y)=>x>left&&x<right&&y>top&&y<bottom;
    if(this.occupiedRevision!==g.revision){this.occupied=g.world.blocked(g.buildings,true);this.occupiedRevision=g.revision;}
    for(const t of g.world.tiles){const x=(t.x+.5)*TILE,y=(t.y+.5)*TILE;if(!visible(x,y))continue;
      if(t.type==='water'&&t.shade>.55){c.strokeStyle='#bed5c623';c.lineWidth=1;c.beginPath();c.moveTo(x-12+Math.sin(time*.5+t.y)*5,y);c.quadraticCurveTo(x,y+3,x+15,y);c.stroke();}
      if(t.type==='sand'&&g.world.tile(t.x,t.y-1)?.type==='water'){c.strokeStyle='#eee0b476';c.lineWidth=2;c.beginPath();c.moveTo(x-20,y-18+Math.sin(time+t.x)*2);c.lineTo(x+20,y-18);c.stroke();}
      if(t.resource&&!this.occupied.has(t.y*COLS+t.x)){if(t.resource==='wood')this.art.tree(c,x,y,.85+t.shade*.3,t.shade);else this.art.ore(c,x,y,t.resource);}
      if(g.selectedTile===t.y*COLS+t.x){c.strokeStyle='#f1d895';c.lineWidth=2/this.camera.zoom;c.strokeRect(t.x*TILE+2,t.y*TILE+2,TILE-4,TILE-4);}
    }
    for(const b of g.buildings)if(visible(b.x,b.y))this.building(c,b);
    for(const u of g.units)if(visible(u.x,u.y))this.unit(c,u,false,time);
    for(const e of g.enemies)if(visible(e.x,e.y))this.unit(c,e,true,time);
    for(const s of g.ships)if(visible(s.x,s.y))this.ship(c,s,time);
    for(const f of g.effects){c.globalAlpha=f.life/f.max;c.strokeStyle=f.kind==='fire'?'#eba864':'#efdab0';c.lineWidth=2;c.beginPath();if(f.kind==='arrow'){c.moveTo(f.x,f.y);c.lineTo(f.tx,f.ty);}else c.arc(f.x,f.y,(1-f.life/f.max)*(f.kind==='fire'||f.kind==='slam'?140:20)+4,0,7);c.stroke();}c.globalAlpha=1;
    if(this.preview){
      const p=this.preview,size=BUILDINGS[p.type].size*TILE;
      c.strokeStyle='#e6e3bd19';c.lineWidth=.7;for(let x=Math.max(0,Math.floor(left/TILE)*TILE);x<Math.min(COLS*TILE,right);x+=TILE){c.beginPath();c.moveTo(x,Math.max(0,top));c.lineTo(x,Math.min(ROWS*TILE,bottom));c.stroke();}for(let y=Math.max(0,Math.floor(top/TILE)*TILE);y<Math.min(ROWS*TILE,bottom);y+=TILE){c.beginPath();c.moveTo(Math.max(0,left),y);c.lineTo(Math.min(COLS*TILE,right),y);c.stroke();}
      this.building(c,{...p,level:1,hp:1,maxHp:1,complete:true},true);
      const valid=!g.world.placementReason(p.type,p.tx,p.ty,g.buildings)&&g.afford(BUILDINGS[p.type].cost)&&(BUILDINGS[p.type].level||1)<=g.level;
      c.fillStyle=valid?'#b9df9233':'#e0806333';c.fillRect(p.tx*TILE,p.ty*TILE,size,size);c.strokeStyle=valid?'#d5efae':'#ffb499';c.lineWidth=2;c.strokeRect(p.tx*TILE,p.ty*TILE,size,size);
    }
    c.restore();if(this.selectionBox){const b=this.selectionBox;c.fillStyle='#e7d79c15';c.strokeStyle='#e7d79c';c.fillRect(b.x,b.y,b.w,b.h);c.strokeRect(b.x,b.y,b.w,b.h);}
  }
  minimap(canvas){
    const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,sx=w/(COLS*TILE),sy=h/(ROWS*TILE);
    for(const t of this.game.world.tiles){c.fillStyle=({grass:'#71865a',sand:'#b9b187',water:'#345e60',mountain:'#b0b5a0',foothill:'#8e8a68'})[t.type];c.fillRect(t.x*TILE*sx,t.y*TILE*sy,TILE*sx+1,TILE*sy+1);if(t.resource==='gold'||t.resource==='iron'){c.fillStyle=t.resource==='gold'?'#ecd18a':'#a0c1ce';c.fillRect((t.x+.3)*TILE*sx,(t.y+.3)*TILE*sy,1.6,1.6);}}
    for(const b of this.game.buildings){c.fillStyle=b.type==='keep'?'#fff0bf':'#c5ac73';c.fillRect(b.tx*TILE*sx,b.ty*TILE*sy,BUILDINGS[b.type].size*TILE*sx,BUILDINGS[b.type].size*TILE*sy);}c.fillStyle='#f49770';for(const e of this.game.enemies)c.fillRect(e.x*sx,e.y*sy,2,2);
    c.strokeStyle='#f4dfad';c.lineWidth=1;c.strokeRect((this.camera.x-this.width/2/this.camera.zoom)*sx,(this.camera.y-this.height/2/this.camera.zoom)*sy,this.width/this.camera.zoom*sx,this.height/this.camera.zoom*sy);
  }
}
