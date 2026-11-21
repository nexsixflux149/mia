import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function batchStatic(root){const buckets=new Map();for(const o of [...root.children])if(o.isMesh&&!o.userData.keep){o.updateMatrix();let a=buckets.get(o.material);if(!a)buckets.set(o.material,a=[]);const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));g.applyMatrix4(o.matrix);a.push(g);root.remove(o);o.geometry.dispose();}for(const [material,geos]of buckets){root.add(new T.Mesh(mergeGeometries(geos,false),material));geos.forEach(g=>g.dispose());}}
export function buildParkEntrance(){
 const root=new T.Group();root.name='미아랜드 입구';root.position.set(0,0,-32);root.userData.noSpread=true;
 const material=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.65,...extra});
 const cream=material('#eee1c2'),ivory=material('#fff1db'),pink=material('#d58f91'),red=material('#ba5467'),blue=material('#4a91b6'),gold=material('#caa259',{metalness:.55,roughness:.35}),green=material('#558649'),brown=material('#785345'),dark=material('#293943'),leaf=material('#3f723f');
 const lamp=new T.MeshBasicMaterial({color:'#ffedaa',toneMapped:false}),mint=material('#92baaa');
 const add=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
 const box=(w,h,d,m,x,y,z)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
 const sphere=(r,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=add(new T.SphereGeometry(r,12,8),m,x,y,z);o.scale.set(sx,sy,sz);return o;};
 function planeText(text,w,h,x,y,z,color='#d6ad61',bg=null,font='900 100px sans-serif'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);}ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,980);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,toneMapped:false});return add(new T.PlaneGeometry(w,h),m,x,y,z);
 }
 const base=add(new T.CylinderGeometry(10.2,10.4,.12,64),cream,0,.03,0);base.scale.z=.40;
 for(const x of [-5.5,5.5]){
  for(const z of [-.7,.8]){box(.66,4.3,.66,cream,x,2.2,z);box(.9,.24,.9,gold,x,.18,z);box(.9,.20,.9,gold,x,4.2,z);box(.44,3.6,.1,ivory,x,2.15,z+.36);}
  box(3.5,.38,2.5,gold,x,4.45,0);box(3.2,2.5,2.05,cream,x,5.9,-.05);
  box(2.85,1.8,.12,pink,x,5.8,1.02);
  for(let k=-2;k<=2;k++){const a=box(.055,2.6,.04,ivory,x+k*.54,5.8,1.12);a.rotation.z=.7;const b=box(.055,2.6,.04,ivory,x+k*.54,5.8,1.13);b.rotation.z=-.7;}
  for(const side of [-1,1]){box(.24,2.8,.3,ivory,x+side*1.5,5.9,1.08);box(.12,2.2,.12,red,x+side*1.5,5.9,1.27);}
  box(3.7,.22,2.6,gold,x,7.2,0);
 }
 function star(x,y,z,r=.4){const s=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.11,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1});return add(g,gold,x,y,z);}
 for(const x of [-5.5,5.5]){add(new T.CylinderGeometry(.55,.55,.1,32),gold,x,5.85,1.22).rotation.x=Math.PI/2;star(x,5.85,1.3,.54);}
 function roof(x,y,r,h,m){for(let i=0;i<5;i++){const t=i/5,rr=r*(1-t*.82),hh=h/5+.10;add(new T.CylinderGeometry(Math.max(.08,rr-r*.18),rr,hh,4),m,x,y+t*h,0).rotation.y=Math.PI/4;add(new T.CylinderGeometry(rr+.025,rr+.025,.065,4),gold,x,y+t*h-hh/2,0).rotation.y=Math.PI/4;}sphere(.10,gold,x,y+h,0);}
 box(2.1,1.8,1.75,ivory,-5.8,8.15,0);roof(-5.8,9.1,1.6,2.8,red);
 box(2.1,1.8,1.75,ivory,5.8,8.15,0);roof(5.8,9.1,1.8,2.5,blue);star(5.8,12.05,0,.42);
 // Clock tower and pinnacles use the same warm stone and pastel roofs as the reference.
 box(1.7,2.0,1.75,cream,-3.2,7.35,0);box(1.7,3.8,1.75,cream,-3.2,10,0);for(const x of [-3.95,-2.45])box(.1,3.8,.13,gold,x,10,.9);
 box(2.05,.18,2.1,gold,-3.2,11.9,0);roof(-3.2,12.2,1.35,2.0,red);
 const clock=document.createElement('canvas');clock.width=clock.height=256;const cx=clock.getContext('2d');cx.fillStyle='#fff4dc';cx.beginPath();cx.arc(128,128,116,0,Math.PI*2);cx.fill();cx.strokeStyle='#b68c44';cx.lineWidth=9;cx.stroke();cx.fillStyle='#71552b';cx.font='24px serif';cx.textAlign='center';cx.textBaseline='middle';for(let i=1;i<=12;i++){const a=i*Math.PI/6;cx.fillText(String(i),128+Math.sin(a)*87,128-Math.cos(a)*87);}cx.strokeStyle='#71552b';cx.lineWidth=6;cx.beginPath();cx.moveTo(128,128);cx.lineTo(90,89);cx.moveTo(128,128);cx.lineTo(150,70);cx.stroke();const ct=new T.CanvasTexture(clock);ct.colorSpace=T.SRGBColorSpace;add(new T.CircleGeometry(.72,40),new T.MeshStandardMaterial({map:ct,roughness:.7}),-3.2,10.65,.91);
 for(const x of [-7.6,-4.0,4.0,7.6]){box(.45,1.2,.5,pink,x,7.5,.25);roof(x,8.1,.62,1.25,x<0?red:blue);}
 const band=new T.Shape();for(let i=0;i<=64;i++){const a=i/64*Math.PI,x=Math.cos(a)*6.0,y=4.35+Math.sin(a)*3.0;i?band.lineTo(x,y):band.moveTo(x,y);}for(let i=64;i>=0;i--){const a=i/64*Math.PI;band.lineTo(Math.cos(a)*4.85,4.35+Math.sin(a)*2.2);}band.closePath();add(new T.ExtrudeGeometry(band,{depth:.45,bevelEnabled:true,bevelSize:.09,bevelThickness:.06,bevelSegments:2,steps:1}),gold,0,0,.35);
 for(const r of [5.0,5.8])for(let i=1;i<40;i++){const a=i/40*Math.PI;sphere(.065,lamp,Math.cos(a)*r,4.35+Math.sin(a)*(r===5?2.3:2.85),.92);}
 const lettering=document.createElement('canvas');lettering.width=1024;lettering.height=300;const lc=lettering.getContext('2d');lc.font='900 133px sans-serif';lc.textAlign='center';lc.textBaseline='middle';const name='MIALAND';for(let i=0;i<name.length;i++){const t=(i-3)/3,angle=t*.38;lc.save();lc.translate(512+t*409,148+Math.abs(t)**1.6*85);lc.rotate(angle);lc.shadowColor='#89632d';lc.shadowBlur=3;lc.fillStyle=['#fbe27e','#e4a5bb','#8fc5e5','#f3cd69','#e48bb7','#ebd57b','#b2cc8d'][i];lc.fillText(name[i],0,0);lc.restore();}const lt=new T.CanvasTexture(lettering);lt.colorSpace=T.SRGBColorSpace;add(new T.PlaneGeometry(8.9,2.1),new T.MeshBasicMaterial({map:lt,transparent:true,toneMapped:false}),0,6.75,.99);
 box(4.3,.9,.26,red,0,5.35,.9);box(4.55,.10,.35,gold,0,5.85,.88);box(4.55,.10,.35,gold,0,4.85,.88);planeText('미아랜드',4.0,.80,0,5.34,1.05,'#ffe9ac',null,'900 200px sans-serif');
 // Ticket booth, striped scalloped canopy, cashier and crown medallion.
 box(2.1,2.6,1.7,pink,5.65,1.4,1.15);box(1.55,1.45,.08,dark,5.65,1.85,2.04);box(2.35,.18,1.95,gold,5.65,.20,1.15);box(2.3,.14,2,gold,5.65,1.12,1.15);
 for(let i=0;i<8;i++){const x=4.55+i*.31,o=box(.32,.10,1.15,[red,blue,ivory,gold][i%4],x,2.94,1.85);o.rotation.x=.26;sphere(.16,[red,blue,ivory,gold][i%4],x,2.76,2.40,1,1,.4);}
 planeText('TICKETS',2.25,.53,5.65,3.35,2.08,'#ffe9b2','#9a5a48');star(5.65,.66,2.06,.24);
 sphere(.23,material('#edb78f'),5.65,2.10,1.98);box(.48,.50,.20,blue,5.65,1.68,1.90);sphere(.28,blue,5.65,2.32,1.98,1,.35,1);box(.45,.05,.25,gold,5.65,2.30,2.10);
 // Bunting over the arch, lamps, planters and balloon bundle.
 const flagColors=[pink,blue,mint,gold];for(let i=0;i<13;i++){const x=-5.4+i*.9,y=8.70-Math.sin(i/12*Math.PI)*.65;const tri=new T.BufferGeometry();tri.setAttribute('position',new T.Float32BufferAttribute([-.28,0,0,.28,0,0,0,-.48,0],3));tri.computeVertexNormals();const o=add(tri,flagColors[i%4],x,y,.3);o.material.side=T.DoubleSide;}
 for(const x of [-7.8,7.8]){add(new T.CylinderGeometry(.055,.07,2.4,8),gold,x,1.25,2.4);sphere(.18,lamp,x,2.55,2.4);for(const dx of [-1.0,.1]){add(new T.CylinderGeometry(.30,.23,.45,12),brown,x+dx,.25,2.25);sphere(.35,green,x+dx,.65,2.25,1,.8,1);for(let i=0;i<8;i++){const a=i*Math.PI/4;sphere(.065,[pink,ivory,gold][i%3],x+dx+Math.cos(a)*.24,.85,2.25+Math.sin(a)*.22);}}}
 for(const x of [-8.5,8.5]){add(new T.CylinderGeometry(.16,.24,2.2,8),brown,x,1.2,-.6);for(let i=0;i<4;i++)sphere(.8,i%2?leaf:green,x+Math.sin(i*2)*.45,2.2+i*.30,-.6+Math.cos(i)*.25);}
 for(let i=0;i<5;i++){const x=-2.6+Math.sin(i*2)*.5,y=2.5+(i%3)*.35,z=-.4+Math.cos(i)*.22;sphere(.26,flagColors[i%4],x,y,z,.8,1.1,.8);const g=new T.BufferGeometry().setFromPoints([new T.Vector3(x,y-.25,z),new T.Vector3(-2.6,.3,-.4)]);const line=new T.Line(g,new T.LineBasicMaterial({color:'#d2c6ac'}));root.add(line);}
 batchStatic(root);
 return {root,colliders:[{x:-5.5,z:-32,hw:1.8,hd:1.6},{x:5.5,z:-31.5,hw:1.9,hd:2.0}]};
}
