import * as T from 'three';
export function lobbySantaVisual(){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const mat=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:.83,...o});
 const red=mat('#620b13'),fur=mat('#baa68a'),black=mat('#14100f'),skin=mat('#857e68'),blood=mat('#400309'),steel=mat('#777d79',{metalness:.75,roughness:.4});
 const add=(geo,m,x,y,z,parent=body)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 add(new T.CapsuleGeometry(.65,1.1,8,18),red,0,1.8,0).rotation.x=.15;
 add(new T.BoxGeometry(1.31,.18,.88),black,0,1.43,.03);
 add(new T.BoxGeometry(.23,.19,.07),steel,0,1.43,.51);
 const head=new T.Group();head.position.set(0,2.9,.30);head.rotation.x=.22;body.add(head);
 add(new T.SphereGeometry(.38,20,16),skin,0,0,0,head);
 for(const x of [-.13,.13]){add(new T.SphereGeometry(.085,12,8),black,x,.045,.33,head);add(new T.SphereGeometry(.025,10,8),mat('#a51c0e',{emissive:'#e32410',emissiveIntensity:1}),x,.045,.40,head);}
 const ivory=mat('#e2d9ba'),shadowFur=mat('#9b9079');
 // Beard projects in front of the coat instead of disappearing inside its chest.
 const beard=add(new T.SphereGeometry(1,24,18),ivory,0,-.48,.42,head);beard.scale.set(.31,.36,.15);
 for(let row=0;row<8;row++)for(let j=0;j<7;j++){
   const x=(j-3)*.075*(1-row*.065), y=-.20-row*.075;
   const lock=add(new T.CapsuleGeometry(.025,.10,4,8),(row+j)%4?ivory:fur,x,y,.44+.15*Math.sqrt(Math.max(.02,1-(x/.33)**2-((y+.48)/.40)**2)),head);
   lock.rotation.z=(j-3)*-.10;lock.rotation.x=.16;
 }
 for(const side of [-1,1]){
   const moustache=add(new T.CapsuleGeometry(.064,.17,6,12),ivory,side*.12,-.10,.47,head);moustache.rotation.z=side*1.05;
   const brow=add(new T.CapsuleGeometry(.035,.13,4,10),shadowFur,side*.14,.14,.36,head);brow.rotation.z=side*.95;
 }
 add(new T.SphereGeometry(.075,14,10),skin,0,-.015,.43,head);
 const seam=mat('#8c3f38');
 for(let i=0;i<22;i++){
   const a=i/22*Math.PI*2;
   add(new T.SphereGeometry(.085,10,8),fur,Math.cos(a)*.57,1.03,Math.sin(a)*.43);
 }
 for(let i=0;i<12;i++){
   add(new T.SphereGeometry(.062,10,8),ivory,0,1.55+i*.074,.63);
   for(const side of [-1,1])add(new T.BoxGeometry(.014,.035,.018),seam,side*.25,1.62+i*.061,.60);
 }
 for(const side of [-1,1]){
   const pocket=add(new T.BoxGeometry(.29,.24,.05),red,side*.37,1.3,.49);pocket.rotation.z=side*.15;
   add(new T.TorusGeometry(.15,.018,6,16),black,side*.35,.28,.26).rotation.x=Math.PI/2;
 }

 add(new T.ConeGeometry(.44,.64,20),red,0,.49,-.03,head).rotation.z=-.3;
 add(new T.TorusGeometry(.36,.075,8,24),fur,0,.22,0,head).rotation.x=Math.PI/2;
 const legs=[],arms=[];
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.35,1,0);body.add(leg);add(new T.CapsuleGeometry(.22,.5,6,12),black,0,-.3,0,leg);add(new T.BoxGeometry(.46,.3,.67),black,0,-.83,.12,leg);legs.push(leg);
 const arm=new T.Group();arm.position.set(side*.73,2.25,0);body.add(arm);add(new T.CapsuleGeometry(.22,.72,6,14),red,0,-.43,.05,arm);add(new T.SphereGeometry(.22,12,10),black,0,-.97,.10,arm);arms.push(arm);}
 const axe=new T.Group();arms[0].add(axe);axe.position.set(0,-.98,.1);axe.rotation.z=.2;
 add(new T.CylinderGeometry(.045,.055,1.6,10),mat('#503322'),0,-.15,0,axe);
 const bladeShape=new T.Shape();bladeShape.moveTo(.04,.18);bladeShape.lineTo(-.22,.25);bladeShape.quadraticCurveTo(-.67,.37,-.66,.05);bladeShape.lineTo(-.60,-.30);bladeShape.quadraticCurveTo(-.3,-.27,.04,-.15);bladeShape.closePath();
 add(new T.ExtrudeGeometry(bladeShape,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.015,bevelSegments:2,steps:1}),steel,0,-.72,-.04,axe);
 for(let i=0;i<8;i++){const wrap=add(new T.TorusGeometry(.056,.012,5,10),black,0,.12+i*.075,0,axe);wrap.rotation.x=Math.PI/2;}

 add(new T.BoxGeometry(.12,.35,.095),blood,-.53,-.72,0,axe);
 const sack=new T.Group();root.add(sack);sack.position.set(.95,.42,-.9);
 add(new T.SphereGeometry(.48,20,14),red,0,0,0,sack).scale.set(1, .8,1.5);
 for(let i=0;i<12;i++)add(new T.SphereGeometry(.06+(i%3)*.03,8,6),blood,Math.sin(i*5)*.35,.13+Math.cos(i)*.15,Math.cos(i*2)*.52,sack);
 for(let i=0;i<16;i++){
   const angle=i/16*Math.PI*2;
   const fold=add(new T.CapsuleGeometry(.018,.45,4,8),i%3?red:blood,Math.sin(angle)*.42,.02,Math.cos(angle)*.60,sack);fold.rotation.z=Math.sin(angle)*.5;
 }
 add(new T.TorusGeometry(.11,.035,6,14),fur,0,.38,-.34,sack).rotation.x=Math.PI/2;
 const cord=new T.Mesh(new T.CylinderGeometry(.025,.025,1.2,8),fur);cord.position.set(.85,.9,-.5);cord.rotation.x=.85;root.add(cord);
 return {root,update(t,moving){legs.forEach((l,i)=>l.rotation.x=Math.sin(t*3+i*Math.PI)*(moving?.34:.02));arms[0].rotation.x=Math.sin(t*3)*.08;arms[1].rotation.x=.28;body.position.y=moving?Math.abs(Math.sin(t*3))*.04:0;}};
}
