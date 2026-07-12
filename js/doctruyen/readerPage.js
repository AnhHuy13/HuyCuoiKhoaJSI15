import { ChuyenLocale } from "../utility.js";
import { LayDanhSachChapter } from "../fetch/fetchMangaPage.js";
import { LayArrayHinhManga } from "../fetch/fetchRead.js";

const params = new URLSearchParams(window.location.search);
export const mangaId = params.get("mangaId");
export const chapterId = params.get("chapterId");

let mangaCurrentPage = 0;
let mangaMaxPage = 0;
let mangaLinkFileArray = [];
let allChaptersInLanguage = [];
let isLoadingContext = true;

const slider = document.getElementById("manga-progress");
const tooltip = document.getElementById("slider-tooltip");
const gapDialog = document.getElementById("chapter-gap-dialog");
const imgElement = document.querySelector("#manga-page");

export async function initializeReader() {
  if (!mangaId || !chapterId) return;

  const data = await LayArrayHinhManga(mangaId, chapterId);
  if (data) {
    mangaMaxPage = data.MaxPage;
    mangaLinkFileArray = data.FileArray;
    initSlider(mangaMaxPage);
    CapNhatSliderVaCurTrang(0);
    HienTrangManga(0);
  }

  await LoadChapterContext();
  bindReaderEvents();
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

function GetNeighborChapterId(direction) {
  if (isLoadingContext) return "LOADING";

  const currentIndex = allChaptersInLanguage.findIndex((c) => c.id === chapterId);
  if (currentIndex === -1) return null;

  let targetIndex = currentIndex + direction;
  while (
    targetIndex >= 0 &&
    targetIndex < allChaptersInLanguage.length &&
    allChaptersInLanguage[targetIndex].chapter === allChaptersInLanguage[currentIndex].chapter
  ) {
    targetIndex += direction;
  }

  const neighbor = allChaptersInLanguage[targetIndex];
  if (!neighbor) return null;

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
  window.location.href = `doctruyen.html?mangaId=${mangaId}&chapterId=${newId}`;
}

function ChuyenVeTrangTiepTheo() {
  if (mangaCurrentPage < mangaMaxPage) {
    mangaCurrentPage++;
    HienTrangManga(mangaCurrentPage);
    CapNhatSliderVaCurTrang(mangaCurrentPage);
    return;
  }

  const nextId = GetNeighborChapterId(1);
  if (nextId === "LOADING") return;
  if (nextId && nextId !== "STOP_BY_GAP") {
    ChuyenHuongDenChapter(nextId);
  } else if (!nextId) {
    window.location.href = `manga.html?mangaId=${mangaId}`;
  }
}

function ChuyenVeTrangTruoc() {
  if (mangaCurrentPage > 0) {
    mangaCurrentPage--;
    HienTrangManga(mangaCurrentPage);
    CapNhatSliderVaCurTrang(mangaCurrentPage);
    return;
  }

  const prevId = GetNeighborChapterId(-1);
  if (prevId === "LOADING") return;
  if (prevId && prevId !== "STOP_BY_GAP") {
    ChuyenHuongDenChapter(prevId);
  }
}

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
  if (!slider) return;
  slider.min = 0;
  slider.max = maxPage;
  slider.value = 0;
}

function CapNhatSliderVaCurTrang(pageIndex) {
  if (!slider) return;
  slider.value = pageIndex;
  const percent = (pageIndex / slider.max) * 100 || 0;
  slider.style.setProperty("--value", `${percent}%`);
  tooltip.innerText = "Trang: " + (pageIndex + 1);

  const sliderWidth = slider.offsetWidth;
  const newPos = (percent / 100) * (sliderWidth - 15) + 7.5;
  tooltip.style.left = `${newPos}px`;

  const pageLabel = document.querySelector(".manga-sidebar-page-current");
  if (pageLabel) {
    pageLabel.textContent = `Page ${pageIndex + 1}/${mangaMaxPage + 1}`;
  }
}

function bindReaderEvents() {
  if (slider) {
    slider.addEventListener("input", function () {
      mangaCurrentPage = parseInt(this.value, 10);
      HienTrangManga(mangaCurrentPage);
      CapNhatSliderVaCurTrang(mangaCurrentPage);
      tooltip.classList.add("show");
      clearTimeout(tooltip.timer);
    });

    slider.addEventListener("change", () => {
      tooltip.timer = setTimeout(() => tooltip.classList.remove("show"), 800);
    });
  }

  document.querySelector("#prev-page")?.addEventListener("click", (e) => {
    e.preventDefault();
    ChuyenVeTrangTruoc();
  });

  document.querySelector("#next-page")?.addEventListener("click", (e) => {
    e.preventDefault();
    ChuyenVeTrangTiepTheo();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") ChuyenVeTrangTruoc();
    if (e.key === "ArrowRight") ChuyenVeTrangTiepTheo();
  });

  const gapCancel = document.getElementById("gap-cancel");
  const gapClose = document.getElementById("close-gap-x");
  const gapBackTitle = document.getElementById("gap-back-title");
  const mangaTitle = document.getElementById("manga-sidebar-name-manga");

  gapCancel?.addEventListener("click", () => gapDialog.close());
  gapClose?.addEventListener("click", () => gapDialog.close());
  gapBackTitle?.addEventListener("click", () => {
    window.location.href = `manga.html?mangaId=${mangaId}`;
  });
  mangaTitle?.addEventListener("click", () => {
    window.location.href = `manga.html?mangaId=${mangaId}`;
  });
}

function HienGapModal(from, to, nextId) {
  document.getElementById("gap-numbers").innerText = `${from} > ${to}`;
  gapDialog.showModal();
  document.getElementById("gap-continue").onclick = () => ChuyenHuongDenChapter(nextId);
}
