#!/usr/bin/env python3
"""게임 글꼴 줄여 담기 (public/fonts/)

구글 글꼴(SIL OFL)의 원본에서, 게임에 실제로 쓰는 글자만 남겨 woff2 로 만든다.
  · 게임 글(server/*.js · public/js/*.js · index.html · style.css 에 들어 있는 글자) — 모든 글꼴
  · 자주 쓰는 한글 2,350자(KS X 1001) + 자모 — 본문 글꼴(Gowun Dodum): 닉네임 · 채팅에 어떤 글자가 와도 같은 글꼴로 보이게
  · hinting 은 뺀다 (화면 글꼴로 충분하고 파일이 많이 줄어든다)
파일 이름에 내용 해시(sha256 앞 8자)를 붙이고, fonts.css · index.html 의 preload · sources.json 을 함께 고친다.
서버는 .woff2 를 1년 동안 캐시하도록 보내므로, 글꼴 내용이 바뀌면 이름도 바뀌어야 새로 받는다.

사용법 (한 번만):  pip install fonttools brotli
  python scripts/build-fonts.py --src 원본폴더        # 원본 글꼴(.ttf 또는 전체 글자 .woff2)이 든 폴더
  python scripts/build-fonts.py --download            # sources.json 의 주소에서 원본 .ttf 를 받아 와서 (sha256 확인)
게임 글에 새 한글이 늘었을 때 다시 돌리면 된다. 안 돌려도 글자가 깨지지는 않고, 없는 글자만 시스템 글꼴로 보인다.
"""
import argparse, glob, hashlib, json, os, re, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FONTS = os.path.join(ROOT, 'public', 'fonts')
# (파일 이름 줄기, 글꼴 이름, 굵기, 글자 집합, 원본 주소, 원본 .ttf 의 sha256)
FACES = [
    ('gowun-dodum-400', 'Gowun Dodum', 400, 'full',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/gowundodum/GowunDodum-Regular.ttf',
     'a6e457933227483a11758fd0947bc74422a106d46f0bf057fdaa5af94a30067d'),
    ('nanum-myeongjo-400', 'Nanum Myeongjo', 400, 'game',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/nanummyeongjo/NanumMyeongjo-Regular.ttf',
     '7ed9e8653a8ed04285d51dc343ffea6eb3d9c73afc27383ea8929ee4ffd03205'),
    ('nanum-myeongjo-800', 'Nanum Myeongjo', 800, 'game',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/nanummyeongjo/NanumMyeongjo-ExtraBold.ttf',
     '60c0077fce069ba90ae97c0a3679f6eb3712e0ca637bdd0c15b72d335ec46db7'),
    ('nanum-pen-script-400', 'Nanum Pen Script', 400, 'game',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/nanumpenscript/NanumPenScript-Regular.ttf',
     '6f0d1ab29c7894010dc88831fb7a0a51edb79136e450344183de5b1a8b52bd43'),
    ('gaegu-400', 'Gaegu', 400, 'game',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/gaegu/Gaegu-Regular.ttf',
     'aa52c98336f7c62e2896fc8b12b56a75d5b476d88a2f104b0980f4f7ce0adfc3'),
    ('gaegu-700', 'Gaegu', 700, 'game',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/gaegu/Gaegu-Bold.ttf',
     'cc38a4af9506a45254d1ce07c589ec473d9e5f0be319e5a77b17c214903f8c1c'),
    ('do-hyeon-400', 'Do Hyeon', 400, 'game',
     'https://raw.githubusercontent.com/google/fonts/main/ofl/dohyeon/DoHyeon-Regular.ttf',
     '35644be7f28e0a68a447b1f7af351dcde5674b870f24f7b5f43e26d00b4ab653'),
]
PRELOAD = ['gowun-dodum-400', 'nanum-myeongjo-800', 'nanum-myeongjo-400']  # 첫 화면(스플래시 · 로그인)에 쓰는 글꼴


def sha(b): return hashlib.sha256(b).hexdigest()


def charsets():
    src = glob.glob(os.path.join(ROOT, 'server', '*.js')) + glob.glob(os.path.join(ROOT, 'public', 'js', '*.js')) + [os.path.join(ROOT, 'public', 'index.html'), os.path.join(ROOT, 'public', 'css', 'style.css')]
    used = set()
    for f in src: used |= {ord(c) for c in open(f, encoding='utf-8').read()}
    used = {c for c in used if c >= 0x20 and c not in (0x200d, 0xfe0f)}
    ksx = set()  # KS X 1001 한글 2,350자
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try:
                ch = bytes([hi, lo]).decode('euc_kr')
                if 0xAC00 <= ord(ch) <= 0xD7A3: ksx.add(ord(ch))
            except Exception: pass
    common = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | set(range(0x2010, 0x2050)) | set(range(0x3000, 0x3040)) | set(range(0xFF01, 0xFF5F)) | set(range(0x3131, 0x318F))
    game = common | used
    return {'game': sorted(game), 'full': sorted(game | ksx)}


