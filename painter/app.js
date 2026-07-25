const input = document.getElementById("artistInput");
const suggestionsBox = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("emptyState");
const artistPanel = document.getElementById("artistPanel");
const artistName = document.getElementById("artistName");
const artistWorkCount = document.getElementById("artistWorkCount");
const worksSection = document.getElementById("worksSection");
const worksGrid = document.getElementById("worksGrid");
const workCount = document.getElementById("workCount");

const API_BASE = "https://api.artic.edu/api/v1";
const FALLBACK_IIIF_URL = "https://www.artic.edu/iiif/2";

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
    nameSpan.textContent = artist.title;

    const metaSpan = document.createElement("span");
    metaSpan.className = "suggestion-meta";
    metaSpan.textContent = artist.is_artist ? "작가" : "";

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

  const url = `${API_BASE}/agents/search?q=${encodeURIComponent(query)}&fields=id,title,is_artist&limit=10`;
  const res = await fetch(url, { signal: searchAbort.signal });
  if (!res.ok) throw new Error(`검색 요청 실패 (${res.status})`);
  const data = await res.json();
  const results = (data.data || []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    is_artist: doc.is_artist,
  }));
  results.sort((a, b) => (b.is_artist === true) - (a.is_artist === true));
  return results;
}

async function loadArtistWorks(artistId) {
  const url =
    `${API_BASE}/artworks/search?query[term][artist_id]=${encodeURIComponent(artistId)}` +
    `&fields=id,title,image_id,date_display,artist_title&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`작품 목록 요청 실패 (${res.status})`);
  const data = await res.json();
  return {
    works: data.data || [],
    total: data.pagination ? data.pagination.total : (data.data || []).length,
    iiifUrl: (data.config && data.config.iiif_url) || FALLBACK_IIIF_URL,
  };
}

function renderArtist(artist, total) {
  artistPanel.hidden = false;
  artistName.textContent = artist.title;
  artistWorkCount.textContent = typeof total === "number" ? `소장 작품 ${total}점` : "";
  artistWorkCount.hidden = typeof total !== "number";
}

function extractYear(dateDisplay) {
  if (!dateDisplay) return null;
  const match = String(dateDisplay).match(/\d{3,4}/);
  return match ? parseInt(match[0], 10) : null;
}

function renderWorks(works, iiifUrl) {
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
      const ay = extractYear(a.date_display);
      const by = extractYear(b.date_display);
      return (ay ?? 9999) - (by ?? 9999);
    })
    .forEach((work) => {
      const card = document.createElement("a");
      card.className = "book-card";
      card.href = `https://www.artic.edu/artworks/${work.id}`;
      card.target = "_blank";
      card.rel = "noopener";

      const cover = document.createElement("img");
      cover.className = "book-cover";
      cover.src = work.image_id ? `${iiifUrl}/${work.image_id}/full/400,/0/default.jpg` : NO_IMAGE;
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
      year.textContent = work.date_display || "";

      info.appendChild(title);
      info.appendChild(year);
      card.appendChild(cover);
      card.appendChild(info);
      worksGrid.appendChild(card);
    });
}

async function selectArtist(artist) {
  clearSuggestions();
  input.value = artist.title;
  showEmptyState(false);
  artistPanel.hidden = true;
  worksSection.hidden = true;
  setStatus("작품을 불러오는 중...");

  try {
    const { works, total, iiifUrl } = await loadArtistWorks(artist.id);
    renderArtist(artist, total);
    renderWorks(works, iiifUrl);
    setStatus(null);
    if (!works.length) {
      setStatus("이 화가의 소장 작품을 찾지 못했어요.");
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
