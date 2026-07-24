// js/list/list-form.js

import { state } from "./list-state.js";
import {
  writeSubcollectionDoc,
  deleteSubcollectionDoc,
  readUserField,
} from "../database/firebase.js";
import { hienThiHopThoai } from "../helper/dialog.js";
import { handleOpenListDetails } from "./list-details.js";

// DOM inputs
const listNameInput = document.getElementById("list-name-input");
const editListNameInput = document.getElementById("edit-list-name-input");
const selectedVisibilitySpan = document.getElementById("selected-visibility");
const editSelectedVisibilitySpan = document.getElementById("edit-selected-visibility");

export async function handleDeleteList(listId, listName, loadUserListsCallback) {
  const confirmDel = await hienThiHopThoai(
    `Bạn có chắc chắn muốn xóa danh sách "${listName}"?`,
    "Xóa",
    "Hủy",
  );
  if (confirmDel) {
    await deleteSubcollectionDoc(state.currentUser.uid, "customLists", listId);
    await loadUserListsCallback();
  }
}

export async function handleSaveList(toggleViewCallback, loadUserListsCallback) {
  const name = listNameInput.value.trim();
  if (!name) {
    await hienThiHopThoai("Vui lòng đặt tên cho danh sách.", "Đóng", null);
    return;
  }

  const realCreatorName = await readUserField(
    state.currentUser.uid,
    "name",
    state.currentUser.displayName || "User",
  );

  const payload = {
    name,
    visibility: state.selectedVisibility,
    creator: realCreatorName,
    titles: state.tempSelectedMangas,
    createdAt: Date.now(),
  };

  const listId = `list_${Date.now()}`;
  const success = await writeSubcollectionDoc(
    state.currentUser.uid,
    "customLists",
    listId,
    payload,
  );
  if (success) {
    resetCreateForm(toggleViewCallback);
    await loadUserListsCallback();
  }
}

export async function handleUpdateList(toggleViewCallback) {
  const name = editListNameInput.value.trim();
  if (!name) {
    await hienThiHopThoai("Vui lòng đặt tên cho danh sách.", "Đóng", null);
    return;
  }

  const payload = {
    ...state.currentListObj,
    name,
    visibility: state.selectedVisibility,
    titles: state.tempSelectedMangas,
  };

  const success = await writeSubcollectionDoc(
    state.currentUser.uid,
    "customLists",
    state.currentListId,
    payload,
  );
  if (success) {
    await handleOpenListDetails(state.currentListId, state.currentUser.uid, toggleViewCallback);
  }
}

export function setupEditFormValues() {
  editListNameInput.value = state.currentListObj.name;
  state.selectedVisibility = state.currentListObj.visibility;
  editSelectedVisibilitySpan.textContent = state.selectedVisibility;
  renderEditTitlesGrid();
}

export function renderEditTitlesGrid() {
  const container = document.getElementById("edit-titles-grid-container");
  const editTitlesCountLabel = document.getElementById("edit-titles-count-label");

  if (editTitlesCountLabel) {
    editTitlesCountLabel.textContent = `Titles (${state.tempSelectedMangas.length})`;
  }

  container.innerHTML = "";

  state.tempSelectedMangas.forEach((manga) => {
    const card = document.createElement("div");
    card.className = "edit-manga-thumb-card";
    card.innerHTML = `
      <img src="${manga.cover}" alt="${manga.title}" />
      <button class="edit-thumb-delete-btn" type="button">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="edit-thumb-drag-handle">
        <span class="material-symbols-outlined">drag_pan</span>
      </div>
    `;

    card.querySelector(".edit-thumb-delete-btn").addEventListener("click", () => {
      state.tempSelectedMangas = state.tempSelectedMangas.filter((x) => x.id !== manga.id);
      renderEditTitlesGrid();
    });

    container.appendChild(card);
  });
}

export function resetCreateForm(toggleViewCallback, renderTempPreviewCallback) {
  listNameInput.value = "";
  state.selectedVisibility = "Private";
  selectedVisibilitySpan.textContent = "Private";
  state.tempSelectedMangas = [];
  if (renderTempPreviewCallback) {
    renderTempPreviewCallback(state.tempSelectedMangas, (mangaId) => {
      handleRemoveTempItem(mangaId, renderTempPreviewCallback);
    });
  }
  toggleViewCallback("home");
}

export function handleSelectionToggle(mangaObj, buttonEl, renderTempPreviewCallback) {
  const idx = state.tempSelectedMangas.findIndex((x) => x.id === mangaObj.id);
  if (idx > -1) {
    state.tempSelectedMangas.splice(idx, 1);
    buttonEl.classList.remove("added");
    buttonEl.innerHTML = `<span class="material-symbols-outlined">add</span>`;
  } else {
    state.tempSelectedMangas.push(mangaObj);
    buttonEl.classList.add("added");
    buttonEl.innerHTML = `<span class="material-symbols-outlined">done</span>`;
  }

  if (state.currentTriggerSource === "create") {
    if (renderTempPreviewCallback) {
      renderTempPreviewCallback(state.tempSelectedMangas, (mangaId) => {
        handleRemoveTempItem(mangaId, renderTempPreviewCallback);
      });
    }
  } else {
    renderEditTitlesGrid();
  }
}

export function handleRemoveTempItem(mangaId, renderTempPreviewCallback) {
  state.tempSelectedMangas = state.tempSelectedMangas.filter((x) => x.id !== mangaId);
  if (renderTempPreviewCallback) {
    renderTempPreviewCallback(state.tempSelectedMangas, (id) => {
      handleRemoveTempItem(id, renderTempPreviewCallback);
    });
  }
}

export function checkMangaIsAdded(mangaId) {
  return state.tempSelectedMangas.some((x) => x.id === mangaId);
}

export function hasUnsavedChanges() {
  if (!state.currentListObj) return false;

  const currentName = editListNameInput.value.trim();
  const currentVisibility = state.selectedVisibility;

  if (currentName !== state.currentListObj.name) return true;

  if (currentVisibility !== state.currentListObj.visibility) return true;

  const originalTitles = state.currentListObj.titles || [];
  if (state.tempSelectedMangas.length !== originalTitles.length) return true;

  for (let i = 0; i < state.tempSelectedMangas.length; i++) {
    if (state.tempSelectedMangas[i].id !== originalTitles[i].id) {
      return true;
    }
  }

  return false;
}
