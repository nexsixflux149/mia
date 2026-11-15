import * as THREE from 'three';
const faces=new Map(),materials=new Map();
function faceTexture(type){
 if(faces.has(type))return faces.get(type);
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
 let seed=type==='woman'?2719:4711;const r=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 x.fillStyle=type==='woman'?'#a8afa3':'#abb4aa';x.fillRect(0,0,512,256);
 for(let i=0;i<3600;i++){x.fillStyle=`rgba(39,49,46,${r()*.13})`;x.fillRect(r()*512,r()*256,1+r()*2,1+r()*3);}
 // The original sphere UV places the face at x=128. Uncanny shadows, no added gore.
 const shadow=(cx,cy,rx,ry,opacity)=>{x.save();x.translate(cx,cy);x.scale(rx,ry);const g=x.createRadialGradient(0,0,.05,0,0,1);g.addColorStop(0,`rgba(11,18,18,${opacity})`);g.addColorStop(1,'rgba(11,18,18,0)');x.fillStyle=g;x.fillRect(-1,-1,2,2);x.restore();};
 for(const side of [-1,1]){
  shadow(128+side*28,127,23,31,.94);shadow(128+side*36,168,22,47,.58);
  x.fillStyle='#0c1212';x.beginPath();x.ellipse(128+side*27,124,12,6.5,side*.1,0,Math.PI*2);x.fill();
  x.fillStyle='#b4b5a0';x.beginPath();x.ellipse(128+side*27,124,2,2.4,0,0,Math.PI*2);x.fill();
  if(type==='woman')for(let i=0;i<8;i++){x.strokeStyle='rgba(30,41,36,.27)';x.lineWidth=.6;x.beginPath();x.moveTo(128+side*(17+i),137+i*.7);x.quadraticCurveTo(128+side*(26+i*2),141+i,128+side*(38+i),145+i*.9);x.stroke();}
 }
 shadow(128,157,10,22,.65);shadow(128,185,26,23,.72);
 x.fillStyle='#111713';x.beginPath();x.ellipse(128,184,8.5,18,0,0,Math.PI*2);x.fill();
 x.strokeStyle='rgba(42,44,34,.7)';x.lineWidth=2;x.beginPath();x.moveTo(117,174);x.quadraticCurveTo(129,167,139,175);x.stroke();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;faces.set(type,t);return t;
}
function materialFor(old,type,role){const key=old.uuid+type+role;if(materials.has(key))return materials.get(key);const m=old.clone();
 if(role==='face'){m.color.set('#ffffff');m.map=faceTexture(type);m.emissiveMap=null;m.emissive.set('#17211c');m.emissiveIntensity=.12;m.roughness=.92;}
 else if(role==='eye'){m.color.set('#c0bba1');m.emissive.set('#c0bba1');m.emissiveIntensity=.18;m.roughness=.7;}
 else if(role==='halo'){m.opacity=.09;}
 else{m.emissive?.multiplyScalar(.15);if(m.emissiveIntensity)m.emissiveIntensity*=.18;if(m.color.getHex()>0x777777)m.color.multiplyScalar(.84);m.roughness=.97;}
 materials.set(key,m);return m;}
export function upgradeGhost(g,type){
 if(!['woman','child','janitor','elder','mudang','crawler','father','nurse','sailor','zombie'].includes(type))return;
 const u=g.userData,head=u.parts.head,changes=[];
 const face=head.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry'&&o.geometry.parameters.phiLength>6);
 if(face)changes.push({object:face,old:face.material,material:materialFor(face.material,type,'face')});
 g.traverse(o=>{
  if(o===face||!o.material||Array.isArray(o.material))return;
  if(o.isSprite&&o.parent?.isMesh){changes.push({object:o,old:o.material,material:materialFor(o.material,type,'halo')});return;}
  if(!o.material.isMeshStandardMaterial)return;
  const role=o.material.emissiveIntensity>1.5?'eye':o.material.color.getHex()<0x101010?null:'cloth';
  if(role)changes.push({object:o,old:o.material,material:materialFor(o.material,type,role)});
 });
 u.horrorDetail={enabled:true,setEnabled(on){this.enabled=on;for(const c of changes)c.object.material=on?c.material:c.old;}};u.horrorDetail.setEnabled(true);
}
