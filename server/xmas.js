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

export const XMAS_RELICS = ['xmas_relic_post', 'xmas_relic_tape', 'xmas_relic_tag'];

export const XMAS_CHAPTERS = [
  {
    id: 0, title: '1장 · 반송 우체국', place: '눈꽃역 지하 · 12월 24일 23:57',
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
        'x_route', story('대피선', '유리 온실행 통로가 켜진다. 장부 끝에 잉크가 덜 마른 서명이 있다. 소포에 적혀 있던 것과 같은, 당신의 필체다.'),
        { req: ['x_post'], lockedText: '적재 저울을 먼저 맞추자.' }),
      read('post_receipt', 'poster', -8, -1, '빛바랜 반송 봉투', '잉크 아래에 무언가 적혀 있다.', {
        reveal: { item: 'flashlight', flag: 'x_letter', text: '손전등에 비친 글씨. “아이들의 이름은 지워도, 첫 발신인 기록은 저울 옆 서랍에 남아 있어.”' },
      }),
      relic('xmas_relic_post', 'paper', 6.6, 1.9, '첫 발신인 기록', '발신 시각은 아직 오지 않은 12월 25일 00:01. 발신인 칸에는 당신의 이름이 있다.', ['x_letter']),
      door('post_exit', 0, -8.45, '유리 온실행 승강문', ['x_route'], 1),
    ],
    ghost: shadow('x_post', [-7, -5], '명령이 남은 야간 자동인형'),
    objectives: [
      objective('x_post', '대피선에 실을 상자를 정하자', '파란 출고 전표와 저울을 확인하세요.', '14kg 상자를 쓰면 나머지 두 상자를 더해 16kg을 넘어요.', '2·5·9kg 상자를 고르세요.'),
      objective('x_route', '크리스마스 배전기에 세 줄을 연결하자', '양쪽 벽의 배선도 A와 B를 함께 읽으세요.', '눈꽃 → 온실, 방울 → 열차, 별 → 신호탑.'),
      objective('__end', '유리 온실로 가자', '북쪽의 승강문을 찾으세요.'),
    ],
  },
  {
    id: 1, title: '2장 · 달빛 유리 온실', place: '설원 대피선 · 깨진 온실',
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
      door('glass_exit', 0, -9.6, '0번 신호탑 통로', ['x_light'], 2),
    ],
    ghost: shadow('x_light', [-7, -5], '고장 난 배차 순찰기'),
    objectives: [
      objective('x_light', '온실의 광신호를 수신기에 보내자', '거울 네 개를 모두 한 번 이상 거쳐야 해요.', '첫 거울은 빛을 위로 보내고, 두 번째는 오른쪽으로 보냅니다.', '위에서 아래로 오는 빛을 마지막 거울에서 왼쪽으로 돌리세요.'),
      objective('__end', '신호탑의 출발 명령을 확인하자', '북쪽 통로가 열렸습니다.'),
    ],
  },
  {
    id: 2, title: '3장 · 00:00 배차실', place: '0번 신호탑 · 영원한 자정',
    ambient: 'shop', size: [23, 20], spawn: [0, 7], floor: '#302c41', wall: '#1d233c', fog: .037,
    intro: story('00:00 배차실', '눈이 멈췄다. 톱니 사이에 끼인 시곗바늘이 00:00에서 떨린다.\n\n유리 너머의 서윤이 옆으로 물러난다. 엔진실의 문을 열고, 당신에게 소포를 보낸 사람을 확인하자.'),
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
  normal: story('엔딩 · 돌아온 사람들', '아이들이 탄 열차는 눈 덮인 마을에 도착했다. 시계가 처음으로 00:01을 가리킨다.\n\n서윤은 승강장 너머에 남았다. 아직 회수하지 않은 이름과 목소리가 있어 다음 출발을 기다리겠다고 했다.\n\n집에 돌아오니 현관에 빈 상자 하나가 있다. 바닥에는 세 칸의 자국. 반송 기록, 원본 테이프, 지워진 탑승표를 찾아 다시 귀환선을 띄울 수 있다.'),
  true: story('진 엔딩 · 남겨두고 가지 않아요', '첫 발신인 기록이 소포의 주인을 증명했다. 테이프는 서윤이 마지막까지 남은 이유를, 새 표는 이번에 그녀가 탈 자리를 증명했다.\n\n마지막 종이 울리기 직전 아이들이 열차에서 내려 서윤의 손을 함께 잡았다. “이번에는 우리도 기다릴게요.”\n\n마을 시계가 00:01을 지나 00:02로 움직였다. 자정은 끝났다. 우체국에 남은 마지막 크리스마스 소포에는 보내는 주소만 남았다. 당신의 집.'),
};
