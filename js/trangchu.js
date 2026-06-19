const urlApi =
  "https://api.mangadex.org/manga?order[followedCount]=desc&year=2021&contentRating[]=safe&limit=5&includes[]=cover_art";

function testElement(selector) {
  var element = document.querySelector(selector);
  if (element === null) {
    console.error("!!!!!! Không tìm thấy phần tử: " + selector + " !!!!!!!!!");
    return {};
  }
  return element;
}

fetch(urlApi)
  .then((response) => response.json())
  .then((data) => {
    setCarouselData(data);
  })
  .catch((error) => {
    console.error("lỗi:", error);
  });

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

function setCarouselData(data) {
  const mangaArray = data?.data || [];

  mangaArray.forEach((mangaItem, index) => {
    generateMangaPage(index, mangaItem);
  });

  xuLyGiaoDienCarousel();
  const carouselElement = document.querySelector("#carouselExampleCaptions");
  const carousel = new bootstrap.Carousel(carouselElement, {
    interval: 2000,
    ride: "carousel",
  });
}

function generateMangaPage(pageIndex, mangaItem) {
  const container = document.querySelector("#carouselExampleCaptions .carousel-inner");
  const activeClass = pageIndex === 0 ? "active" : "";

  let nameTruyen = Object.values(mangaItem?.attributes?.title)[0];
  let descriptionTruyen = mangaItem?.attributes?.description?.en;
  let idTruyen = mangaItem?.id;
  const fileCoverTruyen = mangaItem?.relationships.find((item) => item.type === "cover_art")
    ?.attributes?.fileName;
  const linkCoverTruyen = "https://uploads.mangadex.org/covers/" + idTruyen + "/" + fileCoverTruyen;

  const pageHtml = `
    <div class="carousel-item ${activeClass}">
      <img src="${linkCoverTruyen}" class="d-block w-100" id="manga-carousel-background" alt="..." />
      <div class="carousel-caption d-none d-md-block">
        <h2 class="manga-carousel-popular-title">Manga mới nổi</h2>
        <img src="${linkCoverTruyen}" alt="" class="manga-carousel-cover" />
        <div class="manga-carousel-text-info">
          <h5 class="manga-carousel-title-manga">${nameTruyen}</h5>
          <ul class="manga-carousel-tag"></ul>
          <p class="manga-carousel-description">${descriptionTruyen}</p>
        </div>
      </div>
    </div>
  `;

  if (pageIndex === 0) container.innerHTML = "";
  container.insertAdjacentHTML("beforeend", pageHtml);

  const currentSlide = container.children[pageIndex];
  let ulElement = currentSlide.querySelector(".manga-carousel-tag");
  let fragment = document.createDocumentFragment();
  let tagsArray = mangaItem?.attributes?.tags || [];

  for (let tagItem of tagsArray) {
    let liElement = document.createElement("li");
    liElement.textContent = tagItem?.attributes?.name?.en;
    liElement.className = "manga-carousel-tag-item";
    fragment.appendChild(liElement);
  }
  ulElement.appendChild(fragment);
}
