import {BUILDINGS,UNITS} from './data.js';

export const TRAINING_SECONDS={worker:8,militia:12,spear:18,archer:16,crossbow:24,knight:32};
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

export const Progression={
  researchBonus(effect){return Object.entries(TECHNOLOGIES).reduce((sum,[id,t])=>sum+(this.researched?.includes(id)&&t.effect===effect?t.value:0),0);},
  queuedPopulation(){return this.buildings.reduce((sum,b)=>sum+(b.training?.length||0),0);},
  recruitmentReason(type){
    const d=UNITS[type];if(!d||this.over)return 'Recruitment is unavailable.';
    const trainers=this.buildings.filter(b=>b.type===d.building&&b.complete&&b.hp>0);
    if(!trainers.length)return `Build a ${BUILDINGS[d.building].name}.`;
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
    this.spend(d.cost);this.noteAction();b.training??=[];b.training.push({id:++this.id,type,progress:0,duration:TRAINING_SECONDS[type]});
    this.notice(`${d.name} queued at ${BUILDINGS[b.type].name}. ${TRAINING_SECONDS[type]} seconds of training.`);return true;
  },
  cancelTraining(b,id){
    const index=b?.training?.findIndex(q=>q.id===id);if(index==null||index<0)return false;
    const [q]=b.training.splice(index,1),fraction=q.progress>0?.8:1;
    for(const [r,n]of Object.entries(UNITS[q.type].cost))this.resources[r]=Math.min(this.storage,this.resources[r]+Math.floor(n*fraction));
    this.notice('Training canceled. Unstarted orders refund 100%; started orders refund 80%.');return true;
  },
  researchReason(id){
    const t=TECHNOLOGIES[id];if(!t)return 'Choose a technology.';
    if(this.researched?.includes(id))return 'Already researched.';
    if(this.researchTask)return 'A research project is already in progress.';
    if(!this.buildings.some(b=>b.type==='smith'&&b.complete&&b.hp>0))return 'Build a Blacksmith first.';
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
      q.progress=Math.min(q.duration,q.progress+dt*(1+this.researchBonus('training')));
      if(q.progress<q.duration)continue;
      if(this.units.length>=this.capacity){q.waiting='More housing required';continue;}
      const exits=this.world.accessPoints(b,this.buildings),exit=exits.find(p=>!this.units.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<12))||exits[0];
      if(!exit){q.waiting='Exit blocked';continue;}
      this.addUnit(q.type,exit.x,exit.y);b.training.shift();this.notice(`${UNITS[q.type].name} trained and ready.`);this.sound('ready');
    }
    const task=this.researchTask;if(!task)return;
    if(!this.buildings.some(b=>b.type==='smith'&&b.complete&&b.hp>0)){task.waiting='Rebuild a Blacksmith to resume';return;}
    task.waiting=null;task.progress+=dt;if(task.progress>=task.duration){this.researched??=[];this.researched.push(task.id);this.notice(`${TECHNOLOGIES[task.id].name} research completed.`);this.researchTask=null;this.sound('ready');}
  }
};
