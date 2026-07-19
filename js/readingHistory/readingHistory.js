// js/readingHistory/readingHistory.js
import { isLogin, writeSubcollectionDoc, getSubcollectionDocs } from "../database/firebase.js";
import { ChuyenLocale } from "../helper/utility.js";

const CACHE_KEY = "cache_reading_history";
const CACHE_TTL_3_NGAY = 3 * 24 * 60 * 60 * 1000; // 3 ngày tính bằng ms

// ==========================================
// 1. HÀM LƯU LỊCH SỬ ĐỌC (Gọi khi người dùng đọc truyện)
// ==========================================
export async function luuLichSuDoc(mangaId, chapterId, chapterData) {
  if (!mangaId || !chapterId || !chapterData) return;

  // XÓA CACHE TRANG LỊCH SỬ NGAY LẬP TỨC ĐỂ BUỘC LOAD MỚI Ở LẦN TRUY CẬP SAU
  localStorage.removeItem(CACHE_KEY);
  console.log("[History Log] Đã phát hiện lượt đọc mới. Tiến hành xóa cache trang lịch sử.");

  let coverUrl = "";
  let originalLanguage = chapterData?.mangaInfo?.originalLanguage || "un";
  let mangaTitle = chapterData?.mangaInfo?.name || "Unknown Manga";

  // Lấy ảnh bìa chuẩn thông qua API chính chủ (nếu cần)
  try {
    const detailRes = await fetch(`https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art`);
    const detail = await detailRes.json();
    const rels = detail?.data?.relationships;
    const coverFileName = rels?.find((r) => r.type === "cover_art")?.attributes?.fileName;
    if (coverFileName) {
      coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}.256.jpg`;
    }
    if (detail?.data?.attributes?.originalLanguage) {
      originalLanguage = detail.data.attributes.originalLanguage;
    }
  } catch (err) {
    console.error("Lỗi lấy bìa truyện:", err);
  }

  // Tạo đối tượng chứa thông tin chương vừa đọc
  const newChapter = {
    chapterId: chapterId,
    chapter: chapterData?.chapterInfo?.chapter || "0",
    volume: chapterData?.chapterInfo?.volume || "No Volume",
    title: chapterData?.chapterInfo?.name || "",
    groupName: chapterData?.scanlationInfo?.name || "No Group",
    uploader: "Unknown",
    countryCode: chapterData?.chapterInfo?.translatedLanguage || "un",
    readAt: Date.now(),
  };

  // Cập nhật LocalStorage
  let history = JSON.parse(localStorage.getItem("manga_reading_history")) || [];
  let mangaIndex = history.findIndex((item) => item.mangaId === mangaId);

  if (mangaIndex > -1) {
    let existingManga = history[mangaIndex];
    existingManga.mangaTitle = mangaTitle;
    if (coverUrl) existingManga.mangaCover = coverUrl;
    existingManga.originalLanguage = originalLanguage;
    existingManga.lastReadAt = Date.now();

    // Loại bỏ chương cũ bị trùng lặp để đẩy lên trên cùng
    existingManga.chapters = existingManga.chapters.filter((c) => c.chapterId !== chapterId);
    existingManga.chapters.unshift(newChapter);

    history.splice(mangaIndex, 1);
    history.unshift(existingManga);
  } else {
    history.unshift({
      mangaId: mangaId,
      mangaTitle: mangaTitle,
      mangaCover: coverUrl || "https://placehold.co/120x175/1e1f22/FFF?text=No+Cover",
      originalLanguage: originalLanguage,
      lastReadAt: Date.now(),
      chapters: [newChapter],
    });
  }

  localStorage.setItem("manga_reading_history", JSON.stringify(history));

  // Đồng bộ lên Firestore nếu người dùng đã đăng nhập
  try {
    const user = await isLogin();
    if (user) {
      const updatedManga = history.find((item) => item.mangaId === mangaId);
      await writeSubcollectionDoc(user.uid, "history", mangaId, updatedManga);
      console.log("[Firebase Log] Đồng bộ lịch sử thành công.");
    }
  } catch (e) {
    console.warn("Chưa đăng nhập hoặc lỗi đồng bộ đám mây:", e);
  }
}

// ==========================================
// 2. KHỞI TẠO VÀ HIỂN THỊ TRANG LỊCH SỬ
// ==========================================

function formatTimeAgo(timestamp) {
  if (!timestamp) return "N/A";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return new Date(timestamp).toLocaleDateString();
}

async function layLichSu() {
  const user = await isLogin();
  if (user) {
    // Nếu có tài khoản, lấy dữ liệu từ Firebase về cập nhật lại LocalStorage trước khi xuất dữ liệu
    const cloudDocs = await getSubcollectionDocs(user.uid, "history");
    if (cloudDocs && cloudDocs.length > 0) {
      // Sắp xếp các bộ truyện theo thời gian đọc mới nhất trước
      cloudDocs.sort((a, b) => b.lastReadAt - a.lastReadAt);
      localStorage.setItem("manga_reading_history", JSON.stringify(cloudDocs));
      return cloudDocs;
    }
  }
  return JSON.parse(localStorage.getItem("manga_reading_history")) || [];
}

function RenderHistoryUI(historyList) {
  const container = document.getElementById("history-list-container");
  if (!container) return;

  if (historyList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-clock-history text-white" style="font-size: 3rem; opacity: 0.95;"></i>
        <p class="mt-3 text-white" style="opacity: 0.95;">Bạn chưa có lịch sử đọc truyện nào.</p>
        <a href="trangchu.html" class="btn btn-sm btn-outline-light mt-2" style="border-color: #ff6740; color: #ff6740;">Khám phá truyện ngay</a>
      </div>`;
    return;
  }

  let html = "";

  historyList.forEach((manga) => {
    const originalLangFlag = ChuyenLocale(manga.originalLanguage);
    const hasMoreThanThree = manga.chapters.length > 3;

    html += `
      <div class="history-card" data-manga-id="${manga.mangaId}">
        <a href="manga.html?mangaId=${manga.mangaId}" class="history-cover-link">
          <img src="${manga.mangaCover}" class="history-cover" loading="lazy" alt="${manga.mangaTitle}" />
        </a>
        <div class="history-details">
          <a href="manga.html?mangaId=${manga.mangaId}" class="history-manga-title">
            <span class="fi fi-${originalLangFlag}"></span> ${manga.mangaTitle}
          </a>
          
          <div class="history-chapters-list">
            ${manga.chapters
              .map((ch) => {
                const readUrl = `doctruyen.html?mangaId=${manga.mangaId}&chapterId=${ch.chapterId}`;
                const volStr = ch.volume === "No Volume" || !ch.volume ? "" : `Vol. ${ch.volume} `;
                const displayText = `${volStr}Ch. ${ch.chapter} ${ch.title ? "- " + ch.title : ""}`;

                return `
                <div class="history-chapter-row">
                  <div class="chapter-left-col">
                    <i class="bi bi-eye-slash-fill chapter-eye-icon"></i>
                    <span class="fi fi-${ch.countryCode}"></span>
                    <div class="chapter-text-info">
                      <a href="${readUrl}" class="chapter-number-title">${displayText}</a>
                      <div class="chapter-sub-info">
                        <span><i class="bi bi-people-fill"></i> ${ch.groupName}</span>
                        <span><i class="bi bi-person-fill"></i> ${ch.uploader}</span>
                      </div>
                    </div>
                  </div>
                  <div class="chapter-right-col">
                    <span class="chapter-meta-item"><i class="bi bi-clock-fill"></i> ${formatTimeAgo(ch.readAt)}</span>
                    <span class="chapter-meta-item"><i class="bi bi-eye-fill"></i> N/A</span>
                    <span class="chapter-meta-item"><i class="bi bi-chat-fill"></i> 0</span>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>

          ${
            hasMoreThanThree
              ? `
            <div class="show-all-btn-wrapper">
              <button class="show-all-btn">Show All</button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Lắng nghe sự kiện click Show All / Show Less
  document.querySelectorAll(".history-card").forEach((card) => {
    const btn = card.querySelector(".show-all-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        card.classList.toggle("is-expanded");
        if (card.classList.contains("is-expanded")) {
          btn.textContent = "Show Less";
        } else {
          btn.textContent = "Show All";
        }
      });
    }
  });
}

// Xử lý nạp lịch sử và quản lý bộ nhớ Cache
async function initHistoryPage() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "flex";

  try {
    // 1. Kiểm tra cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_KEY + "_time");

    if (cachedData && cachedTime && Date.now() - cachedTime < CACHE_TTL_3_NGAY) {
      console.log("[Cache System] Đã nạp dữ liệu lịch sử từ bộ nhớ cache.");
      RenderHistoryUI(JSON.parse(cachedData));
      if (loadingScreen) loadingScreen.style.display = "none";
      return;
    }

    // 2. Không có cache hoặc hết hạn -> Fetch mới
    console.log("[Cache System] Không có cache hoặc đã hết hạn. Thực hiện tải mới.");
    const freshData = await layLichSu();
    RenderHistoryUI(freshData);

    // Lưu cache mới
    localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
    localStorage.setItem(CACHE_KEY + "_time", Date.now().toString());
  } catch (e) {
    console.error("Lỗi khi tải lịch sử đọc:", e);
  } finally {
    if (loadingScreen) loadingScreen.style.display = "none";
  }
}

// Chỉ khởi chạy initHistoryPage nếu đang đứng ở trang lịch sử đọc truyện
if (window.location.pathname.includes("readingHistory.html")) {
  document.addEventListener("DOMContentLoaded", initHistoryPage);
}
