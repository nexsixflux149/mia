import './env.js'; // 맨 먼저: .env.local 의 DATABASE_URL 불러오기
import express from 'express';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { randomBytes } from 'crypto';
import { GameInstance } from './game.js';
import { SCENARIOS, scenarioList } from './scenarios.js';
import { hasBadWord } from './filter.js';
import { isAdminPassword, looksLikeAdmin, ADMIN_NAME } from './admin.js';
import { ITEMS, START_ITEMS } from './items.js';
import { openStore, persist, flushAll, storeKind, loadClearPhotos, saveClearPhoto } from './store.js';
import { MAX_LV, HIDDEN_LV, ADMIN_LV, levelOf, xpAt, CLEAR_COINS, CHAPTER_XP, clearXp, timeLimitMs, SHOP, isWear, blankProfile, profileView, dayKey, statRange, pruneStats, addPeriodXp, levelBoard, weekKey, monthKey, GOLD_IDS, GOLD_STAFF, isGold, giveGold, randomGold, goldWorn, weekWinner } from './progress.js';
import { Accounts, clientIp } from './accounts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const MAX_PARTY = 4;

const app = express();
app.set('trust proxy', true);
app.get('/health', (_, res) => res.json({ ok: true, players: players.size }));
app.get('/api/info', (_, res) => {
  let url = process.env.PUBLIC_URL || '';
  try { url = url || fs.readFileSync(path.join(DATA_DIR, 'public_url.txt'), 'utf8').trim(); } catch {}
  res.json({ publicUrl: url, lan: lanIps().map((ip) => `http://${ip}:${PORT}`) });
});
// ───── 정적 파일 (전송량 줄이기)
// · 글자 파일(js·css·html)은 압축(brotli/gzip)해서 보낸다 → 처음 접속할 때 받는 양이 4분의 1 정도로 준다. 한 번 압축한 것은 메모리에 두고 다시 쓴다.
// · 게임 파일은 매번 최신인지 확인하게 한다 (휴대폰이 예전 버전을 캐시해 수정이 안 보이는 문제 방지) — 안 바뀌었으면 내용 없이 '그대로'(304)만 답한다.
// · three.js 는 버전이 붙은 주소로 보내 오래 캐시한다 (버전이 바뀌면 주소도 바뀐다). 그림 파일은 하루 캐시.
const TEXT_TYPES = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const zcache = new Map();
function zstatic(root, { cache = 'no-cache', transform, tag = '' } = {}) {
  root = path.resolve(root);
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let rel; try { rel = decodeURIComponent(req.path); } catch { return next(); }
    if (rel.includes('\0') || /(^|[\\/])\./.test(rel)) return next(); // 숨김 파일(.env 등)은 다루지 않는다
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root + path.sep)) return next();
    const type = TEXT_TYPES[path.extname(file).toLowerCase()]; if (!type) return next();
    const ae = String(req.headers['accept-encoding'] || '');
    const enc = /\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : ''; if (!enc) return next();
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return next();
      const key = file + '|' + enc;
      const send = (c) => {
        res.setHeader('Content-Type', type); res.setHeader('Content-Encoding', enc); res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Cache-Control', cache); res.setHeader('ETag', c.etag);
        if (req.headers['if-none-match'] === c.etag) { res.statusCode = 304; return res.end(); }
        res.setHeader('Content-Length', c.buf.length);
        res.end(req.method === 'HEAD' ? undefined : c.buf);
      };
      const hit = zcache.get(key);
      if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return send(hit);
      fs.readFile(file, (e2, raw) => {
        if (e2) return next();
        if (transform) raw = Buffer.from(transform(rel, raw.toString('utf8')));
        const done = (e3, buf) => { if (e3) return next(); const c = { mtimeMs: st.mtimeMs, size: st.size, buf, etag: `W/"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}-${enc}${tag}"` }; if (zcache.size > 400) zcache.clear(); zcache.set(key, c); send(c); };
        if (enc === 'br') zlib.brotliCompress(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }, done);
        else zlib.gzip(raw, { level: 9 }, done);
      });
    });
  };
}
const THREE_DIR = path.join(ROOT, 'node_modules/three');
let THREE_TAG = 'three'; try { THREE_TAG = 't' + JSON.parse(fs.readFileSync(path.join(THREE_DIR, 'package.json'), 'utf8')).version.replace(/\W/g, '_'); } catch {}
const PUBLIC_DIR = path.join(ROOT, 'public');
const YEAR = 'public, max-age=31536000, immutable';
app.use('/vendor/' + THREE_TAG, zstatic(THREE_DIR, { cache: YEAR }), express.static(THREE_DIR, { maxAge: '365d', immutable: true }));
app.use('/vendor/three', zstatic(THREE_DIR, { cache: 'public, max-age=3600' }), express.static(THREE_DIR, { maxAge: '1h' }));
// index.html 의 three.js 주소를 버전이 붙은 주소로 바꿔서 보낸다
const pageTransform = (rel, text) => (rel === '/index.html' ? text.replaceAll('/vendor/three/', `/vendor/${THREE_TAG}/`) : text);
app.use(zstatic(PUBLIC_DIR, { cache: 'no-cache', transform: pageTransform, tag: '-' + THREE_TAG }));
app.use(express.static(PUBLIC_DIR, { setHeaders: (res, file) => res.setHeader('Cache-Control', /\.woff2$/i.test(file) ? YEAR : /\.(png|jpe?g|ico|webp|gif)$/i.test(file) ? 'public, max-age=86400' : 'no-cache') })); // 글꼴(.woff2)은 파일 이름에 해시가 붙어 있어 내용이 바뀌면 이름도 바뀐다 → 1년 캐시
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 2e5 });
const SNAP_MAX = 27, PHOTO_TICKET_AGE = 7 * 24 * 60 * 60 * 1000;
// 화면(클라이언트)과 서버가 주고받는 방식의 버전. 예전 화면이 새 서버에 붙으면 새로고침시킨다.
const PROTO = 3;

// ───── 저장 (파티장 닉네임별 도달 챕터)
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
// DATABASE_URL 이 있으면 무료 DB에, 없으면 data 폴더 파일에 저장 (server/store.js)
const { saves, hearts, ranks, profiles, stats, accounts: accountData, feedback, clearPhotoTickets } = await openStore(DATA_DIR, ['saves', 'hearts', 'ranks', 'profiles', 'stats', 'accounts', 'feedback', 'clearPhotoTickets']).catch((e) => {
  console.error('\n  [DB] 데이터베이스에 연결하지 못했어요. DATABASE_URL 주소를 확인해 주세요.\n  ', e.message, '\n'); process.exit(1);
});
const snaps = await loadClearPhotos(DATA_DIR, SNAP_MAX);
const photoOwner = (p) => p.acct ? `account:${p.acct}` : `name:${p.name}`;
function registerClearPhoto(id, members, scenario) {
  const now = Date.now();
  for (const [key, value] of Object.entries(clearPhotoTickets)) {
    if (now - value.at > PHOTO_TICKET_AGE) delete clearPhotoTickets[key];
  }
  clearPhotoTickets[id] = { at: now, owners: members.map(photoOwner), name: members[0]?.name || '', theme: scenario.short };
  persist(DATA_DIR, 'clearPhotoTickets', clearPhotoTickets);
}
const saveHearts = () => persist(DATA_DIR, 'hearts', hearts);
const lanIps = () => Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
// ───── 랭킹 (테마별 클리어 시간, 처음부터 시작한 판만)
const saveRanks = () => persist(DATA_DIR, 'ranks', ranks, true);
const fmtTime = (ms) => { const d = Math.round(ms / 100); const m = Math.floor(d / 600), s = (d % 600) / 10; return `${m}분 ${s.toFixed(1).padStart(4, '0')}초`; }; // 0.1초 단위
// 로비에 있는 사람에게만 보이는 전체 공지
const partyLabel = (names) => (names.length > 1 ? `${names[0]} 외 ${names.length - 1}명` : names[0] || '누군가');
const lobbyNotice = (text) => io.to('lobby').emit('lobby:notice', { text });
const save = () => persist(DATA_DIR, 'saves', saves, true);
// ───── 레벨 · 코인 · 상점
const saveProfiles = () => persist(DATA_DIR, 'profiles', profiles);
const saveStats = () => persist(DATA_DIR, 'stats', stats);
stats.days ||= {};
// ───── 고정 계정 (IP · 기기) — server/accounts.js
const accounts = new Accounts(accountData, () => persist(DATA_DIR, 'accounts', accountData));
accounts.prune(profiles); setInterval(() => accounts.prune(profiles), 24 * 3600 * 1000).unref?.();
// ───── 고객소리함 (버그 · 건의)
feedback.list ||= [];
const saveFeedback = () => persist(DATA_DIR, 'feedback', feedback);
const profChecked = new Set(); // 서버가 켜진 뒤 처음 볼 때 한 번씩만 정리한다
const prof = (name) => {
  const pf = (profiles[name] ||= blankProfile()); pf.items ||= {}; pf.equip ||= { wings: '', mount: '' }; pf.equip.costume ??= ''; pf.equip.gold ??= '';
  // 탈것 · 코스튬 · 날개 · 검 · 비매품은 아이템별 1개만 (폭죽은 max 개까지): 혹시 예전 기록에 더 들어 있으면 줄여 둔다
  if (!profChecked.has(name)) { profChecked.add(name); for (const [id, n] of Object.entries(pf.items)) { const it = SHOP[id]; if (it && n > it.max) pf.items[id] = it.max; } if (pf.equip.gold && pf.equip.costume) pf.equip.costume = ''; } // (고양이 세트와 로봇 코스튬은 함께 입지 않는다)
  return pf;
};
const findByName = (name) => [...players.values()].find((p) => p.name === name && !p.offline);
const sendProfile = (p) => { if (p) io.to(p.id).emit('profile', { ...profileView(prof(p.name), p.admin), hiddenOk: hiddenOk(p.name) }); };
// 장비 문자열: 날개|탈것|타는 중|손에 든 것(0 없음 · 1 전설의 검 · 2 황금 고양이 지팡이)|코스튬|황금 고양이 부위 글자
const gearOf = (p) => { const pf = prof(p.name), e = pf.equip; return `${e.wings || ''}|${e.mount || ''}|${p.riding && e.mount ? 1 : 0}|${Number(p.sword) || 0}|${e.costume || ''}|${goldWorn(pf)}|${p.snack || ''}`; };
/** 모든 테마를 한 번씩 깼거나 만렙이면 히든 테마가 열린다 */
function hiddenOk(name) {
  const p = findByName(name); if (p?.admin) return true;
  if (levelOf(prof(name).xp) >= HIDDEN_LV) return true;
  return Object.values(SCENARIOS).filter((s) => !s.hidden).every((s) => saves[s.saveKey(name) + ':clear']);
}
function addXp(name, amt, why) {
  if (!name || !(amt > 0)) return;
  const pf = prof(name); const before = levelOf(pf.xp);
  pf.xp += Math.round(amt); addPeriodXp(pf, Math.round(amt)); saveProfiles();
  if (!stats.weekly?.champ?.name) { boardCache = null; pushChamp(); } // 아직 확정된 주간 1위가 없을 때는 '이번 주 지금 1위'를 분수대에 띄운다
  const after = levelOf(pf.xp); const p = findByName(name);
  if (p) { io.to(p.id).emit('xp', { add: Math.round(amt), why, lv: after, up: after > before }); sendProfile(p); }
  if (after > before) {
    if (p) io.to(p.id).emit('toast', { text: `🎉 레벨 업! Lv.${after} — 상점에서 새 물건을 살 수 있는지 확인해 보세요.` });
    if (before < HIDDEN_LV && after >= HIDDEN_LV) io.emit('celebrate', { name, kind: 'level', text: `👑 ${name} 님이 Lv.${HIDDEN_LV}을 달성해 히든 테마 '데드 시티'가 열렸습니다!` });
    if (after >= MAX_LV && before < MAX_LV) io.emit('celebrate', { name, kind: 'max', text: `👑 ${name} 님이 만렙 Lv.${MAX_LV}을 달성했습니다!` });
  }
}
function addCoins(name, n) { const pf = prof(name); pf.coins = Math.max(0, (pf.coins || 0) + n); saveProfiles(); sendProfile(findByName(name)); }

