import { ChuyenLocale, vietHoaChuCaiDauTien } from "../helper/utility.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { LayThongTinManga, LayDanhSachChapter } from "../fetch/fetchMangaPage.js";
import { initLanguageSelector, filterByLanguage } from "../doctruyen/locLangDocTruyen.js";
import { layCache, luuCache } from "../helper/cacheHelper.js";

const LINK_CONFIG = {
  raw: { label: "Official Raw", domain: "mangadex.org" },
  engtl: { label: "Official English", domain: "mangaplus.shueisha.co.jp" },
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
  const cacheKey = `cache_chapters_v3_${mangaId}_offset_${currentOffset}_limit_${limit}_order_${currentOrder}`;
  let response = layCache(cacheKey, CACHE_TTL_CHAPTERS_MS);

  if (!response) {
    response = await LayDanhSachChapter(mangaId, currentOffset, limit, currentOrder);
    if (response && response.groupedData) {
      luuCache(cacheKey, response);
    }
  }

  if (!response || !response.groupedData) return;

  const { total, groupedData } = response;
  const container = document.getElementById("chapter-list-container");
  if (!container) return;

  const uniqueCountries = new Set();
  Object.values(groupedData).forEach((vol) => {
    if (!vol) return;
    Object.values(vol).forEach((versions) => {
      if (!Array.isArray(versions)) return;
      versions.forEach((v) => {
        if (v && v.countryCode) uniqueCountries.add(v.countryCode);
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

  const totalPages = Math.ceil((total || 0) / limit) || 1;
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
    btnNext.disabled = currentOffset + limit >= (total || 0);
  }

  // 1. Đưa toàn bộ chapter từ các Volume về một danh sách phẳng duy nhất
  const flatChapters = [];
  for (const vol in groupedData) {
    const chaptersInVol = groupedData[vol];
    for (const chapNum in chaptersInVol) {
      const versions = chaptersInVol[chapNum];
      if (!Array.isArray(versions)) continue;

      const filteredVersions = filterByLanguage(versions);
      if (filteredVersions.length === 0) continue;

      flatChapters.push({
        chapNum: chapNum,
        volume: vol,
        versions: filteredVersions,
      });
    }
  }

  // 2. Sắp xếp toàn bộ chương theo số thứ tự chương (Chapter Number)
  flatChapters.sort((a, b) => {
    const numA = parseFloat(a.chapNum) || 0;
    const numB = parseFloat(b.chapNum) || 0;
    if (numA !== numB) {
      return currentOrder === "desc" ? numB - numA : numA - numB;
    }
    return a.chapNum.localeCompare(b.chapNum);
  });

  // 3. Tiến hành render
  let html = ``;
  let lastRenderedVolume = null;

  for (const item of flatChapters) {
    // Chỉ hiển thị tiêu đề Volume thực sự (bỏ qua "No Volume")
    if (item.volume !== lastRenderedVolume) {
      if (item.volume && item.volume !== "No Volume") {
        html += `<div class="volume-header"><span>Volume ${item.volume}</span></div>`;
      }
      lastRenderedVolume = item.volume;
    }

    const filteredVersions = item.versions;
    if (filteredVersions.length === 1) {
      html += renderChapterRow(filteredVersions[0], false, false, mangaId);
    } else {
      html += `
        <div class="chapter-group-wrapper is-open"> 
          <div class="chapter-row group-parent">
             <div class="chap-info">
                <i class="bi bi-eye"></i>
                <span class="chap-num">Chapter ${item.chapNum}</span>
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

  container.innerHTML = html;
  attachEventListeners(mangaId);
}

function renderChapterRow(v, isSubRow, isLastSub = false, mangaId) {
  if (!v) return "";

  const isExternal = typeof v.externalUrl === "string" && v.externalUrl.trim().startsWith("http");
  const readUrl = isExternal
    ? v.externalUrl.trim()
    : `doctruyen.html?mangaId=${mangaId}&chapterId=${v.id}`;
  const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : "";
  const externalIcon = isExternal
    ? '<i class="bi bi-box-arrow-up-right ms-1" style="font-size: 0.75rem; opacity: 0.8;" title="Đọc trên nền tảng chính thức"></i>'
    : "";

  return `
    <a href="${readUrl}" ${targetAttr} class="chapter-row ${isSubRow ? "sub-row" : ""} ${isLastSub ? "last-sub" : ""}">
      <div class="chap-info">
        <i class="bi bi-eye-fill"></i>
        <span class="fi fi-${v.countryCode || "un"}"></span>
        <div class="chap-text-box">
            <span class="chap-main-text"><b>Ch. ${v.chapter || "0"}</b> ${v.title ? "- " + v.title : ""}${externalIcon}</span>
        </div>
      </div>
      <div class="chap-meta">
        <span class="meta-item"><i class="bi bi-people-fill"></i> ${v.groupName || "No Group"}</span>
        <span class="meta-item uploader"><i class="bi bi-person-fill"></i> ${v.uploader || "Unknown"}</span>
      </div>
      <div class="chap-time">
        <span class="meta-item"><i class="bi bi-clock-fill"></i> ${v.publishDate || ""}</span>
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

  const genres = info.tags.filter((t) => t?.attributes?.group === "genre");
  const themes = info.tags.filter((t) => t?.attributes?.group === "theme");

  const sidebar = document.querySelector(".manga-sidebar");
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-section row mb-4">
      <div class="col-6"><h6>Author</h6><span class="manga-badge-dark">${info.relations?.author || "Unknown"}</span></div>
      <div class="col-6"><h6>Artist</h6><span class="manga-badge-dark">${info.relations?.artist || "Unknown"}</span></div>
    </div>
    <div class="sidebar-section mb-4">
      <div class="row">
        <div class="col-6">
          <h6>Genres</h6>
          <div class="d-flex flex-wrap gap-1">
            ${genres.map((t) => `<a href="tag.html?tagId=${t.id}" class="manga-badge-dark text-decoration-none">${t.attributes.name.en}</a>`).join("")}
          </div>
        </div>
        <div class="col-6">
          <h6>Themes</h6>
          <div class="d-flex flex-wrap gap-1">
            ${themes.map((t) => `<a href="tag.html?tagId=${t.id}" class="manga-badge-dark text-decoration-none">${t.attributes.name.en}</a>`).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="mb-4"><h6>Demographic</h6><span class="manga-badge-dark">${vietHoaChuCaiDauTien(info.demographic || "None")}</span></div>
    <div class="mb-4">
      <h6>Read or Buy</h6>
      <div class="d-flex flex-wrap gap-2">${renderExternalButtons(info.externalLinks, ["raw", "engtl", "bw", "amz", "ebj"])}</div>
    </div>
    <div class="mb-4">
      <h6>Track</h6>
      <div class="d-flex flex-wrap gap-2">${renderExternalButtons(info.externalLinks, ["mal", "al", "mu", "ap", "kt"])}</div>
    </div>
    <div class="mt-4">
      <h6>Alternative Titles</h6>
      <div class="alt-titles-list">
        ${(info.altTitles || [])
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
  if (!links || typeof links !== "object") return "";

  return keys
    .filter((k) => links[k])
    .map((k) => {
      const config = LINK_CONFIG[k] || { label: k, domain: "google.com" };
      const rawLink = links[k];
      let href = "";

      if (typeof rawLink === "string" && rawLink.match(/^https?:\/\//i)) {
        href = rawLink;
      } else {
        const cleanId = String(rawLink).trim();
        switch (k) {
          case "mal":
            href = `https://myanimelist.net/manga/${cleanId}`;
            break;
          case "al":
            href = `https://anilist.co/manga/${cleanId}`;
            break;
          case "ap":
            href = `https://www.anime-planet.com/manga/${cleanId}`;
            break;
          case "kt":
            href = `https://kitsu.io/manga/${cleanId}`;
            break;
          case "mu":
            href = `https://www.mangaupdates.com/series.html?id=${cleanId}`;
            break;
          case "bw":
            href = `https://bookwalker.jp/${cleanId}`;
            break;
          default:
            href = `https://${cleanId.replace(/^\/\//, "")}`;
            break;
        }
      }

      return `
      <a href="${href}" target="_blank" rel="noopener noreferrer" class="btn-ext">
        <img src="https://icons.duckduckgo.com/ip3/${config.domain}.ico" alt="icon">
        <span>${config.label}</span>
      </a>`;
    })
    .join("");
}
