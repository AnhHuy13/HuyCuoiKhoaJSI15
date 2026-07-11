import { LayMangaChoCarousel, LayLatestUpdate } from "../fetch/fetchHome.js";
import { ChuyenLocale } from "../utility.js";
import { xuLyGiaoDienCarousel, generateMangaPage } from "./carousel.js";
import {
  isLogin,
  readLocalKey,
  createSimpleLocalKey,
  syncGuestHistoryToFirebase,
  deleteLocalKey,
} from "../auth/auth-and-crud.js";
window.history.scrollRestoration = "manual";

const THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO = 3000;

const LOCAL_HISTORY_KEY = "manga_history";

Init();

async function Init() {
  console.log("Hệ thống đang khởi tạo...");

  try {
    const user = await isLogin();

    if (user) {
      const userId = user.uid;
      console.log("Đã đăng nhập với Id: " + userId);

      const guestHistory = readLocalKey(LOCAL_HISTORY_KEY);
      if (guestHistory && guestHistory.length > 0) {
        console.log("Phát hiện lịch sử từ máy khách");

        const isSyncSuccess = await syncGuestHistoryToFirebase(userId, guestHistory);
        if (isSyncSuccess) {
          deleteLocalKey(LOCAL_HISTORY_KEY);
          console.log("Đồng bộ hoàn tất, đã dọn dẹp bộ nhớ máy khách");
        }
      }

      // HienThiGiaoDienUser(user);
    } else {
      console.log("Người dùng hiện tại là khách vãng lai");
      createSimpleLocalKey(LOCAL_HISTORY_KEY, JSON.stringify([]));

      // HienThiGiaoDienGuest();
    }
    console.log("hoàn tất check");
    setData();
  } catch (error) {
    console.error("Lỗi khởi tạo ứng dụng: " + error);
  }
}

function testElement(selector) {
  var element = document.querySelector(selector);
  if (element === null) {
    console.error("Không tìm thấy phần tử: " + selector + " !!!!!!!!!");
    return {};
  }
  return element;
}

async function setData() {
  const mangaArray = await LayMangaChoCarousel(5);
  console.log(mangaArray);
  mangaArray.forEach((mangaItem, index) => {
    generateMangaPage(index, mangaItem);
  });

  xuLyGiaoDienCarousel();
  const carouselElement = document.querySelector("#carouselExampleCaptions");
  const carousel = new bootstrap.Carousel(carouselElement, {
    interval: THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO,
    ride: "carousel",
  });

  const lastestUpdateArray = await LayLatestUpdate(10);
  console.log(lastestUpdateArray);

  lastestUpdateArray.forEach((element) => {
    generateLatestUpdate(element);
  });
}

function generateLatestUpdate(mangaItem) {
  const container = document.querySelector(".lastest-update-container");

  const cleanText = function (text) {
    const el = document.createElement("div");
    el.textContent = text || "";
    return el.innerHTML;
  };

  const nameTruyen = cleanText(mangaItem.titleManga) || "Không có tên truyện";
  let descTruyen;
  if (mangaItem.titleChapter) {
    descTruyen = cleanText(`${mangaItem.volumeChapterStr || ""} - ${mangaItem.titleChapter || ""}`);
  } else {
    descTruyen = cleanText(mangaItem.volumeChapterStr);
  }

  const translatedLanguage = mangaItem.locale;
  const scanlationGroup = mangaItem.scanlationGroup || "No Group";
  const linkCoverTruyen = mangaItem.coverUrl || "";
  const mangaId = mangaItem.mangaId;
  const chapterId = mangaItem.chapterId;

  const Template = `
    <div class="lastest-update-item">
      <img src="${linkCoverTruyen}" alt="Cover" />
      <div class="lastest-update-item-content">
        <div class="lastest-update-name-manga" onclick="window.location.href='manga.html?mangaId=${mangaId}'">${nameTruyen}</div>
        <div class="lastest-update-locale-volume" onclick="window.location.href='doctruyen.html?mangaId=${mangaId}&chapterId=${chapterId}'">
          <span class="fi fi-${translatedLanguage}" id="flag-icon-locale-lastest-update"></span>
          <span class="lastest-update-vol-chap">${descTruyen}</span>
        </div>
        <div class="lastest-update-scanlation-container">
          <img src="../image/icon/group.svg" alt="" class="lastest-update-group-icon">
          <p class="lastest-update-scanlation-group">${scanlationGroup}</p>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", Template);
}

function generateSelfPublishedUpdate(mangaItem) {}
