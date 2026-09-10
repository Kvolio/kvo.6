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
    if(['dragon','dragonrider','elderdragonrider'].includes(type)){
      const black=type==='dragon',scales=black?'#252e38':type==='dragonrider'?'#606e52':'#374e74',edge=black?'#7f8c9b':'#b7b99b';
      // A long, articulated dragon seen from above, with claws and a visible saddle rider.
      poly([[-45,5],[-34,-2],[-23,-6],[-11,-9],[7,-10],[21,-7],[34,-5],[43,0],[34,5],[21,7],[7,10],[-11,9],[-25,5],[-36,5]],scales,edge);
      for(let x=-29;x<22;x+=5){poly([[x,-4],[x+5,0],[x,4],[x-3,0]],black?'#607281':'#8e9978','#1d2835');}
      for(const side of [-1,1]){poly([[-16,side*5],[-20,side*16],[-11,side*21],[-4,side*17],[-9,side*9]],scales,edge);poly([[11,side*7],[16,side*18],[27,side*15],[23,side*9]],scales,edge);for(let i=0;i<3;i++)line(20+i*3,side*14,23+i*3,side*20,'#e7ddc0',1);poly([[25,side*6],[16,side*15],[21,side*4]],'#b9b6a3');circle(34,side*4,2,black?'#ffb75e':'#bce1f2');}
      line(36,-2,42,0,'#131b25',1.5);line(36,2,42,0,'#131b25',1.5);poly([[-11,-8],[5,-8],[10,0],[5,8],[-11,8]],'#713a3f','#d8b875');
      c.save();c.translate(-1,0);c.scale(.48,.48);if(black)c.drawImage(this.sprite('conqueror'),-48,-48,96,96);else{torso(type==='dragonrider'?'#a17145':'#547e99','#d0c7ac',true);bow();}c.restore();
      if(black){line(-11,-6,-21,-19,'#d9bd7e',1.3);poly([[-21,-19],[-34,-19],[-31,-11],[-21,-12]],'#8e3940','#edc179');}
    }else if(type==='demonlord'){
      // The Cinder Sovereign: sculpted anatomy, a bone crown and asymmetric regalia, viewed from above.
      // Local curves keep the silhouette smooth at the boss's full size and in the offline build.
      const shape=(fill,stroke,draw,width=.7)=>{c.beginPath();draw();c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
      const grad=(x,y,r,inner,outer)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);return g;};
      c.lineJoin='round';c.lineCap='round';
      // A heavy, shredded crimson mantle fans behind the shoulder line.
      shape(grad(-8,-5,43,'#8e2943','#200f23'),'#160f1c',()=>{c.moveTo(5,-18);c.bezierCurveTo(-16,-31,-29,-23,-40,-34);c.quadraticCurveTo(-36,-21,-44,-18);c.lineTo(-35,-12);c.lineTo(-45,-4);c.lineTo(-38,2);c.lineTo(-44,14);c.lineTo(-32,16);c.lineTo(-36,30);c.bezierCurveTo(-16,20,-3,28,10,17);});
      for(const y of [-23,-13,0,13,23]){c.strokeStyle='#d465672e';c.lineWidth=1.1;c.beginPath();c.moveTo(0,y*.65);c.quadraticCurveTo(-19,y*.45,-36,y);c.stroke();}
      // Digitigrade legs, cloven sabatons and exposed sinew beneath the armor.
      for(const side of [-1,1]){c.save();c.scale(1,side);
        shape(grad(-16,9,18,'#854552','#281d2c'),'#180e19',()=>{c.moveTo(-7,3);c.bezierCurveTo(-17,0,-26,7,-24,15);c.quadraticCurveTo(-20,19,-12,15);c.lineTo(-3,11);});
        shape('#343240','#be9472',()=>{c.moveTo(-24,10);c.quadraticCurveTo(-34,10,-35,20);c.lineTo(-28,23);c.lineTo(-24,19);c.lineTo(-21,23);c.quadraticCurveTo(-14,18,-17,13);});line(-27,15,-28,21,'#11111c',1.2);
        // Bulky upper arms taper to plated forearms instead of a shared soldier torso.
        shape(grad(3,17,19,'#975060','#321c2c'),'#190f1b',()=>{c.moveTo(-1,9);c.bezierCurveTo(-5,20,1,25,10,27);c.quadraticCurveTo(19,31,23,24);c.quadraticCurveTo(17,17,12,15);c.lineTo(9,7);});
        for(let i=0;i<3;i++)shape(i%2?'#474052':'#332e40','#c69a6d',()=>{const x=7+i*4;c.moveTo(x,18);c.quadraticCurveTo(x+6,20,x+7,28);c.lineTo(x+2,29);c.quadraticCurveTo(x+2,24,x-2,22);});
        c.restore();
      }
      // Ribbed blackened armor; thin gold inlay traces each interlocking plate.
      shape(grad(3,-7,30,'#706376','#211d2d'),'#d5ac78',()=>{c.moveTo(-21,-6);c.bezierCurveTo(-22,-15,-7,-21,8,-17);c.quadraticCurveTo(20,-12,18,0);c.quadraticCurveTo(20,12,8,17);c.bezierCurveTo(-7,21,-22,15,-21,6);});
      for(const side of [-1,1])for(let i=0;i<4;i++){c.save();c.scale(1,side);const x=-17+i*6;shape(grad(x,3,16,'#675567','#252133'),'#a58061',()=>{c.moveTo(x,1);c.quadraticCurveTo(x+10,1,x+13,9);c.lineTo(x+8,14-i*.6);c.quadraticCurveTo(x+4,6,x-1,5);});c.restore();}
      line(-19,0,14,0,'#140f20',3);for(let x=-17;x<13;x+=5){poly([[x-2,0],[x+1,-2.5],[x+4,0],[x+1,2.5]],'#ddaf72','#543846');circle(x+1,0,.65,'#fff1c1');}
      // Swept, baroque shoulder shells with hooked bone spines.
      for(const side of [-1,1]){c.save();c.scale(1,side);
        shape(grad(5,13,21,'#7d5869','#211d30'),'#e5bc82',()=>{c.moveTo(-6,11);c.bezierCurveTo(-9,22,3,30,13,25);c.quadraticCurveTo(23,22,17,12);c.quadraticCurveTo(9,6,-6,11);},1);
        shape('#362739','#b37c65',()=>{c.moveTo(-2,14);c.quadraticCurveTo(7,10,16,15);c.quadraticCurveTo(14,24,5,24);c.quadraticCurveTo(-1,23,-2,14);});
        for(let i=0;i<3;i++)shape(grad(i*6,24,12,'#f1d6a3','#92705e'),'#4f3840',()=>{const x=-3+i*6,y=21-i;c.moveTo(x,y);c.bezierCurveTo(x-5,y+6,x-6,y+12,x-1,y+15);c.quadraticCurveTo(x-2,y+8,x+5,y+1);});
        circle(6,17,3.3,'#221427');circle(6,17,1.8,'#f29b97');line(4.8,17,7.2,17,'#fff0c5',.65);c.restore();
      }
      // Extended talons cradle a violet soul flame on the left hand.
      shape('#743646','#d4877c',()=>{c.moveTo(18,22);c.quadraticCurveTo(25,18,31,23);c.lineTo(35,29);c.lineTo(30,28);c.lineTo(33,34);c.lineTo(28,31);c.lineTo(26,35);c.lineTo(23,29);c.lineTo(19,28);});
      const soul=grad(29,29,14,'#c19affbb','#8f48ff00');circle(29,29,14,soul);
      shape('#a66bea',null,()=>{c.moveTo(26,33);c.bezierCurveTo(19,26,30,25,28,18);c.quadraticCurveTo(35,25,32,28);c.quadraticCurveTo(37,27,35,23);c.bezierCurveTo(40,31,34,38,26,33);});circle(30,29,2.7,'#efe1ff');
      // A hooked executioner's glaive with an engraved crescent blade, held across the right flank.
      line(-29,-29,34,-29,'#151320',4);line(-29,-30,34,-30,'#b88c67',1.2);
      for(let x=9;x<22;x+=2)line(x,-31,x-1,-27,'#d0b498',.7);
      shape(grad(26,-34,24,'#c7b7bd','#3b3048'),'#e6c491',()=>{c.moveTo(25,-29);c.bezierCurveTo(19,-41,2,-47,-13,-39);c.bezierCurveTo(2,-42,12,-31,9,-23);c.quadraticCurveTo(22,-24,25,-29);},1);
      c.strokeStyle='#e3889e';c.lineWidth=1;c.beginPath();c.moveTo(-7,-39);c.quadraticCurveTo(10,-40,19,-29);c.stroke();
      for(let i=0;i<4;i++){c.save();c.translate(4+i*4,-37+i*1.6);c.rotate(.4);line(-1,-1,1,1,'#542e47',.6);line(1,-1,-1,1,'#542e47',.6);c.restore();}
      poly([[32,-32],[40,-29],[32,-26]],'#ccac83','#4d3542');
      // An elongated bone death mask with a six-point crown and curling ram horns.
      shape(grad(23,-3,14,'#edd4ad','#795766'),'#2a1826',()=>{c.moveTo(13,-7);c.quadraticCurveTo(23,-13,30,-6);c.lineTo(36,-3);c.lineTo(33,0);c.lineTo(36,3);c.lineTo(30,6);c.quadraticCurveTo(23,13,13,7);c.quadraticCurveTo(17,0,13,-7);},1);
      for(const side of [-1,1]){c.save();c.scale(1,side);
        shape(grad(15,11,20,'#e8c695','#71505b'),'#352237',()=>{c.moveTo(17,5);c.bezierCurveTo(10,5,3,10,7,16);c.bezierCurveTo(13,25,28,18,28,11);c.bezierCurveTo(26,16,16,17,14,13);c.quadraticCurveTo(12,10,21,9);});
        for(let i=0;i<4;i++){const x=9+i*3;line(x,15+i*.3,x+1,18+i*.1,'#70505b',.55);}
        shape('#d7b68d','#765363',()=>{c.moveTo(21,7);c.quadraticCurveTo(27,13,36,11);c.quadraticCurveTo(28,9,28,5);});
        poly([[17,4],[12,5],[9,1],[18,1]],'#bb927b','#594252');
        shape('#271728',null,()=>{c.moveTo(24,3);c.lineTo(32,2);c.quadraticCurveTo(29,6,25,6);});line(26,4,30,3,'#ff718c',1.2);c.restore();
      }
      poly([[17,-2],[24,-1],[30,0],[24,1],[17,2],[14,0]],'#f5d9a7','#9a7170');line(32,-1,32,1,'#4e2338',1);
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
    }else if(type==='cleric'){
      poly([[-21,-12],[-11,-15],[10,-8],[16,0],[10,8],[-11,15],[-21,12],[-16,0]],'#dbe0c7','#718f82');torso('#83ada1','#e8d6ae');line(-18,-17,28,-17,'#c5a76a',2);circle(27,-17,5,'#87c3b2');line(27,-24,27,-10,'#f3df9b',2);line(21,-17,33,-17,'#f3df9b',2);line(-10,-6,-10,6,'#d6b976',2);
    }else if(type==='worker'){

      torso('#a18751','#d2ac83');circle(3,0,8,'#c5ab70');circle(4,-1,5,'#e2ca8c');axe(-1);c.fillStyle='#6f7851';c.fillRect(-16,-4,6,9);
    }else{
      if(['mountedknight','mountedarcher','blackknight','demonknight'].includes(type))horse(type!=='mountedknight');
      const ranged=['archer','crossbow','mountedarcher','bow','infernalarcher'].includes(type);
      const armor=demon?'#533f42':enemy?'#77504a':'#4b7880';
      const cape=['demonlord','conqueror','blackknight'].includes(type)?'#171f29':type==='archdemon'?'#612d38':type==='warlord'?'#4d354c':d.boss?'#9c5440':['knight','mountedknight'].includes(type)?'#526a7f':false;
      torso(ranged?(enemy?'#694456':'#4e7564'):armor,demon?'#98594d':ranged?'#698375':'#b8c4c0',cape);
      if(demon)horns();
      if(type==='dreadguard'){shield('#2a323b',true);poly([[8,10],[15,13],[9,19]],'#ba5d48');blade();}
      else if(ranged){bow(type==='crossbow',demon);line(-12,-2,-12,9,'#a88b58',4);}
      else if(type==='spear'||type==='mountedknight'){line(-17,-13,34,-13,'#a18259',2);poly([[29,-17],[40,-13],[29,-9]],'#d8e0d0');shield();}
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
    const a=this.art,dragon=['dragon','dragonrider','elderdragonrider'].includes(type),span=airborne?(dragon?35:26)+Math.sin(time*5)*5:13,color=dragon?(type==='dragon'?'#26313e':type==='dragonrider'?'#637358':'#416389'):type==='infernalarcher'?'#76566e':'#753c47';
    if(dragon){for(const side of [-1,1]){c.save();c.scale(1,side);const span=airborne?43+Math.sin(time*4)*4:19,membrane=c.createLinearGradient(0,4,-5,span);membrane.addColorStop(0,type==='dragon'?'#1d2735':color);membrane.addColorStop(1,type==='dragon'?'#596c7b':type==='dragonrider'?'#96a178':'#7fa1b6');c.fillStyle=membrane;c.strokeStyle=type==='dragon'?'#94a2a8':'#b6c5ac';c.lineWidth=1;c.beginPath();c.moveTo(12,5);c.bezierCurveTo(21,15,16,span*.65,8,span);c.quadraticCurveTo(3,span*.73,-7,span*.78);c.quadraticCurveTo(-8,span*.48,-19,span*.58);c.quadraticCurveTo(-14,span*.31,-30,span*.35);c.quadraticCurveTo(-20,8,-11,3);c.closePath();c.fill();c.stroke();for(const [x,y]of [[8,span],[-7,span*.78],[-19,span*.58]]){c.beginPath();c.moveTo(7,5);c.quadraticCurveTo(0,span*.35,x,y);c.stroke();}c.restore();}return;}
    for(const side of [-1,1]){
      a.polygon(c,[[9,side*4],[-1,side*span],[-18,side*(span-4)],[-11,side*12],[-24,side*7],[-8,side*2]],color,dragon?'#82917c':'#be7a74');
      c.strokeStyle=dragon?'#819082':'#c17e79';c.lineWidth=.8;c.beginPath();c.moveTo(7,side*4);c.lineTo(-1,side*span);c.lineTo(-6,side*12);c.lineTo(-18,side*(span-4));c.stroke();
    }
  }
}
