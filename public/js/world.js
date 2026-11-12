import * as THREE from 'three';
import { buildProp, FOOT, setPropTheme } from './props.js';
import { textSprite } from './avatar.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEG = Math.PI / 180;
const lighten = (hex) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#6a7060'), 0.35).getHexString();

function footOf(p, g) {
  const f = g.userData.foot || FOOT[p.t];
  if (!f || p.y > 0.5) return null;
  const r = Math.abs(((p.r || 0) % 180 + 180) % 180);
  const swap = r > 45 && r < 135;
  return { x: p.x, z: p.z, hw: (swap ? f[1] : f[0]) / 2, hd: (swap ? f[0] : f[1]) / 2 };
}

function place(root, p) {
  const g = buildProp(p);
  g.position.set(p.x, p.y || 0, p.z);
  g.rotation.y = (p.r || 0) * DEG;
  root.add(g);
  return g;
}

function groundTex(color, noise = 0.12) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * noise})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 4); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function floorTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.12})`; x.fillRect(0, i * 32, 256, 2); for (let j = 0; j < 3; j++) x.fillRect(Math.random() * 256, i * 32, 2, 32); }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`; x.fillRect(Math.random() * 256, Math.random() * 256, 3, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function wallTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(20,10,5,${Math.random() * 0.15})`; x.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 40, 40 + Math.random() * 120); }
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 200, 256, 56);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ───────────────── 테마별 분위기 (색감 · 벽지 · 바닥 · 천장등 · 떠다니는 입자 · 장식)
// 결정적 난수: 같은 챕터는 모든 접속자 화면에서 장식 배치가 똑같다
function rng(seed) { let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) | 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

const THEMES = {
  gwimun: { tint: '#5a6a8a', fog: '#05070b', fogIn: '#050405', light: '#dfe8ff', fixture: 'tube', sky: ['#020308', '#141a26'], moon: '#f4f1e0', particles: 'ash', border: 'pine', ground: 'mud',
    wallDeco: ['talisman', 'wall_frame', 'clock_w', 'talisman', 'handprints'], floorDeco: ['debris', 'leaves', 'debris', 'blood_smear'], edge: 'none', webs: true },
  ophelia: { tint: '#4a7aa0', fog: '#061018', fogIn: '#05090c', light: '#ffd9a0', fixture: 'cage', sky: ['#04080e', '#1a2a36'], moon: '#d8e4f0', particles: 'mist', border: 'rocks', ground: 'gravel',
    wallDeco: ['porthole_w', 'lifebuoy_w', 'wall_frame', 'seaweed', 'sconce'], floorDeco: ['rope_coil', 'bottles', 'debris', 'blood_smear'], edge: 'pipe_run', webs: true },
  doll: { tint: '#9a6a8a', fog: '#0c0709', fogIn: '#0a0608', light: '#ffcf9a', fixture: 'chandelier', sky: ['#080408', '#20141c'], moon: '#f4e8f0', particles: 'sparkle', border: 'pine', ground: 'grass',
    wallDeco: ['wall_frame', 'sconce', 'wall_frame', 'wall_shelf', 'clock_w'], floorDeco: ['toy_blocks', 'teddy', 'debris', 'candle_set'], edge: 'none', webs: true },
  hospital: { tint: '#5a9a7a', fog: '#06100c', fogIn: '#050a08', light: '#d8fff0', fixture: 'tube', sky: ['#030806', '#0e1a16'], moon: '#e0f0e8', particles: 'motes', border: 'pine', ground: 'concrete',
    wallDeco: ['radiator_w', 'poster_w', 'wall_frame', 'handprints', 'clock_w'], floorDeco: ['debris', 'blood_smear', 'bottles', 'debris'], edge: 'pipe_run', webs: true },
  camp: { tint: '#5a7aaa', fog: '#060c12', fogIn: '#0a0806', light: '#ffd8a0', fixture: 'bulb', sky: ['#020616', '#0e2036'], moon: '#fff6d8', particles: 'fireflies', border: 'pine_dense', ground: 'grass',
    wallDeco: ['wall_frame', 'sconce', 'wall_shelf', 'poster_w'], floorDeco: ['leaves', 'mushrooms', 'debris', 'teddy'], edge: 'bunting', webs: true },
  west: { tint: '#aa7a4a', fog: '#140c06', fogIn: '#0e0806', light: '#ffb868', fixture: 'lantern_oil', sky: ['#0a0406', '#3a1a10'], moon: '#ffc890', particles: 'sand', border: 'mesa', ground: 'sand',
    wallDeco: ['wall_frame', 'cow_skull_w', 'sconce', 'poster_w', 'wall_shelf'], floorDeco: ['bottles', 'debris', 'wagon_wheel', 'leaves'], edge: 'none', webs: true },
  kimono: { tint: '#aa5a6a', fog: '#0e0608', fogIn: '#0c0606', light: '#ffb890', fixture: 'paper', sky: ['#06030a', '#24101a'], moon: '#ffd8d0', particles: 'petals', border: 'bamboo', ground: 'moss',
    wallDeco: ['wall_frame', 'talisman', 'sconce', 'wall_frame'], floorDeco: ['candle_set', 'leaves', 'debris'], edge: 'shimenawa', webs: true },
  mia: { tint: '#8a7a6a', fog: '#0a0806', fogIn: '#0a0806', light: '#ffe2b0', fixture: 'bulb', sky: ['#04040a', '#1a1622'], moon: '#fff2d8', particles: 'motes', border: 'none', ground: 'concrete',
    wallDeco: ['wall_frame', 'poster_w', 'wall_shelf', 'clock_w'], floorDeco: ['leaves', 'toy_blocks', 'debris', 'teddy'], edge: 'none', webs: true },
  clown: { tint: '#9a5aaa', fog: '#0c0612', fogIn: '#0a0410', light: '#ffc8e0', fixture: 'bulb_color', sky: ['#06020c', '#2a0e2e'], moon: '#ffe0f0', particles: 'confetti', border: 'carnival', ground: 'dirt',
    wallDeco: ['wall_frame', 'neon', 'poster_w', 'drape', 'sconce'], floorDeco: ['debris', 'bottles', 'teddy', 'blood_smear'], edge: 'string_lights', webs: true },
};
// 챕터별 벽지 · 바닥 (같은 테마라도 장소에 따라 다르다)
const ROOMS = {
  gwimun: { 1: ['school', 'planks'], 2: ['school', 'planks'], 3: ['hanji', 'jangpan'], 5: ['hanji', 'jangpan'], 6: ['stone', 'stone'] },
  ophelia: { 1: ['shipwood', 'deck'], 2: ['shipwood', 'deck'], 3: ['metal', 'metal'] },
  doll: { 0: ['damask', 'parquet'], 1: ['damask', 'parquet'], 2: ['damask', 'parquet'], 3: ['boards', 'planks'] },
  hospital: { 0: ['tile', 'checker'], 1: ['tile', 'checker'], 2: ['panel', 'parquet'], 3: ['tile_full', 'concrete'] },
  camp: { 1: ['logs', 'planks'] },
  west: { 1: ['boards', 'planks'], 3: ['rock', 'dirt'] },
  kimono: { 1: ['shoji', 'tatami'], 2: ['shoji', 'tatami'] },
  clown: { 1: ['stripe', 'checker'], 2: ['boards', 'straw'], 3: ['stripe', 'planks'], 4: ['tent', 'sawdust'], 5: ['boards', 'dirt'], 6: ['tent', 'sawdust'] },
};

const CV = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const toTex = (c) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const sh = (hex, l) => { const c = new THREE.Color(hex); const o = {}; c.getHSL(o); c.setHSL(o.h, o.s, Math.max(0, Math.min(1, o.l + l))); return '#' + c.getHexString(); };
function grime(x, w, h, n = 1400, a = 0.08) { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * a})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3); } }
function drips(x, w, h, n = 24, col = '20,10,5') { for (let i = 0; i < n; i++) { const px = Math.random() * w, len = 30 + Math.random() * h * 0.5; const g = x.createLinearGradient(0, h * 0.1, 0, h * 0.1 + len); g.addColorStop(0, `rgba(${col},.22)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(px, h * 0.05, 3 + Math.random() * 10, len); } }

