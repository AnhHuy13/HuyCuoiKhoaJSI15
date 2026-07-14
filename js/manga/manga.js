import { SetDataCarousel } from "./manga-carousel.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";
import { SetDataMangaDetails, RenderChapterList } from "./manga-home.js";

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

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    updateProgress(20, "Đang kết nối hệ thống dữ liệu...");

    const params = new URLSearchParams(window.location.search);
    const mangaId = params.get("mangaId");

    if (!mangaId) {
      updateProgress(100, "Không tìm thấy mã truyện!");
      hideLoadingScreen();
      return;
    }

    updateProgress(50, "Đang tải thông tin chi tiết...");
    const info = await LayThongTinManga(mangaId);

    if (info) {
      updateProgress(75, "Đang dựng cấu trúc danh sách chương...");

      SetDataCarousel(info);
      SetDataMangaDetails(info);

      await RenderChapterList(mangaId);

      updateProgress(100, "Hoàn tất!");
      setTimeout(() => {
        hideLoadingScreen();
      }, 400);
    } else {
      updateProgress(100, "Không thể tải dữ liệu bộ truyện này.");
      hideLoadingScreen();
    }
  } catch (error) {
    console.error("Lỗi xảy ra trong quá trình tải dữ liệu trang truyện:", error);
    updateProgress(100, "Đã xảy ra lỗi.");
    hideLoadingScreen();
  }
});
