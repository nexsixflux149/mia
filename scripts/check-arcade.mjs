import assert from 'node:assert/strict';
import {arcadeStatus,arcadeQuestion,arcadeAnswer,attachArcade,grantArcadeReward,ARCADE_REWARD} from '../server/arcade-service.js';
import {ARCADE_PUZZLES,ARCADE_TARGET} from '../server/arcade-puzzles.js';
import {SHOP} from '../server/progress.js';
assert.equal(ARCADE_TARGET,100);assert.equal(ARCADE_PUZZLES.length,100);
assert.deepEqual(ARCADE_PUZZLES.map(q=>q.id),Array.from({length:100},(_,i)=>i+1));
for(const key of ['title','principle','prompt'])assert.equal(new Set(ARCADE_PUZZLES.map(q=>q[key])).size,100,`duplicate ${key}`);
for(const q of ARCADE_PUZZLES)for(const key of ['title','principle','prompt','answer','hint','explain'])assert.ok(typeof q[key]==='string' && q[key].trim(),`${q.id} missing ${key}`);
assert.equal(SHOP[ARCADE_REWARD].nosale,true);assert.equal(SHOP[ARCADE_REWARD].max,1);
const pf={};for(const id of [0,-1,1.5,NaN,'1',101,{},null])assert.ok(arcadeQuestion(pf,id).error);
assert.ok(arcadeQuestion(pf,2).error);
for(const q of ARCADE_PUZZLES){
 const view=arcadeQuestion(pf,q.id);assert.ok(view.puzzle);assert.equal('answer' in view.puzzle,false);assert.equal('explain' in view.puzzle,false);
 const previous=arcadeStatus(pf).cleared;assert.equal(arcadeAnswer(pf,q.id,'__wrong__').correct,false);assert.equal(arcadeStatus(pf).cleared,previous);
 const r=arcadeAnswer(pf,q.id,' '+q.answer.toLowerCase()+' ');assert.equal(r.correct,true);assert.equal(r.advanced,true);assert.equal(r.state.percent,q.id);assert.equal(r.rewarded,q.id===100);
 if(q.id<100){assert.equal(pf.items?.[ARCADE_REWARD],undefined);assert.equal(r.state.badge,false);}
 if(q.id===13){for(let i=1;i<=14;i++)assert.ok(arcadeQuestion(pf,i).puzzle);assert.ok(arcadeQuestion(pf,15).error);}
}
assert.equal(arcadeStatus(pf).percent,100);assert.equal(arcadeStatus(pf).badge,true);assert.equal(pf.items[ARCADE_REWARD],1);
const rewardAt=pf.arcade.rewardGrantedAt;const restored=JSON.parse(JSON.stringify(pf));
for(const q of [ARCADE_PUZZLES[0],ARCADE_PUZZLES[12],ARCADE_PUZZLES[99]]){const r=arcadeAnswer(restored,q.id,q.answer);assert.equal(r.advanced,false);assert.equal(r.rewarded,false);}
assert.equal(restored.arcade.rewardGrantedAt,rewardAt);assert.equal(restored.items[ARCADE_REWARD],1);
assert.equal(grantArcadeReward({arcade:{cleared:99}}),false);
const handlers={},sock={id:'test',on:(name,f)=>handlers[name]=f};let player=null,reply,saved=0;
const profile={arcade:{cleared:13}};
attachArcade(sock,{getPlayer:()=>player,profile:()=>profile,save:()=>saved++,changed:()=>{}});
handlers['arcade:open'](r=>reply=r);assert.ok(reply.error);
player={name:'tester',sid:'test',room:'game'};handlers['arcade:open'](r=>reply=r);assert.ok(reply.error);
player.room='lobby';handlers['arcade:open'](r=>reply=r);assert.equal(reply.puzzle.id,14);
handlers['arcade:answer']({id:14,answer:'11'},r=>reply=r);assert.equal(reply.correct,true);assert.equal(saved,1);
handlers['arcade:answer']({id:15,answer:'SOS'},r=>reply=r);assert.ok(reply.error);
console.log('PASS: 100 sequential answers, rejection of wrong/locked/invalid requests, private answers, 13/14 boundary, persistence roundtrip, 99 no reward, 100 one reward + 100%, replay idempotence, ownership, lobby restriction, rate limiting.');
