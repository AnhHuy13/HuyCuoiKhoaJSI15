// js/account/account.js

import {
  isLogin,
  readFirebaseKey,
  updateFirebaseKey,
  getSubcollectionDocs,
  deleteSubcollectionDoc,
  writeSubcollectionDoc, // Import thêm hàm ghi dữ liệu subcollection
  logoutFirebase,
} from "../database/firebase.js";
import { hienThiHopThoai } from "../helper/dialog.js";
import { fetchCountries } from "../helper/utility.js"; // Import hàm tải động quốc gia

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/rimebiqz/image/upload/co_rgb:000000,l_text:Arial_20_bold_normal_left:DEFAULT%250AAVATAR%2520/fl_layer_apply,fl_no_overflow,g_center,x_-50,y_19/defaul-avatar-1_yl9xfo.jpg";
const DEFAULT_BANNER =
  "https://res.cloudinary.com/rimebiqz/image/upload/v1783914533/banner_qvydzf.jpg";

// Danh sách Quốc tịch đồng bộ với flag-icons
const NATIONALITIES = [
  { code: "none", name: "None" },
  { code: "vn", name: "Vietnam" },
  { code: "jp", name: "Japan" },
  { code: "us", name: "United States" },
  { code: "kr", name: "South Korea" },
  { code: "cn", name: "China" },
  { code: "gb", name: "United Kingdom" },
  { code: "fr", name: "France" },
  { code: "tw", name: "Taiwan" },
  { code: "th", name: "Thailand" },
];

let currentUser = null;
let profileLists = [];
let countriesList = []; // Mảng động lưu danh sách quốc tịch tải từ JSON
let currentUserFollowedLists = []; // Lưu trữ danh sách đã follow của tài khoản hiện tại
let selectedNationalityCode = "none";
let isOwnProfile = false; // Đánh dấu đây có phải chính chủ đang xem hay không
let targetUserId = null;

// DOM Elements chính
const nameEl = document.getElementById("user-display-name");
const idEl = document.getElementById("user-custom-id");
const avatarEl = document.getElementById("user-avatar-img");
const bannerEl = document.getElementById("banner-profile-bg");
const flagEl = document.getElementById("user-nationality-flag");
const aboutTextEl = document.getElementById("profile-about-text");
const listsContainer = document.getElementById("profile-lists-container");

// Info Elements mới
const infoUserIdEl = document.getElementById("info-user-id");
const infoProfileLinkInput = document.getElementById("info-profile-link-input");
const btnCopyProfileLink = document.getElementById("btn-copy-profile-link");

// Dialog & Edit Elements
const editDialog = document.getElementById("edit-profile-dialog");
const btnOpenDialog = document.getElementById("btn-open-edit-dialog");
const btnCloseDialog = document.getElementById("btn-close-edit-dialog");
const btnSaveProfile = document.getElementById("btn-save-profile");

const editNameInput = document.getElementById("edit-name-input");
const editAboutInput = document.getElementById("edit-about-input");

const avatarUploadTrigger = document.getElementById("avatar-upload-trigger");
const bannerUploadTrigger = document.getElementById("banner-upload-trigger");
const inputAvatarFile = document.getElementById("input-avatar-file");
const inputBannerFile = document.getElementById("input-banner-file");
const dialogAvatarPreview = document.getElementById("dialog-avatar-preview");
const dialogBannerPreview = document.getElementById("dialog-banner-preview");

// Biến giữ tạm ảnh Base64
let tempAvatarBase64 = null;
let tempBannerBase64 = null;

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

