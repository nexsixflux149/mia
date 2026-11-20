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
 for(let i=0;i<16;i++){const a=i/16*Math.PI;add(new T.SphereGeometry(.11,10,8),fur,Math.cos(a)*.27,-.15-Math.sin(a)*.26,.24,head);}
 add(new T.ConeGeometry(.44,.64,20),red,0,.49,-.03,head).rotation.z=-.3;
 add(new T.TorusGeometry(.36,.075,8,24),fur,0,.22,0,head).rotation.x=Math.PI/2;
 const legs=[],arms=[];
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.35,1,0);body.add(leg);add(new T.CapsuleGeometry(.22,.5,6,12),black,0,-.3,0,leg);add(new T.BoxGeometry(.46,.3,.67),black,0,-.83,.12,leg);legs.push(leg);
 const arm=new T.Group();arm.position.set(side*.73,2.25,0);body.add(arm);add(new T.CapsuleGeometry(.22,.72,6,14),red,0,-.43,.05,arm);add(new T.SphereGeometry(.22,12,10),black,0,-.97,.10,arm);arms.push(arm);}
 const axe=new T.Group();arms[0].add(axe);axe.position.set(0,-.98,.1);axe.rotation.z=.2;
 add(new T.CylinderGeometry(.045,.055,1.6,10),mat('#503322'),0,-.15,0,axe);
 add(new T.BoxGeometry(.65,.36,.09),steel,-.24,-.72,0,axe);
 add(new T.BoxGeometry(.12,.35,.095),blood,-.53,-.72,0,axe);
 const sack=new T.Group();root.add(sack);sack.position.set(.95,.42,-.9);
 add(new T.SphereGeometry(.48,20,14),red,0,0,0,sack).scale.set(1, .8,1.5);
 for(let i=0;i<12;i++)add(new T.SphereGeometry(.06+(i%3)*.03,8,6),blood,Math.sin(i*5)*.35,.13+Math.cos(i)*.15,Math.cos(i*2)*.52,sack);
 const cord=new T.Mesh(new T.CylinderGeometry(.025,.025,1.2,8),fur);cord.position.set(.85,.9,-.5);cord.rotation.x=.85;root.add(cord);
 return {root,update(t,moving){legs.forEach((l,i)=>l.rotation.x=Math.sin(t*3+i*Math.PI)*(moving?.34:.02));arms[0].rotation.x=Math.sin(t*3)*.08;arms[1].rotation.x=.28;body.position.y=moving?Math.abs(Math.sin(t*3))*.04:0;}};
}
