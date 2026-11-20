import * as T from 'three';
import {MOUNTAIN_TRAIL,MOUNTAIN_SLOTS,mountainSurface} from './mountain-layout.js';
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
 function rawHeight(x,z){
  const ridge=Math.max(0,1-Math.abs(x)/88),depth=Math.max(0,Math.min(1,(-z-38)/70));
  const crown=31*Math.exp(-((x+15)**2/420+(z+113)**2/190))+27*Math.exp(-((x-32)**2/230+(z+114)**2/200));
  let y=Math.max(0,depth*ridge*24+crown+(Math.sin(x*.28+z*.13)*3+Math.sin(x*.71-z*.21)*1.2)*depth);
  let best=Infinity,target=0;
  const td=Math.hypot(Math.max(0,Math.abs(x)-40),Math.max(-87-z,z+73,0));if(td<best){best=td;target=16;}
  for(let j=1;j<MOUNTAIN_TRAIL.length;j++){const a=MOUNTAIN_TRAIL[j-1],b=MOUNTAIN_TRAIL[j],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);if(d<best){best=d;target=a.y+(b.y-a.y)*t;}}
  const blend=Math.max(0,Math.min(1,(best-3.5)/8));return (target-.18)*(1-blend)+y*blend;
 }
 const geo=new T.PlaneGeometry(156,100,130,100);geo.rotateX(-Math.PI/2);geo.translate(0,0,-88);
 const pos=geo.attributes.position,colors=[];const color=new T.Color();
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),walk=mountainSurface(x,z,1.1);let y=rawHeight(x,z);
  if(walk!==null)y=walk-.16;
  pos.setY(i,y);const strata=Math.sin(y*2.8+x*.04)*.04,noise=Math.sin(x*13+z*17)*.025;
  color.setRGB(.26+y*.002+strata+noise,.30+y*.002+strata+noise,.27+y*.002+strata+noise);colors.push(color.r,color.g,color.b);
 }geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const terrain=new T.Mesh(geo,rock);terrain.userData.noOcc=true;root.add(terrain);
 // Ribbons have exactly the same interpolation as the movement surface.
 const vertices=[],indices=[];
 for(let j=1;j<MOUNTAIN_TRAIL.length;j++){
  const a=MOUNTAIN_TRAIL[j-1],b=MOUNTAIN_TRAIL[j],length=Math.hypot(b.x-a.x,b.z-a.z),nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length,base=vertices.length/3;
  for(let k=0;k<=32;k++)for(const side of [-1,1]){const t=k/32;vertices.push(a.x+(b.x-a.x)*t+nx*2.8*side,a.y+(b.y-a.y)*t+.025,a.z+(b.z-a.z)*t+nz*2.8*side);}
  for(let k=0;k<32;k++){const i=base+k*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
 }
 const road=new T.BufferGeometry();road.setAttribute('position',new T.Float32BufferAttribute(vertices,3));road.setIndex(indices);const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/12,vertices[i+2]/12);road.setAttribute('uv',new T.Float32BufferAttribute(uv,2));road.computeVertexNormals();
 const pathMat=stone.clone();pathMat.side=T.DoubleSide;const path=new T.Mesh(road,pathMat);root.add(path);
 const terrace=new T.Mesh(new T.BoxGeometry(80,.45,14),stone);terrace.position.set(0,15.775,-80);root.add(terrace);
 const wall=new T.Mesh(new T.BoxGeometry(80,5.2,.7),dark);wall.position.set(0,13.1,-72.9);root.add(wall);
 // The ascending path joins the middle of the retaining wall; no obstructing slab there.
 wall.geometry.dispose();root.remove(wall);
 for(const x of [-21,21]){const w=new T.Mesh(new T.BoxGeometry(38,5.2,.7),dark);w.position.set(x,13.1,-72.9);root.add(w);}
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
 const lamps=[];for(let i=1;i<MOUNTAIN_TRAIL.length;i++){const a=MOUNTAIN_TRAIL[i-1],b=MOUNTAIN_TRAIL[i];for(let k=0;k<=8;k++){const t=k/8,dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);for(const side of [-1,1])lamps.push([a.x+dx*t-dz/len*2.5*side,a.y+(b.y-a.y)*t,a.z+dz*t+dx/len*2.5*side]);}}
 const posts=new T.InstancedMesh(new T.BoxGeometry(.24,.65,.24),dark,lamps.length),glow=new T.InstancedMesh(new T.BoxGeometry(.27,.18,.27),new T.MeshBasicMaterial({color:'#f6d79b',toneMapped:false}),lamps.length);
 lamps.forEach(([x,y,z],i)=>{m.makeTranslation(x,y+.32,z);posts.setMatrixAt(i,m);m.makeTranslation(x,y+.69,z);glow.setMatrixAt(i,m);});root.add(posts,glow);
 // Masonry blocks and trail railings give the broad forms readable detail at game scale.
 const blocks=[];for(let row=0;row<5;row++)for(let col=0;col<40;col++){const x=-39+col*2+(row%2)*.4;if(Math.abs(x)<3)continue;blocks.push([x,11.4+row*.9,-72.45]);}
 const masonry=new T.InstancedMesh(new T.BoxGeometry(1.86,.82,.35),new T.MeshStandardMaterial({color:'#8e948b',roughness:1}),blocks.length);
 blocks.forEach(([x,y,z],i)=>{m.makeTranslation(x,y,z);masonry.setMatrixAt(i,m);});root.add(masonry);
 const rails=[],pillars=[];
 for(let j=1;j<MOUNTAIN_TRAIL.length;j++){const a=MOUNTAIN_TRAIL[j-1],b=MOUNTAIN_TRAIL[j],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),n=Math.ceil(len/3);
  for(const side of [-1,1]){for(let k=0;k<=n;k++){const t=k/n;pillars.push([a.x+dx*t-dz/len*2.7*side,a.y+(b.y-a.y)*t+.42,a.z+dz*t+dx/len*2.7*side]);}
   const start=new T.Vector3(a.x-dz/len*2.7*side,a.y+.75,a.z+dx/len*2.7*side),end=new T.Vector3(b.x-dz/len*2.7*side,b.y+.75,b.z+dx/len*2.7*side);rails.push([start,end]);}}
 const railMesh=new T.InstancedMesh(new T.CylinderGeometry(.065,.065,1,6),dark,rails.length),poleMesh=new T.InstancedMesh(new T.BoxGeometry(.18,.85,.18),dark,pillars.length);
 const quat=new T.Quaternion(),scale=new T.Vector3();rails.forEach(([a,b],i)=>{const direction=b.clone().sub(a);quat.setFromUnitVectors(new T.Vector3(0,1,0),direction.clone().normalize());m.compose(a.clone().add(b).multiplyScalar(.5),quat,scale.set(1,direction.length(),1));railMesh.setMatrixAt(i,m);});pillars.forEach(([x,y,z],i)=>{m.makeTranslation(x,y,z);poleMesh.setMatrixAt(i,m);});root.add(railMesh,poleMesh);
 root.traverse(o=>{if(o.isMesh)o.userData.noOcc=true;});
 return {root,walkMeshes:[path,terrace],heightAt:mountainSurface,trail:MOUNTAIN_TRAIL,slots:MOUNTAIN_SLOTS};
}
