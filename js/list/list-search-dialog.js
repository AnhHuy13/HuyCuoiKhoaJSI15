import { FetchMangaWithStats } from "../fetch/fetchList.js";
import { luuCache, layCache } from "../helper/cacheHelper.js";
import { vietHoaChuCaiDauTien, changeStatusToColor } from "../helper/utility.js";

const dialogSearchInput = document.getElementById("dialog-search-input");
const dialogClearSearchBtn = document.getElementById("dialog-clear-search-btn");
const dialogSortSelect = document.getElementById("dialog-sort-select");
const dialogResultsContainer = document.getElementById("dialog-results-container");

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
let currentPage = 1;
let totalItems = 0;
const limit = 15;
let currentKeyword = "";

let onSelectionToggle = null;
let isAddedChecker = null;

export function initSearchDialog(toggleCallback, checkerCallback) {
  onSelectionToggle = toggleCallback;
  isAddedChecker = checkerCallback;
  setupDialogEvents();
}

function setupDialogEvents() {
  dialogSearchInput.addEventListener(
    "input",
    debounce((e) => {
      currentKeyword = e.target.value.trim();
      currentPage = 1;
      if (currentKeyword) {
        dialogClearSearchBtn.style.display = "block";
        performMangaSearch();
      } else {
        dialogClearSearchBtn.style.display = "none";
        clearResults();
      }
    }, 500),
  );

  dialogClearSearchBtn.addEventListener("click", () => {
    dialogSearchInput.value = "";
    dialogClearSearchBtn.style.display = "none";
    currentKeyword = "";
    clearResults();
  });

  dialogSortSelect.addEventListener("change", () => {
    if (currentKeyword) {
      currentPage = 1;
      performMangaSearch();
    }
  });
}

function clearResults() {
  dialogResultsContainer.innerHTML = `
    <div class="empty-results-state">
      <span class="material-symbols-outlined">search</span>
      <p>Nhập từ khóa để bắt đầu tìm kiếm truyện</p>
    </div>`;
  removePagination();
}

