// 조사 장면의 글(편지 · 쪽지 · 포스터 · 전단 · 사진 · 장부 …)을 실제 종이처럼 그려서 보여 준다.
// 글 내용은 서버가 보낸 그대로 쓰고, 모양만 바꾼다 (퍼즐 정답·진행에는 영향 없음).

// 소품 종류 → 종이 모양
const BY_PROP = {
  paper: 'note', book: 'diary', poster: 'poster', flyer: 'flyer', notice_board: 'board', photo: 'photo', frame: 'photo',
  scroll: 'scroll', painting: 'portrait', monument: 'stone', tombstone: 'stone', blackboard: 'chalk', tide_board: 'board',
  easel: 'blueprint', map_table: 'blueprint', bus_stop: 'flyer', signpost: 'board',
};
// 제목 낱말 → 종이 모양 (위에서부터 먼저 맞는 것)
const BY_WORD = [
  [/그림일기|크레용|크레파스|그림$|낙서/, 'drawing'],
  [/편지|엽서|전보|진술서/, 'letter'],
  [/쪽지|메모|메시지|경고문/, 'note'],
  [/사진|폴라로이드/, 'photo'],
  [/초상화|신도$|무신도/, 'portrait'],
  [/신문|기사|스크랩/, 'news'],
  [/포스터|전단|광고|공고|수배|안내판|게시판|가사|악보/, 'poster'],
  [/일기|일지|공책|노트|대본|방명록|수첩/, 'diary'],
  [/장부|명부|명단|출석부|차트|기록|계약서|보고서|처방전|순서표|수칙|시간표|숙박부|족보|배치|부호표|이름표|봉투/, 'ledger'],
  [/족자|부적|봉인부/, 'scroll'],
  [/비석|표지석|묘비|기념패|표석/, 'stone'],
  [/칠판/, 'chalk'],
  [/설계도|배선도|지도|안내도/, 'blueprint'],
];
// 소지품(읽기) 아이콘 → 종이 모양
const BY_ICON = { '✉️': 'letter', '📒': 'ledger', '📕': 'ledger', '📔': 'diary', '📓': 'diary', '📄': 'ledger', '📋': 'ledger', '📛': 'ledger', '🖍️': 'drawing', '💊': 'label', '📡': 'ledger', '✴️': 'scroll' };

