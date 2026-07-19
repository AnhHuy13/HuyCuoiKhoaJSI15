import { SetDataCarousel } from "./manga-carousel.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";
import { SetDataMangaDetails, RenderChapterList } from "./manga-home.js";
import { layCache, luuCache } from "../helper/cacheHelper.js";
import { isLogin, readSubcollectionDoc, writeSubcollectionDoc } from "../database/firebase.js";
import { hienThiHopThoai } from "../helper/dialog.js";

const CACHE_TTL_MS = 30 * 60 * 1000;

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

async function handleLibraryAction(mangaId, mangaInfo) {
  const user = await isLogin();
  console.log("trạng thái đăng nhập: " + user);
  if (!user || user == null) {
    const diToiDangNhap = await hienThiHopThoai(
      "Bạn cần đăng nhập để thêm truyện vào thư viện cá nhân. Đi tới trang đăng nhập?",
      "Đăng nhập",
    );
    if (diToiDangNhap) {
      window.location.href = "/auth/login.html";
    }
    return;
  }

  let existingBookmark = null;
  try {
    existingBookmark = await readSubcollectionDoc(user.uid, "bookmarks", mangaId);
  } catch (error) {
    console.error("Lỗi khi tải trạng thái lưu trữ:", error);
  }

  const isAlreadyAdded = !!existingBookmark;
  const initialStatus = isAlreadyAdded ? existingBookmark.status : "reading";

  const overlay = document.createElement("div");
  overlay.className = "lib-modal-overlay";

  overlay.innerHTML = `
    <div class="lib-modal-box">
      <button class="lib-modal-close" aria-label="Đóng">&times;</button>
      <div class="lib-modal-header">
        <h4>Add To Library</h4>
      </div>
      <div class="lib-modal-body">
        <img src="${mangaInfo.cover || ""}" alt="${mangaInfo.title}" class="lib-modal-cover">
        <div class="lib-modal-content">
          <h5 class="lib-modal-title">${mangaInfo.title}</h5>
          <div class="lib-status-section">
            <span class="lib-status-label">Reading Status</span>
            <div class="lib-select-wrapper">
              <select class="lib-select">
                <option value="reading" ${initialStatus === "reading" ? "selected" : ""}>Reading</option>
                <option value="plan-to-read" ${initialStatus === "plan-to-read" ? "selected" : ""}>Plan to read</option>
                <option value="completed" ${initialStatus === "completed" ? "selected" : ""}>Completed</option>
                <option value="on-hold" ${initialStatus === "on-hold" ? "selected" : ""}>On Hold</option>
                <option value="dropped" ${initialStatus === "dropped" ? "selected" : ""}>Dropped</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="lib-modal-actions">
        <button class="lib-btn lib-btn-cancel">Cancel</button>
        <button class="lib-btn lib-btn-action" ${isAlreadyAdded ? "disabled" : ""}>
          ${isAlreadyAdded ? "Update" : "Add"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  const selectEl = overlay.querySelector(".lib-select");
  const actionBtn = overlay.querySelector(".lib-btn-action");
  const cancelBtn = overlay.querySelector(".lib-btn-cancel");
  const closeBtn = overlay.querySelector(".lib-modal-close");

  if (isAlreadyAdded) {
    selectEl.addEventListener("change", (e) => {
      if (e.target.value !== initialStatus) {
        actionBtn.removeAttribute("disabled");
      } else {
        actionBtn.setAttribute("disabled", "true");
      }
    });
  }

  function dongModal() {
    overlay.classList.remove("show");
    setTimeout(() => {
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    }, 250);
  }

  cancelBtn.onclick = dongModal;
  closeBtn.onclick = dongModal;
  overlay.onclick = (e) => {
    if (e.target === overlay) dongModal();
  };

  actionBtn.onclick = async () => {
    actionBtn.setAttribute("disabled", "true");
    actionBtn.textContent = isAlreadyAdded ? "Updating..." : "Adding...";
    const selectedStatus = selectEl.value;

    const documentData = {
      id: mangaId,
      title: mangaInfo.title || "",
      cover: mangaInfo.cover || "",
      rating: mangaInfo.rating || "N/A",
      members: mangaInfo.members || "N/A",
      views: mangaInfo.views || "N/A",
      comments: mangaInfo.comments || "N/A",
      mangaStatus: mangaInfo.status || "Ongoing",
      genres: mangaInfo.tags ? mangaInfo.tags.map((t) => t.attributes.name.en.toUpperCase()) : [],
      description: mangaInfo.desc || "",
      country: mangaInfo.country || "jp",
      status: selectedStatus,
      updatedAt: Date.now(),
    };

    try {
      await writeSubcollectionDoc(user.uid, "bookmarks", mangaId, documentData);

      localStorage.removeItem(`user_library_${user.uid}`);
      dongModal();
    } catch (err) {
      console.error("Lỗi khi ghi dữ liệu lên hệ thống:", err);
      actionBtn.removeAttribute("disabled");
      actionBtn.textContent = isAlreadyAdded ? "Update" : "Add";
    }
  };
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

    const cacheKey = `cache_manga_detail_${mangaId}`;
    let info = layCache(cacheKey, CACHE_TTL_MS);

    if (!info) {
      info = await LayThongTinManga(mangaId);
      if (info) {
        luuCache(cacheKey, info);
      }
    }

    if (info) {
      updateProgress(75, "Đang tải hình ảnh và danh sách chương...");

      SetDataMangaDetails(info);

      await Promise.all([SetDataCarousel(info), RenderChapterList(mangaId)]);

      const libraryBtn = document.querySelector(".manga-carousel-library-btn");
      if (libraryBtn) {
        libraryBtn.addEventListener("click", () => {
          handleLibraryAction(mangaId, info);
        });
      }

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
