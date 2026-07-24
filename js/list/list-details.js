// js/list/list-details.js

import { state } from "./list-state.js";
import {
  getSubcollectionDocs,
  readUserField,
  writeSubcollectionDoc,
  deleteSubcollectionDoc,
  readSubcollectionDoc,
} from "../database/firebase.js";
import { hienThiHopThoai } from "../helper/dialog.js";
import { vietHoaChuCaiDauTien, changeStatusToColor } from "../helper/utility.js";

// DOM chi tiết
const detailsListName = document.getElementById("details-list-name");
const detailsListCreator = document.getElementById("details-list-creator");
const detailsListVisibility = document.getElementById("details-list-visibility");
const detailsMangaContainer = document.getElementById("details-manga-container");
const btnMoreEdit = document.getElementById("btn-more-edit");
const btnHeroFollow = document.getElementById("btn-hero-follow");

const detailsLayoutListBtn = document.getElementById("details-layout-list-btn");
const detailsLayoutGridBtn = document.getElementById("details-layout-grid-btn");
const detailsLayoutCompactBtn = document.getElementById("details-layout-compact-btn");

export async function handleOpenListDetails(listId, ownerId = null, toggleViewCallback) {
  state.currentListId = listId;
  state.currentListOwnerId = ownerId || state.currentUser?.uid;

  if (!state.currentListOwnerId) {
    await hienThiHopThoai("Bạn cần đăng nhập để truy cập tính năng này.", "Đóng", null);
    window.location.href = "list.html";
    return;
  }

  const listObj = await getSubcollectionDocs(state.currentListOwnerId, "customLists");
  const currentList = listObj.find((x) => x.id === listId);

  if (!currentList) {
    await hienThiHopThoai(
      "Không tìm thấy danh sách được chỉ định hoặc bạn không có quyền xem.",
      "Đóng",
      null,
    );
    window.location.href = "list.html";
    return;
  }

  // --- KIỂM TRA QUYỀN TRUY CẬP (SECURITY CHECK) ---
  const visibility = (currentList.visibility || "Private").toLowerCase();
  const isOwner = state.currentUser && state.currentUser.uid === state.currentListOwnerId;

  if (visibility === "private" && !isOwner) {
    await hienThiHopThoai("Đây là danh sách riêng tư. Bạn không có quyền truy cập.", "Đóng", null);
    window.location.href = "list.html";
    return;
  }

  state.currentListObj = currentList;
  state.tempSelectedMangas = currentList.titles || [];

  detailsListName.textContent = currentList.name;

  const realCreatorName = await readUserField(
    state.currentListOwnerId,
    "name",
    currentList.creator || "Anonymous",
  );
  detailsListCreator.textContent = realCreatorName;

  detailsListVisibility.textContent = `${currentList.visibility} List`;
  detailsListVisibility.className = `badge-visibility ${currentList.visibility.toLowerCase()}`;

  const bannerContainer = document.getElementById("list-hero-banner");
  bannerContainer.style.backgroundImage =
    "url('https://res.cloudinary.com/rimebiqz/image/upload/v1783914533/banner_qvydzf.jpg')";

  if (isOwner) {
    btnMoreEdit.style.display = "flex";
  } else {
    btnMoreEdit.style.display = "none";
  }

  // Cập nhật trạng thái nút Follow trên Banner
  await checkAndRenderFollowButton();

  renderDetailsMangaList();
  toggleViewCallback("details");
}

export async function checkAndRenderFollowButton() {
  if (!state.currentUser) {
    btnHeroFollow.style.display = "none";
    return;
  }

  const isOwner = state.currentUser.uid === state.currentListOwnerId;

  if (isOwner) {
    // Nếu là danh sách của chính mình thì vô hiệu hóa nút Follow
    btnHeroFollow.disabled = true;
    btnHeroFollow.style.opacity = "0.5";
    btnHeroFollow.style.cursor = "not-allowed";
    btnHeroFollow.innerHTML = `<span class="material-symbols-outlined">person</span> Your List`;
    btnHeroFollow.className = "btn-hero-action star-btn";
    return;
  }

  // Trả về trạng thái hoạt động bình thường cho người xem khác
  btnHeroFollow.disabled = false;
  btnHeroFollow.style.opacity = "1";
  btnHeroFollow.style.cursor = "pointer";

  const isFollowed = await readSubcollectionDoc(
    state.currentUser.uid,
    "followedLists",
    state.currentListId,
  );

  if (isFollowed) {
    btnHeroFollow.innerHTML = `<span class="material-symbols-outlined">bookmark_added</span> Following`;
    btnHeroFollow.className = "btn-hero-action follow-btn followed";
  } else {
    btnHeroFollow.innerHTML = `<span class="material-symbols-outlined">bookmark</span> Follow`;
    btnHeroFollow.className = "btn-hero-action follow-btn";
  }
}

