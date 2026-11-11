import * as THREE from 'three';

// ───────────────────────── 커스터마이징 옵션
export const OPTIONS = {
  ears: [['bear', '곰'], ['bunny', '토끼'], ['cat', '고양이'], ['fox', '여우'], ['devil', '뿔'], ['none', '없음']],
  hat: [['none', '없음'], ['beanie', '비니'], ['ribbon', '리본'], ['sprout', '새싹'], ['cap', '야구모자'], ['halo', '천사링'], ['crown', '왕관'], ['flower', '꽃핀'], ['tophat', '실크햇'], ['beret', '베레모'], ['headphones', '헤드폰'], ['catband', '고양이 머리띠'], ['tiara', '티아라'], ['strawhat', '밀짚모자'], ['frog', '개구리 모자'], ['mushroom', '버섯 모자']],
  eyes: [['dot', '동글'], ['big', '왕눈'], ['sparkle', '반짝'], ['smile', '웃음'], ['sleepy', '졸림'], ['wink', '윙크'], ['star', '별'], ['heart', '하트'], ['teary', '글썽'], ['angry', '화남'], ['dizzy', '어질'], ['closed', '감음'], ['cat', '고양이눈']],
  brows: [['none', '없음'], ['soft', '순둥'], ['worried', '걱정'], ['angry', '버럭'], ['thick', '짙은']],
  mouth: [['smile', '미소'], ['open', '활짝'], ['cat', 'ω'], ['tongue', '메롱'], ['o', '오!'], ['flat', '무표정'], ['fang', '덧니'], ['pout', '뾰로통'], ['grin', '씨익']],
  cheeks: [['blush', '발그레'], ['none', '없음'], ['freckles', '주근깨'], ['hearts', '하트'], ['bandaid', '반창고'], ['swirl', '빙글']],
  extra: [['none', '없음'], ['glasses', '안경'], ['sunglasses', '선글라스'], ['eyepatch', '안대'], ['mask', '마스크'], ['mole', '점'], ['scar', '흉터'], ['whiskers', '수염'], ['tears', '피눈물'], ['monocle', '외알 안경'], ['heartglasses', '하트 안경'], ['clown', '빨간 코'], ['stickers', '별 스티커']],
  acc: [['none', '없음'], ['necklace', '진주 목걸이'], ['pendant', '십자가 목걸이'], ['bell', '방울 목걸이'], ['scarf', '목도리'], ['bowtie', '나비넥타이'], ['backpack', '책가방'], ['wings', '천사 날개'], ['batwings', '박쥐 날개'], ['cape', '망토'], ['tail', '고양이 꼬리'], ['balloon', '풍선'], ['teddy', '곰인형'], ['lantern', '초롱']],
  hair: [['none', '없음'], ['short', '짧은'], ['bob', '단발'], ['long', '긴머리'], ['twintail', '양갈래'], ['ponytail', '포니테일'], ['bun', '똥머리'], ['spiky', '삐죽'], ['bowl', '바가지']],
  outfit: [['plain', '기본'], ['sailor', '세일러 교복'], ['blazer', '블레이저 교복'], ['hanbok', '한복'], ['shaman', '무녀복'], ['reaper', '저승사자'], ['priest', '퇴마 신부'], ['nurse', '간호사'], ['detective', '탐정'], ['maid', '메이드'], ['hoodie', '심야방송 후드'], ['pajama', '곰 잠옷'],
    ['police', '경찰'], ['doctor', '의사 가운'], ['chef', '요리사'], ['firefighter', '소방관'], ['pirate', '해적'], ['witch', '마녀'], ['vampire', '뱀파이어'],
    ['mummy', '미라'], ['astronaut', '우주복'], ['ninja', '닌자'], ['santa', '산타'], ['raincoat', '노란 우비'], ['tracksuit', '학교 체육복'], ['dino', '공룡 잠옷'], ['cowboy', '카우보이'], ['kimono', '기모노'],
    ['clown', '삐에로'], ['ringmaster', '서커스 단장'], ['magician', '마술사'], ['knight', '기사 갑옷'], ['princess', '공주 드레스'], ['gothic', '고딕 드레스'], ['wizard', '마법사 로브'], ['idol', '아이돌 무대의상'], ['hiphop', '힙합'], ['explorer', '탐험가'], ['bee', '꿀벌 잠옷'], ['panda', '판다 잠옷']],
};
export const SKIN = ['#ffd6a5', '#fff1e6', '#ffe0cc', '#f1c27d', '#d4a373', '#a3714f', '#ffc8dd', '#cde7b0', '#bde0fe', '#e2c2ff', '#f6e58d', '#c9c9c9'];
export const ACCENT = ['#ff8fab', '#ff6b6b', '#ffa94d', '#ffd43b', '#74c0fc', '#63e6be', '#b197fc', '#495057', '#ffffff', '#1c1c24'];
export const HAIRC = ['#2b1d16', '#5a3825', '#a0652e', '#e8c170', '#f2e6d0', '#c0392b', '#ff8fab', '#7b5cff', '#3fa9f5', '#2fbf71', '#111111', '#9a9a9a'];
export const EYEC = ['#2a1e22', '#5a3825', '#3b7dd8', '#2fbf71', '#9b59b6', '#e74c3c', '#f1c40f', '#ff8fab'];

export const DEFAULT_LOOK = { body: '#ffd6a5', accent: '#ff8fab', ears: 'bear', hat: 'none', eyes: 'big', eyeColor: '#5a3825', brows: 'soft', mouth: 'smile', cheeks: 'blush', extra: 'none', acc: 'none', hair: 'short', hairColor: '#5a3825', outfit: 'sailor', photo: '', photoOn: false };

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0, ...o });

// ───────────────────────── 얼굴 (캔버스에 그려서 머리에 입힌다)
const D = '#2a1e22';
function heart(x, cx, cy, s, c) { x.fillStyle = c; x.beginPath(); x.moveTo(cx, cy + s * 0.9); x.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.6, cy - s * 1.3, cx, cy - s * 0.4); x.bezierCurveTo(cx + s * 0.6, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 0.9); x.fill(); }
function star(x, cx, cy, r, c) { x.fillStyle = c; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); }
function ell(x, cx, cy, rx, ry, c) { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }

