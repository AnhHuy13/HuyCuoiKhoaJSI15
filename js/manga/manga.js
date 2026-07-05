import { SetDataCarousel } from "./manga-carousel.js";

const params = new URLSearchParams(window.location.search);
let mangaId = params.get("mangaId");

window.addEventListener("DOMContentLoaded", () => {
  SetDataCarousel(mangaId);
});
