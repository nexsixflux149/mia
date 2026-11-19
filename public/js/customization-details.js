import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { geo, markShared } from './props.js';

const materials = new Map();
function material(color, metal = false) {
  const key = color + metal;
  if (!materials.has(key)) materials.set(key, markShared(new THREE.MeshStandardMaterial({
    color, roughness: metal ? .3 : .69, metalness: metal ? .62 : 0,
  })));
  return materials.get(key);
}

// 한 장식 안에서 같은 재질의 부품들을 합쳐 그리는 횟수를 줄인다.
function parts(parent, name) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  const batches = new Map();
  function add(source, color, position, scale = [1, 1, 1], rotation = [0, 0, 0], metal = false) {
    const mat = material(color, metal);
    const transform = new THREE.Object3D();
    transform.position.fromArray(position);
    transform.scale.fromArray(scale);
    transform.rotation.set(...rotation);
    transform.updateMatrix();
    const transformed = source.clone().applyMatrix4(transform.matrix);
    const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
    if (geometry !== transformed) transformed.dispose();
    if (!batches.has(mat)) batches.set(mat, []);
    batches.get(mat).push(geometry);
  }
  return {
    group,
    box(color, p, size, rot, metal) {
      add(geo('custom-box', () => new THREE.BoxGeometry(1, 1, 1)), color, p, size, rot, metal);
    },
    ball(color, p, size, metal) {
      add(geo('custom-ball', () => new THREE.SphereGeometry(1, 12, 8)), color, p, size, undefined, metal);
    },
    ring(color, p, radius, thickness, rot = [0, 0, 0], metal = false) {
      add(geo('custom-ring-' + radius + '-' + thickness, () => new THREE.TorusGeometry(radius, thickness, 5, 20)), color, p, undefined, rot, metal);
    },
    cone(color, p, radius, height, rot) {
      add(geo('custom-cone', () => new THREE.ConeGeometry(1, 1, 12)), color, p, [radius, height, radius], rot);
    },
    star(color, p, radius, metal = false) {
      const shape = geo('custom-star', () => {
        const s = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .44 : 1;
          if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        s.closePath();
        return new THREE.ExtrudeGeometry(s, {depth:.20, bevelEnabled:true, bevelSize:.07, bevelThickness:.05, bevelSegments:1, steps:1});
      });
      add(shape, color, p, [radius, radius, radius], undefined, metal);
    },
    heart(color, p, size) {
      const shape = geo('custom-heart', () => {
        const s = new THREE.Shape();
        s.moveTo(0, -.8);
        s.bezierCurveTo(-1.5, .2, -.8, 1.4, 0, .55);
        s.bezierCurveTo(.8, 1.4, 1.5, .2, 0, -.8);
        return new THREE.ExtrudeGeometry(s, {depth:.18, bevelEnabled:true, bevelSize:.05, bevelThickness:.04, bevelSegments:1, steps:1});
      });
      add(shape, color, p, [size,size,size]);
    },
    finish() {
      for (const [mat, geometries] of batches) {
        const mesh = new THREE.Mesh(mergeGeometries(geometries), mat);
        mesh.userData.noOcc = true;
        group.add(mesh);
        geometries.forEach(g => g.dispose());
      }
      return group;
    },
  };
}
function flower(b, p, color, radius = .045, count = 6) {
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count;
    b.ball(color, [p[0]+Math.cos(a)*radius,p[1]+Math.sin(a)*radius,p[2]], [radius*.72,radius*.72,radius*.31]);
  }
  b.ball('#e6ba4f',[p[0],p[1],p[2]+.014],[radius*.57,radius*.57,radius*.32]);
}
function bow(b, p, color, size) {
  for (const s of [-1,1]) {
    b.ball(color,[p[0]+s*size*.59,p[1],p[2]],[size*.65,size*.46,size*.20]);
    b.box(color,[p[0]+s*size*.29,p[1]-size*.67,p[2]],[size*.37,size,size*.20],[0,0,s*-.25]);
  }
  b.ball('#e7c48b',p,[size*.23,size*.24,size*.25],true);
}
function moon(b,p,r,color) {
  for(let i=0;i<9;i++) {
    const a=-1.18+i*2.36/8;
    b.ball(color,[p[0]-Math.cos(a)*r*.52,p[1]+Math.sin(a)*r,p[2]],[r*.30,r*.29,r*.20],true);
  }
}