async function initAccountPage() {
  try {
    updateProgress(20, "Đang xác minh tài khoản...");
    currentUser = await isLogin();

    // Phân tích thông tin định tuyến URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryUserId = urlParams.get("userId");

    // YÊU CẦU: KHÔNG CÓ THAM SỐ USERID TRÊN URL THÌ CHUYỂN HƯỚNG SANG TRANG 404 NGAY LẬP TỨC
    if (!queryUserId) {
      window.location.href = "404.html";
      return;
    }

    targetUserId = queryUserId;

    // Đánh dấu quyền sở hữu (POV)
    isOwnProfile = currentUser && currentUser.uid === targetUserId;

    // QUYỀN TRUY CẬP EDIT: Ẩn nút bút chì trên banner nếu không phải chính chủ
    if (isOwnProfile) {
      btnOpenDialog.classList.remove("d-none");
    } else {
      btnOpenDialog.classList.add("d-none");
    }

    // QUYỀN TRUY CẬP ACCOUNT TAB: Chỉ hiện tab quản lý Account nếu là chính chủ đang xem
    const tabAccountBtn = document.querySelector('.profile-tab-btn[data-tab="account"]');
    if (tabAccountBtn) {
      if (isOwnProfile) {
        tabAccountBtn.classList.remove("d-none");
      } else {
        tabAccountBtn.classList.add("d-none");
      }
    }

    updateProgress(50, "Đang tải thông tin cá nhân...");
    const name = await readFirebaseKey(targetUserId, "name", "Thành viên mới");
    const customId = await readFirebaseKey(targetUserId, "customId", "Chưa thiết lập ID");
    const avatarUrl = await readFirebaseKey(targetUserId, "avatar", DEFAULT_AVATAR);

    // Đọc đường dẫn Banner và sửa lỗi lọc điều kiện chuỗi mặc định cũ
    let bannerUrl = await readFirebaseKey(targetUserId, "banner", DEFAULT_BANNER);
    if (!bannerUrl || bannerUrl === "default-banner.jpg") {
      bannerUrl = DEFAULT_BANNER;
    }

    const aboutMe = await readFirebaseKey(targetUserId, "aboutMe", "Chưa có giới thiệu bản thân.");
    const nationality = await readFirebaseKey(targetUserId, "nationality", "none");

    selectedNationalityCode = nationality;

    updateProgress(65, "Đang tải tệp quốc gia và trạng thái theo dõi...");
    countriesList = await fetchCountries(); // Tải danh sách quốc gia động từ countries.json

    // Tải danh sách mà tài khoản hiện tại đang theo dõi (để vẽ nút Follow/Following chính xác)
    if (currentUser) {
      currentUserFollowedLists = await getSubcollectionDocs(currentUser.uid, "followedLists");
    }

    updateProgress(85, "Đang tải danh sách cá nhân...");
    profileLists = await getSubcollectionDocs(targetUserId, "customLists");

    // QUYỀN TRUY CẬP LISTS: Nếu không phải chính chủ, lọc ẩn toàn bộ private lists chỉ giữ lại public list
    if (!isOwnProfile) {
      profileLists = profileLists.filter(
        (list) => (list.visibility || "Private").toLowerCase() === "public",
      );
    }

    updateProgress(95, "Đang thiết lập giao diện...");

    // Cập nhật thông tin UI chính
    if (nameEl) nameEl.textContent = name;
    if (idEl) idEl.textContent = `@${customId}`;
    if (avatarEl) avatarEl.src = avatarUrl;
    if (aboutTextEl) aboutTextEl.textContent = aboutMe;

    if (bannerEl) {
      bannerEl.style.backgroundImage = `url('${bannerUrl}')`;
    }

    // Thiết lập hiển thị Quốc Kỳ (NONE THÌ KHÔNG HIỆN)
    if (flagEl) {
      if (nationality && nationality !== "none") {
        flagEl.className = `fi fi-${nationality}`;
        flagEl.classList.remove("d-none");
      } else {
        flagEl.classList.add("d-none");
      }
    }

    // Thiết lập User ID và Link chia sẻ Firebase-based
    if (infoUserIdEl) {
      infoUserIdEl.textContent = targetUserId;
    }
    if (infoProfileLinkInput) {
      infoProfileLinkInput.value = `${window.location.origin}/html/account.html?userId=${targetUserId}`;
    }

    // Sự kiện Copy Link
    if (btnCopyProfileLink) {
      btnCopyProfileLink.onclick = async () => {
        try {
          await navigator.clipboard.writeText(infoProfileLinkInput.value);
          await hienThiHopThoai("Đã sao chép liên kết tài khoản này thành công!", "Đóng", null);
        } catch (err) {
          alert("Không thể sao chép: " + infoProfileLinkInput.value);
        }
      };
    }

    // Vẽ danh sách (Tab Lists)
    renderListsTab();

    // Thiết lập hành vi Tabs, Dialog & Nationality Dropdown
    setupTabsEvents();
    initNationalityDropdown();
    setupEditProfileEvents();
    setupLogoutEvent();

    updateProgress(100, "Hoàn tất!");
    setTimeout(() => {
      hideLoadingScreen();
    }, 400);
  } catch (error) {
    console.error("[Account] Gặp lỗi nghiêm trọng:", error);
    updateProgress(100, "Đã xảy ra lỗi tải dữ liệu.");
    hideLoadingScreen();
  }
}

