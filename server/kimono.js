/*
 * 시나리오 7 — 츠바키야 : 붉은 동백의 밤 (일본풍 기모노)
 * 1926년 봄, 산골 온천 마을의 오래된 여관 '츠바키야(椿屋, 동백집)'.
 * 여관집 딸 유키는 혼례 전날 밤, 정원사 하루와 달아나기로 약속했다.
 * 그러나 어머니인 여주인 오소노는 유키를 별채 창고에 가두었고, 유키는 옛 우물 굴로 빠져나가려다 돌아오지 못했다.
 * 오소노는 "딸은 병으로 죽었다"고 했다. 하루는 그 뒤로 매년 동백이 질 때마다 우물에 편지를 던졌다.
 * 지금도 동백이 지는 밤이면, 붉은 기모노가 복도를 걷는다.
 *
 * 퍼즐 유형: 계절 순서 석등, 혼례일 벽장, 동백 무늬 장지문 격자, 협동 빗장, 우물, 혼례 단장 의식, 마지막 말.
 */
const T = (title, text) => ({ title, text });

export const KIMONO_CHAPTERS = [
  // ─────────────────────────────── 1장
  {
    id: 0,
    title: '1장 · 동백 정원',
    place: '츠바키야 여관 앞뜰 · 2026년 11월 9일 밤',
    outdoor: true,
    size: [24, 18],
    spawn: [0, 7],
    ambient: 'night',
    ground: '#2a3324', fog: 0.035,
    intro: T('1장 · 동백 정원', `폐업한 지 90년 된 온천 여관, 츠바키야.
"동백이 지는 밤이면 붉은 기모노가 복도를 걷는다"는 제보.

정원에는 11월인데도 동백이 붉게 피어 있었다.
석등 네 개는 모두 꺼져 있고, 연못 위로 동백 꽃송이가 떠다닌다.

여관 현관에 걸린 등롱이 혼자 켜졌다.
장지문 너머로 기모노 소매가 스르륵 지나간다.

어디선가 나막신 소리. 딸깍, 딸깍. 한 짝뿐인 소리.`),
    props: [
      { t: 'tree', x: -9, z: -6, color: '#c8202a' }, { t: 'tree', x: 9, z: -6.5, color: '#d02a34' }, { t: 'tree', x: -10, z: 3, color: '#b81c26' },
      { t: 'tree', x: 10, z: 4, color: '#c8202a' }, { t: 'pine', x: -6.5, z: -8 }, { t: 'pine', x: 7, z: 8 },
      { t: 'stone_lantern', x: -4, z: -2.5 }, { t: 'stone_lantern', x: 4, z: -2.5 }, { t: 'stone_lantern', x: -4, z: 3.5 }, { t: 'stone_lantern', x: 4, z: 3.5 },
      { t: 'torii', x: 0, z: 9.2 }, { t: 'rock', x: 7.5, z: 0.5 }, { t: 'rock', x: -8, z: 7.5 },
    ],
    objects: [
      { id: 'ema', t: 'notice_board', x: -7, z: 0, r: 90, label: '에마 걸이', kind: 'examine', once: true,
        on: { flag: 'ema', sound: 'whisper', toast: '목표가 갱신되었습니다' },
        text: `소원을 적어 거는 나무판(에마)이 빽빽하게 걸려 있다. 대부분 글씨가 지워졌다.
읽을 수 있는 것은 두 장뿐.

  「어머니가 허락해 주시기를. — 유키」
  「동백이 피면 데리러 올게. 우리 약속의 노래를 잊지 마. — 하루」

판 뒷면마다 같은 동백 문양이 찍혀 있다.` },
      { id: 'poem', t: 'scroll', x: 0, z: -6.2, y: 1.2, label: '사당의 족자', kind: 'examine',
        text: `작은 사당 안에 걸린 족자. 하루가 유키에게 써 준 노래라고 한다.

  「눈이 녹으면 너를 생각하고
    벚꽃이 지면 너를 그리고
    반딧불 날면 너를 부르고
    단풍 속에서 너를 기다린다」

아래에 작은 글씨: "석등은 노래의 순서대로 밝힐 것"` },
      { id: 'shrine', t: 'altar', x: 0, z: -5, label: '작은 사당', kind: 'lock',
        text: '사당 앞에 석등 네 개의 불을 밝히는 손잡이가 있다. 석등마다 계절 무늬가 새겨져 있다. (4개)',
        lock: { input: 'buttons', buttons: ['벚꽃 석등', '반딧불 석등', '단풍 석등', '눈꽃 석등'], len: 4, answer: ['눈꽃 석등', '벚꽃 석등', '반딧불 석등', '단풍 석등'] }, wrongScare: true,
        doneText: '네 석등에 푸른 불이 켜져 있다.',
        on: { flag: 'shrine', give: ['inn_key', 'kimono_relic_1'], sound: 'bell', ghost: 'start',
          story: T('네 개의 석등', `노래의 순서대로 석등을 밝히자 정원 전체에 푸른 불이 번졌다.\n\n사당 문이 열리며 여관 열쇠와, 빛바랜 부적 주머니(오마모리)가 나왔다.\n주머니에 수놓인 글씨: "유키 — 무사히"\n\n그때 연못 건너편 동백나무 아래, 붉은 기모노를 입은 여자가 서 있었다.\n얼굴은 긴 머리카락에 가려져 있다.\n(손전등을 비추면 그 자리에 굳는다)`) } },
      { id: 'pond', t: 'koi_pond', x: 5.5, z: 0.5, label: '동백 연못', kind: 'pickup', item: 'kimono_relic_2',
        text: '연못 위에 동백 꽃송이들 사이로 나막신(게타) 한 짝이 떠 있다.\n붉은 끈. 안쪽에 먹으로 쓴 이름: "유키"\n\n물속에서 무언가 반짝 빛났다가 사라졌다.', takenText: '동백 꽃송이만 떠 있다.' },
      { id: 'inn_door', t: 'door', x: 11.75, z: -3, r: -90, label: '여관 현관', kind: 'use',
        text: '여관 현관의 미닫이문. 자물쇠가 걸려 있다.',
        use: { item: 'inn_key', times: 1 }, needText: '여관 열쇠가 필요하다. (정원의 사당)',
        on: { flag: 'inn', sound: 'door', toast: '현관문이 스르륵 열렸다' }, toChapter: 1 },
    ],
    ghost: { type: 'woman', speed: 2.1, sense: 7, lightFreeze: true, teleport: 24, spawn: [-8, -6], name: '붉은 기모노의 여인' },
    objectives: [
      { until: 'ema', text: '정원을 둘러보자', hints: ['왼쪽 에마 걸이.'] },
      { until: 'shrine', text: '석등을 노래의 순서대로 밝히자', hints: ['사당 안 족자의 노래를 읽자.', '눈 → 벚꽃 → 반딧불 → 단풍', '눈꽃 → 벚꽃 → 반딧불 → 단풍 석등'] },
      { until: '__end', text: '여관 안으로 들어가자', hints: ['사당에서 나온 열쇠를 오른쪽 여관 현관에 사용하자. (연못에는 유키의 유품이 있다)'] },
    ],
  },

  // ─────────────────────────────── 2장
  {
    id: 1,
    title: '2장 · 여관 복도와 동백실',
    place: '츠바키야 여관 2층',
    size: [22, 14],
    spawn: [-8, 4],
    ambient: 'candle',
    floor: '#6a5636', wall: '#c8b48a', fog: 0.05,
    walls: [{ x: -3.5, z: -4.5, w: 0.3, d: 5 }, { x: 3.5, z: -4.5, w: 0.3, d: 5 }],
    intro: T('2장 · 여관 복도', `다다미 냄새. 오래된 향 냄새.
복도를 따라 장지문 방 세 칸. 맨 끝 방 문패: 「椿の間 — 동백실」

동백실 앞에 혼례 기모노가 걸려 있다.
붉은 비단에 흰 동백 무늬. 소매가 — 숨을 쉬듯 부풀었다 가라앉는다.

복도 끝에서 나이 든 여자의 목소리.
"유키는 병으로 죽었습니다. 손님들은 묻지 마세요."`),
    props: [
      { t: 'folding_screen', x: -7, z: -6.6 }, { t: 'cushion', x: -7, z: -4.5 }, { t: 'futon', x: 7, z: -5 }, { t: 'lantern', x: -9.8, z: 5.5 },
      { t: 'lantern', x: 0, z: 5.6 }, { t: 'jar', x: 9.8, z: 5.6 }, { t: 'doll_shelf', x: 0, z: -6.6 }, { t: 'cushion', x: 1.2, z: -3.5 },
    ],
    objects: [
      { id: 'register', t: 'book', x: -8.5, z: 1, y: 0.45, label: '여관 숙박부', kind: 'examine', once: true,
        on: { flag: 'register', sound: 'whisper' },
        text: `【 츠바키야 숙박부 · 다이쇼 15년(1926년) 】

  4월 2일  혼례 손님 쿠로다 가문 일행 도착
  4월 3일  유키 아가씨 혼례 — 술시(저녁 8시)
           (이 줄은 먹으로 두껍게 지워져 있다)

맨 아래, 여주인 오소노의 글씨:
"연회장 열쇠는 동백실 벽장에 둔다. 벽장 번호는 그 아이 혼례날로."` },
      { id: 'register_desk', t: 'low_desk', x: -8.5, z: 1, kind: 'deco' },
      { id: 'kimono', t: 'kimono_rack', x: 7, z: 1.8, label: '혼례 기모노', kind: 'examine',
        text: `붉은 비단 혼례 기모노. 등판에 흰 동백 무늬가 4×4 칸으로 수놓여 있다.

   ■ □ □ ■
   □ ■ ■ □
   □ ■ ■ □
   ■ □ □ ■

옷깃 안쪽 쪽지: "이 무늬처럼 창을 열면 하루가 나를 볼 수 있어."` },
      { id: 'shoji', t: 'window', x: -0.5, z: 6.85, r: 180, y: 1.6, label: '동백 장지문 창', kind: 'lock',
        text: '종이를 바른 장지문 창. 16칸의 창살을 하나씩 열고 닫을 수 있다.',
        lock: { input: 'grid', size: 4, answer: '1001011001101001' },
        doneText: '열린 창살 사이로 달빛이 동백 무늬를 그린다.',
        on: { flag: 'shoji', give: 'kimono_relic_3', sound: 'bell',
          story: T('동백 무늬 창', `무늬대로 창살을 열자 달빛이 다다미 위에 커다란 동백꽃을 그렸다.\n\n빛이 닿은 다다미 틈에서 붉은 접부채 하나가 나왔다.\n부채를 펴자 먹으로 그린 동백과 짧은 글: "하루가 그려 준 부채"`) } },
      { id: 'closet', t: 'closet', x: 9.6, z: -5.6, r: -90, label: '동백실 벽장', kind: 'lock',
        text: '동백실 벽장(오시이레). 숫자 4자리 자물쇠.',
        lock: { input: 'digits', len: 4, answer: '0403' },
        doneText: '열린 벽장. 이불 사이에 손톱 자국.',
        on: { flag: 'closet', give: 'hall_key', sound: 'drawer', scareSelf: 'hands',
          story: T('벽장', `벽장 안 이불 더미 사이에 붉은 술이 달린 연회장 열쇠가 있었다.\n열쇠를 집으려는 순간, 이불 속에서 차가운 손이 손목을 붙잡았다.\n\n"…어머니한테 이르지 마."\n\n손은 스르륵 이불 속으로 사라졌다.`) } },
      { id: 'back_door', t: 'door', x: 10.85, z: 3, r: -90, label: '연회장으로 가는 문', kind: 'use',
        text: '복도 끝 별관 연회장의 미닫이문. 자물쇠가 걸려 있다.',
        use: { item: 'hall_key', times: 1 }, needText: '연회장 열쇠가 필요하다. (동백실 벽장)',
        on: { flag: 'back', sound: 'door', toast: '연회장 문이 열렸다' }, toChapter: 2 },
    ],
    ghost: { type: 'elder', speed: 2.3, sense: 7, teleport: 22, spawn: [8, -2], name: '여주인 오소노', auto: true },
    objectives: [
      { until: 'register', text: '숙박부를 살펴보자', hints: ['왼쪽 낮은 책상 위 숙박부.'] },
      { until: 'closet', text: '동백실 벽장을 열자', hints: ['숙박부: 벽장 번호는 혼례날.', '4월 3일', '0403'] },
      { until: '__end', text: '연회장으로 가자', hints: ['벽장에서 나온 연회장 열쇠를 오른쪽 문에 사용하자. (혼례 기모노 무늬대로 장지문 창을 열면 유품이 있다)'] },
    ],
  },

  // ─────────────────────────────── 3장 (연회장)
  {
    id: 2,
    title: '3장 · 연회장 — 치르지 못한 혼례',
    place: '츠바키야 별관 연회장',
    size: [22, 14],
    spawn: [-8, 4.5],
    ambient: 'candle',
    floor: '#6a4a2a', wall: '#8a3a2a', fog: 0.05,
    intro: T('3장 · 연회장', `복도 끝 미닫이문을 열자, 넓은 연회장이 나타났다.

방석 서른 개가 두 줄로 놓여 있고, 상마다 음식이 그대로 말라붙어 있다.
상석의 금박 병풍 앞에는 신랑 신부의 자리. 둘 다 비어 있다.

연회장 안쪽 계단식 단 위에서, 히나 인형들이 일제히 고개를 돌렸다.
누군가 술잔을 따르는 소리. 쪼르륵.

"혼례는 아직 끝나지 않았습니다. 손님들, 자리에 앉으세요."`),
    props: [
      { t: 'folding_screen', x: 0, z: -6.6 }, { t: 'cushion', x: -1, z: -4.6 }, { t: 'cushion', x: 1, z: -4.6 },
      { t: 'low_desk', x: -4.5, z: -1 }, { t: 'low_desk', x: -4.5, z: 2 }, { t: 'low_desk', x: 4.5, z: -1 }, { t: 'low_desk', x: 4.5, z: 2 },
      { t: 'cushion', x: -5.8, z: -1 }, { t: 'cushion', x: -5.8, z: 2 }, { t: 'cushion', x: 5.8, z: -1 }, { t: 'cushion', x: 5.8, z: 2 },
      { t: 'lantern', x: -9.8, z: -5.5 }, { t: 'lantern', x: 9.8, z: -5.5 }, { t: 'lantern', x: -9.8, z: 5.5 }, { t: 'jar', x: 9.8, z: 5.6 },
    ],
    objects: [
      { id: 'guests', t: 'book', x: -4.5, z: 2, y: 0.45, label: '하객 명단', kind: 'examine', once: true,
        on: { flag: 'guests', sound: 'whisper' },
        text: `【 혼례 하객 명단 · 다이쇼 15년 4월 3일 】

  신랑 — 쿠로다 타케시 (쿠로다 상회의 둘째 아들)
  신부 — 츠바키야의 딸, 유키

  · 혼례 의식(산산쿠도): 신랑 신부가 세 잔의 술을 나누어 마신다.
    작은 잔에서 시작해 큰 잔으로. 그래야 인연이 커진다고 한다.
  · 의식에 쓸 잔은 히나 단 맨 아래 서랍에 둔다.

명단 여백에 떨리는 글씨: "신부가 오지 않았다. 신랑은 날이 밝기 전에 돌아갔다."` },
      { id: 'hina_note', t: 'scroll', x: -9.85, z: 0, r: 90, y: 1.5, label: '히나 단 족자', kind: 'examine',
        text: `히나 인형 장식 순서 (위에서 아래로)

  첫째 단 — 천황과 황후 인형
  둘째 단 — 세 궁녀
  셋째 단 — 다섯 악사
  넷째 단 — 좌우 대신
  다섯째 단 — 세 시종

"인형을 제자리에 두지 않으면 그 집 딸은 시집을 못 간다." — 옛말` },
      { id: 'hina', t: 'doll_shelf', x: -8.6, z: -5.2, r: 90, label: '히나 인형 단', kind: 'lock', req: ['guests'],
        lockedText: '계단식 단 위의 히나 인형들이 뒤죽박죽 놓여 있다. 인형들이 당신을 노려본다.',
        text: '뒤죽박죽 놓인 히나 인형들. 위에서부터 차례로 제자리에 올려 두자. (5단)',
        lock: { input: 'buttons', buttons: ['세 궁녀', '다섯 악사', '천황과 황후', '세 시종', '좌우 대신'], len: 5, answer: ['천황과 황후', '세 궁녀', '다섯 악사', '좌우 대신', '세 시종'] }, wrongScare: true,
        doneText: '히나 인형들이 단정히 앉아 있다. 맨 아래 서랍이 열려 있다.',
        on: { flag: 'hina', give: 'sake_cups', sound: 'drawer', ghost: 'start',
          story: T('히나 인형', `마지막 인형을 제자리에 올리자 맨 아래 서랍이 스르륵 열렸다.\n붉은 칠기 술잔 세 개. 크기가 모두 다르다.\n\n잔을 집어 드는 순간, 단 위의 천황 인형이 바닥으로 뛰어내렸다.\n사람만 한 크기로.\n(손전등을 비추면 움직이지 못한다)`) } },
      { id: 'sake', t: 'altar', x: 0, z: -4.2, label: '신랑 신부의 상', kind: 'lock', req: ['hina'],
        lockedText: '금박 병풍 앞 신랑 신부의 상. 술잔이 놓여 있어야 할 자리가 비어 있다.',
        needItems: ['sake_cups'], needItemsText: '혼례 술잔이 필요하다. (히나 인형 단)',
        text: '신랑 신부의 상에 세 잔을 놓고, 혼례 의식을 대신 치러 주자. (3잔)',
        lock: { input: 'buttons', buttons: ['큰 잔', '중간 잔', '작은 잔'], len: 3, answer: ['작은 잔', '중간 잔', '큰 잔'] }, wrongScare: true,
        doneText: '세 잔이 비어 있다. 병풍 뒤에 무언가 끼워져 있다.',
        on: { flag: 'sansankudo', give: 'kura_key', sound: 'bell', scare: 'faceless',
          story: T('세 잔', `세 번째 잔을 비우자 병풍 뒤에서 일기장 한 권과 열쇠가 떨어졌다.\n여주인 오소노의 일기. 열쇠 꼬리표: "별채 창고"\n\n그 순간 신부 자리 방석이 움푹 꺼졌다. 누군가 앉은 것처럼.\n방석 위로 물방울이 뚝, 뚝 떨어진다.`) } },
      { id: 'diary', t: 'book', x: 1.6, z: -5.4, y: 0.45, label: '오소노의 일기', kind: 'examine', hidden: true, req: ['sansankudo'],
        text: `【 여주인 오소노의 일기 】

4월 2일 — 유키가 정원사 녀석과 달아날 생각이라는 걸 알았다.
         쿠로다 상회의 돈이 없으면 이 여관은 끝이다.
4월 2일 밤 — 유키를 별채 창고에 가뒀다. 혼례 아침에 꺼내 줄 생각이었다.
4월 3일 새벽 — 창고가 비어 있다. 옛 우물 굴로 나간 것이다.
         우물 바닥에서… 붉은 기모노 자락이…

나는 마을에 "딸은 병으로 죽었다"고 했다.
정원사 녀석은 매년 봄 우물가에 온다. 나는 그를 쫓아내지 못한다.` },
      { id: 'diary_desk', t: 'low_desk', x: 1.6, z: -5.4, kind: 'deco' },
      { id: 'taiko', t: 'drum', x: 7.6, z: -4.6, label: '혼례 큰북', kind: 'lock',
        text: '혼례 때 치던 큰북. 북채가 저 혼자 북을 두드린다. 잘 듣고 같은 장단을 쳐 보자.',
        lock: { input: 'simon', buttons: ['쿵', '덕', '쿵쿵', '딱'], colors: ['#b81c26', '#d8a050', '#7a2a1a', '#e8d8b0'], answer: ['쿵', '딱', '쿵쿵', '덕', '쿵'] }, wrongScare: true,
        doneText: '북 소리의 여운이 연회장을 맴돈다.',
        on: { flag: 'taiko', give: 'kimono_relic_6', sound: 'gong',
          story: T('혼례 장단', `마지막 북소리에 연회장의 촛불이 일제히 흔들렸다.\n\n북 안에서 하얀 비단 머리쓰개(츠노카쿠시)가 흘러나왔다.\n신부가 혼례 때 쓰는 것. 안쪽에 "유키"라는 이름이 수놓여 있다.\n끝내 한 번도 써 보지 못한 것.`) } },
      { id: 'hall_exit', t: 'door', x: 10.85, z: 3, r: -90, label: '별채로 가는 뒷문', kind: 'use',
        text: '별채 창고로 이어지는 뒷문. 빗장에 자물쇠가 걸려 있다.',
        use: { item: 'kura_key', times: 1 }, needText: '창고 열쇠가 필요하다.',
        on: { flag: 'back', sound: 'door', toast: '뒷문이 열렸다' }, toChapter: 3 },
    ],
    ghost: { type: 'doll', speed: 2.4, sense: 7, lightFreeze: true, teleport: 22, spawn: [-8, -4], name: '천황 인형' },
    ghosts: [{ type: 'elder', speed: 2.0, sense: 6, startFlag: 'sansankudo', spawn: [8, 4], name: '여주인 오소노' }],
    objectives: [
      { until: 'guests', text: '연회장을 살펴보자', hints: ['왼쪽 상 위의 하객 명단.'] },
      { until: 'hina', text: '히나 인형을 제자리에 올리자', hints: ['왼쪽 벽 족자의 장식 순서.', '천황과 황후 → 궁녀 → 악사 → 대신 → 시종'] },
      { until: 'sansankudo', text: '혼례 의식을 대신 치르자', hints: ['하객 명단: 작은 잔에서 시작해 큰 잔으로.', '작은 잔 → 중간 잔 → 큰 잔'] },
      { until: '__end', text: '별채 창고로 가자', hints: ['병풍 뒤에서 나온 창고 열쇠를 오른쪽 뒷문에 사용하자. (혼례 큰북에는 유키의 유품이 있다)'] },
    ],
  },

  // ─────────────────────────────── 4장
  {
    id: 3,
    title: '4장 · 별채 창고와 동백 우물',
    place: '츠바키야 뒤뜰',
    outdoor: true,
    size: [22, 16],
    spawn: [0, 6],
    ambient: 'night',
    ground: '#1e241c', fog: 0.045,
    intro: T('4장 · 동백 우물', `뒤뜰은 온통 떨어진 동백꽃으로 붉었다.
동백은 꽃잎이 아니라 송이째, 목이 꺾이듯 떨어진다.

흙벽 창고(쿠라)의 문은 빗장 두 개로 잠겨 있다.
창고 옆 오래된 우물에서 물 떨어지는 소리가 난다.

우물가에 붉은 기모노의 여자가 등을 돌린 채 앉아 있다.
"…하루는, 아직 안 왔나요?"`),
    props: [
      { t: 'tree', x: -8, z: -4, color: '#c8202a' }, { t: 'tree', x: 8.5, z: 4, color: '#b81c26' }, { t: 'tree', x: -8.5, z: 5, color: '#d02a34' },
      { t: 'stone_lantern', x: -3, z: 4 }, { t: 'stone_lantern', x: 3, z: 4 }, { t: 'pine', x: 9, z: -6 }, { t: 'rock', x: -5, z: 1 },
    ],
    objects: [
      { id: 'kura', t: 'shed', x: 6, z: -4, r: -90, label: '흙벽 창고 (쿠라)', kind: 'examine',
        text: '두꺼운 흙벽 창고. 문에 빗장 두 개가 가로질러 있다. 양쪽 빗장을 동시에 빼야 열릴 것 같다.' },
      { id: 'bolt_a', t: 'handle', x: 4.4, z: -1.6, y: 1.0, label: '창고 빗장 (왼쪽)', kind: 'coop', text: '빗장을 힘껏 뽑는다!', coop: { group: 'kura', need: 2 } },
      { id: 'bolt_b', t: 'handle', x: 7.6, z: -1.6, y: 1.0, label: '창고 빗장 (오른쪽)', kind: 'coop', text: '빗장을 힘껏 뽑는다!', coop: { group: 'kura', need: 2 } },
      { id: 'yuki_letter', t: 'paper', x: 3, z: -3.2, y: 0.85, label: '창고 안 편지', kind: 'examine', hidden: true, req: ['kura'],
        text: `창고 안 나무 상자 위에 남겨진 유키의 편지.

  「어머니가 문을 잠갔다. 내일 아침이면 쿠로다 가에 보내진다.
    오래된 우물 굴로 나가면 하루가 기다리는 동백 문에 닿는다고 했다.
    혼례 날 아침이 오면 나는 이렇게 단장할 거야.
    먼저 기모노 깃을 여미고, 다음에 비녀를 꽂고, 마지막으로 동백 한 송이를 들고.
    하루, 동백이 지기 전에 와 줘.」` },
      { id: 'hairpin', t: 'crate', x: 3, z: -3.2, label: '나무 상자', kind: 'pickup', item: 'kimono_relic_4', hidden: true, req: ['kura'],
        text: '상자 안에 붉은 동백 장식이 달린 비녀(간자시)가 있다. 유키의 것이다.', takenText: '빈 상자.' },
      { id: 'rope', t: 'chain', x: 8.6, z: -6.4, label: '창고 안 두레박줄', kind: 'pickup', item: 'well_rope', hidden: true, req: ['kura'],
        text: '창고 구석에 감겨 있던 긴 두레박줄. 우물에 쓸 수 있겠다.', takenText: '빈 고리.' },
      { id: 'well', t: 'well', x: -3.5, z: -3.5, label: '동백 우물', kind: 'use',
        text: '이끼 낀 오래된 우물. 두레박이 없다. 우물 안쪽에서 누군가 숨 쉬는 소리가 난다.',
        use: { item: 'well_rope', times: 1 }, needText: '두레박줄이 필요하다. (창고 안)',
        doneText: '우물 위로 물안개가 피어오른다.',
        on: { flag: 'well', give: 'kimono_relic_5', sound: 'water', scare: 'drowned',
          story: T('우물', `두레박을 내리자 물이 아니라 편지 다발이 딸려 올라왔다.\n젖은 편지 수십 통. 겉봉마다 같은 이름: "유키에게 — 하루"\n\n가장 위의 편지: "올해도 왔어, 유키. 동백이 질 때마다 나는 매년 왔다."\n\n우물가의 여자가 천천히 돌아앉았다.\n긴 머리카락 사이로 젖은 얼굴. 손에는 아무것도 들려 있지 않다.\n"…단장을 못 했어요. 혼례 날인데."`) } },
      { id: 'dress', t: 'kimono_rack', x: 0, z: -6.2, label: '우물가의 혼례복', kind: 'lock', req: ['well'],
        lockedText: '나무 걸이에 젖은 혼례복이 걸려 있다. 아직은 손을 댈 수 없다.',
        text: '유키의 혼례 단장을 대신 해 주자. 편지에 적힌 순서대로. (3단계)',
        lock: { input: 'buttons', buttons: ['동백꽃 들려 주기', '비녀 꽂아 주기', '기모노 깃 여며 주기', '머리 풀어 주기'], len: 3, answer: ['기모노 깃 여며 주기', '비녀 꽂아 주기', '동백꽃 들려 주기'] }, wrongScare: true,
        on: { flag: 'dressed', sound: 'bell',
          story: T('혼례 단장', `깃을 여미자 젖었던 기모노가 마르기 시작했다.\n비녀를 꽂자 흐트러진 머리가 단정히 올라갔다.\n동백 한 송이를 손에 들려 주자, 유키가 처음으로 얼굴을 들었다.\n\n열일곱 살 신부의 얼굴이었다.\n"…이제 나 예뻐요? 그런데, 그 사람은…"`) } },
      { id: 'yuki', t: 'tree', x: 0, z: -2.8, color: '#e8202a', label: '동백 문 앞의 유키', kind: 'lock', req: ['dressed'],
        lockedText: '동백나무 아래 아무도 없다. 꽃만 떨어진다.',
        text: '단장을 마친 유키가 동백 문 앞에 서서 묻는다.\n"…하루는, 왔나요?" (말 입력)',
        lock: { input: 'text', answer: ['하루가왔어요', '하루가왔어', '하루는왔어요', '하루는매년왔어요', '하루가매년왔어요', '하루는매년왔어', '매년왔어요', '하루가기다려요', '하루가기다리고있어요', '하루는기다렸어요', '하루는기다리고있어요', '네하루가왔어요', '응하루가왔어', '왔어요', '네왔어요'] },
        on: { flag: 'haru', ghost: 'stop', sound: 'bell', toast: '동백 문이 열렸다' } },
      { id: 'exit', t: 'torii', x: 0, z: 7.6, label: '정원으로 돌아가는 문', kind: 'door', req: ['haru'], to: 'end',
        lockedText: '문 앞에 동백꽃이 수북이 쌓여 길을 막고 있다.' },
    ],
    coops: {
      kura: { on: { flag: 'kura', sound: 'gate',
        story: T('창고 문', `두 빗장이 동시에 빠지자 창고 문이 무겁게 열렸다.\n\n안쪽 흙벽에 손톱으로 긁은 자국이 빼곡하다. 날짜를 세던 자국.\n나무 상자 위에 편지 한 장, 그리고 구석에 감긴 두레박줄.`) } },
    },
    ghost: { type: 'woman', speed: 2.2, sense: 7, teleport: 20, spawn: [-7, -5], name: '붉은 기모노의 여인', auto: true },
    ghosts: [{ type: 'elder', speed: 2.0, sense: 6, startFlag: 'kura', spawn: [8, 5], name: '여주인 오소노' }],
    objectives: [
      { until: 'kura', text: '창고 빗장을 함께 뽑자', hints: ['창고 앞 양쪽 빗장을 8초 안에 함께 뽑자. (혼자라면 하나만)'] },
      { until: 'well', text: '우물을 살펴보자', hints: ['창고 안 두레박줄을 동백 우물에 사용하자.'] },
      { until: 'dressed', text: '유키의 혼례 단장을 해 주자', hints: ['창고 안 유키의 편지.', '깃 → 비녀 → 동백', '기모노 깃 여며 주기 → 비녀 꽂아 주기 → 동백꽃 들려 주기'] },
      { until: 'haru', text: '유키에게 대답하자', hints: ['우물에서 나온 하루의 편지.', '"동백이 질 때마다 나는 매년 ___"', '하루는 매년 왔어요'] },
      { until: '__end', text: '정원으로 돌아가자', hints: ['남쪽 문.'] },
    ],
  },
];

