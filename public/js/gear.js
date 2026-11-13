import * as THREE from 'three';

// ───── 상점 물건 모양 (날개 · 탈것 · 전설의 검) + 사용 효과 (폭죽 · 검 · 방귀)
// 모든 날개·탈것은 조금씩 반복해서 움직이고, 살짝 빛난다.
const MC = new Map();
const M = (c, o = {}) => { const k = c + JSON.stringify(o); let m = MC.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...o }); MC.set(k, m); } return m; };
const glowM = (c, i = 0.6, o = {}) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.35, ...o });
const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent?.add(m); return m; };
const isCoarse = matchMedia('(pointer: coarse)').matches;

let _spark = null;
function sparkTex() {
  if (_spark) return _spark;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); _spark = new THREE.CanvasTexture(c); return _spark;
}
const glowSprite = (color, size, opacity = 0.6) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s; };

// ───────────── 날개
function wingShape(kind) {
  const s = new THREE.Shape();
  if (kind === 'fairy') { s.moveTo(0, 0); s.bezierCurveTo(0.15, 0.55, 0.55, 0.62, 0.62, 0.38); s.bezierCurveTo(0.66, 0.18, 0.3, 0.05, 0, 0); }
  else if (kind === 'fairy2') { s.moveTo(0, 0); s.bezierCurveTo(0.22, -0.05, 0.42, -0.25, 0.36, -0.42); s.bezierCurveTo(0.25, -0.5, 0.05, -0.25, 0, 0); }
  else if (kind === 'devil' || kind === 'dragon') {
    const big = kind === 'dragon' ? 1.35 : 1;
    s.moveTo(0, 0); s.lineTo(0.2 * big, 0.38 * big); s.lineTo(0.72 * big, 0.6 * big); s.lineTo(0.62 * big, 0.28 * big); s.quadraticCurveTo(0.56 * big, 0.12 * big, 0.48 * big, 0.2 * big);
    s.quadraticCurveTo(0.42 * big, 0.0, 0.32 * big, 0.08 * big); s.quadraticCurveTo(0.26 * big, -0.1, 0.16 * big, -0.02 * big); s.closePath();
  } else { s.moveTo(0, 0); s.ellipse(0, 0, 0.1, 0.035, 0, Math.PI * 2); }
  return new THREE.ShapeGeometry(s, 16);
}
export function buildWings(id) {
  const g = new THREE.Group(); const sides = [];
  const kind = id.replace('wings_', '');
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.06 * s, 0.36, -0.19); piv.rotation.z = -0.12 * s; g.add(piv); piv.userData.s = s; // 머리 말고 등(몸통)에 붙는다
    const inner = new THREE.Group(); inner.scale.set(s, 1, 1); piv.add(inner);
    if (kind === 'fairy') {
      const m1 = glowM('#8fe8ff', 0.7, { transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
      const m2 = glowM('#ffa8e0', 0.7, { transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
      mesh(wingShape('fairy'), m1, 0, 0, 0, inner); mesh(wingShape('fairy2'), m2, 0, 0, 0.002, inner);
      for (let i = 0; i < 4; i++) { const sp = glowSprite(i % 2 ? '#bff4ff' : '#ffd0f0', 0.09, 0.9); sp.position.set(0.15 + i * 0.12, 0.1 + Math.sin(i) * 0.15, 0.01); inner.add(sp); }
    } else if (kind === 'angel') {
      const fm = glowM('#ffffff', 0.45, { side: THREE.DoubleSide });
      const fm2 = glowM('#fff3d0', 0.55, { side: THREE.DoubleSide });
      const fg = new THREE.SphereGeometry(1, 12, 8);
      // 깃털: 길쭉한 타원을 부채꼴로 여러 겹
      for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++) {
        const a = 0.15 + i * 0.22 + row * 0.12, len = 0.34 - row * 0.07 + i * 0.015;
        const f = mesh(fg, row ? fm2 : fm, Math.cos(a) * (0.12 + row * 0.08) + 0.06, Math.sin(a) * (0.14 + row * 0.06) + 0.05, -row * 0.012, inner);
        f.scale.set(len, 0.045, 0.012); f.rotation.z = a - 0.9 + row * 0.15;
      }
      const halo = glowSprite('#fff6d8', 0.9, 0.35); halo.position.set(0.25, 0.15, -0.05); inner.add(halo);
    } else {
      const dragon = kind === 'dragon';
      const memb = glowM(dragon ? '#7a3cff' : '#ff3a1a', dragon ? 0.55 : 0.75, { transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      mesh(wingShape(kind), memb, 0, 0, 0, inner);
      const bone = M(dragon ? '#2a1a4a' : '#3a0a08', { emissive: dragon ? '#4a2a9a' : '#ff6a1a', emissiveIntensity: 0.3 });
      const k = dragon ? 1.35 : 1;
      for (const [x, y] of [[0.72, 0.6], [0.48, 0.2], [0.32, 0.08], [0.16, -0.02]]) {
        const len = Math.hypot(x, y) * k; const b = mesh(new THREE.CylinderGeometry(0.012, 0.018, len, 6), bone, (x * k) / 2, (y * k) / 2, 0.004, inner); b.rotation.z = Math.atan2(y, x) - Math.PI / 2;
      }
      if (!dragon) for (let i = 0; i < 3; i++) { const sp = glowSprite('#ffaa40', 0.14, 0.7); sp.position.set(0.25 + i * 0.18, 0.15 + i * 0.12, 0.02); inner.add(sp); sp.userData.flame = i; }
    }
    sides.push(piv);
  }
  g.userData.kind = kind;
  g.userData.anim = (t) => {
    const speed = kind === 'fairy' ? 9 : kind === 'angel' ? 2.6 : kind === 'devil' ? 4 : 2.2;
    const amp = kind === 'fairy' ? 0.35 : 0.22;
    for (const p of sides) p.rotation.y = p.userData.s * (0.35 + Math.sin(t * speed) * amp);
    g.position.y = Math.sin(t * 2) * 0.012;
    g.traverse((o) => {
      if (o.material?.emissiveIntensity != null && o.isMesh) o.material.emissiveIntensity = (o.material.userData.base ??= o.material.emissiveIntensity) * (0.8 + Math.sin(t * 3) * 0.25);
      if (o.isSprite && o.userData.flame != null) { o.material.opacity = 0.5 + Math.sin(t * 13 + o.userData.flame * 2) * 0.3; o.position.y += Math.sin(t * 9 + o.userData.flame) * 0.002; }
    });
  };
  return g;
}

// ───────────── 탈것 (아바타 발밑에 붙는다. seat = 엉덩이를 올릴 높이)
function horse(unicorn) {
  const g = new THREE.Group();
  const coat = unicorn ? glowM('#fbf6ff', 0.18) : M('#b0703a');
  const dark = unicorn ? M('#e8d8ff') : M('#5a3418');
  const body = mesh(new THREE.CapsuleGeometry(0.2, 0.5, 8, 16), coat, 0, 0.55, 0, g); body.rotation.x = Math.PI / 2;
  const neck = mesh(new THREE.CapsuleGeometry(0.11, 0.28, 6, 12), coat, 0, 0.78, 0.36, g); neck.rotation.x = -0.6;
  const head = mesh(new THREE.CapsuleGeometry(0.1, 0.18, 6, 12), coat, 0, 0.94, 0.52, g); head.rotation.x = 1.15;
  for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.022, 8, 6), M('#111'), 0.08 * s, 0.98, 0.56, g); mesh(new THREE.ConeGeometry(0.04, 0.1, 6), coat, 0.06 * s, 1.08, 0.44, g); }
  const legs = [];
  for (const [x, z] of [[-0.11, 0.25], [0.11, 0.25], [-0.11, -0.25], [0.11, -0.25]]) { const piv = new THREE.Group(); piv.position.set(x, 0.5, z); g.add(piv); mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.46, 8), coat, 0, -0.23, 0, piv); mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 8), dark, 0, -0.47, 0, piv); legs.push(piv); }
  const tail = new THREE.Group(); tail.position.set(0, 0.62, -0.42); g.add(tail);
  const mane = [];
  if (unicorn) {
    const RB = ['#ff6f91', '#ffc75f', '#7ee0a8', '#6fd6ff', '#b39dff'];
    RB.forEach((c, i) => { const m = mesh(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), glowM(c, 0.5), 0, 0.92 - i * 0.07, 0.36 - i * 0.05, g); m.rotation.x = -0.4; mane.push(m); const t2 = mesh(new THREE.CapsuleGeometry(0.03, 0.26, 4, 8), glowM(c, 0.5), (i - 2) * 0.025, -0.12, -0.04, tail); t2.rotation.x = 0.6; });
    const horn = mesh(new THREE.ConeGeometry(0.035, 0.24, 10), glowM('#ffe58a', 1.3, { metalness: 0.5 }), 0, 1.1, 0.6, g); horn.rotation.x = 0.55;
    const hg = glowSprite('#fff2b0', 0.4, 0.75); hg.position.set(0, 1.18, 0.66); g.add(hg); g.userData.hornGlow = hg;
  } else {
    for (let i = 0; i < 4; i++) { const m = mesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), dark, 0, 0.92 - i * 0.07, 0.36 - i * 0.05, g); m.rotation.x = -0.4; mane.push(m); }
    const t2 = mesh(new THREE.CapsuleGeometry(0.045, 0.28, 4, 8), dark, 0, -0.14, -0.04, tail); t2.rotation.x = 0.6;
    mesh(new THREE.BoxGeometry(0.34, 0.05, 0.3), M('#c0262d', { emissive: '#ff4a4a', emissiveIntensity: 0.35 }), 0, 0.76, -0.02, g); // 안장
  }
  g.userData.seat = 0.62;
  g.userData.anim = (t, moving) => {
    const sp = moving ? 12 : 0; const k = moving ? 0.6 : 0;
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * sp + (i === 0 || i === 3 ? 0 : Math.PI)) * k));
    tail.rotation.x = Math.sin(t * 3) * 0.2; tail.rotation.z = Math.sin(t * 2.3) * 0.25;
    g.position.y = moving ? Math.abs(Math.sin(t * 12)) * 0.05 : Math.sin(t * 1.6) * 0.01;
    head.rotation.z = Math.sin(t * 1.3) * 0.05;
    if (g.userData.hornGlow) g.userData.hornGlow.material.opacity = 0.55 + Math.sin(t * 4) * 0.25;
    mane.forEach((m, i) => (m.rotation.z = Math.sin(t * 4 + i) * 0.1));
  };
  return g;
}
function broom() {
  const g = new THREE.Group(); const inner = new THREE.Group(); g.add(inner);
  const stick = mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.3, 8), M('#8a5a2a'), 0, 0.45, 0.05, inner); stick.rotation.x = Math.PI / 2 - 0.08;
  const br = mesh(new THREE.ConeGeometry(0.16, 0.42, 14, 1, true), M('#d8b040', { side: THREE.DoubleSide, emissive: '#ffcc33', emissiveIntensity: 0.2 }), 0, 0.42, -0.7, inner); br.rotation.x = -Math.PI / 2;
  mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 14), M('#7a2a8a', { emissive: '#c040ff', emissiveIntensity: 0.6 }), 0, 0.43, -0.5, inner);
  const sparks = [];
  for (let i = 0; i < 8; i++) { const s = glowSprite(['#ffd36a', '#c080ff', '#9ad0ff'][i % 3], 0.12, 0.8); inner.add(s); sparks.push(s); }
  g.userData.seat = 0.36; g.userData.float = true;
  g.userData.anim = (t, moving) => {
    g.position.y = 0.18 + Math.sin(t * 2.4) * 0.06; inner.rotation.z = Math.sin(t * 1.7) * 0.06;
    sparks.forEach((s, i) => { const p = ((t * (moving ? 1.6 : 0.6) + i / 8) % 1); s.position.set(Math.sin(i * 2.3 + t) * 0.12, 0.4 - p * 0.3, -0.85 - p * 0.6); s.material.opacity = (1 - p) * 0.8; });
  };
  return g;
}
function ufo() {
  const g = new THREE.Group(); const spin = new THREE.Group(); g.add(spin);
  const hull = mesh(new THREE.SphereGeometry(0.62, 32, 12), M('#b8c4d8', { metalness: 0.8, roughness: 0.25 }), 0, 0.3, 0, g); hull.scale.y = 0.22;
  mesh(new THREE.TorusGeometry(0.6, 0.035, 8, 40), glowM('#6fd6ff', 0.9), 0, 0.3, 0, g).rotation.x = Math.PI / 2;
  const dome = mesh(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9ae8ff', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2, depthWrite: false }), 0, 0.36, 0, g);
  dome.castShadow = false;
  const lights = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const b = mesh(new THREE.SphereGeometry(0.04, 8, 6), glowM(['#ff6f91', '#ffe066', '#7ee0a8'][i % 3], 1.5), Math.cos(a) * 0.5, 0.27, Math.sin(a) * 0.5, spin); lights.push(b); }
  const beam = mesh(new THREE.ConeGeometry(0.45, 0.3, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#9ae8ff', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0.12, 0, g); beam.castShadow = false;
  const yoke = new THREE.Group(); yoke.position.set(0, 0.62, 0.36); g.add(yoke);
  mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 8), M('#3a3e48', { metalness: 0.7 }), 0, -0.16, 0, yoke);
  const wheel = mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 24), glowM('#6fd6ff', 0.6, { metalness: 0.6 }), 0, 0.02, 0, yoke); wheel.rotation.x = -0.5;
  mesh(new THREE.BoxGeometry(0.3, 0.08, 0.12), M('#2a2e38', { metalness: 0.6 }), 0, -0.3, 0.05, yoke);
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.018, 8, 6), glowM(['#ff6f91', '#ffe066', '#7ee0a8'][i], 1.4), -0.08 + i * 0.08, -0.25, 0.11, yoke);
  g.userData.seat = 0.28; g.userData.float = true;
  g.userData.anim = (t) => {
    wheel.rotation.z = Math.sin(t * 1.4) * 0.25;
    g.position.y = 0.22 + Math.sin(t * 2) * 0.05; spin.rotation.y = t * 2.5; g.rotation.z = Math.sin(t * 1.3) * 0.04;
    lights.forEach((l, i) => (l.material.emissiveIntensity = 0.6 + Math.max(0, Math.sin(t * 8 - i)) * 2));
    beam.material.opacity = 0.12 + Math.sin(t * 5) * 0.06;
  };
  return g;
}
function trex() {
  const g = new THREE.Group();
  const skin = M('#4a8a3a', { roughness: 0.6, emissive: '#1a3a10', emissiveIntensity: 0.25 }), belly = M('#c8d890', { roughness: 0.7 }), dark = M('#2a5a22', { roughness: 0.6 });
  const spine = new THREE.Group(); spine.position.y = 0.95; g.add(spine);
  const body = mesh(new THREE.SphereGeometry(0.42, 22, 16), skin, 0, 0, 0, spine); body.scale.set(0.85, 0.8, 1.35);
  const bel = mesh(new THREE.SphereGeometry(0.36, 18, 12), belly, 0, -0.1, 0.08, spine); bel.scale.set(0.75, 0.7, 1.2);
  // 목 + 커다란 머리 + 벌어지는 아래턱
  const neck = mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.4, 14), skin, 0, 0.25, 0.48, spine); neck.rotation.x = 0.7;
  const head = new THREE.Group(); head.position.set(0, 0.42, 0.72); spine.add(head);
  const skull = mesh(new THREE.BoxGeometry(0.38, 0.3, 0.55), skin, 0, 0.05, 0.12, head);
  mesh(new THREE.BoxGeometry(0.34, 0.12, 0.3), skin, 0, 0.02, 0.45, head);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.08, 0.0); head.add(jaw);
  mesh(new THREE.BoxGeometry(0.32, 0.09, 0.62), belly, 0, -0.04, 0.3, jaw);
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.018, 0.06, 5), M('#fffbe8'), s * 0.14, -0.04, 0.12 + i * 0.075, head).rotation.x = Math.PI;
  for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.05, 10, 8), M('#ffe066', { emissive: '#ffcc33', emissiveIntensity: 0.9 }), s * 0.17, 0.13, 0.2, head); mesh(new THREE.SphereGeometry(0.022, 8, 6), M('#111'), s * 0.2, 0.13, 0.22, head); mesh(new THREE.BoxGeometry(0.1, 0.03, 0.08), dark, s * 0.15, 0.21, 0.18, head).rotation.z = s * 0.3; }
  // 등 가시
  for (let i = 0; i < 6; i++) { const sp = mesh(new THREE.ConeGeometry(0.05, 0.14, 6), dark, 0, 0.32 - i * 0.02, 0.35 - i * 0.22, spine); sp.rotation.x = -0.3; }
  // 꼬리 (마디가 이어져 흔들린다)
  const tail = []; let parent = spine, z = -0.5;
  for (let i = 0; i < 5; i++) { const seg = new THREE.Group(); seg.position.set(0, i ? 0 : 0.02, i ? -0.24 : z); parent.add(seg); const r = 0.22 - i * 0.04; mesh(new THREE.SphereGeometry(r, 14, 10), skin, 0, 0, -0.12, seg).scale.set(1, 0.9, 1.5); tail.push(seg); parent = seg; }
  // 짧은 앞팔 (작아서 귀엽다)
  for (const s of [-1, 1]) { const a = mesh(new THREE.CapsuleGeometry(0.035, 0.14, 4, 8), skin, s * 0.24, -0.05, 0.42, spine); a.rotation.x = -0.9; }
  // 굵은 뒷다리
  const legs = [];
  for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * 0.26, 0.9, -0.05); g.add(piv);
    mesh(new THREE.SphereGeometry(0.2, 14, 10), skin, 0, -0.12, 0, piv).scale.set(0.9, 1.3, 1.1);
    mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.55, 10), skin, 0, -0.55, 0.04, piv);
    mesh(new THREE.BoxGeometry(0.2, 0.08, 0.32), dark, 0, -0.86, 0.1, piv); legs.push(piv); }
  mesh(new THREE.BoxGeometry(0.42, 0.06, 0.34), M('#8a3a1a', { emissive: '#ff6a3a', emissiveIntensity: 0.2 }), 0, 0.33, 0.12, spine); // 안장
  g.userData.seat = 1.24;
  let roarT = 3;
  g.userData.anim = (t, moving) => {
    const sp = moving ? 8 : 0, k = moving ? 0.55 : 0;
    legs[0].rotation.x = Math.sin(t * sp) * k; legs[1].rotation.x = -Math.sin(t * sp) * k;
    g.position.y = moving ? Math.abs(Math.sin(t * sp)) * 0.06 : Math.sin(t * 1.4) * 0.008;
    spine.rotation.z = moving ? Math.sin(t * sp) * 0.04 : 0;
    tail.forEach((s, i) => { s.rotation.y = Math.sin(t * 2.2 - i * 0.6) * (0.12 + i * 0.03); s.rotation.x = -0.05; });
    // 가끔 크앙! 입을 크게 벌린다
    const ph = t % 9; const roar = ph > 7.5 ? Math.sin(((ph - 7.5) / 1.5) * Math.PI) : 0;
    jaw.rotation.x = 0.08 + roar * 0.6 + Math.sin(t * 2) * 0.03; head.rotation.x = -roar * 0.35 + Math.sin(t * 1.1) * 0.04;
  };
  return g;
}
export function buildMount(id) {
  if (id === 'mount_trex') return trex();
  if (id === 'mount_pony') return horse(false);
  if (id === 'mount_unicorn') return horse(true);
  if (id === 'mount_broom') return broom();
  if (id === 'mount_ufo') return ufo();
  return null;
}

