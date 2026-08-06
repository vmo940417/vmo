"""회사망 TLS 검사 장비 대응 테스트.

사내망은 HTTPS 를 중간에서 풀었다가 자체 인증서로 다시 묶어 내보낸다. Python 은
OS 인증서 저장소를 안 보고 certifi 번들만 봐서 CERTIFICATE_VERIFY_FAILED 로
전부 실패한다. truststore 를 끼워 OS 저장소를 쓰게 하는 것이 해법이고,
여기서는 그 배선이 실제로 동작하는지 확인한다.
"""

from __future__ import annotations

import ssl
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import config  # noqa: E402
from server.providers.naver import NaverProvider  # noqa: E402


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for k in ("STOCKWHY_CA_BUNDLE", "STOCKWHY_TLS"):
        monkeypatch.delenv(k, raising=False)


class TestSetupTls:
    def test_uses_os_store_by_default(self):
        """truststore 가 설치돼 있으면 OS 저장소를 쓴다."""
        pytest.importorskip("truststore")
        assert "truststore" in config.setup_tls()

    def test_ca_bundle_takes_precedence(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_CA_BUNDLE", "/etc/company-root.pem")
        result = config.setup_tls()
        assert "company-root.pem" in result

    def test_opt_out_to_certifi(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_TLS", "certifi")
        assert "certifi" in config.setup_tls()

    def test_missing_truststore_degrades_not_crashes(self, monkeypatch):
        """truststore 가 없어도 앱은 떠야 한다(사내망이 아니면 잘 돌아간다)."""
        real_import = __builtins__["__import__"] if isinstance(__builtins__, dict) else __import__

        def blocked(name, *args, **kwargs):
            if name == "truststore":
                raise ImportError("no truststore")
            return real_import(name, *args, **kwargs)

        monkeypatch.setattr("builtins.__import__", blocked)
        assert "certifi" in config.setup_tls()

    def test_never_disables_verification(self):
        """검증을 끄는 경로가 코드에 존재하면 안 된다."""
        src = (Path(config.__file__)).read_text(encoding="utf-8")
        assert "verify=False" not in src
        assert "CERT_NONE" not in src


class TestCaBundle:
    def test_none_when_unset(self):
        assert config.ca_bundle() is None

    def test_blank_is_none(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_CA_BUNDLE", "   ")
        assert config.ca_bundle() is None

    def test_path_returned(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_CA_BUNDLE", "/tmp/ca.pem")
        assert config.ca_bundle() == "/tmp/ca.pem"


class TestProviderVerify:
    async def test_client_verifies_by_default(self):
        """검증은 항상 켜져 있어야 한다."""
        async with NaverProvider() as p:
            ctx = p._client._transport._pool._ssl_context
        assert ctx.verify_mode == ssl.CERT_REQUIRED
        assert ctx.check_hostname is True

    async def test_injected_client_is_left_alone(self):
        """테스트용으로 주입한 클라이언트는 건드리지 않는다."""
        given = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(200)))
        async with NaverProvider(client=given) as p:
            assert p._client is given


class TestSelftestGuidance:
    def test_tls_help_mentions_fix(self):
        from server.cli import TLS_HELP
        assert "truststore" in TLS_HELP
        assert "STOCKWHY_CA_BUNDLE" in TLS_HELP

    def test_tls_help_refuses_to_disable_verification(self):
        """'검증 끄세요'를 해결책으로 제시하면 안 된다."""
        from server.cli import TLS_HELP
        assert "verify=False" not in TLS_HELP
        assert "안내하지 않습니다" in TLS_HELP
