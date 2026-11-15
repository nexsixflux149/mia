# 게임 글꼴

게임에서 쓰는 글꼴 일곱 가지입니다. 모두 구글 글꼴의 **SIL Open Font License 1.1** 글꼴이고, 라이선스 파일(`*-OFL.txt`)을 함께 둡니다.

| 글꼴 | 굵기 | 쓰이는 곳 |
|---|---|---|
| Gowun Dodum | 400 | 화면 글씨 전체 · 닉네임 · 채팅 · 이름표 |
| Nanum Myeongjo | 400 · 800 | 이야기 · 제목 · 로고 |
| Nanum Pen Script · Gaegu · Do Hyeon | 400 / 400 · 700 / 400 | 쪽지 · 포스터 · 기념 사진 같은 손글씨 느낌 |

## 줄여 담은 파일

구글에서 받은 원본(글자 전체)은 합쳐서 3.2MB 였습니다. 게임에서 실제로 쓰는 글자만 남기고 hinting 을 빼서 **약 0.9MB**(첫 화면에 필요한 세 가지는 약 450KB)로 줄였습니다.

- 모든 글꼴: 게임 글(`server/*.js` · `public/js/*.js` · `index.html` · `style.css` 에 든 글자) + 영문 · 숫자 · 문장부호 · 자모(ㅋㅋ ㅠㅠ)
- Gowun Dodum 만 자주 쓰는 한글 2,350자(KS X 1001)를 더 넣었습니다 — 닉네임 · 채팅에 어떤 글자가 와도 같은 글꼴로 보이게.
- 게임 글에 없는 한글은 시스템 글꼴로 보입니다 (깨지지는 않습니다).
- 파일 이름 끝의 8자리는 내용 해시입니다. 서버는 `.woff2` 를 1년 동안 캐시하도록 보내므로, 내용이 바뀌면 이름도 바뀌어야 새로 받습니다.
- 출처 주소 · 원본 sha256 · 결과 sha256 은 `sources.json` 에 있습니다.

## 다시 만들기

게임 글에 새 한글이 많이 늘었을 때 한 번 돌리면 됩니다 (안 돌려도 동작에는 문제가 없습니다).

```bash
pip install fonttools brotli
python scripts/build-fonts.py --download            # 원본을 받아 와서 (sha256 확인) 다시 만든다
python scripts/build-fonts.py --src 원본폴더          # 이미 받아 둔 원본(.ttf 또는 전체 글자 .woff2)으로
```

`public/fonts/` 의 woff2 · `fonts.css` · `sources.json` 과 `index.html` 의 첫 화면 preload 주소가 함께 바뀝니다.
