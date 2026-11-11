import { SCENARIOS, relicIcons } from './scenarios.js';
import { ITEMS, RECIPES } from './items.js';

const COOP_WINDOW = 8000;
const GHOST_SLOW = 0.5;
const SCARY_SOUNDS = new Set(['scream', 'scream_child', 'scream_wet', 'growl', 'sting', 'bang', 'glass', 'glitch']);
// 왕초보 모드에서는 귀신을 피하라는 안내 문구(괄호)를 이야기에서 뺀다
const easyText = (s) => String(s || '').replace(/\n*\([^()]*(?:피하자|부적|움직이지 못한다|손전등을 비추)[^()]*\)/g, '');
const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase();

// 한 파티의 방탈출 진행 상태(서버 권한)
export class GameInstance {
  constructor({ id, io, party, players, chapter, fear = 2, scenario = 'gwimun', onChapter, onEnd }) {
    this.sc = SCENARIOS[scenario] || SCENARIOS.gwimun;
    this.chapters = this.sc.chapters;
    this.fear = fear; // 0 왕초보(귀신 없음) · 1 순한맛 · 2 보통 · 3 매운맛
    this.id = id;
    this.room = 'inst:' + id;
    this.io = io;
    this.party = party;
    this.players = players; // 전체 플레이어 Map 참조
    this.flags = new Set();
    this.counters = {};
    this.taken = new Set();
    this.coopPress = {};
    this.hintLevel = {};
    this.wrong = {};
    this.onChapter = onChapter;
    this.onEnd = onEnd;
    this.ghost = null;
    this.ended = false;
    this.startedAt = Date.now(); this.startChapter = chapter; // 랭킹: 처음부터 시작한 판만 기록
    this.loadChapter(chapter);
  }

  members() {
    return this.party.members.map((id) => this.players.get(id)).filter((p) => p && p.room === this.room);
  }
  emit(ev, data) { this.io.to(this.room).emit(ev, data); }
  emitTo(pid, ev, data) { this.io.to(pid).emit(ev, data); }

  loadChapter(idx) {
    this.chapterIdx = idx;
    this.ch = this.chapters[idx];
    this.dark = !!this.ch.startDark;
    this.coopPress = {};
    // 한 챕터에 귀신이 여럿일 수 있다: ghost(주 귀신) + ghosts(추가 귀신, startFlag 로 등장)
    // 왕초보 모드(공포도 0): 쫓아오는 귀신이 아예 나오지 않는다
    const cfgs = this.fear === 0 ? [] : [...(this.ch.ghost ? [this.ch.ghost] : []), ...(this.ch.ghosts || [])];
    this.ghosts = cfgs.map((cfg, i) => ({ i, cfg, active: !!cfg.auto, x: cfg.spawn[0], z: cfg.spawn[1], ry: 0, pauseUntil: 0, repelUntil: 0, name: cfg.name, speed: cfg.speed, mode: 'wander', nextTp: Date.now() + 15000, type: cfg.type || 'woman' }));
    this.ghost = this.ghosts[0] || null;
    for (const p of this.members()) {
      p.x = this.ch.spawn[0] + (Math.random() - 0.5) * 1.5;
      p.z = this.ch.spawn[1] + (Math.random() - 0.5) * 1.0;
      p.invulnUntil = Date.now() + 4000;
    }
    this.onChapter?.(idx);
  }

  // 클라이언트로 보낼 챕터 데이터(정답 제거)
  clientChapter() {
    const c = this.ch;
    return {
      id: c.id, title: c.title, place: c.place, outdoor: !!c.outdoor, size: c.size, spawn: c.spawn,
      ambient: c.ambient, ground: c.ground, floor: c.floor, wall: c.wall, fog: c.fog, rain: !!c.rain, water: !!c.water,
      walls: c.walls || [], props: c.props || [], intro: c.intro,
      objects: c.objects.map((o) => ({
        id: o.id, t: o.t, x: o.x, z: o.z, r: o.r || 0, y: o.y, label: o.label, kind: o.kind, color: o.color, len: o.len,
        // 모양 · 움직임 정보 (크기 s · 높이 h · 반지름 r2 · 열림 · 거울 물결 · 핏자국 · 폭 · 켜짐 · 회전 속도 · 움직이는 맵 anim · 풀면 움직이기 moveOnDone)
        s: o.s, h: o.h, r2: o.r2, open: o.open, wave: o.wave, blood: o.blood, w: o.w, on: o.on === true ? true : undefined, speed: o.speed, anim: o.anim, moveOnDone: o.moveOnDone,
        input: o.lock?.input, buttons: o.lock?.buttons, inputLen: o.lock?.len, notes: o.lock?.notes,
      })),
    };
  }

