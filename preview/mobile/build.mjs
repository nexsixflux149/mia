import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const site=path.resolve(process.argv[2]||path.join(root,'.mobile-site'));
const dist=path.join(site,'dist');fs.mkdirSync(dist,{recursive:true});
fs.cpSync(path.join(root,'public'),dist,{recursive:true});
const engine=path.join(dist,'engine');fs.mkdirSync(engine,{recursive:true});
for(const file of ['game.js','scenarios.js','items.js','progress.js','mia.js','chapters.js','ship.js','doll.js','hospital.js','camp.js','west.js','kimono.js','clown.js','park.js','zombie.js','park2.js'])fs.copyFileSync(path.join(root,'server',file),path.join(engine,file));
fs.cpSync(path.join(root,'preview/mobile/fonts'),path.join(dist,'fonts'),{recursive:true});
fs.mkdirSync(path.join(dist,'solo'),{recursive:true});for(const name of ['adapter.js','ui.css','visual-upgrade.js','horror-detail.js','ghost-preview.js'])fs.copyFileSync(path.join(root,'preview/mobile',name),path.join(dist,'solo',name));
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/<link[^>]+https:\/\/fonts\.googleapis\.com[^>]*>/g,'');
html=html.replace(/<title>.*?<\/title>/,'<title>MIA · 첫 챕터 모바일 1인 미리보기</title>').replace('</head>','<link rel="stylesheet" href="/fonts/fonts.css"><link rel="preload" href="/fonts/gowun-dodum-400.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/solo/ui.css"></head>');
html=html.replace('<script src="/socket.io/socket.io.js"></script>','').replace('<script type="module" src="/js/main.js"></script>','<script type="module" src="/solo/adapter.js"></script>');
html=html.replace('파티형 메타버스 공포 방탈출 · 캐릭터를 만들어 주세요','첫 챕터 1인 미리보기 · 멀티플레이·음성채팅 없음');
fs.writeFileSync(path.join(dist,'index.html'),html);
const mainPath=path.join(dist,'js/main.js');let main=fs.readFileSync(mainPath,'utf8');
main=main.replace("if (st.chapterIdx === 0 && !S.skipPrologue)","if (false)");
main=main.replace("async function loadShareInfo() {","async function loadShareInfo() { return;");
main=main.replace("'📢 욕설·비방·도배는 금지예요. 경고 5회면 채팅이 금지됩니다.'","'모바일 1인 미리보기입니다. 온라인 계정·랭킹은 사용하지 않습니다.'");
main=main.replace("'📢 모든 테마를 클리어하면 숨겨진 히든 테마가 오픈됩니다! (Lv.20 달성 시에도 열려요)'","'진행은 이 브라우저에만 저장되며, 출구에 도착하면 테스트가 완료됩니다.'");
// Bring the mobile inspection camera closer; drag and pinch controls remain the original ones.
main=main.replace('const CAM_START = 10;', 'const CAM_START = 6.5;');
// Cap original startup/character preview costs, then use the real low/medium/high preview settings.
main=main.replace('pv.renderer.setPixelRatio(Math.min(2, devicePixelRatio))','pv.renderer.setPixelRatio(Math.min(1, devicePixelRatio))');
main=main.replace("const SET = Object.assign(","const SET = Object.assign(");
fs.writeFileSync(mainPath,main);
const fxPath=path.join(dist,'js/fx.js');let fx=fs.readFileSync(fxPath,'utf8').replace("if (q === 'low') q = this.quality = 'medium';","if (window.MIA_SOLO) { this.bloom.enabled = false; const pr = Math.min(devicePixelRatio || 1, 0.8); this.r.setPixelRatio(pr); this.composer.setPixelRatio(pr); this.r.shadowMap.enabled = false; this.resize(); return; }\n    if (q === 'low') q = this.quality = 'medium';");fs.writeFileSync(fxPath,fx);
const remasterPath=path.join(dist,'js/remaster-preview.js');fs.writeFileSync(remasterPath,fs.readFileSync(remasterPath,'utf8').replace("this.quality = 'medium'","this.quality = 'low'").replace('value="low"','value="low" selected').replace('value="medium" selected','value="medium"'));
// Visual upgrades live only in the mobile build. Original shared game modules stay unchanged.
const avatarPath=path.join(dist,'js/avatar.js');
let avatar=fs.readFileSync(avatarPath,'utf8');
avatar="import { upgradeAvatar } from '/solo/visual-upgrade.js';\n"+avatar;
avatar=avatar.replace('  return g;\n}\n\nfunction outfitColors', '  upgradeAvatar(g, look);\n  return g;\n}\n\nfunction outfitColors');
fs.writeFileSync(avatarPath,avatar);
const worldPath=path.join(dist,'js/world.js');
let world=fs.readFileSync(worldPath,'utf8').replace('  const g = buildProp(p);','  const g = buildProp(p); g.userData.propKind = p.t;').replace('    m.position.set(s.x, 0, s.z);','    m.userData.previewForest = true;\n    m.position.set(s.x, 0, s.z);');
fs.writeFileSync(worldPath,world);
const ghostPath=path.join(dist,'js/ghosts.js');
let ghosts=fs.readFileSync(ghostPath,'utf8');
ghosts="import { upgradeGhost } from '/solo/horror-detail.js';\n"+ghosts;
ghosts=ghosts.replace('  g.userData = u;\n  return g;', '  g.userData = u;\n  upgradeGhost(g, type);\n  return g;');
ghosts=ghosts.replace('  for (const f of u.fog)', '  if (u.horrorDetail?.enabled) u.light.intensity *= .28;\n  for (const f of u.fog)');
fs.writeFileSync(ghostPath,ghosts);
let remaster=fs.readFileSync(remasterPath,'utf8');
remaster="import { upgradeWorld } from '/solo/visual-upgrade.js';\n"+remaster;
remaster=remaster.replace('    this.pointLights =', '    this.detailWorld = upgradeWorld(world, chapter);\n    this.pointLights =');
remaster=remaster.replace('    this.moon.visible = this.active;', `    this.detailWorld?.setEnabled(this.active); this.detailWorld?.setQuality(this.quality);
    for (const object of this.scene.children) { const detail = object.userData.visualUpgrade; if (detail) { detail.setEnabled(this.active); detail.setQuality(this.quality); } }
    this.moon.visible = this.active;`);
