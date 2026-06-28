import { LayMangaChoCarousel, LayLatestUpdate } from "./fetch.js";
import { ChuyenLocale } from "./utility.js";

window.history.scrollRestoration = "manual";

const THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO = 3000;

setData();

function testElement(selector) {
  var element = document.querySelector(selector);
  if (element === null) {
    console.error("Không tìm thấy phần tử: " + selector + " !!!!!!!!!");
    return {};
  }
  return element;
}

function xuLyGiaoDienCarousel() {
  var tatCaSlides = document.querySelectorAll("#carouselExampleCaptions .carousel-item");

  for (var slide of tatCaSlides) {
    var h5Title = slide.querySelector(".manga-carousel-title-manga");
    var pDesc = slide.querySelector(".manga-carousel-description");

    if (h5Title !== null && pDesc !== null) {
      var doDaiTen = h5Title.textContent.length;
      var soDongMax = 7;

      if (doDaiTen > 80) {
        h5Title.style.fontSize = "1.5rem";
        soDongMax = 3;
      } else if (doDaiTen > 45) {
        h5Title.style.fontSize = "1.65rem";
        soDongMax = 5;
      } else {
        soDongMax = 7;
      }

      pDesc.style.display = "-webkit-box";
      pDesc.style.webkitBoxOrient = "vertical";
      pDesc.style.webkitLineClamp = soDongMax.toString();
      pDesc.style.overflow = "hidden";
    }
  }
}

async function setData() {
  const mangaArray = await LayMangaChoCarousel(5);
  console.log(mangaArray);
  mangaArray.forEach((mangaItem, index) => {
    generateMangaPage(index, mangaItem);
  });

  xuLyGiaoDienCarousel();
  const carouselElement = document.querySelector("#carouselExampleCaptions");
  const carousel = new bootstrap.Carousel(carouselElement, {
    interval: THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO,
    ride: "carousel",
  });

  const lastestUpdateArray = await LayLatestUpdate(10);
  console.log(lastestUpdateArray);

  lastestUpdateArray.forEach((element) => {
    generateLatestUpdate(element);
  });
}

function generateMangaPage(pageIndex, mangaItem) {
  const container = document.querySelector("#carouselExampleCaptions .carousel-inner");
  const activeClass = pageIndex === 0 ? "active" : "";

  const cleanText = (text) => {
    const el = document.createElement("div");
    el.textContent = text || "";
    return el.innerHTML;
  };

  let nameTruyen = cleanText(mangaItem?.title);

  let descTruyen = cleanText(mangaItem?.desc);
  let flagTruyen = mangaItem?.originalLanguage;

  let linkCoverTruyen = mangaItem?.linkFileCover || "";

  const tempElement = document.createElement("div");
  tempElement.innerHTML = `
    <div class="carousel-item ${activeClass}">
      <img src="${linkCoverTruyen}" class="d-block w-100" id="manga-carousel-background" alt="..." />
      <div class="carousel-caption d-none d-md-block">
        <div class="manga-carousel-content-container">
          <div class="manga-carousel-cover-container">
            <img src="${linkCoverTruyen}" alt="" class="manga-carousel-cover" />
          </div>
          <div class="manga-carousel-text-info">
            <div class="manga-carousel-title-container">
              <span class="flag-icon flag-icon-${flagTruyen}" id="flag-icon"></span>
              <h5 class="manga-carousel-title-manga">${nameTruyen}</h5>
            </div>
            <ul class="manga-carousel-tag"></ul>
            <p class="manga-carousel-description">${descTruyen}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const currentSlide = tempElement.firstElementChild;

  let ulElement = currentSlide.querySelector(".manga-carousel-tag");
  let fragment = document.createDocumentFragment();
  let tagsArray = mangaItem?.tags || [];

  for (let tagItem of tagsArray) {
    let liElement = document.createElement("li");
    liElement.textContent = tagItem?.attributes?.name?.en;
    liElement.className = "manga-carousel-tag-item";
    fragment.appendChild(liElement);
  }
  ulElement.appendChild(fragment);

  if (pageIndex === 0) container.innerHTML = "";
  container.appendChild(currentSlide);
}

function generateLatestUpdate(mangaItem) {
  const container = document.querySelector(".lastest-update-container");

  const cleanText = function (text) {
    const el = document.createElement("div");
    el.textContent = text || "";
    return el.innerHTML;
  };

  const nameTruyen = cleanText(mangaItem.titleManga) || "Không có tên truyện";
  const descTruyen = cleanText(
    `${mangaItem.volumeChapterStr || ""} - ${mangaItem.titleChapter || ""}`,
  );
  const translatedLanguage = mangaItem.translatedLanguage;
  const scanlationGroup = mangaItem.scanlationGroup || "Unknown";
  const linkCoverTruyen = mangaItem.coverUrl || "";

  const myTemplate = `
    <div class="lastest-update-item">
      <img src="${linkCoverTruyen}" alt="Cover" />
      <div class="lastest-update-item-content">
        <h6>${nameTruyen}</h6>
        <div class="lastest-update-locale-volume">
          <span class="fi fi-${translatedLanguage}" id="flag-icon-locale-lastest-update"></span>
          <p class="lastest-update-vol-chap">${descTruyen}</p>
        </div>
        <p class="lastest-update-scanlation-group">${scanlationGroup}</p>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", myTemplate);
}
