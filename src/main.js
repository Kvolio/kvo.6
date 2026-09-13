import {Game} from './game.js';
import {Renderer} from './renderer.js';
import {Input} from './input.js';
import {UI} from './ui.js';
import {SaveManager} from './save.js';
import {GamePlatform} from './platform.js';
import {AudioManager} from './audio.js';
function browserStorage(){try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};}}
async function connectPlatform(){
 const startup=document.createElement('section');startup.id='startup';startup.setAttribute('role','status');startup.innerHTML='<h1>TIDEHOLD</h1><p>Loading your kingdom…</p>';document.body.append(startup);
 try{const result=await GamePlatform.connect({enabled:document.documentElement.dataset.platform==='crazygames',sdk:window.CrazyGames?.SDK,localStorage:browserStorage});startup.remove();return result;}
 catch(error){startup.querySelector('p').textContent='Your saved kingdom could not be loaded. Check your connection and try again.';const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();startup.append(retry);console.warn('CrazyGames startup:',error?.code||error?.message);return new Promise(()=>{});}
}
export const platform=await connectPlatform();
const storage=platform.storage,saves=new SaveManager(storage,platform.saveOptions),audio=new AudioManager();audio.restore(storage);platform.attachAudio(audio);
document.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});document.addEventListener('keydown',()=>audio.unlock());
let game=new Game(),renderer=new Renderer(document.getElementById('game'),game),ui,started=false;
const input=new Input(renderer,()=>ui?.selection());
function setGame(next,difficulty='normal',options={}){started=true;if(!next&&options.keepDesign===3&&!saves.demonUnlocked())options={...options,keepDesign:0};if(!next&&['easy','normal'].includes(difficulty)){let seen=false;try{seen=storage.getItem('tidehold-tutorial-seen')==='1';}catch{}options={...options,tutorial:!seen};}game=next||new Game(Date.now(),difficulty,null,options);renderer.game=game;renderer.terrain=null;renderer.occupiedRevision=null;renderer.preview=null;renderer.center();input.commandMode=null;input.pointers.clear();input.start=null;input.gesture=false;input.mode='select';input.keys.clear();ui=new UI(game,renderer,input,saves,audio,setGame,()=>{started=false;});ui.update();}
setGame(game);started=false;ui.welcome();platform.setLoading(false);
new ResizeObserver(()=>renderer.resize()).observe(document.getElementById('viewport'));
let previous=performance.now(),uiClock=0;
function frame(now){const dt=Math.min((now-previous)/1000,.1);previous=now;input.update(dt);if(!document.hidden)game.update(dt);platform.update(game,started,document.hidden);renderer.draw(now/1000);audio.update(game,{title:!started,hidden:document.hidden});uiClock+=dt;if(uiClock>=.15){uiClock=0;ui.update();renderer.minimap(document.getElementById('minimap'));}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started){saves.save(game);input.keys.clear();if(!platform.sdk)game.paused=true;}audio.applyLevels(game.paused,document.hidden);previous=performance.now();});
window.addEventListener('pagehide',()=>{if(started)saves.save(game);});
// Read-only test access is enabled only on localhost with an explicit query flag.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('test'))window.__tidehold={get game(){return game;},renderer,input,get ui(){return ui;},setGame};