const EX = 97, EY = 242, MY = 322, CX = 256;
function drawEye(x, cx, side, look) {
  const e = look.eyes, ec = look.eyeColor || D;
  x.lineCap = 'round'; x.lineJoin = 'round';
  const bigEye = (rx, ry) => {
    ell(x, cx, EY, rx, ry, '#fff');
    const g = x.createLinearGradient(0, EY - ry, 0, EY + ry); g.addColorStop(0, D); g.addColorStop(0.35, ec); g.addColorStop(1, '#ffffff');
    ell(x, cx, EY + 2, rx * 0.86, ry * 0.9, g);
    // 홍채 안쪽 반짝이는 무늬
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * rx * 0.45, EY + 2 + Math.sin(a) * ry * 0.48); x.lineTo(cx + Math.cos(a) * rx * 0.78, EY + 2 + Math.sin(a) * ry * 0.82); x.stroke(); }
    ell(x, cx, EY + 2, rx * 0.42, ry * 0.45, D);
    ell(x, cx - rx * 0.32, EY - ry * 0.35, rx * 0.3, ry * 0.26, '#fff');
    ell(x, cx + rx * 0.3, EY + ry * 0.42, rx * 0.14, ry * 0.12, '#fff');
    ell(x, cx + rx * 0.05, EY - ry * 0.52, rx * 0.08, ry * 0.07, 'rgba(255,255,255,.85)');
    x.strokeStyle = D; x.lineWidth = 6; x.beginPath(); x.ellipse(cx, EY, rx + 2, ry + 2, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    // 위 속눈썹 두 가닥 + 아래 속눈썹
    x.lineWidth = 4; x.beginPath(); x.moveTo(cx + side * rx * 0.9, EY - ry * 0.6); x.lineTo(cx + side * (rx + 10), EY - ry * 0.95); x.stroke();
    x.lineWidth = 3.5; x.beginPath(); x.moveTo(cx + side * rx * 0.62, EY - ry * 0.88); x.lineTo(cx + side * (rx * 0.75 + 4), EY - ry * 1.22); x.stroke();
    x.lineWidth = 2.5; x.strokeStyle = 'rgba(42,30,34,.55)'; x.beginPath(); x.ellipse(cx, EY + 1, rx * 0.9, ry * 0.98, 0, Math.PI * 0.3, Math.PI * 0.7); x.stroke();
  };
  switch (e) {
    case 'big': bigEye(30, 38); break;
    case 'sparkle': bigEye(32, 40); star(x, cx + 8, EY - 10, 11, '#fff'); star(x, cx - 12, EY + 14, 6, '#fff'); break;
    case 'teary': bigEye(30, 36); x.fillStyle = 'rgba(120,190,255,.85)'; x.beginPath(); x.moveTo(cx + side * 10, EY + 36); x.quadraticCurveTo(cx + side * 22, EY + 64, cx + side * 10, EY + 70); x.quadraticCurveTo(cx - side * 2, EY + 64, cx + side * 10, EY + 36); x.fill(); x.fillStyle = 'rgba(160,210,255,.5)'; x.fillRect(cx - 28, EY + 24, 56, 6); break;
    case 'cat': ell(x, cx, EY, 28, 34, ec); x.fillStyle = D; x.beginPath(); x.ellipse(cx, EY, 6, 28, 0, 0, Math.PI * 2); x.fill(); ell(x, cx - 9, EY - 12, 6, 6, '#fff'); x.strokeStyle = D; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, EY, 29, 35, 0, 0, Math.PI * 2); x.stroke(); break;
    case 'smile': x.strokeStyle = D; x.lineWidth = 10; x.beginPath(); x.arc(cx, EY + 14, 24, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); break;
    case 'closed': x.strokeStyle = D; x.lineWidth = 9; x.beginPath(); x.arc(cx, EY - 6, 24, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); break;
    case 'blink': x.strokeStyle = D; x.lineWidth = 8; x.beginPath(); x.moveTo(cx - 26, EY + 2); x.quadraticCurveTo(cx, EY + 12, cx + 26, EY + 2); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(cx + side * 24, EY + 3); x.lineTo(cx + side * 33, EY - 3); x.stroke(); break;
    case 'sleepy': x.strokeStyle = D; x.lineWidth = 9; x.beginPath(); x.moveTo(cx - 26, EY + 4); x.quadraticCurveTo(cx, EY + 16, cx + 26, EY + 4); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 24, EY - 6); x.lineTo(cx + 24, EY - 6); x.stroke(); break;
    case 'wink': if (side < 0) { ell(x, cx, EY, 20, 25, D); ell(x, cx - 6, EY - 8, 7, 7, '#fff'); } else { x.strokeStyle = D; x.lineWidth = 9; x.beginPath(); x.moveTo(cx - 22, EY - 16); x.lineTo(cx + 18, EY); x.lineTo(cx - 22, EY + 16); x.stroke(); } break;
    case 'star': star(x, cx, EY, 32, ec === D ? '#f1c40f' : ec); star(x, cx - 6, EY - 6, 9, '#fff'); break;
    case 'heart': heart(x, cx, EY, 26, ec === D ? '#ff4d6d' : ec); ell(x, cx - 10, EY - 10, 6, 5, '#fff'); break;
    case 'angry': ell(x, cx, EY + 4, 20, 22, D); ell(x, cx - 5, EY - 2, 6, 6, '#fff'); x.strokeStyle = D; x.lineWidth = 9; x.beginPath(); x.moveTo(cx - 30 * side, EY - 30); x.lineTo(cx + 26 * side, EY - 14); x.stroke(); break;
    case 'dizzy': x.strokeStyle = D; x.lineWidth = 6; x.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 3 + a * 1.7; x.lineTo(cx + Math.cos(a * side) * r, EY + Math.sin(a * side) * r); } x.stroke(); break;
    default: ell(x, cx, EY, 21, 26, ec); ell(x, cx - 6, EY - 9, 8, 8, '#fff'); ell(x, cx + 7, EY + 9, 4, 4, '#fff');
  }
}
function drawBrow(x, cx, side, b) {
  if (b === 'none') return;
  x.strokeStyle = D; x.lineCap = 'round'; x.lineWidth = b === 'thick' ? 15 : 8;
  x.beginPath();
  const y = EY - 62;
  if (b === 'soft') { x.arc(cx, y + 26, 30, Math.PI * 1.25, Math.PI * 1.75); }
  else if (b === 'worried') { x.moveTo(cx - 28 * side, y + 6); x.lineTo(cx + 24 * side, y - 10); x.moveTo(cx - 28 * side, y + 6); }
  else if (b === 'angry') { x.moveTo(cx - 28 * side, y - 12); x.lineTo(cx + 24 * side, y + 10); }
  else { x.moveTo(cx - 26, y); x.lineTo(cx + 26, y); }
  x.stroke();
}
function drawMouth(x, m) {
  x.strokeStyle = D; x.fillStyle = D; x.lineWidth = 7; x.lineCap = 'round';
  const y = MY;
  switch (m) {
    case 'open': x.beginPath(); x.moveTo(CX - 22, y - 6); x.quadraticCurveTo(CX, y + 40, CX + 22, y - 6); x.closePath(); x.fill(); ell(x, CX, y + 14, 11, 7, '#ff7b8f'); break;
    case 'cat': x.beginPath(); x.arc(CX - 11, y, 11, 0, Math.PI); x.arc(CX + 11, y, 11, 0, Math.PI); x.stroke(); break;
    case 'tongue': x.beginPath(); x.arc(CX, y - 8, 20, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); ell(x, CX + 6, y + 14, 10, 13, '#ff7b8f'); break;
    case 'o': x.beginPath(); x.ellipse(CX, y + 4, 10, 13, 0, 0, Math.PI * 2); x.fill(); break;
    case 'flat': x.beginPath(); x.moveTo(CX - 16, y); x.lineTo(CX + 16, y); x.stroke(); break;
    case 'fang': x.beginPath(); x.arc(CX, y - 10, 22, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(CX + 6, y + 9); x.lineTo(CX + 16, y + 8); x.lineTo(CX + 11, y + 22); x.fill(); break;
    case 'pout': x.beginPath(); x.arc(CX, y - 4, 7, Math.PI * 1.5, Math.PI * 0.5); x.arc(CX, y + 10, 7, Math.PI * 1.5, Math.PI * 0.5); x.stroke(); break;
    case 'grin': x.beginPath(); x.moveTo(CX - 34, y - 8); x.quadraticCurveTo(CX, y + 34, CX + 34, y - 8); x.closePath(); x.fill(); x.fillStyle = '#fff'; x.fillRect(CX - 26, y - 6, 52, 9); break;
    default: x.beginPath(); x.arc(CX, y - 10, 18, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
  }
}
function drawCheeks(x, c) {
  for (const s of [-1, 1]) {
    const cx = CX + s * 150, cy = 296;
    if (c === 'blush') {
      x.save(); x.translate(cx, cy); x.scale(1.35, 0.85); const g = x.createRadialGradient(0, 0, 2, 0, 0, 34); g.addColorStop(0, 'rgba(255,120,150,.8)'); g.addColorStop(1, 'rgba(255,120,150,0)'); x.fillStyle = g; x.fillRect(-40, -34, 80, 68); x.restore();
      // 볼터치 위 짧은 빗금 세 개 (만화풍 홍조)
      x.strokeStyle = 'rgba(255,90,120,.55)'; x.lineWidth = 3; x.lineCap = 'round'; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(cx + i * 12 - 4, cy + 6); x.lineTo(cx + i * 12 + 4, cy - 6); x.stroke(); }
    }
    if (c === 'freckles') for (let i = 0; i < 6; i++) ell(x, cx - 16 + (i % 3) * 14, cy - 6 + Math.floor(i / 3) * 12 + (i % 2) * 4, 3.2, 3.2, '#b0704a');
    if (c === 'hearts') heart(x, cx, cy, 11, '#ff6b8a');
    if (c === 'swirl') { x.strokeStyle = '#ff7f9f'; x.lineWidth = 4; x.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.2) x.lineTo(cx + Math.cos(a) * (2 + a * 2.4), cy + Math.sin(a) * (2 + a * 2.4)); x.stroke(); }
    if (c === 'bandaid' && s > 0) { x.save(); x.translate(cx - 10, cy - 4); x.rotate(-0.4); x.fillStyle = '#f2c79a'; x.fillRect(-34, -11, 68, 22); x.fillStyle = '#e6b07e'; x.fillRect(-12, -11, 24, 22); x.fillStyle = '#c99060'; for (let i = 0; i < 4; i++) x.fillRect(-7 + (i % 2) * 10, -6 + Math.floor(i / 2) * 9, 3, 3); x.restore(); }
  }
}
function drawExtra(x, e) {
  x.lineCap = 'round';
  if (e === 'glasses' || e === 'sunglasses') {
    for (const s of [-1, 1]) { const cx = CX + s * EX; if (e === 'sunglasses') ell(x, cx, EY, 42, 34, 'rgba(15,15,25,.92)'); x.strokeStyle = e === 'sunglasses' ? '#111' : '#3a2a20'; x.lineWidth = 7; x.beginPath(); x.ellipse(cx, EY, 42, 36, 0, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.moveTo(CX - EX + 42, EY - 6); x.quadraticCurveTo(CX, EY - 20, CX + EX - 42, EY - 6); x.stroke();
    if (e === 'sunglasses') { x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(CX + s * EX - 20, EY - 14); x.lineTo(CX + s * EX - 4, EY - 22); x.stroke(); } }
  }
  if (e === 'eyepatch') { ell(x, CX + EX, EY, 40, 38, '#1a1a1a'); x.strokeStyle = '#1a1a1a'; x.lineWidth = 6; x.beginPath(); x.moveTo(CX - 200, EY - 110); x.lineTo(CX + 230, EY + 30); x.stroke(); }
  if (e === 'mask') { x.fillStyle = '#f4f6f8'; x.beginPath(); x.moveTo(CX - 120, MY - 50); x.quadraticCurveTo(CX, MY - 70, CX + 120, MY - 50); x.lineTo(CX + 105, MY + 50); x.quadraticCurveTo(CX, MY + 80, CX - 105, MY + 50); x.closePath(); x.fill(); x.strokeStyle = '#d7dde3'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(CX - 90, MY - 25 + i * 22); x.lineTo(CX + 90, MY - 25 + i * 22); x.stroke(); } }
  if (e === 'mole') ell(x, CX + 52, MY + 18, 5, 5, '#3a2418');
  if (e === 'scar') { x.strokeStyle = '#a3262d'; x.lineWidth = 6; x.beginPath(); x.moveTo(CX - EX - 30, EY - 60); x.lineTo(CX - EX + 30, EY + 60); x.stroke(); x.lineWidth = 3; for (let i = -2; i <= 2; i++) { const t = (i + 2.5) / 5; const px = CX - EX - 30 + 60 * t, py = EY - 60 + 120 * t; x.beginPath(); x.moveTo(px - 12, py + 5); x.lineTo(px + 12, py - 5); x.stroke(); } }
  if (e === 'whiskers') { x.strokeStyle = D; x.lineWidth = 4; for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(CX + s * 120, 300 + i * 12); x.lineTo(CX + s * 200, 290 + i * 22); x.stroke(); } }
  if (e === 'monocle') { x.strokeStyle = '#c9a24a'; x.lineWidth = 8; x.beginPath(); x.arc(CX + EX, EY, 48, 0, Math.PI * 2); x.stroke(); x.fillStyle = 'rgba(200,230,255,.18)'; x.fill(); x.lineWidth = 3; x.beginPath(); x.moveTo(CX + EX + 34, EY + 34); x.quadraticCurveTo(CX + EX + 70, EY + 120, CX + EX + 40, EY + 190); x.stroke(); }
  if (e === 'heartglasses') { for (const s of [-1, 1]) { const cx = CX + s * EX, cy = EY + 4; x.fillStyle = 'rgba(255,80,140,.55)'; x.strokeStyle = '#ff3a7a'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx, cy + 40); x.bezierCurveTo(cx - 70, cy - 5, cx - 40, cy - 55, cx, cy - 22); x.bezierCurveTo(cx + 40, cy - 55, cx + 70, cy - 5, cx, cy + 40); x.closePath(); x.fill(); x.stroke(); } x.beginPath(); x.moveTo(CX - 40, EY - 14); x.lineTo(CX + 40, EY - 14); x.stroke(); }
  if (e === 'clown') { ell(x, CX, (EY + MY) / 2 + 8, 30, 28, '#e8202a'); ell(x, CX - 9, (EY + MY) / 2 - 2, 9, 7, 'rgba(255,255,255,.6)'); }
  if (e === 'stickers') { const star = (cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); }; star(CX - 150, 300, 26, '#ffd43b'); star(CX + 156, 286, 20, '#74c0fc'); star(CX + 128, 330, 13, '#ff8fab'); }
  if (e === 'tears') { x.fillStyle = '#8a0010'; for (const s of [-1, 1]) { x.fillRect(CX + s * EX - 4, EY + 26, 8, 80 + s * 10); ell(x, CX + s * EX, EY + 110 + s * 10, 7, 9, '#8a0010'); } }
}

export function drawFace(canvas, look, img) {
  const x = canvas.getContext('2d');
  x.clearRect(0, 0, 512, 512);
  if (look.photoOn && img) {
    x.save(); x.beginPath(); x.ellipse(CX, 268, 168, 178, 0, 0, Math.PI * 2); x.clip();
    x.drawImage(img, CX - 168, 268 - 178, 336, 356);
    const g = x.createRadialGradient(CX, 268, 120, CX, 268, 178); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, look.body + '00');
    x.restore();
    // 가장자리를 피부색으로 부드럽게
    const rg = x.createRadialGradient(CX, 268, 130, CX, 268, 182);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, look.body);
    x.fillStyle = rg; x.beginPath(); x.ellipse(CX, 268, 182, 192, 0, 0, Math.PI * 2); x.fill();
    drawExtra(x, look.extra);
    return;
  }
  // 치비 비율: 이목구비를 크게
  x.save(); x.translate(256, 252); x.scale(1.55, 1.55); x.translate(-256, -250);
  drawCheeks(x, look.cheeks);
  for (const s of [-1, 1]) { drawEye(x, CX + s * EX, s, look); drawBrow(x, CX + s * EX, s, look.brows); }
  // 작은 콩알 코 (빨간 코 · 마스크를 쓰면 생략)
  if (look.extra !== 'clown' && look.extra !== 'mask') { ell(x, CX, MY - 34, 7, 5, 'rgba(200,110,110,.55)'); ell(x, CX - 2, MY - 36, 2.5, 2, 'rgba(255,255,255,.6)'); }
  drawMouth(x, look.mouth);
  drawExtra(x, look.extra);
  x.restore();
}