  objState() {
    const st = {};
    for (const o of this.ch.objects) {
      const reqOk = (o.req || []).every((f) => this.flags.has(f));
      let visible = !(o.hidden && !reqOk);
      if (o.kind === 'pickup' && !o.perPlayer && this.taken.has(o.id)) visible = false;
      if (o.goneOn && this.flags.has(o.goneOn)) visible = false;
      st[o.id] = { v: visible, done: this.isDone(o) };
    }
    return st;
  }
  isDone(o) {
    if (o.doneFlag) return this.flags.has(o.doneFlag); // 다른 퍼즐(협동 등)이 풀리면 '완료'로 보고 움직이게 한다
    if (o.kind === 'lock') return this.flags.has('solved:' + o.id);
    if (o.kind === 'use') return (this.counters[o.id] || 0) >= (o.use?.times || 1);
    if (o.kind === 'examine' && o.once && o.on) return this.flags.has('seen:' + o.id);
    return false;
  }

  objective() {
    const list = this.ch.objectives || [];
    const idx = list.findIndex((ob) => !this.flags.has(ob.until));
    const ob = list[idx === -1 ? list.length - 1 : idx];
    if (!ob) return null;
    return { text: ob.text, key: this.chapterIdx + ':' + ob.until, hintsLeft: Math.max(0, ob.hints.length - (this.hintLevel[this.chapterIdx + ':' + ob.until] || 0)) };
  }

  relicCount() { return this.sc.relics.filter((r) => this.flags.has(r)).length; }
  scenarioInfo() { return { id: this.sc.id, title: this.sc.title, relicName: this.sc.relicName, difficulty: this.sc.difficulty || 3, relicTotal: this.sc.relics.length, relicIcons: relicIcons(this.sc), cine: this.sc.cine }; }

  hintsUsed() { return Object.values(this.hintLevel).reduce((a, b) => a + b, 0); }
  fullState() {
    return {
      elapsed: Date.now() - this.startedAt, hintsUsed: this.hintsUsed(), timed: this.startChapter === 0,
      chapterIdx: this.chapterIdx,
      chapter: this.clientChapter(),
      objects: this.objState(),
      objective: this.objective(),
      dark: this.dark,
      relics: this.relicCount(),
      ghostName: this.ghost?.name || null,
      fear: this.fear,
      scenario: this.scenarioInfo(),
    };
  }

  syncAll() {
    this.emit('game:sync', { objects: this.objState(), objective: this.objective(), dark: this.dark, relics: this.relicCount(), hintsUsed: this.hintsUsed(), elapsed: Date.now() - this.startedAt });
  }

  // ───── 효과 적용
  apply(on, actor) {
    if (!on) return;
    const name = actor?.name || '';
    if (on.flag) this.flags.add(on.flag);
    if (on.flags) on.flags.forEach((f) => this.flags.add(f));
    if (on.give && actor) [].concat(on.give).forEach((it) => this.giveItem(actor, it));
    if (on.light === 'off') this.dark = true;
    if (on.light === 'on') this.dark = false;
    if (on.ghost === 'start') for (const gh of this.ghosts) if (!gh.cfg.startFlag) { gh.active = true; gh.pauseUntil = Date.now() + 2500; }
    if (on.ghost === 'stop') for (const gh of this.ghosts) { gh.active = false; gh.stopped = true; }
    // 왕초보: 비명·으르렁 같은 깜짝 효과음은 부드러운 소리로 바꾼다
    if (on.sound) this.emit('game:sound', this.fear === 0 && SCARY_SOUNDS.has(on.sound) ? 'whisper' : on.sound);
    if (on.scare && this.fear > 0) this.emit('game:scare', { type: on.scare });
    if (on.scareSelf && actor && this.fear > 0) this.emitTo(actor.id, 'game:scare', { type: on.scareSelf });
    if (on.story) this.emit('game:story', { ...(this.fear === 0 ? { ...on.story, text: easyText(on.story.text) } : on.story), by: name });
    if (on.toast) this.emit('toast', { text: on.toast });
    this.syncAll();
  }

