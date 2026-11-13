import * as THREE from 'three';

const cache = {};
const M = (c, o = {}) => {
  const k = c + JSON.stringify(o);
  return (cache[k] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o }));
};
const WOOD = '#6b4a2e', DWOOD = '#3e2a1a', METAL = '#5d6066', PAPER = '#e9e2cc', RED = '#8e1c17';

// ── 지오메트리 재사용: 같은 크기의 상자·원기둥·구는 한 번만 만든다 (소품 수백 개 → 지오메트리 수십 개)
// 공유 지오메트리는 절대 직접 변형(translate 등)하지 말 것. 변형이 필요하면 새로 만든다.
const GC = new Map();
export const geo = (key, make) => { let g = GC.get(key); if (!g) { g = make(); g.userData.shared = true; GC.set(key, g); } return g; };
const r3 = (v) => Math.round(v * 1000) / 1000;
const boxG = (w, h, d) => geo(`b${r3(w)},${r3(h)},${r3(d)}`, () => new THREE.BoxGeometry(w, h, d));
// 폴리곤 디테일: PC 는 둥근 부품을 약 1.7배 촘촘하게, 휴대폰은 1.25배 (모양은 같고 더 매끈하다)
const DETAIL = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) ? 1.25 : 1.7;
const dseg = (n) => Math.max(n, Math.round(n * DETAIL));
const cylG = (rt, rb, h, seg) => { seg = dseg(seg); return geo(`c${r3(rt)},${r3(rb)},${r3(h)},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)); };
const sphG = (r, ws = 16, hs = 12) => { ws = dseg(ws); hs = dseg(hs); return geo(`s${r3(r)},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)); };
// 아주 작은 조각은 그림자를 드리우지 않는다 (그림자 패스 비용 절감, 모습은 그대로)
function B(g, w, h, d, c, x = 0, y = 0, z = 0, o) {
  const m = new THREE.Mesh(boxG(w, h, d), typeof c === 'string' ? M(c, o) : c);
  const big = Math.max(w, h, d) > 0.22;
  m.position.set(x, y + h / 2, z); m.castShadow = big; m.receiveShadow = big; g.add(m); return m;
}
function C(g, rt, rb, h, c, x = 0, y = 0, z = 0, seg = 14, o) {
  const m = new THREE.Mesh(cylG(rt, rb, h, seg), typeof c === 'string' ? M(c, o) : c);
  m.position.set(x, y + h / 2, z); m.castShadow = h > 0.3 || Math.max(rt, rb) > 0.15; g.add(m); return m;
}
function S(g, r, c, x = 0, y = 0, z = 0, o) {
  const m = new THREE.Mesh(r < 0.05 ? sphG(r, 8, 6) : r < 0.12 ? sphG(r, 12, 8) : sphG(r), typeof c === 'string' ? M(c, o) : c);
  m.position.set(x, y, z); m.castShadow = r > 0.1; g.add(m); return m;
}
// 캔버스 텍스처 — key 를 주면 같은 그림은 한 번만 그린다
const TC = new Map();
function canvasTex(w, h, draw, key) {
  if (key && TC.has(key)) return TC.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (key) TC.set(key, t);
  return t;
}
export { canvasTex };
const TM = new Map();
function Plane(g, w, h, tex, x, y, z, o = {}) {
  // 같은 텍스처 + 같은 옵션이면 재질도 하나로
  const mk = tex.uuid + JSON.stringify(o);
  let mt = TM.get(mk); if (!mt) { mt = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, ...o }); TM.set(mk, mt); }
  const m = new THREE.Mesh(geo(`p${r3(w)},${r3(h)}`, () => new THREE.PlaneGeometry(w, h)), mt);
  m.position.set(x, y, z); g.add(m); return m;
}
// 종이 질감 (누런 바탕 + 얼룩 + 줄) — 3D 소품용
function paperTex(key, { base = '#e9e2cc', lines = 9, ink = 'rgba(40,30,25,.55)', title, stain = true, w = 128, h = 160, grid = false } = {}) {
  return canvasTex(w, h, (x) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, base); g.addColorStop(1, shade(base, -18)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(90,60,30,${Math.random() * 0.05})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    if (stain) { const sx = w * (0.2 + Math.random() * 0.6), sy = h * (0.3 + Math.random() * 0.5), sr = w * (0.12 + Math.random() * 0.12); const sg = x.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr); sg.addColorStop(0, 'rgba(120,80,30,.0)'); sg.addColorStop(0.85, 'rgba(120,80,30,.18)'); sg.addColorStop(1, 'rgba(120,80,30,0)'); x.fillStyle = sg; x.fillRect(0, 0, w, h); }
    x.strokeStyle = ink; x.lineCap = 'round';
    let y0 = h * 0.12;
    if (title) { x.fillStyle = ink; x.font = `bold ${Math.round(w / 9)}px serif`; x.textAlign = 'center'; x.fillText(title, w / 2, h * 0.13); y0 = h * 0.22; }
    if (grid) { x.lineWidth = 1; for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(w * 0.08, y0 + i * (h * 0.7 / 6)); x.lineTo(w * 0.92, y0 + i * (h * 0.7 / 6)); x.stroke(); } for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(w * 0.08 + j * (w * 0.84 / 4), y0); x.lineTo(w * 0.08 + j * (w * 0.84 / 4), y0 + h * 0.7); x.stroke(); } }
    else for (let i = 0; i < lines; i++) { x.lineWidth = 1.6; x.beginPath(); const yy = y0 + i * (h * 0.78 / lines); let xx = w * 0.1; x.moveTo(xx, yy); const end = w * (0.6 + Math.random() * 0.3); while (xx < end) { xx += 4 + Math.random() * 6; x.lineTo(xx, yy + (Math.random() - 0.5) * 1.6); } x.stroke(); }
  }, key);
}
// 가지 끝이 처진 솔잎 층 (꼭짓점 흔들기는 위치값으로 정해서 모든 화면에서 같다)
function pineCone(r, h, k) {
  const g = new THREE.ConeGeometry(r, h, 10, 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < -h / 2 + 0.01) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); const j = 1 + Math.sin(a * 5 + k) * 0.12; pos.setX(i, pos.getX(i) * j); pos.setZ(i, pos.getZ(i) * j); pos.setY(i, y - Math.abs(Math.sin(a * 5 + k)) * 0.12); } }
  g.computeVertexNormals(); return g;
}
// 울퉁불퉁한 나뭇잎 덩어리
function blobGeo(r) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const n = 1 + Math.sin(x * 7.1 + y * 3.3) * 0.08 + Math.cos(z * 6.3 - y * 4.1) * 0.08; pos.setXYZ(i, x * n, y * n * 0.92, z * n); }
  g.computeVertexNormals(); return g;
}
function shade(hex, amt) { const c = new THREE.Color(hex); const h = {}; c.getHSL(h); c.setHSL(h.h, h.s, Math.max(0, Math.min(1, h.l + amt / 100))); return '#' + c.getHexString(); }
const DECO_ONLY = (g) => { g.traverse((m) => { if (m.isMesh) { m.userData.noOcc = true; m.castShadow = false; } }); return g; };

// 충돌 크기 [폭, 깊이]
export const FOOT = {
  desk: [1.0, 0.6], teacher_desk: [1.6, 0.8], organ: [1.4, 0.6], lockers: [3.2, 0.5], stove: [0.7, 0.7], closet: [0.9, 0.6],
  shelf: [1.6, 0.4], bed: [0.9, 1.9], med_cabinet: [1.2, 0.45], wardrobe: [2.2, 0.6], low_desk: [1.0, 0.6], chest: [1.3, 0.6],
  jesa_table: [2.0, 0.8], folding_screen: [3.4, 0.3], jar: [0.7, 0.7], well: [1.6, 1.6], dangsan: [2.2, 2.2], monument: [0.9, 0.5],
  jangseung_m: [0.5, 0.5], jangseung_f: [0.5, 0.5], cairn: [1.4, 1.4], bus_stop: [2.6, 1.0], house: [5, 4], pine: [0.8, 0.8], tree: [0.9, 0.9],
  rock: [1.2, 1.0], pole: [0.3, 0.3], lamp: [0.3, 0.3], altar_stone: [1.6, 0.8], pillar: [0.4, 0.4], pillar_c: [0.8, 0.8], box: [0.8, 0.8],
  drum: [0.8, 0.8], radio: [0.8, 0.5], screen_med: [1.6, 0.2], signpost: [0.3, 0.3], flagpole: [0.25, 0.25], tablets: [1.6, 0.4],
  bench: [1.6, 0.5], gwimun: [3.4, 0.6], iron_door: [2.6, 0.35], safe: [0.7, 0.7], valve: [0.6, 0.6], fountain: [2.6, 2.6], bus: [5.2, 2.2], stall: [2, 1.2],
  jack_box: [0.9, 0.9], balloon_stand: [0.7, 0.7], popcorn_cart: [1.3, 0.8], ticket_booth: [1.9, 1.5], cage: [2.3, 2.3], circus_wagon: [3.1, 1.5], strongman: [0.9, 0.6],
  cups_table: [1.5, 0.8], funhouse_mirror: [1.3, 0.3], vanity_bulb: [1.6, 0.6], bleachers: [6, 2.4], magic_box: [1.3, 1.3], clown_statue: [1.1, 1.1], cannon: [1.4, 2.2], spotlight: [0.7, 0.7],
  burnt_beam: [3, 0.6], scarecrow: [0.6, 0.6],
  swing: [2.0, 1.4], carousel_big: [6.6, 6.6], pirate_frame: [5.6, 3.2], drop_tower: [1.6, 1.6], teacup: [1.8, 1.8], mascot_statue: [1.3, 1.1], turnstile: [1.5, 0.4], park_map: [2, 0.3],
  speaker_pole: [0.3, 0.3], control_panel: [1.6, 0.8], gear_wall: [3, 0.3], ghost_cart: [1.2, 1.6], coffin: [0.8, 2],
};

// 지금 짓는 맵의 테마 (포스터·게시물 그림을 테마에 맞게 그린다)
let THEME = 'gwimun';
export function setPropTheme(id) { THEME = id || 'gwimun'; }
const seedOf = (p) => Math.abs(Math.round((p.x || 0) * 7.3 + (p.z || 0) * 3.1 + (p.y || 0) * 11));

// 테마별 포스터 그림
function posterTex(p) {
  const label = String(p.label || '');
  const th = THEME;
  return canvasTex(180, 240, (x, w, h) => {
    const font = (s, b = 'bold') => `${b} ${s}px "Gowun Dodum", "Nanum Myeongjo", serif`;
    x.textAlign = 'center';
    if (th === 'clown') {
      x.fillStyle = '#1a0a2a'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#c0262d' : '#ffd36a'; x.beginPath(); x.moveTo(w / 2, h * 0.42); const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2; x.lineTo(w / 2 + Math.cos(a0) * 220, h * 0.42 + Math.sin(a0) * 220); x.lineTo(w / 2 + Math.cos(a1) * 220, h * 0.42 + Math.sin(a1) * 220); x.fill(); }
      x.fillStyle = '#f6f2ea'; x.beginPath(); x.ellipse(w / 2, h * 0.42, 42, 52, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#d0101a'; x.beginPath(); x.arc(w / 2, h * 0.44, 9, 0, 7); x.fill();
      x.strokeStyle = '#a0101a'; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, h * 0.45, 24, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
      for (const s of [-1, 1]) { x.fillStyle = '#1a1a40'; x.beginPath(); x.ellipse(w / 2 + s * 16, h * 0.38, 6, 10, 0, 0, 7); x.fill(); x.fillStyle = '#ff5a1a'; x.beginPath(); x.arc(w / 2 + s * 46, h * 0.36, 16, 0, 7); x.fill(); }
      x.fillStyle = '#ffd36a'; x.fillRect(0, 0, w, 36); x.fillStyle = '#7a0a14'; x.font = font(19); x.fillText('BLUE MOON', w / 2, 25);
      x.fillStyle = '#ffd36a'; x.fillRect(0, h - 58, w, 58); x.fillStyle = '#7a0a14'; x.font = font(15); x.fillText(label.slice(0, 11), w / 2, h - 34); x.font = font(11, ''); x.fillText('1998 · 12 · 24  8PM', w / 2, h - 14);
    } else if (th === 'hospital') {
      x.fillStyle = '#e8ecea'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a6a5a'; x.fillRect(0, 0, w, 34); x.fillStyle = '#fff'; x.font = font(15); x.fillText('백야 요양병원', w / 2, 23);
      x.fillStyle = '#1a2a26'; x.font = font(14); x.fillText(label.slice(0, 12), w / 2, 58);
      x.strokeStyle = '#7a8a86'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(14, 76 + i * 16); x.lineTo(w - 14, 76 + i * 16); x.stroke(); }
      x.fillStyle = '#3a4a46'; for (let i = 0; i < 8; i++) x.fillRect(18, 66 + i * 16, 40 + (i * 37) % 80, 4);
      x.fillStyle = '#a01a1a'; x.font = font(12); x.fillText('※ 외부 반출 금지', w / 2, h - 16);
    } else if (th === 'doll') {
      x.fillStyle = '#e6dcc4'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1410'; x.font = font(18); x.fillText('THE GAZETTE', w / 2, 24); x.fillRect(10, 30, w - 20, 2);
      x.font = font(12); x.fillText(label.slice(0, 13), w / 2, 48);
      x.fillStyle = '#8a8278'; x.fillRect(14, 58, 70, 60); x.fillStyle = '#4a443e'; x.beginPath(); x.arc(49, 82, 12, 0, 7); x.fill(); x.fillRect(37, 94, 24, 24);
      x.fillStyle = 'rgba(30,24,20,.7)'; for (let i = 0; i < 14; i++) x.fillRect(i < 5 ? 92 : 14, 60 + (i < 5 ? i : i - 3) * 9 + (i < 5 ? 0 : 36), i < 5 ? 74 : w - 28, 3);
    } else if (th === 'camp') {
      x.fillStyle = '#fff4c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a6a3a'; x.font = font(16); x.fillText('🌲 ' + label.slice(0, 10), w / 2, 30);
      for (let i = 0; i < 6; i++) { x.fillStyle = ['#ff8a5a', '#5ab0ff', '#ffd36a', '#7ed07a'][i % 4]; x.beginPath(); x.arc(24 + i * 26, 52, 7, 0, 7); x.fill(); }
      x.strokeStyle = '#3a3a2a'; x.lineWidth = 1.4; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(16, 76 + i * 15); x.lineTo(w - 16 - (i % 3) * 18, 76 + i * 15); x.stroke(); }
    } else if (th === 'west') {
      x.fillStyle = '#d8c090'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a1a0a'; x.font = font(26); x.fillText('NOTICE', w / 2, 36); x.font = font(13); x.fillText(label.slice(0, 12), w / 2, 60);
      for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(58,26,10,.55)'; x.fillRect(18, 76 + i * 15, w - 36 - (i % 2) * 30, 4); }
    } else if (th === 'kimono') {
      x.fillStyle = '#efe4cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a1a20'; x.beginPath(); x.arc(w / 2, 46, 26, 0, 7); x.fill();
      x.fillStyle = '#1a1010'; x.font = font(14); for (let c = 0; c < 4; c++) for (let r = 0; r < 8; r++) if ((c * 3 + r) % 5) x.fillRect(w - 34 - c * 30, 84 + r * 17, 9, 11);
    } else if (th === 'ophelia') {
      x.fillStyle = '#d8d0b4'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a2a4a'; x.font = font(15); x.fillText('S.S. OPHELIA', w / 2, 26);
      x.strokeStyle = '#1a2a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(30, 110); x.lineTo(150, 110); x.lineTo(136, 130); x.lineTo(44, 130); x.closePath(); x.stroke(); x.fillRect(70, 80, 10, 30); x.fillRect(96, 74, 10, 36);
      x.font = font(12); x.fillStyle = '#2a2a2a'; x.fillText(label.slice(0, 13), w / 2, 160); for (let i = 0; i < 4; i++) x.fillRect(22, 176 + i * 13, w - 44, 3);
    } else {
      x.fillStyle = '#e6dfc8'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = font(16); x.fillText(label.slice(0, 11) || '안내', w / 2, 28);
      for (let i = 0; i < 10; i++) { x.fillRect(16, 46 + i * 17, 70, 4); x.fillRect(100, 46 + i * 17, 46, 4); }
      x.fillStyle = '#a00'; x.fillRect(16, h - 20, w - 32, 4);
    }
    // 낡은 종이: 얼룩 · 가장자리 그을림 · 접힌 자국
    const vg = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7); vg.addColorStop(0, 'rgba(60,40,20,0)'); vg.addColorStop(1, 'rgba(60,40,20,.45)'); x.fillStyle = vg; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, h / 2 - 1, w, 2);
    for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(70,50,30,${Math.random() * 0.08})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  });
}

