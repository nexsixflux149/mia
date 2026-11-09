/*
 * 시나리오 6 — 레드 메사 : 교수대 마을 (서부 웨스턴)
 * 1887년 6월 6일, 애리조나의 은광 마을 레드 메사. 오후 3시 10분에 은행 금고가 털렸다.
 * 은행가 모티머 밴스는 떠돌이 잭 모로우를 범인으로 지목했고, 증인 넷이 돈을 받고 거짓 증언을 했다.
 * 보안관 콜 브래디는 그 시각 잭이 살롱에서 하모니카를 불던 것을 보았지만 입을 다물었다.
 * 잭은 해 질 녘 교수대에 매달렸다. 그날 밤 모래폭풍이 마을을 삼켰고, 레드 메사는 지도에서 사라졌다.
 *
 * 퍼즐 유형: 현상금 계산, 전보 해독, 멈춘 시계, 자동 피아노 순서 기억, 결혼기념일 금고 다이얼,
 *           협동 광차 브레이크, 영문 이름 자물쇠, 마지막 말.
 */
const T = (title, text) => ({ title, text });

export const WEST_CHAPTERS = [
  // ─────────────────────────────── 1장
  {
    id: 0,
    title: '1장 · 레드 메사 중심가',
    place: '애리조나 사막 · 지도에 없는 마을 · 2026년 11월 9일 밤',
    outdoor: true,
    size: [26, 20],
    spawn: [0, 8],
    ambient: 'night',
    ground: '#6a4a2a', fog: 0.03,
    intro: T('1장 · 레드 메사 중심가', `66번 국도에서 한참 벗어난 사막 한가운데.
내비게이션에도 없는 마을 하나가 모래 속에서 떠올랐다.

살롱, 은행, 보안관 사무소. 1880년대 그대로의 나무 간판.
바람이 불 때마다 살롱 문이 혼자 삐걱 열렸다 닫힌다.

마을 한가운데 교수대에는 밧줄이 아직 매달려 있다.
밧줄이 — 바람도 없는데 흔들린다.

어디선가 하모니카 소리가 들린다. 아주 느리게.`),
    props: [
      { t: 'facade', x: -8.5, z: -8.4, label: 'SALOON', color: '#7a4a2a' }, { t: 'facade', x: 0, z: -8.6, label: 'BANK', color: '#6a5a4a' },
      { t: 'water_tower', x: -10.5, z: 3.5 }, { t: 'cactus', x: -11, z: 8 }, { t: 'cactus', x: 11.5, z: 7.5 }, { t: 'cactus', x: -6, z: 2.5 },
      { t: 'cactus', x: 11, z: -1 }, { t: 'hay', x: -6.5, z: -5 }, { t: 'barrel', x: -5.3, z: -5.6 }, { t: 'barrel', x: 5, z: -5.8 },
      { t: 'lantern', x: -3, z: -5 }, { t: 'lantern', x: 3, z: -5 }, { t: 'rock', x: 9, z: 8 }, { t: 'hay', x: 8, z: 1 },
    ],
    objects: [
      { id: 'gallows', t: 'gallows', x: 0, z: -1, label: '교수대', kind: 'examine', once: true,
        on: { flag: 'gallows', sound: 'creak', toast: '목표가 갱신되었습니다' },
        text: `낡은 교수대. 발판 아래 문이 반쯤 열려 있다.
기둥에 칼로 새긴 글씨.

  「잭 모로우 — 1887. 6. 6. 은행 강도의 죄로」

그 아래, 다른 손으로 덧새긴 글씨.

  「나는 훔치지 않았다」

밧줄 매듭에 손을 대자 차갑게 젖어 있다.` },
      { id: 'wanted', t: 'notice_board', x: -4, z: 5, r: 180, label: '현상수배 게시판', kind: 'examine',
        text: `【 WANTED 】

  잭 모로우 — 은행 강도
  현상금  $ 250

포스터 아래 누군가 연필로 적었다.
"현상금은 금방 오를 거야. 밴스 씨가 아주 화가 났거든."` },
      { id: 'telegram', t: 'paper', x: 6, z: 3, y: 1.05, label: '역마차의 전보', kind: 'examine',
        text: `역마차 좌석에 떨어진 전보 한 장.

  「보안관 사무소 귀하.
    잭 모로우의 현상금을 처음 액수의 다섯 배로 올릴 것.
    사무소 금고 번호도 새 현상금으로 바꿔 둘 것.
                                — 은행장 M. 밴스」` },
      { id: 'wagon', t: 'wagon', x: 6, z: 3, r: 20, kind: 'deco' },
      { id: 'office', t: 'facade', x: 8.5, z: -8.4, label: '보안관 사무소', color: '#5a4a3a', sign: 'SHERIFF', kind: 'lock',
        text: '보안관 사무소 문. 숫자 4자리 자물쇠가 달려 있다.',
        lock: { input: 'digits', len: 4, answer: '1250' },
        doneText: '열린 보안관 사무소. 책상 위에 일지가 펼쳐져 있다.',
        on: { flag: 'office', give: ['sheriff_log', 'west_relic_1'], sound: 'door', ghost: 'start',
          story: T('보안관 사무소', `책상 위에는 보안관의 일지, 그리고 압수품 상자.\n상자 안에 낡은 하모니카가 들어 있었다. 손잡이에 새겨진 글씨: "J.M."\n\n하모니카를 집어 드는 순간, 바깥에서 바람이 거세졌다.\n모래바람 속에서 사람 모양의 그림자가 일어선다.\n(손전등을 비추면 움직이지 못한다)`) } },
      { id: 'bank_clock', t: 'clock', x: 2.9, z: -7.75, y: 2.9, label: '은행 시계', kind: 'lock', req: ['office'],
        lockedText: '은행 정면의 시계. 바늘이 떨어져 나갔다. 무엇에 맞춰야 할지 모르겠다.',
        text: '바늘이 빠진 은행 시계. 시계를 그날 그 시각에 맞추면 문이 열릴 것 같다.',
        lock: { input: 'clock', answer: ['3:10'] }, wrongScare: true,
        on: { flag: 'bank_unlock', sound: 'bell', toast: '은행 문의 빗장이 풀렸다' } },
      { id: 'bank_door', t: 'door', x: 0, z: -7.7, label: '은행 정문', kind: 'door', req: ['bank_unlock'], to: 1,
        lockedText: '굳게 잠긴 은행 정문. 위쪽 시계와 빗장이 연결되어 있다.' },
    ],
    ghost: { type: 'shadow', speed: 2.2, sense: 7, lightFreeze: true, teleport: 24, spawn: [-10, -6], name: '모래바람 속 그림자' },
    objectives: [
      { until: 'gallows', text: '마을을 둘러보자', hints: ['마을 한가운데 교수대.'] },
      { until: 'office', text: '보안관 사무소를 열자', hints: ['현상수배 포스터와 역마차의 전보를 함께 보자.', '처음 현상금 $250의 다섯 배', '1250'] },
      { until: 'bank_unlock', text: '은행 시계를 맞추자', hints: ['인벤토리의 보안관 일지를 읽자.', '금고가 털린 시각', '3:10'] },
      { until: '__end', text: '은행으로 들어가자', hints: ['가운데 은행 정문.'] },
    ],
  },

  // ─────────────────────────────── 2장
  {
    id: 1,
    title: '2장 · 살롱과 은행',
    place: '레드 메사 은행 · 살롱 뒷방',
    size: [22, 14],
    spawn: [-8, 4],
    ambient: 'candle',
    floor: '#4a3020', wall: '#6a4428', fog: 0.05,
    walls: [{ x: 1, z: -3, w: 0.3, d: 8 }],
    intro: T('2장 · 살롱과 은행', `은행과 살롱은 안쪽 문 하나로 이어져 있었다.

살롱 테이블엔 카드가 펼쳐진 채, 위스키 잔엔 먼지가 고였다.
자동 피아노가 저 혼자 건반을 누른다. 같은 곡의 첫 소절만 계속.

은행 쪽 금고 문은 굳게 닫혀 있다.
금고 앞 바닥에 — 질질 끌린 발자국. 금고 안쪽으로 이어진다.

"내 금에 손대지 마시오." 정장 차림의 그림자가 계산대 뒤에서 일어섰다.`),
    props: [
      { t: 'bar_counter', x: -6, z: -5.8 }, { t: 'barrel', x: -9.3, z: -5.8 }, { t: 'barrel', x: -2.6, z: -6 },
      { t: 'chair', x: -4.2, z: 0.6 }, { t: 'chair', x: -5.8, z: 0.6 }, { t: 'lantern', x: -1, z: 5.5 }, { t: 'lantern', x: 4, z: 5.5 },
      { t: 'crate', x: 9.5, z: 5.8 }, { t: 'rug', x: 5.5, z: 1 },
    ],
    objects: [
      { id: 'poker', t: 'table', x: -5, z: 1.6, label: '포커 테이블', kind: 'examine', once: true,
        on: { flag: 'poker', sound: 'whisper' },
        text: `포커 테이블에 카드 다섯 장이 뒤집혀 있다. 그 옆에 접힌 쪽지.

"증인 수고비 — 한 사람당 $50.
 사환 토비, 대장장이 헨리, 술집 주인 메이, 우편배달부 샘.
 '오후 3시 10분에 잭이 은행에서 나오는 걸 보았다'고만 말할 것. — V"

쪽지 뒷면에 흐릿한 글씨: "나는 그 시각 살롱에서 하모니카를 불고 있었다."` },
      { id: 'piano', t: 'piano', x: -9.4, z: -1.5, r: 90, label: '자동 피아노', kind: 'lock',
        text: '저 혼자 건반을 누르는 자동 피아노. 눌리는 건반을 잘 보고 같은 순서로 따라 쳐 보자.',
        lock: { input: 'simon', buttons: ['도', '레', '미', '솔', '라'], colors: ['#e8d8b0', '#d6a050', '#c8603a', '#8a3a2a', '#5a2a1a'], answer: ['미', '솔', '라', '솔', '미', '레'] }, wrongScare: true,
        doneText: '피아노가 곡의 끝 소절까지 연주하고 멈췄다.',
        on: { flag: 'piano', give: 'west_relic_2', sound: 'organ',
          story: T('끝까지 연주된 곡', `마지막 건반을 누르자 피아노가 처음으로 곡을 끝까지 연주했다.\n잭이 그날 오후 살롱에서 불던 바로 그 곡.\n\n피아노 덮개가 열리며 카드 한 장이 떨어졌다. 스페이드 에이스.\n뒷면에 "행운의 카드 — 잭" 이라고 적혀 있다.`) } },
      { id: 'ledger', t: 'book', x: 6, z: -1.2, y: 0.95, label: '은행 장부', kind: 'examine',
        text: `【 레드 메사 은행 장부 · 1887년 】

6월 6일 — 금고 손실: 금괴 12개 (강도 잭 모로우의 소행)
6월 7일 — 밴스 개인 계좌 입금: 금괴 12개

장부 맨 뒤, 밴스의 메모:
"금고 다이얼은 아내가 정했다. 우리 결혼기념일, 그리고 올해로 몇 주년인지."` },
      { id: 'ledger_desk', t: 'desk', x: 6, z: -1.2, kind: 'deco' },
      { id: 'photo', t: 'frame', x: 10.85, z: 1, r: -90, y: 1.7, label: '밴스 부부 사진', kind: 'examine',
        text: '정장 차림의 밴스와 부인의 사진.\n\n액자 아래 금박 글씨:\n  「모티머 & 엘리너 밴스\n    결혼 7주년 기념 — 1887년 5월 2일」' },
      { id: 'vault', t: 'safe', x: 8.6, z: -5.4, r: -90, label: '은행 금고', kind: 'lock',
        text: '거대한 은행 금고. 다이얼 세 개에 각각 1~12 눈금이 있다.',
        lock: { input: 'rotate', rings: 3, positions: 12, labels: ['첫째 다이얼', '둘째 다이얼', '셋째 다이얼'], answer: [5, 2, 7] }, wrongScare: true,
        doneText: '열린 금고. 텅 비어 있다.',
        on: { flag: 'vault', give: ['church_key', 'west_relic_3'], sound: 'gate', scare: 'faces',
          story: T('은행 금고', `금고 안은 텅 비어 있었다. 금괴는 한 개도 없다.\n대신 바닥에 교회 열쇠와, 압수된 회중시계 하나.\n\n회중시계 뚜껑 안쪽: "J.M. — 오후 3시 10분에 멈춤"\n시계는 그 시각에 멈춰 있다. 잭이 살롱에 있던 시각.\n\n금고 벽에 손톱으로 긁은 글씨: "금은 헨리에게 맡겼다. 증인들은 교회에서 입을 다물게 할 것. — V"`) } },
      { id: 'mine_door', t: 'door', x: 10.85, z: 4, r: -90, label: '뒷문 — 언덕 위 교회로', kind: 'use',
        text: '언덕 위 교회로 이어지는 뒷문. 커다란 자물쇠가 걸려 있다.',
        use: { item: 'church_key', times: 1 }, needText: '교회 열쇠가 필요하다. (은행 금고)',
        on: { flag: 'church_open', sound: 'door', toast: '교회로 가는 문이 열렸다' }, toChapter: 2 },
    ],
    ghost: { type: 'father', speed: 2.4, sense: 7, teleport: 22, spawn: [8, -3], name: '은행장 밴스', auto: true },
    objectives: [
      { until: 'poker', text: '살롱을 살펴보자', hints: ['가운데 포커 테이블.'] },
      { until: 'vault', text: '은행 금고를 열자', hints: ['은행 장부의 메모와 벽의 부부 사진.', '결혼기념일 5월 2일, 7주년', '5 · 2 · 7'] },
      { until: '__end', text: '언덕 위 교회로 가자', hints: ['금고에서 나온 교회 열쇠를 오른쪽 뒷문에 사용하자. (자동 피아노에는 잭의 유품이 있다)'] },
    ],
  },

  // ─────────────────────────────── 3장 (교회와 공동묘지)
  {
    id: 2,
    title: '3장 · 교회와 공동묘지',
    place: '레드 메사 언덕 위 교회',
    outdoor: true,
    size: [24, 18],
    spawn: [0, 7],
    ambient: 'night',
    ground: '#4a3a2a', fog: 0.04,
    intro: T('3장 · 교회와 공동묘지', `은행 뒷문은 마을 언덕 위 작은 교회로 이어져 있었다.

교회 뒤 공동묘지. 나무 십자가들이 모래바람에 기울어 있다.
그중 네 개의 묘비만 새것처럼 반듯하다.

토비. 헨리. 메이. 샘.
잭이 은행에서 나오는 걸 '보았다'고 증언한 네 사람.
그들은 모두 그해가 가기 전에 죽었다.

종탑의 종이 바람도 없이 한 번 울렸다.
"…고해하러 왔나?"`),
    props: [
      { t: 'facade', x: 0, z: -8.4, label: 'CHURCH', color: '#8a8070' },
      { t: 'tombstone', x: -9, z: 2 }, { t: 'tombstone', x: -10, z: -2 }, { t: 'tombstone', x: 9.5, z: 3 }, { t: 'tombstone', x: 10, z: -2.5 },
      { t: 'tombstone', x: -6.5, z: 6 }, { t: 'tombstone', x: 7, z: 6.5 }, { t: 'tree', x: -10.5, z: -6.5, color: '#3a2a20' }, { t: 'tree', x: 10.5, z: -6.5, color: '#3a2a20' },
      { t: 'cactus', x: -11, z: 7.5 }, { t: 'lantern', x: -2.5, z: -5.5 }, { t: 'lantern', x: 2.5, z: -5.5 }, { t: 'rock', x: 5, z: 7.5 },
    ],
    objects: [
      { id: 'sermon', t: 'book', x: 0, z: -4.6, y: 1.0, label: '설교단의 고해 기록', kind: 'examine', once: true,
        on: { flag: 'sermon', sound: 'whisper', toast: '목표가 갱신되었습니다' },
        text: `【 목사 엘리야 포터의 고해 기록 】

1887년 6월 6일 밤, 네 사람이 차례로 찾아와 같은 죄를 고백했다.
"돈을 받고 거짓 증언을 했습니다. 잭은 살롱에 있었습니다."

나는 고해의 비밀을 지켰다. 그것이 내 죄다.

네 사람은 모두 그해가 가기 전에 하나씩 죽었다.
나는 그들을 이 언덕에, 죽은 순서대로 묻었다.
그들의 넋을 풀어 줄 참회의 종은 — 죽은 순서대로 이름을 불러야 울린다.` },
      { id: 'lectern', t: 'table', x: 0, z: -4.6, kind: 'deco' },
      { id: 'grave_toby', t: 'tombstone', x: -5, z: -1.5, label: '토비의 묘비', kind: 'examine', text: '「사환 토비 — 1887년 9월 1일, 열병으로 잠들다」\n\n묘비 뒷면에 손톱으로 긁은 글씨:\n"나는 아무것도 보지 못했다. 돈이 필요했을 뿐이다."' },
      { id: 'grave_henry', t: 'tombstone', x: -2, z: 2, label: '헨리의 묘비', kind: 'examine', text: '「대장장이 헨리 — 1887년 7월 14일, 대장간 화재로 잠들다」\n\n묘비 아래 그을린 편자 하나.\n"밴스가 금괴를 녹여 달라고 했다. 거절하자 불이 났다."' },
      { id: 'grave_may', t: 'tombstone', x: 2, z: 2, label: '메이의 묘비', kind: 'examine', text: '「살롱 주인 메이 — 1888년 1월 3일, 사막에서 실종」\n\n묘비 앞에 시든 들꽃.\n"그 사람은 그날 오후 내 가게에서 하모니카를 불었어. 내가 그 노래를 제일 좋아했는데."' },
      { id: 'grave_sam', t: 'tombstone', x: 5, z: -1.5, label: '샘의 묘비', kind: 'examine', text: '「우편배달부 샘 — 1887년 8월 2일, 말에서 떨어져 잠들다」\n\n묘비에 끈으로 묶인 우편 가방.\n"잭이 딸에게 쓴 편지를 받았지만… 부치지 않았다. 밴스가 태우라고 했다."' },
      { id: 'rope_a', t: 'handle', x: -3.6, z: -7.6, y: 1.2, label: '종탑 줄 (왼쪽)', kind: 'coop', text: '종탑 줄을 힘껏 당긴다!', coop: { group: 'ropes', need: 2 } },
      { id: 'rope_b', t: 'handle', x: 3.6, z: -7.6, y: 1.2, label: '종탑 줄 (오른쪽)', kind: 'coop', text: '종탑 줄을 힘껏 당긴다!', coop: { group: 'ropes', need: 2 } },
      { id: 'bell', t: 'bell', x: 0, z: -6.2, y: 0.9, label: '참회의 종', kind: 'lock', req: ['ropes'],
        lockedText: '종탑의 종이 녹슨 사슬에 묶여 있다. 양쪽 종탑 줄을 함께 당겨 사슬을 풀어야 한다.',
        text: '참회의 종. 거짓 증언한 네 사람의 이름을 차례로 부르며 종을 치자. (4번)',
        lock: { input: 'buttons', buttons: ['토비', '헨리', '메이', '샘'], len: 4, answer: ['헨리', '샘', '토비', '메이'] }, wrongScare: true,
        doneText: '종의 여운이 언덕 위에 오래 남아 있다.',
        on: { flag: 'bells', sound: 'bell', ghost: 'start',
          story: T('참회의 종', `네 번째 이름과 함께 종이 울리자, 네 묘비 위에 희미한 사람 그림자가 하나씩 섰다.\n그림자들이 동시에 교회 쪽을 가리켰다.\n\n교회 바닥에서 돌 긁히는 소리. 지하 납골당 입구가 드러났다.\n돌판 위에 십자가 모양의 홈이 파여 있다.\n\n그리고 묘지 끝에서 — 들꽃을 든 여자가 이쪽을 돌아본다.\n(손전등을 비추면 그 자리에 굳는다)`) } },
      { id: 'cross_sign', t: 'paper', x: -1.6, z: -6.6, y: 1.0, label: '납골당 안내판', kind: 'examine', hidden: true, req: ['bells'],
        text: '"지하 납골당 — 문을 여는 이는 십자가의 모양대로 돌을 누를 것. 가운데는 반드시 누를 것. 네 귀퉁이는 누르지 말 것." — E. 포터' },
      { id: 'crypt', t: 'iron_door', x: 0, z: -3.2, label: '지하 납골당 돌판', kind: 'lock', req: ['bells'],
        lockedText: '교회 바닥의 커다란 돌판. 꿈쩍도 하지 않는다.',
        text: '돌판 위에 3×3 칸의 돌 버튼. 눌린 돌과 안 눌린 돌로 모양을 만들어야 한다.',
        lock: { input: 'grid', size: 3, answer: '010111010' }, wrongScare: true,
        doneText: '열린 납골당 입구. 아래로 계단이 이어진다.',
        on: { flag: 'crypt', give: 'mine_key', sound: 'gate', scare: 'skull',
          story: T('지하 납골당', `돌판이 밀려나자 납골당에서 차가운 바람이 올라왔다.\n\n관 하나가 열려 있다. 헨리의 관. 안은 비어 있고, 금가루만 반짝인다.\n관 뚜껑 안쪽에 그을린 손으로 쓴 글씨:\n"금은 폐광 3번 갱도. 열쇠는 내가 가져간다. — 헨리"\n\n관 바닥에 녹슨 광산 열쇠가 놓여 있었다.`) } },
      { id: 'mine_path', t: 'path_gate', x: 11.5, z: -5, r: -90, label: '폐광 가는 길', kind: 'use',
        text: '언덕 너머 폐광으로 가는 길. 철문에 자물쇠가 걸려 있다.',
        use: { item: 'mine_key', times: 1 }, needText: '광산 열쇠가 필요하다. (지하 납골당)',
        on: { flag: 'mine_open', sound: 'gate', toast: '폐광 가는 철문이 열렸다' }, toChapter: 3 },
    ],
    coops: {
      ropes: { on: { flag: 'ropes', sound: 'bell',
        story: T('종탑 줄', `두 줄이 동시에 당겨지자 종을 묶고 있던 녹슨 사슬이 끊어졌다.\n\n종이 저 혼자 한 번 흔들렸다. 데엥.\n묘지의 네 묘비가 일제히 이쪽을 향해 기울었다.`) } },
    },
    ghost: { type: 'woman', speed: 2.1, sense: 7, lightFreeze: true, teleport: 22, spawn: [-9, -6], name: '살롱 주인 메이' },
    ghosts: [{ type: 'elder', speed: 1.9, sense: 6, startFlag: 'crypt', spawn: [9, -6], name: '목사 엘리야 포터' }],
    objectives: [
      { until: 'sermon', text: '교회를 살펴보자', hints: ['교회 앞 설교단의 고해 기록.'] },
      { until: 'ropes', text: '종탑 줄을 함께 당기자', hints: ['교회 양쪽 종탑 줄을 8초 안에 함께 당기자. (혼자라면 하나만)'] },
      { until: 'bells', text: '참회의 종을 울리자', hints: ['네 증인의 묘비에 죽은 날짜가 있다.', '7월 14일 헨리 · 8월 2일 샘 · 9월 1일 토비 · 이듬해 1월 3일 메이', '헨리 → 샘 → 토비 → 메이'] },
      { until: 'crypt', text: '지하 납골당을 열자', hints: ['납골당 안내판을 읽자.', '십자가 모양: 가운데 줄과 가운데 칸', '□■□ / ■■■ / □■□'] },
      { until: '__end', text: '폐광으로 가자', hints: ['납골당에서 나온 광산 열쇠를 오른쪽 길의 철문에 사용하자.'] },
    ],
  },

  // ─────────────────────────────── 4장
  {
    id: 3,
    title: '4장 · 폐광 — 마지막 진실',
    place: '레드 메사 은광',
    size: [20, 14],
    spawn: [-6, 5],
    ambient: 'abyss',
    startDark: true,
    floor: '#2a2018', wall: '#3a2c20', fog: 0.07,
    intro: T('4장 · 폐광', `갱도는 차갑고, 은빛 먼지가 손전등 빛에 반짝였다.

녹슨 레일 위에 광차 한 대. 바퀴에 쇠사슬이 감겨 있다.
갱도 깊은 곳에서 무언가 끌려오는 소리가 난다.

천장 기둥에 매달린 밧줄 하나.
그 아래 모자를 눌러쓴 사내가 서 있다. 발끝이 땅에 닿지 않는다.

"…아직도 내가 그 금을 훔쳤다고 생각하나?"`),
    props: [
      { t: 'rails', x: 0, z: 0 }, { t: 'pillar_c', x: -4, z: -2 }, { t: 'pillar_c', x: 4, z: -2 }, { t: 'crate', x: -8, z: -5 },
      { t: 'barrel', x: 8.4, z: -5.6 }, { t: 'lantern', x: -8.5, z: 1 }, { t: 'lantern', x: 8.5, z: 1 }, { t: 'puddle', x: 2, z: 3.5 },
    ],
    objects: [
      { id: 'brake_a', t: 'handle', x: -8.85, z: 4, r: 90, y: 1.2, label: '광차 브레이크 (서)', kind: 'coop', text: '브레이크 레버를 힘껏 당긴다!', coop: { group: 'brakes', need: 2 } },
      { id: 'brake_b', t: 'handle', x: 8.85, z: 4, r: -90, y: 1.2, label: '광차 브레이크 (동)', kind: 'coop', text: '브레이크 레버를 힘껏 당긴다!', coop: { group: 'brakes', need: 2 } },
      { id: 'letter', t: 'paper', x: -8, z: -5, y: 0.85, label: '상자 위 편지', kind: 'pickup', item: 'west_relic_4', hidden: true, req: ['brakes'],
        text: `잭이 감옥에서 쓴 마지막 편지.

  「사랑하는 딸 로즈에게.
    아빠는 금을 훔치지 않았단다. 그 시각엔 살롱에서 네가 좋아하던 노래를 불고 있었어.
    하모니카 안쪽에 네 이름을 새겼다. 아빠 대신 들고 다니렴.
    언젠가 누군가 아빠가 결백하다고 말해 주는 날이 오면, 그때 아빠는 편히 쉴 수 있을 거야.」

편지는 끝내 부쳐지지 못했다.` },
      { id: 'cart', t: 'mine_cart', x: 4.5, z: -4.5, label: '쇠사슬 감긴 광차', kind: 'lock', req: ['brakes'],
        lockedText: '어둠 속에서 광차가 혼자 앞뒤로 구른다. 너무 어두워 아무것도 보이지 않는다.',
        text: '광차 바퀴에 쇠사슬과 영문 4칸 자물쇠. 자물쇠에 새겨진 글: "그가 가장 사랑한 이름"',
        lock: { input: 'dial', wheels: [['A', 'E', 'L', 'O', 'R', 'S'], ['A', 'E', 'L', 'O', 'R', 'S'], ['A', 'E', 'L', 'O', 'R', 'S'], ['A', 'E', 'L', 'O', 'R', 'S']], answer: ['R', 'O', 'S', 'E'] }, wrongScare: true,
        on: { flag: 'cart', give: 'west_relic_5', sound: 'drag', scare: 'hang',
          story: T('광차', `사슬이 풀리자 광차가 레일을 따라 굴러가 벽에 부딪혔다.\n무너진 벽 너머에서 금괴 열두 개가 쏟아졌다. 모두 "V" 각인이 찍혀 있다.\n\n광차 바닥에 낡은 카우보이 모자 하나. 안쪽에 "J.M."\n\n밧줄 아래의 사내가 천천히 고개를 들었다.\n모자 그늘 속에서 두 눈이 당신을 본다.`) } },
      { id: 'jack', t: 'noose', x: 0, z: -4.2, label: '밧줄 아래의 사내', kind: 'lock', req: ['cart'],
        lockedText: '천장에 매달린 밧줄. 그 아래 사내의 그림자가 흔들린다. 아직은 말을 걸 수 없다.',
        text: '모자를 눌러쓴 사내가 쉰 목소리로 묻는다.\n"…140년이야. 이제 누가 말해 주겠나?" (말 입력)',
        lock: { input: 'text', answer: ['당신은결백해요', '당신은결백해', '결백해요', '결백해', '당신은결백합니다', '결백합니다', '당신은죄가없어요', '죄가없어요', '당신은훔치지않았어요', '훔치지않았어요', '범인은밴스예요', '범인은밴스', '당신잘못이아니에요', '잭당신은결백해요', '잭은결백해요'] },
        on: { flag: 'truth', ghost: 'stop', sound: 'bell', toast: '밧줄이 끊어져 떨어졌다' } },
      { id: 'exit', t: 'door', x: -2, z: 6.85, r: 180, label: '갱도 출구', kind: 'door', req: ['truth'], to: 'end',
        lockedText: '갱도 출구를 모래가 막고 있다. 모래 속에서 누군가 속삭인다. "아직이야."' },
    ],
    coops: {
      brakes: { on: { flag: 'brakes', light: 'on', sound: 'gate',
        story: T('브레이크', `두 레버가 동시에 당겨지자 광차가 끼익 멈췄다.\n그 진동에 갱도 벽의 낡은 등불들이 하나씩 불을 밝혔다.\n\n상자 위에 누렇게 바랜 편지가 보인다.\n그리고 광차 바퀴의 자물쇠도.`) } },
    },
    ghost: { type: 'headless', speed: 2.4, sense: 8, teleport: 20, spawn: [6, -4], name: '보안관 콜 브래디', auto: true },
    objectives: [
      { until: 'brakes', text: '광차를 멈추자', hints: ['양쪽 벽의 브레이크 레버를 8초 안에 함께 당기자. (혼자라면 하나만)'] },
      { until: 'cart', text: '광차 자물쇠를 풀자', hints: ['상자 위 잭의 편지.', '하모니카에 새긴 딸의 이름', 'R · O · S · E'] },
      { until: 'truth', text: '사내에게 대답하자', hints: ['편지의 마지막 문장.', '"누군가 아빠가 ___ 고 말해 주는 날"', '당신은 결백해요'] },
      { until: '__end', text: '갱도를 빠져나가자', hints: ['남쪽 출구.'] },
    ],
  },
];

