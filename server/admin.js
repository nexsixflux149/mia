// 운영자(관리자) 계정
// 비밀번호 자체는 저장소에 두지 않는다. 여기엔 되돌릴 수 없는 해시만 있다.
// 비밀번호는 이 컴퓨터의 .env.local 의 ADMIN_PASSWORD 에 적혀 있다 (git 에 올라가지 않음).
// 서버 환경변수 ADMIN_PASSWORD 를 넣으면 그 값이 우선한다.
import { scryptSync, timingSafeEqual } from 'node:crypto';
const SALT = 'ba2648d96cdd8addb8024108b457e574';
const HASH = Buffer.from('1b43bca133aff8a05d8231ad0a2b9720592645764aa309344dec51e2e8ac4124', 'hex');
export const ADMIN_NAME = '운영자';
export function isAdminPassword(pw) {
  pw = String(pw || '');
  if (!pw || pw.length > 100) return false;
  if (process.env.ADMIN_PASSWORD) { const a = Buffer.from(pw), b = Buffer.from(process.env.ADMIN_PASSWORD); return a.length === b.length && timingSafeEqual(a, b); }
  return timingSafeEqual(scryptSync(pw, SALT, 32), HASH);
}
// 운영자를 사칭하는 닉네임은 일반 사용자에게 막는다
export const looksLikeAdmin = (name) => /운영|관리자|어드민|admin|staff|매니저/i.test(String(name || '').replace(/[\s._\-·]+/g, ''));
