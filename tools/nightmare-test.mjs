import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/nightmare',{recursive:true});const results=[];
try{for(const spec of [{name:'desktop',width:1440,height:900,touch:false},{name:'phone',width:390,height:844,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:spec.touch,isMobile:spec.touch}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.goto('http://127.0.0.1:4173/?test');await page.locator('#new-kingdom').click();await page.locator('#difficulty').selectOption('nightmare');await page.locator('#new-game').click();
  await page.evaluate(async()=>{const {Game}=await import('/src/game.js'),a=window.__tidehold;a.setGame(new Game(707,'nightmare'));const g=a.game;g.paused=true;g.wave=50;g.active=true;g.spawnEnemy('conqueror',g.keep.x+150,g.keep.y).hp=0;g.clean();g.paused=false;g.update(.1);g.paused=true;a.ui.update();});
  assert.equal(await page.evaluate(()=>window.__tidehold.game.over),false);assert.equal(await page.evaluate(()=>window.__tidehold.game.sealBroken),true);
  await page.locator('#next-wave').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.wave),51);await page.waitForFunction(()=>document.querySelector('#wave').textContent.includes('51'));assert.match(await page.locator('#wave').innerText(),/51.*60/);
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;const p=g.portals.find(p=>p.queue.length);a.renderer.camera={x:p.x,y:p.y,zoom:1.2};g.updateNightmare(3);a.ui.update();});
  await page.waitForTimeout(200);await page.screenshot({path:`artifacts/nightmare/${spec.name}-portals.png`});
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.enemies=[];g.portals=[];g.hazards=[];g.wave=55;g.timer=10000;for(let y=35;y<48;y++)for(let x=40;x<60;x++)Object.assign(g.world.tile(x,y),{type:'grass',resource:null,amount:0});g.revision++;a.renderer.terrain=null;const e=g.spawnEnemy('archdemon',g.keep.x+280,g.keep.y+50);e.abilityStep=1;e.abilityClock=0;g.bossAbilities(e,.1,{x:g.keep.x+100,y:g.keep.y+120});g.selected=[e.id];a.renderer.camera={x:e.x-80,y:e.y+50,zoom:.9};a.ui.selection();a.ui.update();});
  assert.match(await page.locator('#enemy-details').innerText(),/Airborne/);assert.equal(await page.locator('#boss').innerText(),'The ArchDemon');
  await page.waitForTimeout(200);await page.screenshot({path:`artifacts/nightmare/${spec.name}-archdemon.png`});
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.updateNightmare(3);a.ui.update();});assert.equal(await page.evaluate(()=>window.__tidehold.game.isAirborne(window.__tidehold.game.enemies.find(e=>e.type==='archdemon'))),false);
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.enemies=[];g.hazards=[];g.wave=60;const e=g.spawnEnemy('demonlord',g.keep.x+300,g.keep.y+60);e.hp=e.maxHp*.49;g.bossAbilities(e,1,g.keep);g.selected=[e.id];a.ui.selection();a.ui.update();});
  assert.equal(await page.locator('#boss').innerText(),'The Demon Lord');await page.waitForTimeout(200);await page.screenshot({path:`artifacts/nightmare/${spec.name}-rebirth.png`});
  await page.locator('#menu').click();await page.locator('#save').click();await page.locator('[data-close]').click();await page.reload();await page.locator('#continue').click();
  assert.equal(await page.evaluate(()=>window.__tidehold.game.enemies.find(e=>e.type==='demonlord').phase),'healing');
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=true;const e=g.enemies.find(e=>e.type==='demonlord');for(let i=0;i<4;i++)g.bossAbilities(e,1,g.keep);e.abilityClock=0;e.abilityStep=1;g.bossAbilities(e,.1,g.keep);a.ui.update();});
  assert.equal(await page.evaluate(()=>window.__tidehold.game.enemies.find(e=>e.type==='demonlord').phase),2);assert.ok(await page.evaluate(()=>window.__tidehold.game.hazards.some(h=>h.kind==='eruption')));
  if(!spec.touch){
    const atlas=await page.evaluate(async()=>{const {ENEMIES,UNITS}=await import('/src/data.js'),a=window.__tidehold,types=[...Object.keys(UNITS),...Object.keys(ENEMIES)],canvas=document.createElement('canvas');canvas.width=1600;canvas.height=Math.ceil(types.length/8)*180;const c=canvas.getContext('2d');c.fillStyle='#25372e';c.fillRect(0,0,canvas.width,canvas.height);types.forEach((type,i)=>{const d=ENEMIES[type]||UNITS[type],x=i%8*200,y=Math.floor(i/8)*180;c.save();c.translate(x+100,y+85);const size=d.boss||d.scale?Math.min(.8,2/(d.scale||2.1)):1.7;c.scale(size,size);a.renderer.unit(c,{type,x:0,y:0,hp:1,maxHp:1,facing:-Math.PI/2},!!ENEMIES[type],4);c.restore();c.fillStyle='#e5d2a4';c.font='12px system-ui';c.textAlign='center';c.fillText(d.name.split(' · ')[0],x+100,y+157);});return canvas.toDataURL().split(',')[1];});
    await writeFile('artifacts/nightmare/unit-atlas.png',Buffer.from(atlas,'base64'));
  }
  await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.portals=[];g.hazards=[];for(const e of g.enemies)e.hp=0;g.paused=false;g.update(.1);a.ui.update();});
  assert.equal(await page.evaluate(()=>window.__tidehold.game.victory),true);
  if(spec.touch){await page.setViewportSize({width:spec.height,height:spec.width});await page.waitForTimeout(100);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);results.push({...spec,passed:true});console.log(`${spec.name}: Nightmare passed`);await context.close();
}await writeFile('artifacts/nightmare/results.json',JSON.stringify(results,null,2));}finally{await browser.close();}
