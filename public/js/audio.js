// 외부 음원 없이 Web Audio 로 합성하는 공포 사운드
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
      if (mode === 'gwimun' || mode === 'rain') { // 낮게 깔리는 대금 같은 숨소리
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 220; const og = c.createGain(); og.gain.value = 0; const l = c.createOscillator(); l.frequency.value = 0.05; const lg = c.createGain(); lg.gain.value = 0.012; l.connect(lg).connect(og.gain); o.connect(og).connect(g); o.start(); l.start(); nodes.push(o, l);
      }
    }
    this.amb = { g, nodes };
  }

  // 귀신이 쫓아올 때 깔리는 긴장 음악 (스타카토 현악 + 불협 트레몰로)
  chase(level) {
    if (!this.ctx) return;
    const now = performance.now();
    if (level <= 0) { this.chaseOn = false; return; }
    if (!this.chaseOn) { this.chaseOn = true; this.chaseStep = 0; this.play('sting_low'); }
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
