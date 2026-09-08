import {BUILDINGS,UNITS,RESOURCES,ENEMIES} from './data.js';
const $ = id => document.getElementById(id);
const costText = cost => Object.entries(cost).map(([r,n])=>`${n} ${r}`).join(' · ');

export class UI {
  constructor(game,renderer,input,saves,audio,onGame,onTitle){
    Object.assign(this,{game,renderer,input,saves,audio,onGame,onTitle});this.tab=null;this.category='Economy';this.toastUntil=0;this.atTitle=false;
    $('resources').innerHTML=Object.entries({...RESOURCES,pop:'♙'}).map(([r,s])=>`<div class="resource" title="${r==='pop'?'Population':r}"><span class="symbol">${s}</span><div><small>${r==='pop'?'People':r}</small><strong id="res-${r}">0</strong></div></div>`).join('');
    $('tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)this.openTab(this.tab===b.dataset.tab?null:b.dataset.tab);};
    $('panel').onclick=e=>this.action(e);$('inspection').onclick=e=>this.action(e);
    $('close-tray').onclick=()=>this.openTab(null);$('close-inspector').onclick=()=>{this.game.selected=[];this.game.selectedTile=null;this.openTab(null);};
    $('next-wave').onclick=()=>{if(game.paused)this.toast('The invasion is queued while paused. Resume when ready.');game.startWave();};
    $('pause').onclick=()=>{game.paused=!game.paused;this.update();};$('speed').onclick=()=>{game.speed=game.speed===1?2:1;this.update();};
    $('zoom-in').onclick=()=>renderer.zoom(1.2);$('zoom-out').onclick=()=>renderer.zoom(1/1.2);$('home').onclick=()=>renderer.center();
    $('confirm-build').onclick=()=>input.place();$('cancel-build').onclick=()=>{renderer.preview=null;this.openTab('build');};
    $('menu').onclick=() => this.menu();$('brand').onclick=()=>this.menu();$('help').onclick=()=>this.help();
    $('overview').onclick=()=>{$('map-overview').hidden=!$('map-overview').hidden;};
    $('minimap').onpointerdown=e=>{const r=e.target.getBoundingClientRect();renderer.camera.x=(e.clientX-r.left)/r.width*2560;renderer.camera.y=(e.clientY-r.top)/r.height*1920;};
    $('modal').onclose=null;
    $('modal').oncancel=e=>{e.preventDefault();if(this.atTitle)this.welcome();else this.closeMenu();};
    game.notice=message=>this.toast(message);game.sound=kind=>audio.play(kind);
    game.autosave=()=>{if(!saves.save(game)&&!this.saveWarning){this.saveWarning=true;this.toast('Browser storage is unavailable. Keep this tab open to retain progress.');}};
    this.openTab(null);
  }
  toast(message){$('toast').textContent=message;this.toastUntil=performance.now()+4500;$('toast').classList.add('visible');}
  openTab(tab){
    this.tab=tab;if(tab==='build'||tab==='army')this.renderer.preview=null;
    $('tray').hidden=!['build','army'].includes(tab);$('inspector').hidden=tab!=='inspect';
    $('viewport').classList.toggle('has-tray',!!tab);
    for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-expanded',String(b.dataset.tab===tab));}
    this.renderPanel(true);
  }
  selection(){
    if(this.renderer.preview){this.openTab(null);return;}
    if(this.game.selected.length||this.game.selectedTile!=null)this.openTab('inspect');else this.openTab(null);
  }
  buildReason(type){const g=this.game,d=BUILDINGS[type];return g.level<(d.level||1)?`Requires Keep level ${d.level}`:!g.afford(d.cost)?'Not enough resources':'';}
  recruitReason(type){const g=this.game,d=UNITS[type];return !g.buildings.some(b=>b.type===d.building&&b.complete)?`Build a ${BUILDINGS[d.building].name}`:g.level<(d.level||1)?`Requires Keep level ${d.level}`:g.units.length>=g.capacity?'More housing required':!g.afford(d.cost)?'Not enough resources':'';}
  renderPanel(force=false){
    const g=this.game;
    if(this.tab==='build'||this.tab==='army'){
      const key=[this.tab,this.category,g.level,...Object.keys(BUILDINGS).map(t=>this.buildReason(t)),...Object.keys(UNITS).map(t=>this.recruitReason(t))].join('|');
      if(force||this.panelKey!==key){this.panelKey=key;
        if(this.tab==='build'){
          $('tray-title').textContent='Build your kingdom';
          $('panel').innerHTML=`<div class="category">${['Economy','Town','Military','Defense'].map(name=>`<button data-category="${name}" class="${this.category===name?'active':''}">${name}</button>`).join('')}</div><div class="build-list">${Object.entries(BUILDINGS).filter(([,d])=>d.category===this.category).map(([type,d])=>{const reason=this.buildReason(type);return `<button class="build-card" data-build="${type}" aria-disabled="${!!reason}"><img src="${this.renderer.art.thumbnail(type)}" alt=""><span class="copy"><strong>${d.name}</strong><small class="${reason?'unavailable':''}">${reason||d.desc}</small><span class="cost">${costText(d.cost)}</span></span></button>`;}).join('')}</div>`;
        }else{
          $('tray-title').textContent='Rally your people';
          $('panel').innerHTML=`<div class="army-actions"><button data-action="select-army">Select army</button><button data-action="select-workers">Select workers</button></div><div class="build-list">${Object.entries(UNITS).map(([type,d])=>{const reason=this.recruitReason(type);return `<button class="build-card" data-recruit="${type}" aria-disabled="${!!reason}"><span class="unit-icon">${d.icon}</span><span class="copy"><strong>${d.name}</strong><small class="${reason?'unavailable':''}">${reason||`${d.hp} HP · ${d.damage} damage`}</small><span class="cost">${costText(d.cost)}</span></span></button>`;}).join('')}</div>`;
        }
      }
    }
    if(this.tab!=='inspect')return;
    const b=g.buildings.find(b=>g.selected.includes(b.id)),units=g.units.filter(u=>g.selected.includes(u.id)),tile=g.selectedTile!=null?g.world.tiles[g.selectedTile]:null;
    const key=[b?.id,b?.complete,b?.level,units.map(u=>u.id),g.selectedTile,tile?.resource,g.tech,g.units.filter(u=>u.job?.building===b?.id).length].join('|');
    if(force||this.inspectKey!==key){this.inspectKey=key;
      if(b){const d=BUILDINGS[b.type];
        $('inspection').innerHTML=`<div class="inspect-hero"><img src="${this.renderer.art.thumbnail(b.type,b.level)}" alt="${d.name} roof"><div><span class="eyebrow">${b.complete?'LEVEL '+b.level:'CONSTRUCTION'}</span><h2 class="inspect-title">${d.name}</h2></div></div><div class="details"><div class="stat-line"><span>Condition</span><strong id="selected-hp"></strong></div><progress id="selected-progress" max="1"></progress><div id="worker-detail"></div><p>${d.desc}</p></div><div class="action-list">${d.workers||!b.complete?'<button data-action="assign">Assign worker</button><button data-action="unassign">Remove worker</button>':''}${b.complete?'<button data-action="repair">Repair</button>':''}${b.complete&&b.level<5?`<button data-action="upgrade">Upgrade</button><span class="cost wide">Upgrade: ${costText({wood:100*b.level,stone:100*b.level,gold:50*b.level})}</span>`:''}${b.type==='keep'?'<button class="wide" data-recruit="worker">Train worker · 30 food</button>':''}${b.type==='smith'&&g.tech<5?`<button class="wide" data-action="research">Research · ${costText({iron:40*(g.tech+1),gold:50*(g.tech+1)})}</button>`:''}${b.type!=='keep'?`<button class="wide danger" data-action="demolish">${b.complete?'Demolish building':'Cancel construction'}</button>`:''}</div>`;
      }else if(units.length){
        $('inspection').innerHTML=`<span class="eyebrow">YOUR PEOPLE</span><h2 class="inspect-title">${units.length===1?UNITS[units[0].type].name:units.length+' units selected'}</h2><p class="details" id="unit-details"></p><div class="action-list"><button data-action="move">Move</button><button data-action="attack">Attack move</button><button data-action="hold">Hold position</button><button data-action="defend">Defend</button><button data-action="patrol">Patrol</button><button data-action="box">Box select</button><button class="wide" data-action="idle">Release worker jobs</button></div>`;
      }else if(tile){
        const name=tile.resource?`${tile.resource[0].toUpperCase()+tile.resource.slice(1)} deposit`:'Depleted deposit';
        $('inspection').innerHTML=`<span class="eyebrow">${tile.type==='foothill'?'MOUNTAIN FOOTHILLS':'NATURAL RESOURCES'}</span><h2 class="inspect-title">${name}</h2><div class="details"><div class="stat-line"><span>Remaining</span><strong id="deposit-remaining"></strong></div><p>${tile.resource==='wood'?'Build a Lumber Camp within 8 tiles.':tile.resource?'Place the matching mine or Quarry within 8 tiles and leave a clear route for workers.':'This deposit has been exhausted. Explore the mountain foothills for richer veins.'}</p></div>`;
      }else $('inspection').innerHTML='<p class="empty">Select a building, unit, or resource deposit on the map to see details and available actions.</p>';
    }
    if(b&&$('selected-hp')){
      $('selected-hp').textContent=`${Math.ceil(b.hp)} / ${b.maxHp}`;$('selected-progress').value=b.complete?b.hp/b.maxHp:b.progress/Math.max(1,BUILDINGS[b.type].time);
      const workers=g.units.filter(u=>u.job?.building===b.id);$('worker-detail').innerHTML=BUILDINGS[b.type].workers?`<div class="stat-line"><span>Assigned workers</span><strong>${workers.length} / ${BUILDINGS[b.type].workers}</strong></div>${workers.some(u=>u.job?.warning)?'<p class="selection-warning">Work blocked: no reachable resources or storage. Open a route or reassign workers.</p>':''}`:'';
    }
    if($('unit-details'))$('unit-details').textContent=units.length===1?`HP ${Math.ceil(units[0].hp)} / ${units[0].maxHp} · ${UNITS[units[0].type].damage} damage · ${units[0].kills} kills · ${units[0].job?.kind||units[0].stance}`:'Choose an order below, then a destination on the map.';
    if(tile&&$('deposit-remaining'))$('deposit-remaining').textContent=`${Math.ceil(tile.amount)} ${tile.resource||''}`;
  }
  action(e){
    const el=e.target.closest('button');if(!el)return;const g=this.game,b=g.buildings.find(b=>g.selected.includes(b.id));
    if(el.dataset.category){this.category=el.dataset.category;this.renderPanel(true);return;}
    if(el.dataset.build){const reason=this.buildReason(el.dataset.build);if(reason){this.toast(reason);return;}this.input.begin(el.dataset.build);this.openTab(null);this.update();return;}
    if(el.dataset.recruit){const reason=this.recruitReason(el.dataset.recruit);if(reason)this.toast(reason);else g.recruit(el.dataset.recruit);this.renderPanel(true);return;}
    switch(el.dataset.action){
      case'assign':g.assignWorker(b);break;case'unassign':g.removeWorker(b);break;case'repair':g.repair(b);break;case'upgrade':g.upgrade(b);break;case'research':g.research();break;
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
    const g=this.game;for(const r in RESOURCES)$('res-'+r).textContent=Math.floor(g.resources[r]);$('res-pop').textContent=`${g.units.length}/${g.capacity}`;
    $('wave').textContent=g.wave?`Wave ${g.wave}${g.endless?'':' / 50'}`:'A new kingdom';$('timer').textContent=g.active?`${g.enemies.length} foes`:`${String(Math.floor(Math.max(0,g.timer)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,g.timer)%60)).padStart(2,'0')}`;
    $('wave-state').textContent=g.active?'Defend the Keep. Hold the coast.':g.wave?'Repair, gather, and prepare.':'The sea is quiet. For now.';
    $('next-wave').disabled=g.active||g.over;$('pause').textContent=g.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',g.paused?'Resume game':'Pause game');$('speed').textContent=g.speed+'×';
    $('status').textContent=`${g.units.filter(u=>u.type==='worker'&&!u.job).length} idle workers · ${g.stats.kills} enemies defeated`;
    $('hint').textContent=this.input.touch?'Drag to explore · Pinch to zoom · Tap to select':'WASD to explore · Scroll to zoom · Right-click to move';
    const types=g.buildings.filter(b=>b.complete).map(b=>b.type);$('objective').textContent=!types.includes('lumber')?'First, build a Lumber Camp near trees.':!types.includes('farm')?'Build a Farm to feed your people.':!types.includes('quarry')?'Establish a Quarry. Mountains hold richer ores.':!types.includes('barracks')?'Raise a Barracks and recruit defenders.':'Explore the foothills. Fortify your coast.';
    const p=this.renderer.preview;$('placement').hidden=!p;$('viewport').classList.toggle('has-placement',!!p);
    if(p){const d=BUILDINGS[p.type],reason=this.buildReason(p.type)||g.world.placementReason(p.type,p.tx,p.ty,g.buildings);$('placement-label').textContent=d.name;$('placement-image').src=this.renderer.art.thumbnail(p.type);$('placement-cost').textContent=costText(d.cost);$('placement-reason').textContent=reason||(this.input.touch?'Tap a site, then confirm.':'Click the map to build.');$('confirm-build').disabled=!!reason;$('placement').classList.toggle('invalid',!!reason);}
    if(performance.now()>this.toastUntil)$('toast').classList.remove('visible');this.renderPanel();
    const boss=g.enemies.find(e=>ENEMIES[e.type].boss);$('boss').hidden=!boss;if(boss)$('boss').innerHTML=`${ENEMIES[boss.type].name}<progress max="${boss.maxHp}" value="${boss.hp}"></progress>`;
    if(g.over&&!this.endShown&&!this.atTitle){this.endShown=true;this.ending();}
  }
  dialog(html,title=false){
    const modal=$('modal');if(!modal.open){this.pauseBeforeMenu=this.game.paused;this.game.paused=true;this.input.keys.clear();}
    modal.classList.toggle('title-screen',title);$('modal-body').innerHTML=html;if(!modal.open)modal.showModal();
    for(const button of modal.querySelectorAll('[data-close]'))button.onclick=()=>this.closeMenu();
  }
  closeMenu(){if(this.atTitle)return;this.game.paused=this.pauseBeforeMenu??false;$('modal').close();this.update();}
  error(message){let el=$('menu-error');if(!el){el=document.createElement('p');el.id='menu-error';el.className='menu-error';el.setAttribute('role','alert');$('modal-body').append(el);}el.textContent=message;}
  titleArt(){return `<div class="title-art"><span class="eyebrow">THE NORTHERN REACH</span><img src="${this.renderer.art.thumbnail('keep',3)}" alt="An overhead view of the Keep"><p>From a lonely Keep,<br>a kingdom will rise.</p><small>BUILD · EXPLORE · SURVIVE</small></div>`;}
  welcome(){
    this.atTitle=true;this.onTitle?.();this.renderer.preview=null;this.openTab(null);this.game.paused=true;
    this.dialog(`<div><span class="eyebrow">A KINGDOM BEGINS WITH YOU</span><h1>TIDEHOLD</h1><h2>The Last Coast</h2><p>Raise your roofs beneath the mountain ranges. Mine their riches. Hold the shore against the coming tide.</p><div class="menu-list"><button id="continue" class="${this.saves.has()?'primary':''}" ${this.saves.has()?'':'disabled'}>Continue kingdom <span>→</span></button><button id="new-kingdom" class="${this.saves.has()?'':'primary'}">New kingdom <span>＋</span></button><button id="title-settings">Settings <span>⚙</span></button><button id="welcome-help">How to play <span>?</span></button></div></div>${this.titleArt()}`,true);
    $('continue').onclick=()=>this.load();$('new-kingdom').onclick=()=>this.newKingdom();$('title-settings').onclick=()=>this.settings(()=>this.welcome());$('welcome-help').onclick=()=>this.help(()=>this.welcome());
  }
  newKingdom(){
    this.dialog(`<div><span class="eyebrow">YOUR STORY STARTS HERE</span><h1>A new<br>kingdom.</h1><p>One Keep and five workers. New mountain ranges, new opportunities. Starting a new kingdom replaces the browser's saved run when the next save occurs.</p><label for="difficulty">Choose your challenge</label><select id="difficulty"><option value="normal">Normal · The intended challenge</option><option value="easy">Easy · A gentler beginning</option><option value="hard">Hard · A relentless coast</option></select><div class="modal-actions"><button id="new-game" class="primary">Found a kingdom →</button><button id="new-back">Back</button></div></div>${this.titleArt()}`,true);
    $('new-back').onclick=()=>this.welcome();$('new-game').onclick=()=>{const difficulty=$('difficulty').value;this.atTitle=false;$('modal').close();this.onGame(null,difficulty);};
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
    this.dialog(`<span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><div class="settings-row"><div>Game sound<p>Construction and invasion cues.</p></div><button id="sound" aria-pressed="${this.audio.enabled}">${this.audio.enabled?'On':'Off'}</button></div><p>Mouse, keyboard, and touch controls are always available. The interface adapts to your screen.</p><div class="modal-actions"><button id="settings-back" class="primary">Back</button></div>`);
    $('sound').onclick=()=>{this.audio.enabled=!this.audio.enabled;$('sound').textContent=this.audio.enabled?'On':'Off';$('sound').setAttribute('aria-pressed',String(this.audio.enabled));this.audio.play('build');try{this.saves.storage.setItem('tidehold.sound',String(this.audio.enabled));}catch{this.error('Sound changed for this session; settings could not be saved.');}};$('settings-back').onclick=back;
  }
  help(back=()=>this.closeMenu()){
    this.dialog(`<span class="eyebrow">THE FIELD GUIDE</span><h2>Your first foothold.</h2><p>Build a <b>Lumber Camp</b> near trees and a <b>Farm</b>. Idle workers construct the sites, then stay to produce resources. Build houses and train workers at the Keep.</p><p><b>Mountain foothills hold richer stone, iron, and gold.</b> Peaks block ground movement. Use passes, place mines near reachable veins, and leave a clear route to storage. Tap deposits to inspect their reserves.</p><p>Build a Barracks or Archery Range, recruit defenders, and protect the Keep with towers and walls. Upgrade the Keep to unlock advanced mines and troops.</p><div class="help-grid"><div><strong>Mouse & keyboard</strong>WASD / arrows: pan<br>Wheel: zoom<br>Click: select / build<br>Left drag: group selection<br>Shift: add to selection<br>Right click: move<br>Right / middle drag: pan<br>Space: pause · Esc: cancel</div><div><strong>Touch</strong>Drag: pan · Pinch: zoom<br>Tap: select / preview<br>Place here: confirm building<br>Army: select troops / workers<br>Move, then tap: give orders<br>Box select: drag a selection<br>Two fingers: pan and zoom</div></div><p>Autosave runs every 30 game seconds and after waves. Existing saved maps stay intact; start a new kingdom to explore the new ranges.</p><div class="modal-actions"><button id="help-back" class="primary">Back</button></div>`);$('help-back').onclick=back;
  }
  ending(){
    const g=this.game;this.dialog(`<span class="eyebrow">${g.victory?'THE KINGDOM HAS SURVIVED':'THE LAST BANNER FALLS'}</span><h2>${g.victory?'The coast is yours.':'A kingdom remembered.'}</h2><p>Waves reached: ${g.wave} · Enemies defeated: ${g.stats.kills}<br>Structures built: ${g.stats.built} · People lost: ${g.stats.lost}<br>Score: ${g.stats.kills*10+g.wave*100+g.stats.built*20}</p><div class="modal-actions">${g.victory?'<button id="endless" class="primary">Enter endless mode</button>':''}<button id="again">Main menu</button><button data-close>View kingdom</button></div>`);
    $('again').onclick=()=>{if(this.saves.save(g))this.welcome();else this.error('Saving failed. Your kingdom remains open.');};if($('endless'))$('endless').onclick=()=>{g.endless=true;g.over=false;g.victory=false;g.timer=120;this.endShown=false;this.closeMenu();g.autosave();};
  }
}
