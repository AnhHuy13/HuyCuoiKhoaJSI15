import { POPULAR_TAGS } from "./constAdvSearch.js";
import { showLoadingScreen, hideLoadingScreen, updateProgress } from "./utilsAdvSearch.js";
import { renderMangaResults } from "./UIAdvSearch.js";
import { fetchAdvancedSearch } from "../fetch/fetchAdvancedSearch.js";
import { initSearchableDropdown } from "./dropdownAdvSearch.js"; // <-- Nạp module mới

let lastSearchResults = [];
let currentPage = 1;
const resultsPerPage = 20;
let totalResultsCount = 0;
let currentLayout = "list";

// Quản lý mảng giá trị lựa chọn của hai bộ lọc
let selectedTranslatedLanguages = ["any"];
let selectedOriginalLanguages = ["all"];

const tagStates = {}; // key: UUID, value: 'none' | 'include' | 'exclude'

// Thiết lập danh sách thẻ tag
function initTagGrid() {
  const tagGrid = document.getElementById("tag-grid");
  if (!tagGrid) return;

  tagGrid.innerHTML = POPULAR_TAGS.map((tag) => {
    tagStates[tag.id] = "none";
    return `<div class="tag-pill-choice" data-id="${tag.id}">${tag.name}</div>`;
  }).join("");

  document.querySelectorAll(".tag-pill-choice").forEach((pill) => {
    pill.addEventListener("click", () => {
      const tagId = pill.dataset.id;
      const currentState = tagStates[tagId];

      if (currentState === "none") {
        tagStates[tagId] = "include";
        pill.classList.add("include");
        pill.classList.remove("exclude");
      } else if (currentState === "include") {
        tagStates[tagId] = "exclude";
        pill.classList.add("exclude");
        pill.classList.remove("include");
      } else {
        tagStates[tagId] = "none";
        pill.classList.remove("include", "exclude");
      }
    });
  });
}

// Khởi chạy cả hai bộ lọc Custom Dropdown từ file component ngoài
async function initDropdowns() {
  // 1. Dropdown Ngôn ngữ dịch thuật
  await initSearchableDropdown({
    dropdownWrapperId: "lang-custom-dropdown",
    triggerId: "lang-dropdown-btn",
    menuId: "lang-dropdown-menu",
    listId: "lang-dropdown-items-list",
    searchInputId: "lang-search-input",
    flagsContainerId: "selected-flags-container",
    textId: "selected-lang-text",
    defaultCode: "any",
    defaultLabel: "Any language",
    jsonUrl: "../data/languages.json",
    initialSelection: selectedTranslatedLanguages,
    onChange: (codes) => {
      selectedTranslatedLanguages = codes;
    },
  });

  // 2. Dropdown Ngôn ngữ gốc
  await initSearchableDropdown({
    dropdownWrapperId: "orig-custom-dropdown",
    triggerId: "orig-dropdown-btn",
    menuId: "orig-dropdown-menu",
    listId: "orig-dropdown-items-list",
    searchInputId: "orig-search-input",
    flagsContainerId: "orig-selected-flags-container",
    textId: "orig-selected-lang-text",
    defaultCode: "all",
    defaultLabel: "All languages",
    jsonUrl: "../data/languages.json",
    initialSelection: selectedOriginalLanguages,
    onChange: (codes) => {
      selectedOriginalLanguages = codes;
    },
  });
}

