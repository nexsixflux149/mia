// 아이템 정의. use: 'flashlight' | 'talisman' | 'read' | null
export const ITEMS = {
  flashlight: { name: '손전등', icon: '🔦', use: 'flashlight', desc: '심야방송 크루의 장비. 배터리는 충분하다... 아마도.' },
  jang_eye: { name: '나무 눈알', icon: '🌰', use: null, desc: '나무를 깎아 만든 장승의 눈알. 눈동자가 손때로 반들반들하다.' },
  tube: { name: '진공관', icon: '💡', use: null, desc: '구형 라디오용 진공관. 아직 쓸 만해 보인다.' },
  envelope: { name: '돈봉투', icon: '✉️', use: 'read', desc: '두툼한 돈봉투.', read: '겉면: "박 소사 — 입단속 값. 이만석"\n\n안에는 1979년 지폐 삼만 원과 쪽지 한 장.\n"그날 숙직실 근처에 아무도 못 오게 하게. 끝나면 방공호 문을 시멘트로 바르게."' },
  seal: { name: '이장의 도장', icon: '🔏', use: null, desc: '"李萬石" 이라고 새겨진 상아 도장. 붉은 인주가 굳어 있다.' },
  crank: { name: '도르래 손잡이', icon: '⚙️', use: null, desc: '녹슨 쇠손잡이. 우물 도르래에 끼우는 것이다.' },
  stone: { name: '조약돌', icon: '🪨', use: null, desc: '차갑고 매끈한 조약돌. 서낭당에 올리는 돌이다.' },
  attendance: {
    name: '출석부', icon: '📒', use: 'read', desc: '1979년 서하분교 3학년 출석부.',
    read: `【 1979학년도 서하분교 3학년 출석부 · 담임 윤서희 】

1번 김영호  ─ 11/7  ○
2번 박미숙  ─ 11/7  ○
3번 정동수  ─ 11/7  ○
4번 한옥자  ─ 11/7  ○
5번 오태식  ─ 11/7  ○
6번 서말순  ─ 11/7  ○
7번 강복동  ─ 11/7  ○ (일직)
8번 이순례  ─ 11/7  / (결석)

11월 8일부터의 칸은 모두 빨간 줄로 그어져 있다.
맨 아래, 떨리는 글씨: "내일도 모두 출석하기를."`
  },
  locker_key: { name: '사물함 열쇠', icon: '🗝️', use: null, desc: '녹슨 작은 열쇠. 꼬리표에 "7"이라고 적혀 있다.' },
  drawing: {
    name: '찢어진 그림', icon: '🖍️', use: 'read', desc: '크레파스 그림.',
    read: `크레파스로 그린 그림이다. 제목: 「숨바꼭질」 - 강복동

교실이 그려져 있다. 선생님(긴 머리)이 눈을 가리고 숫자를 센다.
아이들은 저마다 숨었다. 커튼 뒤, 난로 옆...
그리고 교실 뒤쪽 청소함 안에 웅크린 아이 하나. 그 아이만 얼굴이 새까맣게 칠해져 있다.

그림 아래쪽은 찢겨 나갔다. 남은 부분에 우물과, 땅속으로 이어지는 계단이 보인다.
뒷면: "선생님 이번엔 아무도 못 찾을 거예요. 이장님이 좋은 데 숨겨준대요."`
  },
  fuse: { name: '퓨즈', icon: '🔌', use: null, desc: '구형 두꺼비집용 퓨즈. 아직 쓸 만해 보인다.' },
  pills: {
    name: '약병', icon: '💊', use: 'read', desc: '갈색 유리 약병.',
    read: `라벨: "취침 보조제 - 소아용 - 7병"
처방: 서하리 이장 이만석 (보건지소 직인 없음)

병 안쪽에 하얀 가루가 말라붙어 있다.
아이들에게 '건강검진'이라며 먹인 것은... 이것이었다.`
  },
  talisman: { name: '부적', icon: '📜', use: 'talisman', desc: '누렇게 바랜 벽사(辟邪) 부적. 사용하면 귀신을 잠시 물리친다. (1회용)' },
  night_key: { name: '숙직실 열쇠', icon: '🔑', use: null, desc: '"숙직" 이라고 새겨진 열쇠. 바깥으로 이어지는 문 열쇠다.' },
  ledger: {
    name: '이장의 장부', icon: '📕', use: 'read', desc: '이만석의 비밀 장부.',
    read: `【 기미년(1979) 동네 일 - 이만석 】

8월 - 역병 돈다. 윗말 아이 둘 죽음. 가뭄으로 논 다 탐.
9월 - 청솔당 보살 불러 점을 봄. 귀문(鬼門)이 열렸다 함.
      "동자(童子) 일곱을 문에 바쳐야 닫힌다."
10월 - 동네 어른들 모여 합의. 아무도 말 안 하기로 함.
      분교 아이가 여덟. 하나는 빼기로 함.
      내 딸 순례는 뺀다. 그날 감기로 집에 둔다.
      청솔당에 쌀 열 섬. 소사 박가에게 돈 삼만 원.
11월 7일 - 건강검진이라 하고 약 먹임. 방공호 문 막음.
      윤 선생이 알아채고 막음. 어쩔 수 없었다. 우물.
11월 9일 - 비가 옴. 역병이 그침. 내가 옳았다.

마지막 장, 다른 잉크: "순례가 밤마다 친구들이 부른다고 운다."`
  },
  diary: {
    name: '윤서희의 일기', icon: '📔', use: 'read', desc: '물에 젖어 쭈글쭈글한 일기장.',
    read: `【 윤서희 선생의 일기 】

10월 30일 - 이장님이 아이들 건강검진을 숙직실에서 하자신다.
양호 선생도 없는데. 무당 청솔당이 학교 근처를 자꾸 서성인다.

11월 5일 - 순례가 말했다. "아빠가 나는 그날 학교 가지 말래요."
그날이 무슨 날인데? 등골이 서늘하다.

11월 7일 - 2시 47분. 아이들이 숙직실로 불려 갔다. 따라가 봐야겠다.

(그 뒤 몇 장은 물에 번져 읽을 수 없다. 마지막 장은 손톱으로 긁어 쓴 글씨다.)

"나는 우물 속에 있다. 아이들은 땅 밑에 있다.
 누구든 이 글을 읽는다면, 내 이름을 당산나무에 걸어 줘.
 이름이 걸리면 나는 다시 아이들 곁으로 갈 수 있어.
 그리고 도망쳐. 그 사람이 아직 마을을 지키고 있어."`
  },
  shinkal: { name: '신칼', icon: '🗡️', use: null, desc: '무당의 의식용 칼. 오색 천이 달려 있다.' },
  bell: { name: '방울', icon: '🔔', use: null, desc: '무당의 칠성방울. 흔들지 않아도 가끔 울린다.' },
  fan: { name: '부채', icon: '🪭', use: null, desc: '삼불제석이 그려진 무당 부채.' },
  talisman_blank: { name: '미완성 부적', icon: '📃', use: null, desc: '글씨가 반만 그려진 부적. 붉은 안료가 필요하다. (다른 아이템과 조합)' },
  cinnabar: { name: '경면주사', icon: '🟥', use: null, desc: '부적을 그리는 붉은 광물 가루. (다른 아이템과 조합)' },
  true_talisman: { name: '완성된 봉인부', icon: '✴️', use: 'read', desc: '귀문을 닫는 봉인 부적.', read: '붉은 글씨가 아직 마르지 않은 것처럼 번들거린다.\n"鬼門封" — 귀문을 봉한다.' },
  relic_1: { name: '박미숙의 고무신', icon: '👟', use: null, relic: true, desc: '작은 꽃고무신 한 짝. 안쪽에 "2번 박미숙".' },
  relic_2: { name: '강복동의 딱지', icon: '🃏', use: null, relic: true, desc: '달력 종이로 접은 딱지. "7번 강복동 일직".' },
  relic_3: { name: '한옥자의 머리핀', icon: '🎀', use: null, relic: true, desc: '빨간 리본 머리핀. 머리카락이 엉켜 있다.' },
  relic_4: { name: '정동수의 팽이', icon: '🌀', use: null, relic: true, desc: '손으로 깎은 나무팽이. 줄은 피로 검게 굳어 있다.' },
  relic_5: { name: '오태식의 유리구슬', icon: '🔮', use: null, relic: true, desc: '푸른 유리구슬. 안에서 물소리가 난다.' },
  relic_6: { name: '서말순의 고무줄', icon: '➰', use: null, relic: true, desc: '노란 고무줄. 아직도 탄력이 있다.' },
  relic_7: { name: '김영호의 이름표', icon: '🏷️', use: null, relic: true, desc: '"3학년 1번 김영호" 가슴 이름표. 반장 배지가 달려 있다.' },
  // ── 시나리오 2: 오필리아호
  morse_card: { name: '모스 부호표', icon: '📡', use: 'read', desc: '보트 창고 벽에 꽂혀 있던 모스 부호표.', read: `【 국제 모스 부호 】  ( · 짧게   − 길게 )

A ·−      B −···    C −·−·    D −··     E ·       F ··−·
G −−·     H ····    I ··      J ·−−−    K −·−     L ·−··
M −−      N −·      O −−−     P ·−−·    Q −−·−    R ·−·
S ···     T −       U ··−     V ···−    W ·−−     X −··−
Y −·−−    Z −−··

1 ·−−−−   2 ··−−−   3 ···−−   4 ····−   5 ·····
6 −····   7 −−···   8 −−−··   9 −−−−·   0 −−−−−

글자 사이는 잠깐 쉰다. 단어 사이는 길게 쉰다.` },
  uv_lamp: { name: '자외선 램프', icon: '🟣', use: null, desc: '보라색 빛이 나오는 감식용 램프. 가지고 있으면 숨은 글씨를 살펴볼 때 자동으로 비춘다.' },
  contract: { name: '보험 계약서', icon: '📄', use: 'read', desc: '선장 금고에서 나온 서류.', read: `【 런던 해상보험 — 오필리아호 화물 보험 계약서 】

화물: 금괴 6상자 (상자당 20kg)
보험 금액: 금 120kg 상당

계약서 뒷면, 선장 크로우의 메모:
"진짜 금은 없다. 여섯 상자 중 왕관 도장 상자 하나에만 승객들 귀중품을 모아 둔다.
 나머지 다섯은 닻 도장 — 모래.
 흑등도 등대지기에게는 이미 돈을 주었다. 11월 9일 밤, 불은 꺼진다.
 승객들은 3등칸에 가둔다. 증인은 남기지 않는다."` },
  crowbar: { name: '쇠지렛대', icon: '🔧', use: null, desc: '녹슨 쇠지렛대. 못 박힌 상자를 비틀어 열 수 있다.' },
  ship_relic_1: { name: '젖은 승선권', icon: '🎫', use: null, relic: true, desc: '「SS OPHELIA · 3등실 3호 · 릴리 에번스(7)」' },
  ship_relic_2: { name: '릴리의 리본', icon: '🎀', use: null, relic: true, desc: '하늘색 머리 리본. 바닷물에 젖어 있다.' },
  ship_relic_3: { name: '한서진의 헤드폰', icon: '🎧', use: null, relic: true, desc: '무전사의 헤드폰. 귀에 대면 아직 신호음이 들린다.' },
  ship_relic_4: { name: '김씨 가족사진', icon: '🖼️', use: null, relic: true, desc: '다섯 식구의 흑백사진. 뒷면: "부산에서 새 출발"' },
  ship_relic_5: { name: '메리의 결혼반지', icon: '💍', use: null, relic: true, desc: '안쪽에 새겨진 글: "H. & M. 1915.9.15" — 선장 아내의 반지.' },

  // ── 시나리오 3: 하트웰 저택
  mb_key: { name: '오르골 태엽 열쇠', icon: '🗝️', use: null, desc: '괘종시계 안에서 나온 작은 태엽 열쇠.' },
  doll_head: { name: '인형 머리', icon: '🎎', use: null, desc: '금발에 하늘색 리본. 눈을 떴다 감았다 한다. (다른 부품과 조합)' },
  doll_body: { name: '인형 몸통', icon: '👗', use: null, desc: '하늘색 원피스를 입은 머리 없는 인형 몸통. (조합)' },
  doll_arms: { name: '인형 팔', icon: '🦾', use: null, desc: '정교한 도자기 팔 한 쌍. (조합)' },
  doll_torso: { name: '팔 없는 인형', icon: '🪆', use: null, desc: '머리와 몸통을 붙였다. 팔이 없다. (조합)' },
  mended_doll: { name: '완성된 클라라 인형', icon: '🧸', use: null, desc: '머리, 몸, 팔을 모두 붙인 인형. 안으면 심장 뛰는 소리가 난다.' },
  stair_key: { name: '계단 열쇠', icon: '🔑', use: null, desc: '인형의 집 지붕에서 나온 작은 열쇠.' },
  scissors: { name: '재단 가위', icon: '✂️', use: null, desc: '하트웰의 재단 가위. 손잡이에 붉은 실이 감겨 있다.' },
  name_tags: { name: '아이들의 이름표', icon: '📛', use: 'read', desc: '고아원 아이들의 이름표 다섯 장.', read: '성 요셉 고아원\n\n  앤 · 토미 · 수지 · 피터 · 메이\n\n이름표 뒷면마다 같은 글씨: "집에 가고 싶어요"' },
  doll_relic_1: { name: '앤의 머리끈', icon: '🎗️', use: null, relic: true, desc: '"Anne" 이라고 수놓인 리본 머리끈.' },
  doll_relic_2: { name: '토미의 양철 병정', icon: '💂', use: null, relic: true, desc: '밑바닥에 "Tommy" 라고 새겨진 양철 병정.' },
  doll_relic_3: { name: '수지의 크레용', icon: '🖍️', use: null, relic: true, desc: '몽당 크레용. "Suzy" 라고 이름이 새겨져 있다.' },
  doll_relic_4: { name: '피터의 우표', icon: '📮', use: null, relic: true, desc: '영국 우표 한 장. 뒷면: "언젠가 영국에 가 볼 거야 — 피터"' },
  doll_relic_5: { name: '메이의 은반지', icon: '💍', use: null, relic: true, desc: '안쪽에 "May" 라고 새겨진 작은 은반지.' },

  // ── 시나리오 4: 백야 요양병원
  ward_card: { name: '7병동 출입 카드', icon: '💳', use: null, desc: '그을린 플라스틱 카드. "백야요양병원 7병동 — 관계자 외 출입 금지"' },
  morgue_key: { name: '영안실 열쇠', icon: '🗝️', use: null, desc: '묵직한 쇠 열쇠. 꼬리표: "지하 영안실 — 원장 외 출입 금지"' },
  patient_list: { name: '7병동 환자 명부', icon: '📋', use: 'read', desc: '다섯 이름 위에 검은 줄이 그어진 명부.', read: `【 7병동 입원 환자 명부 · 1994.12.24 】

  701  김순자
  702  박철민
  703  이정희
  704  최만수
  705  한예린

이름마다 검은 줄. 원장의 메모: "수면 치료 완료 — 기록 말소"
그런데 줄 아래로 이름들이 아직 희미하게 보인다.` },
  hosp_relic_1: { name: '김순자의 화투패', icon: '🎴', use: null, relic: true, desc: '닳고 닳은 화투 한 벌. "심심하면 나랑 한 판 해 — 701호"' },
  hosp_relic_2: { name: '박철민의 양철 로봇', icon: '🤖', use: null, relic: true, desc: '태엽 로봇 장난감. 등에 "702 박철민 (9살)"' },
  hosp_relic_3: { name: '이정희의 뜨개 목도리', icon: '🧣', use: null, relic: true, desc: '뜨다 만 분홍 목도리. "하은이 크리스마스 선물"' },
  hosp_relic_4: { name: '최만수의 이어폰', icon: '🎧', use: null, relic: true, desc: '반창고가 감긴 이어폰 한 쪽. "최만수 거. 만지지 마"' },
  hosp_relic_5: { name: '한예린의 일기장', icon: '📔', use: null, relic: true, desc: '그을린 일기장. 마지막 장: "이제 일어나도 돼"' },

  // ── 시나리오 5: 반딧불 캠프
  matches: { name: '성냥갑', icon: '🔥', use: null, desc: '관리소 서랍의 성냥갑. "반딧불 수련원" 로고가 찍혀 있다.' },
  boat_key: { name: '보트 열쇠', icon: '🔑', use: null, desc: '녹슨 작은 열쇠. 열쇠고리에 나무 물고기가 달려 있다.' },
  camp_relic_1: { name: '서연의 나비 머리핀', icon: '🦋', use: null, relic: true, desc: '반짝이는 나비 머리핀. 뒷면에 "서연" 스티커.' },
  camp_relic_2: { name: '지호의 호루라기', icon: '📯', use: null, relic: true, desc: '은색 호루라기. 줄에 "지호" 이름표.' },
  camp_relic_3: { name: '민재의 곤충 채집통', icon: '🫙', use: null, relic: true, desc: '"민재의 곤충 채집통 — 반딧불 잡으면 놔주기!"' },
  camp_relic_4: { name: '하늘의 운동화', icon: '👟', use: null, relic: true, desc: '젖은 운동화 한 짝. 끈에 "하늘" 이름표.' },

  // ── 시나리오 6: 레드 메사
  sheriff_log: { name: '보안관 일지', icon: '📓', use: 'read', desc: '보안관 콜 브래디의 일지.', read: `【 보안관 일지 · 콜 브래디 】

1887년 6월 6일.
오후 3시 10분, 은행 금고가 털렸다.
밴스 씨는 떠돌이 잭 모로우를 범인으로 지목했고, 증인 넷이 모두 잭을 보았다고 했다.

…나는 그 시각 살롱에서 잭이 하모니카를 불고 있던 것을 보았다.
그러나 아무 말도 하지 않았다. 밴스 씨에게 진 빚이 너무 많았다.

해 질 녘, 잭은 교수대에 섰다.
신이여, 나를 용서하지 마소서.` },
  church_key: { name: '교회 열쇠', icon: '⛪', use: null, desc: '언덕 위 교회 뒷문 열쇠. 은행 금고에 들어 있었다.' },
  mine_key: { name: '광산 열쇠', icon: '🗝️', use: null, desc: '녹슨 쇠 열쇠. 꼬리표: "레드 메사 은광 — 관계자 외 출입 금지"' },
  west_relic_1: { name: '잭의 하모니카', icon: '🎵', use: null, relic: true, desc: '낡은 하모니카. 손잡이에 "J.M.", 안쪽에 작은 글씨로 "To my ROSE"' },
  west_relic_2: { name: '행운의 스페이드 에이스', icon: '🂡', use: null, relic: true, desc: '뒷면에 "행운의 카드 — 잭"' },
  west_relic_3: { name: '잭의 회중시계', icon: '⌚', use: null, relic: true, desc: '오후 3시 10분에 멈춘 회중시계. 그 시각 그는 살롱에 있었다.' },
  west_relic_4: { name: '로즈에게 보내는 편지', icon: '✉️', use: null, relic: true, desc: '끝내 부치지 못한 아버지의 편지.' },
  west_relic_5: { name: '잭의 카우보이 모자', icon: '🤠', use: null, relic: true, desc: '안쪽에 "J.M." 이라고 수놓인 낡은 모자.' },

  // ── 시나리오 7: 츠바키야
  inn_key: { name: '여관 열쇠', icon: '🔑', use: null, desc: '동백 문양이 새겨진 놋쇠 열쇠. "츠바키야"' },
  hall_key: { name: '연회장 열쇠', icon: '🗝️', use: null, desc: '붉은 술이 달린 별관 연회장 열쇠.' },
  sake_cups: { name: '혼례 술잔 세 개', icon: '🍶', use: null, desc: '크기가 다른 붉은 칠기 잔 세 개. 혼례 의식(산산쿠도)에 쓴다.' },
  kura_key: { name: '창고 열쇠', icon: '🗝️', use: null, desc: '별채 흙벽 창고(쿠라)의 묵직한 열쇠.' },
  well_rope: { name: '두레박줄', icon: '🪢', use: null, desc: '긴 두레박줄. 우물에 쓸 수 있다.' },
  kimono_relic_1: { name: '유키의 부적 주머니', icon: '🧧', use: null, relic: true, desc: '빛바랜 오마모리. "유키 — 무사히"' },
  kimono_relic_2: { name: '유키의 나막신', icon: '🩴', use: null, relic: true, desc: '붉은 끈의 게타 한 짝. 안쪽에 "유키"' },
  kimono_relic_3: { name: '동백 접부채', icon: '🪭', use: null, relic: true, desc: '먹으로 동백을 그린 부채. "하루가 그려 준 부채"' },
  kimono_relic_4: { name: '동백 비녀', icon: '🌺', use: null, relic: true, desc: '붉은 동백 장식이 달린 간자시.' },
  kimono_relic_6: { name: '유키의 혼례 머리쓰개', icon: '👰', use: null, relic: true, desc: '하얀 비단 츠노카쿠시. 끝내 한 번도 써 보지 못했다.' },
  kimono_relic_5: { name: '하루의 편지 다발', icon: '💌', use: null, relic: true, desc: '"올해도 왔어, 유키." 매년 동백이 질 때마다 쓴 편지들.' },
};

