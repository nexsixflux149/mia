# Original MIA fonts

These are the five original font families and seven faces requested by public/index.html:
Gowun Dodum 400, Nanum Myeongjo 400/800, Nanum Pen Script 400, Gaegu 400/700, Do Hyeon 400.

The original Google Fonts TrueType files are packaged losslessly as full-glyph WOFF2, without changing outlines or typography. Each family's SIL Open Font License is included. Source URLs and checksums are recorded in sources.json.

To reproduce: install fonttools[woff] (including brotli) in a Python environment, then run `python preview/mobile/fetch-fonts.py` from the repository. Python tooling is only required to regenerate fonts; running/building the game uses the committed WOFF2 files.
