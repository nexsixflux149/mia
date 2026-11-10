/*
 * 시나리오 8 — 삐에로 : 블루문 서커스의 마지막 앵콜 (난이도 최상)
 * 1998년 12월 24일 밤 8시, 떠돌이 서커스단 '블루문'의 마지막 공연.
 * 단장 마르코는 빚을 갚으려고 천막에 화재보험을 들어 두고, 공연이 끝난 밤 무대 아래 기름통에 불을 붙였다.
 * 그날 '사라지는 상자' 마술에 오른 여덟 살 한은별은 무대 아래 비밀 통로에 갇혔고,
 * 삐에로 뽀삐(본명 오세진)는 불길 속으로 돌아가 은별이를 찾았다. 둘 다 나오지 못했다.
 * 단장은 "광대가 아이를 데리고 달아났다"고 말했고, 사람들은 그 말을 믿었다.
 * 28년째, 폐유원지의 빈 천막에서는 매년 성탄 전야 8시에 공연이 다시 시작된다.
 * 관객석에서 웃고 있는 삐에로는 — 뽀삐가 아니다.
 *
 * 퍼즐 유형: 6자리 날짜 매표소, 힘자랑 저울(새), 야바위 컵(새), 거울에 비친 3×3 거울 벽,
 *           별자리 얼굴 잇기(새), 마지막 급식 시계, 발전기 전선, 라디오 주파수, 분장 순서,
 *           찢어진 사진 맞추기, 단장 트렁크 글자 다이얼, 북 신호 기억, 협동 조명, 공중그네,
 *           사라지는 상자 마술 순서, 그을음 밸브(손전등), 생일 노래 오르골, 무너진 들보 저울,
 *           증거 세 가지, 범인 지목, 은별의 별 그리기(한붓그리기), 마지막 앵콜.
 */
const T = (title, text) => ({ title, text });