// 벽 텍스처: 캔버스 위쪽 = 천장 쪽, 아래쪽 = 바닥 쪽 (벽 높이 전체가 한 장)
function themedWallTex(style, color) {
  const S2 = 512; const [c, x] = CV(S2, S2); const w = S2, h = S2;
  const base = color || '#5b5446';
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  const wainscot = (top, col, panels = 4) => { x.fillStyle = col; x.fillRect(0, top, w, h - top); x.fillStyle = sh(col, 0.08); x.fillRect(0, top, w, 10); x.strokeStyle = sh(col, -0.12); x.lineWidth = 4; for (let i = 0; i < panels; i++) { const pw = w / panels; x.strokeRect(i * pw + 12, top + 26, pw - 24, h - top - 60); } };
  switch (style) {
    case 'school': { // 위는 누런 회벽, 아래는 페인트 칠한 초록 허리벽 + 나무 몰딩
      x.fillStyle = sh(base, 0.12); x.fillRect(0, 0, w, h * 0.55); x.fillStyle = '#3f5a48'; x.fillRect(0, h * 0.55, w, h * 0.45); x.fillStyle = '#5a3f28'; x.fillRect(0, h * 0.55 - 8, w, 14);
      for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(Math.random() * w, h * 0.6 + Math.random() * h * 0.3, 40 + Math.random() * 80, 6); }
      drips(x, w, h * 0.55, 18); break; }
    case 'hanji': { // 한지 바른 벽 + 굵은 나무 기둥과 인방
      x.fillStyle = sh(base, 0.25); x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.strokeStyle = `rgba(120,90,50,${Math.random() * 0.1})`; x.beginPath(); const px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 30, py + (Math.random() - 0.5) * 8); x.stroke(); }
      x.fillStyle = '#3a2416'; x.fillRect(0, 0, 26, h); x.fillRect(w - 26, 0, 26, h); x.fillRect(0, h * 0.18, w, 18); x.fillRect(0, h * 0.82, w, 22);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(26, h * 0.18 + 18, w - 52, 6); break; }
    case 'stone': { for (let r = 0; r < 9; r++) for (let k = 0; k < 6; k++) { const bw = w / 5, bh = h / 9; const ox = (r % 2) * bw / 2; x.fillStyle = sh(base, (Math.random() - 0.5) * 0.08); x.fillRect(k * bw - ox + 3, r * bh + 3, bw - 6, bh - 6); } x.fillStyle = 'rgba(120,0,0,.35)'; for (let i = 0; i < 5; i++) { x.save(); x.translate(Math.random() * w, h * 0.3 + Math.random() * h * 0.4); x.rotate((Math.random() - 0.5) * 0.4); x.font = 'bold 54px serif'; x.fillText(['鬼', '門', '封', '死'][i % 4], 0, 0); x.restore(); } break; }
    case 'shipwood': { const pl = 14; for (let i = 0; i < pl; i++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.08); x.fillRect(0, i * (h / pl), w, h / pl - 3); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, (i + 1) * (h / pl) - 3, w, 3); for (let k = 0; k < 3; k++) { x.fillStyle = 'rgba(30,20,10,.3)'; x.fillRect(Math.random() * w, i * (h / pl), 2, h / pl); } }
      x.fillStyle = '#4a4440'; x.fillRect(0, h * 0.72, w, h * 0.28); for (let i = 0; i < 12; i++) { x.fillStyle = '#6a625a'; x.beginPath(); x.arc(20 + i * 44, h * 0.76, 5, 0, 7); x.fill(); x.beginPath(); x.arc(20 + i * 44, h * 0.95, 5, 0, 7); x.fill(); }
      drips(x, w, h, 20, '40,60,50'); break; }
    case 'metal': { for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.06); x.fillRect(k * w / 3 + 2, r * h / 4 + 2, w / 3 - 4, h / 4 - 4); for (let q = 0; q < 8; q++) { x.fillStyle = '#2a2420'; x.beginPath(); x.arc(k * w / 3 + 10 + (q % 4) * (w / 3 - 20) / 3, r * h / 4 + (q < 4 ? 10 : h / 4 - 10), 3, 0, 7); x.fill(); } } drips(x, w, h, 40, '110,50,20'); break; }
    case 'damask': { // 다마스크 벽지 + 나무 허리판
      x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = sh(base, 0.07);
      for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) { const cx = k * 128 + (r % 2) * 64 + 32, cy = r * 64 + 30; x.beginPath(); x.ellipse(cx, cy, 14, 24, 0, 0, 7); x.fill(); for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 16, cy + 6, 10, 6, s * 0.6, 0, 7); x.fill(); } x.fillRect(cx - 2, cy - 34, 4, 70); }
      for (let k = 0; k < 8; k++) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(k * 64, 0, 2, h * 0.62); }
      wainscot(h * 0.62, '#3a2216'); x.fillStyle = '#c9a24a'; x.fillRect(0, h * 0.62 - 4, w, 4); drips(x, w, h * 0.62, 10); break; }
    case 'tile': case 'tile_full': { const top = style === 'tile' ? h * 0.5 : 0; x.fillStyle = sh(base, 0.1); x.fillRect(0, 0, w, top);
      const ts = 32; for (let r = Math.floor(top / ts); r < h / ts; r++) for (let k = 0; k < w / ts; k++) { x.fillStyle = sh('#b8c8bc', (Math.random() - 0.5) * 0.06 - 0.1); x.fillRect(k * ts + 1, r * ts + 1, ts - 2, ts - 2); if (Math.random() < 0.04) { x.strokeStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.moveTo(k * ts + 4, r * ts + 4); x.lineTo(k * ts + ts - 6, r * ts + ts - 3); x.stroke(); } }
      if (top) { x.fillStyle = '#4a7a6a'; x.fillRect(0, top - 6, w, 12); } drips(x, w, h, 26, '40,60,30'); x.fillStyle = 'rgba(90,0,0,.18)'; x.fillRect(Math.random() * w, h * 0.7, 40, 120); break; }
    case 'panel': { for (let k = 0; k < 8; k++) { x.fillStyle = sh(base, (k % 2 ? 0.02 : -0.02)); x.fillRect(k * 64, 0, 62, h); } x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3; for (let k = 0; k < 4; k++) { x.strokeRect(k * 128 + 14, 30, 100, h * 0.45); x.strokeRect(k * 128 + 14, h * 0.58, 100, h * 0.34); } break; }
    case 'logs': { const n = 9; for (let i = 0; i < n; i++) { const y0 = i * (h / n); const g = x.createLinearGradient(0, y0, 0, y0 + h / n); g.addColorStop(0, sh(base, -0.12)); g.addColorStop(0.5, sh(base, 0.06)); g.addColorStop(1, sh(base, -0.16)); x.fillStyle = g; x.fillRect(0, y0, w, h / n); for (let k = 0; k < 6; k++) { x.strokeStyle = 'rgba(40,20,10,.25)'; x.beginPath(); x.moveTo(Math.random() * w, y0 + 8 + Math.random() * (h / n - 16)); x.lineTo(Math.random() * w, y0 + 8 + Math.random() * (h / n - 16)); x.stroke(); } x.fillStyle = 'rgba(220,200,160,.25)'; x.fillRect(0, y0 + h / n - 4, w, 3); } break; }
    case 'boards': { const n = 10; for (let i = 0; i < n; i++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.1); x.fillRect(i * (w / n), 0, w / n - 3, h); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect((i + 1) * (w / n) - 3, 0, 3, h); for (let k = 0; k < 2; k++) { x.fillStyle = '#2a2420'; x.beginPath(); x.arc(i * (w / n) + 8 + k * (w / n - 18), h * 0.15, 2.5, 0, 7); x.fill(); x.beginPath(); x.arc(i * (w / n) + 8 + k * (w / n - 18), h * 0.85, 2.5, 0, 7); x.fill(); } for (let k = 0; k < 4; k++) { x.strokeStyle = 'rgba(30,15,5,.25)'; x.beginPath(); const px = i * (w / n) + Math.random() * (w / n); x.moveTo(px, 0); x.bezierCurveTo(px + 6, h * 0.3, px - 6, h * 0.6, px, h); x.stroke(); } } break; }
    case 'rock': { for (let i = 0; i < 160; i++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.16); x.beginPath(); x.moveTo(Math.random() * w, Math.random() * h); for (let k = 0; k < 5; k++) x.lineTo(Math.random() * w, Math.random() * h); x.fill(); } x.globalAlpha = 0.6; x.fillStyle = '#5a3a20'; for (let i = 0; i < 4; i++) x.fillRect(i * 140 + 20, 0, 22, h); x.globalAlpha = 1; break; }
    case 'shoji': { // 회벽 + 검은 나무 살 + 아래 판벽
      x.fillStyle = sh(base, 0.12); x.fillRect(0, 0, w, h); x.fillStyle = '#2a1a12'; for (let k = 0; k <= 4; k++) x.fillRect(k * 128 - 7, 0, 14, h); x.fillRect(0, h * 0.14, w, 14); x.fillRect(0, h * 0.7, w, 16);
      x.fillStyle = 'rgba(255,240,220,.35)'; for (let k = 0; k < 4; k++) for (let r = 0; r < 4; r++) x.fillRect(k * 128 + 14, h * 0.14 + 20 + r * 52, 100, 46);
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 3; for (let k = 0; k < 4; k++) for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(k * 128 + 7 + i * 38, h * 0.14 + 14); x.lineTo(k * 128 + 7 + i * 38, h * 0.7); x.stroke(); }
      x.fillStyle = '#4a2e1c'; x.fillRect(0, h * 0.7 + 16, w, h * 0.3); break; }
    case 'stripe': case 'tent': { const cols = style === 'tent' ? ['#a0141e', '#efe6d4'] : [sh(base, 0.06), sh(base, -0.08)]; const n = style === 'tent' ? 8 : 16; for (let i = 0; i < n; i++) { x.fillStyle = cols[i % 2]; x.fillRect(i * (w / n), 0, w / n + 1, h); } if (style === 'tent') { for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(i * (w / n), 0, 6, h); } x.fillStyle = '#c9a24a'; x.fillRect(0, h * 0.06, w, 10); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#a0141e' : '#efe6d4'; x.beginPath(); x.moveTo(i * 32, h * 0.08); x.lineTo(i * 32 + 32, h * 0.08); x.lineTo(i * 32 + 16, h * 0.15); x.fill(); } } else { x.fillStyle = '#ffd36a'; for (let i = 0; i < 20; i++) { const sx = Math.random() * w, sy = Math.random() * h * 0.6; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 3 : 7; x.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } x.fill(); } wainscot(h * 0.68, '#2a0a1a', 6); } drips(x, w, h, 16); break; }
    default: { for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(20,10,5,${Math.random() * 0.15})`; x.fillRect(Math.random() * w, Math.random() * h, 4 + Math.random() * 40, 40 + Math.random() * 120); } x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, h * 0.78, w, h * 0.22); }
  }
  grime(x, w, h, 1600, 0.06);
  // 바닥 쪽은 더럽고 어둡게, 천장 쪽은 그을린 듯
  const vg = x.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, 'rgba(0,0,0,.35)'); vg.addColorStop(0.18, 'rgba(0,0,0,0)'); vg.addColorStop(0.85, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)'); x.fillStyle = vg; x.fillRect(0, 0, w, h);
  return toTex(c);
}
function themedFloorTex(style, color) {
  const S2 = 512; const [c, x] = CV(S2, S2); const w = S2, h = S2; const base = color || '#3a2a1c';
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  switch (style) {
    case 'planks': case 'deck': { const n = style === 'deck' ? 10 : 8; for (let i = 0; i < n; i++) { const y0 = i * (h / n); x.fillStyle = sh(base, (Math.random() - 0.5) * 0.08); x.fillRect(0, y0, w, h / n - 3); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, y0 + h / n - 3, w, 3); const cut = Math.random() * w; x.fillRect(cut, y0, 3, h / n); for (let k = 0; k < 10; k++) { x.strokeStyle = 'rgba(20,10,5,.18)'; x.beginPath(); const py = y0 + 4 + Math.random() * (h / n - 8); x.moveTo(0, py); x.bezierCurveTo(w * 0.3, py + 3, w * 0.6, py - 3, w, py); x.stroke(); } if (style === 'deck') for (let k = 0; k < 6; k++) { x.fillStyle = '#1a1410'; x.beginPath(); x.arc(k * 90 + 20, y0 + h / n / 2, 2.5, 0, 7); x.fill(); } } break; }
    case 'parquet': { const s = 64; for (let r = 0; r < h / s; r++) for (let k = 0; k < w / s; k++) { const vert = (r + k) % 2; for (let q = 0; q < 4; q++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.08); if (vert) x.fillRect(k * s + q * 16 + 1, r * s + 1, 14, s - 2); else x.fillRect(k * s + 1, r * s + q * 16 + 1, s - 2, 14); } } break; }
    case 'checker': { const s = 64; for (let r = 0; r < h / s; r++) for (let k = 0; k < w / s; k++) { x.fillStyle = (r + k) % 2 ? sh(base, -0.08) : sh(base, 0.16); x.fillRect(k * s, r * s, s, s); } x.strokeStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i <= w / s; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); } break; }
    case 'tatami': { for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { const vert = (r + k) % 2; const x0 = k * 256, y0 = r * 256; x.fillStyle = sh(base, 0.06 + (Math.random() - 0.5) * 0.04); x.fillRect(x0 + 2, y0 + 2, 252, 252); x.strokeStyle = 'rgba(60,50,20,.25)'; x.lineWidth = 1; for (let i = 0; i < 64; i++) { x.beginPath(); if (vert) { x.moveTo(x0 + i * 4, y0); x.lineTo(x0 + i * 4, y0 + 256); } else { x.moveTo(x0, y0 + i * 4); x.lineTo(x0 + 256, y0 + i * 4); } x.stroke(); } x.fillStyle = '#2a2a20'; if (vert) { x.fillRect(x0, y0, 14, 256); x.fillRect(x0 + 242, y0, 14, 256); } else { x.fillRect(x0, y0, 256, 14); x.fillRect(x0, y0 + 242, 256, 14); } } break; }
    case 'jangpan': { const s = 128; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const g = x.createLinearGradient(k * s, r * s, k * s + s, r * s + s); g.addColorStop(0, sh('#b8883a', -0.04)); g.addColorStop(1, sh('#a8782a', -0.08)); x.fillStyle = g; x.fillRect(k * s + 1, r * s + 1, s - 2, s - 2); } x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 10 + Math.random() * 20, 0, 0, 7); x.fill(); } break; }
    case 'stone': { for (let r = 0; r < 6; r++) for (let k = 0; k < 6; k++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.1); const j = (Math.random() - 0.5) * 8; x.fillRect(k * 86 + 3 + j, r * 86 + 3, 80, 80); } break; }
    case 'metal': { for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { x.fillStyle = sh(base, (Math.random() - 0.5) * 0.06); x.fillRect(k * 128 + 2, r * 128 + 2, 124, 124); x.strokeStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(k * 128 + i * 12 + 6, r * 128 + 6); x.lineTo(k * 128 + i * 12 + 12, r * 128 + 12); x.stroke(); } } drips(x, w, h, 20, '110,50,20'); break; }
    case 'concrete': { grime(x, w, h, 5000, 0.08); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (Math.random() - 0.5) * 80; py += (Math.random() - 0.5) * 80; x.lineTo(px, py); } x.stroke(); } x.fillStyle = 'rgba(10,30,30,.25)'; x.beginPath(); x.ellipse(w * 0.6, h * 0.4, 90, 50, 0.4, 0, 7); x.fill(); break; }
    case 'sawdust': case 'straw': case 'dirt': { grime(x, w, h, 6000, style === 'dirt' ? 0.12 : 0.1); if (style !== 'dirt') { x.lineWidth = 1.4; for (let i = 0; i < 900; i++) { x.strokeStyle = `rgba(${style === 'straw' ? '220,190,90' : '200,160,110'},${0.15 + Math.random() * 0.25})`; const px = Math.random() * w, py = Math.random() * h, a = Math.random() * 6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8); x.stroke(); } } if (style === 'sawdust') { const cf = ['#d6303a', '#ffd36a', '#2f5fd0', '#2fbf71', '#ff6fa8']; for (let i = 0; i < 120; i++) { x.fillStyle = cf[i % 5]; x.fillRect(Math.random() * w, Math.random() * h, 4, 3); } } break; }
    default: { for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.12})`; x.fillRect(0, i * 64, w, 3); for (let j = 0; j < 3; j++) x.fillRect(Math.random() * w, i * 64, 3, 64); } }
  }
  grime(x, w, h, 1800, 0.07);
  return toTex(c);
}
function themedGroundTex(style, color) {
  const [c, x] = CV(256, 256); const w = 256, h = 256; x.fillStyle = color; x.fillRect(0, 0, w, h);
  grime(x, w, h, 2600, 0.14);
  if (style === 'sand') { x.strokeStyle = 'rgba(255,220,170,.12)'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { x.beginPath(); const y0 = Math.random() * h; x.moveTo(0, y0); x.bezierCurveTo(80, y0 + 10, 160, y0 - 10, 256, y0); x.stroke(); } x.strokeStyle = 'rgba(40,20,10,.3)'; for (let i = 0; i < 5; i++) { x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (Math.random() - 0.5) * 40; py += (Math.random() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } }
  if (style === 'gravel' || style === 'moss') { for (let i = 0; i < 500; i++) { x.fillStyle = style === 'moss' ? `rgba(${60 + Math.random() * 40},${90 + Math.random() * 50},50,.35)` : `rgba(${120 + Math.random() * 60},${120 + Math.random() * 60},${110 + Math.random() * 50},.3)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, 7); x.fill(); } }
  if (style === 'grass' || style === 'mud') { for (let i = 0; i < 900; i++) { x.strokeStyle = `rgba(${40 + Math.random() * 40},${70 + Math.random() * 50},${30 + Math.random() * 30},.35)`; const px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 3, py - 4 - Math.random() * 5); x.stroke(); } if (style === 'mud') { x.fillStyle = 'rgba(10,8,6,.35)'; for (let i = 0; i < 8; i++) { x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 14 + Math.random() * 20, 6 + Math.random() * 10, Math.random() * 3, 0, 7); x.fill(); } } }
  if (style === 'dirt') { const cf = ['#d6303a', '#ffd36a', '#2f5fd0', '#ff6fa8']; for (let i = 0; i < 60; i++) { x.fillStyle = cf[i % 4]; x.globalAlpha = 0.5; x.fillRect(Math.random() * w, Math.random() * h, 3, 2); } x.globalAlpha = 1; }
  return toTex(c);
}

// 떠다니는 입자 — 셰이더에서 움직여 CPU 부담이 없다
const CEIL_H = 4.6; // 실내 천장 높이
function particleField(kind, W, D, H = CEIL_H) {
  const conf = {
    ash: { n: 260, col: '#c8c8c0', size: 0.05, fall: 0.12, sway: 0.25, tw: 0.2, op: 0.5 },
    mist: { n: 220, col: '#a8c8d8', size: 0.07, fall: -0.03, sway: 0.5, tw: 0.4, op: 0.35 },
    sparkle: { n: 160, col: '#ffe8f4', size: 0.045, fall: 0.03, sway: 0.2, tw: 1, op: 0.75 },
    motes: { n: 280, col: '#c8ffe8', size: 0.04, fall: 0.02, sway: 0.15, tw: 0.3, op: 0.5 },
    fireflies: { n: 120, col: '#d8ff7a', size: 0.11, fall: -0.01, sway: 0.7, tw: 1, op: 0.95 },
    sand: { n: 260, col: '#e8c890', size: 0.045, fall: 0.05, sway: 0.9, tw: 0.2, op: 0.45 },
    petals: { n: 140, col: '#ff6a7a', size: 0.09, fall: 0.25, sway: 0.6, tw: 0.3, op: 0.85 },
    confetti: { n: 200, col: '#ffffff', size: 0.07, fall: 0.18, sway: 0.4, tw: 0.5, op: 0.9, multi: true },
  }[kind];
  if (!conf) return null;
  const n = matchMedia('(pointer: coarse)').matches ? Math.round(conf.n * 0.6) : conf.n;
  const pos = new Float32Array(n * 3), seed = new Float32Array(n), col = new Float32Array(n * 3);
  const pal = conf.multi ? ['#d6303a', '#ffd36a', '#2f5fd0', '#2fbf71', '#ff6fa8', '#ffffff'].map((c) => new THREE.Color(c)) : [new THREE.Color(conf.col)];
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * W; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - 0.5) * D; seed[i] = Math.random() * 100; const c = pal[i % pal.length]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: kind === 'fireflies' || kind === 'sparkle' ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { time: { value: 0 }, H: { value: H }, fall: { value: conf.fall }, sway: { value: conf.sway }, tw: { value: conf.tw }, op: { value: conf.op }, size: { value: conf.size * 320 } },
    vertexShader: `attribute float seed; attribute vec3 color; uniform float time, H, fall, sway, size; varying float vS; varying vec3 vC;
      void main(){ vec3 p = position; p.y = mod(p.y - time * fall * (0.6 + fract(seed) * 0.8), H);
        p.x += sin(time * 0.6 + seed) * sway; p.z += cos(time * 0.5 + seed * 1.3) * sway;
        vS = seed; vC = color; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = min(size / -mv.z, 14.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float time, tw, op; varying float vS; varying vec3 vC;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.1, r) * op * (1.0 - tw + tw * (0.5 + 0.5 * sin(time * 3.0 + vS * 7.0)));
        gl_FragColor = vec4(vC, a); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.userData.noOcc = true;
  return pts;
}

// 숲·대나무·바위 같은 경계 풍경: 나무 한 그루를 한 덩어리(합친 지오메트리 + 꼭짓점 색)로 만든다.
// 예전: 소나무 60그루 × 5조각 = 300번 그리기 → 지금: 60번. 그루마다 따로 있어서 카메라를 가리면 지금처럼 반투명해진다.
const TREE_GEO = new Map();
function coloredPart(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo; const c = new THREE.Color(color); const n = g.attributes.position.count;
  const col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
}
function treeGeo(kind) {
  if (TREE_GEO.has(kind)) return TREE_GEO.get(kind);
  const parts = [];
  if (kind === 'bamboo') {
    for (let k = 0; k < 3; k++) { const h = 3.2 + k * 0.45; const st = new THREE.CylinderGeometry(0.05, 0.06, h, 6); st.translate(Math.cos(k * 2.1) * 0.35, h / 2, Math.sin(k * 2.1) * 0.35); parts.push(coloredPart(st, k % 2 ? '#4a7a32' : '#56883a')); }
    const lf = new THREE.IcosahedronGeometry(0.8, 0); lf.scale(1.3, 0.55, 1.3); lf.translate(0, 3.6, 0); parts.push(coloredPart(lf, '#2f5a26'));
    const lf2 = new THREE.IcosahedronGeometry(0.6, 0); lf2.scale(1.2, 0.5, 1.2); lf2.translate(0.3, 2.9, -0.2); parts.push(coloredPart(lf2, '#3a6a2c'));
  } else if (kind === 'mesa') {
    const rk = new THREE.DodecahedronGeometry(1, 0); rk.scale(1.6, 1.1, 1.4); rk.translate(0, 0.4, 0); parts.push(coloredPart(rk, '#7a3a22'));
    const cc = new THREE.CylinderGeometry(0.2, 0.24, 2.2, 8); cc.translate(1.6, 1.1, -0.8); parts.push(coloredPart(cc, '#3a6a3a'));
    const arm = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6); arm.translate(1.95, 1.4, -0.8); parts.push(coloredPart(arm, '#3a6a3a'));
  } else {
    const tr = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6); tr.translate(0, 0.6, 0); parts.push(coloredPart(tr, '#3b2a1c'));
    const leaf = kind === 'pine_dense' ? ['#18301e', '#1c3622'] : ['#1d3324', '#22392a'];
    for (let i = 0; i < 4; i++) { const cg = new THREE.ConeGeometry(1.1 - i * 0.22, 1.3, 8); cg.rotateY(i * 0.7); cg.translate(0, 1.4 + i * 0.75, 0); parts.push(coloredPart(cg, leaf[i % 2])); }
  }
  const merged = mergeGeometries(parts); merged.computeBoundingSphere(); TREE_GEO.set(kind, merged); return merged;
}
const TREE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
function instancedForest(root, spots, kind) {
  if (!spots.length) return;
  const geo = treeGeo(kind === 'pine' || kind === 'pine_dense' || kind === 'bamboo' || kind === 'mesa' ? kind : 'pine');
  for (const s of spots) {
    const m = new THREE.Mesh(geo, TREE_MAT);
    m.position.set(s.x, 0, s.z); m.rotation.y = (s.x * 1.7 + s.z) % (Math.PI * 2); m.scale.setScalar(s.s);
    m.castShadow = false; root.add(m);
  }
}

// ───────────────── 하늘
function skyDome(top, bottom, stars = 0, moon = false) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(90, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.4 + 0.15, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }',
  });
  g.add(new THREE.Mesh(geo, mat));
  if (stars) {
    const pos = new Float32Array(stars * 3);
    for (let i = 0; i < stars; i++) { const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.2; pos[i * 3] = Math.cos(th) * Math.sin(ph) * 85; pos[i * 3 + 1] = Math.cos(ph) * 85; pos[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * 85; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.35, fog: false, transparent: true, opacity: 0.85 })));
  }
  if (moon) {
    const col = moon === 'red' ? '#ff9a80' : moon === true ? '#f4f1e0' : moon;
    const m = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 16), new THREE.MeshBasicMaterial({ color: col, fog: false }));
    m.position.set(-30, 42, -60); g.add(m);
    // 달무리 + 달 표면 얼룩
    const [hc, hx] = CV(128, 128); const hg = hx.createRadialGradient(64, 64, 8, 64, 64, 64); hg.addColorStop(0, 'rgba(255,255,255,.55)'); hg.addColorStop(0.35, 'rgba(255,255,255,.16)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), color: col, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(26); halo.position.copy(m.position); g.add(halo);
    for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.CircleGeometry(0.4 + (i % 3) * 0.3, 10), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.12, fog: false, depthWrite: false })); sp.position.set(-30 + Math.cos(i * 2.3) * 1.6 + 1.2, 42 + Math.sin(i * 2.3) * 1.6 - 0.6, -60 + 3.3); sp.lookAt(0, 0, 0); g.add(sp); }
  }
  return g;
}

