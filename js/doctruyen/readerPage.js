import { state } from "./readerState.js";
import { FirstRender, RenderViewer, HienTrangManga, CapNhatSliderVaCurTrang } from "./readerUI.js";
import { LoadChapterContext, ChuyenHuongDenChapterLanCan } from "./readerNavigation.js";
import { LayArrayHinhManga, LayThongTinChapter } from "../fetch/fetchRead.js";
import { layCache, luuCache } from "../helper/cacheHelper.js";
import { luuLichSuDoc } from "../readingHistory/readingHistory.js";

const slider = document.getElementById("manga-progress");
const tooltip = document.getElementById("slider-tooltip");
const gapDialog = document.getElementById("chapter-gap-dialog");
const modeSelect = document.getElementById("reading-mode-select");
const viewer = document.getElementById("manga-viewer");

export async function initializeReader() {
  if (!state.mangaId || !state.chapterId) return;

  const nameCacheKey = `cache_manga_detail_reader_${state.chapterId}`;
  const CACHE_TTL_3_NGAY = 24 * 3 * 60 * 60 * 1000;
  let chapterData = layCache(nameCacheKey, CACHE_TTL_3_NGAY);

  if (!chapterData) {
    chapterData = await LayThongTinChapter(state.chapterId);
    if (chapterData) {
      luuCache(nameCacheKey, chapterData);
    }
  }

  state.isLongStrip = chapterData?.mangaInfo?.isLongStrip || false;
  state.originalLanguage = (chapterData?.mangaInfo?.originalLanguage || "").toLowerCase();

  const isWebtoonSuggest =
    state.isLongStrip ||
    state.originalLanguage === "ko" ||
    state.originalLanguage === "kr" ||
    state.originalLanguage === "zh" ||
    state.originalLanguage === "cn" ||
    state.originalLanguage === "zh-hk";

  const userChoice = localStorage.getItem("manga_reading_mode") || "auto";
  if (modeSelect) {
    modeSelect.value = userChoice;
  }

  if (userChoice === "auto") {
    state.currentMode = isWebtoonSuggest ? "webtoon" : "paginated";
  } else {
    state.currentMode = userChoice;
  }

  const data = await LayArrayHinhManga(state.mangaId, state.chapterId);
  if (data) {
    state.mangaMaxPage = data.MaxPage;
    state.mangaLinkFileArray = data.FileArray;

    FirstRender(ChuyenVeTrangTiepTheo);
    RenderViewer();

    try {
      if (chapterData) {
        luuLichSuDoc(state.mangaId, state.chapterId, chapterData);
      }
    } catch (err) {
      console.error("Không thể ghi nhận lịch sử đọc:", err);
    }
  }

  await LoadChapterContext();

  // Gọi hàm khởi tạo dữ liệu và sự kiện cho dropdown sau khi load xong context
  InitChapterDropdown();

  bindReaderEvents();
}

export function ChuyenVeTrangTiepTheo() {
  if (state.currentMode === "webtoon") {
    ChuyenHuongDenChapterLanCan(1);
    return;
  }

  if (state.mangaCurrentPage < state.mangaMaxPage) {
    state.mangaCurrentPage++;
    HienTrangManga(state.mangaCurrentPage);
    CapNhatSliderVaCurTrang(state.mangaCurrentPage);
    return;
  }

  ChuyenHuongDenChapterLanCan(1);
}

export function ChuyenVeTrangTruoc() {
  if (state.currentMode === "webtoon") {
    ChuyenHuongDenChapterLanCan(-1);
    return;
  }

  if (state.mangaCurrentPage > 0) {
    state.mangaCurrentPage--;
    HienTrangManga(state.mangaCurrentPage);
    CapNhatSliderVaCurTrang(state.mangaCurrentPage);
    return;
  }

  ChuyenHuongDenChapterLanCan(-1);
}

// KHỞI TẠO DROPDOWN DANH SÁCH CHƯƠNG NHÓM THEO VOLUME
function InitChapterDropdown() {
  const dropdown = document.getElementById("manga-vol-dropdown");
  const volContainer = document.getElementById("manga-vol-container");
  if (!dropdown || !volContainer) return;

  // 1. Phân nhóm các chương cùng ngôn ngữ theo Volume
  const groupedByVolume = {};
  state.allChaptersInLanguage.forEach((ch) => {
    const vol = ch.volume || "No Volume";
    if (!groupedByVolume[vol]) {
      groupedByVolume[vol] = [];
    }
    groupedByVolume[vol].push(ch);
  });

  // 2. Sắp xếp thứ tự các Volume tăng dần
  const sortedVols = Object.keys(groupedByVolume).sort((a, b) => {
    if (a === "No Volume") return 1;
    if (b === "No Volume") return -1;
    return parseFloat(a) - parseFloat(b);
  });

  // 3. Tiến hành sinh mã HTML
  let html = "";
  sortedVols.forEach((vol) => {
    const titleStr = vol === "No Volume" ? "No Volume" : `Volume ${vol}`;
    html += `<div class="dropdown-volume-group-header">${titleStr}</div>`;

    groupedByVolume[vol].forEach((ch) => {
      const isActive = ch.id === state.chapterId ? "active" : "";
      const flagClass = ch.countryCode ? `fi fi-${ch.countryCode}` : "fi fi-un";
      const titleText = ch.title ? `- ${ch.title}` : "";
      const readUrl = `doctruyen.html?mangaId=${state.mangaId}&chapterId=${ch.id}`;

      // SỬA LỖI: Định dạng lại hiển thị để không xuất hiện chữ "Vol. No Volume"
      const volStr = vol === "No Volume" || !vol ? "" : `Vol. ${vol} `;
      const displayText = `${volStr}Ch. ${ch.chapter} ${titleText}`;

      html += `
        <a href="${readUrl}" class="dropdown-chapter-item ${isActive}">
          <span class="${flagClass}"></span>
          <span class="dropdown-chapter-text">${displayText}</span>
        </a>
      `;
    });
  });

  dropdown.innerHTML = html;

  // 4. Sự kiện click mở/đóng danh sách
  volContainer.addEventListener("click", (e) => {
    dropdown.classList.toggle("show");
    e.stopPropagation();
  });

  // Đóng dropdown khi click ra ngoài vùng hiển thị
  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });
}

