import {
  LayMangaChoCarousel,
  LayLatestUpdate,
  fetchLatestSelfPublishedManga,
} from "../fetch/fetchHome.js";
import { ChuyenLocale } from "../helper/utility.js";
import { xuLyGiaoDienCarousel, generateMangaPage } from "./carousel.js";

import { isLogin, syncGuestHistoryToFirebase, initUserOnFirebase } from "../database/firebase.js";
import { readLocalKey, createSimpleLocalKey, deleteLocalKey } from "../database/localStorage.js";

import { luuCache, layCache } from "../helper/cacheHelper.js";

window.history.scrollRestoration = "manual";

const THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO = 3000;
const LOCAL_HISTORY_KEY = "manga_history";
const CACHE_TTL_MS = 30 * 60 * 1000;

const CACHE_KEY_CAROUSEL = "cache_home_carousel";
const CACHE_KEY_LATEST = "cache_home_latest";
const CACHE_KEY_SELF_PUBLISHED = "cache_home_self_published";

let selfPubOffset = 0;
const LIMIT_SELF_PUBLISHED = 16;
let isSelfPubLoading = false;
let hasMoreSelfPub = true;

function updateProgress(percentage, text) {
  const progressBar = document.getElementById("load-progress");
  const loadingText = document.querySelector(".loading-text");
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  if (loadingText && text) {
    loadingText.textContent = text;
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
}

async function doiAnhGiaoDienTaiXong() {
  const images = [];

  document.querySelectorAll("#carouselExampleCaptions .carousel-inner img").forEach((img) => {
    images.push(img);
  });

  const latestImgs = document.querySelectorAll(
    ".lastest-update-container .lastest-update-item img",
  );
  for (let i = 0; i < Math.min(latestImgs.length, 4); i++) {
    images.push(latestImgs[i]);
  }

  const selfPubDivs = document.querySelectorAll(
    ".self-published-container .self-published-item-image",
  );
  const selfPubUrls = [];
  for (let i = 0; i < Math.min(selfPubDivs.length, 4); i++) {
    const bg = selfPubDivs[i].style.backgroundImage;
    const match = bg.match(/url\(["']?([^"']*)["']?\)/);
    if (match && match[1]) {
      selfPubUrls.push(match[1]);
    }
  }

  if (images.length === 0 && selfPubUrls.length === 0) return;

  let loadedCount = 0;
  const total = images.length + selfPubUrls.length;

  return new Promise((resolve) => {
    function checkComplete() {
      loadedCount++;
      if (loadedCount >= total) {
        resolve();
      }
    }

    images.forEach((img) => {
      if (img.complete) {
        checkComplete();
      } else {
        img.addEventListener("load", checkComplete);
        img.addEventListener("error", checkComplete);
      }
    });

    selfPubUrls.forEach((url) => {
      const tempImg = new Image();
      tempImg.src = url;
      if (tempImg.complete) {
        checkComplete();
      } else {
        tempImg.onload = checkComplete;
        tempImg.onerror = checkComplete;
      }
    });
  });
}

async function onPageLoad() {
  try {
    updateProgress(30, "Đang nạp dữ liệu...");

    await Promise.all([setCarouselData(), setLatestUpdateData(), setSelfPublishedData()]);

    updateProgress(75, "Đang tải hình ảnh giao diện...");

    await doiAnhGiaoDienTaiXong();

    updateProgress(100, "Hoàn tất!");
    hideLoadingScreen();

    Init()
      .then(() => {
        console.log("[Auth] Đã hoàn thành kiểm tra tài khoản và đồng bộ chạy ngầm.");
      })
      .catch((err) => {
        console.warn("[Auth] Lỗi chạy ngầm auth:", err);
      });
  } catch (error) {
    console.error("Gặp lỗi khi nạp trang:", error);
    hideLoadingScreen();
  }
}

onPageLoad();

async function Init() {
  console.log("Hệ thống đang khởi tạo...");
  try {
    const user = await isLogin();
    if (user) {
      const userId = user.uid;
      console.log("Đã đăng nhập với Id: " + userId);

      await initUserOnFirebase(user);

      const guestHistory = readLocalKey(LOCAL_HISTORY_KEY);
      if (guestHistory && guestHistory.length > 0) {
        console.log("Phát hiện lịch sử từ khách vãng lai, tiến hành sáp nhập...");
        const isSyncSuccess = await syncGuestHistoryToFirebase(userId, guestHistory);
        if (isSyncSuccess) {
          deleteLocalKey(LOCAL_HISTORY_KEY);
          console.log("Đồng bộ hoàn tất, đã dọn dẹp bộ nhớ máy khách");
        }
      }
    } else {
      console.log("Người dùng hiện tại là khách vãng lai");
      createSimpleLocalKey(LOCAL_HISTORY_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error("Lỗi khởi tạo ứng dụng: " + error);
  }
}

async function setCarouselData() {
  let mangaArray = layCache(CACHE_KEY_CAROUSEL, CACHE_TTL_MS);

  if (!mangaArray) {
    mangaArray = await LayMangaChoCarousel(5);
    if (mangaArray && mangaArray.length > 0) {
      luuCache(CACHE_KEY_CAROUSEL, mangaArray);
    }
  }

  if (mangaArray && mangaArray.length > 0) {
    const container = document.querySelector("#carouselExampleCaptions .carousel-inner");
    if (container) container.innerHTML = "";

    mangaArray.forEach((mangaItem, index) => {
      generateMangaPage(index, mangaItem);
    });

    xuLyGiaoDienCarousel();
    const carouselElement = document.querySelector("#carouselExampleCaptions");
    new bootstrap.Carousel(carouselElement, {
      interval: THOI_GIAN_LUOT_QUA_CAROUSEL_TIEP_THEO,
      ride: "carousel",
    });
  }
}

async function setLatestUpdateData() {
  const container = document.querySelector(".lastest-update-container");
  if (container) container.innerHTML = "";

  let latestData = layCache(CACHE_KEY_LATEST, CACHE_TTL_MS);

  if (!latestData) {
    latestData = await LayLatestUpdate(10);
    if (latestData && latestData.length > 0) {
      luuCache(CACHE_KEY_LATEST, latestData);
    }
  }

  if (latestData && latestData.length > 0) {
    latestData.forEach((item) => {
      generateLatestUpdate(item);
    });
  }
}

async function setSelfPublishedData() {
  const container = document.querySelector(".self-published-container");
  if (container) container.innerHTML = "";

  await taiThemSelfPublished();
  khoiTaoSliderSelfPublished();
}

async function taiThemSelfPublished() {
  if (isSelfPubLoading || !hasMoreSelfPub) return;
  isSelfPubLoading = true;

  const cacheKeyTrangThai = `${CACHE_KEY_SELF_PUBLISHED}_offset_${selfPubOffset}`;
  let data = layCache(cacheKeyTrangThai, CACHE_TTL_MS);

  if (!data) {
    data = await fetchLatestSelfPublishedManga(LIMIT_SELF_PUBLISHED, selfPubOffset);
    if (data && data.length > 0) {
      luuCache(cacheKeyTrangThai, data);
    }
  }

  if (data && data.length > 0) {
    const container = document.querySelector(".self-published-container");
    if (container) {
      data.forEach((item) => generateSelfPublishedUpdate(item));
    }
    selfPubOffset += data.length;

    if (data.length < LIMIT_SELF_PUBLISHED) {
      hasMoreSelfPub = false;
    }
  } else {
    hasMoreSelfPub = false;
  }
  isSelfPubLoading = false;
}

function khoiTaoSliderSelfPublished() {
  const container = document.querySelector(".self-published-container");
  const prevBtn = document.querySelector("#btn-self-pub-prev");
  const nextBtn = document.querySelector("#btn-self-pub-next");

  if (!container) return;
  const scrollAmount = 795;

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  container.addEventListener("scroll", () => {
    const nearEnd = container.scrollWidth - container.scrollLeft - container.clientWidth < 600;
    if (nearEnd) {
      taiThemSelfPublished();
    }
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
          <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914413/group_ivva1v.svg" alt="" class="lastest-update-group-icon">
          <p class="lastest-update-scanlation-group">${scanlationGroup}</p>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", Template);
}

function generateSelfPublishedUpdate(mangaItem) {
  const container = document.querySelector(".self-published-container");

  const cleanText = function (text) {
    const el = document.createElement("div");
    el.textContent = text || "";
    return el.innerHTML;
  };

  const nameTruyen = cleanText(mangaItem.title) || "Không có tên truyện";
  const descTruyen = cleanText(mangaItem.desc);
  const imageTruyen = mangaItem.coverUrl;
  const mangaId = mangaItem.id;

  const Template = `
    <div class="self-published-item-container">
      <div class="self-published-item-image" style="background-image: url(${imageTruyen});">
        <div class="self-published-item-desc">
          <p>${descTruyen}</p>
        </div>
        <div class="self-published-item-btn">
          <button class="self-published-item-read-btn" onclick="window.location.href='doctruyen.html?mangaId=${mangaId}'">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914416/book_ro0m5e.svg" alt="" />
            Read
          </button>
          <button class="self-published-item-info-btn" onclick="window.location.href='manga.html?mangaId=${mangaId}'">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914499/arrow_forward_xt30ao.svg" alt="" />
          </button>
        </div>
      </div>
      <div class="self-published-item-name-manga" onclick="window.location.href='manga.html?mangaId=${mangaId}'" style="cursor: pointer;">
        ${nameTruyen}
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", Template);
}
