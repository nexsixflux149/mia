import { Group } from 'three';
import { markShared } from './props.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const templates = new Map();
const scenery = new Set(['crate', 'barrel', 'lamp', 'pine', 'bench', 'radio', 'iron_door', 'safe', 'handle', 'desk', 'chair', 'book', 'wheelchair', 'iv_stand', 'gurney', 'lifebuoy', 'ship_wheel', 'ship_bell', 'cactus', 'lantern', 'hay', 'water_tower', 'tombstone', 'mine_cart', 'table', 'shelf', 'rock', 'torii', 'stone_lantern', 'kimono_rack', 'jar', 'cushion', 'rug', 'folding_screen', 'speaker_pole', 'barricade', 'workbench', 'fence', 'futon', 'tea_table', 'ticket_booth', 'turnstile', 'unicycle', 'well', 'bar_counter', 'rails', 'wagon', 'telegraph', 'piano', 'hatch', 'crowbar', 'headphones', 'valve', 'fusebox', 'med_cabinet', 'bed', 'wardrobe', 'mannequin', 'bookcase', 'dollhouse', 'rocking_horse', 'top', 'toy_blocks', 'teddy', 'ddakji', 'marble', 'ribbon', 'chest', 'bell', 'chain', 'vending', 'umbrella_stand', 'juggling_pins', 'bucket', 'candles', 'fan', 'drum', 'tablets', 'uniform', 'screen_med', 'stairs', 'grandfather_clock', 'pillar', 'pillar_c', 'puddle', 'mirror', 'stairs_up', 'fireplace', 'blackboard', 'map_table', 'cake_table', 'teacher_desk', 'window', 'crt_tv', 'notice_board', 'radiator', 'wagon_wheel', 'cage', 'timetable', 'stepping_stone', 'circus_wagon', 'balloon_stand', 'jack_box', 'trapeze', 'strongman', 'popcorn_cart', 'cannon', 'bleachers', 'ring_stage', 'magic_box', 'spotlight', 'star_lamp', 'big_top', 'burnt_beam', 'cups_table', 'tent', 'campfire', 'scarecrow', 'log_seat', 'signpost', 'dock', 'lantern_string', 'flagpole', 'lighthouse', 'tide_board', 'shed', 'signal_lamp', 'lh_door', 'easel', 'rowboat', 'panel', 'rope_coil', 'pipes', 'porthole', 'tape', 'bottles', 'frame', 'stained_window', 'wall_shelf', 'clock', 'lockers', 'stove', 'curtain', 'closet', 'organ', 'door', 'box', 'flag_tk', 'monument', 'jangseung_m', 'koi_pond', 'jangseung_f', 'cairn', 'gate', 'dangsan', 'shoe', 'padlock', 'pebble', 'paper_lantern', 'altar', 'shimenawa', 'bamboo', 'talisman', 'escalator', 'shop_cart', 'dept_counter', 'low_desk', 'bunk', 'funhouse_mirror', 'music_box', 'pump', 'iron_gate', 'attic_window', 'gears', 'bell_rack', 'cradle', 'path_gate', 'house', 'tree', 'car', 'facade', 'xmas_fir', 'xmas_stack', 'ladder', 'bowl', 'rubberband', 'vanity', 'canopy_bed', 'painting', 'cabin_door', 'stall', 'doll_shelf', 'control_panel', 'pole', 'gear_wall', 'ghost_cart', 'coffin', 'debris', 'altar_stone', 'doll', 'teacup', 'bumper_car', 'vanity_bulb', 'cash_register', 'tv_wall', 'bus', 'doll_big', 'clown_statue', 'key', 'ring', 'beam', 'lostbox', 'gold_crate', 'sandbags', 'generator', 'bus_stop', 'chandelier', 'surgery_lamp', 'canoe', 'cow_skull', 'attic_door', 'morgue', 'gallows', 'duty_board', 'scroll', 'wall_frame', 'sconce', 'hanging_bulb', 'photo', 'poster', 'eye', 'big_gate', 'pirate_frame', 'tumbleweed', 'seaweed', 'jesa_table', 'drop_tower', 'drop_car', 'fountain', 'mesa', 'mushrooms', 'flyer', 'park_map', 'noose', 'candle_set', 'drape', 'pirate_boat', 'parade_float', 'heli', 'ouija', 'neon_sign', 'mascot_statue', 'pipe_run', 'mannequin_row', 'swing', 'paper', 'bunting', 'string_lights', 'wall_marks', 'child_ghost', 'gwimun', 'gwimun_core', 'fireflies', 'cobweb', 'blood_smear', 'handprints', 'leaves', 'carousel_big', 'ferris_wheel', 'hanging_dummy']);
function copyModel(id) {
  if (!templates.has(id)) {
    const url = new URL('../models/mia-' + id + '.glb', import.meta.url);
    templates.set(id, loader.loadAsync(url.href).then(({ scene }) => {
      scene.traverse(node => {
        if (!node.isMesh) return;
        markShared(node.geometry);
        for (const material of [].concat(node.material || [])) {
          markShared(material);
          for (const value of Object.values(material)) if (value?.isTexture) markShared(value);
        }
      });
      return scene;
    }).catch(error => {
      templates.delete(id);
      throw error;
    }));
  }
  return templates.get(id).then(template => template.clone(true));
}