function bindReaderEvents() {
  if (slider) {
    slider.addEventListener("input", function () {
      state.isDraggingSlider = true;
      state.mangaCurrentPage = parseInt(this.value, 10);

      if (state.currentMode === "webtoon") {
        const images = viewer.querySelectorAll(".reader-image");
        const targetImg = images[state.mangaCurrentPage];
        if (targetImg) {
          const containerOffset = viewer.getBoundingClientRect().top;
          const imgOffset = targetImg.getBoundingClientRect().top;
          const absoluteImgTop = imgOffset - containerOffset + viewer.scrollTop;

          viewer.scrollTo({
            top: absoluteImgTop,
            behavior: "auto",
          });
        }
        CapNhatSliderVaCurTrang(state.mangaCurrentPage);
      } else {
        HienTrangManga(state.mangaCurrentPage);
        CapNhatSliderVaCurTrang(state.mangaCurrentPage);
      }

      tooltip.classList.add("show");
      clearTimeout(tooltip.timer);
    });

    slider.addEventListener("change", () => {
      state.isDraggingSlider = false;
      tooltip.timer = setTimeout(() => tooltip.classList.remove("show"), 800);
    });
  }

  viewer?.addEventListener("scroll", () => {
    if (state.currentMode !== "webtoon" || state.isDraggingSlider) return;

    const images = viewer.querySelectorAll(".reader-image");
    if (images.length === 0) return;

    const containerRect = viewer.getBoundingClientRect();
    let currentVisibleIndex = 0;
    let minDiff = Infinity;

    images.forEach((img, index) => {
      const rect = img.getBoundingClientRect();
      const diff = Math.abs(rect.top - containerRect.top);
      if (diff < minDiff) {
        minDiff = diff;
        currentVisibleIndex = index;
      }
    });

    state.mangaCurrentPage = currentVisibleIndex;
    CapNhatSliderVaCurTrang(state.mangaCurrentPage);
  });

  modeSelect?.addEventListener("change", (e) => {
    const choice = e.target.value;
    localStorage.setItem("manga_reading_mode", choice);

    if (choice === "auto") {
      const isWebtoonSuggest =
        state.isLongStrip ||
        state.originalLanguage === "ko" ||
        state.originalLanguage === "kr" ||
        state.originalLanguage === "zh" ||
        state.originalLanguage === "cn" ||
        state.originalLanguage === "zh-hk";
      state.currentMode = isWebtoonSuggest ? "webtoon" : "paginated";
    } else {
      state.currentMode = choice;
    }
    RenderViewer();
    modeSelect.blur();
  });

  document.querySelector("#prev-page")?.addEventListener("click", (e) => {
    e.preventDefault();
    ChuyenVeTrangTruoc();
  });

  document.querySelector("#next-page")?.addEventListener("click", (e) => {
    e.preventDefault();
    ChuyenVeTrangTiepTheo();
  });

  // GẮN SỰ KIỆN CHO HAI NÚT SWITCH CHƯƠNG TRÊN SIDEBAR
  document.getElementById("manga-sidebar-previous-switch")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    ChuyenHuongDenChapterLanCan(-1);
  });

  document.getElementById("manga-sidebar-next-switch")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    ChuyenHuongDenChapterLanCan(1);
  });

  // XỬ LÝ SỰ KIỆN PHÍM DI CHUYỂN
  window.addEventListener("keydown", (e) => {
    const activeTag = document.activeElement.tagName;
    if (activeTag === "SELECT" || activeTag === "INPUT" || activeTag === "TEXTAREA") {
      return;
    }

    if (state.currentMode === "webtoon") {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        viewer?.scrollBy({ top: 180, behavior: "smooth" });
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        viewer?.scrollBy({ top: -180, behavior: "smooth" });
      }
    } else {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        ChuyenVeTrangTruoc();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        ChuyenVeTrangTiepTheo();
      }
    }
  });

  const gapCancel = document.getElementById("gap-cancel");
  const gapClose = document.getElementById("close-gap-x");
  const gapBackTitle = document.getElementById("gap-back-title");
  const mangaTitle = document.getElementById("manga-sidebar-name-manga");

  gapCancel?.addEventListener("click", () => gapDialog?.close());
  gapClose?.addEventListener("click", () => gapDialog?.close());
  gapBackTitle?.addEventListener("click", () => {
    window.location.href = `manga.html?mangaId=${state.mangaId}`;
  });
  mangaTitle?.addEventListener("click", () => {
    window.location.href = `manga.html?mangaId=${state.mangaId}`;
  });
}
