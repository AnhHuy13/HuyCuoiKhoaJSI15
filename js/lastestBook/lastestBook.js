import { fetchLastestBook } from "../fetch/fetchLastestBook.js";
import { ChuyenLocale, changeStatusToColor, vietHoaChuCaiDauTien } from "../helper/utility.js";

let lastSearchResults = [];
let currentPage = 1;
const resultsPerPage = 20;
let totalResultsCount = 0;
let currentLayout = "list";

function updateProgress(percentage, text) {
  const progressBar = document.getElementById("load-progress");
  const loadingText = document.querySelector(".loading-text");

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  if (loadingText && text) {
    loadingText.textContent = text;
  }
}

function showLoadingScreen(text) {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.remove("fade-out");
    updateProgress(20, text);
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
}

function renderMangaResults() {
  const container = document.getElementById("results-container");
  if (!container) return;

  if (lastSearchResults.length === 0) {
    container.innerHTML = `
      <div class="empty-results-state">
        <span class="material-symbols-outlined massive-icon">search</span>
        <p>Không tìm thấy truyện nào.</p>
      </div>
    `;
    document.getElementById("pagination-wrapper").style.display = "none";
    document.getElementById("results-count-text").style.display = "none";
    return;
  }

  const metaText = document.getElementById("results-count-text");
  if (metaText) {
    metaText.style.display = "block";
    metaText.textContent = `Hiển thị ${lastSearchResults.length} trên tổng số ${totalResultsCount} bộ truyện`;
  }

  const paginationWrapper = document.getElementById("pagination-wrapper");
  if (paginationWrapper) {
    paginationWrapper.style.display = "flex";
    document.getElementById("page-number-indicator").textContent = `Trang ${currentPage}`;
    document.getElementById("prev-page-btn").disabled = currentPage === 1;
    document.getElementById("next-page-btn").disabled =
      currentPage * resultsPerPage >= totalResultsCount;
  }

  const html = lastSearchResults
    .map((manga) => {
      // Ánh xạ dữ liệu bằng tiện ích từ utility.js
      const flagCode = ChuyenLocale(manga.originalLanguage);
      const statusColor = changeStatusToColor(manga.status);
      const statusText = vietHoaChuCaiDauTien(manga.status || "Unknown");

      const contentTagHtml =
        manga.contentRating && manga.contentRating !== "safe"
          ? `<span class="genre-tag suggestive">${manga.contentRating.toUpperCase()}</span>`
          : "";

      const topGenres = manga.tags
        .filter((t) => t.attributes?.group === "genre")
        .slice(0, 3)
        .map((t) => `<span class="genre-tag">${t.attributes.name.en.toUpperCase()}</span>`)
        .join("");

      const hasMoreTags = manga.tags.filter((t) => t.attributes?.group === "genre").length > 3;
      const moreTagHtml = hasMoreTags ? `<span class="more-tag">MORE</span>` : "";

      const ratingDisplay = manga.rating !== "N/A" ? parseFloat(manga.rating).toFixed(2) : "N/A";

      if (currentLayout === "compact") {
        return `
        <div class="manga-card">
          <div class="manga-cover-container">
            <img src="${manga.cover}" alt="${manga.title}" class="manga-cover" loading="lazy">
          </div>
          <div class="manga-info">
            <div class="title-row">
              <span class="fi fi-${flagCode}"></span>
              <p class="manga-title">
                <a href="./manga.html?mangaId=${manga.id}" class="manga-title-link">${manga.title}</a>
              </p>
            </div>
            <div class="manga-stats">
              <div class="stat-item"><i class="bi bi-star"></i> ${ratingDisplay}</div>
              <div class="stat-item"><i class="bi bi-bookmark"></i> ${manga.follows}</div>
            </div>
            <div class="status-badge" style="color: ${statusColor}">
              <div class="status-dot" style="background-color: ${statusColor}"></div>
              <span>${statusText}</span>
            </div>
          </div>
        </div>
      `;
      } else if (currentLayout === "grid") {
        return `
        <div class="manga-card">
          <div class="manga-cover-container">
            <a href="./manga.html?mangaId=${manga.id}">
              <img src="${manga.cover}" alt="${manga.title}" class="manga-cover" loading="lazy">
            </a>
          </div>
          <div class="manga-info">
            <div class="title-row">
              <span class="fi fi-${flagCode}"></span>
              <p class="manga-title">
                <a href="./manga.html?mangaId=${manga.id}" class="manga-title-link">${manga.title}</a>
              </p>
            </div>
            <div class="manga-stats">
              <div class="stat-item"><i class="bi bi-star"></i> ${ratingDisplay}</div>
              <div class="stat-item"><i class="bi bi-bookmark"></i> ${manga.follows}</div>
            </div>
          </div>
        </div>
      `;
      } else {
        // Giao diện chi tiết thẻ ngang khớp 100% với screenshot
        return `
        <div class="manga-card">
          <div class="manga-cover-container">
            <a href="./manga.html?mangaId=${manga.id}">
              <img src="${manga.cover}" alt="${manga.title}" class="manga-cover" loading="lazy">
            </a>
          </div>
          <div class="manga-info">
            <div class="title-row">
              <span class="fi fi-${flagCode} flag-icon"></span>
              <h5 class="manga-title">
                <a href="./manga.html?mangaId=${manga.id}" class="manga-title-link">${manga.title}</a>
              </h5>
            </div>
            <div class="manga-stats">
              <div class="stat-item"><i class="bi bi-star"></i> ${ratingDisplay}</div>
              <div class="stat-item"><i class="bi bi-bookmark"></i> ${manga.follows}</div>
              <div class="stat-item"><i class="bi bi-eye"></i> N/A</div>
              <div class="stat-item"><i class="bi bi-chat-left"></i> ${manga.comments}</div>
              <div class="status-badge" style="color: ${statusColor}; background-color: rgba(255, 255, 255, 0.05)">
                <div class="status-dot" style="background-color: ${statusColor}"></div>
                <span>${statusText}</span>
              </div>
            </div>
            <div class="manga-genres">
              ${contentTagHtml}
              ${topGenres}
              ${moreTagHtml}
            </div>
            <p class="manga-description">${manga.desc}</p>
          </div>
        </div>
      `;
      }
    })
    .join("");

  container.innerHTML = html;
}

