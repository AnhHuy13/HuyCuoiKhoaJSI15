import { layDuLieuCache, luuDuLieuCache } from "../helper/utility.js";

const BASE_URL = "https://api.mangadex.org";
const CACHE_TTL_MS = 15 * 60 * 1000; // Cache 15 phút

export async function fetchTagName(tagId) {
  const cacheKey = `cache_tag_name_${tagId}`;
  const cached = layDuLieuCache(cacheKey, CACHE_TTL_MS);
  if (cached) return cached;

  try {
    const response = await fetch(`${BASE_URL}/manga/tag`);
    if (!response.ok) throw new Error("Không thể tải danh sách tag");
    const json = await response.json();
    const tags = json.data || [];
    const tag = tags.find((t) => t.id === tagId);
    const name = tag?.attributes?.name?.en || "Tag";
    luuDuLieuCache(cacheKey, name);
    return name;
  } catch (error) {
    console.error("Lỗi khi lấy tên tag:", error);
    return "Tag";
  }
}

export async function fetchTrendingMangaByTag(tagId) {
  const cacheKey = `cache_trending_tag_${tagId}`;
  const cached = layDuLieuCache(cacheKey, CACHE_TTL_MS);
  if (cached) return cached;

  try {
    const queryParams = new URLSearchParams({
      "order[followedCount]": "desc",
      limit: "2",
    });

    queryParams.append("includedTags[]", tagId);
    queryParams.append("includes[]", "cover_art");

    ["safe", "suggestive", "erotica"].forEach((rating) => {
      queryParams.append("contentRating[]", rating);
    });

    const response = await fetch(`${BASE_URL}/manga?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Không thể tải truyện trending");
    const json = await response.json();
    const mangaList = json.data || [];

    const processed = mangaList.map((manga) => {
      const coverRel = manga.relationships.find((r) => r.type === "cover_art");
      const coverFileName = coverRel?.attributes?.fileName;
      // Sử dụng ảnh chất lượng cao (.512.jpg) cho thẻ banner lớn
      const coverUrl = coverFileName
        ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.512.jpg`
        : "https://res.cloudinary.com/rimebiqz/image/upload/v1783914527/TEST_svywnr.jpg";

      const title =
        manga.attributes.title?.en ||
        (manga.attributes.title && Object.values(manga.attributes.title)[0]) ||
        "Unknown Title";
      const tags = manga.attributes.tags || [];

      return {
        id: manga.id,
        title,
        cover: coverUrl,
        tags: tags.slice(0, 5).map((t) => t.attributes.name.en.toUpperCase()),
      };
    });

    luuDuLieuCache(cacheKey, processed);
    return processed;
  } catch (error) {
    console.error("Lỗi khi lấy truyện trending theo tag:", error);
    return [];
  }
}
