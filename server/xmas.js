const story = (title, text) => ({ title, text });
const read = (id, t, x, z, label, text, extra = {}) => ({ id, t, x, z, label, text, kind: 'examine', ...extra });
const lock = (id, t, x, z, label, text, puzzle, flag, reveal, extra = {}) => ({
  id, t, x, z, label, text, lock: puzzle, kind: 'lock',
  doneText: '장치에 완료 표시가 떠 있다.', on: { flag, sound: 'unlock', story: reveal }, ...extra,
});
const relic = (id, t, x, z, label, text, req) => ({
  id, t, x, z, label, text, req, item: id, kind: 'pickup', hidden: true,
});
const door = (id, x, z, label, req, to) => ({
  id, t: 'iron_door', x, z, label, req, to, kind: 'door',
  lockedText: '안내 장치에 아직 출발 허가가 뜨지 않았다.',
});
const shadow = (startFlag, spawn, name) => ({ type: 'marionette', name, startFlag, spawn, speed: 1.27, sense: 4.2 });
const objective = (until, text, ...hints) => ({ until, text, hints });

const optics = {
  size: 6, source: [0, 4, 0], receiver: [1, 3],
  mirrors: [[2, 4], [2, 1], [4, 1], [4, 3]],
  blocks: [[3, 4], [2, 5], [2, 0], [5, 1], [4, 0], [4, 5], [5, 3]],
};

export const XMAS_RELICS = ['xmas_relic_post', 'xmas_relic_wire', 'xmas_relic_tape', 'xmas_relic_card', 'xmas_relic_tag'];

