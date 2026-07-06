import { ChuyenLocale, vietHoaChuCaiDauTien } from "../utility.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { LayThongTinManga } from "../fetch/fetchMangaPage.js";
import { SetDataCarousel } from "./manga-carousel.js";

const LINK_CONFIG = {
  raw: { label: "Official Raw", domain: "mangadex.org" },
  en: { label: "Official English", domain: "mangaplus.shueisha.co.jp" },
  bw: { label: "BookWalker", domain: "bookwalker.jp" },
  amz: { label: "Amazon", domain: "amazon.co.jp" },
  ebj: { label: "eBookJapan", domain: "ebookjapan.yahoo.co.jp" },
  mal: { label: "MyAnimeList", domain: "myanimelist.net" },
  al: { label: "AniList", domain: "anilist.co" },
  mu: { label: "MangaUpdates", domain: "mangaupdates.com" },
  ap: { label: "Anime-Planet", domain: "anime-planet.com" },
  kt: { label: "Kitsu", domain: "kitsu.io" },
};

export function SetDataMangaDetails(info) {
  if (!info) return;

  // 1. Description (70%)
  document.querySelector(".manga-desc").innerHTML = marked.parse(info.desc || "");

  // 2. Sidebar (30%)
  const genres = info.tags
    .filter((t) => t.attributes.group === "genre")
    .map((t) => t.attributes.name.en);
  const themes = info.tags
    .filter((t) => t.attributes.group === "theme")
    .map((t) => t.attributes.name.en);

  const sidebar = document.querySelector(".manga-sidebar");
  sidebar.innerHTML = `
    <div class="sidebar-section row mb-4">
      <div class="col-6"><h6>Author</h6><span class="manga-badge-dark">${info.relations.author}</span></div>
      <div class="col-6"><h6>Artist</h6><span class="manga-badge-dark">${info.relations.artist}</span></div>
    </div>

    <div class="sidebar-section mb-4">
      <div class="row">
        <div class="col-6"><h6>Genres</h6><div class="d-flex flex-wrap gap-1">${genres.map((g) => `<span class="manga-badge-dark">${g}</span>`).join("")}</div></div>
        <div class="col-6"><h6>Themes</h6><div class="d-flex flex-wrap gap-1">${themes.map((t) => `<span class="manga-badge-dark">${t}</span>`).join("")}</div></div>
      </div>
    </div>

    <div class="mb-4"><h6>Demographic</h6><span class="manga-badge-dark">${vietHoaChuCaiDauTien(info.demographic || "None")}</span></div>

    <div class="mb-4">
      <h6>Read or Buy</h6>
      <div class="d-flex flex-wrap gap-2">${renderExternalButtons(info.externalLinks, ["raw", "en", "bw", "amz", "ebj"])}</div>
    </div>

    <div class="mb-4">
      <h6>Track</h6>
      <div class="d-flex flex-wrap gap-2">${renderExternalButtons(info.externalLinks, ["mal", "al", "mu", "ap", "kt"])}</div>
    </div>

    <div class="mt-4">
      <h6>Alternative Titles</h6>
      <div class="alt-titles-list">
        ${info.altTitles
          .map((t) => {
            const lang = Object.keys(t)[0];
            return `<div class="alt-item"><span class="fi fi-${ChuyenLocale(lang)}"></span><span class="alt-text">${t[lang]}</span></div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderExternalButtons(links, keys) {
  return keys
    .filter((k) => links[k])
    .map((k) => {
      const config = LINK_CONFIG[k] || { label: k, domain: "google.com" };
      return `
      <a href="${links[k]}" target="_blank" class="btn-ext">
        <img src="https://icons.duckduckgo.com/ip3/${config.domain}.ico" alt="icon">
        <span>${config.label}</span>
      </a>`;
    })
    .join("");
}

// Logic khởi chạy khi load trang
window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const mangaId = params.get("mangaId");
  if (!mangaId) return;

  const info = await LayThongTinManga(mangaId);
  SetDataCarousel(info);
  SetDataMangaDetails(info);
});
