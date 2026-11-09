// 공유 서버: 게임 서버를 켜고, Cloudflare 무료 터널로 인터넷 어디서나 접속 가능한 https 주소를 만든다.
//   npm run share
//
// Error 1033(터널 연결 안 됨) 대비:
//  · QUIC(UDP)이 막힌 네트워크가 많아서 기본으로 http2(TCP) 프로토콜을 쓴다
//  · 주소는 터널이 실제로 연결(Registered)된 뒤에만 알려준다
//  · 3000번 포트가 사용 중이면 다른 포트를 자동으로 고른다
//  · 터널이 끊기면 자동으로 다시 연결한다 (주소는 바뀜)
//
// 내 도메인으로 열기: 프로젝트 폴더의 '도메인 터널 설정.txt' 에 주소와 Cloudflare 터널 토큰을 넣으면
// 임시 주소 대신 그 도메인으로 연다 (주소가 바뀌지 않음). 토큰이 비어 있으면 예전처럼 임시 주소.
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const URL_FILE = path.join(DATA_DIR, 'public_url.txt');
const PROTOCOL = process.env.TUNNEL_PROTOCOL || 'http2'; // 'quic' 으로 바꿀 수 있음
const SETTINGS_FILE = path.join(ROOT, '도메인 터널 설정.txt');
// '도메인 터널 설정.txt' 읽기 (주소=…, 토큰=…, 포트=…). 환경 변수 TUNNEL_TOKEN / PUBLIC_URL 이 있으면 그쪽 우선
function readNamed() {
  const kv = {};
  try {
    for (const line of fs.readFileSync(SETTINGS_FILE, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
      const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/); if (m) kv[m[1].toLowerCase()] = m[2];
    }
  } catch {}
  const token = (process.env.TUNNEL_TOKEN || kv['토큰'] || kv.token || '').replace(/^cloudflared.*--token\s+/i, '').trim();
  let url = (process.env.PUBLIC_URL || kv['주소'] || kv.url || '').trim().replace(/\/+$/, '');
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  const port = Number(kv['포트'] || kv.port || 3000) || 3000;
  return token ? { token, url, port } : null;
}
const named = readNamed();
fs.mkdirSync(DATA_DIR, { recursive: true });
try { fs.unlinkSync(URL_FILE); } catch {}

const box = (lines) => {
  const w = Math.max(...lines.map((l) => [...l].length)) + 4;
  console.log('\n' + '═'.repeat(w));
  for (const l of lines) console.log('  ' + l);
  console.log('═'.repeat(w) + '\n');
};
const portFree = (port) => new Promise((res) => { const s = net.createServer(); s.once('error', () => res(false)); s.once('listening', () => s.close(() => res(true))); s.listen(port); });
const waitHealthy = async (port, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(`http://127.0.0.1:${port}/health`); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
};
function findCloudflared() {
  const candidates = [process.env.CLOUDFLARED, 'cloudflared',
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe',
    path.join(os.homedir(), 'AppData/Local/Microsoft/WinGet/Links/cloudflared.exe'), '/usr/local/bin/cloudflared', '/opt/homebrew/bin/cloudflared'].filter(Boolean);
  for (const c of candidates) { const r = spawnSync(c, ['--version'], { encoding: 'utf8' }); if (r.status === 0) return c; }
  return null;
}

const children = [];
let stopping = false;
const stop = (code = 0) => {
  if (stopping) return; stopping = true;
  try { fs.unlinkSync(URL_FILE); } catch {}
  for (const c of children) { try { c.kill(); } catch {} }
  setTimeout(() => process.exit(code), 300);
};
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