// ───────────────── 로비 (미아 — 다섯 개의 테마 관문이 있는 광장)
export const LOBBY_THEMES = [
  { id: 'gwimun', color: '#ff3a2a', glow: '#5a0a08', label: '鬼門 귀문' },
  { id: 'mia', color: '#ffe066', glow: '#3a3008', label: '🔰 달빛 문방구 (입문)' },
  { id: 'ophelia', color: '#4ad8ff', glow: '#06303e', label: '⚓ 오필리아호' },
  { id: 'doll', color: '#e08aff', glow: '#3a0a4a', label: '🎎 인형의 집' },
  { id: 'kimono', color: '#ff5a7a', glow: '#4a0818', label: '🏮 츠바키야' },
  { id: 'clown', color: '#ff2a6a', glow: '#3a0020', label: '🎪 삐에로' },
  { id: 'hospital', color: '#9affc8', glow: '#0a3a24', label: '🏥 백야 요양병원' },
  { id: 'west', color: '#ff9a50', glow: '#4a2008', label: '🤠 레드 메사' },
  { id: 'camp', color: '#ffd76a', glow: '#4a3008', label: '🏕️ 반딧불 캠프' },
  { id: 'park', color: '#ffb0e0', glow: '#3a0a2a', label: '🎡 해피니스 랜드' },
];
LOBBY_THEMES.forEach((th, k, all) => { const a = Math.PI + (k / (all.length - 1)) * Math.PI; th.x = +(Math.cos(a) * 15).toFixed(2); th.z = +(Math.sin(a) * 15).toFixed(2); });

function portalTex(color, glow) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 6, 128, 128, 128);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, color); g.addColorStop(0.7, glow); g.addColorStop(1, '#000000');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.globalAlpha = 0.35; x.strokeStyle = '#000';
  for (let i = 0; i < 7; i++) { x.lineWidth = 6 + i * 2; x.beginPath(); for (let a = 0; a < Math.PI * 6; a += 0.1) { const r = a * 6 + i * 4; x.lineTo(128 + Math.cos(a + i) * r, 128 + Math.sin(a + i) * r); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.center.set(0.5, 0.5); return t;
}

function buildExhibit(root, colliders, th) {
  const g = new THREE.Group(); g.position.set(th.x, 0, th.z);
  g.rotation.y = Math.atan2(-th.x, 6 - th.z); // 광장 가운데(스폰)를 바라보게
  root.add(g);
  const stone = new THREE.MeshStandardMaterial({ color: '#5a5260', roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.3, 32), stone); base.position.y = 0.15; base.receiveShadow = true; g.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.05, 6, 48), new THREE.MeshBasicMaterial({ color: th.color })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.31; g.add(ring);
  // 관문 아치
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.6, 0.45), stone); p.position.set(1.35 * s, 2.1, -0.6); p.castShadow = true; g.add(p); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.6), stone); top.position.set(0, 4.0, -0.6); top.castShadow = true; g.add(top);
  const tex = portalTex(th.color, th.glow);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 3.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 }));
  portal.position.set(0, 2.05, -0.6); g.add(portal);
  const light = new THREE.PointLight(th.color, 5, 9, 2); light.position.set(0, 2, 0.6);
  if (!matchMedia('(pointer: coarse)').matches) g.add(light);
  const P = (p, s = 1) => { const m = buildProp(p); m.position.set(p.x, p.y || 0.3, p.z); m.rotation.y = (p.r || 0) * DEG; m.scale.setScalar(s); g.add(m); return m; };
  const spin = [];
  if (th.id === 'gwimun') {
    P({ t: 'jangseung_m', x: -2.3, z: 0.2 }, 0.85); P({ t: 'jangseung_f', x: 2.3, z: 0.2 }, 0.85);
    P({ t: 'cairn', x: -1.2, z: 1.6 }, 0.8); P({ t: 'lantern', x: 1.3, z: 1.5 }, 1);
  } else if (th.id === 'ophelia') {
    P({ t: 'lighthouse', x: -2.4, z: -1.2 }, 0.32); P({ t: 'lifebuoy', x: 0, y: 4.0, z: -0.25 }, 1);
    spin.push(P({ t: 'ship_wheel', x: 2.2, z: 0.6, r: -30 }, 1));
    P({ t: 'barrel', x: 1.4, z: 1.7 }, 0.8);
  } else if (th.id === 'hospital') {
    P({ t: 'wheelchair', x: -2.2, z: 0.6, r: 30 }, 1.1); P({ t: 'iv_stand', x: 2.3, z: 0.2 }, 1);
    spin.push(P({ t: 'gurney', x: 1.3, z: 1.7, r: 70 }, 0.7));
  } else if (th.id === 'west') {
    P({ t: 'cactus', x: -2.3, z: 0.4 }, 0.9); P({ t: 'hay', x: 2.2, z: 0.6, r: 20 }, 0.9);
    spin.push(P({ t: 'lantern', x: 1.4, z: 1.7 }, 0.9));
  } else if (th.id === 'kimono') {
    P({ t: 'stone_lantern', x: -2.2, z: 0.6 }, 1.1); P({ t: 'tree', x: 2.3, z: 0.2, color: '#c8202a' }, 0.7);
    spin.push(P({ t: 'lantern', x: 1.2, z: 1.8 }, 0.9));
  } else if (th.id === 'camp') {
    P({ t: 'tent', x: -2.2, z: 0.2, r: 25, color: '#e8c13a' }, 0.75); P({ t: 'campfire', x: 1.6, z: 1.5 }, 0.9);
    P({ t: 'fireflies', x: 0, z: 0.8 }, 1); P({ t: 'canoe', x: 2.5, z: -0.2, r: -20 }, 0.6);
  } else if (th.id === 'mia') {
    P({ t: 'umbrella_stand', x: -2.2, z: 0.4 }, 1); P({ t: 'top', x: 2.2, z: 0.6 }, 1.4);
    spin.push(P({ t: 'marble', x: 1.2, z: 1.8 }, 1.2));
  } else if (th.id === 'park') {
    P({ t: 'mascot_statue', x: -2.2, z: 0.4, r: 20, s: 0.6 }, 1); P({ t: 'teacup', x: 2.3, z: 0.4, color: '#ff9ad0' }, 0.7);
    spin.push(P({ t: 'balloon_stand', x: 1.2, z: 1.8 }, 0.6));
  } else if (th.id === 'clown') {
    P({ t: 'jack_box', x: -2.2, z: 0.5, r: 20 }, 0.9); P({ t: 'balloon_stand', x: 2.3, z: 0.3 }, 0.8);
    spin.push(P({ t: 'unicycle', x: 1.3, z: 1.7, r: -20 }, 0.9));
  } else {
    P({ t: 'dollhouse', x: -2.3, z: 0.1, r: 25 }, 0.9); P({ t: 'doll_big', x: 2.2, z: 0.4, r: -25 }, 0.8);
    spin.push(P({ t: 'rocking_horse', x: 1.0, z: 1.7, r: -10 }, 0.9));
  }
  const sign = textSprite(th.label, { size: 40, bg: 'rgba(10,6,14,.85)', color: th.color, border: th.color });
  sign.position.set(th.x, 5.1, th.z); sign.scale.multiplyScalar(1.3); root.add(sign);
  // 충돌: 받침대 뒤쪽 아치 + 양옆 소품
  colliders.push({ x: th.x, z: th.z, hw: 1.9, hd: 1.9 });
  return { portal, tex, light, spin, sign, group: g, id: th.id };
}


// ───────────────── 놀이공원 (로비) — 회전목마 · 관람차 · 벤치 · 피크닉 테이블
// 놀이기구는 실제 시계(Date.now)로 돌려서 모든 접속자 화면에서 같은 위치에 보인다
const PARK = { carousel: { x: -10.5, z: 9.5 }, wheel: { x: 11, z: 10.5 } };
const parkNow = () => Date.now() / 1000;
function stripeTex(a, b, n = 12) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d');
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect((256 / n) * i, 0, 256 / n + 1, 32); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const pm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const _gc = new Map();
const G = (key, make) => (_gc.has(key) ? _gc.get(key) : (_gc.set(key, make()), _gc.get(key)));
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); const big = (geo.boundingSphere || (geo.computeBoundingSphere(), geo.boundingSphere)).radius > 0.35; m.castShadow = big; m.receiveShadow = big; parent.add(m); return m; }

