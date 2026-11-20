import assert from 'node:assert/strict';
import {createLobbySanta} from '../server/lobby-santa.js';
const a={id:'a',x:40,z:0,ry:0,room:'lobby'},b={id:'b',x:39,z:0,ry:0,room:'lobby'};
const s=createLobbySanta();s.update(.1,[a,b],1000);assert.equal(s.state.target,'a');
s.update(.1,[a,b],300999);assert.equal(s.state.target,'a');
s.update(.1,[a,b],301001);assert.equal(s.state.target,'b');
s.update(.1,[],301100);assert.ok(['return','patrol'].includes(s.state.mode));assert.equal(s.state.target,'');
for(let i=0;i<1000;i++)s.update(.1,[],302000+i*100);
assert.ok(Number.isFinite(s.state.x));console.log('PASS santa patrol, follow for five minutes, switch target and return to patrol.');

const patrol=createLobbySanta(); for(let i=0;i<12000;i++){patrol.update(.1,[],i*100);assert.ok(Math.abs(Math.hypot(patrol.state.x,patrol.state.z)-41.28)<.001);} console.log('PASS: 20 minutes of patrol stays exactly on outer walkway radius41.28.');