// ── 새 챕터 아이템
Object.assign(ITEMS, {
  antidote: { name: '백야정 해독제', icon: '💉', use: null, desc: '갈색 앰풀 다섯 개. "투여 금지 (원장 지시)". 해독제는 처음부터 있었다.' },
  battery: { name: '건전지 두 개', icon: '🔋', use: null, desc: '무전기에서 나온 새 건전지. 캠코더에 맞을 것 같다.' },
});
// ── 해피니스 랜드
Object.assign(ITEMS, {
  park_ticket: { name: '해피니스 랜드 입장권', icon: '🎫', use: null, desc: '2006년 7월 7일 날짜가 찍힌 입장권. 회전문에 넣을 수 있다.' },
  pjs_letter: { name: '박정수의 편지', icon: '✉️', use: null, desc: '"11시 50분, 회장님 차가 거울 미궁 쪽에서 크레인을 불렀습니다."' },
  park_relic_1: { name: '지우의 별 머리끈', icon: '⭐', use: null, relic: true, desc: '반짝이는 별 모양 머리끈. 꼬리표 "1번 김지우".' },
  park_relic_2: { name: '도현이의 야구모자', icon: '🧢', use: null, relic: true, desc: '챙 안쪽에 "2번 이도현". 노란 말 안장 위에 있었다.' },
  park_relic_3: { name: '서아의 크레파스', icon: '🖍️', use: null, relic: true, desc: '몽당 크레파스 한 통. 안에 "비밀 미궁 생일 파티" 그림.' },
  park_relic_4: { name: '준호의 게임기', icon: '🎮', use: null, relic: true, desc: '마지막 저장 21:41 — "미궁 탈출 연습".' },
  park_relic_5: { name: '하린이의 풍선 팔찌', icon: '🎈', use: null, relic: true, desc: '분홍 풍선 모양 팔찌. 안쪽에 "5번 정하린".' },
  park_relic_6: { name: '민규의 호루라기', icon: '📯', use: null, relic: true, desc: '입에 물던 자리가 닳았다. 숨바꼭질 끝을 알리는 호루라기.' },
  park_relic_7: { name: '태민이의 생일 초대장', icon: '👑', use: null, relic: true, desc: '"거울 미궁 비밀 개장! 7월 7일 밤 9시 반 — 술래는 나. 문은 내가 잠근다!"' },
});
// ── 삐에로 (블루문 서커스)
Object.assign(ITEMS, {
  tent_key: { name: '거울의 집 열쇠', icon: '🗝️', use: null, desc: '곰인형 배 속에서 나온 열쇠. 꼬리표: "거울의 집 — 단장 외 출입 금지"' },
  trapeze_hook: { name: '공중그네 갈고리', icon: '🪝', use: null, desc: '곡예용 쇠갈고리. 손잡이에 "리나" 각인. 높은 곳에 닿을 수 있다.' },
  ledger: { name: '단장의 이중장부', icon: '📒', use: null, desc: '검은 가죽 장부. "화재보험 가입 — 보험금 3억", "광대 녀석의 입을 막아야 한다."' },
  insurance: { name: '화재보험 증권', icon: '📜', use: null, desc: '1998년 12월 1일 가입, 수익자 마르코. 봉투에 "24일 밤 10시. 관객 다 빠지면."' },
  lighter: { name: '금장 라이터', icon: '🔥', use: null, desc: '녹아내린 기름통 사이에서 주운 라이터. 뚜껑에 "M." 각인.' },
  clown_relic_1: { name: '은별의 반쪽 입장권', icon: '🎟️', use: null, relic: true, desc: '맨 앞줄 7번. 뒷면에 "은별 — 뽀삐 아저씨 보러 옴!"' },
  clown_relic_2: { name: '은별의 별 머리띠', icon: '⭐', use: null, relic: true, desc: '반짝이는 별 모양 머리띠. 안쪽에 "한은별" 스티커.' },
  clown_relic_3: { name: '토끼 인형 깡총이', icon: '🐰', use: null, relic: true, desc: '한쪽 귀가 그을린 토끼 인형. "레오야 무서워하지 마."' },
  clown_relic_4: { name: '은별의 크레용 그림', icon: '🖍️', use: null, relic: true, desc: '빨간 코 삐에로와 여자아이. "뽀삐 아저씨랑 나 ♥"' },
  clown_relic_5: { name: '뽀삐의 빨간 코', icon: '🔴', use: null, relic: true, desc: '빨간 고무 코. "은별이 거 — 빌려준 것. 앵콜 때 돌려받기!"' },
  clown_relic_6: { name: '오르골 태엽 열쇠', icon: '🎠', use: null, relic: true, desc: '작은 태엽 열쇠. 리본에 "은별 ★ 8살"' },
  clown_relic_7: { name: '꼬마 단원 이름표', icon: '📛', use: null, relic: true, desc: '"한은별 — 사라지는 상자 담당". 뒤에 반쯤 탄 쪽지.' },
});

export const RECIPES = [
  { a: 'doll_head', b: 'doll_body', out: 'doll_torso', flag: 'torso', text: '머리를 몸통에 끼우자 인형의 목이 "딸깍" 소리를 내며 저절로 돌아갔다. 당신 쪽으로.' },
  { a: 'doll_torso', b: 'doll_arms', out: 'mended_doll', flag: 'mended_doll_made', text: '팔을 끼우자 인형이 당신의 손가락을 꼭 쥐었다. 그리고 놓지 않았다.\n(인형의 집에 눕혀 주자)' },
  { a: 'talisman_blank', b: 'cinnabar', out: 'true_talisman', flag: 'talisman_done', text: '경면주사로 부적의 나머지 획을 그었다. 마지막 획을 긋는 순간, 신당의 모든 촛불이 동시에 꺼졌다가 켜졌다.' },
];

export const START_ITEMS = ['flashlight'];
