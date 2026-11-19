import * as THREE from 'three';
import { createAvatar, animateAvatar, textSprite, OPTIONS, SKIN, ACCENT, HAIRC, EYEC, DEFAULT_LOOK, EMOTES, EMOTE_DUR, jumpElevation } from './avatar.js';
import { Cinema } from './cinema.js';
import { xmasMirrorPanel } from './xmas-mirrors.js';
import { createGhost, animateGhost, dressXmas } from './ghosts.js';
import { renderDoc } from './paper.js';
import { buildLobby, attachLobby, buildChapter, disposeWorld, LS } from './world.js';
import { AudioFX } from './audio.js';
import { jumpscare, pickScare } from './scare.js';
import { Voice } from './voice.js';
import { FX, makeBeam } from './fx.js';
import { applyGear, animateGear, initFx, updateFx, popperFx, rocketFx, swordFx, shatterFx, fartFx, snowballFx, giftPuffFx, buildCashStack, releaseBalloon } from './gear.js';
import { FRAMES, shootPhoto, composePhoto, drawStampCard, loadPhotoFonts } from './photo.js';
import { GraphicsUpgrade } from './graphics-upgrade.js';
import { gfx } from './visual-upgrade.js';
import { disposeTree, markShared } from './props.js';

const $ = (s) => document.querySelector(s);
// 글꼴(이름표 · 쪽지 같은 캔버스 글씨)이 준비될 때까지 잠깐 기다린다. 느린 회선에서 화면이 멈추지 않게 최대 1.2초만 (글꼴 파일은 /fonts, 줄여 담아 약 160KB)
await Promise.race([document.fonts.load('16px "Gowun Dodum"').catch(() => []), new Promise((r) => setTimeout(r, 1200))]);
// 화면(클라이언트)과 서버가 주고받는 방식의 버전 — 서버(server/index.js 의 PROTO)와 맞춘다
const PROTO = 4;
// 웹소켓으로 바로 붙는다 (막힌 곳에서는 예전 방식으로 자동 전환) — 처음 붙을 때 오가는 양이 줄어든다
const socket = io({ transports: ['websocket', 'polling'], tryAllTransports: true });
// 연결이 끊겼다 다시 붙으면(모바일 앱 전환 등) 같은 플레이어로 이어서 접속
socket.on('connect', () => {
  if (!S?.resume) return;
  socket.emit('hello', { v: PROTO, name: S.myName, look, resume: S.resume, acct: S.admin ? undefined : store.get('mia-account', null) || undefined }, (res) => {
    if (!res) return;
    if (res.error) { toast((res.message || '다시 접속하지 못했어요.') + ' 잠시 뒤 화면을 새로 엽니다.'); setTimeout(() => location.reload(), 2500); return; } // 입장이 거절되면 멈춘 화면으로 남지 않게 새로 연다
    // 오래 끊겨 서버가 내 자리를 이미 정리했다면 새 캐릭터로 로비에서 다시 시작한다 (예전 파티 · 게임 화면도 함께 정리)
    if (!res.resumed) { S.me = res.id; S.myName = res.name; voice.myId = res.id; dropOther(res.id); S.party = null; closeModal(); S.storyQueue = []; closeStory(true); rebuildMyAvatar(); toast('연결이 오래 끊겨 로비에서 다시 시작합니다.'); }
    S.resume = { id: res.id, token: res.token }; if (!S.admin) store.set('gwimun-resume', { ...S.resume, name: res.name, at: Date.now() });
    if (res.account && !S.admin) applyAccountName(res.account);
    setLocalSnack(res.snack || '');
    if (S.mount && res.room === 'lobby') dismount(false);
    S.items = res.items; if (res.shop) S.shop = res.shop; if (res.hiddenOk != null) S.hiddenOk = res.hiddenOk; if (res.unlockedBy) S.unlockedBy = res.unlockedBy; renderInv(); renderParty();
    if ('champ' in res) setChamp(res.champ);
    if (res.resumed && String(res.room || '').startsWith('inst:') && S.room !== 'game') socket.emit('game:state'); // 게임 중이었다면 그 게임 화면으로
    clearOthers(); // 끊긴 동안 바뀐 것이 있을 수 있으니 방 안 사람들을 처음부터 다시 받는다
    voice.refresh(true); // 끊긴 동안 음성 연결도 죽었을 수 있다 → 다시 잇는다
  });
});
// ───── 휴대폰이 잠들었다 깨어났을 때 (화면 꺼짐 · 다른 앱 · 오래 내려 둠)
//  잠든 사이 연결이 조용히 죽어도 브라우저는 한동안 '붙어 있다'고 여긴다 → 그 동안 다른 사람들이 잠들기 전 모습으로 멈춰 보였다.
//  깨어나면 서버에 바로 물어보고(alive), 2.5초 안에 답이 없으면 연결을 끊고 다시 붙는다. 답이 오면 방 안 사람들을 처음부터 다시 받는다.
let hiddenAt = 0, wakeBusy = false;
function wakeCheck(why) {
  if (!S?.resume || wakeBusy) return;
  if (!socket.connected) { socket.connect(); return; }
  wakeBusy = true;
  let done = false;
  const fail = () => { if (done) return; done = true; wakeBusy = false; try { socket.disconnect(); } catch {} socket.connect(); }; // 다시 붙으면 위의 'connect' 가 이어서 처리한다
  const t = setTimeout(fail, 2500);
  socket.emit('alive', (id) => {
    if (done) return; done = true; clearTimeout(t); wakeBusy = false;
    if (!id || id !== S.me) { try { socket.disconnect(); } catch {} socket.connect(); return; } // 서버가 나를 모른다(자리가 정리됨 · 서버 재시작) → 다시 입장
    S.lastStateAt = performance.now();
    socket.emit('state:full'); voice.refresh(why === 'long'); // 붙어 있다 → 그래도 잠든 사이 바뀐 것을 새로 받는다 (없어진 사람은 지워지고, 자리는 지금 것으로)
  });
}
// 화면이 켜져 있는데도 연결이 조용히 죽는 경우(와이파이 ↔ 데이터 전환 등): 서버는 방 상태를 적어도 10초에 한 번 보낸다 → 25초 넘게 아무것도 안 오면 확인한다
setInterval(() => { if (!document.hidden && S?.me && S.resume && performance.now() - (S.lastStateAt || 0) > 25000) { S.lastStateAt = performance.now(); wakeCheck('quiet'); } }, 5000);
addEventListener('online', () => wakeCheck('net'));
addEventListener('pageshow', (e) => { if (e.persisted) wakeCheck('long'); });
document.addEventListener('resume', () => wakeCheck('long')); // (안드로이드 크롬: 얼려 두었던 탭이 풀릴 때)
// 창을 닫거나 숨길 때 '마지막 접속 시각'을 남겨 둔다 → 금방 다시 열면 같은 플레이어로 이어서
addEventListener('pagehide', () => { const r = store.get('gwimun-resume', null); if (r && S.resume) store.set('gwimun-resume', { ...r, at: Date.now() }); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { const r = store.get('gwimun-resume', null); if (r && S.resume) store.set('gwimun-resume', { ...r, at: Date.now() }); }
  if (document.hidden) { hiddenAt = Date.now(); S.joy = null; const k = document.getElementById('joyKnob'); if (k) k.style.transform = ''; return; }
  const away = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0;
  if (!socket.connected) socket.connect();
  else if (away > 4000) wakeCheck(away > 60000 ? 'long' : 'short'); // 4초 넘게 가려져 있었다면 연결이 살아 있는지 확인하고 방 상태를 새로 받는다
});
if (location.search.includes('debug')) window.__dbg = { socket };
const audio = new AudioFX();
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

// ─────────────────────────── 상태
const S = {
  me: null, myName: '', items: {}, inv: [], light: false,
  room: 'lobby', world: null, chapter: null, objState: {}, dark: false,
  party: null, roster: [], chatCh: 'all', lobbyChatCh: 'all', themeComms: false,
  modalOpen: false, storyQueue: [], storyOpen: false, lockCtx: null,
  others: new Map(), looks: new Map(), lookReq: new Set(),
  ghost: null, ghostState: null,
  moveTarget: null, pendingInteract: null,
  crouch: false, run: false, pings: [], callouts: [], journal: store.get('gwimun-journal', []).filter((j) => j && j.sc),
  mouse: { x: 0, y: 0 }, danger: 0, ghosts: new Map(),
  fear: 2, em: '', emT: 0, eid: 0, labels: [], hearts: 0, flyHearts: [],
  profile: null, shop: {}, riding: false, holdSword: false, holdStaff: false, holdSaw: false, champ: null, hiddenOk: false, vlv: new Map(), vrings: [],
  floor: new URLSearchParams(location.search).get('floor') || 'burgundy', // 주소 끝 ?floor=0~4로 기존 바닥 미리보기
};
const SET = Object.assign({ volume: 0.8, voice: 1, sens: 1, quality: (matchMedia('(pointer: coarse)').matches || innerWidth < 760) ? 'medium' : 'high', brightness: 1, minimap: true, gfx: true }, store.get('gwimun-settings', {}));
if (SET.quality === 'low') SET.quality = 'medium'; // '낮음'은 없어졌다 → 보통
gfx.on = false; gfx.quality = SET.quality; // 그래픽 강화는 그래픽이 이상해져서 없앴다 (항상 꺼짐 · 설정에서도 뺐다)

// ─────────────────────────── 꾸미기
let look = { ...DEFAULT_LOOK, ...store.get('gwimun-look', {}) };
// 닉네임을 비워 두면 입장을 못 해서 그냥 나가 버린다 → 처음 온 사람에게는 무서운 닉네임을 미리 채워 둔다
const RAND_NICK = () => ['겁쟁이', '떨리는', '도망치는', '숨은', '용감한', '길잃은', '소심한', '울보'][Math.random() * 8 | 0] + ['토끼', '고양이', '여우', '곰', '유령', '탐정', '인형', '미아'][Math.random() * 8 | 0] + (10 + (Math.random() * 90 | 0));
$('#nick').value = store.get('gwimun-nick', '') || RAND_NICK();
// 고정 계정의 닉네임은 접속 화면에 표시한다.
function applyAccountLock() {
  const a = store.get('mia-account', null); const n = $('#nick'), note = $('#nickNote');
  // 안내 문구는 한 줄(짧은 글)이 기본이고, 자세한 설명(.more)은 넓은 화면에서만 보인다 — 두 줄이 되면 모바일에서 아래 버튼을 밀어냈다
  const say = (short, more) => { if (!note) return; note.textContent = short; note.appendChild(Object.assign(document.createElement('span'), { className: 'more', textContent: ' ' + more })); };
  if (a?.name) { n.value = a.name; n.readOnly = true; n.classList.add('locked'); say('🔒 이 기기의 고정 계정 닉네임이에요.', '(닉네임은 광장 상점의 변경권으로 바꿀 수 있어요)'); }
  else { n.readOnly = false; n.classList.remove('locked'); say('닉네임을 정하면 이 기기의 고정 계정이 생겨요.', '(이 기기 · IP에 묶여 레벨 · 코인이 쌓이니 신중하게!)'); }
}
applyAccountLock();
function applyAccountName(account) {
  const changed = S.myName !== account.name;
  S.myName = account.name;
  store.set('mia-account', account);
  store.set('gwimun-nick', account.name);
  if (S.resume) store.set('gwimun-resume', { ...S.resume, name: account.name, at: Date.now() });
  applyAccountLock();
  if (changed && myAvatar) { myAvatar.userData.name = account.name; myTag(); }
}
// 로그인 화면을 '지금 실제로 보이는 영역'에 맞춘다: 주소창이 늘었다 줄었다 하거나 키보드가 올라와도 입장 막대가 화면 밖으로 밀려나지 않게
// (--app-h · --app-top 은 css 의 body.mobile #login 이 쓴다. 영역이 좁으면 .short · .tiny 로 로고 · 미리보기를 줄인다)
function fitLogin() {
  const vv = window.visualViewport, lg = document.getElementById('login'); if (!lg) return;
  const zoomed = vv && vv.scale > 1.02; // 손가락으로 확대한 상태에서는 맞추지 않는다
  const h = Math.round(!vv || zoomed ? innerHeight : vv.height), top = zoomed || !vv ? 0 : Math.round(vv.offsetTop);
  const root = document.documentElement.style; root.setProperty('--app-h', h + 'px'); root.setProperty('--app-top', top + 'px');
  lg.classList.toggle('short', h < 700); lg.classList.toggle('tiny', h < 560);
}
fitLogin();
addEventListener('resize', fitLogin); addEventListener('orientationchange', () => setTimeout(fitLogin, 250));
window.visualViewport?.addEventListener('resize', fitLogin); window.visualViewport?.addEventListener('scroll', fitLogin);
// 키보드를 닫은 뒤 화면이 위로 밀려 있으면 제자리로
$('#nick').addEventListener('blur', () => setTimeout(() => { if (!document.activeElement || !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { scrollTo(0, 0); fitLogin(); } }, 80));
// 서버가 접속을 끊으며 남긴 안내 (업데이트 · 다른 창에서 접속)
{ let k = null; try { k = sessionStorage.getItem('mia-kick'); sessionStorage.removeItem('mia-kick'); } catch {} if (k) setTimeout(() => toast(k), 600); }
// 초대 링크(?p=코드)로 들어왔으면 입장하자마자 친구 파티에 들어간다
const JOIN_CODE = new URLSearchParams(location.search).get('p');
if (JOIN_CODE) history.replaceState(null, '', location.pathname);
let editMode = false;
const SWATCH = { body: SKIN, accent: ACCENT, hairColor: HAIRC, eyeColor: EYEC };
const isLockedLook = (key, v) => key === 'hair' && v === 'rolltwin' && !S.profile?.items?.hair_roll; // 투표 보상 헤어
function buildOptions() {
  document.querySelectorAll('[data-sw]').forEach((el) => {
    const key = el.dataset.sw; el.innerHTML = '';
    SWATCH[key].forEach((c) => { const d = document.createElement('div'); d.className = 'sw' + (look[key] === c ? ' on' : ''); d.style.background = c; d.onclick = () => { look[key] = c; buildOptions(); refreshPreview(); }; el.appendChild(d); });
  });
  document.querySelectorAll('[data-chip]').forEach((el) => {
    const key = el.dataset.chip; el.innerHTML = '';
    OPTIONS[key].forEach(([v, label]) => { const d = document.createElement('div'); const locked = isLockedLook(key, v); d.className = 'chip' + (look[key] === v ? ' on' : '') + (locked ? ' locked' : ''); d.textContent = (locked ? '🔒 ' : '') + label; d.onclick = () => { if (locked) { toast('🗳️ 로비의 테마 투표 전광판에서 투표하면 받을 수 있어요!'); return; } look[key] = v; buildOptions(); refreshPreview(); }; el.appendChild(d); });
  });
  $('#photoOn').checked = !!look.photoOn;
}
document.querySelectorAll('.ctab').forEach((b) => (b.onclick = () => {
  document.querySelectorAll('.ctab').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.cpanel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== b.dataset.tab));
}));
$('#randomBtn').onclick = () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  for (const k of Object.keys(OPTIONS)) look[k] = pick(OPTIONS[k].filter(([v]) => !isLockedLook(k, v)))[0];
  for (const k of Object.keys(SWATCH)) look[k] = pick(SWATCH[k]);
  buildOptions(); refreshPreview();
};

const pv = { renderer: new THREE.WebGLRenderer({ canvas: $('#preview'), antialias: true, alpha: true }), scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(32, 300 / 380, 0.1, 50), av: null, rot: 0, drag: null };
pv.cam.position.set(0, 0.82, 3.6); pv.cam.lookAt(0, 0.64, 0); // SD 캐릭터 전신이 다 보이게
pv.scene.add(new THREE.HemisphereLight('#fff', '#655', 2.0));
const pvd = new THREE.DirectionalLight('#fff', 1.6); pvd.position.set(2, 3, 3); pv.scene.add(pvd);
const pvr = new THREE.DirectionalLight('#ffb3c7', 1.2); pvr.position.set(-3, 2, -2); pv.scene.add(pvr);
pv.renderer.outputColorSpace = THREE.SRGBColorSpace;
pv.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
$('#preview').addEventListener('pointerdown', (e) => { pv.drag = e.clientX; });
addEventListener('pointerup', () => { pv.drag = null; });
addEventListener('pointermove', (e) => { if (pv.drag != null) { pv.rot += (e.clientX - pv.drag) * 0.012; pv.drag = e.clientX; } });
let pvTimer = null;
function refreshPreview() { clearTimeout(pvTimer); pvTimer = setTimeout(() => { if (pv.av) { pv.av.userData.visualUpgrade?.dispose(); pv.scene.remove(pv.av); disposeTree(pv.av); } pv.av = createAvatar(look); pv.scene.add(pv.av); }, 30); }
let pvLoop = true;
(function loopPv(t) { requestAnimationFrame(loopPv); if (!pvLoop) return; if (pv.av) { pv.av.rotation.y = pv.rot + (pv.drag == null ? Math.sin(t / 2000) * 0.25 : 0); animateAvatar(pv.av, 0.016, false, t / 1000); } pv.renderer.render(pv.scene, pv.cam); })(0);
buildOptions(); refreshPreview();

// 사진 얼굴
const crop = { img: null, zoom: 1, x: 0, y: 0 };
const cropCv = $('#photoCrop');
$('#photoPick').onclick = () => $('#photoFile').click();
$('#photoFile').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => { crop.img = img; crop.zoom = 1; crop.x = 0; crop.y = 0; $('#pZoom').value = 1; $('#pX').value = 0; $('#pY').value = 0; look.photoOn = true; renderCrop(); buildOptions(); };
  img.src = url;
};
['pZoom', 'pX', 'pY'].forEach((id) => ($('#' + id).oninput = (e) => { crop[{ pZoom: 'zoom', pX: 'x', pY: 'y' }[id]] = Number(e.target.value); renderCrop(); }));
$('#photoOn').onchange = (e) => { look.photoOn = e.target.checked && !!look.photo; buildOptions(); refreshPreview(); };
$('#photoClear').onclick = () => { look.photo = ''; look.photoOn = false; crop.img = null; renderCrop(); buildOptions(); refreshPreview(); };
function renderCrop() {
  const x = cropCv.getContext('2d'); const W = cropCv.width, H = cropCv.height;
  x.clearRect(0, 0, W, H);
  if (!crop.img) { if (look.photo) { const i = new Image(); i.onload = () => x.drawImage(i, 0, 0, W, H); i.src = look.photo; } refreshPreview(); return; }
  const out = document.createElement('canvas'); out.width = 192; out.height = 204;
  const o = out.getContext('2d');
  const img = crop.img;
  const sc = crop.zoom * Math.max(out.width / img.width, out.height / img.height);
  const w = img.width * sc, h = img.height * sc;
  const ox = (out.width - w) / 2 + crop.x * w * 0.4, oy = (out.height - h) / 2 + crop.y * h * 0.4;
  o.fillStyle = '#888'; o.fillRect(0, 0, out.width, out.height);
  o.drawImage(img, ox, oy, w, h);
  look.photo = out.toDataURL('image/jpeg', 0.82);
  if (look.photo.length > 75000) look.photo = out.toDataURL('image/jpeg', 0.6);
  x.save(); x.beginPath(); x.ellipse(W / 2, H / 2, W / 2 - 2, H / 2 - 2, 0, 0, Math.PI * 2); x.clip(); x.drawImage(out, 0, 0, W, H); x.restore();
  refreshPreview();
}
if (look.photo) renderCrop();

// 시작 화면: 문구가 서서히 떠오른 뒤 캐릭터 생성 창으로
{
  const sp = $('#splash');
  if (sp) {
    $('#login').classList.add('from-splash');
    let done = false;
    // (휴대폰에서는 닉네임 칸에 자동으로 커서를 두지 않는다 — 키보드가 바로 올라와 화면이 좁아지고, 로고 · 미리보기가 가려졌다)
    const finish = () => { if (done) return; done = true; sp.classList.add('out'); setTimeout(() => sp.remove(), 1500); setTimeout(() => { if (!document.body.classList.contains('mobile')) $('#nick')?.focus(); }, 900); setTimeout(() => $('#login').classList.remove('from-splash'), 3000); /* 카드 등장 효과는 처음 한 번만 (꾸미기로 다시 열 때 1초 동안 안 보이던 문제) */ };
    sp.addEventListener('click', finish);
    const onKey = (e) => { if (done) return removeEventListener('keydown', onKey); if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); finish(); } };
    addEventListener('keydown', onKey);
    setTimeout(finish, 7500);
  }
}

$('#enterBtn').onclick = enter;
$('#nick').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
let entering = 0; // 입장 버튼을 연달아 눌러도 한 번만 보낸다
function enter() {
  audio.init();
  store.set('gwimun-look', look);
  if (editMode) {
    socket.emit('look', look);
    S.looks.set(S.me, { look: { ...look } });
    rebuildMyAvatar();
    $('#login').classList.add('hidden'); pvLoop = false; editMode = false;
    toast('외형이 저장되었습니다.');
    return;
  }
  const name = $('#nick').value.trim();
  const adminMode = !$('#adminRow').classList.contains('hidden');
  if (!name && !adminMode) { $('#nick').focus(); $('#nick').placeholder = '닉네임을 입력하세요'; return; }
  if (!adminMode) store.set('gwimun-nick', name);
  const adminPw = $('#adminRow').classList.contains('hidden') ? '' : $('#adminPass').value;
  const saved = adminPw ? null : store.get('gwimun-resume', null);
  const resume = saved && saved.name && saved.name.replace(/#\d+$/, '') === name && Date.now() - (saved.at || 0) < 10 * 60 * 1000 ? { id: saved.id, token: saved.token } : undefined;
  if (Date.now() - entering < 6000) return; entering = Date.now();
  $('#enterBtn').disabled = true; setTimeout(() => { $('#enterBtn').disabled = false; }, 6000);
  socket.emit('hello', { v: PROTO, name, look, resume, admin: adminPw || undefined, acct: adminPw ? undefined : store.get('mia-account', null) || undefined }, (res) => {
    entering = 0; $('#enterBtn').disabled = false;
    if (res?.error === 'badadmin') { $('#adminPass').value = ''; $('#adminPass').focus(); toast(res.message); return; }
    if (res?.error && res.keep) { toast(res.message); return; }
    if (res?.error) { const n = $('#nick'); store.set('mia-account', null); applyAccountLock(); n.value = ''; n.placeholder = '다른 닉네임을 입력하세요'; n.focus(); toast(res.message); return; }
    if (res.account && !res.admin) { store.set('mia-account', res.account); store.set('gwimun-nick', res.account.name); applyAccountLock(); }
    S.admin = !!res.admin; $('#adminBtn').classList.toggle('hidden', !S.admin); document.body.classList.toggle('is-admin', S.admin); $('#adminPass').value = '';
    S.resume = { id: res.id, token: res.token }; if (!S.admin) store.set('gwimun-resume', { ...S.resume, name: res.name, at: Date.now() }); // 운영자 접속은 기기에 남기지 않는다
    S.me = res.id; S.myName = res.name; S.items = res.items; S.unlocked = res.unlocked || 0; S.hearts = res.hearts || 0; S.unlockedBy = res.unlockedBy || {}; S.scenarios = res.scenarios || [];
    setLocalSnack(res.snack || '');
    S.shop = res.shop || {}; S.hiddenOk = !!res.hiddenOk;
    setChamp(res.champ || null); voice.setIce(res.ice); S.lastStateAt = performance.now();
    voice.myId = res.id; dropOther(res.id); // 혹시 내 캐릭터가 '다른 사람'으로 그려져 있었다면 지운다
    $('#login').classList.add('hidden'); $('#hud').classList.remove('hidden');
    pvLoop = false;
    rebuildMyAvatar(); updateHiddenGate(true);
    renderInv(); renderRoster(); renderParty(); loadShareInfo();
    if (JOIN_CODE) socket.emit('party:joinCode', JOIN_CODE);
    if (res.resumed && String(res.room || '').startsWith('inst:')) socket.emit('game:state'); // 게임 도중 창을 닫았다 다시 열면 그 게임으로 돌아간다
    addChat({ channel: 'system', text: '📢 욕설·비방·도배는 금지예요. 경고 5회면 5분 동안 채팅이 금지됩니다.' });
    addChat({ channel: 'system', text: '📢 모든 테마를 클리어하면 숨겨진 히든 테마가 오픈됩니다! (Lv.20 달성 시에도 열려요)' });
    toast(document.body.classList.contains('mobile') ? `환영합니다, ${S.myName} 님! 왼쪽 조이스틱으로 이동 · 화면을 끌어 시점 · 두 손가락으로 확대` : `환영합니다, ${S.myName} 님! WASD 이동 · 드래그로 시점 · ❔에서 조작법`);
  });
}
$('#lookBtn').onclick = () => {
  editMode = true; pvLoop = true;
  $('#nickRow').classList.add('hidden'); $('#enterBtn').textContent = '저장하고 돌아가기';
  $('#login').classList.remove('hidden'); buildOptions(); refreshPreview();
};

// ─────────────────────────── 렌더러
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = false; // 그림자 효과 끔 (눈부심·무거움)
THREE.Texture.DEFAULT_ANISOTROPY = Math.min(16, renderer.capabilities.getMaxAnisotropy()); // 비스듬히 보이는 바닥·벽 무늬도 선명하게
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
initFx(scene);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 220);
const fx = new FX(renderer, scene, camera);
// 크롬 '그래픽 가속'이 꺼져 있으면 CPU 로 그려서(SwiftShader 등) 크게 끊긴다 → 가볍게 그리고 켜는 방법을 알려 준다
const GPU_INFO = (() => { try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || ''); } catch { return ''; } })();
fx.soft = /swiftshader|llvmpipe|software|basic render/i.test(GPU_INFO);
fx.setQuality(SET.quality); fx.brightness = SET.brightness;
const fitCamera = () => { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 0.8 ? 72 : 55; camera.updateProjectionMatrix(); };
fitCamera();
addEventListener('resize', () => { fitCamera(); fx.resize(); });

const overlay = new THREE.Scene();
const cinema = new Cinema(renderer);
// ───── 그래픽 강화 (graphics-upgrade.js · visual-upgrade.js)
const graphics = new GraphicsUpgrade();
/** 켜고 끈다: 지금 챕터에는 바로 반영하고, 이미 만들어진 캐릭터는 새로 만든다 (서버가 방 전체를 다시 보내 준다). 귀신은 그래픽 강화와 상관없이 그대로 둔다 */
function applyGfx(on) {
  restoreFaded();
  graphics.setOn(on);
  if (S.me) { rebuildMyAvatar(); clearOthers(); }
}
// 느린 기기 보호: 그래픽 강화가 켜진 채 방탈출 안에서 평균 FPS 가 너무 낮으면 스스로 끈다 (이번에 한 번만 · 설정에서 다시 켤 수 있다)
const PERF = { on: !window.__dbg, minFps: 22, secs: 8, holdMs: 3500, t0: 0, frames: 0, hold: 0, fired: false };
function watchPerf(now) {
  if (!PERF.on || PERF.fired || !gfx.on || S.room !== 'game' || document.hidden || cinema.active || now < PERF.hold) { PERF.t0 = 0; return; }
  if (!PERF.t0) { PERF.t0 = now; PERF.frames = 0; return; }
  PERF.frames++;
  const el = now - PERF.t0; if (el < PERF.secs * 1000) return;
  const fps = PERF.frames / (el / 1000); PERF.t0 = 0;
  if (fps >= PERF.minFps) return;
  PERF.fired = true; SET.gfx = false; SET.gfxAuto = true; saveSettings(); applyGfx(false);
  toast(`🎨 이 기기에서는 화면이 느려서(${Math.round(fps)} FPS) 그래픽 강화를 껐어요. ⚙ 설정에서 다시 켤 수 있어요.`);
}
function addLabel(owner, sprite, y) { overlay.add(sprite); S.labels.push({ owner, sprite, y }); return sprite; }
function removeLabel(sprite) { overlay.remove(sprite); S.labels = S.labels.filter((l) => l.sprite !== sprite); sprite.material.map?.dispose(); }
function removeAvatar(g) { if (!g) return; g.userData.visualUpgrade?.dispose(); scene.remove(g); disposeTree(g); for (const l of S.labels.filter((l) => l.owner === g)) removeLabel(l.sprite); }
function updateLabels() {
  for (const l of S.labels) {
    if (!l.owner.parent) continue;
    l.sprite.visible = l.owner.visible;
    const lift = l.owner.userData.rig ? l.owner.userData.rig.position.y : 0;
    l.sprite.position.set(l.owner.position.x, l.owner.position.y + l.y + lift, l.owner.position.z);
  }
}
const CAM_MAX = 14; // 가장 멀리 줌아웃한 거리 — 로비·챕터에 들어갈 때마다 여기서 시작
const CAM_START = 10; // 로비·챕터에 들어갈 때 시작 거리 (최대 줌아웃보다 살짝 가깝게)
const cam = { yaw: 0, pitch: 0.55, dist: CAM_START };
let myAvatar = null;
const me = { x: 0, z: 5, ry: Math.PI, moving: false };
if (window.__dbg) Object.assign(window.__dbg, { S, cam, me, scene, camera, renderer }); // ?debug 일 때만 (테스트용)
const fill = new THREE.PointLight('#ffe9d0', 2.6, 14, 1.2);
scene.add(fill);

function makeAvatar(id, name, lk, isMe) {
  const g = createAvatar(lk);
  g.userData.name = name; g.userData.id = id; g.userData.isMe = isMe;
  if (isMe) { myAvatar = g; myTag(); } else setTag(g, name, '#fff');
  const spot = new THREE.SpotLight('#fff4dc', 0, 24, 0.55, 0.5, 1.2);
  spot.visible = false;
  spot.position.set(0, 0.72, 0.42);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0.2, 5); g.add(tgt); spot.target = tgt;
  g.add(spot); g.userData.spot = spot;
  // 내 캐릭터 발밑만 아주 은은하게 밝힌다 (어두운 맵에서 위치를 잃지 않게)
  if (isMe) { const foot = new THREE.PointLight('#ffe6c8', 1.1, 2.6, 1.6); foot.position.set(0, 0.35, 0); g.add(foot); }
  const beam = makeBeam(); beam.position.copy(spot.position); beam.visible = false; g.add(beam); g.userData.beam = beam;
  scene.add(g);
  return g;
}
function setTag(g, name, color, title = '') { if (g.userData.tag) removeLabel(g.userData.tag); g.userData.tag = addLabel(g, textSprite(name, { size: 30, color, bg: 'rgba(10,8,12,.72)', stroke: 'rgba(0,0,0,.85)', sub: title }), title ? 1.59 : 1.55); }
// 깬 테마 수(도장)에 따른 이름표 위 칭호
function rankOf(n) { return n <= 3 ? '방린이' : n <= 6 ? '방중수' : n <= 8 ? '방고수' : n <= 10 ? '탈출러' : '고인물'; }
function myTag() { if (myAvatar) setTag(myAvatar, myAvatar.userData.name, '#ffe08a', rankOf(Object.values(S.unlockedBy || {}).filter((v) => v.cleared).length)); }
function setLight(g, on) { g.userData.spot.visible = !!on && (S.room === 'game' || g.userData.isMe); /* 로비에선 내 손전등만 (빛 개수를 줄여 가볍게) */ g.userData.spot.intensity = on ? 160 : 0; g.userData.beam.visible = false; } // 빛줄기 효과는 눈부셔서 표시하지 않는다
function rebuildMyAvatar() {
  removeAvatar(myAvatar);
  myAvatar = makeAvatar(S.me, S.myName, look, true);
  myAvatar.position.set(me.x, 0, me.z); setLight(myAvatar, S.light);
}
function setBubble(g, text, channel = 'all') {
  if (g.userData.bubble) removeLabel(g.userData.bubble);
  // 전체 채팅은 크림색, 파티 채팅은 하늘색 말풍선
  const b = channel === 'party'
    ? textSprite(text, { size: 30, bg: '#b9dcff', color: '#0b1d2e', maxW: 380, border: '#1f6fb5', tail: true })
    : textSprite(text, { size: 30, bg: '#ffe6a3', color: '#140c10', maxW: 380, border: '#b8830f', tail: true });
  addLabel(g, b, 2.0 + b.scale.y / 2); g.userData.bubble = b;
  clearTimeout(g.userData.bt); g.userData.bt = setTimeout(() => { if (g.userData.bubble === b) { removeLabel(b); g.userData.bubble = null; } }, 6000);
}

