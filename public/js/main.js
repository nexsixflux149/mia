import * as THREE from 'three';
import { createAvatar, animateAvatar, textSprite, OPTIONS, SKIN, ACCENT, HAIRC, EYEC, DEFAULT_LOOK, EMOTES, EMOTE_DUR } from './avatar.js';
import { Cinema } from './cinema.js';
import { createGhost, animateGhost } from './ghosts.js';
import { renderDoc } from './paper.js';
import { buildLobby, buildChapter, disposeWorld } from './world.js';
import { AudioFX } from './audio.js';
import { jumpscare, pickScare } from './scare.js';
import { Voice } from './voice.js';
import { FX, makeBeam } from './fx.js';

const $ = (s) => document.querySelector(s);
const socket = io();
// 연결이 끊겼다 다시 붙으면(모바일 앱 전환 등) 같은 플레이어로 이어서 접속
socket.on('connect', () => {
  if (!S?.resume) return;
  socket.emit('hello', { name: S.myName, look, resume: S.resume }, (res) => {
    if (!res.resumed) { S.me = res.id; voice.myId = res.id; rebuildMyAvatar(); toast('연결이 오래 끊겨 로비에서 다시 시작합니다.'); }
    S.resume = { id: res.id, token: res.token };
    S.items = res.items; renderInv(); renderParty();
  });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { S.joy = null; const k = document.getElementById('joyKnob'); if (k) k.style.transform = ''; return; }
  if (!socket.connected) socket.connect();
});
if (location.search.includes('debug')) window.__dbg = { socket };
const audio = new AudioFX();
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

// ─────────────────────────── 상태
const S = {
  me: null, myName: '', items: {}, inv: [], light: false,
  room: 'lobby', world: null, chapter: null, objState: {}, dark: false,
  party: null, roster: [], chatCh: 'all',
  modalOpen: false, storyQueue: [], storyOpen: false, lockCtx: null,
  others: new Map(), looks: new Map(), lookReq: new Set(),
  ghost: null, ghostState: null,
  moveTarget: null, pendingInteract: null,
  crouch: false, run: false, pings: [], callouts: [], journal: store.get('gwimun-journal', []).filter((j) => j && j.sc),
  mouse: { x: 0, y: 0 }, danger: 0, ghosts: new Map(),
  fear: 2, em: '', emT: 0, eid: 0, labels: [], hearts: 0, flyHearts: [],
};
const SET = Object.assign({ volume: 0.8, voice: 1, sens: 1, quality: (matchMedia('(pointer: coarse)').matches || innerWidth < 760) ? 'medium' : 'high', brightness: 1, minimap: true }, store.get('gwimun-settings', {}));
if (SET.quality === 'low') SET.quality = 'medium'; // '낮음'은 없어졌다 → 보통

// ─────────────────────────── 꾸미기
let look = { ...DEFAULT_LOOK, ...store.get('gwimun-look', {}) };
// 닉네임을 비워 두면 입장을 못 해서 그냥 나가 버린다 → 처음 온 사람에게는 무서운 닉네임을 미리 채워 둔다
const RAND_NICK = () => ['겁쟁이', '떨리는', '도망치는', '숨은', '용감한', '길잃은', '소심한', '울보'][Math.random() * 8 | 0] + ['토끼', '고양이', '여우', '곰', '유령', '탐정', '인형', '미아'][Math.random() * 8 | 0] + (10 + (Math.random() * 90 | 0));
$('#nick').value = store.get('gwimun-nick', '') || RAND_NICK();
// 초대 링크(?p=코드)로 들어왔으면 입장하자마자 친구 파티에 들어간다
const JOIN_CODE = new URLSearchParams(location.search).get('p');
if (JOIN_CODE) history.replaceState(null, '', location.pathname);
let editMode = false;
const SWATCH = { body: SKIN, accent: ACCENT, hairColor: HAIRC, eyeColor: EYEC };
function buildOptions() {
  document.querySelectorAll('[data-sw]').forEach((el) => {
    const key = el.dataset.sw; el.innerHTML = '';
    SWATCH[key].forEach((c) => { const d = document.createElement('div'); d.className = 'sw' + (look[key] === c ? ' on' : ''); d.style.background = c; d.onclick = () => { look[key] = c; buildOptions(); refreshPreview(); }; el.appendChild(d); });
  });
  document.querySelectorAll('[data-chip]').forEach((el) => {
    const key = el.dataset.chip; el.innerHTML = '';
    OPTIONS[key].forEach(([v, label]) => { const d = document.createElement('div'); d.className = 'chip' + (look[key] === v ? ' on' : ''); d.textContent = label; d.onclick = () => { look[key] = v; buildOptions(); refreshPreview(); }; el.appendChild(d); });
  });
  $('#photoOn').checked = !!look.photoOn;
}
document.querySelectorAll('.ctab').forEach((b) => (b.onclick = () => {
  document.querySelectorAll('.ctab').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.cpanel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== b.dataset.tab));
}));
$('#randomBtn').onclick = () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  for (const k of Object.keys(OPTIONS)) look[k] = pick(OPTIONS[k])[0];
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
function refreshPreview() { clearTimeout(pvTimer); pvTimer = setTimeout(() => { if (pv.av) pv.scene.remove(pv.av); pv.av = createAvatar(look); pv.scene.add(pv.av); }, 30); }
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
    const finish = () => { if (done) return; done = true; sp.classList.add('out'); setTimeout(() => sp.remove(), 1500); setTimeout(() => $('#nick')?.focus(), 900); };
    sp.addEventListener('click', finish);
    const onKey = (e) => { if (done) return removeEventListener('keydown', onKey); if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); finish(); } };
    addEventListener('keydown', onKey);
    setTimeout(finish, 7500);
  }
}

