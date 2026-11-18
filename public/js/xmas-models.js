import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const assetUrl = name => new URL('../models/' + name + '.glb', import.meta.url).href;
let santaTemplate;

export function loadXmasGhostModel(ghost) {
  if (!santaTemplate) {
    santaTemplate = new GLTFLoader().loadAsync(assetUrl('mia-santa-automaton'))
      .then(({ scene }) => scene)
      .catch(error => { santaTemplate = null; throw error; });
  }
  return santaTemplate.then(model => {
    if (!ghost.parent) return;
    const { body, parts } = ghost.userData;
    const pivots = { Body: body, Head: parts.head, ArmL: parts.arms[0], ArmR: parts.arms[1], LegL: parts.legs[0], LegR: parts.legs[1] };
    const replacement = [];
    model.traverse(node => {
      if (!node.isMesh) return;
      const pivot = pivots[node.name.split('_')[0]];
      if (pivot) replacement.push([pivot, node.clone()]);
    });
    if (replacement.length === 0) return;
    body.traverse(node => { if (node.isMesh) node.visible = false; });
    for (const [pivot, mesh] of replacement) {
      mesh.userData.sharedArtGeometry = true;
      mesh.userData.sharedArtMaterial = true;
      pivot.add(mesh);
    }
    ghost.userData.xmasModelLoaded = true;
  }).catch(error => console.warn('산타 자동인형 모델 로딩 실패:', error));
}

export function loadXmasOpticalModel(target, root, objectId) {
  new GLTFLoader().loadAsync(assetUrl('mia-optical-console')).then(({ scene: model }) => {
    if (!root.parent) {
      model.traverse(node => {
        if (!node.isMesh) return;
        node.geometry.dispose();
        node.material.dispose();
      });
      return;
    }
    for (const child of target.children) {
      if (child.isMesh) child.visible = false;
    }
    model.traverse(node => { if (node.isMesh) node.userData.objId = objectId; });
    target.add(model);
    target.userData.xmasModelLoaded = true;
  }).catch(error => { if (root.parent) console.warn('광학 장치 모델 로딩 실패:', error); });
}
