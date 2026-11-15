import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const base=path.join(path.resolve(process.argv[2]||'.mobile-site'),'dist');
const originalAvatar=fileURLToPath(new URL('../../public/js/avatar.js',import.meta.url));
const output=path.resolve('.preview-artifacts/typography-hair');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;const file=name==='/baseline-avatar.js'?originalAvatar:path.resolve(base,'.'+(name==='/'?'/index.html':name));if(file!==originalAvatar&&!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.png':'image/png','.ico':'image/x-icon'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(3106,'127.0.0.1',r));let browser;const results={checks:[],errors:[],external:[]};const pass=s=>{results.checks.push(s);console.log('PASS',s)};
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:.5});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.protocol.startsWith('http')&&u.hostname!=='127.0.0.1'){results.external.push(u.origin);return r.abort();}return r.continue();});
 const p=await context.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>results.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')results.errors.push(m.text())});
 await p.goto('http://127.0.0.1:3106/?debug');await p.waitForFunction(()=>!!window.__solo);
 const fonts=await p.evaluate(async()=>{const specs=['400 16px "Gowun Dodum"','400 24px "Nanum Myeongjo"','800 24px "Nanum Myeongjo"','400 24px "Nanum Pen Script"','400 24px "Gaegu"','700 24px "Gaegu"','400 24px "Do Hyeon"'];for(const s of specs)await document.fonts.load(s,'쪽지 보기');return specs.map(s=>({spec:s,loaded:document.fonts.check(s,'쪽지 보기')}));});assert(fonts.every(f=>f.loaded));results.fonts=fonts;pass('All seven original font faces load locally without Google/network dependencies');
 const styles=await p.evaluate(async()=>{
   const enhanced=await import('/js/avatar.js'), original=await import('/baseline-avatar.js');
   const snapshot=(g,look)=>{const out=[];g.userData.head.traverse(o=>{if(o.isMesh&&o.material?.color?.getHexString()===look.hairColor.slice(1).toLowerCase()){out.push({geometry:o.geometry.type,parameters:o.geometry.parameters,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),roughness:o.material.roughness,color:o.material.color.getHexString()});}});return out;};
   return ['short','bob','long','twintail','ponytail','bun','spiky','bowl','none'].map(hair=>{const look={...original.DEFAULT_LOOK,hair};const a=original.createAvatar(look),b=enhanced.createAvatar(look);const baseline=snapshot(a,look),upgraded=snapshot(b,look);b.userData.visualUpgrade.dispose();return {hair,equal:JSON.stringify(baseline)===JSON.stringify(upgraded),count:baseline.length};});
 });assert(styles.every(s=>s.equal));results.hair=styles;pass('All nine hair selections match original geometry, transforms and material roughness');
 await p.screenshot({path:output+'/avatar.png'});await p.locator('#nick').fill('글꼴확인');await p.locator('#enterBtn').tap();await p.waitForFunction(()=>__dbg.S.chapter?.id===0);
 for(let i=0;i<5&&await p.evaluate(()=>__dbg.S.storyOpen);i++){await p.locator('#storyClose').tap({force:true});await p.waitForTimeout(350);}
 await p.evaluate(()=>__solo.emit('game:interact','memo'));await p.waitForSelector('.doc-note .doc-p');await p.evaluate(()=>document.fonts.ready);
 const note=await p.locator('.doc-note .doc-p').first().evaluate(e=>({family:getComputedStyle(e).fontFamily,size:getComputedStyle(e).fontSize,lineHeight:getComputedStyle(e).lineHeight,text:e.textContent}));assert(note.family.startsWith('"Nanum Pen Script"'));assert.equal(note.size,'21px');note.text=(await p.locator('.doc-note .doc-p').allTextContents()).join('\n');assert(note.text.includes('자물쇠')&&note.text.includes('미아'));results.note=note;pass('Actual memo renders in original Nanum Pen Script with original mobile 21px sizing');
 await p.screenshot({path:output+'/note.png'});assert.deepEqual(results.errors,[]);assert.deepEqual(results.external,[]);pass('No browser errors or external requests');
}finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(output+'/results.json',JSON.stringify(results,null,2));}
