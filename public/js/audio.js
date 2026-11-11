// 외부 음원 없이 Web Audio 로 합성하는 공포 사운드

// ───── 테마별 배경 선율 (자작곡). Play Sheet Music 으로 미리 들어 본 악보(ABC 표기)를 그대로 연주한다.
// key: 조표(올림 ^ / 내림 _), eighth: 8분음표 길이(초), voice: 음색, rest: 한 곡이 끝난 뒤 쉬는 시간(초)
const THEMES = {
  gwimun: { title: '서하리의 밤', key: {}, eighth: 0.33, rest: [10, 18], voice: 'gayageum',
    abc: 'A3 c2 d e3 d2 c | A3 G2 A c3 A3 | e3 g2 e d3 c2 A | G3 A2 c A6 | c3 d2 e g3 e2 d | e3 d2 c A3 G3 | A3 c2 d e2 d c2 A | A12' },
  ship: { title: '안개 속 뱃노래', key: {}, eighth: 0.4, rest: [9, 16], voice: 'accordion',
    abc: 'D2 F A2 G | F2 E D3 | C2 E G2 F | E3 C3 | D2 F A2 d | c2 A G3 | F2 E D2 C | D6' },
  doll: { title: '클라라의 오르골', key: { F: 1 }, eighth: 0.375, rest: [8, 14], voice: 'musicbox',
    abc: "B2 e2 g2 | f2 e2 B2 | c2 e2 a2 | g4 f2 | e2 g2 b2 | a2 g2 e2 | ^d2 f2 a2 | g4 z2 | B2 e2 g2 | f2 e2 B2 | c2 B2 A2 | G2 F2 E2 | ^D2 F2 A2 | B2 A2 F2 | E6 | E4 z2" },
  hospital: { title: '7병동 자장가', key: { B: -1, E: -1, A: -1 }, eighth: 0.6, rest: [12, 20], voice: 'lullaby',
    abc: 'G4 E2 F2 | G4 c4 | B4 A2 G2 | F8 | E4 D2 C2 | D4 G4 | =B,4 C2 D2 | C8' },
  camp: { title: '모닥불 노래', key: { F: 1 }, eighth: 0.42, rest: [10, 16], voice: 'guitar',
    abc: 'D2 G2 B2 G2 | A2 B2 c2 A2 | B2 d2 c2 B2 | A6 D2 | G2 B2 d2 B2 | c2 e2 d2 c2 | B2 A2 F2 A2 | G8' },
  west: { title: '교수대의 하모니카', key: {}, eighth: 0.43, rest: [10, 18], voice: 'harmonica',
    abc: 'E2 A2 c3 B | A4 E4 | D2 F2 A3 G | E8 | E2 A2 c2 e2 | d3 c B2 A2 | G2 B2 E2 ^G2 | A8' },
  kimono: { title: '지는 동백', key: {}, eighth: 0.56, rest: [11, 18], voice: 'koto',
    abc: 'E4 F2 A2 | B4 A4 | c4 B2 A2 | F6 E2 | A4 B2 c2 | e4 c4 | B2 A2 F2 E2 | E8' },
};
THEMES.rain = THEMES.gwimun;