function buildPark(root, colliders, add) {
  const interactives = []; const rides = {}; const anim = [];
  // 회전목마
  {
    const { x: cx, z: cz } = PARK.carousel; const g = new THREE.Group(); g.position.set(cx, 0, cz); root.add(g);
    mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.35, 40), pm('#f6e7ff'), 0, 0.17, 0, g);
    mesh(new THREE.TorusGeometry(3.32, 0.06, 6, 48), pm('#ffd36a', { emissive: '#ffb020', emissiveIntensity: 0.8 }), 0, 0.36, 0, g).rotation.x = Math.PI / 2;
    const spin = new THREE.Group(); spin.position.y = 0.35; g.add(spin);
    mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 16), pm('#ffd36a', { metalness: 0.6, roughness: 0.3 }), 0, 1.6, 0, spin);
    const roofMat = new THREE.MeshStandardMaterial({ map: stripeTex('#ff6fa8', '#fff3fb', 16), roughness: 0.7, side: THREE.DoubleSide });
    mesh(new THREE.ConeGeometry(3.8, 1.6, 32, 1, true), roofMat, 0, 3.95, 0, spin);
    mesh(new THREE.SphereGeometry(0.25, 12, 10), pm('#ffd36a', { emissive: '#ffcc33', emissiveIntensity: 1.2 }), 0, 4.85, 0, spin);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; mesh(G('bulb7', () => new THREE.SphereGeometry(0.07, 8, 6)), G('bm' + (i % 2), () => new THREE.MeshBasicMaterial({ color: i % 2 ? '#fff2a8' : '#ff9ad0' })), Math.cos(a) * 3.75, 3.18, Math.sin(a) * 3.75, spin); }
    const horses = [];
    const HC = ['#ffffff', '#ffd1e8', '#d6c8ff', '#c8f0ff', '#fff0b8', '#ffe0c8'];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2; const h = new THREE.Group(); h.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4); h.rotation.y = -a; spin.add(h);
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 8), pm('#ffd36a', { metalness: 0.7, roughness: 0.3 }), 0, 1.5, 0, h);
      const body = new THREE.Group(); h.add(body);
      mesh(new THREE.BoxGeometry(0.32, 0.36, 0.95), pm(HC[i]), 0, 0, 0, body);
      mesh(new THREE.BoxGeometry(0.24, 0.42, 0.26), pm(HC[i]), 0, 0.28, 0.48, body).rotation.x = -0.4;
      mesh(new THREE.BoxGeometry(0.06, 0.3, 0.3), pm('#ff8fab'), 0, 0.36, 0.28, body);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), pm(HC[i]), 0.1 * sx, -0.4, 0.35 * sz, body);
      mesh(new THREE.BoxGeometry(0.34, 0.06, 0.3), pm('#e05a8a'), 0, 0.2, -0.05, body);
      horses.push(body);
    }
    colliders.push({ x: cx, z: cz, hw: 3.0, hd: 3.0 });
    const ang = () => parkNow() * 0.55;
    anim.push(() => { const a = ang(); spin.rotation.y = -a; horses.forEach((b, i) => (b.position.y = 1.15 + Math.sin(a * 3 + i * 1.7) * 0.22)); });
    rides.carousel = { seats: 6, pos: (i) => { const a = ang(); const th = (i / 6) * Math.PI * 2 + a; return { x: cx + Math.cos(th) * 2.4, z: cz + Math.sin(th) * 2.4, y: 0.35 + 1.15 + Math.sin(a * 3 + i * 1.7) * 0.22 - 0.35, ry: (-th) % (Math.PI * 2) }; } };
    interactives.push({ id: 'carousel', kind: 'ride', x: cx, z: cz, r: 4.4, label: '회전목마', verb: '타기' });
  }
  // 관람차
  {
    const { x: cx, z: cz } = PARK.wheel; const g = new THREE.Group(); g.position.set(cx, 0, cz); root.add(g);
    const AX = 6.2, RAD = 4.8, N = 8;
    for (const s of [-1, 1]) for (const k of [-1, 1]) { const leg = mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.8, 8), pm('#e8e4f0', { metalness: 0.5, roughness: 0.4 }), 1.9 * k * 0.55, AX / 2, 0.75 * s, g); leg.rotation.z = 0.32 * k; }
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12), pm('#ffd36a', { metalness: 0.7 }), 0, AX, 0, g).rotation.x = Math.PI / 2;
    const wheel = new THREE.Group(); wheel.position.set(0, AX, 0); g.add(wheel);
    for (const s of [-0.35, 0.35]) { const rim = mesh(new THREE.TorusGeometry(RAD, 0.07, 8, 64), pm('#ff8fd0', { emissive: '#ff4fb0', emissiveIntensity: 0.6 }), 0, 0, s, wheel); rim.castShadow = false; }
    for (let i = 0; i < N * 2; i++) { const a = (i / (N * 2)) * Math.PI * 2; const sp = mesh(new THREE.BoxGeometry(0.05, RAD, 0.05), pm('#f0eaff'), Math.cos(a) * RAD / 2, Math.sin(a) * RAD / 2, 0, wheel); sp.rotation.z = a - Math.PI / 2; }
    for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; mesh(G('bulb8', () => new THREE.SphereGeometry(0.08, 8, 6)), G('wb' + (i % 3), () => new THREE.MeshBasicMaterial({ color: ['#fff2a8', '#9ad0ff', '#ff9ad0'][i % 3] })), Math.cos(a) * (RAD + 0.1), Math.sin(a) * (RAD + 0.1), 0.4, wheel); }
    const CC = ['#ff6f91', '#ffc75f', '#6fd6ff', '#b39dff', '#7ee0a8', '#ff9671', '#f9f871', '#ff8fd0'];
    const cabins = [];
    for (let i = 0; i < N; i++) {
      const c = new THREE.Group(); g.add(c);
      mesh(new THREE.BoxGeometry(1.1, 0.1, 1.0), pm(CC[i]), 0, -0.55, 0, c);
      mesh(new THREE.BoxGeometry(1.1, 0.5, 1.0), pm(CC[i], { transparent: true, opacity: 0.85 }), 0, -0.3, 0, c);
      mesh(new THREE.ConeGeometry(0.8, 0.45, 4), pm(CC[i]), 0, 0.42, 0, c).rotation.y = Math.PI / 4;
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), pm('#ddd'), 0, 0.15, 0, c);
      cabins.push(c);
    }
    colliders.push({ x: cx, z: cz, hw: 1.6, hd: 1.1 });
    const ang = () => parkNow() * 0.13;
    const cpos = (i) => { const th = ang() + (i / N) * Math.PI * 2; return { x: Math.cos(th) * RAD, y: AX + Math.sin(th) * RAD - 0.4 }; };
    anim.push(() => { wheel.rotation.z = ang(); cabins.forEach((c, i) => { const p = cpos(i); c.position.set(p.x, p.y, 0); }); });
    rides.wheel = { seats: N, pick: (busy) => { let best = -1, by = 1e9; for (let i = 0; i < N; i++) { if (busy.has(i)) continue; const y = cpos(i).y; if (y < by) { by = y; best = i; } } return best; },
      pos: (i) => { const p = cpos(i); return { x: cx + p.x, z: cz, y: p.y - 0.62, ry: Math.PI }; } };
    interactives.push({ id: 'wheel', kind: 'ride', x: cx, z: cz + 1.8, r: 2.8, label: '관람차', verb: '타기' });
    const sign = textSprite('🎡 관람차', { size: 30, bg: 'rgba(40,10,40,.75)', color: '#ffd0f0' }); sign.position.set(cx, 1.6, cz + 1.7); root.add(sign);
  }
  // 롤러코스터: 광장 바깥을 한 바퀴 도는 언덕 트랙 + 4칸 열차(8명). 높은 곳에선 느리고 낮은 곳에선 빠르다
  {
    const M = 720, P = [], cum = [0];
    for (let i = 0; i < M; i++) {
      const th = (i / M) * Math.PI * 2;
      const r = 22 + 0.8 * Math.sin(3 * th + 0.5);
      P.push(new THREE.Vector3(Math.cos(th) * r, 5.2 + 2.2 * Math.sin(2 * th + 1) + 0.8 * Math.sin(5 * th + 2), Math.sin(th) * r));
    }
    for (let i = 1; i <= M; i++) cum.push(cum[i - 1] + P[i - 1].distanceTo(P[i % M]));
    const LEN = cum[M];
    const ymax = Math.max(...P.map((p) => p.y));
    // 구간마다 속도(에너지 보존 흉내) → 한 바퀴 시간표
    const tcum = [0];
    for (let i = 0; i < M; i++) { const v = Math.sqrt(3.2 * 3.2 + 2 * 4.2 * (ymax - (P[i].y + P[(i + 1) % M].y) / 2)); tcum.push(tcum[i] + (cum[i + 1] - cum[i]) / v); }
    const LAP = tcum[M];
    const bs = (arr, v) => { let lo = 0, hi = M; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arr[mid] <= v) lo = mid; else hi = mid; } return lo; };
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    const at = (s) => { s = ((s % LEN) + LEN) % LEN; const i = bs(cum, s); const f = (s - cum[i]) / (cum[i + 1] - cum[i] || 1); const a = P[i], b = P[(i + 1) % M]; return { p: new THREE.Vector3().lerpVectors(a, b, f), t: new THREE.Vector3().subVectors(b, a).normalize() }; };
    const frontS = () => { const tt = ((parkNow() % LAP) + LAP) % LAP; const i = bs(tcum, tt); const f = (tt - tcum[i]) / (tcum[i + 1] - tcum[i] || 1); return cum[i] + (cum[i + 1] - cum[i]) * f; };
    const side = (t) => new THREE.Vector3(t.z, 0, -t.x).normalize();
    // 레일 두 줄 + 가운데 등뼈
    const railPts = (off, dy) => P.filter((_, i) => i % 3 === 0).map((p, k) => { const t = at(cum[k * 3]).t; return p.clone().addScaledVector(side(t), off).add(new THREE.Vector3(0, dy, 0)); });
    const railMat = pm('#ff3f6c', { metalness: 0.5, roughness: 0.35, emissive: '#ff1f50', emissiveIntensity: 0.25 });
    for (const off of [-0.38, 0.38]) { const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts(off, 0), true), 480, 0.065, 6, true), railMat, 0, 0, 0, root); m.castShadow = false; }
    { const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts(0, -0.22), true), 480, 0.13, 6, true), pm('#ffd36a', { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, root); m.castShadow = false; }
    // 침목 · 기둥 (인스턴스로 한 번에)
    const nTie = Math.floor(LEN / 0.9), nSup = Math.floor(LEN / 3.2);
    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.06, 0.16), pm('#6b4a8a'), nTie);
    const sups = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 1, 6), pm('#f0eaff', { metalness: 0.4, roughness: 0.5 }), nSup);
    const o = new THREE.Object3D();
    for (let k = 0; k < nTie; k++) { const { p, t } = at((k / nTie) * LEN); o.position.copy(p); o.position.y -= 0.08; o.lookAt(p.x + t.x, p.y - 0.08 + t.y, p.z + t.z); o.scale.set(1, 1, 1); o.updateMatrix(); ties.setMatrixAt(k, o.matrix); }
    for (let k = 0; k < nSup; k++) { const { p } = at((k / nSup) * LEN); const h = p.y - 0.3; o.position.set(p.x, h / 2, p.z); o.rotation.set(0, 0, 0); o.scale.set(1, h, 1); o.updateMatrix(); sups.setMatrixAt(k, o.matrix); }
    root.add(ties, sups);
    // 열차: 앞칸부터 0~3, 칸마다 2자리
    const CARS = 4, GAP = 1.75, CC = ['#ff3f6c', '#ffc75f', '#6fd6ff', '#b39dff'];
    const cars = [];
    for (let c = 0; c < CARS; c++) {
      const car = new THREE.Group(); root.add(car);
      mesh(new THREE.BoxGeometry(1.0, 0.16, 1.45), pm('#2a2030', { metalness: 0.5 }), 0, 0.12, 0, car);
      for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, 0.42, 1.45), pm(CC[c], { roughness: 0.3, metalness: 0.2 }), 0.5 * sx, 0.38, 0, car);
      mesh(new THREE.BoxGeometry(1.0, 0.5, 0.1), pm(CC[c], { roughness: 0.3 }), 0, 0.42, -0.7, car);
      if (c === 0) { const nose = mesh(new THREE.BoxGeometry(1.0, 0.45, 0.4), pm(CC[c], { roughness: 0.3 }), 0, 0.38, 0.85, car); nose.rotation.x = -0.35; mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff6c8' }), 0, 0.5, 1.07, car); }
      else mesh(new THREE.BoxGeometry(1.0, 0.5, 0.1), pm(CC[c], { roughness: 0.3 }), 0, 0.42, 0.7, car);
      for (const sx of [-1, 1]) { mesh(new THREE.BoxGeometry(0.36, 0.1, 0.5), pm('#3a2a40'), 0.22 * sx, 0.3, -0.15, car); mesh(new THREE.BoxGeometry(0.36, 0.45, 0.1), pm('#3a2a40'), 0.22 * sx, 0.5, -0.42, car); }
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), pm('#ffd36a', { metalness: 0.7 }), 0, 0.72, 0.18, car).rotation.z = Math.PI / 2;
      cars.push(car);
    }
    const _q = new THREE.Vector3();
    anim.push(() => { const s0 = frontS(); cars.forEach((car, c) => { const { p, t } = at(s0 - c * GAP); car.position.copy(p); car.lookAt(_q.copy(p).add(t)); }); });
    // 탑승장: 처음 들어오는 곳(광장 가운데 아래쪽) 바로 옆, 탁 트인 자리. 타면 열차 자리로 바로 올라간다
    const sx = -3.6, sz = 9.2;
    {
      const g = new THREE.Group(); g.position.set(sx, 0, sz); root.add(g);
      mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.12, 32), pm('#ffd36a'), 0, 0.06, 0, g);
      const ringM = mesh(new THREE.TorusGeometry(1.3, 0.06, 6, 40), pm('#ff3f6c', { emissive: '#ff1f50', emissiveIntensity: 0.9 }), 0, 0.14, 0, g); ringM.rotation.x = Math.PI / 2; ringM.castShadow = false;
      for (const k of [-1, 1]) mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.8, 8), pm('#ff3f6c'), 1.15 * k, 1.4, -0.9, g);
      mesh(new THREE.BoxGeometry(2.5, 0.16, 0.3), pm('#ff3f6c', { emissive: '#ff1f50', emissiveIntensity: 0.5 }), 0, 2.8, -0.9, g);
      for (let i = 0; i < 9; i++) mesh(G('bulb7', () => new THREE.SphereGeometry(0.07, 8, 6)), G('bm' + (i % 2), () => new THREE.MeshBasicMaterial({ color: i % 2 ? '#fff2a8' : '#ff9ad0' })), -1.0 + i * 0.25, 2.92, -0.75, g);
      const sign = textSprite('🎢 롤러코스터 타는 곳', { size: 32, bg: 'rgba(60,10,30,.85)', color: '#ffe08a', border: '#ff3f6c' }); sign.position.set(sx, 3.5, sz - 0.9); root.add(sign);
      const arrow = textSprite('⬇', { size: 40, bg: 'rgba(0,0,0,0)', color: '#ffe08a' }); arrow.position.set(sx, 1.9, sz); root.add(arrow);
      anim.push((t) => { arrow.position.y = 1.9 + Math.sin(t * 3) * 0.15; ringM.material.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.35; });
    }
    const seatPos = (i) => {
      const c = Math.floor(i / 2), { p, t } = at(frontS() - c * GAP), sd = side(t);
      const off = i % 2 ? 0.25 : -0.25;
      return { x: p.x + sd.x * off + t.x * -0.15, z: p.z + sd.z * off + t.z * -0.15, y: p.y + 0.36 + t.y * -0.15, ry: Math.atan2(t.x, t.z) };
    };
    rides.coaster = { seats: CARS * 2, sit: true, exit: { x: sx, z: sz + 0.6 }, pick: (busy) => { for (let i = 0; i < CARS * 2; i++) if (!busy.has(i)) return i; return -1; }, pos: seatPos, front: () => at(frontS()).p };
    interactives.push({ id: 'coaster', kind: 'ride', x: sx, z: sz, r: 2.2, label: '롤러코스터', verb: '타기' });
  }
  // 벤치 (앉기)
  const benches =[[-6, 7, 30], [6, 7, -30], [-4.5, 14.5, 180], [4.5, 14.5, 180], [-14.5, 6, 90], [14.5, 6, -90]];
  benches.forEach(([x, z, r], i) => {
    if (i >= 2) add({ t: 'bench', x, z, r });
    const ry = (r * Math.PI) / 180;
    interactives.push({ id: 'bench' + i, kind: 'sit', x, z, r: 1.5, label: '벤치', verb: '앉기', seat: { x: x - Math.sin(ry) * 0.04, z: z - Math.cos(ry) * 0.04, y: 0.43, ry } });
  });
  // 피크닉 테이블 (올라가기)
  [[-1.8, 12.5], [2.2, 12.2]].forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), pm('#c98a5a'), 0, 0.78, 0, g);
    for (const sx of [-1, 1]) { mesh(new THREE.BoxGeometry(0.1, 0.78, 0.8), pm('#8a5a3a'), 0.75 * sx, 0.39, 0, g); mesh(new THREE.BoxGeometry(1.8, 0.07, 0.3), pm('#c98a5a'), 0, 0.45, 0.7 * sx, g); }
    colliders.push({ x, z, hw: 0.95, hd: 0.5, perch: 'table' + i });
    interactives.push({ id: 'table' + i, kind: 'climb', x, z, r: 1.7, label: '피크닉 테이블', verb: '올라가기', perch: { x, z, hw: 0.85, hd: 0.4, y: 0.83, id: 'table' + i } });
  });
  // 장식: 풍선 · 포장마차 · 입구 아치 · 깃발 줄
  const BAL = ['#ff6f91', '#ffc75f', '#6fd6ff', '#b39dff', '#7ee0a8', '#ff9671'];
  [[-8, 4], [8, 4], [-3, 17], [3, 17], [-15.5, 9], [15.5, 9]].forEach(([x, z], k) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    for (let i = 0; i < 5; i++) {
      const bx = Math.cos(i * 1.3 + k) * 0.35, bz = Math.sin(i * 1.3 + k) * 0.35, by = 2.4 + (i % 3) * 0.35;
      const b = mesh(new THREE.SphereGeometry(0.28, 14, 12), pm(BAL[(i + k) % 6], { roughness: 0.25, emissive: BAL[(i + k) % 6], emissiveIntensity: 0.15 }), bx, by, bz, g); b.scale.y = 1.15;
      const str = mesh(new THREE.CylinderGeometry(0.006, 0.006, by - 0.3, 4), pm('#eee'), bx / 2, (by - 0.3) / 2, bz / 2, g); str.castShadow = false;
    }
    anim.push((t) => { g.rotation.y = Math.sin(t * 0.6 + k) * 0.12; });
  });
  add({ t: 'stall', x: -15.5, z: 13, r: 60 }); add({ t: 'stall', x: 15.5, z: 13, r: -60 });
  {
    const g = new THREE.Group(); g.position.set(0, 0, 18.2); root.add(g);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.25, 0.3, 4.2, 12), pm('#ff8fd0'), 2.6 * s, 2.1, 0, g);
    const arch = mesh(new THREE.TorusGeometry(2.6, 0.18, 10, 32, Math.PI), pm('#ffd36a', { emissive: '#ffb020', emissiveIntensity: 0.5 }), 0, 4.2, 0, g); arch.castShadow = false;
    const sign = textSprite('🎠 미아 랜드 🎡', { size: 44, bg: 'rgba(60,10,50,.85)', color: '#ffe08a', border: '#ff8fd0' }); sign.position.set(0, 5.4, 18.2); sign.scale.multiplyScalar(1.2); root.add(sign);
  }
  return { interactives, rides, update: (t) => anim.forEach((f) => f(t)) };
}

