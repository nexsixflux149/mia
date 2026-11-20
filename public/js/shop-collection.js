import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.65,...extra});
function kit(){
 const root=new T.Group();
 const add=(geo,m,x=0,y=0,z=0,parent=root)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 const ell=(m,x,y,z,sx,sy,sz,parent=root)=>{const o=add(new T.SphereGeometry(1,16,12),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;};
 const tube=(pts,r,m,parent=root)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),16,r,6,false),m,0,0,0,parent);
 const bow=(x,y,z,size,m,parent=root)=>{
  for(const s of [-1,1])ell(m,x+s*size*.6,y,z,size*.7,size*.40,size*.18,parent).rotation.z=s*.24;
  ell(m,x,y,z+.012,size*.22,size*.25,size*.22,parent);
  for(const s of [-1,1])add(new T.BoxGeometry(size*.32,size*.95,size*.09),m,x+s*size*.25,y-size*.55,z,parent).rotation.z=s*-.20;
 };
 return {root,add,ell,tube,bow};
}
function mergeStatic(group){
 for(const child of [...group.children])if(!child.isMesh)mergeStatic(child);
 const bins=new Map();for(const mesh of [...group.children])if(mesh.isMesh){mesh.updateMatrix();let g=mesh.geometry.clone().applyMatrix4(mesh.matrix);if(g.index){const f=g.toNonIndexed();g.dispose();g=f;}if(!bins.has(mesh.material))bins.set(mesh.material,[]);bins.get(mesh.material).push(g);group.remove(mesh);mesh.geometry.dispose();}
 for(const [material,geos]of bins){const o=new T.Mesh(mergeGeometries(geos),material);o.castShadow=true;group.add(o);geos.forEach(g=>g.dispose());}
}
export function buildGreatCape(){
 const {root,add,ell,tube}=kit(),navy=mat('#18223e',{side:T.DoubleSide}),wine=mat('#6c1336',{side:T.BackSide}),gold=mat('#d4aa50',{metalness:.65,roughness:.3});
 const geo=new T.PlaneGeometry(1,1,36,22),a=geo.attributes.position;
 for(let i=0;i<a.count;i++){
  const u=a.getX(i)+.5,v=.5-a.getY(i),width=.44+v*1.45;
  a.setXYZ(i,(u-.5)*width,.74-v*.74,-.22-v*.43-Math.sin(u*Math.PI)*.14-Math.cos(u*8*Math.PI)*(.015+v*.055));
 }geo.computeVertexNormals();
 const cape=add(geo,navy);const lining=add(geo.clone(),wine);lining.position.z=.006;
 for(const side of [-1,1]){
  const pts=[];for(let i=0;i<=16;i++){const v=i/16;pts.push([side*(.44+v*1.45)/2,.74-v*.74,-.22-v*.43-(.015+v*.055)]);}tube(pts,.012,gold);
  for(let i=1;i<14;i++){const v=i/14;ell(gold,side*((.44+v*1.45)/2-.034),.74-v*.74,-.24-v*.43,.012,.018,.007);}
 }
 const hem=[];for(let i=0;i<=24;i++){const u=i/24;hem.push([(u-.5)*1.89,0,-.65-Math.sin(u*Math.PI)*.14-Math.cos(u*8*Math.PI)*.07]);}tube(hem,.012,gold);
 for(const s of [-1,1]){const collar=add(new T.BoxGeometry(.20,.20,.055),navy,s*.18,.75,-.16);collar.rotation.z=-s*.30;}
 tube([[-.18,.71,.14],[0,.64,.26],[.18,.71,.14]],.009,gold);
 ell(gold,0,.64,.27,.045,.045,.012);
 for(const side of [-1,1])for(let j=1;j<9;j++){
   const v=j/10,x=side*((.44+v*1.45)/2-.07),y=.74-v*.74,z=-.25-v*.43;
   tube([[x,y-.03,z],[x-side*.045,y,z-.015],[x,y+.03,z]],.005,gold);
 }
 mergeStatic(root);
 root.scale.x=.52;root.scale.y=.76;root.position.y=.16;
 root.userData.anim=t=>{cape.rotation.x=Math.sin(t*1.5)*.016;lining.rotation.x=cape.rotation.x;};return root;
}
export function buildHeadAxe(){
 const {root,add,ell,tube}=kit(),wood=mat('#754d2e'),iron=mat('#a1a8a7',{metalness:.8,roughness:.3}),dark=mat('#332924'),red=mat('#6c1420');
 const prop=new T.Group();root.add(prop);prop.position.set(.18,.76,.08);prop.rotation.z=.70;
 add(new T.CylinderGeometry(.030,.037,.66,16),wood,0,.27,0,prop);
 for(let i=0;i<8;i++){const wrap=add(new T.TorusGeometry(.037,.009,5,12),dark,0,.35+i*.035,0,prop);wrap.rotation.x=Math.PI/2;}
 const shape=new T.Shape();shape.moveTo(.06,.09);shape.lineTo(-.12,.09);shape.quadraticCurveTo(-.27,.11,-.38,.20);shape.quadraticCurveTo(-.43,-.03,-.36,-.23);shape.quadraticCurveTo(-.24,-.19,-.10,-.12);shape.lineTo(.06,-.12);shape.closePath();
 add(new T.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,steps:1,bevelSegments:2}),iron,0,0,-.032,prop);
 add(new T.BoxGeometry(.13,.16,.10),iron,.055,-.015,0,prop);
 const edge=new T.Shape();edge.moveTo(-.38,.20);edge.quadraticCurveTo(-.43,-.03,-.36,-.23);edge.lineTo(-.325,-.21);edge.quadraticCurveTo(-.38,-.02,-.35,.17);edge.closePath();
 add(new T.ExtrudeGeometry(edge,{depth:.069,bevelEnabled:false}),mat('#e4e9e6',{metalness:.9,roughness:.22}),0,0,-.034,prop);
 ell(red,-.29,-.14,.042,.075,.027,.006,prop);
 for(let i=0;i<12;i++){const a=i*2.4;ell(red,-.03+Math.sin(a)*.075,.40+Math.cos(a)*.013,.17+Math.cos(a)*.06,.014+(i%3)*.008,.007,.022);}
 tube([[-.055,.39,.22],[-.075,.36,.29],[-.08,.30,.36]],.007,red);
 tube([[.01,.40,.23],[.025,.36,.30],[.02,.32,.35]],.004,red);mergeStatic(root);root.userData.anim=()=>{};return root;
}
export function buildGiantBow(){
 const {root,add,ell,tube}=kit(),satin=mat('#ad7c8c',{roughness:.37,metalness:.10,side:T.DoubleSide}),shade=mat('#815565',{roughness:.48,side:T.DoubleSide});
 const bow=new T.Group();root.add(bow);bow.position.set(.06,.38,-.02);bow.rotation.z=-.12;
 for(const side of [-1,1]){
  const geo=new T.PlaneGeometry(1,1,24,18),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,v=p.getY(i)*2;const width=.055+Math.sin(u*Math.PI*.8)*.24;const x=side*(.045+u*.36),y=v*width+.035*Math.sin(u*Math.PI),z=.025+Math.sin(u*Math.PI)*.13+Math.cos(v*3*Math.PI)*.014*Math.sin(u*Math.PI);p.setXYZ(i,x,y,z);}geo.computeVertexNormals();add(geo,satin,0,0,0,bow);
  const back=add(geo.clone(),shade,0,0,-.015,bow);back.scale.y=.96;
  const tail=new T.PlaneGeometry(1,1,12,22),t=tail.attributes.position;
  for(let i=0;i<t.count;i++){const u=t.getX(i),v=.5-t.getY(i);t.setXYZ(i,side*(.07+v*.14)+u*(.11+v*.08),-.05-v*.33+Math.abs(u)*v*.06,-.035+Math.sin(v*6)*.045+u*u*.15);}tail.computeVertexNormals();add(tail,satin,0,0,0,bow);
  for(let j=0;j<3;j++)tube([[side*.06,(j-1)*.025,.08],[side*.16,(j-1)*.07,.15],[side*.30,(j-1)*.15,.12]],.002,shade,bow);
 }
 ell(satin,0,0,.09,.065,.10,.075,bow);
 for(let i=0;i<3;i++)tube([[-.04+i*.035,-.075,.12],[-.035+i*.035,0,.17],[-.04+i*.035,.075,.12]],.002,shade,bow);
 mergeStatic(root);root.userData.anim=()=>{};return root;
}
export function buildWaterDeer(){
 const {root,add,ell,tube}=kit(),brown=mat('#a87949'),cream=mat('#e5d3a9'),inner=mat('#bb9278'),nose=mat('#30261e',{roughness:.25}),eye=mat('#171816',{roughness:.15}),white=mat('#fff6db');
 const fur=document.createElement('canvas');fur.width=fur.height=256;const f=fur.getContext('2d');f.fillStyle='#b58651';f.fillRect(0,0,256,256);
 for(let i=0;i<5500;i++){const x=(i*73.71)%256,y=(i*37.19)%256;f.strokeStyle=i%3?'rgba(65,39,19,.15)':'rgba(252,228,173,.3)';f.lineWidth=.6;f.beginPath();f.moveTo(x,y);f.lineTo(x+Math.sin(i)*2,y+3+(i%5));f.stroke();}
 const texture=new T.CanvasTexture(fur);texture.colorSpace=T.SRGBColorSpace;brown.color.set('#ffffff');brown.map=texture;brown.bumpMap=texture;brown.bumpScale=.007;
 const head=ell(brown,0,.02,.04,.54,.55,.47);
 ell(cream,0,-.22,.44,.25,.18,.15);ell(nose,0,-.17,.577,.083,.057,.035);
 for(const s of [-1,1]){
  const ear=ell(brown,s*.36,.59,.0,.14,.32,.075);ear.rotation.z=-s*.32;
  const pad=ell(inner,s*.36,.60,.06,.085,.24,.02);pad.rotation.z=-s*.32;
  ell(brown,s*.255,.08,.415,.15,.17,.055);
  ell(eye,s*.255,.08,.462,.092,.115,.025);ell(white,s*.23,.115,.488,.023,.029,.006);
  const fang=add(new T.ConeGeometry(.023,.12,12),white,s*.165,-.35,.525);fang.rotation.z=Math.PI+s*.12;
  tube([[s*.02,-.26,.585],[s*.09,-.29,.566],[s*.16,-.26,.54]],.006,inner);

 }mergeStatic(root);return root;
}
export function collectionCostume(u,id){
 const parts=[],roots=[];
 const attach=(parent)=>{const k=kit();parent.add(k.root);parts.push(k.root);roots.push(k.root);return k;};
 const whiteDress=id==='costume_lolita_white',blackDress=id==='costume_lolita_black';
 const red=mat(whiteDress?'#eee5d7':blackDress?'#17151e':'#681b35',{roughness:.78}),ivory=mat(blackDress?'#59515c':whiteDress?'#fffaf1':'#f0e3c8'),gold=mat('#c8a15a',{metalness:.65,roughness:.3}),black=mat('#171a23'),silver=mat('#c4d0d7',{metalness:.65,roughness:.3});
 if(['costume_lolita','costume_lolita_white','costume_lolita_black'].includes(id)){
  const k=attach(u.torso.parent);
  k.ell(red,0,.51,0,.29,.27,.22);
  const skirt=new T.LatheGeometry([new T.Vector2(.53,-.02),new T.Vector2(.54,.07),new T.Vector2(.49,.18),new T.Vector2(.37,.30),new T.Vector2(.21,.43)],64);
  const sp=skirt.attributes.position;for(let i=0;i<sp.count;i++){const x=sp.getX(i),z=sp.getZ(i),y=sp.getY(i),a=Math.atan2(z,x),v=Math.max(0,(.43-y)/.45),pleat=1+Math.cos(a*18)*.032*v;sp.setXYZ(i,x*pleat,y,z*pleat);}skirt.computeVertexNormals();k.add(skirt,red);
  // closed modest petticoat, tiered lace scallops and pearl edge.
  k.add(new T.CylinderGeometry(.48,.48,.03,48),ivory,0,-.025,0);
  for(const [y,r]of [[-.015,.53],[.10,.53],[.22,.455]]){
   const band=k.add(new T.CylinderGeometry(r-.012,r+.008,.043,64,1,true),ivory,0,y-.008,0);
   const tor=k.add(new T.TorusGeometry(r,.018,8,56),ivory,0,y,0);tor.rotation.x=Math.PI/2;
   for(let i=0;i<36;i++){const a=i/36*Math.PI*2;const lace=k.add(new T.TorusGeometry(.025,.007,5,12),ivory,Math.sin(a)*r,y-.02,Math.cos(a)*r);lace.rotation.y=a;k.ell(ivory,Math.sin(a)*r,y+.018,Math.cos(a)*r,.009,.009,.009);}
  }
  k.ell(ivory,0,.66,.19,.22,.095,.045);k.bow(0,.64,.25,.085,red);k.bow(0,.33,.25,.11,red);
  for(let i=0;i<5;i++){const y=.40+i*.04;k.tube([[-.07,y,.225],[.07,y+.04,.225]],.005,gold);k.tube([[.07,y,.23],[-.07,y+.04,.23]],.005,gold);}
  for(const a of u.arms){const sleeve=attach(a);sleeve.ell(red,0,-.04,0,.13,.16,.13);const cuff=sleeve.add(new T.TorusGeometry(.09,.019,7,24),ivory,0,-.18,.02);cuff.rotation.x=Math.PI/2;sleeve.bow(0,-.12,.12,.04,red);}
  const h=attach(u.head);
  const bonnet=h.add(new T.SphereGeometry(.465,36,18,Math.PI/2-.95,1.9,0,.95),red);bonnet.scale.set(1.08,.95,1);
  for(let i=0;i<22;i++){const a=-1.0+i/21*2.0;const x=Math.sin(a)*.43,y=.26+Math.cos(a)*.17,z=.19;h.ell(ivory,x,y,z,.032,.040,.024);h.ell(gold,x,y-.03,z+.016,.008,.008,.008);}
  for(const side of [-1,1]){
    h.bow(side*.37,.30,.18,.12,red);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;h.ell(red,side*.36+Math.cos(a)*.035,.33+Math.sin(a)*.035,.24,.026,.025,.014);}
    h.ell(gold,side*.36,.33,.26,.015,.015,.01);
    k.bow(side*.36,.17,.30,.075,red);
  }
 }else if(id==='costume_sentai'){
  const armor=mat('#b4212d',{metalness:.3,roughness:.35});const h=attach(u.head);
  h.ell(armor,0,0,0,.49,.46,.46);
  // Angular visor is curved to sit directly on the helmet shell.
  function faceplate(points,material,offset){
   const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
   let geo=new T.ShapeGeometry(shape,16);if(geo.index){const flat=geo.toNonIndexed();geo.dispose();geo=flat;}
   for(let pass=0;pass<3;pass++){
    const a=geo.attributes.position,vertices=[];
    const push=(x,y,z)=>vertices.push(x.x,x.y,0,y.x,y.y,0,z.x,z.y,0);
    for(let i=0;i<a.count;i+=3){const x=new T.Vector2(a.getX(i),a.getY(i)),y=new T.Vector2(a.getX(i+1),a.getY(i+1)),z=new T.Vector2(a.getX(i+2),a.getY(i+2));const xy=x.clone().add(y).multiplyScalar(.5),yz=y.clone().add(z).multiplyScalar(.5),zx=z.clone().add(x).multiplyScalar(.5);push(x,xy,zx);push(xy,y,yz);push(zx,yz,z);push(xy,yz,zx);}
    geo.dispose();geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
   }
   const pos=geo.attributes.position;
   for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,Math.sqrt(Math.max(.001,.495**2-x*x-(y/.94)**2))*.94+offset);}geo.computeVertexNormals();return h.add(geo,material);
  }
  faceplate([[-.41,.16],[-.18,.12],[0,.17],[.18,.12],[.41,.16],[.37,-.08],[.15,-.12],[0,-.23],[-.15,-.12],[-.37,-.08]],silver,.005);
  faceplate([[-.38,.125],[-.17,.085],[0,.13],[.17,.085],[.38,.125],[.34,-.05],[.13,-.085],[0,-.19],[-.13,-.085],[-.34,-.05]],mat('#101923',{metalness:.5,roughness:.18}),.013);
  faceplate([[-.18,-.23],[0,-.26],[.18,-.23],[.13,-.35],[-.13,-.35]],silver,.015);
  for(const x of [-.07,0,.07])h.add(new T.BoxGeometry(.04,.012,.01),black,x,-.30,.393);
  const crest=h.add(new T.ConeGeometry(.075,.18,4),gold,0,.30,.35);crest.rotation.z=Math.PI;
  const k=attach(u.torso.parent);k.ell(armor,0,.52,0,.30,.29,.23);k.ell(silver,0,.64,.21,.27,.12,.045);
  const star=new T.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2,r=i%2?.035:.085;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();k.add(new T.ExtrudeGeometry(star,{depth:.015,bevelEnabled:false}),gold,0,.56,.255);
  k.add(new T.BoxGeometry(.54,.07,.40),silver,0,.30,0);k.ell(gold,0,.30,.22,.065,.045,.015);
  for(const arm of u.arms){const a=attach(arm);a.ell(armor,0,-.06,0,.14,.15,.14);a.add(new T.CapsuleGeometry(.085,.18,6,16),ivory,0,-.26,.02);a.add(new T.TorusGeometry(.09,.016,6,18),gold,0,-.16,.02).rotation.x=Math.PI/2;}
  for(const leg of u.legs){const l=attach(leg);l.add(new T.CapsuleGeometry(.095,.12,6,16),armor,0,-.02,0);l.ell(ivory,0,-.12,.035,.12,.09,.17);l.ell(gold,0,-.045,.10,.07,.035,.02);}
 }else return null;
 roots.forEach(mergeStatic);return {parts,anim:()=>{}};
}
