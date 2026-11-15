import './build-client.mjs';
import {spawnSync} from 'node:child_process';
for(const python of ['python3','python']){
 const probe=spawnSync(python,['--version'],{stdio:'ignore'});if(probe.status!==0)continue;
 const result=spawnSync(python,['release/package.py'],{stdio:'inherit',env:process.env});process.exit(result.status??1);
}
console.error('Packaging requires Python 3. Running the downloaded package only requires Node.js.');process.exit(1);
