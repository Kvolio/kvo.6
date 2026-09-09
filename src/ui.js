import {BUILDINGS,UNITS,RESOURCES,ENEMIES} from './data.js';
import {TECHNOLOGIES,TRAINING_SECONDS} from './progression.js';
const $ = id => document.getElementById(id);
const BOSS_TIERS={captain:'raider',chief:'raider',brute:'raider',champion:'elite',giant:'elite',blackknight:'elite',titan:'legend',warlord:'legend',dragonknight:'legend',dragon:'mythic',conqueror:'mythic',archdemon:'mythic',demonlord:'sovereign'};
const LESSONS=[
 ['Welcome to your kingdom','Explore at your own pace. The first invasion countdown waits while this guide is open. Use Next to continue, or Skip tutorial at any time.'],
 ['Find your way','Drag the map on touch, or use WASD on a keyboard. Pinch or scroll to zoom. Tap a unit, building or deposit to inspect it. The house camera button returns to your Keep.'],
 ['Start gathering','Open Build → Economy. Place a Lumber Camp beside trees, then a Farm and Quarry. Workers build and gather automatically. Resources under a new building are removed; leave nearby deposits to harvest.'],
 ['Grow your settlement','Build → Town contains Houses for more people. Open Army to train workers at the Keep. Training takes time and reserves housing. Select a building to assign workers, repair or upgrade it.'],
 ['Prepare your defenses','Build a Barracks or Archery Range, then recruit through Army. Select troops and use Move, then tap a destination (or right-click on PC). The Keep and towers fire automatically. Only ranged attacks hit airborne enemies.'],
 ['Watch the coast','Cream arrows on the minimap show approaching ships. Build walls with gates so workers can pass. Pause whenever you need. After this guide, the peace countdown begins with your first building, recruitment or unit order.']
];
const costText = cost => Object.entries(cost).map(([r,n])=>`${n} ${r}`).join(' · ');

