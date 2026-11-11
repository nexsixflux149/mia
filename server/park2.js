// 해피니스 랜드 6~10장 + 엔딩 (park.js 에서 이어 붙인다)
const T = (title, text) => ({ title, text });

export const PARK_CHAPTERS_2 = [
  // ─────────────────────────────── 6장
  {
    id: 5,
    title: '6장 · 바이킹',
    place: '해피니스 랜드 · 바이킹 "블랙 펄"',
    outdoor: true, size: [26, 20], spawn: [0, 8], ambient: 'night', ground: '#16141c', fog: 0.036,
    intro: T('6장 · 바이킹', `거대한 해적선이 하늘로 솟았다가 떨어진다. 끼이익— 쿵. 끼이익— 쿵.
아무도 타지 않았는데, 배가 멈추지 않는다.

뱃머리 해골 랜턴이 깜빡인다. 규칙적으로. 마치 무언가를 말하듯이.

"바이킹은 진짜 신나요!" 해피가 말했다.
그리고 잠깐, 지지직— 잡음 사이로 다른 목소리가 섞였다. 어른 남자의 낮은 목소리.
"…거기까지 알 필요는 없어."
"…헤헤, 방송 사고예요! 신경 쓰지 마요~"`),
    props: [
      { t: 'pirate_frame', x: 0, z: -5 }, { t: 'pirate_boat', x: 0, z: -5, y: 6.2, anim: { type: 'swing', amp: 0.95, speed: 0.85, axis: 'z' } },
      { t: 'barrel', x: -9, z: 5 }, { t: 'barrel', x: -8.2, z: 5.6 }, { t: 'crate', x: 9, z: 5.5 }, { t: 'lamp', x: -6, z: 2 }, { t: 'lamp', x: 6, z: 2 },
      { t: 'lantern_string', x: 0, z: 4, len: 18 }, { t: 'speaker_pole', x: 11, z: -7 }, { t: 'pine', x: -12, z: 8 }, { t: 'pine', x: 12, z: 8 },
    ],
    objects: [
      { id: 'captain_note', t: 'paper', x: -6, z: 5.5, y: 0.85, label: '선장 분장 직원의 메모', kind: 'examine', once: true,
        on: { flag: 'captain_note', sound: 'whisper' },
        text: `【 블랙 펄 운행 메모 】

  · 운행이 끝나면 닻 다이얼로 배를 묶는다.
  · 닻 다이얼은 손님마다 바꿔 둔다. 7월 7일 시승단용:
      첫째 고리 = 초대장에 적힌 시(時)
      둘째 고리 = 맨 처음 표를 끊은 아이의 좌석 번호
      셋째 고리 = 그날 밤 놀이공원에 들어온 아이 수

  · 해골 랜턴은 모스 부호가 아니라 '글자'를 한 자씩 깜빡인다. 아이들이 좋아함.` },
      { id: 'note_barrel', t: 'crate', x: -6, z: 5.5, kind: 'deco' },
      { id: 'lantern', t: 'signal_lamp', x: 7, z: -1.5, label: '뱃머리 해골 랜턴', kind: 'signal',
        signal: { letters: 'TAEMIN' }, onView: { flag: 'name_seen' },
        text: '해골 랜턴이 글자를 한 자씩 깜빡인다. 같은 단어를 계속 반복한다.' },
      { id: 'anchor', t: 'valve', x: -10.5, z: -2, label: '닻 다이얼', kind: 'lock', req: ['captain_note'],
        lockedText: '녹슨 닻 다이얼. 무슨 숫자에 맞춰야 할지 모르겠다.',
        text: '고리 세 개짜리 닻 다이얼 (1~12). 선장 메모대로 맞춰 배를 묶자.',
        lock: { input: 'rotate', rings: 3, positions: 12, labels: ['첫째 고리', '둘째 고리', '셋째 고리'], answer: [9, 1, 7] }, wrongScare: true,
        doneText: '닻 사슬이 팽팽하다.',
        on: { flag: 'anchor', give: 'park_relic_5', sound: 'chain',
          story: T('닻', `다이얼이 맞물리자 사슬이 철커덩 감겼다. 배는 여전히 흔들렸지만, 갑판에서 무언가가 굴러 떨어졌다.
분홍 풍선 모양 팔찌. 안쪽 각인: "5번 정하린".

팔찌가 땅에 닿자 해적선 위에서 아이들 목소리가 한꺼번에 들렸다.
"태민아, 문 열어!" "장난치지 마!" "연기 나, 연기!"

그리고 스피커에서, 해피가 아닌 목소리가 흐느꼈다. 아주 짧게.`) } },
      { id: 'radio_box', t: 'chest', x: 10.5, z: 0, label: '선장실 금고', kind: 'lock', req: ['name_seen'],
        lockedText: '선장실 금고. 글자 자물쇠. 무엇을 써야 할지 모르겠다.',
        text: '선장실 금고. 랜턴이 깜빡이던 그 이름을 한글로 입력하자.',
        lock: { input: 'text', answer: ['태민', '강태민', '태민이', 'taemin'] }, wrongScare: true,
        doneText: '빈 금고. 쇠 냄새.',
        on: { flag: 'safe', sound: 'drawer', scare: 'mascot',
          story: T('VIP 출입증', `금고 안에 코팅된 출입증. 사진 속 소년이 왕관을 쓰고 웃는다.

  「 해피니스 랜드 VIP — 강태민 (회장 강만호의 아들) · 모든 구역 출입 가능 」

출입증 뒤에 연필로 적힌 메모. 어른 글씨.
  "거울 미궁 열쇠는 태민이가 가지고 놀게 둘 것. 생일이니까. — 아빠"`) } },
      { id: 'exit', t: 'path_gate', x: 0, z: 9.4, r: 180, label: '공사장 — 거울 미궁 쪽', kind: 'door', req: ['anchor', 'safe'], to: 6,
        lockedText: '"공사 중 출입 금지" 테이프. 그 너머에서 탄내가 난다. 바이킹에서 알아낼 것이 남았다.' },
    ],
    ghost: { type: 'marionette', speed: 2.4, sense: 6, teleport: 20, spawn: [10, -8], name: '줄에 매달린 인형', auto: true },
    ghosts: [{ type: 'mascot', speed: 2.6, sense: 7, teleport: 18, startFlag: 'name_seen', spawn: [-11, -8], name: '토끼 해피' }],
    objectives: [
      { until: 'captain_note', text: '바이킹 주변을 살펴보자', hints: ['서쪽 상자 위 선장 메모.'] },
      { until: 'anchor', text: '닻 다이얼을 맞추자', hints: ['초대장(7번 칸): 밤 9시 반 → 9.', '맨 처음 표의 아이: 1번 김지우 → 1.', '그날 밤 들어온 아이: 표 7장 → 7.'] },
      { until: 'name_seen', text: '해골 랜턴의 글자를 읽자', hints: ['뱃머리 쪽 랜턴을 살펴보자.'] },
      { until: 'safe', text: '선장실 금고를 열자', hints: ['T-A-E-M-I-N', '태민'] },
      { until: '__end', text: '공사장으로', hints: ['남쪽 길.'] },
    ],
  },

  // ─────────────────────────────── 7장
  {
    id: 6,
    title: '7장 · 거울 미궁 — 두 번째 진실',
    place: '해피니스 랜드 · 무허가 공사장 "거울 미궁"',
    size: [24, 18], spawn: [-9, 6.5], ambient: 'abyss', floor: '#120c0a', wall: '#2a1812', fog: 0.07,
    walls: [{ x: -3.5, z: -1.5, w: 0.3, d: 12 }, { x: 3.5, z: 1.5, w: 0.3, d: 12 }],
    intro: T('7장 · 거울 미궁', `지도에도 없던 건물. 20년 전에 불탄 채 그대로였다.

깨지고 그을린 거울들이 천천히 돈다. 전기도 없는데.
거울마다 아이가 비친다. 뒤를 돌아보면 아무도 없다.

입구 바닥에 녹아 붙은 자물쇠. 바깥쪽에서 잠긴 채로.

"여긴… 여긴 오면 안 되는데." 해피의 목소리가 떨렸다.
"돌아가요. 지금 돌아가면, 다 없던 일로 해 줄게요."`),
    props: [
      { t: 'funhouse_mirror', x: -8, z: -6, r: 0, wave: 2, anim: { type: 'spin', speed: 0.25 } }, { t: 'funhouse_mirror', x: 0, z: -5, r: 0, wave: 3, anim: { type: 'spin', speed: -0.2 } },
      { t: 'funhouse_mirror', x: 8, z: 6, r: 0, wave: 1.6, anim: { type: 'spin', speed: 0.3 } }, { t: 'funhouse_mirror', x: 0, z: 6, r: 0, wave: 2.6, anim: { type: 'spin', speed: -0.28 } },
      { t: 'burnt_beam', x: -7, z: 2, r: 30 }, { t: 'burnt_beam', x: 7, z: -3, r: -20 }, { t: 'puddle', x: 0, z: 0 }, { t: 'wall_marks', x: -11.85, z: -3, r: 90 },
    ],
    objects: [
      { id: 'twin_mirror', t: 'funhouse_mirror', x: -8, z: 2.8, r: 90, label: '마주 보는 두 거울', kind: 'examine', once: true,
        on: { flag: 'twin', sound: 'glass' },
        text: `마주 보는 두 장의 거울에 맞은편 '탈출 문'의 16칸 거울 잠금판이 겹쳐 비친다.
두 번 비쳐서 — 좌우도, 위아래도 모두 뒤집혀 보인다.

  거울 속 모습 (■ = 불탄 아이 손바닥이 찍힌 칸)
  ■ □ □ □
  ■ ■ □ □
  □ ■ ■ □
  □ □ ■ ■` },
      { id: 'mirror_door', t: 'panel', x: 11.8, z: -5, r: -90, label: '탈출 문 거울 잠금판', kind: 'lock', req: ['twin'],
        lockedText: '16칸 거울 잠금판. 어느 칸을 눌러야 할지 모르겠다.',
        text: '진짜 잠금판이다. 손바닥이 찍힌 칸을 눌러 표시하자.',
        lock: { input: 'grid', size: 4, answer: '1100011000110001' }, wrongScare: true,
        doneText: '잠금판의 칸들이 검게 그을려 있다.',
        on: { flag: 'mirror_door', sound: 'glass', scare: 'faces',
          story: T('탈출 문', `마지막 칸을 누르자 잠금판 뒤에서 철컥— 소리가 났다. 하지만 문은 열리지 않았다.
문 바깥쪽 자물쇠가 아직 잠겨 있었다. 20년 동안.

문 안쪽 면에 손톱자국이 빽빽하다. 아이 키 높이까지만.
그 아래 바닥에 녹아 붙은 운동화 여섯 켤레.

아이들은 스카이드롭에서 죽지 않았다. 여기서 죽었다.`) } },
      { id: 'ash_wall', t: 'wall_marks', x: -11.8, z: 5, r: 90, y: 1.2, label: '그을음 벽', kind: 'examine', req: ['mirror_door'],
        lockedText: '그을음이 두껍게 앉아 아무것도 보이지 않는다.',
        text: '그을음이 벽을 뒤덮고 있다.',
        reveal: { item: 'flashlight', text: '손전등을 비추자 그을음 아래 여러 손 글씨가 겹쳐 떠오른다.\n  "태민이가 문 잠갔어" "장난이래" "불 꺼 줘" "태민아 미안해 우리가 술래 할게"\n  "엄마"', flag: 'ash_seen' } },
      { id: 'torn_photo', t: 'easel', x: 0.5, z: 1, label: '불에 그을린 사진', kind: 'lock', req: ['mirror_door'],
        lockedText: '이젤 위에 그을린 사진 조각들. 아직 손대기 무섭다.',
        text: '아홉 조각으로 찢긴 사진. 맞춰 보자.',
        lock: { input: 'slide', size: 3, image: 'park', answer: '12345678_' },
        doneText: '맞춰진 사진.',
        on: { flag: 'photo', give: 'park_relic_6', sound: 'musicbox',
          story: T('21시 40분', `사진 속 날짜: 2006.07.07 21:40. 거울 미궁 입구.
아이 일곱이 웃고 있다. 왕관 쓴 아이가 열쇠를 흔든다. 강태민.

사진 뒤에 붙어 있던 호루라기 하나. 줄에 "6번 한민규".
불기 직전처럼 입에 물던 자리가 닳아 있다.

신문은 밤 10시 30분, 스카이드롭이라고 했다.
그 시각 아이들은 — 이미 이 문 안에 있었다.`) } },
      { id: 'exit', t: 'door', x: 11.85, z: 6, r: -90, label: '공사장 뒷문 — 스카이드롭 쪽', kind: 'door', req: ['mirror_door', 'photo'], to: 7,
        lockedText: '그을린 뒷문. 문틈으로 바람이 들어온다. 미궁 안에서 진실을 더 찾아야 한다.' },
    ],
    ghost: { type: 'child', speed: 2.2, sense: 7, teleport: 18, spawn: [8, -6], name: '불탄 아이', auto: true },
    ghosts: [{ type: 'child', speed: 2.0, sense: 6, teleport: 20, spawn: [-1, -7], name: '불탄 아이', startFlag: 'mirror_door' }, { type: 'crawler', speed: 2.7, sense: 6, teleport: 16, spawn: [-10, -7], name: '그을음 속의 무언가', startFlag: 'photo' }],
    objectives: [
      { until: 'twin', text: '거울 미궁을 지나가자', hints: ['왼쪽 마주 보는 두 거울.'] },
      { until: 'mirror_door', text: '탈출 문 거울 잠금판을 풀자', hints: ['두 번 비친 모습 = 좌우 + 위아래 뒤집기 = 180도 돌린 모양.', '거울 속 모양을 거꾸로(마지막 칸부터) 읽어 보자.', '1100 / 0110 / 0011 / 0001'] },
      { until: 'photo', text: '그을린 사진을 맞추자', hints: ['가운데 이젤. 빈칸 옆 조각을 밀어 1~8 순서로.'] },
      { until: '__end', text: '스카이드롭 쪽으로', hints: ['오른쪽 아래 뒷문. (그을음 벽은 손전등으로)'] },
    ],
  },

  // ─────────────────────────────── 8장
  {
    id: 7,
    title: '8장 · 스카이드롭',
    place: '해피니스 랜드 · 자이로드롭 "스카이드롭"',
    outdoor: true, size: [26, 20], spawn: [0, 8], ambient: 'night', ground: '#141218', fog: 0.034,
    intro: T('8장 · 스카이드롭', `높이 60미터 탑. 꼭대기의 붉은 고리가 떨어졌다가, 다시 올라간다.
쾅— 쾅— 20년 동안 멈추지 않은 것처럼.

탑 아래 운전실. 블랙박스가 아직 붙어 있다.
그날 밤 이 기계가 무엇을 했는지, 기계는 기억하고 있다.

"거기 숫자 많아서 어려워요. 해피가 대신 해 줄까요?"
스피커가 친절하게 물었다. 대답하기 전에, 운전실 유리창에 아이 손가락 글씨가 써졌다. 김이 서린 것처럼.
  「 하 지 마 」`),
    props: [
      { t: 'drop_tower', x: 0, z: -6, h: 14 }, { t: 'drop_car', x: 0, z: -6, y: 1, anim: { type: 'bob', amp: 12, speed: 0.45, drop: true } },
      { t: 'fence', x: -5, z: -2.6 }, { t: 'fence', x: 5, z: -2.6 }, { t: 'lamp', x: -7, z: 3 }, { t: 'lamp', x: 7, z: 3 }, { t: 'speaker_pole', x: -11, z: 6 },
      { t: 'barrel', x: 10, z: -7 }, { t: 'pine', x: -12, z: -8 }, { t: 'pine', x: 12, z: 8 },
    ],
    objects: [
      { id: 'bb_manual', t: 'paper', x: 6, z: 5, y: 0.85, label: '블랙박스 사용 설명서', kind: 'examine', once: true,
        on: { flag: 'bb_manual', sound: 'whisper' },
        text: `【 스카이드롭 운행 기록 장치 — 열람 비밀번호 안내 】

  비밀번호는 운행 날짜마다 바뀝니다. 7월 7일 비밀번호(4자리)는 담당 직원들이 하나씩 나눠 외웠습니다.

    첫째 자리 — 매표: 그날 밤 시승단 표에 적힌 '이름 있는' 아이 수
    둘째 자리 — 관람차: VIP 아이가 내리지 않던 칸 번호
    셋째 자리 — 바이킹: 닻 다이얼 셋째 고리
    넷째 자리 — 유령의 집: 그날 밤 해골 열차 탑승 인원` },
      { id: 'bb_crate', t: 'crate', x: 6, z: 5, kind: 'deco' },
      { id: 'black_box', t: 'safe', x: 4.5, z: -2, label: '블랙박스', kind: 'lock', req: ['bb_manual'],
        lockedText: '탑 아래 블랙박스. 4자리 비밀번호.',
        text: '스카이드롭 운행 기록 장치. 4자리 비밀번호.',
        lock: { input: 'digits', len: 4, answer: '6777' }, wrongScare: true,
        doneText: '블랙박스 화면에 기록이 떠 있다.',
        on: { flag: 'black_box', sound: 'static_hiss', scare: 'tv',
          story: T('기계는 기억한다', `【 2006.07.07 운행 기록 】

  22:30  시운전 1회  탑승 하중 0kg  정상 하강 — 브레이크 정상 작동
  23:50  수동 조작 — 탑승석에 하중 약 140kg 적재 (총 6개 지점)
  23:58  강제 해제 명령 — 브레이크 잠금 해제 · 낙하
         조작자 ID: KMH-001 (회장 전용)

시운전 차는 비어 있었다. 사고는 일어나지 않았다.
누군가 거울 미궁에서 아이들을 옮겨 와, 일부러 떨어뜨렸다. '사고'로 보이게.

KMH. 강만호.`) } },
      { id: 'gear_box', t: 'gear_wall', x: -9, z: -6.5, label: '탑 기어 상자', kind: 'lock', req: ['black_box'],
        lockedText: '기어 상자. 지금은 손댈 필요가 없어 보인다.',
        text: '떨어졌다 올라갔다를 반복하는 고리를 멈추려면 기어 세 개를 맞춰야 한다. 상자 안쪽 낙서: "아이들 나이를 좌석 1 · 3 · 5번 순서로 (1~12)"',
        lock: { input: 'rotate', rings: 3, positions: 12, labels: ['첫째 기어', '둘째 기어', '셋째 기어'], answer: [8, 7, 8] }, wrongScare: true,
        doneText: '기어가 맞물려 멈췄다.',
        on: { flag: 'gears', sound: 'power', toast: '탑 꼭대기에서 고리가 천천히 내려온다' } },
      { id: 'car_down', t: 'drop_car', x: 0, z: -1.8, y: 13, label: '내려오는 탑승석', kind: 'examine', hidden: true, req: ['gears'], doneFlag: 'gears', moveOnDone: { dy: -12.6, dur: 6 }, once: true,
        on: { flag: 'car', sound: 'creak', scare: 'mascot' },
        text: `천천히 내려온 탑승석. 여섯 자리에 각각 꽃이 하나씩 말라붙어 있다. 20년 전 누군가 매년 몰래 놓고 간 꽃.

일곱 번째 자리 안전바에 테이프로 붙인 쪽지. 아이 글씨인데, 오래된 어른 글씨가 겹쳐 있다.
  (아이 글씨) "아빠가 이렇게 하면 아무도 모른대."
  (어른 글씨) "매년 와서 미안하다고 했어. 아무도 대답하지 않았어."

방송실 위치를 알리는 지도 조각이 함께 붙어 있다.` },
      { id: 'exit', t: 'path_gate', x: 0, z: 9.4, r: 180, label: '방송실 가는 길', kind: 'door', req: ['car'], to: 8,
        lockedText: '방송실로 가는 길이 사슬로 막혀 있다. 탑승석을 내려 확인해야 할 것 같다.' },
    ],
    ghost: { type: 'mascot', speed: 2.7, sense: 8, teleport: 16, spawn: [-11, -8], name: '토끼 해피', auto: true, hearRun: true },
    ghosts: [{ type: 'gasmask', speed: 2.2, sense: 6, teleport: 22, spawn: [11, -8], name: '그을린 작업복', startFlag: 'black_box' }],
    objectives: [
      { until: 'bb_manual', text: '운전실을 살펴보자', hints: ['동쪽 상자 위 블랙박스 설명서.'] },
      { until: 'black_box', text: '블랙박스를 열자 (메타 퍼즐)', hints: ['1장 표: 이름 있는 표 6장 → 6. 5장 관람차: VIP는 7번 칸 → 7.', '6장 닻 셋째 고리 7. 3장 해골 열차 탑승 7명 → 7.', '6777'] },
      { until: 'gears', text: '탑 기어를 맞춰 고리를 내리자', hints: ['1장 신문의 나이: 1번 지우 8 · 3번 서아 7 · 5번 하린 8', '8 · 7 · 8'] },
      { until: '__end', text: '방송실로', hints: ['내려온 탑승석을 살펴본 뒤 남쪽 길로.'] },
    ],
  },

  // ─────────────────────────────── 9장
  {
    id: 8,
    title: '9장 · 방송실 — 세 번째 진실',
    place: '해피니스 랜드 · 중앙 방송실',
    size: [20, 16], spawn: [-7, 5], ambient: 'candle', floor: '#2a2026', wall: '#3a2a34', fog: 0.05,
    intro: T('9장 · 방송실', `방송실 문은 열려 있었다. 우리를 기다렸다는 듯이.

모니터 수십 대가 놀이공원 곳곳을 비춘다. 정문, 회전목마, 유령의 집… 우리가 지나온 길 전부.
마이크 앞 의자에 토끼 탈 머리가 놓여 있다. 탈 안쪽이 아직 따뜻하다.

녹음테이프가 벽 선반에 빽빽하다. 라벨은 전부 같은 글씨.
  「 해피 안내 방송 — 2007 」「 2008 」… 「 2026 」

스피커가 아니라, 등 뒤에서 목소리가 들렸다.
"…들어오지 말라고 했잖아요."`),
    props: [
      { t: 'bookcase', x: -9.4, z: -2, r: 90 }, { t: 'bookcase', x: -9.4, z: 2, r: 90 }, { t: 'desk', x: 0, z: -6.2 }, { t: 'chair', x: 0, z: -5.2, r: 180 },
      { t: 'mascot_statue', x: 6.5, z: -5.5, r: -40, s: 1.0, blood: false }, { t: 'radio', x: 3, z: -6.4 }, { t: 'rug', x: 0, z: 1 },
    ],
    objects: [
      { id: 'tapes', t: 'shelf', x: -9.6, z: 5.5, r: 90, label: '안내 방송 테이프 선반', kind: 'examine', once: true,
        on: { flag: 'tapes', sound: 'tape' },
        text: `테이프 라벨 2007~2026. 매년 7월 7일.
선반 맨 아래에만 라벨이 다른 테이프 네 개. 뒷면에 녹음한 날짜.

  「 술래 — 3번째 」 녹음: 2006.07.07 21:52
  「 문 — 1번째 」 녹음: 2006.07.07 21:36
  「 연기 — 4번째 」 녹음: 2006.07.07 21:58
  「 숨바꼭질 — 2번째 」 녹음: 2006.07.07 21:44

(라벨의 '몇 번째'는 누군가 나중에 일부러 틀리게 고쳐 쓴 것 같다)` },
      { id: 'deck', t: 'radio', x: -3, z: -6.4, label: '테이프 데크', kind: 'lock', req: ['tapes'],
        lockedText: '테이프 데크. 무엇을 넣어야 할지 모르겠다.',
        text: '테이프 네 개를 실제로 녹음된 시간 순서대로 넣자. 라벨의 번호는 믿지 말 것.',
        lock: { input: 'buttons', buttons: ['술래', '문', '연기', '숨바꼭질'], len: 4, answer: ['문', '숨바꼭질', '술래', '연기'] }, wrongScare: true,
        doneText: '데크가 멈춰 있다.',
        on: { flag: 'deck', sound: 'radio',
          story: T('그날 밤의 녹음', `21:36 「문」 — 철컥. 아이 목소리. "미궁 문 열었다! 생일 파티 시작!"
21:44 「숨바꼭질」 — "다들 숨어! 내가 술래야. 문은 밖에서 잠가야 반칙 안 하지~"
21:52 「술래」 — 깔깔 웃음. 멀어지는 발소리. "나 관람차 타고 올게. 아무도 나오지 마!"
21:58 「연기」 — 기침. 비명. 탁탁 타는 소리. "태민아! 문 열어! 태민아!"

녹음기는 미궁 문 바깥에 걸려 있었다. 그 문을 잠근 아이가 걸어 둔 것.

일곱 번째 아이 — 강태민은 장난으로 친구 여섯을 가두고, 관람차를 타러 갔다.
불이 났을 때 그는 7번 칸 안에 있었다. 그리고 모든 것을 내려다봤다.`) } },
      { id: 'cctv', t: 'easel', x: 5, z: 2, label: '방송실 모니터', kind: 'examine', hidden: true, req: ['deck'], once: true,
        on: { flag: 'cctv', sound: 'glitch', scare: 'mascot' },
        text: `모니터 하나가 깜빡이더니 지금 이 방을 비춘다.

화면 속 당신들 뒤에, 토끼 탈을 쓴 누군가가 서 있다. 바로 등 뒤에.
그 사람이 천천히 탈을 벗는다. 서른 살쯤 된 남자. 왼손에 왕관 모양 열쇠고리.

"해피는 저예요. 처음부터." 남자 목소리가, 아이 목소리로 바뀌었다가 다시 돌아왔다.
"매년 7월 7일마다 방송을 했어요. 친구들한테 미안하다고. 아무도 대답을 안 해서.
 그래서 생각했어요. 새 친구들이 미궁에 대신 들어가 주면 — 그 애들이 용서해 줄 거라고."

…쫓아오던 불탄 아이들. 그 아이들은 처음부터 '가지 마' '해피 말 듣지 마'라고 말하고 있었다.` },
      { id: 'mic', t: 'radio', x: 0, z: -6.3, y: 0.85, label: '방송 마이크', kind: 'lock', req: ['cctv'],
        lockedText: '마이크. 지금 말을 걸 상대가 없다.',
        text: '마이크가 켜져 있다. 놀이공원 전체에 들린다.\n토끼 탈 속에 숨은 사람의 진짜 이름을 불러, 더 이상 해피 뒤에 숨지 못하게 하자. (말 입력)',
        lock: { input: 'text', answer: ['강태민', '태민', '태민아', '강태민씨', '태민씨', 'taemin'] },
        on: { flag: 'mic', sound: 'scream', ghost: 'start', toast: '해피가 — 강태민이 달려온다' } },
      { id: 'exit', t: 'door', x: 9.85, z: 4, r: -90, label: '중앙 광장으로', kind: 'door', req: ['mic'], to: 9,
        lockedText: '문 손잡이가 바깥에서 붙잡혀 있다. 누군가 문 너머에서 숨을 쉰다.' },
    ],
    ghost: { type: 'mascot', speed: 2.9, sense: 9, teleport: 14, spawn: [8, -6], name: '강태민 (해피)', hearRun: true, startFlag: 'cctv' },
    objectives: [
      { until: 'tapes', text: '방송실을 조사하자', hints: ['왼쪽 아래 테이프 선반.'] },
      { until: 'deck', text: '테이프를 녹음 시간 순서대로 넣자', hints: ['라벨 번호는 틀렸다. 녹음 시각만 보자.', '21:36 문 → 21:44 숨바꼭질 → 21:52 술래 → 21:58 연기'] },
      { until: 'cctv', text: '모니터를 보자', hints: ['오른쪽 이젤 위 모니터.'] },
      { until: 'mic', text: '마이크로 그의 이름을 부르자', hints: ['VIP 출입증, 초대장, 랜턴의 이름.', '강태민'] },
      { until: '__end', text: '중앙 광장으로', hints: ['오른쪽 문.'] },
    ],
  },

  // ─────────────────────────────── 10장
  {
    id: 9,
    title: '10장 · 마지막 퍼레이드',
    place: '해피니스 랜드 · 중앙 광장 — 7월 8일 새벽 4시',
    outdoor: true, size: [30, 24], spawn: [0, 10], ambient: 'night', ground: '#1a1420', fog: 0.03,
    intro: T('10장 · 마지막 퍼레이드', `광장의 모든 불이 켜졌다. 퍼레이드 음악.
토끼 해피를 태운 퍼레이드 차 여섯 대가 광장을 돈다. 차마다 작은 그림자가 하나씩 앉아 있다.

광장 한가운데 회전목마 앞에서, 토끼 탈을 반쯤 벗은 남자가 무릎을 꿇고 있다.
강태민. 일곱 번째 표의 주인.

"퍼레이드가 끝나기 전에 나가야 해요." 그가 말했다. 아이 목소리로.
"끝나면… 다들 여기 남는 거예요. 영원히. 그게 이 놀이공원의 규칙이에요."`),
    props: [
      { t: 'carousel_big', x: 0, z: -4, r2: 3.2, anim: { type: 'spin', speed: 0.2 } },
      ...[0, 1, 2, 3, 4, 5].map((i) => ({ t: 'parade_float', x: 0, z: 0, color: ['#7a1a5a', '#1a4a7a', '#7a5a1a', '#1a6a4a', '#6a1a1a', '#4a1a7a'][i], anim: { type: 'orbit', r: 10.5, speed: 0.12, cx: 0, cz: -2, phase: (i / 6) * Math.PI * 2, face: 0 } })),
      { t: 'lantern_string', x: 0, z: 7, len: 22 }, { t: 'lamp', x: -12, z: 9 }, { t: 'lamp', x: 12, z: 9 }, { t: 'speaker_pole', x: -13.5, z: -9 }, { t: 'speaker_pole', x: 13.5, z: -9 },
    ],
    objects: [
      { id: 'parade_rule', t: 'notice_board', x: 4, z: 9.2, r: 180, label: '퍼레이드 안내판', kind: 'examine', once: true,
        on: { flag: 'rule', sound: 'calliope_far' },
        text: `【 해피니스 랜드 마지막 퍼레이드 】

  퍼레이드 차마다 친구가 한 명씩 탑니다.
  친구의 이름을 '처음 표를 끊은 순서대로' 불러 주면, 친구는 집에 갈 수 있어요.
  이름을 틀리게 부르면 — 친구는 한 바퀴 더 돌아요.

  ※ 일곱 번째 친구는 퍼레이드 차에 타지 않습니다. 그 친구는 언제나 광장 한가운데 있어요.` },
      { id: 'names', t: 'speaker_pole', x: -6, z: 6, label: '퍼레이드 방송 마이크', kind: 'lock', req: ['rule'],
        lockedText: '마이크. 아직 무엇을 말해야 할지 모르겠다.',
        text: '퍼레이드 차 여섯 대가 광장을 돈다. 아이들 이름을 처음 표를 끊은 순서대로 불러 주자.',
        lock: { input: 'buttons', buttons: ['민규', '서아', '지우', '하린', '도현', '준호'], len: 6, answer: ['지우', '도현', '서아', '준호', '하린', '민규'] }, wrongScare: true,
        doneText: '퍼레이드 차들이 멈춰 있다. 빈 자리만 남았다.',
        on: { flag: 'names', sound: 'bell',
          story: T('이름', `"지우." "도현." "서아." "준호." "하린." "민규."

이름을 부를 때마다 퍼레이드 차 하나가 멈췄다. 그림자가 아이 모습이 되어 차에서 내렸다.
그을음이 지워진, 2006년 여름 그대로의 얼굴.

아이 여섯이 광장 한가운데로 걸어갔다. 무릎 꿇은 남자 앞으로.
남자는 고개를 들지 못했다.`) } },
      { id: 'taemin', t: 'mascot_statue', x: 0, z: 1.5, r: 180, s: 1.05, blood: false, label: '강태민', kind: 'lock', req: ['names'], hidden: true,
        text: '강태민이 토끼 탈을 다 벗었다. 서른두 살 남자의 얼굴, 열두 살 아이의 눈.\n"…내가 어떻게 해야 해요? 아빠는 감추라고 했어요. 20년 동안 감췄어요."\n(그가 해야 할 일을 말해 주자 · 말 입력)',
        lock: { input: 'text', answer: ['자수해', '자수해요', '자수하세요', '자수해라', '경찰에자수해', '경찰에자수하세요', '진실을말해', '진실을말해요', '사실대로말해', '사실대로말해요', '모두에게진실을말해', '사과해', '사과해요', '진짜로사과해'] },
        on: { flag: 'confess', ghost: 'stop', sound: 'bell', toast: '퍼레이드 음악이 멎었다' } },
      { id: 'exit', t: 'path_gate', x: 0, z: 11.4, r: 180, label: '정문 — 아침이 오는 쪽', kind: 'door', req: ['confess'], to: 'end',
        lockedText: '정문이 퍼레이드 차들에 가로막혀 있다. 퍼레이드가 아직 끝나지 않았다.' },
    ],
    ghost: { type: 'mascot', speed: 3.0, sense: 9, teleport: 14, spawn: [-12, -9], name: '토끼 해피의 껍데기', auto: true, hearRun: true },
    ghosts: [{ type: 'child', speed: 2.4, sense: 7, teleport: 18, spawn: [12, -9], name: '아직 술래를 기다리는 아이', auto: true }],
    objectives: [
      { until: 'rule', text: '퍼레이드 안내판을 읽자', hints: ['남쪽 안내판.'] },
      { until: 'names', text: '아이들 이름을 순서대로 불러 주자', hints: ['1장 매표소 표의 순서 = 좌석 번호.', '지우 → 도현 → 서아 → 준호 → 하린 → 민규'] },
      { until: 'confess', text: '강태민에게 대답하자', hints: ['그는 20년 동안 감췄다. 감추지 않으려면?', '"자수해" 또는 "진실을 말해"'] },
      { until: '__end', text: '정문으로', hints: ['남쪽 정문.'] },
    ],
  },
];

