/*
 * 시나리오 3 — 인형의 집 : 하트웰 저택
 * 1958년, 영국인 인형 장인 에드거 하트웰은 외딴 산자락에 저택을 짓고 병약한 딸 클라라와 살았다.
 * 클라라는 1958년 3월 3일 오후 3시 15분, 자신의 생일 파티 날 숨을 거두었다.
 * 그 뒤 하트웰이 후원하던 고아원 아이 다섯이 차례로 사라졌다. "클라라에게 친구를 만들어 주겠다."
 * 아이들의 넋은 도자기 인형 속에 갇혀, 클라라의 끝나지 않는 생일 파티에 붙잡혀 있다.
 *
 * 퍼즐 유형: 괘종시계 바늘, 알파벳 악보 → 계이름 피아노, 나이순 이니셜 다이얼, 실종 날짜 정렬,
 *           인형 부품 2단계 조합, 4×4 스테인드글라스 격자, 오르골, 위자보드 글자 신호, 거울 글씨,
 *           다과회 자리 배치 논리 퍼즐, 붉은 실 끊기, 의식 순서, 작별 인사.
 */
const T = (title, text) => ({ title, text });

export const DOLL_CHAPTERS = [
  // ─────────────────────────────── 1장
  {
    id: 0,
    title: '1장 · 현관홀',
    place: '하트웰 저택 1층 · 2026년 11월 9일 밤',
    size: [20, 14],
    spawn: [0, 5.5],
    ambient: 'candle',
    floor: '#3a2620', wall: '#5a3a44', fog: 0.05,
    intro: T('1장 · 현관홀', `철거를 사흘 앞둔 서양식 저택, 하트웰 하우스.
"밤마다 2층 창문에 인형이 서 있다"는 제보.

현관문이 등 뒤에서 닫히자 오르골 소리가 멈췄다.
홀 한가운데 생일 케이크가 차려져 있다. 촛불 여덟 개가 아직 타고 있다.

계단 위 진열장의 도자기 인형들이 일제히 당신들을 내려다본다.
…아까는 분명히 벽을 보고 있었다.`),
    props: [
      { t: 'chandelier', x: 0, z: 0 }, { t: 'candles', x: -3, z: -6.3 }, { t: 'candles', x: 3, z: -6.3 },
      { t: 'doll', x: -9.2, z: 2, r: 90 }, { t: 'doll', x: 9.2, z: -2, r: -90 }, { t: 'rug', x: 0, z: 1 },
      { t: 'umbrella_stand', x: -8.8, z: 5.6 }, { t: 'fireplace', x: -9.85, z: -1.5, r: 90 },
    ],
    objects: [
      { id: 'cake', t: 'cake_table', x: 0, z: 1.2, label: '생일 케이크', kind: 'examine', once: true,
        on: { flag: 'cake', sound: 'giggle', toast: '목표가 갱신되었습니다' },
        text: '하얀 생일 케이크. 초콜릿 글씨: "Happy 8th Birthday, Clara"\n케이크 옆에 초대장이 놓여 있다.\n\n"클라라의 여덟 번째 생일 파티에 초대합니다.\n 1958년 3월 3일 오후 3시. 친구가 되어 줄래?"\n\n촛불이 저절로 하나 꺼졌다.' },
      { id: 'clara_portrait', t: 'painting', x: 0, z: -6.85, y: 2.0, label: '클라라의 초상화', kind: 'examine', once: true,
        on: { scareSelf: 'flash', sound: 'whisper' },
        text: '금발에 하늘색 원피스를 입은 소녀의 초상화.\n액자 아래 동판:\n\n  "Clara Hartwell  1950 – 1958\n   3월 3일 오후 3시 15분, 생일 파티 도중 잠들다"\n\n그림 속 소녀의 눈동자가 당신을 따라 움직인다.' },
      { id: 'gclock', t: 'grandfather_clock', x: -8.6, z: -5, r: 90, label: '괘종시계', kind: 'lock',
        text: '커다란 괘종시계. 시계추 칸이 잠겨 있다. 바늘은 돌릴 수 있다.\n시계판 아래: "그 아이가 잠든 시각에 멈추어라"',
        lock: { input: 'clock', answer: ['3:15'] },
        doneText: '괘종시계가 3시 15분에 멈춰 있다. 시계추 칸이 열려 있다.',
        on: { flag: 'gclock', give: 'mb_key', sound: 'bell',
          story: T('괘종시계', `댕 — 댕 — 댕.\n세 번 울리고, 시계가 멈췄다.\n\n시계추 칸이 열리며 작은 태엽 열쇠가 떨어졌다. 오르골 열쇠다.\n\n2층 어딘가에서 아이가 손뼉을 쳤다.\n"찾았다! 이제 파티 시작할 수 있어!"`) } },
      { id: 'sheet', t: 'paper', x: 6.6, z: -3.6, y: 0.95, label: '악보', kind: 'examine',
        text: '피아노 위에 놓인 낡은 악보. 계이름 대신 알파벳으로 적혀 있다.\n\n  "Clara\'s Song"   E  D  C  D  E  E\n\n악보 귀퉁이 연필 메모:\n  C=도  D=레  E=미  F=파  G=솔  A=라  B=시' },
      { id: 'piano', t: 'piano', x: 7.6, z: -5, r: -90, label: '그랜드 피아노', kind: 'lock',
        text: '검은 그랜드 피아노. 건반 위에 작은 손자국이 찍혀 있다. 클라라의 노래를 쳐 보자. (6음)',
        lock: { input: 'buttons', buttons: ['도', '레', '미', '파', '솔', '라', '시'], len: 6, answer: ['미', '레', '도', '레', '미', '미'], notes: true },
        doneText: '피아노가 혼자 다음 소절을 이어 친다.',
        on: { flag: 'piano', give: 'doll_relic_1', sound: 'organ', scare: 'child',
          story: T('클라라의 노래', `마지막 건반을 누르자 피아노가 혼자 노래를 이어 쳤다.\n\n계단 위 진열장에서 인형 다섯 개가 동시에 따라 불렀다.\n유리 같은 목소리로.\n\n피아노 의자 위에 낡은 리본 머리끈 하나가 떨어져 있었다.\n머리끈에 수놓인 이름: "Anne"`) } },
      { id: 'guestbook', t: 'book', x: 5.6, z: 4.2, y: 0.95, label: '방명록', kind: 'examine',
        text: `【 방명록 · 1958년 3월 3일 · 클라라의 생일 파티 】

  Anne   (앤, 7살)
  Tommy  (토미, 8살)
  Suzy   (수지, 6살)
  Peter  (피터, 9살)
  May    (메이, 5살)

"성 요셉 고아원에서 온 다섯 친구들. 하트웰 씨가 초대해 주셨어요."` },
      { id: 'gb_table', t: 'table', x: 5.6, z: 4.2, kind: 'deco' },
      { id: 'study_lock', t: 'door', x: 9.85, z: 2.5, r: -90, label: '서재 문', kind: 'lock', goneOn: 'study_open',
        text: '서재 문에 알파벳 다섯 칸 다이얼.\n문에 새겨진 글: "파티에 온 친구들을 — 가장 어린 아이부터. 이름의 첫 글자로."',
        lock: { input: 'dial', wheels: [['A', 'M', 'P', 'S', 'T'], ['A', 'M', 'P', 'S', 'T'], ['A', 'M', 'P', 'S', 'T'], ['A', 'M', 'P', 'S', 'T'], ['A', 'M', 'P', 'S', 'T']], answer: ['M', 'S', 'A', 'T', 'P'] },
        wrongScare: true,
        on: { flag: 'study_open', sound: 'door', story: T('서재', `다이얼이 맞물리자 서재 문이 저절로 열렸다.\n\n문 너머에서 가위 소리가 난다. 싹둑. 싹둑.\n무언가를 자르고, 꿰매는 소리.`) } },
      { id: 'to_study', t: 'door', x: 9.85, z: 2.5, r: -90, label: '서재로', kind: 'door', hidden: true, req: ['study_open'], to: 1 },
    ],
    ghost: null,
    objectives: [
      { until: 'cake', text: '현관홀을 둘러보자', hints: ['홀 한가운데 생일 케이크.'] },
      { until: 'gclock', text: '괘종시계를 멈추자', hints: ['클라라의 초상화 아래 동판을 읽자.', '3시 15분'] },
      { until: 'piano', text: '피아노로 클라라의 노래를 치자', hints: ['피아노 근처의 악보는 알파벳으로 적혀 있다.', 'E D C D E E', '미 레 도 레 미 미'] },
      { until: 'study_open', text: '서재 문을 열자', hints: ['방명록에 다섯 아이의 이름과 나이가 있다.', '어린 순서: 메이 5 · 수지 6 · 앤 7 · 토미 8 · 피터 9', 'M S A T P'] },
      { until: '__end', text: '서재로', hints: ['오른쪽 벽의 문.'] },
    ],
  },

  // ─────────────────────────────── 2장
  {
    id: 1,
    title: '2장 · 서재와 인형 작업실',
    place: '하트웰 저택 1층 안쪽',
    size: [20, 14],
    spawn: [-7, 5],
    ambient: 'dark',
    floor: '#33241c', wall: '#4a3a30', fog: 0.055,
    walls: [{ x: 1, z: -3, w: 0.3, d: 8 }, { x: 1, z: 6, w: 0.3, d: 2 }],
    intro: T('2장 · 서재와 인형 작업실', `서재 벽 가득 신문 스크랩이 붙어 있다.
"고아원 아이 또 실종" — 다섯 장.

벽 너머는 하트웰의 인형 작업실.
작업대 위에 반쯤 완성된 도자기 인형. 머리가 없다.

진열장의 인형 하나가 사라졌다.
어디선가, 사기 그릇 부딪히는 듯한 발소리. 딸깍. 딸깍.`),
    props: [
      { t: 'shelf', x: -9.6, z: 3, r: 90 }, { t: 'doll_shelf', x: 9.6, z: -3, r: -90 }, { t: 'mannequin', x: 8.5, z: 5 },
      { t: 'rocking_horse', x: 4, z: 4.5 }, { t: 'candles', x: -5, z: -6.2 }, { t: 'rug', x: -5, z: 1 },
    ],
    objects: [
      { id: 'news', t: 'poster', x: -6, z: -6.85, y: 1.7, label: '신문 스크랩', kind: 'examine',
        text: `벽에 붙은 신문 스크랩 다섯 장. 날짜순이 아니라 아무렇게나 붙어 있다.

  「1958.4.20  고아원 피터(9) 실종」
  「1958.3.10  고아원 메이(5) 실종」
  「1958.6.1   고아원 토미(8) 실종 — 다섯 번째」
  「1958.4.2   고아원 앤(7) 실종」
  「1958.5.15  고아원 수지(6) 실종」

스크랩마다 붉은 잉크로 같은 글씨: "클라라의 새 친구"` },
      { id: 'bookcase', t: 'bookcase', x: -9.6, z: -2.5, r: 90, label: '앨범 책장', kind: 'lock',
        text: '책장에 이름이 적힌 앨범 다섯 권. 한 권씩 당길 수 있다.\n책장 위 동판: "아이들이 클라라에게 온 순서대로 — E. 하트웰"',
        lock: { input: 'buttons', buttons: ['앤', '토미', '수지', '피터', '메이'], len: 5, answer: ['메이', '앤', '피터', '수지', '토미'] }, wrongScare: true,
        doneText: '책장이 옆으로 밀려나 있다.',
        on: { flag: 'bookcase', give: 'doll_head', sound: 'creak', ghost: 'start',
          story: T('비밀 책장', `마지막 앨범을 당기자 책장이 옆으로 밀려났다.\n\n벽 속 좁은 공간에 도자기 인형 머리 하나.\n금발. 하늘색 리본. 감긴 눈.\n\n머리를 집어 드는 순간, 인형의 눈이 떠졌다.\n\n작업실 쪽에서 딸깍, 딸깍. 커다란 무언가가 걸어온다.\n(손전등을 비추는 동안에는 움직이지 못한다)`) } },
      { id: 'diary', t: 'book', x: -3, z: 1.5, y: 0.45, label: '하트웰의 일기', kind: 'examine',
        text: `【 에드거 하트웰의 일기 】

3월 3일 — 클라라가 떠났다. 케이크의 초를 끄기도 전에.
          그 아이에게 "잘 자"라는 말도 해 주지 못했다.
3월 9일 — 클라라가 밤마다 운다. 친구가 없어 외롭다고.
          나는 인형을 만들 줄 안다. 그러니 친구를 만들어 줄 수 있다.
6월 2일 — 다섯 명. 이제 클라라는 외롭지 않다.
          하지만 아이들이 밤마다 집에 보내 달라고 운다.
          클라라는 아무도 놓아주지 않는다.

마지막 장: "누군가 이걸 읽는다면, 클라라에게 내가 하지 못한 말을 대신 해 주시오."` },
      { id: 'low_table', t: 'low_desk', x: -3, z: 1.5, kind: 'deco' },
      { id: 'drawer', t: 'desk', x: -5.5, z: -4.5, label: '서재 책상 서랍', kind: 'pickup', item: 'doll_arms',
        text: '서랍 안에 도자기 인형 팔 한 쌍이 가지런히 놓여 있다. 손가락 하나하나가 정교하다.\n…손톱 밑에 무언가 붉은 것이 끼어 있다.', takenText: '빈 서랍.' },
      { id: 'workbench', t: 'workbench', x: 6, z: -5.4, label: '인형 작업대', kind: 'pickup', item: 'doll_body',
        text: '작업대 위에 머리 없는 인형 몸통. 하늘색 원피스를 입고 있다.\n도구들 사이에 쪽지: "머리, 몸, 팔 — 순서대로 붙여야 한다."', takenText: '빈 작업대. 가위와 실만 남아 있다.' },
      { id: 'dollhouse', t: 'dollhouse', x: 8.2, z: 1.5, r: -90, label: '인형의 집', kind: 'use',
        text: '이 저택을 그대로 본뜬 커다란 인형의 집. 2층 아이 방 침대가 비어 있다.\n작은 팻말: "클라라의 자리"',
        use: { item: 'mended_doll', times: 1 }, needText: '아이 방 침대에 눕힐 인형이 없다. 완성된 인형이 필요하다. (인형 부품을 조합하자)',
        doneText: '인형의 집 아이 방에 인형이 누워 있다. 다른 방의 인형들이 모두 그쪽을 보고 있다.',
        on: { flag: 'dollhouse', give: ['stair_key', 'doll_relic_2'], sound: 'giggle', scare: 'child',
          story: T('인형의 집', `인형을 침대에 눕히자, 인형의 집 2층 창문에 불이 켜졌다.\n\n진짜 저택 2층에서도 — 같은 창문에 불이 켜졌다.\n\n인형의 집 지붕이 열리며 작은 열쇠와 양철 병정 하나가 굴러 나왔다.\n병정 밑바닥에 새겨진 이름: "Tommy"`) } },
      { id: 'embroidery', t: 'frame', x: 9.85, z: 4, r: -90, y: 1.6, label: '자수 액자', kind: 'examine',
        text: '클라라가 수놓은 자수 액자. 4×4 칸에 하트를 수놓았다.\n\n   ■ □ □ ■\n   ■ ■ ■ ■\n   ■ ■ ■ ■\n   □ ■ ■ □\n\n아래에 삐뚤삐뚤한 글씨: "창문도 이렇게 예쁘게 해 줘, 아빠"' },
      { id: 'stained', t: 'stained_window', x: 5, z: -6.85, y: 1.9, label: '스테인드글라스 창', kind: 'lock',
        text: '작업실의 스테인드글라스. 16칸의 유리를 하나씩 켜고 끌 수 있다.',
        lock: { input: 'grid', size: 4, answer: '1001111111110110' },
        doneText: '하트 모양 창으로 달빛이 쏟아진다.',
        on: { flag: 'stained', give: 'scissors', sound: 'bell',
          story: T('하트 창', `하트 모양이 완성되자 창으로 붉은 달빛이 쏟아져 들어왔다.\n\n빛이 닿은 바닥 판자가 들리며, 녹슨 재단 가위가 나왔다.\n가위 손잡이에 붉은 실이 감겨 있다.`) } },
      { id: 'stairs2', t: 'stairs_up', x: 4, z: 1, r: 90, label: '2층 계단', kind: 'use', req: ['stained'],
        lockedText: '2층으로 가는 계단. 잠긴 쇠창살이 막고 있다. 창살 너머가 너무 어둡다. (작업실에서 먼저 할 일이 있다)',
        text: '2층으로 가는 계단을 쇠창살이 막고 있다.', use: { item: 'stair_key', times: 1 }, needText: '쇠창살에 작은 열쇠 구멍이 있다.',
        on: { flag: 'stairs_open', toast: '계단 창살이 열렸다' }, toChapter: 2 },
    ],
    ghost: { type: 'doll', speed: 3.0, sense: 8, lightFreeze: true, teleport: 26, spawn: [8, -3], name: '커다란 도자기 인형' },
    ghosts: [{ type: 'nurse', speed: 2.0, sense: 6, startFlag: 'dollhouse', spawn: [-8, -5], name: '클라라의 간호사' }],
    objectives: [
      { until: 'bookcase', text: '앨범 책장의 비밀을 풀자', hints: ['서재 벽의 신문 스크랩 날짜를 보자.', '실종된 날짜 순서대로.', '메이 → 앤 → 피터 → 수지 → 토미'] },
      { until: 'mended_doll_made', text: '인형을 완성하자', hints: ['서재 책상 서랍에 팔, 작업대에 몸통이 있다.', '인벤토리에서 인형 머리를 우클릭 → 조합 → 몸통. 그다음 그 결과물과 팔을 조합.'] },
      { until: 'dollhouse', text: '인형의 집에 인형을 눕히자', hints: ['완성된 인형을 가진 사람이 인형의 집을 클릭하자.'] },
      { until: 'stained', text: '스테인드글라스를 완성하자', hints: ['자수 액자의 하트 모양 그대로 칸을 켜자.', '1행 ■□□■ / 2행 ■■■■ / 3행 ■■■■ / 4행 □■■□'] },
      { until: '__end', text: '2층으로 올라가자', hints: ['인형의 집에서 나온 열쇠로 계단 창살을 열자.'] },
    ],
  },

  // ─────────────────────────────── 3장
  {
    id: 2,
    title: '3장 · 클라라의 방',
    place: '하트웰 저택 2층',
    size: [18, 14],
    spawn: [0, 5.5],
    ambient: 'candle',
    floor: '#4a3434', wall: '#8a6a78', fog: 0.05,
    intro: T('3장 · 클라라의 방', `분홍색 벽지. 레이스 커튼. 수십 개의 인형.
1958년 3월 3일에서 단 하루도 흐르지 않은 방.

침대 기둥에 묶인 붉은 실 다섯 가닥이 천장 다락으로 이어져 있다.
실이 팽팽하다. 위에서 누군가 잡아당기고 있는 것처럼.

다과회 테이블에 찻잔 여섯 개. 의자 다섯 개는 비어 있다.
"늦었잖아." 침대 위의 인형이 말했다.`),
    props: [
      { t: 'doll', x: -8.2, z: -1, r: 90 }, { t: 'doll', x: -8.2, z: 0.5, r: 90 }, { t: 'doll', x: 8.2, z: 5, r: -90 },
      { t: 'rocking_horse', x: 6, z: 1 }, { t: 'rug', x: -1, z: 1.5 }, { t: 'candles', x: 2, z: -6.2 },
    ],
    objects: [
      { id: 'musicbox', t: 'music_box', x: -5.5, z: -5.4, label: '오르골', kind: 'use',
        text: '발레리나가 올라간 오르골. 태엽 구멍이 비어 있다.',
        use: { item: 'mb_key', times: 1 }, needText: '태엽을 감을 열쇠가 없다. (1장 괘종시계에서 나온 열쇠)',
        doneText: '오르골이 끝없이 돌아간다. 발레리나의 고개가 당신 쪽으로 꺾여 있다.',
        on: { flag: 'mb', sound: 'organ',
          story: T('오르골', `태엽을 감자 오르골이 클라라의 노래를 연주했다.\n\n노래에 맞춰 방 안의 인형들이 일제히 고개를 돌렸다. 테이블 쪽으로.\n\n다과회 테이블 위에 낡은 위자보드가 놓여 있다.\n플랑셰트가 혼자 미끄러지기 시작했다.`) } },
      { id: 'ouija', t: 'ouija', x: -2, z: -1.6, y: 0.75, label: '위자보드', kind: 'signal', hidden: true, req: ['mb'],
        signal: { letters: 'MIRROR' }, onView: { flag: 'ouija_seen' },
        text: '플랑셰트가 혼자 글자 위를 미끄러진다. 같은 단어를 반복한다.' },
      { id: 'ouija_table', t: 'table', x: -2, z: -1.6, kind: 'deco' },
      { id: 'vanity', t: 'vanity', x: 5.5, z: -6.6, label: '화장대 거울', kind: 'examine',
        text: '클라라의 화장대. 거울에 먼지가 뿌옇게 앉아 있다.',
        alt: [{ flag: 'ouija_seen', text: '거울을 들여다보자 입김이 서린 것처럼 김이 퍼졌다.\n김 위로 작은 손가락이 글씨를 쓴다. 거꾸로 — 거울 속에서만 바로 읽히도록.\n\n  " 3 0 3 0 "  →  거울에 비친 그대로 읽으면: 0303\n\n그리고 그 아래: "내 생일이야"\n\n거울 속 당신 어깨 위에 금발 소녀가 턱을 괴고 있다.' }] },
      { id: 'cabinet', t: 'doll_shelf', x: 8.6, z: -2.5, r: -90, label: '인형 진열장', kind: 'lock',
        text: '유리 진열장. 4자리 숫자 자물쇠. 안에 인형 다섯 개와 작은 상자 하나.',
        lock: { input: 'digits', len: 4, answer: '0303' },
        doneText: '열린 진열장. 인형들이 하나씩 고개를 숙이고 있다.',
        on: { flag: 'cabinet', give: ['doll_relic_3', 'name_tags'], sound: 'drawer', scareSelf: 'hands',
          story: T('진열장', `진열장 안 작은 상자에는 이름표 다섯 장이 들어 있었다.\n고아원 아이들의 가슴에 달려 있던 것.\n\n그리고 몽당 크레용 한 자루. "Suzy" 라고 이름이 새겨져 있다.\n\n유리문을 닫는 순간, 안쪽에서 작은 손바닥이 유리를 탁 쳤다.`) } },
      { id: 'seat_memo', t: 'paper', x: 1.5, z: 3.4, y: 0.75, label: '자리 배치 메모', kind: 'examine',
        text: `클라라의 글씨로 쓴 다과회 자리 배치. (왼쪽부터 1번 ~ 5번 자리)

  · 피터는 맨 왼쪽 자리.
  · 토미는 피터 바로 오른쪽.
  · 메이는 정가운데 자리.
  · 수지는 메이 바로 오른쪽.
  · 앤은 맨 왼쪽이 아닌 남은 자리.

"틀리게 앉으면 다들 화낼 거야."` },
      { id: 'photo_puzzle', t: 'frame', x: -8.85, z: -3.5, r: 90, y: 1.6, label: '퍼즐 액자', kind: 'lock',
        text: '벽에 걸린 나무 퍼즐 액자. 사진 조각 여덟 개가 뒤섞여 있다. 빈칸 옆 조각을 밀어서 사진을 맞추자.',
        lock: { input: 'slide', size: 3, image: 'clara', answer: '12345678_' },
        doneText: '완성된 사진: 생일 케이크 앞의 클라라와 다섯 친구들. 모두 웃고 있다.',
        on: { flag: 'frame_done', sound: 'giggle',
          story: { title: '퍼즐 액자', text: '마지막 조각을 밀어 넣자 사진이 완성되었다.\n\n생일 케이크 앞의 클라라. 그리고 다섯 친구들.\n사진 속 아이들의 시선이 천천히 — 다과회 테이블 쪽으로 움직였다.\n\n테이블 의자를 묶고 있던 붉은 실이 스르르 풀렸다.' } } },
      { id: 'tea', t: 'tea_table', x: 1.5, z: 2.2, label: '다과회 테이블', kind: 'lock', req: ['frame_done'],
        lockedText: '다섯 의자가 붉은 실로 테이블에 꽁꽁 묶여 있다. 벽의 퍼즐 액자 속 아이들이 이쪽을 보고 있다.',
        text: '다섯 개의 빈 의자. 의자마다 인형을 앉혀야 한다. (1번 자리부터 순서대로)',
        lock: { input: 'buttons', buttons: ['앤', '토미', '수지', '피터', '메이'], len: 5, answer: ['피터', '토미', '메이', '수지', '앤'] }, wrongScare: true,
        doneText: '다섯 인형이 찻잔을 들고 앉아 있다. 여섯 번째 의자만 비어 있다.',
        on: { flag: 'tea', give: 'doll_relic_4', sound: 'bell', ghost: 'start',
          story: T('다과회', `다섯 인형이 제자리에 앉자 찻잔에 저절로 차가 차올랐다.\n\n"이제 다 왔네. 한 명만 빼고."\n여섯 번째 의자가 혼자 뒤로 밀렸다. 당신 쪽으로.\n\n"앉아. 너도 내 친구가 되는 거야."\n\n피터 인형의 손에 우표 한 장이 쥐여 있다. 그것만은 돌려주고 싶다는 듯이.`) } },
      { id: 'bed', t: 'canopy_bed', x: -6, z: 3, label: '클라라의 침대', kind: 'use',
        text: '레이스 캐노피 침대. 기둥에 붉은 실 다섯 가닥이 단단히 묶여 천장 다락으로 이어져 있다.',
        use: { item: 'scissors', times: 1 }, needText: '실이 너무 질기다. 손으로는 끊을 수 없다. 날카로운 무언가가 필요하다.',
        doneText: '끊어진 붉은 실이 바닥에서 꿈틀거린다.',
        on: { flag: 'threads', sound: 'scream', scare: 'face',
          story: T('붉은 실', `싹둑.\n첫 실을 자르자 다락에서 비명이 터졌다.\n\n싹둑, 싹둑, 싹둑, 싹둑.\n다섯 가닥을 모두 자르자 천장의 다락문이 '쿵' 하고 열리며 사다리가 내려왔다.\n\n다락에서 소녀가 운다. "왜 다들 날 떠나려고 해?"`) } },
      { id: 'ladder', t: 'ladder', x: 5.5, z: 4.5, label: '다락 사다리', kind: 'door', req: ['tea', 'threads'], to: 3,
        lockedText: '천장의 다락문이 닫혀 있다. 붉은 실이 다락문까지 이어져 문을 묶고 있다.' },
    ],
    ghost: { type: 'doll', speed: 3.2, sense: 8, lightFreeze: true, teleport: 22, spawn: [-7, -5], name: '커다란 도자기 인형' },
    objectives: [
      { until: 'mb', text: '오르골을 틀자', hints: ['1장 괘종시계에서 나온 태엽 열쇠를 오르골에 사용하자.'] },
      { until: 'ouija_seen', text: '위자보드의 메시지를 읽자', hints: ['테이블 위 위자보드를 살펴보자.'] },
      { until: 'cabinet', text: '인형 진열장을 열자', hints: ['위자보드: MIRROR — 화장대 거울을 보자.', '거울 글씨는 뒤집어 읽는다.', '0303'] },
      { until: 'frame_done', text: '퍼즐 액자를 맞추자', hints: ['빈칸 옆의 조각만 움직일 수 있다.', '1~3 위쪽 줄부터 차례로 맞추고, 마지막 두 줄은 함께 돌려 맞추자.'] },
      { until: 'tea', text: '다과회 자리를 맞추자', hints: ['자리 배치 메모의 조건을 하나씩 적용하자.', '피터 1, 토미 2, 메이 3, 수지 4', '피터 → 토미 → 메이 → 수지 → 앤'] },
      { until: 'threads', text: '붉은 실을 끊자', hints: ['2장 스테인드글라스에서 얻은 가위를 클라라의 침대에 사용하자.'] },
      { until: '__end', text: '다락으로 올라가자', hints: ['방 오른쪽 사다리.'] },
    ],
  },

  // ─────────────────────────────── 4장
  {
    id: 3,
    title: '4장 · 다락 — 끝나지 않는 파티',
    place: '하트웰 저택 다락',
    size: [18, 14],
    spawn: [0, 5.5],
    ambient: 'abyss',
    startDark: true,
    floor: '#2a201c', wall: '#3a2c28', fog: 0.07,
    intro: T('4장 · 다락', `다락. 지붕 틈으로 빗물이 샌다.

벽을 따라 놓인 의자 다섯 개. 의자마다 사람만 한 도자기 인형.
인형들의 가슴에 이름표 자국만 남아 있다.

다락 끝, 커다란 클라라 인형이 생일 케이크 앞에 앉아 있다.
그리고 그 곁에 키 큰 남자가 서 있다.
검은 코트, 손에 쥔 커다란 가위. 에드거 하트웰.

"딸아이의 파티를 망치지 마시오."`),
    props: [
      { t: 'beam', x: 0, z: -2 }, { t: 'doll_big', x: -7, z: -4, r: 60 }, { t: 'doll_big', x: -7.5, z: 0, r: 90 }, { t: 'doll_big', x: 7, z: -4, r: -60 },
      { t: 'doll_big', x: 7.5, z: 0, r: -90 }, { t: 'doll_big', x: -4, z: -5.8, r: 20 }, { t: 'crate', x: 6.5, z: 5 },
    ],
    objects: [
      { id: 'win_a', t: 'attic_window', x: -8.85, z: 3, r: 90, y: 1.5, label: '다락 창문 (서)', kind: 'coop', text: '덧창 손잡이를 힘껏 돌린다!', coop: { group: 'window', need: 2 } },
      { id: 'win_b', t: 'attic_window', x: 8.85, z: 3, r: -90, y: 1.5, label: '다락 창문 (동)', kind: 'coop', text: '덧창 손잡이를 힘껏 돌린다!', coop: { group: 'window', need: 2 } },
      { id: 'last_note', t: 'paper', x: 2.5, z: 2, y: 0.05, label: '하트웰의 마지막 메모', kind: 'examine', hidden: true, req: ['window'],
        text: `바닥에 떨어진 하트웰의 마지막 메모.

"아이들을 풀어 주는 의식 — 나는 끝내 하지 못했다.

 가장 먼저, 아이들에게 이름을 돌려줄 것.
 그다음, 클라라의 노래를 끝에서 처음으로 되감을 것.
 마지막으로, 파티의 불을 거둘 것.

 그리고 클라라에게… 내가 하지 못한 그 말을.

 (추신) 오르골 톱니는 클라라의 생일에 맞춘다 — 월, 일, 그리고 그 아이의 나이."` },
      { id: 'gears', t: 'gears', x: 5, z: -6.8, y: 1.6, label: '다락 벽의 톱니바퀴', kind: 'lock', req: ['window'],
        lockedText: '어둠 속에서 커다란 톱니바퀴가 삐걱거린다. 아무것도 보이지 않는다.',
        text: '오르골 장치와 연결된 커다란 톱니 세 개. 각각 1~8 눈금이 있다.',
        lock: { input: 'rotate', rings: 3, positions: 8, labels: ['첫째 톱니', '둘째 톱니', '셋째 톱니'], answer: [3, 3, 8] }, wrongScare: true,
        on: { flag: 'gears', sound: 'musicbox', toast: '톱니가 맞물리며 오르골이 거꾸로 돌기 시작했다' } },
      { id: 'ritual', t: 'altar', x: 0, z: -2, label: '파티 테이블', kind: 'lock', req: ['window', 'gears'],
        lockedText: '너무 어두워 테이블 위가 보이지 않는다. 다락 창문의 덧창을 열어야 한다.',
        needItems: ['name_tags'], needItemsText: '아이들의 이름표가 필요하다. (3장 인형 진열장)',
        text: '생일 케이크가 놓인 파티 테이블. 하트웰의 메모대로 의식을 행하자. (3단계)',
        lock: { input: 'buttons', buttons: ['촛불 끄기', '인형 태우기', '이름표 달아 주기', '오르골 거꾸로 감기'], len: 3, answer: ['이름표 달아 주기', '오르골 거꾸로 감기', '촛불 끄기'] }, wrongScare: true,
        on: { flag: 'ritual', sound: 'bell', scare: 'child',
          story: T('의식', `이름표를 하나씩 인형의 가슴에 달자, 인형의 눈에서 눈물이 흘렀다.\n오르골을 거꾸로 감자 클라라의 노래가 끝에서부터 되돌아갔다.\n그리고 케이크의 촛불 여덟 개를 하나씩 껐다.\n\n하트웰이 가위를 떨어뜨렸다.\n\n커다란 클라라 인형이 천천히 고개를 들었다.\n"…다들 가 버리는 거야? 그럼 나는? 나한테는 아무도 그 말을 안 해 줬어."`) } },
      { id: 'doll_relic_5', t: 'ring', x: 6.5, z: 4.2, y: 0.85, label: '상자 위 은반지', kind: 'pickup', item: 'doll_relic_5', hidden: true, req: ['window'],
        text: '상자 위에 작은 은반지. 안쪽에 새겨진 이름: "May". 고아원 원장이 아이들 생일에 하나씩 준 반지다.' },
      { id: 'clara', t: 'doll_big', x: 0, z: -5.6, label: '클라라 인형', kind: 'lock', req: ['ritual'],
        lockedText: '커다란 클라라 인형이 케이크 앞에 앉아 있다. 하트웰의 그림자가 그 앞을 가로막는다.',
        text: '클라라 인형이 당신을 올려다본다.\n"…마지막으로, 나한테 뭐라고 말해 줄 거야?" (말 입력)',
        lock: { input: 'text', answer: ['잘자클라라', '잘자,클라라', '잘자요클라라', '잘자요,클라라', '클라라잘자', '잘자', '잘자요', 'goodnightclara', 'goodnight,clara'] },
        on: { flag: 'goodbye', ghost: 'stop', sound: 'bell', toast: '클라라가 눈을 감았다' } },
      { id: 'attic_exit', t: 'door', x: 0, z: 6.85, r: 180, label: '다락 계단', kind: 'door', req: ['goodbye'], to: 'end',
        lockedText: '내려가는 계단 앞에 하트웰이 가위를 들고 서 있다.' },
    ],
    coops: {
      window: { on: { flag: 'window', light: 'on', sound: 'creak',
        story: T('덧창', `양쪽 덧창이 동시에 열리자 새벽 직전의 푸른 빛이 다락에 스며들었다.\n\n빛이 닿은 인형들의 얼굴에 금이 간다.\n그 틈으로 아이들의 진짜 얼굴이 언뜻 비쳤다가 사라졌다.\n\n바닥에 하트웰의 메모가 떨어져 있다.`) } },
    },
    ghost: { type: 'father', speed: 2.6, sense: 9, teleport: 18, spawn: [0, -4], name: '에드거 하트웰', auto: true },
    objectives: [
      { until: 'window', text: '다락 덧창을 열자', hints: ['양쪽 벽의 덧창 손잡이를 8초 안에 함께 돌리자.'] },
      { until: 'gears', text: '오르골 톱니를 맞추자', hints: ['하트웰의 마지막 메모 추신을 읽자.', '생일 3월 3일, 여덟 번째 생일 → 3 · 3 · 8'] },
      { until: 'ritual', text: '아이들을 풀어 주는 의식을 행하자', hints: ['하트웰의 마지막 메모를 읽자.', '이름 → 노래를 거꾸로 → 불을 거둔다', '이름표 달아 주기 → 오르골 거꾸로 감기 → 촛불 끄기'] },
      { until: 'goodbye', text: '클라라에게 마지막 말을 해 주자', hints: ['2장 하트웰의 일기 (수첩 J).', '"그 아이에게 ___ 라는 말도 해 주지 못했다"', '잘 자, 클라라'] },
      { until: '__end', text: '다락을 내려가자', hints: ['다락 계단.'] },
    ],
  },
];

