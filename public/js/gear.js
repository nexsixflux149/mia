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
// 대왕 고양이 · 대왕 강아지 (같은 뼈대, 귀·꼬리·무늬만 다르다)
function bigPet(kind) {
  const cat = kind === 'cat';
  const g = new THREE.Group();
  const fur = M(cat ? '#f0a050' : '#e8d0a8', { roughness: 0.85 }), fur2 = M(cat ? '#c06a20' : '#a8784a', { roughness: 0.85 }), white = M('#fbf6ee', { roughness: 0.85 }), dark = M('#2a1a14');
  const body = new THREE.Group(); body.position.y = 0.95; g.add(body);
  const torso = mesh(new THREE.SphereGeometry(0.5, 24, 16), fur, 0, 0, 0, body); torso.scale.set(0.95, 0.85, 1.45);
  mesh(new THREE.SphereGeometry(0.4, 18, 12), white, 0, -0.12, 0.12, body).scale.set(0.8, 0.75, 1.3);
  if (cat) for (let i = 0; i < 4; i++) { const st = mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 24, Math.PI), fur2, 0, 0.05, -0.35 + i * 0.22, body); st.rotation.set(0, Math.PI / 2, 0); st.scale.set(1, 0.9, 1.05); } // 줄무늬
  else for (const [x, z] of [[0.3, -0.2], [-0.25, 0.25]]) mesh(new THREE.SphereGeometry(0.16, 12, 8), fur2, x, 0.32, z, body).scale.set(1, 0.4, 1.3); // 얼룩
  const head = new THREE.Group(); head.position.set(0, 0.38, 0.72); body.add(head);
  mesh(new THREE.SphereGeometry(0.4, 22, 16), fur, 0, 0, 0, head).scale.set(1.05, 0.95, 0.95);
  mesh(new THREE.SphereGeometry(0.2, 16, 12), white, 0, -0.1, 0.3, head).scale.set(cat ? 1.2 : 1.1, 0.8, cat ? 0.8 : 1.3);
  mesh(new THREE.SphereGeometry(0.06, 10, 8), cat ? M('#ff8fab') : dark, 0, cat ? -0.02 : 0, cat ? 0.42 : 0.52, head);
  for (const s of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.075, 14, 10), M(cat ? '#7ad84a' : '#3a2414', { emissive: cat ? '#3a8a1a' : '#000', emissiveIntensity: 0.5, roughness: 0.2 }), s * 0.16, 0.1, 0.32, head);
    mesh(new THREE.SphereGeometry(0.025, 8, 6), M('#ffffff'), s * 0.18, 0.14, 0.39, head);
    if (cat) { eye.scale.set(1, 1.2, 0.7); const ear = mesh(new THREE.ConeGeometry(0.14, 0.3, 4), fur, s * 0.24, 0.36, -0.02, head); ear.rotation.z = -s * 0.3; mesh(new THREE.ConeGeometry(0.08, 0.18, 4), M('#ff9ab0'), s * 0.235, 0.34, 0.03, head).rotation.z = -s * 0.3;
      for (let k = 0; k < 3; k++) { const w = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.34, 4), M('#ffffff'), s * 0.28, -0.08 + k * 0.03, 0.34, head); w.rotation.z = Math.PI / 2 + s * (k - 1) * 0.15; } }
    else { const ear = mesh(new THREE.SphereGeometry(0.15, 12, 8), fur2, s * 0.36, 0.1, -0.02, head); ear.scale.set(0.5, 1.4, 0.9); ear.rotation.z = s * 0.35; }
  }
  let tongue = null; if (!cat) { tongue = mesh(new THREE.BoxGeometry(0.1, 0.02, 0.16), M('#ff6a8a'), 0, -0.24, 0.46, head); tongue.rotation.x = 0.5; }
  const legs = [];
  for (const [x, z] of [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.45], [0.3, -0.45]]) { const piv = new THREE.Group(); piv.position.set(x, 0.75, z); g.add(piv); mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.66, 12), fur, 0, -0.35, 0, piv); mesh(new THREE.SphereGeometry(0.15, 12, 8), white, 0, -0.7, 0.04, piv).scale.set(1, 0.6, 1.25); legs.push(piv); }
  const tail = new THREE.Group(); tail.position.set(0, 0.2, -0.7); body.add(tail);
  if (cat) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.25, -0.25), new THREE.Vector3(0, 0.7, -0.3), new THREE.Vector3(0.1, 0.95, -0.15)]); mesh(new THREE.TubeGeometry(c, 16, 0.07, 8), fur, 0, 0, 0, tail); }
  else { const t2 = mesh(new THREE.CapsuleGeometry(0.07, 0.4, 6, 10), fur, 0, 0.22, -0.12, tail); t2.rotation.x = -0.8; }
  mesh(new THREE.BoxGeometry(0.5, 0.06, 0.42), M(cat ? '#6a3ab0' : '#2a6ab0', { emissive: cat ? '#a060ff' : '#40a0ff', emissiveIntensity: 0.3 }), 0, 0.42, -0.02, body); // 안장
  g.userData.seat = 1.4;
  g.userData.anim = (t, moving) => {
    const sp = moving ? (cat ? 9 : 11) : 0, k = moving ? 0.55 : 0;
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * sp + (i === 0 || i === 3 ? 0 : Math.PI)) * k));
    g.position.y = moving ? Math.abs(Math.sin(t * sp)) * 0.07 : Math.sin(t * 1.5) * 0.01;
    tail.rotation.z = Math.sin(t * (cat ? 2 : 12)) * (cat ? 0.25 : 0.6); tail.rotation.x = cat ? Math.sin(t * 1.3) * 0.1 : 0;
    head.rotation.y = Math.sin(t * 0.8) * 0.15; head.rotation.z = Math.sin(t * 1.1) * 0.05;
    if (tongue) tongue.position.y = -0.24 + Math.sin(t * 8) * 0.01;
    torso.scale.y = 0.85 + Math.sin(t * 2) * 0.01;
  };
  return g;
}
// 황금 마차 (최고 레벨) — 바퀴가 굴러가고, 장식 보석이 반짝인다
function carriage() {
  const g = new THREE.Group();
  const gold = M('#f2c440', { metalness: 0.9, roughness: 0.22, emissive: '#8a6010', emissiveIntensity: 0.35 }), cream = M('#fff4dc', { roughness: 0.5 }), red = M('#b0142a', { roughness: 0.6 });
  const box = new THREE.Group(); box.position.y = 0.75; g.add(box);
  const shell = mesh(new THREE.SphereGeometry(0.62, 26, 18), gold, 0, 0.1, -0.1, box); shell.scale.set(0.95, 0.85, 1.15);
  mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.08, 24), red, 0, -0.05, -0.1, box); // 좌석
  mesh(new THREE.BoxGeometry(0.7, 0.42, 0.12), red, 0, 0.12, -0.55, box); // 등받이
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.035, 8, 6), M(['#ff4a8a', '#4ad8ff', '#7eff7a'][i % 3], { emissive: ['#ff4a8a', '#4ad8ff', '#7eff7a'][i % 3], emissiveIntensity: 1.2 }), Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.7 - 0.1, box); }
  const crown = new THREE.Group(); crown.position.set(0, 1.42, -0.1); box.add(crown);
  mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 12), gold, 0, 0, 0, crown);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; mesh(new THREE.ConeGeometry(0.04, 0.12, 6), gold, Math.cos(a) * 0.15, 0.1, Math.sin(a) * 0.15, crown); }
  mesh(new THREE.OctahedronGeometry(0.06), M('#ff2a5a', { emissive: '#ff2a5a', emissiveIntensity: 1.5 }), 0, 0.2, 0, crown);
  for (const s of [-1, 1]) { const pole = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), gold, s * 0.46, 0.65, -0.3, box); pole.rotation.x = 0; }
  const canopy = mesh(new THREE.SphereGeometry(0.62, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), cream, 0, 1.3, -0.1, box); canopy.scale.y = 0.4; canopy.material = M('#fff4dc', { roughness: 0.5, side: THREE.DoubleSide });
  const wheels = [];
  for (const [x, z, r] of [[-0.62, 0.35, 0.3], [0.62, 0.35, 0.3], [-0.62, -0.5, 0.4], [0.62, -0.5, 0.4]]) {
    const w = new THREE.Group(); w.position.set(x, r, z); g.add(w);
    const rim = mesh(new THREE.TorusGeometry(r, 0.035, 8, 28), gold, 0, 0, 0, w); rim.rotation.y = Math.PI / 2;
    for (let k = 0; k < 8; k++) { const sp = mesh(new THREE.CylinderGeometry(0.012, 0.012, r * 2, 5), gold, 0, 0, 0, w); sp.rotation.x = (k / 8) * Math.PI; }
    mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, 0, 0, w); wheels.push(w);
  }
  mesh(new THREE.BoxGeometry(0.12, 0.05, 1.3), gold, 0, 0.35, -0.08, g);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex(), color: '#ffe08a', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(2.4); glow.position.y = 0.9; g.add(glow);
  const sparks = []; for (let i = 0; i < 10; i++) { const sp = glowSprite('#ffe9a8', 0.1, 0.9); g.add(sp); sparks.push(sp); }
  g.userData.seat = 0.72;
  g.userData.anim = (t, moving) => {
    wheels.forEach((w) => (w.rotation.x = moving ? -t * 6 : w.rotation.x));
    box.position.y = 0.75 + (moving ? Math.abs(Math.sin(t * 10)) * 0.03 : 0); box.rotation.z = Math.sin(t * 1.2) * 0.02;
    crown.rotation.y = t * 0.8; glow.material.opacity = 0.3 + Math.sin(t * 2.5) * 0.12;
    sparks.forEach((s, i) => { const a = t * 1.2 + i * 0.63; s.position.set(Math.cos(a) * 0.9, 0.5 + ((t * 0.4 + i * 0.1) % 1) * 1.2, Math.sin(a) * 1.0); s.material.opacity = 0.4 + Math.sin(t * 5 + i) * 0.4; });
  };
  return g;
}
export function buildMount(id) {
  if (id === 'mount_cat') return bigPet('cat');
  if (id === 'mount_dog') return bigPet('dog');
  if (id === 'mount_carriage') return carriage();
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

// ───────────── 황금 고양이 세트 (비매품 · 주간랭킹 1위 보상)
//  부위마다 따로 입는다 — h 모자 · m 가면 · g 장갑 · t 상의 · b 하의 · s 신발 · l 꼬리. 원래 옷 위에 덧입는 모양이라 몸을 숨기지 않는다.
const goldM = () => M('#ffd04a', { metalness: 0.32, roughness: 0.27, emissive: '#c79a00', emissiveIntensity: 0.5 });
const goldD = () => M('#e5a520', { metalness: 0.36, roughness: 0.36, emissive: '#946400', emissiveIntensity: 0.46 });
const goldPink = () => M('#ff9ec4', { roughness: 0.5, emissive: '#ff5f9e', emissiveIntensity: 0.3 });
const goldDark = () => M('#1c1408', { roughness: 0.4 });
// 황금 고양이 가면의 그림: 하얀 바탕에 붉은 불꽃 무늬 · 황금 눈꼬리 · 이마 점 · 작은 코 (여우 · 고양이 탈 느낌). 한 번만 그려 모두가 함께 쓴다
//  바깥(얼굴 모양 밖)은 투명하게 두어 잘라 낸다. 왼쪽 = 보는 사람 기준 왼쪽.
let _maskMat = null;
function catMaskMat() {
  if (_maskMat) return _maskMat;
  const W = 512, H = 336, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const face = new Path2D();
  face.moveTo(256, 8); face.bezierCurveTo(400, 2, 500, 70, 504, 150); face.bezierCurveTo(508, 240, 380, 322, 256, 330);
  face.bezierCurveTo(132, 322, 4, 240, 8, 150); face.bezierCurveTo(12, 70, 112, 2, 256, 8); face.closePath();
  x.save(); x.clip(face);
  const bg = x.createRadialGradient(256, 140, 30, 256, 170, 330); bg.addColorStop(0, '#fffdf7'); bg.addColorStop(0.7, '#fbf3e4'); bg.addColorStop(1, '#eadcc4');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const RED = '#e3262b', GOLD = '#f7b500';
  const petal = (ax, ay, c1x, c1y, tx, ty, c2x, c2y, bx, by, col) => { x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(c1x, c1y, tx, ty); x.quadraticCurveTo(c2x, c2y, bx, by); x.closePath(); x.fillStyle = col; x.fill(); };
  // 왼쪽 이마에서 번져 나오는 붉은 불꽃 세 가닥 + 황금 한 가닥
  petal(4, 96, 70, 18, 214, 40, 110, 66, 20, 150, RED);
  petal(18, 160, 80, 84, 196, 96, 104, 122, 34, 196, RED);
  petal(30, 206, 70, 150, 132, 150, 84, 176, 52, 232, RED);
  petal(96, 14, 150, 6, 232, 22, 160, 30, 120, 40, GOLD);
  // 이마 한가운데 붉은 점
  x.beginPath(); x.moveTo(256, 50); x.quadraticCurveTo(275, 84, 256, 108); x.quadraticCurveTo(237, 84, 256, 50); x.closePath(); x.fillStyle = RED; x.fill();
  // 볼 터치 (아주 옅게)
  for (const bx of [112, 400]) { const bl = x.createRadialGradient(bx, 252, 2, bx, 252, 40); bl.addColorStop(0, 'rgba(255,120,140,.34)'); bl.addColorStop(1, 'rgba(255,120,140,0)'); x.fillStyle = bl; x.fillRect(bx - 44, 208, 88, 88); }
  // 눈구멍: 눈꼬리가 올라간 고양이 눈
  const eye = (s) => { const X = (v) => 256 + s * v; x.beginPath(); x.moveTo(X(44), 204); x.quadraticCurveTo(X(92), 136, X(158), 166); x.quadraticCurveTo(X(118), 232, X(44), 204); x.closePath(); x.fillStyle = '#150d12'; x.fill(); };
  eye(-1); eye(1);
  // 황금 눈꼬리: 오른쪽은 눈 아래를 감싸 올리고, 왼쪽은 눈꼬리만 살짝
  x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = GOLD;
  x.lineWidth = 13; x.beginPath(); x.moveTo(306, 214); x.quadraticCurveTo(372, 246, 432, 160); x.stroke();
  x.lineWidth = 10; x.beginPath(); x.moveTo(118, 226); x.quadraticCurveTo(90, 214, 78, 176); x.stroke();
  x.strokeStyle = RED; x.lineWidth = 7; x.beginPath(); x.moveTo(204, 214); x.quadraticCurveTo(160, 240, 122, 232); x.stroke();
  // 작은 붉은 코 · 입
  x.fillStyle = RED; x.beginPath(); x.moveTo(238, 268); x.quadraticCurveTo(256, 258, 274, 268); x.quadraticCurveTo(268, 288, 256, 292); x.quadraticCurveTo(244, 288, 238, 268); x.closePath(); x.fill();
  x.strokeStyle = RED; x.lineWidth = 5; x.beginPath(); x.moveTo(256, 292); x.quadraticCurveTo(250, 310, 234, 306); x.moveTo(256, 292); x.quadraticCurveTo(262, 310, 278, 306); x.stroke();
  x.restore();
  // 가장자리의 황금 테
  x.lineWidth = 9; x.strokeStyle = '#f0b429'; x.stroke(face);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // 부드러운(번들거리지 않는) 재질 · 어두운 맵에서도 무늬가 보이게 살짝 스스로 빛난다
  _maskMat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.84, metalness: 0, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.3, side: THREE.DoubleSide });
  return _maskMat;
}
const softM = (c, e, i = 0.28) => M(c, { roughness: 0.84, metalness: 0, emissive: e, emissiveIntensity: i });
/** 귀(반지름 R · 높이 H 인 원뿔)의 앞면에 붙는 안쪽 세모. 귀의 자식으로 달면 귀와 함께 납작해지고 기운다 */
function earInner(R, H, mat, inset = 0.62) {
  const yb = -H / 2 + H * 0.07, yt = H / 2 - H * 0.24, front = (y) => (R * (H / 2 - y)) / H + 0.014;
  const r = R * ((H / 2 - yb) / H) * inset;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-r, yb, front(yb), r, yb, front(yb), 0, yt, front(yt)], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.userData.gold = true; return m;
}
function goldParts(u, set) {
  const parts = [], anims = [], hidden = [];
  const gold = goldM(), dk = goldD(), pink = goldPink(), black = goldDark();
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = mesh(geo, mat, x, y, z, parent); m.userData.gold = true; parts.push(m); return m; };
  const has = (c) => set.includes(c);
  // 모자: 귀가 쫑긋한 황금 모자 (원래 쓰고 있던 모자 · 동물 귀는 잠시 감춘다)
  if (has('h')) {
    u.head.traverse((o) => { if ((o.userData.hatPart || o.userData.earPart) && o.visible) { o.visible = false; hidden.push(o); } });
    const hg = new THREE.Group(); hg.userData.gold = true; u.head.add(hg); parts.push(hg);
    if (has('m')) hg.scale.setScalar(1.07); // 가면과 함께 쓰면 가면 윗부분을 덮도록 살짝 크게
    const hm = (geo, mat, x = 0, y = 0, z = 0, parent = hg) => { const m = mesh(geo, mat, x, y, z, parent); m.userData.gold = true; return m; };
    hm(new THREE.SphereGeometry(0.47, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2.15), gold, 0, 0.05, 0).scale.set(1.08, 0.97, 1.03);
    const band = hm(new THREE.TorusGeometry(0.468, 0.042, 12, 44), dk, 0, 0.1, 0); band.rotation.x = Math.PI / 2; band.scale.set(1.08, 1.03, 1);
    const ears = [];
    for (const s of [-1, 1]) { // 큼직하고 쫑긋한 귀
      const ear = hm(new THREE.ConeGeometry(0.205, 0.46, 18), gold, 0.275 * s, 0.6, 0.0); ear.rotation.z = -0.3 * s; ear.scale.z = 0.55; ears.push([ear, s]);
      ear.add(earInner(0.205, 0.46, pink));
    }
    hm(new THREE.OctahedronGeometry(0.05), glowM('#ff4d6d', 1.1), 0, 0.2, 0.488).scale.set(1, 1.25, 0.6); // 이마의 붉은 보석
    anims.push((t) => { for (const [e, s] of ears) e.rotation.z = -0.3 * s + Math.sin(t * 2.6 + s) * 0.035 * s; }); // 귀가 가끔 쫑긋
  }
  // 가면: 얼굴을 넉넉히 덮는 고양이 탈 — 하얀 바탕에 붉은 무늬와 황금 눈꼬리, 큰 귀 (부드러운 재질)
  if (has('m')) {
    const plate = add(u.head, new THREE.SphereGeometry(0.472, 44, 22, Math.PI / 2 - 1.08, 2.16, Math.PI / 2 - 0.78, 1.42), catMaskMat(), 0, 0, 0); plate.scale.set(1.08, 0.95, 1);
    plate.castShadow = false;
    // 귀: 황금 모자를 함께 쓰면 모자의 큰 귀가 있으니 달지 않는다
    if (!has('h')) {
      const white = softM('#fff8ec', '#fff1d6'), red = softM('#e3262b', '#a81216'), yel = softM('#ffc533', '#c79a00', 0.36);
      for (const s of [-1, 1]) {
        const ear = add(u.head, new THREE.ConeGeometry(0.175, 0.38, 18), s < 0 ? red : white, 0.215 * s, 0.475, 0.3); ear.rotation.set(-0.3, 0, -0.3 * s); ear.scale.z = 0.5;
        ear.add(earInner(0.175, 0.38, yel, 0.7));
      }
    }
  }
  // 장갑: 분홍 젤리가 달린 고양이 발
  if (has('g')) for (const a of u.arms || []) {
    const s = a.position.x > 0 ? 1 : -1;
    add(a, new THREE.SphereGeometry(0.09, 20, 14), gold, 0.09 * s, -0.315, 0).scale.set(1, 0.96, 1.06);
    add(a, new THREE.SphereGeometry(0.042, 12, 10), gold, 0.07 * s, -0.28, 0.062);
    const cuff = add(a, new THREE.TorusGeometry(0.075, 0.025, 10, 26), dk, 0.076 * s, -0.25, 0); cuff.rotation.order = 'ZXY'; cuff.rotation.set(Math.PI / 2, 0, 0.32 * s);
    add(a, new THREE.SphereGeometry(0.034, 12, 10), pink, 0.09 * s, -0.33, 0.082).scale.set(1.1, 0.9, 0.45);
    for (let k = -1; k <= 1; k++) add(a, new THREE.SphereGeometry(0.017, 10, 8), pink, 0.09 * s + k * 0.034, -0.376 + Math.abs(k) * 0.012, 0.066).scale.z = 0.5;
  }
  // 상의: 황금 윗옷 + 소매 + 목 방울
  if (has('t') && u.torso?.parent) {
    const up = u.torso.parent;
    add(up, new THREE.CapsuleGeometry(0.294, 0.22, 10, 30), gold, 0, 0.52, 0);
    const collar = add(up, new THREE.TorusGeometry(0.192, 0.04, 12, 34), softM('#e3262b', '#a81216', 0.3), 0, 0.825, 0.012); collar.rotation.x = Math.PI / 2 - 0.16; // 붉은 목줄
    const hem = add(up, new THREE.TorusGeometry(0.262, 0.03, 10, 34), dk, 0, 0.3, 0); hem.rotation.x = Math.PI / 2;
    // 고양이 방울: 목줄 앞에 매달려 흔들린다
    const bp = new THREE.Group(); bp.position.set(0, 0.79, 0.2); bp.userData.gold = true; up.add(bp); parts.push(bp);
    const bm = (geo, mat, x, y, z) => { const m = mesh(geo, mat, x, y, z, bp); m.userData.gold = true; return m; };
    const strap = bm(new THREE.BoxGeometry(0.05, 0.13, 0.016), softM('#e3262b', '#a81216', 0.3), 0, -0.06, 0.1); strap.rotation.x = -0.55; // 목줄에서 내려오는 붉은 끈
    const bell = bm(new THREE.SphereGeometry(0.1, 22, 16), glowM('#ffd84a', 0.75, { metalness: 0.35, roughness: 0.25 }), 0, -0.2, 0.17);
    const ridge = bm(new THREE.TorusGeometry(0.101, 0.011, 8, 28), dk, 0, -0.2, 0.17); ridge.rotation.x = Math.PI / 2;
    bm(new THREE.BoxGeometry(0.016, 0.078, 0.02), black, 0, -0.25, 0.256);
    bm(new THREE.SphereGeometry(0.017, 8, 6), black, 0, -0.205, 0.268);
    // 가슴의 발바닥 무늬
    add(up, new THREE.SphereGeometry(0.04, 12, 10), pink, 0, 0.385, 0.283).scale.set(1.15, 0.95, 0.3);
    for (let k = -1; k <= 1; k++) add(up, new THREE.SphereGeometry(0.018, 10, 8), pink, k * 0.04, 0.448 - Math.abs(k) * 0.012, 0.29 - Math.abs(k) * 0.005).scale.z = 0.35;
    for (const a of u.arms || []) { const s = a.position.x > 0 ? 1 : -1; const sl = add(a, new THREE.CapsuleGeometry(0.081, 0.2, 8, 20), gold, 0.035 * s, -0.15, 0); sl.rotation.z = 0.32 * s; }
    anims.push((t, moving) => { const a = moving ? 0.34 : 0.06; bp.rotation.z = Math.sin(t * (moving ? 9 : 2.2)) * a; bp.rotation.x = Math.sin(t * (moving ? 7 : 1.7) + 1) * a * 0.5; bell.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.12; });
  }
  // 하의: 황금 반바지 (치마를 입고 있었다면 그 동안 감춘다)
  if (has('b')) {
    u.rig.traverse((o) => { if (o.userData.skirtPart && o.visible) { o.visible = false; hidden.push(o); } });
    const sh = add(u.rig, new THREE.SphereGeometry(0.27, 34, 20, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7), gold, 0, 0.186, 0); sh.scale.set(0.8, 0.56, 0.8);
    const belt = add(u.rig, new THREE.TorusGeometry(0.2, 0.024, 10, 34), dk, 0, 0.235, 0); belt.rotation.x = Math.PI / 2;
    for (const l of u.legs || []) { add(l, new THREE.CapsuleGeometry(0.104, 0.04, 8, 22), gold, 0, -0.062, 0); const cf = add(l, new THREE.TorusGeometry(0.1, 0.018, 8, 24), dk, 0, -0.1, 0); cf.rotation.x = Math.PI / 2; }
  }
  // 신발: 발가락 젤리가 달린 고양이 발 신발
  if (has('s')) for (const l of u.legs || []) {
    add(l, new THREE.SphereGeometry(0.11, 24, 16), gold, 0, -0.108, 0.036).scale.set(1.03, 0.67, 1.43);
    add(l, new THREE.CylinderGeometry(0.113, 0.117, 0.028, 26), dk, 0, -0.147, 0.036).scale.set(1.03, 1, 1.43);
    const an = add(l, new THREE.TorusGeometry(0.086, 0.022, 10, 26), dk, 0, -0.052, 0.0); an.rotation.x = Math.PI / 2;
    for (let k = -1; k <= 1; k++) add(l, new THREE.SphereGeometry(0.022, 10, 8), pink, k * 0.042, -0.086, 0.172 - Math.abs(k) * 0.016).scale.set(1, 0.7, 0.6);
  }
  // 꼬리: 살랑살랑 흔들린다
  if (has('l')) {
    const piv = new THREE.Group(); piv.position.set(0, 0.2, -0.15); u.rig.add(piv); piv.userData.gold = true; parts.push(piv);
    const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0, 0.03, -0.17], [0.01, 0.18, -0.3], [0.03, 0.38, -0.31], [0.05, 0.52, -0.22]].map((p) => new THREE.Vector3(...p)));
    const tube = mesh(new THREE.TubeGeometry(curve, 22, 0.042, 10, false), gold, 0, 0, 0, piv); tube.userData.gold = true;
    const tipM = mesh(new THREE.SphereGeometry(0.058, 14, 10), dk, 0.05, 0.52, -0.22, piv); tipM.userData.gold = true;
    const ring = mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 18), pink, 0, 0.02, -0.1, piv); ring.userData.gold = true;
    anims.push((t) => { piv.rotation.y = Math.sin(t * 2.2) * 0.38; piv.rotation.x = Math.sin(t * 1.3) * 0.08; });
  }
  return { parts, set, hidden, anim: (t, moving) => { for (const f of anims) f(t, moving); } };
}
function setGold(g, set) {
  const u = g.userData;
  if (u.gGold) { u.gGold.parts.forEach((m) => m.parent?.remove(m)); u.gGold.hidden.forEach((o) => { o.visible = true; }); u.gGold = null; }
  u.gGoldSet = set;
  if (set) u.gGold = goldParts(u, set);
}
/** 황금 고양이 지팡이: 고양이 머리 장식이 달린 황금 지팡이 (귀신 퇴치 무제한) */
export function buildStaff() {
  const g = new THREE.Group(); const gold = goldM(), dk = goldD();
  mesh(new THREE.CylinderGeometry(0.018, 0.024, 1.5, 10), dk, 0, 0.5, 0, g);
  mesh(new THREE.SphereGeometry(0.032, 10, 8), gold, 0, -0.26, 0, g);
  for (const y of [0.06, 0.6, 1.14]) { const r = mesh(new THREE.TorusGeometry(0.028, 0.011, 8, 16), gold, 0, y, 0, g); r.rotation.x = Math.PI / 2; }
  const head = new THREE.Group(); head.position.y = 1.34; head.scale.setScalar(1.25); g.add(head);
  mesh(new THREE.SphereGeometry(0.082, 18, 14), gold, 0, 0, 0, head).scale.set(1.08, 0.94, 0.95);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.036, 0.08, 10), gold, 0.05 * s, 0.085, 0, head); ear.rotation.z = -0.3 * s; ear.scale.z = 0.6;
    mesh(new THREE.SphereGeometry(0.017, 10, 8), glowM('#7dffb5', 1.6), 0.03 * s, 0.012, 0.072, head).scale.set(0.5, 1, 0.5);
  }
  mesh(new THREE.SphereGeometry(0.011, 8, 6), goldPink(), 0, -0.014, 0.08, head);
  const halo = mesh(new THREE.TorusGeometry(0.13, 0.009, 8, 30), glowM('#ffe27a', 1.0), 0, 0, -0.01, head);
  const gem = mesh(new THREE.OctahedronGeometry(0.028), glowM('#ff4d6d', 1.4), 0, -0.115, 0.01, head);
  const glow = glowSprite('#ffd766', 0.95, 0.5); glow.position.y = 1.34; g.add(glow);
  g.userData.anim = (t) => { glow.material.opacity = 0.38 + Math.sin(t * 3.5) * 0.16; halo.rotation.z = t * 1.2; halo.material.emissiveIntensity = 0.9 + Math.sin(t * 4) * 0.35; gem.rotation.y = t * 2; };
  return g;
}

