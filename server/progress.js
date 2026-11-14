// ───── 레벨 · 경험치 · 코인 · 상점 · 방문 통계
// 계정이 따로 없으므로 기록은 닉네임별로 남는다 (이어하기·랭킹과 같은 방식)

export const MAX_LV = 100;
export const HIDDEN_LV = 20; // 이 레벨이 되면 히든 테마가 열린다
/** lv 레벨이 되기 위해 모아야 하는 누적 경험치 (1레벨 = 0) */
export const xpAt = (lv) => 60 * (lv - 1) * lv;
export function levelOf(xp) { let lv = 1; while (lv < MAX_LV && xp >= xpAt(lv + 1)) lv++; return lv; }

export const CLEAR_COINS = 10;      // 한 번 깰 때마다 10코인
export const CHAPTER_XP = 40;       // 챕터를 넘길 때마다
/** 클리어 경험치: 테마 난이도와 공포도에 따라 (처음부터 깬 판은 전부, 이어하기는 절반) */
export const clearXp = (difficulty, fear, full) => Math.round((300 + difficulty * 260) * [0.6, 0.85, 1, 1.25][fear ?? 2] * (full ? 1 : 0.5));
/** 제한 시간: 쉬운 테마(난이도 2 이하) 60분, 어려운 테마 120분 */
export const timeLimitMs = (difficulty) => (difficulty <= 2 ? 60 : 120) * 60 * 1000;

// 상점 물건. kind: wings(등에 다는 날개) · mount(타는 것, 탄 동안 이동 속도 1.5배) · pop(파티 꼬깔 폭죽) · rocket(쏘아 올리는 폭죽) · sword(전설의 검)
export const SHOP = {
  popper: { name: '파티 꼬깔 폭죽', icon: '🎉', kind: 'pop', price: 3, lv: 1, max: 10, desc: '앞에 있는 친구를 향해 펑! 색종이가 쏟아지고 아주 큰 소리가 나요.' },
  rocket: { name: '쏘아 올리는 폭죽', icon: '🎆', kind: 'rocket', price: 5, lv: 1, max: 10, desc: '머리 위로 슈우욱— 팡! 잠시 주변이 환해지고, 귀신이 그쪽으로 이끌려 가요.' },
  wings_fairy: { name: '요정 날개', icon: '🧚', kind: 'wings', price: 30, lv: 2, max: 1, desc: '반짝이는 하늘빛 요정 날개. 살랑살랑 움직여요.' },
  mount_pony: { name: '꼬마 조랑말', icon: '🐴', kind: 'mount', price: 50, lv: 3, max: 1, desc: '타고 다니는 조랑말. 탄 동안 이동 속도 1.5배!' },
  wings_angel: { name: '빛의 천사 날개', icon: '🪽', kind: 'wings', price: 80, lv: 5, max: 1, desc: '은은하게 빛나는 하얀 깃털 날개.' },
  mount_broom: { name: '마녀의 빗자루', icon: '🧹', kind: 'mount', price: 100, lv: 7, max: 1, desc: '살짝 떠서 날아다니는 빗자루. 탄 동안 이동 속도 1.5배!' },
  mount_unicorn: { name: '무지개 유니콘', icon: '🦄', kind: 'mount', price: 150, lv: 10, max: 1, desc: '뿔이 빛나는 유니콘. 탄 동안 이동 속도 1.5배!' },
  wings_devil: { name: '불꽃 악마 날개', icon: '😈', kind: 'wings', price: 180, lv: 12, max: 1, desc: '붉은 불꽃이 일렁이는 날개.' },
  mount_trex: { name: '티라노사우루스', icon: '🦖', kind: 'mount', price: 220, lv: 13, max: 1, desc: '쿵쿵 걷는 티라노사우루스. 가끔 크앙! 하고 입을 벌려요. 탄 동안 이동 속도 1.5배!' },
  wings_dragon: { name: '용의 날개', icon: '🐉', kind: 'wings', price: 260, lv: 15, max: 1, desc: '보랏빛 비늘이 빛나는 커다란 용 날개.' },
  mount_ufo: { name: '꼬마 우주선', icon: '🛸', kind: 'mount', price: 300, lv: 17, max: 1, desc: '빙글빙글 불빛이 도는 우주선. 탄 동안 이동 속도 1.5배!' },
  mount_cat: { name: '대왕 고양이', icon: '🐈', kind: 'mount', price: 150, lv: 10, max: 1, desc: '집채만 한 대왕 고양이. 꼬리를 살랑이며 사뿐사뿐 걸어요. 탄 동안 이동 속도 1.5배!' },
  mount_dog: { name: '대왕 강아지', icon: '🐕', kind: 'mount', price: 150, lv: 10, max: 1, desc: '혀를 내밀고 신나게 달리는 대왕 강아지. 탄 동안 이동 속도 1.5배!' },
  costume_robot: { name: '로봇 코스튬', icon: '🤖', kind: 'costume', price: 400, lv: 30, max: 1, desc: '머리부터 발끝까지 반짝이는 로봇으로 변신! 눈과 가슴 불빛이 깜빡여요.' },
  mount_carriage: { name: '황금 마차', icon: '👑', kind: 'mount', price: 2000, lv: 100, max: 1, desc: '번쩍이는 황금 마차. 최고 레벨만 탈 수 있는 전설의 탈것. 탄 동안 이동 속도 1.5배!' },
  sword: { name: '전설의 검', icon: '🗡️', kind: 'sword', price: 1000, lv: 1, max: 1, uses: 30, desc: '푸른 빛을 내뿜는 크리스탈 검. 가까운 귀신을 베어 없앨 수 있어요. 귀신을 30번 없애면 깨져 버려요.' },
};
export const isWear = (id) => ['wings', 'mount', 'costume'].includes(SHOP[id]?.kind);

export function blankProfile() { return { xp: 0, coins: 0, items: {}, swordUses: 0, equip: { wings: '', mount: '', costume: '' }, at: Date.now() }; }
export function profileView(pf, admin) {
  const lv = levelOf(pf.xp);
  return { xp: pf.xp, lv, max: MAX_LV, hiddenLv: HIDDEN_LV, cur: xpAt(lv), next: lv >= MAX_LV ? xpAt(lv) : xpAt(lv + 1), coins: admin ? -1 : pf.coins, items: pf.items, swordUses: pf.swordUses, equip: pf.equip, admin: !!admin };
}

// ───── 방문 통계 (한국 시간 기준 날짜별)
export const dayKey = (t = Date.now()) => new Date(t + 9 * 3600 * 1000).toISOString().slice(0, 10);
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
