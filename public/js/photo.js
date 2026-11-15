// 클리어 기념 인화 사진 + 클리어 도장표
//  ① 3D 로 한 장 찍는다: 그 테마의 귀신들이 뒤에 서고, 파티원들이 앞에서 ✌ 포즈
//  ② 2D 캔버스에서 테두리(액자) · 도장표 · 글씨를 얹어 한 장의 사진으로 만든다 (테두리는 다시 고를 수 있다)
import * as THREE from 'three';
import { createAvatar, animateAvatar } from './avatar.js';
import { createGhost, animateGhost } from './ghosts.js';
import { applyGear } from './gear.js';

export const OUT_W = 1080, OUT_H = 1350; // 완성된 사진 (4:5)
const PW = 960, PH = 1040, PX = 60, PY = 60; // 안쪽 그림 크기 · 자리

export const FRAMES = [
  { id: 'polaroid', name: '폴라로이드', icon: '🤍' },
  { id: 'film', name: '필름', icon: '🎞️' },
  { id: 'blood', name: '핏빛', icon: '🩸' },
  { id: 'gold', name: '황금 액자', icon: '👑' },
  { id: 'pastel', name: '파스텔', icon: '🎀' },
  { id: 'neon', name: '네온', icon: '💜' },
];

const FONT_UI = '"Gowun Dodum", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const FONT_PEN = '"Nanum Pen Script", "Gaegu", ' + FONT_UI;
const FONT_SERIF = '"Nanum Myeongjo", "Batang", serif';
const FONT_FAT = '"Do Hyeon", ' + FONT_UI;
const FONT_CUTE = '"Gaegu", ' + FONT_UI;

/** 캔버스에서 쓸 글꼴을 미리 불러 둔다 (못 불러와도 그냥 진행) */
export async function loadPhotoFonts() {
  if (!document.fonts?.load) return;
  const want = ['400 40px "Nanum Pen Script"', '700 40px "Gaegu"', '400 40px "Do Hyeon"', '800 40px "Nanum Myeongjo"', '400 40px "Gowun Dodum"'];
  await Promise.race([Promise.all(want.map((f) => document.fonts.load(f, '미아 클리어').catch(() => {}))), new Promise((r) => setTimeout(r, 1800))]);
}

// ─────────────────────────── ① 3D 촬영
/**
 * members: [{ look, gear }] (최대 4명, 맨 앞이 나) · ghostTypes: 그 테마의 귀신 종류 · tint: 테마 색
 * 돌려주는 값: 그림이 담긴 캔버스 (PW × PH)
 */
