export function xuLyGiaoDienCarousel() {
  var tatCaSlides = document.querySelectorAll("#carouselExampleCaptions .carousel-item");

  for (var slide of tatCaSlides) {
    var h5Title = slide.querySelector(".home-carousel-title-manga");
    var pDesc = slide.querySelector(".home-carousel-description");

    if (h5Title !== null && pDesc !== null) {
      var doDaiTen = h5Title.textContent.length;
      var soDongMax = 7;

      if (doDaiTen > 80) {
        h5Title.style.fontSize = "1.5rem";
        soDongMax = 3;
      } else if (doDaiTen > 45) {
        h5Title.style.fontSize = "1.65rem";
        soDongMax = 5;
      } else if (doDaiTen > 25) {
        h5Title.style.fontSize = "1.73rem";
        soDongMax = 6;
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

export function generateMangaPage(pageIndex, mangaItem) {
  const container = document.querySelector("#carouselExampleCaptions .carousel-inner");
  const activeClass = pageIndex === 0 ? "active" : "";

  const cleanText = (text) => {
    const el = document.createElement("div");
    el.textContent = text || "";
    return el.innerHTML;
  };

  let nameTruyen = cleanText(mangaItem?.title);
  let idTruyen = mangaItem?.id;

  let descTruyen = cleanText(mangaItem?.desc);
  let flagTruyen = mangaItem?.originalLanguage;

  let linkCoverTruyen = mangaItem?.linkFileCover || "";
  const tempElement = document.createElement("div");
  tempElement.innerHTML = `
  <div class="carousel-item ${activeClass}">
    <img src="${linkCoverTruyen}" class="d-block w-100" id="home-carousel-background" alt="..." />
    <div class="carousel-caption">
      <!-- Changed from a <div> with onclick to an <a> tag -->
      <a class="home-carousel-content-container" href="../../html/manga.html?mangaId=${idTruyen}">
        <div class="home-carousel-cover-container">
          <img src="${linkCoverTruyen}" alt="" class="home-carousel-cover" />
        </div>
        <div class="home-carousel-text-info">
          <div class="home-carousel-title-container">
            <span class="flag-icon flag-icon-${flagTruyen}" id="flag-icon"></span>
            <h5 class="home-carousel-title-manga">${nameTruyen}</h5>
          </div>
          <ul class="home-carousel-tag"></ul>
          <p class="home-carousel-description">${descTruyen}</p>
        </div>
      </a>
    </div>
  </div>
`;

  const currentSlide = tempElement.firstElementChild;

  let ulElement = currentSlide.querySelector(".home-carousel-tag");
  let fragment = document.createDocumentFragment();
  let tagsArray = mangaItem?.tags || [];

  for (let tagItem of tagsArray) {
    let aElement = document.createElement("a");

    aElement.textContent = tagItem?.attributes?.name?.en;
    aElement.className = "home-carousel-tag-item";

    const tagId = tagItem?.id || "";
    aElement.href = `../../html/tag.html?tagId=${tagId}`;

    fragment.appendChild(aElement);
  }

  ulElement.appendChild(fragment);

  if (pageIndex === 0) container.innerHTML = "";
  container.appendChild(currentSlide);
}
