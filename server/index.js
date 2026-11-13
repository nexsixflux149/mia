import './env.js'; // 맨 먼저: .env.local 의 DATABASE_URL 불러오기
import express from 'express';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { randomBytes } from 'crypto';
import { GameInstance } from './game.js';
import { SCENARIOS, scenarioList } from './scenarios.js';
import { hasBadWord } from './filter.js';
import { isAdminPassword, looksLikeAdmin, ADMIN_NAME } from './admin.js';
import { ITEMS, START_ITEMS } from './items.js';
import { openStore, persist, flushAll, storeKind } from './store.js';
import { MAX_LV, levelOf, xpAt, CLEAR_COINS, CHAPTER_XP, clearXp, timeLimitMs, SHOP, isWear, blankProfile, profileView, dayKey, statRange, pruneStats } from './progress.js';

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
// 게임 파일은 매번 최신인지 확인하게 한다 (휴대폰이 예전 버전을 캐시해 수정이 안 보이는 문제 방지)
app.use(express.static(path.join(ROOT, 'public'), { setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') }));
app.use('/vendor/three', express.static(path.join(ROOT, 'node_modules/three')));
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 2e5 });

// ───── 저장 (파티장 닉네임별 도달 챕터)
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
// DATABASE_URL 이 있으면 무료 DB에, 없으면 data 폴더 파일에 저장 (server/store.js)
const { saves, hearts, ranks, profiles, stats } = await openStore(DATA_DIR, ['saves', 'hearts', 'ranks', 'profiles', 'stats']).catch((e) => {
  console.error('\n  [DB] 데이터베이스에 연결하지 못했어요. DATABASE_URL 주소를 확인해 주세요.\n  ', e.message, '\n'); process.exit(1);
});
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
const prof = (name) => { const pf = (profiles[name] ||= blankProfile()); pf.items ||= {}; pf.equip ||= { wings: '', mount: '' }; return pf; };
const findByName = (name) => [...players.values()].find((p) => p.name === name && !p.offline);
const sendProfile = (p) => { if (p) io.to(p.id).emit('profile', { ...profileView(prof(p.name), p.admin), hiddenOk: hiddenOk(p.name) }); };
const gearOf = (p) => { const e = prof(p.name).equip; return `${e.wings || ''}|${e.mount || ''}|${p.riding && e.mount ? 1 : 0}|${p.sword ? 1 : 0}`; };
/** 모든 테마를 한 번씩 깼거나 만렙이면 히든 테마가 열린다 */
function hiddenOk(name) {
  const p = findByName(name); if (p?.admin) return true;
  if (levelOf(prof(name).xp) >= MAX_LV) return true;
  return Object.values(SCENARIOS).filter((s) => !s.hidden).every((s) => saves[s.saveKey(name) + ':clear']);
}
function addXp(name, amt, why) {
  if (!name || !(amt > 0)) return;
  const pf = prof(name); const before = levelOf(pf.xp); const wasOpen = hiddenOk(name);
  pf.xp += Math.round(amt); saveProfiles();
  const after = levelOf(pf.xp); const p = findByName(name);
  if (p) { io.to(p.id).emit('xp', { add: Math.round(amt), why, lv: after, up: after > before }); sendProfile(p); }
  if (after > before) {
    if (p) io.to(p.id).emit('toast', { text: `🎉 레벨 업! Lv.${after} — 상점에서 새 물건을 살 수 있는지 확인해 보세요.` });
    if (after >= MAX_LV) io.emit('notice', { text: `👑 ${name} 님이 만렙(Lv.${MAX_LV})을 달성해 히든 테마 '데드 시티'가 열렸습니다!` });
  }
  if (!wasOpen && hiddenOk(name) && after < MAX_LV) io.emit('notice', { text: `🧟 ${name} 님이 모든 테마를 깨서 히든 테마 '데드 시티'가 열렸습니다!` });
}
function addCoins(name, n) { const pf = prof(name); pf.coins = Math.max(0, (pf.coins || 0) + n); saveProfiles(); sendProfile(findByName(name)); }

const players = new Map();   // socket.id -> player
// 채팅 욕설 경고: 닉네임별로 기억해 다시 접속해도 이어진다 (5번이면 5분 채팅 금지)
const CHAT_WARN_MAX = 5, CHAT_MUTE_MS = 5 * 60 * 1000;
const chatPenalty = new Map(); // name -> { warns, muteUntil }
const adminFails = new Map(); // ip -> { n, t } 운영자 비밀번호 틀린 횟수
const parties = new Map();   // partyId -> {id, leader, members:[]}
const instances = new Map(); // instId -> GameInstance
const invites = new Map();   // targetId -> Set(partyId)
let seq = 1;

const pub = (p) => ({ id: p.id, name: p.name, lv: p.lv, x: p.x, z: p.z, y: p.y || 0, ry: p.ry, anim: p.anim, crouch: p.crouch ? 1 : 0, light: p.light, partyId: p.partyId, em: p.em || '', eid: p.eid || 0, ride: p.room === 'lobby' ? p.ride || '' : '', gear: gearOf(p) });
const lobbyList = () => [...players.values()].map((p) => ({ id: p.id, name: p.name, partyId: p.partyId, inGame: p.room !== 'lobby', room: p.room || '', hearts: hearts[p.name] || 0, admin: !!p.admin, lv: levelOf(prof(p.name).xp) }));
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
  p.room = room; p.y = 0;
  sock.join(room);
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

  sock.on('hello', ({ name, look, resume, admin }, ack) => {
    // 운영자 로그인: 비밀번호가 맞으면 '운영자' 닉네임으로 입장 (틀리면 5번까지만 시도 가능)
    let asAdmin = false;
    if (admin) {
      // 비밀번호 맞히기 공격 막기: 접속마다 5번, 같은 IP 는 10분에 10번까지만
      const ip = String(sock.handshake.headers['x-forwarded-for'] || sock.handshake.address || '').split(',')[0].trim();
      const f = adminFails.get(ip) || { n: 0, t: Date.now() }; if (Date.now() - f.t > 10 * 60 * 1000) { f.n = 0; f.t = Date.now(); }
      sock.data.adminTries = (sock.data.adminTries || 0) + 1;
      if (f.n >= 10 || sock.data.adminTries > 5) return ack?.({ error: 'badadmin', message: '비밀번호를 너무 많이 틀렸어요. 10분 뒤에 다시 시도하세요.' });
      if (!isAdminPassword(admin)) { f.n++; adminFails.set(ip, f); return ack?.({ error: 'badadmin', message: '운영자 비밀번호가 맞지 않아요.' }); }
      asAdmin = true; name = ADMIN_NAME; resume = null;
    }
    // 모바일에서 앱 전환 등으로 연결이 끊겼다 다시 붙으면, 같은 플레이어로 이어서 한다
    const old = resume && players.get(resume.id);
    if (old && resume.token && old.token === resume.token) {
      clearTimeout(old.dropTimer); old.dropTimer = null; old.offline = false;
      const prev = io.sockets.sockets.get(old.sid);
      if (prev && prev.id !== sock.id) { prev.data.replaced = true; prev.disconnect(true); }
      old.sid = sock.id; me = old;
      if (look) { me.look = sanitizeLook(look); me.lv++; } // 창을 다시 열며 고른 외형으로
      sock.join(me.id); if (me.room) sock.join(me.room);
      ack?.({ id: me.id, token: me.token, name: me.name, items: ITEMS, unlocked: saves[me.name] ?? 0, unlockedBy: unlockedFor(me.name), scenarios: scenarioList(), hearts: hearts[me.name] || 0, resumed: true, room: me.room, hiddenOk: hiddenOk(me.name), shop: SHOP, admin: !!me.admin });
      sock.emit('inv', me.inv); sendProfile(me);
      const party = parties.get(me.partyId);
      if (party) sock.emit('party', partyInfo(party));
      const i = party?.instId ? instances.get(party.instId) : null;
      if (i && me.room === 'inst:' + party.instId) sock.emit('game:sync', i.fullState());
      else if (me.room === 'lobby') sock.emit('enter:lobby', { x: me.x, z: me.z });
      broadcastRoster();
      return;
    }
    name = String(name || '').trim().slice(0, 12) || '익명' + Math.floor(Math.random() * 1000);
    if (hasBadWord(name)) return ack?.({ error: 'badname', message: '욕설·비방이 들어간 닉네임은 쓸 수 없어요. 다른 닉네임을 정해 주세요.' });
    if (!asAdmin && looksLikeAdmin(name)) return ack?.({ error: 'badname', message: '운영자로 오해할 수 있는 닉네임은 쓸 수 없어요. 다른 닉네임을 정해 주세요.' });
    // 같은 닉네임이 남아 있으면: 끊긴 채 기다리던(창을 닫았거나 시간 초과된) 예전 접속이면 정리하고 그 이름을 그대로 쓴다
    // 정말 다른 사람이 지금 접속 중일 때만 #번호를 붙인다
    const clash = [...players.values()].find((p) => p.name === name);
    if (clash) {
      const live = !clash.offline && io.sockets.sockets.get(clash.sid)?.connected;
      if (!live) { clash.offline = true; clearTimeout(clash.dropTimer); dropPlayer(clash); }
      else name = name.slice(0, 9) + '#' + Math.floor(Math.random() * 90 + 10);
    }
    const pid = 'p' + randomBytes(6).toString('hex');
    me = { id: pid, sid: sock.id, token: randomBytes(16).toString('hex'), name, admin: asAdmin, lv: 1, look: sanitizeLook(look), x: 0, z: 5, ry: Math.PI, anim: 0, light: false, room: null, partyId: null, inv: [...START_ITEMS], mic: false };
    players.set(pid, me);
    sock.join(pid);
    toLobby(me);
    ack?.({ id: pid, token: me.token, name, admin: asAdmin, items: ITEMS, unlocked: saves[name] ?? 0, unlockedBy: unlockedFor(name), scenarios: scenarioList(), hearts: hearts[name] || 0, hiddenOk: hiddenOk(name), shop: SHOP });
    sendProfile(me);
    // 방문 통계: 오늘 방문 수 + 방문자
    if (!asAdmin) { const d = (stats.days[dayKey()] ||= { v: 0, u: {} }); d.v++; d.u[name] ||= 0; saveStats(); }
    io.emit('chat', { channel: 'system', text: `${name} 님이 접속했습니다.` });
  });

  sock.on('move', (m) => {
    if (!me || !m) return;
    if ([m.x, m.z, m.ry].some((v) => typeof v !== 'number' || !isFinite(v))) return;
    me.x = m.x; me.z = m.z; me.ry = m.ry; me.y = typeof m.y === 'number' && isFinite(m.y) ? Math.max(0, Math.min(12, m.y)) : 0; me.anim = m.anim ? 1 : 0; me.run = !!m.run; me.crouch = !!m.crouch; me.sneak = !!m.sneak;
    me.em = typeof m.em === 'string' ? m.em.slice(0, 10) : ''; me.eid = Number(m.eid) | 0;
    me.ride = typeof m.ride === 'string' && /^[a-z0-9]{1,12}:\d{1,2}$/.test(m.ride) ? m.ride : '';
    me.riding = !!m.mount && !!prof(me.name).equip.mount;
    me.sword = !!m.sword && !!prof(me.name).items.sword;
  });

  // 외형은 바뀔 때만 전송 (사진 얼굴은 용량이 크므로 매 틱 보내지 않는다)
  sock.on('look', (look) => { if (!me) return; me.look = sanitizeLook(look); me.lv++; });
  // 놀래키기: 3.5m 안의 같은 방 사람들에게
  sock.on('boo', () => {
    if (!me) return;
    const now = Date.now(); if (now - (me.lastBoo || 0) < 1500) return; me.lastBoo = now;
    for (const p of players.values()) if (p !== me && p.room === me.room && Math.hypot(p.x - me.x, p.z - me.z) < 3.5) io.to(p.id).emit('booed', { from: me.name, fromId: me.id });
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
    if (!me) return;
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
      io.emit('chat', msg);
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
    if (!me.admin && lv < it.lv) return sock.emit('toast', { text: `🔒 Lv.${it.lv} 부터 살 수 있어요. (지금 Lv.${lv})` });
    if (have >= it.max) return sock.emit('toast', { text: it.max > 1 ? `${it.icon} ${it.name}은(는) ${it.max}개까지만 가질 수 있어요.` : `${it.icon} ${it.name}은(는) 이미 가지고 있어요.` });
    if (!me.admin && (pf.coins || 0) < it.price) return sock.emit('toast', { text: `🪙 코인이 모자라요. (${it.price}코인 필요 · 지금 ${pf.coins || 0}코인)` });
    if (!me.admin) pf.coins -= it.price;
    pf.items[id] = have + 1;
    if (it.kind === 'sword') pf.swordUses = it.uses;
    if (isWear(id) && !pf.equip[it.kind]) pf.equip[it.kind] = id; // 처음 산 날개·탈것은 바로 착용
    saveProfiles(); sendProfile(me);
    sock.emit('shop:bought', { id });
    sock.emit('toast', { text: `${it.icon} ${it.name}을(를) 샀어요!${isWear(id) ? ' (🎒 내 물건에서 착용/해제)' : ' (🎒 내 물건에서 사용)'}` });
  });
  sock.on('shop:equip', ({ id, on } = {}) => {
    if (!me) return; const it = SHOP[id]; if (!it || !isWear(id)) return;
    const pf = prof(me.name); if (!pf.items[id]) return;
    pf.equip[it.kind] = on ? id : (pf.equip[it.kind] === id ? '' : pf.equip[it.kind]);
    if (it.kind === 'mount' && !on) me.riding = false;
    saveProfiles(); sendProfile(me);
  });
  sock.on('shop:use', (id) => {
    if (!me || !['popper', 'rocket', 'sword'].includes(id)) return;
    const pf = prof(me.name); if (!pf.items[id]) return;
    const now = Date.now(); if (now - (me.lastFx || 0) < 900) return; me.lastFx = now;
    const room = me.room; if (!room) return;
    const fx = { type: id, id: me.id, x: me.x, z: me.z, y: me.y || 0, ry: me.ry };
    if (id === 'sword') {
      const hit = inst()?.slay?.(me);
      fx.hit = hit ? { x: hit.x, z: hit.z, name: hit.name } : null;
      if (hit) {
        pf.swordUses = Math.max(0, (pf.swordUses || 0) - 1);
        if (pf.swordUses <= 0) { delete pf.items.sword; me.sword = false; fx.broke = true; io.to(room).emit('toast', { text: `💥 ${me.name} 님의 전설의 검이 귀신을 10번 베고 산산조각 났다!` }); }
        else sock.emit('toast', { text: `🗡️ ${hit.name}을(를) 베어 없앴다! (남은 횟수 ${pf.swordUses}/10)` });
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
    if (!a.items[id] && !me.admin) return sock.emit('toast', { text: '가지고 있지 않은 물건이에요.' });
    if ((b.items[id] || 0) >= it.max) return sock.emit('toast', { text: `${t.name} 님은 ${it.name}을(를) 더 받을 수 없어요. (최대 ${it.max}개)` });
    const now = Date.now(); if (now - (me.lastGift || 0) < 1500) return; me.lastGift = now;
    const uses = it.kind === 'sword' ? (me.admin ? it.uses : a.swordUses || it.uses) : 0;
    if (!me.admin) { a.items[id] -= 1; if (a.items[id] <= 0) { delete a.items[id]; if (a.equip[it.kind] === id) a.equip[it.kind] = ''; if (it.kind === 'sword') a.swordUses = 0; } }
    b.items[id] = (b.items[id] || 0) + 1;
    if (it.kind === 'sword') b.swordUses = uses;
    if (isWear(id) && !b.equip[it.kind]) b.equip[it.kind] = id;
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
    ack({ players: [...players.values()].map((p) => ({ id: p.id, name: p.name, room: p.room === 'lobby' ? '로비' : p.room ? '게임 중' : '-', offline: !!p.offline, admin: !!p.admin, muted: Math.max(0, Math.ceil(((chatPenalty.get(p.name)?.muteUntil || 0) - Date.now()) / 1000)), warns: chatPenalty.get(p.name)?.warns || 0, lv: levelOf(prof(p.name).xp) })), games: instances.size,
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
    if (sc.hidden && !hiddenOk(me.name)) return sock.emit('toast', { text: '🔒 히든 테마는 모든 테마를 한 번씩 깨거나 만렙(Lv.20)이 되면 열려요.' });
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
      onEnd: ({ ms, full, type, hints = 0, over = false } = {}) => {
        saves[saveName] = sc.chapters.length - 1; saves[saveName + ':clear'] = 1; save();
        const names = party.members.map((id) => players.get(id)?.name).filter(Boolean);
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

  // ───── 음성 (파티원끼리 WebRTC 신호 중계)
  sock.on('voice:signal', ({ to, data }) => {
    const t = players.get(to);
    if (!me || !t) return;
    const sameParty = me.partyId && t.partyId === me.partyId, sameRoom = me.room && t.room === me.room; // '전체 듣기'는 같은 곳(로비·같은 게임)에 있는 사람끼리
    if (!sameParty && !sameRoom) return;
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
    const p = me;
    p.offline = true;
    clearTimeout(p.dropTimer);
    p.dropTimer = setTimeout(() => dropPlayer(p), 3 * 60 * 1000);
  });
  function dropPlayer(me) {
    if (!players.has(me.id) || !me.offline) return;
    leaveParty(me);
    io.to(me.room).emit('player:leave', me.id);
    players.delete(me.id);
    invites.delete(me.id);
    broadcastRoster();
    io.emit('chat', { channel: 'system', text: `${me.name} 님이 나갔습니다.` });
  }
});

function unlockedFor(name) {
  const out = {};
  if (!name) return out;
  for (const s of Object.values(SCENARIOS)) out[s.id] = { chapter: saves[s.saveKey(name)] ?? 0, cleared: !!saves[s.saveKey(name) + ':clear'] };
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

// ───── 상태 브로드캐스트 (15Hz)
let last = Date.now();
setInterval(() => {
  const now = Date.now(); const dt = (now - last) / 1000; last = now;
  const byRoom = {};
  for (const p of players.values()) { if (p.room) (byRoom[p.room] ||= []).push(pub(p)); }
  for (const [room, list] of Object.entries(byRoom)) {
    let ghosts = null;
    if (room.startsWith('inst:')) { const i = instances.get(room.slice(5)); i?.checkTime?.(); ghosts = i?.tick(dt) || null; }
    io.to(room).emit('state', { players: list, ghosts });
  }
}, 66);

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