export function buildProp(p) {
  const g = new THREE.Group();
  const t = p.t;
  switch (t) {
    // ── 바깥
    case 'pine': {
      C(g, 0.12, 0.18, 1.2, '#3b2a1c');
      const pc = p.color || '#1d3324';
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(geo('pine' + i, () => pineCone(1.1 - i * 0.22, 1.3, i)), M(i % 2 ? shade(pc, 3) : pc, { flatShading: true })); c.position.y = 1.4 + i * 0.75; c.rotation.y = i * 0.7; c.castShadow = true; g.add(c); }
      break;
    }
    case 'tree': {
      C(g, 0.14, 0.2, 1.4, '#5a3d27');
      for (const [s, a, b] of [[-1, 0.5, 1.5], [1, -0.6, 1.6]]) { const br = C(g, 0.04, 0.07, 0.8, '#5a3d27', 0, b, 0, 6); br.rotation.z = a; br.position.x = s * 0.18; }
      const tc = p.color || '#ffb7c9';
      const leaf = (r, x, y, z, c) => { const m = new THREE.Mesh(geo('blob' + r3(r), () => blobGeo(r)), M(c, { flatShading: true })); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
      leaf(1.0, 0, 2.1, 0, tc); leaf(0.7, 0.6, 1.8, 0.3, shade(tc, 5)); leaf(0.7, -0.6, 1.9, -0.2, shade(tc, -4)); leaf(0.55, 0.1, 2.75, 0.2, shade(tc, 8));
      break;
    }
    case 'rock': { const r = S(g, 0.6, '#555a58', 0, 0.25, 0); r.scale.set(1.1, 0.6, 0.9); break; }
    case 'house': {
      B(g, 4.6, 2.4, 3.6, '#4d4035');
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.6, 4), M('#2a2522')); roof.position.y = 3.2; roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; g.add(roof);
      B(g, 0.8, 1.4, 0.05, '#1a1410', 0.6, 0, 1.81); B(g, 0.7, 0.6, 0.05, '#2c3a3d', -1.2, 1.1, 1.81, { emissive: '#000' });
      break;
    }
    case 'fence': { const len = p.len || 6; for (let i = 0; i < len; i++) C(g, 0.06, 0.07, 1.2, DWOOD, -len / 2 + i + 0.5, 0, 0, 6); B(g, len, 0.08, 0.06, DWOOD, 0, 0.9, 0); B(g, len, 0.08, 0.06, DWOOD, 0, 0.45, 0); break; }
    case 'pole': { C(g, 0.1, 0.13, 6, '#4a4542'); B(g, 1.4, 0.08, 0.08, '#3a3532', 0, 5.4, 0); break; }
    case 'lamp': {
      // 가로등: 받침 · 기둥 · 장식 고리 · 유리 등갓 · 갓 지붕
      const pole = p.color || '#2d2d30';
      C(g, 0.13, 0.16, 0.25, pole); C(g, 0.05, 0.07, 2.8, pole, 0, 0.2); C(g, 0.09, 0.09, 0.06, pole, 0, 1.0, 0, 10); C(g, 0.08, 0.06, 0.12, pole, 0, 2.86, 0, 8);
      const bulb = S(g, 0.12, '#ffe2a8', 0, 3.1, 0, { emissive: '#ffb347', emissiveIntensity: 2.2 });
      C(g, 0.13, 0.09, 0.3, M('#fff2d0', { transparent: true, opacity: 0.35, roughness: 0.1 }), 0, 2.96, 0, 8).castShadow = false;
      const cap = new THREE.Mesh(geo('lampcap', () => new THREE.ConeGeometry(0.2, 0.16, 8)), M(pole)); cap.position.y = 3.34; g.add(cap);
      if (!p.noLight) { const l = new THREE.PointLight('#ffb35c', 6, 9, 2); l.position.y = 2.9; g.add(l); g.userData.flicker = l; }
      bulb.userData.f = 1;
      break;
    }
    case 'bus_stop': {
      B(g, 2.6, 0.1, 1.0, '#384046', 0, 2.3, 0); for (const s of [-1, 1]) B(g, 0.08, 2.3, 0.08, METAL, 1.2 * s, 0, -0.4);
      B(g, 2.6, 1.5, 0.05, '#2d3e3a', 0, 0.7, -0.45, { transparent: true, opacity: 0.6 });
      Plane(g, 0.7, 0.9, canvasTex(140, 180, (x, w, h) => { x.fillStyle = '#ddd5bb'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = 'bold 16px sans-serif'; x.fillText('서하리', 40, 26); for (let i = 0; i < 5; i++) x.fillRect(16, 50 + i * 22, 100, 4); x.fillStyle = '#900'; x.fillRect(16, 150, 70, 5); }), 0.8, 1.4, -0.42);
      break;
    }
    case 'bench': { B(g, 1.6, 0.08, 0.45, WOOD, 0, 0.42, 0); for (const s of [-1, 1]) B(g, 0.08, 0.42, 0.4, METAL, 0.7 * s, 0, 0); break; }
    case 'flyer': { Plane(g, 0.4, 0.55, canvasTex(80, 110, (x, w, h) => { x.fillStyle = '#d8d0b4'; x.fillRect(0, 0, w, h); x.fillStyle = '#300'; x.font = 'bold 13px sans-serif'; x.fillText('찾습니다', 12, 18); x.fillStyle = '#555'; for (let i = 0; i < 7; i++) x.fillRect(8 + (i % 4) * 17, 30 + Math.floor(i / 4) * 24, 14, 18); }), 0, 0, 0); break; }
    case 'monument': {
      B(g, 0.9, 0.3, 0.5, '#4c4c48'); B(g, 0.6, 1.4, 0.25, '#6d6c66', 0, 0.3, 0);
      Plane(g, 0.5, 1.1, canvasTex(60, 130, (x, w, h) => { x.fillStyle = '#6d6c66'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2a28'; for (let i = 0; i < 9; i++) x.fillRect(22, 10 + i * 13, 16, 7); }), 0, 1.0, 0.13);
      break;
    }
    case 'jangseung_m': case 'jangseung_f': {
      const red = t === 'jangseung_m';
      C(g, 0.22, 0.26, 2.6, red ? '#7a2b1d' : '#6a5a3c', 0, 0, 0, 10);
      const head = C(g, 0.3, 0.26, 0.7, red ? '#93311f' : '#7d6a45', 0, 2.3, 0, 10);
      C(g, 0.38, 0.38, 0.12, '#1a1512', 0, 2.95, 0, 12);
      for (const s of [-1, 1]) S(g, 0.07, '#0a0605', 0.11 * s, 2.72, 0.27);
      B(g, 0.3, 0.06, 0.06, '#f2eee0', 0, 2.48, 0.28);
      break;
    }
    case 'cairn': {
      for (let i = 0; i < 9; i++) { const r = S(g, 0.32 - i * 0.025, '#5c5a55', Math.sin(i * 2.3) * 0.25 * (1 - i / 9), 0.2 + i * 0.17, Math.cos(i * 1.7) * 0.25 * (1 - i / 9)); r.scale.y = 0.6; }
      const colors = ['#2f5fd0', '#c9302c', '#d8b02a', '#e8e8e0', '#151515'];
      colors.forEach((c, i) => { const f = B(g, 0.04, 0.6, 0.2, c, 0.5 * Math.cos(i * 1.25), 0.6, 0.5 * Math.sin(i * 1.25)); f.rotation.y = i; });
      C(g, 0.02, 0.02, 2.2, DWOOD, 0.3, 0, 0);
      break;
    }
    case 'pebble': { const r = S(g, 0.12, '#8a8780', 0, 0.06, 0); r.scale.y = 0.6; break; }
    case 'shoe': { const s = B(g, 0.12, 0.08, 0.26, '#e8e1e6'); B(g, 0.1, 0.01, 0.06, '#ff7fa0', 0, 0.08, 0.05); s.rotation.y = 0.4; break; }
    case 'padlock': { B(g, 0.22, 0.25, 0.08, '#6e5a2a', 0, -0.12, 0, { metalness: 0.6 }); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), M('#888', { metalness: 0.8 })); sh.position.y = 0.13; g.add(sh); break; }
    case 'gate': {
      for (const s of [-1, 1]) { B(g, 0.3, 2.8, 0.3, '#2e2e30', 1.6 * s, 0, 0); }
      for (let i = -6; i <= 6; i++) C(g, 0.025, 0.025, 2.4, '#3a3b3e', i * 0.24, 0, 0, 6);
      B(g, 3.2, 0.08, 0.08, '#3a3b3e', 0, 2.3, 0); B(g, 3.2, 0.08, 0.08, '#3a3b3e', 0, 0.3, 0);
      const ch = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 6, 16), M('#6f6a60', { metalness: 0.7 })); ch.position.set(0, 1.15, 0.1); g.add(ch);
      g.userData.foot = [3.4, 0.4];
      break;
    }
    case 'signpost': {
      C(g, 0.06, 0.07, 2, DWOOD);
      for (let i = 0; i < 3; i++) { const b = B(g, 0.9, 0.18, 0.05, WOOD, 0.3, 1.3 + i * 0.25, 0); b.rotation.y = i * 1.4; }
      break;
    }
    case 'flagpole': {
      C(g, 0.03, 0.04, 3.2, DWOOD);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6, 6, 1), M(p.color || '#fff', { side: THREE.DoubleSide, emissive: p.color, emissiveIntensity: 0.2 }));
      f.position.set(0.47, 2.8, 0); g.add(f); g.userData.flag = f;
      break;
    }
    case 'dangsan': {
      C(g, 0.6, 1.0, 3.2, '#3e2c1e', 0, 0, 0, 12);
      for (let i = 0; i < 6; i++) { const br = C(g, 0.12, 0.22, 2.4, '#3e2c1e', 0, 2.8, 0, 6); br.rotation.z = Math.cos(i) * 0.9; br.rotation.x = Math.sin(i * 1.8) * 0.8; }
      for (let i = 0; i < 7; i++) { const l = S(g, 1.6, '#1f2e1c', Math.cos(i * 0.9) * 2, 4.4 + Math.sin(i * 3) * 0.6, Math.sin(i * 0.9) * 1.8); l.scale.y = 0.6; }
      const rope = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 24), M('#d8cfa8')); rope.rotation.x = Math.PI / 2; rope.position.y = 1.1; g.add(rope);
      const colors = ['#2f5fd0', '#c9302c', '#d8b02a', '#e8e8e0', '#151515'];
      for (let i = 0; i < 18; i++) { const r = B(g, 0.08, 0.5, 0.01, colors[i % 5], Math.cos(i * 0.7) * 2.4, 2.6 + (i % 3) * 0.4, Math.sin(i * 0.7) * 2.2); r.rotation.y = i; }
      break;
    }
    case 'altar_stone': { B(g, 1.6, 0.7, 0.8, '#58554f'); ['#2f5fd0', '#c9302c', '#d8b02a', '#e8e8e0', '#151515'].forEach((c, i) => C(g, 0.1, 0.1, 0.06, c, -0.56 + i * 0.28, 0.7, 0, 10)); break; }
    case 'well': {
      const ring = C(g, 0.8, 0.85, 0.8, '#5b5953', 0, 0, 0, 16);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.66, 20), new THREE.MeshBasicMaterial({ color: '#000' })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.81; g.add(hole);
      for (const s of [-1, 1]) B(g, 0.1, 1.6, 0.1, DWOOD, 0.75 * s, 0.8, 0);
      C(g, 0.06, 0.06, 1.6, WOOD, 0, 2.2, 0).rotation.z = Math.PI / 2;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), M('#2a2420')); roof.position.y = 2.7; roof.rotation.y = Math.PI / 4; g.add(roof);
      B(g, 1.3, 0.04, 1.3, '#4a3a2a', 0, 0.82, 0).rotation.y = 0.2;
      break;
    }
    case 'path_gate': {
      for (const s of [-1, 1]) C(g, 0.12, 0.14, 2.6, '#7a2b1d', 1 * s, 0, 0, 8);
      B(g, 2.6, 0.14, 0.18, '#7a2b1d', 0, 2.5, 0); B(g, 2.2, 0.1, 0.12, '#7a2b1d', 0, 2.2, 0);
      const rope = B(g, 2, 0.03, 0.03, '#d8cfa8', 0, 1.6, 0);
      g.userData.foot = [2.4, 0.4];
      break;
    }
    case 'bus': {
      B(g, 5, 2.2, 2.1, '#3f8f6a', 0, 0.35, 0); B(g, 5.02, 0.6, 2.12, '#e9e2cc', 0, 1.3, 0);
      for (let i = 0; i < 5; i++) B(g, 0.7, 0.5, 2.14, '#9cd6e8', -1.8 + i * 0.9, 1.35, 0, { emissive: '#6af', emissiveIntensity: 0.3 });
      for (const sx of [-1.6, 1.6]) for (const sz of [-1, 1]) { const w = C(g, 0.35, 0.35, 0.25, '#111', sx, 0.35, sz * 1.05, 14); w.rotation.x = Math.PI / 2; w.position.y = 0.35; }
      const sign = B(g, 1.4, 0.3, 0.05, '#222', 0, 2.2, 1.08, { emissive: '#f84', emissiveIntensity: 1 });
      break;
    }
    case 'fountain': { C(g, 1.3, 1.4, 0.5, '#8d8a85', 0, 0, 0, 20); const w = C(g, 1.15, 1.15, 0.05, '#4a7d9a', 0, 0.45, 0, 20, { emissive: '#135', emissiveIntensity: 0.5 }); C(g, 0.15, 0.2, 1.2, '#8d8a85'); S(g, 0.3, '#8d8a85', 0, 1.3, 0); break; }
    case 'stall': { B(g, 2, 0.9, 1.1, '#8a5a3a'); B(g, 2.2, 0.08, 1.3, '#ff8fab', 0, 2.1, 0); for (const s of [-1, 1]) B(g, 0.06, 1.2, 0.06, '#ccc', 1 * s, 0.9, 0.55); break; }
    case 'lantern_string': {
      const len = p.len || 10;
      for (let i = 0; i < len; i++) { const l = S(g, 0.15, ['#ff7f7f', '#ffd27f', '#7fd4ff', '#b5ff7f'][i % 4], -len / 2 + i, 3 + Math.sin(i / len * Math.PI) * -0.4, 0, { emissive: ['#f44', '#fa3', '#3af', '#6f3'][i % 4], emissiveIntensity: 2 }); }
      break;
    }

    // ── 실내 : 교실
    case 'desk': { B(g, 1.0, 0.06, 0.6, WOOD, 0, 0.7, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.05, 0.7, 0.05, METAL, 0.45 * sx, 0, 0.26 * sz); B(g, 0.9, 0.15, 0.5, DWOOD, 0, 0.52, 0); break; }
    case 'chair': { B(g, 0.4, 0.05, 0.4, WOOD, 0, 0.42, 0); B(g, 0.4, 0.4, 0.04, WOOD, 0, 0.47, 0.18); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.03, 0.42, 0.03, METAL, 0.18 * sx, 0, 0.18 * sz); break; }
    case 'teacher_desk': { B(g, 1.6, 0.85, 0.8, '#4f3622'); B(g, 1.7, 0.05, 0.85, '#5f4128', 0, 0.85, 0); B(g, 0.5, 0.15, 0.02, '#3a2616', -0.4, 0.55, 0.41); break; }
    case 'blackboard': {
      const tex = canvasTex(512, 200, (x, w, h) => { x.fillStyle = '#1f3a2c'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.75)'; x.fillStyle = 'rgba(240,240,230,.85)'; x.font = '22px "Gowun Dodum", sans-serif'; x.fillText('11월 7일 (수)', 20, 36); x.fillText('일직: 7번', 20, 70); x.fillText('오늘의 노래: 학교종', 20, 104); x.font = '13px sans-serif'; x.fillText('선생님 우리 숨바꼭질 해요', 330, 180); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(Math.random() * w, Math.random() * h, 60, 10); } });
      B(g, 4.4, 1.5, 0.08, '#5a3f28', 0, 0.85, 0); Plane(g, 4.2, 1.35, tex, 0, 1.6, 0.05);
      B(g, 4.2, 0.05, 0.12, '#5a3f28', 0, 0.85, 0.08);
      break;
    }
    case 'clock': {
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24), M('#e8e0c8')); face.rotation.x = Math.PI / 2; g.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 24), M(DWOOD)); g.add(rim);
      const hh = B(g, 0.025, 0.14, 0.01, '#111', 0, 0, 0.04); hh.position.set(0, 0, 0.04); hh.rotation.z = -(2 + 47 / 60) / 12 * Math.PI * 2; hh.geometry = new THREE.BoxGeometry(0.025, 0.14, 0.01).translate(0, 0.07, 0);
      const mh = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.22, 0.01).translate(0, 0.11, 0), M('#111')); mh.position.z = 0.045; mh.rotation.z = -(47 / 60) * Math.PI * 2; g.add(mh);
      break;
    }
    case 'organ': {
      B(g, 1.4, 0.9, 0.6, '#3b2416'); B(g, 1.4, 0.5, 0.2, '#3b2416', 0, 0.9, -0.2);
      B(g, 1.2, 0.04, 0.18, '#f2eee2', 0, 0.9, 0.12);
      for (let i = 0; i < 9; i++) B(g, 0.05, 0.03, 0.1, '#111', -0.5 + i * 0.125, 0.94, 0.08);
      B(g, 0.5, 0.35, 0.02, PAPER, 0, 1.05, -0.08).rotation.x = -0.2;
      break;
    }
    case 'lockers': {
      for (let i = 0; i < 8; i++) { B(g, 0.38, 1.0, 0.45, i === 6 ? '#5e4126' : WOOD, -1.4 + i * 0.4, 0, 0); B(g, 0.05, 0.05, 0.02, '#ccc', -1.4 + i * 0.4 + 0.12, 0.6, 0.23); }
      B(g, 3.25, 0.05, 0.5, DWOOD, 0, 1.0, 0);
      break;
    }
    case 'ddakji': { B(g, 0.14, 0.03, 0.14, '#c94a3a'); B(g, 0.1, 0.01, 0.1, '#3a6ac9', 0, 0.03, 0).rotation.y = 0.78; break; }
    case 'stove': { C(g, 0.32, 0.34, 0.8, '#3c3c3e', 0, 0.1, 0, 14); C(g, 0.08, 0.08, 2.4, '#4a4a4c', 0, 0.9, 0, 8); for (const s of [-1, 1]) B(g, 0.05, 0.12, 0.05, '#333', 0.22 * s, 0, 0); break; }
    case 'curtain': { for (let i = 0; i < 6; i++) { const f = B(g, 0.25, 2.4, 0.05, '#7a6b4f', -0.6 + i * 0.24, 0.3, (i % 2) * 0.06); } break; }
    case 'closet': { B(g, 0.9, 2.0, 0.6, '#5a6157'); B(g, 0.02, 1.8, 0.02, '#222', 0, 0.1, 0.31); B(g, 0.05, 0.15, 0.04, '#bbb', 0.1, 1.0, 0.32); break; }
    case 'window': {
      B(g, 1.8, 1.3, 0.06, '#2a2f33', 0, 1.0, 0, { emissive: '#0a1420', emissiveIntensity: 1 });
      B(g, 0.05, 1.3, 0.1, WOOD, 0, 1.0, 0.02); B(g, 1.8, 0.05, 0.1, WOOD, 0, 1.63, 0.02);
      break;
    }
    case 'shelf': { B(g, 1.6, 1.8, 0.4, '#4a3423'); for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) if (Math.random() > 0.3) B(g, 0.12 + Math.random() * 0.1, 0.3, 0.25, ['#5a2a2a', '#2a3a5a', '#3a5a2a', '#6a5a3a'][j % 4], -0.6 + j * 0.28, 0.1 + i * 0.44, 0.05); break; }
    case 'flag_tk': { Plane(g, 0.9, 0.6, canvasTex(90, 60, (x, w, h) => { x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#c33'; x.beginPath(); x.arc(45, 30, 12, Math.PI, 0); x.fill(); x.fillStyle = '#336'; x.beginPath(); x.arc(45, 30, 12, 0, Math.PI); x.fill(); }), 0, 2.4, 0.06); break; }
    case 'door': {
      B(g, 1.1, 2.2, 0.12, '#3d2c1e'); B(g, 1.2, 0.1, 0.16, '#2a1e14', 0, 2.2, 0);
      B(g, 0.6, 0.6, 0.02, '#1c2226', 0, 1.3, 0.07, { emissive: '#000' }); S(g, 0.05, '#b89a5a', 0.4, 1.05, 0.09, { metalness: 0.8 });
      g.userData.foot = [1.2, 0.3];
      break;
    }
    // ── 숙직실/양호실
    case 'box': { B(g, 0.7, 0.6, 0.7, '#6d5a3c'); break; }
    case 'bucket': { C(g, 0.18, 0.14, 0.32, '#7a7f84'); break; }
    case 'screen_med': { for (let i = 0; i < 3; i++) { B(g, 0.5, 1.6, 0.03, '#d9dcd4', -0.55 + i * 0.55, 0.15, 0).rotation.y = (i - 1) * 0.3; } break; }
    case 'uniform': { B(g, 0.55, 0.75, 0.12, '#4c5a3a'); B(g, 0.12, 0.04, 0.02, '#ddd', 0.12, 0.55, 0.07); B(g, 0.06, 0.3, 0.1, '#3a462c', -0.3, 0.3, 0); B(g, 0.06, 0.3, 0.1, '#3a462c', 0.3, 0.3, 0); break; }
    case 'futon': { B(g, 1.0, 0.12, 2.0, '#b04a4a'); B(g, 0.6, 0.15, 0.3, '#e8dcc6', 0, 0.12, -0.75); B(g, 0.96, 0.08, 1.2, '#a33', 0, 0.12, 0.35); break; }
    case 'mirror': { B(g, 0.7, 0.9, 0.04, '#2a2a2a'); B(g, 0.6, 0.8, 0.02, '#9fb3bd', 0, 0.05, 0.02, { metalness: 0.9, roughness: 0.1 }); B(g, 0.7, 0.15, 0.4, '#d8d8d0', 0, -0.5, 0.15); break; }
    case 'poster': {
      const pl = Plane(g, 0.9, 1.15, posterTex(p), 0, 0, 0.02); pl.rotation.z = ((seedOf(p) % 7) - 3) * 0.012;
      // 귀퉁이를 고정한 압정/테이프
      for (const [sx, sy] of [[-0.4, 0.52], [0.4, 0.52]]) S(g, 0.018, THEME === 'clown' ? '#ffd36a' : '#c0262d', sx, sy, 0.035, { metalness: 0.5 });
      B(g, 0.14, 0.04, 0.004, '#e8dcb0', 0.36, -0.58, 0.025).rotation.z = 0.5;
      break;
    }
    case 'med_cabinet': { B(g, 1.2, 1.8, 0.45, '#d6d8d0'); B(g, 1.1, 1.0, 0.02, '#9cb', 0, 0.75, 0.23, { transparent: true, opacity: 0.5 }); B(g, 0.1, 0.1, 0.03, '#c33', 0, 1.65, 0.24); for (let i = 0; i < 7; i++) C(g, 0.04, 0.04, 0.14, '#6a3a1a', -0.45 + i * 0.15, 1.05, 0); break; }
    case 'bed': { B(g, 0.9, 0.5, 1.9, '#9aa0a2'); B(g, 0.86, 0.12, 1.85, '#e8e6df', 0, 0.5, 0); B(g, 0.5, 0.12, 0.3, '#fff', 0, 0.62, -0.7); B(g, 0.9, 0.8, 0.05, '#7f8587', 0, 0.3, -0.95); break; }
    case 'fusebox': { B(g, 0.5, 0.6, 0.15, '#4a4d50', 0, -0.3, 0); B(g, 0.4, 0.06, 0.02, '#c33', 0, -0.05, 0.08); break; }
    case 'radio': { B(g, 0.8, 0.6, 0.6, '#3a2b1d'); B(g, 0.7, 0.5, 0.45, '#5d4126', 0, 0.6, 0); B(g, 0.4, 0.25, 0.02, '#c9b583', -0.1, 0.75, 0.23, { emissive: '#552', emissiveIntensity: 0.4 }); S(g, 0.05, '#222', 0.22, 0.75, 0.24); S(g, 0.05, '#222', 0.22, 0.9, 0.24); break; }
    case 'handle': { const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), M('#b89a5a', { metalness: 0.7, emissive: '#331', emissiveIntensity: 0.6 })); h.position.y = 0; g.add(h); break; }
    case 'wardrobe': { B(g, 2.2, 2.1, 0.6, '#4b3221'); B(g, 0.02, 1.9, 0.02, '#1a0f08', 0, 0.1, 0.31); for (const s of [-1, 1]) B(g, 1.0, 0.04, 0.02, '#8a6a3a', 0.55 * s, 1.8, 0.31); break; }
    case 'ribbon': { for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), M('#d22')); w.rotation.z = (Math.PI / 2) * s; w.position.set(0.05 * s, 0.05, 0); g.add(w); } break; }
    case 'key': { C(g, 0.01, 0.01, 0.16, '#d4b25a', 0, 0.02, 0, 6, { metalness: 0.8 }).rotation.z = Math.PI / 2; const r = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), M('#d4b25a', { metalness: 0.8 })); r.position.set(-0.1, 0.03, 0); r.rotation.x = Math.PI / 2; g.add(r); break; }
    // ── 이장댁
    case 'pillar': { C(g, 0.18, 0.2, 3, '#5c3d24', 0, 0, 0, 10); break; }
    case 'lantern': { C(g, 0.03, 0.03, 1.6, DWOOD); const l = C(g, 0.18, 0.18, 0.4, '#d8c48a', 0, 1.6, 0, 10, { emissive: '#f93', emissiveIntensity: 2.2 }); const pl = new THREE.PointLight('#ff9944', 3, 6, 2); pl.position.y = 1.8; g.add(pl); g.userData.flicker = pl; break; }
    case 'cushion': { B(g, 0.6, 0.1, 0.6, '#7a2a3a'); break; }
    case 'tablets': { B(g, 1.6, 0.25, 0.4, '#2a1a12'); for (let i = 0; i < 7; i++) { B(g, 0.14, 0.5, 0.06, '#1a120c', -0.66 + i * 0.22, 0.25, 0); B(g, 0.08, 0.36, 0.01, '#e8e0c8', -0.66 + i * 0.22, 0.3, 0.035); } break; }
    case 'folding_screen': { for (let i = 0; i < 8; i++) { const pnl = B(g, 0.42, 1.8, 0.04, '#e3d8b8', -1.5 + i * 0.43, 0, (i % 2) * 0.08); pnl.rotation.y = (i % 2 ? 0.25 : -0.25); B(g, 0.06, 1.2, 0.01, '#222', -1.5 + i * 0.43, 0.3, (i % 2) * 0.08 + 0.025); } break; }
    case 'jesa_table': {
      B(g, 2.0, 0.08, 0.8, '#5a1e14', 0, 0.55, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.08, 0.55, 0.08, '#4a160e', 0.9 * sx, 0, 0.33 * sz);
      for (let i = 0; i < 5; i++) C(g, 0.13, 0.08, 0.1, '#c8b88a', -0.8 + i * 0.4, 0.63, 0.22, 10);
      for (let i = 0; i < 2; i++) { C(g, 0.03, 0.04, 0.3, '#eee', -0.6 + i * 1.2, 0.63, -0.25, 8); const f = S(g, 0.03, '#fc6', -0.6 + i * 1.2, 0.98, -0.25, { emissive: '#f84', emissiveIntensity: 3 }); }
      const pl = new THREE.PointLight('#ff8844', 2.5, 5, 2); pl.position.set(0, 1.2, -0.2); g.add(pl); g.userData.flicker = pl;
      const fruit = ['#7a2a1a', '#7a5a3a', '#d8d090', '#d87a2a', '#c8221a'];
      for (let i = 0; i < 6; i++) S(g, 0.07, fruit[i % 5], -0.5 + Math.random(), 0.06, 0.6 + Math.random() * 0.3);
      break;
    }
    case 'top': { const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 10), M('#a8743a')); c.rotation.x = Math.PI; c.position.y = 0.07; g.add(c); C(g, 0.08, 0.08, 0.03, '#8a5a2a', 0, 0.12, 0); break; }
    case 'book': {
      // 펼쳐진 공책: 표지 + 양쪽 페이지(살짝 V자) + 책갈피 끈
      const cover = { camp: '#3a6a8a', clown: '#5a1a3a', hospital: '#2a4a44', doll: '#5a2030', kimono: '#6a1a1a', west: '#4a3018', ophelia: '#1a2a3a' }[THEME] || '#4a2a1a';
      B(g, 0.44, 0.025, 0.31, cover);
      for (const s of [-1, 1]) { const pg = Plane(g, 0.2, 0.28, paperTex('bookpg' + THEME + s, { w: 96, h: 128, lines: 11, stain: s > 0, base: '#efe8d4' }), 0.104 * s, 0.04, 0); pg.rotation.set(-Math.PI / 2, -s * 0.1, 0); }
      B(g, 0.014, 0.022, 0.29, '#d8d0b8', 0, 0.025, 0);
      B(g, 0.012, 0.004, 0.16, '#a01a20', 0.03, 0.045, 0.19);
      break;
    }
    case 'photo': {
      // 흑백 사진 액자: 나무 테 + 매트지 + 세피아 사진 + 유리 반사
      B(g, 0.54, 0.66, 0.05, '#2a1a10'); B(g, 0.46, 0.58, 0.012, '#e8e0cc', 0, 0.04, 0.02);
      Plane(g, 0.36, 0.46, canvasTex(72, 92, (x, w, h) => {
        const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a8a090'); gr.addColorStop(1, '#6a6458'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
        x.fillStyle = '#2a2622'; x.beginPath(); x.arc(36, 30, 11, 0, 7); x.fill(); x.fillRect(22, 41, 28, 34); x.fillStyle = '#d8d0c0'; x.beginPath(); x.arc(36, 70, 8, 0, 7); x.fill(); x.fillRect(28, 76, 16, 14);
        const vg = x.createRadialGradient(36, 46, 10, 36, 46, 60); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,20,10,.6)'); x.fillStyle = vg; x.fillRect(0, 0, w, h);
      }, 'photoPic'), 0, 0.33, 0.028);
      const gl = Plane(g, 0.46, 0.58, canvasTex(32, 32, (x) => { const gg = x.createLinearGradient(0, 0, 32, 32); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.45, 'rgba(255,255,255,.18)'); gg.addColorStop(0.55, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(0, 0, 32, 32); }, 'glassSheen'), 0, 0.33, 0.032, { transparent: true, depthWrite: false });
      gl.userData.noOcc = true;
      break;
    }
    case 'chest': { B(g, 1.3, 0.75, 0.6, '#3a1e12'); B(g, 1.2, 0.35, 0.02, '#52301c', 0, 0.38, 0.31); for (let i = 0; i < 6; i++) S(g, 0.03, '#d8d8f0', -0.5 + i * 0.2, 0.55, 0.31, { metalness: 0.5, emissive: '#446', emissiveIntensity: 0.6 }); B(g, 0.12, 0.12, 0.03, '#c9a24a', 0, 0.5, 0.32, { metalness: 0.8 }); break; }
    case 'jar': { const j = S(g, 0.35, '#3b2a1e', 0, 0.4, 0, { roughness: 0.4 }); j.scale.y = 1.2; C(g, 0.22, 0.25, 0.08, '#2e2018', 0, 0.78, 0); break; }
    case 'big_gate': { for (const s of [-1, 1]) { B(g, 0.4, 3.2, 0.4, '#3a2416', 1.4 * s, 0, 0); B(g, 1.2, 2.6, 0.12, '#4a2e1a', 0.62 * s, 0, 0); } B(g, 3.4, 0.3, 0.6, '#2a2420', 0, 3.1, 0); B(g, 2.6, 0.18, 0.18, '#5a3a22', 0, 1.2, 0.12); g.userData.foot = [3.2, 0.4]; break; }
    // ── 우물/신당
    case 'marble': { S(g, 0.06, '#3a7aff', 0, 0.06, 0, { roughness: 0.1, transparent: true, opacity: 0.85, emissive: '#13a', emissiveIntensity: 0.6 }); break; }
    case 'candles': { for (let i = 0; i < 9; i++) { const x = (i % 3) * 0.22 - 0.22, z = Math.floor(i / 3) * 0.2 - 0.2; C(g, 0.03, 0.03, 0.2 + (i % 3) * 0.1, '#eee', x, 0.9, z, 8); S(g, 0.025, '#fd6', x, 1.12 + (i % 3) * 0.1, z, { emissive: '#f93', emissiveIntensity: 3 }); } B(g, 0.9, 0.9, 0.6, '#3a1a12'); const pl = new THREE.PointLight('#ff8a3a', 3.5, 7, 2); pl.position.y = 1.4; g.add(pl); g.userData.flicker = pl; break; }
    case 'drum': { for (const s of [-1, 1]) { const d = C(g, 0.26, 0.12, 0.35, '#8a2a1a', 0.2 * s, 0.4, 0, 16); d.rotation.z = (Math.PI / 2) * s; d.position.set(0.2 * s, 0.5, 0); const sk = C(g, 0.3, 0.3, 0.02, '#e8dcc0', 0.38 * s, 0.4, 0, 16); sk.rotation.z = Math.PI / 2; sk.position.set(0.38 * s, 0.5, 0); } B(g, 0.06, 0.3, 0.06, DWOOD, 0.4, 0, 0.3); B(g, 0.06, 0.3, 0.06, DWOOD, -0.4, 0, 0.3); break; }
    case 'beam': { B(g, 14, 0.3, 0.3, '#3a2416', 0, 3.4, 0); break; }
    case 'noose': { C(g, 0.015, 0.015, 1.4, '#e8e0c8', 0, 2.0, 0, 6); const n = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 14), M('#e8e0c8')); n.position.y = 1.95; g.add(n); g.userData.swing = n.parent; break; }
    case 'painting': {
      const names = { p: ['칠성', '산신', '용왕', '바리'] };
      const col = ['#6a1e1e', '#2e4a2a', '#1e3a5a', '#5a3a6a'][Math.abs(Math.round(p.x * 3 + p.z)) % 4];
      B(g, 1.1, 1.5, 0.04, '#2a1a10', 0, -0.75, 0);
      Plane(g, 1.0, 1.4, canvasTex(100, 140, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); x.fillStyle = '#d8b878'; x.beginPath(); x.arc(50, 40, 18, 0, 7); x.fill(); x.fillStyle = '#c8a058'; x.fillRect(30, 60, 40, 60); x.fillStyle = '#000'; x.fillRect(42, 36, 5, 5); x.fillRect(54, 36, 5, 5); x.strokeStyle = '#e8c870'; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8); }), 0, 0, 0.025);
      break;
    }
    case 'low_desk': { B(g, 1.0, 0.05, 0.6, '#4a2e1c', 0, 0.35, 0); for (const sx of [-1, 1]) B(g, 0.06, 0.35, 0.5, '#3a2416', 0.45 * sx, 0, 0); B(g, 0.6, 0.01, 0.4, PAPER, 0, 0.4, 0); break; }
    case 'bowl': { C(g, 0.12, 0.08, 0.08, '#b8943a', 0, 0, 0, 12, { metalness: 0.7 }); C(g, 0.1, 0.1, 0.02, '#c21', 0, 0.06, 0, 12); break; }
    case 'bell': { for (let i = 0; i < 3; i++) S(g, 0.04, '#d4b25a', -0.05 + i * 0.05, 0.08, 0, { metalness: 0.9 }); C(g, 0.015, 0.015, 0.2, '#6a4a2a', 0, 0.1, 0, 6); break; }
    case 'rubberband': { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), M('#f2d23a')); r.rotation.x = Math.PI / 2; r.position.y = 0.02; g.add(r); break; }
    case 'ladder': { for (const s of [-1, 1]) B(g, 0.06, 3.2, 0.06, WOOD, 0.25 * s, 0, 0); for (let i = 0; i < 9; i++) B(g, 0.5, 0.04, 0.05, WOOD, 0, 0.3 + i * 0.34, 0); g.rotation.x = -0.15; break; }
    case 'fan': { const f = new THREE.Mesh(new THREE.CircleGeometry(0.25, 16, 0, Math.PI), M('#e8d28a', { side: THREE.DoubleSide })); f.rotation.x = -Math.PI / 2; f.position.y = 0.03; g.add(f); break; }
    // ── 방공호
    case 'stairs': { for (let i = 0; i < 6; i++) B(g, 2.4, 0.3 * (i + 1), 0.4, '#3a3632', 0, 0, -i * 0.4 + 1); break; }
    case 'stairs_up': { for (let i = 0; i < 6; i++) B(g, 2.4, 0.25 * (i + 1), 0.35, '#4a4440', 0, 0, i * 0.12 - 0.3); g.userData.foot = [2.4, 0.8]; break; }
    case 'pillar_c': { B(g, 0.8, 3.2, 0.8, '#3c3832'); break; }
    case 'puddle': { const w = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), M('#0c1416', { roughness: 0.05, metalness: 0.6 })); w.rotation.x = -Math.PI / 2; w.position.y = 0.01; g.add(w); break; }
    case 'wall_marks': { Plane(g, 2.2, 1.2, canvasTex(220, 120, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(200,180,160,.55)'; x.lineWidth = 1.5; for (let i = 0; i < 160; i++) { const bx = (i % 20) * 10 + 6, by = Math.floor(i / 20) * 14 + 6; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + (i % 5 === 4 ? -8 : 1), by + 10); x.stroke(); } }), 0, 0, 0.02, { transparent: true }); break; }
    case 'child_ghost': {
      const mm = new THREE.MeshStandardMaterial({ color: '#c8d0cc', transparent: true, opacity: 0.55, emissive: '#2a3a44', emissiveIntensity: 0.8 });
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.3, 4, 10), mm); b.position.y = 0.38; g.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), mm); h.position.y = 0.8; g.add(h);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), new THREE.MeshBasicMaterial({ color: '#080808' })); hair.position.y = 0.82; g.add(hair);
      g.rotation.y = Math.PI;
      break;
    }
    case 'valve': { C(g, 0.1, 0.1, 1, '#4a4a46'); const w = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 18), M('#8a2a1a', { metalness: 0.5 })); w.position.y = 1.05; g.add(w); g.userData.valve = w; break; }
    case 'gwimun': {
      B(g, 3.4, 3.4, 0.4, '#1a1412');
      Plane(g, 2.6, 3.0, canvasTex(260, 300, (x, w, h) => { x.fillStyle = '#0a0606'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a0c06'; x.lineWidth = 6; x.strokeRect(20, 20, w - 40, h - 40); x.beginPath(); x.moveTo(w / 2, 20); x.lineTo(w / 2, h - 20); x.stroke(); x.fillStyle = '#9a0e08'; x.font = 'bold 60px serif'; x.fillText('鬼', 40, 120); x.fillText('門', 160, 120); for (let i = 0; i < 40; i++) { x.fillRect(Math.random() * w, Math.random() * h, 3, 18 + Math.random() * 30); } }), 0, 1.6, 0.21, { emissive: '#300', emissiveIntensity: 0.6 });
      const pl = new THREE.PointLight('#ff2010', 4, 8, 2); pl.position.set(0, 2, 1); g.add(pl); g.userData.flicker = pl;
      break;
    }
    case 'gwimun_core': { S(g, 0.25, '#ff2a1a', 0, 0, 0, { emissive: '#f20', emissiveIntensity: 3 }); break; }
    case 'paper': {
      // 실제 종이 한 장: 글씨 줄 · 얼룩 · 접힌 귀퉁이
      const k = seedOf(p) % 4;
      const sh = Plane(g, 0.3, 0.22, paperTex('paper' + THEME + k, { w: 128, h: 96, lines: 6, base: THEME === 'hospital' ? '#eef0ec' : THEME === 'clown' ? '#f2e6c8' : PAPER }), 0, 0.006, 0);
      sh.rotation.set(-Math.PI / 2, 0, (k - 1.5) * 0.25); sh.receiveShadow = true;
      const fold = B(g, 0.05, 0.003, 0.05, '#cfc6aa', 0.12, 0.008, 0.085); fold.rotation.y = 0.78 + (k - 1.5) * 0.25;
      break;
    }
    case 'lostbox': { B(g, 0.5, 0.45, 0.3, '#5a4a32', 0, -0.2, 0); B(g, 0.4, 0.05, 0.02, '#d8d0b4', 0, 0.12, 0.16); C(g, 0.06, 0.06, 0.03, '#888', 0.12, -0.05, 0.16, 12, { metalness: 0.8 }).rotation.x = Math.PI / 2; break; }
    case 'eye': { S(g, 0.08, '#c8a06a', 0, 0.08, 0); S(g, 0.04, '#1a1008', 0, 0.1, 0.06); break; }
    case 'duty_board': { B(g, 0.8, 0.35, 0.04, '#3a2616', 0, -0.17, 0); Plane(g, 0.72, 0.28, canvasTex(144, 56, (x, w, h) => { x.fillStyle = '#e9e2cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = 'bold 16px sans-serif'; x.fillText('오늘의 일직', 10, 22); x.fillRect(10, 40, 120, 2); }), 0, 0, 0.025); break; }
    case 'timetable': { B(g, 1.6, 1.1, 0.04, '#5a3f28', 0, -0.55, 0); Plane(g, 1.5, 1.0, canvasTex(300, 200, (x, w, h) => { x.fillStyle = '#efe8d4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#555'; for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(i * 50, 0); x.lineTo(i * 50, h); x.stroke(); } for (let j = 0; j <= 5; j++) { x.beginPath(); x.moveTo(0, j * 40); x.lineTo(w, j * 40); x.stroke(); } x.font = '14px sans-serif'; x.fillStyle = '#222'; ['월', '화', '수', '목', '금', '토'].forEach((d, i) => x.fillText(d, i * 50 + 18, 26)); x.fillStyle = '#a00'; x.fillRect(102, 42, 46, 156); }), 0, 0, 0.025); break; }
    case 'safe': { B(g, 0.7, 0.7, 0.7, '#3c3f44', 0, 0, 0, { metalness: 0.6, roughness: 0.4 }); C(g, 0.12, 0.12, 0.04, '#b8b8b8', 0, 0.35, 0.36, 16, { metalness: 0.9 }).rotation.x = Math.PI / 2; break; }
    case 'scroll': { B(g, 0.7, 0.04, 0.05, '#2a1a10', 0, 0.75, 0); Plane(g, 0.6, 1.4, canvasTex(60, 140, (x, w, h) => { x.fillStyle = '#e6dcc0'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; for (let c = 0; c < 4; c++) for (let r = 0; r < 7; r++) x.fillRect(44 - c * 12, 12 + r * 16, 7, 10); x.fillStyle = '#b22'; x.fillRect(6, 120, 8, 8); }), 0, 0, 0.02); B(g, 0.7, 0.04, 0.05, '#2a1a10', 0, -0.75, 0); break; }
    case 'attic_door': { B(g, 1.0, 0.8, 0.06, '#4a2e1c', 0, -0.4, 0); B(g, 0.9, 0.03, 0.08, '#2a1a10', 0, 0, 0); B(g, 0.03, 0.7, 0.08, '#2a1a10', 0, -0.35, 0); S(g, 0.04, '#c9a24a', 0.15, -0.05, 0.05, { metalness: 0.8 }); break; }
    case 'iron_door': { B(g, 2.4, 3.2, 0.2, '#4a3a30', 0, 0, 0, { metalness: 0.6, roughness: 0.7 }); for (let i = 0; i < 6; i++) B(g, 2.4, 0.05, 0.24, '#2e2420', 0, 0.3 + i * 0.5, 0, { metalness: 0.5 }); B(g, 0.25, 0.3, 0.08, '#6a5a3a', 0.3, 1.2, 0.14, { metalness: 0.8 }); break; }
    // ── 시나리오 2: 배 · 등대
    case 'barrel': { C(g, 0.38, 0.38, 0.95, '#6a4a2e', 0, 0, 0, 14); for (const y of [0.15, 0.8]) C(g, 0.4, 0.4, 0.06, '#3a3a3c', 0, y, 0, 14, { metalness: 0.6 }); break; }
    case 'crate': { B(g, 0.9, 0.8, 0.9, '#7a5a36'); B(g, 0.92, 0.08, 0.92, '#5a3e22', 0, 0.4, 0); B(g, 0.08, 0.82, 0.92, '#5a3e22', 0, 0, 0); break; }
    case 'gold_crate': { B(g, 1.1, 0.8, 0.8, '#6a4a2a'); Plane(g, 0.5, 0.5, canvasTex(64, 64, (x) => { x.fillStyle = '#6a4a2a'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#e8c170'; x.font = 'bold 44px serif'; x.fillText('金', 10, 48); }), 0, 0.42, 0.41); break; }
    case 'dock': { for (let i = 0; i < 8; i++) B(g, 0.45, 0.12, 5, '#5a4630', -1.6 + i * 0.46, 0, 0); for (const s of [-1, 1]) for (const z of [-2, 2]) C(g, 0.1, 0.1, 0.9, '#3a2a1a', 1.9 * s, -0.6, z, 6); break; }
    case 'lighthouse': {
      C(g, 1.5, 2.1, 9, '#e8e4dc', 0, 0, 0, 20);
      for (let i = 0; i < 3; i++) C(g, 1.52 + i * 0.12 - 0.3 * i, 1.58 + 0.14 * (2 - i), 0.8, '#a3262d', 0, 1.5 + i * 3, 0, 20);
      C(g, 1.6, 1.6, 0.2, '#2a2a2a', 0, 9, 0, 20); C(g, 1.1, 1.1, 1.6, '#cfe3ff', 0, 9.2, 0, 16, { transparent: true, opacity: 0.6, emissive: '#fff4c8', emissiveIntensity: 0.4 });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.2, 16), M('#2a2a2a')); roof.position.y = 11.4; g.add(roof);
      g.userData.foot = [3.6, 3.6]; break;
    }
    case 'tide_board': { C(g, 0.06, 0.06, 1.2, '#3a2a1a', -0.6); C(g, 0.06, 0.06, 1.2, '#3a2a1a', 0.6); B(g, 1.4, 0.9, 0.05, '#6a7a7a', 0, 1.1, 0); Plane(g, 1.3, 0.8, canvasTex(130, 80, (x, w, h) => { x.fillStyle = '#d8d0b4'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = 'bold 13px sans-serif'; x.fillText('물때표', 44, 18); for (let i = 0; i < 4; i++) x.fillRect(10, 30 + i * 12, 100 - i * 10, 3); }), 0, 1.55, 0.03); break; }
    case 'shed': { B(g, 3, 2.4, 2.6, '#4a5054'); const r = B(g, 3.3, 0.15, 3, '#2a2c2e', 0, 2.4, 0); r.rotation.z = 0.08; B(g, 1.2, 1.9, 0.06, '#5a3a24', -1.53, 0, 0).rotation.y = Math.PI / 2; g.userData.foot = [3, 2.6]; break; }
    case 'signal_lamp': { C(g, 0.06, 0.08, 1.6, '#3a3a3a'); const l = C(g, 0.22, 0.22, 0.35, '#5a5a5a', 0, 1.6, 0, 14, { metalness: 0.6 }); l.rotation.x = Math.PI / 2; S(g, 0.16, '#ffd58a', 0, 1.78, 0.18, { emissive: '#ffb347', emissiveIntensity: 2.5 }); const pl = new THREE.PointLight('#ffb35c', 3, 6, 2); pl.position.set(0, 1.8, 0.4); g.add(pl); g.userData.blink = pl; break; }
    case 'lh_door': { B(g, 1.3, 2.2, 0.15, '#3a3a40', 0, 0, 0, { metalness: 0.6 }); B(g, 1.5, 0.12, 0.2, '#2a2a2e', 0, 2.2, 0); S(g, 0.05, '#b89a5a', 0.45, 1.1, 0.1, { metalness: 0.8 }); g.userData.foot = [1.4, 0.3]; break; }
    case 'easel': { for (const s of [-1, 1]) B(g, 0.05, 1.5, 0.05, WOOD, 0.3 * s, 0, 0).rotation.z = 0.1 * s; Plane(g, 0.8, 0.6, canvasTex(80, 60, (x) => { x.fillStyle = '#d8e0e8'; x.fillRect(0, 0, 80, 60); x.fillStyle = '#2a4a8a'; [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]].forEach(([c, r]) => x.fillRect(16 + c * 17, 6 + r * 17, 14, 14)); }), 0, 1.2, 0.04); break; }
    case 'panel': { B(g, 0.9, 1.1, 0.4, '#3a3e44', 0, 0, 0, { metalness: 0.5 }); for (let i = 0; i < 9; i++) B(g, 0.15, 0.04, 0.15, '#7a8a9a', -0.22 + (i % 3) * 0.22, 1.1, -0.1 + Math.floor(i / 3) * 0.12, { emissive: '#223', emissiveIntensity: 0.6 }); break; }
    case 'rowboat': { const h = B(g, 1.3, 0.5, 3.2, '#5a3a22'); B(g, 1.1, 0.06, 0.3, '#7a5a3a', 0, 0.45, -0.4); B(g, 1.1, 0.06, 0.3, '#7a5a3a', 0, 0.45, 0.6); C(g, 0.03, 0.03, 2, '#8a6a4a', 0.8, 0.5, 0, 6).rotation.x = 1.2; g.userData.foot = [1.4, 3.2]; break; }
    case 'bunk': { B(g, 0.9, 0.08, 1.9, METAL, 0, 0.45, 0); B(g, 0.9, 0.08, 1.9, METAL, 0, 1.45, 0); B(g, 0.8, 0.12, 1.8, '#b0a890', 0, 0.53, 0); B(g, 0.8, 0.12, 1.8, '#9a9278', 0, 1.53, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.05, 2, 0.05, METAL, 0.43 * sx, 0, 0.93 * sz); g.userData.foot = [1, 2]; break; }
    case 'pipes': { for (let i = 0; i < 3; i++) { const p = C(g, 0.08, 0.08, 18, '#5a5048', 0, 2.6 + i * 0.25, 0, 8, { metalness: 0.5 }); p.rotation.z = Math.PI / 2; p.position.set(0, 2.6 + i * 0.25, 0); } break; }
    case 'porthole': { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 8, 20), M('#8a7a5a', { metalness: 0.8 })); g.add(r); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), M('#1a2a3a', { emissive: '#0a1a2a', emissiveIntensity: 1, roughness: 0.1 })); gl.position.z = 0.01; g.add(gl); break; }
    case 'lifebuoy': { const r = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 10, 20), M('#e8e0d0')); g.add(r); for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.105, 10, 4, Math.PI / 6), M('#c0262d')); s.rotation.z = (i * Math.PI) / 2; g.add(s); } break; }
    case 'table': { B(g, 1.2, 0.06, 0.8, WOOD, 0, 0.75, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.06, 0.75, 0.06, DWOOD, 0.52 * sx, 0, 0.33 * sz); g.userData.foot = [1.2, 0.8]; break; }
    case 'cabin_door': { B(g, 1.0, 2.1, 0.1, '#4a3e30'); Plane(g, 0.4, 0.4, canvasTex(64, 64, (x) => { x.fillStyle = '#4a3e30'; x.fillRect(0, 0, 64, 64); x.fillStyle = p.color || '#fff'; x.beginPath(); x.arc(32, 32, 22, 0, 7); x.fill(); }), 0, 1.5, 0.06); S(g, 0.04, '#b89a5a', 0.35, 1.0, 0.07, { metalness: 0.8 }); break; }
    case 'pump': { B(g, 0.4, 1.0, 0.3, '#5a5048', 0, 0, 0, { metalness: 0.5 }); const lv = B(g, 0.06, 0.6, 0.06, '#c0262d', 0, 1.0, 0.1); lv.rotation.x = 0.4; S(g, 0.07, '#222', 0, 1.55, 0.3); break; }
    case 'cradle': { const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M('#b8a888', { side: THREE.DoubleSide })); b.position.y = 0.55; b.scale.z = 1.4; g.add(b); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 16, Math.PI), M(DWOOD)); r.rotation.z = Math.PI; r.position.set(0, 0.35, 0.45 * s); g.add(r); } g.userData.swing = true; break; }
    case 'iron_gate': { for (let i = -4; i <= 4; i++) C(g, 0.03, 0.03, 2.3, '#4a4a4e', i * 0.16, 0, 0, 6, { metalness: 0.7 }); B(g, 1.5, 0.06, 0.06, '#3a3a3e', 0, 2.2, 0); B(g, 1.5, 0.06, 0.06, '#3a3a3e', 0, 0.2, 0); B(g, 0.25, 0.3, 0.12, '#6a5a3a', 0.2, 1.0, 0.08, { metalness: 0.8 }); g.userData.foot = [1.5, 0.3]; break; }
    case 'telegraph': { B(g, 1.2, 0.8, 0.6, '#3a2a1c'); B(g, 0.4, 0.1, 0.25, '#2a2a2a', -0.2, 0.8, 0, { metalness: 0.6 }); B(g, 0.25, 0.04, 0.05, '#b89a5a', -0.2, 0.92, 0, { metalness: 0.8 }); S(g, 0.04, '#111', -0.08, 0.95, 0); B(g, 0.35, 0.3, 0.3, '#5a4a3a', 0.3, 0.8, 0); S(g, 0.04, '#e33', 0.3, 1.0, 0.16, { emissive: '#f00', emissiveIntensity: 1.5 }); g.userData.foot = [1.2, 0.6]; break; }
    case 'tape': { for (let i = 0; i < 8; i++) B(g, 0.06, 0.005, 0.4, PAPER, -0.2 + i * 0.06, 0, Math.sin(i) * 0.05).rotation.y = i * 0.3; break; }
    case 'headphones': { const b = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 14, Math.PI), M('#2a2a2a')); b.position.y = 0.1; g.add(b); for (const s of [-1, 1]) C(g, 0.045, 0.045, 0.04, '#3a3a3a', 0.1 * s, 0.02, 0, 10).rotation.z = Math.PI / 2; break; }
    case 'map_table': { B(g, 2, 0.08, 1.2, '#5a3e26', 0, 0.85, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.08, 0.85, 0.08, DWOOD, 0.9 * sx, 0, 0.5 * sz); Plane(g, 1.8, 1.0, canvasTex(180, 100, (x) => { x.fillStyle = '#d8c89a'; x.fillRect(0, 0, 180, 100); x.strokeStyle = '#8a3a2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(10, 70); x.lineTo(60, 70); x.lineTo(100, 70); x.lineTo(100, 40); x.lineTo(140, 40); x.lineTo(140, 80); x.stroke(); x.fillStyle = '#2a4a6a'; x.fillRect(150, 80, 10, 10); }), 0, 0.9, 0).rotation.x = -Math.PI / 2; g.userData.foot = [2, 1.2]; break; }
    case 'ship_wheel': { C(g, 0.08, 0.1, 1.0, DWOOD); const w = new THREE.Group(); w.position.set(0, 1.25, 0.1); g.add(w); const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), M('#6a4a2a')); w.add(r); for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), M('#6a4a2a')); sp.rotation.z = (i * Math.PI) / 8; w.add(sp); } g.userData.foot = [0.5, 0.5]; break; }
    case 'hatch': { B(g, 1.4, 0.06, 1.4, '#3a3a3e', 0, 0, 0, { metalness: 0.6 }); const r = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 14), M('#8a7a5a', { metalness: 0.8 })); r.rotation.x = Math.PI / 2; r.position.y = 0.08; g.add(r); break; }
    case 'chain': { for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 10), M('#5a5a5e', { metalness: 0.7 })); l.position.y = 3.3 - i * 0.12; l.rotation.y = (i % 2) * Math.PI / 2; g.add(l); } S(g, 0.12, '#4a4a4e', 0, 2.0, 0, { metalness: 0.7 }); break; }
    case 'crowbar': { const c = C(g, 0.02, 0.02, 0.8, '#7a2a1a', 0, 0.03, 0, 6); c.rotation.z = Math.PI / 2; break; }
    case 'ring': { const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), M('#e8d07a', { metalness: 0.9, roughness: 0.2, emissive: '#553', emissiveIntensity: 0.6 })); r.position.y = 0.06; r.rotation.x = 1.2; g.add(r); break; }
    case 'ship_bell': { C(g, 0.03, 0.03, 1.4, '#3a3a3a', 0, 2, 0); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, 0.5, 16, 1, true), M('#c9a24a', { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })); b.position.y = 1.75; g.add(b); break; }

    // ── 시나리오 3: 저택 · 인형
    case 'chandelier': { C(g, 0.02, 0.02, 1, '#8a7a5a', 0, 2.6, 0); const r = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 24), M('#c9a24a', { metalness: 0.8 })); r.rotation.x = Math.PI / 2; r.position.y = 2.6; g.add(r); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; S(g, 0.04, '#ffd58a', Math.cos(a) * 0.6, 2.75, Math.sin(a) * 0.6, { emissive: '#ffb347', emissiveIntensity: 3 }); } const pl = new THREE.PointLight('#ffc070', 5, 9, 1.8); pl.position.y = 2.5; g.add(pl); g.userData.flicker = pl; break; }
    case 'rug': { const r = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), M('#6a1e28')); r.rotation.x = -Math.PI / 2; r.position.y = 0.01; g.add(r); const b = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), M('#8a3a2a')); b.rotation.x = -Math.PI / 2; b.position.y = 0.015; g.add(b); break; }
    case 'umbrella_stand': { C(g, 0.2, 0.18, 0.6, '#3a3a3e', 0, 0, 0, 12); for (let i = 0; i < 3; i++) { const u = C(g, 0.02, 0.02, 0.9, '#111', -0.06 + i * 0.06, 0.3, 0, 6); u.rotation.z = (i - 1) * 0.1; } break; }
    case 'fireplace': { B(g, 2, 1.4, 0.6, '#6a5a52'); B(g, 1.2, 0.9, 0.62, '#120a08', 0, 0, 0.01); B(g, 2.2, 0.12, 0.7, '#4a3a32', 0, 1.4, 0); const f = new THREE.PointLight('#ff6a2a', 3, 5, 2); f.position.set(0, 0.4, 0.6); g.add(f); g.userData.flicker = f; S(g, 0.2, '#ff7a2a', 0, 0.2, 0.1, { emissive: '#ff4a0a', emissiveIntensity: 3 }); g.userData.foot = [2, 0.6]; break; }
    case 'cake_table': { C(g, 0.7, 0.7, 0.06, '#f4f1ea', 0, 0.75, 0, 24); C(g, 0.06, 0.1, 0.75, DWOOD); C(g, 0.3, 0.3, 0.25, '#f8f0f4', 0, 0.81, 0, 20); C(g, 0.2, 0.2, 0.15, '#ffd6e0', 0, 1.06, 0, 20); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; C(g, 0.01, 0.01, 0.1, '#fff', Math.cos(a) * 0.14, 1.21, Math.sin(a) * 0.14, 6); S(g, 0.012, '#ffd58a', Math.cos(a) * 0.14, 1.33, Math.sin(a) * 0.14, { emissive: '#ffb347', emissiveIntensity: 3 }); } const pl = new THREE.PointLight('#ffb070', 2, 4, 2); pl.position.y = 1.5; g.add(pl); g.userData.flicker = pl; g.userData.foot = [1.4, 1.4]; break; }
    case 'grandfather_clock': { B(g, 0.6, 2.3, 0.4, '#4a2a1a'); const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), M('#f2ead8')); face.position.set(0, 1.9, 0.21); g.add(face); B(g, 0.3, 0.9, 0.02, '#2a1a10', 0, 0.6, 0.21); S(g, 0.08, '#c9a24a', 0, 0.75, 0.22, { metalness: 0.8 }); g.userData.foot = [0.6, 0.4]; break; }
    case 'piano': { B(g, 1.6, 0.9, 1.6, '#0e0e10', 0, 0, 0, { roughness: 0.2 }); B(g, 1.5, 0.05, 0.25, '#f4f1ea', 0, 0.9, 0.7); for (let i = 0; i < 10; i++) B(g, 0.05, 0.04, 0.14, '#000', -0.62 + i * 0.14, 0.93, 0.66); const lid = B(g, 1.6, 0.04, 1.4, '#0e0e10', 0, 1.35, -0.1, { roughness: 0.2 }); lid.rotation.x = -0.5; g.userData.foot = [1.6, 1.6]; break; }
    case 'bookcase': { B(g, 2, 2.4, 0.45, '#3a2216'); for (let i = 0; i < 5; i++) B(g, 0.3, 0.45, 0.3, ['#7a2a2a', '#2a4a7a', '#2a6a3a', '#7a6a2a', '#5a2a6a'][i], -0.7 + i * 0.35, 1.2, 0.1); for (let i = 0; i < 4; i++) B(g, 1.9, 0.04, 0.4, '#2a1810', 0, 0.3 + i * 0.6, 0); g.userData.foot = [2, 0.45]; break; }
    case 'workbench': { B(g, 2, 0.08, 0.9, '#6a4a2e', 0, 0.85, 0); for (const sx of [-1, 1]) B(g, 0.1, 0.85, 0.8, '#4a3220', 0.9 * sx, 0, 0); S(g, 0.12, '#f4ece4', -0.4, 1.0, 0); C(g, 0.08, 0.1, 0.3, '#9ab7d8', 0.2, 0.9, 0, 10); g.userData.foot = [2, 0.9]; break; }
    case 'dollhouse': { B(g, 1.6, 1.0, 0.8, '#f2e6d8', 0, 0.6, 0); B(g, 1.6, 0.6, 0.8, '#d8c0b0', 0, 0, 0); { const sh = new THREE.Shape([new THREE.Vector2(-0.52, 0), new THREE.Vector2(0.52, 0), new THREE.Vector2(0, 0.62)]); const rg = new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: false }); rg.translate(0, 0, -0.9); const r = new THREE.Mesh(rg, M('#7a3a3a')); r.rotation.y = Math.PI / 2; r.position.y = 1.6; r.castShadow = true; g.add(r); B(g, 0.12, 0.5, 0.12, '#5a2a2a', 0.45, 1.75, 0.2); } for (let i = 0; i < 4; i++) B(g, 0.25, 0.25, 0.02, '#ffe08a', -0.45 + (i % 2) * 0.9, 0.85 + Math.floor(i / 2) * -0.5, 0.41, { emissive: '#553', emissiveIntensity: 0.5 }); g.userData.foot = [1.6, 0.8]; break; }
    case 'frame': { B(g, 0.8, 0.8, 0.04, '#6a4a2a'); Plane(g, 0.7, 0.7, canvasTex(70, 70, (x) => { x.fillStyle = '#f2ead8'; x.fillRect(0, 0, 70, 70); x.fillStyle = '#c0262d'; ['1001', '1111', '1111', '0110'].forEach((row, r) => [...row].forEach((v, c) => { if (v === '1') x.fillRect(8 + c * 14, 8 + r * 14, 12, 12); })); }), 0, 0.4, 0.025); break; }
    case 'stained_window': { B(g, 1.6, 1.6, 0.06, '#2a1a10', 0, -0.8, 0); for (let i = 0; i < 16; i++) B(g, 0.34, 0.34, 0.02, ['#7a2a3a', '#2a4a7a', '#3a6a3a', '#7a6a2a'][(i + Math.floor(i / 4)) % 4], -0.54 + (i % 4) * 0.36, -0.7 + Math.floor(i / 4) * 0.36 - 0.54 + 0.6, 0.04, { emissive: '#222', emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }); break; }
    case 'mannequin': { C(g, 0.03, 0.03, 0.9, '#2a2a2a'); C(g, 0.2, 0.15, 0.6, '#e8dcc8', 0, 0.9, 0, 12); S(g, 0.12, '#e8dcc8', 0, 1.6, 0); break; }
    case 'rocking_horse': { for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 16, Math.PI / 2.5), M(DWOOD)); r.rotation.z = Math.PI + 0.6; r.position.set(0, 0.62, 0.15 * s); g.add(r); } B(g, 0.7, 0.25, 0.22, '#e8dcc8', 0, 0.5, 0); B(g, 0.15, 0.4, 0.15, '#e8dcc8', 0.35, 0.7, 0).rotation.z = -0.4; S(g, 0.03, '#000', 0.48, 0.95, 0.08); break; }
    case 'doll_shelf': { B(g, 1.6, 2, 0.45, '#5a3a40'); for (let i = 0; i < 3; i++) B(g, 1.5, 0.04, 0.4, '#3a2228', 0, 0.4 + i * 0.6, 0.02); for (let i = 0; i < 6; i++) { S(g, 0.08, '#f4ece4', -0.5 + (i % 3) * 0.5, 0.65 + Math.floor(i / 3) * 0.6, 0.05); C(g, 0.06, 0.09, 0.15, ['#ff8fab', '#9ab7d8', '#ffd166'][i % 3], -0.5 + (i % 3) * 0.5, 0.45 + Math.floor(i / 3) * 0.6, 0.05, 10); } B(g, 1.55, 1.9, 0.02, '#cfe3ff', 0, 0.05, 0.23, { transparent: true, opacity: 0.25 }); g.userData.foot = [1.6, 0.45]; break; }
    case 'doll': { C(g, 0.12, 0.18, 0.3, ['#ff8fab', '#9ab7d8', '#ffd166', '#b5a8ff'][Math.abs(Math.round(p.x * 7 + p.z)) % 4], 0, 0, 0, 12); S(g, 0.12, '#f4ece4', 0, 0.42, 0); for (const s of [-1, 1]) S(g, 0.018, '#111', 0.04 * s, 0.44, 0.11); S(g, 0.13, '#e8c170', 0, 0.48, -0.03).scale.set(1, 0.8, 1); break; }
    case 'doll_big': {
      C(g, 0.35, 0.55, 0.9, '#9ab7d8', 0, 0, 0, 16); S(g, 0.4, '#f4ece4', 0, 1.25, 0, { roughness: 0.25 });
      for (const s of [-1, 1]) { S(g, 0.07, '#1a2a4a', 0.14 * s, 1.3, 0.35, { roughness: 0.05 }); S(g, 0.035, '#fff', 0.14 * s + 0.02, 1.32, 0.4); }
      const hair = S(g, 0.44, '#e8c170', 0, 1.36, -0.08); hair.scale.set(1, 0.95, 0.9);
      const crack = B(g, 0.02, 0.3, 0.01, '#222', 0.1, 1.1, 0.39); crack.rotation.z = 0.5;
      for (const s of [-1, 1]) B(g, 0.1, 0.5, 0.1, '#f4ece4', 0.4 * s, 0.4, 0.1).rotation.z = 0.3 * s;
      g.userData.foot = [1, 1]; break;
    }
    case 'music_box': { B(g, 0.6, 0.3, 0.4, '#7a3a4a', 0, 0.75, 0); B(g, 0.8, 0.75, 0.5, '#3a2228'); C(g, 0.02, 0.02, 0.15, '#c9a24a', 0, 1.05, 0, 6); S(g, 0.05, '#ffd6e0', 0, 1.2, 0); C(g, 0.06, 0.01, 0.1, '#ffd6e0', 0, 1.1, 0, 10); g.userData.foot = [0.8, 0.5]; break; }
    case 'ouija': { B(g, 0.6, 0.02, 0.4, '#c8a878'); Plane(g, 0.56, 0.36, canvasTex(112, 72, (x) => { x.fillStyle = '#c8a878'; x.fillRect(0, 0, 112, 72); x.fillStyle = '#2a1a10'; x.font = '9px serif'; x.fillText('A B C D E F G H I J K L M', 4, 24); x.fillText('N O P Q R S T U V W X Y Z', 4, 38); x.fillText('YES          NO', 22, 12); x.fillText('1 2 3 4 5 6 7 8 9 0', 12, 52); x.fillText('GOOD BYE', 34, 66); }), 0, 0.012, 0).rotation.x = -Math.PI / 2; const pl = B(g, 0.08, 0.02, 0.1, '#f2ead8', 0.05, 0.02, 0.02); g.userData.planchette = pl; break; }
    case 'vanity': { B(g, 1.2, 0.8, 0.5, '#e8dcd0'); B(g, 0.9, 1.0, 0.04, '#c9a24a', 0, 0.8, -0.22, { metalness: 0.6 }); B(g, 0.8, 0.9, 0.02, '#a8bccc', 0, 0.85, -0.19, { metalness: 0.9, roughness: 0.1 }); g.userData.foot = [1.2, 0.5]; break; }
    case 'tea_table': { C(g, 0.8, 0.8, 0.05, '#f4f1ea', 0, 0.6, 0, 24); C(g, 0.08, 0.12, 0.6, '#e8dcd0'); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; C(g, 0.06, 0.04, 0.06, '#fff', Math.cos(a) * 0.55, 0.65, Math.sin(a) * 0.55, 10); B(g, 0.35, 0.4, 0.35, '#f2d0dc', Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15); } g.userData.foot = [1.7, 1.7]; break; }
    case 'canopy_bed': { B(g, 1.6, 0.5, 2.2, '#f2e6ea'); B(g, 1.5, 0.15, 2.1, '#ffd6e0', 0, 0.5, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 0.04, 0.04, 2.3, '#e8dcd0', 0.75 * sx, 0, 1.05 * sz, 8); B(g, 1.7, 0.05, 2.3, '#fff0f4', 0, 2.3, 0, { transparent: true, opacity: 0.7 }); for (let i = 0; i < 5; i++) C(g, 0.006, 0.006, 1.2, '#c0262d', 0.75, 2.3, -1.05 + i * 0.02, 4); g.userData.foot = [1.6, 2.2]; break; }
    case 'attic_window': { B(g, 1.1, 1.0, 0.06, '#2a1a10', 0, -0.5, 0); B(g, 0.9, 0.8, 0.02, '#3a4a5a', 0, -0.4, 0.03, { emissive: '#0a1420', emissiveIntensity: 1 }); const h = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), M('#b89a5a', { metalness: 0.8 })); h.position.set(0.4, -0.5, 0.06); g.add(h); break; }
    case 'altar': { B(g, 2, 0.8, 1, '#5a3a32'); B(g, 2.1, 0.06, 1.1, '#f4f1ea', 0, 0.8, 0); C(g, 0.25, 0.25, 0.2, '#f8f0f4', 0, 0.86, 0, 20); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; S(g, 0.012, '#ffd58a', Math.cos(a) * 0.18, 1.12, Math.sin(a) * 0.18, { emissive: '#ffb347', emissiveIntensity: 3 }); } const pl = new THREE.PointLight('#ffb070', 2, 4, 2); pl.position.y = 1.4; g.add(pl); g.userData.flicker = pl; g.userData.foot = [2, 1]; break; }
    case 'bell_rack': { for (const sx of [-1, 1]) C(g, 0.04, 0.05, 2.4, DWOOD, 0.9 * sx); B(g, 2, 0.08, 0.1, DWOOD, 0, 2.4, 0); ['#2f5fd0', '#c9302c', '#d8b02a', '#e8e8e0', '#333'].forEach((c, i) => { C(g, 0.006, 0.006, 0.4, '#888', -0.7 + i * 0.35, 2.0, 0, 4); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.18, 12, 1, true), M(c, { metalness: 0.5, side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.25 })); b.position.set(-0.7 + i * 0.35, 1.92, 0); g.add(b); }); g.userData.foot = [2, 0.3]; break; }
    case 'gears': { [[-0.6, 0, 0.45], [0.2, 0.15, 0.35], [0.75, -0.2, 0.3]].forEach(([x, y, r]) => { const gr = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 16), M('#8a7a5a', { metalness: 0.7, roughness: 0.4 })); gr.rotation.x = Math.PI / 2; gr.position.set(x, y, 0.05); g.add(gr); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), M('#6a5a3a', { metalness: 0.7 })); t.position.set(x + Math.cos(a) * (r + 0.04), y + Math.sin(a) * (r + 0.04), 0.05); t.rotation.z = a; g.add(t); } }); break; }
    // ── 백야 요양병원
    case 'wheelchair': {
      for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 20), M(METAL, { metalness: 0.6, roughness: 0.4 })); w.position.set(0.3 * sx, 0.32, 0); w.rotation.y = Math.PI / 2; g.add(w); S(g, 0.06, '#222', 0.22 * sx, 0.06, 0.38); }
      B(g, 0.5, 0.06, 0.45, '#3a4a5a', 0, 0.45, 0.05); B(g, 0.5, 0.5, 0.05, '#3a4a5a', 0, 0.5, -0.2).rotation.x = -0.15;
      for (const sx of [-1, 1]) { B(g, 0.03, 0.03, 0.4, METAL, 0.27 * sx, 0.68, 0.05); C(g, 0.015, 0.015, 0.3, METAL, 0.22 * sx, 0.95, -0.27, 6).rotation.x = -0.4; }
      g.userData.foot = [0.7, 0.8]; break;
    }
    case 'iv_stand': {
      C(g, 0.02, 0.02, 1.9, METAL, 0, 0, 0, 8, { metalness: 0.7 }); for (let i = 0; i < 4; i++) { const l = B(g, 0.32, 0.02, 0.03, METAL, Math.cos(i * 1.57) * 0.15, 0.02, Math.sin(i * 1.57) * 0.15); l.rotation.y = -i * 1.57; }
      B(g, 0.4, 0.02, 0.02, METAL, 0, 1.88, 0); B(g, 0.16, 0.24, 0.05, '#c8e0d8', 0.15, 1.62, 0, { transparent: true, opacity: 0.7, roughness: 0.2 });
      C(g, 0.005, 0.005, 1.0, '#ddd', 0.15, 0.62, 0, 4); g.userData.foot = [0.35, 0.35]; break;
    }
    case 'gurney': {
      B(g, 0.75, 0.08, 1.9, '#9a9ea2', 0, 0.78, 0, { metalness: 0.3, roughness: 0.7 }); B(g, 0.7, 0.06, 1.8, '#e8e6df', 0, 0.86, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { C(g, 0.02, 0.02, 0.75, METAL, 0.33 * sx, 0.03, 0.85 * sz, 6); S(g, 0.04, '#222', 0.33 * sx, 0.04, 0.85 * sz); }
      g.userData.foot = [0.8, 2.0]; break;
    }
    case 'morgue': {
      B(g, 2.6, 2.2, 0.8, '#6a7276', 0, 0, 0, { metalness: 0.25, roughness: 0.75 });
      for (let i = 0; i < 6; i++) { const x = -0.85 + (i % 3) * 0.85, y = 0.25 + Math.floor(i / 3) * 1.0; B(g, 0.75, 0.85, 0.04, '#848c90', x, y, 0.41, { metalness: 0.3, roughness: 0.7 }); B(g, 0.3, 0.05, 0.06, '#555', x, y + 0.65, 0.45, { metalness: 0.8 }); if (i !== 5) B(g, 0.22, 0.12, 0.01, PAPER, x, y + 0.45, 0.44); }
      g.userData.foot = [2.6, 0.8]; break;
    }
    case 'surgery_lamp': {
      C(g, 0.03, 0.03, 3.0, METAL, 0, 0.3, 0, 8); const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#a8acae', { metalness: 0.3, roughness: 0.7, side: THREE.DoubleSide })); head.position.y = 2.6; head.rotation.x = Math.PI; g.add(head);
      S(g, 0.2, '#fff8e8', 0, 2.5, 0, { emissive: '#ffe8c0', emissiveIntensity: 1.2 }); const pl = new THREE.PointLight('#ffe8d0', 3, 6, 2); pl.position.y = 2.3; g.add(pl); g.userData.flicker = pl; break;
    }
    // ── 레드 메사 (서부)
    case 'facade': {
      const c = p.color || '#7a4a2a'; const W2 = 6, H2 = 4.4;
      B(g, W2, H2, 1.0, c, 0, 0, -0.3);
      B(g, W2 + 0.2, 0.18, 1.6, '#3a2414', 0, 2.6, 0.3);
      for (const s of [-1, 1]) B(g, 0.14, 2.6, 0.14, '#3a2414', 2.7 * s, 0, 1.05);
      B(g, 1.3, 2.1, 0.06, '#1a0e08', 0, 0, 0.22);
      for (const s of [-1, 1]) B(g, 0.9, 0.7, 0.05, '#2a3a40', 1.8 * s, 1.2, 0.22, { emissive: '#ffb050', emissiveIntensity: 0.25 });
      const txt = String(p.sign || p.label || '');
      Plane(g, 3.6, 0.8, canvasTex(360, 80, (x) => { x.fillStyle = '#e8d8b0'; x.fillRect(0, 0, 360, 80); x.strokeStyle = '#3a2414'; x.lineWidth = 6; x.strokeRect(3, 3, 354, 74); x.fillStyle = '#3a1a0a'; x.font = 'bold 44px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 180, 42); }), 0, 3.6, 0.22);
      g.userData.foot = [6, 1.3]; break;
    }
    case 'gallows': {
      B(g, 3, 1.2, 2.4, '#5a3a22'); for (let i = 0; i < 4; i++) B(g, 1, 0.12, 0.3, '#4a2e1a', 1.9, i * 0.3, -0.6 + i * 0.3);
      for (const s of [-1, 1]) B(g, 0.2, 3.4, 0.2, '#4a2e1a', 1.2 * s, 1.2, 0);
      B(g, 2.8, 0.2, 0.2, '#4a2e1a', 0, 4.5, 0);
      const rope = C(g, 0.025, 0.025, 1.3, '#c8a870', 0, 3.25, 0, 6); g.userData.swing = rope;
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 14), M('#c8a870')); loop.position.set(0, 3.15, 0); g.add(loop);
      g.userData.foot = [3, 2.4]; break;
    }
    case 'water_tower': {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.15, 3.2, 0.15, '#4a2e1a', 0.9 * sx, 0, 0.9 * sz);
      C(g, 1.25, 1.25, 1.8, '#6a4426', 0, 3.2, 0, 16); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.7, 16), M('#3a2414')); roof.position.y = 5.35; g.add(roof);
      g.userData.foot = [2.2, 2.2]; break;
    }
    case 'cactus': {
      const cm = M('#3a7a3a'); C(g, 0.22, 0.25, 2.2, cm);
      for (const s of [-1, 1]) { const a = C(g, 0.13, 0.13, 0.7, cm, 0.42 * s, 1.1 + (s > 0 ? 0.3 : 0), 0); const e = C(g, 0.13, 0.13, 0.4, cm, 0.24 * s, 1.15 + (s > 0 ? 0.3 : 0), 0); e.rotation.z = Math.PI / 2; void a; }
      g.userData.foot = [0.6, 0.6]; break;
    }
    case 'wagon': {
      B(g, 1.6, 0.5, 3, '#6a4426', 0, 0.55, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16), M('#3a2414')); w.position.set(0.85 * sx, 0.5, 1.0 * sz); w.rotation.y = Math.PI / 2; g.add(w); }
      const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 16, 1, true, 0, Math.PI), M('#e8dcc0', { side: THREE.DoubleSide })); cover.rotation.z = Math.PI / 2; cover.rotation.y = Math.PI / 2; cover.position.y = 1.05; g.add(cover);
      g.userData.foot = [1.8, 3.2]; break;
    }
    case 'hay': { const h = B(g, 1.1, 0.6, 0.7, '#d8b85a'); B(g, 1.12, 0.05, 0.72, '#a88a3a', 0, 0.2, 0); void h; g.userData.foot = [1.1, 0.7]; break; }
    case 'bar_counter': {
      B(g, 4.5, 1.1, 0.8, '#5a3420'); B(g, 4.7, 0.08, 1.0, '#7a4a2a', 0, 1.1, 0);
      for (let i = 0; i < 7; i++) C(g, 0.06, 0.06, 0.3, ['#6a3a1a', '#2a5a2a', '#8a6a2a'][i % 3], -1.8 + i * 0.6, 1.18, 0, 8, { transparent: true, opacity: 0.85 });
      g.userData.foot = [4.6, 0.9]; break;
    }
    case 'mine_cart': {
      B(g, 1.2, 0.7, 1.8, '#5a5048', 0, 0.35, 0, { metalness: 0.5 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = C(g, 0.2, 0.2, 0.1, '#2a2622', 0.62 * sx, 0.2, 0.6 * sz, 12); w.rotation.z = Math.PI / 2; w.position.y = 0.2; }
      for (let i = 0; i < 5; i++) S(g, 0.16, '#8a8478', -0.3 + (i % 3) * 0.3, 1.05, -0.4 + i * 0.2, { metalness: 0.4 });
      g.userData.foot = [1.3, 1.9]; break;
    }
    case 'rails': {
      for (const s of [-1, 1]) B(g, 0.08, 0.06, 13, '#5a5048', 0.45 * s, 0, 0, { metalness: 0.6 });
      for (let i = 0; i < 18; i++) B(g, 1.3, 0.05, 0.18, '#4a2e1a', 0, 0, -6.2 + i * 0.73);
      break;
    }
    case 'tombstone': {
      const st = M('#7a766c'); B(g, 0.7, 0.9, 0.18, st); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 16, 1, false, 0, Math.PI), st); top.rotation.x = Math.PI / 2; top.rotation.z = Math.PI / 2; top.position.y = 0.9; g.add(top);
      B(g, 0.9, 0.08, 1.4, '#5a4a3a', 0, 0, 0.55); B(g, 0.06, 0.4, 0.02, '#5a564e', 0, 0.45, 0.1); B(g, 0.26, 0.06, 0.02, '#5a564e', 0, 0.68, 0.1);
      g.userData.foot = [0.8, 0.4]; break;
    }
    // ── 츠바키야 (일본풍)
    case 'torii': {
      const red = M('#c8202a');
      for (const s of [-1, 1]) C(g, 0.16, 0.18, 3.4, red, 1.5 * s, 0, 0, 14);
      B(g, 4.2, 0.22, 0.32, '#1a1414', 0, 3.4, 0); B(g, 3.6, 0.18, 0.24, red, 0, 2.8, 0);
      B(g, 0.18, 0.5, 0.12, '#1a1414', 0, 2.9, 0.14);
      g.userData.foot = [0.4, 0.4]; break;
    }
    case 'stone_lantern': {
      const st = M('#8a8a82'); C(g, 0.32, 0.38, 0.2, st); C(g, 0.1, 0.12, 0.7, st, 0, 0.2, 0);
      B(g, 0.5, 0.08, 0.5, '#8a8a82', 0, 0.9, 0);
      B(g, 0.38, 0.36, 0.38, '#ffe0a0', 0, 0.98, 0, { emissive: '#ff9a40', emissiveIntensity: 1.1 });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.3, 4), st); roof.position.y = 1.5; roof.rotation.y = Math.PI / 4; g.add(roof);
      S(g, 0.07, '#8a8a82', 0, 1.7, 0);
      const pl = new THREE.PointLight('#ffa050', 1.8, 5, 2); pl.position.y = 1.15; g.add(pl); g.userData.flicker = pl;
      g.userData.foot = [0.6, 0.6]; break;
    }
    case 'kimono_rack': {
      for (const s of [-1, 1]) B(g, 0.08, 1.9, 0.08, '#2a1a12', 0.9 * s, 0, 0);
      B(g, 2.2, 0.08, 0.08, '#2a1a12', 0, 1.85, 0);
      const k = B(g, 1.7, 1.5, 0.06, '#b81c26', 0, 0.3, 0.05);
      Plane(g, 1.6, 1.4, canvasTex(160, 140, (x) => { x.fillStyle = '#b81c26'; x.fillRect(0, 0, 160, 140); for (let i = 0; i < 9; i++) { const cx = 20 + (i % 3) * 60, cy = 22 + Math.floor(i / 3) * 46; x.fillStyle = '#fff4f0'; for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 6, 0, 7); x.fill(); } x.fillStyle = '#f0c040'; x.beginPath(); x.arc(cx, cy, 3, 0, 7); x.fill(); } x.fillStyle = '#f2e6c8'; x.fillRect(0, 70, 160, 14); }), 0, 1.05, 0.09);
      void k; g.userData.foot = [2, 0.4]; break;
    }
    case 'koi_pond': {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.22, 8, 28), M('#7a7a72')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.12; rim.scale.set(1, 0.7, 1); g.add(rim);
      const water = new THREE.Mesh(new THREE.CircleGeometry(1.55, 28), M('#1a3a4a', { roughness: 0.1, metalness: 0.4, emissive: '#0a2030', emissiveIntensity: 0.5 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.06; water.scale.set(1, 0.7, 1); g.add(water);
      for (let i = 0; i < 5; i++) { const f = S(g, 0.1, '#d02a34', Math.cos(i * 1.7) * 0.9, 0.1, Math.sin(i * 1.7) * 0.6); f.scale.y = 0.4; }
      for (let i = 0; i < 2; i++) { const k = S(g, 0.12, i ? '#ffffff' : '#ff8a30', -0.4 + i * 0.7, 0.04, 0.2); k.scale.set(1, 0.4, 2.2); }
      g.userData.foot = [3.2, 2.2]; break;
    }
    // ── 반딧불 캠프
    case 'tent': {
      const c = p.color || '#c9302c'; const shape = new THREE.Shape(); shape.moveTo(-1.1, 0); shape.lineTo(0, 1.5); shape.lineTo(1.1, 0); shape.closePath();
      const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false }), M(c, { roughness: 0.8, side: THREE.DoubleSide })); body.position.z = -1.1; body.castShadow = true; g.add(body);
      const door = new THREE.Mesh(new THREE.ShapeGeometry((() => { const d = new THREE.Shape(); d.moveTo(-0.45, 0); d.lineTo(0, 0.95); d.lineTo(0.45, 0); d.closePath(); return d; })()), M('#140e0a')); door.position.set(0, 0.01, 1.11); g.add(door);
      for (const sx of [-1, 1]) B(g, 0.02, 0.02, 0.6, '#ddd', 1.3 * sx, 0, 1.2).rotation.x = 0.6;
      g.userData.foot = [2.2, 2.2]; break;
    }
    case 'campfire': {
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; S(g, 0.14, '#4a4a48', Math.cos(a) * 0.62, 0.07, Math.sin(a) * 0.62).scale.y = 0.6; }
      for (let i = 0; i < 5; i++) { const l = C(g, 0.06, 0.07, 0.9, '#4a2e1a', 0, 0.05, 0, 8); l.rotation.set(0.9, (i / 5) * Math.PI * 2, 0); l.position.set(Math.cos(i * 1.26) * 0.18, 0.3, Math.sin(i * 1.26) * 0.18); }
      S(g, 0.18, '#ff7a2a', 0, 0.18, 0, { emissive: '#ff5a1a', emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }).scale.y = 0.5;
      const pl = new THREE.PointLight('#ff8a3a', 2.5, 7, 2); pl.position.y = 0.6; g.add(pl); g.userData.flicker = pl; g.userData.foot = [1.4, 1.4]; break;
    }
    case 'log_seat': { const l = C(g, 0.22, 0.24, 1.8, '#5a3a22', 0, 0, 0, 10); l.rotation.z = Math.PI / 2; l.position.y = 0.22; g.userData.foot = [1.8, 0.45]; break; }
    case 'canoe': {
      const hull = S(g, 0.5, '#b8542a', 0, 0.2, 0); hull.scale.set(0.8, 0.45, 4.2); B(g, 0.7, 0.04, 0.2, '#6a4a2a', 0, 0.3, 0.6); B(g, 0.7, 0.04, 0.2, '#6a4a2a', 0, 0.3, -0.6);
      const paddle = B(g, 0.05, 0.05, 1.4, '#8a6a4a', 0.5, 0.3, 0); paddle.rotation.y = 0.2; g.userData.foot = [0.8, 4.2]; break;
    }
    case 'notice_board': {
      for (const sx of [-1, 1]) B(g, 0.1, 1.9, 0.1, DWOOD, 0.75 * sx, 0, 0);
      B(g, 1.7, 1.0, 0.06, '#7a5a36', 0, 0.9, 0); B(g, 1.9, 0.12, 0.3, '#3a2a1a', 0, 1.95, 0);
      // 압정으로 꽂은 종이 네 장 (글씨 줄과 얼룩이 그려진 진짜 종이)
      [[-0.45, 1.5, '#f2ead8', 0.06], [0.32, 1.47, '#ffe8a8', -0.08], [-0.18, 1.08, '#f2ead8', -0.04], [0.5, 1.05, '#d6ecff', 0.1]].forEach(([x, y, c, r], i) => {
        const pl = Plane(g, 0.46, 0.34, paperTex('nb' + THEME + i, { w: 112, h: 84, lines: 5, base: c, title: i === 0 && THEME === 'west' ? 'WANTED' : undefined }), x, y, 0.04); pl.rotation.z = r;
        S(g, 0.016, ['#d6303a', '#2f5fd0', '#2fbf71', '#ffd36a'][i], x, y + 0.14, 0.05);
      });
      g.userData.foot = [1.7, 0.3]; break;
    }
    case 'fireflies': {
      const n = 26; const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 2.6; pos[i * 3 + 1] = 0.5 + Math.random() * 1.8; pos[i * 3 + 2] = (Math.random() - 0.5) * 2.6; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#d8ff7a', size: 0.09, transparent: true, opacity: 0.95, depthWrite: false }));
      pts.onBeforeRender = () => { const t = performance.now() / 1000; pts.rotation.y = t * 0.15; pts.position.y = Math.sin(t * 0.8) * 0.15; pts.material.opacity = 0.65 + Math.sin(t * 3) * 0.3; };
      g.add(pts); const pl = new THREE.PointLight('#c8ff6a', 1.2, 4, 2); pl.position.y = 1.2; g.add(pl); g.userData.flicker = pl; break;
    }
    // ── 서커스 · 카니발 (삐에로)
    case 'jack_box': {
      B(g, 0.8, 0.8, 0.8, '#c0262d'); for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.02), M(i % 2 ? '#ffd36a' : '#2f5fd0')); p.position.set(0, 0.2 + i * 0.16, 0.41); g.add(p); }
      const lid = B(g, 0.8, 0.05, 0.8, '#ffd36a', 0, 0.8, -0.38); lid.geometry = new THREE.BoxGeometry(0.8, 0.05, 0.8).translate(0, 0, 0.4); lid.position.z = -0.4; lid.rotation.x = -1.9;
      for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 14), M('#c9ccd0', { metalness: 0.8 })); r.rotation.x = Math.PI / 2; r.position.y = 0.85 + i * 0.09; g.add(r); }
      const head = S(g, 0.24, '#f4f1ea', 0, 1.55, 0); S(g, 0.06, '#d6303a', 0, 1.53, 0.23);
      for (const s of [-1, 1]) { S(g, 0.035, '#111', 0.09 * s, 1.62, 0.21); const h = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 8), M(s < 0 ? '#2f5fd0' : '#d6303a')); h.position.set(0.12 * s, 1.85, 0); h.rotation.z = -0.5 * s; g.add(h); }
      const grin = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 16, Math.PI), M('#8e1c17')); grin.rotation.z = Math.PI; grin.position.set(0, 1.47, 0.2); g.add(grin);
      head.userData.bob = true; break;
    }
    case 'balloon_stand': {
      C(g, 0.06, 0.08, 1.2, '#ddd'); B(g, 0.6, 0.12, 0.6, '#8a5a3a');
      const BC = ['#ff6f91', '#ffc75f', '#6fd6ff', '#b39dff', '#7ee0a8', '#ff2a6a', '#ffffff'];
      for (let i = 0; i < 7; i++) { const a = i * 0.9, r = i ? 0.35 : 0; const b = S(g, 0.24, BC[i], Math.cos(a) * r, 2.0 + (i % 3) * 0.25, Math.sin(a) * r, { roughness: 0.25, emissive: BC[i], emissiveIntensity: 0.15 }); b.scale.y = 1.15; const s = C(g, 0.006, 0.006, 0.8, '#eee', Math.cos(a) * r * 0.5, 1.2, Math.sin(a) * r * 0.5); s.castShadow = false; }
      break;
    }
    case 'unicycle': {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 24), M('#1a1a1e')); w.position.y = 0.34; g.add(w);
      for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.62, 0.015), M('#c9ccd0', { metalness: 0.8 })); sp.position.y = 0.34; sp.rotation.z = (i / 6) * Math.PI; g.add(sp); }
      C(g, 0.025, 0.025, 0.7, '#c0262d', 0, 0.34); B(g, 0.12, 0.05, 0.3, '#1a1a1e', 0, 1.04, 0); break;
    }
    case 'popcorn_cart': {
      B(g, 1.2, 0.8, 0.7, '#c0262d', 0, 0.25); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 16), M('#ffd36a')); w.position.set(0.45 * s, 0.22, 0.38); g.add(w); }
      const glass = B(g, 1.0, 0.8, 0.6, M('#e8f4ff', { transparent: true, opacity: 0.35 }), 0, 1.05); glass.castShadow = false;
      for (let i = 0; i < 40; i++) S(g, 0.05, '#fff6d0', (Math.random() - 0.5) * 0.85, 1.1 + Math.random() * 0.35, (Math.random() - 0.5) * 0.45);
      B(g, 1.3, 0.1, 0.8, '#ffd36a', 0, 1.85); const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 4), M('#ffffff')); roof.rotation.y = Math.PI / 4; roof.position.y = 2.2; g.add(roof);
      const sign = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#ffd36a'; x.fillRect(0, 0, w, h); x.fillStyle = '#c0262d'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText('POPCORN', w / 2, 46); });
      Plane(g, 1.0, 0.25, sign, 0, 0.75, 0.36); break;
    }
    case 'ticket_booth': {
      B(g, 1.8, 1.0, 1.4, '#2f5fd0'); B(g, 1.8, 1.4, 0.1, '#c0262d', 0, 1.0, -0.65); for (const s of [-1, 1]) B(g, 0.1, 1.4, 1.4, '#c0262d', 0.85 * s, 1.0);
      const win = B(g, 1.2, 0.8, 0.04, M('#a8d0ff', { transparent: true, opacity: 0.3 }), 0, 1.2, 0.68); win.castShadow = false;
      B(g, 2.0, 0.14, 1.6, '#ffd36a', 0, 2.4); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.9, 4), M('#ffffff')); roof.rotation.y = Math.PI / 4; roof.position.y = 2.95; g.add(roof);
      const sign = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#1a0a24'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd36a'; x.font = 'bold 34px serif'; x.textAlign = 'center'; x.fillText('TICKETS · 매표소', w / 2, 44); });
      Plane(g, 1.7, 0.42, sign, 0, 2.2, 0.72); break;
    }
    case 'cage': {
      B(g, 2.2, 0.15, 2.2, '#3a2a1a'); B(g, 2.2, 0.12, 2.2, '#3a2a1a', 0, 2.2);
      for (let i = 0; i < 9; i++) for (const [ax, az] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { if (p.open && az === 1 && i > 2 && i < 6) continue; const k = -1 + (i / 8) * 2; C(g, 0.025, 0.025, 2.1, '#8a8e94', ax ? ax * 1.05 : k * 1.05, 0.12, az ? az * 1.05 : k * 1.05, 6, { metalness: 0.8, roughness: 0.4 }); }
      for (let i = 0; i < 10; i++) B(g, 0.3, 0.05, 0.1, '#c9a24a', (Math.random() - 0.5) * 1.6, 0.15, (Math.random() - 0.5) * 1.6).rotation.y = Math.random() * 3; break;
    }
    case 'circus_wagon': {
      B(g, 3.0, 1.6, 1.4, '#7a1424', 0, 0.45); B(g, 3.1, 0.12, 1.5, '#ffd36a', 0, 2.05);
      for (let i = 0; i < 7; i++) C(g, 0.03, 0.03, 1.4, '#ffd36a', -1.3 + i * 0.43, 0.55, 0.71, 6, { metalness: 0.7 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 6, 18), M('#ffd36a')); w.position.set(1.0 * sx, 0.42, 0.74 * sz); g.add(w); for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.78, 0.03), M('#c0262d')); sp.position.copy(w.position); sp.rotation.z = (k / 4) * Math.PI; g.add(sp); } }
      break;
    }
    case 'strongman': {
      B(g, 0.9, 0.2, 0.6, '#8a5a3a'); B(g, 0.35, 0.25, 0.35, '#c0262d', 0, 0.2);
      const pole = B(g, 0.22, 3.6, 0.12, '#ffffff', 0, 0.2, -0.15);
      for (let i = 0; i < 8; i++) B(g, 0.24, 0.04, 0.13, ['#2fbf71', '#a8d83a', '#ffd43b', '#ffa94d', '#ff6b6b', '#c0262d', '#9b59b6', '#2f5fd0'][i], 0, 0.5 + i * 0.4, -0.14);
      const bell = S(g, 0.22, '#ffd36a', 0, 3.95, -0.15, { metalness: 0.8, roughness: 0.3 }); bell.scale.y = 0.8;
      const puck = B(g, 0.18, 0.12, 0.16, '#c9ccd0', 0, 0.6, -0.02); g.userData.puck = puck; break;
    }
    case 'cups_table': {
      B(g, 1.5, 0.08, 0.8, '#3a1424', 0, 0.78); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.07, 0.78, 0.07, '#2a0a14', 0.65 * sx, 0, 0.32 * sz);
      const cloth = B(g, 1.55, 0.3, 0.85, '#c0262d', 0, 0.55); cloth.castShadow = false;
      for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.22, 14), M('#d6303a')); c.position.set(-0.4 + i * 0.4, 0.97, 0); g.add(c); }
      break;
    }
    case 'funhouse_mirror': {
      const fr = B(g, 1.3, 2.4, 0.12, '#ffd36a'); fr.position.y = 1.2;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1, 12, 12), new THREE.MeshStandardMaterial({ color: '#c8d4e0', metalness: 0.95, roughness: 0.06, emissive: '#1a2230', emissiveIntensity: 0.35 }));
      const pos = m.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getY(i) * (p.wave || 2.4)) * 0.08); m.geometry.computeVertexNormals();
      m.position.set(0, 1.25, 0.07); g.add(m);
      for (let i = 0; i < 8; i++) S(g, 0.05, i % 2 ? '#fff2a8' : '#ff9ad0', -0.6 + (i % 2) * 1.2, 0.3 + Math.floor(i / 2) * 0.6, 0.08, { emissive: '#ffcc66', emissiveIntensity: 0.8 });
      break;
    }
    case 'vanity_bulb': {
      B(g, 1.6, 0.8, 0.55, '#3a2a30'); B(g, 1.62, 0.05, 0.6, '#5a4048', 0, 0.8);
      const mir = B(g, 1.3, 1.0, 0.04, M('#b8c4d0', { metalness: 0.9, roughness: 0.1 }), 0, 0.95, -0.22); mir.castShadow = false;
      for (let i = 0; i < 12; i++) { const top = i < 6; const x = top ? -0.6 + i * 0.24 : (i < 9 ? -0.72 : 0.72), y = top ? 2.02 : 1.05 + ((i - 6) % 3) * 0.3; S(g, 0.05, '#fff6d0', x, y, -0.18, { emissive: '#ffe0a0', emissiveIntensity: 1.2 }); }
      for (let i = 0; i < 5; i++) C(g, 0.025, 0.03, 0.12 + (i % 2) * 0.06, ['#ffffff', '#d6303a', '#2f5fd0', '#111', '#ffd36a'][i], -0.5 + i * 0.22, 0.85, 0.1);
      const wig = S(g, 0.16, '#ff5a2a', 0.55, 1.05, 0.05); wig.scale.set(1.3, 0.8, 1.3); break;
    }
    case 'trapeze': {
      const h = p.h || 5.2; for (const s of [-1, 1]) { const r = C(g, 0.012, 0.012, h - 1.6, '#d8d0c0', 0.5 * s, 1.6); r.castShadow = false; }
      C(g, 0.035, 0.035, 1.1, '#c0262d', 0, 1.6).rotation.z = Math.PI / 2; g.userData.swing = true; break;
    }
    case 'ring_stage': {
      const r = p.r2 || 5; const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 48), M('#c8a070', { roughness: 1 })); base.position.y = 0.04; base.receiveShadow = true; g.add(base);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.2, 8, 64), M('#c0262d')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.2; g.add(rim);
      const rim2 = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.06, 6, 64), M('#ffd36a', { metalness: 0.6 })); rim2.rotation.x = Math.PI / 2; rim2.position.y = 0.38; g.add(rim2);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; B(g, 0.6, 0.02, 0.22, i % 2 ? '#ffd36a' : '#ffffff', Math.cos(a) * r * 0.55, 0.08, Math.sin(a) * r * 0.55).rotation.y = -a; }
      break;
    }
    case 'spotlight': {
      C(g, 0.3, 0.35, 0.15, '#222'); C(g, 0.05, 0.05, 1.5, '#333', 0, 0.15);
      const head = C(g, 0.28, 0.22, 0.6, '#1a1a1e', 0, 1.5); head.rotation.x = -0.9;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.24, 18), new THREE.MeshBasicMaterial({ color: p.on ? '#fff6d0' : '#3a3a30' })); lens.position.set(0, 1.95, 0.27); lens.rotation.x = -0.9; g.add(lens);
      if (p.on) { const l = new THREE.PointLight('#fff2c8', 5, 9, 1.5); l.position.set(0, 2.2, 0.6); g.add(l); }
      break;
    }
    case 'bleachers': {
      const w = p.w || 6; for (let i = 0; i < 4; i++) { B(g, w, 0.12, 0.6, i % 2 ? '#7a1424' : '#a02030', 0, 0.35 + i * 0.4, 0.9 - i * 0.6); B(g, w, 0.35 + i * 0.4, 0.08, '#3a2a1a', 0, 0, 1.18 - i * 0.6); }
      break;
    }
    case 'magic_box': {
      const box = B(g, 1.0, 1.9, 1.0, '#1a0a3a', 0, 0.2); B(g, 1.3, 0.2, 1.3, '#ffd36a', 0, 0); B(g, 1.08, 0.1, 1.08, '#ffd36a', 0, 2.1);
      const tex = canvasTex(128, 256, (x, w, h) => { x.fillStyle = '#1a0a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd36a'; for (let i = 0; i < 14; i++) { const cx = 16 + ((i * 47) % 96), cy = 18 + ((i * 83) % 220); x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const r = k % 2 ? 4 : 10; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.fill(); } x.font = 'bold 22px serif'; x.fillStyle = '#ff9ad0'; x.fillText('?', 56, 140); });
      Plane(g, 0.96, 1.85, tex, 0, 1.15, 0.51); if (p.open) box.material = M('#0a0418'); break;
    }
    case 'clown_statue': {
      const s = p.s || 1; C(g, 0.5 * s, 0.6 * s, 0.3, '#8a7a8a');
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.55 * s, 1.4 * s, 12), M('#f4f1ea')); body.position.y = 0.3 + 0.7 * s; g.add(body);
      for (let i = 0; i < 3; i++) S(g, 0.08 * s, '#d6303a', 0, 0.6 + (0.3 + i * 0.35) * s, 0.42 * s - i * 0.04 * s);
      const ruff = new THREE.Mesh(new THREE.TorusGeometry(0.34 * s, 0.12 * s, 6, 16), M('#ffffff')); ruff.rotation.x = Math.PI / 2; ruff.position.y = 0.3 + 1.45 * s; g.add(ruff);
      S(g, 0.32 * s, '#f6f2ec', 0, 0.3 + 1.8 * s, 0); S(g, 0.08 * s, '#d6303a', 0, 0.3 + 1.78 * s, 0.31 * s);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2 * s, 0.6 * s, 12), M('#2f5fd0')); hat.position.y = 0.3 + 2.35 * s; g.add(hat); S(g, 0.07 * s, '#ffd36a', 0, 0.3 + 2.68 * s, 0);
      for (const sx of [-1, 1]) { S(g, 0.045 * s, '#111', 0.11 * sx * s, 0.3 + 1.9 * s, 0.28 * s); const tear = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, 0.1 * s, 6), M('#2f5fd0')); tear.rotation.x = Math.PI; tear.position.set(0.11 * sx * s, 0.3 + 1.78 * s, 0.3 * s); g.add(tear); }
      const grin = new THREE.Mesh(new THREE.TorusGeometry(0.14 * s, 0.025 * s, 6, 16, Math.PI), M('#8e1c17')); grin.rotation.z = Math.PI; grin.position.set(0, 0.3 + 1.68 * s, 0.28 * s); g.add(grin);
      break;
    }
    case 'cannon': {
      for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 6, 18), M('#ffd36a')); w.position.set(0.5 * s, 0.45, 0); w.rotation.y = Math.PI / 2; g.add(w); }
      const barrel = C(g, 0.32, 0.42, 2.2, '#c0262d', 0, 0.2); barrel.rotation.x = -1.1; barrel.position.set(0, 0.9, 0.2);
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.38 - i * 0.03, 0.04, 6, 18), M('#ffd36a')); r.position.set(0, 0.6 + i * 0.35, -0.15 - i * 0.62); r.rotation.x = -1.1 + Math.PI / 2; g.add(r); }
      break;
    }
    case 'star_lamp': {
      C(g, 0.02, 0.02, (p.h || 3.2) - 0.3, '#333', 0, 0.3); const b = S(g, 0.16, '#fff6d0', 0, p.h || 3.2, 0, { emissive: p.on ? '#ffe0a0' : '#000', emissiveIntensity: p.on ? 2 : 0 });
      if (p.on) { const l = new THREE.PointLight('#ffe9a8', 2.5, 5, 2); l.position.y = (p.h || 3.2) - 0.2; g.add(l); }
      b.castShadow = false; break;
    }
    case 'burnt_beam': { const b = B(g, 3.0, 0.3, 0.3, '#1a120c', 0, 0.15); b.rotation.y = 0.2; const b2 = B(g, 2.2, 0.25, 0.25, '#120c08', 0.3, 0.3, 0.3); b2.rotation.set(0.1, -0.5, 0.25); for (let i = 0; i < 6; i++) S(g, 0.05, '#ff5a1a', (Math.random() - 0.5) * 2.4, 0.3, (Math.random() - 0.5) * 0.4, { emissive: '#ff3a0a', emissiveIntensity: 1.5 }); break; }
    case 'juggling_pins': { for (let i = 0; i < 5; i++) { const pin = C(g, 0.02, 0.06, 0.4, i % 2 ? '#ffffff' : '#d6303a', (i - 2) * 0.12, 0, Math.sin(i) * 0.1); pin.rotation.z = Math.PI / 2 * (i % 2 ? 0.95 : 1.05); pin.position.y = 0.06; } break; }
    case 'big_top': {
      const r = p.r2 || 9, h = p.h || 8; const tex = canvasTex(512, 64, (x, w, hh) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#c0262d' : '#f4f1ea'; x.fillRect((w / 16) * i, 0, w / 16 + 1, hh); } });
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.45, 32, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 })); wall.position.y = h * 0.225; g.add(wall);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.05, h * 0.55, 32, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 })); roof.position.y = h * 0.45 + h * 0.275; g.add(roof);
      C(g, 0.06, 0.06, 1.4, '#ffd36a', 0, h); const flag = B(g, 0.6, 0.35, 0.02, '#ff2a6a', 0.32, h + 1.0); g.userData.flag = flag; break;
    }
    case 'scarecrow': {
      C(g, 0.05, 0.05, 2.0, '#5a3d27'); const arm = C(g, 0.04, 0.04, 1.6, '#5a3d27', 0, 1.5); arm.rotation.z = Math.PI / 2;
      const shirt = B(g, 0.6, 0.7, 0.3, '#5a6a3a', 0, 1.0); for (const s of [-1, 1]) B(g, 0.5, 0.18, 0.2, '#5a6a3a', 0.5 * s, 1.45);
      const head = S(g, 0.22, '#d8c08a', 0, 2.0, 0); head.scale.y = 1.1; const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.4, 12), M('#6a5030')); hat.position.y = 2.32; g.add(hat);
      for (const s of [-1, 1]) { const e = B(g, 0.07, 0.07, 0.02, '#111', 0.08 * s, 2.03, 0.2); e.rotation.z = 0.78; }
      const stitch = B(g, 0.2, 0.02, 0.02, '#3a1a10', 0, 1.9, 0.21); stitch.castShadow = false;
      for (let i = 0; i < 10; i++) { const st = C(g, 0.01, 0.005, 0.25, '#e8d08a', (Math.random() - 0.5) * 0.9, 1.3, (Math.random() - 0.5) * 0.2); st.rotation.z = (Math.random() - 0.5) * 2; }
      break;
    }
    // ───────── 테마 장식 (월드가 자동으로 흩뿌린다 · 충돌 없음 · 조명 없이 발광 재질만)
    case 'cobweb': {
      const tex = canvasTex(128, 128, (x, w, h) => {
        x.strokeStyle = 'rgba(230,230,235,.55)'; x.lineWidth = 1.2;
        for (let i = 0; i <= 7; i++) { const a = (i / 7) * Math.PI / 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * w * 1.1, Math.sin(a) * h * 1.1); x.stroke(); }
        for (let r = 14; r < 130; r += 12 + r * 0.12) { x.beginPath(); for (let i = 0; i <= 7; i++) { const a = (i / 7) * Math.PI / 2; const rr = r * (1 + Math.sin(i * 2.1 + r) * 0.06); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i) x.quadraticCurveTo(Math.cos(a - 0.11) * rr * 0.9, Math.sin(a - 0.11) * rr * 0.9, px, py); else x.moveTo(px, py); } x.stroke(); }
      }, 'cobweb');
      const mt = (TM.get('cobweb') || TM.set('cobweb', new THREE.MeshStandardMaterial({ map: tex, color: '#b8b8c0', transparent: false, depthWrite: true, side: THREE.DoubleSide, roughness: 1, alphaTest: 0.25 })).get('cobweb'));
      const s = p.s || 1.2; const m = new THREE.Mesh(geo('p1x1', () => new THREE.PlaneGeometry(1, 1).translate(0.5, -0.5, 0)), mt); m.scale.set(s, s, 1); m.frustumCulled = false; g.add(m); m.userData.noOcc = true; break; // 반투명 정렬 순서에 따라 깜빡이지 않게 오려낸(알파 컷) 그림으로 그린다
    }
    case 'sconce': {
      const c = p.color || '#ffcf8a';
      B(g, 0.14, 0.24, 0.05, '#3a2a1a', 0, -0.12, 0); C(g, 0.015, 0.015, 0.18, '#8a7a5a', 0, -0.02, 0.08, 6, { metalness: 0.7 }).rotation.x = Math.PI / 2;
      C(g, 0.09, 0.05, 0.14, M(c, { emissive: c, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 }), 0, 0.02, 0.16, 10).castShadow = false;
      DECO_ONLY(g); break;
    }
    case 'paper_lantern': {
      const c = p.color || '#d02a34';
      C(g, 0.006, 0.006, 0.4, '#222', 0, 0.38, 0, 4);
      const body = S(g, 0.2, M(c, { emissive: c, emissiveIntensity: 1.3, roughness: 1 }), 0, 0.15, 0); body.scale.y = 1.35;
      for (const y of [-0.12, 0.42]) C(g, 0.09, 0.09, 0.05, '#141010', 0, y, 0, 10);
      for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(geo('lanrib', () => new THREE.TorusGeometry(0.2, 0.006, 4, 16)), M('#2a1010')); r.rotation.x = Math.PI / 2; r.position.y = 0.0 + i * 0.1; r.scale.setScalar(Math.sin(((i + 0.5) / 4) * Math.PI) * 0.95 + 0.05); g.add(r); }
      DECO_ONLY(g); g.userData.sway = true; break;
    }
    case 'string_lights': {
      const len = p.len || 6, sag = p.sag ?? 0.35, n = Math.max(4, Math.round(len * 2.2));
      const cols = p.colors || ['#fff2a8', '#ff9ad0', '#9ad0ff', '#ffd36a'];
      const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push(new THREE.Vector3(-len / 2 + k * len, -Math.sin(k * Math.PI) * sag, 0)); }
      const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.008, 3), M('#1a1a1a')); g.add(wire);
      for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const b = new THREE.Mesh(sphG(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: cols[i % cols.length] })); b.position.set(-len / 2 + k * len, -Math.sin(k * Math.PI) * sag - 0.05, 0); g.add(b); }
      DECO_ONLY(g); break;
    }
    case 'bunting': {
      const len = p.len || 6, sag = p.sag ?? 0.3, n = Math.round(len * 2.4);
      const cols = p.colors || ['#d6303a', '#ffd36a', '#2f5fd0', '#f4f1ea'];
      const tri = geo('bunt', () => { const s = new THREE.Shape(); s.moveTo(-0.1, 0); s.lineTo(0.1, 0); s.lineTo(0, -0.24); s.closePath(); return new THREE.ShapeGeometry(s); });
      for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const f = new THREE.Mesh(tri, M(cols[i % cols.length], { side: THREE.DoubleSide, roughness: 1 })); f.position.set(-len / 2 + k * len, -Math.sin(k * Math.PI) * sag, 0); f.rotation.y = (i % 2) * 0.2; g.add(f); }
      const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push(new THREE.Vector3(-len / 2 + k * len, -Math.sin(k * Math.PI) * sag + 0.005, 0)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.006, 3), M('#d8d0c0')));
      DECO_ONLY(g); break;
    }
    case 'hanging_bulb': {
      const len = p.len || 1.2, c = p.color || '#ffe2a8';
      C(g, 0.004, 0.004, len, '#111', 0, -len, 0, 4);
      C(g, 0.03, 0.03, 0.05, '#2a2a2a', 0, -len - 0.03, 0, 8);
      S(g, 0.055, M(c, { emissive: c, emissiveIntensity: p.off ? 0 : 2.2 }), 0, -len - 0.08, 0);
      if (p.shade) { const sh = new THREE.Mesh(geo('bulbshade', () => new THREE.ConeGeometry(0.2, 0.16, 12, 1, true)), M(p.shade, { side: THREE.DoubleSide, metalness: 0.4 })); sh.position.y = -len - 0.02; g.add(sh); }
      DECO_ONLY(g); g.userData.sway = true; break;
    }
    case 'candle_set': {
      const n = p.n || 4;
      for (let i = 0; i < n; i++) { const a = i * 2.4, r = i ? 0.09 + (i % 2) * 0.05 : 0; const h = 0.12 + ((i * 37) % 10) / 50; const x = Math.cos(a) * r, z = Math.sin(a) * r;
        C(g, 0.025, 0.028, h, '#efe6d0', x, 0, z, 8); for (let k = 0; k < 2; k++) C(g, 0.006, 0.004, 0.05, '#efe6d0', x + 0.02 * (k ? 1 : -1), h - 0.06, z + 0.01, 4);
        const f = new THREE.Mesh(geo('flame', () => new THREE.ConeGeometry(0.012, 0.045, 6).translate(0, 0.022, 0)), new THREE.MeshBasicMaterial({ color: '#ffcf6a' })); f.position.set(x, h + 0.004, z); g.add(f); }
      if (p.light) { const pl = new THREE.PointLight('#ff9a4a', 1.4, 3.5, 2); pl.position.y = 0.35; g.add(pl); g.userData.flicker = pl; }
      DECO_ONLY(g); break;
    }
    case 'debris': {
      const c = p.color || '#4a3424';
      for (let i = 0; i < 5; i++) { const s = (seedOf(p) + i * 17) % 10; const b = B(g, 0.08 + s * 0.04, 0.03, 0.08, i % 2 ? c : shade(c, -8), (s - 5) * 0.08, 0, ((s * 3) % 10 - 5) * 0.06); b.rotation.y = s; }
      for (let i = 0; i < 3; i++) { const s = (seedOf(p) + i * 29) % 10; const pp = Plane(g, 0.14, 0.1, paperTex('scrap' + (i % 2), { w: 48, h: 36, lines: 3, stain: false }), (s - 5) * 0.1, 0.004 + i * 0.002, (5 - s) * 0.07); pp.rotation.set(-Math.PI / 2, 0, s); }
      DECO_ONLY(g); break;
    }
    case 'bottles': {
      const cols = ['#2a5a2a', '#6a3a1a', '#3a4a6a', '#5a5a2a'];
      for (let i = 0; i < (p.n || 4); i++) { const x = (i - 1.5) * 0.1, c = cols[(seedOf(p) + i) % 4]; const bm = M(c, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }); C(g, 0.035, 0.04, 0.2, bm, x, 0, (i % 2) * 0.05, 10); C(g, 0.012, 0.03, 0.08, bm, x, 0.2, (i % 2) * 0.05, 8); }
      if (p.fallen) { const fb = C(g, 0.035, 0.04, 0.2, M('#2a5a2a', { roughness: 0.15, transparent: true, opacity: 0.85 }), 0.3, 0.035, 0.1, 10); fb.rotation.z = Math.PI / 2; }
      DECO_ONLY(g); break;
    }
    case 'pipe_run': {
      const len = p.len || 8, c = p.color || '#5a5048';
      for (let i = 0; i < (p.n || 2); i++) { const pm = C(g, 0.06 - i * 0.015, 0.06 - i * 0.015, len, M(c, { metalness: 0.55, roughness: 0.5 }), 0, 0, i * 0.16, 8); pm.rotation.z = Math.PI / 2; pm.position.set(0, -i * 0.04, i * 0.16); }
      for (let k = 0; k < Math.floor(len / 2); k++) { const cl = B(g, 0.05, 0.12, 0.34, '#3a3632', -len / 2 + 1 + k * 2, -0.1, 0.06); void cl; }
      if (p.drip) for (let k = 0; k < 3; k++) S(g, 0.02, M('#6a8aaa', { roughness: 0.05 }), -len / 3 + k * len / 3, -0.1, 0);
      DECO_ONLY(g); break;
    }
    case 'wall_frame': {
      const w2 = p.w || 0.6, h2 = p.h || 0.8; const fc = p.color || '#5a3a1a';
      B(g, w2 + 0.1, h2 + 0.1, 0.05, fc, 0, -h2 / 2 - 0.05, 0); B(g, w2 + 0.02, h2 + 0.02, 0.06, shade(fc, 10), 0, -h2 / 2 - 0.01, -0.005);
      const art = p.art || THEME; const k = seedOf(p) % 3;
      Plane(g, w2, h2, canvasTex(96, 128, (x, w, h) => {
        if (art === 'doll') { x.fillStyle = ['#3a2a3a', '#2a3a3a', '#4a3020'][k]; x.fillRect(0, 0, w, h); x.fillStyle = '#e8d8c8'; x.beginPath(); x.ellipse(48, 52, 20, 26, 0, 0, 7); x.fill(); x.fillStyle = '#d8b060'; x.beginPath(); x.ellipse(48, 40, 26, 22, 0, Math.PI, 0); x.fill(); x.fillStyle = '#5a6a9a'; x.fillRect(26, 80, 44, 48); x.fillStyle = '#111'; x.fillRect(40, 50, 4, 4); x.fillRect(53, 50, 4, 4); if (k === 1) { x.fillStyle = '#000'; x.fillRect(36, 46, 26, 10); } }
        else if (art === 'ophelia') { x.fillStyle = '#2a3a4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a6a7a'; x.fillRect(0, 80, w, 48); x.fillStyle = '#1a1a1a'; x.beginPath(); x.moveTo(20, 84); x.lineTo(76, 84); x.lineTo(68, 96); x.lineTo(28, 96); x.fill(); x.fillRect(46, 50, 3, 34); x.fillStyle = '#e8e0d0'; x.beginPath(); x.moveTo(49, 52); x.lineTo(72, 80); x.lineTo(49, 80); x.fill(); }
        else if (art === 'kimono') { x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a1a10'; x.lineWidth = 3; x.beginPath(); x.moveTo(20, 120); x.quadraticCurveTo(40, 60, 70, 30); x.stroke(); x.fillStyle = '#c0202a'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(30 + i * 9, 100 - i * 13, 6, 0, 7); x.fill(); } }
        else if (art === 'west') { x.fillStyle = '#c89060'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a4a2a'; x.beginPath(); x.moveTo(0, 90); x.lineTo(20, 60); x.lineTo(40, 60); x.lineTo(50, 80); x.lineTo(70, 50); x.lineTo(96, 50); x.lineTo(96, 128); x.lineTo(0, 128); x.fill(); x.fillStyle = '#ffd08a'; x.beginPath(); x.arc(70, 26, 12, 0, 7); x.fill(); }
        else if (art === 'clown') { x.fillStyle = '#1a0a24'; x.fillRect(0, 0, w, h); x.fillStyle = '#f6f2ea'; x.beginPath(); x.ellipse(48, 58, 24, 30, 0, 0, 7); x.fill(); x.fillStyle = '#d0101a'; x.beginPath(); x.arc(48, 62, 6, 0, 7); x.fill(); x.strokeStyle = '#a0101a'; x.lineWidth = 4; x.beginPath(); x.arc(48, 66, 14, 0.2, Math.PI - 0.2); x.stroke(); x.fillStyle = '#2f5fd0'; x.beginPath(); x.moveTo(36, 30); x.lineTo(60, 30); x.lineTo(48, 4); x.fill(); }
        else if (art === 'hospital') { x.fillStyle = '#d8dcd8'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a4a46'; x.font = 'bold 12px sans-serif'; x.fillText('개원 1974', 18, 20); x.fillStyle = '#6a7a76'; x.fillRect(14, 30, 68, 50); x.fillStyle = '#2a3a36'; for (let i = 0; i < 4; i++) x.fillRect(14, 90 + i * 9, 68 - i * 8, 3); }
        else if (art === 'camp') { x.fillStyle = '#2a4a6a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a3a1a'; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(i * 22, 128); x.lineTo(i * 22 + 12, 70 + (i % 2) * 10); x.lineTo(i * 22 + 24, 128); x.fill(); } x.fillStyle = '#f8f0c8'; x.beginPath(); x.arc(70, 26, 9, 0, 7); x.fill(); }
        else { x.fillStyle = ['#6a1e1e', '#2e4a2a', '#1e3a5a'][k]; x.fillRect(0, 0, w, h); x.fillStyle = '#d8b878'; x.beginPath(); x.arc(48, 40, 16, 0, 7); x.fill(); x.fillStyle = '#c8a058'; x.fillRect(32, 58, 32, 50); x.strokeStyle = '#e8c870'; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8); }
        const vg = x.createRadialGradient(48, 64, 20, 48, 64, 90); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = vg; x.fillRect(0, 0, w, h);
      }, 'wf' + art + k), 0, 0, 0.032); // 그림 가운데를 액자 가운데(높이 0)에 맞춘다
      DECO_ONLY(g); if (p.tilt) g.rotation.z = p.tilt; break;
    }
    case 'talisman': {
      // 노란 부적: 붉은 주사 글씨
      const tex = canvasTex(48, 128, (x, w, h) => { x.fillStyle = '#e8c84a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b01010'; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = '#a00a0a'; x.font = 'bold 20px serif'; x.textAlign = 'center'; x.fillText('勅', 24, 30); x.lineWidth = 2.4; x.beginPath(); for (let i = 0; i < 6; i++) { x.moveTo(12, 44 + i * 12); x.quadraticCurveTo(36, 40 + i * 12, 24, 52 + i * 12); } x.stroke(); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(90,60,10,${Math.random() * 0.15})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, 'talisman');
      const pl = Plane(g, 0.16, 0.42, tex, 0, -0.21, 0.01, { side: THREE.DoubleSide }); pl.rotation.z = ((seedOf(p) % 5) - 2) * 0.06; DECO_ONLY(g); break;
    }
    case 'shimenawa': {
      const len = p.len || 3;
      const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push(new THREE.Vector3(-len / 2 + k * len, -Math.sin(k * Math.PI) * 0.25, 0)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.05, 6), M('#c8b070', { roughness: 1 })));
      const zz = geo('shide', () => { const s = new THREE.Shape(); s.moveTo(-0.04, 0); s.lineTo(0.04, 0); s.lineTo(0.04, -0.1); s.lineTo(-0.02, -0.1); s.lineTo(0.04, -0.2); s.lineTo(-0.02, -0.2); s.lineTo(0.02, -0.32); s.lineTo(-0.04, -0.2); s.lineTo(0.0, -0.2); s.lineTo(-0.04, -0.1); s.closePath(); return new THREE.ShapeGeometry(s); });
      for (let i = 1; i < 5; i++) { const k = i / 5; const m = new THREE.Mesh(zz, M('#f8f6f0', { side: THREE.DoubleSide, emissive: '#222', emissiveIntensity: 0.3 })); m.position.set(-len / 2 + k * len, -Math.sin(k * Math.PI) * 0.25 - 0.04, 0.03); g.add(m); }
      DECO_ONLY(g); break;
    }
    case 'tumbleweed': { const m = new THREE.Mesh(geo('tumble', () => new THREE.IcosahedronGeometry(0.4, 1)), M('#8a6a3a', { wireframe: true })); m.position.y = 0.38; g.add(m); const m2 = new THREE.Mesh(geo('tumble2', () => new THREE.IcosahedronGeometry(0.3, 0)), M('#6a4a2a', { wireframe: true })); m2.position.y = 0.38; m2.rotation.set(1, 2, 0); g.add(m2); DECO_ONLY(g); break; }
    case 'cow_skull': { const sk = S(g, 0.16, '#e8e0cc', 0, 0.1, 0); sk.scale.set(1, 0.7, 1.4); for (const s of [-1, 1]) { const h = C(g, 0.025, 0.05, 0.36, '#d8ccb0', 0.2 * s, 0.1, -0.05, 6); h.rotation.z = -1.2 * s; S(g, 0.04, '#111', 0.07 * s, 0.14, 0.12); } DECO_ONLY(g); break; }
    case 'seaweed': { for (let i = 0; i < 5; i++) { const s = C(g, 0.02, 0.008, 0.5 + (i % 3) * 0.2, M('#2f4a2a', { roughness: 0.4 }), (i - 2) * 0.06, -(0.5 + (i % 3) * 0.2), 0, 4); s.rotation.z = (i - 2) * 0.08; } DECO_ONLY(g); break; }
    case 'rope_coil': { for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(geo('rope' + i, () => new THREE.TorusGeometry(0.28 - i * 0.05, 0.035, 6, 20)), M('#a88a5a', { roughness: 1 })); r.rotation.x = Math.PI / 2; r.position.y = 0.035 + i * 0.05; g.add(r); } DECO_ONLY(g); break; }
    case 'toy_blocks': { const cols = ['#ff8fab', '#9ab7d8', '#ffd166', '#7ee0a8']; for (let i = 0; i < 6; i++) { const b = B(g, 0.12, 0.12, 0.12, cols[i % 4], (i % 3) * 0.13 - 0.13, Math.floor(i / 3) * 0.12, 0); b.rotation.y = i * 0.3; } DECO_ONLY(g); break; }
    case 'teddy': {
      const fur = M(p.color || '#8a5a3a'), lite = M('#e8c9a0');
      const body = S(g, 0.14, fur, 0, 0.14, 0); body.scale.set(1, 1.1, 0.9); S(g, 0.11, fur, 0, 0.36, 0.02); S(g, 0.045, lite, 0, 0.34, 0.12);
      for (const s of [-1, 1]) { S(g, 0.045, fur, 0.08 * s, 0.46, 0); S(g, 0.06, fur, 0.13 * s, 0.18, 0.04); S(g, 0.06, fur, 0.08 * s, 0.04, 0.1); S(g, 0.016, '#111', 0.04 * s, 0.39, 0.1); }
      if (p.torn) { const st = C(g, 0.005, 0.005, 0.12, '#e8e0c0', 0.05, 0.1, 0.13, 4); st.rotation.z = 0.8; }
      DECO_ONLY(g); break;
    }
    case 'mushrooms': { for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.12, z = (i % 2) * 0.1; const h = 0.06 + (i % 3) * 0.04; C(g, 0.015, 0.02, h, '#e8e0cc', x, 0, z, 6); const cap = S(g, 0.04 + (i % 2) * 0.02, M(p.color || '#c8a060', { emissive: p.glow || '#000', emissiveIntensity: p.glow ? 0.8 : 0 }), x, h, z); cap.scale.y = 0.55; } DECO_ONLY(g); break; }
    case 'blood_smear': { const tex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = 'rgba(90,0,0,.85)'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(64 + (Math.random() - 0.5) * 60, 64 + (Math.random() - 0.5) * 60, 6 + Math.random() * 22, 4 + Math.random() * 14, Math.random() * 3, 0, 7); x.fill(); } for (let i = 0; i < 30; i++) { x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, 7); x.fill(); } }, 'blood' + (seedOf(p) % 2)); const m = Plane(g, p.s || 1.1, p.s || 1.1, tex, 0, 0.012, 0, { transparent: true, depthWrite: false, roughness: 0.3 }); m.rotation.x = -Math.PI / 2; m.rotation.z = seedOf(p); m.userData.noOcc = true; m.castShadow = false; break; }
    case 'handprints': { const tex = canvasTex(128, 128, (x) => { x.fillStyle = 'rgba(110,0,0,.8)'; for (let k = 0; k < 3; k++) { const cx = 30 + k * 34, cy = 70 - (k % 2) * 24; x.beginPath(); x.ellipse(cx, cy, 10, 12, 0, 0, 7); x.fill(); for (let f = 0; f < 5; f++) { const a = -Math.PI / 2 + (f - 2) * 0.35; x.beginPath(); x.ellipse(cx + Math.cos(a) * 17, cy + Math.sin(a) * 19, 3, 6, a + Math.PI / 2, 0, 7); x.fill(); } x.fillRect(cx - 2, cy + 10, 3, 20 + k * 6); } }, 'handprints'); Plane(g, 0.9, 0.9, tex, 0, 0, 0.01, { transparent: true, depthWrite: false }); DECO_ONLY(g); break; }
    case 'neon_sign': {
      const txt = String(p.text || 'OPEN'), c = p.color || '#ff3a8a';
      const tex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#0a0410'; x.fillRect(0, 0, w, h); x.font = 'bold 40px "Gowun Dodum", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = c; x.shadowBlur = 14; x.fillStyle = '#ffffff'; x.fillText(txt, w / 2, h / 2 + 2); x.shadowBlur = 0; x.strokeStyle = c; x.lineWidth = 2; x.strokeText(txt, w / 2, h / 2 + 2); }, 'neon' + txt + c);
      const m = new THREE.Mesh(geo('p1.6x0.4', () => new THREE.PlaneGeometry(1.6, 0.4)), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: '#ffffff' })); m.position.z = 0.02; g.add(m);
      B(g, 1.66, 0.46, 0.03, '#1a1a1e', 0, -0.23, 0); DECO_ONLY(g); g.userData.neon = m; break;
    }
    case 'bamboo': { for (let i = 0; i < (p.n || 5); i++) { const h = 3 + ((seedOf(p) + i * 13) % 10) * 0.25; const x = Math.cos(i * 2.4) * 0.3 * (i ? 1 : 0), z = Math.sin(i * 2.4) * 0.3 * (i ? 1 : 0); C(g, 0.045, 0.05, h, M('#5a8a3a', { roughness: 0.5 }), x, 0, z, 6); for (let k = 1; k < 5; k++) C(g, 0.055, 0.055, 0.03, '#4a7a2a', x, (h * k) / 5, z, 6); const lf = S(g, 0.3, M('#3a6a2a', { flatShading: true }), x, h, z); lf.scale.set(1, 0.4, 1); } break; }
    case 'mesa': { const c = p.color || '#8a3a20'; const s = p.s || 1; const m1 = new THREE.Mesh(geo('mesa', () => { const gg = new THREE.CylinderGeometry(3.2, 4.2, 4, 7, 2); const ps = gg.attributes.position; for (let i = 0; i < ps.count; i++) { const y = ps.getY(i); const a = Math.atan2(ps.getZ(i), ps.getX(i)); const j = 1 + Math.sin(a * 3 + y) * 0.12; ps.setX(i, ps.getX(i) * j); ps.setZ(i, ps.getZ(i) * j); } gg.computeVertexNormals(); return gg; }), M(c, { flatShading: true, roughness: 1 })); m1.scale.set(s * 1.4, s, s); m1.position.y = 2 * s; g.add(m1); const band = new THREE.Mesh(cylG(3.0, 3.05, 0.3, 7), M(shade(c, 12), { flatShading: true })); band.scale.set(s * 1.4, s, s); band.position.y = 3.2 * s; g.add(band); DECO_ONLY(g); break; }
    case 'crt_tv': { B(g, 0.6, 0.48, 0.5, '#2a2622'); const scr = Plane(g, 0.46, 0.34, canvasTex(64, 48, (x, w, h) => { const id = x.createImageData(w, h); for (let i = 0; i < id.data.length; i += 4) { const v = 60 + Math.random() * 150; id.data[i] = v * 0.8; id.data[i + 1] = v; id.data[i + 2] = v * 0.9; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); }, 'crt'), 0, 0.24, 0.255, { emissive: '#8aa898', emissiveIntensity: 0.9, emissiveMap: null }); scr.material.emissiveMap = scr.material.map; C(g, 0.006, 0.006, 0.3, '#666', -0.12, 0.48, 0, 4).rotation.z = 0.5; C(g, 0.006, 0.006, 0.3, '#666', 0.12, 0.48, 0, 4).rotation.z = -0.5; break; }
    case 'drape': { const c = p.color || '#8a0a1a'; const w2 = p.w || 2, h2 = p.h || 3.2; const gg = geo(`drape${w2},${h2}`, () => { const pg = new THREE.PlaneGeometry(w2, h2, 24, 1); const ps = pg.attributes.position; for (let i = 0; i < ps.count; i++) ps.setZ(i, Math.sin(ps.getX(i) * 9) * 0.06); pg.computeVertexNormals(); return pg; }); const m = new THREE.Mesh(gg, M(c, { roughness: 0.95, side: THREE.DoubleSide })); m.position.y = -h2 / 2; g.add(m); B(g, w2 + 0.1, 0.12, 0.08, p.trim || '#c9a24a', 0, -0.12, 0, { metalness: 0.5 }); DECO_ONLY(g); break; }
    case 'radiator': { for (let i = 0; i < 9; i++) B(g, 0.06, 0.6, 0.14, '#b8bcb4', -0.32 + i * 0.08, 0.08, 0, { metalness: 0.4, roughness: 0.6 }); B(g, 0.74, 0.04, 0.16, '#a8aca4', 0, 0.12, 0); B(g, 0.74, 0.04, 0.16, '#a8aca4', 0, 0.62, 0); DECO_ONLY(g); break; }
    case 'wagon_wheel': { const w = new THREE.Mesh(geo('wwheel', () => new THREE.TorusGeometry(0.5, 0.05, 6, 20)), M('#5a3a1a')); w.position.y = 0.52; w.rotation.y = 0.3; w.rotation.x = 0.25; g.add(w); for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(boxG(0.04, 1.0, 0.03), M('#6a4426')); sp.rotation.z = (i * Math.PI) / 6; w.add(sp); } DECO_ONLY(g); break; }
    case 'wall_shelf': { B(g, 1.0, 0.04, 0.24, '#4a3020', 0, 0, 0.1); for (const s of [-1, 1]) B(g, 0.03, 0.14, 0.18, '#3a2416', 0.4 * s, -0.14, 0.08); const items = p.items || ['#6a3a1a', '#2a5a2a', '#e8e0cc', '#3a4a6a']; items.forEach((c, i) => { if (i % 2) C(g, 0.05, 0.05, 0.16, M(c, { roughness: 0.3 }), -0.33 + i * 0.22, 0.04, 0.1, 8); else B(g, 0.09, 0.12, 0.09, c, -0.33 + i * 0.22, 0.04, 0.1); }); DECO_ONLY(g); break; }
    case 'leaves': { const cols = p.colors || ['#6a4a1a', '#8a5a1a', '#5a3a1a', '#7a6a2a']; const lg = geo('leaf', () => new THREE.CircleGeometry(0.06, 5)); for (let i = 0; i < (p.n || 14); i++) { const s = (seedOf(p) + i * 41) % 100; const l = new THREE.Mesh(lg, M(cols[i % cols.length], { side: THREE.DoubleSide, roughness: 1 })); l.rotation.x = -Math.PI / 2; l.rotation.z = s; l.position.set(((s * 7) % 100 / 100 - 0.5) * (p.r2 || 1.6), 0.01 + i * 0.0005, ((s * 13) % 100 / 100 - 0.5) * (p.r2 || 1.6)); l.scale.set(1, 0.6, 1); g.add(l); } DECO_ONLY(g); break; }
    case 'stepping_stone': { const r = S(g, 0.35, '#7a7a72', 0, 0.02, 0); r.scale.set(1, 0.12, 0.8); r.castShadow = false; r.receiveShadow = true; break; }
    // ── 놀이공원 (해피니스 랜드) — 움직이는 놀이기구는 anim 으로 돌린다
    case 'carousel_big': {
      const r2 = p.r2 || 3.2; C(g, r2, r2 + 0.1, 0.3, '#f4e8f0'); C(g, 0.3, 0.3, 3.2, '#ffd36a', 0, 0.3, 0, 16, { metalness: 0.6 });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(r2 + 0.5, 1.4, 32, 1, true), M('#c0262d', { side: THREE.DoubleSide })); roof.position.y = 4.1; g.add(roof);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const h = new THREE.Group(); h.position.set(Math.cos(a) * r2 * 0.72, 0, Math.sin(a) * r2 * 0.72); h.rotation.y = Math.PI - a; g.add(h); // 말머리가 진행 방향(위에서 볼 때 반시계)을 보게 C(h, 0.03, 0.03, 3.4, '#ffd36a', 0, 0.3, 0, 8, { metalness: 0.7 });
        B(h, 0.28, 0.32, 0.85, ['#fff', '#d8c8ff', '#ffd1e8', '#c8f0ff'][i % 4], 0, 1.05, 0); B(h, 0.2, 0.4, 0.24, ['#fff', '#d8c8ff', '#ffd1e8', '#c8f0ff'][i % 4], 0, 1.3, 0.45); B(h, 0.06, 0.28, 0.28, '#3a1a2a', 0, 1.4, 0.26); if (i % 3 === 0) S(h, 0.05, '#c00', 0.08, 1.62, 0.56); }
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; S(g, 0.06, i % 2 ? '#fff2a8' : '#ff9ad0', Math.cos(a) * (r2 + 0.45), 3.45, Math.sin(a) * (r2 + 0.45), { emissive: '#ffcc66', emissiveIntensity: i % 5 ? 0.9 : 0 }); }
      break;
    }
    case 'ferris_wheel': {
      const R = p.r2 || 6, ax = R + 1.2; for (const s of [-1, 1]) for (const k of [-1, 1]) { const l = C(g, 0.12, 0.16, ax + 0.4, '#d8d0e0', 0.9 * k, 0, 0.7 * s, 8, { metalness: 0.5 }); l.rotation.z = 0.28 * k; }
      const wheel = new THREE.Group(); wheel.position.y = ax; g.add(wheel); g.userData.wheel = wheel;
      for (const s of [-0.35, 0.35]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.08, 8, 72), M('#8a2a4a', { metalness: 0.4 })); rim.position.z = s; wheel.add(rim); }
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const sp = B(wheel, 0.06, R, 0.06, '#c8c0d0', 0, 0, 0); sp.geometry = sp.geometry.clone(); sp.geometry.translate(0, -R / 2, 0); sp.position.set(0, 0, 0); sp.rotation.z = a; }
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const cab = new THREE.Group(); cab.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); wheel.add(cab); B(cab, 1.0, 0.8, 0.9, ['#6a2a3a', '#2a4a6a', '#4a5a2a', '#5a3a6a'][i % 4], 0, -1.0, 0); B(cab, 1.1, 0.08, 1.0, '#2a2026', 0, -0.25, 0); if (i === 6) S(cab, 0.12, '#f4f1ea', 0, -0.55, 0.47, { emissive: '#888', emissiveIntensity: 0.6 }); }
      g.userData.spinWheel = p.speed ?? 0.08; break;
    }
    case 'pirate_frame': { for (const s of [-1, 1]) for (const k of [-1, 1]) { const l = C(g, 0.14, 0.18, 6.6, '#6a5a50', 2.2 * k, 0, 1.4 * s, 8); l.rotation.z = 0.32 * k; } B(g, 0.3, 0.3, 3.2, '#4a3a30', 0, 6.05, 0); break; } // 회전축은 앞뒤(z) 방향, 높이 6.2
    case 'pirate_boat': {
      // 무리: 회전 중심(높이 0)이 꼭대기 축이 되도록 배를 아래로 매단다
      const L = 6;
      for (const s of [-1, 1]) { const arm = B(g, 0.12, 4.4, 0.12, '#3a2a20', 0, -4.4, 1.0 * s); arm.rotation.x = 0; }
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, L, 24, 1, false, 0, Math.PI), M('#5a2a1a')); hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2; hull.position.y = -4.6; g.add(hull);
      B(g, L, 0.1, 2.1, '#8a5a3a', 0, -4.62, 0); for (let i = 0; i < 6; i++) B(g, 0.12, 0.5, 2.0, '#2a1a10', -2.4 + i * 0.95, -4.5, 0);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 12), M('#c9a24a', { metalness: 0.5 })); head.rotation.z = -Math.PI / 2; head.position.set(L / 2 + 0.6, -4.2, 0); g.add(head);
      const sk = S(g, 0.3, '#f4f1ea', L / 2 + 0.9, -3.6, 0); sk.scale.set(1, 1.1, 0.9); break;
    }
    case 'drop_tower': {
      const h = p.h || 14; B(g, 1.4, h, 1.4, '#3a3a44', 0, 0, 0); for (let i = 0; i < h; i += 1) B(g, 1.5, 0.06, 1.5, '#ffd36a', 0, i, 0, { emissive: '#aa7a10', emissiveIntensity: i % 2 ? 0.6 : 0 });
      B(g, 2.4, 0.6, 2.4, '#c0262d', 0, h, 0); const sign = canvasTex(256, 64, (x, w, hh) => { x.fillStyle = '#1a0a14'; x.fillRect(0, 0, w, hh); x.fillStyle = '#ffd36a'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText('SKY DROP', w / 2, 46); }); Plane(g, 2.2, 0.55, sign, 0, h + 0.3, 1.22); break;
    }
    case 'drop_car': { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.25, 10, 28), M('#d6303a', { metalness: 0.3 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.5; g.add(ring); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B(g, 0.4, 0.7, 0.3, '#2a2a30', Math.cos(a) * 1.35, 0.2, Math.sin(a) * 1.35).rotation.y = -a; } break; }
    case 'swing': {
      // 놀이터 그네: 양쪽 A자 기둥 + 가로대, 쇠사슬 두 줄에 매달린 좌석 (좌석은 가로대를 축으로 흔들린다)
      const w2 = p.w || 1.5, top = 2.4, rust = '#7a3a2a', metal = { metalness: 0.5, roughness: 0.6 };
      for (const s of [-1, 1]) for (const k of [-1, 1]) { const leg = C(g, 0.045, 0.06, top + 0.25, p.color || '#c0392b', s * (w2 / 2 + 0.1), -0.06, k * 0.55, 10, metal); leg.rotation.x = -k * 0.23; }
      const bar = C(g, 0.055, 0.055, w2 + 0.45, p.color || '#c0392b', 0, 0, 0, 12, metal); bar.rotation.z = Math.PI / 2; bar.position.y = top;
      const seat = new THREE.Group(); seat.position.y = top; g.add(seat); g.userData.seat = seat;
      const chainL = top - 0.5;
      for (const s of [-0.24, 0.24]) {
        for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.011, 5, 10), M('#d8d8e0', { metalness: 0.6, roughness: 0.35 })); l.position.set(s, -0.08 - i * (chainL / 12), 0); l.rotation.y = i % 2 ? Math.PI / 2 : 0; seat.add(l); }
      }
      B(seat, 0.62, 0.07, 0.26, p.seat || '#e8c13a', 0, -chainL - 0.06, 0, { roughness: 0.45 });
      B(seat, 0.62, 0.02, 0.26, rust, 0, -chainL - 0.08, 0);
      break;
    }
    case 'teacup': { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.8, 28, 1, true), M(p.color || '#ff9ad0', { side: THREE.DoubleSide })); c.position.y = 0.6; g.add(c); C(g, 0.6, 0.6, 0.05, p.color || '#ff9ad0', 0, 0.2); const hd = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 8, 16), M('#ffffff')); hd.position.set(0.95, 0.7, 0); g.add(hd); C(g, 0.4, 0.5, 0.2, '#f4f1ea', 0, 0); break; }
    case 'bumper_car': { const b = B(g, 1.2, 0.4, 1.7, p.color || '#2f5fd0', 0, 0.15, 0); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.12, 8, 24), M('#1a1a1a')); rim.rotation.x = Math.PI / 2; rim.scale.set(0.75, 1.05, 1); rim.position.y = 0.25; g.add(rim); C(g, 0.03, 0.03, 2.0, '#888', 0, 0.5, -0.6, 6); B(g, 0.9, 0.4, 0.3, '#111', 0, 0.55, -0.4); break; }
    case 'parade_float': {
      B(g, 2.4, 0.6, 3.6, p.color || '#7a1a5a', 0, 0.2); for (const s of [-1, 1]) for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 8, 16), M('#2a2a2a')); w.rotation.y = Math.PI / 2; w.position.set(1.2 * s, 0.3, 1.2 * k); g.add(w); }
      const hd = S(g, 0.9, '#f6f2ea', 0, 1.9, 0.6); for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.1, 6, 12), M('#f6f2ea')); ear.position.set(0.4 * s, 3.1, 0.5); ear.rotation.z = -0.15 * s; g.add(ear); S(g, 0.11, '#111', 0.32 * s, 2.05, 1.38); }
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 6, 20, Math.PI), M('#8e1c17')); smile.rotation.z = Math.PI; smile.position.set(0, 1.75, 1.42); g.add(smile);
      for (let i = 0; i < 10; i++) S(g, 0.07, ['#fff2a8', '#ff9ad0', '#9ad0ff'][i % 3], -1.1 + (i % 5) * 0.55, 0.9, i < 5 ? 1.82 : -1.82, { emissive: '#ffcc66', emissiveIntensity: 0.8 });
      break;
    }
    case 'mascot_statue': {
      // 해피 토끼: 하얀 털 탈, 단추 눈, 꿰맨 웃음 — 오래돼서 군데군데 찢어졌다
      const s2 = p.s || 1; const fur = M('#e8e2d8', { roughness: 1 }), dirt = M('#8a7a6a', { roughness: 1 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55 * s2, 0.6 * s2, 8, 20), fur); body.position.y = 0.95 * s2; g.add(body);
      const belly = S(g, 0.4 * s2, '#f6f2ea', 0, 0.9 * s2, 0.3 * s2); belly.scale.set(1, 1.1, 0.5);
      const hd = S(g, 0.6 * s2, '#e8e2d8', 0, 2.05 * s2, 0); hd.material = fur;
      for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.14 * s2, 0.9 * s2, 6, 14), sx > 0 ? dirt : fur); ear.position.set(0.25 * sx * s2, 2.95 * s2, 0); ear.rotation.z = sx > 0 ? -0.9 : -0.1; g.add(ear);
        const btn = C(g, 0.1 * s2, 0.1 * s2, 0.05, '#111', 0.22 * sx * s2, 2.1 * s2, 0.55 * s2, 16); btn.rotation.x = Math.PI / 2; S(g, 0.025 * s2, '#ddd', 0.2 * sx * s2, 2.14 * s2, 0.6 * s2); }
      const nose = S(g, 0.07 * s2, '#d8909a', 0, 1.92 * s2, 0.6 * s2);
      for (let i = 0; i < 7; i++) { const st = B(g, 0.02 * s2, 0.08 * s2, 0.02, '#3a1a10', -0.18 * s2 + i * 0.06 * s2, 1.75 * s2 - Math.sin((i / 6) * Math.PI) * 0.06 * s2, 0.55 * s2); st.castShadow = false; }
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2 * s2, 0.015, 6, 20, Math.PI), M('#3a1a10')); mouth.rotation.z = Math.PI; mouth.position.set(0, 1.8 * s2, 0.56 * s2); g.add(mouth);
      for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13 * s2, 0.5 * s2, 6, 12), fur); arm.position.set(0.62 * sx * s2, 1.1 * s2, 0); arm.rotation.z = 0.4 * sx; g.add(arm); }
      if (p.blood !== false) for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.06 + i * 0.015, 10), M('#6a0a0a', { side: THREE.DoubleSide })); d.position.set(0.3 * s2 - i * 0.07, 1.25 * s2 - i * 0.12, 0.6 * s2); g.add(d); }
      break;
    }
    case 'turnstile': { C(g, 0.18, 0.2, 1.0, '#8a8e94', 0, 0, 0, 16, { metalness: 0.7 }); for (let i = 0; i < 3; i++) { const a = C(g, 0.03, 0.03, 0.7, '#c9ccd0', 0, 0.95, 0, 8, { metalness: 0.8 }); a.rotation.set(Math.PI / 2, (i / 3) * Math.PI * 2, 0.4); } B(g, 0.1, 1.0, 1.4, '#4a4e54', 0.7, 0, 0); B(g, 0.1, 1.0, 1.4, '#4a4e54', -0.7, 0, 0); break; }
    case 'park_map': {
      for (const sx of [-1, 1]) C(g, 0.06, 0.06, 2.4, '#3a3a40', 0.9 * sx, 0);
      const tex = canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#e8dcb8'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a6a3a'; x.fillRect(8, 8, w - 16, h - 16); x.fillStyle = '#e8dcb8'; x.font = 'bold 16px sans-serif'; x.fillText('HAPPINESS LAND', 64, 26);
        const spots = [['정문', 128, 140], ['회전목마', 60, 110], ['유령의 집', 40, 60], ['관람차', 200, 50], ['바이킹', 210, 105], ['거울 미궁', 120, 70], ['스카이드롭', 150, 30], ['방송실', 90, 40]];
        x.font = '11px sans-serif'; spots.forEach(([n, px, py]) => { x.fillStyle = '#c0262d'; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillText(n, px + 7, py + 4); }); x.strokeStyle = 'rgba(80,0,0,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(120, 70); x.lineTo(150, 30); x.stroke(); });
      Plane(g, 1.9, 1.2, tex, 0, 1.8, 0.04); B(g, 2.0, 1.3, 0.06, '#2a2026', 0, 1.15, -0.01); break;
    }
    case 'speaker_pole': { C(g, 0.06, 0.08, 3.2, '#4a4e54', 0, 0, 0, 10, { metalness: 0.6 }); for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 14, 1, true), M('#c8c0b0', { side: THREE.DoubleSide })); h.rotation.z = Math.PI / 2 * sx; h.position.set(0.22 * sx, 3.0, 0); g.add(h); } break; }
    case 'hanging_dummy': {
      // 목맨 사람: 회전 중심(높이 0)이 천장 쪽 밧줄 끝 — swing 애니메이션으로 천천히 흔들린다
      // 실제 사람 비율(약 1.7m) · 축 늘어진 팔다리 · 옆으로 꺾인 고개 · 아래로 처진 발끝
      const skin = M('#c9bfb0', { roughness: 0.9 }), shirt = M(p.color || '#b8b0a2', { roughness: 1 }), pants = M('#2e2c34', { roughness: 1 }), rope = M('#a8946a', { roughness: 1 }), hair = M('#1a1412', { roughness: 0.9 }), shoe = M('#16141a', { roughness: 0.7 });
      const ph = (Math.abs(p.x || 0) * 7 + Math.abs(p.z || 0) * 3) % 1; // 사람마다 조금씩 다른 자세
      // 밧줄과 올가미
      const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.82, 6), rope); r1.position.y = -0.41; g.add(r1);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), rope); knot.position.set(0.05, -0.86, -0.02); g.add(knot);
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 6, 16), rope); loop.rotation.x = Math.PI / 2 - 0.3; loop.position.set(0, -0.97, 0); g.add(loop);
      // 몸 (위에서 아래로)
      const body = new THREE.Group(); body.position.y = -0.97; body.rotation.z = (ph - 0.5) * 0.08; g.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.16, 10), skin); neck.position.y = -0.05; body.add(neck);
      const head = new THREE.Group(); head.position.set(0, 0.07, 0.01); head.rotation.set(0.35, 0, 0.55 + ph * 0.3); body.add(head); // 고개가 앞·옆으로 꺾여 있다
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), skin); skull.scale.set(0.92, 1.08, 1); skull.position.y = 0.09; head.add(skull);
      const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hair); hairM.position.y = 0.1; hairM.rotation.x = -0.25; head.add(hairM);
      for (let i = 0; i < 7; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, 0.22, 4), hair); st.position.set(-0.08 + i * 0.027, 0.0, 0.05 - Math.abs(i - 3) * 0.02); st.rotation.x = 0.2; head.add(st); } // 얼굴을 반쯤 가린 머리카락
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 4), M('#0c0a0a')); e.position.set(0.035 * sx, 0.09, 0.098); head.add(e); }
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.01), M('#3a1a1a')); mouth.position.set(0, 0.03, 0.1); head.add(mouth);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.42, 6, 14), shirt); torso.scale.set(1, 1, 0.68); torso.position.y = -0.4; body.add(torso);
      const hip = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.12, 6, 12), pants); hip.scale.set(1.05, 1, 0.7); hip.position.y = -0.76; body.add(hip);
      for (const sx of [-1, 1]) {
        // 팔: 어깨에서 축 늘어져 몸 옆에 붙는다
        const arm = new THREE.Group(); arm.position.set(0.19 * sx, -0.2, 0); arm.rotation.z = 0.06 * sx; arm.rotation.x = (ph - 0.5) * 0.15 * sx; body.add(arm);
        const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.26, 4, 8), shirt); up.position.y = -0.17; arm.add(up);
        const lo = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.24, 4, 8), skin); lo.position.y = -0.48; arm.add(lo);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skin); hand.scale.set(0.8, 1.3, 0.6); hand.position.y = -0.66; arm.add(hand);
        // 다리: 힘없이 매달려 발끝이 아래로
        const leg = new THREE.Group(); leg.position.set(0.075 * sx, -0.84, 0); leg.rotation.x = (sx > 0 ? 0.06 : -0.04) + ph * 0.05; body.add(leg);
        const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.36, 4, 8), pants); th.position.y = -0.22; leg.add(th);
        const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 4, 8), pants); sh.position.y = -0.66; leg.add(sh);
        const ft = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.07, 0.2), shoe); ft.position.set(0, -0.9, 0.04); ft.rotation.x = 1.0; leg.add(ft);
      }
      break;
    }
    case 'control_panel': {
      B(g, 1.6, 1.0, 0.7, '#4a4e54', 0, 0, 0, { metalness: 0.4 }); const top = B(g, 1.6, 0.06, 0.8, '#2a2e34', 0, 1.0, 0.05); top.rotation.x = -0.3;
      for (let i = 0; i < 8; i++) S(g, 0.05, ['#d6303a', '#2fbf71', '#ffd43b', '#3b7dd8'][i % 4], -0.6 + (i % 4) * 0.4, 1.1 - Math.floor(i / 4) * 0.12, 0.05 + Math.floor(i / 4) * 0.18, { emissive: ['#d6303a', '#2fbf71', '#ffd43b', '#3b7dd8'][i % 4], emissiveIntensity: 0.7 });
      const lever = C(g, 0.03, 0.03, 0.4, '#c9ccd0', 0.65, 1.05, 0.25, 8, { metalness: 0.8 }); lever.rotation.x = -0.6; S(g, 0.06, '#d6303a', 0.65, 1.4, 0.38); break;
    }
    case 'gear_wall': { B(g, 3, 2.6, 0.2, '#3a3430', 0, 0, 0); [[-0.8, 1.4, 0.6], [0.5, 1.6, 0.45], [0.2, 0.7, 0.35], [-0.6, 0.5, 0.3]].forEach(([x, y, r]) => { const gr = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.25, 6, 16), M('#8a6a3a', { metalness: 0.7, roughness: 0.4 })); gr.position.set(x, y, 0.16); g.add(gr); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; B(g, 0.08, r * 0.3, 0.06, '#8a6a3a', x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15 - r * 0.15, 0.16).rotation.z = a - Math.PI / 2; } }); break; }
    case 'ghost_cart': { B(g, 1.2, 0.5, 1.6, '#2a0a14', 0, 0.15); B(g, 1.2, 0.7, 0.12, '#2a0a14', 0, 0.6, -0.75); const sk = S(g, 0.28, '#e8e0d0', 0, 1.0, 0.85); sk.scale.set(1, 1.1, 0.9); for (const sx of [-1, 1]) S(g, 0.06, '#000', 0.1 * sx, 1.05, 1.1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, 0.12, 0.12, 0.08, '#111', 0.62 * sx, 0, 0.6 * sz).rotation.z = Math.PI / 2; break; }
    case 'coffin': { const c = B(g, 0.8, 0.4, 2.0, '#2a1a12', 0, 0, 0); const lid = B(g, 0.84, 0.08, 2.04, '#3a2418', p.open ? 0.5 : 0, 0.4, 0); if (p.open) lid.rotation.z = 0.5; B(g, 0.06, 0.4, 0.06, '#c9a24a', 0, 0.42, 0.6, { metalness: 0.7 }); B(g, 0.3, 0.06, 0.06, '#c9a24a', 0, 0.62, 0.6, { metalness: 0.7 }); break; }
    case 'none': break;
    default: B(g, 0.6, 0.6, 0.6, '#777');
  }
  return g;
}