export const CLOWN_CHAPTERS = [
  // ─────────────────────────────── 1장
  {
    id: 0,
    title: '1장 · 블루문 카니발',
    place: '폐유원지 블루문 랜드 · 2026년 12월 24일 밤 8시',
    outdoor: true,
    size: [28, 22],
    spawn: [0, 9],
    ambient: 'night',
    ground: '#22161e', fog: 0.032,
    intro: T('1장 · 블루문 카니발', `경기도 외곽, 1999년에 문을 닫은 블루문 랜드.
"성탄 전야 밤 8시가 되면 빈 천막에서 서커스 음악이 들린다"는 제보.

녹슨 아치 위 전구 몇 개가 혼자 깜빡였다.
B · L · U · E   M · O · O · N

매표소, 풍선 가게, 야바위 천막. 모두 1998년 그대로였다.
멀리 붉고 하얀 줄무늬 천막에서 왈츠가 흘러나온다.
바람 빠진 오르간처럼, 음이 조금씩 어긋난 왈츠.

그리고 매표소 창구 안에서 — 누군가 웃었다.`),
    props: [
      { t: 'big_top', x: 0, z: -19, r2: 9, h: 9 }, { t: 'lantern_string', x: 0, z: 4.5, len: 16 }, { t: 'lantern_string', x: 0, z: -3.5, len: 16 },
      { t: 'balloon_stand', x: -7.5, z: 6 }, { t: 'popcorn_cart', x: 8.5, z: 6.5, r: -30 }, { t: 'stall', x: -11, z: -2, r: 70 }, { t: 'stall', x: 11.5, z: -2.5, r: -70 },
      { t: 'clown_statue', x: -3.5, z: 9.6, r: 160 }, { t: 'jack_box', x: 5, z: -7.6, r: -20 }, { t: 'unicycle', x: -9.5, z: 8.2, r: 40 },
      { t: 'lamp', x: -6, z: 2 }, { t: 'lamp', x: 6, z: 2 }, { t: 'lamp', x: -6, z: -6 }, { t: 'lamp', x: 6, z: -6 }, { t: 'pine', x: -13, z: 9.5 }, { t: 'pine', x: 13, z: 9.5 },
      { t: 'juggling_pins', x: 2.5, z: 2.6 },
    ],
    objects: [
      { id: 'poster', t: 'notice_board', x: 3.5, z: 8.4, r: 180, label: '찢어진 공연 포스터', kind: 'examine', once: true,
        on: { flag: 'poster', sound: 'calliope_far', toast: '목표가 갱신되었습니다' },
        text: `【 블루문 서커스 · 고별 공연 · 마지막 앵콜 】

  1998년 12월 24일 (목)   밤 8시 막이 오릅니다
  출연  단장 마르코 · 삐에로 뽀삐 · 공중그네 리나 · 사자 레오
  특별 순서  ★ 사라지는 상자 ★  "오늘 밤, 관객 중 한 아이가 사라집니다!"

포스터 아래 누군가 매직으로 덧썼다.
"정말로 사라졌어요."` },
      { id: 'missing', t: 'paper', x: -4.6, z: 3.2, y: 0.85, label: '미아 찾기 전단', kind: 'examine',
        text: `【 미아를 찾습니다 】

  이름  한은별 (8세 · 여)
  실종  1998년 12월 24일 밤, 블루문 서커스 공연 중
  인상  빨간 코트, 별 모양 머리띠, 토끼 인형 '깡총이'를 안고 있음

  "공연 도중 서커스 광대 오모(32) 씨와 함께 사라졌습니다.
   광대를 보신 분은 꼭 연락 주세요."

전단 귀퉁이가 불에 그을려 있다.` },
      { id: 'missing_table', t: 'table', x: -4.6, z: 3.2, kind: 'deco' },
      { id: 'booth', t: 'ticket_booth', x: -9, z: 3.6, r: 60, label: '매표소', kind: 'lock',
        text: '매표소 창구에 6자리 번호 자물쇠가 걸려 있다.\n유리에 붙은 쪽지: "금고 번호는 늘 마지막 공연의 날짜(월·일)와 막이 오르는 시각(24시간)."',
        lock: { input: 'digits', len: 6, answer: '122420' }, wrongScare: true,
        doneText: '열린 매표소. 표 뭉치가 1998년 날짜 그대로 쌓여 있다.',
        on: { flag: 'booth', give: 'clown_relic_1', sound: 'door', ghost: 'start', scare: 'clown',
          story: T('매표소', `창구가 열리자 표 뭉치가 쏟아졌다. 맨 위의 한 장만 반으로 찢겨 있었다.

【 블루문 서커스 · 1998.12.24 · 맨 앞줄 7번 】
뒷면에 연필로 삐뚤빼뚤: "은별 — 뽀삐 아저씨 보러 옴!"

그 순간 매표소 안의 거울에 하얀 얼굴이 비쳤다.
분칠한 얼굴. 귀까지 찢어진 빨간 입. 그리고 금빛 눈.

"표 — 확인 — 했습니다아."

(웃는 삐에로가 쫓아온다. 손전등 빛을 싫어해 느려진다)`) } },
      { id: 'strong_sign', t: 'paper', x: 5.6, z: 1.2, y: 0.85, label: '힘자랑 안내판', kind: 'examine',
        text: `【 힘자랑! 종을 울려라! 】

  저울 반대편에 정확히 13kg를 올리면 종이 울립니다.
  ◆ 추는 딱 세 개만.
  ◆ 홀수 무게 추는 한 개만 올릴 수 있음.
  상품: 커다란 곰인형 (안에 뭐가 들었을까?)` },
      { id: 'strong_crate', t: 'crate', x: 5.6, z: 1.2, kind: 'deco' },
      { id: 'strongman', t: 'strongman', x: 8, z: -1.5, r: -90, label: '힘자랑 저울', kind: 'lock',
        text: '녹슨 힘자랑 기계 옆에 저울이 붙어 있다. 추를 골라 13kg를 맞추자.',
        lock: { input: 'balance', weights: [1, 2, 3, 5, 7, 8], target: 13, pick: 3, answer: [2, 3, 8] }, wrongScare: true,
        doneText: '종이 울린 뒤로 기계가 조용하다.',
        on: { flag: 'strong', give: 'tent_key', sound: 'bell',
          story: T('종소리', `땡— 녹슨 종이 28년 만에 울렸다.

상품 걸이에서 곰인형이 툭 떨어졌다. 배를 가른 자국이 있다.
안에서 나온 것은 솜이 아니라 열쇠 하나. 꼬리표: "거울의 집 — 단장 외 출입 금지"

천막 쪽 왈츠가 한 박자 늦게, 더 낮게 다시 시작됐다.`) } },
      { id: 'cups', t: 'cups_table', x: -2.5, z: -5, label: '야바위 탁자', kind: 'lock', req: ['booth'],
        lockedText: '빨간 컵 세 개가 엎어져 있다. 탁자 뒤 의자는 비어 있다… 지금은.',
        text: '어느새 탁자 뒤에 삐에로 마네킹이 앉아 있다. 끼익거리는 목소리.\n"공이 어디 있는지 맞히면 지나가게 해 주지. 틀리면… 한 번 더 놀자아."',
        lock: { input: 'cups', cups: 3, swaps: 10, start: 1 }, wrongScare: true,
        doneText: '마네킹은 고개를 푹 숙인 채 움직이지 않는다.',
        on: { flag: 'cups', sound: 'honk',
          story: T('야바위', `컵을 들자 하얀 공이 굴러 나왔다. 아니, 공이 아니었다.
작은 유리구슬 눈알. 인형의 눈.

마네킹이 박수를 쳤다. 딱. 딱. 딱.
"잘 봤어. 그날 밤 아무도 안 본 걸, 너는 보겠구나."

마네킹의 손가락이 거울의 집을 가리켰다.`) } },
      { id: 'mirror_gate', t: 'path_gate', x: 0, z: -10.4, label: '거울의 집 입구', kind: 'use', req: ['strong', 'cups'],
        lockedText: '거울의 집 입구. 쇠사슬과 커다란 자물쇠. 옆에서 삐에로 마네킹이 고개를 젓는다.',
        text: '거울의 집 입구의 쇠사슬 자물쇠.', use: { item: 'tent_key', times: 1 }, needText: '자물쇠에 맞는 열쇠가 필요하다. (힘자랑 상품)', toChapter: 1,
        on: { sound: 'gate' } },
    ],
    ghost: { type: 'clown', speed: 2.5, sense: 7, teleport: 24, spawn: [-11, -8], name: '웃는 삐에로' },
    objectives: [
      { until: 'poster', text: '카니발을 둘러보자', hints: ['입구 근처 게시판의 찢어진 포스터.'] },
      { until: 'booth', text: '매표소를 열자', hints: ['포스터에 공연 날짜와 시각이 있다.', '월·일 4자리 + 시각 2자리(24시간제).', '12월 24일 + 밤 8시(20시) → 122420'] },
      { until: 'strong', text: '힘자랑 종을 울리자', hints: ['안내판: 추 세 개, 홀수 추는 하나만.', '짝수 추는 2와 8뿐. 2+8 = 10, 나머지 홀수 하나로 3을 채우자.', '2kg · 3kg · 8kg'] },
      { until: 'cups', text: '야바위 삐에로를 이기자', hints: ['처음에 공이 들어간 컵만 눈으로 따라가자.', '틀려도 다시 할 수 있다. 섞는 순서는 매번 바뀐다.'] },
      { until: '__end', text: '거울의 집으로', hints: ['북쪽 천막 앞 입구. 힘자랑 상품인 열쇠를 쓰자.'] },
    ],
  },

  // ─────────────────────────────── 2장
  {
    id: 1,
    title: '2장 · 거울의 집',
    place: '블루문 랜드 · 거울의 집',
    size: [24, 18],
    spawn: [-9, 6],
    ambient: 'dark',
    floor: '#2a1a2a', wall: '#3a1a3a', fog: 0.05,
    walls: [{ x: -4, z: -1, w: 0.3, d: 12 }, { x: 3, z: 2, w: 0.3, d: 12 }, { x: -0.5, z: -5, w: 7, d: 0.3 }],
    intro: T('2장 · 거울의 집', `문이 닫히자 왈츠가 뚝 끊겼다.

사방이 거울이다. 키가 늘어난 나, 얼굴이 납작한 나, 목이 꺾인 나.
수십 명의 당신이 동시에 손전등을 비춘다.

그런데 거울 하나에서만, 당신이 손전등을 늦게 들었다.
반 박자 늦게.

어딘가에서 실이 팽팽하게 당겨지는 소리가 난다.
끼익. 끼익.`),
    props: [
      { t: 'funhouse_mirror', x: -10.8, z: -2, r: 90, wave: 3 }, { t: 'funhouse_mirror', x: -10.8, z: 2.5, r: 90, wave: 1.8 }, { t: 'funhouse_mirror', x: -4.4, z: 2.5, r: -90, wave: 4 },
      { t: 'funhouse_mirror', x: -2, z: 8.6, r: 180 }, { t: 'funhouse_mirror', x: 1.5, z: 8.6, r: 180, wave: 3.5 }, { t: 'funhouse_mirror', x: 2.6, z: 0, r: -90, wave: 2 },
      { t: 'funhouse_mirror', x: 11.6, z: 3, r: -90, wave: 2.6 }, { t: 'funhouse_mirror', x: 7, z: 8.6, r: 180, wave: 1.5 }, { t: 'funhouse_mirror', x: -3, z: -8.6, r: 0, wave: 2.2 },
      { t: 'clown_statue', x: -8.5, z: -7, r: 30, s: 0.8 }, { t: 'rug', x: 0, z: 3 },
    ],
    objects: [
      { id: 'note', t: 'paper', x: -8, z: 2, y: 0.85, label: '거울에 붙은 쪽지', kind: 'examine', once: true,
        on: { flag: 'note', sound: 'whisper' },
        text: `거울 모서리에 끼워 둔 쪽지. 아이 글씨다.

"뽀삐 아저씨가 그랬다.
 거울의 집에서 길을 잃으면 거울이 아니라 진짜를 봐야 한대.
 거울 속은 왼쪽이랑 오른쪽이 바뀌어 있으니까.
 — 은별"

쪽지 뒷면, 어른 글씨: "단장실 열쇠는 거울 벽 뒤. 삐에로가 숨은 거울만 깨면 된다."` },
      { id: 'note_table', t: 'table', x: -8, z: 2, kind: 'deco' },
      { id: 'reflection', t: 'funhouse_mirror', x: 0, z: 8.6, r: 180, label: '커다란 거울', kind: 'examine',
        text: `커다란 거울에 맞은편 '거울 벽'이 비친다. 아홉 장짜리 거울 벽.
거울 속, 그중 몇 장에서 삐에로가 웃고 있다.

  거울 속 모습
  ■ □ □
  ■ ■ ■
  □ □ ■

(■ = 삐에로가 비친 칸)` },
      { id: 'mirror_wall', t: 'panel', x: 11.6, z: -3, r: -90, label: '아홉 장짜리 거울 벽', kind: 'lock', req: ['note'],
        lockedText: '아홉 장짜리 거울 벽. 어느 것을 깨야 할지 모르겠다.',
        text: '진짜 거울 벽이다. 삐에로가 숨은 거울을 골라 깨자. (칸을 눌러 표시)',
        lock: { input: 'grid', size: 3, answer: '001111100' }, wrongScare: true,
        doneText: '깨진 거울 뒤로 좁은 통로가 보인다.',
        on: { flag: 'mirrors', sound: 'glass', scare: 'smiles',
          story: T('깨진 거울', `와장창— 다섯 장의 거울이 한꺼번에 깨졌다.
조각마다 웃는 입이 하나씩 비쳤다가 사라졌다.

거울 벽 뒤 선반에 동물 우리 배치도 한 장. 사자 우리에 빨간 동그라미.
그리고 바닥에 실 끊긴 줄 인형 하나. 얼굴이 금 가 있다.

인형이 고개를 들었다.`) } },
      { id: 'drawing', t: 'paper', x: -7, z: -8, y: 0.85, label: '크레용 그림', kind: 'examine',
        text: `벽에 테이프로 붙인 크레용 그림. 하얀 얼굴에 빨간 코, 파란 눈물.

"뽀삐 아저씨 얼굴 그리는 법 (은별)
  1. 왼쪽 눈
  2. 오른쪽 눈
  3. 빨간 코
  4. 입은 왼쪽 끝 → 가운데 → 오른쪽 끝 (웃는 입!)
  ★ 반짝반짝 별은 그리면 안 돼. 그건 은별이 거야!"` },
      { id: 'drawing_table', t: 'table', x: -7, z: -8, kind: 'deco' },
      { id: 'star_ceiling', t: 'star_lamp', x: 0, z: -7, h: 2.6, label: '천장의 별 전구', kind: 'lock',
        text: '천장에 전구 아홉 개가 별처럼 박혀 있다. 전구를 이어 무언가를 그릴 수 있을 것 같다.',
        lock: { input: 'stars', points: [[0.5, 0.52], [0.32, 0.28], [0.68, 0.28], [0.22, 0.7], [0.5, 0.86], [0.78, 0.7], [0.12, 0.12], [0.9, 0.42], [0.5, 0.08]], len: 6, answer: [1, 2, 0, 3, 4, 5] }, wrongScare: true,
        doneText: '천장에 웃는 얼굴이 빛나고 있다.',
        on: { flag: 'face', give: 'clown_relic_2', sound: 'musicbox',
          story: T('웃는 얼굴', `마지막 전구를 잇자 천장에 웃는 얼굴이 떠올랐다. 하얀 얼굴, 빨간 코, 파란 눈물.

얼굴에서 반짝이는 것이 떨어졌다. 별 모양 머리띠.
안쪽에 이름 스티커: "한은별"

거울들이 일제히 고개를 돌렸다. 당신이 아니라 출구 쪽을 보고 있다.`) } },
      { id: 'exit', t: 'door', x: 11.85, z: 6, r: -90, label: '동물 우리로 가는 문', kind: 'door', req: ['mirrors'], to: 2,
        lockedText: '문이 잠겨 있다. 거울 벽 뒤에 무언가 있을 것 같다.' },
    ],
    ghost: { type: 'marionette', speed: 2.4, sense: 6, teleport: 18, spawn: [8, 6], name: '실 끊긴 인형', auto: true },
    ghosts: [{ type: 'clown', speed: 2.7, sense: 7, teleport: 20, startFlag: 'mirrors', spawn: [-10, -7], name: '웃는 삐에로' }],
    objectives: [
      { until: 'note', text: '거울의 집을 지나가자', hints: ['왼쪽 구역 탁자 위 쪽지.'] },
      { until: 'mirrors', text: '삐에로가 숨은 거울을 깨자', hints: ['위쪽 커다란 거울에 거울 벽이 비친다.', '거울 속은 좌우가 바뀌어 있다. 각 줄을 뒤집자.', '□□■ / ■■■ / ■□□ → 오른쪽 위, 가운데 줄 전부, 왼쪽 아래'] },
      { until: '__end', text: '출구로 (천장의 별 전구에 은별이의 물건이 있다)', hints: ['오른쪽 구역의 문. 크레용 그림대로 별 전구를 이으면 유품이 나온다.', '왼쪽 눈 → 오른쪽 눈 → 코 → 입 왼쪽 → 입 가운데 → 입 오른쪽. 맨 위·구석 별은 함정.'] },
    ],
  },

  // ─────────────────────────────── 3장
  {
    id: 2,
    title: '3장 · 동물 우리',
    place: '블루문 서커스 · 동물 우리와 단원 마차',
    size: [26, 20],
    spawn: [-10, 7],
    ambient: 'candle',
    floor: '#3a2a1a', wall: '#4a2a20', fog: 0.05,
    walls: [{ x: 3, z: -4, w: 0.3, d: 12 }],
    intro: T('3장 · 동물 우리', `짚 냄새, 녹 냄새, 그리고 오래된 탄내.

텅 빈 우리들이 줄지어 서 있다. 코끼리 '보리', 말 '구름이', 그리고 맨 끝 — 사자 '레오'.
레오의 우리만 자물쇠 대신 시계가 달려 있다.

단원들이 지내던 마차 창문에 불이 켜져 있다.
라디오에서 지지직, 28년 전 저녁 뉴스가 나오다 끊긴다.

멀리서 채찍 소리. 탁—!
"쇼 머스트 고 온. 공연은 계속되어야 한다."`),
    props: [
      { t: 'cage', x: -8, z: -6.5 }, { t: 'cage', x: -4.5, z: -6.5 }, { t: 'hay', x: -10.5, z: -2, r: 20 }, { t: 'hay', x: -6, z: -1.5 }, { t: 'barrel', x: -11.5, z: 4 },
      { t: 'barrel', x: 11.5, z: 7.5 }, { t: 'crate', x: 10, z: 7.8 }, { t: 'circus_wagon', x: 8.5, z: -7.2 }, { t: 'lantern', x: -1, z: 7.5 }, { t: 'lantern', x: 11, z: 0 },
      { t: 'cannon', x: 9, z: 3.5, r: -60 },
    ],
    objects: [
      { id: 'trainer_log', t: 'book', x: -8.5, z: 4, y: 0.85, label: '조련사 일지', kind: 'examine', once: true,
        on: { flag: 'log', sound: 'whisper' },
        text: `【 조련사 일지 · 1998년 12월 24일 】

  18:00  코끼리 보리 — 사료, 물
  19:20  말 구름이·바람이 — 당근 (은별이가 줬다)
  21:40  사자 레오 — 마지막 급식. 이상하게 먹지 않음.
         무대 쪽을 보며 계속 운다.
  22:05  무대 아래에서 연기. 단장님은 "괜찮다, 소품 태우는 냄새"라고 함.
  22:10  …

마지막 줄은 그을려서 읽을 수 없다.` },
      { id: 'log_table', t: 'table', x: -8.5, z: 4, kind: 'deco' },
      { id: 'leo_cage', t: 'cage', x: -1, z: -6.5, open: true, label: '사자 레오의 우리', kind: 'lock',
        text: '레오의 우리. 자물쇠 대신 둥근 시계가 달려 있다.\n시계판에 긁힌 글씨: "마지막 밥 시간에 맞추면 열림"',
        lock: { input: 'clock', answer: ['9:40'] }, wrongScare: true,
        doneText: '열린 우리 안 짚 더미가 둥글게 눌려 있다.',
        on: { flag: 'cage', give: 'clown_relic_3', sound: 'growl', ghost: 'start',
          story: T('레오의 우리', `시곗바늘이 9시 40분에 닿자 우리 문이 스르륵 열렸다.

짚 더미 속에 토끼 인형이 파묻혀 있었다. 한쪽 귀가 그을린 '깡총이'.
인형 목에 걸린 쪽지: "레오야 무서워하지 마. 뽀삐 아저씨가 금방 데리러 온대. — 은별"

은별이는 공연 전에 레오에게 인사하러 왔었다. 그리고 인형을 두고 갔다.
…다시 돌아올 생각으로.

탁— 등 뒤에서 채찍 소리. 높은 실크햇의 그림자가 우리 창살에 길게 늘어졌다.
(단장 마르코가 깨어났다)`) } },
      { id: 'elec_note', t: 'paper', x: 5, z: -2, y: 0.85, label: '전기 기사의 메모', kind: 'examine',
        text: `발전기 사용법 (전기 기사 김씨)

  ◆ 파랑은 무조건 천막 조명.
  ◆ 노랑은 동물 우리.
  ◆ 빨강은 절대로 승강기에 꽂지 말 것! (과열됨. 진짜로!)
  ◆ 남는 건 초록.

추신: 단장님이 무대 아래 승강기 선을 자꾸 뽑아 놓는다. 왜지?` },
      { id: 'elec_crate', t: 'crate', x: 5, z: -2, kind: 'deco' },
      { id: 'generator', t: 'circus_wagon', x: 9, z: -1.2, r: 180, label: '단원 마차 발전기', kind: 'lock', req: ['cage'],
        lockedText: '마차 문이 안쪽에서 걸려 있다. 안에서 무언가 끓는 소리.',
        text: '마차 안의 낡은 발전기. 전선 네 가닥을 알맞은 곳에 꽂자.',
        lock: { input: 'wires', left: ['빨강', '파랑', '노랑', '초록'], right: ['천막 조명', '동물 우리', '매표소', '무대 아래 승강기'], colors: ['#d6303a', '#3b7dd8', '#e8c13a', '#2fbf71'], answer: ['매표소', '천막 조명', '동물 우리', '무대 아래 승강기'] }, wrongScare: true,
        doneText: '발전기가 덜덜거리며 돈다. 마차 서랍이 열려 있다.',
        on: { flag: 'power', give: 'ledger', sound: 'power',
          story: T('단장의 장부', `발전기가 돌자 마차 안 전등이 켜졌다. 서랍 하나가 저절로 열렸다.

검은 가죽 장부. 단장 마르코의 이중장부였다.

  1998.11.30  빚 독촉 — 3억 2천
  1998.12.01  천막·장비 화재보험 가입 (보험금 3억)
  1998.12.24  고별 공연. "모든 걸 정리한다."

장부 맨 뒤에 휘갈긴 글씨.
"광대 녀석이 무대 아래 기름통을 봤다. 입을 막아야 한다."`) } },
      { id: 'radio_poster', t: 'poster', x: -4.5, z: 9.85, y: 1.8, r: 180, label: '라디오 광고 포스터', kind: 'examine',
        text: '【 블루문 서커스 라디오 광고 】\n  "오늘 밤, 마지막 앵콜!"  ─ FM 98.9 블루문 라디오에서 실황 중계\n\n포스터 위에 손톱자국이 세 줄.' },
      { id: 'radio', t: 'radio', x: 7.5, z: 7.6, label: '마차 안 라디오', kind: 'lock', req: ['power'],
        lockedText: '라디오에 전기가 들어오지 않는다.',
        text: '지지직거리는 라디오. 다이얼을 돌려 주파수를 맞추자.',
        lock: { input: 'tune', min: 88, max: 108, step: 0.1, unit: 'MHz', answer: 98.9, tol: 0.25 },
        doneText: '라디오가 꺼졌다. 그런데 스피커에서 숨소리가 들린다.',
        on: { flag: 'radio', sound: 'radio', scare: 'tv',
          story: T('1998년 12월 25일 아침 뉴스', `"…어젯밤 경기 북부 블루문 서커스 천막에서 불이 나 천막이 모두 탔습니다.
 관객은 모두 대피했지만, 공연 중이던 여덟 살 한은별 양이 실종됐습니다.
 서커스 단장 마르코 씨는 '광대 오세진 씨가 아이를 데리고 달아나는 걸 봤다'고 진술했고,
 경찰은 오 씨를 유괴 용의자로 수배했습니다…"

지지직. 뉴스가 끊기고, 다른 목소리가 들렸다. 낮고, 떨리는 남자 목소리.
"…아니야. 은별이는 아직 무대 아래 있어. 누가 좀…"`) } },
      { id: 'hook', t: 'crate', x: 11, z: 4, label: '곡예 도구 상자', kind: 'pickup', item: 'trapeze_hook',
        text: '곡예 도구 상자에서 공중그네용 쇠갈고리를 찾았다. 손잡이에 "리나" 각인.', takenText: '빈 상자. 밧줄 조각만 남아 있다.' },
      { id: 'to_dressing', t: 'iron_door', x: 12.85, z: -3, r: -90, label: '분장실 복도', kind: 'door', req: ['power', 'radio'], to: 3,
        lockedText: '두꺼운 철문. 안쪽에서 누군가 문을 붙잡고 있다. 마차의 발전기를 돌리고, 라디오에서 무슨 일이 있었는지 들어 보자.' },
    ],
    ghost: { type: 'ringmaster', speed: 2.6, sense: 7, teleport: 20, spawn: [10, -6], name: '단장 마르코', hearRun: true },
    ghosts: [{ type: 'clown', speed: 2.6, sense: 6, teleport: 22, startFlag: 'radio', spawn: [-11, -8], name: '웃는 삐에로' }],
    objectives: [
      { until: 'log', text: '동물 우리를 조사하자', hints: ['왼쪽 탁자 위 조련사 일지.'] },
      { until: 'cage', text: '사자 레오의 우리를 열자', hints: ['조련사 일지: 레오의 마지막 급식 시각.', '21시 40분.', '시계로는 9시 40분.'] },
      { until: 'power', text: '단원 마차의 발전기를 돌리자', hints: ['가운데 벽 옆 상자 위 전기 기사의 메모.', '파랑=조명, 노랑=우리. 빨강은 승강기 금지 → 빨강=매표소, 초록=승강기.'] },
      { until: 'radio', text: '라디오를 맞추자', hints: ['남쪽 벽 라디오 광고 포스터.', 'FM 98.9'] },
      { until: '__end', text: '분장실 복도로', hints: ['오른쪽 철문. (도구 상자에서 공중그네 갈고리를 챙기자 — 5장에서 쓴다)'] },
    ],
  },

  // ─────────────────────────────── 4장
  {
    id: 3,
    title: '4장 · 분장실',
    place: '블루문 서커스 · 분장실',
    size: [22, 16],
    spawn: [-8, 5],
    ambient: 'candle',
    floor: '#3a2228', wall: '#5a2a3a', fog: 0.055,
    walls: [{ x: 2, z: 3.5, w: 0.3, d: 9 }],
    intro: T('4장 · 분장실', `전구 달린 거울 다섯 개가 한꺼번에 켜졌다.

분장대마다 이름표. 마르코, 리나, 미나, 김씨 — 그리고 '뽀삐'.
뽀삐의 분장대만 깨끗하게 정돈되어 있다. 28년 동안 누가 매일 닦은 것처럼.

천장 쪽에서 무언가가 기어간다. 사각, 사각.
반짝이 의상을 입은 여자가 거꾸로 매달려 당신을 내려다보았다.
1997년 공중그네에서 떨어진 리나. 그날도 안전망은 없었다.`),
    props: [
      { t: 'vanity_bulb', x: -9.5, z: -7.2 }, { t: 'vanity_bulb', x: -6.5, z: -7.2 }, { t: 'vanity_bulb', x: 5, z: -7.2 }, { t: 'kimono_rack', x: 9.7, z: 2, r: -90 },
      { t: 'kimono_rack', x: 9.7, z: -2.5, r: -90 }, { t: 'mannequin', x: -10, z: 2 }, { t: 'chest', x: 6, z: 6.8 }, { t: 'juggling_pins', x: -3, z: 1 }, { t: 'unicycle', x: -10, z: 6.6, r: 20 },
      { t: 'rug', x: -4, z: 0 },
    ],
    objects: [
      { id: 'diary', t: 'book', x: -3.5, z: -6.9, y: 0.85, label: '뽀삐의 분장 노트', kind: 'examine', once: true,
        on: { flag: 'diary', sound: 'musicbox' },
        text: `【 뽀삐(오세진)의 분장 노트 】

12월 10일. 은별이가 오늘도 맨 앞줄에 왔다. 엄마가 매표소 일을 해서 매일 공짜로 본다.
           웃는 법을 잊어버린 아이였는데, 오늘은 내 빨간 코를 보고 웃었다.

12월 20일. 단장이 고별 공연 '사라지는 상자'에 은별이를 쓰겠단다. 무대 아래 비밀 통로로
           빠져나와 객석 뒤에서 짠 하고 나타나는 마술. 은별이는 신이 났다.

12월 23일. 무대 아래에 기름통이 잔뜩 있다. 소품이 아니다. 단장한테 물었더니
           "광대는 웃기기만 하면 된다"고 했다.

12월 24일. 은별이 생일이다. 공연 끝나면 케이크를 줄 거다.
           혹시 무슨 일이 생기면 — 은별이부터.` },
      { id: 'photos', t: 'frame', x: -6.5, z: -7.6, y: 1.9, label: '거울에 꽂힌 사진 네 장', kind: 'examine',
        text: `거울 테두리에 폴라로이드 네 장. 뒷면에 번호.

  #1  얼굴 전체가 하얗다. 아직 아무것도 그리지 않았다.
  #2  눈가가 까맣게 칠해졌다.
  #3  왼쪽 눈 밑에 파란 눈물 한 방울.
  #4  입술이 빨갛다. …그런데 코가 없다.

맨 아래 메모: "코는 언제나 맨 마지막. 은별이가 직접 달아 준다."` },
      { id: 'vanity', t: 'vanity_bulb', x: -3.5, z: -7.2, label: '뽀삐의 분장대', kind: 'lock',
        text: '뽀삐의 분장대. 거울 아래 분장 도구 다섯 개. 뽀삐의 순서대로 분장하자.',
        lock: { input: 'buttons', buttons: ['빨간 코', '파란 눈물', '하얀 분칠', '빨간 입술', '검은 눈매'], len: 5, answer: ['하얀 분칠', '검은 눈매', '파란 눈물', '빨간 입술', '빨간 코'] }, wrongScare: true,
        doneText: '거울 속에서 분장을 마친 얼굴이 웃는다. 당신 얼굴이 아니다.',
        on: { flag: 'makeup', give: 'clown_relic_4', sound: 'bell',
          story: T('진짜 뽀삐', `마지막으로 빨간 코를 달자 거울 속 얼굴이 바뀌었다.
하얀 분칠, 까만 눈매, 파란 눈물 한 방울. 그리고 — 파란 눈.

금빛 눈이 아니었다. 쫓아오던 삐에로와는 다른 얼굴이었다.

거울 속 남자가 입을 움직였다. 소리는 나지 않았다.
"…저건 내가 아니야."

거울 틀 뒤에서 종이가 떨어졌다. 크레용 그림.
빨간 코의 삐에로가 여자아이 손을 잡고 있다. "뽀삐 아저씨랑 나 ♥ 생일 축하해 은별아"`) } },
      { id: 'torn_photo', t: 'easel', x: -1, z: 4, label: '찢어진 단체 사진', kind: 'lock',
        text: '단원 단체 사진이 아홉 조각으로 찢겨 있다. 맞춰 보자.',
        lock: { input: 'slide', size: 3, image: 'clown', answer: '12345678_' },
        doneText: '맞춰진 사진. 단장의 얼굴만 손톱으로 긁혀 있다.',
        on: { flag: 'photo', sound: 'whisper',
          story: T('단체 사진', `1998년 12월 24일 공연 직전, 블루문 서커스 단체 사진.

가운데 실크햇의 단장 마르코. 왼쪽에 삐에로 뽀삐, 어깨 위에 목말 탄 은별이.
사진 속 단장의 손에서 담배 연기가 피어오른다. 금장 라이터.

그런데 단장의 눈이 — 사진 속에서 천천히 당신 쪽으로 움직였다.`) } },
      { id: 'marco_poster', t: 'poster', x: 9.85, z: 6, y: 1.8, r: -90, label: '단장의 포스터', kind: 'examine',
        text: '【 위대한 단장 MARCO! 】\n금박 글씨. 포스터 아래 서명도 똑같다: "M·A·R·C·O"\n\n누군가 포스터의 입 부분에 담배 구멍을 뚫어 놓았다.' },
      { id: 'trunk', t: 'chest', x: 8.4, z: -5.4, label: '단장의 트렁크', kind: 'lock', req: ['photo'],
        lockedText: '단장의 트렁크. 다섯 글자 다이얼 자물쇠. 아직 무엇을 맞춰야 할지 모르겠다.',
        text: '단장의 트렁크. 다섯 글자 다이얼. "주인 이름을 맞추시오"',
        lock: { input: 'dial', wheels: [['A', 'B', 'C', 'M', 'O', 'R'], ['A', 'B', 'C', 'M', 'O', 'R'], ['A', 'B', 'C', 'M', 'O', 'R'], ['A', 'B', 'C', 'M', 'O', 'R'], ['A', 'B', 'C', 'M', 'O', 'R']], answer: ['M', 'A', 'R', 'C', 'O'] }, wrongScare: true,
        doneText: '열린 트렁크. 연미복 냄새와 기름 냄새.',
        on: { flag: 'trunk', give: 'insurance', sound: 'drawer', scare: 'ringmaster',
          story: T('단장의 트렁크', `트렁크 안에는 붉은 연미복, 채찍, 그리고 서류 봉투.

【 화재보험 증권 · 블루문 서커스 】
  보험 대상  대형 천막·무대 장비 일체
  가입일    1998년 12월 1일 / 보험금 3억 원
  수익자    마르코 (단장)

봉투 안쪽에 연필 메모: "24일 밤 10시. 관객 다 빠지면."

트렁크 바닥에 하얀 분칠 통과 빨간 립스틱. 금빛 컬러 렌즈.
쫓아오던 '웃는 삐에로'의 분장 도구였다.`) } },
      { id: 'exit', t: 'door', x: 0, z: 7.85, r: 180, label: '대형 천막으로', kind: 'door', req: ['makeup', 'trunk'], to: 4,
        lockedText: '천막으로 가는 문. 문틈으로 왈츠가 새어 나온다. 아직 이 방에서 알아야 할 것이 남았다.' },
    ],
    ghost: { type: 'crawler', speed: 2.8, sense: 6, teleport: 16, spawn: [8, -5], name: '거꾸로 기는 곡예사 리나', auto: true },
    ghosts: [{ type: 'ringmaster', speed: 2.4, sense: 6, teleport: 24, startFlag: 'trunk', spawn: [-9, -6], name: '단장 마르코' }],
    objectives: [
      { until: 'diary', text: '분장실을 조사하자', hints: ['가운데 분장대 위 뽀삐의 노트.'] },
      { until: 'makeup', text: '뽀삐의 순서대로 분장하자', hints: ['옆 분장대 거울에 꽂힌 사진 네 장.', '분칠 → 눈매 → 눈물 → 입술 → 코(맨 마지막)'] },
      { until: 'photo', text: '찢어진 단체 사진을 맞추자', hints: ['가운데 이젤. 빈칸 옆 조각을 밀어 1~8 순서로.'] },
      { until: 'trunk', text: '단장의 트렁크를 열자', hints: ['오른쪽 벽의 단장 포스터에 이름이 있다.', 'M · A · R · C · O'] },
      { until: '__end', text: '대형 천막으로', hints: ['아래쪽 문.'] },
    ],
  },

  // ─────────────────────────────── 5장
  {
    id: 4,
    title: '5장 · 대형 천막',
    place: '블루문 서커스 · 붉은 줄무늬 대형 천막',
    size: [30, 24],
    spawn: [0, 10],
    ambient: 'dark',
    floor: '#2a1a14', wall: '#5a0a1a', fog: 0.045,
    intro: T('5장 · 대형 천막', `천막 안은 1998년 12월 24일 밤 그대로였다.

텅 빈 관객석. 맨 앞줄 7번 자리에만 작은 빨간 코트가 놓여 있다.
무대 가운데에 별이 그려진 커다란 상자. '사라지는 상자'.

높은 곳에서 공중그네가 혼자 흔들린다. 끼익, 끼익.
조명은 모두 꺼져 있다.

어둠 속에서 박수 소리. 짝. 짝. 짝.
관객석에 아무도 없는데.`),
    props: [
      { t: 'ring_stage', x: 0, z: -1, r2: 6 }, { t: 'bleachers', x: -9, z: 9, w: 8 }, { t: 'bleachers', x: 9, z: 9, w: 8 }, { t: 'bleachers', x: -12.5, z: -5, r: 90, w: 8 },
      { t: 'bleachers', x: 12.5, z: -5, r: -90, w: 8 }, { t: 'cannon', x: 8, z: -9, r: -40 }, { t: 'trapeze', x: 3, z: -4, h: 6 }, { t: 'trapeze', x: -4, z: -6, h: 6.5 },
      { t: 'clown_statue', x: -13, z: 10, r: 135, s: 0.9 }, { t: 'juggling_pins', x: 3, z: 2 }, { t: 'unicycle', x: -3.5, z: 2.4, r: 60 },
    ],
    objects: [
      { id: 'coat', t: 'paper', x: 1.5, z: 6.6, y: 0.9, label: '맨 앞줄 7번 자리', kind: 'examine', once: true,
        on: { flag: 'coat', sound: 'whisper' },
        text: `맨 앞줄 7번. 작은 빨간 코트가 의자에 개켜져 있다.

주머니에 공연 순서표.
  ① 단장 인사
  ② 사자 레오
  ③ 공중그네 미나
  ④ 삐에로 뽀삐의 저글링
  ⑤ ★ 사라지는 상자 ★ (관객 한 명 — 은별이!)
  ⑥ 마지막 앵콜

코트 안감에 바느질한 글씨: "추우면 입어. — 엄마"` },
      { id: 'program', t: 'book', x: -6, z: 3, y: 0.5, label: '마술 대본', kind: 'examine',
        text: `【 사라지는 상자 · 무대 대본 (단장용) 】

  첫째, 아이를 상자에 넣는다.
  다음, 검은 천을 덮는다.
  북이 울리면, 상자를 한 바퀴 돌린다.
  마지막에 천을 걷는다. — 짠! 상자는 비어 있다.

  (아이는 무대 아래 통로로 내려가 객석 뒤로 나온다.
   ※ 24일 밤에는 통로 끝 문을 잠가 둘 것. — M)` },
      { id: 'program_box', t: 'drum', x: -6, z: 3, kind: 'deco' },
      { id: 'spot_a', t: 'spotlight', x: -13.5, z: 2, r: 90, label: '왼쪽 조명탑', kind: 'coop', text: '조명 스위치를 올렸다!', coop: { group: 'spots', need: 2 } },
      { id: 'spot_b', t: 'spotlight', x: 13.5, z: 2, r: -90, label: '오른쪽 조명탑', kind: 'coop', text: '조명 스위치를 올렸다!', coop: { group: 'spots', need: 2 } },
      { id: 'drum', t: 'drum', x: 6, z: 3.5, label: '악단의 큰북', kind: 'lock', req: ['spots'],
        lockedText: '큰북. 너무 어두워서 북채가 보이지 않는다.',
        text: '악단석의 큰북이 혼자 울린다. 둥, 둥, 따다닥… 같은 박자로 대답하자.',
        lock: { input: 'simon', buttons: ['둥', '따', '챙', '쿵'], colors: ['#d6303a', '#ffd36a', '#6fd6ff', '#b39dff'], answer: ['둥', '둥', '따', '챙', '쿵', '따', '둥'] }, wrongScare: true,
        doneText: '북이 조용하다. 상자 위의 별이 빛나고 있다.',
        on: { flag: 'drum', sound: 'stomp', toast: '사라지는 상자가 빛난다' } },
      { id: 'trapeze', t: 'trapeze', x: 0, z: -8, h: 6, label: '높이 걸린 공중그네', kind: 'use', req: ['spots'],
        lockedText: '어둠 속 어딘가에서 공중그네가 흔들린다. 보이지 않는다.',
        text: '조명에 비친 공중그네. 너무 높다. 갈고리로 끌어내려 보자.',
        use: { item: 'trapeze_hook', times: 1 }, needText: '높은 곳에 닿을 갈고리가 필요하다. (3장 곡예 도구 상자)',
        doneText: '내려온 공중그네가 천천히 흔들린다.',
        on: { flag: 'trapeze', give: 'clown_relic_5', sound: 'creak', scare: 'crawler',
          story: T('공중그네', `갈고리로 그네를 끌어내리자 손잡이에 감긴 무언가가 떨어졌다.
빨간 고무 코. 뽀삐의 코다.
코 안쪽에 작은 글씨: "은별이 거 — 빌려준 것. 앵콜 때 돌려받기!"

그네 줄을 타고 반짝이 의상의 리나가 거꾸로 내려왔다.
얼굴이 당신 코앞에서 멈췄다. 그리고 속삭였다.
"그날 밤… 상자를 잠근 건 단장이야."`) } },
      { id: 'magic_box', t: 'magic_box', x: 0, z: -1, label: '사라지는 상자', kind: 'lock', req: ['drum'],
        lockedText: '별이 그려진 커다란 상자. 꿈쩍도 하지 않는다. 북소리가 필요할 것 같다.',
        text: '사라지는 상자. 대본대로 마술을 해 보자. (5단계)',
        lock: { input: 'buttons', buttons: ['천 걷기', '상자 돌리기', '아이 넣기', '북 치기', '천 덮기'], len: 5, answer: ['아이 넣기', '천 덮기', '북 치기', '상자 돌리기', '천 걷기'] }, wrongScare: true,
        doneText: '상자 바닥의 비밀 문이 열려 있다. 아래에서 탄내가 올라온다.',
        on: { flag: 'box', sound: 'jackbox', ghost: 'start', scare: 'jackbox',
          story: T('사라지는 상자', `천을 걷자 상자는 비어 있었다. 대본대로.

상자 바닥이 덜컥 내려앉았다. 좁은 계단이 무대 아래로 이어진다.
계단 벽에 아이 손바닥 자국. 위로, 위로 긁어 올라간 자국.

관객석에서 박수가 터졌다. 수백 명의 박수.
고개를 들자 관객석이 가득 차 있었다. 모두 하얀 분칠을 한 얼굴로, 웃고 있었다.

"앵콜! 앵콜! 앵콜!"`) } },
      { id: 'trapdoor', t: 'hatch', x: 0, z: -3.6, label: '무대 아래 비밀 통로', kind: 'door', hidden: true, req: ['box'], to: 5 },
    ],
    coops: {
      spots: { on: { flag: 'spots', light: 'on', sound: 'power',
        story: T('조명', `양쪽 조명탑이 동시에 켜지자 하얀 빛 두 줄기가 무대 가운데에서 만났다.

빛 속에 먼지가 눈처럼 떠 있다.
높은 곳의 공중그네, 악단석의 큰북, 그리고 별이 그려진 상자가 드러났다.

큰북이 혼자 울리기 시작했다. 둥. 둥.`) } },
    },
    ghost: { type: 'clown', speed: 2.9, sense: 8, teleport: 18, spawn: [-12, -9], name: '웃는 삐에로', auto: true },
    ghosts: [{ type: 'marionette', speed: 2.5, sense: 6, teleport: 20, startFlag: 'drum', spawn: [12, -9], name: '실 끊긴 인형' }],
    objectives: [
      { until: 'coat', text: '천막을 둘러보자', hints: ['맨 앞줄 가운데 자리의 빨간 코트.'] },
      { until: 'spots', text: '조명을 켜자', hints: ['양쪽 끝 조명탑을 8초 안에 함께 켜자. (혼자라면 하나만)'] },
      { until: 'drum', text: '큰북에 대답하자', hints: ['북이 치는 순서를 잘 듣고 그대로.'] },
      { until: 'box', text: '사라지는 상자 마술을 하자', hints: ['왼쪽 북 위의 마술 대본.', '넣기 → 덮기 → 북 → 돌리기 → 걷기'] },
      { until: '__end', text: '무대 아래로 (공중그네에 은별이의 물건이 걸려 있다)', hints: ['상자 앞 바닥의 비밀 통로. 공중그네는 3장 갈고리로 끌어내리자.'] },
    ],
  },

  // ─────────────────────────────── 6장
  {
    id: 5,
    title: '6장 · 무대 아래',
    place: '블루문 서커스 · 불탄 무대 아래 통로',
    size: [24, 18],
    spawn: [-9, 6],
    ambient: 'abyss',
    floor: '#1a120c', wall: '#2a1a12', fog: 0.07,
    walls: [{ x: -3, z: -2, w: 0.3, d: 12 }, { x: 4, z: 2, w: 0.3, d: 12 }],
    intro: T('6장 · 무대 아래', `계단 끝은 새까맸다.

28년 전 불길이 지나간 자리. 들보는 숯이 되었고, 벽에는 그을음이 손바닥처럼 번져 있다.
녹아내린 기름통 열두 개. 소품이 아니었다.

통로 끝, 객석 뒤로 나가는 문에는 바깥에서 건 자물쇠가 그대로 걸려 있다.

어디선가 오르골 소리가 난다. 생일 노래.
태엽이 다 풀려 가는 듯, 아주 느리게.`),
    props: [
      { t: 'burnt_beam', x: -6, z: -5, r: 20 }, { t: 'burnt_beam', x: 0, z: 6.5, r: -10 }, { t: 'burnt_beam', x: 8, z: -7, r: 70 }, { t: 'barrel', x: -10.5, z: -7.5 },
      { t: 'barrel', x: -9.6, z: -7.8 }, { t: 'barrel', x: -10.2, z: -6.7 }, { t: 'barrel', x: 10.5, z: 7.5 }, { t: 'pipes', x: 0, z: -8.6 }, { t: 'puddle', x: 6.5, z: 0 },
      { t: 'wall_marks', x: 4.2, z: -1, r: -90 },
    ],
    objects: [
      { id: 'valve', t: 'valve', x: -10.5, z: 1, label: '소방 밸브 세 개', kind: 'lock',
        text: '천장 스프링클러로 이어진 밸브 세 개. 그을음에 덮여 숫자가 보이지 않는다.',
        reveal: { item: 'flashlight', text: '손전등을 바짝 비추자 그을음 아래 점검표 글씨가 비친다.\n  "소방 점검 · 1번 밸브 3칸 / 2번 밸브 7칸 / 3번 밸브 5칸 — 열어 둘 것"\n  그 아래 누군가 덧쓴 글씨: "단장 지시로 전부 잠금 (12.24)"', hint: false },
        lock: { input: 'rotate', rings: 3, positions: 8, labels: ['1번 밸브', '2번 밸브', '3번 밸브'], answer: [3, 7, 5] }, wrongScare: true,
        doneText: '스프링클러에서 물방울이 떨어진다. 연기가 걷혔다.',
        on: { flag: 'valves', sound: 'water', scare: 'smiles',
          story: T('28년 늦은 물', `밸브를 돌리자 천장에서 녹물이 쏟아졌다. 28년 늦게.

연기가 걷히자 통로 끝이 보였다.
잠긴 문 바로 앞, 무너진 들보 아래.
커다란 그림자 하나가 작은 그림자 하나를 감싸 안은 자국이 바닥에 남아 있다.

어른의 몸이 아이를 덮은 모양 그대로.`) } },
      { id: 'score', t: 'paper', x: 1, z: -6.5, y: 0.85, label: '생일 노래 악보 쪽지', kind: 'examine',
        text: `그을린 오선지 쪽지. 아이 글씨로 계이름.

  "생일 축하 노래 (뽀삐 아저씨가 오르골로 만들어 준대!)
   솔 솔 라 솔 도 시"

쪽지 아래에 어른 글씨: "태엽 열쇠는 은별이가 갖고 있기."` },
      { id: 'score_crate', t: 'crate', x: 1, z: -6.5, kind: 'deco' },
      { id: 'musicbox', t: 'music_box', x: -7, z: -7.5, y: 0.6, label: '그을린 오르골', kind: 'lock', req: ['valves'],
        lockedText: '연기 때문에 손을 뻗을 수가 없다.',
        text: '작은 회전목마 오르골. 건반 일곱 개. 노래를 맞춰 주면 태엽이 돌 것 같다.',
        lock: { input: 'buttons', notes: true, buttons: ['도', '레', '미', '파', '솔', '라', '시'], len: 6, answer: ['솔', '솔', '라', '솔', '도', '시'] }, wrongScare: true,
        doneText: '오르골이 끝까지 생일 노래를 부르고 멈췄다.',
        on: { flag: 'musicbox', give: 'clown_relic_6', sound: 'musicbox',
          story: T('생일 노래', `오르골이 처음으로 끝까지 노래했다. 생일 축하합니다, 생일 축하합니다.

회전목마 받침이 열리고 작은 태엽 열쇠가 나왔다. 리본에 이름: "은별 ★ 8살"

노래가 끝나자 통로 끝에서 아이 목소리가 들렸다.
"…아저씨, 나 여기 있어. 문이 안 열려."

그리고 남자 목소리.
"괜찮아, 은별아. 아저씨가 왔잖아. 눈 감고 노래 불러."`) } },
      { id: 'lighter_spot', t: 'barrel', x: 9.6, z: -1, label: '녹아내린 기름통', kind: 'pickup', item: 'lighter',
        text: '녹아내린 기름통 사이에서 금장 라이터를 주웠다. 뚜껑에 각인: "M."', takenText: '녹아내린 기름통. 매캐한 냄새.' },
      { id: 'beam', t: 'burnt_beam', x: 9, z: 5.5, label: '무너진 들보', kind: 'lock', req: ['valves'],
        lockedText: '무너진 들보 밑에 무언가 반짝인다. 연기 때문에 다가갈 수 없다.',
        text: '무너진 들보 밑에 무언가 끼어 있다. 지렛대식 저울로 정확히 19kg를 올리면 들보가 들린다.\n옆에 굴러다니는 추들. 가장 무거운 추와 가장 가벼운 추는 열에 녹아 바닥에 붙어 버렸다. 추는 딱 세 개.',
        lock: { input: 'balance', weights: [3, 4, 5, 6, 8, 9], target: 19, pick: 3, answer: [5, 6, 8] }, wrongScare: true,
        doneText: '들어 올린 들보 밑은 비어 있다.',
        on: { flag: 'beam', give: 'clown_relic_7', sound: 'drag',
          story: T('이름표', `들보가 들리자 그 밑에서 작은 이름표가 나왔다. 블루문 서커스 '오늘의 꼬마 단원' 배지.
"한은별 — 사라지는 상자 담당"

배지 뒤에 핀으로 고정된 쪽지. 불에 반쯤 탔다.
"…은별이를 꼭 엄마한테… 단장이… 문을…"
글씨는 거기서 끝났다.`) } },
      { id: 'ladder', t: 'ladder', x: 11.5, z: -6, label: '무대 위로 올라가는 사다리', kind: 'door', req: ['valves', 'musicbox'], to: 6,
        lockedText: '사다리 위 뚜껑이 연기로 뜨겁다. 아직 이곳에서 할 일이 남았다.' },
    ],
    ghost: { type: 'ringmaster', speed: 2.8, sense: 8, teleport: 16, spawn: [9, -6], name: '단장 마르코', auto: true, hearRun: true },
    ghosts: [{ type: 'crawler', speed: 3.0, sense: 6, teleport: 18, startFlag: 'valves', spawn: [-10, -7], name: '거꾸로 기는 곡예사 리나' }],
    objectives: [
      { until: 'valves', text: '소방 밸브를 열자', hints: ['밸브의 그을음을 손전등을 가진 사람이 살펴보자.', '1번 3칸, 2번 7칸, 3번 5칸.'] },
      { until: 'musicbox', text: '오르골에 생일 노래를', hints: ['가운데 아래쪽 상자 위의 악보 쪽지.', '솔 솔 라 솔 도 시'] },
      { until: '__end', text: '무대 위로 (들보 밑에 은별이의 물건, 기름통 사이에 증거가 있다)', hints: ['오른쪽 위 사다리. 무너진 들보: 3kg·9kg를 빼면 4·5·6·8 → 5+6+8 = 19.', '오른쪽 기름통의 라이터는 마지막 장에서 증거로 쓴다.'] },
    ],
  },

  // ─────────────────────────────── 7장
  {
    id: 6,
    title: '7장 · 마지막 앵콜',
    place: '블루문 서커스 · 1998년 12월 24일 밤 10시',
    size: [28, 22],
    spawn: [0, 9],
    ambient: 'candle',
    floor: '#2a1a14', wall: '#7a0a1a', fog: 0.04,
    intro: T('7장 · 마지막 앵콜', `무대 위로 올라오자 시간이 거꾸로 흘렀다.

천막은 타지 않았다. 관객석은 꽉 찼다. 모두 하얀 분칠을 하고, 웃고 있다.
무대 가운데 실크햇의 남자가 두 팔을 벌렸다. 금빛 눈.

"신사 숙녀 여러분! 오늘 밤의 마지막 순서!
 광대가 아이를 데리고 사라지는 — 위대한 마술입니다!"

28년 동안 같은 거짓말을 해 온 목소리.
이제 관객들이 진실을 볼 차례다.`),
    props: [
      { t: 'ring_stage', x: 0, z: -2, r2: 6.5 }, { t: 'bleachers', x: -9, z: 8, w: 8 }, { t: 'bleachers', x: 9, z: 8, w: 8 }, { t: 'bleachers', x: -11.5, z: -5, r: 90, w: 8 },
      { t: 'bleachers', x: 11.5, z: -5, r: -90, w: 8 }, { t: 'spotlight', x: -12.5, z: 2.5, r: 90, on: true }, { t: 'spotlight', x: 12.5, z: 2.5, r: -90, on: true },
      { t: 'star_lamp', x: -4, z: -7, h: 4, on: true }, { t: 'star_lamp', x: 4, z: -7, h: 4, on: true }, { t: 'magic_box', x: 7, z: -6, open: true },
    ],
    objects: [
      { id: 'final_program', t: 'paper', x: -2, z: 6.2, y: 0.9, label: '공연 순서표 (마지막 장)', kind: 'examine', once: true,
        on: { flag: 'final_program', sound: 'calliope_far' },
        text: `【 블루문 서커스 · 마지막 장 】

  ⑥ 마지막 앵콜
     관객이 「    」을(를) 외치면,
     삐에로는 마지막으로 한 번 더 무대에 선다.

  ※ 단장의 증거물 세 가지를 진실의 받침대에 올리면
     관객들도 진실을 볼 것이다.` },
      { id: 'ev_ledger', t: 'altar_stone', x: -6, z: 2, label: '진실의 받침대 (장부)', kind: 'use', use: { item: 'ledger', times: 1 }, needText: '단장의 이중장부가 필요하다. (3장 단원 마차)',
        text: '진실의 받침대. 위에 장부 모양 홈이 패어 있다.', doneText: '받침대 위의 장부가 혼자 넘어간다. "입을 막아야 한다."',
        on: { flag: 'ev1', sound: 'bell', toast: '관객석이 술렁인다 (증거 1/3)' } },
      { id: 'ev_insurance', t: 'altar_stone', x: 0, z: 4, label: '진실의 받침대 (증권)', kind: 'use', use: { item: 'insurance', times: 1 }, needText: '화재보험 증권이 필요하다. (4장 단장의 트렁크)',
        text: '진실의 받침대. 위에 종이 모양 홈이 패어 있다.', doneText: '받침대 위의 증권에서 "3억"이라는 글자가 붉게 빛난다.',
        on: { flag: 'ev2', sound: 'bell', toast: '관객들의 웃음이 멎었다 (증거 2/3)' } },
      { id: 'ev_lighter', t: 'altar_stone', x: 6, z: 2, label: '진실의 받침대 (라이터)', kind: 'use', use: { item: 'lighter', times: 1 }, needText: '금장 라이터가 필요하다. (6장 녹아내린 기름통)',
        text: '진실의 받침대. 위에 작은 네모 홈이 패어 있다.', doneText: '라이터 뚜껑의 "M." 각인에서 불꽃이 튄다.',
        on: { flag: 'ev3', sound: 'bell', toast: '관객 수백 명이 단장을 돌아본다 (증거 3/3)' } },
      { id: 'verdict', t: 'clown_statue', x: 0, z: -2.5, s: 1.1, label: '무대 위의 단장', kind: 'lock', req: ['ev1', 'ev2', 'ev3'],
        lockedText: '단장이 금빛 눈으로 웃는다. "증거? 광대가 아이를 데려갔다니까!"\n(진실의 받침대 세 개에 증거를 올리자)',
        text: '수백 개의 하얀 얼굴이 무대를 본다. 이제 관객이 말할 차례다.\n"그날 밤, 천막에 불을 낸 사람은 누구입니까?" (말 입력)',
        lock: { input: 'text', answer: ['마르코', '단장', '단장마르코', '마르코단장', '단장님', '서커스단장', '마르코가불을냈다', '단장이불을냈다', '범인은마르코', '범인은단장', 'marco'] }, wrongScare: true,
        on: { flag: 'verdict', ghost: 'stop', sound: 'scream', scare: 'ringmaster',
          story: T('판결', `관객석에서 한 사람이 일어섰다. 또 한 사람. 수백 명이 일어섰다.
"마르코." "마르코." "마르코."

단장의 금빛 눈이 흔들렸다. 분칠이 녹아 흘러내렸다.
쫓아오던 '웃는 삐에로'의 얼굴이 그 밑에서 드러났다. 처음부터 그였다.
광대에게 누명을 씌우고, 광대의 얼굴을 쓰고, 28년 동안 이 천막에서 사람들을 쫓았다.

"쇼 머스트… 고…"

단장의 몸이 사라지는 상자 안으로 빨려 들어갔다. 뚜껑이 닫혔다.
천장의 별 전구들이 하나씩 켜졌다. 다섯 개.`) } },
      { id: 'silver_star', t: 'star_lamp', x: 0, z: -9, h: 3.4, label: '천장의 별 다섯 개', kind: 'lock', req: ['verdict'],
        lockedText: '천장에 꺼진 전구 다섯 개.',
        text: '천장의 전구 다섯 개. 은별(銀星) — 은빛 별. 은별이의 별을 그려 주자.\n객석 바닥에 떨어진 크레용 쪽지: "내 별은 붓을 한 번도 안 떼고 그려. 꼭대기에서 시작해서 오른쪽 아래로 먼저! 다 그리면 꼭대기로 돌아와야 해."',
        lock: { input: 'stars', points: [[0.5, 0.08], [0.88, 0.4], [0.74, 0.9], [0.26, 0.9], [0.12, 0.4]], len: 6, close: true, answer: [0, 2, 4, 1, 3, 0] }, wrongScare: true,
        doneText: '천막 꼭대기에 은빛 별이 떠 있다.',
        on: { flag: 'star', sound: 'musicbox',
          story: T('은빛 별', `마지막 획이 꼭대기로 돌아오자 천막 꼭대기에 은빛 별이 떴다.

맨 앞줄 7번 자리에 여자아이가 앉아 있었다. 빨간 코트, 별 머리띠.
아이가 무대를 보며 손을 흔들었다.

무대 가운데에 한 사람이 서 있다. 하얀 분칠, 까만 눈매, 파란 눈물 한 방울.
코만 없는 삐에로가 객석을 향해 깊이 고개를 숙였다.

객석은 조용하다. 다음 순서를 기다리듯.`) } },
      { id: 'poppy', t: 'clown_statue', x: 0, z: 1, r: 180, s: 1, label: '삐에로 뽀삐', kind: 'lock', req: ['star'], hidden: true,
        text: '뽀삐가 고개를 숙인 채 기다린다. 공연 순서표의 마지막 줄을 떠올리자.\n관객이 외쳐야 할 한마디. (말 입력)',
        lock: { input: 'text', answer: ['앵콜', '앙코르', '앵코르', '앙콜', '앵콜앵콜', '앵콜앵콜앵콜', 'encore'] },
        on: { flag: 'encore', sound: 'bell', toast: '뽀삐가 고개를 들었다' } },
      { id: 'exit', t: 'path_gate', x: 0, z: 10.4, r: 180, label: '천막 출구', kind: 'door', req: ['encore'], to: 'end',
        lockedText: '출구 커튼이 꿰매어져 있다. 관객석에서 수백 개의 눈이 당신을 본다. "공연은 아직 안 끝났어요."' },
    ],
    ghost: { type: 'ringmaster', speed: 3.0, sense: 9, teleport: 14, spawn: [-11, -8], name: '단장 마르코', auto: true, hearRun: true },
    ghosts: [{ type: 'clown', speed: 3.0, sense: 8, teleport: 16, startFlag: 'ev2', spawn: [11, -8], name: '웃는 삐에로' }],
    objectives: [
      { until: 'final_program', text: '마지막 공연 순서표를 읽자', hints: ['객석 앞 의자 위 종이.'] },
      { until: 'verdict', text: '증거를 올리고 진범을 밝히자', hints: ['장부(3장)·보험 증권(4장)·라이터(6장)를 받침대 세 개에 올리자.', '모두 올린 뒤 무대 위 단장에게 범인을 말하자.', '마르코'] },
      { until: 'star', text: '은별이의 별을 그리자', hints: ['쪽지: 꼭대기에서 오른쪽 아래로 먼저, 한붓그리기, 꼭대기로 돌아오기.', '꼭대기 → 오른쪽 아래 → 왼쪽 위 → 오른쪽 위 → 왼쪽 아래 → 꼭대기'] },
      { until: 'encore', text: '삐에로를 다시 무대에 세우자', hints: ['순서표 ⑥ 마지막 순서의 이름.', '앵콜!'] },
      { until: '__end', text: '천막을 나가자', hints: ['남쪽 출구.'] },
    ],
  },
];