// 1) 빈 포트 찾기 (내 도메인 터널은 Cloudflare 에 적어 둔 포트 그대로 써야 한다)
let PORT = Number(process.env.PORT || named?.port || 3000);
if (named && !(await portFree(PORT))) {
  box([`❌ ${PORT}번 포트가 이미 사용 중입니다.`, '공유 서버 창이 이미 켜져 있으면 그 창을 닫고 다시 실행하세요.', `(내 도메인 터널은 Cloudflare 에 적은 localhost:${PORT} 로만 연결됩니다)`]);
  process.exit(1);
}
for (let i = 0; i < 20 && !(await portFree(PORT)); i++) {
  console.log(`⚠ ${PORT}번 포트가 이미 사용 중입니다 (공유 서버 창이 이미 켜져 있거나 다른 프로그램이 사용 중). 다른 포트를 찾습니다…`);
  PORT++;
}

// 2) 게임 서버 실행
const server = spawn(process.execPath, [path.join(ROOT, 'server/index.js')], { stdio: 'inherit', env: { ...process.env, PORT: String(PORT), DATA_DIR } });
children.push(server);
server.on('exit', (code) => { if (!stopping) { box([`❌ 게임 서버가 종료되었습니다 (코드 ${code}).`, '위에 나온 오류 메시지를 확인해 주세요.']); stop(1); } });
if (!(await waitHealthy(PORT))) { box(['❌ 게임 서버가 15초 안에 켜지지 않았습니다.', '위에 나온 오류 메시지를 확인해 주세요.']); stop(1); }