// ───────────────────────── 아바타 생성
export function createAvatar(look) {
  look = { ...DEFAULT_LOOK, ...look };
  const g = new THREE.Group();
  // 피부는 아주 살짝 스스로 빛나게: 어두운 맵에서도 얼굴이 뭉개지지 않고 말랑해 보인다
  const skin = mat(look.body, { roughness: 0.55, emissive: look.body, emissiveIntensity: 0.07 });
  const accent = mat(look.accent);
  const dark = mat('#231a1f');
  const white = mat('#ffffff');
  const hairM = mat(look.hairColor, { roughness: 0.55 });

  const rig = new THREE.Group();
  g.add(rig);
  // 1.5등신: 키가 머리(지름 약 0.8) 한 개 반 정도. 머리 아래 작은 몸통 · 짧은 다리
  const SD = { body: 0.65, hip: 0.28, head: 0.8 };
  const upper = new THREE.Group(); upper.scale.setScalar(SD.body); upper.position.y = SD.head - 1.08 * SD.body; rig.add(upper);

  // 몸통 · 다리 · 팔 (옷 색은 의상이 정한다)
  const O = outfitColors(look);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.22, 12, 32), mat(O.top));
  torso.position.y = 0.52; upper.add(torso);
  const legs = [];
  for (const s of [-1, 1]) {
    // 엉덩이 높이에서 땅까지 내려오는 긴 다리 (허벅지 · 무릎 · 종아리 · 신발)
    const H = SD.hip; const pivot = new THREE.Group(); pivot.position.set(0.12 * s, H, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, H * 0.4, 8, 24), mat(O.legs)); thigh.position.y = -H * 0.45; pivot.add(thigh);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 20), mat(O.shoes, { roughness: 0.45 })); shoe.scale.set(1, 0.6, 1.4); shoe.position.set(0, -H + 0.05, 0.035); pivot.add(shoe);
    // 신발 밑창 + 앞코 반짝임
    const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.108, 0.024, 28), mat('#f4efe6', { roughness: 0.8 })); sole.scale.set(1, 1, 1.4); sole.position.set(0, -H + 0.012, 0.035); pivot.add(sole);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.024, 19, 13), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 })); shine.position.set(-0.03 * s, -H + 0.085, 0.15); pivot.add(shine);
    rig.add(pivot); legs.push(pivot);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(0.3 * s, 0.68, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 8, 24), mat(O.sleeve)); arm.position.set(0.035 * s, -0.15, 0); arm.rotation.z = 0.32 * s; pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 38, 26), skin); hand.position.set(0.09 * s, -0.31, 0); pivot.add(hand);
    // 벙어리장갑 같은 엄지
    const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.031, 22, 16), skin); thumb.position.set(0.07 * s, -0.28, 0.05); pivot.add(thumb);
    // 소매 끝 단 (옷 색보다 살짝 밝게)
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.017, 16, 38), mat(a2(O.sleeve))); cuff.position.set(0.078 * s, -0.258, 0); cuff.rotation.order = 'ZXY'; cuff.rotation.set(Math.PI / 2, 0, 0.32 * s); pivot.add(cuff);
    upper.add(pivot); arms.push(pivot);
  }
  // 허리 아래: 다리와 몸통 사이 엉덩이 (반바지처럼 옷 아랫단 색)
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.25, 51, 32, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), mat(O.legs)); hips.scale.set(0.65, 0.45, 0.65); hips.position.y = SD.hip + 0.03; rig.add(hips);
  addOutfit(upper, look, O);
  const accFx = addAccessory(upper, arms, look);

  // 머리
  const head = new THREE.Group(); head.position.y = SD.head; rig.add(head);
  const inner = new THREE.Group(); inner.scale.set(1.08, 0.95, 1); head.add(inner);
  inner.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 64, 48), skin));
  // 목
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 38), skin); neck.position.y = -0.4; head.add(neck);

  // 얼굴 텍스처
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 4;
  const faceMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.423, 64, 48, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.75, 1.5),
    new THREE.MeshStandardMaterial({ map: ftex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  faceMesh.renderOrder = 2;
  inner.add(faceMesh);
  let photoImg = null, curExpr = null, blinking = false;
  const redraw = () => { const l = curExpr ? { ...look, ...EXPR[curExpr] } : look; drawFace(fc, blinking ? { ...l, eyes: 'blink' } : l, photoImg); ftex.needsUpdate = true; };
  // 눈 깜빡임: 눈을 뜬 표정일 때만 (웃는 눈 · 감은 눈 · 사진 얼굴은 그대로)
  const BLINKABLE = new Set(['dot', 'big', 'sparkle', 'teary', 'cat', 'star', 'heart', 'angry']);
  const setBlink = (on) => { if (on === blinking) return; const e = (curExpr && EXPR[curExpr]?.eyes) || look.eyes; if (on && (look.photoOn || !BLINKABLE.has(e))) return; blinking = on; redraw(); };
  redraw();
  if (look.photoOn && look.photo) {
    const img = new Image();
    img.onload = () => { photoImg = img; redraw(); };
    img.src = look.photo;
  }

  addHair(inner, head, look, hairM);
  addEars(head, look, skin, accent);
  if (look.hat !== 'none') addHat(head, look, accent, white);
  else addOutfitHeadwear(head, look);

  // 발밑 그림자
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.015; g.add(blob);

  g.traverse((o) => { if (o.isMesh && o !== blob && o !== faceMesh) o.castShadow = true; });
  g.userData = { rig, legs, arms, head, torso, phase: Math.random() * 6, blob, crouch: 0, expr: null, accFx, blinkT: 1 + Math.random() * 3, setBlink,
    setExpr: (e) => { curExpr = e && EXPR[e] ? e : null; blinking = false; redraw(); } };
  return g;
}

function outfitColors(l) {
  const a = l.accent;
  const map = {
    plain: { top: a, legs: l.body, shoes: '#3a2a2a', sleeve: l.body },
    sailor: { top: '#f5f5f2', legs: l.body, shoes: '#1d1d22', sleeve: '#f5f5f2' },
    blazer: { top: '#1f2a4a', legs: '#4a4f5c', shoes: '#1d1d22', sleeve: '#1f2a4a' },
    hanbok: { top: a, legs: a, shoes: '#f2ece0', sleeve: a },
    shaman: { top: '#f4f1ea', legs: '#c0262d', shoes: '#f2ece0', sleeve: '#f4f1ea' },
    reaper: { top: '#141418', legs: '#141418', shoes: '#0a0a0c', sleeve: '#141418' },
    priest: { top: '#17171c', legs: '#17171c', shoes: '#0a0a0c', sleeve: '#17171c' },
    nurse: { top: '#f7f9fb', legs: '#f4e8e6', shoes: '#f7f9fb', sleeve: '#f7f9fb' },
    detective: { top: '#b89a6a', legs: '#4a3a2c', shoes: '#3a2414', sleeve: '#b89a6a' },
    cowboy: { top: '#c8b090', legs: '#3a5a8a', shoes: '#5a3418', sleeve: '#c8b090' },
    kimono: { top: a, legs: a, shoes: '#f4efe6', sleeve: a },
    maid: { top: '#1c1c24', legs: l.body, shoes: '#1c1c24', sleeve: '#1c1c24' },
    hoodie: { top: '#3b2a5c', legs: '#3d5a8a', shoes: '#f2f2f2', sleeve: '#3b2a5c' },
    pajama: { top: a, legs: a, shoes: a, sleeve: a },
    police: { top: '#1f2f5a', legs: '#1a2440', shoes: '#111', sleeve: '#1f2f5a' },
    doctor: { top: '#f7f9fb', legs: '#4a6a8a', shoes: '#f2f2f2', sleeve: '#f7f9fb' },
    chef: { top: '#fbfbf8', legs: '#2a2a2e', shoes: '#111', sleeve: '#fbfbf8' },
    firefighter: { top: '#3a2a1a', legs: '#3a2a1a', shoes: '#111', sleeve: '#3a2a1a' },
    pirate: { top: '#f2ece0', legs: '#2a2a3a', shoes: '#3a2414', sleeve: '#f2ece0' },
    witch: { top: '#2a1a3a', legs: '#2a1a3a', shoes: '#111', sleeve: '#2a1a3a' },
    vampire: { top: '#111114', legs: '#111114', shoes: '#000', sleeve: '#111114' },
    mummy: { top: '#e8e0c8', legs: '#e0d8c0', shoes: '#c8bea4', sleeve: '#e8e0c8' },
    astronaut: { top: '#f2f2f4', legs: '#e8e8ec', shoes: '#9a9aa4', sleeve: '#f2f2f4' },
    ninja: { top: '#16161c', legs: '#16161c', shoes: '#0a0a0c', sleeve: '#16161c' },
    santa: { top: '#c0262d', legs: '#c0262d', shoes: '#111', sleeve: '#c0262d' },
    raincoat: { top: '#f2c81a', legs: '#3d5a8a', shoes: '#f2c81a', sleeve: '#f2c81a' },
    tracksuit: { top: '#2a6a3a', legs: '#2a6a3a', shoes: '#f2f2f2', sleeve: '#2a6a3a' },
    dino: { top: '#5fbf6a', legs: '#5fbf6a', shoes: '#5fbf6a', sleeve: '#5fbf6a' },
    clown: { top: '#f6f2ea', legs: '#f6f2ea', shoes: '#d6303a', sleeve: '#f6f2ea' },
    ringmaster: { top: '#a0101e', legs: '#f4f1ea', shoes: '#111', sleeve: '#a0101e' },
    magician: { top: '#121218', legs: '#121218', shoes: '#0a0a0c', sleeve: '#121218' },
    knight: { top: '#b8bec8', legs: '#9aa0aa', shoes: '#6a707a', sleeve: '#b8bec8' },
    princess: { top: a, legs: a, shoes: '#f4e8f0', sleeve: '#fff0f6' },
    gothic: { top: '#16101a', legs: '#16101a', shoes: '#0a0a0c', sleeve: '#16101a' },
    wizard: { top: '#2a3a8a', legs: '#2a3a8a', shoes: '#3a2414', sleeve: '#2a3a8a' },
    idol: { top: '#f4f4f8', legs: '#1c1c24', shoes: '#f4f4f8', sleeve: '#f4f4f8' },
    hiphop: { top: a, legs: '#3a4a6a', shoes: '#f2f2f2', sleeve: a },
    explorer: { top: '#c8b48a', legs: '#7a6a4a', shoes: '#4a3420', sleeve: '#c8b48a' },
    bee: { top: '#f2c81a', legs: '#f2c81a', shoes: '#1a1a1a', sleeve: '#1a1a1a' },
    panda: { top: '#f8f8f6', legs: '#1a1a1e', shoes: '#1a1a1e', sleeve: '#1a1a1e' },
  };
  return map[l.outfit] || map.plain;
}

function addOutfit(rig, l, O) {
  const add = (geo, c, x, y, z, rx = 0, ry = 0, rz = 0, o) => { const m = new THREE.Mesh(geo, mat(c, o)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); rig.add(m); return m; };
  const skirt = (c, top, bot, h, y) => add(new THREE.CylinderGeometry(top, bot, h, 32, 1, true), c, 0, y, 0, 0, 0, 0, { side: THREE.DoubleSide });
  switch (l.outfit) {
    case 'cowboy':
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.16, 0.34, 0.05), '#6a4426', 0.11 * s, 0.56, 0.24);
      add(new THREE.BoxGeometry(0.58, 0.06, 0.5), '#3a2414', 0, 0.36, 0); add(new THREE.BoxGeometry(0.1, 0.07, 0.03), '#d8b04a', 0, 0.36, 0.26, 0, 0, 0, { metalness: 0.8 });
      add(new THREE.TorusGeometry(0.16, 0.03, 10, 26), '#c0262d', 0, 0.8, 0.12, Math.PI / 2 - 0.4);
      break;
    case 'kimono':
      skirt(l.accent, 0.27, 0.34, 0.5, 0.3);
      add(new THREE.CylinderGeometry(0.29, 0.29, 0.14, 32), '#f2e6c8', 0, 0.56, 0);
      add(new THREE.BoxGeometry(0.3, 0.12, 0.08), '#f2e6c8', 0, 0.56, -0.28);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.03, 0.3, 0.02), '#ffffff', 0.05 * s, 0.72, 0.26, 0, 0, 0.5 * s);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.26, 0.24), l.accent, 0.38 * s, 0.5, 0);
      break;
    case 'plain': add(new THREE.SphereGeometry(0.2, 26, 19), l.body, 0, 0.5, 0.15).scale.set(1, 1.05, 0.55); break;
    case 'clown':
      skirt('#f6f2ea', 0.3, 0.42, 0.42, 0.32);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(new THREE.CircleGeometry(0.035, 10), ['#d6303a', '#2f5fd0', '#ffd36a'][i % 3], Math.sin(a) * 0.3, 0.42 + (i % 3) * 0.12, Math.cos(a) * 0.3, 0, a, 0, { side: THREE.DoubleSide }); }
      add(new THREE.TorusGeometry(0.27, 0.07, 10, 29), '#ffffff', 0, 0.84, 0, Math.PI / 2);
      for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.035, 13, 10), '#d6303a', 0, 0.72 - i * 0.12, 0.28);
      break;
    case 'ringmaster':
      add(new THREE.BoxGeometry(0.18, 0.36, 0.03), '#ffd36a', 0, 0.6, 0.27, 0, 0, 0, { metalness: 0.4 });
      for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.02, 10, 6), '#ffd36a', 0.12, 0.74 - i * 0.09, 0.28, 0, 0, 0, { metalness: 0.9 });
      add(new THREE.BoxGeometry(0.46, 0.4, 0.04), '#7a0814', 0, 0.2, -0.3, 0.25);
      add(new THREE.BoxGeometry(0.12, 0.05, 0.03), '#111', 0, 0.8, 0.27);
      break;
    case 'magician':
      add(new THREE.BoxGeometry(0.16, 0.34, 0.03), '#f4f4f0', 0, 0.62, 0.27);
      add(new THREE.BoxGeometry(0.12, 0.05, 0.03), '#c0262d', 0, 0.8, 0.28);
      add(new THREE.CylinderGeometry(0.3, 0.52, 0.85, 32, 1, true, Math.PI * 0.6, Math.PI * 0.8), '#121218', 0, 0.42, -0.02, 0, 0, 0, { side: THREE.DoubleSide });
      add(new THREE.CylinderGeometry(0.29, 0.5, 0.8, 32, 1, true, Math.PI * 0.62, Math.PI * 0.76), '#7a0a2a', 0, 0.42, 0, 0, 0, 0, { side: THREE.DoubleSide });
      break;
    case 'knight':
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 29), '#c8ccd4', 0, 0.6, 0, 0, 0, 0, { metalness: 0.8, roughness: 0.25 });
      add(new THREE.BoxGeometry(0.2, 0.22, 0.03), '#c0262d', 0, 0.6, 0.3);
      add(new THREE.BoxGeometry(0.04, 0.16, 0.035), '#ffd36a', 0, 0.62, 0.315, 0, 0, 0, { metalness: 0.8 }); add(new THREE.BoxGeometry(0.12, 0.04, 0.035), '#ffd36a', 0, 0.65, 0.315, 0, 0, 0, { metalness: 0.8 });
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.13, 19, 13, 0, Math.PI * 2, 0, Math.PI / 2), '#c8ccd4', 0.33 * s, 0.76, 0, 0, 0, 0.4 * s, { metalness: 0.8, roughness: 0.25 });
      skirt('#9aa0aa', 0.28, 0.36, 0.2, 0.3);
      break;
    case 'princess':
      skirt(l.accent, 0.27, 0.56, 0.6, 0.27);
      skirt('#fff0f6', 0.4, 0.58, 0.12, 0.27);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(new THREE.SphereGeometry(0.025, 10, 6), '#ffd36a', Math.sin(a) * 0.5, 0.3, Math.cos(a) * 0.5, 0, 0, 0, { metalness: 0.8 }); }
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.09, 16, 13), '#fff0f6', 0.3 * s, 0.8, 0);
      add(new THREE.SphereGeometry(0.035, 13, 10), '#ff8fd0', 0, 0.72, 0.28, 0, 0, 0, { emissive: '#ff4fb0', emissiveIntensity: 0.5 });
      break;
    case 'gothic':
      skirt('#16101a', 0.27, 0.5, 0.58, 0.28);
      for (let i = 0; i < 3; i++) skirt(i % 2 ? '#2a1a2a' : '#4a0a1a', 0.42 + i * 0.03, 0.5 + i * 0.03, 0.05, 0.3 + i * 0.06);
      add(new THREE.TorusGeometry(0.26, 0.04, 10, 29), '#e8e0f0', 0, 0.83, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.03, 0.12, 0.015), '#c0c4cc', 0, 0.62, 0.285, 0, 0, 0, { metalness: 0.8 }); add(new THREE.BoxGeometry(0.08, 0.025, 0.015), '#c0c4cc', 0, 0.65, 0.287, 0, 0, 0, { metalness: 0.8 });
      break;
    case 'wizard':
      skirt('#2a3a8a', 0.28, 0.48, 0.6, 0.27);
      for (let i = 0; i < 9; i++) { const a = (i * 2.4) % (Math.PI * 2); add(new THREE.OctahedronGeometry(0.03), '#ffd36a', Math.sin(a) * 0.38, 0.3 + (i % 3) * 0.15, Math.cos(a) * 0.38, 0, 0, 0, { emissive: '#ffcc33', emissiveIntensity: 0.8 }); }
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 29), '#ffd36a', 0, 0.56, 0, 0, 0, 0, { metalness: 0.6 });
      break;
    case 'idol':
      add(new THREE.BoxGeometry(0.5, 0.06, 0.34), '#ffd36a', 0, 0.84, 0, 0, 0, 0, { metalness: 0.6, emissive: '#aa8800', emissiveIntensity: 0.3 });
      for (let i = 0; i < 12; i++) add(new THREE.CircleGeometry(0.02, 6), ['#ff8fd0', '#9ad0ff', '#ffffff'][i % 3], -0.15 + (i % 4) * 0.1, 0.5 + Math.floor(i / 4) * 0.1, 0.285, 0, 0, 0, { emissive: '#ffffff', emissiveIntensity: 0.5, metalness: 0.8 });
      skirt('#1c1c24', 0.27, 0.36, 0.2, 0.3);
      add(new THREE.BoxGeometry(0.03, 0.1, 0.03), '#333', 0.12, 0.92, 0.22); add(new THREE.SphereGeometry(0.03, 13, 10), '#333', 0.12, 0.98, 0.24);
      break;
    case 'hiphop':
      add(new THREE.BoxGeometry(0.56, 0.08, 0.4), '#f2f2f2', 0, 0.28, 0);
      add(new THREE.TorusGeometry(0.17, 0.02, 10, 29), '#ffd36a', 0, 0.68, 0.16, Math.PI / 2 - 0.5, 0, 0, { metalness: 0.9, roughness: 0.2 });
      add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 19), '#ffd36a', 0, 0.55, 0.29, Math.PI / 2, 0, 0, { metalness: 0.9 });
      break;
    case 'explorer':
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.1, 0.04), '#a8946a', 0.12 * s, 0.62, 0.27);
      add(new THREE.BoxGeometry(0.58, 0.07, 0.48), '#5a4020', 0, 0.36, 0); add(new THREE.BoxGeometry(0.06, 0.6, 0.02), '#5a4020', 0.08, 0.6, 0.28, 0, 0, 0.6);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 19), '#3a3a40', 0.24, 0.4, 0.22, Math.PI / 2, 0, 0); add(new THREE.CircleGeometry(0.05, 12), '#cfe8ff', 0.24, 0.4, 0.275);
      break;
    case 'bee':
      for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.295, 0.295, 0.07, 32), '#1a1a1a', 0, 0.4 + i * 0.16, 0);
      for (const s of [-1, 1]) { const w = add(new THREE.SphereGeometry(0.2, 19, 13), '#e8f4ff', 0.2 * s, 0.7, -0.32, 0, 0, 0, { transparent: true, opacity: 0.6 }); w.scale.set(0.5, 1, 0.2); w.rotation.z = 0.5 * s; }
      add(new THREE.ConeGeometry(0.06, 0.16, 13), '#1a1a1a', 0, 0.32, -0.3, -1.6, 0, 0);
      break;
    case 'panda':
      add(new THREE.SphereGeometry(0.2, 26, 19), '#ffffff', 0, 0.52, 0.15).scale.set(1, 1.05, 0.55);
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 29), '#1a1a1e', 0, 0.78, 0);
      add(new THREE.SphereGeometry(0.08, 16, 13), '#1a1a1e', 0, 0.3, -0.3);
      break;
    case 'sailor':
      add(new THREE.BoxGeometry(0.46, 0.2, 0.05), '#1f2f5a', 0, 0.74, -0.24);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.08, 0.26, 0.04), '#1f2f5a', 0.1 * s, 0.66, 0.25, 0.25, 0, 0.5 * s);
      add(new THREE.ConeGeometry(0.06, 0.12, 6), '#d6303a', 0, 0.6, 0.29, Math.PI, 0, 0);
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.05, 13, 10), '#d6303a', 0.05 * s, 0.67, 0.28).scale.set(1.3, 0.7, 0.5);
      skirt('#1f2f5a', 0.27, 0.4, 0.22, 0.33);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(new THREE.BoxGeometry(0.01, 0.2, 0.02), '#16224a', Math.sin(a) * 0.34, 0.33, Math.cos(a) * 0.34, 0, a, 0); }
      break;
    case 'blazer':
      add(new THREE.BoxGeometry(0.16, 0.22, 0.03), '#f5f5f2', 0, 0.62, 0.26);
      add(new THREE.BoxGeometry(0.05, 0.2, 0.02), '#a3262d', 0, 0.6, 0.285);
      add(new THREE.BoxGeometry(0.08, 0.06, 0.02), '#e8c170', -0.15, 0.62, 0.25, 0, 0, 0, { metalness: 0.6 });
      for (let i = 0; i < 2; i++) add(new THREE.SphereGeometry(0.018, 13, 10), '#e8c170', 0.09, 0.5 - i * 0.08, 0.27, 0, 0, 0, { metalness: 0.7 });
      break;
    case 'hanbok':
      add(new THREE.CylinderGeometry(0.29, 0.29, 0.12, 32), a2(l.accent), 0, 0.64, 0);
      add(new THREE.BoxGeometry(0.04, 0.22, 0.02), '#c0262d', 0.07, 0.56, 0.28, 0, 0, 0.2);
      skirt(l.accent === '#ff8fab' ? '#4a6cd4' : '#c0262d', 0.28, 0.48, 0.58, 0.29);
      add(new THREE.CylinderGeometry(0.06, 0.08, 0.04, 19), '#e8c170', 0.3, 0.58, 0);
      break;
    case 'shaman':
      skirt('#c0262d', 0.28, 0.46, 0.5, 0.27);
      add(new THREE.BoxGeometry(0.5, 0.06, 0.32), '#2f5fd0', 0, 0.58, 0);
      for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.03, 0.4, 0.01), ['#2f5fd0', '#c9302c', '#d8b02a', '#ffffff', '#151515'][i], -0.12 + i * 0.06, 0.25, 0.3);
      break;
    case 'reaper':
      skirt('#141418', 0.28, 0.5, 0.62, 0.28);
      add(new THREE.BoxGeometry(0.06, 0.06, 0.02), '#c9302c', 0, 0.68, 0.28);
      break;
    case 'priest':
      skirt('#17171c', 0.27, 0.42, 0.58, 0.28);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 26), '#ffffff', 0, 0.82, 0);
      add(new THREE.BoxGeometry(0.03, 0.12, 0.015), '#e8c170', 0, 0.55, 0.285, 0, 0, 0, { metalness: 0.8 });
      add(new THREE.BoxGeometry(0.08, 0.025, 0.015), '#e8c170', 0, 0.57, 0.287, 0, 0, 0, { metalness: 0.8 });
      break;
    case 'nurse':
      skirt('#f7f9fb', 0.27, 0.36, 0.22, 0.32);
      add(new THREE.BoxGeometry(0.1, 0.03, 0.01), '#d6303a', 0, 0.66, 0.28); add(new THREE.BoxGeometry(0.03, 0.1, 0.01), '#d6303a', 0, 0.66, 0.28);
      break;
    case 'detective':
      skirt('#b89a6a', 0.28, 0.4, 0.32, 0.28);
      add(new THREE.BoxGeometry(0.56, 0.05, 0.36), '#5a3a22', 0, 0.42, 0);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.09, 0.26, 0.03), '#a08354', 0.08 * s, 0.62, 0.26, 0, 0, 0.35 * s);
      break;
    case 'maid':
      skirt('#1c1c24', 0.27, 0.42, 0.26, 0.31);
      add(new THREE.BoxGeometry(0.3, 0.38, 0.02), '#ffffff', 0, 0.36, 0.3);
      add(new THREE.BoxGeometry(0.26, 0.04, 0.03), '#ffffff', 0, 0.82, 0.18);
      add(new THREE.ConeGeometry(0.06, 0.1, 6), '#ffffff', 0, 0.74, 0.27, Math.PI);
      break;
    case 'hoodie': {
      const hood = add(new THREE.SphereGeometry(0.24, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2), '#3b2a5c', 0, 0.78, -0.2, -1.2, 0, 0); hood.scale.set(1.2, 1, 0.7);
      add(new THREE.BoxGeometry(0.3, 0.12, 0.03), '#2e2048', 0, 0.42, 0.27);
      add(new THREE.CylinderGeometry(0.01, 0.01, 0.16), '#f2f2f2', -0.06, 0.66, 0.27); add(new THREE.CylinderGeometry(0.01, 0.01, 0.16), '#f2f2f2', 0.06, 0.66, 0.27);
      add(new THREE.CircleGeometry(0.06, 16), '#ff4d6d', 0.12, 0.62, 0.275);
      break;
    }
    case 'police':
      add(new THREE.BoxGeometry(0.06, 0.08, 0.02), '#e8c170', 0.12, 0.66, 0.27, 0, 0, 0, { metalness: 0.8 });
      add(new THREE.BoxGeometry(0.56, 0.05, 0.36), '#111', 0, 0.38, 0);
      for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.018, 13, 10), '#e8c170', 0, 0.68 - i * 0.1, 0.275, 0, 0, 0, { metalness: 0.8 });
      break;
    case 'doctor':
      add(new THREE.CylinderGeometry(0.29, 0.38, 0.5, 29, 1, true), '#f7f9fb', 0, 0.2, 0, 0, 0, 0, { side: THREE.DoubleSide });
      add(new THREE.BoxGeometry(0.14, 0.24, 0.02), '#7ab0d8', 0, 0.6, 0.27);
      { const st = add(new THREE.TorusGeometry(0.11, 0.012, 10, 26, Math.PI), '#333', 0, 0.75, 0.24); st.rotation.z = Math.PI; }
      break;
    case 'chef':
      add(new THREE.BoxGeometry(0.34, 0.4, 0.02), '#f2f2ee', 0, 0.3, 0.29);
      for (let i = 0; i < 2; i++) for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.02, 13, 10), '#333', 0.07 * sx, 0.7 - i * 0.1, 0.275);
      add(new THREE.ConeGeometry(0.06, 0.1, 10), '#d6303a', 0, 0.78, 0.25, Math.PI);
      break;
    case 'firefighter':
      for (const y of [0.4, 0.62]) add(new THREE.CylinderGeometry(0.285, 0.285, 0.04, 29), '#e8e04a', 0, y, 0, 0, 0, 0, { emissive: '#665', emissiveIntensity: 0.6 });
      add(new THREE.BoxGeometry(0.3, 0.36, 0.12), '#5a5a5e', 0, 0.48, -0.3);
      break;
    case 'pirate':
      add(new THREE.BoxGeometry(0.56, 0.08, 0.36), '#8a2a1a', 0, 0.42, 0);
      for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.3, 0.03), '#2a1a10', 0.15 * sx, 0.6, 0.26, 0, 0, 0.2 * sx);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), '#e8c170', 0, 0.42, 0.19, Math.PI / 2, 0, 0, { metalness: 0.8 });
      break;
    case 'witch':
      skirt('#2a1a3a', 0.28, 0.48, 0.58, 0.28);
      add(new THREE.BoxGeometry(0.08, 0.08, 0.02), '#9b59b6', 0, 0.66, 0.28, 0, 0, Math.PI / 4, { emissive: '#9b59b6', emissiveIntensity: 0.6 });
      break;
    case 'vampire': {
      const cape = add(new THREE.CylinderGeometry(0.3, 0.55, 0.85, 32, 1, true, Math.PI * 0.6, Math.PI * 0.8), '#7a0a14', 0, 0.42, -0.02, 0, 0, 0, { side: THREE.DoubleSide });
      add(new THREE.CylinderGeometry(0.34, 0.3, 0.16, 29, 1, true, Math.PI * 0.55, Math.PI * 0.9), '#111', 0, 0.82, 0, 0, 0, 0, { side: THREE.DoubleSide });
      add(new THREE.BoxGeometry(0.1, 0.18, 0.02), '#f2f2f2', 0, 0.66, 0.27);
      add(new THREE.SphereGeometry(0.03, 13, 10), '#c0262d', 0, 0.73, 0.28, 0, 0, 0, { emissive: '#600', emissiveIntensity: 0.6 });
      break;
    }
    case 'mummy':
      for (let i = 0; i < 9; i++) { const b = add(new THREE.TorusGeometry(0.28, 0.025, 6, 29), '#d8ceb4', 0, 0.3 + i * 0.07, 0); b.rotation.set(Math.PI / 2 + (i % 2 ? 0.15 : -0.15), 0, 0); }
      break;
    case 'astronaut':
      add(new THREE.BoxGeometry(0.24, 0.16, 0.04), '#c8ccd4', 0, 0.6, 0.27);
      for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.018, 13, 10), ['#d6303a', '#2fbf71', '#3b7dd8'][i], -0.06 + i * 0.06, 0.62, 0.3, 0, 0, 0, { emissive: ['#d6303a', '#2fbf71', '#3b7dd8'][i], emissiveIntensity: 1.5 });
      add(new THREE.BoxGeometry(0.4, 0.45, 0.18), '#e8e8ec', 0, 0.42, -0.3);
      add(new THREE.CircleGeometry(0.05, 12), '#3b7dd8', -0.18, 0.7, 0.26);
      break;
    case 'ninja':
      add(new THREE.CylinderGeometry(0.29, 0.29, 0.06, 29), '#c0262d', 0, 0.42, 0);
      { const sw = add(new THREE.BoxGeometry(0.04, 0.7, 0.04), '#333', 0.1, 0.65, -0.3, 0, 0, 0.6); add(new THREE.BoxGeometry(0.1, 0.03, 0.06), '#c9a24a', 0.0, 0.5, -0.3, 0, 0, 0.6); }
      break;
    case 'santa':
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 29), '#f4f4f0', 0, 0.28, 0);
      add(new THREE.BoxGeometry(0.06, 0.4, 0.02), '#f4f4f0', 0, 0.5, 0.275);
      add(new THREE.BoxGeometry(0.56, 0.06, 0.36), '#111', 0, 0.42, 0); add(new THREE.BoxGeometry(0.1, 0.08, 0.02), '#e8c170', 0, 0.42, 0.19, 0, 0, 0, { metalness: 0.8 });
      break;
    case 'raincoat':
      add(new THREE.CylinderGeometry(0.29, 0.4, 0.35, 29, 1, true), '#f2c81a', 0, 0.2, 0, 0, 0, 0, { side: THREE.DoubleSide, roughness: 0.25 });
      for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.02, 13, 10), '#c89a10', 0, 0.68 - i * 0.12, 0.275);
      break;
    case 'tracksuit':
      for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.02, 0.45, 0.02), '#f2f2f2', 0.27 * sx, 0.5, 0.05);
      add(new THREE.BoxGeometry(0.16, 0.06, 0.01), '#f2f2f2', -0.1, 0.66, 0.28);
      add(new THREE.BoxGeometry(0.01, 0.3, 0.01), '#d8d8d8', 0, 0.58, 0.28);
      break;
    case 'dino':
      add(new THREE.SphereGeometry(0.2, 26, 19), '#d8f0c8', 0, 0.5, 0.15).scale.set(1, 1.05, 0.55);
      { const tail = add(new THREE.ConeGeometry(0.14, 0.5, 16), '#5fbf6a', 0, 0.3, -0.42, -1.2, 0, 0); }
      for (let i = 0; i < 4; i++) add(new THREE.ConeGeometry(0.05, 0.1, 6), '#f28a3a', 0, 0.75 - i * 0.12, -0.27 - i * 0.02, -0.6, 0, 0);
      break;
    case 'pajama':
      add(new THREE.SphereGeometry(0.2, 26, 19), '#fff1e6', 0, 0.5, 0.15).scale.set(1, 1.05, 0.55);
      add(new THREE.SphereGeometry(0.07, 16, 13), O.top, 0, 0.36, -0.27);
      for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.02, 13, 10), '#fff', 0, 0.7 - i * 0.1, 0.27);
      break;
  }
}
const a2 = (c) => '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.45).getHexString();

