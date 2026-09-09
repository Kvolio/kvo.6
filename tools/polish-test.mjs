import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/polish',{recursive:true});const result={};
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/?test');
  await page.locator('#title-settings').click();await page.locator('#sound').click();await page.locator('#sound').click();await page.locator('#audio-music').fill('25');await page.locator('#audio-effects').fill('45');
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__tidehold.ui.audio.context.state),'running');
  await page.reload();await page.locator('#title-settings').click();assert.equal(await page.locator('#audio-music').inputValue(),'25');assert.equal(await page.locator('#audio-effects').inputValue(),'45');
  await page.screenshot({path:'artifacts/polish/audio-settings.png'});
  const samples=await page.evaluate(async()=>{
    const {AudioManager}=await import('/src/audio.js'),result=[];
    for(const mood of ['peace','battle','boss','finale','demon']){
      const context=new OfflineAudioContext(1,44100*5,44100),a=new AudioManager(context);a.enabled=true;a.unlock();for(let beat=0;beat<8;beat++)a.score(.1+beat*.35,beat,mood);
      const buffer=await context.startRendering(),data=buffer.getChannelData(0);let peak=0,power=0;for(const value of data){peak=Math.max(peak,Math.abs(value));power+=value*value;}result.push({mood,peak,rms:Math.sqrt(power/data.length)});
    }
    for(const kind of ['arrow','hit','chop','mine','hammer','build','wave','warning','impact','seal','roar','portal','boss','ship','ready','victory','defeat']){
      const context=new OfflineAudioContext(1,44100*4,44100),a=new AudioManager(context);a.enabled=true;a.unlock();a.play(kind);const voices=a.voices.size;a.play(kind);if(a.voices.size!==voices)throw Error('Unthrottled '+kind);
      const buffer=await context.startRendering(),data=buffer.getChannelData(0);let peak=0,power=0;for(const value of data){peak=Math.max(peak,Math.abs(value));power+=value*value;}result.push({kind,peak,rms:Math.sqrt(power/data.length),released:a.voices.size===0});
    }return result;
  });
  for(const sample of samples){assert.ok(sample.peak>.003,JSON.stringify(sample));assert.ok(sample.peak<.95,JSON.stringify(sample));assert.ok(sample.rms>.0001,JSON.stringify(sample));if(sample.kind)assert.ok(sample.released,sample.kind);}result.audio=samples;
  const sheets=await page.evaluate(async()=>{
    const {BUILDINGS}=await import('/src/data.js'),a=window.__tidehold.renderer.art,types=Object.keys(BUILDINGS),sheets=[];
    for(let batch=0;batch<types.length;batch+=6){const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=6*156+55;const c=canvas.getContext('2d');c.fillStyle='#293b32';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e5d1a3';c.font='16px Georgia';
      for(let level=1;level<=5;level++)c.fillText('LEVEL '+level,195+(level-1)*213,30);
      for(let i=0;i<6&&types[batch+i];i++){const type=types[batch+i],y=i*156+52;c.font='14px system-ui';c.fillStyle='#ead7ae';c.fillText(BUILDINGS[type].name,12,y+65);
        for(let level=1;level<=5;level++){const sprite=a.building(type,level,15),side=BUILDINGS[type].size*40+24,scale=Math.min(1,126/side);c.drawImage(sprite,170+(level-1)*213+(130-side*scale)/2,y+(130-side*scale)/2,side*scale,side*scale);}
        c.fillStyle='#ffffff0c';c.fillRect(10,y+148,1220,1);
      }sheets.push(canvas.toDataURL().split(',')[1]);
    }
    const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=550;const c=canvas.getContext('2d');c.fillStyle='#293b32';c.fillRect(0,0,canvas.width,canvas.height);
    for(let design=0;design<3;design++){c.fillStyle='#ead7ae';c.font='14px system-ui';c.fillText(['Coastal Keep','Highland Hall','Royal Citadel'][design],12,design*178+93);for(let level=1;level<=5;level++)c.drawImage(a.building('keep',level,10,design),180+(level-1)*212,design*178+15,150,150);}sheets.push(canvas.toDataURL().split(',')[1]);return sheets;
  });
  for(const [i,data] of sheets.entries())await writeFile(`artifacts/polish/upgrades-${i+1}.png`,Buffer.from(data,'base64'));
  await page.locator('#settings-back').click();await page.locator('#new-kingdom').click();await page.locator('#new-game').click();
  await page.locator('[data-tab=army]').click();await page.locator('[data-army-category=Ranged]').click();assert.equal(await page.locator('[data-recruit]').count(),2);assert.equal(await page.locator('[data-recruit=worker]').count(),0);await page.locator('[data-army-category=All]').click();await page.locator('#close-tray').click();
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=true;g.difficulty='nightmare';g.wave=55;g.spawnEnemy('archdemon',g.keep.x+200,g.keep.y);g.notice('A portal opens. Reinforce the island.');a.ui.update();});
  const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(150);const boss=await page.locator('#boss').boundingBox(),wave=await page.locator('.wave-card').boundingBox(),toast=await page.locator('#toast').boundingBox();assert.ok(!overlaps(boss,wave),`boss/wave overlap at ${width}x${height}`);assert.ok(!overlaps(boss,toast),`boss/toast overlap at ${width}x${height}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`artifacts/polish/hud-${width}-${height}.png`});
  }
  await page.evaluate(()=>{const a=window.__tidehold.ui.audio;a.setEnabled(false);});await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>window.__tidehold.ui.audio.master.gain.value<.01));assert.deepEqual(errors,[]);result.passed=true;await writeFile('artifacts/polish/results.json',JSON.stringify(result,null,2));console.log('Polish: synthesized audio, settings, upgrade atlases and five boss HUD sizes passed.');
}finally{await browser.close();}