// ───────────── 전설의 검 (크리스탈 · 푸른 빛)
export function buildSword() {
  const g = new THREE.Group();
  const crystal = new THREE.MeshPhysicalMaterial({ color: '#7fd8ff', emissive: '#2a9aff', emissiveIntensity: 1.1, roughness: 0.05, metalness: 0.1, transmission: 0.3, transparent: true, opacity: 0.9 });
  const bladeGeo = new THREE.OctahedronGeometry(1, 0); const blade = mesh(bladeGeo, crystal, 0, 0.42, 0, g); blade.scale.set(0.05, 0.4, 0.016);
  mesh(new THREE.BoxGeometry(0.2, 0.03, 0.05), M('#e8e8f8', { metalness: 0.9, roughness: 0.2, emissive: '#6ab0ff', emissiveIntensity: 0.3 }), 0, 0.04, 0, g);
  mesh(new THREE.CylinderGeometry(0.017, 0.02, 0.12, 8), M('#2a3a8a'), 0, -0.03, 0, g);
  mesh(new THREE.OctahedronGeometry(0.03), glowM('#9ae8ff', 1.6), 0, -0.1, 0, g);
  const glow = glowSprite('#5ab8ff', 0.9, 0.55); glow.position.y = 0.42; g.add(glow);
  g.userData.anim = (t) => { crystal.emissiveIntensity = 0.9 + Math.sin(t * 4) * 0.35; glow.material.opacity = 0.4 + Math.sin(t * 4) * 0.15; };
  return g;
}

