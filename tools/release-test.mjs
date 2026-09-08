import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/colin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/dist/index.html?test');await page.locator('#new-kingdom').click();await page.locator('#new-game').click();await page.locator('[data-tab="army"]').click();await page.locator('[data-action="select-workers"]').click();await page.locator('[data-action="move"]').click();
 const dest=await page.evaluate(()=>window.__tidehold.renderer.worldToScreen(1450,1220));const canvas=await page.locator('#game').boundingBox();await page.mouse.click(canvas.x+dest.x,canvas.y+dest.y);assert.equal(await page.evaluate(()=>window.__tidehold.game.units.filter(u=>u.target).length),5);
 await page.locator('#game').focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.__tidehold.game.paused),true);
 await page.evaluate(()=>{const g=window.__tidehold.game;g.resources.gold=321;g.autosave();});await page.reload();await page.reload();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>window.__tidehold.game.resources.gold),321,'welcome must not overwrite an existing save');
 await page.evaluate(()=>{const g=window.__tidehold.game;g.paused=true;g.startWave();});await page.waitForTimeout(200);assert.equal(await page.locator('#next-wave').isDisabled(),true);
 const context=await browser.newContext({offline:true});const filePage=await context.newPage();filePage.on('pageerror',e=>errors.push(e.message));await filePage.goto(pathToFileURL(path.resolve('dist/index.html')).href);await filePage.locator('#new-kingdom').click();await filePage.locator('#new-game').click();await filePage.locator('[data-tab="build"]').click();assert.equal(await filePage.locator('#modal').isVisible(),false);assert.ok(await filePage.locator('#game').isVisible());assert.equal(await filePage.locator('[data-build="farm"]').count(),1);assert.deepEqual(errors,[]);
 await context.close();console.log('Release: group movement, keyboard pause, save preservation, wave state, and offline single-file launch passed.');
}finally{await browser.close();}
