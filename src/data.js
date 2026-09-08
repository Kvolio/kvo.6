export const TILE = 40, COLS = 64, ROWS = 48;
export const RESOURCES = {wood:'♧',stone:'◆',food:'♨',iron:'⬡',gold:'◈'};
export const BUILDINGS = {
 keep:{name:'Keep',icon:'♜',size:3,hp:2600,cost:{},time:0,desc:'The heart of your kingdom.',pop:8},
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
 knight:{name:'Knight',icon:'♞',hp:260,damage:35,range:38,speed:110,armor:8,cost:{food:70,iron:30,gold:35},building:'stable',level:3}
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
export const BOSSES = {5:'captain',10:'chief',15:'brute',20:'champion',25:'giant',30:'titan',35:'blackknight',40:'warlord',45:'dragonknight',50:'dragon'};
export function waveComposition(wave) {
 const pool=['raider']; if(wave>=4)pool.push('barbarian','bow');if(wave>=12)pool.push('berserker','ogre');if(wave>=22)pool.push('ram','elite');
 const units=Array.from({length:Math.min(160,3+wave*2)},(_,i)=>pool[(i*7+wave)%pool.length]);
 if(BOSSES[wave])units.push(BOSSES[wave]);else if(wave>50&&wave%10===0)units.push('warlord');
 return units;
}
