// 파티 전용 음성 채팅 (WebRTC P2P 메시, 신호는 소켓으로 중계)
//
// 휴대폰에서 마이크 · 목소리가 간혹 안 되던 까닭과 고친 것
//  ① 화면이 꺼지거나 전화 · 다른 앱이 마이크를 가져가면 마이크 줄(track)이 끝나 버리는데, 예전에는 끝난 줄을 계속 붙들고 있었다
//     → 줄이 끝났는지 확인하고, 끝났으면 마이크를 다시 연다 (버튼을 누를 때 · 화면으로 돌아올 때 · 줄이 끊긴 순간)
//  ② 잠든 사이 죽은 연결을 한쪽만 다시 걸고 다른 쪽은 모르는 채로 멈춰 있을 수 있었다
//     → 4초마다 살펴서, 오래 이어지지 않는 연결은 끊고 다시 건다 (점점 간격을 늘려 가며)
//  ③ 휴대폰은 '손으로 만진 순간'에만 소리 재생을 허락한다 → 화면을 만질 때마다 막혀 있던 목소리 재생과 오디오 장치를 깨운다
//  ④ 새로 이어진 사람에게는 목소리 크기 설정이 적용되지 않았다 → 항상 적용
const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
const now = () => Date.now();

function micErrorText(e) {
  const n = e?.name || '';
  if (n === 'NotAllowedError' || n === 'SecurityError') return '마이크 권한이 꺼져 있어요. 브라우저(또는 휴대폰 설정)에서 이 사이트의 마이크를 허용해 주세요.';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return '마이크를 찾지 못했어요. 이어폰 · 마이크 연결을 확인해 주세요.';
  if (n === 'NotReadableError' || n === 'AbortError') return '다른 앱(통화 · 녹음 등)이 마이크를 쓰고 있어요. 그 앱을 닫고 다시 눌러 주세요.';
  return '마이크를 켜지 못했어요. 잠시 뒤 다시 눌러 주세요.';
}