function seg(r, phiS, phiL, thS, thL) { return new THREE.SphereGeometry(r, 51, 26, phiS, phiL, thS, thL); }
const FRONT = Math.PI / 2;
function addHair(inner, head, l, m) {
  if (l.hair === 'none') return;
  const add = (geo, x = 0, y = 0, z = 0) => { const h = new THREE.Mesh(geo, m); h.position.set(x, y, z); inner.add(h); return h; };
  const back = (th) => add(seg(0.44, FRONT + 0.85, Math.PI * 2 - 1.7, 0, th));
  add(seg(0.442, 0, Math.PI * 2, 0, Math.PI * 0.3));
  const bangs = (low, wavy) => {
    const b = add(seg(0.447, FRONT - 0.9, 1.8, Math.PI * 0.26, low - Math.PI * 0.26));
    // 앞머리 끝을 둥글게 (작은 구 몇 개)
    if (wavy) for (let i = -2; i <= 2; i++) { const a = FRONT + i * 0.32; const th = low - 0.05; const r = 0.445; const t = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 13), m); t.position.set(-Math.cos(a) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(a) * Math.sin(th) * r); t.scale.set(1, 0.7, 0.5); inner.add(t); }
    return b;
  };
  switch (l.hair) {
    case 'short': back(Math.PI * 0.55); bangs(Math.PI * 0.36, true); break;
    case 'bob': back(Math.PI * 0.72); bangs(Math.PI * 0.4); for (const s of [-1, 1]) { const sd = add(new THREE.CapsuleGeometry(0.1, 0.22, 4, 10), s * 0.38, -0.12, 0.05); sd.scale.z = 0.7; } break;
    case 'long': back(Math.PI * 0.7); bangs(Math.PI * 0.38); { const p = add(new THREE.CapsuleGeometry(0.3, 0.5, 6, 12), 0, -0.45, -0.2); p.scale.set(1.15, 1, 0.45); } for (const s of [-1, 1]) add(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), s * 0.38, -0.3, 0.05); break;
    case 'twintail': back(Math.PI * 0.6); bangs(Math.PI * 0.38, true); for (const s of [-1, 1]) { const t = add(new THREE.CapsuleGeometry(0.11, 0.42, 6, 10), s * 0.55, -0.22, -0.08); t.rotation.z = 0.3 * s; const tie = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 13), mat(l.accent)); tie.position.set(s * 0.47, 0.08, -0.08); inner.add(tie); } break;
    case 'ponytail': back(Math.PI * 0.6); bangs(Math.PI * 0.36); { const t = add(new THREE.CapsuleGeometry(0.12, 0.42, 6, 10), 0, -0.05, -0.5); t.rotation.x = 0.5; } break;
    case 'bun': back(Math.PI * 0.55); bangs(Math.PI * 0.34); add(new THREE.SphereGeometry(0.17, 26, 19), 0, 0.46, -0.08); break;
    case 'spiky': back(Math.PI * 0.55); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 10), m); const a = (i / 9) * Math.PI * 2; c.position.set(Math.cos(a) * 0.26, 0.36, Math.sin(a) * 0.26 - 0.03); c.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); inner.add(c); } bangs(Math.PI * 0.34, true); break;
    case 'bowl': back(Math.PI * 0.6); bangs(Math.PI * 0.42); break;
  }
  // 정수리의 동그란 머릿결 광택 (천사링)
  const hl = new THREE.Mesh(seg(0.4485, FRONT - 0.85, 1.7, Math.PI * 0.16, Math.PI * 0.04), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false }));
  hl.renderOrder = 1; inner.add(hl);
}

