# PyInstaller 빌드 정의. app/ 에서 실행한다.
#
#     pyinstaller packaging/stockwhy.spec
#
# 명령줄 옵션 대신 spec 파일을 두는 이유는, 어떤 것을 일부러 뺐는지를 주석으로
# 남길 수 있어서다. 옵션 나열만으로는 왜 빠졌는지가 남지 않는다.

from pathlib import Path

APP = Path(SPECPATH).parent          # app/

a = Analysis(
    [str(APP / "packaging" / "entry.py")],
    pathex=[str(APP)],
    # 화면(index.html, 아이콘, 서비스워커)은 실행 파일 안에 같이 넣는다.
    datas=[(str(APP / "server" / "static"), "server/static")],
    hiddenimports=[
        # 둘 다 try/except import 안에 있어 정적 분석으로는 잡히지만,
        # 빠지면 사내망에서 인증서 오류로 아무것도 안 되므로 못박아 둔다.
        "truststore",
        "dotenv",
    ],
    excludes=[
        # 서버는 lite.py(표준 라이브러리)를 쓴다. FastAPI/uvicorn 은 컴파일
        # 확장을 잔뜩 끌고 와서 파일만 커지고 백신 오탐도 늘어난다.
        "fastapi", "uvicorn", "starlette", "pydantic", "pydantic_core",
        # anthropic SDK 도 뺀다. llm.py 는 SDK 가 없으면 httpx 로 같은 API 를
        # 직접 호출하도록 이미 되어 있어서, 빠져도 기능 차이가 없다.
        "anthropic",
        # 테스트/노트북/과학계산 계열이 딸려오는 것을 막는다.
        "pytest", "numpy", "PIL", "tkinter.test", "test",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

# binaries/datas 를 EXE 에 함께 넘기고 COLLECT 를 두지 않으면 onefile 이 된다.
# 폴더째 배포하면 "어느 파일을 눌러야 하지?"가 생기므로 파일 하나로 만든다.
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="stockwhy",
    icon=str(APP / "packaging" / "stockwhy.ico"),
    # 콘솔 없이 뜬다 — PowerShell 을 안 쓰는 것이 이 빌드의 목적이다.
    console=False,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,          # UPX 압축은 백신 오탐을 크게 늘린다
    runtime_tmpdir=None,
)
