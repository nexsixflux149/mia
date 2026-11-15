"""Reproduce the original seven webfont faces as local, losslessly encoded WOFF2 files.
Requires fonttools[woff] (fontTools + brotli). Fonts and SIL OFL licenses: Google Fonts.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
from fontTools.ttLib import TTFont
import hashlib, io, json
ROOT=Path(__file__).resolve().parent/'fonts'
BASE='https://raw.githubusercontent.com/google/fonts/main/ofl/'
FACES=[('gowundodum','GowunDodum-Regular.ttf','gowun-dodum-400'),('nanummyeongjo','NanumMyeongjo-Regular.ttf','nanum-myeongjo-400'),('nanummyeongjo','NanumMyeongjo-ExtraBold.ttf','nanum-myeongjo-800'),('nanumpenscript','NanumPenScript-Regular.ttf','nanum-pen-script-400'),('gaegu','Gaegu-Regular.ttf','gaegu-400'),('gaegu','Gaegu-Bold.ttf','gaegu-700'),('dohyeon','DoHyeon-Regular.ttf','do-hyeon-400')]
def font(row):
 family,name,target=row;url=BASE+family+'/'+name
 data=urlopen(url,timeout=40).read();f=TTFont(io.BytesIO(data));f.flavor='woff2';out=ROOT/(target+'.woff2');f.save(out)
 print(out.name,out.stat().st_size,'bytes',flush=True)
 return {'file':out.name,'source':url,'source_sha256':hashlib.sha256(data).hexdigest(),'woff2_sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
def license(family):
 data=urlopen(BASE+family+'/OFL.txt',timeout=40).read();(ROOT/(family+'-OFL.txt')).write_text('\n'.join(line.rstrip() for line in data.decode('utf-8').splitlines())+'\n')
ROOT.mkdir(exist_ok=True)
with ThreadPoolExecutor(max_workers=7) as pool:manifest=list(pool.map(font,FACES))
with ThreadPoolExecutor(max_workers=5) as pool:list(pool.map(license,sorted({r[0] for r in FACES})))
(ROOT/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
