import * as T from 'three';
import {batchStatic} from './park-entrance.js';
export function addBellDress(rig,color,gothic=false){
 const root=new T.Group();root.name=gothic?'고딕 벨 드레스':'공주 벨 드레스';root.userData.skirtPart=true;rig.add(root);
 const main=new T.MeshStandardMaterial({color,roughness:.78,side:T.DoubleSide}),lace=new T.MeshStandardMaterial({color:gothic?'#c8bac8':'#fff3e6',roughness:.85}),trim=new T.MeshStandardMaterial({color:gothic?'#9f7e9f':'#cfad67',metalness:.35,roughness:.5});
 const add=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
 const profile=[[.49,.025],[.55,.065],[.56,.13],[.52,.23],[.44,.35],[.32,.46],[.22,.55]].map(([r,y])=>new T.Vector2(r,y)),geo=new T.LatheGeometry(profile,64),pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),f=1+Math.cos(Math.atan2(z,x)*18)*.035*(.55-y)/.55;pos.setXYZ(i,x*f,y,z*f);}geo.computeVertexNormals();add(geo,main);
 add(new T.CylinderGeometry(.50,.50,.025,48),lace,0,.024,0);
 for(const [y,r]of [[.05,.54],[.16,.55],[.29,.49]]){
  const band=add(new T.TorusGeometry(r,.017,7,48),lace,0,y,0);band.rotation.x=Math.PI/2;
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2,m=add(new T.TorusGeometry(.026,.006,5,10),lace,Math.sin(a)*r,y-.025,Math.cos(a)*r);m.rotation.y=a;}
 }
 for(const side of [-1,1]){const bow=add(new T.SphereGeometry(.10,12,8),main,side*.09,.52,.23);bow.scale.set(1,.55,.38);bow.rotation.z=side*.35;const ribbon=add(new T.BoxGeometry(.035,.16,.02),lace,side*.047,.43,.23);ribbon.rotation.z=side*.20;}
 add(new T.SphereGeometry(.025,10,7),trim,0,.52,.26);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;add(new T.SphereGeometry(.014,8,6),trim,Math.sin(a)*.41,.38,Math.cos(a)*.41);}
 batchStatic(root);root.children.forEach(o=>o.userData.skirtPart=true);return root;
}
