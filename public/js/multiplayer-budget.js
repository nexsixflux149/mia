// Keep at most one teammate spotlight; retain it until out of range to avoid shader churn.
export function teammateLight(others,x,z,current){
 const eligible=p=>p?.light&&Math.hypot(p.x-x,p.z-z)<16;
 if(eligible(others.get(current)?.userData.target))return current;
 let id=null,best=14;for(const [key,g] of others){const p=g.userData.target;if(!eligible(p))continue;const d=Math.hypot(p.x-x,p.z-z);if(d<best){best=d;id=key;}}return id;
}
export function remotePoseInterval(visible,distance){return visible?(distance<12?1/30:1/15):1/8;}