// 3) 터널
const lanOnly = process.argv.includes('--lan');
const bin = lanOnly ? null : findCloudflared();
const lan = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => `  http://${i.address}:${PORT}`);
if (lanOnly) {
  box(['📶 같은 와이파이 전용 모드 (--lan)', '', '같은 와이파이의 친구는 아래 주소로 접속하세요:', ...lan]);
} else if (!bin) {
  box(['⚠ cloudflared 가 설치되어 있지 않아 인터넷 공유 주소를 만들 수 없습니다.', '', '설치 (Windows):  winget install --id Cloudflare.cloudflared --source winget', '설치 후 이 창을 닫고 다시 실행하세요.', '', '지금은 같은 와이파이의 친구만 접속할 수 있습니다:', ...lan]);
} else if (named) {
  // 내 도메인 터널: 주소가 고정이라 끊겨도 같은 주소로 다시 연결된다
  let attempt = 0;
  const shown = named.url || '(Cloudflare 에서 정한 내 도메인 주소)';
  const openNamed = () => {
    attempt++;
    let ready = false;
    console.log(`\n내 도메인 터널을 여는 중… (${PROTOCOL} 방식, ${attempt}번째 시도)`);
    // 토큰은 명령줄 대신 환경 변수로 넘긴다 (작업 관리자 등에 보이지 않게)
    const tunnel = spawn(bin, ['tunnel', '--no-autoupdate', '--protocol', PROTOCOL, 'run'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TUNNEL_TOKEN: named.token } });
    children.push(tunnel);
    const onData = (buf) => {
      const text = String(buf);
      if (process.env.TUNNEL_DEBUG) process.stdout.write(text);
      if (/Registered tunnel connection|Connection [0-9a-f-]+ registered/i.test(text) && !ready) {
        ready = true; attempt = 0;
        if (named.url) fs.writeFileSync(URL_FILE, named.url);
        box(['🎉 내 도메인으로 공유 서버가 열렸습니다! 이 주소를 친구들에게 보내세요:', '', `   ${shown}`, '', '· 주소는 다시 켜도 바뀌지 않습니다. (음성채팅 가능)', '· 이 창을 닫으면 서버가 꺼집니다.']);
      }
      if (/provided tunnel token is not valid|invalid tunnel token|Unauthorized/i.test(text)) console.log('⚠ 터널 토큰이 올바르지 않습니다. 도메인 터널 설정.txt 의 토큰을 다시 복사해 넣어 주세요.');
      if (/failed to (dial|connect)|context deadline exceeded/i.test(text) && !ready) console.log('… 연결 재시도 중 (네트워크가 Cloudflare 연결을 막고 있을 수 있음)');
    };
    tunnel.stdout.on('data', onData);
    tunnel.stderr.on('data', onData);
    const timer = setTimeout(() => {
      if (!ready) box(['⚠ 60초가 지나도 내 도메인 터널이 연결되지 않습니다.', '· 도메인 터널 설정.txt 의 토큰이 맞는지 확인해 주세요.', '· 회사·학교 네트워크나 방화벽이 막고 있을 수 있습니다.', '· 자세한 기록을 보려면: set TUNNEL_DEBUG=1 후 npm run share']);
    }, 60000);
    tunnel.on('exit', (code) => {
      clearTimeout(timer);
      try { fs.unlinkSync(URL_FILE); } catch {}
      if (stopping) return;
      if (attempt < 5) { console.log(`\n⚠ 터널이 끊어졌습니다 (코드 ${code}). 5초 뒤 같은 주소로 다시 연결합니다…`); setTimeout(openNamed, 5000); }
      else box(['❌ 내 도메인 터널 연결에 5번 실패했습니다.', '토큰과 인터넷 연결을 확인해 주세요.', '같은 와이파이 친구는 아래 주소로 접속할 수 있습니다:', ...lan]);
    });
  };
  openNamed();
} else {
  let attempt = 0;
  const openTunnel = () => {
    attempt++;
    let url = null, ready = false;
    console.log(`\nCloudflare 터널을 여는 중… (${PROTOCOL} 방식, ${attempt}번째 시도) — 10~20초 정도 걸립니다`);
    const tunnel = spawn(bin, ['tunnel', '--no-autoupdate', '--protocol', PROTOCOL, '--url', `http://127.0.0.1:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(tunnel);
    const onData = (buf) => {
      const text = String(buf);
      if (process.env.TUNNEL_DEBUG) process.stdout.write(text);
      const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m && !url) { url = m[0]; console.log('주소를 받았습니다. 연결이 완료될 때까지 기다리는 중…'); }
      // 실제로 Cloudflare 에 연결되었을 때만 주소를 알려준다 (이전에 열면 Error 1033)
      if (/Registered tunnel connection|Connection [0-9a-f-]+ registered/i.test(text) && url && !ready) {
        ready = true;
        fs.writeFileSync(URL_FILE, url);
        box(['🎉 공유 서버가 열렸습니다! 이 주소를 친구들에게 보내세요:', '', `   ${url}`, '', '· 와이파이가 달라도, 어디서든 접속할 수 있습니다. (음성채팅 가능)', '· 이 창을 닫으면 서버와 주소가 함께 사라집니다.', '· 처음 몇 초는 접속이 안 될 수 있어요. 그럴 땐 새로고침!']);
      }
      if (/failed to (dial|connect)|connection refused|context deadline exceeded/i.test(text) && !ready) console.log('… 연결 재시도 중 (네트워크가 Cloudflare 연결을 막고 있을 수 있음)');
    };
    tunnel.stdout.on('data', onData);
    tunnel.stderr.on('data', onData);
    // 60초 안에 연결되지 않으면 알려주기
    const timer = setTimeout(() => {
      if (!ready) box(['⚠ 60초가 지나도 터널이 연결되지 않습니다.', '· 회사·학교 네트워크나 백신/방화벽이 Cloudflare 연결을 막고 있을 수 있습니다.', '· 다른 네트워크(휴대폰 핫스팟 등)에서 다시 시도해 보세요.', '· 자세한 기록을 보려면: set TUNNEL_DEBUG=1 후 npm run share']);
    }, 60000);
    tunnel.on('exit', (code) => {
      clearTimeout(timer);
      try { fs.unlinkSync(URL_FILE); } catch {}
      if (stopping) return;
      if (attempt < 5) { console.log(`\n⚠ 터널이 끊어졌습니다 (코드 ${code}). 5초 뒤 다시 연결합니다… (새 주소가 발급됩니다)`); setTimeout(openTunnel, 5000); }
      else box(['❌ 터널 연결에 5번 실패했습니다.', '인터넷 연결이나 방화벽 설정을 확인해 주세요.', '같은 와이파이 친구는 아래 주소로 접속할 수 있습니다:', ...lan]);
    });
  };
  openTunnel();
}
