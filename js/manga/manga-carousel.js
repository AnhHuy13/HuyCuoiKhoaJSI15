import { fitTextToBox, vietHoaChuCaiDauTien, changeStatusToColor } from "../utility.js";

export function SetDataCarousel(info) {
  if (!info) return;

  document.querySelector(".manga-carousel-title-manga").textContent = info.title;
  document.querySelector(".manga-carousel-title-english").textContent = info.englishTitle;
  document.querySelector(".manga-carousel-author").textContent = info.relations.author;
  document.querySelector(".manga-carousel-status-dot").style.backgroundColor = changeStatusToColor(
    info.status,
  );
  document.querySelector(".manga-carousel-status").textContent =
    `Status: ${vietHoaChuCaiDauTien(info.status || "Unknown")}`;
  document.querySelector(".manga-carousel-cover").src = info.cover;
  document.querySelector(".manga-carousel-background").src = info.cover;

  // Render Tags trên Carousel
  const ulElement = document.querySelector(".manga-carousel-tag");
  ulElement.innerHTML = info.tags
    .map((tag) => `<li class="manga-carousel-tag-item">${tag.attributes.name.en}</li>`)
    .join("");

  // Resize Title
  fitTextToBox(".manga-carousel-title-manga-box", null, true, {
    minSize: 18,
    maxSize: 36,
    maxHeight: 80,
  });
  fitTextToBox(".manga-carousel-title-english-box", null, true, {
    minSize: 13,
    maxSize: 22,
    maxHeight: 60,
  });
}