export const DOLL_ENDINGS = {
  true: T('진 엔딩 · 잘 자, 클라라', `"잘 자, 클라라."

클라라 인형의 유리 눈에서 눈물 한 방울이 흘렀다.
"…아빠가 해 주고 싶었던 말이야?"

하트웰이 무릎을 꿇고 인형을 안았다. 그의 몸이 빛 속으로 흩어졌다.

다섯 인형의 가슴에서 작은 빛이 하나씩 떠올랐다.
앤의 머리끈, 토미의 병정, 수지의 크레용, 피터의 우표, 메이의 은반지.
빛들은 클라라의 빛과 손을 잡고, 열린 덧창 너머 새벽하늘로 올라갔다.

"고마워. 이제 혼자가 아니야. 다들 집에 가는 거지?"

해가 떴다.
다락의 인형들은 그냥 금 간 도자기 인형이 되어 있었다.

사흘 뒤, 하트웰 하우스는 철거되었다.
공사 인부들은 다락에서 작은 의자 여섯 개를 발견했다고 했다.
모두 창문 쪽을 향해 놓여 있었다고.`),
  normal: T('엔딩 · 여섯 번째 의자', `"잘 자, 클라라."

클라라는 눈을 감았고, 하트웰은 사라졌다.
그러나 유품을 돌려받지 못한 아이들은 인형 속에 그대로 남았다.

당신들은 무사히 저택을 빠져나왔다. 그런 줄 알았다.

일주일 뒤, 편집실 책상 위에 택배 상자 하나가 도착했다.
보낸 사람: 하트웰 하우스.

상자 안에는 작은 도자기 인형이 들어 있었다.
심야방송 후드티를 입은 인형.
얼굴이 — 당신을 닮았다.

인형의 목에 걸린 카드: "파티에 와 줘서 고마워. 의자는 아직 비어 있어."

(아이들의 유품을 모두 모으면 다른 결말을 볼 수 있다)`),
};
