import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
let count = 0;
for (const dir of ['public/js', 'server', 'preview']) {
  for (const file of readdirSync(new URL(`../${dir}/`, import.meta.url)).filter(f => /\.(m?js)$/.test(f))) {
    const result = spawnSync(process.execPath, ['--check', `${dir}/${file}`], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) { console.error(result.stderr); process.exit(1); } count++;
  }
}
console.log(`Syntax valid: ${count} JavaScript modules (no bundle build is required).`);
