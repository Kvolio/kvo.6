export const TILE = 40, COLS = 64, ROWS = 48;
// Difficulty tuning is shared by generation, combat and preparation timers.
export const DIFFICULTIES={
 easy:{peace:360,interval:180,supply:1.6,count:.55,hp:.6,damage:.65},
 normal:{peace:300,interval:150,supply:1.35,count:.8,hp:.85,damage:.85},
 hard:{peace:240,interval:110,supply:1.15,count:1.2,hp:1.25,damage:1.15},
 nightmare:{peace:210,interval:100,supply:1.1,count:1.35,hp:1.45,damage:1.3}
};
export function difficultyValue(difficulty,key,wave=1){
 const d=DIFFICULTIES[difficulty]||DIFFICULTIES.normal,value=d[key];
 if(!['hard','nightmare'].includes(difficulty)||!['count','hp','damage'].includes(key))return value;
 const opening={hard:{count:1.05,hp:1.08,damage:1.03},nightmare:{count:1.12,hp:1.18,damage:1.1}}[difficulty][key];
 return opening+(value-opening)*Math.min(1,Math.max(0,(wave-1)/11));
}
export const RESOURCES = {wood:'♧',stone:'◆',food:'♨',iron:'⬡',gold:'◈'};
export const KEEP_PERKS=[
 {name:'Coastal Keep',description:'+25% Keep damage · +20% Keep range',damage:1.25,range:1.2},
 {name:'Highland Hall',description:'+500 storage per Keep level',storage:500},
 {name:'Royal Citadel',description:'+25% gold gathered from mines',gold:1.25},
 {name:'Demon Castle',description:'+20% Keep damage and range · +15% troop damage',damage:1.2,range:1.2,units:1.15}
];
export const BUILDINGS = {
 keep:{name:'Keep',icon:'♜',size:3,hp:2600,cost:{},time:0,range:260,damage:20,attackInterval:1.2,desc:'The heart of your kingdom. Automatically fires defensive arrows.',pop:8},
 lumber:{name:'Lumber Camp',icon:'⚒',size:2,hp:400,cost:{wood:60},time:10,category:'Economy',resource:'wood',desc:'Harvests nearby forests.',workers:4},
 farm:{name:'Farm',icon:'♧',size:2,hp:320,cost:{wood:70},time:10,category:'Economy',resource:'food',desc:'Food for a growing kingdom.',workers:4},
 quarry:{name:'Quarry',icon:'◆',size:2,hp:550,cost:{wood:75},time:12,category:'Economy',resource:'stone',desc:'Work near stone deposits.',workers:4},
 ironmine:{name:'Iron Mine',icon:'⬡',size:2,hp:550,cost:{wood:90,stone:50},time:14,category:'Economy',resource:'iron',desc:'Mine nearby iron deposits.',workers:4,level:2},
 goldmine:{name:'Gold Mine',icon:'◈',size:2,hp:500,cost:{wood:100,stone:60},time:14,category:'Economy',resource:'gold',desc:'Mine nearby gold deposits.',workers:4,level:2},
 house:{name:'House',icon:'⌂',size:2,hp:380,cost:{wood:50,stone:10},time:8,category:'Town',desc:'Room for 5 more people.',pop:5},
 warehouse:{name:'Warehouse',icon:'▤',size:2,hp:650,cost:{wood:100,stone:50},time:14,category:'Town',desc:'+600 storage. Worker drop-off.'},
 road:{name:'Road',icon:'⋮',size:1,hp:100,cost:{stone:3},time:1,category:'Town',desc:'Units move 30% faster.'},
 barracks:{name:'Barracks',icon:'⚔',size:2,hp:850,cost:{wood:100,stone:40},time:16,category:'Military',desc:'Train militia and spearmen.'},
 range:{name:'Archery Range',icon:'➶',size:2,hp:650,cost:{wood:120,stone:30},time:16,category:'Military',desc:'Train ranged defenders.'},
 stable:{name:'Stable',icon:'♞',size:3,hp:950,cost:{wood:180,stone:80,gold:40},time:20,category:'Military',level:3,desc:'Train fast, armored knights.'},
 temple:{name:'Temple',icon:'✦',size:3,hp:1100,cost:{wood:180,stone:140,gold:100},time:24,category:'Military',level:2,desc:'One per kingdom. Trains 2 Clerics per level and slowly heals nearby troops.'},
 smith:{name:'Blacksmith',icon:'⚒',size:2,hp:800,cost:{wood:130,stone:100},time:18,category:'Military',level:2,desc:'Research weapons and armor.'},
 palisade:{name:'Palisade',icon:'▥',size:1,hp:500,cost:{wood:12},time:3,category:'Defense',desc:'A sturdy wooden defense.'},
 wall:{name:'Stone Wall',icon:'▦',size:1,hp:1400,cost:{stone:25},time:5,category:'Defense',level:2,desc:'Resists heavy assaults.'},
 gate:{name:'Gate',icon:'Π',size:1,hp:900,cost:{wood:20,stone:20},time:5,category:'Defense',desc:'Your troops can pass through.'},
 tower:{name:'Archer Tower',icon:'♜',size:1,hp:700,cost:{wood:60,stone:35},time:12,category:'Defense',range:240,damage:18,desc:'Automatically fires at enemies.'},
 ballista:{name:'Ballista Tower',icon:'✣',size:2,hp:1200,cost:{wood:140,stone:100,iron:50},time:20,category:'Defense',level:3,range:310,damage:55,desc:'Long-range, anti-dragon defense.'}
};
export const UNITS = {
 worker:{name:'Worker',icon:'⚒',hp:55,damage:3,range:28,speed:65,armor:0,cost:{food:30},building:'keep'},
 militia:{name:'Militia',icon:'⚔',hp:100,damage:14,range:32,speed:75,armor:1,cost:{food:25,wood:15},building:'barracks'},
 spear:{name:'Spearman',icon:'⚔',hp:150,damage:22,range:43,speed:65,armor:4,cost:{food:40,wood:20,iron:10},building:'barracks',level:2},
 archer:{name:'Archer',icon:'➶',hp:70,damage:15,range:220,speed:70,armor:0,cost:{food:30,wood:30,gold:10},building:'range'},
 crossbow:{name:'Crossbowman',icon:'➶',hp:100,damage:32,range:245,speed:65,armor:3,cost:{food:45,iron:20,gold:15},building:'range',level:3},
 knight:{name:'Knight',icon:'⚔',hp:240,damage:32,range:38,speed:62,armor:9,cost:{food:55,iron:25,gold:25},building:'barracks',level:3},
 mountedknight:{name:'Mounted Knight',icon:'♞',hp:300,damage:38,range:42,speed:110,armor:8,cost:{food:75,iron:35,gold:40},building:'stable',requiresBuildings:['barracks'],level:3,mounted:true,scale:1.3},
 mountedarcher:{name:'Mounted Archer',icon:'➶',hp:130,damage:19,range:225,speed:112,armor:3,cost:{food:55,wood:40,gold:30},building:'stable',requiresBuildings:['range'],level:3,mounted:true,scale:1.3},
 cleric:{name:'Cleric',icon:'✦',hp:115,damage:0,range:210,speed:65,armor:2,cost:{food:60,gold:65},building:'temple',level:2,healer:true}
};
export const ENEMIES = {
 raider:{name:'Raider',hp:65,damage:8,range:28,speed:40,armor:0},
 barbarian:{name:'Barbarian',hp:120,damage:15,range:30,speed:42,armor:2},
 bow:{name:'Raider Archer',hp:70,damage:10,range:155,speed:37,armor:0},
 berserker:{name:'Berserker',hp:150,damage:23,range:30,speed:60,armor:1},
 ogre:{name:'Ogre',hp:420,damage:32,range:45,speed:28,armor:4,siege:true},
 ram:{name:'Siege Ram',hp:650,damage:55,range:40,speed:23,armor:9,siege:true},
 elite:{name:'Elite Guard',hp:250,damage:24,range:32,speed:42,armor:8},
 captain:{name:'Raider Captain',hp:650,damage:24,range:38,speed:42,armor:4,boss:true,ability:'rally'},
 chief:{name:'Barbarian Chief',hp:1500,damage:40,range:45,speed:40,armor:5,boss:true,ability:'rally'},
 brute:{name:'Ogre Brute',hp:1900,damage:50,range:48,speed:28,armor:7,boss:true,ability:'slam',siege:true},
 champion:{name:'Ogre Champion',hp:2800,damage:60,range:55,speed:28,armor:9,boss:true,ability:'slam',siege:true},
 giant:{name:'Stone Giant',hp:2500,damage:50,range:200,speed:25,armor:8,boss:true,ability:'slam',siege:true},
 titan:{name:'The Titan',hp:4000,damage:80,range:80,speed:21,armor:12,boss:true,ability:'slam',siege:true},
 blackknight:{name:'Black Knight',hp:2800,damage:48,range:40,speed:52,armor:14,boss:true,ability:'rally'},
 warlord:{name:'The Warlord',hp:4000,damage:52,range:45,speed:40,armor:12,boss:true,ability:'reinforce'},
 dragonknight:{name:'Dragon Knight',hp:3500,damage:50,range:150,speed:42,armor:10,boss:true,ability:'fire'},
 dragon:{name:'Black Dragon · Phase I',hp:6500,damage:70,range:190,speed:32,armor:10,boss:true,flying:true,ability:'fire'},
 conqueror:{name:'The Conqueror · Phase II',hp:5000,damage:65,range:50,speed:48,armor:14,boss:true,ability:'rally'}
};
ENEMIES.dragonrider={name:'Ashwing Rider',hp:850,damage:29,range:200,speed:60,armor:5,flying:true,scale:1.7};
ENEMIES.elderdragonrider={name:'Storm Drake Rider',hp:1600,damage:45,range:220,speed:52,armor:8,flying:true,scale:2,ability:'fire',abilityInterval:13};
export const BOSSES = {5:'captain',10:'chief',15:'brute',20:'champion',25:'giant',30:'titan',35:'blackknight',40:'warlord',45:'dragonknight',50:'dragon'};
// Threat comes from complementary roles, area attacks and armor as well as HP.
for(const d of Object.values(ENEMIES)){
 if(d.boss){d.hp=Math.round(d.hp*1.65);d.damage=Math.round(d.damage*1.3);d.defense=.12;d.abilityInterval=8;}
 else if(d.name!=='Raider'){d.hp=Math.round(d.hp*1.2);d.damage=Math.round(d.damage*1.15);}
}
ENEMIES.bow.range=200;ENEMIES.berserker.attackInterval=.7;ENEMIES.elite.defense=.15;
export const DEMONS={
 skeleton:{name:'Skeleton',hp:75,damage:13,range:30,speed:86,armor:0,attackInterval:.8},
 demonwarrior:{name:'Demon Warrior',hp:380,damage:34,range:36,speed:53,armor:6},
 hellhound:{name:'Hellhound',hp:210,damage:30,range:32,speed:135,armor:2,attackInterval:.7,hunt:'ranged'},
 infernalarcher:{name:'Infernal Archer',hp:270,damage:30,range:240,speed:58,armor:2,flying:true,burn:6},
 dreadguard:{name:'Dreadguard',hp:1900,damage:30,range:40,speed:28,armor:12,defense:.25,taunt:true},
 demonbrute:{name:'Demon Brute',hp:3600,damage:115,range:65,speed:25,armor:8,defense:.35,siege:true,hunt:'walls',thorns:true,scale:3},
 hellrunner:{name:'Hellrunner',hp:300,damage:48,range:32,speed:150,armor:2,leap:true,hunt:'keep',attackInterval:.8},
 succubus:{name:'Succubus',hp:520,damage:22,range:210,speed:58,armor:3,aura:.25},
 infernalmage:{name:'Infernal Mage',hp:720,damage:42,range:235,speed:42,armor:4,splash:75,ability:'summon',abilityInterval:14},
 wingeddemon:{name:'Winged Demon',hp:580,damage:45,range:40,speed:90,armor:4,flying:true,hunt:'rear'},
 demonknight:{name:'Demon Knight',hp:1100,damage:57,range:42,speed:113,armor:12,defense:.12,charge:true,scale:1.5},
 hellfiregolem:{name:'Hellfire Golem',hp:9500,damage:150,range:85,speed:20,armor:10,defense:.4,siege:true,hunt:'walls',wallbreaker:true,splash:95,scale:3.8},
 archdemon:{name:'The ArchDemon',hp:18000,damage:155,range:115,speed:48,armor:10,defense:.5,boss:true,flying:true,splash:130,ability:'archdemon',abilityInterval:8,scale:4},
 demonlord:{name:'The Demon Lord',hp:32000,damage:190,range:105,speed:34,armor:14,defense:.6,boss:true,splash:125,aura:.3,ability:'demonlord',abilityInterval:9,scale:4.8}
};
for(const [type,d]of Object.entries(DEMONS))ENEMIES[type]={...d,demon:true};
export function nightmareComposition(wave){
 const step=wave-50,pool=['skeleton','skeleton','demonwarrior','demonwarrior','hellhound','infernalarcher'];
 if(step>=2)pool.push('dreadguard','succubus');if(step>=3)pool.push('demonbrute','hellrunner');
 if(step>=4)pool.push('infernalmage','wingeddemon');if(step>=6)pool.push('demonknight');if(step>=8)pool.push('hellfiregolem');
 const result=Array.from({length:Math.min(220,36+step*7)},(_,i)=>pool[(i+step)%pool.length]);
 if(wave>=55&&wave%10===5)result.push('archdemon');if(wave>=60&&wave%10===0)result.push('demonlord');return result;
}
export function waveComposition(wave,difficulty='normal') {
 if(difficulty==='nightmare'&&wave>50&&wave<=60)return nightmareComposition(wave);
 const pool=wave<4?['raider']:wave<12?['raider','barbarian','bow','raider','bow']:wave<22?['barbarian','bow','berserker','ogre','bow','raider']:['elite','bow','berserker','ram','elite','ogre','bow','barbarian'];
 const factor=difficultyValue(difficulty,'count',wave);
 const units=Array.from({length:Math.max(3,Math.round(Math.min(180,4+wave*2.5)*factor))},(_,i)=>pool[(i+wave)%pool.length]);
 if(wave>=16&&wave%3===1)units.push('dragonrider');if(wave>=32&&wave%4===0)units.push('elderdragonrider');
 if(BOSSES[wave])units.push(BOSSES[wave]);else if(wave>50&&wave%10===0)units.push('warlord');
 return units;
}
