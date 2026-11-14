import * as THREE from 'three';

// 귀신 종류: woman(하얀 여자) · janitor(소사) · elder(이장, 꺾인 목) · mudang(거꾸로 기는 무당) · child
// 재질 · 지오메트리는 종류별로 한 번만 만들어 돌려 쓴다 (귀신이 나타났다 사라질 때마다 새로 만들지 않음)
const MC = new Map();
const keyOf = (o) => JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
const M = (c, o = {}) => { const k = c + keyOf(o); let m = MC.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...o }); MC.set(k, m); } return m; };
const PALE = () => M('#c9d1cd', { emissive: '#23303a', emissiveIntensity: 0.7 });
const HAIR = () => M('#040404', { roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide });
const GC = new Map();
const GG = (key, make) => { let g = GC.get(key); if (!g) { g = make(); GC.set(key, g); } return g; };
const r3 = (v) => Math.round(v * 1000) / 1000;

// 부드러운 원형 빛 (눈빛 · 안개)
let _glow = null, _fog = null;
function glowTex() { if (_glow) return _glow; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (_glow = new THREE.CanvasTexture(c)); }
function fogTexture() { if (_fog) return _fog; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (_fog = new THREE.CanvasTexture(c)); }

function eyes(parent, y, z, spread = 0.055, size = 0.024, color = '#ff2a1a') {
  const em = M(color, { emissive: color, emissiveIntensity: 3, roughness: 0.2 });
  const gm = GG('eyeglow' + color, () => new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.75 }));
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(GG('eye' + r3(size), () => new THREE.SphereGeometry(size, 17, 14)), em); e.position.set(spread * s, y, z); parent.add(e);
    // 동공 (눈동자 한가운데 검은 점) + 번지는 눈빛
    const pu = new THREE.Mesh(GG('pupil' + r3(size), () => new THREE.SphereGeometry(size * 0.38, 14, 10)), M('#000000')); pu.position.set(0, 0, size * 0.75); e.add(pu);
    const halo = new THREE.Sprite(gm); halo.scale.setScalar(size * 9); e.add(halo);
  }
}
// 끝이 가늘어지며 바깥으로 휘는 머리카락 한 가닥 (길이별로 지오메트리 공유)
function strandGeo(len) {
  return GG('strand' + r3(len), () => {
    const g = new THREE.PlaneGeometry(0.042, len, 1, 8); g.translate(0, -len / 2, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = -p.getY(i) / len; p.setX(i, p.getX(i) * (1 - t * 0.65)); p.setZ(i, t * t * 0.09 + Math.sin(t * 9) * 0.008); }
    g.computeVertexNormals(); return g;
  });
}
function hairStrands(parent, count, top, len, radius, y) {
  const strands = [];
  const geo = strandGeo(len);
  count = Math.round(count * 1.6); // 가늘고 촘촘하게
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const s = new THREE.Mesh(geo, HAIR());
    s.scale.y = 0.75 + Math.random() * 0.5; s.scale.x = 0.7 + Math.random() * 0.7;
    s.position.set(Math.sin(a) * radius, y + (Math.random() - 0.5) * 0.03, Math.cos(a) * radius);
    s.rotation.y = a; s.rotation.z = (Math.random() - 0.5) * 0.18;
    parent.add(s); strands.push(s);
  }
  return strands;
}
// 옷감: 위는 깨끗하고 아래로 갈수록 흙·핏물에 젖은 얼룩 (같은 그림을 모든 귀신이 함께 쓴다)
let _cloth = null;
function clothTex() {
  if (_cloth) return _cloth;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 24; i++) { const px = (i / 24) * 256; const g = x.createLinearGradient(px, 0, px + 10, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px, 0, 10, 256); }
  const dirt = x.createLinearGradient(0, 120, 0, 256); dirt.addColorStop(0, 'rgba(70,60,45,0)'); dirt.addColorStop(1, 'rgba(50,40,30,.75)'); x.fillStyle = dirt; x.fillRect(0, 120, 256, 136);
  for (let i = 0; i < 18; i++) { const px = Math.random() * 256, py = 80 + Math.random() * 140; x.fillStyle = `rgba(110,10,10,${0.25 + Math.random() * 0.35})`; x.beginPath(); x.ellipse(px, py, 3 + Math.random() * 12, 3 + Math.random() * 9, Math.random() * 3, 0, 7); x.fill(); x.fillRect(px - 1, py, 2, 10 + Math.random() * 40); }
  for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  _cloth = new THREE.CanvasTexture(c); _cloth.colorSpace = THREE.SRGBColorSpace; _cloth.wrapS = THREE.RepeatWrapping; return _cloth;
}
// 너덜너덜한 옷자락
function tatteredCone(r, h, color, opacity = 0.93) {
  const geo = new THREE.ConeGeometry(r, h, 28, 8, true);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const a = Math.atan2(p.getZ(i), p.getX(i)); if (y < -h / 2 + 0.01) p.setY(i, y + Math.random() * 0.3); else { p.setX(i, p.getX(i) * (1 + Math.sin(a * 9 + y * 4) * 0.05 + (Math.random() - 0.5) * 0.04)); p.setZ(i, p.getZ(i) * (1 + Math.sin(a * 9 + y * 4) * 0.05)); } }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, M(color, { map: clothTex(), transparent: true, opacity, side: THREE.DoubleSide, emissive: '#1a2028', emissiveIntensity: 0.5 }));
}
function limb(len, r, mat) { const g = new THREE.Group(); const m = new THREE.Mesh(GG(`limb${r3(len)},${r3(r)}`, () => new THREE.CylinderGeometry(r, r * 0.8, len, 12)), mat); m.position.y = -len / 2; g.add(m); g.userData.len = len; return g; }
// 길고 앙상한 손가락 (팔 끝에 붙인다)
function claws(arm, k = 1, mat = PALE()) {
  const len = arm.userData.len; const fg = GG('finger' + r3(k), () => new THREE.CylinderGeometry(0.009 * k, 0.004 * k, 0.15 * k, 7).translate(0, -0.075 * k, 0));
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(fg, mat); f.position.set((i - 1.5) * 0.018 * k, -len - 0.02 * k, 0.01 * k); f.rotation.z = (i - 1.5) * 0.18; f.rotation.x = -0.25 - (i % 2) * 0.12; arm.add(f); }
  const th = new THREE.Mesh(fg, mat); th.position.set(0.035 * k, -len + 0.01, 0.02 * k); th.rotation.z = 0.8; th.scale.y = 0.6; arm.add(th);
}

