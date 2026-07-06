import { fitTextToBox, vietHoaChuCaiDauTien } from "../utility.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

export async function SetDataCarousel(info) {
  if (!info) return;

  // Destructure để code nhìn sạch hơn hẳn
  const { title, englishTitle, relations, cover, status, tags, desc } = info;

  // Logic màu sắc status
  const statusColors = {
    ongoing: "rgb(0, 128, 0)",
    completed: "rgb(0, 128, 0)",
    hiatus: "rgb(255, 165, 0)",
    cancelled: "rgb(255, 0, 0)",
    default: "rgb(128, 128, 128)",
  };
  const colorStatusDot = statusColors[status] || statusColors.default;

  // Cập nhật các thành phần cơ bản
  document.querySelector(".manga-carousel-title-manga").textContent = title;
  document.querySelector(".manga-carousel-title-english").textContent = englishTitle;
  document.querySelector(".manga-carousel-author").textContent = relations?.author || "Unknown";
  document.querySelector(".manga-carousel-status-dot").style.backgroundColor = colorStatusDot;
  document.querySelector(".manga-carousel-status").textContent =
    `Status: ${vietHoaChuCaiDauTien(status || "Unknown")}`;
  document.querySelector(".manga-carousel-cover").src = cover;
  document.querySelector(".manga-carousel-background").src = cover;
  document.querySelector(".manga-desc").innerHTML = marked.parse(desc || "");

  // Xử lý font-size thông minh
  const carouselTitleBox = document.querySelector(".manga-carousel-title-manga-box");
  const carouselEngTitleBox = document.querySelector(".manga-carousel-title-english-box");

  fitTextToBox(carouselTitleBox, null, true, {
    minSize: 18,
    maxSize: 36,
    maxHeight: 80,
    lineHeight: 1.1,
    scale: 1,
  });
  fitTextToBox(carouselEngTitleBox, null, true, {
    minSize: 13,
    maxSize: 22,
    maxHeight: 60,
    lineHeight: 1.2,
    scale: 1,
  });

  // Đảm bảo title chính không bao giờ nhỏ hơn title phụ
  const titleEl = carouselTitleBox?.firstElementChild;
  const engTitleEl = carouselEngTitleBox?.firstElementChild;
  if (titleEl && engTitleEl) {
    const titleSize = parseFloat(getComputedStyle(titleEl).fontSize);
    const engSize = parseFloat(getComputedStyle(engTitleEl).fontSize);
    if (titleSize < engSize + 6) titleEl.style.fontSize = `${engSize + 6}px`;
  }

  // Render danh sách tags
  const ulElement = document.querySelector(".manga-carousel-tag");
  ulElement.innerHTML = "";
  const fragment = document.createDocumentFragment();
  (tags || []).forEach((tag) => {
    const liElement = document.createElement("li");
    liElement.textContent = tag.name;
    liElement.className = "manga-carousel-tag-item";
    fragment.appendChild(liElement);
  });
  ulElement.appendChild(fragment);
}
