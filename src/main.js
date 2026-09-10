import {Game} from './game.js';
import {Renderer} from './renderer.js';
import {Input} from './input.js';
import {UI} from './ui.js';
import {SaveManager,GamePlatform} from './save.js';
import {AudioManager} from './audio.js';
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};}
const saves=new SaveManager(storage),audio=new AudioManager();audio.restore(storage);
document.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});document.addEventListener('keydown',()=>audio.unlock());
let game=new Game(),renderer=new Renderer(document.getElementById('game'),game),ui,started=false;
const input=new Input(renderer,()=>ui?.selection());
function setGame(next,difficulty='normal',options={}){started=true;if(!next&&options.keepDesign===3&&!saves.demonUnlocked())options={...options,keepDesign:0};if(!next&&['easy','normal'].includes(difficulty)){let seen=false;try{seen=storage.getItem('tidehold-tutorial-seen')==='1';}catch{}options={...options,tutorial:!seen};}game=next||new Game(Date.now(),difficulty,null,options);renderer.game=game;renderer.terrain=null;renderer.occupiedRevision=null;renderer.preview=null;renderer.center();input.commandMode=null;input.pointers.clear();input.start=null;input.gesture=false;input.mode='select';input.keys.clear();ui=new UI(game,renderer,input,saves,audio,setGame,()=>{started=false;});ui.update();}
setGame(game);started=false;ui.welcome();
new ResizeObserver(()=>renderer.resize()).observe(document.getElementById('viewport'));
let previous=performance.now(),uiClock=0;
function frame(now){const dt=Math.min((now-previous)/1000,.1);previous=now;input.update(dt);game.update(dt);renderer.draw(now/1000);audio.update(game,{title:!started,hidden:document.hidden});uiClock+=dt;if(uiClock>=.15){uiClock=0;ui.update();renderer.minimap(document.getElementById('minimap'));}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started){saves.save(game);game.paused=true;input.keys.clear();}audio.applyLevels(game.paused,document.hidden);previous=performance.now();});
window.addEventListener('pagehide',()=>{if(started)saves.save(game);});
// Read-only test access is enabled only on localhost with an explicit query flag.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('test'))window.__tidehold={get game(){return game;},renderer,input,get ui(){return ui;},setGame};
export const platform=new GamePlatform();
