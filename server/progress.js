// ───── 레벨 · 경험치 · 코인 · 상점 · 방문 통계
// 계정이 따로 없으므로 기록은 닉네임별로 남는다 (이어하기·랭킹과 같은 방식)

export const MAX_LV = 100;
export const ADMIN_LV = 1000; // 운영자 표시 레벨
export const HIDDEN_LV = 20; // 이 레벨이 되면 히든 테마가 열린다
/** lv 레벨이 되기 위해 모아야 하는 누적 경험치 (1레벨 = 0) */
export const xpAt = (lv) => 60 * (lv - 1) * lv;
export function levelOf(xp) { let lv = 1; while (lv < MAX_LV && xp >= xpAt(lv + 1)) lv++; return lv; }

export const CLEAR_COINS = 10;      // 한 번 깰 때마다 10코인
export const CHAPTER_XP = 40;       // 챕터를 넘길 때마다
/** 클리어 경험치: 테마 난이도와 공포도에 따라 (처음부터 깬 판은 전부, 이어하기는 절반) */
export const clearXp = (difficulty, fear, full) => Math.round((300 + difficulty * 260) * [0.6, 0.85, 1, 1.25][fear ?? 2] * (full ? 1 : 0.5));
/** 제한 시간: 난이도 1은 30분, 2는 60분, 3 이상은 120분 */
export const timeLimitMs = (difficulty) => (difficulty === 1 ? 30 : difficulty <= 2 ? 60 : 120) * 60 * 1000;

