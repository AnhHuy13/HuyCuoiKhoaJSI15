import { ChuyenLocale } from "../helper/utility.js";

/**
 * Khởi tạo bộ chọn đa ngôn ngữ tìm kiếm tùy biến
 * @param {Object} config - Cấu hình khởi tạo bộ chọn
 */
export async function initSearchableDropdown({
  dropdownWrapperId,
  triggerId,
  menuId,
  listId,
  searchInputId,
  flagsContainerId,
  textId,
  defaultCode, // "any" hoặc "all"
  defaultLabel, // "Any language" hoặc "All languages"
  jsonUrl, // Đường dẫn đến file languages.json
  initialSelection, // Giá trị mảng mặc định ban đầu
  onChange, // Hàm callback nhận lại mảng giá trị mới khi thay đổi
}) {
  const wrapper = document.getElementById(dropdownWrapperId);
  const trigger = document.getElementById(triggerId);
  const menu = document.getElementById(menuId);
  const list = document.getElementById(listId);
  const searchInput = document.getElementById(searchInputId);
  const flagsContainer = document.getElementById(flagsContainerId);
  const textEl = document.getElementById(textId);

  if (!wrapper || !trigger || !menu || !list) return;

  let selectedCodes = [...initialSelection];
  let fullLanguagesList = [];

  try {
    // 1. Tải và xử lý danh sách ngôn ngữ
    const res = await fetch(jsonUrl);
    const languagesMap = await res.json();

    const sortedLanguages = Object.entries(languagesMap)
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    fullLanguagesList = [{ code: defaultCode, name: defaultLabel }, ...sortedLanguages];

    // 2. Cập nhật giao diện thanh hiển thị nút bấm
    function updateUI() {
      if (selectedCodes.includes(defaultCode) || selectedCodes.length === 0) {
        textEl.textContent = defaultLabel;
        flagsContainer.innerHTML = "";
        return;
      }

      // Kết xuất các cờ nằm cạnh nhau
      const flagsHTML = selectedCodes
        .map((code) => {
          const countryCode = ChuyenLocale(code);
          return countryCode && countryCode !== "un"
            ? `<span class="fi fi-${countryCode} flag-icon"></span>`
            : "";
        })
        .join("");

      flagsContainer.innerHTML = flagsHTML;

      // Hiển thị nhãn tên hoặc tóm tắt số lượng lựa chọn
      const selectedNames = selectedCodes
        .map((code) => {
          const item = fullLanguagesList.find((l) => l.code === code);
          return item ? item.name : "";
        })
        .filter(Boolean);

      const concatenatedNames = selectedNames.join(", ");
      textEl.textContent =
        concatenatedNames.length > 25 ? `${selectedCodes.length} selected` : concatenatedNames;
    }

    // 3. Kết xuất mã HTML danh sách ban đầu
    list.innerHTML = fullLanguagesList
      .map((lang) => {
        const isSelected = selectedCodes.includes(lang.code);
        const countryCode = ChuyenLocale(lang.code);
        const hasFlag = countryCode && countryCode !== "un" && lang.code !== defaultCode;

        return `
          <div class="custom-dropdown-item ${isSelected ? "selected" : ""}" data-value="${lang.code}">
            <span class="checkbox-box"></span>
            ${hasFlag ? `<span class="fi fi-${countryCode} flag-icon"></span>` : '<span style="width: 16px; display: inline-block;"></span>'}
            <span class="lang-name">${lang.name}</span>
          </div>
        `;
      })
      .join("");

    // 4. Sự kiện đóng/mở menu dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display === "block";

      // Đóng tất cả dropdown khác đang mở trên màn hình để tránh chồng lấn
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

    // 5. Logic tìm kiếm thời gian thực
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = list.querySelectorAll(".custom-dropdown-item");
        items.forEach((item) => {
          const langName = item.querySelector(".lang-name").textContent.toLowerCase();
          if (langName.includes(query)) {
            item.style.display = "flex";
          } else {
            item.style.display = "none";
          }
        });
      });

      searchInput.addEventListener("click", (e) => e.stopPropagation());
    }

    // 6. Xử lý sự kiện lựa chọn các mục Checkbox
    list.querySelectorAll(".custom-dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = item.dataset.value;

        if (code === defaultCode) {
          selectedCodes = [defaultCode];
          list.querySelectorAll(".custom-dropdown-item").forEach((el) => {
            if (el.dataset.value === defaultCode) el.classList.add("selected");
            else el.classList.remove("selected");
          });
        } else {
          selectedCodes = selectedCodes.filter((c) => c !== defaultCode);
          const defaultItem = list.querySelector(`[data-value="${defaultCode}"]`);
          if (defaultItem) defaultItem.classList.remove("selected");

          if (selectedCodes.includes(code)) {
            selectedCodes = selectedCodes.filter((c) => c !== code);
            item.classList.remove("selected");
          } else {
            selectedCodes.push(code);
            item.classList.add("selected");
          }

          if (selectedCodes.length === 0) {
            selectedCodes = [defaultCode];
            if (defaultItem) defaultItem.classList.add("selected");
          }
        }

        updateUI();
        onChange(selectedCodes);
      });
    });

    // Lắng nghe sự kiện click bên ngoài để đóng menu
    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        menu.style.display = "none";
        wrapper.classList.remove("active");
      }
    });

    // 7. Tạo hàm reset độc lập gắn trực tiếp vào DOM Node để gọi từ bên ngoài khi reset bộ lọc
    wrapper.resetDropdown = () => {
      selectedCodes = [defaultCode];
      updateUI();
      if (searchInput) searchInput.value = "";
      list.querySelectorAll(".custom-dropdown-item").forEach((el) => {
        el.style.display = "flex";
        if (el.dataset.value === defaultCode) el.classList.add("selected");
        else el.classList.remove("selected");
      });
      onChange(selectedCodes);
    };

    // Vẽ giao diện lần đầu
    updateUI();
  } catch (error) {
    console.error(`Lỗi cấu hình bộ chọn ${dropdownWrapperId}:`, error);
  }
}