export function dressScenery(target, root, prop) {
  if (!scenery.has(prop.t) || (prop.color && !['tent', 'flagpole', 'paper_lantern', 'tree', 'car', 'facade', 'cabin_door', 'teacup', 'bumper_car', 'wall_frame', 'sconce', 'hanging_bulb', 'mesa', 'mushrooms', 'drape', 'parade_float', 'neon_sign', 'pipe_run', 'swing', 'hanging_dummy'].includes(prop.t)) || (prop.t === 'vending' && prop.on === false)) return;
  if (prop.t === 'bottles' && (prop.fallen || (prop.n && prop.n !== 4))) return;
  if (prop.t === 'bamboo' && prop.n && prop.n !== 5) return;
  const fenceLength = prop.t === 'fence' ? prop.len || 6 : 0;
  if (prop.t === 'fence' && (!Number.isInteger(fenceLength) || fenceLength < 1 || fenceLength > 64)) return;
  const lanternCount = prop.t === 'lantern_string' ? prop.len || 10 : 0;
  if (lanternCount && (!Number.isInteger(lanternCount) || lanternCount < 1 || lanternCount > 64)) return;
  const modelId = prop.t === 'cage' && prop.open ? 'cage-open' : prop.t;
  return copyModel(modelId).then(template => {
    if (root.userData.disposed || (!root.parent && !root.userData.reusableLobby)) return;
    let model = template;
    const wheel = prop.t === 'ferris_wheel' ? target.userData.wheel : null;
    const wheelMeshes = [];
    if (wheel) {
      model.scale.y = ((prop.r2 || 6) + 1.2) / 7.2;
      for (const child of wheel.children) if (child.isMesh) child.visible = false;
    }
    if (prop.t === 'carousel_big') {
      const scale = (prop.r2 || 3.2) / 3.2;
      model.scale.set(scale, 1, scale);
    }
    if (prop.t === 'cobweb') model.scale.set(prop.s || 1.2, prop.s || 1.2, 1);
    if (prop.t === 'blood_smear') {
      const surface = target.children.find(child => child.userData.keepWithRefinedArt);
      model.position.y = .012;
      model.rotation.y = surface?.rotation.z || 0;
      model.scale.set(prop.s || 1.1, 1, prop.s || 1.1);
    }
    if (prop.t === 'swing') model.scale.x = ((prop.w || 1.5) + .2) / 1.7;
    const repeatMaterials = { mannequin_row: 'Body_velvet', bunting: 'Body_canvas', string_lights: 'Body_amber', leaves: 'Body_canvas' };
    const repeatMaterial = repeatMaterials[prop.t];
    if (repeatMaterial) {
      model = new Group();
      const mannequins = prop.t === 'mannequin_row';
      for (const source of target.children) {
        if (mannequins ? !source.isGroup : !source.userData.replaceWithRefinedArt) continue;
        const part = template.clone(true);
        part.position.copy(source.position);
        part.rotation.copy(source.rotation);
        if (prop.t === 'leaves') part.scale.copy(source.scale);
        const color = mannequins ? source.children[2].material.color : source.material.color;
        part.traverse(node => {
          if (node.isMesh && node.material.name === repeatMaterial) node.userData.refinedTint = color;
        });
        if (mannequins) source.visible = false;
        model.add(part);
      }
    }
    if (prop.t === 'mascot_statue') model.scale.setScalar(prop.s || 1);
    if (prop.t === 'pipe_run') {
      model = new Group();
      for (let i = 0; i < (prop.n || 2); i++) {
        const pipe = template.clone(true);
        const radiusScale = (0.06 - i * 0.015) / 0.06;
        pipe.scale.set((prop.len || 8) / 2, radiusScale, radiusScale);
        pipe.position.set(0, -i * 0.04, i * 0.16);
        model.add(pipe);
      }
    }
    if (prop.t === 'drape') model.scale.set((prop.w || 2) / 2, (prop.h || 3.2) / 3.2, 1);
    if (prop.t === 'candle_set') {
      model = new Group();
      for (let i = 0; i < (prop.n || 4); i++) {
        const candle = template.clone(true);
        const angle = i * 2.4, radius = i ? .09 + (i % 2) * .05 : 0;
        candle.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        candle.scale.y = (.12 + ((i * 37) % 10) / 50) / .12;
        model.add(candle);
      }
    }
    if (prop.t === 'mesa') model.scale.setScalar(prop.s || 1);
    if (prop.t === 'drop_tower') model.scale.y = (prop.h || 14) / 14;
    if (prop.t === 'wall_frame') model.scale.set(((prop.w || .6) + .07) / .67, ((prop.h || .8) + .07) / .87, 1);
    if (prop.t === 'hanging_bulb') model.position.y = -(prop.len || 1.2);
    if (prop.t === 'clown_statue') {
      const scale = prop.s || 1;
      model.scale.setScalar(scale);
      model.position.y = .3 * (1 - scale);
    }
    if (prop.t === 'shimenawa' && prop.len > 0) model.scale.x = prop.len / 3;
    if (prop.t === 'big_top') model.scale.set((prop.r2 || 9) / 9, (prop.h || 8) / 8, (prop.r2 || 9) / 9);
    if (prop.t === 'star_lamp' && prop.h > 0) model.scale.y = prop.h / 3.2;
    if (prop.t === 'bleachers' && prop.w > 0) model.scale.x = prop.w / 6;
    if (prop.t === 'ring_stage' && prop.r2 > 0) model.scale.x = model.scale.z = prop.r2 / 5;
    if (prop.t === 'trapeze' && prop.h) {
      model.scale.y = (prop.h - 1.6) / 3.6;
      model.position.y = 1.6 * (1 - model.scale.y);
    }
    if (fenceLength) {
      model = new Group();
      for (let i = 0; i < fenceLength; i++) {
        const segment = i ? template.clone(true) : template;
        segment.position.x = i - (fenceLength - 1) / 2;
        model.add(segment);
      }
    }
    if (lanternCount) {
      model = new Group();
      const palette = ['#ff7f7f', '#ffd27f', '#7fd4ff', '#b5ff7f'];
      for (let i = 0; i < lanternCount; i++) {
        const lantern = template.clone(true);
        lantern.position.set(-lanternCount / 2 + i, 3 - Math.sin(i / lanternCount * Math.PI) * .4, 0);
        lantern.userData.lanternColor = palette[i % palette.length];
        model.add(lantern);
      }
    }
    const cover = prop.t === 'book' ? target.children.find(child => child.isMesh)?.material?.color : null;
    const originalPaint = ['doll', 'teacup', 'bumper_car'].includes(prop.t) ? target.children[0]?.material?.color : null;
    const mesaColors = prop.t === 'mesa' ? target.children.map(child => child.material?.color) : [];
    const carPaint = prop.t === 'car' ? target.children[0]?.material?.color : null;
    if (['carousel_big', 'hanging_dummy', 'xmas_stack'].includes(prop.t)) {
      for (const child of target.children) if (child.isGroup) child.visible = false;
    }
    if (prop.t === 'ship_wheel') target.traverse(child => { if (child.isMesh) child.visible = false; });
    else for (const child of target.children) if (child.isMesh && !child.userData.keepWithRefinedArt) child.visible = false;
    model.traverse(node => {
      if (!node.isMesh) return;
      node.userData.sharedArtGeometry = true;
      if (wheel && node.name.startsWith('Wheel_')) wheelMeshes.push(node);
      node.castShadow = true;
      node.receiveShadow = true;
      if (cover && node.material.name === 'Body_book-cover') {
        node.material = node.material.clone();
        node.material.color.copy(cover);
      }
      const interactive = prop.id && prop.kind !== 'deco';
      const darkenBox = prop.t === 'magic_box' && prop.open && node.material.name === 'Body_magic-purple';
      const tintTent = prop.t === 'tent' && prop.color && node.material.name === 'Body_tent-shell';
      const tintLantern = prop.t === 'lantern_string' && node.material.name === 'Body_string-paper';
      const tintPaper = prop.t === 'paper_lantern' && prop.color && node.material.name === 'Body_lantern-paper';
      const paintCar = carPaint && node.material.name === 'Body_velvet';
      const paintLeaves = prop.t === 'tree' && ['Body_face', 'Body_cake-rose'].includes(node.material.name);
      const paintProp = originalPaint && node.material.name === (prop.t === 'bumper_car' ? 'Body_night-glass' : 'Body_cake-rose');
      const mesaPaint = node.material.name === 'Body_oak' ? mesaColors[0] : mesaColors[1];
      const mushroomCap = prop.t === 'mushrooms' && node.material.name === 'Body_hay-mid';
      const customColor = prop.t === 'drape'
        ? (node.material.name === 'Body_curtain-fabric' ? prop.color || '#8a0a1a' : prop.trim)
        : prop.t === 'parade_float' && node.material.name === 'Body_velvet' ? prop.color || '#7a1a5a' : null;
      const paintPipe = prop.t === 'pipe_run' && node.material.name === 'Body_iron';
      const ghostCloth = prop.t === 'child_ghost' && node.material.name === 'Body_ghost-cloth';
      const paintDummy = prop.t === 'hanging_dummy' && prop.color && node.material.name === 'Body_dummy-shirt';
      if (['cobweb', 'blood_smear', 'handprints', 'leaves', 'fireflies'].includes(prop.t)) {
        node.userData.noOcc = true;
        node.castShadow = false;
      }
      const paintFrame = prop.t === 'wall_frame' && prop.color && node.material.name === 'Body_wood';
      const paintFacade = prop.t === 'facade' && prop.color && node.material.name === 'Body_oak';
      if (interactive || darkenBox || tintTent || tintLantern || tintPaper || paintCar || paintLeaves || paintFacade || paintProp || paintFrame || mesaPaint || mushroomCap || customColor || paintPipe || node.userData.refinedTint || ghostCloth || paintDummy) node.material = node.material.clone();
      else if (!(cover && node.material.name === 'Body_book-cover')) node.userData.sharedArtMaterial = true;
      if (paintProp) node.material.color.copy(originalPaint);
      if (node.userData.refinedTint) {
        node.material.color.copy(node.userData.refinedTint);
        if (prop.t === 'string_lights') node.material.emissive.copy(node.material.color);
      }
      if (prop.t === 'swing' && prop.color && node.material.name === 'Body_rust') {
        if (node.userData.sharedArtMaterial) {
          node.material = node.material.clone();
          delete node.userData.sharedArtMaterial;
        }
        node.material.color.set(prop.color);
      }
      if (ghostCloth) {
        node.material.transparent = true;
        node.material.opacity = .55;
        node.material.depthWrite = false;
      }
      if (paintDummy) node.material.color.set(prop.color);
      if (paintPipe) node.material.color.set(prop.color || '#5a5048');
      if (customColor) node.material.color.set(customColor);
      if (mesaPaint) node.material.color.copy(mesaPaint);
      if (mushroomCap) {
        node.material.color.set(prop.color || '#c8a060');
        node.material.emissive.set(prop.glow || '#000');
        node.material.emissiveIntensity = prop.glow ? .8 : 0;
      }
      if (paintFrame) node.material.color.set(prop.color);
      if (paintFacade) node.material.color.set(prop.color);
      if (paintCar) node.material.color.copy(carPaint);
      if (paintLeaves) node.material.color.set(prop.color || '#ffb7c9').multiplyScalar(node.material.name === 'Body_face' ? 1 : .70);
      if (darkenBox) node.material.color.set('#0a0418');
      if (tintTent) node.material.color.set(prop.color);
      if (tintPaper) {
        node.material.color.set(prop.color);
        node.material.emissive.copy(node.material.color);
      }
      if (tintLantern) {
        let lantern = node.parent;
        while (lantern && !lantern.userData.lanternColor) lantern = lantern.parent;
        if (lantern) {
          node.material.color.set(lantern.userData.lanternColor);
          node.material.emissive.copy(node.material.color);
        }
      }
      if (interactive) {
        node.userData.objId = prop.id;
        if (prop.t === 'ribbon' && prop.item === 'ship_relic_2') node.material.color.set('#81bde2');
        if (prop.t === 'ribbon' && prop.item === 'zb_relic_1') node.material.color.set('#dfb44c');
      }
    });
    if (wheel) {
      const scale = (prop.r2 || 6) / 6;
      for (const mesh of wheelMeshes) {
        mesh.scale.set(scale, scale, 1);
        wheel.add(mesh);
      }
    }
    const particles = prop.t === 'fireflies' && target.children.find(child => child.isPoints);
    (particles || target).add(model);
    target.userData.refinedArt = prop.t;
  }).catch(error => { if (root.parent) console.warn('오브제 모델 로딩 실패:', prop.t, error); });
}

const ghostHeads = new Map([
  ['woman', 'ghost-head'],
  ['nurse', 'nurse-head'],
  ['slender', 'slender-head'],
  ['gasmask', 'gasmask-head'],
]);

export function dressGhostHead(ghost) {
  const id = ghostHeads.get(ghost.userData.type);
  if (!id) return;
  const head = ghost.userData.parts.head;
  return copyModel(id).then(model => {
    if (!ghost.parent) return;
    // Retain the animated hair groups and jaw pivots for the existing ghost behavior.
    for (const node of head.children) if (node.isMesh) node.visible = false;
    model.traverse(node => {
      if (!node.isMesh) return;
      node.userData.sharedArtGeometry = true;
      node.userData.sharedArtMaterial = true;
    });
    head.add(model);
    ghost.userData.refinedArt = ghost.userData.type;
  }).catch(error => { if (ghost.parent) console.warn('귀신 모델 로딩 실패:', id, error); });
}
