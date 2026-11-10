// 점프스케어 22종 — 모두 캔버스에 절차적으로 그린다 (외부 이미지 없음)
const cv = () => document.getElementById('scare');
const R = Math.random;
const TAU = Math.PI * 2;

// ── 공통 그리기 도구
function ell(x, cx, cy, rx, ry, c, rot = 0) { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), rot, 0, TAU); x.fill(); }
function hair(x, cx, cy, s, n = 70, color = '#030303') {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI + (i / n) * TAU;
    x.beginPath(); x.moveTo(cx + Math.cos(a) * s * 0.7, cy - s * 0.6);
    x.quadraticCurveTo(cx + Math.cos(a) * s * 1.3, cy, cx + Math.cos(a) * s * (1.1 + R() * 0.3), cy + s * (1.4 + R()));
    x.lineWidth = 6 + R() * 10; x.strokeStyle = color; x.stroke();
  }
}
function paleFace(x, cx, cy, s, tone = ['#d6dcd8', '#7d8784', '#2a302e'], rx = 0.62, ry = 0.85) {
  const g = x.createRadialGradient(cx, cy, s * 0.1, cx, cy, s * 0.95);
  g.addColorStop(0, tone[0]); g.addColorStop(0.7, tone[1]); g.addColorStop(1, tone[2]);
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, s * rx, s * ry, 0, 0, TAU); x.fill();
}
function veins(x, cx, cy, s, n = 18, c = 'rgba(80,0,0,.6)') {
  x.strokeStyle = c; x.lineWidth = 2;
  for (let i = 0; i < n; i++) { x.beginPath(); let px = cx + (R() - 0.5) * s, py = cy + (R() - 0.5) * s * 1.4; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (R() - 0.5) * 40; py += R() * 30; x.lineTo(px, py); } x.stroke(); }
}
function hollowEyes(x, cx, cy, s, t, pupil = true, blood = true) {
  for (const sd of [-1, 1]) {
    const ex = cx + sd * s * 0.25, ey = cy - s * 0.15;
    ell(x, ex, ey, s * 0.13, s * (0.17 + t * 0.05), '#000', sd * 0.2);
    if (pupil) ell(x, ex + sd * 3, ey + 4, s * 0.025, s * 0.025, '#e8e8e0');
    if (blood) { x.fillStyle = '#5a0000'; x.fillRect(ex - 4, ey + s * 0.12, 8, s * (0.3 + t * 0.6)); }
  }
}
function mouth(x, cx, cy, s, t, teeth = true) {
  ell(x, cx, cy, s * (0.15 + t * 0.12), s * (0.2 + t * 0.25), '#000');
  if (teeth) { x.fillStyle = '#d8d0b8'; for (let i = 0; i < 8; i++) x.fillRect(cx - s * 0.13 + i * s * 0.035, cy - s * 0.17, s * 0.02, s * 0.06); }
}
function dark(x, w, h, a = 0.85) { x.fillStyle = `rgba(0,0,0,${a})`; x.fillRect(0, 0, w, h); }

