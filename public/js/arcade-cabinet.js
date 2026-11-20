import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original cabinet modeled from the supplied reference. All surfaces are real geometry.
export function buildArcadeCabinet() {
  const root = new THREE.Group(); root.name = '미아 오락실';
  let seed = 9137;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const patina = canvas(1024, 1024), p = patina.getContext('2d');
  p.fillStyle = '#817c70'; p.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26000; i++) {
    p.fillStyle = ['#403b36','#7d756a','#614534','#9c8770','#a59d8e','#625e56'][i % 6];
    p.globalAlpha = .025 + rnd() * .11;
    const x = rnd()*1024, y = rnd()*1024, r = rnd()**4*7+.35;
    p.beginPath(); p.ellipse(x,y,r,r*(.2+rnd()),rnd()*6.28,0,6.29); p.fill();
  }
  for(let i=0;i<210;i++) { p.strokeStyle='#b2a38b'; p.globalAlpha=.1+rnd()*.22; p.beginPath(); const x=rnd()*1024,y=rnd()*1024; p.moveTo(x,y);p.lineTo(x+rnd()*7,y+12+rnd()*90);p.stroke(); }
  p.globalAlpha=1;
  // Brushed metal, grime at seams and distinct dried drips, authored on the surfaces.
  for(let i=0;i<1800;i++){p.fillStyle=i%2?'rgba(220,211,194,.07)':'rgba(20,18,16,.05)';p.fillRect(rnd()*1024,0,.5+rnd(),1024);}
  function bloodStain(ctx,x,y,scale=1){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#480b08';ctx.strokeStyle='#480b08';
    for(let i=0;i<24;i++){const a=rnd()*6.28,d=rnd()*32;ctx.beginPath();ctx.ellipse(Math.cos(a)*d,Math.sin(a)*d,.8+rnd()*5,1+rnd()*7,rnd()*6,0,7);ctx.fill();}
    for(let i=0;i<5;i++){const dx=(rnd()-.5)*39,len=15+rnd()*95;ctx.lineWidth=.8+rnd()*3;ctx.beginPath();ctx.moveTo(dx,0);ctx.bezierCurveTo(dx+3,len*.3,dx-2,len*.7,dx+1,len);ctx.stroke();ctx.beginPath();ctx.ellipse(dx+1,len,ctx.lineWidth*.8,ctx.lineWidth*1.4,0,0,7);ctx.fill();}
    ctx.restore();
  }
  for(const [x,y,k] of [[310,310,1.1],[470,570,.9],[370,710,1.0],[160,470,.7],[520,450,.6]])bloodStain(p,x,y,k);

  const surface=tex(patina);
  const metal = new THREE.MeshStandardMaterial({map:surface,bumpMap:surface,bumpScale:.016,emissive:'#aca08a',emissiveMap:surface,emissiveIntensity:.18,metalness:.55,roughness:.64});
  const trim = new THREE.MeshStandardMaterial({color:'#aaa48b',emissive:'#625b42',emissiveIntensity:.25,metalness:.65,roughness:.65});
  const black = new THREE.MeshStandardMaterial({color:'#121714',roughness:.76});
  const rubber = new THREE.MeshStandardMaterial({color:'#0b0c0b',roughness:.98});
  const red = new THREE.MeshStandardMaterial({color:'#71362b',roughness:.65});
  const green = new THREE.MeshStandardMaterial({color:'#506c3c',roughness:.7});
  const buckets = new Map();
  function piece(geometry, material, x=0,y=0,z=0,rx=0,ry=0,rz=0) {
    geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1)));
    const g=geometry.index?geometry.toNonIndexed():geometry; if(g!==geometry)geometry.dispose();
    if(material===metal){const pos=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<pos.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));const u=ax>ay&&ax>az?pos.getZ(i):pos.getX(i);const v=ay>ax&&ay>az?pos.getZ(i):pos.getY(i);uv.setXY(i,(u+1)/3.5,(v+.6)/3.8);}}
    if(!buckets.has(material))buckets.set(material,[]); buckets.get(material).push(g);
  }
  const box=(w,h,d,m,x,y,z,rx=0,ry=0,rz=0)=>piece(new THREE.BoxGeometry(w,h,d),m,x,y,z,rx,ry,rz);
  const ball=(r,m,x,y,z)=>piece(new THREE.SphereGeometry(r,16,12),m,x,y,z);
  const cyl=(r,h,m,x,y,z,rx=0)=>piece(new THREE.CylinderGeometry(r,r,h,12),m,x,y,z,rx);
  // Swept side silhouette: wide control shelf, recessed sloped CRT and projecting marquee.
  const outline=[[-.55,.10],[.56,.10],[.56,1.20],[.76,1.38],[.76,1.60],[.40,1.72],[.22,2.63],[.55,2.76],[.55,3.10],[-.55,3.10]];
  const shape=new THREE.Shape(); outline.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();
  for(const side of [-1,1])piece(new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012}),metal,side*.66,0,0,0,-Math.PI/2);
  box(1.3,2.94,.08,metal,0,1.58,-.51);
  box(1.3,.1,1.08,metal,0,.12,0);
  box(1.3,1.12,.09,metal,0,.72,.51);
  box(1.3,.17,1.25,metal,0,1.41,.09);
  box(1.3,.08,.61,metal,0,1.56,.44,.13);
  box(1.3,.39,.08,metal,0,2.91,.50);
  box(1.3,.07,1.05,metal,0,3.08,0);
  // Display surround lies in a shallow recess, its entire assembly tilts together.
  const screenGroup=new THREE.Group();screenGroup.position.set(0,2.16,.33);screenGroup.rotation.x=-.19;root.add(screenGroup);
  function screenBox(w,h,d,m,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);screenGroup.add(mesh);}
  screenBox(1.24,1.02,.12,black,0,0,0);
  for(const x of [-.58,.58])screenBox(.055,.99,.055,trim,x,0,.07);
  for(const y of [-.46,.46])screenBox(1.17,.045,.055,trim,0,y,.07);
  const crt=canvas(768,576),c=crt.getContext('2d');
  c.fillStyle='#0a1611';c.fillRect(0,0,768,576);
  const glow=c.createRadialGradient(384,260,12,384,285,410);glow.addColorStop(0,'#46583b');glow.addColorStop(1,'#07120e');c.fillStyle=glow;c.fillRect(0,0,768,576);
  c.textAlign='center';c.shadowColor='#dfff9b';c.shadowBlur=15;c.fillStyle='#edffc9';c.font='bold 92px "Malgun Gothic",sans-serif';c.fillText('연습게임',384,268);
  c.shadowBlur=4;c.font='26px "Malgun Gothic",sans-serif';c.fillText('미니 방탈출 · 100',384,336);c.font='21px "Malgun Gothic",sans-serif';c.fillText('눌러서 시작',384,448);
  c.shadowBlur=0; for(let y=0;y<576;y+=4){c.fillStyle='rgba(0,0,0,.21)';c.fillRect(0,y,768,1);}
  for(let i=0;i<1800;i++){c.fillStyle=`rgba(190,210,160,${rnd()*.13})`;c.fillRect(rnd()*768,rnd()*576,1,1);}
  bloodStain(c,130,355,.43);bloodStain(c,610,85,.45);
  const glass=new THREE.PlaneGeometry(1.07,.82,24,20), a=glass.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setZ(i,.055*(1-(x/.55)**2)*(1-(y/.43)**2));}glass.computeVertexNormals();
  const crtMesh=new THREE.Mesh(glass,new THREE.MeshBasicMaterial({map:tex(crt),toneMapped:false}));crtMesh.position.z=.082;screenGroup.add(crtMesh);
  const sign=canvas(1024,240),s=sign.getContext('2d');s.drawImage(patina,0,0,1024,240);s.fillStyle='rgba(0,0,0,.48)';s.fillRect(16,16,992,208);s.strokeStyle='#84775a';s.lineWidth=3;s.strokeRect(21,21,982,198);s.textAlign='center';s.fillStyle='#c4b590';s.font='bold 126px "Malgun Gothic",sans-serif';s.fillText('미아 오락실',512,164);
  for(let i=0;i<160;i++){s.fillStyle='rgba(22,27,23,.5)';s.fillRect(rnd()*1024,rnd()*240,2+rnd()*12,1+rnd()*4);}
  bloodStain(s,875,18,.8);bloodStain(s,120,195,.45);
  const marquee=new THREE.Mesh(new THREE.PlaneGeometry(1.16,.27),new THREE.MeshStandardMaterial({map:tex(sign),roughness:.9}));marquee.position.set(0,2.92,.546);root.add(marquee);
  // Two worn control stations, washers, button rims and inset button faces.
  for(const x of [-.37,.28]){
    cyl(.072,.018,black,x,1.615,.52);cyl(.018,.17,trim,x,1.70,.52);ball(.058,black,x,1.80,.52);
    for(let j=0;j<3;j++){const bx=x+.13+j*.065,bz=.59-(j%2)*.10;cyl(.033,.018,trim,bx,1.601,bz);cyl(.026,.023,j%2?green:red,bx,1.617,bz);}
  }
  // Coin panel, keyhole, inset return chute and captive screws.
  box(.46,.73,.045,trim,0,.64,.577);box(.41,.68,.02,black,0,.64,.605);
  for(const x of [-.10,.10]){box(.095,.13,.025,trim,x,.85,.627);box(.016,.073,.028,black,x,.85,.643);box(.115,.09,.025,trim,x,.66,.628);box(.083,.055,.029,black,x,.663,.645);}
  box(.29,.14,.025,metal,0,.43,.634);cyl(.022,.018,trim,.137,.53,.638,Math.PI/2);
  for(const x of [-.18,.18])for(const y of [.34,.95]){cyl(.013,.016,trim,x,y,.629,Math.PI/2);box(.016,.002,.003,black,x,y,.639);}
  // Side ventilation and dangling power cable, visibly separated from the casing.
  for(let i=0;i<9;i++)box(.012,.025,.26,black,.709,.46+i*.052,-.19);
  const points=[[.73,2.0,-.22],[.80,1.68,-.1],[.83,.58,.23],[.84,.31,.05],[.77,.54,-.40],[.75,1.50,-.45]].map(v=>new THREE.Vector3(...v));
  piece(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.014,7,false),rubber);
  for(const x of [-.52,.52])for(const z of [-.40,.39])cyl(.055,.10,black,x,.055,z);
  for(const [material,parts]of buckets){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  root.traverse(o=>{if(o.isMesh)o.userData.noOcc=true;});
  return root;
}