export const WEST_ENDINGS = {
  true: T('진 엔딩 · 해 뜨는 레드 메사', `"당신은 결백해요."

사내가 모자를 벗었다. 140년 만에 처음으로 얼굴이 보였다.
그는 하모니카를 입에 대고, 딸이 좋아하던 노래를 끝까지 불었다.

하모니카, 행운의 카드, 회중시계, 편지, 모자.
다섯 개의 유품이 빛이 되어 그의 품으로 돌아갔다.

갱도 밖으로 나오자 모래폭풍이 걷혀 있었다.
교수대는 무너져 있었고, 동쪽 하늘이 붉게 밝아 왔다.

한 달 뒤, 애리조나 주 기록 보관소는 1887년 레드 메사 은행 강도 사건의 기록을 정정했다.
「피고 잭 모로우 — 무죄」

그의 후손이라는 노부인이 편집실로 편지를 보내왔다.
봉투 안엔 꽃잎 한 장. 장미였다.`),
  normal: T('엔딩 · 새 현상수배', `"당신은 결백해요."

밧줄이 끊어졌고, 사내는 모래바람 속으로 흩어졌다.
그런데 유품을 다 돌려받지 못한 그는 아직 떠나지 못했다.

당신들은 무사히 사막을 빠져나왔다. 그런 줄 알았다.

다음 날 아침, 촬영 차량 앞유리에 종이 한 장이 붙어 있었다.

  【ＷＡＮＴＥＤ】
  레드 메사 은행 강도 일당 — 현상금 $ 1,250

포스터 속 얼굴들은 — 당신들이었다.

(잭의 유품을 모두 모으면 다른 결말을 볼 수 있다)`),
};
