import {buildLobbyMountain} from './lobby-mountain.js';
import {withoutDesktopHints} from './mobile-copy.js';
import * as THREE from 'three';
import { buildArcadeCabinet } from './arcade-cabinet.js';
import { buildProp, FOOT, setPropTheme, markShared, disposeTree } from './props.js';
import { buildXmasProp, decorateXmas } from './xmas-visuals.js';
import { wrapGift } from './gift-ribbon.js';
import { loadXmasOpticalModel } from './xmas-models.js';
import { dressScenery } from './refined-models.js';
import { textSprite as rawTextSprite, createAvatar, animateAvatar } from './avatar.js';
import { buildWings, buildMount, buildSword, buildBalloon, BALLOON_COLORS, buildSnack } from './gear.js';
const HOTDOG_POS = [16, 18], CANDY_POS = [-10.9, 21.4]; // 핫도그는 팝콘 가게 옆, 솜사탕은 커피 가게 옆 같은 줄 (광장 가장자리 같은 반지름)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const textSprite=(text,options)=>rawTextSprite((matchMedia('(pointer: coarse)').matches||innerWidth<760)?withoutDesktopHints(text):text,options);
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
  const g = buildXmasProp(p) || buildProp(p); g.userData.propKind = p.t; // (그래픽 강화가 집 같은 소품을 찾는 데 쓴다)
  g.position.set(p.x, p.y || 0, p.z);
  g.rotation.y = (p.r || 0) * DEG;
  root.add(g);
  dressScenery(g, root, p);
  return g;
}

function groundTex(color, noise = 0.12) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * noise})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 4); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** 로비 바닥 재질 고르기. 기본은 적색 부채꼴 타일, 0~4는 기존 스타일 미리보기. */
function lobbyFloor(style) {
  const tex = (size, draw, rep = 1) => { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep > 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); } return t; };
  const simple = { ground: { color: '#34422f' }, path: { color: '#bfb193' } }; // 단순한 바닥들은 풀밭 · 산책로도 무늬 없이
  switch (String(style || '')) {
    case 'burgundy': return { ...simple, plaza: { map: tex(1024, (x, n) => {
      const center = n / 2;
      const radius = center * 0.96;
      const rings = 9;
      const colors = ['#522b36', '#59303c', '#603542', '#653845', '#6a3c49'];
      const random = rng('burgundy-plaza');
      x.fillStyle = '#32303b';
      x.fillRect(0, 0, n, n);
      x.strokeStyle = '#382631';
      x.lineWidth = 2.4;
      for (let ring = 0; ring < rings; ring++) {
        const inner = radius * ring / rings;
        const outer = radius * (ring + 1) / rings;
        const count = 8 + ring * 4;
        const step = Math.PI * 2 / count;
        const offset = ring % 2 ? step / 2 : 0;
        for (let tile = 0; tile < count; tile++) {
          const start = tile * step + offset;
          const end = start + step;
          x.beginPath();
          x.arc(center, center, outer, start, end);
          if (inner > 0) x.arc(center, center, inner, end, start, true);
          else x.lineTo(center, center);
          x.closePath();
          x.fillStyle = colors[Math.floor(random() * colors.length)];
          x.fill();
          x.stroke();
        }
      }
    }), roughness: 0.95 } };
    case '1': return { ...simple, plaza: { color: '#5e5967' } };
    case '2': return { ...simple, plaza: { map: tex(256, (x, n) => { x.fillStyle = '#625c6a'; x.fillRect(0, 0, n, n); x.strokeStyle = 'rgba(20,16,26,.5)'; x.lineWidth = 7; x.strokeRect(0, 0, n, n); x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2; x.strokeRect(6, 6, n - 12, n - 12); }, 20) } };
    case '3': return { ...simple, plaza: { map: tex(1024, (x, n) => {
      const R = n / 2, N = 8;
      for (let i = N; i >= 1; i--) { x.fillStyle = i % 2 ? '#665f6f' : '#575160'; x.beginPath(); x.arc(R, R, (i / N) * R, 0, Math.PI * 2); x.fill(); }
      x.strokeStyle = 'rgba(18,14,24,.45)'; x.lineWidth = 3; for (let i = 1; i <= N; i++) { x.beginPath(); x.arc(R, R, (i / N) * R - 1.5, 0, Math.PI * 2); x.stroke(); }
    }) } };
    case '4': return { ...simple, plaza: { map: tex(512, (x, n) => {
      const R = n / 2, g = x.createRadialGradient(R, R, R * 0.12, R, R, R); g.addColorStop(0, '#7d7587'); g.addColorStop(0.55, '#645d6d'); g.addColorStop(1, '#4a4553');
      x.fillStyle = g; x.fillRect(0, 0, n, n); x.strokeStyle = 'rgba(255,255,255,.10)'; x.lineWidth = 4; x.beginPath(); x.arc(R, R, R * 0.965, 0, Math.PI * 2); x.stroke();
    }) } };
    default: return { ground: { map: (() => { const t = groundTex('#3a4a32', 0.12); t.repeat.set(18, 18); return t; })() }, plaza: { map: cobbleTex(), roughness: 0.95 }, path: null }; // 지금 바닥: 돌길 광장
  }
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
  christmas: { tint: '#739eaa', fog: '#102838', fogIn: '#1a212e', light: '#ffe6ba', fixture: 'bulb',
    sky: ['#061322', '#28485e'], moon: '#e6f0ff', particles: null, border: 'pine', ground: 'concrete',
    wallDeco: ['sconce', 'wall_frame', 'clock_w'], floorDeco: [], edge: 'none', webs: false },
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
  zombie: { tint: '#6a7a62', fog: '#070a07', fogIn: '#060806', light: '#e8ffd8', fixture: 'tube', sky: ['#030503', '#1a2418'], moon: '#e8f0d0', particles: 'ash', border: 'none', ground: 'concrete',
    wallDeco: ['poster_w', 'handprints', 'wall_frame', 'clock_w', 'handprints'], floorDeco: ['debris', 'blood_smear', 'bottles', 'debris'], edge: 'pipe_run', webs: false },
  clown: { tint: '#9a5aaa', fog: '#0c0612', fogIn: '#0a0410', light: '#ffc8e0', fixture: 'bulb_color', sky: ['#06020c', '#2a0e2e'], moon: '#ffe0f0', particles: 'confetti', border: 'carnival', ground: 'dirt',
    wallDeco: ['wall_frame', 'neon', 'poster_w', 'drape', 'sconce'], floorDeco: ['debris', 'bottles', 'teddy', 'blood_smear'], edge: 'string_lights', webs: true },
};
// 챕터별 벽지 · 바닥 (같은 테마라도 장소에 따라 다르다)
const ROOMS = {
  christmas: { 0: ['panel', 'parquet'], 1: ['metal', 'concrete'], 3: ['damask', 'parquet'], 4: ['shipwood', 'deck'], 5: ['metal', 'metal'] },
  gwimun: { 1: ['school', 'planks'], 2: ['school', 'planks'], 3: ['hanji', 'jangpan'], 5: ['hanji', 'jangpan'], 6: ['stone', 'stone'] },
  ophelia: { 1: ['shipwood', 'deck'], 2: ['shipwood', 'deck'], 3: ['metal', 'metal'] },
  doll: { 0: ['damask', 'parquet'], 1: ['damask', 'parquet'], 2: ['damask', 'parquet'], 3: ['boards', 'planks'] },
  hospital: { 0: ['tile', 'checker'], 1: ['tile', 'checker'], 2: ['panel', 'parquet'], 3: ['tile_full', 'concrete'] },
  camp: { 1: ['logs', 'planks'] },
  zombie: { 1: ['tile', 'checker'], 2: ['panel', 'parquet'], 3: ['tile_full', 'concrete'] },
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
  const merged = mergeGeometries(parts); merged.computeBoundingSphere(); markShared(merged); TREE_GEO.set(kind, merged); return merged;
}
const TREE_MAT = markShared(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
function instancedForest(root, spots, kind) {
  if (!spots.length) return;
  const geo = treeGeo(kind === 'pine' || kind === 'pine_dense' || kind === 'bamboo' || kind === 'mesa' ? kind : 'pine');
  for (const s of spots) {
    const m = new THREE.Mesh(geo, TREE_MAT);
    m.position.set(s.x, 0, s.z); m.rotation.y = (s.x * 1.7 + s.z) % (Math.PI * 2); m.scale.setScalar(s.s);
    m.castShadow = false; m.userData.forestKind = kind; root.add(m); // (그래픽 강화가 나무를 찾는 데 쓴다)
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
  { id: 'zombie', color: '#8aff5a', glow: '#0a3a08', label: '🧟 데드 시티 (히든)', hidden: true },
];
// 관문은 광장 북쪽 반원에 고르게 늘어선다 (히든 테마가 열리면 하나 더 끼워서 다시 배치)
// 로비 넓이 배율: 로비를 다 지은 뒤 spreadLobby 가 물건들 사이를 이만큼 벌린다 (물건 크기는 그대로)
export const LS = 1.6;
const OUTER_PATH = { ringInner: 24.6, ringOuter: 27, branchStart: 17.05, branchEnd: 26, branchHalfWidth: 1.2 };

function onOuterPath(x, z, margin = 0) {
  const { ringInner, ringOuter, branchStart, branchEnd, branchHalfWidth } = OUTER_PATH;
  const r = Math.hypot(x, z);
  if (r >= ringInner * LS - margin && r <= ringOuter * LS + margin) return true;
  const along = (Math.abs(x) + Math.abs(z)) * Math.SQRT1_2;
  const across = Math.abs(Math.abs(x) - Math.abs(z)) * Math.SQRT1_2;
  return along >= branchStart * LS - margin && along <= branchEnd * LS + margin && across <= branchHalfWidth + margin;
}
function placeThemes(list) { list.forEach((th, k, all) => { const a = Math.PI + (k / (all.length - 1)) * Math.PI; th.x = +(Math.cos(a) * 15 * LS).toFixed(2); th.z = +(Math.sin(a) * 15 * LS).toFixed(2); }); return list; }
placeThemes(LOBBY_THEMES.filter((t) => !t.hidden));

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
  g.rotation.y = Math.atan2(-th.x, 6 * LS - th.z); // 광장 가운데(스폰)를 바라보게
  g.userData.noSpread = true; root.add(g);
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
  const P = (p, s = 1) => { const m = buildProp(p); m.position.set(p.x, p.y || 0.3, p.z); m.rotation.y = (p.r || 0) * DEG; m.scale.setScalar(s); g.add(m); dressScenery(m, root, p); return m; };
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
  } else if (th.id === 'christmas') {
    for (const [t, x] of [['xmas_fir', -2.25], ['xmas_stack', 2.05]]) {
      const prop = buildXmasProp({ t });
      prop.position.set(x, .18, .65);
      prop.scale.setScalar(t === 'xmas_fir' ? .72 : .85);
      g.add(prop);
      dressScenery(prop, g, { t });
    }
  } else if (th.id === 'zombie') {
    P({ t: 'barrel', x: -2.2, z: 0.6 }, 0.9); P({ t: 'debris', x: 2.2, z: 0.6 }, 1.2); P({ t: 'blood_smear', x: 0.4, z: 1.6 }, 1.2);
    spin.push(P({ t: 'crate', x: 1.3, z: 1.8, r: 20 }, 0.7));
  } else if (th.id === 'clown') {
    P({ t: 'jack_box', x: -2.2, z: 0.5, r: 20 }, 0.9); P({ t: 'balloon_stand', x: 2.3, z: 0.3 }, 0.8);
    spin.push(P({ t: 'unicycle', x: 1.3, z: 1.7, r: -20 }, 0.9));
  } else {
    P({ t: 'dollhouse', x: -2.3, z: 0.1, r: 25 }, 0.9); P({ t: 'doll_big', x: 2.2, z: 0.4, r: -25 }, 0.8);
    spin.push(P({ t: 'rocking_horse', x: 1.0, z: 1.7, r: -10 }, 0.9));
  }
  const sign = textSprite(th.label, { size: 40, bg: 'rgba(10,6,14,.85)', color: th.color, border: th.color });
  sign.position.set(th.x, 5.1, th.z); sign.scale.multiplyScalar(1.3); sign.userData.noSpread = true; root.add(sign);
  // 충돌: 받침대 뒤쪽 아치 + 양옆 소품
  colliders.push({ x: th.x, z: th.z, hw: 1.9, hd: 1.9, noSpread: true });
  return { portal, tex, light, spin, sign, group: g, id: th.id };
}