/** 주간랭킹 1~3위 보상(비매품)의 설명 */
export const GOLD_NOTE = '비매품 - 매주 주간랭킹 1~3위에게 아직 없는 부위 하나를 무작위 지급';
// 상점 물건. kind: wings(등에 다는 날개) · mount(타는 것, 탄 동안 이동 속도 1.5배) · pop(파티 꼬깔 폭죽) · rocket(쏘아 올리는 폭죽) · sword(전설의 검)
export const SHOP = {
  rename_ticket: { name: '닉네임 변경권', icon: '🎫', kind: 'rename', price: 30, lv: 1, max: 1, desc: '광장에서 새 닉네임으로 한 번 바꿀 수 있어요. 레벨, 코인, 아이템과 클리어 기록은 그대로 이어져요.' },
  popper: { name: '파티 꼬깔 폭죽', icon: '🎉', kind: 'pop', price: 3, lv: 1, max: 10, desc: '앞에 있는 친구를 향해 펑! 색종이가 쏟아지고 아주 큰 소리가 나요.' },
  rocket: { name: '쏘아 올리는 폭죽', icon: '🎆', kind: 'rocket', price: 5, lv: 1, max: 10, desc: '머리 위로 슈우욱— 팡! 잠시 주변이 환해지고, 귀신이 그쪽으로 이끌려 가요.' },
  wings_fairy: { name: '요정 날개', icon: '🧚', kind: 'wings', price: 30, lv: 10, max: 1, desc: '반짝이는 하늘빛 요정 날개. 살랑살랑 움직여요.' },
  mount_pony: { name: '꼬마 조랑말', icon: '🐴', kind: 'mount', price: 50, lv: 10, max: 1, desc: '타고 다니는 조랑말. 탄 동안 이동 속도 1.5배!' },
  wings_angel: { name: '빛의 천사 날개', icon: '🪽', kind: 'wings', price: 80, lv: 15, max: 1, desc: '은은하게 빛나는 하얀 깃털 날개.' },
  mount_broom: { name: '마녀의 빗자루', icon: '🧹', kind: 'mount', price: 100, lv: 17, max: 1, desc: '살짝 떠서 날아다니는 빗자루. 탄 동안 이동 속도 1.5배!' },
  mount_unicorn: { name: '무지개 유니콘', icon: '🦄', kind: 'mount', price: 150, lv: 25, max: 1, desc: '뿔이 빛나는 유니콘. 탄 동안 이동 속도 1.5배!' },
  wings_devil: { name: '불꽃 악마 날개', icon: '😈', kind: 'wings', price: 180, lv: 25, max: 1, desc: '붉은 불꽃이 일렁이는 날개.' },
  mount_trex: { name: '티라노사우루스', icon: '🦖', kind: 'mount', price: 220, lv: 30, max: 1, desc: '쿵쿵 걷는 티라노사우루스. 가끔 크앙! 하고 입을 벌려요. 탄 동안 이동 속도 1.5배!' },
  wings_dragon: { name: '용의 날개', icon: '🐉', kind: 'wings', price: 260, lv: 30, max: 1, desc: '보랏빛 비늘이 빛나는 커다란 용 날개.' },
  mount_ufo: { name: '꼬마 우주선', icon: '🛸', kind: 'mount', price: 300, lv: 35, max: 1, desc: '빙글빙글 불빛이 도는 우주선. 탄 동안 이동 속도 1.5배!' },
  mount_cat: { name: '대왕 고양이', icon: '🐈', kind: 'mount', price: 150, lv: 20, max: 1, desc: '집채만 한 대왕 고양이. 꼬리를 살랑이며 사뿐사뿐 걸어요. 탄 동안 이동 속도 1.5배!' },
  mount_dog: { name: '대왕 강아지', icon: '🐕', kind: 'mount', price: 150, lv: 20, max: 1, desc: '혀를 내밀고 신나게 달리는 대왕 강아지. 탄 동안 이동 속도 1.5배!' },
  costume_robot: { name: '로봇 코스튬', icon: '🤖', kind: 'costume', price: 400, lv: 50, max: 1, desc: '머리부터 발끝까지 반짝이는 로봇으로 변신! 눈과 가슴 불빛이 깜빡여요.' },
  mount_carriage: { name: '황금 마차', icon: '👑', kind: 'mount', price: 2000, lv: 100, max: 1, desc: '번쩍이는 황금 마차. 최고 레벨만 탈 수 있는 전설의 탈것. 탄 동안 이동 속도 1.5배!' },
  // ── 가면 (kind: mask): 얼굴에 쓰는 탈. 레벨 · 값이 오를수록 크고 화려해진다
  mount_wolf: { name: '대왕 늑대', icon: '🐺', kind: 'mount', price: 180, lv: 22, max: 1, desc: '잿빛 털에 노란 눈의 대왕 늑대. 가끔 고개를 젖히고 우우~ 울어요. 탄 동안 이동 속도 1.5배!' },
  mount_lion: { name: '대왕 사자', icon: '🦁', kind: 'mount', price: 350, lv: 40, max: 1, desc: '풍성한 갈기를 휘날리는 대왕 사자. 가끔 어흥! 하고 포효해요. 탄 동안 이동 속도 1.5배!' },
  mount_turtle: { name: '날쌘 거북이', icon: '🐢', kind: 'mount', price: 450, lv: 45, max: 1, desc: '엉금엉금 기어가는 줄 알았지? 등딱지에 타면 이동 속도 무려 2배!' },
  mount_human: { name: '엎드린 친구', icon: '🧎', kind: 'mount', price: 550, lv: 55, max: 1, desc: '네 발로 엉금엉금 기어가는 친구의 등에 올라타요. 탄 동안 이동 속도 1.5배!' },
  mount_sleigh: { name: '산타 썰매', icon: '🛷', kind: 'mount', price: 1500, lv: 70, max: 1, desc: '루돌프와 순록 두 마리가 끄는 거대한 산타 썰매. 선물 보따리를 싣고 반짝이 별가루를 뿌리며 달려요. 탄 동안 이동 속도 1.5배!' },
  mask_paper: { name: '종이 가면', icon: '📄', kind: 'mask', price: 20, lv: 5, max: 1, desc: '크레파스로 웃는 얼굴을 그린 작은 종이 가면. 고무줄이 살짝 보여요.' },
  mask_fox: { name: '여우 가면', icon: '🦊', kind: 'mask', price: 60, lv: 15, max: 1, desc: '붉은 눈매와 뾰족한 귀가 달린 하얀 여우 가면.' },
  mask_hahoe: { name: '하회탈', icon: '😄', kind: 'mask', price: 150, lv: 25, max: 1, desc: '눈웃음 가득한 나무 하회탈. 턱이 따로 달려 말할 때 덜컥덜컥 움직여요.' },
  mask_venice: { name: '베네치아 가면', icon: '🎭', kind: 'mask', price: 300, lv: 40, max: 1, desc: '보랏빛 벨벳에 금박 무늬, 커다란 깃털과 보석이 달린 가면무도회 가면.' },
  mask_rabbit: { name: '토끼 가면', icon: '🐰', kind: 'mask', price: 40, lv: 10, max: 1, desc: '분홍 볼에 앞니 두 개, 길쭉한 귀가 가끔 폴짝 접히는 하얀 토끼 가면.' },
  mask_bear: { name: '곰 가면', icon: '🐻', kind: 'mask', price: 100, lv: 20, max: 1, desc: '동그란 귀와 볼록한 주둥이, 까만 코가 달린 복슬복슬 곰 가면.' },
  mask_wolf: { name: '늑대 가면', icon: '🐺', kind: 'mask', price: 250, lv: 35, max: 1, desc: '뾰족한 귀와 송곳니, 노랗게 빛나는 눈의 잿빛 늑대 가면.' },
  mask_ghost: { name: '귀신 가면', icon: '👻', kind: 'mask', price: 450, lv: 50, max: 1, desc: '핏기 없는 얼굴에 피눈물, 긴 검은 머리가 늘어진 소름 끼치는 귀신 가면. 눈 속에서 붉은 점이 흔들려요.' },
  mask_oni: { name: '황금 도깨비 가면', icon: '👹', kind: 'mask', price: 600, lv: 60, max: 1, desc: '머리보다 큰 황금 도깨비 탈. 뿔이 솟고 눈에서 붉은 빛이 일렁여요.' },
  // ── 크리스마스 선물 (비매품): 로비 소원의 별 앞 선물상자에서 한 번 받는다
  costume_xmas: { name: '크리스마스 트리 코스튬', icon: '🎄', kind: 'costume', price: 0, lv: 1, max: 1, nosale: true, gift: 'xmas', desc: '비매품 - 로비 소원의 별 앞 🎁 크리스마스 선물상자에서 받아요', tip: '꼭대기에 금빛 별, 반짝이는 전구와 방울이 달린 초록 트리 옷. 얼굴만 쏙 나와요.' },
  sword: { name: '전설의 검', icon: '🗡️', kind: 'sword', price: 1000, lv: 30, max: 1, uses: 30, desc: '푸른 빛을 내뿜는 크리스탈 검. 가까운 귀신을 베어 없앨 수 있어요. 귀신을 30번 없애면 깨져 버려요.' },
  chainsaw: { name: '전기톱', icon: '🪚', kind: 'saw', price: 5000, lv: 50, max: 1, desc: '부르릉! 시동 걸린 전기톱. 가까운 귀신을 갈아 없애요. 절대 망가지지 않아 귀신 퇴치 무제한!' },
  // ── 황금 고양이 세트 (비매품 · kind: gold): 매주 주간랭킹 1~3위에게 아직 없는 것 하나를 랜덤으로 준다. part = 몸의 어느 부위인지 (착용 글자)
  gold_hat: { name: '황금 고양이 모자', icon: '🎩', kind: 'gold', part: 'h', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '큼직한 귀가 쫑긋한 황금 고양이 모자.' },
  gold_mask: { name: '황금 고양이 가면', icon: '🎭', kind: 'gold', part: 'm', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '하얀 바탕에 붉은 무늬와 황금 눈꼬리를 그린, 귀가 큰 고양이 탈.' },
  gold_gloves: { name: '황금 고양이 장갑', icon: '🧤', kind: 'gold', part: 'g', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '분홍 발바닥 젤리가 달린 황금 고양이 장갑.' },
  gold_top: { name: '황금 고양이 상의', icon: '👕', kind: 'gold', part: 't', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '붉은 목줄에 고양이 방울이 달린 황금 고양이 윗옷.' },
  gold_bottom: { name: '황금 고양이 하의', icon: '👖', kind: 'gold', part: 'b', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '반짝이는 황금 고양이 바지.' },
  gold_shoes: { name: '황금 고양이 신발', icon: '👢', kind: 'gold', part: 's', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '사뿐사뿐 황금 고양이 발 신발.' },
  gold_tail: { name: '황금 고양이 꼬리', icon: '🐾', kind: 'gold', part: 'l', price: 0, lv: 1, max: 1, nosale: true, desc: GOLD_NOTE, tip: '살랑살랑 흔들리는 황금 고양이 꼬리.' },
  // 황금 고양이 지팡이 (비매품 · kind: staff): 세트 7종을 모두 모으면 받는다. 전설의 검처럼 귀신을 물리치지만 횟수 제한이 없다
  gold_staff: { name: '황금 고양이 지팡이', icon: '🪄', kind: 'staff', price: 0, lv: 1, max: 1, nosale: true, desc: '비매품 - 황금 고양이 코스튬 세트 7종을 모두 모으면 받는 지팡이', tip: '가까운 귀신을 횟수 제한 없이 물리칠 수 있어요. (귀신 퇴치 무제한)' },
};
export const isWear = (id) => ['wings', 'mount', 'costume', 'mask'].includes(SHOP[id]?.kind);
// ───── 황금 고양이 세트
export const GOLD_IDS = ['gold_hat', 'gold_mask', 'gold_gloves', 'gold_top', 'gold_bottom', 'gold_shoes', 'gold_tail'];
export const GOLD_STAFF = 'gold_staff';
export const isGold = (id) => SHOP[id]?.kind === 'gold';
export const hasGoldSet = (pf) => GOLD_IDS.every((id) => pf.items?.[id]);
/** 지금 착용 중인 황금 고양이 부위 글자 (가진 것만, 정해진 순서로) — 다른 사람 화면에 보내는 장비 문자열에 들어간다 */
export const goldWorn = (pf) => { const on = pf.equip?.gold || ''; if (!on) return ''; let out = ''; for (const id of GOLD_IDS) if (pf.items?.[id] && on.includes(SHOP[id].part)) out += SHOP[id].part; return out; };
/** 아직 없는 황금 고양이 부위 중 하나를 랜덤으로 고른다 (다 가졌으면 null) */
export function randomGold(pf, rnd = Math.random) { const left = GOLD_IDS.filter((id) => !pf.items?.[id]); return left.length ? left[Math.min(left.length - 1, Math.floor(rnd() * left.length))] : null; }
/** 황금 고양이 부위 하나를 준다: 아이템별 1개만 · 받자마자 착용(로봇 코스튬은 벗는다) · 7종이 다 모이면 지팡이도 준다 → { added, staff } */
export function giveGold(pf, id) {
  pf.items ||= {}; pf.equip ||= {};
  const added = isGold(id) && !pf.items[id];
  if (added) { pf.items[id] = 1; const part = SHOP[id].part; if (!(pf.equip.gold || '').includes(part)) pf.equip.gold = (pf.equip.gold || '') + part; pf.equip.costume = ''; } // (고양이 세트를 입으면 로봇 코스튬은 벗는다)
  const staff = hasGoldSet(pf) && !pf.items[GOLD_STAFF];
  if (staff) pf.items[GOLD_STAFF] = 1;
  return { added, staff };
}

