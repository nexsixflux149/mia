/*
 * 시나리오 9 — 해피니스 랜드 : 폐장하지 않는 밤 (끝판왕 · 10챕터 · 난이도 최상)
 *
 * [겉으로 알려진 이야기]
 *   2006년 7월 7일 밤, 해피니스 랜드 새 놀이기구 '스카이드롭' 개장 전야 시운전.
 *   특별 시승단 어린이 6명이 탄 차가 브레이크 고장으로 떨어졌다. 정비공 박정수의 과실로 결론,
 *   박정수는 조사 도중 놀이공원 안에서 스스로 목숨을 끊었다. 놀이공원은 그 해 폐장했다.
 *
 * [반전 1 — 4장] 박정수의 잘못이 아니었다. 회장 강만호가 개장 일정을 맞추려 "점검은 서류로만" 지시했고,
 *   정비 일지는 위조되었다.
 * [반전 2 — 7·8장] 스카이드롭에는 아무도 타지 않았다. 시운전은 빈 차였다. 아이들은 그날 밤 9시 반,
 *   허가 없이 짓던 '거울 미궁'에 들어갔다가 배선 합선 화재로 갇혀 죽었다. 회장은 무허가 공사를 덮으려
 *   아이들을 스카이드롭 사고로 꾸몄고, 진실을 말하려던 박정수는 '자살'로 위장되었다.
 * [반전 3 — 9장] 미궁 문을 밖에서 잠근 건 회장의 아들, 일곱 번째 표의 주인 강태민(당시 12살).
 *   숨바꼭질 장난이었다. 불이 나자 그는 도망쳤다. 그리고 지금 — 처음부터 우리를 다정하게 안내하던
 *   놀이공원 방송 목소리 '해피'와, 우리를 쫓던 토끼 탈이 바로 서른두 살이 된 강태민이다.
 *   무섭게 쫓아오던 불탄 아이들은 사실 줄곧 "해피 말 듣지 마"라고 경고하고 있었다.
 *
 * 메타 퍼즐: 앞 장의 답(표 7장, 관람차 7번 칸, 바이킹 닻 고리, 좌석 번호…)을 모아 8장 블랙박스를 연다.
 * 움직이는 맵: 회전목마 · 찻잔 · 매달린 인형 · 유령 열차 · 관람차 · 바이킹 · 회전 거울 · 자이로드롭 · 퍼레이드 차량.
 */
const T = (title, text) => ({ title, text });
const COLORS6 = ['하양', '분홍', '하늘', '보라', '노랑', '초록'];

