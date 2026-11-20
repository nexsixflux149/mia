import assert from 'node:assert/strict';
import {createLobbySanta} from '../server/lobby-santa.js';
const players=Array.from({length:11},(_,i)=>({id:'p'+i,x:41-i*.02,z:0,ry:0,room:'lobby'}));
const santa=createLobbySanta();let now=1000;
santa.update(.1,players,now);assert.equal(santa.state.target,'p0');
santa.update(.1,players,30999);assert.equal(santa.state.target,'p0');
const seen=new Set(['p0']);
for(let i=1;i<10;i++){
 now=1000+i*30000;santa.update(.1,players,now);
 assert.ok(santa.state.target);assert.ok(!seen.has(santa.state.target));seen.add(santa.state.target);
}
assert.equal(seen.size,10);
santa.update(.1,players,301000);assert.equal(santa.state.target,'');
let steps=0;
while(santa.state.mode!=='patrol'&&steps++<2000){now=301000+steps*100;santa.update(.1,players,now);assert.equal(santa.state.target,'');}
assert.ok(steps<2000);assert.ok(Math.abs(Math.hypot(santa.state.x,santa.state.z)-41.28)<.001);
santa.update(.1,players,now+100);assert.ok(santa.state.target,'starts new round when someone is near');
const single=createLobbySanta();single.update(.1,[players[0]],1000);single.update(.1,[players[0]],31000);assert.equal(single.state.target,'');
single.update(.1,[],31100);assert.equal(single.state.target,'');
const patrol=createLobbySanta();for(let i=0;i<12000;i++){patrol.update(.1,[],i*100);assert.ok(Math.abs(Math.hypot(patrol.state.x,patrol.state.z)-41.28)<.001);}
console.log('PASS: 30 second boundary, 10 distinct targets, forced walkway return before reacquiring, insufficient targets return, empty lobby, 20 minute walkway patrol.');