export function addHairPin(head, look) {
  const id = look.pin;
  if (!id || id === 'none') return;
  const b=parts(head,'Hair pin / '+id), color=look.accent, gold='#e2bd69';
  b.group.position.set(-.31,.18,.31);
  b.group.rotation.set(-.12,-.4,-.29);
  b.box(gold,[0,0,-.006],[.18,.024,.018],undefined,true);
  switch(id) {
    case 'starclip': b.star(gold,[0,0,.013],.078,true); break;
    case 'heartclip': b.heart(color,[0,0,.013],.075); break;
    case 'moonclip': moon(b,[0,0,.015],.085,gold); break;
    case 'cherryclip':
      b.box('#618354',[.015,.055,.01],[.012,.11,.014],[0,0,-.4]);
      b.box('#618354',[-.022,.055,.01],[.012,.11,.014],[0,0,.35]);
      for(const s of [-1,1])b.ball('#c9495b',[s*.045,-.026,.035],[.041,.042,.029]);
      break;
    case 'butterflyclip':
      for(const s of [-1,1]) {
        b.ball(color,[s*.058,.027,.022],[.052,.063,.019]);
        b.ball('#bba7db',[s*.043,-.035,.025],[.039,.034,.020]);
      }
      b.box(gold,[0,0,.044],[.014,.11,.015],undefined,true);
      break;
    case 'pearlclip':
      for(let i=0;i<5;i++)b.ball('#faf0d8',[-.08+i*.04,0,.016],[.024,.024,.022]);
      break;
    case 'crossclip':
      for(const s of [-1,1])b.box(gold,[0,0,.017],[.17,.020,.018],[0,0,s*.5],true);
      break;
    case 'ribbonclip': bow(b,[0,0,.025],color,.092); break;
    case 'daisyclip': flower(b,[0,0,.02],'#fff4df',.057,8); break;
    case 'roseclip':
      for(let i=0;i<7;i++){
        const a=i*2.4;
        b.ball('#c75c77',[Math.cos(a)*.034,Math.sin(a)*.034,.02+i*.003],[.036,.028,.020]);
      }
      b.ball('#f0b0be',[0,0,.05],[.021,.022,.012]);
      break;
    case 'snowclip':
      for(let i=0;i<3;i++)b.box('#c6e4f3',[0,0,.025],[.17,.015,.018],[0,0,i*Math.PI/3],true);
      b.ball('#f6f9ff',[0,0,.035],[.027,.027,.018]);
      break;
    case 'keyclip':
      b.ring(gold,[-.052,.027,.02],.039,.012,undefined,true);
      b.box(gold,[.025,.027,.02],[.11,.022,.023],undefined,true);
      b.box(gold,[.066,.006,.02],[.022,.043,.022],undefined,true);break;
    case 'catclip':
      b.ball(color,[0,0,.018],[.063,.049,.021]);
      for(const s of [-1,1]){
        b.cone(color,[s*.043,.048,.018],.027,.052);
        b.ball('#332933',[s*.023,.005,.040],[.006,.008,.004]);
      }break;
    case 'ghostclip':
      b.ball('#f2eadf',[0,.014,.022],[.057,.065,.022]);
      for(let i=0;i<3;i++)b.ball('#f2eadf',[-.038+i*.038,-.040,.022],[.021,.028,.020]);
      for(const s of [-1,1])b.ball('#383142',[s*.021,.018,.046],[.009,.015,.006]);
      break;
    case 'candyclip':
      b.ball(color,[0,0,.02],[.047,.036,.024]);
      for(const s of [-1,1])b.cone('#f1d8a1',[s*.062,0,.02],.033,.055,[0,0,s*Math.PI/2]);
      break;
    case 'leafclip':
      for(const s of [-1,1])b.ball(s<0?'#7d9c64':'#adc384',[s*.043,s*.016,.02],[.055,.028,.016]);
      break;
    case 'gemclip':
      b.box(gold,[0,0,.01],[.105,.105,.020],[0,0,Math.PI/4],true);
      b.box(color,[0,0,.028],[.077,.077,.026],[.12,.2,Math.PI/4],true);
      break;
    case 'doubleclip':
      for(const s of [-1,1])b.box(s<0?color:gold,[0,s*.034,.02],[.16,.025,.019],[0,0,.12],true);
      break;
  }
  b.finish();
  b.group.traverse(o=>{o.userData.hatPart=true;});
}