export class UI {
  constructor(game,renderer,input,saves,audio,onGame,onTitle){
    Object.assign(this,{game,renderer,input,saves,audio,onGame,onTitle});this.tab=null;this.category='Economy';this.armyCategory='All';this.newKeepDesign=0;this.toastUntil=0;this.atTitle=false;
    $('resources').innerHTML=Object.entries({...RESOURCES,pop:'♙'}).map(([r,s])=>`<div class="resource" title="${r==='pop'?'Population':r}"><span class="symbol">${s}</span><div><small>${r==='pop'?'People':r}</small><strong id="res-${r}">0</strong></div></div>`).join('');
    $('tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)this.openTab(this.tab===b.dataset.tab?null:b.dataset.tab);};
    $('panel').onclick=e=>this.action(e);$('inspection').onclick=e=>this.action(e);
    $('close-tray').onclick=()=>this.openTab(null);$('close-inspector').onclick=()=>{this.game.selected=[];this.game.selectedTile=null;this.openTab(null);};
    $('auto-wave').onchange=e=>game.setAutoWave(e.target.checked);
    $('next-wave').onclick=()=>{if(game.tutorial&&!game.tutorial.done)this.finishTutorial();if(game.paused)this.toast('The invasion is queued while paused. Resume when ready.');game.startWave();};
    $('pause').onclick=()=>{game.paused=!game.paused;this.update();};$('speed').onclick=()=>{game.speed=game.speed===1?2:1;this.update();};
    $('zoom-in').onclick=()=>renderer.zoom(1.2);$('zoom-out').onclick=()=>renderer.zoom(1/1.2);$('home').onclick=()=>renderer.center();
    $('rotate-build').onclick=()=>input.rotate();
    $('confirm-build').onclick=()=>input.place();$('cancel-build').onclick=()=>{renderer.preview=null;this.openTab('build');};
    $('menu').onclick=() => this.menu();$('brand').onclick=()=>this.menu();$('help').onclick=()=>this.help();
    $('overview').onclick=()=>{$('map-overview').hidden=!$('map-overview').hidden;};
    $('minimap').onpointerdown=e=>{const r=e.target.getBoundingClientRect();renderer.camera.x=(e.clientX-r.left)/r.width*game.world.cols*40;renderer.camera.y=(e.clientY-r.top)/r.height*game.world.rows*40;};
    $('modal').onclose=null;
    $('modal').oncancel=e=>{e.preventDefault();if(this.atTitle)this.welcome();else this.closeMenu();};
    game.notice=message=>this.toast(message);game.sound=kind=>audio.play(kind);
    game.autosave=()=>{if(!saves.save(game)&&!this.saveWarning){this.saveWarning=true;this.toast('Browser storage is unavailable. Keep this tab open to retain progress.');}};
    $('tutorial-next').onclick=()=>{const t=game.tutorial;if(!t)return;if(t.step<LESSONS.length-1)t.step++;else this.finishTutorial();this.update();};
    $('tutorial-skip').onclick=()=>{this.finishTutorial();this.update();};
    this.openTab(null);
  }
  finishTutorial(){if(this.game.tutorial)this.game.tutorial.done=true;try{this.saves.storage.setItem('tidehold-tutorial-seen','1');}catch{}this.game.autosave();}
  updateTutorial(){
    const t=this.game.tutorial,visible=!!t&&!t.done&&!this.atTitle&&this.game.wave===0;
    $('tutorial').hidden=!visible;$('viewport').classList.toggle('learning',visible);
    if(!visible)return;const lesson=LESSONS[t.step];$('tutorial-step').textContent='FIELD GUIDE · '+(t.step+1)+' / '+LESSONS.length;$('tutorial-title').textContent=lesson[0];$('tutorial-text').textContent=lesson[1];$('tutorial-next').textContent=t.step===LESSONS.length-1?'Start playing':'Next →';
  }
  updateBoss(boss){
    const el=$('boss');el.hidden=!boss;$('viewport').classList.toggle('has-boss',!!boss);if(!boss)return;
    const tier=BOSS_TIERS[boss.type]||'raider',name=ENEMIES[boss.type].name.split(' · ')[0];
    if(el.dataset.type!==boss.type){el.dataset.type=boss.type;el.dataset.tier=tier;
      const wing=tier==='sovereign'?'M8 57 L2 5 L19 22 L25 4 L43 28 L62 33 M312 57 L318 5 L301 22 L295 4 L277 28 L258 33':'M8 51 L2 19 L30 35 L16 7 L54 30 L76 35 M312 51 L318 19 L290 35 L304 7 L266 30 L244 35',frame=tier==='raider'?'M14 34 L25 29 H295 L306 34 V66 H14 Z':'M15 44 L35 34 H125 L140 25 H180 L195 34 H285 L305 44 L292 63 H28 Z';
      el.innerHTML='<svg class="boss-ornament" viewBox="0 0 320 68" preserveAspectRatio="none" aria-hidden="true"><path class="boss-wings" d="'+wing+'"/><path class="boss-crown" d="M128 19 L125 8 L147 15 L160 2 L173 15 L195 8 L192 19"/><path class="boss-frame" d="'+frame+'"/></svg><div class="boss-name">'+name+'</div><div class="boss-track"><div class="boss-trail"></div><div class="boss-fill"></div></div><span class="boss-gem" aria-hidden="true"></span>';
      el.querySelector('.boss-track').setAttribute('role','progressbar');el.querySelector('.boss-track').setAttribute('aria-label',name+' health');
    }
    const ratio=Math.max(0,Math.min(1,boss.hp/boss.maxHp)),track=el.querySelector('.boss-track');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(boss.maxHp));track.setAttribute('aria-valuenow',String(Math.max(0,Math.ceil(boss.hp))));el.style.setProperty('--health',ratio*100+'%');el.classList.toggle('wounded',ratio<.25);
  }
  toast(message){$('toast').textContent=message;this.toastUntil=performance.now()+4500;$('toast').classList.add('visible');}
  openTab(tab){
    this.tab=tab;if(['build','army','research'].includes(tab))this.renderer.preview=null;
    $('tray').hidden=!['build','army','research'].includes(tab);$('inspector').hidden=tab!=='inspect';
    $('viewport').classList.toggle('has-tray',!!tab);
    for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-expanded',String(b.dataset.tab===tab));}
    this.renderPanel(true);
  }
  selection(){
    if(this.renderer.preview){this.openTab(null);return;}
    if(this.game.selected.length||this.game.selectedTile!=null)this.openTab('inspect');else this.openTab(null);
  }
  buildReason(type){const g=this.game,d=BUILDINGS[type];return g.level<(d.level||1)?`Requires Keep level ${d.level}`:!g.afford(d.cost)?'Not enough resources':'';}
  recruitReason(type){return this.game.recruitmentReason(type); }
  renderPanel(force=false){
    const g=this.game;
    if(this.tab==='build'||this.tab==='army'){
      const key=[this.tab,this.category,this.armyCategory,g.level,...Object.keys(BUILDINGS).map(t=>this.buildReason(t)),...Object.keys(UNITS).map(t=>this.recruitReason(t))].join('|');
      if(force||this.panelKey!==key){this.panelKey=key;
        if(this.tab==='build'){
          $('tray-title').textContent='Build your kingdom';
          $('panel').innerHTML=`<div class="category">${['Economy','Town','Military','Defense'].map(name=>`<button data-category="${name}" class="${this.category===name?'active':''}">${name}</button>`).join('')}</div><div class="build-list">${Object.entries(BUILDINGS).filter(([,d])=>d.category===this.category).map(([type,d])=>{const reason=this.buildReason(type);return `<button class="build-card" data-build="${type}" aria-disabled="${!!reason}"><img src="${this.renderer.art.thumbnail(type)}" alt=""><span class="copy"><strong>${d.name}</strong><small class="${reason?'unavailable':''}">${reason||d.desc}</small><span class="cost">${costText(d.cost)}</span></span></button>`;}).join('')}</div>`;
        }else{
          $('tray-title').textContent='Rally your people';
          $('panel').innerHTML=`<div class="army-actions"><button data-action="select-army">Select army</button><button data-action="select-workers">Select workers</button><button data-action="research">Research tree</button></div><div class="category army-categories">${['All','Workers','Infantry','Ranged','Cavalry'].map(name=>`<button data-army-category="${name}" class="${this.armyCategory===name?'active':''}">${name}</button>`).join('')}</div><div class="build-list">${Object.entries(UNITS).filter(([type])=>this.armyCategory==='All'||({worker:'Workers',militia:'Infantry',spear:'Infantry',archer:'Ranged',crossbow:'Ranged',knight:'Cavalry'})[type]===this.armyCategory).map(([type,d])=>{const reason=this.recruitReason(type);return `<button class="build-card" data-recruit="${type}" aria-disabled="${!!reason}"><img src="${this.renderer.unitArt.thumbnail(type)}" alt=""><span class="copy"><strong>${d.name}</strong><small class="${reason?'unavailable':''}">${reason||`${d.hp} HP · ${d.damage} damage · ${TRAINING_SECONDS[type]}s training`}</small><span class="cost">${costText(d.cost)}</span></span></button>`;}).join('')}</div>`;
        }
      }
    }
    if(this.tab==='research'){this.renderResearch(force);return;}
    if(this.tab!=='inspect')return;
    const enemy=g.enemies.find(e=>g.selected.includes(e.id)),b=g.buildings.find(b=>g.selected.includes(b.id)),units=g.units.filter(u=>g.selected.includes(u.id)),tile=g.selectedTile!=null?g.world.tiles[g.selectedTile]:null;
    const key=[enemy?.id,enemy?.phase,enemy?.airborne,b?.id,b?.complete,b?.level,b?.upgrade?.kind,b?.rangeLevel,b?.damageLevel,b?.training?.map(q=>q.id),b?g.wallOccupants(b).length:0,units.map(u=>u.id),g.selectedTile,tile?.resource,g.tech,g.units.filter(u=>u.job?.building===b?.id).length].join('|');
    if(force||this.inspectKey!==key){this.inspectKey=key;
      if(b){const d=BUILDINGS[b.type];
        $('inspection').innerHTML=`<div class="inspect-hero"><img src="${this.renderer.art.thumbnail(b.type,b.level,b.type==='keep'?g.keepDesign:0)}" alt="${d.name} roof"><div><span class="eyebrow">${b.complete?'LEVEL '+b.level:'CONSTRUCTION'}</span><h2 class="inspect-title">${d.name}</h2></div></div><div class="details"><div class="stat-line"><span>Condition</span><strong id="selected-hp"></strong></div><progress id="selected-progress" max="1"></progress><div id="worker-detail"></div><div id="upgrade-detail"></div><div id="tower-detail"></div><div id="training-detail"></div><p>${d.desc}</p></div><div class="action-list">${d.workers||!b.complete?'<button data-action="assign">Assign worker</button><button data-action="unassign">Remove worker</button>':''}${b.complete?'<button data-action="repair">Repair</button>':''}${b.complete&&!b.upgrade&&b.level<5?`<button data-action="upgrade">Upgrade · E</button><span class="cost wide">Upgrade: ${costText({wood:100*b.level,stone:100*b.level,gold:50*b.level})}</span>`:''}${b.upgrade?'<button class="wide" data-action="cancel-upgrade">Cancel upgrade · recover 80%</button>':''}${['wall','palisade','gate'].includes(b.type)&&b.complete?'<button class="wide" data-action="wall-defenders">Select wall defenders · '+g.wallOccupants(b).length+'/2</button>':''}${d.damage&&!b.upgrade?'<button data-action="range-upgrade">Improve range</button><button data-action="damage-upgrade">Improve damage</button>':''}${b.type==='keep'?'<button class="wide" data-recruit="worker">Train worker · 30 food</button>':''}${b.type==='smith'?'<button class="wide" data-action="research">Open research tree</button>':''}${b.type!=='keep'?`<button class="wide danger" data-action="demolish">${b.complete?'Demolish building':'Cancel construction'}</button>`:''}</div>`;
      }else if(enemy){const d=ENEMIES[enemy.type];
        $('inspection').innerHTML='<div class="inspect-hero"><img src="'+this.renderer.unitArt.thumbnail(enemy.type)+'" alt=""><div><span class="eyebrow">'+(d.demon?'DEMON LEGION':'INVADER')+'</span><h2 class="inspect-title">'+d.name+'</h2></div></div><div class="details" id="enemy-details"></div>';
      }else if(units.length){
        $('inspection').innerHTML=`<span class="eyebrow">YOUR PEOPLE</span><h2 class="inspect-title">${units.length===1?UNITS[units[0].type].name:units.length+' units selected'}</h2><p class="details" id="unit-details"></p><div class="action-list"><button data-action="move">Move</button><button data-action="attack">Attack move</button><button data-action="hold">Hold position</button><button data-action="defend">Defend</button><button data-action="patrol">Patrol</button><button data-action="mount">Mount wall</button><button data-action="dismount">Dismount</button><button data-action="box">Box select</button><button class="wide" data-action="idle">Release worker jobs</button></div>`;
      }else if(tile){
        const name=tile.resource?`${tile.resource[0].toUpperCase()+tile.resource.slice(1)} deposit`:'Depleted deposit';
        $('inspection').innerHTML=`<span class="eyebrow">${tile.type==='foothill'?'MOUNTAIN FOOTHILLS':'NATURAL RESOURCES'}</span><h2 class="inspect-title">${name}</h2><div class="details"><div class="stat-line"><span>Remaining</span><strong id="deposit-remaining"></strong></div><p>${tile.resource==='wood'?'Build a Lumber Camp within 8 tiles.':tile.resource?'Place the matching mine or Quarry within 8 tiles and leave a clear route for workers.':'This deposit has been exhausted. Explore the mountain foothills for richer veins.'}</p></div>${tile.resource?'<div class="action-list"><button class="wide" data-action="clear">Clear site with workers</button><small>Extract and deliver the deposit before building here.</small></div>':''}`;
      }else $('inspection').innerHTML='<p class="empty">Select a building, unit, or resource deposit on the map to see details and available actions.</p>';
    }
    if(b&&$('selected-hp')){
      $('selected-hp').textContent=`${Math.ceil(b.hp)} / ${b.maxHp}`;$('selected-progress').value=b.complete?b.hp/b.maxHp:b.progress/Math.max(1,BUILDINGS[b.type].time);
      $('upgrade-detail').textContent=b.upgrade?`Upgrading ${b.upgrade.kind}: ${Math.floor(b.upgrade.progress)} / ${b.upgrade.duration} work seconds`:'';
      $('training-detail').innerHTML=(b.training||[]).map((q,i)=>`<div class="training-order"><span>${i+1}. ${UNITS[q.type].name}<small>${q.waiting||(i===0?Math.floor(q.progress)+' / '+q.duration+'s':'Queued')}</small></span><button data-cancel-training="${q.id}" aria-label="Cancel ${UNITS[q.type].name} training">✕</button></div>`).join('');
      $('tower-detail').textContent=BUILDINGS[b.type].damage?`${Math.round(g.towerDamage(b))} damage · ${Math.round(g.towerRange(b)/40*10)/10} tiles range. Range upgrade: ${costText(g.upgradeCost(b,'range'))}. Damage upgrade: ${costText(g.upgradeCost(b,'damage'))}.`:'';
      const workers=g.units.filter(u=>u.job?.building===b.id);$('worker-detail').innerHTML=BUILDINGS[b.type].workers?`<div class="stat-line"><span>Assigned workers</span><strong>${workers.length} / ${BUILDINGS[b.type].workers}</strong></div>${workers.some(u=>u.job?.warning)?'<p class="selection-warning">Work blocked: no reachable resources or storage. Open a route or reassign workers.</p>':''}`:'';
    }
    if(enemy&&$('enemy-details')){const d=ENEMIES[enemy.type];$('enemy-details').textContent=`HP ${Math.ceil(enemy.hp)} / ${Math.ceil(enemy.maxHp)} · ${Math.round(g.attackDamage(enemy))} damage · ${Math.round((d.defense||0)*100)}% defense · ${d.armor||0} armor. ${g.isAirborne(enemy)?'Airborne: ranged units and arrow defenses only. ':''}${d.hunt==='ranged'?'Hunts archers. ':d.hunt==='walls'?'Breaks fortifications. ':d.hunt==='keep'?'Rushes the Keep. ':d.hunt==='rear'?'Attacks rear buildings. ':''}${d.taunt?'Draws attacks away from allies. ':''}${d.aura?'Strengthens nearby demons. ':''}${d.thorns?'Melee attackers catch fire. ':''}${d.burn?'Burning arrows ignite timber. ':''}${enemy.type==='archdemon'?'Evade the diving blade and hellfire cross. Defeat marked guardians to break the portal ward. ':enemy.type==='demonlord'?'Evade hurled warriors and eruptions. The ring has a safe inner circle. Reserve defenders for his rebirth and Keep assault. ':d.boss&&g.difficulty==='nightmare'?'Nightmare: additional attacks and reinforcements. Watch the warning circles and marked guardians. ':''}${enemy.phase==='healing'?'Rebirth: healing for '+Math.ceil(enemy.healRemaining)+'s. ':enemy.phase===2?'Phase II: faster and summoning more demons. ':''}`;}
    if($('unit-details'))$('unit-details').textContent=units.length===1?`HP ${Math.ceil(units[0].hp)} / ${units[0].maxHp} · ${UNITS[units[0].type].damage} damage · ${units[0].kills} kills · ${units[0].garrison?'On wall · +1.5 tiles range':units[0].mountOrder?'Moving onto wall':units[0].job?.kind||units[0].stance}`:'Choose an order below, then a destination on the map.';
    if(tile&&$('deposit-remaining'))$('deposit-remaining').textContent=`${Math.ceil(tile.amount)} ${tile.resource||''}`;
  }
  renderResearch(force=false){
    const g=this.game,task=g.researchTask,key=[g.researched.join(','),task?.id,task?.waiting,...Object.keys(TECHNOLOGIES).map(id=>g.researchReason(id))].join('|');
    if(force||this.researchKey!==key){this.researchKey=key;$('tray-title').textContent='The Blacksmith · Research tree';
      $('panel').innerHTML='<div id="research-progress"></div><div class="tech-tree">'+['Economy','Army','Defenses'].map(branch=>'<section class="tech-branch"><h3>'+branch+'</h3>'+Object.entries(TECHNOLOGIES).filter(([,t])=>t.branch===branch).map(([id,t])=>{const done=g.researched.includes(id),active=task?.id===id,reason=g.researchReason(id);return '<button class="tech-card '+(done?'researched':active?'researching':'')+'" data-research="'+id+'" aria-disabled="'+!!reason+'"><small>'+(t.requires.length?'Requires: '+t.requires.map(id=>TECHNOLOGIES[id].name).join(' + '):'Foundation')+'</small><strong>'+t.name+'</strong><span>'+t.description+'</span><small class="cost">'+(done?'✓ Learned':active?'Researching…':costText(t.cost)+' · '+t.time+'s')+'</small>'+(!done&&!active&&reason?'<small class="unavailable">'+reason+'</small>':'')+'</button>';}).join('')+'</section>').join('')+'</div>';
    }
    $('research-progress').innerHTML=task?'<span>'+TECHNOLOGIES[task.id].name+' · '+(task.waiting||Math.floor(task.progress)+' / '+task.duration+'s')+'</span><progress max="'+task.duration+'" value="'+task.progress+'"></progress><button data-action="cancel-research">Cancel · recover 80%</button>':'Research applies to the whole kingdom. Choose a branch to strengthen your strategy.';
  }
  action(e){
    const el=e.target.closest('button');if(!el)return;const g=this.game,b=g.buildings.find(b=>g.selected.includes(b.id));
    if(el.dataset.cancelTraining){g.cancelTraining(b,Number(el.dataset.cancelTraining));this.renderPanel(true);return;}
    if(el.dataset.research){g.research(el.dataset.research);this.renderPanel(true);return;}
    if(el.dataset.armyCategory){this.armyCategory=el.dataset.armyCategory;this.renderPanel(true);return;}
    if(el.dataset.category){this.category=el.dataset.category;this.renderPanel(true);return;}
    if(el.dataset.build){const reason=this.buildReason(el.dataset.build);if(reason){this.toast(reason);return;}this.input.begin(el.dataset.build);this.openTab(null);this.update();return;}
    if(el.dataset.recruit){const reason=this.recruitReason(el.dataset.recruit);if(reason)this.toast(reason);else g.recruit(el.dataset.recruit);this.renderPanel(true);return;}
    switch(el.dataset.action){
      case'wall-defenders':g.selected=g.wallOccupants(b).map(u=>u.id);this.selection();break;case'mount':this.input.commandMode='mount';this.openTab(null);this.toast('Tap a completed wall or gate. Two archers or crossbowmen fit on each section.');break;case'dismount':for(const u of g.units.filter(u=>g.selected.includes(u.id)))g.dismount(u);break;case'clear':g.clearResource(g.selectedTile);break;case'cancel-upgrade':g.cancelUpgrade(b);break;case'range-upgrade':g.upgrade(b,'range');break;case'damage-upgrade':g.upgrade(b,'damage');break;case'assign':g.assignWorker(b);break;case'unassign':g.removeWorker(b);break;case'repair':g.repair(b);break;case'upgrade':g.upgrade(b);break;case'research':this.openTab('research');break;case'cancel-research':g.cancelResearch();break;
      case'demolish':this.dialog(`<span class="eyebrow">CLEAR THIS SITE</span><h2>Remove ${BUILDINGS[b.type].name}?</h2><p>${b.complete?'Recover 30% of the original construction cost.':'Recover 80% of the construction cost.'} Assigned workers will become idle.</p><div class="modal-actions"><button id="remove-site" class="danger">Remove building</button><button data-close>Keep building</button></div>`);$('remove-site').onclick=()=>{g.demolish(b);this.closeMenu();this.selection();};break;
      case'select-army':g.selected=g.units.filter(u=>u.type!=='worker').map(u=>u.id);g.selectedTile=null;this.openTab('inspect');break;
      case'select-workers':g.selected=g.units.filter(u=>u.type==='worker').map(u=>u.id);g.selectedTile=null;this.openTab('inspect');break;
      case'move':case'attack':case'patrol':this.input.commandMode=el.dataset.action;this.openTab(null);this.toast('Tap or click a destination on the map.');break;
      case'box':this.input.mode='box';this.openTab(null);this.toast('Drag a box around your units.');break;
      case'hold':case'defend':case'idle':for(const u of g.units.filter(u=>g.selected.includes(u.id))){u.stance=el.dataset.action==='hold'?'hold':'defend';u.target=null;u.path=[];if(el.dataset.action==='idle')u.job=null;}this.toast('Orders updated.');break;
    }
    this.renderPanel(true);
  }
  update(){
    const g=this.game;for(const r in RESOURCES)$('res-'+r).textContent=Math.floor(g.resources[r]);$('res-pop').textContent=`${g.units.length}${g.queuedPopulation()?'+'+g.queuedPopulation():''}/${g.capacity}`;
    $('wave').textContent=g.wave?`Wave ${g.wave}${g.endless?'':' / '+g.campaignLength()}`:'A new kingdom';$('timer').textContent=g.active?`${g.enemies.length} foes`:`${String(Math.floor(Math.max(0,g.timer)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,g.timer)%60)).padStart(2,'0')}`;
    $('wave-state').textContent=g.active?(g.sealBroken?'The demon legion attacks. Defend the Keep.':'Defend the Keep. Hold the coast.'):g.wave?'Repair, gather, and prepare.':g.preparationHeld?'Peace waits for your first action.':'The sea is quiet. For now.';
    document.querySelector('.wave-card .eyebrow').textContent=g.kingdomName;$('auto-wave').checked=g.autoWave;$('next-wave').disabled=g.active||g.over;$('pause').textContent=g.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',g.paused?'Resume game':'Pause game');$('speed').textContent=g.speed+'×';
    $('status').textContent=`${g.units.filter(u=>u.type==='worker'&&!u.job).length} idle workers · ${g.stats.kills} enemies defeated`;
    $('hint').textContent=this.input.touch?'Drag to explore · Pinch to zoom · Tap to select':'WASD to explore · Scroll to zoom · Right-click to move';
    const types=g.buildings.filter(b=>b.complete).map(b=>b.type);$('objective').textContent=g.sealBroken?'Spread ranged defenders around the island. Watch for portals and leave warning circles.':!types.includes('lumber')?'First, build a Lumber Camp near trees.':!types.includes('farm')?'Build a Farm to feed your people.':!types.includes('quarry')?'Establish a Quarry. Mountains hold richer ores.':!types.includes('barracks')?'Raise a Barracks and recruit defenders.':'Explore the foothills. Fortify your coast.';
    const p=this.renderer.preview;$('placement').hidden=!p;$('viewport').classList.toggle('has-placement',!!p);
    if(p){const d=BUILDINGS[p.type],plan=g.planConstruction(p.type,p.cells||[{tx:p.tx,ty:p.ty}],p.rotation||0),reason=plan.reason;$('placement-label').textContent=d.name+(p.cells?.length>1?' · '+p.cells.length+' sections':'');$('placement-image').src=this.renderer.art.thumbnail(p.type);$('placement-image').style.transform='rotate('+((p.rotation||0)*90)+'deg)';$('placement-cost').textContent=costText(plan.cost);$('placement-reason').textContent=reason||(this.input.touch?'Drag a line or tap a site, then confirm. Pinch to pan.':'Click to build · Drag walls or roads · R to rotate · Esc to exit');$('confirm-build').disabled=!!reason;$('placement').classList.toggle('invalid',!!reason);}
    if(performance.now()>this.toastUntil)$('toast').classList.remove('visible');this.renderPanel();
    this.updateBoss(g.enemies.find(e=>e.hp>0&&ENEMIES[e.type].boss));this.updateTutorial();
    if(g.over&&!this.endShown&&!this.atTitle){this.endShown=true;this.ending();}
  }
  dialog(html,title=false){
    const modal=$('modal');if(!modal.open){this.pauseBeforeMenu=this.game.paused;this.game.paused=true;this.input.keys.clear();}
    modal.classList.toggle('title-screen',title);$('modal-body').innerHTML=html;if(!modal.open)modal.showModal();
    for(const button of modal.querySelectorAll('[data-close]'))button.onclick=()=>this.closeMenu();
  }
  closeMenu(){if(this.atTitle)return;this.game.paused=this.pauseBeforeMenu??false;$('modal').close();this.update();}
  error(message){let el=$('menu-error');if(!el){el=document.createElement('p');el.id='menu-error';el.className='menu-error';el.setAttribute('role','alert');$('modal-body').append(el);}el.textContent=message;}
  titleArt(design=0,level=3){return `<div class="title-art"><span class="eyebrow">THE NORTHERN REACH</span><img src="${this.renderer.art.thumbnail('keep',level,design)}" alt="An overhead view of the Keep"><p>From a lonely Keep,<br>a kingdom will rise.</p><small>BUILD · EXPLORE · SURVIVE</small></div>`;}
  welcome(){
    this.atTitle=true;this.onTitle?.();this.renderer.preview=null;this.openTab(null);this.game.paused=true;
    this.dialog(`<div><span class="eyebrow">A KINGDOM BEGINS WITH YOU</span><h1>TIDEHOLD</h1><h2>The Last Coast</h2><p>Raise your roofs beneath the mountain ranges. Mine their riches. Hold the shore against the coming tide.</p><div class="menu-list"><button id="continue" class="${this.saves.has()?'primary':''}" ${this.saves.has()?'':'disabled'}>Continue kingdom <span>→</span></button><button id="new-kingdom" class="${this.saves.has()?'':'primary'}">New kingdom <span>＋</span></button><button id="title-settings">Settings <span>⚙</span></button><button id="welcome-help">How to play <span>?</span></button></div></div>${this.titleArt()}`,true);
    $('continue').onclick=()=>this.load();$('new-kingdom').onclick=()=>this.newKingdom();$('title-settings').onclick=()=>this.settings(()=>this.welcome());$('welcome-help').onclick=()=>this.help(()=>this.welcome());
  }
  newKingdom(){
    this.dialog(`<div><span class="eyebrow">YOUR STORY STARTS HERE</span><h1>A new<br>kingdom.</h1><p>One Keep and five workers. New mountain ranges, new opportunities. Starting a new kingdom replaces the browser's saved run when the next save occurs.</p><label for="kingdom-name">Name your kingdom</label><input id="kingdom-name" maxlength="32" value="Tidehold" autocomplete="off"><label>Choose your Keep</label><div class="keep-choices">${['Coastal Keep','Highland Hall','Royal Citadel'].map((name,i)=>`<button data-keep-design="${i}" aria-pressed="${i===this.newKeepDesign}"><img src="${this.renderer.art.thumbnail('keep',1,i)}" alt=""><span>${name}</span></button>`).join('')}</div><label for="difficulty">Choose your challenge</label><select id="difficulty"><option value="normal">Normal · The intended challenge</option><option value="easy">Easy · A gentler beginning</option><option value="hard">Hard · Invasions around the island</option><option value="nightmare">Nightmare · for experienced players, the broken seal</option></select><div class="modal-actions"><button id="new-game" class="primary">Found a kingdom →</button><button id="new-back">Back</button></div></div>${this.titleArt(this.newKeepDesign,1)}`,true);
    for(const el of document.querySelectorAll('[data-keep-design]'))el.onclick=()=>{this.newKeepDesign=Number(el.dataset.keepDesign);for(const button of document.querySelectorAll('[data-keep-design]'))button.setAttribute('aria-pressed',String(button===el));document.querySelector('.title-art img').src=this.renderer.art.thumbnail('keep',1,this.newKeepDesign);};
    $('new-back').onclick=()=>this.welcome();$('new-game').onclick=()=>{const difficulty=$('difficulty').value,options={name:$('kingdom-name').value,keepDesign:this.newKeepDesign};this.atTitle=false;$('modal').close();this.onGame(null,difficulty,options);};
  }
  load(){try{const g=this.saves.load();if(!g)throw Error('No save');this.atTitle=false;$('modal').close();this.onGame(g);}catch{this.error('This save could not be loaded. It has been kept unchanged. You can start a new kingdom instead.');}}
  menu(){
    if(this.atTitle){this.welcome();return;}
    this.dialog(`<span class="eyebrow">TIDEHOLD · PAUSED</span><h2>A moment of calm.</h2><p>Your kingdom waits for your return.</p><div class="menu-list"><button class="primary" data-close>Resume kingdom <span>→</span></button><button id="save">Save kingdom <small>On this browser</small></button><button id="load" ${this.saves.has()?'':'disabled'}>Load saved game</button><button id="settings">Settings</button><button id="instructions">How to play</button><button id="main-menu">Save & main menu</button></div>`);
    $('save').onclick=()=>{if(this.saves.save(this.game)){$('save').textContent='Kingdom saved';$('load').disabled=false;}else this.error('Saving failed. Your kingdom is still open; browser storage may be full or unavailable.');};
    $('load').onclick=()=>this.load();$('settings').onclick=()=>this.settings(()=>this.menu());$('instructions').onclick=()=>this.help(()=>this.menu());
    $('main-menu').onclick=()=>{if(this.saves.save(this.game))this.welcome();else this.error('Saving failed. Your kingdom is still open. Resume playing or free browser storage before leaving.');};
  }
  settings(back){
    this.dialog(`<span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><div class="settings-row"><div>Game audio<p>An original score, ocean ambience, and battle sounds.</p></div><button id="sound" aria-pressed="${this.audio.enabled}">${this.audio.enabled?'On':'Off'}</button></div>${Object.entries({music:'Music',effects:'Combat & actions',ambience:'Ocean & atmosphere'}).map(([key,label])=>`<label class="audio-setting" for="audio-${key}"><span>${label}</span><input id="audio-${key}" type="range" min="0" max="100" step="5" value="${Math.round(this.audio.levels[key]*100)}"><output for="audio-${key}">${Math.round(this.audio.levels[key]*100)}%</output></label>`).join('')}<p>Music changes with invasions, bosses, and the broken seal. Sound works offline. Your browser may require a tap before playback.</p><div class="modal-actions"><button id="settings-back" class="primary">Back</button></div>`);
    const persist=()=>{try{this.audio.save(this.saves.storage);}catch{this.error('Audio changed for this session; settings could not be saved.');}};
    $('sound').onclick=()=>{this.audio.setEnabled(!this.audio.enabled);$('sound').textContent=this.audio.enabled?'On':'Off';$('sound').setAttribute('aria-pressed',String(this.audio.enabled));this.audio.play('ready');persist();};
    for(const key in this.audio.levels)$('audio-'+key).oninput=e=>{this.audio.setLevel(key,Number(e.target.value)/100);e.target.nextElementSibling.textContent=e.target.value+'%';persist();};$('settings-back').onclick=back;
  }
  help(back=()=>this.closeMenu()){
    this.dialog(`<span class="eyebrow">THE FIELD GUIDE</span><h2>Your first foothold.</h2><p>Build a <b>Lumber Camp</b> near trees and a <b>Farm</b>. Workers automatically complete queued sites, borrowing gatherers between deliveries when needed. Building over a deposit removes it. Units move aside automatically. Build houses and train workers at the Keep.</p><p><b>Mountain foothills hold richer stone, iron, and gold.</b> Peaks block ground movement. Use passes, place mines near reachable veins, and leave a clear route to storage. Tap deposits to inspect their reserves.</p><p>Build a Barracks or Archery Range, recruit defenders, and protect the Keep with towers and walls. Upgrade the Keep to unlock advanced mines and troops. Training reserves housing and takes time. Upgrades need workers. The Blacksmith research tree improves your economy, army, and defenses.</p><div class="help-grid"><div><strong>Mouse & keyboard</strong>WASD / arrows: pan<br>Wheel: zoom<br>Click: select / build<br>Left drag: select groups / draw walls and roads<br>R: rotate building · E: upgrade selection<br>Shift: add to selection<br>Right click: move<br>Right / middle drag: pan<br>Space: pause · Esc: cancel</div><div><strong>Touch</strong>Drag: pan / draw walls and roads<br>Pinch: zoom · ↻: rotate<br>Tap: select / preview<br>Place here: confirm building<br>Army: select troops / workers<br>Move, then tap: give orders<br>Box select: drag a selection<br>Two fingers: pan and zoom</div></div><p><b>Defend from every direction.</b> Hard and Nightmare kingdoms are larger islands. Enable Auto wave to call the next fleet five seconds after victory. Archers and crossbowmen can mount completed walls: select them and right-click the wall, or use Mount wall in the inspector.</p><p><b>Flying enemies require ranged units or arrow defenses while airborne.</b> Melee units can attack after a valid landing. Nightmare continues through wave 60: the Conqueror’s death breaks the seal, and demon portals replace ships. Select an enemy to learn its role. Leave marked attack zones, kill the ArchDemon’s ward guardians, and prepare reserves for the Demon Lord’s healing transition.</p><p>Autosave runs every 30 game seconds and after waves. Existing saved maps stay intact; start a new kingdom to explore the new ranges.</p><div class="modal-actions"><button id="help-back" class="primary">Back</button></div>`);$('help-back').onclick=back;
  }
  ending(){
    const g=this.game;this.dialog(`<span class="eyebrow">${g.victory?'THE KINGDOM HAS SURVIVED':'THE LAST BANNER FALLS'}</span><h2>${g.victory?(g.difficulty==='nightmare'?'The seal is restored.':'The coast is yours.'):'A kingdom remembered.'}</h2><p>Waves reached: ${g.wave} · Enemies defeated: ${g.stats.kills}<br>Structures built: ${g.stats.built} · People lost: ${g.stats.lost}<br>Score: ${g.stats.kills*10+g.wave*100+g.stats.built*20}</p><div class="modal-actions">${g.victory?'<button id="endless" class="primary">Enter endless mode</button>':''}<button id="again">Main menu</button><button data-close>View kingdom</button></div>`);
    $('again').onclick=()=>{if(this.saves.save(g))this.welcome();else this.error('Saving failed. Your kingdom remains open.');};if($('endless'))$('endless').onclick=()=>{g.endless=true;g.over=false;g.victory=false;g.timer=120;this.endShown=false;this.closeMenu();g.autosave();};
  }
}
