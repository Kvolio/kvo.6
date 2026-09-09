import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/battle',{recursive:true});const results=[];
try{for(const spec of [{name:'desktop',width:1440,height:900,touch:false,slowdown:1},{name:'phone',width:390,height:844,touch:true,slowdown:4},{name:'landscape',width:844,height:390,touch:true,slowdown:4}]){
  const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:spec.touch,isMobile:spec.touch}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto('http://127.0.0.1:4173/?test');await page.locator('#new-kingdom').click();await page.locator('#new-game').click();
  await page.evaluate(async()=>{const {Game}=await import('/src/game.js'),data=await(await fetch('/artifacts/playtest/citadel-50.json')).json(),a=window.__tidehold;a.setGame(Game.restore(data));a.game.kingdomName='The Last Citadel';a.game.keepDesign=2;a.game.paused=true;const e=a.game.enemies.find(e=>e.type==='demonlord');a.renderer.camera={x:e?.x||a.game.keep.x,y:e?.y||a.game.keep.y,zoom:.8};a.ui.update();});
  const session=await context.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:spec.slowdown});
  await page.evaluate(()=>{window.__tidehold.game.paused=false;});await page.waitForTimeout(1500);
  const metrics=await page.evaluate(()=>new Promise(resolve=>{const times=[],started=performance.now();let previous=started;function frame(now){times.push(now-previous);previous=now;if(now-started<5000){requestAnimationFrame(frame);return;}times.shift();times.sort((a,b)=>a-b);const g=window.__tidehold.game;resolve({frames:times.length,meanInterval:times.reduce((a,b)=>a+b,0)/times.length,p95Interval:times[Math.floor(times.length*.95)],units:g.units.length,enemies:g.enemies.length,buildings:g.buildings.length,gameSeconds:g.time});}requestAnimationFrame(frame);}));
  assert.ok(metrics.frames>40,'simulation remains interactive');assert.ok(metrics.gameSeconds>52,'simulation advances');
  await page.evaluate(()=>{const a=window.__tidehold;a.game.paused=true;const e=a.game.enemies.find(e=>e.type==='demonlord');if(e){a.game.selected=[e.id];a.ui.selection();}a.ui.update();});
  await page.screenshot({path:`artifacts/battle/${spec.name}-siege.png`});
  if(spec.touch){await page.setViewportSize({width:spec.height,height:spec.width});await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.locator('#menu').click();await page.locator('#save').click();await page.locator('[data-close]').click();await page.reload();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.wave),60);
  assert.deepEqual(errors,[]);results.push({...spec,...metrics,passed:true});console.log(JSON.stringify(results.at(-1)));await context.close();
}await writeFile('artifacts/battle/results.json',JSON.stringify(results,null,2));}finally{await browser.close();}
