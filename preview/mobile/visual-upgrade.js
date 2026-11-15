import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const LEVEL = { low: 0, medium: 1, high: 2 };
const V = (x,y,z) => new THREE.Vector3(x,y,z);
const color = (c, n=0) => new THREE.Color(c).offsetHSL(0,0,n);
function seeded(seed) { let n=seed; return () => ((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296); }
function texture(draw, size=256) {const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=2;return t;}
function clothNormal() {const n=64,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++)data.set([128+Math.sin(x*Math.PI/2)*12,128+Math.cos(y*Math.PI/2)*12,253,255],(y*n+x)*4);const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5);t.needsUpdate=true;return t;}
function tube(points,r=.01,segments=12,sides=5) {return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p))),segments,r,sides,false);}
function batch(parent, material, min=0) {
  const parts=[];
  return { add(g, p=[0,0,0], scale=[1,1,1], rotation=[0,0,0]) {const o=new THREE.Object3D();o.position.fromArray(p);o.scale.fromArray(scale);o.rotation.set(...rotation);o.updateMatrix();g.applyMatrix4(o.matrix);parts.push(g);},
    finish(){if(!parts.length)return null;const geometries=parts.map(g=>g.index?g.toNonIndexed():g);const merged=mergeGeometries(geometries);for(const g of new Set([...parts,...geometries]))g.dispose();const mesh=new THREE.Mesh(merged,material);mesh.userData.noOcc=true;mesh.userData.detailMin=min;mesh.castShadow=true;parent.add(mesh);return mesh;}};
}

export function upgradeAvatar(avatar, look) {
  if(avatar.userData.visualUpgrade)return avatar.userData.visualUpgrade;
  const u=avatar.userData, upper=u.torso.parent, groups=[], meshes=[], replacements=[];
  const normal=clothNormal();
  const hairMat=new THREE.MeshStandardMaterial({color:color(look.hairColor,.035),roughness:.38});
  const hairLight=new THREE.MeshStandardMaterial({color:color(look.hairColor,.09),roughness:.42});
  const seamMat=new THREE.MeshStandardMaterial({color:color(u.torso.material.color,.09),roughness:.88});
  const stitchMat=new THREE.MeshStandardMaterial({color:'#e7dcca',roughness:.9});
  const faceMat=new THREE.MeshStandardMaterial({color:look.body,roughness:.42,emissive:look.body,emissiveIntensity:.055});
  avatar.traverse(o=>{
    if(!o.isMesh||!o.material?.isMeshStandardMaterial||o.material.transparent)return;
    const old=o.material,m=old.clone();
    if(old.color.equals(u.torso.material.color)){m.normalMap=normal;m.normalScale.set(.22,.22);m.roughness=.84;}
    if(old.color.getHexString()===new THREE.Color(look.hairColor).getHexString())m.roughness=.36;
    if(old.color.getHexString()===new THREE.Color(look.body).getHexString())m.roughness=.46;
    replacements.push({mesh:o,old,material:m});
  });
  const group=parent=>{const g=new THREE.Group();g.name='Sculpted avatar detail';parent.add(g);groups.push(g);return g;};
  const head=group(u.head), body=group(upper);
  // Curved overlapping locks give the scalp a shaped silhouette, rather than a smooth helmet.
  if(look.hair!=='none') {
    const core=batch(head,hairMat), fine=batch(head,hairLight,1);
    for(let i=0;i<12;i++){
      const angle=(i/12)*Math.PI*2;
      const points=[];
      for(let j=0;j<5;j++){const theta=.18+j*.31, a=angle+Math.sin(j*.6)*.13;points.push([Math.cos(a)*Math.sin(theta)*.462,Math.cos(theta)*.435,Math.sin(a)*Math.sin(theta)*.445]);}
      // Keep the existing face and eyes clear, and respect original hair coverage.
      if(Math.sin(angle)>.45)points.splice(3);
      core.add(tube(points,.026+(i%3)*.004,10,6));
      if(i%2===0)fine.add(tube(points.map(([x,y,z])=>[x*1.008,y*1.008,z*1.008]),.0045,12,4));
    }
    const backLength=['long','twintail','ponytail'].includes(look.hair)? .34:.08;
    for(let i=0;i<5;i++){const x=(i-2)*.105;core.add(tube([[x,.18,-.415],[x*1.15,.02,-.452],[x*.9,-.13-backLength,-.31]],.043,9,6));}
    meshes.push(core.finish(),fine.finish());
  }
  const cheeks=batch(head,faceMat);
  if(!look.photoOn&&!['mask','clown'].includes(look.extra))cheeks.add(new THREE.SphereGeometry(.026,18,12),[0,-.065,.424],[1,.8,1.1]);
  meshes.push(cheeks.finish());
  const cloth=batch(body,seamMat), stitches=batch(body,stitchMat,1);
  // Sewn collar, softly raised hem, curved side seams and small fabric folds.
  cloth.add(new THREE.TorusGeometry(.158,.018,6,28),[0,.815,0],[1,1,1],[Math.PI/2,0,0]);
  for(const side of [-1,1]){
    cloth.add(tube([[side*.23,.72,.1],[side*.26,.58,.08],[side*.21,.37,.1]],.009,10,5));
    cloth.add(tube([[side*.16,.41,.19],[side*.11,.39,.24],[side*.07,.405,.26]],.009,8,5));
  }
  stitches.add(tube([[-.18,.36,.17],[0,.345,.25],[.18,.36,.17]],.005,16,4));
  if(['sailor','hoodie','blazer','explorer'].includes(look.outfit)) {
    const pocket=new RoundedBoxGeometry(.12,.105,.014,2,.012);cloth.add(pocket,[-.12,.56,.247]);
    stitches.add(tube([[-.17,.6,.258],[-.12,.59,.265],[-.07,.6,.258]],.004,8,4));
    const badge=new THREE.MeshStandardMaterial({color:look.accent,roughness:.52});const b=batch(body,badge);b.add(new THREE.SphereGeometry(.026,12,8),[.12,.63,.262],[1,1,.3]);meshes.push(b.finish());
  }
  meshes.push(cloth.finish(),stitches.finish());
  for(const [i,arm] of u.arms.entries()){
    const cuff=group(arm), b=batch(cuff,stitchMat,1),side=i?1:-1;
    b.add(new THREE.TorusGeometry(.07,.005,5,20),[side*.078,-.258,0],[1,1,1],[Math.PI/2,0,side*.32]);meshes.push(b.finish());
  }
  // Share animation joints. No new bones, animation clocks, bounding radii or movement rules.
  const detail={ enabled:true,quality:'low',
    setEnabled(on){this.enabled=on;groups.forEach(g=>g.visible=on);for(const r of replacements)r.mesh.material=on?r.material:r.old;},
    setQuality(q){this.quality=q;for(const m of meshes.filter(Boolean))m.visible=(m.userData.detailMin||0)<=LEVEL[q];},
    dispose(){this.setEnabled(false);for(const g of groups){g.parent?.remove(g);g.traverse(o=>{o.geometry?.dispose();});}for(const m of new Set([...replacements.map(r=>r.material),hairMat,hairLight,seamMat,stitchMat,faceMat,...meshes.filter(Boolean).map(m=>m.material)]))m.dispose();normal.dispose();}
  };
  avatar.userData.visualUpgrade=detail;detail.setEnabled(true);detail.setQuality('low');return detail;
}

