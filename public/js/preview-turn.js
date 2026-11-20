// A full-width swipe makes just over one turn, consistently on desktop and mobile.
export function bindPreviewTurn(canvas,onTurn){
 let pointer=null,lastX=0;
 canvas.style.touchAction='none';canvas.style.cursor='grab';
 canvas.setAttribute('aria-label','마우스나 손가락으로 드래그해서 캐릭터 회전');
 canvas.addEventListener('pointerdown',event=>{
  if(pointer!==null || (event.pointerType==='mouse' && event.button!==0))return;
  pointer=event.pointerId;lastX=event.clientX;canvas.style.cursor='grabbing';
  try{canvas.setPointerCapture(pointer);}catch{}
  event.preventDefault();
 });
 canvas.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointer)return;
  const width=Math.max(120,canvas.getBoundingClientRect().width);
  onTurn((event.clientX-lastX)/width*Math.PI*2*1.15);lastX=event.clientX;event.preventDefault();
 });
 const end=event=>{if(event.pointerId!==pointer)return;pointer=null;canvas.style.cursor='grab';};
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
}
