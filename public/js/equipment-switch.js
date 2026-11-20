export function equipmentSwitch(name,on){
 const button=document.createElement('button');button.type='button';button.className='equipment-switch';
 button.setAttribute('role','switch');button.setAttribute('aria-checked',String(!!on));
 button.setAttribute('aria-label',`${name} 착용`);
 const track=document.createElement('span');track.className='equipment-switch-track';track.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.textContent=on?'착용':'해제';button.append(track,label);
 return button;
}
