import { decorateXmas, buildXmasProp } from './xmas-visuals.js';
import { createAvatar, animateAvatar } from './avatar.js';
import { dressScenery } from './refined-models.js';
import * as THREE from 'three';

export function makeXmasShots(c, kind, looks) {
  const intro = kind === 'xmas_intro';
  const truth = kind === 'xmas_true';
  const chapter = intro ? 0 : truth ? 1 : 2;
  const actors = [];
  let animate, parcel;
  c.set('xmas', root => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 72), new THREE.MeshStandardMaterial({
      color: chapter === 1 ? '#97b7c1' : '#39303c', roughness: .78,
    }));
    floor.rotation.x = -Math.PI / 2; root.add(floor);
    animate = decorateXmas(root, chapter, { cinema: true });
    for (const side of [-1, 1]) {
      for (const z of [-10, -5, 2]) {
        const tree = buildXmasProp({ t: 'xmas_fir' });
        tree.position.set(side * (6.7 + (z === -10 ? 1.4 : 0)), 0, z);
        root.add(tree);
        dressScenery(tree, root, { t: 'xmas_fir' });
      }
    }
    parcel = buildXmasProp({ t: 'xmas_stack' });
    parcel.position.set(.3, 0, -2.4);
    root.add(parcel);
    dressScenery(parcel, root, { t: 'xmas_stack' });
    const cast = [
      { outfit: 'blazer', accent: '#ad2749', hair: 'bob', hairColor: '#301e24', eyes: 'big' },
      { outfit: 'sailor', accent: '#efb764', hair: 'bowl', hairColor: '#2c1921', eyes: 'big' },
      ...(looks.length ? looks.slice(0, 2) : [{}]),
    ];
    cast.forEach((look, i) => {
      const a = createAvatar(look);
      a.position.set((i - 1.5) * 1.17, 0, -5 + (i % 2) * .38);
      root.add(a); actors.push(a);
    });
    for (const a of actors) a.visible = false;
  });
  const start = s => {
    s.show('xmas');
    const color = intro ? '#0c1923' : truth ? '#203749' : '#171428';
    s.scene.background = new THREE.Color(color);
    s.scene.fog = new THREE.FogExp2(color, .040);
    s.audio?.ambient(kind);
  };
  const tick = (t, dt, walk = false, restored = false) => {
    animate(t, restored);
    actors.forEach(a => animateAvatar(a, dt, walk, t));
  };
  const closing = (title, sub) => ({ dur: 4, setup: s => {
    s.show(); s.scene.background = new THREE.Color('#090d17'); s.title(title, sub);
  } });
  if (intro) return [
    { dur: 7, caption: '12월 24일 23:57.\n아무도 배달하지 않은 소포가 도착했다.', setup: start,
      update: (s, t, k, dt) => { tick(t, dt); s.look(5 - k * 3.2, 3.25 - k, 8 - k * 2, .3, .7, -2.4); } },
    { dur: 7, caption: '보내는 사람은 공란. 받는 사람은 당신.\n발송일은 아직 오지 않은 내일.', setup: () => { actors[2].visible = true; actors[2].position.set(1.35, 0, -2.83); },
      update: (s, t, k, dt) => { tick(t, dt); s.look(2.4 - k * 2.5, 1.87, .65 - k * 1.1, .45, .86, -2.4); } },
    { dur: 6, caption: '유리 너머에서 붉은 외투가 손짓했다.\n“그 열차가 떠나기 전에, 나를 찾아.”', setup: () => { actors[0].visible = true; actors[0].position.set(-1.8, 0, -6); },
      update: (s, t, k, dt) => { tick(t, dt, true); actors[0].position.z = -6 - t * .48; s.look(-4 + k * 2, 2.2, .8 - k * 2, -1.8, 1.1, actors[0].position.z); } },
    closing('크리스마스 · 자정에 반송된 선물', '0번 우체국에서 시작되는 특별판'),
  ];
  if (truth) return [
    { dur: 8, caption: '마지막 종이 울리기 직전,\n아이들이 열차에서 내려 서윤의 손을 잡았다.', setup: s => { start(s); parcel.visible = false; actors[0].visible = true; actors[1].visible = true; actors[0].position.x = -1.8; },
      update: (s, t, k, dt) => { tick(t, dt, t < 4, true); actors[1].position.x = -.6 - Math.min(1, t / 4) * .62; s.look(5.5 - k * 3, 2.9, 1 - k * 2, -1.4, 1.1, -5); } },
    { dur: 8, caption: '“이번에는 우리도 기다릴게요.”\n그리고 시계가 처음으로 00:02를 가리켰다.', setup: s => { s.scene.background.set('#415470'); actors.forEach(a => { a.visible = true; }); },
      update: (s, t, k, dt) => { tick(t, dt, true, true); actors.forEach((a, i) => { a.position.z = -5 - t * .63; a.position.x = (i - 1.5) * .94; a.rotation.y = Math.PI; }); s.look(1 + k * 4, 2.6 + k * 2, 1 + k * 5, 0, 1.1, -8); } },
    closing('남겨두고 가지 않아요', '크리스마스 특별판 · 진 엔딩'),
  ];
  return [
    { dur: 8, caption: '아이들은 눈 덮인 마을에 도착했다.\n창밖에서 서윤이 빈 손을 흔들고 있었다.', setup: s => { start(s); actors[0].visible = true; actors[1].visible = true; actors[1].position.z = -2; },
      update: (s, t, k, dt) => { tick(t, dt, t < 3, true); s.look(2 + k * 4, 2.1, .2 + k * 6.4, -1, 1.1, -5); } },
    { dur: 7, caption: '다음 날 현관에 빈 상자가 놓여 있었다.\n바닥에는 아직 채우지 못한 세 칸이 남아 있었다.', setup: () => { actors.forEach(a => { a.visible = false; }); },
      update: (s, t, k, dt) => { tick(t, dt); s.look(1.9 - k * .8, 2.4 - k * .9, 1.4 - k * 1.3, .3, .72, -2.4); } },
    closing('돌아온 사람들', '반송의 흔적 세 가지를 찾으면 결말이 달라집니다'),
  ];
}
