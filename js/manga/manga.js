import { SetDataCarousel } from "./manga-carousel.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";
import { SetDataMangaDetails, RenderChapterList } from "./manga-home.js";

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const mangaId = params.get("mangaId");
  if (!mangaId) return;

  const info = await LayThongTinManga(mangaId);
  if (info) {
    SetDataCarousel(info);
    SetDataMangaDetails(info);
    RenderChapterList(mangaId);
  }
});
