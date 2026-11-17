const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const reflection = [[3, 2, 1, 0], [1, 0, 3, 2]];

export function traceXmasMirrors({ size, source, receiver, mirrors, blocks }, orientation) {
  const path = [source.slice(0, 2)];
  const valid = Array.isArray(orientation) && orientation.length === mirrors.length && orientation.every(n => n === 0 || n === 1);
  if (!valid) return { path, solved: false };
  const visited = new Set();
  const touched = new Set();
  let [x, y, d] = source;
  while (true) {
    x += directions[d][0];
    y += directions[d][1];
    const key = x + ',' + y + ',' + d;
    if (x < 0 || y < 0 || x >= size || y >= size || visited.has(key)) break;
    path.push([x, y]);
    if (x === receiver[0] && y === receiver[1]) return { path, solved: touched.size === mirrors.length };
    if (blocks.some(([bx, by]) => bx === x && by === y)) break;
    visited.add(key);
    const mirror = mirrors.findIndex(([mx, my]) => mx === x && my === y);
    if (mirror >= 0) {
      touched.add(mirror);
      d = reflection[orientation[mirror]][d];
    }
  }
  return { path, solved: false };
}

export function xmasMirrorPanel(optics, { click, submit }) {
  const wrap = document.createElement('div');
  const grid = document.createElement('div');
  const status = document.createElement('p');
  const actions = document.createElement('div');
  const send = document.createElement('button');
  const clear = document.createElement('button');
  const { size, source, receiver, mirrors, blocks } = optics;
  const orientation = mirrors.map(() => 1);
  const cells = [];
  grid.style.cssText = 'display:grid;gap:4px;width:min(100%,390px);margin:12px auto;padding:7px;background:#080c14;border:1px solid #9a7957;border-radius:12px;';
  grid.style.gridTemplateColumns = 'repeat(' + size + ',1fr)';
  function draw() {
    const trace = traceXmasMirrors(optics, orientation);
    const beam = new Set(trace.path.map(p => p.join(',')));
    cells.forEach(({ b, x, y, mirror, label, blocked }) => {
      b.textContent = mirror < 0 ? label : orientation[mirror] === 0 ? '╱' : '╲';
      b.style.background = blocked ? '#080912' : beam.has(x + ',' + y) ? '#73501e' : '#182438';
      b.style.color = beam.has(x + ',' + y) ? '#fff1ae' : '#c8e8ff';
      if (mirror >= 0) b.setAttribute('aria-label', '거울 ' + (mirror + 1) + ', ' + (orientation[mirror] === 0 ? '오른쪽 위로 기울어짐' : '오른쪽 아래로 기울어짐'));
    });
    status.textContent = trace.solved ? '수신기 점등 · 전송할 수 있습니다.' : '→ 발신기 · ◎ 수신기 · ▪ 차광판';
    send.disabled = !trace.solved;
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const mirror = mirrors.findIndex(([mx, my]) => mx === x && my === y);
    const blocked = blocks.some(([bx, by]) => bx === x && by === y);
    const label = x === source[0] && y === source[1] ? '→' : x === receiver[0] && y === receiver[1] ? '◎' : blocked ? '▪' : '·';
    const b = document.createElement(mirror >= 0 ? 'button' : 'span');
    b.style.cssText = 'display:grid;place-items:center;aspect-ratio:1;border:1px solid #35465c;border-radius:5px;font:bold 20px monospace;min-width:0;padding:0;';
    if (mirror >= 0) {
      b.type = 'button';
      b.style.cursor = 'pointer';
      b.onclick = () => { orientation[mirror] ^= 1; click(); draw(); };
    }
    grid.append(b);
    cells.push({ b, x, y, mirror, label, blocked });
  }
  status.setAttribute('aria-live', 'polite');
  status.style.cssText = 'text-align:center;color:#ffe0a4;margin:12px 0;';
  actions.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:0 0 8px;';
  send.className = 'btn primary'; send.textContent = '광신호 전송'; send.type = 'button';
  clear.className = 'btn'; clear.textContent = '초기화'; clear.type = 'button';
  send.onclick = () => { if (!send.disabled) submit([...orientation]); };
  clear.onclick = () => { orientation.fill(1); click(); draw(); };
  actions.append(clear, send);
  wrap.append(grid, status, actions);
  draw();
  return wrap;
}
