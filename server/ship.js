/*
 * 시나리오 2 — 오필리아호의 마지막 항해
 * 1931년 11월, 상하이에서 부산으로 가던 여객선 오필리아호가 남해 흑등도 앞바다에서 사라졌다.
 * 진실: 선장 크로우는 보험금을 노리고 배를 침몰시키려 했다. 등대지기 박만수에게 돈을 주고 등대 불을 끄게 했고,
 *       폭풍이 오자 3등칸 철창문을 잠가 승객 112명을 가두었다. 무전사 한서진만이 몰래 SOS 를 보냈다.
 * 매년 11월 안개 낀 밤, 오필리아호는 그날 밤을 되풀이하며 흑등도 앞에 나타난다.
 *
 * 퍼즐 유형: 물때표 숫자, 모스 부호 해독, 등대 반사판 격자, 기호 다이얼, 시계 바늘 맞추기, 협동 펌프,
 *           전신기 송신(모스 입력), 수신 모스 숫자, 항해일지 날짜 정렬, 자외선 램프 숨은 글씨, 추리(가짜 금괴),
 *           역방향 항로, 이름 대기.
 */
const T = (title, text) => ({ title, text });

export const SHIP_CHAPTERS = [
  // ─────────────────────────────── 1장
  {
    id: 0,
    title: '1장 · 안개 낀 등대섬',
    place: '남해 흑등도(黑燈島) 무인등대 · 2026년 11월 9일 02:00',
    outdoor: true, water: true,
    size: [26, 22],
    spawn: [0, 8.5],
    ambient: 'night',
    ground: '#2c2c28',
    fog: 0.085,
    intro: T('1장 · 안개 낀 등대섬', `"매년 11월, 안개 낀 밤이면 흑등도 앞바다에 불 꺼진 여객선이 떠 있다."

구독자 제보 한 통에 심야방송 크루는 낚싯배를 빌려 무인도에 내렸다.
선장은 섬에 당신들을 내려 주고는 도망치듯 떠났다.
"새벽 세 시 전에는 절대 바다 쪽을 보지 마쇼."

1931년에 꺼진 등대. 녹슨 신호등 하나가 저 혼자 깜빡이고 있다.
그리고 안개 너머에서 — 아주 오래된 뱃고동 소리가 들렸다.`),
    props: [
      { t: 'rock', x: -11, z: 8 }, { t: 'rock', x: 11, z: 7 }, { t: 'rock', x: -10, z: -6 }, { t: 'rock', x: 10, z: -7 },
      { t: 'barrel', x: -6.6, z: 6.6 }, { t: 'barrel', x: -5.6, z: 7.2 }, { t: 'crate', x: 5, z: 8 },
      { t: 'lamp', x: 3, z: 7 }, { t: 'fence', x: -5, z: -9.2, len: 6 }, { t: 'fence', x: 5, z: -9.2, len: 6 },
      { t: 'lighthouse', x: 0, z: -9.6 }, { t: 'dock', x: -9, z: 9.5 },
    ],
    objects: [
      { id: 'dock_sign', t: 'signpost', x: -2.5, z: 9.4, label: '섬 안내판', kind: 'examine',
        text: '"흑등도(黑燈島) 무인등대 — 1928년 점등, 1931년 11월 소등.\n 출입 금지. 이 섬에서 바다를 향해 사진을 찍지 마시오."\n\n아래에 누군가 칼로 새겼다: "불을 켜 줘"' },
      { id: 'keeper_log', t: 'book', x: -6.1, z: 6.0, y: 0.95, label: '등대지기 일지', kind: 'examine', once: true,
        on: { flag: 'read_log', toast: '목표가 갱신되었습니다' },
        text: `【 흑등도 등대 일지 · 등대지기 박만수 】

11월 7일 — 남서풍. 폭풍이 온다는 무전.
11월 8일 — 오필리아호 선장 크로우가 작은 배로 찾아왔다. 봉투를 받았다.
           "내일 밤 불을 끄시오. 아무것도 보지 마시오."
11월 9일 — 새벽 2시 20분. 안개 속에서 기적 소리. 나는 불을 켜지 않았다.
           그 뒤로 섬의 신호등이 밤새 같은 글자를 깜빡였다.
           무서워서 그 글자의 뜻을 찾아볼 수가 없다. 모스 부호표는 창고에 넣어 두었다.

(마지막 장, 떨리는 글씨) "그 아이 이름이었다."` },
      { id: 'tide_board', t: 'tide_board', x: 6, z: 5.5, label: '물때표', kind: 'examine',
        text: '녹슨 철판에 페인트로 쓴 물때표.\n\n  11월 9일   만조 03:40  ·  16:05\n             간조 09:52  ·  22:18\n\n"섬을 떠나는 마지막 배는 오후 만조에 뜬다."' },
      { id: 'shed', t: 'shed', x: 8.5, z: -2, label: '보트 창고', kind: 'lock',
        text: '보트 창고 문에 4자리 숫자 자물쇠. 문짝에 페인트 글씨: "마지막 배가 떠나는 시각"',
        lock: { input: 'digits', len: 4, answer: '1605' },
        doneText: '열린 창고. 바닥에 젖은 발자국이 바다 쪽에서 들어와 있다. 나간 자국은 없다.',
        on: { flag: 'shed', give: ['morse_card', 'ship_relic_1'], sound: 'door', scareSelf: 'hands',
          story: T('보트 창고', `창고 안은 소금기와 썩은 그물 냄새로 가득했다.\n\n벽에 압정으로 꽂힌 모스 부호표 한 장.\n그리고 그 아래, 물에 젖은 승선권 한 장이 바닥에 붙어 있었다.\n  「SS OPHELIA · 상하이 → 부산 · 3등실 3호 · 릴리 에번스(7)」\n\n승선권을 집는 순간, 등 뒤의 그물 더미가 사람 모양으로 일어섰다가 무너졌다.`) } },
      { id: 'signal_lamp', t: 'signal_lamp', x: -7.5, z: -4.2, label: '녹슨 신호등', kind: 'signal',
        signal: { morse: '.-.. .. .-.. -.--' },
        text: '바다를 향한 녹슨 신호등이 저 혼자 깜빡인다. 짧고 긴 빛이 같은 순서로 반복된다.\n(모스 부호표가 있으면 해독할 수 있다)' },
      { id: 'lh_door', t: 'lh_door', x: 0, z: -7.9, label: '등대 문', kind: 'lock', goneOn: 'lh_open',
        text: '등대 철문. 알파벳 네 칸 자물쇠. 문에 긁힌 글씨: "신호등이 부르는 이름"',
        lock: { input: 'text', answer: ['lily', '릴리'] }, wrongScare: true,
        on: { flag: 'lh_open', sound: 'gate',
          story: T('등대', `"LILY".\n철문이 비명을 지르며 열렸다.\n\n등대 안 나선계단 위에서 아이 목소리가 메아리친다.\n"…엄마, 불이 꺼졌어. 배가 길을 잃었어."\n\n계단 아래 렌즈 조종반이 있다. 95년 동안 아무도 만지지 않은.`) } },
      { id: 'blueprint', t: 'easel', x: -2.2, z: -6.6, label: '렌즈 설계도', kind: 'examine', hidden: true, req: ['lh_open'],
        text: '등대 렌즈 반사판 설계도. 3×3 아홉 장의 반사판 중 다섯 장만 세운다.\n\n   □ ■ □\n   ■ ■ ■\n   □ ■ □\n\n"반사판을 하나 세우면 상하좌우 이웃한 판도 함께 뒤집힌다. 주의할 것."' },
      { id: 'lens_panel', t: 'panel', x: 2.2, z: -6.6, label: '렌즈 조종반', kind: 'lock', hidden: true, req: ['lh_open'],
        text: '반사판 아홉 장. 누르면 그 판과 상하좌우 이웃한 판이 함께 뒤집힌다. 설계도 모양을 만들자.',
        lock: { input: 'grid', size: 3, answer: '010111010', lightsOut: true },
        on: { flag: 'light_on', sound: 'power', scare: 'face',
          story: T('점등', `마지막 반사판이 맞물리자 95년 만에 등대에 불이 들어왔다.\n\n빛줄기가 안개를 가르며 바다를 쓸고 지나간다.\n그리고 빛이 닿은 자리에 — 그것이 있었다.\n\n녹슨 선체, 부서진 굴뚝, 뱃머리에 희미하게 남은 글자. O P H E L I A.\n\n갑판 난간에 수십 명이 서서 이쪽을 보고 있다. 모두 흠뻑 젖은 채로.\n부두의 노 젓는 배가 저절로 밧줄을 풀었다.`) } },
      { id: 'rowboat', t: 'rowboat', x: -9.5, z: 6, label: '노 젓는 배', kind: 'door', req: ['light_on'], to: 1,
        lockedText: '부두에 묶인 낡은 배. 안개 너머엔 아무것도 보이지 않는다. 지금 바다로 나가는 건 미친 짓이다.' },
    ],
    ghost: null,
    objectives: [
      { until: 'read_log', text: '부두 주변을 살펴보자', hints: ['통 위에 등대지기의 일지가 있다.'] },
      { until: 'shed', text: '보트 창고를 열자', hints: ['물때표를 보자.', '"마지막 배는 오후 만조에 뜬다"', '16:05 → 1605'] },
      { until: 'lh_open', text: '신호등이 깜빡이는 글자를 해독해 등대 문을 열자', hints: ['창고에서 얻은 모스 부호표(인벤토리)를 읽고, 신호등을 살펴보자.', '·−·· / ·· / ·−·· / −·−−', 'L I L Y'] },
      { until: 'light_on', text: '등대 렌즈에 불을 켜자', hints: ['설계도의 십자 모양을 만들어야 한다. 한 칸을 누르면 이웃 칸도 뒤집힌다.', '모두 꺼진 상태에서 가운데 한 칸만 누르면 바로 십자가 된다.', '격자를 초기화한 뒤 가운데만 누르자.'] },
      { until: '__end', text: '배를 타고 유령선으로', hints: ['부두 서쪽의 노 젓는 배.'] },
    ],
  },

  // ─────────────────────────────── 2장
  {
    id: 1,
    title: '2장 · 3등 선실',
    place: '오필리아호 하갑판',
    size: [20, 12],
    spawn: [0, 4.5],
    ambient: 'dark',
    floor: '#3a3226', wall: '#4b4237', fog: 0.06,
    intro: T('2장 · 3등 선실', `배에 오르자 등 뒤에서 사다리가 물속으로 끌려 들어갔다.

하갑판 3등 선실. 바닷물이 발목까지 차 있다.
선실 문마다 안쪽에서 손톱으로 긁은 자국.

복도 끝, 갑판으로 이어지는 철창문이 쇠사슬로 잠겨 있다.
철창 너머로 누군가 소리친다. "선장 명령이다! 아무도 못 나간다!"
…95년 전의 목소리다.`),
    props: [
      { t: 'bunk', x: -9, z: -1 }, { t: 'bunk', x: -9, z: 2.5 }, { t: 'barrel', x: 8.8, z: 5.2 }, { t: 'crate', x: 7.6, z: 5.3 },
      { t: 'pipes', x: 0, z: 5.85, r: 180 }, { t: 'porthole', x: 9.85, z: -3, r: -90, y: 1.8 }, { t: 'porthole', x: 9.85, z: 4.5, r: -90, y: 1.8 },
      { t: 'puddle', x: -3, z: 2 }, { t: 'puddle', x: 4, z: 0 }, { t: 'lifebuoy', x: -9.85, z: -4.5, r: 90, y: 1.6 },
    ],
    objects: [
      { id: 'manifest', t: 'book', x: -5.5, z: 1.5, y: 0.82, label: '승객 명부', kind: 'examine',
        text: `【 SS OPHELIA 3등 선실 배정표 】

 3호  에번스 부인, 딸 릴리(7)
 7호  김씨 가족 다섯
12호  선원 숙소
15호  무전사 한서진

맨 아래 선장 크로우의 서명:
"폭풍 시 3등칸 철창문을 잠그고 화물을 우선한다."` },
      { id: 'table1', t: 'table', x: -5.5, z: 1.5, kind: 'deco' },
      { id: 'cab12', t: 'cabin_door', x: -7, z: -5.85, color: '#c9a24a', label: '12호 선실 문', kind: 'examine', text: '12호 — 선원 숙소.\n문짝에 금빛 페인트로 그린 표식: ✦ (별)\n\n안에서 술 냄새와 함께 코 고는 소리가 난다. 95년째.' },
      { id: 'cab3', t: 'cabin_door', x: -3, z: -5.85, color: '#9ab7d8', label: '3호 선실 문', kind: 'examine', text: '3호 — 에번스 부인과 릴리.\n문짝에 하늘색으로 그린 표식: ☾ (달)\n\n문틈으로 아이의 자장가가 새어 나온다.',
        alt: [{ flag: 'clock', text: '3호 선실 문이 열려 있다. 안쪽 요람이 아직 흔들린다.' }] },
      { id: 'cab15', t: 'cabin_door', x: 1, z: -5.85, color: '#d0d0d0', label: '15호 선실 문', kind: 'examine', text: '15호 — 무전사 한서진.\n문짝에 흰색으로 그린 표식: ☸ (조타륜)\n\n문 아래로 전신 테이프가 끝없이 흘러나와 있다.' },
      { id: 'cab7', t: 'cabin_door', x: 5, z: -5.85, color: '#8a3a2a', label: '7호 선실 문', kind: 'examine', text: '7호 — 김씨 가족.\n문짝에 붉은색으로 그린 표식: ⚓ (닻)\n\n다섯 명이 동시에 숨을 들이쉬는 소리가 들린다.' },
      { id: 'wiring_chart', t: 'poster', x: 3, z: -5.85, y: 1.7, label: '배선도', kind: 'examine',
        text: '기관실 배선도. 바닷물에 젖어 절반이 번졌다.\n\n  빨강 ──→ 펌프 2\n  파랑 ──→ (번져서 안 보임)  ※ "소리 나는 곳"\n  노랑 ──→ (번져서 안 보임)\n  초록 ──→ 조명\n\n"남은 선은 남은 자리에."' },
      { id: 'pump_panel', t: 'panel', x: 7, z: -5.5, label: '펌프 배전함', kind: 'lock',
        text: '배전함 뚜껑이 열려 있다. 끊어진 전선 네 가닥을 단자에 다시 이어야 한다.',
        lock: { input: 'wires', left: ['빨강', '파랑', '노랑', '초록'], right: ['펌프 1', '펌프 2', '조명', '경보'], colors: ['#d6303a', '#3b7dd8', '#e8c13a', '#2fbf71'], answer: ['펌프 2', '경보', '펌프 1', '조명'] }, wrongScare: true,
        on: { flag: 'wired', sound: 'power', toast: '배전함에 불꽃이 튀며 펌프 레버에 전기가 들어왔다!' } },
      { id: 'pump_a', t: 'pump', x: -9.5, z: -3, r: 90, label: '배수 펌프 (앞)', kind: 'coop', req: ['wired'], lockedText: '레버가 꿈쩍도 하지 않는다. 전기가 들어오지 않는 것 같다.', text: '펌프 레버를 힘껏 당긴다!', coop: { group: 'pump', need: 2 } },
      { id: 'pump_b', t: 'pump', x: 9.5, z: 1, r: -90, label: '배수 펌프 (뒤)', kind: 'coop', req: ['wired'], lockedText: '레버가 꿈쩍도 하지 않는다. 전기가 들어오지 않는 것 같다.', text: '펌프 레버를 힘껏 당긴다!', coop: { group: 'pump', need: 2 } },
      { id: 'newspaper', t: 'paper', x: 3.5, z: 1.5, y: 0.82, label: '젖은 신문', kind: 'examine',
        text: '【 부산일보 · 1931년 11월 10일 】\n\n「여객선 오필리아호 실종」\n상하이발 부산행 오필리아호가 9일 새벽 남해에서 연락이 끊겼다.\n마지막 무선 교신은 9일 새벽 2시 20분.\n흑등도 등대는 그날 밤 "고장"으로 불이 꺼져 있었다.' },
      { id: 'table2', t: 'table', x: 3.5, z: 1.5, kind: 'deco' },
      { id: 'clock', t: 'clock', x: -1, z: 5.85, y: 2.2, r: 180, label: '선실 시계', kind: 'lock',
        text: '선실 벽의 시계들이 제각각 다른 시각에 멈춰 있다. 가운데 큰 시계만 바늘을 돌릴 수 있다.\n시계판 아래 동판: "이 배의 마지막 순간에 맞추어라"',
        lock: { input: 'clock', answer: ['2:20'] },
        doneText: '시계가 2시 20분에서 째깍거린다. 초침은 거꾸로 돈다.',
        on: { flag: 'clock', sound: 'bell',
          story: T('2시 20분', `바늘이 2시 20분에 닿자 모든 시계가 동시에 울렸다.\n\n3호 선실 문이 '끼익' 열렸다.\n안에 작은 요람 하나. 요람이 혼자 흔들리고 있다.\n요람 위에 젖은 하늘색 리본이 놓여 있다.\n\n요람 속은 — 비어 있다. 하지만 이불이 아이 모양으로 꺼져 있다.`) } },
      { id: 'cradle', t: 'cradle', x: -3, z: -4.6, label: '흔들리는 요람', kind: 'examine', hidden: true, req: ['clock'], once: true,
        text: '요람 안의 이불을 들추자 — 아무도 없다.\n그런데 이불 안쪽이 아직 따뜻하다.', on: { scareSelf: 'child', sound: 'giggle' } },
      { id: 'ship_relic_2', t: 'ribbon', x: -2.3, z: -4.6, label: '하늘색 리본', kind: 'pickup', item: 'ship_relic_2', hidden: true, req: ['clock'] },
      { id: 'gate', t: 'iron_gate', x: 9.8, z: -2.5, r: -90, label: '3등칸 철창문', kind: 'lock', req: ['drained'],
        lockedText: '철창문 아래가 허리까지 물에 잠겨 있다. 다이얼 자물쇠가 물속에 있다. 먼저 물을 빼야 한다.',
        text: '갑판으로 이어지는 철창문. 네 칸짜리 기호 다이얼 자물쇠.\n자물쇠 옆 낙서: "방 번호가 작은 순서대로 — 그러면 모두 나갈 수 있어"',
        lock: { input: 'dial', wheels: [['⚓', '☾', '✦', '☸'], ['⚓', '☾', '✦', '☸'], ['⚓', '☾', '✦', '☸'], ['⚓', '☾', '✦', '☸']], answer: ['☾', '⚓', '✦', '☸'] },
        wrongScare: true,
        doneText: '열린 철창문. 95년 늦게.',
        on: { flag: 'gate_open', sound: 'gate', scare: 'hands',
          story: T('철창문', `자물쇠가 풀리는 순간, 수십 개의 하얀 손이 철창 사이로 쏟아져 나왔다.\n당신들을 밀치고, 앞다투어 계단을 기어오른다.\n\n그리고 사라졌다.\n\n계단 위, 무전실에서 전신기 두드리는 소리가 들린다. 똑, 똑똑, 똑.`) } },
      { id: 'deck_stairs', t: 'stairs_up', x: 8, z: -4.6, r: -90, label: '갑판 계단', kind: 'door', hidden: true, req: ['gate_open'], to: 2 },
    ],
    coops: {
      pump: { on: { flag: 'drained', sound: 'water', ghost: 'start',
        story: T('배수', `펌프가 그르렁거리며 물을 빨아들인다.\n\n물이 빠지자 바닥에 깔려 있던 것들이 드러났다.\n구두, 모자, 찢어진 옷자락… 그리고 손톱이 빠진 손가락 자국.\n\n복도 끝 물웅덩이에서 무언가 일어선다.\n물에 불은 선원이 모자를 고쳐 쓰며 당신들을 본다.`) } },
    },
    ghost: { type: 'sailor', speed: 2.0, sense: 6, hearRun: true, spawn: [8, 3], name: '물에 불은 선원' },
    objectives: [
      { until: 'wired', text: '펌프 배전함의 전선을 이어 붙이자', hints: ['벽의 배선도를 보자.', '빨강→펌프 2, 초록→조명. 파랑은 "소리 나는 곳" → 경보.', '노랑은 남은 펌프 1'] },
      { until: 'drained', text: '선실의 물을 빼자', hints: ['선실 양쪽 벽에 배수 펌프 레버가 있다.', '두 레버를 서로 다른 사람이 8초 안에 당기자. (혼자라면 하나만)'] },
      { until: 'clock', text: '멈춘 시계를 맞추자', hints: ['젖은 신문에 마지막 교신 시각이 있다.', '2시 20분'] },
      { until: 'gate_open', text: '철창문의 기호 다이얼을 풀자', hints: ['네 선실 문의 표식과 방 번호를 확인하자.', '3호 ☾, 7호 ⚓, 12호 ✦, 15호 ☸', '☾ ⚓ ✦ ☸'] },
      { until: '__end', text: '계단을 올라 갑판으로', hints: ['철창문 옆 계단.'] },
    ],
  },

  // ─────────────────────────────── 3장
  {
    id: 2,
    title: '3장 · 무전실과 선장실',
    place: '오필리아호 상갑판',
    size: [22, 14],
    spawn: [-8, 5],
    ambient: 'dark',
    floor: '#4a3a2a', wall: '#5a4a3a', fog: 0.055,
    walls: [{ x: 0, z: -2, w: 0.3, d: 10 }, { x: 0, z: 6, w: 0.3, d: 2 }],
    intro: T('3장 · 무전실과 선장실', `상갑판. 폭풍이 지나간 뒤처럼 모든 것이 기울어 있다.

왼쪽은 무전실. 전신기 앞에 아무도 없는데, 키가 혼자 눌린다.
오른쪽은 선장실. 문틈으로 시가 냄새가 새어 나온다.

갑판 위로 묵직한 군화 소리. 쿵. 쿵. 쿵.
선장 크로우가 아직 배를 지휘하고 있다.`),
    props: [
      { t: 'porthole', x: -10.85, z: -3, r: 90, y: 1.8 }, { t: 'porthole', x: 10.85, z: 5, r: -90, y: 1.8 }, { t: 'pipes', x: -5, z: 6.85, r: 180 },
      { t: 'shelf', x: -10.6, z: 3, r: 90 }, { t: 'map_table', x: 5, z: 0 }, { t: 'crate', x: -9.5, z: 6 }, { t: 'lifebuoy', x: 2, z: -6.85, y: 1.6 },
    ],
    objects: [
      { id: 'seojin_note', t: 'paper', x: -3.8, z: -5.6, y: 0.95, label: '무전사의 메모', kind: 'examine',
        text: '한서진의 메모. 글씨가 급하게 흘려 쓰였다.\n\n"선장이 조난 신호를 금지했다. 무전기 퓨즈를 뺐다.\n 예비 전신기로 몰래 보낸다.\n 세상의 모든 배가 아는 그 세 글자. 짧게, 길게, 짧게.\n 누군가 이 신호를 받는다면 — 우리는 아직 여기 있다."' },
      { id: 'telegraph', t: 'telegraph', x: -6, z: -5.6, label: '예비 전신기', kind: 'lock',
        text: '전신기. 키를 짧게(·) 또는 길게(−) 눌러 신호를 보낸다. 아홉 번.',
        lock: { input: 'buttons', buttons: ['·', '−'], len: 9, answer: ['·', '·', '·', '−', '−', '−', '·', '·', '·'], morse: true },
        doneText: '전신기 키가 저 혼자 덜컥거린다. 무언가 답신이 오고 있다.',
        on: { flag: 'sos', sound: 'radio', ghost: 'start',
          story: T('SOS', `··· −−− ···\n\n신호를 다 보내자 전신기가 멈췄다.\n\n그리고 — 95년 만에 답신이 왔다.\n수신 테이프가 저 혼자 기어 나오며 숫자를 친다.\n\n동시에 갑판 위의 군화 소리가 멈췄다.\n"누가 내 배에서 신호를 보내나."`) } },
      { id: 'reply', t: 'tape', x: -7.5, z: -4.8, y: 0.9, label: '수신 테이프', kind: 'signal', hidden: true, req: ['sos'],
        signal: { morse: '.---- ----. ...-- .----' },
        text: '수신 테이프가 깜빡이며 같은 숫자 신호를 반복한다. (모스 부호표의 숫자 칸을 보자)' },
      { id: 'ship_relic_3', t: 'headphones', x: -4.6, z: -4.6, label: '낡은 헤드폰', kind: 'pickup', item: 'ship_relic_3', hidden: true, req: ['sos'] },
      { id: 'uv_drawer', t: 'desk', x: -8.5, z: 0, label: '무전실 책상 서랍', kind: 'pickup', item: 'uv_lamp',
        text: '서랍 속에 이상한 램프가 있다. "위조 서류 감식용 — 자외선 램프". 보라색 빛이 나온다.',
        takenText: '빈 서랍. 바닥에 보라색 얼룩.' },
      { id: 'cap_door', t: 'door', x: 0, z: 4, r: 90, label: '선장실 문', kind: 'lock', goneOn: 'cap_open',
        text: '선장실 문. 4자리 숫자 자물쇠. 문에 붙은 쪽지: "회신을 받은 자만 들어오라"',
        lock: { input: 'digits', len: 4, answer: '1931' },
        on: { flag: 'cap_open', sound: 'door', toast: '선장실 문이 열렸다' } },
      { id: 'log1', t: 'paper', x: 3, z: -5.6, y: 0.95, label: '항해일지 (찢긴 장 1)', kind: 'examine', text: '찢겨 나간 항해일지 한 장.\n\n  [11월 7일] 폭풍 경보. 기수를 북으로.\n  [11월 9일] 등대 꺼짐. 예정대로 남쪽 암초로. — 크로우' },
      { id: 'log2', t: 'paper', x: 9.5, z: -5.6, y: 0.95, label: '항해일지 (찢긴 장 2)', kind: 'examine', text: '찢겨 나간 항해일지 한 장.\n\n  [11월 5일] 상하이 출항. 동쪽으로.' },
      { id: 'log3', t: 'paper', x: 8.5, z: 2.5, y: 0.95, label: '항해일지 (찢긴 장 3)', kind: 'examine', text: '찢겨 나간 항해일지 한 장.\n\n  [11월 6일] 순풍. 계속 동쪽으로.\n  [11월 8일] 흑등도 등대 확인. 동쪽으로 꺾음. 등대지기에게 봉투 전달 완료.' },
      { id: 'wheel', t: 'ship_wheel', x: 5, z: -5.9, label: '조타륜', kind: 'lock',
        text: '선장실의 조타륜. 방위 표시가 새겨져 있다. 그날의 항로를 날짜 순서대로 다시 밟아야 한다. (5번)',
        lock: { input: 'buttons', buttons: ['북', '동', '남', '서'], len: 5, answer: ['동', '동', '북', '동', '남'] }, wrongScare: true,
        doneText: '조타륜이 남쪽을 가리킨 채 굳어 있다.',
        on: { flag: 'course', sound: 'creak', scare: 'face',
          story: T('항로', `마지막으로 남쪽으로 키를 돌리자 — 배 전체가 '쿵' 하고 무언가에 부딪혔다.\n\n선실이 기울고, 해도와 술병이 쏟아졌다.\n기울어진 벽의 초상화 속 선장이 당신을 내려다본다.\n\n선장의 금고를 덮고 있던 해도 더미가 미끄러져 내렸다.`) } },
      { id: 'portrait', t: 'painting', x: 10.85, z: -1.5, r: -90, y: 1.8, label: '선장의 초상화', kind: 'examine',
        text: '해리슨 크로우 선장의 초상화. 굳게 다문 입. 손에 금시계.\n액자 아래가 이상하게 깨끗하다. 누군가 무언가를 지운 듯하다.',
        reveal: { item: 'uv_lamp', flag: 'uv_seen', text: '자외선 램프를 비추자 액자 아래에 형광 글씨가 떠오른다.\n\n  "금고 — 나와 메리의 결혼기념일. 9월 15일"' } },
      { id: 'cap_safe', t: 'safe', x: 9.6, z: 4.5, r: -90, label: '선장의 금고', kind: 'lock', req: ['course'],
        lockedText: '금고 위에 무거운 해도와 장비가 잔뜩 쌓여 있다. 배가 기울기라도 해야 쏟아질 것 같다.',
        text: '선장의 금고. 4자리 숫자 다이얼.',
        lock: { input: 'digits', len: 4, answer: '0915' },
        doneText: '빈 금고. 금화 한 닢이 바닥에 들러붙어 있다.',
        on: { flag: 'safe_open', give: 'contract', sound: 'drawer',
          story: T('보험 계약서', `금고 안에는 금괴가 아니라, 서류 한 장이 들어 있었다.\n(인벤토리에서 읽을 수 있다)\n\n종이를 펼치는 순간, 등 뒤에서 젖은 숨결이 느껴졌다.\n"그건 내 것이다."\n\n선실 바닥의 화물칸 해치가 '덜컹' 하고 열렸다.`) } },
      { id: 'hatch', t: 'hatch', x: 7.5, z: 5.6, label: '화물칸 해치', kind: 'door', req: ['safe_open'], to: 3,
        lockedText: '바닥의 화물칸 해치. 안쪽에서 빗장이 걸려 있다.' },
    ],
    ghost: { type: 'sailor', speed: 2.3, sense: 7, teleport: 22, spawn: [6, -2], name: '선장 크로우', captain: true },
    ghosts: [{ type: 'shadow', speed: 1.7, sense: 6, startFlag: 'cap_open', spawn: [-9, -5], name: '그림자 승객' }],
    objectives: [
      { until: 'sos', text: '예비 전신기로 조난 신호를 보내자', hints: ['무전사의 메모를 읽자.', '세상 모든 배가 아는 세 글자: S O S', '··· −−− ···'] },
      { until: 'cap_open', text: '답신을 해독해 선장실 문을 열자', hints: ['수신 테이프의 신호를 보고 모스 부호표의 숫자 칸과 비교하자.', '·−−−− = 1, −−−−· = 9, ···−− = 3', '1931'] },
      { until: 'course', text: '그날의 항로를 조타륜으로 재현하자', hints: ['선장실 곳곳에 찢긴 항해일지 세 장이 있다.', '날짜 순서대로: 5일 → 6일 → 7일 → 8일 → 9일', '동 → 동 → 북 → 동 → 남'] },
      { until: 'safe_open', text: '선장의 금고를 열자', hints: ['무전실 책상 서랍의 자외선 램프를 가지고 선장의 초상화를 살펴보자.', '9월 15일 → 0915'] },
      { until: '__end', text: '화물칸으로 내려가자', hints: ['선장실 바닥의 해치.'] },
    ],
  },

  // ─────────────────────────────── 4장
  {
    id: 3,
    title: '4장 · 화물칸',
    place: '오필리아호 최하층 화물칸',
    size: [20, 16],
    spawn: [0, 6.5],
    ambient: 'abyss',
    startDark: true,
    floor: '#2a2420', wall: '#3a302a', fog: 0.075,
    intro: T('4장 · 화물칸', `화물칸. 녹슨 쇠사슬이 천장에서 늘어져 있다.

벽을 따라 '金' 도장이 찍힌 나무 상자 여섯 개.
선장이 112명의 목숨보다 먼저 챙긴 화물.

어둠 속에서 아이들이 속삭인다.
"집에 가고 싶어. 집에 가는 길을 알아?"

그리고 해치 위에서, 선장이 천천히 사다리를 내려온다.`),
    props: [
      { t: 'chain', x: -4, z: -2 }, { t: 'chain', x: 4, z: 1 }, { t: 'barrel', x: -9, z: 6.5 }, { t: 'barrel', x: 9, z: 6.5 },
      { t: 'puddle', x: 2, z: 3 }, { t: 'pillar_c', x: -6, z: 2 }, { t: 'pillar_c', x: 6, z: -3 }, { t: 'stairs', x: 0, z: 7.4 },
    ],
    objects: [
      { id: 'gen_a', t: 'pump', x: -9.5, z: 4, r: 90, label: '비상 발전기 시동줄 (서)', kind: 'coop', text: '시동줄을 힘껏 당긴다!', coop: { group: 'gen', need: 2 } },
      { id: 'gen_b', t: 'pump', x: 9.5, z: 4, r: -90, label: '비상 발전기 시동줄 (동)', kind: 'coop', text: '시동줄을 힘껏 당긴다!', coop: { group: 'gen', need: 2 } },
      ...[1, 2, 3, 4, 5, 6].map((n) => {
        const stamps = { 1: '닻 도장 ⚓', 2: '닻 도장 ⚓', 3: '닻 도장 ⚓', 4: '왕관 도장 ♛', 5: '닻 도장 ⚓', 6: '닻 도장 ⚓' };
        const notes = { 1: '틈새로 모래가 흘러내린다.', 2: '흔들어 보니 사락사락 소리가 난다.', 3: '상자 귀퉁이가 젖어 진흙이 배어 나온다.', 4: '다른 상자보다 훨씬 무겁다. 안에서 무언가 달그락거린다.', 5: '못이 헐겁게 박혀 있다. 모래 냄새.', 6: '상자 밑에 모래가 쌓여 있다.' };
        const pos = [[-7.5, -6.5], [-4.5, -6.5], [-1.5, -6.5], [1.5, -6.5], [4.5, -6.5], [7.5, -6.5]][n - 1];
        return { id: 'crate' + n, t: 'gold_crate', x: pos[0], z: pos[1], label: `${n}번 화물 상자`, kind: 'examine', text: `'金' 이라고 크게 찍힌 상자. 번호 ${n}.\n뚜껑에 작은 ${stamps[n]}.\n\n${notes[n]}` };
      }),
      { id: 'crowbar', t: 'crowbar', x: 8.5, z: -2, label: '쇠지렛대', kind: 'pickup', item: 'crowbar', hidden: true, req: ['power3'] },
      { id: 'breakers', t: 'fusebox', x: -9.85, z: -2, r: 90, y: 1.5, label: '배전반 차단기', kind: 'lock', req: ['power3'],
        lockedText: '배전반. 전기가 들어오지 않는다.',
        text: '차단기 네 개. 위의 램프가 깜빡이는 순서대로 올려야 화물칸 전체에 불이 들어온다.',
        lock: { input: 'simon', buttons: ['1', '2', '3', '4'], colors: ['#d6303a', '#e8c13a', '#2fbf71', '#3b7dd8'], answer: ['3', '1', '4', '1', '2'] }, wrongScare: true,
        on: { flag: 'breakers', sound: 'power', toast: '화물칸 전체에 불이 들어왔다' } },
      { id: 'crate_rack', t: 'panel', x: 0, z: -4.4, label: '상자 비틀어 열기', kind: 'lock', req: ['breakers'],
        lockedText: '너무 어두워서 상자의 표식이 보이지 않는다. 먼저 불을 켜야 한다.',
        needItems: ['crowbar'], needItemsText: '상자 뚜껑이 못으로 박혀 있다. 비틀어 열 도구가 필요하다.',
        text: '쇠지렛대로 상자 하나를 비틀어 열 수 있다. 어느 상자일까? 한 번 틀릴 때마다 무언가가 깨어난다.',
        lock: { input: 'buttons', buttons: ['1번', '2번', '3번', '4번', '5번', '6번'], len: 1, answer: ['4번'] }, wrongScare: true,
        on: { flag: 'crate_open', sound: 'drawer', scare: 'child',
          story: T('4번 상자', `왕관 도장이 찍힌 4번 상자 안에는 금괴가 없었다.\n\n대신 승객들의 반지, 시계, 목걸이… 그리고 가족사진이 가득했다.\n선장이 승객들에게서 "맡아 둔다"며 걷어 간 것들.\n\n나머지 다섯 상자는 모두 모래였다. 보험금을 위한 가짜 금괴.\n\n사진 속 가족이 일제히 고개를 돌려 당신을 보았다.`) } },
      { id: 'ship_relic_4', t: 'photo', x: 1.5, z: -5.3, y: 0.3, label: '가족사진', kind: 'pickup', item: 'ship_relic_4', hidden: true, req: ['crate_open'] },
      { id: 'ship_relic_5', t: 'ring', x: 8.6, z: 3.5, label: '물웅덩이 속 반지', kind: 'pickup', item: 'ship_relic_5', hidden: true, req: ['power3'],
        text: '바닥 물웅덩이에 무언가 반짝인다. 손을 넣자 차가운 손가락이 반지를 쥐여 주었다.' },
      { id: 'crayon_note', t: 'paper', x: -3, z: 2, y: 0.05, label: '바닥의 크레용 낙서', kind: 'examine', hidden: true, req: ['crate_open'],
        text: '바닥에 크레용으로 그린 그림. 배 한 척과 집 한 채.\n릴리의 글씨: "집에 가는 길은 — 왔던 길을 거꾸로, 그리고 반대쪽으로!"' },
      { id: 'em_wheel', t: 'ship_wheel', x: 0, z: 2.5, label: '비상 조타기', kind: 'lock', req: ['crate_open'],
        lockedText: '비상 조타기. 쇠사슬로 묶여 있다. 화물칸의 비밀을 밝히면 풀릴 것 같다.',
        text: '화물칸의 비상 조타기. 이 배를 집으로 돌려보내자. (5번)',
        lock: { input: 'buttons', buttons: ['북', '동', '남', '서'], len: 5, answer: ['북', '서', '남', '서', '서'] }, wrongScare: true,
        on: { flag: 'home', sound: 'creak',
          story: T('귀항', `북, 서, 남, 서, 서.\n\n키를 다 돌리자 배 전체가 길게 신음했다.\n선체가 천천히, 아주 천천히 방향을 바꾼다. 95년 만에 집 쪽으로.\n\n화물칸 한가운데 매달린 선종(船鐘)이 저 혼자 울렸다.\n종에 새겨진 글씨가 빛나기 시작했다.`) } },
      { id: 'bell', t: 'ship_bell', x: 0, z: -1.2, label: '선종', kind: 'lock', req: ['home'], hidden: true,
        text: '종에 새겨진 글: "이 배의 불을 끈 자의 이름을 불러라. 그래야 종을 칠 수 있다." (이름 입력)',
        lock: { input: 'text', answer: ['박만수'] },
        on: { flag: 'confessed', ghost: 'stop', sound: 'bell', toast: '선장의 원혼이 무너져 내린다' } },
      { id: 'lifeboat', t: 'rowboat', x: 0, z: 6, label: '구명정', kind: 'door', req: ['confessed'], to: 'end',
        lockedText: '구명정이 쇠사슬에 묶여 있다. 선장이 사슬 끝을 쥐고 있다.' },
    ],
    coops: {
      gen: { on: { flag: 'power3', light: 'on', sound: 'power',
        story: T('발전기', `발전기가 기침하듯 돌아가며 비상등이 켜졌다.\n\n불빛 아래 드러난 화물칸. 상자 여섯 개.\n그리고 바닥 가득 — 작은 손자국과 발자국. 물에 젖은.\n\n구석에 쇠지렛대 하나가 떨어져 있다.`) } },
    },
    ghost: { type: 'sailor', speed: 2.5, sense: 9, teleport: 16, spawn: [0, -5], name: '선장 크로우', auto: true, captain: true },
    objectives: [
      { until: 'power3', text: '비상 발전기를 돌리자', hints: ['양쪽 벽의 시동줄을 8초 안에 함께 당기자.'] },
      { until: 'breakers', text: '배전반 차단기를 순서대로 올리자', hints: ['배전반을 클릭하면 램프가 깜빡이는 순서를 보여 준다.', '잘 보고 같은 순서로 누르자. "다시 보기"로 반복할 수 있다.'] },
      { until: 'crate_open', text: '진짜 화물이 든 상자를 찾자', hints: ['선장의 보험 계약서(인벤토리)를 읽자.', '"진짜는 왕관 도장 상자 하나뿐" — 여섯 상자의 도장을 확인하자.', '쇠지렛대를 들고 4번'] },
      { until: 'home', text: '배를 집으로 돌려보내자', hints: ['바닥의 크레용 낙서를 읽자.', '3장의 항로(동 동 북 동 남)를 거꾸로 하고, 방향을 반대로.', '북 → 서 → 남 → 서 → 서'] },
      { until: 'confessed', text: '선종에 그 이름을 새기자', hints: ['1장의 등대지기 일지를 떠올리자 (수첩 J).', '박만수'] },
      { until: '__end', text: '구명정으로 탈출하자', hints: ['계단 앞의 구명정.'] },
    ],
  },
];

