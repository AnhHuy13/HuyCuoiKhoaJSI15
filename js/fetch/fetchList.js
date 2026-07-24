/**
 * Thực hiện gọi API MangaDex để tìm kiếm thông tin truyện
 * kết hợp gộp dữ liệu Statistics (Lượt đánh giá, Bookmarks) thực tế.
 */
export async function FetchMangaWithStats(keyword, offset = 0, limit = 15, sort = "relevance") {
  let orderQuery = `&order[relevance]=desc`;
  if (sort === "rating") orderQuery = `&order[rating]=desc`;
  if (sort === "latestUploadedChapter") orderQuery = `&order[latestUploadedChapter]=desc`;
  if (sort === "createdAt") orderQuery = `&order[createdAt]=desc`;

  try {
    const mainUrl = `https://api.mangadex.org/manga?limit=${limit}&offset=${offset}&title=${encodeURIComponent(keyword)}&includes[]=cover_art${orderQuery}`;
    const mainRes = await fetch(mainUrl);
    if (!mainRes.ok) throw new Error("MangaDex API fetch error");
    const mainJson = await mainRes.json();

    const mangaList = mainJson.data || [];
    const total = mainJson.total || 0;

    if (mangaList.length === 0) {
      return { mangaList: [], total: 0 };
    }

    const mangaIds = mangaList.map((m) => m.id);
    const statsUrl = `https://api.mangadex.org/statistics/manga?manga[]=${mangaIds.join("&manga[]=")}`;

    let statsMap = {};
    try {
      const statsRes = await fetch(statsUrl);
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        statsMap = statsJson.statistics || {};
      }
    } catch (err) {
      console.warn("Không thể tải statistics:", err);
    }

    const finalMangaList = mangaList.map((manga) => {
      const mStats = statsMap[manga.id] || {};
      return {
        ...manga,
        rating: mStats.rating?.average ? mStats.rating.average.toFixed(2) : "N/A",
        bookmarks: mStats.follows || 0,
      };
    });

    return { mangaList: finalMangaList, total };
  } catch (error) {
    console.error("Lỗi FetchMangaWithStats:", error);
    throw error;
  }
}