// ─────────────────────────── 월드 전환
// 화면이 바뀔 때(로비 · 챕터 · 영상 · 창) 눌려 있던 이동 입력을 모두 푼다 — 조이스틱이 숨겨지면 '손 뗌' 신호가 오지 않아 혼자 걷던 문제 방지
function resetInput() { drag = null; $('#tooltip').classList.add('hidden'); canvas.style.cursor = ''; S.joy = null; S.moveTarget = null; S.pendingInteract = null; for (const k in keys) keys[k] = false; const kb = document.getElementById('joyKnob'); if (kb) kb.style.transform = ''; document.getElementById('joy')?.classList.remove('act'); }
// 로비는 한 번 지어 두고 다시 쓴다. 히든 관문이나 층이 바뀔 때만 새로 짓는다
let lobbyWorld = null, lobbyKey = '';
// 지금 세계를 화면에서 뗀다. 챕터는 버리고, 로비는 다음 입장을 위해 남겨 둔다
function leaveWorld() {
  if (!S.world) return;
  if (S.world === lobbyWorld) scene.remove(S.world.root);
  else disposeWorld(scene, S.world);
}
// 새로 지은 로비를 한 번 그려 둔다. 처음엔 안 보이던 물체(숨은 간판·화면 밖 칸)까지 지오메트리·질감·셰이더가 GPU에 올라가, 첫 복귀 때 몰아서 올리느라 끊기지 않는다
function warmLobby(root) {
  const saved = [];
  root.traverse((o) => { if (!o.isLight) { saved.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; } });
  try {
    fx.render(performance.now(), { danger: S.danger, mode: 'lobby' }); // 실제 화면과 같은 후처리 경로로 그려야 셰이더가 맞는다
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(overlay, camera);
  } catch (e) { console.warn('로비 미리 그리기 건너뜀', e); } finally {
    renderer.autoClear = true;
    for (const [o, v, f] of saved) { o.visible = v; o.frustumCulled = f; }
  }
}
function enterLobby(pos) {
  if (fx.soft && !S.softWarned) { S.softWarned = true; setTimeout(() => toast(/chrome|crios/i.test(navigator.userAgent) && !/edg\//i.test(navigator.userAgent) ? '🐢 크롬 그래픽 가속이 꺼져 있어 화면이 끊길 수 있어요. 크롬 설정 → 시스템 → 「가능한 경우 그래픽 가속 사용」을 켜고 크롬을 다시 시작해 주세요.' : '🐢 브라우저 그래픽 가속이 꺼져 있어 화면이 끊길 수 있어요. 브라우저 설정에서 그래픽(하드웨어) 가속을 켜 주세요.'), 2500); }
  resetInput(); removeCash();
  restoreFaded(); graphics.leave(); // 반투명해진 물체를 먼저 정리하고, 바꿔 둔 재질을 원래대로 돌린 뒤 세계를 지운다
  const key = `${!!(S.hiddenOk || S.admin)}|${S.floor}`;
  leaveWorld();
  let built = false;
  if (lobbyWorld && lobbyKey === key) S.world = attachLobby(scene, lobbyWorld);
  else {
    disposeWorld(scene, lobbyWorld);
    lobbyWorld = S.world = buildLobby(scene, { hidden: !!(S.hiddenOk || S.admin), champ: S.champ, floor: S.floor, renderer });
    lobbyKey = key; built = true;
  }
  S.world.setChamp(S.champ || null); // 챕터에 있는 동안 바뀐 이름표를 맞춘다 (같으면 아무 일도 하지 않는다)
  if (S.profile?.items?.costume_xmas || S.xmasGot) S.world.xmasGift?.hide(); else S.world.xmasGift?.show();
  showSnaps();
  if (built) warmLobby(S.world.root); // 새로 지은 로비는 첫 복귀 전에 한 번 그려 GPU에 미리 올린다
  socket.emit('snap:list', mergeClearPhotos);
  flushClearPhotos();
  S.room = 'lobby'; S.chapter = null; S.dark = false; S.objState = {}; S.mount = null; S.perch = null; me.y = 0;
  setThemeComms(false);
  audio.classicEffects = false;
  audio.xmasMechanical = false;
  cam.dist = CAM_START; // 살짝 줌인된 상태로 시작
  me.x = pos.x; me.z = pos.z;
  removeGhost(); clearOthers(); clearPings();
  $('#placeTitle').textContent = '미아 광장';
  $('#placeSub').textContent = `${(S.scenarios || []).filter((x) => !x.hidden).length || 10}개의 테마 · 파티를 모아 테마를 고르세요`;
  S.themeNear = null; S.themeBubble = null; S.themeAnchor = null;
  $('#objective').classList.add('hidden');
  $('#lookBtn').classList.remove('hidden');
  audio.ambient('lobby');
  renderer.toneMappingExposure = 1.5;
  renderParty();
}
// ───── 💵 돈다발: 서버가 3% 확률로 고른 챕터 하나에만 나타난다. 자리는 시드로 정해서 모두에게 같은 곳에 보인다
let cashObj = null;
function removeCash() { if (cashObj) { scene.remove(cashObj); cashObj = null; } }
function placeCash(seed, ch) {
  let a = seed >>> 0; const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const [W, D] = ch.size || [12, 12], [sx, sz] = ch.spawn, cols = S.world?.colliders || [];
  const hitCol = (x, z, m) => cols.some((c) => !(c.objId && S.world.objects?.[c.objId] && !S.world.objects[c.objId].visible) && Math.abs(c.x - x) < c.hw + m && Math.abs(c.z - z) < c.hd + m);
  const ok = (x, z) => {
    if (Math.abs(x) > W / 2 - 0.8 || Math.abs(z) > D / 2 - 0.8 || hitCol(x, z, 0.7)) return false;
    if ((ch.objects || []).some((o) => Math.hypot(o.x - x, o.z - z) < 1.1)) return false; // 단서 · 물건 바로 옆은 피한다
    const n = Math.ceil(Math.hypot(x - sx, z - sz) / 0.3); for (let i = 1; i < n; i++) if (hitCol(sx + ((x - sx) * i) / n, sz + ((z - sz) * i) / n, 0.25)) return false; // 시작 자리에서 걸어갈 수 있게
    return true;
  };
  let px = null, pz = null;
  for (let i = 0; i < 300 && px == null; i++) { const ang = rnd() * Math.PI * 2, r = 2 + rnd() * 6, x = sx + Math.cos(ang) * r, z = sz + Math.sin(ang) * r; if (ok(x, z)) { px = x; pz = z; } }
  if (px == null) for (let i = 0; i < 16 && px == null; i++) { const ang = (i / 16) * Math.PI * 2, x = sx + Math.cos(ang) * 1.6, z = sz + Math.sin(ang) * 1.6; if (!hitCol(x, z, 0.4)) { px = x; pz = z; } }
  if (px == null) { px = sx + 1.2; pz = sz; }
  cashObj = buildCashStack(); cashObj.position.set(px, 0, pz); cashObj.userData.sent = false; scene.add(cashObj);
}
socket.on('cash:gone', ({ by }) => {
  if (!cashObj) return;
  const { x, z } = cashObj.position; giftPuffFx(x, 0.3, z); removeCash();
  if (by === S.me) { audio.play('pickup'); audio.play('firework'); }
});
function enterChapter(state, showIntro = true) {
  resetInput();
  setGameClock(state.elapsed, state.timed); setHintsUsed(state.hintsUsed ?? 0, state.talismansUsed, state.assistXpPercent); S.limitMs = state.limitMs || 0;
  if (state.fear != null) { S.fear = state.fear; if (state.scenario) S.scenario = state.scenario; updateFearBadge(); }
  restoreFaded(); graphics.leave(); // 반투명해진 물체를 먼저 정리하고, 바꿔 둔 재질을 원래대로 돌린 뒤 세계를 지운다
  leaveWorld();
  const ch = state.chapter;
  S.chapter = ch; S.room = 'game'; S.mount = null; S.perch = null; me.y = 0; closeThemePop(); S.mobileClose?.(); noticeBox.classList.add('hidden');
  setThemeComms(true);
  audio.classicEffects = true;
  audio.xmasMechanical = S.scenario?.id === 'christmas';
  cam.dist = CAM_START; // 살짝 줌인된 상태로 시작
  if (S.snack) { const u = myAvatar?.userData; if (u?.gSnack) { u.gSnack.parent?.remove(u.gSnack); u.gSnack = null; u.gSnackCode = ''; } S.snack = ''; updateGearButtons(); } // 팝콘·커피·풍선은 테마에 가져가지 않는다
  S.world = buildChapter(scene, ch, S.scenario?.id);
  S.objState = state.objects; S.dark = state.dark;
  me.x = ch.spawn[0] + (Math.random() - 0.5); me.z = ch.spawn[1];
  me.ry = Math.PI; cam.yaw = bestOpenYaw(); // 시작 지점이 벽에 붙어 있으면 카메라가 머리 속으로 파고들지 않게 가장 트인 쪽에서 비춘다
  S.moveTarget = null; S.pendingInteract = null;
  removeGhost(); clearOthers(); clearPings();
  removeCash(); if (state.cash != null) placeCash(state.cash, ch);
  $('#placeTitle').textContent = ch.title; $('#placeTitle').appendChild(Object.assign(el('span', 'limit-tag'), { id: 'limitTag' }));
  $('#placeSub').textContent = ch.place;
  $('#objective').classList.remove('hidden');
  $('#lookBtn').classList.add('hidden');
  setObjective(state.objective, state.relics);
  applyObjState(); applyDark();
  audio.ambient(roomAmbient());
  renderer.toneMappingExposure = 1.82;
  graphics.enter(S.world, ch, S.scenario?.id); PERF.hold = performance.now() + PERF.holdMs; PERF.t0 = 0; // (조명 · 노출은 그대로 — 질감과 디테일만 더한다)
  if (showIntro && ch.intro) { queueStory({ ...ch.intro, sound: 'story' }); addJournal(ch.intro.title, ch.intro.text, 'story'); }
  if (!document.body.classList.contains('mobile') && !store.get('gwimun-tutorial', false)) { store.set('gwimun-tutorial', true); setTimeout(() => toast('팁: F 손전등 · C 웅크리기(귀신에게 덜 들킴) · G 위치 찍기 · J 수첩'), 4000); }
  renderParty();
}
// 지금 있는 곳의 배경음 이름
function roomAmbient() {
  if (S.room !== 'game' || !S.chapter) return 'lobby';
  return { gwimun: S.chapter.rain ? 'rain' : 'gwimun', ophelia: 'ship', doll: 'doll', hospital: 'hospital', camp: 'camp', west: 'west', kimono: 'kimono', clown: 'clown', park: 'park', mia: 'mia', zombie: 'zombie', christmas: 'xmas' }[S.scenario?.id] || 'horror';
}
function clearOthers() { for (const [, g] of S.others) removeAvatar(g); S.others.clear(); S.net.clear(); if (S.me) socket.emit('state:full'); }
function applyObjState() {
  if (!S.world?.objects) return;
  for (const [id, e] of Object.entries(S.world.objects)) {
    const st = S.objState[id]; if (!st) continue;
    e.visible = st.v; e.done = st.done;
    e.group.visible = st.v;
    if (e.hit) e.hit.visible = false;
    if (e.marker) e.marker.visible = st.v;
  }
}
function applyDark() { for (const c of S.world?.ceiling || []) { c.light.intensity = S.dark ? 0 : c.base; c.tube.material.emissiveIntensity = S.dark ? 0 : 1; } }
// 실시간 진행 타이머 (서버 시계 기준 경과 시간으로 맞춘다) · 힌트 사용 수
function setGameClock(elapsed, timed) { if (elapsed == null) return; S.clock = { base: performance.now() - elapsed, stop: null, timed: timed ?? S.clock?.timed ?? true }; }
function setHintsUsed(n, talismans = 0, xpPercent = 100) {
  if (n == null) return;
  S.hintsUsed = n;
  $('#hintUsed').textContent = `💡 힌트 ${n}개 · 부적 ${talismans}개 · 기본 XP ${xpPercent}%`;
}
const fmtClock = (ms) => { const d = Math.floor(ms / 100); const m = Math.floor(d / 600), s = Math.floor((d % 600) / 10); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d % 10}`; };
function updateGameTimer() {
  const t = $('#gameTimer'); const show = S.room === 'game' && !!S.clock;
  t.classList.toggle('hidden', !show); if (!show) return;
  const ms = S.clock.stop ?? performance.now() - S.clock.base;
  const lim = S.limitMs || 0, over = lim && ms > lim;
  t.textContent = `⏱ ${fmtClock(Math.max(0, ms))}${S.clock.timed ? '' : ' *'}`;
  const tag = $('#limitTag'); if (tag) { tag.textContent = lim ? (over ? `⏰ 제한 ${Math.round(lim / 60000)}분 초과` : `⏰ 제한 ${Math.round(lim / 60000)}분`) : ''; tag.classList.toggle('over', !!over); }
  t.classList.toggle('over', !!over); t.classList.toggle('warn', !!lim && !over && lim - ms < 5 * 60000);
  t.title = lim ? `제한 시간 ${Math.round(lim / 60000)}분 — 넘기면 순위표·경험치에서 빠져요 (코인은 받아요)` : '';
}
function setObjective(ob, relics) {
  if (!ob) return;
  $('#objText').textContent = ob.text;
  $('#hintLeft').textContent = `(${ob.hintsLeft})`;
  if (relics != null) $('#relics').textContent = `${S.scenario?.relicName || '유품'} ${relics}/${S.scenario?.relicTotal || 7}`;
}

// ─────────────────────────── 입력
const keys = {};
const typing = () => document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
const loginOpen = () => !$('#login').classList.contains('hidden');
addEventListener('keydown', (e) => {
  if (!S.me || loginOpen() || cinema.active || !$('#timeLimitIntro').classList.contains('hidden')) return;
  if (S.storyOpen && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) { e.preventDefault(); closeStory(); return; }
  if (e.code === 'Escape') { if (S.modalOpen) closeModal(); hideMenus(); if (typing()) document.activeElement.blur(); S.combining = null; renderInv(); return; }
  if (S.modalOpen) { if (S.lockCtx) lockKey(e); return; }
  if (e.code === 'Enter') { if (typing()) return; e.preventDefault(); $('#chatInput').focus(); return; }
  if (typing()) { if (e.code === 'Tab' && !S.themeComms && document.activeElement === $('#chatInput')) { e.preventDefault(); setChatCh(S.chatCh === 'all' ? 'party' : 'all'); } return; }
  keys[e.code] = true;
  if (e.repeat && ['Space', 'KeyE', 'KeyF', 'KeyX', 'KeyT', 'KeyQ', 'KeyG', 'KeyZ', 'KeyB', 'KeyI', 'KeyP'].includes(e.code)) { e.preventDefault(); return; } // 누르고 있어도 한 번만 (키 반복 입력 무시)
  if (e.code === 'KeyE') { e.preventDefault(); if (S.nearest) interact(S.nearest); }
  if (e.code === 'Space') { e.preventDefault(); doEmote('jump'); }
  if (e.code === 'KeyX') toggleEmotePanel();
  if (e.code === 'KeyF') useItem('flashlight');
  if (e.code === 'KeyT') { if (S.inv.includes('talisman')) useItem('talisman'); else toast('부적이 없다.'); }
  if (e.code === 'KeyH' && S.room === 'game') socket.emit('game:hint');
  if (e.code === 'KeyJ') openJournal();
  if (e.code === 'KeyM') { SET.minimap = !SET.minimap; saveSettings(); }
  if (e.code === 'KeyC' && !e.repeat && !S.crouch) { S.crouch = true; updateStatus(); } // C 를 누르고 있는 동안만 웅크린다
  if (e.code === 'KeyG') sendPing();
  if (e.code === 'KeyQ') sendCallout();
  if (e.code === 'KeyR') cam.yaw = me.ry + Math.PI;
  if (e.code === 'KeyZ') toggleRide();
  if (e.code === 'KeyN' && !e.repeat) eatSnack(); // N = 냠냠 (V 는 조심조심 걷기)
  if (e.code === 'KeyB') swingSword();
  if (e.code === 'KeyI') openBag();
  if (e.code === 'KeyP') openShop();
  if (/^Digit[1-9]$/.test(e.code)) { const i = Number(e.code.slice(5)) - 1; if (S.inv[i]) primaryItem(S.inv[i], i); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyC' && S.crouch) { S.crouch = false; updateStatus(); } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (S.crouch) { S.crouch = false; updateStatus(); } });

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (cinema.active) return;
  if (e.button === 1) { e.preventDefault(); sendPing(); return; }
  drag = { x: e.clientX, y: e.clientY, moved: 0, btn: e.button }; canvas.setPointerCapture(e.pointerId); hideMenus(); if (typing()) document.activeElement.blur();
});
canvas.addEventListener('pointermove', (e) => {
  if (cinema.active) return;
  S.mouse.x = e.clientX; S.mouse.y = e.clientY;
  if (!drag) { hoverCheck(e); return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
  if (drag.moved > 5) { cam.yaw -= dx * 0.006 * SET.sens; cam.pitch = Math.max(0.12, Math.min(1.35, cam.pitch + dy * 0.004 * SET.sens)); $('#tooltip').classList.add('hidden'); }
});
canvas.addEventListener('pointerup', (e) => { if (drag && drag.moved <= 5 && drag.btn === 0) onClick(e); drag = null; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => { cam.dist = Math.max(2.5, Math.min(CAM_MAX, cam.dist + e.deltaY * 0.006)); }, { passive: true });

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pickObject(cx, cy) {
  if (!S.world?.objects) return null;
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = [];
  for (const ent of Object.values(S.world.objects)) if (ent.visible && ent.hit) hits.push(ent.hit);
  const r = ray.intersectObjects(hits, false);
  return r.length ? r[0].object.userData.objId : null;
}
function pickAvatar(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const ra = ray.intersectObjects([...S.others.values()], true);
  for (const h of ra) {
    let o = h.object, shown = true;
    for (let q = o; q; q = q.parent) if (!q.visible) { shown = false; break; }
    if (!shown) continue;
    while (o && !o.userData.id) o = o.parent;
    if (!o || h.object === o.userData.beam || h.object === o.userData.blob) continue;
    return o;
  }
  return null;
}
function groundAt(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null;
}
let hoverT = 0;
function hoverCheck(e) {
  const now = performance.now(); if (now - hoverT < 70) return; hoverT = now;
  const tt = $('#tooltip');
  const id = S.room === 'game' ? pickObject(e.clientX, e.clientY) : null;
  let label = null;
  const th = S.room === 'lobby' ? pickTheme(e.clientX, e.clientY) : null;
  if (th) label = `${THEME_INFO[th]?.title || ''} — 클릭해서 시작`;
  else if (S.room === 'lobby') { const ck = pickClickable(e.clientX, e.clientY); if (ck) label = { mailbox: '📮 고객소리함 — 버그 · 건의사항 보내기', wishstar: '🌠 소원의 별 — 소원빌기', vote: '🗳️ 테마 투표 전광판 — 투표하기', xmasgift: '🎁 크리스마스 선물상자 — 선물받기' }[ck] || null; }
  if (id) { const ent = S.world.objects[id]; label = (ent.done ? '✓ ' : '') + (ent.data.label || '') + (distTo(ent) > reach(ent) ? '  (클릭하면 다가감)' : ''); }
  else if (!th) { const av = pickAvatar(e.clientX, e.clientY); if (av) label = `${av.userData.name} (클릭: 메뉴)`; }
  canvas.style.cursor = label ? 'pointer' : 'default';
  if (label) { tt.textContent = label; tt.style.left = e.clientX + 14 + 'px'; tt.style.top = e.clientY + 14 + 'px'; tt.classList.remove('hidden'); } else tt.classList.add('hidden');
}
function onClick(e) {
  if (!S.me || S.modalOpen || cinema.active) return;
  if (S.room === 'lobby') { const th = pickTheme(e.clientX, e.clientY); if (th) { openThemePop(th); return; } const ck = pickClickable(e.clientX, e.clientY); if (ck) { lobbyAct(ck); return; } }
  const id = S.room === 'game' ? pickObject(e.clientX, e.clientY) : null;
  if (id) {
    const ent = S.world.objects[id];
    if (distTo(ent) <= reach(ent)) interact(id);
    else { S.moveTarget = { x: ent.data.x, z: ent.data.z }; S.pendingInteract = id; }
    return;
  }
  const av = pickAvatar(e.clientX, e.clientY);
  if (av) { openPlayerMenu(av.userData.id, av.userData.name, e.clientX, e.clientY); return; }
  const p = groundAt(e.clientX, e.clientY);
  if (p) { S.moveTarget = { x: p.x, z: p.z }; S.pendingInteract = null; showClickFx(p); }
}
const clickRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 24), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0, depthWrite: false }));
clickRing.rotation.x = -Math.PI / 2; scene.add(clickRing);
function showClickFx(p) { clickRing.position.set(p.x, 0.03, p.z); clickRing.material.opacity = 0.9; clickRing.scale.setScalar(1); }
function distTo(ent) { return Math.hypot(ent.data.x - me.x, ent.data.z - me.z); }
function reach(ent) { const f = ent.foot; return 1.7 + (f ? Math.max(f.hw, f.hd) : 0.3); }
function interact(id) {
  if (String(id).startsWith('snack-give:')) {
    if (S.room === 'lobby' && S.snack && !S.eatBusy) socket.emit('snack:give', id.slice('snack-give:'.length));
    return;
  }
  if (String(id).startsWith('L:')) return lobbyAct(id.slice(2)); audio.play('click'); socket.emit('game:interact', id); }

// 위치 찍기 (파티원에게 표시)
function sendPing() {
  if (!S.me) return;
  const p = groundAt(S.mouse.x, S.mouse.y);
  const x = p ? p.x : me.x, z = p ? p.z : me.z;
  socket.emit('ping', { x, z });
}
const pingGeo = markShared(new THREE.CylinderGeometry(0.08, 0.3, 4, 12, 1, true));
socket.on('ping', ({ x, z, from }) => {
  const m = new THREE.Mesh(pingGeo, new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, 2, z); scene.add(m);
  const label = textSprite(`📍 ${from}`, { size: 28, bg: 'rgba(120,20,20,.85)' }); label.position.set(x, 4.3, z); overlay.add(label);
  S.pings.push({ x, z, m, label, until: performance.now() + 5000 });
  audio.play('pipe');
  addChat({ channel: 'system', text: `📍 ${from} 님이 위치를 찍었습니다.` });
});
function clearPings() { for (const p of S.pings) { scene.remove(p.m); disposeTree(p.m); overlay.remove(p.label); disposeTree(p.label); } S.pings = []; clearCallouts(); }

// 외치기 ('어이!' '여기야!' …) — 말풍선 + 발밑 바닥 파형 + 지도 파형으로 내 위치를 알린다
let calloutAt = 0;
function sendCallout() {
  if (!S.me) return;
  const now = performance.now(); if (now - calloutAt < 2500) return toast('조금 있다가 다시 외칠 수 있어요.');
  calloutAt = now; socket.emit('callout');
}
const waveGeo = new THREE.RingGeometry(0.86, 1, 48);
const WAVE_LIFE = 2.8;
socket.on('callout', ({ id, name, x, z, word }) => {
  const g = id === S.me ? myAvatar : S.others.get(id);
  if (g) setBubble(g, `📢 ${word}`);
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(waveGeo, new THREE.MeshBasicMaterial({ color: '#ffd36a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 5; scene.add(m); return m;
  });
  S.callouts.push({ id, x, z, rings, t0: performance.now() });
  audio.play('pipe');
  if (id !== S.me) addChat({ channel: 'system', text: `📢 ${name}: "${word}"` });
});
function updateCallouts(now) {
  for (const c of S.callouts) {
    const g = c.id === S.me ? myAvatar : S.others.get(c.id);
    if (g) { c.x = g.position.x; c.z = g.position.z; }
    const y = (g ? g.position.y : 0) + 0.04;
    const age = (now - c.t0) / 1000;
    c.rings.forEach((m, i) => {
      const a = age - i * 0.4;
      if (a < 0 || age > WAVE_LIFE) { m.visible = false; return; }
      const ph = (a % 1.2) / 1.2; m.visible = true;
      m.position.set(c.x, y, c.z); m.scale.setScalar(0.4 + ph * 4.6);
      m.material.opacity = (1 - ph) * 0.85 * Math.min(1, (WAVE_LIFE - age) * 2);
    });
  }
  const dead = S.callouts.filter((c) => (now - c.t0) / 1000 > WAVE_LIFE);
  for (const c of dead) for (const m of c.rings) { scene.remove(m); m.material.dispose(); }
  if (dead.length) S.callouts = S.callouts.filter((c) => !dead.includes(c));
}
function clearCallouts() { for (const c of S.callouts) for (const m of c.rings) { scene.remove(m); m.material.dispose(); } S.callouts = []; }

// ─────────────────────────── 이동 & 충돌
const R = 0.32;
// 각도를 -π~π 로 (반복문 대신 나머지 연산 — 큰 값이 들어와도 한 번에 끝난다)
const wrapAng = (a) => { a = ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return Number.isFinite(a) ? a : 0; };
function collide(nx, nz, feetY = 0) {
  const cols = S.world?.colliders || [];
  for (let k = 0; k < 2; k++) for (const c of cols) {
    if (c.landing && feetY >= c.landing.y) continue;
    if (c.objId && S.world.objects[c.objId] && !S.world.objects[c.objId].visible) continue;
    const cx = Math.max(c.x - c.hw, Math.min(nx, c.x + c.hw));
    const cz = Math.max(c.z - c.hd, Math.min(nz, c.z + c.hd));
    const dx = nx - cx, dz = nz - cz; const d = Math.hypot(dx, dz);
    if (d < R) {
      if (d > 1e-4) { nx = cx + (dx / d) * R; nz = cz + (dz / d) * R; }
      else { const px = c.hw - Math.abs(nx - c.x), pz = c.hd - Math.abs(nz - c.z); if (px < pz) nx = c.x + Math.sign(nx - c.x || 1) * (c.hw + R); else nz = c.z + Math.sign(nz - c.z || 1) * (c.hd + R); }
    }
  }
  if (S.world?.bounds) { const d = Math.hypot(nx, nz); if (d > S.world.bounds) { nx *= S.world.bounds / d; nz *= S.world.bounds / d; } }
  return [nx, nz];
}
let stepT = 0;
function updateMove(dt) {
  if (!myAvatar) return;
  let ix = 0, iz = 0;
  const blocked = S.modalOpen || S.storyOpen || typing() || loginOpen();
  if (!blocked) {
    if (keys.KeyW || keys.ArrowUp) iz -= 1;
    if (keys.KeyS || keys.ArrowDown) iz += 1;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    if (!ix && !iz && S.joy) { ix = S.joy.x; iz = S.joy.y; }
  }
  // 놀이기구·벤치: 움직이면 내리고, 아니면 자리 위치를 따라간다
  if (S.mount) {
    if (ix || iz) dismount();
    else {
      if (S.em === 'snow' && (S.emT += dt) > EMOTE_DUR.snow) S.em = S.mount.kind === 'sit' || S.world?.rides?.[S.mount.ride]?.sit ? 'sit' : '';
      const p = mountPos();
      if (p) { me.x = p.x; me.z = p.z; me.y = p.y; me.ry = wrapAng(p.ry); }
      me.moving = false;
      myAvatar.position.set(me.x, me.y, me.z);
      myAvatar.rotation.y = me.ry;
      return;
    }
  }
  let vx = 0, vz = 0;
  const runKey = !!(keys.ShiftLeft || keys.ShiftRight);
  const sneak = !!((keys.KeyV && !runKey) || S.mSneak) && !blocked;
  if (sneak !== !!S.sneak) { S.sneak = sneak; updateStatus(); }
  const run = !!(runKey || (S.mRun && S.joy)) && !S.crouch && !sneak;
  if (run !== S.run) { S.run = run; updateStatus(); }
  const speed = (sneak ? 1.5 : S.crouch ? 2.0 : run ? 6.2 : 4.0) * (S.riding ? (S.profile?.equip?.mount === 'mount_turtle' ? 2 : 1.5) : 1); // 탈것을 탄 동안 1.5배 (거북이는 2배)
  if (ix || iz) {
    S.moveTarget = null; S.pendingInteract = null;
    const sin = Math.sin(cam.yaw), cos = Math.cos(cam.yaw);
    vx = -sin * -iz + cos * ix; vz = -cos * -iz - sin * ix;
    const l = Math.hypot(vx, vz); vx /= l; vz /= l;
  } else if (S.moveTarget) {
    const dx = S.moveTarget.x - me.x, dz = S.moveTarget.z - me.z; const d = Math.hypot(dx, dz);
    if (S.pendingInteract) { const ent = S.world.objects[S.pendingInteract]; if (ent && distTo(ent) <= reach(ent) - 0.2) { const id = S.pendingInteract; S.pendingInteract = null; S.moveTarget = null; interact(id); } }
    if (S.moveTarget && d > 0.15) { vx = dx / d; vz = dz / d; } else S.moveTarget = null;
  }
  // 웅크린 동안에는 걷지 않고 그 자리에서 방향만 돌린다
  if (S.crouch && (vx || vz)) {
    S.moveTarget = null; S.pendingInteract = null;
    const diff = wrapAng(Math.atan2(vx, vz) - me.ry); me.ry = wrapAng(me.ry + diff * Math.min(1, dt * 12));
    vx = 0; vz = 0;
  }
  me.moving = !!(vx || vz) && !blocked;
  const jumping = S.room === 'lobby' && !S.perch && S.em === 'jump';
  const previousFeetY = jumping ? jumpElevation(S.emT) : 0;
  if (S.em) { S.emT += dt; const d = EMOTE_DUR[S.em]; if ((me.moving && S.em !== 'jump' && S.em !== 'snow') || (d && S.emT > d)) S.em = ''; }
  const feetY = jumping ? jumpElevation(S.emT) : 0;
  const ox = me.x, oz = me.z;
  const nx = me.x + (me.moving ? vx * speed * dt : 0);
  const nz = me.z + (me.moving ? vz * speed * dt : 0);
  const landed = jumping && feetY < previousFeetY && S.world?.colliders?.find(({ x, z, landing }) => landing
    && previousFeetY >= landing.y && feetY <= landing.y
    && Math.abs(nx - x) <= landing.hw && Math.abs(nz - z) <= landing.hd);
  if (landed) {
    S.perch = { x: landed.x, z: landed.z, ...landed.landing };
    me.y = S.perch.y;
    S.em = '';
  }
  if (me.moving || landed) {
    if (S.perch) {
      const q = S.perch;
      if (Math.abs(nx - q.x) <= q.hw && Math.abs(nz - q.z) <= q.hd) { me.x = nx; me.z = nz; }
      else { S.perch = null; me.y = 0; [me.x, me.z] = collide(nx, nz); }
    } else [me.x, me.z] = collide(nx, nz, feetY);
  }
  if (me.moving) {
    if (S.moveTarget && Math.hypot(me.x - ox, me.z - oz) < speed * dt * 0.15) { S.stuck = (S.stuck || 0) + dt; if (S.stuck > 0.6) { S.moveTarget = null; S.stuck = 0; if (S.pendingInteract) { toast('가까이 갈 수 없다. 다른 방향에서 다가가 보자.'); S.pendingInteract = null; } } } else S.stuck = 0;
    let diff = Math.atan2(vx, vz) - me.ry; diff = wrapAng(diff);
    me.ry = wrapAng(me.ry + diff * Math.min(1, dt * 12));
    stepT += dt; if (stepT > (run ? 0.26 : S.crouch || sneak ? 0.6 : 0.36)) { stepT = 0; if (!S.crouch && !sneak) audio.step(S.world?.outdoor); }
  }
  myAvatar.position.set(me.x, me.y || 0, me.z);
  myAvatar.rotation.y = me.ry;
}
let sendT = 0, lastSent = '';
function netSend(dt) {
  sendT += dt; if (sendT < 0.1 || !S.me) return; sendT = 0; // 1초에 10번, 바뀌었을 때만
  const rd = rideTag();
  const k = `${(me.y || 0).toFixed(2)},${me.x.toFixed(2)},${me.z.toFixed(2)},${me.ry.toFixed(2)},${me.moving},${S.run},${S.crouch},${!!S.sneak},${S.em},${S.eid},${rd},${S.riding},${holdCode()}`;
  if (k === lastSent) return; lastSent = k;
  const n2 = (v) => Math.round(v * 100) / 100;
  socket.emit('move', { x: n2(me.x), z: n2(me.z), y: n2(me.y || 0), ry: n2(me.ry), anim: me.moving, run: S.run && me.moving, crouch: S.crouch || S.sneak, sneak: !!S.sneak, em: S.em, eid: S.eid, mount: !!S.riding, sword: holdCode() });
}
function rideTag() { return S.mount?.kind === 'ride' && S.room === 'lobby' ? `${S.mount.ride}:${S.mount.seat}` : ''; }
function updateStatus() {
  const parts = [];
  if (S.sneak) parts.push('🤫 조심조심 걷는 중 — 귀신이 눈치채지 못한다 (V)');
  if (S.crouch) parts.push('🫣 웅크림 (C)');
  if (S.run) parts.push('🏃 달리는 중 — 소리가 난다');
  if (S.light) parts.push('🔦 손전등 ON');
  $('#status').textContent = parts.join('   ');
}

// ─────────────────────────── 카메라
const camRay = new THREE.Raycaster();
// ───── 카메라와 캐릭터 사이를 가리는 벽·가구·나무는 반투명하게
const faded = new Map(); // mesh → { own: 자기 재질을 직접 바꿨는지, orig: 원래 재질/값 }
function occluderList() {
  const w = S.world; if (!w) return [];
  if (w._occ) return w._occ;
  const list = [];
  w.root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || !m.material || Array.isArray(m.material)) return;
    if (m.userData.noOcc) return; // 벽 장식·천장등·작은 잡동사니는 카메라를 가리지 않으므로 검사에서 뺀다
    if (m.material.isShaderMaterial || m.material.depthTest === false || m.material.side === THREE.BackSide) return;
    m.geometry.computeBoundingSphere?.();
    if ((m.geometry.boundingSphere?.radius || 0) * Math.max(m.scale.x, m.scale.y, m.scale.z) > 40) return; // 하늘·바다 같은 큰 것 제외
    if (!m.userData.objId && (m.geometry.boundingSphere?.radius || 0) * Math.max(m.scale.x, m.scale.y, m.scale.z) < 0.09) return; // 손가락만 한 조각은 가려도 티가 안 난다
    list.push(m);
  });
  w._occ = list; return list;
}
let fadedWorld = null;
const lensRay = new THREE.Raycaster(); const lensV = new THREE.Vector2();
const LENS_PTS = [[0, 0], [-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85], [0, -0.85], [0, 0.85]];
// 바닥·땅·러그처럼 납작하고 넓은 면은 투명하게 하면 아래 빈 공간이 비쳐 오히려 검어진다
function isFlat(m) { const b = m.userData._wb ||= new THREE.Box3().setFromObject(m); if (m.userData._flat == null) { const s = b.getSize(new THREE.Vector3()); m.userData._flat = s.y < 0.06 && Math.max(s.x, s.z) > 1.5; } return m.userData._flat; }
let occT = 0, lastHit = new Set();
/** 가림 처리로 반투명해진 물체를 모두 원래대로 돌려 놓는다 (그래픽 강화를 켜고 끌 때 물체의 재질이 바뀌므로, 그 전에 정리해 둔다 — 곧바로 다시 검사해서 필요한 것만 투명해진다) */
function restoreFaded() {
  for (const [m, st] of faded) {
    if (!m.parent) { if (!st.own) m.material.dispose(); continue; }
    if (st.own) { Object.assign(m.material, st.orig); m.material.needsUpdate = true; } else { m.material.dispose(); m.material = st.orig; }
  }
  faded.clear(); lastHit = new Set(); occT = 1;
}
function updateOccluders(dt, tx, ty, tz) {
  if (fadedWorld !== S.world) { faded.clear(); fadedWorld = S.world; }
  const list = occluderList();
  occT += dt; const doCast = occT >= 0.066 || fadedWorld._first !== true; if (doCast) { occT = 0; fadedWorld._first = true; }
  const hit = doCast ? new Set() : lastHit;
  if (doCast && list.length) {
    // 캐릭터 → 카메라 방향으로 쏴야 카메라가 물체 '안'에 들어가 있어도 잡힌다
    const from = new THREE.Vector3(tx, ty, tz);
    const dir = camera.position.clone().sub(from); const dist = dir.length();
    if (dist > 0.01) {
      dir.normalize();
      camRay.set(from, dir); camRay.far = dist + 0.6;
      for (const h of camRay.intersectObjects(list, false)) if (h.object.visible) hit.add(h.object);
      // 카메라 렌즈에 닿을 만큼 가까운 물체 (천장 장식·가구·나무 등)
      const wallSet = S.world._wallSet ||= new Set(S.world.walls || []);
      const cp = camera.position;
      for (const m of list) {
        if (wallSet.has(m) || !m.visible || isFlat(m)) continue;
        if (m.userData._wb.distanceToPoint(cp) < 0.75) hit.add(m);
      }
      // 렌즈 바로 앞(화면 가운데·네 귀퉁이)을 1.6m 안에서 막는 물체
      for (const [nx, ny] of LENS_PTS) {
        lensRay.setFromCamera(lensV.set(nx, ny), camera); lensRay.far = 1.6;
        for (const h of lensRay.intersectObjects(list, false)) if (h.object.visible && !wallSet.has(h.object) && !isFlat(h.object)) hit.add(h.object);
      }
      // 화면 가장자리 쪽도 조금 잡아서 반쯤 걸친 물체도 투명하게
      const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.35);
      for (const sgn of [-1, 1]) { const f2 = from.clone().addScaledVector(side, sgn); const d2 = camera.position.clone().addScaledVector(side, sgn).sub(f2); const l2 = d2.length(); camRay.set(f2, d2.normalize()); camRay.far = l2 + 0.4; for (const h of camRay.intersectObjects(list, false)) if (h.object.visible) hit.add(h.object); }
    }
  }
  lastHit = hit;
  const k = Math.min(1, dt * 8);
  for (const m of hit) {
    if (!faded.has(m)) {
      const own = (S.world.walls || []).includes(m) || !!m.userData.objId; // 이미 자기만의 재질
      const orig = own ? { transparent: m.material.transparent, opacity: m.material.opacity, depthWrite: m.material.depthWrite } : m.material;
      if (!own) { m.material = m.material.clone(); }
      m.material.transparent = true; m.material.needsUpdate = true;
      faded.set(m, { own, orig, base: own ? orig.opacity : m.material.opacity });
    }
    const st = faded.get(m);
    m.material.opacity += (0.22 * st.base - m.material.opacity) * k;
    m.material.depthWrite = false;
  }
  for (const [m, st] of faded) {
    if (hit.has(m)) continue;
    if (!m.parent) { if (!st.own) m.material.dispose(); faded.delete(m); continue; }
    m.material.opacity += (st.base - m.material.opacity) * k;
    if (m.material.opacity > st.base - 0.03) {
      if (st.own) { Object.assign(m.material, st.orig); m.material.needsUpdate = true; }
      else { m.material.dispose(); m.material = st.orig; }
      faded.delete(m);
    }
  }
}
const camGoal = new THREE.Vector3(); const camTarget = new THREE.Vector3(); const camDir = new THREE.Vector3();
// 벽에 걸린 카메라를 벽 안쪽으로. 벽에 바짝 붙어 있으면 머리 위에서 내려다보게 한다
// 캐릭터 둘레 여러 방향으로 벽까지 거리를 재서, 카메라가 가장 멀리 물러날 수 있는 방향(yaw)을 고른다 (뒤쪽 = 0 을 우선)
function bestOpenYaw() {
  const walls = S.world?.walls; if (!walls?.length) return 0;
  const from = new THREE.Vector3(me.x, 1.6, me.z); const want = Math.cos(cam.pitch) * cam.dist; let best = 0, bestD = -1;
  for (let i = 0; i < 16; i++) {
    const yaw = i % 2 ? Math.ceil(i / 2) * (Math.PI / 8) : -(i / 2) * (Math.PI / 8); // 0, +22.5°, -22.5°, +45° … 뒤쪽에 가까운 방향부터
    camRay.set(from, new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))); camRay.far = want;
    const h = camRay.intersectObjects(walls, false)[0]; const d = h ? h.distance : want;
    if (d > bestD + 0.5) { best = yaw; bestD = d; }
    if (d >= want) break;
  }
  return best;
}
function wallPull(out, from, dir, hitDist, ty) {
  const d = hitDist - 0.4;
  if (d >= 0.9) { out.copy(from).addScaledVector(dir, d); return; }
  const hx = dir.x, hz = dir.z, hl = Math.hypot(hx, hz) || 1;
  const off = Math.min(Math.max(0.1, (hitDist - 0.35) * 0.5), Math.max(0.05, hitDist - 0.15)); // 바로 위면 lookAt이 뒤집히므로 살짝 비켜서
  out.set(from.x + (hx / hl) * off, Math.min(S.world?.outdoor ? 99 : 3.15, ty + 1.9), from.z + (hz / hl) * off);
}
function updateCamera(dt) {
  const tx = me.x, ty = (S.crouch ? 0.62 : 0.78) + (me.y || 0), tz = me.z;
  camGoal.set(tx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, ty + Math.sin(cam.pitch) * cam.dist, tz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist);
  // 실내에서는 카메라가 천장 위로 올라가 화면이 까매지지 않게
  if (S.world && !S.world.outdoor) camGoal.y = Math.min(camGoal.y, 3.15);
  // 벽 너머로 카메라가 나가지 않게: 캐릭터와 카메라 사이에 벽이 있으면 벽 안쪽까지 당긴다
  const walls = S.world?.walls;
  if (walls?.length) {
    const from = camTarget.set(tx, ty, tz); const dir = camDir.copy(camGoal).sub(from); const len = dir.length();
    if (len > 0.01) {
      dir.divideScalar(len);
      camRay.set(from, dir); camRay.far = len + 0.4;
      const h = camRay.intersectObjects(walls, false)[0];
      if (h) wallPull(camGoal, from, dir, h.distance, ty);
    }
  }
  camera.position.lerp(camGoal, Math.min(1, dt * 10));
  // 벽 쪽으로 빠르게 돌릴 때 보간 때문에 잠깐이라도 벽 밖에 있지 않도록 한 번 더 확인
  if (walls?.length) {
    const from = camTarget.set(tx, ty, tz); const dir = camDir.copy(camera.position).sub(from); const len = dir.length();
    if (len > 0.01) { dir.divideScalar(len); camRay.set(from, dir); camRay.far = len + 0.3; const h = camRay.intersectObjects(walls, false)[0]; if (h) wallPull(camera.position, from, dir, h.distance, ty); }
  }
  camera.lookAt(tx, ty, tz);
  if (S.shake > 0) { S.shake -= dt; camera.position.x += (Math.random() - 0.5) * 0.15; camera.position.y += (Math.random() - 0.5) * 0.15; }
  updateOccluders(dt, tx, ty, tz);
  // 카메라가 캐릭터에 바짝 붙으면 내 캐릭터와 이름표를 반투명하게
  if (myAvatar) {
    const near = camera.position.distanceTo(camTarget.set(tx, ty, tz)) < 2.2;
    const goal = near ? 0.25 : 1;
    const u = myAvatar.userData;
    if (u.fadeO == null) u.fadeO = 1;
    if (Math.abs(u.fadeO - goal) > 0.01) {
      u.fadeO += (goal - u.fadeO) * Math.min(1, dt * 10);
      if (!u.fadeMats) { u.fadeMats = []; myAvatar.traverse((m) => { if (m.isMesh && m.material && !Array.isArray(m.material) && m !== u.beam) { m.material = m.material.clone(); u.fadeMats.push([m.material, m.material.opacity, m.material.transparent]); } }); }
      const done = u.fadeO > 0.98;
      for (const [mat, o0, t0] of u.fadeMats) { mat.transparent = done ? t0 : true; mat.opacity = done ? o0 : o0 * u.fadeO; mat.depthWrite = done || u.fadeO > 0.9; mat.needsUpdate = true; }
      if (u.tag) u.tag.material.opacity = u.fadeO;
    }
  }
}

// ─────────────────────────── 근처 상호작용
function updateNearest(t) {
  S.nearest = null; S.nearestVerb = null;
  if (S.room === 'lobby' && S.world?.interactives) { lobbyNearest(); return; }
  if (!S.world?.objects || S.room !== 'game') { $('#prompt').classList.add('hidden'); return; }
  // 여러 물건이 손 닿는 곳에 겹쳐 있으면: 이미 끝낸 것 · 읽기만 하는 쪽지보다, 아직 풀거나 주울 것이 남은 물건을 먼저 고른다
  // (쪽지가 자물쇠 바로 앞에 놓여 있어 버튼으로는 자물쇠를 누를 수 없던 문제)
  let best = 1e9;
  for (const [id, ent] of Object.entries(S.world.objects)) {
    if (!ent.visible || ent.data.kind === 'deco') continue;
    const d = distTo(ent);
    if (ent.marker) { ent.marker.material.opacity = d < 6 ? (ent.done ? 0.15 : 0.45 + Math.sin(t * 3 + d) * 0.25) : 0; ent.marker.material.color.set(ent.done ? '#888' : '#ffe9a8'); }
    const score = d + (ent.done ? 0.7 : 0) + (ent.data.kind === 'examine' || ent.data.kind === 'signal' ? 0.3 : 0);
    if (d <= reach(ent) && score < best) { best = score; S.nearest = id; }
  }
  for (const [id, ent] of Object.entries(S.world.objects)) {
    const on = id === S.nearest;
    if (ent.hl !== on) { ent.hl = on; ent.group.traverse((m) => { if (m.isMesh && m.material.emissive) { const ud = m.material.userData; if (typeof ud.e0hex !== 'number') ud.e0hex = Number.isFinite(m.material.emissive.r + m.material.emissive.g + m.material.emissive.b) ? m.material.emissive.getHex() : 0; if (!Number.isFinite(ud.i0)) ud.i0 = Number.isFinite(m.material.emissiveIntensity) ? m.material.emissiveIntensity : 1; if (on) { m.material.emissive.set('#3a2a10'); m.material.emissiveIntensity = 1; } else { m.material.emissive.setHex(ud.e0hex); m.material.emissiveIntensity = ud.i0; } } }); }
  }
  const p = $('#prompt');
  if (S.nearest && !S.modalOpen && !S.storyOpen) {
    const ent = S.world.objects[S.nearest];
    const verb = { examine: '살펴보기', pickup: '줍기', lock: '풀기', use: '사용하기', coop: '당기기 (협동)', door: '들어가기' }[ent.data.kind] || '상호작용';
    p.innerHTML = `<kbd>E</kbd>${ent.data.label || ''} ${verb}${ent.done ? ' ✓' : ''}`;
    p.classList.remove('hidden');
  } else p.classList.add('hidden');
}

// ─────────────────────────── 다른 플레이어 & 귀신
// 서버는 1초에 10번, '바뀐 사람'만 보낸다 → 사람마다 마지막 상태를 기억해 두고 고쳐 쓴다
//  한 사람 = [id, x, z, y, ry, 깃발(걷기1·웅크림2·손전등4), { n 이름, lv 외형 번호, pt 파티, g 장비, em·eid 감정표현, rd 놀이기구 }?]
S.net = new Map();
function applyPlayer(e) {
  let p = S.net.get(e[0]); if (!p) { p = { id: e[0] }; S.net.set(e[0], p); }
  p.x = e[1]; p.z = e[2]; p.y = e[3]; p.ry = e[4]; p.anim = e[5] & 1; p.crouch = e[5] & 2 ? 1 : 0; p.light = !!(e[5] & 4);
  const x = e[6]; if (x) { p.name = x.n; p.lv = x.lv; p.partyId = x.pt || null; p.gear = x.g; p.em = x.em; p.eid = x.eid; p.ride = x.rd; p.et = x.et || 0; p.st = x.st || 0; }
  return p;
}
/** 다른 사람 한 명을 화면에 맞춘다 (캐릭터 만들기 · 외형 받기 · 감정표현 · 손전등 · 파티 표시) */
function syncOther(p) {
  if (!p || p.id === S.me || p.name == null) return; // 이름을 아직 못 받았으면 곧 오는 전체 상태를 기다린다
  const lk = S.looks.get(p.id);
  if (!lk || lk.lv !== p.lv) { if (!S.lookReq.has(p.id)) { S.lookReq.add(p.id); socket.emit('look:get', p.id); } if (!lk) return; }
  let g = S.others.get(p.id);
  if (!g || g.userData.lv !== lk.lv) {
    const pos = g ? g.position.clone() : new THREE.Vector3(p.x, 0, p.z);
    if (g) removeAvatar(g);
    g = makeAvatar(p.id, p.name, lk.look, false);
    g.userData.lv = lk.lv; g.position.copy(pos);
    S.others.set(p.id, g);
  }
  if (g.userData.eid !== p.eid || g.userData.em !== p.em) {
    const fresh = g.userData.eid != null;
    g.userData.eid = p.eid;
    g.userData.em = p.em;
    g.userData.emT = 0;
    if (p.em === 'jump' && fresh) audio.play('pickup');
    if (p.em === 'fart' && fresh) doFart(g, p.x, p.y || 0, p.z, p.ry);
    if (p.em === 'snow') throwSnow(g, () => g.userData.eid === p.eid && g.userData.em === 'snow');
  }
  if (g.userData.et !== p.et) { const fresh = g.userData.et != null; g.userData.et = p.et; if (fresh && p.et) { g.userData.eatT = 0.9; const sn = (p.gear || '').split('|')[6] || ''; if (myAvatar && Math.hypot(p.x - me.x, p.z - me.z) < 9) setTimeout(() => audio.play(sn[0] === 'c' ? 'slurp' : 'crunch'), 320); } }
  g.userData.target = p;
  setLight(g, p.light);
  const inParty = !!S.party?.members.some((m) => m.id === p.id);
  if (g.userData.inParty !== inParty || g.userData.tagName !== p.name || g.userData.tagSt !== p.st) { g.userData.inParty = inParty; g.userData.tagName = p.name; g.userData.tagSt = p.st; setTag(g, (inParty ? '★ ' : '') + p.name, inParty ? '#8fd3ff' : '#fff', rankOf(p.st || 0)); }
}
const syncAllOthers = () => { for (const p of S.net.values()) syncOther(p); };
function dropOther(id) { S.net.delete(id); const g = S.others.get(id); if (g) { removeAvatar(g); S.others.delete(id); } }
socket.on('look', ({ id, lv, look: lk }) => {
  S.lookReq.delete(id);
  S.looks.set(id, { lv, look: lk });
  syncOther(S.net.get(id)); // 가만히 서 있는 사람은 새 소식이 오지 않으므로, 외형을 받는 즉시 그린다
});
socket.on('state', (m) => {
  S.lastStateAt = performance.now();
  const seen = m.f ? new Set() : null; // f: 방 안 전체 목록 (여기 없는 사람은 나간 사람)
  for (const e of m.p || []) {
    const p = applyPlayer(e); seen?.add(p.id);
    if (p.id === S.me) {
      S.myLight = p.light;
      // 서버와 손전등 상태가 어긋났으면 서버에 맞춘다 (방금 내가 누른 직후에는 잠깐 기다린다)
      if (p.light !== S.light && performance.now() - (S.lightAt || 0) > 900) { S.light = p.light; renderInv(); }
      continue;
    }
    syncOther(p);
  }
  if (seen) for (const id of [...S.net.keys()]) if (!seen.has(id)) dropOther(id);
  if ('g' in m) syncGhosts(m.g);
});
function syncGhosts(ghosts) {
  const live = new Set();
  if (ghosts && S.room === 'game') {
    for (const gs of ghosts) {
      live.add(gs.i);
      let e = S.ghosts.get(gs.i);
      if (!e || e.G.userData.type !== gs.type) { if (e) { scene.remove(e.G); disposeTree(e.G); } const G = createGhost(gs.type); if (S.scenario?.id === 'christmas') { dressXmas(G); if (!e) audio.play('sting'); } G.position.set(gs.x, 0, gs.z); scene.add(G); e = { G, st: gs, soundT: 0 }; S.ghosts.set(gs.i, e); } // 크리스마스편: 산타 자동인형 + 원래 등장음
      e.st = gs;
    }
  }
  for (const [i, e] of S.ghosts) if (!live.has(i)) { scene.remove(e.G); disposeTree(e.G); S.ghosts.delete(i); }
  if (!S.ghosts.size) { S.danger = 0; $('#vignette').classList.remove('danger'); audio.chase(0); }
}
function removeGhost() { for (const e of S.ghosts.values()) { scene.remove(e.G); disposeTree(e.G); } S.ghosts.clear(); S.danger = 0; $('#vignette').classList.remove('danger'); }
socket.on('player:leave', (id) => dropOther(id));

let ghostSoundT = 0;
const crowdFrustum = new THREE.Frustum();
const crowdMatrix = new THREE.Matrix4();
const crowdBounds = new THREE.Sphere();
function updateOthers(dt, t) {
  const crowded = S.room === 'lobby' && S.others.size >= 6;
  if (crowded) crowdFrustum.setFromProjectionMatrix(crowdMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  const frameDt = dt;
  for (const g of S.others.values()) {
    dt = frameDt;
    const p = g.userData.target; if (!p) continue;
    const u = g.userData;
    if (crowded) {
      crowdBounds.center.set(p.x, (p.y || 0) + 1.8, p.z);
      crowdBounds.radius = 6; // 큰 썰매와 날개까지 화면 가장자리에서 잘리지 않게 포함한다.
      g.visible = crowdFrustum.intersectsSphere(crowdBounds);
      g.matrixWorldAutoUpdate = g.visible;
      u.crowdDt = (u.crowdDt || 0) + dt;
      const distance = Math.hypot(p.x - me.x, p.z - me.z);
      const interval = g.visible ? (distance < 9 ? 0 : 1 / 30) : 1 / 8;
      if (u.crowdDt < interval) continue;
      dt = Math.min(u.crowdDt, .2);
      u.crowdDt = 0;
    } else {
      g.visible = true;
      g.matrixWorldAutoUpdate = true;
      u.crowdDt = 0;
    }
    if (p.ride && S.room === 'lobby') {
      const [rn, si] = p.ride.split(':'); const rp = S.world?.rides?.[rn]?.pos(Number(si));
      if (rp) { g.position.set(rp.x, rp.y, rp.z); g.rotation.y = rp.ry; g.userData.emT = (g.userData.emT || 0) + dt; animateAvatar(g, dt, false, t, false, p.em || null, g.userData.emT); applyGear(g, (p.gear || '').replace(/\|1\|/, '|0|')); animateGear(g, t, dt, false); continue; }
    }
    const k = Math.min(1, dt * 10);
    g.position.x += (p.x - g.position.x) * k; g.position.z += (p.z - g.position.z) * k; g.position.y += ((p.y || 0) - g.position.y) * k;
    let diff = p.ry - g.rotation.y; diff = wrapAng(diff);
    g.rotation.y += diff * k;
    g.userData.emT = (g.userData.emT || 0) + dt;
    animateAvatar(g, dt, !!p.anim, t, !!p.crouch, p.em || null, g.userData.emT);
    applyGear(g, p.gear || ''); animateGear(g, t, dt, !!p.anim);
  }
  dt = frameDt;
  S.danger = 0;
  if (myAvatar) setLight(myAvatar, S.myLight ?? S.light);
  for (const e of S.ghosts.values()) {
    const gs = e.st, G = e.G;
    const frozen = gs.lit && (gs.type === 'woman' || gs.type === 'doll');
    if (!frozen) {
      G.position.x += (gs.x - G.position.x) * Math.min(1, dt * 6);
      G.position.z += (gs.z - G.position.z) * Math.min(1, dt * 6);
      let diff = (gs.ry || 0) - G.rotation.y; diff = wrapAng(diff);
      G.rotation.y += diff * Math.min(1, dt * 8);
    }
    const d = Math.hypot(G.position.x - me.x, G.position.z - me.z);
    if (gs.mode === 'hunt' && d < 5) G.lookAt(me.x, G.position.y, me.z);
    // 가까울수록 깜박이며 순간이동하듯 보인다
    G.visible = gs.v && !(d < 7 && !frozen && Math.random() < 0.1);
    // 그림자 귀신은 손전등에 비춰지거나 아주 가까이 와야만 보인다
    if (gs.type === 'shadow') G.visible = gs.v && (gs.lit || d < 2.2 || (S.light && d < 5 && Math.random() < 0.5));
    animateGhost(G, dt, t, gs, d);
    const lvl = gs.v ? Math.max(0, 1 - d / (gs.mode === 'hunt' ? 12 : 8)) * (gs.mode === 'hunt' ? 1 : 0.5) : 0;
    if (lvl < S.danger) continue;
    S.danger = lvl;
    audio.heartbeat(lvl);
    audio.chase(gs.mode === 'hunt' && lvl > 0.35 ? lvl : 0);
    $('#vignette').classList.toggle('danger', lvl > 0.45);
    if (lvl > 0.55 && S.world?.ceiling) for (const c of S.world.ceiling) if (!S.dark) c.light.intensity = Math.random() < 0.3 ? 0 : c.base;
    if (myAvatar && S.light && lvl > 0.5) setLight(myAvatar, Math.random() > 0.25);
    e.soundT -= dt;
    if (gs.v && d < 13 && e.soundT < 0) {
      const sounds = { zombie: ['zombie', 1.7], janitor: ['stomp', 0.55], elder: ['pipe', 2.2], woman: ['whisper', 2.4], mudang: ['crawl', 0.45], child: ['giggle', 3], sailor: ['water_step', 0.6], doll: ['clock_tick', 0.4], father: ['snip', 1.1], dalgyal: ['hum', 2.6], slender: ['static_hiss', 1.8], nurse: ['cart', 0.9], headless: ['drag', 0.8], shadow: ['whisper', 3] };
      const [snd, gap] = S.scenario?.id === 'christmas' && gs.type === 'marionette' ? [['musicbox_far', 'giggle', 'creak', 'whisper'][Math.floor(Math.random() * 4)], 2.2] : sounds[gs.type] || ['whisper', 2]; // 크리스마스 자동인형: 고장 난 오르골 · 웃음 · 삐걱
      e.soundT = gap * (gs.mode === 'hunt' ? 1 : 1.8) * (0.6 + d / 13);
      if (Math.random() < 1 - d / 15) audio.play(snd);
      // (귀신 가까이에서 나던 종소리 — 무당 방울 · 인형의 '띵' — 는 뺐다)
    }
  }
}

// ─────────────────────────── 미니맵
const mm = $('#minimap'), mmx = mm.getContext('2d');
let mmT = 0;
function drawMinimap(dt, t) {
  mm.classList.toggle('hidden', !SET.minimap || !S.world);
  mmT += dt; if (mmT < 0.15 || !SET.minimap || !S.world) return; mmT = 0;
  const W = mm.width, H = mm.height; mmx.clearRect(0, 0, W, H);
  const size = S.room === 'lobby' ? [60 * LS, 60 * LS] : S.world.size || [26, 22];
  const sc = (Math.min(W, H) - 16) / Math.max(size[0], size[1]);
  const P = (x, z) => [W / 2 + x * sc, H / 2 + z * sc];
  mmx.strokeStyle = 'rgba(255,255,255,.25)'; mmx.lineWidth = 1;
  if (S.room === 'lobby') { mmx.beginPath(); mmx.arc(W / 2, H / 2, 28.5 * LS * sc, 0, Math.PI * 2); mmx.stroke(); mmx.fillStyle = 'rgba(63,143,200,.8)'; { const [px2, pz2] = P(0, -25.6 * LS); mmx.beginPath(); mmx.arc(px2, pz2, 4.6 * sc, 0, Math.PI * 2); mmx.fill(); } mmx.strokeStyle = 'rgba(255,63,108,.55)'; mmx.lineWidth = 2; mmx.beginPath(); mmx.arc(W / 2, H / 2, 22 * LS * sc, 0, Math.PI * 2); mmx.stroke(); const fp = S.world.rides?.coaster?.front(); if (fp) { const [cx2, cz2] = P(fp.x, fp.z); mmx.fillStyle = '#ff3f6c'; mmx.beginPath(); mmx.arc(cx2, cz2, 4, 0, Math.PI * 2); mmx.fill(); } }
  else {
    mmx.strokeRect(W / 2 - size[0] / 2 * sc, H / 2 - size[1] / 2 * sc, size[0] * sc, size[1] * sc);
    mmx.fillStyle = 'rgba(200,190,170,.35)';
    for (const w of S.world.walls) { const p = w.geometry.parameters; const [x, z] = P(w.position.x, w.position.z); mmx.fillRect(x - p.width / 2 * sc, z - p.depth / 2 * sc, p.width * sc, p.depth * sc); }
    for (const ent of Object.values(S.world.objects)) {
      if (!ent.visible || ent.data.kind === 'deco') continue;
      const [x, z] = P(ent.data.x, ent.data.z);
      mmx.fillStyle = ent.done ? 'rgba(140,140,140,.6)' : ent.data.kind === 'door' ? '#7fd17f' : '#ffd36a';
      mmx.beginPath(); mmx.arc(x, z, ent.data.kind === 'door' ? 3.5 : 2.2, 0, Math.PI * 2); mmx.fill();
    }
  }
  // 다른 사람: 회색 점 · 파티 친구: 하늘색 큰 점 + 흰 테두리 + 이름 (지도 밖이면 가장자리에 붙여서)
  const clampP = (x, z) => [Math.max(6, Math.min(W - 6, x)), Math.max(6, Math.min(H - 6, z))];
  const others = [...S.others.values()].filter((g) => g.visible !== false);
  for (const g of others) {
    if (g.userData.inParty) continue;
    const [x, z] = clampP(...P(g.position.x, g.position.z));
    mmx.fillStyle = 'rgba(225,220,230,.85)'; mmx.strokeStyle = 'rgba(0,0,0,.6)'; mmx.lineWidth = 1;
    mmx.beginPath(); mmx.arc(x, z, 3, 0, Math.PI * 2); mmx.fill(); mmx.stroke();
  }
  for (const g of others) {
    if (!g.userData.inParty) continue;
    const [x, z] = clampP(...P(g.position.x, g.position.z));
    const pulse = 1 + Math.sin(t * 4) * 0.25;
    mmx.strokeStyle = 'rgba(95,184,255,.45)'; mmx.lineWidth = 2; mmx.beginPath(); mmx.arc(x, z, 8 * pulse, 0, Math.PI * 2); mmx.stroke();
    mmx.fillStyle = '#4fb4ff'; mmx.strokeStyle = '#fff'; mmx.lineWidth = 1.5;
    mmx.beginPath(); mmx.arc(x, z, 5, 0, Math.PI * 2); mmx.fill(); mmx.stroke();
  }
  for (const p of S.pings) { const [x, z] = P(p.x, p.z); mmx.strokeStyle = '#ff5a4a'; mmx.lineWidth = 2; mmx.beginPath(); mmx.arc(x, z, 5 + Math.sin(t * 8) * 2, 0, Math.PI * 2); mmx.stroke(); }
  const nowMs = performance.now();
  for (const c of S.callouts) {
    const age = (nowMs - c.t0) / 1000; const [x, z] = P(c.x, c.z);
    for (let i = 0; i < 3; i++) { const a = age - i * 0.4; if (a < 0) continue; const ph = (a % 1.2) / 1.2; mmx.strokeStyle = `rgba(255,211,106,${(1 - ph) * 0.9})`; mmx.lineWidth = 2; mmx.beginPath(); mmx.arc(x, z, 3 + ph * 16, 0, Math.PI * 2); mmx.stroke(); }
  }
  const [mx, mz] = P(me.x, me.z);
  mmx.save(); mmx.translate(mx, mz); mmx.rotate(-me.ry + Math.PI);
  mmx.fillStyle = '#fff'; mmx.beginPath(); mmx.moveTo(0, -7); mmx.lineTo(5, 5); mmx.lineTo(-5, 5); mmx.closePath(); mmx.fill(); mmx.restore();
}

// ─────────────────────────── 메인 루프
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta()); const t = clock.elapsedTime;
  if (cinema.active) { cinema.update(dt); cinema.render(); return; }
  if (S.me && S.world && myAvatar) {
    updateMove(dt);
    animateAvatar(myAvatar, dt, me.moving, t, S.crouch || S.sneak, S.em || null, S.emT);
    applyGear(myAvatar, myGear()); animateGear(myAvatar, t, dt, me.moving);
    if (cashObj) { cashObj.userData.anim(t); if (!cashObj.userData.sent && S.room === 'game' && Math.hypot(me.x - cashObj.position.x, me.z - cashObj.position.z) < 0.9) { cashObj.userData.sent = true; socket.emit('cash:take'); setTimeout(() => { if (cashObj) cashObj.userData.sent = false; }, 3000); } }
    updateOthers(dt, t);
    updateVoiceRings(dt);
    updateCamera(dt);
    updateNearest(t);
    netSend(dt);
    if (S.room === 'lobby' && S.world.rides?.swing) { const b = new Set(); if (S.mount?.ride === 'swing') b.add(S.mount.seat); for (const g of S.others.values()) { const rd = g.userData.target?.ride; if (rd?.startsWith('swing:')) b.add(Number(rd.split(':')[1])); } S.world.rides.swing.setBusy(b); }
    S.world.shopFace?.(me.x, me.z);
    S.world.update?.(t, dt);
    graphics.update(camera.position, me); watchPerf(performance.now());
    updateThemeBubble();
    // 보조광: 머리 위가 아니라 카메라 쪽에서 넓게 비춰 캐릭터 머리가 하얗게 빛나지 않게 한다
    fill.position.copy(camera.position); fill.position.y = Math.min(fill.position.y, 3.8);
    fill.intensity = S.room === 'lobby' ? 2.2 : 2.6;
    if (clickRing.material.opacity > 0) { clickRing.material.opacity -= dt * 1.5; clickRing.scale.multiplyScalar(1 + dt * 1.5); }
    const now = performance.now();
    for (const p of S.pings) { p.m.material.opacity = 0.35 + Math.sin(t * 8) * 0.25; if (now > p.until) { scene.remove(p.m); disposeTree(p.m); overlay.remove(p.label); disposeTree(p.label); } }
    S.pings = S.pings.filter((p) => now <= p.until);
    if (S.callouts.length) updateCallouts(now);
    drawMinimap(dt, t);
    randomHorror(dt);
  }
  updateLabels(); updateHearts(dt); updateFx(dt);
  const inLobby = S.room === 'lobby';
  if (inLobby !== S._lobbyCls) { S._lobbyCls = inLobby; document.body.classList.toggle('in-lobby', inLobby); }
  updateGameTimer();
  fx.adapt(performance.now()); // 끊기면 해상도를 조금씩 낮춘다
  { const gp = S.room === 'lobby' && S.mount?.ride === 'gyro' ? S.world?.rides?.gyro?.phase?.() || '' : ''; if (gp === 'drop' && S.gyroPh !== 'drop') audio.play('drop'); S.gyroPh = gp; } // 자이로 드롭이 떨어지는 순간
  fx.render(t, { danger: S.danger, mode: inLobby ? 'lobby' : 'game' });
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(overlay, camera); renderer.autoClear = true;
}
loop();

// 로비 테마 관문: 가까이 가면 설명 말풍선
const THEME_INFO = {
  christmas: { title: '🎄 크리스마스 특별판 — 자정에 반송된 선물', tag: '특별판 · 광학 퍼즐 · 6챕터', color: '#ffe0a0',
    story: '12월 24일 23:57. 당신 앞으로 도착한 소포의 발송일은 내일이다. 소포를 가져간 붉은 외투를 쫓아, 자정이 되기 전에 마지막 열차를 찾아라.' },
  zombie: { title: '🧟 데드 시티 — 마지막 헬기 (히든)', tag: '히든 테마 · 좀비 도시 → 백화점 5층 → 옥상 헬기 · 7챕터 · 역대급 퍼즐 · 약 4~5시간', color: '#8aff5a',
    story: '2026년 11월, R-9 감염 사태 사흘째. 무너진 한빛시에서 구조 헬기 매-7의 마지막 방송이 들린다. "05시 정각, 그랜드 한빛 백화점 옥상." 좀비로 가득한 백화점을 지하주차장부터 옥상까지 올라가 헬기에 오르자. 그리고 — 노란 풍선을 든 아이를 찾아서.' },
  gwimun: { title: '鬼門 귀문 — 서하리 분교 실종사건', tag: '한국 괴담 · 폐분교 · 7챕터 · 약 4~5시간', color: '#ff6a5a',
    story: '1979년 11월 7일, 서하분교 3학년 아이 일곱 명이 집에 돌아오지 않았다. 댐에 마을이 잠기기 직전, 심야 괴담 방송 크루가 서하리로 가는 막차에 오른다.' },
  ophelia: { title: '⚓ 오필리아호의 마지막 항해', tag: '유령선 · 등대 · 모스 부호 · 4챕터 · 약 2~3시간', color: '#7ae0ff',
    story: '1931년 상하이를 떠난 여객선 오필리아호는 부산에 닿지 못했다. 그날 밤 등대는 꺼져 있었고, 선장은 3등칸 철창문을 잠갔다. 매년 11월 안개 낀 밤이면 그 배가 돌아온다.' },
  doll: { title: '🎎 인형의 집 — 하트웰 저택', tag: '저주받은 인형 · 서양 저택 · 위자보드 · 4챕터 · 약 2~3시간', color: '#eaa8ff',
    story: '철거를 사흘 앞둔 서양식 저택, 하트웰 하우스. 밤마다 2층 창문에 인형이 서 있다. 1958년 클라라의 여덟 번째 생일 파티에 초대된 다섯 아이는 어디로 갔을까.' },
  hospital: { title: '🏥 백야 요양병원 — 7병동의 밤', tag: '폐병원 · 수면 치료 · 화재의 밤 · 4챕터 · 약 2~2.5시간', color: '#9affc8',
    story: '1994년 성탄 전야, 7병동 병실 문은 밖에서 잠겨 있었고 그날 밤 불이 났다. 32년이 지난 지금도 새벽마다 7병동 호출벨이 울린다. 아직 아무도 그들을 깨워 주지 않았다.' },
  camp: { title: '🏕️ 반딧불 캠프 — 마지막 캠프파이어', tag: '여름 캠프 · 숲과 호수 · 입문용 · 4챕터 · 약 1.5~2시간', color: '#ffd76a',
    story: '2003년 여름 캠프 마지막 밤, 담력 시험을 떠난 반딧불 조 아이 넷이 돌아오지 않았다. 문 닫은 수련원 호숫가에는 가을에도 반딧불이 뜬다. 처음 방탈출을 해 본다면 여기서부터.' },
  west: { title: '🤠 레드 메사 — 교수대 마을', tag: '서부 웨스턴 · 유령 마을 · 누명 · 4챕터 · 약 2~3시간', color: '#ff9a50',
    story: '1887년, 애리조나 은광 마을. 은행 강도의 누명을 쓰고 목매달린 떠돌이 잭 모로우. 그날 밤 모래폭풍이 마을을 삼켰다. 140년째 교수대의 밧줄이 바람 없이 흔들린다.' },
  mia: { title: '🔰 미아 — 달빛 문방구의 숨바꼭질', tag: '입문 · 골목 문방구 · 조작을 하나씩 배워요 · 3챕터 · 약 20~30분', color: '#ffe066',
    story: '1996년 어린이날, 숨바꼭질을 하던 일곱 살 미아가 사라졌다. 30년이 지난 지금도 밤마다 문 닫은 문방구 앞에서 누군가 "미아야…" 하고 부른다. 처음 방탈출을 해 본다면 여기서 시작하세요.' },
  park: { title: '🎡 해피니스 랜드 — 폐장하지 않는 밤', tag: '폐놀이공원 · 움직이는 놀이기구 · 3중 반전 · 10챕터 · 끝판왕 · 약 5~6시간', color: '#ffb0e0',
    story: '2006년 7월 7일 밤, 새 놀이기구 스카이드롭 시운전 중 어린이 여섯 명이 숨졌다. 정비공의 실수라고 했다. 20년이 지난 지금도 매년 7월 7일 자정이면 문 닫은 놀이공원의 불이 켜지고, 토끼 해피가 다정하게 손님을 맞는다. 모든 것이 거짓말이었다.' },
  clown: { title: '🎪 삐에로 — 블루문 서커스의 마지막 앵콜', tag: '폐유원지 · 서커스 · 누명 · 7챕터 · 난이도 최상 · 약 4~5시간', color: '#ff2a6a',
    story: '1998년 성탄 전야, 블루문 서커스의 고별 공연 중 여덟 살 은별이가 사라졌다. 단장은 "광대가 아이를 데려갔다"고 했다. 28년째 성탄 전야 밤 8시면, 문 닫은 유원지의 빈 천막에서 왈츠가 흐른다. 관객석에서 웃는 삐에로는 — 뽀삐가 아니다.' },
  kimono: { title: '🏮 츠바키야 — 붉은 동백의 밤', tag: '일본풍 여관 · 기모노 · 혼례의 밤 · 4챕터 · 약 2~3시간', color: '#ff5a7a',
    story: '1926년 봄, 산골 온천 여관 츠바키야. 혼례 전날 밤, 여관집 딸 유키는 붉은 동백 기모노를 입은 채 사라졌다. 동백이 지는 밤이면 지금도 그 기모노가 복도를 걷는다.' },
};
const DIFF_NAME = { 1: '아주 쉬움', 2: '쉬움', 3: '보통', 4: '어려움', 5: '매우 어려움', 6: '최상 · 악몽' };
const diffOf = (id) => (S.scenarios || []).find((x) => x.id === id)?.difficulty || 3;
const diffStars = (n) => (n > 5 ? '★★★★★💀' : '★'.repeat(n) + '☆'.repeat(5 - n));
const diffText = (n) => `난이도 ${diffStars(n)} ${DIFF_NAME[n] || ''}`;
function themeBubbleSprite(info) {
  const c = document.createElement('canvas'); const x = c.getContext('2d');
  const W = 640, pad = 28;
  const wrapW = (txt, font, max) => { x.font = font; const out = []; let l = ''; for (const w of txt.split(' ')) { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > max && l) { out.push(l); l = w; } else l = t; } if (l) out.push(l); return out; };
  const fT = '800 34px "Nanum Myeongjo", serif', fG = '700 22px "Gowun Dodum", sans-serif', fS = '700 25px "Gowun Dodum", sans-serif', fH = '700 21px "Gowun Dodum", sans-serif';
  const tl = wrapW(info.title, fT, W - pad * 2), sl = wrapW(info.story, fS, W - pad * 2);
  const H = pad + tl.length * 46 + 36 + 40 + 12 + sl.length * 36 + 14 + 30 + pad + 18;
  c.width = W; c.height = H;
  x.fillStyle = 'rgba(14,10,18,.94)'; x.strokeStyle = info.color; x.lineWidth = 4;
  const r = 20, h = H - 18;
  x.beginPath(); x.moveTo(r, 2); x.arcTo(W - 2, 2, W - 2, h, r); x.arcTo(W - 2, h, 2, h, r); x.arcTo(2, h, 2, 2, r); x.arcTo(2, 2, W - 2, 2, r); x.closePath(); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(W / 2 - 16, h - 2); x.lineTo(W / 2, H - 2); x.lineTo(W / 2 + 16, h - 2); x.closePath(); x.fill(); x.stroke();
  x.fillRect(W / 2 - 14, h - 6, 28, 6);
  x.textBaseline = 'top'; let y = pad;
  x.font = fT; x.fillStyle = info.color; tl.forEach((l) => { x.fillText(l, pad, y); y += 46; });
  x.font = fG; x.fillStyle = '#b8a8b4'; x.fillText(info.tag, pad, y); y += 36;
  x.font = '800 24px "Gowun Dodum", sans-serif'; x.fillStyle = '#ffd36a'; x.fillText(diffText(info.diff || 3), pad, y); y += 40 + 12;
  x.font = fS; x.fillStyle = '#f2ece8'; sl.forEach((l) => { x.fillText(l, pad, y); y += 36; });
  y += 14; x.font = fH; x.fillStyle = info.color; x.fillText('▶ 관문을 누르거나, 파티 패널에서 이 테마를 고르고 [바로 시작]', pad, y);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, toneMapped: false, fog: false }));
  const k = 0.0046; sp.scale.set(W * k, H * k, 1); sp.renderOrder = 11; return sp;
}
function updateThemeBubble() {
  const themes = S.room === 'lobby' && S.world?.themes;
  let near = null;
  if (themes) { let best = 5.2; for (const th of themes) { const d = Math.hypot(me.x - th.x, me.z - th.z); if (d < best) { best = d; near = th; } } }
  if ((near?.id || null) === (S.themeNear?.id || null)) return;
  if (S.themeBubble) { removeLabel(S.themeBubble); S.themeBubble = null; }
  if (S.themeAnchor) { S.themeAnchor.parent?.remove(S.themeAnchor); S.themeAnchor = null; }
  S.themeNear = near;
  if (!near) return;
  const info = THEME_INFO[near.id] && { ...THEME_INFO[near.id], diff: diffOf(near.id) }; if (!info) return;
  // 관문 앞쪽(광장 쪽)으로 살짝 당겨서 띄운다
  const dx = -near.x, dz = 6 - near.z, dl = Math.hypot(dx, dz) || 1;
  const anchor = new THREE.Object3D(); anchor.position.set(near.x + (dx / dl) * 1.6, 0, near.z + (dz / dl) * 1.6); S.world.root.add(anchor); S.themeAnchor = anchor;
  S.themeBubble = themeBubbleSprite(info);
  addLabel(anchor, S.themeBubble, 1.9 + S.themeBubble.scale.y / 2);
  // 파티장이라면 스토리 선택도 이 테마로 맞춰 준다
  const sel = $('#scenarioSel');
  if (sel && !sel.disabled && [...sel.options].some((o) => o.value === near.id) && sel.value !== near.id) { sel.value = near.id; sel.onchange?.(); }
}

// 랜덤 공포 이벤트
let horrorT = 30;
function randomHorror(dt) {
  if (S.room !== 'game' || S.modalOpen || S.storyOpen || S.fear === 0) return; // 왕초보: 깜짝 이벤트 없음
  horrorT -= dt; if (horrorT > 0) return;
  horrorT = S.fear === 1 ? 120 + Math.random() * 120 : S.fear === 2 ? 70 + Math.random() * 70 : 55 + Math.random() * 60;
  let r = Math.random();
  if (S.fear === 1 && r >= 0.3 && r < 0.82) r = 0.9; // 순한맛: 귀신 등장 없이 소리만
  if (S.fear === 2 && r >= 0.72 && r < 0.8) r = 0.9; // 보통: 갑툭튀 없음
  if (r < 0.3 && S.world.ceiling.length && !S.dark) { S.world.ceiling.forEach((c) => (c.light.intensity = 0)); setTimeout(() => applyDark(), 1200 + Math.random() * 1500); }
  else if (r < 0.55) { const g = createGhost('woman'); g.position.set(me.x - Math.sin(me.ry) * 3.5, 0, me.z - Math.cos(me.ry) * 3.5); g.lookAt(me.x, 0, me.z); scene.add(g); audio.play('breath'); setTimeout(() => { scene.remove(g); disposeTree(g); }, 900); }
  else if (r < 0.72) {
    // 아이 귀신이 옆을 스쳐 달려간다
    const c = createGhost('child'); const side = Math.random() < 0.5 ? -1 : 1;
    const ax = Math.cos(me.ry) * side, az = -Math.sin(me.ry) * side;
    c.position.set(me.x + ax * 5 + Math.sin(me.ry) * 3, 0, me.z + az * 5 + Math.cos(me.ry) * 3); scene.add(c); audio.play('giggle');
    const start = performance.now();
    const run = () => { const k = (performance.now() - start) / 900; c.position.x -= ax * 0.18; c.position.z -= az * 0.18; c.rotation.y = Math.atan2(-ax, -az); if (k < 1) requestAnimationFrame(run); else { scene.remove(c); disposeTree(c); } };
    run();
  } else if (r < 0.8) scare(Math.random() < 0.5 ? 'flash' : 'random', 'random');
  else audio.play('whisper');
}

// ─────────────────────────── 서버 이벤트: 게임
let gameStartSequence = 0;
socket.on('enter:lobby', (pos) => {
  ++gameStartSequence;
  $('#timeLimitIntro').classList.add('hidden');
  if (cinema.active) cinema.skip();
  closeModal(); $('#ending').classList.add('hidden'); enterLobby(pos);
});
socket.on('inv', (inv) => { const before = S.inv.length; S.inv = inv; if (!inv.includes('flashlight')) S.light = false; renderInv(); if (inv.length > before) audio.play('pickup'); });
// 욕설 채팅 경고 · 채팅 금지
socket.on('chat:blocked', (b) => { addChat({ channel: 'system', text: b.text }); toast(b.text); if (b.muted) { S.chatMutedUntil = Date.now() + b.left * 1000; } });
function showTimeLimit(ms, ranked, sequence) {
  const screen = document.getElementById('timeLimitIntro');
  screen.querySelector('strong').textContent = `${Math.round(ms / 60000)}분`;
  screen.querySelector('.limit-message').textContent = ranked
    ? '제한 시간 내에 클리어하면 랭킹에 반영됩니다'
    : '이어하기는 랭킹에 반영되지 않습니다';
  screen.classList.remove('hidden');
  return new Promise(resolve => setTimeout(() => {
    if (sequence === gameStartSequence) screen.classList.add('hidden');
    resolve();
  }, 3000));
}
socket.on('game:start', async (st) => {
  const sequence = ++gameStartSequence;
  setThemeComms(true);
  audio.classicEffects = true;
  if (cinema.active) cinema.skip(); // 미리보기 영상을 보던 중이면 끝내고 게임으로
  closePhotoPop();
  closeThemePop();
  closeModal(); S.fear = st.fear ?? 2;
  S.scenario = st.scenario || null; updateFearBadge();
  if (st.chapterIdx === 0 && (st.elapsed ?? 0) < 8000 && S.scenario?.id) resetJournalFor(S.scenario.id); // 처음부터 새로 시작
  if (st.showTimeLimit && st.limitMs) { resetInput(); await showTimeLimit(st.limitMs, st.timed, sequence); }
  if (sequence !== gameStartSequence) return;
  if (st.chapterIdx === 0 && !S.skipPrologue) { resetInput(); await cinema.play(st.scenario?.cine?.intro || 'prologue', { looks: partyLooks(), audio, fear: S.fear }); }
  if (sequence === gameStartSequence) enterChapter(st, true);
});
// 챕터 이동: 같은 소식이 겹쳐 와도 마지막 것 하나만 반영한다 (이야기 창이 두 번 뜨지 않게)
let chapSeq = 0;
socket.on('game:chapter', (st) => { closeModal(); S.storyQueue = []; closeStory(true); const my = ++chapSeq; fadeTransition(() => { if (my !== chapSeq) return; S.storyQueue = []; closeStory(true); enterChapter(st, true); }); });
socket.on('game:sync', (st) => {
  setHintsUsed(st.hintsUsed, st.talismansUsed, st.assistXpPercent); if (st.elapsed != null && S.clock && !S.clock.stop) setGameClock(st.elapsed);
  if (st.fear != null && st.fear !== S.fear) { S.fear = st.fear; updateFearBadge(); }
  S.objState = st.objects; applyObjState();
  if (S.dark !== st.dark) { S.dark = st.dark; applyDark(); if (st.dark) audio.play('power'); }
  setObjective(st.objective, st.relics);
});
socket.on('ui:examine', ({ title, text, doc }) => { openDoc(title, text, { prop: doc }); addJournal(title, text, 'clue'); });
socket.on('ui:lock', (l) => { openLock(l); addJournal(l.title, l.text, 'clue'); });
socket.on('ui:signal', (sg) => { openSignal(sg); addJournal(sg.title, sg.text + (sg.morse ? '\n신호: ' + sg.morse.replace(/\./g, '·').replace(/-/g, '−') : '') + (sg.letters ? '\n글자: ' + sg.letters.split('').join(' ') : ''), 'clue'); });
function openSignal(sg) {
  const wrap = el('div', 'signal-box');
  const lamp = el('div', 'signal-lamp'); const out = el('div', 'signal-out');
  wrap.append(lamp, out);
  const again = el('button', 'btn small', '▶ 다시 보기'); wrap.appendChild(again);
  openModal(sg.title, sg.text, wrap);
  let stop = false; const myModal = $('#modalBody').firstChild;
  const alive = () => !stop && S.modalOpen && $('#modalBody').firstChild === myModal;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const play = async () => {
    stop = false; out.textContent = '';
    if (sg.morse) {
      for (let rep = 0; rep < 2 && alive(); rep++) {
        for (const ch of sg.morse) {
          if (!alive()) return;
          if (ch === ' ') { out.textContent += '   '; await wait(700); continue; }
          const long = ch === '-';
          lamp.classList.add('on'); audio.play(long ? 'morse_long' : 'morse_short'); out.textContent += long ? '−' : '·';
          await wait(long ? 520 : 180); lamp.classList.remove('on'); await wait(220);
        }
        out.textContent += '        '; await wait(1400);
      }
    } else if (sg.letters) {
      lamp.classList.add('ouija');
      for (let rep = 0; rep < 2 && alive(); rep++) {
        out.textContent = '';
        for (const ch of sg.letters) { if (!alive()) return; lamp.textContent = ch; audio.play('porcelain'); /* 글자가 켜질 때 작은 '딩' (문 삐걱 소리는 껐다) */ out.textContent += ch + ' '; await wait(1100); }
        lamp.textContent = '…'; await wait(1500);
      }
    }
  };
  again.onclick = () => { stop = true; setTimeout(play, 300); };
  play();
}
socket.on('lock:result', ({ ok }) => {
  const d = $('.lock-display');
  if (ok) { if (!audio.xmasMechanical) audio.play('unlock'); if (d) d.classList.add('ok'); setTimeout(closeModal, 500); }
  else { audio.play('wrong'); if (d) { d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); } if (S.lockCtx?.reset) setTimeout(S.lockCtx.reset, 400); if (S.lockCtx && ['buttons', 'digits', 'text'].includes(S.lockCtx.input)) { S.lockCtx.val = S.lockCtx.input === 'buttons' ? [] : ''; setTimeout(renderLockVal, 400); } }
});
socket.on('game:story', (s) => { queueStory(s); addJournal(s.title, s.text, 'story'); });
socket.on('game:scare', ({ type, src }) => { if (S.fear !== 0) scare(type, src || 'story'); });
const SCARY_SOUNDS = new Set(['scream', 'scream_child', 'scream_wet', 'growl', 'sting', 'bang', 'glass', 'glitch']);
socket.on('game:sound', (n) => audio.play(S.fear === 0 && SCARY_SOUNDS.has(n) ? 'whisper' : n));
socket.on('game:hint', ({ text, level, total, by }) => { addChat({ channel: 'system', text: `💡 힌트 ${level}/${total} (${by}): ${text}` }); openModal(`💡 힌트 ${level}/${total}`, text); addJournal(`힌트 ${level}/${total}`, text, 'hint'); });
socket.on('game:ghostTp', ({ name }) => { audio.play('teleport'); S.shake = 0.4; toast(`등 뒤에서 숨소리가 들린다… (${name})`); });
socket.on('game:caught', ({ x, z, by, type }) => {
  me.x = x; me.z = z; S.moveTarget = null;
  closeModal();
  scare(type === 'child' ? 'child' : Math.random() < 0.5 ? 'face' : 'hands', 'caught');
  const f = $('#caughtFx'); f.classList.remove('hidden'); f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
  setTimeout(() => f.classList.add('hidden'), 2000);
  toast(`${by}에게 붙잡혔다… 처음 위치로 끌려왔다.`);
});
socket.on('game:coopPulse', () => audio.play('clock_tick')); // 협동 장치 신호 (문 삐걱 소리는 껐다)
socket.on('game:ending', (e) => {
  if (S.clock) S.clock.stop = e.ms ?? (performance.now() - S.clock.base);
  const clear = rememberClear(e);
  closeModal(); S.storyQueue = []; closeStory(true);
  addJournal(e.title, e.text, 'story');
  setTimeout(async () => {
    resetInput(); await cinema.play(e.cine || (e.type === 'true' ? 'ending_true' : 'ending_normal'), { looks: partyLooks(), audio, fear: S.fear });
    $('#endTitle').textContent = e.title; $('#endText').textContent = e.text;
    const icons = e.icons || ['👟', '🃏', '🎀', '🌀', '🔮', '➰', '🏷️'];
    $('#endRelics').textContent = icons.map((ic, i) => (i < e.relics ? ic : '·')).join(' ') + `   (${e.relics}/${e.total || 7})`;
    let tm = $('#endTime'); if (!tm) { tm = el('div', 'end-time'); tm.id = 'endTime'; $('#endRelics').after(tm); }
    tm.textContent = e.ms ? `⏱ 클리어 시간 ${fmtMs(e.ms)} · 💡 힌트 ${e.hints ?? 0}개${e.over ? ' — ⏰ 제한 시간을 넘겨 순위표·경험치에서 빠졌어요 (코인은 받아요)' : e.full ? ' — 🏆 랭킹에 기록되었습니다' : ' (이어하기는 랭킹에 기록되지 않아요)'}` : '';
    showEndExtras();
    if (clear?.photoId && !clear.queued) publishClearPhoto(clear).catch((err) => console.warn('클리어 사진 생성 실패:', err));
    $('#ending').classList.remove('hidden');
    audio.ambient(null); audio.play(e.type === 'true' || S.fear === 0 || audio.xmasMechanical ? 'bell' : 'scream'); // 크리스마스편 엔딩은 따뜻한 종소리로
  }, 1200);
});
$('#endBtn').onclick = () => { $('#ending').classList.add('hidden'); socket.emit('party:quit'); };
socket.on('clears', (ub) => { S.unlockedBy = ub || {}; myTag(); if (!$('#ending').classList.contains('hidden')) showEndExtras(); });

// ─────────────────────────── 클리어 기념 사진 · 클리어 도장표
const THEME_ICON = { christmas: '🎄', mia: '🔰', gwimun: '👻', ophelia: '⚓', doll: '🎎', hospital: '🏥', camp: '🏕️', west: '🤠', kimono: '🏮', clown: '🎪', park: '🎡', zombie: '🧟' };
const themeColor = (id) => THEME_INFO[id]?.color || '#ff3a2a';
/** 도장표에 찍을 테마 목록 (히든 테마는 따로). nowId: 방금 깬 테마 */
function stampList(nowId) {
  const ub = S.unlockedBy || {};
  const card = x => ({ id: x.id, icon: THEME_ICON[x.id] || '★', short: x.short, cleared: !!ub[x.id]?.cleared || x.id === nowId, at: ub[x.id]?.at || 0, now: x.id === nowId });
  const list = (S.scenarios || []).filter(x => !x.hidden && !x.special).map(card);
  const special = (S.scenarios || []).filter(x => x.special).map(card);
  const h = (S.scenarios || []).find((x) => x.hidden);
  const hidden = h ? { id: h.id, icon: THEME_ICON[h.id] || '🧟', short: h.short, cleared: !!ub[h.id]?.cleared || h.id === nowId, at: ub[h.id]?.at || 0 } : null;
  return { list, hidden, special };
}
function rememberClear(e) {
  const sc = S.scenario; if (!sc) return;
  const roster = e.members || (S.party?.members || []).flatMap(m => {
    const lk = S.looks.get(m.id)?.look;
    return lk ? [{ id: m.id, name: m.name, look: lk, gear: S.net.get(m.id)?.gear || '' }] : [];
  });
  const self = e.members?.find(m => m.id === S.me) || { name: S.myName, look: { ...look }, gear: myGear() };
  const members = [self, ...roster.filter(m => m.id !== S.me)];
  const frame = FRAMES[Math.floor(Math.random() * FRAMES.length)].id;
  const clear = { photoId: e.photoId, frame, id: sc.id, title: sc.short || sc.title, icon: THEME_ICON[sc.id] || '', ending: e.type, timeText: e.ms && e.full ? fmtMs(e.ms) : '', hints: e.ms && e.full ? e.hints ?? 0 : null, members, ghostTypes: sc.ghostTypes || [], tint: themeColor(sc.id), date: new Date(), photo: null };
  S.lastClear = clear;
  if (clear.photoId) publishClearPhoto(clear).catch((err) => console.warn('클리어 사진 생성 실패:', err));
  return clear;
}

function clearPhotoInfo(clear) {
  const { list, hidden } = stampList(clear.id);
  return {
    icon: clear.icon, title: clear.title, ending: clear.ending, timeText: clear.timeText,
    hints: clear.hints, names: clear.members.map((m) => m.name), date: clear.date, tint: clear.tint,
    site: location.host.includes('localhost') || /^[\d.:]+$/.test(location.host) ? 'mia-escape.kr' : location.host,
    stamps: list, hidden,
  };
}
function prepareClearPhoto(clear) {
  if (clear.photo) return Promise.resolve(clear.photo);
  if (!clear.photoTask) {
    clear.photoTask = Promise.all([
      loadPhotoFonts(),
      shootPhoto({ members: clear.members, ghostTypes: clear.ghostTypes, themeId: clear.id, tint: clear.tint }),
    ]).then(([, photo]) => (clear.photo = photo)).finally(() => { clear.photoTask = null; });
  }
  return clear.photoTask;
}

const clearPhotoQueueKey = 'mia-clear-photo-uploads';
const clearPhotoQueue = new Map(store.get(clearPhotoQueueKey, []).map((photo) => [photo.id, photo]));
let uploadingClearPhotos = false;
async function flushClearPhotos() {
  if (uploadingClearPhotos || !socket.connected || !S.me || !clearPhotoQueue.size) return;
  uploadingClearPhotos = true;
  try {
    for (const [id, photo] of clearPhotoQueue) {
      if (!socket.connected) break;
      const response = await socket.timeout(5000).emitWithAck('clear-photo:post', photo);
      if (!response?.ok && !response?.rejected) break;
      clearPhotoQueue.delete(id);
      store.set(clearPhotoQueueKey, [...clearPhotoQueue.values()]);
    }
  } catch {
    // 연결이 돌아오면 같은 사진 ID로 다시 보낸다.
  } finally {
    uploadingClearPhotos = false;
  }
}
setInterval(flushClearPhotos, 5000);

async function publishClearPhoto(clear) {
  if (clear.queued && clearPhotoQueue.has(clear.photoId)) { flushClearPhotos(); return; }
  if (clear.queued) return;
  const photo = await prepareClearPhoto(clear);
  if (clear.queued) return;
  const print = composePhoto(photo, clearPhotoInfo(clear), clear.frame);
  const tile = document.createElement('canvas');
  tile.width = 288; tile.height = 360;
  tile.getContext('2d').drawImage(print, 0, 0, tile.width, tile.height);
  let img = tile.toDataURL('image/jpeg', 0.78);
  if (img.length > 90000) img = tile.toDataURL('image/jpeg', 0.52);
  clear.queued = true;
  clearPhotoQueue.set(clear.photoId, { id: clear.photoId, img });
  store.set(clearPhotoQueueKey, [...clearPhotoQueue.values()]);
  flushClearPhotos();
}
// 엔딩 창 아래: 도장이 찍힌 도장표 + 기념 사진 버튼
function showEndExtras() {
  let box = $('#endExtras'); if (!box) { box = el('div'); box.id = 'endExtras'; $('#endBtn').before(box); }
  box.innerHTML = '';
  const lc = S.lastClear; const { list, hidden } = stampList(lc?.id);
  const cv = el('canvas', 'end-stamps'); cv.width = 720; cv.height = 420;
  const h = drawStampCard(cv.getContext('2d'), 12, 10, 696, { stamps: list, hidden }); cv.height = Math.ceil(h + 34);
  drawStampCard(cv.getContext('2d'), 12, 10, 696, { stamps: list, hidden });
  const done = list.filter((x) => x.cleared).length;
  const msg = el('div', 'end-stamp-msg', hidden?.cleared ? '🧟 히든 테마까지 모두 클리어! 전설의 탈출가예요.' : done >= list.length ? '🎉 모든 테마 클리어! 히든 테마 「데드 시티」가 열렸어요.' : `🎫 도장 ${done}개 — ${list.length - done}개만 더 모으면 히든 테마가 열려요!`);
  const pb = el('button', 'btn primary end-photo', '📸 클리어 기념 사진 받기'); pb.onclick = () => openClearPhoto();
  box.append(cv, msg, pb);
}
const photoPop = el('div', 'ppop hidden'); photoPop.id = 'photoPop'; document.body.appendChild(photoPop);
function closePhotoPop() { if (photoPop.classList.contains('hidden')) return; photoPop.classList.add('hidden'); photoPop.innerHTML = ''; }
photoPop.addEventListener('pointerdown', (e) => { if (e.target === photoPop) closePhotoPop(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !photoPop.classList.contains('hidden')) { e.stopPropagation(); closePhotoPop(); } }, true);
/** 인화 사진 창: 왼쪽 위 테두리 고르기 · 오른쪽 위 닫기 · 아래 저장 / 공유 */
async function openClearPhoto() {
  const lc = S.lastClear; if (!lc) { toast('방탈출을 클리어하면 기념 사진을 받을 수 있어요!'); return; }
  audio.play('click');
  photoPop.innerHTML = ''; photoPop.classList.remove('hidden');
  const card = el('div', 'ppop-card');
  const frameBtn = el('button', 'ppop-frame', '🖼️ 테두리'); frameBtn.title = '사진 테두리 바꾸기';
  const closeBtn = el('button', 'ppop-x', '✕'); closeBtn.title = '닫기'; closeBtn.onclick = closePhotoPop;
  const chooser = el('div', 'ppop-frames hidden');
  const stage = el('div', 'ppop-stage'); const img = el('img', 'ppop-img'); img.alt = '클리어 기념 사진'; img.draggable = false;
  const wait = el('div', 'ppop-wait', '📸 찰칵! 사진을 인화하는 중…'); stage.append(img, wait);
  const btns = el('div', 'ppop-btns');
  const save = el('button', 'btn primary', '💾 저장'), share = el('button', 'btn primary', '📤 공유');
  btns.append(save, share);
  const tip = el('div', 'ppop-tip', document.body.classList.contains('mobile') ? '사진을 길게 눌러도 저장할 수 있어요' : '테두리를 바꾼 뒤 저장하거나 친구에게 공유해 보세요');
  card.append(frameBtn, closeBtn, chooser, stage, btns, tip); photoPop.appendChild(card);
  save.disabled = share.disabled = true;
  let frame = lc.frame || 'polaroid';
  let final = null;
  const info = () => clearPhotoInfo(lc);
  const paint = () => {
    if (!lc.photo) return;
    final = composePhoto(lc.photo, info(), frame);
    img.src = final.toDataURL('image/jpeg', 0.92); wait.classList.add('hidden'); save.disabled = share.disabled = false;
    chooser.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === frame));
    frameBtn.textContent = `🖼️ 테두리: ${FRAMES.find((f) => f.id === frame)?.name || ''}`;
  };
  FRAMES.forEach((f) => { const b = el('button', 'btn small', `${f.icon} ${f.name}`); b.dataset.id = f.id; b.onclick = () => { frame = f.id; audio.play('click'); paint(); }; chooser.appendChild(b); });
  frameBtn.onclick = () => chooser.classList.toggle('hidden');
  const fileName = () => `mia-clear-${lc.id}-${lc.date.getFullYear()}${String(lc.date.getMonth() + 1).padStart(2, '0')}${String(lc.date.getDate()).padStart(2, '0')}.jpg`;
  const toBlob = () => new Promise((res) => final.toBlob(res, 'image/jpeg', 0.92));
  save.onclick = async () => {
    if (!final) return;
    const blob = await toBlob(); if (!blob) return toast('사진을 만들지 못했어요. 다시 시도해 주세요.');
    const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast(document.body.classList.contains('mobile') ? '💾 사진을 저장했어요! (안 되면 사진을 길게 눌러 저장하세요)' : '💾 사진을 저장했어요! (다운로드 폴더)');
  };
  share.onclick = async () => {
    if (!final) return;
    const site = 'https://' + info().site;
    const text = `${lc.members.map((m) => m.name).join(', ')} — 공포 방탈출 '${lc.title}' 클리어!${lc.timeText ? ` (${lc.timeText})` : ''} 👻\n같이 하자 👉 ${site}`;
    try {
      const blob = await toBlob(); const file = blob && new File([blob], fileName(), { type: 'image/jpeg' });
      if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: '미아 — 방탈출 클리어!', text }); return; }
      if (navigator.share) { await navigator.share({ title: '미아 — 방탈출 클리어!', text, url: site }); toast('사진은 💾 저장을 눌러 함께 보내 주세요!'); return; }
    } catch (err) { if (err?.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('📋 자랑 글과 게임 주소를 복사했어요! 사진은 💾 저장으로 받아 함께 올려 주세요.'); } catch { toast('이 브라우저에서는 바로 공유할 수 없어요. 💾 저장을 눌러 사진을 받아 주세요.'); }
  };
  try {
    await prepareClearPhoto(lc);
    if (lc.photoId && !lc.queued) publishClearPhoto(lc).catch((err) => console.warn('클리어 사진 생성 실패:', err));
    if (!card.isConnected) return;
    paint(); audio.play('pickup');
  } catch (err) { console.error(err); wait.textContent = '사진을 만들지 못했어요. 😢 닫고 다시 눌러 주세요.'; }
}
/** 클리어 도장표 (설정 · 내 물건에서 언제든 볼 수 있다) */
function openStamps() {
  const { list, hidden, special } = stampList(null);
  const w = el('div', 'stamps');
  const done = list.filter((x) => x.cleared).length;
  w.appendChild(el('div', 'stamps-head', hidden?.cleared ? `🧟 히든 테마까지 모두 클리어! (${done}/${list.length} + 히든)` : done >= list.length ? `🎉 ${done}/${list.length} — 모든 테마 클리어! 히든 테마가 열렸어요.` : `도장 ${done} / ${list.length} — ${list.length - done}개 더 모으면 히든 테마 「데드 시티」가 열려요!`));
  const grid = el('div', 'stamps-grid');
  const fmtDay = (t) => { const d = new Date(t); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
  for (const x of [...list, ...special, ...(hidden && (hidden.cleared || S.hiddenOk || S.admin) ? [{ ...hidden, hid: true }] : [])]) {
    const c = el('div', 'stamp' + (x.cleared ? ' on' : '') + (x.hid ? ' hid' : ''));
    c.append(el('div', 'stamp-ring', x.icon), el('div', 'stamp-name', x.short), el('div', 'stamp-date', x.cleared ? (x.at ? fmtDay(x.at) : 'CLEAR') : '아직'));
    grid.appendChild(c);
  }
  w.appendChild(grid);
  w.appendChild(el('div', 'muted', '테마를 끝까지 클리어하면 도장이 찍혀요. 클리어할 때마다 귀신들과 함께 찍은 기념 사진도 받을 수 있어요!'));
  if (S.lastClear) { const b = el('button', 'btn primary', '📸 방금 받은 기념 사진 다시 보기'); b.onclick = () => { closeModal(); openClearPhoto(); }; w.appendChild(b); }
  openModal('🎫 클리어 도장표', '', w);
}
// 히든 테마 「데드 시티」 미리보기 영상 (설정 → 미리보기)
async function playHiddenPreview() {
  if (S.room !== 'lobby') { toast('미리보기 영상은 로비(미아 광장)에서 볼 수 있어요.'); return; }
  if (cinema.active) return;
  resetInput(); S.mobileClose?.(); audio.init();
  await cinema.play('zombie_preview', { looks: partyLooks(), audio, fear: 1 });
  if (S.room === 'lobby') { audio.ambient('lobby'); toast(S.hiddenOk || S.admin ? '🧟 히든 테마 「데드 시티」가 열려 있어요! 광장 북쪽 관문에서 시작해 보세요.' : '🔒 모든 테마를 한 번씩 클리어하거나 Lv.20이 되면 「데드 시티」가 열려요.'); }
}
$('#hintBtn').onclick = () => socket.emit('game:hint');
$('#journalBtn').onclick = openJournal;

function fadeTransition(fn) {
  const v = $('#caughtFx'); v.style.background = '#000'; v.classList.remove('hidden'); v.style.animation = 'none'; v.style.opacity = 1; audio.play('door');
  setTimeout(() => { fn(); v.style.transition = 'opacity 1.2s'; v.style.opacity = 0; setTimeout(() => { v.classList.add('hidden'); v.style.transition = ''; v.style.background = ''; v.style.animation = ''; v.style.opacity = ''; }, 1300); }, 700);
}

// ─────────────────────────── 모달
// 편지·쪽지·포스터 같은 글은 실제 종이처럼 그려서 보여 준다 (글 내용은 그대로)
function openDoc(title, text, hint) {
  let paper = null; try { paper = renderDoc(title, text, hint, S.scenario?.id || 'gwimun'); } catch (e) { console.warn('문서 그리기 실패', e); }
  if (!paper) return openModal(title, text);
  openModal(title, '', paper); $('#modal .modal-card').classList.add('doc-mode');
}
{ const mx = el('button', 'modal-x', '✕'); mx.title = '닫기'; mx.onclick = () => closeModal(); $('#modal .modal-card').prepend(mx); } // 상점 창 오른쪽 위 닫기
function footBtn(label, fn) { const b = el('button', 'btn primary foot-extra', label); b.onclick = fn; $('#modal .modal-foot').prepend(b); return b; }
function openModal(title, text, bodyEl) {
  resetInput();
  S.modalOpen = true; S.lockCtx = null; hideMenus();
  $('#modal .modal-card').classList.remove('doc-mode', 'shop-mode'); document.querySelectorAll('#modal .foot-extra').forEach((b) => b.remove());
  $('#modalTitle').textContent = title || '';
  $('#modalText').textContent = text || '';
  const b = $('#modalBody'); b.innerHTML = ''; if (bodyEl) b.appendChild(bodyEl);
  $('#modal').classList.remove('hidden');
}
// 브라우저 confirm()은 모바일 인앱 브라우저(카카오톡 등)에서 막히므로 게임 안 확인창을 쓴다
function askConfirm(title, text, okLabel, onOk) {
  const row = el('div', 'row confirm-row');
  const ok = el('button', 'btn primary', okLabel || '확인');
  const no = el('button', 'btn', '취소');
  ok.onclick = () => { closeModal(); onOk(); };
  no.onclick = closeModal;
  row.append(no, ok);
  openModal(title, text, row);
}
function closeModal() { S.modalOpen = false; S.lockCtx = null; $('#modal').classList.add('hidden'); }
$('#modalClose').onclick = closeModal;
$('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') closeModal(); });
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function openLock(l) {
  const wrap = el('div');
  const disp = el('div', 'lock-display'); wrap.appendChild(disp);
  const ctx = { ...l, val: l.input === 'buttons' ? [] : '' };
  if (l.input === 'dial') return openDial(l);
  if (l.input === 'grid') return openGrid(l);
  if (l.input === 'clock') return openClock(l);
  if (l.input === 'tune') return openTune(l);
  if (l.input === 'xmas_mirror') {
    const panel = xmasMirrorPanel(l.optics, {
      click: () => audio.play('click'),
      submit: (answer) => socket.emit('game:lock', { id: l.id, answer }),
    });
    return openModal(l.title, l.text, panel);
  }
  if (l.input === 'wires') return openWires(l);
  if (l.input === 'simon') return openSimon(l);
  if (l.input === 'slide') return openSlide(l);
  if (l.input === 'rotate') return openRotate(l);
  if (l.input === 'stars') return openStars(l);
  if (l.input === 'cups') return openCups(l);
  if (l.input === 'balance') return openBalance(l);
  const submit = () => socket.emit('game:lock', { id: l.id, answer: ctx.val });
  if (l.input === 'digits') {
    const pad = el('div', 'keypad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '확인'].forEach((k) => {
      const b = el('button', 'btn' + (k === '확인' ? ' primary' : ''), k);
      b.onclick = () => { audio.play('click'); if (k === '←') ctx.val = ctx.val.slice(0, -1); else if (k === '확인') return submit(); else if (ctx.val.length < (l.len || 6)) ctx.val += k; renderLockVal(); if (ctx.val.length === l.len) setTimeout(submit, 150); };
      pad.appendChild(b);
    });
    wrap.appendChild(pad);
  } else if (l.input === 'text') {
    const inp = el('input', 'text-in'); inp.placeholder = '정답 입력 후 Enter'; inp.maxLength = 20;
    inp.oninput = () => { ctx.val = inp.value; renderLockVal(); };
    inp.onkeydown = (e) => { if (e.key === 'Enter') submit(); e.stopPropagation(); };
    const row = el('div', 'row'); const ok = el('button', 'btn primary', '확인'); ok.onclick = submit; row.appendChild(ok);
    wrap.append(inp, row);
    setTimeout(() => inp.focus(), 50);
  } else {
    const pad = el('div', 'bpad');
    l.buttons.forEach((k, i) => {
      const b = el('button', 'btn', `${k}`); b.title = `단축키 ${i + 1}`;
      b.onclick = () => pressBtn(k);
      pad.appendChild(b);
    });
    const row = el('div', 'row');
    const back = el('button', 'btn', '← 지우기'); back.onclick = () => { ctx.val.pop(); renderLockVal(); };
    const reset = el('button', 'btn', '처음부터'); reset.onclick = () => { ctx.val = []; renderLockVal(); };
    row.append(back, reset);
    wrap.append(pad, row, el('div', 'muted', '숫자키 1~9 로도 누를 수 있어요'));
  }
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx;
  renderLockVal();
}
function openDial(l) {
  const wrap = el('div');
  const row = el('div', 'dial-row');
  const idx = l.wheels.map(() => 0);
  const ctx = { ...l, val: idx.map((i, w) => l.wheels[w][i]) };
  l.wheels.forEach((opts, w) => {
    const col = el('div', 'dial');
    const up = el('button', 'btn small', '▲'), down = el('button', 'btn small', '▼'), face = el('div', 'dial-face', opts[0]);
    const turn = (d) => { idx[w] = (idx[w] + d + opts.length) % opts.length; face.textContent = opts[idx[w]]; ctx.val[w] = opts[idx[w]]; audio.play('click'); };
    up.onclick = () => turn(-1); down.onclick = () => turn(1); face.onclick = () => turn(1);
    col.append(up, face, down); row.appendChild(col);
  });
  const ok = el('button', 'btn primary', '열어 보기'); ok.onclick = () => socket.emit('game:lock', { id: l.id, answer: ctx.val });
  wrap.append(el('div', 'lock-display small', '다이얼을 돌려 맞추자'), row, ok);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx;
}
function openGrid(l) {
  const n = l.size || 3; const cells = Array(n * n).fill(0);
  const ctx = { ...l, val: cells.join('') };
  const wrap = el('div'); const grid = el('div', 'lgrid'); grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  const btns = cells.map((_, i) => { const b = el('button', 'lcell'); b.onclick = () => press(i); grid.appendChild(b); return b; });
  const paint = () => { btns.forEach((b, i) => b.classList.toggle('on', !!cells[i])); ctx.val = cells.join(''); };
  const flip = (i) => { cells[i] = cells[i] ? 0 : 1; };
  const press = (i) => {
    audio.play('click');
    flip(i);
    if (l.lightsOut) { const r = Math.floor(i / n), c = i % n; if (r > 0) flip(i - n); if (r < n - 1) flip(i + n); if (c > 0) flip(i - 1); if (c < n - 1) flip(i + 1); }
    paint();
  };
  const reset = el('button', 'btn', '모두 끄기'); reset.onclick = () => { cells.fill(0); paint(); };
  const ok = el('button', 'btn primary', '확인'); ok.onclick = () => socket.emit('game:lock', { id: l.id, answer: ctx.val });
  const row = el('div', 'row'); row.append(reset, ok);
  wrap.append(el('div', 'lock-display small', l.lightsOut ? '한 칸을 누르면 이웃 칸도 뒤집힌다' : '칸을 눌러 켜고 끄자'), grid, row);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; paint();
}
function openTune(l) {
  const ctx = { ...l, val: l.min };
  const wrap = el('div');
  const disp = el('div', 'lock-display'); const meter = el('div', 'tune-meter'); const bar = el('div', 'tune-bar'); meter.appendChild(bar);
  const knob = el('input'); knob.type = 'range'; knob.min = l.min; knob.max = l.max; knob.step = l.step || 0.1; knob.value = l.min; knob.className = 'tune-knob';
  const fine = el('div', 'row');
  let noise = null;
  const paint = () => {
    ctx.val = Number(knob.value); disp.textContent = `${ctx.val.toFixed(1)} ${l.unit || ''}`;
    // 정답을 모르는 클라이언트: 잡음 세기는 무작위로 일렁이게만 보여 준다 (판정은 서버)
    bar.style.width = 20 + Math.random() * 60 + '%';
    audio.play('tune_static');
  };
  knob.oninput = paint;
  [['◀◀ −10', -10], ['◀ −1', -1], ['−0.1', -0.1], ['+0.1', 0.1], ['+1 ▶', 1], ['+10 ▶▶', 10]].forEach(([t, d]) => { const b = el('button', 'btn small', t); b.onclick = () => { knob.value = Math.min(l.max, Math.max(l.min, Number(knob.value) + d)).toFixed(1); paint(); }; fine.appendChild(b); });
  const ok = el('button', 'btn primary', '이 주파수로 맞추기'); ok.onclick = () => socket.emit('game:lock', { id: l.id, answer: ctx.val });
  wrap.append(disp, meter, knob, fine, ok);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; paint();
}
function openWires(l) {
  const ctx = { ...l, val: l.left.map(() => null) };
  const wrap = el('div'); const board = el('div', 'wire-board');
  const lc = el('div', 'wire-col'), rc = el('div', 'wire-col');
  let pick = null;
  const lbtn = l.left.map((name, i) => { const b = el('button', 'wire-l', name); b.style.borderColor = l.colors?.[i] || '#888'; b.style.color = l.colors?.[i] || '#fff'; b.onclick = () => { pick = i; lbtn.forEach((x, j) => x.classList.toggle('sel', j === i)); audio.play('click'); }; lc.appendChild(b); return b; });
  const rbtn = l.right.map((name) => { const b = el('button', 'wire-r', name); b.onclick = () => { if (pick == null) return toast('왼쪽 전선을 먼저 고르세요'); ctx.val = ctx.val.map((v) => (v === name ? null : v)); ctx.val[pick] = name; pick = null; lbtn.forEach((x) => x.classList.remove('sel')); audio.play('unlock'); paint(); }; rc.appendChild(b); return b; });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('wire-svg');
  board.append(lc, svg, rc);
  const paint = () => {
    svg.innerHTML = '';
    const br = board.getBoundingClientRect();
    ctx.val.forEach((v, i) => {
      lbtn[i].textContent = l.left[i] + (v ? ' ✓' : '');
      if (!v) return;
      const a = lbtn[i].getBoundingClientRect(), b = rbtn[l.right.indexOf(v)].getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const x1 = a.right - br.left, y1 = a.top + a.height / 2 - br.top, x2 = b.left - br.left, y2 = b.top + b.height / 2 - br.top;
      line.setAttribute('d', `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`);
      line.setAttribute('stroke', l.colors?.[i] || '#fff'); line.setAttribute('stroke-width', '6'); line.setAttribute('fill', 'none'); line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    });
  };
  const reset = el('button', 'btn', '전부 뽑기'); reset.onclick = () => { ctx.val = l.left.map(() => null); paint(); };
  const ok = el('button', 'btn primary', '전원 넣기'); ok.onclick = () => { if (ctx.val.some((v) => !v)) return toast('모든 전선을 이어야 합니다'); socket.emit('game:lock', { id: l.id, answer: ctx.val }); };
  const row = el('div', 'row'); row.append(reset, ok);
  wrap.append(el('div', 'lock-display small', '왼쪽 전선을 누른 뒤, 이어 붙일 오른쪽 단자를 누르세요'), board, row);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; setTimeout(paint, 50);
}
function openSimon(l) {
  const ctx = { ...l, val: [] };
  const wrap = el('div'); const pad = el('div', 'simon-pad');
  const tones = [523, 587, 659, 784, 880, 988];
  const btns = l.buttons.map((name, i) => { const b = el('button', 'simon-b', name); b.style.setProperty('--c', l.colors?.[i] || '#888'); b.onclick = () => press(i, true); pad.appendChild(b); return b; });
  const status = el('div', 'lock-display small', '잘 보세요…');
  const light = (i, ms = 380) => { btns[i].classList.add('on'); audio.tone?.(tones[i % tones.length], ms / 1000); setTimeout(() => btns[i].classList.remove('on'), ms); };
  let playing = false;
  const show = async () => {
    playing = true; ctx.val = []; status.textContent = '잘 보세요…';
    await new Promise((r) => setTimeout(r, 500));
    for (const name of l.sequence || []) { if (!S.modalOpen) return; light(l.buttons.indexOf(name)); await new Promise((r) => setTimeout(r, 650)); }
    playing = false; status.textContent = `이제 같은 순서로! (${(l.sequence || []).length}번)`;
  };
  const press = (i) => {
    if (playing) return;
    light(i, 220); ctx.val.push(l.buttons[i]);
    status.textContent = ctx.val.join(' → ');
    if (ctx.val.length >= (l.sequence || []).length) setTimeout(() => { socket.emit('game:lock', { id: l.id, answer: ctx.val }); ctx.val = []; }, 300);
  };
  const again = el('button', 'btn small', '▶ 다시 보기'); again.onclick = show;
  wrap.append(status, pad, again);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; show();
}
// ───── 별자리 잇기: 점을 순서대로 눌러 선을 긋는다 (정답: 누른 점 번호 순서)
function openStars(l) {
  const pts = l.points || []; const need = (l.len || 0) || pts.length;
  const ctx = { ...l, val: [] };
  const wrap = el('div'); const cv = el('canvas', 'stars-cv'); cv.width = 520; cv.height = 360;
  const status = el('div', 'lock-display small', '빛나는 점을 순서대로 눌러 선을 이어 보자');
  const x = cv.getContext('2d');
  const P = (i) => [30 + pts[i][0] * 460, 24 + pts[i][1] * 312];
  const draw = (hover = -1) => {
    const g = x.createRadialGradient(260, 180, 20, 260, 180, 320); g.addColorStop(0, '#1a1430'); g.addColorStop(1, '#05030c'); x.fillStyle = g; x.fillRect(0, 0, 520, 360);
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${((i * 37) % 10) / 30})`; x.fillRect((i * 131) % 520, (i * 71) % 360, 1.5, 1.5); }
    x.strokeStyle = '#ffe9a8'; x.lineWidth = 3; x.shadowColor = '#ffd36a'; x.shadowBlur = 12; x.beginPath();
    ctx.val.forEach((v, k) => { const [px, py] = P(v); k ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); x.shadowBlur = 0;
    pts.forEach((_, i) => { const [px, py] = P(i); const on = ctx.val.includes(i); x.fillStyle = on ? '#ffe9a8' : i === hover ? '#fff' : '#cfd8ff'; x.beginPath(); x.arc(px, py, on ? 9 : 7, 0, Math.PI * 2); x.fill(); if (l.labels?.[i]) { x.fillStyle = '#9aa4d0'; x.font = '12px sans-serif'; x.fillText(l.labels[i], px + 10, py - 8); } });
  };
  const pick = (e) => {
    const r = cv.getBoundingClientRect(); const mx = (e.clientX - r.left) * (520 / r.width), my = (e.clientY - r.top) * (360 / r.height);
    let best = -1, bd = 26; pts.forEach((_, i) => { const [px, py] = P(i); const d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  cv.addEventListener('pointerdown', (e) => {
    const i = pick(e); if (i < 0) return;
    if (ctx.val.length && ctx.val[ctx.val.length - 1] === i) return;
    if (ctx.val.includes(i) && !(l.close && i === ctx.val[0] && ctx.val.length === need - 1)) return;
    ctx.val.push(i); if (audio.xmasMechanical) audio.play('click'); else audio.tone?.(520 + ctx.val.length * 60, 0.25); draw();
    status.textContent = `${ctx.val.length} / ${need}`;
    if (ctx.val.length >= need) setTimeout(() => { socket.emit('game:lock', { id: l.id, answer: ctx.val.map(String) }); }, 350);
  });
  const reset = el('button', 'btn small', '↺ 처음부터'); reset.onclick = () => { ctx.val = []; status.textContent = '빛나는 점을 순서대로 눌러 선을 이어 보자'; draw(); };
  wrap.append(status, cv, reset);
  openModal(l.title, l.text, wrap);
  ctx.reset = () => { ctx.val = []; draw(); };
  S.lockCtx = ctx; draw();
}
// ───── 야바위: 컵이 섞이는 걸 지켜본 뒤 공이 든 컵을 고른다
function openCups(l) {
  const n = l.cups || 3, swaps = l.swaps || []; const ctx = { ...l, val: '' };
  const wrap = el('div'); const table = el('div', 'cups-table'); const status = el('div', 'lock-display small', '공이 어느 컵에 들어가는지 잘 보세요…');
  const cups = [...Array(n)].map((_, i) => { const c = el('button', 'cup', ''); c.innerHTML = '<span class="cup-body"></span><span class="cup-ball"></span>'; table.appendChild(c); return c; });
  let slot = [...Array(n).keys()]; // 컵 i 가 지금 있는 자리
  const place = (ms = 0) => cups.forEach((c, i) => { c.style.transition = `left ${ms}ms ease-in-out, transform ${ms}ms`; c.style.left = `calc(${(slot[i] + 0.5) * (100 / n)}% - 40px)`; });
  let ready = false;
  const run = async () => {
    ready = false; slot = [...Array(n).keys()]; place(0); cups.forEach((c) => c.classList.remove('lift', 'ball', 'pick'));
    // 이야기 창이나 깜짝 연출이 떠 있으면 닫힐 때까지 기다렸다가 섞는다 (섞는 걸 못 보는 일 방지)
    while (S.modalOpen && (!$('#story').classList.contains('hidden') || !$('#scare').classList.contains('hidden'))) await new Promise((r) => setTimeout(r, 200));
    if (!S.modalOpen) return;
    await new Promise((r) => setTimeout(r, 400));
    const ball = l.start ?? 1; cups[ball].classList.add('ball', 'lift'); await new Promise((r) => setTimeout(r, 1400)); cups[ball].classList.remove('lift');
    await new Promise((r) => setTimeout(r, 450)); cups[ball].classList.remove('ball');
    const speed = Math.max(260, 520 - swaps.length * 18);
    for (const [a, b] of swaps) { // a, b 는 자리 번호
      if (!S.modalOpen) return;
      const ca = slot.indexOf(a), cb = slot.indexOf(b); slot[ca] = b; slot[cb] = a; place(speed); audio.play('click');
      cups[ca].style.transform = 'translateY(-14px)'; cups[cb].style.transform = 'translateY(14px)';
      await new Promise((r) => setTimeout(r, speed + 40)); cups[ca].style.transform = cups[cb].style.transform = '';
    }
    ready = true; status.textContent = '공은 어느 컵에? (한 번만 고를 수 있어요)';
  };
  cups.forEach((c, i) => (c.onclick = () => { if (!ready) return; ready = false; c.classList.add('pick', 'lift'); socket.emit('game:lock', { id: l.id, answer: String(slot[i]) }); }));
  const again = el('button', 'btn small', '▶ 다시 하기'); again.onclick = () => { closeModal(); socket.emit('game:interact', l.id); };
  wrap.append(status, table, again);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; setTimeout(run, 300);
}
// ───── 저울: 추를 골라 올려 목표 무게를 맞춘다 (정답: 올린 추의 조합)
function openBalance(l) {
  const ws = l.weights || []; const ctx = { ...l, val: [] }; const on = new Set();
  const wrap = el('div'); const beam = el('div', 'bal-beam'); const pans = el('div', 'bal-pans'); const left = el('div', 'bal-pan', `🎯 ${l.target ?? '?'}${l.unit || 'kg'}`); const right = el('div', 'bal-pan right');
  pans.append(left, right); const row = el('div', 'bal-weights'); const status = el('div', 'lock-display small');
  const sum = () => [...on].reduce((s, i) => s + ws[i], 0);
  const paint = () => {
    right.innerHTML = ''; [...on].forEach((i) => right.appendChild(el('span', 'bal-w on', ws[i] + (l.unit || 'kg'))));
    const d = Math.max(-1, Math.min(1, ((l.target ?? 0) - sum()) / Math.max(1, l.target || 10)));
    beam.style.transform = `rotate(${d * -14}deg)`;
    status.textContent = `오른쪽 접시: ${sum()}${l.unit || 'kg'}${l.pick ? ` · 추 ${on.size}/${l.pick}개` : ''}`;
  };
  ws.forEach((w, i) => { const b = el('button', 'bal-w', w + (l.unit || 'kg')); b.onclick = () => { if (on.has(i)) on.delete(i); else { if (l.pick && on.size >= l.pick) return; on.add(i); } b.classList.toggle('on', on.has(i)); audio.play('click'); paint(); }; row.appendChild(b); });
  const ok = el('button', 'btn primary', '⚖ 올려 보기'); ok.onclick = () => socket.emit('game:lock', { id: l.id, answer: [...on].map((i) => ws[i]) });
  wrap.append(status, beam, pans, row, ok);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; paint();
}
function openSlide(l) {
  const n = l.size || 3;
  let tiles = [...Array(n * n - 1).keys()].map((i) => String(i + 1)).concat('_');
  // 풀 수 있는 상태가 되도록 정답에서 무작위로 섞는다
  for (let k = 0; k < 160; k++) { const e = tiles.indexOf('_'); const r = Math.floor(e / n), c = e % n; const nb = []; if (r > 0) nb.push(e - n); if (r < n - 1) nb.push(e + n); if (c > 0) nb.push(e - 1); if (c < n - 1) nb.push(e + 1); const j = nb[Math.floor(Math.random() * nb.length)]; [tiles[e], tiles[j]] = [tiles[j], tiles[e]]; }
  const ctx = { ...l, val: tiles.join('') };
  const wrap = el('div'); const grid = el('div', 'slide-grid'); grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  const art = slideArt(l.image, n);
  const paint = () => {
    grid.innerHTML = '';
    tiles.forEach((tl, i) => {
      const b = el('button', 'slide-t' + (tl === '_' ? ' empty' : ''));
      if (tl !== '_') { const k = Number(tl) - 1; b.style.backgroundImage = `url(${art})`; b.style.backgroundSize = `${n * 100}% ${n * 100}%`; b.style.backgroundPosition = `${((k % n) / (n - 1)) * 100}% ${(Math.floor(k / n) / (n - 1)) * 100}%`; b.appendChild(el('span', 'slide-n', tl)); }
      b.onclick = () => move(i); grid.appendChild(b);
    });
    ctx.val = tiles.join('');
  };
  const move = (i) => {
    const e = tiles.indexOf('_'); const ok = (Math.abs(e - i) === 1 && Math.floor(e / n) === Math.floor(i / n)) || Math.abs(e - i) === n;
    if (!ok) return; [tiles[e], tiles[i]] = [tiles[i], tiles[e]]; audio.play('click'); paint();
    if (tiles.join('') === [...Array(n * n - 1).keys()].map((x) => x + 1).join('') + '_') setTimeout(() => socket.emit('game:lock', { id: l.id, answer: ctx.val }), 300);
  };
  wrap.append(el('div', 'lock-display small', '빈칸 옆의 조각을 눌러 밀자 (숫자 1~' + (n * n - 1) + ' 순서)'), grid);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; paint();
}
function slideArt(kind, n) {
  const c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d');
  if (kind === 'zombie') { // 하린이네 가족사진: 헬멧을 든 아빠 · 엄마 · 노란 원피스 아이 · 노란 풍선
    const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#8ac8f0'); g.addColorStop(1, '#e8f4ff'); x.fillStyle = g; x.fillRect(0, 0, 300, 300);
    x.fillStyle = '#6aa860'; x.fillRect(0, 220, 300, 80);
    x.fillStyle = '#3a5a3a'; x.beginPath(); x.ellipse(40, 120, 26, 10, 0, 0, 7); x.fill(); x.fillRect(10, 116, 60, 8); x.fillRect(64, 112, 30, 4); // 멀리 헬기
    const person = (cx, top, shirt, skin, h) => { x.fillStyle = shirt; x.fillRect(cx - 22, top + 40, 44, h); x.fillStyle = skin; x.beginPath(); x.arc(cx, top + 22, 20, 0, 7); x.fill(); x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(cx, top + 14, 20, Math.PI, 0); x.fill(); x.fillStyle = '#222'; x.fillRect(cx - 8, top + 20, 4, 4); x.fillRect(cx + 4, top + 20, 4, 4); x.strokeStyle = '#a04040'; x.lineWidth = 2; x.beginPath(); x.arc(cx, top + 28, 6, 0.1 * Math.PI, 0.9 * Math.PI); x.stroke(); };
    person(80, 70, '#3a5a8a', '#f0c8a0', 130); x.fillStyle = '#f0f0f0'; x.beginPath(); x.arc(52, 160, 18, 0, 7); x.fill(); x.fillStyle = '#2a4a6a'; x.fillRect(40, 152, 24, 10); // 비행 헬멧
    person(220, 80, '#d86a8a', '#f4d4b4', 120);
    person(150, 140, '#ffd23a', '#ffe0cc', 70);
    x.strokeStyle = '#888'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(168, 200); x.lineTo(190, 60); x.stroke(); x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(190, 46, 22, 27, 0, 0, 7); x.fill();
    x.fillStyle = '#c03040'; x.font = 'bold 20px serif'; x.fillText('🎂', 120, 40);
    x.strokeStyle = '#ffffff'; x.lineWidth = 10; x.strokeRect(5, 5, 290, 290);
    x.fillStyle = '#3a2a1a'; x.font = 'bold 18px serif'; x.fillText('하린 생일 2018.08.24', 60, 278);
    return c.toDataURL();
  }
  if (kind === 'park') { // 2006.07.07 21:40 거울 미궁 입구 — 아이 일곱, 맨 앞 왕관 쓴 아이가 열쇠를 든다
    const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#2a1a2a'); g.addColorStop(1, '#4a3a3a'); x.fillStyle = g; x.fillRect(0, 0, 300, 300);
    for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(200,220,240,${0.15 + (i % 2) * 0.1})`; x.fillRect(10 + i * 48, 40, 40, 150); }
    x.fillStyle = '#ffd36a'; x.font = 'bold 18px sans-serif'; x.fillText('거울 미궁 OPEN', 80, 30);
    const kids = [[40, '#ff8fab'], [80, '#e8c13a'], [120, '#9ab7d8'], [160, '#2fbf71'], [200, '#ffb0e0'], [240, '#b39dff']];
    kids.forEach(([cx, c]) => { x.fillStyle = c; x.fillRect(cx - 14, 200, 28, 50); x.fillStyle = '#f1d4b8'; x.beginPath(); x.arc(cx, 186, 14, 0, 7); x.fill(); x.fillStyle = '#2a1a10'; x.fillRect(cx - 14, 172, 28, 8); });
    x.fillStyle = '#c0262d'; x.fillRect(136, 214, 28, 56); x.fillStyle = '#f1d4b8'; x.beginPath(); x.arc(150, 200, 15, 0, 7); x.fill(); x.fillStyle = '#ffd36a'; x.beginPath(); x.moveTo(136, 186); x.lineTo(141, 176); x.lineTo(146, 184); x.lineTo(150, 172); x.lineTo(154, 184); x.lineTo(159, 176); x.lineTo(164, 186); x.fill(); x.fillRect(168, 222, 14, 4);
    x.fillStyle = 'rgba(255,120,40,.25)'; x.fillRect(0, 260, 300, 40); x.fillStyle = '#ffe9a8'; x.font = 'bold 16px serif'; x.fillText('2006.07.07  21:40', 80, 290);
    return c.toDataURL();
  }
  if (kind === 'clown') { // 블루문 서커스 단체 사진: 줄무늬 천막 앞 단장 · 삐에로 · 목말 탄 아이
    for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#a0141e' : '#efe6d6'; x.fillRect(i * 30, 0, 30, 300); }
    x.fillStyle = 'rgba(30,10,20,.35)'; x.fillRect(0, 0, 300, 300); x.fillStyle = '#3a2418'; x.fillRect(0, 238, 300, 62);
    const body = (cx, col, h) => { x.fillStyle = col; x.fillRect(cx - 24, 238 - h, 48, h); };
    body(150, '#8a0a1a', 110); x.fillStyle = '#e8c8a8'; x.beginPath(); x.arc(150, 112, 22, 0, 7); x.fill(); x.fillStyle = '#0a0a0e'; x.fillRect(128, 52, 44, 44); x.fillRect(116, 92, 68, 6); x.fillStyle = '#ffcc33'; x.fillRect(141, 108, 5, 4); x.fillRect(154, 108, 5, 4);
    x.fillStyle = '#ccc'; x.fillRect(176, 136, 14, 3); x.fillStyle = 'rgba(220,220,220,.5)'; x.beginPath(); x.arc(196, 128, 8, 0, 7); x.fill();
    body(72, '#f6f2ea', 104); for (let i = 0; i < 6; i++) { x.fillStyle = ['#d6303a', '#2f5fd0', '#ffd36a'][i % 3]; x.beginPath(); x.arc(58 + (i % 3) * 14, 150 + Math.floor(i / 3) * 30, 5, 0, 7); x.fill(); }
    x.fillStyle = '#f8f6f0'; x.beginPath(); x.arc(72, 118, 21, 0, 7); x.fill(); x.fillStyle = '#ff4a1a'; x.beginPath(); x.arc(50, 114, 12, 0, 7); x.arc(94, 114, 12, 0, 7); x.fill(); x.fillStyle = '#d6303a'; x.beginPath(); x.arc(72, 120, 6, 0, 7); x.fill(); x.fillStyle = '#2f5fd0'; x.fillRect(62, 120, 3, 8);
    x.fillStyle = '#d6303a'; x.fillRect(60, 64, 24, 30); x.fillStyle = '#ffe0cc'; x.beginPath(); x.arc(72, 52, 13, 0, 7); x.fill(); x.fillStyle = '#ffd36a'; x.font = 'bold 16px serif'; x.fillText('★', 64, 40);
    body(232, '#5a2a6a', 96); x.fillStyle = '#e8d4c4'; x.beginPath(); x.arc(232, 130, 19, 0, 7); x.fill(); x.fillStyle = '#e8c170'; for (let i = 0; i < 8; i++) x.fillRect(214 + (i % 4) * 10, 160 + Math.floor(i / 4) * 14, 4, 4);
    x.fillStyle = '#ffe9a8'; x.font = 'bold 17px serif'; x.fillText('BLUE MOON CIRCUS 1998.12.24', 18, 272);
    return c.toDataURL();
  }
  const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#8a6a78'); g.addColorStop(1, '#3a2228'); x.fillStyle = g; x.fillRect(0, 0, 300, 300);
  x.fillStyle = '#f2ead8'; x.fillRect(110, 170, 80, 40); x.fillStyle = '#ffd6e0'; x.fillRect(120, 150, 60, 22); for (let i = 0; i < 8; i++) { x.fillStyle = '#fff'; x.fillRect(124 + i * 7, 136, 2, 14); x.fillStyle = '#ffcc55'; x.fillRect(123 + i * 7, 130, 4, 6); }
  const kids = [[40, '#ff8fab'], [85, '#9ab7d8'], [215, '#ffd166'], [260, '#b5a8ff'], [150, '#7ab0e8']];
  kids.forEach(([cx, col], i) => { const cy = i === 4 ? 90 : 120; x.fillStyle = col; x.fillRect(cx - 18, cy + 20, 36, 50); x.fillStyle = '#f4ece4'; x.beginPath(); x.arc(cx, cy, 20, 0, 7); x.fill(); x.fillStyle = i === 4 ? '#e8c170' : '#5a3825'; x.beginPath(); x.arc(cx, cy - 6, 21, Math.PI, 0); x.fill(); x.fillStyle = '#222'; x.fillRect(cx - 8, cy, 4, 4); x.fillRect(cx + 4, cy, 4, 4); });
  x.strokeStyle = '#c9a24a'; x.lineWidth = 10; x.strokeRect(5, 5, 290, 290);
  x.fillStyle = '#f2ead8'; x.font = 'bold 18px serif'; x.fillText('Clara  1958.3.3', 80, 275);
  return c.toDataURL();
}
function openRotate(l) {
  const vals = Array(l.rings).fill(1);
  const ctx = { ...l, val: vals.slice() };
  const wrap = el('div'); const row = el('div', 'rot-row');
  const faces = vals.map((v, i) => {
    const col = el('div', 'rot');
    const gear = el('div', 'rot-gear'); const num = el('div', 'rot-num', '1');
    gear.appendChild(num);
    const turn = (d) => { vals[i] = ((vals[i] - 1 + d + l.positions) % l.positions) + 1; ctx.val = vals.slice(); gear.style.transform = `rotate(${(vals[i] - 1) * (360 / l.positions)}deg)`; num.style.transform = `rotate(${-(vals[i] - 1) * (360 / l.positions)}deg)`; num.textContent = vals[i]; audio.play('clock_tick'); };
    const a = el('button', 'btn small', '⟲'), b = el('button', 'btn small', '⟳'); a.onclick = () => turn(-1); b.onclick = () => turn(1); gear.onclick = () => turn(1);
    col.append(el('div', 'muted', l.labels?.[i] || `${i + 1}`), gear, el('div', 'row', null)); col.lastChild.append(a, b);
    row.appendChild(col); return gear;
  });
  const ok = el('button', 'btn primary', '맞물리기'); ok.onclick = () => socket.emit('game:lock', { id: l.id, answer: ctx.val });
  wrap.append(el('div', 'lock-display small', '톱니를 눌러 돌리자 (1~' + l.positions + ')'), row, ok);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx;
}
function openClock(l) {
  let h = 12, m = 0;
  const ctx = { ...l, val: '12:00' };
  const wrap = el('div');
  const face = el('div', 'clock-face'); const hh = el('div', 'hand hour'), mh = el('div', 'hand min');
  for (let i = 1; i <= 12; i++) { const nmb = el('span', 'cnum', String(i)); const a = (i / 12) * Math.PI * 2; nmb.style.left = 50 + Math.sin(a) * 40 + '%'; nmb.style.top = 50 - Math.cos(a) * 40 + '%'; face.appendChild(nmb); }
  face.append(hh, mh, el('div', 'hub'));
  const disp = el('div', 'lock-display');
  const paint = () => { ctx.val = `${h}:${String(m).padStart(2, '0')}`; disp.textContent = ctx.val; mh.style.transform = `rotate(${m * 6}deg)`; hh.style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`; };
  const mk = (label, fn) => { const b = el('button', 'btn small', label); b.onclick = () => { fn(); audio.play('click'); paint(); }; return b; };
  const row1 = el('div', 'row'); row1.append(mk('시 −', () => (h = h === 1 ? 12 : h - 1)), mk('시 +', () => (h = h === 12 ? 1 : h + 1)));
  const row2 = el('div', 'row'); row2.append(mk('분 −5', () => (m = (m + 55) % 60)), mk('분 +5', () => (m = (m + 5) % 60)));
  const ok = el('button', 'btn primary', '바늘 고정'); ok.onclick = () => socket.emit('game:lock', { id: l.id, answer: ctx.val });
  wrap.append(disp, face, row1, row2, ok);
  openModal(l.title, l.text, wrap);
  S.lockCtx = ctx; paint();
}
function pressBtn(k) {
  const c = S.lockCtx; if (!c) return;
  if (c.notes) audio.pianoNote(k); else if (c.drum) audio.drumNote(k); else if (c.morse) audio.play(k === '−' ? 'morse_long' : 'morse_short'); else audio.play('click');
  if (c.val.length < c.len) c.val.push(k);
  renderLockVal();
  if (c.val.length === c.len) setTimeout(() => socket.emit('game:lock', { id: c.id, answer: c.val }), 300);
}
function renderLockVal() {
  const c = S.lockCtx; const d = $('.lock-display'); if (!c || !d) return;
  d.classList.remove('ok');
  if (c.input === 'digits') d.textContent = (c.val + '_'.repeat(Math.max(0, (c.len || 4) - c.val.length))).split('').join(' ');
  else if (c.input === 'text') d.textContent = c.val || '…';
  else if (['dial', 'grid', 'clock', 'tune', 'wires', 'simon', 'slide', 'rotate'].includes(c.input)) return;
  else { d.style.fontSize = '18px'; d.style.letterSpacing = '2px'; d.textContent = c.val.length ? c.val.join(' → ') : `(${c.len}개를 순서대로)`; }
}
function lockKey(e) {
  const c = S.lockCtx; if (!c) return;
  if (c.input === 'buttons') { const n = Number(e.key); if (n >= 1 && n <= c.buttons.length) pressBtn(c.buttons[n - 1]); else if (e.key === 'Backspace') { c.val.pop(); renderLockVal(); } return; }
  if (c.input !== 'digits') return;
  if (/^[0-9]$/.test(e.key) && c.val.length < (c.len || 6)) { c.val += e.key; audio.play('click'); renderLockVal(); if (c.val.length === c.len) setTimeout(() => socket.emit('game:lock', { id: c.id, answer: c.val }), 150); }
  else if (e.key === 'Backspace') { c.val = c.val.slice(0, -1); renderLockVal(); }
  else if (e.key === 'Enter') socket.emit('game:lock', { id: c.id, answer: c.val });
}

// ─────────────────────────── 스토리
function queueStory(s) { S.storyQueue.push(s); if (!S.storyOpen) nextStory(); }
let typeTimer = null;
function nextStory() {
  resetInput();
  const s = S.storyQueue.shift();
  if (!s) { S.storyOpen = false; $('#story').classList.add('hidden'); return; }
  S.storyOpen = true; closeModal();
  $('#storyTitle').textContent = s.title;
  $('#storyBy').textContent = s.by ? `— ${s.by} 님의 행동으로` : '';
  $('#story').classList.remove('hidden');
  if (s.sound) audio.play(s.sound);
  const txt = s.text; S.storyText = txt; let i = 0; const box = $('#storyText'); box.textContent = '';
  clearInterval(typeTimer);
  typeTimer = setInterval(() => { i += 2; box.textContent = txt.slice(0, i); if (i >= txt.length) clearInterval(typeTimer); }, 18);
  S.storyFull = () => { clearInterval(typeTimer); box.textContent = txt; };
}
function closeStory(force) {
  if (force) { clearInterval(typeTimer); S.storyOpen = false; $('#story').classList.add('hidden'); return; }
  if (!S.storyOpen) return;
  if (S.storyText && $('#storyText').textContent.length < S.storyText.length) { S.storyFull(); return; }
  nextStory();
}
$('#storyClose').onclick = () => closeStory();

// ─────────────────────────── 수첩 (본 단서 자동 기록)
// 테마마다 따로 적고, 같은 물건(같은 제목)은 한 번만 — 다시 읽으면 새 줄을 쌓지 않고 최신 내용으로 고친다
const journalSc = () => S.scenario?.id || null;
function addJournal(title, text, kind) {
  if (!text) return;
  const sc = journalSc(); if (!sc) return; // 로비에서 본 것은 적지 않는다
  const ch = S.chapter?.title || '';
  // 힌트는 같은 제목(힌트 1/3)이 목표마다 달라서 내용까지 같아야 같은 기록
  const same = (j) => j.sc === sc && j.title === title && (kind === 'hint' ? j.text === text : j.kind !== 'hint');
  const old = S.journal.find(same);
  if (old) { if (old.text !== text && text.length >= old.text.length * 0.6) { old.text = text; old.ch = ch || old.ch; store.set('gwimun-journal', S.journal); } return; }
  S.journal.push({ sc, ch, title, text, kind, t: Date.now() });
  if (S.journal.length > 600) S.journal.shift();
  store.set('gwimun-journal', S.journal);
}
// 테마를 처음부터 새로 시작하면 그 테마의 지난 기록은 지운다 (이어하기는 그대로 둔다)
function resetJournalFor(sc) { S.journal = S.journal.filter((j) => j.sc && j.sc !== sc); store.set('gwimun-journal', S.journal); }
function openJournal() {
  const wrap = el('div');
  const q = el('input', 'journal-search'); q.placeholder = '🔍 검색 (예: 키, 생일, 시간표)';
  const list = el('div');
  const render = () => {
    list.innerHTML = '';
    const term = q.value.trim();
    const sc = journalSc();
    const items = S.journal.filter((j) => j.sc === sc && (!term || (j.title + j.text).includes(term))).slice().reverse();
    if (!items.length) list.appendChild(el('div', 'muted', sc ? '아직 기록이 없습니다. 무언가를 살펴보면 여기에 자동으로 적힙니다.' : '테마를 시작하면 살펴본 단서가 여기에 자동으로 적힙니다.'));
    for (const j of items) {
      const d = el('div', 'jentry' + (j.kind === 'hint' ? ' hint' : ''));
      d.append(el('div', 'jc', `${j.ch} · ${{ clue: '단서', story: '이야기', hint: '힌트', item: '아이템' }[j.kind] || ''}`), el('div', 'jt', j.title), el('div', 'jx', j.text));
      list.appendChild(d);
    }
  };
  q.oninput = render; q.onkeydown = (e) => e.stopPropagation();
  const clear = el('button', 'btn small', '수첩 비우기'); clear.onclick = () => askConfirm('수첩 비우기', '이 테마의 수첩 기록을 모두 지울까요?', '모두 지우기', () => { resetJournalFor(journalSc()); render(); });
  wrap.append(q, list, clear);
  render();
  openModal('📓 수첩' + (S.scenario?.title ? ' — ' + S.scenario.title.split(' — ')[0] : ''), '이 테마에서 살펴본 글, 이야기, 힌트가 한 번씩 자동으로 기록됩니다.', wrap);
}

// ─────────────────────────── 인벤토리 (클릭: 바로 사용 · 우클릭: 메뉴)
function renderInv() {
  const box = $('#inventory'); box.innerHTML = '';
  S.inv.forEach((it, i) => {
    const d = S.items[it] || { icon: '?', name: it };
    const s = el('div', 'slot' + (d.relic ? ' relic' : '') + (it === 'flashlight' && S.light ? ' lit' : '') + (S.combining === i ? ' combining' : ''));
    s.textContent = d.icon;
    s.title = `${d.name} — ${d.desc || ''}\n클릭: ${d.use === 'flashlight' ? '켜기/끄기' : d.use === 'talisman' ? '태우기' : d.use === 'read' ? '읽기' : '정보'} · 우클릭: 메뉴`;
    if (i < 9) s.appendChild(el('span', 'k', String(i + 1)));
    if (it === 'flashlight') s.appendChild(el('span', 'badge2', S.light ? 'ON' : 'OFF'));
    s.onclick = () => {
      if (S.combining != null && S.combining !== i) { socket.emit('inv:combine', { a: S.inv[S.combining], b: it }); S.combining = null; renderInv(); return; }
      primaryItem(it, i, s);
    };
    s.oncontextmenu = (e) => { e.preventDefault(); itemMenu(it, i, s); };
    box.appendChild(s);
  });
  if (!S.inv.length) box.appendChild(el('div', 'muted', '빈 가방'));
  updateStatus();
}
function primaryItem(it, i, slotEl) {
  const d = S.items[it]; if (!d) return;
  if (d.use === 'flashlight' || d.use === 'talisman') return useItem(it);
  if (d.use === 'read') { openDoc(`${d.icon} ${d.name}`, `${d.desc}\n\n${d.read}`, { item: d }); addJournal(d.name, d.read, 'item'); return; }
  itemMenu(it, i, slotEl || $('#inventory').children[i]);
}
function useItem(it) {
  if (!S.inv.includes(it)) return;
  if (it === 'flashlight') { S.light = !S.light; S.myLight = S.light; S.lightAt = performance.now(); audio.play('click'); if (myAvatar) setLight(myAvatar, S.light); renderInv(); }
  socket.emit('inv:use', it);
}
function hideMenus() { $('#itemMenu').classList.add('hidden'); $('#playerMenu').classList.add('hidden'); }
function itemMenu(it, idx, anchor) {
  const d = S.items[it]; if (!d) return;
  const m = $('#itemMenu'); m.innerHTML = '';
  m.append(el('div', 'nm', `${d.icon} ${d.name}`), el('div', 'ds', d.desc));
  const add = (label, fn) => { const b = el('button', 'btn small', label); b.onclick = () => { hideMenus(); fn(); }; m.appendChild(b); };
  if (d.use === 'flashlight') add(S.light ? '🔦 끄기 (F)' : '🔦 켜기 (F)', () => useItem(it));
  if (d.use === 'talisman') add('🔥 태우기 (T)', () => useItem(it));
  if (d.use === 'read') add('📖 읽기', () => primaryItem(it, idx));
  if (S.room === 'game') add('🧪 다른 아이템과 조합', () => { S.combining = idx; renderInv(); toast('조합할 다른 아이템을 클릭하세요 (Esc 취소)'); });
  const mates = (S.party?.members || []).filter((p) => p.id !== S.me && p.inGame);
  if (S.room === 'game') mates.forEach((p) => add(`🤝 ${p.name}에게 건네기`, () => socket.emit('inv:give', { item: it, to: p.id })));
  const r = anchor.getBoundingClientRect();
  m.classList.remove('hidden');
  m.style.left = Math.min(r.left, innerWidth - 200) + 'px';
  m.style.top = r.top - m.offsetHeight - 8 + 'px';
}
addEventListener('pointerdown', (e) => { if (!e.target.closest('#itemMenu') && !e.target.closest('.slot') && !e.target.closest('#playerMenu')) hideMenus(); });

// ─────────────────────────── 채팅
function setThemeComms(inTheme) {
  if (S.themeComms === inTheme) return;
  S.themeComms = inTheme;
  if (inTheme) {
    S.lobbyChatCh = S.chatCh;
    if (S.chatCh === 'all') $('#chatInput').value = '';
    $('#playerMenu').classList.add('hidden');
    for (const avatar of [myAvatar, ...S.others.values()]) {
      const bubble = avatar?.userData.bubble;
      if (bubble?.userData.chatChannel !== 'all') continue;
      removeLabel(bubble);
      avatar.userData.bubble = null;
    }
  }
  $('#chat [data-ch="all"]').classList.toggle('hidden', inTheme);
  setChatCh(inTheme ? 'party' : S.lobbyChatCh);
  updateVoiceTargets();
  renderVoiceUI();
}
function setChatCh(ch) {
  if (S.themeComms) ch = 'party';
  S.chatCh = ch;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.ch === ch));
  $('#chatInput').classList.toggle('party', ch === 'party');
  $('#chatInput').placeholder = S.themeComms ? '[파티] 메시지' : ch === 'party' ? '[파티] 메시지 (Tab: 전환)' : '[전체] 메시지 (Tab: 전환)';
  if (ch === 'party') $('#partyUnread').classList.add('hidden');
  renderChatFilter();
}
document.querySelectorAll('.tab').forEach((t) => (t.onclick = () => setChatCh(t.dataset.ch)));
$('#chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const text = e.target.value.trim(); if (text) socket.emit('chat', { channel: S.themeComms ? 'party' : S.chatCh, text }); e.target.value = ''; e.target.blur(); }
  if (e.key === 'Escape') e.target.blur();
});
const chatLog = [];
function addChat(m) {
  if (S.themeComms && m.channel === 'all') return;
  chatLog.push(m); if (chatLog.length > 200) chatLog.shift();
  if (m.channel === 'party' && S.chatCh !== 'party') $('#partyUnread').classList.remove('hidden');
  renderChatFilter();
  if (m.fromId) {
    const avatar = m.fromId === S.me ? myAvatar : S.others.get(m.fromId);
    if (avatar) {
      setBubble(avatar, m.text, m.channel);
      avatar.userData.bubble.userData.chatChannel = m.channel;
    }
  }
}
function renderChatFilter() {
  const box = $('#chatLog'); box.innerHTML = '';
  for (const m of chatLog) {
    if (m.channel === 'all' && (S.themeComms || S.chatCh === 'party')) continue;
    const d = el('div', 'm ' + m.channel);
    if (m.channel === 'system') d.textContent = m.text;
    else { if (m.admin) d.classList.add('admin'); d.appendChild(el('span', 'ch', m.channel === 'party' ? '[파티]' : '[전체]')); d.appendChild(el('b', null, (m.admin ? '🛡️ ' : '') + m.from + ': ')); d.appendChild(document.createTextNode(m.text)); }
    box.appendChild(d);
  }
  box.scrollTop = box.scrollHeight;
}
socket.on('chat', addChat);
// ─────────────────────────── 운영자
$('#adminToggle').onclick = () => { const r = $('#adminRow'); r.classList.toggle('hidden'); $('#nickRow').classList.toggle('hidden', !r.classList.contains('hidden')); if (!r.classList.contains('hidden')) $('#adminPass').focus(); };
$('#adminPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
socket.on('notice', ({ text }) => { const b = $('#noticeBanner'); b.textContent = '📢 ' + text; b.classList.remove('hidden'); audio.play('bell'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.add('hidden'), 9000); });
socket.on('kicked', ({ text }) => { store.set('gwimun-resume', null); S.resume = null; try { sessionStorage.setItem('mia-kick', text); } catch {} location.reload(); });
function openAdmin() {
  const w = el('div', 'admin-pop');
  const ta = el('textarea'); ta.placeholder = '모든 접속자에게 보낼 공지'; ta.maxLength = 200; ta.onkeydown = (e) => e.stopPropagation();
  const send = el('button', 'btn primary', '📢 공지 보내기'); send.onclick = () => { if (ta.value.trim()) { socket.emit('admin:notice', ta.value); ta.value = ''; } };
  const list = el('div', 'admin-list'); const head = el('div', 'muted', '불러오는 중…');
  const load = () => socket.emit('admin:stats', (st) => {
    head.textContent = `접속자 ${st.players.filter((p) => !p.offline).length}명 · 진행 중인 게임 ${st.games}개 · 고정 계정 ${st.accounts ?? '-'}개`; list.innerHTML = '';
    fbB.textContent = '📮 고객소리함 보기' + (st.feedbackNew ? ` (새 글 ${st.feedbackNew})` : '');
    statBox.innerHTML = ''; if (st.visit) statBox.appendChild(visitStats(st));
    for (const p of st.players) {
      const row = el('div', 'admin-row');
      row.append(el('span', 'an', (p.admin ? '🛡️ ' : '') + p.name), el('span', 'muted', `${p.room}${p.offline ? ' · 끊김' : ''}${p.muted ? ` · 🚫${Math.ceil(p.muted / 60)}분` : ''}${p.warns ? ` · 경고${p.warns}` : ''}`));
      if (!p.admin) {
        const b1 = el('button', 'btn tiny', '🚫 10분'); b1.onclick = () => { socket.emit('admin:mute', { id: p.id, minutes: 10 }); setTimeout(load, 300); };
        const b2 = el('button', 'btn tiny', '✅ 해제'); b2.onclick = () => { socket.emit('admin:unmute', p.id); setTimeout(load, 300); };
        const b3 = el('button', 'btn tiny danger', '내보내기'); b3.onclick = () => askConfirm('내보내기', `${p.name} 님을 내보낼까요?`, '내보내기', () => { socket.emit('admin:kick', p.id); setTimeout(load, 600); });
        row.append(b1, b2, b3);
      }
      list.appendChild(row);
    }
  });
  const re = el('button', 'btn small', '🔄 새로고침'); re.onclick = load;
  const statBox = el('div', 'visit-box');
  const rk = el('button', 'btn small', '🏆 랭킹 관리 (기록 지우기)'); rk.onclick = () => openRank({ main: 'theme' });
  const fbB = el('button', 'btn small', '📮 고객소리함 보기'); fbB.onclick = () => openFeedbackAdmin();
  const tools = el('div', 'row admin-tools'); tools.append(rk, fbB);
  const popup = el('div', 'admin-list');
  const enabled = el('input'); enabled.type = 'checkbox';
  const toggle = el('label', 'row'); toggle.append(enabled, document.createTextNode(' 광장 입장 시 팝업 표시'));
  const message = el('textarea'); message.maxLength = 200; message.placeholder = '광장 입장 팝업 문구';
  const savePopup = el('button', 'btn small', '입장 팝업 설정 저장');
  savePopup.disabled = true;
  socket.emit('admin:lobbyPopup:get', config => {
    enabled.checked = config.enabled; message.value = config.text; savePopup.disabled = false;
  });
  savePopup.onclick = () => {
    savePopup.disabled = true;
    socket.timeout(5000).emit('admin:lobbyPopup:set', { enabled: enabled.checked, text: message.value }, (error, result) => {
      savePopup.disabled = false;
      toast(result?.error || (error ? '공지 설정 응답을 받지 못했어요.' : '입장 팝업 설정을 저장했어요.'));
    });
  };
  popup.append(toggle, message, savePopup);
  w.append(ta, send, popup, statBox, tools, head, list, re); load();
  openModal('🛡️ 운영자', '공지 · 방문 통계 · 랭킹 관리 · 고객소리함 · 채팅 금지 · 내보내기 · 머니 무한', w);
}
// ─────────────────────────── 고객소리함 (버그 · 건의사항)
const FB_KIND = { bug: '🐞 버그', idea: '💡 건의', etc: '💬 기타', wish: '🌠 별점 · 소원' };
// 🖼 갤러리: 전광판에 걸린 최근 클리어 기념 사진을 모아 본다.
function openGallery() {
  const w = el('div', 'gal');
  const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`; };
  const grid = () => {
    w.innerHTML = '';
    if (!S.snaps.length) { w.appendChild(el('div', 'muted gal-empty', '아직 클리어 기념 사진이 없어요.\n테마를 클리어하면 전광판에 자동으로 올라와요.')); return; }
    const g = el('div', 'gal-grid');
    for (const sn of S.snaps) {
      const card = el('button', 'gal-card'); const im = el('img'); im.src = sn.img; im.alt = `${sn.name} 님 파티의 클리어 기념 사진`; im.loading = 'lazy';
      card.append(im, el('div', 'gal-cap', `📸 ${sn.theme} · ${ago(sn.at)}`));
      card.onclick = () => big(sn); g.appendChild(card);
    }
    w.appendChild(g);
  };
  const big = (sn) => {
    w.innerHTML = ''; S.galleryBig = true;
    const im = el('img', 'gal-big'); im.src = sn.img; im.alt = `${sn.name} 님 파티의 클리어 기념 사진`;
    const row = el('div', 'row gal-row');
    const back = el('button', 'btn', '← 목록'); back.onclick = () => { S.galleryBig = false; grid(); };
    const save = el('button', 'btn primary', '💾 저장'); save.onclick = () => { const a = el('a'); a.href = sn.img; a.download = `mia-gallery-${sn.name}-${sn.id}.jpg`; document.body.appendChild(a); a.click(); a.remove(); };
    row.append(back, save); w.append(im, el('div', 'gal-cap big', `📸 ${sn.theme} · ${sn.name} · ${ago(sn.at)}`), row);
  };
  S.galleryRefresh = () => { if (!S.galleryBig && w.isConnected) grid(); };
  S.galleryBig = false; grid();
  openModal('🖼 클리어 갤러리', '광장 전광판에 걸린 최근 클리어 기념 사진 27장', w);
  socket.emit('snap:list', mergeClearPhotos);
}
function openFeedback() {
  const w = el('div', 'fb');
  let kind = 'bug';
  const chips = el('div', 'fb-kinds');
  [['bug', '🐞 버그 신고'], ['idea', '💡 건의 · 아이디어'], ['etc', '💬 그 밖의 이야기']].forEach(([k, label]) => { const b = el('button', 'btn small', label); b.dataset.k = k; b.onclick = () => { kind = k; paint(); ta.focus(); }; chips.appendChild(b); });
  const ta = el('textarea', 'fb-text'); ta.maxLength = 1000; ta.rows = 6; ta.onkeydown = (e) => e.stopPropagation();
  const cnt = el('div', 'muted fb-count', '0 / 1000'); ta.oninput = () => { cnt.textContent = `${ta.value.length} / 1000`; };
  const paint = () => {
    chips.querySelectorAll('button').forEach((b) => b.classList.toggle('primary', b.dataset.k === kind));
    ta.placeholder = kind === 'bug' ? '어디에서(테마 · 몇 장), 무엇을 했을 때, 어떻게 됐는지 적어 주세요.\n예) 삐에로 4장에서 분장대가 눌리지 않아요.'
      : kind === 'idea' ? '이런 게 있으면 좋겠어요!\n새 테마 · 새 기능 · 고쳤으면 하는 점을 자유롭게 적어 주세요.' : '하고 싶은 이야기를 자유롭게 적어 주세요.';
  };
  const send = el('button', 'btn primary fb-send', '📮 우편함에 넣기');
  send.onclick = () => {
    const text = ta.value.trim(); if (text.length < 5) { toast('내용을 조금만 더 자세히 적어 주세요. (5자 이상)'); ta.focus(); return; }
    send.disabled = true;
    const back = setTimeout(() => { send.disabled = false; toast('보내지 못했어요. 잠시 후 다시 눌러 주세요.'); }, 6000);
    socket.emit('feedback:send', { kind, text }, (r) => {
      clearTimeout(back); send.disabled = false;
      if (r?.error) { toast(r.error); return; }
      closeModal(); audio.play('pickup'); toast('📮 소중한 의견 고마워요! 운영자가 꼭 읽어 볼게요.'); if (myAvatar) burstHearts(myAvatar, 6);
    });
  };
  w.append(chips, ta, cnt, send, el('div', 'muted fb-note', '보낸 글은 운영자만 볼 수 있어요. 닉네임 · 지금 있는 곳 · 브라우저 종류가 함께 전달됩니다.'));
  paint();
  openModal('📮 고객소리함', '버그를 발견했거나 바라는 점이 있다면 알려 주세요. 하나하나 읽고 고칩니다!', w);
  if (!document.body.classList.contains('mobile')) setTimeout(() => ta.focus(), 60);
}
// ─────────────────────────── 🗳️ 테마 투표 전광판: 한 사람에 한 번 · 첫 투표에 '아름다운 롤 양갈래' 헤어
function openVote() {
  const w = el('div', 'vote'), list = el('div', 'vote-list'), note = el('div', 'muted vote-note');
  S.votePaint = ({ mine = '', tally = {} } = {}) => {
    list.innerHTML = '';
    const total = Object.values(tally).reduce((a, b) => a + b, 0) || 1;
    for (const s of (S.scenarios || []).filter((x) => !x.hidden)) {
      const n = tally[s.id] || 0, b = el('button', 'btn vote-row' + (mine === s.id ? ' primary' : ''));
      const bar = el('i', 'vote-bar'); bar.style.width = (n / total) * 100 + '%';
      b.append(bar, el('span', 'vote-name', (mine === s.id ? '✅ ' : '') + s.title), el('span', 'vote-n', n + '표'));
      b.disabled = !!mine;
      b.onclick = () => { list.querySelectorAll('button').forEach((x) => { x.disabled = true; }); audio.play('click'); socket.emit('vote:theme', s.id); };
      list.appendChild(b);
    }
    note.textContent = mine ? '투표해 주셔서 고마워요! 💇 받은 헤어는 외형 꾸미기 › 헤어에서 고를 수 있어요.' : '한 사람에 한 번만 투표할 수 있어요. 투표하면 💇 「아름다운 롤 양갈래」 헤어를 드려요!';
  };
  w.append(list, note); S.votePaint(); socket.emit('vote:get');
  openModal('🗳️ 어느 테마가 가장 좋았나요?', '투표하면 아이템을 드려요!', w);
}
socket.on('vote:tally', (r = {}) => {
  S.votePaint?.(r);
  if (!r.reward) return;
  audio.play('pickup'); for (let i = 0; i < 4; i++) setTimeout(() => audio.play('twinkle'), 200 + i * 140);
  toast('💇 「아름다운 롤 양갈래」 헤어를 받았어요! 외형 꾸미기 › 헤어에서 골라 보세요.'); if (myAvatar) burstHearts(myAvatar, 8);
});
// ─────────────────────────── 🌠 소원의 별: 별점 + 소원 → 10초 별똥별 → 소원 전달 + 커피 후원
const WISH_WORD = ['', '아쉬워요', '그저 그래요', '괜찮아요', '좋아요!', '최고예요! 🥰'];
function openWish() {
  const w = el('div', 'wish');
  let stars = 0;
  const lab1 = el('div', 'wish-lab', '⭐ 게임 별점');
  const row = el('div', 'wish-stars'); const word = el('div', 'wish-word', '별을 눌러 점수를 주세요');
  const btns = [1, 2, 3, 4, 5].map((n) => { const b = el('button', 'wish-star', '★'); b.type = 'button'; b.setAttribute('aria-label', `${n}점`);
    b.onpointerenter = () => paint(n); b.onpointerleave = () => paint(stars); b.onclick = () => { stars = n; paint(n); audio.play('pickup'); check(); }; row.appendChild(b); return b; });
  const paint = (n) => { btns.forEach((b, i) => b.classList.toggle('on', i < n)); word.textContent = n ? `${n}점 · ${WISH_WORD[n]}` : '별을 눌러 점수를 주세요'; };
  const lab2 = el('div', 'wish-lab', '🌠 소원 빌기');
  const ta = el('textarea', 'wish-text'); ta.maxLength = 200; ta.rows = 3; ta.placeholder = '이루고 싶은 소원을 적어 주세요 ✨'; ta.onkeydown = (e) => e.stopPropagation();
  const cnt = el('div', 'muted wish-count', '0 / 200'); ta.oninput = () => { cnt.textContent = `${ta.value.length} / 200`; check(); };
  const note = el('div', 'wish-note', '*게임 별점과 소원 빌기를 작성하면 하늘에서 별똥별이 떨어져요');
  const send = el('button', 'btn primary wish-send', '🌠 작성'); send.disabled = true;
  const check = () => { send.disabled = !(stars && ta.value.trim()); };
  send.onclick = () => {
    if (send.disabled) return; send.disabled = true;
    const back = setTimeout(() => { check(); toast('보내지 못했어요. 잠시 후 다시 눌러 주세요.'); }, 6000);
    socket.emit('wish:send', { stars, text: ta.value.trim() }, (r) => {
      clearTimeout(back);
      if (r?.error) { toast(r.error); check(); return; }
      closeModal(); setTimeout(openWishDone, 10500); // 별똥별은 서버가 로비 모두에게 'wish:shower' 로 보낸다
    });
  };
  w.append(lab1, row, word, lab2, ta, cnt, send, note);
  openModal('🌠 소원의 별', '별에게 이 게임의 별점을 주고, 소원을 하나 빌어 보세요.', w);
}
function openWishDone() {
  const w = el('div', 'wish wish-done');
  w.append(el('div', 'wish-done-icon', '🌠'), el('div', 'wish-done-msg', '별똥별이 소원을 하늘로 데려갔어요.\n꼭 이루어지길 바랄게요 ✨'));
  const coffee = el('button', 'btn primary wish-coffee', '💗 감사한 마음 전하기');
  coffee.onclick = () => (isMobileView() ? openKakaoPay() : $('#coffeeBtn').onclick()); // 폰: 후원 링크 바로 · PC: QR 창
  const close = el('button', 'btn wish-close', '닫기'); close.onclick = closeModal;
  w.append(coffee, close);
  openModal('소원이 전달 되었어요', '', w);
}
// 10초 동안 로비 하늘에서 진짜로 별똥별이 쏟아진다 (3D · 로비에 있는 모두에게 · 'wish:shower' 를 받으면 시작)
// 별똥별은 하늘 높이(30~60m)에서 카메라 앞쪽 하늘을 가로질러 오른쪽 위 → 왼쪽 아래로. 꼬리는 카메라를 향하게 세운 빛 띠, 머리는 빛 덩이, 큰 별똥별은 반짝 가루를 흘린다
const shower = { on: false, end: 0, meshes: [], heads: [], live: [], dust: null };
function showerTex() {
  if (shower.tex) return shower.tex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 16; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,.45)'); g.addColorStop(0.97, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,1)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 16);
  const v = x.createLinearGradient(0, 0, 0, 16); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = v; x.fillRect(0, 0, 256, 16);
  const h = document.createElement('canvas'); h.width = h.height = 64; const y = h.getContext('2d'); const rg = y.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); y.fillStyle = rg; y.fillRect(0, 0, 64, 64);
  shower.tex = { tail: new THREE.CanvasTexture(c), head: new THREE.CanvasTexture(h) };
  return shower.tex;
}
const SHOWER_TINT = ['#ffffff', '#ffe9a8', '#bfe2ff', '#ffc6ea', '#d8c8ff'];
function meteorShower(sec) {
  if (S.room !== 'lobby' || !S.world) return;
  const now = performance.now() / 1000;
  S.world.wishStar?.boost(sec);
  if (shower.on) { shower.end = Math.max(shower.end, now + sec); return; } // 이미 쏟아지는 중이면 더 길게
  shower.on = true; shower.t0 = now; shower.end = now + sec;
  audio.play('wish_start');
  const tx = showerTex();
  if (!shower.meshes.length) { const geo = new THREE.PlaneGeometry(1, 1); geo.translate(-0.5, 0, 0); /* 머리(x=0)에서 꼬리(x=-1)로 */ for (let i = 0; i < 220; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tx.tail, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.head, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.visible = h.visible = false; m.frustumCulled = h.frustumCulled = false; m.renderOrder = h.renderOrder = 5; shower.meshes.push(m); shower.heads.push(h);
  } }
  shower.meshes.forEach((m) => scene.add(m)); shower.heads.forEach((h) => scene.add(h));
  // 반짝 가루 (점 600개, 색이 어두워지며 사라진다)
  const DN = 600, dg = new THREE.BufferGeometry(), dp = new Float32Array(DN * 3), dc = new Float32Array(DN * 3);
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ map: tx.head, size: 0.9, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  dust.frustumCulled = false; scene.add(dust);
  const D = Array.from({ length: DN }, () => ({ life: 0, max: 1, v: new THREE.Vector3(), c: new THREE.Color() })); let dn = 0;
  // 이번 비의 방향: 카메라 기준 오른쪽 위 → 왼쪽 아래 (모두 같은 쪽으로 흐르면 더 비처럼 보인다)
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  camera.getWorldDirection(fwd); fwd.y = 0; if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1); fwd.normalize(); right.crossVectors(fwd, up).normalize();
  const dir = new THREE.Vector3().addScaledVector(right, -0.78).addScaledVector(up, -0.55).addScaledVector(fwd, 0.12).normalize();
  const live = shower.live = [];
  const spawn = (big) => {
    const i = shower.meshes.findIndex((m) => !m.visible); if (i < 0) return;
    const m = shower.meshes[i], h = shower.heads[i], cp = camera.position;
    // 지금 카메라에 보이는 화면 위쪽 어딘가(오른쪽으로 조금 치우쳐)에서 생겨나 화면을 가로질러 떨어진다 → 카메라가 땅을 내려다봐도 보인다
    const dist = 14 + Math.random() * 46;
    const ray = new THREE.Vector3(-0.6 + Math.random() * 2.0, 0.15 + Math.random() * 1.0, 0.5).unproject(camera).sub(cp).normalize();
    const p = cp.clone().addScaledVector(ray, dist); p.y = Math.max(p.y, 3 + Math.random() * 4);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    dir.copy(camRight).multiplyScalar(-0.62).addScaledVector(camUp, -0.62).add(new THREE.Vector3(0, -0.35, 0)).normalize();
    const sp = (big ? 30 : 22 + Math.random() * 22) * (0.55 + dist / 60);
    const col = new THREE.Color(SHOWER_TINT[big ? 1 : Math.floor(Math.random() * SHOWER_TINT.length)]);
    const len = (big ? 16 : 5 + Math.random() * 8) * (0.5 + dist / 60), wid = (big ? 0.65 : 0.18 + Math.random() * 0.2) * (0.5 + dist / 60);
    m.material.color.copy(col); h.material.color.copy(col).lerp(new THREE.Color('#fff'), 0.6);
    m.visible = h.visible = true;
    live.push({ m, h, p, v: dir.clone().multiplyScalar(sp).add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3)), len, wid, life: 0, max: 0.8 + Math.random() * 0.8 + (big ? 0.7 : 0), big, col });
  };
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M4 = new THREE.Matrix4();
  let last = now, acc = 0, nextBig = 0.5, twk = 0;
  const step = () => {
    const tnow = performance.now() / 1000, dt = Math.min(0.05, tnow - last), t = tnow - shower.t0, left = shower.end - tnow; last = tnow;
    const gone = S.room !== 'lobby';
    if (!gone && left > 0.5) {
      const rate = 10 + 46 * Math.min(1, t / 1.5) * Math.min(1, left / 2 + 0.2);
      acc += dt * rate; while (acc >= 1) { acc -= 1; spawn(false); }
      if (t > nextBig) { spawn(true); nextBig = t + 0.45 + Math.random() * 0.7; }
      if (t > twk) { audio.play('twinkle'); twk = t + 0.18 + Math.random() * 0.35; }
    }
    for (let k = live.length - 1; k >= 0; k--) {
      const o = live[k]; o.life += dt; o.p.addScaledVector(o.v, dt);
      const f = Math.min(1, o.life / 0.15) * Math.max(0, 1 - Math.max(0, o.life - o.max * 0.55) / (o.max * 0.45));
      if (f <= 0 || gone) { o.m.visible = o.h.visible = false; live.splice(k, 1); continue; }
      // 꼬리 띠: x축은 날아가는 방향, 띠의 면은 카메라를 향하게
      X.copy(o.v).normalize(); Z.subVectors(camera.position, o.p); Z.addScaledVector(X, -Z.dot(X)).normalize(); Y.crossVectors(Z, X).normalize();
      M4.makeBasis(X, Y, Z); o.m.quaternion.setFromRotationMatrix(M4); o.m.position.copy(o.p); o.m.scale.set(o.len * (0.4 + 0.6 * Math.min(1, o.life / 0.3)), o.wid, 1);
      o.m.material.opacity = f; o.h.position.copy(o.p); o.h.scale.setScalar(o.wid * (o.big ? 9 : 6)); o.h.material.opacity = f;
      if (o.big ? Math.random() < dt * 60 : Math.random() < dt * 5) { const d = D[dn++ % DN]; d.life = 0; d.max = 0.7 + Math.random() * 1.1; d.p = o.p.clone().addScaledVector(X, -0.6); d.v.set((Math.random() - 0.5) * 3, -0.5 - Math.random() * 1.5, (Math.random() - 0.5) * 3).addScaledVector(o.v, 0.08); d.c.copy(o.col); }
    }
    for (let i = 0; i < DN; i++) { const d = D[i]; if (!d.p || d.life >= d.max) { dc[i * 3] = dc[i * 3 + 1] = dc[i * 3 + 2] = 0; continue; } d.life += dt; d.p.addScaledVector(d.v, dt); d.v.y -= 1.5 * dt; dp[i * 3] = d.p.x; dp[i * 3 + 1] = d.p.y; dp[i * 3 + 2] = d.p.z; const a = (1 - d.life / d.max) * (0.6 + 0.4 * Math.sin(d.life * 35)); dc[i * 3] = d.c.r * a; dc[i * 3 + 1] = d.c.g * a; dc[i * 3 + 2] = d.c.b * a; }
    dg.attributes.position.needsUpdate = true; dg.attributes.color.needsUpdate = true;
    if (!gone && (left > 0 || live.length)) requestAnimationFrame(step);
    else { shower.meshes.forEach((m) => { m.visible = false; scene.remove(m); }); shower.heads.forEach((h) => { h.visible = false; scene.remove(h); }); scene.remove(dust); dg.dispose(); shower.on = false; }
  };
  requestAnimationFrame(step);
}
// 로비의 누군가가 소원을 빌면 로비에 있는 모두의 하늘에 별똥별이 쏟아진다
socket.on('wish:shower', ({ name, sec } = {}) => {
  if (S.room !== 'lobby') return;
  meteorShower(Math.min(15, Number(sec) || 10));
  if (name && name !== S.me) toast(`🌠 ${name} 님이 소원을 빌었어요! 하늘을 올려다보세요 ✨`);
});
function openFeedbackAdmin() {
  const w = el('div', 'fb-admin'); w.appendChild(el('div', 'muted', '불러오는 중…'));
  const fmtAt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const load = () => socket.emit('admin:feedback', (list) => {
    if ($('#modalBody').firstChild !== w) return;
    w.innerHTML = '';
    w.appendChild(el('div', 'muted', `모두 ${list.length}개 · 아직 확인 안 한 글 ${list.filter((f) => !f.done).length}개`));
    if (!list.length) w.appendChild(el('div', 'bag-empty', '아직 도착한 글이 없어요 📭'));
    for (const f of list) {
      const d = el('div', 'fb-item' + (f.done ? ' done' : ''));
      d.append(el('div', 'fb-head', `${FB_KIND[f.kind] || ''} · ${f.name} (Lv.${f.lv ?? '?'}) · ${f.where || '-'} · ${fmtAt(f.at)}`), el('div', 'fb-body', f.text), el('div', 'fb-ua', f.ua || ''));
      const row = el('div', 'row');
      const ok = el('button', 'btn tiny', f.done ? '↩ 다시 열기' : '✅ 확인함'); ok.onclick = () => { socket.emit('admin:feedbackDone', f.id); setTimeout(load, 200); };
      const del = el('button', 'btn tiny danger', '🗑️ 지우기'); del.onclick = () => { socket.emit('admin:feedbackDel', f.id); setTimeout(load, 200); };
      row.append(ok, del); d.appendChild(row); w.appendChild(d);
    }
  });
  openModal('📮 고객소리함 (운영자)', '최근 200개까지 보여요. 확인한 글은 흐리게 표시됩니다.', w);
  footBtn('← 운영자 창', () => openAdmin());
  load();
}
$('#adminBtn').onclick = openAdmin;

// ─────────────────────────── 파티 & 접속자
socket.on('roster', (list) => { S.roster = list; renderRoster(); updateVoiceTargets(); });
socket.on('party', (p) => { S.party = p; syncAllOthers(); renderParty(); if (p && p.leader === S.me && !p.instId && (!p.pick || p.pick.n !== p.members.length)) sendPick(); renderRoster(); updateVoiceTargets(); });
socket.on('party:invite', ({ partyId, from }) => {
  audio.play('bell');
  $('#inviteText').textContent = `📨 ${from} 님이 파티에 초대했습니다.`;
  $('#inviteBox').classList.remove('hidden');
  $('#inviteYes').onclick = () => { socket.emit('party:respond', { partyId, accept: true }); $('#inviteBox').classList.add('hidden'); };
  $('#inviteNo').onclick = () => { socket.emit('party:respond', { partyId, accept: false }); $('#inviteBox').classList.add('hidden'); };
});
socket.on('toast', ({ text }) => toast(text));
function renderParty() {
  const p = S.party; const box = $('#partyMembers'); box.innerHTML = '';
  const amLeader = !p || p.leader === S.me;
  if (!p) box.appendChild(el('div', 'muted', '파티 없음 · 접속자 목록에서 초대하거나 바로 시작하세요'));
  else p.members.forEach((m) => {
    const d = el('div', 'member');
    if (m.id === p.leader) d.appendChild(el('span', 'crown', '👑'));
    d.appendChild(el('span', null, m.name + (m.id === S.me ? ' (나)' : '')));
    if (p.leader === S.me && m.id !== S.me && !p.instId) { const k = el('button', 'btn tiny kick', '추방'); k.onclick = () => socket.emit('party:kick', m.id); d.appendChild(k); }
    const mic = el('span', 'mic' + (m.mic ? ' on' : ''), m.mic ? '🎙️' : '🔇'); mic.dataset.id = m.id; d.appendChild(mic);
    box.appendChild(d);
  });
  $('#partyCount').textContent = p ? `${p.members.length}/4` : '';
  $('#leaveBtn').classList.toggle('hidden', !p || !!p.instId);
  const inGame = S.room === 'game';
  $('#startBox').classList.toggle('hidden', inGame); // 파티원도 시작 칸을 본다 (시작은 파티장만)
  $('#quitBtn').classList.toggle('hidden', !inGame);
  $('#quitBtn').textContent = amLeader ? '파티 전원 로비로 돌아가기' : '파티를 떠나 로비로';
  const sel = $('#chapterSel'); const prev = sel.value; sel.innerHTML = '';
  const hidOk = p ? (p.hiddenOk || S.admin) : (S.hiddenOk || S.admin);
  const scs = (p?.scenarios || S.scenarios || []).filter((x) => !x.hidden || hidOk); // 히든 테마는 열린 사람(파티장)에게만
  const ssel = $('#scenarioSel');
  const prevSc = ssel.value || store.get('gwimun-scenario', 'mia');
  if (ssel.options.length !== scs.length) { ssel.innerHTML = ''; scs.forEach((x) => { const o = el('option', null, `${x.hidden ? '🧟' : '🚪'} ${x.title}  ${diffStars(x.difficulty || 3)}`); o.value = x.id; o.title = x.desc; ssel.appendChild(o); }); }
  if ([...ssel.options].some((o) => o.value === prevSc)) ssel.value = prevSc;
  const scInfo = scs.find((x) => x.id === ssel.value) || scs[0];
  const ub = (p ? p.unlockedBy : S.unlockedBy) || {};
  const unlocked = ub[scInfo?.id]?.chapter ?? 0;
  $('#scenarioDesc').textContent = scInfo ? diffText(scInfo.difficulty || 3) + '\n' + scInfo.desc + (ub[scInfo.id]?.cleared ? ' · ✅ 클리어' : '') : '';
  (scInfo?.chapters || []).forEach((t, i) => { if (S.admin || i <= unlocked) { const o = el('option', null, (i === 0 ? '처음부터: ' : '이어하기: ') + t); o.value = i; sel.appendChild(o); } });
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  $('#startBtn').textContent = p && p.members.length > 1 ? '방탈출 시작' : '바로 시작';
  // 파티원: 파티장이 고른 내용을 그대로 보여 주고, 시작 대신 '시작 요청'
  const member = !!p && !amLeader;
  for (const id of ['#scenarioSel', '#fearSel', '#chapterSel']) $(id).disabled = member;
  $('#nudgeBtn').classList.toggle('hidden', !member);
  $('#startBtn').disabled = member;
  if (member) {
    $('#startBtn').textContent = '⏳ 파티장이 시작하면 함께 입장';
    const pk = p.pick;
    if (pk) {
      if ([...ssel.options].some((o) => o.value === pk.scenario)) ssel.value = pk.scenario;
      const info = scs.find((x) => x.id === pk.scenario);
      if (info) $('#scenarioDesc').textContent = diffText(info.difficulty || 3) + '\n' + info.desc;
      sel.innerHTML = ''; const t = info?.chapters?.[pk.chapter];
      if (t) { const o = el('option', null, (pk.chapter === 0 ? '처음부터: ' : '이어하기: ') + t); o.value = pk.chapter; sel.appendChild(o); }
      $('#fearSel').value = String(pk.fear); tintFear($('#fearSel'));
    }
  }
}
// 파티장이 고른 테마·공포도·챕터를 파티원에게 알린다
function sendPick() {
  const p = S.party; if (!p || p.leader !== S.me) return;
  socket.emit('party:pick', { n: p.members.length, scenario: $('#scenarioSel').value, fear: Number($('#fearSel').value), chapter: Number($('#chapterSel').value || 0) });
}
$('#nudgeBtn').onclick = () => socket.emit('party:nudge');
$('#startBtn').onclick = () => { audio.init(); store.set('gwimun-fear', Number($('#fearSel').value)); store.set('gwimun-scenario', $('#scenarioSel').value); socket.emit('party:start', { scenario: $('#scenarioSel').value, chapter: Number($('#chapterSel').value || 0), fear: Number($('#fearSel').value) }); };
$('#scenarioSel').onchange = () => { store.set('gwimun-scenario', $('#scenarioSel').value); $('#chapterSel').value = ''; renderParty(); sendPick(); };
// 공포도 선택창: 공포도에 따라 색이 달라진다 (0 초록 · 1 하늘 · 2 주황 · 3 빨강)
function tintFear(sel) { if (sel) sel.dataset.fear = sel.value; }
$('#fearSel').addEventListener('change', () => { tintFear($('#fearSel')); sendPick(); });
$('#rankBtn').onclick = () => openRank();

// ─────────────────────────── 로비 놀이공원: 앉기 · 올라가기 · 놀이기구 타기
function mountPos() {
  const m = S.mount; if (!m) return null;
  if (m.kind === 'ride') return S.world?.rides?.[m.ride]?.pos(m.seat) || null;
  return m.seat;
}
function dismount(releaseSeat = true) {
  const m = S.mount; if (!m) return;
  if (releaseSeat && socket.connected) socket.emit('lobby:seat', '');
  S.mount = null; S.em = ''; me.y = 0; me.ry = wrapAng(me.ry); S.moveTarget = null;
  if (m.kind === 'ride') {
    const it = S.world?.interactives?.find((i) => i.id === m.ride);
    const ex = S.world?.rides?.[m.ride]?.exit;
    if (ex) { me.x = ex.x; me.z = ex.z; }
    else if (it) { const a = Math.atan2(me.x - it.x, me.z - it.z); const d = m.ride === 'carousel' ? 3.9 : 0; me.x = it.x + Math.sin(a) * d; me.z = m.ride === 'wheel' ? it.z + 0.6 : it.z + Math.cos(a) * d; if (m.ride === 'wheel') me.x = it.x; }
  } else { const k = m.seat?.back ? -0.75 : 0.7; me.x += Math.sin(me.ry) * k; me.z += Math.cos(me.ry) * k; } // 테이블을 보고 앉는 자리는 뒤로 일어난다
  [me.x, me.z] = collide(me.x, me.z);
  if (S.wasRiding && S.profile?.equip?.mount) { S.riding = true; updateGearButtons(); } S.wasRiding = false;
}
let requestingSeat = false;
async function claimLobbySeat(id, candidates) {
  if (requestingSeat || !candidates.length || !socket.connected) return null;
  const world = S.world;
  requestingSeat = true;
  try {
    const chosen = await socket.timeout(3000).emitWithAck('lobby:seat', candidates.map(index => id + ':' + index));
    if (S.room !== 'lobby' || S.world !== world) {
      if (chosen && socket.connected) socket.emit('lobby:seat', '');
      return null;
    }
    return typeof chosen === 'string' ? Number(chosen.split(':')[1]) : null;
  } catch {
    if (socket.connected) socket.emit('lobby:seat', '');
    return null;
  } finally {
    requestingSeat = false;
  }
}
async function lobbyAct(id) {
  if (requestingSeat) return;
  if (S.mount) { dismount(); toast('내렸어요.'); return; }
  if (id === 'shop') { setTimeout(openShop, 160); return; }
  if (id === 'mailbox') { setTimeout(openFeedback, 160); return; }
  if (id === 'wishstar') { setTimeout(openWish, 160); return; }
  if (id === 'vote') { setTimeout(openVote, 160); return; }
  if (id === 'xmasgift') { if (!xmasGiftLeft()) return; if (S.xmasBusy) return; S.xmasBusy = true; audio.play('click'); socket.emit('xmas:claim'); setTimeout(() => { S.xmasBusy = false; }, 3000); return; }
  if (S.perch && id === 'off') { S.perch = null; me.y = 0; [me.x, me.z] = collide(me.x + Math.sin(me.ry) * 1.2, me.z + Math.cos(me.ry) * 1.2); return; }
  const it = S.world?.interactives?.find((i) => i.id === id); if (!it) return;
  audio.play('click');
  if (it.kind === 'ride') {
    const r = S.world.rides[it.id], candidates = [];
    if (r.pick) {
      const considered = new Set();
      for (let i = 0; i < r.seats; i++) {
        const index = r.pick(considered);
        if (index < 0) break;
        candidates.push(index); considered.add(index);
      }
    } else {
      const distance = (index) => { const p = r.pos(index); return Math.hypot(p.x - me.x, p.z - me.z); };
      candidates.push(...Array.from({ length: r.seats }, (_, index) => index).sort((a, b) => distance(a) - distance(b)));
    }
    const seat = await claimLobbySeat(it.id, candidates);
    if (seat == null) { if (S.room === 'lobby') toast(`${it.label} 빈자리를 확보하지 못했어요.`); return; }
    if (S.riding) { S.riding = false; S.wasRiding = true; }
    S.mount = { kind: 'ride', ride: it.id, seat }; S.perch = null; S.crouch = false;
    if (r.sit) { S.em = 'sit'; S.emT = 0; S.eid++; }
    toast(it.id === 'coaster' ? `🎢 롤러코스터 ${Math.floor(seat / 2) + 1}번째 칸에 탔어요! (움직이거나 다시 누르면 탑승장에서 내려요)` : `${it.label}에 탔어요! (움직이거나 다시 누르면 내려요)`);
  } else if (it.kind === 'sit') {
    const seats = it.seats || [it.seat];
    const distance = (index) => Math.hypot(seats[index].x - me.x, seats[index].z - me.z);
    const candidates = seats.map((_, index) => index).sort((a, b) => distance(a) - distance(b));
    const index = await claimLobbySeat(it.id, candidates);
    if (index == null) { if (S.room === 'lobby') toast(`${it.label} 빈자리를 확보하지 못했어요.`); return; }
    if (S.riding) { S.riding = false; S.wasRiding = true; }
    S.mount = { kind: 'sit', seat: { ...seats[index] } }; S.perch = null; S.em = 'sit'; S.emT = 0; S.eid++;
  } else if (it.kind === 'snack') {
    const kind = { coffee: 'c', hotdog: 'h', cottoncandy: 's', balloon: 'b' }[it.id] || 'p';
    if (S.snack === kind + '3' && kind !== 'b') { toast(`${SNACK_INFO[kind].name}을 이미 들고 있어요.`); return; }
    socket.emit('snack:take', kind);
  } else if (it.kind === 'climb') {
    S.perch = it.perch; me.x = it.perch.x; me.z = it.perch.z; me.y = it.perch.y; S.mount = null;
    toast(`${it.label} 위에 올라갔어요! (가장자리로 걸어가면 내려와요)`);
  }
}
// 🍿 ☕ 🌭 🍭 간식 이름 · 다 먹었을 때 한마디
const SNACK_INFO = {
  p: { icon: '🍿', name: '팝콘', ga: '을', got: '팝콘을 받았어요!', done: '🍿 팝콘을 다 먹었어요. 냠냠!' },
  c: { icon: '☕', name: '커피', ga: '를', got: 'STARMIA 커피를 받았어요!', done: '☕ 커피를 다 마셨어요. 호로록~ 맛있다!' },
  h: { icon: '🌭', name: '핫도그', ga: '를', got: '바삭 핫도그를 받았어요!', done: '🌭 핫도그를 다 먹었어요. 바삭바삭 든든해!' },
  s: { icon: '🍭', name: '솜사탕', ga: '을', got: '구름 솜사탕을 받았어요!', done: '🍭 솜사탕을 다 먹었어요. 입안에서 사르르~' },
};
// 🎁 크리스마스 선물상자: 아직 안 받았으면 보인다 (받으면 내 화면에서만 사라진다)
const xmasGiftLeft = () => !S.xmasGot && !S.profile?.items?.costume_xmas;
socket.on('xmas:done', ({ already } = {}) => {
  S.xmasGot = true; S.xmasBusy = false;
  const gb = S.world?.xmasGift;
  if (gb && gb.group.visible) { giftPuffFx(gb.x, gb.y, gb.z); gb.hide(); }
  if (already) { toast('🎄 크리스마스 선물은 이미 받았어요! 🎒 내 물건에서 입고 벗을 수 있어요.'); return; }
  audio.play('pop'); audio.play('pickup'); for (let i = 0; i < 6; i++) setTimeout(() => audio.play('twinkle'), 200 + i * 140);
  if (S.riding) { S.riding = false; updateGearButtons(); }
  const pop = el('div', 'xmas-pop'); pop.innerHTML = '<div class="xp-i">🎄</div><div class="xp-t">크리스마스 선물입니다</div><div class="xp-s">트리 코스튬을 입었어요! 🎒 내 물건에서 벗을 수 있어요</div>';
  document.body.appendChild(pop); setTimeout(() => pop.classList.add('out'), 2600); setTimeout(() => pop.remove(), 3400);
});
function lobbyNearest() {
  S.nearest = null; S.nearestVerb = null;
  const p = $('#prompt');
  let nearbyPlayer = null, nearestDistance = 2.4;
  if (S.snack && !S.eatBusy) {
    for (const player of S.others.values()) {
      if (!player.visible || Math.abs(player.position.y - (me.y || 0)) > 1.5) continue;
      const distance = Math.hypot(player.position.x - me.x, player.position.z - me.z);
      if (distance < nearestDistance) { nearbyPlayer = player; nearestDistance = distance; }
    }
  }
  if (nearbyPlayer) {
    S.nearest = 'snack-give:' + nearbyPlayer.userData.id;
    S.nearestVerb = '양보하기';
    S.nearestLabel = nearbyPlayer.userData.name;
  } else if (S.mount) { S.nearest = 'L:off'; S.nearestVerb = '내리기'; }
  else if (S.perch) { S.nearest = 'L:off'; S.nearestVerb = '내려가기'; }
  else {
    let best = 1e9;
    for (const it of S.world?.interactives || []) { if (it.id === 'xmasgift' && !xmasGiftLeft()) continue; const d = Math.hypot(it.x - me.x, it.z - me.z) - (it.id === 'xmasgift' ? 3 : 0); if (d < it.r && d < best) { best = d; S.nearest = 'L:' + it.id; S.nearestVerb = it.verb; S.nearestLabel = it.label; } }
  }
  if (S.nearest && !S.modalOpen) {
    if (nearbyPlayer) {
      const label = `${S.nearestLabel} 님에게 양보하기`;
      if (p.textContent !== 'E' + label) p.replaceChildren(el('kbd', '', 'E'), document.createTextNode(label));
    }
    else p.innerHTML = `<kbd>E</kbd>${S.nearest === 'L:off' ? '' : (S.nearestLabel || '') + ' '}${S.nearestVerb}`;
    p.classList.remove('hidden');
  }
  else p.classList.add('hidden');
}

// ─────────────────────────── 테마 관문 클릭 → 가운데 팝업 (배경 어둡게, 바깥 누르면 닫힘)
function pickTheme(cx, cy) {
  const ex = S.world?.exhibits; if (!ex) return null;
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  for (const h of ray.intersectObjects(ex.map((e) => e.group), true)) { const e = ex.find((x) => { let o = h.object; while (o) { if (o === x.group) return true; o = o.parent; } return false; }); if (e) return e.id; }
  return null;
}
// 로비에서 직접 누를 수 있는 물건 (우편함 등)
function pickClickable(cx, cy) {
  const list = S.world?.clickables; if (!list?.length) return null;
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  for (const c of list) if (ray.intersectObject(c.group, true).length) return c.id;
  return null;
}
const themePop = el('div', 'tpop hidden'); themePop.id = 'themePop';
document.body.appendChild(themePop);
themePop.addEventListener('pointerdown', (e) => { if (e.target === themePop) closeThemePop(); });
function closeThemePop() { themePop.classList.add('hidden'); themePop.innerHTML = ''; S.modalOpen = false; }
function openThemePop(id) {
  const info = THEME_INFO[id]; if (!info) return;
  const p = S.party; const member = !!p && p.leader !== S.me;
  const ssel = $('#scenarioSel');
  if (!member) { if (ssel.value !== id && [...ssel.options].some((o) => o.value === id)) { ssel.value = id; ssel.onchange(); } }
  themePop.innerHTML = '';
  const card = el('div', 'tpop-card'); card.style.setProperty('--tc', info.color);
  const x = el('button', 'tpop-x', '✕'); x.onclick = closeThemePop; x.title = '닫기';
  const sc = (S.scenarios || []).find((s) => s.id === id);
  card.append(x, el('div', 'tpop-title', info.title), el('div', 'tpop-tag', info.tag), el('div', 'tpop-diff', diffText(diffOf(id))), el('div', 'tpop-story', info.story));
  const rows = el('div', 'tpop-rows');
  const fear = el('select'); fear.innerHTML = $('#fearSel').innerHTML; fear.value = member && p.pick ? String(p.pick.fear) : $('#fearSel').value;
  const chap = el('select'); chap.innerHTML = $('#chapterSel').innerHTML; chap.value = $('#chapterSel').value;
  if (member) { fear.disabled = chap.disabled = true; }
  fear.classList.add('fear-sel'); tintFear(fear);
  fear.onchange = () => { $('#fearSel').value = fear.value; tintFear(fear); tintFear($('#fearSel')); sendPick(); };
  chap.onchange = () => { $('#chapterSel').value = chap.value; sendPick(); };
  rows.append(el('label', null, '공포도'), fear, el('label', null, '챕터'), chap);
  card.appendChild(rows);
  const btns = el('div', 'tpop-btns');
  if (member) {
    const wait = el('button', 'btn', '⏳ 파티장이 시작하면 함께 입장'); wait.disabled = true;
    const nudge = el('button', 'btn primary', '🔔 시작 요청'); nudge.onclick = () => socket.emit('party:nudge');
    btns.append(wait, nudge);
    if (p.pick && p.pick.scenario !== id) card.appendChild(el('div', 'tpop-note', '파티장이 다른 테마를 고르고 있어요.'));
  } else {
    const cancel = el('button', 'btn', '닫기'); cancel.onclick = closeThemePop;
    const go = el('button', 'btn primary tpop-go', p && p.members.length > 1 ? `▶ ${sc?.short || ''} 시작` : `▶ 바로 시작`);
    go.onclick = () => { $('#fearSel').value = fear.value; $('#chapterSel').value = chap.value; closeThemePop(); $('#startBtn').onclick(); };
    btns.append(cancel, go);
    card.appendChild(el('div', 'tpop-note', '친구와 하려면 오른쪽 위 👥 파티에서 먼저 초대하세요.'));
  }
  card.appendChild(btns);
  themePop.appendChild(card); themePop.classList.remove('hidden'); S.modalOpen = true; audio.play('click');
}
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !themePop.classList.contains('hidden')) closeThemePop(); });

// ─────────────────────────── 로비 전체 공지 (로비에 있을 때만, 글자로만)
const noticeBox = el('div', 'lobby-notice hidden'); noticeBox.id = 'lobbyNotice'; document.body.appendChild(noticeBox);
let noticeT = null;
socket.on('lobby:notice', ({ text }) => {
  if (S.room !== 'lobby') return;
  noticeBox.textContent = text; noticeBox.classList.remove('hidden'); noticeBox.classList.remove('show'); void noticeBox.offsetWidth; noticeBox.classList.add('show');
  clearTimeout(noticeT); noticeT = setTimeout(() => noticeBox.classList.add('hidden'), 7000);
});

// ─────────────────────────── 랭킹
const FEAR_SHORT = { 0: '왕초보', 1: '순한맛', 2: '보통', 3: '매운맛' };
const fmtMs = (ms) => { const d = Math.round(ms / 100); const m = Math.floor(d / 600), s = (d % 600) / 10; return `${m}분 ${s.toFixed(1).padStart(4, '0')}초`; }; // 0.1초 단위
// 🏆 버튼 하나에 모두 모았다: 주간 · 월간 · 총 랭킹(레벨 기준) + 테마별 클리어 시간 랭킹
function openRank(opt = {}) {
  if (typeof opt === 'string') opt = { main: 'theme', theme: opt };
  // 창은 바로 띄우고, 서버 응답이 오면 채운다 (응답이 없으면 안내)
  const holder = el('div', 'rank'); holder.appendChild(el('div', 'muted', '랭킹을 불러오는 중…'));
  openModal('🏆 랭킹', '', holder);
  let done = false;
  const timer = setTimeout(() => { if (done || $('#modalBody').firstChild !== holder) return; holder.innerHTML = ''; holder.appendChild(el('div', 'muted', '랭킹을 불러오지 못했어요. 잠시 후 다시 눌러 주세요. (계속 안 되면 서버를 다시 켜 주세요)')); }, 5000);
  socket.emit('rank:all', (data) => {
    done = true; clearTimeout(timer);
    if ($('#modal').classList.contains('hidden') || $('#modalBody').firstChild !== holder) return; // 그새 닫았거나 다른 창을 열었다
    const wrap = holder; wrap.innerHTML = '';
    const mains = el('div', 'rank-main'); const sub = el('div', 'rank-sub'); const tabs = el('div', 'rank-tabs'); const list = el('div', 'rank-list'); const mine = el('div', 'rank-mine');
    const scs = S.scenarios || []; // 히든 테마도 랭킹은 누구나 볼 수 있다 (버튼 색만 다름)
    let main = opt.main || S.rankMain || 'week';
    let cur = opt.theme || S.rankTheme || scs[0]?.id;
    S.rankTab = () => ({ main, theme: cur });
    const md = (k) => `${Number(k.slice(5, 7))}월 ${Number(k.slice(8, 10))}일`;
    const SUB = {
      week: () => `이번 주(${md(data.week)} 월요일부터)에 얻은 경험치 순위예요. 월요일 0시(한국 시간)에 마감하며, 1~3위는 아직 없는 황금 고양이 부위 1개를 무작위로 받아요.`,
      month: () => `이번 달(${Number(data.month.slice(5, 7))}월)에 얻은 경험치 순위예요. 매달 1일에 새로 시작해요.`,
      total: () => '지금까지 쌓은 레벨 순위예요. (같은 레벨이면 경험치가 많은 순)',
      theme: () => '테마를 1장부터 끝까지 클리어한 시간 순위예요. (테마마다 상위 10팀)',
    };
    const drawLevel = () => {
      const b = data.level?.[main] || { rows: [] };
      if (!b.rows.length) list.appendChild(el('div', 'muted', main === 'total' ? '아직 기록이 없어요.' : '아직 이번 기간에 경험치를 얻은 사람이 없어요. 챕터를 넘기거나 테마를 클리어하면 첫 번째 주인공이 됩니다!'));
      b.rows.forEach((r, i) => {
        const row = el('div', 'rank-row lv' + (r.name === S.myName ? ' me' : ''));
        row.append(el('span', 'rank-no', ['🥇', '🥈', '🥉'][i] || String(i + 1)), el('span', 'rank-names', r.name), el('span', 'rank-time', `Lv.${r.lv}`),
          el('span', 'rank-meta', main === 'total' ? `누적 ${r.xp.toLocaleString()} XP` : `${main === 'week' ? '이번 주' : '이번 달'} +${r.gain.toLocaleString()} XP`));
        list.appendChild(row);
      });
      if (S.admin) return;
      const m = b.me;
      mine.textContent = m ? `내 순위 ${m.no}위 / ${b.total}명 · Lv.${m.lv} · ${main === 'total' ? `누적 ${m.xp.toLocaleString()} XP` : `+${m.gain.toLocaleString()} XP`}` : main === 'total' ? '아직 경험치가 없어요. 챕터를 넘기면 +40 XP, 테마를 클리어하면 더 많이 받아요!' : '이번 기간에는 아직 순위에 없어요. 챕터를 넘기면 +40 XP!';
    };
    const drawTheme = () => {
      const rows = data.themes?.[cur] || [];
      if (!rows.length) { list.appendChild(el('div', 'muted', '아직 기록이 없어요. 처음부터 클리어하면 첫 기록이 됩니다!')); return; }
      rows.forEach((r, i) => {
        const row = el('div', 'rank-row' + (r.names.includes(S.myName) ? ' me' : ''));
        row.append(el('span', 'rank-no', ['🥇', '🥈', '🥉'][i] || String(i + 1)), el('span', 'rank-names', r.names.join(', ')), el('span', 'rank-time', fmtMs(r.ms)), el('span', 'rank-meta', `${FEAR_SHORT[r.fear] ?? ''} · 💡${r.hints ?? '-'}`));
        if (r.ending === 'true') { const tb = el('span', 'rank-true', '🏅 진'); tb.title = '진엔딩으로 클리어'; row.querySelector('.rank-names').append(' ', tb); }
        if (S.admin) { const del = el('button', 'btn tiny danger', '🗑️'); del.title = '이 기록 지우기 (아래 기록이 한 칸씩 올라가요)'; del.onclick = () => askConfirm('랭킹 기록 지우기', `${i + 1}위 '${r.names.join(', ')}' (${fmtMs(r.ms)}) 기록을 지울까요?\n지우면 아래 기록이 한 칸씩 올라갑니다.`, '지우기', () => { socket.emit('admin:rankDel', { sc: cur, at: r.at, ms: r.ms }); }); row.appendChild(del); }
        list.appendChild(row);
      });
    };
    const draw = () => {
      S.rankMain = main; S.rankTheme = cur;
      mains.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === main));
      tabs.classList.toggle('hidden', main !== 'theme');
      tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === cur));
      sub.textContent = SUB[main](); list.innerHTML = ''; mine.textContent = '';
      if (main === 'theme') drawTheme(); else drawLevel();
      mine.classList.toggle('hidden', !mine.textContent);
    };
    [['week', '📅 주간 랭킹'], ['month', '🗓️ 월간 랭킹'], ['total', '👑 총 랭킹'], ['theme', '🚪 테마 랭킹']].forEach(([id, label]) => { const b = el('button', 'btn small', label); b.dataset.id = id; b.onclick = () => { main = id; draw(); }; mains.appendChild(b); });
    scs.forEach((x) => { const b = el('button', 'btn tiny' + (x.hidden ? ' hid' : ''), x.hidden ? '🧟 ' + x.short : x.short); b.dataset.id = x.id; b.onclick = () => { cur = x.id; draw(); }; tabs.appendChild(b); });
    wrap.append(mains, sub, tabs, list, mine);
    try { draw(); } catch (e) { list.innerHTML = ''; list.appendChild(el('div', 'muted', '랭킹을 표시하지 못했어요.')); console.error(e); }
  });
}
 $('#chapterSel').addEventListener('change', sendPick);
$('#fearSel').value = String(store.get('gwimun-fear', 2)); tintFear($('#fearSel'));
$('#leaveBtn').onclick = () => socket.emit('party:leave');
$('#quitBtn').onclick = () => { S.mobileClose?.(); askConfirm('로비로 돌아가기', '정말 로비로 돌아갈까요? 도달한 챕터는 이어하기로 저장됩니다.', '로비로 돌아가기', () => socket.emit('party:quit')); };
function renderRoster() {
  const box = $('#roster'); box.innerHTML = '';
  const others = S.roster.filter((r) => r.id !== S.me);
  $('#rosterCount').textContent = `${S.roster.length}명`;
  const oc = $('#onlineChip'); if (oc) oc.textContent = `🟢 접속자 ${S.roster.length}명`;
  if (!others.length) box.appendChild(el('div', 'muted', '다른 접속자가 없습니다. 친구에게 주소를 알려주세요!'));
  const canInvite = !S.party || (S.party.leader === S.me && S.party.members.length < 4 && !S.party.instId);
  for (const r of others) {
    const d = el('div', 'rp');
    d.appendChild(el('span', r.admin ? 'admin-name' : null, (r.admin ? '🛡️ ' : '') + r.name));
    if (r.hearts) d.appendChild(el('span', 'tag', `💖${r.hearts}`));
    if (r.inGame) d.appendChild(el('span', 'tag', '· 방탈출 중'));
    else if (r.partyId) d.appendChild(el('span', 'tag', r.partyId === S.party?.id ? '· 우리 파티' : '· 파티 있음'));
    const hb = el('button', 'btn tiny', '💖'); hb.title = '하트 보내기'; hb.onclick = () => socket.emit('heart', r.id); d.appendChild(hb);
    if (canInvite && !r.partyId && !r.inGame) { const b = el('button', 'btn tiny', '초대'); b.style.marginLeft = '4px'; b.onclick = () => socket.emit('party:invite', r.id); d.appendChild(b); }
    box.appendChild(d);
  }
}
// PC: 접속자 목록이 아래 미니맵과 겹치지 않게 남은 높이만큼만 보여 준다 (넘치면 목록 안에서 스크롤)
function fitRoster() {
  const list = $('#roster'); if (!list || document.body.classList.contains('mobile')) { if (list) list.style.maxHeight = ''; return; }
  const top = list.getBoundingClientRect().top;
  let limit = innerHeight - 70; // 아래쪽 미니맵 · 타이머 바로 위까지만
  for (const sel of ['#minimap', '#gameTimer']) { const e = $(sel); if (e && !e.classList.contains('hidden') && e.offsetWidth) limit = Math.min(limit, e.getBoundingClientRect().top - 22); }
  list.style.maxHeight = Math.max(70, Math.min(200, Math.floor(limit - top))) + 'px';
}
setInterval(fitRoster, 400); addEventListener('resize', fitRoster);
$('#rosterToggle').onclick = () => { const r = $('#roster'); r.classList.toggle('hidden'); $('#rosterToggle').textContent = r.classList.contains('hidden') ? '펼치기' : '접기'; };
function openPlayerMenu(id, name, x, y) {
  const m = $('#playerMenu'); m.innerHTML = '';
  m.appendChild(el('div', 'nm', name));
  const r = S.roster.find((q) => q.id === id);
  const canInvite = (!S.party || (S.party.leader === S.me && S.party.members.length < 4 && !S.party.instId)) && r && !r.partyId;
  if (canInvite) { const b = el('button', 'btn small', '🎟️ 파티 초대'); b.onclick = () => { socket.emit('party:invite', id); m.classList.add('hidden'); }; m.appendChild(b); }
  else m.appendChild(el('div', 'muted', r?.partyId && r.partyId === S.party?.id ? '같은 파티원' : '초대할 수 없음'));
  const h = el('button', 'btn small', '💖 하트 보내기'); h.onclick = () => { socket.emit('heart', id); m.classList.add('hidden'); }; m.appendChild(h);
  const gf = el('button', 'btn small', '🎁 선물하기'); gf.onclick = () => { m.classList.add('hidden'); openGift(id, name); }; m.appendChild(gf);
  if (!S.themeComms) {
    const w = el('button', 'btn small', '👋 인사하기'); w.onclick = () => { socket.emit('chat', { channel: 'all', text: `${name} 님 안녕하세요! 👋` }); m.classList.add('hidden'); }; m.appendChild(w);
  }
  m.style.left = Math.min(x, innerWidth - 160) + 'px'; m.style.top = Math.min(y, innerHeight - 170) + 'px';
  m.classList.remove('hidden');
}

// ─────────────────────────── 음성
const voice = new Voice(socket, {
  onLevel: (id, lv) => { S.vlv.set(id, lv); const m = document.querySelector(`.mic[data-id="${id}"]`); if (m) m.classList.toggle('speak', lv > 0.06); },
  onError: (msg) => toast('🎙️ ' + msg),
  onChange: () => renderVoiceUI(), // 마이크가 스스로 꺼졌을 때(끊겨서 다시 열지 못함) 버튼 모양을 맞춘다
});
// 듣기 범위: 테마는 파티원만, 광장에서는 전체 듣기를 선택할 수 있다
S.voiceMode = store.get('gwimun-voice', 'party');
function updateVoiceTargets() {
  const ids = new Set((S.party?.members || []).map((m) => m.id));
  if (effectiveVoiceMode() === 'all') {
    (S.roster || []).filter((r) => r.room === 'lobby' && r.id !== S.me).slice(0, 10).forEach((r) => ids.add(r.id));
  }
  voice.setTargets([...ids]);
}
function effectiveVoiceMode() { return S.themeComms ? 'party' : S.voiceMode; }
function setVoiceMode(m) { if (S.themeComms) return; S.voiceMode = m; store.set('gwimun-voice', m); updateVoiceTargets(); renderVoiceUI(); toast(m === 'all' ? '🔊 이제 같은 곳에 있는 모두의 목소리가 들려요' : '🔊 이제 파티원 목소리만 들려요'); }
function renderVoiceUI() {
  const on = voice.micOn;
  $('#micBtn').textContent = on ? '🎙️ 마이크 켜짐' : '🎙️ 마이크 꺼짐'; $('#micBtn').classList.toggle('primary', on);
  const mode = effectiveVoiceMode();
  const vm = $('#voiceModeBtn'); if (vm) { vm.classList.toggle('hidden', S.themeComms); vm.textContent = mode === 'all' ? '🔊 듣기: 전체' : '🔊 듣기: 파티'; vm.classList.toggle('v-all', mode === 'all'); vm.classList.toggle('v-party', mode !== 'all'); }
  $('#micBtn').classList.toggle('v-all', on && mode === 'all'); $('#micBtn').classList.toggle('v-party', on && mode !== 'all');
  const mb = document.querySelector('.abtn.mic'); if (mb) { mb.classList.toggle('on', on); mb.title = mode === 'all' ? '마이크 · 듣기: 전체' : '마이크 · 듣기: 파티'; }
  const vp = $('#voicePanel');
  if (vp) {
    vp.querySelector('.vp-mic').textContent = on ? '🎙️ 마이크 끄기' : '🎙️ 마이크 켜기';
    vp.querySelector('.vp-mic').classList.toggle('primary', on);
    vp.querySelector('.vp-modes').classList.toggle('hidden', S.themeComms);
    vp.querySelectorAll('.vp-mode').forEach((b) => b.classList.toggle('primary', b.dataset.m === mode));
    vp.querySelector('.vp-tip').textContent = S.themeComms ? '테마 안에서는 파티원끼리 대화할 수 있어요.' : '전체: 광장에 있는 모두와 대화 · 파티: 파티원끼리만';
  }
}
async function toggleMicUI() {
  if (effectiveVoiceMode() === 'party' && (!S.party || S.party.members.length < 2)) toast(S.themeComms ? '테마 안에서는 파티원끼리 대화할 수 있어요.' : '광장의 모두와 말하려면 듣기를 "전체"로 바꾸세요.');
  await voice.toggleMic();
  renderVoiceUI();
}
$('#micBtn').onclick = toggleMicUI;
$('#voiceModeBtn').onclick = () => setVoiceMode(S.voiceMode === 'all' ? 'party' : 'all');

// ─────────────────────────── 설정
function saveSettings() {
  store.set('gwimun-settings', SET);
  audio.setVolume(SET.volume); voice.setVolume(SET.voice);
  fx.brightness = SET.brightness;
}
audio.setVolume(SET.volume); voice.setVolume(SET.voice);
$('#settingsBtn').onclick = () => {
  const wrap = el('div');
  const row = (label, input) => { const r = el('div', 'set-row'); r.append(el('span', null, label), input); wrap.appendChild(r); };
  const range = (key, min, max, step) => { const i = el('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = SET[key]; i.oninput = () => { SET[key] = Number(i.value); saveSettings(); }; return i; };
  row('효과음 볼륨', range('volume', 0, 1, 0.05));
  row('음성채팅 볼륨', range('voice', 0, 1, 0.05));
  row('마우스 감도', range('sens', 0.3, 2.5, 0.05));
  row('밝기', range('brightness', 0.6, 1.8, 0.05));
  const q = el('select'); [['high', '높음 (가장 선명)'], ['medium', '보통 (선명 · 가벼움)']].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; q.appendChild(o); });
  q.value = SET.quality; q.onchange = () => { SET.quality = q.value; fx.setQuality(SET.quality); graphics.setQuality(SET.quality); saveSettings(); rebuildMyAvatar(); };
  row('그래픽 품질', q);
  if (!S.admin && S.myName) row('내 고정 계정', el('b', 'set-acct', `🔒 ${S.myName}`));
  const btns = el('div', 'set-btns');
  const sb = (label, fn) => { const b = el('button', 'btn', label); b.onclick = fn; btns.appendChild(b); return b; };
  sb(SET.minimap ? '🗺 지도 끄기' : '🗺 지도 보기', () => { SET.minimap = !SET.minimap; saveSettings(); closeModal(); toast(SET.minimap ? '지도를 켰어요' : '지도를 껐어요'); });
  sb('👗 옷 갈아입기', () => { closeModal(); $('#lookBtn').click(); });
  sb('❔ 도움말', () => { closeModal(); $('#helpBtn').click(); });
  sb('🧟 히든 「데드 시티」 미리보기 영상 ▶', () => { closeModal(); playHiddenPreview(); }).classList.add('wide');
  sb('🎫 클리어 도장표', () => { closeModal(); openStamps(); });
  sb('📮 고객소리함', () => { closeModal(); openFeedback(); });
  sb('🖼 갤러리 (모두가 찍은 사진)', () => { closeModal(); openGallery(); }).classList.add('wide');
  wrap.appendChild(btns);
  // 만든이 · 링크 · 후원
  const cr = el('div', 'credits');
  cr.innerHTML = `<div class="cr-row"><span>만든이</span><b>nexsixflux</b></div>
    <a class="cr-link" href="https://social.wanted.co.kr//community/profile/ZhZ6VwFkcMvwbQBAER6qEf?utm_source=wanted&utm_medium=share" target="_blank" rel="noopener">🔗 만든이 프로필 보러 가기 <span>›</span></a>
    <div class="cr-coffee"><b>💗 감사한 마음 전하기</b><small>휴대폰 카메라나 카카오톡으로 QR을 찍어 주세요</small><img src="/kakaopay.png" alt="카카오톡 후원 QR" loading="lazy" /><a class="cr-pay" href="https://qr.kakaopay.com/281006011187850590005070" target="_blank" rel="noopener">💗 감사한 마음 전하기</a></div>`;
  wrap.appendChild(cr);
  openModal('⚙ 설정', '변경 사항은 자동으로 저장됩니다.', wrap);
};

// 제작자 후원 팝업 (오른쪽 💗 버튼)
const KAKAOPAY_URL = 'https://qr.kakaopay.com/281006011187850590005070';
const openKakaoPay = () => { const w = window.open(KAKAOPAY_URL, '_blank', 'noopener'); if (!w) location.href = KAKAOPAY_URL; };
$('#coffeeBtn').onclick = () => {
  const w = el('div', 'coffee-pop');
  if (isMobileView()) { // 폰: 큰 버튼 하나 + 모달 기본 '닫기'
    w.innerHTML = `<p class="coffee-msg">보내주신 마음은 게임을 만드는 큰 힘이 됩니다</p>`;
    const go = el('button', 'btn primary coffee-go', '💗감사한 마음 전하기'); go.onclick = () => { closeModal(); openKakaoPay(); };
    w.appendChild(go);
  } else w.innerHTML = `<img src="/kakaopay.png" alt="카카오톡 후원 QR" /><p class="coffee-msg">보내주신 마음은 게임을 만드는 큰 힘이 됩니다</p><small>휴대폰 카메라나 카카오톡으로 QR을 찍어 주세요</small>`;
  openModal('💗 감사한 마음 전하기', '', w);
};

// ─────────────────────────── 기타
function toast(text) {
  const t = el('div', 'toast', text); $('#toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = 0; setTimeout(() => t.remove(), 500); }, 3800);
  while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove();
}
$('#helpBtn').onclick = () => {
  if (document.body.classList.contains('mobile')) {
    const k = el('div', 'keys');
    [['왼쪽 아래 조이스틱', '드래그해서 이동'], ['화면 드래그', '시점 회전'], ['두 손가락 벌리기·오므리기', '확대 / 축소'],
     ['✋ 버튼 (조사·줍기·타기…)', '가까운 물건과 상호작용 — 물건에 가까이 가면 나타나요'], ['🔦 버튼', '손전등 켜기/끄기 — 켜면 귀신이 멀리서도 알아채요'],
     ['🏃 버튼', '달리기 켜기/끄기 (발소리가 커져요)'], ['🤫 버튼', '조심조심 걷기 켜기/끄기 — 아주 느리지만 귀신이 절대 눈치채지 못해요'], ['📢 외치기', '"어이!" "여기야!" 하고 외쳐 내 위치를 바닥 파형과 지도로 알려요'], ['⤴ 버튼', '점프'],
     ['아래 아이템 칸', '누르면 사용 · 길게 누르면 메뉴(조합·건네기)'], ['오른쪽 위 👥', '파티 · 게임 시작'], ['🏆', '클리어 랭킹'], ['💬', '채팅'], ['😀', '감정표현'], ['⚙', '설정 · 지도 보기/끄기 · 옷 갈아입기 · 도움말'], ['💡 힌트 · 📓 수첩', '왼쪽 위 목표 칸']]
      .forEach(([a, b]) => k.append(el('kbd', null, a), el('span', null, b)));
    const tip = el('p', 'muted', '귀신 공략: 손전등을 끄면 아주 가까이 오기 전까지는 들키지 않아요. 대신 앞이 잘 안 보여요. 하얀 여자와 붉은 기모노의 여인은 손전등을 비추는 동안 움직이지 못합니다. 협동 장치는 두 사람이 8초 안에 함께 눌러야 하고, 혼자일 땐 한쪽만 눌러도 돼요. 로비의 테마 관문을 누르면 바로 시작할 수 있어요.');
    const w = el('div'); w.append(k, tip);
    openModal('조작법 (모바일)', '', w);
    return;
  }
  const k = el('div', 'keys');
  [['W A S D / 방향키', '이동'], ['Shift', '달리기 (발소리 때문에 귀신이 멀리서도 알아챈다)'], ['C (누르고 있기)', '웅크리기 — 그 자리에서 방향만 돌리며 귀신에게 덜 들킨다. 떼면 일어선다'], ['V (누르고 있기)', '조심조심 걷기 — 아주 느리지만 귀신이 절대 눈치채지 못한다'], ['마우스 드래그 · 휠', '시점 회전 · 확대/축소'], ['R', '카메라를 캐릭터 뒤로'], ['클릭 / E', '조사 · 줍기 · 풀기 (멀리 있으면 자동으로 다가감)'], ['Space', '점프'], ['X', '감정표현 (춤·인사·엎드리기·놀래키기 등)'], ['F', '손전등 켜기/끄기'], ['T', '부적 태우기 (귀신 20초 퇴치)'], ['1 ~ 9', '아이템 바로 사용 (자물쇠 창에서는 버튼 입력)'], ['아이템 우클릭', '조합 · 파티원에게 건네기'], ['J', '수첩 — 본 단서가 자동 기록됨'], ['H', '힌트'], ['G / 휠 클릭', '마우스 위치를 파티원에게 찍어 주기'], ['Q', '외치기 — "어이!" "여기야!" 하며 내 위치를 바닥 파형과 지도로 알리기'], ['N', '들고 있는 간식 먹기·마시기 (로비의 🍿 팝콘 · ☕ STARMIA · 🌭 핫도그 · 🍭 솜사탕 가게에서 E 로 받기 · 3번이면 끝)'], ['M', '미니맵 켜기/끄기'], ['💖 (접속자 목록·캐릭터 클릭)', '친구에게 하트 보내기'], ['Enter · Tab', '채팅 · 전체/파티 전환']].forEach(([a, b]) => { k.append(el('kbd', null, a), el('span', null, b)); });
  const tip = el('p', 'muted', '귀신 공략: 소사는 소리에 민감하고, 하얀 여자는 손전등을 비추는 동안 움직이지 못합니다. 이장과 무당은 등 뒤로 나타납니다. 협동 장치는 서로 다른 두 사람이 8초 안에 눌러야 하며, 혼자일 땐 한쪽만 눌러도 됩니다.');
  const w = el('div'); w.append(k, tip);
  openModal('조작법', '', w);
};


// ─────────────────────────── 공포도
const FEAR_NAME = { 0: '왕초보 · 귀신 없음', 1: '순한맛', 2: '보통', 3: '매운맛' };
function updateFearBadge() { const d = S.scenario?.difficulty || 3; $('#fearBadge').textContent = `공포도 ${'●'.repeat(S.fear)}${'○'.repeat(3 - S.fear)} ${FEAR_NAME[S.fear]} · ${diffText(d)}`; }
// 점프스케어는 공포도에 따라 줄이거나 소리·화면 흔들림으로 대체한다
function scare(type, src) {
  if (S.fear === 0) return; // 왕초보: 점프스케어·화면 흔들림 없음
  S.shake = S.fear === 1 ? 0.25 : 0.6;
  if (S.fear === 1) { audio.play(src === 'caught' ? 'sting' : 'whisper'); flashRed(); return; }
  if (S.fear === 2 && (src === 'wrong' || src === 'random')) { audio.play('sting'); flashRed(); return; }
  jumpscare(pickScare(type, S.scenario?.id), audio);
}
function flashRed() { const v = $('#vignette'); v.classList.add('danger'); setTimeout(() => { if (S.danger < 0.45) v.classList.remove('danger'); }, 700); }

// ─────────────────────────── 감정표현
// ───── 간식 먹기 · 마시기: 손을 입으로 가져가며 소리 → 한 번 먹을 때마다 줄고, 3번 먹으면 사라진다 (앉아서도 먹을 수 있다)
function setLocalSnack(code, reason) {
  const previous = S.snack || '';
  S.snack = code;
  S.eatBusy = false;
  if (myAvatar) myAvatar.userData.eatT = 0;
  updateGearButtons();
  if (reason === 'expired') { audio.play('balloon_fly'); toast('🎈 풍선이 하늘로 날아갔어요~'); }
  else if (reason === 'eaten' && !code) toast(SNACK_INFO[previous[0]]?.done || '냠냠!');
  else if (reason === 'taken') {
    audio.play(code[0] === 'b' ? 'balloon_get' : code[0] === 'c' ? 'coffee_get' : 'popcorn_get');
    toast(code[0] === 'b' ? '🎈 풍선을 받았어요!' : SNACK_INFO[code[0]].got);
  }
}
socket.on('snack:held', ({ code, reason }) => setLocalSnack(code, reason));
socket.on('snack:balloonReleased', id => {
  if (S.room !== 'lobby') return;
  const avatar = id === S.me ? myAvatar : S.others.get(id);
  releaseBalloon(avatar?.userData.gSnack);
});
socket.on('snack:eating', ({ kind }) => {
  if (!myAvatar || !S.snack || S.room !== 'lobby') return;
  S.eatBusy = true;
  myAvatar.userData.eatT = .9;
  const eatId = S.eatId = (S.eatId || 0) + 1;
  setTimeout(() => {
    if (S.eatBusy && S.eatId === eatId) audio.play(kind === 'c' ? 'slurp' : kind === 's' ? 'pop' : 'crunch');
  }, 320);
});
function eatSnack() {
  if (S.room === 'lobby' && S.snack && S.snack[0] !== 'b' && !S.eatBusy) socket.emit('snack:eat');
}
function doEmote(id) {
  if (!myAvatar) return;
  if (id === 'jump' && S.em === 'jump' && S.emT < 0.7) return; // 공중에 떠 있는 동안(발이 땅에 닿기 전)에는 다시 뛸 수 없다
  if (id === 'snow' && (S.em === 'snow' || S.em === 'jump')) return;
  S.em = id; S.emT = 0; S.eid++;
  if (id === 'snow') {
    const eid = S.eid;
    throwSnow(myAvatar, () => S.eid === eid && S.em === 'snow');
  }
  if (id === 'jump') audio.play('pickup');
  if (id === 'boo') { socket.emit('boo'); audio.play('sting'); }
  if (id === 'heart') { burstHearts(myAvatar, 6); }
  if (id === 'fart') doFart(myAvatar, me.x, me.y || 0, me.z, me.ry);
  $('#emotePanel').classList.add('hidden');
}
function throwSnow(avatar, stillThrowing) {
  const world = S.world;
  snowballFx(avatar, released => S.world === world && (released || (avatar.parent && stillThrowing())));
}
function toggleEmotePanel() { $('#emotePanel').classList.toggle('hidden'); }
// 감정표현 창이 열려 있을 때 창 바깥(화면 · 조이스틱 · 다른 버튼)을 누르면 닫는다. 😀 버튼은 원래대로 열고 닫기
document.addEventListener('pointerdown', (e) => {
  const p = $('#emotePanel'); if (!p || p.classList.contains('hidden')) return;
  if (p.contains(e.target) || e.target.closest?.('.abtn.emote')) return;
  p.classList.add('hidden');
}, true);
(function buildEmotes() {
  const p = $('#emotePanel');
  EMOTES.forEach(([id, name, icon], i) => { const b = el('button', 'btn small', `${icon} ${name}`); b.onclick = () => doEmote(id); p.appendChild(b); });
  $('#emoteBtn').onclick = toggleEmotePanel;
})();
socket.on('booed', ({ from }) => {
  toast(`👻 ${from} 님이 놀래켰다!`);
  if (S.fear <= 1) { audio.play('sting'); S.shake = S.fear ? 0.2 : 0; return; }
  audio.play('sting'); S.shake = 0.5; flashRed();
});

// ─────────────────────────── 하트
const heartTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.font = '52px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('💖', 32, 36); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function heartSprite() { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthTest: false, toneMapped: false })); sp.scale.setScalar(0.45); overlay.add(sp); return sp; }
function burstHearts(g, n = 8) {
  for (let i = 0; i < n; i++) { const sp = heartSprite(); const a = Math.random() * Math.PI * 2; S.flyHearts.push({ sp, kind: 'burst', from: g.position.clone().add(new THREE.Vector3(0, 2, 0)), v: new THREE.Vector3(Math.cos(a) * 0.8, 1.6 + Math.random(), Math.sin(a) * 0.8), t: 0, life: 1.4 }); }
}
function avatarById(id) { return id === S.me ? myAvatar : S.others.get(id); }
socket.on('heartFx', ({ from, to }) => {
  const a = avatarById(from), b = avatarById(to); if (!a || !b) return;
  for (let i = 0; i < 5; i++) S.flyHearts.push({ sp: heartSprite(), kind: 'fly', a, b, t: -i * 0.12, life: 1.1, h: 1.5 + Math.random() });
});
socket.on('heart', ({ from, total }) => {
  S.hearts = total; audio.play('bell');
  toast(`💖 ${from} 님이 하트를 보냈어요! (받은 하트 ${total}개)`);
  if (myAvatar) setTimeout(() => burstHearts(myAvatar, 10), 900);
});
function updateHearts(dt) {
  for (const h of S.flyHearts) {
    h.t += dt;
    if (h.t < 0) { h.sp.visible = false; continue; }
    h.sp.visible = true;
    const k = Math.min(1, h.t / h.life);
    if (h.kind === 'fly') {
      const p = h.a.position.clone().lerp(h.b.position, k); p.y = 1.9 + Math.sin(k * Math.PI) * h.h;
      h.sp.position.copy(p);
    } else { h.sp.position.copy(h.from).addScaledVector(h.v, h.t); h.sp.material.opacity = 1 - k; }
    h.sp.scale.setScalar(0.45 * (1 + Math.sin(h.t * 12) * 0.1));
  }
  const done = S.flyHearts.filter((h) => h.t >= h.life);
  for (const h of done) { overlay.remove(h.sp); if (h.kind === 'fly' && h.b === myAvatar) burstHearts(myAvatar, 3); }
  S.flyHearts = S.flyHearts.filter((h) => h.t < h.life);
}

// ─────────────────────────── 컷신 보조
function partyLooks() {
  const out = [look];
  for (const m of S.party?.members || []) if (m.id !== S.me && S.looks.get(m.id)) out.push(S.looks.get(m.id).look);
  return out;
}

// ─────────────────────────── 공유 주소
async function loadShareInfo() {
  try {
    const info = await (await fetch('/api/info')).json();
    const url = info.publicUrl || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? (info.lan[0] || location.origin) : location.origin);
    $('#shareUrl').textContent = url;
    $('#shareNote').textContent = info.publicUrl || location.protocol === 'https:' ? '이 링크로 들어온 친구는 바로 내 파티에 합류해요 (최대 4명 · 음성채팅 가능)' : '같은 와이파이의 친구만 접속 가능 · 인터넷 공유는 npm run share';
    // 복사·공유 버튼: 내 파티 코드가 붙은 초대 링크를 만든다 (휴대폰은 카카오톡 등 공유 창을 연다)
    $('#shareCopy').textContent = navigator.share && isMobileView() ? '공유' : '복사';
    $('#shareCopy').onclick = () => socket.emit('party:link', async (res) => {
      const link = url.replace(/\/$/, '') + '/?p=' + res.code;
      $('#shareUrl').textContent = link;
      if (res.full) toast('파티가 꽉 찼어요 (최대 4명).');
      if (navigator.share && isMobileView()) { try { await navigator.share({ title: '미아 — 같이 방탈출 하자!', text: `${S.myName} 님이 공포 방탈출 파티에 초대했어요 👻`, url: link }); return; } catch {} }
      try { await navigator.clipboard.writeText(link); toast('초대 링크를 복사했어요! 친구에게 보내면 바로 내 파티로 들어와요.'); } catch { const r = document.createRange(); r.selectNodeContents($('#shareUrl')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('링크를 길게 눌러 복사하세요.'); }
    });
  } catch {}
}

// ─────────────────────────── 레벨 · 코인 · 상점 · 내 물건 · 선물
const GOLD_ORDER = ['gold_hat', 'gold_mask', 'gold_gloves', 'gold_top', 'gold_bottom', 'gold_shoes', 'gold_tail']; // 황금 고양이 세트 (비매품 · 주간랭킹 1~3위 보상)
const SHOP_ORDER = ['rename_ticket', 'popper', 'rocket', 'wings_fairy', 'mount_pony', 'wings_angel', 'mount_broom', 'mount_cat', 'mount_dog', 'mount_wolf', 'mount_unicorn', 'wings_bat', 'tail_devil', 'horn_devil', 'wings_devil', 'mount_trex', 'wings_dragon', 'sword', 'mount_ufo', 'mount_lion', 'mount_turtle', 'mount_human', 'costume_robot', 'mount_carriage', 'chainsaw', 'mask_paper', 'mask_rabbit', 'mask_menhera', 'mask_fox', 'mask_bear', 'mask_hahoe', 'mask_wolf', 'mask_venice', 'mask_ghost', 'mask_oni', 'mount_sleigh', 'costume_xmas', ...GOLD_ORDER, 'gold_staff'];
const coinsText = () => (S.profile?.coins === -1 ? '∞' : String(S.profile?.coins ?? 0));
// 손에 든 것: 0 없음 · 1 전설의 검 · 2 황금 고양이 지팡이
function holdCode() { const it = S.profile?.items; return S.holdSaw && it?.chainsaw ? 3 : S.holdStaff && it?.gold_staff ? 2 : S.holdSword && it?.sword ? 1 : 0; }
/** 착용 중인 황금 고양이 부위 글자 (가진 것만) */
const goldWorn = () => { const on = S.profile?.equip?.gold || '', it = S.profile?.items || {}; let out = ''; for (const id of GOLD_ORDER) { const c = S.shop[id]?.part; if (c && it[id] && on.includes(c)) out += c; } return out; };
const myGear = () => { const e = S.profile?.equip || {}; return `${e.wings || ''}|${e.mount || ''}|${S.riding && e.mount ? 1 : 0}|${holdCode()}|${e.costume || ''}|${goldWorn()}|${S.snack || ''}|${e.mask || ''}|${e.tail || ''}|${e.horn || ''}`; };
// 맨 아래 얇은 경험치 바 + 왼쪽 위 레벨·코인
const xpBar = el('div'); xpBar.id = 'xpBar'; xpBar.innerHTML = '<div id="xpFill"></div><div id="xpLabel"></div>'; $('#hud').appendChild(xpBar);
const lvChip = el('div'); lvChip.id = 'lvChip'; $('#onlineChip').after(lvChip);
lvChip.onclick = () => openBag();
// 📸 캡처: 지금 화면을 찍어 내 기기에 저장한다
const snapChip = el('div', null, '📸 캡처'); snapChip.id = 'snapChip'; snapChip.hidden = true; snapChip.title = '화면 캡처 → 내 기기에 저장'; lvChip.after(snapChip);
snapChip.onclick = (e) => { e.stopPropagation(); takeSnap(); };
S.snaps = [];
const showSnaps = () => S.world?.snapBoard?.set(S.snaps);
function mergeClearPhotos(list) {
  if (!Array.isArray(list)) return;
  const latest = new Map([...S.snaps, ...list].map((photo) => [photo.id, photo]));
  S.snaps = [...latest.values()].sort((a, b) => b.at - a.at || b.id.localeCompare(a.id)).slice(0, 27);
  showSnaps();
  S.galleryRefresh?.();
}
socket.on('snap:new', (photo) => mergeClearPhotos([photo]));
function takeSnap() {
  if (!S.room || S._snapAt > performance.now() - 1500) return; S._snapAt = performance.now();
  // 같은 순간에 한 번 더 그려서 바로 읽는다 (화면 버퍼가 지워지기 전에)
  fx.render(performance.now(), { danger: S.danger, mode: S.room === 'lobby' ? 'lobby' : 'game' });
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(overlay, camera); renderer.autoClear = true;
  const full = canvas.toDataURL('image/jpeg', 0.92);
  // 찰칵 효과
  const fl = el('div', 'snap-flash'); document.body.appendChild(fl); setTimeout(() => fl.remove(), 600); audio.play('pickup');
  // 내 폰에 저장: 폰은 공유 창(→ '이미지 저장'), PC는 다운로드
  const d = new Date(), pad = (n) => String(n).padStart(2, '0');
  const name = `mia-capture-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
  const bin = atob(full.split(',')[1]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const blob = new Blob([u8], { type: 'image/jpeg' });
  const download = () => { const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); };
  const file = new File([blob], name, { type: 'image/jpeg' });
  if (isMobileView() && navigator.canShare?.({ files: [file] })) navigator.share({ files: [file], title: '미아 캡처' }).catch((err) => { if (err?.name !== 'AbortError') download(); });
  else download();
  toast('📸 화면을 캡처했어요.');
}
function renderXp() {
  const pf = S.profile; if (!pf) return;
  const span = Math.max(1, pf.next - pf.cur), k = pf.lv >= pf.max || pf.admin ? 1 : (pf.xp - pf.cur) / span;
  $('#xpFill').style.width = (Math.max(0, Math.min(1, k)) * 100).toFixed(1) + '%';
  $('#xpLabel').textContent = pf.admin ? `Lv.${pf.lv} 운영자 🛡️` : pf.lv >= pf.max ? `Lv.${pf.lv} 만렙 👑` : `Lv.${pf.lv}  ${pf.xp - pf.cur} / ${span} XP`;
  lvChip.innerHTML = `<b>Lv.${pf.lv}</b> · 🪙 ${coinsText()}`;
  snapChip.hidden = false;
  lvChip.title = '내 물건 🎒 (I)';
  if (!pf.equip?.mount) S.riding = false;
  if (!pf.items?.sword) S.holdSword = false;
  if (!pf.items?.gold_staff) S.holdStaff = false;
  if (!pf.items?.chainsaw) S.holdSaw = false;
  updateGearButtons();
}
socket.on('profile', (pf) => {
  const was = S.profile; S.profile = pf;
  if (pf.items?.costume_xmas) S.world?.xmasGift?.hide(); // 계정 정보가 로비보다 늦게 와도 이미 받은 선물상자는 숨긴다
  if (!was && pf.equip?.mount) S.riding = true; // 탈것을 착용해 두었다면 타고 시작
  if (was && pf.equip?.mount && pf.equip.mount !== was.equip?.mount) S.riding = true; // 새 탈것을 착용하면 바로 탄다
  renderXp();
  if (pf.hiddenOk != null && pf.hiddenOk !== S.hiddenOk) { S.hiddenOk = pf.hiddenOk; updateHiddenGate(); renderParty(); }
  if (S.shopRefresh) S.shopRefresh(); if (S.bagRefresh) S.bagRefresh();
  if (was) return;
});
socket.on('xp', ({ add, why, lv, up }) => {
  const f = el('div', 'xp-float', `+${add} XP${why ? ' · ' + why : ''}`); $('#hud').appendChild(f); setTimeout(() => f.remove(), 2600);
  if (up) { audio.play('bell'); if (myAvatar) burstHearts(myAvatar, 10); }
});
socket.on('gift', ({ from, icon, name }) => { toast(`🎁 ${from} 님이 ${icon} ${name}을(를) 선물했어요! (🎒 내 물건)`); audio.play('pickup'); if (myAvatar) burstHearts(myAvatar, 8); });
// 우편: 주간랭킹 1~3위 보상처럼 꼭 알려야 하는 소식 (접속해 있지 않았다면 다음에 들어올 때 온다)
socket.on('mail', ({ text }) => {
  const w = el('div', 'bag'); w.appendChild(el('div', 'mail-text', text));
  const b = el('button', 'btn primary', '🎒 내 물건 보기'); b.onclick = () => openBag(); w.appendChild(b);
  openModal('🏆 축하합니다!', '주간랭킹 보상', w);
  audio.play('bell'); if (myAvatar) burstHearts(myAvatar, 12);
  addChat({ channel: 'system', text: '🎁 ' + text });
});
// 소원의 별 위에 주간랭킹 상위 3명을 표시한다
function setChamp(c) { S.champ = c || null; if (S.room === 'lobby') S.world?.setChamp?.(S.champ); }
socket.on('champ', (c) => setChamp(c));
socket.on('rank:changed', () => openRank(S.rankTab?.() || { main: 'theme' }));
const celeb = el('div', 'hidden'); celeb.id = 'celebrate'; document.body.appendChild(celeb);
socket.on('celebrate', ({ name, text }) => {
  celeb.innerHTML = `<div class="cb-spark">✦ ✧ ✦</div><div class="cb-text"></div><div class="cb-sub">축하합니다! 🎉</div>`; celeb.querySelector('.cb-text').textContent = text;
  celeb.classList.remove('hidden'); celeb.style.animation = 'none'; void celeb.offsetWidth; celeb.style.animation = '';
  audio.play('bell'); setTimeout(() => audio.play('firework'), 400);
  if (name === S.myName && myAvatar) { burstHearts(myAvatar, 12); rocketFx(me.x, me.y || 0, me.z, () => {}); }
  addChat({ channel: 'system', text: '🎊 ' + text });
  clearTimeout(celeb._t); celeb._t = setTimeout(() => celeb.classList.add('hidden'), 9000);
});
socket.on('game:overtime', () => { audio.play('bell'); $('#gameTimer').classList.add('over'); });
// 히든 테마: 모든 테마를 한 번씩 깨거나 만렙이면 열린다
function updateHiddenGate(quiet) {
  const ok = !!(S.hiddenOk || S.admin);
  if (S.room === 'lobby' && S.world?.hiddenGate !== undefined && S.world.hiddenGate !== ok && myAvatar) { enterLobby({ x: me.x, z: me.z }); if (!quiet) toast('🧟 광장에 히든 테마 「데드 시티」 관문이 나타났어요!'); }
}
// ───── 탈것 · 전설의 검
function toggleRide() {
  const m = S.profile?.equip?.mount;
  if (!m) { toast('🐴 탈것이 없어요. 🛒 상점에서 사서 🎒 내 물건에서 착용하세요.'); return; }
  if (S.mount) dismount();
  S.riding = !S.riding; S.perch = null; me.y = 0;
  toast(S.riding ? `${S.shop[m]?.icon || '🐴'} ${S.shop[m]?.name || '탈것'}에 탔어요! 이동 속도 ${m === 'mount_turtle' ? 2 : 1.5}배 (Z: 내리기)` : '탈것에서 내렸어요.');
  updateGearButtons();
}
function swingSword() {
  const it = S.profile?.items || {};
  if (!it.sword && !it.gold_staff && !it.chainsaw) { toast('🗡️ 전설의 검이 없어요. (🛒 상점)'); return; }
  if (!holdCode()) { // 아무것도 들고 있지 않으면 먼저 든다 (지팡이 → 전기톱 → 검 순서: 앞의 둘은 횟수 제한이 없다)
    S.holdStaff = !!it.gold_staff; S.holdSaw = !it.gold_staff && !!it.chainsaw; S.holdSword = !S.holdStaff && !S.holdSaw;
    toast(S.holdStaff ? '🪄 황금 고양이 지팡이를 들었다! B: 휘두르기 · 귀신 퇴치 무제한' : S.holdSaw ? '🪚 전기톱을 들었다! 부르릉~ B: 갈기 · 귀신 퇴치 무제한' : `🗡️ 전설의 검을 들었다! B: 휘두르기 · 남은 횟수 ${S.profile.swordUses}/30`);
    updateGearButtons(); return;
  }
  if (myAvatar) myAvatar.userData.swingT = 0.45;
  socket.emit('shop:use', ['', 'sword', 'gold_staff', 'chainsaw'][holdCode()]);
}
/** 손에 드는 것 바꾸기: '' 넣기 · 'sword' · 'staff' · 'saw' (하나만 든다) */
function holdWeapon(kind) { S.holdSword = kind === 'sword'; S.holdStaff = kind === 'staff'; S.holdSaw = kind === 'saw'; updateGearButtons(); }
socket.on('fx:item', (f) => {
  const d = Math.hypot(f.x - me.x, f.z - me.z); if (d > 40) return;
  const g = avatarById(f.id);
  if (f.type === 'popper') { popperFx(f.x, f.y, f.z, f.ry); audio.play('party_pop'); if (d < 4) S.shake = 0.25; }
  else if (f.type === 'rocket') { audio.play('rocket_up'); rocketFx(f.x, f.y, f.z, () => audio.play('firework')); }
  else if (f.type === 'sword') {
    if (g && f.id !== S.me) g.userData.swingT = 0.45;
    swordFx(f.x, f.y, f.z, f.ry, f.hit); audio.play(f.hit ? 'slay' : 'sword');
    if (f.broke) { shatterFx(f.x, f.y, f.z); audio.play('shatter'); if (f.id === S.me) S.holdSword = false; }
  } else if (f.type === 'staff') { // 황금 고양이 지팡이: 황금빛 궤적
    if (g && f.id !== S.me) g.userData.swingT = 0.45;
    swordFx(f.x, f.y, f.z, f.ry, f.hit, true); audio.play(f.hit ? 'slay' : 'sword');
  } else if (f.type === 'saw') { // 전기톱: 부르릉 + 주황 불꽃
    if (g && f.id !== S.me) g.userData.swingT = 0.45;
    swordFx(f.x, f.y, f.z, f.ry, f.hit, 'saw'); audio.play('chainsaw'); if (f.hit) audio.play('slay'); if (d < 3) S.shake = 0.15;
  }
});
function useShopItem(id) {
  if (id === 'sword' || id === 'gold_staff' || id === 'chainsaw') { holdWeapon(id === 'sword' ? 'sword' : id === 'chainsaw' ? 'saw' : 'staff'); return swingSword(); }
  if (!S.profile?.items?.[id]) { toast('남은 게 없어요. 🛒 상점에서 더 살 수 있어요.'); return; }
  socket.emit('shop:use', id);
}
// ───── 방귀 뿡 (먼지 + 효과음)
function doFart(g, x, y, z, ry) {
  const d = Math.hypot(x - me.x, z - me.z);
  setTimeout(() => {
    fartFx(x, y, z, ry);
    if (d < 16) audio.play('fart');
  }, 380);
  if (g) setTimeout(() => { const b = textSprite('뿌우웅~ 💨', { size: 26, bg: 'rgba(60,50,20,.8)', color: '#ffe9a8' }); addLabel(g, b, 2.05); setTimeout(() => removeLabel(b), 1800); }, 400);
}
// ───── 마이크로 말하면 발밑에 초록 링이 목소리 크기에 맞춰 퍼진다
const ringGeo = new THREE.RingGeometry(0.9, 1, 56); ringGeo.rotateX(-Math.PI / 2);
function updateVoiceRings(dt) {
  // 말하는 동안 발밑에 초록 원 하나가 나타나고, 말을 멈추면 서서히 사라진다
  const seen = new Set();
  for (const [id, lv] of S.vlv) {
    const g = id === S.me ? myAvatar : S.others.get(id); if (!g) continue;
    seen.add(g);
    const u = g.userData;
    if (lv >= 0.05) u.vrHold = 0.35; else u.vrHold = Math.max(0, (u.vrHold || 0) - dt);
    const want = u.vrHold > 0 ? 0.75 : 0;
    if (!u.vring && want) { u.vring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#3dff7a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); u.vring.scale.setScalar(0.55); scene.add(u.vring); S.vrings.push(g); }
    if (!u.vring) continue;
    const m = u.vring.material; m.opacity += (want - m.opacity) * Math.min(1, dt * (want ? 12 : 5));
    u.vring.position.set(g.position.x, (g.position.y || 0) + 0.04, g.position.z);
    if (!want && m.opacity < 0.02) { scene.remove(u.vring); m.dispose(); u.vring = null; S.vrings = S.vrings.filter((x) => x !== g); }
  }
  for (const g of S.vrings) if (!seen.has(g) || !g.parent) { const u = g.userData; if (u.vring) { scene.remove(u.vring); u.vring.material.dispose(); u.vring = null; } }
  S.vrings = S.vrings.filter((g) => g.userData.vring);
}
// ───── 상점 (미리보기 + 목록)
let shopPv = null;
function shopPreview() {
  if (shopPv) return shopPv;
  const canvas = el('canvas'); canvas.width = 240; canvas.height = 220; canvas.className = 'shop-pv';
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.4;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#ffffff', '#443344', 2.2)); const dl = new THREE.DirectionalLight('#fff', 1.6); dl.position.set(2, 3, 3); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(36, 240 / 220, 0.1, 50); cam.position.set(0, 1.3, 4.2); cam.lookAt(0, 0.75, 0);
  shopPv = { canvas, r, sc, cam, av: null, gear: '', on: false };
  const tick = (t) => { if (!shopPv.on) return; requestAnimationFrame(tick); if (shopPv.av) { const tt = t / 1000; shopPv.av.rotation.y = tt * 0.6; animateAvatar(shopPv.av, 0.016, shopPv.walk, tt); applyGear(shopPv.av, shopPv.gear); animateGear(shopPv.av, tt, 0.016, shopPv.walk); } r.render(sc, cam); };
  shopPv.start = () => { if (shopPv.on) return; shopPv.on = true; requestAnimationFrame(tick); };
  return shopPv;
}
function previewItem(id) {
  const pv = shopPreview(); const it = S.shop[id] || {};
  if (!pv.av) { pv.av = createAvatar(look); pv.sc.add(pv.av); }
  pv.walk = it.kind === 'mount' || it.kind === 'costume';
  pv.gear = it.kind === 'wings' ? `${id}||0|0|` : it.kind === 'mount' ? `|${id}|1|0|` : it.kind === 'sword' ? '|||1|' : it.kind === 'staff' ? '|||2||hmgtbsl' : it.kind === 'saw' ? '|||3|' : it.kind === 'gold' ? `||0|0||${it.part}` : it.kind === 'costume' ? `||0|0|${id}` : it.kind === 'mask' ? `||0|0||||${id}` : it.kind === 'tail' ? `||0|0|||||${id}` : it.kind === 'horn' ? `||0|0||||||${id}` : '';
  const big = ['mount_cat', 'mount_dog', 'mount_carriage', 'mount_trex', 'mount_wolf', 'mount_lion', 'mount_human'].includes(id), huge = id === 'mount_sleigh'; pv.cam.position.set(0, it.kind === 'mount' ? (huge ? 4.2 : big ? 2.2 : 1.6) : (it.kind === 'mask' || it.kind === 'horn') ? 1.15 : 1.3, it.kind === 'mount' ? (huge ? 11.5 : big ? 6.2 : 4.8) : (it.kind === 'mask' || it.kind === 'horn') ? 2.6 : 4.2); pv.cam.lookAt(0, it.kind === 'mount' ? (big ? 1.2 : 0.9) : (it.kind === 'mask' || it.kind === 'horn') ? 1.0 : 0.75, 0);
}
function openShop() {
  if (!S.profile) return;
  const w = el('div', 'shop');
  const head = el('div', 'shop-head'); const pvBox = el('div', 'shop-pvbox'); const info = el('div', 'shop-info'); const grid = el('div', 'shop-grid');
  const pv = shopPreview(); pvBox.appendChild(pv.canvas); pv.start();
  let sel = 'wings_fairy';
  const draw = () => {
    const pf = S.profile;
    head.innerHTML = `<span><b>Lv.${pf.lv}</b>${pf.lv >= pf.max ? ' 👑' : ''}</span><span>🪙 <b>${coinsText()}</b> 코인</span><span class="muted">방탈출을 한 번 깰 때마다 🪙10 · 레벨이 오르면 새 물건이 열려요</span>`;
    grid.innerHTML = '';
    for (const id of SHOP_ORDER) {
      const it = S.shop[id]; if (!it) continue;
      const have = pf.items?.[id] || 0, locked = !pf.admin && pf.lv < it.lv, full = have >= it.max;
      const c = el('div', 'shop-card' + (sel === id ? ' sel' : '') + (locked ? ' locked' : ''));
      if (it.nosale) { c.classList.add('nosale'); c.innerHTML = `<div class="si">${it.icon}</div><div class="sn">${it.name}</div><div class="sp">비매품</div><div class="sl">${have ? '✅ 보유' : it.gift === 'xmas' ? '🎄 크리스마스 선물' : it.kind === 'staff' ? '세트 7종 보상' : '🏆 주간 1위 보상'}</div>`; }
      else c.innerHTML = `<div class="si">${it.icon}</div><div class="sn">${it.name}</div><div class="sp">🪙 ${it.price.toLocaleString()}</div><div class="sl">${locked ? `🔒 Lv.${it.lv}` : it.max > 1 ? `${have}/${it.max}개` : have ? '✅ 보유' : `Lv.${it.lv}+`}</div>`;
      c.onclick = () => { sel = id; previewItem(id); draw(); };
      grid.appendChild(c);
    }
    const it = S.shop[sel]; const have = pf.items?.[sel] || 0; const locked = !it.nosale && !pf.admin && pf.lv < it.lv;
    if (it.nosale) { // 비매품: 전시만 한다 (살 수 없다)
      const goldHave = GOLD_ORDER.filter((id) => pf.items?.[id]).length;
      info.innerHTML = `<div class="sh-t">${it.icon} ${it.name}</div><div class="sh-d">${it.desc}</div><div class="sh-d muted">${it.tip || ''}</div><div class="sh-lv">${have ? '✅ 가지고 있어요' : it.gift === 'xmas' ? '🎁 로비 소원의 별 앞 선물상자에서 E 키로 받아요 (한 사람에 한 번)' : it.kind === 'staff' ? `황금 고양이 세트 ${goldHave}/7 모음` : '🏆 주간랭킹 1~3위에게 미보유 부위 1개를 무작위로 지급해요'}</div>${it.gift === 'xmas' ? '' : `<div class="muted">아이템별 1개만 가질 수 있어요 · 황금 고양이 세트 ${goldHave}/7${it.kind === 'staff' ? '' : ' · 7종을 다 모으면 🪄 황금 고양이 지팡이(귀신 퇴치 무제한)'}</div>`}`;
      const nb = el('button', 'btn primary', '비매품 (살 수 없어요)'); nb.disabled = true;
      const bag2 = el('button', 'btn', '🎒 내 물건'); bag2.onclick = () => openBag();
      const row2 = el('div', 'row'); row2.append(nb, bag2); info.appendChild(row2);
      return;
    }
    info.innerHTML = `<div class="sh-t">${it.icon} ${it.name}</div><div class="sh-d">${it.desc}</div><div class="sh-lv${locked ? ' locked' : ''}">${it.lv > 1 ? `🔒 Lv.${it.lv} 이상 구매 가능` : '🔓 누구나 구매 가능'}${locked ? ` · 현재 Lv.${pf.lv}` : ' ✓'}</div><div class="muted">${it.max > 1 ? `최대 ${it.max}개까지 가질 수 있어요 · 지금 ${have}개` : '아이템별 1개만 가질 수 있어요'}${it.kind === 'mount' ? ` · 탄 동안 이동 속도 ${sel === 'mount_turtle' ? 2 : 1.5}배 (Z)` : ''}${it.kind === 'sword' ? ' · 귀신 30번 베면 깨져요' : ''}${it.kind === 'saw' ? ' · 귀신 퇴치 무제한 (B)' : ''}</div>`;
    const buy = el('button', 'btn primary', locked ? `🔒 Lv.${it.lv} 부터` : have >= it.max ? (it.max > 1 ? '가득 찼어요' : '이미 있어요') : `🪙 ${it.price.toLocaleString()} 코인에 사기`);
    const needsAccount = it.kind === 'rename' && pf.admin;
    buy.disabled = locked || have >= it.max || needsAccount;
    if (needsAccount) buy.textContent = '고정 계정 전용';
    buy.onclick = () => { socket.emit('shop:buy', sel); audio.play('click'); };
    const bag = el('button', 'btn', '🎒 내 물건'); bag.onclick = () => openBag();
    const row = el('div', 'row'); row.append(buy, bag); info.appendChild(row);
  };
  const top = el('div', 'shop-top'); top.append(pvBox, info);
  w.append(head, top, grid);
  previewItem(sel); draw();
  S.shopRefresh = () => { if ($('#modalBody').firstChild === w) draw(); else S.shopRefresh = null; };
  openModal('🛒 코인 상점', '닉네임 변경권 · 날개 · 탈것 · 코스튬 · 가면 · 폭죽 · 전설의 검 · 🏆 주간랭킹 1~3위 보상(비매품)', w);
  $('#modal .modal-card').classList.add('shop-mode'); // 위는 고정, 아래 물건 목록만 스크롤
  const stop = () => { if ($('#modalBody').firstChild !== w || $('#modal').classList.contains('hidden')) { pv.on = false; S.shopRefresh = null; } else setTimeout(stop, 500); }; setTimeout(stop, 500);
}
socket.on('account:renamed', applyAccountName);
socket.on('shop:bought', ({ id }) => { audio.play('pickup'); const it = S.shop[id]; if (it?.kind === 'sword') holdWeapon('sword'); if (it?.kind === 'saw') holdWeapon('saw'); });
// ───── 내 물건 (착용 · 사용 · 선물)
function openBag() {
  if (!S.profile) return;
  const w = el('div', 'bag');
  const draw = () => {
    w.innerHTML = ''; const pf = S.profile;
    const ids = SHOP_ORDER.filter((id) => pf.items?.[id]);
    w.appendChild(el('div', 'muted', `Lv.${pf.lv} · 🪙 ${coinsText()} 코인 · 단축키: Z 탈것 타기/내리기 · B 검·지팡이 들기/휘두르기`));
    const goldHave = GOLD_ORDER.filter((id) => pf.items?.[id]).length;
    if (goldHave) {
      const note = el('div', 'muted gold-note', `🏆 황금 고양이 세트 ${goldHave}/7${goldHave >= 7 ? ' — 세트 완성! 🪄 지팡이로 귀신을 횟수 제한 없이 물리칠 수 있어요' : ' · 7종을 다 모으면 🪄 황금 고양이 지팡이를 받아요'} `);
      if (goldHave >= 2) { // 한꺼번에 입기 / 벗기
        const worn = goldWorn().length;
        const all = el('button', 'btn tiny' + (worn >= goldHave ? ' primary' : ''), worn >= goldHave ? '모두 벗기' : '모두 입기'); all.onclick = () => socket.emit('shop:equip', { id: 'gold_set', on: worn < goldHave });
        note.appendChild(all);
      }
      w.appendChild(note);
      if (pf.equip?.costume) w.appendChild(el('div', 'muted', '※ 황금 고양이 세트를 입으면 입고 있던 코스튬은 저절로 벗겨져요.'));
    }
    if (!ids.length) { w.appendChild(el('div', 'bag-empty', '물건이 없습니다 😀 상점에서 구매하세요')); }
    for (const id of ids) {
      const it = S.shop[id]; const n = pf.items[id];
      const row = el('div', 'bag-row');
      row.appendChild(el('span', 'bi', it.icon));
      row.appendChild(el('span', 'bn', `${it.name}${it.max > 1 ? ` ×${n}` : ''}${it.kind === 'sword' ? ` (남은 ${pf.swordUses}/30)` : ''}${it.kind === 'staff' || it.kind === 'saw' ? ' (무제한)' : ''}`));
      const acts = el('span', 'ba');
      if (it.kind === 'wings' || it.kind === 'mount' || it.kind === 'costume' || it.kind === 'mask' || it.kind === 'tail' || it.kind === 'horn') {
        const on = pf.equip?.[it.kind] === id;
        const b = el('button', 'btn tiny' + (on ? ' primary' : ''), on ? '착용 중 ✓' : '착용'); b.onclick = () => { socket.emit('shop:equip', { id, on: !on }); if (it.kind === 'mount') { S.riding = !on; if (!on) { if (S.mount) dismount(); S.perch = null; me.y = 0; toast(`${it.icon} ${it.name}에 탔어요! 이동 속도 ${id === 'mount_turtle' ? 2 : 1.5}배 (Z: 내리기/타기)`); } updateGearButtons(); } };
        acts.appendChild(b);
        if (it.kind === 'mount' && on) { const r = el('button', 'btn tiny', S.riding ? '내리기 (Z)' : '타기 (Z)'); r.onclick = () => { toggleRide(); draw(); }; acts.appendChild(r); }
      } else if (it.kind === 'gold') { // 황금 고양이 부위: 부위마다 따로 입고 벗는다
        const on = (pf.equip?.gold || '').includes(it.part);
        const b = el('button', 'btn tiny' + (on ? ' primary' : ''), on ? '착용 중 ✓' : '착용'); b.onclick = () => socket.emit('shop:equip', { id, on: !on });
        acts.appendChild(b);
      } else if (it.kind === 'sword' || it.kind === 'staff' || it.kind === 'saw') {
        const kind = it.kind, held = kind === 'sword' ? S.holdSword : kind === 'saw' ? S.holdSaw : S.holdStaff;
        const b = el('button', 'btn tiny' + (held ? ' primary' : ''), held ? '넣기' : '들기'); b.onclick = () => { holdWeapon(held ? '' : kind); draw(); };
        const sw = el('button', 'btn tiny', '휘두르기 (B)'); sw.onclick = () => { holdWeapon(kind); closeModal(); swingSword(); };
        acts.append(b, sw);
      } else if (it.kind === 'rename') {
        const b = el('button', 'btn tiny primary', '사용');
        b.disabled = S.room !== 'lobby';
        b.title = '광장에서 닉네임을 바꿀 수 있어요.';
        b.onclick = openRenameTicket;
        acts.appendChild(b);
      } else {
        const b = el('button', 'btn tiny primary', it.kind === 'pop' ? '🎉 펑!' : '🎆 쏘기'); b.onclick = () => { closeModal(); useShopItem(id); };
        acts.appendChild(b);
      }
      if (!it.nosale || pf.admin) { const gb = el('button', 'btn tiny', '🎁'); gb.title = '친구에게 선물하기'; gb.onclick = () => pickGiftTarget(id); acts.appendChild(gb); } // 비매품은 선물할 수 없다
      else acts.appendChild(el('span', 'bag-tag', '비매품'));
      row.appendChild(acts); w.appendChild(row);
    }
  };
  draw();
  S.bagRefresh = () => { if ($('#modalBody').firstChild === w) draw(); else S.bagRefresh = null; };
  openModal('🎒 내 물건', '날개·탈것·코스튬·가면은 착용하면 모두에게 보여요 · 아이템별 1개만 가질 수 있어요 (폭죽은 여러 개)', w);
  footBtn('🛒 상점', () => openShop());
  footBtn('🎫 도장표', () => openStamps());
}
function openRenameTicket() {
  const form = el('form', 'bag custom');
  const label = el('label', 'muted', '새 닉네임');
  label.htmlFor = 'renameNick';
  const input = el('input');
  input.id = label.htmlFor;
  input.maxLength = 12;
  input.required = true;
  input.autocomplete = 'off';
  input.placeholder = '새 닉네임 (최대 12자)';
  const message = el('div', 'muted');
  message.setAttribute('role', 'status');
  const row = el('div', 'row');
  const cancel = el('button', 'btn', '취소');
  cancel.type = 'button';
  cancel.onclick = openBag;
  const submit = el('button', 'btn primary', '변경권 1장 사용');
  submit.type = 'submit';
  row.append(cancel, submit);
  form.append(label, input, message, row);
  form.onsubmit = event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    message.textContent = '닉네임을 확인하고 있어요.';
    socket.timeout(12000).emit('shop:rename', input.value, (error, result) => {
      submit.disabled = false;
      if (!result?.account) {
        message.textContent = error ? '응답이 늦어지고 있어요. 현재 닉네임을 확인해 주세요.' : result?.error || '닉네임을 바꾸지 못했어요.';
        return;
      }
      applyAccountName(result.account);
      if ($('#modalBody').firstChild === form && S.modalOpen) openBag();
      audio.play('pickup');
      toast(`닉네임을 ${result.account.name}(으)로 바꿨어요!`);
    });
  };
  openModal('🎫 닉네임 변경권', `현재 닉네임은 ${S.myName}입니다. 변경이 완료되면 변경권 1장이 사용돼요.`, form);
}
function pickGiftTarget(id) {
  const it = S.shop[id]; const w = el('div', 'bag');
  const others = S.roster.filter((r) => r.id !== S.me);
  if (!others.length) w.appendChild(el('div', 'muted', '선물할 접속자가 없어요.'));
  for (const r of others) { const b = el('button', 'btn small', `🎁 ${r.name}`); b.onclick = () => { socket.emit('shop:gift', { to: r.id, id }); closeModal(); }; w.appendChild(b); }
  openModal(`🎁 ${it.icon} ${it.name} 선물하기`, '누구에게 보낼까요? (선물하면 내 것에서 1개가 빠져요)', w);
}
function openGift(toId, name) {
  if (!S.profile) return;
  const w = el('div', 'bag'); const pf = S.profile;
  const ids = SHOP_ORDER.filter((id) => S.shop[id] && (pf.admin || (pf.items?.[id] && !S.shop[id].nosale)));
  if (!ids.length) w.appendChild(el('div', 'muted', '선물할 물건이 없어요. 🛒 상점에서 먼저 사 보세요!'));
  for (const id of ids) { const it = S.shop[id]; const b = el('button', 'btn small', `${it.icon} ${it.name}${pf.items?.[id] > 1 ? ` (${pf.items[id]}개)` : ''}`); b.onclick = () => { socket.emit('shop:gift', { to: toId, id }); closeModal(); }; w.appendChild(b); }
  openModal(`🎁 ${name} 님에게 선물하기`, '내 물건 중 하나를 골라 보내요', w);
}
$('#sideBtns').insertBefore(Object.assign(el('button', 'btn small', '🛒 상점'), { id: 'shopBtn', onclick: () => openShop() }), $('#rankBtn'));
$('#sideBtns').insertBefore(Object.assign(el('button', 'btn small', '🎒 내 물건'), { id: 'bagBtn', onclick: () => openBag() }), $('#rankBtn'));
function updateGearButtons() {
  const rb = $('.abtn.ride'), sb = $('.abtn.sword'), nb = $('.abtn.snack');
  if (nb) { nb.classList.toggle('hidden', !S.snack || S.snack[0] === 'b'); if (S.snack) { nb.firstChild.textContent = SNACK_INFO[S.snack[0]]?.icon || '🍿'; nb.querySelector('small').textContent = `${S.snack[0] === 'c' ? '마시기' : '먹기'} ${S.snack[1]}`; } }
  if (rb) { rb.classList.toggle('hidden', !S.profile?.equip?.mount); rb.classList.toggle('on', !!S.riding); rb.firstChild.textContent = S.shop[S.profile?.equip?.mount]?.icon || '🐴'; }
  if (sb) { const it = S.profile?.items; const hc = holdCode(), k = hc || (it?.gold_staff ? 2 : it?.chainsaw ? 3 : 1); sb.classList.toggle('hidden', !(it?.sword || it?.gold_staff || it?.chainsaw)); sb.classList.toggle('on', !!hc); sb.firstChild.textContent = ['', '🗡️', '🪄', '🪚'][k]; const sm = sb.querySelector('small'); if (sm) sm.textContent = ['', '검', '지팡이', '전기톱'][k]; }
}
// ───── 운영자: 방문 통계 (일간 · 주간 · 월간)
const fmtDur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`; };
function visitStats(st) {
  const box = el('div');
  const cards = el('div', 'visit-cards');
  for (const [k, label] of [['day', '오늘'], ['week', '최근 7일'], ['month', '최근 30일']]) {
    const v = st.visit[k];
    const c = el('div', 'visit-card'); c.innerHTML = `<div class="vl">${label}</div><div class="vn">${v.visitors}<small>명</small></div><div class="vs">방문 ${v.visits}회<br>총 체류 ${fmtDur(v.totalMs)}<br>1인 평균 ${fmtDur(v.avgMs)}</div>`;
    cards.appendChild(c);
  }
  box.appendChild(cards);
  const max = Math.max(1, ...st.daily.map((d) => d.visitors));
  const chart = el('div', 'visit-chart');
  for (const d of [...st.daily].reverse()) { const b = el('div', 'vbar'); b.title = `${d.day} · 방문자 ${d.visitors}명 · 방문 ${d.visits}회 · 체류 ${fmtDur(d.totalMs)}`; b.innerHTML = `<i style="height:${(d.visitors / max) * 100}%"></i><span>${d.day.slice(8)}</span>`; chart.appendChild(b); }
  box.append(el('div', 'muted', '최근 14일 방문자 (막대에 손을 올리면 자세히)'), chart);
  return box;
}

// ─────────────────────────── 모바일 (터치) UI
const isMobileView = () => matchMedia('(pointer: coarse)').matches || innerWidth < 760;
function applyMobile() {
  const m = isMobileView(); document.body.classList.toggle('mobile', m);
  // 모바일에서는 키보드 단축키 표기를 뺀다
  $('#storyClose').textContent = m ? '계속' : '계속 (Space)';
  $('#modalClose').textContent = m ? '닫기' : '닫기 (Esc)';
  $('#emoteBtn').textContent = m ? '😀 감정표현' : '😀 감정표현 (X)';
}
applyMobile(); addEventListener('resize', applyMobile);
{
  const hud = $('#hud');
  // 오른쪽 위 아이콘 툴바: 패널을 하나씩만 열어 화면을 가리지 않게
  const bar = el('div'); bar.id = 'mbar';
  const panels = { party: '#partyPanel', share: '#sharePanel', roster: '#rosterPanel', chat: '#chat' };
  const btns = [
    ['party', '👥', '파티'], ['chat', '💬', '채팅'], ['roster', '🧑‍🤝‍🧑', '접속자'], ['share', '🔗', '초대 주소'],
    ['shop', '🛒', '코인 상점'], ['bag', '🎒', '내 물건'], ['rank', '🏆', '랭킹'], ['settings', '⚙', '설정 · 지도 · 옷 · 도움말'], ['coffee', '💗', '감사한 마음 전하기'], ['admin', '🛡️', '운영자'],
  ];
  let open = null;
  const setOpen = (k) => {
    open = open === k ? null : k;
    for (const [key, sel] of Object.entries(panels)) $(sel).classList.toggle('m-open', open === key);
    bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.k === open));
    if (open === 'chat') { $('#chatDot')?.classList.add('hidden'); const log = $('#chatLog'); log.scrollTop = log.scrollHeight; }
    tipSync();
  };
  // '게임 시작' 말풍선: 로비에서 오른쪽 패널이 모두 닫혀 있을 때만 보인다 (패널을 여는 즉시 숨겨 그 위를 가리지 않게)
  const tipSync = () => $('#startTip')?.classList.toggle('hidden', !(S.me && S.room === 'lobby' && !open && !S.modalOpen));
  S.mobileClose = () => { if (open) setOpen(open); };
  for (const [k, icon, label] of btns) {
    const b = el('button', 'mbtn'); b.dataset.k = k; b.title = label; b.textContent = icon;
    if (k === 'chat') { const dot = el('span', 'mdot hidden'); dot.id = 'chatDot'; b.appendChild(dot); }
    if (k === 'party') { const tip = el('span', 'mtip arrow hidden', '게임 시작 ➜'); tip.id = 'startTip'; b.appendChild(tip); }
    b.onclick = (e) => {
      e.stopPropagation();
      if (panels[k]) return setOpen(k);
      if (open) setOpen(open);
      if (k === 'map') { SET.minimap = !SET.minimap; saveSettings(); }
      else if (k === 'emote') toggleEmotePanel();
      else if (k === 'shop') openShop(); else if (k === 'bag') openBag();
      else { const sel = ({ look: '#lookBtn', settings: '#settingsBtn', help: '#helpBtn', rank: '#rankBtn', coffee: '#coffeeBtn', admin: '#adminBtn' })[k]; if (sel) $(sel).click(); }
    };
    bar.appendChild(b);
  }
  hud.appendChild(bar);
  // 새 채팅이 오면 💬에 점 표시
  new MutationObserver(() => { if (document.body.classList.contains('mobile') && open !== 'chat') $('#chatDot')?.classList.remove('hidden'); }).observe($('#chatLog'), { childList: true });
  // 3D 화면을 누르면 열린 패널을 닫는다
  canvas.addEventListener('pointerdown', () => { if (open && document.body.classList.contains('mobile')) setOpen(open); });

  // 가상 조이스틱
  const joy = el('div'); joy.id = 'joy'; const knob = el('div'); knob.id = 'joyKnob'; joy.appendChild(knob); hud.appendChild(joy);
  let jid = null, jc = null;
  const R = 46;
  const jmove = (e) => {
    const dx = e.clientX - jc.x, dy = e.clientY - jc.y; const d = Math.hypot(dx, dy); const k = d > R ? R / d : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    const m = Math.min(1, d / R);
    S.joy = m < 0.18 ? null : { x: (dx / (d || 1)) * m, y: (dy / (d || 1)) * m, m };
  };
  joy.addEventListener('pointerdown', (e) => { e.preventDefault(); jid = e.pointerId; joy.setPointerCapture(jid); const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; jmove(e); joy.classList.add('act'); });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) jmove(e); });
  const jend = (e) => { if (e.pointerId !== jid) return; jid = null; S.joy = null; knob.style.transform = ''; joy.classList.remove('act'); };
  joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend); joy.addEventListener('lostpointercapture', jend);
  // 손가락이 조이스틱 밖에서 떨어져도 확실히 멈춘다
  addEventListener('pointerup', (e) => { if (e.pointerId === jid) jend(e); }); addEventListener('pointercancel', (e) => { if (e.pointerId === jid) jend(e); });

  // 오른쪽 아래 행동 버튼
  const act = el('div'); act.id = 'mact';
  const abtn = (cls, html, fn) => { const b = el('button', 'abtn ' + cls); b.innerHTML = html; b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); }); act.appendChild(b); return b; };
  const useBtn = abtn('use hidden', '✋<small>조사</small>', () => { if (S.nearest) interact(S.nearest); });
  abtn('emote', '😀', () => { $('#voicePanel')?.classList.add('hidden'); toggleEmotePanel(); });
  abtn('mic', '🎙️', () => { $('#emotePanel').classList.add('hidden'); $('#voicePanel').classList.toggle('hidden'); renderVoiceUI(); });
  const vp = el('div', 'hidden'); vp.id = 'voicePanel';
  vp.innerHTML = `<button class="btn vp-mic">🎙️ 마이크 켜기</button><div class="vp-label">듣기</div><div class="vp-modes"><button class="btn vp-mode" data-m="all">🔊 전체</button><button class="btn vp-mode" data-m="party">👥 파티</button></div><div class="vp-tip">전체: 광장에 있는 모두와 대화 · 파티: 파티원끼리만</div>`;
  vp.querySelector('.vp-mic').onclick = (e) => { e.stopPropagation(); toggleMicUI(); };
  vp.querySelectorAll('.vp-mode').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); setVoiceMode(b.dataset.m); }));
  hud.appendChild(vp);
  const lightBtn = abtn('light', '🔦', () => { if (S.inv?.includes('flashlight')) useItem('flashlight'); else toast('손전등이 없다.'); });
  abtn('jump', '⤴', () => doEmote('jump'));
  const runBtn = abtn('run', '🏃', () => { S.mRun = !S.mRun; runBtn.classList.toggle('on', S.mRun); if (S.mRun) { S.mSneak = false; snBtn.classList.remove('on'); } });
  let snBtn = null;
  snBtn = abtn('sneak', '🤫', () => { S.mSneak = !S.mSneak; if (S.mSneak) { S.mRun = false; runBtn.classList.remove('on'); } snBtn.classList.toggle('on', S.mSneak); });
  abtn('shout', '📢<small>외치기</small>', () => sendCallout());
  abtn('ride hidden', '🐴<small>타기</small>', () => toggleRide());
  abtn('sword hidden', '🗡️<small>검</small>', () => swingSword());
  abtn('snack hidden', '🍿<small>먹기</small>', () => eatSnack());
  updateGearButtons();
  hud.appendChild(act);
  renderVoiceUI();
  setInterval(() => {
    const show = !!S.nearest && !S.modalOpen && !S.storyOpen;
    useBtn.classList.toggle('hidden', !show);
    if (show) { const ent = S.world?.objects?.[S.nearest]; useBtn.querySelector('small').textContent = S.nearestVerb || ({ examine: '조사', pickup: '줍기', lock: '풀기', use: '사용', coop: '당기기', door: '들어가기' })[ent?.data.kind] || '조사'; }
    lightBtn.classList.toggle('lit', !!S.light);
    tipSync();
  }, 150);

  // 두 손가락으로 확대/축소
  const tp = new Map(); let pinch = null;
  canvas.addEventListener('pointerdown', (e) => { if (cinema.active) return; if (e.pointerType === 'touch') tp.set(e.pointerId, e); if (tp.size === 2) { const [a, b] = [...tp.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), dist: cam.dist }; } });
  canvas.addEventListener('pointermove', (e) => { if (cinema.active || !tp.has(e.pointerId)) return; tp.set(e.pointerId, e); if (pinch && tp.size === 2) { const [a, b] = [...tp.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); cam.dist = Math.max(2.5, Math.min(CAM_MAX, pinch.dist * pinch.d / Math.max(20, d))); } });
  const tend = (e) => { tp.delete(e.pointerId); if (tp.size < 2) pinch = null; };
  canvas.addEventListener('pointerup', tend); canvas.addEventListener('pointercancel', tend);

  // 아이템 길게 누르기 = 메뉴 (우클릭 대신)
  $('#inventory').addEventListener('pointerdown', (e) => {
    const s = e.target.closest('.slot'); if (!s || e.pointerType === 'mouse') return;
    const timer = setTimeout(() => { s.dataset.lp = '1'; s.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: e.clientX, clientY: e.clientY })); }, 480);
    const clear = () => { clearTimeout(timer); removeEventListener('pointerup', clear); removeEventListener('pointercancel', clear); };
    addEventListener('pointerup', clear); addEventListener('pointercancel', clear);
  });
  $('#inventory').addEventListener('click', (e) => { const s = e.target.closest('.slot'); if (s?.dataset.lp) { e.stopImmediatePropagation(); e.preventDefault(); delete s.dataset.lp; } }, true);
}
if (window.__dbg) Object.assign(window.__dbg, { setFloor: (f) => { S.floor = String(f || ''); enterLobby({ x: me.x, z: me.z }); }, eatSnack, fx, GPU_INFO, openGallery, takeSnap, graphics, gfx, PERF, applyGfx, restoreFaded, SET, S, me, cam, openShop, openBag, toggleRide, swingSword, doEmote, interact, lobbyAct, scene, camera, cinema, openRank, openFeedback, openStamps, openClearPhoto, rememberClear, showEndExtras, playHiddenPreview, openJournal });