export function addHeldItem(arm, look) {
  if (!look.held || look.held === 'none') return null;
  const b=parts(arm,'Hand accessory / '+look.held), gold='#d9b46a', pink='#dd8ca6', cream='#f5e7ca';
  b.group.position.set(-.055,-.34,.07);
  switch(look.held) {
    case 'rose': case 'sunflower': case 'bouquet': {
      const n=look.held==='bouquet'?5:1;
      for(let i=0;i<n;i++){
        const x=n===1?0:Math.sin(i*2.4)*.085,y=.21+(i%3)*.034,z=Math.cos(i*2.4)*.022;
        b.box('#5a8250',[x*.5,.12,z],[.014,.30,.014],[0,0,-x*2]);
        flower(b,[x,y,z],look.held==='sunflower'?'#f2c74a':i%2?'#f2c6d2':'#bc4962',look.held==='sunflower'?.069:.047,look.held==='sunflower'?9:6);
      }
      if(n>1)b.cone('#d0b18f',[0,.04,-.01],.10,.19,[0,0,Math.PI]);
      break;
    }
    case 'lollipop':
      b.box(cream,[0,.05,0],[.017,.29,.017]);
      b.ball(pink,[0,.22,0],[.103,.103,.034]);
      for(let i=0;i<10;i++){
        const a=i*.86,r=.009+i*.007;
        b.ball(cream,[Math.cos(a)*r,.22+Math.sin(a)*r,.034],[.014,.014,.009]);
      }break;
    case 'icecream':
      b.cone('#c69b66',[0,.015,0],.068,.20,[0,0,Math.PI]);
      b.ball(cream,[0,.15,0],[.083,.076,.075]);
      b.ball(pink,[.012,.23,0],[.073,.071,.066]);
      b.ball('#b53c4b',[.012,.30,.008],[.021,.023,.021]);break;
    case 'donut':
      b.ring('#c3935d',[0,.13,0],.083,.034);
      b.ring(pink,[0,.13,.022],.082,.022);
      for(let i=0;i<9;i++){
        const a=i*2.4;
        b.box(i%2?cream:'#87c6bc',[Math.cos(a)*.082,.13+Math.sin(a)*.082,.045],[.022,.008,.007],[0,0,a]);
      }break;
    case 'drink':
      b.cone('#f3d8dc',[0,.075,0],.074,.18);
      b.box(cream,[0,.17,0],[.15,.026,.12]);
      b.box('#b36074',[.027,.245,0],[.013,.16,.013],[0,0,-.14]);
      b.heart('#bc5f75',[0,.073,.068],.031);break;
    case 'magicwand': case 'lightstick':
      b.box(gold,[0,.10,0],[.023,.39,.023],undefined,true);
      if(look.held==='magicwand')b.star('#e8c876',[0,.33,0],.105,true);
      else b.heart(pink,[0,.32,0],.099);
      bow(b,[0,.205,.022],look.accent,.043);break;
    case 'key':
      b.ring(gold,[0,.25,0],.074,.021,undefined,true);
      b.box(gold,[0,.06,0],[.033,.28,.035],undefined,true);
      for(let i=0;i<2;i++)b.box(gold,[.038,-.037+i*.061,0],[.10,.026,.032],undefined,true);
      break;
    case 'book':
      b.box('#54435d',[0,.10,0],[.21,.28,.085]);
      b.box(cream,[.012,.10,.046],[.18,.25,.018]);
      b.box('#795b77',[0,.10,.061],[.215,.28,.016]);
      b.star(gold,[0,.12,.074],.055,true);
      for(const y of [0,.20])b.box(gold,[0,y,.072],[.18,.009,.008],undefined,true);
      break;
    case 'camera':
      b.box('#3c444a',[0,.10,0],[.25,.16,.11]);
      b.box('#b3b5ad',[0,.19,-.01],[.095,.038,.09],undefined,true);
      b.ring('#afb7b5',[.027,.10,.09],.058,.017,undefined,true);
      b.ball('#283d48',[.027,.10,.08],[.047,.047,.025]);
      b.box(cream,[-.075,.14,.061],[.04,.023,.008]);
      break;
    case 'umbrella':
      b.box('#4e4945',[0,.17,0],[.016,.51,.016]);
      b.cone(look.accent,[0,.20,0],.055,.40,[0,0,Math.PI]);
      b.ring('#56463c',[.028,-.06,0],.029,.009);
      for(const x of [-.021,.021])b.box(cream,[x,.20,.047],[.007,.29,.007]);
      break;
    case 'bunnydoll': case 'catdoll':
      b.ball(cream,[0,.08,0],[.09,.11,.07]);b.ball(cream,[0,.23,.015],[.09,.084,.07]);
      for(const side of [-1,1]){
        if(look.held==='bunnydoll'){
          b.ball(cream,[side*.049,.35,.01],[.032,.092,.026]);
          b.ball(pink,[side*.049,.35,.035],[.015,.064,.008]);
        }else b.cone(cream,[side*.059,.31,.01],.041,.082);
        b.ball('#44323a',[side*.03,.24,.081],[.009,.012,.008]);
        b.ball(cream,[side*.095,.12,0],[.035,.06,.035]);
      }
      bow(b,[0,.15,.079],look.accent,.047);break;
    case 'snowglobe':
      b.ball('#c5e0ec',[0,.18,0],[.115,.11,.08]);
      b.box('#8c6b4c',[0,.063,0],[.21,.06,.15]);
      b.cone('#467c66',[0,.17,.079],.055,.13);
      b.star(cream,[0,.25,.086],.025);break;
    case 'fan':
      b.box('#80624a',[0,.03,0],[.016,.23,.016]);
      for(let i=0;i<7;i++){
        const a=(i-3)*.24;
        b.box(i%2?cream:pink,[Math.sin(a)*.091,.18+Math.cos(a)*.08,0],[.051,.18,.012],[0,0,-a]);
      }break;
    case 'letter':
      b.box(cream,[0,.12,0],[.23,.15,.012]);
      for(const s of [-1,1])b.box('#bba78b',[s*.051,.133,.009],[.13,.006,.005],[0,0,s*.48]);
      b.ball('#a64a5a',[0,.101,.016],[.026,.024,.009]);break;
  }
  return b.finish();
}