// ───────────────── 놀이공원 (로비) — 회전목마 · 관람차 · 벤치 · 피크닉 테이블
// 놀이기구는 실제 시계(Date.now)로 돌려서 모든 접속자 화면에서 같은 위치에 보인다
const PARK = { carousel: { x: -13.45, z: 9.05 }, wheel: { x: -2.3, z: -18.9 } }; // 관람차는 광장 북쪽, 츠바키야 · 삐에로 관문 사이 뒤에 선다 (관문 너머 하늘에 보인다)
const parkNow = () => Date.now() / 1000;
function stripeTex(a, b, n = 12) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d');
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect((256 / n) * i, 0, 256 / n + 1, 32); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const pm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const _gc = new Map();
const G = (key, make) => (_gc.has(key) ? _gc.get(key) : (_gc.set(key, markShared(make())), _gc.get(key)));
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
    rides.carousel = { center: PARK.carousel, seats: 6, pos: (i) => { const a = ang(); const th = (i / 6) * Math.PI * 2 + a; return { x: cx + Math.cos(th) * 2.4, z: cz + Math.sin(th) * 2.4, y: 0.35 + 1.15 + Math.sin(a * 3 + i * 1.7) * 0.22 - 0.35, ry: (-th) % (Math.PI * 2) }; } };
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
    rides.wheel = { center: PARK.wheel, seats: N, pick: (busy) => { let best = -1, by = 1e9; for (let i = 0; i < N; i++) { if (busy.has(i)) continue; const y = cpos(i).y; if (y < by) { by = y; best = i; } } return best; },
      pos: (i) => { const p = cpos(i); return { x: cx + p.x, z: cz, y: p.y - 0.62, ry: cz < 0 ? 0 : Math.PI }; } }; // 탄 사람은 광장 쪽을 본다
    interactives.push({ id: 'wheel', kind: 'ride', x: cx, z: cz + 1.8, r: 5.5, label: '관람차', verb: '타기' }); // 관람차가 커서 옆에서도 탈 수 있게 넓게
    const sign = textSprite('🎡 관람차', { size: 30, bg: 'rgba(40,10,40,.75)', color: '#ffd0f0' }); sign.position.set(cx, 1.6, cz + 1.7); root.add(sign);
  }
  // 롤러코스터: 광장 바깥을 한 바퀴 도는 언덕 트랙 + 4칸 열차(8명). 높은 곳에선 느리고 낮은 곳에선 빠르다
  {
    const M = 720, P = [], cum = [0];
    for (let i = 0; i < M; i++) {
      const th = (i / M) * Math.PI * 2;
      const r = (22 + 0.8 * Math.sin(3 * th + 0.5)) * LS;
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
    for (const off of [-0.38, 0.38]) { const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts(off, 0), true), 760, 0.065, 6, true), railMat, 0, 0, 0, root); m.castShadow = false; m.userData.noSpread = true; }
    { const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts(0, -0.22), true), 760, 0.13, 6, true), pm('#ffd36a', { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, root); m.castShadow = false; m.userData.noSpread = true; }
    // 침목 · 기둥 (인스턴스로 한 번에)
    const nTie = Math.floor(LEN / 0.9), nSup = Math.floor(LEN / 3.2);
    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.06, 0.16), pm('#6b4a8a'), nTie);
    const sups = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 1, 6), pm('#f0eaff', { metalness: 0.4, roughness: 0.5 }), nSup);
    const o = new THREE.Object3D();
    for (let k = 0; k < nTie; k++) { const { p, t } = at((k / nTie) * LEN); o.position.copy(p); o.position.y -= 0.08; o.lookAt(p.x + t.x, p.y - 0.08 + t.y, p.z + t.z); o.scale.set(1, 1, 1); o.updateMatrix(); ties.setMatrixAt(k, o.matrix); }
    for (let k = 0; k < nSup; k++) { const { p } = at((k / nSup) * LEN); const h = p.y - 0.3; o.position.set(p.x, h / 2, p.z); o.rotation.set(0, 0, 0); o.scale.set(1, h, 1); o.updateMatrix(); sups.setMatrixAt(k, o.matrix); }
    ties.userData.noSpread = sups.userData.noSpread = true; root.add(ties, sups);
    // 열차: 앞칸부터 0~3, 칸마다 2자리
    const CARS = 4, GAP = 1.75, CC = ['#ff3f6c', '#ffc75f', '#6fd6ff', '#b39dff'];
    const cars = [];
    for (let c = 0; c < CARS; c++) {
      const car = new THREE.Group(); car.userData.noSpread = true; root.add(car);
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
    rides.coaster = { posFinal: true, seats: CARS * 2, sit: true, exit: { x: sx, z: sz + 0.6 }, pick: (busy) => { for (let i = 0; i < CARS * 2; i++) if (!busy.has(i)) return i; return -1; }, pos: seatPos, front: () => at(frontS()).p };
    interactives.push({ id: 'coaster', kind: 'ride', x: sx, z: sz, r: 2.2, label: '롤러코스터', verb: '타기' });
  }
  // 벤치 (앉기)
  const benches =[[-6, 7, 30], [6, 7, -30], [-4.5, 14.5, 180], [4.5, 14.5, 180], [-14.5, 6, 90], [14.5, 6, -90]];
  benches.forEach(([x, z, r], i) => {
    if (i >= 2) add({ t: 'bench', x, z, r });
    const ry = (r * Math.PI) / 180;
    interactives.push({ id: 'bench' + i, kind: 'sit', x, z, r: 1.5, label: '벤치', verb: '앉기', seat: { x: x - Math.sin(ry) * 0.04, z: z - Math.cos(ry) * 0.04, y: 0.43, ry } });
  });
  // 피크닉 테이블 (양쪽 긴 의자는 앉기, 상판은 점프로 착지)
  [[-1.8, 12.5], [2.2, 12.2]].forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const tableTop = { hw: 0.9, hd: 0.45, y: 0.83 };
    mesh(new THREE.BoxGeometry(tableTop.hw * 2, 0.1, tableTop.hd * 2), pm('#c98a5a'), 0, tableTop.y - 0.05, 0, g);
    for (const sx of [-1, 1]) { mesh(new THREE.BoxGeometry(0.1, 0.78, 0.8), pm('#8a5a3a'), 0.75 * sx, 0.39, 0, g); mesh(new THREE.BoxGeometry(1.8, 0.07, 0.3), pm('#c98a5a'), 0, 0.45, 0.7 * sx, g); mesh(new THREE.BoxGeometry(0.08, 0.42, 0.24), pm('#8a5a3a'), 0.78 * sx, 0.21, 0.7, g); mesh(new THREE.BoxGeometry(0.08, 0.42, 0.24), pm('#8a5a3a'), 0.78 * sx, 0.21, -0.7, g); }
    colliders.push({ x, z, hw: 0.95, hd: 0.5, landing: tableTop });
    // 의자 자리 넷: 테이블을 마주 보고 앉는다 (back: 일어날 때는 뒤로)
    const seats = [];
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) seats.push({ x: x + 0.45 * sx, z: z + 0.7 * sz, y: 0.41, ry: sz > 0 ? Math.PI : 0, back: true });
    interactives.push({ id: 'table' + i, kind: 'sit', x, z, r: 1.9, label: '피크닉 테이블', verb: '의자에 앉기', seats });
  });
  // 장식: 풍선 · 포장마차 · 깃발 줄
  const BAL = ['#ff6f91', '#ffc75f', '#6fd6ff', '#b39dff', '#7ee0a8', '#ff9671'];
  [[-12, 4.6], [12, 4.6], [-3, 17], [3, 17], [-15.5, 9], [15.5, 9]].forEach(([x, z], k) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    for (let i = 0; i < 5; i++) {
      const bx = Math.cos(i * 1.3 + k) * 0.35, bz = Math.sin(i * 1.3 + k) * 0.35, by = 2.4 + (i % 3) * 0.35;
      const b = mesh(new THREE.SphereGeometry(0.28, 14, 12), pm(BAL[(i + k) % 6], { roughness: 0.25, emissive: BAL[(i + k) % 6], emissiveIntensity: 0.15 }), bx, by, bz, g); b.scale.y = 1.15;
      const str = mesh(new THREE.CylinderGeometry(0.006, 0.006, by - 0.3, 4), pm('#eee'), bx / 2, (by - 0.3) / 2, bz / 2, g); str.castShadow = false;
    }
    anim.push((t) => { g.rotation.y = Math.sin(t * 0.6 + k) * 0.12; });
  });
  add({ t: 'stall', x: -15.5, z: 13, r: 60 }); add({ t: 'stall', x: 15.5, z: 13, r: -60 });
  return { interactives, rides, update: (t) => anim.forEach((f) => f(t)) };
}

// 클리어 사진 전광판: 미아랜드 입구 자리의 세로 사진 9×3칸.
const SNAP_COLS = 9, SNAP_ROWS = 3, SNAP_W = 1.24, SNAP_H = 1.55, SNAP_GAP = 0.12;
function snapTileTex(img) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 320;
  const x = c.getContext('2d');
  if (img) {
    x.fillStyle = '#201820'; x.fillRect(0, 0, c.width, c.height);
    const scale = Math.min(c.width / img.width, c.height / img.height);
    const w = img.width * scale, h = img.height * scale;
    x.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
  } else {
    x.fillStyle = '#201820'; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = '#57414b'; x.lineWidth = 2; x.strokeRect(8, 8, 240, 304);
    x.fillStyle = '#957581'; x.font = '24px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('클리어 사진', 128, 160);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildSnapBoard(root, colliders, renderer) {
  const z = 18.2;
  const g = new THREE.Group(); g.position.set(0, 0, z); g.rotation.y = Math.PI; root.add(g);
  const W = SNAP_COLS * SNAP_W + (SNAP_COLS - 1) * SNAP_GAP;
  const H = SNAP_ROWS * SNAP_H + (SNAP_ROWS - 1) * SNAP_GAP;
  const foot = 1.35, cy = foot + H / 2;
  const metal = new THREE.MeshStandardMaterial({ color: '#2a2530', metalness: 0.6, roughness: 0.45 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, H + 0.7, 0.3), metal); back.position.set(0, cy, -0.18); g.add(back);
  // 겹을 나눈 금박 몰딩과 마름모 코너 장식.
  const agedGold = new THREE.MeshStandardMaterial({ color: '#98601f', metalness: 0.52, roughness: 0.42 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d5a443', metalness: 0.48, roughness: 0.28 });
  const highlight = new THREE.MeshStandardMaterial({ color: '#ffe2a1', metalness: 0.32, roughness: 0.24, emissive: '#a76522', emissiveIntensity: 0.18 });
  const frame = (inset, width, depth, z, material) => {
    const outerW = W + (inset + width) * 2;
    const innerH = H + inset * 2;
    const outerH = innerH + width * 2;
    for (const side of [-1, 1]) {
      const horizontal = new THREE.Mesh(new THREE.BoxGeometry(outerW, width, depth), material);
      horizontal.position.set(0, cy + side * (outerH - width) / 2, z); g.add(horizontal);
      const vertical = new THREE.Mesh(new THREE.BoxGeometry(width, innerH, depth), material);
      vertical.position.set(side * (outerW - width) / 2, cy, z); g.add(vertical);
    }
  };
  frame(0.09, 0.48, 0.36, -0.06, agedGold);
  frame(0.15, 0.34, 0.24, 0.11, gold);
  frame(0.10, 0.055, 0.14, 0.16, highlight);
  frame(0.44, 0.055, 0.10, 0.22, highlight);
  const cornerGeo = new THREE.BoxGeometry(0.28, 0.28, 0.10);
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    const corner = new THREE.Mesh(cornerGeo, highlight);
    corner.rotation.z = Math.PI / 4;
    corner.position.set(x * (W / 2 + 0.32), cy + y * (H / 2 + 0.32), 0.28); g.add(corner);
  }
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.55);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, foot, 0.45), metal);
    leg.position.set(x, foot / 2, -0.2); g.add(leg);
    // 간판의 위치는 확장하지만 지지대 간격은 그대로 유지한다.
    colliders.push({ x: -x, z: z * LS + 0.2, hw: 0.4, hd: 0.4, noSpread: true });
  }
  const title = textSprite('📸 클리어 기념 폴라로이드', { size: 36, bg: 'rgba(34,16,26,.9)', color: '#ffe3b3', border: '#ffd390', maxW: 850 });
  title.position.set(0, cy + H / 2 + 0.9, 0); title.scale.multiplyScalar(1.5); g.add(title);
  const geo = new THREE.PlaneGeometry(SNAP_W, SNAP_H), tiles = [];
  const blank = markShared(snapTileTex()); // 사진이 없는 칸은 모두 이 한 장을 같이 쓴다
  const pendingPhotos = new Map();
  let disposed = false;
  const photoTex = new Map(); // 사진 id → 질감. 한 번 만든 사진은 다시 디코드하지 않는다
  for (let i = 0; i < SNAP_COLS * SNAP_ROWS; i++) {
    const c = i % SNAP_COLS, r = Math.floor(i / SNAP_COLS);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: blank, toneMapped: false }));
    m.position.set(-W / 2 + SNAP_W / 2 + c * (SNAP_W + SNAP_GAP), cy + H / 2 - SNAP_H / 2 - r * (SNAP_H + SNAP_GAP), 0); g.add(m); tiles.push(m);
  }
  let ids = '', revision = 0, flash = 0;
  // 사진은 id별로 한 번만 디코드해 질감을 만든다. 목록이 바뀌어도 남아 있는 사진은 그대로 쓴다
  const load = (photo) => {
    if (photoTex.has(photo.id)) return Promise.resolve(photoTex.get(photo.id));
    if (!pendingPhotos.has(photo.id)) {
      const task = new Promise((resolve) => {
        const im = new Image();
        im.onload = () => im.decode().catch(() => {}).then(() => resolve(disposed ? null : keepTex(photo.id, im)));
        im.onerror = () => resolve(null);
        im.src = photo.img;
      }).finally(() => pendingPhotos.delete(photo.id));
      pendingPhotos.set(photo.id, task);
    }
    return pendingPhotos.get(photo.id);
  };
  const keepTex = (id, im) => {
    const t = markShared(snapTileTex(im));
    if (photoTex.has(id)) { t.dispose(); return photoTex.get(id); } // 같은 사진이 먼저 만들어졌다
    photoTex.set(id, t); renderer?.initTexture(t); return t; // 화면 밖 칸도 첫 복귀 때 몰아서 올리지 않도록, 디코드가 끝나는 순간 GPU에 올린다
  };
  return {
    async set(list) {
      const photos = list.slice(0, tiles.length);
      const want = photos.map((photo) => photo.id).join();
      if (want === ids) return;
      ids = want;
      const request = ++revision;
      const textures = await Promise.all(photos.map(load));
      if (disposed || request !== revision) return;
      tiles.forEach((tile, i) => { tile.material.map = textures[i] || blank; tile.material.needsUpdate = true; });
      const shown = new Set(photos.map((photo) => photo.id));
      for (const [id, t] of photoTex) if (!shown.has(id)) { t.dispose(); photoTex.delete(id); } // 목록에서 밀려난 사진만 치운다
      flash = 1;
    },
    dispose() { disposed = true; blank.dispose(); for (const t of photoTex.values()) t.dispose(); photoTex.clear(); }, // 로비를 지울 때 사진 질감도 함께 치운다
    update(dt) { if (flash > 0) { flash = Math.max(0, flash - dt * 1.5); highlight.emissiveIntensity = 0.18 + flash * 0.52; } },
  };
}

/** 로비를 다 지은 뒤 물건 사이를 LS 배 벌린다: 위치만 옮기고 크기는 그대로.
 *  noSpread 표시된 것(관문 · 롤러코스터 트랙처럼 처음부터 넓게 지은 것)은 그대로, spreadScale 표시된 바닥은 늘린다 */
function spreadLobby(root, colliders, interactives, rides) {
  const k = LS, sxz = (o) => { if (o && typeof o.x === 'number') { o.x *= k; o.z *= k; } };
  const m4 = new THREE.Matrix4();
  for (const o of root.children) {
    const u = o.userData;
    if (u.noSpread) continue;
    if (u.spreadScale) { o.scale.x *= k; o.scale.y *= k; continue; } // 눕혀 둔 원판: 로컬 x·y 가 땅 위 가로·세로
    if (o.isInstancedMesh) { for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.elements[12] *= k; m4.elements[14] *= k; o.setMatrixAt(i, m4); } o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere?.(); continue; }
    if (o.isPoints && Math.abs(o.position.x) < 0.01 && Math.abs(o.position.z) < 0.01) { o.scale.x *= k; o.scale.z *= k; continue; }
    if (Math.abs(o.position.x) < 0.01 && Math.abs(o.position.z) < 0.01) continue; // 가운데 것(분수대 · 하늘 · 구름)은 그대로
    o.position.x *= k; o.position.z *= k;
  }
  for (const c of colliders) if (!c.noSpread) sxz(c);
  // 앉는 자리 · 올라가는 자리: 물건 중심이 옮겨간 만큼만 같이 옮긴다 (중심→자리 거리는 그대로 — 테이블 의자 밖으로 엉덩이가 나가지 않게)
  for (const it of interactives) {
    if (it.noSpread) continue;
    const dx = it.x * (k - 1), dz = it.z * (k - 1), sh = (o) => { if (o && typeof o.x === 'number') { o.x += dx; o.z += dz; } };
    sh(it.seat); sh(it.perch); (it.seats || []).forEach(sh); sxz(it);
  }
  for (const r of Object.values(rides)) {
    sxz(r.exit);
    // 기구 중심(center)이 있으면 중심만 옮기고 중심→자리 거리는 그대로 (관람차 칸 · 회전목마 말 안에 정확히 앉게)
    if (!r.posFinal && r.pos) { const p0 = r.pos, c = r.center; r.pos = (i) => { const p = p0(i); if (!p) return p; return c ? { ...p, x: p.x + c.x * (k - 1), z: p.z + c.z * (k - 1) } : { ...p, x: p.x * k, z: p.z * k }; }; }
  }
}

