// 방탈출 시나리오 목록. 새 시나리오는 여기에 추가한다.
import { CHAPTERS, ENDINGS } from './chapters.js';
import { SHIP_CHAPTERS, SHIP_ENDINGS } from './ship.js';
import { DOLL_CHAPTERS, DOLL_ENDINGS } from './doll.js';
import { HOSPITAL_CHAPTERS, HOSPITAL_ENDINGS } from './hospital.js';
import { CAMP_CHAPTERS, CAMP_ENDINGS } from './camp.js';
import { WEST_CHAPTERS, WEST_ENDINGS } from './west.js';
import { KIMONO_CHAPTERS, KIMONO_ENDINGS } from './kimono.js';
import { CLOWN_CHAPTERS, CLOWN_ENDINGS } from './clown.js';
import { PARK_CHAPTERS, PARK_ENDINGS } from './park.js';
import { MIA_CHAPTERS, MIA_ENDINGS } from './mia.js';
import { ZOMBIE_CHAPTERS, ZOMBIE_ENDINGS } from './zombie.js';
import { ITEMS } from './items.js';

export const SCENARIOS = {
  // 처음 온 사람을 위한 짧은 입문 테마 — 목록 맨 앞, 기본 선택
  mia: {
    id: 'mia', title: '미아 — 달빛 문방구의 숨바꼭질 (입문)', short: '달빛 문방구',
    desc: '입문 · 골목 문방구 · 조작을 하나씩 배워요 · 3챕터 · 약 20~30분', difficulty: 1,
    chapters: MIA_CHAPTERS, endings: MIA_ENDINGS,
    relics: ['mia_relic_1', 'mia_relic_2', 'mia_relic_3'], relicName: '미아의 물건',
    cine: { intro: 'mia_intro', true: 'mia_true', normal: 'mia_normal' },
    saveKey: (name) => 'mia:' + name,
    carry: () => [],
    startItems: () => ['talisman', 'talisman'],
  },
  gwimun: {
    id: 'gwimun', title: '귀문 — 서하리 분교 실종사건', short: '귀문',
    desc: '한국 괴담 · 폐분교 · 7챕터 · 약 4~5시간', difficulty: 5,
    chapters: CHAPTERS, endings: ENDINGS,
    relics: ['relic_1', 'relic_2', 'relic_3', 'relic_4', 'relic_5', 'relic_6', 'relic_7'], relicName: '유품',
    cine: { intro: 'prologue', true: 'ending_true', normal: 'ending_normal' },
    saveKey: (name) => name, // 예전 저장과 호환
    carry: (ch) => [...(ch >= 2 ? ['attendance'] : []), ...(ch >= 6 ? ['shinkal', 'bell', 'fan', 'true_talisman'] : [])],
    startItems: (ch) => (ch >= 2 ? ['talisman'] : []),
  },
  ophelia: {
    id: 'ophelia', title: '오필리아호의 마지막 항해', short: '오필리아호',
    desc: '유령선 · 등대 · 모스 부호 · 4챕터 · 약 2~3시간', difficulty: 4,
    chapters: SHIP_CHAPTERS, endings: SHIP_ENDINGS,
    relics: ['ship_relic_1', 'ship_relic_2', 'ship_relic_3', 'ship_relic_4', 'ship_relic_5'], relicName: '승객의 유품',
    cine: { intro: 'ship_intro', true: 'ship_true', normal: 'ship_normal' },
    saveKey: (name) => 'ophelia:' + name,
    carry: (ch) => [...(ch >= 1 ? ['morse_card'] : []), ...(ch >= 3 ? ['contract'] : [])],
    startItems: () => ['talisman'],
  },
  doll: {
    id: 'doll', title: '인형의 집 — 하트웰 저택', short: '인형의 집',
    desc: '저주받은 인형 · 서양 저택 · 위자보드 · 4챕터 · 약 2~3시간', difficulty: 3,
    chapters: DOLL_CHAPTERS, endings: DOLL_ENDINGS,
    relics: ['doll_relic_1', 'doll_relic_2', 'doll_relic_3', 'doll_relic_4', 'doll_relic_5'], relicName: '아이들의 유품',
    cine: { intro: 'doll_intro', true: 'doll_true', normal: 'doll_normal' },
    saveKey: (name) => 'doll:' + name,
    carry: (ch) => [...(ch >= 2 ? ['mb_key', 'scissors'] : []), ...(ch >= 3 ? ['name_tags'] : [])],
    startItems: () => ['talisman'],
  },
  hospital: {
    id: 'hospital', title: '백야 요양병원 — 7병동의 밤', short: '백야 요양병원',
    desc: '폐병원 · 수면 치료 · 화재의 밤 · 4챕터 · 약 2~2.5시간', difficulty: 4,
    chapters: HOSPITAL_CHAPTERS, endings: HOSPITAL_ENDINGS,
    relics: ['hosp_relic_1', 'hosp_relic_2', 'hosp_relic_3', 'hosp_relic_4', 'hosp_relic_5'], relicName: '환자들의 유품',
    cine: { intro: 'hosp_intro', true: 'hosp_true', normal: 'hosp_normal' },
    saveKey: (name) => 'hospital:' + name,
    carry: (ch) => (ch >= 2 ? ['morgue_key'] : []),
    startItems: () => ['talisman'],
  },
  camp: {
    id: 'camp', title: '반딧불 캠프 — 마지막 캠프파이어', short: '반딧불 캠프',
    desc: '여름 캠프 · 숲과 호수 · 입문용 · 4챕터 · 약 1.5~2시간', difficulty: 2,
    chapters: CAMP_CHAPTERS, endings: CAMP_ENDINGS,
    relics: ['camp_relic_1', 'camp_relic_2', 'camp_relic_3', 'camp_relic_4'], relicName: '아이들의 물건',
    cine: { intro: 'camp_intro', true: 'camp_true', normal: 'camp_normal' },
    saveKey: (name) => 'camp:' + name,
    carry: (ch) => [...(ch >= 1 ? ['matches'] : []), ...(ch >= 2 ? ['boat_key'] : [])],
    startItems: () => ['talisman'],
  },
  west: {
    id: 'west', title: '레드 메사 — 교수대 마을', short: '레드 메사',
    desc: '서부 웨스턴 · 유령 마을 · 누명 · 4챕터 · 약 2~3시간', difficulty: 3,
    chapters: WEST_CHAPTERS, endings: WEST_ENDINGS,
    relics: ['west_relic_1', 'west_relic_2', 'west_relic_3', 'west_relic_4', 'west_relic_5'], relicName: '잭의 유품',
    cine: { intro: 'west_intro', true: 'west_true', normal: 'west_normal' },
    saveKey: (name) => 'west:' + name,
    carry: (ch) => (ch >= 1 ? ['sheriff_log'] : []),
    startItems: () => ['talisman'],
  },
  kimono: {
    id: 'kimono', title: '츠바키야 — 붉은 동백의 밤', short: '츠바키야',
    desc: '일본풍 여관 · 기모노 · 혼례의 밤 · 4챕터 · 약 2~3시간', difficulty: 4,
    chapters: KIMONO_CHAPTERS, endings: KIMONO_ENDINGS,
    relics: ['kimono_relic_1', 'kimono_relic_2', 'kimono_relic_3', 'kimono_relic_6', 'kimono_relic_4', 'kimono_relic_5'], relicName: '유키의 유품',
    cine: { intro: 'kimono_intro', true: 'kimono_true', normal: 'kimono_normal' },
    saveKey: (name) => 'kimono:' + name,
    carry: () => [],
    startItems: () => ['talisman'],
  },
  clown: {
    id: 'clown', title: '삐에로 — 블루문 서커스의 마지막 앵콜', short: '삐에로',
    desc: '폐유원지 · 서커스 · 누명 · 7챕터 · 난이도 최상 · 약 4~5시간', difficulty: 6,
    chapters: CLOWN_CHAPTERS, endings: CLOWN_ENDINGS,
    relics: ['clown_relic_1', 'clown_relic_2', 'clown_relic_3', 'clown_relic_4', 'clown_relic_5', 'clown_relic_6', 'clown_relic_7'], relicName: '은별의 물건',
    cine: { intro: 'clown_intro', true: 'clown_true', normal: 'clown_normal' },
    saveKey: (name) => 'clown:' + name,
    carry: (ch) => [...(ch >= 3 && ch <= 4 ? ['trapeze_hook'] : []), ...(ch >= 3 ? ['ledger'] : []), ...(ch >= 4 ? ['insurance'] : []), ...(ch >= 6 ? ['lighter'] : [])],
    startItems: () => ['talisman', 'talisman'],
  },
  park: {
    id: 'park', title: '해피니스 랜드 — 폐장하지 않는 밤', short: '해피니스 랜드',
    desc: '폐놀이공원 · 움직이는 놀이기구 · 3중 반전 · 10챕터 · 끝판왕 · 약 5~6시간', difficulty: 6,
    chapters: PARK_CHAPTERS, endings: PARK_ENDINGS,
    relics: ['park_relic_1', 'park_relic_2', 'park_relic_3', 'park_relic_4', 'park_relic_5', 'park_relic_6', 'park_relic_7'], relicName: '아이들의 물건',
    cine: { intro: 'park_intro', true: 'park_true', normal: 'park_normal' },
    saveKey: (name) => 'park:' + name,
    carry: () => [],
    startItems: () => ['talisman', 'talisman', 'talisman'],
  },
  // 히든 테마: 모든 테마를 한 번씩 깨거나 만렙이 되면 열린다 (서버가 확인)
  zombie: {
    id: 'zombie', title: '데드 시티 — 마지막 헬기 (히든)', short: '데드 시티', hidden: true,
    desc: '히든 · 좀비 도시 → 백화점 5층 → 옥상 헬기 탈출 · 7챕터 · 역대급 퍼즐 · 약 4~5시간', difficulty: 6,
    chapters: ZOMBIE_CHAPTERS, endings: ZOMBIE_ENDINGS,
    relics: ['zb_relic_1', 'zb_relic_2', 'zb_relic_3', 'zb_relic_4', 'zb_relic_5', 'zb_relic_6', 'zb_relic_7'], relicName: '하린이의 흔적',
    cine: { intro: 'zombie_intro', true: 'zombie_true', normal: 'zombie_normal' },
    saveKey: (name) => 'zombie:' + name,
    carry: () => [],
    startItems: () => ['talisman', 'talisman', 'talisman'],
  },
};

