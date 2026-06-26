// Test file này thì vào Url (có thể cần chạy trên liveserver)
// http://localhost:5500/html/doctruyen.html?mangaId=418791c0-35cf-4f87-936b-acd9cddf0989&chapterId=553d4bab-1b8c-4dea-953a-90e76e3acfe4
//
// Nội dung phải hiện:
// Tên Manga: Hoa Thơm Kiêu Hãnh
// Tên Chapter: Tương Lai Của Kaoruko
// Tên nhóm dịch: IVM

import { LayArrayHinhManga } from "../fetch.js";

const params = new URLSearchParams(window.location.search);
let mangaId = params.get("mangaId");
let chapterId = params.get("chapterId");
let mangaCurrentPage = 0;
let mangaMaxPage = 0;
let mangaLinkFileArray;

const slider = document.getElementById("manga-progress");
const tooltip = document.getElementById("slider-tooltip");

function initSlider(maxPage) {
  slider.min = 0;
  slider.max = maxPage;
  slider.value = 0;
}

function HienTooltip() {
  if (tooltip.timer) clearTimeout(tooltip.timer);
  tooltip.classList.add("show");
}

function DelayAnTooltip() {
  tooltip.timer = setTimeout(() => {
    tooltip.classList.remove("show");
  }, 500);
}

function CapNhatSliderVaCurTrang(pageIndex) {
  slider.value = pageIndex;

  const percent = (slider.value - slider.min) / (slider.max - slider.min) || 0;
  slider.style.setProperty("--value", percent * 100 + "%");

  tooltip.innerText = "Trang: " + (pageIndex + 1);

  const sliderWidth = slider.offsetWidth;
  const thumbWidth = 15;
  const newPos = percent * (sliderWidth - thumbWidth) + thumbWidth / 2;

  tooltip.style.left = newPos + "px";

  document.querySelector(".manga-sidebar-page-current").textContent =
    `Page ${mangaCurrentPage}/${mangaMaxPage}`;
}

slider.addEventListener("input", function () {
  mangaCurrentPage = parseInt(this.value);
  HienTrangManga(mangaCurrentPage, mangaLinkFileArray);

  HienTooltip();
  CapNhatSliderVaCurTrang(mangaCurrentPage);
});

slider.addEventListener("change", () => {
  DelayAnTooltip();
});

Initial();

async function Initial() {
  if (mangaId && chapterId) {
    const data = await LayArrayHinhManga(mangaId, chapterId);

    if (data) {
      console.log(data);

      mangaMaxPage = data?.MaxPage;
      document.querySelector(".manga-sidebar-page-current").textContent =
        `Page ${mangaCurrentPage}/${mangaMaxPage}`;
      mangaLinkFileArray = data?.FileArray;

      initSlider(mangaMaxPage);
      CapNhatSliderVaCurTrang(mangaCurrentPage);
      HienTrangManga(mangaCurrentPage, mangaLinkFileArray);
    }
  }
}

function HienTrangManga(page, linkFileArray) {
  const img = document.querySelector("#manga-page");
  try {
    img.src = linkFileArray[page];
    img.alt = `Trang ${page + 1}`;
  } catch (err) {
    console.error("Lỗi!! :" + err);
  }
}

const prevPageBtn = document.querySelector("#prev-page");
const nextPageBtn = document.querySelector("#next-page");

function ChuyenVeTrangTruoc() {
  console.log("Trang hiện tại: " + mangaCurrentPage);
  if (mangaCurrentPage > 0) {
    mangaCurrentPage--;
    HienTrangManga(mangaCurrentPage, mangaLinkFileArray);

    CapNhatSliderVaCurTrang(mangaCurrentPage);
    HienTooltip();
    DelayAnTooltip();
  }
}

function ChuyenVeTrangTiepTheo() {
  console.log("Trang hiện tại: " + mangaCurrentPage);
  if (mangaCurrentPage < mangaMaxPage) {
    mangaCurrentPage++;
    HienTrangManga(mangaCurrentPage, mangaLinkFileArray);

    CapNhatSliderVaCurTrang(mangaCurrentPage);
    HienTooltip();
    DelayAnTooltip();
  }
}

prevPageBtn.addEventListener("click", function (e) {
  e.preventDefault();
  ChuyenVeTrangTruoc();
});

window.addEventListener("keydown", function (e) {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    ChuyenVeTrangTruoc();
  }
});

nextPageBtn.addEventListener("click", function (e) {
  e.preventDefault();
  ChuyenVeTrangTiepTheo();
});

window.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    ChuyenVeTrangTiepTheo();
  }
});
