import {
  isLogin,
  getSubcollectionDocs,
  writeSubcollectionDoc,
  deleteMangaBookmark,
} from "../database/firebase.js";
import { luuCache, layCache } from "../helper/cacheHelper.js";
import { hienThiHopThoai } from "../helper/dialog.js";

const CACHE_TTL = 3 * 60 * 1000;

let currentUser = null;
let mangaList = [];
let currentFilter = "reading";

function updateProgress(percentage, text) {
  const progressBar = document.getElementById("load-progress");
  const loadingText = document.querySelector(".loading-text");
  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (loadingText && text) loadingText.textContent = text;
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.classList.add("fade-out");
}

async function loadLibraryData() {
  currentUser = await isLogin();

  if (!currentUser) {
    updateProgress(100, "Vui lòng đăng nhập");
    mangaList = [];
    return;
  }

  updateProgress(60, "Đang tải danh sách từ đám mây...");
  const cacheKey = `user_library_${currentUser.uid}`;
  const cachedData = layCache(cacheKey, CACHE_TTL);

  if (cachedData) {
    mangaList = cachedData;
  } else {
    try {
      // Đọc toàn bộ danh sách bookmark thực tế của người dùng
      const dbDocs = await getSubcollectionDocs(currentUser.uid, "bookmarks");
      mangaList = dbDocs || [];
      luuCache(cacheKey, mangaList);
    } catch (error) {
      console.error("Lỗi khi kết nối cơ sở dữ liệu:", error);
      mangaList = [];
    }
  }
}

// Đồng bộ thay đổi dữ liệu vào cache cục bộ
function saveToCacheOnly() {
  if (currentUser) {
    const cacheKey = `user_library_${currentUser.uid}`;
    luuCache(cacheKey, mangaList);
  }
}

// Hiển thị danh sách truyện
function renderMangaList() {
  const container = document.querySelector(".favorite-main-page");
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Vui lòng đăng nhập để xem và quản lý thư viện cá nhân của bạn.</p>
        <button class="btn btn-danger btn-sm mt-2" onclick="window.location.href='/login.html'">Đăng nhập ngay</button>
      </div>
    `;
    return;
  }

  const filtered = mangaList.filter((item) => item.status === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Danh sách này hiện chưa có truyện nào.</p>
        <p class="sub-text">Hãy tìm kiếm và thêm truyện yêu thích vào thư viện của bạn.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map(
      (manga) => `
    <div class="manga-card" data-id="${manga.id}">
      <div class="manga-cover-container">
        <img src="${manga.cover || ""}" alt="${manga.title || "Manga"}" class="manga-cover" onerror="this.src='https://placehold.co/180x250/333/fff?text=No+Cover'">
      </div>
      <div class="manga-info">
        <h3 class="manga-title" onclick="window.location.href = '/html/manga.html?mangaId=${manga.id}'">
          ${manga.country ? `<span class="fi fi-${manga.country.toLowerCase()} flag-icon"></span>` : ""}
          ${manga.title || "Chưa cập nhật tên"}
        </h3>
        
        <div class="manga-stats">
          <span class="stat-item"><span class="material-symbols-outlined star-icon">star</span> ${manga.rating || "N/A"}</span>
          <span class="stat-item"><span class="material-symbols-outlined bookmark-icon">bookmark</span> ${manga.members || "0"}</span>
          <span class="stat-item"><span class="material-symbols-outlined eye-icon">visibility</span> ${manga.views || "N/A"}</span>
          ${
            manga.mangaStatus
              ? `
            <span class="status-badge ${manga.mangaStatus.toLowerCase() === "ongoing" ? "status-ongoing" : "status-completed"}">
              <span class="status-dot"></span> ${manga.mangaStatus}
            </span>
          `
              : ""
          }
        </div>

        <div class="manga-genres">
          ${manga.genres && Array.isArray(manga.genres) ? manga.genres.map((g) => `<span class="genre-tag">${g.toUpperCase()}</span>`).join("") : ""}
        </div>

        <p class="manga-description">${manga.description || "Chưa có tóm tắt nội dung cho tác phẩm này."}</p>
        
        <div class="manga-controls">
          <div class="control-group">
            <label for="select-${manga.id}">Trạng thái:</label>
            <select class="status-select" id="select-${manga.id}" data-id="${manga.id}">
              <option value="reading" ${manga.status === "reading" ? "selected" : ""}>Reading</option>
              <option value="plan-to-read" ${manga.status === "plan-to-read" ? "selected" : ""}>Plan to read</option>
              <option value="completed" ${manga.status === "completed" ? "selected" : ""}>Completed</option>
              <option value="on-hold" ${manga.status === "on-hold" ? "selected" : ""}>On-hold</option>
              <option value="dropped" ${manga.status === "dropped" ? "selected" : ""}>Dropped</option>
            </select>
          </div>
          <button class="remove-btn" data-id="${manga.id}">
            <span class="material-symbols-outlined delete-icon">delete</span>
            <p>Xóa</p>
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  setupCardEventListeners();
}

// Lắng nghe các thay đổi trên thẻ truyện
function setupCardEventListeners() {
  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const mangaId = e.target.dataset.id;
      const newStatus = e.target.value;

      const mangaIndex = mangaList.findIndex((m) => m.id === mangaId);
      if (mangaIndex !== -1 && currentUser) {
        mangaList[mangaIndex].status = newStatus;

        // Lưu thay đổi lên Firestore thực tế
        await writeSubcollectionDoc(currentUser.uid, "bookmarks", mangaId, { status: newStatus });
        saveToCacheOnly();
        renderMangaList();
      }
    });
  });

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mangaId = btn.dataset.id;
      const manga = mangaList.find((m) => m.id === mangaId);
      if (!manga) return;

      const xacNhan = await hienThiHopThoai(
        `Bạn có chắc chắn muốn xóa "${manga.title}" khỏi thư viện không?`,
        "Xác nhận xóa",
        "Hủy",
      );

      if (xacNhan && currentUser) {
        mangaList = mangaList.filter((m) => m.id !== mangaId);
        await deleteMangaBookmark(currentUser.uid, mangaId);
        saveToCacheOnly();
        renderMangaList();
      }
    });
  });
}

// Gán sự kiện chuyển đổi qua lại giữa các Tab trạng thái đọc
function setupTabEvents() {
  const tabs = [
    { id: "reading-status-button", value: "reading" },
    { id: "plan-to-read-status-button", value: "plan-to-read" },
    { id: "completed-status-button", value: "completed" },
    { id: "on-hold-status-button", value: "on-hold" },
    { id: "dropped-status-button", value: "dropped" },
  ];

  tabs.forEach((tab) => {
    const btn = document.getElementById(tab.id);
    if (btn) {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".status-button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = tab.value;
        renderMangaList();
      });
    }
  });

  const goHomeBtn = document.querySelector(".go-home");
  if (goHomeBtn) {
    goHomeBtn.addEventListener("click", () => {
      window.location.href = "/";
    });
  }
}

// Thực thi tiến trình tải trang
window.addEventListener("DOMContentLoaded", async () => {
  try {
    updateProgress(20, "Đang xác thực tài khoản...");
    setupTabEvents();
    await loadLibraryData();
    updateProgress(100, "Tải thành công");
    renderMangaList();
    setTimeout(hideLoadingScreen, 250);
  } catch (error) {
    console.error("Lỗi xảy ra trong quá trình khởi tạo thư viện:", error);
    updateProgress(100, "Gặp lỗi hệ thống. Vui lòng thử lại.");
  }
});