import { PARK_CHAPTERS_2, PARK_ENDINGS } from './park2.js';
export { PARK_ENDINGS };
const PARK_1 = [
  // ─────────────────────────────── 1장
  {
    id: 0,
    title: '1장 · 정문 — 폐장하지 않는 밤',
    place: '폐놀이공원 해피니스 랜드 · 2026년 7월 7일 밤 11시 59분',
    outdoor: true, size: [26, 20], spawn: [0, 8], ambient: 'night', ground: '#1a1418', fog: 0.034,
    intro: T('1장 · 정문', `2006년에 문을 닫은 해피니스 랜드.
"매년 7월 7일 자정이면 놀이공원 불이 전부 켜지고, 안내 방송이 나온다"는 제보.

11시 59분 59초. 녹슨 정문 위 전구가 한꺼번에 켜졌다.
스피커에서 아이처럼 맑은 목소리가 흘러나왔다.

"딩동— 해피니스 랜드에 오신 걸 환영해요!
 저는 여러분의 친구, 토끼 해피예요.
 오늘은 아주 특별한 밤이에요. 20년 만의 손님이거든요!"

정문 옆, 사람보다 큰 토끼 동상이 웃고 있다. 하얀 털이 군데군데 붉게 얼룩져 있다.`),
    props: [
      { t: 'turnstile', x: -2.5, z: -7.2 }, { t: 'turnstile', x: 2.5, z: -7.2 }, { t: 'fence', x: -8, z: -7.6 }, { t: 'fence', x: 8, z: -7.6 },
      { t: 'lantern_string', x: 0, z: 3, len: 18 }, { t: 'lantern_string', x: 0, z: -3, len: 18 }, { t: 'balloon_stand', x: -9, z: 5, anim: { type: 'bob', amp: 0.25, speed: 1.2 } },
      { t: 'popcorn_cart', x: 9.5, z: -2.5, r: -40 }, { t: 'lamp', x: -6, z: 1 }, { t: 'lamp', x: 6, z: 1 }, { t: 'lamp', x: -6, z: -5 }, { t: 'lamp', x: 6, z: -5 },
      { t: 'pine', x: -12, z: 8.5 }, { t: 'pine', x: 12, z: 8.5 }, { t: 'pine', x: -12, z: -8.5 }, { t: 'pine', x: 12, z: -8.5 }, { t: 'stall', x: 10.5, z: 4, r: -80 },
    ],
    objects: [
      { id: 'pa_welcome', t: 'speaker_pole', x: -10, z: -2, label: '안내 방송 스피커', kind: 'examine', once: true,
        on: { flag: 'welcome', sound: 'calliope_far', toast: '목표가 갱신되었습니다' },
        text: `지지직— 스피커가 다시 켜졌다.

"친구들, 들어오려면 입장권이 있어야 해요!
 매표소 아저씨는 오늘 안 계셔서, 여러분이 직접 표를 끊어 주세요.
 아, 그날 밤 왔던 친구들이랑 '똑같이' 내야 해요. 그게 규칙이에요. 헤헤."` },
      { id: 'news', t: 'paper', x: -3.5, z: 3.6, y: 0.85, label: '2006년 7월 8일 자 신문', kind: 'examine',
        text: `【 해피니스 랜드 '스카이드롭' 추락… 어린이 6명 숨져 】

  7일 밤 10시 30분경, 개장을 앞둔 스카이드롭이 시운전 중 추락했다.
  특별 시승단으로 초청된 어린이 6명이 모두 숨졌다.

    1번 좌석  김지우 (8)      2번 좌석  이도현 (9)
    3번 좌석  박서아 (7)      4번 좌석  최준호 (10)
    5번 좌석  정하린 (8)      6번 좌석  한민규 (9)

  경찰은 정비공 박 모(41) 씨의 브레이크 점검 소홀을 원인으로 보고 있다.
  강만호 회장: "참담하다. 정비 책임자를 엄중히 처벌하겠다."` },
      { id: 'news_table', t: 'table', x: -3.5, z: 3.6, kind: 'deco' },
      { id: 'price', t: 'notice_board', x: 3.5, z: 4.4, r: 180, label: '입장 요금표', kind: 'examine',
        text: `【 해피니스 랜드 입장 요금 】

  어른 9,000원 · 청소년(13~18세) 7,000원 · 어린이(12세 이하) 5,000원
  ※ 10명 이상 단체는 20% 할인
  ※ 2006년 7월 7일 개장 전야 '특별 시승단'은 어린이 요금만 받습니다. (인솔 어른 무료)

요금표 아래, 볼펜으로 덧쓴 글씨:
"특별 시승단 표: 7장 발권 — VIP 1장 포함"` },
      { id: 'booth', t: 'ticket_booth', x: -7.5, z: -1.5, r: 50, label: '매표소', kind: 'lock', req: ['welcome'],
        lockedText: '굳게 닫힌 매표소. 안에서 누군가 숨 쉬는 소리가 난다.',
        text: '매표소 창구의 5자리 금전 등록기. "그날 밤 특별 시승단이 낸 입장료 합계를 찍으세요."\n(요금표와 신문을 함께 볼 것)',
        lock: { input: 'digits', len: 5, answer: '35000' }, wrongScare: true,
        doneText: '열린 매표소. 표 뭉치는 2006년 7월 7일 날짜 그대로다.',
        on: { flag: 'booth', give: 'park_ticket', sound: 'bell', ghost: 'start',
          story: T('일곱 번째 표', `철컥. 등록기가 열리며 표 일곱 장이 쏟아졌다.

  1번 김지우 · 2번 이도현 · 3번 박서아 · 4번 최준호 · 5번 정하린 · 6번 한민규
  7번 — VIP. 이름 칸은 비어 있다.

신문에는 여섯 명뿐이었다. 그런데 표는 일곱 장, 요금은 일곱 명 몫이다.
그날 밤, 한 아이가 더 있었다.

"표 끊었구나! 잘했어요~" 스피커가 박수를 쳤다.
매표소 유리창에 작은 손바닥 자국이 하나씩 찍혔다. 안쪽에서. 여섯 개.

(울고 있는 아이가 쫓아온다)`) } },
      { id: 'cups', t: 'cups_table', x: 5.5, z: -1.2, label: '공 찾기 게임 부스', kind: 'lock', req: ['booth'],
        lockedText: '"오늘은 영업 끝!" 팻말이 걸려 있다.',
        text: '탁자 위 빨간 컵 세 개. 어디선가 해피의 목소리.\n"상품은 지우가 잃어버린 머리끈! 공이 어느 컵에 있는지 맞혀 봐요~"',
        lock: { input: 'cups', cups: 3, swaps: 12, start: 0 }, wrongScare: true,
        doneText: '컵 세 개가 엎어져 있다. 상품 걸이는 비었다.',
        on: { flag: 'cups', give: 'park_relic_1', sound: 'musicbox',
          story: T('지우의 머리끈', `공을 찾자 컵 밑에서 반짝이는 별 모양 머리끈이 나왔다. 꼬리표: "1번 김지우"

머리끈을 집어 드는 순간, 귓가에서 아이 목소리가 들렸다. 아주 작게, 다급하게.
"…가지 마."

돌아보니 아무도 없었다.`) } },
      { id: 'mascot', t: 'mascot_statue', x: 8.5, z: 1.5, r: -100, s: 1.5, label: '해피 동상', kind: 'examine',
        text: '사람보다 큰 토끼 해피 동상. 한쪽 귀가 꺾여 있다.\n받침대: "해피는 언제나 여러분 곁에!"',
        reveal: { item: 'flashlight', text: '손전등으로 받침대 아래를 비추자, 어린아이 손톱으로 긁은 글씨가 보인다.\n  "해피 말 듣지 마"', flag: 'warning1' } },
      { id: 'gate', t: 'path_gate', x: 0, z: -9.4, label: '회전문 — 놀이공원 안으로', kind: 'use', req: ['booth'],
        lockedText: '회전문이 꿈쩍도 하지 않는다. 표가 있어야 할 것 같다.',
        text: '삐걱거리는 회전문. 표 넣는 구멍이 있다.', use: { item: 'park_ticket', times: 1 }, needText: '입장권이 필요하다. (매표소)', toChapter: 1,
        on: { sound: 'gate' } },
    ],
    ghost: { type: 'child', speed: 2.1, sense: 6, teleport: 22, spawn: [-11, -7], name: '울고 있는 아이' },
    objectives: [
      { until: 'welcome', text: '정문 앞을 둘러보자', hints: ['왼쪽의 안내 방송 스피커.'] },
      { until: 'booth', text: '그날 밤과 똑같이 입장권을 끊자', hints: ['신문에는 6명이지만, 요금표 아래 "7장 발권"이라는 메모가 있다.', '특별 시승단은 어린이 요금만, 인솔 어른은 무료. 할인은 10명 이상만.', '7 × 5,000 = 35000'] },
      { until: 'cups', text: '공 찾기 게임 (지우의 물건)', hints: ['처음에 공이 든 컵만 끝까지 눈으로 따라가자. 섞는 순서는 매번 다르다.'] },
      { until: '__end', text: '회전문으로 들어가자', hints: ['매표소에서 받은 입장권을 북쪽 회전문에 쓰자. (해피 동상은 손전등으로 살펴보면 무언가 있다)'] },
    ],
  },

  // ─────────────────────────────── 2장
  {
    id: 1,
    title: '2장 · 회전목마 광장',
    place: '해피니스 랜드 · 회전목마 광장',
    outdoor: true, size: [26, 20], spawn: [0, 8], ambient: 'night', ground: '#1e161c', fog: 0.036,
    intro: T('2장 · 회전목마 광장', `광장 한가운데서 회전목마가 혼자 돌고 있었다.
음악은 없다. 삐걱, 삐걱. 말들만 오르내린다.

찻잔 놀이기구도 돌고 있다. 안에 아무도 없는데.

"회전목마는 아이들이 제일 좋아했어요!" 해피가 말했다.
"다들 자기 말이 있었대요. 누가 어떤 말을 탔는지 맞히면, 회전목마가 멈출 거예요."`),
    props: [
      { t: 'carousel_big', x: 0, z: -3, r2: 3.2, anim: { type: 'spin', speed: 0.32 } },
      { t: 'teacup', x: -8.5, z: 4, color: '#ff9ad0', anim: { type: 'spin', speed: 0.9 } }, { t: 'teacup', x: 8.5, z: 4, color: '#9ad0ff', anim: { type: 'spin', speed: -0.7 } },
      { t: 'teacup', x: -9, z: -5.5, color: '#ffd36a', anim: { type: 'spin', speed: 0.6 } }, { t: 'lantern_string', x: 0, z: 5.5, len: 18 },
      { t: 'lamp', x: -5, z: 7 }, { t: 'lamp', x: 5, z: 7 }, { t: 'speaker_pole', x: 10.5, z: -6 }, { t: 'pine', x: 12, z: 8 }, { t: 'pine', x: -12, z: 8 },
    ],
    objects: [
      { id: 'photo_wall', t: 'notice_board', x: -4, z: 6.6, r: 180, label: '시승단 사진 게시판', kind: 'examine', once: true,
        on: { flag: 'photos', sound: 'whisper' },
        text: `【 7월 7일 특별 시승단 — 회전목마에서 한 컷! 】 (사진 아래 아이들 글씨)

  · 지우: "나는 언제나 하얀 말!"
  · 하린: "내 풍선 팔찌랑 똑같은 색 말 탔다~" (팔찌는 분홍색)
  · 도현 & 준호: "우리 둘은 노랑이랑 초록 중에 하나씩!"
  · 준호: "노랑은 별로야."
  · 민규: "하늘색 말은 키 재는 막대에 걸려서 못 탔어 ㅠㅠ"
  · 서아: (말 이름표만 붙어 있다)

사진 맨 끝, 일곱 번째 아이 얼굴만 검게 지워져 있다. 그 아이는 검은 말을 탔다.` },
      { id: 'carousel_box', t: 'control_panel', x: 4.5, z: 3, r: 180, label: '회전목마 조종함', kind: 'lock', req: ['photos'],
        lockedText: '조종함 덮개에 "운행 중 열지 마세요". 무엇을 맞춰야 할지 모르겠다.',
        text: '여섯 칸짜리 색 다이얼. "시승단이 탄 말의 색을 좌석 번호(1~6) 순서대로"',
        lock: { input: 'dial', wheels: [COLORS6, COLORS6, COLORS6, COLORS6, COLORS6, COLORS6], answer: ['하양', '노랑', '하늘', '초록', '분홍', '보라'] }, wrongScare: true,
        doneText: '회전목마 조종함이 잠잠하다.',
        on: { flag: 'carousel', give: 'park_relic_2', sound: 'bell',
          story: T('여섯 마리와 한 마리', `다이얼을 맞추자 회전목마 말 여섯 마리가 동시에 멈춰 섰다. 하양, 노랑, 하늘, 초록, 분홍, 보라.
노란 말 안장 위에 야구모자 하나. 챙 안쪽에 "2번 이도현".

그런데 회전목마는 아직 돈다. 일곱 번째, 검은 말 한 마리만 계속 오르내린다.
검은 말 목에 걸린 이름표가 바람에 뒤집혔다.

  「VIP — 회장님 아드님 자리입니다. 다른 어린이는 앉지 마세요.」`) } },
      { id: 'organ_sheet', t: 'paper', x: -6.5, z: -0.5, y: 0.85, label: '오르간 악보', kind: 'examine',
        text: '회전목마 오르간 악보. 계이름 위에 아이 글씨: "끝나는 노래 — 이걸 치면 말들이 잠들어요"\n\n  미 · 솔 · 라 · 솔 · 미 · 도 · 레\n\n악보 구석: "해피 아저씨가 가르쳐 줬어"' },
      { id: 'sheet_crate', t: 'crate', x: -6.5, z: -0.5, kind: 'deco' },
      { id: 'organ', t: 'organ', x: -4.5, z: -7.5, label: '회전목마 오르간', kind: 'lock', req: ['carousel'],
        lockedText: '오르간 건반이 회전목마와 함께 저절로 움직인다. 손을 댈 수 없다.',
        text: '회전목마 오르간. 끝나는 노래를 쳐 주자. (7음)',
        lock: { input: 'buttons', notes: true, buttons: ['도', '레', '미', '파', '솔', '라', '시'], len: 7, answer: ['미', '솔', '라', '솔', '미', '도', '레'] }, wrongScare: true,
        doneText: '오르간이 조용하다. 회전목마가 멈췄다.',
        on: { flag: 'organ', sound: 'musicbox', scare: 'mascot',
          story: T('끝나는 노래', `마지막 건반을 누르자 회전목마가 끼익 멈췄다. 검은 말까지.

광장 스피커에서 해피가 노래를 따라 불렀다. 끝까지, 한 음도 틀리지 않고.
…아이 목소리치고는 너무 낮게.

"잘했어요! 다음은 유령의 집이에요. 거기 친구들이 기다리고 있대요~"

찻잔 하나가 멈추지 않고 계속 돌았다. 그 안에 하얀 토끼 탈 하나가 앉아 있다가 — 사라졌다.`) } },
      { id: 'exit', t: 'path_gate', x: 0, z: -9.4, label: '유령의 집으로', kind: 'door', req: ['carousel', 'organ'], to: 2,
        lockedText: '길이 회전목마 그림자로 막혀 있다. 회전목마를 멈춰야 한다.' },
    ],
    ghost: { type: 'mascot', speed: 2.3, sense: 7, teleport: 22, spawn: [-11, -8], name: '토끼 해피', startFlag: 'carousel' },
    ghosts: [{ type: 'child', speed: 1.9, sense: 6, teleport: 26, spawn: [11, -8], name: '울고 있는 아이', auto: true }],
    objectives: [
      { until: 'photos', text: '회전목마 광장을 둘러보자', hints: ['남쪽 게시판의 시승단 사진.'] },
      { until: 'carousel', text: '아이들이 탄 말의 색을 맞추자', hints: ['지우=하양, 하린=분홍(팔찌 색). 준호는 노랑이 싫다 → 준호 초록, 도현 노랑.', '민규는 하늘을 못 탔다 → 남은 하늘·보라 중 민규 보라, 서아 하늘.', '좌석 순서: 하양 · 노랑 · 하늘 · 초록 · 분홍 · 보라'] },
      { until: 'organ', text: '오르간으로 회전목마를 멈추자', hints: ['서쪽 상자 위 오르간 악보.', '미 솔 라 솔 미 도 레'] },
      { until: '__end', text: '유령의 집으로', hints: ['북쪽 길.'] },
    ],
  },

  // ─────────────────────────────── 3장
  {
    id: 2,
    title: '3장 · 유령의 집',
    place: '해피니스 랜드 · 유령의 집 "공포의 저택"',
    size: [24, 18], spawn: [-9, 6.5], ambient: 'dark', floor: '#1e1418', wall: '#2a1a22', fog: 0.06, startDark: true,
    walls: [{ x: -3, z: -1.5, w: 0.3, d: 12 }, { x: 4, z: 1.5, w: 0.3, d: 12 }],
    intro: T('3장 · 유령의 집', `유령의 집은 정전이었다.

레일 위에 해골 열차가 멈춰 있다. 천장에서 밧줄에 매달린 인형들이 흔들린다. 바람도 없는데.
녹음된 비명이 늘어진 테이프처럼 낮게 흘러나온다.

"여기 조명만 켜면 무섭지 않아요!" 해피가 말했다.
"배전반 설명서는 입구 근처에 있어요. 틀리게 꽂으면… 음, 재밌는 일이 생길 거예요."`),
    props: [
      { t: 'hanging_dummy', x: -7, z: -3, y: 4.5, anim: { type: 'swing', amp: 0.35, speed: 1.1 } }, { t: 'hanging_dummy', x: 0.5, z: 4, y: 4.5, anim: { type: 'swing', amp: 0.5, speed: 0.8, axis: 'x' } },
      { t: 'hanging_dummy', x: 8, z: -5, y: 4.5, anim: { type: 'swing', amp: 0.4, speed: 1.3 } }, { t: 'hanging_dummy', x: 0.5, z: -6, y: 4.5, anim: { type: 'swing', amp: 0.3, speed: 0.9, axis: 'x' } },
      { t: 'ghost_cart', x: 8, z: 4, anim: { type: 'orbit', r: 2.6, speed: 0.35, cx: 8, cz: 3.5, face: Math.PI } }, { t: 'coffin', x: -9.5, z: -6, open: true },
      { t: 'tombstone', x: 7, z: -2 }, { t: 'tombstone', x: 9.5, z: -1 }, { t: 'wall_marks', x: -11.85, z: 0, r: 90 }, { t: 'puddle', x: 1, z: -2 },
    ],
    objects: [
      { id: 'manual', t: 'paper', x: -8.5, z: 3, y: 0.85, label: '배전반 설명서', kind: 'examine', once: true,
        on: { flag: 'manual', sound: 'whisper' },
        text: `【 공포의 저택 비상 배전반 — 직원용 】

  ① 파랑은 소리 나는 것에.
  ② 빨강은 레일에도 출구에도 쓰지 말 것.
  ③ 출구 문은 열차가 다 지나간 다음에 열려야 한다.
     그러니 초록은 노랑보다 '먼저 움직이는 것'에.

  (네 단자: 비상등 · 열차 레일 · 효과음 · 출구 문)` },
      { id: 'manual_table', t: 'table', x: -8.5, z: 3, kind: 'deco' },
      { id: 'fusebox', t: 'fusebox', x: -11.8, z: -4, r: 90, label: '비상 배전반', kind: 'lock', req: ['manual'],
        lockedText: '배전반. 전선이 네 가닥. 설명서 없이는 손대지 않는 게 좋겠다.',
        text: '배전반에 전선 네 가닥. 알맞은 단자에 꽂자.',
        lock: { input: 'wires', left: ['빨강', '파랑', '노랑', '초록'], right: ['비상등', '열차 레일', '효과음', '출구 문'], colors: ['#d6303a', '#3b7dd8', '#e8c13a', '#2fbf71'], answer: ['비상등', '효과음', '출구 문', '열차 레일'] }, wrongScare: true,
        doneText: '배전반 불이 초록색이다.',
        on: { flag: 'power', light: 'on', sound: 'power',
          story: T('불이 켜지다', `불이 들어오자 유령의 집이 깨어났다. 해골 열차가 레일을 따라 움직이고, 녹음된 웃음이 터졌다.

그리고 벽이 보였다. 불이 꺼져 있을 땐 보이지 않던 것.
손바닥 자국. 아이 손바닥. 바닥에서 출구 쪽으로, 끌려가듯 이어진 자국들.

열차 앞자리에 운행 기록지가 꽂혀 있다.`) } },
      { id: 'cart_log', t: 'paper', x: 5.5, z: 7, y: 0.85, label: '해골 열차 운행 기록', kind: 'examine', hidden: true, req: ['power'],
        text: `【 7월 7일 공포의 저택 운행 기록 】

  21:10  탑승 7명 (특별 시승단)
  21:16  하차 7명
  ── 운행 종료 ──

  메모(직원): "VIP 아이가 '진짜 무서운 곳' 데려간다며 애들 몰고 나감. 공사장 쪽."

신문은 아이들이 밤 10시 30분 스카이드롭에 있었다고 했다.` },
      { id: 'cart_table', t: 'crate', x: 5.5, z: 7, kind: 'deco' },
      { id: 'blood_wall', t: 'wall_marks', x: 1, z: 8.85, r: 180, y: 1.5, label: '얼룩진 벽', kind: 'examine', req: ['power'],
        lockedText: '너무 어둡다.',
        text: '물감 같은 붉은 얼룩이 번진 벽. 낙서 같기도 하다.',
        reveal: { item: 'flashlight', text: '손전등을 바짝 대자 얼룩 아래 크레용 글씨가 떠오른다.\n  "우리는 9시 50분에 여기 숨어 있었어. 해피가 술래였어."', flag: 'time_seen' } },
      { id: 'tomb_clock', t: 'clock', x: 11.8, z: -6, r: -90, y: 2, label: '멈춘 괘종시계', kind: 'lock', req: ['power'],
        lockedText: '시계 바늘이 빠져 있다. 아무것도 할 수 없다.',
        text: '바늘 빠진 괘종시계. 아이들이 마지막으로 이곳에 숨어 있던 시각에 맞추자.',
        lock: { input: 'clock', answer: ['9:50'] }, wrongScare: true,
        doneText: '시계가 9시 50분에 멈춰 있다.',
        on: { flag: 'clock', give: 'park_relic_3', sound: 'bell',
          story: T('9시 50분', `바늘을 맞추자 시계 아래 서랍이 툭 열렸다. 몽당 크레파스 한 통. 뚜껑에 "3번 박서아".

크레파스 통 안쪽에 그림 한 장. 아이 일곱 명이 손을 잡고 어디론가 간다.
맨 앞 아이만 왕관을 쓰고 있다. 그 아이 손에는 열쇠.
그림 제목: "비밀 미궁 생일 파티"`) } },
      { id: 'exit', t: 'door', x: 11.85, z: 6, r: -90, label: '출구', kind: 'door', req: ['power', 'clock'], to: 3,
        lockedText: '출구 문이 잠겨 있다. 배전반 "출구 문" 단자에 전기가 없다.' },
    ],
    ghost: { type: 'crawler', speed: 2.5, sense: 6, teleport: 18, spawn: [8, -6], name: '거꾸로 기는 그림자', startFlag: 'power' },
    ghosts: [{ type: 'child', speed: 2.0, sense: 6, teleport: 20, spawn: [-2, -7], name: '숨어 있는 아이', auto: true }],
    objectives: [
      { until: 'manual', text: '어둠 속에서 배전반 설명서를 찾자', hints: ['입구 근처 탁자.'] },
      { until: 'power', text: '비상 배전반을 연결하자', hints: ['파랑=효과음. 빨강은 레일·출구 금지 → 빨강=비상등.', '열차가 먼저 움직여야 출구가 열린다 → 초록=열차 레일, 노랑=출구 문.'] },
      { until: 'clock', text: '멈춘 괘종시계를 맞추자', hints: ['얼룩진 벽을 손전등을 가진 사람이 살펴보자.', '9시 50분'] },
      { until: '__end', text: '출구로', hints: ['오른쪽 위 출구. (해골 열차 운행 기록도 읽어 보자)'] },
    ],
  },

  // ─────────────────────────────── 4장
  {
    id: 3,
    title: '4장 · 정비 관리동 — 첫 번째 진실',
    place: '해피니스 랜드 · 직원 전용 정비 관리동',
    size: [22, 16], spawn: [-8, 5], ambient: 'candle', floor: '#2a2622', wall: '#4a4440', fog: 0.055,
    walls: [{ x: 1.5, z: -3.5, w: 0.3, d: 9 }],
    intro: T('4장 · 정비 관리동', `"여기는 직원 전용이에요. 재미없는 곳이에요. 빨리 지나가요!"
해피의 목소리가 처음으로 서둘렀다.

정비 관리동. 공구 냄새, 기름 냄새.
벽에 걸린 사진 속 정비공 박정수가 웃고 있다. 작업복 가슴에 딸 사진을 꽂고.

책상 위에는 일지가 두 권 있다.
하나는 손때가 묻었고, 하나는 깨끗하다.`),
    props: [
      { t: 'workbench', x: -9.5, z: -6.2 }, { t: 'gear_wall', x: 6, z: -7.7 }, { t: 'barrel', x: 10, z: 6.5 }, { t: 'barrel', x: 9.2, z: 6.8 }, { t: 'crate', x: 10, z: 5.4 },
      { t: 'lockers', x: -10.5, z: 2, r: 90 }, { t: 'control_panel', x: 7, z: 2, r: -90 }, { t: 'rug', x: -4, z: 0 },
    ],
    objects: [
      { id: 'real_log', t: 'book', x: -5, z: -6.9, y: 0.85, label: '손때 묻은 정비 일지', kind: 'examine', once: true,
        on: { flag: 'real_log', sound: 'whisper' },
        text: `【 스카이드롭 정비 일지 — 박정수 】

  7/3  브레이크 패드 마모 심각. 교체 부품 발주.
  7/5  부품 입고 7/9 예정. "7일 시운전 불가" 보고서 올림.
  7/6  회장님 호출. "점검은 서류로만 해. 7일 개장 못 하면 다 끝이야."
       — 거절했다. 우리 수빈이 또래 애들을 태운다는데.
  7/7  저녁: 회장님이 빈 차로만 시운전하겠다고 약속. 아이들은 안 태운다고.

마지막 줄은 떨리는 글씨다.
  "그런데 왜 애들이 죽었다는 거지? 차는 비어 있었는데."` },
      { id: 'fake_log', t: 'book', x: 0, z: -6.9, y: 0.85, label: '깨끗한 정비 일지', kind: 'examine',
        text: `【 스카이드롭 정비 일지 (경찰 제출용) 】

  7/3  이상 없음.     7/5  이상 없음.     7/7  시운전 전 최종 점검 완료. 이상 없음.
       — 정비 책임자 박정수 (서명)

서명 글씨가 다르다. 받침 'ㅇ'을 반대로 돌려 썼다. 박정수의 글씨가 아니다.` },
      { id: 'desk', t: 'teacher_desk', x: -2.5, z: -6.6, kind: 'deco' },
      { id: 'torque', t: 'workbench', x: 9, z: -2, r: -90, label: '브레이크 볼트 렌치', kind: 'lock', req: ['real_log'],
        lockedText: '렌치 받침대. 아직 손댈 이유가 없다.',
        text: '스카이드롭 브레이크 볼트 렌치. 박정수가 남긴 메모: "규정 조임 23. 추는 세 개만. 같은 무게 두 번 금지. 13짜리 추는 녹슬어서 쓰면 안 됨."',
        lock: { input: 'balance', weights: [3, 5, 7, 8, 11, 13], target: 23, pick: 3, unit: '', answer: [5, 7, 11] }, wrongScare: true,
        doneText: '렌치 받침대 아래 서랍이 열려 있다.',
        on: { flag: 'torque', sound: 'drawer',
          story: T('녹음기', `규정대로 조이자 받침대 아래 비밀 서랍이 열렸다. 작은 녹음기.
재생 버튼을 누르자 2006년의 목소리가 나왔다.

  강만호: "점검은 서류로만 해. 박 기사, 일 크게 만들지 마."
  박정수: "애들 태우면 안 됩니다. 브레이크가…"
  강만호: "애들은 안 태워. 빈 차로 돌려. 됐지?"

녹음은 거기서 끝났다. 박정수의 잘못이 아니었다.
그런데 — 빈 차였다면, 아이들은 어디서 죽은 걸까.`) } },
      { id: 'locker', t: 'safe', x: -10.4, z: -2, label: '박정수의 사물함', kind: 'lock', req: ['real_log'],
        lockedText: '이름표: 박정수. 4자리 자물쇠.',
        text: '박정수의 사물함. 4자리 자물쇠. 메모: "내가 지키고 싶은 날 (MMDD)" — 옆에 붙은 사진을 살펴보자.',
        lock: { input: 'digits', len: 4, answer: '1124' }, wrongScare: true,
        doneText: '빈 사물함. 딸 사진만 남았다.',
        on: { flag: 'locker', give: 'pjs_letter', sound: 'door', scare: 'tv',
          story: T('부치지 못한 편지', `사물함 안에 봉투 하나. "경찰서 앞 — 박정수"

"저는 7일 밤 10시 반, 빈 차로 시운전을 했습니다. 아무도 타지 않았습니다.
 그런데 11시 50분, 회장님 차가 공사 중인 '거울 미궁' 쪽에서 크레인을 불렀습니다.
 무언가를 스카이드롭 차 안으로 옮기는 걸 봤습니다. 작은 것 여섯 개를.
 내일 아침, 전부 말하겠습니다."

편지는 끝내 부쳐지지 않았다. 박정수는 그날 새벽 '자살'했다.

"…거기 오래 있지 마요." 스피커에서 해피가 말했다. 목소리가 갈라져 있었다.`) } },
      { id: 'locker_photo', t: 'photo', x: -10.6, z: -0.6, y: 1.2, r: 90, label: '사물함에 붙은 사진', kind: 'examine', req: ['real_log'],
        lockedText: '사물함 옆에 빛바랜 사진이 붙어 있다.',
        text: '사진 속 여자아이가 생일 케이크 앞에서 웃는다. 케이크 위 글씨가 반쯤 지워져 보이지 않는다.',
        reveal: { item: 'flashlight', text: '손전등으로 사진을 비스듬히 비추자 케이크 글씨가 읽힌다.\n  "수빈아 생일 축하해 ♥ 11.24"' } },
      { id: 'exit', t: 'iron_door', x: 10.85, z: 4, r: -90, label: '관람차 쪽 비상문', kind: 'door', req: ['torque', 'locker'], to: 4,
        lockedText: '비상문이 안쪽 빗장으로 잠겨 있다. 이 방에서 아직 알아낼 것이 있다.' },
    ],
    ghost: { type: 'shadow', speed: 2.3, sense: 6, teleport: 20, spawn: [8, -5], name: '그을린 작업복', auto: true, lightFreeze: true },
    objectives: [
      { until: 'real_log', text: '정비 관리동을 조사하자', hints: ['책상 위 손때 묻은 일지.'] },
      { until: 'torque', text: '박정수의 렌치를 규정대로 조이자', hints: ['13은 못 쓴다. 3·5·7·8·11 중 셋으로 23.', '5 + 7 + 11 = 23'] },
      { until: 'locker', text: '박정수의 사물함을 열자', hints: ['사물함 옆 사진을 손전등을 가진 사람이 살펴보자.', '수빈이 생일 11월 24일 → 1124'] },
      { until: '__end', text: '비상문으로 관람차 쪽으로', hints: ['오른쪽 철문.'] },
    ],
  },

  // ─────────────────────────────── 5장
  {
    id: 4,
    title: '5장 · 대관람차',
    place: '해피니스 랜드 · 대관람차 "해피 휠"',
    outdoor: true, size: [28, 22], spawn: [0, 9], ambient: 'night', ground: '#1a161e', fog: 0.032,
    intro: T('5장 · 대관람차', `높이 40미터 대관람차가 돌고 있었다. 칸 열 개가 천천히, 아주 천천히.
7번 칸에만 불이 켜져 있다.

"관람차에서 보면 놀이공원이 다 보여요!" 해피가 말했다.
"그날 밤에도 한 친구가 관람차에 오래오래 있었대요. 혼자서요."

운행실 창문에 운행표가 붙어 있다. 그리고 양쪽에 비상 정지 레버.`),
    props: [
      { t: 'ferris_wheel', x: 0, z: -6, r2: 6, speed: 0.07 }, { t: 'bleachers', x: -9, z: 6, w: 6 }, { t: 'lamp', x: -6, z: 2 }, { t: 'lamp', x: 6, z: 2 },
      { t: 'lantern_string', x: 0, z: 5, len: 20 }, { t: 'balloon_stand', x: 10, z: 6, anim: { type: 'bob', amp: 0.3, speed: 1 } }, { t: 'pine', x: -13, z: 9 }, { t: 'pine', x: 13, z: 9 },
      { t: 'speaker_pole', x: -12, z: -8 },
    ],
    objects: [
      { id: 'op_sheet', t: 'paper', x: 6, z: 3, y: 0.85, label: '관람차 운행표 (7월 7일)', kind: 'examine', once: true,
        on: { flag: 'op_sheet', sound: 'whisper' },
        text: `【 해피 휠 탑승 기록 · 7월 7일 21:20 】 (칸 번호 1~10)

  지우 → 2번 칸     도현 → 5번 칸     서아 → 9번 칸
  준호 → 3번 칸     하린 → 7번 칸     민규 → 10번 칸

  ※ VIP 아이: 7번 칸에 탄 채 30분째 내리지 않음. 하린이랑 칸을 바꿔 달라고 떼씀.
  ※ 관람차 전구는 칸 번호 순서대로 원을 그리며 달려 있음 (맨 위가 1번, 시계 방향).` },
      { id: 'op_table', t: 'crate', x: 6, z: 3, kind: 'deco' },
      { id: 'lights', t: 'star_lamp', x: -4.5, z: 2.5, h: 2.6, label: '운행실 전구 판', kind: 'lock', req: ['op_sheet'],
        lockedText: '운행실 전구 판. 관람차 칸처럼 원으로 달린 전구 열 개.',
        text: '관람차 칸과 똑같이 원으로 달린 전구 열 개. 아이들이 탄 칸을 좌석 번호(1~6) 순서대로 이어 보자.',
        lock: { input: 'stars', points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; return [0.5 + Math.cos(a) * 0.42, 0.5 + Math.sin(a) * 0.42]; }), labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], len: 6, answer: [1, 4, 8, 2, 6, 9] }, wrongScare: true,
        doneText: '전구 판에 별 모양이 남아 있다.',
        on: { flag: 'lights', give: 'park_relic_4', sound: 'bell',
          story: T('여섯 칸의 별', `여섯 칸을 잇자 전구 판에 일그러진 별이 떠올랐다. 별의 한 꼭짓점이 비어 있다. 7번 칸 자리.

운행실 서랍이 열리며 휴대용 게임기 하나가 미끄러져 나왔다. 뒷면에 "4번 최준호".
게임기 화면이 켜져 있다. 마지막 저장 시각 21:41, 저장 이름: "미궁 탈출 연습"`) } },
      { id: 'lever_a', t: 'handle', x: -12.5, z: -2, r: 90, y: 1.2, label: '비상 정지 레버 (서)', kind: 'coop', text: '비상 정지 레버를 당겼다!', coop: { group: 'stop', need: 2 } },
      { id: 'lever_b', t: 'handle', x: 12.5, z: -2, r: -90, y: 1.2, label: '비상 정지 레버 (동)', kind: 'coop', text: '비상 정지 레버를 당겼다!', coop: { group: 'stop', need: 2 } },
      { id: 'cabin7', t: 'chest', x: 2.5, z: 0.5, label: '내려온 7번 칸', kind: 'examine', hidden: true, req: ['stopped'], once: true,
        on: { flag: 'cabin7', give: 'park_relic_7', sound: 'musicbox', scare: 'balloons' },
        text: `관람차가 멈추자 7번 칸이 땅 가까이 내려왔다. 문이 저절로 열렸다.

좌석에 생일 초대장 한 장. 왕관 스티커가 붙어 있다.

  「 태민이의 12번째 생일 파티 🎂
    아빠가 만들어 준 나만의 '거울 미궁' 비밀 개장!
    7월 7일 밤 9시 반 — 어른들한테는 쉿! 」

초대장 뒷면에 아이 글씨로 명단 여섯 개. 신문에 나온 이름 그대로다.
그리고 맨 아래, 다른 글씨로: "술래는 나. 문은 내가 잠근다! — 태민"` },
      { id: 'exit', t: 'path_gate', x: 0, z: 10.4, r: 180, label: '바이킹 쪽 길', kind: 'door', req: ['lights', 'stopped'], to: 5,
        lockedText: '관람차 그림자가 길을 덮고 있다. 관람차를 세우고, 운행실 전구 판도 풀어야 한다.' },
    ],
    coops: {
      stop: { on: { flag: 'stopped', sound: 'power', toast: '관람차가 멈췄다',
        story: T('멈춘 관람차', `양쪽 레버가 동시에 내려가자 관람차가 끼이익— 멈췄다.
7번 칸이 땅 가까이 흔들리며 내려왔다. 불이 켜진 채로.`) } },
    },
    ghost: { type: 'mascot', speed: 2.5, sense: 7, teleport: 20, spawn: [-12, -9], name: '토끼 해피', auto: true },
    ghosts: [{ type: 'child', speed: 2.1, sense: 6, teleport: 22, spawn: [12, -9], name: '울고 있는 아이', startFlag: 'lights' }],
    objectives: [
      { until: 'op_sheet', text: '운행실을 살펴보자', hints: ['동쪽 상자 위 운행표.'] },
      { until: 'lights', text: '아이들이 탄 칸을 이어 보자', hints: ['좌석 순서대로 칸 번호: 2 → 5 → 9 → 3 → 7 → 10', '전구 판은 맨 위가 1번, 시계 방향.'] },
      { until: 'stopped', text: '관람차를 세우자', hints: ['양쪽 끝 레버를 8초 안에 함께. (혼자라면 하나만)'] },
      { until: '__end', text: '바이킹 쪽으로', hints: ['남쪽 길. (내려온 7번 칸에 무언가 있다)'] },
    ],
  },
];
export const PARK_CHAPTERS = [...PARK_1, ...PARK_CHAPTERS_2];