export class Voice {
  constructor(socket, { onLevel, onError, onChange } = {}) {
    this.socket = socket;
    this._myId = null;
    this.peers = new Map();    // id -> { pc, audio, tr, born, downAt, pending }
    this.want = new Set();     // 듣고 싶은 상대
    this.tries = new Map();    // id -> 다시 건 횟수 (간격을 늘리는 데 쓴다)
    this.nextDial = new Map(); // id -> 이 시각 전에는 다시 걸지 않는다
    this.ice = STUN;
    this.stream = null; this.track = null;
    this.micOn = false;
    this.volume = 1;
    this.onLevel = onLevel || (() => {});
    this.onError = onError || (() => {});
    this.onChange = onChange || (() => {});
    this.actx = null;
    this.meters = new Map();
    socket.on('voice:signal', (m) => this.handle(m));
    socket.on('voice:peerLeft', (id) => { this.drop(id); this.tries.delete(id); this.nextDial.delete(id); });
    setInterval(() => this.meter(), 120);
    setInterval(() => this.watch(), 4000);
    // 휴대폰: 소리 재생 · 오디오 장치는 손으로 만진 순간에만 깨어난다
    const kick = () => this.unlock();
    for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, kick, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.onVisible(); });
    try { navigator.mediaDevices?.addEventListener?.('devicechange', () => { if (this.micOn && !this.trackAlive()) this.reacquire(); }); } catch {}
  }

  get myId() { return this._myId; }
  // 내 번호가 바뀌면(오래 끊겼다 새로 들어온 경우) 예전 번호로 맺은 연결은 모두 버린다
  set myId(v) { if (this._myId && v && this._myId !== v) { for (const id of [...this.peers.keys()]) this.drop(id); this.tries.clear(); this.nextDial.clear(); } this._myId = v; }

  /** 서버가 알려 준 중계 서버(TURN)가 있으면 함께 쓴다 — 통신사 데이터망처럼 직접 이어지지 않는 곳에서 필요하다 */
  setIce(extra) { this.ice = Array.isArray(extra) && extra.length ? [...STUN, ...extra] : STUN; }

  // 들을 상대 목록 (파티원만 · 또는 같은 곳의 모두). 서로 상대를 원할 때만 연결된다
  setTargets(ids) {
    const want = new Set(ids.filter((id) => id && id !== this.myId));
    const fresh = [...want].filter((id) => !this.want.has(id));
    this.want = want;
    for (const id of [...this.peers.keys()]) if (!want.has(id)) this.drop(id);
    for (const id of fresh) { this.tries.delete(id); this.nextDial.delete(id); } // 새로 듣게 된 상대는 바로 건다
    for (const id of want) if (!this.peers.has(id) && now() >= (this.nextDial.get(id) || 0)) this.dial(id);
  }
  setParty(memberIds) { this.setTargets(memberIds); }

  /** 번호가 작은 쪽이 먼저 건다. 큰 쪽은 '걸어 달라'고 부탁한다 (re = 지금 있는 연결을 버리고 다시) */
  dial(id, re = false) {
    if (!this.myId || !this.socket.connected) return;
    this.nextDial.set(id, now() + 8000);
    if (this.myId < id) this.connect(id).catch((e) => console.warn('voice', e));
    else this.send(id, { hello: true, re });
  }
  /** 끊고 다시 건다: 1.5초 → 3초 → 6초 … 최대 60초 간격 */
  redial(id) {
    this.drop(id);
    if (!this.want.has(id)) return;
    const n = (this.tries.get(id) || 0) + 1; this.tries.set(id, n);
    const wait = Math.min(60000, 1500 * 2 ** (n - 1)) + (this.myId < id ? 0 : 2500); // 번호가 큰 쪽은 조금 더 기다린다 (작은 쪽이 먼저 다시 걸어 오면 부탁할 필요가 없다)
    this.nextDial.set(id, now() + wait);
    setTimeout(() => { if (this.want.has(id) && !this.peers.has(id)) this.dial(id, true); }, wait);
  }
  /** 4초마다: 이어져야 하는데 없는 연결, 오래 멈춰 있는 연결을 찾아 다시 건다 */
  watch() {
    if (document.hidden || !this.socket.connected || !this.myId) return;
    const t = now();
    for (const id of this.want) {
      const p = this.peers.get(id);
      if (!p) { if (t >= (this.nextDial.get(id) || 0)) this.dial(id); continue; }
      const st = p.pc.connectionState;
      if (st === 'connected') { p.downAt = 0; continue; }
      if (st === 'failed' || st === 'closed') { this.redial(id); continue; }
      if (st === 'disconnected') { p.downAt ||= t; if (t - p.downAt > 6000) this.redial(id); continue; }
      if (t - p.born > 12000) this.redial(id); // 걸었는데 12초가 지나도 이어지지 않는다 (상대가 잠들어 신호를 못 받았을 수 있다)
    }
  }
  /** 화면으로 돌아왔을 때 · 서버에 다시 붙었을 때: 살아 있지 않은 연결을 바로 다시 건다 */
  refresh(force = false) {
    this.unlock();
    if (this.micOn && !this.trackAlive()) this.reacquire();
    for (const id of this.want) {
      const p = this.peers.get(id); const st = p?.pc.connectionState, ice = p?.pc.iceConnectionState;
      const dead = !p || st === 'failed' || st === 'closed' || st === 'disconnected' || ice === 'disconnected' || ice === 'failed' || (force && st !== 'connected');
      if (!dead) continue;
      this.drop(id); this.tries.delete(id); this.nextDial.delete(id); this.dial(id, true);
    }
  }
  onVisible() {
    this.refresh(false);
    // 일부 휴대폰은 돌아온 뒤에도 마이크 줄이 '살아는 있지만 소리가 안 나오는' 상태로 남는다 → 잠깐 기다려 보고 그대로면 다시 연다
    setTimeout(() => { if (this.micOn && this.track?.muted && !document.hidden) this.reacquire(); }, 1500);
  }

  makePeer(id) {
    const pc = new RTCPeerConnection({ iceServers: this.ice });
    const audio = document.createElement('audio');
    audio.autoplay = true; audio.playsInline = true; audio.setAttribute('playsinline', ''); audio.volume = this.volume;
    document.getElementById('voiceAudio').appendChild(audio);
    const peer = { pc, audio, tr: null, born: now(), downAt: 0, sid: Math.random().toString(36).slice(2, 10) };
    pc.onicecandidate = (e) => { if (e.candidate) this.send(id, { candidate: e.candidate, sid: peer.sid }); };
    pc.ontrack = (e) => {
      const s = e.streams[0] || new MediaStream([e.track]);
      audio.srcObject = s; audio.play().catch(() => {}); // (막히면 다음에 화면을 만질 때 unlock 이 다시 튼다)
      e.track.onunmute = () => { if (audio.paused) audio.play().catch(() => {}); };
      this.addMeter(id, s);
    };
    pc.onconnectionstatechange = () => {
      if (this.peers.get(id) !== peer) return;
      const st = pc.connectionState;
      if (st === 'connected') { peer.downAt = 0; this.tries.delete(id); if (audio.paused && audio.srcObject) audio.play().catch(() => {}); }
      else if (st === 'failed') this.redial(id);
      else if (st === 'disconnected') peer.downAt = now();
    };
    this.peers.set(id, peer);
    return peer;
  }

  async connect(id) {
    if (this.peers.has(id)) this.drop(id);
    const peer = this.makePeer(id);
    peer.tr = peer.pc.addTransceiver('audio', { direction: 'sendrecv' });
    if (this.trackAlive()) await peer.tr.sender.replaceTrack(this.track);
    const offer = await peer.pc.createOffer();
    if (this.peers.get(id) !== peer) return;
    await peer.pc.setLocalDescription(offer);
    this.send(id, { description: peer.pc.localDescription, sid: peer.sid });
  }

  async handle({ from, data }) {
    if (!data) return;
    if (data.nope) { // 상대가 나를 듣지 않는다 → 그쪽에서 다시 부를 때까지 조용히 기다린다
      this.drop(from); this.nextDial.set(from, now() + 10 * 60 * 1000); return;
    }
    if (!this.want.has(from)) { // 내가 듣지 않기로 한 사람은 연결하지 않는다 (걸어 온 쪽이 자꾸 다시 걸지 않게 알려 준다)
      if (data.hello || data.description?.type === 'offer') this.send(from, { nope: true });
      return;
    }
    if (data.hello) {
      this.nextDial.delete(from);
      if (this.myId < from) {
        const p = this.peers.get(from);
        if (!p || data.re || (p.pc.connectionState !== 'connected' && now() - p.born > 3000)) this.connect(from).catch((e) => console.warn('voice', e));
      }
      return;
    }
    try {
      let peer = this.peers.get(from);
      if (data.description) {
        const d = data.description;
        if (d.type === 'offer') {
          if (peer) this.drop(from);
          this.nextDial.delete(from);
          peer = this.makePeer(from);
          if (data.sid) peer.sid = data.sid; // 걸어 온 쪽의 연결 번호를 그대로 쓴다
          await peer.pc.setRemoteDescription(d);
          peer.tr = peer.pc.getTransceivers()[0];
          peer.tr.direction = 'sendrecv';
          if (this.trackAlive()) await peer.tr.sender.replaceTrack(this.track);
          const ans = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(ans);
          this.send(from, { description: peer.pc.localDescription, sid: peer.sid });
          for (const c of peer.pending || []) await peer.pc.addIceCandidate(c).catch(() => {});
          peer.pending = null;
        } else if (peer && peer.pc.signalingState === 'have-local-offer' && (data.sid == null || data.sid === peer.sid)) { // (예전 연결에 대한 늦은 답은 버린다)
          await peer.pc.setRemoteDescription(d);
          for (const c of peer.pending || []) await peer.pc.addIceCandidate(c).catch(() => {});
          peer.pending = null;
        }
      } else if (data.candidate) {
        if (!peer || (data.sid != null && data.sid !== peer.sid)) return;
        if (!peer.pc.remoteDescription) (peer.pending ||= []).push(data.candidate);
        else await peer.pc.addIceCandidate(data.candidate);
      }
    } catch (e) { console.warn('voice', e); }
  }

  send(to, data) { this.socket.emit('voice:signal', { to, data }); }

  drop(id) {
    const p = this.peers.get(id);
    if (!p) return;
    this.peers.delete(id);
    try { p.pc.onconnectionstatechange = null; p.pc.ontrack = null; p.pc.onicecandidate = null; p.pc.close(); } catch {}
    try { p.audio.srcObject = null; } catch {}
    p.audio.remove();
    this.meters.delete(id);
  }

  // ───── 마이크
  trackAlive() { return !!this.track && this.track.readyState === 'live'; }
  /** 마이크를 연다 (끝난 줄은 버리고 새로) */
  async acquire() {
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') throw e;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // 세부 설정을 못 받는 기기는 기본값으로 한 번 더
    }
    const old = this.stream;
    this.stream = stream; this.track = stream.getAudioTracks()[0];
    if (old && old !== stream) for (const t of old.getTracks()) { t.onended = null; try { t.stop(); } catch {} }
    const track = this.track;
    track.onended = () => { if (this.track === track) this.onTrackLost(); };
    this.addMeter(this.myId, stream);
    for (const p of this.peers.values()) if (p.tr) await p.tr.sender.replaceTrack(track).catch(() => {});
  }
  /** 켜 둔 마이크의 줄이 끊겼다 (화면 꺼짐 · 전화 · 다른 앱 · 이어폰 뽑힘) → 조용히 다시 연다 */
  async reacquire() {
    if (this.busy || !this.micOn) return;
    if (document.hidden) return; // 화면이 꺼져 있으면 열 수 없다 → 돌아왔을 때(onVisible) 다시 연다
    this.busy = true;
    try { await this.acquire(); this.track.enabled = true; }
    catch (e) { this.micOn = false; this.socket.emit('voice:mic', false); this.onError('마이크 연결이 끊겼어요. 마이크 버튼을 다시 눌러 주세요.'); this.onChange(); }
    finally { this.busy = false; }
  }
  onTrackLost() { if (this.micOn) this.reacquire(); }

  async toggleMic() {
    if (!this.micOn) {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.onError(location.protocol === 'https:' ? '이 브라우저(앱 안 브라우저)에서는 마이크를 쓸 수 없어요. 크롬 · 사파리로 열어 주세요.' : '이 주소에서는 마이크를 쓸 수 없습니다. localhost 또는 https 주소로 접속하세요.');
        return false;
      }
      if (this.busy) return this.micOn;
      this.busy = true;
      try {
        this.unlock();
        if (!this.trackAlive()) await this.acquire();
        this.track.enabled = true;
        this.micOn = true;
      } catch (e) {
        this.onError(micErrorText(e));
        this.busy = false;
        return false;
      }
      this.busy = false;
    } else {
      if (this.track) this.track.enabled = false;
      this.micOn = false;
    }
    this.socket.emit('voice:mic', this.micOn);
    return this.micOn;
  }

  setVolume(v) { this.volume = v; for (const p of this.peers.values()) p.audio.volume = v; }

  /** 손으로 만진 순간에 부른다: 멈춰 있는 오디오 장치와 막혀 있던 목소리 재생을 깨운다 */
  unlock() {
    try { if (this.actx && this.actx.state !== 'running') this.actx.resume().catch(() => {}); } catch {}
    for (const p of this.peers.values()) if (p.audio.srcObject && p.audio.paused) p.audio.play().catch(() => {});
  }

  addMeter(id, stream) {
    try {
      this.actx ||= new (window.AudioContext || window.webkitAudioContext)();
      const src = this.actx.createMediaStreamSource(stream);
      const an = this.actx.createAnalyser(); an.fftSize = 256;
      src.connect(an);
      this.meters.set(id, { an, buf: new Uint8Array(an.frequencyBinCount) });
    } catch {}
  }
  meter() {
    for (const [id, m] of this.meters) {
      m.an.getByteFrequencyData(m.buf);
      let s = 0; for (const v of m.buf) s += v;
      const level = s / m.buf.length / 255;
      this.onLevel(id, id === this.myId && !this.micOn ? 0 : level);
    }
  }
}
