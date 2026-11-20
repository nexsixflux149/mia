import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {MOUNTAIN_TRAIL,MOUNTAIN_SLOTS,mountainSurface,mountainMoveAllowed} from '../public/js/mountain-layout.js';
import {teammateLight,remotePoseInterval} from '../public/js/multiplayer-budget.js';
assert.equal(MOUNTAIN_SLOTS.length,10);
for(const p of MOUNTAIN_SLOTS)assert.equal(mountainSurface(p.x,p.z),16);
for(let i=1;i<MOUNTAIN_TRAIL.length;i++){
 const a=MOUNTAIN_TRAIL[i-1],b=MOUNTAIN_TRAIL[i];let previous=a;
 for(let j=1;j<=200;j++){const t=j/200,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};assert(mountainMoveAllowed(p.x,p.z,previous.x,previous.z),`blocked segment ${i} step ${j}`);previous=p;}
}
assert(!mountainMoveAllowed(0,-90,0,-80));assert(!mountainMoveAllowed(70,-100,0,-80));
const source=readFileSync(new URL('../public/js/main.js',import.meta.url),'utf8');
const update=source.slice(source.indexOf('function updateOthers('),source.indexOf('// ─────────────────────────── 미니맵'));
const setLight=source.slice(source.indexOf('function setLight('),source.indexOf('\n',source.indexOf('function setLight(')));
const S={room:'game',others:new Map(),ghosts:new Map()},me={x:0,z:0};
for(let i=1;i<=3;i++){const g=new THREE.Group();g.userData={id:String(i),target:{x:i,z:0,ry:0,light:true,anim:1},spot:{},beam:{}};S.others.set(String(i),g);}
const camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.set(0,3,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
let poses=0;
const context={S,me,THREE,camera,myAvatar:null,teammateLight,remotePoseInterval,wrapAng:a=>a,animateAvatar:()=>poses++,applyGear:()=>{},animateGear:()=>{},crowdFrustum:new THREE.Frustum(),crowdMatrix:new THREE.Matrix4(),crowdBounds:new THREE.Sphere()};
vm.createContext(context);vm.runInContext(setLight+'\n'+update,context);
vm.runInContext('updateOthers(1/60,0)',context);
assert(S.others.get('1').position.x>0,'movement must interpolate even on a skipped pose frame');assert.equal(poses,0);
for(let frame=1;frame<120;frame++)context.updateOthers(1/60,frame/60);
assert.equal(poses,180,'three teammates should update poses 30Hz over two seconds');
assert.equal([...S.others.values()].filter(g=>g.userData.spot.visible).length,1);
S.others.get('1').userData.target.light=false;context.updateOthers(1/60,2.1);assert.equal(S.otherLightId,'2');
S.room='lobby';context.updateOthers(1/60,2.2);assert.equal([...S.others.values()].filter(g=>g.userData.spot.visible).length,0);
console.log('PASS: actual 4-player update loop: 180 vs 360 articulated pose updates at 60Hz, continuous movement, maximum one teammate spotlight; all mountain paths and ten slots connected.');

// Exercise the production movement/collision code rather than only its height helper.
Object.assign(context,{mountainMoveAllowed,keys:{},typing:()=>false,loginOpen:()=>false,updateStatus:()=>{},audio:{step:()=>{}},EMOTE_DUR:{},cam:{yaw:0},myAvatar:new THREE.Group()});
Object.assign(S,{room:'lobby',world:{mountain:{heightAt:mountainSurface},colliders:[],bounds:45.6},em:'',run:false,sneak:false});
Object.assign(me,{x:0,z:-40,y:0,ry:0});
vm.runInContext(source.slice(source.indexOf('const R = 0.32'),source.indexOf('let sendT =')),context);
for(const target of [...MOUNTAIN_TRAIL.slice(1),...MOUNTAIN_TRAIL.slice(0,-1).reverse()]){
 S.moveTarget=target;let frames=0;while(S.moveTarget&&frames++<1400)context.updateMove(1/60);
 assert(frames<1400,'production movement stuck');assert(Math.hypot(me.x-target.x,me.z-target.z)<.2);assert(Math.abs(me.y-target.y)<.15);
}
console.log('PASS: production movement climbs to summit and descends without teleporting or radial clamping.');