async function performSearch() {
  showLoadingScreen("Đang cập nhật danh sách truyện mới nhất...");
  try {
    const offset = (currentPage - 1) * resultsPerPage;
    updateProgress(50, "Đang kết nối API MangaDex...");

    const response = await fetchLastestBook(offset, resultsPerPage);

    lastSearchResults = response.data || [];
    totalResultsCount = response.total || 0;

    updateProgress(90, "Đang tối ưu hóa giao diện hiển thị...");
    renderMangaResults();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu sách mới:", error);
    const container = document.getElementById("results-container");
    if (container) {
      container.innerHTML = `
        <div class="empty-results-state">
          <span class="material-symbols-outlined massive-icon">error</span>
          <p>Không thể kết nối đến hệ thống dữ liệu MangaDex. Vui lòng thử lại sau.</p>
        </div>
      `;
    }
  } finally {
    hideLoadingScreen();
  }
}

function setupEvents() {
  const btnBack = document.getElementById("back-btn");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.location.href = "./trangchu.html";
    });
  }

  const layoutCompactListBtn = document.getElementById("layout-compact-list-btn");
  const layoutDetailedBtn = document.getElementById("layout-detailed-btn");
  const layoutGridBtn = document.getElementById("layout-grid-btn");
  const resultsContainer = document.getElementById("results-container");

  const switchLayout = (mode) => {
    currentLayout = mode;
    layoutCompactListBtn?.classList.remove("active");
    layoutDetailedBtn?.classList.remove("active");
    layoutGridBtn?.classList.remove("active");
    resultsContainer?.classList.remove("list-view", "grid-view", "compact-view");

    if (mode === "compact") {
      layoutCompactListBtn?.classList.add("active");
      resultsContainer?.classList.add("compact-view");
    } else if (mode === "grid") {
      layoutGridBtn?.classList.add("active");
      resultsContainer?.classList.add("grid-view");
    } else {
      layoutDetailedBtn?.classList.add("active");
      resultsContainer?.classList.add("list-view");
    }
    renderMangaResults();
  };

  layoutCompactListBtn?.addEventListener("click", () => switchLayout("compact"));
  layoutDetailedBtn?.addEventListener("click", () => switchLayout("list"));
  layoutGridBtn?.addEventListener("click", () => switchLayout("grid"));

  const prevPageBtn = document.getElementById("prev-page-btn");
  const nextPageBtn = document.getElementById("next-page-btn");

  prevPageBtn?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      performSearch();
    }
  });

  nextPageBtn?.addEventListener("click", () => {
    if (currentPage * resultsPerPage < totalResultsCount) {
      currentPage++;
      performSearch();
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  setupEvents();
  await performSearch();
});
