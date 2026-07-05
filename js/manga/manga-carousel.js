import { fitTextToBox } from "../utility.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";

export async function SetDataCarousel(mangaId) {
  const info = await LayThongTinManga(mangaId);

  const nameManga = info?.title;
  const nameEngManga = info?.englishTitle;
  const nameAuthor = info?.author;
  const linkCoverTruyen = info?.cover;
  const tagsArray = info?.tags || [];

  document.querySelector(".manga-carousel-title-manga").textContent = nameManga;
  document.querySelector(".manga-carousel-title-english").textContent = nameEngManga;
  document.querySelector(".manga-carousel-author").textContent = nameAuthor;
  document.querySelector(".manga-carousel-cover").src = linkCoverTruyen;
  document.querySelector(".manga-carousel-background").src = linkCoverTruyen;

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

  const titleEl = carouselTitleBox?.firstElementChild;
  const engTitleEl = carouselEngTitleBox?.firstElementChild;
  if (titleEl && engTitleEl) {
    const titleSize = parseFloat(getComputedStyle(titleEl).fontSize);
    const engSize = parseFloat(getComputedStyle(engTitleEl).fontSize);

    if (titleSize < engSize + 6) {
      titleEl.style.fontSize = `${engSize + 6}px`;
    }
  }

  const ulElement = document.querySelector(".manga-carousel-tag");
  ulElement.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (const tag of tagsArray) {
    const liElement = document.createElement("li");
    liElement.textContent = tag?.name;
    liElement.className = "manga-carousel-tag-item";
    fragment.appendChild(liElement);
  }
  ulElement.appendChild(fragment);
}
