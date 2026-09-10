import {Game} from './game.js';
const KEY='tidehold.save.v1';
export class SaveManager {
 constructor(storage){this.storage=storage;}
 demonUnlocked(){if(this.unlocked)return true;try{if(this.storage.getItem('tidehold.demon-castle')==='1')return true;const data=JSON.parse(this.storage.getItem(KEY)||'null');if(data&&(data.nightmareComplete||data.difficulty==='nightmare'&&data.victory)){this.unlocked=true;return true;}return false;}catch{return false;}}
 save(game){if(game.nightmareComplete||game.difficulty==='nightmare'&&game.victory)this.unlocked=true;try{if(this.unlocked)this.storage.setItem('tidehold.demon-castle','1');this.storage.setItem(KEY,JSON.stringify(game.serialize()));return true;}catch{return false;}}
 load(){const raw=this.storage.getItem(KEY),game=raw?Game.restore(JSON.parse(raw)):null;if(game?.nightmareComplete){this.unlocked=true;try{this.storage.setItem('tidehold.demon-castle','1');}catch{}}return game;}
 has(){try{return !!this.storage.getItem(KEY);}catch{return false;}}
}
export class GamePlatform {
 async showRewardedAd(){return {available:false,rewarded:false};}
 async showInterstitial(){return {available:false};}
 async submitScore(score){return {submitted:false,score};}
 async saveProgress(){return {available:false};}
}
