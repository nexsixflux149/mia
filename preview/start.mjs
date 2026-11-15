// Run the real game server with an isolated, secret-free environment.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = {};
for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'LANG']) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, {
  MIA_PREVIEW: '1', PORT: process.env.PREVIEW_PORT || '3100',
  PREVIEW_HOST: process.env.PREVIEW_HOST || '127.0.0.1',
  DATA_DIR: path.join(root, process.env.PREVIEW_TEST === '1' ? '.preview-test-data' : '.preview-data'), NODE_ENV: 'development',
});
console.log(`MIA 독립 미리보기: http://localhost:${env.PORT}\n운영 환경변수·DB·저장 기록을 사용하지 않습니다. 종료: Ctrl+C`);
const child = spawn(process.execPath, [path.join(root, 'server/index.js')], { cwd: root, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (e) => { console.error(e.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 0; });