export function buildLobby(scene) {
  setPropTheme('lobby');
  const root = new THREE.Group();
  const colliders = [];
  // 핏빛 달이 뜬 한밤의 폐놀이공원
  scene.background = new THREE.Color('#05050b');
  scene.fog = new THREE.Fog('#0a0a14', 30, 120);
  root.add(skyDome('#020208', '#1a1222', 700, 'red'));
  // 구름: 하얀 구슬 덩어리들이 하늘을 천천히 돈다
  const clouds = new THREE.Group(); root.add(clouds);
  const cMat = new THREE.MeshBasicMaterial({ color: '#1c1822', fog: false, transparent: true, opacity: 0.85 });
  const cMat2 = new THREE.MeshBasicMaterial({ color: '#2a1a24', fog: false, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 16; i++) {
    const c = new THREE.Group(); const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3, r = 42 + Math.random() * 30;
    c.position.set(Math.cos(a) * r, 20 + Math.random() * 16, Math.sin(a) * r);
    const n = 4 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(2.2 + Math.random() * 1.8, 14, 10), k % 3 === 2 ? cMat2 : cMat); b.position.set((k - n / 2) * 2.4 + Math.random(), Math.random() * 1.2, Math.random() * 2); b.scale.y = 0.6; c.add(b); }
    c.userData.ph = Math.random() * 6; clouds.add(c);
  }

  const hemi = new THREE.HemisphereLight('#7a80b8', '#1a1014', 1.15); root.add(hemi);
  const sun = new THREE.DirectionalLight('#c08a9a', 0.9); sun.position.set(-30, 42, -60); // 붉은 달빛
  root.add(sun);

  const gt = groundTex('#3a4a32', 0.12); gt.repeat.set(18, 18);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(46, 72), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(16.5, 56), new THREE.MeshStandardMaterial({ map: (() => { const t = groundTex('#6a625c', 0.14); t.repeat.set(5, 5); return t; })(), roughness: 1 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; plaza.receiveShadow = true; root.add(plaza);

  const add = (p) => { const g = place(root, p); const f = footOf(p, g); if (f) colliders.push(f); return g; };
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + 0.09; add({ t: i % 3 ? 'pine' : 'tree', x: Math.cos(a) * 19.5, z: Math.sin(a) * 19.5, color: ['#c9a8ff', '#ffb7c9', '#9ad0ff'][i % 3] }); }
  const outer = buildOuterPark(root, colliders, add);
  buildLobbyHorror(root, colliders);
  add({ t: 'bench', x: -6, z: 7, r: 30 }); add({ t: 'bench', x: 6, z: 7, r: -30 });
  for (const s of [-1, 1]) { add({ t: 'lamp', x: 13 * s, z: 4.5, noLight: true }); add({ t: 'lamp', x: 6.5 * s, z: 16, noLight: true }); }
  const park = buildPark(root, colliders, add);
  add({ t: 'lantern_string', x: 0, z: 9, len: 14 });

  const exhibits = LOBBY_THEMES.map((th) => buildExhibit(root, colliders, th));
  const tip = textSprite('🚪 테마 관문을 클릭하면 바로 시작! · 🎠 놀이기구도 탈 수 있어요', { size: 26, bg: 'rgba(0,0,0,.55)', maxW: 700 });
  tip.position.set(0, 2.6, 1); root.add(tip);

  // 떠다니는 영혼불
  const fGeo = new THREE.BufferGeometry(); const n = 140; const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 64; pos[i * 3 + 1] = 0.5 + Math.random() * 5; pos[i * 3 + 2] = (Math.random() - 0.5) * 64; }
  fGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const flies = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: '#cfe0ff', size: 0.12, transparent: true, opacity: 0.8 }));
  root.add(flies);
  {
    const n = 1800; const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.32, 4), new THREE.MeshStandardMaterial({ color: '#3f6a40', roughness: 1 }), n);
    const m4 = new THREE.Matrix4();
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = 17 + Math.random() * 27; m4.makeRotationZ((Math.random() - 0.5) * 0.5); m4.setPosition(Math.cos(a) * r, 0.15, Math.sin(a) * r); grass.setMatrixAt(k, m4); }
    root.add(grass);
  }
  colliders.push(...ringColliders(30.5));
  scene.add(root);
  const update = (t) => {
    park.update(t); outer.update(t);
    clouds.rotation.y = t * 0.006; clouds.children.forEach((c) => (c.position.y += Math.sin(t * 0.3 + c.userData.ph) * 0.004));
    flies.rotation.y = t * 0.02; flies.position.y = Math.sin(t) * 0.2;
    exhibits.forEach((e, i) => {
      e.tex.rotation = t * (0.4 + i * 0.1);
      e.light.intensity = 4 + Math.sin(t * 2 + i) * 1.5;
      e.portal.material.opacity = 0.8 + Math.sin(t * 3 + i) * 0.12;
      e.sign.position.y = 5.1 + Math.sin(t * 1.5 + i) * 0.08;
      e.spin.forEach((s) => (s.rotation.z = Math.sin(t * 1.2 + i) * 0.15));
    });
  };
  return { root, colliders, walls: [], objects: {}, flickers: [], ceiling: [], update, bounds: 28.5, outdoor: true, themes: LOBBY_THEMES, exhibits, interactives: [...park.interactives, ...outer.interactives], rides: park.rides };
}