export async function handleFollowToggle() {
  if (!state.currentUser) return;

  const isOwner = state.currentUser.uid === state.currentListOwnerId;
  if (isOwner) return;

  const isFollowed = await readSubcollectionDoc(
    state.currentUser.uid,
    "followedLists",
    state.currentListId,
  );

  if (isFollowed) {
    const success = await deleteSubcollectionDoc(
      state.currentUser.uid,
      "followedLists",
      state.currentListId,
    );
    if (success) {
      await hienThiHopThoai("Đã bỏ theo dõi danh sách này.", "Đóng", null);
      await checkAndRenderFollowButton();
    }
  } else {
    const payload = {
      listId: state.currentListId,
      ownerId: state.currentListOwnerId,
      followedAt: Date.now(),
    };
    const success = await writeSubcollectionDoc(
      state.currentUser.uid,
      "followedLists",
      state.currentListId,
      payload,
    );
    if (success) {
      await hienThiHopThoai("Theo dõi danh sách này thành công!", "Đóng", null);
      await checkAndRenderFollowButton();
    }
  }
}

export async function handleLoadSharedList(
  userId,
  listId,
  toggleViewCallback,
  setupEventsCallback,
) {
  setupEventsCallback();

  const btnHomeBack = document.getElementById("home-back-btn");
  btnHomeBack.removeEventListener("click", () => window.history.back());
  btnHomeBack.addEventListener("click", () => {
    window.location.href = "list.html";
  });

  await handleOpenListDetails(listId, userId, toggleViewCallback);
}

export function renderDetailsMangaList() {
  detailsMangaContainer.innerHTML = "";
  if (state.tempSelectedMangas.length === 0) {
    detailsMangaContainer.innerHTML = `<div class="empty-results-state"><p>Chưa có tác phẩm nào trong danh sách này.</p></div>`;
    return;
  }

  detailsMangaContainer.className = "search-results-container grid-view";
  detailsLayoutListBtn.classList.remove("active");
  detailsLayoutGridBtn.classList.add("active");
  detailsLayoutCompactBtn.classList.remove("active");

  state.tempSelectedMangas.forEach((manga) => {
    const id = manga.id;
    const title = manga.title || "Unknown";
    const desc = manga.description || "Bấm để chuyển tới trang xem chi tiết bộ truyện.";
    const status = manga.status || "ongoing";
    const coverUrl = manga.cover || "https://placehold.co/250x350/212224/FFF?text=No+Cover";
    const rating = manga.rating || "8.00";
    const bookmarks = manga.bookmarks || "N/A";

    const statusColor = changeStatusToColor(status);
    const capitalizedStatus = vietHoaChuCaiDauTien(status);

    const cRating = manga.contentRating;
    const ratingTagHtml =
      cRating && cRating !== "safe"
        ? `<span class="genre-tag highlight">${cRating.toUpperCase()}</span>`
        : "";

    const tags = manga.tags || [];
    const genreTagsHtml = tags
      .slice(0, 5)
      .map((t) => `<span class="genre-tag">${t.attributes?.name?.en || t}</span>`)
      .join("");

    const flagHtml = `<img src="https://flagcdn.com/w20/jp.png" srcset="https://flagcdn.com/w40/jp.png 2x" width="18" alt="Japan" style="margin-right: 8px; vertical-align: middle; border-radius: 2px; display: inline-block; position: relative; top: -1px;">`;

    const card = document.createElement("div");
    card.className = "manga-card";
    card.innerHTML = `
      <div class="manga-cover-container">
        <img class="manga-cover" src="${coverUrl}" alt="${title}">
      </div>
      <div class="manga-info">
        <h4 class="manga-title">
          <a class="manga-title-link" href="/html/manga.html?mangaId=${id}">${flagHtml}${title}</a>
        </h4>
        <div class="manga-stats">
          <span class="stat-item"><span class="material-symbols-outlined" style="color: #ffb74d;">star</span> ${rating}</span>
          <span class="stat-item"><span class="material-symbols-outlined">bookmark</span> ${bookmarks}</span>
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
    detailsMangaContainer.appendChild(card);
  });
}

export function setActiveLayout(layoutClass) {
  detailsMangaContainer.className = `search-results-container ${layoutClass}`;

  detailsLayoutListBtn.classList.remove("active");
  detailsLayoutGridBtn.classList.remove("active");
  detailsLayoutCompactBtn.classList.remove("active");

  if (layoutClass === "list-view") detailsLayoutListBtn.classList.add("active");
  else if (layoutClass === "grid-view") detailsLayoutGridBtn.classList.add("active");
  else if (layoutClass === "compact-view") detailsLayoutCompactBtn.classList.add("active");
}
