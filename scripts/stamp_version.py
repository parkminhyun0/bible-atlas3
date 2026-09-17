#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""모든 모듈 주소에 버전 도장을 찍는다.

## 왜 필요한가

GitHub Pages 는 `Cache-Control: max-age=600` 을 보낸다. 그래서 고쳐 올려도
**10분 동안 브라우저가 옛 모듈을 쓴다.** 실제로 겪었다 — 글꼴 출처를 고쳐
배포까지 성공했는데 화면은 그대로였고, 새 탭을 열어도 마찬가지였다
(HTTP 캐시는 탭 사이에 공유된다). 서버에는 새 파일이 있고 화면에는 옛 코드가
도는 상태라, **무엇을 고쳤는지 확인할 방법이 없어진다.**

조사 보고서(노션 21번)가 "타일 파일명에 버전을 박아라" 라고 한 것과 같은
까닭이며, 코드에도 그대로 걸린다.

## 어떻게

`index.html` 과 `src/**/*.js` 안의 **상대 import 주소**에 `?v=<해시>` 를 붙인다.
해시는 `src/` 전체 내용에서 뽑으므로, 코드가 바뀌면 주소가 바뀌고 브라우저가
새로 받는다. 코드가 그대로면 주소도 그대로라 캐시가 그대로 쓰인다.

원본 파일은 고치지 않는다 — `dist/` 에 도장 찍힌 사본을 만든다.
"""

import hashlib
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
DIST = ROOT / 'dist'

# './x.js' · '../y/z.js' 꼴만. 절대 URL(https://…)은 건드리지 않는다.
IMPORT_RE = re.compile(r"""(from\s+|import\s+)(['"])(\.\.?/[^'"]+?\.js)(['"])""")
HTML_RE = re.compile(r"""(<script[^>]*\ssrc=")(src/[^"]+?\.js)(")""")


def version_of():
    h = hashlib.sha256()
    for p in sorted(SRC.rglob('*')):
        if p.is_file():
            h.update(p.relative_to(ROOT).as_posix().encode())
            h.update(p.read_bytes())
    return h.hexdigest()[:10]


def stamp_js(text, ver):
    return IMPORT_RE.sub(lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}?v={ver}{m.group(4)}',
                         text)


def main():
    ver = version_of()
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    # src/ 를 도장 찍어 옮긴다
    n = 0
    for p in sorted(SRC.rglob('*')):
        rel = p.relative_to(ROOT)
        out = DIST / rel
        if p.is_dir():
            out.mkdir(parents=True, exist_ok=True)
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        if p.suffix == '.js':
            out.write_text(stamp_js(p.read_text(encoding='utf-8'), ver), encoding='utf-8')
            n += 1
        else:
            shutil.copy2(p, out)

    # index.html 의 진입 모듈에도 찍는다
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = HTML_RE.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={ver}{m.group(3)}', html)
    (DIST / 'index.html').write_text(html, encoding='utf-8')

    # 자료는 그대로 옮긴다 (AOI 파일은 build_aoi.py 가 만든다)
    if (ROOT / 'data').exists():
        shutil.copytree(ROOT / 'data', DIST / 'data')

    print('버전 %s · js %d개에 도장을 찍었다 → %s' % (ver, n, DIST))
    return 0


if __name__ == '__main__':
    sys.exit(main())
