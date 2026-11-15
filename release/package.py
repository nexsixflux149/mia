"""Package tracked source plus the generated client. Never collect env/save files."""
from pathlib import Path
import subprocess,zipfile,json,hashlib,os
ROOT=Path(__file__).resolve().parent.parent
OUT=Path(os.environ.get('MIA_RELEASE_OUT',ROOT/'release-output'));OUT.mkdir(parents=True,exist_ok=True)
files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
files=[f for f in files if f and (ROOT/f).is_file()]
client=[p for p in (ROOT/'.remaster-client').rglob('*') if p.is_file()]
for name in files:
 assert not any(part in ['.env','.env.local','data','.remaster-data','.preview-data','node_modules'] for part in Path(name).parts),name
archive=OUT/'mia-full-remaster.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(ROOT/name,'mia-remaster/'+name)
 for p in client:z.write(p,'mia-remaster/'+p.relative_to(ROOT).as_posix())
 z.writestr('mia-remaster/수정본 안내.txt','실행: Node.js 설치 후 release/수정본실행.bat\n접속: http://localhost:3200/\n기존 운영 폴더에 덮어쓰지 말고 새 폴더에서 실행하세요.\n상세: release/README.md\n')
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
original=OUT/'mia-original-code-backup.zip'
if not original.exists():
 subprocess.check_call(['git','archive','--format=zip','--prefix=mia-original/','--output='+str(original),'origin/main'],cwd=ROOT)
bundle=OUT/'mia-backup-and-remaster.zip'
with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as z:
 for p in [archive,original,OUT/'backup-manifest.json']:
  if p.exists():z.write(p,p.name)
 for p in (OUT/'live-public-snapshot').rglob('*'):
  if p.is_file():z.write(p,p.relative_to(OUT).as_posix())
 z.write(ROOT/'release/README.md','실행 및 복구 안내.md')
 z.write(ROOT/'release/TEST-RESULTS.md','검증 결과.md')
 z.writestr('먼저 읽어주세요.txt','mia-full-remaster.zip을 새 폴더에 풀고 release/수정본실행.bat을 실행하세요.\n기존 운영 웹사이트는 변경하지 않았습니다.\n원본 코드 백업: mia-original-code-backup.zip\n운영 DB와 비밀 환경설정은 이 백업에 포함되지 않습니다.\n')
manifest={}
for p in [archive,original,bundle]:manifest[p.name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT/'package-checksums.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'files':len(files),'client_files':len(client),'artifacts':manifest},ensure_ascii=False))
