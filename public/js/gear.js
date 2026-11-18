import * as THREE from 'three';
import { createAvatar } from './avatar.js';

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
// 황금 마차 (최고 레벨) — 창문 달린 객실 · 둥근 지붕과 왕관 · 커다란 바퀴 넷 · 앞에서 끄는 백마 두 마리
let _crestTex = null;
function crestTex() { // 객실 옆판 그림: 진홍 옻칠 바탕에 금테 · 가운데 왕관 문장 · 모서리 넝쿨 무늬
  if (_crestTex) return _crestTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, 160); bg.addColorStop(0, '#9a0f22'); bg.addColorStop(0.5, '#c11a30'); bg.addColorStop(1, '#7a0a1a'); x.fillStyle = bg; x.fillRect(0, 0, 256, 160);
  x.strokeStyle = '#f7cf4a'; x.lineWidth = 7; x.strokeRect(6, 6, 244, 148); x.lineWidth = 2.5; x.strokeRect(17, 17, 222, 126);
  x.lineWidth = 3; for (const [cx, cy, sx, sy] of [[17, 17, 1, 1], [239, 17, -1, 1], [17, 143, 1, -1], [239, 143, -1, -1]]) { x.beginPath(); x.moveTo(cx, cy + 34 * sy); x.bezierCurveTo(cx + 4 * sx, cy + 8 * sy, cx + 26 * sx, cy + 26 * sy, cx + 18 * sx, cy + 12 * sy); x.moveTo(cx + 34 * sx, cy); x.bezierCurveTo(cx + 8 * sx, cy + 4 * sy, cx + 26 * sx, cy + 26 * sy, cx + 12 * sx, cy + 18 * sy); x.stroke(); }
  const g = x.createLinearGradient(0, 40, 0, 130); g.addColorStop(0, '#fff0a0'); g.addColorStop(1, '#d9a21c'); x.fillStyle = g;
  x.beginPath(); x.moveTo(104, 62); x.lineTo(152, 62); x.lineTo(152, 96); x.quadraticCurveTo(152, 124, 128, 134); x.quadraticCurveTo(104, 124, 104, 96); x.closePath(); x.fill(); // 방패
  x.fillStyle = '#9a0f22'; x.beginPath(); x.arc(128, 96, 13, 0, Math.PI * 2); x.fill(); x.fillStyle = g; x.font = '900 20px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('M', 128, 97);
  x.fillStyle = g; x.beginPath(); x.moveTo(106, 58); x.lineTo(108, 34); x.lineTo(117, 46); x.lineTo(128, 28); x.lineTo(139, 46); x.lineTo(148, 34); x.lineTo(150, 58); x.closePath(); x.fill(); // 왕관
  for (const [px, py] of [[108, 32], [128, 26], [148, 32]]) { x.fillStyle = '#ff4a6a'; x.beginPath(); x.arc(px, py, 4, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = '#f7cf4a'; x.lineWidth = 3; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(128 + s * 30, 80); x.bezierCurveTo(128 + s * 62, 60, 128 + s * 80, 104, 128 + s * 50, 112); x.bezierCurveTo(128 + s * 70, 96, 128 + s * 54, 80, 128 + s * 38, 96); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return (_crestTex = t);
}
function coachHorse(gold) {
  const h = new THREE.Group();
  const coat = M('#fbfaf6', { roughness: 0.42, emissive: '#fff8ec', emissiveIntensity: 0.12 }), mane = M('#eef0f6', { roughness: 0.5, emissive: '#dfe6ff', emissiveIntensity: 0.15 }), hoof = M('#3a3028'), red = M('#c11a30', { roughness: 0.5 }), white = M('#ffffff', { roughness: 0.7 });
  const body = mesh(new THREE.CapsuleGeometry(0.21, 0.56, 10, 18), coat, 0, 0.82, 0, h); body.rotation.x = Math.PI / 2;
  const neck = mesh(new THREE.CapsuleGeometry(0.12, 0.34, 8, 14), coat, 0, 1.08, 0.38, h); neck.rotation.x = -0.62;
  const head = new THREE.Group(); head.position.set(0, 1.28, 0.56); h.add(head);
  const skull = mesh(new THREE.CapsuleGeometry(0.095, 0.22, 8, 14), coat, 0, -0.04, 0.06, head); skull.rotation.x = 1.15;
  for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.022, 8, 6), M('#14100c'), 0.085 * s, 0.03, 0.06, head); const ear = mesh(new THREE.ConeGeometry(0.035, 0.1, 8), coat, 0.055 * s, 0.13, -0.04, head); ear.rotation.z = -0.15 * s; }
  // 굴레 · 이마의 깃털 장식
  const strap = mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 20), gold, 0, -0.02, 0.06, head); strap.rotation.set(0.42, 0, 0);
  mesh(new THREE.SphereGeometry(0.03, 10, 8), gold, 0, 0.12, 0.02, head);
  const plume = new THREE.Group(); plume.position.set(0, 0.14, 0.0); head.add(plume);
  [[white, 0], [red, 0.25], [red, -0.25]].forEach(([c, a]) => { const f = mesh(new THREE.SphereGeometry(0.05, 10, 8), c, Math.sin(a) * 0.05, 0.13, -0.02, plume); f.scale.set(0.6, 2.4, 0.6); f.rotation.z = -a; });
  // 갈기 · 꼬리
  const manes = []; for (let i = 0; i < 6; i++) { const m = mesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), mane, 0, 1.22 - i * 0.065, 0.42 - i * 0.07, h); m.rotation.x = -0.5; manes.push(m); }
  const tail = new THREE.Group(); tail.position.set(0, 0.92, -0.46); h.add(tail); const tl = mesh(new THREE.CapsuleGeometry(0.05, 0.34, 4, 10), mane, 0, -0.17, -0.06, tail); tl.rotation.x = 0.5;
  // 마구: 금빛 목걸이 · 붉은 배띠 · 등 안장
  const col = mesh(new THREE.TorusGeometry(0.15, 0.04, 10, 22), gold, 0, 0.98, 0.3, h); col.rotation.x = Math.PI / 2 - 0.62;
  mesh(new THREE.TorusGeometry(0.225, 0.022, 8, 26), red, 0, 0.82, -0.02, h);
  mesh(new THREE.BoxGeometry(0.2, 0.06, 0.18), red, 0, 1.03, -0.02, h); mesh(new THREE.SphereGeometry(0.03, 8, 6), gold, 0, 1.07, -0.02, h);
  const legs = [];
  for (const [x, z] of [[-0.12, 0.27], [0.12, 0.27], [-0.12, -0.27], [0.12, -0.27]]) { const piv = new THREE.Group(); piv.position.set(x, 0.72, z); h.add(piv); mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.62, 8), coat, 0, -0.31, 0, piv); mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.08, 8), hoof, 0, -0.66, 0, piv); legs.push(piv); }
  h.userData.anim = (t, moving, ph) => {
    const sp = moving ? 13 : 0, k = moving ? 0.62 : 0;
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * sp + ph + (i === 0 || i === 3 ? 0 : Math.PI)) * k));
    h.position.y = moving ? Math.abs(Math.sin(t * 13 + ph)) * 0.05 : 0;
    head.rotation.x = moving ? Math.sin(t * 13 + ph) * 0.08 : Math.sin(t * 1.1 + ph) * 0.06;
    tail.rotation.z = Math.sin(t * 2.4 + ph) * 0.25; plume.rotation.z = Math.sin(t * 5 + ph) * 0.12;
    manes.forEach((m, i) => (m.rotation.z = Math.sin(t * 4 + i + ph) * 0.1));
  };
  return h;
}
function carriage() {
  const g = new THREE.Group();
  const gold = M('#f2c440', { metalness: 0.9, roughness: 0.22, emissive: '#8a6010', emissiveIntensity: 0.35 });
  const goldD = M('#c9952a', { metalness: 0.85, roughness: 0.3, emissive: '#5a3a08', emissiveIntensity: 0.3 });
  const velvet = M('#9a1028', { roughness: 0.85, emissive: '#3a0410', emissiveIntensity: 0.25 });
  const lacq = M('#b0142a', { roughness: 0.3, metalness: 0.2, emissive: '#4a0410', emissiveIntensity: 0.25 });
  const panel = new THREE.MeshStandardMaterial({ map: crestTex(), roughness: 0.35, metalness: 0.15, emissive: '#ffffff', emissiveMap: crestTex(), emissiveIntensity: 0.18 });
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const tire = M('#2a2018', { roughness: 0.8 });
  // ── 객실 (흔들리는 상자)
  const cab = new THREE.Group(); g.add(cab);
  const W = 0.68, Z0 = -0.58, Z1 = 0.6, FL = 0.56, BELT = 1.16, TOP = 2.12; // 반폭 · 앞뒤 · 바닥 · 창 아래 · 지붕 밑
  const zc = (Z0 + Z1) / 2, D = Z1 - Z0;
  mesh(new THREE.BoxGeometry(W * 2 + 0.06, 0.1, D + 0.08), goldD, 0, FL, zc, cab); // 바닥판
  const belly = mesh(new THREE.CylinderGeometry(W + 0.02, W + 0.02, D, 26, 1, false, Math.PI / 2, Math.PI), lacq, 0, FL - 0.02, zc, cab); belly.rotation.x = Math.PI / 2; belly.scale.set(1, 1, 0.32); // 둥근 배
  // 아랫벽: 양옆은 문장 그림, 앞뒤는 진홍 옻칠
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.06, BELT - FL, D), lacq, s * W, (FL + BELT) / 2, zc, cab);
    const dec = mesh(new THREE.PlaneGeometry(D - 0.12, BELT - FL - 0.1), panel, s * (W + 0.032), (FL + BELT) / 2, zc, cab); dec.rotation.y = s * Math.PI / 2;
  }
  mesh(new THREE.BoxGeometry(W * 2, BELT - FL, 0.06), lacq, 0, (FL + BELT) / 2, Z1, cab);
  mesh(new THREE.BoxGeometry(W * 2, BELT - FL, 0.06), lacq, 0, (FL + BELT) / 2, Z0, cab);
  // 금테 몰딩 (바닥 · 창 아래 · 지붕 밑)
  for (const y of [BELT, FL + 0.06, TOP]) for (const [sx, sz, px, pz] of [[0.09, D + 0.1, -W, zc], [0.09, D + 0.1, W, zc], [W * 2 + 0.1, 0.09, 0, Z1], [W * 2 + 0.1, 0.09, 0, Z0]]) mesh(new THREE.BoxGeometry(sx, 0.06, sz), gold, px, y, pz, cab);
  // 네 모서리 금빛 기둥 (고리 장식)
  for (const x of [-W, W]) for (const z of [Z0, Z1]) { mesh(new THREE.CylinderGeometry(0.045, 0.05, TOP - BELT, 10), gold, x, (TOP + BELT) / 2, z, cab); for (let k = 1; k < 5; k++) { const r = mesh(new THREE.TorusGeometry(0.052, 0.014, 6, 14), goldD, x, BELT + k * (TOP - BELT) / 5, z, cab); r.rotation.x = Math.PI / 2; } }
  // 창: 옆창 둘 · 뒤창 하나 (아치 모양 금테 + 옅은 유리 + 묶어 둔 커튼). 앞은 탁 트여 있다
  const arch = (w, h) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, h - w / 2); sh.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); sh.lineTo(w / 2, 0); sh.closePath(); return sh; };
  const winH = TOP - BELT - 0.12;
  const archTube = (w, closed) => { const pts = arch(w, winH).getPoints(30); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)), closed), 60, 0.024, 6, closed); };
  const winFrame = (w, px, pz, ry) => {
    const fr = new THREE.Group(); fr.position.set(px, BELT + 0.06, pz); fr.rotation.y = ry; cab.add(fr);
    mesh(new THREE.ShapeGeometry(arch(w, winH), 20), glass, 0, 0, 0, fr).castShadow = false;
    mesh(archTube(w, true), gold, 0, 0, 0, fr);
    for (const s of [-1, 1]) { const cu = mesh(new THREE.CapsuleGeometry(0.05, winH * 0.55, 4, 8), velvet, s * (w / 2 - 0.05), winH * 0.42, -0.02, fr); cu.scale.z = 0.5; const tie = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12), gold, s * (w / 2 - 0.05), winH * 0.3, -0.02, fr); tie.rotation.x = Math.PI / 2; }
  };
  for (const s of [-1, 1]) winFrame(D - 0.2, s * W, zc, s * Math.PI / 2);
  winFrame(W * 2 - 0.2, 0, Z0, Math.PI);
  mesh(archTube(W * 2 - 0.16, false), gold, 0, BELT + 0.06, Z1, cab); // 앞쪽 아치 (유리 없이 금테만)
  // 안쪽: 붉은 벨벳 의자와 등받이(금 단추)
  mesh(new THREE.BoxGeometry(W * 2 - 0.1, 0.16, 0.5), velvet, 0, 0.78, -0.22, cab);
  mesh(new THREE.BoxGeometry(W * 2 - 0.1, 0.8, 0.1), velvet, 0, 1.18, Z0 + 0.08, cab);
  for (let i = -2; i <= 2; i++) for (let j = 0; j < 2; j++) mesh(new THREE.SphereGeometry(0.018, 6, 5), gold, i * 0.2, 1.0 + j * 0.26, Z0 + 0.135, cab);
  // ── 둥근 지붕 + 처마 술 장식 + 모서리 꼭지 + 왕관
  mesh(new THREE.BoxGeometry(W * 2 + 0.18, 0.09, D + 0.18), gold, 0, TOP + 0.06, zc, cab);
  const dome = mesh(new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, 0, Math.PI / 2), lacq, 0, TOP + 0.1, zc, cab); dome.scale.set(W + 0.04, 0.34, D / 2 + 0.04);
  for (let i = 0; i < 4; i++) { const rib = mesh(new THREE.TorusGeometry(1, 0.012, 5, 30, Math.PI), gold, 0, TOP + 0.1, zc, cab); rib.rotation.y = (i / 4) * Math.PI; rib.scale.set(i % 2 ? D / 2 + 0.045 : W + 0.045, 0.345, 1); }
  for (const [nx, len] of [[1, D], [0, W * 2]]) for (const s of [-1, 1]) { const n = Math.round(len / 0.12); for (let i = 0; i < n; i++) { const off = -len / 2 + (i + 0.5) * (len / n); mesh(new THREE.SphereGeometry(0.035, 8, 6), goldD, nx ? s * (W + 0.09) : off, TOP - 0.01, nx ? zc + off : zc + s * (D / 2 + 0.09), cab).scale.y = 1.4; } }
  for (const x of [-W - 0.04, W + 0.04]) for (const z of [Z0 - 0.04, Z1 + 0.04]) { mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), gold, x, TOP + 0.16, z, cab); mesh(new THREE.SphereGeometry(0.055, 12, 10), gold, x, TOP + 0.26, z, cab); mesh(new THREE.ConeGeometry(0.03, 0.1, 8), gold, x, TOP + 0.35, z, cab); }
  const crown = new THREE.Group(); crown.position.set(0, TOP + 0.46, zc); cab.add(crown);
  mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 18, 1, true), M('#f2c440', { metalness: 0.9, roughness: 0.22, emissive: '#8a6010', emissiveIntensity: 0.35, side: THREE.DoubleSide }), 0, 0, 0, crown);
  mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), velvet, 0, 0.02, 0, crown);
  const GEM = ['#ff2a5a', '#3ac8ff', '#5aff8a'];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mesh(new THREE.ConeGeometry(0.045, 0.16, 6), gold, Math.cos(a) * 0.2, 0.15, Math.sin(a) * 0.2, crown); mesh(new THREE.SphereGeometry(0.024, 8, 6), glowM('#fff2c0', 1.0), Math.cos(a) * 0.2, 0.24, Math.sin(a) * 0.2, crown); mesh(new THREE.OctahedronGeometry(0.03), glowM(GEM[i % 3], 1.3), Math.cos(a) * 0.235, 0.0, Math.sin(a) * 0.235, crown); }
  mesh(new THREE.SphereGeometry(0.05, 12, 10), gold, 0, 0.2, 0, crown);
  mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), gold, 0, 0.3, 0, crown); mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), gold, 0, 0.32, 0, crown);
  const cGlow = glowSprite('#ffe08a', 0.9, 0.5); cGlow.position.y = 0.12; crown.add(cGlow);
  // 앞 모서리 등불
  const lamps = [];
  for (const s of [-1, 1]) { const L = new THREE.Group(); L.position.set(s * (W + 0.12), BELT + 0.18, Z1 + 0.02); cab.add(L); mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 4), gold, -s * 0.06, -0.06, 0, L).rotation.z = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.14, 6), glowM('#ffd88a', 1.1, { transparent: true, opacity: 0.85 }), 0, 0, 0, L); mesh(new THREE.ConeGeometry(0.07, 0.08, 6), gold, 0, 0.11, 0, L); mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.03, 6), gold, 0, -0.08, 0, L); const lg = glowSprite('#ffcf6a', 0.55, 0.65); L.add(lg); lamps.push(lg); }
  // 문의 금 손잡이 · 발판
  for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.03, 8, 6), gold, s * (W + 0.05), BELT - 0.1, Z1 - 0.18, cab); mesh(new THREE.BoxGeometry(0.16, 0.025, 0.3), goldD, s * (W + 0.1), FL - 0.16, zc + 0.1, cab); }
  // ── 차대: 축 · 받침대 · C자 용수철 · 끌채 · 멍에
  const RW = 0.58, FW = 0.44, WX = W + 0.2, ZR = Z0 + 0.06, ZF = Z1 + 0.02;
  mesh(new THREE.BoxGeometry(0.1, 0.07, ZF - ZR + 0.4), goldD, 0, 0.42, zc, g);
  for (const [z, r] of [[ZR, RW], [ZF, FW]]) { mesh(new THREE.CylinderGeometry(0.035, 0.035, WX * 2 + 0.1, 8), goldD, 0, r, z, g).rotation.z = Math.PI / 2; for (const s of [-1, 1]) { const sp = mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 14, Math.PI * 1.3), gold, s * (W - 0.12), (r + FL) / 2 - 0.04, z, g); sp.rotation.y = Math.PI / 2; } }
  const pole = mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.2, 8), goldD, 0, 0.5, ZF + 0.62, g); pole.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), goldD, 0, 0.55, ZF + 0.72, g).rotation.z = Math.PI / 2;
  // ── 바퀴 넷 (뒤가 더 크다): 검은 테 · 금 테 · 바퀴살 12 · 금빛 바퀴통과 붉은 보석
  const wheels = [];
  for (const [z, r] of [[ZR, RW], [ZF, FW]]) for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(s * WX, r, z); g.add(w); w.userData.r = r;
    mesh(new THREE.TorusGeometry(r, 0.04, 8, 36), tire, 0, 0, 0, w).rotation.y = Math.PI / 2;
    mesh(new THREE.TorusGeometry(r - 0.05, 0.025, 8, 36), gold, 0, 0, 0, w).rotation.y = Math.PI / 2;
    for (let k = 0; k < 12; k++) mesh(new THREE.CylinderGeometry(0.013, 0.018, r * 2 - 0.08, 6), gold, 0, 0, 0, w).rotation.x = (k / 12) * Math.PI;
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 14), gold, s * 0.02, 0, 0, w).rotation.z = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.05, 10, 8), glowM('#ff2a5a', 1.1), s * 0.1, 0, 0, w);
    wheels.push(w);
  }
  // ── 백마 두 마리 + 금빛 고삐
  const horses = [-1, 1].map((s) => { const h = coachHorse(gold); h.position.set(s * 0.36, 0, ZF + 1.28); g.add(h); return h; });
  const reinM = new THREE.LineBasicMaterial({ color: '#f2c440' });
  for (const s of [-1, 1]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(s * 0.36, 1.2, ZF + 1.74), new THREE.Vector3(s * 0.3, 0.98, ZF + 0.6), new THREE.Vector3(s * 0.16, 1.02, 0.36)]), reinM));
  const glow = glowSprite('#ffe08a', 3.2, 0.3); glow.position.set(0, 1.3, 0.3); g.add(glow);
  const sparks = []; for (let i = 0; i < 14; i++) { const sp = glowSprite('#ffe9a8', 0.12, 0.9); g.add(sp); sparks.push(sp); }
  g.userData.seat = 0.72;
  g.userData.anim = (t, moving) => {
    g.position.y = 0; // 점프 높이가 매 프레임 쌓이지 않게 바닥으로 되돌린다
    wheels.forEach((w) => { if (moving) w.rotation.x = (-t * 2.6) / w.userData.r; });
    cab.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.025 : 0; cab.rotation.z = Math.sin(t * (moving ? 4.5 : 1.2)) * (moving ? 0.018 : 0.008);
    horses.forEach((h, i) => h.userData.anim(t, moving, i * 0.9));
    crown.rotation.y = t * 0.6; cGlow.material.opacity = 0.4 + Math.sin(t * 2.5) * 0.15; glow.material.opacity = 0.24 + Math.sin(t * 2) * 0.08;
    lamps.forEach((l, i) => (l.material.opacity = 0.55 + Math.sin(t * 7 + i * 2) * 0.12));
    sparks.forEach((s, i) => { const a = t * 1.1 + i * 0.45; s.position.set(Math.cos(a) * 1.1, 0.4 + ((t * 0.35 + i * 0.07) % 1) * 2.2, 0.3 + Math.sin(a) * 1.5); s.material.opacity = 0.35 + Math.sin(t * 5 + i) * 0.35; });
  };
  return g;
}
// 대왕 늑대 · 대왕 사자 (대왕 고양이와 같은 뼈대 — 늑대는 가끔 하늘 보고 우우~ · 사자는 갈기를 흔들며 어흥)
function bigBeast(kind) {
  const wolf = kind === 'wolf';
  const g = new THREE.Group();
  const fur = M(wolf ? '#7d8592' : '#d9a441', { roughness: 0.85 }), fur2 = M(wolf ? '#4a505c' : '#b07a28', { roughness: 0.85 }), belly = M(wolf ? '#e6e8ee' : '#f2d9a0', { roughness: 0.85 }), dark = M('#1e1618');
  const body = new THREE.Group(); body.position.y = 0.95; g.add(body);
  const torso = mesh(new THREE.SphereGeometry(0.5, 24, 16), fur, 0, 0, 0, body); torso.scale.set(0.9, 0.85, 1.5);
  mesh(new THREE.SphereGeometry(0.4, 18, 12), belly, 0, -0.14, 0.12, body).scale.set(0.78, 0.7, 1.3);
  if (wolf) mesh(new THREE.SphereGeometry(0.42, 18, 12), fur2, 0, 0.16, -0.1, body).scale.set(0.85, 0.55, 1.35); // 등의 짙은 털
  const head = new THREE.Group(); head.position.set(0, 0.42, 0.74); body.add(head);
  mesh(new THREE.SphereGeometry(0.36, 22, 16), fur, 0, 0, 0, head).scale.set(1.05, 0.95, 1);
  // 주둥이: 늑대는 길쭉하게 · 사자는 넓적하게
  const snout = mesh(new THREE.SphereGeometry(0.2, 16, 12), belly, 0, -0.1, 0.32, head); snout.scale.set(wolf ? 0.85 : 1.2, wolf ? 0.7 : 0.85, wolf ? 1.6 : 1.0);
  mesh(new THREE.SphereGeometry(0.065, 10, 8), dark, 0, wolf ? -0.04 : -0.02, wolf ? 0.62 : 0.5, head).scale.set(1.3, 0.9, 1);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.2, 0.2); head.add(jaw);
  mesh(new THREE.BoxGeometry(wolf ? 0.2 : 0.26, 0.05, wolf ? 0.36 : 0.26), belly, 0, 0, wolf ? 0.2 : 0.14, jaw);
  mesh(new THREE.BoxGeometry(0.12, 0.02, 0.16), M('#ff6a8a'), 0, 0.03, wolf ? 0.16 : 0.1, jaw);
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.07, 14, 10), M(wolf ? '#ffd23a' : '#c87a1a', { emissive: wolf ? '#c08a00' : '#5a3000', emissiveIntensity: wolf ? 0.9 : 0.4, roughness: 0.2 }), s * 0.15, 0.1, 0.28, head).scale.set(1, 0.85, 0.7);
    mesh(new THREE.SphereGeometry(0.03, 8, 6), dark, s * 0.155, 0.1, 0.33, head);
    mesh(new THREE.SphereGeometry(0.018, 8, 6), M('#ffffff'), s * 0.17, 0.13, 0.34, head);
    mesh(new THREE.CylinderGeometry(0.018, 0.02, wolf ? 0.08 : 0.06, 6), M('#fffaf0'), s * 0.06, -0.26, wolf ? 0.6 : 0.46, head).rotation.x = 0.1; // 송곳니
    if (wolf) { const ear = mesh(new THREE.ConeGeometry(0.11, 0.3, 4), fur2, s * 0.2, 0.36, -0.04, head); ear.rotation.z = -s * 0.22; mesh(new THREE.ConeGeometry(0.06, 0.18, 4), M('#d8b0b8'), s * 0.195, 0.34, 0.0, head).rotation.z = -s * 0.22; }
    else { mesh(new THREE.SphereGeometry(0.09, 12, 8), fur2, s * 0.26, 0.28, -0.04, head).scale.set(1, 1, 0.6); }
  }
  let mane = null;
  if (!wolf) { // 사자 갈기: 머리를 두르는 털 뭉치 두 겹
    mane = new THREE.Group(); mane.position.set(0, 0, -0.06); head.add(mane);
    const mm = M('#8a4a1a', { roughness: 0.95 }), mm2 = M('#a85e22', { roughness: 0.95 });
    for (let ring = 0; ring < 2; ring++) {
      const n = ring ? 16 : 12, r = ring ? 0.44 : 0.36;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + ring * 0.2; mesh(new THREE.SphereGeometry(ring ? 0.15 : 0.17, 10, 8), ring ? mm : mm2, Math.cos(a) * r, Math.sin(a) * r * 0.95, -ring * 0.08, mane).scale.set(1, 1, 0.8); }
    }
    mesh(new THREE.SphereGeometry(0.3, 14, 10), mm, 0, -0.32, -0.25, body).scale.set(1.1, 1, 0.9); // 가슴 털
  } else { // 늑대 목털
    for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; const tuft = mesh(new THREE.ConeGeometry(0.09, 0.22, 6), belly, Math.sin(a) * 0.3, -0.24 + Math.cos(a) * 0.04, 0.5, body); tuft.rotation.set(Math.PI * 0.9, 0, a * 0.4); }
  }
  const legs = [];
  for (const [x, z] of [[-0.28, 0.48], [0.28, 0.48], [-0.28, -0.48], [0.28, -0.48]]) { const piv = new THREE.Group(); piv.position.set(x, 0.75, z); g.add(piv); mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.66, 12), fur, 0, -0.35, 0, piv); mesh(new THREE.SphereGeometry(0.14, 12, 8), wolf ? fur2 : belly, 0, -0.7, 0.04, piv).scale.set(1, 0.6, 1.25); legs.push(piv); }
  const tail = new THREE.Group(); tail.position.set(0, 0.15, -0.72); body.add(tail);
  if (wolf) { const tt = mesh(new THREE.SphereGeometry(0.15, 12, 10), fur, 0, -0.12, -0.3, tail); tt.scale.set(0.9, 0.9, 2.6); tt.rotation.x = 0.6; mesh(new THREE.SphereGeometry(0.09, 10, 8), belly, 0, -0.32, -0.6, tail); }
  else { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.2, -0.3), new THREE.Vector3(0, -0.1, -0.6), new THREE.Vector3(0, 0.1, -0.75)]); mesh(new THREE.TubeGeometry(c, 14, 0.04, 6), fur, 0, 0, 0, tail); mesh(new THREE.SphereGeometry(0.1, 10, 8), M('#8a4a1a', { roughness: 0.95 }), 0, 0.12, -0.78, tail); }
  mesh(new THREE.BoxGeometry(0.5, 0.06, 0.44), M(wolf ? '#2a3a5a' : '#8a1a2a', { emissive: wolf ? '#4a7aff' : '#ff4a3a', emissiveIntensity: 0.3 }), 0, 0.42, -0.02, body); // 안장
  g.userData.seat = 1.4;
  g.userData.anim = (t, moving) => {
    const sp = moving ? (wolf ? 11 : 9) : 0, k = moving ? 0.6 : 0;
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * sp + (i === 0 || i === 3 ? 0 : Math.PI)) * k));
    g.position.y = moving ? Math.abs(Math.sin(t * sp)) * 0.08 : Math.sin(t * 1.4) * 0.01;
    torso.scale.y = 0.85 + Math.sin(t * 2) * 0.012;
    // 가끔: 늑대는 고개를 젖혀 우우~ · 사자는 입을 벌려 어흥 하며 갈기를 턴다
    const ph = t % (wolf ? 11 : 9), w = wolf ? 2.4 : 1.4, start = (wolf ? 11 : 9) - w;
    const act = ph > start ? Math.sin(((ph - start) / w) * Math.PI) : 0;
    if (wolf) { head.rotation.x = -act * 0.9 + Math.sin(t * 0.9) * 0.04; jaw.rotation.x = 0.05 + act * 0.35; tail.rotation.y = Math.sin(t * (moving ? 6 : 1.6)) * 0.25; }
    else { head.rotation.x = -act * 0.25; jaw.rotation.x = 0.05 + act * 0.6; head.rotation.z = act * Math.sin(t * 18) * 0.12; mane.scale.setScalar(1 + act * 0.08); tail.rotation.x = Math.sin(t * 1.5) * 0.25; tail.rotation.y = Math.sin(t * 1.1) * 0.3; }
    head.rotation.y = Math.sin(t * 0.7) * 0.12;
  };
  return g;
}
// 엉금엉금 거북이: 낮고 넓은 등딱지 위에 탄다 (느릿느릿해 보이지만 이동 속도 2배!)
function turtle() {
  const g = new THREE.Group();
  const skin = M('#8cc46a', { roughness: 0.7 }), shellM = M('#3e7d3a', { roughness: 0.5 }), plateM = M('#6aa64a', { roughness: 0.45, emissive: '#2a5a1a', emissiveIntensity: 0.15 }), rimM = M('#c9b46a', { roughness: 0.6 }), dark = M('#1a1612');
  const body = new THREE.Group(); g.add(body);
  const shell = mesh(new THREE.SphereGeometry(0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), shellM, 0, 0.3, 0, body); shell.scale.set(1, 0.62, 1.2);
  // 등딱지 무늬: 가운데 하나 + 둘레에 여섯 (볼록한 육각 판)
  const plates = [[0, 0]]; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; plates.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5]); }
  for (const [px, pz] of plates) {
    const r = Math.hypot(px / 0.72, pz / 0.72), y = 0.3 + 0.72 * 0.62 * Math.sqrt(Math.max(0, 1 - r * r)) - 0.02;
    const p = mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.05, 6), plateM, px, y, pz * 1.2, body);
    const n = new THREE.Vector3(px / 0.72, 0.62 * Math.sqrt(Math.max(0, 1 - r * r)) * 1.6, pz / 0.72).normalize(); p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  }
  const rim = mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 40), rimM, 0, 0.3, 0, body); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.2, 1);
  mesh(new THREE.CylinderGeometry(0.7, 0.66, 0.12, 32), rimM, 0, 0.26, 0, body).scale.set(1, 1, 1.2); // 배딱지
  const head = new THREE.Group(); head.position.set(0, 0.36, 0.86); body.add(head);
  mesh(new THREE.CapsuleGeometry(0.12, 0.2, 8, 12), skin, 0, -0.04, -0.12, head).rotation.x = Math.PI / 2 - 0.4; // 목
  mesh(new THREE.SphereGeometry(0.2, 18, 14), skin, 0, 0.06, 0.08, head).scale.set(1, 0.9, 1.15);
  for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.05, 12, 10), dark, s * 0.11, 0.12, 0.24, head); mesh(new THREE.SphereGeometry(0.018, 8, 6), M('#ffffff'), s * 0.12, 0.14, 0.28, head); mesh(new THREE.SphereGeometry(0.04, 10, 8), M('#ff9ab0', { roughness: 0.9 }), s * 0.14, 0.0, 0.22, head).scale.set(1, 0.6, 0.5); }
  const smile = mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16, Math.PI), dark, 0, 0.02, 0.3, head); smile.rotation.z = Math.PI;
  const legs = [];
  for (const [x, z] of [[-0.56, 0.5], [0.56, 0.5], [-0.56, -0.52], [0.56, -0.52]]) { const piv = new THREE.Group(); piv.position.set(x, 0.28, z); g.add(piv); const lg = mesh(new THREE.CapsuleGeometry(0.1, 0.14, 6, 10), skin, Math.sign(x) * 0.06, -0.12, 0, piv); lg.scale.set(1.2, 1, 1.4); mesh(new THREE.SphereGeometry(0.11, 10, 8), skin, Math.sign(x) * 0.08, -0.24, 0.04, piv).scale.set(1.3, 0.5, 1.5); legs.push(piv); }
  const tail = mesh(new THREE.ConeGeometry(0.06, 0.18, 8), skin, 0, 0.28, -0.92, body); tail.rotation.x = -Math.PI / 2 - 0.2;
  mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.06, 20), M('#c04a2a', { emissive: '#ff6a3a', emissiveIntensity: 0.25 }), 0, 0.76, -0.02, body).scale.set(1, 1, 1.15); // 등 위 방석
  g.userData.seat = 0.82;
  g.userData.anim = (t, moving) => {
    const sp = moving ? 7 : 0, k = moving ? 0.5 : 0;
    legs.forEach((l, i) => { const ph = t * sp + (i === 0 || i === 3 ? 0 : Math.PI); l.rotation.x = Math.sin(ph) * k; l.rotation.z = (i % 2 ? -1 : 1) * Math.max(0, Math.cos(ph)) * k * 0.4; });
    g.position.y = moving ? Math.abs(Math.sin(t * sp)) * 0.035 : 0;
    body.rotation.z = moving ? Math.sin(t * sp) * 0.035 : 0;
    head.position.z = 0.86 + (moving ? 0.04 : Math.sin(t * 0.8) * 0.05); head.rotation.y = Math.sin(t * 0.6) * 0.25; head.rotation.x = moving ? -0.12 : Math.sin(t * 1.1) * 0.06;
    tail.rotation.y = Math.sin(t * 3) * 0.3;
  };
  return g;
}
// 엎드려 기어가는 사람: 네 발로 엉금엉금 기는 친구 등에 올라탄다 (캐릭터 모양 그대로 · 조금 크게)
function crawler() {
  const g = new THREE.Group();
  const av = createAvatar({ body: '#ffd6a5', accent: '#6ab0ff', ears: 'none', eyes: 'big', mouth: 'open', cheeks: 'blush', hair: 'short', hairColor: '#3a2a1e', outfit: 'sailor' }, { legColor: '#131a30' });
  const u = av.userData; if (u.blob) av.remove(u.blob);
  const S = 1.65; av.scale.setScalar(S); av.position.z = -0.62; g.add(av);
  const rig = u.rig; rig.rotation.x = Math.PI / 2; // 앞으로 엎드린다 (머리가 앞 · 등이 위)
  // 치마 끝 안쪽을 막아 기어갈 때도 뒤쪽에서 몸 안쪽이 드러나지 않게 한다.
  const skirtLining = mesh(new THREE.CircleGeometry(0.39, 32),
    new THREE.MeshBasicMaterial({ color: '#101424', side: THREE.DoubleSide }), 0, 0.229, 0, rig);
  skirtLining.rotation.x = Math.PI / 2;
  skirtLining.castShadow = false;
  u.torso.scale.y = 0.65;
  u.torso.position.y = 0.65;
  const base = 0.21; rig.position.y = base;
  if (u.head) for (const c of [...u.head.children]) if (c.isMesh && c.geometry?.type === 'CylinderGeometry' && Math.abs(c.position.y + 0.4) < 0.01) u.head.remove(c); // 목은 떼고 얼굴만
  if (u.head) { u.head.scale.setScalar(0.62); u.head.position.set(0, 0.74, -0.26); u.head.rotation.x = -Math.PI / 2 - 0.35; } // 고개를 들어 앞을 본다
  g.userData.seat = (base + 0.2) * S + 0.05;
  g.userData.float = false;
  g.userData.anim = (t, moving) => {
    const sp = moving ? 8 : 0, k = moving ? 0.45 : 0;
    // 대각선 손발이 같이 나간다: 왼손+오른무릎 → 오른손+왼무릎
    for (let i = 0; i < 2; i++) {
      const ph = t * sp + (i ? Math.PI : 0);
      if (u.arms?.[i]) u.arms[i].rotation.set(-Math.PI / 2 - 0.35 + Math.sin(ph) * k, 0, (i ? -1 : 1) * 0.12);
      if (u.legs?.[1 - i]) u.legs[1 - i].rotation.set(-Math.PI / 2 + 0.15 - Math.sin(ph) * k * 0.8, 0, 0);
    }
    rig.position.y = base + (moving ? Math.abs(Math.sin(t * sp)) * 0.015 : Math.sin(t * 1.6) * 0.006); // 헉헉 숨쉬기
    rig.rotation.z = moving ? Math.sin(t * sp) * 0.05 : 0;
    if (u.head) u.head.rotation.y = moving ? Math.sin(t * sp * 0.5) * 0.08 : Math.sin(t * 0.7) * 0.2;
    g.position.y = 0;
  };
  return g;
}
// 순록 (산타 썰매를 끈다) · rudolph = 빨간 코가 반짝이는 루돌프
function reindeer(rudolph) {
  const h = new THREE.Group();
  const coat = M(rudolph ? '#9a6238' : '#86562f', { roughness: 0.62 }), cream = M('#efdcbc', { roughness: 0.7 }), dark = M('#4a2e1a', { roughness: 0.6 }), hoof = M('#241a12'), ant = M('#dcc49c', { roughness: 0.5 });
  const gold = M('#f2c440', { metalness: 0.9, roughness: 0.22, emissive: '#8a6010', emissiveIntensity: 0.35 }), red = M('#c11a30', { roughness: 0.45 });
  const body = mesh(new THREE.CapsuleGeometry(0.2, 0.52, 10, 18), coat, 0, 0.82, 0, h); body.rotation.x = Math.PI / 2;
  const bel = mesh(new THREE.CapsuleGeometry(0.15, 0.42, 8, 14), cream, 0, 0.74, 0.02, h); bel.rotation.x = Math.PI / 2;
  const neck = mesh(new THREE.CapsuleGeometry(0.11, 0.32, 8, 14), coat, 0, 1.06, 0.36, h); neck.rotation.x = -0.55;
  mesh(new THREE.SphereGeometry(0.12, 12, 10), cream, 0, 1.0, 0.44, h).scale.set(0.9, 1.1, 0.7); // 목 아래 하얀 털
  const head = new THREE.Group(); head.position.set(0, 1.27, 0.55); h.add(head);
  const skull = mesh(new THREE.CapsuleGeometry(0.09, 0.19, 8, 14), coat, 0, -0.03, 0.06, head); skull.rotation.x = 1.2;
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.024, 10, 8), M('#14100c', { roughness: 0.2 }), 0.075 * s, 0.035, 0.08, head);
    mesh(new THREE.SphereGeometry(0.008, 6, 5), M('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), 0.083 * s, 0.045, 0.095, head);
    const ear = mesh(new THREE.ConeGeometry(0.035, 0.12, 8), coat, 0.1 * s, 0.07, -0.03, head); ear.rotation.z = -1.1 * s; ear.scale.z = 0.5;
    // 뿔: 줄기 하나에 가지 셋
    const A = new THREE.Group(); A.position.set(0.045 * s, 0.1, -0.04); A.rotation.set(-0.25, 0, -0.45 * s); head.add(A);
    mesh(new THREE.CylinderGeometry(0.013, 0.02, 0.34, 6), ant, 0, 0.17, 0, A);
    for (const [y, a, l] of [[0.1, 0.9, 0.12], [0.2, 0.75, 0.14], [0.3, 0.55, 0.11]]) { const b = mesh(new THREE.CylinderGeometry(0.008, 0.012, l, 5), ant, s * Math.sin(a) * l * 0.5, y + Math.cos(a) * l * 0.5, 0.01, A); b.rotation.z = -a * s; }
    const tb = mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.12, 5), ant, -s * 0.04, 0.3, 0.02, A); tb.rotation.z = 0.7 * s;
  }
  const noseM = rudolph ? glowM('#ff1a2a', 2.2) : M('#2a1a12', { roughness: 0.3 });
  const nose = mesh(new THREE.SphereGeometry(rudolph ? 0.05 : 0.032, 14, 12), noseM, 0, 0.04, 0.27, head);
  let noseGlow = null; if (rudolph) { noseGlow = glowSprite('#ff3040', 0.75, 0.75); noseGlow.position.set(0, 0.04, 0.3); head.add(noseGlow); }
  // 마구: 금방울 달린 빨간 목걸이 · 빨간 배띠
  const col = mesh(new THREE.TorusGeometry(0.14, 0.032, 10, 24), red, 0, 0.98, 0.3, h); col.rotation.x = Math.PI / 2 - 0.55;
  const bells = []; for (let i = -2; i <= 2; i++) { const a = i * 0.5; const b = mesh(new THREE.SphereGeometry(0.035, 10, 8), gold, Math.sin(a) * 0.15, 0.93 + Math.abs(i) * 0.03, 0.38 + Math.cos(a) * 0.02, h); bells.push(b); }
  mesh(new THREE.TorusGeometry(0.215, 0.025, 8, 26), red, 0, 0.82, -0.04, h);
  mesh(new THREE.BoxGeometry(0.2, 0.05, 0.16), red, 0, 1.02, -0.04, h); mesh(new THREE.SphereGeometry(0.03, 8, 6), gold, 0, 1.06, -0.04, h);
  const tail = mesh(new THREE.SphereGeometry(0.07, 10, 8), cream, 0, 0.92, -0.42, h); tail.scale.set(0.8, 1.2, 0.7);
  const legs = [];
  for (const [x, z] of [[-0.11, 0.27], [0.11, 0.27], [-0.11, -0.27], [0.11, -0.27]]) { const piv = new THREE.Group(); piv.position.set(x, 0.72, z); h.add(piv); mesh(new THREE.CylinderGeometry(0.048, 0.034, 0.62, 8), coat, 0, -0.31, 0, piv); mesh(new THREE.CylinderGeometry(0.044, 0.05, 0.08, 8), dark, 0, -0.66, 0, piv); mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.04, 8), hoof, 0, -0.71, 0, piv); legs.push(piv); }
  h.userData.anim = (t, moving, ph) => {
    const sp = moving ? 12 : 0, k = moving ? 0.7 : 0;
    legs.forEach((l, i) => (l.rotation.x = Math.sin(t * sp + ph + (i < 2 ? 0 : Math.PI * 0.6)) * k)); // 앞발 둘 · 뒷발 둘이 같이 뛴다 (껑충껑충)
    h.position.y = moving ? Math.abs(Math.sin(t * 12 + ph)) * 0.08 : 0;
    head.rotation.x = moving ? Math.sin(t * 12 + ph) * 0.1 : Math.sin(t * 0.9 + ph) * 0.08;
    head.rotation.y = moving ? 0 : Math.sin(t * 0.5 + ph) * 0.15;
    tail.rotation.x = Math.sin(t * 6 + ph) * 0.3;
    bells.forEach((b, i) => (b.position.y += Math.sin(t * 20 + i) * 0.0008 * (moving ? 3 : 0.4)));
    if (rudolph) { const p = 0.5 + Math.sin(t * 4) * 0.5; noseM.emissiveIntensity = 1.6 + p * 1.6; noseGlow.material.opacity = 0.45 + p * 0.45; noseGlow.scale.setScalar(0.6 + p * 0.35); }
  };
  return h;
}
// 산타 썰매: 빨간 썰매 + 금테 + 선물 보따리 · 앞에 순록 두 마리와 맨 앞의 루돌프 (아주 크다)
function sleigh() {
  const g = new THREE.Group();
  const SC = 1.35; const sl = new THREE.Group(); sl.scale.setScalar(SC); g.add(sl);
  const red = M('#c8102e', { roughness: 0.32, metalness: 0.15, emissive: '#4a0410', emissiveIntensity: 0.3 });
  const gold = M('#f2c440', { metalness: 0.9, roughness: 0.22, emissive: '#8a6010', emissiveIntensity: 0.4 });
  const velvet = M('#1f6b3a', { roughness: 0.85, emissive: '#0a2a14', emissiveIntensity: 0.3 });
  const fur = M('#ffffff', { roughness: 0.95, emissive: '#ffffff', emissiveIntensity: 0.1 });
  const W = 0.62; // 반폭
  // 옆판 모양 (z 앞뒤 · y 높이): 뒤는 높게 말려 올라가고 앞은 낮게 동그랗게 말린다
  const sh = new THREE.Shape();
  sh.moveTo(-0.95, 0.45); sh.lineTo(0.8, 0.45);
  sh.quadraticCurveTo(1.28, 0.45, 1.28, 0.86); sh.quadraticCurveTo(1.28, 1.16, 1.02, 1.12); sh.quadraticCurveTo(0.86, 1.06, 0.95, 0.92);
  sh.quadraticCurveTo(0.6, 0.78, 0.2, 0.84); sh.quadraticCurveTo(-0.45, 0.92, -0.7, 1.35); sh.quadraticCurveTo(-0.82, 1.7, -1.05, 1.68); sh.quadraticCurveTo(-1.25, 1.62, -1.12, 1.42);
  sh.lineTo(-1.02, 0.6); sh.quadraticCurveTo(-1.0, 0.45, -0.95, 0.45);
  const sideGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 18 });
  const edgePts = sh.getPoints(18).map((p) => new THREE.Vector3(0, p.y, p.x));
  const edgeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePts, true), 160, 0.026, 6, true);
  for (const s of [-1, 1]) {
    const side = mesh(sideGeo, red, s > 0 ? W : -W + 0.07, 0, 0, sl); side.rotation.y = -Math.PI / 2;
    mesh(edgeGeo, gold, s * (W + 0.04), 0, 0, sl);
    // 옆판 무늬: 금빛 소용돌이 + 별
    const sw = mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 26, Math.PI * 1.6), gold, s * (W + 0.045), 0.68, -0.25, sl); sw.rotation.y = Math.PI / 2;
    const sw2 = mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 22, Math.PI * 1.5), gold, s * (W + 0.045), 0.66, 0.4, sl); sw2.rotation.set(0, Math.PI / 2, Math.PI);
    mesh(new THREE.OctahedronGeometry(0.05), glowM('#fff2a0', 1.3), s * (W + 0.05), 0.68, 0.08, sl);
  }
  mesh(new THREE.BoxGeometry(W * 2, 0.08, 2.0), red, 0, 0.47, 0.05, sl); // 바닥
  mesh(new THREE.BoxGeometry(W * 2, 0.36, 0.07), red, 0, 0.66, 1.0, sl); // 앞판
  const back = mesh(new THREE.BoxGeometry(W * 2, 0.95, 0.08), red, 0, 1.05, -0.98, sl); back.rotation.x = -0.12; // 등받이
  mesh(new THREE.BoxGeometry(W * 2 + 0.06, 0.07, 0.12), fur, 0, 0.88, 1.0, sl); // 앞판 위 하얀 털
  // 초록 벨벳 의자 + 등받이 쿠션
  mesh(new THREE.BoxGeometry(W * 2 - 0.06, 0.2, 0.62), velvet, 0, 0.6, -0.35, sl);
  mesh(new THREE.BoxGeometry(W * 2 - 0.08, 0.62, 0.12), velvet, 0, 0.98, -0.88, sl).rotation.x = -0.12;
  mesh(new THREE.BoxGeometry(W * 2 - 0.02, 0.06, 0.14), fur, 0, 0.72, -0.06, sl);
  // 썰매 날: 금빛 날 두 줄 (앞이 동그랗게 말려 올라간다) + 받침대
  const runPts = [[-1.15, 0.06], [-0.4, 0.04], [0.6, 0.04], [1.2, 0.08], [1.5, 0.3], [1.45, 0.52], [1.28, 0.55], [1.22, 0.42]].map(([z, y]) => new THREE.Vector3(0, y, z));
  const runGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(runPts), 80, 0.035, 8, false);
  for (const s of [-1, 1]) {
    mesh(runGeo, gold, s * (W - 0.05), 0, 0, sl);
    for (const z of [-0.7, 0.05, 0.75]) mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.42, 8), gold, s * (W - 0.05), 0.25, z, sl);
    const bk = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), gold, s * (W - 0.05), 0.04, -1.15, sl); bk.rotation.y = Math.PI / 2;
  }
  // 선물 보따리 (뒤 칸) + 삐져나온 선물 상자들
  const sack = mesh(new THREE.SphereGeometry(0.42, 18, 14), M('#a8322a', { roughness: 0.9 }), 0, 1.45, -1.3, sl); sack.scale.set(1.05, 1.2, 0.85);
  mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.14, 12), M('#a8322a', { roughness: 0.9 }), 0, 1.98, -1.3, sl);
  mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 16), gold, 0, 1.92, -1.3, sl).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(W * 2 - 0.1, 0.5, 0.5), red, 0, 0.75, -1.3, sl); // 짐칸
  const gifts = [['#2a8af0', '#ffffff', 0.22, -0.38, 2.0, -1.12], ['#3ad06a', '#ff3a4a', 0.18, 0.4, 1.95, -1.2], ['#ffd040', '#c8102e', 0.16, 0.12, 2.12, -1.05], ['#b05af0', '#ffe080', 0.14, -0.15, 2.18, -1.45]];
  for (const [c, rb, s, x, y, z] of gifts) {
    const bx = new THREE.Group(); bx.position.set(x, y - 0.3, z); bx.rotation.set(0.2, x * 2, -x * 0.4); sl.add(bx);
    mesh(new THREE.BoxGeometry(s, s, s), M(c, { roughness: 0.4 }), 0, 0, 0, bx);
    mesh(new THREE.BoxGeometry(s * 1.03, s * 1.03, s * 0.18), M(rb, { roughness: 0.4 }), 0, 0, 0, bx); mesh(new THREE.BoxGeometry(s * 0.18, s * 1.03, s * 1.03), M(rb, { roughness: 0.4 }), 0, 0, 0, bx);
    for (const q of [-1, 1]) { const bow = mesh(new THREE.TorusGeometry(s * 0.2, s * 0.06, 6, 12), M(rb), q * s * 0.16, s * 0.6, 0, bx); bow.rotation.z = q * 0.6; }
  }
  // 방울 달린 등 둘 + 옆구리 방울 줄
  const lamps = [];
  for (const s of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(s * (W + 0.1), 1.0, 0.92); sl.add(L);
    mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.14, 6), glowM('#ffd88a', 1.2, { transparent: true, opacity: 0.85 }), 0, 0, 0, L); mesh(new THREE.ConeGeometry(0.075, 0.08, 6), gold, 0, 0.11, 0, L);
    const lg = glowSprite('#ffcf6a', 0.6, 0.6); L.add(lg); lamps.push(lg);
    for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(0.04, 10, 8), gold, s * (W + 0.07), 0.58, -0.75 + i * 0.3, sl);
  }
  // 순록: 두 마리가 나란히 + 맨 앞에 루돌프 (금빛 끈으로 이어진다)
  const deer = [];
  for (const s of [-1, 1]) { const d = reindeer(false); d.position.set(s * 0.42, 0, 2.55); sl.add(d); deer.push(d); }
  const rudy = reindeer(true); rudy.position.set(0, 0, 3.85); sl.add(rudy); deer.push(rudy);
  const reinM = new THREE.LineBasicMaterial({ color: '#f2c440' });
  const line = (pts) => sl.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), reinM));
  for (const s of [-1, 1]) { line([[s * (W - 0.1), 0.7, 1.05], [s * 0.42, 0.95, 2.78]]); line([[s * 0.42, 1.0, 2.86], [s * 0.1, 0.95, 3.6]]); line([[s * 0.28, 1.0, -0.1], [s * 0.42, 1.12, 2.7]]); }
  // 반짝이 별가루 (달리면 뒤로 흩날린다)
  const sparks = []; for (let i = 0; i < 18; i++) { const sp = glowSprite(i % 3 ? '#fff2b0' : '#ffffff', 0.14, 0.8); sl.add(sp); sparks.push(sp); }
  const seatY = 0.7;
  g.userData.seat = seatY * SC - 0.12;
  g.userData.float = false;
  g.userData.anim = (t, moving) => {
    g.position.y = 0;
    sl.position.y = moving ? 0.06 + Math.sin(t * 6) * 0.03 : Math.sin(t * 1.4) * 0.012; // 달리면 살짝 떠서 미끄러진다
    sl.rotation.x = moving ? -0.02 : 0;
    sl.rotation.z = Math.sin(t * (moving ? 3.5 : 1)) * (moving ? 0.015 : 0.004);
    deer.forEach((d, i) => d.userData.anim(t, moving, i * 1.1));
    lamps.forEach((l, i) => (l.material.opacity = 0.5 + Math.sin(t * 6 + i * 2) * 0.15));
    sparks.forEach((s, i) => {
      if (moving) { const k = (t * 0.9 + i / 18) % 1; s.position.set(Math.sin(i * 7.3) * 0.7, 0.2 + Math.sin(i * 3.1 + t) * 0.15 + k * 0.5, -1.3 - k * 2.4); s.material.opacity = 0.9 * (1 - k); }
      else { const a = t * 0.8 + i * 0.35; s.position.set(Math.cos(a) * 1.0, 0.5 + ((t * 0.25 + i * 0.06) % 1) * 1.8, 0.6 + Math.sin(a) * 1.8); s.material.opacity = 0.3 + Math.sin(t * 5 + i) * 0.3; }
    });
  };
  return g;
}
export function buildMount(id) {
  if (id === 'mount_sleigh') return sleigh();
  if (id === 'mount_wolf') return bigBeast('wolf');
  if (id === 'mount_lion') return bigBeast('lion');
  if (id === 'mount_turtle') return turtle();
  if (id === 'mount_human') return crawler();
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

// ───────────── 황금 고양이 세트 (비매품 · 주간랭킹 1~3위 보상)
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
/** 전기톱: 주황 몸통 + 긴 톱날 (체인 톱니가 빙글빙글 돈다) · 귀신 퇴치 무제한. 손잡이가 원점, +y 쪽으로 날이 뻗는다 (-z 가 위) */
export function buildChainsaw() {
  const g = new THREE.Group();
  const orange = M('#ff7a1a', { roughness: 0.4, metalness: 0.1, emissive: '#5a2000', emissiveIntensity: 0.25 }), dark = M('#24262a', { roughness: 0.55 }), steel = M('#c8ccd4', { metalness: 0.9, roughness: 0.25 }), chainM = M('#9a9ea8', { metalness: 0.85, roughness: 0.3 });
  mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.13, 10), dark, 0, -0.02, 0, g); // 뒷손잡이
  mesh(new THREE.BoxGeometry(0.11, 0.24, 0.16), orange, 0, 0.15, -0.02, g); // 몸통
  mesh(new THREE.BoxGeometry(0.115, 0.12, 0.07), dark, 0, 0.13, 0.07, g); // 엔진 아래
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.118, 0.012, 0.05), dark, 0, 0.07 + i * 0.035, -0.06, g); // 냉각 홈
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12), M('#ffd23a', { roughness: 0.4 }), 0, 0.1, -0.11, g).rotation.z = Math.PI / 2; // 시동줄 뚜껑
  const top = mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 18, Math.PI), dark, 0, 0.17, -0.11, g); top.rotation.set(0, Math.PI / 2, -Math.PI / 2); // 위 손잡이
  mesh(new THREE.BoxGeometry(0.12, 0.02, 0.12), steel, 0, 0.28, 0, g); // 날 덮개
  const bar = mesh(new THREE.BoxGeometry(0.018, 0.6, 0.075), steel, 0, 0.58, 0.02, g); // 톱날 판
  const tip = mesh(new THREE.CylinderGeometry(0.0375, 0.0375, 0.018, 16), steel, 0, 0.88, 0.02, g); tip.rotation.z = Math.PI / 2;
  // 체인 톱니: 판 둘레를 따라 계속 돈다
  const N = 34, teeth = [];
  const L = 0.6 * 2 + Math.PI * 0.042;
  for (let i = 0; i < N; i++) { const c = mesh(new THREE.BoxGeometry(0.026, 0.022, 0.014), chainM, 0, 0, 0, g); teeth.push(c); }
  const place = (c, u) => { // u: 0~1 둘레 위의 위치
    let d = ((u % 1) + 1) % 1 * L; const r = 0.044, y0 = 0.28, y1 = 0.88;
    if (d < 0.6) { c.position.set(0, y0 + d, 0.02 - r); c.rotation.x = 0; return; } d -= 0.6;
    const arc = Math.PI * r; if (d < arc) { const a = d / r; c.position.set(0, y1 + Math.sin(a) * r, 0.02 - Math.cos(a) * r); c.rotation.x = -a; return; } d -= arc;
    if (d < 0.6) { c.position.set(0, y1 - d, 0.02 + r); c.rotation.x = Math.PI; return; }
    c.position.set(0, y0, 0.02 + r);
  };
  const smoke = glowSprite('#c8c8c8', 0.18, 0.0); smoke.position.set(0.07, 0.1, 0.06); g.add(smoke);
  g.userData.anim = (t, fast) => {
    const sp = fast ? 3.5 : 0.8;
    teeth.forEach((c, i) => place(c, i / N + t * sp));
    g.position.x = Math.sin(t * 70) * 0.002; // 엔진 떨림
    smoke.material.opacity = 0.15 + Math.max(0, Math.sin(t * 7)) * 0.25; smoke.position.x = 0.07 + ((t * 0.6) % 0.12);
  };
  return g;
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
// ───── 크리스마스 트리 코스튬: 초록 펠트 트리가 온몸(팔까지)을 덮고, 얼굴만 둥근 구멍으로 쏙 내민다 · 꼭대기 금별 · 빨강/금 방울 · 반짝이는 꼬마전구
// 층층이 옆으로 펼쳐진 트리: 층마다 아랫단이 치마처럼 넓게 퍼지고(오목한 곡선), 그 위에 다음 층이 얹힌다
const XMAS_TIERS = [[0.08, 0.55, 0.98, 0.5], [0.42, 1.3, 0.9, 0.46], [1.18, 1.68, 0.74, 0.3], [1.56, 2.06, 0.5, 0.02]]; // 아래y · 위y · 아래 반지름 · 위 반지름
const XMAS_HY = 0.86, XMAS_HR = 0.38; // 얼굴 구멍: 머리 한가운데 높이 · 반지름
const XMAS_SZ = 0.8, XMAS_DZ = -0.28; // 트리를 앞뒤로 납작하게 하고 뒤로 물려서, 얼굴이 구멍 밖으로 쏙 튀어나오게
const tierR = (y, [y0, y1, rb, rt]) => rt + (rb - rt) * (1 - (y - y0) / (y1 - y0)) ** 1.7;
const xmasR = (y) => { let r = 0; for (const T of XMAS_TIERS) if (y >= T[0] && y <= T[1]) r = Math.max(r, tierR(y, T)); return r; };
const inHole = (x, y, z, pad = 0) => z > 0 && x * x + (y - XMAS_HY) ** 2 < (XMAS_HR + pad) ** 2; // 트리 안쪽 좌표 기준
function cutFaceHole(geo, yc) { // 원뿔 앞쪽에서 얼굴 구멍 안에 드는 삼각형을 지운다 (금테가 가장자리를 덮는다)
  const src = geo.toNonIndexed(), P = src.attributes.position, keep = [];
  for (let i = 0; i < P.count; i += 3) { const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, cy = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3 + yc, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3; if (!inHole(cx, cy, cz)) keep.push(i); }
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) { const a = src.attributes[name], n = a.itemSize, arr = new Float32Array(keep.length * 3 * n); keep.forEach((i, k) => { for (let j = 0; j < 3 * n; j++) arr[k * 3 * n + j] = a.array[i * n + j]; }); out.setAttribute(name, new THREE.BufferAttribute(arr, n)); }
  return out;
}
function xmasParts(u) {
  const tree = new THREE.Group(); tree.scale.z = XMAS_SZ; tree.position.z = XMAS_DZ; u.rig.add(tree); // 앞뒤로 납작 + 뒤로 물림 — 얼굴이 구멍 앞으로 튀어나온다
  const add = (geo, mat, x, y, z, parent = tree) => mesh(geo, mat, x, y, z, parent);
  const felt = M('#2f8f3e', { roughness: 0.95, emissive: '#0e3d17', emissiveIntensity: 0.5, side: THREE.DoubleSide });
  const felt2 = M('#3aa84c', { roughness: 0.95, emissive: '#124a1d', emissiveIntensity: 0.5 });
  const gold = M('#ffd23a', { metalness: 0.55, roughness: 0.28, emissive: '#b88400', emissiveIntensity: 0.6 });
  XMAS_TIERS.forEach(([y0, y1, rb, rt], i) => {
    const h = y1 - y0, yc = (y0 + y1) / 2;
    const np = i === 1 ? 30 : 12, prof = [];
    for (let k = 0; k <= np; k++) { const y = y0 + (h * k) / np; prof.push(new THREE.Vector2(tierR(y, XMAS_TIERS[i]), y - yc)); }
    let geo = new THREE.LatheGeometry(prof, i === 1 ? 72 : 48);
    if (i === 1) geo = cutFaceHole(geo, yc);
    add(geo, felt, 0, yc, 0);
    if (i === 3) return;
    // 층마다 아랫단을 둥글게 물결치는 펠트 장식
    const n = Math.round((Math.PI * 2 * rb) / 0.15);
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, sc = add(new THREE.SphereGeometry(0.085, 12, 8), k % 2 ? felt2 : felt, Math.sin(a) * rb, y0 + 0.01, Math.cos(a) * rb); sc.rotation.y = a; sc.scale.set(1, 0.55, 0.45); }
  });
  // 얼굴 구멍의 금테 (원뿔 겉면을 따라 휘어 있다)
  const rim = []; for (let k = 0; k < 56; k++) { const a = (k / 56) * Math.PI * 2, x = Math.cos(a) * XMAS_HR, y = XMAS_HY + Math.sin(a) * XMAS_HR, r = xmasR(y); rim.push(new THREE.Vector3(x, y, Math.sqrt(Math.max(0.001, r * r - x * x)))); }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 112, 0.036, 8, true), gold, 0, 0, 0);
  // 방울: 빨강 · 금 · 은 (얼굴 구멍 근처는 비운다)
  const BAUB = [M('#e3262b', { metalness: 0.35, roughness: 0.18, emissive: '#7a0a10', emissiveIntensity: 0.45 }), gold, M('#e8eef8', { metalness: 0.6, roughness: 0.2, emissive: '#5a6478', emissiveIntensity: 0.4 })];
  for (let i = 0, made = 0; i < 60 && made < 24; i++) {
    const y = 0.22 + ((i * 0.618) % 1) * 1.5, a = i * 2.39996, r = xmasR(y) + 0.035, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inHole(x, y, z, 0.13)) continue; made++;
    const b = add(new THREE.SphereGeometry(0.05 + (i % 3) * 0.009, 14, 10), BAUB[made % 3], x, y, z);
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.025, 8), gold, 0, 0.06 + (i % 3) * 0.009, 0, b);
  }
  // 꼬마전구: 나선으로 감긴 네 가지 색 — 번갈아 반짝인다
  const LCOL = ['#ff4a5a', '#ffd23a', '#4ad8ff', '#7dff8a'], lmats = LCOL.map((c) => glowM(c, 1.2));
  const wireM = M('#1c4a22'); let wire = [];
  const flush = () => { if (wire.length > 1) add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), wire.length * 4, 0.006, 4), wireM, 0, 0, 0); wire = []; };
  for (let k = 0; k <= 70; k++) {
    const f = k / 70, y = 0.16 + f * 1.8, a = f * Math.PI * 2 * 4.3 + 0.6, r = xmasR(y) + 0.018, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (inHole(x, y, z, 0.08)) { flush(); continue; }
    wire.push(new THREE.Vector3(x, y, z));
    add(new THREE.SphereGeometry(0.024, 8, 6), lmats[k % 4], x, y - 0.012, z).scale.y = 1.35;
  }
  flush();
  // 꼭대기 금별
  const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 0.088 : 0.2; k ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath();
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.014, bevelSegments: 2 }); sg.translate(0, 0, -0.025);
  const star = new THREE.Group(); star.position.y = 2.2; tree.add(star);
  add(sg, M('#ffd23a', { metalness: 0.5, roughness: 0.22, emissive: '#e0a400', emissiveIntensity: 1.0 }), 0, 0, 0, star);
  const sGlow = glowSprite('#ffe27a', 0.95, 0.6); star.add(sGlow);
  tree.traverse((o) => { if (o.isMesh) o.userData.robot = true; });
  return { parts: [tree], anim: (t) => { lmats.forEach((m, i) => (m.emissiveIntensity = 0.35 + Math.max(0, Math.sin(t * 2.6 + i * 1.57)) * 1.5)); star.rotation.y = Math.sin(t * 0.9) * 0.5; sGlow.material.opacity = 0.45 + Math.sin(t * 3) * 0.18; } };
}

