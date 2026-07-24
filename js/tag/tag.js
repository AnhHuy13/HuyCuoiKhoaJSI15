import { fetchTagName, fetchTrendingMangaByTag } from "../fetch/fetchTag.js";

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

window.addEventListener("DOMContentLoaded", async () => {
  showLoadingScreen("Đang tải thông tin thể loại...");

  const params = new URLSearchParams(window.location.search);
  const tagId = params.get("tagId");

  if (!tagId) {
    updateProgress(100, "Mã phân loại không tồn tại hoặc không hợp lệ!");
    setTimeout(() => {
      window.location.href = "./trangchu.html";
    }, 1500);
    return;
  }

  try {
    updateProgress(40, "Đang tải dữ liệu tên phân loại...");
    const tagName = await fetchTagName(tagId);

    document.title = tagName;
    const headerTitle = document.getElementById("tag-title-header");
    if (headerTitle) headerTitle.textContent = tagName;

    const browseLink = document.getElementById("browse-all-link");
    if (browseLink) {
      browseLink.textContent = `Browse all ${tagName} titles`;
      // Điều hướng đúng cấu trúc tham số được yêu cầu
      browseLink.href = `./advancedSearch.html?includedTags=${tagId}&incMode=OR&excMode=OR`;
    }

    updateProgress(70, "Đang tải sách nổi bật...");
    const trendingManga = await fetchTrendingMangaByTag(tagId);

    const container = document.getElementById("trending-manga-container");
    if (container) {
      if (trendingManga.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5 text-muted">
            <p>Hiện tại chưa có dữ liệu nổi bật cho thể loại này.</p>
          </div>
        `;
      } else {
        container.innerHTML = trendingManga
          .map((manga) => {
            const tagsHtml = manga.tags
              .map((tag) => `<span class="manga-tag-pill">${tag}</span>`)
              .join("");

            return `
              <div class="manga-trending-card" data-id="${manga.id}">
                <img src="${manga.cover}" alt="${manga.title}" class="card-background-img" loading="lazy">
                <div class="card-info-overlay">
                  <h4 class="card-manga-title">${manga.title}</h4>
                  <div class="card-manga-tags">
                    ${tagsHtml}
                  </div>
                </div>
              </div>
            `;
          })
          .join("");

        // Gắn sự kiện click trực tiếp lên các thẻ card
        document.querySelectorAll(".manga-trending-card").forEach((card) => {
          card.addEventListener("click", () => {
            const mangaId = card.dataset.id;
            window.location.href = `./manga.html?mangaId=${mangaId}`;
          });
        });
      }
    }

    updateProgress(100, "Hoàn thành!");
    setTimeout(hideLoadingScreen, 200);
  } catch (error) {
    console.error("Lỗi tải trang tag:", error);
    hideLoadingScreen();
  }

  const backBtn = document.getElementById("back-btn");
  backBtn?.addEventListener("click", () => {
    window.location.href = "./trangchu.html";
  });
});
