import { LayMangaChoCarousel } from "./fetch.js";
import { ChuyenLocale } from "./utility.js";

const THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO = 3000;

setCarouselData();

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

      if (doDaiTen > 45) {
        h5Title.style.fontSize = "1.65rem";
        soDongMax = 5;
      } else if (doDaiTen > 80) {
        h5Title.style.fontSize = "1.5rem";
        soDongMax = 3;
      }

      pDesc.style.display = "-webkit-box";
      pDesc.style.webkitBoxOrient = "vertical";
      pDesc.style.webkitLineClamp = soDongMax.toString();
      pDesc.style.overflow = "hidden";
    }
  }
}

async function setCarouselData() {
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
}

function generateMangaPage(pageIndex, mangaItem) {
  const container = document.querySelector("#carouselExampleCaptions .carousel-inner");
  const activeClass = pageIndex === 0 ? "active" : "";

  let nameTruyen = mangaItem?.title;
  let descTruyen = mangaItem?.desc;
  let linkCoverTruyen = mangaItem?.linkFileCover;
  let flagTruyen = mangaItem?.originalLanguage;

  const pageHtml = `
    <div class="carousel-item ${activeClass}">
            <img
              src="${linkCoverTruyen}"
              class="d-block w-100"
              id="manga-carousel-background"
              alt="..."
            />

            <div class="carousel-caption d-none d-md-block">
              <div class="manga-carousel-content-container">
              <div class="manga-carousel-cover-container">
                <img src="${linkCoverTruyen}" alt="" class="manga-carousel-cover" />
              </div>

              <div class="manga-carousel-text-info">
                <div class="manga-carousel-title-container">
                  <span class="flag-icon flag-icon-${ChuyenLocale(flagTruyen)}" id="flag-icon"></span>
                  <h5 class="manga-carousel-title-manga">
                    ${nameTruyen}
                  </h5>
                </div>
                <ul class="manga-carousel-tag"></ul>

                <p class="manga-carousel-description">
                  ${descTruyen}
                </p>
              </div>
              </div>
            </div>
          </div>
  `;

  if (pageIndex === 0) container.innerHTML = "";
  container.insertAdjacentHTML("beforeend", pageHtml);

  const currentSlide = container.children[pageIndex];
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
}
