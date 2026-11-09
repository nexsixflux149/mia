// ───── 저장소: DATABASE_URL 이 있으면 무료 Postgres(Neon·Supabase 등)에, 없으면 data 폴더의 json 파일에 저장한다.
// 기록(이어하기·하트·랭킹)은 작아서 종류별로 한 줄(JSON)씩 통째로 저장한다.
import fs from 'fs';
import path from 'path';

const DB_URL = (process.env.DATABASE_URL || '').trim();
const TABLE = 'mia_store';
let pool = null;

function dbConfig(url) {
  // sslmode 등은 직접 처리한다 (pg 버전마다 해석이 달라 연결이 실패하는 것을 막기 위해)
  const u = new URL(url);
  const local = ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
  const noSsl = u.searchParams.get('sslmode') === 'disable';
  for (const k of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'channel_binding']) u.searchParams.delete(k);
  return { connectionString: u.toString(), ssl: local || noSsl ? false : { rejectUnauthorized: false }, max: 3, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000 };
}

export const storeKind = () => (pool ? 'db' : 'file');

/** 시작할 때 한 번: 저장소 연결 + 기록 불러오기. keys 는 ['saves','hearts','ranks'] 같은 이름 목록 */
export async function openStore(dataDir, keys) {
  const out = {};
  for (const k of keys) out[k] = readFile(dataDir, k) || {};
  if (!DB_URL) return out;
  const { default: pg } = await import('pg');
  pool = new pg.Pool(dbConfig(DB_URL));
  pool.on('error', (e) => console.warn('  [DB] 연결 오류:', e.message));
  await pool.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
  const { rows } = await pool.query(`SELECT key, value FROM ${TABLE} WHERE key = ANY($1)`, [keys]);
  const have = new Set(rows.map((r) => r.key));
  for (const r of rows) out[r.key] = r.value || {};
  // DB가 비어 있으면 기존 파일 기록을 옮겨 담는다 (내 PC에서 쌓은 기록을 그대로 가져가기)
  for (const k of keys) if (!have.has(k) && Object.keys(out[k]).length) await writeDb(k, out[k]);
  return out;
}

function readFile(dataDir, key) {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, key + '.json'), 'utf8')); } catch { return null; }
}

async function writeDb(key, obj) {
  await pool.query(`INSERT INTO ${TABLE} (key, value, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, JSON.stringify(obj)]);
}

// 자주 바뀌어도 1초에 한 번만 저장한다
const timers = new Map(); const pending = new Map();
export function persist(dataDir, key, obj, pretty = false) {
  pending.set(key, { dataDir, obj, pretty });
  if (!pool) return void flushKey(key); // 파일은 바로 저장 (창을 그냥 닫아도 남도록)
  if (timers.has(key)) return;
  timers.set(key, setTimeout(() => { timers.delete(key); flushKey(key); }, 1000));
}

async function flushKey(key) {
  const p = pending.get(key); if (!p) return; pending.delete(key);
  if (pool) {
    try { await writeDb(key, p.obj); } catch (e) { console.warn(`  [DB] ${key} 저장 실패, 다시 시도합니다:`, e.message); if (!pending.has(key)) persist(p.dataDir, key, p.obj, p.pretty); }
    return;
  }
  try { fs.mkdirSync(p.dataDir, { recursive: true }); fs.writeFileSync(path.join(p.dataDir, key + '.json'), JSON.stringify(p.obj, null, p.pretty ? 2 : 0)); } catch {}
}

/** 서버가 꺼지기 직전에 남은 기록을 모두 저장한다 (무료 서버가 잠들거나 재배포될 때) */
export async function flushAll() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  await Promise.all([...pending.keys()].map(flushKey));
  if (pool) await pool.end().catch(() => {});
}