export function addBodyAccessory(upper, look) {
  const b=parts(upper,'Body accessory / '+look.acc), gold='#d4b671', color=look.accent;
  switch(look.acc) {
    case 'crossbody': case 'satchel': case 'pouch':
      b.box('#4f4037',[0,.64,.29],[.045,.53,.025],[0,0,-.62]);
      b.box(look.acc==='satchel'?'#86664a':color,[.27,.39,.25],[.28,.25,.13]);
      b.box('#d5b487',[.27,.46,.325],[.25,.07,.023]);
      b.box(gold,[.27,.415,.346],[.042,.04,.009],undefined,true);
      if(look.acc==='pouch')b.star(gold,[.27,.35,.325],.051,true);
      break;
    case 'headsetneck':
      b.ring('#45414f',[0,.81,.03],.26,.026,[Math.PI/2,0,0]);
      for(const s of [-1,1]){
        b.ball('#443b4d',[s*.25,.75,.16],[.08,.10,.04]);
        b.ball(color,[s*.25,.75,.20],[.052,.068,.016]);
      }break;
    case 'ribbonneck':
      b.ring('#37313e',[0,.80,0],.25,.017,[Math.PI/2,0,0]);
      bow(b,[0,.72,.31],color,.071);break;
    case 'starchain': case 'moonpendant':
      b.ring(gold,[0,.78,0],.25,.009,[Math.PI/2-.30,0,0],true);
      b.box(gold,[0,.68,.27],[.013,.13,.013],undefined,true);
      if(look.acc==='starchain')b.star(gold,[0,.60,.30],.07,true);
      else moon(b,[0,.60,.30],.07,gold);break;
    case 'flowercorsage':flower(b,[-.16,.71,.29],color,.041);break;
    case 'brooch':
      b.box(gold,[-.16,.70,.28],[.11,.12,.025],[0,0,.4],true);
      b.ball(color,[-.16,.70,.30],[.041,.049,.018],true);break;
    case 'ribbonback':bow(b,[0,.57,-.34],color,.20);break;
    default: upper.remove(b.group);return;
  }
  b.finish();
}