// Thu thập tham số tìm kiếm từ bộ lọc
function collectFilterParams() {
  const title = document.getElementById("main-search-input").value;
  const sort = document.getElementById("filter-sort").value;
  const includedTagsMode = document.getElementById("filter-tags-mode").value;
  const excludedTagsMode = includedTagsMode;
  const contentRatingVal = document.getElementById("filter-content-rating").value;
  const demographicVal = document.getElementById("filter-demographic").value;
  const authorName = document.getElementById("filter-author").value;
  const artistName = document.getElementById("filter-artist").value;
  const year = parseInt(document.getElementById("filter-year").value) || null;
  const status = document.getElementById("filter-status").value;
  const hasTranslatedChapters = document.getElementById("filter-has-translated").checked;

  const originalLanguage = selectedOriginalLanguages.includes("all")
    ? "all"
    : selectedOriginalLanguages.length === 1
      ? selectedOriginalLanguages[0]
      : selectedOriginalLanguages;

  const translatedLanguage = selectedTranslatedLanguages.includes("any")
    ? "any"
    : selectedTranslatedLanguages.length === 1
      ? selectedTranslatedLanguages[0]
      : selectedTranslatedLanguages;

  const includedTags = [];
  const excludedTags = [];

  Object.entries(tagStates).forEach(([id, state]) => {
    if (state === "include") includedTags.push(id);
    else if (state === "exclude") excludedTags.push(id);
  });

  const contentRating = contentRatingVal === "any" ? [] : [contentRatingVal];
  const demographic = demographicVal === "any" ? [] : [demographicVal];

  return {
    title,
    sort,
    includedTags,
    excludedTags,
    includedTagsMode,
    excludedTagsMode,
    contentRating,
    demographic,
    authorName,
    artistName,
    originalLanguage,
    year,
    status,
    hasTranslatedChapters,
    translatedLanguage,
    limit: resultsPerPage,
    offset: (currentPage - 1) * resultsPerPage,
  };
}

async function performSearch() {
  showLoadingScreen("Đang tìm kiếm thông tin truyện...");
  try {
    const filters = collectFilterParams();
    updateProgress(50, "Đang tải danh sách kết quả...");
    const results = await fetchAdvancedSearch(filters);

    lastSearchResults = results.data || [];
    totalResultsCount = results.total || 0;

    updateProgress(90, "Đang xử lý giao diện hiển thị...");
    renderMangaResults(lastSearchResults, totalResultsCount, resultsPerPage, currentPage);
  } catch (error) {
    console.error("Lỗi trong quá trình tìm kiếm:", error);
    const container = document.getElementById("results-container");
    if (container) {
      container.innerHTML = `
        <div class="empty-results-state">
          <span class="material-symbols-outlined massive-icon">error</span>
          <p>Lỗi hệ thống khi kết nối với MangaDex. Vui lòng thử lại sau.</p>
        </div>
      `;
    }
  } finally {
    hideLoadingScreen();
  }
}

// Chức năng I'm Feeling Lucky
async function executeLuckySearch() {
  showLoadingScreen("Đang quay số may mắn...");
  try {
    const randomOffset = Math.floor(Math.random() * 80);
    const results = await fetchAdvancedSearch({
      limit: 20,
      offset: randomOffset,
      sort: "followedCount",
    });

    if (results.data && results.data.length > 0) {
      const randomIndex = Math.floor(Math.random() * results.data.length);
      const randomManga = results.data[randomIndex];
      updateProgress(100, "Đang chuyển hướng...");
      window.location.href = `./manga.html?mangaId=${randomManga.id}`;
    } else {
      window.location.href = "./manga.html?mangaId=f64d3301-38a6-42d4-bb60-c3d3f94ec607";
    }
  } catch (error) {
    console.error("Lỗi may mắn:", error);
    window.location.href = "./manga.html?mangaId=f64d3301-38a6-42d4-bb60-c3d3f94ec607";
  }
}

function resetFilters() {
  document.getElementById("main-search-input").value = "";
  document.getElementById("filter-sort").value = "none";
  document.getElementById("filter-tags-mode").value = "OR";
  document.getElementById("filter-content-rating").value = "any";
  document.getElementById("filter-demographic").value = "any";
  document.getElementById("filter-author").value = "";
  document.getElementById("filter-artist").value = "";
  document.getElementById("filter-year").value = "";
  document.getElementById("filter-status").value = "any";
  document.getElementById("filter-has-translated").checked = false;
  document.getElementById("translated-lang-wrapper").style.display = "none";

  // Khôi phục đồng thời cả hai bộ chọn Dropdown bằng phương thức resetDropdown đã gắn
  const langDropdown = document.getElementById("lang-custom-dropdown");
  const origDropdown = document.getElementById("orig-custom-dropdown");
  if (langDropdown && langDropdown.resetDropdown) langDropdown.resetDropdown();
  if (origDropdown && origDropdown.resetDropdown) origDropdown.resetDropdown();

  Object.keys(tagStates).forEach((id) => {
    tagStates[id] = "none";
  });
  document.querySelectorAll(".tag-pill-choice").forEach((pill) => {
    pill.classList.remove("include", "exclude");
  });

  currentPage = 1;
  document.getElementById("clear-search-btn").style.display = "none";
}