/** gear = "날개|탈것|타는중(1/0)|검 듦(1/0)" */
export function applyGear(g, gear = '') {
  const u = g.userData; if (!u.rig) return;
  if (u.gearStr === gear) return; u.gearStr = gear;
  const [w = '', m = '', riding = '0', sword = '0'] = gear.split('|');
  if (u.gWingsId !== w) { if (u.gWings) u.rig.remove(u.gWings); u.gWings = w ? buildWings(w) : null; if (u.gWings) u.rig.add(u.gWings); u.gWingsId = w; }
  const mid = riding === '1' ? m : '';
  if (u.gMountId !== mid) { if (u.gMount) g.remove(u.gMount); u.gMount = mid ? buildMount(mid) : null; if (u.gMount) g.add(u.gMount); u.gMountId = mid; }
  const sw = sword === '1';
  if (!!u.gSword !== sw) {
    if (u.gSword) u.gSword.parent?.remove(u.gSword);
    u.gSword = null;
    if (sw && u.arms?.[0]) { const s = buildSword(); s.position.set(-0.09, -0.33, 0.04); s.rotation.set(Math.PI / 2 - 0.25, 0, 0); s.scale.setScalar(1.25); u.arms[0].add(s); u.gSword = s; }
  }
}
/** animateAvatar 다음에 부른다: 날개·탈것 움직임 + 탄 자세 + 검 휘두르기 */
export function animateGear(g, t, dt, moving) {
  const u = g.userData;
  u.gWings?.userData.anim(t);
  if (u.gMount) {
    u.gMount.userData.anim(t, moving);
    const seat = u.gMount.userData.seat + (u.gMount.userData.float ? u.gMount.position.y : u.gMount.position.y * 0.6);
    u.rig.position.y = seat + Math.sin(t * 2) * 0.005;
    u.rig.rotation.x = 0;
    if (u.legs) { u.legs[0].rotation.set(-1.25, 0, -0.45); u.legs[1].rotation.set(-1.25, 0, 0.45); }
    // 운전 자세: 두 팔을 앞으로 뻗어 핸들(고삐·빗자루 자루)을 잡는다 — 걸을 때처럼 흔들지 않는다
    if (u.arms) { const sway = Math.sin(t * 1.8) * 0.04; u.arms[0].rotation.set(-1.15 + sway, 0, 0.32); u.arms[1].rotation.set(-1.15 - sway, 0, -0.32); }
  }
  if (u.gSword) {
    u.gSword.userData.anim(t);
    if (u.swingT > 0) { u.swingT -= dt; const k = 1 - Math.max(0, u.swingT) / 0.45; u.arms[0].rotation.x = -2.6 + Math.sin(k * Math.PI) * 2.4; u.arms[0].rotation.z = -0.3; }
    else if (!moving) { u.arms[0].rotation.x = -0.5; }
  }
}