function robotParts(u) {
  const parts = [];
  const metal = M('#dfe6f0', { metalness: 0.25, roughness: 0.35, emissive: '#4a5a70', emissiveIntensity: 0.25 }), dark = M('#5a6478', { metalness: 0.3, roughness: 0.45 }), blue = (i) => glowM('#4ad8ff', i);
  const add = (parent, geo, mat, x, y, z) => { const m = mesh(geo, mat, x, y, z, parent); m.userData.robot = true; parts.push(m); return m; };
  // 머리 (네모난 헬멧 + 눈 화면 + 안테나)
  add(u.head, new THREE.BoxGeometry(0.78, 0.66, 0.72), metal, 0, 0.02, 0);
  add(u.head, new THREE.BoxGeometry(0.62, 0.26, 0.04), dark, 0, 0.05, 0.37);
  const eyes = [-1, 1].map((s) => add(u.head, new THREE.BoxGeometry(0.14, 0.08, 0.03), blue(1.6), s * 0.15, 0.06, 0.39));
  add(u.head, new THREE.BoxGeometry(0.3, 0.05, 0.03), dark, 0, -0.17, 0.37);
  for (const s of [-1, 1]) add(u.head, new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), dark, s * 0.4, 0, 0).rotation.z = Math.PI / 2;
  add(u.head, new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), dark, 0, 0.45, 0);
  const tip = add(u.head, new THREE.SphereGeometry(0.05, 10, 8), glowM('#ff4a4a', 1.5), 0, 0.6, 0);
  // 몸통 (가슴 불빛 패널)
  add(u.rig, new THREE.BoxGeometry(0.5, 0.44, 0.38), metal, 0, 0.36, 0);
  add(u.rig, new THREE.BoxGeometry(0.28, 0.16, 0.02), dark, 0, 0.4, 0.2);
  const chest = [0, 1, 2].map((i) => add(u.rig, new THREE.SphereGeometry(0.022, 8, 6), glowM(['#ff4a4a', '#ffe066', '#4aff8a'][i], 1.4), -0.07 + i * 0.07, 0.4, 0.215));
  add(u.rig, new THREE.BoxGeometry(0.44, 0.1, 0.34), dark, 0, 0.12, 0);
  // 팔 · 다리 (관절에 붙여서 같이 움직인다)
  for (const a of u.arms || []) { const s = a.position.x > 0 ? 1 : -1; add(a, new THREE.BoxGeometry(0.17, 0.38, 0.17), metal, 0.05 * s, -0.17, 0); add(a, new THREE.SphereGeometry(0.11, 12, 8), dark, 0, 0, 0); add(a, new THREE.BoxGeometry(0.2, 0.14, 0.2), dark, 0.08 * s, -0.4, 0); }
  for (const l of u.legs || []) { add(l, new THREE.BoxGeometry(0.17, 0.14, 0.17), metal, 0, -0.06, 0); add(l, new THREE.BoxGeometry(0.22, 0.07, 0.3), dark, 0, -0.13, 0.04); }
  return { parts, anim: (t) => { const on = Math.sin(t * 3) > -0.6; eyes.forEach((e) => (e.material.emissiveIntensity = on ? 1.6 : 0.3)); tip.material.emissiveIntensity = 0.8 + Math.sin(t * 6) * 0.7; chest.forEach((c, i) => (c.material.emissiveIntensity = Math.sin(t * 4 + i * 2) > 0 ? 1.6 : 0.2)); } };
}
function setCostume(g, id) {
  const u = g.userData;
  if (u.gCostume) { u.gCostume.parts.forEach((m) => m.parent?.remove(m)); u.gCostume = null; }
  // 원래 몸(옷·얼굴·머리카락·장신구)을 숨기거나 되돌린다 — 상점 날개·탈것·검은 그대로
  const keep = new Set([u.gWings, u.gMount, u.gSword].filter(Boolean));
  const walk = (o) => { if (keep.has(o) || o.userData.gold) return; if (o.isMesh && !o.userData.robot) { if (id) { if (o.userData.vis0 == null) o.userData.vis0 = o.visible; o.visible = false; } else if (o.userData.vis0 != null) { o.visible = o.userData.vis0; delete o.userData.vis0; } } o.children.forEach(walk); };
  walk(u.rig);
  if (id === 'costume_robot') u.gCostume = robotParts(u);
  u.gCostumeId = id;
}
/** gear = "날개|탈것|타는중(1/0)|손에 든 것(0 없음 · 1 전설의 검 · 2 황금 고양이 지팡이)|코스튬|황금 고양이 부위 글자(hmgtbsl)" */
// ───── 손에 드는 간식: 팝콘(p) · STARMIA 커피(c). 뒤의 숫자는 남은 횟수(3·2·1) — 줄어들수록 덜 차 보인다
const _snackTex = {};
function snackTex(kind) {
  if (_snackTex[kind]) return _snackTex[kind];
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  if (kind === 'p') { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e8202a'; x.fillRect(i * 16, 0, 16, 64); } x.fillStyle = '#ffd23a'; x.font = '900 22px sans-serif'; x.textAlign = 'center'; x.fillText('POP', 64, 40); }
  else { x.fillStyle = '#fbf8f2'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#c99a62'; x.fillRect(0, 20, 128, 26); x.fillStyle = '#0f7a4a'; x.beginPath(); x.arc(64, 33, 15, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = '900 16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', 64, 34); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return (_snackTex[kind] = t);
}
export function buildSnack(code) {
  const kind = code[0], n = Number(code[1]) || 1, g = new THREE.Group();
  if (kind === 'p') {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.2, 18, 1, true), new THREE.MeshStandardMaterial({ map: snackTex('p'), roughness: 0.6, side: THREE.DoubleSide })); cup.position.y = 0.1; g.add(cup);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshStandardMaterial({ color: '#e8202a' })); bottom.rotation.x = Math.PI / 2; g.add(bottom);
    const pm = [new THREE.MeshStandardMaterial({ color: '#fff6dc', roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: '#ffe28a', roughness: 0.7 })];
    const geo = new THREE.IcosahedronGeometry(0.032, 0);
    const cnt = [0, 9, 17, 26][n], top = [0, 0.17, 0.2, 0.23][n];
    for (let i = 0; i < cnt; i++) { const a = i * 2.4, r = 0.075 * Math.sqrt((i % 9) / 9 + 0.1); const k = new THREE.Mesh(geo, pm[i % 2]); k.position.set(Math.cos(a) * r, top - (i % 9) * 0.004 + Math.floor(i / 9) * 0.02, Math.sin(a) * r); k.rotation.set(i, i * 2, 0); k.scale.setScalar(0.8 + (i % 3) * 0.2); g.add(k); }
  } else {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.047, 0.17, 18), [new THREE.MeshStandardMaterial({ map: snackTex('c'), roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: '#fbf8f2' }), new THREE.MeshStandardMaterial({ color: '#fbf8f2' })]); cup.position.y = 0.085; g.add(cup);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.022, 18), new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.4 })); lid.position.y = 0.18; g.add(lid);
    const sip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.02, 10), new THREE.MeshStandardMaterial({ color: '#f2efe8' })); sip.position.set(0.025, 0.198, 0); g.add(sip);
    // 김: 남은 양이 많을수록 진하게
    const steam = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1 * n, depthWrite: false })); steam.position.set(0.02, 0.29, 0); g.add(steam); g.userData.steam = steam;
  }
  g.userData.code = code; return g;
}
export function applyGear(g, gear = '') {
  const u = g.userData; if (!u.rig) return;
  if (u.gearStr === gear) return; u.gearStr = gear;
  const [w = '', m = '', riding = '0', sword = '0', costume = '', gold = '', snack = ''] = gear.split('|');
  const sn = /^[pc][123]$/.test(snack) ? snack : '';
  if ((u.gSnackCode || '') !== sn) { u.gSnack?.parent?.remove(u.gSnack); u.gSnack = null; u.gSnackCode = sn; const arm = u.arms?.[1]; if (sn && arm) { const it = buildSnack(sn); it.scale.setScalar(1.35); it.position.set(0.02 * Math.sign(arm.position.x || 1), -0.36, 0.09); u.gSnack = it; arm.add(it); } }
  if (u.gWingsId !== w) { if (u.gWings) u.rig.remove(u.gWings); u.gWings = w ? buildWings(w) : null; if (u.gWings) u.rig.add(u.gWings); u.gWingsId = w; }
  const mid = riding === '1' ? m : '';
  if (u.gMountId !== mid) { if (u.gMount) g.remove(u.gMount); u.gMount = mid ? buildMount(mid) : null; if (u.gMount) g.add(u.gMount); u.gMountId = mid; }
  const sw = sword === '1' || sword === '2' ? sword : '';
  if ((u.gSwordKind || '') !== sw) {
    if (u.gSword) u.gSword.parent?.remove(u.gSword);
    u.gSword = null; u.gSwordKind = sw;
    if (sw === '1' && u.arms?.[0]) { const s = buildSword(); s.position.set(-0.09, -0.33, 0.04); s.rotation.set(Math.PI / 2 - 0.25, 0, 0); s.scale.setScalar(1.25); u.arms[0].add(s); u.gSword = s; }
    if (sw === '2' && u.arms?.[0]) { const s = buildStaff(); s.position.set(-0.1, -0.33, 0.05); s.rotation.set(0.66, 0, 0.36); u.arms[0].add(s); u.gSword = s; } // 머리에 묻히지 않게 바깥으로 기울여 든다
  }
  // 로봇 코스튬은 온몸을 덮으므로 그 동안에는 황금 고양이 부위를 그리지 않는다 (코스튬을 벗으면 다시 보인다)
  const gset = costume ? '' : gold;
  if ((u.gCostumeId || '') !== costume) { if (u.gGold) setGold(g, ''); setCostume(g, costume); }
  if ((u.gGoldSet || '') !== gset) setGold(g, gset);
}
/** animateAvatar 다음에 부른다: 날개·탈것 움직임 + 탄 자세 + 검 휘두르기 + 간식 들기·먹기 */
export function animateGear(g, t, dt, moving) {
  const u = g.userData;
  try { animateSnack(u, t, dt, moving); } catch {}
  u.gWings?.userData.anim(t);
  u.gCostume?.anim(t);
  u.gGold?.anim(t, moving);
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
    else if (u.gSwordKind === '2' && !u.gMount) { u.arms[0].rotation.x = -0.5 + (moving ? Math.sin(t * 9) * 0.07 : 0); } // 지팡이: 걸을 때도 세워서 든다 (긴 지팡이가 땅을 휘젓지 않게)
    else if (!moving) { u.arms[0].rotation.x = -0.5; }
  }
}

