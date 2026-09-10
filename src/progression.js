import {BUILDINGS,UNITS} from './data.js';

export const TRAINING_SECONDS={worker:8,militia:12,spear:18,archer:16,crossbow:24,knight:24,mountedknight:32,mountedarcher:28,cleric:22};
export const TECHNOLOGIES={
  forestry:{name:'Managed forests',branch:'Economy',requires:[],time:40,cost:{wood:100,gold:40},description:'Woodcutters gather 25% more per trip.',effect:'wood',value:.25},
  agriculture:{name:'Crop rotation',branch:'Economy',requires:['forestry'],time:55,cost:{wood:120,stone:60,gold:60},description:'Farms produce 25% more food.',effect:'food',value:.25},
  logistics:{name:'Pack frames',branch:'Economy',requires:['forestry'],time:50,cost:{wood:100,iron:30,gold:60},description:'Gatherers carry 50% more before returning.',effect:'carry',value:.5},
  steel:{name:'Tempered blades',branch:'Army',requires:[],time:55,cost:{iron:60,gold:60},description:'Melee soldiers deal 20% more damage.',effect:'melee',value:.2},
  armor:{name:'Plate and mail',branch:'Army',requires:['steel'],time:65,cost:{iron:100,gold:90},description:'All soldiers gain 3 armor.',effect:'armor',value:3},
  drill:{name:'Veteran instructors',branch:'Army',requires:['armor'],time:75,cost:{food:150,iron:60,gold:100},description:'All recruitment is 25% faster.',effect:'training',value:.25},
  fletching:{name:'Balanced arrows',branch:'Defenses',requires:[],time:50,cost:{wood:120,iron:40,gold:60},description:'Archers and crossbowmen deal 20% more damage.',effect:'ranged',value:.2},
  surveying:{name:'Rangefinding',branch:'Defenses',requires:['fletching'],time:65,cost:{stone:100,iron:60,gold:90},description:'Defense towers gain 15% attack range.',effect:'range',value:.15},
  siegecraft:{name:'Siege engineering',branch:'Defenses',requires:['surveying','steel'],time:80,cost:{wood:150,iron:100,gold:120},description:'Defense towers deal 20% more damage.',effect:'tower',value:.2}
};

TECHNOLOGIES.woodspeed={name:'Steel axes',branch:'Economy',requires:['forestry'],tier:2,time:45,cost:{wood:80,iron:45,gold:50},description:'Woodcutters chop 30% faster.',effect:'woodspeed',value:.3};
TECHNOLOGIES.masonry={name:'Master masonry',branch:'Economy',requires:['logistics'],tier:3,time:100,cost:{wood:200,stone:250,gold:150},description:'Raise completed buildings to at least level 2. New buildings finish at level 2.',effect:'masonry',value:1};
for(let tier=1;tier<=3;tier++){
 TECHNOLOGIES['medicine'+tier]={name:'Field Medicine '+['I','II','III'][tier-1],branch:'Healing',building:'temple',tier,requires:tier>1?['medicine'+(tier-1)]:[],time:30+tier*15,cost:{food:40*tier,gold:50*tier},description:'Cleric healing +'+(tier*10)+'% total.',effect:'healing',value:.1};
 TECHNOLOGIES['blessing'+tier]={name:'Sacred Resolve '+['I','II','III'][tier-1],branch:'Blessings',building:'temple',tier,requires:tier>1?['blessing'+(tier-1)]:[],time:35+tier*15,cost:{food:40*tier,gold:60*tier},description:'Nearby troops gain +'+(tier*5)+'% damage and +'+tier+' armor. Cleric auras do not stack.',effect:'blessing',value:1};
}
TECHNOLOGIES.massheal={name:'Combat Blessing · Mass Heal',branch:'Healing',building:'temple',tier:2,requires:['medicine1'],time:70,cost:{food:100,gold:100},description:'Every 12 seconds, each Cleric heals all wounded allies in range.',effect:'massheal',value:1};
for(const t of Object.values(TECHNOLOGIES)){t.building??='smith';t.tier??=t.requires.length?Math.min(3,1+Math.max(...t.requires.map(id=>TECHNOLOGIES[id].tier||1))):1;}