// ───── 로비 꾸밈 (넓힌 뒤 좌표로 바로 짓는다): 돌길 광장 · 분홍 네온 테두리 · 관문 사이 가로등 + 깃발 줄 · 달 아래 성 + 박쥐
//       + 🍿 팝콘 카트 · ☕ STARMIA 미니 커피숍 (E 로 받아 들고 다니며 먹고 마신다)
function cobbleTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#3a3438'; x.fillRect(0, 0, 512, 512);
  const R = rng('cobble');
  // 돌 사이를 꽉 채운 둥근 사각 돌 (경계는 어두운 줄눈만 살짝)
  for (let row = 0; row < 8; row++) for (let col = 0; col < 9; col++) {
    const w = 64, h = 64, cx = col * w + (row % 2 ? w / 2 : 0) - 16 + (R() - 0.5) * 6, cy = row * h + 32 + (R() - 0.5) * 6;
    const l = 40 + R() * 14, hue = 262 + R() * 24;
    x.fillStyle = `hsl(${hue},${7 + R() * 7}%,${l}%)`;
    const rw = w * 0.46, rh = h * 0.43, rr = 14;
    x.beginPath(); x.roundRect(cx - rw, cy - rh, rw * 2, rh * 2, rr); x.fill();
    x.fillStyle = 'rgba(255,255,255,.05)'; x.beginPath(); x.roundRect(cx - rw + 4, cy - rh + 3, rw * 1.4, rh * 0.8, rr); x.fill();
    if (cx + rw > 512) { x.fillStyle = `hsl(${hue},9%,${l}%)`; x.beginPath(); x.roundRect(cx - rw - 512, cy - rh, rw * 2, rh * 2, rr); x.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.anisotropy = 8; return t;
}
function starmiaSignTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#0f7a4a'; x.beginPath(); x.arc(128, 128, 124, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = 8; x.beginPath(); x.arc(128, 128, 104, 0, Math.PI * 2); x.stroke();
  // 가운데: 별을 든 작은 유령 (미아식 패러디 로고)
  x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 118, 40, Math.PI, 0); x.lineTo(168, 160); for (let i = 0; i < 4; i++) x.quadraticCurveTo(158 - i * 20, 150, 148 - i * 20, 160); x.closePath(); x.fill();
  x.fillStyle = '#0f7a4a'; x.beginPath(); x.arc(114, 116, 6, 0, 7); x.arc(142, 116, 6, 0, 7); x.fill();
  x.fillStyle = '#ffd23a'; x.font = '900 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', 128, 72);
  x.fillStyle = '#fff'; x.font = '900 30px sans-serif'; x.fillText('STARMIA', 128, 196); x.font = '700 16px sans-serif'; x.fillText('★ COFFEE ★', 128, 222);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildLobbyDeco(root, colliders, themes) {
  const anim = [], inter = [];
  const add = (o) => { o.userData.noSpread = true; root.add(o); return o; };
  const PR = 16.5 * LS; // 광장 반지름
  // 분홍 네온 테두리 (두 줄)
  for (const [r, w, col, e] of [[PR, 0.08, '#ff4fa8', 1.6], [PR + 0.45, 0.04, '#b06cff', 1.2]]) { const m = add(new THREE.Mesh(new THREE.TorusGeometry(r, w, 8, 240), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: e }))); m.rotation.x = Math.PI / 2; m.position.y = 0.06; m.userData.noOcc = true; }
  // 가로등: 관문 사이사이 + 광장 남쪽 둘레
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(0.3, 'rgba(255,170,80,.45)'); g.addColorStop(1, 'rgba(255,140,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const postM = new THREE.MeshStandardMaterial({ color: '#1e1a24', metalness: 0.5, roughness: 0.5 }), lampM = new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffae40', emissiveIntensity: 1.6 });
  const angs = [];
  const ga = themes.map((th) => Math.atan2(th.z, th.x)).sort((a, b) => a - b);
  for (let i = 0; i + 1 < ga.length; i++) angs.push((ga[i] + ga[i + 1]) / 2);
  for (let k = 1; k < 8; k++) angs.push((k / 8) * Math.PI); // 남쪽 반원
  const posts = angs.filter((a) => Math.abs(a - Math.PI / 2) > 0.01 && !onOuterPath(Math.cos(a) * (PR + 1.1), Math.sin(a) * (PR + 1.1), 0.55)).map((a) => {
    const r = PR + 1.1, x = Math.cos(a) * r, z = Math.sin(a) * r, g = add(new THREE.Group()); g.position.set(x, 0, z);
    mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.6, 8), postM, 0, 1.3, 0, g);
    mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), postM, 0, 2.75, 0, g);
    mesh(new THREE.BoxGeometry(0.26, 0.32, 0.26), lampM, 0, 2.75, 0, g).castShadow = false;
    mesh(new THREE.ConeGeometry(0.28, 0.22, 4), postM, 0, 3.07, 0, g).rotation.y = Math.PI / 4;
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.8); gl.position.y = 2.75; g.add(gl); g.userData.glow = gl;
    colliders.push({ x, z, hw: 0.2, hd: 0.2, noSpread: true });
    return { x, z, a, g };
  });
  anim.push((t) => posts.forEach((p, i) => { p.g.userData.glow.material.opacity = 0.75 + Math.sin(t * 3 + i * 1.7) * 0.12 + (Math.sin(t * 17 + i) > 0.97 ? -0.4 : 0); }));
  // 깃발 줄: 관문 위쪽 가로등끼리 늘어진 줄에 빨강·검정 삼각 깃발
  {
    const north = posts.filter((p) => p.z < 0).sort((a, b) => a.a - b.a), pairs = [];
    for (let i = 0; i + 1 < north.length; i++) pairs.push([north[i], north[i + 1]]);
    const per = 9, flagG = new THREE.BufferGeometry(); flagG.setAttribute('position', new THREE.Float32BufferAttribute([-0.13, 0, 0, 0.13, 0, 0, 0, -0.3, 0], 3)); flagG.computeVertexNormals();
    const fl = new THREE.InstancedMesh(flagG, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), Math.max(1, pairs.length * per));
    const o = new THREE.Object3D(), col = new THREE.Color(); let n = 0;
    const lineM = new THREE.LineBasicMaterial({ color: '#2a2030' });
    for (const [a, b] of pairs) {
      const pts = [];
      for (let k = 0; k <= 16; k++) { const f = k / 16; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * f, 3.0 - Math.sin(Math.PI * f) * 0.7, a.z + (b.z - a.z) * f)); }
      add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineM));
      const yaw = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
      for (let k = 1; k <= per; k++) { const f = k / (per + 1); o.position.set(a.x + (b.x - a.x) * f, 3.0 - Math.sin(Math.PI * f) * 0.7, a.z + (b.z - a.z) * f); o.rotation.set(0, yaw, 0); o.updateMatrix(); fl.setMatrixAt(n, o.matrix); fl.setColorAt(n, col.set(k % 2 ? '#c8202a' : '#1a1418')); n++; }
    }
    fl.count = n; fl.instanceMatrix.needsUpdate = true; if (fl.instanceColor) fl.instanceColor.needsUpdate = true; add(fl);
  }
  // 달 아래 언덕 위의 성 (실루엣 · 창문만 노랗게)
  {
    const g = add(new THREE.Group()); g.position.set(-30, 0, -78); g.rotation.y = 0.35;
    const dark = new THREE.MeshBasicMaterial({ color: '#160c1e', fog: false }), win = new THREE.MeshBasicMaterial({ color: '#ffcf6a', fog: false });
    const hill = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dark); hill.scale.y = 0.55; g.add(hill);
    const body = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dark); m.position.set(x, y, z); g.add(m); return m; };
    body(10, 6, 5, 0, 14, 0);
    for (const [x, h] of [[-5.5, 11], [5.5, 9], [-2, 13], [2.5, 15]]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, h, 10), dark); tw.position.set(x, 11 + h / 2, 0); g.add(tw); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.2, 10), dark); roof.position.set(x, 11 + h + 1.6, 0); g.add(roof); }
    for (let i = 0; i < 9; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.7), win); w.position.set(-4 + (i % 5) * 2, 13 + Math.floor(i / 5) * 2.2, 2.6); g.add(w); }
    g.traverse((m) => { m.userData.noOcc = true; });
    // 박쥐: 성 위를 빙글빙글, 날개를 파닥
    const batG = new THREE.BufferGeometry(); batG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.9, 0.25, 0, -0.45, -0.1, 0, 0, 0, 0, 0.9, 0.25, 0, 0.45, -0.1, 0], 3));
    const bats = []; for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(batG, new THREE.MeshBasicMaterial({ color: '#0a0610', side: THREE.DoubleSide, fog: false })); b.userData.noOcc = true; add(b); bats.push(b); }
    anim.push((t) => bats.forEach((b, i) => { const a = t * (0.35 + (i % 3) * 0.08) + i * 0.7, r = 9 + (i % 4) * 2.5; b.position.set(-30 + Math.cos(a) * r, 30 + Math.sin(t * 0.9 + i) * 3 + (i % 3) * 2, -74 + Math.sin(a) * r * 0.6); b.rotation.y = -a; b.scale.set(1, 1 + Math.sin(t * 14 + i) * 0.8, 1); }));
  }
  const face = (g, x, z) => { g.rotation.y = Math.atan2(0 - x, 5 - z); };
  // 🍿 팝콘 카트 (광장 남동쪽)
  {
    const x = 12.5, z = 20.5, g = add(new THREE.Group()); g.position.set(x, 0, z); face(g, x, z);
    const cart = buildProp({ t: 'popcorn_cart' }); cart.scale.setScalar(1.55); g.add(cart);
    for (let i = 0; i < 10; i++) mesh(G('bulbP', () => new THREE.SphereGeometry(0.06, 8, 6)), G('bmP' + (i % 2), () => new THREE.MeshBasicMaterial({ color: i % 2 ? '#fff2a8' : '#ff6a8a' })), -0.93 + i * 0.207, 2.92, 0.64, g);
    const sign = textSprite('🍿 팝콘 카트 · E 로 받기', { size: 26, bg: 'rgba(120,12,24,.88)', color: '#ffe9a8', border: '#ffd36a' }); sign.position.set(x, 4.2, z); add(sign);
    const bob = textSprite('🍿', { size: 46, bg: 'rgba(0,0,0,0)' }); bob.position.set(x, 3.65, z); add(bob);
    anim.push((t) => { bob.position.y = 3.65 + Math.sin(t * 3) * 0.12; bob.material.rotation = Math.sin(t * 2) * 0.2; });
    // 튀는 팝콘 알갱이
    const pops = []; for (let i = 0; i < 6; i++) { const p = mesh(G('popK', () => new THREE.IcosahedronGeometry(0.05, 0)), G('popKm', () => new THREE.MeshStandardMaterial({ color: '#fff6d0' })), 0, 1.6, 0, g); p.castShadow = false; pops.push(p); }
    anim.push((t) => pops.forEach((p, i) => { const k = ((t * 0.9 + i / 6) % 1); p.position.set(Math.sin(i * 2.1) * 0.4, 1.75 + Math.sin(k * Math.PI) * 0.6, Math.cos(i * 1.7) * 0.22); }));
    colliders.push({ x, z, hw: 1.0, hd: 1.0, noSpread: true });
    inter.push({ id: 'popcorn', kind: 'snack', x, z, r: 2.6, label: '팝콘', verb: '받기', noSpread: true });
  }
  // ☕ STARMIA 미니 커피숍 (광장 남서쪽)
  {
    const x = -15.1, z = 18.7, g = add(new THREE.Group()); g.position.set(x, 0, z); face(g, x, z);
    const cream = pm('#f3ead8'), wood = pm('#5a3a24'), green = pm('#0f7a4a', { emissive: '#0a4a2a', emissiveIntensity: 0.4 });
    mesh(new THREE.BoxGeometry(3.4, 0.14, 2.4), pm('#3a2a22'), 0, 0.07, 0, g);
    mesh(new THREE.BoxGeometry(3.4, 2.6, 0.14), cream, 0, 1.37, -1.1, g);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.14, 2.6, 2.3), cream, 1.63 * s, 1.37, 0, g);
    mesh(new THREE.BoxGeometry(3.1, 1.0, 0.5), wood, 0, 0.6, 0.7, g); // 계산대
    mesh(new THREE.BoxGeometry(3.2, 0.08, 0.62), green, 0, 1.14, 0.7, g);
    mesh(new THREE.BoxGeometry(3.6, 0.12, 2.6), pm('#2a2224'), 0, 2.72, 0, g);
    // 초록·흰 줄무늬 차양
    const aw = mesh(new THREE.BoxGeometry(3.7, 0.06, 1.1), new THREE.MeshStandardMaterial({ map: stripeTex('#0f7a4a', '#f6f2e8', 14), roughness: 0.7 }), 0, 2.45, 1.55, g); aw.rotation.x = 0.38;
    // 둥근 간판
    const sg = mesh(new THREE.CircleGeometry(0.62, 40), new THREE.MeshBasicMaterial({ map: starmiaSignTex() }), 0, 3.35, -0.9, g); sg.castShadow = false;
    mesh(new THREE.TorusGeometry(0.64, 0.05, 8, 40), pm('#e8e0d0', { metalness: 0.5 }), 0, 3.35, -0.92, g);
    // 커피 머신 · 컵 탑 · 메뉴판
    mesh(new THREE.BoxGeometry(0.7, 0.6, 0.45), pm('#c8ccd2', { metalness: 0.7, roughness: 0.3 }), -0.8, 1.48, 0.62, g);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10), pm('#2a2a2a'), -0.8 + s * 0.16, 1.24, 0.82, g);
    for (let i = 0; i < 5; i++) mesh(G('cupS', () => new THREE.CylinderGeometry(0.07, 0.055, 0.14, 12)), G('cupSm', () => pm('#fbf8f2')), 0.55 + (i % 3) * 0.2, 1.25 + Math.floor(i / 3) * 0.15, 0.7, g);
    const menu = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const q = c.getContext('2d'); q.fillStyle = '#1c2a22'; q.fillRect(0, 0, 256, 160); q.fillStyle = '#ffd23a'; q.font = '900 24px sans-serif'; q.fillText('★ MENU', 16, 32); q.fillStyle = '#f2efe6'; q.font = '700 20px sans-serif'; ['유령 아메리카노', '핏빛 딸기라떼', '호박 마끼아또'].forEach((s2, i) => q.fillText('· ' + s2, 16, 70 + i * 30)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ map: menu }), 0.75, 2.05, -1.02, g).castShadow = false;
    for (let i = 0; i < 12; i++) mesh(G('bulbS', () => new THREE.SphereGeometry(0.055, 8, 6)), G('bmS', () => new THREE.MeshBasicMaterial({ color: '#fff2c0' })), -1.65 + i * 0.3, 2.62, 1.2, g);
    // 바리스타
    const barista = createAvatar({ body: '#ffe6d0', accent: '#0f7a4a', ears: 'cat', hat: 'cap', eyes: 'smile', mouth: 'smile', hair: 'bob', hairColor: '#4a2a1a', outfit: 'maid' });
    barista.position.set(0.2, 0.14, -0.2); barista.scale.setScalar(0.95); g.add(barista);
    anim.push((t) => { animateAvatar(barista, 0.033, false, t, false, Math.sin(t * 0.5) > 0.85 ? 'wave' : null, (t * 0.5) % 2); barista.rotation.y = Math.sin(t * 0.6) * 0.25; });
    const sign = textSprite('☕ STARMIA 커피 · E 로 받기', { size: 26, bg: 'rgba(10,60,36,.9)', color: '#f6f2e8', border: '#7ee0a8' }); sign.position.set(x, 4.3, z); add(sign);
    const steam = []; for (let i = 0; i < 3; i++) { const s2 = new THREE.Mesh(G('stG', () => new THREE.SphereGeometry(0.07, 8, 6)), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })); g.add(s2); steam.push(s2); }
    anim.push((t) => steam.forEach((s2, i) => { const k = (t * 0.6 + i / 3) % 1; s2.position.set(-0.8 + Math.sin(k * 6 + i) * 0.06, 1.85 + k * 0.7, 0.62); s2.material.opacity = 0.4 * (1 - k); s2.scale.setScalar(0.6 + k * 1.2); }));
    // 충돌: 가게 몸통 (돌려 놓은 상자를 대충 덮는 정사각형)
    colliders.push({ x, z, hw: 1.6, hd: 1.6, noSpread: true });
    inter.push({ id: 'coffee', kind: 'snack', x: x + Math.sin(g.rotation.y) * 2.0, z: z + Math.cos(g.rotation.y) * 2.0, r: 2.4, label: 'STARMIA 커피', verb: '받기', noSpread: true });
  }

  // 🎈 풍선 삐에로: 제자리에서 뒤뚱뒤뚱 → 풍선 하나를 건네는 몸짓 → 잠깐 가만히 (9초마다 반복). 다른 손엔 풍선 뭉치
  {
    const x = 6.5, z = 14.5, g = add(new THREE.Group()); g.position.set(x, 0, z); face(g, x, z);
    const clown = createAvatar({ body: '#fff6f0', accent: '#ff3a5a', ears: 'none', hat: 'none', eyes: 'star', brows: 'soft', mouth: 'grin', cheeks: 'hearts', extra: 'clown', acc: 'bowtie', hair: 'spiky', hairColor: '#ff6a2a', outfit: 'clown' });
    clown.scale.setScalar(1.15); g.add(clown);
    const cu = clown.userData;
    // 삐에로 고깔모자 (줄무늬 + 방울)
    if (cu.head) {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 20), new THREE.MeshStandardMaterial({ map: stripeTex('#ff3a5a', '#ffe9a8', 8), roughness: 0.6 }));
      hat.position.set(0.06, 0.52, 0); hat.rotation.z = -0.25; cu.head.add(hat);
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshStandardMaterial({ color: '#5ad1ff', roughness: 0.8 })); pom.position.set(0.12, 0.79, 0); cu.head.add(pom);
    }
    // 풍선 뭉치 (한 손) · 건넬 풍선 (다른 손)
    const bunch = new THREE.Group(), bunchUp = new THREE.Group(); bunch.add(bunchUp);
    BALLOON_COLORS.concat(['#ffb36a']).forEach((c, i) => { const b = buildBalloon(c, 1.55 + (i % 3) * 0.28); b.rotation.set((i % 2 ? 0.16 : -0.12) * (1 + (i % 3) * 0.3), 0, (i - 3) * 0.13); bunchUp.add(b); });
    const giveB = buildBalloon(BALLOON_COLORS[1], 1.3);
    const holdArm = cu.arms?.[1], giveArm = cu.arms?.[0];
    if (holdArm) { bunch.position.set(0, -0.4, 0.05); holdArm.add(bunch); }
    if (giveArm) { giveB.position.set(0, -0.4, 0.05); giveArm.add(giveB); }
    const q = new THREE.Quaternion(), CYC = 9;
    let lastT = 0;
    anim.push((t) => {
      const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      const tc = t % CYC;
      const waddle = tc < 4, give = tc >= 4 && tc < 6.6;
      animateAvatar(clown, dt, waddle, t, false, null, 0);
      // 뒤뚱뒤뚱: 제자리에서 좌우로 기우뚱 + 통통
      clown.rotation.z = waddle ? Math.sin(t * 7) * 0.12 : 0; clown.position.y = waddle ? Math.abs(Math.sin(t * 7)) * 0.05 : 0;
      clown.position.x = 0; clown.position.z = 0;
      // 건네기: 풍선 든 팔을 앞으로 쭉 내밀고 살짝 인사, 돌아오면 손에 새 풍선
      let k = 0; if (give) { const f = (tc - 4) / 2.6; k = Math.sin(Math.PI * Math.min(1, f * 1.25)); }
      if (giveArm) { giveArm.rotation.set(-0.4 - k * 1.25, 0, -0.1); }
      clown.rotation.x = k * 0.12;
      giveB.visible = !(tc > 5.6 && tc < 6.9); // 건넨 뒤 잠깐 빈손
      if (holdArm) holdArm.rotation.set(-0.5 + (waddle ? Math.sin(t * 7) * 0.08 : 0), 0, Math.sign(holdArm.position.x || 1) * -0.1);
      // 줄은 늘 하늘로
      for (const [h, up, sw] of [[bunch, bunchUp, 0.08], [giveB, giveB.userData.up, 0.1]]) { h.updateWorldMatrix(true, false); h.getWorldQuaternion(q).invert(); up.quaternion.copy(q); up.rotation.x += Math.sin(t * 1.4) * sw; up.rotation.z += Math.sin(t * 1.9 + 1) * sw; }
    });
    const sign = textSprite('🎈 풍선 삐에로 · E 로 받기', { size: 26, bg: 'rgba(120,10,40,.88)', color: '#ffe9a8', border: '#ff8fd0' }); sign.position.set(x, 4.2, z); add(sign);
    colliders.push({ x, z, hw: 0.45, hd: 0.45, noSpread: true });
    inter.push({ id: 'balloon', kind: 'snack', x, z, r: 2.6, label: '풍선 삐에로', verb: '풍선 받기', noSpread: true });
  }

  // 🎢 자이로 드롭: 바깥을 보는 10자리 고리가 천천히 돌며 15m 까지 올라갔다가 한순간에 떨어진다 (실제 시계로 돌려서 모두에게 같게 보인다)
  const rides = {};
  {
    const ga = 0.196, gr = 30.5, x = Math.cos(ga) * gr, z = Math.sin(ga) * gr; // 광장 동쪽 들판 (동쪽 관문과 관람차 사이, 롤러코스터 안쪽)
    const g = add(new THREE.Group()); g.position.set(x, 0, z);
    const N = 10, RR = 2.55, TOP = 15, BOT = 0.75, CYC = 32;
    // 받침 · 기둥 · 꼭대기
    mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 40), pm('#2a2232'), 0, 0.15, 0, g);
    const baseRing = mesh(new THREE.TorusGeometry(3.62, 0.06, 6, 60), pm('#ff4fa8', { emissive: '#ff4fa8', emissiveIntensity: 1.4 }), 0, 0.31, 0, g); baseRing.rotation.x = Math.PI / 2; baseRing.castShadow = false;
    const tower = mesh(new THREE.CylinderGeometry(0.5, 0.62, 18.5, 20), new THREE.MeshStandardMaterial({ map: (() => { const t = stripeTex('#c8202a', '#f6f2e8', 2); t.rotation = Math.PI / 2; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 9); return t; })(), roughness: 0.5 }), 0, 9.25, 0, g);
    tower.userData.noOcc = true;
    mesh(new THREE.CylinderGeometry(1.0, 0.7, 0.8, 20), pm('#1e1a24', { metalness: 0.5 }), 0, 18.7, 0, g);
    const crown = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; crown.push(mesh(G('gyB', () => new THREE.SphereGeometry(0.11, 8, 6)), new THREE.MeshBasicMaterial({ color: i % 2 ? '#fff2a8' : '#ff6a8a' }), Math.cos(a) * 1.02, 18.9, Math.sin(a) * 1.02, g)); }
    // 기둥을 따라 켜지는 불빛 (고리가 지나가면 반짝)
    const strip = []; for (let i = 0; i < 26; i++) strip.push(mesh(G('gyS', () => new THREE.SphereGeometry(0.07, 6, 5)), new THREE.MeshBasicMaterial({ color: '#ffd36a' }), 0, 1 + i * 0.68, 0.6, g));
    // 고리 + 자리
    const ring = new THREE.Group(); g.add(ring);
    mesh(new THREE.TorusGeometry(RR - 0.25, 0.18, 10, 48), pm('#ffd36a', { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, ring).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 24), pm('#2a2232', { metalness: 0.5 }), 0, 0.1, 0, ring);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, sp = mesh(G('gySp', () => new THREE.BoxGeometry(1.45, 0.1, 0.12)), pm('#3a2a40'), Math.cos(a) * 1.55, 0.05, Math.sin(a) * 1.55, ring); sp.rotation.y = -a; }
    const SC = ['#ff3f6c', '#ffc75f', '#6fd6ff', '#b39dff', '#7ee0a8'];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, s = new THREE.Group(); s.position.set(Math.cos(a) * RR, 0, Math.sin(a) * RR); s.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); ring.add(s);
      mesh(G('gySeat', () => new THREE.BoxGeometry(0.62, 0.12, 0.55)), pm(SC[i % 5]), 0, -0.05, 0.05, s);
      mesh(G('gyBack', () => new THREE.BoxGeometry(0.62, 0.95, 0.12)), pm(SC[i % 5]), 0, 0.42, -0.25, s);
      const bar = mesh(G('gyBar', () => new THREE.TorusGeometry(0.26, 0.04, 6, 16, Math.PI)), pm('#f0eaff', { metalness: 0.6 }), 0, 0.62, -0.05, s); bar.rotation.set(0, Math.PI / 2, 0); // 어깨 안전바
    }
    const sign = textSprite('🎢 자이로 드롭 · E 로 타기 (위에서 뚝!)', { size: 26, bg: 'rgba(60,10,30,.88)', color: '#ffe08a', border: '#ff4fa8' }); sign.position.set(x, 3.6, z); add(sign);
    // 한 바퀴(32초)의 높이 · 회전: 0~6 탑승 · 6~18 천천히 올라감 · 18~21 꼭대기 · 21~22.35 자유낙하 · 22.35~24.5 브레이크 · 24.5~32 탑승
    const SPIN = 0.32, spinPer = SPIN * (21 - 6);
    const state = (now) => {
      const cyc = Math.floor(now / CYC), tc = now - cyc * CYC;
      let h = BOT, spin = cyc * spinPer, phase = 'board';
      if (tc < 6) {} else if (tc < 18) { const k = (tc - 6) / 12, e = k * k * (3 - 2 * k); h = BOT + (TOP - BOT) * e; phase = 'up'; }
      else if (tc < 21) { h = TOP; phase = 'top'; }
      else if (tc < 22.35) { const f = tc - 21; h = TOP - 6.5 * f * f; phase = 'drop'; }
      else if (tc < 24.5) { const f = (tc - 22.35) / 2.15, h0 = TOP - 6.5 * 1.35 * 1.35; h = h0 + (BOT - h0) * (1 - (1 - f) ** 3); phase = 'brake'; }
      if (tc >= 6) spin += SPIN * (Math.min(tc, 21) - 6);
      return { h, spin, phase, tc };
    };
    let cur = state(parkNow());
    anim.push((t) => {
      cur = state(parkNow());
      ring.position.y = cur.h; ring.rotation.y = -cur.spin;
      strip.forEach((b, i) => { const y = 1 + i * 0.68; b.visible = Math.abs(y - cur.h) < 1.4 || Math.sin(t * 6 + i * 0.6) > 0.2; });
      crown.forEach((b, i) => { b.visible = cur.phase === 'top' ? Math.sin(t * 16 + i) > 0 : true; });
      baseRing.material.emissiveIntensity = cur.phase === 'board' ? 1.4 + Math.sin(t * 5) * 0.5 : 0.6;
    });
    const wp = new THREE.Vector3();
    rides.gyro = {
      seats: N, sit: true, posFinal: true,
      exit: { x: x - Math.cos(ga) * 4.6, z: z - Math.sin(ga) * 4.6 },
      phase: () => cur.phase,
      pos: (i) => { const a = (i / N) * Math.PI * 2 + cur.spin; /* 고리를 -spin 만큼 돌렸으므로 실제 각도는 +spin */ wp.set(x + Math.cos(a) * (RR + 0.02), cur.h + 0.02, z + Math.sin(a) * (RR + 0.02)); return { x: wp.x, z: wp.z, y: wp.y, ry: Math.atan2(Math.cos(a), Math.sin(a)) }; },
    };
    // 자리 비우기: 가까이 있던 나무는 광장 둘레를 따라 옆으로 옮기고(부딪힘 상자도 같이), 받침 아래 풀·꽃은 치운다
    {
      const m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
      for (const o of root.children) {
        if (o === g || o.userData.noSpread) continue;
        if (o.isInstancedMesh) { let ch = false; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); if (Math.hypot(m4.elements[12] - x, m4.elements[14] - z) < 4.0) { o.setMatrixAt(i, zero); ch = true; } } if (ch) o.instanceMatrix.needsUpdate = true; continue; }
        const d0 = Math.hypot(o.position.x - x, o.position.z - z);
        if (o.isGroup && d0 < 6.5) {
          const ox = o.position.x, oz = o.position.z, r0 = Math.hypot(ox, oz), a0 = Math.atan2(oz, ox) + (Math.atan2(oz, ox) < ga ? -0.3 : 0.3);
          o.position.x = Math.cos(a0) * r0; o.position.z = Math.sin(a0) * r0;
          const c = colliders.find((c2) => Math.abs(c2.x - ox) < 0.01 && Math.abs(c2.z - oz) < 0.01); if (c) { c.x = o.position.x; c.z = o.position.z; }
        }
      }
    }
    colliders.push({ x, z, hw: 3.3, hd: 3.3, noSpread: true });
    inter.push({ id: 'gyro', kind: 'ride', x: x - Math.cos(ga) * 4.2, z: z - Math.sin(ga) * 4.2, r: 4.6, label: '자이로 드롭', verb: '타기', noSpread: true });
  }
  // 🌠 소원의 별: 광장 한가운데 떠 있는 커다란 금빛 별.
  // 광장 입구를 향해 떠 있다가 9초마다 수직축을 중심으로 한 바퀴 돌며 반짝이를 흩뿌린다.
  const clickables = []; let wishStar = null;
  {
    const x = 0, z = 0, BASE = 3.5, CYC = 9, SPIN0 = 6.0, SPIN = 2.2; // 별 가운데 높이 (아래 끝이 머리 위 2m 쯤)
    const g = add(new THREE.Group()); g.position.set(x, 0, z); // 앞면(+Z)이 광장 입구를 향한다
    const sh = new THREE.Shape(); const RO = 1.5, RI = 0.63;
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? RI : RO; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.13, bevelSegments: 5, curveSegments: 4 }); sg.center(); sg.computeVertexNormals();
    const starM = new THREE.MeshStandardMaterial({ color: '#ffbf2e', emissive: '#ff9a10', emissiveIntensity: 0.4, metalness: 0.7, roughness: 0.28 });
    const spin = new THREE.Group(); spin.position.y = BASE; g.add(spin);
    const star = new THREE.Mesh(sg, starM); star.castShadow = true; spin.add(star);
    // 별 속에서 번지는 빛 · 바닥까지 내려오는 은은한 빛기둥 · 바닥 빛 웅덩이
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd890', transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(7); spin.add(glow);
    const beamTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const q = c.getContext('2d'); const gr = q.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,225,150,0.32)'); gr.addColorStop(0.6, 'rgba(255,200,120,0.06)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); q.fillStyle = gr; q.fillRect(0, 0, 4, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.1, BASE, 32, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); beam.position.y = BASE / 2; beam.rotation.x = Math.PI; g.add(beam);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.8, 48), new THREE.MeshBasicMaterial({ map: glowTex, color: '#ffd890', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.04; g.add(pool);
    const light = new THREE.PointLight('#ffcf7a', matchMedia('(pointer: coarse)').matches ? 0 : 9, 13, 1.6); light.position.y = BASE; if (light.intensity) g.add(light);
    // 별 둘레를 천천히 도는 작은 반짝이
    const ON = 70, og = new THREE.BufferGeometry(), op = new Float32Array(ON * 3), oseed = [];
    for (let i = 0; i < ON; i++) oseed.push([Math.random() * 6.283, 1.8 + Math.random() * 1.3, (Math.random() - 0.5) * 2.6, 0.15 + Math.random() * 0.35]);
    og.setAttribute('position', new THREE.BufferAttribute(op, 3));
    const orbit = new THREE.Points(og, new THREE.PointsMaterial({ map: glowTex, color: '#fff2c4', size: 0.32, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); orbit.frustumCulled = false; g.add(orbit);
    // 회전할 때 흩뿌리는 반짝이 (재활용하는 스프라이트 묶음)
    const SPK = [], sparkM = ['#fff6d0', '#ffd34a', '#ffe6f6', '#cfe8ff'].map((c) => new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    for (let i = 0; i < 90; i++) { const s = new THREE.Sprite(sparkM[i % 4].clone()); s.visible = false; s.userData = { v: new THREE.Vector3(), life: 0 }; g.add(s); SPK.push(s); }
    let nextSpk = 0;
    const emit = (n) => { for (let k = 0; k < n; k++) { const s = SPK[nextSpk++ % SPK.length], a = Math.random() * 6.283, e = (Math.random() - 0.3) * 1.4, sp = 2.2 + Math.random() * 3.4; s.position.set(Math.cos(a) * 1.1, spin.position.y + Math.sin(a * 2) * 0.7, Math.sin(a) * 1.1); s.userData.v.set(Math.cos(a) * sp, e * sp * 0.6 + 1.2, Math.sin(a) * sp); s.userData.life = 1.3 + Math.random() * 0.9; s.userData.max = s.userData.life; s.userData.sz = 0.25 + Math.random() * 0.4; s.visible = true; } };
    let lastT = 0, boostUntil = 0, boostT = 0;
    const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
    anim.push((t) => {
      const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t; boostT = t;
      const boost = t < boostUntil ? Math.min(1, (boostUntil - t) / 1.5, 1) : 0;
      const tc = t % CYC, inSpin = tc >= SPIN0 && tc < SPIN0 + SPIN, k = inSpin ? (tc - SPIN0) / SPIN : 0;
      spin.position.y = BASE + Math.sin(t * 1.25) * 0.28 + (inSpin ? Math.sin(Math.PI * k) * 0.35 : 0);
      spin.rotation.y = easeIO(k) * Math.PI * 2;
      const sc = 1 + (inSpin ? Math.sin(Math.PI * k) * 0.07 : 0) + boost * 0.08; spin.scale.setScalar(sc);
      if (inSpin) emit((Math.random() < dt * 55 ? 2 : 0) + (Math.random() < dt * 40 ? 1 : 0));
      if (boost && Math.random() < dt * 20) emit(1);
      starM.emissiveIntensity = 0.4 + Math.sin(t * 2.2) * 0.08 + (inSpin ? Math.sin(Math.PI * k) * 0.45 : 0) + boost * 0.7;
      glow.material.opacity = 0.38 + Math.sin(t * 2.2) * 0.08 + (inSpin ? Math.sin(Math.PI * k) * 0.25 : 0) + boost * 0.35;
      if (light.intensity) light.intensity = 8 + Math.sin(t * 2.2) * 1.2 + boost * 8; light.position.y = spin.position.y;
      beam.material.opacity = 0.6 + Math.sin(t * 1.3) * 0.15; pool.material.opacity = 0.45 + Math.sin(t * 1.3) * 0.1 + boost * 0.3;
      for (let i = 0; i < ON; i++) { const [a0, r, h, s] = oseed[i], a = a0 + t * s; op[i * 3] = Math.cos(a) * r; op[i * 3 + 1] = spin.position.y + h + Math.sin(t * 1.7 + a0) * 0.15; op[i * 3 + 2] = Math.sin(a) * r; }
      og.attributes.position.needsUpdate = true; orbit.material.opacity = 0.55 + Math.sin(t * 3) * 0.2;
      for (const s of SPK) { if (!s.visible) continue; const u = s.userData; u.life -= dt; if (u.life <= 0) { s.visible = false; continue; } u.v.y -= 2.4 * dt; u.v.multiplyScalar(1 - dt * 0.9); s.position.addScaledVector(u.v, dt); const f = u.life / u.max; s.material.opacity = Math.min(1, f * 1.6) * (0.7 + 0.3 * Math.sin(t * 30 + u.sz * 50)); s.scale.setScalar(u.sz * (0.6 + f)); }
    });
    inter.push({ id: 'wishstar', kind: 'wish', x, z, r: 4.2, label: '소원의 별', verb: '소원빌기', noSpread: true });
    clickables.push({ id: 'wishstar', group: spin });
    // 별똥별이 떨어지는 동안 별이 더 밝게 빛나고 반짝이를 뿌린다
    wishStar = {
      x, z, y: () => spin.position.y,
      boost: (sec) => { boostUntil = boostT + sec; },
    };
  }
  // 🌭 핫도그 가게 · 🍭 솜사탕 가게 (광장 양옆) — 팝콘 · 커피처럼 E 로 받아서 N 으로 먹는다
  const snackStall = (x, z, o) => {
    const g = add(new THREE.Group()); g.position.set(x, 0, z); face(g, x, z);
    const base = pm(o.base), trim = pm(o.trim, { emissive: o.trim, emissiveIntensity: 0.25 });
    mesh(new THREE.BoxGeometry(2.6, 1.05, 1.3), base, 0, 0.53, 0, g); // 판매대
    mesh(new THREE.BoxGeometry(2.7, 0.08, 1.4), trim, 0, 1.09, 0, g);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), pm('#e8e0d0', { metalness: 0.4 }), s * 1.25, 1.9, -0.55, g);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), pm('#e8e0d0', { metalness: 0.4 }), s * 1.25, 1.9, 0.55, g);
    const aw = mesh(new THREE.BoxGeometry(2.9, 0.07, 1.7), new THREE.MeshStandardMaterial({ map: stripeTex(o.stripe[0], o.stripe[1], 12), roughness: 0.7 }), 0, 2.75, 0, g); aw.rotation.x = 0.12;
    for (let i = 0; i < 8; i++) { const fl = mesh(G('awF', () => new THREE.ConeGeometry(0.19, 0.22, 3)), G('awFm' + o.stripe[i % 2], () => pm(o.stripe[i % 2])), -1.26 + i * 0.36, 2.58, 0.86, g); fl.rotation.x = Math.PI; }
    for (let i = 0; i < 10; i++) mesh(G('bulbH', () => new THREE.SphereGeometry(0.055, 8, 6)), G('bmH' + (i % 2), () => new THREE.MeshBasicMaterial({ color: i % 2 ? '#fff2a8' : o.bulb })), -1.3 + i * 0.29, 2.66, 0.9, g);
    // 앞판 그림 (캔버스)
    const c = document.createElement('canvas'); c.width = 512; c.height = 192; const q = c.getContext('2d');
    q.fillStyle = o.panel; q.fillRect(0, 0, 512, 192); q.strokeStyle = o.trim; q.lineWidth = 12; q.strokeRect(8, 8, 496, 176);
    q.font = '96px sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(o.emoji, 90, 100); q.fillText(o.emoji, 422, 100);
    q.fillStyle = '#fff'; q.font = '900 56px sans-serif'; q.fillText(o.title, 256, 100);
    const pt = new THREE.CanvasTexture(c); pt.colorSpace = THREE.SRGBColorSpace;
    mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: pt }), 0, 0.55, 0.66, g).castShadow = false;
    // 판매대 위에 진열된 간식 · 지붕 위 커다란 간식 모형이 빙글빙글
    for (let i = 0; i < 4; i++) { const it = buildSnack(o.code + '3'); it.position.set(-0.75 + i * 0.5, 1.13, 0.25); it.rotation.y = i; g.add(it); }
    const big = buildSnack(o.code + '3'); big.scale.setScalar(o.bigScale); big.position.y = 2.85; g.add(big);
    const seller = createAvatar(o.seller); seller.position.set(0, 0, -0.95); g.add(seller);
    anim.push((t) => { big.rotation.y = t * 0.8; big.position.y = 2.85 + Math.sin(t * 2) * 0.08; animateAvatar(seller, 0.033, false, t, false, Math.sin(t * 0.55 + x) > 0.85 ? 'wave' : null, (t * 0.5) % 2); seller.rotation.y = Math.sin(t * 0.6 + x) * 0.25; });
    const sign = textSprite(`${o.emoji} ${o.label} · E 로 받기`, { size: 26, bg: o.signBg, color: '#fff6e0', border: o.trim }); sign.position.set(x, 4.6, z); add(sign);
    colliders.push({ x, z, hw: 1.4, hd: 1.4, noSpread: true });
    inter.push({ id: o.id, kind: 'snack', x: x + Math.sin(g.rotation.y) * 1.8, z: z + Math.cos(g.rotation.y) * 1.8, r: 2.4, label: o.label, verb: '받기', noSpread: true });
  };
  snackStall(HOTDOG_POS[0], HOTDOG_POS[1], { id: 'hotdog', code: 'h', label: '바삭 핫도그', title: 'HOT DOG', emoji: '🌭', base: '#c8302a', trim: '#ffd23a', stripe: ['#e8202a', '#ffd23a'], bulb: '#ff8a3a', panel: '#9a1a16', signBg: 'rgba(140,20,16,.9)', bigScale: 5.5, seller: { body: '#ffe0c8', accent: '#e8202a', ears: 'bear', hat: 'none', eyes: 'smile', mouth: 'grin', hair: 'short', hairColor: '#3a2416', outfit: 'chef' } });
  snackStall(CANDY_POS[0], CANDY_POS[1], { id: 'cottoncandy', code: 's', label: '구름 솜사탕', title: '솜사탕', emoji: '🍭', base: '#ff8fc8', trim: '#8fd4ff', stripe: ['#ffb3d6', '#ffffff'], bulb: '#8fd4ff', panel: '#d0508e', signBg: 'rgba(170,50,120,.9)', bigScale: 4.2, seller: { body: '#fff0e0', accent: '#ff8fc8', ears: 'bunny', hat: 'none', eyes: 'smile', mouth: 'smile', hair: 'twintail', hairColor: '#ff9ad0', outfit: 'princess' } });

  // 🎁 크리스마스 선물상자: 소원의 별 바로 앞 · 한 번 받으면 그 사람 화면에서만 사라진다
  let xmasGift = null;
  {
    const x = 0, z = 2.7, g = add(new THREE.Group()); g.position.set(x, 0, z);
    const box = new THREE.Group(); g.add(box);
    const red = pm('#d8202a', { emissive: '#5a0008', emissiveIntensity: 0.35, roughness: 0.55 }), gold = pm('#ffd23a', { metalness: 0.5, roughness: 0.3, emissive: '#a07000', emissiveIntensity: 0.5 });
    mesh(new THREE.BoxGeometry(0.62, 0.5, 0.62), red, 0, 0.25, 0, box);
    mesh(new THREE.BoxGeometry(0.7, 0.14, 0.7), red, 0, 0.55, 0, box); // 뚜껑
    wrapGift((x, y, z, w, h, d) => mesh(new THREE.BoxGeometry(w, h, d), gold, x, y, z, box), {
      width: .62, depth: .62, bottom: 0, lidBottom: .48, top: .62, lidWidth: .70, lidDepth: .70, ribbonWidth: .12,
    });
    for (const s of [-1, 1]) { const loop = mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), gold, s * 0.11, 0.7, 0, box); loop.scale.set(1, 0.75, 0.55); loop.rotation.z = s * 0.5; }
    mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, 0.66, 0, box);
    const glowS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe08a', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); glowS.scale.setScalar(1.8); glowS.position.y = 0.4; g.add(glowS);
    const tag = textSprite('🎁 크리스마스 선물', { size: 22, bg: 'rgba(150,16,24,.9)', color: '#fff3c4', border: '#ffd23a' }); tag.position.set(0, 1.25, 0); tag.scale.multiplyScalar(0.7); g.add(tag);
    anim.push((t) => { if (!g.visible) return; box.position.y = Math.abs(Math.sin(t * 2.4)) * 0.06; box.rotation.y = Math.sin(t * 0.9) * 0.3; glowS.material.opacity = 0.45 + Math.sin(t * 3) * 0.15; tag.position.y = 1.25 + Math.sin(t * 2) * 0.05; });
    inter.push({ id: 'xmasgift', kind: 'gift', x, z, r: 1.5, label: '크리스마스 선물상자', verb: '선물받기', noSpread: true });
    clickables.push({ id: 'xmasgift', group: box });
    xmasGift = { x, y: 0.4, z, group: g, hide: () => { g.visible = false; }, show: () => { g.visible = true; } };
  }
  return { interactives: inter, rides, clickables, wishStar, xmasGift, update: (t) => anim.forEach((f) => f(t)) };
}

