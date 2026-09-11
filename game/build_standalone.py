#!/usr/bin/env python3
"""index.html + css + js를 하나의 HTML 파일로 합친다.

압축을 안 풀고 열거나 파일 하나만 메신저로 주고받아도 그대로 실행되도록,
외부 파일 참조가 전혀 없는 단일 HTML(mole-farm.html)을 만든다.

사용법:  python3 build_standalone.py
"""
import base64
import pathlib
import re

HERE = pathlib.Path(__file__).parent
OUT = HERE / 'mole-farm.html'

SCRIPTS = [
    'js/config.js', 'js/util.js', 'js/audio.js', 'js/market.js',
    'js/game.js', 'js/render.js', 'js/ui.js', 'js/input.js', 'js/main.js',
]


def read(rel):
    return (HERE / rel).read_text(encoding='utf-8')


def main():
    html = read('index.html')

    # 1) 아이콘은 data URI로 심는다 (별도 파일 없이 탭 아이콘 표시)
    icon_b64 = base64.b64encode(read('icon.svg').encode('utf-8')).decode('ascii')
    icon_uri = 'data:image/svg+xml;base64,' + icon_b64
    html = html.replace('href="icon.svg"', 'href="%s"' % icon_uri)

    # 2) PWA 매니페스트/서비스워커는 단일 파일에선 쓸 수 없으므로 참조 제거
    html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html)

    # 3) CSS 인라인
    css = read('css/style.css')
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css">',
        '<style>\n' + css + '\n</style>')

    # 4) JS 인라인 (로드 순서 그대로)
    bundle = []
    for rel in SCRIPTS:
        bundle.append('/* ===== %s ===== */\n%s' % (rel, read(rel)))
    first = '<script src="%s"></script>' % SCRIPTS[0]
    html = html.replace(first, '<script>\n' + '\n'.join(bundle) + '\n</script>')
    for rel in SCRIPTS[1:]:
        html = html.replace('<script src="%s"></script>\n' % rel, '')
        html = html.replace('<script src="%s"></script>' % rel, '')

    banner = ('<!-- 이 파일은 build_standalone.py가 game/ 폴더의 소스를 합쳐 만든 '
              '단일 실행 파일입니다. 직접 수정하지 말고 원본(js/, css/)을 고친 뒤 '
              '다시 생성하세요. -->\n')
    html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + banner, 1)

    OUT.write_text(html, encoding='utf-8')
    left = re.findall(r'(?:src|href)="(?!data:)([^"#]+)"', html)
    print('생성 완료:', OUT, '(%.0f KB)' % (OUT.stat().st_size / 1024))
    print('남은 외부 참조:', left if left else '없음 ✅')


if __name__ == '__main__':
    main()