function addEars(head, l, skin, accent) {
  const add = (geo, m, x, y, z) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); head.add(e); return e; };
  for (const s of [-1, 1]) {
    if (l.ears === 'bear') { const e = add(new THREE.SphereGeometry(0.12, 22, 16), skin, 0.31 * s, 0.31, -0.02); e.scale.z = 0.6; const i = new THREE.Mesh(new THREE.SphereGeometry(0.07, 19, 13), accent); i.position.z = 0.05; i.scale.z = 0.4; e.add(i); }
    if (l.ears === 'bunny') { const e = add(new THREE.CapsuleGeometry(0.075, 0.32, 4, 10), skin, 0.15 * s, 0.52, -0.04); e.rotation.z = -0.15 * s; const i = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.24, 4, 8), accent); i.position.z = 0.04; i.scale.z = 0.5; e.add(i); }
    if (l.ears === 'cat' || l.ears === 'fox') { const e = add(new THREE.ConeGeometry(l.ears === 'fox' ? 0.14 : 0.12, l.ears === 'fox' ? 0.3 : 0.2, 6), skin, 0.25 * s, 0.4, 0); e.rotation.z = -0.35 * s; const i = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), accent); i.position.set(0, -0.02, 0.04); e.add(i); }
    if (l.ears === 'devil') { const e = add(new THREE.ConeGeometry(0.06, 0.22, 16), mat('#7a1020'), 0.2 * s, 0.44, 0.05); e.rotation.z = -0.4 * s; }
  }
}