export async function shootPhoto({ members = [], ghostTypes = [], tint = '#ff3a2a' }) {
  members = members.slice(0, 4); if (!members.length) members = [{ look: {} }];
  const gl = document.createElement('canvas'); gl.width = PW; gl.height = PH;
  const r = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(PW, PH, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const tc = new THREE.Color(tint);
  const bg = new THREE.Color('#0d0a12').lerp(tc, 0.07);
  scene.background = bg; scene.fog = new THREE.Fog(bg, 7, 17);
  try {
    // 배경: 테마 색이 번지는 벽 + 어두운 바닥
    const wc = document.createElement('canvas'); wc.width = wc.height = 256; const wx = wc.getContext('2d');
    const g0 = wx.createRadialGradient(128, 110, 10, 128, 128, 190);
    g0.addColorStop(0, '#' + new THREE.Color('#2e2234').lerp(tc, 0.34).getHexString()); g0.addColorStop(0.5, '#' + new THREE.Color('#130d19').lerp(tc, 0.12).getHexString()); g0.addColorStop(1, '#040306');
    wx.fillStyle = g0; wx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 26; i++) { wx.fillStyle = `rgba(0,0,0,${0.05 + (i % 5) * 0.02})`; wx.fillRect((i * 53) % 256, 0, 3 + (i % 4), 256); } // 낡은 벽 줄무늬
    const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: wt, fog: false })); wall.position.set(0, 3.2, -3.4); scene.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), new THREE.MeshStandardMaterial({ color: new THREE.Color('#1c1620').lerp(tc, 0.1), roughness: 0.85 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    scene.add(new THREE.HemisphereLight('#d8dcff', '#2a1c26', 1.25));
    const flash = new THREE.PointLight('#fff2dc', 36, 14, 1.3); flash.position.set(0.5, 1.9, 4.2); scene.add(flash); // 카메라 플래시
    const fill = new THREE.DirectionalLight('#ffe9d8', 1.05); fill.position.set(-2, 3, 5); scene.add(fill);
    const rim = new THREE.PointLight(tc, 34, 10, 1.4); rim.position.set(0, 3.1, -2.6); scene.add(rim); // 뒤에서 번지는 테마 색
    const under = new THREE.PointLight(tc.clone().lerp(new THREE.Color('#ff2a2a'), 0.5), 16, 6, 1.6); under.position.set(0, 0.5, -0.5); scene.add(under); // 귀신을 아래에서 비추는 으스스한 빛

    // 귀신: 서로 다른 종류 둘까지, 파티원 뒤에 크게
    // (기어다니는 귀신 · 그림자 · 작은 아이 귀신은 사진에서 알아보기 어려워, 다른 귀신이 있으면 뒤로 미룬다)
    const LOW = ['crawler', 'shadow', 'child'];
    const all = [...new Set(ghostTypes.length ? ghostTypes : ['woman'])];
    const types = [...all.filter((t) => !LOW.includes(t)), ...all.filter((t) => LOW.includes(t))].slice(0, 2);
    if (types.length === 1 && members.length > 1) types.push(types[0]);
    const ghosts = types.map((type, i) => {
      let g; try { g = createGhost(type); } catch { g = createGhost('woman'); }
      g.traverse((o) => { if (o.isLight) o.intensity *= 0.35; });
      const h = new THREE.Box3().setFromObject(g).max.y || 1.8;
      const k = (h < 1.85 ? Math.min(1.9, 2.05 / h) : 1) * 1.1; g.scale.setScalar(k); // 파티원 머리 위로 얼굴이 보이게 크게
      const x = types.length === 1 ? 0.78 : (i ? 0.95 : -0.95);
      g.position.set(x, Math.max(0.22, 2.3 - h * k), -1.1); g.rotation.y = -x * 0.25;
      scene.add(g);
      try { animateGhost(g, 0.016, 2.3 + i * 1.7, { mode: 'hunt', lit: false, v: true, type }, 3); } catch {}
      return g;
    });

    // 파티원: 앞줄에서 ✌
    const n = members.length;
    const avatars = members.map((m, i) => {
      const a = createAvatar(m.look || {});
      const x = (i - (n - 1) / 2) * 0.82;
      a.position.set(x, 0, 0.55 + (n > 2 && (i === 0 || i === n - 1) ? -0.12 : 0)); a.rotation.y = -x * 0.14;
      if (m.gear) { const [w = '', , , , c = ''] = String(m.gear).split('|'); try { applyGear(a, `${w}||0|0|${c}`); } catch {} } // 날개 · 코스튬만 (탈것 · 검은 뺀다)
      scene.add(a);
      return a;
    });
    // 사진 얼굴은 그림이 늦게 뜨므로 기다린다
    const photos = members.map((m) => m.look).filter((l) => l?.photoOn && l.photo);
    if (photos.length) await Promise.all(photos.map((l) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = res; im.src = l.photo; setTimeout(res, 1500); })));
    await new Promise((res) => setTimeout(res, photos.length ? 160 : 30));
    avatars.forEach((a, i) => { for (let k = 0; k < 2; k++) animateAvatar(a, 0.016, false, 1.1 + i * 0.9, false, 'v', 0.63 + i * 0.31); a.userData.setBlink?.(false); a.userData.setExpr?.('v'); });

    // 카메라: 사람 수에 맞춰 물러난다
    const cam = new THREE.PerspectiveCamera(27, PW / PH, 0.1, 60);
    const halfW = ((n - 1) / 2) * 0.82 + 0.62, halfH = 1.5;
    const d = Math.max(halfH, halfW / (PW / PH), ghosts.length > 1 ? 1.6 / (PW / PH) : 0) / Math.tan((27 * Math.PI) / 360);
    cam.position.set(0, 1.4, 0.55 + d); cam.lookAt(0, 1.3, 0);
    r.render(scene, cam);
    const out = document.createElement('canvas'); out.width = PW; out.height = PH;
    out.getContext('2d').drawImage(gl, 0, 0);
    return out;
  } finally {
    scene.traverse((o) => { o.geometry?.dispose?.(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) { m.map?.dispose?.(); m.dispose?.(); } });
    r.dispose(); try { r.forceContextLoss(); } catch {}
  }
}