$('#enterBtn').onclick = enter;
$('#nick').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
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
  if (!name) { $('#nick').focus(); $('#nick').placeholder = '닉네임을 입력하세요'; return; }
  store.set('gwimun-nick', name);
  socket.emit('hello', { name, look }, (res) => {
    S.resume = { id: res.id, token: res.token };
    S.me = res.id; S.myName = res.name; S.items = res.items; S.unlocked = res.unlocked || 0; S.hearts = res.hearts || 0; S.unlockedBy = res.unlockedBy || {}; S.scenarios = res.scenarios || [];
    voice.myId = res.id;
    $('#login').classList.add('hidden'); $('#hud').classList.remove('hidden');
    pvLoop = false;
    rebuildMyAvatar();
    renderInv(); renderRoster(); renderParty(); loadShareInfo();
    if (JOIN_CODE) socket.emit('party:joinCode', JOIN_CODE);
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
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false; // 그림자 효과 끔 (눈부심·무거움)
THREE.Texture.DEFAULT_ANISOTROPY = Math.min(16, renderer.capabilities.getMaxAnisotropy()); // 비스듬히 보이는 바닥·벽 무늬도 선명하게
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 220);
const fx = new FX(renderer, scene, camera);
fx.setQuality(SET.quality); fx.brightness = SET.brightness;
const fitCamera = () => { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 0.8 ? 72 : 55; camera.updateProjectionMatrix(); };
fitCamera();
addEventListener('resize', () => { fitCamera(); fx.resize(); });

const overlay = new THREE.Scene();
const cinema = new Cinema(renderer);
function addLabel(owner, sprite, y) { overlay.add(sprite); S.labels.push({ owner, sprite, y }); return sprite; }
function removeLabel(sprite) { overlay.remove(sprite); S.labels = S.labels.filter((l) => l.sprite !== sprite); sprite.material.map?.dispose(); sprite.material.dispose(); }
function removeAvatar(g) { if (!g) return; scene.remove(g); for (const l of S.labels.filter((l) => l.owner === g)) removeLabel(l.sprite); }
function updateLabels() {
  for (const l of S.labels) {
    if (!l.owner.parent) continue;
    l.sprite.visible = l.owner.visible;
    const lift = l.owner.userData.rig ? l.owner.userData.rig.position.y : 0;
    l.sprite.position.set(l.owner.position.x, l.owner.position.y + l.y + lift, l.owner.position.z);
  }
}
const CAM_MAX = 14; // 가장 멀리 줌아웃한 거리 — 로비·챕터에 들어갈 때마다 여기서 시작
const cam = { yaw: 0, pitch: 0.55, dist: CAM_MAX };
let myAvatar = null;
const me = { x: 0, z: 5, ry: Math.PI, moving: false };
if (window.__dbg) Object.assign(window.__dbg, { S, cam, me, scene, camera, renderer }); // ?debug 일 때만 (테스트용)
const fill = new THREE.PointLight('#ffe9d0', 2.6, 14, 1.2);
scene.add(fill);

function makeAvatar(id, name, lk, isMe) {
  const g = createAvatar(lk);
  setTag(g, name, isMe ? '#ffe08a' : '#fff');
  g.userData.name = name; g.userData.id = id;
  const spot = new THREE.SpotLight('#fff4dc', 0, 24, 0.55, 0.5, 1.2);
  spot.position.set(0, 0.72, 0.42);
  const tgt = new THREE.Object3D(); tgt.position.set(0, 0.2, 5); g.add(tgt); spot.target = tgt;
  g.add(spot); g.userData.spot = spot;
  // 내 캐릭터 발밑만 아주 은은하게 밝힌다 (어두운 맵에서 위치를 잃지 않게)
  if (isMe) { const foot = new THREE.PointLight('#ffe6c8', 1.1, 2.6, 1.6); foot.position.set(0, 0.35, 0); g.add(foot); }
  const beam = makeBeam(); beam.position.copy(spot.position); beam.visible = false; g.add(beam); g.userData.beam = beam;
  scene.add(g);
  return g;
}
function setTag(g, name, color) { if (g.userData.tag) removeLabel(g.userData.tag); g.userData.tag = addLabel(g, textSprite(name, { size: 30, color, bg: 'rgba(10,8,12,.72)', stroke: 'rgba(0,0,0,.85)' }), 1.55); }
function setLight(g, on) { g.userData.spot.intensity = on ? 160 : 0; g.userData.beam.visible = false; } // 빛줄기 효과는 눈부셔서 표시하지 않는다
function rebuildMyAvatar() {
  removeAvatar(myAvatar);
  myAvatar = makeAvatar(S.me, S.myName, look, true);
  myAvatar.position.set(me.x, 0, me.z); setLight(myAvatar, S.light);
}
function setBubble(g, text) {
  if (g.userData.bubble) removeLabel(g.userData.bubble);
  const b = textSprite(text, { size: 30, bg: '#f6efe2', color: '#140c10', maxW: 380, border: '#3a2a30', tail: true });
  addLabel(g, b, 2.0 + b.scale.y / 2); g.userData.bubble = b;
  clearTimeout(g.userData.bt); g.userData.bt = setTimeout(() => { if (g.userData.bubble === b) { removeLabel(b); g.userData.bubble = null; } }, 6000);
}

// ─────────────────────────── 월드 전환
// 화면이 바뀔 때(로비 · 챕터 · 영상 · 창) 눌려 있던 이동 입력을 모두 푼다 — 조이스틱이 숨겨지면 '손 뗌' 신호가 오지 않아 혼자 걷던 문제 방지
function resetInput() { S.joy = null; S.moveTarget = null; S.pendingInteract = null; for (const k in keys) keys[k] = false; const kb = document.getElementById('joyKnob'); if (kb) kb.style.transform = ''; document.getElementById('joy')?.classList.remove('act'); }
function enterLobby(pos) {
  resetInput();
  disposeWorld(scene, S.world);
  S.world = buildLobby(scene);
  S.room = 'lobby'; S.chapter = null; S.dark = false; S.objState = {}; S.mount = null; S.perch = null; me.y = 0;
  cam.dist = CAM_MAX; // 항상 최대 줌아웃으로 시작
  me.x = pos.x; me.z = pos.z;
  removeGhost(); clearOthers(); clearPings();
  $('#placeTitle').textContent = '미아 광장';
  $('#placeSub').textContent = '일곱 개의 관문 · 파티를 모아 이야기를 고르세요';
  S.themeNear = null; S.themeBubble = null; S.themeAnchor = null;
  $('#objective').classList.add('hidden');
  $('#lookBtn').classList.remove('hidden');
  audio.ambient('lobby');
  renderer.toneMappingExposure = 1.15;
  renderParty();
}
function enterChapter(state, showIntro = true) {
  resetInput();
  setGameClock(state.elapsed, state.timed); setHintsUsed(state.hintsUsed ?? 0);
  if (state.fear != null) { S.fear = state.fear; if (state.scenario) S.scenario = state.scenario; updateFearBadge(); }
  disposeWorld(scene, S.world);
  const ch = state.chapter;
  S.chapter = ch; S.room = 'game'; S.mount = null; S.perch = null; me.y = 0; closeThemePop(); noticeBox.classList.add('hidden');
  cam.dist = CAM_MAX; // 항상 최대 줌아웃으로 시작
  S.world = buildChapter(scene, ch, S.scenario?.id);
  S.objState = state.objects; S.dark = state.dark;
  me.x = ch.spawn[0] + (Math.random() - 0.5); me.z = ch.spawn[1];
  me.ry = Math.PI; cam.yaw = 0;
  S.moveTarget = null; S.pendingInteract = null;
  removeGhost(); clearOthers(); clearPings();
  $('#placeTitle').textContent = ch.title;
  $('#placeSub').textContent = ch.place;
  $('#objective').classList.remove('hidden');
  $('#lookBtn').classList.add('hidden');
  setObjective(state.objective, state.relics);
  applyObjState(); applyDark();
  audio.ambient({ gwimun: ch.rain ? 'rain' : 'gwimun', ophelia: 'ship', doll: 'doll', hospital: 'hospital', camp: 'camp', west: 'west', kimono: 'kimono', clown: 'clown', park: 'park', mia: 'mia' }[S.scenario?.id] || 'horror');
  renderer.toneMappingExposure = 1.7;
  if (showIntro && ch.intro) { queueStory({ ...ch.intro, sound: 'story' }); addJournal(ch.intro.title, ch.intro.text, 'story'); }
  if (!document.body.classList.contains('mobile') && !store.get('gwimun-tutorial', false)) { store.set('gwimun-tutorial', true); setTimeout(() => toast('팁: F 손전등 · C 웅크리기(귀신에게 덜 들킴) · G 위치 찍기 · J 수첩'), 4000); }
  renderParty();
}
function clearOthers() { for (const [, g] of S.others) removeAvatar(g); S.others.clear(); }
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
function setHintsUsed(n) { if (n == null) return; S.hintsUsed = n; $('#hintUsed').textContent = `💡 사용한 힌트 ${n}개`; }
const fmtClock = (ms) => { const d = Math.floor(ms / 100); const m = Math.floor(d / 600), s = Math.floor((d % 600) / 10); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d % 10}`; };
function updateGameTimer() {
  const t = $('#gameTimer'); const show = S.room === 'game' && !!S.clock;
  t.classList.toggle('hidden', !show); if (!show) return;
  const ms = S.clock.stop ?? performance.now() - S.clock.base;
  t.textContent = `⏱ ${fmtClock(Math.max(0, ms))}${S.clock.timed ? '' : ' *'}`;
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
  if (!S.me || loginOpen() || cinema.active) return;
  if (S.storyOpen && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) { e.preventDefault(); closeStory(); return; }
  if (e.code === 'Escape') { if (S.modalOpen) closeModal(); hideMenus(); if (typing()) document.activeElement.blur(); S.combining = null; renderInv(); return; }
  if (S.modalOpen) { if (S.lockCtx) lockKey(e); return; }
  if (e.code === 'Enter') { if (typing()) return; e.preventDefault(); $('#chatInput').focus(); return; }
  if (typing()) { if (e.code === 'Tab' && document.activeElement === $('#chatInput')) { e.preventDefault(); setChatCh(S.chatCh === 'all' ? 'party' : 'all'); } return; }
  keys[e.code] = true;
  if (e.repeat && ['Space', 'KeyE', 'KeyF', 'KeyX', 'KeyT', 'KeyQ', 'KeyG'].includes(e.code)) { e.preventDefault(); return; } // 누르고 있어도 한 번만 (키 반복 입력 무시)
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
  if (/^Digit[1-9]$/.test(e.code)) { const i = Number(e.code.slice(5)) - 1; if (S.inv[i]) primaryItem(S.inv[i], i); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyC' && S.crouch) { S.crouch = false; updateStatus(); } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (S.crouch) { S.crouch = false; updateStatus(); } });

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 1) { e.preventDefault(); sendPing(); return; }
  drag = { x: e.clientX, y: e.clientY, moved: 0, btn: e.button }; canvas.setPointerCapture(e.pointerId); hideMenus(); if (typing()) document.activeElement.blur();
});
canvas.addEventListener('pointermove', (e) => {
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
  if (id) { const ent = S.world.objects[id]; label = (ent.done ? '✓ ' : '') + (ent.data.label || '') + (distTo(ent) > reach(ent) ? '  (클릭하면 다가감)' : ''); }
  else if (!th) { const av = pickAvatar(e.clientX, e.clientY); if (av) label = `${av.userData.name} (클릭: 메뉴)`; }
  canvas.style.cursor = label ? 'pointer' : 'default';
  if (label) { tt.textContent = label; tt.style.left = e.clientX + 14 + 'px'; tt.style.top = e.clientY + 14 + 'px'; tt.classList.remove('hidden'); } else tt.classList.add('hidden');
}
function onClick(e) {
  if (!S.me || S.modalOpen) return;
  if (S.room === 'lobby') { const th = pickTheme(e.clientX, e.clientY); if (th) { openThemePop(th); return; } }
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
function interact(id) { if (String(id).startsWith('L:')) return lobbyAct(id.slice(2)); audio.play('click'); socket.emit('game:interact', id); }

// 위치 찍기 (파티원에게 표시)
function sendPing() {
  if (!S.me) return;
  const p = groundAt(S.mouse.x, S.mouse.y);
  const x = p ? p.x : me.x, z = p ? p.z : me.z;
  socket.emit('ping', { x, z });
}
const pingGeo = new THREE.CylinderGeometry(0.08, 0.3, 4, 12, 1, true);
socket.on('ping', ({ x, z, from }) => {
  const m = new THREE.Mesh(pingGeo, new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, 2, z); scene.add(m);
  const label = textSprite(`📍 ${from}`, { size: 28, bg: 'rgba(120,20,20,.85)' }); label.position.set(x, 4.3, z); overlay.add(label);
  S.pings.push({ x, z, m, label, until: performance.now() + 5000 });
  audio.play('pipe');
  addChat({ channel: 'system', text: `📍 ${from} 님이 위치를 찍었습니다.` });
});
function clearPings() { for (const p of S.pings) { scene.remove(p.m); overlay.remove(p.label); } S.pings = []; clearCallouts(); }

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
function collide(nx, nz) {
  const cols = S.world?.colliders || [];
  for (let k = 0; k < 2; k++) for (const c of cols) {
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
    else { const p = mountPos(); if (p) { me.x = p.x; me.z = p.z; me.y = p.y; me.ry = wrapAng(p.ry); } me.moving = false; myAvatar.position.set(me.x, me.y, me.z); myAvatar.rotation.y = me.ry; return; }
  }
  let vx = 0, vz = 0;
  const runKey = !!(keys.ShiftLeft || keys.ShiftRight);
  const sneak = !!((keys.KeyV && !runKey) || S.mSneak) && !blocked;
  if (sneak !== !!S.sneak) { S.sneak = sneak; updateStatus(); }
  const run = !!(runKey || (S.mRun && S.joy)) && !S.crouch && !sneak;
  if (run !== S.run) { S.run = run; updateStatus(); }
  const speed = sneak ? 1.5 : S.crouch ? 2.0 : run ? 6.2 : 4.0;
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
  if (S.em) { S.emT += dt; const d = EMOTE_DUR[S.em]; if ((me.moving && S.em !== 'jump') || (d && S.emT > d)) S.em = ''; }
  if (me.moving) {
    const ox = me.x, oz = me.z;
    const nx = me.x + vx * speed * dt, nz = me.z + vz * speed * dt;
    if (S.perch) { const q = S.perch; if (Math.abs(nx - q.x) <= q.hw && Math.abs(nz - q.z) <= q.hd) { me.x = nx; me.z = nz; } else { S.perch = null; me.y = 0; [me.x, me.z] = collide(nx, nz); } }
    else [me.x, me.z] = collide(nx, nz);
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
  sendT += dt; if (sendT < 0.066 || !S.me) return; sendT = 0;
  const k = `${(me.y || 0).toFixed(2)},${me.x.toFixed(2)},${me.z.toFixed(2)},${me.ry.toFixed(2)},${me.moving},${S.run},${S.crouch},${!!S.sneak},${S.em},${S.eid},${rideTag()}`;
  if (k === lastSent) return; lastSent = k;
  socket.emit('move', { x: me.x, z: me.z, y: me.y || 0, ry: me.ry, anim: me.moving, run: S.run && me.moving, crouch: S.crouch || S.sneak, sneak: !!S.sneak, em: S.em, eid: S.eid, ride: rideTag() });
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
  let best = 1e9;
  for (const [id, ent] of Object.entries(S.world.objects)) {
    if (!ent.visible || ent.data.kind === 'deco') continue;
    const d = distTo(ent);
    if (ent.marker) { ent.marker.material.opacity = d < 6 ? (ent.done ? 0.15 : 0.45 + Math.sin(t * 3 + d) * 0.25) : 0; ent.marker.material.color.set(ent.done ? '#888' : '#ffe9a8'); }
    if (d <= reach(ent) && d < best) { best = d; S.nearest = id; }
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
socket.on('look', ({ id, lv, look: lk }) => {
  S.lookReq.delete(id);
  S.looks.set(id, { lv, look: lk });
  const g = S.others.get(id);
  if (g) { removeAvatar(g); S.others.delete(id); }
});
socket.on('state', ({ players, ghosts }) => {
  const seen = new Set();
  for (const p of players) {
    if (p.id === S.me) { if (myAvatar) setLight(myAvatar, p.light); continue; }
    seen.add(p.id);
    const lk = S.looks.get(p.id);
    if (!lk || lk.lv !== p.lv) { if (!S.lookReq.has(p.id)) { S.lookReq.add(p.id); socket.emit('look:get', p.id); } if (!lk) continue; }
    let g = S.others.get(p.id);
    if (!g || g.userData.lv !== lk.lv) {
      const pos = g ? g.position.clone() : new THREE.Vector3(p.x, 0, p.z);
      if (g) removeAvatar(g);
      g = makeAvatar(p.id, p.name, lk.look, false);
      g.userData.lv = lk.lv; g.position.copy(pos);
      S.others.set(p.id, g);
    }
    if (g.userData.eid !== p.eid || g.userData.em !== p.em) { g.userData.eid = p.eid; g.userData.em = p.em; g.userData.emT = 0; if (p.em === 'jump') audio.play('pickup'); }
    g.userData.target = p;
    setLight(g, p.light);
    const inParty = !!S.party?.members.some((m) => m.id === p.id);
    if (g.userData.inParty !== inParty) { g.userData.inParty = inParty; setTag(g, (inParty ? '★ ' : '') + p.name, inParty ? '#8fd3ff' : '#fff'); }
  }
  for (const [id, g] of S.others) if (!seen.has(id)) { removeAvatar(g); S.others.delete(id); }
  const live = new Set();
  if (ghosts && S.room === 'game') {
    for (const gs of ghosts) {
      live.add(gs.i);
      let e = S.ghosts.get(gs.i);
      if (!e || e.G.userData.type !== gs.type) { if (e) scene.remove(e.G); const G = createGhost(gs.type); G.position.set(gs.x, 0, gs.z); scene.add(G); e = { G, st: gs, soundT: 0 }; S.ghosts.set(gs.i, e); }
      e.st = gs;
    }
  }
  for (const [i, e] of S.ghosts) if (!live.has(i)) { scene.remove(e.G); S.ghosts.delete(i); }
  if (!S.ghosts.size) { S.danger = 0; $('#vignette').classList.remove('danger'); audio.chase(0); }
});
function removeGhost() { for (const e of S.ghosts.values()) scene.remove(e.G); S.ghosts.clear(); S.danger = 0; $('#vignette').classList.remove('danger'); }
socket.on('player:leave', (id) => { const g = S.others.get(id); if (g) { removeAvatar(g); S.others.delete(id); } });

let ghostSoundT = 0;
function updateOthers(dt, t) {
  for (const g of S.others.values()) {
    const p = g.userData.target; if (!p) continue;
    if (p.ride && S.room === 'lobby') {
      const [rn, si] = p.ride.split(':'); const rp = S.world?.rides?.[rn]?.pos(Number(si));
      if (rp) { g.position.set(rp.x, rp.y, rp.z); g.rotation.y = rp.ry; g.userData.emT = (g.userData.emT || 0) + dt; animateAvatar(g, dt, false, t, false, p.em || null, g.userData.emT); continue; }
    }
    const k = Math.min(1, dt * 10);
    g.position.x += (p.x - g.position.x) * k; g.position.z += (p.z - g.position.z) * k; g.position.y += ((p.y || 0) - g.position.y) * k;
    let diff = p.ry - g.rotation.y; diff = wrapAng(diff);
    g.rotation.y += diff * k;
    g.userData.emT = (g.userData.emT || 0) + dt;
    animateAvatar(g, dt, !!p.anim, t, !!p.crouch, p.em || null, g.userData.emT);
  }
  S.danger = 0;
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
      const sounds = { janitor: ['stomp', 0.55], elder: ['pipe', 2.2], woman: ['whisper', 2.4], mudang: ['crawl', 0.45], child: ['giggle', 3], sailor: ['water_step', 0.6], doll: ['porcelain', 0.4], father: ['snip', 1.1], dalgyal: ['hum', 2.6], slender: ['static_hiss', 1.8], nurse: ['cart', 0.9], headless: ['drag', 0.8], shadow: ['whisper', 3] };
      const [snd, gap] = sounds[gs.type] || ['whisper', 2];
      e.soundT = gap * (gs.mode === 'hunt' ? 1 : 1.8) * (0.6 + d / 13);
      if (Math.random() < 1 - d / 15) audio.play(snd);
      if (gs.type === 'mudang' && Math.random() < 0.2) audio.play('jingle');
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
  const size = S.room === 'lobby' ? [60, 60] : S.world.size || [26, 22];
  const sc = (Math.min(W, H) - 16) / Math.max(size[0], size[1]);
  const P = (x, z) => [W / 2 + x * sc, H / 2 + z * sc];
  mmx.strokeStyle = 'rgba(255,255,255,.25)'; mmx.lineWidth = 1;
  if (S.room === 'lobby') { mmx.beginPath(); mmx.arc(W / 2, H / 2, 28.5 * sc, 0, Math.PI * 2); mmx.stroke(); mmx.fillStyle = 'rgba(63,143,200,.8)'; { const [px2, pz2] = P(0, -25.6); mmx.beginPath(); mmx.arc(px2, pz2, 4.6 * sc, 0, Math.PI * 2); mmx.fill(); } mmx.strokeStyle = 'rgba(255,63,108,.55)'; mmx.lineWidth = 2; mmx.beginPath(); mmx.arc(W / 2, H / 2, 22 * sc, 0, Math.PI * 2); mmx.stroke(); const fp = S.world.rides?.coaster?.front(); if (fp) { const [cx2, cz2] = P(fp.x, fp.z); mmx.fillStyle = '#ff3f6c'; mmx.beginPath(); mmx.arc(cx2, cz2, 4, 0, Math.PI * 2); mmx.fill(); } }
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
  for (const g of S.others.values()) { const [x, z] = P(g.position.x, g.position.z); mmx.fillStyle = g.userData.inParty ? '#8fd3ff' : '#ddd'; mmx.beginPath(); mmx.arc(x, z, 3.5, 0, Math.PI * 2); mmx.fill(); }
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
    updateOthers(dt, t);
    updateCamera(dt);
    updateNearest(t);
    netSend(dt);
    S.world.update?.(t, dt);
    updateThemeBubble();
    // 보조광: 머리 위가 아니라 카메라 쪽에서 넓게 비춰 캐릭터 머리가 하얗게 빛나지 않게 한다
    fill.position.copy(camera.position); fill.position.y = Math.min(fill.position.y, 3.8);
    fill.intensity = S.room === 'lobby' ? 2.2 : 2.6;
    if (clickRing.material.opacity > 0) { clickRing.material.opacity -= dt * 1.5; clickRing.scale.multiplyScalar(1 + dt * 1.5); }
    const now = performance.now();
    for (const p of S.pings) { p.m.material.opacity = 0.35 + Math.sin(t * 8) * 0.25; if (now > p.until) { scene.remove(p.m); overlay.remove(p.label); } }
    S.pings = S.pings.filter((p) => now <= p.until);
    if (S.callouts.length) updateCallouts(now);
    drawMinimap(dt, t);
    randomHorror(dt);
  }
  updateLabels(); updateHearts(dt);
  const inLobby = S.room === 'lobby';
  if (inLobby !== S._lobbyCls) { S._lobbyCls = inLobby; document.body.classList.toggle('in-lobby', inLobby); }
  updateGameTimer();
  fx.render(t, { danger: S.danger, mode: inLobby ? 'lobby' : 'game' });
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(overlay, camera); renderer.autoClear = true;
}
loop();

// 로비 테마 관문: 가까이 가면 설명 말풍선
const THEME_INFO = {
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
  y += 14; x.font = fH; x.fillStyle = info.color; x.fillText('▶ 파티 패널에서 이 이야기를 고르고 [방탈출 시작]', pad, y);
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
  if (r < 0.3 && S.world.ceiling.length && !S.dark) { S.world.ceiling.forEach((c) => (c.light.intensity = 0)); audio.play('knock'); setTimeout(() => applyDark(), 1200 + Math.random() * 1500); }
  else if (r < 0.55) { const g = createGhost('woman'); g.position.set(me.x - Math.sin(me.ry) * 3.5, 0, me.z - Math.cos(me.ry) * 3.5); g.lookAt(me.x, 0, me.z); scene.add(g); audio.play('breath'); setTimeout(() => scene.remove(g), 900); }
  else if (r < 0.72) {
    // 아이 귀신이 옆을 스쳐 달려간다
    const c = createGhost('child'); const side = Math.random() < 0.5 ? -1 : 1;
    const ax = Math.cos(me.ry) * side, az = -Math.sin(me.ry) * side;
    c.position.set(me.x + ax * 5 + Math.sin(me.ry) * 3, 0, me.z + az * 5 + Math.cos(me.ry) * 3); scene.add(c); audio.play('giggle');
    const start = performance.now();
    const run = () => { const k = (performance.now() - start) / 900; c.position.x -= ax * 0.18; c.position.z -= az * 0.18; c.rotation.y = Math.atan2(-ax, -az); if (k < 1) requestAnimationFrame(run); else scene.remove(c); };
    run();
  } else if (r < 0.8) scare(Math.random() < 0.5 ? 'flash' : 'random', 'random');
  else audio.play('whisper');
}

// ─────────────────────────── 서버 이벤트: 게임
socket.on('enter:lobby', (pos) => { closeModal(); $('#ending').classList.add('hidden'); enterLobby(pos); });
socket.on('inv', (inv) => { const before = S.inv.length; S.inv = inv; if (!inv.includes('flashlight')) S.light = false; renderInv(); if (inv.length > before) audio.play('pickup'); });
socket.on('game:start', async (st) => {
  closeModal(); S.fear = st.fear ?? 2;
  S.scenario = st.scenario || null; updateFearBadge();
  if (st.chapterIdx === 0 && (st.elapsed ?? 0) < 8000 && S.scenario?.id) resetJournalFor(S.scenario.id); // 처음부터 새로 시작
  if (st.chapterIdx === 0 && !S.skipPrologue) { resetInput(); await cinema.play(st.scenario?.cine?.intro || 'prologue', { looks: partyLooks(), audio, fear: S.fear }); }
  enterChapter(st, true);
});
socket.on('game:chapter', (st) => { closeModal(); S.storyQueue = []; closeStory(true); fadeTransition(() => enterChapter(st, true)); });
socket.on('game:sync', (st) => {
  setHintsUsed(st.hintsUsed); if (st.elapsed != null && S.clock && !S.clock.stop) setGameClock(st.elapsed);
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
        for (const ch of sg.letters) { if (!alive()) return; lamp.textContent = ch; audio.play('creak'); out.textContent += ch + ' '; await wait(1100); }
        lamp.textContent = '…'; await wait(1500);
      }
    }
  };
  again.onclick = () => { stop = true; setTimeout(play, 300); };
  play();
}
socket.on('lock:result', ({ ok }) => {
  const d = $('.lock-display');
  if (ok) { audio.play('unlock'); if (d) d.classList.add('ok'); setTimeout(closeModal, 500); }
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
socket.on('game:coopPulse', () => audio.play('creak'));
socket.on('game:ending', (e) => {
  if (S.clock) S.clock.stop = e.ms ?? (performance.now() - S.clock.base);
  closeModal(); S.storyQueue = []; closeStory(true);
  addJournal(e.title, e.text, 'story');
  setTimeout(async () => {
    resetInput(); await cinema.play(e.cine || (e.type === 'true' ? 'ending_true' : 'ending_normal'), { looks: partyLooks(), audio, fear: S.fear });
    $('#endTitle').textContent = e.title; $('#endText').textContent = e.text;
    const icons = e.icons || ['👟', '🃏', '🎀', '🌀', '🔮', '➰', '🏷️'];
    $('#endRelics').textContent = icons.map((ic, i) => (i < e.relics ? ic : '·')).join(' ') + `   (${e.relics}/${e.total || 7})`;
    let tm = $('#endTime'); if (!tm) { tm = el('div', 'end-time'); tm.id = 'endTime'; $('#endRelics').after(tm); }
    tm.textContent = e.ms ? `⏱ 클리어 시간 ${fmtMs(e.ms)} · 💡 힌트 ${e.hints ?? 0}개${e.full ? ' — 🏆 랭킹에 기록되었습니다' : ' (이어하기는 랭킹에 기록되지 않아요)'}` : '';
    $('#ending').classList.remove('hidden');
    audio.ambient(null); audio.play(e.type === 'true' || S.fear === 0 ? 'bell' : 'scream');
  }, 1200);
});
$('#endBtn').onclick = () => { $('#ending').classList.add('hidden'); socket.emit('party:quit'); };
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
function openModal(title, text, bodyEl) {
  resetInput();
  S.modalOpen = true; S.lockCtx = null; hideMenus();
  $('#modal .modal-card').classList.remove('doc-mode');
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
    ctx.val.push(i); audio.tone?.(520 + ctx.val.length * 60, 0.25); draw();
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
  if (it === 'flashlight') { S.light = !S.light; audio.play('click'); if (myAvatar) setLight(myAvatar, S.light); renderInv(); }
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
function setChatCh(ch) {
  S.chatCh = ch;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.ch === ch));
  $('#chatInput').classList.toggle('party', ch === 'party');
  $('#chatInput').placeholder = ch === 'party' ? '[파티] 메시지 (Tab: 전환)' : '[전체] 메시지 (Tab: 전환)';
  if (ch === 'party') $('#partyUnread').classList.add('hidden');
  renderChatFilter();
}
document.querySelectorAll('.tab').forEach((t) => (t.onclick = () => setChatCh(t.dataset.ch)));
$('#chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const text = e.target.value.trim(); if (text) socket.emit('chat', { channel: S.chatCh, text }); e.target.value = ''; e.target.blur(); }
  if (e.key === 'Escape') e.target.blur();
});
const chatLog = [];
function addChat(m) {
  chatLog.push(m); if (chatLog.length > 200) chatLog.shift();
  if (m.channel === 'party' && S.chatCh !== 'party') $('#partyUnread').classList.remove('hidden');
  renderChatFilter();
  if (m.fromId && m.fromId !== S.me) { const g = S.others.get(m.fromId); if (g) setBubble(g, m.text); }
  if (m.fromId === S.me && myAvatar) setBubble(myAvatar, m.text);
}
function renderChatFilter() {
  const box = $('#chatLog'); box.innerHTML = '';
  for (const m of chatLog) {
    if (S.chatCh === 'party' && m.channel === 'all') continue;
    const d = el('div', 'm ' + m.channel);
    if (m.channel === 'system') d.textContent = m.text;
    else { d.appendChild(el('span', 'ch', m.channel === 'party' ? '[파티]' : '[전체]')); d.appendChild(el('b', null, m.from + ': ')); d.appendChild(document.createTextNode(m.text)); }
    box.appendChild(d);
  }
  box.scrollTop = box.scrollHeight;
}
socket.on('chat', addChat);

// ─────────────────────────── 파티 & 접속자
socket.on('roster', (list) => { S.roster = list; renderRoster(); });
socket.on('party', (p) => { S.party = p; renderParty(); if (p && p.leader === S.me && !p.instId && (!p.pick || p.pick.n !== p.members.length)) sendPick(); renderRoster(); voice.setParty(p ? p.members.map((m) => m.id) : []); });
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
  if (!p) box.appendChild(el('div', 'muted', '파티 없음 · 접속자 목록에서 초대하거나 혼자 시작하세요'));
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
  const scs = p?.scenarios || S.scenarios || [];
  const ssel = $('#scenarioSel');
  const prevSc = ssel.value || store.get('gwimun-scenario', 'mia');
  if (ssel.options.length !== scs.length) { ssel.innerHTML = ''; scs.forEach((x) => { const o = el('option', null, `🚪 ${x.title}  ${diffStars(x.difficulty || 3)}`); o.value = x.id; o.title = x.desc; ssel.appendChild(o); }); }
  if ([...ssel.options].some((o) => o.value === prevSc)) ssel.value = prevSc;
  const scInfo = scs.find((x) => x.id === ssel.value) || scs[0];
  const ub = (p ? p.unlockedBy : S.unlockedBy) || {};
  const unlocked = ub[scInfo?.id]?.chapter ?? 0;
  $('#scenarioDesc').textContent = scInfo ? diffText(scInfo.difficulty || 3) + '\n' + scInfo.desc + (ub[scInfo.id]?.cleared ? ' · ✅ 클리어' : '') : '';
  (scInfo?.chapters || []).forEach((t, i) => { if (i <= unlocked) { const o = el('option', null, (i === 0 ? '처음부터: ' : '이어하기: ') + t); o.value = i; sel.appendChild(o); } });
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  $('#startBtn').textContent = p && p.members.length > 1 ? '방탈출 시작' : '혼자 시작';
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
      $('#fearSel').value = String(pk.fear);
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
$('#fearSel').addEventListener('change', sendPick);
$('#rankBtn').onclick = () => openRank();

// ─────────────────────────── 로비 놀이공원: 앉기 · 올라가기 · 놀이기구 타기
function mountPos() {
  const m = S.mount; if (!m) return null;
  if (m.kind === 'ride') return S.world?.rides?.[m.ride]?.pos(m.seat) || null;
  return m.seat;
}
function dismount() {
  const m = S.mount; if (!m) return;
  S.mount = null; S.em = ''; me.y = 0; me.ry = wrapAng(me.ry); S.moveTarget = null;
  if (m.kind === 'ride') {
    const it = S.world?.interactives?.find((i) => i.id === m.ride);
    const ex = S.world?.rides?.[m.ride]?.exit;
    if (ex) { me.x = ex.x; me.z = ex.z; }
    else if (it) { const a = Math.atan2(me.x - it.x, me.z - it.z); const d = m.ride === 'carousel' ? 3.9 : 0; me.x = it.x + Math.sin(a) * d; me.z = m.ride === 'wheel' ? it.z + 0.6 : it.z + Math.cos(a) * d; if (m.ride === 'wheel') me.x = it.x; }
  } else { me.x += Math.sin(me.ry) * 0.7; me.z += Math.cos(me.ry) * 0.7; }
  [me.x, me.z] = collide(me.x, me.z);
}
function lobbyAct(id) {
  if (S.mount) { dismount(); toast('내렸어요.'); return; }
  if (S.perch && id === 'off') { S.perch = null; me.y = 0; [me.x, me.z] = collide(me.x + Math.sin(me.ry) * 1.2, me.z + Math.cos(me.ry) * 1.2); return; }
  const it = S.world?.interactives?.find((i) => i.id === id); if (!it) return;
  audio.play('click');
  if (it.kind === 'ride') {
    const r = S.world.rides[it.id]; let seat = -1;
    const busy = new Set();
    for (const g of S.others.values()) { const rd = g.userData.target?.ride; if (rd && rd.startsWith(it.id + ':')) busy.add(Number(rd.split(':')[1])); }
    if (r.pick) seat = r.pick(busy);
    else { let best = 1e9; for (let i = 0; i < r.seats; i++) { if (busy.has(i)) continue; const p = r.pos(i); const d = Math.hypot(p.x - me.x, p.z - me.z); if (d < best) { best = d; seat = i; } } }
    if (seat < 0) { toast(`${it.label} 자리가 꽉 찼어요. 잠시 후 다시 타 보세요!`); return; }
    S.mount = { kind: 'ride', ride: it.id, seat }; S.perch = null; S.crouch = false;
    if (r.sit) { S.em = 'sit'; S.emT = 0; S.eid++; }
    toast(it.id === 'coaster' ? `🎢 롤러코스터 ${Math.floor(seat / 2) + 1}번째 칸에 탔어요! (움직이거나 다시 누르면 탑승장에서 내려요)` : `${it.label}에 탔어요! (움직이거나 다시 누르면 내려요)`);
  } else if (it.kind === 'sit') {
    S.mount = { kind: 'sit', seat: { ...it.seat } }; S.perch = null; S.em = 'sit'; S.emT = 0; S.eid++;
  } else if (it.kind === 'climb') {
    S.perch = it.perch; me.x = it.perch.x; me.z = it.perch.z; me.y = it.perch.y; S.mount = null;
    toast('테이블 위에 올라갔어요! (가장자리로 걸어가면 내려와요)');
  }
}
function lobbyNearest() {
  S.nearest = null; S.nearestVerb = null;
  const p = $('#prompt');
  if (S.mount) { S.nearest = 'L:off'; S.nearestVerb = '내리기'; }
  else if (S.perch) { S.nearest = 'L:off'; S.nearestVerb = '내려가기'; }
  else {
    let best = 1e9;
    for (const it of S.world?.interactives || []) { const d = Math.hypot(it.x - me.x, it.z - me.z); if (d < it.r && d < best) { best = d; S.nearest = 'L:' + it.id; S.nearestVerb = it.verb; S.nearestLabel = it.label; } }
  }
  if (S.nearest && !S.modalOpen) { p.innerHTML = `<kbd>E</kbd>${S.nearest === 'L:off' ? '' : (S.nearestLabel || '') + ' '}${S.nearestVerb}`; p.classList.remove('hidden'); }
  else p.classList.add('hidden');
}

// ─────────────────────────── 테마 관문 클릭 → 가운데 팝업 (배경 어둡게, 바깥 누르면 닫힘)
function pickTheme(cx, cy) {
  const ex = S.world?.exhibits; if (!ex) return null;
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  for (const h of ray.intersectObjects(ex.map((e) => e.group), true)) { const e = ex.find((x) => { let o = h.object; while (o) { if (o === x.group) return true; o = o.parent; } return false; }); if (e) return e.id; }
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
  fear.onchange = () => { $('#fearSel').value = fear.value; sendPick(); };
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
    const go = el('button', 'btn primary tpop-go', p && p.members.length > 1 ? `▶ ${sc?.short || ''} 시작` : `▶ 혼자 시작`);
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
function openRank(tab) {
  // 창은 바로 띄우고, 서버 응답이 오면 채운다 (응답이 없으면 안내)
  const holder = el('div', 'rank'); holder.appendChild(el('div', 'muted', '랭킹을 불러오는 중…'));
  openModal('🏆 클리어 랭킹', '테마를 1장부터 끝까지 클리어한 시간 순위 (상위 10팀)', holder);
  let done = false;
  const timer = setTimeout(() => { if (done || $('#modalBody').firstChild !== holder) return; holder.innerHTML = ''; holder.appendChild(el('div', 'muted', '랭킹을 불러오지 못했어요. 잠시 후 다시 눌러 주세요. (계속 안 되면 서버를 다시 켜 주세요)')); }, 5000);
  socket.emit('rank:get', (data) => {
    done = true; clearTimeout(timer);
    if ($('#modal').classList.contains('hidden') || $('#modalBody').firstChild !== holder) return; // 그새 닫았거나 다른 창을 열었다
    const wrap = holder; wrap.innerHTML = '';
    const tabs = el('div', 'rank-tabs'); const list = el('div', 'rank-list');
    const scs = S.scenarios || [];
    let cur = tab || scs[0]?.id;
    const draw = () => {
      tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === cur));
      list.innerHTML = '';
      const rows = data?.[cur] || [];
      if (!rows.length) { list.appendChild(el('div', 'muted', '아직 기록이 없어요. 처음부터 클리어하면 첫 기록이 됩니다!')); return; }
      rows.forEach((r, i) => {
        const row = el('div', 'rank-row' + (r.names.includes(S.myName) ? ' me' : ''));
        row.append(el('span', 'rank-no', ['🥇', '🥈', '🥉'][i] || String(i + 1)), el('span', 'rank-names', r.names.join(', ')), el('span', 'rank-time', fmtMs(r.ms)), el('span', 'rank-meta', `${FEAR_SHORT[r.fear] ?? ''} · 💡${r.hints ?? '-'}`));
        if (r.ending === 'true') { const tb = el('span', 'rank-true', '🏅 진'); tb.title = '진엔딩으로 클리어'; row.querySelector('.rank-names').append(' ', tb); }
        list.appendChild(row);
      });
    };
    scs.forEach((s) => { const b = el('button', 'btn tiny', s.short); b.dataset.id = s.id; b.onclick = () => { cur = s.id; draw(); }; tabs.appendChild(b); });
    wrap.append(tabs, list);
    try { draw(); } catch (e) { list.innerHTML = ''; list.appendChild(el('div', 'muted', '랭킹을 표시하지 못했어요.')); console.error(e); }
  });
}
 $('#chapterSel').addEventListener('change', sendPick);
$('#fearSel').value = String(store.get('gwimun-fear', 2));
$('#leaveBtn').onclick = () => socket.emit('party:leave');
$('#quitBtn').onclick = () => { S.mobileClose?.(); askConfirm('로비로 돌아가기', '정말 로비로 돌아갈까요? 도달한 챕터는 이어하기로 저장됩니다.', '로비로 돌아가기', () => socket.emit('party:quit')); };
function renderRoster() {
  const box = $('#roster'); box.innerHTML = '';
  const others = S.roster.filter((r) => r.id !== S.me);
  $('#rosterCount').textContent = `${S.roster.length}명`;
  if (!others.length) box.appendChild(el('div', 'muted', '다른 접속자가 없습니다. 친구에게 주소를 알려주세요!'));
  const canInvite = !S.party || (S.party.leader === S.me && S.party.members.length < 4 && !S.party.instId);
  for (const r of others) {
    const d = el('div', 'rp');
    d.appendChild(el('span', null, r.name));
    if (r.hearts) d.appendChild(el('span', 'tag', `💖${r.hearts}`));
    if (r.inGame) d.appendChild(el('span', 'tag', '· 방탈출 중'));
    else if (r.partyId) d.appendChild(el('span', 'tag', r.partyId === S.party?.id ? '· 우리 파티' : '· 파티 있음'));
    const hb = el('button', 'btn tiny', '💖'); hb.title = '하트 보내기'; hb.onclick = () => socket.emit('heart', r.id); d.appendChild(hb);
    if (canInvite && !r.partyId && !r.inGame) { const b = el('button', 'btn tiny', '초대'); b.style.marginLeft = '4px'; b.onclick = () => socket.emit('party:invite', r.id); d.appendChild(b); }
    box.appendChild(d);
  }
}
$('#rosterToggle').onclick = () => { const r = $('#roster'); r.classList.toggle('hidden'); $('#rosterToggle').textContent = r.classList.contains('hidden') ? '펼치기' : '접기'; };
function openPlayerMenu(id, name, x, y) {
  const m = $('#playerMenu'); m.innerHTML = '';
  m.appendChild(el('div', 'nm', name));
  const r = S.roster.find((q) => q.id === id);
  const canInvite = (!S.party || (S.party.leader === S.me && S.party.members.length < 4 && !S.party.instId)) && r && !r.partyId;
  if (canInvite) { const b = el('button', 'btn small', '🎟️ 파티 초대'); b.onclick = () => { socket.emit('party:invite', id); m.classList.add('hidden'); }; m.appendChild(b); }
  else m.appendChild(el('div', 'muted', r?.partyId && r.partyId === S.party?.id ? '같은 파티원' : '초대할 수 없음'));
  const h = el('button', 'btn small', '💖 하트 보내기'); h.onclick = () => { socket.emit('heart', id); m.classList.add('hidden'); }; m.appendChild(h);
  const w = el('button', 'btn small', '👋 인사하기'); w.onclick = () => { socket.emit('chat', { channel: 'all', text: `${name} 님 안녕하세요! 👋` }); m.classList.add('hidden'); }; m.appendChild(w);
  m.style.left = Math.min(x, innerWidth - 160) + 'px'; m.style.top = Math.min(y, innerHeight - 120) + 'px';
  m.classList.remove('hidden');
}

// ─────────────────────────── 음성
const voice = new Voice(socket, {
  onLevel: (id, lv) => { const m = document.querySelector(`.mic[data-id="${id}"]`); if (m) m.classList.toggle('speak', lv > 0.06); },
  onError: (msg) => toast('🎙️ ' + msg),
});
$('#micBtn').onclick = async () => {
  if (!S.party || S.party.members.length < 2) toast('음성 채팅은 파티원끼리만 연결됩니다. (지금은 마이크만 켜 둡니다)');
  const on = await voice.toggleMic();
  $('#micBtn').textContent = on ? '🎙️ 마이크 켜짐' : '🎙️ 마이크 꺼짐';
  $('#micBtn').classList.toggle('primary', on);
};

// ─────────────────────────── 설정
function saveSettings() {
  store.set('gwimun-settings', SET);
  audio.setVolume(SET.volume); voice.setVolume(SET.voice);
  fx.brightness = SET.brightness;
}
audio.setVolume(SET.volume);
$('#settingsBtn').onclick = () => {
  const wrap = el('div');
  const row = (label, input) => { const r = el('div', 'set-row'); r.append(el('span', null, label), input); wrap.appendChild(r); };
  const range = (key, min, max, step) => { const i = el('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = SET[key]; i.oninput = () => { SET[key] = Number(i.value); saveSettings(); }; return i; };
  row('효과음 볼륨', range('volume', 0, 1, 0.05));
  row('음성채팅 볼륨', range('voice', 0, 1, 0.05));
  row('마우스 감도', range('sens', 0.3, 2.5, 0.05));
  row('밝기', range('brightness', 0.6, 1.8, 0.05));
  const q = el('select'); [['high', '높음 (가장 선명)'], ['medium', '보통 (선명 · 가벼움)']].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; q.appendChild(o); });
  q.value = SET.quality; q.onchange = () => { SET.quality = q.value; fx.setQuality(SET.quality); saveSettings(); rebuildMyAvatar(); };
  row('그래픽 품질', q);
  const btns = el('div', 'set-btns');
  const sb = (label, fn) => { const b = el('button', 'btn', label); b.onclick = fn; btns.appendChild(b); };
  sb(SET.minimap ? '🗺 지도 끄기' : '🗺 지도 보기', () => { SET.minimap = !SET.minimap; saveSettings(); closeModal(); toast(SET.minimap ? '지도를 켰어요' : '지도를 껐어요'); });
  sb('👗 옷 갈아입기', () => { closeModal(); $('#lookBtn').click(); });
  sb('❔ 도움말', () => { closeModal(); $('#helpBtn').click(); });
  wrap.appendChild(btns);
  // 만든이 · 링크 · 후원
  const cr = el('div', 'credits');
  cr.innerHTML = `<div class="cr-row"><span>만든이</span><b>nexsixflux</b></div>
    <a class="cr-link" href="https://social.wanted.co.kr//community/profile/ZhZ6VwFkcMvwbQBAER6qEf?utm_source=wanted&utm_medium=share" target="_blank" rel="noopener">🔗 만든이 프로필 보러 가기 <span>›</span></a>
    <div class="cr-coffee"><b>☕ 커피 한 잔 후원하기</b><small>카카오페이 앱으로 QR을 찍어 주세요</small><img src="/kakaopay.png" alt="카카오페이 후원 QR" loading="lazy" /></div>`;
  wrap.appendChild(cr);
  openModal('⚙ 설정', '변경 사항은 자동으로 저장됩니다.', wrap);
};

// 제작자 후원 팝업 (오른쪽 ☕ 버튼)
$('#coffeeBtn').onclick = () => {
  const w = el('div', 'coffee-pop');
  w.innerHTML = `<img src="/kakaopay.png" alt="카카오페이 후원 QR" /><p class="coffee-msg">커피 한 잔은 큰 힘이 됩니다</p><small>카카오페이 앱으로 QR을 찍어 주세요</small>`;
  openModal('☕ 제작자 커피 한 잔 후원하기', '', w);
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
  [['W A S D / 방향키', '이동'], ['Shift', '달리기 (발소리 때문에 귀신이 멀리서도 알아챈다)'], ['C (누르고 있기)', '웅크리기 — 그 자리에서 방향만 돌리며 귀신에게 덜 들킨다. 떼면 일어선다'], ['V (누르고 있기)', '조심조심 걷기 — 아주 느리지만 귀신이 절대 눈치채지 못한다'], ['마우스 드래그 · 휠', '시점 회전 · 확대/축소'], ['R', '카메라를 캐릭터 뒤로'], ['클릭 / E', '조사 · 줍기 · 풀기 (멀리 있으면 자동으로 다가감)'], ['Space', '점프'], ['X', '감정표현 (춤·인사·엎드리기·놀래키기 등)'], ['F', '손전등 켜기/끄기'], ['T', '부적 태우기 (귀신 20초 퇴치)'], ['1 ~ 9', '아이템 바로 사용 (자물쇠 창에서는 버튼 입력)'], ['아이템 우클릭', '조합 · 파티원에게 건네기'], ['J', '수첩 — 본 단서가 자동 기록됨'], ['H', '힌트'], ['G / 휠 클릭', '마우스 위치를 파티원에게 찍어 주기'], ['Q', '외치기 — "어이!" "여기야!" 하며 내 위치를 바닥 파형과 지도로 알리기'], ['M', '미니맵 켜기/끄기'], ['💖 (접속자 목록·캐릭터 클릭)', '친구에게 하트 보내기'], ['Enter · Tab', '채팅 · 전체/파티 전환']].forEach(([a, b]) => { k.append(el('kbd', null, a), el('span', null, b)); });
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
function doEmote(id) {
  if (!myAvatar) return;
  S.em = id; S.emT = 0; S.eid++;
  if (id === 'jump') audio.play('pickup');
  if (id === 'boo') { socket.emit('boo'); audio.play('giggle'); }
  if (id === 'heart') { burstHearts(myAvatar, 6); }
  $('#emotePanel').classList.add('hidden');
}
function toggleEmotePanel() { $('#emotePanel').classList.toggle('hidden'); }
(function buildEmotes() {
  const p = $('#emotePanel');
  EMOTES.forEach(([id, name, icon], i) => { const b = el('button', 'btn small', `${icon} ${name}`); b.onclick = () => doEmote(id); p.appendChild(b); });
  $('#emoteBtn').onclick = toggleEmotePanel;
})();
socket.on('booed', ({ from }) => {
  toast(`👻 ${from} 님이 놀래켰다!`);
  if (S.fear <= 1) { audio.play('giggle'); S.shake = S.fear ? 0.2 : 0; return; }
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
    ['rank', '🏆', '랭킹'], ['emote', '😀', '감정표현'], ['settings', '⚙', '설정 · 지도 · 옷 · 도움말'], ['coffee', '☕', '커피 한 잔 후원하기'],
  ];
  let open = null;
  const setOpen = (k) => {
    open = open === k ? null : k;
    for (const [key, sel] of Object.entries(panels)) $(sel).classList.toggle('m-open', open === key);
    bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.k === open));
    if (open === 'chat') { $('#chatDot')?.classList.add('hidden'); const log = $('#chatLog'); log.scrollTop = log.scrollHeight; }
  };
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
      else { const sel = ({ look: '#lookBtn', settings: '#settingsBtn', help: '#helpBtn', rank: '#rankBtn', coffee: '#coffeeBtn' })[k]; if (sel) $(sel).click(); }
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
  const lightBtn = abtn('light', '🔦', () => { if (S.inv?.includes('flashlight')) useItem('flashlight'); else toast('손전등이 없다.'); });
  abtn('jump', '⤴', () => doEmote('jump'));
  const runBtn = abtn('run', '🏃', () => { S.mRun = !S.mRun; runBtn.classList.toggle('on', S.mRun); if (S.mRun) { S.mSneak = false; snBtn.classList.remove('on'); } });
  let snBtn = null;
  snBtn = abtn('sneak', '🤫', () => { S.mSneak = !S.mSneak; if (S.mSneak) { S.mRun = false; runBtn.classList.remove('on'); } snBtn.classList.toggle('on', S.mSneak); });
  abtn('shout', '📢<small>외치기</small>', () => sendCallout());
  hud.appendChild(act);
  setInterval(() => {
    const show = !!S.nearest && !S.modalOpen && !S.storyOpen;
    useBtn.classList.toggle('hidden', !show);
    if (show) { const ent = S.world?.objects?.[S.nearest]; useBtn.querySelector('small').textContent = S.nearestVerb || ({ examine: '조사', pickup: '줍기', lock: '풀기', use: '사용', coop: '당기기', door: '들어가기' })[ent?.data.kind] || '조사'; }
    lightBtn.classList.toggle('lit', !!S.light);
    // 로비에서 파티 패널이 닫혀 있으면 👥 옆에 '게임시작' 말풍선
    $('#startTip')?.classList.toggle('hidden', !(S.me && S.room === 'lobby' && open !== 'party' && !S.modalOpen));
  }, 150);

  // 두 손가락으로 확대/축소
  const tp = new Map(); let pinch = null;
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') tp.set(e.pointerId, e); if (tp.size === 2) { const [a, b] = [...tp.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), dist: cam.dist }; } });
  canvas.addEventListener('pointermove', (e) => { if (!tp.has(e.pointerId)) return; tp.set(e.pointerId, e); if (pinch && tp.size === 2) { const [a, b] = [...tp.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); cam.dist = Math.max(2.5, Math.min(CAM_MAX, pinch.dist * pinch.d / Math.max(20, d))); } });
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
