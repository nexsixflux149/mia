import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../server/scenarios.js';
import {GameInstance} from '../server/game.js';
const require=createRequire(new URL('../preview/package.json',import.meta.url));const {chromium}=require('playwright');const {io}=require('socket.io-client');
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'.preview-artifacts/full-release');fs.mkdirSync(out,{recursive:true});
const fixtures=Object.values(SCENARIOS).flatMap(s=>s.chapters.map((_,i)=>{const g=new GameInstance({id:'fixture',io:{to:()=>({emit(){}})},party:{members:[]},players:new Map(),chapter:i,scenario:s.id});return{theme:s.id,chapter:g.clientChapter(),dark:g.dark};}));
const ghostTypes=[...new Set(Object.values(SCENARIOS).flatMap(s=>s.chapters.flatMap(c=>[c.ghost,...(c.ghosts||[])].filter(Boolean).map(g=>g.type||'woman'))))];
const results={chapters:[],errors:[],functional:[],ghostTypes};let browser;const sockets=[];
const event=(s,name,pred=()=>true)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{s.off(name,fn);reject(Error('Timeout '+name))},20000);function fn(v){if(pred(v)){clearTimeout(timer);s.off(name,fn);resolve(v)}}s.on(name,fn)});
const qaHTML=`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/fonts/fonts.css"><script>window.MIA_PREVIEW=true;window.MIA_FULL_REMASTER=true</script><script type="importmap">{"imports":{"three":"/vendor/three/build/three.module.js","three/addons/":"/vendor/three/examples/jsm/"}}</script></head><body><canvas id="qa"></canvas><script type="module">
import * as T from 'three';import {buildChapter,disposeWorld} from '/js/world.js';import {FX} from '/js/fx.js';import {RemasterPreview} from '/js/remaster-preview.js';import {createAvatar,DEFAULT_LOOK} from '/js/avatar.js';import {createGhost,animateGhost} from '/js/ghosts.js';
window.__qa={done:false,chapters:[],errors:[]};
try{
await document.fonts.load('16px "Gowun Dodum"');const {fixtures,ghostTypes}=await(await fetch('/fixtures')).json();
const renderer=new T.WebGLRenderer({canvas:document.getElementById('qa'),antialias:false});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,250);const fx=new FX(renderer,scene,camera);const controller=new RemasterPreview({scene,camera,renderer,fx,settings:{quality:'low',brightness:1}});controller.quality='low';
const avatar=createAvatar(DEFAULT_LOOK);avatar.userData.id='qa';scene.add(avatar);let lastTheme='';
for(const fixture of fixtures){
 const {theme,chapter,dark}=fixture;const start=performance.now();const world=buildChapter(scene,chapter,theme);for(const c of world.ceiling)c.light.intensity=dark?0:c.base;
 avatar.position.set(chapter.spawn[0],0,chapter.spawn[1]);const saved=JSON.stringify(world.colliders);const ids=Object.keys(world.objects).sort().join('|');const originalFog=scene.fog?.color?.getHexString();
 controller.enter(world,chapter,theme);if(!controller.active)throw Error('Remaster inactive '+theme+':'+chapter.id);
 world.update?.(.1,.016); controller.update(.1,.016,{me:'qa',dark});if(dark&&world.ceiling.some(c=>c.light.intensity!==0))throw Error('Dark-state light regression '+theme+':'+chapter.id);
 if(saved!==JSON.stringify(world.colliders)||ids!==Object.keys(world.objects).sort().join('|'))throw Error('Collision/object identity changed');
 if(scene.fog?.color?.getHexString()!==originalFog)throw Error('Theme fog palette replaced');
 let surfaces=0;world.root.traverseVisible(o=>{if(o.isMesh&&o.geometry?.type==='PlaneGeometry'&&o.rotation.x< -1)surfaces++});
 if(theme==='mia'&&chapter.id===0){const pathMesh=world.root.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry'&&Math.abs(o.geometry.parameters.width-2.6)<.001);const ground=world.root.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.geometry.parameters.width>30);if(pathMesh.material.map.image===ground.material.map.image)throw Error('Road and ground share one texture');}
 const firstInTheme=theme!==lastTheme;const render=true;if(render){renderer.setPixelRatio(.2);camera.position.set(chapter.spawn[0]+2,4,chapter.spawn[1]+6);camera.lookAt(avatar.position.x,1,avatar.position.z);scene.updateMatrixWorld(true);fx.render(.1,{mode:'game'});lastTheme=theme;}
 controller.enabled=false;controller.refresh();if(saved!==JSON.stringify(world.colliders))throw Error('Baseline collider changed');controller.enabled=true;controller.refresh();
 controller.leave();disposeWorld(scene,world);
 const result={theme,id:chapter.id,title:chapter.title,surfaces,objects:Object.keys(world.objects).length,rendered:render,ms:Math.round(performance.now()-start)};window.__qa.chapters.push(result);if(firstInTheme)await window.reportTheme(theme);
 await new Promise(resolve=>setTimeout(resolve,0));
}
for(const type of ghostTypes){const g=createGhost(type);animateGhost(g,.016,1,{mode:'wander',lit:false},5);animateGhost(g,.016,1.1,{mode:'hunt',lit:false},3);let bad=false;g.traverse(o=>{if(![...o.position.toArray(),o.rotation.x,o.rotation.y,o.rotation.z].every(Number.isFinite))bad=true});if(bad)throw Error('Invalid ghost transforms '+type);g.userData.horrorDetail?.setEnabled(false);g.userData.horrorDetail?.setEnabled(true);}
window.__qa.ghostTypes=ghostTypes;window.__qa.done=true;
}catch(e){window.__qa.errors.push(e.stack||String(e));window.__qa.done=true}
</script></body></html>`;
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/qa'){res.setHeader('Content-Type','text/html');res.end(qaHTML);return}if(name==='/fixtures'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({fixtures,ghostTypes}));return}let file=name.startsWith('/vendor/three/')?path.join(root,'node_modules/three',name.slice('/vendor/three/'.length)):path.join(root,'.remaster-client',name);try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
await new Promise(resolve=>server.listen(3211,'127.0.0.1',resolve));
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:640,height:480},deviceScaleFactor:.5});page.on('pageerror',e=>results.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')results.errors.push(m.text())});await page.exposeFunction('reportTheme',theme=>console.log('SCENE',theme));
 await page.goto('http://127.0.0.1:3211/qa');await page.waitForFunction(()=>window.__qa?.done,null,{timeout:600000});const qa=await page.evaluate(()=>window.__qa);results.chapters=qa.chapters;results.errors.push(...qa.errors);assert.deepEqual(results.errors,[]);assert.equal(qa.chapters.length,fixtures.length);console.log('PASS all '+fixtures.length+' chapters construct, preserve colliders/palettes and restore original rendering');
 const base='http://127.0.0.1:3200';const connect=async name=>{const s=io(base,{transports:['websocket'],reconnection:false});sockets.push(s);await new Promise(r=>s.once('connect',r));const hello=await new Promise(r=>s.emit('hello',{name,look:{}},r));return{s,hello}};
 const a=await connect('수정본테스트갑'),b=await connect('수정본테스트을');const invite=event(b.s,'party:invite');a.s.emit('party:invite',b.hello.id);const inv=await invite;const party=event(b.s,'party',p=>p?.members.length===2);b.s.emit('party:respond',{partyId:inv.partyId,accept:true});await party;
 const sa=event(a.s,'game:start'),sb=event(b.s,'game:start');a.s.emit('party:start',{scenario:'mia',chapter:0,fear:2});await Promise.all([sa,sb]);results.functional.push('Two clients join/start the same instance');
 const move=event(b.s,'state',s=>s.players.some(p=>p.id===a.hello.id&&p.x===1.25&&p.anim));a.s.emit('move',{x:1.25,z:3,ry:0,anim:1});await move;results.functional.push('Position and animation sync');
 const reveal=event(a.s,'game:sync',s=>s.objects.umbrella.v);a.s.emit('game:interact','wall_mark');await reveal;const pickup=event(a.s,'inv',i=>i.includes('mia_relic_1'));a.s.emit('game:interact','umbrella');await pickup;results.functional.push('Flashlight clue and item acquisition');
 const wrong=event(a.s,'lock:result',r=>!r.ok);a.s.emit('game:lock',{id:'shutter',answer:'0000'});await wrong;const solved=event(b.s,'game:sync',s=>s.objects.shutter.done);a.s.emit('game:lock',{id:'shutter',answer:'0505'});await solved;results.functional.push('Wrong/correct lock answers synchronized');
 const next=event(b.s,'game:chapter');a.s.emit('game:interact','shop_door');assert.equal((await next).chapter.id,1);results.functional.push('Chapter advance in multiplayer');
 const signal=event(b.s,'voice:signal',m=>m.from===a.hello.id);a.s.emit('voice:signal',{to:b.hello.id,data:{hello:true}});await signal;results.functional.push('Original voice signaling relay');
 const p=await browser.newPage({viewport:{width:800,height:600},deviceScaleFactor:.5});p.on('pageerror',e=>results.errors.push(e.message));p.setDefaultTimeout(90000);await p.goto(base+'/?debug');await p.locator('#splash').click({force:true});await p.locator('#nick').fill('수정본화면');await p.locator('#enterBtn').click({force:true});await p.waitForFunction(()=>window.__dbg?.S.me);await p.locator('[data-start]').click({force:true});await p.waitForFunction(()=>__dbg.S.chapter?.id===0);for(let i=0;i<5&&await p.evaluate(()=>__dbg.S.storyOpen);i++){await p.locator('#storyClose').click({force:true});await p.waitForTimeout(350)}
 assert((await p.locator('[data-status]').textContent()).includes('수정본'));await p.locator('[data-quality]').selectOption('low');await p.evaluate(()=>document.activeElement?.blur());const position=await p.evaluate(()=>[__dbg.me.x,__dbg.me.z]);await p.keyboard.down('KeyW');await p.waitForTimeout(1500);await p.keyboard.up('KeyW');const after=await p.evaluate(()=>[__dbg.me.x,__dbg.me.z]);assert(Math.hypot(after[0]-position[0],after[1]-position[1])>.1);results.functional.push('Actual full client movement');
 await p.keyboard.press('KeyF');await p.waitForFunction(()=>__dbg.S.light);await p.screenshot({path:path.join(out,'full-client.png')});
 for(const q of ['medium','high','low'])await p.locator('[data-quality]').selectOption(q);await p.locator('[data-compare]').click();assert((await p.locator('[data-status]').textContent()).includes('원본'));await p.locator('[data-compare]').click();results.functional.push('Three presets and original comparison in actual full client');
 await p.locator('button').filter({hasText:'귀신 외형 비교'}).click();await p.waitForSelector('#ghostLookPreview');await p.locator('[data-ghost-compare]').click();await p.locator('[data-ghost-compare]').click();await p.screenshot({path:path.join(out,'ghost.png')});await p.locator('[data-ghost-close]').click();results.functional.push('Ghost appearance preview opens, compares and disposes');
 assert.deepEqual(results.errors,[]);console.log('PASS multiplayer and full-client functional checks');
}finally{for(const s of sockets)s.close();await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}