export function blankProfile() { return { xp: 0, coins: 0, items: {}, swordUses: 0, equip: { wings: '', mount: '', costume: '', gold: '', mask: '' }, at: Date.now() }; }
export function profileView(pf, admin) {
  const lv = admin ? ADMIN_LV : levelOf(pf.xp); // 운영자는 Lv.1000
  return { xp: pf.xp, lv, max: MAX_LV, hiddenLv: HIDDEN_LV, cur: admin ? 0 : xpAt(lv), next: admin ? 0 : lv >= MAX_LV ? xpAt(lv) : xpAt(lv + 1), coins: admin ? -1 : pf.coins, items: pf.items, swordUses: pf.swordUses, equip: pf.equip, admin: !!admin };
}

// ───── 방문 통계 (한국 시간 기준 날짜별)
export const dayKey = (t = Date.now()) => new Date(t + 9 * 3600 * 1000).toISOString().slice(0, 10);
// ───── 주간 · 월간 레벨 랭킹: 그 주(월요일 시작) · 그 달에 얻은 경험치를 따로 센다 (한국 시간 기준)
export const weekKey = (t = Date.now()) => { const d = new Date(t + 9 * 3600 * 1000); const dow = (d.getUTCDay() + 6) % 7; return dayKey(t - dow * 86400000); };
export const monthKey = (t = Date.now()) => dayKey(t).slice(0, 7);
/** 경험치를 얻을 때마다: 이번 주 · 이번 달 몫에 더한다 (주·달이 바뀌었으면 0부터) */
export function addPeriodXp(pf, amt, t = Date.now()) {
  const wk = weekKey(t), mo = monthKey(t);
  if (pf.wk?.k !== wk) { if (pf.wk?.xp > 0) pf.pwk = pf.wk; pf.wk = { k: wk, xp: 0 }; } // 지난주 몫(pwk)은 남겨 둔다 → 주간 1~3위를 확정할 때 쓴다
  if (pf.mo?.k !== mo) pf.mo = { k: mo, xp: 0 };
  pf.wk.xp += amt; pf.mo.xp += amt;
}
const rankOrder = (a, b) => b.gain - a.gain || b.xp - a.xp || (a.name < b.name ? -1 : 1);
/** 지난주 지급 대상. 주간 랭킹과 같은 순서로 양의 경험치가 있는 상위 3명. */
export function weeklyPodium(profiles, wk, skip = () => false) {
  const rows = [];
  for (const [name, pf] of Object.entries(profiles)) {
    if (!pf || skip(name)) continue;
    const gain = pf.wk?.k === wk ? pf.wk.xp : pf.pwk?.k === wk ? pf.pwk.xp : 0;
    if (gain > 0) rows.push({ name, gain, xp: pf.xp || 0, lv: levelOf(pf.xp || 0) });
  }
  return rows.sort(rankOrder).slice(0, 3);
}
/** 레벨 랭킹 표: kind = 'week' | 'month' | 'total'. 상위 n명 + 내 순위 */
export function levelBoard(profiles, kind, n = 20, skip = () => false) {
  const wk = weekKey(), mo = monthKey(); const rows = [];
  for (const [name, pf] of Object.entries(profiles)) {
    if (!pf || skip(name)) continue;
    const xp = pf.xp || 0;
    const gain = kind === 'week' ? (pf.wk?.k === wk ? pf.wk.xp : 0) : kind === 'month' ? (pf.mo?.k === mo ? pf.mo.xp : 0) : xp;
    if (!(gain > 0)) continue;
    rows.push({ name, lv: levelOf(xp), xp, gain });
  }
  rows.sort(rankOrder);
  return { rows: rows.slice(0, n), total: rows.length, rankOf: (name) => { const i = rows.findIndex((r) => r.name === name); return i < 0 ? null : { no: i + 1, ...rows[i] }; } };
}
/** stats.days[날짜] = { v: 방문 수, u: { 닉네임: 머문 시간(ms) } } */
export function statRange(stats, days) {
  const now = Date.now(); const names = new Map(); let visits = 0;
  for (let i = 0; i < days; i++) {
    const d = stats.days?.[dayKey(now - i * 86400000)]; if (!d) continue;
    visits += d.v || 0;
    for (const [n, ms] of Object.entries(d.u || {})) names.set(n, (names.get(n) || 0) + ms);
  }
  const total = [...names.values()].reduce((a, b) => a + b, 0);
  return { visitors: names.size, visits, totalMs: total, avgMs: names.size ? Math.round(total / names.size) : 0 };
}
export function pruneStats(stats) {
  const keep = new Set(Array.from({ length: 120 }, (_, i) => dayKey(Date.now() - i * 86400000)));
  for (const k of Object.keys(stats.days || {})) if (!keep.has(k)) delete stats.days[k];
}
