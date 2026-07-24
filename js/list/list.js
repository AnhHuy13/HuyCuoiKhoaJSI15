// js/list/list.js

import {
  isLogin,
  getSubcollectionDocs,
  readAnyDoc,
  deleteSubcollectionDoc,
} from "../database/firebase.js";
import { hienThiHopThoai } from "../helper/dialog.js";
import { renderUserLists, renderTempPreview } from "./list-ui.js";
import { initSearchDialog } from "./list-search-dialog.js";

// Import các module con
import { state } from "./list-state.js";
import {
  handleOpenListDetails,
  handleLoadSharedList,
  setActiveLayout,
  handleFollowToggle,
} from "./list-details.js";
import {
  handleDeleteList,
  handleSaveList,
  handleUpdateList,
  setupEditFormValues,
  resetCreateForm,
  handleSelectionToggle,
  handleRemoveTempItem,
  checkMangaIsAdded,
  hasUnsavedChanges,
} from "./list-form.js";

// DOM chính cho điều khiển Views
const myListsView = document.getElementById("my-lists-view");
const listDetailsView = document.getElementById("list-details-view");
const createListView = document.getElementById("create-list-view");
const editListView = document.getElementById("edit-list-view");

// Nút điều khiển
const btnShowCreate = document.getElementById("btn-show-create-view");
const btnCreateCancel = document.getElementById("btn-create-cancel");
const btnCreateSubmit = document.getElementById("btn-create-submit");
const btnCreateBack = document.getElementById("create-back-btn");
const btnHomeBack = document.getElementById("home-back-btn");

const btnEditCancel = document.getElementById("btn-edit-cancel");
const btnEditSave = document.getElementById("btn-edit-save");
const btnEditBack = document.getElementById("edit-back-btn");
const btnEditAddTitleTrigger = document.getElementById("btn-edit-add-title-trigger");

const visibilityDropdownBtn = document.getElementById("visibility-dropdown-btn");
const editVisibilityDropdownBtn = document.getElementById("edit-visibility-dropdown-btn");
const visibilityOptionsList = document.getElementById("visibility-options-list");
const editVisibilityOptionsList = document.getElementById("edit-visibility-options-list");
const selectedVisibilitySpan = document.getElementById("selected-visibility");
const editSelectedVisibilitySpan = document.getElementById("edit-selected-visibility");

const btnOpenSearchModal = document.getElementById("btn-open-search-modal");
const searchTitlesDialog = document.getElementById("search-titles-dialog");
const btnCloseDialog = document.getElementById("btn-close-dialog");

// Các nút trong menu thả xuống More
const btnMoreShare = document.getElementById("btn-more-share");
const btnMoreEdit = document.getElementById("btn-more-edit");

// Các nút đổi bố cục hiển thị
const detailsLayoutListBtn = document.getElementById("details-layout-list-btn");
const detailsLayoutGridBtn = document.getElementById("details-layout-grid-btn");
const detailsLayoutCompactBtn = document.getElementById("details-layout-compact-btn");

window.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loading-screen");

  state.currentUser = await isLogin();

  // Khởi chạy thanh Search trong Dialog
  initSearchDialog(
    (mangaObj, buttonEl) => handleSelectionToggle(mangaObj, buttonEl, renderTempPreview),
    checkMangaIsAdded,
  );

  // Xử lý deep linking thông qua URL
  const urlParams = new URLSearchParams(window.location.search);
  const shareListId = urlParams.get("listId");
  const shareUserId = urlParams.get("userId");

  if (shareListId && shareUserId) {
    if (loadingScreen) loadingScreen.classList.add("fade-out");
    await handleLoadSharedList(shareUserId, shareListId, toggleView, setupCentralEvents);
    return;
  }

  if (!state.currentUser) {
    if (loadingScreen) loadingScreen.classList.add("fade-out");
    const loginNow = await hienThiHopThoai(
      "Bạn cần đăng nhập để quản lý danh sách cá nhân.",
      "Đăng nhập",
      "Hủy",
    );
    window.location.href = loginNow ? "/auth/login.html" : "/trangchu.html";
    return;
  }

  await loadUserLists();
  if (loadingScreen) loadingScreen.classList.add("fade-out");
  setupCentralEvents();
});

