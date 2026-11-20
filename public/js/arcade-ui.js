export function openArcade({socket,openModal}) {
  const root=document.createElement('section');root.className='arcade-panel';
  const status=document.createElement('p'),progress=document.createElement('progress');progress.max=100;progress.setAttribute('aria-label','전체 문제 진행률');
  const nav=document.createElement('div');nav.className='arcade-nav';
  const number=document.createElement('input');number.type='number';number.min=1;number.max=100;number.step=1;number.setAttribute('aria-label','다시 풀 문제 번호');
  const go=document.createElement('button');go.className='btn';go.textContent='문제 선택';
  const heading=document.createElement('h3'),prompt=document.createElement('p');prompt.className='arcade-prompt';
  const hint=document.createElement('details'),summary=document.createElement('summary'),hintText=document.createElement('p');summary.textContent='힌트 보기';hint.append(summary,hintText);
  const form=document.createElement('form'),answer=document.createElement('input'),submit=document.createElement('button');answer.autocomplete='off';answer.maxLength=120;answer.setAttribute('aria-label','정답');answer.placeholder='정답 입력';submit.type='submit';submit.className='btn primary';submit.textContent='정답 확인';form.append(answer,submit);
  const feedback=document.createElement('p');feedback.setAttribute('role','status');
  const next=document.createElement('button');next.className='btn';next.textContent='다음 문제';next.hidden=true;
  nav.append(number,go);root.append(status,progress,nav,heading,prompt,hint,form,feedback,next);
  let current=0,state=null,busy=false;
  const call=async(event,...args)=>{
    if(busy)return null;busy=true;go.disabled=submit.disabled=next.disabled=true;
    try{return await socket.timeout(10000).emitWithAck(event,...args);}catch{return {error:'연결이 끊겼습니다. 창을 다시 열면 저장된 기록부터 이어집니다.'};}
    finally{busy=false;go.disabled=submit.disabled=next.disabled=false;}
  };
  const showState=s=>{if(!s)return;state=s;status.textContent=`${s.cleared} / ${s.total} 완료 · ${s.percent.toFixed(1)}%${s.badge?' · 🏅 100 완주':''}`;progress.max=s.total;progress.value=s.cleared;number.max=s.next;};
  const show=result=>{
    if(!result||!root.isConnected)return;
    showState(result.state);feedback.textContent=result.error||'';
    if(!result.puzzle){if(!current){form.hidden=true;hint.hidden=true;}return;}
    const p=result.puzzle;current=p.id;number.value=p.id;heading.textContent=`${p.id}. ${p.title} · ${'★'.repeat(p.difficulty)}`;prompt.textContent=p.prompt;hintText.textContent=p.hint;hint.open=false;hint.hidden=false;form.hidden=false;answer.value='';next.hidden=true;
  };
  go.onclick=async()=>{const id=Number(number.value);if(!Number.isInteger(id)||id<1||id>(state?.next||1)){feedback.textContent='완료한 문제와 바로 다음 문제까지만 선택할 수 있어요.';return;}show(await call('arcade:question',id));};
  form.onsubmit=async e=>{e.preventDefault();if(!current)return;const r=await call('arcade:answer',{id:current,answer:answer.value});if(!r||!root.isConnected)return;showState(r.state);feedback.textContent=r.error||(r.correct?`정답! ${r.explain}${r.rewarded ? " 🏅 완주 배지와 🧸 왕대두 인형탈이 지급됐어요! 내 물건에서 착용해 보세요." : ""}`:'아직 정답이 아니에요. 단서를 다시 살펴보세요.');next.hidden=!(r.correct&&current<(state?.total || 100));};
  next.onclick=async()=>show(await call('arcade:question',current+1));
  openModal('미아 오락실','완료한 문제는 언제든 다시 풀 수 있어요. 100문제 완주 시 이름 앞 배지와 비매품 왕대두 인형탈을 드립니다.',root);
  call('arcade:open').then(show);
}