function buildChristmasTree(root, colliders) {
  const CENTER = { x: 10.5, z: -7.6 };
  const tree = new THREE.Group();
  tree.name = '광장 크리스마스 트리';
  tree.position.set(CENTER.x, 0, CENTER.z);
  root.add(tree);
  colliders.push({ ...CENTER, hw: 2.82, hd: 2.82, noSpread: true });

  const fill = new THREE.PointLight('#ffe0aa', 44, 16, 2);
  fill.position.set(0, 2.9, 2.65);
  const uplight = new THREE.PointLight('#ffb878', 32, 13, 2);
  uplight.position.set(-2.7, .5, -1.7);
  tree.add(fill, uplight);
  let modelLights = [];
  const asset = new URL('../models/christmas-tree.glb', import.meta.url);
  new GLTFLoader().load(asset.href, ({ scene: model }) => {
    if (root.userData.disposed) {
      disposeObject(model);
      return;
    }
    model.scale.setScalar(1.095);
    model.rotation.y = -.14;
    const lights = [];
    model.traverse(node => {
      node.userData.noOcc = true;
      if (!node.isMesh) return;
      for (const material of [].concat(node.material)) {
        if (material.name === 'Warm micro lights' || material.name.startsWith('Star')) {
          material.emissive.set('#ffce78');
          material.emissiveIntensity = 3.5;
          lights.push(material);
          continue;
        }
        if (material.name.startsWith('Noble fir')) {
          material.emissive.set('#2a4c26');
          material.emissiveIntensity = .48;
        }
        if (material.metalness > .35 && material.emissiveIntensity <= 1) {
          material.emissive.copy(material.color);
          material.emissiveIntensity = .27;
        }
      }
    });
    tree.add(model);
    modelLights = [...new Set(lights)];
  }, undefined, (error) => {
    if (root.parent) console.warn('크리스마스 트리 모델 로딩 실패:', error);
  });

  return t => {
    for (const material of modelLights) material.emissiveIntensity = 3.5 + Math.sin(t * 1.45) * .35;
  };
}


