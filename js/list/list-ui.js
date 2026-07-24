// js/list/list-ui.js

import { toggleView } from "./list.js";

const userListsContainer = document.getElementById("user-lists-container");
const tempSelectedTitlesContainer = document.getElementById("temp-selected-titles-container");

// Vẽ danh sách cá nhân / danh sách theo dõi ra màn hình
export function renderUserLists(
  listDataArray,
  actionCallback,
  clickCallback,
  isFollowedTab = false,
) {
  userListsContainer.innerHTML = "";

  if (!listDataArray || listDataArray.length === 0) {
    userListsContainer.innerHTML = isFollowedTab
      ? `<div class="text-center text-muted py-5">Bạn chưa theo dõi danh sách nào.</div>`
      : `<div class="text-center text-muted py-5">Bạn chưa có danh sách nào. Hãy tạo một cái mới!</div>`;
    return;
  }

  listDataArray.forEach((listData) => {
    const listId = listData.id;
    const card = document.createElement("div");
    card.className = "custom-list-card";

    // Tùy biến nút hành động theo tab đang xem (Xóa vs Hủy theo dõi)
    const actionIcon = isFollowedTab ? "bookmark_remove" : "delete";
    const btnClass = isFollowedTab ? "btn-list-unfollow" : "btn-list-delete";
    const titleText = isFollowedTab ? "Bỏ theo dõi" : "Xóa danh sách";

    card.innerHTML = `
      <div class="list-card-details">
        <h4>${listData.name}</h4>
        <div class="list-card-creator">
          <span class="material-symbols-outlined">person</span>
          <span>${listData.creator}</span>
        </div>
        <span class="badge-visibility ${listData.visibility.toLowerCase()}">${listData.visibility}</span>
      </div>
      <div class="list-card-actions">
        <button class="${btnClass}" data-id="${listId}" title="${titleText}">
          <span class="material-symbols-outlined">${actionIcon}</span>
        </button>
      </div>
    `;

    // Click vào thẻ để chuyển hướng (truyền ownerId để định tuyến chính xác)
    card.addEventListener("click", (e) => {
      if (e.target.closest(`.${btnClass}`)) return;
      if (clickCallback) {
        clickCallback(listId, listData.ownerId);
      }
    });

    card.querySelector(`.${btnClass}`).addEventListener("click", (e) => {
      e.stopPropagation();
      actionCallback(listId, listData.name, listData.ownerId);
    });

    userListsContainer.appendChild(card);
  });
}

// Vẽ ảnh bìa thu nhỏ đại diện (Preview) trong Form
export function renderTempPreview(tempSelectedMangas, removeCallback) {
  tempSelectedTitlesContainer.innerHTML = "";
  tempSelectedMangas.forEach((manga) => {
    const item = document.createElement("div");
    item.className = "preview-cover-item";
    item.innerHTML = `
      <img src="${manga.cover}" alt="${manga.title}" title="${manga.title}" />
      <button class="btn-remove-preview-item" type="button">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;

    item.querySelector(".btn-remove-preview-item").addEventListener("click", () => {
      removeCallback(manga.id);
    });

    tempSelectedTitlesContainer.appendChild(item);
  });
}