export const XMAS_CHAPTERS = [
  {
    id: 0, look: 0, title: '1장 · 반송 우체국', place: '눈꽃역 지하 · 12월 24일 23:57',
    ambient: 'shop', size: [23, 20], spawn: [0, 7], floor: '#47342b', wall: '#172e2b', fog: .038,
    intro: story('반송 우체국', '매년 자정이면 0번 우체국에서 사라진 선물이 돌아온다. 오늘 도착한 소포에는 당신의 이름과 내일 날짜가 적혀 있다.\n\n유리창 너머의 붉은 외투가 소포들을 훔쳐 달아났다. 그가 놓고 간 출고 장부를 확인하자.'),
    props: [
      { t: 'xmas_stack', x: -8, z: -5 }, { t: 'xmas_stack', x: 8, z: -5, r: 180 },
      { t: 'xmas_stack', x: -8, z: 5, r: 35 }, { t: 'xmas_stack', x: 8, z: 5, r: -35 },
      { t: 'xmas_fir', x: -8, z: -7.5 }, { t: 'xmas_fir', x: 8, z: -7.5 },
    ],
    objects: [
      read('post_manifest', 'xmas_sign', -5.4, 2.8, '파란 출고 전표',
        '출발: 눈꽃역. 화물은 정확히 세 상자, 합계 16kg.\n\n전구 2kg · 지팡이 3kg · 방울 5kg · 별 9kg · 벽난로 14kg.\n\n적재된 무게를 맞춰야 행선지 전표가 출력된다.'),
      lock('post_scale', 'xmas_console', 4.5, 2.5, '세 칸 적재 저울', '열차에 넣을 상자 세 개를 골라 총 16kg을 맞추자.',
        { input: 'balance', weights: [2, 3, 5, 9, 14], target: 16, pick: 3, unit: 'kg', answer: [2, 5, 9] }, 'x_post',
        story('운송장 뒷면', '종이가 나오자 붉은 외투가 얼어붙은 손으로 유리창에 글씨를 쓴다.\n“훔친 게 아니야. 주소를 바꿨어.”\n\n운송장 분류: 소포가 아니라 대피자. 원래 목적지: 소각.'), { wrongScare: true }),
      read('post_lamp_orders', 'xmas_sign', 6.2, -2.6, '분류기 배선도 A',
        '눈꽃 줄은 안개가 낀 곳으로. 방울 줄은 이동하는 곳으로. 별 줄은 멀리서도 위치를 알리는 곳으로.'),
      read('post_places', 'xmas_sign', -6.2, -2.6, '분류기 배선도 B',
        '유리 온실은 수증기로 자욱하다. 설원 신호탑의 빛은 산 아래까지 보인다. 야간 열차만 레일 위를 이동한다.'),
      lock('post_relay', 'xmas_console', 0, -4.9, '대피선 배전기',
        '배선도 A와 B를 대조해 전력을 보내자. 혼자라면 두 기록을 번갈아 읽을 수 있다.',
        { input: 'wires', left: ['눈꽃', '방울', '별'], right: ['신호탑', '온실', '열차'], colors: ['#8feeff', '#f3d683', '#ff7697'], answer: ['온실', '열차', '신호탑'] },
        'x_route', story('대피선', '지하 전신실로 내려가는 계단에 불이 켜진다. 장부 끝에 잉크가 덜 마른 서명이 있다. 소포에 적혀 있던 것과 같은, 당신의 필체다.'),
        { req: ['x_post'], lockedText: '적재 저울을 먼저 맞추자.' }),
      read('post_receipt', 'poster', -8, -1, '빛바랜 반송 봉투', '잉크 아래에 무언가 적혀 있다.', {
        reveal: { item: 'flashlight', flag: 'x_letter', text: '손전등에 비친 글씨. “아이들의 이름은 지워도, 첫 발신인 기록은 저울 옆 서랍에 남아 있어.”' },
      }),
      relic('xmas_relic_post', 'paper', 6.6, 1.9, '첫 발신인 기록', '발신 시각은 아직 오지 않은 12월 25일 00:01. 발신인 칸에는 당신의 이름이 있다.', ['x_letter']),
      door('post_exit', 0, -8.45, '지하 전신실 계단', ['x_route'], 1),
    ],
    ghost: shadow('x_post', [-7, -5], '명령이 남은 야간 자동인형'),
    objectives: [
      objective('x_post', '대피선에 실을 상자를 정하자', '파란 출고 전표와 저울을 확인하세요.', '14kg 상자를 쓰면 나머지 두 상자를 더해 16kg을 넘어요.', '2·5·9kg 상자를 고르세요.'),
      objective('x_route', '크리스마스 배전기에 세 줄을 연결하자', '양쪽 벽의 배선도 A와 B를 함께 읽으세요.', '눈꽃 → 온실, 방울 → 열차, 별 → 신호탑.'),
      objective('__end', '지하 전신실로 내려가자', '북쪽의 계단 문을 찾으세요.'),
    ],
  },
  {
    id: 1, look: 0, title: '2장 · 봉인된 전신실', place: '눈꽃역 지하 2층 · 23:58',
    ambient: 'shop', size: [22, 19], spawn: [0, 7], floor: '#3a2e26', wall: '#14232e', fog: .042,
    intro: story('봉인된 전신실', '계단 아래에서 전신기가 혼자 두드려지고 있다. 따닥, 따다닥.\n\n매년 자정의 배차 명령은 여기서 송신됐다. 벽에는 지난 수십 번의 12월 24일 전문이 겹겹이 꽂혀 있고, 그중 몇 장은 아이 손글씨다.\n\n송신을 멈추지 못하면 열차는 소각장으로 간다.'),
    props: [
      { t: 'telegraph', x: -7.5, z: -6, r: 90 }, { t: 'telegraph', x: 7.5, z: -6, r: -90 },
      { t: 'xmas_stack', x: -8, z: 4.5, r: 20 }, { t: 'xmas_fir', x: 8, z: 5 },
    ],
    objects: [
      read('tel_rules', 'xmas_sign', -5.8, 2.4, '주파수 조율 규칙',
        '수신기의 네 칸 기호는 오늘 밤 순서대로 맞춘다.\n\n· 양말은 두 번째 칸.\n· 별 바로 앞 칸에는 언제나 눈이 있다.\n· 종은 별보다 앞에 온다.\n· 눈은 맨 끝 칸이 아니다.'),
      lock('tel_freq', 'xmas_console', 5.6, 2.4, '네 칸 주파수 다이얼', '규칙에 맞게 네 칸 기호를 돌려 송신 채널을 잡자.',
        { input: 'dial', wheels: [['종', '별', '눈', '양말'], ['종', '별', '눈', '양말'], ['종', '별', '눈', '양말'], ['종', '별', '눈', '양말']], answer: ['종', '양말', '눈', '별'] }, 'x_freq',
        story('가로챈 전문', '지직거리던 스피커에서 오늘 밤 송신될 전문이 흘러나온다.\n“수취인 미상 화물 소각. 구조기사 한서윤 귀환 금지. 출발 00:00.”\n\n전신기 옆 종이테이프가 저절로 밀려 나온다.'), { wrongScare: true }),
      read('tel_board', 'xmas_sign', -6.2, -2.8, '소각 대기 칸 분류판',
        '1번 칸 — 털장갑 3켤레\n2번 칸 — 비어 있음\n3번 칸 — 썰매 방울 7개\n4번 칸 — 아이 이름표 5장\n\n분류판 아래 누군가 긁어 쓴 글씨: “장갑도, 방울도, 이름표도 물건이 아니야.”'),
      read('tel_tape', 'paper', 1.6, 1.2, '밀려 나온 종이테이프',
        '송신 취소 코드: 소각 대기 칸의 수량을, 칸 번호가 큰 칸부터 차례로 입력할 것.\n빈 칸은 0으로 친다.', { req: ['x_freq'], hidden: true }),
      lock('tel_key', 'telegraph', 0, -4.8, '송신 취소 전건', '취소 코드 네 자리를 두드려 소각 명령을 끊자.',
        { input: 'digits', len: 4, answer: '5703' }, 'x_cancel',
        story('끊긴 송신', '전건을 누르자 송신음이 길게 늘어지다 끊긴다. 마지막으로 수신된 전문 한 줄.\n“이 전문을 받는 사람에게. 아이들 다음 칸은 내 자리가 아니에요. 그러니 내 이름은 몰라도 돼요. — 서윤”\n\n그녀는 매번 스스로를 명단에서 지웠다.'),
        { req: ['x_freq'], lockedText: '송신 채널부터 잡아야 한다.', wrongScare: true }),
      read('tel_poster', 'poster', 8, -1, '얼룩진 전문 게시판', '물에 번진 전문이 잔뜩 꽂혀 있다.', {
        reveal: { item: 'flashlight', flag: 'x_wire_seen', text: '손전등을 비추자 한 장만 잉크가 마르지 않았다. “답장은 전신기 옆 서랍에.”' },
      }),
      relic('xmas_relic_wire', 'paper', 6.4, -4.4, '서윤에게 보낸 답장 전보', '수신인: 한서윤. 발신인 칸에 당신의 이름. “이번엔 당신 자리도 있어요.” 보낸 기억이 없는데, 당신의 글씨다.', ['x_wire_seen', 'x_cancel']),
      door('tel_exit', 0, -8, '설원으로 나가는 비상문', ['x_cancel'], 2),
    ],
    ghost: shadow('x_freq', [-7, -5], '전문을 엿듣는 자동인형'),
    objectives: [
      objective('x_freq', '주파수 다이얼의 네 칸을 맞추자', '왼쪽 벽 조율 규칙 네 줄을 모두 만족해야 해요.', '양말이 2번이면, 눈·별이 붙어 들어갈 자리는 3·4번뿐이에요.', '종 → 양말 → 눈 → 별.'),
      objective('x_cancel', '소각 송신을 취소하자', '밀려 나온 종이테이프와 분류판을 함께 보세요.', '큰 칸 번호부터: 4번 → 3번 → 2번 → 1번.', '5 · 7 · 0 · 3.'),
      objective('__end', '비상문으로 설원에 나가자', '북쪽 비상문이 열렸습니다. 게시판에 손전등을 비추면 흔적이 있어요.'),
    ],
  },
  {
    id: 2, look: 1, title: '3장 · 달빛 유리 온실', place: '설원 대피선 · 깨진 온실',
    outdoor: true, ambient: 'night', size: [24, 22], spawn: [0, 8], ground: '#a6c1ca', fog: .032,
    intro: story('달빛 유리 온실', '붉은 외투의 사람을 따라 눈이 쌓인 온실에 도착했다. 창 너머에 아이의 발자국이 줄지어 있다.\n\n스피커가 같은 말을 반복한다. “정시 출발에는 미인수 화물을 비워야 합니다.” 사람이 아직 여기 있다.'),
    props: [{ t: 'xmas_fir', x: -8.8, z: -6 }, { t: 'xmas_fir', x: 8.8, z: -6 }, { t: 'xmas_stack', x: -8.5, z: 1.8 }],
    objects: [
      read('glass_marks', 'xmas_sign', -5.8, 1.1, '광학 시험 기록', '빛은 →에서 출발한다. 네 거울을 모두 지난 빛만 수신기가 읽는다. 거울을 눌러 /와 ＼ 방향을 바꾼다.\n검은 칸은 빛을 막는 차광판이다.'),
      lock('glass_prism', 'xmas_console', 4.2, 1.8, '유리 온실의 네 거울', '네 거울을 돌려 금빛 신호를 수신기에 전달하세요.',
        { input: 'xmas_mirror', optics }, 'x_light',
        story('녹음된 대피 안내', '광선이 닿자 바닥 아래에서 경광등과 함께 녹음기가 켜졌다.\n“아이들을 태워. 제 이름은 빼도 돼요.”\n\n외투의 이름표에는 구조기사 ‘한서윤’. 도난 용의자 사진은 구조 기사를 찍은 것이었다.'), { wrongScare: true }),
      read('glass_panel', 'xmas_sign', 0, -5.7, '칠이 벗겨진 설원 지도',
        '서윤이 소각 절차에서 아이들을 빼냈다. 배차기는 그 뒤로 구조가 끝나지 않았다는 이유로, 사람과 열차와 자정을 함께 초기화했다.\n\n작은 글씨: “온실 녹음기 서랍을 열 수 있는 건 신호가 들어온 동안뿐.”', { req: ['x_light'] }),
      relic('xmas_relic_tape', 'radio', 6.2, 1.65, '구조 안내의 원본 테이프', '녹음 끝에 배차기의 음성과 다른 누군가가 덧붙인다. “서윤 씨, 내일 제가 당신을 태우러 갈게요.” 그 목소리는 당신과 같다.', ['x_light']),
      door('glass_exit', 0, -9.6, '장난감 공방 뒷문', ['x_light'], 3),
    ],
    ghost: shadow('x_light', [-7, -5], '고장 난 배차 순찰기'),
    objectives: [
      objective('x_light', '온실의 광신호를 수신기에 보내자', '거울 네 개를 모두 한 번 이상 거쳐야 해요.', '첫 거울은 빛을 위로 보내고, 두 번째는 오른쪽으로 보냅니다.', '위에서 아래로 오는 빛을 마지막 거울에서 왼쪽으로 돌리세요.'),
      objective('__end', '온실 뒤편의 장난감 공방으로', '북쪽 뒷문이 열렸습니다.'),
    ],
  },
  {
    id: 3, look: 2, title: '4장 · 멈춘 장난감 공방', place: '온실 뒤편 · 태엽 공방',
    ambient: 'shop', size: [22, 20], spawn: [0, 7], floor: '#3b2a33', wall: '#241a33', fog: .04,
    intro: story('멈춘 장난감 공방', '온실 뒤편의 공방은 선물을 포장하던 곳이었다. 지금은 선반마다 이름표가 뜯긴 인형이 앉아 있다.\n\n배차기는 아이들을 “장난감”으로 분류해 포장 명단에 올렸다. 산타 옷을 입은 인형 하나가 태엽 소리를 내며 고개를 든다.'),
    props: [
      { t: 'music_box', x: -7.6, z: -6 }, { t: 'xmas_stack', x: 7.8, z: -6, r: 160 },
      { t: 'xmas_fir', x: -8, z: 5 }, { t: 'xmas_stack', x: 8, z: 4.6, r: -20 },
    ],
    objects: [
      read('toy_tags', 'xmas_sign', -5.8, 2.2, '태엽 장난감 작업표',
        '목마는 태엽을 3바퀴 감아야 달린다.\n병정은 목마보다 2바퀴 더.\n오르골은 목마와 병정을 합친 만큼 감아야 노래한다.\n\n※ 너무 많이 감으면 태엽이 끊어진다.'),
      lock('toy_music', 'music_box', 5.4, 2.2, '큰 오르골의 태엽', '오르골이 노래할 만큼만 태엽을 감자.',
        { input: 'tune', min: 1, max: 12, step: 1, unit: '바퀴', answer: 8, tol: 0.4 }, 'x_music',
        story('오르골의 자장가', '뚜껑이 열리고 낡은 캐럴이 흐른다. 노래 사이사이에 아이들의 목소리가 녹음돼 있다.\n“언니가 우리 이름 다시 써 줬어.”\n\n포장 선반의 이름표들이 한 장씩 떨어진다.'), { wrongScare: true }),
      read('toy_shelf', 'xmas_sign', -6, -3, '떨어진 이름표 넷',
        '서랍 속에 숨은 병정 인형 —\n윤이 나게 닦은 썰매 —\n언 손을 녹인 털장갑 —\n니트 모자를 쓴 곰 —\n\n뒷면: “우리를 꺼내 준 사람을 불러 줘. 머리글자만 모으면 돼.”', { req: ['x_music'] }),
      lock('toy_gate', 'xmas_console', 0, -4.8, '포장 명단 정정기', '포장 명단에서 아이들을 꺼낸 사람을 부르자. (한글로 입력)',
        { input: 'text', answer: ['서윤언니', '서윤누나'] }, 'x_names',
        story('정정된 명단', '“장난감 — 4개”가 지워지고 아이 넷의 이름이 다시 찍혀 나온다.\n\n명단 맨 아래에 다섯 번째 칸이 있다. 이름은 계속 지워졌다 다시 써지기를 반복한다. 누군가는 매번 그녀를 지우고, 누군가는 매번 다시 써 넣었다.'),
        { req: ['x_music'], lockedText: '오르골이 왜 멈춰 있는지부터 알아내자.' }),
      read('toy_poster', 'poster', -8, -0.5, '아이들 그림이 붙은 벽', '크레파스 그림들이 붙어 있다. 몇 장은 뒤집혀 있다.', {
        reveal: { item: 'flashlight', flag: 'x_card_seen', text: '뒤집힌 그림 뒷면에 빛이 비친다. “선물 상자 옆에 카드 넣어 놨어요. 언니 거.”' },
      }),
      relic('xmas_relic_card', 'paper', 6.6, -4.2, '아이들이 그린 크리스마스 카드', '빨간 외투를 입은 사람과 아이 넷, 그리고 한 사람이 더 그려져 있다. 손전등을 든 그 사람은 당신이다.', ['x_card_seen', 'x_music']),
      door('toy_exit', 0, -8.4, '야간 열차 승강장', ['x_names'], 4),
    ],
    ghost: shadow('x_music', [7, -5], '태엽이 감긴 산타 인형'),
    objectives: [
      objective('x_music', '오르골 태엽을 알맞게 감자', '작업표의 세 줄을 차례로 계산하세요.', '목마 3, 병정 5.', '3 + 5 = 8바퀴.'),
      objective('x_names', '포장 명단에서 아이들을 꺼낸 사람을 부르자', '떨어진 이름표 넷의 첫 글자를 모으세요.', '서 · 윤 · 언 · 니.'),
      objective('__end', '야간 열차 승강장으로 가자', '북쪽 문. 아이들 그림 벽에 손전등을 비추면 흔적이 있어요.'),
    ],
  },
  {
    id: 4, look: 0, title: '5장 · 마지막 객차', place: '야간 열차 · 맨 끝 칸',
    ambient: 'shop', size: [22, 18], spawn: [0, 6.5], floor: '#2d2321', wall: '#2a1618', fog: .044,
    intro: story('마지막 객차', '승강장에 서 있던 야간 열차의 마지막 칸에 올랐다. 브레이크가 잠긴 채 객차가 덜컹거린다.\n\n좌석마다 빨간 리본이 묶인 탑승권이 놓여 있다. 그리고 차장 모자를 쓴 인형이, 표가 없는 승객을 찾아 통로를 걷기 시작했다.'),
    props: [
      { t: 'xmas_stack', x: -8, z: -5.5 }, { t: 'xmas_stack', x: 8, z: -5.5, r: 180 },
      { t: 'xmas_fir', x: -8, z: 4.5 }, { t: 'xmas_fir', x: 8, z: 4.5 },
    ],
    objects: [
      read('car_valves', 'xmas_sign', -5.8, 2.1, '브레이크 해제 절차',
        '세 밸브의 눈금은 0부터 7까지.\n\n1번 밸브: 눈송이의 꼭짓점 수.\n2번 밸브: 1번 밸브 값의 절반.\n3번 밸브: 1번과 2번을 더한 값에서 8을 뺀 수.'),
      lock('car_brake', 'xmas_console', 5.6, 2.1, '객차 브레이크 밸브', '세 밸브를 절차대로 돌려 브레이크를 풀자.',
        { input: 'rotate', rings: 3, positions: 8, labels: ['1번 밸브', '2번 밸브', '3번 밸브'], answer: [6, 3, 1] }, 'x_brake',
        story('움직이는 객차', '쇳소리와 함께 브레이크가 풀리고 객차가 천천히 미끄러진다. 창밖으로 신호탑의 붉은 불빛이 다가온다.\n\n통로 끝에서 차장 인형이 검표 펀치를 딸깍거린다. “표. 표를. 표를 보여.”'), { wrongScare: true }),
      read('car_tickets', 'xmas_sign', -6, -3, '좌석마다 놓인 탑승권',
        '탑승권 네 장:\nC열 — 4번 좌석\nA열 — 2번 좌석\nD열 — 3번 좌석\nB열 — 1번 좌석\n\n좌석 확인기에는 A열부터 D열까지 순서대로 입력한다.\nE열 좌석에는 표가 없다. 등받이에 붉은 외투가 걸려 있다.', { req: ['x_brake'] }),
      lock('car_seats', 'xmas_console', 0, -4.6, '좌석 확인기', '아이 넷의 좌석 번호를 A열부터 입력하자.',
        { input: 'digits', len: 4, answer: '2143' }, 'x_seats',
        story('비어 있는 E열', '아이 넷의 좌석이 확인되자 차장 인형이 멈춘다. 확인기 화면 맨 아래에서 한 줄이 깜빡인다.\n“E열: 승객 없음 — 배차실 승인 필요.”\n\n서윤의 자리는 신호탑 꼭대기, 배차실에서만 만들 수 있다.'),
        { req: ['x_brake'], lockedText: '객차가 멈춰 있어 확인기가 꺼져 있다.' }),
      door('car_exit', 0, -7.4, '신호탑 연결 사다리', ['x_seats'], 5),
    ],
    ghost: shadow('x_brake', [-7, -5], '표를 검사하는 차장 인형'),
    objectives: [
      objective('x_brake', '객차 브레이크를 풀자', '해제 절차의 세 줄을 순서대로 계산하세요.', '눈송이는 꼭짓점이 6개예요.', '6 · 3 · 1.'),
      objective('x_seats', '아이 넷의 좌석을 확인하자', '탑승권을 A열부터 D열 순서로 다시 정리하세요.', 'A2 · B1 · C4 · D3.', '2143.'),
      objective('__end', '신호탑 꼭대기 배차실로', '북쪽 연결 사다리를 오르세요.'),
    ],
  },
  {
    id: 5, look: 2, title: '6장 · 00:00 배차실', place: '0번 신호탑 · 영원한 자정',
    ambient: 'shop', size: [23, 20], spawn: [0, 7], floor: '#302c41', wall: '#1d233c', fog: .037,
    intro: story('00:00 배차실', '마지막 객차를 지나 신호탑 꼭대기에 올랐다. 눈이 멈췄다. 톱니 사이에 끼인 시곗바늘이 00:00에서 떨린다.\n\n유리 너머의 서윤이 옆으로 물러난다. 엔진실의 문을 열고, 당신에게 소포를 보낸 사람을 확인하자.'),
    props: [{ t: 'xmas_fir', x: -8, z: -6.5 }, { t: 'xmas_stack', x: 8, z: -6 }, { t: 'xmas_stack', x: -8, z: 4 }],
    objects: [
      read('clock_report', 'xmas_sign', -6.1, 1.9, '정지된 시계의 정비표',
        '지금부터 취소해야 할 동작의 역순을 누른다.\n초기에는 봉인, 다음은 분류, 다음은 출발, 마지막은 반송.\n버튼마다 해당 동작이 글자로 새겨져 있다.'),
      lock('clock_reverse', 'xmas_console', 5.5, 2.4, '배차 명령 되감기', '정비표의 실행 기록을 거꾸로 되감자.',
        { input: 'buttons', buttons: ['출발', '봉인', '반송', '분류'], len: 4, answer: ['반송', '출발', '분류', '봉인'] }, 'x_unwind',
        story('미래의 발신인', '명령이 역재생되자 모니터에 00:01의 기록이 나타난다. 첫 소포를 보낸 이는 배차기가 아니었다.\n\n매번 새 판의 자신에게 소포를 남긴 사람. 당신이었다. 당신은 매번 아이들을 집에 보냈지만, 서윤의 이름이 빠진 빈 칸 때문에 배차기가 자정을 다시 실행했다.')),
      read('clock_route', 'xmas_sign', -5.6, -3.2, '귀환 경로 일람', '모든 승객을 태울 수 있는 긴 선로를 사용한다.\n좌측 승강장 → 좌측 신호탑 → 꼭대기 별 → 우측 신호탑 → 우측 승강장.\n아래쪽 가운데 역은 편도라 쓰면 안 된다.', { req: ['x_unwind'] }),
      lock('clock_constellation', 'xmas_console', 0, -4.8, '귀환선 별자리', '설계도에 적힌 역을 순서대로 이어 새 배차 경로를 만든다.',
        { input: 'stars', points: [[.16, .74], [.29, .31], [.50, .13], [.71, .31], [.84, .74], [.50, .81]], len: 5, answer: [0, 1, 2, 3, 4] }, 'x_home',
        story('귀환선 출발', '수취인은 이제 소포가 아닌 사람으로 표시된다. 경로가 켜졌다.\n\n서윤은 마지막 표 한 장을 당신 손에 쥐여 준다. 그런데 아직 자기 좌석은 찾지 못했다며 신호탑을 돌아본다.'),
        { req: ['x_unwind'], lockedText: '배차 명령을 먼저 되감자.' }),
      relic('xmas_relic_tag', 'paper', 6, -3.8, '서윤의 지워진 탑승표', '배차실 서랍 깊숙이 있던 여분의 탑승표. 앞면은 비어 있지만 뒷면에 서윤의 이름이 다시 적힌다.', ['x_unwind']),
      door('clock_exit', 0, -8.5, '귀환선에 탑승하기', ['x_home'], 'end'),
    ],
    ghost: shadow('x_unwind', [-7, -6], '마지막 운행을 막는 배차 인형'),
    objectives: [
      objective('x_unwind', '자정을 되감아 배차 기록을 열자', '정비표에서 마지막에 실행한 동작을 찾으세요.', '반송 → 출발 → 분류 → 봉인.'),
      objective('x_home', '모두를 태울 귀환선을 잇자', '귀환 경로 일람의 지시를 읽으세요.', '왼쪽 아래에서 시작해 위쪽 가운데 별을 지나 오른쪽 아래에서 멈춰요.'),
      objective('__end', '귀환선에 탑승하자', '북쪽 승강문으로. 서윤의 탑승표와 이전 방의 기록이 있다면 결말이 달라집니다.'),
    ],
  },
];

