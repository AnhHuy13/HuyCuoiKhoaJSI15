import { getFlagCountryCode, formatNumber } from "./utilsAdvSearch.js";

export function updatePaginationUI(currentPage, resultsPerPage, totalResultsCount) {
  const paginationWrapper = document.getElementById("pagination-wrapper");
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");
  const pageIndicator = document.getElementById("page-number-indicator");

  if (totalResultsCount <= resultsPerPage) {
    if (paginationWrapper) paginationWrapper.style.display = "none";
    return;
  }

  if (paginationWrapper) paginationWrapper.style.display = "flex";
  if (pageIndicator) {
    pageIndicator.textContent = `Trang ${currentPage} / ${Math.ceil(totalResultsCount / resultsPerPage)}`;
  }

  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage * resultsPerPage >= totalResultsCount;
}

export function renderMangaResults(mangaList = [], totalResultsCount, resultsPerPage, currentPage) {
  const container = document.getElementById("results-container");
  if (!container) return;

  const resultsCountText = document.getElementById("results-count-text");
  const paginationWrapper = document.getElementById("pagination-wrapper");

  if (mangaList.length === 0) {
    container.innerHTML = `
      <div class="empty-results-state">
        <span class="material-symbols-outlined massive-icon">search_off</span>
        <p>Không tìm thấy kết quả phù hợp. Hãy thử thay đổi bộ lọc.</p>
      </div>
    `;
    if (paginationWrapper) paginationWrapper.style.display = "none";
    if (resultsCountText) resultsCountText.style.display = "none";
    return;
  }

  if (resultsCountText) {
    resultsCountText.style.display = "block";
    resultsCountText.textContent = `Tìm thấy khoảng ${totalResultsCount} tác phẩm`;
  }

  container.innerHTML = mangaList
    .map((manga) => {
      const title =
        manga.attributes.title.en ||
        manga.attributes.title["ja-ro"] ||
        Object.values(manga.attributes.title)[0] ||
        "Chưa cập nhật tên";

      const coverRelationship = manga.relationships.find((r) => r.type === "cover_art");
      const coverFileName = coverRelationship?.attributes?.fileName;
      const coverUrl = coverFileName
        ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
        : "https://placehold.co/180x250/333/fff?text=No+Cover";

      const countryCode = getFlagCountryCode(manga.attributes.originalLanguage);
      const averageRating = manga.statistics?.rating?.average
        ? manga.statistics.rating.average.toFixed(2)
        : "N/A";
      const follows = manga.statistics?.follows ? formatNumber(manga.statistics.follows) : "0";
      const views = "N/A";
      const lastChapter = manga.attributes.lastChapter || "N/A";
      const mangaStatus = manga.attributes.status || "";

      const genres = (manga.attributes.tags || []).slice(0, 4).map((t) => t.attributes.name.en);

      const description =
        manga.attributes.description?.en ||
        Object.values(manga.attributes.description || {})[0] ||
        "Chưa có tóm tắt nội dung cho tác phẩm này.";

      return `
      <div class="manga-card" data-id="${manga.id}">
        <div class="manga-cover-container">
          <img src="${coverUrl}" alt="${title}" class="manga-cover" loading="lazy" onerror="this.src='https://placehold.co/180x250/333/fff?text=No+Cover'">
        </div>
        <div class="manga-info">
          <h3 class="manga-title">
            <a href="./manga.html?mangaId=${manga.id}" class="manga-title-link">
              ${countryCode ? `<span class="fi fi-${countryCode} flag-icon"></span>` : ""}
              ${title}
            </a>
          </h3>
          
          <div class="manga-stats">
            <span class="stat-item">
              <span class="material-symbols-outlined star-icon" style="color: #ff9800;">star</span> ${averageRating}
            </span>
            <span class="stat-item">
              <span class="material-symbols-outlined bookmark-icon" style="color: #fd4f32;">bookmark</span> ${follows}
            </span>
            <span class="stat-item">
              <span class="material-symbols-outlined eye-icon" style="color: #2196f3;">visibility</span> ${views}
            </span>
            <span class="stat-item">
              <span class="material-symbols-outlined chat-icon" style="color: #9c27b0;">chat_bubble</span> ${lastChapter}
            </span>
            ${
              mangaStatus
                ? `
              <span class="status-badge ${mangaStatus === "ongoing" ? "status-ongoing" : "status-completed"}">
                <span class="status-dot"></span> ${mangaStatus.charAt(0).toUpperCase() + mangaStatus.slice(1)}
              </span>
            `
                : ""
            }
          </div>

          <div class="manga-genres">
            ${genres.map((g) => `<span class="genre-tag">${g}</span>`).join("")}
          </div>

          <p class="manga-description">${description}</p>
        </div>
      </div>
    `;
    })
    .join("");

  updatePaginationUI(currentPage, resultsPerPage, totalResultsCount);
}
