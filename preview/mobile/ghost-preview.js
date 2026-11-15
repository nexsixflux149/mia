import * as THREE from 'three';
import {createGhost,animateGhost} from '/js/ghosts.js';
export function openGhostPreview(){
 if(document.getElementById('ghostLookPreview'))return;
 window.MIA_GHOST_PREVIEW=true;
 const wrap=document.createElement('div');wrap.id='ghostLookPreview';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
 wrap.style.cssText='position:fixed;inset:0;z-index:10000;background:#090f14ed;display:grid;place-items:center;padding:16px;color:#ebe8d7;font:14px/1.6 sans-serif';
 const card=document.createElement('section');card.style.cssText='width:min(430px,100%);background:#131c23;border:1px solid #58625d;border-radius:14px;padding:14px';
 const title=document.createElement('h2');title.textContent='귀신 외형 · 1차 시안';title.style.margin='0 0 8px';
 const desc=document.createElement('p');desc.textContent='눈빛·얼굴 음영·옷의 질감을 비교합니다. 첫 챕터에 추격 귀신을 추가하지는 않습니다.';
 const canvas=document.createElement('canvas');canvas.style.cssText='display:block;width:100%;height:min(55dvh,430px);touch-action:none';
 const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;margin-top:12px';
 const toggle=document.createElement('button');toggle.textContent='원래 모습 보기';toggle.dataset.ghostCompare='';
 const close=document.createElement('button');close.textContent='닫기';close.dataset.ghostClose='';
 for(const b of [toggle,close])b.style.cssText='border:1px solid #77827b;background:#28352f;color:#f5efdb;border-radius:8px;min-height:42px;padding:8px 14px';
 bar.append(toggle,close);card.append(title,desc,canvas,bar);wrap.append(card);document.body.append(wrap);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(1,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#10191d');scene.fog=new THREE.Fog('#10191d',4,10);
 const camera=new THREE.PerspectiveCamera(38,1,.1,20);camera.position.set(.05,1.45,3.6);camera.lookAt(0,1.25,0);
 scene.add(new THREE.HemisphereLight('#bccbc1','#212925',1.05));const key=new THREE.DirectionalLight('#d0dfce',1.1);key.position.set(-2,3,2);scene.add(key);const rim=new THREE.DirectionalLight('#54758a',.65);rim.position.set(2,2,-2);scene.add(rim);
 const ghost=createGhost('woman');scene.add(ghost);let enhanced=true;toggle.onclick=()=>{enhanced=!enhanced;ghost.userData.horrorDetail?.setEnabled(enhanced);toggle.textContent=enhanced?'원래 모습 보기':'강화 모습 보기';};
 const resize=()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();};resize();window.addEventListener('resize',resize);
 let frame,previous=performance.now(),alive=true;const clock=new THREE.Clock();
 const loop=()=>{if(!alive)return;frame=requestAnimationFrame(loop);const now=performance.now(),dt=Math.min(.05,(now-previous)/1000);previous=now;const t=clock.getElapsedTime();animateGhost(ghost,dt,t,{mode:'wander',lit:false},5);ghost.rotation.y=Math.sin(t*.24)*.22;renderer.render(scene,camera);};loop();
 const end=()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('keydown',escape);renderer.dispose();renderer.forceContextLoss();wrap.remove();window.MIA_GHOST_PREVIEW=false;};
 const escape=e=>{if(e.key==='Escape')end();};window.addEventListener('keydown',escape);close.onclick=end;
}