export const PARK_ENDINGS = {
  true: T('진 엔딩 · 폐장', `"…자수할게요."

강태민이 탈을 내려놓았다. 아이 여섯이 그를 둘러쌌다.
지우가 별 머리끈을, 도현이 야구모자를, 서아가 크레파스를, 준호가 게임기를,
하린이 풍선 팔찌를, 민규가 호루라기를 — 당신들이 찾아 준 물건을 하나씩 품에 안았다.

민규가 호루라기를 불었다. 숨바꼭질 끝, 이라는 신호.
"찾았다, 태민아." 지우가 말했다. "이제 너도 나와."

아이들이 일곱 번째 생일 초대장을 태민의 손에 쥐여 주었다. 그리고 손을 흔들며 회전목마에 올랐다.
회전목마가 한 바퀴 돌자 — 빈 말들만 남았다. 놀이공원의 불이 하나씩 꺼졌다. 처음으로, 제대로.

해가 떴다.

석 달 뒤. 강태민의 자수와 블랙박스 기록, 박정수의 편지가 공개되었다.
회장 강만호 구속. 20년 만에 정비공 박정수의 누명이 벗겨졌다.
해피니스 랜드 자리에는 작은 추모 공원이 생겼다. 이름이 일곱 개 새겨져 있다.
여섯 아이와, 그 아이들을 지키려 했던 정비공 한 명.`),
  normal: T('엔딩 · 다음 손님', `"…자수할게요."

퍼레이드가 멎고, 정문이 열렸다. 당신들은 새벽 공기 속으로 뛰쳐나왔다.
뒤에서 놀이공원 불이 하나씩 꺼졌다.

그런데 아이들의 물건을 다 찾아 주지 못한 탓일까.
몇몇 퍼레이드 차는 멈추지 않고 돌았다.

일주일 뒤, 편집실 앞으로 소포가 왔다. 2027년 7월 7일 날짜의 해피니스 랜드 입장권 일곱 장.
표마다 이름이 인쇄되어 있다. 당신들의 이름.
일곱 번째 표의 이름 칸만 비어 있다. VIP.

스피커도 없는 편집실에서, 맑은 목소리가 들렸다.
"딩동— 다음 손님, 환영해요!"

(아이들의 물건을 모두 찾으면 다른 결말을 볼 수 있다)`),
};
