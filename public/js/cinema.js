import * as THREE from 'three';
import { buildProp } from './props.js';
import { createAvatar, animateAvatar } from './avatar.js';
import { createGhost, animateGhost } from './ghosts.js';

// 게임 엔진으로 연출하는 컷신 (프롤로그 · 엔딩 2종)
// 각 컷: { dur, caption, sepia, setup(c), update(c, t, k) }

const CHILD_LOOKS = [
  { outfit: 'blazer', hair: 'short', hairColor: '#2b1d16', eyes: 'dot', ears: 'none', mouth: 'smile' },
  { outfit: 'sailor', hair: 'twintail', hairColor: '#2b1d16', eyes: 'big', ears: 'none', mouth: 'smile' },
  { outfit: 'blazer', hair: 'bowl', hairColor: '#2b1d16', eyes: 'dot', ears: 'none', mouth: 'o' },
  { outfit: 'sailor', hair: 'bob', hairColor: '#2b1d16', eyes: 'big', ears: 'none', mouth: 'smile', hat: 'ribbon', accent: '#c0392b' },
  { outfit: 'blazer', hair: 'spiky', hairColor: '#2b1d16', eyes: 'smile', ears: 'none', mouth: 'open' },
  { outfit: 'sailor', hair: 'ponytail', hairColor: '#2b1d16', eyes: 'big', ears: 'none', mouth: 'cat' },
  { outfit: 'blazer', hair: 'short', hairColor: '#2b1d16', eyes: 'sparkle', ears: 'none', mouth: 'grin' },
];
const TEACHER = { outfit: 'blazer', hair: 'long', hairColor: '#111111', eyes: 'closed', ears: 'none', mouth: 'smile', body: '#ffe0cc', accent: '#f4f1ea' };