// ───── 숨겨진 이야기 퍼즐: 기존 테마마다 새 방식의 선택 퍼즐 하나 (풀면 몰랐던 뒷이야기가 열린다)
const T2 = (title, text) => ({ title, text });
const LORE = {
  gwimun: [4, { id: 'lore_chilseong', t: 'altar_stone', label: '칠성단 돌판', kind: 'lock',
    text: '당산나무 뒤 작은 칠성단. 돌판에 별 아홉 개가 새겨져 있고, 옆에 무당의 글씨.\n"칠성님께 아이 명을 비는 법 — 국자 손잡이 끝 별에서 시작해, 손잡이를 따라 국자 입구까지 네 별, 국자 바닥 두 별, 마지막은 반대편 위 별. 일곱 별에 하나씩 이름을 불러라."',
    lock: { input: 'stars', points: [[0.06, 0.2], [0.2, 0.3], [0.34, 0.36], [0.48, 0.5], [0.54, 0.82], [0.86, 0.82], [0.86, 0.48], [0.28, 0.82], [0.66, 0.1]], len: 7, answer: [0, 1, 2, 3, 4, 5, 6] }, wrongScare: true,
    doneText: '칠성단 돌판의 별 일곱 개가 희미하게 빛난다.',
    on: { flag: 'lore_chilseong', sound: 'gong', story: T2('칠성 기도문', `일곱 별이 이어지자 돌판 아래에서 접힌 한지가 나왔다. 1979년 11월의 기도문.

"칠성님, 우리 아이들 명을 길게 해 주소서.
 영호, 미숙, 동수, 옥자, 태식, 말순, 그리고 일직 복동이."

일곱 어머니의 이름이 나란히 적혀 있다. 그런데 마지막 줄은 다른 먹으로 쓰였다.
"이장 이만석이 '귀문을 닫으려면 아이 일곱이 필요하다'고 했다. 우리는 그 말을 믿지 않았다. 믿었어야 했다."`) } }],
  ophelia: [1, { id: 'lore_cups', t: 'cups_table', label: '선원들의 야바위판', kind: 'lock',
    text: '물에 잠긴 탁자 위에 컵 세 개. 젖은 선원 유령 셋이 둘러앉아 있다.\n"이기면 그날 밤 얘기를 해 주지. 지면… 같이 여기 있는 거고."',
    lock: { input: 'cups', cups: 3, swaps: 9, start: 0 }, wrongScare: true,
    doneText: '선원들은 모자를 벗고 고개를 숙이고 있다.',
    on: { flag: 'lore_sailors', sound: 'shipbell', story: T2('선원들의 이야기', `선원 하나가 젖은 모자를 벗었다.

"출항 전날 밤, 크로우 선장이 선원들을 모았어. 한 사람당 은화 열 닢.
 '폭풍이 오면 3등칸 철창은 내가 잠근다. 너희는 못 본 거다.'
 우린 받았어. 다들 가족이 있었으니까.

 그날 밤 철창 너머에서 아이들이 울었어. 우린 노를 저으면서 귀를 막았지.
 …그러고는 우리 배도 같이 가라앉았어. 선장이 구명정 마개까지 뽑아 놨더라고."

선원들이 은화 열 닢을 탁자 위에 쏟았다. 바닷물에 녹이 슬어 있었다.`) } }],
  doll: [2, { id: 'lore_tea', t: 'tea_table', label: '인형들의 티파티 저울', kind: 'lock',
    text: '작은 찻상 위 장난감 저울. 각설탕 그릇들이 놓여 있고 카드가 꽂혀 있다.\n"클라라의 여덟 번째 생일! 각설탕을 정확히 여덟 개. 그릇은 꼭 세 개만 올려요."',
    lock: { input: 'balance', weights: [1, 2, 3, 4, 6], target: 8, pick: 3, unit: '개', answer: [1, 3, 4] }, wrongScare: true,
    doneText: '저울 위 각설탕이 녹아 있다.',
    on: { flag: 'lore_tea', sound: 'musicbox', story: T2('생일 카드', `저울이 수평이 되자 찻주전자 뚜껑이 달그락 열렸다. 안에 접힌 생일 카드.

"사랑하는 클라라에게. 여덟 살 생일 축하해.
 아빠가 너를 영원히 여덟 살로 지켜 줄게. 다시는 아프지 않게. — 아빠"

카드 뒷면, 연필로 아주 작게.
"아빠, 나 인형 되기 싫어. 친구들도 집에 보내 줘. — 클라라"`) } }],
  west: [1, { id: 'lore_monte', t: 'cups_table', label: '유령 도박꾼의 탁자', kind: 'lock',
    text: '살롱 구석 탁자. 투명한 도박꾼이 컵 세 개를 굴린다.\n"내기 하나 하지, 이방인. 이기면 그날 증인석에 앉았던 놈들 얘기를 해 주마."',
    lock: { input: 'cups', cups: 3, swaps: 10, start: 2 }, wrongScare: true,
    doneText: '도박꾼은 모자를 눌러쓰고 잠들어 있다.',
    on: { flag: 'lore_monte', sound: 'bell', story: T2('도박꾼의 증언', `도박꾼이 낄낄 웃으며 카드 한 장을 내밀었다. 차용증이었다.

"증인 넷 모두 은행가 밴스한테 빚이 있었지. 재판 다음 날 아침, 넷의 빚이 싹 사라졌어.
 그 시각 잭이 여기 앉아 하모니카를 불던 걸 본 사람이 나 말고도 있었다고.
 그런데 다들 떠돌이 하나 목매다는 게 더 싸게 먹혔던 거야."

차용증 아래 서명 넷. 그리고 모티머 밴스의 도장. 날짜는 1887년 6월 7일.`) } }],
  kimono: [2, { id: 'lore_dowry', t: 'chest', label: '혼례 예물 저울', kind: 'lock',
    text: '연회장 구석, 붉은 끈으로 묶인 예물 상자들과 놋쇠 저울.\n저울대에 붙은 종이: "신랑 집에 보낼 예물은 정확히 아홉 관. 상자는 세 개만."',
    lock: { input: 'balance', weights: [1, 2, 3, 5, 7], target: 9, pick: 3, unit: '관', answer: [1, 3, 5] }, wrongScare: true,
    doneText: '예물 상자 하나가 열려 있다.',
    on: { flag: 'lore_dowry', sound: 'gayageum', story: T2('보내지 못한 편지', `저울이 수평이 되자 가장 작은 상자가 저절로 열렸다.
예물이 아니었다. 동백 꽃잎을 말려 끼운 편지 한 통.

"하루 씨에게.
 어머니는 여관 빚 대신 저를 보내려 해요. 내일이면 저는 남의 집 사람이 돼요.
 오늘 밤, 정원 동백나무 아래서 기다릴게요. 동백이 송이째 떨어지기 전에 와 주세요.
 — 유키"

편지는 끝내 부쳐지지 않았다. 봉투 위에 여주인 오소노의 붉은 도장: "압수"`) } }],
};
function freeSpot(ch) {
  const [W, D] = ch.size; const taken = [...(ch.props || []), ...(ch.objects || [])].map((o) => [o.x, o.z]);
  if (ch.spawn) taken.push(ch.spawn);
  const nearWall = (x, z) => (ch.walls || []).some((w) => Math.abs(x - w.x) < w.w / 2 + 1.2 && Math.abs(z - w.z) < w.d / 2 + 1.2);
  let best = null, bd = -1;
  for (let x = -W / 2 + 2; x <= W / 2 - 2; x += 0.5) for (let z = -D / 2 + 2; z <= D / 2 - 2; z += 0.5) {
    if (nearWall(x, z)) continue;
    const d = Math.min(...taken.map(([a, b]) => Math.hypot(a - x, b - z)));
    if (d > bd) { bd = d; best = [x, z]; }
  }
  return best;
}
for (const [sid, [idx, obj]] of Object.entries(LORE)) {
  const ch = SCENARIOS[sid]?.chapters[idx]; if (!ch || ch.objects.some((o) => o.id === obj.id)) continue;
  const [x, z] = freeSpot(ch); ch.objects.push({ ...obj, x, z });
}