export const SHIP_ENDINGS = {
  true: T('진 엔딩 · 귀항', `"박만수."

이름을 부르자 종이 울렸다. 한 번, 두 번… 여덟 번.
배의 당직이 끝났음을 알리는 여덟 점 종.

선장 크로우가 무릎을 꿇었다. 젖은 손에서 금시계가 미끄러져 떨어졌다.
"…나는 그저, 메리에게 돌아가고 싶었을 뿐이다."
그의 몸은 모래처럼 무너져 화물칸 바닥에 스며들었다.

구명정이 바다에 닿았을 때, 동쪽 하늘이 밝아오고 있었다.
흑등도 등대가 스스로 빛을 쏘아 오필리아호의 뱃머리를 비췄다.

갑판 난간에 112명이 서 있었다.
릴리가 하늘색 리본을 흔들었다. 한서진이 헤드폰을 벗고 고개를 숙였다.
가족사진 속 다섯 식구가 웃었다.

오필리아호는 등대 불빛을 따라, 천천히 수평선 너머로 미끄러져 갔다.
95년 늦은 귀항이었다.`),
  normal: T('엔딩 · 다시, 11월', `종이 울렸다. 선장은 무너졌고, 구명정은 바다에 닿았다.

그런데 등대 불빛은 끝내 켜지지 않았다.
유품을 돌려받지 못한 승객들은 갑판 난간에 선 채, 떠나는 구명정을 바라보기만 했다.

일 년 뒤 11월.
안개 낀 밤, 흑등도 앞바다에 다시 불 꺼진 여객선이 나타났다는 제보가 들어왔다.

함께 첨부된 사진 한 장.
갑판 난간에 늘어선 젖은 승객들 사이 —
심야방송 로고가 박힌 후드티를 입은 사람들이 서 있었다.

(승객들의 유품을 모두 모으면 다른 결말을 볼 수 있다)`),
};