function foliageTexture() {
  return texture((ctx,n)=>{
    ctx.clearRect(0,0,n,n);const r=seeded(441);ctx.lineCap='round';
    for(let branch=0;branch<15;branch++){
      const yy=38+branch*12,span=100*(.25+branch/18);
      ctx.strokeStyle='#39412a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(128,yy-18);ctx.lineTo(128-span,yy+20);ctx.moveTo(128,yy-18);ctx.lineTo(128+span,yy+20);ctx.stroke();
      for(let j=0;j<70;j++){const side=j%2?1:-1,t=r(),x=128+side*span*t,y=yy-18+t*38;ctx.strokeStyle=['#38513b','#4c6141','#71825a','#2b4734'][j%4];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*(6+r()*9),y-8-r()*9);ctx.stroke();}
    }
  },256);
}
function treeGeometry() {
  const barkParts=[],leafParts=[];
  const trunk=new THREE.CylinderGeometry(.065,.16,4.2,7);trunk.translate(0,2.1,0);barkParts.push(trunk);
  for(let layer=0;layer<4;layer++)for(let j=0;j<5;j++){
    const a=j*Math.PI*2/5+layer*.7,y=1.25+layer*.67,rad=1.0-layer*.18;
    const from=V(0,y+.15,0),to=V(Math.cos(a)*rad,y-.13,Math.sin(a)*rad);
    const b=new THREE.CylinderGeometry(.012,.033,from.distanceTo(to),5);b.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),to.clone().sub(from).normalize()));b.translate(...from.clone().add(to).multiplyScalar(.5).toArray());barkParts.push(b);
    const plane=new THREE.PlaneGeometry(rad*1.32,.95);plane.rotateY(a);plane.rotateX(-.28);plane.translate(to.x*.65,y+.16,to.z*.65);leafParts.push(plane);
  }
  const bark=mergeGeometries(barkParts),leaf=mergeGeometries(leafParts);for(const p of [...barkParts,...leafParts])p.dispose();return {bark,leaf};
}
function brickTexture() {return texture((x,n)=>{const r=seeded(113);x.fillStyle='#5b5045';x.fillRect(0,0,n,n);for(let y=0;y<16;y++)for(let j=-1;j<9;j++){const px=j*34+(y%2)*17;x.fillStyle=`rgb(${90+r()*35},${69+r()*24},${54+r()*20})`;x.fillRect(px,y*16,32,14);x.fillStyle='rgba(220,199,172,.10)';x.fillRect(px+1,y*16,30,1);}for(let i=0;i<1200;i++){x.fillStyle=`rgba(10,16,13,${r()*.14})`;x.fillRect(r()*n,r()*n,r()*16,1+r()*12);}},256);}
function pavingTexture() {return texture((x,n)=>{const r=seeded(391);x.fillStyle='#555954';x.fillRect(0,0,n,n);for(let i=0;i<8000;i++){const v=35+r()*70;x.fillStyle=`rgba(${v},${v+3},${v+1},.25)`;x.fillRect(r()*n,r()*n,1+r()*2,1+r()*2);}for(let i=0;i<11;i++){x.strokeStyle='#292f2b';x.lineWidth=.6+r();let px=r()*n,py=r()*n;x.beginPath();x.moveTo(px,py);for(let j=0;j<6;j++){px+=r()*24-12;py+=r()*22;x.lineTo(px,py);}x.stroke();}},512);}

