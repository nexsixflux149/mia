import { ARCADE_TARGET, ARCADE_PUZZLES } from './arcade-puzzles.js';

const normalize = value => String(value).normalize('NFKC').trim().replace(/\s/g,'').toUpperCase();
export const ARCADE_REWARD = 'mask_bighead';
export function grantArcadeReward(profile) {
  if(arcadeStatus(profile).cleared !== ARCADE_TARGET || profile.arcade.rewardGrantedAt) return false;
  profile.items ||= {}; profile.items[ARCADE_REWARD] = 1;
  profile.arcade.rewardGrantedAt = Date.now();
  return true;
}
const bank = new Map(ARCADE_PUZZLES.map(p => [p.id,p]));
export const arcadeStatus = profile => {
  const cleared = Math.min(ARCADE_TARGET, Math.max(0, Math.floor(Number(profile.arcade?.cleared) || 0)));
  return {cleared,total:ARCADE_TARGET,available:ARCADE_PUZZLES.length,percent:Math.round(cleared/ARCADE_TARGET*1000)/10,next:Math.min(cleared+1,ARCADE_TARGET),badge:cleared===ARCADE_TARGET};
};
export function arcadeQuestion(profile,id) {
  const state=arcadeStatus(profile);
  if(!Number.isInteger(id)||id<1||id>ARCADE_TARGET)return {error:'잘못된 문제 번호입니다.'};
  if(id>state.next)return {error:'이전 문제부터 풀어 주세요.'};
  const p=bank.get(id);if(!p)return {error:'아직 제작·검수가 끝나지 않은 문제입니다.',state};
  return {state,puzzle:{id:p.id,title:p.title,prompt:p.prompt,hint:p.hint,difficulty:p.difficulty}};
}
export function arcadeAnswer(profile,id,value) {
  const view=arcadeQuestion(profile,id);if(view.error)return view;
  if(typeof value!=='string'||value.length>120)return {error:'답을 120자 이내로 입력해 주세요.'};
  const p=bank.get(id);
  if(normalize(value)!==normalize(p.answer))return {correct:false,state:arcadeStatus(profile)};
  const before=arcadeStatus(profile).cleared;
  if(id===before+1) profile.arcade={...(profile.arcade||{}),cleared:id,updatedAt:Date.now(),...(id===ARCADE_TARGET?{completedAt:Date.now()}:{} )};
  const rewarded = grantArcadeReward(profile);
  return {correct:true,advanced:id===before+1,rewarded,explain:p.explain,state:arcadeStatus(profile)};
}

export function attachArcade(sock,{getPlayer,profile,save,changed}) {
  let lastAnswer=0;
  const ready=ack=>{
    if(typeof ack!=='function')return null;
    const p=getPlayer();
    if(!p||p.sid!==sock.id||p.room!=='lobby'){ack({error:'로비에 접속한 상태에서 이용해 주세요.'});return null;}
    return p;
  };
  sock.on('arcade:open',ack=>{const p=ready(ack);if(p)ack(arcadeQuestion(profile(p.name),arcadeStatus(profile(p.name)).next));});
  sock.on('arcade:question',(id,ack)=>{const p=ready(ack);if(p)ack(arcadeQuestion(profile(p.name),id));});
  sock.on('arcade:answer',(data,ack)=>{
    const p=ready(ack);if(!p)return;
    if(Date.now()-lastAnswer<700)return ack({error:'잠시 후 다시 확인해 주세요.'});lastAnswer=Date.now();
    const pf=profile(p.name),previous=structuredClone({arcade:pf.arcade,items:pf.items});
    const result=arcadeAnswer(pf,data?.id,data?.answer);
    if(result.advanced || result.rewarded){try{save();}catch(e){pf.arcade=previous.arcade;pf.items=previous.items;return ack({error:'저장하지 못했습니다. 다시 시도해 주세요.'});}changed(p);}
    ack(result);
  });
}
