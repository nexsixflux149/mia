// Server-authoritative, harmless lobby visitor. No damage or theme entry.
export function createLobbySanta() {
  // World outer walkway spans radii 24.6*1.6 to 27*1.6; use its exact center.
  const radius=(24.6+27)/2*1.6,walkSpeed=1.4;
  const s={x:radius,z:0,ry:0,target:'',until:0,mode:'patrol'};let angle=0,returning=false;const visited=new Set();
  return {state:s,update(dt,players,now=Date.now()){
    const list=players.filter(p=>p.room==='lobby'&&!p.offline);
    let target=returning?null:list.find(p=>p.id===s.target);
    if(!returning && (!target || now>=s.until)){
      target=visited.size>=10?null:list.filter(p=>!visited.has(p.id)&&Math.hypot(p.x-s.x,p.z-s.z)<10).sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0];
      if(target){visited.add(target.id);s.target=target.id;s.until=now+30000;}
      else{s.target='';s.until=0;if(visited.size)returning=true;}
    }
    let x,z,speed;
    if(target){x=target.x-Math.sin(target.ry)*1.8;z=target.z-Math.cos(target.ry)*1.8;speed=6;s.mode='follow';}
    else{
      const r=Math.hypot(s.x,s.z);
      if(s.mode==='follow'||s.mode==='return')angle=Math.atan2(s.z,s.x);
      if(Math.abs(r-radius)>.02){x=Math.cos(angle)*radius;z=Math.sin(angle)*radius;speed=walkSpeed;s.mode='return';}
      else{angle+=walkSpeed/radius*dt;s.x=Math.cos(angle)*radius;s.z=Math.sin(angle)*radius;s.ry=Math.atan2(-Math.sin(angle),Math.cos(angle));s.mode='patrol';if(returning){returning=false;visited.clear();}return s;}
    }
    const dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),step=Math.min(d,speed*dt);
    if(d>.001){s.x+=dx/d*step;s.z+=dz/d*step;s.ry=Math.atan2(dx,dz);}
    else if(target)s.ry=target.ry;
    return s;
  }};
}
