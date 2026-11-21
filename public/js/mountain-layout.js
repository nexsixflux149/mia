export const TERRACE={minX:-40,maxX:40,minZ:-90,maxZ:-76,y:16};
export const SUMMIT={minX:-14,maxX:14,minZ:-136,maxZ:-116,y:44};
export const LOBBY_GROUND={minX:-82,maxX:82,minZ:-42,maxZ:76};
export const MOUNTAIN_TRAIL=[{x:0,z:-27,y:0},{x:0,z:-39,y:0},{x:-22,z:-49,y:3},{x:22,z:-59,y:7},{x:-22,z:-69,y:11},{x:0,z:-76,y:16},{x:36,z:-90,y:16},{x:44,z:-100,y:25},{x:-12,z:-110,y:37},{x:0,z:-116,y:44}];
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function rounded(nodes){
 const points=[nodes[0]];
 const line=end=>{const a=points.at(-1),n=Math.max(1,Math.ceil(Math.hypot(end.x-a.x,end.z-a.z)/.7));for(let i=1;i<=n;i++)points.push(mix(a,end,i/n));};
 for(let i=1;i<nodes.length-1;i++){
  const a=nodes[i-1],b=nodes[i],c=nodes[i+1],incoming=Math.hypot(b.x-a.x,b.z-a.z),outgoing=Math.hypot(c.x-b.x,c.z-b.z);
  const ux=(b.x-a.x)/incoming,uz=(b.z-a.z)/incoming,vx=(c.x-b.x)/outgoing,vz=(c.z-b.z)/outgoing;
  const turn=Math.acos(Math.max(-1,Math.min(1,ux*vx+uz*vz)));
  if(turn<1e-5){line(b);continue;}
  // The 2.8m edge offset must fit inside the turn, otherwise the inner rail folds backwards.
  const tangent=Math.tan(turn/2),cut=Math.min(3.6*tangent,incoming*(i===1?.9:.49),outgoing*(i===nodes.length-2?.9:.49)),radius=cut/tangent;
  const entry=mix(b,a,cut/incoming),exit=mix(b,c,cut/outgoing),sign=Math.sign(ux*vz-uz*vx);
  const cx=entry.x-uz*sign*radius,cz=entry.z+ux*sign*radius,start=Math.atan2(entry.z-cz,entry.x-cx),steps=Math.max(12,Math.ceil(radius*turn/.3));
  line(entry);
  for(let k=1;k<=steps;k++){const t=k/steps,angle=start+sign*turn*t;points.push({x:cx+Math.cos(angle)*radius,z:cz+Math.sin(angle)*radius,y:entry.y+(exit.y-entry.y)*t});}
 }
 line(nodes.at(-1));return points;
}
export const MOUNTAIN_PATHS=[rounded(MOUNTAIN_TRAIL.slice(0,6)),rounded(MOUNTAIN_TRAIL.slice(6))];
export const MOUNTAIN_SLOTS=Array.from({length:10},(_,i)=>({id:i+1,x:-34+i*68/9,z:-86,y:16}));
export function inArea(x,z,a,margin=0){return x>=a.minX-margin&&x<=a.maxX+margin&&z>=a.minZ-margin&&z<=a.maxZ+margin;}
export function nearestTrail(x,z){let best=Infinity,height=0,px=x,pz=z;for(const path of MOUNTAIN_PATHS)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(d<best){best=d;height=a.y+(b.y-a.y)*t;px=a.x+dx*t;pz=a.z+dz*t;}}return {distance:best,height,x:px,z:pz};}
export function mountainSurface(x,z,margin=0){
 if(inArea(x,z,TERRACE,margin))return TERRACE.y;if(inArea(x,z,SUMMIT,margin))return SUMMIT.y;
 const q=nearestTrail(x,z);return q.distance<=2.4+margin?q.height:null;
}
export function mountainGroundHeight(x,z){
 const ridge=Math.max(0,1-Math.abs(x)/88),depth=Math.max(0,Math.min(1,(-z-38)/70));
 const crown=31*Math.exp(-((x+15)**2/420+(z+113)**2/190))+27*Math.exp(-((x-32)**2/230+(z+114)**2/200));
 let y=Math.max(0,depth*ridge*24+crown+(Math.sin(x*.28+z*.13)*3+Math.sin(x*.71-z*.21)*1.2)*depth);
 let {distance,height}=nearestTrail(x,z);
 for(const a of [TERRACE,SUMMIT]){const d=Math.hypot(Math.max(a.minX-x,x-a.maxX,0),Math.max(a.minZ-z,z-a.maxZ,0));if(d<distance){distance=d;height=a.y;}}
 const blend=Math.max(0,Math.min(1,(distance-3.5)/8));return Math.max(0,(height-.18)*(1-blend)+y*blend);
}
export function mountainMoveAllowed(x,z,oldX,oldZ){
 const next=mountainSurface(x,z),previous=mountainSurface(oldX,oldZ);
 if(!inArea(x,z,LOBBY_GROUND)&&next===null)return false;
 return Math.abs((next??0)-(previous??0))<1;
}

// A saved lobby position can become invalid after the trail is reshaped.
export function lobbyRecoveryPoint(x,z){
 if(inArea(x,z,LOBBY_GROUND)||mountainSurface(x,z)!==null)return null;
 const nearest=nearestTrail(x,z),candidates=[{x:nearest.x,z:nearest.z,y:nearest.height}];
 for(const a of [LOBBY_GROUND,TERRACE,SUMMIT])candidates.push({x:Math.max(a.minX+.5,Math.min(x,a.maxX-.5)),z:Math.max(a.minZ+.5,Math.min(z,a.maxZ-.5)),y:a.y??0});
 candidates.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
 return candidates[0];
}