// ── 22종
const SCARES = {
  // ── 새 놀래키기 ──
  // 삐에로: 화면 가득 하얀 분칠 얼굴, 귀까지 찢어진 붉은 웃음, 뾰족한 이
  clown(x, w, h, t) {
    dark(x, w, h, 0.97); const cx = w / 2 + (R() - 0.5) * 24, cy = h / 2 + (R() - 0.5) * 24, s = Math.min(w, h) * (0.45 + t * 0.3);
    for (const sx of [-1, 1]) { for (let i = 0; i < 26; i++) ell(x, cx + sx * s * (0.62 + R() * 0.25), cy - s * 0.2 + (R() - 0.5) * s * 0.6, s * 0.12, s * 0.12, i % 2 ? '#e8401a' : '#ff6a2a'); }
    ell(x, cx, cy, s * 0.6, s * 0.78, '#f6f2ea'); veins(x, cx, cy, s * 0.7, 10, 'rgba(120,0,0,.35)');
    for (const sx of [-1, 1]) { const ex = cx + sx * s * 0.24, ey = cy - s * 0.18; x.fillStyle = '#1a1a40'; x.beginPath(); x.moveTo(ex, ey - s * 0.22); x.lineTo(ex + s * 0.08, ey); x.lineTo(ex, ey + s * 0.26); x.lineTo(ex - s * 0.08, ey); x.fill(); ell(x, ex, ey, s * 0.09, s * 0.07, '#fff'); ell(x, ex, ey, s * 0.03 * (1 - t * 0.6), s * 0.05, '#000'); }
    ell(x, cx, cy + s * 0.05, s * 0.12, s * 0.11, '#d0101a'); ell(x, cx - s * 0.04, cy + s * 0.01, s * 0.03, s * 0.025, 'rgba(255,255,255,.6)');
    const mw = s * (0.5 + t * 0.12), my = cy + s * 0.38;
    x.fillStyle = '#b0101a'; x.beginPath(); x.moveTo(cx - mw, my - s * 0.12); x.quadraticCurveTo(cx, my + s * 0.42, cx + mw, my - s * 0.12); x.quadraticCurveTo(cx, my + s * 0.12, cx - mw, my - s * 0.12); x.fill();
    x.fillStyle = '#100'; x.beginPath(); x.moveTo(cx - mw * 0.8, my - s * 0.04); x.quadraticCurveTo(cx, my + s * 0.34 * (0.6 + t), cx + mw * 0.8, my - s * 0.04); x.quadraticCurveTo(cx, my + s * 0.1, cx - mw * 0.8, my - s * 0.04); x.fill();
    x.fillStyle = '#fffbe8'; for (let i = 0; i < 14; i++) { const k = i / 13, tx = cx - mw * 0.75 + k * mw * 1.5, ty = my + s * 0.02 + Math.sin(k * Math.PI) * s * 0.12; x.beginPath(); x.moveTo(tx - s * 0.03, ty); x.lineTo(tx + s * 0.03, ty); x.lineTo(tx, ty + s * 0.08); x.fill(); }
  },
  // 깜짝 상자: 상자에서 용수철 목의 광대 머리가 튀어나온다
  jackbox(x, w, h, t) {
    dark(x, w, h, 0.95); const cx = w / 2, by = h * 0.98, s = Math.min(w, h) * 0.3;
    x.fillStyle = '#a0141e'; x.fillRect(cx - s, by - s * 0.9, s * 2, s * 0.9); x.fillStyle = '#ffd36a'; for (let i = 0; i < 4; i++) x.fillRect(cx - s, by - s * 0.9 + i * s * 0.22, s * 2, s * 0.05);
    const pop = Math.min(1, t * 3.2), top = by - s * 0.9 - pop * h * 0.55;
    x.strokeStyle = '#b8bcc4'; x.lineWidth = 10; x.beginPath(); for (let i = 0; i <= 40; i++) { const k = i / 40, yy = by - s * 0.9 - (by - s * 0.9 - top) * k; x.lineTo(cx + Math.sin(k * 30) * s * 0.25, yy); } x.stroke();
    const hs = s * (0.9 + t * 0.6);
    x.save(); x.translate(cx, top); x.scale(hs / (Math.min(w, h) * 0.45), hs / (Math.min(w, h) * 0.45)); x.translate(-w / 2, -h / 2); SCARES.clownHead(x, w, h, t); x.restore();
  },
  clownHead(x, w, h, t) { const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.45; ell(x, cx, cy, s * 0.6, s * 0.75, '#f6f2ea'); for (const sx of [-1, 1]) { ell(x, cx + sx * s * 0.24, cy - s * 0.15, s * 0.1, s * 0.14, '#000'); ell(x, cx + sx * s * 0.24, cy - s * 0.15, s * 0.03, s * 0.03, '#ff2a2a'); ell(x, cx + sx * s * 0.62, cy - s * 0.3, s * 0.22, s * 0.2, '#ff5a1a'); } ell(x, cx, cy + s * 0.05, s * 0.12, s * 0.11, '#d0101a'); x.strokeStyle = '#a0101a'; x.lineWidth = s * 0.08; x.beginPath(); x.arc(cx, cy + s * 0.12, s * 0.42, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); },
  // 풍선: 둥둥 떠오르는 풍선마다 사람 얼굴이 비친다
  balloons(x, w, h, t) {
    dark(x, w, h, 0.9); const C = ['#d6303a', '#ffd36a', '#2f5fd0', '#2fbf71', '#b39dff', '#ff6fa8'];
    for (let i = 0; i < 16; i++) {
      const k = ((i * 53) % 100) / 100, bx = w * (0.08 + k * 0.84), by = h * (1.15 - ((t * (0.9 + (i % 4) * 0.25) + i * 0.07) % 1.3)), r = Math.min(w, h) * (0.06 + (i % 3) * 0.03);
      x.strokeStyle = 'rgba(220,220,220,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, by + r * 1.2); x.lineTo(bx + Math.sin(i + t * 5) * 10, by + r * 4); x.stroke();
      ell(x, bx, by, r, r * 1.18, C[i % 6]); ell(x, bx - r * 0.3, by - r * 0.4, r * 0.22, r * 0.3, 'rgba(255,255,255,.35)');
      ell(x, bx - r * 0.3, by - r * 0.1, r * 0.13, r * 0.18, '#000'); ell(x, bx + r * 0.3, by - r * 0.1, r * 0.13, r * 0.18, '#000'); ell(x, bx, by + r * 0.45, r * 0.22, r * 0.25 * (0.5 + t), '#000');
    }
    if (t > 0.6) { SCARES.clownHead(x, w, h, t); }
  },
  // 줄 인형: 천장에서 실에 매달린 인형이 툭 떨어져 얼굴 앞에서 멈춘다
  marionette(x, w, h, t) {
    dark(x, w, h, 0.96); const cx = w / 2 + Math.sin(t * 20) * 8, drop = Math.min(1, t * 2.5), cy = -h * 0.2 + drop * h * 0.65, s = Math.min(w, h) * 0.38;
    x.strokeStyle = 'rgba(230,220,200,.7)'; x.lineWidth = 2; for (const ox of [-0.7, -0.3, 0, 0.3, 0.7]) { x.beginPath(); x.moveTo(cx + ox * s, 0); x.lineTo(cx + ox * s * 0.8, cy + s * (ox ? 0.9 : -0.4)); x.stroke(); }
    ell(x, cx, cy, s * 0.5, s * 0.6, '#e8d4b8'); ell(x, cx - s * 0.22, cy + s * 0.1, s * 0.08, s * 0.06, '#e05a6a'); ell(x, cx + s * 0.22, cy + s * 0.1, s * 0.08, s * 0.06, '#e05a6a');
    for (const sx of [-1, 1]) { ell(x, cx + sx * s * 0.18, cy - s * 0.12, s * 0.09, s * 0.11, '#fff'); ell(x, cx + sx * s * 0.18 + (R() - 0.5) * 6, cy - s * 0.12, s * 0.04, s * 0.05, '#000'); }
    const jaw = s * (0.08 + Math.abs(Math.sin(t * 18)) * 0.25); x.fillStyle = '#000'; x.fillRect(cx - s * 0.18, cy + s * 0.28, s * 0.36, jaw); x.fillStyle = '#e8d4b8'; x.fillRect(cx - s * 0.2, cy + s * 0.28 + jaw, s * 0.4, s * 0.14);
    x.strokeStyle = '#2a1a10'; x.lineWidth = 3; for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(cx + sx * s * 0.2, cy + s * 0.28); x.lineTo(cx + sx * s * 0.2, cy + s * 0.5 + jaw); x.stroke(); }
  },
  // 거미처럼 천장을 기는 여자: 위에서 거꾸로 매달린 얼굴과 사방으로 꺾인 팔다리
  crawler(x, w, h, t) {
    dark(x, w, h, 0.92); const cx = w / 2, cy = h * (0.15 + Math.min(1, t * 2) * 0.35), s = Math.min(w, h) * 0.35;
    x.strokeStyle = '#b8c0bc'; x.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1 : -1, sy = i < 2 ? -1 : 1; x.lineWidth = 22; x.beginPath(); x.moveTo(cx, cy); const kx = cx + sx * s * 1.1, ky = cy + sy * s * 0.4 - s * 0.3; x.lineTo(kx, ky); x.lineTo(kx + sx * s * 0.5, ky + s * 0.9 + Math.sin(t * 30 + i) * 10); x.stroke(); }
    x.save(); x.translate(cx, cy); x.rotate(Math.PI); x.translate(-cx, -cy); hair(x, cx, cy, s * 0.9, 60); paleFace(x, cx, cy, s * 0.8); hollowEyes(x, cx, cy, s * 0.8, t); mouth(x, cx, cy + s * 0.34, s * 0.8, t); x.restore();
  },
  // 단장: 실크햇 아래 금빛 눈, 상어 같은 이빨
  ringmaster(x, w, h, t) {
    dark(x, w, h, 0.97); const cx = w / 2, cy = h * 0.58, s = Math.min(w, h) * (0.42 + t * 0.2);
    x.fillStyle = '#0a0a0e'; x.fillRect(cx - s * 0.42, cy - s * 1.45, s * 0.84, s * 0.85); ell(x, cx, cy - s * 0.6, s * 0.85, s * 0.1, '#0a0a0e'); x.fillStyle = '#7a0a14'; x.fillRect(cx - s * 0.42, cy - s * 0.78, s * 0.84, s * 0.12);
    ell(x, cx, cy, s * 0.55, s * 0.66, '#c8b8a8');
    for (const sx of [-1, 1]) { ell(x, cx + sx * s * 0.2, cy - s * 0.12, s * 0.1, s * 0.07, '#ffcc33'); ell(x, cx + sx * s * 0.2, cy - s * 0.12, s * 0.015, s * 0.06, '#000'); x.strokeStyle = '#1a1010'; x.lineWidth = s * 0.05; x.beginPath(); x.moveTo(cx, cy + s * 0.12); x.quadraticCurveTo(cx + sx * s * 0.3, cy + s * 0.05, cx + sx * s * 0.45, cy - s * 0.08); x.stroke(); }
    const mw = s * 0.4, my = cy + s * 0.32, op = s * (0.08 + t * 0.2); ell(x, cx, my, mw, op, '#200'); x.fillStyle = '#f4f0e0';
    for (let i = 0; i < 12; i++) { const tx = cx - mw * 0.9 + (i / 11) * mw * 1.8; x.beginPath(); x.moveTo(tx - 7, my - op * 0.8); x.lineTo(tx + 7, my - op * 0.8); x.lineTo(tx, my - op * 0.1); x.fill(); x.beginPath(); x.moveTo(tx - 7, my + op * 0.8); x.lineTo(tx + 7, my + op * 0.8); x.lineTo(tx, my + op * 0.1); x.fill(); }
  },
  // 어둠 속 웃음들: 사방에서 하얀 미소만 떠오른다
  smiles(x, w, h, t) {
    dark(x, w, h, 0.98); const n = 10 + Math.floor(t * 30);
    for (let i = 0; i < n; i++) { const k1 = ((i * 97) % 100) / 100, k2 = ((i * 61) % 100) / 100, sx = w * k1, sy = h * k2, r = Math.min(w, h) * (0.03 + ((i * 13) % 7) * 0.01);
      x.strokeStyle = `rgba(255,255,255,${0.4 + (i % 3) * 0.2})`; x.lineWidth = r * 0.25; x.beginPath(); x.arc(sx, sy, r, 0.1 * Math.PI, 0.9 * Math.PI); x.stroke(); ell(x, sx - r * 0.5, sy - r * 0.6, r * 0.12, r * 0.12, '#fff'); ell(x, sx + r * 0.5, sy - r * 0.6, r * 0.12, r * 0.12, '#fff'); }
    if (t > 0.55) { const s = Math.min(w, h) * 0.5 * (t - 0.4); x.strokeStyle = '#fff'; x.lineWidth = s * 0.1; x.beginPath(); x.arc(w / 2, h / 2, s, 0.1 * Math.PI, 0.9 * Math.PI); x.stroke(); ell(x, w / 2 - s * 0.45, h / 2 - s * 0.5, s * 0.1, s * 0.13, '#f00'); ell(x, w / 2 + s * 0.45, h / 2 - s * 0.5, s * 0.1, s * 0.13, '#f00'); }
  },
  // 낡은 TV: 지직거리는 화면 속 얼굴이 화면 밖으로 손을 뻗는다
  tv(x, w, h, t) {
    x.fillStyle = '#0a0806'; x.fillRect(0, 0, w, h); const tw = Math.min(w * 0.8, h * 1.0), th = tw * 0.72, tx = (w - tw) / 2, ty = (h - th) / 2;
    x.fillStyle = '#3a2a1a'; x.fillRect(tx - 30, ty - 30, tw + 60, th + 60); const img = x.createImageData(Math.max(1, Math.floor(tw / 4)), Math.max(1, Math.floor(th / 4)));
    for (let i = 0; i < img.data.length; i += 4) { const v = R() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    const c2 = document.createElement('canvas'); c2.width = img.width; c2.height = img.height; c2.getContext('2d').putImageData(img, 0, 0); x.imageSmoothingEnabled = false; x.drawImage(c2, tx, ty, tw, th);
    if (t > 0.25) { x.save(); x.globalAlpha = Math.min(1, (t - 0.25) * 3); const s = th * 0.45 * (1 + (t - 0.25) * 0.8); hair(x, w / 2, h / 2, s); paleFace(x, w / 2, h / 2, s); hollowEyes(x, w / 2, h / 2, s, t); mouth(x, w / 2, h / 2 + s * 0.42, s, t); x.restore(); }
    for (let y = 0; y < h; y += 4) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, y, w, 2); }
  },
  // 1. 긴 머리 여자 얼굴
  face(x, w, h, t) { const cx = w / 2 + (R() - 0.5) * 30, cy = h / 2 + (R() - 0.5) * 30, s = Math.min(w, h) * 0.42 * (1 + t * 0.35); dark(x, w, h); hair(x, cx, cy, s); paleFace(x, cx, cy, s); veins(x, cx, cy, s); hollowEyes(x, cx, cy, s, t); mouth(x, cx, cy + s * 0.42, s, t); },
  // 2. 아이 얼굴
  child(x, w, h, t) { const cx = w / 2, cy = h / 2 + 20, s = Math.min(w, h) * 0.32 * (1 + t * 0.4); dark(x, w, h); hair(x, cx, cy - s * 0.2, s * 0.8, 40); paleFace(x, cx, cy, s, ['#9aa2a0', '#6d7774', '#1a201e'], 0.62, 0.7); hollowEyes(x, cx, cy, s, t, false); mouth(x, cx, cy + s * 0.35, s * 0.8, t, false); },
  // 3. 사방에서 뻗는 손
  hands(x, w, h, t) {
    dark(x, w, h, 0.6);
    for (let i = 0; i < 14; i++) {
      const side = i % 4, k = ((i * 97) % 100) / 100, len = (0.25 + t * 0.4) * Math.min(w, h);
      let sx, sy, a; if (side === 0) { sx = k * w; sy = h + 20; a = -Math.PI / 2; } else if (side === 1) { sx = k * w; sy = -20; a = Math.PI / 2; } else if (side === 2) { sx = -20; sy = k * h; a = 0; } else { sx = w + 20; sy = k * h; a = Math.PI; }
      a += (R() - 0.5) * 0.3; const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
      x.strokeStyle = '#b8c0bc'; x.lineWidth = 36; x.lineCap = 'round'; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
      for (let f = -2; f <= 2; f++) { const fa = a + f * 0.25; x.lineWidth = 9; x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex + Math.cos(fa) * 55, ey + Math.sin(fa) * 55); x.stroke(); ell(x, ex + Math.cos(fa) * 58, ey + Math.sin(fa) * 58, 4, 4, '#300'); }
    }
  },
  // 4. 화면 깜빡임 속 얼굴
  flash(x, w, h, t) { if (R() < 0.6) SCARES.face(x, w, h, t); else { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); } },
  // 5. 거대한 눈
  eye(x, w, h, t) {
    x.fillStyle = '#1a0a0a'; x.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, s = Math.min(w, h) * (0.45 + t * 0.15);
    const g = x.createRadialGradient(cx, cy, s * 0.2, cx, cy, s); g.addColorStop(0, '#f2ead8'); g.addColorStop(1, '#a86060'); x.fillStyle = g;
    x.beginPath(); x.ellipse(cx, cy, s * 1.3, s * 0.7 * (1 - Math.max(0, Math.sin(t * 12)) * 0.15), 0, 0, TAU); x.fill();
    veins(x, cx, cy, s * 1.8, 40, 'rgba(160,0,0,.7)');
    ell(x, cx + (R() - 0.5) * 20, cy, s * 0.35, s * 0.35, '#3a2a1a'); ell(x, cx, cy, s * (0.12 + t * 0.12), s * (0.12 + t * 0.12), '#000');
    ell(x, cx - s * 0.1, cy - s * 0.12, s * 0.05, s * 0.05, '#fff');
  },
  // 6. 찢어진 입과 이빨
  teeth(x, w, h, t) {
    dark(x, w, h, 0.95); const cx = w / 2, cy = h / 2, s = Math.min(w, h) * (0.5 + t * 0.2);
    x.fillStyle = '#4a0000'; x.beginPath(); x.ellipse(cx, cy, s * 1.1, s * (0.25 + t * 0.35), 0, 0, TAU); x.fill();
    x.fillStyle = '#e8e0c8';
    for (let i = 0; i < 16; i++) { const px = cx - s + (i / 15) * s * 2; x.beginPath(); x.moveTo(px - 14, cy - s * (0.25 + t * 0.35) * Math.sqrt(1 - ((px - cx) / s / 1.1) ** 2)); x.lineTo(px + 14, cy - s * (0.25 + t * 0.35) * Math.sqrt(1 - ((px - cx) / s / 1.1) ** 2)); x.lineTo(px, cy - 10); x.fill(); x.beginPath(); x.moveTo(px - 14, cy + s * (0.25 + t * 0.35) * Math.sqrt(Math.max(0, 1 - ((px - cx) / s / 1.1) ** 2))); x.lineTo(px + 14, cy + s * (0.25 + t * 0.35) * Math.sqrt(Math.max(0, 1 - ((px - cx) / s / 1.1) ** 2))); x.lineTo(px, cy + 10); x.fill(); }
  },
  // 7. 바닥에서 기어오는 여자
  crawl(x, w, h, t) {
    dark(x, w, h, 0.9); const cx = w / 2, cy = h * (1.1 - t * 0.45), s = Math.min(w, h) * 0.35 * (1 + t);
    for (const sd of [-1, 1]) { x.strokeStyle = '#a8b0ac'; x.lineWidth = 22; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx + sd * s * 0.4, cy + s * 0.3); x.lineTo(cx + sd * s * 1.1, cy - s * 0.1); x.lineTo(cx + sd * s * 1.3, cy + s * 0.5); x.stroke(); }
    hair(x, cx, cy, s, 60); ell(x, cx, cy, s * 0.5, s * 0.55, '#7d8784'); hollowEyes(x, cx, cy + s * 0.05, s * 0.8, t);
    x.fillStyle = '#000'; x.fillRect(cx - s * 0.6, cy - s * 0.9, s * 1.2, s * 0.6);
  },
  // 8. 천장에 매달린 사람
  hang(x, w, h, t) {
    dark(x, w, h, 0.9); const sw = Math.sin(t * 9) * 0.25, cx = w / 2, top = 0, s = Math.min(w, h) * 0.3;
    x.save(); x.translate(cx, top); x.rotate(sw);
    x.strokeStyle = '#d8cfa8'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, h * 0.25); x.stroke();
    x.fillStyle = '#cfd6d2'; x.beginPath(); x.moveTo(-s * 0.4, h * 0.3 + s * 0.5); x.lineTo(s * 0.4, h * 0.3 + s * 0.5); x.lineTo(s * 0.6, h * 0.95); x.lineTo(-s * 0.6, h * 0.95); x.fill();
    x.rotate(0.6); ell(x, 0, h * 0.3, s * 0.32, s * 0.4, '#8a9490'); x.rotate(-0.6);
    hair(x, s * 0.1, h * 0.3, s * 0.5, 30);
    x.restore();
  },
  // 9. 깨진 도자기 인형
  doll(x, w, h, t) {
    dark(x, w, h, 0.92); const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.4 * (1 + t * 0.3);
    ell(x, cx, cy - s * 0.3, s * 0.95, s * 0.9, '#e8c170'); ell(x, cx, cy, s * 0.7, s * 0.78, '#f4ece4');
    for (const sd of [-1, 1]) { ell(x, cx + sd * s * 0.26, cy - s * 0.05, s * 0.16, s * 0.16, '#fff'); ell(x, cx + sd * s * 0.26 + (R() - 0.5) * 8, cy - s * 0.05, s * 0.1, s * 0.1, '#1a3a6a'); ell(x, cx + sd * s * 0.26, cy - s * 0.05, s * 0.04, s * 0.04, '#000'); }
    ell(x, cx, cy + s * 0.35, s * 0.08, s * (0.04 + t * 0.15), '#a0101a');
    x.strokeStyle = '#2a1a1a'; x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.beginPath(); let px = cx + (R() - 0.2) * s * 0.4, py = cy - s * 0.6; x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (R() - 0.5) * 50; py += 30 + R() * 25; x.lineTo(px, py); } x.stroke(); }
    if (t > 0.5) { x.fillStyle = '#000'; x.beginPath(); x.moveTo(cx + s * 0.1, cy - s * 0.4); x.lineTo(cx + s * 0.5, cy - s * 0.2); x.lineTo(cx + s * 0.3, cy + s * 0.1); x.fill(); }
  },
  // 10. 물에 불은 얼굴
  drowned(x, w, h, t) {
    x.fillStyle = '#04121a'; x.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.45 * (1 + t * 0.3);
    paleFace(x, cx, cy, s, ['#a8c0b8', '#5a7a74', '#0a1a1a'], 0.75, 0.85); veins(x, cx, cy, s, 25, 'rgba(20,60,40,.7)');
    hollowEyes(x, cx, cy, s * 1.1, t, true, false); mouth(x, cx, cy + s * 0.42, s, t, false);
    x.strokeStyle = '#2f4a2a'; x.lineWidth = 7; for (let i = 0; i < 14; i++) { x.beginPath(); const px = cx - s + R() * s * 2; x.moveTo(px, cy - s); x.bezierCurveTo(px + 30, cy - s * 0.3, px - 30, cy, px + (R() - 0.5) * 40, cy + s); x.stroke(); }
    x.fillStyle = 'rgba(120,180,200,.15)'; for (let i = 0; i < 40; i++) ell(x, R() * w, (R() * h - t * 300) % h, 3 + R() * 6, 3 + R() * 6, 'rgba(160,210,230,.4)');
  },
  // 11. 거꾸로 뒤집힌 얼굴
  upside(x, w, h, t) { x.save(); x.translate(w / 2, h / 2); x.rotate(Math.PI + Math.sin(t * 20) * 0.08); x.translate(-w / 2, -h / 2); SCARES.face(x, w, h, t); x.restore(); },
  // 12. 어둠 속 수많은 얼굴
  faces(x, w, h, t) {
    dark(x, w, h, 0.95); const n = 14;
    for (let i = 0; i < n; i++) { const cx = ((i * 137) % 100) / 100 * w, cy = ((i * 71) % 100) / 100 * h, s = 40 + ((i * 53) % 60) * (0.6 + t); if (R() < 0.15) continue; paleFace(x, cx, cy, s, ['#9aa2a0', '#4a5250', '#000']); hollowEyes(x, cx, cy, s, t, false, false); }
    SCARES.face(x, w, h, t * 0.6);
  },
  // 13. 피로 뒤덮이는 화면
  blood(x, w, h, t) {
    x.fillStyle = 'rgba(30,0,0,.7)'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#6a0000'; for (let i = 0; i < 40; i++) { const px = (i / 40) * w + Math.sin(i) * 10, len = (0.2 + ((i * 37) % 10) / 10) * h * (0.3 + t); x.fillRect(px, 0, 18, len); ell(x, px + 9, len, 12, 14, '#6a0000'); }
    if (t > 0.4) { const s = Math.min(w, h) * 0.3; paleFace(x, w / 2, h / 2, s); hollowEyes(x, w / 2, h / 2, s, t); }
  },
  // 14. TV 지직 화면 속 실루엣
  static(x, w, h, t) {
    const id = x.createImageData(Math.ceil(w / 4), Math.ceil(h / 4)); for (let i = 0; i < id.data.length; i += 4) { const v = R() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    const tmp = document.createElement('canvas'); tmp.width = id.width; tmp.height = id.height; tmp.getContext('2d').putImageData(id, 0, 0);
    x.imageSmoothingEnabled = false; x.drawImage(tmp, 0, 0, w, h);
    const s = Math.min(w, h) * (0.3 + t * 0.3); x.fillStyle = '#000'; ell(x, w / 2, h / 2 - s * 0.6, s * 0.35, s * 0.42, '#000'); x.fillRect(w / 2 - s * 0.5, h / 2 - s * 0.2, s, h);
    for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, R() * h, w, 6 + R() * 20); }
  },
  // 15. 깨진 거울 속 얼굴
  mirror(x, w, h, t) {
    x.fillStyle = '#8a9aa4'; x.fillRect(0, 0, w, h); SCARES.face(x, w, h, t * 0.8);
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2; const cx = w * (0.4 + R() * 0.2), cy = h * (0.4 + R() * 0.2);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + R() * 0.2; x.beginPath(); x.moveTo(cx, cy); let px = cx, py = cy; for (let j = 0; j < 4; j++) { px += Math.cos(a + (R() - 0.5) * 0.4) * w * 0.15; py += Math.sin(a + (R() - 0.5) * 0.4) * w * 0.15; x.lineTo(px, py); } x.stroke(); }
  },
  // 16. 키 큰 검은 그림자
  shadow(x, w, h, t) {
    x.fillStyle = 'rgba(10,10,14,.6)'; x.fillRect(0, 0, w, h); const s = h * (0.9 + t * 0.4);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,.7)'); x.fillStyle = g;
    ell(x, w / 2, h - s * 0.85, s * 0.09, s * 0.12, '#000'); x.beginPath(); x.moveTo(w / 2 - s * 0.12, h - s * 0.72); x.lineTo(w / 2 + s * 0.12, h - s * 0.72); x.lineTo(w / 2 + s * 0.2, h); x.lineTo(w / 2 - s * 0.2, h); x.fill();
    for (const sd of [-1, 1]) { x.strokeStyle = '#000'; x.lineWidth = 14; x.beginPath(); x.moveTo(w / 2 + sd * s * 0.1, h - s * 0.68); x.lineTo(w / 2 + sd * s * (0.35 + t * 0.3), h - s * (0.3 + t * 0.4)); x.stroke(); }
    for (const sd of [-1, 1]) ell(x, w / 2 + sd * s * 0.03, h - s * 0.86, 5, 3, '#fff');
  },
  // 17. 해골
  skull(x, w, h, t) {
    dark(x, w, h, 0.95); const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.4 * (1 + t * 0.3);
    ell(x, cx, cy - s * 0.15, s * 0.7, s * 0.65, '#d8d0b8'); x.fillStyle = '#d8d0b8'; x.fillRect(cx - s * 0.35, cy + s * 0.2, s * 0.7, s * 0.4);
    for (const sd of [-1, 1]) ell(x, cx + sd * s * 0.26, cy - s * 0.1, s * 0.17, s * 0.2, '#000');
    x.fillStyle = '#000'; x.beginPath(); x.moveTo(cx, cy + s * 0.05); x.lineTo(cx - s * 0.08, cy + s * 0.22); x.lineTo(cx + s * 0.08, cy + s * 0.22); x.fill();
    for (let i = 0; i < 7; i++) { x.fillStyle = '#000'; x.fillRect(cx - s * 0.3 + i * s * 0.1, cy + s * 0.32, 3, s * 0.25); }
    for (const sd of [-1, 1]) ell(x, cx + sd * s * 0.26, cy - s * 0.1, 6, 6, '#ff2a1a');
  },
  // 18. 벽에 휘갈긴 글씨
  writing(x, w, h, t) {
    x.fillStyle = '#1a0806'; x.fillRect(0, 0, w, h); const words = ['뒤를 봐', '여기 있어', '찾았다', '나가지 마', '같이 놀자'];
    x.fillStyle = '#9a0e08'; x.textAlign = 'center';
    for (let i = 0; i < 10; i++) { x.save(); x.translate(R() * w, R() * h); x.rotate((R() - 0.5) * 0.8); x.font = `bold ${30 + R() * 50}px serif`; x.fillText(words[i % words.length], 0, 0); x.restore(); }
    x.font = `900 ${Math.min(w, h) * (0.18 + t * 0.06)}px serif`; x.fillStyle = '#c81a10'; x.fillText(words[Math.floor(t * 3) % words.length], w / 2 + (R() - 0.5) * 20, h / 2 + 40);
  },
  // 19. 유리창에 쾅쾅 찍히는 피 손바닥
  handprints(x, w, h, t) {
    x.fillStyle = 'rgba(10,14,20,.7)'; x.fillRect(0, 0, w, h); const n = Math.floor(3 + t * 20);
    for (let i = 0; i < n; i++) { const px = ((i * 211) % 97) / 97 * w, py = ((i * 131) % 89) / 89 * h, s = 50 + (i % 4) * 15; x.save(); x.translate(px, py); x.rotate(((i * 37) % 10) / 10 - 0.5); ell(x, 0, 0, s * 0.45, s * 0.5, 'rgba(120,0,0,.85)'); for (let f = 0; f < 5; f++) { const fa = -Math.PI / 2 + (f - 2) * 0.35; x.strokeStyle = 'rgba(120,0,0,.85)'; x.lineWidth = s * 0.16; x.lineCap = 'round'; x.beginPath(); x.moveTo(Math.cos(fa) * s * 0.35, Math.sin(fa) * s * 0.4); x.lineTo(Math.cos(fa) * s * 0.85, Math.sin(fa) * s * 0.95); x.stroke(); } x.restore(); }
  },
  // 20. 어둠 속 붉은 눈들
  eyes(x, w, h, t) {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h); const n = 10 + Math.floor(t * 40);
    for (let i = 0; i < n; i++) { const px = ((i * 173) % 101) / 101 * w, py = ((i * 97) % 89) / 89 * h, s = 5 + (i % 5) * 3; for (const sd of [-1, 1]) { const g = x.createRadialGradient(px + sd * s * 2, py, 0, px + sd * s * 2, py, s * 2); g.addColorStop(0, '#ff3a2a'); g.addColorStop(1, 'rgba(255,0,0,0)'); x.fillStyle = g; x.fillRect(px + sd * s * 2 - s * 2, py - s * 2, s * 4, s * 4); } }
  },
  // 21. 길게 늘어난 목
  longneck(x, w, h, t) {
    dark(x, w, h, 0.93); const cx = w / 2 + Math.sin(t * 6) * 60, s = Math.min(w, h) * 0.22, hy = h * (0.8 - t * 0.6);
    x.strokeStyle = '#8a9490'; x.lineWidth = s * 0.35; x.lineCap = 'round'; x.beginPath(); x.moveTo(w / 2, h + 20); x.bezierCurveTo(w / 2 - 200, h * 0.7, cx + 200, hy + 200, cx, hy); x.stroke();
    hair(x, cx, hy, s, 40); paleFace(x, cx, hy, s); hollowEyes(x, cx, hy, s, t); mouth(x, cx, hy + s * 0.42, s, t);
  },
  // 22. 달걀귀신 (얼굴 없는 얼굴)
  faceless(x, w, h, t) {
    dark(x, w, h, 0.9); const cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.42 * (1 + t * 0.3);
    hair(x, cx, cy, s, 50); paleFace(x, cx, cy, s, ['#f2f0ea', '#c8c4bc', '#3a3a38'], 0.6, 0.82);
    if (t > 0.55) { const k = (t - 0.55) / 0.45; ell(x, cx, cy + s * 0.2, s * 0.25 * k, s * 0.4 * k, '#000'); }
  },
};

