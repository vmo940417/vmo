"""PWA 배선 + 환경설정 테스트.

홈 화면 설치는 조각 하나만 어긋나도 조용히 실패한다(설치 버튼이 그냥 안 뜬다).
그래서 매니페스트, 서비스 워커 스코프, 아이콘 존재를 명시적으로 검증한다.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import config  # noqa: E402
from server.main import app  # noqa: E402

STATIC = Path(__file__).resolve().parents[1] / "server" / "static"


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestManifest:
    def test_served(self, client):
        r = client.get("/static/manifest.webmanifest")
        assert r.status_code == 200

    def test_required_fields(self):
        m = json.loads((STATIC / "manifest.webmanifest").read_text(encoding="utf-8"))
        for key in ("name", "short_name", "start_url", "display", "icons"):
            assert key in m, f"매니페스트에 {key} 가 없으면 설치 프롬프트가 안 뜬다"
        assert m["display"] == "standalone"

    def test_icons_exist_on_disk(self):
        m = json.loads((STATIC / "manifest.webmanifest").read_text(encoding="utf-8"))
        for icon in m["icons"]:
            path = STATIC / icon["src"].removeprefix("/static/")
            assert path.exists(), f"{icon['src']} 파일이 없다"

    def test_has_192_and_512(self):
        """안드로이드 설치 요건: 192 와 512 가 둘 다 있어야 한다."""
        m = json.loads((STATIC / "manifest.webmanifest").read_text(encoding="utf-8"))
        sizes = {i["sizes"] for i in m["icons"]}
        assert "192x192" in sizes and "512x512" in sizes

    def test_has_maskable_icon(self):
        m = json.loads((STATIC / "manifest.webmanifest").read_text(encoding="utf-8"))
        assert any("maskable" in i.get("purpose", "") for i in m["icons"])


class TestServiceWorker:
    def test_served_from_root(self, client):
        """스코프가 자기 경로 이하라 /static/sw.js 로는 전체를 못 잡는다."""
        r = client.get("/sw.js")
        assert r.status_code == 200
        assert "javascript" in r.headers["content-type"]

    def test_scope_header(self, client):
        assert client.get("/sw.js").headers.get("Service-Worker-Allowed") == "/"

    def test_not_cached(self, client):
        """워커 자체가 캐시되면 업데이트가 안 먹는다."""
        assert "no-cache" in client.get("/sw.js").headers.get("Cache-Control", "")

    def test_never_caches_api_responses(self):
        """시세를 캐시하면 옛날 가격을 보여주게 된다. 절대 금지."""
        src = (STATIC / "sw.js").read_text(encoding="utf-8")
        assert "url.pathname.startsWith('/api/')" in src
        assert "return;" in src.split("startsWith('/api/')")[1][:40]


class TestHtmlWiring:
    def test_links_manifest_and_icons(self, client):
        html = client.get("/").text
        assert 'rel="manifest"' in html
        assert 'rel="apple-touch-icon"' in html
        assert 'name="theme-color"' in html

    def test_ios_standalone_meta(self, client):
        html = client.get("/").text
        assert 'name="apple-mobile-web-app-capable"' in html

    def test_registers_service_worker(self, client):
        assert "serviceWorker" in client.get("/").text

    def test_viewport_handles_notch(self, client):
        assert "viewport-fit=cover" in client.get("/").text


class TestIconsServed:
    @pytest.mark.parametrize("name", [
        "icon-192.png", "icon-512.png", "icon-maskable-512.png",
        "apple-touch-icon.png", "favicon.png",
    ])
    def test_icon_route(self, client, name):
        r = client.get(f"/static/icons/{name}")
        assert r.status_code == 200
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n", "PNG 시그니처가 아니다"


class TestConfig:
    def test_reads_env_file(self, tmp_path, monkeypatch):
        env = tmp_path / ".env"
        env.write_text('ANTHROPIC_API_KEY="sk-ant-test"\nSTOCKWHY_MODEL=claude-opus-5\n')
        monkeypatch.setattr(config, "ENV_PATH", env)
        monkeypatch.setattr(config, "_loaded", False)
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.delenv("STOCKWHY_MODEL", raising=False)

        config.load_env()
        assert config.has_api_key()
        assert config.model_name() == "claude-opus-5"

    def test_does_not_override_existing_env(self, tmp_path, monkeypatch):
        env = tmp_path / ".env"
        env.write_text("STOCKWHY_MODEL=from-file\n")
        monkeypatch.setattr(config, "ENV_PATH", env)
        monkeypatch.setattr(config, "_loaded", False)
        monkeypatch.setenv("STOCKWHY_MODEL", "from-shell")

        config.load_env()
        assert config.model_name() == "from-shell"

    def test_missing_env_file_is_fine(self, tmp_path, monkeypatch):
        monkeypatch.setattr(config, "ENV_PATH", tmp_path / "nope.env")
        monkeypatch.setattr(config, "_loaded", False)
        config.load_env()   # 예외 없이 통과해야 한다

    def test_default_model(self, monkeypatch):
        monkeypatch.delenv("STOCKWHY_MODEL", raising=False)
        assert config.model_name() == "claude-sonnet-5"


class TestLanIp:
    def test_returns_dotted_quad_or_none(self):
        from server.cli import lan_ip
        ip = lan_ip()
        assert ip is None or len(ip.split(".")) == 4
