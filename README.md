이 저장소에는 인물 검색 앱 두 개가 있습니다.

- `/` (루트) — [작가 검색 · 저서 한눈에 보기](#작가-검색--저서-한눈에-보기)
- `/painter/` — [화가 검색 · 작품 한눈에 보기](#화가-검색--작품-한눈에-보기)

두 앱 모두 API 키나 서버 없이 정적 파일만으로 동작하며, 사용 방식(로컬 실행, 바탕화면 바로가기, 모바일 홈 화면 추가)이 동일합니다.

# 작가 검색 · 저서 한눈에 보기

작가 이름을 검색하면 그 작가가 쓴 책 목록을 표지와 함께 바로 보여주는 웹앱입니다.
[Open Library](https://openlibrary.org) 공개 API를 사용하며 별도 API 키나 서버가 필요 없습니다.

## 실행 방법

정적 파일이라 브라우저에서 바로 열거나, 간단한 로컬 서버로 띄우면 됩니다.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 사용 방법

1. 검색창에 작가 이름을 입력합니다 (한글/영문 모두 가능, 예: `한강`, `Ernest Hemingway`).
2. 자동완성 목록에서 원하는 작가를 클릭(또는 방향키 + Enter)합니다.
3. 작가 정보와 저서 목록(표지, 출간연도)이 바로 표시됩니다. 책 카드를 클릭하면 Open Library 상세 페이지로 이동합니다.

## 파일 구성

- `index.html` — 페이지 구조
- `style.css` — 스타일 (라이트/다크 모드 자동 대응)
- `app.js` — 검색, API 호출, 렌더링 로직
- `icon.ico` — 바탕화면 바로가기용 아이콘 (Windows)
- `manifest.json`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — 모바일 홈 화면 추가(PWA)용 아이콘/설정

> `index.html`은 반드시 `style.css`, `app.js`와 같은 폴더 안에 있어야 정상 동작합니다. 이 파일만 따로 복사/이동하면 검색이 동작하지 않습니다.

## 바탕화면 바로가기 만들기 (Windows)

1. 이 폴더를 통째로 원하는 위치(예: 문서 폴더)에 둡니다.
2. `index.html` 우클릭 → **바로 가기 만들기**
3. 생성된 바로 가기 파일을 바탕화면으로 이동
4. 바로 가기 우클릭 → **속성** → **바로 가기** 탭 → **아이콘 변경** → **찾아보기**에서 이 폴더의 `icon.ico` 선택 → 확인 → 적용
5. (선택) 바로 가기 이름에서 " - 바로 가기" 부분을 지워서 원하는 이름으로 변경

## 모바일에서 홈 화면에 추가하기

모바일은 파일을 다운로드해서 여는 방식이 아니라, 이 저장소를 **GitHub Pages로 호스팅**한 뒤 그 주소를 홈 화면에 추가하는 방식을 씁니다.

### 1) GitHub Pages 켜기 (한 번만, 저장소 소유자가 직접)
1. GitHub 저장소 → **Settings** → 왼쪽 메뉴 **Pages**
2. **Build and deployment → Source**를 **Deploy from a branch**로 설정
3. Branch에서 `claude/author-book-search-app-rjdj2o` (또는 병합됐다면 `main`) 선택, 폴더는 `/ (root)` 선택 → **Save**
4. 잠시 후 `https://vmo940417.github.io/vmo/` 형태의 주소가 생깁니다 (Pages 화면에 표시됨)

### 2) 홈 화면에 추가하기
- **iPhone (Safari)**: 위 주소로 접속 → 공유 버튼(⬆️) → **홈 화면에 추가**
- **Android (Chrome)**: 위 주소로 접속 → 우측 상단 점 3개 메뉴 → **홈 화면에 추가** (또는 "앱 설치")

책+돋보기 아이콘으로 홈 화면에 추가되고, 탭하면 주소창 없이 앱처럼 전체화면으로 열립니다.

---

# 화가 검색 · 작품 한눈에 보기

`painter/` 폴더에 있는 앱입니다. 화가 이름을 검색하면 그 화가의 작품을 이미지와 함께 바로 보여줍니다.
[Art Institute of Chicago](https://www.artic.edu/collection) 공개 API를 사용하며 별도 API 키나 서버가 필요 없습니다.

## 실행 방법

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/painter/ 접속
```

GitHub Pages를 켰다면 `https://vmo940417.github.io/vmo/painter/` 로 바로 접속할 수 있습니다.

## 사용 방법

1. 검색창에 화가 이름을 입력합니다 (한글/영문 모두 가능, 예: `반 고흐`, `Claude Monet`).
2. 자동완성 목록에서 원하는 화가를 클릭(또는 방향키 + Enter)합니다.
3. 화가 이름과 소장 작품 수, 작품 목록(이미지, 제작연도)이 바로 표시됩니다. 작품 카드를 클릭하면 Art Institute of Chicago 상세 페이지로 이동합니다.

> Art Institute of Chicago가 소장한 작품만 검색됩니다 — 그 미술관에 없는 작가/작품은 나오지 않을 수 있습니다.

## 파일 구성

`painter/index.html`, `painter/style.css`, `painter/app.js`, `painter/icon.ico`, `painter/manifest.json`, `painter/icon-192.png`, `painter/icon-512.png`, `painter/apple-touch-icon.png` — 역할은 루트 앱과 동일합니다.

## 바탕화면 바로가기 / 모바일 홈 화면 추가

위 "작가 검색" 앱과 같은 방식입니다. `painter` 폴더를 통째로 받아서 그 안의 `index.html`로 바로가기를 만들거나(아이콘은 `painter/icon.ico`), GitHub Pages 주소(`https://vmo940417.github.io/vmo/painter/`)를 모바일 홈 화면에 추가하면 됩니다.