export class Cinema {
  constructor(renderer) {
    this.r = renderer;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 400);
    this.active = false;
    this.ui = this.buildUI();
    const fit = () => { const a = innerWidth / innerHeight; this.cam.aspect = a; this.cam.fov = a >= 1 ? 40 : Math.min(78, 40 + (1 - a) * 70); this.cam.updateProjectionMatrix(); }; fit(); addEventListener('resize', fit);
  }

  buildUI() {
    const root = document.createElement('div'); root.id = 'cine'; root.className = 'hidden';
    root.innerHTML = `<div class="bar top"></div><div class="bar bot"></div><div class="cap"></div><div class="ttl"><div class="t1"></div><div class="t2"></div></div><div class="fade"></div><button class="btn small skip">건너뛰기 ▶▶ (Esc)</button>`;
    document.body.appendChild(root);
    root.querySelector('.skip').onclick = () => this.skip();
    addEventListener('keydown', (e) => { if (this.active && (e.code === 'Escape' || e.code === 'Enter')) { e.stopImmediatePropagation(); this.skip(); } }, true);
    return { root, cap: root.querySelector('.cap'), t1: root.querySelector('.t1'), t2: root.querySelector('.t2'), ttl: root.querySelector('.ttl'), fade: root.querySelector('.fade') };
  }

  // ── 세트 만들기
  clear() {
    this.scene.traverse((o) => { o.geometry?.dispose?.(); });
    this.scene.clear();
    this.sets = {};
    for (const k of Object.keys(this)) if (k.startsWith('_')) delete this[k];
  }
  set(name, build) { const g = new THREE.Group(); g.visible = false; build(g); this.scene.add(g); this.sets[name] = g; return g; }
  show(...names) { for (const [n, g] of Object.entries(this.sets)) g.visible = names.includes(n); }
  prop(g, p) { const m = buildProp(p); m.position.set(p.x || 0, p.y || 0, p.z || 0); m.rotation.y = ((p.r || 0) * Math.PI) / 180; g.add(m); return m; }

  buildRoad() {
    return this.set('road', (g) => {
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 80), new THREE.MeshStandardMaterial({ color: '#1a1f18', roughness: 1 }));
      ground.rotation.x = -Math.PI / 2; ground.position.x = -60; g.add(ground);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(320, 5), new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.9 }));
      road.rotation.x = -Math.PI / 2; road.position.set(-60, 0.01, 0); g.add(road);
      for (let x = 90; x > -210; x -= 6) { const l = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.15), new THREE.MeshBasicMaterial({ color: '#c9b46a' })); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.02, 0); g.add(l); }
      for (let x = 90; x > -210; x -= 3.2) for (const s of [-1, 1]) { const p = this.prop(g, { t: 'pine', x: x + Math.random() * 2, z: s * (s > 0 ? 6.5 + Math.random() * 9 : 5 + Math.random() * 9) }); p.scale.setScalar(1 + Math.random() * 1.2); }
      for (const s of [-1, 1]) this.prop(g, { t: s < 0 ? 'jangseung_m' : 'jangseung_f', x: -60, z: 3.6 * s, r: s < 0 ? 0 : 180 });
      const eye = new THREE.PointLight('#ff2010', 0, 6, 2); eye.position.set(-60, 2.7, 3.2); g.add(eye); this.eye = eye;
      const bus = this.prop(g, { t: 'bus', x: 20, z: -1.1 });
      for (const s of [-1, 1]) {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff6d0' })); hl.position.set(-2.55, 0.8, s * 0.7); bus.add(hl);
        const sp = new THREE.SpotLight('#fff1c8', 120, 40, 0.45, 0.5, 1.3); sp.position.set(-2.5, 0.9, s * 0.7); const tg = new THREE.Object3D(); tg.position.set(-20, 0, s * 0.7); bus.add(tg); sp.target = tg; bus.add(sp);
      }
      const inner = new THREE.PointLight('#bfe4ff', 6, 6, 2); inner.position.set(0, 1.6, 0); bus.add(inner);
      this.bus = bus;
      const n = 2000; const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 40; pos[i * 3 + 1] = Math.random() * 16; pos[i * 3 + 2] = (Math.random() - 0.5) * 30; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#9fb0c8', size: 0.06, transparent: true, opacity: 0.7 }));
      g.add(this.rain);
      g.add(new THREE.HemisphereLight('#4a5a80', '#0a0a10', 0.7));
    });
  }
  buildSchool() {
    return this.set('school', (g) => {
      g.position.set(400, 0, 0);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#a89a78', roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 6), new THREE.MeshStandardMaterial({ color: '#efe6d2' })); wall.position.set(0, 2, -6); g.add(wall);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(17, 0.5, 7), new THREE.MeshStandardMaterial({ color: '#5a4a3a' })); roof.position.set(0, 4.2, -6); g.add(roof);
      for (let i = 0; i < 6; i++) { if (i === 3) continue; const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: '#4a5a66' })); w.position.set(-6.5 + i * 2.6, 2.3, -2.95); g.add(w); }
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.1), new THREE.MeshStandardMaterial({ color: '#2a1a10' })); door.position.set(1.3, 1.2, -2.95); g.add(door);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: '#f4f1ea' })); sign.position.set(1.3, 3.4, -2.9); g.add(sign);
      this.prop(g, { t: 'tree', x: -9, z: 2, color: '#6a8a4a' }); this.prop(g, { t: 'tree', x: 9, z: 1, color: '#6a8a4a' }); this.prop(g, { t: 'flagpole', x: -4, z: 3, color: '#f4f1ea' });
      g.add(new THREE.HemisphereLight('#fff6e0', '#887766', 2.2));
      const sun = new THREE.DirectionalLight('#ffe8c0', 2.2); sun.position.set(10, 15, 10); g.add(sun);
      this.kids = CHILD_LOOKS.map((l, i) => { const a = createAvatar(l); a.position.set(-8 - i * 1.3, 0, 6); g.add(a); return a; });
      // 선생님은 교실 문 오른쪽 옆에 서서 아이들을 맞이한다 (문: x 0.5~2.1)
      this.teacher = createAvatar(TEACHER); this.teacher.position.set(3.1, 0, -1.9); this.teacher.rotation.y = -0.5; this.teacher.scale.setScalar(1.35); g.add(this.teacher);
    });
  }
  buildCircle() {
    return this.set('circle', (g) => {
      g.position.set(0, 0, 400);
      const fl = new THREE.Mesh(new THREE.CircleGeometry(8, 24), new THREE.MeshStandardMaterial({ color: '#1a1714' })); fl.rotation.x = -Math.PI / 2; g.add(fl);
      this.prop(g, { t: 'candles', x: 0, z: 0 });
      this.ghostKids = [];
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const k = this.prop(g, { t: 'child_ghost', x: Math.sin(a) * 1.9, z: Math.cos(a) * 1.9 }); k.rotation.y = a + Math.PI; this.ghostKids.push(k); }
      g.add(new THREE.HemisphereLight('#334', '#000', 0.25));
    });
  }
  buildStop(looks) {
    return this.set('stop', (g) => {
      g.position.set(-400, 0, 0);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: '#1d2218', roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), new THREE.MeshStandardMaterial({ color: '#2a2a2c' })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 1); g.add(road);
      this.prop(g, { t: 'bus_stop', x: 0, z: -3, r: 180 }); this.prop(g, { t: 'bench', x: 0, z: -3.3 });
      const lamp = this.prop(g, { t: 'lamp', x: 2.5, z: -2.5 }); this.stopLamp = lamp.userData.flicker;
      for (let i = 0; i < 14; i++) this.prop(g, { t: 'pine', x: -20 + i * 3, z: -9 - Math.random() * 4 });
      const bus = buildProp({ t: 'bus' }); bus.position.set(30, 0, 1.6); g.add(bus); this.stopBus = bus;
      this.crew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-1.5 + i * 1.1, 0, -1.4); a.visible = false; g.add(a); return a; });
      g.add(new THREE.HemisphereLight('#6a7aa0', '#141418', 1.2));
      const key = new THREE.PointLight('#ffd9a0', 14, 9, 1.6); key.position.set(1.5, 3, 1.5); g.add(key);
    });
  }
  buildVillage() {
    return this.set('village', (g) => {
      g.position.set(0, 0, -400);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#3a4030', roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
      [[-8, -4, 20], [9, -6, -30], [-10, 7, 60], [7, 8, -10], [0, -12, 0], [-14, -12, 40]].forEach(([x, z, r]) => this.prop(g, { t: 'house', x, z, r }));
      this.prop(g, { t: 'dangsan', x: 0, z: 0 }); this.prop(g, { t: 'well', x: 3, z: 3 });
      for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 20; this.prop(g, { t: 'pine', x: Math.cos(a) * r, z: Math.sin(a) * r }).scale.setScalar(1.5); }
      const water = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ color: '#3a5a72', roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.88 }));
      water.rotation.x = -Math.PI / 2; water.position.y = -0.5; g.add(water); this.water = water;
      g.add(new THREE.HemisphereLight('#ffc8a0', '#334455', 1.6));
      const sun = new THREE.DirectionalLight('#ffb070', 2.5); sun.position.set(-30, 8, -20); g.add(sun);
    });
  }
  buildPath(looks) {
    return this.set('path', (g) => {
      g.position.set(400, 0, 400);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#d8d4cc', roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
      const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 40), new THREE.MeshBasicMaterial({ color: '#fffdf0' })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.02, -10); g.add(path);
      const gate = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), new THREE.MeshBasicMaterial({ color: '#ffffff' })); gate.position.set(0, 3.5, -26); g.add(gate);
      const glow = new THREE.PointLight('#fff2d0', 30, 40, 1.2); glow.position.set(0, 3, -22); g.add(glow);
      g.add(new THREE.HemisphereLight('#ffffff', '#ccc4b8', 2.2));
      this.pathKids = CHILD_LOOKS.map((l, i) => { const a = createAvatar(l); a.position.set((i % 2 ? 0.5 : -0.5), 0, 2 + Math.floor(i / 2) * 1.1); a.rotation.y = Math.PI; g.add(a); return a; });
      this.pathTeacher = createAvatar(TEACHER); this.pathTeacher.scale.setScalar(1.35); this.pathTeacher.position.set(0, 0, 7); this.pathTeacher.rotation.y = Math.PI; g.add(this.pathTeacher);
      this.hillCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-1.6 + i * 1.1, 0, 14); a.rotation.y = Math.PI; g.add(a); return a; });
    });
  }

  // ─────────────── 시나리오 2 · 3 세트
  shipModel(glow = '#7affc8') {
    const g = new THREE.Group();
    const hullM = new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.8 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 7), hullM); hull.position.y = 1.5; g.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(3.6, 7, 4), hullM); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.position.set(18.4, 1.5, 0); bow.scale.set(1, 1, 0.7); g.add(bow);
    const red = new THREE.Mesh(new THREE.BoxGeometry(30.2, 1, 7.1), new THREE.MeshStandardMaterial({ color: '#5a1a14' })); red.position.y = -0.5; g.add(red);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 5.5), new THREE.MeshStandardMaterial({ color: '#cfc8b8', roughness: 0.9 })); deck.position.set(-2, 5.5, 0); g.add(deck);
    for (const x of [-4, 2]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 5, 14), new THREE.MeshStandardMaterial({ color: '#2a2a2a' })); f.position.set(x, 9, 0); f.rotation.z = 0.12; g.add(f); const band = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.8, 14), new THREE.MeshStandardMaterial({ color: '#8a2a1a' })); band.position.set(x + 0.25, 10.6, 0); g.add(band); }
    for (const x of [-13, 12]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 12, 6), new THREE.MeshStandardMaterial({ color: '#2a2018' })); m.position.set(x, 9, 0); g.add(m); }
    const pm = new THREE.MeshBasicMaterial({ color: glow });
    for (let i = 0; i < 22; i++) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), pm); p.position.set(-13 + i * 1.25, 2.4, s * 3.52); p.rotation.y = s > 0 ? 0 : Math.PI; if (Math.random() < 0.6) g.add(p); }
    const l = new THREE.PointLight(glow, 30, 40, 1.4); l.position.set(0, 6, 0); g.add(l);
    return g;
  }
  beamMesh() {
    const geo = new THREE.ConeGeometry(4, 40, 24, 1, true); geo.translate(0, -20, 0); geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#fff6d0', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    return m;
  }
  buildSea(looks) {
    return this.set('sea', (g) => {
      g.position.set(0, 0, 800);
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#0c1a24', roughness: 0.2, metalness: 0.5 })); sea.rotation.x = -Math.PI / 2; g.add(sea); this.sea = sea;
      const isle = new THREE.Group(); isle.position.set(-24, 0, -30); g.add(isle);
      for (let i = 0; i < 14; i++) { const r = buildProp({ t: 'rock' }); r.position.set((Math.random() - 0.5) * 12, -0.2, (Math.random() - 0.5) * 10); r.scale.set(4, 3, 4); isle.add(r); }
      const lh = buildProp({ t: 'lighthouse' }); lh.position.set(0, 0.5, 0); isle.add(lh);
      const beam = this.beamMesh(); beam.position.set(0, 9.7, 0); isle.add(beam); this.beam = beam; beam.visible = false;
      this.lhLight = new THREE.PointLight('#fff2c0', 0, 60, 1.2); this.lhLight.position.set(0, 9.7, 0); isle.add(this.lhLight);
      const ship = this.shipModel(); ship.position.set(30, -0.5, -40); ship.rotation.y = 0.5; g.add(ship); this.ghostShip = ship;
      const boat = buildProp({ t: 'rowboat' }); boat.position.set(0, -0.1, 10); g.add(boat); this.boat = boat;
      const lantern = new THREE.PointLight('#ffc070', 9, 9, 1.6); lantern.position.set(0, 1.6, 1.2); boat.add(lantern);
      const lb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd58a' })); lb.position.copy(lantern.position); boat.add(lb);
      this.boatCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.scale.setScalar(0.7); a.position.set((i % 2 ? 0.3 : -0.3), 0.15, -1 + i * 0.6); a.userData.rig.position.y = -0.2; boat.add(a); return a; });
      this.deckCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.scale.setScalar(1.3); a.position.set(-4 + i * 1.6, 7, 2.2); a.rotation.y = 0; a.visible = false; ship.add(a); return a; });
      this.passengers = [];
      for (let i = 0; i < 9; i++) { const k = createGhost(i % 3 ? 'woman' : 'child'); k.position.set(-8 + i * 1.6, 7, 2.6); k.visible = false; ship.add(k); this.passengers.push(k); }
      g.add(new THREE.HemisphereLight('#4a5a80', '#0a1018', 1.4));
      const moon = new THREE.DirectionalLight('#9fb4e0', 1.2); moon.position.set(-20, 30, -10); g.add(moon);
    });
  }
  buildDeck(looks) {
    return this.set('deck', (g) => {
      g.position.set(-800, 0, 800);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), new THREE.MeshStandardMaterial({ color: '#8a6a4a' })); fl.rotation.x = -Math.PI / 2; g.add(fl);
      for (let i = 0; i < 30; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), new THREE.MeshStandardMaterial({ color: '#e8e0d0' })); p.position.set(-15 + i, 0.55, 3.8); g.add(p); }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(30, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: '#e8e0d0' })); rail.position.set(0, 1.1, 3.8); g.add(rail);
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#2a4a5a', roughness: 0.2, metalness: 0.4 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -4; g.add(sea);
      const looksP = [{ outfit: 'detective', hair: 'short', ears: 'none' }, { outfit: 'maid', hair: 'bun', ears: 'none' }, { outfit: 'sailor', hair: 'twintail', ears: 'none', accent: '#7ab0e8' }, { outfit: 'blazer', hair: 'bowl', ears: 'none' }, { outfit: 'hanbok', hair: 'long', ears: 'none' }, { outfit: 'priest', hair: 'short', ears: 'none' }];
      this.deckPeople = looksP.map((l, i) => { const a = createAvatar(l); a.position.set(-6 + i * 2.2, 0, 2.6); a.rotation.y = Math.PI; g.add(a); return a; });
      this.captain = createGhost('sailor'); this.captain.position.set(8, 0, 0); this.captain.rotation.y = -Math.PI / 2; g.add(this.captain);
      this.deckFlash = new THREE.PointLight('#cfe0ff', 0.6, 20, 1.2); this.deckFlash.position.set(2, 5, 1); g.add(this.deckFlash);
      g.add(new THREE.HemisphereLight('#ffd0a0', '#445566', 1.8));
      const sun = new THREE.DirectionalLight('#ffb070', 2.5); sun.position.set(-20, 5, 20); g.add(sun);
    });
  }
  buildMansion(looks) {
    return this.set('mansion', (g) => {
      g.position.set(800, 0, 0);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#1a1f18', roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 80), new THREE.MeshStandardMaterial({ color: '#2a2622' })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 20); g.add(road);
      const wallM = new THREE.MeshStandardMaterial({ color: '#4a3e44', roughness: 0.9 });
      const main = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 8), wallM); main.position.set(0, 4.5, -14); g.add(main);
      for (const x of [-6, 6]) { const t = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4, 4), new THREE.MeshStandardMaterial({ color: '#1a1418' })); t.position.set(x, 11, -14); t.rotation.y = Math.PI / 4; g.add(t); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.6, 8.5), new THREE.MeshStandardMaterial({ color: '#1a1418' })); roof.position.set(0, 9.3, -14); g.add(roof);
      this.mWindows = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), new THREE.MeshBasicMaterial({ color: '#0a0c10' })); w.position.set(-7 + c * 2.8, 2.6 + r * 3.6, -9.98); g.add(w); this.mWindows.push(w); }
      this.dollWin = this.mWindows[9];
      const sil = buildProp({ t: 'doll' }); sil.scale.setScalar(2.4); sil.position.set(this.dollWin.position.x, this.dollWin.position.y - 0.9, -10.3); g.add(sil); this.silDoll = sil;
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), new THREE.MeshStandardMaterial({ color: '#3a3a3e' })); p.position.set(3 * s, 1.5, 6); g.add(p); }
      for (let i = 0; i < 20; i++) { const t = buildProp({ t: 'pine' }); t.position.set((i % 2 ? 1 : -1) * (8 + Math.random() * 14), 0, -30 + i * 3); t.scale.setScalar(1.6); g.add(t); }
      const car = new THREE.Group(); car.position.set(0, 0, 40); g.add(car); this.car = car;
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4.2), new THREE.MeshStandardMaterial({ color: '#2a3a5a', roughness: 0.4, metalness: 0.4 })); body.position.y = 0.8; car.add(body);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.2), new THREE.MeshStandardMaterial({ color: '#1a2230' })); cab.position.set(0, 1.6, 0.3); car.add(cab);
      for (const sx of [-1, 1]) for (const sz of [-1.4, 1.4]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 14), new THREE.MeshStandardMaterial({ color: '#111' })); w.rotation.z = Math.PI / 2; w.position.set(sx * 1.05, 0.4, sz); car.add(w); }
      for (const sx of [-1, 1]) { const sp = new THREE.SpotLight('#fff1c8', 80, 40, 0.45, 0.5, 1.3); sp.position.set(sx * 0.7, 0.9, -2.1); const tg = new THREE.Object3D(); tg.position.set(sx * 0.7, 0, -20); car.add(tg); sp.target = tg; car.add(sp); }
      g.add(new THREE.HemisphereLight('#5a5a80', '#0a0a12', 1.3));
      const moonM = new THREE.DirectionalLight('#9fb0d8', 1.4); moonM.position.set(-15, 25, 20); g.add(moonM);
      this.lightning = new THREE.DirectionalLight('#cfe0ff', 0); this.lightning.position.set(10, 30, 10); g.add(this.lightning);
      const n = 1500; const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 50; pos[i * 3 + 1] = Math.random() * 20; pos[i * 3 + 2] = (Math.random() - 0.5) * 60; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.mRain = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#9fb0c8', size: 0.07, transparent: true, opacity: 0.7 })); g.add(this.mRain);
    });
  }
  buildParty(looks) {
    return this.set('party', (g) => {
      g.position.set(800, 0, 800);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#4a2e26' })); fl.rotation.x = -Math.PI / 2; g.add(fl);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), new THREE.MeshStandardMaterial({ color: '#8a6a78' })); wall.position.set(0, 3, -4); g.add(wall);
      const cake = buildProp({ t: 'cake_table' }); g.add(cake); this.cakeLight = cake.userData.flicker;
      const kids = [{ outfit: 'pajama', hair: 'bob', ears: 'none', accent: '#ffd166' }, { outfit: 'blazer', hair: 'short', ears: 'none' }, { outfit: 'sailor', hair: 'twintail', ears: 'none' }, { outfit: 'detective', hair: 'spiky', ears: 'none' }, { outfit: 'maid', hair: 'ponytail', ears: 'none' }];
      this.partyKids = kids.map((l, i) => { const a = createAvatar({ ...l, eyes: 'smile', mouth: 'open' }); const ang = Math.PI + (i - 2) * 0.55; a.position.set(Math.sin(ang) * 2, 0, Math.cos(ang) * 2); a.lookAt(0, 0, 0); g.add(a); return a; });
      this.partyDolls = this.partyKids.map((k) => { const d = buildProp({ t: 'doll' }); d.scale.setScalar(2.2); d.position.copy(k.position); d.lookAt(0, 0, 0); d.visible = false; g.add(d); return d; });
      this.clara = createAvatar({ outfit: 'nurse', hair: 'long', hairColor: '#e8c170', ears: 'none', eyes: 'big', eyeColor: '#3b7dd8', mouth: 'smile', hat: 'ribbon', accent: '#7ab0e8', body: '#fff1e6' });
      this.clara.position.set(0, 0, -1.6); g.add(this.clara);
      g.add(new THREE.HemisphereLight('#ffe0c0', '#332222', 1.2));
    });
  }
  buildShelf(looks) {
    return this.set('shelf', (g) => {
      g.position.set(-800, 0, -800);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshStandardMaterial({ color: '#3a2228' })); back.position.set(0, 2.5, -0.6); g.add(back);
      for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: '#2a1810' })); s.position.set(0, 0.8 + i * 1.4, 0); g.add(s); }
      for (let i = 0; i < 8; i++) { const d = buildProp({ t: 'doll' }); d.scale.setScalar(1.4); d.position.set(-3.2 + (i % 4) * 2.1, 0.85 + Math.floor(i / 4) * 2.8, 0); g.add(d); }
      this.shelfCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar({ ...l, eyes: 'dot', mouth: 'flat' }); a.scale.setScalar(0.55); a.position.set(-2.4 + i * 1.6, 2.25, 0.1); g.add(a); return a; });
      const c = new THREE.PointLight('#ffb070', 6, 8, 1.6); c.position.set(0, 3, 3); g.add(c); this.shelfLight = c;
      g.add(new THREE.HemisphereLight('#6a4a4a', '#100808', 0.5));
    });
  }

  shipShots(kind, looks) {
    const A = () => this.audio;
    this.buildSea(looks);
    const night = (c, f = 0.03) => { c.scene.background = new THREE.Color('#06090e'); c.scene.fog = new THREE.FogExp2('#0a1018', f); };
    if (kind === 'ship_intro') {
      this.buildDeck(looks);
      return [
        { dur: 9, caption: '2026년 11월 9일, 새벽 2시.\n남해 흑등도 앞바다.', setup: (c) => { c.show('sea'); night(c, 0.045); c.ghostShip.visible = false; A()?.ambient('rain'); },
          update: (c, t, k) => { c.boat.position.z = 10 - t * 0.8; c.boat.rotation.z = Math.sin(t * 1.3) * 0.05; c.look(4, 2.2, 800 + 16 - t * 0.6, 0, 0.6, 800 + 6 - t * 0.8); c.boatCrew.forEach((a) => animateAvatar(a, 0.016, false, t)); } },
        { dur: 10, sepia: true, caption: '1931년 11월. 상하이를 떠나 부산으로 가던 여객선, 오필리아호.\n갑판에는 새 출발을 꿈꾸는 사람들이 있었다.', setup: (c) => { c.show('deck'); c.scene.background = new THREE.Color('#e8b890'); c.scene.fog = new THREE.Fog('#e8b890', 30, 120); A()?.ambient(null); A()?.play('bell'); },
          update: (c, t, k, dt) => { c.deckPeople.forEach((a, i) => animateAvatar(a, dt, false, t, false, i % 3 === 0 ? 'wave' : null, t)); c.look(-800 + 12 - k * 8, 2.2, 800 - 6 + k * 2, -800, 1.2, 800 + 2); } },
        { dur: 8, caption: '그날 밤, 등대의 불은 켜지지 않았다.\n선장은 3등칸 철창문을 잠갔다.', setup: (c) => { c.show('deck'); c.scene.background = new THREE.Color('#05070a'); c.scene.fog = new THREE.FogExp2('#05070a', 0.06); c.deckPeople.forEach((a) => (a.visible = false)); A()?.ambient('rain'); A()?.play(c.fear >= 2 ? 'sting' : 'creak'); },
          update: (c, t, k, dt) => { animateGhost(c.captain, dt, t, { mode: 'hunt' }, 3); c.captain.position.x = 8 - t * 0.7; c.look(-800 + 1.5 - t * 0.5, 1.5 + Math.sin(t * 1.5) * 0.15, 800 + 2.6, -800 + 7 - t * 0.7, 1.7, 800); c.deckFlash.intensity = (t % 2.6 < 0.1 || (t % 2.6 > 0.2 && t % 2.6 < 0.26)) ? 8 : 0.6; } },
        { dur: 9, caption: '그리고 매년 11월, 안개 낀 밤이면 —', capAt: 1.2, setup: (c) => { c.show('sea'); night(c, 0.03); c.ghostShip.visible = true; c.ghostShip.position.set(30, -0.5, -40); A()?.ambient('horror'); },
          update: (c, t, k) => { c.ghostShip.position.x = 30 - t * 1.2; c.ghostShip.position.y = -0.5 + Math.sin(t) * 0.2; c.look(-2, 2, 800 + 14, 18 - t, 4, 800 - 36); if (t > 5 && !c._shipS) { c._shipS = 1; A()?.play(c.fear >= 2 ? 'scream' : 'bell'); } } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('오필리아호', '— 마지막 항해 —'); A()?.ambient(null); A()?.play('bell'); } },
      ];
    }
    if (kind === 'ship_true') {
      return [
        { dur: 10, caption: '새벽. 흑등도 등대에 다시 불이 켜졌다.', setup: (c) => { c.show('sea'); c.scene.background = new THREE.Color('#e0a080'); c.scene.fog = new THREE.Fog('#e0a080', 30, 150); c.beam.visible = true; c.lhLight.intensity = 40; A()?.play('bell'); },
          update: (c, t) => { c.beam.rotation.y = t * 0.6; c.ghostShip.position.set(10, -0.5, -30); c.look(-5, 6, 800 + 20, -14, 6, 800 - 30); } },
        { dur: 11, caption: '갑판 위의 112명이 손을 흔들었다.\n오필리아호는 등대 불빛을 따라 수평선 너머로 미끄러져 갔다.', capAt: 1.5, setup: (c) => { c.show('sea'); c.passengers.forEach((p) => (p.visible = true)); },
          update: (c, t, k, dt) => { c.beam.rotation.y = t * 0.6; c.ghostShip.position.x = 10 + t * 2.2; c.ghostShip.position.y = -0.5 - k * 2.5; c.passengers.forEach((p) => animateGhost(p, dt, t, { mode: 'wander' }, 9)); c.look(0, 4, 800 + 6, c.ghostShip.position.x, 5, 800 - 30); } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('귀항', '95년 늦은 귀항이었다.'); A()?.play('bell'); } },
      ];
    }
    return [
      { dur: 9, caption: '일 년 뒤 11월.\n안개 낀 밤, 흑등도 앞바다.', setup: (c) => { c.show('sea'); night(c, 0.04); c.boat.visible = false; A()?.ambient('horror'); },
        update: (c, t) => { c.ghostShip.position.set(16 - t * 0.8, -0.5, -24); c.look(-6, 2.4, 800 + 10, 8, 5, 800 - 24); } },
      { dur: 8, caption: '제보 사진 속 갑판 난간에는 —\n낯익은 얼굴들이 서 있었다.', capAt: 2.5, setup: (c) => { c.show('sea'); c.deckCrew.forEach((a) => (a.visible = true)); c.passengers.forEach((p) => (p.visible = true)); },
        update: (c, t, k, dt) => { c.deckCrew.forEach((a) => animateAvatar(a, dt, false, t, false, 'shiver', t)); c.ghostShip.position.set(4, -0.5, -18); c.look(10 - k * 4, 7.5, 800 - 4, 3, 7.6, 800 - 16); if (t > 2.5 && !c._nS) { c._nS = 1; A()?.play(c.fear >= 2 ? 'scream' : 'whisper'); } } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('다시, 11월', '승객들의 유품을 모두 모으면, 다른 결말이…'); } },
    ];
  }

  dollShots(kind, looks) {
    const A = () => this.audio;
    this.buildMansion(looks);
    const flash = (c, t) => { const on = (t % 3.3 < 0.12) || (t % 3.3 > 0.25 && t % 3.3 < 0.32); c.lightning.intensity = on ? 6 : 0; if (on && !c._lt) { c._lt = 1; A()?.play('knock'); } if (!on) c._lt = 0; };
    const rain = (c, dt) => { const a = c.mRain.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 16; if (y < 0) y = 20; a.setY(i, y); } a.needsUpdate = true; };
    const storm = (c) => { c.scene.background = new THREE.Color('#06070c'); c.scene.fog = new THREE.FogExp2('#06070c', 0.025); };
    if (kind === 'doll_intro') {
      this.buildParty(looks);
      return [
        { dur: 9, caption: '2026년 11월. 철거를 사흘 앞둔 서양식 저택, 하트웰 하우스.', setup: (c) => { c.show('mansion'); storm(c); A()?.ambient('rain'); },
          update: (c, t, k, dt) => { c.car.position.z = 40 - t * 3; c.look(800 + 4, 1.6, c.car.position.z + 8, 800, 1.2, c.car.position.z - 10); flash(c, t); rain(c, dt); } },
        { dur: 9, caption: '"밤마다 2층 창문에 인형이 서 있다."', capAt: 1, setup: (c) => { c.show('mansion'); storm(c); c.dollWin.material.color.set('#0a0c10'); },
          update: (c, t, k, dt) => { c.look(800, 3 + k, 12 - k * 6, 800, 5, -12); flash(c, t); rain(c, dt); if (t > 4) { c.dollWin.material.color.set('#ffcf80'); c.silDoll.rotation.y = t > 6.5 ? Math.PI * 0.15 : 0; } if (t > 6.5 && !c._dS) { c._dS = 1; A()?.play(c.fear >= 2 ? 'sting' : 'giggle'); } } },
        { dur: 11, sepia: true, caption: '1958년 3월 3일. 클라라의 여덟 번째 생일 파티.\n고아원에서 다섯 친구가 초대되었다.', setup: (c) => { c.show('party'); c.scene.background = new THREE.Color('#2a1a18'); c.scene.fog = null; A()?.ambient(null); A()?.play('musicbox'); },
          update: (c, t, k, dt) => {
            c.partyKids.forEach((a, i) => { a.visible = t < 6.5 + i * 0.6; c.partyDolls[i].visible = !a.visible; animateAvatar(a, dt, false, t, false, i % 2 ? 'clap' : null, t); });
            animateAvatar(c.clara, dt, false, t, false, t > 6 ? null : 'heart', t);
            c.look(800 + Math.sin(t * 0.15) * 5, 3.2, 800 + 5.5, 800, 0.9, 800 - 0.5);
            if (t > 6.5 && !c._pS) { c._pS = 1; A()?.play('creak'); }
          } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('인형의 집', '— 하트웰 저택 —'); A()?.play(c.fear >= 2 ? 'sting' : 'bell'); } },
      ];
    }
    if (kind === 'doll_true') {
      this.buildParty(looks);
      return [
        { dur: 11, caption: '다섯 아이의 빛이 클라라의 손을 잡고\n새벽하늘로 올라갔다.', capAt: 1.5, setup: (c) => { c.show('party'); c.scene.background = new THREE.Color('#2a3048'); c.scene.fog = null; c.partyKids.forEach((a) => (a.visible = false)); c.partyDolls.forEach((d) => (d.visible = true)); A()?.play('bell');
            c.orbs = c.partyDolls.map((d) => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff6d0' })); o.position.copy(d.position).add(new THREE.Vector3(0, 1.2, 0)); c.sets.party.add(o); const l = new THREE.PointLight('#fff2c0', 3, 4, 2); o.add(l); return o; }); },
          update: (c, t, k, dt) => { c.orbs.forEach((o, i) => { o.position.y = 1.2 + Math.max(0, t - 2 - i * 0.4) * 1.2; o.position.x += (0 - o.position.x) * dt * 0.3; }); c.clara.position.y = Math.max(0, t - 5) * 0.8; animateAvatar(c.clara, dt, false, t, false, 'wave', t); c.look(800 + 1.5, 2.2 + k * 1.5, 800 + 6.5, 800, 1.3 + k * 3.5, 800); } },
        { dur: 8, caption: '사흘 뒤, 하트웰 하우스는 철거되었다.', setup: (c) => { c.show('mansion'); c.scene.background = new THREE.Color('#f0b890'); c.scene.fog = new THREE.Fog('#f0b890', 30, 120); c.mRain.visible = false; c.car.position.z = 18; c.mWindows.forEach((w) => w.material.color.set('#1a1c20')); },
          update: (c, t, k) => { c.look(800 - 8 + k * 3, 3, 26, 800, 5, -12); } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('잘 자, 클라라', '이제 혼자가 아니야.'); A()?.play('bell'); } },
      ];
    }
    this.buildShelf(looks);
    return [
      { dur: 7, caption: '일주일 뒤. 편집실 책상 위에 택배 상자 하나.', setup: (c) => { c.show('shelf'); c.scene.background = new THREE.Color('#0a0808'); c.scene.fog = null; A()?.ambient('horror'); },
        update: (c, t, k) => { c.look(-800 - 3 + k * 2, 2.5, -800 + 7 - k * 2, -800, 2.3, -800); } },
      { dur: 7, caption: '"파티에 와 줘서 고마워. 의자는 아직 비어 있어."', capAt: 3.2, setup: (c) => {},
        update: (c, t, k, dt) => { const d = c.shelfCrew[0]; c.look(d.position.x - 800 + 0.2 + 0, 2.6, -800 + 2.2, -800 + d.position.x, 2.5, -800); if (t > 3) { d.userData.head.rotation.y = Math.min(1, (t - 3) * 2) * 0.9; if (!c._hS) { c._hS = 1; A()?.play(c.fear >= 2 ? 'sting' : 'giggle'); } } c.shelfLight.intensity = t > 3 ? (Math.random() < 0.2 ? 0 : 6) : 6; } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('여섯 번째 의자', '아이들의 유품을 모두 모으면, 다른 결말이…'); } },
    ];
  }

  // ── 백야 요양병원
  buildWard(looks) {
    return this.set('ward', (g) => {
      g.position.set(1600, 0, 0);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), new THREE.MeshStandardMaterial({ color: '#3a3c38', roughness: 0.6, metalness: 0.2 })); fl.rotation.x = -Math.PI / 2; g.add(fl);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), new THREE.MeshStandardMaterial({ color: '#7a7e74' })); wall.position.set(0, 2, -3); g.add(wall);
      const wall2 = wall.clone(); wall2.position.set(0, 2, 3); wall2.rotation.y = Math.PI; g.add(wall2);
      this.wardLights = [];
      for (let i = 0; i < 5; i++) {
        const x = -10 + i * 5;
        this.prop(g, { t: 'bed', x, z: -2, r: 90 }); this.prop(g, { t: 'iv_stand', x: x + 1.2, z: -2.4 });
        const l = new THREE.PointLight('#dfe8ff', 4, 7, 1.6); l.position.set(x, 3.4, 0); g.add(l); this.wardLights.push(l);
      }
      this.wardChair = this.prop(g, { t: 'wheelchair', x: 0, z: 1, r: 90 });
      this.wardNurse = createAvatar({ outfit: 'nurse', hair: 'bun', hairColor: '#1a1414', ears: 'none', eyes: 'closed', mouth: 'flat', body: '#e8e4e0', accent: '#ffffff' });
      this.wardNurse.position.set(12, 0, 0); this.wardNurse.rotation.y = -Math.PI / 2; g.add(this.wardNurse);
      this.wardCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-13 + i * 0.9, 0, (i % 2) * 0.8 - 0.4); a.rotation.y = Math.PI / 2; g.add(a); return a; });
      g.add(new THREE.HemisphereLight('#8a9a9a', '#101010', 0.5));
    });
  }
  hospShots(kind, looks) {
    const A = () => this.audio;
    this.buildWard(looks);
    const blink = (c, t, rate = 1) => c.wardLights.forEach((l, i) => (l.intensity = Math.random() < 0.08 * rate ? 0 : 4 - (i * 0.3)));
    if (kind === 'hosp_intro') {
      return [
        { dur: 9, caption: '2026년 11월 9일, 새벽 1시.\n경기 북부 — 1995년에 문을 닫은 백야요양병원.', setup: (c) => { c.show('ward'); c.night(0.08, '#05070a'); A()?.ambient('hospital'); },
          update: (c, t, k, dt) => { blink(c, t, 2); c.wardCrew.forEach((a) => { a.position.x += dt * 0.6; animateAvatar(a, dt, true, t); }); c.look(1600 - 16 + k * 4, 1.8, 3.5, 1600 - 8 + k * 6, 1.2, 0); } },
        { dur: 10, sepia: true, caption: "1994년 12월 24일, 성탄 전야.\n원장은 7병동 환자 다섯에게 '수면 치료'를 지시했다.", setup: (c) => { c.show('ward'); c.scene.background = new THREE.Color('#d8c8a8'); c.scene.fog = new THREE.Fog('#d8c8a8', 10, 40); c.wardCrew.forEach((a) => (a.visible = false)); c.wardNurse.position.x = 12; A()?.ambient(null); A()?.play('bell'); },
          update: (c, t, k, dt) => { c.wardLights.forEach((l) => (l.intensity = 4)); c.wardNurse.position.set(12 - t * 1.2, 0, -0.6); animateAvatar(c.wardNurse, dt, true, t); c.look(1600 - 7, 1.8, 2.2, 1600 + c.wardNurse.position.x, 1.2, -0.6); } },
        { dur: 8, caption: '병실 문은 밖에서 잠겼다.\n그리고 밤 11시 40분, 불이 났다.', capAt: 1.2, setup: (c) => { c.show('ward'); c.scene.background = new THREE.Color('#1a0604'); c.scene.fog = new THREE.FogExp2('#2a0a04', 0.09); c.wardNurse.visible = false; A()?.play(c.fear >= 2 ? 'scream' : 'whisper'); },
          update: (c, t, k) => { c.wardLights.forEach((l) => { l.color.set('#ff5a1a'); l.intensity = 3 + Math.random() * 4; }); c.wardChair.rotation.y = Math.PI / 2 + Math.sin(t * 2) * 0.2; c.look(1600 - 4 + k * 3, 2.4, 2.4, 1600 + 2, 0.8, -1.5); } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('백야 요양병원', '— 7병동의 밤 —'); A()?.play(c.fear >= 2 ? 'sting' : 'bell'); } },
      ];
    }
    if (kind === 'hosp_true') {
      return [
        { dur: 10, caption: '32년 만에, 7병동에 아침 기상벨이 울렸다.', setup: (c) => { c.show('ward'); c.scene.background = new THREE.Color('#f0e0c8'); c.scene.fog = new THREE.Fog('#f0e0c8', 12, 50); c.wardLights.forEach((l) => { l.color.set('#fff2d8'); l.intensity = 5; }); c.wardNurse.position.set(0, 0, 0.4); c.wardNurse.rotation.y = 0; A()?.play('bell'); },
          update: (c, t, k, dt) => { c.wardCrew.forEach((a) => animateAvatar(a, dt, false, t, false, 'wave', t)); animateAvatar(c.wardNurse, dt, false, t); c.look(1600 + Math.sin(t * 0.2) * 3, 1.8, 4.5, 1600, 1.1, 0); if (t > 5) c.wardNurse.position.y = (t - 5) * 0.25; } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('새벽 회진', '지워진 이름은 하나도 없었다.'); A()?.play('bell'); } },
      ];
    }
    return [
      { dur: 8, caption: '일주일 뒤, 편집실 팩스기가 혼자 작동했다.', setup: (c) => { c.show('ward'); c.night(0.07, '#060606'); c.wardNurse.visible = false; A()?.ambient('horror'); },
        update: (c, t, k) => { blink(c, t, 3); c.look(1600 - 10 + k * 8, 1.5, 1.5, 1600 + 4, 0.7, -2); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('706호', '환자들의 유품을 모두 모으면, 다른 결말이…'); A()?.play(c.fear >= 2 ? 'sting' : 'whisper'); } },
    ];
  }

  // ── 반딧불 캠프
  buildLake(looks) {
    return this.set('lake', (g) => {
      g.position.set(-1600, 0, 0);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: '#1f2a1c', roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.z = 10; g.add(ground);
      const lake = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: '#0e1e2a', roughness: 0.15, metalness: 0.5, emissive: '#04101a', emissiveIntensity: 0.6 })); lake.rotation.x = -Math.PI / 2; lake.position.set(0, -0.05, -20); g.add(lake);
      for (let i = 0; i < 24; i++) this.prop(g, { t: 'pine', x: -30 + i * 2.6, z: -38 + Math.random() * 4 });
      ['#c9302c', '#e8c13a', '#3b7dd8', '#2fbf71'].forEach((color, i) => this.prop(g, { t: 'tent', x: -7 + i * 4.5, z: 12 + (i % 2) * 1.5, r: (i - 1.5) * 12, color }));
      this.lakeFire = this.prop(g, { t: 'campfire', x: 0, z: 4 });
      for (let i = 0; i < 6; i++) this.prop(g, { t: 'fireflies', x: -12 + i * 5, z: -2 - Math.random() * 6 });
      const kids = [{ outfit: 'tracksuit', hair: 'spiky', accent: '#c9302c' }, { outfit: 'raincoat', hair: 'ponytail', hat: 'flower' }, { outfit: 'tracksuit', hair: 'bowl', accent: '#3b7dd8' }, { outfit: 'hoodie', hair: 'bob', accent: '#2fbf71' }];
      this.lakeKids = kids.map((l, i) => { const a = createAvatar({ ...l, ears: 'none', eyes: 'smile', mouth: 'open' }); const ang = (i / 4) * Math.PI * 2; a.position.set(Math.sin(ang) * 1.8, 0, 4 + Math.cos(ang) * 1.8); a.rotation.y = ang + Math.PI; g.add(a); return a; });
      this.sua = createAvatar({ outfit: 'nurse', hair: 'long', hairColor: '#111', ears: 'none', eyes: 'closed', mouth: 'flat', body: '#dfe6ea', accent: '#c8d8e8' });
      this.sua.position.set(0, 0, -1); this.sua.rotation.y = Math.PI; g.add(this.sua);
      this.lakeCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-2 + i * 1.2, 0, 16); a.rotation.y = Math.PI; g.add(a); return a; });
      const moon = new THREE.DirectionalLight('#8fa4d8', 0.8); moon.position.set(-8, 14, -6); g.add(moon);
      g.add(new THREE.HemisphereLight('#7a8ab6', '#241e28', 1.8));
      const fire = new THREE.PointLight('#ff9a4a', 6, 14, 1.6); fire.position.set(0, 1.2, 4); g.add(fire);
    });
  }
  campShots(kind, looks) {
    const A = () => this.audio;
    this.buildLake(looks);
    if (kind === 'camp_intro') {
      return [
        { dur: 9, caption: '2026년 11월 9일 밤.\n강원도 깊은 산속, 문 닫은 반딧불 청소년 수련원.', setup: (c) => { c.show('lake'); c.night(0.03, '#05070b'); c.lakeKids.forEach((a) => (a.visible = false)); c.sua.visible = false; A()?.ambient('camp'); },
          update: (c, t, k, dt) => { c.lakeCrew.forEach((a) => { a.position.z = 16 - t * 0.5; animateAvatar(a, dt, true, t); }); c.look(-1600 + 6 - k * 4, 2.6, 24 - k * 3, -1600, 1.2, 8); } },
        { dur: 10, sepia: true, caption: '2003년 8월 15일, 캠프 마지막 밤.\n반딧불 조 아이 넷이 담력 시험을 떠났다.', setup: (c) => { c.show('lake'); c.scene.background = new THREE.Color('#e0b080'); c.scene.fog = new THREE.Fog('#e0b080', 20, 80); c.lakeCrew.forEach((a) => (a.visible = false)); c.lakeKids.forEach((a) => (a.visible = true)); A()?.ambient(null); A()?.play('giggle'); },
          update: (c, t, k, dt) => { c.lakeKids.forEach((a, i) => animateAvatar(a, dt, false, t, false, i % 2 ? 'clap' : 'wave', t)); c.look(-1600 + Math.sin(t * 0.2) * 4, 2.4, 9, -1600, 1, 4); } },
        { dur: 8, caption: '아이들은 숲이 아니라, 반딧불을 따라 호수로 갔다.', capAt: 1.2, setup: (c) => { c.show('lake'); c.night(0.04, '#04060a'); c.sua.visible = true; c.lakeKids.forEach((a) => (a.visible = false)); A()?.play(c.fear >= 2 ? 'scream_child' : 'whisper'); },
          update: (c, t, k) => { c.look(-1600 + 3 - k * 2, 1.6, 3.5 - k * 2, -1600, 1.1, -1); if (t > 5) c.sua.rotation.y = Math.PI + Math.min(1, (t - 5)) * Math.PI; } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('반딧불 캠프', '— 마지막 캠프파이어 —'); A()?.play('bell'); } },
      ];
    }
    if (kind === 'camp_true') {
      return [
        { dur: 11, caption: '"수아야, 같이 집에 가자."\n다섯 아이가 캠프파이어 둘레를 돌며 노래했다.', capAt: 1.2, setup: (c) => { c.show('lake'); c.night(0.02, '#1a1428'); c.lakeCrew.forEach((a) => (a.visible = false)); A()?.play('musicbox'); },
          update: (c, t, k, dt) => { const all = [...c.lakeKids, c.sua]; all.forEach((a, i) => { a.visible = true; const ang = (i / all.length) * Math.PI * 2 + t * 0.4; a.position.set(Math.sin(ang) * 1.9, Math.max(0, t - 7) * 0.6, 4 + Math.cos(ang) * 1.9); a.rotation.y = ang + Math.PI / 2; animateAvatar(a, dt, true, t); }); c.look(-1600 + Math.sin(t * 0.15) * 6, 3, 11, -1600, 1.2, 4); } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('반딧불처럼', '「윤수아」 — 이름이 다시 새겨졌다.'); A()?.play('bell'); } },
      ];
    }
    return [
      { dur: 8, caption: '일주일 뒤. 촬영 영상 속, 텐트 네 동 옆에 —\n처음 보는 다섯 번째 텐트.', setup: (c) => { c.show('lake'); c.night(0.035, '#05070b'); c.lakeKids.forEach((a) => (a.visible = false)); c.sua.position.set(10, 0, 13); A()?.ambient('horror'); },
        update: (c, t, k, dt) => { c.lakeCrew.forEach((a) => animateAvatar(a, dt, false, t)); c.look(-1600 + 2 + k * 4, 1.8, 22, -1600 + 6, 1, 12); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('다섯 번째 텐트', '아이들의 물건을 모두 찾아 주면, 다른 결말이…'); A()?.play(c.fear >= 2 ? 'sting' : 'whisper'); } },
    ];
  }

  // ── 레드 메사
  buildWest(looks) {
    return this.set('west', (g) => {
      g.position.set(0, 0, 2400);
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 1 })); gr.rotation.x = -Math.PI / 2; g.add(gr);
      this.prop(g, { t: 'facade', x: -7, z: -8, label: 'SALOON', color: '#7a4a2a' }); this.prop(g, { t: 'facade', x: 0, z: -8.5, label: 'BANK', color: '#6a5a4a' }); this.prop(g, { t: 'facade', x: 7, z: -8, label: 'SHERIFF', color: '#5a4a3a' });
      this.westGallows = this.prop(g, { t: 'gallows', x: 0, z: -1 });
      [[-10, 4], [9, 5], [-5, 8], [12, -2]].forEach(([x, z]) => this.prop(g, { t: 'cactus', x, z }));
      this.prop(g, { t: 'wagon', x: 6, z: 3, r: 20 }); this.prop(g, { t: 'water_tower', x: -10, z: -2 });
      this.jack = createAvatar({ outfit: 'cowboy', hair: 'short', hairColor: '#3a2414', ears: 'none', eyes: 'sleepy', mouth: 'flat', body: '#f1c27d', accent: '#8a5a2a' });
      this.jack.position.set(0, 1.2, -1); g.add(this.jack);
      this.westCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-2 + i * 1.2, 0, 12); a.rotation.y = Math.PI; g.add(a); return a; });
      this.westSun = new THREE.DirectionalLight('#ffb070', 0.6); this.westSun.position.set(-10, 8, 6); g.add(this.westSun);
      g.add(new THREE.HemisphereLight('#a08070', '#2a1a10', 0.8));
    });
  }
  westShots(kind, looks) {
    const A = () => this.audio;
    this.buildWest(looks);
    if (kind === 'west_intro') return [
      { dur: 9, caption: '2026년 11월 9일 밤.\n66번 국도에서 한참 벗어난 사막, 지도에 없는 마을.', setup: (c) => { c.show('west'); c.night(0.03, '#1a0e0a'); c.jack.visible = false; A()?.ambient('west'); },
        update: (c, t, k, dt) => { c.westCrew.forEach((a) => { a.position.z = 12 - t * 0.6; animateAvatar(a, dt, true, t); }); c.look(4 - k * 4, 2.2, 2400 + 20 - k * 3, 0, 2, 2400 - 2); } },
      { dur: 10, sepia: true, caption: '1887년 6월 6일. 은행 강도의 누명을 쓴 떠돌이, 잭 모로우.\n증인 넷이 그를 보았다고 했다.', setup: (c) => { c.show('west'); c.scene.background = new THREE.Color('#e0a870'); c.scene.fog = new THREE.Fog('#e0a870', 20, 80); c.westCrew.forEach((a) => (a.visible = false)); c.jack.visible = true; A()?.ambient(null); A()?.play('bell'); },
        update: (c, t, k, dt) => { animateAvatar(c.jack, dt, false, t); c.look(Math.sin(t * 0.2) * 3, 2.6, 2400 + 5, 0, 2.4, 2400 - 1); } },
      { dur: 8, caption: '해 질 녘, 그는 교수대에 섰다.\n그날 밤 모래폭풍이 마을을 삼켰다.', capAt: 1.2, setup: (c) => { c.show('west'); c.night(0.06, '#2a1408'); A()?.play(c.fear >= 2 ? 'scream' : 'wind'); },
        update: (c, t, k) => { c.jack.visible = t < 4.5; c.look(3 - k * 2, 1.4, 2400 + 6 - k * 2, 0, 3.4, 2400 - 1); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('레드 메사', '— 교수대 마을 —'); A()?.play(c.fear >= 2 ? 'sting' : 'bell'); } },
    ];
    if (kind === 'west_true') return [
      { dur: 10, caption: '"당신은 결백해요."\n140년 만에, 해가 떴다.', setup: (c) => { c.show('west'); c.scene.background = new THREE.Color('#ffb880'); c.scene.fog = new THREE.Fog('#ffb880', 25, 90); c.westSun.intensity = 2.4; c.jack.position.set(0, 0, 3); c.jack.visible = true; c.westGallows.visible = false; A()?.play('bell'); },
        update: (c, t, k, dt) => { animateAvatar(c.jack, dt, false, t, false, 'wave', t); c.jack.position.y = Math.max(0, t - 6) * 0.4; c.look(3, 2, 2400 + 10, 0, 1.5, 2400 + 3); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('해 뜨는 레드 메사', '「피고 잭 모로우 — 무죄」'); A()?.play('bell'); } },
    ];
    return [
      { dur: 8, caption: '다음 날 아침, 차 앞유리에 붙은 종이 한 장.\n【WANTED】', setup: (c) => { c.show('west'); c.night(0.04, '#1a0e0a'); c.jack.visible = false; A()?.ambient('horror'); },
        update: (c, t, k, dt) => { c.westCrew.forEach((a) => animateAvatar(a, dt, false, t, false, 'shiver', t)); c.look(0, 1.8, 2400 + 17 - k * 3, 0, 1.2, 2400 + 12); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('새 현상수배', '잭의 유품을 모두 모으면, 다른 결말이…'); A()?.play(c.fear >= 2 ? 'sting' : 'whisper'); } },
    ];
  }

  // ── 츠바키야
  buildKimono(looks) {
    return this.set('kimono', (g) => {
      g.position.set(0, 0, -2400);
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: '#2a3324', roughness: 1 })); gr.rotation.x = -Math.PI / 2; g.add(gr);
      [[-6, -4], [6, -4.5], [-8, 3], [8, 3], [-3, -7], [3, -7]].forEach(([x, z]) => this.prop(g, { t: 'tree', x, z, color: '#c8202a' }));
      [[-3, 0], [3, 0], [-3, 4], [3, 4]].forEach(([x, z]) => this.prop(g, { t: 'stone_lantern', x, z }));
      this.prop(g, { t: 'torii', x: 0, z: 8 }); this.prop(g, { t: 'well', x: 0, z: -3 }); this.prop(g, { t: 'koi_pond', x: 5, z: 1.5 });
      this.yuki = createAvatar({ outfit: 'kimono', hair: 'long', hairColor: '#111', ears: 'none', eyes: 'closed', mouth: 'flat', body: '#f4ece4', accent: '#b81c26' });
      this.yuki.position.set(0, 0, -1.6); this.yuki.rotation.y = Math.PI; g.add(this.yuki);
      this.haru = createAvatar({ outfit: 'plain', hair: 'short', hairColor: '#1a1414', ears: 'none', eyes: 'smile', mouth: 'smile', body: '#f1c27d', accent: '#3a4a3a' });
      this.haru.position.set(1.4, 0, 6.5); this.haru.visible = false; g.add(this.haru);
      this.kimCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-2 + i * 1.2, 0, 11); a.rotation.y = Math.PI; g.add(a); return a; });
      this.kimLight = new THREE.HemisphereLight('#8a7aa0', '#1a1018', 0.9); g.add(this.kimLight);
      const moon = new THREE.DirectionalLight('#c8c0ff', 0.7); moon.position.set(-6, 12, 4); g.add(moon);
    });
  }
  kimonoShots(kind, looks) {
    const A = () => this.audio;
    this.buildKimono(looks);
    if (kind === 'kimono_intro') return [
      { dur: 9, caption: '2026년 11월 9일 밤.\n90년 전 문을 닫은 온천 여관, 츠바키야.', setup: (c) => { c.show('kimono'); c.night(0.04, '#0a0610'); c.yuki.visible = false; A()?.ambient('kimono'); },
        update: (c, t, k, dt) => { c.kimCrew.forEach((a) => { a.position.z = 11 - t * 0.5; animateAvatar(a, dt, true, t); }); c.look(3 - k * 3, 2, -2400 + 16 - k * 3, 0, 1.4, -2400); } },
      { dur: 10, sepia: true, caption: '1926년 봄. 여관집 딸 유키는 혼례 전날 밤,\n정원사 하루와 달아나기로 약속했다.', setup: (c) => { c.show('kimono'); c.scene.background = new THREE.Color('#d8b0a0'); c.scene.fog = new THREE.Fog('#d8b0a0', 15, 60); c.kimCrew.forEach((a) => (a.visible = false)); c.yuki.visible = true; c.yuki.rotation.y = 0; c.haru.visible = true; A()?.ambient(null); A()?.play('bell'); },
        update: (c, t, k, dt) => { animateAvatar(c.yuki, dt, false, t, false, 'heart', t); animateAvatar(c.haru, dt, false, t, false, 'wave', t); c.look(4, 1.8, -2400 + 4, 0.7, 1.1, -2400 + 2); } },
      { dur: 8, caption: '그날 밤, 유키는 돌아오지 않았다.\n동백은 송이째 떨어졌다.', capAt: 1.2, setup: (c) => { c.show('kimono'); c.night(0.06, '#14040a'); c.haru.visible = false; c.yuki.position.set(0, 0, -2.4); c.yuki.rotation.y = Math.PI; A()?.play(c.fear >= 2 ? 'scream' : 'whisper'); },
        update: (c, t, k) => { c.look(0, 1.5, -2400 + 4 - k * 2.5, 0, 1.2, -2400 - 3); if (t > 5) c.yuki.rotation.y = Math.PI + Math.min(1, t - 5) * Math.PI; } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('츠바키야', '— 붉은 동백의 밤 —'); A()?.play(c.fear >= 2 ? 'sting' : 'bell'); } },
    ];
    if (kind === 'kimono_true') return [
      { dur: 11, caption: '"하루는 매년 왔어요."\n유키는 하루의 손을 잡고 동백 문을 지났다.', setup: (c) => { c.show('kimono'); c.scene.background = new THREE.Color('#ffd8d0'); c.scene.fog = new THREE.Fog('#ffd8d0', 20, 70); c.kimLight.intensity = 2; c.kimCrew.forEach((a) => (a.visible = false)); c.yuki.visible = true; c.haru.visible = true; c.yuki.position.set(-0.5, 0, 4); c.haru.position.set(0.5, 0, 4); A()?.play('musicbox'); },
        update: (c, t, k, dt) => { [c.yuki, c.haru].forEach((a) => { a.rotation.y = 0; a.position.z = 4 + t * 0.4; animateAvatar(a, dt, true, t); }); c.look(0, 1.8, -2400 + 14, 0, 1.2, -2400 + 6); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('동백이 피는 아침', '부부 동백'); A()?.play('bell'); } },
    ];
    return [
      { dur: 8, caption: '일주일 뒤, 붉은 비단으로 싼 혼례 초대장.\n「신랑 자리를 비워 두었습니다」', setup: (c) => { c.show('kimono'); c.night(0.05, '#0a0408'); c.haru.visible = false; c.yuki.position.set(0, 0, 2); A()?.ambient('horror'); },
        update: (c, t, k) => { c.look(0, 1.6, -2400 + 8 - k * 3, 0, 1.3, -2400 + 2); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('빈 혼례석', '유키의 유품을 모두 찾으면, 다른 결말이…'); A()?.play(c.fear >= 2 ? 'sting' : 'whisper'); } },
    ];
  }

  // ── 삐에로 (블루문 서커스)
  buildClown(looks) {
    return this.set('clown', (g) => {
      g.position.set(3200, 0, 0);
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshStandardMaterial({ color: '#2a1a22', roughness: 1 })); gr.rotation.x = -Math.PI / 2; g.add(gr);
      this.prop(g, { t: 'big_top', x: 0, z: -10, r2: 8, h: 9 });
      this.prop(g, { t: 'ticket_booth', x: -6, z: 2, r: 40 }); this.prop(g, { t: 'balloon_stand', x: 5, z: 3 }); this.prop(g, { t: 'popcorn_cart', x: 7, z: -1, r: -40 });
      this.prop(g, { t: 'lantern_string', x: 0, z: 0, len: 14 }); this.prop(g, { t: 'clown_statue', x: -3, z: 6, r: 160 }); this.prop(g, { t: 'jack_box', x: 3.5, z: -3.5 });
      this.poppy = createAvatar({ outfit: 'clown', extra: 'clown', hair: 'spiky', hairColor: '#ff4a1a', ears: 'none', eyes: 'smile', mouth: 'grin', cheeks: 'none', body: '#f6f2ea', accent: '#d6303a', hat: 'none' });
      this.poppy.position.set(0.6, 0, 2.5); g.add(this.poppy);
      this.byul = createAvatar({ outfit: 'plain', hair: 'twintail', hairColor: '#2b1d16', ears: 'none', eyes: 'sparkle', mouth: 'open', cheeks: 'blush', body: '#ffe0cc', accent: '#d6303a', hat: 'none', acc: 'teddy' });
      this.byul.position.set(-0.6, 0, 2.5); this.byul.scale.setScalar(0.75); g.add(this.byul);
      this.clownCrew = (looks.length ? looks : [{}]).slice(0, 4).map((l, i) => { const a = createAvatar(l); a.position.set(-2 + i * 1.2, 0, 12); a.rotation.y = Math.PI; g.add(a); return a; });
      this.clownFire = new THREE.PointLight('#ff6a20', 0, 30, 1.6); this.clownFire.position.set(0, 4, -8); g.add(this.clownFire);
      this.clownHemi = new THREE.HemisphereLight('#a07ab0', '#1a0a14', 0.9); g.add(this.clownHemi);
      const moon = new THREE.DirectionalLight('#c8b0ff', 0.6); moon.position.set(-8, 12, 6); g.add(moon);
    });
  }
  clownShots(kind, looks) {
    const A = () => this.audio;
    this.buildClown(looks);
    const X = 3200;
    if (kind === 'clown_intro') return [
      { dur: 9, caption: '2026년 12월 24일 밤 8시.\n27년 전 문을 닫은 폐유원지, 블루문 랜드.', setup: (c) => { c.show('clown'); c.night(0.035, '#0e0610'); c.poppy.visible = false; c.byul.visible = false; c.clownFire.intensity = 0; A()?.ambient('clown'); },
        update: (c, t, k, dt) => { c.clownCrew.forEach((a) => { a.position.z = 12 - t * 0.7; animateAvatar(a, dt, true, t); }); c.look(X + 4 - k * 4, 2.2, 20 - k * 4, X, 2.5, -4); } },
      { dur: 10, sepia: true, caption: '1998년 12월 24일, 블루문 서커스의 고별 공연.\n맨 앞줄 7번, 여덟 살 은별이는 삐에로 뽀삐를 보러 왔다.', setup: (c) => { c.show('clown'); c.scene.background = new THREE.Color('#d8b8a0'); c.scene.fog = new THREE.Fog('#d8b8a0', 18, 70); c.clownCrew.forEach((a) => (a.visible = false)); c.poppy.visible = true; c.byul.visible = true; c.poppy.rotation.y = -0.5; c.byul.rotation.y = 0.5; A()?.ambient(null); A()?.play('jackbox'); },
        update: (c, t, k, dt) => { animateAvatar(c.poppy, dt, false, t, false, 'wave', t); animateAvatar(c.byul, dt, false, t, false, 'heart', t); c.look(X + 2.4, 1.5, 7 - k, X, 1.0, 2.5); } },
      { dur: 8, caption: '그날 밤 천막에 불이 났다.\n아이와 광대는 끝내 돌아오지 않았다.', capAt: 1.2, setup: (c) => { c.show('clown'); c.night(0.05, '#1a0404'); c.poppy.visible = false; c.byul.visible = false; A()?.play(c.fear >= 2 ? 'scream' : 'whisper'); },
        update: (c, t, k) => { c.clownFire.intensity = 25 + Math.random() * 25; c.look(X, 3 + k, 12 - k * 4, X, 4, -10); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('삐에로', '— 블루문 서커스의 마지막 앵콜 —'); A()?.play(c.fear >= 2 ? 'clown_laugh' : 'calliope_far'); } },
    ];
    if (kind === 'clown_true') return [
      { dur: 11, caption: '"앵콜!"\n은별이가 뽀삐의 얼굴에 빨간 코를 달아 주었다.', setup: (c) => { c.show('clown'); c.scene.background = new THREE.Color('#ffd0b8'); c.scene.fog = new THREE.Fog('#ffd0b8', 20, 80); c.clownHemi.intensity = 2.2; c.clownFire.intensity = 0; c.clownCrew.forEach((a) => (a.visible = false)); c.poppy.visible = true; c.byul.visible = true; c.poppy.rotation.y = 0; c.byul.rotation.y = 0; A()?.play('musicbox'); },
        update: (c, t, k, dt) => { animateAvatar(c.poppy, dt, false, t, false, t < 6 ? 'bow' : 'wave', t); animateAvatar(c.byul, dt, false, t, false, t < 6 ? 'bow' : 'jump', t); c.look(X, 1.7, 8 - k * 1.5, X, 1.1, 2.5); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('마지막 앵콜', '불길 속으로 돌아간 광대 · 28년 만의 누명 해제'); A()?.play('bell'); } },
    ];
    return [
      { dur: 8, caption: '일주일 뒤, 영상의 마지막 프레임.\n천막 입구에 새 포스터가 붙어 있었다.', setup: (c) => { c.show('clown'); c.night(0.05, '#0a0408'); c.poppy.visible = false; c.byul.visible = false; c.clownFire.intensity = 0; A()?.ambient('horror'); },
        update: (c, t, k, dt) => { c.clownCrew.forEach((a) => animateAvatar(a, dt, false, t, false, 'shiver', t)); c.look(X, 1.8, 16 - k * 3, X, 1.4, 11); } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('새 단원 모집 완료', '은별의 물건을 모두 찾으면, 다른 결말이…'); A()?.play(c.fear >= 2 ? 'clown_laugh' : 'whisper'); } },
    ];
  }

  // ── 재생
  play(kind, { looks = [], audio, fear = 2 } = {}) {
    this.clear();
    this.audio = audio; this.fear = fear;
    const shots = this.makeShots(kind, looks);
    this.shots = shots; this.i = -1; this.t = 0; this.active = true;
    this.ui.root.classList.remove('hidden');
    document.body.classList.add('cine-on');
    this.next();
    return new Promise((res) => (this.done = res));
  }
  next() {
    this.i++;
    const s = this.shots[this.i];
    if (!s) return this.finish();
    this.t = 0;
    this.ui.cap.classList.remove('on'); this.ui.ttl.classList.remove('on');
    this.ui.fade.style.opacity = 1; setTimeout(() => (this.ui.fade.style.opacity = 0), 60);
    this.r.domElement.style.filter = s.sepia ? 'sepia(0.85) contrast(1.05) brightness(0.95)' : '';
    s.setup?.(this);
    if (s.caption) setTimeout(() => { if (this.shots[this.i] === s) { this.ui.cap.textContent = s.caption; this.ui.cap.classList.add('on'); } }, (s.capAt || 0.8) * 1000);
  }
  skip() { if (this.active) this.finish(); }
  finish() {
    if (!this.active) return;
    this.active = false;
    this.r.domElement.style.filter = '';
    this.ui.root.classList.add('hidden'); document.body.classList.remove('cine-on'); this.ui.cap.classList.remove('on'); this.ui.ttl.classList.remove('on');
    this.audio?.ambient(null);
    this.clear();
    this.done?.();
  }
  update(dt) {
    if (!this.active) return;
    const s = this.shots[this.i]; if (!s) return;
    this.t += dt;
    s.update?.(this, this.t, Math.min(1, this.t / s.dur), dt);
    if (this.rain && this.rain.visible) { const a = this.rain.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 16; if (y < 0) y = 16; a.setY(i, y); } a.needsUpdate = true; this.rain.position.set(this.cam.position.x, 0, this.cam.position.z); }
    if (this.t >= s.dur) this.next();
  }
  render() { this.r.render(this.scene, this.cam); }
  title(t1, t2) { this.ui.t1.textContent = t1; this.ui.t2.textContent = t2 || ''; this.ui.ttl.classList.add('on'); }
  look(x, y, z, tx, ty, tz) { this.cam.position.set(x, y, z); this.cam.lookAt(tx, ty, tz); }
  night(fog = 0.035, color = '#05070b') { this.scene.background = new THREE.Color(color); this.scene.fog = new THREE.FogExp2(color, fog); }

  makeShots(kind, looks) {
    const A = () => this.audio;
    const walk = (a, dt, t) => animateAvatar(a, dt, true, t);
    if (kind.startsWith('ship')) return this.shipShots(kind, looks);
    if (kind.startsWith('doll')) return this.dollShots(kind, looks);
    if (kind.startsWith('hosp')) return this.hospShots(kind, looks);
    if (kind.startsWith('camp')) return this.campShots(kind, looks);
    if (kind.startsWith('west')) return this.westShots(kind, looks);
    if (kind.startsWith('kimono')) return this.kimonoShots(kind, looks);
    if (kind.startsWith('clown')) return this.clownShots(kind, looks);
    if (kind === 'prologue') {
      this.buildRoad(); this.buildSchool(); this.buildCircle(); this.buildStop(looks);
      return [
        { dur: 9, caption: '2026년 11월 7일, 밤 11시.\n강원도 정선 — 서하리로 가는 막차.', setup: (c) => { c.show('road'); c.night(0.03); A()?.ambient('rain'); },
          update: (c, t) => { c.bus.position.x = 20 - t * 7; c.look(c.bus.position.x + 6.5 - t * 0.25, 1.9, 3.7, c.bus.position.x - 1.5, 1.1, -1); } },
        { dur: 8, caption: '다음 주면 댐에 물이 차서,\n마을은 영영 물에 잠긴다.', setup: (c) => { c.show('road'); c.bus.position.x = 0; },
          update: (c, t) => { c.bus.position.x = -8 - t * 11; c.look(-53, 1.3, 3.9, -60, 2.2, 2.6); c.eye.intensity = t > 5 ? 8 + Math.random() * 6 : 0; if (t > 5 && !c._s1) { c._s1 = 1; A()?.play(c.fear >= 2 ? 'sting' : 'whisper'); } } },
        { dur: 11, sepia: true, caption: '1979년 11월 7일.\n서하분교 3학년 아이 일곱 명이, 그날 집에 돌아오지 않았다.', setup: (c) => { c.show('school'); c.scene.background = new THREE.Color('#d8cdb0'); c.scene.fog = new THREE.Fog('#d8cdb0', 30, 90); A()?.ambient(null); A()?.play('organ'); },
          update: (c, t, k, dt) => {
            // 아이들이 줄지어 운동장을 가로질러 교실 문으로 들어간다 (세트 기준 좌표)
            c.kids.forEach((a, i) => {
              const x0 = -8 - i * 1.3, leg = 1.3 - x0, p = Math.max(0, t * 1.6 - i * 0.5);
              if (p < leg) { a.position.set(x0 + p, 0, 6); a.rotation.y = Math.PI / 2; }
              else { a.position.set(1.3, 0, 6 - (p - leg) * 1.3); a.rotation.y = Math.PI; }
              a.visible = a.position.z > -2.4;
              if (p > 0) walk(a, dt, t);
            });
            animateAvatar(c.teacher, dt, false, t, false, 'wave', t);
            c.look(400 + 10 - k * 4, 3.2 - k * 0.6, 15 - k * 4, 400 + 1, 1.4, -1);
          } },
        { dur: 8, caption: '아무도 그 아이들을 찾지 않았다.\n47년 동안.', setup: (c) => { c.show('circle'); c.night(0.08, '#020203'); A()?.ambient('horror'); },
          update: (c, t, k) => { const a = t * 0.25; c.look(Math.sin(a) * 5, 3.5, 400 + Math.cos(a) * 5, 0, 0.6, 400); c.ghostKids.forEach((g, i) => (g.visible = t < 2 + i * 0.8)); } },
        { dur: 10, caption: '편지에는 단 한 줄이 적혀 있었다.\n"아이들을 집에 보내 주세요."', capAt: 1.5, setup: (c) => { c.show('stop'); c.night(0.04); A()?.ambient('rain'); c.stopBus.position.x = 30; },
          update: (c, t, k, dt) => {
            const b = c.stopBus;
            if (t < 3) b.position.x = 30 * (1 - t / 3) ** 2; else if (t > 6.5) b.position.x = -((t - 6.5) ** 2) * 4;
            c.crew.forEach((a) => { a.visible = t > 4; a.rotation.y = 0; animateAvatar(a, dt, false, t); });
            if (t > 8.5 && c.stopLamp) c.stopLamp.intensity = Math.random() < 0.5 ? 0 : 6; if (t > 9.4 && c.stopLamp) c.stopLamp.intensity = 0;
            c.look(-400 - 3.5, 1.6, 8.5, -400 + 0.5, 1.1, -1.5);
          } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('鬼門', '귀문 — 서하리 분교 실종사건'); A()?.ambient(null); A()?.play(c.fear >= 2 ? 'sting' : 'bell'); } },
      ];
    }
    // 엔딩
    this.buildVillage();
    const dawn = (c) => { c.scene.background = new THREE.Color('#e8a27a'); c.scene.fog = new THREE.Fog('#e8a27a', 25, 110); };
    const village = { dur: 10, caption: '새벽 다섯 시.\n댐의 수문이 열렸다.', setup: (c) => { c.show('village'); dawn(c); A()?.play('water'); },
      update: (c, t, k) => { c.water.position.y = -0.5 + k * 3.2; c.look(20 - k * 6, 11 - k * 3, -400 + 20 - k * 6, 0, 1.5, -400); } };
    if (kind === 'ending_true') {
      this.buildPath(looks);
      return [
        village,
        { dur: 12, caption: '아이들은 손을 잡고,\n마침내 집으로 돌아갔다.', capAt: 1.5, setup: (c) => { c.show('path'); c.scene.background = new THREE.Color('#fffaf0'); c.scene.fog = new THREE.Fog('#fffaf0', 12, 40); A()?.play('bell'); },
          update: (c, t, k, dt) => {
            c.pathKids.forEach((a, i) => { a.position.z = 2 + Math.floor(i / 2) * 1.1 - t * 1.5; a.visible = a.position.z > -24; walk(a, dt, t); });
            const tz = 7 - Math.min(t, 7) * 1.5; c.pathTeacher.position.z = tz;
            if (t < 7) walk(c.pathTeacher, dt, t); else { c.pathTeacher.rotation.y = Math.PI + Math.min(1, (t - 7) / 1.2) * Math.PI; animateAvatar(c.pathTeacher, dt, false, t, false, t > 8.3 ? 'bow' : null, t - 8.3); }
            c.hillCrew.forEach((a) => (a.visible = false));
            c.look(400 + 2.5, 2.2, 400 + 13 - k * 3, 400, 1.3, 400 - 6);
          } },
        { dur: 8, caption: '— 심야방송 「귀문」 편 · 끝 —', setup: (c) => { c.show('path'); c.pathKids.forEach((a) => (a.visible = false)); c.pathTeacher.visible = false; c.hillCrew.forEach((a) => (a.visible = true)); c.scene.background = new THREE.Color('#f2c49a'); c.scene.fog = new THREE.Fog('#f2c49a', 15, 50); },
          update: (c, t, k, dt) => { c.hillCrew.forEach((a, i) => animateAvatar(a, dt, false, t, false, i % 2 ? 'wave' : null, t)); c.look(400 + 0.3, 1.9, 400 + 23 - k * 1.5, 400, 1.2, 400 + 8); } },
        { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('출석 완료', '일곱 아이와 선생님은 이제 쉴 수 있게 되었습니다.'); A()?.play('bell'); } },
      ];
    }
    this.buildRoad();
    return [
      village,
      { dur: 7, caption: '서울로 돌아가는 첫차.', setup: (c) => { c.show('road'); dawn(c); c.scene.fog = new THREE.Fog('#e8a27a', 20, 120); A()?.ambient('horror'); },
        update: (c, t) => { c.bus.position.x = -t * 8; c.look(c.bus.position.x + 14, 3, -2, c.bus.position.x, 1.2, -1); } },
      { dur: 7, caption: '"…술래, 아직 다 안 찾았잖아."', capAt: 3.6, setup: (c) => { c.show('road'); c.bus.position.x = -40; c.bus.updateMatrixWorld(); c.kid = createGhost('child'); c.kid.position.set(-37.3, 0.4, -1.1); c.kid.rotation.y = Math.PI / 2; c.kid.visible = false; c.sets.road.add(c.kid); },
        update: (c, t, k, dt) => {
          c.look(-33.5, 1.7, -1.1 + Math.sin(t * 0.5) * 0.2, -38, 1.5, -1.1);
          if (t > 3 && !c.kid.visible) { c.kid.visible = true; A()?.play(c.fear >= 2 ? 'scream' : 'giggle'); }
          if (c.kid.visible) animateGhost(c.kid, dt, t, { mode: 'hunt' }, 2);
        } },
      { dur: 5, setup: (c) => { c.show(); c.scene.background = new THREE.Color('#000'); c.title('미완의 출석', '아이들의 유품을 모두 모으면, 다른 결말이…'); } },
    ];
  }
}
