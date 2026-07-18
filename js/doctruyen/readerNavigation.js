import { state } from "./readerState.js";
import { ChuyenLocale } from "../helper/utility.js";
import { LayDanhSachChapter } from "../fetch/fetchMangaPage.js";

const gapDialog = document.getElementById("chapter-gap-dialog");

// Tải danh sách chương cùng ngôn ngữ để chuẩn bị dữ liệu chuyển tập liền kề

export async function LoadChapterContext() {
  state.isLoadingContext = true;

  try {
    const res = await fetch(`https://api.mangadex.org/chapter/${state.chapterId}`);
    const currentChapterObj = await res.json();
    const currentLang = currentChapterObj.data.attributes.translatedLanguage;
    const targetCountryCode = ChuyenLocale(currentLang);

    const feed = await LayDanhSachChapter(state.mangaId, 0, 500, "asc");
    if (!feed) return;

    const flatList = [];

    Object.entries(feed.groupedData).forEach(([volName, volData]) => {
      Object.values(volData).forEach((versions) => {
        versions.forEach((v) => {
          if (v.countryCode === targetCountryCode) {
            flatList.push({
              ...v,
              volume: volName,
            });
          }
        });
      });
    });

    state.allChaptersInLanguage = flatList.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numA - numB;
    });
  } finally {
    state.isLoadingContext = false;
  }
}

export function GetNeighborChapterId(direction) {
  if (state.isLoadingContext) return "LOADING";

  const currentIndex = state.allChaptersInLanguage.findIndex((c) => c.id === state.chapterId);
  if (currentIndex === -1) return null;

  let targetIndex = currentIndex + direction;
  while (
    targetIndex >= 0 &&
    targetIndex < state.allChaptersInLanguage.length &&
    state.allChaptersInLanguage[targetIndex].chapter ===
      state.allChaptersInLanguage[currentIndex].chapter
  ) {
    targetIndex += direction;
  }

  const neighbor = state.allChaptersInLanguage[targetIndex];
  if (!neighbor) return null;

  const currentNum = parseFloat(state.allChaptersInLanguage[currentIndex].chapter);
  const neighborNum = parseFloat(neighbor.chapter);

  // Phát hiện khoảng trống chương nhảy vọt lớn hơn 1.1
  if (Math.abs(neighborNum - currentNum) > 1.1) {
    HienGapModal(currentNum, neighborNum, neighbor.id);
    return "STOP_BY_GAP";
  }

  return neighbor.id;
}

export function ChuyenHuongDenChapter(newId) {
  window.location.href = `doctruyen.html?mangaId=${state.mangaId}&chapterId=${newId}`;
}

export function ChuyenHuongDenChapterLanCan(direction) {
  const targetId = GetNeighborChapterId(direction);
  if (targetId === "LOADING") return;
  if (targetId && targetId !== "STOP_BY_GAP") {
    ChuyenHuongDenChapter(targetId);
  } else if (!targetId && direction === 1) {
    window.location.href = `manga.html?mangaId=${state.mangaId}`;
  }
}

export function HienGapModal(from, to, nextId) {
  if (!gapDialog) return;
  document.getElementById("gap-numbers").innerText = `${from} > ${to}`;
  gapDialog.showModal();
  document.getElementById("gap-continue").onclick = () => ChuyenHuongDenChapter(nextId);
}
