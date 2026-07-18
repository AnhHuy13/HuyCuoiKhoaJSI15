import { state } from "./readerState.js";

const viewer = document.getElementById("manga-viewer");
const pageContainer = document.getElementById("manga-page-container");
const sliderWrapper = document.getElementById("slider-wrapper");
const slider = document.getElementById("manga-progress");
const tooltip = document.getElementById("slider-tooltip");

// Khởi tạo toàn bộ DOM hình ảnh một lần duy nhất
export function FirstRender(onNextChapterClick) {
  if (!viewer) return;
  viewer.innerHTML =
    state.mangaLinkFileArray
      .map(
        (url, index) =>
          `<img src="${url}" class="reader-image" data-index="${index}" loading="lazy" alt="Page ${index + 1}" />`,
      )
      .join("") +
    `<button class="webtoon-next-chapter-btn" id="webtoon-next-chap-btn">Chuyển sang chương kế tiếp</button>`;

  document.getElementById("webtoon-next-chap-btn")?.addEventListener("click", onNextChapterClick);
}

// Thay đổi giao diện tương ứng với chế độ đọc (Webtoon / Paginated)
export function RenderViewer() {
  if (sliderWrapper) {
    sliderWrapper.style.display = "flex";
  }

  if (state.currentMode === "webtoon") {
    pageContainer.classList.add("webtoon-active");
    viewer.className = "manga-viewer-webtoon";

    viewer.querySelectorAll(".reader-image").forEach((img) => img.classList.remove("active"));

    initSlider(state.mangaMaxPage);

    // Đồng bộ cuộn màn hình đến vị trí trang hiện tại
    const targetImg = viewer.querySelector(`.reader-image[data-index="${state.mangaCurrentPage}"]`);
    if (targetImg) {
      const containerOffset = viewer.getBoundingClientRect().top;
      const imgOffset = targetImg.getBoundingClientRect().top;
      const absoluteImgTop = imgOffset - containerOffset + viewer.scrollTop;
      viewer.scrollTo({ top: absoluteImgTop, behavior: "auto" });
    }
    CapNhatSliderVaCurTrang(state.mangaCurrentPage);
  } else {
    pageContainer.classList.remove("webtoon-active");
    viewer.className = "manga-viewer-paginated";

    initSlider(state.mangaMaxPage);
    HienTrangManga(state.mangaCurrentPage);
    CapNhatSliderVaCurTrang(state.mangaCurrentPage);
  }
}

// Xử lý hiển thị ảnh đơn và tự động nhận diện tỷ lệ ảnh để chuyển sang chế độ dọc
export async function HienTrangManga(page) {
  const images = viewer.querySelectorAll(".reader-image");
  if (images.length === 0) return;

  images.forEach((img, index) => {
    if (index === page) {
      img.classList.add("active");

      const userChoice = localStorage.getItem("manga_reading_mode") || "auto";
      if (userChoice === "auto") {
        const checkRatio = () => {
          const ratio = img.naturalHeight / img.naturalWidth;
          if (ratio > 1.6 && state.currentMode !== "webtoon") {
            console.log(`Phát hiện ảnh dọc tỷ lệ ${ratio.toFixed(2)}. Tự chuyển chế độ Webtoon.`);
            state.currentMode = "webtoon";
            RenderViewer();
          }
        };
        if (img.complete) {
          checkRatio();
        } else {
          img.onload = checkRatio;
        }
      }
    } else {
      img.classList.remove("active");
    }
  });
}

export function initSlider(maxPage) {
  if (!slider) return;
  slider.min = 0;
  slider.max = maxPage;
}

// Đồng bộ hóa giá trị của thanh trượt tiến trình với số trang hiện tại
export function CapNhatSliderVaCurTrang(pageIndex) {
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
    pageLabel.textContent = `Page ${pageIndex + 1}/${state.mangaMaxPage + 1}`;
  }
}