export const KIMONO_ENDINGS = {
  true: T('진 엔딩 · 동백이 피는 아침', `"하루는 매년 왔어요."

유키가 두 손으로 입을 막았다. 눈물이 동백꽃 위로 떨어졌다.

동백 문 너머, 정원사 차림의 청년이 서 있었다.
손에는 흙 묻은 동백 묘목 한 그루.
"늦어서 미안해. 90년이나."

부적, 나막신, 부채, 머리쓰개, 비녀, 편지 다발.
여섯 개의 유품이 빛이 되어 두 사람의 손 위에 내려앉았다.

유키는 하루의 손을 잡고 동백 문을 지났다.
뒤돌아보지 않았다. 처음으로, 웃고 있었다.

다음 해 봄, 츠바키야 자리에 동백나무 두 그루가 나란히 꽃을 피웠다.
마을 사람들은 그 나무를 '부부 동백'이라고 불렀다.`),
  normal: T('엔딩 · 빈 혼례석', `"하루는 매년 왔어요."

유키는 고개를 끄덕이고 동백 속으로 사라졌다.
그러나 유품을 다 찾지 못한 그녀는 아직 혼례를 마치지 못했다.

일주일 뒤, 편집실로 소포가 하나 도착했다.
붉은 비단으로 싼 상자. 안에는 혼례 초대장.

  「다이쇼 15년 4월 3일 술시
    츠바키야 동백실에서
    — 신랑 자리를 비워 두었습니다」

초대장 아래, 동백꽃 한 송이가 송이째 떨어져 있었다.

(유키의 유품을 모두 찾으면 다른 결말을 볼 수 있다)`),
};
