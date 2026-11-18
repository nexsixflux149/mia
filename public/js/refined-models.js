import { Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const templates = new Map();
const scenery = new Set(['crate', 'barrel', 'lamp', 'pine', 'bench', 'radio', 'iron_door', 'safe', 'handle', 'desk', 'chair', 'book', 'wheelchair', 'iv_stand', 'gurney', 'lifebuoy', 'ship_wheel', 'ship_bell', 'cactus', 'lantern', 'hay', 'water_tower', 'tombstone', 'mine_cart', 'table', 'shelf', 'rock', 'torii', 'stone_lantern', 'kimono_rack', 'jar', 'cushion', 'rug', 'folding_screen', 'speaker_pole', 'barricade', 'workbench', 'fence', 'futon', 'tea_table', 'ticket_booth', 'turnstile', 'unicycle', 'well', 'bar_counter', 'rails', 'wagon', 'telegraph', 'piano', 'hatch', 'crowbar', 'headphones', 'valve', 'fusebox', 'med_cabinet', 'bed', 'wardrobe', 'mannequin', 'bookcase', 'dollhouse', 'rocking_horse', 'top', 'toy_blocks', 'teddy', 'ddakji', 'marble', 'ribbon', 'chest', 'bell', 'chain', 'vending', 'umbrella_stand', 'juggling_pins', 'bucket', 'candles', 'fan', 'drum', 'tablets', 'uniform', 'screen_med', 'stairs', 'grandfather_clock', 'pillar', 'pillar_c', 'puddle', 'mirror', 'stairs_up', 'fireplace', 'blackboard', 'map_table', 'cake_table', 'teacher_desk', 'window', 'crt_tv', 'notice_board', 'radiator', 'wagon_wheel', 'cage', 'timetable', 'stepping_stone', 'circus_wagon', 'balloon_stand', 'jack_box', 'trapeze', 'strongman', 'popcorn_cart', 'cannon', 'bleachers', 'ring_stage', 'magic_box', 'spotlight', 'star_lamp', 'big_top', 'burnt_beam', 'cups_table', 'tent', 'campfire', 'scarecrow', 'log_seat', 'signpost', 'dock', 'lantern_string', 'flagpole', 'lighthouse', 'tide_board', 'shed', 'signal_lamp', 'lh_door', 'easel', 'rowboat', 'panel', 'rope_coil', 'pipes', 'porthole', 'tape', 'bottles', 'frame', 'stained_window', 'wall_shelf', 'clock', 'lockers', 'stove', 'curtain', 'closet', 'organ', 'door', 'box', 'flag_tk', 'monument', 'jangseung_m', 'koi_pond', 'jangseung_f', 'cairn', 'gate', 'dangsan', 'shoe', 'padlock', 'pebble', 'paper_lantern', 'altar', 'shimenawa', 'bamboo', 'talisman', 'escalator', 'shop_cart', 'dept_counter']);
function copyModel(id) {
  if (!templates.has(id)) {
    const url = new URL('../models/mia-' + id + '.glb', import.meta.url);
    templates.set(id, loader.loadAsync(url.href).then(({ scene }) => scene).catch(error => {
      templates.delete(id);
      throw error;
    }));
  }
  return templates.get(id).then(template => template.clone(true));
}

export function dressScenery(target, root, prop) {
  if (!scenery.has(prop.t) || (prop.color && !['tent', 'flagpole', 'paper_lantern'].includes(prop.t)) || (prop.t === 'vending' && prop.on === false)) return;
  if (prop.t === 'bottles' && (prop.fallen || (prop.n && prop.n !== 4))) return;
  if (prop.t === 'bamboo' && prop.n && prop.n !== 5) return;
  const fenceLength = prop.t === 'fence' ? prop.len || 6 : 0;
  if (prop.t === 'fence' && (!Number.isInteger(fenceLength) || fenceLength < 1 || fenceLength > 64)) return;
  const lanternCount = prop.t === 'lantern_string' ? prop.len || 10 : 0;
  if (lanternCount && (!Number.isInteger(lanternCount) || lanternCount < 1 || lanternCount > 64)) return;
  const modelId = prop.t === 'cage' && prop.open ? 'cage-open' : prop.t;
  copyModel(modelId).then(template => {
    if (!root.parent) return;
    let model = template;
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
    if (prop.t === 'ship_wheel') target.traverse(child => { if (child.isMesh) child.visible = false; });
    else for (const child of target.children) if (child.isMesh && !child.userData.keepWithRefinedArt) child.visible = false;
    model.traverse(node => {
      if (!node.isMesh) return;
      node.userData.sharedArtGeometry = true;
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
      if (interactive || darkenBox || tintTent || tintLantern || tintPaper) node.material = node.material.clone();
      else if (!(cover && node.material.name === 'Body_book-cover')) node.userData.sharedArtMaterial = true;
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
    target.add(model);
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
  copyModel(id).then(model => {
    if (!ghost.parent) return;
    // Retain the animated hair groups and jaw pivots for the existing ghost behavior.
    for (const node of head.children) if (node.isMesh) node.visible = false;
    head.add(model);
    ghost.userData.refinedArt = ghost.userData.type;
  }).catch(error => { if (ghost.parent) console.warn('귀신 모델 로딩 실패:', id, error); });
}
