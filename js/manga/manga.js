// js/manga/manga.js

import { SetDataCarousel } from "./manga-carousel.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";
import { SetDataMangaDetails, RenderChapterList } from "./manga-home.js";
import { layCache, luuCache } from "../helper/cacheHelper.js";
import {
  isLogin,
  readSubcollectionDoc,
  writeSubcollectionDoc,
  getSubcollectionDocs,
  readUserField,
} from "../database/firebase.js";
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

// ==========================================================
// 1. THÊM TRUYỆN VÀO THƯ VIỆN CÁ NHÂN (READING STATUS)
// ==========================================================
async function handleLibraryAction(mangaId, mangaInfo) {
  const user = await isLogin();
  if (!user) {
    await hienThiHopThoai("Bạn cần đăng nhập để thêm truyện vào thư viện cá nhân.", "Đăng nhập");
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

// ==========================================================
// 2. THÊM TRUYỆN VÀO CUSTOM LIST (ADD TO LIST MODAL)
// ==========================================================
async function handleAddToListAction(mangaId, mangaInfo) {
  const user = await isLogin();
  if (!user) {
    await hienThiHopThoai("Bạn cần đăng nhập để quản lý danh sách cá nhân.", "Đăng nhập");
    return;
  }

  // Đọc toàn bộ Custom Lists của người dùng hiện tại
  let userLists = await getSubcollectionDocs(user.uid, "customLists");

  // Đóng gói dữ liệu truyện ngắn gọn để lưu vào array titles của list
  const currentMangaItem = {
    id: mangaId,
    title: mangaInfo.title || "Unknown",
    cover: mangaInfo.cover || "",
    description: mangaInfo.desc || "",
    status: mangaInfo.status || "ongoing",
    rating: mangaInfo.rating || "8.00",
    bookmarks: mangaInfo.members || "N/A",
    contentRating: mangaInfo.contentRating || "safe",
    tags: mangaInfo.tags || [],
  };

  const overlay = document.createElement("div");
  overlay.className = "lib-modal-overlay";

  function renderAddToListModalContent() {
    const listItemsHtml = userLists
      .map((list) => {
        const isChecked = (list.titles || []).some((t) => t.id === mangaId);
        return `
        <label class="custom-list-checkbox-item">
          <input type="checkbox" data-list-id="${list.id}" ${isChecked ? "checked" : ""}>
          <span class="checkbox-custom"></span>
          <span class="custom-list-item-name">${list.name}</span>
          <span class="badge-visibility ${list.visibility.toLowerCase()}">${list.visibility}</span>
        </label>
      `;
      })
      .join("");

    overlay.innerHTML = `
      <div class="lib-modal-box">
        <button class="lib-modal-close" aria-label="Đóng">&times;</button>
        <div class="lib-modal-header">
          <h4>Add To List</h4>
        </div>
        <div class="lib-modal-body flex-column">
          <div class="custom-lists-container">
            ${listItemsHtml.length > 0 ? listItemsHtml : '<p class="text-muted text-center py-3 mb-0">Chưa có danh sách nào.</p>'}
          </div>
          <button class="btn-create-new-list-trigger" id="btn-trigger-create-list">
            <span class="material-symbols-outlined">+</span> Create new list
          </button>
        </div>
        <div class="lib-modal-actions">
          <button class="lib-btn lib-btn-cancel">Cancel</button>
          <button class="lib-btn lib-btn-action" id="btn-save-list-selection">Save</button>
        </div>
      </div>
    `;

    bindAddToListEvents();
  }

  function bindAddToListEvents() {
    const closeBtn = overlay.querySelector(".lib-modal-close");
    const cancelBtn = overlay.querySelector(".lib-btn-cancel");
    const saveBtn = overlay.querySelector("#btn-save-list-selection");
    const createTriggerBtn = overlay.querySelector("#btn-trigger-create-list");

    closeBtn.onclick = dongModal;
    cancelBtn.onclick = dongModal;

    createTriggerBtn.onclick = () => {
      openCreateListSubmodal();
    };

    saveBtn.onclick = async () => {
      saveBtn.setAttribute("disabled", "true");
      saveBtn.textContent = "Saving...";

      const checkboxes = overlay.querySelectorAll('.custom-lists-container input[type="checkbox"]');

      for (const cb of checkboxes) {
        const listId = cb.getAttribute("data-list-id");
        const listObj = userLists.find((x) => x.id === listId);
        if (!listObj) continue;

        let titles = listObj.titles || [];
        const exists = titles.some((t) => t.id === mangaId);

        if (cb.checked && !exists) {
          titles.push(currentMangaItem);
          await writeSubcollectionDoc(user.uid, "customLists", listId, { ...listObj, titles });
        } else if (!cb.checked && exists) {
          titles = titles.filter((t) => t.id !== mangaId);
          await writeSubcollectionDoc(user.uid, "customLists", listId, { ...listObj, titles });
        }
      }

      dongModal();
    };
  }

  function openCreateListSubmodal() {
    overlay.innerHTML = `
      <div class="lib-modal-box">
        <button class="lib-modal-close" aria-label="Đóng">&times;</button>
        <div class="lib-modal-header">
          <h4>Create New List</h4>
        </div>
        <div class="lib-modal-body flex-column">
          <div class="submodal-input-group">
            <input type="text" id="submodal-list-name-input" class="submodal-input" placeholder="List Name" required />
          </div>
          <label class="custom-list-checkbox-item mt-3">
            <input type="checkbox" id="submodal-private-checkbox" checked />
            <span class="checkbox-custom"></span>
            <span class="custom-list-item-name">Private list</span>
          </label>
        </div>
        <div class="lib-modal-actions">
          <button class="lib-btn lib-btn-cancel" id="btn-cancel-create-sub">Cancel</button>
          <button class="lib-btn lib-btn-action" id="btn-submit-create-sub">Create</button>
        </div>
      </div>
    `;

    const closeBtn = overlay.querySelector(".lib-modal-close");
    const cancelBtn = overlay.querySelector("#btn-cancel-create-sub");
    const submitBtn = overlay.querySelector("#btn-submit-create-sub");
    const nameInput = overlay.querySelector("#submodal-list-name-input");
    const privateCb = overlay.querySelector("#submodal-private-checkbox");

    closeBtn.onclick = renderAddToListModalContent;
    cancelBtn.onclick = renderAddToListModalContent;

    submitBtn.onclick = async () => {
      const listName = nameInput.value.trim();
      if (!listName) {
        alert("Vui lòng nhập tên danh sách!");
        return;
      }

      submitBtn.setAttribute("disabled", "true");
      submitBtn.textContent = "Creating...";

      const realCreatorName = await readUserField(user.uid, "name", user.displayName || "User");
      const newListId = `list_${Date.now()}`;

      // Tạo danh sách mới và tự động thêm bộ truyện hiện tại vào danh sách này
      const newListObj = {
        id: newListId,
        name: listName,
        visibility: privateCb.checked ? "Private" : "Public",
        creator: realCreatorName,
        titles: [currentMangaItem],
        createdAt: Date.now(),
      };

      await writeSubcollectionDoc(user.uid, "customLists", newListId, newListObj);

      // Cập nhật mảng danh sách cục bộ và quay lại Modal Add To List
      userLists.push(newListObj);
      renderAddToListModalContent();
    };
  }

  function dongModal() {
    overlay.classList.remove("show");
    setTimeout(() => {
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    }, 250);
  }

  overlay.onclick = (e) => {
    if (e.target === overlay) dongModal();
  };

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  renderAddToListModalContent();
}

// ==========================================================
// KHỞI TẠO TRANG
// ==========================================================
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

      // Nút Thêm vào thư viện
      const libraryBtn = document.querySelector(".manga-carousel-library-btn");
      if (libraryBtn) {
        libraryBtn.addEventListener("click", () => {
          handleLibraryAction(mangaId, info);
        });
      }

      // Nút Thêm vào Custom List
      const addToListBtn = document.getElementById("btn-add-to-list");
      if (addToListBtn) {
        addToListBtn.addEventListener("click", () => {
          handleAddToListAction(mangaId, info);
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
