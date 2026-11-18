import { Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const templates = new Map();
const scenery = new Set(['crate', 'barrel', 'lamp', 'pine', 'bench', 'radio', 'iron_door', 'safe', 'handle', 'desk', 'chair', 'book', 'wheelchair', 'iv_stand', 'gurney', 'lifebuoy', 'ship_wheel', 'ship_bell', 'cactus', 'lantern', 'hay', 'water_tower', 'tombstone', 'mine_cart', 'table', 'shelf', 'rock', 'torii', 'stone_lantern', 'kimono_rack', 'jar', 'cushion', 'rug', 'folding_screen', 'speaker_pole', 'barricade', 'workbench', 'fence', 'futon', 'tea_table', 'ticket_booth', 'turnstile', 'unicycle', 'well', 'bar_counter', 'rails', 'wagon', 'telegraph', 'piano', 'hatch', 'crowbar', 'headphones', 'valve', 'fusebox', 'med_cabinet', 'bed', 'wardrobe', 'mannequin', 'bookcase', 'dollhouse', 'rocking_horse', 'top', 'toy_blocks', 'teddy', 'ddakji', 'marble', 'ribbon', 'chest', 'bell', 'chain', 'vending', 'umbrella_stand', 'juggling_pins', 'bucket', 'candles', 'fan', 'drum', 'tablets', 'uniform', 'screen_med', 'stairs', 'grandfather_clock', 'pillar', 'pillar_c', 'puddle', 'mirror', 'stairs_up', 'fireplace', 'blackboard', 'map_table', 'cake_table', 'teacher_desk', 'window', 'crt_tv', 'notice_board', 'radiator', 'wagon_wheel', 'cage', 'timetable', 'stepping_stone', 'circus_wagon', 'balloon_stand', 'jack_box', 'trapeze', 'strongman', 'popcorn_cart']);
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
  if (!scenery.has(prop.t) || prop.color || (prop.t === 'vending' && prop.on === false)) return;
  const fenceLength = prop.t === 'fence' ? prop.len || 6 : 0;
  if (prop.t === 'fence' && (!Number.isInteger(fenceLength) || fenceLength < 1 || fenceLength > 64)) return;
  const modelId = prop.t === 'cage' && prop.open ? 'cage-open' : prop.t;
  copyModel(modelId).then(template => {
    if (!root.parent) return;
    let model = template;
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
      if (prop.id && prop.kind !== 'deco') {
        node.userData.objId = prop.id;
        node.material = node.material.clone();
        if (prop.t === 'ribbon' && prop.item === 'ship_relic_2') node.material.color.set('#81bde2');
        if (prop.t === 'ribbon' && prop.item === 'zb_relic_1') node.material.color.set('#dfb44c');
      } else node.userData.sharedArtMaterial = true;
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