// --- LOGIC VẼ DANH SÁCH & EXPAND ẢNH BÌA (SEE MORE) ---
function renderListsTab() {
  if (!listsContainer) return;
  listsContainer.innerHTML = "";

  if (profileLists.length === 0) {
    listsContainer.innerHTML = `<div class="text-center text-muted py-5 col-span-full">Chưa có danh sách truyện nào được công khai.</div>`;
    return;
  }

  profileLists.forEach((list) => {
    const listId = list.id;
    const card = document.createElement("div");
    card.className = "profile-list-card";

    // Xử lý logic chia trang hiển thị bìa truyện (Tối đa 5 bìa, còn lại ẩn)
    const titlesArray = list.titles || [];
    const maxCoversInitial = 5;

    const coversHtml = titlesArray
      .map((manga, idx) => {
        const isHidden = idx >= maxCoversInitial;
        return `
        <img 
          src="${manga.cover}" 
          alt="${manga.title}" 
          class="list-manga-cover-thumb ${isHidden ? "d-none" : ""}" 
          title="${manga.title}" 
          data-index="${idx}"
        />
      `;
      })
      .join("");

    const hasMore = titlesArray.length > maxCoversInitial;
    const seeMoreBtnHtml = hasMore
      ? `<button class="btn-see-more-covers" id="btn-see-more-${listId}">+${titlesArray.length - maxCoversInitial}</button>`
      : "";

    // Ẩn nút Delete và Edit trong Dropdown nếu không phải chính chủ
    const editDeleteOptionsHtml = isOwnProfile
      ? `
      <button class="list-dropdown-item btn-act-delete" data-id="${listId}">
        <span class="material-symbols-outlined">delete</span> Delete
      </button>
      <button class="list-dropdown-item btn-act-edit" data-id="${listId}">
        <span class="material-symbols-outlined">edit</span> Edit
      </button>
    `
      : "";

    // Xác định trạng thái Follow của nút
    let followBtnHtml = "";
    if (isOwnProfile) {
      // Nếu là chính chủ thì vô hiệu hóa nút không cho tự Follow
      followBtnHtml = `
        <button class="list-dropdown-item btn-act-follow" disabled style="opacity: 0.5; cursor: not-allowed;">
          <span class="material-symbols-outlined">person</span> Owner
        </button>
      `;
    } else {
      const isFollowed = currentUserFollowedLists.some((x) => x.id === listId);
      if (isFollowed) {
        followBtnHtml = `
          <button class="list-dropdown-item btn-act-follow followed" data-id="${listId}">
            <span class="material-symbols-outlined">bookmark_added</span> Following
          </button>
        `;
      } else {
        followBtnHtml = `
          <button class="list-dropdown-item btn-act-follow" data-id="${listId}">
            <span class="material-symbols-outlined">bookmark</span> Follow
          </button>
        `;
      }
    }

    card.innerHTML = `
      <div class="profile-list-header-row">
        <div class="profile-list-details">
          <h5>${list.name}</h5>
          <div class="profile-list-creator">
            <span class="material-symbols-outlined">person</span>
            <span>${list.creator || "Anonymous"}</span>
          </div>
          <span class="badge-visibility ${list.visibility.toLowerCase()}">${list.visibility}</span>
        </div>
        <div class="profile-list-actions">
          <button class="btn-list-more" data-id="${listId}">
            <span class="material-symbols-outlined">more_vert</span>
          </button>
          <!-- Dropdown con ẩn -->
          <div class="list-dropdown-menu d-none" id="dropdown-${listId}">
            ${followBtnHtml}
            ${editDeleteOptionsHtml}
          </div>
        </div>
      </div>

      <!-- Dòng hiển thị ảnh bìa truyện -->
      <div class="profile-list-covers-container" id="covers-container-${listId}">
        ${coversHtml}
        ${seeMoreBtnHtml}
      </div>
    `;

    // Thiết lập sự kiện bấm nút "+X" (See More) để mở rộng ảnh bìa
    if (hasMore) {
      const seeMoreBtn = card.querySelector(`#btn-see-more-${listId}`);
      if (seeMoreBtn) {
        seeMoreBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          card.querySelectorAll(".list-manga-cover-thumb.d-none").forEach((img) => {
            img.classList.remove("d-none");
          });
          seeMoreBtn.remove();
        });
      }
    }

    // Click bên ngoài đóng dropdown
    const dropdown = card.querySelector(`#dropdown-${listId}`);
    const moreBtn = card.querySelector(".btn-list-more");

    moreBtn.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll(".list-dropdown-menu").forEach((menu) => {
        if (menu !== dropdown) menu.classList.add("d-none");
      });
      dropdown.classList.toggle("d-none");
    };

    // Thiết lập sự kiện tương tác cho nút Follow bên trong dropdown
    const followBtn = card.querySelector(".btn-act-follow");
    if (followBtn && !isOwnProfile) {
      followBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!currentUser) {
          await hienThiHopThoai("Bạn cần đăng nhập để theo dõi danh sách này.", "Đăng nhập", "Hủy");
          return;
        }

        const isCurrentlyFollowed = currentUserFollowedLists.some((x) => x.id === listId);

        if (isCurrentlyFollowed) {
          // Hủy follow danh sách
          const success = await deleteSubcollectionDoc(currentUser.uid, "followedLists", listId);
          if (success) {
            currentUserFollowedLists = currentUserFollowedLists.filter((x) => x.id !== listId);
            await hienThiHopThoai(`Đã bỏ theo dõi danh sách "${list.name}".`, "Đóng", null);
            renderListsTab(); // Vẽ lại giao diện để cập nhật trạng thái nút
          }
        } else {
          // Tiến hành follow danh sách của người khác
          const payload = {
            listId: listId,
            ownerId: targetUserId,
            followedAt: Date.now(),
          };
          const success = await writeSubcollectionDoc(
            currentUser.uid,
            "followedLists",
            listId,
            payload,
          );
          if (success) {
            currentUserFollowedLists.push({ id: listId, ...payload });
            await hienThiHopThoai(`Đã theo dõi thành công danh sách "${list.name}"!`, "Đóng", null);
            renderListsTab(); // Vẽ lại giao diện để cập nhật trạng thái nút
          }
        }
      };
    }

    // Điều hướng EDIT (Chỉ gán nếu chính chủ xem)
    if (isOwnProfile) {
      card.querySelector(".btn-act-edit").onclick = () => {
        window.location.href = `../html/list.html?listId=${listId}&userId=${currentUser.uid}`;
      };

      // Xóa danh sách
      card.querySelector(".btn-act-delete").onclick = async () => {
        const confirmDelete = await hienThiHopThoai(
          `Bạn có chắc chắn muốn xóa danh sách "${list.name}" không?`,
          "Xóa",
          "Hủy",
        );
        if (confirmDelete) {
          const success = await deleteSubcollectionDoc(currentUser.uid, "customLists", listId);
          if (success) {
            profileLists = profileLists.filter((x) => x.id !== listId);
            renderListsTab();
          }
        }
      };
    }

    listsContainer.appendChild(card);
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".list-dropdown-menu").forEach((menu) => {
      menu.classList.add("d-none");
    });
  });
}

