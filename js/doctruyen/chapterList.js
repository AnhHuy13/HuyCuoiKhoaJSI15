import { LayDanhSachChapter } from "../fetch/fetchMangaPage.js";
import { initLanguageSelector, filterByLanguage } from "./locLangDocTruyen.js";

const CHAPTER_LIST_LIMIT = 50;
let currentOffset = 0;
let currentOrder = "desc";
let listenersAttached = false;

export async function RenderChapterList(mangaId) {
  const response = await LayDanhSachChapter(
    mangaId,
    currentOffset,
    CHAPTER_LIST_LIMIT,
    currentOrder,
  );
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

  updateSortUI();
  updatePaginationUI(total);

  let html = "";
  const sortedVolumes = Object.keys(groupedData).sort(sortVolumes);
  for (const vol of sortedVolumes) {
    const chaptersInVol = groupedData[vol];
    let volHtml = "";
    let hasChaptersInVol = false;

    const sortedChapterNums = Object.keys(chaptersInVol).sort(sortChapterNumbers);
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

function updateSortUI() {
  const sortText = document.getElementById("sort-text");
  const sortIcon = document.getElementById("sort-icon");
  if (sortText) sortText.textContent = currentOrder === "desc" ? "Descending" : "Ascending";
  if (sortIcon) sortIcon.className = currentOrder === "desc" ? "bi bi-sort-down" : "bi bi-sort-up";
}

function updatePaginationUI(total) {
  const totalPages = Math.max(Math.ceil(total / CHAPTER_LIST_LIMIT), 1);
  const currentPage = Math.floor(currentOffset / CHAPTER_LIST_LIMIT) + 1;
  const pageInfo = document.getElementById("page-info");
  if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;

  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");
  if (btnPrev) btnPrev.disabled = currentOffset === 0;
  if (btnNext) btnNext.disabled = currentOffset + CHAPTER_LIST_LIMIT >= total;
}

function sortVolumes(a, b) {
  if (a === "No Volume") return 1;
  if (b === "No Volume") return -1;
  return currentOrder === "desc" ? parseFloat(b) - parseFloat(a) : parseFloat(a) - parseFloat(b);
}

function sortChapterNumbers(a, b) {
  const numA = parseFloat(a) || 0;
  const numB = parseFloat(b) || 0;
  return currentOrder === "desc" ? numB - numA : numA - numB;
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

  btnSort?.addEventListener("click", async () => {
    currentOrder = currentOrder === "desc" ? "asc" : "desc";
    currentOffset = 0;
    await RenderChapterList(mangaId);
  });

  btnPrev?.addEventListener("click", async () => {
    if (currentOffset > 0) {
      currentOffset -= CHAPTER_LIST_LIMIT;
      await RenderChapterList(mangaId);
    }
  });

  btnNext?.addEventListener("click", async () => {
    currentOffset += CHAPTER_LIST_LIMIT;
    await RenderChapterList(mangaId);
  });

  listenersAttached = true;
}
