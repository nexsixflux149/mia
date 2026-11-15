// Developer convenience: writes only this copy's isolated .remaster-data saves.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SCENARIOS} from '../server/scenarios.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=path.join(root,'.remaster-data');
const name='수정본테스터';
const changes={};for(const s of Object.values(SCENARIOS)){changes[s.saveKey(name)]=s.chapters.length-1;changes[s.saveKey(name)+':clear']=1;}
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({name,themes:Object.keys(SCENARIOS).length,chapters:Object.values(SCENARIOS).reduce((n,s)=>n+s.chapters.length,0),target:dir,changes},null,2));process.exit(0);}
fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'saves.json');let existing={};
if(fs.existsSync(file)){existing=JSON.parse(fs.readFileSync(file,'utf8'));fs.mkdirSync(path.join(dir,'backups'),{recursive:true});fs.copyFileSync(file,path.join(dir,'backups','saves-'+Date.now()+'.json'));}
fs.writeFileSync(file,JSON.stringify({...existing,...changes},null,2));
console.log(`테스트 전용 닉네임: ${name}\n이 닉네임에서 모든 테마·이어하기 챕터를 선택할 수 있습니다. 수정본 서버를 재시작하세요.\n운영 기록·data·DB는 변경하지 않았습니다.`);