// --- ĐIỀU KHIỂN TABS CHUYỂN ĐỔI ---
function setupTabsEvents() {
  const tabs = document.querySelectorAll(".profile-tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetTab = tab.getAttribute("data-tab");
      document.getElementById("tab-pane-lists").classList.add("d-none");
      document.getElementById("tab-pane-info").classList.add("d-none");
      document.getElementById("tab-pane-account").classList.add("d-none");

      if (targetTab === "lists") {
        document.getElementById("tab-pane-lists").classList.remove("d-none");
      } else if (targetTab === "info") {
        document.getElementById("tab-pane-info").classList.remove("d-none");
      } else if (targetTab === "account") {
        document.getElementById("tab-pane-account").classList.remove("d-none");
      }
    });
  });
}

// --- KHỞI TẠO BỘ CHỌN QUỐC TỊCH THÔNG MINH DÙNG DỮ LIỆU ĐỘNG ---
function initNationalityDropdown() {
  const wrapper = document.getElementById("nation-custom-dropdown");
  const trigger = document.getElementById("nation-dropdown-btn");
  const menu = document.getElementById("nation-dropdown-menu");
  const list = document.getElementById("nation-dropdown-items-list");
  const searchInput = document.getElementById("nation-search-input");
  const flagContainer = document.getElementById("nation-selected-flag-container");
  const textEl = document.getElementById("nation-selected-text");

  if (!wrapper || !trigger || !menu || !list) return;

  function updateTriggerUI() {
    if (selectedNationalityCode === "none") {
      textEl.textContent = "None";
      flagContainer.innerHTML = "";
      return;
    }

    const item = countriesList.find((n) => n.code === selectedNationalityCode);
    if (item) {
      textEl.textContent = item.name;
      flagContainer.innerHTML = `<span class="fi fi-${selectedNationalityCode} flag-icon"></span>`;
    }
  }

  function renderList(query = "") {
    const filtered = countriesList.filter(
      (n) => n.name.toLowerCase().includes(query) || n.code.toLowerCase().includes(query),
    );

    list.innerHTML = filtered
      .map((n) => {
        const isSelected = selectedNationalityCode === n.code;
        const hasFlag = n.code !== "none";
        return `
        <div class="custom-dropdown-item-nation ${isSelected ? "selected" : ""}" data-value="${n.code}">
          <span class="radio-dot"></span>
          ${hasFlag ? `<span class="fi fi-${n.code} flag-icon"></span>` : '<span style="width: 22px; display: inline-block;"></span>'}
          <span class="lang-name-nation" style="margin-left: 8px;">${n.name}</span>
        </div>
      `;
      })
      .join("");

    list.querySelectorAll(".custom-dropdown-item-nation").forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        selectedNationalityCode = item.dataset.value;
        updateTriggerUI();

        list
          .querySelectorAll(".custom-dropdown-item-nation")
          .forEach((el) => el.classList.remove("selected"));
        item.classList.add("selected");

        menu.style.display = "none";
        wrapper.classList.remove("active");
      };
    });
  }

  trigger.onclick = (e) => {
    e.stopPropagation();
    const isOpen = menu.style.display === "block";

    document.querySelectorAll(".custom-dropdown-menu-nation").forEach((m) => {
      if (m !== menu) m.style.display = "none";
    });

    if (isOpen) {
      menu.style.display = "none";
      wrapper.classList.remove("active");
    } else {
      menu.style.display = "block";
      wrapper.classList.add("active");
      renderList();
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
    }
  };

  if (searchInput) {
    searchInput.oninput = (e) => {
      const query = e.target.value.toLowerCase().trim();
      renderList(query);
    };
    searchInput.onclick = (e) => e.stopPropagation();
  }

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      menu.style.display = "none";
      wrapper.classList.remove("active");
    }
  });

  updateTriggerUI();
}

