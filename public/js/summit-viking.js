import {textSprite} from './avatar.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
export function buildSummitViking(){
 const root=new T.Group();root.name='귀문산 정상 바이킹';root.position.set(0,44,-128);
 const wood=new T.MeshStandardMaterial({color:'#642b27',roughness:.6}),gold=new T.MeshStandardMaterial({color:'#c9a45b',metalness:.6,roughness:.3}),steel=new T.MeshStandardMaterial({color:'#2e4147',metalness:.65,roughness:.4});
 const add=(geo,mat,x=0,y=0,z=0,parent=root)=>{const g=new T.Mesh(geo,mat);g.position.set(x,y,z);parent.add(g);return g;};
 function beam(a,b,r,mat,parent=root){const d=b.clone().sub(a),g=add(new T.CylinderGeometry(r,r,d.length(),8),mat,0,0,0,parent);g.position.copy(a).add(b).multiplyScalar(.5);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return g;}
 for(const z of [-2.6,2.6])for(const x of [-7,7])beam(new T.Vector3(x,0,z),new T.Vector3(0,10,z),.22,steel);
 beam(new T.Vector3(0,10,-3),new T.Vector3(0,10,3),.3,gold);
 const pivot=new T.Group();pivot.position.y=10;root.add(pivot);
 for(const z of [-1.45,1.45])beam(new T.Vector3(0,0,z),new T.Vector3(0,-8,z),.13,gold,pivot);
 const boat=new T.Group();boat.position.y=-8;pivot.add(boat);
 const shape=new T.Shape();shape.moveTo(-5,1.3);shape.quadraticCurveTo(-4,-.7,0,-.7);shape.quadraticCurveTo(4,-.7,5,1.3);shape.lineTo(4.2,1.3);shape.quadraticCurveTo(3,-.15,0,-.15);shape.quadraticCurveTo(-3,-.15,-4.2,1.3);shape.closePath();
 const hull=new T.ExtrudeGeometry(shape,{depth:3,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.12,bevelThickness:.12});hull.translate(0,0,-1.5);add(hull,wood,0,0,0,boat);
 add(new T.BoxGeometry(7.3,.18,2.8),wood,0,0,0,boat);
 for(const z of [-1.5,1.5]){beam(new T.Vector3(-4.8,1.25,z),new T.Vector3(4.8,1.25,z),.08,gold,boat);for(let x=-4;x<=4;x+=1)beam(new T.Vector3(x,0,z),new T.Vector3(x,1.2,z),.04,gold,boat);}
 const seatPoints=[];for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=-2.7+col*1.8,z=row?.62:-.62;add(new T.BoxGeometry(1.2,.14,.72),steel,x,.25,z,boat);add(new T.BoxGeometry(1.2,.7,.12),wood,x,.6,z+(row?.4:-.4),boat);beam(new T.Vector3(x-.55,.8,z),new T.Vector3(x+.55,.8,z),.055,gold,boat);seatPoints.push(new T.Vector3(x,.33,z));}
 // Batch rigid pieces by material, retaining only the ship pivot as an animated group.
 for(const parent of [boat,pivot,root]){const buckets=new Map();for(const child of [...parent.children])if(child.isMesh){child.updateMatrix();let list=buckets.get(child.material);if(!list)buckets.set(child.material,list=[]);const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();g.applyMatrix4(child.matrix);list.push(g);parent.remove(child);child.geometry.dispose();}for(const [material,geos]of buckets){const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());parent.add(new T.Mesh(geometry,material));}}
 const sign=textSprite('바이킹 탑승 · 배를 누르세요',{size:40,color:'#ffe5a3',bg:'rgba(28,20,18,.9)'});sign.position.set(0,2,-8.7);sign.scale.set(5,1,1);root.add(sign);
 const pad=add(new T.CylinderGeometry(1.1,1.1,.06,40),gold,0,.04,8.8);
 const angle=()=>Math.sin(Date.now()/1000*.75)*1.05;
 const update=()=>{pivot.rotation.z=angle();};
 const ride={posFinal:true,seats:8,sit:true,exit:{x:0,z:-119,y:44},pick:busy=>seatPoints.findIndex((_,i)=>!busy.has(i)),pos(i){const a=angle(),v=seatPoints[i].clone().add(new T.Vector3(0,-8,0)).applyAxisAngle(new T.Vector3(0,0,1),a).add(new T.Vector3(0,54,-128)),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),a);if(i<4)q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI));return {x:v.x,y:v.y,z:v.z,ry:0,q};}};
 return {root,update,ride,interactive:{id:'viking',kind:'ride',x:0,y:44,z:-125,r:10,label:'정상 바이킹',verb:'타기'}};
}
