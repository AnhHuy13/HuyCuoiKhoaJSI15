import { fitTextToBox, vietHoaChuCaiDauTien, changeStatusToColor } from "../helper/utility.js";

export function SetDataCarousel(info) {
  return new Promise((resolve) => {
    if (!info) {
      resolve();
      return;
    }

    const coverEl = document.querySelector(".manga-carousel-cover");
    const bgEl = document.querySelector(".manga-carousel-background");

    document.querySelector(".manga-carousel-title-manga").textContent = info.title;
    document.querySelector(".manga-carousel-title-english").textContent = info.englishTitle;
    document.querySelector(".manga-carousel-author").textContent = info.relations.author;

    const statusDot = document.querySelector(".manga-carousel-status-dot");
    if (statusDot) {
      statusDot.style.backgroundColor = changeStatusToColor(info.status);
    }

    document.querySelector(".manga-carousel-status").textContent =
      `Status: ${vietHoaChuCaiDauTien(info.status || "Unknown")}`;

    if (coverEl) coverEl.src = info.cover;
    if (bgEl) bgEl.src = info.cover;

    const ulElement = document.querySelector(".manga-carousel-tag");
    if (ulElement) {
      ulElement.innerHTML = info.tags
        .map(
          (tag) => `
            <li class="manga-carousel-tag-item">
              <a href="tag.html?tagId=${tag.id}" class="manga-carousel-tag-text-item text-decoration-none text-inherit">
                ${tag.attributes.name.en}
              </a>
            </li>`,
        )
        .join("");
    }

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

    const imagesToLoad = [];
    if (coverEl) imagesToLoad.push(coverEl);
    if (bgEl) imagesToLoad.push(bgEl);

    if (imagesToLoad.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = imagesToLoad.length;

    function onImageLoaded() {
      loadedCount++;
      if (loadedCount === totalImages) {
        resolve();
      }
    }

    imagesToLoad.forEach((img) => {
      if (img.complete) {
        onImageLoaded();
      } else {
        img.addEventListener("load", onImageLoaded);
        img.addEventListener("error", onImageLoaded);
      }
    });
  });
}