// --- ĐIỀU KHIỂN CHỈNH SỬA HỒ SƠ ---
function setupEditProfileEvents() {
  btnOpenDialog.onclick = async () => {
    const name = nameEl.textContent;
    const about =
      aboutTextEl.textContent === "Chưa có giới thiệu bản thân." ? "" : aboutTextEl.textContent;

    editNameInput.value = name;
    editAboutInput.value = about;

    dialogAvatarPreview.src = avatarEl.src;
    dialogAvatarPreview.classList.remove("d-none");

    const bgUrlMatch = bannerEl.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (bgUrlMatch) {
      dialogBannerPreview.src = bgUrlMatch[1];
      dialogBannerPreview.classList.remove("d-none");
    }

    tempAvatarBase64 = null;
    tempBannerBase64 = null;

    initNationalityDropdown(); // Kích hoạt lại bộ chọn cờ sử dụng dữ liệu từ JSON
    editDialog.showModal();
  };

  btnCloseDialog.onclick = () => {
    editDialog.close();
  };

  avatarUploadTrigger.onclick = () => inputAvatarFile.click();
  bannerUploadTrigger.onclick = () => inputBannerFile.click();

  inputAvatarFile.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        tempAvatarBase64 = event.target.result;
        dialogAvatarPreview.src = tempAvatarBase64;
        dialogAvatarPreview.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    }
  };

  inputBannerFile.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        tempBannerBase64 = event.target.result;
        dialogBannerPreview.src = tempBannerBase64;
        dialogBannerPreview.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    }
  };

  btnSaveProfile.onclick = async () => {
    const updatedName = editNameInput.value.trim();
    if (!updatedName) {
      alert("Tên hiển thị không được bỏ trống!");
      return;
    }

    btnSaveProfile.setAttribute("disabled", "true");
    btnSaveProfile.textContent = "Saving...";

    const updates = {
      name: updatedName,
      aboutMe: editAboutInput.value.trim() || "Chưa có giới thiệu bản thân.",
      nationality: selectedNationalityCode,
    };

    if (tempAvatarBase64) updates.avatar = tempAvatarBase64;
    if (tempBannerBase64) updates.banner = tempBannerBase64;

    const success =
      (await updateFirebaseKey(currentUser.uid, "name", updates.name)) &&
      (await updateFirebaseKey(currentUser.uid, "aboutMe", updates.aboutMe)) &&
      (await updateFirebaseKey(currentUser.uid, "nationality", updates.nationality));

    if (tempAvatarBase64) await updateFirebaseKey(currentUser.uid, "avatar", tempAvatarBase64);
    if (tempBannerBase64) await updateFirebaseKey(currentUser.uid, "banner", tempBannerBase64);

    if (success) {
      nameEl.textContent = updates.name;
      aboutTextEl.textContent = updates.aboutMe;

      if (tempAvatarBase64) avatarEl.src = tempAvatarBase64;
      if (tempBannerBase64) bannerEl.style.backgroundImage = `url('${tempBannerBase64}')`;

      if (updates.nationality !== "none") {
        flagEl.className = `fi fi-${updates.nationality}`;
        flagEl.classList.remove("d-none");
      } else {
        flagEl.classList.add("d-none");
      }

      btnSaveProfile.removeAttribute("disabled");
      btnSaveProfile.textContent = "Save";
      editDialog.close();
      await hienThiHopThoai("Cập nhật thông tin hồ sơ thành công!", "Đóng", null);
    } else {
      btnSaveProfile.removeAttribute("disabled");
      btnSaveProfile.textContent = "Save";
      alert("Lỗi khi lưu thông tin.");
    }
  };
}

// --- LOGIC XỬ LÝ ĐĂNG XUẤT THỰC TẾ ---
function setupLogoutEvent() {
  const btnLogout = document.getElementById("btn-logout-account");
  if (!btnLogout) return;

  btnLogout.onclick = async () => {
    const confirmLogout = await hienThiHopThoai(
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?",
      "Đăng xuất",
      "Hủy",
    );

    if (confirmLogout) {
      updateProgress(30, "Đang đăng xuất hệ thống...");
      const success = await logoutFirebase();
      if (success) {
        // Dọn dẹp trạng thái đăng nhập và bộ nhớ đệm trên Client
        localStorage.removeItem(`user_library_${currentUser.uid}`);

        updateProgress(100, "Đăng xuất thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "./auth/dangnhap.html";
        }, 500);
      } else {
        alert("Lỗi hệ thống khi đăng xuất.");
      }
    }
  };
}

initAccountPage();
