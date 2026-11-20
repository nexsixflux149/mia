export const MOUNTAIN_TRAIL=[{x:0,z:-40,y:0},{x:-22,z:-48,y:3},{x:22,z:-56,y:7},{x:-22,z:-64,y:11},{x:0,z:-73,y:16},{x:36,z:-84,y:16},{x:36,z:-87,y:16},{x:44,z:-97,y:25},{x:-12,z:-106,y:37},{x:0,z:-118,y:44}];
export const MOUNTAIN_SLOTS=Array.from({length:10},(_,i)=>({id:i+1,x:-34+i*68/9,z:-80,y:16}));
export function mountainSurface(x,z,margin=0){
 if(x>=-40-margin&&x<=40+margin&&z>=-87-margin&&z<=-73+margin)return 16;
 let result=null,best=Infinity;
 for(let i=1;i<MOUNTAIN_TRAIL.length;i++){
  const a=MOUNTAIN_TRAIL[i-1],b=MOUNTAIN_TRAIL[i],dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
  const distance=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
  if(distance<=2.8+margin&&distance<best){best=distance;result=a.y+(b.y-a.y)*t;}
 }return result;
}

export function mountainMoveAllowed(x,z,oldX,oldZ,baseRadius=45.6){
 const next=mountainSurface(x,z),previous=mountainSurface(oldX,oldZ);
 if(Math.hypot(x,z)>baseRadius&&next===null)return false;
 // No stepping off an elevated edge or teleporting onto a switchback above.
 return Math.abs((next??0)-(previous??0))<1;
}