function setupEvents() {
  const toggleBtn = document.getElementById("toggle-filters-btn");
  const filterPanel = document.getElementById("filter-panel");
  const mainSearchInput = document.getElementById("main-search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  // Nút đóng/mở filters
  toggleBtn.addEventListener("click", () => {
    const isHidden = filterPanel.style.display === "none";
    if (isHidden) {
      filterPanel.style.display = "block";
      toggleBtn.classList.add("active");
      toggleBtn.querySelector(".btn-text").textContent = "Hide filters";
      toggleBtn.querySelector(".icon-arrow").textContent = "expand_less";
    } else {
      filterPanel.style.display = "none";
      toggleBtn.classList.remove("active");
      toggleBtn.querySelector(".btn-text").textContent = "Show filters";
      toggleBtn.querySelector(".icon-arrow").textContent = "expand_more";
    }
  });

  mainSearchInput.addEventListener("input", () => {
    clearSearchBtn.style.display = mainSearchInput.value.length > 0 ? "block" : "none";
  });

  clearSearchBtn.addEventListener("click", () => {
    mainSearchInput.value = "";
    clearSearchBtn.style.display = "none";
    mainSearchInput.focus();
  });

  // Tăng/giảm năm
  const yearInput = document.getElementById("filter-year");
  document.getElementById("year-minus").addEventListener("click", () => {
    const val = parseInt(yearInput.value) || new Date().getFullYear();
    yearInput.value = val - 1;
  });
  document.getElementById("year-plus").addEventListener("click", () => {
    const val = parseInt(yearInput.value) || new Date().getFullYear();
    yearInput.value = val + 1;
  });

  // Toggle ngôn ngữ dịch thuật
  const hasTranslatedCheckbox = document.getElementById("filter-has-translated");
  const translatedLangWrapper = document.getElementById("translated-lang-wrapper");
  hasTranslatedCheckbox.addEventListener("change", () => {
    translatedLangWrapper.style.display = hasTranslatedCheckbox.checked ? "block" : "none";
  });

  // Trình kích hoạt tìm kiếm chính
  document.getElementById("search-btn").addEventListener("click", () => {
    currentPage = 1;
    performSearch();
  });

  mainSearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentPage = 1;
      performSearch();
    }
  });

  document.getElementById("reset-filters-btn").addEventListener("click", resetFilters);
  document.getElementById("lucky-btn").addEventListener("click", executeLuckySearch);
  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "./trangchu.html";
  });

  // Xử lý đổi Layout chế độ xem
  const layoutListBtn = document.getElementById("layout-list-btn");
  const layoutGridBtn = document.getElementById("layout-grid-btn");
  const layoutCompactBtn = document.getElementById("layout-compact-btn");
  const resultsContainer = document.getElementById("results-container");

  const switchLayout = (mode) => {
    currentLayout = mode;
    layoutListBtn.classList.remove("active");
    layoutGridBtn.classList.remove("active");
    layoutCompactBtn.classList.remove("active");
    resultsContainer.classList.remove("list-view", "grid-view", "compact-view");

    if (mode === "list") {
      layoutListBtn.classList.add("active");
      resultsContainer.classList.add("list-view");
    } else if (mode === "grid") {
      layoutGridBtn.classList.add("active");
      resultsContainer.classList.add("grid-view");
    } else {
      layoutCompactBtn.classList.add("active");
      resultsContainer.classList.add("compact-view");
    }
    renderMangaResults(lastSearchResults, totalResultsCount, resultsPerPage, currentPage);
  };

  layoutListBtn.addEventListener("click", () => switchLayout("list"));
  layoutGridBtn.addEventListener("click", () => switchLayout("grid"));
  layoutCompactBtn.addEventListener("click", () => switchLayout("compact"));

  // Sự kiện phân trang
  document.getElementById("prev-page-btn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      performSearch();
    }
  });

  document.getElementById("next-page-btn").addEventListener("click", () => {
    if (currentPage * resultsPerPage < totalResultsCount) {
      currentPage++;
      performSearch();
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  showLoadingScreen("Đang tải dữ liệu bộ lọc...");
  initTagGrid();
  await initDropdowns(); // Khởi tạo đồng loạt cả hai Custom Dropdowns
  setupEvents();
  setTimeout(hideLoadingScreen, 300);
});