function addHat(head, l, accent, white) {
  const add = (geo, m, x, y, z) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); head.add(e); return e; };
  switch (l.hat) {
    case 'beanie': add(new THREE.SphereGeometry(0.455, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.2), accent, 0, 0.06, 0); add(new THREE.SphereGeometry(0.09, 19, 16), white, 0, 0.52, 0); add(new THREE.TorusGeometry(0.44, 0.04, 13, 38), accent, 0, 0.12, 0).rotation.x = Math.PI / 2; break;
    case 'ribbon': for (const s of [-1, 1]) { const w = add(new THREE.ConeGeometry(0.1, 0.18, 16), accent, 0.24 + 0.09 * s, 0.35, 0.08); w.rotation.z = (Math.PI / 2) * s; } add(new THREE.SphereGeometry(0.05, 16, 13), accent, 0.24, 0.35, 0.08); break;
    case 'sprout': add(new THREE.CylinderGeometry(0.012, 0.012, 0.16), mat('#5fa44a'), 0, 0.48, 0); for (const s of [-1, 1]) { const lf = add(new THREE.SphereGeometry(0.07, 16, 13), mat('#7dcc5a'), 0.06 * s, 0.57, 0); lf.scale.set(1, 0.4, 0.6); lf.rotation.z = 0.5 * s; } break;
    case 'cap': add(new THREE.SphereGeometry(0.45, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.4), accent, 0, 0.05, 0); add(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 32, 1, false, -Math.PI / 2, Math.PI), accent, 0, 0.17, 0.3); break;
    case 'halo': { const h = add(new THREE.TorusGeometry(0.22, 0.03, 13, 38), mat('#ffe58a', { emissive: '#ffd34d', emissiveIntensity: 1.5 }), 0, 0.62, 0); h.rotation.x = Math.PI / 2; break; }
    case 'crown': add(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 16, 1, true), mat('#f1c40f', { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }), 0, 0.45, 0); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; add(new THREE.ConeGeometry(0.04, 0.1, 10), mat('#f1c40f', { metalness: 0.7 }), Math.cos(a) * 0.16, 0.54, Math.sin(a) * 0.16); } break;
    case 'tophat': add(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 28), mat('#16141a'), 0, 0.36, 0); add(new THREE.CylinderGeometry(0.24, 0.25, 0.42, 38), mat('#16141a'), 0, 0.58, 0); add(new THREE.CylinderGeometry(0.255, 0.255, 0.07, 38), accent, 0, 0.42, 0); break;
    case 'beret': { const b = add(new THREE.SphereGeometry(0.4, 35, 19), accent, 0.06, 0.36, -0.02); b.scale.set(1.05, 0.28, 1.05); b.rotation.z = -0.22; add(new THREE.CylinderGeometry(0.015, 0.02, 0.07, 10), accent, 0.1, 0.46, 0); break; }
    case 'headphones': { const band = add(new THREE.TorusGeometry(0.47, 0.035, 13, 38, Math.PI), mat('#2a2a30'), 0, 0.02, 0); for (const s of [-1, 1]) { const c = add(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 29), accent, 0.47 * s, 0.0, 0); c.rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 22), mat('#1a1a1e'), 0.49 * s, 0, 0).rotation.z = Math.PI / 2; } break; }
    case 'catband': { add(new THREE.TorusGeometry(0.44, 0.02, 10, 38, Math.PI), mat('#1a1a1e'), 0, 0.04, 0.04); for (const s of [-1, 1]) { const e = add(new THREE.ConeGeometry(0.11, 0.2, 6), mat('#1a1a1e'), 0.24 * s, 0.44, 0.04); e.rotation.z = -0.4 * s; const i = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 6), accent); i.position.set(0, -0.02, 0.04); e.add(i); } break; }
    case 'tiara': { const tr = add(new THREE.TorusGeometry(0.3, 0.018, 10, 38, Math.PI), mat('#e8e8f0', { metalness: 0.9, roughness: 0.2 }), 0, 0.3, 0.12); tr.rotation.x = -0.5; for (let i = -1; i <= 1; i++) add(new THREE.OctahedronGeometry(i ? 0.035 : 0.055), mat(i ? '#9ad0ff' : '#ff6b9a', { metalness: 0.4, roughness: 0.1, emissive: i ? '#2a5a8a' : '#8a1a3a', emissiveIntensity: 0.6 }), i * 0.16, 0.5 - Math.abs(i) * 0.05, 0.22 - Math.abs(i) * 0.03); break; }
    case 'strawhat': add(new THREE.CylinderGeometry(0.64, 0.66, 0.03, 30), mat('#e8cf8a'), 0, 0.3, 0); add(new THREE.CylinderGeometry(0.29, 0.32, 0.22, 38), mat('#e8cf8a'), 0, 0.4, 0); add(new THREE.CylinderGeometry(0.325, 0.325, 0.06, 38), mat('#c0262d'), 0, 0.33, 0); break;
    case 'frog': { const h = add(new THREE.SphereGeometry(0.47, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.2), mat('#5fbf5a'), 0, 0.03, -0.02); for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.1, 22, 16), white, 0.18 * s, 0.48, 0.14); add(new THREE.SphereGeometry(0.05, 16, 13), mat('#111'), 0.18 * s, 0.5, 0.23); } break; }
    case 'mushroom': { const c = add(new THREE.SphereGeometry(0.5, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d6303a'), 0, 0.18, 0); c.scale.set(1.15, 0.75, 1.15); for (let i = 0; i < 7; i++) { const a = i * 0.9, r = i ? 0.33 : 0; add(new THREE.SphereGeometry(0.06, 16, 13), white, Math.cos(a) * r, 0.5 - (r > 0 ? 0.12 : 0), Math.sin(a) * r).scale.y = 0.4; } break; }
    case 'flower': for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; add(new THREE.SphereGeometry(0.05, 13, 10), mat('#ffb3c7'), 0.28 + Math.cos(a) * 0.06, 0.3 + Math.sin(a) * 0.06, 0.18); } add(new THREE.SphereGeometry(0.04, 13, 10), mat('#ffd43b'), 0.28, 0.3, 0.2); break;
  }
}
// ───────────────────────── 몸 장신구 (목·등·손). 움직임이 필요한 것은 함수로 돌려준다.
function addAccessory(rig, arms, l) {
  if (!l.acc || l.acc === 'none') return null;
  const add = (geo, m, x, y, z, parent = rig) => { const e = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); e.position.set(x, y, z); e.castShadow = true; parent.add(e); return e; };
  const gold = mat('#e8c170', { metalness: 0.8, roughness: 0.3 });
  const neck = (r = 0.285, y = 0.75) => { const t = add(new THREE.TorusGeometry(r, 0.012, 10, 45), gold, 0, y, 0.02); t.rotation.x = Math.PI / 2 - 0.3; return t; };
  switch (l.acc) {
    case 'necklace': for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; add(new THREE.SphereGeometry(0.034, 13, 10), mat('#f6f2ea', { roughness: 0.2, metalness: 0.1 }), Math.sin(a) * 0.29, 0.76 - Math.max(0, Math.cos(a)) * 0.1, Math.cos(a) * 0.28 + 0.02); } break;
    case 'pendant': { neck(); add(new THREE.BoxGeometry(0.035, 0.15, 0.025), gold, 0, 0.56, 0.29); add(new THREE.BoxGeometry(0.1, 0.035, 0.025), gold, 0, 0.59, 0.29); break; }
    case 'bell': { const c = add(new THREE.TorusGeometry(0.29, 0.04, 13, 45), mat('#d6303a'), 0, 0.76, 0.01); c.rotation.x = Math.PI / 2 - 0.15; add(new THREE.SphereGeometry(0.07, 22, 16), gold, 0, 0.66, 0.31); add(new THREE.BoxGeometry(0.07, 0.01, 0.02), mat('#5a3a10'), 0, 0.645, 0.375); break; }
    case 'scarf': { const c = add(new THREE.TorusGeometry(0.29, 0.08, 16, 38), mat(l.accent), 0, 0.77, 0.01); c.rotation.x = Math.PI / 2; const tl = add(new THREE.BoxGeometry(0.14, 0.34, 0.06), mat(l.accent), 0.13, 0.5, 0.3); tl.rotation.z = 0.12; add(new THREE.BoxGeometry(0.145, 0.035, 0.065), white(), 0.115, 0.37, 0.3); break; }
    case 'bowtie': { for (const s of [-1, 1]) { const w = add(new THREE.ConeGeometry(0.07, 0.14, 6), mat(l.accent), 0.075 * s, 0.72, 0.31); w.rotation.z = (Math.PI / 2) * s; } add(new THREE.SphereGeometry(0.035, 13, 10), mat(l.accent), 0, 0.72, 0.33); break; }
    case 'backpack': { add(new THREE.BoxGeometry(0.42, 0.46, 0.2), mat(l.accent, { roughness: 0.7 }), 0, 0.58, -0.33); add(new THREE.BoxGeometry(0.3, 0.16, 0.06), mat(l.accent), 0, 0.45, -0.45); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.05, 0.42, 0.04), mat('#2a2a30'), 0.15 * s, 0.6, 0.24).rotation.x = 0.12; break; }
    case 'wings': case 'batwings': {
      const bat = l.acc === 'batwings';
      const shape = new THREE.Shape();
      if (bat) { shape.moveTo(0, 0); shape.lineTo(0.55, 0.32); shape.lineTo(0.5, 0.05); shape.lineTo(0.38, 0.12); shape.lineTo(0.3, -0.08); shape.lineTo(0.18, 0.02); shape.closePath(); }
      else { shape.moveTo(0, 0); shape.bezierCurveTo(0.2, 0.45, 0.55, 0.5, 0.6, 0.25); shape.bezierCurveTo(0.5, 0.05, 0.3, -0.12, 0, -0.08); }
      const m = mat(bat ? '#3a1a3a' : '#ffffff', bat ? { side: THREE.DoubleSide } : { side: THREE.DoubleSide, emissive: '#fff6e0', emissiveIntensity: 0.35 });
      const ws = [-1, 1].map((s) => { const piv = new THREE.Group(); piv.position.set(0.06 * s, 0.72, -0.26); rig.add(piv); const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), m); w.scale.set(s, 1, 1); w.castShadow = true; piv.add(w); piv.userData.s = s; return piv; });
      return (t) => ws.forEach((p) => (p.rotation.y = p.userData.s * (0.3 + Math.sin(t * (bat ? 7 : 3.2)) * 0.2)));
    }
    case 'cape': { const c = add(new THREE.CylinderGeometry(0.29, 0.46, 0.78, 29, 1, true, Math.PI - 1.25, 2.5), mat(l.accent === '#ffffff' ? '#8e1c17' : l.accent, { side: THREE.DoubleSide, roughness: 0.6 }), 0, 0.48, -0.02); const col = add(new THREE.TorusGeometry(0.29, 0.03, 10, 32), gold, 0, 0.76, 0.01); col.rotation.x = Math.PI / 2; return (t, moving) => { c.rotation.x = moving ? -0.18 + Math.sin(t * 9) * 0.04 : Math.sin(t * 1.5) * 0.02; }; }
    case 'tail': {
      const piv = new THREE.Group(); piv.position.set(0, 0.32, -0.24); rig.add(piv);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.02, -0.2), new THREE.Vector3(0, 0.2, -0.32), new THREE.Vector3(0.04, 0.42, -0.28)]);
      const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.045, 8), mat(l.hairColor || l.body)); tail.castShadow = true; piv.add(tail);
      return (t, moving) => { piv.rotation.z = Math.sin(t * (moving ? 9 : 2.4)) * 0.35; };
    }
    case 'balloon': {
      const piv = new THREE.Group(); piv.position.set(0.38, 0.42, 0.05); rig.add(piv);
      add(new THREE.CylinderGeometry(0.004, 0.004, 1.35, 6), mat('#eeeeee'), 0.06, 0.68, 0, piv).rotation.z = -0.09;
      const b = add(new THREE.SphereGeometry(0.2, 29, 22), mat(l.accent, { roughness: 0.25, emissive: l.accent, emissiveIntensity: 0.25 }), 0.12, 1.5, 0, piv); b.scale.y = 1.15; b.castShadow = false;
      add(new THREE.ConeGeometry(0.03, 0.05, 10), mat(l.accent), 0.12, 1.26, 0, piv).rotation.x = Math.PI;
      return (t, moving) => { piv.rotation.z = Math.sin(t * 1.4) * 0.08 + (moving ? 0.12 : 0); piv.rotation.x = moving ? 0.25 : Math.sin(t * 1.1) * 0.05; };
    }
    case 'teddy': {
      const g = new THREE.Group(); g.position.set(0.02, 0.52, 0.3); rig.add(g); const fur = mat('#a0652e'), lite = mat('#e8c9a0');
      add(new THREE.SphereGeometry(0.11, 19, 16), fur, 0, 0, 0, g).scale.set(1, 1.1, 0.85); add(new THREE.SphereGeometry(0.09, 19, 16), fur, 0, 0.16, 0.02, g);
      add(new THREE.SphereGeometry(0.04, 13, 10), lite, 0, 0.14, 0.1, g); for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.035, 13, 10), fur, 0.07 * s, 0.24, 0, g); add(new THREE.SphereGeometry(0.012, 10, 6), mat('#111'), 0.035 * s, 0.18, 0.09, g); }
      for (const s of [-1, 1]) arms[(s + 1) / 2].children[0].rotation.x = -0.9;
      break;
    }
    case 'lantern': {
      const h = arms[0]; const g = new THREE.Group(); g.position.set(-0.08, -0.33, 0.04); h.add(g);
      add(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 6), mat('#333'), 0, 0.02, 0, g);
      add(new THREE.SphereGeometry(0.1, 22, 16), mat('#ff5a3a', { emissive: '#ff6a2a', emissiveIntensity: 1.6, transparent: true, opacity: 0.92 }), 0, -0.1, 0, g).scale.y = 1.25;
      for (const y of [0.03, -0.23]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), mat('#2a1a10'), 0, y - 0.1 + 0.1, 0, g);
      return (t, moving) => { g.rotation.x = Math.sin(t * (moving ? 10 : 2)) * 0.25; };
    }
  }
  return null;
}
const white = () => mat('#f4f4f0');
function addOutfitHeadwear(head, l) {
  const add = (geo, c, x, y, z, o) => { const e = new THREE.Mesh(geo, mat(c, o)); e.position.set(x, y, z); head.add(e); return e; };
  if (l.outfit === 'reaper') { add(new THREE.CylinderGeometry(0.62, 0.62, 0.02, 32), '#0d0d10', 0, 0.3, 0, { transparent: true, opacity: 0.85 }); add(new THREE.CylinderGeometry(0.2, 0.24, 0.3, 32), '#0d0d10', 0, 0.45, 0); }
  if (l.outfit === 'shaman') { add(new THREE.CylinderGeometry(0.3, 0.42, 0.2, 32), '#c0262d', 0, 0.42, 0); }
  if (l.outfit === 'nurse') { add(new THREE.BoxGeometry(0.34, 0.12, 0.2), '#ffffff', 0, 0.42, 0.06); add(new THREE.BoxGeometry(0.08, 0.025, 0.01), '#d6303a', 0, 0.43, 0.165); add(new THREE.BoxGeometry(0.025, 0.08, 0.01), '#d6303a', 0, 0.43, 0.165); }
  if (l.outfit === 'detective') { add(new THREE.CylinderGeometry(0.5, 0.5, 0.025, 28), '#5a3a22', 0, 0.3, 0); add(new THREE.CylinderGeometry(0.28, 0.31, 0.22, 32), '#6b4a2e', 0, 0.42, 0); add(new THREE.CylinderGeometry(0.312, 0.312, 0.05, 32), '#2a1a10', 0, 0.34, 0); }
  if (l.outfit === 'cowboy') { add(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 28), '#8a5a2a', 0, 0.3, 0).scale.z = 0.85; add(new THREE.CylinderGeometry(0.26, 0.3, 0.28, 32), '#8a5a2a', 0, 0.45, 0); add(new THREE.CylinderGeometry(0.305, 0.305, 0.05, 32), '#3a2414', 0, 0.36, 0); }
  if (l.outfit === 'kimono') { add(new THREE.CylinderGeometry(0.12, 0.16, 0.18, 22), l.hairColor || '#1a1414', 0, 0.42, -0.16); for (const s of [-1, 1]) { const p = add(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 10), '#d8b04a', 0.12 * s, 0.46, -0.1, { metalness: 0.8 }); p.rotation.z = Math.PI / 2 - 0.3 * s; } add(new THREE.SphereGeometry(0.07, 16, 13), '#d02a34', 0.2, 0.46, -0.06); }
  if (l.outfit === 'maid') { add(new THREE.BoxGeometry(0.5, 0.06, 0.08), '#ffffff', 0, 0.36, 0.08).rotation.x = -0.4; }
  if (l.outfit === 'pajama') { const h = add(new THREE.SphereGeometry(0.47, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.1), l.accent, 0, 0.02, -0.04); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.11, 19, 16), l.accent, 0.3 * s, 0.36, -0.04); }
  if (l.outfit === 'police') { add(new THREE.CylinderGeometry(0.38, 0.36, 0.14, 32), '#1f2f5a', 0, 0.38, 0); add(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 32, 1, false, -Math.PI / 2, Math.PI), '#111', 0, 0.32, 0.22); add(new THREE.BoxGeometry(0.08, 0.08, 0.02), '#e8c170', 0, 0.42, 0.37, { metalness: 0.8 }); }
  if (l.outfit === 'chef') { add(new THREE.CylinderGeometry(0.3, 0.28, 0.22, 29), '#fbfbf8', 0, 0.42, 0); add(new THREE.SphereGeometry(0.36, 26, 16), '#fbfbf8', 0, 0.6, 0).scale.y = 0.55; }
  if (l.outfit === 'firefighter') { add(new THREE.SphereGeometry(0.47, 35, 19, 0, Math.PI * 2, 0, Math.PI / 2.2), '#c0262d', 0, 0.06, 0, { roughness: 0.3 }); add(new THREE.CylinderGeometry(0.55, 0.55, 0.03, 38), '#a01a20', 0, 0.12, -0.05); add(new THREE.BoxGeometry(0.12, 0.14, 0.03), '#e8c170', 0, 0.4, 0.42, { metalness: 0.8 }); }
  if (l.outfit === 'pirate') { const h = add(new THREE.CylinderGeometry(0.45, 0.5, 0.18, 5), '#1a1418', 0, 0.42, 0); h.rotation.y = Math.PI; add(new THREE.CircleGeometry(0.06, 12), '#f2f2f2', 0, 0.44, 0.27); }
  if (l.outfit === 'witch') { add(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 28), '#2a1a3a', 0, 0.32, 0); const c = add(new THREE.ConeGeometry(0.3, 0.75, 32), '#2a1a3a', 0, 0.7, -0.03); c.rotation.x = -0.2; add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 32), '#9b59b6', 0, 0.38, 0); }
  if (l.outfit === 'vampire') { /* 맨머리 + 망토 깃 */ }
  if (l.outfit === 'mummy') { for (let i = 0; i < 5; i++) { const b = add(new THREE.TorusGeometry(0.44, 0.025, 6, 35), '#d8ceb4', 0, 0.3 - i * 0.06, 0); b.rotation.set(Math.PI / 2 + (i % 2 ? 0.25 : -0.25), 0, 0); } }
  if (l.outfit === 'astronaut') { add(new THREE.SphereGeometry(0.56, 38, 29), '#cfe8ff', 0, 0, 0.02, { transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.3 }); add(new THREE.TorusGeometry(0.42, 0.05, 13, 38), '#c8ccd4', 0, -0.4, 0).rotation.x = Math.PI / 2; }
  if (l.outfit === 'ninja') { const m = add(new THREE.SphereGeometry(0.455, 38, 22, 0, Math.PI * 2, 0, Math.PI), '#16161c', 0, 0, 0); m.scale.set(1.06, 0.97, 1.02); m.material.side = THREE.BackSide; add(new THREE.BoxGeometry(0.5, 0.06, 0.06), '#c0262d', 0, 0.2, 0.36); }
  if (l.outfit === 'santa') { const c = add(new THREE.ConeGeometry(0.42, 0.6, 32), '#c0262d', 0.08, 0.6, 0); c.rotation.z = -0.4; add(new THREE.TorusGeometry(0.4, 0.07, 13, 35), '#f4f4f0', 0, 0.32, 0).rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.09, 16, 13), '#f4f4f0', 0.32, 0.82, 0); }
  if (l.outfit === 'raincoat') { const h = add(new THREE.SphereGeometry(0.5, 35, 22, 0, Math.PI * 2, 0, Math.PI / 1.6), '#f2c81a', 0, 0.02, -0.06, { roughness: 0.25 }); h.rotation.x = 0.45; h.position.z = -0.12; }
  if (l.outfit === 'tracksuit') { add(new THREE.BoxGeometry(0.62, 0.07, 0.04), '#f2f2f2', 0, 0.22, 0.32); }
  if (l.outfit === 'dino') { add(new THREE.SphereGeometry(0.5, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.1), '#5fbf6a', 0, 0.02, -0.05); for (let i = 0; i < 4; i++) add(new THREE.ConeGeometry(0.07, 0.16, 6), '#f28a3a', 0, 0.52 - i * 0.02, -0.05 - i * 0.14); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.06, 16, 13), '#ffffff', 0.18 * s, 0.4, 0.3); }
  if (l.outfit === 'clown') { for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.17, 19, 16), '#ff4a1a', 0.42 * s, 0.05, -0.05).scale.set(0.9, 1.1, 1.3); const c = add(new THREE.ConeGeometry(0.16, 0.42, 22), '#2f5fd0', 0.1, 0.62, 0); c.rotation.z = -0.3; add(new THREE.SphereGeometry(0.06, 16, 13), '#ffd36a', 0.18, 0.84, 0); }
  if (l.outfit === 'ringmaster') { add(new THREE.CylinderGeometry(0.5, 0.5, 0.025, 28), '#0a0a0e', 0, 0.36, 0); add(new THREE.CylinderGeometry(0.26, 0.26, 0.5, 35), '#0a0a0e', 0, 0.62, 0); add(new THREE.CylinderGeometry(0.265, 0.265, 0.08, 35), '#a0101e', 0, 0.42, 0); }
  if (l.outfit === 'magician') { add(new THREE.CylinderGeometry(0.5, 0.5, 0.025, 28), '#121218', 0, 0.36, 0); add(new THREE.CylinderGeometry(0.25, 0.25, 0.46, 35), '#121218', 0, 0.6, 0); add(new THREE.CylinderGeometry(0.255, 0.255, 0.06, 35), '#7a0a2a', 0, 0.41, 0); const r = add(new THREE.SphereGeometry(0.07, 16, 13), '#ffffff', 0.18, 0.86, 0); r.scale.set(0.8, 1.2, 0.8); }
  if (l.outfit === 'knight') { const h = add(new THREE.SphereGeometry(0.5, 38, 26, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI / 1.7), '#c8ccd4', 0, 0, -0.02, { metalness: 0.8, roughness: 0.25 }); h.material.side = THREE.DoubleSide; add(new THREE.BoxGeometry(0.06, 0.4, 0.06), '#c0262d', 0, 0.62, -0.1); const pl = add(new THREE.ConeGeometry(0.1, 0.4, 13), '#c0262d', 0, 0.68, -0.2); pl.rotation.x = -1.0; }
  if (l.outfit === 'princess') { for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI - Math.PI / 2; add(new THREE.ConeGeometry(0.05, 0.16, 6), '#ffd36a', Math.sin(a) * 0.2, 0.52, Math.cos(a) * 0.2 - 0.05, { metalness: 0.9, roughness: 0.2 }); } add(new THREE.TorusGeometry(0.22, 0.025, 10, 32), '#ffd36a', 0, 0.45, -0.05, { metalness: 0.9 }).rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.04, 13, 10), '#ff4fb0', 0, 0.54, 0.16, { emissive: '#ff2a90', emissiveIntensity: 0.8 }); }
  if (l.outfit === 'gothic') { add(new THREE.BoxGeometry(0.46, 0.08, 0.12), '#16101a', 0, 0.42, 0.06).rotation.x = -0.3; for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.08, 16, 13), '#4a0a1a', 0.22 * s, 0.44, 0.06).scale.set(1.4, 0.8, 0.6); }
  if (l.outfit === 'wizard') { add(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 28), '#2a3a8a', 0, 0.32, 0); const c = add(new THREE.ConeGeometry(0.32, 0.85, 32), '#2a3a8a', 0, 0.75, -0.04); c.rotation.x = -0.25; for (let i = 0; i < 4; i++) add(new THREE.OctahedronGeometry(0.035), '#ffd36a', Math.sin(i * 1.7) * 0.18, 0.5 + i * 0.12, 0.12 - i * 0.05, { emissive: '#ffcc33', emissiveIntensity: 0.9 }); }
  if (l.outfit === 'idol') { add(new THREE.TorusGeometry(0.46, 0.025, 10, 38, Math.PI), '#222', 0, 0.12, 0).rotation.y = Math.PI / 2; add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10), '#222', 0.3, -0.15, 0.3).rotation.x = 1.0; add(new THREE.SphereGeometry(0.03, 13, 10), '#222', 0.18, -0.25, 0.42); }
  if (l.outfit === 'hiphop') { const c = add(new THREE.SphereGeometry(0.47, 35, 19, 0, Math.PI * 2, 0, Math.PI / 2.3), l.accent, 0, 0.08, 0); c.rotation.y = Math.PI; add(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 32, 1, false, -Math.PI / 2, Math.PI), l.accent, 0, 0.18, -0.38).rotation.y = Math.PI; }
  if (l.outfit === 'explorer') { add(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 28), '#c8b48a', 0, 0.3, 0); add(new THREE.SphereGeometry(0.34, 29, 16, 0, Math.PI * 2, 0, Math.PI / 2), '#c8b48a', 0, 0.3, 0); add(new THREE.CylinderGeometry(0.345, 0.345, 0.05, 32), '#5a4020', 0, 0.34, 0); }
  if (l.outfit === 'bee') { add(new THREE.SphereGeometry(0.47, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.1), '#f2c81a', 0, 0.02, -0.04); for (const s of [-1, 1]) { const an = add(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10), '#1a1a1a', 0.14 * s, 0.6, 0); an.rotation.z = -0.35 * s; add(new THREE.SphereGeometry(0.05, 16, 13), '#1a1a1a', 0.2 * s, 0.75, 0); } }
  if (l.outfit === 'panda') { add(new THREE.SphereGeometry(0.47, 38, 22, 0, Math.PI * 2, 0, Math.PI / 2.1), '#f8f8f6', 0, 0.02, -0.04); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.12, 19, 16), '#1a1a1e', 0.3 * s, 0.38, -0.04); }
  if (l.outfit === 'priest') { /* 맨머리 */ }
}

