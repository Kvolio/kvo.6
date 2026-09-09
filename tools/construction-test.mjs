import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
await mkdir('artifacts/construction',{recursive:true});const results=[];
try{
  for(const spec of [{name:'desktop',width:1440,height:900,touch:false},{name:'small-phone',width:320,height:568,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
    const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:spec.touch,isMobile:spec.touch});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/?test');await page.locator('#new-kingdom').click();await page.locator('#new-game').click();await page.locator('#tutorial-skip').click();
    await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=true;g.keep.level=3;for(const r in g.resources)g.resources[r]=5000;for(const t of g.world.tiles)Object.assign(t,{type:'grass',resource:null,amount:0});g.revision++;a.renderer.terrain=null;a.renderer.camera={x:37*40,y:31*40,zoom:.8};a.input.begin('wall');a.ui.selection();a.ui.update();});
    const canvas=await page.locator('#game').boundingBox();
    const points=await page.evaluate(()=>[window.__tidehold.renderer.worldToScreen(35.5*40,29.5*40),window.__tidehold.renderer.worldToScreen(39.5*40,29.5*40)]);
    const [from,to]=points.map(p=>({x:p.x+canvas.x,y:p.y+canvas.y}));
    if(spec.touch){
      const cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.length),1,'touch drag stays a preview');
      await page.waitForTimeout(200);await page.screenshot({path:`artifacts/construction/${spec.name}-drag.png`});
      await page.locator('#confirm-build').click();
    }else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();}
    assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.length),6,'five connected wall sections');
    assert.equal(await page.evaluate(()=>window.__tidehold.renderer.preview.type),'wall');
    await page.evaluate(()=>{const a=window.__tidehold;a.input.begin('house');a.ui.selection();});
    if(spec.touch)await page.locator('#rotate-build').click();else{await page.locator('#game').focus();await page.keyboard.press('r');}
    assert.equal(await page.evaluate(()=>window.__tidehold.renderer.preview.rotation),1);
    await page.evaluate(()=>{const a=window.__tidehold;Object.assign(a.renderer.preview,{tx:36,ty:31});a.ui.update();});
    await page.locator('#confirm-build').click();
    assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.at(-1).rotation),1);
    assert.equal(await page.evaluate(()=>window.__tidehold.renderer.preview.type),'house','all buildings remain selected for repeated placement');
    await page.locator('#cancel-build').click();assert.equal(await page.evaluate(()=>window.__tidehold.renderer.preview),null);
    await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=false;for(let i=0;i<1500;i++)g.update(.1);g.paused=true;g.selected=[g.buildings.at(-1).id];a.ui.selection();});
    assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.every(b=>b.complete)),true,'automatic queued construction');
    if(!spec.touch){await page.locator('#game').focus();await page.keyboard.press('e');assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.at(-1).upgrade.kind),'building');}
    await page.evaluate(()=>{const a=window.__tidehold,g=a.game;const b=g.addBuilding('tower',39,32,true);g.selected=[b.id];a.ui.selection();});
    await page.locator('[data-action="range-upgrade"]').click();await page.waitForTimeout(200);
    assert.match(await page.locator('#tower-detail').innerText(),/damage/);assert.match(await page.locator('#upgrade-detail').innerText(),/Upgrading range/);
    await page.screenshot({path:`artifacts/construction/${spec.name}-inspector.png`});
    await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.selected=[];g.selectedTile=32*64+42;Object.assign(g.world.tiles[g.selectedTile],{resource:'wood',amount:36});a.ui.selection();});
    await page.locator('[data-action="clear"]').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.world.tiles[32*64+42].clearing),true);
    await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.addBuilding('smith',45,30,true);a.ui.openTab('army');a.ui.update();});
    await page.locator('[data-action="research"]').click();
    assert.equal(await page.locator('.tech-card').count(),9);
    assert.match(await page.locator('[data-research="siegecraft"]').innerText(),/Rangefinding/);
    await page.locator('[data-research="steel"]').click();
    assert.equal(await page.evaluate(()=>window.__tidehold.game.researchTask.id),'steel');
    assert.equal(await page.evaluate(()=>window.__tidehold.game.researched.length),0);
    await page.evaluate(()=>{const a=window.__tidehold,g=a.game;g.paused=false;for(let i=0;i<560;i++)g.update(.1);g.paused=true;a.ui.update();});
    assert.equal(await page.locator('[data-research="steel"]').getAttribute('aria-disabled'),'true');
    assert.match(await page.locator('[data-research="steel"]').innerText(),/Learned/);
    await page.screenshot({path:`artifacts/construction/${spec.name}-research.png`});
    await page.evaluate(()=>{const a=window.__tidehold;a.game.selected=[a.game.keep.id];a.ui.selection();a.ui.update();});
    const population=await page.evaluate(()=>window.__tidehold.game.units.length);
    await page.locator('[data-recruit="worker"]').click();
    assert.equal(await page.evaluate(()=>window.__tidehold.game.units.length),population);
    assert.match(await page.locator('#training-detail').innerText(),/Worker/);
    await page.locator('[data-cancel-training]').click();
    assert.equal(await page.evaluate(()=>window.__tidehold.game.queuedPopulation()),0);
    if(spec.touch){await page.setViewportSize({width:spec.height,height:spec.width});await page.waitForTimeout(200);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);results.push({...spec,passed:true,errors});console.log(`${spec.name}: construction passed`);await context.close();
  }
  await writeFile('artifacts/construction/results.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
