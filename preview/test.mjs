import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { io } from 'socket.io-client';
import { GameInstance } from '../server/game.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = process.env.TEST_PORT || '3102', url = `http://127.0.0.1:${port}`;
const artifacts = `${root}/.preview-artifacts`;
mkdirSync(artifacts, { recursive: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const event = (socket, name, pred = () => true) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { socket.off(name, fn); reject(new Error(`Timeout: ${name}`)); }, 20000);
  function fn(value) { if (pred(value)) { clearTimeout(timer); socket.off(name, fn); resolve(value); } }
  socket.on(name, fn);
});
const results = { checks: [], browserErrors: [], externalRequests: [], measurements: [] };
function pass(text) { results.checks.push(text); console.log(`PASS ${text}`); }
const server = spawn(process.execPath, ['preview/start.mjs'], { cwd: root, env: { ...process.env, PREVIEW_PORT: port, PREVIEW_TEST: '1', DATABASE_URL: 'postgres://invalid.test/DO_NOT_CONNECT', PUBLIC_URL: 'https://invalid.test', RENDER_EXTERNAL_URL: 'https://invalid.test' }, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = ''; server.stdout.on('data', b => logs += b); server.stderr.on('data', b => logs += b);
const sockets = []; let browser;
try {
  for (let i=0; i<100; i++) { try { if ((await fetch(`${url}/health`)).ok) break; } catch {} await delay(100); }
  assert.equal((await (await fetch(`${url}/health`)).json()).ok, true);
  assert.equal((await (await fetch(`${url}/api/info`)).json()).publicUrl, '');
  const html = await (await fetch(url)).text(); assert(html.includes('window.MIA_PREVIEW = true')); assert(!html.includes('fonts.googleapis.com'));
  assert(logs.includes('.preview-test-data')); assert(!logs.includes('[DB]'));
  pass('Isolated server: ignores production DB/public URL, local assets/fonts');
  const connect = async name => {
    const s = io(url, { transports: ['websocket'], reconnection: false }); sockets.push(s); await once(s, 'connect');
    const hello = await new Promise(resolve=>s.emit('hello', {name, look:{}}, resolve)); assert(hello.id); return {s,hello};
  };
  const a = await connect('미리보기갑'), b = await connect('미리보기을');
  const invite = event(b.s, 'party:invite'); a.s.emit('party:invite', b.hello.id); const inv = await invite;
  const partyEvent = event(b.s, 'party', p => p?.members?.length === 2);
  b.s.emit('party:respond', {partyId:inv.partyId,accept:true}); await partyEvent;
  const startA = event(a.s,'game:start'), startB = event(b.s,'game:start');
  a.s.emit('party:start',{scenario:'mia',chapter:0,fear:2}); const [sa,sb] = await Promise.all([startA,startB]);
  assert.equal(sa.chapter.title,'1장 · 달동네 골목');assert.equal(sb.chapter.id,0);
  const movement = event(b.s,'state', st=>st.players.some(p=>p.id===a.hello.id&&p.x===1.25&&p.anim===1));
  a.s.emit('move',{x:1.25,z:3,ry:0.5,anim:1});await movement;
  const signal=event(b.s,'voice:signal', m=>m.from===a.hello.id);a.s.emit('voice:signal',{to:b.hello.id,data:{hello:true}});await signal;
  pass('Two clients: party/start, position and animation sync, voice signaling relay');
  const sync = event(b.s,'game:sync', st=>st.objects?.poster?.done);
  a.s.emit('game:interact','poster');await sync;
  const reveal = event(a.s,'game:sync', st=>st.objects?.umbrella?.v);a.s.emit('game:interact','wall_mark');await reveal;
  const pickup = event(a.s,'inv', inv=>inv.includes('mia_relic_1'));a.s.emit('game:interact','umbrella');await pickup;
  const wrong = event(a.s,'lock:result', r=>!r.ok);a.s.emit('game:lock',{id:'shutter',answer:'0000'});await wrong;
  const solved = event(b.s,'game:sync', st=>st.objects?.shutter?.done);a.s.emit('game:lock',{id:'shutter',answer:'0505'});await solved;
  const nextA=event(a.s,'game:chapter'),nextB=event(b.s,'game:chapter');a.s.emit('game:interact','shop_door');
  const next=await Promise.all([nextA,nextB]);assert(next.every(s=>s.chapter.id===1));
  pass('Poster, flashlight reveal, relic pickup, wrong/correct lock and chapter transition sync');
  // Existing authoritative ghost AI exercised without altering chapter data.
  const players=new Map([['test',{id:'test',room:'inst:test',x:0,z:4,inv:['flashlight'],light:false}]]);
  const game=new GameInstance({id:'test',io:{to:()=>({emit(){}})},party:{members:['test']},players,chapter:1,fear:2,scenario:'mia'});
  game.flags.add('safe'); const ghost=game.ghosts[0];assert(ghost); const before=[ghost.x,ghost.z];
  game.tick(0.05); ghost.pauseUntil = 0;
  for(let i=0;i<50;i++)game.tick(0.05);
  assert(ghost.active); assert.notDeepEqual([ghost.x,ghost.z],before);
  pass('Existing ghost activation and movement (engine test; first chapter has no chase AI)');
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless:true, args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({viewport:{width:1100,height:760},deviceScaleFactor:0.5});
  await context.route('**/*', route=> {
    const u=new URL(route.request().url());
    if(['http:','https:'].includes(u.protocol)&&u.origin!==url) {results.externalRequests.push(u.origin);return route.abort();}return route.continue();
  });
  const p=await context.newPage();p.setDefaultTimeout(90000);
  p.on('pageerror',e=>results.browserErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')results.browserErrors.push(m.text())});
  await p.goto(`${url}/?debug`);
  await p.locator('#splash').click({force:true});await p.locator('#nick').fill('화면테스트');await p.locator('#enterBtn').click({force:true});
  await p.waitForFunction(()=>window.__dbg?.S.me,null,{timeout:90000});await p.locator('[data-start]').click({force:true});
  await p.waitForFunction(()=>window.__dbg?.S.chapter?.id===0,null,{timeout:90000});await p.locator('#storyClose').click({force:true});if(await p.evaluate(()=>__dbg.S.storyOpen)) await p.locator('#storyClose').click({force:true});await p.waitForFunction(()=>!__dbg.S.storyOpen);
  const snapshot=()=>p.evaluate(()=>({colliders:JSON.stringify(__dbg.S.world.colliders),objects:Object.keys(__dbg.S.world.objects),chapter:__dbg.S.chapter.title}));
  const initial=await snapshot();
  await p.locator('[data-quality]').selectOption('low');await p.waitForTimeout(1000);
  await p.evaluate(()=>document.activeElement?.blur());
  const pos=await p.evaluate(()=>({x:__dbg.me.x,z:__dbg.me.z}));
  await p.keyboard.down('KeyW');await p.waitForTimeout(1800);await p.keyboard.up('KeyW');
  const pos2=await p.evaluate(()=>({x:__dbg.me.x,z:__dbg.me.z}));assert(Math.hypot(pos2.x-pos.x,pos2.z-pos.z)>0.1);
  const cam1=await p.evaluate(()=>__dbg.cam.yaw);await p.keyboard.press('KeyR');await p.waitForTimeout(200);const cam2=await p.evaluate(()=>__dbg.cam.yaw);assert(Number.isFinite(cam1)&&Number.isFinite(cam2));
  assert(await p.evaluate(()=>Math.abs(__dbg.cam.yaw-(__dbg.me.ry+Math.PI))<0.01));
  await p.keyboard.press('KeyF');await p.waitForFunction(()=>__dbg.S.light);
  pass('Browser: first scene, keyboard movement, camera control, offline assets');
  for(const quality of ['low','medium','high']) {
    await p.locator('[data-quality]').selectOption(quality);await p.waitForTimeout(4500);
    const m=await p.evaluate(()=>({dpr:__dbg.renderer.getPixelRatio(),shadows:__dbg.renderer.shadowMap.enabled,metric:document.querySelector('[data-metrics]').textContent,geometries:__dbg.renderer.info.memory.geometries,textures:__dbg.renderer.info.memory.textures,renderer:__dbg.renderer.getContext().getParameter(__dbg.renderer.getContext().RENDERER)}));
    assert.equal(m.shadows,quality==='high');results.measurements.push({quality,...m});
    await p.screenshot({path:`${artifacts}/remaster-${quality}.png`});
  }
  const countMaterials=()=>p.evaluate(()=>{let n=0;__dbg.S.world.root.traverse(o=>{if(o.material?.normalMap)n++});return n});
  const allocated = await p.evaluate(()=>__dbg.renderer.info.memory.textures);
  assert(await countMaterials()>0);
  await p.locator('[data-compare]').click();assert.equal(await countMaterials(),0);assert.deepEqual(await snapshot(),initial);
  await p.screenshot({path:`${artifacts}/original.png`});
  for(let i=0;i<4;i++){await p.locator('[data-compare]').click();await p.locator('[data-compare]').click();}
  await p.locator('[data-compare]').click();assert.deepEqual(await snapshot(),initial);
  await p.locator('[data-effects]').fill('0');await p.locator('[data-effects]').dispatchEvent('input');
  assert.equal(await p.evaluate(()=>__dbg.renderer.info.memory.textures),allocated);
  const scope=await p.evaluate(async()=>{const {isRemasterChapter}=await import('/js/remaster-preview.js');return [isRemasterChapter('mia',{id:0}),isRemasterChapter('mia',{id:1}),isRemasterChapter('gwimun',{id:0})]});assert.deepEqual(scope,[true,false,false]);
  pass('Three quality levels, original/remaster toggle, unchanged colliders/object IDs, effects slider');
  // Complete first chapter in the actual client and verify remaster teardown.
  await p.evaluate(()=>{__dbg.socket.emit('game:lock',{id:'shutter',answer:'0505'})});
  await p.waitForFunction(()=>__dbg.S.objState.shutter.done);
  await p.evaluate(()=>__dbg.socket.emit('game:interact','shop_door'));
  await p.waitForFunction(()=>__dbg.S.chapter?.id===1,null,{timeout:90000});
  assert((await p.locator('[data-status]').textContent()).includes('원본'));
  assert.equal(await countMaterials(),0);
  pass('Browser: actual chapter progression restores original rendering in chapter two');
  assert.deepEqual(results.browserErrors,[]);assert.deepEqual(results.externalRequests,[]);
  pass('No browser JavaScript/console errors or external network asset requests');
} finally {
  for(const s of sockets)s.close();await browser?.close();server.kill('SIGTERM');
  writeFileSync(`${artifacts}/results.json`,JSON.stringify(results,null,2));
}