// 시나리오별로 어울리는 놀래키기
const POOLS = {
  gwimun: ['face', 'child', 'hands', 'upside', 'faces', 'longneck', 'faceless', 'writing', 'eye', 'hang', 'crawler', 'tv'],
  ophelia: ['drowned', 'hands', 'handprints', 'static', 'eye', 'faces', 'skull', 'shadow', 'blood', 'writing'],
  doll: ['doll', 'child', 'teeth', 'mirror', 'eyes', 'writing', 'faces', 'hang', 'blood', 'shadow', 'marionette', 'smiles'],
  hospital: ['face', 'hands', 'faceless', 'static', 'blood', 'writing', 'eye', 'shadow', 'longneck', 'upside', 'tv', 'crawler'],
  camp: ['child', 'drowned', 'handprints', 'faces', 'eye', 'shadow', 'longneck', 'writing', 'smiles', 'crawler'],
  west: ['hang', 'faces', 'shadow', 'eye', 'skull', 'longneck', 'writing', 'ringmaster', 'tv'],
  kimono: ['face', 'faceless', 'longneck', 'upside', 'hands', 'eye', 'writing', 'faces', 'crawler', 'tv'],
  clown: ['clown', 'jackbox', 'balloons', 'marionette', 'ringmaster', 'smiles', 'clown', 'crawler', 'tv', 'teeth'],
};
export const SCARE_TYPES = Object.keys(SCARES).filter((k) => k !== 'clownHead');