// 감정표현(이모트) 목록: [id, 이름, 아이콘, 지속시간(초, 0=계속)]
export const EMOTES = [
  ['wave', '인사', '👋', 2.5], ['dance', '춤추기', '💃', 0], ['spin', '빙글빙글', '🌀', 0], ['jump', '뛰기', '⬆️', 0.7],
  ['lie', '엎드리기', '🛌', 0], ['sit', '앉기', '🪑', 0], ['clap', '박수', '👏', 2.5], ['heart', '하트', '🫶', 2.5],
  ['boo', '놀래키기', '👻', 1.3], ['shiver', '덜덜', '🥶', 0], ['bow', '꾸벅', '🙇', 2],
];
// 감정표현별 표정 (눈 · 입 · 눈썹 · 볼). 사진 얼굴일 때는 사진이 그대로 유지된다
export const EXPR = {
  wave: { eyes: 'smile', mouth: 'open', brows: 'soft' },
  dance: { eyes: 'star', mouth: 'grin', brows: 'soft', cheeks: 'blush' },
  spin: { eyes: 'dizzy', mouth: 'o', brows: 'worried' },
  // jump: 점프할 때는 표정(눈)을 바꾸지 않는다
  lie: { eyes: 'sleepy', mouth: 'cat', brows: 'soft' },
  sit: { eyes: 'closed', mouth: 'smile', brows: 'soft', cheeks: 'blush' },
  clap: { eyes: 'smile', mouth: 'grin', brows: 'soft' },
  heart: { eyes: 'heart', mouth: 'cat', brows: 'soft', cheeks: 'hearts' },
  boo: { eyes: 'angry', mouth: 'open', brows: 'angry' },
  shiver: { eyes: 'teary', mouth: 'flat', brows: 'worried', cheeks: 'none' },
  bow: { eyes: 'closed', mouth: 'smile', brows: 'soft' },
};
export const EMOTE_DUR = Object.fromEntries(EMOTES.map((e) => [e[0], e[3]]));

