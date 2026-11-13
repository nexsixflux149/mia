/*
 * 히든 테마 — 데드 시티 : 마지막 헬기 (7챕터 · 역대급 퍼즐 · 난이도 최상)
 * 모든 테마를 한 번씩 깨거나 만렙(Lv.20)이 되면 열린다.
 *
 * 2026년 11월 13일 새벽, 한빛시. 'R-9' 감염 사태 사흘째.
 * 방송 크루는 버려진 무전기로 구조 헬기 '매-7'의 마지막 방송을 듣는다. "05시 정각, 그랜드 한빛 백화점 옥상."
 * 정문은 용접되어 있다. 지하주차장 → 1층 → 2·3층 → 4층 → 5층 보안실 → 옥상 헬리포트로 올라가야 한다.
 *
 * 반전 1: 무전기 너머의 조종사 한도윤은 8살 딸 하린이를 찾는 아빠였다. 백화점 어딘가에 하린이가 숨어 있다.
 * 반전 2: 생존자들을 5층에 가둔 보안실장 강철민은 4층 약국의 백신을 혼자 쓰려 했다. 그는 이미 물렸다.
 *         옥상에서 마지막으로 길을 막는 것은 — 감염된 강철민이다.
 * 진 엔딩: 하린이의 물건 · 엄마의 쪽지 · 백신 · 생존자 명단까지 일곱 가지를 모두 챙기면 하린이와 함께 헬기에 오른다.
 */
const T = (title, text) => ({ title, text });
const Z = (spawn, o = {}) => ({ type: 'zombie', speed: 1.7, sense: 6, hearRun: true, spawn, name: '감염자', ...o });