// ───── 긴장감 있는 테마 배경음악 (자작곡): 드럼 · 반복 베이스 · 불협화음 현악 · 선율이 함께 연주된다.
// 16칸(=한 마디, 16분음표) 패턴. x=치기 · .=쉼. 베이스 칸의 숫자/문자는 근음에서 몇 반음 위(0~9, a=10, b=11).
// 구성: 도입 4마디 → 그루브 8마디 → 절정 8마디 → 숨 고르기 4마디 → 반복. 귀신이 쫓아오면 바로 절정.
const SCORES = {
  gwimun: { bpm: 126, root: 45, kick: 'taiko', snare: 'deok', hat: 'rim', tom: 'drum', lead: 'gwimun', leadVoice: 'gayageum', accent: 'gong',
    K: 'x.....x...x.....', T: '....x.......x.x.', H: '..x...x...x...x.', S: '', bass: '0.....0...0..3..', stab: 'x.........x.....', prog: [0, 0, 1, 0, 0, 0, -2, -1] },
  ship: { bpm: 116, root: 38, kick: 'kick', snare: 'snare', hat: 'hat', tom: 'timpani', lead: 'ship', leadVoice: 'accordion', accent: 'foghorn',
    K: 'x.......x.......', T: '......x.......xx', H: '..x...x...x...x.', S: '....x.......x...', bass: '0.0.0.0.0.0.1.0.', stab: 'x.......x.....x.', prog: [0, 0, -2, -2, 0, 0, 1, 1] },
  doll: { bpm: 132, root: 40, kick: 'kick', snare: 'pizz', hat: 'tick', tom: 'drum', lead: 'doll', leadVoice: 'musicbox', accent: 'glass',
    K: 'x.......x.......', T: '..............x.', H: 'x.x.x.x.x.x.x.x.', S: '....x.......x...', bass: '0...7...0...6...', stab: 'x...x...x...x...', prog: [0, 0, -1, -1, 0, 0, 1, -1] },
  hospital: { bpm: 120, root: 36, kick: 'heart', snare: 'clap', hat: 'beep', tom: 'drum', lead: 'hospital', leadVoice: 'lullaby', accent: 'flatline',
    K: 'x..x....x..x....', T: '', H: '.......x.......x', S: '....x.......x...', bass: '0.......0...1...', stab: 'x.......x...x...', prog: [0, 0, 0, 1, 0, 0, -1, 1] },
  camp: { bpm: 134, root: 43, kick: 'kick', snare: 'snare', hat: 'shaker', tom: 'drum', lead: 'camp', leadVoice: 'guitar', accent: 'whisper',
    K: 'x...x...x...x...', T: '..x...x...x..xx.', H: 'xxxxxxxxxxxxxxxx', S: '....x.......x...', bass: '0.0.0.0.3.3.2.2.', stab: 'x.......x.......', prog: [0, 0, -2, -1, 0, 0, -4, -1] },
  west: { bpm: 140, root: 45, kick: 'kick', snare: 'snare', hat: 'hat', tom: 'drum', lead: 'west', leadVoice: 'harmonica', accent: 'whip',
    K: 'x..x..x.x..x..x.', T: '..............xx', H: '..x...x...x...x.', S: '....x.......x...', bass: '0..0..0.5..5..3.', stab: 'x.......x..x....', prog: [0, 0, -2, 1, 0, 0, -2, -1] },
  kimono: { bpm: 128, root: 40, kick: 'taiko', snare: 'deok', hat: 'rim', tom: 'drum', lead: 'kimono', leadVoice: 'koto', accent: 'gong',
    K: 'x.......x.......', T: 'x...x..x..x.x...', H: '..x.x...x...x.x.', S: '', bass: '0.......1.......', stab: 'x.......x.x.....', prog: [0, 0, 1, 0, 0, 0, 1, 3] },
  // 삐에로: 3/4 왈츠 (12칸 = 한 마디)
  clown: { bpm: 168, steps: 12, root: 45, kick: 'kick', snare: 'oompah', hat: 'hat', tom: 'drum', lead: 'clown', leadVoice: 'calliope', accent: 'honk',
    K: 'x...........', T: '..........xx', H: '..x...x...x.', S: '....x...x...', bass: '0...........', stab: 'x...........', prog: [0, 0, 7, 7, 0, 5, 7, 0] },
};
SCORES.rain = SCORES.gwimun;
THEMES.clown = { key: {}, unit: 4, abc: "e z ^d | e z c | B z A | ^G z z | A B c | d z c | B z ^G | A z z | e f e | ^d e z | c' z b | a z z | f e d | c B A | ^G B E | A z z" };
// 아주 작은 ABC 해석기: 음이름(C~B, c~b), 옥타브(' ,), 임시표(^ _ =), 길이(2, 3, /2, 3/2), 쉼표 z
function parseAbc(abc, key) {
  const out = []; const re = /(\^|_|=)?([A-Ga-gz])([',]*)(\d*)(\/?)(\d*)/g; let m;
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  for (const bar of abc.split('|')) {
    const acc = {}; // 마디 안에서 임시표 유지
    while ((m = re.exec(bar))) {
      const [, ac, letter, oct, num, slash, den] = m;
      let len = num ? Number(num) : 1; if (slash) len = len / (den ? Number(den) : 2);
      if (letter === 'z') { out.push({ midi: null, len }); continue; }
      const up = letter.toUpperCase(); let midi = 60 + SEMI[up] + (letter === up ? 0 : 12);
      for (const o of oct) midi += o === "'" ? 12 : -12;
      if (ac) acc[up + oct + (letter === up)] = ac === '^' ? 1 : ac === '_' ? -1 : 0;
      const a = acc[up + oct + (letter === up)];
      midi += a !== undefined ? a : key[up] || 0;
      out.push({ midi, len });
    }
    re.lastIndex = 0;
  }
  return out;
}

export class AudioFX {
  constructor() { this.ctx = null; this.amb = null; this.mode = null; }
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain(); this.master.gain.value = this.vol ?? 0.8; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  get t() { return this.ctx.currentTime; }
  noise(dur, { freq = 1000, q = 1, type = 'bandpass', gain = 0.3, attack = 0.01, release = 0.3, at = 0 } = {}) {
    const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); const t0 = this.t + at;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - release)); g.gain.linearRampToValueAtTime(0, t0 + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t0); s.stop(t0 + dur + 0.05);
    return { f, g };
  }
  tone(freq, dur, { type = 'sine', gain = 0.2, attack = 0.01, release = 0.2, at = 0, slide = null, detune = 0 } = {}) {
    const c = this.ctx; const o = c.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const g = c.createGain(); const t0 = this.t + at;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - release)); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }

  // ── 배경음
  ambient(mode) {
    if (!this.ctx || this.mode === mode) return;
    this.mode = mode;
    this.score = null; clearInterval(this.scoreTimer);
    if (this.tuneBus) { const old = this.tuneBus; this.tuneBus = null; clearTimeout(this.tuneTimer); old.gain.linearRampToValueAtTime(0, this.t + 1.2); setTimeout(() => old.disconnect(), 1500); }
    if (this.amb) { const a = this.amb; a.g.gain.linearRampToValueAtTime(0, this.t + 1.5); setTimeout(() => a.nodes.forEach((n) => { try { n.stop(); } catch {} }), 1700); this.amb = null; }
    if (!mode) return;
    const c = this.ctx; const g = c.createGain(); g.gain.value = 0; g.connect(this.master);
    const nodes = [];
    if (mode === 'lobby') {
      // 포근한 오르골 패드
      [261.6, 329.6, 392, 523.2].forEach((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const og = c.createGain(); og.gain.value = 0.025; const lfo = c.createOscillator(); lfo.frequency.value = 0.15 + i * 0.07; const lg = c.createGain(); lg.gain.value = 0.02; lfo.connect(lg).connect(og.gain); o.connect(og).connect(g); o.start(); lfo.start(); nodes.push(o, lfo); });
      g.gain.linearRampToValueAtTime(0.6, this.t + 2);
      // 로비 테마: 포근한 오르골 멜로디 (자작곡) 반복
      const N = { C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, B4: 493.9, C6: 1046.5, G4: 392 };
      const tune = ['E5', 'G5', 'C6', 'G5', 'A5', 'G5', 'E5', '-', 'F5', 'E5', 'D5', 'G4', 'C5', '-', 'E5', 'D5', 'C5', 'E5', 'G5', 'A5', 'G5', '-', 'F5', 'D5', 'B4', 'D5', 'C5', '-', '-', '-'];
      let step = 0;
      clearInterval(this.lobbyTimer);
      this.lobbyTimer = setInterval(() => { if (this.mode !== 'lobby') return clearInterval(this.lobbyTimer); const n = tune[step++ % tune.length]; if (n !== '-') { this.tone(N[n], 1.1, { type: 'sine', gain: 0.05, release: 1.0 }); this.tone(N[n] * 2, 0.6, { type: 'sine', gain: 0.012, release: 0.5 }); } if (step % 8 === 1) this.tone(130.8, 1.6, { type: 'triangle', gain: 0.04, release: 1.4 }); }, 420);
    } else {
      // 낮은 드론 + 바람
      [41, 55.2, 82.5].forEach((f, i) => { const o = c.createOscillator(); o.type = i === 1 ? 'sawtooth' : 'sine'; o.frequency.value = f; o.detune.value = Math.random() * 20; const og = c.createGain(); og.gain.value = i === 1 ? 0.02 : 0.08; const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 220; o.connect(flt).connect(og).connect(g); o.start(); nodes.push(o); });
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = mode === 'rain' ? 2500 : 400; nf.Q.value = mode === 'rain' ? 0.3 : 0.7; const ng = c.createGain(); ng.gain.value = mode === 'rain' ? 0.12 : 0.05;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.08; const lg = c.createGain(); lg.gain.value = mode === 'rain' ? 0.04 : 0.04; lfo.connect(lg).connect(ng.gain);
      s.connect(nf).connect(ng).connect(g); s.start(); lfo.start(); nodes.push(s, lfo);
      g.gain.linearRampToValueAtTime(0.9, this.t + 3);
      // 가끔 들리는 소리들
      this.horrorTimer && clearInterval(this.horrorTimer);
      const EV = {
        gwimun: ['gong', 'gayageum', 'gayageum', 'whisper', 'creak', 'janggu', 'wind', 'giggle'],
        rain: ['thunder', 'gayageum', 'whisper', 'creak', 'wind', 'gong'],
        ship: ['foghorn', 'hull', 'hull', 'wave', 'shipbell', 'chain', 'whisper', 'drip'],
        doll: ['musicbox_far', 'clock_tick', 'porcelain', 'giggle', 'creak', 'whisper', 'musicbox_far', 'cuckoo'],
        horror: ['creak', 'whisper', 'knock', 'giggle', 'wind'],
        hospital: ['hum', 'cart', 'drip', 'whisper', 'knock', 'breath', 'creak', 'cart'],
        camp: ['wind', 'giggle', 'crawl', 'whisper', 'wave', 'creak', 'giggle', 'drip'],
        west: ['wind', 'wind', 'creak', 'bell', 'whisper', 'knock', 'chain'],
        kimono: ['gayageum', 'gong', 'whisper', 'wind', 'giggle', 'creak', 'drip'],
        clown: ['honk', 'clown_laugh', 'giggle', 'creak', 'pop', 'whisper', 'jackbox', 'calliope_far'],
      }[mode] || ['creak', 'whisper', 'knock'];
      this.horrorTimer = setInterval(() => { if (!this.mode || this.mode === 'lobby') return clearInterval(this.horrorTimer); if (Math.random() < 0.75) this.play(EV[Math.floor(Math.random() * EV.length)]); }, mode === 'doll' || mode === 'gwimun' ? 6000 : 7500);
      // 시나리오 고유의 배경 레이어
      if (mode === 'ship') { // 파도
        const w = c.createBufferSource(); w.buffer = this.noiseBuf; w.loop = true; const wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 500; const wg = c.createGain(); wg.gain.value = 0.08;
        const wl = c.createOscillator(); wl.frequency.value = 0.11; const wlg = c.createGain(); wlg.gain.value = 0.07; wl.connect(wlg).connect(wg.gain); w.connect(wf).connect(wg).connect(g); w.start(); wl.start(); nodes.push(w, wl);
      }
      if (mode === 'doll') { // 째깍 시계
        this.tickTimer && clearInterval(this.tickTimer);
        let tk = 0; this.tickTimer = setInterval(() => { if (this.mode !== 'doll') return clearInterval(this.tickTimer); this.noise(0.03, { freq: tk++ % 2 ? 3200 : 2600, q: 8, gain: 0.04 }); }, 1000);
      }
      this.horrorScore(mode);
      if (mode === 'gwimun' || mode === 'rain') { // 낮게 깔리는 대금 같은 숨소리
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 220; const og = c.createGain(); og.gain.value = 0; const l = c.createOscillator(); l.frequency.value = 0.05; const lg = c.createGain(); lg.gain.value = 0.012; l.connect(lg).connect(og.gain); o.connect(og).connect(g); o.start(); l.start(); nodes.push(o, l);
      }
    }
    this.amb = { g, nodes };
  }

  // 삐에로 배경음악 (자작곡): 바람 빠진 증기 오르간이 연주하는 느리고 비뚤어진 왈츠.
  // 쿵-짝-짝 반주 위로 반음씩 미끄러지는 멜로디. 한 바퀴 돌 때마다 음이 조금씩 더 어긋난다.
  // ───── 테마 배경음악 엔진: 오디오 시계 기준으로 0.25초 앞까지 미리 예약해 박자가 흔들리지 않게 한다
  horrorScore(mode) {
    clearInterval(this.scoreTimer);
    const sc = SCORES[mode]; if (!sc) { this.score = null; return; }
    const N = sc.steps || 16, stepDur = 60 / sc.bpm / 4;
    const th = THEMES[sc.lead]; const lead = th ? parseAbc(th.abc, th.key) : []; const unit = th?.unit || 2;
    if (this.tuneBus) { const old = this.tuneBus; old.gain.linearRampToValueAtTime(0, this.t + 1.2); setTimeout(() => old.disconnect(), 1500); }
    const bus = this.ctx.createGain(); bus.gain.value = 0; bus.gain.linearRampToValueAtTime(1, this.t + 3); bus.connect(this.master); this.tuneBus = bus;
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const on = (pat, i) => pat && pat[i % pat.length] === 'x';
    const st = { step: 0, next: this.t + 0.3, li: 0, lw: 0 };
    this.score = st;
    const SEC = [['intro', 4], ['groove', 8], ['peak', 8], ['break', 4]]; const LOOP = SEC.reduce((a, [, n]) => a + n, 0);
    const sectionOf = (bar) => { let b = bar % LOOP; for (const [name, n] of SEC) { if (b < n) return name; b -= n; } return 'groove'; };
    const drum = (kind, at, v = 1) => {
      switch (kind) {
        case 'kick': this.tone(150, 0.22, { at, type: 'sine', gain: 0.32 * v, slide: 42, release: 0.18 }); this.noise(0.02, { at, freq: 900, gain: 0.05 * v }); break;
        case 'taiko': this.tone(110, 0.5, { at, type: 'sine', gain: 0.38 * v, slide: 48, release: 0.45 }); this.noise(0.12, { at, freq: 300, type: 'lowpass', gain: 0.25 * v, release: 0.1 }); break;
        case 'heart': this.tone(62, 0.16, { at, type: 'sine', gain: 0.4 * v, slide: 40, release: 0.12 }); break;
        case 'snare': this.noise(0.13, { at, freq: 1900, q: 0.8, gain: 0.12 * v, release: 0.11 }); this.tone(190, 0.08, { at, type: 'triangle', gain: 0.06 * v }); break;
        case 'clap': [0, 0.012, 0.025].forEach((d) => this.noise(0.05, { at: at + d, freq: 1300, q: 1.2, gain: 0.08 * v })); break;
        case 'deok': this.noise(0.06, { at, freq: 2800, q: 2, gain: 0.16 * v }); break;
        case 'pizz': this.tone(hz(sc.root + 24 + this.scoreShift), 0.18, { at, type: 'triangle', gain: 0.06 * v, attack: 0.003, release: 0.16 }); break;
        case 'oompah': [0, 3, 7].forEach((k) => this.tone(hz(sc.root + 12 + k + this.scoreShift), 0.14, { at, type: 'square', gain: 0.012 * v, release: 0.1 })); break;
        case 'hat': this.noise(0.035, { at, freq: 8500, q: 1, gain: 0.035 * v, release: 0.03 }); break;
        case 'tick': this.noise(0.025, { at, freq: 3300, q: 9, gain: 0.07 * v }); break;
        case 'rim': this.noise(0.04, { at, freq: 2400, q: 3, gain: 0.07 * v }); break;
        case 'beep': this.tone(1320, 0.07, { at, type: 'square', gain: 0.018 * v, release: 0.03 }); break;
        case 'shaker': this.noise(0.05, { at, freq: 6500, q: 0.7, gain: 0.016 * v, release: 0.04 }); break;
        case 'drum': this.tone(160, 0.2, { at, type: 'sine', gain: 0.2 * v, slide: 90, release: 0.17 }); break;
        case 'timpani': this.tone(hz(sc.root), 0.6, { at, type: 'sine', gain: 0.25 * v, release: 0.5 }); this.noise(0.05, { at, freq: 400, gain: 0.08 * v }); break;
      }
    };
    const accent = (kind, at) => {
      if (kind === 'gong') [80, 81.5, 160.5].forEach((f, i) => this.tone(f, 4, { at, type: 'sine', gain: [0.18, 0.14, 0.04][i], release: 3.8 }));
      else if (kind === 'foghorn') { this.tone(hz(sc.root - 12), 2.5, { at, type: 'sawtooth', gain: 0.06, attack: 0.3, release: 1 }); this.tone(hz(sc.root - 11), 2.5, { at, type: 'square', gain: 0.02, attack: 0.3, release: 1 }); }
      else if (kind === 'glass') for (let i = 0; i < 6; i++) this.tone(2600 + Math.random() * 2000, 0.4, { at: at + i * 0.03, type: 'triangle', gain: 0.025 });
      else if (kind === 'flatline') this.tone(988, 2.2, { at, type: 'sine', gain: 0.03, release: 0.3 });
      else if (kind === 'whisper') for (let i = 0; i < 4; i++) this.noise(0.3, { at: at + i * 0.2, freq: 3000 + Math.random() * 2000, q: 8, gain: 0.05, attack: 0.08 });
      else if (kind === 'whip') { this.noise(0.06, { at, freq: 4000, q: 1, gain: 0.3 }); this.tone(2200, 0.05, { at, type: 'square', gain: 0.05, slide: 600 }); }
      else if (kind === 'honk') [0, 0.22].forEach((d) => this.tone(330, 0.18, { at: at + d, type: 'sawtooth', gain: 0.08, slide: 300 }));
    };
    const leadNote = (f, d, at, voice) => {
      switch (voice) {
        case 'gayageum': this.tone(f, d + 0.5, { at, type: 'triangle', gain: 0.05, attack: 0.004, release: d + 0.45, slide: f * 0.985 }); break;
        case 'accordion': this.tone(f, d, { at, type: 'square', gain: 0.014, attack: 0.04, release: d * 0.6 }); this.tone(f * 1.005, d, { at, type: 'sawtooth', gain: 0.01, attack: 0.04, release: d * 0.6 }); break;
        case 'musicbox': this.tone(f * 2, 0.8, { at, type: 'triangle', gain: 0.035, attack: 0.002, release: 0.75 }); break;
        case 'lullaby': this.tone(f, d * 1.3, { at, type: 'sine', gain: 0.045, attack: 0.08, release: d, detune: (Math.random() - 0.5) * 40 }); break;
        case 'guitar': this.tone(f, d + 0.3, { at, type: 'triangle', gain: 0.045, attack: 0.003, release: d + 0.25 }); break;
        case 'harmonica': this.tone(f, d, { at, type: 'square', gain: 0.016, attack: 0.03, release: d * 0.7 }); this.tone(f, d, { at, type: 'sawtooth', gain: 0.009, attack: 0.03, release: d * 0.7, detune: 14 }); break;
        case 'koto': this.tone(f, d + 0.6, { at, type: 'triangle', gain: 0.05, attack: 0.003, release: d + 0.55, slide: f * 0.97 }); this.noise(0.02, { at, freq: 3000, q: 4, gain: 0.025 }); break;
        case 'calliope': this.tone(f, d, { at, type: 'square', gain: 0.018, release: d * 0.6, detune: (Math.random() - 0.5) * 30 }); this.tone(f * 2, d, { at, type: 'triangle', gain: 0.014, release: d * 0.6 }); break;
      }
    };
    this.scoreShift = 0;
    const schedule = (i, time) => {
      const at = time - this.t; if (at < 0) return;
      const bar = Math.floor(i / N), k = i % N; let sec = sectionOf(bar);
      if (this.chaseOn) sec = 'peak';
      if (k === 0) { this.scoreShift = sc.prog[bar % sc.prog.length]; if (sec !== 'break' && bar % 8 === 0) accent(sc.accent, at); }
      const root = sc.root + this.scoreShift;
      const v = sec === 'peak' ? 1.15 : sec === 'intro' ? 0.6 : 1;
      // 드럼
      if (sec === 'break') { if (k % (N / 2) === 0) drum('heart', at, 0.8); }
      else {
        if (on(sc.K, k) && sec !== 'intro') drum(sc.kick, at, v);
        if (on(sc.T, k) && sec !== 'intro') drum(sc.tom, at, v * 0.9);
        if (on(sc.S, k) && sec !== 'intro') drum(sc.snare, at, v);
        if (on(sc.H, k) || (sec === 'peak' && k % 2 === 0 && sc.hat !== 'shaker')) drum(sc.hat, at, v);
      }
      // 베이스: 짧게 끊어 치는 저음 반복 (톱니파 + 한 옥타브 아래 사인)
      const b = sc.bass[k % sc.bass.length];
      if (b && b !== '.' && sec !== 'break') {
        const semi = parseInt(b, 16); const f = hz(root + semi); const d = stepDur * 1.6;
        this.tone(f, d, { at, type: 'sawtooth', gain: 0.028 * v, release: d * 0.8 }); this.tone(f / 2, d, { at, type: 'sine', gain: 0.07 * v, release: d * 0.8 });
      }
      // 절정: 반음·트라이톤 불협화음 현악 찌르기
      if (sec === 'peak' && on(sc.stab, k)) [12, 13, 18].forEach((s2) => this.tone(hz(root + s2), stepDur * 1.8, { at, type: 'sawtooth', gain: 0.018, release: stepDur * 1.5, detune: (Math.random() - 0.5) * 10 }));
      // 숨 고르기: 높은 현악 트레몰로 한 음
      if (sec === 'break' && k === 0) for (let r = 0; r < N; r += 1) this.tone(hz(root + 25), stepDur * 0.9, { at: at + r * stepDur, type: 'sawtooth', gain: 0.008, release: stepDur * 0.6 });
      // 선율: 그루브와 절정에서만 (절정은 한 옥타브 위)
      if (sec === 'groove' || sec === 'peak') {
        if (st.lw <= 0 && lead.length) {
          const n = lead[st.li % lead.length]; st.li++; st.lw = n.len * unit;
          if (n.midi != null) leadNote(hz(n.midi + (sec === 'peak' ? 12 : 0) + this.scoreShift), n.len * unit * stepDur, at, sc.leadVoice);
        }
        st.lw--;
      } else { st.li = 0; st.lw = 0; }
    };
    this.scoreTimer = setInterval(() => {
      if (!this.ctx || this.score !== st || this.mode !== mode) return clearInterval(this.scoreTimer);
      const main = this.master; this.master = bus;
      try { while (st.next < this.t + 0.25) { schedule(st.step, st.next); st.step++; st.next += stepDur; } } finally { this.master = main; }
    }, 60);
  }

  // 귀신이 쫓아올 때 깔리는 긴장 음악 (스타카토 현악 + 불협 트레몰로)
  chase(level) {
    if (!this.ctx) return;
    const now = performance.now();
    if (level <= 0) { this.chaseOn = false; return; }
    if (!this.chaseOn) { this.chaseOn = true; this.chaseStep = 0; this.play('sting_low'); }
    if (this.score) return; // 테마 배경음악이 절정 구간으로 바뀌어 대신 긴장감을 올린다
    const gap = 330 - level * 130;
    if (now - (this.lastChase || 0) < gap) return;
    this.lastChase = now;
    const k = this.chaseStep++ % 8;
    const bass = [73.4, 73.4, 77.8, 73.4, 73.4, 69.3, 73.4, 82.4][k];
    this.tone(bass, 0.16, { type: 'sawtooth', gain: 0.07 + level * 0.07, release: 0.12 });
    if (k % 2 === 0) this.tone(bass * 8 * (k === 4 ? 1.06 : 1), 0.12, { type: 'square', gain: 0.012 + level * 0.02, release: 0.1 });
    if (k === 7 && level > 0.6) this.noise(0.25, { freq: 4000, q: 2, gain: 0.05 });
  }

  heartbeat(level) { // 0~1
    if (!this.ctx) return;
    const now = performance.now();
    if (level <= 0) return;
    const gap = 1100 - level * 650;
    if (now - (this.lastBeat || 0) < gap) return;
    this.lastBeat = now;
    this.tone(55, 0.14, { type: 'sine', gain: 0.35 * level + 0.1, release: 0.1, slide: 40 });
    this.tone(50, 0.12, { type: 'sine', gain: 0.25 * level + 0.08, release: 0.1, at: 0.18, slide: 38 });
  }

  step(outdoor) { if (this.ctx) this.noise(0.08, { freq: outdoor ? 700 : 300, q: 1.5, gain: 0.05, release: 0.06 }); }

  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'click': this.tone(880, 0.06, { type: 'square', gain: 0.04 }); break;
      case 'pickup': this.tone(660, 0.12, { gain: 0.12 }); this.tone(990, 0.2, { gain: 0.1, at: 0.08 }); break;
      case 'wrong': this.tone(140, 0.35, { type: 'sawtooth', gain: 0.15, slide: 90 }); break;
      case 'unlock': this.noise(0.1, { freq: 2500, gain: 0.25 }); this.tone(1200, 0.08, { type: 'square', gain: 0.06, at: 0.1 }); break;
      case 'creak': { const o = this.tone(180, 1.4, { type: 'sawtooth', gain: 0.05, slide: 120, attack: 0.3, release: 0.5 }); break; }
      case 'door': this.play('creak'); this.noise(0.4, { freq: 120, type: 'lowpass', gain: 0.5, at: 1.2 }); break;
      case 'gate': this.noise(1.2, { freq: 3500, q: 6, gain: 0.08 }); this.noise(0.3, { freq: 200, type: 'lowpass', gain: 0.5, at: 1 }); break;
      case 'drawer': this.noise(0.5, { freq: 600, q: 2, gain: 0.15 }); break;
      case 'knock': [0, 0.35, 0.7].forEach((a) => this.noise(0.08, { freq: 180, type: 'lowpass', gain: 0.6, at: a })); break;
      case 'whisper': for (let i = 0; i < 6; i++) this.noise(0.25 + Math.random() * 0.3, { freq: 2500 + Math.random() * 2500, q: 8, gain: 0.05, at: i * 0.22, attack: 0.08 }); break;
      case 'breath': this.noise(1.2, { freq: 800, q: 1, gain: 0.12, attack: 0.5, release: 0.6 }); this.noise(1.0, { freq: 600, q: 1, gain: 0.1, attack: 0.3, release: 0.6, at: 1.4 }); break;
      case 'giggle': for (let i = 0; i < 5; i++) this.tone(900 + Math.random() * 200, 0.09, { type: 'triangle', gain: 0.06, at: i * 0.12, slide: 700 }); break;
      case 'bell': [1, 1.5, 2.76].forEach((m) => this.tone(620 * m, 2.5, { gain: 0.08 / m, release: 2.3 })); this.tone(620, 2.5, { gain: 0.06, release: 2.3, at: 0.4, detune: 30 }); break;
      case 'organ': { const seq = [392, 392, 440, 440, 392, 392, 329.6, 392, 392, 329.6, 329.6, 293.7]; seq.forEach((f, i) => { this.tone(f, 0.42, { type: 'square', gain: 0.04, at: i * 0.45, release: 0.15 }); this.tone(f / 2, 0.42, { type: 'triangle', gain: 0.05, at: i * 0.45, release: 0.15, detune: -12 }); }); break; }
      case 'note': break;
      case 'honk': [0, 0.22].forEach((a) => { this.tone(330, 0.18, { type: 'sawtooth', gain: 0.12, at: a, slide: 300 }); this.tone(415, 0.18, { type: 'square', gain: 0.05, at: a }); }); break;
      case 'clown_laugh': for (let i = 0; i < 7; i++) this.tone(380 - i * 18 + Math.random() * 30, 0.14, { type: 'sawtooth', gain: 0.07, at: i * 0.16, slide: 260 - i * 15 }); this.noise(1.2, { freq: 1600, q: 3, gain: 0.04 }); break;
      case 'jackbox': [523, 587, 659, 523, 659, 523, 659].forEach((fq, i) => this.tone(fq, 0.18, { type: 'triangle', gain: 0.05, at: i * 0.2 })); this.noise(0.2, { freq: 2500, gain: 0.4, at: 1.45 }); this.tone(880, 0.6, { type: 'sawtooth', gain: 0.15, slide: 1600, at: 1.45 }); break;
      case 'pop': this.noise(0.08, { freq: 1800, q: 0.8, gain: 0.7 }); this.tone(120, 0.1, { type: 'square', gain: 0.2, slide: 60 }); break;
      case 'calliope_far': [659, 622, 659, 523, 494].forEach((fq, i) => this.tone(fq * (1 + (Math.random() - 0.5) * 0.03), 0.4, { type: 'square', gain: 0.012, at: i * 0.38, release: 0.3 })); break;
      case 'whip': this.noise(0.06, { freq: 4000, q: 1, gain: 0.6 }); this.tone(2200, 0.05, { type: 'square', gain: 0.08, slide: 600 }); break;
      case 'stomp': this.noise(0.18, { freq: 90, type: 'lowpass', gain: 0.7 }); this.tone(48, 0.2, { gain: 0.3, slide: 35 }); break;
      case 'jingle': for (let i = 0; i < 6; i++) this.tone(2400 + Math.random() * 900, 0.25, { type: 'triangle', gain: 0.03, at: i * 0.05, release: 0.2 }); break;
      case 'pipe': [0, 0.25].forEach((a) => this.noise(0.05, { freq: 1500, q: 4, gain: 0.25, at: a })); break;
      case 'crawl': for (let i = 0; i < 4; i++) this.noise(0.06, { freq: 900 + Math.random() * 600, q: 3, gain: 0.12, at: i * 0.09 }); break;
      case 'water_step': this.noise(0.25, { freq: 400, q: 0.8, gain: 0.22, release: 0.2 }); this.noise(0.1, { freq: 1600, q: 3, gain: 0.06, at: 0.1 }); break;
      case 'snip': [0, 0.18].forEach((d) => { this.noise(0.05, { freq: 5200, q: 6, gain: 0.25, at: d }); this.tone(2600, 0.04, { type: 'square', gain: 0.04, at: d }); }); break;
      case 'musicbox': [1046, 988, 880, 988, 1046, 1046, 1046].forEach((f, i) => this.tone(f, 0.5, { type: 'triangle', gain: 0.06, at: i * 0.35, release: 0.45 })); break;
      case 'morse_short': this.tone(700, 0.12, { type: 'sine', gain: 0.12 }); break;
      case 'morse_long': this.tone(700, 0.36, { type: 'sine', gain: 0.12 }); break;
      case 'growl': this.tone(70, 1.1, { type: 'sawtooth', gain: 0.35, slide: 45 }); this.noise(1.0, { freq: 220, q: 1.5, gain: 0.4 }); this.tone(140, 0.9, { type: 'square', gain: 0.08, slide: 90, detune: 30 }); break;
      case 'glitch': for (let i = 0; i < 10; i++) this.noise(0.05, { freq: 300 + Math.random() * 6000, q: 4, gain: 0.35, at: i * 0.07 }); this.tone(60, 0.8, { type: 'square', gain: 0.15 }); break;
      case 'scream_wet': this.noise(1.2, { freq: 1200, q: 1.2, gain: 0.45 }); [480, 720].forEach((f) => this.tone(f, 1.1, { type: 'sawtooth', gain: 0.1, slide: f * 0.4 })); this.noise(0.8, { freq: 300, type: 'lowpass', gain: 0.3, at: 0.2 }); break;
      case 'scream_child': [1300, 1650, 2100].forEach((f, i) => this.tone(f, 0.9, { type: 'triangle', gain: 0.1, slide: f * 1.3, at: i * 0.05 })); this.noise(0.9, { freq: 3000, q: 2, gain: 0.35 }); break;
      case 'glass': for (let i = 0; i < 14; i++) this.tone(2500 + Math.random() * 3500, 0.25, { type: 'triangle', gain: 0.05, at: i * 0.025 }); this.noise(0.4, { freq: 6000, q: 0.7, gain: 0.35 }); break;
      case 'bang': [0, 0.18, 0.32, 0.43].forEach((a) => this.noise(0.12, { freq: 150, type: 'lowpass', gain: 0.9, at: a })); break;
      case 'sting_low': this.tone(55, 1.8, { type: 'sawtooth', gain: 0.18, slide: 50 }); this.tone(58.3, 1.8, { type: 'sawtooth', gain: 0.15 }); break;
      case 'porcelain': this.tone(2900 + Math.random() * 600, 0.15, { type: 'sine', gain: 0.07 }); this.tone(4100, 0.08, { type: 'sine', gain: 0.04, at: 0.05 }); break;
      case 'hum': [196, 233].forEach((f) => this.tone(f, 2.2, { type: 'sine', gain: 0.05, attack: 0.6, release: 1.2 })); break;
      case 'static_hiss': this.noise(1.4, { freq: 5000, q: 0.4, gain: 0.12, attack: 0.3, release: 0.8 }); this.tone(50, 1.4, { type: 'sawtooth', gain: 0.05 }); break;
      case 'cart': for (let i = 0; i < 4; i++) this.noise(0.06, { freq: 1800, q: 6, gain: 0.12, at: i * 0.11 }); this.tone(900, 0.4, { type: 'square', gain: 0.02, slide: 820 }); break;
      case 'drag': this.noise(0.8, { freq: 350, q: 1, gain: 0.2, attack: 0.2, release: 0.5 }); break;
      case 'tune_static': this.noise(0.08, { freq: 1500 + Math.random() * 3000, q: 1, gain: 0.08 }); break;
      case 'clock_tick': this.noise(0.03, { freq: 3000, q: 8, gain: 0.12 }); break;
      case 'gong': [80, 81.5, 160.5].forEach((f, i) => this.tone(f, 5, { type: 'sine', gain: [0.22, 0.18, 0.05][i], attack: 0.02, release: 4.8 })); this.noise(0.2, { freq: 400, gain: 0.08 }); break;
      case 'gayageum': { const sc = [220, 261.6, 293.7, 329.6, 392, 440]; const f0 = sc[Math.floor(Math.random() * sc.length)]; for (let i = 0; i < 3; i++) { const fq = sc[(sc.indexOf(f0) + i) % sc.length]; this.tone(fq, 1.6, { type: 'triangle', gain: 0.05, attack: 0.005, release: 1.5, at: i * 0.35, slide: fq * 0.97 }); } break; }
      case 'janggu': [0, 0.3, 0.45, 0.75].forEach((a, i) => (i % 2 ? this.noise(0.06, { freq: 2600, q: 2, gain: 0.15, at: a }) : this.tone(78, 0.3, { gain: 0.3, slide: 52, at: a }))); break;
      case 'wind': this.noise(4, { freq: 600, q: 3, gain: 0.08, attack: 1.5, release: 2 }); break;
      case 'thunder': this.noise(3, { freq: 120, type: 'lowpass', gain: 0.6, attack: 0.05, release: 2.6 }); this.noise(0.3, { freq: 2000, gain: 0.2 }); break;
      case 'foghorn': this.tone(110, 3, { type: 'sawtooth', gain: 0.09, attack: 0.4, release: 1.2 }); this.tone(111.5, 3, { type: 'square', gain: 0.03, attack: 0.4, release: 1.2 }); break;
      case 'hull': this.tone(65 + Math.random() * 20, 2.2, { type: 'sawtooth', gain: 0.05, slide: 50, attack: 0.6, release: 1 }); this.noise(1.6, { freq: 300, q: 4, gain: 0.05, attack: 0.5 }); break;
      case 'wave': this.noise(3.5, { freq: 700, q: 0.5, gain: 0.15, attack: 1.4, release: 1.8 }); break;
      case 'shipbell': [1, 2.4].forEach((m) => this.tone(880 * m, 2.5, { gain: 0.04 / m, release: 2.3 })); this.tone(880, 2.5, { gain: 0.03, at: 0.6, release: 2.3 }); break;
      case 'chain': for (let i = 0; i < 8; i++) this.tone(1800 + Math.random() * 1500, 0.08, { type: 'triangle', gain: 0.04, at: i * 0.06 }); break;
      case 'drip': this.tone(1400, 0.08, { gain: 0.08, slide: 700 }); break;
      case 'musicbox_far': [1046, 988, 880, 784, 880].forEach((fq, i) => this.tone(fq * (1 + (Math.random() - 0.5) * 0.02), 0.6, { type: 'triangle', gain: 0.025, at: i * 0.45, release: 0.55 })); break;
      case 'cuckoo': [0, 0.35].forEach((a, i) => this.tone(i ? 587 : 740, 0.25, { type: 'sine', gain: 0.06, at: a })); break;
      case 'teleport': this.play('sting'); this.noise(0.6, { freq: 300, q: 0.4, gain: 0.3, release: 0.5 }); break;
      case 'radio': this.noise(3.5, { freq: 1800, q: 0.5, gain: 0.12, release: 0.5 }); for (let i = 0; i < 8; i++) this.tone(300 + Math.random() * 200, 0.2, { type: 'sawtooth', gain: 0.03, at: 0.5 + i * 0.35 }); break;
      case 'power': this.tone(60, 1.5, { type: 'sawtooth', gain: 0.08, slide: 120 }); this.noise(0.2, { freq: 4000, gain: 0.1 }); break;
      case 'water': this.noise(3, { freq: 500, q: 0.6, gain: 0.25, attack: 0.5, release: 1.5 }); break;
      case 'talisman': this.noise(0.8, { freq: 3000, q: 0.5, gain: 0.2, release: 0.6 }); this.tone(1400, 0.8, { gain: 0.08, slide: 300 }); break;
      case 'scream': {
        this.noise(1.3, { freq: 2200, q: 2, gain: 0.55, attack: 0.01, release: 0.8 });
        [740, 1110, 1480].forEach((f, i) => this.tone(f, 1.2, { type: 'sawtooth', gain: 0.13, slide: f * 0.6, detune: i * 23 }));
        this.tone(55, 0.6, { type: 'square', gain: 0.4, slide: 30 });
        break;
      }
      case 'sting': this.tone(98, 1.5, { type: 'sawtooth', gain: 0.18, slide: 92 }); this.tone(104, 1.5, { type: 'sawtooth', gain: 0.18, slide: 97 }); this.noise(0.5, { freq: 6000, q: 3, gain: 0.2 }); break;
      case 'story': this.tone(110, 3, { type: 'sine', gain: 0.15, attack: 0.5, release: 2 }); this.tone(116.5, 3, { type: 'sine', gain: 0.1, attack: 0.5, release: 2 }); break;
    }
  }

  drumNote(name) {
    if (!this.ctx) return;
    if (name === '덩') { this.tone(80, 0.35, { gain: 0.5, slide: 55 }); this.noise(0.05, { freq: 2500, gain: 0.2 }); }
    else if (name === '쿵') this.tone(70, 0.3, { gain: 0.5, slide: 45 });
    else if (name === '덕') this.noise(0.06, { freq: 2800, q: 2, gain: 0.35 });
    else if (name === '기덕') { this.noise(0.04, { freq: 3200, q: 2, gain: 0.2 }); this.noise(0.06, { freq: 2800, q: 2, gain: 0.35, at: 0.09 }); }
  }
  setVolume(v) { if (this.master) this.master.gain.value = v; this.vol = v; }

  pianoNote(name) {
    const f = { 도: 261.6, 레: 293.7, 미: 329.6, 파: 349.2, 솔: 392, 라: 440, 시: 493.9 }[name];
    if (f && this.ctx) { this.tone(f, 0.5, { type: 'square', gain: 0.05, release: 0.25 }); this.tone(f / 2, 0.5, { type: 'triangle', gain: 0.05, release: 0.25 }); }
  }
}
