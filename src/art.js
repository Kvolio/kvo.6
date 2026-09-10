import {paintBuildingUpgrades} from './building-upgrades.js';
import {BUILDINGS,TILE} from './data.js';
import {random} from './world.js';

// Shared overhead artwork for the world and command-card thumbnails.
// Static roofs and materials are rendered once per building type/level.
export class Art {
  constructor(){this.cache=new Map();this.thumbnails=new Map();}
  polygon(c,points,fill,stroke=null){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  circle(c,x,y,r,fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  stone(c,x,y,w,h){
    c.fillStyle='#27322c65';c.fillRect(x+3,y+4,w,h);c.fillStyle='#b2b0a0';c.fillRect(x,y,w,h);
    c.strokeStyle='#626b60';c.lineWidth=.65;
    for(let yy=y;yy<y+h;yy+=6){c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();for(let xx=x+((Math.floor(yy/6)%2)*5);xx<x+w;xx+=10){c.beginPath();c.moveTo(xx,yy);c.lineTo(xx,Math.min(yy+6,y+h));c.stroke();}}
    c.strokeStyle='#d5d0b1';c.strokeRect(x+.5,y+.5,w-1,h-1);
  }
  roof(c,x,y,w,h,color='terra',axis='vertical'){
    const colors={terra:['#b07850','#855134','#dba06d'],slate:['#678381','#3e6064','#91aaa0'],straw:['#bb9e58','#8b713c','#e0ca85'],dark:['#68727b','#434e56','#98a2a3']};
    const [lit,shade,edge]=colors[color];
    c.fillStyle='#17251e70';c.fillRect(x+4,y+5,w,h);
    c.fillStyle='#423e2d';c.fillRect(x-1,y-1,w+2,h+2);
    if(axis==='vertical'){
      this.polygon(c,[[x,y],[x+w/2,y+4],[x+w/2,y+h-4],[x,y+h]],lit);
      this.polygon(c,[[x+w/2,y+4],[x+w,y],[x+w,y+h],[x+w/2,y+h-4]],shade);
      this.polygon(c,[[x,y],[x+w,y],[x+w/2,y+4]],edge);
      this.polygon(c,[[x,y+h],[x+w/2,y+h-4],[x+w,y+h]],shade);
    }else{
      this.polygon(c,[[x,y],[x+w,y],[x+w-4,y+h/2],[x+4,y+h/2]],lit);
      this.polygon(c,[[x+4,y+h/2],[x+w-4,y+h/2],[x+w,y+h],[x,y+h]],shade);
    }
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    c.lineWidth=.65;
    for(let yy=y+4;yy<y+h;yy+=4){c.strokeStyle='#1d242b38';c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();c.strokeStyle='#ffffff16';c.beginPath();c.moveTo(x,yy+1);c.lineTo(x+w,yy+1);c.stroke();
      for(let xx=x+((Math.floor(yy/4)%2)*3);xx<x+w;xx+=6){c.fillStyle='#17252130';c.fillRect(xx,yy-3,.6,3);}}
    c.restore();c.strokeStyle=edge;c.lineWidth=2;c.beginPath();if(axis==='vertical'){c.moveTo(x+w/2,y+3);c.lineTo(x+w/2,y+h-3);}else{c.moveTo(x+3,y+h/2);c.lineTo(x+w-3,y+h/2);}c.stroke();
    c.strokeStyle='#e9d6a24a';c.lineWidth=1;c.strokeRect(x,y,w,h);
  }
  fence(c,x,y,w,h){c.strokeStyle='#b8a177';c.lineWidth=2;c.strokeRect(x,y,w,h);for(let xx=x;xx<=x+w;xx+=10){this.circle(c,xx,y,1.8,'#ddd1a6');this.circle(c,xx,y+h,1.8,'#ddd1a6');}for(let yy=y;yy<=y+h;yy+=10){this.circle(c,x,yy,1.8,'#ddd1a6');this.circle(c,x+w,yy,1.8,'#ddd1a6');}}
  towerTop(c,x,y,s,roof=true){this.stone(c,x,y,s,s);c.fillStyle='#5c6960';c.fillRect(x+3,y+3,s-6,s-6);if(roof)this.roof(c,x+4,y+4,s-8,s-8,'slate');for(let i=0;i<s;i+=7){c.fillStyle='#e0dac0';c.fillRect(x+i,y,4,3);c.fillRect(x+i,y+s-3,4,3);c.fillRect(x,y+i,3,4);c.fillRect(x+s-3,y+i,3,4);}}
  infrastructure(type,level,mask){
    const key=`network:${type}:${level}:${mask}`;if(this.cache.has(key))return this.cache.get(key);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d');c.scale(2,2);c.translate(12,12);
    const arms=[[20,0,1],[40,20,2],[20,40,4],[0,20,8]].filter(a=>mask&a[2]);
    const path=()=>{c.beginPath();for(const [x,y]of arms){c.moveTo(20,20);c.lineTo(x,y);}};
    c.lineCap='butt';c.lineJoin='round';
    if(type==='road'){
      path();c.strokeStyle='#82765555';c.lineWidth=28;c.stroke();path();c.strokeStyle='#a89672';c.lineWidth=23;c.stroke();path();c.strokeStyle=level>2?'#c4bda0':'#b5a883';c.lineWidth=18;c.stroke();
      c.save();path();c.lineWidth=17;const rng=random(mask*19+level);
      // Irregular cobbles stay inside each connected arm rather than filling a tile.
      for(let y=1;y<40;y+=6)for(let x=1;x<40;x+=7){
        const xx=x+rng()*2,yy=y+rng()*2;if(!c.isPointInStroke((xx+12)*2,(yy+12)*2))continue;
        c.fillStyle=rng()>.45?'#d0c4a2':'#8d896e';c.beginPath();c.roundRect(xx-2,yy-1,4+rng()*2,3,1);c.fill();
      }c.restore();
      if(level>=4){path();c.strokeStyle='#ddd0a570';c.lineWidth=2;c.stroke();}
      if(level>=5){this.stone(c,17,17,6,6);}
    }else{
      path();c.strokeStyle='#20332666';c.lineWidth=26;c.stroke();path();c.strokeStyle=type==='wall'?'#696f62':'#61452e';c.lineWidth=22;c.stroke();path();c.strokeStyle=type==='wall'?'#b3b5a1':'#ad8556';c.lineWidth=16;c.stroke();
      for(const [x,y]of arms){const vertical=x===20;for(let i=0;i<=20;i+=6){const xx=20+(x-20)*i/20,yy=20+(y-20)*i/20;
        c.fillStyle=type==='wall'?'#e0dac1':'#e0ba80';if(vertical){c.fillRect(xx-12,yy-2,5,4);c.fillRect(xx+7,yy-2,5,4);}else{c.fillRect(xx-2,yy-12,4,5);c.fillRect(xx-2,yy+7,4,5);}
        if(type==='palisade'){c.strokeStyle='#684c31';c.lineWidth=1;c.beginPath();c.moveTo(xx-(vertical?7:0),yy-(vertical?0:7));c.lineTo(xx+(vertical?7:0),yy+(vertical?0:7));c.stroke();}
      }}
      this.circle(c,20,20,5,type==='wall'?'#b3b5a1':'#ad8556');
      if(level>1){path();c.strokeStyle=level>3?'#d2bb7d':'#596660';c.lineWidth=2;c.stroke();
        for(const [x,y]of arms){const xx=(x+20)/2,yy=(y+20)/2;if(level>=3){this.stone(c,xx-3,yy-3,6,6);}else{c.fillStyle='#666b60';c.fillRect(xx-2,yy-3,4,6);}}
        if(level>=4)this.towerTop(c,12,12,16,false);if(level>=5)this.roof(c,14,14,12,12,'dark');
      }
    }
    this.cache.set(key,canvas);return canvas;
  }
  alternateKeep(c,level,design){
    if(design===3){
      this.polygon(c,[[21,2],[99,2],[118,21],[118,99],[99,118],[21,118],[2,99],[2,21]],'#292735','#bd8a62');
      this.polygon(c,[[25,16],[95,16],[104,25],[104,95],[95,104],[25,104],[16,95],[16,25]],'#624148','#db9c66');
      this.roof(c,37,20,46,54,'dark');this.roof(c,19,42,25,48,'dark');this.roof(c,76,42,25,48,'dark');
      for(const [x,y]of [[12,12],[108,12],[12,108],[108,108]]){this.circle(c,x,y,12,'#171e29');this.polygon(c,[[x-9,y],[x,y-15],[x+9,y],[x,y+12]],'#4b3b50','#c8a06c');this.circle(c,x,y,3,'#ec8155');}
      this.circle(c,60,88,12,'#222633');this.circle(c,60,88,8,'#bd5c50');this.circle(c,60,88,4,'#f6c483');
      for(let i=0;i<level;i++){c.fillStyle='#edc881';c.fillRect(42+i*8,26,3,5);}if(level>=3)this.roof(c,43,6,34,24,'dark');if(level>=4)for(const x of [27,93])this.roof(c,x-7,74,14,32,'dark');
    }else if(design===1){
      // The Highland hall is an open timber compound with a long cross-gabled roof.
      c.fillStyle='#7d8056';c.fillRect(3,3,114,114);this.fence(c,7,7,106,106);
      const palette=level>3?'dark':level>1?'terra':'straw';
      this.roof(c,32,13,56,92,palette);this.roof(c,16,35,88,36,palette,'horizontal');
      for(const [x,y]of [[9,9],[95,9],[9,95],[95,95]]){
        if(level>=3)this.towerTop(c,x-2,y-2,20);
        else this.roof(c,x,y,16,16,'terra');
      }
      this.stone(c,44,22,8,12);this.stone(c,70,79,8,12);
      if(level>1){this.roof(c,10,73,18,19,'terra');this.roof(c,92,73,18,19,'terra');}
      if(level>3){this.stone(c,27,107,66,7);c.fillStyle='#e1c178';c.fillRect(55,109,10,3);}
    }else{
      // The Citadel has a radial silhouette, round bastions and a central court.
      this.polygon(c,[[24,4],[96,4],[116,24],[116,96],[96,116],[24,116],[4,96],[4,24]],'#b9b29a','#e0d2aa');
      this.polygon(c,[[27,17],[93,17],[103,27],[103,93],[93,103],[27,103],[17,93],[17,27]],'#807e61');
      this.roof(c,32,15,56,30,level>2?'dark':'slate','horizontal');this.roof(c,17,41,23,49,'slate');this.roof(c,80,41,23,49,'slate');
      for(const [x,y]of [[17,17],[103,17],[17,103],[103,103]]){
        this.circle(c,x+2,y+3,15,'#2f403d55');this.circle(c,x,y,14,'#c1c3ae');this.circle(c,x,y,10,'#405c64');
        for(let i=0;i<8;i++){const a=i*Math.PI/4;this.polygon(c,[[x,y],[x+Math.cos(a)*10,y+Math.sin(a)*10],[x+Math.cos(a+.78)*10,y+Math.sin(a+.78)*10]],i<4?'#587a81':'#799591');}
        this.circle(c,x,y,2,'#e2c47d');
      }
      this.circle(c,60,71,13,'#bdc0a2');this.circle(c,60,71,10,'#497f81');this.circle(c,60,71,4,'#ddd8b5');
      this.roof(c,44,96,32,18,level>2?'dark':'slate','horizontal');
      if(level>1){this.roof(c,41,46,12,14,'terra');this.roof(c,67,46,12,14,'terra');}
      if(level>3){this.stone(c,42,11,36,5);this.roof(c,48,5,24,26,'dark');}
    }
  }
  building(type,level=1,connections=10,design=0){
    if(['road','wall','palisade'].includes(type))return this.infrastructure(type,level,connections);
    const key=`${type}:${level}:${design}:${connections}`;if(this.cache.has(key))return this.cache.get(key);
    const s=BUILDINGS[type].size*TILE,pad=12,canvas=document.createElement('canvas');canvas.width=(s+pad*2)*2;canvas.height=(s+pad*2)*2;
    const c=canvas.getContext('2d');c.scale(2,2);c.translate(pad,pad);
    const rng=random(type.split('').reduce((v,k)=>v+k.charCodeAt(0),0));
    if(type!=='road'){
      c.fillStyle='#27382b38';c.beginPath();c.roundRect(3,5,s-2,s-2,6);c.fill();
      c.fillStyle=type==='farm'?'#746044':'#93896a';c.fillRect(2,2,s-4,s-4);
      for(let i=0;i<s*2;i++){c.fillStyle=i%2?'#ded0a32b':'#453d3220';c.fillRect(3+rng()*(s-6),3+rng()*(s-6),2,1);}
    }
    if(type==='road'){
      c.fillStyle='#aaa080';c.fillRect(0,0,s,s);for(let y=0;y<s;y+=10)for(let x=0;x<s;x+=13)this.stone(c,x+(y%20?4:0),y,11,8);
    }else if(type==='keep'&&design){this.alternateKeep(c,level,design);
    }else if(type==='keep'){
      this.stone(c,8,8,104,8);this.stone(c,8,8,8,104);this.stone(c,104,8,8,104);this.stone(c,8,104,43,8);this.stone(c,69,104,43,8);
      c.fillStyle='#c0b490';c.fillRect(43,77,34,31);for(let j=0;j<5;j++){c.strokeStyle='#7c816948';c.beginPath();c.moveTo(43,80+j*6);c.lineTo(77,80+j*6);c.stroke();}
      this.roof(c,35,28,50,47,level>2?'dark':'slate');this.roof(c,28,38,14,29,'slate');this.roof(c,78,38,14,29,'slate');
      for(const [x,y]of [[3,3],[93,3],[3,93],[93,93]])this.towerTop(c,x,y,24);
      this.circle(c,60,89,5,'#655d4d');this.circle(c,60,89,3,'#86a5a0');
      if(level>1)this.roof(c,20,65,16,25,'terra');if(level>2)this.roof(c,85,67,15,24,'terra');
    }else if(type==='farm'){
      c.fillStyle='#57472f';c.fillRect(6,6,s-12,s-12);for(let x=11;x<s-9;x+=8){c.fillStyle='#c4ae67';c.fillRect(x,9,3,s-18);for(let y=10;y<s-9;y+=5){c.fillStyle=(x+y)%3?'#d2bb72':'#a9ad58';c.fillRect(x-1,y,5,2);}}
      this.fence(c,3,3,s-6,s-6);this.roof(c,s-27,6,18,22,'straw');
    }else if(type==='palisade'||type==='wall'||type==='gate'){
      if(type==='palisade'){c.fillStyle='#695037';c.fillRect(1,9,38,22);for(let x=3;x<40;x+=6){c.fillStyle='#b9a073';c.fillRect(x,8,4,24);this.circle(c,x+2,10,2,'#e4c89a');}}
      else{this.stone(c,0,9,40,22);for(let x=1;x<40;x+=8){c.fillStyle='#dbd5b7';c.fillRect(x,8,5,5);c.fillRect(x,27,5,5);}}
      if(type==='gate'){c.fillStyle='#5d513b';c.fillRect(14,0,12,40);c.strokeStyle='#d3b272';c.lineWidth=2;c.beginPath();c.moveTo(15,19);c.lineTo(25,19);c.moveTo(15,23);c.lineTo(25,23);c.stroke();}
    }else if(type==='temple'){
      this.stone(c,9,9,102,102);this.roof(c,43,13,34,90,'slate');this.roof(c,16,40,88,30,'slate','horizontal');
      this.circle(c,60,55,20,'#b8c6b0');this.circle(c,60,55,16,'#467f7d');for(let i=0;i<8;i++){const a=i*Math.PI/4;this.polygon(c,[[60,55],[60+Math.cos(a)*16,55+Math.sin(a)*16],[60+Math.cos(a+.78)*16,55+Math.sin(a+.78)*16]],i<4?'#80b7a4':'#3a6f70','#a5c5ad');}this.circle(c,60,55,5,'#e6cf83');
      for(const x of [25,95]){this.circle(c,x,92,8,'#a4b5a3');this.circle(c,x,92,5,'#5d9c97');}for(let i=1;i<level;i++)this.roof(c,9+(i-1)*25,14,19,20,'terra');
    }else if(type==='tower'||type==='ballista'){
      for(const [dx,dy,bit]of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(connections&bit){c.strokeStyle='#bbb9a0';c.lineWidth=18;c.beginPath();c.moveTo(s/2,s/2);c.lineTo(s/2+dx*s/2,s/2+dy*s/2);c.stroke();}
      const n=type==='tower'?4:13;this.towerTop(c,n,n,s-n*2,false);
      c.save();c.translate(s/2,s/2);c.rotate(-.35);c.fillStyle='#b7a074';c.fillRect(-3,-s*.3,6,s*.6);c.strokeStyle='#d7c899';c.lineWidth=3;c.beginPath();c.arc(0,-4,s*.24,Math.PI*.9,Math.PI*2.1);c.stroke();c.strokeStyle='#c2c9b2';c.lineWidth=1;c.beginPath();c.moveTo(-s*.23,-5);c.lineTo(0,10);c.lineTo(s*.23,-5);c.stroke();c.restore();
    }else if(['quarry','ironmine','goldmine'].includes(type)){
      this.polygon(c,[[25,12],[58,8],[71,30],[63,60],[32,64],[17,39]],'#565b50','#aaa88d');
      this.polygon(c,[[32,19],[56,18],[61,34],[51,52],[32,46],[27,32]],'#363e39','#7c8778');
      for(let i=0;i<5;i++)this.ore(c,34+rng()*26,22+rng()*23,type==='quarry'?'stone':type==='ironmine'?'iron':'gold',.45);
      this.roof(c,4,46,27,26,'dark');c.strokeStyle='#9e8660';c.lineWidth=3;c.beginPath();c.moveTo(46,43);c.lineTo(65,73);c.moveTo(51,40);c.lineTo(70,70);c.stroke();
    }else if(type==='lumber'){
      this.roof(c,7,9,35,55,'straw');this.fence(c,49,9,24,57);
      for(let y=14;y<65;y+=9){c.fillStyle='#6f4b31';c.fillRect(52,y,18,6);c.fillStyle='#b39460';c.fillRect(52,y,18,2);this.circle(c,53,y+3,3,'#d4b278');}
      this.circle(c,40,68,7,'#d6c9aa');this.circle(c,40,68,2,'#5a665b');
    }else if(type==='barracks'||type==='range'){
      this.roof(c,5,7,68,20,type==='barracks'?'slate':'straw','horizontal');this.roof(c,5,29,23,44,'slate');
      if(type==='range')for(let y=39;y<73;y+=14){this.circle(c,61,y,6,'#d3bf90');this.circle(c,61,y,4,'#9b543e');this.circle(c,61,y,2,'#e6d9ba');}
      else{this.roof(c,53,29,20,44,'slate');for(let y=39;y<70;y+=10){c.fillStyle='#544e39';c.fillRect(36,y,9,2);c.fillStyle='#d2cfab';c.fillRect(39,y-3,2,9);}}
    }else if(type==='stable'){
      this.roof(c,6,7,s-12,27,'terra','horizontal');this.roof(c,6,36,30,s-43,'terra');
      for(let y=42;y<s-13;y+=22){this.fence(c,45,y,s-53,19);this.circle(c,58,y+9,6,'#b9a460');c.fillStyle='#705e45';c.fillRect(83,y+6,16,7);}
    }else if(type==='smith'){
      this.roof(c,6,7,40,63,'dark');this.stone(c,52,13,20,24);this.circle(c,62,25,7,'#3a3830');this.circle(c,62,25,4,'#edaa5c');
      c.fillStyle='#39413d';c.fillRect(52,51,17,8);c.fillRect(56,46,9,18);this.fence(c,48,42,25,29);
    }else if(type==='warehouse'){
      this.roof(c,8,6,63,49,'straw','horizontal');for(let x=11;x<70;x+=15){this.stone(c,x,62,10,10);c.strokeStyle='#76664a';c.strokeRect(x+2,64,6,6);}
    }else{
      this.roof(c,13,8,48,58,'terra');this.roof(c,49,37,24,32,'terra','horizontal');this.stone(c,21,15,8,10);
      this.fence(c,5,4,70,71);this.circle(c,10,67,4,'#556b40');
    }
    paintBuildingUpgrades(this,c,type,level,s,design);
    this.cache.set(key,canvas);return canvas;
  }
  thumbnail(type,level=1,design=0){const key=`${type}:${level}:${design}`;if(!this.thumbnails.has(key))this.thumbnails.set(key,this.building(type,level,10,design).toDataURL());return this.thumbnails.get(key);}
  tree(c,x,y,s=1,shade=.5){
    const r=17*s;this.circle(c,x+4,y+5,r,'#1d2f2350');
    const blobs=[[0,0,1],[-.5,-.2,.62],[.38,-.45,.66],[.45,.35,.62],[-.27,.49,.62]];
    for(let i=0;i<blobs.length;i++){const [dx,dy,rr]=blobs[i],xx=x+dx*r,yy=y+dy*r,rad=r*rr;
      const grad=c.createRadialGradient(xx-rad*.3,yy-rad*.4,1,xx,yy,rad);grad.addColorStop(0,`hsl(${88+shade*20} 28% ${39+shade*5}%)`);grad.addColorStop(.65,'#3b5636');grad.addColorStop(1,'#273e2d');c.fillStyle=grad;c.beginPath();c.arc(xx,yy,rad,0,7);c.fill();}
    for(let i=0;i<10;i++){const a=i*2.4+shade*6;this.circle(c,x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,1.5,'#adc57d28');}
  }
  ore(c,x,y,type,s=1){
    c.save();c.translate(x,y);c.scale(s,s);this.polygon(c,[[-16,-8],[-3,-15],[12,-10],[17,5],[5,15],[-13,11]],'#666f63','#a8af97');
    this.polygon(c,[[-16,-8],[-3,-15],[3,-2],[-13,11]],'#a2a58e');this.polygon(c,[[-3,-15],[12,-10],[3,-2]],'#c0c0a4');
    if(type!=='stone'){c.strokeStyle=type==='gold'?'#efc568':'#b5c3cc';c.lineWidth=3;c.beginPath();c.moveTo(-7,-10);c.lineTo(1,-3);c.lineTo(-3,5);c.lineTo(8,11);c.stroke();c.strokeStyle=type==='gold'?'#996a2b':'#3f515e';c.lineWidth=1;c.beginPath();c.moveTo(7,-8);c.lineTo(4,2);c.lineTo(11,5);c.stroke();}c.restore();
  }
}
