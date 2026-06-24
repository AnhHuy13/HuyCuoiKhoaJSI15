const params = new URLSearchParams(window.location.search);
let mangaId = params.get("mangaId");
let chapterId = params.get("chapterId");
let mangaCurrentPage = 0;
let mangaMaxPage = 0;
let mangaLinkFileArray;

if (mangaId && chapterId) {
  LayArrayHinhManga(mangaId, chapterId);
}

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

function CapNhatSlider(pageIndex) {
  slider.value = pageIndex;

  const percent = (slider.value - slider.min) / (slider.max - slider.min) || 0;
  slider.style.setProperty("--value", percent * 100 + "%");

  tooltip.innerText = "Trang: " + (pageIndex + 1);

  const sliderWidth = slider.offsetWidth;
  const thumbWidth = 15;
  const newPos = percent * (sliderWidth - thumbWidth) + thumbWidth / 2;

  tooltip.style.left = newPos + "px";
}

slider.addEventListener("input", function () {
  mangaCurrentPage = parseInt(this.value);
  HienTrangManga(mangaCurrentPage, mangaLinkFileArray);

  HienTooltip();
  CapNhatSlider(mangaCurrentPage);
});

slider.addEventListener("change", () => {
  DelayAnTooltip();
});

async function LayArrayHinhManga(mangaId, chapterId) {
  try {
    const response = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    const result = await response.json();
    console.log(result);

    mangaLinkFileArray = DoiThanhMangaLinkFileArray(
      result?.baseUrl,
      result?.chapter?.hash,
      result?.chapter?.data,
    );

    console.table(mangaLinkFileArray);

    mangaMaxPage = result?.chapter?.data.length - 1;
    console.log(mangaMaxPage);
    initSlider(mangaMaxPage);
    CapNhatSlider(mangaCurrentPage);
    HienTrangManga(mangaCurrentPage, mangaLinkFileArray);

    HienTrangManga(mangaCurrentPage, mangaLinkFileArray);
  } catch (err) {
    console.log("Đã có lỗi!!! : " + err);
  }
}

function DoiThanhMangaLinkFileArray(baseUrl, hash, fileArray) {
  if (!fileArray || !hash || !baseUrl) return [];
  return fileArray.map((filename) => `${baseUrl}/data/${hash}/${filename}`);
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

    CapNhatSlider(mangaCurrentPage);
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

function ChuyenVeTrangTiepTheo() {
  console.log("Trang hiện tại: " + mangaCurrentPage);
  if (mangaCurrentPage < mangaMaxPage) {
    mangaCurrentPage++;
    HienTrangManga(mangaCurrentPage, mangaLinkFileArray);

    CapNhatSlider(mangaCurrentPage);
    HienTooltip();
    DelayAnTooltip();
  }
}

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
