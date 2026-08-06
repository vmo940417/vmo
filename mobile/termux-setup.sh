#!/data/data/com.termux/files/usr/bin/bash
#
# 안드로이드(Termux)에 장중 시세 원인 분석 앱을 설치한다.
#
#   curl -sL https://raw.githubusercontent.com/vmo940417/vmo/claude/stock-price-analysis-app-i9ddfj/mobile/termux-setup.sh | bash
#
# 다시 실행하면 최신 코드로 업데이트된다(설정과 사용 기록은 보존).
#
# 설치하는 것은 python, curl, unzip, httpx 뿐이다. FastAPI/uvicorn/anthropic SDK 는
# Rust/C 확장을 끌고 와서 폰에서 빌드하면 20분 걸리고 자주 실패하므로 쓰지 않는다.
# 대신 server/lite.py(표준 라이브러리 서버)로 같은 화면을 띄운다.

set -euo pipefail

BRANCH="claude/stock-price-analysis-app-i9ddfj"
ZIP_URL="https://github.com/vmo940417/vmo/archive/refs/heads/${BRANCH}.zip"
ROOT="$HOME/stockwhy"
APP="$ROOT/app"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

say "[1/5] 패키지 설치"
pkg update -y >/dev/null 2>&1 || true
pkg install -y python curl unzip >/dev/null

say "[2/5] 앱 내려받기"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fsSL "$ZIP_URL" -o "$tmp/app.zip"
unzip -q "$tmp/app.zip" -d "$tmp"
src="$(find "$tmp" -maxdepth 1 -type d -name 'vmo-*' | head -n1)"
[ -n "$src" ] || { echo "압축 해제 실패"; exit 1; }

# 설정(.env)과 사용 기록(.usage.jsonl)은 업데이트해도 살려둔다.
mkdir -p "$ROOT"
for keep in .env .usage.jsonl; do
  [ -f "$APP/$keep" ] && cp "$APP/$keep" "$tmp/$keep.bak"
done
rm -rf "$APP"
mkdir -p "$ROOT"
cp -r "$src/app" "$APP"
for keep in .env .usage.jsonl; do
  [ -f "$tmp/$keep.bak" ] && mv "$tmp/$keep.bak" "$APP/$keep"
done

say "[3/5] 파이썬 패키지 설치 (httpx 하나뿐)"
pip install --quiet --upgrade pip >/dev/null 2>&1 || true
pip install --quiet httpx

say "[4/5] 실행 명령 만들기"
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/stockwhy" <<'LAUNCHER'
#!/data/data/com.termux/files/usr/bin/bash
# 폰에서 서버를 띄운다. 화면이 꺼져도 죽지 않도록 wake lock 을 건다.
cd "$HOME/stockwhy/app" || exit 1
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock
trap 'command -v termux-wake-unlock >/dev/null 2>&1 && termux-wake-unlock' EXIT
exec python -m server.lite "$@"
LAUNCHER
chmod +x "$HOME/.local/bin/stockwhy"

# 종목 하나만 물어보고 끝내는 용도
cat > "$HOME/.local/bin/why" <<'ASK'
#!/data/data/com.termux/files/usr/bin/bash
cd "$HOME/stockwhy/app" || exit 1
exec python -m server.cli "$@"
ASK
chmod +x "$HOME/.local/bin/why"

# PATH 에 없으면 추가 (중복 추가 방지)
if ! grep -qs 'stockwhy PATH' "$HOME/.bashrc" 2>/dev/null; then
  printf '\n# stockwhy PATH\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.bashrc"
fi
export PATH="$HOME/.local/bin:$PATH"

say "[5/5] 데이터 소스 확인"
cd "$APP"
python -m server.cli --selftest || true

cat <<'DONE'

────────────────────────────────────────────────
설치 완료

  서버 켜기      stockwhy
  그다음 브라우저에서   http://localhost:8000

  터미널에서 바로   why 삼성전자
  누적 비용        why --usage

Termux 를 처음 설치했다면 새 세션을 한 번 열어야
stockwhy 명령이 잡힙니다 (또는: source ~/.bashrc).

LLM 서술까지 쓰려면 API 키를 넣으세요:
  cd ~/stockwhy/app && cp .env.example .env && nano .env
────────────────────────────────────────────────
DONE
