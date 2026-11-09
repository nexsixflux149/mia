// .env.local(neon init / neon env pull 이 만든 Neon 연결 주소)을 읽어 둔다.
// 이미 설정된 환경 변수(예: Render 의 DATABASE_URL)가 있으면 그쪽이 우선이다.
// 다른 모듈보다 먼저 import 해야 한다.
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const f of ['.env.local', '.env']) {
  try { process.loadEnvFile?.(path.join(ROOT, f)); } catch {}
}