async function performMangaSearch() {
  dialogResultsContainer.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>`;

  const sort = dialogSortSelect.value;
  const offset = (currentPage - 1) * limit;
  const cacheKey = `manga_stats_search_${currentKeyword}_offset_${offset}_sort_${sort}`;

  const cached = layCache(cacheKey, SEARCH_CACHE_TTL_MS);
  if (cached) {
    totalItems = cached.total;
    renderResults(cached.mangaList);
    renderPagination();
    return;
  }

  try {
    const { mangaList, total } = await FetchMangaWithStats(currentKeyword, offset, limit, sort);
    totalItems = total;

    luuCache(cacheKey, { mangaList, total });
    renderResults(mangaList);
    renderPagination();
  } catch (err) {
    dialogResultsContainer.innerHTML = `<div class="text-center text-danger py-5">Lỗi kết nối API.</div>`;
  }
}

function renderResults(mangaList) {
  dialogResultsContainer.innerHTML = "";
  if (mangaList.length === 0) {
    dialogResultsContainer.innerHTML = `<div class="empty-results-state"><p>Không tìm thấy dữ liệu.</p></div>`;
    return;
  }

  mangaList.forEach((manga) => {
    const id = manga.id;
    const title = Object.values(manga.attributes.title || {})[0] || "Unknown";
    const desc = manga.attributes.description?.en || "No description available.";
    const status = manga.attributes.status || "ongoing";

    const coverRel = manga.relationships.find((r) => r.type === "cover_art");
    const coverFileName = coverRel?.attributes?.fileName;
    const coverUrl = coverFileName
      ? `https://uploads.mangadex.org/covers/${id}/${coverFileName}.256.jpg`
      : "https://placehold.co/250x350/212224/FFF?text=No+Cover";

    const isAdded = isAddedChecker(id);
    const statusColor = changeStatusToColor(status);
    const capitalizedStatus = vietHoaChuCaiDauTien(status);

    const cRating = manga.attributes.contentRating;
    const ratingTagHtml =
      cRating && cRating !== "safe"
        ? `<span class="genre-tag highlight">${cRating.toUpperCase()}</span>`
        : "";

    const genreTagsHtml = manga.attributes.tags
      .slice(0, 5)
      .map((t) => `<span class="genre-tag">${t.attributes.name.en}</span>`)
      .join("");

    const card = document.createElement("div");
    card.className = "manga-card";
    card.innerHTML = `
      <div class="manga-cover-container">
        <img class="manga-cover" src="${coverUrl}" alt="${title}">
      </div>
      <button class="btn-dialog-add-manga ${isAdded ? "added" : ""}" data-id="${id}">
        <span class="material-symbols-outlined">${isAdded ? "done" : "add"}</span>
      </button>
      <div class="manga-info">
        <h4 class="manga-title">
          <a class="manga-title-link" href="#" onclick="event.preventDefault();">${title}</a>
        </h4>
        <div class="manga-stats">
          <span class="stat-item"><span class="material-symbols-outlined" style="color: #ffb74d;">star</span> ${manga.rating}</span>
          <span class="stat-item"><span class="material-symbols-outlined">bookmark</span> ${manga.bookmarks}</span>
          <span class="stat-item"><span class="material-symbols-outlined">visibility</span> N/A</span>
          <span class="stat-item"><span class="material-symbols-outlined">chat_bubble</span> 0</span>
          <span class="status-badge" style="border: 1px solid ${statusColor}33; color: ${statusColor}; background-color: ${statusColor}10;">
            <span class="status-dot" style="background-color: ${statusColor};"></span>
            ${capitalizedStatus}
          </span>
        </div>
        <div class="manga-genres">
          ${ratingTagHtml}
          ${genreTagsHtml}
        </div>
        <p class="manga-description">${desc}</p>
      </div>
    `;

    card.querySelector(".btn-dialog-add-manga").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      // Truyền gói dữ liệu đầy đủ
      onSelectionToggle(
        {
          id,
          title,
          cover: coverUrl,
          description: desc,
          status,
          tags: manga.attributes.tags,
          contentRating: cRating,
          rating: manga.rating,
          bookmarks: manga.bookmarks,
        },
        btn,
      );
    });

    dialogResultsContainer.appendChild(card);
  });
}

function renderPagination() {
  removePagination();
  const totalPages = Math.ceil(totalItems / limit);
  if (totalPages <= 1) return;

  const pagWrapper = document.createElement("div");
  pagWrapper.className = "pagination-container";
  pagWrapper.id = "dialog-pagination";

  const prevBtn = document.createElement("button");
  prevBtn.className = `page-btn ${currentPage === 1 ? "disabled" : ""}`;
  prevBtn.innerHTML = `<span class="material-symbols-outlined">west</span>`;
  if (currentPage > 1) {
    prevBtn.addEventListener("click", () => {
      currentPage--;
      performMangaSearch();
    });
  }
  pagWrapper.appendChild(prevBtn);

  const range = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-btn ${i === currentPage ? "active" : ""}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener("click", () => {
        currentPage = i;
        performMangaSearch();
      });
      pagWrapper.appendChild(pageBtn);
    } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.textContent = "...";
      pagWrapper.appendChild(dots);
    }
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = `page-btn ${currentPage === totalPages ? "disabled" : ""}`;
  nextBtn.innerHTML = `<span class="material-symbols-outlined">east</span>`;
  if (currentPage < totalPages) {
    nextBtn.addEventListener("click", () => {
      currentPage++;
      performMangaSearch();
    });
  }
  pagWrapper.appendChild(nextBtn);

  dialogResultsContainer.after(pagWrapper);
}

function removePagination() {
  const existing = document.getElementById("dialog-pagination");
  if (existing) existing.remove();
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
