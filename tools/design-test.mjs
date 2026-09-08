import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/redesign',{recursive:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?test');await page.locator('#new-kingdom').click();await page.locator('#new-game').click();
  // Nested menus preserve an intentionally paused game as well as a running one.
  for(const paused of [true,false]){
    await page.evaluate(p=>window.__tidehold.game.paused=p,paused);await page.locator('#menu').click();await page.locator('#settings').click();await page.locator('#settings-back').click();await page.locator('#instructions').click();await page.locator('#help-back').click();await page.locator('[data-close]').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.paused),paused);
  }
  await page.evaluate(()=>{const a=window.__tidehold;a.game.paused=true;a.game.resources.gold=337;});
  await page.locator('#menu').click();await page.locator('#main-menu').click();assert.ok(await page.locator('#new-kingdom').isVisible());await page.reload();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.resources.gold),337);
  // Storage errors cannot discard the active kingdom or silently leave the menu.
  await page.evaluate(()=>{window.__savedSave=window.__tidehold.ui.saves.save;window.__tidehold.ui.saves.save=()=>false;});await page.locator('#menu').click();await page.locator('#main-menu').click();assert.ok(await page.locator('#menu-error').isVisible());assert.equal(await page.locator('#new-kingdom').count(),0);await page.evaluate(()=>{window.__tidehold.ui.saves.save=window.__savedSave;});await page.locator('[data-close]').click();
  // Mineral selection is driven through the actual canvas input.
  const ore=await page.evaluate(()=>{const a=window.__tidehold;a.game.paused=true;const t=a.game.world.tiles.find(t=>t.resource==='gold'&&t.type==='foothill');a.renderer.camera.x=(t.x+.5)*40;a.renderer.camera.y=(t.y+.5)*40;return {amount:t.amount,screen:a.renderer.worldToScreen((t.x+.5)*40,(t.y+.5)*40)};});const box=await page.locator('#game').boundingBox();await page.mouse.click(box.x+ore.screen.x,box.y+ore.screen.y);await page.waitForTimeout(200);assert.match(await page.locator('#deposit-remaining').textContent(),/2100 gold/);await page.locator('#close-inspector').click();
  await page.locator('[data-tab="build"]').click();await page.locator('[data-build="goldmine"]').click({force:true});assert.match(await page.locator('#toast').textContent(),/Keep level 2/);assert.equal(await page.evaluate(()=>window.__tidehold.renderer.preview),null);await page.locator('#close-tray').click();
  // Snapshot fixture only: all structures and states, never used for new games.
  await page.evaluate(async()=>{
    const a=window.__tidehold,{BUILDINGS}=await import('/src/data.js'),{Game}=await import('/src/game.js');a.setGame(new Game(4242));a.game.paused=true;a.game.buildings=[];a.game.units=[];a.game.enemies=[];a.game.ships=[];a.game.selected=[];a.game.selectedTile=null;
    for(const t of a.game.world.tiles)if(t.x>=23&&t.x<=43&&t.y>=18&&t.y<=37){t.type='grass';t.resource=null;}
    let i=0;for(const type of Object.keys(BUILDINGS)){const b=a.game.addBuilding(type,24+(i%5)*4,19+Math.floor(i/5)*5,true);b.level=1+i%5;if(type==='house'){b.complete=false;b.progress=4;}if(type==='warehouse')b.hp*=.4;i++;}
    for(let j=0;j<6;j++)a.game.addUnit(['worker','militia','spear','archer','crossbow','knight'][j],1000+j*40,1530);
    for(let j=0;j<4;j++)a.game.spawnEnemy(['raider','ogre','dragon','conqueror'][j],1550+j*55,1510);
    a.game.ships.push({x:800,y:290,landed:false});a.game.revision++;a.renderer.terrain=null;a.renderer.camera={x:1330,y:1090,zoom:.8};a.ui.toastUntil=0;
  });await page.waitForTimeout(250);await page.screenshot({path:'artifacts/redesign/structures.jpg',type:'jpeg',quality:88});
  await page.evaluate(()=>{const a=window.__tidehold;a.renderer.camera={x:1270,y:950,zoom:.46};});await page.waitForTimeout(250);await page.screenshot({path:'artifacts/redesign/mountains.jpg',type:'jpeg',quality:88});
  await page.evaluate(()=>{const a=window.__tidehold;a.renderer.camera={x:1120,y:870,zoom:1.4};});await page.waitForTimeout(200);await page.screenshot({path:'artifacts/redesign/roofs-close.jpg',type:'jpeg',quality:88});
  // Responsive resizing keeps input geometry aligned with the visible canvas.
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:4173/?test');await phone.locator('#new-kingdom').click();await phone.locator('#new-game').click();
  await phone.locator('[data-tab="build"]').click();await phone.setViewportSize({width:844,height:390});await phone.waitForTimeout(200);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await phone.locator('[data-build="farm"]').click();assert.ok(await phone.locator('#placement').isVisible());assert.equal(await phone.locator('#tray').isVisible(),false);
  await phone.locator('#cancel-build').click();assert.equal(await phone.evaluate(()=>window.__tidehold.renderer.preview),null);await phone.setViewportSize({width:390,height:844});await phone.waitForTimeout(200);assert.equal(await phone.evaluate(()=>document.querySelector('#tray').getBoundingClientRect().height<=innerHeight*.4+1),true);await phone.screenshot({path:'artifacts/redesign/mobile.jpg',type:'jpeg',quality:85});await context.close();
  assert.deepEqual(errors,[]);console.log('Redesign: menu state, safe saves, ore inspection, locked actions, cancellation, orientation and visual fixtures passed.');
}finally{await browser.close();}
