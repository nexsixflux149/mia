import * as THREE from 'three';
import { textSprite } from './avatar.js';

const gold = '#d9ab63';
const warm = '#ffdb9b';
const ice = '#a2e3ff';
const green = '#142f2b';
const blue = '#1a263a';
const burgundy = '#721f3d';
const metal = (color, glow = '#000000', e = 0) => new THREE.MeshStandardMaterial({
  color, metalness: .32, roughness: .39, emissive: glow, emissiveIntensity: e,
});
function part(root, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}
const box = (g, m, w, h, d, x, y, z) => part(g, new THREE.BoxGeometry(w, h, d), m, x, y, z);
const hoop = (g, m, r, t, x, y, z) => part(g, new THREE.TorusGeometry(r, t, 8, 48), m, x, y, z);
function star(g, m, radius, x, y, z) {
  const points = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? radius * .38 : radius;
    points[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  points.closePath();
  return part(g, new THREE.ExtrudeGeometry(points, { depth: .07, bevelEnabled: true, bevelThickness: .025, bevelSize: .02, bevelSegments: 2 }), m, x, y, z);
}
function label(g, str, x, y, z, width) {
  const sign = textSprite(str, { size: 23, bg: 'rgba(15,21,27,.96)', color: '#ffe9bb', border: '#ae8152', maxW: 700 });
  sign.position.set(x, y, z);
  sign.scale.multiplyScalar(width / sign.scale.x);
  g.add(sign);
}
function gift(g, m, ribbon, s, x, y, z) {
  const parcel = new THREE.Group();
  parcel.position.set(x, y, z);
  g.add(parcel);
  box(parcel, m, s, s * .78, s, 0, .39 * s, 0);
  box(parcel, m, s * 1.08, .14 * s, s * 1.08, 0, .79 * s, 0);
  box(parcel, ribbon, s * .15, .86 * s, s * 1.085, 0, .43 * s, 0);
  box(parcel, ribbon, s * 1.085, .86 * s, s * .15, 0, .43 * s, 0);
  for (const side of [-1, 1]) {
    const loop = hoop(parcel, ribbon, s * .14, s * .028, side * s * .12, s * .96, 0);
    loop.rotation.z = side * .45; loop.scale.y = .63;
  }
  return parcel;
}
export function buildXmasProp(p) {
  if (!['xmas_stack', 'xmas_fir', 'xmas_console', 'xmas_sign'].includes(p.t)) return null;
  const group = new THREE.Group();
  const brass = metal(gold, '#9a5824', .23);
  const ember = metal(warm, '#ffd18a', 2.0);
  if (p.t === 'xmas_stack') {
    group.userData.foot = [1.8, 1.3];
    const wood = metal('#3f292d'), red = metal(burgundy), teal = metal('#244b45'), paper = metal('#b4a28e');
    box(group, wood, 1.8, .14, 1.25, 0, .09, 0);
    gift(group, red, brass, .72, -.49, .16, .11).rotation.y = .13;
    gift(group, teal, brass, .98, .34, .16, -.09).rotation.y = -.1;
    gift(group, paper, brass, .43, .39, 1.02, -.1).rotation.y = .2;
    return group;
  }
  if (p.t === 'xmas_fir') {
    group.userData.foot = [1.45, 1.45];
    const leaf = metal('#1b4a3a', '#123225', .35);
    part(group, new THREE.CylinderGeometry(.11, .21, 1.05, 9), metal('#39251f'), 0, .52, 0);
    for (let j = 0; j < 7; j++) {
      const radius = 1.14 - j * .135, y = .57 + j * .43;
      const cone = part(group, new THREE.ConeGeometry(radius, 1.24, 18), leaf, 0, y + .54, 0);
      cone.rotation.y = j * .24;
      for (let k = 0; k < 9; k++) {
        const a = Math.PI * 2 * k / 9 + j * .53;
        part(group, new THREE.SphereGeometry(.045, 6, 5), ember, Math.cos(a) * radius * .83, y + .15, Math.sin(a) * radius * .83);
      }
    }
    star(group, ember, .26, 0, 4.06, 0);
    return group;
  }
  const panel = metal(blue, '#0a1528', .2);
  if (p.t === 'xmas_sign') {
    group.userData.foot = [.62, .52];
    box(group, panel, .63, .13, .51, 0, .07, 0);
    box(group, brass, .085, 1.11, .085, 0, .72, 0);
    box(group, brass, .94, .55, .12, 0, 1.47, 0);
    box(group, panel, .84, .45, .13, 0, 1.47, .009);
    box(group, ember, .53, .024, .013, 0, 1.5, .08);
    return group;
  }
  group.userData.foot = [1.45, .88];
  box(group, panel, 1.42, .18, .88, 0, .09, 0);
  box(group, panel, .93, .84, .58, 0, .57, 0);
  box(group, brass, 1.48, .17, .82, 0, 1.08, 0);
  box(group, panel, 1.38, .16, .74, 0, 1.19, 0);
  const screen = box(group, metal('#2d5364', '#58cffc', .56), 1.09, .09, .42, 0, 1.29, -.065);
  screen.rotation.x = -.13;
  for (let i = 0; i < 4; i++) {
    const cap = part(group, new THREE.CylinderGeometry(.055, .068, .07, 10), ember, -.36 + i * .24, 1.3, .25);
    cap.rotation.z = Math.PI / 2;
  }
  return group;
}

export function decorateXmas(root, chapter, { cinema = false } = {}) {
  const winter = chapter === 1;
  const brass = metal(gold, '#a05c2c', .30);
  const rail = metal(winter ? '#2a616e' : chapter === 2 ? '#364565' : green, winter ? '#124552' : '#070b15', .45);
  const jewel = metal(winter ? ice : warm, winter ? '#72d1eb' : '#ffae5a', 2);
  const dim = metal(chapter === 2 ? '#22304b' : '#1b3934', '#121a28', .43);
  const panel = metal(chapter === 2 ? '#2f3554' : '#18352f', '#18263a', .19);
  const walk = metal(winter ? '#6293a3' : '#7a293d', winter ? '#335e75' : '#1f0918', .24);
  const size = winter ? 22 : 20;

  box(root, walk, 3.3, .017, size - 2.5, 0, .027, .1);
  for (const side of [-1, 1]) box(root, brass, .035, .018, size - 2.65, side * 1.67, .039, .1);
  const ambient = new THREE.HemisphereLight(winter ? '#d2f4ff' : '#ffe1b8', winter ? '#42617a' : '#514061', winter ? 1.9 : 1.25);
  root.add(ambient);
  function light(color, power, x, y, z) {
    const l = new THREE.PointLight(color, power, 15, 2);
    l.position.set(x, y, z);
    root.add(l);
    return l;
  }
  light(winter ? '#b8efff' : '#ffcd87', 36, 0, 4.1, -.7);
  light(chapter === 0 ? '#ffc467' : '#7be4ff', 29, -6.5, 3.7, -5.8);
  light(chapter === 2 ? '#c9acff' : '#ffb272', 26, 6, 3.5, 3.6);

  if (winter) {
    const glass = new THREE.MeshPhysicalMaterial({ color: '#83c1da', metalness: .10, roughness: .22, transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide });
    for (const z of [-8, -4, 0, 4, 8]) {
      const arch = part(root, new THREE.TorusGeometry(7.35, .071, 7, 52, Math.PI), rail, 0, .11, z);
      arch.scale.y = .79;
      for (const s of [-1, 1]) {
        box(root, brass, .085, .95, .11, s * 7.3, .5, z);
        box(root, glass, .028, 2.9, 3.80, s * 7.24, 1.66, z - 1.97);
      }
      for (let i = 1; i <= 9; i++) {
        const a = i / 10 * Math.PI;
        part(root, new THREE.SphereGeometry(.062, 8, 6), jewel, Math.cos(a) * 7.35, .11 + Math.sin(a) * 5.81, z);
      }
    }
    for (const x of [-6.2, -3.6, 0, 3.6, 6.2]) {
      const y = .11 + Math.sqrt(1 - (x / 7.35) ** 2) * 5.81;
      box(root, rail, .072, .08, 16.3, x, y, 0);
    }
  } else {
    for (const z of [-7.6, -3.8, 0, 3.8, 7.6]) {
      for (const s of [-1, 1]) {
        box(root, rail, .31, 4.08, .34, s * 10.65, 2.04, z);
        box(root, brass, .38, .12, .42, s * 10.65, 3.33, z);
        const lamp = part(root, new THREE.SphereGeometry(.19, 10, 8), jewel, s * 10.6, 3.22, z + .22);
        lamp.scale.y = 1.4;
      }
      box(root, rail, 21.34, .13, .26, 0, 4.01, z);
      for (let k = 0; k < 19; k++) {
        const x = (k - 9) * .99;
        part(root, new THREE.SphereGeometry(.046, 7, 5), jewel, x, 3.76 - .17 * Math.cos(x * .51), z);
      }
    }
  }

  let clock;
  const gears = [];
  if (chapter === 0) {
    for (const side of [-1, 1]) {
      const x = side * 8.54;
      box(root, dim, 3.3, 2.84, .28, x, 1.45, -8.85);
      for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) {
        const yy = .42 + row * .5, xx = x + (col - 2.5) * .48;
        box(root, panel, .44, .43, .25, xx, yy, -8.65);
        box(root, brass, .13, .034, .035, xx, yy, -8.50);
      }
    }
    for (const x of [-4.6, 4.6]) {
      hoop(root, brass, .72, .055, x, 2.66, -8.77);
      hoop(root, dim, .62, .09, x, 2.66, -8.79);
      star(root, jewel, .33, x, 2.66, -8.67);
      for (const a of [-.6, .6]) box(root, brass, 1.48, .045, .08, x, 1.8 + a, -8.74);
    }
    label(root, '제 0 우체국  ·  23:57', 0, 3.28, -8.44, 4.85);
  } else if (winter) {
    const prismMaterial = new THREE.MeshPhysicalMaterial({
      color: ice, metalness: .18, roughness: .18, clearcoat: 1,
      emissive: '#48ccff', emissiveIntensity: .66, transparent: true, opacity: .82,
    });
    for (const x of [-5.35, 5.35]) {
      part(root, new THREE.CylinderGeometry(.76, .89, .28, 8), rail, x, .15, -6.85);
      part(root, new THREE.CylinderGeometry(.40, .57, 1.08, 8), brass, x, .75, -6.85);
      part(root, new THREE.OctahedronGeometry(.58, 0), prismMaterial, x, 1.59, -6.85).rotation.y = Math.PI / 5;
    }
    label(root, '달빛 유리 온실', 0, 3.04, -9.38, 3.95);
  } else {
    clock = new THREE.Group();
    clock.userData.live = true;
    clock.position.set(0, 2.76, -8.58);
    root.add(clock);
    part(clock, new THREE.CylinderGeometry(1.02, 1.02, .11, 40), panel, 0, 0, 0).rotation.x = Math.PI / 2;
    hoop(clock, brass, 1.04, .073, 0, 0, .1);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      box(clock, jewel, .038, i % 3 ? .095 : .15, .06, Math.sin(a) * .88, Math.cos(a) * .88, .12).rotation.z = -a;
    }
    const hand = new THREE.Group();
    hand.position.z = .18; clock.add(hand);
    box(hand, brass, .075, .65, .05, 0, .29, 0);
    star(clock, jewel, .11, 0, 0, .2);
    clock.userData.hand = hand;
    const gearShape = new THREE.Shape();
    const teeth = 16;
    for (let i = 0; i < teeth * 4; i++) {
      const a = i / (teeth * 4) * Math.PI * 2;
      const r = i % 4 === 1 || i % 4 === 2 ? 1 : .89;
      gearShape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    gearShape.closePath();
    const cutout = new THREE.Path();
    cutout.absarc(0, 0, .70, 0, Math.PI * 2, true);
    gearShape.holes.push(cutout);
    const gearGeometry = new THREE.ExtrudeGeometry(gearShape, { depth: .095, curveSegments: 28, bevelEnabled: false });
    for (const [x, y, scale] of [[-3.6, 2.14, 1.25], [-5.52, 1.50, .79], [3.6, 2.14, 1.25], [5.52, 1.50, .79]]) {
      const gear = new THREE.Group();
      gear.position.set(x, y, -8.83);
      gear.scale.setScalar(scale); gear.userData.live = true;
      root.add(gear); gears.push(gear);
      part(gear, gearGeometry.clone(), brass, 0, 0, 0);
      hoop(gear, dim, .75, .036, 0, 0, .08);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        box(gear, brass, .078, .65, .10, Math.sin(a) * .4, Math.cos(a) * .4, .015).rotation.z = -a;
      }
      part(gear, new THREE.CylinderGeometry(.14, .14, .18, 18), dim, 0, 0, .06).rotation.x = Math.PI / 2;
    }
    gearGeometry.dispose();
    label(root, '0번 신호탑', 0, 1.5, -8.31, 2.15);
  }

  let snow;
  if (winter || cinema) {
    const count = winter ? 410 : 135;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = ((i * .6180339) % 1 - .5) * 26;
      positions[i * 3 + 1] = (i * .7548777) % 1 * 8;
      positions[i * 3 + 2] = ((i * .4142136) % 1 - .5) * 24;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const snowGlow = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
    snowGlow.addColorStop(0, 'rgba(255,255,255,1)');
    snowGlow.addColorStop(.45, 'rgba(235,247,255,.74)');
    snowGlow.addColorStop(1, 'rgba(215,236,255,0)');
    ctx.fillStyle = snowGlow;
    ctx.fillRect(0, 0, 32, 32);
    const material = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(canvas), color: '#e6f4ff', size: .11, transparent: true, opacity: .78, depthWrite: false });
    snow = new THREE.Points(geo, material);
    root.add(snow);
  }
  return (t, restored = false) => {
    if (snow) {
      const pos = snow.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, ((i * .7548777) % 1 * 8 + (8 - (t * .56) % 8)) % 8);
      pos.needsUpdate = true;
      snow.position.x = Math.sin(t * .55) * .3;
    }

    gears.forEach((g, i) => { g.rotation.z = (i % 2 ? -.28 : .18) * (restored ? t : Math.sin(t * 1.35) * .12) + i * .08; });
    if (clock) clock.userData.hand.rotation.z = restored ? -Math.min(t, 5) * .35 : Math.sin(t * 2.3) * .045;
  };
}
