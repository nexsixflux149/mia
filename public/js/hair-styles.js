import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { markShared } from './props.js';
import { MORE_OPTIONS } from './customization-options.js';

const hairIds = new Set(MORE_OPTIONS.hair.map(([id]) => id));
const templates = new Map();
function buildStyle(id) {
  const buckets = { hair: [], tie: [] };
  function add(geometry, p, scale = [1, 1, 1], rotation = [0, 0, 0], bucket = 'hair') {
    const transform = new THREE.Object3D();
    transform.position.fromArray(p);
    transform.scale.fromArray(scale);
    transform.rotation.set(...rotation);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    buckets[bucket].push(part);
  }
  function lobe(p, scale, rotation) {
    add(new THREE.SphereGeometry(1, 16, 10), p, scale, rotation);
  }
  function cap(depth = 1.2, scale = [1, 1, 1]) {
    add(new THREE.SphereGeometry(.446, 32, 18, 0, Math.PI * 2, 0, depth), [0, 0, 0], scale);
  }
  function back(depth = 1.9, scale = [1, 1, 1]) {
    add(new THREE.SphereGeometry(.444, 32, 16, Math.PI / 2 + .86, Math.PI * 2 - 1.72, 0, depth), [0, 0, -.009], scale);
  }
  function lock(points, radius = .055, bucket = 'hair') {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geometry = new THREE.TubeGeometry(curve, 14, radius, 7, false);
    const positions = geometry.attributes.position;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, center = curve.getPointAt(t);
      const taper = .19 + .81 * Math.pow(Math.sin(Math.PI * (.1 + t * .85)), .62);
      for (let j = 0; j <= 7; j++) {
        const index = i * 8 + j;
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, index);
        vertex.sub(center).multiplyScalar(taper).add(center);
        positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
    }
    geometry.computeVertexNormals();
    add(geometry, [0, 0, 0], undefined, undefined, bucket);
  }
  function fringe(direction = 0, length = .12, wispy = false) {
    for (let i = -3; i <= 3; i++) {
      const x = i * .081, z = Math.sqrt(Math.max(.02, .445 ** 2 - x ** 2));
      lock([[x * .65, .35, z * .62], [x + direction * .055, .25, z * .92],
        [x + direction * .085, length + Math.abs(i) * .019, z]], wispy ? .024 : .054);
    }
  }
  function partFringe(asymmetry = 0) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const x = side * (.035 + i * .045);
        lock([[x + asymmetry, .39, .23], [side * (.17 + i * .034), .30, .38],
          [side * (.31 + i * .018), .09 + i * .034, .29]], .047);
      }
    }
  }
  function longBack(length = .53, wave = 0, layered = false) {
    back(1.94);
    lobe([0, -length * .45, -.265], [.365, length * .65 + .18, .21]);
    for (let i = -3; i <= 3; i++) {
      const x = i * .105;
      const z = -.22 - Math.sqrt(Math.max(0, .24 ** 2 - (x * .55) ** 2)) * .24;
      lock([[x * .88, .15, z], [x + wave * Math.sin(i), -length * .38, z - .03],
        [x - wave * Math.sin(i + 1), -length * .76, z + .04],
        [x * .92, -length + (layered ? Math.abs(i) * .065 : 0), z + .07]], .075);
    }
  }
  function pony(high, curled = false) {
    const y = high ? .28 : -.13;
    lobe([0, y, -.45], [.14, .14, .13]);
    add(new THREE.TorusGeometry(.12, .018, 5, 16), [0, y, -.46], undefined, [Math.PI / 2, 0, 0], 'tie');
    for (let i = -2; i <= 2; i++) {
      const x = i * .038;
      lock([[x, y, -.49], [x * 1.6, y - .12, -.66],
        [x + (curled ? .07 : 0), y - .38, -.63],
        [x - .02, y - .64, curled ? -.47 : -.65]], .056);
    }
  }
  function sideLengths(length, curl = false) {
    for (const side of [-1, 1]) {
      lock([[side * .35, .23, .05], [side * .407, -.07, .03],
        [side * .407, -length + .09, .09], [side * (curl ? .34 : .40), -length, .14]], .075);
    }
  }

  switch (id) {
    case 'buzzcut':
      cap(1.20, [.985, .985, .985]); back(1.76, [.985, .985, .985]);
      break;
    case 'crewcut':
      cap(1.20); back(1.78);
      lobe([0,.405,.035],[.29,.068,.29]);
      break;
    case 'twoblock':
      cap(1.44, [1.04, 1.05, 1.025]); back(1.76); fringe(0, .12);
      break;
    case 'dandy':
      cap(1.38); back(1.89); fringe(.45, .11);
      for (const side of [-1, 1]) lobe([side * .385, -.005, .015], [.075, .22, .09]);
      break;
    case 'comma':
      cap(); back(1.83);
      for (let i = 0; i < 5; i++) lock([[-.20 + i * .055, .37, .22], [.05 + i * .055, .32, .395],
        [.13 + i * .032, .17, .40], [.04 + i * .032, .14, .425]], .052);
      for (let i = 0; i < 3; i++) lock([[-.18, .37, .26], [-.29 - i * .028, .25, .30], [-.32 - i * .015, .13, .25]], .049);
      break;
    case 'sidepart':cap();back(1.86);partFringe(-.09);break;
    case 'curtain':cap();back(1.92);partFringe();sideLengths(.12);break;
    case 'regent':
      cap(1.14);back(1.82);
      lobe([.03,.405,.18],[.28,.12,.21],[-.32,0,-.10]);
      for(let i=-2;i<=2;i++)lock([[i*.072,.30,.31],[i*.071+.02,.455,.20],
        [i*.06+.04,.42,-.02],[i*.05,.34,-.23]],.028);
      break;
    case 'slickback':
      cap(1.17);back(1.92);
      for(let i=-3;i<=3;i++)lock([[i*.065,.19,.37],[i*.065,.37,.19],[i*.060,.37,-.17],[i*.045,.11,-.39]],.026);
      break;
    case 'shadowperm':
      cap(1.23);back(1.9);
      for(let i=0;i<23;i++){
        const a=i*2.4, theta=.26+(i%5)*.19;
        const x=Math.cos(a)*Math.sin(theta)*.422,z=Math.sin(a)*Math.sin(theta)*.422,y=Math.cos(theta)*.422;
        lobe([x,y,z],[.092,.064,.093],[.18,0,a*.3]);
      }
      for(let i=-2;i<=2;i++)lock([[i*.082,.31,.29],[i*.087+.03,.25,.385],
        [i*.087+.04,.18,.398],[i*.087+.015,.16,.395]],.046);break;
    case 'wolfcut':
      cap();longBack(.37,.025,true);partFringe();
      for(const side of [-1,1])for(let i=0;i<3;i++)lock([[side*.35,.16,.04],[side*.43,-.04-i*.07,.03],[side*(.45-i*.025),-.21-i*.06,.11]],.055);
      break;
    case 'manbun':
      cap();back(1.8);
      lobe([0,.28,-.37],[.16,.145,.135]);
      add(new THREE.TorusGeometry(.109,.018,5,16),[0,.30,-.41],undefined,[.35,0,0],'tie');
      break;
    case 'pixie':
      cap(1.29);back(1.89);fringe(1,.19);
      lock([[-.28,.32,.20],[-.37,.13,.13],[-.35,-.11,.05]],.066);
      break;
    case 'hushcut':
      cap();longBack(.38,.025,true);fringe(.18,.15,true);
      for(const side of [-1,1])for(let i=0;i<3;i++)lock([[side*.34,.17,.12],[side*.42,-.10-i*.055,.10],[side*.34,-.30-i*.06,.15]],.050);
      break;
    case 'lob':
      cap();longBack(.34);partFringe();sideLengths(.35,true);break;
    case 'c_curl':
      cap();longBack(.27);fringe(0,.14,true);sideLengths(.27,true);
      for(const side of [-1,1])lock([[side*.40,-.02,.04],[side*.44,-.18,.08],[side*.32,-.28,.17]],.080);
      break;
    case 's_wave':
      cap();longBack(.66,.058);partFringe();
      for(const side of [-1,1])lock([[side*.34,.22,.08],[side*.44,-.06,.07],[side*.35,-.32,.15],[side*.46,-.60,.09]],.080);
      break;
    case 'longstraight':
      cap();longBack(.73);fringe(0,.15,true);sideLengths(.65);break;
    case 'layered':
      cap();longBack(.64,.02,true);partFringe();
      for(const side of [-1,1])for(let i=0;i<3;i++)lock([[side*(.32+i*.017),.20,.12],[side*(.40+i*.015),-.08-i*.07,.10],[side*.33,-.36-i*.11,.16]],.049);
      break;
    case 'hippieperm':
      cap();back(1.91);
      for(let i=0;i<15;i++){
        const a=Math.PI/2+.72+i*(Math.PI*2-1.44)/14;
        const x=-Math.cos(a)*.40,z=Math.sin(a)*.38;
        const points=[];
        for(let j=0;j<8;j++)points.push([x+Math.sin(j*1.35+i)*.044,.22-j*.12,z+Math.cos(j*1.35+i)*.038]);
        lock(points,.050);
      }
      fringe(0,.13,true);break;
    case 'highpony':cap();back(1.86);partFringe();pony(true,true);break;
    case 'lowpony':cap();back(1.94);partFringe();pony(false);sideLengths(.18);break;
    case 'doublebun':
      cap();back(1.9);fringe(0,.13,true);
      for(const side of [-1,1]){
        lobe([side*.35,.32,-.19],[.16,.15,.14]);
        add(new THREE.TorusGeometry(.107,.015,5,16),[side*.35,.32,-.29],undefined,[.3,side*.3,0],'tie');
      }break;
    case 'braids':
      cap();back(1.85);partFringe();
      for(const side of [-1,1]){
        lock([[side*.35,.10,-.04],[side*.42,-.12,.02],[side*.38,-.56,.15]],.066);
        for(let i=0;i<7;i++){
          const y=-.07-i*.068,x=side*(.42-i*.006);
          for(const strand of [-1,1])lobe([x+strand*.022,y,.035+i*.014],[.048,.052,.046],[0,0,strand*.55]);
        }
        add(new THREE.TorusGeometry(.055,.012,5,12),[side*.38,-.55,.14],undefined,[Math.PI/2,0,0],'tie');
      }break;
  }
  const result = {};
  for (const [key, geometries] of Object.entries(buckets)) {
    if (!geometries.length) continue;
    result[key] = markShared(mergeGeometries(geometries));
    geometries.forEach(g => g.dispose());
  }
  return result;
}

export function addExpandedHair(inner, look, hairMaterial) {
  if (!hairIds.has(look.hair)) return false;
  if (!templates.has(look.hair)) templates.set(look.hair, buildStyle(look.hair));
  const template = templates.get(look.hair);
  const root = new THREE.Group();
  root.name = 'Hairstyle / ' + look.hair;
  for (const [key, geometry] of Object.entries(template)) {
    const material = key === 'tie'
      ? new THREE.MeshStandardMaterial({ color: look.accent, roughness: .65 })
      : hairMaterial;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    root.add(mesh);
  }
  inner.add(root);
  return true;
}
