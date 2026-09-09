import {Game} from './game.js';
const KEY='tidehold.save.v1';
export class SaveManager {
 constructor(storage){this.storage=storage;}
 save(game){try{this.storage.setItem(KEY,JSON.stringify(game.serialize()));return true;}catch{return false;}}
 load(){const raw=this.storage.getItem(KEY);return raw?Game.restore(JSON.parse(raw)):null;}
 has(){try{return !!this.storage.getItem(KEY);}catch{return false;}}
}
export class GamePlatform {
 async showRewardedAd(){return {available:false,rewarded:false};}
 async showInterstitial(){return {available:false};}
 async submitScore(score){return {submitted:false,score};}
 async saveProgress(){return {available:false};}
}
