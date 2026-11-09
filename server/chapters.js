/*
 * 귀문(鬼門) — 서하리 분교 실종사건
 *
 * 오브젝트 필드 요약
 *  id, t(렌더링 타입), x, z, r(회전°), y(높이), label
 *  kind: examine | pickup | lock | use | coop | door | deco
 *  text: 살펴볼 때/자물쇠 위에 보여줄 글
 *  alt: [{flag, text}]  해당 플래그가 켜지면 바뀌는 글 (마지막 일치 항목 사용)
 *  req: [플래그]  필요한 플래그. 없으면 lockedText 를 보여줌
 *  hidden: true  req 를 만족할 때까지 보이지 않음
 *  goneOn: 플래그  이 플래그가 켜지면 사라짐
 *  lock: input(digits|text|buttons), answer(문자열 또는 배열), buttons, len
 *  use: {item, times}
 *  coop: {group, need}
 *  on: 효과 {flag, give, story:{title,text}, scare, scareSelf, ghost, light, sound, toast}
 *  once: examine 이 처음 한 번만 on 효과를 실행
 */

const T = (title, text) => ({ title, text });

export const CHAPTERS = [
  // ─────────────────────────────────────────── 프롤로그
  {
    id: 0,
    title: '프롤로그 · 막차',
    place: '강원도 정선군 서하리 입구 · 2026년 11월 7일 23:40',
    outdoor: true,
    size: [26, 22],
    spawn: [0, 8.5],
    ambient: 'night',
    ground: '#1d2218',
    fog: 0.075,
    rain: true,
    intro: T('프롤로그 · 막차', `구독자 3만의 흉가 탐방 채널 '심야방송'.
당신들에게 한 통의 손편지가 도착한 것은 일주일 전이었다.

"47년 전, 우리 마을 분교에서 아이 일곱이 사라졌습니다.
 다음 주면 댐에 물이 차서 마을이 영영 잠깁니다.
 그 전에… 아이들을 집에 보내 주세요."

막차 버스가 흙탕물을 튀기며 떠났다.
정류장의 형광등이 '틱' 하고 꺼졌다.
빗소리 사이로, 아이들이 고무줄놀이 하는 노랫소리가 들린다.`),
    props: [
      { t: 'pole', x: 5, z: 7 },
      { t: 'house', x: -10, z: -4, r: 20 }, { t: 'house', x: 10, z: -3, r: -15 },
      { t: 'fence', x: -6, z: -10.5, len: 9 }, { t: 'fence', x: 6, z: -10.5, len: 9 },
      { t: 'lamp', x: -3, z: 6 }, { t: 'rock', x: -11, z: 8 }, { t: 'rock', x: 11, z: 6 },
      { t: 'pine', x: -8, z: 1 }, { t: 'pine', x: 8.5, z: -7 }, { t: 'pine', x: -11, z: -8 },
    ],
    objects: [
      { id: 'busstop', t: 'bus_stop', x: -6, z: 8, label: '버스 정류장', kind: 'examine',
        text: `낡은 시간표가 붙어 있다.\n\n  서하리 → 정선읍   06:50 / 13:20 / 18:10 / 23:40(막차)\n\n시간표 아래, 누군가 손톱으로 긁어 쓴 글씨.\n"아이들은 버스를 타지 않았다"` },
      { id: 'letter', t: 'paper', x: -4.6, z: 8.4, y: 0.55, label: '벤치 위 편지', kind: 'examine', once: true,
        on: { flag: 'read_letter', toast: '목표가 갱신되었습니다' },
        text: `【 이순례의 편지 】

심야방송 여러분께.

저는 서하리에서 태어났습니다. 1979년 가을, 분교가 문을 연 지
스물여섯 해가 되던 해에 같은 반 친구 일곱이 한꺼번에 사라졌습니다.
저만 그날 학교에 가지 않았습니다. 아버지가 가지 말라고 하셨거든요.

마을 철문의 자물쇠 번호는 그 해(年)입니다.
들어가시기 전에 꼭 서낭당에 돌을 올리세요. 꼭이요.

출석부를 찾아 주세요. 아이들 이름을 한 번만 불러 주세요.
아이들은 아직 선생님이 이름 불러 주기를 기다리고 있어요.

추신: 무슨 소리가 들려도, 돌아보지 마세요.` },
      { id: 'bench', t: 'bench', x: -4.6, z: 8.6, kind: 'deco' },
      { id: 'flyer', t: 'flyer', x: 5, z: 6.75, y: 1.5, label: '전봇대 전단지', kind: 'examine',
        text: `빗물에 번진 오래된 전단지.\n\n  【 찾 습 니 다 】\n  1979년 11월 7일 오후, 서하분교 3학년 학생 일곱 명과\n  담임 윤서희 선생님(24세)이 귀가하지 않았습니다.\n  김영호 · 박미숙 · 정동수 · 한옥자 · 오태식 · 서말순 · 강복동\n\n전단지를 보는 사이, 등 뒤 정류장 벤치에서 '삐걱' 하고 누가 앉는 소리가 났다.`,
        once: true, on: { scareSelf: 'flash', sound: 'creak' } },
      { id: 'monument', t: 'monument', x: 6.5, z: 1.5, label: '표지석', kind: 'examine',
        text: `이끼 낀 표지석.\n\n  서하국민학교 서하분교장\n  1953년 4월 1일 개교\n  1980년 3월 1일 폐교\n\n폐교 날짜 아래에 누군가 못으로 새긴 숫자들이 있다. 일곱 개의 줄. 그리고 여덟 번째 줄은 반쯤만 그어져 있다.` },
      { id: 'jang_m', t: 'jangseung_m', x: -2.2, z: -8.2, label: '천하대장군', kind: 'use',
        text: `붉은 얼굴의 장승. '天下大將軍'.\n두 눈알 자리가 끌로 파여 텅 비어 있다. 누군가 눈을 뽑아 간 것이다.\n\n구멍 안쪽이 축축하다.`,
        use: { item: 'jang_eye', times: 2 }, needText: '끼워 넣을 눈알이 없다. 마을 사람들이 장승의 눈을 어딘가에 숨겨 두었을지도 모른다.',
        progressText: '나무 눈알 하나를 끼웠다. 장승의 얼굴이 당신 쪽으로 아주 조금 돌아간 것 같다.',
        doneText: '두 눈을 되찾은 천하대장군이 마을 쪽을 노려보고 있다. 눈가에 붉은 물이 말라붙어 있다.',
        on: { flag: 'eyes', scare: 'face', sound: 'scream',
          story: T('천하대장군', `두 번째 눈알을 끼우자, 장승의 눈에서 붉은 물이 흘러내렸다.\n\n"…들어가거라. 그리고 데려 나오너라.\n 일곱이 아니다. 여덟이다."\n\n철문을 감은 쇠사슬 하나가 '툭' 끊어졌다.`) } },
      { id: 'lostbox', t: 'lostbox', x: -7.6, z: 7.45, y: 1.0, label: '분실물함', kind: 'lock',
        text: '정류장 기둥에 매달린 녹슨 분실물함. 4자리 다이얼.\n테이프에 매직으로 쓴 글씨: "막차 떠나는 시각"',
        lock: { input: 'digits', len: 4, answer: '2340' },
        doneText: '빈 분실물함. 아이 우비 한 벌이 접혀 있다. 젖어 있다.',
        on: { flag: 'lostbox', give: 'jang_eye', sound: 'drawer', scareSelf: 'hands',
          story: T('분실물함', `분실물함 안에는 누렇게 바랜 노란 아이 우비 한 벌과,\n나무를 깎아 만든 눈알 하나가 들어 있었다.\n\n눈알을 꺼내는 순간, 우비 소매 속에서 작은 손이 쑥 나와 당신의 손등을 쓰다듬고 들어갔다.`) } },
      { id: 'eye2', t: 'eye', x: 7.4, z: -0.6, label: '처마 밑 나무 구슬', kind: 'pickup', item: 'jang_eye',
        text: '처마 밑 빗물받이에 무언가 걸려 있다.\n나무를 깎아 만든 눈알이다. 눈동자 부분이 손때로 반들반들하다.' },
      { id: 'jang_f', t: 'jangseung_f', x: 2.2, z: -8.2, label: '지하여장군', kind: 'examine',
        text: `'地下女將軍'. 받침돌에 글이 새겨져 있다.\n\n  "돌 셋을 서낭에 얹지 않은 자\n   이 문을 지나 돌아가지 못하리"\n\n주변 풀숲에 조약돌이 몇 개 흩어져 있다.` },
      { id: 'stone_a', t: 'pebble', x: 8.5, z: -3, label: '조약돌', kind: 'pickup', item: 'stone' },
      { id: 'stone_b', t: 'pebble', x: -9.5, z: 4.5, label: '조약돌', kind: 'pickup', item: 'stone' },
      { id: 'stone_c', t: 'pebble', x: 2.5, z: 3.5, label: '조약돌', kind: 'pickup', item: 'stone' },
      { id: 'cairn', t: 'cairn', x: -7.5, z: -5.5, label: '서낭당 돌무더기', kind: 'use',
        text: '오색 천이 감긴 서낭당 돌무더기. 사람들이 지나가며 돌을 하나씩 올린 흔적이 있다.',
        use: { item: 'stone', times: 3 }, needText: '올릴 조약돌이 없다. 주변에서 찾아보자.',
        progressText: '돌을 하나 얹었다. 돌무더기 안쪽에서 낮은 울음소리가 난다.',
        doneText: '세 개의 돌이 얹힌 서낭당. 오색 천이 바람도 없이 펄럭인다.',
        on: { flag: 'cairn_done', sound: 'bell',
          story: T('서낭당', `세 번째 돌을 얹는 순간, 빗소리가 뚝 멎었다.\n\n돌무더기 틈에서 작은 꽃고무신 한 짝이 굴러 나왔다.\n고무신 안쪽에 삐뚤삐뚤한 글씨 — "2번 박미숙".\n\n철문 쪽에서 쇠사슬이 저 혼자 '철컹' 흔들렸다.`) } },
      { id: 'relic_1', t: 'shoe', x: -6.6, z: -4.6, label: '꽃고무신', kind: 'pickup', item: 'relic_1', hidden: true, req: ['cairn_done'] },
      { id: 'gate_lock', t: 'padlock', x: 0, z: -9.9, y: 1.1, label: '철문 자물쇠', kind: 'lock',
        req: ['cairn_done', 'eyes'],
        lockedText: '자물쇠에 손을 대자, 차가운 손가락이 당신의 손목을 꽉 움켜쥐었다.\n서낭당에 예를 갖추고, 장승에게 눈을 돌려주기 전에는 열리지 않을 것 같다.',
        text: '녹슨 4자리 번호 자물쇠. 쇠사슬이 철문을 칭칭 감고 있다.',
        lock: { input: 'digits', len: 4, answer: '1979' },
        doneText: '자물쇠가 풀려 있다.',
        on: { flag: 'gate_open', scare: 'face', sound: 'gate',
          story: T('철문', `'철컥'.\n자물쇠가 풀리는 순간, 철문 너머 어둠 속에서 하얀 얼굴이 당신들을 마주 보고 있었다.\n\n눈을 깜박이자 아무도 없다.\n대신 진흙 위에 맨발 발자국이 분교 쪽으로 이어져 있다. 아주 작은 발자국이다.`) } },
      { id: 'gate', t: 'gate', x: 0, z: -10.5, label: '마을 철문', kind: 'door', req: ['gate_open'], to: 1,
        lockedText: '쇠사슬로 단단히 잠겨 있다.' },
    ],
    ghost: null,
    objectives: [
      { until: 'read_letter', text: '정류장 주변을 살펴보자', hints: ['벤치 위에 편지가 놓여 있다.', '편지를 클릭(또는 가까이서 E)해 읽어 보자.'] },
      { until: 'cairn_done', text: '마을에 들어가기 전에 서낭당에 예를 갖추자', hints: ['지하여장군 받침돌의 글을 읽어 보자.', '주변에 흩어진 조약돌 세 개를 주워 서낭당 돌무더기에 올리자.', '조약돌은 동쪽 풀숲, 서쪽 풀숲, 표지석 근처에 있다.'] },
      { until: 'eyes', text: '천하대장군의 두 눈을 찾아 끼워 주자', hints: ['천하대장군을 살펴보자. 눈알 두 개가 없다.', '정류장 분실물함은 "막차 떠나는 시각"으로 잠겨 있다. 정류장 시간표를 보자 → 2340', '다른 하나는 동쪽 집 처마 밑에 있다.'] },
      { until: 'gate_open', text: '마을 철문의 자물쇠를 풀자', hints: ['편지: "자물쇠 번호는 그 해(年)" — 분교 개교 26년째 되던 해.', '표지석에 개교 연도가 적혀 있다.', '1953 + 26 = 1979'] },
      { until: '__end', text: '철문을 지나 분교로 가자', hints: ['철문을 클릭하자.'] },
    ],
  },

  // ─────────────────────────────────────────── 1장
  {
    id: 1,
    title: '1장 · 마지막 수업',
    place: '서하분교 3학년 교실',
    size: [16, 12],
    spawn: [0, 4.5],
    ambient: 'dark',
    floor: '#3a2a1c',
    wall: '#5b5446',
    fog: 0.05,
    intro: T('1장 · 마지막 수업', `교실 문이 등 뒤에서 저절로 닫혔다.

분필 가루 냄새. 47년 동안 아무도 들어오지 않았을 교실이
마치 어제까지 수업을 한 것처럼 가지런하다.

책상 여덟 개. 의자 여덟 개.
칠판 지우개만이, 방금 누가 쓴 것처럼 따뜻하다.`),
    props: [
      ...[-4.5, -1.5, 1.5, 4.5].flatMap((x) => [{ t: 'chair', x, z: -0.8 }, { t: 'chair', x, z: 2.2 }]),
      { t: 'window', x: 7.85, z: -3, r: -90 }, { t: 'window', x: 7.85, z: 2, r: -90 },
      { t: 'shelf', x: -7.6, z: -1, r: 90 },
      { t: 'flag_tk', x: 3.5, z: -5.85 },
    ],
    objects: [
      { id: 'blackboard', t: 'blackboard', x: 0, z: -5.85, label: '칠판', kind: 'examine',
        text: `분필 글씨가 또렷하다.\n\n  1979년 11월 7일 (수)\n  일직: 7번\n  오늘의 노래: 「학교종」\n\n칠판 구석, 아이 글씨로 작게:\n"선생님 우리 숨바꼭질 해요. 선생님이 술래."`,
        alt: [{ flag: 'lockers', text: `칠판의 글씨가 전부 지워져 있다.\n그 위에 분필이 부러질 듯 꾹꾹 눌러 쓴 글씨.\n\n  "술 래 는   어 디 있 게 ?"\n\n분필 가루가 아직 허공에 떠 있다.` }] },
      { id: 'clock', t: 'clock', x: 4.5, z: -5.85, y: 2.4, label: '벽시계', kind: 'examine',
        text: '멈춘 벽시계. 짧은바늘은 2와 3 사이, 긴바늘은 9를 조금 넘긴 곳 — 2시 47분.\n\n가만히 보고 있으면, 초침이 가끔 거꾸로 한 칸씩 움직인다.' },
      { id: 'memo', t: 'paper', x: 0.8, z: -4, y: 0.82, label: '교탁 위 메모', kind: 'examine',
        text: `단정한 여선생님의 글씨.\n\n"서랍 번호를 또 잊을까 봐 적어 둔다.\n 우리 반이 마지막으로 다 함께였던 시각.\n 세 자리로."\n\n메모의 날짜는 1979년 11월 7일이다. ...그날 쓴 메모인데, 어떻게 '마지막'을 알았을까.` },
      { id: 'teacher_desk', t: 'teacher_desk', x: 0, z: -4, label: '교탁 서랍', kind: 'lock',
        text: '교탁 서랍에 3자리 다이얼 자물쇠가 달려 있다.',
        lock: { input: 'digits', len: 3, answer: '247' },
        doneText: '열린 서랍. 안은 비어 있다. 바닥에 손톱으로 긁은 자국이 있다.',
        on: { flag: 'drawer', give: 'attendance', sound: 'drawer',
          story: T('출석부', `서랍 안에 출석부가 있었다.\n\n펼치자마자 교실 뒤쪽 의자들이 일제히 '드르륵' 하고 뒤로 밀렸다.\n누군가 일어서는 소리. 여러 명이.\n\n돌아보지 마세요, 라고 편지에 적혀 있었다.\n(출석부는 인벤토리에서 읽을 수 있다)`) } },
      { id: 'desk1', t: 'desk', x: -4.5, z: -1.5, label: '1번 책상', kind: 'examine', text: '이름표: 김영호 (반장)\n\n책상 서랍에 받아쓰기 시험지 100점. 맨 아래 빨간 펜으로 "참 잘했어요".\n시험지 뒷면 가득 같은 글자: "나가고싶어나가고싶어나가고싶어..."\n\n알림장: "수요일 2교시 산수 — 구구단 7단 시험"' },
      { id: 'desk2', t: 'desk', x: -1.5, z: -1.5, label: '2번 책상', kind: 'examine', text: '이름표: 박미숙\n\n책상 위에 공기돌 다섯 개. 하나는 사람 이빨이다.' },
      { id: 'desk3', t: 'desk', x: 1.5, z: -1.5, label: '3번 책상', kind: 'examine', text: '이름표: 정동수\n\n책상 서랍 속 도시락. 뚜껑을 열자 47년 된 보리밥 위로 무언가 꿈틀거린다. 서둘러 닫았다.\n\n알림장: "수요일 4교시 음악 — 학교종 연습"' },
      { id: 'desk4', t: 'desk', x: 4.5, z: -1.5, label: '4번 책상', kind: 'examine', text: '이름표: 한옥자\n\n책상에 칼로 새긴 글씨: "옥자 ♡ 순례 영원한 짝꿍"\n그 옆에 나중에 새긴 듯한 글씨: "순례는 배신자"' },
      { id: 'desk5', t: 'desk', x: -4.5, z: 1.5, label: '5번 책상', kind: 'examine', text: '이름표: 오태식\n\n구슬 주머니가 비어 있다. 주머니 끈에 쪽지: "내 파란 구슬 우물에 빠뜨림. 내일 꺼내야지."\n\n알림장: "수요일 1교시 국어 — 받아쓰기"' },
      { id: 'desk6', t: 'desk', x: -1.5, z: 1.5, label: '6번 책상', kind: 'examine', text: '이름표: 서말순\n\n음악 교과서가 펼쳐져 있다. 「학교종」 계이름이 연필로 적혀 있다.\n\n  학 교 종 이  땡 땡 땡\n  솔 솔 라 라  솔 솔 미\n\n나머지 부분은 찢겨 나갔다. 찢긴 자리가 젖어 있다.' },
      { id: 'desk7', t: 'desk', x: 1.5, z: 1.5, label: '7번 책상', kind: 'examine', text: '이름표: 강복동 (일직)\n\n책상 안쪽 낙서: "사물함 열쇠는 풍금이 먹었어요 히히"\n의자 위에 작은 젖은 손자국이 아직 마르지 않았다.\n\n알림장: "수요일 3교시 자연 — 관찰일기 가져오기"' },
      { id: 'desk8', t: 'desk', x: 4.5, z: 1.5, label: '8번 책상', kind: 'examine', text: '이름표: 이순례\n\n이 책상 위에만 먼지가 한 톨도 없다. 47년 동안 누군가 매일 닦은 것처럼.\n연필로 새긴 글씨: "순례야 너는 오지 마"',
        once: true, on: { scareSelf: 'child', sound: 'giggle' } },
      { id: 'duty', t: 'duty_board', x: -3.3, z: -5.85, y: 1.5, label: '일직 명패', kind: 'lock', req: ['drawer'],
        lockedText: '"오늘의 일직: ______"\n이름 칸이 비어 있다. 누가 일직인지부터 알아야 한다. (교탁 서랍 속 무언가가 필요해 보인다)',
        text: '명패 아래 분필이 놓여 있다. 오늘 일직의 이름을 써 넣자. (이름 입력)',
        lock: { input: 'text', answer: ['강복동'] },
        doneText: '명패에 삐뚤삐뚤한 글씨: "강복동". 당신이 쓴 글씨가 아니다.',
        on: { flag: 'duty', sound: 'giggle',
          story: T('일직', `"강복동".\n이름을 다 쓰자 교실 뒤에서 "네에!" 하고 대답하는 소리가 들렸다.\n\n풍금 뚜껑이 '탁' 하고 저절로 열렸다.\n일직이 할 일은… 노래 반주인가 보다.`) } },
      { id: 'timetable', t: 'timetable', x: 2.5, z: 5.85, y: 1.6, r: 180, label: '수요일 시간표', kind: 'lock',
        text: '교실 뒤 게시판의 시간표. 수요일 칸만 비어 있다. 과목 카드 네 장을 1교시부터 순서대로 꽂아야 한다.\n카드 뒷면: "아이들 알림장을 보면 알 수 있어요"',
        lock: { input: 'buttons', buttons: ['국어', '산수', '사회', '자연', '체육', '음악'], len: 4, answer: ['국어', '산수', '자연', '음악'] },
        wrongScare: true,
        doneText: '완성된 시간표. 맨 아래에 없던 칸: "수요일 5교시 — 숙직실"',
        on: { flag: 'timetable', sound: 'bell',
          story: T('시간표', `마지막 카드를 꽂자 수업 종이 울렸다. 땡, 땡, 땡.\n\n시간표 맨 아래, 없던 칸이 하나 생겼다.\n  수요일 5교시 — 숙직실 (건강검진)\n\n그날 아이들의 마지막 수업이었다.`) } },
      { id: 'organ', t: 'organ', x: -6.6, z: -4, r: 90, label: '풍금', kind: 'lock', req: ['duty'],
        lockedText: '풍금 뚜껑이 잠겨 있다. 뚜껑 안쪽에서 아이 목소리가 속삭인다. "일직이 열어야 돼."',
        text: '낡은 풍금. 페달을 밟으면 쉭쉭 바람 소리가 난다. 건반을 순서대로 눌러 보자. (7음)',
        lock: { input: 'buttons', buttons: ['도', '레', '미', '파', '솔', '라', '시'], len: 7, answer: ['솔', '솔', '라', '라', '솔', '솔', '미'], notes: true },
        doneText: '건반 하나가 제멋대로 눌렸다 올라온다. 누군가 계속 치고 있다.',
        on: { flag: 'organ', give: 'locker_key', sound: 'organ', scare: 'child',
          story: T('학교종', `마지막 음을 누르자 풍금이 혼자서 다음 소절을 이어 쳤다.\n\n  ♪ 어서 모이자 선생님이 우리를 기다리신다 ♪\n\n교실 뒤 텅 빈 자리들에서 작은 목소리들이 따라 불렀다.\n일곱 명. 노래가 끝나자 풍금 아래 판자가 떨어지며 녹슨 열쇠 하나가 굴러 나왔다.`) } },
      { id: 'lockers', t: 'lockers', x: -4.5, z: 5.7, label: '사물함', kind: 'use',
        text: '1번부터 8번까지 번호가 붙은 나무 사물함. 7번 칸에만 자물쇠가 걸려 있다.',
        use: { item: 'locker_key', times: 1 }, needText: '7번 사물함이 잠겨 있다. 열쇠가 필요하다.',
        doneText: '열린 7번 사물함. 안쪽 벽에 작은 손자국이 가득하다.',
        on: { flag: 'lockers', give: 'drawing', light: 'off', sound: 'whisper',
          story: T('7번 사물함', `사물함 안에는 달력 종이로 접은 딱지와 크레파스 그림 한 장이 있었다.\n\n그것을 꺼내는 순간 — 형광등이 일제히 꺼졌다.\n\n어둠 속에서 아이가 숫자를 센다.\n"…여덟, 아홉, 열. 이제 찾는다?"\n\n이번엔 당신들이 술래다.`) } },
      { id: 'relic_2', t: 'ddakji', x: -3.6, z: 5.2, label: '딱지', kind: 'pickup', item: 'relic_2', hidden: true, req: ['lockers'] },
      { id: 'stove', t: 'stove', x: 6.6, z: 0, label: '조개탄 난로', kind: 'examine',
        text: '양철 난로. 연통이 천장으로 이어진다. 잿더미 속에 타다 만 종이가 있다.\n\n"...이장님이 오늘 오후 아이들 건강검진을 숙직실에서...\n ...윤 선생은 모르게..."',
        alt: [{ flag: 'lockers', text: '난로 뒤를 비춰 봤다. 아무도 없다.\n\n…그런데 난로가 뜨겁다. 47년 동안 불을 땐 적이 없을 난로가.' }] },
      { id: 'curtain', t: 'curtain', x: 7.7, z: -0.5, r: -90, label: '커튼', kind: 'examine',
        text: '누렇게 바랜 커튼. 창밖은 칠흑 같다.',
        alt: [{ flag: 'lockers', text: '커튼을 확 젖혔다.\n\n창문에 손바닥 자국이 가득하다. 전부 바깥쪽에서 찍힌 것이다.\n그리고 지금도 하나씩, 하나씩 늘어나고 있다.' }],
        once: false },
      { id: 'closet', t: 'closet', x: 6.6, z: 5.2, label: '청소함', kind: 'examine', req: ['lockers'],
        lockedText: '청소함 문이 열리지 않는다.\n안쪽에서 누군가 문고리를 꽉 붙잡고 있다. 작은 숨소리가 들린다.',
        text: '청소함 문을 열었다.',
        once: true, doneText: '빈 청소함. 바닥에 무릎을 끌어안은 자국만 남아 있다.',
        on: { flag: 'found', scare: 'child', light: 'on', sound: 'scream',
          story: T('찾았다', `청소함 안에 아이가 웅크리고 있었다.\n얼굴이 새까맣다. 아니, 얼굴이 — 없다.\n\n"…찾았다아."\n\n아이가 고개를 들자 교실 불이 다시 켜졌다.\n청소함은 비어 있다. 교실 문이 '끼익' 하고 저절로 열렸다.\n\n복도 저편에서 "다음은 숙직실이야" 하는 속삭임이 들렸다.`) } },
      { id: 'door1', t: 'door', x: -7.9, z: 2.5, r: 90, label: '교실 문', kind: 'door', req: ['found', 'timetable'], to: 2,
        lockedText: '문이 꿈쩍도 하지 않는다. 문 너머에서 아이 목소리: "아직 다 안 찾았잖아."' },
    ],
    ghost: null,
    ghosts: [{ type: 'dalgyal', speed: 1.5, sense: 5, startFlag: 'lockers', spawn: [7, -5], name: '달걀귀신' }],
    objectives: [
      { until: 'drawer', text: '교탁 서랍을 열 방법을 찾자', hints: ['교탁 위 메모를 읽어 보자.', '"우리 반이 마지막으로 다 함께였던 시각" — 멈춘 벽시계를 보자.', '2시 47분 → 247'] },
      { until: 'duty', text: '오늘의 일직 명패에 이름을 써 넣자', hints: ['칠판: 일직은 7번.', '출석부(인벤토리)에서 7번의 이름을 보자.', '강복동'] },
      { until: 'organ', text: '풍금을 연주해 보자', hints: ['칠판에 오늘의 노래가 적혀 있다.', '6번 서말순의 책상에 음악책이 있다.', '솔 솔 라 라 솔 솔 미'] },
      { until: 'lockers', text: '사물함을 열자', hints: ['풍금에서 나온 열쇠를 가진 사람이 사물함을 클릭하자.'] },
      { until: 'found', text: '술래를 찾자', hints: ['사물함에서 나온 그림을 인벤토리에서 읽어 보자.', '그림 속 얼굴 없는 아이가 숨은 곳은 교실 뒤쪽의 그곳.', '청소함을 열어 보자.'] },
      { until: 'timetable', text: '수요일 시간표를 완성하자', hints: ['홀수 번호(1·3·5·7번) 아이들 책상에 알림장이 있다.', '1교시부터 순서대로 꽂자.', '국어 → 산수 → 자연 → 음악'] },
      { until: '__end', text: '교실 밖으로 나가자', hints: ['왼쪽 벽의 교실 문.'] },
    ],
  },

  // ─────────────────────────────────────────── 2장
  {
    id: 2,
    title: '2장 · 숙직실의 밤',
    place: '서하분교 숙직실 · 양호실',
    size: [18, 12],
    spawn: [-6, 4],
    ambient: 'dark',
    startDark: true,
    floor: '#2d2620',
    wall: '#4a4c45',
    fog: 0.06,
    walls: [{ x: 0, z: -2.5, w: 0.3, d: 7 }, { x: 0, z: 5.6, w: 0.3, d: 0.8 }],
    intro: T('2장 · 숙직실의 밤', `복도 끝, 숙직실.
전기가 나가 있다. 손전등 불빛이 닿는 곳마다 먼지가 눈처럼 떠다닌다.

벽 너머 양호실에서 철제 침대가 삐걱이는 소리가 난다.
누군가 뒤척이는 소리. 일곱 번.

…그날 아이들은 '건강검진'을 받으러 이곳에 왔다.`),
    props: [
      { t: 'shelf', x: -3, z: -5.7 }, { t: 'box', x: -8.3, z: 5.2 }, { t: 'bucket', x: 2, z: 5.2 },
      { t: 'screen_med', x: 5.5, z: -1.5 }, { t: 'chair', x: -2, z: -0.2 },
    ],
    objects: [
      { id: 'log', t: 'desk', x: -2, z: -1, label: '숙직 일지', kind: 'examine',
        text: `【 숙직 일지 · 소사 박덕만 】

11월 5일 - 이상 없음. 라디오를 끄지 말 것.
           그 소리가 멎으면 그것이 온다.
           주파수는 늘 내 군번 끝 네 자리에 맞춰 둔다.
11월 6일 - 이장님이 내일 아이들 건강검진을 숙직실에서 한다고 하심.
           양호 선생도 없는데 이상하다. 돈 봉투를 받았다.
11월 7일 - 윤 선생이 아이들 데리고 나가려는 걸 이장님이 막았다.
           나는 아무것도 못 봤다. 아무것도. 아무것도. 아무것도.
11월 8일 - 우물에서 밤새 손톱 긁는 소리가 난다.

(뒷장은 같은 글자로 빼곡하다: "미안하다")` },
      { id: 'uniform', t: 'uniform', x: -8.75, z: 1, r: 90, y: 1.4, label: '걸려 있는 군복', kind: 'examine',
        text: '옷걸이에 걸린 낡은 예비군복. 가슴에 명찰과 군번줄.\n\n  박덕만   군번 11-7023519\n\n가슴 주머니에 주민등록증이 꽂혀 있다: "박덕만 · 1936년 4월 21일생"\n\n군복 소매가 젖어 있다. 마치 방금 누가 입었다 벗어 놓은 것처럼.' },
      { id: 'futon', t: 'futon', x: -5, z: 0, label: '이부자리', kind: 'pickup', item: 'talisman', perPlayer: true,
        text: '베개 밑에 누렇게 바랜 부적이 여러 장 깔려 있다. 소사는 무엇이 두려웠던 걸까.',
        takenText: '베개 밑에는 이제 아무것도 없다. 베개가 아직 따뜻하다.' },
      { id: 'mirror', t: 'mirror', x: -6, z: -5.85, y: 1.5, label: '거울', kind: 'examine', once: true,
        text: '세면대 위의 깨진 거울.\n\n거울 속, 당신 어깨 너머로 작은 아이가 서 있다.\n아이가 입 모양으로 말한다. "라 디 오 켜"\n\n돌아보면 아무도 없다.',
        on: { scareSelf: 'child', sound: 'giggle' } },
      { id: 'chart', t: 'poster', x: 4, z: -5.85, y: 1.6, label: '신체검사표', kind: 'examine',
        text: `【 1979 3학년 신체검사표 】 (11월 7일 실시)

  김영호 131cm   박미숙 127cm   정동수 119cm
  한옥자 124cm   오태식 135cm   서말순 116cm
  강복동 128cm   이순례 ───  (미실시)

표 아래 붉은 글씨: "검사 받은 아이 일곱 — 전원 '수면 처치' 완료"` },
      { id: 'medcab', t: 'med_cabinet', x: 8.6, z: 0, r: -90, label: '약장', kind: 'lock',
        text: '유리문 약장. 3자리 자물쇠. 자물쇠에 테이프로 붙인 쪽지:\n"검진 받은 아이 중 가장 작은 아이의 키"',
        lock: { input: 'digits', len: 3, answer: '116' },
        doneText: '열린 약장. 빈 약병들이 가지런하다. 하나도 남김없이 비었다.',
        on: { flag: 'cabinet', give: 'fuse', sound: 'drawer',
          story: T('약장', `약장 안에는 빈 갈색 약병 일곱 개와 여분의 퓨즈 하나가 있었다.\n\n약병 라벨에는 이장 이만석의 이름이 적혀 있다.\n\n약장 유리문에 비친 당신 뒤로, 양호실 침대 커튼이 천천히 젖혀졌다.`) } },
      { id: 'pills_shelf', t: 'paper', x: 7.6, z: -1.5, y: 0.9, label: '약병', kind: 'pickup', item: 'pills', req: ['cabinet'], hidden: true },
      { id: 'bed1', t: 'bed', x: 3.5, z: -4, label: '양호실 침대', kind: 'examine',
        text: '철제 침대. 시트에 작은 몸이 누웠던 자국이 그대로 남아 있다.\n\n시트를 들추자, 매트리스에 손톱으로 새긴 글씨: "자면 안 돼 자면 안 돼"' },
      { id: 'bed2', t: 'bed', x: 7, z: -4, label: '안쪽 침대', kind: 'examine', once: true,
        text: '이 침대에는 아직 누군가 누워 있다. 하얀 시트가 작은 사람 모양으로 불룩하다.\n\n시트를 걷었다.\n\n…베개 하나. 그런데 베개가 숨을 쉬듯 오르내린다.',
        on: { scareSelf: 'hands', sound: 'breath' } },
      { id: 'fusebox', t: 'fusebox', x: -8.8, z: 3.5, r: 90, y: 1.5, label: '두꺼비집', kind: 'use',
        text: '구식 두꺼비집. 퓨즈 하나가 타서 끊어져 있다.',
        use: { item: 'fuse', times: 1 }, needText: '끊어진 퓨즈를 갈아 끼워야 한다. 여분의 퓨즈가 어딘가 있을 것이다.',
        doneText: '새 퓨즈가 끼워져 있다. 전선에서 지지직 소리가 난다.',
        on: { flag: 'power', light: 'on', sound: 'power',
          story: T('전기', `퓨즈를 끼우자 형광등이 깜박이며 켜졌다.\n\n불이 들어온 순간 보였다. 복도 끝에 서 있던 키 큰 사람 그림자.\n불이 한 번 깜박이자 — 그림자는 문 바로 앞에 와 있었다.\n\n다시 깜박이자 사라졌다. 라디오의 빨간 전원등이 켜졌다.`) } },
      { id: 'safe', t: 'safe', x: -8.4, z: -1.8, r: 90, label: '소형 금고', kind: 'lock',
        text: '숙직실 구석의 작은 금고. 다이얼 옆에 칼로 새긴 낙서: "내 생일 — 월일 네 자리"',
        lock: { input: 'digits', len: 4, answer: '0421' },
        doneText: '빈 금고. 안쪽에 지폐 띠지만 남아 있다.',
        on: { flag: 'safe', give: ['tube', 'envelope'], sound: 'drawer',
          story: T('금고', `금고 안에는 두툼한 돈봉투와 신문지에 싼 진공관 하나가 있었다.\n\n돈봉투 겉면: "박 소사 — 입단속 값. 이만석"\n\n금고 문을 닫는 순간, 금고 안쪽에서 누가 "똑, 똑" 두드렸다.`) } },
      { id: 'tube_socket', t: 'handle', x: -2.2, z: -4.9, y: 0.9, label: '라디오 뒷판', kind: 'use',
        text: '라디오 뒷판이 열려 있다. 진공관을 꽂는 자리 하나가 비어 있다.',
        use: { item: 'tube', times: 1 }, needText: '맞는 진공관이 필요하다.', doneText: '진공관이 은은한 주황빛을 낸다.',
        on: { flag: 'tube_fixed', toast: '라디오에 진공관을 끼웠다' } },
      { id: 'radio', t: 'radio', x: -3, z: -5.2, label: '진공관 라디오', kind: 'lock', req: ['power', 'tube_fixed'],
        lockedText: '라디오가 반응하지 않는다.\n전원(두꺼비집)과, 뒷판의 비어 있는 진공관 자리를 확인해 보자.',
        text: '금성 진공관 라디오. 다이얼을 돌려 주파수를 맞추자. 맞는 주파수에 가까워지면 잡음이 줄어든다. (300.0 ~ 400.0 kHz)',
        lock: { input: 'tune', min: 300, max: 400, step: 0.1, unit: 'kHz', answer: 351.9, tol: 0.35 },
        doneText: '라디오에서 지직거리는 잡음과 함께 아이들의 숨소리가 흘러나온다.',
        on: { flag: 'radio', sound: 'radio', scare: 'face', ghost: 'start',
          story: T('라디오', `지지직… 지지지직…\n\n"…여기는… 어두워요… 선생님…"\n"…문이 안 열려요… 흙이… 자꾸 떨어져요…"\n"…우리 우물 밑… 땅 밑에 있어요… 학교 밑에…"\n\n아이들 목소리가 뚝 끊기고, 낮은 남자 목소리가 들렸다.\n\n"누가 내 라디오를 만지나."\n\n숙직실 문이 벌컥 열렸다. 무언가가 들어온다. 도망쳐!\n(부적을 사용하면 잠시 물리칠 수 있다)`) } },
      { id: 'closet_l', t: 'handle', x: -6.8, z: -5.4, y: 1.0, label: '이불장 왼쪽 손잡이', kind: 'coop', req: ['radio'],
        lockedText: '육중한 이불장. 손잡이가 꿈쩍도 하지 않는다. 지금은 열 이유도 없어 보인다.',
        text: '이불장 손잡이를 힘껏 당긴다!', coop: { group: 'closet', need: 2 } },
      { id: 'closet_r', t: 'handle', x: -5.2, z: -5.4, y: 1.0, label: '이불장 오른쪽 손잡이', kind: 'coop', req: ['radio'],
        lockedText: '육중한 이불장. 손잡이가 꿈쩍도 하지 않는다.',
        text: '이불장 손잡이를 힘껏 당긴다!', coop: { group: 'closet', need: 2 } },
      { id: 'closet_body', t: 'wardrobe', x: -6, z: -5.6, kind: 'deco' },
      { id: 'relic_3', t: 'ribbon', x: -6, z: -4.6, label: '빨간 머리핀', kind: 'pickup', item: 'relic_3', hidden: true, req: ['closet_open'] },
      { id: 'nightkey', t: 'key', x: -5.4, z: -4.6, label: '숙직실 열쇠', kind: 'pickup', item: 'night_key', hidden: true, req: ['closet_open'] },
      { id: 'door2', t: 'door', x: 8.9, z: 4, r: -90, label: '바깥 문', kind: 'use',
        use: { item: 'night_key', times: 1 }, needText: '바깥으로 나가는 문이 잠겨 있다. "숙직" 열쇠가 필요하다.',
        on: { flag: 'door2_open', toast: '문이 열렸다' }, toChapter: 3 },
    ],
    coops: {
      closet: { on: { flag: 'closet_open', sound: 'creak', scare: 'hands',
        story: T('이불장', `이불장 문이 뜯겨 나가듯 열렸다.\n\n이불 사이에서 하얀 손 일곱 개가 동시에 튀어나왔다가 —\n스르르 이불 속으로 사라졌다.\n\n이불 위에 빨간 리본 머리핀과 '숙직' 이라고 새겨진 열쇠가 놓여 있다.`) } },
    },
    ghost: { type: 'janitor', speed: 2.1, sense: 6, hearRun: true, spawn: [0, 5], name: '소사 박덕만' },
    objectives: [
      { until: 'cabinet', text: '양호실 약장을 열자', hints: ['숙직 일지와 양호실 벽의 신체검사표를 보자.', '약장 쪽지: "검진 받은 아이 중 가장 작은 아이의 키".', '이순례는 검진을 받지 않았다 → 서말순 116'] },
      { until: 'power', text: '전기를 복구하자', hints: ['약장에서 얻은 퓨즈를 숙직실 벽의 두꺼비집에 사용하자.'] },
      { until: 'tube_fixed', text: '라디오의 빠진 진공관을 찾자', hints: ['숙직실 구석의 금고: "내 생일".', '걸려 있는 군복 주머니의 주민등록증: 1936년 4월 21일생.', '0421 → 얻은 진공관을 라디오 뒷판에 사용하자.'] },
      { until: 'radio', text: '라디오를 켜자', hints: ['숙직 일지: 주파수는 소사의 군번 끝 네 자리.', '벽에 걸린 군복 명찰을 보자.', '군번 끝 네 자리 3519 → 351.9 kHz 에 맞추자'] },
      { until: 'closet_open', text: '이불장을 열자 — 혼자서는 무겁다', hints: ['이불장 양쪽 손잡이를 동시에(8초 안에) 당겨야 한다.', '파티원과 나눠서 한쪽씩 누르자. 혼자라면 한쪽만으로도 열린다.', '귀신이 가까이 오면 이불자리에서 얻은 부적을 사용하자.'] },
      { until: '__end', text: '숙직실 열쇠로 바깥 문을 열자', hints: ['양호실 오른쪽 벽의 문.'] },
    ],
  },

  // ─────────────────────────────────────────── 3장
  {
    id: 3,
    title: '3장 · 이장댁',
    place: '이장 이만석의 기와집',
    size: [22, 16],
    spawn: [0, 5.5],
    ambient: 'dark',
    floor: '#4a3524',
    wall: '#6b5a44',
    fog: 0.055,
    walls: [{ x: -5, z: -4.5, w: 0.3, d: 7 }, { x: -5, z: 4.5, w: 0.3, d: 7 }, { x: 5, z: -3, w: 0.3, d: 10 }],
    intro: T('3장 · 이장댁', `분교 뒷길로 이어진 기와집. 서하리 이장 이만석의 집이다.

대청마루 한가운데에 제사상이 차려져 있다.
과일은 모두 바닥에 쏟아져 썩어 있고,
상 위에는 이름이 지워진 위패 일곱 개.

안방에서 누군가 담뱃대를 '탁, 탁' 두드리는 소리가 난다.`),
    props: [
      { t: 'pillar', x: -5, z: 1 }, { t: 'pillar', x: 5, z: 2.2 }, { t: 'lantern', x: -2.5, z: 7.3 }, { t: 'lantern', x: 2.5, z: 7.3 },
      { t: 'cushion', x: -1, z: -3.6 }, { t: 'cushion', x: 1, z: -3.6 },
      { t: 'tablets', x: 0, z: -6.4 },
    ],
    objects: [
      { id: 'byeongpung', t: 'folding_screen', x: 0, z: -7.4, label: '병풍', kind: 'examine',
        text: '여덟 폭 병풍. 제사 때 펼치는 글씨 병풍이다. 대부분 좀이 먹었지만 두 폭의 글씨가 남아 있다.\n\n  棗栗梨柿 (조율이시)\n  紅東白西 (홍동백서)',
        alt: [{ flag: 'jesa', text: '병풍 뒤를 들여다봤다.\n\n병풍 뒤는 장례 때 시신을 모시는 자리다.\n거기 — 누군가 거적을 덮고 누워 있다. 거적 밖으로 나온 발이 아주 작다.\n\n일곱 쌍.' }] },
      { id: 'notebook', t: 'paper', x: 3.5, z: 0.5, y: 0.45, label: '제사 수첩', kind: 'examine',
        text: `이만석 처의 낡은 제사 수첩.

"과일은 상 앞줄에 놓는다. 신위(위패)를 바라보고 왼쪽이 서쪽, 오른쪽이 동쪽.
 조율이시 — 서쪽부터 대추, 밤, 배, 감.
 홍동백서 — 붉은 것은 동쪽 끝에. 우리 집은 사과를 맨 동쪽에 둔다.
 어긋나게 차리면 조상이 노하신다."

마지막 장: "올해 제사상은 내가 차리지 않겠다. 저 일곱 위패 앞에 절할 수 없다."` },
      { id: 'jesa', t: 'jesa_table', x: 0, z: -5.2, label: '제사상', kind: 'lock',
        text: '과일이 바닥에 쏟아져 있다. 앞줄 다섯 자리에 서쪽(왼쪽)부터 순서대로 올리자.',
        lock: { input: 'buttons', buttons: ['사과', '배', '밤', '감', '대추'], len: 5, answer: ['대추', '밤', '배', '감', '사과'] },
        wrongScare: true,
        doneText: '바르게 차려진 제사상. 향이 저절로 피어오른다.',
        on: { flag: 'jesa', scare: 'face', sound: 'bell',
          story: T('제사상', `마지막 사과를 올리자 촛불이 일제히 퍼렇게 타올랐다.\n\n일곱 위패 중 하나에서 이름이 피처럼 배어 나왔다.\n  鄭東洙 (정동수)\n\n위패 뒤에서 나무팽이 하나가 데구루루 굴러 나왔다.\n그 순간 병풍 뒤에서 무언가 몸을 일으키는 소리가 났다.`) } },
      { id: 'relic_4', t: 'top', x: 0.8, z: -4.3, label: '나무팽이', kind: 'pickup', item: 'relic_4', hidden: true, req: ['jesa'] },
      { id: 'jokbo', t: 'book', x: -3, z: 1, y: 0.45, label: '족보', kind: 'examine',
        text: `전주 이씨 족보. 이만석의 이름 아래 딸 한 명.\n\n  女 順禮(순례)\n\n그 페이지 사이에 쪽지가 끼어 있다.\n"반닫이 번호 — 순례 돌날. 사진 뒤를 보시오."` },
      { id: 'photo', t: 'photo', x: -10.85, z: -1, r: 90, y: 1.7, label: '돌잔치 사진', kind: 'examine',
        text: '흑백 사진. 한복 입은 아기가 돌상 앞에 앉아 있고, 그 뒤로 이만석이 웃고 있다.\n\n사진 아래: "우리 순례 첫돌 - 3월 14일"\n\n사진 속 이만석의 눈이 당신을 따라 움직인다. …기분 탓이다.',
        once: true, on: { sound: 'whisper' } },
      { id: 'scroll', t: 'scroll', x: 3.5, z: -7.85, y: 1.9, label: '족자', kind: 'examine',
        text: `대청 벽에 걸린 족자. 이만석이 직접 썼다는 시다.\n\n  우거진 당산 그늘 아래\n  물소리만 깊어 가는데\n  밑 모를 어둠 속에서\n  에헤라, 넋이 우는구나\n\n낙관 옆 작은 글씨: "다락의 열쇠는 머리에 있다."` },
      { id: 'attic', t: 'attic_door', x: -8, z: -7.85, y: 1.9, label: '다락문', kind: 'lock',
        text: '안방 벽 높은 곳의 다락문. 한글 네 칸 글자 자물쇠가 걸려 있다.',
        lock: { input: 'text', answer: ['우물밑에'] }, wrongScare: true,
        doneText: '열린 다락. 안쪽에서 작은 손가락들이 바스락거린다.',
        on: { flag: 'attic', give: 'seal', sound: 'creak', scareSelf: 'hands',
          story: T('다락', `다락문이 열리자 먼지와 함께 무언가가 쏟아졌다.\n\n아이들 신발. 작은 고무신과 운동화가 수십 켤레.\n그 사이에서 붉은 인주가 묻은 도장 하나가 굴러 나왔다.\n\n도장에 새겨진 이름: 李萬石`) } },
      { id: 'chest_seal', t: 'padlock', x: -9.55, z: -4.2, y: 0.7, label: '반닫이의 봉인', kind: 'use',
        text: '반닫이에 놋쇠 자물통이 하나 더 채워져 있고, "이만석" 도장이 찍힌 한지로 봉해져 있다. 같은 도장을 찍어야 풀리는 봉인이다.',
        use: { item: 'seal', times: 1 }, needText: '봉인을 풀 도장이 필요하다.', doneText: '봉인이 풀렸다.',
        on: { flag: 'seal_used', sound: 'unlock', toast: '반닫이의 봉인이 풀렸다' } },
      { id: 'chest', t: 'chest', x: -10.2, z: -5, r: 90, label: '반닫이', kind: 'lock', req: ['seal_used'],
        lockedText: '반닫이에 도장이 찍힌 봉인이 붙어 있다. 먼저 봉인을 풀어야 한다.',
        text: '자개 반닫이. 4자리 놋쇠 자물쇠가 달려 있다. (월일 4자리)',
        lock: { input: 'digits', len: 4, answer: ['0314'] },
        doneText: '열린 반닫이. 안쪽 바닥에 붉은 손바닥 자국이 찍혀 있다.',
        on: { flag: 'chest', give: 'ledger', ghost: 'start', sound: 'door',
          story: T('장부', `반닫이 안에 낡은 장부 한 권이 있었다.\n(인벤토리에서 읽을 수 있다)\n\n장부를 펼치는 순간, 안방 미닫이문이 '드르륵' 열렸다.\n담뱃대 두드리는 소리가 멈췄다.\n\n"내 장부를 왜 보나."\n\n갓을 쓴 노인이 목이 꺾인 채 걸어 나온다. 이장 이만석이다.`) } },
      { id: 'jar1', t: 'jar', x: 7, z: -6.5, label: '장독 1', kind: 'examine', text: '된장독. 뚜껑을 열자 썩은 냄새가 확 끼친다. 된장 위로 손톱 하나가 박혀 있다.' },
      { id: 'jar2', t: 'jar', x: 8.6, z: -6.5, label: '장독 2', kind: 'examine', once: true,
        text: '뚜껑을 열었다.\n\n검은 머리카락이 독 안에 가득 차 있다.\n그 머리카락 사이로 눈동자 하나가 떠올라, 당신을 똑바로 쳐다봤다.',
        on: { scareSelf: 'face', sound: 'scream' } },
      { id: 'jar3', t: 'jar', x: 7, z: -4.6, label: '장독 3 (간장독)', kind: 'examine', req: ['chest'],
        lockedText: '간장독. 뚜껑이 돌처럼 무겁다. 무엇을 찾아야 하는지 알기 전엔 열 엄두가 나지 않는다.',
        text: '장부 마지막 장에 적힌 대로 간장독 바닥을 더듬었다.\n\n유리구슬처럼 차가운 무언가가 손에 닿는다. 간장 속에서 무언가가 당신 손가락을 잡았다가 놓았다.\n\n기름종이에 싼 놋쇠 열쇠가 나왔다. 꼬리표: "대문 빗장".',
        once: true, doneText: '비어 있는 간장독. 간장 표면에 작은 얼굴들이 비친다.',
        on: { flag: 'jar3', toast: '대문 빗장을 풀 수 있게 되었다' } },
      { id: 'jar4', t: 'jar', x: 8.6, z: -4.6, label: '장독 4', kind: 'examine', text: '빈 독. 안쪽에서 아이가 숨바꼭질 하며 숫자 세는 소리가 울린다.' },
      { id: 'ledger_note', t: 'paper', x: 9.6, z: -1, y: 0.3, label: '장독대 쪽지', kind: 'examine', text: '장독대 돌 밑에 끼인 쪽지.\n"증거는 간장독에. 순례 엄마가"' },
      { id: 'gate_l', t: 'handle', x: -1, z: 7.4, y: 1.0, label: '대문 빗장 (왼쪽)', kind: 'coop', req: ['jar3'],
        lockedText: '굵은 나무 빗장이 놋쇠 자물통으로 잠겨 있다.',
        text: '빗장을 들어 올린다!', coop: { group: 'gate', need: 2 } },
      { id: 'gate_r', t: 'handle', x: 1, z: 7.4, y: 1.0, label: '대문 빗장 (오른쪽)', kind: 'coop', req: ['jar3'],
        lockedText: '굵은 나무 빗장이 놋쇠 자물통으로 잠겨 있다.',
        text: '빗장을 들어 올린다!', coop: { group: 'gate', need: 2 } },
      { id: 'door3', t: 'big_gate', x: 0, z: 7.9, label: '대문', kind: 'door', req: ['gate_open3'], to: 4,
        lockedText: '대문 빗장이 걸려 있다. 빗장은 무거워서 양쪽에서 함께 들어야 한다.' },
    ],
    coops: {
      gate: { on: { flag: 'gate_open3', sound: 'gate', toast: '대문 빗장이 풀렸다!',
        story: T('대문', `둘이서 빗장을 들어 올리자 대문이 끼이익 열렸다.\n\n등 뒤에서 이만석의 목소리가 들렸다.\n"그 아이들은 마을을 위해 간 거다. 너희가 뭘 안다고."\n\n대문 밖, 당산나무 쪽에서 우물 도르래 돌아가는 소리가 들린다.`) } },
    },
    ghost: { type: 'elder', speed: 2.2, sense: 7, teleport: 24, spawn: [-9, -6], name: '이장 이만석' },
    ghosts: [{ type: 'headless', speed: 1.7, sense: 5, startFlag: 'jesa', spawn: [8, 5], name: '목 없는 머슴' }],
    objectives: [
      { until: 'jesa', text: '제사상을 바르게 차리자', hints: ['병풍의 글과 제사 수첩을 읽자.', '위패를 바라볼 때 왼쪽이 서쪽. 조율이시 = 대추·밤·배·감, 사과는 맨 동쪽.', '대추 → 밤 → 배 → 감 → 사과'] },
      { until: 'attic', text: '안방의 다락문을 열자', hints: ['다락문은 네 글자 자물쇠. 대청 벽의 족자를 읽어 보자.', '"열쇠는 머리에 있다" — 시의 각 줄 첫 글자.', '우물밑에'] },
      { until: 'seal_used', text: '반닫이의 봉인을 풀자', hints: ['다락에서 얻은 도장을 반닫이의 놋쇠 자물통(봉인)에 사용하자.'] },
      { until: 'chest', text: '안방의 반닫이를 열자', hints: ['대청의 족보 사이에 쪽지가 있다.', '안방 벽의 돌잔치 사진: 3월 14일.', '0314'] },
      { until: 'jar3', text: '장부가 말하는 증거를 찾자', hints: ['장부를 인벤토리에서 읽고, 장독대 쪽지를 보자.', '간장독(장독 3)을 살펴보자.'] },
      { until: 'gate_open3', text: '대문 빗장을 풀자', hints: ['대문 양쪽 빗장을 8초 안에 함께 들어 올려야 한다.', '이장이 가까이 오면 부적을 쓰자.'] },
      { until: '__end', text: '대문을 지나 당산나무로', hints: ['대문을 클릭하자.'] },
    ],
  },

  // ─────────────────────────────────────────── 4장
  {
    id: 4,
    title: '4장 · 당산나무 아래 우물',
    place: '서하리 마을 한가운데',
    outdoor: true,
    size: [26, 22],
    spawn: [-2, 8.5],
    ambient: 'night',
    ground: '#1a1f17',
    fog: 0.07,
    intro: T('4장 · 당산나무 아래 우물', `마을 한가운데, 수백 년 된 당산나무.
가지마다 낡은 오색 천이 매달려 있고, 그 아래 판자로 덮인 우물.

우물 안에서 누군가 젖은 손톱으로 벽을 긁는 소리가 난다.
쉬익, 쉬익, 쉬익.

나무 그늘 아래, 긴 머리의 하얀 여자가 서 있다.
여자가 당신들을 향해 미끄러지듯 다가온다.`),
    props: [
      { t: 'house', x: -10, z: -7, r: 30 }, { t: 'house', x: 10.5, z: 6, r: -40 }, { t: 'pine', x: -11, z: 4 }, { t: 'pine', x: 11, z: -3 },
      { t: 'rock', x: -6, z: 6 }, { t: 'rock', x: 5, z: 7 },
    ],
    objects: [
      { id: 'tree', t: 'dangsan', x: 0, z: -7.5, label: '당산나무', kind: 'lock', req: ['diary_read'],
        lockedText: '거대한 느티나무. 가지마다 사람 이름이 적힌 천이 묶여 있다.\n"이 나무에 이름을 걸면, 넋이 돌아갈 곳을 찾는다"는 금줄이 둘러져 있다.',
        text: '빈 천 한 조각이 바람에 나부낀다. 누구의 이름을 걸어야 할까? (이름 입력)',
        lock: { input: 'text', answer: ['윤서희', '윤서희선생님', '윤서희선생'] },
        doneText: '"윤서희"라고 적힌 하얀 천이 가지 끝에서 조용히 흔들린다.',
        on: { flag: 'teacher_named', ghost: 'stop', sound: 'bell',
          story: T('선생님', `"윤서희".\n이름을 적은 천을 가지에 묶자, 다가오던 하얀 여자가 멈춰 섰다.\n\n젖은 머리카락 사이로 드러난 얼굴은 스물넷의 앳된 선생님이었다.\n\n"…여기까지 오면 안 되는 거였어. 그래서 쫓아낸 거야.\n 아이들은 학교 밑에 있어. 방공호. 그 문은 무당만 열 수 있어.\n 청솔당의 신당으로 가. 그리고… 빨리. 그 사람이 깨어났어."\n\n선생님은 물안개처럼 흩어졌다. 산길 쪽에서 방울 소리가 들린다.`) } },
      { id: 'stele', t: 'monument', x: -3, z: -5, label: '오방 비석', kind: 'examine',
        text: `당제(堂祭)를 지내는 법이 새겨진 비석.

  東靑 南赤 中黃 西白 北黑
  (동은 청, 남은 적, 가운데는 황, 서는 백, 북은 흑)

  "깃발은 해 뜨는 곳에서 시작하여 해를 따라 돌고,
   마지막에 가운데에 꽂는다."` },
      { id: 'signpost', t: 'signpost', x: -4.5, z: 7, label: '이정표', kind: 'examine',
        text: '나무 이정표. 화살표가 그려져 있다.\n\n  ↑ 북(北) : 당산나무\n  → 동(東) : 개울\n  ↓ 남(南) : 버스 정류장\n  ← 서(西) : 공동묘지' },
      { id: 'flag_e', t: 'flagpole', x: 10, z: 1, color: '#2f5fd0', label: '푸른 깃발', kind: 'examine', text: '동쪽에 꽂힌 푸른 깃발(靑). 깃대 끝에 젖은 머리카락이 감겨 있다.' },
      { id: 'flag_s', t: 'flagpole', x: 2, z: 9.5, color: '#c9302c', label: '붉은 깃발', kind: 'examine', text: '남쪽의 붉은 깃발(赤). 붉은 물이 깃발 끝에서 똑똑 떨어진다.' },
      { id: 'flag_w', t: 'flagpole', x: -10, z: 1, color: '#e8e8e0', label: '흰 깃발', kind: 'examine', text: '서쪽의 흰 깃발(白). 공동묘지 쪽에서 바람이 불어온다.' },
      { id: 'flag_n', t: 'flagpole', x: 4, z: -9.5, color: '#151515', label: '검은 깃발', kind: 'examine', text: '북쪽의 검은 깃발(黑). 만지자 얼음처럼 차갑다.' },
      { id: 'flag_c', t: 'flagpole', x: 2.5, z: 0, color: '#d8b02a', label: '누런 깃발', kind: 'examine', text: '마을 한가운데의 누런 깃발(黃).' },
      { id: 'altar', t: 'altar_stone', x: 0, z: -4.2, label: '당제 제단', kind: 'lock',
        text: '제단 위에 깃발 색을 새긴 돌 다섯 개. 순서대로 눌러야 한다.',
        lock: { input: 'buttons', buttons: ['청', '적', '황', '백', '흑'], len: 5, answer: ['청', '적', '백', '흑', '황'] },
        wrongScare: true,
        doneText: '돌 다섯 개가 모두 눌려 있다.',
        on: { flag: 'obang', sound: 'bell', toast: '우물의 봉인이 풀렸다',
          story: T('오방', `마지막 돌을 누르자 다섯 깃발이 동시에 우물 쪽으로 펄럭였다.\n\n우물 뚜껑을 묶고 있던 금줄이 스스로 끊어졌다.\n우물 속 긁는 소리가 멎었다. 대신, 누군가 숨죽여 우는 소리.`) } },
      { id: 'well', t: 'well', x: -3.5, z: 1.5, label: '우물', kind: 'examine',
        text: '판자로 덮이고 금줄이 감긴 우물. 판자 틈으로 차가운 숨결이 올라온다.',
        alt: [{ flag: 'obang', text: '금줄이 끊긴 우물. 도르래에 두레박 줄이 감겨 있다.\n줄이 너무 무겁다. 양쪽 도르래 손잡이를 둘이서 함께 돌려야 할 것 같다.' },
          { flag: 'well_up', text: '바닥이 보이지 않는 우물. 물 위에 하얀 치맛자락이 떠 있다가 가라앉았다.' }] },
      { id: 'crank_a', t: 'handle', x: -5, z: 1.5, y: 0.9, label: '도르래 손잡이 (서)', kind: 'coop', req: ['obang', 'crank_set'],
        lockedText: '도르래가 녹슬어 꿈쩍도 하지 않는다. 우물이 무언가로 봉인되어 있다.',
        text: '도르래를 돌린다!', coop: { group: 'well', need: 2 } },
      { id: 'crank_b', t: 'handle', x: -2, z: 1.5, y: 0.9, label: '도르래 손잡이 (동)', kind: 'coop', req: ['obang', 'crank_set'],
        lockedText: '도르래가 녹슬어 꿈쩍도 하지 않는다.',
        text: '도르래를 돌린다!', coop: { group: 'well', need: 2 } },
      { id: 'diary_obj', t: 'book', x: -3.5, z: 2.9, y: 0.3, label: '젖은 일기장', kind: 'pickup', item: 'diary', hidden: true, req: ['well_up'],
        onPick: { flag: 'diary_read', toast: '일기장을 인벤토리에서 읽어 보자' } },
      { id: 'relic_5', t: 'marble', x: -2.7, z: 2.9, label: '파란 유리구슬', kind: 'pickup', item: 'relic_5', hidden: true, req: ['well_up'] },
      { id: 'gongdeok', t: 'monument', x: 6.5, z: -5, label: '공덕비', kind: 'lock',
        text: '"마을을 역병에서 구한 이장 이만석 공덕비 — 1980년 서하리 주민 일동"\n\n비석 뒷면에 일곱 개의 작은 손바닥 자국이 검게 그을려 있고, 그 아래 이름이 새겨져 있다.\n"작은 손부터 차례로 맞대어라" (7명 순서)',
        lock: { input: 'buttons', buttons: ['김영호', '박미숙', '정동수', '한옥자', '오태식', '서말순', '강복동'], len: 7, answer: ['서말순', '정동수', '한옥자', '박미숙', '강복동', '김영호', '오태식'] },
        wrongScare: true, doneText: '손바닥 자국이 모두 따뜻하다.',
        on: { flag: 'gongdeok', give: 'crank', sound: 'bell',
          story: T('공덕비', `마지막 손바닥에 손을 맞대자 비석이 '쩍' 갈라졌다.\n\n갈라진 틈에서 녹슨 쇠손잡이 하나가 떨어졌다. 우물 도르래의 손잡이다.\n\n비석의 "공덕(功德)" 두 글자가 핏물에 씻겨 지워졌다.`) } },
      { id: 'well_axle', t: 'handle', x: -3.5, z: 0.4, y: 1.6, label: '도르래 축', kind: 'use', req: ['obang'],
        lockedText: '금줄로 봉해진 우물. 지금은 손댈 수 없다.',
        text: '우물 도르래 축에 손잡이가 빠져 있다.',
        use: { item: 'crank', times: 1 }, needText: '도르래를 돌릴 손잡이가 없다. 마을 어딘가에 숨겨져 있을 것이다.', doneText: '손잡이가 끼워진 도르래.',
        on: { flag: 'crank_set', toast: '도르래에 손잡이를 끼웠다' } },
      { id: 'path', t: 'path_gate', x: 11.5, z: -8, r: -90, label: '신당 가는 산길', kind: 'door', req: ['teacher_named'], to: 5,
        lockedText: '산길 입구에 하얀 여자가 서 있다. 다가가자 여자가 고개를 젓는다. 아직은 갈 수 없다.' },
    ],
    coops: {
      well: { on: { flag: 'well_up', scare: 'hands', sound: 'water',
        story: T('우물', `둘이서 도르래를 돌렸다. 줄이 끝도 없이 올라온다.\n\n두레박이 올라오는 순간 — 두레박 손잡이를 쥔 하얀 손이 함께 올라왔다.\n손은 두레박을 우물가에 내려놓고, 천천히 물속으로 가라앉았다.\n\n두레박 안에 젖은 일기장과 파란 유리구슬이 있다.`) } },
    },
    ghost: { type: 'woman', speed: 3.3, sense: 9, lightFreeze: true, spawn: [0, -6], name: '하얀 여자', auto: true },
    objectives: [
      { until: 'obang', text: '당제 제단의 오방색 돌을 순서대로 누르자', hints: ['오방 비석과 이정표를 읽자. 깃발들이 어느 방향에 있는지 확인하자.', '해 뜨는 곳(동)에서 시작해 해를 따라(동→남→서→북) 돌고, 마지막에 가운데.', '청 → 적 → 백 → 흑 → 황'] },
      { until: 'crank_set', text: '우물 도르래의 손잡이를 찾자', hints: ['공덕비 뒷면의 손바닥 자국: 키 작은 아이부터. 2장 양호실 신체검사표를 떠올리자 (수첩 J).', '116 서말순 · 119 정동수 · 124 한옥자 · 127 박미숙 · 128 강복동 · 131 김영호 · 135 오태식', '얻은 손잡이를 우물의 도르래 축에 사용하자.'] },
      { until: 'well_up', text: '우물에서 두레박을 끌어올리자', hints: ['우물 양쪽 도르래 손잡이를 8초 안에 함께 돌리자.'] },
      { until: 'teacher_named', text: '하얀 여자의 정체를 밝히자', hints: ['젖은 일기장을 인벤토리에서 읽자.', '"내 이름을 당산나무에 걸어 줘."', '당산나무에 "윤서희"를 입력하자.'] },
      { until: '__end', text: '산길을 따라 신당으로', hints: ['동북쪽 산길 입구를 클릭하자.'] },
    ],
  },

  // ─────────────────────────────────────────── 5장
  {
    id: 5,
    title: '5장 · 청솔당',
    place: '무당 청솔당의 신당',
    size: [16, 14],
    spawn: [0, 5],
    ambient: 'candle',
    floor: '#2e1f1a',
    wall: '#5a2e2a',
    fog: 0.06,
    intro: T('5장 · 청솔당', `산자락 끝, 무당 청솔당의 신당.

벽에 걸린 무신도(巫神圖)들 — 그 속 신들의 눈알이 모두 도려내져 있다.
천장 대들보에 끊어진 무명천이 아직도 흔들린다.

촛불 수십 개가 제단 위에서 타고 있다.
47년 동안 아무도 오지 않은 신당에서.`),
    props: [
      { t: 'candles', x: -3, z: -6.2 }, { t: 'candles', x: 3, z: -6.2 }, 
      { t: 'beam', x: 0, z: 0 }, { t: 'noose', x: 0.5, z: -0.5 }, { t: 'cushion', x: -1, z: -4.5 }, { t: 'cushion', x: 1, z: -4.5 },
    ],
    objects: [
      { id: 'altar_note', t: 'paper', x: 1.5, z: -6, y: 0.95, label: '제단 위 쪽지', kind: 'examine',
        text: '"신을 모시는 순서를 잊지 말 것.\n 하늘(칠성) → 산(산신) → 물(용왕) → 저승(바리공주)\n 무구함은 그 순서대로 신의 눈을 센 수로 연다."' },
      { id: 'p_chilseong', t: 'painting', x: -7.85, z: -3, r: 90, y: 1.8, label: '칠성신도', kind: 'examine', text: '북두칠성을 상징하는 칠성신 일곱 분. 일곱 분 모두 눈이 도려내졌다.\n도려낸 눈구멍: 7개 (한 분에 하나씩, 왼쪽 눈만)' },
      { id: 'p_sansin', t: 'painting', x: -7.85, z: 2, r: 90, y: 1.8, label: '산신도', kind: 'examine', text: '호랑이를 거느린 산신령. 산신의 두 눈이 도려내졌다. 호랑이의 눈은 멀쩡하다.\n도려낸 눈구멍: 2개\n\n…호랑이의 눈이 당신을 따라 움직인다.' },
      { id: 'p_yongwang', t: 'painting', x: 7.85, z: -3, r: -90, y: 1.8, label: '용왕도', kind: 'examine', text: '용을 탄 용왕과 시종 하나. 용왕의 두 눈과 시종의 두 눈이 모두 파였다.\n도려낸 눈구멍: 4개' },
      { id: 'p_bari', t: 'painting', x: 7.85, z: 2, r: -90, y: 1.8, label: '바리공주도', kind: 'examine', once: true, text: '저승길을 인도하는 바리공주. 오른쪽 눈 하나만 파였다.\n도려낸 눈구멍: 1개\n\n그림 속 바리공주의 입이 움직였다.\n"…아이들을 데려가려면 이름을 불러야 해."', on: { scareSelf: 'flash', sound: 'whisper' } },
      { id: 'gongsu', t: 'low_desk', x: -4.5, z: 4, label: '청솔당의 고백', kind: 'examine',
        text: `앉은뱅이책상 위에 붓글씨로 쓴 종이가 있다.

"나 청솔당은 거짓 공수를 내렸다.
 이장이 쌀 열 섬을 주며 그렇게 말하라 했다.
 귀문 따위는 없었다. 우리가 아이들을 묻어서 문이 열렸다.

 문을 닫는 법 — 진오귀굿.
  하나. 방울을 흔들어 신을 부르고
  둘. 부채를 펼쳐 저승길을 열고
  셋. 넋의 이름을 불러 모으고
  넷. 신칼을 던져 원한의 끈을 끊고
  다섯. 봉인부를 붙여 문을 닫는다.

 이름을 부를 출석부를 가진 자만이 할 수 있다.
 나는 할 수 없었다. 아이들이 나를 보고 있어서."` },
      { id: 'cinnabar_bowl', t: 'bowl', x: -1.5, z: -6, y: 0.95, label: '빈 놋그릇', kind: 'examine',
        text: '경면주사를 담던 놋그릇. 비어 있다.\n그릇 바닥에 손톱으로 긁은 글씨: "주사는 장구 속에 숨겼다 — 장단을 맞춰야 나온다"' },
      { id: 'drum', t: 'drum', x: 5.5, z: 3, label: '장구', kind: 'lock',
        text: '무당의 장구. 채가 놓여 있다. 장단을 쳐 보자. (6박)',
        lock: { input: 'buttons', buttons: ['덩', '쿵', '덕', '기덕'], len: 6, answer: ['덩', '기덕', '쿵', '덕', '쿵', '덕'], drum: true },
        wrongScare: true, doneText: '장구 가죽이 저 혼자 미세하게 떨린다.',
        on: { flag: 'drum', give: 'cinnabar', sound: 'bell',
          story: T('굿거리', `덩, 기덕, 쿵, 덕, 쿵, 덕.\n\n장단이 끝나자 같은 장단이 되돌아왔다. 천장 위에서.\n\n장구 울림통 안쪽에서 붉은 가루가 든 주머니가 '툭' 떨어졌다. 경면주사다.`) } },
      { id: 'score', t: 'poster', x: 7.85, z: 5, r: -90, y: 1.6, label: '무가 악보', kind: 'examine',
        text: '벽에 붙은 굿거리 장단 악보.\n\n  ○ 덩    ◎ 쿵    │ 덕    ⁞ 기덕\n\n  ○   ⁞   ◎   │   ◎   │\n\n"한 장단 여섯 박. 신을 부를 땐 반드시 이 장단으로."' },
      { id: 'altar_box', t: 'chest', x: -3.5, z: -5.3, label: '제단 아래 함', kind: 'lock',
        text: '제단 아래의 작은 함. 한글 글자 자물쇠.\n함 뚜껑에 새겨진 글: "저승길을 인도하는 이의 이름"',
        lock: { input: 'text', answer: ['바리공주', '바리데기', '바리'] },
        doneText: '빈 함. 바닥에 부적 그리는 붓이 굴러다닌다.',
        on: { flag: 'altar_box', give: 'talisman_blank', sound: 'unlock', toast: '미완성 부적을 얻었다' } },
      { id: 'toolbox', t: 'chest', x: 3.5, z: -5.2, label: '무구함', kind: 'lock',
        text: '무구(巫具)를 넣어 두는 함. 4자리 숫자 자물쇠.',
        lock: { input: 'digits', len: 4, answer: '7241' },
        wrongScare: true,
        doneText: '빈 무구함. 안쪽에 "미안하다 아가들아" 라고 수십 번 쓰여 있다.',
        on: { flag: 'tools', give: 'shinkal', ghost: 'start', sound: 'bell',
          story: T('무구함', `함 안에는 신칼과 칠성방울, 노란 고무줄 하나가 있었다.\n\n신칼을 꺼내자 대들보의 무명천이 팽팽해졌다.\n천 끝에 아무것도 매달려 있지 않은데, 무언가 무거운 것이 흔들리는 소리가 난다.\n\n삐걱. 삐걱. 삐걱.\n\n목이 길게 늘어난 여자가 천장에서 거꾸로 내려온다. 청솔당이다.`) } },
      { id: 'bell_obj', t: 'bell', x: 2.6, z: -4.6, label: '칠성방울', kind: 'pickup', item: 'bell', hidden: true, req: ['tools'] },
      { id: 'relic_6', t: 'rubberband', x: 4.3, z: -4.6, label: '노란 고무줄', kind: 'pickup', item: 'relic_6', hidden: true, req: ['tools'] },
      { id: 'ladder_a', t: 'ladder', x: -1.5, z: 0.5, label: '사다리 (오르기)', kind: 'coop',
        text: '사다리를 타고 대들보로 올라간다!', coop: { group: 'ladder', need: 2 } },
      { id: 'ladder_b', t: 'handle', x: -0.4, z: 0.9, y: 0.6, label: '사다리 붙잡기', kind: 'coop',
        text: '흔들리는 사다리를 꽉 붙잡는다!', coop: { group: 'ladder', need: 2 } },
      { id: 'fan_obj', t: 'fan', x: 1.4, z: 0.6, label: '부채', kind: 'pickup', item: 'fan', hidden: true, req: ['ladder_done'] },
      { id: 'bell_rack', t: 'bell_rack', x: 5, z: -2, label: '처마의 풍경', kind: 'lock', req: ['tools'],
        lockedText: '처마 끝에 풍경(風磬) 다섯 개가 매달려 있다. 지금은 조용하다.',
        text: '바람도 없는데 풍경 다섯 개가 순서대로 울린다. 잘 보고, 같은 순서로 울리자.',
        lock: { input: 'simon', buttons: ['청', '적', '황', '백', '흑'], colors: ['#2f5fd0', '#c9302c', '#d8b02a', '#e8e8e0', '#333'], answer: ['적', '청', '흑', '황', '백', '적'] }, wrongScare: true,
        on: { flag: 'bells_done', sound: 'bell', toast: '풍경 소리가 잦아들었다. 신당 문의 빗장이 풀리는 소리.' } },
      { id: 'door5', t: 'door', x: 0, z: 6.9, label: '신당 문', kind: 'door', req: ['tools', 'ladder_done', 'talisman_done', 'bells_done'], to: 6,
        lockedText: '문 앞에 서자 청솔당의 목소리가 머릿속에 울린다.\n"방울, 부채, 신칼, 그리고 완성된 봉인부. 하나라도 없으면 너희도 저 아이들처럼 된다."' },
    ],
    coops: {
      ladder: { on: { flag: 'ladder_done', scare: 'face', sound: 'creak',
        story: T('대들보', `사다리를 붙잡아 주는 사이, 대들보 위로 올라갔다.\n\n먼지 쌓인 대들보 위에 삼불제석 부채가 놓여 있다.\n부채를 집는 순간, 바로 옆에서 누군가 숨을 내쉬었다.\n\n고개를 돌렸다. 대들보 위에 웅크린 청솔당이 코앞에서 웃고 있었다.\n\n부채가 아래로 떨어졌다.`) } },
    },
    ghost: { type: 'mudang', speed: 2.4, sense: 8, teleport: 20, zigzag: true, spawn: [0, -2], name: '무당 청솔당' },
    objectives: [
      { until: 'tools', text: '무구함을 열자', hints: ['제단 위 쪽지에 신을 모시는 순서가 있다.', '네 무신도에서 도려낸 눈구멍 수를 세자.', '칠성 7 → 산신 2 → 용왕 4 → 바리공주 1 = 7241'] },
      { until: 'ladder_done', text: '대들보 위를 살펴보자', hints: ['사다리는 한 사람이 붙잡고 한 사람이 올라야 한다. (8초 안에 둘 다)', '혼자라면 사다리만 눌러도 된다.'] },
      { until: 'talisman_done', text: '봉인부를 완성하자', hints: ['제단 아래 함: "저승길을 인도하는 이" — 무신도 중 하나의 이름 (바리공주).', '빈 놋그릇의 글: 경면주사는 장구 속. 벽의 무가 악보대로 치자: 덩 기덕 쿵 덕 쿵 덕', '인벤토리에서 미완성 부적을 우클릭 → 조합 → 경면주사를 클릭.'] },
      { until: 'bells_done', text: '처마의 풍경 소리를 따라 울리자', hints: ['풍경을 클릭하면 울리는 순서를 보여 준다. 잘 보고 그대로 누르자.', '"다시 보기"로 몇 번이든 다시 볼 수 있다.'] },
      { until: '__end', text: '무구를 모두 챙겨 분교 지하로', hints: ['신칼·방울·부채·봉인부·출석부가 파티 안에 모두 있어야 한다. 신당 문을 클릭하자.'] },
    ],
  },

  // ─────────────────────────────────────────── 6장
  {
    id: 6,
    title: '6장 · 귀문',
    place: '서하분교 지하 방공호',
    size: [20, 16],
    spawn: [0, 6.5],
    ambient: 'abyss',
    startDark: true,
    floor: '#1c1a17',
    wall: '#2f2b26',
    fog: 0.08,
    walls: [{ x: -5.6, z: 3, w: 8.8, d: 0.3 }, { x: 5.6, z: 3, w: 8.8, d: 0.3 }],
    intro: T('6장 · 귀문(鬼門)', `분교 지하로 내려가는 콘크리트 계단.
일제강점기에 판 방공호다. 공기가 축축하고 비리다.

벽마다 작은 손톱 자국이 수천 개 그어져 있다.

그리고 가장 안쪽, 피로 그린 문 — 귀문(鬼門).
문 앞에 아이 일곱이 둥글게 앉아 있다.
모두 등을 돌린 채, 선생님이 이름을 불러 주기를 기다리며.

등 뒤 계단에서 담뱃대 소리가 들린다. 이만석이 따라왔다.`),
    props: [
      { t: 'stairs', x: 0, z: 7.4 }, { t: 'pillar_c', x: -6, z: 2 }, { t: 'pillar_c', x: 6, z: 2 }, { t: 'pillar_c', x: -6, z: -4 }, { t: 'pillar_c', x: 6, z: -4 },
      { t: 'puddle', x: -3, z: 4 }, { t: 'puddle', x: 4, z: -1 },
    ],
    objects: [
      { id: 'marks', t: 'wall_marks', x: -9.85, z: 5, r: 90, y: 1.4, label: '손톱 자국', kind: 'examine',
        text: '벽에 새겨진 손톱 자국. 하루에 한 줄씩 긋고, 일곱 줄마다 가로줄로 묶었다.\n\n꽉 찬 묶음이 셋. 그리고 마지막 묶음은 여섯째 줄에서 멈췄다.\n\n자국 아래 작은 글씨: "동쪽 벽 틈에 내 이름표 숨겼어 — 영호"' },
      { id: 'inner_gate', t: 'iron_door', x: 0, z: 3, label: '방공호 철문', kind: 'lock', goneOn: 'inner_open',
        text: '녹슨 철문. 두 자리 숫자 자물쇠.\n문에 아이 글씨로: "우리가 여기서 지낸 날"',
        lock: { input: 'digits', len: 2, answer: '27' }, wrongScare: true,
        on: { flag: 'inner_open', sound: 'gate', scare: 'child',
          story: T('철문', `철문이 열리자 안쪽 공기가 한숨처럼 빠져나왔다.\n\n스물이레.\n아이들은 이 어둠 속에서 스물이레를 버텼다.\n그동안 마을 사람 누구도 이 문을 열지 않았다.`) } },
      { id: 'crevice', t: 'wall_marks', x: 9.85, z: 2, r: -90, y: 1.2, label: '동쪽 벽 틈새', kind: 'pickup', item: 'relic_7',
        text: '틈새에 손을 넣었다. 작은 손가락이 당신의 손가락을 꼭 쥐었다가, 무언가를 손바닥에 쥐여 주었다.', takenText: '깊게 파인 틈새. 안쪽에서 "고마워" 하는 소리가 들렸다.' },
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const names = ['김영호', '박미숙', '정동수', '한옥자', '오태식', '서말순', '강복동'];
        const lines = [
          '"선생님이 반장은 끝까지 친구들 지키래요. 그래서 안 울었어요."',
          '"내 고무신 한 짝 잃어버렸어. 엄마한테 혼나."',
          '"배고파. 도시락 먹고 싶어."',
          '"순례는 왜 안 왔어? 순례는 내 짝꿍인데."',
          '"우물에 구슬 빠뜨렸어. 꺼내 줄 수 있어?"',
          '"노래 불러 주면 안 무서워. 학교종이 땡땡땡."',
          '"오늘 일직은 나야. 문단속은 내가 해야 돼. 근데 문이 안 열려."',
        ];
        const a = (i / 7) * Math.PI * 2;
        return { id: 'child' + i, t: 'child_ghost', x: Math.sin(a) * 2.6, z: -3 + Math.cos(a) * 2.2, r: (a * 180) / Math.PI,
          label: names[i] + '의 넋', kind: 'examine', text: `등을 돌린 아이. 어깨가 떨린다.\n\n${lines[i]}` };
      }),
      { id: 'valve_a', t: 'valve', x: -8.5, z: -6, label: '수문 밸브 (서)', kind: 'coop',
        text: '녹슨 밸브를 돌린다!', coop: { group: 'valve', need: 2 } },
      { id: 'valve_b', t: 'valve', x: 8.5, z: -6, label: '수문 밸브 (동)', kind: 'coop',
        text: '녹슨 밸브를 돌린다!', coop: { group: 'valve', need: 2 } },
      { id: 'water_note', t: 'paper', x: 0, z: 5.2, y: 0.05, label: '바닥의 경고문', kind: 'examine',
        text: '"방공호 배수 - 양쪽 수문 밸브를 함께 열 것"\n\n발밑에 물이 찰랑인다. 물이 점점 차오르고 있다. 댐에 물을 채우기 시작한 걸까.' },
      { id: 'gwimun', t: 'gwimun', x: 0, z: -7.7, label: '귀문(鬼門)', kind: 'lock', req: ['valve_open'],
        lockedText: '귀문 앞이 허리까지 물에 잠겨 있다. 물을 빼야 다가갈 수 있다.',
        text: '피로 그린 문. 진오귀굿을 올리자. 의식의 순서대로 행하라.',
        needItems: ['bell', 'fan', 'shinkal', 'true_talisman', 'attendance'],
        needItemsText: '의식에 필요한 무구가 파티 안에 모두 있지 않다.\n(방울 · 부채 · 신칼 · 완성된 봉인부 · 출석부)',
        lock: { input: 'buttons', buttons: ['신칼 던지기', '이름 부르기', '방울 흔들기', '봉인부 붙이기', '부채 펼치기'], len: 5, answer: ['방울 흔들기', '부채 펼치기', '이름 부르기', '신칼 던지기', '봉인부 붙이기'] },
        wrongScare: true,
        doneText: '귀문이 흔들리고 있다.',
        on: { flag: 'ritual', scare: 'face', sound: 'bell',
          story: T('진오귀굿', `방울이 울리자 일곱 아이가 일제히 고개를 돌렸다.\n부채를 펼치자 귀문 너머로 하얀 길이 열렸다.\n출석부를 펼쳐 이름을 불렀다.\n\n"김영호." "네." "박미숙." "네." "정동수." "…네."\n"한옥자." "네." "오태식." "네." "서말순." "네." "강복동." "네!"\n\n신칼을 던지자 이만석의 비명이 방공호를 울렸다.\n봉인부를 붙이려는 순간 — 귀문이 낮게 물었다.\n\n"…여덟째는 어디 있느냐."`) } },
      { id: 'eighth', t: 'gwimun_core', x: 0, z: -6.9, y: 1.4, label: '귀문의 물음', kind: 'lock', req: ['ritual'], hidden: true,
        text: '귀문이 묻는다. "출석부의 여덟째. 그 이름을 대라." (이름 입력)',
        lock: { input: 'text', answer: ['이순례', '순례'] },
        doneText: '',
        on: { flag: 'eighth', ghost: 'stop', sound: 'bell', toast: '귀문이 닫히기 시작한다' } },
      { id: 'exit', t: 'stairs_up', x: 0, z: 7.2, label: '계단 위로', kind: 'door', req: ['eighth'], to: 'end',
        lockedText: '계단 위에서 이만석이 내려다보고 있다. 아직은 올라갈 수 없다.' },
    ],
    coops: {
      valve: { on: { flag: 'valve_open', sound: 'water', light: 'on', toast: '물이 빠지기 시작한다',
        story: T('수문', `양쪽 밸브가 동시에 돌아가자 굉음과 함께 물이 빠져나갔다.\n\n물이 빠진 바닥에 작은 뼈들이 드러났다. 일곱 사람 분.\n천장의 비상등이 켜졌다. 귀문으로 가는 길이 열렸다.`) } },
    },
    ghost: { type: 'elder', speed: 2.6, sense: 9, teleport: 16, spawn: [0, -5], name: '이장 이만석', auto: true },
    ghosts: [{ type: 'slender', speed: 1.4, sense: 7, teleport: 12, startFlag: 'inner_open', spawn: [-8, -6], name: '얼굴 없는 키다리' }],
    objectives: [
      { until: 'inner_open', text: '방공호 안쪽 철문을 열자', hints: ['계단 옆 서쪽 벽의 손톱 자국을 세어 보자.', '하루 한 줄, 일곱 줄마다 한 묶음: 꽉 찬 묶음 3개 + 6줄.', '7×3+6 = 27'] },
      { until: 'valve_open', text: '방공호의 물을 빼자', hints: ['바닥의 경고문을 읽자.', '양쪽 벽의 수문 밸브를 8초 안에 함께 돌리자.'] },
      { until: 'ritual', text: '귀문 앞에서 진오귀굿을 올리자', hints: ['청솔당의 고백에 적힌 의식 순서를 떠올리자.', '방울 → 부채 → 이름 → 신칼 → 봉인부', '아이들의 유품을 모두 모았는지도 확인하자. (결말이 달라진다)'] },
      { until: 'eighth', text: '귀문의 물음에 답하자', hints: ['출석부 8번.', '이순례'] },
      { until: '__end', text: '계단을 올라 밖으로', hints: ['계단을 클릭하자.'] },
    ],
  },
];

