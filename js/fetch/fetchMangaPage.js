import { ChuyenLocale } from "../utility.js";

export async function LayThongTinManga(mangaId) {
  try {
    const url = `https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Không tìm thấy truyện");
    const result = await response.json();
    const attr = result.data.attributes;
    const rels = result.data.relationships;

    return {
      mangaId,
      title: Object.values(attr.title || {})[0],
      englishTitle: attr.altTitles?.find((item) => item.en)?.en || "",
      altTitles: attr.altTitles || [],
      relations: {
        author: rels.find((r) => r.type === "author")?.attributes?.name || "Unknown",
        artist: rels.find((r) => r.type === "artist")?.attributes?.name || "Unknown",
      },
      externalLinks: attr.links || {},
      cover: `https://uploads.mangadex.org/covers/${mangaId}/${rels.find((r) => r.type === "cover_art")?.attributes?.fileName}`,
      tags: attr.tags || [],
      status: attr.status,
      demographic: attr.publicationDemographic,
      desc: attr.description?.en || attr.description?.ja || "No description available",
    };
  } catch (error) {
    console.error(error);
  }
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " years ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " months ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " days ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hours ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minutes ago";
  return "Just now";
}

export async function LayDanhSachChapter(mangaId, offset = 0) {
  try {
    const url = `https://api.mangadex.org/manga/${mangaId}/feed?limit=500&offset=${offset}&includes[]=scanlation_group&includes[]=user&order[volume]=desc&order[chapter]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;

    const response = await fetch(url);
    const result = await response.json();
    const rawChapters = result.data;

    const groupedData = {};
    rawChapters.forEach((ch) => {
      const attr = ch.attributes;
      const rels = ch.relationships;
      const vol = attr.volume || "No Volume";
      const chapNum = attr.chapter || "0";

      if (!groupedData[vol]) groupedData[vol] = {};
      if (!groupedData[vol][chapNum]) groupedData[vol][chapNum] = [];

      groupedData[vol][chapNum].push({
        id: ch.id,
        title: attr.title || "",
        chapter: attr.chapter,
        language: attr.translatedLanguage,
        countryCode: ChuyenLocale(attr.translatedLanguage),
        groupName: rels.find((r) => r.type === "scanlation_group")?.attributes?.name || "No Group",
        uploader: rels.find((r) => r.type === "user")?.attributes?.username || "Unknown",
        publishDate: formatTimeAgo(attr.publishDate),
      });
    });
    return groupedData;
  } catch (e) {
    console.error("Lỗi lấy chapter:", e);
    return null;
  }
}