function setupCentralEvents() {
  btnShowCreate.addEventListener("click", () => {
    state.currentTriggerSource = "create";
    toggleView("create");
  });

  btnCreateCancel.addEventListener("click", () => resetCreateForm(toggleView, renderTempPreview));
  btnCreateBack.addEventListener("click", () => resetCreateForm(toggleView, renderTempPreview));

  btnHomeBack.addEventListener("click", () => window.history.back());

  btnEditCancel.addEventListener("click", handleExitEdit);
  btnEditBack.addEventListener("click", handleExitEdit);

  function handleExitEdit() {
    if (hasUnsavedChanges()) {
      const confirmLeave = confirm(
        "Bạn có các thay đổi chưa lưu trên danh sách này. Bạn có chắc chắn muốn hủy bỏ và rời đi?",
      );
      if (!confirmLeave) return;
    }
    toggleView("details");
  }

  btnEditAddTitleTrigger.addEventListener("click", () => {
    state.currentTriggerSource = "edit";
    searchTitlesDialog.showModal();
  });

  // TABS NAVIGATION (My Lists vs Followed Lists)
  const tabMyLists = document.getElementById("tab-my-lists");
  const tabFollowedLists = document.getElementById("tab-followed-lists");

  tabMyLists.addEventListener("click", async () => {
    tabMyLists.classList.add("active");
    tabFollowedLists.classList.remove("active");
    btnShowCreate.style.display = "flex";
    await loadUserLists();
  });

  tabFollowedLists.addEventListener("click", async () => {
    tabFollowedLists.classList.add("active");
    tabMyLists.classList.remove("active");
    btnShowCreate.style.display = "none";
    await loadFollowedLists(); // Gọi tải thực tế các danh sách đã follow
  });

  // Dropdowns hoạt động
  visibilityDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    visibilityOptionsList.classList.toggle("d-none");
  });
  editVisibilityDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    editVisibilityOptionsList.classList.toggle("d-none");
  });

  document.addEventListener("click", () => {
    visibilityOptionsList.classList.add("d-none");
    editVisibilityOptionsList.classList.add("d-none");
    document.getElementById("list-more-menu").classList.add("d-none");
  });

  visibilityOptionsList.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", (e) => {
      state.selectedVisibility = e.target.getAttribute("data-value");
      selectedVisibilitySpan.textContent = state.selectedVisibility;
    });
  });

  editVisibilityOptionsList.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", (e) => {
      state.selectedVisibility = e.target.getAttribute("data-value");
      editSelectedVisibilitySpan.textContent = state.selectedVisibility;
    });
  });

  btnOpenSearchModal.addEventListener("click", () => {
    state.currentTriggerSource = "create";
    searchTitlesDialog.showModal();
  });
  btnCloseDialog.addEventListener("click", () => searchTitlesDialog.close());

  btnCreateSubmit.addEventListener("click", () => handleSaveList(toggleView, loadUserLists));
  btnEditSave.addEventListener("click", () => handleUpdateList(toggleView));

  // Toggle ẩn/hiện menu con More
  document.getElementById("btn-list-more").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("list-more-menu").classList.toggle("d-none");
  });

  // ĐĂNG KÝ SỰ KIỆN NÚT SHARE
  btnMoreShare.addEventListener("click", async () => {
    const ownerId = state.currentListOwnerId || state.currentUser?.uid;
    const shareUrl = `${window.location.origin}/html/list.html?listId=${state.currentListId}&userId=${ownerId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      await hienThiHopThoai("Đã sao chép liên kết chia sẻ danh sách thành công!", "Đóng", null);
    } catch (err) {
      alert("Không thể sao chép link: " + shareUrl);
    }
  });

  // ĐĂNG KÝ SỰ KIỆN NÚT EDIT
  btnMoreEdit.addEventListener("click", () => {
    toggleView("edit");
  });

  // ĐĂNG KÝ SỰ KIỆN CLICK NÚT FOLLOW TRÊN BANNER
  document.getElementById("btn-hero-follow").addEventListener("click", async () => {
    await handleFollowToggle();
  });

  // Đổi bố cục hiển thị chi tiết truyện
  detailsLayoutListBtn.addEventListener("click", () => setActiveLayout("list-view"));
  detailsLayoutGridBtn.addEventListener("click", () => setActiveLayout("grid-view"));
  detailsLayoutCompactBtn.addEventListener("click", () => setActiveLayout("compact-view"));
}

export function toggleView(view) {
  myListsView.classList.add("d-none");
  listDetailsView.classList.add("d-none");
  createListView.classList.add("d-none");
  editListView.classList.add("d-none");

  if (view === "home") myListsView.classList.remove("d-none");
  else if (view === "details") listDetailsView.classList.remove("d-none");
  else if (view === "create") createListView.classList.remove("d-none");
  else if (view === "edit") {
    editListView.classList.remove("d-none");
    setupEditFormValues();
  }
}

async function loadUserLists() {
  const lists = await getSubcollectionDocs(state.currentUser.uid, "customLists");
  renderUserLists(
    lists,
    (listId, listName) => handleDeleteList(listId, listName, loadUserLists),
    (listId) => {
      window.location.href = `list.html?listId=${listId}&userId=${state.currentUser.uid}`;
    },
  );
}

// Hàm xử lý việc đọc thông tin của tất cả các danh sách đã follow từ Firestore
async function loadFollowedLists() {
  const followedRefs = await getSubcollectionDocs(state.currentUser.uid, "followedLists");
  const followedListsData = [];

  for (const ref of followedRefs) {
    // Truy vấn dữ liệu từ bộ sưu tập của chủ sở hữu danh sách tương ứng
    const actualList = await readAnyDoc("users", ref.ownerId, "customLists", ref.listId);
    if (actualList) {
      // Đóng gói thuộc tính ownerId để vẽ và định hướng đúng
      actualList.ownerId = ref.ownerId;
      followedListsData.push(actualList);
    }
  }

  // Vẽ danh sách đã theo dõi ra giao diện
  renderUserLists(
    followedListsData,
    async (listId, listName, ownerId) => {
      const confirmUnfollow = await hienThiHopThoai(
        `Bạn có chắc muốn bỏ theo dõi danh sách "${listName}"?`,
        "Bỏ theo dõi",
        "Hủy",
      );
      if (confirmUnfollow) {
        await deleteSubcollectionDoc(state.currentUser.uid, "followedLists", listId);
        await loadFollowedLists();
      }
    },
    (listId, ownerId) => {
      window.location.href = `list.html?listId=${listId}&userId=${ownerId}`;
    },
    true, // Đánh dấu đây là Tab Followed để hệ thống kích hoạt nút Hủy theo dõi thay vì nút Xóa
  );
}

// Lắng nghe sự kiện người dùng đóng tab, reload trang hoặc chuyển hướng URL bên ngoài
window.addEventListener("beforeunload", (e) => {
  if (editListView && !editListView.classList.contains("d-none") && hasUnsavedChanges()) {
    e.preventDefault();
    e.returnValue = ""; // Kích hoạt hộp thoại cảnh báo mặc định của trình duyệt để chặn thoát/reload
  }
});
