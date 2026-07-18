import { ChuyenLocale, getLanguageName } from "../helper/utility.js";

export let currentLanguage = "all";
let isFirstLoad = true;

function getCountryDisplayName(code) {
  return getLanguageName(code) || code.toUpperCase();
}

function detectBrowserLanguage() {
  const browserLang = navigator.language.split("-")[0];
  return ChuyenLocale(browserLang);
}

/**
 * Khởi tạo và quản lý toàn bộ UI/Sự kiện của thanh chọn ngôn ngữ
 * @param {Set<string>} uniqueCountries - Tập hợp các mã quốc gia hiện có của truyện
 * @param {Function} onChangeCallback - Hàm callback gọi lại khi người dùng đổi ngôn ngữ
 */
export function initLanguageSelector(uniqueCountries, onChangeCallback) {
  const selectLang = document.getElementById("filter-lang");
  if (!selectLang) return;

  if (selectLang.options.length > 1) {
    return;
  }

  selectLang.innerHTML = `<option value="all">All Languages</option>`;
  Array.from(uniqueCountries)
    .sort()
    .forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = getCountryDisplayName(code);
      selectLang.appendChild(option);
    });

  currentLanguage = "all";
  selectLang.value = "all";

  selectLang.onchange = (e) => {
    currentLanguage = e.target.value;
    onChangeCallback(currentLanguage);
  };
}

/**
 * Lọc mảng phiên bản chương theo ngôn ngữ hiện tại
 * @param {Array} versions - Danh sách các chapter sub-rows
 * @returns {Array} Danh sách đã lọc tương ứng
 */
export function filterByLanguage(versions) {
  return versions.filter((v) => currentLanguage === "all" || v.countryCode === currentLanguage);
}
