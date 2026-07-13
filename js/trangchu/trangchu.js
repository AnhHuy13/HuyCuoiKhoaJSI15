import {
  LayMangaChoCarousel,
  LayLatestUpdate,
  fetchLatestSelfPublishedManga,
} from "../fetch/fetchHome.js";
import { ChuyenLocale, layDuLieuCache, luuDuLieuCache, taiVaXuLyDanhSach } from "../utility.js";
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
const CACHE_TTL_MS = 30 * 60 * 1000;

const CACHE_KEY_CAROUSEL = "cache_home_carousel";
const CACHE_KEY_LATEST = "cache_home_latest";
const CACHE_KEY_SELF_PUBLISHED = "cache_home_self_published";

// Cấu hình tải gối đầu cho mục tự xuất bản
let selfPubOffset = 0;
const LIMIT_SELF_PUBLISHED = 16; // Tải mỗi đợt 16 truyện theo sơ đồ
let isSelfPubLoading = false;
let hasMoreSelfPub = true;

setData();
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

      // Dự định: Thiết lập hiển thị giao diện cho người dùng đã đăng nhập
      // HienThiGiaoDienUser(user);
    } else {
      console.log("Người dùng hiện tại là khách vãng lai");
      createSimpleLocalKey(LOCAL_HISTORY_KEY, JSON.stringify([]));

      // Dự định: Thiết lập hiển thị giao diện cho khách vãng lai
      // HienThiGiaoDienGuest();
    }
    console.log("hoàn tất check");
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
  // 1. CAROUSEL (Cơ chế đặc biệt được giữ riêng độc lập)
  let mangaArray = layDuLieuCache(CACHE_KEY_CAROUSEL, CACHE_TTL_MS);

  if (!mangaArray) {
    mangaArray = await LayMangaChoCarousel(5);
    if (mangaArray && mangaArray.length > 0) {
      luuDuLieuCache(CACHE_KEY_CAROUSEL, mangaArray);
    }
  }

  if (mangaArray && mangaArray.length > 0) {
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

  // 2. DANH SÁCH MỚI CẬP NHẬT (Sử dụng hàm tối giản)
  await taiVaXuLyDanhSach({
    key: CACHE_KEY_LATEST,
    ttlMs: CACHE_TTL_MS,
    fetchFn: () => LayLatestUpdate(10),
    containerSelector: ".lastest-update-container",
    renderItemFn: generateLatestUpdate,
  });

  // 3. DANH SÁCH TRUYỆN TỰ XUẤT BẢN (Tải 16 phần tử đầu tiên và kích hoạt slider cuộn)
  const container = document.querySelector(".self-published-container");
  if (container) container.innerHTML = ""; // Đảm bảo container trống trước khi nạp lần đầu

  await taiThemSelfPublished();
  khoiTaoSliderSelfPublished();
}

// Hàm tải gối đầu nối tiếp dữ liệu tự xuất bản
async function taiThemSelfPublished() {
  if (isSelfPubLoading || !hasMoreSelfPub) return;
  isSelfPubLoading = true;

  const cacheKeyTrangThai = `${CACHE_KEY_SELF_PUBLISHED}_offset_${selfPubOffset}`;
  let data = layDuLieuCache(cacheKeyTrangThai, CACHE_TTL_MS);

  if (!data) {
    data = await fetchLatestSelfPublishedManga(LIMIT_SELF_PUBLISHED, selfPubOffset);
    if (data && data.length > 0) {
      luuDuLieuCache(cacheKeyTrangThai, data);
    }
  }

  if (data && data.length > 0) {
    const container = document.querySelector(".self-published-container");
    if (container) {
      data.forEach((item) => generateSelfPublishedUpdate(item));
    }

    selfPubOffset += data.length; // Cập nhật offset mới cho lần gọi tiếp theo

    if (data.length < LIMIT_SELF_PUBLISHED) {
      hasMoreSelfPub = false; // Ngăn chặn gọi tiếp nếu máy chủ đã hết dữ liệu
    }
  } else {
    hasMoreSelfPub = false;
  }

  isSelfPubLoading = false;
}

// Khởi tạo hoạt động của nút bấm cuộn mượt và sự kiện theo dõi thanh cuộn
function khoiTaoSliderSelfPublished() {
  const container = document.querySelector(".self-published-container");
  const prevBtn = document.querySelector("#btn-self-pub-prev");
  const nextBtn = document.querySelector("#btn-self-pub-next");

  if (!container) return;

  // Lượng cuộn ngang (Cuộn 3 thẻ mỗi lượt bấm: 3 * (250px rộng + 15px khoảng cách) = 795px)
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

  // Lắng nghe sự kiện cuộn ngang của thanh slider để tự động kích hoạt lazy load
  container.addEventListener("scroll", () => {
    // Nếu khoảng cách còn lại từ điểm cuộn đến mép phải nhỏ hơn 600px thì bắt đầu tải đợt tiếp theo
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
  const mangaId = mangaItem.id; // Đã sửa lỗi tham chiếu ID

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
