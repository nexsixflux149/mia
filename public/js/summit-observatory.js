import * as T from 'three';
import {batchStatic} from './park-entrance.js';
export function buildSummitObservatory(){
 const root=new T.Group();root.name='귀문산 전망 정자';root.position.set(-9.5,44,-120.1);
 const stone=new T.MeshStandardMaterial({color:'#d6c6ac',roughness:.9}),wood=new T.MeshStandardMaterial({color:'#583e32',roughness:.8}),roof=new T.MeshStandardMaterial({color:'#294c4b',roughness:.6}),gold=new T.MeshStandardMaterial({color:'#ba9353',metalness:.55,roughness:.4}),metal=new T.MeshStandardMaterial({color:'#53656b',metalness:.7,roughness:.3});
 const add=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
 add(new T.BoxGeometry(6.3,.12,5.9),stone,0,.03,0);
 for(const x of [-2.65,2.65])for(const z of [-2.3,2.3]){add(new T.CylinderGeometry(.13,.17,3.5,12),wood,x,1.8,z);add(new T.CylinderGeometry(.24,.24,.15,12),gold,x,.13,z);}
 for(const z of [-2.3,2.3])add(new T.BoxGeometry(5.8,.22,.23),wood,0,3.4,z);
 for(const x of [-2.65,2.65])add(new T.BoxGeometry(.23,.22,4.8),wood,x,3.4,0);
 for(let i=0;i<3;i++){const r=4.35-i*.65,g=add(new T.CylinderGeometry(Math.max(.1,r-1.7),r,.65,4),roof,0,3.85+i*.47,0);g.scale.z=.94;g.rotation.y=Math.PI/4;const e=add(new T.CylinderGeometry(r+.04,r+.04,.065,4),gold,0,3.53+i*.47,0);e.rotation.y=Math.PI/4;e.scale.z=.94;}
 add(new T.SphereGeometry(.16,12,8),gold,0,5.32,0);
 // A real viewing instrument faces the lobby rather than the mountainside.
 add(new T.CylinderGeometry(.10,.15,1.2,12),metal,0,.7,1.2);add(new T.CylinderGeometry(.40,.46,.10,20),stone,0,.15,1.2);
 for(const x of [-.18,.18]){const scope=add(new T.CylinderGeometry(.12,.15,.65,16),metal,x,1.4,1.2);scope.rotation.x=Math.PI/2;const lens=add(new T.CircleGeometry(.12,20),new T.MeshStandardMaterial({color:'#85b5c0',metalness:.7,roughness:.1}),x,1.4,1.54);}
 for(const x of [-1.5,1.5]){add(new T.BoxGeometry(1.6,.13,.55),wood,x,.55,-1.6);for(const z of [-1.8,-1.4])add(new T.BoxGeometry(.12,.50,.12),metal,x,.25,z);}
 const c=document.createElement('canvas');c.width=768;c.height=160;const cx=c.getContext('2d');cx.fillStyle='#e8d5a7';cx.fillRect(0,0,768,160);cx.strokeStyle='#b79250';cx.lineWidth=12;cx.strokeRect(8,8,752,144);cx.fillStyle='#382d26';cx.font='900 72px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('귀문산 전망대',384,80);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;add(new T.PlaneGeometry(3.5,.73),new T.MeshBasicMaterial({map:tx}),0,3.05,2.44);
 batchStatic(root);root.traverse(o=>{o.userData.noOcc=true;});
 return {root,colliders:[...[-2.65,2.65].flatMap(x=>[-2.3,2.3].map(z=>({x:x-9.5,z:z-120.1,hw:.16,hd:.16,noSpread:true})))]};
}