def find_source(stem, url, want_sha, src_dir, download, tmp):
    base = os.path.basename(url)
    for name in (base, stem + '.woff2', stem + '.ttf'):
        p = os.path.join(src_dir, name) if src_dir else None
        if p and os.path.exists(p): return p
    if download:
        p = os.path.join(tmp, base); urllib.request.urlretrieve(url, p)
        if sha(open(p, 'rb').read()) != want_sha: sys.exit(f'{base}: 내려받은 파일의 sha256 이 맞지 않습니다')
        return p
    sys.exit(f'{stem}: 원본 글꼴을 찾지 못했습니다 (--src 폴더에 {base} 를 두거나 --download)')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', help='원본 글꼴이 든 폴더'); ap.add_argument('--download', action='store_true'); ap.add_argument('--out', default=FONTS, help='결과 폴더 (기본: public/fonts)')
    a = ap.parse_args()
    try:
        from fontTools import subset
    except ImportError:
        sys.exit('fonttools 와 brotli 가 필요합니다:  pip install fonttools brotli')
    import tempfile
    sets = charsets(); os.makedirs(a.out, exist_ok=True); tmp = tempfile.mkdtemp(); meta = []
    for stem, family, weight, cs, url, want in FACES:
        srcp = find_source(stem, url, want, a.src, a.download, tmp)
        opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['kern', 'locl', 'ccmp', 'liga', 'calt']; opts.notdef_outline = True; opts.name_IDs = ['*']; opts.drop_tables += ['DSIG']; opts.hinting = False
        font = subset.load_font(srcp, opts); ss = subset.Subsetter(opts); ss.populate(unicodes=sets[cs]); ss.subset(font)
        tmpf = os.path.join(tmp, stem + '.woff2'); subset.save_font(font, tmpf, opts)
        data = open(tmpf, 'rb').read(); h = sha(data); fn = f'{stem}.{h[:8]}.woff2'
        for old in glob.glob(os.path.join(a.out, stem + '.*.woff2')):
            if os.path.basename(old) != fn: os.remove(old)
        open(os.path.join(a.out, fn), 'wb').write(data)
        meta.append(dict(file=fn, family=family, weight=weight, charset=cs, glyph_codepoints=len(sets[cs]), bytes=len(data), sha256=h, source=url, source_sha256=want))
        print(f'{fn:44} {len(data) / 1024:6.0f}KB  ({cs})')
    css = ["/* 게임에서 쓰는 글꼴 일곱 가지 (모두 SIL Open Font License · 라이선스 파일 함께 있음)",
           "   구글 글꼴 원본에서 게임에 쓰는 글자만 남겨 줄여 담았다 (hinting 제거). 다시 만들기: scripts/build-fonts.py · public/fonts/README.md",
           "   파일 이름의 해시가 바뀌면 브라우저가 새로 받는다 (서버는 .woff2 를 1년 캐시). 게임 글에 없는 한글은 시스템 글꼴로 보인다. */"]
    for m in meta: css.append(f"@font-face{{font-family:'{m['family']}';font-style:normal;font-weight:{m['weight']};font-display:swap;src:url('./{m['file']}') format('woff2')}}")
    open(os.path.join(a.out, 'fonts.css'), 'w', encoding='utf-8').write('\n'.join(css) + '\n')
    json.dump(meta, open(os.path.join(a.out, 'sources.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    idx = os.path.join(ROOT, 'public', 'index.html')
    if a.out == FONTS and os.path.exists(idx):  # index.html 의 첫 화면 preload 주소도 새 해시로
        html = open(idx, encoding='utf-8').read(); by = {m['file'].rsplit('.', 2)[0]: m['file'] for m in meta}
        for stem in PRELOAD: html = re.sub(rf'/fonts/{re.escape(stem)}\.[0-9a-f]{{8}}\.woff2', '/fonts/' + by[stem], html)
        open(idx, 'w', encoding='utf-8').write(html)
    print(f'합계 {sum(m["bytes"] for m in meta) / 1024:.0f}KB')


if __name__ == '__main__': main()
