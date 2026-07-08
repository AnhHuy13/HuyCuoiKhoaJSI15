import { LayArrayHinhManga } from "../fetch/fetchRead.js";
import { LayDanhSachChapter } from "../fetch/fetchMangaPage.js";
import { ChuyenLocale } from "../utility.js";

// --- khởi tạo ---
const params = new URLSearchParams(window.location.search);
const mangaId = params.get("mangaId");
let chapterId = params.get("chapterId");

let mangaCurrentPage = 0;
let mangaMaxPage = 0;
let mangaLinkFileArray = [];
let allChaptersInLanguage = [];
let isLoadingContext = true;

const slider = document.getElementById("manga-progress");
const tooltip = document.getElementById("slider-tooltip");
const gapDialog = document.getElementById("chapter-gap-dialog");
const imgElement = document.querySelector("#manga-page");

Initial();

async function Initial() {
  if (!mangaId || !chapterId) return;

  const data = await LayArrayHinhManga(mangaId, chapterId);
  if (data) {
    mangaMaxPage = data.MaxPage;
    mangaLinkFileArray = data.FileArray;
    initSlider(mangaMaxPage);
    CapNhatSliderVaCurTrang(0);
    HienTrangManga(0);
  }

  // tải danh sách chương để chuẩn bị cho việc "Next"
  await LoadChapterContext();
}

async function LoadChapterContext() {
  isLoadingContext = true;
  try {
    const res = await fetch(`https://api.mangadex.org/chapter/${chapterId}`);
    const currentChapterObj = await res.json();
    const currentLang = currentChapterObj.data.attributes.translatedLanguage;

    const targetCountryCode = ChuyenLocale(currentLang);

    const feed = await LayDanhSachChapter(mangaId, 0, 500, "asc");
    if (!feed) return;

    const flatList = [];
    Object.values(feed.groupedData).forEach((vol) => {
      Object.values(vol).forEach((versions) => {
        versions.forEach((v) => {
          if (v.countryCode === targetCountryCode) {
            flatList.push(v);
          }
        });
      });
    });

    allChaptersInLanguage = flatList.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numA - numB;
    });

    console.log("Context loaded. Total chapters in this language:", allChaptersInLanguage.length);
  } finally {
    isLoadingContext = false;
  }
}

// --- logic điều hướng ---

function GetNeighborChapterId(direction) {
  if (isLoadingContext) return "LOADING";

  // tìm vị trí của chương đang đọc trong list cùng ngôn ngữ
  const currentIndex = allChaptersInLanguage.findIndex((c) => c.id === chapterId);
  if (currentIndex === -1) return null;

  let targetIndex = currentIndex + direction;

  // LOGIC QUAN TRỌNG: Nếu chương tiếp theo trùng số chương (khác nhóm dịch) -> Nhảy tiếp cho tới khi đổi số chương
  while (
    targetIndex >= 0 &&
    targetIndex < allChaptersInLanguage.length &&
    allChaptersInLanguage[targetIndex].chapter === allChaptersInLanguage[currentIndex].chapter
  ) {
    targetIndex += direction;
  }

  const neighbor = allChaptersInLanguage[targetIndex];
  if (!neighbor) return null;

  // kiểm tra nhảy chương (gap)
  const currentNum = parseFloat(allChaptersInLanguage[currentIndex].chapter);
  const neighborNum = parseFloat(neighbor.chapter);

  if (Math.abs(neighborNum - currentNum) > 1.1) {
    HienGapModal(currentNum, neighborNum, neighbor.id);
    return "STOP_BY_GAP";
  }

  return neighbor.id;
}

function ChuyenHuongDenChapter(newId) {
  console.log("Redirecting to chapter:", newId);
  // dùng URL chuẩn, không dùng ../.. nếu 2 file nằm cùng folder html
  window.location.href = `doctruyen.html?mangaId=${mangaId}&chapterId=${newId}`;
}

// --- điều khiển trang ---

function ChuyenVeTrangTiepTheo() {
  if (mangaCurrentPage < mangaMaxPage) {
    mangaCurrentPage++;
    HienTrangManga(mangaCurrentPage);
    CapNhatSliderVaCurTrang(mangaCurrentPage);
  } else {
    // Đã ở trang cuối -> tìm chương mới
    const nextId = GetNeighborChapterId(1);
    if (nextId === "LOADING") return;
    if (nextId && nextId !== "STOP_BY_GAP") {
      ChuyenHuongDenChapter(nextId);
    } else if (!nextId) {
      // Thực sự hết chương mới về trang chủ truyện
      window.location.href = `manga.html?mangaId=${mangaId}`;
    }
  }
}