export const XMAS_ENDINGS = {
  normal: story('엔딩 · 돌아온 사람들', '아이들이 탄 열차는 눈 덮인 마을에 도착했다. 시계가 처음으로 00:01을 가리킨다.\n\n서윤은 승강장 너머에 남았다. 아직 회수하지 않은 이름과 목소리가 있어 다음 출발을 기다리겠다고 했다.\n\n집에 돌아오니 현관에 빈 상자 하나가 있다. 바닥에는 다섯 칸의 자국. 첫 발신인 기록, 답장 전보, 원본 테이프, 아이들의 카드, 지워진 탑승표를 모두 찾아 다시 귀환선을 띄울 수 있다.'),
  true: story('진 엔딩 · 남겨두고 가지 않아요', '첫 발신인 기록이 소포의 주인을 증명했다. 답장 전보는 당신이 매번 그녀의 이름을 다시 써 넣었다는 것을, 테이프는 서윤이 마지막까지 남은 이유를, 아이들의 카드는 그녀를 기다리는 사람이 있다는 것을, 새 표는 이번에 그녀가 탈 E열 자리를 증명했다.\n\n마지막 종이 울리기 직전 아이들이 열차에서 내려 서윤의 손을 함께 잡았다. “이번에는 우리도 기다릴게요.”\n\n마을 시계가 00:01을 지나 00:02로 움직였다. 자정은 끝났다. 우체국에 남은 마지막 크리스마스 소포에는 보내는 주소만 남았다. 당신의 집.'),
};
