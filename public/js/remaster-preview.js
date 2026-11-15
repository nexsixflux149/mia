import * as THREE from 'three';

export const isRemasterChapter = (theme, chapter) => theme === 'mia' && chapter?.id === 0;
export const PRESETS = Object.freeze({ low: { cap: 0.8, lights: 2 }, medium: { cap: 1.15, lights: 4 }, high: { cap: 1.5, lights: 6 } });

// Original procedural artwork: seeded and generated locally, no downloaded assets.
function surface(kind) {
  const n = 256, color = new Uint8Array(n * n * 4), rough = new Uint8Array(n * n * 4);
  const heights = new Float32Array(n * n);
  let seed = kind === 'wood' ? 2743 : kind === 'metal' ? 991 : 1729;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, noise = random();
    const seam = kind === 'wood' ? y % 32 < 2 : kind === 'metal' ? y % 16 < 2 : x % 64 < 2 || y % 64 < 2;
    const stain = Math.max(0, Math.sin(x * 0.063) * Math.cos(y * 0.047));
    const grain = kind === 'wood' ? Math.sin(x * 0.1 + Math.sin(y * 0.2)) * 12 : 0;
    const v = Math.max(22, 174 + noise * 36 - stain * 48 - (seam ? 62 : 0) + grain);
    heights[i] = noise * 0.12 + (seam ? 0 : 0.5) + stain * 0.08;
    const rust = kind === 'metal' && noise + stain > 1.2;
    color.set([v, v * (rust ? 0.59 : 0.96), v * (rust ? 0.32 : 0.87), 255], i * 4);
    const rv = rust ? 246 : kind === 'metal' ? 140 + noise * 55 : 205 + noise * 45;
    rough.set([rv, rv, rv, 255], i * 4);
  }
  const normals = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    const v = new THREE.Vector3((heights[y*n+(x+n-1)%n]-heights[y*n+(x+1)%n])*0.6, (heights[((y+n-1)%n)*n+x]-heights[((y+1)%n)*n+x])*0.6, 1).normalize();
    normals.set([(v.x * 0.5 + 0.5)*255, (v.y * 0.5 + 0.5)*255, (v.z * 0.5 + 0.5)*255, 255], i*4);
  }
  return [color, rough, normals].map((data, i) => {
    const t = new THREE.DataTexture(data, n, n); t.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(kind === 'stone' ? 5 : 2, kind === 'stone' ? 5 : 2);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    return t;
  });
}

