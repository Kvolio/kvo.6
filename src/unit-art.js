import {ENEMIES,UNITS} from './data.js';

export class UnitArtwork{
  constructor(art){this.art=art;this.cache=new Map();this.thumbnails=new Map();}
  thumbnail(type){if(!this.thumbnails.has(type)){const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;const c=canvas.getContext('2d');c.scale(2,2);c.translate(48,48);c.rotate(-Math.PI/2);if(ENEMIES[type]?.flying)this.wings(c,type,0,true);c.drawImage(this.sprite(type),-48,-48,96,96);this.thumbnails.set(type,canvas.toDataURL());}return this.thumbnails.get(type);}
  sprite(type){
    if(this.cache.has(type))return this.cache.get(type);
    const d=ENEMIES[type]||UNITS[type],resolution=d.boss||d.scale>=3?6:3;
    const canvas=document.createElement('canvas');canvas.width=96*resolution;canvas.height=96*resolution;const c=canvas.getContext('2d');c.scale(resolution,resolution);c.translate(48,48);
    const a=this.art,enemy=!!ENEMIES[type],demon=!!d.demon;
    const poly=(p,color,stroke)=>a.polygon(c,p,color,stroke),circle=(x,y,r,color)=>a.circle(c,x,y,r,color);
    const line=(x,y,xx,yy,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
    const blade=(long=false,fire=false)=>{line(-3,-12,17,-12,'#8d7252',2);poly([[5,-15],[long?31:22,-12],[5,-9]],fire?'#ffb74b':'#dbe0cd',fire?'#dc6530':'#6b7e7f');line(6,-17,6,-7,'#d6b166',2);};
    const axe=side=>{line(-7,side*12,17,side*12,'#95704d',2.5);poly([[10,side*12],[13,side*20],[23,side*17],[20,side*9]],demon?'#c25742':'#b9c6bf','#4d5856');};
    const shield=(color='#446975',large=false)=>poly([[10,5],[large?20:13,10],[10,large?24:18],[-5,large?22:14],[-8,7]],color,'#c4c4ae');
    const bow=(crossbow=false,fire=false)=>{line(-3,-12,23,-12,'#a88955',2);c.strokeStyle=fire?'#f8b56b':'#d3b675';c.lineWidth=crossbow?3:2;c.beginPath();c.arc(13,-12,10,-1.1,1.1);c.stroke();line(17,-21,17,-3,'#dce0b9',.8);if(crossbow)line(3,-12,25,-12,'#71898a',3);};
    const horns=()=>{poly([[2,-5],[1,-14],[10,-8]],'#d7c7a0');poly([[2,5],[1,14],[10,8]],'#d7c7a0');};
    const torso=(color,helmet='#b6c7c6',cape=false)=>{
      if(cape)poly([[0,-11],[-24,-16],[-19,0],[-24,16],[0,11]],cape===true?'#78392f':cape,'#443e36');
      const cloth=c.createLinearGradient(-14,-12,8,12);cloth.addColorStop(0,color);cloth.addColorStop(.45,color);cloth.addColorStop(1,'#343632');c.fillStyle=cloth;c.beginPath();c.ellipse(-3,0,9,12,0,0,7);c.fill();circle(-2,-8,4,color);circle(-2,8,4,color);line(-7,-7,-7,7,'#d2b082',1.1);line(-3,-10,1,-10,'#e2ddbb77',1);line(-3,10,1,10,'#111c2966',1.5);
      circle(3,0,6,helmet);line(2,-5,7,0,'#ffffff55',1);if(helmet!=='#d2ac83')line(7,-4,7,4,'#394749',2);
    };
    const horse=(dark=false)=>{
      c.fillStyle=dark?'#343337':'#826445';c.beginPath();c.ellipse(-6,0,18,9,0,0,7);c.fill();circle(12,0,7,dark?'#544340':'#ad8b60');poly([[15,-4],[24,-2],[24,3],[15,5]],'#675442');line(-22,0,-33,4,'#3b3431',3);
      for(const y of [-9,9]){line(-17,y,-11,y,'#d2c39e',3);line(5,y,10,y,'#d2c39e',3);}
    };
    if(type==='dragon'){
      poly([[31,0],[17,-7],[-22,-6],[-40,0],[-22,6],[17,7]],'#353f40','#8d8d7a');
      for(let x=-20;x<15;x+=6)poly([[x,-6],[x-3,-10],[x+3,-6],[x+3,6],[x-3,10],[x,6]],'#687267');
      poly([[14,-6],[22,-12],[20,-5],[30,-3],[34,0],[30,3],[20,5],[22,12],[14,6]],'#657568');circle(25,-4,2,'#f5c66d');circle(25,4,2,'#f5c66d');
    }else if(['ram'].includes(type)){
      for(const y of [-15,12]){c.fillStyle='#303733';c.fillRect(-19,y,9,5);c.fillRect(12,y,9,5);}c.fillStyle='#825f3e';c.fillRect(-25,-12,47,24);a.roof(c,-22,-12,40,24,'dark','horizontal');line(-20,0,32,0,'#c1b28e',6);poly([[28,-6],[37,-3],[37,3],[28,6]],'#8b9895');
    }else if(['hellhound','hellrunner'].includes(type)){
      const color=type==='hellhound'?'#883e32':'#c26336';c.fillStyle=color;c.beginPath();c.ellipse(-4,0,type==='hellhound'?17:12,7,0,0,7);c.fill();
      for(const [x,y]of [[-14,-7],[-14,7],[7,-7],[7,7]])line(x,y,x+6,y*1.6,'#423732',3);
      poly([[8,-6],[21,-4],[28,0],[21,4],[8,6]],color,'#df8b50');line(-20,0,-32,-8,'#4e3334',3);circle(21,-3,1.8,'#ffe0a1');circle(21,3,1.8,'#ffe0a1');
      for(let x=-12;x<10;x+=5)poly([[x,-3],[x+3,0],[x,3]],'#efab55');
    }else if(['ogre','brute','champion','demonbrute'].includes(type)){
      const color=demon?'#914934':'#83916b';torso(color,demon?'#bf7750':'#a3af82');circle(-3,-13,6,color);circle(-3,13,6,color);
      if(type==='champion'){shield('#626b65',true);for(const y of [-13,13]){poly([[-10,y-5],[2,y-7],[7,y],[-2,y+5]],'#525f61','#abbdb1');circle(-3,y,1.7,'#e9c883');}line(-4,-13,30,-13,'#5a5545',4);poly([[19,-22],[30,-21],[32,-7],[18,-5]],'#929982','#d7cba4');}
      else line(-3,17,22,17,'#785a3e',6);circle(22,17,6,'#5f6555');if(demon){horns();line(-10,-10,4,-11,'#ec9b45',3);}else axe(-1);
      if(type==='brute'){for(const y of [-10,10])poly([[-12,y-3],[-5,y-6],[2,y],[-7,y+4]],'#80694b','#baa67d');circle(-12,0,5,'#c8c0a0');}
    }else if(['giant','titan','hellfiregolem'].includes(type)){
      const lava=type==='hellfiregolem',color=lava?'#3d3634':'#879085';
      poly([[-17,-10],[-7,-16],[9,-12],[14,0],[8,13],[-9,16],[-19,7]],color,'#afb39e');
      circle(-4,-17,7,color);circle(-4,17,7,color);circle(11,0,8,lava?'#514039':'#aeb29e');
      for(const [x,y]of [[-8,-6],[-3,6],[4,-2]]){line(x-5,y-5,x,y,lava?'#ef873b':'#59635c',2);line(x,y,x-3,y+7,lava?'#f5bd62':'#59635c',2);}
      circle(15,-3,1.8,lava?'#ffd79b':'#d7ddc5');circle(15,3,1.8,lava?'#ffd79b':'#d7ddc5');
      if(type==='titan'){for(const y of [-19,19]){poly([[-15,y-7],[-4,y-10],[5,y],[-5,y+8]],'#636f68','#c2c5ac');line(-10,y-4,0,y+2,'#cbd8b677',1);}for(const x of [-12,-5,2])poly([[x,-4],[x+3,0],[x,4],[x-2,0]],'#afd7c8');}
      if(type==='giant'){circle(14,17,10,'#879180');poly([[8,12],[19,11],[23,19],[14,25]],'#bbc0a4','#657460');line(-16,-9,-6,-13,'#4a6750',4);}
    }else if(type==='skeleton'){
      line(-11,0,10,0,'#d6d0b3',3);for(let x=-9;x<4;x+=4){line(x,-7,x+2,0,'#c7c5ac',2);line(x+2,0,x,7,'#c7c5ac',2);}circle(8,0,6,'#e3dcc0');circle(11,-2,1.8,'#423d35');circle(11,2,1.8,'#423d35');blade();
    }else if(['succubus','infernalmage'].includes(type)){
      const purple=type==='succubus';poly([[12,0],[0,-11],[-21,-17],[-16,0],[-21,17],[0,11]],purple?'#77465f':'#353844','#b77569');circle(5,0,5,purple?'#c7948b':'#5c4545');horns();line(-15,-15,23,-15,'#a08664',2);circle(23,-15,5,purple?'#da94b1':'#ed9967');circle(23,-15,2,'#ffe5b4');
    }else if(type==='worker'){
      torso('#a18751','#d2ac83');circle(3,0,8,'#c5ab70');circle(4,-1,5,'#e2ca8c');axe(-1);c.fillStyle='#6f7851';c.fillRect(-16,-4,6,9);
    }else{
      if(['knight','blackknight','demonknight'].includes(type))horse(type!=='knight');
      const ranged=['archer','crossbow','bow','infernalarcher'].includes(type);
      const armor=demon?'#533f42':enemy?'#77504a':'#4b7880';
      const cape=['demonlord','conqueror','blackknight'].includes(type)?'#171f29':type==='archdemon'?'#612d38':type==='warlord'?'#4d354c':d.boss?'#9c5440':type==='knight'?'#526a7f':false;
      torso(ranged?(enemy?'#694456':'#4e7564'):armor,demon?'#98594d':ranged?'#698375':'#b8c4c0',cape);
      if(demon)horns();
      if(type==='dreadguard'){shield('#2a323b',true);poly([[8,10],[15,13],[9,19]],'#ba5d48');blade();}
      else if(ranged){bow(type==='crossbow',demon);line(-12,-2,-12,9,'#a88b58',4);}
      else if(type==='spear'||type==='knight'){line(-17,-13,34,-13,'#a18259',2);poly([[29,-17],[40,-13],[29,-9]],'#d8e0d0');shield();}
      else if(['barbarian','berserker','chief'].includes(type)){axe(-1);axe(1);line(1,-4,-5,-4,'#c7a577',3);}
      else{blade(d.boss||demon,['archdemon','demonlord','dragonknight'].includes(type));if(type!=='wingeddemon')shield(demon?'#493542':enemy?'#855444':'#557a82');}
      if(d.boss){line(1,-7,1,7,type==='demonlord'?'#e49f5b':'#e0c17d',2);circle(2,0,2,'#f2d89c');}
      if(type==='captain'){line(-12,-20,-12,19,'#b89b68',2);poly([[-12,-20],[-29,-19],[-24,-12],[-29,-6],[-12,-8]],'#a05243','#e4c47c');circle(-20,-13,2,'#e9d4a0');}
      if(type==='chief'){for(let i=0;i<12;i++){const t=i*Math.PI/6;circle(-7+Math.cos(t)*9,Math.sin(t)*13,2.8,i%2?'#c2ac84':'#857755');}poly([[5,-5],[1,-12],[10,-8],[9,-2]],'#d8c9a6');poly([[5,5],[1,12],[10,8],[9,2]],'#d8c9a6');}
      if(type==='blackknight'){shield('#28313d',true);line(0,-6,-13,-8,'#b04f4e',4);poly([[-4,-13],[3,-16],[6,-10],[-3,-8]],'#252e36','#b1b5ad');}
      if(type==='warlord'){for(const y of [-11,11])poly([[-10,y-4],[3,y-5],[6,y+4],[-7,y+5]],'#837357','#d5bc77');line(-16,-22,-16,20,'#d3b574',2);poly([[-16,-22],[-31,-22],[-31,-6],[-24,-10],[-16,-6]],'#573749','#e6bd76');circle(-24,-17,3,'#d4bd7f');}
      if(type==='dragonknight'){for(const y of [-11,11])poly([[-13,y],[-7,y*1.9],[2,y*1.3],[5,y]],'#446964','#95aa8b');poly([[3,-5],[-3,-10],[9,-6],[11,0],[9,6],[-3,10],[3,5]],'#8f9f84','#e4c784');}
      if(['demonlord','conqueror'].includes(type)){
        for(const y of [-11,11]){poly([[-13,y-5],[2,y-6],[7,y],[-2,y+6]],'#252e39','#a68761');poly([[-6,y],[0,y*1.75],[2,y]],'#be9c69');}
        poly([[1,-5],[0,-9],[4,-6],[6,-9],[8,-4],[8,4],[6,9],[4,6],[0,9],[1,5]],type==='demonlord'?'#ad774a':'#d5ba7f','#eed7a4');
        line(-19,-10,-12,-3,'#aa775353',1);line(-19,10,-12,3,'#aa775353',1);
      }
      if(type==='archdemon'){for(const y of [-12,12])poly([[-7,y],[0,y*1.65],[5,y*1.35],[8,y]],'#b77850','#f6c58e');}
    }
    this.cache.set(type,canvas);return canvas;
  }
  wings(c,type,time,airborne){
    const a=this.art,dragon=type==='dragon',span=airborne?(dragon?35:26)+Math.sin(time*5)*5:13,color=dragon?'#364d4b':type==='infernalarcher'?'#76566e':'#753c47';
    for(const side of [-1,1]){
      a.polygon(c,[[9,side*4],[-1,side*span],[-18,side*(span-4)],[-11,side*12],[-24,side*7],[-8,side*2]],color,dragon?'#82917c':'#be7a74');
      c.strokeStyle=dragon?'#819082':'#c17e79';c.lineWidth=.8;c.beginPath();c.moveTo(7,side*4);c.lineTo(-1,side*span);c.lineTo(-6,side*12);c.lineTo(-18,side*(span-4));c.stroke();
    }
  }
}