/** 간식을 든 팔: 앞으로 들고 다니고(걷거나 앉아도 그대로), 먹을 때(eatT) 입으로 가져간다. 다른 동작이 정한 팔 자세를 덮어쓴다 */
const _rest = new THREE.Vector3(), _mouth = new THREE.Vector3(), _up = new THREE.Vector3();
function animateSnack(u, t, dt, moving) {
  if (!u.gSnack || !u.arms?.[1]) { u.eatT = 0; return; }
  const arm = u.arms[1], s = Math.sign(arm.position.x || 1);
  let k = 0; if (u.eatT > 0) { u.eatT = Math.max(0, u.eatT - dt); k = Math.sin(Math.PI * (1 - u.eatT / 0.9)); }
  arm.rotation.set(-0.85 - k * 0.9 + (moving && !k ? Math.sin(t * 9) * 0.05 : 0), 0, -s * (0.18 + k * 0.85));
  // 손에 든 컵은 세운 채로 (먹을 때만 입 쪽으로 기울인다)
  // 팔이 앞으로 들리면 손 앞(-y 쪽)으로 더 내밀어 큰 머리에 묻히지 않게 하고, 컵 윗부분만 입 쪽으로 살짝 기울인다
  u.gSnack.rotation.set(0.85 + k * 1.15, 0, s * (0.18 + k * 0.85)); // 팔이 안쪽으로 기운 만큼 되돌려 정면에서 똑바로 보이게
  _rest.set(0.02 * s, -0.36, 0.09);
  if (k > 0 && u.head && u.rig) {
    // 먹는 동안: 손에서 '입 바로 앞'(얼굴 가운데 아래쪽)으로 끌어온다 — 팔이 옆에 달려 있어서 팔만 돌리면 볼 쪽으로 가기 때문
    u.rig.updateMatrixWorld(true);
    u.head.localToWorld(_mouth.set(0, -0.2, 0.52)); arm.worldToLocal(_mouth);
    u.gSnack.position.lerpVectors(_rest, _mouth.addScaledVector(_up.set(0, 0, -1), 0.12), k);
  } else u.gSnack.position.copy(_rest);
  if (u.gSnack.userData.steam) { u.gSnack.userData.steam.position.y = 0.29 + Math.sin(t * 2) * 0.01; u.gSnack.userData.steam.rotation.y = t; }
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
export function swordFx(x, y, z, ry, hit, gold = false) {
  const arc = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.15, 32, 1, -0.9, 1.8), new THREE.MeshBasicMaterial({ color: gold ? '#ffd24a' : '#7fd8ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  arc.position.set(x, y + 0.75, z); arc.rotation.set(-Math.PI / 2, 0, -ry + Math.PI / 2);
  addFx(arc, 0.35, (o, t) => { o.material.opacity = 0.8 * (1 - t / 0.35); o.rotation.z += 0.18; });
  if (hit) {
    const n = 120; const pts = particles(n, gold ? ['#ffe27a', '#ffffff', '#ffb02e'] : ['#9ae8ff', '#ffffff', '#5ab8ff'], 0.22); const p = pts.geometry.attributes.position; const v = [];
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
