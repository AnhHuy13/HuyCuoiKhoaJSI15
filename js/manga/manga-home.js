import { ChuyenLocale, vietHoaChuCaiDauTien } from "../helper/utility.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { LayThongTinManga, LayDanhSachChapter } from "../fetch/fetchMangaPage.js";
import { initLanguageSelector, filterByLanguage } from "../doctruyen/locLangDocTruyen.js";
import { layCache, luuCache } from "../helper/cacheHelper.js";

const LINK_CONFIG = {
  raw: { label: "Official Raw", domain: "mangadex.org" },
  en: { label: "Official English", domain: "mangaplus.shueisha.co.jp" },
  bw: { label: "BookWalker", domain: "bookwalker.jp" },
  amz: { label: "Amazon", domain: "amazon.co.jp" },
  ebj: { label: "eBookJapan", domain: "ebookjapan.yahoo.co.jp" },
  mal: { label: "MyAnimeList", domain: "myanimelist.net" },
  al: { label: "AniList", domain: "anilist.co" },
  mu: { label: "MangaUpdates", domain: "www.mangaupdates.com" },
  ap: { label: "Anime-Planet", domain: "www.anime-planet.com" },
  kt: { label: "Kitsu", domain: "kitsu.io" },
};

const CACHE_TTL_CHAPTERS_MS = 15 * 60 * 1000; // Cache danh sách chương trong 15 phút
let currentOffset = 0;
const limit = 50;
let currentOrder = "desc";
let listenersAttached = false;

export async function RenderChapterList(mangaId) {
  // Tạo khoá cache động dựa trên mangaId, offset, limit và cách sắp xếp
  const cacheKey = `cache_chapters_${mangaId}_offset_${currentOffset}_limit_${limit}_order_${currentOrder}`;
  let response = layCache(cacheKey, CACHE_TTL_CHAPTERS_MS);

  if (!response) {
    response = await LayDanhSachChapter(mangaId, currentOffset, limit, currentOrder);
    if (response) {
      luuCache(cacheKey, response);
    }
  }

  if (!response) return;

  const { total, groupedData } = response;
  const container = document.getElementById("chapter-list-container");
  if (!container) return;

  const uniqueCountries = new Set();
  Object.values(groupedData).forEach((vol) => {
    Object.values(vol).forEach((versions) => {
      versions.forEach((v) => {
        if (v.countryCode) uniqueCountries.add(v.countryCode);
      });
    });
  });

  initLanguageSelector(uniqueCountries, async () => {
    currentOffset = 0;
    await RenderChapterList(mangaId);
  });

  const sortText = document.getElementById("sort-text");
  const sortIcon = document.getElementById("sort-icon");
  if (sortText) {
    sortText.textContent = currentOrder === "desc" ? "Descending" : "Ascending";
  }
  if (sortIcon) {
    sortIcon.className = currentOrder === "desc" ? "bi bi-sort-down" : "bi bi-sort-up";
  }

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(currentOffset / limit) + 1;

  const pageInfo = document.getElementById("page-info");
  if (pageInfo) {
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
  }

  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  if (btnPrev) {
    btnPrev.disabled = currentOffset === 0;
  }
  if (btnNext) {
    btnNext.disabled = currentOffset + limit >= total;
  }

  let html = ``;

  const sortedVolumes = Object.keys(groupedData).sort((a, b) => {
    if (a === "No Volume") return 1;
    if (b === "No Volume") return -1;
    return currentOrder === "desc" ? parseFloat(b) - parseFloat(a) : parseFloat(a) - parseFloat(b);
  });

  for (const vol of sortedVolumes) {
    const chaptersInVol = groupedData[vol];
    let volHtml = "";
    let hasChaptersInVol = false;

    const sortedChapterNums = Object.keys(chaptersInVol).sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return currentOrder === "desc" ? numB - numA : numA - numB;
    });

    for (const chapNum of sortedChapterNums) {
      const versions = chaptersInVol[chapNum];
      const filteredVersions = filterByLanguage(versions);
      if (filteredVersions.length === 0) continue;

      hasChaptersInVol = true;
      if (filteredVersions.length === 1) {
        volHtml += renderChapterRow(filteredVersions[0], false, false, mangaId);
      } else {
        volHtml += `
          <div class="chapter-group-wrapper is-open"> 
            <div class="chapter-row group-parent">
               <div class="chap-info">
                  <i class="bi bi-eye"></i>
                  <span class="chap-num">Chapter ${chapNum}</span>
               </div>
            </div>
            <div class="chapter-subs">
               ${filteredVersions
                 .map((v, index) =>
                   renderChapterRow(v, true, index === filteredVersions.length - 1, mangaId),
                 )
                 .join("")}
            </div>
          </div>`;
      }
    }

    if (hasChaptersInVol) {
      html += `<div class="volume-header"><span>${vol === "No Volume" ? "No Volume" : "Volume " + vol}</span></div>`;
      html += volHtml;
    }
  }

  container.innerHTML = html;
  attachEventListeners(mangaId);
}

function renderChapterRow(v, isSubRow, isLastSub = false, mangaId) {
  const readUrl = `doctruyen.html?mangaId=${mangaId}&chapterId=${v.id}`;

  return `
    <a href="${readUrl}" class="chapter-row ${isSubRow ? "sub-row" : ""} ${isLastSub ? "last-sub" : ""}">
      <div class="chap-info">
        <i class="bi bi-eye-fill"></i>
        <span class="fi fi-${v.countryCode}"></span>
        <div class="chap-text-box">
            <span class="chap-main-text"><b>Ch. ${v.chapter}</b> ${v.title ? "- " + v.title : ""}</span>
        </div>
      </div>
      <div class="chap-meta">
        <span class="meta-item"><i class="bi bi-people-fill"></i> ${v.groupName}</span>
        <span class="meta-item uploader"><i class="bi bi-person-fill"></i> ${v.uploader}</span>
      </div>
      <div class="chap-time">
        <span class="meta-item"><i class="bi bi-clock-fill"></i> ${v.publishDate}</span>
      </div>
    </a>`;
}

function attachEventListeners(mangaId) {
  if (listenersAttached) return;

  const btnSort = document.getElementById("btn-toggle-sort");
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");

  if (btnSort) {
    btnSort.addEventListener("click", async () => {
      currentOrder = currentOrder === "desc" ? "asc" : "desc";
      currentOffset = 0;
      console.log("Đang đổi thứ tự sang:", currentOrder);
      await RenderChapterList(mangaId);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", async () => {
      if (currentOffset > 0) {
        currentOffset -= limit;
        await RenderChapterList(mangaId);
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", async () => {
      currentOffset += limit;
      await RenderChapterList(mangaId);
    });
  }

  listenersAttached = true;
}

export function SetDataMangaDetails(info) {
  if (!info) return;

  document.querySelector(".manga-desc").innerHTML = marked.parse(info.desc || "");

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
      const rawLink = links[k];
      const href =
        typeof rawLink === "string" && rawLink.match(/^https?:\/\//i)
          ? rawLink
          : `https://${rawLink.replace(/^\/\//, "")}`;

      return `
      <a href="${href}" target="_blank" rel="noopener noreferrer" class="btn-ext">
        <img src="https://icons.duckduckgo.com/ip3/${config.domain}.ico" alt="icon">
        <span>${config.label}</span>
      </a>`;
    })
    .join("");
}
