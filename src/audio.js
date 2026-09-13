// Original procedural score and effects. All instruments are synthesized locally;
// no audio downloads are needed by the offline build.
export class AudioManager {
  constructor(context=null){
    this.context=context;this.enabled=false;this.levels={music:.5,effects:.7,ambience:.4};
    this.voices=new Set();this.last=new Map();this.beat=0;this.nextBeat=0;this.nextAmbient=0;this.mood='peace';
  }
  restore(storage){try{const preference=storage.getItem('tidehold.sound');this.enabled=preference==null||preference==='true';const levels=JSON.parse(storage.getItem('tidehold.audio')||'{}');for(const key in this.levels)if(Number.isFinite(levels[key]))this.levels[key]=Math.max(0,Math.min(1,levels[key]));}catch{}}
  save(storage){storage.setItem('tidehold.sound',String(this.enabled));storage.setItem('tidehold.audio',JSON.stringify(this.levels));}
  unlock(){
    if(!this.enabled||this.platformMuted)return false;
    try{if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;this.context=new Audio();}
      if(!this.master){const c=this.context;this.master=c.createGain();this.master.gain.value=.65;
        const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=10;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.18;this.master.connect(limiter);limiter.connect(c.destination);
        this.buses={};for(const key of ['music','effects','ambience']){const gain=c.createGain();gain.gain.value=this.levels[key];gain.connect(this.master);this.buses[key]=gain;}
        const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);let seed=1729;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}this.noise=buffer;
      }
      if(this.context.state==='suspended'&&this.context.resume)this.context.resume().catch(()=>{});
      return true;
    }catch{return false;}
  }
  setPlatformMuted(value){this.platformMuted=!!value;this.applyLevels();}
  setEnabled(value){this.enabled=!!value;if(value)this.unlock();this.applyLevels();}
  setLevel(key,value){if(key in this.levels)this.levels[key]=Math.max(0,Math.min(1,Number(value)||0));this.applyLevels();}
  applyLevels(quiet=false,hidden=false){if(!this.master)return;const now=this.context.currentTime;this.master.gain.setTargetAtTime(this.enabled&&!hidden&&!this.platformMuted?.65:0,now,.08);for(const key in this.levels)this.buses[key].gain.setTargetAtTime(this.levels[key]*(quiet&&key==='music'?.35:1),now,.15);}
  voice({frequency=220,end=frequency,duration=.3,volume=.1,type='triangle',at=this.context.currentTime,bus='effects',noise=false,filter=1200,attack=.008}){
    if(this.voices.size>=64)return;
    const c=this.context,source=noise?c.createBufferSource():c.createOscillator(),gain=c.createGain(),tone=c.createBiquadFilter();
    if(noise){source.buffer=this.noise;source.loop=true;tone.type='bandpass';tone.Q.value=.6;tone.frequency.value=filter;}
    else{source.type=type;source.frequency.setValueAtTime(frequency,at);source.frequency.exponentialRampToValueAtTime(Math.max(1,end),at+duration);tone.type='lowpass';tone.frequency.value=filter;}
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+Math.min(attack,duration*.3));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(tone);tone.connect(gain);gain.connect(this.buses[bus]);this.voices.add(source);
    source.onended=()=>{source.disconnect();tone.disconnect();gain.disconnect();this.voices.delete(source);};source.start(at);source.stop(at+duration+.02);
  }
  play(kind){
    if(!this.enabled||!this.unlock())return;
    const now=this.context.currentTime,cooldown={hit:.11,arrow:.09,chop:.22,mine:.24,hammer:.22,roar:4,ship:3,warning:.4}[kind]??.18;
    if(now-(this.last.get(kind)??-100)<cooldown)return;this.last.set(kind,now);
    const tone=(frequency,end,duration,volume=.12,type='triangle',delay=0)=>this.voice({frequency,end,duration,volume,type,at:now+delay});
    const noise=(filter,duration,volume=.15,delay=0)=>this.voice({noise:true,filter,duration,volume,at:now+delay});
    switch(kind){
      case 'arrow':noise(3600,.16,.18);tone(690,240,.13,.035);break;
      case 'hit':noise(2600,.075,.2);tone(185,63,.14,.14);tone(1100,740,.18,.025,'sine');break;
      case 'chop':noise(520,.1,.25);tone(155,80,.1,.1);break;
      case 'mine':noise(2600,.045,.14);tone(1420,990,.27,.09,'sine');tone(2160,1900,.15,.025,'sine');break;
      case 'hammer':tone(220,95,.12,.13);noise(1500,.05,.14);break;
      case 'build':for(let i=0;i<3;i++){tone(210-i*30,90,.13,.13,'triangle',i*.16);noise(900,.08,.13,i*.16);}break;
      case 'ready':for(const [i,n]of [60,64,67,72].entries())this.note(n,now+i*.12,.6,.12,'effects');break;
      case 'wave':for(let i=0;i<3;i++){tone(110*(i===2?1.5:1),110*(i===2?1.5:1),.8,.13,'sawtooth',i*.65);tone(55,43,.35,.2,'sine',i*.65);}break;
      case 'warning':tone(293,277,.45,.12,'triangle');tone(440,415,.45,.065,'sine',.12);break;
      case 'impact':case 'collapse':noise(330,.7,.35);noise(1900,.23,.12);tone(95,27,.55,.28,'sine');break;
      case 'boss':tone(98,73,.8,.14,'sawtooth');noise(400,.55,.15);break;
      case 'portal':tone(220,55,1.2,.1,'sine');noise(450,1.1,.12);break;
      case 'seal':tone(130,32,2.8,.22,'sawtooth');noise(210,2.4,.3);tone(147,73,2.5,.1,'triangle',.1);break;
      case 'roar':tone(67,38,1.7,.17,'sawtooth');tone(91,46,1.4,.1,'triangle',.1);noise(470,1.6,.25);break;
      case 'ship':tone(130,70,.8,.07,'sawtooth');noise(1200,.7,.08);break;
      case 'victory':for(const [i,n]of [60,64,67,72,76].entries())this.note(n,now+i*.2,1.2,.13,'effects');break;
      case 'defeat':for(const [i,n]of [50,48,45,38].entries())this.note(n,now+i*.3,1.6,.13,'effects');break;
    }
  }
  note(midi,at,duration,volume=.08,bus='music',sustain=false){const frequency=440*2**((midi-69)/12);this.voice({frequency,duration,volume,at,bus,type:sustain?'sine':'triangle',filter:sustain?850:2000,attack:sustain?.25:.008});if(!sustain)this.voice({frequency:frequency*2,duration:duration*.45,volume:volume*.18,at,bus,type:'sine',filter:3000});}
  score(at,beat,mood){
    const intense=['battle','boss','finale','demon'].includes(mood),dark=['finale','demon','defeat'].includes(mood);
    const root=dark?38:mood==='victory'?48:45,bar=Math.floor(beat/8),chord=[0,5,3,7][bar%4],base=root+chord;
    if(beat%8===0){for(const n of [base,base+7,base+(dark?13:15)])this.note(n,at,intense?2.5:4,.045,'music',true);}
    const melodies={peace:[12,19,15,14,12,7,10,7],battle:[0,7,12,7,3,7,10,7],boss:[0,0,7,3,12,10,7,3],finale:[0,1,7,0,13,12,7,1],demon:[0,6,7,1,12,13,6,1],victory:[12,16,19,24,19,16,14,12],defeat:[12,10,7,3,0,7,3,0]};
    const melody=melodies[mood]||melodies.peace;
    if(intense||beat%2===0)this.note(base+melody[beat%8]+(intense?0:12),at,intense?.55:1.4,intense?.075:.06);
    if(intense&&beat%2===0){this.voice({frequency:80,end:32,duration:.28,volume:.16,at,bus:'music',type:'sine'});if(beat%4===2)this.voice({noise:true,filter:900,duration:.12,volume:.09,at,bus:'music'});}
    if(['boss','finale','demon'].includes(mood)&&beat%4===0)this.note(base-12,at,1.7,.09,'music',true);
  }
  update(game,{title=false,hidden=false}={}){
    if(!this.master)return;this.applyLevels(game.paused&&!title,hidden);if(!this.enabled||hidden||this.context.state==='suspended')return;
    const now=this.context.currentTime,boss=game.enemies.find(e=>e.hp>0&&['captain','chief','brute','champion','giant','titan','blackknight','warlord','dragonknight','dragon','conqueror','archdemon','demonlord'].includes(e.type));
    const mood=game.over?(game.victory?'victory':'defeat'):title?'peace':boss?(['dragon','conqueror','demonlord'].includes(boss.type)?'finale':'boss'):game.sealBroken?'demon':game.active?'battle':'peace';
    if(mood!==this.mood){this.mood=mood;this.beat=0;this.nextBeat=now+.08;}
    if(this.nextBeat<now-.2)this.nextBeat=now;
    const tempo={peace:.42,battle:.3,boss:.27,finale:.25,demon:.28,victory:.45,defeat:.6}[mood];
    while(this.nextBeat<now+.15){if(this.levels.music>0)this.score(this.nextBeat,this.beat++,mood);else this.beat++;this.nextBeat+=tempo;}
    if(now>=this.nextAmbient){this.nextAmbient=now+3.5;if(this.levels.ambience>0){this.voice({noise:true,filter:game.sealBroken?230:650,duration:4.5,volume:game.sealBroken?.12:.18,attack:1.2,bus:'ambience'});if(!game.active&&!game.sealBroken&&!game.over){this.voice({frequency:1900,end:2500,duration:.2,volume:.025,at:now+1.7,bus:'ambience',type:'sine',filter:3000});this.voice({frequency:2400,end:1800,duration:.2,volume:.022,at:now+1.95,bus:'ambience',type:'sine',filter:3000});}}
      if(game.active&&!game.paused){if(boss&&['dragon','archdemon','demonlord'].includes(boss.type))this.play('roar');else if(game.ships.some(s=>!s.landed))this.play('ship');}}
  }
}