export function animateAvatar(g, dt, moving, t, crouch = false, emote = null, et = 0) {
  const u = g.userData;
  if (moving) u.phase += dt * (crouch ? 7 : 11);
  const s = moving ? Math.sin(u.phase) : 0;
  const L = u.legs, A = u.arms, rig = u.rig, head = u.head;
  // 기본 자세
  L[0].rotation.set(s * 0.7, 0, 0); L[1].rotation.set(-s * 0.7, 0, 0);
  A[0].rotation.set(-s * 0.6, 0, 0); A[1].rotation.set(s * 0.6, 0, 0);
  u.crouch += ((crouch ? 1 : 0) - u.crouch) * Math.min(1, dt * 10);
  let y = (moving ? Math.abs(Math.sin(u.phase)) * 0.07 : Math.sin(t * 2 + u.phase) * 0.012) - u.crouch * 0.12;
  // 웅크리면 무릎을 굽힌다
  if (u.crouch > 0.01) { L[0].rotation.x -= u.crouch * 0.9; L[1].rotation.x -= u.crouch * 0.9; }
  let rx = u.crouch * 0.25, ry = 0, rz = 0;
  head.rotation.set(0, 0, moving ? Math.sin(u.phase * 0.5) * 0.05 : Math.sin(t * 1.3 + u.phase) * 0.04);
  head.scale.setScalar(1);
  if (u.accFx) u.accFx(t, moving);
  // 숨쉬기 (몸통이 아주 살짝 부풀었다 줄어든다) + 눈 깜빡임
  if (u.torso) u.torso.scale.set(1 + Math.sin(t * 2.2 + u.phase) * 0.012, 1 + Math.sin(t * 2.2 + u.phase) * 0.02, 1);
  if (u.setBlink) { u.blinkT -= dt; if (u.blinkT < 0) { u.blinkOn = !u.blinkOn; u.setBlink(u.blinkOn); u.blinkT = u.blinkOn ? 0.13 : 2.4 + Math.random() * 3.2; } }
  if (emote && (!moving || emote === 'jump')) {
    const w = Math.sin(et * 10);
    switch (emote) {
      case 'wave': A[1].rotation.z = 2.6 + w * 0.35; head.rotation.z = 0.15; break;
      case 'dance': {
        const b = Math.sin(et * 7);
        y = Math.abs(b) * 0.12; ry = Math.sin(et * 3.5) * 0.6; rz = b * 0.12;
        A[0].rotation.z = -2.2 + Math.sin(et * 7) * 0.6; A[1].rotation.z = 2.2 + Math.sin(et * 7 + Math.PI) * 0.6;
        L[0].rotation.x = Math.max(0, b) * 0.8; L[1].rotation.x = Math.max(0, -b) * 0.8; head.rotation.z = b * 0.2; break;
      }
      case 'spin': ry = et * 9; A[0].rotation.z = -1.4; A[1].rotation.z = 1.4; y = 0.05; break;
      case 'jump': { const k = Math.min(1, et / 0.7); y = Math.sin(Math.PI * k) * 0.9; A[0].rotation.z = -2.6 * Math.sin(Math.PI * k); A[1].rotation.z = 2.6 * Math.sin(Math.PI * k); L[0].rotation.x = -0.5 * Math.sin(Math.PI * k); L[1].rotation.x = -0.5 * Math.sin(Math.PI * k); break; }
      case 'lie': rx = 1.45; y = 0.36; A[0].rotation.x = -2.8; A[1].rotation.x = -2.8; L[0].rotation.x = Math.sin(et * 4) * 0.4 + 0.2; L[1].rotation.x = -Math.sin(et * 4) * 0.4 + 0.2; head.rotation.x = -0.6; break;
      case 'sit': y = 0.15; L[0].rotation.x = -1.5; L[1].rotation.x = -1.5; A[0].rotation.x = -0.4; A[1].rotation.x = -0.4; head.rotation.z = Math.sin(t * 1.2) * 0.08; break;
      case 'clap': { const c = Math.abs(Math.sin(et * 12)); A[0].rotation.x = -1.3; A[1].rotation.x = -1.3; A[0].rotation.z = -0.2 - c * 0.5; A[1].rotation.z = 0.2 + c * 0.5; y = c * 0.03; break; }
      case 'heart': A[0].rotation.z = -2.7; A[1].rotation.z = 2.7; A[0].rotation.x = -0.3; A[1].rotation.x = -0.3; head.rotation.z = Math.sin(et * 3) * 0.15; y = Math.abs(Math.sin(et * 3)) * 0.05; break;
      case 'boo': { const k = Math.min(1, et / 0.25); A[0].rotation.z = -2.5 * k; A[1].rotation.z = 2.5 * k; A[0].rotation.x = -0.8 * k; A[1].rotation.x = -0.8 * k; rx = 0.35 * k; head.scale.setScalar(1 + 0.25 * k * (et < 0.8 ? 1 : 0)); y = 0.15 * k; break; }
      case 'shiver': rz = Math.sin(t * 60) * 0.04; A[0].rotation.set(-1.2, 0, 0.9); A[1].rotation.set(-1.2, 0, -0.9); y = -0.06; head.rotation.x = 0.2; break;
      case 'bow': { const k = Math.sin(Math.min(1, et / 1.2) * Math.PI); rx = 0.9 * k; break; }
    }
  }
  rig.position.y = y; rig.rotation.set(rx, ry, rz);
  // 손전등: 웅크리면 몸이 앞으로 숙여져 빛이 몸 안에 갇히므로, 몸보다 앞·아래로 옮긴다
  if (g.userData.spot) { g.userData.spot.position.set(0, 0.78 - u.crouch * 0.2, 0.4 + u.crouch * 0.25); g.userData.beam?.position.copy(g.userData.spot.position); }
  // 감정표현 중에는 표정도 바뀐다
  const want = emote && (!moving || emote === 'jump') ? emote : null;
  if (u.expr !== want) { u.expr = want; u.setExpr?.(want); }
}

// 캔버스 텍스트 스프라이트
export function textSprite(text, { color = '#fff', bg = 'rgba(0,0,0,0.6)', size = 32, maxW = 440, stroke = null, border = null, tail = false } = {}) {
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  const font = `900 ${size}px "Gowun Dodum", "Malgun Gothic", sans-serif`;
  x.font = font;
  const lines = wrap(x, text, maxW);
  const w = Math.min(maxW, Math.max(...lines.map((l) => x.measureText(l).width))) + 34;
  const th = tail ? 14 : 0;
  const h = lines.length * (size + 10) + 20 + th;
  c.width = Math.ceil(w); c.height = Math.ceil(h);
  x.font = font;
  x.fillStyle = bg; roundRect(x, 2, 2, c.width - 4, c.height - 4 - th, 16); x.fill();
  if (border) { x.strokeStyle = border; x.lineWidth = 3; roundRect(x, 2, 2, c.width - 4, c.height - 4 - th, 16); x.stroke(); }
  if (tail) { x.fillStyle = bg; x.beginPath(); x.moveTo(c.width / 2 - 12, c.height - th - 4); x.lineTo(c.width / 2, c.height - 2); x.lineTo(c.width / 2 + 12, c.height - th - 4); x.fill(); if (border) { x.strokeStyle = border; x.lineWidth = 3; x.beginPath(); x.moveTo(c.width / 2 - 12, c.height - th - 3); x.lineTo(c.width / 2, c.height - 2); x.lineTo(c.width / 2 + 12, c.height - th - 3); x.stroke(); } }
  x.textAlign = 'center'; x.textBaseline = 'top'; x.lineJoin = 'round';
  lines.forEach((l, i) => {
    const ty = 12 + i * (size + 10);
    // 외곽선을 같은 색으로 한 번 더 그려 글자를 두껍게
    x.strokeStyle = stroke || color; x.lineWidth = stroke ? 6 : 2.2; x.strokeText(l, c.width / 2, ty);
    x.fillStyle = color; x.fillText(l, c.width / 2, ty);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, toneMapped: false, fog: false }));
  const k = 0.0038; sp.scale.set(c.width * k, c.height * k, 1); sp.renderOrder = 10;
  return sp;
}
function wrap(x, text, maxW) { const out = []; let line = ''; for (const ch of String(text)) { if (x.measureText(line + ch).width > maxW - 28) { out.push(line); line = ch; } else line += ch; } out.push(line); return out.slice(0, 4); }
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
