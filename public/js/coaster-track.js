import * as T from 'three';
export function createCoasterTrack(){
 const v=(x,y,z)=>new T.Vector3(x,y,z),controls=[v(0,8,36),v(26,9,25),v(36,8,0),v(34,9,-25),v(53,12,-42),v(62,12,-54)];
 // A slightly advancing vertical loop keeps the entry and exit rails separate.
 for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;controls.push(v(62+i/80*2,12+8*(1-Math.cos(a)),-64-8*Math.sin(a)));}
 controls.push(v(64,15,-78),v(59,42,-98),v(30,62,-119),v(0,66,-142),v(-35,52,-120),v(-61,32,-88),v(-48,14,-48),v(-34,8,-26),v(-36,6,0),v(-25,7,26));
 const curve=new T.CatmullRomCurve3(controls,true,'centripetal'),points=curve.getSpacedPoints(1200);points.pop();const count=points.length,cum=[0],frames=[],times=[0],up=v(0,1,0),previous=new T.Vector3();
 let maxY=0;for(const p of points)maxY=Math.max(maxY,p.y);
 for(let i=0;i<count;i++){
  const p=points[i],next=points[(i+1)%count],t=next.clone().sub(p).normalize();
  if(i)up.applyQuaternion(new T.Quaternion().setFromUnitVectors(previous,t));
  const right=new T.Vector3().crossVectors(up,t).normalize();up.crossVectors(t,right).normalize();
  frames.push(new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,t)));previous.copy(t);
  const d=p.distanceTo(next);cum.push(cum.at(-1)+d);
  const speed=Math.sqrt(16+2*4.2*(maxY-(p.y+next.y)/2));times.push(times.at(-1)+d/speed);
 }
 const length=cum.at(-1),lap=times.at(-1);
 const index=(arr,value)=>{let lo=0,hi=count;while(hi-lo>1){const m=(lo+hi)>>1;if(arr[m]<=value)lo=m;else hi=m;}return lo;};
 function at(s){s=((s%length)+length)%length;const i=index(cum,s),f=(s-cum[i])/(cum[i+1]-cum[i]);const p=points[i].clone().lerp(points[(i+1)%count],f),q=frames[i].clone().slerp(frames[(i+1)%count],f);return {p,q,t:v(0,0,1).applyQuaternion(q),up:v(0,1,0).applyQuaternion(q),right:v(1,0,0).applyQuaternion(q)};}
 function frontS(seconds=Date.now()/1000){const t=((seconds%lap)+lap)%lap,i=index(times,t);return cum[i]+(cum[i+1]-cum[i])*(t-times[i])/(times[i+1]-times[i]);}
 return {points,frames,cum,length,lap,at,frontS};
}