function ChuyenVeTrangTruoc() {
  if (mangaCurrentPage > 0) {
    mangaCurrentPage--;
    HienTrangManga(mangaCurrentPage);
    CapNhatSliderVaCurTrang(mangaCurrentPage);
  } else {
    const prevId = GetNeighborChapterId(-1);
    if (prevId === "LOADING") return;
    if (prevId && prevId !== "STOP_BY_GAP") {
      ChuyenHuongDenChapter(prevId);
    }
  }
}

// --- các hàm hiển thị & sự kiện ---

async function HienTrangManga(page) {
  if (!mangaLinkFileArray[page]) return;

  imgElement.style.opacity = 0;

  const loadNewPage = new Promise((resolve) => {
    imgElement.onload = () => resolve();
    imgElement.src = mangaLinkFileArray[page];
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  await loadNewPage;
  imgElement.style.opacity = 1;
}

function initSlider(maxPage) {
  slider.min = 0;
  slider.max = maxPage;
  slider.value = 0;
}

function CapNhatSliderVaCurTrang(pageIndex) {
  slider.value = pageIndex;
  const percent = (pageIndex / slider.max) * 100 || 0;
  slider.style.setProperty("--value", percent + "%");
  tooltip.innerText = "Trang: " + (pageIndex + 1);
  const sliderWidth = slider.offsetWidth;
  const newPos = (percent / 100) * (sliderWidth - 15) + 7.5;
  tooltip.style.left = newPos + "px";
  document.querySelector(".manga-sidebar-page-current").textContent =
    `Page ${pageIndex + 1}/${mangaMaxPage + 1}`;
}

slider.addEventListener("input", function () {
  mangaCurrentPage = parseInt(this.value);
  HienTrangManga(mangaCurrentPage);
  CapNhatSliderVaCurTrang(mangaCurrentPage);
  tooltip.classList.add("show");
  clearTimeout(tooltip.timer);
});

slider.addEventListener("change", () => {
  tooltip.timer = setTimeout(() => tooltip.classList.remove("show"), 800);
});

document.querySelector("#prev-page").onclick = (e) => {
  e.preventDefault();
  ChuyenVeTrangTruoc();
};
document.querySelector("#next-page").onclick = (e) => {
  e.preventDefault();
  ChuyenVeTrangTiepTheo();
};

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") ChuyenVeTrangTruoc();
  if (e.key === "ArrowRight") ChuyenVeTrangTiepTheo();
});

function HienGapModal(from, to, nextId) {
  document.getElementById("gap-numbers").innerText = `${from} > ${to}`;
  gapDialog.showModal();
  document.getElementById("gap-continue").onclick = () => ChuyenHuongDenChapter(nextId);
}

document.getElementById("gap-cancel").onclick = () => gapDialog.close();
document.getElementById("close-gap-x").onclick = () => gapDialog.close();
document.getElementById("gap-back-title").onclick = () =>
  (window.location.href = `manga.html?mangaId=${mangaId}`);
document.getElementById("manga-sidebar-name-manga").onclick = () =>
  (window.location.href = `manga.html?mangaId=${mangaId}`);

// --- Chuyển chương nhanh từ Sidebar ---

function ChuyenNhanhChapter(direction) {
  const targetId = GetNeighborChapterId(direction);

  if (targetId === "LOADING") {
    console.log("Đang tải danh sách chương, vui lòng thử lại sau...");
    return;
  }

  if (targetId && targetId !== "STOP_BY_GAP") {
    ChuyenHuongDenChapter(targetId);
  } else if (!targetId) {
    if (direction === 1) {
      // Nếu hết chương tiếp theo -> Quay về trang chủ của manga
      window.location.href = `manga.html?mangaId=${mangaId}`;
    } else {
      console.log("Đây đã là chương đầu tiên.");
    }
  }
}

const btnSidebarPrev = document.getElementById("manga-sidebar-previous-switch");
const btnSidebarNext = document.getElementById("manga-sidebar-next-switch");

if (btnSidebarPrev) {
  btnSidebarPrev.onclick = (e) => {
    e.preventDefault();
    ChuyenNhanhChapter(-1);
  };
}

if (btnSidebarNext) {
  btnSidebarNext.onclick = (e) => {
    e.preventDefault();
    ChuyenNhanhChapter(1);
  };
}
