import { ChuyenLocale, StringVolumeAndChapter, getCoverUrls } from "../utility.js";

export async function LayMangaChoCarousel(limit) {
  try {
    if (limit) {
      const response = await fetch(
        `https://api.mangadex.org/manga?order[followedCount]=desc&year=2025&contentRating[]=safe&limit=${limit}&includes[]=cover_art`,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(`error status code ${response.status}`);
      }

      return result?.data?.map((manga) => {
        return {
          title:
            manga?.attributes?.altTitles?.find((item) => item.vi)?.vi ??
            Object.values(manga?.attributes?.title)[0] ??
            "Chưa có tên bộ truyện",
          id: manga?.id,

          desc:
            manga?.attributes?.description?.vi ??
            manga?.attributes?.description?.en ??
            manga?.attributes?.description?.ja ??
            "Chưa có mô tả",

          linkFileCover:
            "https://uploads.mangadex.org/covers/" +
            manga?.id +
            "/" +
            (manga?.relationships?.find((i) => i.type === "cover_art")?.attributes?.fileName ?? ""),

          originalLanguage: manga?.attributes?.originalLanguage,
          tags: manga?.attributes?.tags,
        };
      });
    } else {
      throw new Error("not enough argument (no limit)");
    }
  } catch (error) {
    console.error("error!!! : " + error);
  }
}

export async function LayLatestUpdate(limit) {
  let uniqueChapters = [];
  let seenMangaIds = new Set();
  let offset = 0;
  const BATCH_SIZE = 50;
  try {
    while (uniqueChapters.length < limit && offset < 500) {
      const chapterUrl = `https://api.mangadex.org/chapter?includes[]=manga&includes[]=scanlation_group&order[readableAt]=desc&limit=${BATCH_SIZE}&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive`;
      const chapterResponse = await fetch(chapterUrl);
      const chapterJson = await chapterResponse.json();

      for (const chapter of chapterJson.data) {
        const mangaId = chapter.relationships.find((r) => r.type === "manga")?.id;

        if (mangaId && !seenMangaIds.has(mangaId) && chapter.attributes.chapter !== null) {
          uniqueChapters.push({ chapter, mangaId });
          seenMangaIds.add(mangaId);
        }

        if (uniqueChapters.length === limit) break;
      }

      offset += BATCH_SIZE;
    }
    const mangaIds = uniqueChapters.map((item) => item.mangaId);
    const coverMap = await getCoverUrls(mangaIds);

    return uniqueChapters.map((item) => {
      const attributes = item.chapter.attributes;
      const groupRelationship = item.chapter.relationships.find(
        (relationship) => relationship.type === "scanlation_group",
      );
      const mangaRelationship = item.chapter.relationships.find(
        (relationship) => relationship.type === "manga",
      );

      return {
        mangaId: item.mangaId,
        chapterId: item.chapter.id,
        titleManga: Object.values(mangaRelationship?.attributes?.title),
        titleChapter: attributes.title,
        chapter: attributes.chapter,
        volume: attributes.volume,
        volumeChapterStr: StringVolumeAndChapter(attributes.chapter, attributes.volume, false),
        originalLanguage: attributes.translatedLanguage,
        locale: ChuyenLocale(attributes.translatedLanguage),
        scanlationGroup: groupRelationship?.attributes?.name,
        coverUrl: coverMap[item.mangaId],
      };
    });
  } catch (error) {
    console.error("Lỗi rồi:", error);
    return [];
  }
}

export async function fetchLatestSelfPublishedManga(limit) {
  const url = `https://api.mangadex.org/manga?includedTags[]=891cf039-b895-47f0-9229-bef4c96eccd4&order[createdAt]=desc&limit=${limit}&includes[]=cover_art`;

  const response = await fetch(url);
  const json = await response.json();
  if (!json.data || json.data.length === 0) return [];

  const mangaIds = json.data.map((m) => m.id);
  const statsUrl = `https://api.mangadex.org/statistics/manga?manga[]=${mangaIds.join("&manga[]=")}`;
  const statsResponse = await fetch(statsUrl);
  const statsJson = await statsResponse.json();

  return json.data.map((manga) => {
    const stats = statsJson.statistics[manga.id];
    const coverRel = manga.relationships.find((rel) => rel.type === "cover_art");
    const fileName = coverRel?.attributes?.fileName;

    return {
      id: manga.id,
      title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
      coverUrl: fileName
        ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`
        : "default.jpg",
      rating: stats?.rating?.average || 0,
      follows: stats?.follows || 0,
      createdAt: manga.attributes.createdAt,
    };
  });
}

console.log("self-published:");
console.log(await fetchLatestSelfPublishedManga(10));