export const Progression={
  researchBonus(effect){return Object.entries(TECHNOLOGIES).reduce((sum,[id,t])=>sum+(this.researched?.includes(id)&&t.effect===effect?t.value:0),0);},
  queuedPopulation(){return this.buildings.reduce((sum,b)=>sum+(b.training?.length||0),0);},
  recruitmentReason(type){
    const d=UNITS[type];if(!d||this.over)return 'Recruitment is unavailable.';
    const trainers=this.buildings.filter(b=>b.type===d.building&&b.complete&&b.hp>0);
    if(!trainers.length)return `Build a ${BUILDINGS[d.building].name}.`;
    for(const type of d.requiresBuildings||[])if(!this.buildings.some(b=>b.type===type&&b.complete&&b.hp>0))return 'Requires a completed '+BUILDINGS[type].name+'.';
    if(type==='cleric'&&this.units.filter(u=>u.type==='cleric'&&u.hp>0).length+this.buildings.flatMap(b=>b.training||[]).filter(q=>q.type==='cleric').length>=this.clericCap)return 'Cleric cap reached ('+this.clericCap+'). Upgrade the Temple.';
    if(this.level<(d.level||1))return `Requires Keep level ${d.level}.`;
    if(this.units.length+this.queuedPopulation()>=this.capacity)return 'More housing required (training places are reserved).';
    if(trainers.every(b=>(b.training?.length||0)>=5))return 'Training queues are full (5 per building).';
    if(!trainers.some(b=>(b.training?.length||0)<5&&this.world.accessPoints(b,this.buildings).length))return 'Clear an exit beside this building before recruiting.';
    if(!this.afford(d.cost))return 'Not enough resources to recruit.';
    return '';
  },
  recruit(type){
    const reason=this.recruitmentReason(type);if(reason){this.notice(reason);return false;}
    const d=UNITS[type],b=this.buildings.filter(b=>b.type===d.building&&b.complete&&b.hp>0&&(b.training?.length||0)<5&&this.world.accessPoints(b,this.buildings).length).sort((a,b)=>(a.training?.length||0)-(b.training?.length||0))[0];
    this.spend(d.cost);this.noteAction();b.training??=[];b.training.push({id:++this.id,type,cost:{...d.cost},progress:0,duration:TRAINING_SECONDS[type]});
    this.notice(`${d.name} queued at ${BUILDINGS[b.type].name}. ${TRAINING_SECONDS[type]} seconds of training.`);return true;
  },
  cancelTraining(b,id){
    const index=b?.training?.findIndex(q=>q.id===id);if(index==null||index<0)return false;
    const [q]=b.training.splice(index,1),fraction=q.progress>0?.8:1;
    for(const [r,n]of Object.entries(q.cost||UNITS[q.type].cost))this.resources[r]=Math.min(this.storage,this.resources[r]+Math.floor(n*fraction));
    this.notice('Training canceled. Unstarted orders refund 100%; started orders refund 80%.');return true;
  },
  researchReason(id){
    const t=TECHNOLOGIES[id];if(!t)return 'Choose a technology.';
    if(this.researched?.includes(id))return 'Already researched.';
    if(this.researchTask)return 'A research project is already in progress.';
    if(!this.buildings.some(b=>b.type===t.building&&b.complete&&b.hp>0))return 'Build a '+BUILDINGS[t.building].name+' first.';
    if(!this.buildings.some(b=>b.type===t.building&&b.complete&&b.hp>0&&b.level>=t.tier))return 'Requires '+BUILDINGS[t.building].name+' level '+t.tier+'.';
    const missing=t.requires.filter(id=>!this.researched?.includes(id));if(missing.length)return 'Requires '+missing.map(id=>TECHNOLOGIES[id].name).join(' and ')+'.';
    if(!this.afford(t.cost))return 'Not enough resources to research.';
    return '';
  },
  research(id){
    const reason=this.researchReason(id);if(reason){this.notice(reason);return false;}
    const t=TECHNOLOGIES[id];this.spend(t.cost);this.noteAction();this.researchTask={id,progress:0,duration:t.time};this.notice(`${t.name} research started.`);return true;
  },
  cancelResearch(){
    if(!this.researchTask)return false;
    for(const [r,n]of Object.entries(TECHNOLOGIES[this.researchTask.id].cost))this.resources[r]=Math.min(this.storage,this.resources[r]+Math.floor(n*.8));
    this.researchTask=null;this.notice('Research canceled. Recovered 80% of its cost.');return true;
  },
  updateProgression(dt){
    for(const b of this.buildings){
      if(!b.complete||b.hp<=0||!b.training?.length)continue;const q=b.training[0];
      const d=UNITS[q.type];if((d.requiresBuildings||[]).some(type=>!this.buildings.some(b=>b.type===type&&b.complete&&b.hp>0))){q.waiting='Rebuild prerequisite training buildings';continue;}
      if(q.type==='cleric'&&this.units.filter(u=>u.type==='cleric'&&u.hp>0).length>=this.clericCap){q.waiting='Upgrade the Temple to increase Cleric cap';continue;}q.waiting=null;
      q.progress=Math.min(q.duration,q.progress+dt*(1+this.researchBonus('training')));
      if(q.progress<q.duration)continue;
      if(this.units.length>=this.capacity){q.waiting='More housing required';continue;}
      const exits=this.world.accessPoints(b,this.buildings),exit=exits.find(p=>!this.units.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<12))||exits[0];
      if(!exit){q.waiting='Exit blocked';continue;}
      this.addUnit(q.type,exit.x,exit.y);b.training.shift();this.notice(`${UNITS[q.type].name} trained and ready.`);this.sound('ready');
    }
    const task=this.researchTask;if(!task)return;
    const tech=TECHNOLOGIES[task.id];if(!tech){this.researchTask=null;return;}
    if(!this.buildings.some(b=>b.type===tech.building&&b.complete&&b.hp>0&&b.level>=tech.tier)){task.waiting='Requires '+BUILDINGS[tech.building].name+' level '+tech.tier+' to resume';return;}
    task.waiting=null;task.progress+=dt;if(task.progress>=task.duration){this.researched??=[];this.researched.push(task.id);if(task.id==='masonry')for(const b of this.buildings)if(b.complete)this.raiseBuildingLevel(b,2);this.notice(`${TECHNOLOGIES[task.id].name} research completed.`);this.researchTask=null;this.sound('ready');}
  }
};
