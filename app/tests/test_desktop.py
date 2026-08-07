"""데스크톱 앱(.exe) 테스트.

PowerShell 없이 아이콘만 눌러서 쓰는 버전이라, 여기서 뭔가 잘못되면 사용자에게
보이는 건 "눌렀는데 아무 일도 안 일어남" 뿐이다. 로그도 콘솔도 없다. 그래서
실행 파일에서만 드러나는 실패들(콘솔 없음, 설정 저장 위치, 포트 충돌)을
여기서 미리 밟아본다.

창(tkinter)은 화면이 없는 환경에서 못 띄우므로 창을 뺀 나머지를 검증한다.
"""

from __future__ import annotations

import json
import socket
import subprocess
import sys
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import config, desktop, lite  # noqa: E402


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture
def running():
    """실제 앱 서버를 임의 포트에 띄운다."""
    port = free_port()
    httpd, thread = desktop.start_server(port)
    yield port, httpd
    httpd.shutdown()
    thread.join(timeout=5)


class TestServer:
    def test_serves_the_page(self, running):
        port, _ = running
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/") as r:
            body = r.read().decode("utf-8")
        assert r.status == 200 and "등락률 분해" in body

    def test_serves_static(self, running):
        """실행 파일에 정적 파일이 안 묶이면 여기서 404 가 난다."""
        port, _ = running
        with urllib.request.urlopen(
                f"http://127.0.0.1:{port}/static/icons/favicon.png") as r:
            assert r.status == 200 and r.read()[:4] == b"\x89PNG"

    def test_binds_loopback_only(self, running):
        """이건 내 PC 에서만 쓰는 앱이다. 사내망에 열려 있으면 안 된다."""
        port, httpd = running
        assert httpd.server_address[0] == "127.0.0.1"
        with socket.socket() as s:
            s.settimeout(0.5)
            # 루프백 밖 주소로는 연결이 되면 안 된다.
            host = socket.gethostbyname(socket.gethostname())
            if host.startswith("127."):
                pytest.skip("이 환경에는 루프백 외 주소가 없다")
            assert s.connect_ex((host, port)) != 0

    def test_shutdown_releases_the_port(self):
        port = free_port()
        httpd, thread = desktop.start_server(port)
        httpd.shutdown()
        thread.join(timeout=5)
        httpd.server_close()
        assert not desktop._in_use(port), "종료 후에도 포트를 잡고 있으면 재실행이 막힌다"


class TestPortSelection:
    def test_picks_a_free_port(self, monkeypatch):
        monkeypatch.setattr(desktop, "PORTS", (free_port(),))
        port, running_port = desktop.find_port()
        assert port is not None and running_port is None

    def test_finds_our_own_instance(self, running, monkeypatch):
        """아이콘을 두 번 눌러도 창이 둘 뜨면 안 된다 — 먼저 뜬 걸 찾아야 한다."""
        port, _ = running
        monkeypatch.setattr(desktop, "PORTS", (port,))
        new_port, existing = desktop.find_port()
        assert new_port is None and existing == port

    def test_stranger_on_the_port_is_not_us(self, monkeypatch):
        """다른 프로그램이 그 포트를 쓰고 있으면 그쪽으로 브라우저를 열면 안 된다."""
        class Stranger(BaseHTTPRequestHandler):
            def do_GET(self):  # noqa: N802
                self.send_response(200)
                self.send_header("Content-Length", "2")
                self.end_headers()
                self.wfile.write(b"hi")

            def log_message(self, *a):
                pass

        port = free_port()
        srv = ThreadingHTTPServer(("127.0.0.1", port), Stranger)
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            monkeypatch.setattr(desktop, "PORTS", (port,))
            new_port, existing = desktop.find_port()
            assert new_port is None and existing is None, "남의 서버를 우리 앱으로 오인했다"
        finally:
            srv.shutdown()
            t.join(timeout=5)

    def test_health_probe_rejects_non_json(self, monkeypatch):
        assert desktop._health(free_port()) is None    # 아무도 없는 포트