export function docStyle(title, hint = {}) { return pickStyle(title, hint)?.style || null; }
function pickStyle(title, hint) {
  const t = String(title || '').replace(/^[^\p{L}\p{N}【「"]+/u, '');
  if (hint.item) { for (const [re, s] of BY_WORD) if (re.test(hint.item.name)) return { style: s, src: 'word' }; const byIcon = BY_ICON[hint.item.icon]; return byIcon ? { style: byIcon, src: 'icon' } : null; }
  for (const [re, s] of BY_WORD) if (re.test(t)) return { style: s, src: 'word' };
  return BY_PROP[hint.prop] ? { style: BY_PROP[hint.prop], src: 'prop' } : null;
}

const NARR = /^[^【「"“'‘\s(\[─—━·•\-A-Z].*(다|요|까|네|군|지)[.…!?」"]*$|^[^【「"“'‘\s(\[─—━·•\-A-Z].*[.…]$/;
const isNarration = (p) => { const s = p.trim(); if (!s || s.includes('\n')) return false; if (/(께|에게|님|씨|게|올림|드림)[.,!]?$/.test(s)) return false; return s.length < 160 && NARR.test(s) && !/[:：]/.test(s.slice(0, 8)); };
const HANDWRITTEN = new Set(['letter', 'note', 'diary', 'drawing', 'chalk', 'scroll', 'stone']);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

// 찢긴 아래 가장자리 (매번 조금씩 다른 톱니)
function tornClip(seed, side = 'bottom') {
  let s = seed % 9973; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = [];
  if (side === 'bottom') { pts.push('0% 0%', '100% 0%'); for (let i = 20; i >= 0; i--) pts.push(`${i * 5}% ${96 + r() * 4}%`); }
  else { pts.push('0% 0%'); for (let i = 0; i <= 20; i++) pts.push(`${i * 5}% ${r() * 3}%`); pts.push('100% 100%', '0% 100%'); }
  return `polygon(${pts.join(',')})`;
}

// 사진 · 초상화 · 아이 그림은 캔버스로 그린다
function drawPicture(kind, seed, title, theme) {
  const c = document.createElement('canvas'); c.width = 360; c.height = kind === 'portrait' ? 440 : 280; const x = c.getContext('2d');
  let s = seed % 9973 || 7; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const W = c.width, H = c.height;
  if (kind === 'drawing') {
    x.fillStyle = '#fbf7ec'; x.fillRect(0, 0, W, H);
    const crayon = (col, w, f) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = 0.85; x.beginPath(); f(); x.stroke(); x.globalAlpha = 1; };
    crayon('#ffb000', 6, () => { x.arc(60, 60, 26, 0, 7); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; x.moveTo(60 + Math.cos(a) * 34, 60 + Math.sin(a) * 34); x.lineTo(60 + Math.cos(a) * 48, 60 + Math.sin(a) * 48); } });
    crayon('#3a8a3a', 7, () => { x.moveTo(0, H - 40); for (let i = 0; i <= 12; i++) x.lineTo(i * 30, H - 40 - Math.sin(i) * 6); });
    if (/삐에로|빨간 코|하얀 얼굴|광대/.test(title) || theme === 'clown') {
      crayon('#222', 4, () => { x.ellipse(W / 2, H / 2, 60, 74, 0, 0, 7); });
      x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(W / 2, H / 2, 58, 72, 0, 0, 7); x.fill();
      crayon('#e01020', 10, () => { x.arc(W / 2, H / 2 + 6, 10, 0, 7); }); crayon('#e01020', 6, () => { x.arc(W / 2, H / 2 + 16, 30, 0.2, 2.9); });
      crayon('#1a50e0', 5, () => { x.moveTo(W / 2 - 24, H / 2 - 4); x.lineTo(W / 2 - 26, H / 2 + 22); }); crayon('#222', 6, () => { x.moveTo(W / 2 - 30, H / 2 - 16); x.lineTo(W / 2 - 18, H / 2 - 16); x.moveTo(W / 2 + 18, H / 2 - 16); x.lineTo(W / 2 + 30, H / 2 - 16); });
    } else {
      crayon('#b0201a', 5, () => { x.moveTo(220, H - 40); x.lineTo(220, H - 120); x.lineTo(300, H - 120); x.lineTo(300, H - 40); x.moveTo(210, H - 118); x.lineTo(260, H - 170); x.lineTo(310, H - 118); });
      for (let k = 0; k < 4; k++) { const px = 50 + k * 40; crayon(['#e0207a', '#2060e0', '#20a040', '#a040c0'][k], 4, () => { x.arc(px, H - 104, 11, 0, 7); x.moveTo(px, H - 93); x.lineTo(px, H - 64); x.moveTo(px - 14, H - 84); x.lineTo(px + 14, H - 84); x.moveTo(px, H - 64); x.lineTo(px - 10, H - 44); x.moveTo(px, H - 64); x.lineTo(px + 10, H - 44); }); }
      crayon('#111', 7, () => { x.arc(W - 50, 60, 16, 0, 7); }); // 까맣게 칠한 것
    }
    for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(120,90,40,${R() * 0.05})`; x.fillRect(R() * W, R() * H, 2, 2); }
    return c;
  }
  if (kind === 'portrait') {
    const bg = x.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H / 2, W * 0.8); bg.addColorStop(0, '#5a4a3a'); bg.addColorStop(1, '#140c08'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    // 설명에 맞춰 머리색 · 옷 색을 고른다 (금발 소녀, 선장, 원장, 무신도 …)
    const hairC = /금발/.test(title) ? '#d8b060' : /백발|노인|할머니|할아버지/.test(title) ? '#d8d6cc' : '#22150c';
    const clothC = /하늘색/.test(title) ? '#7aa8d8' : /선장/.test(title) ? '#1c2a3e' : /원장|의사|가운/.test(title) ? '#e4e4de' : /칠성|산신|용왕|바리/.test(title) ? '#9a2a1a' : '#3a2a3a';
    if (/칠성|산신|용왕|바리/.test(title)) { x.fillStyle = 'rgba(40,90,60,.55)'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(232,200,112,.6)'; x.lineWidth = 3; x.strokeRect(10, 10, W - 20, H - 20); }
    x.fillStyle = clothC; x.beginPath(); x.moveTo(W * 0.12, H); x.quadraticCurveTo(W / 2, H * 0.5, W * 0.88, H); x.fill();
    if (/선장|원장|의사/.test(title)) { x.fillStyle = '#f2f0ea'; x.beginPath(); x.moveTo(W / 2 - 22, H * 0.62); x.lineTo(W / 2, H * 0.8); x.lineTo(W / 2 + 22, H * 0.62); x.fill(); }
    x.fillStyle = hairC; x.beginPath(); x.ellipse(W / 2, H * 0.36, 78, 92, 0, 0, 7); x.fill();
    if (/소녀|공주/.test(title)) { x.fillRect(W / 2 - 80, H * 0.36, 34, 150); x.fillRect(W / 2 + 46, H * 0.36, 34, 150); }
    x.fillStyle = '#c8b090'; x.beginPath(); x.ellipse(W / 2, H * 0.4, 64, 82, 0, 0, 7); x.fill();
    x.fillStyle = hairC; x.beginPath(); x.ellipse(W / 2, H * 0.27, 66, 34, 0, Math.PI, 0); x.fill();
    if (/선장/.test(title)) { x.fillStyle = '#141c28'; x.fillRect(W / 2 - 70, H * 0.17, 140, 34); x.fillStyle = '#e8c170'; x.fillRect(W / 2 - 12, H * 0.19, 24, 14); }
    const sh = x.createLinearGradient(W / 2 - 64, 0, W / 2 + 64, 0); sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = sh; x.beginPath(); x.ellipse(W / 2, H * 0.4, 64, 82, 0, 0, 7); x.fill();
    const gouged = /도려|파였|눈이/.test(title);
    for (const sd of [-1, 1]) { x.fillStyle = gouged ? '#050202' : '#2a1a10'; x.beginPath(); x.ellipse(W / 2 + sd * 24, H * 0.37, gouged ? 13 : 9, gouged ? 10 : 6, 0, 0, 7); x.fill(); if (!gouged) { x.fillStyle = '#fff'; x.fillRect(W / 2 + sd * 24 - 1, H * 0.37 + 1, 2, 2); } }
    x.strokeStyle = '#5a2a1a'; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - 20, H * 0.5); x.quadraticCurveTo(W / 2, H * 0.52, W / 2 + 20, H * 0.5); x.stroke();
    // 갈라진 유화 표면
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; for (let i = 0; i < 160; i++) { const px = R() * W, py = R() * H; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - 0.5) * 18, py + (R() - 0.5) * 18); x.stroke(); }
    const vg = x.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
    return c;
  }
  // 낡은 흑백 사진: 흐릿한 인물 실루엣 몇 명
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#b8ae98'); bg.addColorStop(1, '#6a6252'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(60,54,44,.5)'; x.fillRect(0, H * 0.62, W, H * 0.38);
  const n = /네 장|넷/.test(title) ? 1 : 1 + (seed % 3);
  for (let k = 0; k < n; k++) { const px = W * (0.5 + (k - (n - 1) / 2) * 0.26), h = 0.9 - (k % 2) * 0.12; x.fillStyle = `rgba(30,26,22,${0.75 - k * 0.1})`; x.beginPath(); x.arc(px, H * (0.34 + (1 - h) * 0.4), 22, 0, 7); x.fill(); x.beginPath(); x.moveTo(px - 34, H); x.quadraticCurveTo(px - 30, H * (0.46 + (1 - h) * 0.4), px, H * (0.44 + (1 - h) * 0.4)); x.quadraticCurveTo(px + 30, H * (0.46 + (1 - h) * 0.4), px + 34, H); x.fill(); }
  if (/돌|아기/.test(title)) { x.fillStyle = 'rgba(230,220,200,.8)'; x.beginPath(); x.arc(W * 0.3, H * 0.66, 16, 0, 7); x.fill(); x.fillRect(W * 0.3 - 14, H * 0.69, 28, 30); }
  for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${R() > 0.5 ? '255,255,255' : '0,0,0'},${R() * 0.08})`; x.fillRect(R() * W, R() * H, 1.5, 1.5); }
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; for (let i = 0; i < 6; i++) { x.beginPath(); const px = R() * W; x.moveTo(px, 0); x.lineTo(px + (R() - 0.5) * 40, H); x.stroke(); }
  const vg = x.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,20,10,.65)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = '#d8b88a'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
  return c;
}