export function upgradeWorld(world,ch) {
  const root=new THREE.Group();root.name='Detailed first chapter scenery';world.root.add(root);
  const originals=[], groups=[],materials=[],textures=[], geometries=[];
  let forestMeshes=[], forestSource=[];
  const remember=m=>{originals.push({mesh:m,visible:m.visible});};
  const originalMaterials=[];
  const mat=(opts)=>{const m=new THREE.MeshStandardMaterial(opts);materials.push(m);return m;};
  const brick=brickTexture(),paving=pavingTexture(),needles=foliageTexture();textures.push(brick,paving,needles);
  const forest=world.root.children.filter(o=>o.userData.previewForest);
  if(forest.length){
    const geo=treeGeometry();geometries.push(geo.bark,geo.leaf);
    const trunk=new THREE.InstancedMesh(geo.bark,mat({color:'#554237',roughness:.95}),forest.length);
    const crowns=new THREE.InstancedMesh(geo.leaf,mat({map:needles,alphaTest:.4,side:THREE.DoubleSide,roughness:.92}),forest.length);
    for(const [i,o] of forest.entries()){remember(o);trunk.setMatrixAt(i,o.matrix);crowns.setMatrixAt(i,o.matrix);}
    trunk.instanceMatrix.needsUpdate=crowns.instanceMatrix.needsUpdate=true;trunk.computeBoundingSphere();crowns.computeBoundingSphere();root.add(trunk,crowns);
    forestMeshes=[trunk,crowns];forestSource=forest.map(o=>({matrix:o.matrix.clone(),position:o.position.clone(),scale:o.scale.x,hidden:false}));
  }
  // Bent, tapered blades replace the three-sided grass spikes at exactly the same positions.
  for(const old of world.root.children.filter(o=>o.isInstancedMesh&&o.geometry.type==='ConeGeometry'&&o.geometry.parameters.height===.34)){
    remember(old);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.02,0,0,.02,0,0,-.015,.17,.025,.015,.17,.025,0,.34,.07],3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,.5,1,.5,.5,1],2));geometry.setIndex([0,1,2,1,3,2,2,3,4]);geometry.computeVertexNormals();geometries.push(geometry);
    const grass=new THREE.InstancedMesh(geometry,mat({color:'#566348',roughness:.96,side:THREE.DoubleSide}),old.count);grass.instanceMatrix.copy(old.instanceMatrix);grass.computeBoundingSphere();root.add(grass);grass.userData.fullCount=old.count;groups.push(grass);
  }
  // Surface replacement leaves the ground geometry, walkable height and all colliders intact.
  for(const mesh of world.root.children.filter(o=>o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.rotation.x< -1)){
    if(mesh.geometry.parameters.width<2)continue;
    const old=mesh.material,m=old.clone();m.map=paving.clone();textures.push(m.map);m.map.repeat.set(mesh.geometry.parameters.width/3,mesh.geometry.parameters.height/3);m.roughness=.91;m.bumpMap=m.map;m.bumpScale=.022;materials.push(m);originalMaterials.push({mesh,old,material:m});
  }
  const trim=mat({color:'#81766a',roughness:.86}),metal=mat({color:'#454b4b',roughness:.68,metalness:.45}),glass=mat({color:'#30464b',roughness:.24,metalness:.2}),wood=mat({color:'#6d5642',roughness:.88});
  for(const house of world.root.children.filter(o=>o.userData.propKind==='house')){
    const detail=new THREE.Group();detail.position.copy(house.position);detail.rotation.copy(house.rotation);root.add(detail);
    const body=house.children.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.width===4.6);
    if(body){const old=body.material,m=old.clone();m.map=brick;m.bumpMap=brick;m.bumpScale=.035;m.color.set('#c1b4a4');m.roughness=.96;materials.push(m);originalMaterials.push({mesh:body,old,material:m});}
    const frame=batch(detail,trim),panes=batch(detail,glass),gutters=batch(detail,metal),boards=batch(detail,wood,1);
    for(const [x,z,ry] of [[-1.2,1.835,0],[0,-1.835,Math.PI]]){
      const w=.86,h=.78,y=1.39;
      for(const side of [-1,1])frame.add(new RoundedBoxGeometry(.055,h,.07,1,.012),[x+side*w/2,y,z]);
      for(const side of [-1,1])frame.add(new RoundedBoxGeometry(w,.055,.075,1,.012),[x,y+side*h/2,z]);
      frame.add(new THREE.BoxGeometry(.04,h,.06),[x,y,z]);frame.add(new THREE.BoxGeometry(w,.035,.06),[x,y,z]);
      panes.add(new THREE.BoxGeometry(w-.07,h-.07,.015),[x,y,z-.02*Math.cos(ry)]);
    }
    // Raised door casing and lintel; existing door openings and interactive shutter stay untouched.
    for(const s of [-1,1])frame.add(new RoundedBoxGeometry(.06,1.48,.08,1,.012),[.6+s*.45,.75,1.84]);frame.add(new RoundedBoxGeometry(.96,.07,.09,1,.012),[.6,1.5,1.84]);
    for(const s of [-1,1]){gutters.add(new THREE.CylinderGeometry(.04,.04,4.9,8),[0,2.42,s*1.91],[1,1,1],[0,0,Math.PI/2]);gutters.add(new THREE.CylinderGeometry(.035,.035,2.35,7),[s*2.22,1.2,1.88]);}
    boards.add(new RoundedBoxGeometry(.9,.11,.035,1,.015),[-1.2,1.43,1.9],[1,1,1],[0,0,.12]);
    for(const b of [frame,panes,gutters,boards]){const m=b.finish();if(m){groups.push(m);geometries.push(m.geometry);}}
    // Tiles follow the existing hip roof; they don't extend its silhouette/collision footprint.
    const tiles=batch(detail,mat({color:'#514741',roughness:.9}),1);
    for(let side=0;side<4;side++)for(let row=0;row<4;row++)for(let col=-4;col<=4;col++){
      const a=side*Math.PI/2,r=1.9-row*.35,w=.23,y=2.45+row*.31;
      const t=new THREE.CylinderGeometry(.09,.09,.35,7,1,true,0,Math.PI);const p=V(col*w,y,r);p.applyAxisAngle(V(0,1,0),a);
      tiles.add(t,p.toArray(),[1,1,1],[Math.PI/2-.55,a,0]);
    }
    const tileMesh=tiles.finish();if(tileMesh){groups.push(tileMesh);geometries.push(tileMesh.geometry);}
  }
  root.traverse(o=>{if(o.isMesh){o.userData.noOcc=true;o.receiveShadow=true;}});
  let enabled=true;
  const detail={setEnabled(on){enabled=on;root.visible=on;for(const o of originals)o.mesh.visible=on?false:o.visible;for(const r of originalMaterials)r.mesh.material=on?r.material:r.old;},
    setQuality(q){for(const g of groups){g.visible=(g.userData.detailMin||0)<=LEVEL[q];if(g.isInstancedMesh&&g.userData.fullCount)g.count=q==='low'?Math.ceil(g.userData.fullCount*.65):g.userData.fullCount;}},
    update(camera,player){
      if(!enabled||!player)return;
      const dx=player.x-camera.x,dz=player.z-camera.z,len=dx*dx+dz*dz;
      for(const [i,tree] of forestSource.entries()){
        const x=tree.position.x-camera.x,z=tree.position.z-camera.z;
        const t=len>0?(x*dx+z*dz)/len:0;
        const distance=Math.hypot(x-dx*Math.max(0,Math.min(1,t)),z-dz*Math.max(0,Math.min(1,t)));
        const hidden=(t>=0&&t<=1.15&&distance<1.25*tree.scale)||Math.hypot(x,z)<1.8*tree.scale;
        if(hidden===tree.hidden)continue;tree.hidden=hidden;
        const m=tree.matrix.clone();if(hidden)m.elements[13]=-10000;
        for(const mesh of forestMeshes){mesh.setMatrixAt(i,m);mesh.instanceMatrix.needsUpdate=true;}
      }
    },
    dispose(){this.setEnabled(false);world.root.remove(root);for(const g of new Set(geometries))g.dispose();for(const m of new Set(materials))m.dispose();for(const t of new Set(textures))t.dispose();}
  };
  detail.setEnabled(enabled);detail.setQuality('low');return detail;
}
