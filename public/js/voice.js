// 파티 전용 음성 채팅 (WebRTC P2P 메시, 신호는 소켓으로 중계)
const ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

export class Voice {
  constructor(socket, { onLevel, onError } = {}) {
    this.socket = socket;
    this.myId = null;
    this.peers = new Map();
    this.stream = null;
    this.micOn = false;
    this.onLevel = onLevel || (() => {});
    this.onError = onError || (() => {});
    this.actx = null;
    this.meters = new Map();
    socket.on('voice:signal', (m) => this.handle(m));
    socket.on('voice:peerLeft', (id) => this.drop(id));
    setInterval(() => this.meter(), 120);
  }

  setParty(memberIds) {
    const want = new Set(memberIds.filter((id) => id !== this.myId));
    for (const id of [...this.peers.keys()]) if (!want.has(id)) this.drop(id);
    for (const id of want) if (!this.peers.has(id) && this.myId < id) this.connect(id, true);
  }

  makePeer(id) {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    const audio = document.createElement('audio');
    audio.autoplay = true; audio.playsInline = true;
    document.getElementById('voiceAudio').appendChild(audio);
    const peer = { pc, audio, tr: null };
    pc.onicecandidate = (e) => { if (e.candidate) this.send(id, { candidate: e.candidate }); };
    pc.ontrack = (e) => {
      const s = e.streams[0] || new MediaStream([e.track]);
      audio.srcObject = s; audio.play().catch(() => {});
      this.addMeter(id, s);
    };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { this.drop(id); if (this.myId < id) setTimeout(() => this.connect(id, true), 1500); } };
    this.peers.set(id, peer);
    return peer;
  }

  async connect(id) {
    const peer = this.makePeer(id);
    peer.tr = peer.pc.addTransceiver('audio', { direction: 'sendrecv' });
    if (this.track) await peer.tr.sender.replaceTrack(this.track);
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    this.send(id, { description: peer.pc.localDescription });
  }

  async handle({ from, data }) {
    try {
      let peer = this.peers.get(from);
      if (data.description) {
        const d = data.description;
        if (d.type === 'offer') {
          if (peer) this.drop(from);
          peer = this.makePeer(from);
          await peer.pc.setRemoteDescription(d);
          peer.tr = peer.pc.getTransceivers()[0];
          peer.tr.direction = 'sendrecv';
          if (this.track) await peer.tr.sender.replaceTrack(this.track);
          const ans = await peer.pc.createAnswer();
          await peer.pc.setLocalDescription(ans);
          this.send(from, { description: peer.pc.localDescription });
          for (const c of peer.pending || []) await peer.pc.addIceCandidate(c);
        } else if (peer) {
          await peer.pc.setRemoteDescription(d);
          for (const c of peer.pending || []) await peer.pc.addIceCandidate(c);
        }
      } else if (data.candidate) {
        if (!peer) return;
        if (!peer.pc.remoteDescription) (peer.pending ||= []).push(data.candidate);
        else await peer.pc.addIceCandidate(data.candidate);
      }
    } catch (e) { console.warn('voice', e); }
  }

  send(to, data) { this.socket.emit('voice:signal', { to, data }); }

  drop(id) {
    const p = this.peers.get(id);
    if (!p) return;
    try { p.pc.close(); } catch {}
    p.audio.remove();
    this.peers.delete(id);
    this.meters.delete(id);
  }

  async toggleMic() {
    if (!this.micOn) {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.onError('이 주소에서는 마이크를 쓸 수 없습니다. localhost 또는 https 주소로 접속하세요.');
        return false;
      }
      try {
        if (!this.stream) {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
          this.track = this.stream.getAudioTracks()[0];
          this.addMeter(this.myId, this.stream);
          for (const p of this.peers.values()) if (p.tr) await p.tr.sender.replaceTrack(this.track);
        }
        this.track.enabled = true;
        this.micOn = true;
      } catch (e) {
        this.onError('마이크 권한이 거부되었습니다.');
        return false;
      }
    } else {
      if (this.track) this.track.enabled = false;
      this.micOn = false;
    }
    this.socket.emit('voice:mic', this.micOn);
    return this.micOn;
  }

  setVolume(v) { for (const p of this.peers.values()) p.audio.volume = v; }

  addMeter(id, stream) {
    try {
      this.actx ||= new AudioContext();
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