const STAMP = { hospital: '대외비', gwimun: '確認', ophelia: 'RECEIVED', doll: 'PRIVATE', camp: '확인', west: 'PAID', kimono: '検', clown: 'VOID' };

/** 문서 모양이면 그 요소를, 아니면 null 을 돌려준다 */
export function renderDoc(title, text, hint = {}, theme = 'gwimun') {
  const picked = pickStyle(title, hint);
  if (!picked) return null;
  const style = picked.style;
  const seed = hash(title + text);
  const paras = String(text || '').split(/\n\s*\n/);
  const wrap = el('div', `doc-wrap doc-${style} theme-${theme}`);
  // 종이 바깥으로 빼는 해설 (앞쪽 · 뒤쪽 지문)
  const isN = paras.map(isNarration);
  let a = 0, b = paras.length; while (a < b && isN[a]) a++; while (b > a && isN[b - 1]) b--;
  const pictureOnly = style === 'photo' || style === 'portrait';
  if (a === b && !pictureOnly) {
    if (picked.src === 'prop') return null; // 종이 소품이지만 글이 아니라 장면 묘사뿐이면 보통 창으로
    a = 0; b = paras.length; // 전부 지문이면 그냥 종이에 쓴다
  }
  const lead = paras.slice(0, a), body = paras.slice(a, b), tail = paras.slice(b);
  if (!pictureOnly) for (const p of lead) wrap.appendChild(el('div', 'doc-caption', p.trim()));

  // 찢긴 가장자리(clip-path)가 그림자까지 자르지 않도록 그림자는 바깥 상자에 준다
  const holder = el('div', 'doc-holder');
  holder.style.setProperty('--tilt', `${((seed % 7) - 3) * 0.35}deg`);
  const sheet = el('div', 'doc-sheet'); holder.appendChild(sheet);
  if (['note', 'letter', 'poster', 'flyer', 'drawing', 'diary', 'news'].includes(style) && seed % 3 !== 0) sheet.style.clipPath = tornClip(seed, style === 'note' ? 'top' : 'bottom');
  // 테이프 · 압정 · 접힌 자국 (동그란 얼룩은 글씨를 가려서 뺐다)
  const deco = el('div', 'doc-deco');
  if (['note', 'drawing', 'photo'].includes(style)) deco.appendChild(el('i', 'tape'));
  if (['poster', 'flyer', 'board', 'news'].includes(style)) { deco.appendChild(el('i', 'pin pin-l')); deco.appendChild(el('i', 'pin pin-r')); }
  if (['letter', 'flyer', 'news'].includes(style)) deco.appendChild(el('i', 'fold'));
  if (style === 'ledger' && STAMP[theme]) deco.appendChild(el('i', 'stamp', STAMP[theme]));
  sheet.appendChild(deco);

  if (pictureOnly || style === 'drawing') {
    const pic = drawPicture(style === 'drawing' ? 'drawing' : style === 'portrait' ? 'portrait' : 'photo', seed, title + text, theme);
    pic.className = 'doc-pic'; sheet.appendChild(pic);
  }
  const content = el('div', 'doc-text');
  const shown = pictureOnly ? paras : body;
  shown.forEach((p, i) => {
    const s = p.replace(/^\n+|\n+$/g, '');
    const head = /^【[^】]*】/.exec(s);
    if (i === 0 && head && !pictureOnly) {
      content.appendChild(el('div', 'doc-head', head[0].replace(/[【】]/g, '').trim()));
      const rest = s.slice(head[0].length).replace(/^\s*\n/, '');
      if (rest.trim()) content.appendChild(el('div', 'doc-p', rest));
    } else content.appendChild(el('div', isN[a + i] && !pictureOnly && !HANDWRITTEN.has(style) ? 'doc-p doc-aside' : 'doc-p', s));
  });
  if (pictureOnly) { const back = el('div', 'doc-back'); back.appendChild(content); wrap.appendChild(holder); wrap.appendChild(back); }
  else { sheet.appendChild(content); wrap.appendChild(holder); }
  if (!pictureOnly) for (const p of tail) wrap.appendChild(el('div', 'doc-caption', p.trim()));
  return wrap;
}