export const CLOWN_ENDINGS = {
  true: T('진 엔딩 · 마지막 앵콜', `"앵콜!"

뽀삐가 고개를 들었다. 객석 맨 앞줄에서 은별이가 뛰어 올라왔다.
은별이는 주머니에서 빨간 코를 꺼내, 발뒤꿈치를 들고 뽀삐의 얼굴에 달아 주었다.
"돌려줄게. 앵콜 때 돌려받기로 했잖아."

뽀삐가 저글링을 시작했다. 핀 다섯 개가 천막 꼭대기의 은빛 별까지 날아올랐다.
은별이가 깔깔 웃었다. 하얀 분칠의 관객들이 하나둘 분칠을 지우고, 진짜 얼굴로 박수를 쳤다.
머리띠, 깡총이, 오르골 열쇠, 이름표. 당신들이 찾아 준 물건을 은별이가 하나씩 품에 안았다.

마지막 인사. 뽀삐와 은별이가 손을 잡고 고개를 숙였다.
천막이 밝아지더니 — 새벽이 되었다. 빈 천막 위로 해가 떴다.

석 달 뒤, 블루문 랜드 철거 현장 무대 아래에서 유해 두 구가 발견되었다.
어른이 아이를 감싸 안은 모습이었다.
28년 만에 '유괴범 오세진'의 수배가 풀렸다. 신문은 그를 이렇게 불렀다.
「불길 속으로 돌아간 광대」`),
  normal: T('엔딩 · 새 단원 모집 완료', `"앵콜!"

뽀삐가 고개를 들고, 천막 출구가 열렸다. 당신들은 새벽 공기 속으로 뛰쳐나왔다.
뒤에서 왈츠가 멎었다.

그런데 은별이의 물건을 다 찾아 주지 못한 탓일까.
맨 앞줄 7번 자리의 아이는 아직 무언가를 찾고 있었다.

일주일 뒤, 편집실 모니터에 촬영 영상이 재생되다 멈췄다.
마지막 프레임 — 천막 입구에 새 포스터가 붙어 있었다.

【 블루문 서커스 · 새 단원 모집 완료! 】
포스터 속에서 하얀 분칠을 한 얼굴들이 웃고 있다.
당신들의 얼굴이었다.

(은별이의 물건을 모두 찾으면 다른 결말을 볼 수 있다)`),
};