// ───── 챕터 맵 확대 비율 (1.0 = 원래 크기) (방 크기·벽·소품·물건·시작 위치·귀신 위치를 같은 비율로)
const MAP_SCALE = 1.0;
const sc2 = (v) => Math.round(v * MAP_SCALE * 100) / 100;
function enlarge(ch) {
  if (ch._scaled) return; ch._scaled = true;
  ch.size = ch.size.map(sc2);
  const pos = (o) => { if (typeof o.x === 'number') o.x = sc2(o.x); if (typeof o.z === 'number') o.z = sc2(o.z); };
  if (ch.spawn) ch.spawn = ch.spawn.map(sc2);
  (ch.props || []).forEach(pos);
  (ch.objects || []).forEach(pos);
  (ch.walls || []).forEach((w) => { pos(w); w.w = w.w > 0.5 ? sc2(w.w) : w.w; w.d = w.d > 0.5 ? sc2(w.d) : w.d; });
  for (const g of [ch.ghost, ...(ch.ghosts || [])]) if (g?.spawn) { g.spawn = g.spawn.map(sc2); g.sense = Math.round((g.sense || 6) * 1.1 * 10) / 10; }
}
for (const s of Object.values(SCENARIOS)) s.chapters.forEach(enlarge);

export const scenarioList = () => Object.values(SCENARIOS).map((s) => ({ id: s.id, title: s.title, short: s.short, desc: s.desc, difficulty: s.difficulty || 3, hidden: !!s.hidden, chapters: s.chapters.map((c) => c.title) }));
export const relicIcons = (s) => s.relics.map((id) => ITEMS[id]?.icon || '·');