export const ZOMBIE_CHAPTERS = [
  // ─────────────────────────────── 1장 · 무너진 거리
  {
    id: 0, title: '1장 · 무너진 거리', place: '한빛시 중앙로 · 2026년 11월 13일 새벽 3시 50분',
    outdoor: true, size: [32, 24], spawn: [0, 9], ambient: 'dusk', ground: '#58585e', fog: 0.022,
    intro: T('1장 · 무너진 거리', `불 꺼진 도시. 뒤집힌 버스, 깨진 쇼윈도, 멈춘 신호등.
'R-9' 감염 사태 사흘째, 한빛시 중앙로에는 산 사람이 보이지 않는다.

길 건너 그랜드 한빛 백화점 꼭대기에서 붉은 항공등이 깜빡인다.
발밑에 버려진 무전기에서 잡음이 새어 나온다.

멀리서 — 무언가가 아스팔트를 질질 끄는 소리.

(히든 테마! 좀비는 손전등 불빛과 뛰는 발소리에 몰려와요. 손전등을 끄고 조심조심(V) 움직이면 거의 들키지 않아요.)`),
    props: [
      { t: 'facade', x: -8, z: -13.2, color: '#4a4a52' }, { t: 'facade', x: -2, z: -13.2, color: '#5a5a62' }, { t: 'facade', x: 4, z: -13.2, color: '#4a4a52' }, { t: 'facade', x: 10, z: -13.2, color: '#5a5a62' },
      { t: 'car', x: 6, z: 4, r: 15, wreck: true }, { t: 'car', x: -3, z: -3, r: -80 }, { t: 'car', x: 11, z: -5, r: 95 },
      { t: 'car', x: -12.5, z: -7, r: 10, police: true }, { t: 'barricade', x: 1.6, z: -6.5 }, { t: 'barricade', x: -4.5, z: -7.5, r: 10 }, { t: 'sandbags', x: 8.6, z: -7.6 },
      { t: 'lamp', x: -6, z: 7 }, { t: 'lamp', x: 9, z: 8 }, { t: 'lamp', x: 0.6, z: -9.4 }, { t: 'bus_stop', x: -12, z: 9, r: 90 },
      { t: 'house', x: -13, z: -1, r: 90 }, { t: 'house', x: 13.5, z: 1.5, r: -90 }, { t: 'vending', x: 13.8, z: 7.5, r: -90 },
      { t: 'debris', x: 3, z: 1 }, { t: 'debris', x: -7, z: -5 }, { t: 'blood_smear', x: 0, z: 4 }, { t: 'blood_smear', x: 9, z: 0 }, { t: 'bottles', x: 12, z: 10 },
      { t: 'leaves', x: -2, z: 7 }, { t: 'signpost', x: 3.6, z: 8.5 },
    ],
    objects: [
      { id: 'radio', t: 'radio', x: 1.6, z: 7.4, label: '버려진 무전기', kind: 'examine', once: true,
        on: { flag: 'radio', sound: 'tune_static', toast: '목표가 갱신되었습니다',
          story: T('구조 방송', `치익— 치이익—
"…여기는 구조 헬기 매-7. 한빛시 생존자에게 알린다.
 05시 정각, 그랜드 한빛 백화점 옥상 헬리포트. 이것이 마지막 비행이다.
 반복한다, 05시 정각. 더는 기다릴 수 없다.
 …그리고 혹시— 노란 풍선을 든 여자아이를 본 사람은… 무전 97.3으로…"

방송이 끊겼다. 지금 시각 새벽 3시 52분. 남은 시간은 한 시간 남짓.
그때, 무전기 소리를 들은 무언가가 버스 뒤에서 고개를 들었다.`) },
        text: '"…매-7… 05시… 옥상…" 같은 방송이 반복된다. 주파수 다이얼은 97.3 MHz 에 맞춰져 있다.' },
      { id: 'front', t: 'iron_door', x: -2, z: -12.4, label: '백화점 정문 셔터', kind: 'examine',
        text: `정문 셔터는 안쪽에서 용접되어 있다. 붉은 스프레이 글씨.

  "감염자 격리 중 — 절대 열지 말 것.  보안실장 강철민"

셔터 아래 틈으로 손가락 수십 개가 꿈틀거린다. 정문은 안 된다.
오른쪽 지하주차장 입구는 전기만 들어오면 열릴 것 같다.` },
      { id: 'garage_sign', t: 'notice_board', x: 4.2, z: -10.2, label: '지하주차장 안내판', kind: 'examine',
        text: `【 그랜드 한빛 백화점 지하주차장 】
  정전 시 셔터 수동 개방 금지 — 비상 발전기 가동 후 배전반 연결.
  셔터는 무거우니 양쪽 손잡이를 두 사람이 동시에 들어 올릴 것.

누군가 매직으로 덧썼다: "발전기 기름 없음. 택시 트렁크에 예비 기름통 있었음"` },
      { id: 'pharm_cal', t: 'poster', x: -11.1, z: 5.2, y: 1.5, r: 90, label: '약국 창문의 달력', kind: 'examine',
        text: `'한빛 24시 약국' 창문 안쪽에 걸린 달력. 3월 칸에 하트가 그려져 있다.
  "3월 17일 ♥ 우리 약사님 생신 — 케이크 사 오기!"

셔터 아래 쪽지: "셔터 비번은 약사님 생일. 잊지 마! — 알바생"` },
      { id: 'pharmacy', t: 'iron_door', x: -11.1, z: 2.2, r: 90, label: '24시 약국 셔터', kind: 'lock',
        text: '약국 셔터에 네 자리 번호 자물쇠. 안에 비상 조명이 켜져 있다.',
        lock: { input: 'digits', len: 4, answer: '0317' }, wrongScare: true,
        doneText: '약국 셔터가 반쯤 올라가 있다. 약사는… 계산대 뒤에 쓰러져 있다.',
        on: { flag: 'pharm', give: 'fuse', sound: 'door', scare: 'face',
          story: T('약국', `셔터를 올리자 진열대 사이에서 약사 가운이 휙 돌아섰다.
— 하얀 가운에 피가 말라붙은 '그것'. 약사님이었다.

계산대 뒤 두꺼비집 서랍에서 예비 퓨즈를 집어 들고 뛰쳐나왔다.
(얻은 퓨즈는 배전함에 끼우자. 약사였던 감염자가 쫓아온다!)`) } },
      { id: 'receipt', t: 'paper', x: 10, z: 6.6, y: 0.02, label: '편의점 영수증', kind: 'examine',
        text: `편의점 바닥에 떨어진 영수증. 마지막 손님의 구매 내역.

  03:02  ① 생수 2L      ② 컵라면      ③ 건전지(AA)      ④ 초코바

뒷면 볼펜 글씨: "카운터 금고 비번 = 마지막 손님이 산 순서대로 버튼. — 점장"` },
      { id: 'register', t: 'cash_register', x: 10.6, z: 5.2, r: -90, label: '편의점 카운터 금고', kind: 'lock',
        text: '카운터 아래 작은 금고. 상품 그림이 그려진 버튼 네 개가 있다.',
        lock: { input: 'buttons', buttons: ['컵라면', '초코바', '생수', '건전지'], len: 4, answer: ['생수', '컵라면', '건전지', '초코바'] },
        doneText: '빈 금고. 영수증 냄새만 남았다.',
        on: { flag: 'register', give: 'battery', sound: 'unlock', toast: '건전지를 얻었다' } },
      { id: 'bus_inside', t: 'box', x: -6.6, z: 4.4, label: '뒤집힌 버스 문', kind: 'pickup', item: 'car_remote',
        text: '깨진 창문으로 손을 넣자 좌석 밑에 택시 스마트키가 굴러다닌다.\n"한빛 개인택시 3157" — 배터리가 다 됐는지 눌러도 반응이 없다.\n(건전지와 조합해 보자: 인벤토리에서 우클릭/길게 누르기 → 조합)', takenText: '버스 안에는 더 쓸 만한 게 없다.' },
      { id: 'bus_window', t: 'bus', x: -9, z: 2, r: 70, label: '뒤집힌 버스 뒷유리', kind: 'examine',
        text: '김이 서린 버스 뒷유리. 작은 손바닥 자국이 남아 있다.',
        reveal: { item: 'flashlight', flag: 'ribbon_seen', text: `손전등을 비추자 손가락으로 쓴 글씨가 떠올랐다.

  "하린이 여기 숨었었어요. 풍선 리본은 정류장 의자 밑에 두고 가요.
   아빠 헬기 오면 백화점 옥상! — 한하린 8살"` } },
      { id: 'ribbon', t: 'ribbon', x: -12, z: 8, y: 0.3, label: '정류장 의자 밑 노란 리본', kind: 'pickup', item: 'zb_relic_1', hidden: true, req: ['ribbon_seen'],
        text: '버스 정류장 의자 밑에 노란 풍선 리본이 묶여 있다. 풍선은 터지고 끈만 남았다.\n리본에 사인펜 글씨: "하린 ♥ 아빠"', takenText: '의자 밑에는 이제 아무것도 없다.' },
      { id: 'taxi', t: 'car', taxi: true, x: 8.6, z: 9.6, r: 90, label: '한빛 개인택시 3157', kind: 'use',
        text: '노란 개인택시. 트렁크가 잠겨 있다. 스마트키가 있으면 열 수 있다.',
        use: { item: 'car_remote_on', times: 1 }, needText: '스마트키가 필요하다. (버스 안에서 키를 찾고, 건전지와 조합하자)',
        doneText: '트렁크가 열려 있다. 경보음이 아직 울린다.',
        on: { flag: 'alarm', give: 'fuel_can', sound: 'honk', toast: '🚨 자동차 경보가 울린다! 좀비들이 몰려온다!',
          story: T('경보', `삐빅— 트렁크가 열리는 순간, 택시 경보가 온 거리에 울려 퍼졌다.
빵빵빵빵—!

트렁크에서 빨간 예비 기름통을 꺼냈다.
사방의 어둠에서 신음 소리가 일제히 이쪽을 향한다.
(얼른 발전기로! 뛰면 더 멀리서 들킨다)`) } },
      { id: 'generator', t: 'generator', x: 11.6, z: -8.4, label: '비상 발전기', kind: 'use',
        text: '주차장 입구 옆 비상 발전기. 연료 게이지가 0이다.',
        use: { item: 'fuel_can', times: 1 }, needText: '연료가 없다. 기름통이 필요하다.',
        doneText: '발전기가 덜덜덜 돌아가고 있다.',
        on: { flag: 'gen', sound: 'drag', toast: '발전기가 돌아가기 시작했다' } },
      { id: 'fusebox', t: 'fusebox', x: 13.2, z: -12.92, y: 1.5, label: '배전함', kind: 'use',
        text: '주차장 셔터용 배전함. 퓨즈 칸 하나가 비어 있다.',
        use: { item: 'fuse', times: 1 }, needText: '퓨즈가 비어 있다. 약국 두꺼비집에 예비 퓨즈가 있을지도.',
        doneText: '새 퓨즈가 끼워져 있다.',
        on: { flag: 'fuse_in', sound: 'unlock', toast: '퓨즈를 끼웠다' } },
      { id: 'wire_memo', t: 'notice_board', x: 6.2, z: -8.2, r: 20, label: '전기공의 메모', kind: 'examine',
        text: `게시판에 테이프로 붙여 둔 메모.

  배전반 전선 연결 (헷갈리지 말 것!)
   · 간판에는 — 맑은 하늘 같은 색
   · 셔터에는 — 피 같은 색
   · 신호등에는 — "건너가도 돼" 하는 불빛의 색
   · 남은 하나는 가로등` },
      { id: 'panel', t: 'panel', x: 11.4, z: -11.6, label: '배전반 전선', kind: 'lock', req: ['gen', 'fuse_in'],
        lockedText: '배전반에 전기가 없다. 발전기를 돌리고 퓨즈부터 끼우자.',
        text: '네 가닥 전선을 알맞은 곳에 연결하자.',
        lock: { input: 'wires', left: ['빨강', '파랑', '노랑', '초록'], right: ['백화점 간판', '지하주차장 셔터', '가로등', '신호등'], colors: ['#d6303a', '#3b7dd8', '#e8c13a', '#2fbf71'], answer: ['지하주차장 셔터', '백화점 간판', '가로등', '신호등'] },
        doneText: '전선이 모두 연결되어 있다.',
        on: { flag: 'power', sound: 'unlock',
          story: T('전원', `파지직— 거리의 가로등이 하나씩 켜지고, 백화점 간판에 불이 들어왔다.
「GRAND HANBIT」

지하주차장 셔터 모터가 윙 돌다가… 반쯤에서 덜컥 멈췄다.
두 사람이 양쪽 손잡이를 동시에 들어 올려야 한다.`) } },
      { id: 'lever_l', t: 'handle', x: 6.0, z: -12.1, y: 1.0, label: '셔터 손잡이 (왼쪽)', kind: 'coop', req: ['power'], lockedText: '전기가 들어오지 않아 셔터가 꿈쩍도 않는다.', coop: { group: 'garage', need: 2 }, text: '셔터를 들어 올렸다' },
      { id: 'lever_r', t: 'handle', x: 9.4, z: -12.1, y: 1.0, label: '셔터 손잡이 (오른쪽)', kind: 'coop', req: ['power'], lockedText: '전기가 들어오지 않아 셔터가 꿈쩍도 않는다.', coop: { group: 'garage', need: 2 }, text: '셔터를 들어 올렸다' },
      { id: 'garage_door', t: 'iron_door', x: 7.7, z: -12.4, label: '지하주차장 입구', kind: 'door', req: ['garage'], to: 1, lockedText: '셔터가 반쯤 내려와 있다. 두 사람이 양쪽 손잡이를 동시에!' },
    ],
    coops: { garage: { on: { flag: 'garage', sound: 'gate', toast: '셔터가 올라갔다!',
      story: T('지하주차장', `으라차— 셔터가 끼익 소리를 내며 끝까지 올라갔다.
아래로 내려가는 경사로. 깊은 어둠 속에서 차가운 바람이 올라온다.
등 뒤로 감염자들의 발소리가 점점 가까워진다.`) } } },
    ghosts: [
      Z([-6, -2], { auto: true, name: '거리의 감염자' }),
      Z([10, 2], { auto: true, name: '넥타이를 맨 감염자', speed: 1.5 }),
      Z([-13, 3], { startFlag: 'pharm', name: '약사였던 감염자', speed: 2.0 }),
      Z([13, 9], { startFlag: 'alarm', name: '경보를 듣고 온 감염자', speed: 2.2, sense: 8 }),
    ],
    objectives: [
      { until: 'radio', text: '버려진 무전기를 들어 보자', hints: ['시작 지점 앞 바닥의 무전기를 클릭.'] },
      { until: 'fuse_in', text: '배전함에 끼울 퓨즈를 구하자', hints: ['백화점 정문은 막혔다. 오른쪽 지하주차장 안내판을 읽자.', '왼쪽 약국 창문의 달력: 3월 17일', '약국 셔터 0317 → 얻은 퓨즈를 오른쪽 안쪽 배전함에!'] },
      { until: 'gen', text: '비상 발전기에 기름을 넣자', hints: ['안내판 낙서: 택시 트렁크에 기름통.', '뒤집힌 버스 안에서 스마트키, 편의점 영수증 순서로 카운터 금고(생수→컵라면→건전지→초코바)에서 건전지.', '스마트키 + 건전지 조합 → 택시 트렁크 → 기름통을 발전기에!'] },
      { until: 'power', text: '배전반 전선을 이어 전기를 살리자', hints: ['셔터 앞 게시판의 전기공 메모.', '하늘색=파랑, 피=빨강, 건너도 되는 불빛=초록', '빨강→셔터 · 파랑→간판 · 노랑→가로등 · 초록→신호등'] },
      { until: 'garage', text: '셔터 손잡이를 두 사람이 동시에!', hints: ['셔터 양옆 손잡이를 8초 안에 둘 다 클릭. (혼자라면 하나만 눌러도 돼요)'] },
      { until: '__end', text: '지하주차장으로 내려가자', hints: ['열린 셔터를 클릭.', '(선택) 버스 뒷유리를 손전등으로 비추면 숨은 물건이 있다.'] },
    ],
  },

  // ─────────────────────────────── 2장 · 지하주차장
  {
    id: 1, title: '2장 · 지하주차장', place: '그랜드 한빛 백화점 지하 2층 주차장 · 새벽 4시 03분',
    size: [30, 22], spawn: [-11, 8], ambient: 'dark', floor: '#4a4a4e', wall: '#5a5a5e', fog: 0.045, startDark: true,
    intro: T('2장 · 지하주차장', `비상등만 희미하게 깜빡이는 지하 2층.
차들은 주차된 그대로, 문이 열린 채 버려져 있다.
어디선가 똑, 똑, 물 떨어지는 소리. 그리고 — 차 안에서 무언가가 창문을 긁는다.

손전등이 없으면 한 치 앞도 보이지 않는다.
1층으로 가는 비상계단은 출구 차단기 너머에 있다.`),
    props: [
      { t: 'car', x: -6, z: -6, r: 0 }, { t: 'car', x: -3, z: -6, r: 0 }, { t: 'car', x: 3, z: -6.2, r: 180 }, { t: 'car', x: 6, z: -6, r: 0, wreck: true },
      { t: 'car', x: -6, z: 6, r: 180 }, { t: 'car', x: 3, z: 6, r: 0 }, { t: 'car', x: 9, z: 5.6, r: 180 },
      { t: 'pillar_c', x: -8, z: 0 }, { t: 'pillar_c', x: 0, z: 0 }, { t: 'pillar_c', x: 8, z: 0 },
      { t: 'shop_cart', x: -1, z: 3, r: 40 }, { t: 'shop_cart', x: 11, z: -2, r: -20 }, { t: 'debris', x: 4, z: 2 }, { t: 'blood_smear', x: -4, z: 1.5 }, { t: 'blood_smear', x: 10, z: 1 },
      { t: 'puddle', x: 1, z: -2 }, { t: 'pipe_run', x: 0, z: -10.6 }, { t: 'barrel', x: 13.5, z: 9.5 },
    ],
    objects: [
      { id: 'ticket', t: 'paper', x: -11, z: 5.4, y: 0.05, label: '바닥의 주차권', kind: 'pickup', item: 'parking_ticket',
        text: '구겨진 주차권이 떨어져 있다. (인벤토리에서 읽을 수 있어요)', takenText: '바닥에는 기름 얼룩만 남았다.' },
      { id: 'pay', t: 'cash_register', x: 12.4, z: 7.4, r: -90, label: '출구 정산기', kind: 'lock',
        text: '출구 정산기 화면: "주차권 비밀번호 4자리를 입력하세요"',
        lock: { input: 'digits', len: 4, answer: '2130' },
        doneText: '"정산 완료. 안녕히 가십시오." 차단기가 올라가 있다.',
        on: { flag: 'barrier', sound: 'unlock', toast: '출구 차단기가 올라갔다!' } },
      { id: 'pillar_a', t: 'poster', x: -8, z: 0.46, y: 1.5, label: 'A구역 기둥', kind: 'examine', text: '"A" 라고 크게 쓰인 기둥. 페인트가 벗겨져 있다.',
        reveal: { item: 'flashlight', flag: 'pa', text: '손전등을 비추자 형광 스프레이 숫자가 떠올랐다:  A = 4' } },
      { id: 'pillar_b', t: 'poster', x: 0, z: 0.46, y: 1.5, label: 'B구역 기둥', kind: 'examine', text: '"B" 라고 크게 쓰인 기둥.',
        reveal: { item: 'flashlight', flag: 'pb', text: '형광 스프레이 숫자:  B = 9' } },
      { id: 'pillar_c', t: 'poster', x: 8, z: 0.46, y: 1.5, label: 'C구역 기둥', kind: 'examine', text: '"C" 라고 크게 쓰인 기둥.',
        reveal: { item: 'flashlight', flag: 'pc', text: '형광 스프레이 숫자:  C = 1' } },
      { id: 'booth_note', t: 'poster', x: -14.9, z: -6.6, y: 1.5, r: 90, label: '경비실 창문 메모', kind: 'examine',
        text: `경비실 창문에 붙은 교대 메모.

  "야간 근무자 보세요. 경비실 비번 바꿨습니다.
   기둥마다 형광으로 써 둔 숫자 기억하시죠? (불 끄면 보여요)
   C, A, B 순서로 누르고 — 마지막 한 자리는 세 숫자를 다 더한 값의 끝자리.
   — 보안실장 강철민"` },
      { id: 'booth', t: 'iron_door', x: -14.85, z: -3.4, r: 90, label: '주차 경비실 문', kind: 'lock',
        text: '경비실 문 번호 자물쇠. 네 자리.',
        lock: { input: 'digits', len: 4, answer: '1494' }, wrongScare: true,
        doneText: '경비실 문이 열려 있다.',
        on: { flag: 'booth', give: 'stair_key', sound: 'door', scare: 'hands',
          story: T('경비실', `문을 열자 의자에 앉은 경비원이 천천히 고개를 돌렸다.
목에 이빨 자국. 흐릿한 눈.
— 벌떡 일어선 그것을 피해 책상 위 열쇠 꾸러미를 낚아챘다. "비상계단 1F"

(경비원이었던 감염자가 일어났다! 책상 위 CCTV 화면도 확인하자)`) } },
      { id: 'cctv', t: 'crt_tv', x: -13.8, z: -0.8, r: 90, label: '경비실 CCTV 화면', kind: 'examine', req: ['booth'], once: true,
        lockedText: '경비실 안쪽에 CCTV 화면이 깜빡인다. 문이 잠겨 있다.',
        on: { flag: 'cctv', sound: 'tune_static' },
        text: `녹화 화면 · 11월 10일 03:40 · 3층 완구 매장
노란 풍선을 든 여자아이가 장난감 가게 안으로 뛰어 들어간다.
뒤따라온 여자가 아이를 볼풀 안에 숨기고 — 무언가를 피해 반대쪽으로 달려간다.

같은 날 03:55 · 5층 문화센터
보안실장 강철민이 사람들을 안으로 밀어 넣고 방화 셔터를 내린다.
그는 냉장 가방 하나를 소중하게 끌어안고 있다.` },
      { id: 'light_panel', t: 'fusebox', x: -2, z: -10.9, y: 1.5, label: '주차장 조명 배전반', kind: 'lock',
        text: '조명 스위치 아홉 개가 엉켜 있다. 하나를 누르면 이웃한 스위치도 함께 뒤집힌다. 아홉 개를 모두 켜자.',
        lock: { input: 'grid', size: 3, lightsOut: true, answer: '111111111' },
        doneText: '주차장 형광등이 모두 켜져 있다.',
        on: { flag: 'lights', light: 'on', sound: 'unlock', toast: '💡 주차장 조명이 켜졌다!' } },
      { id: 'lift_sign', t: 'poster', x: 6.2, z: -10.94, y: 1.5, label: '화물 엘리베이터 안내문', kind: 'examine',
        text: `【 화물용 엘리베이터 】
  · 정원 상자 3개
  · 정확히 25kg 일 때만 작동합니다 (과적·미달 시 정지)
  · 내용물: 1층 화장품관 반품 상자

누군가 볼펜으로: "엘리베이터 안에 아기 엄마 쪽지 있음. 하린이 꼭 찾아 주세요"` },
      { id: 'lift', t: 'gold_crate', x: 9, z: -10, label: '화물 엘리베이터 저울', kind: 'lock',
        text: '화물 엘리베이터 바닥이 저울이다. 무게가 적힌 상자 여섯 개 중 세 개를 올려 정확히 25kg 을 맞추자.',
        lock: { input: 'balance', weights: [3, 5, 7, 9, 11, 12], target: 25, pick: 3, answer: [5, 9, 11] },
        doneText: '엘리베이터 문이 열려 있다.',
        on: { flag: 'lift', give: 'zb_relic_2', sound: 'bell',
          story: T('엄마의 쪽지', `띵— 화물 엘리베이터 문이 열렸다. 바닥에 접힌 쪽지 한 장.

  "하린아. 엄마가 꼭 다시 올게.
   볼풀 속에 꼭꼭 숨어 있다가, 아빠 헬기 소리가 나면 옥상으로 가.
   토끼 인형은 엄마 대신 꼭 안고 있어. 엄마는 2층에서… 괜찮아. 사랑해."

쪽지 끝이 피로 얼룩져 있다.`) } },
      { id: 'stairs', t: 'stairs_up', x: 13.2, z: -8.6, r: -90, label: '1층 비상계단', kind: 'use', req: ['barrier'],
        lockedText: '출구 차단기가 내려져 있어 비상계단으로 갈 수 없다.',
        text: '1층으로 올라가는 비상계단. 철문이 잠겨 있다.', use: { item: 'stair_key', times: 1 }, needText: '철문이 잠겨 있다. 경비실 열쇠 꾸러미가 필요하다.',
        on: { flag: 'stairs', toast: '비상계단 문이 열렸다' }, toChapter: 2 },
    ],
    ghosts: [
      Z([4, -3], { auto: true, name: '주차장의 감염자' }),
      Z([-4, 8], { auto: true, name: '차에서 기어 나온 감염자', speed: 1.4 }),
      Z([-12, -3], { startFlag: 'booth', name: '경비원이었던 감염자', speed: 2.0, sense: 7 }),
    ],
    objectives: [
      { until: 'barrier', text: '출구 차단기를 올리자', hints: ['시작 지점 근처 바닥의 주차권을 줍고 인벤토리에서 읽자.', '"입차 시각을 거꾸로": 03:12 → 거꾸로', '2130'] },
      { until: 'booth', text: '경비실에서 비상계단 열쇠를 찾자', hints: ['경비실 창문 메모: C, A, B 순서 + 합의 끝자리.', '세 기둥을 손전등을 켠 채 살펴보자 (A=4, B=9, C=1)', '1 · 4 · 9 · (1+4+9=14 → 4) = 1494'] },
      { until: '__end', text: '비상계단으로 1층에 올라가자', hints: ['열쇠를 들고 오른쪽 안 비상계단을 클릭.', '(선택) 조명 배전반: 모서리 → 가운데 순서로 눌러 보자', '(선택) 화물 엘리베이터: 25kg = 5 + 9 + 11'] },
    ],
  },

  // ─────────────────────────────── 3장 · 1층 화장품·명품관
  {
    id: 2, title: '3장 · 1층 화장품·명품관', place: '그랜드 한빛 백화점 1층 · 새벽 4시 12분',
    size: [32, 24], spawn: [-13, 9], ambient: 'shop', floor: '#d8d0c4', wall: '#e8e0d4', fog: 0.035,
    intro: T('3장 · 1층 화장품·명품관', `반짝이던 대리석 바닥 위에 쏟아진 향수병과 립스틱.
명품관 쇼윈도의 마네킹들은 모두 출구 쪽을 향해 쓰러져 있다.

멈춘 에스컬레이터 위에 감염자 셋이 서 있다. 꼼짝도 않는다.
천장 스피커에서 영업 종료 음악이 끝없이 반복된다.
"고객 여러분, 오늘도 그랜드 한빛 백화점을 찾아 주셔서…"`),
    props: [
      { t: 'dept_counter', x: -6, z: -3, r: 0 }, { t: 'dept_counter', x: -6, z: 3, r: 180 }, { t: 'dept_counter', x: 3, z: -7.5, r: 0 },
      { t: 'mannequin_row', x: 9, z: 8.6, r: 180 }, { t: 'mannequin_row', x: 13.5, z: 0, r: -90 }, { t: 'pillar', x: -2, z: 0 }, { t: 'pillar', x: 6, z: 0 },
      { t: 'escalator', x: 1, z: 8.4, r: 180 }, { t: 'shop_cart', x: -10, z: -6 }, { t: 'debris', x: 8, z: -3 }, { t: 'blood_smear', x: -3, z: 6 }, { t: 'bottles', x: -8, z: 0 },
      { t: 'rug', x: -13, z: 6 }, { t: 'speaker_pole', x: -14.5, z: -10 }, { t: 'string_lights', x: 0, z: -11, len: 20 },
    ],
    objects: [
      { id: 'info', t: 'dept_counter', x: -11, z: 7, r: 90, label: '안내 데스크', kind: 'examine',
        text: `【 GRAND HANBIT 층별 안내 】
  R   헬리포트 (관계자 외 출입 금지)
  5F  문화센터 · 보안실
  4F  가전 · 식당가 · 한빛 약국
  3F  아동 · 완구
  2F  여성 · 남성 패션
  1F  화장품 · 명품
  B2  주차장

데스크 위 공지: "정전으로 에스컬레이터 정지. 재가동은 에스컬레이터 옆 제어반에서."` },
      { id: 'perfume', t: 'dept_counter', x: -2.6, z: -7.5, label: '향수 진열대', kind: 'examine',
        text: `향수 세 병만 넘어지지 않고 서 있다. 병 밑에 숫자 스티커.

  · 빨간 뚜껑 '로즈'  — ②
  · 검은 뚜껑 '머스크' — ⑥
  · 보라 뚜껑 '라벤더' — ④

진열대 옆 직원 메모: "제어반 다이얼은 뚜껑 색 빨강 → 검정 → 보라 순서 (매주 향수 바꿀 때 같이 바뀜)"` },
      { id: 'escal_ctrl', t: 'control_panel', x: 4.6, z: 4.2, r: -90, label: '에스컬레이터 제어반', kind: 'lock',
        text: '에스컬레이터 재가동 다이얼 세 개. 각각 1~8.',
        lock: { input: 'rotate', rings: 3, positions: 8, labels: ['① 다이얼', '② 다이얼', '③ 다이얼'], answer: [2, 6, 4] },
        doneText: '에스컬레이터가 위로 천천히 돌고 있다.',
        on: { flag: 'escal', sound: 'drag', toast: '에스컬레이터가 다시 움직인다!',
          story: T('에스컬레이터', `우우웅— 멈췄던 에스컬레이터가 다시 돌기 시작했다.
그 위에 서 있던 감염자 셋이 계단을 따라 천천히 — 이쪽으로 내려온다.`) } },
      { id: 'mirror', t: 'mirror', x: -6, z: -1.9, y: 0.95, label: '화장품 매장 거울', kind: 'examine',
        text: '립스틱으로 무언가 쓰였다가 지워진 거울. 희미한 자국만 남았다.',
        reveal: { item: 'flashlight', flag: 'mirror_seen', text: `손전등을 비스듬히 비추자 지워진 립스틱 글씨가 보인다.

  "하린아, 엄마 머리핀 너한테 줄게. 테스터 서랍에 넣어 둘게.
   2층으로 가면 안 돼. 거기 그것들이 너무 많아.
   3층 장난감 가게 — 볼풀에서 기다려."` } },
      { id: 'hairpin', t: 'chest', x: -6, z: 4.6, label: '화장품 테스터 서랍', kind: 'pickup', item: 'zb_relic_3', hidden: true, req: ['mirror_seen'],
        text: '테스터 서랍 안에 별 모양 머리핀 하나. 작은 손글씨 쪽지가 감겨 있다. "엄마 꺼 — 하린이 줄게"', takenText: '서랍에는 립스틱 부스러기뿐.' },
      { id: 'showcase', t: 'cups_table', x: 9, z: -4, label: '명품관 보석 쇼케이스', kind: 'lock',
        text: `깨진 쇼케이스 안에 뒤집힌 보석함 세 개. 하나에만 직원 카드키가 들어 있다고 메모가 붙어 있다.
"반짝이는 카드가 든 함을 잘 보고 — 섞이는 동안 눈을 떼지 마세요."`,
        lock: { input: 'cups', cups: 3, swaps: 12, start: 1 },
        doneText: '빈 보석함 세 개.',
        on: { flag: 'card', give: 'card_2f', sound: 'pickup', toast: '직원용 카드키를 얻었다 (2층 셔터용)' } },
      { id: 'chime', t: 'radio', x: -14, z: -8.6, label: '안내 방송실 차임', kind: 'lock',
        text: `방송실 차임벨. 여기서 방송을 틀면 1층의 감염자들이 스피커 쪽으로 몰려갈지도 모른다.
불이 켜지는 순서를 잘 보고 똑같이 눌러 보자.`,
        lock: { input: 'simon', buttons: ['도', '미', '솔', '도↑'], colors: ['#ff6a6a', '#ffd36a', '#6ae0a0', '#6ab0ff'], answer: ['도', '솔', '미', '도↑', '솔', '미'] },
        doneText: '차임이 반복해서 울린다. 감염자들이 반대편 스피커 아래 몰려 있다.',
        on: { flag: 'chime', ghost: 'stop', sound: 'bell',
          story: T('차임', `띵 — 동 — 댕 — 동…
"고객 여러분께 안내 말씀드립니다…"

천장 스피커에서 차임이 크게 울리자 감염자들이 일제히 고개를 들었다.
그리고 소리를 따라 반대편 명품관 쪽으로 비틀비틀 몰려갔다.
(1층의 감염자들이 더는 쫓아오지 않는다)`) } },
      { id: 'up', t: 'iron_door', x: 1, z: 11.85, r: 180, label: '2층 에스컬레이터 셔터', kind: 'use', req: ['escal'],
        lockedText: '에스컬레이터가 멈춰 있다. 제어반부터.',
        text: '2층으로 이어지는 에스컬레이터 위 셔터. 직원 카드 리더기가 있다.', use: { item: 'card_2f', times: 1 }, needText: '카드키가 필요하다. 명품관 쇼케이스 어딘가에…',
        on: { flag: 'to2', toast: '셔터가 올라갔다' }, toChapter: 3 },
    ],
    ghosts: [
      Z([3.5, 6], { auto: true, name: '에스컬레이터의 감염자', speed: 1.6 }),
      Z([10, 3], { auto: true, name: '명품관 직원이었던 감염자' }),
      Z([-1.5, 5], { startFlag: 'escal', name: '계단을 내려온 감염자', speed: 1.9 }),
      Z([3.5, 9], { startFlag: 'escal', name: '계단을 내려온 감염자', speed: 1.5 }),
    ],
    objectives: [
      { until: 'escal', text: '에스컬레이터를 다시 움직이자', hints: ['입구 안내 데스크 공지를 읽자.', '향수 진열대: 빨강 → 검정 → 보라 뚜껑 순서', '② ⑥ ④'] },
      { until: 'card', text: '2층 셔터용 카드키를 찾자', hints: ['명품관 보석 쇼케이스: 섞이는 함을 끝까지 눈으로 쫓자.', '(팁) 방송실 차임을 먼저 울리면 1층 감염자들이 멀어진다: 도·솔·미·도↑·솔·미'] },
      { until: '__end', text: '2층으로 올라가자', hints: ['에스컬레이터 위 셔터에 카드키를 쓰자.', '(선택) 화장품 거울을 손전등으로 비추면 숨은 물건이 있다.'] },
    ],
  },

  // ─────────────────────────────── 4장 · 2·3층 패션·아동관
  {
    id: 3, title: '4장 · 3층 아동·완구관', place: '그랜드 한빛 백화점 2층 → 3층 · 새벽 4시 21분',
    size: [32, 24], spawn: [-13, 9], ambient: 'shop', floor: '#c8d8e8', wall: '#f0e8f0', fog: 0.035,
    intro: T('4장 · 3층 아동·완구관', `2층 패션관은 지옥이었다. 피팅룸마다 무언가가 문을 두드렸다.
숨을 죽이고 3층까지 단숨에 뛰어 올라왔다.

알록달록한 아동관. 회전목마 모양 진열대에 먼지가 쌓였고,
어디선가 오르골 소리가 끊어질 듯 이어진다.
장난감 가게 셔터 너머 — 아이의 숨소리?`),
    props: [
      { t: 'toy_blocks', x: -8, z: 6 }, { t: 'teddy', x: -6.5, z: 7 }, { t: 'rocking_horse', x: -10, z: -2, r: 30 }, { t: 'balloon_stand', x: 4, z: 8 },
      { t: 'kimono_rack', x: 12, z: 7.6, r: -90 }, { t: 'mannequin_row', x: 12, z: -2, r: -90 }, { t: 'doll_shelf', x: -15.6, z: -4, r: 90 }, { t: 'shelf', x: -3, z: -10.6 },
      { t: 'pillar', x: -2, z: 1 }, { t: 'pillar', x: 6, z: 1 }, { t: 'shop_cart', x: 2, z: 4, r: 70 }, { t: 'debris', x: 8, z: 4 }, { t: 'blood_smear', x: 0, z: -2 },
      { t: 'teacup', x: 8, z: -7, color: '#ffb0d0' }, { t: 'bunting', x: 0, z: -11, len: 22 }, { t: 'curtain', x: 15.8, z: 2, r: -90 },
    ],
    objects: [
      { id: 'photo_wall', t: 'easel', x: -6, z: -3, label: '찢어진 가족사진', kind: 'lock',
        text: '사진관 이젤 위에 조각조각 찢어진 가족사진 퍼즐. 조각을 밀어 맞춰 보자.',
        lock: { input: 'slide', size: 3, image: 'zombie', answer: '12345678_' },
        doneText: '맞춰진 가족사진. 헬멧을 든 아빠, 엄마, 노란 원피스의 아이.',
        on: { flag: 'photo', sound: 'bell',
          story: T('가족사진', `조각이 맞춰지자 웃고 있는 세 사람이 나타났다.
비행 헬멧을 옆구리에 낀 아빠, 엄마, 그리고 노란 풍선을 든 여자아이.

사진 아래 금색 글씨:
  "하린이 생일 축하해 🎂  2018. 08. 24  — 아빠·엄마"

비행 헬멧에 적힌 이름은 — "한도윤". 무전 속 그 조종사였다.`) } },
      { id: 'toy_shutter', t: 'iron_door', x: -15.85, z: 4.8, r: 90, label: '장난감 가게 셔터', kind: 'lock',
        text: '"꿈나무 완구" 셔터. 아이 눈높이에 네 자리 번호 자물쇠가 달려 있다. 스티커: "하린이 생일로 바꿔 둠 — 엄마"',
        lock: { input: 'digits', len: 4, answer: '0824' }, wrongScare: true,
        doneText: '장난감 가게 셔터가 올라가 있다.',
        on: { flag: 'toy', sound: 'door', toast: '셔터가 올라갔다' } },
      { id: 'ballpit', t: 'box', x: -12.4, z: 2.6, s: 1.4, label: '볼풀', kind: 'examine', req: ['toy'], once: true,
        lockedText: '장난감 가게 셔터 너머 볼풀이 보인다.',
        on: { flag: 'ballpit', sound: 'giggle', scare: 'child' },
        text: `볼풀 공을 헤치자 — 아이는 없었다. 대신 크레파스 그림 한 장.

헬리콥터 그림. 조종석에 "아빠", 옆 창문에 "하린".
  "엄마가 안 와요. 나 먼저 옥상 가서 숨어 있을게요.
   아빠 헬기 오면 물탱크 방에서 '토끼야~' 하고 부르면 나올게요!
   (깡총이는 오르골 위에 두고 가요)"` },
      { id: 'musicbox', t: 'music_box', x: -9.4, z: 5, label: '하린이의 오르골', kind: 'lock', req: ['ballpit'],
        lockedText: '먼지 쌓인 오르골. 태엽이 다 풀려 있다.',
        text: `오르골 위에 토끼 인형이 앉아 있다. 오르골 바닥에 글씨:
  "태엽은 하린이 나이만큼만 감아 주세요. 더 감으면 고장 나요."`,
        lock: { input: 'tune', min: 1, max: 12, step: 1, unit: '바퀴', answer: 8, tol: 0.4 },
        doneText: '오르골이 잔잔하게 돌아간다.',
        on: { flag: 'musicbox', give: ['zb_relic_4', 'lift_key'], sound: 'musicbox',
          story: T('오르골', `태엽을 여덟 번 감자 오르골이 '반짝반짝 작은 별'을 연주했다.
오르골 서랍이 열리며 작은 열쇠 하나 — "직원용 승강기".
토끼 인형 '깡총이'의 귀에는 하린이 이름표가 꿰매져 있다.`) } },
      { id: 'clock', t: 'clock', x: 4, z: -11.9, y: 2.2, label: '멈춘 벽시계', kind: 'examine',
        text: '아동관 벽시계가 멈춰 있다. 시곗바늘을 돌릴 수 있는 손잡이가 달려 있다. 직원 출입문과 연결된 듯하다.' },
      { id: 'staff_clock', t: 'clock', x: 9.6, z: 11.9, y: 1.6, r: 180, label: '직원 출입문 시계 잠금장치', kind: 'lock',
        text: `직원 출입문에 작은 시계 잠금장치. 메모:
  "감염 사태가 시작된 그날 그 시각에 맞추세요. (CCTV 녹화 시각)"`,
        lock: { input: 'clock', answer: ['3:40', '03:40', '15:40'] },
        doneText: '직원 출입문이 열려 있다.',
        on: { flag: 'staff', sound: 'unlock', toast: '직원 출입문이 열렸다',
          story: T('직원 통로', `시계를 3시 40분에 맞추자 철컥, 직원 출입문이 열렸다.
좁은 통로 끝에 직원용 승강기. 그 앞에 — 피 묻은 어린이 운동화 한 짝.`) } },
      { id: 'fitting', t: 'curtain', x: 15.8, z: 6.6, r: -90, label: '피팅룸 커튼', kind: 'examine', once: true,
        on: { scare: 'face', sound: 'growl' },
        text: '커튼을 젖히자 — 거울 속 내 얼굴 바로 뒤에 회색 얼굴이 붙어 있었다!\n…돌아보니 아무도 없다. 거울에 피 묻은 손자국만.' },
      { id: 'lift', t: 'iron_door', x: 12.6, z: 11.85, r: 180, label: '직원용 승강기', kind: 'use', req: ['staff'],
        lockedText: '직원 출입문이 잠겨 있다.',
        text: '4층까지만 가는 직원용 승강기. 열쇠 구멍이 있다.', use: { item: 'lift_key', times: 1 }, needText: '승강기 열쇠가 필요하다.',
        on: { flag: 'to4', toast: '승강기가 올라간다' }, toChapter: 4 },
    ],
    ghosts: [
      Z([4, -4], { auto: true, name: '아동복 매장의 감염자', speed: 1.6 }),
      Z([10, 3], { auto: true, name: '풍선을 든 감염자' }),
      Z([-10, 0], { startFlag: 'toy', name: '빠르게 달리는 감염자', speed: 2.5, sense: 7 }),
    ],
    objectives: [
      { until: 'photo', text: '찢어진 가족사진을 맞추자', hints: ['왼쪽 이젤의 사진 퍼즐. 숫자 1~8 순서로 맞추면 된다.'] },
      { until: 'toy', text: '장난감 가게 셔터를 열자', hints: ['사진 아래 생일 날짜를 보자.', '2018. 08. 24', '0824'] },
      { until: 'musicbox', text: '하린이의 흔적을 따라가자', hints: ['볼풀을 살펴보자.', '오르골: 하린이 나이만큼 (엄마의 쪽지·버스 유리 낙서)', '8바퀴'] },
      { until: 'staff', text: '직원 출입문 시계를 맞추자', hints: ['감염이 시작된 그날의 CCTV 녹화 시각 (지하주차장 경비실)', '3시 40분'] },
      { until: '__end', text: '직원용 승강기로 4층에 가자', hints: ['오르골에서 얻은 승강기 열쇠를 직원용 승강기에 쓰자.'] },
    ],
  },

  // ─────────────────────────────── 5장 · 4층 가전·식당가·약국
  {
    id: 4, title: '5장 · 4층 식당가와 약국', place: '그랜드 한빛 백화점 4층 · 새벽 4시 31분',
    size: [32, 24], spawn: [12, 9], ambient: 'shop', floor: '#7a7068', wall: '#9a8e80', fog: 0.035,
    intro: T('5장 · 4층 식당가와 약국', `가전 매장의 TV 수십 대가 동시에 같은 뉴스를 틀고 있다.
식당가 테이블 위에는 먹다 만 음식이 사흘째 그대로다.

5층으로 가는 에스컬레이터는 의자와 카트로 쌓은 바리케이드에 막혀 있고,
그 너머에서 감염자들이 바리케이드를 밀어 댄다. 쿵. 쿵. 쿵.`),
    props: [
      { t: 'tv_wall', x: -8, z: -11.7 }, { t: 'tv_wall', x: -3.6, z: -11.7 }, { t: 'table', x: 4, z: 0 }, { t: 'table', x: 8, z: 0 }, { t: 'table', x: 4, z: 4 }, { t: 'table', x: 8, z: 4 },
      { t: 'chair', x: 3, z: 0 }, { t: 'chair', x: 9, z: 4, r: 180 }, { t: 'stall', x: 12, z: -6, r: -90 }, { t: 'stall', x: 12, z: -1, r: -90 },
      { t: 'vending', x: -15.4, z: 8, r: 90 }, { t: 'med_cabinet', x: -15.5, z: -8, r: 90 }, { t: 'shelf', x: -10, z: -6, r: 90 }, { t: 'pillar', x: 0, z: -4 }, { t: 'pillar', x: 0, z: 5 },
      { t: 'debris', x: -4, z: 6 }, { t: 'blood_smear', x: 6, z: 2 }, { t: 'bottles', x: 10, z: 8 }, { t: 'escalator', x: -6, z: 8.2, r: 180 },
    ],
    objects: [
      { id: 'news', t: 'tv_wall', x: 1, z: -11.7, label: '가전 매장 TV', kind: 'examine', once: true,
        on: { flag: 'news', sound: 'tune_static' },
        text: `【 긴급 속보 · 11월 13일 】
"…'R-9' 감염의 원인은 넥서스 제약 한빛 연구소의 임상시험 바이러스로 확인됐습니다.
 유일한 백신 샘플은 사태 첫날인 11월 10일, 연구원이 그랜드 한빛 백화점 4층 약국에 맡긴 것으로…
 정부는 생존자와 백신 샘플을 05시 마지막 헬기로 이송할 계획입니다…"` },
      { id: 'menu', t: 'poster', x: 15.94, z: -3.6, y: 1.6, r: -90, label: '식당가 메뉴판', kind: 'examine',
        text: `식당가 메뉴판. 메뉴마다 방향 화살표가 붙어 있다 (주문 줄 안내).
   ↑ 비빔밥      → 우동      ↓ 돈까스      ← 떡볶이

옆에 붙은 쪽지: "매니저님 금고는 '오늘의 메뉴' 순서대로 화살표 — 바꾸지 마세요"` },
      { id: 'today', t: 'paper', x: 8, z: 4, y: 0.82, label: '테이블 위 오늘의 메뉴', kind: 'examine',
        text: '"11월 10일 오늘의 메뉴:  우동 → 떡볶이 → 비빔밥 → 돈까스"\n그날 이후 아무도 메뉴를 바꾸지 않았다.' },
      { id: 'safe', t: 'safe', x: 15.4, z: 3.6, r: -90, label: '식당가 매니저 금고', kind: 'lock',
        text: '화살표 다이얼 네 개가 달린 금고.',
        lock: { input: 'dial', wheels: [['↑', '→', '↓', '←'], ['↑', '→', '↓', '←'], ['↑', '→', '↓', '←'], ['↑', '→', '↓', '←']], answer: ['→', '←', '↑', '↓'] },
        doneText: '빈 금고.',
        on: { flag: 'safe', give: 'pharm_card', sound: 'unlock', toast: '약국 출입 카드를 얻었다' } },
      { id: 'pharm_door', t: 'iron_door', x: -15.85, z: 0.4, r: 90, label: '한빛 약국 유리문', kind: 'use',
        text: '"한빛 약국" 유리문. 카드 리더기에 빨간불.', use: { item: 'pharm_card', times: 1 }, needText: '약국 출입 카드가 필요하다.',
        doneText: '약국 문이 열려 있다.',
        on: { flag: 'pharm', sound: 'door', scare: 'hands', toast: '약국 문이 열렸다 — 안에서 무언가 움직인다!' } },
      { id: 'vaccine_label', t: 'poster', x: -15.94, z: -5.6, y: 1.6, r: 90, label: '냉장고 라벨', kind: 'examine', req: ['pharm'],
        lockedText: '약국 안쪽에 의약품 냉장고가 보인다.',
        text: `의약품 냉장고 문의 라벨.
  [넥서스 제약 · R-9 백신 샘플 1회분]
  보관 2~8℃ · 반출 시 로트번호 입력
  로트번호 = 맡긴 날짜 (월·일 4자리)` },
      { id: 'fridge', t: 'med_cabinet', x: -15.5, z: -3.4, r: 90, label: '의약품 냉장고', kind: 'lock', req: ['pharm'],
        lockedText: '약국 문이 잠겨 있다.',
        text: '냉장고 디지털 잠금. 네 자리 로트번호.',
        lock: { input: 'digits', len: 4, answer: '1110' },
        doneText: '텅 빈 냉장고. 차가운 김만 흘러나온다.',
        on: { flag: 'vaccine', give: 'zb_relic_5', sound: 'bell',
          story: T('백신', `냉장고 문이 열리자 푸른 빛이 도는 앰플 한 개가 놓여 있었다.
「R-9 VACCINE · 1 dose」

그런데 냉장고 안쪽 벽에 손톱으로 긁은 글씨.
  "강철민이 이걸 가져가려고 한다. 그는 이미 물렸다. 혼자 살려고.
   백신을 헬기에 실어 주세요. — 약사 윤지아"`) } },
      { id: 'radio4', t: 'radio', x: -8, z: 8.4, label: '가전 매장 무전기', kind: 'lock',
        text: `진열된 무전기 하나에 배터리가 남아 있다. 주파수를 맞추면 헬기와 교신할 수 있을지도.
(1장 구조 방송: "무전 ○○.○ 으로")`,
        lock: { input: 'tune', min: 88, max: 108, step: 0.1, unit: 'MHz', answer: 97.3, tol: 0.15 },
        doneText: '무전기에서 헬기 소리가 섞인 잡음이 들린다.',
        on: { flag: 'call', sound: 'heli',
          story: T('교신', `치익— "…여기는 매-7. 들리나? 생존자인가!"
떨리는 목소리. 뒤로 회전날개 소리.

"나는 조종사 한도윤이다. 내 딸 하린이가 그 백화점에 있다. 8살, 노란 원피스.
 …제발. 05시까지 옥상에 데려와 줄 수 있겠나.
 옥상 비상문 번호는 0500, 출발 시각이다. 그리고 하린이를 부를 땐—
 '토끼야' 라고 불러 줘. 우리 둘만의 암호야."`) } },
      { id: 'fire_box', t: 'med_cabinet', x: 2.4, z: 11.6, r: 180, label: '소화전 함', kind: 'lock',
        text: `"비상시 깨시오" 소화전 함. 유리 위에 안전 퀴즈가 붙어 있다.
  "비상구 표시등은 무슨 색일까요? 정답을 적으면 함이 열립니다."`,
        lock: { input: 'text', answer: ['초록', '초록색', '녹색', '초록불', '연두'] },
        doneText: '빈 소화전 함.',
        on: { flag: 'axe', give: 'fire_axe', sound: 'glass', toast: '🪓 소방 도끼를 얻었다' } },
      { id: 'barricade', t: 'barricade', x: -6, z: 11.2, label: '에스컬레이터 바리케이드', kind: 'use', req: ['call'],
        lockedText: '의자와 카트로 쌓은 바리케이드. 너머에서 감염자들이 밀어 댄다. 어디로 가야 할지 먼저 알아야 한다… (무전기?)',
        text: '5층 에스컬레이터를 막은 바리케이드. 도끼로 내리치면 부술 수 있을 것 같다.',
        use: { item: 'fire_axe', times: 1 }, needText: '맨손으로는 안 된다. 소화전 함에 도끼가 있을지도.',
        on: { flag: 'to5', sound: 'bang', scare: 'faces', toast: '바리케이드가 무너졌다!' }, toChapter: 5 },
    ],
    ghosts: [
      Z([4, 2], { auto: true, name: '식당가의 감염자' }),
      Z([-6, -6], { auto: true, name: '가전 매장 직원이었던 감염자', speed: 1.5 }),
      Z([-13, -3], { startFlag: 'pharm', name: '약국의 감염자', speed: 2.1 }),
      Z([-3, 8], { startFlag: 'axe', name: '바리케이드를 넘어온 감염자', speed: 2.3, sense: 8 }),
    ],
    objectives: [
      { until: 'safe', text: '식당가 매니저 금고를 열자', hints: ['TV 뉴스를 보고, 오른쪽 메뉴판을 읽자.', '테이블 위 오늘의 메뉴 순서를 화살표로 바꾸자.', '우동→ · 떡볶이← · 비빔밥↑ · 돈까스↓  =  → ← ↑ ↓'] },
      { until: 'vaccine', text: '약국 냉장고에서 백신을 찾자', hints: ['약국 출입 카드로 왼쪽 약국 유리문을 열자.', '냉장고 라벨: 맡긴 날짜 (TV 뉴스: 사태 첫날)', '11월 10일 → 1110'] },
      { until: 'call', text: '무전기로 헬기와 교신하자', hints: ['가전 매장 무전기. 1장 구조 방송에서 말한 주파수.', '97.3 MHz'] },
      { until: '__end', text: '바리케이드를 부수고 5층으로!', hints: ['소화전 함 퀴즈: 비상구 표시등 색 = 초록', '도끼를 들고 에스컬레이터 바리케이드를 클릭.'] },
    ],
  },

  // ─────────────────────────────── 6장 · 5층 보안실
  {
    id: 5, title: '6장 · 5층 보안실', place: '그랜드 한빛 백화점 5층 문화센터 · 새벽 4시 43분',
    size: [28, 22], spawn: [-11, 8], ambient: 'candle', floor: '#5a5a62', wall: '#7a7a84', fog: 0.04,
    intro: T('6장 · 5층 보안실', `5층 문화센터. 방화 셔터 너머로 갇혔던 사람들의 흔적.
벽마다 이름과 날짜, 그리고 "강철민" 이라는 이름 위에 그어진 붉은 줄.

복도 끝 보안실에서 모니터 불빛이 새어 나온다.
그리고 보안실 안에서 — 무언가 철문에 몸을 부딪치는 소리.
옥상까지 남은 시간, 17분.`),
    props: [
      { t: 'desk', x: -6, z: -2 }, { t: 'desk', x: -3, z: -2 }, { t: 'desk', x: -6, z: 2 }, { t: 'desk', x: -3, z: 2 }, 
      { t: 'piano', x: 3, z: -9.6 }, { t: 'lockers', x: 10.4, z: -10.7 }, { t: 'pillar', x: 2, z: 0 }, { t: 'desk', x: 11.6, z: -6.6 }, { t: 'desk', x: 9.4, z: -7 }, { t: 'crt_tv', x: 13.2, z: 2.2, r: -90 },
      { t: 'debris', x: 6, z: 6 }, { t: 'blood_smear', x: 0, z: 4 }, { t: 'handprints', x: -13.9, z: 0, y: 1.2, r: 90 }, { t: 'shop_cart', x: 8, z: 8 },
      { t: 'sandbags', x: 5, z: -2, r: 90 },
    ],
    objects: [
      { id: 'names', t: 'blackboard', x: -7, z: -10.8, label: '문화센터 칠판', kind: 'examine', once: true,
        on: { flag: 'names', sound: 'whisper' },
        text: `칠판 가득 분필 글씨.
  "우리는 감염되지 않았다. 강 실장이 우리를 여기 가뒀다."
  "그는 냉장 가방을 끌어안고 보안실에 틀어박혔다."
  "11/11 — 물 떨어짐.  11/12 — 셔터 밖에서 강 실장 비명.  11/12 밤 — 셔터가 열렸다. 다들 옥상 계단으로…"
  맨 아래 작은 글씨: "노란 옷 아이가 옥상 물탱크 쪽으로 혼자 올라가는 걸 봤어요"` },
      { id: 'sec_door', t: 'iron_door', x: 13.85, z: -1.6, r: -90, label: '보안실 철문', kind: 'lock',
        text: '보안실 철문 키패드. 버튼 불빛이 깜빡이는 순서를 기억해 같은 순서로 누르자. (안에서 쿵쿵 소리가 난다…)',
        lock: { input: 'simon', buttons: ['1', '2', '3', '4'], colors: ['#ff5a5a', '#5ab0ff', '#ffd35a', '#5aff9a'], answer: ['3', '1', '4', '1', '2', '4', '3'] },
        doneText: '보안실 철문이 열려 있다.',
        on: { flag: 'sec', sound: 'door', scare: 'face', ghost: 'start',
          story: T('보안실', `철문이 열리는 순간 피 묻은 경비복이 튀어나왔다 — 경비원이었다.
그 뒤로 보안실 책상 위에 펼쳐진 일지, 꺼지지 않은 모니터 여섯 대.
그리고 비어 있는 냉장 가방. 강철민은 이미 여기 없다.`) } },
      { id: 'diary', t: 'book', x: 11.6, z: -6.6, y: 0.77, label: '보안실장의 일지', kind: 'examine', req: ['sec'], once: true,
        lockedText: '보안실 안쪽 책상 위에 일지가 펼쳐져 있다.',
        on: { flag: 'diary', sound: 'whisper' },
        text: `【 보안실장 강철민 근무 일지 】
11/10  감염자 첫 발생. 약국에 백신이 있다는 걸 들었다.
11/11  손목을 물렸다. 아무에게도 말하지 않았다. 백신은 내 것이다.
       생존자들은 5층에 가둔다. 그래야 헬기가 오면 나 혼자 탈 수 있다.
11/12  약국 냉장고 비번을 모른다. 손이 떨린다. 배가 고프다. 사람 냄새가…
       옥상 열쇠함 패턴은 내 이름 첫 글자 'ㄱ'. 잊지 말 것.
11/13  나는 옥상에서 헬기를 기다린다. 나는 — 배가 — 고프다` },
      { id: 'list', t: 'paper', x: 9.4, z: -7, y: 0.77, label: '생존자 명단', kind: 'pickup', item: 'zb_relic_6', req: ['sec'],
        lockedText: '보안실 안쪽에 서류철이 보인다.',
        text: '5층에 갇혔던 생존자 23명의 이름이 적힌 명단. 그들은 옥상 계단으로 흩어졌다. 구조대에 전해야 한다.', takenText: '빈 서류철.' },
      { id: 'cable_note', t: 'poster', x: 13.94, z: 4.4, y: 1.6, r: -90, label: '모니터 옆 메모', kind: 'examine',
        text: `CCTV 케이블이 다 빠져 있다. 모니터 옆 메모.
  빨강 — 마지막 비행이 뜨는 곳
  파랑 — 아이들이 웃던 곳
  노랑 — 약 냄새 나는 곳
  초록 — 우리가 처음 들어온 곳 (정문)` },
      { id: 'cctv5', t: 'crt_tv', x: 13.2, z: 6.4, r: -90, label: 'CCTV 케이블 단자', kind: 'lock', req: ['sec'],
        lockedText: '보안실에 들어가야 CCTV를 다룰 수 있다.',
        text: '케이블 네 가닥을 알맞은 카메라 단자에 꽂자.',
        lock: { input: 'wires', left: ['빨강', '파랑', '노랑', '초록'], right: ['1층 정문', '4층 약국', '옥상 계단', '3층 완구점'], colors: ['#d6303a', '#3b7dd8', '#e8c13a', '#2fbf71'], answer: ['옥상 계단', '3층 완구점', '4층 약국', '1층 정문'] },
        doneText: '모니터 여섯 대에 실시간 화면이 나온다.',
        on: { flag: 'cctv5', sound: 'tune_static',
          story: T('실시간 화면', `모니터가 하나씩 켜졌다.
  · 옥상 계단 — 경비복을 입은 거구의 감염자가 계단을 오르고 있다. 명찰: 강철민.
  · 옥상 물탱크실 — 문틈으로 노란 원피스 자락이 보인다. 하린이다!
  · 하늘 — 멀리 붉은 불빛 하나가 다가온다. 매-7.

강철민이 물탱크실 쪽으로 간다. 서둘러야 한다.`) } },
      { id: 'keybox', t: 'safe', x: 6, z: -10.5, label: '옥상 열쇠함 (패턴 잠금)', kind: 'lock', req: ['diary'],
        lockedText: '9개의 점이 있는 패턴 잠금. 패턴을 알 만한 단서가 없다.',
        text: '아홉 개의 점을 이어 패턴을 그리는 열쇠함.',
        lock: { input: 'stars', points: [[0.2, 0.2], [0.5, 0.2], [0.8, 0.2], [0.2, 0.5], [0.5, 0.5], [0.8, 0.5], [0.2, 0.8], [0.5, 0.8], [0.8, 0.8]], len: 5, answer: [0, 1, 2, 5, 8] },
        doneText: '빈 열쇠함.',
        on: { flag: 'roofkey', give: 'roof_key', sound: 'unlock', toast: '옥상 방화 셔터 열쇠를 얻었다' } },
      { id: 'shutter_l', t: 'handle', x: -2.6, z: 10.9, y: 1.1, label: '방화 셔터 손잡이 (왼쪽)', kind: 'coop', req: ['roofkey'], lockedText: '방화 셔터가 잠겨 있다. 열쇠부터.', coop: { group: 'fire', need: 2 }, text: '셔터를 밀어 올렸다' },
      { id: 'shutter_r', t: 'handle', x: 2.6, z: 10.9, y: 1.1, label: '방화 셔터 손잡이 (오른쪽)', kind: 'coop', req: ['roofkey'], lockedText: '방화 셔터가 잠겨 있다. 열쇠부터.', coop: { group: 'fire', need: 2 }, text: '셔터를 밀어 올렸다' },
      { id: 'roof_door', t: 'iron_door', x: 0, z: 10.85, r: 180, label: '옥상 비상문', kind: 'lock', req: ['fire'],
        lockedText: '방화 셔터가 비상문을 가리고 있다.',
        text: '옥상으로 나가는 비상문. 네 자리 번호.',
        lock: { input: 'digits', len: 4, answer: '0500' },
        doneText: '비상문이 열려 있다. 바람이 세차게 들이친다.',
        on: { flag: 'roof', sound: 'door', toast: '옥상 문이 열렸다!' } },
      { id: 'roof_stairs', t: 'stairs', x: 0, z: 9.2, label: '옥상으로', kind: 'door', req: ['roof'], to: 6, lockedText: '옥상 비상문이 잠겨 있다.' },
    ],
    coops: { fire: { on: { flag: 'fire', sound: 'gate', toast: '방화 셔터가 올라갔다!' } } },
    ghosts: [
      Z([4, 4], { auto: true, name: '문화센터의 감염자' }),
      Z([12, -6], { name: '경비원이었던 감염자', speed: 2.2, sense: 8 }),
      Z([-6, -8], { startFlag: 'cctv5', name: '피아노 선생님이었던 감염자', speed: 1.8 }),
    ],
    objectives: [
      { until: 'sec', text: '보안실 철문을 열자', hints: ['칠판을 읽고, 오른쪽 보안실 철문 키패드를 클릭.', '불빛 순서를 끝까지 보고 똑같이: 3·1·4·1·2·4·3'] },
      { until: 'cctv5', text: 'CCTV를 연결해 옥상을 확인하자', hints: ['보안실 일지와 생존자 명단도 챙기자.', '모니터 옆 메모: 빨강=옥상 계단, 파랑=3층 완구점, 노랑=4층 약국, 초록=1층 정문'] },
      { until: 'roofkey', text: '옥상 열쇠함 패턴을 풀자', hints: ['강철민의 일지: 이름 첫 글자', '\'ㄱ\' 모양: 위쪽 가로줄 왼쪽→오른쪽, 그리고 오른쪽 세로줄 아래로', '점 1→2→3→6→9'] },
      { until: 'fire', text: '방화 셔터를 두 사람이 동시에!', hints: ['셔터 양쪽 손잡이를 8초 안에 둘 다. (혼자라면 하나만)'] },
      { until: 'roof', text: '옥상 비상문을 열자', hints: ['무전 속 조종사: "출발 시각"', '0500'] },
      { until: '__end', text: '옥상으로!', hints: ['열린 비상문 앞 계단.'] },
    ],
  },

  // ─────────────────────────────── 7장 · 옥상 헬리포트
  {
    id: 6, title: '7장 · 옥상 헬리포트', place: '그랜드 한빛 백화점 옥상 · 새벽 4시 54분',
    outdoor: true, size: [28, 24], spawn: [0, 10], ambient: 'dusk', ground: '#5a5a60', fog: 0.022, rain: true,
    intro: T('7장 · 옥상 헬리포트', `빗줄기가 옥상을 때린다. 커다란 H 표시 위로 착륙 유도등은 모두 꺼져 있다.
멀리서 회전날개 소리. 매-7이 다가온다. 하지만 불빛이 없으면 내려앉을 수 없다.

옥상 구석 물탱크실. 그리고 그 앞을 서성이는 거대한 그림자.
찢어진 경비복, 목에 걸린 명찰 — 「보안실장 강철민」.

05시까지, 6분.`),
    props: [
      { t: 'water_tower', x: -9.5, z: -7.5 }, { t: 'fence', x: 0, z: -11.6 }, { t: 'fence', x: -13.6, z: 0, r: 90 }, { t: 'fence', x: 13.6, z: 0, r: 90 },
      { t: 'barrel', x: 11, z: 8 }, { t: 'barrel', x: 11.8, z: 7.2 }, { t: 'crate', x: -11, z: 8 }, { t: 'sandbags', x: 9, z: -9, r: 20 }, { t: 'debris', x: 6, z: 6 },
      { t: 'signal_lamp', x: 12, z: -10 }, { t: 'pipe_run', x: -6, z: 11.4 }, { t: 'blood_smear', x: -4, z: -2 },
    ],
    objects: [
      { id: 'manual', t: 'notice_board', x: 4.6, z: 9.6, label: '헬리포트 운용 매뉴얼', kind: 'examine',
        text: `비닐 커버에 싸인 매뉴얼.
  1. 비상 발전기 시동: 연료 밸브 열기 → 초크 당기기 → 시동 버튼 → 출력 스위치
  2. 착륙 유도등: 패널의 점을 'H' 모양 순서로 연결
       (왼쪽 기둥 위→아래, 가운데 가로대, 오른쪽 기둥 위→아래)
  3. 조종사에게 손전등으로 신호` },
      { id: 'gen6', t: 'generator', x: 9.6, z: 9.4, label: '옥상 비상 발전기', kind: 'lock',
        text: '옥상 비상 발전기. 조작 버튼 네 개가 있다. 순서가 틀리면 처음부터.',
        lock: { input: 'buttons', buttons: ['시동 버튼', '출력 스위치', '연료 밸브', '초크'], len: 4, answer: ['연료 밸브', '초크', '시동 버튼', '출력 스위치'] },
        doneText: '발전기가 힘차게 돌아간다.',
        on: { flag: 'gen6', sound: 'drag', toast: '발전기 시동! 이제 착륙 유도등을 켜자' } },
      { id: 'landing', t: 'control_panel', x: 7, z: 2, r: -90, label: '착륙 유도등 패널', kind: 'lock', req: ['gen6'],
        lockedText: '패널에 전기가 들어오지 않는다. 발전기부터.',
        text: '착륙 유도등 패널. 점 일곱 개를 순서대로 이어 H 를 그리자.',
        lock: { input: 'stars', points: [[0.22, 0.15], [0.22, 0.5], [0.22, 0.85], [0.5, 0.5], [0.78, 0.5], [0.78, 0.15], [0.78, 0.85]], len: 7, answer: [0, 1, 2, 3, 4, 5, 6] },
        doneText: '착륙 유도등이 H 모양으로 빛나고 있다.',
        on: { flag: 'landing', sound: 'heli', toast: '🚁 헬기가 내려온다!',
          story: T('유도등', `유도등이 하나씩 켜지며 옥상 바닥에 거대한 H 가 떠올랐다.
쏴아아— 빗속을 가르고 매-7 이 내려앉는다. 회전날개 바람에 빗물이 사방으로 튄다.

조종석 문이 열리고 한도윤이 소리친다. "하린이는?! 하린이는 어디 있소!"
그 순간 — 물탱크실 앞의 거대한 그림자가 헬기 쪽으로 돌아섰다.
(강철민이 쫓아온다! 손전등을 끄고 물탱크실로, 아니면 바로 헬기로!)`) } },
      { id: 'tank', t: 'iron_door', x: -9.5, z: -4.6, label: '물탱크실 문', kind: 'lock',
        text: `녹슨 물탱크실 문. 안에서 아주 작게 훌쩍이는 소리.
문에 크레파스로 "모르는 사람한테는 안 열어요!"
(조종사가 알려 준 둘만의 암호로 불러 보자)`,
        lock: { input: 'text', answer: ['토끼야', '토끼야~', '하린아 토끼야', '토끼야 하린아', '토끼야나와', '토끼야 나와', '하린아토끼야'] },
        doneText: '물탱크실 문이 열려 있다.',
        on: { flag: 'harin', give: 'zb_relic_7', sound: 'giggle',
          story: T('토끼야', `"…토끼야~"
문이 삐걱 열리고 노란 원피스를 입은 아이가 고개를 내밀었다.
"아빠가 알려 줬어요? 그 말은 아빠랑 나만 아는데!"

하린이는 품에서 낡은 무전기를 꺼냈다.
"아빠 목소리 들으려고 맨날 이거 들고 있었어요. 엄마가… 엄마가 안 와요."

작은 손이 내 손을 꼭 잡았다.`) } },
      { id: 'heli', t: 'heli', x: 0, z: -2, r: 90, label: '구조 헬기 매-7', kind: 'door', hidden: true, req: ['landing'], to: 'end',
        lockedText: '헬기가 내려앉지 못하고 하늘을 맴돈다.' },
      { id: 'helipad', t: 'paper', x: 0, z: 3.6, y: 0.03, label: '헬리포트 H 표시', kind: 'examine',
        text: '빗물에 젖은 거대한 H. 유도등이 꺼져 있으면 헬기는 내려앉을 수 없다.' },
    ],
    ghosts: [
      Z([-9, -3], { auto: true, name: '보안실장이었던 감염자 강철민', speed: 1.9, sense: 9, teleport: 22 }),
      Z([11, -6], { startFlag: 'gen6', name: '계단을 올라온 감염자', speed: 2.0 }),
      Z([-12, 6], { startFlag: 'landing', name: '헬기 소리를 들은 감염자', speed: 2.4, sense: 9 }),
    ],
    objectives: [
      { until: 'gen6', text: '옥상 비상 발전기를 돌리자', hints: ['헬리포트 운용 매뉴얼을 읽자.', '연료 밸브 → 초크 → 시동 버튼 → 출력 스위치'] },
      { until: 'landing', text: '착륙 유도등으로 H 를 그리자', hints: ['매뉴얼: 왼쪽 기둥 위→아래, 가운데 가로대, 오른쪽 기둥 위→아래', '점 1→2→3→4→5→6→7 (번호가 그 순서로 붙어 있다)'] },
      { until: '__end', text: '헬기에 오르자! (하린이도 함께?)', hints: ['물탱크실 문: 조종사가 알려 준 둘만의 암호', '토끼야', '하린이의 물건·엄마의 쪽지·백신·생존자 명단까지 일곱 가지를 모두 챙기면 다른 결말이…'] },
    ],
  },
];

