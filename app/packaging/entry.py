"""실행 파일 진입점.

PyInstaller 는 `python -m server.desktop` 같은 모듈 실행을 그대로 묶지 못해서
평범한 스크립트 하나가 필요하다. 하는 일은 데스크톱 앱을 부르는 것뿐이다.
"""

from __future__ import annotations

import sys

from server.desktop import main

if __name__ == "__main__":
    sys.exit(main())
