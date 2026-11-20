// Server-authoritative, harmless lobby visitor. No damage or theme entry.
export function createLobbySanta() {
  const s={x:36,z:0,ry:0,target:'',until:0,mode:'patrol'};let angle=0,excluded='',cooldown=0;
  return {state:s,update(dt,players,now=Date.now()){
    const list=players.filter(p=>p.room==='lobby'&&!p.offline);
    let target=list.find(p=>p.id===s.target);
    if(!target || now>=s.until){
      if(target){excluded=target.id;cooldown=now+300000;}
      target=list.filter(p=>!(p.id===excluded&&now<cooldown)&&Math.hypot(p.x-s.x,p.z-s.z)<22).sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0];
      s.target=target?.id||'';s.until=target?now+300000:0;
    }
    let x,z,speed;
    if(target){x=target.x-Math.sin(target.ry)*1.8;z=target.z-Math.cos(target.ry)*1.8;speed=6;s.mode='follow';}
    else{angle+=dt*.055;x=Math.cos(angle)*36;z=Math.sin(angle)*36;speed=1.4;s.mode='patrol';}
    const dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),step=Math.min(d,speed*dt);
    if(d>.06){s.x+=dx/d*step;s.z+=dz/d*step;s.ry=Math.atan2(dx,dz);}
    else if(target)s.ry=target.ry;
    return s;
  }};
}