// ───── 로비 공포 장식: 바닥의 핏자국 · 벽 낙서("살려줘" "무서워" …) · 핏빛 손자국
const BLOOD_WORDS = ['살려줘', '무서워', '도망쳐', '뒤를 봐', '여기서 나가', '나 좀 꺼내줘', '엄마', '그것이 온다', '눈 감지 마', '다음은 너야'];
function bloodTex(seed) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  let s = seed * 9301 + 49297; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const blob = (cx, cy, r, a) => { x.fillStyle = `rgba(${90 + R() * 40 | 0},0,${R() * 8 | 0},${a})`; x.beginPath(); for (let k = 0; k <= 18; k++) { const an = (k / 18) * Math.PI * 2, rr = r * (0.7 + R() * 0.5); x.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } x.fill(); };
  blob(128, 128, 46 + R() * 22, 0.9);
  for (let i = 0; i < 26; i++) { const an = R() * Math.PI * 2, d = 50 + R() * 70; blob(128 + Math.cos(an) * d, 128 + Math.sin(an) * d, 3 + R() * 10, 0.85); }
  for (let i = 0; i < 5; i++) { const an = R() * Math.PI * 2; x.strokeStyle = 'rgba(110,0,0,.85)'; x.lineWidth = 3 + R() * 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.cos(an) * (70 + R() * 50), 128 + Math.sin(an) * (70 + R() * 50)); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function graffitiTex(word, seed) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const x = c.getContext('2d');
  let s = seed * 7919 + 13; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  // 금 가고 얼룩진 콘크리트
  x.fillStyle = '#4a4744'; x.fillRect(0, 0, 512, 320);
  for (let i = 0; i < 900; i++) { const v = 50 + R() * 40 | 0; x.fillStyle = `rgba(${v},${v - 3},${v - 6},.5)`; x.fillRect(R() * 512, R() * 320, 2 + R() * 4, 2 + R() * 4); }
  x.strokeStyle = 'rgba(20,18,16,.6)'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); let px = R() * 512, py = R() * 320; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (R() - 0.5) * 80; py += R() * 50; x.lineTo(px, py); } x.stroke(); }
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(30,26,20,.25)'; x.fillRect(R() * 512, 0, 6 + R() * 20, 320); } // 빗물 얼룩
  // 핏빛 손자국
  for (let i = 0; i < 3 + (R() * 3 | 0); i++) {
    const hx = 30 + R() * 450, hy = 30 + R() * 240, sc = 0.7 + R() * 0.5; x.save(); x.translate(hx, hy); x.rotate((R() - 0.5) * 0.8); x.scale(sc, sc); x.fillStyle = 'rgba(120,0,0,.8)';
    x.beginPath(); x.ellipse(0, 16, 15, 18, 0, 0, Math.PI * 2); x.fill(); for (let f = 0; f < 5; f++) { x.beginPath(); x.ellipse(-14 + f * 7, -8 - (f === 0 ? -8 : Math.abs(f - 2) * -2 + 6), 3.5, f === 0 ? 8 : 11, f === 0 ? -0.6 : 0, 0, Math.PI * 2); x.fill(); }
    x.fillRect(-4, 30, 3, 20 + R() * 30); x.restore();
  }
  // 흘러내리는 글씨
  const col = R() < 0.75 ? '#9a0a0a' : '#111';
  x.save(); x.translate(256, 165); x.rotate((R() - 0.5) * 0.18);
  const fs = Math.min(130, 460 / Math.max(2, word.length * 0.95)); x.font = `900 ${fs}px "Nanum Myeongjo", serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = col; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 6; x.fillText(word, 0, 0); x.shadowBlur = 0;
  const w = x.measureText(word).width;
  for (let i = 0; i < 18; i++) { const dx = -w / 2 + R() * w, len = 20 + R() * 90; x.fillStyle = col; x.fillRect(dx, fs * 0.25, 2 + R() * 4, len); x.beginPath(); x.arc(dx + 2, fs * 0.25 + len, 3 + R() * 2, 0, Math.PI * 2); x.fill(); }
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildLobbyHorror(root, colliders) {
  // 바닥 핏자국 (광장 · 길 · 산책로 곳곳)
  const decals = [[2.5, 6], [-4, 3], [6, -2], [-9, -4], [10, 4], [-2, -9], [3, 12], [-12, 9], [14, -9], [0, 20], [-20, 6], [21, -6], [-15, -16], [16, 16], [-26, -2], [27, 3], [5, -25], [-6, 27], [9, 8.5], [-7.5, 11]];
  const dGeo = new THREE.PlaneGeometry(1, 1);
  decals.forEach(([x, z], i) => {
    const m = new THREE.Mesh(dGeo, new THREE.MeshStandardMaterial({ map: bloodTex(i + 1), transparent: true, depthWrite: false, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = i * 1.7; m.scale.setScalar(1.4 + (i % 4) * 0.6); m.position.set(x, 0.03, z); m.userData.noOcc = true; root.add(m);
  });
  // 끌고 간 핏자국 (광장 가운데를 가로질러 숲 쪽으로)
  for (let k = 0; k < 14; k++) {
    const m = new THREE.Mesh(dGeo, new THREE.MeshStandardMaterial({ map: bloodTex(40 + k), transparent: true, depthWrite: false, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.scale.set(0.9, 1.6, 1); m.position.set(-1 + k * 1.6, 0.031, 2 + k * 1.1); m.rotation.z = -0.95; root.add(m);
  }
  // 낙서 벽: 반쯤 무너진 콘크리트 담 (광장 바깥, 롤러코스터 안쪽 둘레)
  const conc = new THREE.MeshStandardMaterial({ color: '#4a4744', roughness: 0.95 });
  const spots = [0.35, 0.95, 1.6, 2.25, 2.9, 3.55, 4.2, 5.0, 5.5, 6.05];
  spots.forEach((a, i) => {
    const r = 23.6, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); root.add(g);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.3, 0.28), conc); wall.position.y = 1.15; g.add(wall);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.3), new THREE.MeshStandardMaterial({ map: graffitiTex(BLOOD_WORDS[i % BLOOD_WORDS.length], i + 3), roughness: 0.9 }));
    face.position.set(0, 1.15, 0.145); g.add(face);
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.3), conc); chunk.position.set(1.6, 2.35, 0); chunk.rotation.z = 0.5; g.add(chunk); // 깨진 윗부분
    for (let k = 0; k < 3; k++) { const rb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + k * 0.05), conc); rb.position.set(-1 + k * 0.9, 0.12, 0.5); g.add(rb); }
    colliders.push({ x, z, hw: 1.5, hd: 1.5 });
  });
  // 바닥에 피로 쓴 글씨 하나 (광장 가운데 앞)
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 256; const fx2 = fc.getContext('2d');
  fx2.font = '900 150px "Nanum Myeongjo", serif'; fx2.textAlign = 'center'; fx2.textBaseline = 'middle'; fx2.fillStyle = 'rgba(130,0,0,.88)'; fx2.fillText('살려줘', 256, 120);
  for (let i = 0; i < 14; i++) { fx2.fillRect(70 + i * 27, 160, 3, 20 + (i * 37) % 60); }
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const fw = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshStandardMaterial({ map: ft, transparent: true, depthWrite: false, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -3 }));
  fw.rotation.x = -Math.PI / 2; fw.position.set(0, 0.035, 9.8); root.add(fw);
}

function ringColliders(r) {
  const out = []; const n = Math.ceil((Math.PI * 2 * r) / 3.4);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, hw: 2.2, hd: 2.2 }); }
  return out;
}

// ───────────────── 넓어진 바깥 공원: 산책로 · 연못과 분수 · 꽃밭 · 먹자골목 · 야외 무대 · 바깥 숲
function buildOuterPark(root, colliders, add) {
  const anim = []; const inter = [];
  // 둘레 산책로 (반지름 27)
  const ring = new THREE.Mesh(new THREE.RingGeometry(24.6, 27, 96), new THREE.MeshStandardMaterial({ map: (() => { const t = groundTex('#d8c8a8', 0.12); t.repeat.set(30, 2); return t; })(), roughness: 1 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; ring.receiveShadow = true; root.add(ring);
  // 광장에서 산책로로 이어지는 네 갈래 길
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 10), new THREE.MeshStandardMaterial({ color: '#cdbf9f', roughness: 1 }));
    p.rotation.x = -Math.PI / 2; p.rotation.z = -a + Math.PI / 2; p.position.set(Math.cos(a) * 21, 0.011, Math.sin(a) * 21); root.add(p);
  }
  // 북쪽: 연못 + 분수
  {
    const cx = 0, cz = -25.6;
    const water = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40), new THREE.MeshStandardMaterial({ color: '#3f8fc8', roughness: 0.15, metalness: 0.3, emissive: '#0a3050', emissiveIntensity: 0.4 }));
    water.rotation.x = -Math.PI / 2; water.position.set(cx, 0.06, cz); root.add(water);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4.7, 0.28, 8, 48), new THREE.MeshStandardMaterial({ color: '#d8d0c4', roughness: 0.8 })); rim.rotation.x = -Math.PI / 2; rim.position.set(cx, 0.12, cz); root.add(rim);
    add({ t: 'fountain', x: cx, z: cz });
    colliders.push({ x: cx, z: cz, hw: 4.4, hd: 4.4 });
    const jets = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const j = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.6, 6), new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0.6 })); j.position.set(cx + Math.cos(a) * 2.9, 0.8, cz + Math.sin(a) * 2.9); root.add(j); jets.push(j); }
    const lilies = [];
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, r = 3.4 + (i % 2) * 0.6; const l = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), new THREE.MeshStandardMaterial({ color: '#4caf6a' })); l.rotation.x = -Math.PI / 2; l.position.set(cx + Math.cos(a) * r, 0.08, cz + Math.sin(a) * r); root.add(l); const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffb7d9', emissive: '#ff6fa8', emissiveIntensity: 0.3 })); f.position.set(l.position.x, 0.14, l.position.z); root.add(f); lilies.push(l); }
    anim.push((t) => { jets.forEach((j, i) => { j.scale.y = 0.7 + Math.abs(Math.sin(t * 2 + i)) * 0.6; j.position.y = j.scale.y * 0.8; }); water.material.emissiveIntensity = 0.35 + Math.sin(t * 1.5) * 0.08; });
    for (const s of [-1, 1]) add({ t: 'bench', x: cx + s * 6.4, z: cz + 1.5, r: s * 70 });
  }
  // 꽃밭 (서쪽 · 동쪽 · 남쪽)
  const FL = ['#ff6f91', '#ffc75f', '#c9a8ff', '#ffffff', '#ff9671', '#6fd6ff'];
  const flowerBed = (cx, cz, w, d, seed) => {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: 1 })); bed.position.set(cx, 0.11, cz); root.add(bed);
    const n = Math.round(w * d * 3); const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), new THREE.MeshStandardMaterial({ color: '#3f8a40' }), n);
    const heads = FL.map((c) => new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.12 }), n));
    const cnt = FL.map(() => 0); const m4 = new THREE.Matrix4();
    for (let k = 0; k < n; k++) { const x = cx + (((k * 73 + seed) % 100) / 100 - 0.5) * (w - 0.3), z = cz + (((k * 37 + seed * 3) % 100) / 100 - 0.5) * (d - 0.3); m4.makeTranslation(x, 0.38, z); stem.setMatrixAt(k, m4); const ci = (k + seed) % FL.length; m4.makeTranslation(x, 0.58, z); heads[ci].setMatrixAt(cnt[ci]++, m4); }
    heads.forEach((h, i) => (h.count = cnt[i])); root.add(stem, ...heads);
    colliders.push({ x: cx, z: cz, hw: w / 2, hd: d / 2 });
  };
  flowerBed(-27, -9, 3, 6, 1); flowerBed(-27, 9, 3, 6, 4); flowerBed(27, -9, 3, 6, 7); flowerBed(27, 9, 3, 6, 2);
  flowerBed(-9, 27.6, 6, 2.4, 5); flowerBed(9, 27.6, 6, 2.4, 3);
  // 동쪽: 먹자골목 (포장마차 + 풍선)
  [[22.4, -13, -110], [25.6, -4, -90], [25.6, 4, -90], [22.4, 13, -70]].forEach(([x, z, r]) => add({ t: 'stall', x, z, r }));
  add({ t: 'popcorn_cart', x: 21.6, z: 0, r: -90 });
  add({ t: 'balloon_stand', x: 21.8, z: -8.5 });
  // 서쪽: 야외 무대 + 피크닉 잔디
  {
    const g = new THREE.Group(); g.position.set(-25.8, 0, 0); g.rotation.y = Math.PI / 2; root.add(g);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 4), new THREE.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.8 })); deck.position.y = 0.3; deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
    const back = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), new THREE.MeshStandardMaterial({ color: '#5a2a6a' })); back.position.set(0, 2.6, -1.9); g.add(back);
    const curtainM = new THREE.MeshStandardMaterial({ color: '#c0262d', roughness: 0.9 });
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.6, 0.25), curtainM); c.position.set(s * 3.4, 2.4, -1.6); g.add(c); }
    const sign = textSprite('🎤 야외 무대 · 올라가서 춤춰요!', { size: 28, bg: 'rgba(60,10,50,.85)', color: '#ffe08a', border: '#ff8fd0' }); sign.position.set(-25.8, 5.2, 0); root.add(sign);
    const bulbs = [];
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: ['#fff2a8', '#ff9ad0', '#9ad0ff'][i % 3] })); b.position.set(-3.6 + i * 0.55, 4.7, -1.75); g.add(b); bulbs.push(b); }
    anim.push((t) => bulbs.forEach((b, i) => (b.visible = Math.sin(t * 4 + i) > -0.3)));
    colliders.push({ x: -25.8, z: 0, hw: 2.1, hd: 4.1, perch: 'stage' });
    inter.push({ id: 'stage', kind: 'climb', x: -23.4, z: 0, r: 2.2, label: '야외 무대', verb: '올라가기', perch: { x: -25.8, z: 0, hw: 1.8, hd: 3.7, y: 0.62, id: 'stage' } });
  }
  [[-21.2, -12], [-21.2, 12]].forEach(([x, z]) => add({ t: 'bench', x, z, r: 90 }));
  // 산책로 가로등 + 벤치
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.2; add({ t: 'lamp', x: Math.cos(a) * 27.6, z: Math.sin(a) * 27.6, noLight: true }); }
  // 바깥 숲 (걸어서 닿지 않는 경계 너머 풍경)
  for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2, r = 32.5 + (i % 3) * 2.5; const g = place(root, { t: i % 4 ? 'pine' : 'tree', x: Math.cos(a) * r, z: Math.sin(a) * r, color: ['#c9a8ff', '#ffb7c9', '#9ad0ff'][i % 3] }); g.scale.setScalar(1.2 + (i % 5) * 0.15); }
  return { interactives: inter, update: (t) => anim.forEach((f) => f(t)) };
}

// ───────────────── 챕터
export function buildChapter(scene, ch, themeId = 'gwimun') {
  const TH = THEMES[themeId] || THEMES.gwimun;
  setPropTheme(themeId);
  const R = rng(themeId + ':' + ch.id + ':' + ch.title);
  const mobile = matchMedia('(pointer: coarse)').matches;
  const root = new THREE.Group();
  const colliders = [], walls = [], flickers = [], ceiling = [], anims = [];
  let waterMesh = null;
  const [W, D] = ch.size;
  const fogCol = new THREE.Color(ch.outdoor ? TH.fog : TH.fogIn);
  scene.background = fogCol.clone();
  scene.fog = new THREE.FogExp2(fogCol.clone(), ch.fog || 0.06);

  const amb = {
    night: ['#5a6a96', '#141418', 1.0], dark: ['#4a4a5c', '#101010', 0.4],
    candle: ['#7a3828', '#100808', 0.45], dusk: ['#a8a0c8', '#2a2420', 1.9], shop: ['#c8a080', '#241810', 1.3], abyss: ['#3a3a4c', '#080808', 0.3],
  }[ch.ambient] || ['#333', '#000', 0.2];
  // 테마 색으로 은은하게 물들인 환경광 (밝기는 그대로)
  const skyC = new THREE.Color(amb[0]).lerp(new THREE.Color(TH.tint), 0.35), gndC = new THREE.Color(amb[1]).lerp(new THREE.Color(TH.tint).multiplyScalar(0.2), 0.3);
  root.add(new THREE.HemisphereLight(skyC, gndC, amb[2]));
  if (ch.outdoor) {
    const moon = new THREE.DirectionalLight(new THREE.Color('#8fa4d8').lerp(new THREE.Color(TH.moon), 0.5), 0.9); moon.position.set(-8, 14, -6); root.add(moon);
    root.add(skyDome(TH.sky[0], TH.sky[1], themeId === 'ophelia' ? 120 : themeId === 'camp' ? 900 : 600, ch.id === 4 && themeId === 'gwimun' ? 'red' : TH.moon));
  }

  // 놓인 물건 자리 (장식이 이 근처는 피한다)
  const busy = [...(ch.props || []), ...ch.objects].map((p) => ({ x: p.x, z: p.z, r: (FOOT[p.t] ? Math.max(...FOOT[p.t]) / 2 : 0.4) + 0.9 }));
  busy.push({ x: ch.spawn[0], z: ch.spawn[1], r: 2.2 });
  const free = (x, z, pad = 0) => !busy.some((b) => Math.hypot(b.x - x, b.z - z) < b.r + pad) && !colliders.some((c) => Math.abs(c.x - x) < c.hw + 0.35 && Math.abs(c.z - z) < c.hd + 0.35);
  const deco = (p) => {
    const g = place(root, p);
    const big = p.t === 'pipe_run' || p.t === 'drape' || p.t === 'tent' || p.t === 'mesa'; // 카메라를 가릴 만큼 큰 장식은 다른 물건처럼 반투명 처리 대상
    g.traverse((m) => { if (m.isMesh) { if (big) delete m.userData.noOcc; else m.userData.noOcc = true; m.castShadow = false; } });
    if (g.userData.flicker) flickers.push(g.userData.flicker);
    if (g.userData.sway) anims.push((t) => { g.rotation.z = Math.sin(t * 0.9 + p.x) * 0.05; g.rotation.x = Math.cos(t * 0.7 + p.z) * 0.04; });
    if (g.userData.neon) { const nm = g.userData.neon.material; anims.push((t) => { nm.color.setScalar(Math.sin(t * 23 + p.x) > 0.97 ? 0.25 : 1); }); }
    return g;
  };

  if (ch.outdoor) {
    const gt = themedGroundTex(TH.ground, lighten(ch.ground || '#1d2218')); gt.repeat.set(8, 8);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(ch.water ? W + 3 : W + 30, ch.water ? D + 3 : D + 30), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
    if (ch.water) {
      // 섬: 둘레는 바다, 가장자리에 바위
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(260, 260, 40, 40), new THREE.MeshStandardMaterial({ color: themeId === 'camp' ? '#0a1a26' : '#0e1e2a', roughness: 0.15, metalness: 0.5, emissive: '#04101a', emissiveIntensity: 0.6 }));
      sea.rotation.x = -Math.PI / 2; sea.position.y = -0.25; root.add(sea); waterMesh = sea;
      for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2; const r = place(root, { t: 'rock', x: Math.cos(a) * (W / 2 + 1), z: Math.sin(a) * (D / 2 + 1) }); r.scale.set(1.4 + R(), 1 + R(), 1.4 + R()); }
    } else {
      // 흙길 (서부는 모래길, 츠바키야는 디딤돌)
      const pc = { west: '#8a6a40', kimono: '#3a3a30', clown: '#3a2a26', camp: '#3a3022' }[themeId] || '#3a3226';
      const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, D + 4), new THREE.MeshStandardMaterial({ map: (() => { const t = themedGroundTex(themeId === 'west' ? 'sand' : 'mud', pc); t.repeat.set(1, 6); return t; })(), roughness: 1 }));
      path.rotation.x = -Math.PI / 2; path.position.y = 0.01; root.add(path);
      if (themeId === 'kimono') for (let z = -D / 2 + 1; z < D / 2; z += 1.1) deco({ t: 'stepping_stone', x: (R() - 0.5) * 0.6, z, r: R() * 90 });
    }
    // 경계 풍경 (인스턴스)
    if (!ch.water) {
      const spots = [];
      for (let i = 0; i < 60; i++) {
        const side = i % 4; const k = R();
        const x = side < 2 ? (k - 0.5) * (W + 6) : (side === 2 ? -1 : 1) * (W / 2 + 1.5 + R() * 2);
        const z = side < 2 ? (side === 0 ? -1 : 1) * (D / 2 + 1.5 + R() * 2) : (k - 0.5) * (D + 6);
        if (side === 0 && Math.abs(x) < 2) continue;
        spots.push({ x, z, s: 1 + R() * 0.8 });
      }
      const kind = TH.border === 'carnival' ? 'pine' : TH.border;
      instancedForest(root, spots, kind);
      if (kind === 'mesa') { for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; deco({ t: 'mesa', x: Math.cos(a) * (W / 2 + 18), z: Math.sin(a) * (D / 2 + 16), s: 1.2 + R() * 1.4, color: pick(R, ['#8a3a20', '#9a4a28', '#7a3020']) }); } }
      if (kind === 'bamboo' || kind === 'pine_dense') instancedForest(root, spots.map((s) => ({ x: s.x * 1.12 + (R() - 0.5) * 2, z: s.z * 1.12 + (R() - 0.5) * 2, s: s.s * 1.1 })), kind === 'bamboo' ? 'bamboo' : 'pine');
      if (TH.border === 'carnival') {
        // 카니발 외곽: 줄전구 · 깃발 줄 · 줄무늬 천막
        for (const s of [-1, 1]) { deco({ t: 'string_lights', x: 0, z: s * (D / 2 + 0.6), y: 3.2, len: W * 0.9, sag: 0.8 }); deco({ t: 'bunting', x: s * (W / 2 + 0.6), z: 0, y: 3.4, r: 90, len: D * 0.8, sag: 0.6 }); }
        for (let i = 0; i < 6; i++) deco({ t: 'tent', x: (i % 2 ? -1 : 1) * (W / 2 + 5 + R() * 3), z: (i / 5 - 0.5) * D, r: R() * 360, color: pick(R, ['#c0262d', '#2f5fd0', '#7a1a8a', '#e8a01a']) });
      }
    }
    colliders.push({ x: 0, z: -D / 2 - 0.5, hw: W / 2 + 2, hd: 0.5 }, { x: 0, z: D / 2 + 0.5, hw: W / 2 + 2, hd: 0.5 },
      { x: -W / 2 - 0.5, z: 0, hw: 0.5, hd: D / 2 + 2 }, { x: W / 2 + 0.5, z: 0, hw: 0.5, hd: D / 2 + 2 });
  } else {
    const room = ROOMS[themeId]?.[ch.id] || ['default', 'default'];
    const ft = themedFloorTex(room[1], ch.floor || '#3a2a1c'); ft.repeat.set(W / 3, D / 3);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ft, roughness: room[1] === 'checker' || room[1] === 'metal' ? 0.55 : 0.9, metalness: room[1] === 'metal' ? 0.3 : 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
    const H = CEIL_H, T = 0.3;
    const wt = themedWallTex(room[0], ch.wall || '#5b5446');
    const baseM = new THREE.MeshStandardMaterial({ color: { hospital: '#2a3a34', clown: '#3a0a1a', kimono: '#1a100a', doll: '#2a160e' }[themeId] || '#1e1610', roughness: 0.8 });
    const crownM = new THREE.MeshStandardMaterial({ color: sh(ch.wall || '#5b5446', -0.15), roughness: 0.8 });
    const mkWall = (x, z, w, d) => {
      const tex = wt.clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(w, d) / 3, 1);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, transparent: true, opacity: 1 }));
      m.position.set(x, H / 2, z); m.receiveShadow = true; m.castShadow = true; root.add(m); walls.push(m);
      const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.2, d + 0.04), baseM); base.position.set(x, 0.1, z); base.userData.noOcc = true; root.add(base);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.1, d + 0.06), crownM); crown.position.set(x, H - 0.05, z); crown.userData.noOcc = true; root.add(crown);
      colliders.push({ x, z, hw: w / 2, hd: d / 2 });
    };
    mkWall(0, -D / 2, W + T, T); mkWall(0, D / 2, W + T, T); mkWall(-W / 2, 0, T, D); mkWall(W / 2, 0, T, D);
    for (const w of ch.walls || []) mkWall(w.x, w.z, w.w, w.d);
    // 천장등 — 테마마다 다른 등 (형광등 · 갓등 · 종이등 · 샹들리에 · 기름 램프 · 색전구)
    const candle = ch.ambient === 'candle';
    const lightCol = candle ? '#' + new THREE.Color(TH.light).lerp(new THREE.Color('#ff9a5a'), 0.5).getHexString() : TH.light;
    const fixGeo = {
      tube: new THREE.BoxGeometry(1.2, 0.06, 0.12), tubeHousing: new THREE.BoxGeometry(1.3, 0.05, 0.2),
      shade: new THREE.ConeGeometry(0.32, 0.22, 14, 1, true), bulb: new THREE.SphereGeometry(0.09, 10, 8), cord: new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4),
      lantern: new THREE.SphereGeometry(0.22, 12, 10), cage: new THREE.CylinderGeometry(0.13, 0.13, 0.3, 8, 1, true), ring: new THREE.TorusGeometry(0.42, 0.025, 6, 20),
    };
    const glowM = new THREE.MeshStandardMaterial({ color: '#ddd', emissive: lightCol, emissiveIntensity: 1 });
    const darkM = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide });
    // 휴대폰: 넓은 방(천막 등)은 천장등이 30개 넘게 생겨 GPU가 버거워한다 → 12개 이하로 줄이고 그만큼 멀리·세게 비춘다
    let step = 6; if (mobile && Math.round(W / 6) * Math.round(D / 6) > 12) step = Math.sqrt((W * D) / 12);
    const nx = Math.max(1, Math.round(W / step)), nz = Math.max(1, Math.round(D / step));
    const lk = step / 6, lBase = 7 * Math.pow(lk, 1.3);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = -W / 2 + (W / nx) * (i + 0.5), z = -D / 2 + (D / nz) * (j + 0.5);
      const l = new THREE.PointLight(lightCol, lBase, 11 * lk, 1.6); l.position.set(x, CEIL_H - 0.4, z); root.add(l);
      const fx = new THREE.Group(); fx.position.set(x, CEIL_H, z); root.add(fx);
      let tube;
      const hang = (len) => { const c = new THREE.Mesh(fixGeo.cord, darkM); c.scale.y = len / 0.4; c.position.y = -len / 2; fx.add(c); };
      switch (TH.fixture) {
        case 'tube': { const hs = new THREE.Mesh(fixGeo.tubeHousing, darkM); hs.position.y = -0.04; fx.add(hs); tube = new THREE.Mesh(fixGeo.tube, glowM); tube.position.y = -0.1; fx.add(tube); break; }
        case 'paper': { hang(0.25); tube = new THREE.Mesh(fixGeo.lantern, new THREE.MeshStandardMaterial({ color: '#f4e8d8', emissive: lightCol, emissiveIntensity: 1, roughness: 1 })); tube.scale.set(1, 1.3, 1); tube.position.y = -0.52; fx.add(tube); const cp = new THREE.Mesh(fixGeo.cage, darkM); cp.scale.set(0.6, 0.12, 0.6); cp.position.y = -0.24; fx.add(cp); break; }
        case 'chandelier': { hang(0.4); const rg = new THREE.Mesh(fixGeo.ring, new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.8, roughness: 0.3 })); rg.rotation.x = Math.PI / 2; rg.position.y = -0.42; fx.add(rg); tube = new THREE.Mesh(fixGeo.bulb, glowM); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const b = k ? tube.clone() : tube; b.scale.setScalar(0.45); b.position.set(Math.cos(a) * 0.42, -0.36, Math.sin(a) * 0.42); fx.add(b); } break; }
        case 'cage': case 'lantern_oil': { hang(0.3); const cg = new THREE.Mesh(fixGeo.cage, darkM); cg.position.y = -0.5; fx.add(cg); tube = new THREE.Mesh(fixGeo.bulb, glowM); tube.position.y = -0.5; fx.add(tube); if (TH.fixture === 'lantern_oil') tube.scale.set(0.8, 1.3, 0.8); break; }
        case 'bulb_color': { hang(0.5); const sd = new THREE.Mesh(fixGeo.shade, new THREE.MeshStandardMaterial({ color: pick(R, ['#c0262d', '#2f5fd0', '#ffd36a', '#7a1a8a']), side: THREE.DoubleSide, roughness: 0.5 })); sd.position.y = -0.55; fx.add(sd); tube = new THREE.Mesh(fixGeo.bulb, glowM); tube.position.y = -0.62; fx.add(tube); break; }
        default: { hang(0.45); const sd = new THREE.Mesh(fixGeo.shade, darkM); sd.position.y = -0.5; fx.add(sd); tube = new THREE.Mesh(fixGeo.bulb, glowM); tube.position.y = -0.58; fx.add(tube); }
      }
      fx.traverse((m) => { if (m.isMesh) { m.userData.noOcc = true; m.castShadow = false; } });
      ceiling.push({ light: l, tube, base: lBase });
    }
    // ── 벽 장식 · 천장 모서리 · 바닥 잡동사니 (결정적 배치)
    const inset = T / 2 + 0.02;
    const sides = [
      { len: W, at: (u) => [u, -D / 2 + inset], r: 0, n: [0, 1] }, { len: W, at: (u) => [u, D / 2 - inset], r: 180, n: [0, -1] },
      { len: D, at: (u) => [-W / 2 + inset, u], r: 90, n: [1, 0] }, { len: D, at: (u) => [W / 2 - inset, u], r: -90, n: [-1, 0] },
    ];
    const LABELS = { hospital: ['병동 수칙', '면회 안내', '소등 시간'], west: ['WANTED', '마차 시간표', '외상 사절'], clown: ['오늘 밤 공연', '단원 모집', '마지막 앵콜'], camp: ['캠프 규칙', '식단표', '수영 금지'] };
    for (const sd of sides) {
      // 벽에 거는 장식
      for (let u = -sd.len / 2 + 1.6; u < sd.len / 2 - 1.2; u += 2.4 + R() * 1.6) {
        const [x, z] = sd.at(u); if (!free(x + sd.n[0] * 0.6, z + sd.n[1] * 0.6, 0.2)) continue;
        if (R() < 0.35) continue;
        const kind = pick(R, TH.wallDeco), y = 1.7 + R() * 0.5;
        const P = { x, z, y, r: sd.r };
        const out = (d) => ({ x: x + sd.n[0] * d, z: z + sd.n[1] * d });
        switch (kind) {
          case 'clock_w': deco({ t: 'clock', ...P, y: 2.4, ...out(0.03) }); break;
          case 'porthole_w': deco({ t: 'porthole', ...P, y: 1.8, ...out(0.02) }); break;
          case 'lifebuoy_w': deco({ t: 'lifebuoy', ...P, y: 1.8, ...out(0.1) }); break;
          case 'radiator_w': deco({ t: 'radiator', ...P, y: 0.12, ...out(0.08) }); break;
          case 'cow_skull_w': { const g = deco({ t: 'cow_skull', ...P, y: 2.2, ...out(0.1) }); g.rotation.order = 'YXZ'; g.rotation.set(-Math.PI / 2 + 0.3, sd.r * DEG, 0); break; }
          case 'poster_w': deco({ t: 'poster', ...P, y: 1.7, label: pick(R, LABELS[themeId] || ['안내']) }); break;
          case 'neon': deco({ t: 'neon_sign', ...P, y: 2.6, text: pick(R, ['HA HA HA', 'SMILE', 'ENCORE', 'CIRCUS']), color: pick(R, ['#ff3a8a', '#3ad8ff', '#ffd23a']) }); break;
          case 'drape': deco({ t: 'drape', ...P, y: CEIL_H - 0.1, w: 1.6, h: CEIL_H - 0.3, color: pick(R, ['#7a0a1a', '#4a0a3a']), ...out(0.06) }); break;
          case 'seaweed': deco({ t: 'seaweed', ...P, y: CEIL_H - 0.1, ...out(0.1) }); break;
          case 'sconce': deco({ t: 'sconce', ...P, y: 2.1, color: TH.light }); break;
          case 'talisman': { const n = 1 + Math.floor(R() * 3); for (let k = 0; k < n; k++) deco({ t: 'talisman', ...P, y: 2.2 - k * 0.05, x: x + (sd.n[1] ? k * 0.22 : 0), z: z + (sd.n[0] ? k * 0.22 : 0) }); break; }
          case 'handprints': deco({ t: 'handprints', ...P, y: 1.2 + R() * 0.6 }); break;
          case 'wall_shelf': deco({ t: 'wall_shelf', ...P, y: 1.8 }); break;
          default: deco({ t: 'wall_frame', ...P, y: 2.5, w: 0.5 + R() * 0.4, h: 0.6 + R() * 0.4, tilt: R() < 0.25 ? (R() - 0.5) * 0.3 : 0, color: pick(R, ['#3a2410', '#5a3a1a', '#2a1a10', '#8a6a2a']) });
        }
      }
      // 바닥 잡동사니 (벽에 붙여서 길을 막지 않는다)
      for (let u = -sd.len / 2 + 1.2; u < sd.len / 2 - 1.2; u += 3 + R() * 2.5) {
        const [x0, z0] = sd.at(u); const x = x0 + sd.n[0] * 0.5, z = z0 + sd.n[1] * 0.5;
        if (!free(x, z, 0.1) || R() < 0.4) continue;
        const kind = pick(R, TH.floorDeco);
        deco({ t: kind, x, z, r: R() * 360, s: 0.8 + R() * 0.6, light: kind === 'candle_set' && R() < 0.3, torn: true, colors: themeId === 'kimono' ? ['#c0202a', '#8a1a20', '#d8a0a8'] : undefined });
      }
      // 천장 쪽 장식 줄 (줄전구 · 깃발 · 시메나와 · 배관)
      if (TH.edge !== 'none') {
        const segs = Math.max(1, Math.floor(sd.len / 7));
        for (let s = 0; s < segs; s++) {
          const u = -sd.len / 2 + (s + 0.5) * (sd.len / segs); const [x0, z0] = sd.at(u);
          const x = x0 + sd.n[0] * 0.2, z = z0 + sd.n[1] * 0.2; const len = sd.len / segs - 0.8;
          if (TH.edge === 'pipe_run') deco({ t: 'pipe_run', x, z, y: CEIL_H - 0.25, r: sd.r, len, drip: themeId === 'ophelia', color: themeId === 'hospital' ? '#8a948e' : '#5a5048' });
          else if (TH.edge === 'shimenawa') { if (R() < 0.6) deco({ t: 'shimenawa', x, z, y: CEIL_H - 0.3, r: sd.r, len: Math.min(len, 4) }); }
          else if (TH.edge === 'bunting') { if (R() < 0.7) deco({ t: 'bunting', x, z, y: CEIL_H - 0.25, r: sd.r, len, colors: ['#ff8a5a', '#5ab0ff', '#ffd36a', '#7ed07a'] }); }
          else deco({ t: 'string_lights', x, z, y: CEIL_H - 0.2, r: sd.r, len, sag: 0.4 });
        }
      }
    }
    // 위쪽 구석 거미줄
    if (TH.webs) for (const [cx, cz, r, flip] of [[-1, -1, 0, false], [1, -1, 0, true], [-1, 1, 180, true], [1, 1, 180, false]]) {
      if (R() < 0.25) continue;
      const g = deco({ t: 'cobweb', x: cx * (W / 2 - inset - 0.01), z: cz * (D / 2 - inset - 0.01), y: H, r, s: 0.9 + R() * 0.8 }); if (flip) g.scale.x = -1;
    }
  }

  // 바깥 맵 땅 위 장식: 풀 덤불(인스턴스) · 테마 잡동사니
  if (ch.outdoor) {
    const gcol = { west: '#8a7a42', kimono: '#3a5a2a', camp: '#2f5a2a', clown: '#3a4a2a', ophelia: '#4a5a3a', doll: '#2f4a2a', hospital: '#3a4a34' }[themeId] || '#2a4026';
    const blades = new THREE.ConeGeometry(0.035, 0.34, 3); blades.translate(0, 0.17, 0);
    const n = Math.round(W * D * (mobile ? 0.35 : 0.7)); const grass = new THREE.InstancedMesh(blades, new THREE.MeshStandardMaterial({ color: gcol, roughness: 1 }), n * 3);
    const o = new THREE.Object3D(); let k = 0;
    for (let i = 0; i < n * 4 && k < n * 3; i++) {
      const x = (R() - 0.5) * (W - 1), z = (R() - 0.5) * (D - 1); if (Math.abs(x) < 1.4 || !free(x, z, -0.5)) continue;
      for (let b = 0; b < 3 && k < n * 3; b++) { o.position.set(x + (R() - 0.5) * 0.18, 0, z + (R() - 0.5) * 0.18); o.rotation.set((R() - 0.5) * 0.5, R() * 3, (R() - 0.5) * 0.5); o.scale.setScalar(0.7 + R() * 0.8); o.updateMatrix(); grass.setMatrixAt(k++, o.matrix); }
    }
    grass.count = k; root.add(grass);
    const extra = { west: ['tumbleweed', 'cow_skull', 'wagon_wheel', 'bottles'], kimono: ['leaves', 'candle_set', 'leaves'], camp: ['mushrooms', 'leaves', 'rope_coil'], clown: ['debris', 'bottles', 'teddy'], gwimun: ['leaves', 'debris', 'leaves'], ophelia: ['rope_coil', 'debris', 'bottles'] }[themeId] || ['leaves'];
    for (let i = 0; i < Math.round((W * D) / 40); i++) { const x = (R() - 0.5) * (W - 2), z = (R() - 0.5) * (D - 2); if (Math.abs(x) < 1.6 || !free(x, z, 0.2)) continue; const kind = pick(R, extra); deco({ t: kind, x, z, r: R() * 360, glow: themeId === 'camp' ? '#6aff9a' : undefined, colors: themeId === 'kimono' ? ['#c0202a', '#8a1a20', '#e8a0a8'] : undefined, r2: 2.4, n: 20 }); }
  }

  let objectsRef = {};
  // 움직이는 맵: 소품에 anim 을 달면 계속 움직인다
  //   spin {speed}      제자리 회전 (회전목마 · 찻잔)
  //   swing {amp,speed} 진자처럼 흔들림 (바이킹 · 매달린 인형)
  //   bob {amp,speed}   위아래로 오르내림 (자이로드롭 · 떠다니는 풍선)
  //   orbit {r,speed}   원을 그리며 돈다 (퍼레이드 차량 · 범퍼카)
  const animate = (g, p) => {
    if (g.userData.seat) { g.userData.live = true; const seat = g.userData.seat, ph = (p.x || 0) * 1.3; anims.push((t) => { const e = p.id && objectsRef[p.id]; const amp = e?.done ? 0.75 : 0.28; seat.rotation.x = Math.sin(t * (e?.done ? 2.2 : 1.5) + ph) * amp; }); } // 그네: 혼자 흔들리다가, 함께 밀면 크게
    if (p.anim || g.userData.wheel) g.userData.live = true;
    if (g.userData.wheel) { const w = g.userData.wheel, sp = g.userData.spinWheel ?? 0.08; anims.push((t) => { w.rotation.z = t * sp; w.children.forEach((c) => { if (c.isGroup) c.rotation.z = -w.rotation.z; }); }); } // 관람차: 바퀴는 돌고 칸은 늘 아래로 매달린다
    const a = p.anim; if (!a) return; const x0 = g.position.x, y0 = g.position.y, z0 = g.position.z, r0 = g.rotation.y, ph = a.phase ?? (p.x * 0.7 + p.z * 0.3);
    if (a.type === 'spin') anims.push((t) => { g.rotation.y = r0 + t * (a.speed ?? 0.5); });
    else if (a.type === 'swing') anims.push((t) => { g.rotation[a.axis || 'z'] = Math.sin(t * (a.speed ?? 1) + ph) * (a.amp ?? 0.6); });
    else if (a.type === 'bob') anims.push((t) => { const k = a.drop ? (Math.sin(t * (a.speed ?? 0.5) + ph) > 0.7 ? -1 : Math.sin(t * (a.speed ?? 0.5) + ph)) : Math.sin(t * (a.speed ?? 1) + ph); g.position.y = y0 + (k * 0.5 + 0.5) * (a.amp ?? 1); });
    else if (a.type === 'orbit') anims.push((t) => { const an = t * (a.speed ?? 0.3) + ph; g.position.x = (a.cx ?? 0) + Math.cos(an) * a.r; g.position.z = (a.cz ?? 0) + Math.sin(an) * a.r; g.rotation.y = -an + (a.face ?? 0); });
  };
  for (const p of ch.props || []) {
    const g = place(root, p); const f = p.anim?.type === 'orbit' ? null : footOf(p, g); if (f) colliders.push(f);
    if (g.userData.flicker) flickers.push(g.userData.flicker);
    animate(g, p);
  }

  const objects = {}; objectsRef = objects;
  for (const o of ch.objects) {
    const g = place(root, o);
    if (g.userData.flicker) flickers.push(g.userData.flicker);
    const f = footOf(o, g);
    const entry = { data: o, group: g, foot: f, visible: true };
    if (o.kind !== 'deco') {
      g.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.userData.objId = o.id; delete m.userData.noOcc; } });
      // 상호작용 표시 (희미하게 빛나는 점)
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.0, depthTest: false }));
      marker.renderOrder = 5;
      const bb = new THREE.Box3().setFromObject(g);
      marker.position.set(o.x, Math.max(bb.max.y, (o.y || 0) + 0.2) + 0.25, o.z);
      root.add(marker);
      entry.marker = marker;
      // 클릭 판정을 위한 히트박스
      const size = bb.getSize(new THREE.Vector3());
      const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 0.4) + 0.1, Math.max(size.y, 0.4) + 0.1, Math.max(size.z, 0.4) + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
      bb.getCenter(hit.position); hit.userData.objId = o.id; root.add(hit);
      entry.hit = hit;
    }
    if (f) { f.objId = o.id; colliders.push(f); }
    // 풀면 움직이는 물건: moveOnDone {dx,dy,dz,ry,dur} — 문이 열리고, 기계가 내려오고, 상자가 올라간다
    if (o.moveOnDone) { entry.mv = { from: g.position.clone(), r0: g.rotation.y, k: 0 }; g.userData.live = true; }
    animate(g, o);
    objects[o.id] = entry;
  }

  // 비 (셰이더로 떨어뜨려 CPU 부담 없음)
  let rain = null;
  if (ch.rain) {
    const n = mobile ? 900 : 1500; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 34; pos[i * 3 + 1] = Math.random() * 14; pos[i * 3 + 2] = (Math.random() - 0.5) * 30; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    rain = new THREE.Points(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { time: { value: 0 }, color: { value: new THREE.Color('#8fa0b8') } },
      vertexShader: 'uniform float time; void main(){ vec3 p = position; p.y = mod(p.y - time * 14.0, 14.0); vec4 mv = modelViewMatrix * vec4(p,1.0); gl_PointSize = 36.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 color; void main(){ vec2 d = gl_PointCoord - 0.5; if (abs(d.x) > 0.06) discard; gl_FragColor = vec4(color, 0.55 * (1.0 - abs(d.y) * 2.0)); }',
    }));
    rain.frustumCulled = false; root.add(rain);
  }
  // 떠다니는 입자 (먼지 · 재 · 반딧불 · 꽃잎 · 색종이 …)
  let pk = ch.outdoor ? TH.particles : ({ camp: 'motes', kimono: 'motes', ophelia: 'mist' }[themeId] || TH.particles);
  if (ch.rain) pk = null;
  const dust = pk ? particleField(pk, ch.outdoor ? W + 4 : W - 0.5, ch.outdoor ? D + 4 : D - 0.5, ch.outdoor ? 6 : CEIL_H - 0.1) : null;
  if (dust) root.add(dust);

  scene.add(root);

  // 움직이지 않는 장식은 행렬 갱신을 건너뛴다 (매 프레임 수백 개 계산 절약)
  root.updateMatrixWorld(true);
  const animated = new Set(Object.values(objects).filter((e) => e.group.userData.swing || e.group.userData.flag).map((e) => e.group));
  for (const c of root.children) {
    if (c.isLight || c === waterMesh || animated.has(c) || c.userData.sway || c.userData.live) continue;
    let moving = false; c.traverse((m) => { if (m.isPoints || m.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) moving = true; });
    if (!moving) c.matrixWorldAutoUpdate = false;
  }

  const objList = Object.values(objects);
  const update = (t, dt) => {
    for (const f of flickers) { f.userData.base ??= f.intensity; f.intensity = f.userData.base * (0.75 + Math.sin(t * 13 + f.id) * 0.1 + (Math.random() < 0.02 ? -0.6 : 0)); }
    if (rain) rain.material.uniforms.time.value = t;
    if (dust) dust.material.uniforms.time.value = t;
    if (waterMesh) waterMesh.position.y = -0.25 + Math.sin(t * 0.8) * 0.06;
    for (const a of anims) a(t);
    for (const e of objList) {
      const fl = e.group.userData.flag; if (fl) fl.rotation.y = Math.sin(t * 2 + e.data.x) * 0.3;
      const bl = e.group.userData.blink; if (bl) bl.intensity = Math.sin(t * 5) > 0.3 ? 5 : 0.2;
      if (e.group.userData.swing) e.group.rotation.z = Math.sin(t * 1.6) * 0.12;
      if (e.mv && e.done && e.mv.k < 1) {
        const m = e.data.moveOnDone; e.mv.k = Math.min(1, e.mv.k + dt / (m.dur || 2)); const k = 1 - Math.pow(1 - e.mv.k, 3);
        e.group.position.set(e.mv.from.x + (m.dx || 0) * k, e.mv.from.y + (m.dy || 0) * k, e.mv.from.z + (m.dz || 0) * k); e.group.rotation.y = e.mv.r0 + (m.ry || 0) * k;
        if (e.foot && m.clear && e.mv.k >= 1) { e.foot.hw = 0; e.foot.hd = 0; } // 다 움직이면 길을 막지 않는다
      }
    }
  };

  return { root, colliders, walls, objects, flickers, ceiling, update, outdoor: !!ch.outdoor, size: ch.size };
}

export function disposeWorld(scene, w) {
  if (!w) return;
  scene.remove(w.root);
  w.root.traverse((o) => { o.geometry?.dispose?.(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose?.(); m.dispose?.(); }); } });
}