  giveItem(p, item) {
    p.inv.push(item);
    if (ITEMS[item]?.relic) this.flags.add(item);
    this.emitTo(p.id, 'inv', p.inv);
    this.emit('toast', { text: `${p.name} 님이 [${ITEMS[item]?.icon} ${ITEMS[item]?.name}] 을(를) 얻었다` });
  }

  partyHas(items) {
    const all = this.members().flatMap((m) => m.inv);
    return items.every((it) => all.includes(it));
  }

  textFor(o) {
    let t = o.text || '';
    for (const a of o.alt || []) if (this.flags.has(a.flag)) t = a.text;
    return t;
  }

  // ───── 상호작용
  interact(p, objId) {
    const o = this.ch.objects.find((x) => x.id === objId);
    if (!o || o.kind === 'deco') return;
    const st = this.objState()[o.id];
    if (!st?.v) return;
    const reqOk = (o.req || []).every((f) => this.flags.has(f));
    const title = o.label || '';

    if (!reqOk) {
      this.emitTo(p.id, 'ui:examine', { title, text: o.lockedText || '지금은 아무것도 할 수 없다.' });
      return;
    }

    switch (o.kind) {
      case 'examine': {
        const first = o.once && o.on && !this.flags.has('seen:' + o.id);
        let text = !first && o.doneText && this.flags.has('seen:' + o.id) ? o.doneText : this.textFor(o);
        if (o.reveal) {
          if (p.inv.includes(o.reveal.item)) { text += '\n\n' + o.reveal.text; if (o.reveal.flag && !this.flags.has(o.reveal.flag)) { this.flags.add(o.reveal.flag); this.syncAll(); } }
          else if (o.reveal.hint !== false) text += '\n\n(무언가 특별한 도구로 비춰 보면 다른 것이 보일지도 모른다)';
        }
        this.emitTo(p.id, 'ui:examine', { title, text, doc: o.t }); // doc: 소품 종류 (화면에서 종이 모양을 고르는 데만 쓴다)
        if (first) { this.flags.add('seen:' + o.id); this.apply(o.on, p); }
        else if (o.on && !o.once && !this.flags.has('seen:' + o.id)) { this.flags.add('seen:' + o.id); this.apply(o.on, p); }
        break;
      }
      case 'signal': {
        this.emitTo(p.id, 'ui:signal', { title, text: this.textFor(o), morse: o.signal?.morse || null, letters: o.signal?.letters || null });
        if (o.onView && !this.flags.has('seen:' + o.id)) { this.flags.add('seen:' + o.id); this.apply(o.onView, p); }
        break;
      }
      case 'pickup': {
        const key = o.perPlayer ? o.id + ':' + p.id : o.id;
        if (this.taken.has(key)) { this.emitTo(p.id, 'ui:examine', { title, text: o.takenText || '이미 가져갔다.' }); return; }
        this.taken.add(key);
        if (o.text) this.emitTo(p.id, 'ui:examine', { title, text: o.text, doc: o.t });
        this.giveItem(p, o.item);
        if (o.onPick) this.apply(o.onPick, p); else this.syncAll();
        break;
      }
      case 'lock': {
        if (this.flags.has('solved:' + o.id)) {
          if (o.doneText) this.emitTo(p.id, 'ui:examine', { title, text: o.doneText });
          return;
        }
        if (o.needItems && !this.partyHas(o.needItems)) {
          this.emitTo(p.id, 'ui:examine', { title, text: o.needItemsText });
          return;
        }
        this.emitTo(p.id, 'ui:lock', { id: o.id, title, text: this.textFor(o), input: o.lock.input, buttons: o.lock.buttons, len: o.lock.len, notes: !!o.lock.notes, drum: !!o.lock.drum, morse: !!o.lock.morse, wheels: o.lock.wheels, size: o.lock.size, lightsOut: !!o.lock.lightsOut,
          min: o.lock.min, max: o.lock.max, step: o.lock.step, unit: o.lock.unit, left: o.lock.left, right: o.lock.right, colors: o.lock.colors,
          sequence: o.lock.input === 'simon' ? o.lock.answer : undefined, rings: o.lock.rings, positions: o.lock.positions, image: o.lock.image, labels: o.lock.labels,
          points: o.lock.points, weights: o.lock.weights, target: o.lock.target, pick: o.lock.pick, cups: o.lock.cups, swaps: o.lock.input === 'cups' ? this.cupSwaps(o) : undefined, start: o.lock.start, close: o.lock.close });
        break;
      }
      case 'use': {
        const times = o.use.times || 1;
        const have = this.counters[o.id] || 0;
        if (have >= times) {
          if (o.toChapter != null) return this.gotoChapter(o.toChapter);
          this.emitTo(p.id, 'ui:examine', { title, text: o.doneText || this.textFor(o) });
          return;
        }
        const i = p.inv.indexOf(o.use.item);
        if (i === -1) {
          this.emitTo(p.id, 'ui:examine', { title, text: (o.text ? o.text + '\n\n' : '') + (o.needText || '필요한 물건이 없다.') });
          return;
        }
        p.inv.splice(i, 1);
        this.emitTo(p.id, 'inv', p.inv);
        this.counters[o.id] = have + 1;
        if (this.counters[o.id] >= times) {
          this.apply(o.on, p);
          if (o.toChapter != null) setTimeout(() => this.gotoChapter(o.toChapter), 1200);
        } else {
          this.emit('toast', { text: `${p.name}: ${o.progressText || '사용했다.'} (${this.counters[o.id]}/${times})` });
          this.syncAll();
        }
        break;
      }
      case 'coop': {
        const g = o.coop.group;
        if (this.flags.has('coop:' + g)) { this.emitTo(p.id, 'ui:examine', { title, text: '이미 열렸다.' }); return; }
        const now = Date.now();
        const press = (this.coopPress[g] ||= {});
        press[o.id] = { pid: p.id, t: now };
        const need = Math.min(o.coop.need, this.members().length);
        const active = Object.entries(press).filter(([, v]) => now - v.t < COOP_WINDOW);
        const distinctObjs = new Set(active.map(([k]) => k)).size;
        const distinctPlayers = new Set(active.map(([, v]) => v.pid)).size;
        const ok = need <= 1 ? true : distinctObjs >= need && distinctPlayers >= need;
        if (ok) {
          this.flags.add('coop:' + g);
          this.apply(this.ch.coops?.[g]?.on, p);
        } else {
          this.emit('toast', { text: `${p.name}: ${o.text} (${Math.min(distinctObjs, need)}/${need}) — 다른 사람이 8초 안에 반대쪽을!` });
          this.emit('game:coopPulse', { id: o.id });
        }
        break;
      }
      case 'door': {
        if (o.to === 'end') return this.finish();
        this.gotoChapter(o.to);
        break;
      }
    }
  }

