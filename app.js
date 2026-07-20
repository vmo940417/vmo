const input = document.getElementById("authorInput");
const suggestionsBox = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("emptyState");
const authorPanel = document.getElementById("authorPanel");
const authorPhoto = document.getElementById("authorPhoto");
const authorName = document.getElementById("authorName");
const authorDates = document.getElementById("authorDates");
const authorTopWork = document.getElementById("authorTopWork");
const booksSection = document.getElementById("booksSection");
const booksGrid = document.getElementById("booksGrid");
const bookCount = document.getElementById("bookCount");

const NO_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="100%" height="100%" fill="#d8cfc2"/><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#8a8073" font-family="sans-serif">표지 없음</text></svg>'
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

function renderSuggestions(authors) {
  currentSuggestions = authors;
  activeIndex = -1;
  if (!authors.length) {
    clearSuggestions();
    return;
  }
  suggestionsBox.innerHTML = "";
  authors.forEach((author, idx) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.dataset.index = String(idx);

    const nameSpan = document.createElement("span");
    nameSpan.className = "suggestion-name";
    nameSpan.textContent = author.name;

    const metaSpan = document.createElement("span");
    metaSpan.className = "suggestion-meta";
    const parts = [];
    if (author.birth_date) parts.push(author.birth_date);
    if (typeof author.work_count === "number") parts.push(`저서 ${author.work_count}권`);
    metaSpan.textContent = parts.join(" · ");

    item.appendChild(nameSpan);
    item.appendChild(metaSpan);
    item.addEventListener("click", () => selectAuthor(author));

    suggestionsBox.appendChild(item);
  });
  suggestionsBox.hidden = false;
}

function highlightActive() {
  [...suggestionsBox.children].forEach((el, idx) => {
    el.classList.toggle("active", idx === activeIndex);
  });
}

async function searchAuthors(query) {
  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();

  const url = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url, { signal: searchAbort.signal });
  if (!res.ok) throw new Error(`검색 요청 실패 (${res.status})`);
  const data = await res.json();
  return (data.docs || []).map((doc) => ({
    key: doc.key,
    name: doc.name,
    birth_date: doc.birth_date,
    death_date: doc.death_date,
    top_work: doc.top_work,
    work_count: doc.work_count,
  }));
}

async function loadAuthorWorks(authorKey) {
  const url = `https://openlibrary.org/authors/${authorKey}/works.json?limit=48`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`저서 목록 요청 실패 (${res.status})`);
  const data = await res.json();
  return data.entries || [];
}

function renderAuthor(author) {
  authorPanel.hidden = false;
  authorName.textContent = author.name;

  const dateParts = [];
  if (author.birth_date) dateParts.push(author.birth_date);
  if (author.death_date) dateParts.push(author.death_date);
  authorDates.textContent = dateParts.length ? dateParts.join(" – ") : "";
  authorDates.hidden = dateParts.length === 0;

  authorTopWork.textContent = author.top_work ? `대표작: ${author.top_work}` : "";
  authorTopWork.hidden = !author.top_work;

  authorPhoto.src = `https://covers.openlibrary.org/a/olid/${author.key}-M.jpg`;
  authorPhoto.alt = author.name;
  authorPhoto.onerror = () => {
    authorPhoto.onerror = null;
    authorPhoto.src = NO_COVER;
  };
}

function renderBooks(works) {
  booksGrid.innerHTML = "";

  if (!works.length) {
    booksSection.hidden = true;
    return;
  }

  booksSection.hidden = false;
  bookCount.textContent = `(${works.length}권)`;

  works
    .slice()
    .sort((a, b) => {
      const ay = a.first_publish_date ? parseInt(a.first_publish_date, 10) : 0;
      const by = b.first_publish_date ? parseInt(b.first_publish_date, 10) : 0;
      return (ay || 9999) - (by || 9999);
    })
    .forEach((work) => {
      const card = document.createElement("a");
      card.className = "book-card";
      card.href = `https://openlibrary.org${work.key}`;
      card.target = "_blank";
      card.rel = "noopener";

      const cover = document.createElement("img");
      cover.className = "book-cover";
      const coverId = Array.isArray(work.covers) ? work.covers.find((c) => c && c > 0) : null;
      cover.src = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : NO_COVER;
      cover.alt = work.title || "";
      cover.loading = "lazy";
      cover.onerror = () => {
        cover.onerror = null;
        cover.src = NO_COVER;
      };

      const info = document.createElement("div");
      info.className = "book-info";

      const title = document.createElement("p");
      title.className = "book-title";
      title.textContent = work.title || "제목 없음";

      const year = document.createElement("p");
      year.className = "book-year";
      year.textContent = work.first_publish_date || "";

      info.appendChild(title);
      info.appendChild(year);
      card.appendChild(cover);
      card.appendChild(info);
      booksGrid.appendChild(card);
    });
}

async function selectAuthor(author) {
  clearSuggestions();
  input.value = author.name;
  showEmptyState(false);
  authorPanel.hidden = true;
  booksSection.hidden = true;
  setStatus("저서를 불러오는 중...");

  try {
    const works = await loadAuthorWorks(author.key.replace("/authors/", ""));
    renderAuthor(author);
    renderBooks(works);
    setStatus(null);
  } catch (err) {
    console.error(err);
    setStatus("저서를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
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
      const authors = await searchAuthors(query);
      setStatus(null);
      renderSuggestions(authors);
      if (!authors.length) {
        setStatus("일치하는 작가를 찾지 못했어요.");
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
    if (chosen) selectAuthor(chosen);
  } else if (e.key === "Escape") {
    clearSuggestions();
  }
});

document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== input) {
    clearSuggestions();
  }
});