class TestUrl:
    def test_plain(self):
        assert desktop.app_url(8765) == "http://127.0.0.1:8765/"

    def test_with_token(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_TOKEN", "abc")
        assert desktop.app_url(8765).endswith("?t=abc")


class TestNoConsole:
    """콘솔 없이 뜨면 sys.stderr 가 None 이다.

    로그 한 줄 때문에 요청마다 예외가 나면 앱이 통째로 먹통이 된다. 사용자에게는
    '창은 떴는데 검색이 안 됨' 으로만 보여서 원인을 짚을 방법이 없다.
    """

    def test_requests_survive_missing_stderr(self, running, monkeypatch):
        port, _ = running
        monkeypatch.setattr(sys, "stderr", None)
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health") as r:
            assert json.loads(r.read())["ok"] is True


class TestUserConfig:
    """실행 파일은 매번 임시 폴더에 풀렸다 지워진다 — 설정을 그 옆에 두면 날아간다."""

    def test_saves_outside_the_program_folder(self, tmp_path, monkeypatch):
        monkeypatch.setenv("APPDATA", str(tmp_path))
        monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
        path = config.save_user_env({"ANTHROPIC_API_KEY": "sk-test"})
        assert path.parent.parent == tmp_path
        assert "sk-test" in path.read_text(encoding="utf-8")

    def test_round_trip(self, tmp_path, monkeypatch):
        monkeypatch.setenv("APPDATA", str(tmp_path))
        monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
        config.save_user_env({"STOCKWHY_MODEL": "claude-opus-5"})
        monkeypatch.delenv("STOCKWHY_MODEL", raising=False)
        monkeypatch.setattr(config, "_loaded", False)
        config.load_env()
        assert config.model_name() == "claude-opus-5"

    def test_blank_value_removes_the_key(self, tmp_path, monkeypatch):
        monkeypatch.setenv("APPDATA", str(tmp_path))
        monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
        config.save_user_env({"ANTHROPIC_API_KEY": "sk-test"})
        path = config.save_user_env({"ANTHROPIC_API_KEY": ""})
        assert "sk-test" not in path.read_text(encoding="utf-8")
        assert not config.has_api_key()

    def test_other_keys_survive(self, tmp_path, monkeypatch):
        monkeypatch.setenv("APPDATA", str(tmp_path))
        monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
        config.save_user_env({"ANTHROPIC_API_KEY": "sk-test"})
        path = config.save_user_env({"STOCKWHY_MODEL": "claude-opus-5"})
        body = path.read_text(encoding="utf-8")
        assert "sk-test" in body and "claude-opus-5" in body


class TestPackagedDepsOnly:
    """실행 파일에는 fastapi/uvicorn/anthropic 을 넣지 않는다.

    파일이 커지고 백신 오탐도 늘기 때문이다. 그 패키지들을 빼고도 데스크톱 앱이
    떠야 spec 의 excludes 가 정당해진다.
    """

    BLOCKER = (
        "import sys\n"
        "BANNED = ('fastapi', 'uvicorn', 'anthropic', 'pydantic', 'pydantic_core', 'starlette')\n"
        "class Blocker:\n"
        "    def find_spec(self, name, path=None, target=None):\n"
        "        if name.split('.')[0] in BANNED:\n"
        "            raise ImportError('실행 파일에 없는 패키지: ' + name)\n"
        "        return None\n"
        "sys.meta_path.insert(0, Blocker())\n"
    )

    def _run(self, body: str):
        return subprocess.run(
            [sys.executable, "-c", self.BLOCKER + body],
            cwd=str(Path(__file__).resolve().parents[1]),
            capture_output=True, text=True, timeout=90,
        )

    def test_desktop_imports(self):
        r = self._run("import server.desktop; print('ok')")
        assert r.returncode == 0, f"데스크톱 앱이 뜨지 않는다:\n{r.stderr}"
        assert "ok" in r.stdout

    def test_entry_point_imports(self):
        r = self._run("import importlib.util, pathlib;"
                      "p = pathlib.Path('packaging/entry.py');"
                      "assert p.exists();"
                      "spec = importlib.util.spec_from_file_location('entry', p);"
                      "m = importlib.util.module_from_spec(spec);"
                      "spec.loader.exec_module(m);"
                      "print('ok', callable(m.main))")
        assert r.returncode == 0, r.stderr
        assert "ok True" in r.stdout

    def test_server_answers_without_them(self):
        r = self._run(
            "from server import desktop;"
            "import urllib.request, json, socket;"
            "s = socket.socket(); s.bind(('127.0.0.1', 0));"
            "port = s.getsockname()[1]; s.close();"
            "httpd, t = desktop.start_server(port);"
            "d = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health'));"
            "httpd.shutdown();"
            "print('health', d['ok'])"
        )
        assert r.returncode == 0, r.stderr
        assert "health True" in r.stdout


class TestPackagingFiles:
    ROOT = Path(__file__).resolve().parents[1]

    def test_spec_exists(self):
        assert (self.ROOT / "packaging" / "stockwhy.spec").is_file()

    def test_icon_exists(self):
        ico = self.ROOT / "packaging" / "stockwhy.ico"
        assert ico.is_file() and ico.read_bytes()[:4] == b"\x00\x00\x01\x00"

    def test_spec_excludes_heavy_deps(self):
        """빌드 정의와 위 테스트의 전제가 어긋나면 exe 만 무거워진다."""
        spec = (self.ROOT / "packaging" / "stockwhy.spec").read_text(encoding="utf-8")
        for name in ("fastapi", "uvicorn", "anthropic", "pydantic"):
            assert f'"{name}"' in spec, f"{name} 이 excludes 에 없다"

    def test_spec_bundles_the_frontend(self):
        spec = (self.ROOT / "packaging" / "stockwhy.spec").read_text(encoding="utf-8")
        assert "server/static" in spec

    def test_spec_has_no_console(self):
        spec = (self.ROOT / "packaging" / "stockwhy.spec").read_text(encoding="utf-8")
        assert "console=False" in spec, "콘솔이 뜨면 이 빌드를 만든 이유가 없어진다"


class TestHeadlessMode:
    """CI 검증용 무창 모드.

    창 경로와 서버 경로를 갈라 놓아야 빌드가 깨졌을 때 "화면이 안 뜬 건지 서버가
    안 뜬 건지"를 로그만 보고 구분할 수 있다.
    """

    def test_off_by_default(self, monkeypatch):
        monkeypatch.delenv("STOCKWHY_NO_WINDOW", raising=False)
        assert desktop.headless() is False

    @pytest.mark.parametrize("value", ["1", "true", "yes", "on"])
    def test_on(self, value, monkeypatch):
        monkeypatch.setenv("STOCKWHY_NO_WINDOW", value)
        assert desktop.headless() is True

    @pytest.mark.parametrize("value", ["", "0", "false", "no"])
    def test_off(self, value, monkeypatch):
        monkeypatch.setenv("STOCKWHY_NO_WINDOW", value)
        assert desktop.headless() is False

    def test_does_not_open_a_browser(self, monkeypatch):
        """무창 모드에서 브라우저가 뜨면 CI 러너에 창이 남는다."""
        opened = []
        monkeypatch.setenv("STOCKWHY_NO_WINDOW", "1")
        monkeypatch.setattr(desktop.webbrowser, "open", lambda url: opened.append(url))
        monkeypatch.setattr(desktop, "find_port", lambda: (None, 8765))
        assert desktop.main() == 0
        assert opened == []


class TestWindowFailureFallback:
    """창을 못 띄우는 환경에서도 앱이 죽으면 안 된다.

    원격 데스크톱, 잠긴 세션, tkinter 없는 파이썬 — 창이 안 열릴 이유는 여럿이다.
    거기서 프로세스가 그냥 죽으면 사용자에겐 '아이콘을 눌렀는데 아무 일도 안
    일어남' 으로 보인다. 창을 포기하더라도 서버와 브라우저는 살려야 한다.
    """

    def test_falls_back_to_server_only(self, monkeypatch):
        opened: list[str] = []
        monkeypatch.delenv("STOCKWHY_NO_WINDOW", raising=False)
        monkeypatch.setattr(desktop.webbrowser, "open", lambda url: opened.append(url))

        port = free_port()
        monkeypatch.setattr(desktop, "PORTS", (port,))

        def explode(tk, *a, **kw):
            raise RuntimeError("창을 열 수 없음")

        monkeypatch.setattr(desktop, "Window", explode)
        # 서버가 계속 도는 대신 바로 끝나도록 join 을 즉시 반환시킨다.
        monkeypatch.setattr(threading.Thread, "join", lambda self, *a, **kw: None)

        assert desktop.main() == 0
        assert opened, "창이 실패해도 브라우저는 열어야 한다"
        assert str(port) in opened[0]


class TestQuitFromBrowser:
    """브라우저 화면에서 앱을 끌 수 있어야 한다.

    작은 창은 작업표시줄로 내려두고 쓰기 때문에, 끄는 수단이 창에만 있으면
    그걸 다시 찾아 올려야 한다.
    """

    def post(self, port: int, path: str = "/api/quit"):
        req = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=b"", method="POST")
        return urllib.request.urlopen(req, timeout=5)

    def test_health_advertises_it(self, running):
        port, _ = running
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health") as r:
            assert json.loads(r.read())["can_quit"] is True

    def test_quit_stops_the_server(self):
        port = free_port()
        httpd, thread = desktop.start_server(port)
        with self.post(port) as r:
            assert json.loads(r.read())["ok"] is True
        thread.join(timeout=10)
        assert not thread.is_alive(), "종료 요청에도 서버가 계속 돌고 있다"
        httpd.server_close()

    def test_get_does_not_quit(self, running):
        """다른 페이지가 이미지 태그 하나로 우리 앱을 꺼버리면 안 된다."""
        port, _ = running
        with pytest.raises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/api/quit", timeout=5)
        assert e.value.code == 404
        # 여전히 살아 있어야 한다
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health") as r:
            assert json.loads(r.read())["ok"] is True

    def test_closed_when_not_a_desktop_app(self, monkeypatch):
        """폰이나 사내망에 열어둔 서버는 아무나 끌 수 있으면 안 된다."""
        monkeypatch.setattr(lite, "ALLOW_QUIT", False)
        port = free_port()
        httpd = lite.make_server(port, "127.0.0.1")
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            with pytest.raises(urllib.error.HTTPError) as e:
                self.post(port)
            assert e.value.code == 404
            assert thread.is_alive(), "끄면 안 되는 서버가 꺼졌다"
        finally:
            httpd.shutdown()
            thread.join(timeout=5)

    def test_page_offers_the_button(self):
        html = (Path(__file__).resolve().parents[1] /
                "server" / "static" / "index.html").read_text(encoding="utf-8")
        assert "quitBtn" in html and "/api/quit" in html
        assert "can_quit" in html, "health 를 확인하지 않으면 폰에서도 버튼이 뜬다"
