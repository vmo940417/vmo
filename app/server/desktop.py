"""데스크톱 앱 — 터미널 없이 아이콘만 눌러서 쓰는 버전.

PowerShell 을 열고 명령을 치는 과정 자체가 이 앱을 매일 쓰는 데 가장 큰 걸림돌이다.
그래서 .exe 하나로 묶어 더블클릭만 하면 되게 만든다. 실행하면:

  1. 127.0.0.1 에만 서버를 띄우고 (외부에서 접근 불가)
  2. 기본 브라우저로 화면을 열고
  3. 작은 창 하나를 남겨 상태 표시 / 설정 / 종료를 제공한다

화면 자체는 브라우저를 쓴다. 창 안에 웹뷰를 심으려면 외부 패키지(pywebview 등)가
필요한데, 그러면 사내 PC 에서 설치가 막히거나 백신에 걸릴 확률이 올라간다.
표준 라이브러리(tkinter)만으로 껍데기를 만들고 화면은 브라우저에 맡기면
의존성이 늘지 않는다.

    python -m server.desktop           # 소스에서 실행
    stockwhy.exe                       # 묶은 실행 파일

서버는 lite.py 를 그대로 쓴다. FastAPI/uvicorn 은 컴파일 확장을 끌고 와서
실행 파일이 무거워지고 백신 오탐도 늘어난다.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from http.server import ThreadingHTTPServer
from typing import Optional

from .config import (
    access_token,
    has_api_key,
    load_env,
    model_name,
    save_user_env,
    setup_tls,
    user_env_path,
)
from . import lite
from .lite import make_server

HOST = "127.0.0.1"
# 매번 같은 주소여야 즐겨찾기가 유지된다. 이미 쓰는 프로그램이 있으면 다음 번호로.
PORTS = (8765, 8766, 8767, 8768)
TITLE = "장중 시세 원인 분석"


# --------------------------------------------------------------------------
# 서버 기동
# --------------------------------------------------------------------------

def _health(port: int, timeout: float = 0.8) -> Optional[dict]:
    """그 포트에 떠 있는 게 이 앱인지 확인한다."""
    try:
        with urllib.request.urlopen(
                f"http://{HOST}:{port}/api/health", timeout=timeout) as r:
            data = json.loads(r.read().decode("utf-8"))
        return data if isinstance(data, dict) and data.get("ok") else None
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError):
        return None


def _health_with_retry(port: int, attempts: int = 15, interval: float = 0.2) -> Optional[dict]:
    """방금 바인딩에서 이긴 프로세스가 아직 accept 루프를 못 돌렸을 수 있어 잠깐 기다린다."""
    for _ in range(attempts):
        data = _health(port)
        if data:
            return data
        time.sleep(interval)
    return None


def claim_port() -> tuple[Optional[int], Optional[ThreadingHTTPServer], Optional[int]]:
    """(우리가 점유한 포트, 그 서버, 이미 떠 있는 우리 앱의 포트) 중 해당하는 것만 채워 돌려준다.

    예전에는 "포트가 비어있나 확인 -> 비어있으면 바인딩" 두 단계였다. Windows
    SmartScreen 경고 때문에 exe 를 다시 눌러 두 프로세스가 몇 밀리초 차이로
    거의 동시에 뜨면, 둘 다 확인 시점에 "비어있다"고 보고 각자 창을 띄우는 틈이
    있었다 — 실제로 그 증상(작은 창이 두 개, 하나를 닫으면 브라우저가 먹통)이
    보고됐다.

    소켓 bind() 자체는 OS 가 원자적으로 처리한다. 그래서 확인 없이 바로
    바인딩을 시도하고, 실패(OSError)했을 때만 "누가 먼저 가져갔다"고 판단하면
    이 틈이 사라진다 — 동시에 시도해도 정확히 하나만 성공한다.
    """
    for port in PORTS:
        try:
            httpd = make_server(port, HOST)
        except OSError:
            # 이미 누가 물고 있다. 방금 이긴 우리 자신의 다른 프로세스일 수도,
            # 전혀 다른 프로그램일 수도 있다.
            existing = _health_with_retry(port)
            if existing:
                return None, None, port
            continue
        else:
            return port, httpd, None
    return None, None, None


def _spawn(httpd: ThreadingHTTPServer) -> threading.Thread:
    thread = threading.Thread(target=httpd.serve_forever, daemon=True, name="stockwhy-http")
    thread.start()
    return thread


def start_server(port: int) -> tuple[ThreadingHTTPServer, threading.Thread]:
    """지정한 포트에 그대로 바인딩한다(테스트·픽스처용). 단일 인스턴스 판단은
    claim_port() 의 몫이고, 여기는 포트가 이미 정해진 뒤의 순수 기동만 한다."""
    # 브라우저 화면에서 앱을 끌 수 있게 한다. 창을 작업표시줄로 내려두고 쓰는 게
    # 기본이라, 끄는 수단이 창에만 있으면 그걸 다시 찾아 올려야 한다.
    lite.ALLOW_QUIT = True
    httpd = make_server(port, HOST)
    return httpd, _spawn(httpd)


def app_url(port: int) -> str:
    token = access_token()
    return f"http://{HOST}:{port}/" + (f"?t={token}" if token else "")


# --------------------------------------------------------------------------
# 창
# --------------------------------------------------------------------------

BG = "#0e1116"
FG = "#e6e9ef"
DIM = "#8b93a1"
ACCENT = "#d6a44c"


class Window:
    """상태 표시 + 설정 + 종료.

    분석 화면이 아니다. 브라우저를 닫아도 서버는 계속 돌아야 하고, 그걸 끄는
    수단이 어딘가에는 있어야 한다. 콘솔 없이 띄우면 Ctrl+C 를 쓸 수 없어서
    작업 관리자로 죽이는 것 말고는 방법이 없어지기 때문이다.
    """

    def __init__(self, tk, port: int, httpd: Optional[ThreadingHTTPServer] = None):
        self.tk = tk
        self.port = port
        self.httpd = httpd
        self.root = tk.Tk()
        self.root.title(TITLE)
        self.root.configure(bg=BG)
        self.root.geometry("460x430")
        self.root.minsize(420, 400)
        self._build()
        self.root.protocol("WM_DELETE_WINDOW", self.quit)

    # -- 구성 -------------------------------------------------------------

    def _label(self, parent, text, size=10, color=FG, **kw):
        return self.tk.Label(parent, text=text, bg=BG, fg=color,
                             font=("Malgun Gothic", size), **kw)

    def _build(self) -> None:
        tk = self.tk
        pad = {"padx": 20}

        self._label(self.root, TITLE, size=14).pack(anchor="w", pady=(18, 2), **pad)
        self._label(self.root, app_url(self.port), size=9, color=ACCENT).pack(anchor="w", **pad)

        row = tk.Frame(self.root, bg=BG)
        row.pack(anchor="w", pady=(14, 6), **pad)
        tk.Button(row, text="앱 열기", command=self.open_browser, width=12).pack(side="left")
        tk.Button(row, text="진단", command=self.diagnose, width=8).pack(side="left", padx=(8, 0))
        tk.Button(row, text="종료", command=self.quit, width=8).pack(side="left", padx=(8, 0))

        tk.Frame(self.root, bg="#252a33", height=1).pack(fill="x", pady=(12, 12), **pad)

        self._label(self.root, "설정", size=11).pack(anchor="w", **pad)
        self._label(self.root,
                    "Claude API 키를 비워두면 규칙 기반 분석만 합니다.\n"
                    "분해·타이밍·수급·뉴스는 키 없이도 그대로 나옵니다.\n"
                    "KRX 아이디/비밀번호를 비워두면 개별종목 공매도만 빠집니다\n"
                    "(본인 KRX Data Marketplace 로그인 계정 — 자동 로그인 수집이라 과도하게\n"
                    "쓰면 계정이 제재될 수 있습니다).",
                    size=8, color=DIM, justify="left").pack(anchor="w", pady=(2, 8), **pad)

        self.fields: dict[str, object] = {}
        for key, label, show in (
            ("ANTHROPIC_API_KEY", "Claude API 키", "•"),
            ("STOCKWHY_MODEL", "모델 (비우면 claude-sonnet-5)", None),
            ("STOCKWHY_CA_BUNDLE", "회사 CA 인증서 경로 (선택)", None),
            ("KRX_ID", "KRX Data Marketplace 아이디 (선택 — 개별종목 공매도용)", None),
            ("KRX_PW", "KRX Data Marketplace 비밀번호", "•"),
        ):
            self._label(self.root, label, size=9, color=DIM).pack(anchor="w", **pad)
            entry = tk.Entry(self.root, width=52, show=show or "")
            entry.insert(0, os.getenv(key, ""))
            entry.pack(anchor="w", pady=(0, 8), **pad)
            self.fields[key] = entry

        save = tk.Frame(self.root, bg=BG)
        save.pack(anchor="w", **pad)
        tk.Button(save, text="설정 저장", command=self.save, width=12).pack(side="left")
        self.status = self._label(save, "", size=8, color=DIM)
        self.status.pack(side="left", padx=(10, 0))

        self.footer = self._label(self.root, self._footer(), size=8, color=DIM, justify="left")
        self.footer.pack(anchor="w", pady=(14, 0), **pad)

    def _footer(self) -> str:
        return (f"LLM  {model_name() if has_api_key() else '미사용 — 규칙 기반'}\n"
                f"TLS  {setup_tls()}")

    # -- 동작 -------------------------------------------------------------

    def open_browser(self) -> None:
        webbrowser.open(app_url(self.port))

    def save(self) -> None:
        values = {k: e.get() for k, e in self.fields.items()}  # type: ignore[attr-defined]
        try:
            path = save_user_env(values)
        except OSError as e:
            self.status.config(text=f"저장 실패: {e}")
            return
        # 키·모델은 다음 질의부터 바로 먹는다. CA 번들은 TLS 초기화 시점이
        # 지나서 재시작해야 적용된다 — 그걸 알려주지 않으면 안 먹는 줄 안다.
        note = " (인증서는 재시작 후 적용)" if values.get("STOCKWHY_CA_BUNDLE") else ""
        self.status.config(text=f"저장됨 · {path.name}{note}")
        self.footer.config(text=self._footer())

    def diagnose(self) -> None:
        """데이터 소스 진단을 창으로 보여준다.

        터미널을 안 쓰려고 만든 앱인데 정작 문제가 생기면 `--selftest` 를 돌려야
        원인을 알 수 있다면 앞뒤가 안 맞는다. 같은 결과를 창에서 보고 그대로
        복사할 수 있어야 "왜 안 되는지"를 물어볼 수 있다.

        수집이 몇 초 걸리므로 별도 스레드에서 돌린다. Tk 위젯은 메인 스레드에서만
        건드려야 해서 결과 반영은 after() 로 넘긴다.
        """
        tk = self.tk
        win = tk.Toplevel(self.root)
        win.title("데이터 소스 진단")
        win.configure(bg=BG)
        win.geometry("720x480")

        text = tk.Text(win, bg=BG, fg=FG, insertbackground=FG, wrap="none",
                       font=("Consolas", 9), borderwidth=0)
        scroll = tk.Scrollbar(win, command=text.yview)
        text.configure(yscrollcommand=scroll.set)
        scroll.pack(side="right", fill="y")

        bar = tk.Frame(win, bg=BG)
        bar.pack(side="bottom", fill="x", padx=10, pady=8)
        copied = self._label(bar, "", size=8, color=DIM)
        copied.pack(side="right")

        def copy() -> None:
            self.root.clipboard_clear()
            self.root.clipboard_append(text.get("1.0", "end-1c"))
            copied.config(text="복사했습니다")

        tk.Button(bar, text="결과 복사", command=copy, width=12).pack(side="left")
        text.pack(fill="both", expand=True, padx=10, pady=(10, 0))
        text.insert("1.0", "확인 중… (10초쯤 걸립니다)")

        def fill(body: str) -> None:
            text.delete("1.0", "end")
            text.insert("1.0", body)

        def work() -> None:
            import asyncio  # noqa: PLC0415
            from .cli import source_report  # noqa: PLC0415
            try:
                lines, _ = asyncio.run(source_report())
                body = "\n".join(lines)
            except Exception as e:  # noqa: BLE001 - 진단이 죽으면 원인을 못 본다
                body = f"진단 중 오류: {type(e).__name__}: {e}"
            # 창이 이미 닫혔을 수도 있다.
            try:
                self.root.after(0, lambda: fill(body))
            except Exception:  # noqa: BLE001
                pass

        threading.Thread(target=work, daemon=True, name="stockwhy-diag").start()

    def quit(self) -> None:
        if self.httpd is not None:
            # shutdown() 은 serve_forever 루프가 멈출 때까지 블록한다. 창을 닫는
            # 스레드에서 부르면 화면이 잠깐 굳으므로 따로 돌린다.
            threading.Thread(target=self.httpd.shutdown, daemon=True).start()
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


# --------------------------------------------------------------------------

def headless() -> bool:
    """창도 브라우저도 없이 서버만 돌린다.

    빌드 검증(CI)에서 쓴다. 창을 띄우는 경로와 서버가 뜨는 경로를 갈라 놓아야
    "화면이 안 떠서 실패한 건지, 서버가 안 떠서 실패한 건지"를 구분할 수 있다.
    """
    return os.getenv("STOCKWHY_NO_WINDOW", "").strip().lower() not in ("", "0", "false", "no")


def main() -> int:
    load_env()
    setup_tls()

    port, httpd, running_port = claim_port()

    if running_port is not None:
        # 이미 떠 있다. 창을 하나 더 띄우지 말고 그 주소를 열어준다.
        if not headless():
            webbrowser.open(app_url(running_port))
        return 0
    if port is None or httpd is None:
        _fatal(f"{PORTS[0]}~{PORTS[-1]} 포트를 모두 다른 프로그램이 쓰고 있습니다.")
        return 1

    # 브라우저 화면에서 앱을 끌 수 있게 한다. 창을 작업표시줄로 내려두고 쓰는 게
    # 기본이라, 끄는 수단이 창에만 있으면 그걸 다시 찾아 올려야 한다.
    lite.ALLOW_QUIT = True
    thread = _spawn(httpd)

    window = None
    if not headless():
        try:
            import tkinter as tk  # noqa: PLC0415
            window = Window(tk, port, httpd)
        except Exception:  # noqa: BLE001
            # tkinter 가 없거나(리눅스 최소 설치) 창을 못 여는 환경(원격 세션,
            # 잠긴 PC)일 수 있다. 그렇다고 앱까지 죽으면 아이콘을 눌러도 아무
            # 일이 안 일어난다. 창을 포기하고 서버와 브라우저는 살린다.
            window = None

    if window is None:
        if sys.stdout is not None:
            print(f"{TITLE}  {app_url(port)}  (Ctrl+C 로 종료)")
        if not headless():
            webbrowser.open(app_url(port))
        try:
            thread.join()
        except KeyboardInterrupt:
            httpd.shutdown()
        return 0

    # 브라우저를 띄운 뒤 창은 작업표시줄로 내린다. 이 창은 상태 표시와 종료용이지
    # 매번 볼 화면이 아니라서, 떠 있으면 분석 화면을 가린다.
    window.root.after(300, window.open_browser)
    window.root.after(900, window.root.iconify)
    window.run()
    return 0


def _fatal(message: str) -> None:
    """콘솔이 없을 수도 있으니 창으로도 알린다."""
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(TITLE, message)
        root.destroy()
    except Exception:  # noqa: BLE001
        pass
    if sys.stderr is not None:
        print(message, file=sys.stderr)


if __name__ == "__main__":
    raise SystemExit(main())
