import { GameInstance } from '/engine/game.js';
import { SCENARIOS, scenarioList } from '/engine/scenarios.js';
import { ITEMS, START_ITEMS } from '/engine/items.js';
import { blankProfile, profileView } from '/engine/progress.js';

// A local transport for the unchanged GameInstance. No sockets, accounts or server records.
const SAVE = 'mia-mobile-ch1-checkpoint-v1';
const copy = value => value == null ? value : structuredClone(value);
class SoloTransport {
  constructor() { this.connected = true; this.handlers = new Map(); this.id = 'solo-player'; }
  on(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, []); this.handlers.get(name).push(fn); return this; }
  receive(name, value) { for (const fn of this.handlers.get(name) || []) fn(copy(value)); }
  connect() { this.connected = true; return this; }
  checkpoint() {
    if (!this.game || this.complete) return;
    try { localStorage.setItem(SAVE, JSON.stringify({ flags:[...this.game.flags],taken:[...this.game.taken],counters:this.game.counters,hints:this.game.hintLevel,inv:this.player.inv,elapsed:Date.now()-this.game.startedAt })); } catch {}
  }
  info() { return scenarioList().filter(s=>s.id==='mia').map(s=>({...s,chapters:s.chapters.slice(0,1),desc:'모바일 1인 테스트 · 달동네 골목 · 멀티플레이/음성채팅 없음'})); }
  party() { return {id:'solo',leader:this.id,members:[{id:this.id,name:this.player.name,inGame:true,mic:false}],instId:'solo',scenarioId:'mia',unlockedBy:{mia:{chapter:0}},scenarios:this.info()}; }
  start(reset = false) {
    this.complete = false; document.querySelector('#soloComplete')?.remove();
    if (reset) { try { localStorage.removeItem(SAVE); } catch {} }
    this.player.room = 'inst:solo'; this.player.inv = [...START_ITEMS,...SCENARIOS.mia.startItems(0)]; this.player.light = false;
    const serverIO = {to:()=>({emit:(name,value)=>{this.receive(name,value);if(['game:sync','inv'].includes(name))this.checkpoint();}})};
    this.game = new GameInstance({id:'solo',io:serverIO,party:{members:[this.id]},players:new Map([[this.id,this.player]]),chapter:0,scenario:'mia',fear:2});
    // Finish the preview at the actual exit; do not remaster or rewrite later chapters.
    this.game.gotoChapter = () => {
      this.checkpoint(); this.complete = true; this.game.ended = true;
      try { localStorage.removeItem(SAVE); } catch {}
      window.dispatchEvent(new CustomEvent('mia:solo-complete',{detail:{relics:this.game.relicCount()}}));
    };
    let saved;
    try { saved=JSON.parse(localStorage.getItem(SAVE)||'null'); } catch {}
    if (saved && Array.isArray(saved.flags) && Array.isArray(saved.inv)) {
      this.game.flags = new Set(saved.flags); this.game.taken = new Set(saved.taken || []);
      this.game.counters = saved.counters || {}; this.game.hintLevel = saved.hints || {};
      this.player.inv = saved.inv.filter(id=>ITEMS[id]); this.game.startedAt = Date.now()-(Number(saved.elapsed)||0);
    }
    this.receive('party',this.party()); this.receive('inv',this.player.inv); this.receive('game:start',this.game.fullState());
    clearInterval(this.timer);
    let previous = performance.now();
    this.timer = setInterval(()=>{const now=performance.now();const dt=Math.min(0.1,(now-previous)/1000);previous=now;if(!this.complete)this.receive('state',{players:[{...this.player,id:this.id,gear:'|||',lv:1}],ghosts:this.game.tick(dt)});},66);
    this.checkpoint();
  }
  emit(name, payload, ack) {
    if (typeof payload==='function') { ack=payload;payload=undefined; }
    if (name==='hello') {
      this.player={id:this.id,name:String(payload.name||'탐험가').slice(0,12),look:payload.look||{},room:'inst:solo',x:0,z:4.5,ry:Math.PI,light:false,inv:[...START_ITEMS]};
      ack?.({id:this.id,name:this.player.name,token:'local-only',items:ITEMS,scenarios:this.info(),unlockedBy:{mia:{chapter:0}},shop:{},hearts:0,admin:false,hiddenOk:false});
      queueMicrotask(()=>{this.receive('profile',{...profileView(blankProfile(),false),hiddenOk:false});this.start();});
      return;
    }
    if (!this.player) return;
    switch(name) {
      case 'move': Object.assign(this.player,payload);break;
      case 'look': this.player.look=payload;break;
      case 'look:get':this.receive('look',{id:this.id,lv:1,look:this.player.look});break;
      case 'party:start':case 'party:quit':case 'party:leave':this.start(true);break;
      case 'game:interact':this.game?.interact(this.player,payload);break;
      case 'game:lock':this.game?.tryLock(this.player,payload.id,payload.answer);break;
      case 'game:hint':this.game?.hint(this.player);break;
      case 'game:state':this.receive('game:start',this.game.fullState());break;
      case 'inv:use': if(payload==='flashlight')this.player.light=!this.player.light;else this.game?.useItem(this.player,payload);break;
      case 'inv:combine':this.game?.combine(this.player,payload.a,payload.b);break;
      case 'ping':this.receive('ping',{...payload,name:this.player.name});break;
      case 'rank:get':ack?.({});break;
      case 'profile:get':this.receive('profile',profileView(blankProfile(),false));break;
      case 'party:link':this.receive('toast',{text:'이 버전은 1인 테스트입니다. 초대/멀티플레이는 지원하지 않습니다.'});break;
      case 'voice:mic':this.receive('toast',{text:'모바일 1인 테스트에서는 음성채팅을 사용하지 않습니다.'});break;
    }
  }
}
window.MIA_PREVIEW=true;
window.MIA_SOLO=true;
const transport = new SoloTransport();
window.io=()=>transport;
window.addEventListener('pagehide',()=>transport.checkpoint());
window.addEventListener('mia:solo-complete',event=>{
  const panel=document.createElement('section');panel.id='soloComplete';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  const card=document.createElement('div');card.className='solo-complete-card';
  const title=document.createElement('h2');title.textContent='첫 번째 챕터 완료';
  const text=document.createElement('p');text.textContent=`문방구 셔터를 열고 출구에 도착했습니다. 유품 ${event.detail.relics}/1개를 찾았습니다. 이후 챕터와 운영 게임은 변경하지 않았습니다.`;
  const replay=document.createElement('button');replay.textContent='처음부터 다시 플레이';replay.onclick=()=>transport.start(true);
  card.append(title,text,replay);panel.append(card);document.body.append(panel);
});
// Canvas labels must use the same original font as DOM documents.
await document.fonts.load('16px "Gowun Dodum"').catch(() => []);
await import('/js/main.js');
// Enter directly on mobile; the original fading splash could intercept the first tap.
document.getElementById('splash')?.remove();
document.getElementById('login')?.classList.remove('from-splash');
// A dedicated status banner and compact graphics panel leave the touch joystick free.
const banner=document.createElement('div');banner.id='soloBanner';banner.textContent='MIA · 모바일 1인 미리보기 · 첫 챕터';document.body.append(banner);
const panel=document.querySelector('[aria-label="독립 그래픽 테스트"]');
if(panel){panel.id='soloGraphics';panel.querySelector('details').open=false;panel.querySelector('summary').textContent='그래픽 · 원본 비교';panel.querySelector('[data-start]').textContent='처음부터 다시';panel.querySelector('[data-start]').onclick=()=>{if(confirm('첫 챕터의 테스트 진행을 초기화할까요?'))transport.start(true);};}
for(const id of ['micBtn','voiceModeBtn','shareCopy','adminToggle','adminBtn','shopBtn','bagBtn','rankBtn','rosterToggle','chatInput']){const e=document.getElementById(id);if(e){e.disabled=true;e.setAttribute('aria-disabled','true');}}
if(new URLSearchParams(location.search).has('debug'))window.__solo=transport;
