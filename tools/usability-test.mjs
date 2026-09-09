import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/usability',{recursive:true});const errors=[];
try{
 for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<900}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?test');await page.locator('#new-kingdom').click();
  assert.equal(await page.locator('option[value=nightmare]').textContent(),'Nightmare · for experienced players, the broken seal');
  const previews=[];for(const i of [0,1,2]){await page.locator(`[data-keep-design="${i}"]`).click();previews.push(await page.locator('.title-art img').getAttribute('src'));assert.equal(await page.evaluate(()=>document.querySelector('.title-art img').src===window.__tidehold.renderer.art.thumbnail('keep',1,window.__tidehold.ui.newKeepDesign)),true);}assert.equal(new Set(previews).size,3);
  await page.locator('#new-game').click();assert.ok(await page.locator('#tutorial').isVisible());
  const time=await page.evaluate(()=>window.__tidehold.game.timer);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__tidehold.game.timer),time);
  await page.locator('#tutorial-next').click();await page.locator('#tutorial-next').click();await page.locator('[data-tab=build]').click();await page.waitForTimeout(100);
  const guide=await page.locator('#tutorial').boundingBox(),tray=await page.locator('#tray').boundingBox();const overlap=guide.x<tray.x+tray.width&&guide.x+guide.width>tray.x&&guide.y<tray.y+tray.height&&guide.y+guide.height>tray.y;assert.equal(overlap,false,`tutorial/tray overlap ${width}x${height}`);
  for(const id of ['tutorial-next','tutorial-skip']){const b=await page.locator('#'+id).boundingBox();assert.ok(b.y+b.height<=guide.y+guide.height,`tutorial controls clipped ${width}`);}
  await page.screenshot({path:`artifacts/usability/tutorial-${width}.png`});await page.locator('#close-tray').click();
  await page.locator('#menu').click();await page.locator('#settings').click();await page.locator('#settings-back').click();await page.locator('[data-close]').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.paused),false);
  if(width===844){for(let i=0;i<4;i++)await page.locator('#tutorial-next').click();}else await page.locator('#tutorial-skip').click();assert.equal(await page.locator('#tutorial').isVisible(),false);assert.equal(await page.evaluate(()=>localStorage.getItem('tidehold-tutorial-seen')),'1');assert.equal(await page.evaluate(()=>window.__tidehold.game.timer),time);
  await page.locator('[data-tab=army]').click();await page.locator('[data-recruit=worker]').click();await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>window.__tidehold.game.timer)<time);await page.locator('#close-tray').click();
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=true;g.startWave();g.enemies=[];a.ui.update();});await page.waitForTimeout(150);
  assert.ok(await page.evaluate(()=>{const a=window.__tidehold,c=document.querySelector('#minimap'),withShips=c.toDataURL(),ships=a.game.ships;a.game.ships=[];a.renderer.minimap(c);const without=c.toDataURL();a.game.ships=ships;a.renderer.minimap(c);return ships.length>0&&withShips!==without;}));
  await page.screenshot({path:`artifacts/usability/ships-${width}.png`});
  for(const type of ['captain','champion','warlord','archdemon','demonlord']){
   await page.evaluate(type=>{const a=window.__tidehold,g=a.game;g.enemies=[];g.spawnEnemy(type,g.keep.x+200,g.keep.y).hp*=.42;a.ui.update();},type);
   assert.equal(await page.locator('#boss small').count(),0);assert.equal(await page.locator('#boss [role=progressbar]').count(),1);assert.equal(await page.locator('#boss').innerText(),await page.evaluate(async type=>(await import('/src/data.js')).ENEMIES[type].name.split(' · ')[0],type));
  }
  await page.screenshot({path:`artifacts/usability/boss-${width}.png`});await page.setViewportSize({width:height,height:width});await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await context.close();console.log(`${width}x${height}: tutorial, pause, Keep previews, first action, fleet markers and boss tiers passed`);
 }
 // All heraldry tiers at identical health for a visual comparison, using actual HUD markup.
 const page=await browser.newPage({viewport:{width:760,height:780}});await page.goto('http://127.0.0.1:4173/?test');
 await page.evaluate(()=>{const a=window.__tidehold;document.querySelector('#modal').close();const gallery=document.createElement('div');gallery.id='boss-gallery';Object.assign(gallery.style,{position:'fixed',inset:'0',zIndex:100,background:'#1c2d27',padding:'28px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',alignContent:'start'});const title=document.createElement('h1');title.textContent='TIDEHOLD · BOSS HERALDRY';Object.assign(title.style,{gridColumn:'span 2',font:'22px Georgia',color:'#e4c78c',margin:'12px 0 28px'});gallery.append(title);for(const type of ['captain','chief','champion','blackknight','titan','dragonknight','dragon','conqueror','archdemon','demonlord']){const boss=a.game.spawnEnemy(type,0,0);boss.hp*=.64;a.ui.updateBoss(boss);const cell=document.createElement('div');cell.style.height='112px';cell.style.position='relative';const el=document.querySelector('#boss').cloneNode(true);Object.assign(el.style,{position:'relative',left:'0',top:'0',transform:'none',width:'320px'});cell.append(el);gallery.append(cell);}document.body.append(gallery);});await page.waitForTimeout(1000);await page.screenshot({path:'artifacts/usability/boss-heraldry.png'});assert.deepEqual(errors,[]);
}finally{await browser.close();}