// ───── 상점 가면 5종: 레벨 · 값이 오를수록 크고 화려하다. 머리에 붙는 둥근 판(캔버스 그림 · 눈구멍은 투명) + 입체 장식
//  각도: d = 얼굴 가운데에서 좌우로 벌어진 각(보는 사람 왼쪽이 −) · th = 정수리에서 내려온 각. 눈은 d ±0.426 · th 1.593 쯤
const EYE_D = 0.426, EYE_TH = 1.593;
const sph = (R, d, th, v = new THREE.Vector3()) => v.set(R * Math.sin(d) * Math.sin(th) * 1.08, R * Math.cos(th) * 0.95, R * Math.cos(d) * Math.sin(th));
const _maskPlate = {};
function maskPlate(key, R, PW, th0, TH, W, H, draw, mo = {}) {
  let mat = _maskPlate[key];
  if (!mat) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const P = (d, th) => [((d + PW / 2) / PW) * W, ((th - th0) / TH) * H];
    x.lineCap = 'round'; x.lineJoin = 'round';
    draw(x, P, W, H);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    mat = _maskPlate[key] = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.8, metalness: 0, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.3, side: THREE.DoubleSide, ...mo });
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 26, Math.PI / 2 - PW / 2, PW, th0, TH), mat); m.scale.set(1.08, 0.95, 1); m.castShadow = true; return m;
}
const pathOf = (x, P, pts) => { x.beginPath(); pts.forEach(([d, th], i) => { const [px, py] = P(d, th); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); };
const smoothPath = (x, P, pts) => { // 점들을 부드럽게 잇는 닫힌 곡선
  const q = pts.map(([d, th]) => P(d, th)); x.beginPath();
  for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (!i) { const z = q[q.length - 1]; x.moveTo((z[0] + a[0]) / 2, (z[1] + a[1]) / 2); } x.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
  x.closePath();
};
const cutOut = (x, fn) => { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; fn(); x.fill(); x.restore(); };
const eyeAt = (P, s, dd = 0, dt = 0) => P(s * (EYE_D + dd), EYE_TH + dt);

function maskPaper() { // Lv5 · 종이접시 가면: 작고 소박하다 — 크레용 웃는 얼굴 · 고무줄
  const g = new THREE.Group();
  g.add(maskPlate('paper', 0.456, 1.62, 0.98, 1.22, 384, 320, (x, P, W, H) => {
    const [cx, cy] = P(0, 1.6), [ex] = P(0.79, 1.6), [, ty] = P(0, 1.0), rx = ex - cx, ry = cy - ty;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    const bg = x.createRadialGradient(cx, cy, 10, cx, cy, rx); bg.addColorStop(0, '#fffdf6'); bg.addColorStop(0.75, '#f6efdf'); bg.addColorStop(1, '#e6dac2'); x.fillStyle = bg; x.fill();
    x.strokeStyle = 'rgba(170,150,120,.45)'; x.lineWidth = 2; for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.86); x.lineTo(cx + Math.cos(a) * rx * 0.98, cy + Math.sin(a) * ry * 0.98); x.stroke(); } // 접시 테두리 주름
    x.fillStyle = 'rgba(150,130,100,.18)'; for (let k = 0; k < 90; k++) x.fillRect((k * 97) % W, (k * 61) % H, 2, 2);
    x.strokeStyle = '#ff5a8a'; x.lineWidth = 7; const [mx, my] = P(0, 1.98); x.beginPath(); x.arc(mx, my - 34, 52, 0.35, Math.PI - 0.35); x.stroke(); // 크레용 웃음
    x.fillStyle = 'rgba(255,120,150,.45)'; for (const s of [-1, 1]) { const [bx, by] = P(s * 0.55, 1.86); x.beginPath(); x.arc(bx, by, 20, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = '#3a8cff'; x.lineWidth = 5; for (const s of [-1, 1]) { const [bx, by] = eyeAt(P, s, 0, -0.17); x.beginPath(); x.moveTo(bx - 22, by + 4); x.quadraticCurveTo(bx, by - 10, bx + 22, by + 4); x.stroke(); } // 눈썹
    x.fillStyle = '#ffb02e'; const [nx, ny] = P(0, 1.78); x.beginPath(); x.arc(nx, ny, 8, 0, Math.PI * 2); x.fill();
    for (const s of [-1, 1]) { const [bx, by] = eyeAt(P, s); cutOut(x, () => { x.beginPath(); x.arc(bx, by, 24, 0, Math.PI * 2); }); x.strokeStyle = '#2a2a2a'; x.lineWidth = 3; x.beginPath(); x.arc(bx, by, 25, 0, Math.PI * 2); x.stroke(); }
  }, { roughness: 0.95 }));
  const band = mesh(new THREE.TorusGeometry(0.43, 0.007, 6, 48), M('#d8b070', { roughness: 0.6 }), 0, 0.02, 0, g); band.rotation.x = Math.PI / 2; band.scale.set(1.08, 1, 1);
  return g;
}
function maskFox() { // Lv15 · 여우 가면: 하얀 바탕 붉은 무늬 · 뾰족 귀 · 튀어나온 주둥이 · 붉은 술
  const g = new THREE.Group(), R = 0.466;
  g.add(maskPlate('fox', R, 2.0, 0.8, 1.48, 512, 380, (x, P) => {
    smoothPath(x, P, [[0, 0.84], [0.62, 0.88], [0.98, 1.2], [1.0, 1.72], [0.6, 2.0], [0.2, 2.26], [-0.2, 2.26], [-0.6, 2.0], [-1.0, 1.72], [-0.98, 1.2], [-0.62, 0.88]]);
    const [cx, cy] = P(0, 1.5), bg = x.createRadialGradient(cx, cy, 20, cx, cy, 280); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.8, '#f8f2e8'); bg.addColorStop(1, '#e6d8c0'); x.fillStyle = bg; x.fill();
    x.lineWidth = 8; x.strokeStyle = '#e8b52a'; x.stroke();
    const RED = '#e01e34';
    for (const s of [-1, 1]) { // 눈 위로 치켜 올라간 붉은 눈매 · 볼의 붉은 줄무늬
      const [ax, ay] = eyeAt(P, s, -0.14, 0.05), [bx, by] = eyeAt(P, s, 0.36, -0.3), [kx, ky] = eyeAt(P, s, 0.1, -0.24);
      x.fillStyle = RED; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(kx, ky - 26, bx, by); x.quadraticCurveTo(kx + s * 8, ky + 10, ax, ay + 10); x.closePath(); x.fill();
      x.strokeStyle = RED; x.lineWidth = 6; for (let k = 0; k < 3; k++) { const [px, py] = P(s * (0.62 + k * 0.1), 1.82 + k * 0.03); x.beginPath(); x.moveTo(px, py); x.lineTo(px + s * 30, py - 8); x.stroke(); }
    }
    x.fillStyle = RED; for (let k = 0; k < 3; k++) { const [px, py] = P((k - 1) * 0.17, 1.03 + (k === 1 ? -0.04 : 0.02)); x.beginPath(); x.moveTo(px, py - 22); x.quadraticCurveTo(px + 12, py, px, py + 20); x.quadraticCurveTo(px - 12, py, px, py - 22); x.fill(); } // 이마 불꽃
    x.fillStyle = '#e8b52a'; const [dx, dy] = P(0, 1.26); x.beginPath(); x.arc(dx, dy, 9, 0, Math.PI * 2); x.fill();
    x.strokeStyle = RED; x.lineWidth = 5; const [mx, my] = P(0, 2.12); x.beginPath(); x.moveTo(mx - 34, my - 6); x.quadraticCurveTo(mx - 14, my + 10, mx, my); x.quadraticCurveTo(mx + 14, my + 10, mx + 34, my - 6); x.stroke();
    for (const s of [-1, 1]) cutOut(x, () => { const [ex, ey] = eyeAt(P, s); x.beginPath(); x.moveTo(ex - s * 40, ey + 10); x.quadraticCurveTo(ex, ey - 26, ex + s * 44, ey - 14); x.quadraticCurveTo(ex + s * 6, ey + 22, ex - s * 40, ey + 10); x.closePath(); });
  }));
  const white = softM('#fbf6ee', '#ffffff', 0.25), red = softM('#e01e34', '#7a0010', 0.35);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.11, 0.26, 14), white, 0, 0, 0, g); ear.position.copy(sph(R, s * 0.5, 0.72)); ear.position.y += 0.08; ear.rotation.set(-0.15, 0, -0.34 * s); ear.scale.z = 0.5;
    ear.add(earInner(0.11, 0.26, red));
  }
  const snout = mesh(new THREE.ConeGeometry(0.085, 0.17, 16), white, 0, 0, 0, g); snout.position.copy(sph(R + 0.07, 0, 1.92)); snout.rotation.x = Math.PI / 2; snout.scale.x = 1.1;
  mesh(new THREE.SphereGeometry(0.028, 10, 8), M('#1a1012', { roughness: 0.3 }), 0, 0, 0, g).position.copy(sph(R + 0.16, 0, 1.9));
  const tassels = [];
  for (const s of [-1, 1]) { const tg = new THREE.Group(); tg.position.copy(sph(R, s * 0.98, 1.72)); g.add(tg); mesh(new THREE.SphereGeometry(0.022, 8, 6), M('#e8b52a', { metalness: 0.4, roughness: 0.3 }), 0, 0, 0, tg); mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.16, 8), red, 0, -0.1, 0, tg); tassels.push(tg); }
  g.userData.anim = (t) => tassels.forEach((tg, i) => (tg.rotation.z = Math.sin(t * 2.2 + i * 1.3) * 0.18));
  return g;
}
function maskHahoe() { // Lv25 · 하회탈: 나무결 · 반달처럼 웃는 눈 · 따로 달린 턱이 말할 때처럼 들썩인다
  const g = new THREE.Group(), R = 0.476;
  const wood = (x, W, H) => { const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#e2b479'); bg.addColorStop(1, '#b98048'); x.fillStyle = bg; x.fill(); x.save(); x.clip(); x.strokeStyle = 'rgba(120,70,30,.16)'; x.lineWidth = 2; for (let k = 0; k < 24; k++) { x.beginPath(); x.moveTo(0, k * 15 + 4); x.bezierCurveTo(W * 0.3, k * 15 - 6, W * 0.7, k * 15 + 14, W, k * 15 + 2); x.stroke(); } x.restore(); };
  g.add(maskPlate('hahoe', R, 2.16, 0.78, 1.3, 512, 320, (x, P, W, H) => {
    smoothPath(x, P, [[0, 0.8], [0.7, 0.86], [1.06, 1.25], [1.06, 1.75], [0.72, 2.04], [0.3, 1.98], [0, 2.02], [-0.3, 1.98], [-0.72, 2.04], [-1.06, 1.75], [-1.06, 1.25], [-0.7, 0.86]]);
    wood(x, W, H); x.strokeStyle = 'rgba(90,50,20,.55)'; x.lineWidth = 5; x.stroke();
    x.strokeStyle = 'rgba(110,60,25,.5)'; x.lineWidth = 4; for (let k = 0; k < 3; k++) { const [ax, ay] = P(-0.32, 1.02 + k * 0.07), [bx] = P(0.32, 1.02); x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + bx) / 2, ay - 10, bx, ay); x.stroke(); } // 이마 주름
    x.strokeStyle = '#2a1a10'; x.lineWidth = 11; for (const s of [-1, 1]) { const [ax, ay] = eyeAt(P, s, -0.2, -0.2), [bx, by] = eyeAt(P, s, 0.26, -0.13), [kx, ky] = eyeAt(P, s, 0.04, -0.33); x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(kx, ky, bx, by); x.stroke(); } // 짙은 눈썹
    for (const s of [-1, 1]) { const [bx, by] = P(s * 0.66, 1.8), bl = x.createRadialGradient(bx, by, 4, bx, by, 46); bl.addColorStop(0, 'rgba(210,80,60,.4)'); bl.addColorStop(1, 'rgba(210,80,60,0)'); x.fillStyle = bl; x.fillRect(bx - 50, by - 50, 100, 100); }
    x.strokeStyle = 'rgba(90,50,20,.5)'; x.lineWidth = 4; for (const s of [-1, 1]) { const [ax, ay] = P(s * 0.2, 1.8), [bx, by] = P(s * 0.5, 2.0); x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + s * 6, by, bx, by); x.stroke(); } // 팔자 주름
    for (const s of [-1, 1]) cutOut(x, () => { const [ex, ey] = eyeAt(P, s, 0, 0.02); x.beginPath(); x.moveTo(ex - 42, ey + 6); x.quadraticCurveTo(ex, ey - 40, ex + 42, ey + 6); x.quadraticCurveTo(ex, ey - 12, ex - 42, ey + 6); x.closePath(); }); // 반달 웃는 눈
  }, { roughness: 0.7 }));
  mesh(new THREE.SphereGeometry(0.07, 14, 10), M('#cf9a5c', { roughness: 0.7, emissive: '#5a3010', emissiveIntensity: 0.3 }), 0, 0, 0, g).position.copy(sph(R + 0.005, 0, 1.78)); // 뭉툭한 코
  // 따로 깎은 턱: 입꼬리 양쪽의 끈을 축으로 들썩인다
  const jaw = new THREE.Group(); jaw.position.copy(sph(R, 0, 1.98)); jaw.position.z -= 0.12; g.add(jaw);
  const jp = maskPlate('hahoeJaw', R + 0.004, 1.5, 1.98, 0.5, 384, 128, (x, P, W, H) => {
    smoothPath(x, P, [[-0.72, 2.0], [-0.3, 2.04], [0, 2.0], [0.3, 2.04], [0.72, 2.0], [0.5, 2.3], [0, 2.46], [-0.5, 2.3]]);
    wood(x, W, H); x.strokeStyle = 'rgba(90,50,20,.55)'; x.lineWidth = 5; x.stroke();
    x.strokeStyle = 'rgba(90,50,20,.45)'; x.lineWidth = 4; const [cx, cy] = P(0, 2.33); x.beginPath(); x.arc(cx, cy, 16, 0.3, Math.PI - 0.3); x.stroke();
  }, { roughness: 0.7 });
  jp.position.sub(jaw.position); jaw.add(jp);
  for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 10), M('#3a2416'), 0, 0, 0, g).position.copy(sph(R + 0.01, s * 0.72, 2.0));
  g.userData.anim = (t) => { jaw.rotation.x = -Math.max(0, Math.sin(t * 3.2)) * 0.14; };
  return g;
}
function maskVenice() { // Lv40 · 베네치아 가면: 보랏빛 반가면 · 금 넝쿨 무늬 · 깃털 장식 · 반짝이는 보석
  const g = new THREE.Group(), R = 0.48;
  g.add(maskPlate('venice', R, 2.56, 1.02, 0.98, 640, 256, (x, P, W, H) => {
    smoothPath(x, P, [[0, 1.2], [0.5, 1.12], [0.95, 1.12], [1.26, 1.04], [1.2, 1.4], [1.0, 1.86], [0.62, 1.84], [0.2, 1.76], [0, 1.84], [-0.2, 1.76], [-0.62, 1.84], [-1.0, 1.86], [-1.2, 1.4], [-1.26, 1.04], [-0.95, 1.12], [-0.5, 1.12]]);
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#3a0a5e'); bg.addColorStop(0.5, '#7a2aa8'); bg.addColorStop(1, '#3a0a5e'); x.fillStyle = bg; x.fill();
    x.save(); x.clip(); x.strokeStyle = '#f4c74a'; x.lineWidth = 3;
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const [ax, ay] = P(s * (0.15 + k * 0.32), 1.66), [bx, by] = P(s * (0.35 + k * 0.32), 1.28); x.beginPath(); x.moveTo(ax, ay); x.bezierCurveTo(ax + s * 40, ay - 10, bx - s * 30, by + 30, bx, by); x.bezierCurveTo(bx + s * 18, by - 14, bx + s * 34, by + 6, bx + s * 20, by + 18); x.stroke(); }
    x.fillStyle = 'rgba(255,240,200,.9)'; for (let k = 0; k < 70; k++) x.fillRect((k * 137) % W, (k * 53) % H, 2, 2);
    x.restore(); x.lineWidth = 7; x.strokeStyle = '#f4c74a'; x.stroke();
    for (const s of [-1, 1]) {
      const eye = () => { const [ex, ey] = eyeAt(P, s, 0.02, 0); x.beginPath(); x.moveTo(ex - s * 44, ey + 8); x.quadraticCurveTo(ex - s * 4, ey - 30, ex + s * 56, ey - 22); x.quadraticCurveTo(ex + s * 14, ey + 26, ex - s * 44, ey + 8); x.closePath(); };
      cutOut(x, eye); eye(); x.strokeStyle = '#ffe28a'; x.lineWidth = 6; x.stroke();
    }
  }, { roughness: 0.35, metalness: 0.25, emissiveIntensity: 0.38 }));
  const gm = M('#f4c74a', { metalness: 0.7, roughness: 0.25, emissive: '#a07000', emissiveIntensity: 0.55 });
  const gems = [];
  for (const [d, th, c] of [[0, 1.28, '#c86bff'], [0, 1.62, '#ff5aa0'], [-0.8, 1.2, '#5ad1ff'], [0.8, 1.2, '#5ad1ff']]) { const m = mesh(new THREE.OctahedronGeometry(0.03), glowM(c, 1.3), 0, 0, 0, g); m.position.copy(sph(R + 0.015, d, th)); m.scale.set(1, 1.3, 0.6); gems.push(m); }
  const plume = new THREE.Group(); plume.position.copy(sph(R + 0.01, 0.98, 1.16)); plume.rotation.z = -0.35; g.add(plume);
  mesh(new THREE.SphereGeometry(0.045, 14, 10), gm, 0, 0, 0, plume); mesh(new THREE.OctahedronGeometry(0.03), glowM('#ff5aa0', 1.4), 0, 0, 0.04, plume);
  const FC = ['#5a1a8a', '#f4c74a', '#ffffff', '#1a1020', '#9a4ad0'], feathers = [];
  FC.forEach((c, i) => { const f = new THREE.Group(); f.rotation.z = (i - 2) * 0.28; plume.add(f); const m = mesh(new THREE.SphereGeometry(0.05, 12, 10), softM(c, c, 0.25), 0, 0.22, 0, f); m.scale.set(0.55, 4.4 - Math.abs(i - 2) * 0.6, 0.2); feathers.push(f); });
  const ribbon = mesh(new THREE.TorusGeometry(0.45, 0.012, 6, 48), M('#5a1a8a', { roughness: 0.5 }), 0, 0.06, 0, g); ribbon.rotation.x = Math.PI / 2; ribbon.scale.set(1.08, 1, 1);
  g.userData.anim = (t) => { feathers.forEach((f, i) => (f.rotation.z = (i - 2) * 0.28 + Math.sin(t * 1.8 + i * 0.7) * 0.06)); gems.forEach((m, i) => (m.material.emissiveIntensity = 0.9 + Math.sin(t * 3 + i * 1.7) * 0.6)); };
  return g;
}
function maskOni() { // Lv60 · 황금 귀신 탈: 얼굴보다 훨씬 크다 — 뿔 · 송곳니 · 붉게 타오르는 눈 · 둘레의 기운
  const g = new THREE.Group(), R = 0.53;
  g.add(maskPlate('oni', R, 2.62, 0.62, 1.96, 640, 480, (x, P, W, H) => {
    pathOf(x, P, [[0, 0.64], [0.5, 0.7], [0.95, 0.9], [1.28, 1.28], [1.26, 1.72], [1.08, 1.98], [0.8, 2.3], [0.42, 2.54], [0, 2.58], [-0.42, 2.54], [-0.8, 2.3], [-1.08, 1.98], [-1.26, 1.72], [-1.28, 1.28], [-0.95, 0.9], [-0.5, 0.7]]);
    const bg = x.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H * 0.5, W * 0.6); bg.addColorStop(0, '#fff0a0'); bg.addColorStop(0.55, '#f2c440'); bg.addColorStop(1, '#a8700e'); x.fillStyle = bg; x.fill();
    x.lineWidth = 12; x.strokeStyle = '#7a1010'; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#ffe9a0'; x.stroke();
    x.save(); x.clip();
    x.fillStyle = 'rgba(180,20,20,.85)'; for (const s of [-1, 1]) { const [ax, ay] = P(s * 0.14, 1.36), [bx, by] = P(s * 1.08, 1.32), [cx, cy] = P(s * 0.7, 1.86); x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(bx, by - 60, bx, by); x.quadraticCurveTo(cx + s * 30, cy, cx, cy); x.quadraticCurveTo(ax, cy - 40, ax, ay); x.fill(); } // 눈가의 붉은 무늬
    x.strokeStyle = 'rgba(122,16,16,.8)'; x.lineWidth = 6; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const [ax, ay] = P(s * (0.8 + k * 0.12), 1.9 + k * 0.08), [bx, by] = P(s * (0.5 + k * 0.1), 2.15 + k * 0.08); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); } // 볼 주름
    const [mx, my] = P(0, 2.24); x.fillStyle = '#3a0606'; x.beginPath(); x.moveTo(mx - 120, my - 24); x.quadraticCurveTo(mx, my - 60, mx + 120, my - 24); x.quadraticCurveTo(mx + 80, my + 50, mx, my + 54); x.quadraticCurveTo(mx - 80, my + 50, mx - 120, my - 24); x.fill(); // 크게 벌린 입
    x.fillStyle = '#fff6e0'; for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(mx + k * 28 - 12, my - 36 + Math.abs(k) * 3); x.lineTo(mx + k * 28 + 12, my - 36 + Math.abs(k) * 3); x.lineTo(mx + k * 28, my - 18 + Math.abs(k) * 3); x.fill(); }
    const [nx, ny] = P(0, 1.86); x.fillStyle = '#c98a10'; x.beginPath(); x.ellipse(nx, ny, 40, 22, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#5a2a06'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(nx + s * 16, ny + 6, 9, 6, 0, 0, Math.PI * 2); x.fill(); }
    x.restore();
    for (const s of [-1, 1]) { const eye = () => { const [ex, ey] = eyeAt(P, s); x.beginPath(); x.moveTo(ex - s * 40, ey - 18); x.lineTo(ex + s * 46, ey - 4); x.quadraticCurveTo(ex + s * 10, ey + 34, ex - s * 40, ey - 18); x.closePath(); }; cutOut(x, eye); eye(); x.strokeStyle = '#ff3a1a'; x.lineWidth = 6; x.stroke(); }
  }, { roughness: 0.3, metalness: 0.45, emissiveIntensity: 0.42 }));
  const gold = M('#f2c440', { metalness: 0.8, roughness: 0.25, emissive: '#8a5a08', emissiveIntensity: 0.5 }), ivory = M('#fff3d6', { roughness: 0.4, emissive: '#5a4a2a', emissiveIntensity: 0.3 }), dred = M('#7a1010', { roughness: 0.5, emissive: '#3a0404', emissiveIntensity: 0.4 });
  for (const s of [-1, 1]) {
    const horn = new THREE.Group(); horn.position.copy(sph(R, s * 0.5, 0.72)); horn.rotation.set(-0.25, 0, -0.42 * s); g.add(horn);
    mesh(new THREE.ConeGeometry(0.08, 0.38, 16), ivory, 0, 0.2, 0, horn);
    for (const y of [0.02, 0.09]) { const r = mesh(new THREE.TorusGeometry(0.075 - y * 0.25, 0.016, 8, 18), gold, 0, y, 0, horn); r.rotation.x = Math.PI / 2; }
    const brow = mesh(new THREE.BoxGeometry(0.28, 0.06, 0.05), dred, 0, 0, 0, g); brow.position.copy(sph(R + 0.025, s * 0.44, 1.33)); brow.rotation.set(0, s * 0.42, s * 0.38);
    const fang = mesh(new THREE.ConeGeometry(0.03, 0.12, 10), ivory, 0, 0, 0, g); fang.position.copy(sph(R + 0.02, s * 0.3, 2.3)); fang.rotation.x = -0.25;
  }
  const eyes = [-1, 1].map((s) => { const e = glowSprite('#ff3a1a', 0.2, 0.9); e.position.copy(sph(R + 0.03, s * EYE_D, EYE_TH)); g.add(e); return e; });
  const aura = glowSprite('#ffb040', 1.9, 0.22); aura.position.z = -0.1; g.add(aura);
  g.userData.anim = (t) => { const k = 0.65 + Math.sin(t * 4) * 0.3; eyes.forEach((e) => { e.material.opacity = k; e.scale.setScalar(0.18 + k * 0.06); }); aura.material.opacity = 0.16 + Math.sin(t * 1.6) * 0.07; };
  return g;
}
function maskRabbit() { // 토끼 가면: 하얀 얼굴 · 분홍 볼 · 길쭉한 귀(한쪽이 가끔 폴짝 접힌다) · 앞니 두 개
  const g = new THREE.Group(), R = 0.466;
  g.add(maskPlate('rabbit', R, 2.0, 0.8, 1.42, 512, 360, (x, P) => {
    smoothPath(x, P, [[0, 0.86], [0.6, 0.9], [0.96, 1.2], [1.0, 1.66], [0.72, 2.02], [0.3, 2.2], [0, 2.2], [-0.3, 2.2], [-0.72, 2.02], [-1.0, 1.66], [-0.96, 1.2], [-0.6, 0.9]]);
    const [cx, cy] = P(0, 1.5), bg = x.createRadialGradient(cx, cy, 20, cx, cy, 280); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.8, '#fbf3f6'); bg.addColorStop(1, '#ead6de'); x.fillStyle = bg; x.fill();
    x.lineWidth = 6; x.strokeStyle = '#f3a6c0'; x.stroke();
    for (const s of [-1, 1]) { const [bx, by] = P(s * 0.62, 1.84), bl = x.createRadialGradient(bx, by, 4, bx, by, 44); bl.addColorStop(0, 'rgba(255,130,170,.55)'); bl.addColorStop(1, 'rgba(255,130,170,0)'); x.fillStyle = bl; x.fillRect(bx - 50, by - 50, 100, 100); }
    x.strokeStyle = 'rgba(120,90,100,.7)'; x.lineWidth = 3; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const [ax, ay] = P(s * 0.2, 1.9 + k * 0.04); x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + s * 80, ay - 14 + k * 14); x.stroke(); } // 수염
    x.strokeStyle = '#c0607e'; x.lineWidth = 4; const [mx, my] = P(0, 1.96); x.beginPath(); x.moveTo(mx, my - 12); x.lineTo(mx, my); x.quadraticCurveTo(mx - 10, my + 12, mx - 22, my + 4); x.moveTo(mx, my); x.quadraticCurveTo(mx + 10, my + 12, mx + 22, my + 4); x.stroke();
    for (const s of [-1, 1]) { const [ex, ey] = eyeAt(P, s); cutOut(x, () => { x.beginPath(); x.ellipse(ex, ey, 26, 30, 0, 0, Math.PI * 2); }); x.strokeStyle = '#f08ab0'; x.lineWidth = 5; x.beginPath(); x.ellipse(ex, ey, 28, 32, 0, 0, Math.PI * 2); x.stroke(); }
  }, { roughness: 0.85 }));
  const white = softM('#fffafc', '#ffffff', 0.22), pink = softM('#ffaac6', '#ff6a9a', 0.3);
  const ears = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.copy(sph(R, s * 0.3, 0.66)); eg.rotation.set(-0.2, 0, -0.16 * s); g.add(eg);
    mesh(new THREE.CapsuleGeometry(0.075, 0.4, 8, 14), white, 0, 0.27, 0, eg).scale.set(1, 1, 0.45);
    mesh(new THREE.CapsuleGeometry(0.045, 0.32, 8, 12), pink, 0, 0.27, 0.025, eg).scale.set(1, 1, 0.3);
    ears.push(eg);
  }
  mesh(new THREE.SphereGeometry(0.032, 12, 10), pink, 0, 0, 0, g).position.copy(sph(R + 0.02, 0, 1.86));
  for (const s of [-1, 1]) { const tooth = mesh(new THREE.BoxGeometry(0.03, 0.045, 0.012), M('#ffffff', { roughness: 0.3 }), 0, 0, 0, g); tooth.position.copy(sph(R + 0.006, s * 0.034, 2.05)); }
  g.userData.anim = (t) => { const fl = Math.max(0, Math.sin(t * 0.9)) ** 6; ears[0].rotation.x = -0.2 + fl * 1.1; ears[1].rotation.x = -0.2 + Math.sin(t * 2.4) * 0.05; ears[0].rotation.z = 0.16 + fl * 0.3; };
  return g;
}
function maskBear() { // 곰 가면: 갈색 털 · 둥근 귀 · 볼록 튀어나온 주둥이와 까만 코
  const g = new THREE.Group(), R = 0.47;
  g.add(maskPlate('bear', R, 2.2, 0.8, 1.5, 512, 360, (x, P, W, H) => {
    smoothPath(x, P, [[0, 0.84], [0.62, 0.88], [1.02, 1.18], [1.08, 1.66], [0.86, 2.06], [0.44, 2.26], [0, 2.28], [-0.44, 2.26], [-0.86, 2.06], [-1.08, 1.66], [-1.02, 1.18], [-0.62, 0.88]]);
    const [cx, cy] = P(0, 1.5), bg = x.createRadialGradient(cx, cy, 20, cx, cy, 300); bg.addColorStop(0, '#b57a44'); bg.addColorStop(0.75, '#8e5528'); bg.addColorStop(1, '#6a3c18'); x.fillStyle = bg; x.fill();
    x.save(); x.clip(); x.strokeStyle = 'rgba(70,35,12,.35)'; x.lineWidth = 2.5; for (let k = 0; k < 220; k++) { const px = (k * 97) % W, py = (k * 61 + (k % 7) * 13) % H, a = 1.2 + ((k * 37) % 10) * 0.08; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 9, py + Math.sin(a) * 9); x.stroke(); } // 털결
    const [mx, my] = P(0, 1.98); x.fillStyle = '#e2bf92'; x.beginPath(); x.ellipse(mx, my, 92, 62, 0, 0, Math.PI * 2); x.fill(); // 밝은 주둥이 털
    x.restore(); x.lineWidth = 6; x.strokeStyle = '#5a3010'; x.stroke();
    x.strokeStyle = '#4a2810'; x.lineWidth = 8; for (const s of [-1, 1]) { const [ax, ay] = eyeAt(P, s, -0.16, -0.2), [bx, by] = eyeAt(P, s, 0.18, -0.22); x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + bx) / 2, ay - 12, bx, by); x.stroke(); } // 눈썹
    for (const s of [-1, 1]) { const [ex, ey] = eyeAt(P, s); cutOut(x, () => { x.beginPath(); x.arc(ex, ey, 26, 0, Math.PI * 2); }); x.strokeStyle = '#3a1e0a'; x.lineWidth = 5; x.beginPath(); x.arc(ex, ey, 28, 0, Math.PI * 2); x.stroke(); }
  }, { roughness: 0.95 }));
  const fur = softM('#8e5528', '#4a2810', 0.2), tan = softM('#e2bf92', '#8a6a40', 0.2), inner = softM('#d89a7a', '#6a3a20', 0.2);
  const ears = [];
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.12, 16, 12), fur, 0, 0, 0, g); e.position.copy(sph(R, s * 0.66, 0.86)); e.position.y += 0.05; e.scale.set(1, 1, 0.55);
    mesh(new THREE.SphereGeometry(0.07, 12, 10), inner, 0, -0.01, 0.06, e).scale.set(1, 1, 0.5); ears.push(e);
  }
  const muz = mesh(new THREE.SphereGeometry(0.14, 18, 14), tan, 0, 0, 0, g); muz.position.copy(sph(R - 0.02, 0, 1.96)); muz.scale.set(1.25, 0.85, 0.9);
  const nose = mesh(new THREE.SphereGeometry(0.05, 14, 10), M('#1a100c', { roughness: 0.25 }), 0, 0, 0, g); nose.position.copy(sph(R + 0.1, 0, 1.88)); nose.scale.set(1.35, 0.9, 0.8);
  const mouth = mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 14, Math.PI), M('#3a1e0a'), 0, 0, 0, g); mouth.position.copy(sph(R + 0.11, 0, 2.04)); mouth.rotation.z = Math.PI;
  g.userData.anim = (t) => ears.forEach((e, i) => (e.rotation.z = Math.sin(t * 1.6 + i * 2) * 0.08));
  return g;
}
function maskWolf() { // 늑대 가면: 잿빛 털 · 뾰족 귀 · 길게 튀어나온 주둥이와 송곳니 · 노랗게 빛나는 눈
  const g = new THREE.Group(), R = 0.47;
  g.add(maskPlate('wolf', R, 2.3, 0.78, 1.56, 512, 380, (x, P, W, H) => {
    pathOf(x, P, [[0, 0.84], [0.32, 0.86], [0.66, 0.9], [0.98, 1.14], [1.1, 1.5], [1.04, 1.74], [1.16, 1.9], [0.92, 1.98], [1.0, 2.12], [0.7, 2.14], [0.5, 2.3], [0, 2.32], [-0.5, 2.3], [-0.7, 2.14], [-1.0, 2.12], [-0.92, 1.98], [-1.16, 1.9], [-1.04, 1.74], [-1.1, 1.5], [-0.98, 1.14], [-0.66, 0.9], [-0.32, 0.86]]);
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#4c525e'); bg.addColorStop(0.5, '#7d8592'); bg.addColorStop(1, '#b8bec8'); x.fillStyle = bg; x.fill();
    x.save(); x.clip();
    const [mx, my] = P(0, 2.04); x.fillStyle = '#eef0f4'; x.beginPath(); x.moveTo(mx - 150, my + 70); x.quadraticCurveTo(mx - 90, my - 40, mx, my - 70); x.quadraticCurveTo(mx + 90, my - 40, mx + 150, my + 70); x.closePath(); x.fill(); // 하얀 볼·턱 털
    x.fillStyle = '#2e333c'; const [fx, fy] = P(0, 1.22); x.beginPath(); x.moveTo(fx - 70, fy - 50); x.lineTo(fx, fy + 70); x.lineTo(fx + 70, fy - 50); x.quadraticCurveTo(fx, fy - 10, fx - 70, fy - 50); x.fill(); // 이마의 짙은 V 무늬
    x.strokeStyle = 'rgba(30,34,40,.35)'; x.lineWidth = 2.5; for (let k = 0; k < 160; k++) { const px = (k * 89) % W, py = (k * 53) % (H * 0.7), a = 1.3 + ((k * 31) % 9) * 0.06; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 10, py + Math.sin(a) * 10); x.stroke(); }
    x.restore(); x.lineWidth = 6; x.strokeStyle = '#2e333c'; x.stroke();
    for (const s of [-1, 1]) { const eye = () => { const [ex, ey] = eyeAt(P, s); x.beginPath(); x.moveTo(ex - s * 38, ey + 12); x.lineTo(ex + s * 44, ey - 20); x.quadraticCurveTo(ex + s * 20, ey + 26, ex - s * 38, ey + 12); x.closePath(); }; cutOut(x, eye); eye(); x.strokeStyle = '#ffc61a'; x.lineWidth = 6; x.stroke(); }
  }, { roughness: 0.85 }));
  const grey = softM('#6a717e', '#2a2e36', 0.2), light = softM('#e8eaf0', '#8a8e98', 0.2), innerE = softM('#c8a0a8', '#5a3a40', 0.2), ivory = M('#fff6e6', { roughness: 0.35 });
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.12, 0.3, 14), grey, 0, 0, 0, g); ear.position.copy(sph(R, s * 0.56, 0.74)); ear.position.y += 0.1; ear.rotation.set(-0.12, 0, -0.3 * s); ear.scale.z = 0.55;
    ear.add(earInner(0.12, 0.3, innerE)); ears.push(ear);
  }
  const snout = mesh(new THREE.ConeGeometry(0.11, 0.26, 16), light, 0, 0, 0, g); snout.position.copy(sph(R + 0.1, 0, 1.92)); snout.rotation.x = Math.PI / 2; snout.scale.set(1.1, 1, 0.8);
  const top = mesh(new THREE.ConeGeometry(0.09, 0.24, 16), grey, 0, 0, 0, g); top.position.copy(sph(R + 0.1, 0, 1.86)); top.rotation.x = Math.PI / 2; top.scale.set(0.9, 1, 0.5);
  mesh(new THREE.SphereGeometry(0.035, 10, 8), M('#14100e', { roughness: 0.25 }), 0, 0, 0, g).position.copy(sph(R + 0.22, 0, 1.88));
  for (const s of [-1, 1]) { const f = mesh(new THREE.ConeGeometry(0.016, 0.07, 8), ivory, 0, 0, 0, g); f.position.copy(sph(R + 0.08, s * 0.08, 2.04)); f.rotation.x = Math.PI; }
  const eyes = [-1, 1].map((s) => { const e = glowSprite('#ffc61a', 0.14, 0.7); e.position.copy(sph(R + 0.02, s * EYE_D, EYE_TH)); g.add(e); return e; });
  g.userData.anim = (t) => { ears.forEach((e, i) => (e.rotation.z = (i ? 0.3 : -0.3) + Math.sin(t * 1.3 + i) * 0.05)); const k = 0.55 + Math.sin(t * 2.6) * 0.2; eyes.forEach((e) => (e.material.opacity = k)); };
  return g;
}
function maskGhost() { // 귀신 가면: 핏기 없는 창백한 얼굴 · 퀭한 눈 속 붉은 점 · 축 늘어진 입 · 피눈물 · 얼굴을 덮는 긴 검은 머리
  const g = new THREE.Group(), R = 0.468;
  g.add(maskPlate('ghost', R, 2.1, 0.8, 1.62, 512, 400, (x, P, W, H) => {
    smoothPath(x, P, [[0, 0.84], [0.6, 0.88], [0.98, 1.2], [1.02, 1.7], [0.8, 2.1], [0.4, 2.36], [0, 2.4], [-0.4, 2.36], [-0.8, 2.1], [-1.02, 1.7], [-0.98, 1.2], [-0.6, 0.88]]);
    const [cx, cy] = P(0, 1.55), bg = x.createRadialGradient(cx, cy, 20, cx, cy, 300); bg.addColorStop(0, '#f2f6fc'); bg.addColorStop(0.7, '#d2dae6'); bg.addColorStop(1, '#9aa6b8'); x.fillStyle = bg; x.fill();
    x.save(); x.clip();
    for (const s of [-1, 1]) { const [ex, ey] = eyeAt(P, s), sh = x.createRadialGradient(ex, ey, 22, ex, ey, 84); sh.addColorStop(0, 'rgba(18,16,34,.9)'); sh.addColorStop(1, 'rgba(18,16,34,0)'); x.fillStyle = sh; x.fillRect(ex - 90, ey - 90, 180, 180); } // 퀭한 눈두덩
    x.strokeStyle = 'rgba(90,100,130,.45)'; x.lineWidth = 2; for (const [d, th, a] of [[0.5, 1.15, 0.9], [-0.7, 1.9, -0.6], [0.75, 1.95, 0.4]]) { let [px, py] = P(d, th); x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += Math.cos(a + (k % 2 ? 0.6 : -0.5)) * 16; py += Math.sin(a + (k % 2 ? 0.6 : -0.5)) * 16 + 6; x.lineTo(px, py); } x.stroke(); } // 금
    x.fillStyle = '#7a0010'; for (const s of [-1, 1]) { const [ex, ey] = eyeAt(P, s, 0.03, 0.1); x.beginPath(); x.moveTo(ex - 5, ey); x.quadraticCurveTo(ex - 9, ey + 60, ex - 3, ey + (s < 0 ? 120 : 90)); x.lineTo(ex + 3, ey + (s < 0 ? 120 : 90)); x.quadraticCurveTo(ex + 7, ey + 60, ex + 5, ey); x.fill(); x.beginPath(); x.arc(ex, ey + (s < 0 ? 122 : 92), 6, 0, Math.PI * 2); x.fill(); } // 피눈물
    x.restore();
    const [mx, my] = P(0, 2.12);
    const mouth = () => { x.beginPath(); x.ellipse(mx, my, 24, 50, 0, 0, Math.PI * 2); };
    mouth(); x.fillStyle = '#0a0610'; x.fill(); x.strokeStyle = 'rgba(40,30,60,.6)'; x.lineWidth = 6; x.stroke(); // 축 늘어진 입 (속은 새까맣다)
    for (const s of [-1, 1]) { const eye = () => { const [ex, ey] = eyeAt(P, s); x.beginPath(); x.ellipse(ex, ey + 4, 34, 30, s * 0.3, 0, Math.PI * 2); }; cutOut(x, eye); eye(); x.strokeStyle = '#1a1424'; x.lineWidth = 7; x.stroke(); }
  }, { roughness: 0.6, emissive: '#cfe0ff', emissiveIntensity: 0.32 }));
  // 눈구멍 속에서 흔들리는 붉은 눈동자
  const eyes = [-1, 1].map((s) => { const e = glowSprite('#ff2020', 0.09, 0.9); e.position.copy(sph(R + 0.01, s * EYE_D, EYE_TH + 0.02)); g.add(e); return e; });
  // 가운데 가르마로 갈라져 얼굴 양옆을 덮고 늘어진 긴 검은 머리카락
  const hairM = M('#0c0a10', { roughness: 0.55 }), hair = [];
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
    const d0 = s * (0.12 + i * 0.12), pts = [];
    for (let k = 0; k <= 7; k++) { const th = 0.55 + k * 0.28, d = d0 + s * Math.max(0, th - 1.1) * 0.15 * (1 - i / 12); const v = sph(R + 0.035 + k * 0.004, d, Math.min(th, 2.1)); if (th > 2.1) v.y -= (th - 2.1) * 0.45; pts.push(v); }
    const hg = new THREE.Group(); g.add(hg);
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.014 + (i % 3) * 0.004, 5), hairM, 0, 0, 0, hg); hair.push(hg);
  }
  const aura = glowSprite('#9ab8ff', 1.4, 0.14); aura.position.z = -0.1; g.add(aura);
  g.userData.anim = (t) => {
    hair.forEach((h, i) => (h.rotation.z = Math.sin(t * 0.9 + i * 0.5) * 0.015));
    const f = Math.sin(t * 7) > 0.92 ? 0.25 : 1; eyes.forEach((e, i) => { e.material.opacity = 0.85 * f; e.position.x = sph(R, (i ? 1 : -1) * EYE_D, EYE_TH).x + Math.sin(t * 0.7) * 0.012; });
    aura.material.opacity = 0.1 + Math.sin(t * 1.3) * 0.05;
  };
  return g;
}
const MASKS = { mask_paper: maskPaper, mask_fox: maskFox, mask_hahoe: maskHahoe, mask_venice: maskVenice, mask_oni: maskOni, mask_rabbit: maskRabbit, mask_bear: maskBear, mask_wolf: maskWolf, mask_ghost: maskGhost };
/** 상점 가면 하나 (머리 기준 좌표 · 상점 미리보기에서도 쓴다) */
export function buildMask(id) { const f = MASKS[id]; if (!f) return null; const g = f(); g.userData.gold = true; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }
function setMask(g, id) {
  const u = g.userData;
  if (u.gMask) { u.gMask.parent?.remove(u.gMask); u.gMask = null; }
  u.gMaskId = id;
  if (id && u.head) { u.gMask = buildMask(id); if (u.gMask) u.head.add(u.gMask); }
}
function setCostume(g, id) {
  const u = g.userData;
  if (u.gCostume) { u.gCostume.parts.forEach((m) => m.parent?.remove(m)); u.gCostume = null; }
  // 원래 몸(옷·얼굴·머리카락·장신구)을 숨기거나 되돌린다 — 상점 날개·탈것·검은 그대로
  const keep = new Set([u.gWings, u.gMount, u.gSword, u.gSnack, u.gMask].filter(Boolean));
  // 트리 코스튬: 얼굴(머리)과 발은 그대로 보이고, 모자 · 동물 귀만 감춘다 (트리 꼭대기 별이 대신한다)
  const showRoots = id === 'costume_xmas' ? new Set([u.head, ...(u.legs || [])].filter(Boolean)) : null;
  const walk = (o, show) => { if (keep.has(o) || o.userData.gold) return; if (showRoots?.has(o)) show = true; if (show && (o.userData.hatPart || o.userData.earPart)) show = false; const hide = id && !show; if (o.isMesh && !o.userData.robot) { if (hide) { if (o.userData.vis0 == null) o.userData.vis0 = o.visible; o.visible = false; } else if (o.userData.vis0 != null) { o.visible = o.userData.vis0; delete o.userData.vis0; } } o.children.forEach((c) => walk(c, show)); };
  walk(u.rig, false);
  if (id === 'costume_robot') u.gCostume = robotParts(u);
  if (id === 'costume_xmas') u.gCostume = xmasParts(u);
  u.gCostumeId = id;
}
/** gear = "날개|탈것|타는중(1/0)|손에 든 것(0 없음 · 1 전설의 검 · 2 황금 고양이 지팡이)|코스튬|황금 고양이 부위 글자(hmgtbsl)" */
// ───── 손에 드는 간식: 팝콘(p) · STARMIA 커피(c). 뒤의 숫자는 남은 횟수(3·2·1) — 줄어들수록 덜 차 보인다
const _snackTex = {};
function snackTex(kind) {
  if (_snackTex[kind]) return _snackTex[kind];
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  if (kind === 'p') { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e8202a'; x.fillRect(i * 16, 0, 16, 64); } x.fillStyle = '#ffd23a'; x.font = '900 22px sans-serif'; x.textAlign = 'center'; x.fillText('POP', 64, 40); }
  else if (kind === 'h') { const bg = x.createLinearGradient(0, 0, 0, 64); bg.addColorStop(0, '#e8a33a'); bg.addColorStop(0.5, '#d48a28'); bg.addColorStop(1, '#b86e1a'); x.fillStyle = bg; x.fillRect(0, 0, 128, 64); x.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 60; i++) x.fillRect((i * 37) % 128, (i * 23) % 64, 2, 2); x.strokeStyle = '#d8202a'; x.lineWidth = 4; x.beginPath(); for (let i = 0; i <= 16; i++) x.lineTo(i * 8, 20 + (i % 2) * 22); x.stroke(); }
  else { x.fillStyle = '#fbf8f2'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#c99a62'; x.fillRect(0, 20, 128, 26); x.fillStyle = '#0f7a4a'; x.beginPath(); x.arc(64, 33, 15, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = '900 16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', 64, 34); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return (_snackTex[kind] = t);
}
export const BALLOON_COLORS = ['#ff4f6a', '#ffd23a', '#5ad1ff', '#9a7bff', '#7ee0a8', '#ff8fd0', '#ff9a3c', '#3c7bff', '#ffffff', '#c8ff4a'];
/** 풍선 하나: 바닥(0,0,0)이 손 · 줄이 위로 1.1 · 그 위에 풍선 (up 그룹은 매 프레임 하늘을 향하게 돌린다) */
export function buildBalloon(color, len = 1.1) {
  const g = new THREE.Group(), up = new THREE.Group(); g.add(up);
  up.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.03, len * 0.5, 0.02), new THREE.Vector3(0, len, 0)]), new THREE.LineBasicMaterial({ color: '#f4f0ea' })));
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05, emissive: color, emissiveIntensity: 0.18 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 16), mat); b.scale.set(1, 1.18, 1); b.position.y = len + 0.24; up.add(b);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 8), mat); knot.position.y = len + 0.005; up.add(knot);
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 })); shine.position.set(-0.08, len + 0.33, 0.15); up.add(shine);
  g.userData.up = up; g.userData.ball = b; return g;
}
export function buildSnack(code) {
  if (code[0] === 'b') { const g = buildBalloon(BALLOON_COLORS[Number(code[1]) || 0], 1.75); /* 큰 머리 위로 떠 있게 줄을 길게 */ g.userData.code = code; g.userData.balloon = true; return g; }
  const kind = code[0], n = Number(code[1]) || 1, g = new THREE.Group();
  if (kind === 'p') {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.2, 18, 1, true), new THREE.MeshStandardMaterial({ map: snackTex('p'), roughness: 0.6, side: THREE.DoubleSide })); cup.position.y = 0.1; g.add(cup);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshStandardMaterial({ color: '#e8202a' })); bottom.rotation.x = Math.PI / 2; g.add(bottom);
    const pm = [new THREE.MeshStandardMaterial({ color: '#fff6dc', roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: '#ffe28a', roughness: 0.7 })];
    const geo = new THREE.IcosahedronGeometry(0.032, 0);
    const kern = (x, y, z, i) => { const k = new THREE.Mesh(geo, pm[i % 2]); k.position.set(x, y, z); k.rotation.set(i, i * 2, 0); k.scale.setScalar(0.8 + (i % 3) * 0.2); g.add(k); };
    // 한 입 먹을 때마다 줄어든다: 3 = 통 위로 소복이 넘침 · 2 = 통 가장자리까지 · 1 = 바닥에 조금
    if (n >= 3) { for (let i = 0; i < 32; i++) { const a = i * 2.4, r = 0.1 * Math.sqrt((i + 0.5) / 32); kern(Math.cos(a) * r, 0.19 + 0.085 * (1 - (r / 0.1) ** 2), Math.sin(a) * r, i); } for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; kern(Math.cos(a) * 0.115, 0.205 - i * 0.012, Math.sin(a) * 0.115, i + 1); } }
    else if (n === 2) for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.085 * Math.sqrt((i + 0.5) / 16); kern(Math.cos(a) * r, 0.165 + (i % 3) * 0.008, Math.sin(a) * r, i); }
    else for (let i = 0; i < 6; i++) { const a = i * 2.4, r = 0.055 * Math.sqrt((i + 0.5) / 6); kern(Math.cos(a) * r, 0.03 + (i % 2) * 0.012, Math.sin(a) * r, i); }
  } else if (kind === 'h') {
    // 핫도그(꼬치에 꽂은 바삭한 핫도그): 한 입 먹을 때마다 위에서부터 짧아지고, 베어 문 자리에 이빨 자국 · 속 소시지가 보인다
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 8), new THREE.MeshStandardMaterial({ color: '#e8cf9a', roughness: 0.8 })); stick.position.y = 0.12; g.add(stick);
    const R = 0.047, y0 = 0.1, L = [0, 0.09, 0.15, 0.21][n];
    const batter = new THREE.MeshStandardMaterial({ map: snackTex('h'), roughness: 0.75, emissive: '#5a2a00', emissiveIntensity: 0.15 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 20, 1, true), batter); body.position.y = y0 + L / 2; g.add(body);
    const bot = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), batter); bot.position.y = y0; g.add(bot);
    if (n >= 3) { const top = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), batter); top.position.y = y0 + L; g.add(top); }
    else {
      const ty = y0 + L;
      const inner = new THREE.Mesh(new THREE.CircleGeometry(R * 0.98, 20), new THREE.MeshStandardMaterial({ color: '#f1d79a', roughness: 0.9 })); inner.rotation.x = -Math.PI / 2; inner.position.y = ty - 0.004; g.add(inner);
      const saus = new THREE.Mesh(new THREE.CircleGeometry(R * 0.5, 16), new THREE.MeshStandardMaterial({ color: '#c8553d', roughness: 0.6 })); saus.rotation.x = -Math.PI / 2; saus.position.y = ty - 0.002; g.add(saus);
      // 이빨 자국: 가장자리를 들쭉날쭉 둥글게 베어 문 모양
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, b = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), batter); b.position.set(Math.cos(a) * R * 0.86, ty - 0.004 + (k % 2 ? 0.012 : -0.002), Math.sin(a) * R * 0.86); b.scale.set(1, 0.8, 1); g.add(b); }
    }
  } else if (kind === 's') {
    // 솜사탕: 분홍 · 하늘색 구름 — 한 입마다 작아진다
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.7 })); stick.position.y = 0.1; g.add(stick);
    const puff = new THREE.Group(); puff.position.y = 0.3; g.add(puff);
    const pk = new THREE.MeshStandardMaterial({ color: '#ffb3d6', roughness: 1, emissive: '#ff6fae', emissiveIntensity: 0.25 }), bl = new THREE.MeshStandardMaterial({ color: '#bfe6ff', roughness: 1, emissive: '#6fc4ff', emissiveIntensity: 0.25 });
    puff.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), pk));
    for (let i = 0; i < 16; i++) { const a = i * 2.4, yy = ((i * 0.618) % 1) * 2 - 1, r = Math.sqrt(1 - yy * yy), b = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (i % 3) * 0.012, 10, 8), i % 3 === 2 ? bl : pk); b.position.set(Math.cos(a) * r * 0.1, yy * 0.09, Math.sin(a) * r * 0.1); puff.add(b); }
    puff.scale.setScalar([0, 0.55, 0.78, 1][n]); puff.position.y = 0.2 + 0.1 * [0, 0.55, 0.78, 1][n];
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
  const [w = '', m = '', riding = '0', sword = '0', costume = '', gold = '', snack = '', mask = ''] = gear.split('|');
  const sn = /^([pchs][123]|b[0-9])$/.test(snack) ? snack : '';
  if ((u.gSnackCode || '') !== sn) { u.gSnack?.parent?.remove(u.gSnack); u.gSnack = null; u.gSnackCode = sn; const arm = u.arms?.[1]; if (sn && arm) { const it = buildSnack(sn); if (!it.userData.balloon) it.scale.setScalar(1.35); it.position.set(0.02 * Math.sign(arm.position.x || 1), -0.36, 0.09); u.gSnack = it; arm.add(it); } }
  if (u.gWingsId !== w) { if (u.gWings) u.rig.remove(u.gWings); u.gWings = w ? buildWings(w) : null; if (u.gWings) u.rig.add(u.gWings); u.gWingsId = w; }
  const mid = riding === '1' ? m : '';
  if (u.gMountId !== mid) { if (u.gMount) g.remove(u.gMount); u.gMount = mid ? buildMount(mid) : null; if (u.gMount) g.add(u.gMount); u.gMountId = mid; }
  const sw = sword === '1' || sword === '2' || sword === '3' ? sword : '';
  if ((u.gSwordKind || '') !== sw) {
    if (u.gSword) u.gSword.parent?.remove(u.gSword);
    u.gSword = null; u.gSwordKind = sw;
    if (sw === '1' && u.arms?.[0]) { const s = buildSword(); s.position.set(-0.09, -0.33, 0.04); s.rotation.set(Math.PI / 2 - 0.25, 0, 0); s.scale.setScalar(1.25); u.arms[0].add(s); u.gSword = s; }
    if (sw === '3' && u.arms?.[0]) { const s = buildChainsaw(); s.position.set(-0.06, -0.33, 0.04); s.rotation.set(Math.PI / 2 + 0.75, 0, 0); s.scale.setScalar(1.45); u.arms[0].add(s); u.gSword = s; }
    if (sw === '2' && u.arms?.[0]) { const s = buildStaff(); s.position.set(-0.1, -0.33, 0.05); s.rotation.set(0.66, 0, 0.36); u.arms[0].add(s); u.gSword = s; } // 머리에 묻히지 않게 바깥으로 기울여 든다
  }
  // 트리 코스튬은 얼굴이 드러나므로 가면 한 개를 함께 쓸 수 있다.
  const mk = (!costume || costume === 'costume_xmas') && Object.hasOwn(MASKS, mask) ? mask : '';
  const costumeGold = costume === 'costume_xmas' ? gold.replace(/[^m]/g, '') : costume ? '' : gold;
  const gset = mk ? costumeGold.replace('m', '') : costumeGold;
  if ((u.gCostumeId || '') !== costume) { if (u.gGold) setGold(g, ''); if (u.gMask) setMask(g, ''); setCostume(g, costume); }
  if ((u.gGoldSet || '') !== gset) setGold(g, gset);
  if ((u.gMaskId || '') !== mk) setMask(g, mk);
}
/** animateAvatar 다음에 부른다: 날개·탈것 움직임 + 탄 자세 + 검 휘두르기 + 간식 들기·먹기 */
export function animateGear(g, t, dt, moving) {
  const u = g.userData;
  try { animateSnack(u, t, dt, moving); } catch {}
  u.gWings?.userData.anim(t);
  u.gCostume?.anim(t);
  u.gGold?.anim(t, moving);
  u.gMask?.userData.anim?.(t);
  if (u.gMount) {
    // 점프: animateAvatar 가 먼저 올려 둔 몸 높이를 기억해 두었다가 탈것과 함께 폴짝 띄운다
    const jy = u.expr === 'jump' ? Math.max(0, u.rig.position.y) : 0;
    u.gMount.userData.anim(t, moving);
    const seat = u.gMount.userData.seat + (u.gMount.userData.float ? u.gMount.position.y : u.gMount.position.y * 0.6);
    u.gMount.position.y += jy;
    u.rig.position.y = seat + jy + Math.sin(t * 2) * 0.005;
    u.rig.rotation.x = 0;
    if (u.legs) { u.legs[0].rotation.set(-1.25, 0, -0.45); u.legs[1].rotation.set(-1.25, 0, 0.45); }
    // 운전 자세: 두 팔을 앞으로 뻗어 핸들(고삐·빗자루 자루)을 잡는다 — 걸을 때처럼 흔들지 않는다. 점프 중에는 만세 (점프 동작이 든 팔 그대로)
    if (u.arms && !jy) { const sway = Math.sin(t * 1.8) * 0.04; u.arms[0].rotation.set(-1.15 + sway, 0, 0.32); u.arms[1].rotation.set(-1.15 - sway, 0, -0.32); }
  }
  if (u.gSword) {
    u.gSword.userData.anim(t, u.swingT > 0);
    if (u.swingT > 0) { u.swingT -= dt; const k = 1 - Math.max(0, u.swingT) / 0.45; u.arms[0].rotation.x = -2.6 + Math.sin(k * Math.PI) * 2.4; u.arms[0].rotation.z = -0.3; }
    else if (u.gSwordKind === '2' && !u.gMount) { u.arms[0].rotation.x = -0.5 + (moving ? Math.sin(t * 9) * 0.07 : 0); } // 지팡이: 걸을 때도 세워서 든다 (긴 지팡이가 땅을 휘젓지 않게)
    else if (!moving) { u.arms[0].rotation.x = -0.5; }
  }
}