// 만들어 둔 로비를 다시 붙인다 (챕터에서 돌아올 때 새로 짓지 않도록). 배경과 안개도 로비 것으로 되돌린다
export function attachLobby(scene, w) {
  setPropTheme('lobby');
  scene.add(w.root);
  scene.background = w.background;
  scene.fog = w.fog;
  return w;
}
export function buildLobby(scene, opts = {}) {
  setPropTheme('lobby');
  const root = new THREE.Group();
  root.userData.reusableLobby = true;
  const colliders = [];
  // 핏빛 달이 뜬 한밤의 폐놀이공원
  scene.background = new THREE.Color('#05050b');
  scene.fog = new THREE.Fog('#0a0a14', 42, 170);
  root.add(skyDome('#020208', '#1a1222', 700, 'red'));
  // 구름: 하얀 구슬 덩어리들이 하늘을 천천히 돈다
  const clouds = new THREE.Group(); root.add(clouds);
  const cMat = new THREE.MeshBasicMaterial({ color: '#1c1822', fog: false, transparent: true, opacity: 0.85 });
  const cMat2 = new THREE.MeshBasicMaterial({ color: '#2a1a24', fog: false, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 16; i++) {
    const c = new THREE.Group(); const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3, r = 42 + Math.random() * 30;
    c.position.set(Math.cos(a) * r, 76 + Math.random() * 16, Math.sin(a) * r);
    const n = 4 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(2.2 + Math.random() * 1.8, 14, 10), k % 3 === 2 ? cMat2 : cMat); b.position.set((k - n / 2) * 2.4 + Math.random(), Math.random() * 1.2, Math.random() * 2); b.scale.y = 0.6; c.add(b); }
    c.userData.ph = Math.random() * 6; clouds.add(c);
  }

  const hemi = new THREE.HemisphereLight('#9aa0d4', '#3a2a2c', 1.95); root.add(hemi);
  const sun = new THREE.DirectionalLight('#d0a8b4', 1.45); sun.position.set(-30, 42, -60); // 붉은 달빛
  root.add(sun);

  const FL = lobbyFloor(opts.floor);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(46, 72), new THREE.MeshStandardMaterial({ roughness: 1, ...FL.ground }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData.spreadScale = true; root.add(ground);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(16.5, 56), new THREE.MeshStandardMaterial({ roughness: 1, ...FL.plaza }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01; plaza.receiveShadow = true; plaza.userData.spreadScale = true; root.add(plaza);

  const add = (p) => { const g = place(root, p); const f = footOf(p, g); if (f) colliders.push(f); return g; };
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.09, tx = Math.cos(a) * 19.5, tz = Math.sin(a) * 19.5;
    if (onOuterPath(tx * LS, tz * LS, 0.75)) continue;
    if (Math.hypot(tx - PARK.wheel.x, tz - PARK.wheel.z) < 3.4) continue; // 관람차 자리의 나무는 심지 않는다
    add({ t: i % 3 ? 'pine' : 'tree', x: tx, z: tz, color: ['#c9a8ff', '#ffb7c9', '#9ad0ff'][i % 3] });
  }
  const outer = buildOuterPark(root, colliders, add, FL.path);
  buildLobbyHorror(root, colliders);
  add({ t: 'bench', x: -6, z: 7, r: 30 }); add({ t: 'bench', x: 6, z: 7, r: -30 });
  for (const s of [-1, 1]) { add({ t: 'lamp', x: 13 * s, z: 4.5, noLight: true }); add({ t: 'lamp', x: 6.5 * s, z: 16, noLight: true }); }
  const park = buildPark(root, colliders, add);
  add({ t: 'lantern_string', x: 0, z: 9, len: 14 });

  const themes = placeThemes(LOBBY_THEMES.filter((th) => !th.hidden || opts.hidden).map((th) => ({ ...th })));
  themes.push({ id: 'christmas', x: -8, z: -4.4, color: '#ffe0a0', glow: '#36172a', label: '🎄 크리스마스 특별판' });
  const exhibits = themes.map((th) => buildExhibit(root, colliders, th));
  const extra = buildLobbyExtras(root, colliders, add);
  const snapBoard = buildSnapBoard(root, colliders, opts.renderer);
  const tip = textSprite('🚪 테마 관문을 클릭하면 바로 시작! · 🎠 놀이기구도 탈 수 있어요', { size: 26, bg: 'rgba(0,0,0,.55)', maxW: 700 });
  tip.position.set(0, 7.9, 9); root.add(tip);

  // ── 소원의 별 위에 주간랭킹 상위 3명을 표시한다
  const champSign = (() => {
    const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 256;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    const W0 = 11.5; sp.position.set(0, 6.3, 0); sp.scale.set(W0, W0 / 8, 1); sp.visible = false; sp.userData.noOcc = true; sp.renderOrder = 3; root.add(sp);
    let cur = null;
    const FIX = '"Do Hyeon", "Gowun Dodum", sans-serif', NAME = '"Gowun Dodum", sans-serif';
    const draw = () => {
      const x = cv.getContext('2d'), W = cv.width, H = cv.height; x.clearRect(0, 0, W, H);
      if (!cur?.name) { tex.needsUpdate = true; return; }
      const colors = ['#ffd24a', '#e6e8f3', '#efbe91'];
      const parts = [[cur.last ? '🏆 지난주 ' : '🏆 이번 주 ', FIX, '#fff4d6']];
      cur.names.forEach((name, i) => {
        parts.push([`${i ? '   ·   ' : ''}${i + 1}위 `, FIX, '#fff4d6'], [name, NAME, colors[i]]);
      });
      let size = 132; const widthAt = (px) => parts.reduce((a, [t, f]) => { x.font = `${px}px ${f}`; return a + x.measureText(t).width; }, 0);
      let tw = widthAt(size); if (tw > W - 150) { size = Math.floor(size * (W - 150) / tw); tw = widthAt(size); }
      // 어두운 반투명 띠 + 황금 테두리
      const pw = Math.min(W - 8, tw + 130), ph = Math.min(H - 12, size + 78), px0 = (W - pw) / 2, py0 = (H - ph) / 2, r = ph / 2;
      x.beginPath(); x.moveTo(px0 + r, py0); x.arcTo(px0 + pw, py0, px0 + pw, py0 + ph, r); x.arcTo(px0 + pw, py0 + ph, px0, py0 + ph, r); x.arcTo(px0, py0 + ph, px0, py0, r); x.arcTo(px0, py0, px0 + pw, py0, r); x.closePath();
      x.fillStyle = 'rgba(18,8,14,.72)'; x.fill(); x.lineWidth = 6; x.strokeStyle = 'rgba(255,201,64,.9)'; x.stroke();
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.lineJoin = 'round';
      let cx = (W - tw) / 2; const cy = H / 2 + size * 0.04;
      for (const [t, f, col] of parts) {
        x.font = `${size}px ${f}`;
        x.lineWidth = Math.max(6, size * 0.09); x.strokeStyle = 'rgba(20,6,0,.95)'; x.strokeText(t, cx, cy);
        if (col === '#ffd24a') { x.shadowColor = 'rgba(255,190,40,.9)'; x.shadowBlur = 26; }
        x.fillStyle = col; x.fillText(t, cx, cy); x.shadowBlur = 0;
        cx += x.measureText(t).width;
      }
      tex.needsUpdate = true;
    };
    return {
      set(c) {
        const names = c?.names?.length ? c.names.slice(0, 3) : c?.name ? [c.name] : [];
        const key = names.length ? JSON.stringify([c.week, c.last, names]) : '';
        if (key === (cur?.key || '') && sp.visible === !!key) return;
        cur = names.length ? { ...c, name: names[0], names, key } : null;
        sp.visible = !!cur; draw();
        if (cur && document.fonts?.load) Promise.all([document.fonts.load(`100px ${FIX.split(',')[0]}`, '지난주 이번 주 1위 2위 3위'), document.fonts.load(`100px ${NAME.split(',')[0]}`, names.join(' '))]).then(() => { if (sp.parent) draw(); }).catch(() => {});
      },
      update(t, starY) { if (!sp.visible) return; sp.position.y = starY + 2.8; const k = 1 + Math.sin(t * 2.3) * 0.012; sp.scale.set(W0 * k, (W0 / 8) * k, 1); },
    };
  })();
  champSign.set(opts.champ || null);

  // ── 상사화: 광장을 빙 둘러 붉은 꽃밭 (꽃잎이 뒤로 말린 붉은 꽃 + 긴 수술)
  {
    const spots = [];
    const ok = (x, z) => Math.hypot(x, z + 20.8) > 6 && Math.hypot(x, z) < 28.2 && !onOuterPath(x * LS, z * LS, 0.45);
    // 광장 가장자리 띠 + 바깥 숲 사이 군락
    for (let i = 0; i < 520; i++) { const a = Math.random() * Math.PI * 2, r = 16.8 + Math.random() * 2.2; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (ok(x, z)) spots.push([x, z]); }
    for (let c = 0; c < 34; c++) { const a = Math.random() * Math.PI * 2, r = 20.5 + Math.random() * 6.5; const cx = Math.cos(a) * r, cz = Math.sin(a) * r; for (let i = 0; i < 26; i++) { const x = cx + (Math.random() - 0.5) * 3.2, z = cz + (Math.random() - 0.5) * 3.2; if (ok(x, z)) spots.push([x, z]); } }
    const n = spots.length, P = 6;
    const stemM = new THREE.MeshStandardMaterial({ color: '#3f7a3a', roughness: 0.9 });
    const petalM = new THREE.MeshStandardMaterial({ color: '#d4141e', roughness: 0.55, emissive: '#5a0006', emissiveIntensity: 0.7 });
    const stamenM = new THREE.MeshStandardMaterial({ color: '#ff3a3a', roughness: 0.5, emissive: '#6a0a0a', emissiveIntensity: 0.6 });
    const stemG = new THREE.CylinderGeometry(0.012, 0.016, 1, 5); stemG.translate(0, 0.5, 0);
    const petalG = new THREE.CapsuleGeometry(0.018, 0.17, 3, 6); petalG.translate(0, 0.1, 0);
    const stamenG = new THREE.CylinderGeometry(0.004, 0.004, 0.26, 3); stamenG.translate(0, 0.13, 0);
    const stems = new THREE.InstancedMesh(stemG, stemM, n), petals = new THREE.InstancedMesh(petalG, petalM, n * P), stamens = new THREE.InstancedMesh(stamenG, stamenM, n * P);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
    spots.forEach(([x, z], i) => {
      const h = 0.35 + Math.random() * 0.3, tilt = (Math.random() - 0.5) * 0.25;
      e.set(tilt, 0, (Math.random() - 0.5) * 0.25); q.setFromEuler(e); m.compose(v.set(x, 0, z), q, s.set(1, h, 1)); stems.setMatrixAt(i, m);
      const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(new THREE.Vector3(x, 0, z)); const yaw = Math.random() * 6.28;
      for (let k = 0; k < P; k++) {
        const a = yaw + (k / P) * Math.PI * 2;
        e.set(1.15 + Math.random() * 0.25, a, 0, 'YXZ'); q.setFromEuler(e); m.compose(top, q, s.set(1, 1, 1)); petals.setMatrixAt(i * P + k, m); // 꽃잎은 옆으로 뻗었다가 뒤로 말린다
        e.set(0.55 + Math.random() * 0.2, a + 0.4, 0, 'YXZ'); q.setFromEuler(e); m.compose(top, q, s.set(1, 1, 1)); stamens.setMatrixAt(i * P + k, m); // 길게 위로 휘어 오르는 수술
      }
    });
    for (const im of [stems, petals, stamens]) { im.instanceMatrix.needsUpdate = true; im.userData.noOcc = true; root.add(im); }
  }

  // ── 반딧불이: 노란 연둣빛이 깜빡이며 이리저리 날아다닌다
  const fireflies = (() => {
    const N = 260, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), f = [];
    for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 24; f.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0.4 + Math.random() * 2.6, ax: 0.6 + Math.random() * 1.4, ay: 0.2 + Math.random() * 0.5, sp: 0.15 + Math.random() * 0.35, ph: Math.random() * 6.28, bl: 0.6 + Math.random() * 1.6 }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.25, 'rgba(220,255,120,.8)'); gr.addColorStop(1, 'rgba(160,255,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.38, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false; pts.userData.noOcc = true; root.add(pts);
    return {
      update(t) {
        for (let i = 0; i < N; i++) {
          const p = f[i], w = t * p.sp + p.ph;
          pos[i * 3] = p.x + Math.sin(w) * p.ax * 2 + Math.sin(w * 2.3) * 0.4; pos[i * 3 + 1] = p.y + Math.sin(w * 1.7) * p.ay; pos[i * 3 + 2] = p.z + Math.cos(w * 0.8) * p.ax * 2;
          const b = Math.max(0, Math.sin(t * p.bl + p.ph * 3)) ** 3; col[i * 3] = 0.85 * b + 0.05; col[i * 3 + 1] = 1.0 * b + 0.08; col[i * 3 + 2] = 0.35 * b;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      },
    };
  })();

  // 떠다니는 영혼불
  const fGeo = new THREE.BufferGeometry(); const n = 140; const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 64; pos[i * 3 + 1] = 0.5 + Math.random() * 5; pos[i * 3 + 2] = (Math.random() - 0.5) * 64; }
  fGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const flies = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: '#cfe0ff', size: 0.12, transparent: true, opacity: 0.8 }));
  root.add(flies);
  {
    const n = 1800; const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.32, 4), new THREE.MeshStandardMaterial({ color: '#3f6a40', roughness: 1 }), n);
    const m4 = new THREE.Matrix4();
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = 17 + Math.random() * 27; m4.makeRotationZ((Math.random() - 0.5) * 0.5); const x = Math.cos(a) * r, z = Math.sin(a) * r; m4.setPosition(x, onOuterPath(x * LS, z * LS) ? -1 : 0.15, z); grass.setMatrixAt(k, m4); }
    root.add(grass);
  }
  colliders.push(...ringColliders(30.5 * LS).filter(c => c.z > -38).map((c) => ({ ...c, noSpread: true })));
  spreadLobby(root, colliders, [...park.interactives, ...outer.interactives, ...extra.interactives], { ...park.rides, ...extra.rides });
  { const f0 = extra.shopFace; extra.shopFace = (x, z) => f0(x / LS, z / LS); }
  const deco = buildLobbyDeco(root, colliders, themes);
  const updateChristmasTree = buildChristmasTree(root, colliders);
  const mountain = buildLobbyMountain(); root.add(mountain.root);
  const mountainSign = textSprite('귀문산 등산로 · 중턱 테마 터 10곳', {size:38,color:'#f2dfae',bg:'rgba(12,20,17,.86)'});
  mountainSign.position.set(0,2.2,-40); mountainSign.scale.set(8,1,1); root.add(mountainSign);
  scene.add(root);
  let lastT = 0;
  const update = (t) => {
    snapBoard.update(Math.min(0.1, Math.max(0, t - lastT))); lastT = t;
    park.update(t); outer.update(t); deco.update(t); updateChristmasTree(t); champSign.update(t, deco.wishStar.y()); fireflies.update(t); extra.update(t);
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
  return { root, colliders, walls: [], objects: {}, flickers: [], ceiling: [], update, mountain, bounds: 28.5 * LS, outdoor: true, background: scene.background, fog: scene.fog, themes, exhibits, hiddenGate: !!opts.hidden, setChamp: (c) => champSign.set(c), snapBoard, shopFace: extra.shopFace, clickables: [...extra.clickables, ...deco.clickables], wishStar: deco.wishStar, xmasGift: deco.xmasGift, interactives: [...park.interactives, ...outer.interactives, ...extra.interactives, ...deco.interactives], rides: { ...park.rides, ...extra.rides, ...deco.rides } };
}

