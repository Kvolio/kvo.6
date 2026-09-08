import {BUILDINGS,TILE} from './data.js';
export class Input {
 constructor(renderer,onSelect){this.r=renderer;this.canvas=renderer.canvas;this.onSelect=onSelect;this.pointers=new Map();this.keys=new Set();this.mode='select';this.touch=false;this.gesture=false;this.commandMode=null;
  this.canvas.addEventListener('contextmenu',e=>e.preventDefault());this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',e=>this.move(e));this.canvas.addEventListener('pointerup',e=>this.up(e));this.canvas.addEventListener('pointercancel',e=>this.cancel(e));this.canvas.addEventListener('lostpointercapture',e=>this.cancel(e));
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();const p=this.point(e);this.r.zoom(Math.exp(-e.deltaY*.001),p.x,p.y);},{passive:false});
  window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();this.keys.add(e.key.toLowerCase());if(e.repeat)return;if(e.key==='Escape'){this.r.preview=null;this.commandMode=null;this.r.game.selected=[];this.onSelect();}if(e.code==='Space')this.r.game.paused=!this.r.game.paused;});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{this.keys.clear();this.pointers.clear();this.r.selectionBox=null;this.start=null;});
 }
 point(e){const b=this.canvas.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};}
 down(e){if(e.button>2)return;this.canvas.focus({preventScroll:true});this.touch=e.pointerType==='touch';const p=this.point(e);this.pointers.set(e.pointerId,p);this.canvas.setPointerCapture(e.pointerId);
  if(this.pointers.size>1){this.gesture=true;this.start=null;this.r.selectionBox=null;return;}this.gesture=false;this.start={...p,button:e.button,shift:e.shiftKey,moved:false};
 }
 move(e){const p=this.point(e),prev=this.pointers.get(e.pointerId);
  if(prev&&this.pointers.size>=2){const points=[...this.pointers.entries()],other=points.find(([id])=>id!==e.pointerId)?.[1];if(other){const oldDist=Math.hypot(prev.x-other.x,prev.y-other.y),newDist=Math.hypot(p.x-other.x,p.y-other.y);this.r.pan((p.x-prev.x)/2,(p.y-prev.y)/2);if(oldDist>5)this.r.zoom(newDist/oldDist,(p.x+other.x)/2,(p.y+other.y)/2);}this.pointers.set(e.pointerId,p);return;}
  if(prev)this.pointers.set(e.pointerId,p);
  if(this.start&&prev){if(Math.hypot(p.x-this.start.x,p.y-this.start.y)>7)this.start.moved=true;if(this.start.moved){if(this.touch&&this.mode!=='box'||this.start.button===1||this.start.button===2)this.r.pan(p.x-prev.x,p.y-prev.y);else if(!this.r.preview)this.r.selectionBox={x:this.start.x,y:this.start.y,w:p.x-this.start.x,h:p.y-this.start.y};}}
  if(this.r.preview&&!this.touch){const w=this.r.screenToWorld(p.x,p.y);this.r.preview.tx=Math.floor(w.x/TILE);this.r.preview.ty=Math.floor(w.y/TILE);}
 }
 up(e){const p=this.point(e),start=this.start;this.pointers.delete(e.pointerId);if(this.gesture){if(!this.pointers.size){this.gesture=false;this.start=null;}return;}if(!start)return;this.start=null;
  if(this.r.selectionBox){const b=this.r.selectionBox,a=this.r.screenToWorld(Math.min(b.x,b.x+b.w),Math.min(b.y,b.y+b.h)),z=this.r.screenToWorld(Math.max(b.x,b.x+b.w),Math.max(b.y,b.y+b.h));const ids=this.r.game.units.filter(u=>u.x>=a.x&&u.x<=z.x&&u.y>=a.y&&u.y<=z.y).map(u=>u.id);this.r.game.selected=start.shift?[...new Set([...this.r.game.selected,...ids])]:ids;this.r.selectionBox=null;this.mode='select';this.onSelect();return;}
  if(start.moved)return;const w=this.r.screenToWorld(p.x,p.y),g=this.r.game;
  if(this.r.preview){if(start.button===2){this.r.preview=null;}else{this.r.preview.tx=Math.floor(w.x/TILE);this.r.preview.ty=Math.floor(w.y/TILE);if(!this.touch)this.place();}this.onSelect();return;}
  if(start.button===2||this.commandMode){if(this.commandMode==='patrol')for(const u of g.units.filter(u=>g.selected.includes(u.id)))u.patrolOrigin={x:u.x,y:u.y};g.command(w,this.commandMode||'move');this.commandMode=null;this.onSelect();return;}
  const unit=g.units.filter(u=>Math.hypot(w.x-u.x,w.y-u.y)<(this.touch?24:16)/this.r.camera.zoom).sort((a,b)=>Math.hypot(a.x-w.x,a.y-w.y)-Math.hypot(b.x-w.x,b.y-w.y))[0];const building=g.world.buildingAt(g.buildings,Math.floor(w.x/TILE),Math.floor(w.y/TILE));const target=unit||building;
  if(target)g.selected=start.shift?[...new Set([...g.selected,target.id])]:[target.id];else g.selected=[];this.onSelect();
 }
 cancel(e){this.pointers.delete(e.pointerId);this.start=null;this.r.selectionBox=null;if(!this.pointers.size)this.gesture=false;}
 place(){const p=this.r.preview;if(!p)return;const b=this.r.game.place(p.type,p.tx,p.ty);if(b){this.r.game.selected=[b.id];if(!['road','palisade','wall','gate'].includes(p.type))this.r.preview=null;}this.onSelect();}
 begin(type){const w=this.r.screenToWorld(this.r.width/2,this.r.height/2);this.r.preview={type,tx:Math.floor(w.x/TILE),ty:Math.floor(w.y/TILE)};this.commandMode=null;}
 update(dt){if(document.querySelector('dialog[open]'))return;const amount=400*dt*this.r.camera.zoom;let x=0,y=0;if(this.keys.has('w')||this.keys.has('arrowup'))y+=amount;if(this.keys.has('s')||this.keys.has('arrowdown'))y-=amount;if(this.keys.has('a')||this.keys.has('arrowleft'))x+=amount;if(this.keys.has('d')||this.keys.has('arrowright'))x-=amount;this.r.pan(x,y);}
}
