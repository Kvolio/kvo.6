import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
await mkdir('artifacts',{recursive:true});const results=[];
try{for(const spec of [{name:'desktop',width:1440,height:900,touch:false},{name:'phone-portrait',width:390,height:844,touch:true},{name:'phone-small',width:320,height:568,touch:true},{name:'phone-landscape',width:844,height:390,touch:true},{name:'tablet',width:1024,height:768,touch:true}]){
 const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:spec.touch,isMobile:spec.touch,deviceScaleFactor:spec.touch?2:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/?test');await page.screenshot({path:'artifacts/'+spec.name+'-title.png'});await page.locator('#new-kingdom').click();await page.locator('#new-game').click();await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow');assert.equal(await page.evaluate(()=>document.querySelector('#game').getBoundingClientRect().height>140),true,'playable canvas');
 await page.locator('[data-tab="build"]').click();await page.locator('[data-build="farm"]').click();const site=await page.evaluate(()=>{const app=window.__tidehold;app.game.paused=true;return app.renderer.worldToScreen(35.5*40,26.5*40);});const box=await page.locator('#game').boundingBox();
 if(spec.touch){await page.touchscreen.tap(box.x+site.x,box.y+site.y);assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.length),1,'touch must preview before placement');await page.locator('#confirm-build').click();}else await page.mouse.click(box.x+site.x,box.y+site.y);
 assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.length),2,'placement succeeds');
 await page.evaluate(()=>{const g=window.__tidehold.game;g.paused=false;for(let i=0;i<900;i++)g.update(.1);g.paused=true;});assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings[1].complete),true);assert.ok(await page.evaluate(()=>window.__tidehold.game.resources.food)>150);
 await page.locator('[data-tab="build"]').click();await page.waitForTimeout(200);await page.screenshot({path:`artifacts/${spec.name}.png`});
 await page.locator('#menu').click();await page.locator('#save').click();await page.locator('[data-close]').click();await page.reload();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.length),2,'save restored');
 if(spec.touch){const cdp=await context.newCDPSession(page);const cb=await page.locator('#game').boundingBox();const x=cb.x+cb.width*.6,y=cb.y+cb.height*.6;const before=await page.evaluate(()=>({...window.__tidehold.renderer.camera}));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:1},{x:x+25,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-45,y:y+20,id:1},{x:x+65,y:y+20,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const after=await page.evaluate(()=>({...window.__tidehold.renderer.camera}));assert.ok(after.zoom>before.zoom,'pinch zoom');assert.equal(await page.evaluate(()=>window.__tidehold.game.buildings.length),2,'gesture causes no extra placement');}
 else{const before=await page.evaluate(()=>window.__tidehold.renderer.camera.x);await page.locator('#game').focus();await page.keyboard.down('d');await page.waitForTimeout(180);await page.keyboard.up('d');assert.ok(await page.evaluate(()=>window.__tidehold.renderer.camera.x)>before,'WASD pan');}
 assert.deepEqual(errors,[]);results.push({...spec,passed:true,errors});await context.close();console.log(`${spec.name}: passed`);
 }
 await writeFile('artifacts/browser-results.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
