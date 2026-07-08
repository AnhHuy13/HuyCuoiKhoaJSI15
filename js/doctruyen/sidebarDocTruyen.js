import { LayThongTinChapter } from "../fetch/fetchRead.js";
import { ChuyenLocale } from "../utility.js";

const params = new URLSearchParams(window.location.search);
let chapterId = params.get("chapterId");

AddData();

async function AddData() {
  const data = await LayThongTinChapter(chapterId);
  console.log(data);

  const originalLanguage = data?.mangaInfo?.originalLanguage;
  const nameManga = data?.mangaInfo?.name;
  const chapterName = data?.chapterInfo?.name || "";
  const translatedLanguage = data?.chapterInfo?.translatedLanguage;
  const scanlationGroup = data?.scanlationInfo?.name;
  const volumeChapterStr = data?.chapterInfo?.volumeChapterStr;

  document.getElementById("flag-icon-manga-original").className = `fi fi-${originalLanguage}`;

  document.getElementById("manga-sidebar-name-manga").textContent = nameManga;
  document.getElementById("manga-sidebar-chapter-name-manga").textContent = chapterName;

  document.getElementById("flag-icon-manga-scanlation").className = `fi fi-${translatedLanguage}`;

  document.getElementById("manga-sidebar-scanlation-name").textContent = scanlationGroup;

  document.querySelector(".manga-sidebar-vol-current").textContent =
    `${volumeChapterStr} ${chapterName}`;
}
