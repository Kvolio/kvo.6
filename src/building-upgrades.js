// Added wings, machinery and fortifications communicate completed upgrades at
// map scale. This shares the same cached Canvas drawing path as menu portraits.
export function paintBuildingUpgrades(a,c,type,level,s,design){
  if(level<2)return;
  const roof=(x,y,w,h,color='slate',axis='vertical')=>a.roof(c,x,y,w,h,color,axis);
  const stone=(x,y,w,h)=>a.stone(c,x,y,w,h);
  const line=(x,y,xx,yy,color='#aa956c',width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
  const barrel=(x,y)=>{a.circle(c,x+1,y+2,4,'#3a3a2c55');a.circle(c,x,y,4,'#9b7c4e');line(x-3,y-2,x+3,y-2,'#4e574b',1);line(x-3,y+2,x+3,y+2,'#4e574b',1);};
  const banner=(x,y,color='#465f78')=>{line(x,y,x,y+15,'#ddc598',1.5);a.polygon(c,[[x,y],[x+9,y+2],[x+6,y+7],[x+9,y+10],[x,y+8]],color,'#d1b575');};
  const wheel=(x,y,r)=>{a.circle(c,x,y,r+1,'#453e32');a.circle(c,x,y,r,'#ae9870');a.circle(c,x,y,r-2,'#4b5144');for(let i=0;i<8;i++){const t=i*Math.PI/4;line(x,y,x+Math.cos(t)*r,y+Math.sin(t)*r,'#c5b18b',1.5);}a.circle(c,x,y,2,'#ded1a3');};
  const cupola=(x,y,r,color='slate')=>{stone(x-r-1,y-r-1,r*2+2,r*2+2);roof(x-r,y-r,r*2,r*2,color);a.circle(c,x,y,2,'#ddc586');};
  if(type==='keep'){
    if(level>=3){
      if(design===1){stone(6,6,108,6);stone(6,6,6,108);stone(108,6,6,108);roof(17,34,86,38,level>=4?'dark':'terra','horizontal');}
      else if(design===2){roof(17,40,24,53,level>=4?'dark':'slate');roof(79,40,24,53,level>=4?'dark':'slate');}
      else{roof(24,27,72,44,'dark','horizontal');stone(43,28,8,10);}
    }
    if(level>=4){
      if(design!==1){roof(20,17,13,71,'slate');roof(87,17,13,71,'slate');}
      else{roof(15,74,24,29,'terra');roof(81,74,24,29,'terra');}
      for(const x of [29,79])a.towerTop(c,x,99,13,true);
      banner(8,43);banner(111,43);
    }
    if(level>=5){cupola(60,design===1?52:32,14,'dark');
      if(design===2){for(const x of [16,104])cupola(x,60,10,'slate');}
      else{for(const x of [3,93])for(const y of [3,93]){a.towerTop(c,x,y,24);roof(x+5,y+5,14,14,design===1?'terra':'dark');}}
      roof(45,98,30,16,design===1?'terra':'dark','horizontal');banner(60,104,'#843e46');
    }
  }else if(type==='house'){
    if(level===2){roof(6,40,26,30,'terra');roof(20,10,37,25,'terra','horizontal');stone(48,13,9,10);}
    if(level>=3){stone(9,7,63,65);roof(11,8,58,34,'slate','horizontal');roof(12,38,25,31,'slate');roof(49,38,20,31,'slate');stone(19,16,8,12);}
    if(level>=4){roof(30,38,22,25,'dark');stone(37,60,10,15);for(const x of [8,70])a.circle(c,x,70,4,'#426047');}
    if(level>=5){cupola(40,25,11,'dark');roof(5,45,14,27,'slate');roof(62,45,14,27,'slate');banner(38,64);}
  }else if(type==='farm'){
    // Channels and a larger barn leave the planted fields readable from above.
    for(const x of [23,47]){line(x,9,x,71,level>=3?'#6c8b84':'#a18a5b',3);for(let y=13;y<70;y+=13){a.circle(c,x-6,y,2.5,level>=4?'#799342':'#bdc565');a.circle(c,x+7,y+4,2,level>=4?'#aeb76b':'#d0b66c');}}
    roof(53,6,21,level>=3?33:23,level>=4?'terra':'straw');
    if(level>=3){line(8,69,71,69,'#799d99',4);stone(8,62,8,11);}
    if(level>=4){roof(6,6,18,25,'terra');barrel(68,49);}
    if(level>=5){wheel(13,59,9);roof(5,39,16,15,'dark','horizontal');line(13,60,13,71,'#b7bea1',3);}
  }else if(['quarry','ironmine','goldmine'].includes(type)){
    const metal=level>=3?'#9caeae':'#c4a274';
    for(const x of [31,58]){stone(x-3,18,7,7);stone(x-3,49,7,7);line(x,20,x,53,metal,4);}
    line(30,25,61,25,metal,4);line(30,45,61,45,metal,4);line(31,20,58,50,metal,2);
    line(44,25,44,43,'#d7cba4',1);wheel(44,26,5);
    if(level>=3){roof(4,44,26,29,'slate');stone(7,48,6,9);line(43,44,66,72,'#a6aaa2',2);}
    if(level>=4){roof(48,3,26,15,'dark','horizontal');stone(58,57,12,10);a.ore(c,63,60,type==='quarry'?'stone':type==='ironmine'?'iron':'gold',.25);}
    if(level>=5){wheel(14,32,10);line(14,32,42,26,'#b9b198',2);roof(3,3,25,18,'dark','horizontal');stone(7,5,7,10);}
  }else if(type==='lumber'){
    roof(5,8,39,57,level>=3?'terra':'straw');roof(42,5,30,18,level>=4?'dark':'terra','horizontal');
    if(level>=3){wheel(39,64,10);line(38,64,60,64,'#d0c4a2',3);for(let y=28;y<57;y+=8){line(48,y,74,y,'#c5ab79',4);}}
    if(level>=4){roof(5,52,25,21,'terra','horizontal');line(31,17,68,17,'#d9b586',3);}
    if(level>=5){wheel(59,44,11);line(31,44,59,44,'#6f7770',4);roof(49,56,24,18,'dark','horizontal');}
  }else if(type==='warehouse'){
    roof(5,5,70,48,level>=3?'slate':'terra','horizontal');roof(8,50,21,24,level>=3?'slate':'straw');
    if(level>=3){roof(52,50,21,24,'slate');stone(31,56,18,15);}
    if(level>=4){roof(28,19,24,33,'dark');barrel(37,67);barrel(46,67);}
    if(level>=5){cupola(40,22,11,'dark');roof(3,54,11,22,'dark');roof(66,54,11,22,'dark');banner(39,51);}
  }else if(['barracks','range'].includes(type)){
    roof(4,6,71,23,level>=3?'dark':'slate','horizontal');roof(4,31,24,44,level>=3?'dark':'slate');
    if(level>=3){stone(30,31,43,5);roof(55,7,20,20,'dark');banner(30,38,type==='range'?'#53744e':'#3b607c');}
    if(level>=4){roof(30,62,43,13,'slate','horizontal');if(type==='barracks')roof(53,31,22,31,'dark');else for(let y=41;y<61;y+=14){a.circle(c,60,y,6,'#ddc9a0');a.circle(c,60,y,3,'#9f5141');}}
    if(level>=5){cupola(40,16,11,'dark');a.towerTop(c,2,60,17);a.towerTop(c,60,60,17);}
  }else if(type==='stable'){
    roof(5,6,110,29,level>=3?'slate':'terra','horizontal');roof(5,36,32,78,level>=3?'slate':'terra');
    if(level>=3){roof(82,37,32,29,'slate');stone(40,37,36,6);barrel(47,53);barrel(58,53);}
    if(level>=4){roof(41,97,73,18,'dark','horizontal');roof(83,70,31,24,'slate','horizontal');}
    if(level>=5){cupola(61,20,14,'dark');a.towerTop(c,4,95,21);banner(40,66);}
  }else if(type==='smith'){
    roof(5,6,42,66,'dark');stone(49,8,25,31);a.circle(c,62,23,9,'#45423a');a.circle(c,62,23,6,'#d08245');a.circle(c,61,21,3,'#f0c478');
    if(level>=3){roof(5,6,68,15,'slate','horizontal');stone(29,7,9,21);stone(58,7,9,14);}
    if(level>=4){roof(4,51,24,23,'dark','horizontal');wheel(47,65,8);line(46,65,59,54,'#b1b7ab',3);}
    if(level>=5){stone(6,23,9,18);roof(50,42,25,14,'slate','horizontal');wheel(39,31,8);}
  }else if(['tower','ballista'].includes(type)){
    const big=type==='ballista',n=big?10:2;a.towerTop(c,n,n,s-n*2,false);
    if(level>=3){for(const x of [n,s-n-7])for(const y of [n,s-n-7])stone(x,y,7,7);}
    c.save();c.translate(s/2,s/2);c.rotate(-.35);
    const width=s*(.18+level*.016),len=s*(.24+level*.012);
    line(0,-len,0,len,'#403f35',big?9:5);line(-width,-7,width,-7,'#c0aa77',big?5:3);line(-width,-7,0,len*.65,'#dad5b9',1);line(width,-7,0,len*.65,'#dad5b9',1);line(0,len,0,-len-4,'#d9ded2',2);
    if(level>=4){for(const side of [-1,1])line(side*4,len*.5,side*4,-len,'#8f9f9e',2);}
    c.restore();if(level>=5){banner(n+1,s-n-13);wheel(s-n-5,n+8,big?6:3);}
  }else if(type==='gate'){
    stone(0,7,12,26);stone(28,7,12,26);line(14,20,26,20,'#647473',level>=3?5:3);
    if(level>=3){roof(1,10,10,20,'slate');roof(29,10,10,20,'slate');}
    if(level>=4){line(12,14,28,14,'#b8bca8',3);line(12,26,28,26,'#b8bca8',3);}
    if(level>=5){cupola(6,20,6,'dark');cupola(34,20,6,'dark');}
  }
}
