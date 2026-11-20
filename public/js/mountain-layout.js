export const TERRACE={minX:-40,maxX:40,minZ:-90,maxZ:-76,y:16};
export const SUMMIT={minX:-14,maxX:14,minZ:-136,maxZ:-116,y:44};
export const LOBBY_GROUND={minX:-82,maxX:82,minZ:-42,maxZ:76};
export const MOUNTAIN_TRAIL=[{x:0,z:-27,y:0},{x:0,z:-39,y:0},{x:-22,z:-49,y:3},{x:22,z:-59,y:7},{x:-22,z:-69,y:11},{x:0,z:-76,y:16},{x:36,z:-90,y:16},{x:44,z:-100,y:25},{x:-12,z:-110,y:37},{x:0,z:-116,y:44}];
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function rounded(nodes){
 const points=[nodes[0]];
 const line=end=>{const a=points.at(-1),n=Math.max(1,Math.ceil(Math.hypot(end.x-a.x,end.z-a.z)/.7));for(let i=1;i<=n;i++)points.push(mix(a,end,i/n));};
 for(let i=1;i<nodes.length-1;i++){const a=nodes[i-1],b=nodes[i],c=nodes[i+1],cut=Math.min(4,Math.hypot(b.x-a.x,b.z-a.z)*.25,Math.hypot(c.x-b.x,c.z-b.z)*.25),entry=mix(b,a,cut/Math.hypot(b.x-a.x,b.z-a.z)),exit=mix(b,c,cut/Math.hypot(c.x-b.x,c.z-b.z));line(entry);for(let k=1;k<=16;k++){const t=k/16;points.push(mix(mix(entry,b,t),mix(b,exit,t),t));}}
 line(nodes.at(-1));return points;
}
export const MOUNTAIN_PATHS=[rounded(MOUNTAIN_TRAIL.slice(0,6)),rounded(MOUNTAIN_TRAIL.slice(6))];
export const MOUNTAIN_SLOTS=Array.from({length:10},(_,i)=>({id:i+1,x:-34+i*68/9,z:-86,y:16}));
export function inArea(x,z,a,margin=0){return x>=a.minX-margin&&x<=a.maxX+margin&&z>=a.minZ-margin&&z<=a.maxZ+margin;}
export function nearestTrail(x,z){let best=Infinity,height=0;for(const path of MOUNTAIN_PATHS)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(d<best){best=d;height=a.y+(b.y-a.y)*t;}}return {distance:best,height};}
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
