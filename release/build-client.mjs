import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'.remaster-client');fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'public'),out,{recursive:true});
fs.cpSync(path.join(root,'preview/mobile/fonts'),path.join(out,'fonts'),{recursive:true});
for(const name of ['visual-upgrade.js','horror-detail.js','ghost-preview.js'])fs.copyFileSync(path.join(root,'preview/mobile',name),path.join(out,'js',name));
fs.copyFileSync(path.join(root,'release/graphics-policy.js'),path.join(out,'js/graphics-policy.js'));
let html=fs.readFileSync(path.join(out,'index.html'),'utf8').replace(/<link[^>]+https:\/\/fonts\.googleapis\.com[^>]*>/g,'');
html=html.replace('<head>','<head><script>window.MIA_PREVIEW=true;window.MIA_FULL_REMASTER=true;</script><link rel="stylesheet" href="/fonts/fonts.css">');
fs.writeFileSync(path.join(out,'index.html'),html);
const edit=(file,transform)=>{const p=path.join(out,'js',file);fs.writeFileSync(p,transform(fs.readFileSync(p,'utf8')));};
edit('avatar.js',s=>"import { upgradeAvatar } from './visual-upgrade.js';\n"+s.replace('  return g;\n}\n\nfunction outfitColors','  upgradeAvatar(g, look);\n  return g;\n}\n\nfunction outfitColors'));
edit('world.js',s=>s.replace('  const g = buildProp(p);','  const g = buildProp(p); g.userData.propKind = p.t;').replace('    m.position.set(s.x, 0, s.z);','    m.userData.previewForest = true; m.userData.previewForestKind = kind;\n    m.position.set(s.x, 0, s.z);'));
edit('ghosts.js',s=>"import { upgradeGhost } from './horror-detail.js';\n"+s.replace('  g.userData = u;\n  return g;','  g.userData = u;\n  upgradeGhost(g, type);\n  return g;').replace('  for (const f of u.fog)','  if (u.horrorDetail?.enabled) u.light.intensity *= .28;\n  for (const f of u.fog)'));
edit('voice.js',s=>s.replace('window.MIA_PREVIEW ? [] :','(window.MIA_PREVIEW && !window.MIA_FULL_REMASTER) ? [] :'));
edit('fx.js',s=>s.replace("    this.quality = q;\n    // 휴대폰","    if (window.MIA_FULL_REMASTER) { this.quality=q;const pr=Math.min(devicePixelRatio||1,({low:.8,medium:1.15,high:1.5}[q]||1.15));this.r.setPixelRatio(pr);this.composer.setPixelRatio(pr);this.bloom.enabled=false;this.r.shadowMap.enabled=false;this.resize();return; }\n    this.quality = q;\n    // 휴대폰"));
edit('ghost-preview.js',s=>s.replace("from '/js/ghosts.js'","from './ghosts.js'").replace('첫 챕터에 추격 귀신을 추가하지는 않습니다.', '기존 AI와 판정은 유지합니다. 비교 중에도 게임은 진행됩니다.'));
edit('main.js',s=>s.replace('const socket = io();','await document.fonts.load(\'16px "Gowun Dodum"\').catch(() => []);\nconst socket = io();')
 .replace('if (pv.av) pv.scene.remove(pv.av);','if (pv.av) { pv.av.userData.visualUpgrade?.dispose(); pv.scene.remove(pv.av); }')
 .replace('function removeAvatar(g) { if (!g) return;','function removeAvatar(g) { if (!g) return; g.userData.visualUpgrade?.dispose();')
 .replace('pv.av = createAvatar(look);','pv.av = createAvatar(look); pv.av.userData.visualUpgrade?.setQuality(\'medium\');')
 .replace('  if (cinema.active)','  if (window.MIA_GHOST_PREVIEW) return;\n  if (cinema.active)')
 .replace("? 'medium' : 'high', brightness:", "? 'low' : 'medium', brightness:")
 .replace("[['high', '높음 (가장 선명)']", "[['low', '낮음 (저사양)'], ['high', '높음 (가장 선명)']")
 .replace('SET.quality = q.value; fx.setQuality(SET.quality);', 'SET.quality = q.value; if(remaster?.active){remaster.quality=q.value;remaster.refresh();} fx.setQuality(SET.quality);'));
