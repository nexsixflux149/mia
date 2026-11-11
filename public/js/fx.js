import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// 공포 연출용 화면 셰이더: 필름 그레인 · 비네팅 · 색수차 · 위험할 때 화면 일렁임
const HorrorShader = {
  uniforms: {
    tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0.06 }, vignette: { value: 1.0 },
    danger: { value: 0 }, desat: { value: 0.15 }, brightness: { value: 1 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, vignette, danger, desat, brightness; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      // 위험할수록 화면이 숨 쉬듯 일렁인다
      uv += c * sin(time * 3.0) * 0.012 * danger;
      uv.x += sin(uv.y * 40.0 + time * 8.0) * 0.0025 * danger;
      float ca = 0.0015 + 0.008 * danger;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ca).b;
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(col, vec3(l), desat);
      col.r += danger * 0.08 * (0.6 + 0.4 * sin(time * 6.0));
      col *= brightness;
      float v = smoothstep(0.85, 0.2, length(c) * (1.0 + 0.35 * danger));
      col *= mix(1.0, v, vignette);
      col += (rnd(uv * 1000.0 + time) - 0.5) * grain; // grain 은 0 (화면 노이즈 없음)
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// 휴대폰 GPU에서 카메라가 조명 받은 물체에 바짝 붙으면 밝기 값이 한도를 넘어(무한대/NaN)
// 빛 번짐(블룸) 처리 중 검은 사각 블록이 화면 전체로 번진다. 블룸 전에 값을 정상 범위로 되돌린다.
const SanitizeShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    bool bad(float v){ return !(v == v) || abs(v) > 60000.0; }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 x = c.rgb;
      if (bad(x.r) || bad(x.g) || bad(x.b)) x = vec3(0.0); // 잘못된 값은 눈부신 흰색 대신 어둡게
      gl_FragColor = vec4(clamp(x, 0.0, 12.0), 1.0);
    }`,
};

export class FX {
  constructor(renderer, scene, camera) {
    this.r = renderer; this.scene = scene; this.camera = camera;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.composer.addPass(new ShaderPass(SanitizeShader));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.55, 0.6, 0.82);
    this.composer.addPass(this.bloom);
    this.horror = new ShaderPass(HorrorShader);
    this.composer.addPass(this.horror);
    this.composer.addPass(new OutputPass());
    this.quality = 'high';
    this.brightness = 1;
  }
  setQuality(q) {
    this.quality = q;
    // 휴대폰은 고해상도 화면이라 픽셀이 너무 많다 — '높음'도 1.5배까지만
    const mobile = matchMedia('(pointer: coarse)').matches;
    // '보통'도 '높음'과 같은 선명도(해상도)로 그린다. 차이는 그림자 품질 정도
    // 선명하게: 휴대폰 '보통' 1.5배 · '높음' 2배, PC 는 화면 그대로(최대 2배). 빛 번짐·그림자는 눈부셔서 끈다
    if (q === 'low') q = this.quality = 'medium';
    const pr = Math.min(mobile ? (q === 'high' ? 2 : 1.5) : 2, Math.max(1, devicePixelRatio));
    this.bloom.enabled = false;
    this.r.setPixelRatio(pr);
    this.composer.setPixelRatio(pr);
    this.r.shadowMap.enabled = false;
    this.resize();
  }
  resize() { this.r.setSize(innerWidth, innerHeight); this.composer.setSize(innerWidth, innerHeight); this.bloom.resolution.set(innerWidth / 2, innerHeight / 2); }
  render(t, { danger = 0, mode = 'game' } = {}) {
    const u = this.horror.uniforms;
    u.time.value = t;
    u.danger.value += (danger - u.danger.value) * 0.08;
    u.brightness.value = this.brightness;
    if (mode === 'lobby') { u.grain.value = 0; u.vignette.value = 0; u.desat.value = 0; this.bloom.strength = 0.3; this.bloom.threshold = 1.15; }
    else { u.grain.value = 0.04; u.vignette.value = 1; u.desat.value = 0.2; this.bloom.strength = 0.65; this.bloom.threshold = 1.05; }
    this.composer.render();
  }
}

// 손전등 빛줄기 (부피감 있는 원뿔)
export function makeBeam() {
  const h = 7;
  const geo = new THREE.ConeGeometry(2.0, h, 32, 1, true);
  geo.translate(0, -h / 2, 0); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color('#fff1d6') }, strength: { value: 0.09 } },
    vertexShader: `varying float vT; varying vec3 vN; varying vec3 vV;
      void main(){ vT = position.z / ${h.toFixed(1)}; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 color; uniform float strength; varying float vT; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(vN, vV)), 2.0); float a = strength * pow(1.0 - clamp(vT,0.0,1.0), 1.6) * edge; gl_FragColor = vec4(color * a, a); }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = 0.16;
  m.renderOrder = 3;
  return m;
}