export const ZOMBIE_ENDINGS = {
  true: T('진 엔딩 · 마지막 헬기', `05시 00분. 매-7 의 문이 열렸다.

"하린아!"
"아빠!!"

비에 흠뻑 젖은 조종사가 딸을 끌어안았다. 하린이는 노란 리본과 별 머리핀, 토끼 인형 깡총이를 아빠에게 하나씩 보여 주었다.
엄마의 쪽지를 펼친 한도윤은 한참 동안 말이 없었다.

헬기가 떠오른다. 옥상 끝에서 강철민이 손을 뻗었지만, 회전날개 바람에 밀려 비틀거렸다.
그의 목에 걸린 명찰이 빗속으로 떨어졌다.

R-9 백신 샘플은 그날 아침 질병관리청에 도착했다.
생존자 명단의 23명 중 19명이 사흘 안에 구조되었다.
한 달 뒤, 한빛시에 백신 접종이 시작되었다.

하린이는 지금도 노란 풍선을 좋아한다.
"엄마가 지켜 줬어요. 그리고 — 모르는 형, 누나들도요."

(축하합니다! 히든 테마 '데드 시티' 진 엔딩 👑)`),
  normal: T('엔딩 · 비 내리는 도시', `헬기는 05시 정각에 떠올랐다.
창밖으로 백화점 옥상이 점점 작아진다.

한도윤은 조종간을 잡은 채 끝내 뒤를 돌아보지 않았다.
"…하린아. 아빠가 미안하다."

물탱크실 문틈으로, 작은 손 하나가 노란 리본을 흔들고 있었다.
빗소리에 묻혀 아무도 그 소리를 듣지 못했다.
"…아빠?"

(하린이의 물건 · 엄마의 쪽지 · 백신 · 생존자 명단 — 일곱 가지를 모두 챙기면 다른 결말을 볼 수 있어요)`),
};