// 음성(WebRTC) 중계 서버(TURN) — 선택. 통신사 데이터망처럼 서로 직접 이어지지 않는 곳에서는 중계 서버가 있어야 목소리가 들린다
//  TURN_URLS="turn:호스트:3478,turns:호스트:5349"  TURN_USER=...  TURN_PASS=...  (없으면 STUN 만 쓴다)
const ICE_EXTRA = process.env.TURN_URLS ? [{ urls: process.env.TURN_URLS.split(',').map((u) => u.trim()).filter(Boolean), username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' }] : null;
const players = new Map();   // socket.id -> player
// 채팅 욕설 경고: 닉네임별로 기억해 다시 접속해도 이어진다 (5번이면 5분 채팅 금지)
const CHAT_WARN_MAX = 5, CHAT_MUTE_MS = 5 * 60 * 1000;
const chatPenalty = new Map(); // name -> { warns, muteUntil }
const adminFails = new Map(); // ip -> { n, t } 운영자 비밀번호 틀린 횟수
const parties = new Map();   // partyId -> {id, leader, members:[]}
const instances = new Map(); // instId -> GameInstance
const invites = new Map();   // targetId -> Set(partyId)
let seq = 1;

// ───── 위치 방송 (전송량 줄이기): 1초에 10번, '바뀐 사람'만, 숫자는 소수 둘째 자리까지
//  한 사람 = [id, x, z, y, ry, 깃발(걷기1·웅크림2·손전등4)] (+ 이름·외형 번호·파티·장비·감정표현이 바뀌었을 때만 뒤에 덧붙인다)
//  아무도 움직이지 않으면 아무것도 보내지 않는다. 방에 새로 들어온 화면에는 전체를 한 번 보낸다.
const TICK_MS = 100;
const r2 = (v) => Math.round(v * 100) / 100;
const dynOf = (p) => [r2(p.x), r2(p.z), r2(p.y || 0), r2(p.ry), (p.anim ? 1 : 0) | (p.crouch ? 2 : 0) | (p.light ? 4 : 0)];
const extOf = (p) => ({ n: p.name, lv: p.lv, pt: p.partyId || '', g: gearOf(p), em: p.em || '', eid: p.eid || 0, rd: p.room === 'lobby' ? p.ride || '' : '', et: p.eat || 0 });
const roomMeta = new Map(); // room -> { gk: 마지막으로 보낸 귀신 상태, ghosts, full: 다음 번에 전체를 보낼지, fullAt }
const metaOf = (room) => { let m = roomMeta.get(room); if (!m) { m = { gk: 'null', ghosts: null, full: true, fullAt: 0 }; roomMeta.set(room, m); } return m; };
const needFull = (room) => { if (room) metaOf(room).full = true; };
function fullState(room) {
  const list = [];
  for (const p of players.values()) if (p.room === room && !p.offline) list.push([p.id, ...dynOf(p), extOf(p)]);
  return { f: 1, p: list, g: roomMeta.get(room)?.ghosts ?? null };
}
const lobbyList = () => [...players.values()].filter((p) => !p.offline).map((p) => ({ id: p.id, name: p.name, partyId: p.partyId, inGame: p.room !== 'lobby', room: p.room || '', hearts: hearts[p.name] || 0, admin: !!p.admin, lv: p.admin ? ADMIN_LV : levelOf(prof(p.name).xp) }));
const broadcastRoster = () => io.emit('roster', lobbyList());

function partyInfo(party) {
  if (!party) return null;
  return {
    id: party.id, leader: party.leader,
    members: party.members.map((id) => { const p = players.get(id); return p && { id, name: p.name, mic: !!p.mic, inGame: p.room !== 'lobby' }; }).filter(Boolean),
    instId: party.instId || null,
    unlocked: saves[players.get(party.leader)?.name] ?? 0,
    unlockedBy: unlockedFor(players.get(party.leader)?.name),
    scenarios: scenarioList(),
    hiddenOk: hiddenOk(players.get(party.leader)?.name),
    scenarioId: party.scenarioId || null,
    pick: party.pick || null, // 파티장이 지금 고르고 있는 테마·공포도·챕터 (파티원 화면에 보여 준다)
  };
}
function syncParty(party) {
  const info = partyInfo(party);
  for (const id of party.members) io.to(id).emit('party', info);
}

function joinRoom(p, room) {
  const sock = io.sockets.sockets.get(p.sid);
  if (!sock) return;
  if (p.room) sock.leave(p.room);
  io.to(p.room).emit('player:leave', p.id);
  p.room = room; p.y = 0; p._sr = null;
  sock.join(room);
  needFull(room); // 새로 들어온 화면이 방 안 모두를 볼 수 있게 다음 번에는 전체를 보낸다
}
/** 접속이 완전히 끝난 사람을 지운다 (끊긴 뒤 3분이 지났거나, 다른 접속이 자리를 이어받지 않은 경우) */
function dropPlayer(p) {
  if (!players.has(p.id) || !p.offline) return;
  clearTimeout(p.dropTimer);
  leaveParty(p);
  io.to(p.room).emit('player:leave', p.id);
  players.delete(p.id);
  invites.delete(p.id);
  broadcastRoster();
  io.to('lobby').emit('chat', { channel: 'system', text: `${p.name} 님이 나갔습니다.` });
}

function toLobby(p) {
  joinRoom(p, 'lobby');
  p.x = (Math.random() - 0.5) * 6; p.z = 4 + Math.random() * 3;
  p.inv = [...START_ITEMS];
  p.light = false;
  io.to(p.id).emit('enter:lobby', { x: p.x, z: p.z });
  io.to(p.id).emit('inv', p.inv);
  broadcastRoster();
}

function leaveParty(p) {
  const party = parties.get(p.partyId);
  p.partyId = null;
  if (!party) return;
  party.members = party.members.filter((id) => id !== p.id);
  io.to(p.id).emit('party', null);
  if (p.room.startsWith('inst:')) toLobby(p);
  if (party.members.length === 0) {
    if (party.instId) instances.delete(party.instId);
    parties.delete(party.id);
  } else {
    if (party.leader === p.id) party.leader = party.members[0];
    syncParty(party);
    for (const id of party.members) io.to(id).emit('voice:peerLeft', p.id);
    if (party.instId && !party.members.some((id) => players.get(id)?.room === 'inst:' + party.instId)) {
      instances.delete(party.instId); party.instId = null; syncParty(party);
    }
  }
  broadcastRoster();
}

io.on('connection', (sock) => {
  let me = null;

  const setMe = (p) => { me = p; sock.data.pid = p ? p.id : null; };
  // 입장 · 이어 접속 때 화면에 돌려주는 내 정보
  const helloInfo = (p, extra = {}) => {
    const a = p.acct ? accountData.list[p.acct] : null;
    return { id: p.id, token: p.token, name: p.name, admin: !!p.admin, items: ITEMS, unlocked: saves[p.name] ?? 0, unlockedBy: unlockedFor(p.name), scenarios: scenarioList(), hearts: hearts[p.name] || 0, hiddenOk: hiddenOk(p.name), shop: SHOP, account: a ? { id: a.id, key: a.key, name: a.name } : null, champ: champView(), ice: ICE_EXTRA, ...extra };
  };

  sock.on('hello', (h, ack) => {
    let { name, look, resume, admin, acct, v } = h || {};
    if (typeof ack !== 'function') ack = () => {};
    // 업데이트 전에 열어 둔 예전 화면은 새로고침시킨다 (주고받는 방식이 달라 캐릭터가 보이지 않는다)
    if ((Number(v) || 0) < PROTO) { sock.emit('kicked', { text: '🔄 게임이 업데이트되었어요! 확인을 누르면 새 버전으로 다시 접속합니다.' }); return; }
    // 운영자 로그인: 비밀번호가 맞으면 '운영자' 닉네임으로 입장 (틀리면 5번까지만 시도 가능)
    let asAdmin = false;
    const ip = clientIp(sock);
    if (admin) {
      // 비밀번호 맞히기 공격 막기: 접속마다 5번, 같은 IP 는 10분에 10번까지만
      const f = adminFails.get(ip) || { n: 0, t: Date.now() }; if (Date.now() - f.t > 10 * 60 * 1000) { f.n = 0; f.t = Date.now(); }
      sock.data.adminTries = (sock.data.adminTries || 0) + 1;
      if (f.n >= 10 || sock.data.adminTries > 5) return ack({ error: 'badadmin', message: '비밀번호를 너무 많이 틀렸어요. 10분 뒤에 다시 시도하세요.' });
      if (!isAdminPassword(admin)) { f.n++; adminFails.set(ip, f); return ack({ error: 'badadmin', message: '운영자 비밀번호가 맞지 않아요.' }); }
      asAdmin = true; name = ADMIN_NAME; resume = null; acct = null;
    }
    // ① 이어 접속: 모바일에서 앱 전환 등으로 연결이 끊겼다 다시 붙으면, 같은 플레이어로 이어서 한다
    let old = resume && players.get(resume.id);
    if (!(old && resume.token && old.token === resume.token)) old = null;
    // 이 연결에 이미 내 캐릭터가 있는데 '입장'이 또 왔다 (입장 버튼 연타 · 늦게 도착한 중복 요청)
    // → 새로 만들지 않고 그대로 돌려준다. (예전에는 캐릭터가 하나 더 생겨, 아무도 조종하지 않는 채 광장에 영영 남았다)
    if (!old && me && players.has(me.id) && !me.offline && !!me.admin === asAdmin) return ack(helloInfo(me, { again: true }));
    if (me && me !== old && players.has(me.id)) { const gone = me; setMe(null); gone.offline = true; dropPlayer(gone); }
    // ② 고정 계정: 이 기기(열쇠) 또는 이 IP 에 묶인 계정으로 들어온다
    let account = null, viaAccount = false;
    if (!asAdmin && !old) {
      name = String(name || '').trim().slice(0, 12);
      if (!accounts.byToken(acct)) {
        if (!name) name = '익명' + Math.floor(Math.random() * 9000 + 1000);
        if (hasBadWord(name)) return ack({ error: 'badname', message: '욕설·비방이 들어간 닉네임은 쓸 수 없어요. 다른 닉네임을 정해 주세요.' });
        if (looksLikeAdmin(name)) return ack({ error: 'badname', message: '운영자로 오해할 수 있는 닉네임은 쓸 수 없어요. 다른 닉네임을 정해 주세요.' });
      }
      const r = accounts.claim({ name, ip, tok: acct });
      if (r.error === 'toomany') return ack({ error: 'badname', keep: true, message: '이 인터넷 주소에서 오늘 만들 수 있는 계정 수를 넘었어요. 내일 다시 시도해 주세요.' });
      if (r.error) return ack({ error: 'badname', message: `'${name}' 은(는) 이미 다른 분의 고정 계정 닉네임이에요. 다른 닉네임을 정해 주세요.` });
      account = r.acct; name = account.name;
      // 같은 계정이 이미 들어와 있으면 (다른 창 · 다른 기기 · 끊긴 채 기다리는 중) 그 자리를 그대로 이어받는다
      old = [...players.values()].find((p) => p.acct === account.id) || null;
      viaAccount = !!old;
    }
    if (old) {
      clearTimeout(old.dropTimer); old.dropTimer = null; old.offline = false;
      const prev = io.sockets.sockets.get(old.sid);
      if (prev && prev.id !== sock.id) {
        prev.data.replaced = true;
        if (viaAccount && prev.connected) prev.emit('kicked', { text: '다른 창(또는 다른 기기)에서 같은 계정으로 접속해서, 이 창의 접속이 끊겼어요.' });
        prev.disconnect(true);
      }
      if (viaAccount) old.token = randomBytes(16).toString('hex'); // 예전 창이 다시 붙어 자리를 되가져가지 못하게
      old.sid = sock.id; setMe(old); old._sr = null;
      // 외형은 정말 바뀌었을 때만 새로 알린다 (다시 붙을 때마다 모두가 사진 얼굴을 다시 내려받지 않게)
      if (look) { const nl = sanitizeLook(look); if (JSON.stringify(nl) !== JSON.stringify(me.look)) { me.look = nl; me.lv++; } }
      sock.join(me.id); if (me.room) { sock.join(me.room); needFull(me.room); }
      ack(helloInfo(me, { resumed: true, room: me.room }));
      sock.emit('inv', me.inv); sendProfile(me);
      const party = parties.get(me.partyId);
      if (party) sock.emit('party', partyInfo(party));
      const i = party?.instId ? instances.get(party.instId) : null;
      if (i && me.room === 'inst:' + party.instId) sock.emit('game:sync', i.fullState());
      else if (me.room === 'lobby') sock.emit('enter:lobby', { x: me.x, z: me.z });
      broadcastRoster();
      flushMail(me);
      return;
    }
    if (asAdmin) {
      // 운영자가 이미 들어와 있으면: 끊긴 채 남은 예전 접속은 정리하고, 정말 접속 중이면 #번호를 붙인다
      const clash = [...players.values()].find((p) => p.name === name);
      if (clash) {
        const live = !clash.offline && io.sockets.sockets.get(clash.sid)?.connected;
        if (!live) { clash.offline = true; dropPlayer(clash); }
        else name = name.slice(0, 9) + '#' + Math.floor(Math.random() * 90 + 10);
      }
    }
    const pid = 'p' + randomBytes(6).toString('hex');
    const np = { id: pid, sid: sock.id, token: randomBytes(16).toString('hex'), name, admin: asAdmin, acct: account?.id || null, lv: 1, look: sanitizeLook(look), x: 0, z: 5, ry: Math.PI, anim: 0, light: false, room: null, partyId: null, inv: [...START_ITEMS], mic: false };
    players.set(pid, np); setMe(np);
    sock.join(pid);
    if (asAdmin) adminKit(prof(name)); // 운영자는 황금 고양이 세트와 지팡이를 처음부터 가지고 있다
    toLobby(np);
    ack(helloInfo(np));
    sendProfile(np);
    flushMail(np);
    // 방문 통계: 오늘 방문 수 + 방문자
    if (!asAdmin) { const d = (stats.days[dayKey()] ||= { v: 0, u: {} }); d.v++; d.u[name] ||= 0; saveStats(); }
    io.to('lobby').emit('chat', { channel: 'system', text: `${name} 님이 접속했습니다.` });
  });
  // 방을 옮긴 화면이 '지금 이 방에 있는 사람 전부'를 다시 달라고 할 때
  // (너무 자주 오면 버리지 않고 0.4초에 한 번으로 모아서 보낸다 — 버리면 그 화면에는 다음 전체 방송까지 아무도 안 보인다)
  // 휴대폰이 잠들었다 깨어났을 때: 화면이 '아직 붙어 있나?' 하고 묻는다. 답이 없으면 화면이 스스로 다시 접속한다
  sock.on('alive', (ack) => { if (typeof ack === 'function') ack(me && !me.offline && players.has(me.id) && me.sid === sock.id ? me.id : ''); });
  sock.on('state:full', () => {
    const p = me; if (!p?.room || p.offline) return;
    const send = () => { p.fullTimer = null; p.fullReqAt = Date.now(); if (p.room && !p.offline && p.sid === sock.id) sock.emit('state', fullState(p.room)); };
    const left = 400 - (Date.now() - (p.fullReqAt || 0));
    if (left <= 0) send(); else if (!p.fullTimer) p.fullTimer = setTimeout(send, left);
  });

  sock.on('move', (m) => {
    if (!me || !m) return;
    if ([m.x, m.z, m.ry].some((v) => typeof v !== 'number' || !isFinite(v))) return;
    me.x = m.x; me.z = m.z; me.ry = m.ry; me.y = typeof m.y === 'number' && isFinite(m.y) ? Math.max(0, Math.min(12, m.y)) : 0; me.anim = m.anim ? 1 : 0; me.run = !!m.run; me.crouch = !!m.crouch; me.sneak = !!m.sneak;
    me.em = typeof m.em === 'string' ? m.em.slice(0, 10) : ''; me.eid = Number(m.eid) | 0;
    me.ride = typeof m.ride === 'string' && /^[a-z0-9]{1,12}:\d{1,2}$/.test(m.ride) ? m.ride : '';
    me.riding = !!m.mount && !!prof(me.name).equip.mount;
    me.snack = typeof m.snack === 'string' && /^([pc][123]|b[0-9])$/.test(m.snack) ? m.snack : ''; me.eat = Number(m.eat) | 0; // 손에 든 간식(팝콘·커피 · 남은 횟수)과 먹은 횟수
    { const its = prof(me.name).items; me.sword = m.sword === 2 ? (its[GOLD_STAFF] ? 2 : 0) : m.sword ? (its.sword ? 1 : 0) : 0; } // 손에 든 것: 1 전설의 검 · 2 황금 고양이 지팡이
  });

  // 외형은 바뀔 때만 전송 (사진 얼굴은 용량이 크므로 매 틱 보내지 않는다)
  sock.on('look', (look) => { if (!me) return; const nl = sanitizeLook(look); if (JSON.stringify(nl) !== JSON.stringify(me.look)) { me.look = nl; me.lv++; } });
  // 놀래키기: 3.5m 안의 같은 방 사람들에게
  sock.on('boo', () => {
    if (!me) return;
    const now = Date.now(); if (now - (me.lastBoo || 0) < 1500) return; me.lastBoo = now;
    for (const p of players.values()) if (p !== me && p.room === me.room && Math.hypot(p.x - me.x, p.z - me.z) < 3.5) io.to(p.id).emit('booed', { from: me.name, fromId: me.id });
  });
  // 클리어 이벤트를 받은 파티원만 업로드할 수 있고, 같은 클리어는 한 장만 저장한다.
  sock.on('snap:list', (ack) => { if (typeof ack === 'function') ack(snaps); });
  sock.on('clear-photo:post', async (payload, ack) => {
    if (typeof ack !== 'function') return;
    if (!me) return ack({ retry: true });
    const { id, img } = payload || {};
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) return ack({ rejected: true });
    const ticket = clearPhotoTickets[id];
    if (!ticket || Date.now() - ticket.at > PHOTO_TICKET_AGE || !ticket.owners.includes(photoOwner(me))) return ack({ rejected: true });
    if (typeof img !== 'string' || img.length > 90000 || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(img)) return ack({ rejected: true });
    const photo = { id, img, at: ticket.at, name: ticket.name, theme: ticket.theme };
    try {
      if (await saveClearPhoto(DATA_DIR, photo)) {
        snaps.push(photo);
        snaps.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
        snaps.length = Math.min(snaps.length, SNAP_MAX);
        io.to('lobby').emit('snap:new', photo);
      }
      ack({ ok: true });
    } catch (err) {
      console.warn('[클리어 사진] 저장 실패:', err.message);
      ack({ retry: true });
    }
  });
  // 하트 보내기
  sock.on('heart', (toId) => {
    const t = players.get(toId);
    if (!me || !t || t === me) return;
    me.heartT ||= {};
    const now = Date.now();
    if (now - (me.heartT[toId] || 0) < 3000) return sock.emit('toast', { text: '하트는 3초에 한 번씩 보낼 수 있어요.' });
    me.heartT[toId] = now;
    hearts[t.name] = (hearts[t.name] || 0) + 1; saveHearts();
    io.to(t.id).emit('heart', { from: me.name, fromId: me.id, total: hearts[t.name] });
    sock.emit('toast', { text: `💖 ${t.name} 님에게 하트를 보냈어요!` });
    if (t.room === me.room) io.to(me.room).emit('heartFx', { from: me.id, to: t.id });
    broadcastRoster();
  });
  sock.on('look:get', (id) => { const p = players.get(id); if (p) sock.emit('look', { id, lv: p.lv, look: p.look }); });
  const CALLOUTS = ['어이!', '여기야!', '이쪽이야!', '이봐!'];
  sock.on('callout', () => {
    if (!me) return; const now = Date.now();
    if (now - (me.calloutAt || 0) < 2000) return; me.calloutAt = now;
    const word = CALLOUTS[Math.floor(Math.random() * CALLOUTS.length)];
    io.to(me.room).emit('callout', { id: me.id, name: me.name, x: me.x, z: me.z, word });
  });
  sock.on('ping', ({ x, z }) => {
    if (!me || typeof x !== 'number' || typeof z !== 'number') return;
    const party = parties.get(me.partyId);
    const targets = party ? party.members : [me.id];
    for (const id of targets) { const p = players.get(id); if (p && p.room === me.room) io.to(id).emit('ping', { x, z, from: me.name, fromId: me.id }); }
  });

  sock.on('chat', ({ channel, text }) => {
    if (!me || (channel !== 'party' && me.room !== 'lobby')) return;
    text = String(text || '').trim().slice(0, 200);
    if (!text) return;
    const now = Date.now();
    if (now - (me.lastChat || 0) < 400) return;
    me.lastChat = now;
    const pen = chatPenalty.get(me.name) || { warns: 0, muteUntil: 0 };
    if (!me.admin && pen.muteUntil > now) {
      const left = Math.ceil((pen.muteUntil - now) / 1000);
      return sock.emit('chat:blocked', { muted: true, left, text: `🚫 욕설·비방 경고 ${CHAT_WARN_MAX}회로 채팅이 금지되었습니다. ${Math.floor(left / 60)}분 ${left % 60}초 뒤에 다시 쓸 수 있어요.` });
    }
    if (!me.admin && hasBadWord(text)) {
      pen.warns += 1;
      if (pen.warns >= CHAT_WARN_MAX) { pen.warns = 0; pen.muteUntil = now + CHAT_MUTE_MS; chatPenalty.set(me.name, pen); return sock.emit('chat:blocked', { muted: true, left: CHAT_MUTE_MS / 1000, text: `🚫 욕설·비방 경고 ${CHAT_WARN_MAX}회! 5분 동안 채팅이 금지됩니다.` }); }
      chatPenalty.set(me.name, pen);
      return sock.emit('chat:blocked', { warns: pen.warns, max: CHAT_WARN_MAX, text: `⚠️ 욕설·비방은 금지예요. 메시지가 보내지지 않았습니다. (경고 ${pen.warns}/${CHAT_WARN_MAX} — ${CHAT_WARN_MAX}회가 되면 5분간 채팅 금지)` });
    }
    const msg = { channel, from: me.name, fromId: me.id, text, admin: !!me.admin };
    if (channel === 'party') {
      const party = parties.get(me.partyId);
      if (!party) return sock.emit('chat', { channel: 'system', text: '파티에 속해 있지 않습니다.' });
      for (const id of party.members) io.to(id).emit('chat', msg);
    } else {
      msg.channel = 'all';
      io.to('lobby').emit('chat', msg);
    }
  });

  // ───── 파티
  sock.on('party:invite', (targetId) => {
    if (!me) return;
    const target = players.get(targetId);
    if (!target || target.id === me.id) return;
    if (target.partyId) return sock.emit('toast', { text: `${target.name} 님은 이미 파티에 있습니다.` });
    let party = parties.get(me.partyId);
    if (!party) {
      party = { id: 'p' + seq++, leader: me.id, members: [me.id], instId: null };
      parties.set(party.id, party);
      me.partyId = party.id;
      syncParty(party);
      broadcastRoster();
    }
    if (party.instId) return sock.emit('toast', { text: '게임 진행 중에는 초대할 수 없습니다.' });
    if (party.members.length >= MAX_PARTY) return sock.emit('toast', { text: `파티는 최대 ${MAX_PARTY}명입니다.` });
    if (!invites.has(target.id)) invites.set(target.id, new Set());
    invites.get(target.id).add(party.id);
    io.to(target.id).emit('party:invite', { partyId: party.id, from: me.name });
    sock.emit('toast', { text: `${target.name} 님을 초대했습니다.` });
  });

  sock.on('party:respond', ({ partyId, accept }) => {
    if (!me) return;
    const set = invites.get(me.id);
    if (!set?.has(partyId)) return;
    set.delete(partyId);
    const party = parties.get(partyId);
    if (!party) return sock.emit('toast', { text: '파티가 사라졌습니다.' });
    if (!accept) { io.to(party.leader).emit('toast', { text: `${me.name} 님이 초대를 거절했습니다.` }); return; }
    if (me.partyId) leaveParty(me);
    if (party.members.length >= MAX_PARTY || party.instId) return sock.emit('toast', { text: '파티에 참가할 수 없습니다.' });
    party.members.push(me.id);
    me.partyId = party.id;
    syncParty(party);
    broadcastRoster();
    for (const id of party.members) io.to(id).emit('chat', { channel: 'party', from: '시스템', text: `${me.name} 님이 파티에 참가했습니다.` });
  });

  sock.on('party:leave', () => { if (me) leaveParty(me); });
  // ───── 상점 · 내 물건 · 선물
  sock.on('profile:get', () => sendProfile(me));
  sock.on('shop:buy', (id) => {
    if (!me) return; const it = SHOP[id]; if (!it) return;
    const pf = prof(me.name); const lv = levelOf(pf.xp); const have = pf.items[id] || 0;
    if (it.nosale) return sock.emit('toast', { text: it.kind === 'staff' ? `${it.icon} ${it.name}은(는) 비매품이에요. 황금 고양이 세트 7종을 모두 모으면 받아요.` : `${it.icon} ${it.name}은(는) 비매품이에요. 매주 주간랭킹 1위에게 랜덤으로 주어져요.` });
    if (!me.admin && lv < it.lv) return sock.emit('toast', { text: `🔒 Lv.${it.lv} 부터 살 수 있어요. (지금 Lv.${lv})` });
    if (have >= it.max) return sock.emit('toast', { text: it.max > 1 ? `${it.icon} ${it.name}은(는) ${it.max}개까지만 가질 수 있어요.` : `${it.icon} ${it.name}은(는) 이미 가지고 있어요.` });
    if (!me.admin && (pf.coins || 0) < it.price) return sock.emit('toast', { text: `🪙 코인이 모자라요. (${it.price}코인 필요 · 지금 ${pf.coins || 0}코인)` });
    if (!me.admin) pf.coins -= it.price;
    pf.items[id] = have + 1;
    if (it.kind === 'sword') pf.swordUses = it.uses;
    if (isWear(id) && !pf.equip[it.kind] && !(it.kind === 'costume' && pf.equip.gold)) pf.equip[it.kind] = id; // 처음 산 날개·탈것은 바로 착용 (고양이 세트를 입고 있으면 코스튬은 그대로 둔다)
    saveProfiles(); sendProfile(me);
    sock.emit('shop:bought', { id });
    sock.emit('toast', { text: `${it.icon} ${it.name}을(를) 샀어요!${isWear(id) ? ' (🎒 내 물건에서 착용/해제)' : ' (🎒 내 물건에서 사용)'}` });
  });
  sock.on('shop:equip', ({ id, on } = {}) => {
    if (!me) return;
    // 고양이 세트를 입으면 입고 있던 로봇 코스튬은 저절로 벗겨진다
    const dropCostume = (pf) => { const c = SHOP[pf.equip.costume]; if (!c) return; pf.equip.costume = ''; sock.emit('toast', { text: `${c.icon} ${c.name}을(를) 벗었어요. (황금 고양이 세트와는 함께 입을 수 없어요)` }); };
    if (id === 'gold_set') { // 가진 황금 고양이 부위를 한꺼번에 입거나 벗는다
      const pf = prof(me.name);
      pf.equip.gold = on ? GOLD_IDS.filter((g) => pf.items[g]).map((g) => SHOP[g].part).join('') : '';
      if (pf.equip.gold) dropCostume(pf);
      saveProfiles(); sendProfile(me); return;
    }
    const it = SHOP[id]; if (!it || !(isWear(id) || isGold(id))) return;
    const pf = prof(me.name); if (!pf.items[id]) return;
    if (isGold(id)) { // 황금 고양이 부위는 부위마다 따로 입고 벗는다 (여러 개 함께 착용)
      const cur = new Set(pf.equip.gold || ''); if (on) cur.add(it.part); else cur.delete(it.part);
      pf.equip.gold = GOLD_IDS.map((g) => SHOP[g].part).filter((c) => cur.has(c)).join('');
      if (on) dropCostume(pf);
      saveProfiles(); sendProfile(me); return;
    }
    if (it.kind === 'costume' && on && pf.equip.gold) { pf.equip.gold = ''; sock.emit('toast', { text: `🏆 황금 고양이 세트를 벗었어요. (${it.icon} ${it.name}와(과)는 함께 입을 수 없어요)` }); } // 반대로 로봇 코스튬을 입으면 고양이 세트를 벗는다
    pf.equip[it.kind] = on ? id : (pf.equip[it.kind] === id ? '' : pf.equip[it.kind]);
    if (it.kind === 'mount' && !on) me.riding = false;
    saveProfiles(); sendProfile(me);
  });
  sock.on('shop:use', (id) => {
    if (!me || !['popper', 'rocket', 'sword', GOLD_STAFF].includes(id)) return;
    const pf = prof(me.name); if (!pf.items[id]) return;
    const now = Date.now(); if (now - (me.lastFx || 0) < 900) return; me.lastFx = now;
    const room = me.room; if (!room) return;
    const fx = { type: id, id: me.id, x: me.x, z: me.z, y: me.y || 0, ry: me.ry };
    if (id === GOLD_STAFF) { // 황금 고양이 지팡이: 전설의 검처럼 가까운 귀신을 물리치지만 횟수가 줄지 않는다
      const hit = inst()?.slay?.(me, 'staff');
      fx.type = 'staff'; fx.hit = hit ? { x: hit.x, z: hit.z, name: hit.name } : null;
      if (hit) sock.emit('toast', { text: `🪄 ${hit.name}을(를) 물리쳤다! (황금 고양이 지팡이 · 횟수 제한 없음)` });
      else if (!inst()) sock.emit('toast', { text: '🪄 휘익— (귀신은 방탈출 안에서만 물리칠 수 있어요)' });
      else sock.emit('toast', { text: '🪄 휘익— 가까이에 귀신이 없다. (귀신 가까이서 휘두르세요)' });
      io.to(room).emit('fx:item', fx); return;
    }
    if (id === 'sword') {
      const hit = inst()?.slay?.(me);
      fx.hit = hit ? { x: hit.x, z: hit.z, name: hit.name } : null;
      if (hit) {
        pf.swordUses = Math.max(0, (pf.swordUses || 0) - 1);
        if (pf.swordUses <= 0) { delete pf.items.sword; me.sword = false; fx.broke = true; io.to(room).emit('toast', { text: `💥 ${me.name} 님의 전설의 검이 귀신을 30번 베고 산산조각 났다!` }); }
        else sock.emit('toast', { text: `🗡️ ${hit.name}을(를) 베어 없앴다! (남은 횟수 ${pf.swordUses}/30)` });
        saveProfiles(); sendProfile(me);
      } else if (!inst()) sock.emit('toast', { text: '🗡️ 휘익— (귀신은 방탈출 안에서만 벨 수 있어요)' });
      else sock.emit('toast', { text: '🗡️ 휘익— 가까이에 귀신이 없다. (귀신 가까이서 휘두르세요)' });
      io.to(room).emit('fx:item', fx); return;
    }
    pf.items[id] -= 1; if (pf.items[id] <= 0) delete pf.items[id];
    saveProfiles(); sendProfile(me);
    if (id === 'rocket') inst()?.lure?.(me.x, me.z, me.name);
    io.to(room).emit('fx:item', fx);
  });
  sock.on('shop:gift', ({ to, id } = {}) => {
    if (!me) return; const t = players.get(to); const it = SHOP[id];
    if (!t || t === me || !it) return;
    const a = prof(me.name), b = prof(t.name);
    if (it.nosale && !me.admin) return sock.emit('toast', { text: `${it.icon} ${it.name}은(는) 비매품이라 선물할 수 없어요.` });
    if (!a.items[id] && !me.admin) return sock.emit('toast', { text: '가지고 있지 않은 물건이에요.' });
    if ((b.items[id] || 0) >= it.max) return sock.emit('toast', { text: it.max > 1 ? `${t.name} 님은 ${it.name}을(를) 더 받을 수 없어요. (최대 ${it.max}개)` : `${t.name} 님은 ${it.icon} ${it.name}을(를) 이미 가지고 있어요. (아이템별 1개만 가질 수 있어요)` });
    const now = Date.now(); if (now - (me.lastGift || 0) < 1500) return; me.lastGift = now;
    if (it.nosale) { // 운영자가 직접 주는 비매품
      const r = isGold(id) ? giveGold(b, id) : (b.items[id] = 1, { staff: false });
      saveProfiles(); sendProfile(t);
      sock.emit('toast', { text: `🎁 ${t.name} 님에게 ${it.icon} ${it.name}을(를) 주었어요!${r.staff ? ' (세트 완성 → 지팡이도 지급)' : ''}` });
      io.to(t.id).emit('gift', { from: me.name, id, icon: it.icon, name: it.name });
      if (r.staff) io.to(t.id).emit('mail', { text: goldSetText() });
      if (t.room === me.room) io.to(me.room).emit('heartFx', { from: me.id, to: t.id });
      return;
    }
    const uses = it.kind === 'sword' ? (me.admin ? it.uses : a.swordUses || it.uses) : 0;
    if (!me.admin) { a.items[id] -= 1; if (a.items[id] <= 0) { delete a.items[id]; if (a.equip[it.kind] === id) a.equip[it.kind] = ''; if (it.kind === 'sword') a.swordUses = 0; } }
    b.items[id] = (b.items[id] || 0) + 1;
    if (it.kind === 'sword') b.swordUses = uses;
    if (isWear(id) && !b.equip[it.kind] && !(it.kind === 'costume' && b.equip.gold)) b.equip[it.kind] = id;
    saveProfiles(); sendProfile(me); sendProfile(t);
    sock.emit('toast', { text: `🎁 ${t.name} 님에게 ${it.icon} ${it.name}을(를) 선물했어요!` });
    io.to(t.id).emit('gift', { from: me.name, id, icon: it.icon, name: it.name });
    if (t.room === me.room) io.to(me.room).emit('heartFx', { from: me.id, to: t.id });
  });
  // ───── 운영자 기능 (운영자로 입장한 사람만)
  const adminOnly = (fn) => (...a) => { if (me?.admin) fn(...a); };
  sock.on('admin:notice', adminOnly((text) => {
    text = String(text || '').trim().slice(0, 200); if (!text) return;
    io.emit('notice', { text });
    io.emit('chat', { channel: 'system', text: `📢 [공지] ${text}` });
  }));
  sock.on('admin:stats', adminOnly((ack) => {
    if (typeof ack !== 'function') return;
    ack({ players: [...players.values()].map((p) => ({ id: p.id, name: p.name, room: p.room === 'lobby' ? '로비' : p.room ? '게임 중' : '-', offline: !!p.offline, admin: !!p.admin, muted: Math.max(0, Math.ceil(((chatPenalty.get(p.name)?.muteUntil || 0) - Date.now()) / 1000)), warns: chatPenalty.get(p.name)?.warns || 0, lv: levelOf(prof(p.name).xp) })), games: instances.size, accounts: accounts.size, feedbackNew: feedback.list.filter((f) => !f.done).length,
      visit: { day: statRange(stats, 1), week: statRange(stats, 7), month: statRange(stats, 30) },
      daily: Array.from({ length: 14 }, (_, i) => { const k = dayKey(Date.now() - i * 86400000); const r = stats.days[k]; const u = Object.values(r?.u || {}); return { day: k, visitors: u.length, visits: r?.v || 0, totalMs: u.reduce((a, b) => a + b, 0) }; }) });
  }));
  sock.on('admin:mute', adminOnly(({ id, minutes }) => {
    const t = players.get(id); if (!t || t.admin) return;
    const mins = Math.max(1, Math.min(1440, Number(minutes) || 5));
    chatPenalty.set(t.name, { warns: 0, muteUntil: Date.now() + mins * 60000 });
    io.to(t.id).emit('chat:blocked', { muted: true, left: mins * 60, text: `🚫 운영자가 ${mins}분 동안 채팅을 금지했습니다.` });
    sock.emit('toast', { text: `${t.name} 님 채팅 ${mins}분 금지` });
  }));
  sock.on('admin:unmute', adminOnly((id) => {
    const t = players.get(id); if (!t) return;
    chatPenalty.delete(t.name);
    io.to(t.id).emit('chat', { channel: 'system', text: '✅ 운영자가 채팅 금지를 풀었습니다.' });
    sock.emit('toast', { text: `${t.name} 님 채팅 금지 해제` });
  }));
  // 랭킹에서 기록 하나 지우기 → 아래 기록이 자동으로 한 칸씩 올라간다
  sock.on('admin:rankDel', adminOnly(({ sc, at, ms } = {}) => {
    const list = ranks[sc]; if (!list) return;
    const i = list.findIndex((r) => r.at === at && r.ms === ms); if (i < 0) return;
    const [r] = list.splice(i, 1); saveRanks();
    sock.emit('toast', { text: `🗑️ 랭킹에서 '${r.names.join(', ')}' 기록을 지웠어요. 아래 기록이 한 칸씩 올라갑니다.` });
    sock.emit('rank:changed');
  }));
  sock.on('admin:kick', adminOnly((id) => {
    const t = players.get(id); if (!t || t.admin) return;
    io.to(t.id).emit('kicked', { text: '운영자에 의해 접속이 끊겼습니다.' });
    const ts = io.sockets.sockets.get(t.sid); t.offline = true; clearTimeout(t.dropTimer);
    setTimeout(() => { try { ts?.disconnect(true); } catch {} dropPlayer(t); }, 300);
    sock.emit('toast', { text: `${t.name} 님을 내보냈습니다.` });
  }));
  // 초대 링크: 링크를 받은 친구는 캐릭터만 만들면 바로 내 파티로 들어온다
  sock.on('party:link', (ack) => {
    if (!me || typeof ack !== 'function') return;
    let party = parties.get(me.partyId);
    if (!party) {
      party = { id: 'p' + seq++, leader: me.id, members: [me.id], instId: null };
      parties.set(party.id, party); me.partyId = party.id; syncParty(party); broadcastRoster();
    }
    party.code ||= Math.random().toString(36).slice(2, 8);
    ack({ code: party.code, full: party.members.length >= MAX_PARTY });
  });
  sock.on('party:joinCode', (code) => {
    if (!me || typeof code !== 'string') return;
    const party = [...parties.values()].find((p) => p.code && p.code === code);
    if (!party) return sock.emit('toast', { text: '초대 링크의 파티가 사라졌어요. 친구에게 새 링크를 받아 주세요.' });
    if (party.members.includes(me.id)) return;
    if (party.instId) return sock.emit('toast', { text: '친구 파티가 이미 게임 중이에요. 끝나면 다시 링크로 들어와 주세요.' });
    if (party.members.length >= MAX_PARTY) return sock.emit('toast', { text: `친구 파티가 꽉 찼어요 (최대 ${MAX_PARTY}명).` });
    if (me.partyId) leaveParty(me);
    party.members.push(me.id); me.partyId = party.id;
    syncParty(party); broadcastRoster();
    for (const id of party.members) io.to(id).emit('chat', { channel: 'party', from: '시스템', text: `${me.name} 님이 초대 링크로 파티에 참가했습니다.` });
    io.to(party.leader).emit('toast', { text: `🎉 ${me.name} 님이 초대 링크로 들어왔어요!` });
  });
  // 랭킹 조회: 테마별 상위 10개
  sock.on('rank:get', (ack) => {
    const out = {};
    for (const s of Object.values(SCENARIOS)) out[s.id] = (ranks[s.id] || []).slice(0, 10).map((r) => ({ names: r.names, ms: r.ms, fear: r.fear, ending: r.ending, at: r.at, hints: r.hints ?? null }));
    if (typeof ack === 'function') ack(out);
  });
  // 랭킹 한꺼번에: 주간 · 월간 · 총 레벨 랭킹 + 테마별 클리어 시간
  sock.on('rank:all', (ack) => {
    if (typeof ack !== 'function') return;
    const themes = {};
    for (const s of Object.values(SCENARIOS)) themes[s.id] = (ranks[s.id] || []).slice(0, 10).map((r) => ({ names: r.names, ms: r.ms, fear: r.fear, ending: r.ending, at: r.at, hints: r.hints ?? null }));
    const boards = levelBoards();
    const level = {};
    for (const k of ['week', 'month', 'total']) level[k] = { rows: boards[k].rows, total: boards[k].total, me: me && !me.admin ? boards[k].rankOf(me.name) : null };
    ack({ themes, level, week: weekKey(), month: monthKey() });
  });
  // ───── 고객소리함: 버그 · 건의사항 보내기
  sock.on('feedback:send', ({ kind, text } = {}, ack) => {
    if (!me || typeof ack !== 'function') return;
    text = String(text || '').trim().slice(0, 1000);
    if (text.length < 5) return ack({ error: '내용을 조금만 더 자세히 적어 주세요. (5자 이상)' });
    const now = Date.now();
    if (!me.admin && now - (me.lastFb || 0) < 30000) return ack({ error: '방금 보내셨어요. 30초 뒤에 다시 보낼 수 있어요.' });
    if (!me.admin && feedback.list.filter((f) => f.name === me.name && now - f.at < 86400000).length >= 10) return ack({ error: '하루에 10개까지만 보낼 수 있어요. 내일 다시 보내 주세요!' });
    me.lastFb = now;
    const g = inst();
    feedback.list.push({ id: 'f' + now.toString(36) + randomBytes(2).toString('hex'), at: now, name: me.name, lv: levelOf(prof(me.name).xp), kind: ['bug', 'idea'].includes(kind) ? kind : 'etc', text,
      where: me.room === 'lobby' ? '로비' : g ? `${g.sc.short} · ${g.ch.title}` : '-', ua: String(sock.handshake.headers['user-agent'] || '').slice(0, 160) });
    if (feedback.list.length > 500) feedback.list.splice(0, feedback.list.length - 500);
    saveFeedback(); ack({ ok: true });
    for (const p of players.values()) if (p.admin && !p.offline) io.to(p.id).emit('toast', { text: `📮 고객소리함에 새 글이 도착했어요 (${me.name})` });
  });
  // ───── 🌠 소원의 별: 게임 별점(1~5) + 소원 한 줄. 고객소리함 목록에 함께 쌓여 운영자가 본다
  sock.on('wish:send', ({ stars, text } = {}, ack) => {
    if (!me || typeof ack !== 'function') return;
    stars = Math.round(Number(stars)); text = String(text || '').trim().slice(0, 200);
    if (!(stars >= 1 && stars <= 5)) return ack({ error: '별점을 골라 주세요. (1~5점)' });
    if (!text) return ack({ error: '소원을 적어 주세요.' });
    const now = Date.now();
    if (!me.admin && now - (me.lastWish || 0) < 20000) return ack({ error: '별똥별이 아직 떨어지는 중이에요. 잠시 뒤에 다시 빌어 주세요.' });
    if (!me.admin && feedback.list.filter((f) => f.kind === 'wish' && f.name === me.name && now - f.at < 86400000).length >= 5) return ack({ error: '소원은 하루에 5번까지 빌 수 있어요. 내일 또 빌어 주세요!' });
    me.lastWish = now;
    feedback.list.push({ id: 'w' + now.toString(36) + randomBytes(2).toString('hex'), at: now, name: me.name, lv: levelOf(prof(me.name).xp), kind: 'wish', stars,
      text: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} (${stars}점)\n소원: ${text}`, where: '로비 · 소원의 별', ua: String(sock.handshake.headers['user-agent'] || '').slice(0, 160) });
    if (feedback.list.length > 500) feedback.list.splice(0, feedback.list.length - 500);
    saveFeedback(); ack({ ok: true });
    // 로비에 있는 모두의 하늘에 10초 동안 별똥별이 쏟아진다
    for (const p of players.values()) if (p.room === 'lobby' && !p.offline) io.to(p.id).emit('wish:shower', { name: me.name, sec: 10 });
  });
  sock.on('admin:feedback', adminOnly((ack) => { if (typeof ack === 'function') ack(feedback.list.slice(-200).reverse()); }));
  sock.on('admin:feedbackDone', adminOnly((id) => { const f = feedback.list.find((x) => x.id === id); if (f) { f.done = !f.done; saveFeedback(); } }));
  sock.on('admin:feedbackDel', adminOnly((id) => { const i = feedback.list.findIndex((x) => x.id === id); if (i >= 0) { feedback.list.splice(i, 1); saveFeedback(); } }));
  // 파티장이 테마·공포도·챕터를 바꾸면 파티원에게도 보여 준다
  sock.on('party:pick', (pk) => {
    const party = parties.get(me?.partyId);
    if (!party || party.leader !== me.id || !pk) return;
    party.pick = { scenario: SCENARIOS[pk.scenario] ? pk.scenario : 'gwimun', fear: Math.max(0, Math.min(3, Number(pk.fear) | 0)), chapter: Math.max(0, Number(pk.chapter) | 0), n: party.members.length };
    syncParty(party);
  });
  // 파티원이 파티장에게 시작을 요청
  sock.on('party:nudge', () => {
    const party = parties.get(me?.partyId);
    if (!party || party.leader === me.id || party.instId) return;
    const now = Date.now(); if (now - (me.lastNudge || 0) < 4000) return; me.lastNudge = now;
    io.to(party.leader).emit('toast', { text: `🔔 ${me.name} 님이 방탈출 시작을 기다리고 있어요!` });
    for (const id of party.members) io.to(id).emit('chat', { channel: 'party', from: '시스템', text: `${me.name} 님이 시작을 요청했습니다.` });
    sock.emit('toast', { text: '파티장에게 시작 요청을 보냈어요.' });
  });
  sock.on('party:kick', (id) => {
    const party = parties.get(me?.partyId);
    if (!party || party.leader !== me.id || id === me.id) return;
    const t = players.get(id);
    if (t && t.partyId === party.id) { leaveParty(t); io.to(id).emit('toast', { text: '파티에서 추방되었습니다.' }); }
  });

  sock.on('party:start', (opt) => {
    if (!me) return;
    let chapter = typeof opt === 'object' && opt ? opt.chapter : opt;
    const sc = SCENARIOS[opt?.scenario] || SCENARIOS.gwimun;
    if (sc.hidden && !hiddenOk(me.name)) return sock.emit('toast', { text: '🔒 히든 테마는 모든 테마를 한 번씩 깨거나 Lv.20이 되면 열려요.' });
    const fq = Number(opt?.fear); // 0 왕초보 · 1 순한맛 · 2 보통 · 3 매운맛
    const fear = Number.isFinite(fq) && opt?.fear !== null && opt?.fear !== '' ? Math.max(0, Math.min(3, Math.round(fq))) : 2;
    let party = parties.get(me.partyId);
    if (!party) { // 솔로 플레이: 1인 파티 생성
      party = { id: 'p' + seq++, leader: me.id, members: [me.id], instId: null };
      parties.set(party.id, party); me.partyId = party.id;
    }
    if (party.leader !== me.id) return sock.emit('toast', { text: '파티장만 시작할 수 있습니다.' });
    if (party.instId) return;
    const unlocked = saves[sc.saveKey(me.name)] ?? 0;
    chapter = Math.max(0, Math.min(Number(chapter) || 0, unlocked, sc.chapters.length - 1));
    party.scenarioId = sc.id;
    const instId = 'i' + seq++;
    party.instId = instId;
    for (const id of party.members) {
      const p = players.get(id);
      if (!p) continue;
      joinRoom(p, 'inst:' + instId);
      p.inv = [...START_ITEMS, ...sc.startItems(chapter)];
    }
    const saveName = sc.saveKey(me.name);
    const inst = new GameInstance({
      id: instId, io, party, players, chapter, fear, scenario: sc.id,
      onChapter: (idx) => { if ((saves[saveName] ?? 0) < idx) { saves[saveName] = idx; save(); } },
      onAdvance: () => { if (inst.overtime()) return; for (const m of inst.members()) addXp(m.name, CHAPTER_XP, '챕터 통과'); },
      limitMs: timeLimitMs(sc.difficulty || 3),
      onEnd: ({ photoId, ms, full, type, hints = 0, over = false } = {}) => {
        registerClearPhoto(photoId, inst.members(), sc);
        const names = party.members.map((id) => players.get(id)?.name).filter(Boolean);
        const wasOpen = new Map(names.map((n) => [n, hiddenOk(n)]));
        saves[saveName] = sc.chapters.length - 1;
        // 함께 깬 파티원 모두 '클리어'로 기록 (히든 테마 조건 · 도장표). 값은 처음 깬 시각 (예전 기록은 1)
        for (const n of new Set([me.name, ...names])) { const k = sc.saveKey(n) + ':clear'; if (!(saves[k] > 1)) saves[k] = Date.now(); }
        save();
        setTimeout(() => { for (const n of names) if (!wasOpen.get(n) && hiddenOk(n) && levelOf(prof(n).xp) < HIDDEN_LV) io.emit('celebrate', { name: n, kind: 'clear', text: `🧟 ${n} 님이 모든 테마를 클리어해 히든 테마 '데드 시티'가 열렸습니다!` }); for (const n of names) { const pl = findByName(n); sendProfile(pl); if (pl) io.to(pl.id).emit('clears', unlockedFor(n)); } }, 300);
        // 보상: 깰 때마다 10코인 · 제한 시간 안에 깨면 경험치 (시간 초과면 순위표·경험치 제외)
        for (const m of inst.members()) {
          addCoins(m.name, CLEAR_COINS);
          io.to(m.id).emit('toast', { text: `🪙 클리어 보상 ${CLEAR_COINS}코인!${over ? ' (⏰ 시간 초과 — 경험치·순위표 제외)' : ''}` });
          if (!over) addXp(m.name, clearXp(sc.difficulty || 3, fear, full), '테마 클리어');
        }
        if (full && ms > 0 && !over) {
          const list = (ranks[sc.id] ||= []);
          list.push({ names, ms, fear, ending: type, at: Date.now(), hints });
          list.sort((a, b) => a.ms - b.ms); ranks[sc.id] = list.slice(0, 50); saveRanks();
        }
        lobbyNotice(`🏆 ${partyLabel(names)} 님이 '${sc.short}' 테마를 클리어했습니다!${full && ms ? ` (${fmtTime(ms)} · 힌트 ${hints}개${over ? ' · 시간 초과' : ''})` : ''}`);
        syncParty(party);
      },
    });
    // 이어하기: 앞 챕터에서 얻었어야 할 핵심 아이템 지급
    if (chapter >= 1) {
      const carry = sc.carry(chapter);
      const ms = inst.members();
      carry.forEach((it, i) => ms[i % ms.length].inv.push(it));
    }
    instances.set(instId, inst);
    lobbyNotice(`🚪 ${partyLabel(party.members.map((id) => players.get(id)?.name).filter(Boolean))} 님이 '${sc.short}' 테마 게임을 시작했습니다.`);
    for (const m of inst.members()) io.to(m.id).emit('inv', m.inv);
    io.to(inst.room).emit('game:start', inst.fullState());
    syncParty(party);
    broadcastRoster();
  });

  sock.on('party:quit', () => {
    const party = parties.get(me?.partyId);
    if (!party || !party.instId) return;
    const cur = instances.get(party.instId);
    if (cur?.ended) { // 엔딩 후: 파티는 유지한 채 각자 로비로
      toLobby(me);
      if (!party.members.some((id) => players.get(id)?.room === 'inst:' + party.instId)) { instances.delete(party.instId); party.instId = null; }
      syncParty(party);
      return;
    }
    if (party.leader === me.id) {
      instances.delete(party.instId); party.instId = null;
      for (const id of party.members) { const p = players.get(id); if (p) toLobby(p); }
      syncParty(party);
    } else {
      leaveParty(me);
    }
  });

  // ───── 게임
  const inst = () => { const party = parties.get(me?.partyId); return party?.instId ? instances.get(party.instId) : null; };
  sock.on('game:interact', (id) => inst()?.interact(me, id));
  sock.on('game:lock', ({ id, answer }) => inst()?.tryLock(me, id, answer));
  sock.on('game:hint', () => inst()?.hint(me));
  sock.on('inv:use', (item) => {
    if (!me) return;
    if (ITEMS[item]?.use === 'flashlight') { me.light = !me.light; return; }
    inst()?.useItem(me, item);
  });
  sock.on('inv:give', ({ item, to }) => inst()?.giveTo(me, item, to));
  sock.on('inv:combine', ({ a, b }) => inst()?.combine(me, a, b));
  sock.on('game:state', () => { const i = inst(); if (i) sock.emit('game:start', i.fullState()); });

  // ───── 음성 (파티원끼리 또는 광장에서 WebRTC 신호 중계)
  sock.on('voice:signal', ({ to, data }) => {
    const t = players.get(to);
    if (!me || !t) return;
    const sameParty = me.partyId && t.partyId === me.partyId;
    const bothInLobby = me.room === 'lobby' && t.room === 'lobby';
    if (!sameParty && !bothInLobby) return;
    io.to(to).emit('voice:signal', { from: me.id, data });
  });
  sock.on('voice:mic', (on) => {
    if (!me) return;
    me.mic = !!on;
    const party = parties.get(me.partyId);
    if (party) syncParty(party);
  });

  sock.on('disconnect', () => {
    if (!me || sock.data.replaced || me.sid !== sock.id) return;
    // 바로 지우지 않고 잠시 기다린다 (모바일 백그라운드 → 복귀 시 이어하기)
    // 기다리는 동안에는 다른 사람 화면과 접속자 목록에서 빠진다 (실제로는 없는 사람이 광장에 서 있던 문제)
    const p = me;
    p.offline = true;
    io.to(p.room).emit('player:leave', p.id);
    broadcastRoster();
    clearTimeout(p.dropTimer);
    p.dropTimer = setTimeout(() => dropPlayer(p), 3 * 60 * 1000);
  });
});

// 레벨 랭킹 표는 10초에 한 번만 다시 만든다
let boardCache = null, boardAt = 0;
function levelBoards() {
  if (boardCache && Date.now() - boardAt < 10000) return boardCache;
  const skip = (n) => n === ADMIN_NAME || n.startsWith(ADMIN_NAME + '#');
  boardCache = { week: levelBoard(profiles, 'week', 20, skip), month: levelBoard(profiles, 'month', 20, skip), total: levelBoard(profiles, 'total', 20, skip) };
  boardAt = Date.now(); return boardCache;
}

// ───── 주간랭킹 1위: 주(월요일 0시, 한국 시간)가 바뀌면 지난주 1위를 확정한다
//  → 분수대 위 큰 글씨 '주간랭킹 1위는 "○○"님 입니다' + 황금 고양이 세트 중 아직 없는 것 하나를 랜덤으로 지급 (7종을 다 모으면 지팡이)
//  서버가 그 시각에 꺼져 있었어도, 다시 켜졌을 때 지난주 것을 한 번 확정한다 (stats.weekly.done = 마지막으로 확정한 주)
stats.weekly ||= { done: '', champ: null, log: [] };
const goldSetText = () => `황금 고양이 세트 7종을 모두 모았어요! ${SHOP[GOLD_STAFF].icon} ${SHOP[GOLD_STAFF].name}을(를) 받았습니다. (귀신 퇴치 무제한 · 🎒 내 물건에서 들기)`;
const adminKit = (pf) => { let ch = false; for (const id of [...GOLD_IDS, GOLD_STAFF]) if (!pf.items[id]) { pf.items[id] = 1; ch = true; } if (ch) saveProfiles(); };
/** 분수대에 띄울 이름: 지난주에 확정된 1위. 아직 없으면(기능이 켜진 첫 주 · 지난주에 아무도 안 했을 때) 이번 주 지금 1위 */
function champView() {
  const c = stats.weekly?.champ;
  if (c?.name) return { name: c.name, week: c.k, last: true };
  const top = levelBoards().week.rows[0];
  return top ? { name: top.name, week: weekKey(), last: false } : null;
}
let champSent = null;
function pushChamp(force) { const v = champView(); const key = v ? `${v.name}|${v.week}|${v.last}` : ''; if (!force && key === champSent) return; champSent = key; io.emit('champ', v); }
/** 우편: 접속해 있으면 바로, 아니면 다음에 들어올 때 보여 준다 (보상 알림) */
function mail(name, text) { const pf = prof(name); (pf.mail ||= []).push({ text, at: Date.now() }); if (pf.mail.length > 10) pf.mail.splice(0, pf.mail.length - 10); saveProfiles(); flushMail(findByName(name)); }
function flushMail(p) { if (!p || p.offline) return; const pf = prof(p.name); if (!pf.mail?.length) return; const list = pf.mail; pf.mail = []; saveProfiles(); for (const m of list) io.to(p.id).emit('mail', m); }
function checkWeek(now = Date.now()) {
  const w = stats.weekly, prev = weekKey(now - 7 * 86400000);
  if (w.done === prev) return null;
  const first = !w.done; w.done = prev;
  if (first) { saveStats(); return null; } // 이 기능이 처음 켜진 주: 지난주 기록이 온전하지 않으므로 지급 없이 넘어간다 (다음 월요일부터 시작)
  const top = weekWinner(profiles, prev, (n) => n === ADMIN_NAME || n.startsWith(ADMIN_NAME + '#'));
  boardCache = null;
  if (!top) { w.champ = null; saveStats(); pushChamp(); return null; } // 지난주에 아무도 경험치를 얻지 못했다
  const pf = prof(top.name);
  const id = randomGold(pf); const r = id ? giveGold(pf, id) : { added: false, staff: false };
  w.champ = { k: prev, name: top.name, gain: top.gain, lv: top.lv, item: id || '', at: now };
  (w.log ||= []).push(w.champ); if (w.log.length > 60) w.log.shift();
  saveStats(); saveProfiles();
  const it = id ? SHOP[id] : null;
  io.emit('celebrate', { name: top.name, kind: 'weekly', text: it ? `🏆 지난주 주간랭킹 1위는 ${top.name} 님! ${it.icon} ${it.name}을(를) 받았습니다!` : `🏆 지난주 주간랭킹 1위는 ${top.name} 님!` });
  mail(top.name, it ? `🏆 지난주 주간랭킹 1위! 보상으로 ${it.icon} ${it.name}을(를) 받았어요. (🎒 내 물건에서 입고 벗을 수 있어요)` : '🏆 지난주 주간랭킹 1위! 황금 고양이 세트는 이미 모두 가지고 있어요.');
  if (r.staff) mail(top.name, goldSetText());
  sendProfile(findByName(top.name));
  pushChamp(true);
  return w.champ;
}
checkWeek(); setInterval(() => checkWeek(), 60 * 1000).unref?.();

function unlockedFor(name) {
  const out = {};
  if (!name) return out;
  for (const s of Object.values(SCENARIOS)) { const c = saves[s.saveKey(name) + ':clear']; out[s.id] = { chapter: saves[s.saveKey(name)] ?? 0, cleared: !!c, at: c > 1 ? c : 0 }; }
  return out;
}
function carryItems(ch) {
  const out = [];
  if (ch >= 2) out.push('attendance');
  if (ch >= 6) out.push('shinkal', 'bell', 'fan', 'true_talisman');
  return out;
}

const LOOK_ENUM = {
  ears: ['bear', 'bunny', 'cat', 'fox', 'devil', 'none'],
  hat: ['none', 'beanie', 'ribbon', 'sprout', 'cap', 'halo', 'crown', 'flower', 'tophat', 'beret', 'headphones', 'catband', 'tiara', 'strawhat', 'frog', 'mushroom'],
  eyes: ['dot', 'big', 'sparkle', 'smile', 'sleepy', 'wink', 'star', 'heart', 'teary', 'angry', 'dizzy', 'closed', 'cat'],
  brows: ['none', 'soft', 'worried', 'angry', 'thick'],
  mouth: ['smile', 'open', 'cat', 'tongue', 'o', 'flat', 'fang', 'pout', 'grin'],
  cheeks: ['blush', 'none', 'freckles', 'hearts', 'bandaid', 'swirl'],
  extra: ['none', 'glasses', 'sunglasses', 'eyepatch', 'mask', 'mole', 'scar', 'whiskers', 'tears', 'monocle', 'heartglasses', 'clown', 'stickers'],
  acc: ['none', 'necklace', 'pendant', 'bell', 'scarf', 'bowtie', 'backpack', 'wings', 'batwings', 'cape', 'tail', 'balloon', 'teddy', 'lantern'],
  hair: ['none', 'short', 'bob', 'long', 'twintail', 'ponytail', 'bun', 'spiky', 'bowl'],
  outfit: ['plain', 'sailor', 'blazer', 'hanbok', 'shaman', 'reaper', 'priest', 'nurse', 'detective', 'maid', 'hoodie', 'pajama',
    'police', 'doctor', 'chef', 'firefighter', 'pirate', 'witch', 'vampire', 'mummy', 'astronaut', 'ninja', 'santa', 'raincoat', 'tracksuit', 'dino', 'cowboy', 'kimono',
    'clown', 'ringmaster', 'magician', 'knight', 'princess', 'gothic', 'wizard', 'idol', 'hiphop', 'explorer', 'bee', 'panda'],
};
function sanitizeLook(l = {}) {
  const hex = (v, d) => (/^#[0-9a-f]{6}$/i.test(v) ? v : d);
  const out = {
    body: hex(l.body, '#ffd6a5'), accent: hex(l.accent, '#ff8fab'), hairColor: hex(l.hairColor, '#5a3825'), eyeColor: hex(l.eyeColor, '#5a3825'),
  };
  const defs = { ears: 'bear', hat: 'none', eyes: 'big', brows: 'soft', mouth: 'smile', cheeks: 'blush', extra: 'none', acc: 'none', hair: 'short', outfit: 'sailor' };
  for (const [k, list] of Object.entries(LOOK_ENUM)) out[k] = list.includes(l[k]) ? l[k] : defs[k];
  // 사진 얼굴: 작은 JPEG data URL 만 허용 (최대 약 60KB)
  out.photo = typeof l.photo === 'string' && l.photo.startsWith('data:image/jpeg;base64,') && l.photo.length < 80000 ? l.photo : '';
  out.photoOn = !!l.photoOn && !!out.photo;
  return out;
}

// ───── 상태 브로드캐스트 (10Hz · 바뀐 것만)
let last = Date.now();
setInterval(() => {
  const now = Date.now(); const dt = (now - last) / 1000; last = now;
  const byRoom = new Map();
  for (const p of players.values()) { if (!p.room || p.offline) continue; let l = byRoom.get(p.room); if (!l) byRoom.set(p.room, (l = [])); l.push(p); }
  for (const [room, list] of byRoom) {
    const meta = metaOf(room);
    let ghosts = null;
    if (room.startsWith('inst:')) {
      const i = instances.get(room.slice(5)); i?.checkTime?.(); ghosts = i?.tick(dt) || null;
      if (ghosts) for (const g of ghosts) { g.x = r2(g.x); g.z = r2(g.z); g.ry = r2(g.ry || 0); delete g.name; }
    }
    const full = meta.full || now - meta.fullAt > 10000; // 가끔은 전체를 보내 혹시 어긋난 화면을 바로잡는다
    const out = [];
    for (const p of list) {
      const d = dynOf(p), dk = d.join(), e = extOf(p), ek = `${e.n}|${e.lv}|${e.pt}|${e.g}|${e.em}|${e.eid}|${e.rd}|${e.et}`;
      if (full || p._sr !== room || ek !== p._ek) out.push([p.id, ...d, e]);
      else if (dk !== p._dk) out.push([p.id, ...d]);
      p._dk = dk; p._ek = ek; p._sr = room;
    }
    const gk = ghosts ? JSON.stringify(ghosts) : 'null';
    const gChanged = gk !== meta.gk;
    meta.gk = gk; meta.ghosts = ghosts;
    if (!out.length && !gChanged && !full) continue; // 아무것도 안 바뀌었으면 보내지 않는다
    const msg = { p: out };
    if (gChanged || full) msg.g = ghosts;
    if (full) { msg.f = 1; meta.full = false; meta.fullAt = now; }
    io.to(room).emit('state', msg);
  }
  for (const room of roomMeta.keys()) if (!byRoom.has(room)) roomMeta.delete(room);
}, TICK_MS);

// 주인 없는 캐릭터 청소: 연결이 사라졌는데 '접속 중'으로 남은 캐릭터를 30초마다 찾아 정리한다 (혹시 모를 경우의 안전장치)
setInterval(() => {
  for (const p of [...players.values()]) {
    if (p.offline) continue;
    const s = io.sockets.sockets.get(p.sid);
    if (s && s.connected && s.data.pid === p.id) continue;
    p.offline = true; dropPlayer(p);
  }
}, 30000).unref?.();

// 방문 통계: 1분마다 접속 중인 사람의 머문 시간을 더한다 (서버가 갑자기 꺼져도 거의 정확하게 남는다)
setInterval(() => {
  const d = (stats.days[dayKey()] ||= { v: 0, u: {} });
  for (const p of players.values()) if (!p.offline && !p.admin) d.u[p.name] = (d.u[p.name] || 0) + 60000;
  pruneStats(stats); saveStats();
}, 60000).unref?.();

// Render 무료 서버는 15분 동안 바깥 접속이 없으면 잠든다 → 서버가 자기 공개 주소로 10분마다 접속해 깨어 있게 한다
// (GitHub 예약 작업은 한 시간에 한 번 정도밖에 돌지 않아 이것만으로는 부족했다)
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || '';
if (SELF_URL) setInterval(() => { fetch(SELF_URL.replace(/\/$/, '') + '/health', { headers: { 'user-agent': 'mia-keepalive' } }).catch(() => {}); }, 10 * 60 * 1000).unref?.();
server.listen(PORT, () => {
  const ips = lanIps();
  console.log(`\n  미아 — 파티형 메타버스 공포 방탈출 서버 실행 중`);
  console.log(storeKind() === 'db' ? '  기록 저장:        무료 데이터베이스 (DATABASE_URL)' : `  기록 저장:        ${DATA_DIR} 폴더`);
  console.log(`  이 컴퓨터:        http://localhost:${PORT}`);
  ips.forEach((ip) => console.log(`  같은 네트워크:    http://${ip}:${PORT}  (음성채팅은 https 터널 필요)`));
  console.log('');
});

// 서버가 꺼질 때(무료 서버가 잠들거나 재배포될 때) 남은 기록을 저장하고 끈다
let closing = false;
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, async () => {
  if (closing) return; closing = true;
  await flushAll().catch(() => {});
  process.exit(0);
});