export class RemasterPreview {
  constructor({ scene, camera, renderer, fx, settings }) {
    Object.assign(this, { scene, camera, renderer, fx, settings });
    this.quality = 'medium'; this.effects = 0.35; this.enabled = true; this.active = false;
    this.frames = 0; this.elapsed = 0; this.slow = 0; this.fast = 0;
    this.panel = document.createElement('section'); this.panel.setAttribute('aria-label', '독립 그래픽 테스트');
    this.panel.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:5000;background:#10171eee;color:#f3ead6;padding:12px;border:1px solid #8b8065;border-radius:10px;font:12px/1.6 sans-serif;max-width:320px';
    this.panel.innerHTML = `<details open><summary>MIA · 독립 그래픽 미리보기 (접기)</summary><div data-status>대상: 미아 1장 · 달동네 골목</div><button data-start>첫 챕터 플레이</button> <button data-compare>원본 보기</button><label style="display:block">품질 <select data-quality><option value="low">낮음 · 성능 우선</option><option value="medium" selected>보통 · 균형</option><option value="high">높음 · 그림자</option></select></label><label style="display:block">공포 화면 효과 <input data-effects aria-label="공포 화면 효과" type="range" min="0" max="1" step="0.05" value="0.35"></label><small>0: 흔들림·점프스케어 화면 끔</small><div data-metrics>로그인 후 첫 챕터 플레이를 누르세요.</div></details>`;
    document.body.append(this.panel);
    this.panel.querySelector('[data-start]').onclick = () => this.onStart?.();
    this.panel.querySelector('[data-compare]').onclick = () => { this.enabled = !this.enabled; this.refresh(); };
    this.panel.querySelector('[data-quality]').onchange = (e) => { this.quality = e.target.value; this.refresh(); };
    this.panel.querySelector('[data-effects]').oninput = (e) => { this.effects = Number(e.target.value); this.fx.previewEffects = this.effects; };
  }
  get intensity() { return this.active ? this.effects : undefined; }
  enter(world, chapter, theme) {
    if (!isRemasterChapter(theme, chapter)) { this.status('현재 챕터는 원본 그래픽입니다.'); return; }
    this.world = world;
    this.original = { fog: this.scene.fog, bg: this.scene.background, exposure: this.renderer.toneMappingExposure };
    for (const light of world.flickers) light.userData.base ??= light.intensity;
    this.originals = new Map(); this.materials = new Map(); this.lightStates = [];
    this.textures = { stone: surface('stone'), wood: surface('wood'), metal: surface('metal') };
    // Materials only: no transforms, colliders, object IDs or animation nodes change.
    world.root.traverse((o) => {
      if (o.isLight) this.lightStates.push({ light: o, intensity: o.intensity, color: o.color.clone(), visible: o.visible });
      if (!o.isMesh || !o.geometry.attributes.uv || o.material?.transparent || Array.isArray(o.material) || !o.material?.isMeshStandardMaterial || o.material.emissiveIntensity > 0 && o.material.emissive.getHex() !== 0) return;
      const old = o.material; this.originals.set(o, old);
      if (!this.materials.has(old)) {
        const m = old.clone(); const hsl = {}; m.color.getHSL(hsl);
        const kind = m.metalness > 0.2 ? 'metal' : hsl.h > 0.03 && hsl.h < 0.15 && hsl.s > 0.2 ? 'wood' : 'stone';
        const [map, roughnessMap, normalMap] = this.textures[kind];
        // Preserve all existing text, signs and authored maps.
        if (!m.map) m.map = map;
        m.roughnessMap = roughnessMap; m.normalMap = normalMap; m.normalScale.set(0.25, 0.25);
        m.roughness = kind === 'metal' ? 0.72 : 0.96; this.materials.set(old, m);
      }
    });
    // One shadow-casting moon, never a shadow map for each point light/player.
    this.moon = new THREE.DirectionalLight('#acc8e4', 0.7); this.moon.position.set(-8, 14, -6);
    this.moon.shadow.mapSize.set(1024, 1024); this.moon.shadow.camera.left = -14; this.moon.shadow.camera.right = 14;
    this.moon.shadow.camera.top = 12; this.moon.shadow.camera.bottom = -12; this.moon.shadow.camera.far = 40;
    this.moon.shadow.normalBias = 0.06;
    this.scene.add(this.moon, this.moon.target);
    this.pointLights = this.lightStates.filter(s => s.light.isPointLight).map(s => ({ ...s, position: s.light.getWorldPosition(new THREE.Vector3()) }));
    this.refresh();
  }
  status(text) { this.panel.querySelector('[data-status]').textContent = text; }
  refresh() {
    this.panel.querySelector('[data-compare]').textContent = this.enabled ? '원본 보기' : '리마스터 보기';
    if (!this.world) return;
    this.active = this.enabled; this.fx.previewActive = this.active; this.fx.previewEffects = this.effects;
    this.fx.setQuality(this.active ? this.quality : this.settings.quality);
    for (const [mesh, old] of this.originals) mesh.material = this.active ? this.materials.get(old) : old;
    for (const state of this.lightStates) { state.light.intensity = state.intensity; state.light.color.copy(state.color); state.light.visible = state.visible; }
    this.moon.visible = this.active; this.moon.castShadow = this.active && this.quality === 'high';
    if (this.active) {
      this.scene.background = new THREE.Color('#080e16'); this.scene.fog = new THREE.FogExp2('#101b25', 0.038);
      this.renderer.toneMappingExposure = 1.55;
      for (const { light, intensity } of this.lightStates) {
        if (light.isHemisphereLight) light.intensity = intensity * 0.68;
        if (light.isDirectionalLight) light.intensity = intensity * 0.35;
        if (light.isPointLight) { light.color.set('#ffcf91'); light.intensity = intensity * 0.85; }
      }
    } else { this.scene.fog = this.original.fog; this.scene.background = this.original.bg; this.renderer.toneMappingExposure = this.original.exposure; }
    this.frames = this.elapsed = this.slow = this.fast = 0; this.sampleAt = performance.now();
    this.status(this.active ? '리마스터 · 미아 1장 · 달동네 골목' : '원본 비교 · 같은 씬·같은 진행 상태');
  }
  capture() { this.renderStats = { ...this.renderer.info.render }; }
  update(t, dt, state) {
    if (!this.world) return;
    if (this.active) {
      // Restrained, continuous lamp variation; no rapid on/off flashing.
      for (const [i, s] of this.pointLights.entries()) {
        s.light.intensity = s.intensity * (0.82 + Math.sin(t * 1.4 + i) * 0.025 * this.effects);
      }
      // Retain nearest lights, including their original fixtures, bounded by preset.
      if (t >= (this.nextLights || 0)) {
        this.pointLights.sort((a,b) => a.position.distanceToSquared(this.camera.position) - b.position.distanceToSquared(this.camera.position));
        this.pointLights.forEach((s,i) => { s.light.visible = s.visible && i < PRESETS[this.quality].lights; });
        this.nextLights = t + 0.25;
      }
      this.fx.previewEffects = this.effects;
    }
    this.frames++; this.elapsed = (performance.now() - this.sampleAt) / 1000;
    if (this.elapsed >= 2) {
      this.fps = this.frames / this.elapsed;
      const info = this.renderer.info;
      this.panel.querySelector('[data-metrics]').textContent = `${this.fps.toFixed(0)} FPS · ${this.renderStats?.calls ?? 0} calls · ${((this.renderStats?.triangles ?? 0)/1000).toFixed(1)}k triangles · ${info.memory.textures} textures · DPR ${this.renderer.getPixelRatio().toFixed(2)}`;
      if (this.active) {
        this.slow = this.fps < 32 ? this.slow + 1 : 0; this.fast = this.fps > 55 ? this.fast + 1 : 0;
        if (this.slow >= 2 || this.fast >= 4) {
          const cap = Math.min(devicePixelRatio || 1, PRESETS[this.quality].cap);
          this.fx.previewRatio = THREE.MathUtils.clamp(this.fx.previewRatio + (this.slow >= 2 ? -0.1 : 0.05), Math.min(0.6, cap), cap);
          this.fx.applyPreviewRatio(); this.slow = this.fast = 0;
        }
      }
      this.frames = this.elapsed = 0; this.sampleAt = performance.now();
    }
  }
  leave() {
    if (!this.world) return;
    this.enabledBefore = this.enabled; this.enabled = false; this.refresh(); this.enabled = this.enabledBefore;
    for (const m of this.materials.values()) m.dispose();
    for (const maps of Object.values(this.textures)) for (const t of maps) t.dispose();
    this.scene.remove(this.moon, this.moon.target); this.moon.shadow.map?.dispose(); this.moon.dispose();
    this.world = null; this.active = false; this.status('대상: 미아 1장 · 달동네 골목');
  }
}