/** 간식을 든 팔: 앞으로 들고 다니고(걷거나 앉아도 그대로), 먹을 때(eatT) 입으로 가져간다. 다른 동작이 정한 팔 자세를 덮어쓴다 */
const _rest = new THREE.Vector3(), _mouth = new THREE.Vector3(), _up = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _e = new THREE.Euler();
function animateSnack(u, t, dt, moving) {
  if (!u.gSnack || !u.arms?.[1]) { u.eatT = 0; return; }
  const arm = u.arms[1], s = Math.sign(arm.position.x || 1);
  if (u.gSnack.userData.balloon) { // 풍선: 줄을 쥔 손은 살짝 들고, 풍선은 늘 하늘을 향해 둥실둥실
    u.eatT = 0;
    arm.rotation.set(-1.05 + (moving ? Math.sin(t * 9) * 0.05 : 0), 0, -s * 0.1); // 손을 앞으로 내밀어
    u.gSnack.position.set(0.02 * s, -0.42, 0.06); u.gSnack.rotation.set(0, 0, 0);
    u.gSnack.updateWorldMatrix(true, false); u.gSnack.getWorldQuaternion(_q).invert();
    // 풍선은 캐릭터가 바라보는 쪽으로 기울여 머리 앞에 뜨게 (걸으면 조금 덜 기울어 뒤로 끌린다)
    u.rig.getWorldQuaternion(_q3);
    _e.set(0.42 + Math.sin(t * 1.3) * 0.08 + (moving ? -0.14 : 0), 0, Math.sin(t * 1.7 + 1) * 0.08);
    u.gSnack.userData.up.quaternion.copy(_q).multiply(_q3).multiply(_q2.setFromEuler(_e));
    return;
  }
  let k = 0; if (u.eatT > 0) { u.eatT = Math.max(0, u.eatT - dt); k = Math.sin(Math.PI * (1 - u.eatT / 0.9)); }
  arm.rotation.set(-0.85 - k * 0.45 + (moving && !k ? Math.sin(t * 9) * 0.05 : 0), 0, -s * (0.18 + k * 0.45)); // 먹을 때 팔은 살짝만
  // 손에 든 컵은 세운 채로 (먹을 때만 입 쪽으로 기울인다)
  // 팔이 앞으로 들리면 손 앞(-y 쪽)으로 더 내밀어 큰 머리에 묻히지 않게 하고, 컵 윗부분만 입 쪽으로 살짝 기울인다
  u.gSnack.rotation.set(0.85 + k * 0.45, 0, s * (0.18 + k * 0.62)); // 팔이 기운 만큼 되돌려 컵은 똑바로 선 채로
  _rest.set(0.02 * s, -0.36, 0.09);
  if (u.gCostumeId === 'costume_xmas' && u.head && u.rig) { // 트리 안에 팔이 묻혀 있으니 간식은 트리 앞 · 얼굴 구멍 아래에 들고, 먹을 때 구멍 속 입으로
    u.rig.updateMatrixWorld(true);
    u.head.localToWorld(_rest.set(s * 0.22, -0.46, 0.66)); arm.worldToLocal(_rest);
    u.head.localToWorld(_mouth.set(s * 0.06, -0.3, 0.6)); arm.worldToLocal(_mouth);
    u.gSnack.position.lerpVectors(_rest, _mouth, k);
  } else if (k > 0 && u.head && u.rig) {
    // 먹는 동안: 손에서 '입 바로 앞'(얼굴 가운데 아래쪽)으로 끌어온다 — 팔이 옆에 달려 있어서 팔만 돌리면 볼 쪽으로 가기 때문
    u.rig.updateMatrixWorld(true);
    // 머리 아래쪽 한가운데(입 · 턱 바로 앞)까지: 컵·통 바닥이 턱보다 조금 아래, 윗부분이 입에 닿는 높이
    u.head.localToWorld(_mouth.set(s * 0.08, -0.41, 0.4)); arm.worldToLocal(_mouth); // 든 손 쪽으로 쏠려 보이지 않게 입 한가운데로
    u.gSnack.position.lerpVectors(_rest, _mouth, k);
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
/** 손에서 놓친 풍선: 그 자리에서 흔들흔들 하늘로 올라가며 작아져 사라진다 */
export function releaseBalloon(held) {
  if (!fxScene || !held?.userData.ball) return;
  const p = new THREE.Vector3(); held.userData.ball.getWorldPosition(p);
  const col = held.userData.ball.material.color.getStyle();
  const b = buildBalloon(col, 0.7); b.position.set(p.x, p.y - 0.9, p.z);
  const x0 = b.position.x, z0 = b.position.z, y0 = b.position.y, ph = Math.random() * 6;
  addFx(b, 5, (o, t) => { o.position.set(x0 + Math.sin(t * 2 + ph) * 0.35 + t * 0.3, y0 + t * 1.6 + t * t * 0.35, z0 + Math.cos(t * 1.6 + ph) * 0.25); o.rotation.z = Math.sin(t * 2.5 + ph) * 0.25; o.scale.setScalar(Math.max(0.01, 1 - Math.max(0, t - 3) / 2)); });
}
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
  const saw = gold === 'saw';
  const arc = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.15, 32, 1, -0.9, 1.8), new THREE.MeshBasicMaterial({ color: saw ? '#ff7a1a' : gold ? '#ffd24a' : '#7fd8ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  arc.position.set(x, y + 0.75, z); arc.rotation.set(-Math.PI / 2, 0, -ry + Math.PI / 2);
  addFx(arc, 0.35, (o, t) => { o.material.opacity = 0.8 * (1 - t / 0.35); o.rotation.z += 0.18; });
  if (hit) {
    const n = 120; const pts = particles(n, saw ? ['#ff8a2a', '#ffd23a', '#ff3a1a'] : gold ? ['#ffe27a', '#ffffff', '#ffb02e'] : ['#9ae8ff', '#ffffff', '#5ab8ff'], 0.22); const p = pts.geometry.attributes.position; const v = [];
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
/** 선물상자가 펑! 하얀 연기 뭉치와 금빛 반짝이를 남기고 사라진다 */
export function giftPuffFx(x, y, z) {
  if (!fxScene) return;
  const n = 70, pts = particles(n, ['#ffffff', '#f2eef6', '#e6e0ec', '#fff8ee'], 0.9, false), p = pts.geometry.attributes.position, v = [];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2, sp = 0.8 + Math.random() * 1.8; v.push([Math.cos(a) * sp, 0.5 + e * 1.4, Math.sin(a) * sp]); p.setXYZ(i, x + Math.cos(a) * 0.15, y + Math.random() * 0.3, z + Math.sin(a) * 0.15); }
  pts.material.opacity = 0.95;
  addFx(pts, 2.2, (o, t, dt) => { for (let i = 0; i < n; i++) { const q = v[i]; q[0] *= 0.93; q[2] *= 0.93; q[1] *= 0.95; p.setXYZ(i, p.getX(i) + q[0] * dt, p.getY(i) + q[1] * dt, p.getZ(i) + q[2] * dt); } p.needsUpdate = true; o.material.size = 0.9 + t * 1.1; o.material.opacity = 0.95 * Math.max(0, 1 - t / 2.2); });
  const m = 40, sp = particles(m, ['#ffd23a', '#fff2a8', '#ff6a7a', '#9ae8ff'], 0.22), sq = sp.geometry.attributes.position, sv = [];
  for (let i = 0; i < m; i++) { const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 2.5; sv.push([Math.cos(a) * s, 2 + Math.random() * 3, Math.sin(a) * s]); sq.setXYZ(i, x, y + 0.3, z); }
  addFx(sp, 1.6, (o, t, dt) => { for (let i = 0; i < m; i++) { const q = sv[i]; q[1] -= 5 * dt; sq.setXYZ(i, sq.getX(i) + q[0] * dt, Math.max(0.05, sq.getY(i) + q[1] * dt), sq.getZ(i) + q[2] * dt); } sq.needsUpdate = true; o.material.opacity = Math.max(0, 1 - t / 1.6); });
}
export function updateFx(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t += dt; f.step(f.obj, f.t, dt);
    if (f.t >= f.life) { fxScene.remove(f.obj); f.obj.geometry?.dispose(); if (f.obj.material && !f.obj.material.map?.isCanvasTexture) f.obj.material.dispose?.(); FX.splice(i, 1); }
  }
}
export const fxCount = () => FX.length;

// ───────────── 💵 돈다발 (테마 속에 3% 확률로 숨어 있다 · 1,000코인)
let _billTex = null;
function billTex() {
  if (_billTex) return _billTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 256, 128); gr.addColorStop(0, '#f6d67a'); gr.addColorStop(0.5, '#e9bc4a'); gr.addColorStop(1, '#f3cf6a'); x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#9a6e14'; x.lineWidth = 4; x.strokeRect(6, 6, 244, 116); x.lineWidth = 1.5; x.strokeRect(13, 13, 230, 102);
  x.strokeStyle = 'rgba(140,96,16,0.35)'; for (let i = 0; i < 256; i += 6) { x.beginPath(); x.moveTo(i, 14); x.lineTo(i + 18, 114); x.stroke(); }
  // 가운데 초상 메달
  x.fillStyle = '#d9a73a'; x.beginPath(); x.ellipse(128, 64, 30, 38, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#8a5e10'; x.lineWidth = 3; x.stroke();
  x.fillStyle = '#9a6a18'; x.beginPath(); x.arc(128, 54, 11, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(128, 86, 18, 13, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#7a520c'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const [px, py] of [[38, 32], [218, 32], [38, 96], [218, 96]]) x.fillText('1000', px, py);
  x.font = 'bold 13px sans-serif'; x.fillText('MIA BANK', 128, 18);
  _billTex = new THREE.CanvasTexture(c); _billTex.colorSpace = THREE.SRGBColorSpace;
  return _billTex;
}
export function buildCashStack() {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const top = new THREE.MeshStandardMaterial({ map: billTex(), metalness: 0.55, roughness: 0.35, emissive: '#5a3a00', emissiveIntensity: 0.35 });
  const side = M('#e2b445', { metalness: 0.6, roughness: 0.35, emissive: '#4a3000', emissiveIntensity: 0.3 });
  const band = M('#7a4e10', { metalness: 0.5, roughness: 0.4 });
  const bw = 0.5, bd = 0.24, bh = 0.09;
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group(); b.position.y = i * (bh + 0.006); b.rotation.y = (i - 1) * 0.12; spin.add(b);
    mesh(new THREE.BoxGeometry(bw, bh, bd), [side, side, top, top, side, side], 0, bh / 2, 0, b);
    for (let k = 1; k < 6; k++) mesh(new THREE.BoxGeometry(bw + 0.004, 0.003, bd + 0.004), M('#b98a28'), 0, (bh * k) / 6, 0, b); // 지폐 겹 줄무늬
    mesh(new THREE.BoxGeometry(0.09, bh + 0.008, bd + 0.012), band, 0, bh / 2, 0, b); // 가운데 띠
  }
  const glow = glowSprite('#ffd24a', 1.4, 0.55); glow.position.y = 0.18; g.add(glow);
  const sparks = []; for (let i = 0; i < 8; i++) { const s = glowSprite('#fff2b0', 0.12, 0.8); g.add(s); sparks.push(s); }
  g.userData.anim = (t) => {
    spin.rotation.y = t * 1.6; spin.position.y = 0.35 + Math.sin(t * 2.2) * 0.08;
    glow.position.y = spin.position.y + 0.14; glow.material.opacity = 0.4 + Math.sin(t * 3) * 0.15;
    sparks.forEach((s, i) => { const a = t * 1.2 + i * 0.785, k = (t * 0.5 + i / 8) % 1; s.position.set(Math.cos(a) * 0.45, 0.25 + k * 0.7, Math.sin(a) * 0.45); s.material.opacity = 0.9 * (1 - k); });
  };
  return g;
}
