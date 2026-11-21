import assert from 'node:assert/strict';
import {MOUNTAIN_PATHS} from '../public/js/mountain-layout.js';
let checked=0;
for(const path of MOUNTAIN_PATHS){let previous;
 for(let i=0;i<path.length;i++){
  const p=path[i],a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z);
  const edges=[-1,1].map(side=>({x:p.x-(b.z-a.z)/length*2.8*side,z:p.z+(b.x-a.x)/length*2.8*side}));
  if(previous)for(let side=0;side<2;side++){const dx=edges[side].x-previous.edges[side].x,dz=edges[side].z-previous.edges[side].z;
   assert(dx*(p.x-previous.p.x)+dz*(p.z-previous.p.z)>=-1e-6,'inner railing folds into the path at '+i);
   assert(Math.hypot(dx,dz)<1.5,'edge has a disconnected jump');checked++;
  }previous={p,edges};
 }
}
console.log(`PASS: ${checked} road-edge segments, no reversed inner rails or protruding corner lights.`);
