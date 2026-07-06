import { SetDataCarousel } from "./manga-carousel.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";

const params = new URLSearchParams(window.location.search);
let mangaId = params.get("mangaId");

window.addEventListener("DOMContentLoaded", async () => {
  const info = await LayThongTinManga(mangaId);
  SetDataCarousel(info);
});
