import {buildSummitObservatory} from './summit-observatory.js';
import {buildSummitViking} from './summit-viking.js';
import * as T from 'three';
import {MOUNTAIN_TRAIL,MOUNTAIN_PATHS,MOUNTAIN_SLOTS,mountainSurface,mountainGroundHeight} from './mountain-layout.js';
export function buildLobbyMountain(){
 const root=new T.Group();root.name='귀문산 · 열 개의 빈 자리';root.userData.noSpread=true;
 const crag=document.createElement('canvas');crag.width=crag.height=512;const cx=crag.getContext('2d');cx.fillStyle='#777d76';cx.fillRect(0,0,512,512);
 const random=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 for(let i=0;i<4500;i++){const shade=65+random(i+100)*95;cx.fillStyle=`rgba(${shade},${shade+5},${shade},.3)`;cx.fillRect(random(i)*512,random(i+25)*512,2+random(i+38)*16,2+random(i+40)*8);}
 for(let i=0;i<90;i++){const x=random(i+6000)*512,y=random(i+7000)*512;cx.strokeStyle=i%3?'#60665f':'#404a40';cx.lineWidth=1+random(i)*2;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+random(i+500)*45-20,y+15);cx.lineTo(x+random(i+530)*50-25,y+50);cx.stroke();}
 const cragMap=new T.CanvasTexture(crag);cragMap.colorSpace=T.SRGBColorSpace;cragMap.wrapS=cragMap.wrapT=T.RepeatWrapping;cragMap.repeat.set(14,10);
 const rock=new T.MeshStandardMaterial({vertexColors:true,map:cragMap,bumpMap:cragMap,bumpScale:.3,roughness:1});
 const paving=document.createElement('canvas');paving.width=paving.height=512;const px=paving.getContext('2d');
 px.fillStyle='#9f9c8d';px.fillRect(0,0,512,512);
 for(let row=0;row<8;row++)for(let col=-1;col<8;col++){const x=col*72+(row%2)*36,y=row*64;const shade=138+((col*19+row*13+100)%35);px.fillStyle=`rgb(${shade+8},${shade+5},${shade})`;px.fillRect(x+2,y+2,68,60);px.strokeStyle='#bbb7a6';px.strokeRect(x+3,y+3,66,58);}
 const pavingMap=new T.CanvasTexture(paving);pavingMap.colorSpace=T.SRGBColorSpace;pavingMap.wrapS=pavingMap.wrapT=T.RepeatWrapping;pavingMap.repeat.set(8,4);
 const stone=new T.MeshStandardMaterial({color:'#d4cebb',map:pavingMap,roughness:.96});
 const dark=new T.MeshStandardMaterial({color:'#444a45',roughness:1});
 const rawHeight=mountainGroundHeight;
 const geo=new T.PlaneGeometry(180,110,140,110);geo.rotateX(-Math.PI/2);geo.translate(0,0,-93);
 const pos=geo.attributes.position,colors=[];const color=new T.Color();
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),walk=mountainSurface(x,z,1.1);let y=rawHeight(x,z);
  if(walk!==null)y=walk-.16;
  pos.setY(i,y);const strata=Math.sin(y*2.8+x*.04)*.04,noise=Math.sin(x*13+z*17)*.025;
  color.setRGB(.26+y*.002+strata+noise,.30+y*.002+strata+noise,.27+y*.002+strata+noise);colors.push(color.r,color.g,color.b);
 }geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const terrain=new T.Mesh(geo,rock);terrain.userData.noOcc=true;root.add(terrain);
 // Continuous ribbons share their edge vertices at bends: no crossing end-caps or rails.
 const vertices=[],indices=[],edges=[];
 for(const points of MOUNTAIN_PATHS){const base=vertices.length/3,edge=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z),nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length;edge.push([-1,1].map(side=>new T.Vector3(p.x+nx*2.8*side,p.y,p.z+nz*2.8*side)));for(const v of edge.at(-1))vertices.push(v.x,v.y+.025,v.z);if(i){const j=base+(i-1)*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}edges.push(edge);}
 const road=new T.BufferGeometry();road.setAttribute('position',new T.Float32BufferAttribute(vertices,3));road.setIndex(indices);const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/12,vertices[i+2]/12);road.setAttribute('uv',new T.Float32BufferAttribute(uv,2));road.computeVertexNormals();
 const pathMat=stone.clone();pathMat.side=T.DoubleSide;const path=new T.Mesh(road,pathMat);root.add(path);
 const terrace=new T.Mesh(new T.BoxGeometry(80,.45,14),stone);terrace.position.set(0,15.775,-83);root.add(terrace);
 const summit=new T.Mesh(new T.BoxGeometry(28,.7,20),stone);summit.position.set(0,43.65,-126);root.add(summit);
 const pads=new T.InstancedMesh(new T.CylinderGeometry(2.5,2.65,.08,40),dark,10),rim=new T.InstancedMesh(new T.TorusGeometry(2.25,.07,6,40),new T.MeshStandardMaterial({color:'#ad9c6a',metalness:.4,roughness:.55}),10);
 const m=new T.Matrix4();MOUNTAIN_SLOTS.forEach((p,i)=>{m.makeTranslation(p.x,16.03,p.z);pads.setMatrixAt(i,m);m.makeRotationX(-Math.PI/2);m.setPosition(p.x,16.09,p.z);rim.setMatrixAt(i,m);});root.add(pads,rim);
 // Pine trees and path lamps use shared instancing: no additional realtime lights.
 const trees=[];
 for(let i=0;i<340;i++){const x=(random(i+9000)-.5)*142,z=-45-random(i+9500)*87;if(mountainSurface(x,z,3)!==null)continue;trees.push({x,z,y:rawHeight(x,z),s:.65+random(i+9800)*.7});}
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.16,.25,2.7,6),new T.MeshStandardMaterial({color:'#3d342b',roughness:1}),trees.length);
 const leaves=new T.InstancedMesh(new T.IcosahedronGeometry(1.5,1),new T.MeshStandardMaterial({color:'#233c35',roughness:1}),trees.length*3);
 trees.forEach((p,i)=>{m.makeScale(p.s,p.s,p.s);m.setPosition(p.x,p.y+1.3*p.s,p.z);trunks.setMatrixAt(i,m);for(let k=0;k<3;k++){m.makeScale(p.s*(1-k*.17),p.s*.35,p.s*(1-k*.17));m.setPosition(p.x+Math.sin(i+k)*.45*p.s,p.y+(2.6+k*.7)*p.s,p.z+Math.cos(i+k)*.4*p.s);leaves.setMatrixAt(i*3+k,m);}});root.add(trunks,leaves);
 const crags=[];for(let i=0;i<160;i++){const x=(random(i+11000)-.5)*140,z=-58-random(i+12000)*72;if(mountainSurface(x,z,5)!==null)continue;crags.push({x,z,y:rawHeight(x,z),s:1.2+random(i+13000)*3});}
 const boulders=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#69756a',map:cragMap,bumpMap:cragMap,bumpScale:.2,roughness:1}),crags.length);
 crags.forEach((p,i)=>{m.makeScale(p.s,p.s*(1.3+random(i+14000)),p.s*.8);m.setPosition(p.x,p.y+.5,p.z);boulders.setMatrixAt(i,m);});root.add(boulders);
 const rails=[],posts=[],lamps=[];
 for(const edge of edges){let last=-100;for(let i=0;i<edge.length;i++){for(let side=0;side<2;side++){const v=edge[i][side];if(i)rails.push([edge[i-1][side].clone().add(new T.Vector3(0,.8,0)),v.clone().add(new T.Vector3(0,.8,0))]);}if(i===0||i===edge.length-1||edge[i][0].distanceTo(edge[Math.max(0,last)][0])>3.5){posts.push(...edge[i]);lamps.push(...edge[i]);last=i;}}}
 // Only outside boundaries are fenced; entrances and the entire terrace aisle stay clear.
 const boundary=(a,b)=>{rails.push([new T.Vector3(...a).add(new T.Vector3(0,.8,0)),new T.Vector3(...b).add(new T.Vector3(0,.8,0))]);const length=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.ceil(length/3.5);for(let i=0;i<=n;i++){const v=new T.Vector3(...a).lerp(new T.Vector3(...b),i/n);posts.push(v);lamps.push(v);}};
 for(const [a,b] of [[[-40,16,-76],[-5,16,-76]],[[5,16,-76],[40,16,-76]],[[-40,16,-90],[32,16,-90]],[[-40,16,-90],[-40,16,-76]],[[40,16,-90],[40,16,-76]],[[-14,44,-136],[14,44,-136]],[[-14,44,-136],[-14,44,-116]],[[14,44,-136],[14,44,-116]],[[-14,44,-116],[-5,44,-116]],[[5,44,-116],[14,44,-116]]])boundary(a,b);
 const railMesh=new T.InstancedMesh(new T.CylinderGeometry(.055,.055,1,5),dark,rails.length),poleMesh=new T.InstancedMesh(new T.BoxGeometry(.18,.85,.18),dark,posts.length),glow=new T.InstancedMesh(new T.BoxGeometry(.23,.16,.23),new T.MeshBasicMaterial({color:'#f6d79b',toneMapped:false}),lamps.length);
 const quat=new T.Quaternion(),scale=new T.Vector3();rails.forEach(([a,b],i)=>{const d=b.clone().sub(a);quat.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());m.compose(a.clone().add(b).multiplyScalar(.5),quat,scale.set(1,d.length(),1));railMesh.setMatrixAt(i,m);});posts.forEach((v,i)=>{m.makeTranslation(v.x,v.y+.42,v.z);poleMesh.setMatrixAt(i,m);m.makeTranslation(v.x,v.y+.96,v.z);glow.setMatrixAt(i,m);});root.add(railMesh,poleMesh,glow);
 const viking=buildSummitViking();root.add(viking.root);const observatory=buildSummitObservatory();root.add(observatory.root);
 root.traverse(o=>{if(o.isMesh)o.userData.noOcc=true;});
 return {root,walkMeshes:[path,terrace,summit],heightAt:mountainSurface,trail:MOUNTAIN_TRAIL,slots:MOUNTAIN_SLOTS,observatoryColliders:observatory.colliders,clickables:[{id:'viking',group:viking.root}],rides:{viking:viking.ride},interactives:[viking.interactive],update:viking.update};
}