// ─────────────────────────── ② 테두리 · 도장표 · 글씨
const rr = (x, a, b, w, h, rad) => { x.beginPath(); x.moveTo(a + rad, b); x.arcTo(a + w, b, a + w, b + h, rad); x.arcTo(a + w, b + h, a, b + h, rad); x.arcTo(a, b + h, a, b, rad); x.arcTo(a, b, a + w, b, rad); x.closePath(); };
function fitText(x, text, maxW, font, size, min = 18) { let s = size; do { x.font = font.replace('%', s); if (x.measureText(text).width <= maxW) break; s -= 2; } while (s > min); return s; }
const rnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/** 클리어 도장표 한 장을 그린다 (왼쪽 위 모서리 기준, 크기 w) */
export function drawStampCard(x, ox, oy, w, { stamps = [], hidden = null, dark = false }) {
  const cols = 5, rows = Math.ceil(stamps.length / cols) || 2;
  const pad = w * 0.055, cell = (w - pad * 2) / cols, R = cell * 0.4, head = w * 0.15;
  const h = head + rows * cell + pad * 0.9;
  x.save();
  x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = w * 0.05; x.shadowOffsetY = w * 0.015;
  rr(x, ox, oy, w, h, w * 0.04); x.fillStyle = dark ? '#1b1420' : '#fffaf0'; x.fill();
  x.shadowColor = 'transparent';
  x.strokeStyle = dark ? '#ffd36a' : '#c0262d'; x.lineWidth = Math.max(2, w * 0.008); x.setLineDash([w * 0.03, w * 0.018]); rr(x, ox + pad * 0.4, oy + pad * 0.4, w - pad * 0.8, h - pad * 0.8, w * 0.03); x.stroke(); x.setLineDash([]);
  const done = stamps.filter((s) => s.cleared).length;
  x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = dark ? '#ffe9a8' : '#7a1218';
  x.font = `700 ${Math.round(w * 0.072)}px ${FONT_FAT}`; x.fillText('클리어 도장표', ox + pad * 1.1, oy + head * 0.62);
  x.textAlign = 'right'; x.fillStyle = dark ? '#fff' : '#c0262d'; x.fillText(`${done} / ${stamps.length}`, ox + w - pad * 1.1, oy + head * 0.62);
  stamps.forEach((s, i) => {
    const cx = ox + pad + cell * (i % cols) + cell / 2, cy = oy + head + cell * Math.floor(i / cols) + cell / 2;
    x.save(); x.translate(cx, cy);
    if (s.cleared) {
      x.rotate(((i * 37) % 9 - 4) * 0.045); // 도장은 살짝씩 삐뚤게
      if (s.now) { x.fillStyle = 'rgba(255, 211, 106, .55)'; x.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, q = k % 2 ? R * 1.05 : R * 1.34; x.lineTo(Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); x.fill(); }
      x.fillStyle = dark ? 'rgba(192,38,45,.28)' : 'rgba(192,38,45,.12)'; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#c0262d'; x.lineWidth = R * 0.13; x.beginPath(); x.arc(0, 0, R * 0.93, 0, Math.PI * 2); x.stroke();
      x.lineWidth = R * 0.045; x.beginPath(); x.arc(0, 0, R * 0.74, 0, Math.PI * 2); x.stroke();
      x.textAlign = 'center'; x.font = `${Math.round(R * 0.82)}px ${FONT_UI}`; x.fillStyle = '#c0262d'; x.fillText(s.icon || '★', 0, -R * 0.08);
      x.font = `800 ${Math.round(R * 0.3)}px ${FONT_UI}`; x.fillStyle = '#c0262d'; x.fillText('CLEAR', 0, R * 0.52);
    } else {
      x.strokeStyle = dark ? 'rgba(255,255,255,.28)' : 'rgba(90,60,60,.3)'; x.lineWidth = R * 0.06; x.setLineDash([R * 0.2, R * 0.16]); x.beginPath(); x.arc(0, 0, R * 0.9, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
      x.globalAlpha = 0.3; x.textAlign = 'center'; x.font = `${Math.round(R * 0.8)}px ${FONT_UI}`; x.fillStyle = dark ? '#fff' : '#5a3c3c'; x.fillText(s.icon || '?', 0, 0); x.globalAlpha = 1;
    }
    x.restore();
  });
  if (hidden?.cleared) { // 히든 테마까지 깼다면 모서리에 금색 별 도장
    const cx = ox + w - pad * 0.2, cy = oy + h - pad * 0.2, R2 = cell * 0.36;
    x.save(); x.translate(cx, cy); x.rotate(0.3);
    x.fillStyle = '#ffd36a'; x.strokeStyle = '#a06a10'; x.lineWidth = 3; x.beginPath(); for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2, q = k % 2 ? R2 * 0.86 : R2 * 1.1; x.lineTo(Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); x.fill(); x.stroke();
    x.textAlign = 'center'; x.font = `${Math.round(R2 * 0.95)}px ${FONT_UI}`; x.fillText(hidden.icon || '🧟', 0, 2);
    x.restore();
  }
  x.restore();
  return h;
}

/**
 * 사진 한 장 완성. photo: shootPhoto 가 돌려준 캔버스
 * info: { icon, title, sub, ending('true'|'normal'), timeText, hints, names[], date(Date), tint, site, stamps[{icon, cleared, now}], hidden }
 */
export function composePhoto(photo, info, frameId = 'polaroid') {
  const c = document.createElement('canvas'); c.width = OUT_W; c.height = OUT_H; const x = c.getContext('2d');
  const tint = info.tint || '#ff3a2a'; const R = rnd(frameId.length * 977 + 13);
  const d = info.date || new Date(); const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const T = { // 테두리마다 글씨 색 · 글꼴
    polaroid: { ink: '#2a2024', sub: '#6a5a5e', font: FONT_PEN, big: 92, dark: false },
    film: { ink: '#ffb347', sub: '#c9882a', font: FONT_FAT, big: 70, dark: true },
    blood: { ink: '#f4e6d8', sub: '#d0464a', font: FONT_SERIF, big: 66, dark: true },
    gold: { ink: '#ffe08a', sub: '#d8b25a', font: FONT_SERIF, big: 66, dark: true },
    pastel: { ink: '#7a3a8a', sub: '#b06aa8', font: FONT_CUTE, big: 78, dark: false },
    neon: { ink: '#ffffff', sub: '#c9b8ff', font: FONT_FAT, big: 70, dark: true },
  }[frameId] || {};

  // ── 바탕
  if (frameId === 'polaroid') {
    x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, OUT_W, OUT_H);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '120,100,80' : '255,255,255'},${R() * 0.06})`; x.fillRect(R() * OUT_W, R() * OUT_H, 2, 2); }
  } else if (frameId === 'film') {
    x.fillStyle = '#0c0c0e'; x.fillRect(0, 0, OUT_W, OUT_H);
  } else if (frameId === 'blood') {
    const g = x.createLinearGradient(0, 0, 0, OUT_H); g.addColorStop(0, '#2a060a'); g.addColorStop(0.5, '#140306'); g.addColorStop(1, '#070102'); x.fillStyle = g; x.fillRect(0, 0, OUT_W, OUT_H);
  } else if (frameId === 'gold') {
    const g = x.createRadialGradient(OUT_W / 2, OUT_H / 2, 200, OUT_W / 2, OUT_H / 2, 900); g.addColorStop(0, '#3a1420'); g.addColorStop(1, '#16060c'); x.fillStyle = g; x.fillRect(0, 0, OUT_W, OUT_H);
  } else if (frameId === 'pastel') {
    const g = x.createLinearGradient(0, 0, OUT_W, OUT_H); g.addColorStop(0, '#ffd9ec'); g.addColorStop(0.5, '#f1dcff'); g.addColorStop(1, '#d6ecff'); x.fillStyle = g; x.fillRect(0, 0, OUT_W, OUT_H);
  } else {
    x.fillStyle = '#07060c'; x.fillRect(0, 0, OUT_W, OUT_H);
  }

  // ── 사진
  x.save();
  if (frameId === 'pastel') { rr(x, PX, PY, PW, PH, 34); x.clip(); }
  x.drawImage(photo, PX, PY, PW, PH);
  // 살짝 필름 느낌: 가장자리를 어둡게
  const vg = x.createRadialGradient(PX + PW / 2, PY + PH * 0.48, PH * 0.3, PX + PW / 2, PY + PH / 2, PH * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); x.fillStyle = vg; x.fillRect(PX, PY, PW, PH);
  if (frameId === 'film') { x.fillStyle = 'rgba(255,150,40,.07)'; x.fillRect(PX, PY, PW, PH); }
  x.restore();

  // ── 테두리 장식
  if (frameId === 'polaroid') {
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 2; x.strokeRect(PX - 1, PY - 1, PW + 2, PH + 2);
    x.save(); x.translate(OUT_W / 2, 26); x.rotate(-0.03); x.fillStyle = 'rgba(255, 226, 150, .78)'; x.fillRect(-120, -22, 240, 50); x.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 12; i++) x.fillRect(-120 + i * 20, -22, 3, 50); x.restore(); // 마스킹 테이프
  } else if (frameId === 'film') {
    x.fillStyle = '#2b2b30';
    for (let i = 0; i < 20; i++) { const yy = 18 + i * 67; rr(x, 12, yy, 30, 40, 7); x.fill(); rr(x, OUT_W - 42, yy, 30, 40, 7); x.fill(); } // 필름 구멍
    x.save(); x.translate(52, OUT_H - 280); x.rotate(-Math.PI / 2); x.fillStyle = '#ffb347'; x.font = `400 22px ${FONT_FAT}`; x.textAlign = 'left'; x.fillText('MIA 400  ▶ 12A      ESCAPE ROOM      ▶ 13      SAFETY FILM', 0, 0); x.restore();
    x.strokeStyle = '#3a3a40'; x.lineWidth = 3; x.strokeRect(PX - 2, PY - 2, PW + 4, PH + 4);
  } else if (frameId === 'blood') {
    x.strokeStyle = '#7a0f16'; x.lineWidth = 6; x.strokeRect(PX - 3, PY - 3, PW + 6, PH + 6);
    x.fillStyle = '#a00e18'; x.fillRect(0, 0, OUT_W, 44);
    for (let i = 0; i < 34; i++) { const bx = 14 + i * 31.5 + R() * 12, len = 40 + R() * R() * 300, w = 9 + R() * 16; x.beginPath(); x.moveTo(bx - w / 2, 40); x.lineTo(bx - w * 0.32, 40 + len); x.arc(bx, 40 + len, w * 0.32, Math.PI, 0, true); x.lineTo(bx + w / 2, 40); x.closePath(); x.fill(); }
    x.fillStyle = 'rgba(255,120,120,.22)'; for (let i = 0; i < 34; i++) x.fillRect(16 + i * 31.5, 6, 4, 28);
    for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(160,14,24,${0.35 + R() * 0.4})`; x.beginPath(); x.arc(R() * OUT_W, 1120 + R() * 220, 3 + R() * 9, 0, Math.PI * 2); x.fill(); }
  } else if (frameId === 'gold') {
    const gold = x.createLinearGradient(0, 0, OUT_W, OUT_H); gold.addColorStop(0, '#fff0b0'); gold.addColorStop(0.3, '#d9a53a'); gold.addColorStop(0.55, '#fff2c0'); gold.addColorStop(0.8, '#b8862a'); gold.addColorStop(1, '#ffe59a');
    x.strokeStyle = gold; x.lineWidth = 14; x.strokeRect(20, 20, OUT_W - 40, OUT_H - 40);
    x.lineWidth = 3; x.strokeRect(38, 38, OUT_W - 76, OUT_H - 76);
    x.lineWidth = 8; x.strokeRect(PX - 6, PY - 6, PW + 12, PH + 12);
    x.fillStyle = gold;
    for (const [cx, cy] of [[29, 29], [OUT_W - 29, 29], [29, OUT_H - 29], [OUT_W - 29, OUT_H - 29]]) { x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4); x.fillRect(-20, -20, 40, 40); x.restore(); x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI * 2); x.fillStyle = '#5a1420'; x.fill(); x.fillStyle = gold; }
    for (let i = 1; i < 12; i++) { for (const yy of [29, OUT_H - 29]) { x.beginPath(); x.arc((OUT_W / 12) * i, yy, 5, 0, Math.PI * 2); x.fill(); } }
  } else if (frameId === 'pastel') {
    x.strokeStyle = '#ffffff'; x.lineWidth = 10; rr(x, PX, PY, PW, PH, 34); x.stroke();
    const doodle = ['♥', '★', '✿', '♪', '✦', '👻', '♥', '★', '🎀', '✧'];
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 0; i < 46; i++) {
      const side = i % 4, k = R();
      const px = side === 0 ? k * OUT_W : side === 1 ? k * OUT_W : side === 2 ? 14 + R() * 30 : OUT_W - 14 - R() * 30;
      const py = side === 0 ? 12 + R() * 34 : side === 1 ? 1108 + R() * 16 : k * 1100;
      x.save(); x.translate(px, py); x.rotate((R() - 0.5) * 0.9); x.font = `${18 + R() * 20}px ${FONT_UI}`; x.fillStyle = ['#ff8fb8', '#c79bff', '#7ec8ff', '#ffc75f', '#ff9ad0'][i % 5]; x.globalAlpha = 0.9; x.fillText(doodle[i % doodle.length], 0, 0); x.restore();
    }
  } else if (frameId === 'neon') {
    const tube = (color, inset, lw) => { x.save(); x.shadowColor = color; x.shadowBlur = 34; x.strokeStyle = color; x.lineWidth = lw; rr(x, inset, inset, OUT_W - inset * 2, OUT_H - inset * 2, 30); x.stroke(); x.shadowBlur = 10; x.strokeStyle = '#ffffff'; x.lineWidth = lw * 0.3; rr(x, inset, inset, OUT_W - inset * 2, OUT_H - inset * 2, 30); x.stroke(); x.restore(); };
    tube(tint, 24, 9); tube('#6ae8ff', 44, 4);
  }

  // ── 사진 위: 도장표 (왼쪽 위) · CLEAR 도장 (오른쪽 아래) · 날짜
  x.save(); x.translate(PX + 26, PY + 30); x.rotate(-0.055);
  drawStampCard(x, 0, 0, 372, { stamps: info.stamps || [], hidden: info.hidden, dark: false });
  x.restore();
  x.save(); x.translate(PX + PW - 168, PY + PH - 150); x.rotate(-0.26);
  x.globalAlpha = 0.9; x.strokeStyle = '#e02a34'; x.fillStyle = '#e02a34'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 8;
  x.save(); x.shadowColor = 'transparent'; x.fillStyle = 'rgba(255, 244, 236, .2)'; x.beginPath(); x.arc(0, 0, 118, 0, Math.PI * 2); x.fill(); x.restore();
  x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 118, 0, Math.PI * 2); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 100, 0, Math.PI * 2); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 64px ${FONT_SERIF}`; x.fillText('CLEAR', 0, -8);
  x.font = `700 24px ${FONT_UI}`; x.fillText(info.ending === 'true' ? '★ 진 엔딩 ★' : '★ 방탈출 성공 ★', 0, -62); x.fillText(dateStr, 0, 52);
  x.restore();
  x.save(); x.font = `400 30px ${FONT_FAT}`; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = '#ff9a2a'; x.shadowColor = '#ff6a00'; x.shadowBlur = 8; x.fillText(`'${String(d.getFullYear()).slice(2)} ${d.getMonth() + 1} ${d.getDate()}`, PX + 34, PY + PH - 30); x.restore(); // 필름 날짜

  // ── 아래 글씨
  const cx = OUT_W / 2; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  if (frameId === 'neon') { x.shadowColor = tint; x.shadowBlur = 22; }
  const head = `${info.icon ? info.icon + ' ' : ''}${info.title || '방탈출'} 클리어!`;
  const s1 = fitText(x, head, OUT_W - 150, `${frameId === 'polaroid' ? 400 : frameId === 'pastel' ? 700 : 800} %px ${T.font}`, T.big, 34);
  x.fillStyle = T.ink; x.fillText(head, cx, 1100 + 66 + (T.big - s1) * 0.2);
  x.shadowBlur = 0;
  const line2 = [info.timeText ? `⏱ ${info.timeText}` : '', info.hints != null ? `💡 힌트 ${info.hints}개` : '', info.ending === 'true' ? '🏅 진 엔딩' : ''].filter(Boolean).join('   ·   ');
  if (line2) { fitText(x, line2, OUT_W - 150, `700 %px ${FONT_UI}`, 34, 20); x.fillStyle = T.sub; x.fillText(line2, cx, 1100 + 116); }
  const names = (info.names || []).join('  ·  ');
  if (names) { fitText(x, names, OUT_W - 150, `700 %px ${frameId === 'polaroid' ? FONT_PEN : FONT_UI}`, frameId === 'polaroid' ? 54 : 38, 22); x.fillStyle = T.ink; x.fillText(names, cx, 1100 + 168); }
  x.font = `700 22px ${FONT_UI}`; x.fillStyle = T.sub; x.globalAlpha = 0.9; x.fillText(`미아 — 친구랑 하는 3D 공포 방탈출  ·  ${info.site || 'mia-escape.kr'}`, cx, 1100 + 202); x.globalAlpha = 1;
  return c;
}
