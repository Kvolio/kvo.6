import {Game} from './game.js';
const KEY='tidehold.save.v1';
export class SaveManager {
 constructor(storage){this.storage=storage;}
 save(game){try{this.storage.setItem(KEY,JSON.stringify(game.serialize()));return true;}catch{return false;}}
 load(){const raw=this.storage.getItem(KEY);return raw?Game.restore(JSON.parse(raw)):null;}
 has(){try{return !!this.storage.getItem(KEY);}catch{return false;}}
}
export class AudioManager {
 constructor(){this.enabled=false;this.context=null;}
 play(kind){if(!this.enabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context??=new Audio();this.context.resume();const osc=this.context.createOscillator(),gain=this.context.createGain(),now=this.context.currentTime;osc.type='triangle';osc.frequency.setValueAtTime(kind==='wave'?130:440,now);osc.frequency.exponentialRampToValueAtTime(kind==='wave'?65:660,now+.25);gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.4);osc.connect(gain);gain.connect(this.context.destination);osc.start();osc.stop(now+.4);}catch{/* Audio is optional on restricted browsers. */}}
}
export class GamePlatform {
 async showRewardedAd(){return {available:false,rewarded:false};}
 async showInterstitial(){return {available:false};}
 async submitScore(score){return {submitted:false,score};}
 async saveProgress(){return {available:false};}
}
