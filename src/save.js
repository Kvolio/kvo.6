import {Game} from './game.js';
import {encodeSave,decodeSave} from './save-codec.js';
const KEY='tidehold.save.v1';
export class SaveManager {
 constructor(storage,{compact=false,label='On this browser'}={}){this.storage=storage;this.compact=compact;this.label=label;}
 demonUnlocked(){if(this.unlocked)return true;try{if(this.storage.getItem('tidehold.demon-castle')==='1')return true;const data=JSON.parse(this.storage.getItem(KEY)||'null');if(data&&(data.nightmareComplete||data.difficulty==='nightmare'&&data.victory)){this.unlocked=true;return true;}return false;}catch{return false;}}
 save(game){if(game.nightmareComplete||game.difficulty==='nightmare'&&game.victory)this.unlocked=true;try{const raw=this.compact?encodeSave(game.serialize()):JSON.stringify(game.serialize());if(this.compact&&new TextEncoder().encode(JSON.stringify({[KEY]:raw})).length>970000)throw Error('Save exceeds cloud budget');if(this.unlocked)this.storage.setItem('tidehold.demon-castle','1');this.storage.setItem(KEY,raw);return true;}catch{return false;}}
 load(){const raw=this.storage.getItem(KEY),game=raw?Game.restore(decodeSave(raw)):null;if(game?.nightmareComplete){this.unlocked=true;try{this.storage.setItem('tidehold.demon-castle','1');}catch{}}return game;}
 has(){try{return !!this.storage.getItem(KEY);}catch{return false;}}
}
