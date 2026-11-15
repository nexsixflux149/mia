import * as THREE from 'three';
import { upgradeWorld, gfx } from './visual-upgrade.js';

// ───── 그래픽 강화 (zip 'mia-graphics-only' 의 RemasterPreview 를 운영용으로 다듬은 것)
//  챕터에 들어갈 때마다:
//   ① 재질에 돌 · 나무 · 금속 무늬(색 · 거칠기 · 요철)를 입힌다 — 평균 밝기와 색은 그대로, 결만 더한다.
//   ② 나무 · 풀 · 집 · 바닥 디테일(visual-upgrade.js)로 바꾼다.
//  건드리지 않는 것: 조명 · 노출 · 안개 · 해상도 · 그레인/비네트/흔들림 같은 화면 효과 · 귀신 빛 · 손전등 — 공포 분위기는 예전 그대로.
//  테스트용 떠 있는 패널, 귀신 비교 창, 조명 개수 제한은 넣지 않았다.

// ── 코드로 그린 표면 무늬 (돌 · 나무 · 금속): 한 번만 만들어 모든 챕터가 함께 쓴다
const SURF = {};
const toLinear = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
function surface(kind) {
  if (SURF[kind]) return SURF[kind];
  const n = 256, color = new Uint8Array(n * n * 4), rough = new Uint8Array(n * n * 4), heights = new Float32Array(n * n);
  let seed = kind === 'wood' ? 2743 : kind === 'metal' ? 991 : 1729;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const sum = [0, 0, 0]; let rsum = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, noise = random();
    const seam = kind === 'wood' ? y % 32 < 2 : kind === 'metal' ? y % 16 < 2 : x % 64 < 2 || y % 64 < 2;
    const stain = Math.max(0, Math.sin(x * 0.063) * Math.cos(y * 0.047));
    const grain = kind === 'wood' ? Math.sin(x * 0.1 + Math.sin(y * 0.2)) * 12 : 0;
    const v = Math.max(22, 174 + noise * 36 - stain * 48 - (seam ? 62 : 0) + grain);
    heights[i] = noise * 0.12 + (seam ? 0 : 0.5) + stain * 0.08;
    const rust = kind === 'metal' && noise + stain > 1.2;
    const rgb = [v, v * (rust ? 0.59 : 0.96), v * (rust ? 0.32 : 0.87)];
    color.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
    for (let c = 0; c < 3; c++) sum[c] += toLinear(rgb[c]);
    const rv = rust ? 246 : kind === 'metal' ? 140 + noise * 55 : 205 + noise * 45;
    rough.set([rv, rv, rv, 255], i * 4); rsum += rv / 255;
  }
  const normals = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    const v = new THREE.Vector3((heights[y * n + (x + n - 1) % n] - heights[y * n + (x + 1) % n]) * 0.6, (heights[((y + n - 1) % n) * n + x] - heights[((y + 1) % n) * n + x]) * 0.6, 1).normalize();
    normals.set([(v.x * 0.5 + 0.5) * 255, (v.y * 0.5 + 0.5) * 255, (v.z * 0.5 + 0.5) * 255, 255], i * 4);
  }
  const maps = [color, rough, normals].map((data, i) => {
    const t = new THREE.DataTexture(data, n, n); t.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(kind === 'stone' ? 5 : 2, kind === 'stone' ? 5 : 2);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    return t;
  });
  // 무늬를 입혀도 원래 밝기 · 색이 변하지 않게: 무늬의 평균(선형)으로 나눈 값을 재질 색에 곱해 준다
  const N = n * n; SURF[kind] = { maps, gain: sum.map((s) => N / s), roughMean: rsum / N };
  return SURF[kind];
}

export class GraphicsUpgrade {
  constructor() { this.ctx = null; this.originals = new Map(); this.clones = new Map(); this.detail = null; }
  get active() { return !!this.detail; }

  /** 챕터에 들어갈 때 (세계를 만든 직후) */
  enter(world, chapter, theme) {
    this.leave();
    this.ctx = { world, chapter, theme };
    if (gfx.on) this.safeBuild();
  }
  /** 챕터를 나갈 때 (세계를 지우기 전에): 바꿔 둔 재질을 원래대로 돌리고 정리한다 */
  leave() { this.teardown(); this.ctx = null; }
  /** 설정 · 자동 끄기: 지금 있는 챕터에 바로 켜고 끈다 */
  setOn(on) {
    gfx.on = on;
    if (!this.ctx) return;
    if (on && !this.detail) this.safeBuild(); else if (!on) this.teardown();
  }
  setQuality(q) { gfx.quality = q; this.detail?.setQuality(q); }
  /** 매 프레임: 카메라와 캐릭터 사이를 가리는 나무는 잠시 치운다 */
  update(camera, player) {
    if (!this.detail) return;
    try { this.detail.update(camera, player); } catch (e) { console.warn('[그래픽 강화] 오류가 나서 이 챕터에서는 끕니다', e); this.teardown(); }
  }
  /** 덤으로 얹는 기능이라, 만드는 도중 무슨 일이 생겨도 게임이 멈추면 안 된다: 실패하면 예전 모습 그대로 돌려 놓고 넘어간다 */
  safeBuild() { try { this.build(); } catch (e) { console.warn('[그래픽 강화] 건너뜁니다 (예전 그래픽으로 보여 줍니다)', e); this.teardown(); } }

  build() {
    const { world, chapter, theme } = this.ctx; if (!world) return;
    this.originals = new Map(); this.clones = new Map();
    // 재질만 바꾼다: 위치 · 충돌 · 물건 번호 · 움직임은 그대로
    world.root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry?.attributes?.uv || o.userData.noUpgrade) return;
      const old = o.material;
      if (!old || Array.isArray(old) || !old.isMeshStandardMaterial || old.transparent || old.alphaTest > 0) return;
      if (old.emissiveIntensity > 0 && old.emissive.getHex() !== 0) return;     // 스스로 빛나는 것
      if (old.roughness < 0.5 || old.metalness > 0.6) return;                    // 거울 · 광택 칠 · 윤나는 금속은 만든 사람이 정한 모습 그대로
      this.originals.set(o, old);
      if (!this.clones.has(old)) {
        const m = old.clone(); const hsl = {}; m.color.getHSL(hsl);
        const kind = m.metalness > 0.2 ? 'metal' : hsl.h > 0.03 && hsl.h < 0.15 && hsl.s > 0.2 ? 'wood' : 'stone';
        const { maps: [map, roughnessMap, normalMap], gain, roughMean } = surface(kind);
        if (!m.map) { m.map = map; m.color.r *= gain[0]; m.color.g *= gain[1]; m.color.b *= gain[2]; } // 글씨 · 간판 · 그려 둔 무늬는 그대로 둔다
        m.normalMap = normalMap; m.normalScale.set(0.25, 0.25);
        // 거칠기 무늬: 평균 거칠기가 예전과 같을 때만 입힌다 (거의 완전히 거친 면은 무늬를 얹으면 오히려 번들거리니 그대로 둔다)
        if (old.roughness <= roughMean) { m.roughnessMap = roughnessMap; m.roughness = old.roughness / roughMean; }
        this.clones.set(old, m);
      }
      o.material = this.clones.get(old);
    });
    this.detail = upgradeWorld(world, chapter, theme);
  }

  teardown() {
    for (const [mesh, old] of this.originals) mesh.material = old;
    for (const m of this.clones.values()) m.dispose();
    this.originals = new Map(); this.clones = new Map();
    this.detail?.dispose(); this.detail = null;
  }
}