remaster=remaster.replace('    if (this.active) {\n      // Restrained', '    if (this.active) {\n      this.detailWorld?.update(this.camera.position, this.scene.children.find(o => o.userData.id === state.me)?.position);\n      // Restrained');
remaster=remaster.replace('    this.world = null; this.active = false;', '    this.detailWorld?.dispose(); this.detailWorld = null;\n    this.world = null; this.active = false;');
fs.writeFileSync(remasterPath,remaster);
main=fs.readFileSync(mainPath,'utf8').replace('  if (cinema.active)', '  if (window.MIA_GHOST_PREVIEW) return;\n  if (cinema.active)').replace('if (pv.av) pv.scene.remove(pv.av);', 'if (pv.av) { pv.av.userData.visualUpgrade?.dispose(); pv.scene.remove(pv.av); }').replace('function removeAvatar(g) { if (!g) return;', 'function removeAvatar(g) { if (!g) return; g.userData.visualUpgrade?.dispose();').replace('pv.av = createAvatar(look);','pv.av = createAvatar(look); pv.av.userData.visualUpgrade?.setQuality(\'high\');');
fs.writeFileSync(mainPath,main);
fs.writeFileSync(path.join(dist,'js/voice.js'),'export class Voice { constructor(){this.micOn=false;} setTargets(){} setVolume(){} async toggleMic(){return false;} }\n');
// Copy only the Three.js addon dependency graph used by the existing game.
const vendor=path.join(dist,'vendor/three');fs.mkdirSync(path.join(vendor,'build'),{recursive:true});fs.copyFileSync(path.join(root,'node_modules/three/build/three.module.js'),path.join(vendor,'build/three.module.js'));fs.copyFileSync(path.join(root,'node_modules/three/LICENSE'),path.join(vendor,'LICENSE'));
const seen=new Set();
function addon(relative){if(seen.has(relative))return;seen.add(relative);const src=path.join(root,'node_modules/three/examples/jsm',relative),dst=path.join(vendor,'examples/jsm',relative);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);const code=fs.readFileSync(src,'utf8');for(const m of code.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){if(m[1].startsWith('.'))addon(path.normalize(path.join(path.dirname(relative),m[1])));else if(m[1].startsWith('three/addons/'))addon(m[1].slice(13));}}
for(const directory of ['js','solo'])for(const file of fs.readdirSync(path.join(dist,directory))){if(!file.endsWith('.js'))continue;const code=fs.readFileSync(path.join(dist,directory,file),'utf8');for(const m of code.matchAll(/from\s*['"]three\/addons\/([^'"]+)['"]/g))addon(m[1]);}
fs.writeFileSync(path.join(site,'README.md'),'# MIA 모바일 1인 테스트\n\n운영 게임과 독립된 첫 챕터 테스트. 원래 GameInstance 엔진을 브라우저에서 실행합니다. 멀티플레이/음성채팅 없음. 원본 엔진·챕터 데이터를 복사하고 transport만 로컬 어댑터로 교체했습니다. 진행은 브라우저 localStorage, 종료는 실제 챕터 출구입니다.\n\n소스 원본: nexsixflux149/mia, preview/graphics-remaster-ch1. 실행 테스트 기록은 VALIDATION.md. 외부 에셋 없음, Three.js MIT 라이선스는 dist/vendor/three/LICENSE에 포함.\n');
fs.writeFileSync(path.join(site,'.gitignore'),'.deploy.tar.gz\n');
console.log(`Static mobile game built: ${dist} (${seen.size} Three.js addons)`);