// type: 'face' 같은 지정형, 또는 'random'. scenario 에 맞춰 같은 계열 중에서 무작위로 바꿔 준다.
export function pickScare(type, scenario = 'gwimun') {
  if (type === 'flash') return 'flash';
  const pool = POOLS[scenario] || POOLS.gwimun;
  if (type === 'random' || Math.random() < 0.7) return pool[Math.floor(Math.random() * pool.length)];
  return SCARES[type] ? type : pool[0];
}

const SOUND = { clown: 'clown_laugh', jackbox: 'jackbox', balloons: 'pop', marionette: 'creak', crawler: 'scream', ringmaster: 'growl', smiles: 'giggle', tv: 'glitch', eye: 'growl', teeth: 'growl', static: 'glitch', writing: 'glitch', eyes: 'growl', skull: 'scream', drowned: 'scream_wet', doll: 'scream_child', child: 'scream_child', faceless: 'sting', shadow: 'growl', mirror: 'glass', handprints: 'bang', hang: 'creak', blood: 'scream' };

export function jumpscare(type, audio) {
  const c = cv();
  c.width = innerWidth; c.height = innerHeight;
  c.classList.remove('hidden');
  const x = c.getContext('2d');
  const draw = SCARES[type] || SCARES.face;
  const dur = type === 'flash' ? 380 : type === 'writing' || type === 'static' ? 900 : 1100;
  const start = performance.now();
  audio?.play(type === 'flash' ? 'sting' : SOUND[type] || 'scream');
  if (navigator.userActivation?.hasBeenActive && navigator.vibrate) navigator.vibrate([200, 50, 200]);
  return new Promise((res) => {
    const frame = (now) => {
      const t = Math.min(1, (now - start) / dur);
      x.clearRect(0, 0, c.width, c.height);
      draw(x, c.width, c.height, t);
      x.fillStyle = `rgba(150,0,0,${0.1 + Math.random() * 0.15})`; x.fillRect(0, 0, c.width, c.height);
      c.style.transform = `translate(${(Math.random() - 0.5) * 30}px,${(Math.random() - 0.5) * 30}px)`;
      if (t < 1) requestAnimationFrame(frame);
      else { c.classList.add('hidden'); c.style.transform = ''; res(); }
    };
    requestAnimationFrame(frame);
  });
}
export const SCARES_DRAW = SCARES;