  tryLock(p, objId, answer) {
    const o = this.ch.objects.find((x) => x.id === objId);
    if (!o || o.kind !== 'lock' || this.flags.has('solved:' + o.id)) return;
    if (!(o.req || []).every((f) => this.flags.has(f))) return;
    const given = Array.isArray(answer) ? answer.join(',') : answer;
    if (o.lock.input === 'tune') {
      const ok = Math.abs(Number(answer) - o.lock.answer) <= (o.lock.tol ?? 0.3);
      return this.lockResult(p, o, ok);
    }
    if (o.lock.input === 'balance') { // 저울: 올린 추의 조합 (순서 무관)
      const pick = [].concat(answer).map(Number).sort((a, b) => a - b).join(',');
      return this.lockResult(p, o, pick === [...o.lock.answer].sort((a, b) => a - b).join(','));
    }
    if (o.lock.input === 'cups') { // 야바위: 섞기가 끝난 뒤 공이 든 컵 (서버가 섞은 결과로 채점)
      const ok = Number(answer) === this.cupEnd?.[o.id]; delete this.cupEnd?.[o.id];
      return this.lockResult(p, o, ok);
    }
    const seq = ['buttons', 'dial', 'wires', 'simon', 'rotate', 'stars'].includes(o.lock.input);
    const answers = Array.isArray(o.lock.answer) && seq ? [o.lock.answer.join(',')] : [].concat(o.lock.answer);
    // 말 입력은 쉼표·마침표·느낌표 같은 문장부호를 무시한다 ("수아야, 같이 집에 가자!")
    const loose = (v) => norm(v).replace(/[,.!?~'"…。、！？]/g, '');
    const eq = o.lock.input === 'text' ? (a) => loose(a) === loose(given) : (a) => norm(a) === norm(given);
    return this.lockResult(p, o, answers.some((a) => eq(a) || (o.lock.input === 'digits' && Number(given) === Number(a) && String(given).length >= 3)));
  }
  // 야바위 컵 섞기: 매번 새로 섞고, 공의 마지막 위치를 기억해 둔다
  cupSwaps(o) {
    const n = o.lock.cups || 3, k = o.lock.swaps || 8;
    let ball = o.lock.start ?? 1; const swaps = [];
    for (let i = 0; i < k; i++) { const a = Math.floor(Math.random() * n); let b = Math.floor(Math.random() * (n - 1)); if (b >= a) b++; swaps.push([a, b]); if (ball === a) ball = b; else if (ball === b) ball = a; }
    (this.cupEnd ||= {})[o.id] = ball;
    return swaps;
  }
  lockResult(p, o, ok) {
    if (ok) {
      this.flags.add('solved:' + o.id);
      this.emitTo(p.id, 'lock:result', { id: o.id, ok: true });
      this.emit('toast', { text: `${p.name} 님이 [${o.label}] 을(를) 풀었다!` });
      this.apply(o.on, p);
    } else {
      this.wrong[o.id] = (this.wrong[o.id] || 0) + 1;
      this.emitTo(p.id, 'lock:result', { id: o.id, ok: false });
      // 강한 공포: 틀릴 때마다 무언가 반응한다
      const n = this.wrong[o.id];
      const scareNow = this.fear >= 3 ? (n % 3 === 0 || (o.wrongScare && n % 2 === 0)) : this.fear === 2 ? (o.wrongScare && n % 4 === 0) : false;
      if (scareNow) {
        this.emitTo(p.id, 'game:scare', { type: ['face', 'hands', 'child'][n % 3], src: 'wrong' });
      } else {
        this.emitTo(p.id, 'game:sound', 'whisper');
      }
    }
  }

  combine(p, a, b) {
    const r = RECIPES.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
    if (!r) { this.emitTo(p.id, 'toast', { text: '아무 일도 일어나지 않았다.' }); return; }
    const ia = p.inv.indexOf(r.a); const ib = p.inv.indexOf(r.b);
    if (ia === -1 || ib === -1) { this.emitTo(p.id, 'toast', { text: '두 물건을 모두 가지고 있어야 한다.' }); return; }
    p.inv = p.inv.filter((_, i) => i !== ia && i !== ib);
    this.giveItem(p, r.out);
    this.apply({ flag: r.flag, story: { title: '조합', text: r.text }, sound: 'bell' }, p);
  }

  useItem(p, item) {
    const i = p.inv.indexOf(item);
    if (i === -1) return;
    const def = ITEMS[item];
    if (def?.use === 'talisman') {
      p.inv.splice(i, 1);
      this.emitTo(p.id, 'inv', p.inv);
      const act = this.ghosts.filter((gh) => gh.active);
      if (act.length) {
        // 활성화된 귀신 모두를 플레이어로부터 멀리 밀어낸다
        for (const gh of act) {
          gh.repelUntil = Date.now() + 20000;
          const dx = gh.x - p.x, dz = gh.z - p.z; const d = Math.hypot(dx, dz) || 1;
          gh.x = clamp(p.x + (dx / d) * 9, -this.ch.size[0] / 2 + 1, this.ch.size[0] / 2 - 1);
          gh.z = clamp(p.z + (dz / d) * 9, -this.ch.size[1] / 2 + 1, this.ch.size[1] / 2 - 1);
        }
        this.emit('game:sound', 'talisman');
        this.emit('toast', { text: `${p.name} 님이 부적을 태웠다! ${act.map((x) => x.name).join(', ')}이(가) 20초간 물러난다.` });
      } else {
        this.emit('toast', { text: `${p.name} 님이 부적을 태웠다. …주변은 고요하다. 아깝게 썼다.` });
      }
    }
  }

  giveTo(p, item, toId) {
    const to = this.players.get(toId);
    if (!to || to.room !== this.room) return;
    const i = p.inv.indexOf(item);
    if (i === -1) return;
    p.inv.splice(i, 1);
    to.inv.push(item);
    this.emitTo(p.id, 'inv', p.inv);
    this.emitTo(to.id, 'inv', to.inv);
    this.emit('toast', { text: `${p.name} → ${to.name} : [${ITEMS[item].icon} ${ITEMS[item].name}] 전달` });
  }

  hint(p) {
    const ob = this.objective();
    if (!ob) return;
    const list = this.ch.objectives;
    const cur = list.find((o) => this.chapterIdx + ':' + o.until === ob.key);
    const lv = this.hintLevel[ob.key] || 0;
    if (lv >= cur.hints.length) { this.emitTo(p.id, 'toast', { text: '더 이상 힌트가 없다.' }); return; }
    this.hintLevel[ob.key] = lv + 1;
    this.emit('game:hint', { text: cur.hints[lv], level: lv + 1, total: cur.hints.length, by: p.name });
    this.syncAll();
  }

  gotoChapter(idx) {
    if (idx >= this.chapters.length) return this.finish();
    this.loadChapter(idx);
    this.emit('game:chapter', this.fullState());
  }

  finish() {
    if (this.ended) return;
    this.ended = true;
    const relics = this.relicCount();
    const all = relics >= this.sc.relics.length;
    const end = all ? this.sc.endings.true : this.sc.endings.normal;
    const ms = Date.now() - this.startedAt, full = this.startChapter === 0;
    this.emit('game:ending', { ...end, relics, type: all ? 'true' : 'normal', total: this.sc.relics.length, icons: relicIcons(this.sc), cine: all ? this.sc.cine.true : this.sc.cine.normal, ms, full, hints: this.hintsUsed() });
    this.onEnd?.({ ms, full, type: all ? 'true' : 'normal', hints: this.hintsUsed() });
  }

  // 매 틱마다 호출 — 귀신 AI
  //  wander(배회) → 감지 범위 안에 들어오면 hunt(추격) → 5초간 놓치면 다시 배회
  //  달리면 소리로 더 멀리서 감지, 웅크리면(C) 감지 범위가 줄어든다
  //  손전등을 비추면 느려지고, '하얀 여자'는 완전히 굳는다
  //  일부 귀신은 추격 중 플레이어 등 뒤로 순간이동한다
  tick(dt) {
    if (this.ended || !this.ghosts.length) return null;
    const out = [];
    for (const gh of this.ghosts) {
      if (!gh.active && !gh.stopped && gh.cfg.startFlag && this.flags.has(gh.cfg.startFlag)) { gh.active = true; gh.pauseUntil = Date.now() + 2000; }
      if (!gh.active) continue;
      const r = this.tickOne(gh, dt);
      if (r) out.push({ ...r, i: gh.i });
    }
    return out.length ? out : null;
  }
  tickOne(g, dt) {
    const cfg = g.cfg;
    const now = Date.now();
    const base = { x: g.x, z: g.z, ry: g.ry, type: g.type, name: g.name, mode: g.mode, lit: false };
    if (now < g.repelUntil) return { ...base, v: false };
    if (now < g.pauseUntil) return { ...base, v: true, mode: 'pause' };
    const ms = this.members();
    const [W, D] = this.ch.size;

    // 손전등에 비춰지고 있는가
    let lit = false;
    for (const m of ms) {
      if (!m.light) continue;
      const dx = g.x - m.x, dz = g.z - m.z, d = Math.hypot(dx, dz);
      if (d > 9 || d < 0.01) continue;
      if ((dx * Math.sin(m.ry) + dz * Math.cos(m.ry)) / d > 0.9) lit = true;
    }

    // 감지
    let target = null, best = 1e9;
    for (const m of ms) {
      const d = Math.hypot(m.x - g.x, m.z - g.z);
      // 손전등을 켜면 멀리서도 바로 들킨다. 끄면 아주 가까이(약 1.8m) 와야 눈치챈다 — 모든 테마 공통
      if (m.sneak) continue; // 조심조심 걷는 중: 귀신이 전혀 눈치채지 못한다
      let sense;
      if (m.light) {
        sense = (cfg.sense || 7) + 1.5 - (this.fear === 1 ? 2 : 0);
        if (m.run) sense += cfg.hearRun ? 7 : 3;
        if (m.crouch) sense -= 3.5;
      } else {
        sense = 1.8;
        if (m.run) sense += 1.2;   // 어둠 속에서 뛰면 발소리로 조금 더 멀리서
        if (m.crouch) sense -= 0.6;
      }
      if (d < sense && d < best) { best = d; target = m; }
    }
    if (target) { g.mode = 'hunt'; g.lastSeen = now; g.target = target.id; }
    else if (g.mode === 'hunt') {
      const t = this.players.get(g.target);
      // 손전등을 끄고 숨으면 더 빨리 놓친다
      if (t && t.room === this.room && !t.sneak && now - g.lastSeen < (t.light ? 5000 : 1800)) { target = t; best = Math.hypot(t.x - g.x, t.z - g.z); }
      else g.mode = 'wander';
    }

    // 귀신 속도: 기본의 절반 수준 (순한맛은 더 느리게)
    let speed = g.speed * GHOST_SLOW * (this.fear === 1 ? 0.75 : this.fear === 2 ? 0.9 : 1), tx, tz;
    if (g.mode === 'hunt' && target) {
      tx = target.x; tz = target.z;
      if (best < 4) speed *= 1.12;
      if (cfg.teleport && now > g.nextTp && best > 5) {
        g.nextTp = now + cfg.teleport * 1000 * (0.7 + Math.random() * 0.6);
        g.x = clamp(target.x - Math.sin(target.ry) * 3.2, -W / 2 + 0.6, W / 2 - 0.6);
        g.z = clamp(target.z - Math.cos(target.ry) * 3.2, -D / 2 + 0.6, D / 2 - 0.6);
        g.pauseUntil = now + 1100;
        this.emitTo(target.id, 'game:ghostTp', { name: g.name });
        return { ...base, x: g.x, z: g.z, v: true, mode: 'pause' };
      }
    } else {
      if (!g.wp || Math.hypot(g.wp[0] - g.x, g.wp[1] - g.z) < 0.6 || now > g.wpUntil) {
        g.wp = [(Math.random() - 0.5) * (W - 2), (Math.random() - 0.5) * (D - 2)];
        g.wpUntil = now + 9000;
      }
      tx = g.wp[0]; tz = g.wp[1]; speed *= 0.45;
    }
    if (lit) speed = cfg.lightFreeze ? 0 : cfg.lightFast ? speed * 1.4 : speed * 0.5;

    const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
    if (d > 0.01 && speed > 0) {
      let ux = dx / d, uz = dz / d;
      if (cfg.zigzag) { const w = Math.sin(now / 280) * 0.9; const nx = ux - uz * w, nz = uz + ux * w; const l = Math.hypot(nx, nz); ux = nx / l; uz = nz / l; }
      const step = Math.min(d, speed * dt);
      g.x += ux * step; g.z += uz * step;
      g.ry = Math.atan2(ux, uz);
    }
    g.x = clamp(g.x, -W / 2 + 0.4, W / 2 - 0.4); g.z = clamp(g.z, -D / 2 + 0.4, D / 2 - 0.4);

    // 붙잡기 (굳어 있는 동안은 못 잡는다)
    if (target && !(lit && cfg.lightFreeze)) {
      const cd = Math.hypot(target.x - g.x, target.z - g.z);
      if (cd < 0.85 && now > (target.invulnUntil || 0)) {
        target.invulnUntil = now + 5000;
        target.x = this.ch.spawn[0]; target.z = this.ch.spawn[1];
        this.emitTo(target.id, 'game:caught', { x: target.x, z: target.z, by: g.name, type: g.type });
        this.emit('toast', { text: `${target.name} 님이 ${g.name}에게 붙잡혔다…` });
        g.pauseUntil = now + 3500; g.mode = 'wander';
        g.x = cfg.spawn[0]; g.z = cfg.spawn[1];
      }
    }
    return { x: g.x, z: g.z, ry: g.ry, v: true, mode: g.mode, lit, type: g.type, name: g.name };
  }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
