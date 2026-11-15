// ───── 고정 계정: 가입·로그인 없이, 접속한 IP와 기기에 계정을 묶는다
//
// · 처음 들어올 때 정한 닉네임이 그 IP·기기의 고정 계정이 된다. (레벨·코인·이어하기·도장표는 닉네임에 쌓인다)
// · 그 기기는 다음부터 닉네임을 바꿀 수 없고, 자동으로 같은 계정으로 들어온다.
// · 계정이 있는 닉네임은 그 계정의 기기, 또는 그 계정이 쓰던 IP에서만 쓸 수 있다. (남이 닉네임만 따라 써서 계정을 가져가는 것 방지)
// · 휴대폰 데이터는 IP가 수시로 바뀌고, 같은 와이파이를 쓰는 친구·가족은 IP가 같다.
//   그래서 IP 하나에 계정이 여러 개 있을 수 있고(같이 하는 친구), 기기에 남겨 둔 열쇠로 IP가 바뀌어도 같은 계정을 찾는다.
// · IP 원문은 저장하지 않는다. 되돌릴 수 없는 해시만 남긴다.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const MAX_IPS = 8; // 계정마다 기억해 두는 최근 IP 수
const MAX_NEW_PER_IP = 60; // 한 IP 에서 하루에 새로 만들 수 있는 계정 수 (닉네임을 마구 바꿔 가며 계정을 쌓는 것 방지 · 학교·PC방처럼 여럿이 쓰는 IP 를 생각해 넉넉하게)

/** 접속자의 실제 IP (프록시·CDN 뒤에서도) */
export function clientIp(sock) {
  const h = sock?.handshake?.headers || {};
  const raw = String(h['cf-connecting-ip'] || h['true-client-ip'] || h['x-forwarded-for'] || sock?.handshake?.address || '').split(',')[0].trim();
  return normIp(raw);
}
/** IPv4 는 그대로, IPv6 는 앞 64비트(회선 하나)만 쓴다 — 기기마다 뒷자리가 수시로 바뀌기 때문 */
export function normIp(ip) {
  ip = String(ip || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  const m4 = ip.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (m4 && (!ip.includes(':') || ip.startsWith('::ffff:') || ip.startsWith('::'))) return m4[1];
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const a = head ? head.split(':') : [], b = tail ? tail.split(':') : [];
  const full = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a;
  return full.slice(0, 4).map((x) => (parseInt(x, 16) || 0).toString(16)).join(':') + '::/64';
}

export class Accounts {
  /** data: 저장소에서 불러온 객체 { salt, list: { id: 계정 } }, save: 바뀌면 부르는 저장 함수 */
  constructor(data, save) {
    this.data = data; this.save = save;
    data.salt ||= randomBytes(16).toString('hex');
    data.list ||= {};
    this.byName = new Map();
    this.made = new Map(); // ipKey -> { n, t } 오늘 새로 만든 계정 수
    for (const a of Object.values(data.list)) this.byName.set(a.name, a);
  }
  get size() { return this.byName.size; }
  ipKey(ip) { return createHash('sha256').update(this.data.salt + '|' + ip).digest('hex').slice(0, 24); }
  /** 기기에 남겨 둔 열쇠로 계정 찾기 */
  byToken(tok) {
    const a = tok && typeof tok.id === 'string' && typeof tok.key === 'string' ? this.data.list[tok.id] : null;
    if (!a) return null;
    const x = Buffer.from(tok.key), y = Buffer.from(a.key);
    return x.length === y.length && timingSafeEqual(x, y) ? a : null;
  }
  touch(a, ipk) {
    a.seen = Date.now();
    if (ipk && a.ips[0] !== ipk) { a.ips = [ipk, ...a.ips.filter((x) => x !== ipk)].slice(0, MAX_IPS); }
    this.save();
  }
  /**
   * 접속 요청을 계정에 맞춘다.
   * 돌려주는 값: { acct } 또는 { error: 'taken' } (다른 사람의 고정 계정 닉네임) · { error: 'toomany' } (이 IP 에서 오늘 너무 많이 만듦)
   */
  claim({ name, ip, tok }) {
    const ipk = ip ? this.ipKey(ip) : '';
    const mine = this.byToken(tok);
    if (mine) { this.touch(mine, ipk); return { acct: mine }; } // 이 기기의 고정 계정
    const owner = this.byName.get(name);
    if (owner) {
      if (ipk && owner.ips.includes(ipk)) { this.touch(owner, ipk); return { acct: owner }; } // 같은 IP에서 같은 닉네임 → 같은 계정
      return { error: 'taken' };
    }
    const now = Date.now(); const m = this.made.get(ipk) || { n: 0, t: now };
    if (now - m.t > 86400000) { m.n = 0; m.t = now; }
    if (m.n >= MAX_NEW_PER_IP) return { error: 'toomany' };
    m.n++; this.made.set(ipk, m); if (this.made.size > 5000) this.made.clear();
    const a = { id: 'a' + randomBytes(8).toString('hex'), key: randomBytes(24).toString('hex'), name, ips: ipk ? [ipk] : [], at: now, seen: now };
    this.data.list[a.id] = a; this.byName.set(name, a); this.save();
    return { acct: a, created: true };
  }
  /** 오래 안 온(기본 120일) · 한 번도 제대로 하지 않은 계정은 지워 닉네임을 풀어 준다 */
  prune(profiles, days = 120) {
    const cut = Date.now() - days * 86400000; let n = 0;
    for (const a of Object.values(this.data.list)) {
      const pf = profiles[a.name];
      const played = pf && ((pf.xp || 0) > 0 || (pf.coins || 0) > 0 || Object.keys(pf.items || {}).length > 0);
      if ((a.seen || a.at || 0) < cut && !played) { delete this.data.list[a.id]; this.byName.delete(a.name); n++; }
    }
    if (n) this.save();
    return n;
  }
}
