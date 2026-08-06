const input = document.getElementById("artistInput");
const suggestionsBox = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("emptyState");
const artistPanel = document.getElementById("artistPanel");
const artistName = document.getElementById("artistName");
const artistDescription = document.getElementById("artistDescription");
const artistWorkCount = document.getElementById("artistWorkCount");
const worksSection = document.getElementById("worksSection");
const worksGrid = document.getElementById("worksGrid");
const workCount = document.getElementById("workCount");

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const NO_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#d8cfc2"/><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#8a8073" font-family="sans-serif">이미지 없음</text></svg>'
  );

let debounceTimer = null;
let searchAbort = null;
let activeIndex = -1;
let currentSuggestions = [];

function setStatus(text) {
  if (!text) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    return;
  }
  statusEl.hidden = false;
  statusEl.textContent = text;
}

function showEmptyState(show) {
  emptyState.hidden = !show;
}

function clearSuggestions() {
  suggestionsBox.hidden = true;
  suggestionsBox.innerHTML = "";
  currentSuggestions = [];
  activeIndex = -1;
}

function isPainterDescription(desc) {
  return desc && /화가|painter/i.test(desc) ? 1 : 0;
}

function renderSuggestions(artists) {
  currentSuggestions = artists;
  activeIndex = -1;
  if (!artists.length) {
    clearSuggestions();
    return;
  }
  suggestionsBox.innerHTML = "";
  artists.forEach((artist, idx) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.dataset.index = String(idx);

    const nameSpan = document.createElement("span");
    nameSpan.className = "suggestion-name";
    nameSpan.textContent = artist.label;

    const metaSpan = document.createElement("span");
    metaSpan.className = "suggestion-meta";
    metaSpan.textContent = artist.description || "";

    item.appendChild(nameSpan);
    item.appendChild(metaSpan);
    item.addEventListener("click", () => selectArtist(artist));

    suggestionsBox.appendChild(item);
  });
  suggestionsBox.hidden = false;
}

function highlightActive() {
  [...suggestionsBox.children].forEach((el, idx) => {
    el.classList.toggle("active", idx === activeIndex);
  });
}

async function searchArtists(query) {
  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();
  const { signal } = searchAbort;

  const buildUrl = (lang) =>
    `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(query)}` +
    `&language=${lang}&uselang=${lang}&type=item&limit=8&format=json&origin=*`;

  const [koRes, enRes] = await Promise.all([
    fetch(buildUrl("ko"), { signal }),
    fetch(buildUrl("en"), { signal }),
  ]);

  if (!koRes.ok && !enRes.ok) throw new Error("검색 요청 실패");

  const koData = koRes.ok ? await koRes.json() : { search: [] };
  const enData = enRes.ok ? await enRes.json() : { search: [] };

  const merged = new Map();
  [...(koData.search || []), ...(enData.search || [])].forEach((item) => {
    if (!merged.has(item.id)) {
      merged.set(item.id, {
        id: item.id,
        label: item.label || item.id,
        description: item.description || "",
      });
    }
  });

  const results = [...merged.values()];
  results.sort((a, b) => isPainterDescription(b.description) - isPainterDescription(a.description));
  return results.slice(0, 10);
}

async function loadArtistWorks(qid) {
  const query = `SELECT ?work ?workLabel ?image ?inception WHERE {
    ?work wdt:P170 wd:${qid} .
    OPTIONAL { ?work wdt:P18 ?image . }
    OPTIONAL { ?work wdt:P571 ?inception . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
  } LIMIT 60`;

  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`작품 목록 요청 실패 (${res.status})`);
  const data = await res.json();
  const rows = (data.results && data.results.bindings) || [];

  return rows.map((row) => ({
    id: row.work.value.split("/").pop(),
    title: row.workLabel ? row.workLabel.value : "제목 없음",
    image: row.image ? row.image.value : null,
    inception: row.inception ? row.inception.value : null,
  }));
}

function renderArtist(artist, total) {
  artistPanel.hidden = false;
  artistName.textContent = artist.label;

  artistDescription.textContent = artist.description || "";
  artistDescription.hidden = !artist.description;

  artistWorkCount.textContent = `Wikidata에 등록된 작품 ${total}점`;
  artistWorkCount.hidden = false;
}

function extractYear(inception) {
  if (!inception) return null;
  const match = String(inception).match(/^-?\d{1,4}/);
  return match ? parseInt(match[0], 10) : null;
}

function renderWorks(works) {
  worksGrid.innerHTML = "";

  if (!works.length) {
    worksSection.hidden = true;
    return;
  }

  worksSection.hidden = false;
  workCount.textContent = `(${works.length}점)`;

  works
    .slice()
    .sort((a, b) => {
      const ay = extractYear(a.inception);
      const by = extractYear(b.inception);
      return (ay ?? 9999) - (by ?? 9999);
    })
    .forEach((work) => {
      const card = document.createElement("a");
      card.className = "book-card";
      card.href = `https://www.wikidata.org/wiki/${work.id}`;
      card.target = "_blank";
      card.rel = "noopener";

      const cover = document.createElement("img");
      cover.className = "book-cover";
      cover.src = work.image ? `${work.image.replace(/^http:/, "https:")}?width=400` : NO_IMAGE;
      cover.alt = work.title || "";
      cover.loading = "lazy";
      cover.onerror = () => {
        cover.onerror = null;
        cover.src = NO_IMAGE;
      };

      const info = document.createElement("div");
      info.className = "book-info";

      const title = document.createElement("p");
      title.className = "book-title";
      title.textContent = work.title || "제목 없음";

      const year = document.createElement("p");
      year.className = "book-year";
      year.textContent = extractYear(work.inception) ?? "";

      info.appendChild(title);
      info.appendChild(year);
      card.appendChild(cover);
      card.appendChild(info);
      worksGrid.appendChild(card);
    });
}

async function selectArtist(artist) {
  clearSuggestions();
  input.value = artist.label;
  showEmptyState(false);
  artistPanel.hidden = true;
  worksSection.hidden = true;
  setStatus("작품을 불러오는 중...");

  try {
    const works = await loadArtistWorks(artist.id);
    renderArtist(artist, works.length);
    renderWorks(works);
    setStatus(null);
    if (!works.length) {
      setStatus("Wikidata에 등록된 이 화가의 작품을 찾지 못했어요.");
    }
  } catch (err) {
    console.error(err);
    setStatus("작품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
  }
}

input.addEventListener("input", () => {
  const query = input.value.trim();
  clearTimeout(debounceTimer);

  if (!query) {
    clearSuggestions();
    setStatus(null);
    return;
  }

  debounceTimer = setTimeout(async () => {
    setStatus("검색 중...");
    try {
      const artists = await searchArtists(query);
      setStatus(null);
      renderSuggestions(artists);
      if (!artists.length) {
        setStatus("일치하는 화가를 찾지 못했어요.");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("검색 중 오류가 발생했어요. 네트워크를 확인해주세요.");
    }
  }, 300);
});

input.addEventListener("keydown", (e) => {
  if (suggestionsBox.hidden || !currentSuggestions.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, currentSuggestions.length - 1);
    highlightActive();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
    highlightActive();
  } else if (e.key === "Enter") {
    e.preventDefault();
    const chosen = currentSuggestions[activeIndex] ?? currentSuggestions[0];
    if (chosen) selectArtist(chosen);
  } else if (e.key === "Escape") {
    clearSuggestions();
  }
});

document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== input) {
    clearSuggestions();
  }
});
