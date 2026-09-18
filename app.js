// The Metropolitan Museum of Art Collection API
// Docs: https://metmuseum.github.io/
const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
const MAX_ARTWORKS = 12;

const ARTISTS = [
  "Vincent van Gogh",
  "Claude Monet",
  "Rembrandt van Rijn",
  "Johannes Vermeer",
  "Edgar Degas",
];

const artistPickerEl = document.getElementById("artistPicker");
const galleryEl = document.getElementById("gallery");
const statusEl = document.getElementById("galleryStatus");

function renderArtistPicker() {
  artistPickerEl.innerHTML = "";
  ARTISTS.forEach((name) => {
    const btn = document.createElement("button");
    btn.className = "artist-chip";
    btn.type = "button";
    btn.textContent = name;
    btn.addEventListener("click", () => selectArtist(name, btn));
    artistPickerEl.appendChild(btn);
  });
}

function setActiveChip(activeBtn) {
  document.querySelectorAll(".artist-chip").forEach((chip) => {
    chip.classList.toggle("active", chip === activeBtn);
  });
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function selectArtist(name, btn) {
  setActiveChip(btn);
  galleryEl.innerHTML = "";
  setStatus(`"${name}" 작품을 불러오는 중...`);

  try {
    const objectIDs = await searchArtworkIDs(name);

    if (objectIDs.length === 0) {
      setStatus(`"${name}"의 작품을 찾지 못했습니다.`, true);
      return;
    }

    const candidateIDs = objectIDs.slice(0, MAX_ARTWORKS * 2);
    const objects = await Promise.all(candidateIDs.map(fetchArtworkDetail));

    const artworks = objects
      .filter((obj) => obj && obj.primaryImageSmall)
      .slice(0, MAX_ARTWORKS);

    if (artworks.length === 0) {
      setStatus(`"${name}"의 이미지가 있는 작품을 찾지 못했습니다.`, true);
      return;
    }

    renderGallery(artworks);
    setStatus(`"${name}"의 작품 ${artworks.length}점`);
  } catch (err) {
    console.error(err);
    setStatus("작품을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", true);
  }
}

async function searchArtworkIDs(artistName) {
  const url = new URL(`${MET_API_BASE}/search`);
  url.searchParams.set("q", artistName);
  url.searchParams.set("artistOrCulture", "true");
  url.searchParams.set("hasImages", "true");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  const data = await res.json();
  return data.objectIDs || [];
}

async function fetchArtworkDetail(objectID) {
  try {
    const res = await fetch(`${MET_API_BASE}/objects/${objectID}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function renderGallery(artworks) {
  galleryEl.innerHTML = "";
  artworks.forEach((art) => {
    const card = document.createElement("article");
    card.className = "artwork-card";

    const img = document.createElement("img");
    img.src = art.primaryImageSmall;
    img.alt = art.title || "작품 이미지";
    img.loading = "lazy";

    const info = document.createElement("div");
    info.className = "artwork-info";

    const title = document.createElement("p");
    title.className = "artwork-title";
    title.textContent = art.title || "제목 없음";

    const meta = document.createElement("p");
    meta.className = "artwork-meta";
    meta.textContent = [art.objectDate, art.medium].filter(Boolean).join(" · ");

    info.appendChild(title);
    info.appendChild(meta);
    card.appendChild(img);
    card.appendChild(info);
    galleryEl.appendChild(card);
  });
}

renderArtistPicker();
selectArtist(ARTISTS[0], artistPickerEl.querySelector(".artist-chip"));
