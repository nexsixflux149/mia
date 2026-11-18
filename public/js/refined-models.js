import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const templates = new Map();
const scenery = new Set(['crate', 'barrel', 'lamp', 'pine', 'bench', 'radio', 'iron_door', 'safe', 'handle', 'desk', 'chair', 'book', 'wheelchair', 'iv_stand', 'gurney', 'lifebuoy', 'ship_wheel', 'ship_bell', 'cactus', 'lantern', 'hay', 'water_tower', 'tombstone', 'mine_cart']);
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
  if (!scenery.has(prop.t) || prop.color) return;
  copyModel(prop.t).then(model => {
    if (!root.parent) return;
    const cover = prop.t === 'book' ? target.children.find(child => child.isMesh)?.material?.color : null;
    if (prop.t === 'ship_wheel') target.traverse(child => { if (child.isMesh) child.visible = false; });
    else for (const child of target.children) if (child.isMesh) child.visible = false;
    model.traverse(node => {
      if (!node.isMesh) return;
      node.userData.sharedArtGeometry = true;
      node.castShadow = true;
      node.receiveShadow = true;
      if (cover && node.material.name === 'Body_book-cover') {
        node.material = node.material.clone();
        node.material.color.copy(cover);
      }
      if (prop.id) {
        node.userData.objId = prop.id;
        node.material = node.material.clone();
      } else node.userData.sharedArtMaterial = true;
    });
    target.add(model);
    target.userData.refinedArt = prop.t;
  }).catch(error => { if (root.parent) console.warn('오브제 모델 로딩 실패:', prop.t, error); });
}

export function dressWomanGhost(ghost) {
  const head = ghost.userData.parts.head;
  copyModel('ghost-head').then(model => {
    if (!ghost.parent) return;
    // Retain the animated hair groups and jaw pivots for the existing ghost behavior.
    for (const node of head.children) if (node.isMesh) node.visible = false;
    head.add(model);
    ghost.userData.refinedArt = 'woman';
  }).catch(error => { if (ghost.parent) console.warn('하얀 여자 모델 로딩 실패:', error); });
}
