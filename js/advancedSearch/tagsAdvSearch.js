import { layDuLieuCache, luuDuLieuCache } from "../helper/utility.js";

const CACHE_KEY = "mangadex_tags_dynamic_cache";
const TTL_ONE_DAY = 24 * 60 * 60 * 1000;

async function fetchMangaDexTags() {
  const cachedData = layDuLieuCache(CACHE_KEY, TTL_ONE_DAY);
  if (cachedData && cachedData.length > 0) {
    return cachedData;
  }

  try {
    const res = await fetch("https://api.mangadex.org/manga/tag");
    const json = await res.json();
    if (json.result === "ok" && json.data) {
      luuDuLieuCache(CACHE_KEY, json.data);
      return json.data;
    }
  } catch (error) {
    console.error("Lỗi khi kết nối lấy danh sách tag từ MangaDex API:", error);
  }
  return [];
}

/**
 * Khởi tạo hệ thống Dropdown thẻ tag nâng cao mở rộng
 */
export async function initAdvancedTagsManager({ tagStates, onStateChange }) {
  const wrapper = document.getElementById("tags-custom-dropdown");
  const trigger = document.getElementById("tags-dropdown-btn");
  const menu = document.getElementById("tags-dropdown-menu");
  const summaryText = document.getElementById("selected-tags-summary-text");

  const helpBar = document.getElementById("tag-help-bar");
  const dismissHelpBtn = document.getElementById("dismiss-tag-help-btn");
  const searchInput = document.getElementById("tag-search-input");
  const resetBtn = document.getElementById("tag-reset-btn");

  const incModeBottom = document.getElementById("filter-tags-mode");
  const excModeBottom = document.getElementById("filter-tags-exclusion-mode");

  if (!wrapper || !trigger || !menu) return;

  // 1. Quản lý hiển thị thanh thông báo trợ giúp
  if (localStorage.getItem("dismissed-tag-help") === "true") {
    if (helpBar) helpBar.style.display = "none";
  }

  if (dismissHelpBtn && helpBar) {
    dismissHelpBtn.addEventListener("click", () => {
      helpBar.style.display = "none";
      localStorage.setItem("dismissed-tag-help", "true");
    });
  }

  // 2. Tải và phân bổ dữ liệu động từ API
  const rawTags = await fetchMangaDexTags();

  const categorized = {
    format: [],
    genre: [],
    theme: [],
    content: [],
  };

  rawTags.forEach((tag) => {
    const group = tag.attributes.group;
    const id = tag.id;
    const name = tag.attributes.name.en || Object.values(tag.attributes.name)[0] || "Unknown";

    if (categorized[group]) {
      categorized[group].push({ id, name });
      tagStates[id] = "none";
    }
  });

  Object.keys(categorized).forEach((key) => {
    categorized[key].sort((a, b) => a.name.localeCompare(b.name));
  });

  Object.entries(categorized).forEach(([category, tags]) => {
    const grid = document.getElementById(`tags-grid-${category}`);
    if (!grid) return;

    grid.innerHTML = tags
      .map((tag) => {
        // Kiểm tra xem tag này đã có trạng thái được nạp sẵn từ URL chưa, nếu chưa thì để mặc định 'none'
        const state = tagStates[tag.id] || "none";
        tagStates[tag.id] = state;

        const activeClass = state !== "none" ? ` ${state}` : "";
        return `<div class="tag-pill-choice${activeClass}" data-id="${tag.id}">${tag.name}</div>`;
      })
      .join("");
  });

  // 3. Hàm cập nhật nhãn chữ tóm tắt trạng thái (ví dụ: Tags (+3, -1))
  function updateTriggerSummary() {
    if (!summaryText) return;
    const includedCount = Object.values(tagStates).filter((v) => v === "include").length;
    const excludedCount = Object.values(tagStates).filter((v) => v === "exclude").length;

    if (includedCount === 0 && excludedCount === 0) {
      summaryText.textContent = "Filter tags";
    } else {
      const summaryParts = [];
      if (includedCount > 0) summaryParts.push(`+${includedCount}`);
      if (excludedCount > 0) summaryParts.push(`-${excludedCount}`);
      summaryText.textContent = `Tags (${summaryParts.join(", ")})`;
    }
  }

  // 4. Đổi trạng thái lọc thẻ tag 3 nấc
  document.querySelectorAll(".tag-pill-choice").forEach((pill) => {
    pill.addEventListener("click", () => {
      const tagId = pill.dataset.id;
      const currentState = tagStates[tagId];

      if (currentState === "none") {
        tagStates[tagId] = "include";
        pill.className = "tag-pill-choice include";
      } else if (currentState === "include") {
        tagStates[tagId] = "exclude";
        pill.className = "tag-pill-choice exclude";
      } else {
        tagStates[tagId] = "none";
        pill.className = "tag-pill-choice";
      }

      updateTriggerSummary();
      if (onStateChange) onStateChange();
    });
  });

  // 5. Đóng/mở Menu thả xuống của bộ lọc tag
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.style.display === "block";

    // Đóng tất cả dropdown khác
    document.querySelectorAll(".custom-dropdown-menu").forEach((m) => {
      if (m !== menu) m.style.display = "none";
    });
    document.querySelectorAll(".custom-dropdown").forEach((w) => {
      if (w !== wrapper) w.classList.remove("active");
    });

    if (isOpen) {
      menu.style.display = "none";
      wrapper.classList.remove("active");
    } else {
      menu.style.display = "block";
      wrapper.classList.add("active");
      if (searchInput) searchInput.focus();
    }
  });

  // 6. Logic tìm kiếm thẻ tag thời gian thực
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();

      document.querySelectorAll(".tag-category-group").forEach((group) => {
        const pills = group.querySelectorAll(".tag-pill-choice");
        let visibleCount = 0;

        pills.forEach((pill) => {
          const name = pill.textContent.toLowerCase();
          if (name.includes(query)) {
            pill.style.display = "inline-flex";
            visibleCount++;
          } else {
            pill.style.display = "none";
          }
        });

        group.style.display = visibleCount > 0 ? "block" : "none";
      });
    });

    // Tránh tắt menu khi click vùng tìm kiếm
    searchInput.addEventListener("click", (e) => e.stopPropagation());
  }

  // 7. Logic nút Reset nhanh toàn bộ tag
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      Object.keys(tagStates).forEach((id) => {
        tagStates[id] = "none";
      });
      document.querySelectorAll(".tag-pill-choice").forEach((pill) => {
        pill.className = "tag-pill-choice";
        pill.style.display = "inline-flex";
      });
      document.querySelectorAll(".tag-category-group").forEach((g) => (g.style.display = "block"));
      if (searchInput) searchInput.value = "";
      if (incModeBottom) incModeBottom.value = "OR";
      if (excModeBottom) excModeBottom.value = "OR";

      updateTriggerSummary();
      if (onStateChange) onStateChange();
    });
  }

  // Đóng menu khi click bên ngoài bộ lọc tag
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      menu.style.display = "none";
      wrapper.classList.remove("active");
    }
  });

  // Cấu hình cơ chế reset liên kết cho DOM Node đại diện bộ lọc tag
  wrapper.resetDropdown = () => {
    Object.keys(tagStates).forEach((id) => {
      tagStates[id] = "none";
    });
    document.querySelectorAll(".tag-pill-choice").forEach((pill) => {
      pill.className = "tag-pill-choice";
      pill.style.display = "inline-flex";
    });
    document.querySelectorAll(".tag-category-group").forEach((g) => (g.style.display = "block"));
    if (searchInput) searchInput.value = "";
    if (incModeBottom) incModeBottom.value = "OR";
    if (excModeBottom) excModeBottom.value = "OR";
    updateTriggerSummary();
  };

  // Khởi tạo hiển thị ban đầu
  updateTriggerSummary();
}
