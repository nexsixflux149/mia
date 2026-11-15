import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=path.resolve(process.env.MIA_RELEASE_OUT||'release-output');fs.mkdirSync(out,{recursive:true});
const ref=execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim();
execFileSync('git',['archive','--format=zip','--prefix=mia-original/','--output='+path.join(out,'mia-original-code-backup.zip'),ref]);
const files=execFileSync('git',['ls-tree','-r','--name-only',ref,'public'],{encoding:'utf8'}).trim().split('\n');
const snapshot=path.join(out,'live-public-snapshot');fs.mkdirSync(snapshot,{recursive:true});
const manifest={source_ref:ref,origin:'https://mia-escape.kr',captured_at:new Date().toISOString(),scope:'Public client assets and repository source only; production server runtime, secrets and database are not backed up.',files:[]};
for(const file of files){const relative=file.slice('public/'.length);const url='https://mia-escape.kr/'+(relative==='index.html'?'':relative);const dest=path.join(snapshot,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});const r=spawnSync('curl',['-fsSL','--connect-timeout','10','--max-time','25',url,'-o',dest],{encoding:'utf8'});if(r.status!==0){manifest.files.push({file:relative,status:'unavailable'});continue}const data=fs.readFileSync(dest),source=execFileSync('git',['show',ref+':'+file]);manifest.files.push({file:relative,sha256:createHash('sha256').update(data).digest('hex'),matches_repository:Buffer.compare(data,source)===0});}
fs.writeFileSync(path.join(out,'backup-manifest.json'),JSON.stringify(manifest,null,2));fs.writeFileSync('release/backup-records/backup-manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({publicFiles:manifest.files.length,matching:manifest.files.filter(f=>f.matches_repository).length,unavailable:manifest.files.filter(f=>f.status==='unavailable').length}));