// ───── 얼굴 그림 (머리 구에 감싸는 텍스처: 가로 = 머리 둘레, 세로 = 정수리→턱. 얼굴 정면은 가로 1/4 지점)
const FACE = {
  woman: { skin: '#c4cdc9', style: 'pale' }, child: { skin: '#b8c2be', style: 'pale' }, mudang: { skin: '#c9d1cd', style: 'pale' }, crawler: { skin: '#c9d1cd', style: 'pale' }, headless: { skin: '#c4ccc8', style: 'pale' },
  janitor: { skin: '#b8c0b4', style: 'gaunt' }, father: { skin: '#c8c0b4', style: 'gaunt' }, elder: { skin: '#a8a090', style: 'old' }, sailor: { skin: '#8fa39a', style: 'bloated' },
  doll: { skin: '#f4ece4', style: 'porcelain' }, clown: { skin: '#f8f6f0', style: 'clown' }, ringmaster: { skin: '#c8b8a8', style: 'sallow' }, marionette: { skin: '#e8d4b8', style: 'wood' },
  scarecrow: { skin: '#c8b080', style: 'burlap' }, zombie: { skin: '#8a9a74', style: 'gaunt' }, nurse: { skin: '#efe6d4', style: 'gauze' }, dalgyal: { skin: '#f6f4ee', style: 'egg' }, slender: { skin: '#f4f4f2', style: 'egg' },
};
const FT = new Map();
function faceTex(type) {
  const f = FACE[type]; if (!f) return null;
  if (FT.has(type)) return FT.get(type);
  const W = 512, H = 256, cx = 128, ey = 124, my = 170;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const R = (() => { let s = type.length * 977; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  x.fillStyle = f.skin; x.fillRect(0, 0, W, H);
  // 피부 얼룩 · 모공
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${R() > 0.5 ? '255,255,255' : '40,30,40'},${R() * 0.05})`; x.fillRect(R() * W, R() * H, 2, 2); }
  const blot = (bx, by, r, col) => { const g = x.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(bx - r, by - r, r * 2, r * 2); };
  const vein = (sx, sy, n, col, len = 18) => { x.strokeStyle = col; x.lineWidth = 1.2; for (let k = 0; k < n; k++) { let px = sx, py = sy; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (R() - 0.5) * len; py += (R() - 0.3) * len * 0.8; x.lineTo(px, py); } x.stroke(); } };
  const sockets = (r = 24, col = 'rgba(0,0,0,.85)') => { for (const s of [-1, 1]) blot(cx + s * 24, ey, r, col); };
  const streak = (sx, sy, len, col, w = 3) => { const g = x.createLinearGradient(0, sy, 0, sy + len); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(sx - w / 2, sy); x.quadraticCurveTo(sx + 3, sy + len * 0.5, sx, sy + len); x.lineTo(sx + w / 2, sy); x.fill(); };
  switch (f.style) {
    case 'pale':
      blot(cx, ey + 10, 70, 'rgba(60,80,90,.25)'); sockets(26, 'rgba(10,8,14,.92)');
      for (const s of [-1, 1]) { vein(cx + s * 52, ey - 20, 4, 'rgba(70,40,90,.45)'); streak(cx + s * 24, ey + 12, 70, 'rgba(90,0,0,.85)', 4); }
      blot(cx, my, 22, 'rgba(20,0,0,.6)'); x.strokeStyle = 'rgba(90,20,30,.8)'; x.lineWidth = 2; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(cx + i * 5, my - 9); x.lineTo(cx + i * 5 + 1, my - 3); x.stroke(); }
      streak(cx + 6, my + 8, 55, 'rgba(70,0,0,.8)', 5); break;
    case 'gaunt':
      sockets(28, 'rgba(0,0,0,.9)'); for (const s of [-1, 1]) { blot(cx + s * 40, ey + 34, 26, 'rgba(30,30,20,.45)'); } blot(cx, my + 20, 30, 'rgba(30,30,20,.35)');
      x.strokeStyle = 'rgba(30,10,10,.85)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 30, my); x.lineTo(cx + 30, my); x.stroke(); for (let i = -4; i <= 4; i++) { x.beginPath(); x.moveTo(cx + i * 7, my - 6); x.lineTo(cx + i * 7 + 2, my + 7); x.stroke(); }
      for (let i = 0; i < 300; i++) { x.fillStyle = 'rgba(30,30,30,.35)'; x.fillRect(cx - 40 + R() * 80, my + 6 + R() * 40, 1, 2); } break;
    case 'old':
      sockets(22, 'rgba(20,10,5,.8)'); x.strokeStyle = 'rgba(60,40,25,.55)'; x.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(cx - 50, ey - 40 - i * 7); x.quadraticCurveTo(cx, ey - 46 - i * 7, cx + 50, ey - 40 - i * 7); x.stroke(); }
      for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + s * 44, ey - 6 + i * 6); x.lineTo(cx + s * 60, ey - 10 + i * 9); x.stroke(); } x.beginPath(); x.moveTo(cx + s * 16, ey + 30); x.quadraticCurveTo(cx + s * 26, my - 4, cx + s * 22, my + 12); x.stroke(); }
      for (let i = 0; i < 16; i++) blot(R() * W, R() * H, 4 + R() * 6, 'rgba(90,60,30,.4)'); break;
    case 'bloated':
      for (let i = 0; i < 30; i++) blot(R() * W, R() * H, 8 + R() * 22, `rgba(${30 + R() * 30},${60 + R() * 40},${40 + R() * 30},.35)`);
      sockets(30, 'rgba(0,10,10,.85)'); for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(200,210,190,.6)'; x.beginPath(); x.arc(R() * W, R() * H, 1.5 + R() * 3, 0, 7); x.fill(); }
      for (const s of [-1, 1]) vein(cx + s * 40, ey + 20, 5, 'rgba(20,60,50,.6)', 22); x.strokeStyle = 'rgba(40,70,40,.8)'; x.lineWidth = 4; for (let i = 0; i < 6; i++) { x.beginPath(); const px = R() * W; x.moveTo(px, 0); x.bezierCurveTo(px + 10, 50, px - 10, 90, px + 4, 120); x.stroke(); } break;
    case 'porcelain':
      blot(cx - 40, my - 14, 18, 'rgba(255,120,140,.5)'); blot(cx + 40, my - 14, 18, 'rgba(255,120,140,.5)');
      x.strokeStyle = '#2a1a1a'; x.lineWidth = 2; for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(cx + s * (12 + i * 5), ey - 16); x.lineTo(cx + s * (10 + i * 7), ey - 26 - (i % 2) * 4); x.stroke(); }
      x.strokeStyle = 'rgba(40,20,20,.9)'; x.lineWidth = 1.6; for (let k = 0; k < 7; k++) { let px = cx - 20 + R() * 40, py = 40 + R() * 30; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 7; j++) { px += (R() - 0.5) * 22; py += 6 + R() * 14; x.lineTo(px, py); if (R() < 0.3) { x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 16, py + 8); x.moveTo(px, py); } } x.stroke(); }
      x.fillStyle = 'rgba(20,10,10,.85)'; x.beginPath(); x.moveTo(cx + 30, ey - 50); x.lineTo(cx + 52, ey - 30); x.lineTo(cx + 36, ey - 14); x.closePath(); x.fill(); break;
    case 'clown':
      for (const s of [-1, 1]) { x.fillStyle = '#1a2a6a'; x.beginPath(); x.moveTo(cx + s * 24, ey - 34); x.lineTo(cx + s * 34, ey); x.lineTo(cx + s * 24, ey + 40); x.lineTo(cx + s * 14, ey); x.closePath(); x.fill(); streak(cx + s * 24, ey + 30, 50, 'rgba(20,30,90,.7)', 5); }
      x.fillStyle = 'rgba(180,10,20,.85)'; x.beginPath(); x.moveTo(cx - 52, my - 16); x.quadraticCurveTo(cx, my + 34, cx + 52, my - 16); x.quadraticCurveTo(cx, my + 8, cx - 52, my - 16); x.fill();
      x.strokeStyle = 'rgba(160,0,10,.6)'; x.lineWidth = 3; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 52, my - 16); x.lineTo(cx + s * 70, my - 30); x.stroke(); }
      x.strokeStyle = 'rgba(120,110,100,.5)'; x.lineWidth = 1; for (let k = 0; k < 40; k++) { const px = R() * 256, py = R() * H; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 14, py + (R() - 0.5) * 14); x.stroke(); } break;
    case 'sallow':
      for (const s of [-1, 1]) { blot(cx + s * 24, ey + 10, 22, 'rgba(60,20,40,.55)'); } blot(cx, ey - 50, 50, 'rgba(90,70,50,.25)');
      x.strokeStyle = 'rgba(40,20,20,.7)'; x.lineWidth = 1.5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 14, ey + 30); x.quadraticCurveTo(cx + s * 30, my - 6, cx + s * 34, my + 10); x.stroke(); }
      x.strokeStyle = '#3a0a10'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx - 28, my + 4); x.quadraticCurveTo(cx, my + 14, cx + 28, my + 4); x.stroke(); break;
    case 'wood':
      x.strokeStyle = 'rgba(120,80,40,.35)'; x.lineWidth = 1.4; for (let i = 0; i < 40; i++) { x.beginPath(); const py = i * 7; x.moveTo(0, py); x.bezierCurveTo(130, py + 6, 260, py - 6, 512, py + 2); x.stroke(); }
      blot(cx - 40, my - 10, 18, 'rgba(230,80,100,.55)'); blot(cx + 40, my - 10, 18, 'rgba(230,80,100,.55)');
      for (const s of [-1, 1]) { x.strokeStyle = '#2a1a10'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + s * 12, ey - 22); x.quadraticCurveTo(cx + s * 24, ey - 30, cx + s * 36, ey - 22); x.stroke(); }
      x.strokeStyle = '#2a1a10'; x.lineWidth = 2.4; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 20, my - 4); x.lineTo(cx + s * 22, my + 42); x.stroke(); } x.beginPath(); x.moveTo(cx + 10, 40); x.lineTo(cx + 18, 70); x.lineTo(cx + 8, 96); x.stroke(); break;
    case 'burlap':
      x.strokeStyle = 'rgba(90,70,40,.45)'; x.lineWidth = 1; for (let i = 0; i < W; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let j = 0; j < H; j += 4) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
      blot(cx, ey, 60, 'rgba(40,30,10,.3)'); x.strokeStyle = '#1a1008'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 44, my); x.quadraticCurveTo(cx, my + 22, cx + 44, my); x.stroke(); for (let i = -5; i <= 5; i++) { x.beginPath(); x.moveTo(cx + i * 8, my + 8 - Math.abs(i) * 1.3); x.lineTo(cx + i * 8, my - 6 - Math.abs(i) * 1.3); x.stroke(); }
      x.fillStyle = 'rgba(100,20,10,.5)'; x.beginPath(); x.ellipse(cx + 30, my + 30, 12, 20, 0.4, 0, 7); x.fill(); break;
    case 'gauze':
      x.strokeStyle = 'rgba(150,140,120,.5)'; x.lineWidth = 2; for (let j = 0; j < H; j += 9) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j + 6); x.stroke(); } for (let i = 0; i < 1200; i++) { x.fillStyle = 'rgba(120,110,90,.15)'; x.fillRect(R() * W, R() * H, 2, 1); }
      for (let i = 0; i < 6; i++) blot(cx - 60 + R() * 120, ey - 20 + R() * 80, 10 + R() * 18, 'rgba(130,10,10,.7)'); for (const s of [-1, 1]) blot(cx + s * 24, ey, 14, 'rgba(60,0,0,.85)'); streak(cx - 24, ey + 10, 60, 'rgba(110,0,0,.8)', 4); break;
    case 'egg':
      blot(cx, ey - 20, 80, 'rgba(255,255,255,.35)'); blot(cx, my + 10, 60, 'rgba(120,120,110,.18)');
      if (type === 'slender') { for (const s of [-1, 1]) blot(cx + s * 24, ey, 16, 'rgba(60,60,70,.12)'); } break;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  FT.set(type, t); return t;
}
// 머리 구(첫 번째 자식)를 얼굴 그림이 입혀진 부드러운 구로 바꾼다
function dressFace(type, head) {
  const tex = faceTex(type); if (!tex || !head) return;
  const m = head.children.find((c) => c.isMesh && c.geometry?.type === 'SphereGeometry'); if (!m) return;
  const p = m.geometry.parameters; if (p.phiLength < 6) return;
  m.geometry = GG('face' + r3(p.radius), () => new THREE.SphereGeometry(p.radius, 32, 22));
  const emi = { doll: '#2a2624', clown: '#3a3836' }[type] || (FACE[type].style === 'egg' ? '#3a3a38' : '#2a343a');
  m.material = M('#ffffff', { map: tex, emissive: emi, emissiveMap: tex, emissiveIntensity: type === 'doll' ? 0.6 : 0.85, roughness: FACE[type].style === 'porcelain' ? 0.22 : 0.75 });
}

export function createGhost(type = 'woman') {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const u = { type, body, parts: {}, t0: Math.random() * 10 };
  const P = u.parts;
  if (type === 'woman' || type === 'child') {
    const k = type === 'child' ? 0.55 : 1;
    const dress = tatteredCone(0.42 * k, 1.7 * k, '#d9ddd8'); dress.position.y = 0.95 * k; body.add(dress);
    const head = new THREE.Group(); head.position.y = 1.92 * k; body.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.17 * k, 27, 20), PALE()));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.19 * k, 27, 20, 0, Math.PI * 2, 0, Math.PI * 0.6), HAIR()); head.add(cap);
    P.strands = hairStrands(head, 26, 0, 1.2 * k, 0.17 * k, 0.05);
    // 얼굴을 가린 앞머리 사이 눈
    eyes(head, 0, 0.17 * k, 0.05 * k, 0.02 * k);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.04 * k, 17, 14), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1, 1.8, 0.4); mouth.position.set(0, -0.09 * k, 0.16 * k); head.add(mouth); P.mouth = mouth;
    P.arms = [-1, 1].map((s) => { const a = limb(0.85 * k, 0.03 * k, PALE()); a.position.set(0.3 * s * k, 1.62 * k, 0.05); body.add(a); const f = new THREE.Mesh(new THREE.SphereGeometry(0.04 * k, 10, 7), PALE()); f.position.y = -0.85 * k; a.add(f); return a; });
  } else if (type === 'janitor') {
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 1.4, 20), M('#3e4a32')); coat.position.y = 1.15; body.add(coat);
    P.legs = [-1, 1].map((s) => { const l = limb(0.6, 0.08, M('#2e3826')); l.position.set(0.14 * s, 0.6, 0); body.add(l); return l; });
    const head = new THREE.Group(); head.position.y = 2.08; body.add(head); P.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 17), PALE()); skull.scale.y = 1.2; head.add(skull);
    const capM = M('#2e3826'); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.1, 24), capM); cap.position.y = 0.17; head.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.16), capM); brim.position.set(0, 0.13, 0.2); head.add(brim);
    // 텅 빈 눈구멍 + 찢어진 입
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshBasicMaterial({ color: '#000' })); h.position.set(0.07 * s, 0.02, 0.18); head.add(h); }
    eyes(head, 0.02, 0.2, 0.07, 0.012);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.position.set(0, -0.12, 0.19); head.add(mouth); P.mouth = mouth;
    P.arms = [-1, 1].map((s) => { const a = limb(0.95, 0.06, M('#3e4a32')); a.position.set(0.36 * s, 1.75, 0); body.add(a); return a; });
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.25, 17), M('#6a6e72', { metalness: 0.5 })); bucket.position.y = -1.05; P.arms[1].add(bucket);
    const lamp = new THREE.PointLight('#ffb35c', 1.5, 3, 2); lamp.position.y = -1.1; P.arms[0].add(lamp);
  } else if (type === 'elder') {
    const robe = tatteredCone(0.45, 1.6, '#cfc9b8', 0.97); robe.position.y = 0.85; body.add(robe);
    const neck = new THREE.Group(); neck.position.y = 1.7; body.add(neck); P.neck = neck;
    const head = new THREE.Group(); head.position.set(0, 0.12, 0); neck.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 17), M('#a8a090', { emissive: '#201810', emissiveIntensity: 0.6 })));
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.015, 28), M('#0b0b0d', { transparent: true, opacity: 0.85 })); brim.position.y = 0.1; head.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.24, 27), M('#0b0b0d', { transparent: true, opacity: 0.9 })); crown.position.y = 0.22; head.add(crown);
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 8), M('#e6e2d8')); beard.rotation.x = Math.PI; beard.position.set(0, -0.22, 0.1); head.add(beard);
    eyes(head, 0.02, 0.155, 0.055, 0.022);
    P.arms = [-1, 1].map((s) => { const a = limb(0.7, 0.07, M('#cfc9b8')); a.position.set(0.36 * s, 1.55, 0); body.add(a); return a; });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 10), M('#2a1a10')); pipe.rotation.x = Math.PI / 2.4; pipe.position.set(0, -0.7, 0.3); P.arms[0].add(pipe);
    const ember = new THREE.PointLight('#ff4422', 1.2, 2.5, 2); ember.position.set(0, -0.6, 0.65); P.arms[0].add(ember); P.ember = ember;
  } else if (type === 'mudang') {
    // 네 발로 거꾸로 기는 무당: 몸통은 위를 향하고 고개는 뒤집혀 있다
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 10, 20), M('#b0262d', { emissive: '#300', emissiveIntensity: 0.4 })); torso.rotation.x = Math.PI / 2; torso.position.y = 0.75; body.add(torso);
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.04, 10, 26), M('#2f5fd0')); sash.position.set(0, 0.75, 0.1); body.add(sash);
    const neck = new THREE.Group(); neck.position.set(0, 0.85, 0.45); body.add(neck); P.neck = neck;
    const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 14), PALE()); nk.rotation.x = -0.9; nk.position.set(0, 0.2, 0.18); neck.add(nk);
    const head = new THREE.Group(); head.position.set(0, 0.38, 0.4); head.rotation.z = Math.PI; neck.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 17), PALE()));
    P.strands = hairStrands(head, 20, 0, 0.9, 0.15, 0.06);
    eyes(head, 0, 0.15, 0.05, 0.026);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 17, 14), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1.4, 0.8, 0.4); mouth.position.set(0, 0.08, 0.14); head.add(mouth); P.mouth = mouth;
    P.limbs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const up = limb(0.55, 0.035, PALE()); up.position.set(0.2 * sx, 0.8, 0.3 * sz); up.rotation.z = -1.2 * sx; body.add(up);
      const low = limb(0.6, 0.03, PALE()); low.position.y = -0.55; low.rotation.z = 2.1 * sx; up.add(low);
      return { up, low, sx, sz };
    });
    const bells = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), M('#d4b25a', { metalness: 0.9 })); bells.position.y = -0.6; P.limbs[0].low.add(bells);
  }
  if (type === 'sailor') {
    // 물에 불은 선장: 젖은 코트, 선장 모자, 해초, 퉁퉁 부은 얼굴
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 1.45, 20), M('#1c2a3e', { roughness: 0.4 })); coat.position.y = 1.1; body.add(coat);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 7), M('#c9a24a', { metalness: 0.8 })); b.position.set(0.08 * (i % 2 ? 1 : -1), 1.55 - Math.floor(i / 2) * 0.22, 0.37); body.add(b); }
    P.legs = [-1, 1].map((s) => { const l = limb(0.5, 0.09, M('#141c28')); l.position.set(0.15 * s, 0.5, 0); body.add(l); return l; });
    const head = new THREE.Group(); head.position.y = 2.0; body.add(head); P.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 17), M('#8fa39a', { emissive: '#1a2a2a', emissiveIntensity: 0.6, roughness: 0.3 })); skull.scale.set(1.15, 1.05, 1); head.add(skull);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.12, 27), M('#141c28')); cap.position.y = 0.2; head.add(cap);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.06, 27), M('#f2ede0')); top.position.y = 0.28; head.add(top);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.14), M('#0a0a0a')); brim.position.set(0, 0.16, 0.24); head.add(brim);
    for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshBasicMaterial({ color: '#000' })); h.position.set(0.08 * sx, 0.03, 0.2); head.add(h); }
    eyes(head, 0.03, 0.23, 0.08, 0.014);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1.4, 0.8, 0.4); mouth.position.set(0, -0.11, 0.2); head.add(mouth); P.mouth = mouth;
    P.strands = hairStrands(head, 10, 0, 0.8, 0.22, 0.05); P.strands.forEach((st) => (st.material = M('#2f4a2a', { roughness: 1, side: THREE.DoubleSide })));
    P.arms = [-1, 1].map((s) => { const a = limb(0.9, 0.07, M('#1c2a3e')); a.position.set(0.4 * s, 1.75, 0); body.add(a); const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), M('#8fa39a')); h.position.y = -0.92; a.add(h); return a; });
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), M('#e8c170', { metalness: 0.9, emissive: '#553', emissiveIntensity: 0.6 })); watch.position.y = -0.95; P.arms[0].add(watch);
    u.drip = [];
    for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 7, 5), new THREE.MeshBasicMaterial({ color: '#6a8aaa' })); d.position.set((Math.random() - 0.5) * 0.7, Math.random() * 2, (Math.random() - 0.5) * 0.7); g.add(d); u.drip.push(d); }
  } else if (type === 'doll') {
    // 사람만 한 도자기 인형: 금 간 얼굴, 유리 눈, 관절 인형 몸
    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.25, 20, 1, true), M('#9ab7d8', { side: THREE.DoubleSide })); dress.position.y = 0.95; body.add(dress);
    const frill = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 10, 38), M('#f4f1ea')); frill.rotation.x = Math.PI / 2; frill.position.y = 0.35; body.add(frill);
    const head = new THREE.Group(); head.position.y = 1.95; body.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 34, 27), M('#f4ece4', { roughness: 0.15 })));
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.4, 31, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), M('#e8c170')); hair.position.y = 0.03; hair.rotation.x = -0.25; head.add(hair);
    for (const sx of [-1, 1]) { const curl = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 7, 14), M('#e8c170')); curl.position.set(0.36 * sx, -0.2, -0.05); head.add(curl); }
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), M('#1a3a6a', { roughness: 0.02, metalness: 0.2 })); e.position.set(0.13 * sx, 0.03, 0.31); head.add(e); const hl = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 7), new THREE.MeshBasicMaterial({ color: '#fff' })); hl.position.set(0.02, 0.03, 0.06); e.add(hl); }
    const lips = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), M('#c0262d')); lips.scale.set(1.2, 0.6, 0.4); lips.position.set(0, -0.14, 0.33); head.add(lips); P.mouth = lips;
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.18 + Math.random() * 0.12, 0.01), new THREE.MeshBasicMaterial({ color: '#2a1a1a' })); c.position.set(-0.05 + i * 0.05, 0.05 - i * 0.04, 0.34); c.rotation.z = (Math.random() - 0.5) * 1.2; head.add(c); }
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), M('#7ab0e8')); bow.scale.set(1.8, 0.8, 0.6); bow.position.set(0, 0.32, -0.05); head.add(bow);
    P.arms = [-1, 1].map((s) => { const a = limb(0.75, 0.06, M('#f4ece4', { roughness: 0.15 })); a.position.set(0.35 * s, 1.55, 0); body.add(a); const j = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), M('#e8dcd0')); j.position.y = -0.38; a.add(j); return a; });
  } else if (type === 'father') {
    // 하트웰: 마르고 키 큰 남자, 실크햇, 검은 코트, 커다란 가위
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 1.8, 20), M('#111114')); coat.position.y = 1.15; body.add(coat);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.0), M('#5a4a3a', { side: THREE.DoubleSide })); apron.position.set(0, 0.95, 0.3); apron.rotation.x = -0.12; body.add(apron);
    const head = new THREE.Group(); head.position.y = 2.32; body.add(head); P.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 17), M('#c8c0b4', { emissive: '#201810', emissiveIntensity: 0.5 })); skull.scale.set(0.9, 1.25, 1); head.add(skull);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 27), M('#08080a')); hat.position.y = 0.36; head.add(hat);
    const hbrim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 34), M('#08080a')); hbrim.position.y = 0.16; head.add(hbrim);
    const mono = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 10, 22), M('#c9a24a', { metalness: 0.9 })); mono.position.set(0.06, 0.03, 0.15); head.add(mono);
    eyes(head, 0.03, 0.15, 0.06, 0.018);
    const grin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.01), new THREE.MeshBasicMaterial({ color: '#000' })); grin.position.set(0, -0.1, 0.15); head.add(grin); P.mouth = grin;
    P.arms = [-1, 1].map((s) => { const a = limb(1.15, 0.045, M('#111114')); a.position.set(0.3 * s, 2.0, 0); body.add(a); const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), M('#c8c0b4')); h.position.y = -1.17; a.add(h); return a; });
    const sc = new THREE.Group(); sc.position.y = -1.25; P.arms[1].add(sc); P.scissors = [];
    for (const s of [-1, 1]) { const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.55, 0.01), M('#c8ccd0', { metalness: 0.9, roughness: 0.2 })); blade.geometry.translate(0, -0.27, 0); blade.rotation.z = 0.15 * s; sc.add(blade); P.scissors.push(blade); }
  }
  if (type === 'dalgyal') {
    // 달걀귀신: 소복 입은 여자, 얼굴에 이목구비가 없다
    const dress = tatteredCone(0.45, 1.6, '#f2f0ea'); dress.position.y = 0.9; body.add(dress);
    const head = new THREE.Group(); head.position.y = 1.86; body.add(head); P.head = head;
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 34, 27), M('#f6f4ee', { roughness: 0.25, emissive: '#333', emissiveIntensity: 0.4 })); egg.scale.set(0.9, 1.25, 0.95); head.add(egg);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.22, 27, 20, Math.PI * 0.75, Math.PI * 1.5, 0, Math.PI * 0.7), HAIR()); back.scale.set(0.95, 1.3, 1); head.add(back);
    P.strands = hairStrands(head, 18, 0, 1.3, 0.19, 0.05).filter((st) => { const a = st.rotation.y; if (Math.cos(a) > 0.4) { head.remove(st); return false; } return true; });
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 17, 14), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1, 0.01, 0.4); mouth.position.set(0, -0.08, 0.19); head.add(mouth); P.mouth = mouth;
    P.arms = [-1, 1].map((sx) => { const a = limb(0.8, 0.03, PALE()); a.position.set(0.3 * sx, 1.6, 0.05); body.add(a); return a; });
  } else if (type === 'slender') {
    // 얼굴 없는 키다리: 3m 가까운 키, 검은 정장, 하얗고 매끈한 얼굴, 아주 긴 팔
    const legs = [-1, 1].map((sx) => { const l = limb(1.5, 0.06, M('#0a0a0c')); l.position.set(0.12 * sx, 1.5, 0); body.add(l); return l; }); P.legs = legs;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 1.2, 17), M('#0a0a0c')); torso.position.y = 2.1; body.add(torso);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.01), M('#7a0a14')); tie.position.set(0, 2.3, 0.18); body.add(tie);
    const head = new THREE.Group(); head.position.y = 2.95; body.add(head); P.head = head;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.17, 31, 24), M('#f4f4f2', { roughness: 0.2 })); face.scale.set(0.85, 1.25, 0.9); head.add(face);
    P.arms = [-1, 1].map((sx) => { const a = limb(1.7, 0.035, M('#0a0a0c')); a.position.set(0.26 * sx, 2.6, 0); a.rotation.z = 0.12 * sx; body.add(a); return a; });
    P.tendrils = [];
    for (let i = 0; i < 6; i++) { const tdr = limb(1.2, 0.025, M('#050505')); tdr.position.set(0, 2.5, -0.12); tdr.rotation.set(-2.2, 0, (i - 2.5) * 0.45); body.add(tdr); P.tendrils.push(tdr); }
  } else if (type === 'nurse') {
    // 고개가 꺾인 간호사: 핏자국 묻은 간호복, 얼굴은 붕대로 감겨 있다
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.4, 1.2, 24), M('#e8e4dc')); dress.position.y = 1.0; body.add(dress);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.06 + Math.random() * 0.06, 8), M('#6a0a0a', { side: THREE.DoubleSide })); b.position.set((Math.random() - 0.5) * 0.4, 0.7 + Math.random() * 0.6, 0.33); body.add(b); }
    P.legs = [-1, 1].map((sx) => { const l = limb(0.45, 0.05, M('#d8d0c4')); l.position.set(0.1 * sx, 0.45, 0); body.add(l); return l; });
    const neck = new THREE.Group(); neck.position.y = 1.66; body.add(neck); P.neck = neck;
    const head = new THREE.Group(); head.position.y = 0.16; neck.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 17), M('#e8dcc8')));
    for (let i = 0; i < 5; i++) { const band = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.02, 6, 29), M('#f2ead8')); band.position.y = -0.08 + i * 0.04; band.rotation.x = Math.PI / 2 + (i % 2 ? 0.2 : -0.2); head.add(band); }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.14), M('#f2f2f0')); cap.position.y = 0.16; head.add(cap);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.01), M('#a01a1a')); cross.position.set(0, 0.17, 0.075); head.add(cross);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), new THREE.MeshBasicMaterial({ color: '#3a0000' })); mouth.scale.set(1.2, 1.6, 0.4); mouth.position.set(0, -0.06, 0.15); head.add(mouth); P.mouth = mouth;
    P.arms = [-1, 1].map((sx) => { const a = limb(0.7, 0.04, M('#e8e4dc')); a.position.set(0.3 * sx, 1.5, 0); body.add(a); return a; });
    const syr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 10), M('#cfe3ff', { transparent: true, opacity: 0.7 })); syr.position.y = -0.75; P.arms[1].add(syr);
  } else if (type === 'headless') {
    // 목 없는 머슴: 목이 잘린 채 자기 머리를 옆구리에 들고 다닌다
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.3, 20), M('#8a7a62')); coat.position.y = 1.05; body.add(coat);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.08, 20), M('#5a0a0a')); stump.position.y = 1.74; body.add(stump);
    P.legs = [-1, 1].map((sx) => { const l = limb(0.45, 0.08, M('#6a5a48')); l.position.set(0.13 * sx, 0.45, 0); body.add(l); return l; });
    P.arms = [-1, 1].map((sx) => { const a = limb(0.75, 0.06, M('#8a7a62')); a.position.set(0.36 * sx, 1.6, 0); body.add(a); return a; });
    const head = new THREE.Group(); head.position.set(0.05, -0.62, 0.15); P.arms[1].add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 17), PALE()));
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), HAIR()); head.add(top);
    eyes(head, 0.02, 0.15, 0.06, 0.022);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1, 1.5, 0.4); mouth.position.set(0, -0.08, 0.15); head.add(mouth); P.mouth = mouth;
    const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.3, 10), M('#6a0000')); drip.position.y = -0.28; head.add(drip);
  } else if (type === 'shadow') {
    // 그림자 승객: 검은 연기로 된 사람. 손전등을 비춰야만 보인다
    const mat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.85 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.0, 10, 20), mat); torso.position.y = 1.0; body.add(torso);
    const head = new THREE.Group(); head.position.y = 1.9; body.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 17), mat));
    eyes(head, 0.02, 0.18, 0.07, 0.02);
    P.arms = [-1, 1].map((sx) => { const a = limb(1.0, 0.05, mat); a.position.set(0.32 * sx, 1.55, 0); body.add(a); return a; });
  }
  if (type === 'clown') {
    // 삐에로: 하얀 분칠, 찢어진 빨간 웃음, 주름 깃, 물방울 무늬 옷, 손에 풍선
    const suit = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.46, 1.35, 24), M('#f2eee6')); suit.position.y = 1.05; body.add(suit);
    for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), M(['#d6303a', '#2f5fd0', '#ffd36a'][i % 3], { side: THREE.DoubleSide })); const a = (i * 2.3) % (Math.PI * 2), y = 0.5 + ((i * 37) % 100) / 100; d.position.set(Math.sin(a) * 0.4, y, Math.cos(a) * 0.4); d.lookAt(Math.sin(a) * 2, y, Math.cos(a) * 2); body.add(d); }
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), M('#d6303a')); b.position.set(0, 1.55 - i * 0.24, 0.33 - i * 0.02); body.add(b); }
    const ruff = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 10, 29), M('#ffffff')); ruff.rotation.x = Math.PI / 2; ruff.position.y = 1.75; body.add(ruff);
    P.legs = [-1, 1].map((s) => { const l = limb(0.45, 0.09, M('#f2eee6')); l.position.set(0.15 * s, 0.45, 0); body.add(l); const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 7, 14), M('#d6303a')); shoe.rotation.x = Math.PI / 2; shoe.position.set(0, -0.45, 0.14); l.add(shoe); return l; });
    const head = new THREE.Group(); head.position.y = 2.08; body.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 31, 24), M('#f8f6f0', { roughness: 0.3, emissive: '#222', emissiveIntensity: 0.3 })));
    for (const s of [-1, 1]) { const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.16, 17, 14), M('#ff4a1a')); tuft.scale.set(1, 1.2, 1.3); tuft.position.set(0.24 * s, 0.05, -0.04); head.add(tuft); }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 17, 14), M('#e01a2a', { roughness: 0.2, emissive: '#600', emissiveIntensity: 0.6 })); nose.position.set(0, 0, 0.24); head.add(nose);
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 10, 22), M('#1a1a2a')); ring.position.set(0.09 * s, 0.07, 0.21); head.add(ring); const tear = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 6), M('#2f5fd0')); tear.rotation.x = Math.PI; tear.position.set(0.09 * s, -0.04, 0.215); head.add(tear); }
    eyes(head, 0.07, 0.22, 0.09, 0.02);
    const grin = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 10, 32, Math.PI), M('#9a0a14', { emissive: '#400', emissiveIntensity: 0.5 })); grin.rotation.z = Math.PI; grin.position.set(0, -0.06, 0.19); head.add(grin);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.06, 17, 14), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1.6, 0.5, 0.4); mouth.position.set(0, -0.11, 0.2); head.add(mouth); P.mouth = mouth;
    for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 4), M('#fffbe8')); t.rotation.x = Math.PI; t.position.set(-0.075 + i * 0.03, -0.085, 0.235); head.add(t); }
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10), M('#2f5fd0')); hat.position.set(0.05, 0.3, 0); hat.rotation.z = -0.3; head.add(hat);
    P.arms = [-1, 1].map((s) => { const a = limb(0.85, 0.07, M('#f2eee6')); a.position.set(0.38 * s, 1.68, 0); body.add(a); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), M('#ffffff')); gl.position.y = -0.88; a.add(gl); return a; });
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.2, 7), M('#ddd')); str.position.y = -0.3; P.arms[0].add(str);
    const bal = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 20), M('#d6303a', { roughness: 0.2, emissive: '#400', emissiveIntensity: 0.4 })); bal.scale.y = 1.2; bal.position.y = 0.4; P.arms[0].add(bal); P.balloon = bal;
  } else if (type === 'ringmaster') {
    // 서커스 단장: 붉은 연미복, 높은 실크햇, 채찍, 콧수염, 금빛 눈
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.3, 24), M('#8a0a1a', { roughness: 0.4 })); coat.position.y = 1.2; body.add(coat);
    const tails = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.04), M('#6a0814')); tails.position.set(0, 0.55, -0.32); tails.rotation.x = 0.2; body.add(tails);
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.04), M('#e8c170', { metalness: 0.5 })); vest.position.set(0, 1.35, 0.3); body.add(vest);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 7), M('#ffd36a', { metalness: 0.9 })); b.position.set(0.12, 1.55 - i * 0.14, 0.33); body.add(b); }
    P.legs = [-1, 1].map((s) => { const l = limb(0.6, 0.08, M('#f4f1ea')); l.position.set(0.14 * s, 0.6, 0); body.add(l); const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.3), M('#0a0a0a')); boot.position.set(0, -0.48, 0.05); l.add(boot); return l; });
    const head = new THREE.Group(); head.position.y = 2.1; body.add(head); P.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 27, 20), M('#c8b8a8', { emissive: '#2a1810', emissiveIntensity: 0.4 })); skull.scale.y = 1.15; head.add(skull);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.55, 31), M('#0a0a0e')); hat.position.y = 0.45; head.add(hat);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.08, 31), M('#8a0a1a')); band.position.y = 0.24; head.add(band);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.025, 37), M('#0a0a0e')); brim.position.y = 0.18; head.add(brim);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.12, 7, 10), M('#1a1010')); m.rotation.z = Math.PI / 2 + 0.4 * s; m.position.set(0.07 * s, -0.07, 0.19); head.add(m); const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffcc33' })); e.position.set(0.07 * s, 0.04, 0.18); head.add(e); }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.position.set(0, -0.13, 0.19); head.add(mouth); P.mouth = mouth;
    P.arms = [-1, 1].map((s) => { const a = limb(0.9, 0.07, M('#8a0a1a')); a.position.set(0.38 * s, 1.75, 0); body.add(a); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), M('#ffffff')); gl.position.y = -0.92; a.add(gl); return a; });
    const whip = new THREE.Group(); whip.position.y = -0.95; P.arms[1].add(whip); P.whip = [];
    for (let i = 0; i < 8; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 7), M('#3a2010')); seg.position.y = -0.11; const holder = new THREE.Group(); holder.position.y = i ? -0.22 : 0; (i ? P.whip[i - 1] : whip).add(holder); holder.add(seg); P.whip.push(holder); }
  } else if (type === 'marionette') {
    // 줄 인형: 위에서 내려온 실에 매달려 덜렁거리는 나무 인형. 얼굴엔 금 간 웃음
    const wood = M('#c8a070', { roughness: 0.6 }), cloth = M('#5a2a6a');
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), cloth); torso.position.y = 1.4; body.add(torso);
    const hip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.2), cloth); hip.position.y = 1.0; body.add(hip);
    for (const s of [-1, 1]) { const j = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), wood); j.position.set(0.24 * s, 1.62, 0); body.add(j); }
    P.legs = [-1, 1].map((s) => { const l = limb(0.5, 0.05, wood); l.position.set(0.1 * s, 0.92, 0); body.add(l); const low = limb(0.45, 0.045, wood); low.position.y = -0.5; l.add(low); const k = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), wood); k.position.y = -0.5; l.add(k); return l; });
    P.arms = [-1, 1].map((s) => { const a = limb(0.4, 0.04, wood); a.position.set(0.24 * s, 1.62, 0); body.add(a); const low = limb(0.38, 0.035, wood); low.position.y = -0.4; a.add(low); return a; });
    const head = new THREE.Group(); head.position.y = 1.95; body.add(head); P.head = head;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 27, 20), M('#e8d4b8', { roughness: 0.3 })); face.scale.set(0.9, 1.1, 0.9); head.add(face);
    for (const s of [-1, 1]) { const ch = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), M('#e05a6a')); ch.position.set(0.1 * s, -0.04, 0.18); head.add(ch); }
    eyes(head, 0.04, 0.18, 0.07, 0.022);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), M('#e8d4b8')); jaw.position.set(0, -0.18, 0.05); head.add(jaw); P.mouth = jaw;
    for (const s of [-1, 1]) { const cr = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.005), M('#2a1a10')); cr.position.set(0.07 * s, -0.13, 0.17); head.add(cr); }
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45), M('#2a1a10')); head.add(hair);
    P.strings = [];
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.04), M('#3a2a1a')); bar.position.y = 3.6; g.add(bar); P.bar = bar;
    for (const [x, y] of [[-0.24, 1.62], [0.24, 1.62], [0, 2.15], [-0.1, 0.92], [0.1, 0.92]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 3.6 - y, 5), new THREE.MeshBasicMaterial({ color: '#d8d0c0', transparent: true, opacity: 0.6 })); s.position.set(x, (3.6 + y) / 2, 0); g.add(s); P.strings.push(s); }
  } else if (type === 'crawler') {
    // 거꾸로 기는 곡예사: 등을 바닥에 대고 거미처럼 네 팔다리로 기어 온다. 긴 머리가 바닥을 끈다
    const suit = M('#2a1a3a', { roughness: 0.5 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 10, 17), suit); torso.rotation.x = Math.PI / 2; torso.position.y = 0.7; body.add(torso);
    for (let i = 0; i < 6; i++) { const sq = new THREE.Mesh(new THREE.CircleGeometry(0.04, 6), M('#e8c170', { metalness: 0.9, emissive: '#553', emissiveIntensity: 0.6, side: THREE.DoubleSide })); sq.position.set((i % 2 ? 0.1 : -0.1), 0.92, -0.3 + i * 0.1); sq.rotation.x = -Math.PI / 2; body.add(sq); }
    const neck = new THREE.Group(); neck.position.set(0, 0.75, 0.42); body.add(neck); P.neck = neck;
    const head = new THREE.Group(); head.position.set(0, 0.05, 0.2); head.rotation.x = Math.PI * 0.85; neck.add(head); P.head = head;
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 17), PALE()));
    P.strands = hairStrands(head, 26, 0, 1.1, 0.16, 0.05);
    eyes(head, 0.02, 0.15, 0.055, 0.026);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 17, 14), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.scale.set(1, 2, 0.4); mouth.position.set(0, -0.08, 0.14); head.add(mouth); P.mouth = mouth;
    P.limbs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const up = limb(0.6, 0.035, sz > 0 ? PALE() : suit); up.position.set(0.18 * sx, 0.75, 0.3 * sz); up.rotation.z = -1.0 * sx; body.add(up);
      const low = limb(0.75, 0.03, PALE()); low.position.y = -0.6; low.rotation.z = 2.3 * sx; up.add(low);
      return { up, low, sx, sz };
    });
  } else if (type === 'scarecrow') {
    // 허수아비: 자루 얼굴에 꿰맨 웃음, 지푸라기가 삐져나오는 몸, 낫
    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 1.0, 17), M('#4a5a30', { roughness: 1 })); shirt.position.y = 1.3; body.add(shirt);
    for (let i = 0; i < 18; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.3, 5), M('#e8d08a')); st.position.set((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 1.1, (Math.random() - 0.5) * 0.6); st.rotation.set(Math.random() * 2, 0, Math.random() * 2); body.add(st); }
    P.legs = [-1, 1].map((s) => { const l = limb(0.8, 0.07, M('#3a4a6a')); l.position.set(0.13 * s, 0.82, 0); body.add(l); return l; });
    const head = new THREE.Group(); head.position.y = 2.05; body.add(head); P.head = head;
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 17), M('#c8b080', { roughness: 1 })); sack.scale.set(1, 1.15, 0.95); head.add(sack);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.45, 14), M('#5a4020')); hat.position.y = 0.32; head.add(hat);
    const hbrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 31), M('#5a4020')); hbrim.position.y = 0.12; head.add(hbrim);
    for (const s of [-1, 1]) { const x1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.01), M('#111')); x1.rotation.z = 0.78; x1.position.set(0.08 * s, 0.04, 0.23); head.add(x1); const x2 = x1.clone(); x2.rotation.z = -0.78; head.add(x2); }
    eyes(head, 0.04, 0.235, 0.08, 0.012);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.position.set(0, -0.1, 0.23); head.add(mouth); P.mouth = mouth;
    for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.008), M('#2a1a10')); st.position.set(-0.08 + i * 0.032, -0.1, 0.235); head.add(st); }
    P.arms = [-1, 1].map((s) => { const a = limb(0.85, 0.06, M('#4a5a30')); a.position.set(0.36 * s, 1.75, 0); a.rotation.z = 1.2 * s; body.add(a); return a; });
    const scythe = new THREE.Group(); scythe.position.y = -0.85; P.arms[1].add(scythe);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 10), M('#5a3d27')); scythe.add(pole);
    const blade = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 19, Math.PI * 0.8), M('#9aa0a6', { metalness: 0.9, roughness: 0.3 })); blade.position.set(0.25, 0.7, 0); scythe.add(blade);
  } else if (type === 'zombie') {
    // 좀비: 찢어진 셔츠 · 썩은 초록빛 피부 · 앞으로 뻗은 팔 · 질질 끄는 걸음 (옷 색은 몇 가지 중 하나)
    const skinM = M('#7a8a64', { emissive: '#1a2a10', emissiveIntensity: 0.5, roughness: 0.95 });
    const shirts = ['#4a5a7a', '#8a2a2a', '#d8d4c8', '#2a3a2a', '#6a4a8a'];
    const shirt = M(shirts[Math.floor(Math.random() * shirts.length)], { map: clothTex(), roughness: 1 });
    const pants = M(['#2a2a34', '#3a3a2a', '#1a2a4a'][Math.floor(Math.random() * 3)], { roughness: 1 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.24, 0.75, 18), shirt); torso.position.y = 1.32; body.add(torso); P.torso = torso;
    const rib = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M('#5a0a08', { roughness: 0.4, emissive: '#2a0000' })); rib.scale.set(1, 1.4, 0.4); rib.position.set(0.1, 1.3, 0.24); body.add(rib);
    P.legs = [-1, 1].map((s) => { const l = limb(0.92, 0.09, pants); l.position.set(0.13 * s, 0.94, 0); body.add(l); const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), M('#1a1410')); shoe.position.set(0, -0.92, 0.05); l.add(shoe); return l; });
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 10), skinM); neck.position.y = 1.76; body.add(neck);
    const head = new THREE.Group(); head.position.y = 1.95; body.add(head); P.head = head;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), skinM); skull.scale.set(0.95, 1.12, 1); head.add(skull);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.1, 0.06); head.add(jaw); P.jaw = jaw;
    const jm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.16), skinM); jm.position.set(0, -0.04, 0.04); jaw.add(jm);
    for (let i = 0; i < 6; i++) { const tth = new THREE.Mesh(GG('ztooth', () => new THREE.BoxGeometry(0.018, 0.028, 0.012)), M('#d8cca0')); tth.position.set(-0.05 + i * 0.02, -0.005, 0.12); jaw.add(tth); }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: '#1a0000' })); mouth.position.set(0, -0.1, 0.17); head.add(mouth); P.mouth = mouth;
    for (const s of [-1, 1]) { const sk = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 9), new THREE.MeshBasicMaterial({ color: '#0a0a06' })); sk.position.set(0.07 * s, 0.03, 0.155); head.add(sk); }
    eyes(head, 0.03, 0.18, 0.07, 0.016, '#e8ff9a');
    for (let i = 0; i < 5; i++) { const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M('#2a2420', { roughness: 1 })); const a = i * 1.3; tuft.position.set(Math.sin(a) * 0.13, 0.15, Math.cos(a) * 0.1 - 0.04); head.add(tuft); }
    const wound = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), M('#6a0a0a', { emissive: '#2a0000' })); wound.position.set(-0.12, 0.08, 0.13); wound.rotation.y = -0.6; head.add(wound);
    P.arms = [-1, 1].map((s) => { const a = limb(0.72, 0.065, shirt); a.position.set(0.33 * s, 1.62, 0); body.add(a); const fa = limb(0.3, 0.05, skinM); fa.position.y = -0.72; a.add(fa); const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), skinM); hand.position.y = -0.3; fa.add(hand); a.userData.fa = fa; return a; });
    P.arms.forEach((a) => claws(a.userData.fa, 0.8, skinM));
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.06 + i * 0.02, 10), M('#4a0606', { emissive: '#1a0000', side: THREE.DoubleSide })); b.position.set((i - 1.5) * 0.12, 1.1 + (i % 2) * 0.3, 0.255); body.add(b); }
    u.limp = Math.random() < 0.5 ? 1 : -1;
  } else if (type === 'gasmask') {
    // 방독면 사내: 낡은 고무 비옷, 둥근 유리 눈, 길게 늘어진 호스, 숨소리
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.6, 20), M('#2a2e26', { roughness: 0.35 })); coat.position.y = 1.0; body.add(coat);
    P.legs = [-1, 1].map((s) => { const l = limb(0.4, 0.09, M('#1a1a16')); l.position.set(0.15 * s, 0.35, 0); body.add(l); return l; });
    const head = new THREE.Group(); head.position.y = 2.0; body.add(head); P.head = head;
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 17), M('#2a2e26', { roughness: 0.35 })); hood.scale.y = 1.15; head.add(hood);
    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 17), M('#3a3a34', { roughness: 0.5 })); mask.scale.set(1, 1.05, 0.8); mask.position.z = 0.08; head.add(mask);
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 10, 26), M('#8a8e94', { metalness: 0.8 })); ring.position.set(0.08 * s, 0.05, 0.22); head.add(ring); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.055, 14), new THREE.MeshBasicMaterial({ color: '#a8ff9a', transparent: true, opacity: 0.85 })); lens.position.set(0.08 * s, 0.05, 0.225); head.add(lens); }
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 20), M('#5a5a50', { metalness: 0.6 })); can.rotation.x = Math.PI / 2; can.position.set(0, -0.12, 0.28); head.add(can); P.mouth = can;
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 10, 26, Math.PI), M('#1a1a16')); hose.position.set(0, -0.45, 0.2); hose.rotation.y = Math.PI / 2; head.add(hose);
    P.arms = [-1, 1].map((s) => { const a = limb(0.85, 0.08, M('#2a2e26')); a.position.set(0.4 * s, 1.65, 0); body.add(a); return a; });
    const lantern = new THREE.PointLight('#a8ff9a', 1.2, 3, 2); lantern.position.y = -0.9; P.arms[0].add(lantern);
  }
  // ── 디테일: 얼굴 그림 · 앙상한 손가락 · 입가에 흐르는 피 · 발밑 그림자
  dressFace(type, P.head);
  if (['woman', 'child', 'dalgyal', 'nurse', 'mudang', 'crawler'].includes(type)) {
    const k = type === 'child' ? 0.55 : 1;
    if (P.arms) P.arms.forEach((a) => claws(a, k));
    if (P.limbs) P.limbs.forEach((L) => { L.low.userData.len = L.low.userData.len || 0.6; claws(L.low, 0.9); });
  }
  if ((type === 'woman' || type === 'child' || type === 'headless') && P.mouth) {
    const drip = new THREE.Mesh(GG('drip', () => new THREE.CylinderGeometry(0.006, 0.002, 0.16, 7).translate(0, -0.08, 0)), M('#5a0000', { roughness: 0.2, emissive: '#200000' }));
    drip.position.set(P.mouth.position.x + 0.015, P.mouth.position.y - 0.02, P.mouth.position.z); P.head.add(drip);
  }
  if (type !== 'shadow') {
    const blob = new THREE.Mesh(GG('gblob', () => new THREE.CircleGeometry(0.45, 18)), GG('gblobm', () => new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.45, depthWrite: false })));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; g.add(blob);
  }
  if (type === 'mascot') {
    // 해피 토끼 탈: 사람만 한 토끼 인형 탈, 단추 눈 하나는 떨어졌고, 꿰맨 웃음 틈으로 사람 눈이 보인다
    const fur = M('#d8d2c8', { roughness: 1 }), dirty = M('#7a6a5a', { roughness: 1 });
    const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 10, 24), fur); bodyM.position.y = 1.05; body.add(bodyM);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), M('#ece6dc')); belly.scale.set(1, 1.2, 0.5); belly.position.set(0, 1.0, 0.3); body.add(belly);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.05 + (i % 3) * 0.03, 12), M('#5a0a0a', { side: THREE.DoubleSide })); b.position.set((i % 2 ? 0.15 : -0.12) + i * 0.02, 0.7 + i * 0.12, 0.44); body.add(b); }
    P.legs = [-1, 1].map((s) => { const l = limb(0.5, 0.13, fur); l.position.set(0.18 * s, 0.5, 0); body.add(l); const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), fur); foot.scale.set(1, 0.5, 1.6); foot.position.set(0, -0.5, 0.1); l.add(foot); return l; });
    const head = new THREE.Group(); head.position.y = 2.05; body.add(head); P.head = head;
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), fur); hd.scale.set(1, 0.95, 0.95); head.add(hd);
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.75, 6, 14), s > 0 ? dirty : fur); ear.position.set(0.18 * s, 0.7, -0.05); ear.rotation.z = s > 0 ? -1.0 : -0.12; head.add(ear); }
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 20), M('#0a0a0a', { roughness: 0.3 })); btn.rotation.x = Math.PI / 2; btn.position.set(-0.15, 0.06, 0.39); head.add(btn);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: '#000' })); hole.position.set(0.15, 0.06, 0.405); head.add(hole);
    const realEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: '#e8e0c8' })); realEye.position.set(0.15, 0.06, 0.39); head.add(realEye); P.realEye = realEye;
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M('#c8808a')); nose.position.set(0, -0.04, 0.41); head.add(nose);
    const grin = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 6, 24, Math.PI), M('#2a1008')); grin.rotation.z = Math.PI; grin.position.set(0, -0.12, 0.38); head.add(grin);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: '#000' })); mouth.position.set(0, -0.2, 0.37); head.add(mouth); P.mouth = mouth;
    for (let i = 0; i < 8; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.01), M('#2a1008')); st.position.set(-0.15 + i * 0.043, -0.2, 0.38); head.add(st); }
    P.arms = [-1, 1].map((s) => { const a = limb(0.75, 0.11, fur); a.position.set(0.46 * s, 1.5, 0); body.add(a); const paw = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), fur); paw.position.y = -0.78; a.add(paw); return a; });
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.3, 4), M('#ddd')); str.position.y = -0.2; P.arms[1].add(str);
    const bal = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), M('#d02a3a', { roughness: 0.3, emissive: '#300', emissiveIntensity: 0.4 })); bal.scale.y = 1.2; bal.position.y = 0.5; P.arms[1].add(bal);
  }
  const light = new THREE.PointLight(type === 'mascot' ? '#ffb0c0' : type === 'mudang' ? '#ff4a3a' : type === 'sailor' ? '#5a9aff' : type === 'doll' ? '#ffd0e0' : type === 'clown' ? '#ff3a6a' : type === 'ringmaster' ? '#ffb030' : type === 'gasmask' ? '#a8ff9a' : type === 'scarecrow' ? '#ff8a30' : '#8899ff', 2.2, 4.5, 2); light.position.y = 1.5; g.add(light); u.light = light; if (type === 'shadow') { light.color.set('#000'); light.distance = 0.01; }
  // 주변 검은 안개
  const fogTex = fogTexture();
  u.fog = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0.6 })); s.scale.setScalar(1.2 + Math.random()); s.position.set((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8); g.add(s); u.fog.push(s); }
  g.userData = u;
  return g;
}

// state: { mode: 'wander'|'hunt'|'pause', lit, moving }
export function animateGhost(g, dt, t, st, distToMe) {
  const u = g.userData, P = u.parts; const tt = t + u.t0;
  const hunting = st.mode === 'hunt';
  const frozen = st.lit && u.type === 'woman';
  if (frozen) return; // 빛을 비추면 그대로 굳는다 — 움직이지 않는 게 더 무섭다
  // 경련: 이따금 머리가 확 꺾인다
  u.twitch = (u.twitch || 0) - dt;
  if (u.twitch < 0) { u.twitch = 0.6 + Math.random() * (hunting ? 1 : 3); u.snap = (Math.random() - 0.5) * (hunting ? 1.6 : 0.8); }
  if (P.head && u.type !== 'mudang' && u.type !== 'crawler') P.head.rotation.z += ((u.snap || 0) - P.head.rotation.z) * Math.min(1, dt * 25);
  for (const s of P.strands || []) { s.rotation.x = Math.sin(tt * 2 + s.position.x * 20) * 0.15 + (hunting ? 0.25 : 0); }
  if (P.mouth) P.mouth.scale.y = (u.type === 'mudang' ? 0.8 : 1.8) + (hunting ? Math.abs(Math.sin(tt * 9)) * 1.5 : 0);
  if (u.type === 'woman' || u.type === 'child') {
    const reach = hunting ? -1.35 : -0.15;
    P.arms.forEach((a, i) => { a.rotation.x += (reach + Math.sin(tt * 3 + i) * 0.08 - a.rotation.x) * Math.min(1, dt * 4); });
    u.body.position.y = 0.08 + Math.sin(tt * 1.7) * 0.07;
    u.body.rotation.z = Math.sin(tt * 0.9) * 0.05;
  } else if (u.type === 'janitor') {
    const sp = hunting ? 7 : 3.5; const s = Math.sin(tt * sp);
    P.legs[0].rotation.x = s * 0.5; P.legs[1].rotation.x = -s * 0.5;
    u.body.rotation.z = Math.abs(s) * 0.12; // 절뚝거림
    P.arms[0].rotation.x = hunting ? -1.4 : -s * 0.3;
    P.arms[1].rotation.x = s * 0.2;
  } else if (u.type === 'elder') {
    P.neck.rotation.z = 1.35 + Math.sin(tt * 0.7) * 0.1 + (u.snap || 0) * 0.3; // 90도 꺾인 목
    P.arms[0].rotation.x = -0.9; P.arms[1].rotation.x = hunting ? -1.5 : 0.1;
    u.body.position.y = Math.abs(Math.sin(tt * 4)) * 0.03;
    if (P.ember) P.ember.intensity = 1 + Math.sin(tt * 3) * 0.5;
  } else if (u.type === 'mudang') {
    const sp = hunting ? 14 : 6;
    P.limbs.forEach((L, i) => { const ph = tt * sp + (i % 2 === (i < 2 ? 0 : 1) ? 0 : Math.PI); L.up.rotation.x = Math.sin(ph) * 0.5 * L.sz; L.low.rotation.x = Math.max(0, Math.sin(ph)) * 0.4; });
    P.neck.rotation.y = Math.sin(tt * (hunting ? 6 : 1.5)) * (hunting ? 1.2 : 0.4);
    u.body.position.y = Math.abs(Math.sin(tt * sp)) * 0.05;
  }
  if (u.type === 'sailor') {
    const sp = hunting ? 5 : 2.5; const sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.4; P.legs[1].rotation.x = -sn * 0.4;
    u.body.rotation.z = Math.sin(tt * 0.8) * 0.08; // 물속처럼 흔들림
    P.arms[0].rotation.x = hunting ? -1.4 + Math.sin(tt * 3) * 0.1 : -0.2; P.arms[1].rotation.x = hunting ? -1.2 : sn * 0.2;
    for (const d of u.drip) { d.position.y -= dt * 2.5; if (d.position.y < 0) d.position.y = 1.8 + Math.random() * 0.4; }
  } else if (u.type === 'doll') {
    // 관절 인형: 뚝뚝 끊기는 움직임
    u.tick = (u.tick || 0) + dt;
    if (u.tick > (hunting ? 0.12 : 0.3)) { u.tick = 0; P.head.rotation.z = (Math.random() - 0.5) * (hunting ? 1.0 : 0.3); P.head.rotation.y = (Math.random() - 0.5) * 0.6; P.arms.forEach((a) => (a.rotation.x = hunting ? -1.5 + (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.3)); u.body.position.y = Math.random() * 0.06; }
  } else if (u.type === 'father') {
    const sn = Math.sin(tt * (hunting ? 5 : 2.5));
    u.body.rotation.x = 0.12; u.body.position.y = Math.abs(sn) * 0.04;
    P.arms[0].rotation.x = hunting ? -1.6 : -0.1 + sn * 0.1; P.arms[1].rotation.x = hunting ? -1.1 : 0;
    const snip = hunting ? Math.abs(Math.sin(tt * 10)) * 0.5 : 0.1; P.scissors[0].rotation.z = snip; P.scissors[1].rotation.z = -snip;
  }
  if (u.type === 'zombie') {
    // 질질 끄는 걸음 + 앞으로 뻗은 팔 + 턱이 덜컥거린다 (쫓을 때는 더 빠르고 격하게)
    const sp = hunting ? 6 : 2.6, sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.45; P.legs[1].rotation.x = -sn * 0.3;
    u.body.rotation.z = Math.sin(tt * sp * 0.5) * 0.1 * u.limp + 0.06 * u.limp; u.body.rotation.x = hunting ? 0.18 : 0.08;
    u.body.position.y = Math.abs(sn) * 0.04;
    P.arms.forEach((a, i) => { const want = hunting ? -1.45 + Math.sin(tt * 7 + i * 2) * 0.12 : -1.1 + Math.sin(tt * 2 + i) * 0.1; a.rotation.x += (want - a.rotation.x) * Math.min(1, dt * 5); a.rotation.z = (i ? -1 : 1) * 0.12; a.userData.fa.rotation.x = -0.25 + Math.sin(tt * 3 + i) * 0.1; });
    if (P.jaw) P.jaw.rotation.x = 0.15 + Math.abs(Math.sin(tt * (hunting ? 11 : 3))) * (hunting ? 0.55 : 0.25);
    P.head.rotation.x = Math.sin(tt * 1.3) * 0.1 - 0.1;
  }
  if (u.type === 'dalgyal') {
    u.body.position.y = 0.1 + Math.sin(tt * 1.4) * 0.06;
    P.arms.forEach((a, i) => (a.rotation.x = hunting ? -1.2 + Math.sin(tt * 4 + i) * 0.1 : -0.1));
    if (P.mouth) P.mouth.scale.y = hunting ? 0.01 + Math.abs(Math.sin(tt * 2)) * 2.2 : 0.01; // 매끈한 얼굴에 입만 찢어진다
  } else if (u.type === 'slender') {
    const sn = Math.sin(tt * (hunting ? 2.2 : 1.2));
    P.legs[0].rotation.x = sn * 0.25; P.legs[1].rotation.x = -sn * 0.25;
    P.arms.forEach((a, i) => (a.rotation.x = hunting ? -0.9 + Math.sin(tt * 2 + i) * 0.2 : Math.sin(tt + i) * 0.05));
    P.tendrils.forEach((td, i) => (td.rotation.x = -2.2 + Math.sin(tt * 2 + i) * (hunting ? 0.5 : 0.15)));
    P.head.rotation.z = Math.sin(tt * 0.5) * 0.15;
  } else if (u.type === 'nurse') {
    const sn = Math.sin(tt * (hunting ? 6 : 2));
    P.legs[0].rotation.x = sn * 0.4; P.legs[1].rotation.x = -sn * 0.4;
    P.neck.rotation.z = 1.2 + Math.sin(tt * 9) * (hunting ? 0.25 : 0.05); // 꺾인 목이 떨린다
    P.arms[1].rotation.x = hunting ? -1.4 : -0.2; P.arms[0].rotation.x = -sn * 0.3;
  } else if (u.type === 'headless') {
    const sn = Math.sin(tt * (hunting ? 5 : 2.5));
    P.legs[0].rotation.x = sn * 0.5; P.legs[1].rotation.x = -sn * 0.5;
    P.arms[0].rotation.x = hunting ? -1.4 : sn * 0.3; P.arms[1].rotation.x = -0.6;
    P.head.rotation.y = Math.sin(tt * 1.5) * 0.8;
  } else if (u.type === 'shadow') {
    u.body.position.y = Math.sin(tt * 2) * 0.05;
    P.arms.forEach((a, i) => (a.rotation.x = hunting ? -1.3 : Math.sin(tt + i) * 0.2));
    u.body.scale.x = 1 + Math.sin(tt * 7) * 0.05;
  }
  if (u.type === 'clown') {
    const sp = hunting ? 9 : 3; const sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.6; P.legs[1].rotation.x = -sn * 0.6;
    u.body.position.y = Math.abs(sn) * (hunting ? 0.18 : 0.05); // 깡충깡충 뛰어온다
    u.body.rotation.z = Math.sin(tt * sp * 0.5) * 0.12;
    P.arms[1].rotation.x = hunting ? -1.5 + Math.sin(tt * 12) * 0.2 : sn * 0.3; P.arms[0].rotation.x = -0.6;
    P.head.rotation.y = hunting ? 0 : Math.sin(tt * 0.8) * 0.6;
    if (P.balloon) P.balloon.position.x = Math.sin(tt * 1.3) * 0.1;
  } else if (u.type === 'ringmaster') {
    const sp = hunting ? 5.5 : 2.2; const sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.45; P.legs[1].rotation.x = -sn * 0.45;
    P.arms[0].rotation.x = hunting ? -0.6 : -0.1; P.arms[1].rotation.x = hunting ? -2.4 + Math.abs(Math.sin(tt * 4)) * 2.2 : -0.3;
    P.whip.forEach((w, i) => (w.rotation.x = Math.sin(tt * (hunting ? 10 : 2) - i * 0.6) * (hunting ? 0.5 : 0.15)));
  } else if (u.type === 'marionette') {
    const j = hunting ? 1 : 0.4; const sn = Math.sin(tt * (hunting ? 7 : 2.5));
    u.body.position.y = 0.1 + Math.abs(Math.sin(tt * 3)) * 0.12 * j; // 실에 들려 껑충
    P.legs[0].rotation.x = sn * 0.9 * j; P.legs[1].rotation.x = -sn * 0.9 * j;
    P.arms.forEach((a, i) => (a.rotation.z = (i ? -1 : 1) * (0.4 + Math.abs(Math.sin(tt * 4 + i)) * 1.1 * j)));
    P.head.rotation.z = Math.sin(tt * 1.7) * 0.5; P.mouth.position.y = -0.18 - Math.abs(Math.sin(tt * 6)) * 0.05 * j;
    P.bar.rotation.z = Math.sin(tt * 2) * 0.2;
  } else if (u.type === 'crawler') {
    const sp = hunting ? 13 : 5;
    P.limbs.forEach((L, i) => { const ph = tt * sp + (i === 0 || i === 3 ? 0 : Math.PI); L.up.rotation.x = Math.sin(ph) * 0.55 * L.sz; L.low.rotation.x = Math.max(0, Math.sin(ph)) * 0.5; });
    P.neck.rotation.y = Math.sin(tt * (hunting ? 8 : 2)) * (hunting ? 0.9 : 0.3);
    u.body.position.y = Math.abs(Math.sin(tt * sp)) * 0.05;
  } else if (u.type === 'scarecrow') {
    const sp = hunting ? 4 : 1.5; const sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.35; P.legs[1].rotation.x = -sn * 0.35;
    u.body.rotation.z = Math.sin(tt * 0.7) * 0.1; u.body.rotation.y = hunting ? 0 : Math.sin(tt * 0.3) * 0.4;
    P.arms[1].rotation.x = hunting ? -1.2 + Math.sin(tt * 6) * 0.6 : 0;
  } else if (u.type === 'gasmask') {
    const sp = hunting ? 5 : 2; const sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.4; P.legs[1].rotation.x = -sn * 0.4;
    P.arms[0].rotation.x = -0.8; P.arms[1].rotation.x = hunting ? -1.3 : sn * 0.2;
    P.head.scale.setScalar(1 + Math.sin(tt * 2.2) * 0.025); // 쉭… 쉭… 숨쉬는 마스크
  }
  if (u.type === 'mascot') {
    const sp = hunting ? 6 : 2.2; const sn = Math.sin(tt * sp);
    P.legs[0].rotation.x = sn * 0.5; P.legs[1].rotation.x = -sn * 0.5;
    u.body.position.y = Math.abs(sn) * (hunting ? 0.1 : 0.03);
    P.arms[0].rotation.x = hunting ? -1.5 + Math.sin(tt * 3) * 0.15 : -0.1; P.arms[1].rotation.x = -0.4;
    P.head.rotation.y = hunting ? 0 : Math.sin(tt * 0.5) * 0.9; // 고개를 끝까지 돌려 두리번거린다
    P.realEye.position.x = 0.15 + Math.sin(tt * 3) * 0.02;
  }
  u.light.intensity = (hunting ? 3 : 1.6) * (0.7 + Math.random() * 0.4);
  for (const f of u.fog) { f.position.y += dt * 0.25; if (f.position.y > 2) f.position.y = 0.2; f.material.opacity = 0.5 * (1 - f.position.y / 2.2); }
}