export function addGarmentDetails(upper, look) {
  const b=parts(upper,'Garment tailoring / '+look.outfit), id=look.outfit;
  const accent=look.accent, ivory='#eee5cf', gold='#c9a968', thread='#b8ad97', dark='#373744';
  const buttons=(x,top,n,gap,color=ivory)=>{
    for(let i=0;i<n;i++)b.ball(color,[x,top-i*gap,.284],[.014,.014,.009],color===gold);
  };
  const pocket=(x,y,color=dark)=>{
    b.box(color,[x,y,.256],[.12,.13,.023]);
    b.box(thread,[x,y+.060,.271],[.12,.009,.005]);
  };
  const collar=(color=ivory)=>{
    for(const s of [-1,1])b.box(color,[s*.065,.768,.245],[.10,.13,.025],[0,0,s*.40]);
  };
  const zipper=()=>{
    b.box('#777d83',[0,.59,.280],[.011,.36,.009],undefined,true);
    b.ring(gold,[0,.715,.295],.018,.004,undefined,true);
  };
  const belt=()=>{
    b.box('#4e4238',[0,.36,.259],[.46,.043,.028]);
    b.box(gold,[0,.36,.281],[.065,.046,.018],undefined,true);
  };
  switch(id) {
    case 'plain':
      b.ring(accent,[0,.79,.01],.17,.018,[Math.PI/2,0,0]);
      b.star(accent,[-.12,.64,.312],.04);break;
    case 'sailor':
      for(const s of [-1,1])b.box('#ddd8c8',[s*.133,.71,.285],[.013,.20,.008],[0,0,s*.45]);
      b.box('#b7ab92',[-.14,.52,.268],[.08,.023,.008]);buttons(.18,.55,2,.055,gold);break;
    case 'blazer':case 'police':case 'ringmaster':case 'postal':
      collar(id==='police'?'#8b97a4':ivory);
      buttons(.037,.67,4,.074,gold);
      pocket(-.14,.62,id==='postal'?'#233b49':dark);
      for(const s of [-1,1])b.box(gold,[s*.22,.79,.13],[.092,.021,.12],undefined,true);
      if(id==='postal'){
        b.box('#94765b',[.02,.63,.29],[.06,.46,.026],[0,0,-.54]);
        b.box('#8b6548',[.21,.39,.30],[.25,.20,.10]);
        b.box(ivory,[.21,.43,.355],[.12,.06,.006]);
      }break;
    case 'hanbok':case 'shaman':case 'kimono':case 'hanbok_modern':
      for(const s of [-1,1])b.box(id==='hanbok_modern'?'#67637a':gold,[s*.063,.71,.29],[.013,.24,.012],[0,0,s*.37]);
      bow(b,[.065,.63,.30],id==='kimono'?'#8a5665':accent,.055);
      flower(b,[-.14,.59,.286],id==='shaman'?'#c68c8e':'#b3c5bb',.025);
      if(id==='hanbok_modern'){
        b.box('#67637a',[0,.37,.23],[.43,.16,.09]);
        b.box(ivory,[0,.42,.285],[.42,.013,.01]);
      }break;
    case 'reaper':case 'priest':case 'vampire':case 'witch':case 'wizard':
      buttons(0,.70,4,.076,gold);
      for(const s of [-1,1])b.box('#a99a77',[s*.20,.52,.21],[.013,.39,.010],[0,0,s*.13]);
      if(['wizard','witch'].includes(id)){
        b.star(gold,[-.14,.67,.27],.036,true);
        moon(b,[.13,.51,.27],.034,gold);
      }else b.box('#bc9a64',[0,.76,.28],[.033,.076,.02],undefined,true);
      break;
    case 'nurse':case 'doctor':case 'chef':case 'barista':
      collar();pocket(-.14,.58,id==='barista'?'#7d5b44':ivory);
      buttons(.045,.71,4,.078,id==='chef'?dark:thread);
      if(id==='barista'){
        b.box('#84664e',[0,.52,.27],[.40,.42,.05]);
        b.ring('#d2bf9f',[0,.75,.07],.19,.016,[Math.PI/2,0,0]);
        b.box('#b3a083',[0,.41,.30],[.28,.13,.023]);
        b.box(ivory,[-.10,.61,.304],[.11,.032,.008]);
      }else{
        b.box('#b4a787',[.16,.69,.275],[.08,.048,.014]);
        if(id==='doctor')b.box('#4a6e87',[-.16,.61,.281],[.012,.10,.009]);
      }break;
    case 'maid':case 'princess':case 'gothic':
      for(let i=0;i<9;i++)b.ball(id==='gothic'?'#c6bdd0':ivory,[-.21+i*.052,.37,.28],[.03,.022,.012]);
      for(const s of [-1,1])b.box(id==='gothic'?'#816b8e':accent,[s*.05,.59,.30],[.012,.25,.01],[0,0,s*.37]);
      bow(b,[0,.74,.29],id==='maid'?dark:accent,.05);
      buttons(0,.63,3,.068,gold);break;
    case 'hoodie':case 'streetwear':case 'raincoat':case 'firefighter':case 'mechanic':
      zipper();
      pocket(-.15,.52,id==='raincoat'?'#bba454':'#414c55');
      pocket(.15,.52,id==='mechanic'?'#456c79':'#414c55');
      if(['firefighter','raincoat'].includes(id)){
        for(const y of [.42,.66])b.box('#e0d5a2',[0,y,.292],[.46,.021,.012]);
      }
      if(id==='streetwear'){
        for(const s of [-1,1])b.box('#737d85',[s*.17,.67,.29],[.037,.26,.018]);
        b.box('#b2b695',[.17,.68,.31],[.07,.037,.012],undefined,true);
      }
      if(id==='mechanic'){
        b.box('#b8bdc0',[-.15,.65,.285],[.017,.13,.013],undefined,true);
        b.box('#d2b58d',[.12,.70,.282],[.11,.042,.012]);
      }break;
    case 'varsity':
      collar(ivory);buttons(0,.72,4,.08,ivory);
      for(const s of [-1,1])b.box(ivory,[s*.16,.46,.262],[.09,.018,.012],[0,0,s*.3]);
      b.box(ivory,[-.13,.65,.29],[.065,.10,.014]);
      b.box('#496a51',[-.12,.65,.306],[.038,.052,.005]);
      break;
    case 'cardigan':case 'student_knit':
      collar(id==='cardigan'?ivory:'#f7eddd');buttons(0,.68,4,.081,ivory);
      for(let i=0;i<8;i++)b.box(id==='cardigan'?'#d49ca9':'#948872',[-.18+i*.052,.45,.249],[.008,.12,.008]);
      if(id==='cardigan')bow(b,[0,.77,.294],accent,.054);
      else b.box('#5a657b',[0,.68,.289],[.05,.19,.016]);
      break;
    case 'pajama':case 'dino':case 'bee':case 'panda':
      buttons(0,.68,3,.10,ivory);
      if(id==='pajama')for(const x of [-.13,.13])b.star('#e6cf9b',[x,.59,.265],.029);
      b.box(ivory,[0,.35,.25],[.44,.018,.018]);
      break;
    case 'pirate':case 'cowboy':case 'explorer':case 'ninja':case 'detective':
      belt();pocket(-.14,.62,'#685642');
      b.box('#b4a182',[.14,.65,.278],[.077,.027,.012]);
      if(id==='explorer')b.box('#778473',[.14,.51,.277],[.09,.15,.025]);
      break;
    case 'astronaut':
      for(const s of [-1,1]){
        b.box('#c3c9c4',[s*.16,.52,.284],[.07,.19,.032]);
        b.ring('#8c9ba3',[s*.16,.61,.307],.023,.007);
      }
      for(let i=0;i<3;i++)b.ball(['#b76159','#78a18b','#deb879'][i],[-.05+i*.049,.65,.31],[.014,.014,.008]);
      break;
    case 'tracksuit':case 'hiphop':case 'idol':
      for(const s of [-1,1])b.box(ivory,[s*.22,.59,.17],[.012,.33,.034]);
      b.box(gold,[0,.70,.292],[.07,.035,.017],undefined,true);
      if(id==='idol'){b.star(ivory,[-.14,.65,.28],.038);buttons(.13,.59,3,.061,gold);}
      break;
    case 'knight':
      for(const s of [-1,1])for(let i=0;i<3;i++)b.ball(gold,[s*.18,.70-i*.11,.28],[.012,.012,.010],true);
      b.box('#6d777e',[0,.53,.294],[.013,.30,.012],undefined,true);
      break;
    case 'santa':
      belt();for(const x of [-.16,.16])b.box('#e8dac8',[x,.48,.27],[.10,.02,.014]);
      b.star(gold,[-.12,.67,.285],.026,true);break;
    case 'mummy':
      for(let i=0;i<4;i++)b.box('#ad9f80',[0,.43+i*.08,.272],[.40,.012,.01],[0,0,(i%2?1:-1)*.13]);
      break;
    case 'clown':
      for(const x of [-.17,.17])b.star(x<0?'#80aaa6':'#dfc26c',[x,.50,.285],.034);
      bow(b,[0,.77,.30],accent,.044);break;
    case 'magician':
      buttons(.05,.66,3,.09,gold);
      b.box(ivory,[-.13,.66,.28],[.08,.10,.012],[0,0,-.18]);
      b.heart('#a83b56',[-.13,.66,.29],.025);
      break;
  }
  return b.finish();
}