edit('remaster-preview.js',s=>{
 s="import { upgradeWorld } from './visual-upgrade.js';\nimport { graphicsProfile } from './graphics-policy.js';\n"+s;
 s=s.replace("theme === 'mia' && chapter?.id === 0", "!!chapter");
 s=s.replace("this.quality = 'medium'", "this.quality = ['low','medium','high'].includes(this.settings.quality) ? this.settings.quality : 'medium'");
 s=s.replace('this.quality = e.target.value; this.refresh();', "this.quality = e.target.value; this.settings.quality=this.quality; try{localStorage.setItem('gwimun-settings',JSON.stringify(this.settings));}catch{} this.refresh();");
 s=s.replace('대상: 미아 1장 · 달동네 골목','전체 테마 · 그래픽 수정본').replace('MIA · 독립 그래픽 미리보기 (접기)','MIA · 전체 그래픽 수정본').replace('첫 챕터 플레이','미아 처음부터');
 s=s.replace('    this.world = world;', '    this.world = world; this.theme = theme; this.chapter = chapter; this.profile = graphicsProfile(theme, chapter);');
 s=s.replace('    this.pointLights =', '    this.detailWorld = upgradeWorld(world, chapter, theme);\n    this.pointLights =');
 s=s.replace('    this.moon.visible = this.active;', `    this.detailWorld?.setEnabled(this.active); this.detailWorld?.setQuality(this.quality);
    for(const object of this.scene.children) { object.userData.visualUpgrade?.setEnabled(this.active); object.userData.visualUpgrade?.setQuality(this.quality); object.userData.horrorDetail?.setEnabled(this.active); }
    this.moon.intensity = this.profile.moon; this.moon.color.set(this.profile.shadowColor);
    this.moon.visible = this.active;`);
 s=s.replace("this.scene.background = new THREE.Color('#080e16'); this.scene.fog = new THREE.FogExp2('#101b25', 0.038);", "this.scene.background = this.original.bg; this.scene.fog = this.original.fog?.clone() || null; if(this.scene.fog?.isFogExp2) this.scene.fog.density *= this.profile.fogMultiplier;");
 s=s.replace('this.renderer.toneMappingExposure = 1.55;', 'this.renderer.toneMappingExposure = this.profile.exposure;');
 s=s.replace('light.intensity = intensity * 0.68','light.intensity = intensity * this.profile.ambient').replace('light.intensity = intensity * 0.35','light.intensity = intensity * this.profile.directional');
 s=s.replace("light.color.set('#ffcf91'); light.intensity = intensity * 0.85;", "light.intensity = intensity * this.profile.pointScale;");
 s=s.replace("this.status(this.active ? '리마스터 · 미아 1장 · 달동네 골목' : '원본 비교 · 같은 씬·같은 진행 상태');", "this.status(this.active ? `수정본 · ${this.chapter.title}` : '원본 비교 · 같은 씬·같은 진행 상태');");
 s=s.replace('      // Restrained', '      this.detailWorld?.update(this.camera.position, this.scene.children.find(o=>o.userData.id===state.me)?.position);\n      // Restrained');
 s=s.replace('s.light.intensity = s.intensity * (0.82 + Math.sin(t * 1.4 + i) * 0.025 * this.effects);', "const ceiling=this.world.ceiling.find(c=>c.light===s.light); const base=ceiling?(state.dark?0:ceiling.base):s.intensity;\n        s.light.intensity = base * (1 + Math.sin(t * 1.4 + i) * 0.025 * this.effects);");
 s=s.replace('    this.world = null; this.active = false;', '    this.detailWorld?.dispose(); this.detailWorld = null;\n    this.world = null; this.active = false;');
 s=s.replace('    document.body.append(this.panel);', `    document.body.append(this.panel);
    this.panel.style.maxHeight='65vh'; this.panel.style.overflow='auto';
    if(matchMedia('(pointer: coarse)').matches){this.panel.style.left='auto';this.panel.style.right='8px';this.panel.style.top='52px';this.panel.style.bottom='auto';this.panel.querySelector('details').open=false;}
    this.panel.querySelector('[data-quality]').value=this.quality;
    const ghost=document.createElement('button');ghost.textContent='귀신 외형 비교';ghost.onclick=async()=>{const {openGhostPreview}=await import('./ghost-preview.js');openGhostPreview();};this.panel.querySelector('details').append(ghost);`);
 return s;
});
console.log('Full multiplayer client generated. All 11 themes remain in the original engine.');