// ───────────── 사용 효과 (폭죽 · 검 · 방귀)
const FX = [];
let fxScene = null;
// 폭죽 빛은 미리 하나 만들어 두고 다시 쓴다 (빛을 새로 넣으면 모든 재질을 다시 컴파일해 화면이 멈칫한다)
let boomLight = null;
export function initFx(scene) { fxScene = scene; boomLight = new THREE.PointLight('#ffffff', 0, 34, 1.6); boomLight.position.set(0, -50, 0); scene.add(boomLight); }
function particles(n, colors, size, additive = true) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const col = new Float32Array(n * 3); const c = new THREE.Color();
  for (let i = 0; i < n; i++) { c.set(colors[i % colors.length]); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, map: sparkTex(), vertexColors: true, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; return pts;
}
function addFx(obj, life, step) { fxScene.add(obj); FX.push({ obj, life, t: 0, step }); }
/** 앞쪽으로 색종이가 쏟아지는 꼬깔 폭죽 */
export function popperFx(x, y, z, ry) {
  const n = 160; const pts = particles(n, ['#ff6f91', '#ffe066', '#7ee0a8', '#6fd6ff', '#b39dff', '#ffffff', '#ff9671'], 0.16, false);
  const v = []; const p = pts.geometry.attributes.position;
  const fx = Math.sin(ry), fz = Math.cos(ry);
  for (let i = 0; i < n; i++) {
    const spread = 0.55, a = (Math.random() - 0.5) * spread * 2, up = 0.2 + Math.random() * 0.9, sp = 5 + Math.random() * 6;
    const dx = Math.sin(ry + a), dz = Math.cos(ry + a);
    v.push([dx * sp, up * sp * 0.6, dz * sp]); p.setXYZ(i, x + fx * 0.5, y + 0.8, z + fz * 0.5);
  }
  // 손에 든 꼬깔
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#ff5a9a', emissive: '#ff5a9a', emissiveIntensity: 0.4, side: THREE.DoubleSide }));
  cone.position.set(x + fx * 0.42, y + 0.75, z + fz * 0.42); cone.rotation.set(0, ry, 0); cone.rotateX(-Math.PI / 2 - 0.3);
  addFx(cone, 1.2, (o, t) => { o.material.opacity = 1; o.scale.setScalar(t < 0.1 ? 1 + t * 3 : 1); });
  addFx(pts, 3.2, (o, t, dt) => {
    for (let i = 0; i < n; i++) { const q = v[i]; q[1] -= 6 * dt; q[0] *= 0.97; q[2] *= 0.97; if (q[1] < -1.5) q[1] = -1.5; let yy = p.getY(i) + q[1] * dt; if (yy < 0.03) { yy = 0.03; q[0] *= 0.5; q[2] *= 0.5; } p.setXYZ(i, p.getX(i) + q[0] * dt, yy, p.getZ(i) + q[2] * dt); }
    p.needsUpdate = true; o.material.opacity = Math.min(1, (3.2 - t) / 0.8);
  });
  const fl = glowSprite('#fff2c0', 1.6, 0.9); fl.position.set(x + fx * 0.7, y + 0.85, z + fz * 0.7);
  addFx(fl, 0.25, (o, t) => (o.material.opacity = 0.9 * (1 - t / 0.25)));
}
/** 머리 위로 슈우욱 올라갔다가 팡! — 잠시 주변을 밝힌다 */
export function rocketFx(x, y, z, onBoom) {
  const shell = glowSprite('#ffe8a0', 0.35, 1); shell.position.set(x, y + 1.2, z);
  const trail = particles(40, ['#ffcc66', '#ff8844'], 0.12); const tp = trail.geometry.attributes.position;
  for (let i = 0; i < 40; i++) tp.setXYZ(i, x, y + 1.2, z);
  let k = 0; const H = 11;
  addFx(trail, 1.6, (o, t) => { o.material.opacity = t < 1.05 ? 0.9 : Math.max(0, 1 - (t - 1.05) / 0.5); });
  addFx(shell, 1.05, (o, t) => {
    const yy = y + 1.2 + (1 - Math.pow(1 - t / 1.05, 2)) * H; o.position.set(x + Math.sin(t * 9) * 0.05, yy, z);
    tp.setXYZ(k++ % 40, x + (Math.random() - 0.5) * 0.08, yy - 0.1, z + (Math.random() - 0.5) * 0.08); tp.needsUpdate = true;
    if (t > 1.0 && !o.userData.boom) { o.userData.boom = true; boom(x, yy, z); onBoom?.(x, yy, z); }
  });
}
function boom(x, y, z) {
  const n = 260; const cols = [['#ff6f91', '#ffe066'], ['#6fd6ff', '#ffffff'], ['#b39dff', '#7ee0a8']][Math.floor(Math.random() * 3)];
  const pts = particles(n, cols, 0.32); const p = pts.geometry.attributes.position; const v = [];
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = 6 + Math.random() * 3; v.push([r * Math.cos(a) * sp, u * sp, r * Math.sin(a) * sp]); p.setXYZ(i, x, y, z); }
  addFx(pts, 2.6, (o, t, dt) => { for (let i = 0; i < n; i++) { const q = v[i]; q[0] *= 0.95; q[1] = q[1] * 0.95 - 2.2 * dt; q[2] *= 0.95; p.setXYZ(i, p.getX(i) + q[0] * dt, p.getY(i) + q[1] * dt, p.getZ(i) + q[2] * dt); } p.needsUpdate = true; o.material.opacity = Math.max(0, 1 - t / 2.6) * (0.75 + Math.random() * 0.25); });
  const fl = glowSprite(cols[0], 9, 0.9); fl.position.set(x, y, z);
  addFx(fl, 0.6, (o, t) => (o.material.opacity = 0.9 * (1 - t / 0.6)));
  // 잠시 주변이 환해진다
  if (boomLight) {
    boomLight.color.set(cols[0]); boomLight.position.set(x, y - 3, z); const holder = new THREE.Object3D();
    addFx(holder, 4, (o, t) => { boomLight.intensity = (t < 0.15 ? t / 0.15 : Math.pow(Math.max(0, 1 - (t - 0.15) / 3.85), 1.6)) * 160; });
  }
}
/** 검 휘두르기: 푸른 빛 궤적 (+귀신을 베면 빛가루가 흩어진다) */
export function swordFx(x, y, z, ry, hit) {
  const arc = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.15, 32, 1, -0.9, 1.8), new THREE.MeshBasicMaterial({ color: '#7fd8ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  arc.position.set(x, y + 0.75, z); arc.rotation.set(-Math.PI / 2, 0, -ry + Math.PI / 2);
  addFx(arc, 0.35, (o, t) => { o.material.opacity = 0.8 * (1 - t / 0.35); o.rotation.z += 0.18; });
  if (hit) {
    const n = 120; const pts = particles(n, ['#9ae8ff', '#ffffff', '#5ab8ff'], 0.22); const p = pts.geometry.attributes.position; const v = [];
    for (let i = 0; i < n; i++) { v.push([(Math.random() - 0.5) * 3, Math.random() * 4, (Math.random() - 0.5) * 3]); p.setXYZ(i, hit.x, 1 + Math.random() * 0.8, hit.z); }
    addFx(pts, 1.8, (o, t, dt) => { for (let i = 0; i < n; i++) { const q = v[i]; p.setXYZ(i, p.getX(i) + q[0] * dt, p.getY(i) + q[1] * dt, p.getZ(i) + q[2] * dt); q[1] *= 0.96; } p.needsUpdate = true; o.material.opacity = 1 - t / 1.8; });
  }
}
/** 검이 깨지는 조각 */
export function shatterFx(x, y, z) {
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.05 + Math.random() * 0.05), new THREE.MeshStandardMaterial({ color: '#9ae8ff', emissive: '#2a9aff', emissiveIntensity: 1.2, transparent: true }));
    s.position.set(x, y + 1, z); const v = [(Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4];
    addFx(s, 1.5, (o, t, dt) => { v[1] -= 9 * dt; o.position.x += v[0] * dt; o.position.y = Math.max(0.03, o.position.y + v[1] * dt); o.position.z += v[2] * dt; o.rotation.x += 0.3; o.material.opacity = 1 - t / 1.5; });
  }
}
/** 방귀: 엉덩이에서 뿌연 먼지가 뿜어져 나온다 */
export function fartFx(x, y, z, ry) {
  const bx = x - Math.sin(ry) * 0.32, bz = z - Math.cos(ry) * 0.32;
  const n = 60; const pts = particles(n, ['#a89868', '#8a7a50', '#b8ac80', '#7a6a40'], 0.7, false);
  const p = pts.geometry.attributes.position; const v = [];
  for (let i = 0; i < n; i++) { const a = ry + Math.PI + (Math.random() - 0.5) * 1.4, sp = 0.6 + Math.random() * 1.6; v.push([Math.sin(a) * sp, 0.2 + Math.random() * 0.6, Math.cos(a) * sp]); p.setXYZ(i, bx, y + 0.28, bz); }
  pts.material.opacity = 0.85;
  addFx(pts, 2.4, (o, t, dt) => {
    for (let i = 0; i < n; i++) { const q = v[i]; q[0] *= 0.96; q[2] *= 0.96; p.setXYZ(i, p.getX(i) + q[0] * dt, p.getY(i) + q[1] * dt * 0.5, p.getZ(i) + q[2] * dt); }
    p.needsUpdate = true; o.material.size = 0.7 + t * 0.7; o.material.opacity = 0.85 * Math.max(0, 1 - t / 2.4);
  });
}
export function updateFx(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t += dt; f.step(f.obj, f.t, dt);
    if (f.t >= f.life) { fxScene.remove(f.obj); f.obj.geometry?.dispose(); if (f.obj.material && !f.obj.material.map?.isCanvasTexture) f.obj.material.dispose?.(); FX.splice(i, 1); }
  }
}
export const fxCount = () => FX.length;