export const ENDINGS = {
  true: T('진 엔딩 · 출석', `"이순례."

이름을 부르자, 계단 위에서 대답이 들렸다.
"…네. 선생님, 저 왔어요."

예순 살이 다 된 이순례가 계단 위에 서 있었다. 편지를 보낸 사람.
그녀는 일곱 친구의 유품을 하나씩 받아 아이들 앞에 내려놓았다.
고무신, 딱지, 머리핀, 팽이, 구슬, 고무줄, 이름표.

"미안해. 나만 살아서 미안해. 늦게 와서 미안해."

아이들이 하나씩 일어나 순례를 안았다.
그리고 손을 잡고, 하얀 길을 따라 귀문 너머로 걸어갔다.
맨 뒤에서 젊은 선생님이 돌아보며 고개를 숙였다.

봉인부가 귀문에 붙자, 문은 그냥 낡은 콘크리트 벽이 되었다.

새벽 다섯 시. 댐의 수문이 열렸다.
서하리는 천천히, 조용히 물에 잠겼다.
이번에는 아무도 그 아래에 남아 있지 않았다.

─ 심야방송 「귀문」 편, 영상은 끝내 업로드되지 않았다.
   편집 프로그램을 열 때마다, 마지막 장면에 아이 여덟이 손을 흔들고 있었기 때문이다.`),
  normal: T('엔딩 · 미완의 출석', `"이순례."

귀문이 닫혔다. 아이들은 하얀 길로 걸어 들어갔다.
이만석의 비명이 문틈으로 빨려 들어가 사라졌다.

그런데 — 몇몇 아이가 문 앞에서 멈춰 돌아보았다.
"내 거… 내 물건은?"

유품을 모두 찾지 못한 아이들은 끝내 문을 넘지 못했다.
봉인부가 붙고, 문은 벽이 되었다. 아이들은 벽 이쪽에 남았다.

새벽, 댐의 수문이 열렸다.

서울로 돌아가는 첫차 버스.
당신들 뒷자리에서, 아이 목소리가 속삭인다.

"…술래, 아직 다 안 찾았잖아."

(아이들의 유품을 모두 모으면 다른 결말을 볼 수 있다)`),
};
