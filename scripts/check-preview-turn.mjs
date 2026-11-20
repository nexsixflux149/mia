import assert from 'node:assert/strict';
import {bindPreviewTurn} from '../public/js/preview-turn.js';
class Canvas extends EventTarget{
 style={};attrs={};setAttribute(k,v){this.attrs[k]=v;}setPointerCapture(){}
 getBoundingClientRect(){return {width:300};}
 pointer(type,x,id=1,pointerType='mouse'){
  const event=new Event(type,{cancelable:true});Object.assign(event,{clientX:x,pointerId:id,pointerType,button:0});this.dispatchEvent(event);
 }
}
const canvas=new Canvas();let rotation=0;bindPreviewTurn(canvas,delta=>rotation+=delta);
canvas.pointer('pointerdown',0);canvas.pointer('pointermove',150);canvas.pointer('pointerup',150);
assert.ok(Math.abs(rotation-Math.PI*1.15)<.001);
canvas.pointer('pointermove',250);assert.ok(Math.abs(rotation-Math.PI*1.15)<.001);
canvas.pointer('pointerdown',150,2,'touch');canvas.pointer('pointermove',0,2,'touch');canvas.pointer('pointercancel',0,2,'touch');assert.ok(Math.abs(rotation)<.001);
canvas.pointer('pointermove',200,2,'touch');assert.ok(Math.abs(rotation)<.001);
canvas.pointer('pointerdown',0,3);canvas.pointer('pointermove',100,4,'touch');assert.ok(Math.abs(rotation)<.001);
canvas.pointer('lostpointercapture',0,3);canvas.pointer('pointermove',100,3);assert.ok(Math.abs(rotation)<.001);
assert.equal(canvas.style.touchAction,'none');assert.equal(canvas.style.cursor,'grab');
console.log('PASS: desktop/touch rotation sensitivity, no movement after release or cancel, ignores second pointer, handles lost capture.');
