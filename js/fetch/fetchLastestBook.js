import { layDuLieuCache, luuDuLieuCache } from "../helper/utility.js";

const BASE_URL = "https://api.mangadex.org";
const CACHE_TTL_MS = 5 * 60 * 1000; // Lưu cache trong 5 phút

export async function fetchLastestBook(offset = 0, limit = 20) {
  const cacheKey = `cache_latest_books_offset_${offset}_limit_${limit}`;
  const cachedData = layDuLieuCache(cacheKey, CACHE_TTL_MS);

  if (cachedData) {
    return cachedData;
  }

  try {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      "order[createdAt]": "desc",
    });

    ["cover_art", "author", "artist"].forEach((inc) => {
      queryParams.append("includes[]", inc);
    });

    ["safe", "suggestive", "erotica"].forEach((rating) => {
      queryParams.append("contentRating[]", rating);
    });

    const response = await fetch(`${BASE_URL}/manga?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Không thể kết nối đến máy chủ MangaDex");

    const json = await response.json();
    const mangaList = json.data || [];
    const total = json.total || 0;

    if (mangaList.length === 0) {
      return { data: [], total: 0 };
    }

    const mangaIds = mangaList.map((m) => m.id);
    const statsParams = new URLSearchParams();
    mangaIds.forEach((id) => statsParams.append("manga[]", id));

    let statistics = {};
    try {
      const statsResponse = await fetch(`${BASE_URL}/statistics/manga?${statsParams.toString()}`);
      if (statsResponse.ok) {
        const statsJson = await statsResponse.json();
        statistics = statsJson.statistics || {};
      }
    } catch (e) {
      console.error("Lỗi khi tải thông số thống kê:", e);
    }

    const processedData = mangaList.map((manga) => {
      const coverRel = manga.relationships.find((r) => r.type === "cover_art");
      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName
        ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
        : "https://res.cloudinary.com/rimebiqz/image/upload/v1783914527/TEST_svywnr.jpg";

      const authorRel = manga.relationships.find((r) => r.type === "author");
      const artistRel = manga.relationships.find((r) => r.type === "artist");

      const title =
        manga.attributes.title?.en ||
        (manga.attributes.title && Object.values(manga.attributes.title)[0]) ||
        "Unknown Title";
      const desc =
        manga.attributes.description?.en ||
        (manga.attributes.description && Object.values(manga.attributes.description)[0]) ||
        "Chưa có tóm tắt tiếng Anh cho bộ truyện này.";

      const tags = manga.attributes.tags || [];
      const originalLanguage = manga.attributes.originalLanguage || "ja";
      const status = manga.attributes.status || "ongoing";
      const contentRating = manga.attributes.contentRating || "safe";

      const mangaStats = statistics[manga.id] || {};
      const rating = mangaStats.rating?.average ? mangaStats.rating.average.toFixed(2) : "N/A";
      const follows = mangaStats.follows || 0;
      const comments = mangaStats.comments?.threadId ? "N/A" : 0;

      return {
        id: manga.id,
        title,
        desc,
        cover: coverUrl,
        author: authorRel?.attributes?.name || "Unknown",
        artist: artistRel?.attributes?.name || "Unknown",
        tags,
        originalLanguage,
        status,
        contentRating,
        rating,
        follows,
        comments,
      };
    });

    const result = { data: processedData, total };
    luuDuLieuCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Lỗi trong fetchLastestBook:", error);
    return { data: [], total: 0 };
  }
}
