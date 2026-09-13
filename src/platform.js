// CrazyGames v3 is loaded only by the portal build. Other builds stay offline-capable.
export class GamePlatform {
  constructor(storage,sdk=null){this.storage=storage;this.sdk=sdk;this.playing=false;this.loading=false;this.audio=null;this.celebrated=new WeakSet();}
  static async connect({enabled=false,sdk,localStorage,timeout=20000}){
    if(!enabled)return new GamePlatform(localStorage());
    if(!sdk)throw Error('CrazyGames could not be reached. Check your connection and retry.');
    let timer;
    try{await Promise.race([sdk.init(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CrazyGames is taking too long to load your save. Please retry.')),timeout);})]);}
    finally{clearTimeout(timer);}
    if(sdk.environment==='disabled')return new GamePlatform(localStorage());
    if(!['local','crazygames'].includes(sdk.environment))throw Error('CrazyGames environment is unavailable. Please retry.');
    // Never mix browser saves into an account or fall back after a Data module error.
    // The SDK owns guest storage, cloud preloading and account-switch reloads.
    sdk.data.getItem('tidehold.save.v1');
    const platform=new GamePlatform(sdk.data,sdk);platform.setLoading(true);return platform;
  }
  get saveOptions(){return this.sdk?{compact:true,label:'CrazyGames progress save'}:{};}
  event(name,...args){try{this.sdk?.game[name]?.(...args);}catch(error){console.warn('CrazyGames event unavailable:',name,error?.code||'error');}}
  setLoading(value){if(this.loading===value)return;this.loading=value;this.event(value?'loadingStart':'loadingStop');}
  setPlaying(value){if(this.playing===value)return;this.playing=value;this.event(value?'gameplayStart':'gameplayStop');}
  update(game,started,hidden=false){
    // CrazyGames tracks focus itself. Hidden tabs must not generate focus-only events.
    if(hidden)return;
    this.setPlaying(!!started&&!game.paused&&!game.over);
    if(started&&game.victory&&!this.celebrated.has(game)){this.celebrated.add(game);this.event('happytime');this.event('reportGameCompletedPercentage',100);}
  }
  attachAudio(audio){
    this.audio=audio;if(!this.sdk)return;
    const changed=settings=>audio.setPlatformMuted(!!settings?.muteAudio);
    changed(this.sdk.game.settings);this.sdk.game.addSettingsChangeListener(changed);
  }
}