export function drawMoreFace(ctx, id, layer) {
  const dot=(x,y,r,color)=>{
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  };
  const star=(x,y,r,color)=>{
    ctx.fillStyle=color;ctx.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,v=i%2?r*.42:r;ctx.lineTo(x+Math.cos(a)*v,y+Math.sin(a)*v);}
    ctx.closePath();ctx.fill();
  };
  const heart=(x,y,r,color)=>{
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y+r);
    ctx.bezierCurveTo(x-r*1.7,y-r*.2,x-r*.7,y-r*1.35,x,y-r*.35);
    ctx.bezierCurveTo(x+r*.7,y-r*1.35,x+r*1.7,y-r*.2,x,y+r);ctx.fill();
  };
  const bloom=(x,y,color)=>{
    for(let i=0;i<6;i++){const a=i*Math.PI/3;dot(x+Math.cos(a)*10,y+Math.sin(a)*10,6,color);}
    dot(x,y,5,'#d8ae54');
  };
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  if(layer==='cheeks'){
    for(const side of [-1,1]){
      const x=256+side*146,y=298;
      switch(id){
        case 'peach':
          dot(x-7,y,12,'#eab18e');dot(x+7,y,12,'#eab18e');
          ctx.strokeStyle='#c47778';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x,y+12);ctx.stroke();break;
        case 'stars':star(x,y,15,'#dfbc62');star(x+side*19,y-17,7,'#d5e7ec');break;
        case 'sparkles':
          star(x-12,y+5,9,'#cde0e7');star(x+9,y-8,12,'#d7b3ce');dot(x+23,y+14,3,'#f6e1ad');break;
        case 'cherries':
          dot(x-7,y+5,7,'#cb536b');dot(x+8,y+8,7,'#d9687d');
          ctx.strokeStyle='#6d8e62';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-7,y);ctx.lineTo(x,y-16);ctx.lineTo(x+8,y+3);ctx.stroke();break;
        case 'snowflakes':
          ctx.strokeStyle='#acd2e8';ctx.lineWidth=3;
          for(let i=0;i<3;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*16,y-Math.sin(a)*16);ctx.lineTo(x+Math.cos(a)*16,y+Math.sin(a)*16);ctx.stroke();}
          dot(x,y,4,'#e8f6f8');break;
        case 'catpaws':
          ctx.fillStyle='#d18fa4';ctx.beginPath();ctx.ellipse(x,y+6,10,8,0,0,Math.PI*2);ctx.fill();
          for(let i=0;i<3;i++)dot(x-12+i*11,y-7-(i===1?4:0),4,'#d18fa4');break;
        case 'teardrop':
          ctx.fillStyle='#95c9dc';ctx.beginPath();ctx.moveTo(x,y-13);ctx.quadraticCurveTo(x-15,y+8,x,y+16);ctx.quadraticCurveTo(x+15,y+8,x,y-13);ctx.fill();dot(x-3,y+4,3,'#f1f8f9');break;
        case 'confetti':
          for(let i=0;i<7;i++){ctx.fillStyle=['#e6b36f','#c58cb2','#82ada5'][i%3];ctx.fillRect(x-20+i*6,y+(i%3)*7-9,4,8);}break;
      }
    }
  } else {
    if(['roundgold','squareglasses','pinkglasses','goggles'].includes(id)){
      const color={roundgold:'#c6a259',squareglasses:'#4b4854',pinkglasses:'#d58ca8',goggles:'#81664b'}[id];
      ctx.strokeStyle=color;ctx.lineWidth=id==='goggles'?11:6;
      for(const side of [-1,1]){
        const x=256+side*97;
        ctx.beginPath();
        if(id==='squareglasses'||id==='goggles')ctx.roundRect(x-42,206,84,70,13);
        else ctx.ellipse(x,242,42,39,0,0,Math.PI*2);
        ctx.fillStyle=id==='goggles'?'#759aab44':'#b6d4e11a';ctx.fill();ctx.stroke();
        ctx.strokeStyle='#ffffff77';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-21,222);ctx.lineTo(x-7,215);ctx.stroke();
        ctx.strokeStyle=color;ctx.lineWidth=id==='goggles'?11:6;
      }
      ctx.beginPath();ctx.moveTo(201,237);ctx.lineTo(311,237);ctx.stroke();
    }
    switch(id){
      case 'butterfly':
        for(const side of [-1,1]){
          ctx.fillStyle=side<0?'#c597c6aa':'#88b6ceaa';ctx.beginPath();
          ctx.ellipse(256+side*61,224,37,27,side*.4,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.ellipse(256+side*54,276,28,23,side*-.4,0,Math.PI*2);ctx.fill();
        }break;
      case 'crescent':
        ctx.strokeStyle='#dcb66a';ctx.lineWidth=8;ctx.beginPath();ctx.arc(112,288,18,.6,5.4);ctx.stroke();
        star(138,280,7,'#dcb66a');break;
      case 'constellation':
        ctx.strokeStyle='#bba6d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(95,289);ctx.lineTo(116,278);ctx.lineTo(131,310);ctx.lineTo(149,300);ctx.stroke();
        for(const [x,y] of [[95,289],[116,278],[131,310],[149,300]])star(x,y,5,'#d1b9e4');break;
      case 'noseband':
        ctx.fillStyle='#e5bf98';ctx.beginPath();ctx.roundRect(219,278,74,20,6);ctx.fill();
        for(let i=0;i<6;i++)dot(227+i*11,288,1.6,'#b78867');break;
      case 'heartpatch':
        heart(353,240,35,'#443047');heart(353,236,14,'#d49cb3');
        ctx.strokeStyle='#443047';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(83,170);ctx.lineTo(433,270);ctx.stroke();break;
      case 'flowerpaint':
        bloom(108,293,'#ddb1c7');bloom(392,296,'#aec7b6');break;
      case 'cyber':
        ctx.strokeStyle='#61b7c7';ctx.lineWidth=4;
        for(const side of [-1,1]){const x=256+side*145;ctx.beginPath();ctx.moveTo(x,245);ctx.lineTo(x,280);ctx.lineTo(x-side*20,298);ctx.stroke();dot(x-side*20,298,5,'#cbe9e5');}break;
      case 'lace':
        ctx.strokeStyle='#574050';ctx.lineWidth=3;
        for(const side of [-1,1]){
          const x=256+side*97;ctx.beginPath();ctx.ellipse(x,242,43,34,0,0,Math.PI*2);ctx.stroke();
          for(let i=0;i<9;i++){const a=Math.PI+i*Math.PI/8;ctx.beginPath();ctx.arc(x+Math.cos(a)*45,242+Math.sin(a)*37,6,0,Math.PI*2);ctx.stroke();}
        }break;
    }
  }
  ctx.restore();
}
