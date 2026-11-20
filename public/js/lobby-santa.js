import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Textures and strand geometry are deterministic and generated once per lobby visitor.
export function lobbySantaVisual(){
 const root=new T.Group(),body=new T.Group();root.add(body);root.name='낡은 외투의 산타';
 let seed=6172;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 function texture(base,cloth=false){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);
  for(let i=0;i<18000;i++){x.globalAlpha=.03+rnd()*.15;x.fillStyle=i%3?'#080707':'#c0ac89';x.fillRect(rnd()*512,rnd()*512,.6+rnd()*3,.6+rnd()*3);}
  for(let i=0;i<85;i++){const a=rnd()*512,b=rnd()*512;x.globalAlpha=.04+rnd()*.15;x.fillStyle=i%3?'#170908':'#2f0909';x.beginPath();x.ellipse(a,b,rnd()*36+3,rnd()*21+2,rnd()*6,0,7);x.fill();}
  if(cloth){x.globalAlpha=.13;x.strokeStyle='#b08c73';x.lineWidth=.4;for(let i=0;i<512;i+=3){x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.moveTo(0,i);x.lineTo(512,i);x.stroke();}}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
 }
 const mat=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.9,...o});
 const cloth=texture('#74332b',true),hide=texture('#392d25',true),iron=texture('#777970'),face=texture('#a38b77');
 const red=mat('#ffffff',{map:cloth,bumpMap:cloth,bumpScale:.035}),leather=mat('#ffffff',{map:hide,bumpMap:hide,bumpScale:.02});
 const skin=mat('#ffffff',{map:face,bumpMap:face,bumpScale:.012}),dark=mat('#201713'),blood=mat('#280706'),steel=mat('#ffffff',{map:iron,bumpMap:iron,bumpScale:.018,metalness:.72,roughness:.53});
 const hair=[mat('#c1b89b'),mat('#a59b80'),mat('#ded4b6'),mat('#817761')];
 const add=(geo,m,x=0,y=0,z=0,p=body)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);return mesh;};
 const ell=(m,x,y,z,sx,sy,sz,p=body)=>{const o=add(new T.SphereGeometry(1,12,10),m,x,y,z,p);o.scale.set(sx,sy,sz);return o;};
 function strand(points,r,m,parent){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),6,r,4,false),m,0,0,0,parent);}
 function furRing(parent,y,rx,rz,count,size){
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2;ell(hair[i%4],Math.cos(a)*rx,y+(rnd()-.5)*.035,Math.sin(a)*rz,size,size*.7,size*.65,parent);}
 }
 // Broad shoulders and a hanging coat, narrowed at the belt, with a forward neck.
 const coat=new T.LatheGeometry([new T.Vector2(.49,.88),new T.Vector2(.59,1.00),new T.Vector2(.57,1.24),new T.Vector2(.55,1.50),new T.Vector2(.66,1.92),new T.Vector2(.72,2.17),new T.Vector2(.60,2.37),new T.Vector2(.35,2.48)],40);
 add(coat,red,0,0,0).rotation.x=.09;
 ell(red,0,2.24,-.18,.65,.34,.44);
 furRing(body,.99,.57,.53,48,.07);
 for(let i=0;i<20;i++){const y=1.04+i*.063;ell(hair[i%4],0,y,.55+(y-1.5)*.025,.067,.055,.045);}
 const belt=add(new T.CylinderGeometry(.575,.575,.17,48,1,true),leather,0,1.43,.08);belt.scale.z=.91;
 const buckle=add(new T.TorusGeometry(.105,.019,6,4),steel,0,1.43,.62);buckle.rotation.z=Math.PI/4;buckle.scale.x=1.25;
 add(new T.BoxGeometry(.18,.025,.025),steel,0,1.43,.64);
 for(let i=0;i<9;i++)ell(dark,.15+i*.038,1.43,.60,.007,.008,.004);
 const seam=mat('#3d201c');
 for(const side of [-1,1]){
  strand([[side*.33,1,.50],[side*.37,1.30,.51],[side*.38,1.65,.55],[side*.42,1.98,.54],[side*.48,2.25,.39]],.009,seam,body);
  for(let i=0;i<11;i++)add(new T.BoxGeometry(.022,.006,.009),hair[1],side*.34,1.06+i*.027,.535);
  const pocket=add(new T.BoxGeometry(.26,.10,.055),red,side*.37,1.25,.51);pocket.rotation.z=side*.1;
 }
 // Frayed scars in the fabric, with close stitches instead of uniformly smooth plastic.
 for(let i=0;i<16;i++){
  const x=(rnd()-.5)*1.0,y=1.05+rnd()*1.23,z=.53-Math.abs(x)*.11;
  const tear=ell(dark,x,y,z,.015+rnd()*.035,.018+rnd()*.06,.008);tear.rotation.z=rnd()-.5;
  for(let j=0;j<3;j++)strand([[x-.025,y+j*.012,z+.009],[x+.027,y+j*.012-.006,z+.01]],.0025,hair[1],body);
 }
 const head=new T.Group();head.position.set(0,2.64,.53);head.rotation.x=.11;body.add(head);
 ell(skin,0,.02,0,.29,.34,.26,head);
 for(const side of [-1,1]){
  ell(skin,side*.27,-.015,-.01,.055,.09,.045,head);
  ell(dark,side*.112,.032,.235,.096,.062,.03,head);
  ell(mat('#bcb49d'),side*.112,.025,.260,.047,.022,.011,head);
  ell(mat('#342b1d'),side*.105,.025,.273,.014,.020,.006,head);
  ell(skin,side*.16,-.044,.216,.105,.051,.055,head);
  const brow=ell(skin,side*.11,.10,.235,.14,.052,.055,head);brow.rotation.z=side*.25;
  for(let i=0;i<13;i++)strand([[side*(.028+i*.013),.11+i*.001,.28],[side*(.05+i*.013),.09,.294],[side*(.07+i*.013),.10,.27]],.004,hair[i%4],head);
  for(let i=0;i<3;i++)strand([[side*.17,-.01-i*.015,.268],[side*.23,-.035-i*.015,.237]],.0025,dark,head);
 }
 ell(skin,0,-.025,.272,.045,.11,.058,head);ell(skin,0,-.085,.33,.066,.048,.052,head);
 for(const x of [-.032,.032])ell(dark,x,-.10,.359,.016,.009,.009,head);
 ell(dark,0,-.16,.26,.105,.014,.012,head);
 // Irregular flowing locks: no solid oval beard hiding the face.
 for(let i=0;i<150;i++){
  const x=(rnd()-.5)*.58,y=-.12-rnd()*.13;
  const len=.29+rnd()*.39+(1-Math.abs(x)/.3)*.10;
  const z=.39+Math.sqrt(Math.max(0,1-(x/.31)**2))*.025;
  strand([[x,y,z],[x*.98+Math.sin(i)*.025,y-len*.30,z+.19],[x*.78+Math.sin(i*2)*.035,y-len*.68,z+.22],[x*.60+Math.sin(i)*.04,y-len,z+.24]],.003+rnd()*.005,hair[i%4],head);
 }
 for(const side of [-1,1])for(let i=0;i<32;i++){
  const y=-.10-rnd()*.035;
  strand([[side*.018,y,.38],[side*.085,y-.012,.39],[side*.17,y-.05,.35],[side*(.20+rnd()*.045),y-.10,.30]],.0035,hair[i%4],head);
 }
 // Slouched cloth cap with a bent tip and dense dirty fur trim.
 const cap=add(new T.LatheGeometry([new T.Vector2(.30,0),new T.Vector2(.31,.12),new T.Vector2(.25,.26),new T.Vector2(.14,.36),new T.Vector2(.025,.40)],28),red,0,.22,-.02,head);cap.rotation.z=.28;
 furRing(head,.24,.30,.26,44,.055);
 ell(red,-.19,.48,-.02,.16,.10,.12,head);ell(hair[0],-.30,.43,.0,.075,.075,.075,head);
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.30,.95,0);body.add(leg);legs.push(leg);
  add(new T.CapsuleGeometry(.19,.33,8,20),red,0,-.18,0,leg);
  add(new T.CylinderGeometry(.19,.18,.44,20),leather,0,-.55,.02,leg);
  ell(leather,0,-.79,.16,.23,.14,.35,leg);ell(dark,0,-.86,.17,.23,.045,.34,leg);
  for(let i=0;i<4;i++){const o=add(new T.TorusGeometry(.18,.011,5,18),leather,0,-.38-i*.065,.02,leg);o.rotation.x=Math.PI/2;}
  const arm=new T.Group();arm.position.set(side*.65,2.18,.015);arm.rotation.z=side*.08;body.add(arm);arms.push(arm);
  const sleeve=add(new T.CapsuleGeometry(.22,.61,8,20),red,side*.02,-.36,.04,arm);sleeve.rotation.x=-.08;
  for(let i=0;i<5;i++)ell(red,side*.02,-.30-i*.11,.10,.225,.035,.18,arm).rotation.z=side*.2;
  const cuff=add(new T.CylinderGeometry(.227,.22,.14,24),leather,0,-.80,.07,arm);
  ell(leather,0,-.95,.09,.16,.21,.14,arm);
  for(let j=0;j<4;j++)ell(leather,(j-1.5)*.061,-1.07,.14,.032,.105,.053,arm);
  ell(leather,side*-.15,-.94,.17,.06,.11,.06,arm).rotation.z=side*.5;
 }
 const axe=new T.Group();arms[0].add(axe);axe.position.set(0,-1,.08);axe.rotation.z=.16;
 add(new T.CylinderGeometry(.035,.05,1.52,14),mat('#55402a',{map:hide}),0,-.05,0,axe);
 const blade=new T.Shape();blade.moveTo(.04,.13);blade.lineTo(-.25,.17);blade.quadraticCurveTo(-.55,.23,-.67,.40);blade.quadraticCurveTo(-.74,.06,-.63,-.27);blade.quadraticCurveTo(-.40,-.26,.04,-.14);blade.closePath();
 add(new T.ExtrudeGeometry(blade,{depth:.065,steps:1,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:2}),steel,0,-.61,-.03,axe);
 for(let i=0;i<26;i++)ell(blood,-.20-rnd()*.43,-.55-rnd()*.24,.048,.004+rnd()*.023,.007+rnd()*.033,.003,axe);
 const sack=new T.Group();root.add(sack);sack.position.set(1.04,.40,-.83);
 const bag=add(new T.SphereGeometry(.52,36,24),red,0,0,0,sack);bag.scale.set(1,.76,1.22);
 const pos=bag.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),k=1+.035*Math.sin(Math.atan2(z,x)*19+y*12);pos.setXYZ(i,x*k,y,z*k);}bag.geometry.computeVertexNormals();
 add(new T.ConeGeometry(.17,.20,20,1,true),red,-.10,.41,-.10,sack);
 const tie=add(new T.TorusGeometry(.09,.019,6,20),hair[1],-.10,.39,-.10,sack);tie.rotation.x=Math.PI/2;
 for(let i=0;i<24;i++){const a=rnd()*6.28,y=rnd()*.5-.2;ell(blood,Math.sin(a)*.49,y,Math.cos(a)*.60,.014+rnd()*.04,.008+rnd()*.05,.014,sack);}
 strand([[.71,1.16,.14],[.9,.90,-.2],[1.02,.65,-.62],[.94,.79,-.93]],.016,hair[1],root);
 // Merge static siblings by material, retaining limb pivots for walking animation.
 function batch(group){
  for(const child of [...group.children])if(!child.isMesh)batch(child);
  const bins=new Map();for(const o of [...group.children])if(o.isMesh){o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();if(!bins.has(o.material))bins.set(o.material,[]);bins.get(o.material).push(flat);group.remove(o);o.geometry.dispose();}
  for(const [m,parts]of bins){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());add(g,m,0,0,0,group);}
 }
 batch(root);
 return {root,update(t,moving){legs.forEach((l,i)=>l.rotation.x=Math.sin(t*2.6+i*Math.PI)*(moving?.25:.012));arms[0].rotation.x=Math.sin(t*2.6)*.05;arms[1].rotation.x=.20;body.position.y=moving?Math.abs(Math.sin(t*2.6))*.022:0;}};
}
