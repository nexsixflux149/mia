import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='.preview-artifacts/detail-v2';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={errors:[],modes:[]};
try{
 const p=await browser.newPage({viewport:{width:900,height:700},deviceScaleFactor:.5});p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto((process.env.VISUAL_TEST_URL||'http://127.0.0.1:3104/')+'?debug');await p.waitForFunction(()=>!!window.__solo);await p.screenshot({path:dir+'/avatar.png'});await p.locator('#nick').fill('디테일');await p.locator('#enterBtn').click();await p.waitForFunction(()=>__dbg.S.chapter?.id===0);
 for(let i=0;i<5;i++){if(!await p.evaluate(()=>__dbg.S.storyOpen))break;await p.locator('#storyClose').click({force:true});await p.waitForTimeout(350);}
 await p.keyboard.press('KeyF');
 await p.locator('#soloGraphics summary').click();
 const snapshot=()=>p.evaluate(()=>{const g=__dbg.scene.children.find(o=>o.userData.visualUpgrade);const d=__dbg.S.world.root.getObjectByName('Detailed first chapter scenery');let calls=0,triangles=0;__dbg.S.world.root.traverseVisible(o=>{if(o.isMesh&&o.visible){calls++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)}});return {avatarEnhanced:g?.userData.visualUpgrade.enabled,sceneryEnabled:d?.visible,forestHidden:__dbg.S.world.root.children.filter(o=>o.userData.previewForest).every(o=>!o.visible),forestOriginals:__dbg.S.world.root.children.filter(o=>o.userData.previewForest).length,colliders:JSON.stringify(__dbg.S.world.colliders),calls,triangles,metric:document.querySelector('[data-metrics]').textContent,textureCount:__dbg.renderer.info.memory.textures};});
 for(const q of ['low','medium','high']){
  await p.locator('[data-quality]').selectOption(q);await p.waitForTimeout(2200);const state=await snapshot();assert.equal(state.avatarEnhanced,true);assert.equal(state.sceneryEnabled,true);assert.equal(state.forestHidden,true);assert(state.forestOriginals>0);report.modes.push({quality:q,...state});await p.screenshot({path:`${dir}/${q}.png`});assert.deepEqual(report.errors,[]);
 }
 const before=await snapshot();await p.locator('[data-compare]').click();await p.waitForTimeout(200);const original=await snapshot();assert.equal(original.avatarEnhanced,false);assert.equal(original.sceneryEnabled,false);assert.equal(original.forestHidden,false);assert.equal(original.colliders,before.colliders);report.original=original;await p.screenshot({path:dir+'/original.png'});
 await p.locator('[data-compare]').click();assert.equal((await snapshot()).avatarEnhanced,true);assert.deepEqual(report.errors,[]);
 console.log(JSON.stringify({checks:'All visual upgrade and original restoration assertions passed',modes:report.modes.map(({colliders,...m})=>m),original:(({colliders,...m})=>m)(report.original)}));
}finally{await browser.close();fs.writeFileSync(dir+'/results.json',JSON.stringify(report,null,2))}
