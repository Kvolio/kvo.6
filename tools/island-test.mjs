import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/islands',{recursive:true});const results=[];
try{for(const spec of [{name:'desktop',width:1440,height:900,touch:false},{name:'portrait',width:390,height:844,touch:true},{name:'small',width:320,height:568,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:spec.touch,isMobile:spec.touch}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?test');await page.locator('#new-kingdom').click();
  await page.locator('#kingdom-name').fill('Greyhaven <&>');await page.locator('[data-keep-design="2"]').click();await page.locator('#difficulty').selectOption('hard');
  assert.equal(await page.locator('[data-keep-design="2"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`artifacts/islands/${spec.name}-customization.png`});
  await page.locator('#new-game').click();
  assert.deepEqual(await page.evaluate(()=>({name:window.__tidehold.game.kingdomName,design:window.__tidehold.game.keepDesign,cols:window.__tidehold.game.world.cols})),{name:'Greyhaven <&>',design:2,cols:96});
  await page.locator('#auto-wave').check();assert.equal(await page.evaluate(()=>window.__tidehold.game.autoWave),true);
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=true;a.renderer.camera={x:g.world.cols*20,y:g.world.rows*20,zoom:Math.min(a.renderer.width/(g.world.cols*40),a.renderer.height/(g.world.rows*40))*.92};a.ui.update();});
  await page.waitForTimeout(300);await page.screenshot({path:`artifacts/islands/${spec.name}-world.png`});
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;a.renderer.camera={x:g.keep.x,y:g.keep.y,zoom:1.5};a.ui.openTab(null);});
  await page.waitForTimeout(200);await page.screenshot({path:`artifacts/islands/${spec.name}-keep.png`});
  await page.locator('#menu').click();await page.locator('#save').click();await page.locator('[data-close]').click();await page.reload();await page.locator('#continue').click();
  assert.equal(await page.evaluate(()=>window.__tidehold.game.kingdomName),'Greyhaven <&>');assert.equal(await page.evaluate(()=>window.__tidehold.game.keepDesign),2);assert.equal(await page.evaluate(()=>window.__tidehold.game.world.cols),96);
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=true;g.wave=29;g.startWave();const s=g.ships.find(s=>s.side==='east');s.x=s.targetX+100;s.y=s.targetY;s.delay=0;a.renderer.camera={x:s.x-50,y:s.y,zoom:1.8};a.ui.update();});
  await page.waitForTimeout(200);await page.screenshot({path:`artifacts/islands/${spec.name}-landing.png`});
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.enemies=[];g.ships=[];g.active=false;g.timer=10000;for(let y=43;y<48;y++)for(let x=43;x<48;x++)Object.assign(g.world.tile(x,y),{type:'grass',resource:null,amount:0});g.revision++;g.addBuilding('wall',45,44,true);const u=g.addUnit('archer',45.5*40,46.5*40);g.selected=[u.id];a.renderer.camera={x:45.5*40,y:44.5*40,zoom:1.2};a.ui.selection();a.ui.update();});
  await page.locator('[data-action="mount"]').click();
  // Put the intended wall in the open part of the battlefield, away from HUD controls.
  const wallPoint=await page.evaluate(()=>{const a=window.__tidehold,b=a.game.buildings.find(b=>b.type==='wall');a.renderer.camera.x=b.x-(a.renderer.width*.65-a.renderer.width/2)/a.renderer.camera.zoom;a.renderer.camera.y=b.y-(a.renderer.height*.7-a.renderer.height/2)/a.renderer.camera.zoom;return a.renderer.worldToScreen(b.x,b.y);}),cb=await page.locator('#game').boundingBox();
  if(spec.touch)await page.touchscreen.tap(cb.x+wallPoint.x,cb.y+wallPoint.y);else await page.mouse.click(cb.x+wallPoint.x,cb.y+wallPoint.y);
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=false;for(let i=0;i<100;i++)g.update(.1);g.paused=true;a.ui.selection();a.ui.update();});
  assert.ok(await page.evaluate(()=>window.__tidehold.game.units.find(u=>u.type==='archer').garrison));
  await page.screenshot({path:`artifacts/islands/${spec.name}-garrison.png`});
  await page.locator('[data-action="dismount"]').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.units.find(u=>u.type==='archer').garrison),null);
  if(spec.touch){await page.setViewportSize({width:spec.height,height:spec.width});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  assert.deepEqual(errors,[]);results.push({...spec,passed:true,errors});console.log(`${spec.name}: island passed`);await context.close();
}await writeFile('artifacts/islands/results.json',JSON.stringify(results,null,2));}finally{await browser.close();}