// ───── 로비 쉼터: 불멍 캠프파이어 + 통나무 벤치 · 타면 움직이는 그네 · 코인 상점
function flameTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 96, 2, 32, 80, 60); g.addColorStop(0, 'rgba(255,250,210,1)'); g.addColorStop(0.25, 'rgba(255,200,80,.95)'); g.addColorStop(0.6, 'rgba(255,90,20,.6)'); g.addColorStop(1, 'rgba(120,10,0,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(32, 2); x.bezierCurveTo(60, 50, 62, 90, 32, 126); x.bezierCurveTo(2, 90, 4, 50, 32, 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildLobbyExtras(root, colliders, add) {
  const anim = [], interactives = [], rides = {}; let shopFace = () => {};
  const coarse = matchMedia('(pointer: coarse)').matches;
  // ── 캠프파이어 (광장 서쪽) — 일렁이는 불꽃 · 불티 · 따뜻한 빛
  {
    const cx = -7.6, cz = 3.4; const g = new THREE.Group(); g.position.set(cx, 0, cz); root.add(g);
    const stoneM = pm('#7a726a', { roughness: 0.95 });
    for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; const st = mesh(new THREE.DodecahedronGeometry(0.17 + (i % 3) * 0.03), stoneM, Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62, g); st.scale.y = 0.7; }
    const logM = pm('#5a3418', { roughness: 0.9 }), charM = pm('#1a0e08', { emissive: '#ff4a10', emissiveIntensity: 0.6 });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const l = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 8), i % 2 ? logM : charM, Math.cos(a) * 0.18, 0.3, Math.sin(a) * 0.18, g); l.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); }
    const embers = mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#ff6a20', transparent: true, opacity: 0.85 }), 0, 0.05, 0, g); embers.rotation.x = -Math.PI / 2;
    const ft = flameTex(); const flames = [];
    for (let i = 0; i < 7; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: i < 2 ? '#fff2c8' : '#ffb060', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = (i / 7) * Math.PI * 2; sp.position.set(i < 2 ? 0 : Math.cos(a) * 0.16, 0.55, i < 2 ? 0 : Math.sin(a) * 0.16); sp.userData.ph = Math.random() * 6; sp.userData.h = i < 2 ? 1.25 : 0.8 + Math.random() * 0.3; g.add(sp); flames.push(sp);
    }
    const NS = 40, sg = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3), seed = [];
    for (let i = 0; i < NS; i++) seed.push([Math.random(), Math.random() * 6, 0.5 + Math.random() * 0.8]);
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffb050', size: 0.07, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })); sparks.frustumCulled = false; g.add(sparks);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.03; g.add(glow);
    const light = new THREE.PointLight('#ff9a4a', coarse ? 0 : 14, 9, 1.6); light.position.y = 1.1; if (!coarse) g.add(light);
    colliders.push({ x: cx, z: cz, hw: 0.75, hd: 0.75 });
    anim.push((t) => {
      flames.forEach((f) => { const k = 0.85 + Math.sin(t * 9 + f.userData.ph) * 0.12 + Math.sin(t * 23 + f.userData.ph * 2) * 0.06; f.scale.set(0.55 * k, f.userData.h * k, 1); f.position.y = 0.2 + (f.userData.h * k) / 2; f.material.rotation = Math.sin(t * 3 + f.userData.ph) * 0.12; });
      for (let i = 0; i < NS; i++) { const [r, ph, sp2] = seed[i]; const k = ((t * sp2 * 0.5 + r) % 1); sp[i * 3] = Math.sin(ph + t * 0.8) * 0.25 * (1 + k); sp[i * 3 + 1] = 0.4 + k * 2.6; sp[i * 3 + 2] = Math.cos(ph + t * 0.7) * 0.25 * (1 + k); }
      sg.attributes.position.needsUpdate = true; sparks.material.opacity = 0.9;
      light.intensity = 12 + Math.sin(t * 13) * 2 + Math.sin(t * 31) * 1.2;
      embers.material.opacity = 0.75 + Math.sin(t * 5) * 0.12; glow.material.opacity = 0.14 + Math.sin(t * 7) * 0.03;
    });
    const sign = textSprite('🔥 불멍 캠프파이어 · 통나무에 앉아 쉬어 가요', { size: 24, bg: 'rgba(40,16,6,.8)', color: '#ffd8a0', border: '#ff9a4a', maxW: 600 }); sign.position.set(cx, 3.1, cz); root.add(sign);
    // 통나무 벤치 4개 (각 2자리) — 앉으면 불을 바라본다
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4; const lx = cx + Math.cos(a) * 2.05, lz = cz + Math.sin(a) * 2.05;
      const lg = new THREE.Group(); lg.position.set(lx, 0, lz); lg.rotation.y = -a; root.add(lg);
      const log = mesh(new THREE.CylinderGeometry(0.24, 0.26, 1.7, 14), logM, 0, 0.24, 0, lg); log.rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) { const ring = mesh(new THREE.CircleGeometry(0.235, 14), pm('#c89a62'), 0, 0.24, s * 0.851, lg); ring.rotation.y = s > 0 ? 0 : Math.PI; }
      const top = mesh(new THREE.BoxGeometry(0.3, 0.04, 1.6), pm('#7a4a28'), 0, 0.47, 0, lg); top.castShadow = false;
      colliders.push({ x: lx, z: lz, hw: 0.55, hd: 0.55 });
      const face = Math.atan2(cx - lx, cz - lz); // 불 쪽을 바라보기
      // 로비를 넓히면(spreadLobby) 통나무 가운데만 LS 배로 옮겨지고 통나무 크기는 그대로다.
      // 그래서 자리는 넓힌 뒤의 통나무 가운데에서 통나무 길이 방향으로 ±0.45m 에 직접 놓는다 (같이 넓히면 두 자리가 통나무 양 끝으로 벌어진다)
      const fx = lx * LS, fz = lz * LS;
      for (const s of [-1, 1]) {
        const ox = -Math.sin(a) * 0.45 * s, oz = Math.cos(a) * 0.45 * s; // 통나무 길이 방향
        interactives.push({ id: `log${k}${s > 0 ? 'b' : 'a'}`, kind: 'sit', x: fx + ox, z: fz + oz, r: 1.1, label: '통나무 벤치', verb: '앉아서 불멍', noSpread: true, seat: { x: fx + ox, z: fz + oz, y: 0.43, ry: face } });
      }
    }
  }
  // ── 그네 (캠프파이어 서쪽) — 가만히 있다가 누가 타면 흔들리고, 내리면 다시 멈춘다
  {
    const cx = -11.5, cz = 4, ry = Math.atan2(-cx, -cz); // 광장 가운데를 바라보게
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; root.add(g);
    const frameM = pm('#c0392b', { metalness: 0.4, roughness: 0.5 }), H = 2.5, L = 1.95;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = mesh(new THREE.CylinderGeometry(0.05, 0.06, H / Math.cos(0.32), 10), frameM, sx * 1.55, H / 2, sz * 0.4, g); leg.rotation.x = -sz * 0.32; }
    const bar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.3, 12), frameM, 0, H, 0, g); bar.rotation.z = Math.PI / 2;
    const seats = [], amp = [0, 0], ang = [0, 0]; const SEATC = ['#ffd23a', '#7ee0a8'];
    for (let i = 0; i < 2; i++) {
      const piv = new THREE.Group(); piv.position.set(i ? 0.75 : -0.75, H, 0); g.add(piv);
      for (const s of [-1, 1]) { const ch = mesh(new THREE.CylinderGeometry(0.012, 0.012, L, 5), pm('#d8d8e0', { metalness: 0.8, roughness: 0.3 }), s * 0.24, -L / 2, 0, piv); ch.castShadow = false; }
      mesh(new THREE.BoxGeometry(0.6, 0.06, 0.28), pm(SEATC[i], { emissive: SEATC[i], emissiveIntensity: 0.15 }), 0, -L, 0, piv);
      seats.push(piv);
    }
    for (const sx of [-1, 1]) colliders.push({ x: cx + Math.cos(ry) * 1.55 * sx, z: cz - Math.sin(ry) * 1.55 * sx, hw: 0.45, hd: 0.45 }); // 양쪽 다리만 막는다
    let busy = new Set(); let last = 0;
    anim.push((t) => {
      const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
      for (let i = 0; i < 2; i++) { const target = busy.has(i) ? 0.62 : 0; amp[i] += (target - amp[i]) * Math.min(1, dt * (target ? 0.8 : 1.4)); ang[i] = amp[i] * Math.sin(t * 2.1 + i * 1.3); seats[i].rotation.x = ang[i]; }
    });
    const wpos = new THREE.Vector3();
    rides.swing = { posFinal: true, seats: 2, sit: true, setBusy: (b) => { busy = b; },
      exit: { x: cx + Math.sin(ry) * 1.6, z: cz + Math.cos(ry) * 1.6 },
      pos: (i) => { const a = ang[i]; wpos.set(i ? 0.75 : -0.75, H - Math.cos(a) * (L - 0.04), -Math.sin(a) * L - 0.06); g.localToWorld(wpos.copy(wpos)); return { x: wpos.x, z: wpos.z, y: wpos.y - 0.02, ry }; } };
    interactives.push({ id: 'swing', kind: 'ride', x: cx + Math.sin(ry) * 0.6, z: cz + Math.cos(ry) * 0.6, r: 2.2, label: '그네', verb: '타기' });
    const sign = textSprite('🪢 그네 · 타면 흔들려요', { size: 22, bg: 'rgba(10,6,14,.75)', color: '#ffe9a8' }); sign.position.set(cx, 3.3, cz); root.add(sign);
  }
  // ── 코인 상점 (광장 동쪽) — '미아 상회': 줄무늬 천막 아래 마법 상점, 콧수염 상인이 손님을 맞는다
  {
    const cx = 7.6, cz = 3.4; const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = Math.atan2(-cx, 5 - cz); root.add(g);
    // 상점(둥근 데크)이 다가오는 내 캐릭터 쪽으로 천천히 돌아선다
    const yaw0 = g.rotation.y; let yawWant = yaw0;
    shopFace = (px, pz) => { const dx = px - cx, dz = pz - cz; yawWant = Math.hypot(dx, dz) < 14 ? Math.atan2(dx, dz) : yaw0; };
    const wood = pm('#7a4a2a', { roughness: 0.7 }), woodD = pm('#4a2a16', { roughness: 0.8 }), gold = pm('#e8c060', { metalness: 0.85, roughness: 0.25, emissive: '#6a4a10', emissiveIntensity: 0.35 });
    const plum = pm('#4a1a5a', { roughness: 0.6 }), velvet = pm('#7a1a3a', { roughness: 0.9 });
    // 바닥 데크 + 금색 테두리 + 빛 고리
    mesh(new THREE.CylinderGeometry(2.05, 2.15, 0.16, 40), woodD, 0, 0.08, 0, g);
    mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.02, 40), pm('#8a5a34'), 0, 0.17, 0, g);
    const trim = mesh(new THREE.TorusGeometry(2.08, 0.035, 8, 64), gold, 0, 0.16, 0, g); trim.rotation.x = Math.PI / 2;
    const carpet = mesh(new THREE.CircleGeometry(1.2, 32), velvet, 0, 0.185, 0.2, g); carpet.rotation.x = -Math.PI / 2; carpet.receiveShadow = true;
    // 기둥 4개 (나선 금띠)
    const posts = [[-1.55, 0.95], [1.55, 0.95], [-1.55, -1.1], [1.55, -1.1]];
    for (const [x, z] of posts) {
      mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 12), plum, x, 1.48, z, g);
      for (let k = 0; k < 6; k++) { const r = mesh(new THREE.TorusGeometry(0.085, 0.015, 6, 16), gold, x, 0.4 + k * 0.42, z, g); r.rotation.x = Math.PI / 2; }
      mesh(new THREE.SphereGeometry(0.11, 14, 10), gold, x, 2.82, z, g);
    }
    // 뾰족 천막 지붕 (보라·금 줄무늬) + 물결 장식 + 꼭대기 별
    const roofM = new THREE.MeshStandardMaterial({ map: stripeTex('#5a1a7a', '#f2d070', 16), roughness: 0.6, side: THREE.DoubleSide });
    const roof = mesh(new THREE.ConeGeometry(2.45, 1.3, 16, 1, true), roofM, 0, 3.5, -0.08, g); roof.castShadow = true;
    const scal = new THREE.CircleGeometry(0.16, 12, 0, Math.PI);
    for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; const sc = mesh(scal, new THREE.MeshStandardMaterial({ color: i % 2 ? '#f2d070' : '#5a1a7a', side: THREE.DoubleSide, roughness: 0.6 }), Math.sin(a) * 2.42, 2.86, Math.cos(a) * 2.42 - 0.08, g); sc.rotation.set(Math.PI, a, 0); sc.castShadow = false; }
    const star = mesh(new THREE.OctahedronGeometry(0.2), pm('#ffe58a', { emissive: '#ffcc33', emissiveIntensity: 1.6, metalness: 0.4 }), 0, 4.32, -0.08, g);
    const starGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    starGlow.scale.setScalar(1.3); starGlow.position.set(0, 4.32, -0.08); g.add(starGlow);
    // 뒤쪽 진열장: 3단 선반 + 짙은 벨벳 뒷판
    mesh(new THREE.BoxGeometry(2.9, 2.3, 0.12), plum, 0, 1.33, -1.32, g);
    for (let k = 0; k < 3; k++) { mesh(new THREE.BoxGeometry(2.7, 0.06, 0.42), wood, 0, 0.62 + k * 0.62, -1.08, g); mesh(new THREE.BoxGeometry(2.7, 0.03, 0.03), gold, 0, 0.66 + k * 0.62, -0.87, g); }
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.1, 2.3, 0.46), wood, s * 1.4, 1.33, -1.08, g);
    // 선반 위 상품: 실제 날개 · 탈것 · 검 모형이 천천히 돌며 빛난다
    const showcase = [];
    const stand = (obj, x, y, sc, oy = 0) => { const h = new THREE.Group(); h.position.set(x, y, -1.05); const inner = new THREE.Group(); inner.scale.setScalar(sc); inner.add(obj); inner.updateMatrixWorld(true); { const bb = new THREE.Box3(); obj.traverse((m) => { if (m.isMesh) bb.expandByObject(m); }); inner.position.y = (bb.isEmpty() ? oy : -bb.min.y) + 0.01; } h.add(inner); /* 선반 위에 딱 올려놓는다 */ h.userData.obj = obj; g.add(h); showcase.push(h);
      const halo = mesh(new THREE.CircleGeometry(0.17, 20), new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }), x, y + 0.005, -1.05, g); halo.rotation.x = -Math.PI / 2; halo.castShadow = false; return h; };
    stand(buildWings('wings_angel'), -0.85, 0.66, 0.42, -0.26); stand(buildWings('wings_dragon'), 0.85, 0.66, 0.32, -0.2);
    stand(buildMount('mount_unicorn'), -0.8, 1.28, 0.34); stand(buildMount('mount_ufo'), 0.1, 1.28, 0.3); stand(buildMount('mount_pony'), 0.88, 1.28, 0.32);
    const sw = buildSword(); sw.rotation.z = 0.2; stand(sw, 0, 1.92, 0.85, 0.05); stand(buildMount('mount_broom'), -0.85, 1.92, 0.3, -0.06); stand(buildWings('wings_fairy'), 0.85, 1.92, 0.34, -0.22);
    // 앞 계산대: 원목 상판 · 금장 · 유리 진열창 안의 폭죽과 물약
    mesh(new THREE.BoxGeometry(2.3, 0.66, 0.6), wood, 0, 0.52, 0.55, g);
    mesh(new THREE.BoxGeometry(2.42, 0.07, 0.72), woodD, 0, 0.88, 0.55, g);
    mesh(new THREE.BoxGeometry(2.44, 0.03, 0.74), gold, 0, 0.92, 0.55, g);
    for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.46, 0.4, 0.02), pm('#5a2a18'), -0.84 + i * 0.56, 0.52, 0.86, g);
    const glass = mesh(new THREE.BoxGeometry(1.0, 0.38, 0.5), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }), 0.6, 1.1, 0.62, g); glass.castShadow = false;
    for (let i = 0; i < 4; i++) { const cone = mesh(new THREE.ConeGeometry(0.05, 0.16, 12), pm(['#ff5a9a', '#5ab0ff', '#ffd35a', '#7ee0a8'][i], { emissive: ['#ff5a9a', '#5ab0ff', '#ffd35a', '#7ee0a8'][i], emissiveIntensity: 0.4 }), 0.27 + i * 0.22, 1.02, 0.6, g); cone.rotation.z = 0.5; }
    const potions = [];
    for (let i = 0; i < 3; i++) { const c = ['#ff4a8a', '#4ad8ff', '#a8ff4a'][i]; const b = mesh(new THREE.SphereGeometry(0.08, 14, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7, transparent: true, opacity: 0.85, roughness: 0.1 }), -0.95 + i * 0.22, 1.02, 0.7, g); mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 8), pm('#d8d0c0'), -0.95 + i * 0.22, 1.1, 0.7, g); potions.push(b); }
    // 금화 더미
    for (let i = 0; i < 14; i++) { const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), gold, -0.25 + ((i * 37) % 7) * 0.025 - 0.07, 0.94 + Math.floor(i / 5) * 0.013 + (i % 3) * 0.004, 0.62 + ((i * 53) % 5) * 0.02, g); c.rotation.set(Math.random() * 0.3, 0, Math.random() * 0.3); c.castShadow = false; }
    // 매달린 등불 (앞쪽 두 기둥)
    const lanterns = [];
    for (const [x, z] of posts.slice(0, 2)) { const lg = new THREE.Group(); lg.position.set(x * 0.92, 2.6, z + 0.1); g.add(lg); mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.25, 4), pm('#222'), 0, 0.1, 0, lg); const body = mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffb050', emissive: '#ff9a30', emissiveIntensity: 1.4, transparent: true, opacity: 0.92 }), 0, -0.1, 0, lg); body.scale.y = 1.25; mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.04, 10), gold, 0, 0.07, 0, lg); mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.04, 10), gold, 0, -0.28, 0, lg); lanterns.push(lg); }
    if (!matchMedia('(pointer: coarse)').matches) { const lamp = new THREE.PointLight('#ffc070', 9, 7, 1.6); lamp.position.set(0, 2.4, 0.4); g.add(lamp); }
    // 간판 (금 테두리 액자)
    const signC = document.createElement('canvas'); signC.width = 512; signC.height = 160; const sx = signC.getContext('2d');
    const sg = sx.createLinearGradient(0, 0, 0, 160); sg.addColorStop(0, '#3a0e4a'); sg.addColorStop(1, '#1e0628'); sx.fillStyle = sg; sx.fillRect(0, 0, 512, 160);
    sx.strokeStyle = '#e8c060'; sx.lineWidth = 8; sx.strokeRect(8, 8, 496, 144); sx.lineWidth = 2; sx.strokeRect(20, 20, 472, 120);
    sx.textAlign = 'center'; sx.fillStyle = '#ffe9a8'; sx.font = '700 62px "Gowun Dodum", "Malgun Gothic", serif'; sx.shadowColor = '#ffb020'; sx.shadowBlur = 18; sx.fillText('✦ 미아 상회 ✦', 256, 88);
    sx.shadowBlur = 0; sx.font = '700 26px "Gowun Dodum", "Malgun Gothic", sans-serif'; sx.fillStyle = '#d8b0ff'; sx.fillText('날개 · 탈것 · 폭죽 · 전설의 검', 256, 128);
    const signT = new THREE.CanvasTexture(signC); signT.colorSpace = THREE.SRGBColorSpace; signT.anisotropy = 8;
    const board = mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshStandardMaterial({ map: signT, emissive: '#ffffff', emissiveMap: signT, emissiveIntensity: 0.55, roughness: 0.5 }), 0, 2.55, 1.0, g); board.rotation.x = -0.08;
    mesh(new THREE.BoxGeometry(2.5, 0.85, 0.05), woodD, 0, 2.55, 0.97, g).rotation.x = -0.08;
    // 상인: 실크해트 · 외알 안경 · 마술사 옷. 가끔 손을 흔들고 말을 건다
    const keeper = createAvatar({ outfit: 'magician', hat: 'tophat', extra: 'monocle', hair: 'short', hairColor: '#3a2418', ears: 'none', eyes: 'smile', brows: 'thick', mouth: 'grin', cheeks: 'blush', body: '#f2d2b4', accent: '#7a1a3a' });
    mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.28, 24), woodD, 0, 0.31, -0.3, g); // 상인이 올라선 받침
    keeper.position.set(0, 0.45, -0.3); keeper.scale.setScalar(1.08); g.add(keeper);
    const lines = ['어서 오세요! 🪙', '오늘 날개가 새로 들어왔어요 🪽', '유니콘 한번 타 보실래요? 🦄', '전설의 검… 귀신도 벱니다 🗡️', '폭죽은 10개까지! 🎉'];
    let bubble = null, nextTalk = 3, waveT = -1, li = 0, lastT = 0;
    anim.push((t) => {
      const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      { let d = yawWant - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 2.5); }
      showcase.forEach((h, i) => { h.rotation.y = t * 0.6 + i; h.userData.obj.userData.anim?.(t + i, true); });
      potions.forEach((b, i) => (b.material.emissiveIntensity = 0.5 + Math.sin(t * 3 + i * 2) * 0.3));
      lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.3 + i) * 0.08; });
      star.rotation.y = t * 1.2; starGlow.material.opacity = 0.65 + Math.sin(t * 3) * 0.25;
      waveT -= dt;
      animateAvatar(keeper, dt, false, t, false, waveT > 0 ? 'wave' : null, 2.5 - waveT);
      keeper.rotation.y = Math.sin(t * 0.4) * 0.35;
      if (t > nextTalk) {
        nextTalk = t + 7 + Math.random() * 5; waveT = 2.5;
        if (bubble) g.remove(bubble);
        bubble = textSprite(lines[li++ % lines.length], { size: 24, bg: 'rgba(255,250,240,.95)', color: '#4a1a3a', tail: true }); bubble.position.set(0.9, 2.1, -0.1); g.add(bubble);
        const b = bubble; setTimeout(() => { if (bubble === b) { g.remove(b); bubble = null; } }, 4200);
      }
    });
    colliders.push({ x: cx, z: cz, hw: 1.7, hd: 1.7 });
    interactives.push({ id: 'shop', kind: 'shop', x: cx, z: cz, r: 3.0, label: '미아 상회', verb: '구경하기' });
  }
  // ── 고객소리함 (광장 동쪽, 상점 옆) — 빨간 우편함. 버그 · 건의사항을 적어 넣는다
  const clickables = [];
  // Placement reference: cabinet behind the mailbox, facing diagonally into the plaza.
  {
    const cx = 3.9 * LS, cz = 2.6, g = buildArcadeCabinet();
    g.position.set(cx,0,cz); g.scale.setScalar(0.5); g.rotation.y = -Math.PI / 4; g.userData.noSpread = true; root.add(g);
    colliders.push({x:cx,z:cz,hw:.45,hd:.45,noSpread:true});
    interactives.push({id:'arcade',kind:'arcade',x:cx,z:cz,r:1.8,label:'미아 오락실',verb:'연습게임',noSpread:true});
    clickables.push({id:'arcade',group:g});
  }
  {
    const cx = 4.8, cz = 4.5; const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = Math.atan2(0 - cx, 7 - cz); root.add(g); // 입장하는 사람들 쪽을 바라보게
    const red = pm('#d4202a', { roughness: 0.35, metalness: 0.25 }), redD = pm('#9a1018', { roughness: 0.4, metalness: 0.25 }), dark = pm('#1a1216', { roughness: 0.6 }), gold = pm('#ffd36a', { roughness: 0.3, metalness: 0.6, emissive: '#a06a10', emissiveIntensity: 0.35 });
    mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.1, 20), dark, 0, 0.05, 0, g); // 받침
    mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.72, 14), dark, 0, 0.46, 0, g); // 기둥
    mesh(new THREE.BoxGeometry(0.62, 0.06, 0.5), redD, 0, 0.84, 0, g); // 몸통 아래 테
    mesh(new THREE.BoxGeometry(0.56, 0.62, 0.44), red, 0, 1.17, 0, g); // 몸통
    const top = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.44, 24, 1, false, 0, Math.PI), red, 0, 1.48, 0, g); top.rotation.set(Math.PI / 2, Math.PI / 2, 0); // 둥근 지붕
    mesh(new THREE.BoxGeometry(0.6, 0.05, 0.48), redD, 0, 1.475, 0, g);
    mesh(new THREE.BoxGeometry(0.36, 0.045, 0.03), dark, 0, 1.36, 0.225, g); // 편지 넣는 구멍
    const flap = mesh(new THREE.BoxGeometry(0.4, 0.03, 0.07), gold, 0, 1.395, 0.25, g); flap.rotation.x = 0.5; // 구멍 위 처마
    // 앞면 이름판
    const pc = document.createElement('canvas'); pc.width = 256; pc.height = 150; const px = pc.getContext('2d');
    px.fillStyle = '#fff6e4'; px.fillRect(0, 0, 256, 150); px.strokeStyle = '#d4202a'; px.lineWidth = 8; px.strokeRect(6, 6, 244, 138);
    px.fillStyle = '#d4202a'; px.textAlign = 'center'; px.font = '800 44px "Gowun Dodum", "Malgun Gothic", sans-serif'; px.fillText('고객소리함', 128, 64);
    px.fillStyle = '#5a3a30'; px.font = '700 24px "Gowun Dodum", "Malgun Gothic", sans-serif'; px.fillText('버그 · 건의사항', 128, 108);
    const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 4;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.26), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.7 })); plate.position.set(0, 1.12, 0.223); g.add(plate);
    // 구멍에 반쯤 꽂힌 편지 (살짝 들썩인다)
    const letter = new THREE.Group(); letter.position.set(0.02, 1.36, 0.27); g.add(letter);
    mesh(new THREE.BoxGeometry(0.26, 0.012, 0.17), pm('#fffdf4', { roughness: 0.8 }), 0, 0, 0, letter);
    mesh(new THREE.BoxGeometry(0.05, 0.014, 0.05), pm('#d4202a'), 0.08, 0.002, 0.04, letter);
    // 옆에 달린 깃발 (새 소식이 있다는 표시처럼 까딱인다)
    const flag = new THREE.Group(); flag.position.set(0.3, 1.2, 0.05); g.add(flag);
    mesh(new THREE.BoxGeometry(0.03, 0.34, 0.03), gold, 0, 0.17, 0, flag); mesh(new THREE.BoxGeometry(0.03, 0.14, 0.2), gold, 0, 0.3, 0.09, flag);
    const glow = new THREE.PointLight('#ff8a7a', coarse ? 0 : 3.2, 4.5, 1.6); glow.position.set(0, 1.6, 0.9); g.add(glow);
    const sign = textSprite('📮 고객소리함', { size: 30, bg: 'rgba(120,16,24,.9)', color: '#fff3e0', border: '#ffd36a' }); sign.position.set(cx, 2.35, cz); root.add(sign);
    g.traverse((m) => { if (m.isMesh) m.userData.noOcc = true; });
    anim.push((t) => { flag.rotation.z = -0.25 + Math.sin(t * 2.2) * 0.22; letter.position.y = 1.36 + Math.max(0, Math.sin(t * 1.6)) * 0.03; letter.rotation.x = -0.25 + Math.sin(t * 1.6) * 0.06; sign.position.y = 2.35 + Math.sin(t * 1.4) * 0.05; });
    colliders.push({ x: cx, z: cz, hw: 0.33, hd: 0.33 });
    interactives.push({ id: 'mailbox', kind: 'mailbox', x: cx, z: cz, r: 1.9, label: '고객소리함', verb: '의견 보내기' });
    clickables.push({ id: 'mailbox', group: g });
  }
  // 🗳️ 테마 투표 전광판: 고객소리함 맞은편 · 누르면 투표 창 (첫 투표에 헤어 선물)
  {
    const cx = -3.9, cz = 3.5; const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = Math.atan2(0 - cx, 7 - cz); root.add(g);
    const dark = pm('#16121a', { roughness: 0.5, metalness: 0.4 }), gold = pm('#ffd36a', { roughness: 0.3, metalness: 0.6, emissive: '#a06a10', emissiveIntensity: 0.35 });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.07, 1.2, 0.07), dark, s * 0.62, 0.6, 0, g); // 기둥
    mesh(new THREE.BoxGeometry(1.42, 0.98, 0.08), dark, 0, 1.62, 0, g); // 틀
    mesh(new THREE.BoxGeometry(1.46, 0.04, 0.1), gold, 0, 2.12, 0, g); mesh(new THREE.BoxGeometry(1.46, 0.04, 0.1), gold, 0, 1.12, 0, g);
    const vc = document.createElement('canvas'); vc.width = 512; vc.height = 340; const vx = vc.getContext('2d');
    vx.fillStyle = '#0b0a14'; vx.fillRect(0, 0, 512, 340);
    vx.fillStyle = 'rgba(255,210,58,.08)'; for (let y = 4; y < 340; y += 8) for (let x = 4; x < 512; x += 8) vx.fillRect(x, y, 3, 3); // LED 점
    vx.textAlign = 'center'; vx.fillStyle = '#ffd23a'; vx.font = '800 58px "Black Han Sans", "Malgun Gothic", sans-serif'; vx.fillText('테마 투표', 256, 74);
    vx.fillStyle = '#fff3e0'; vx.font = '700 30px "Gowun Dodum", "Malgun Gothic", sans-serif'; vx.fillText('어느 테마가 가장 좋았나요?', 256, 122);
    vx.fillStyle = '#ff8fc8'; vx.font = '800 28px "Gowun Dodum", "Malgun Gothic", sans-serif'; vx.fillText('💇 투표하면 헤어 선물!', 256, 316);
    const vt = new THREE.CanvasTexture(vc); vt.colorSpace = THREE.SRGBColorSpace; vt.anisotropy = 4;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.86), new THREE.MeshBasicMaterial({ map: vt, toneMapped: false })); screen.position.set(0, 1.62, 0.045); g.add(screen);
    const bars = ['#ff6b6b', '#ffa94d', '#ffd43b', '#63e6be', '#74c0fc', '#b197fc'].map((c, i) => { const b = mesh(new THREE.BoxGeometry(0.11, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }), -0.4 + i * 0.16, 1.4, 0.06, g); b.geometry.translate(0, 0.15, 0); b.position.y = 1.35; return b; });
    const sign = textSprite('🗳️ 테마 투표 · 헤어 선물', { size: 30, bg: 'rgba(40,20,90,.9)', color: '#fff3e0', border: '#ffd36a' }); sign.position.set(cx, 2.65, cz); root.add(sign);
    g.traverse((m) => { if (m.isMesh) m.userData.noOcc = true; });
    anim.push((t) => { bars.forEach((b, i) => { b.scale.y = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + i * 0.9)); }); sign.position.y = 2.65 + Math.sin(t * 1.4 + 1) * 0.05; });
    colliders.push({ x: cx, z: cz, hw: 0.72, hd: 0.2 });
    interactives.push({ id: 'vote', kind: 'vote', x: cx, z: cz, r: 2.0, label: '테마 투표 전광판', verb: '투표하기' });
    clickables.push({ id: 'vote', group: g });
  }
  return { interactives, rides, clickables, update: (t) => anim.forEach((f) => f(t)), shopFace: (x, z) => shopFace(x, z) };
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
  const spots = [0.35, 0.95, 1.6, 2.19, 2.9, 3.55, 4.2, 5.0, 5.65, 6.05];
  spots.forEach((a, i) => {
    const r = 22.4, x = Math.cos(a) * r, z = Math.sin(a) * r;
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
function buildOuterPark(root, colliders, add, pathMat = null) {
  const anim = []; const inter = [];
  const { ringInner, ringOuter, branchStart, branchEnd, branchHalfWidth } = OUTER_PATH;
  // 둘레 산책로
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringInner, ringOuter, 96), new THREE.MeshStandardMaterial(pathMat ? { ...pathMat, roughness: 1 } : { map: (() => { const t = groundTex('#d8c8a8', 0.12); t.repeat.set(30, 2); return t; })(), roughness: 1 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; ring.receiveShadow = true; ring.userData.spreadScale = true; root.add(ring);
  // 광장에서 산책로로 이어지는 네 갈래 길
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(branchHalfWidth * 2, branchEnd - branchStart), new THREE.MeshStandardMaterial({ color: pathMat?.color || '#cdbf9f', roughness: 1 }));
    p.rotation.x = -Math.PI / 2; p.rotation.z = -a + Math.PI / 2; const r = (branchStart + branchEnd) / 2; p.position.set(Math.cos(a) * r, 0.011, Math.sin(a) * r); p.scale.y = LS; root.add(p);
  }
  // 북쪽: 연못 + 분수
  {
    const cx = 0, cz = -20.8;
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
  flowerBed(-28.6, -12, 3, 6, 1); flowerBed(-28.6, 12, 3, 6, 4); flowerBed(28.6, -12, 3, 6, 7); flowerBed(28.6, 12, 3, 6, 2);
  flowerBed(-9, 28.6, 6, 2.4, 5); flowerBed(9, 28.6, 6, 2.4, 3);
  // 동쪽: 먹자골목 (포장마차 + 풍선)
  [[20.2, -11, -110], [22.5, -4, -90], [22.5, 4, -90], [20.2, 11, -70]].forEach(([x, z, r]) => add({ t: 'stall', x, z, r }));
  add({ t: 'popcorn_cart', x: 21.6, z: 0, r: -90 });
  add({ t: 'balloon_stand', x: 21.8, z: -8.5 });
  // 서쪽: 야외 무대 + 피크닉 잔디
  {
    const stageX = -21.1;
    const g = new THREE.Group(); g.position.set(stageX, 0, 0); g.rotation.y = Math.PI / 2; root.add(g);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 4), new THREE.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.8 })); deck.position.y = 0.3; deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
    const back = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), new THREE.MeshStandardMaterial({ color: '#5a2a6a' })); back.position.set(0, 2.6, -1.9); g.add(back);
    const curtainM = new THREE.MeshStandardMaterial({ color: '#c0262d', roughness: 0.9 });
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.6, 0.25), curtainM); c.position.set(s * 3.4, 2.4, -1.6); g.add(c); }
    const sign = textSprite('🎤 야외 무대 · 올라가서 춤춰요!', { size: 28, bg: 'rgba(60,10,50,.85)', color: '#ffe08a', border: '#ff8fd0' }); sign.position.set(stageX, 5.2, 0); root.add(sign);
    const bulbs = [];
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: ['#fff2a8', '#ff9ad0', '#9ad0ff'][i % 3] })); b.position.set(-3.6 + i * 0.55, 4.7, -1.75); g.add(b); bulbs.push(b); }
    anim.push((t) => bulbs.forEach((b, i) => (b.visible = Math.sin(t * 4 + i) > -0.3)));
    colliders.push({ x: stageX, z: 0, hw: 2.1, hd: 4.1, perch: 'stage' });
    inter.push({ id: 'stage', kind: 'climb', x: stageX + 2.4, z: 0, r: 2.2, label: '야외 무대', verb: '올라가기', perch: { x: stageX, z: 0, hw: 1.8, hd: 3.7, y: 0.62, id: 'stage' } });
  }
  [[-20.4, -11], [-20.4, 11]].forEach(([x, z]) => add({ t: 'bench', x, z, r: 90 }));
  // 산책로 가로등 + 벤치
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.2; add({ t: 'lamp', x: Math.cos(a) * 28.4, z: Math.sin(a) * 28.4, noLight: true }); }
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
    night: ['#5a6a96', '#141418', 1.15], dark: ['#4a4a5c', '#101010', 0.62],
    candle: ['#7a3828', '#100808', 0.66], dusk: ['#a8a0c8', '#2a2420', 1.9], shop: ['#c8a080', '#241810', 1.3], abyss: ['#3a3a4c', '#080808', 0.48],
  }[ch.ambient] || ['#3a3a40', '#000', 0.4];
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
      if (themeId !== 'mia') instancedForest(root, spots, kind);
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
    if (g.userData.rotors) { g.userData.live = true; for (const [r, ax, sp] of g.userData.rotors) if (sp) anims.push((t) => { r.rotation[ax] = t * sp; }); } // 헬기 회전날개
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
    if (themeId === 'christmas' && o.id === 'glass_prism') loadXmasOpticalModel(g, root, o.id);
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

  if (themeId === 'christmas') {
    const updateXmas = decorateXmas(root, ch.look ?? ch.id); // 챕터가 늘어나 장식 모양(look)을 따로 받는다
    anims.push((t) => updateXmas(t, Boolean(objects.clock_constellation?.done)));
  }
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

function disposeObject(root) {
  root.traverse((o) => { if (!o.userData.sharedArtGeometry) o.geometry?.dispose?.(); if (o.material && !o.userData.sharedArtMaterial) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose?.(); m.dispose?.(); }); } });
}

export function disposeWorld(scene, w) {
  if (!w) return;
  w.root.userData.disposed = true;
  scene.remove(w.root);
  w.snapBoard?.dispose?.(); // 사진 질감 (로비에만 있다)
  // 지오메트리·텍스처만 지운다(disposeTree). 재료는 지우지 않는다: 셰이더 프로그램이 사라져 다음 입장 때 재컴파일로 끊긴다
  disposeTree(w.root);
}
