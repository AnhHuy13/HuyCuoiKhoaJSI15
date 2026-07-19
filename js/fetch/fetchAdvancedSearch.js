const BASE_URL = "https://api.mangadex.org";

/**
 * Tra cứu tác giả/họa sĩ bằng tên để lấy UUID từ MangaDex
 * @param {string} name - Tên tác giả/họa sĩ
 * @returns {Promise<string|null>} UUID của tác giả/họa sĩ
 */
async function fetchAuthorIdByName(name) {
  if (!name || name.trim() === "") return null;
  try {
    const res = await fetch(`${BASE_URL}/author?name=${encodeURIComponent(name.trim())}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }
  } catch (err) {
    console.error("Lỗi khi tìm tác giả:", err);
  }
  return null;
}

/**
 * Lấy danh sách thông số thống kê (Rating, Follows) cho một loạt Manga ID
 * @param {Array<string>} ids - Danh sách UUID manga
 * @returns {Promise<Object>} Object chứa thông tin thống kê từng truyện theo key là manga ID
 */
async function fetchMangaStatistics(ids = []) {
  if (ids.length === 0) return {};
  try {
    const params = ids.map((id) => `manga[]=${id}`).join("&");
    const res = await fetch(`${BASE_URL}/statistics/manga?${params}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.statistics || {};
  } catch (err) {
    console.error("Lỗi khi tải thông số thống kê:", err);
    return {};
  }
}

/**
 * Thực hiện tìm kiếm nâng cao qua API MangaDex
 * @param {Object} filters - Các điều kiện lọc từ giao diện
 * @returns {Promise<Object>} Danh sách kết quả truyện kèm thông tin trang
 */
export async function fetchAdvancedSearch(filters = {}) {
  const params = new URLSearchParams();

  // Nhúng sẵn cover_art, tác giả, họa sĩ
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("includes[]", "artist");

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  // 1. Tìm kiếm theo từ khóa tiêu đề
  if (filters.title && filters.title.trim() !== "") {
    params.append("title", filters.title.trim());
  }

  // 2. Sắp xếp (Sorting)
  if (filters.sort && filters.sort !== "none") {
    switch (filters.sort) {
      case "rating":
        params.append("order[rating]", "desc");
        break;
      case "followedCount":
        params.append("order[followedCount]", "desc");
        break;
      case "relevance":
        params.append("order[relevance]", "desc");
        break;
      case "latestUploadedChapter":
        params.append("order[latestUploadedChapter]", "desc");
        break;
      case "createdAt":
        params.append("order[createdAt]", "desc");
        break;
      default:
        params.append("order[relevance]", "desc");
    }
  } else {
    params.append("order[followedCount]", "desc");
  }

  // 3. Đối tượng độc giả (Demographic)
  if (filters.demographic && filters.demographic.length > 0) {
    filters.demographic.forEach((demo) => {
      if (demo && demo !== "any") {
        params.append("publicationDemographic[]", demo);
      }
    });
  }

  // 4. Phân loại nội dung (Content Rating)
  if (filters.contentRating && filters.contentRating.length > 0) {
    filters.contentRating.forEach((rating) => {
      if (rating && rating !== "any") {
        params.append("contentRating[]", rating);
      }
    });
  } else {
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
  }

  // 5. Ngôn ngữ gốc (Original Language)
  if (filters.originalLanguage && filters.originalLanguage !== "all") {
    params.append("originalLanguage[]", filters.originalLanguage);
  }

  // 6. Trạng thái xuất bản (Publication Status)
  if (filters.status && filters.status !== "any") {
    params.append("status[]", filters.status);
  }

  // 7. Năm xuất bản (Publication Year)
  if (filters.year) {
    params.append("year", filters.year.toString());
  }

  // 8. Tác giả & Họa sĩ
  if (filters.authorName && filters.authorName.trim() !== "") {
    const authorId = await fetchAuthorIdByName(filters.authorName);
    if (authorId) {
      params.append("authors[]", authorId);
    } else {
      return { data: [], total: 0, limit, offset };
    }
  }

  if (filters.artistName && filters.artistName.trim() !== "") {
    const artistId = await fetchAuthorIdByName(filters.artistName);
    if (artistId) {
      params.append("artists[]", artistId);
    } else {
      return { data: [], total: 0, limit, offset };
    }
  }

  // 9. Ngôn ngữ dịch sẵn có
  if (
    filters.hasTranslatedChapters &&
    filters.translatedLanguage &&
    filters.translatedLanguage !== "any"
  ) {
    params.append("availableTranslatedLanguage[]", filters.translatedLanguage);
  }

  // 10. Thẻ phân loại truyện (Genres / Tags)
  if (filters.includedTags && filters.includedTags.length > 0) {
    filters.includedTags.forEach((tagId) => params.append("includedTags[]", tagId));
    if (filters.includedTagsMode) {
      params.append("includedTagsMode", filters.includedTagsMode);
    }
  }
  if (filters.excludedTags && filters.excludedTags.length > 0) {
    filters.excludedTags.forEach((tagId) => params.append("excludedTags[]", tagId));
    if (filters.excludedTagsMode) {
      params.append("excludedTagsMode", filters.excludedTagsMode);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/manga?${params.toString()}`);
    if (!response.ok) throw new Error("MangaDex API returned error");
    const result = await response.json();

    // Lấy stats (lượt theo dõi, rating) gộp
    if (result.data && result.data.length > 0) {
      const mangaIds = result.data.map((m) => m.id);
      const stats = await fetchMangaStatistics(mangaIds);

      result.data = result.data.map((manga) => {
        const mangaStats = stats[manga.id] || {};
        return {
          ...manga,
          statistics: mangaStats,
        };
      });
    }

    return {
      data: result.data || [],
      total: result.total || 0,
      limit: result.limit || limit,
      offset: result.offset || offset,
    };
  } catch (error) {
    console.error("Lỗi khi tìm kiếm nâng cao MangaDex:", error);
    return { data: [], total: 0, limit, offset };
  }
}
