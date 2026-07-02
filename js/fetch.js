import { ChuyenLocale, StringVolumeAndChapter, getCoverUrls } from "./utility.js";

const params = new URLSearchParams(window.location.search);
let mangaId = params.get("mangaId");
let chapterId = params.get("chapterId");
let mangaMaxPage = 0;
let mangaLinkFileArray;

function DoiThanhMangaLinkFileArray(baseUrl, hash, fileArray) {
  if (!fileArray || !hash || !baseUrl) return [];
  return fileArray.map((filename) => `${baseUrl}/data/${hash}/${filename}`);
}

export async function LayArrayHinhManga(mangaId, chapterId) {
  try {
    if (mangaId && chapterId) {
      const response = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      const result = await response.json();
      console.log(result);

      if (!response.ok) {
        throw new Error(`error ,status code : ${response.status}`);
      }

      mangaLinkFileArray = DoiThanhMangaLinkFileArray(
        result?.baseUrl,
        result?.chapter?.hash,
        result?.chapter?.data,
      );

      mangaMaxPage = result?.chapter?.data.length - 1;
      console.log(mangaMaxPage);
      console.log("Thành công");
      return {
        FileArray: mangaLinkFileArray,
        MaxPage: mangaMaxPage,
      };
    } else {
      throw new Error("not enough arguments");
    }
  } catch (error) {
    console.error("error!!! : " + error);
  }
}

export async function LayThongTinChapter(chapterId) {
  try {
    if (chapterId) {
      const response = await fetch(
        `https://api.mangadex.org/chapter/${chapterId}?includes[]=manga&includes[]=scanlation_group`,
      );
      const result = await response.json();

      console.log(result);

      if (!response.ok) {
        throw new Error(`error, status code: ${response.status}`);
      }

      const chapterChain = result?.data?.attributes;
      const mangaChain = result?.data?.relationships?.find(
        (item) => item.type === "manga",
      )?.attributes;
      const scanlationChain = result?.data?.relationships?.find(
        (item) => item.type === "scanlation_group",
      )?.attributes;

      return {
        chapterInfo: {
          name: chapterChain?.title,
          chapter: chapterChain?.chapter,
          volume: chapterChain?.volume,
          translatedLanguage: ChuyenLocale(chapterChain?.translatedLanguage),
          volumeChapterStr: StringVolumeAndChapter(chapterChain?.chapter, chapterChain?.volume),
        },
        mangaInfo: {
          name:
            mangaChain?.altTitles?.find((item) => item.vi)?.vi ??
            mangaChain?.title?.vi ??
            Object.values(mangaChain?.title)[0],
          originalLanguage: (ChuyenLocale(mangaChain?.originalLanguage) || "un").toLowerCase(),
        },
        scanlationInfo: {
          name: scanlationChain?.name,
        },
      };
    } else {
      throw new Error("not enough arguments");
    }
  } catch (error) {
    console.error("error!!! : " + error);
  }
}

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

      console.log(result);

      return result?.data?.map((manga) => {
        return {
          title:
            manga?.attributes?.altTitles?.find((item) => item.vi)?.vi ??
            Object.values(manga?.attributes?.title)[0] ??
            "Chưa có tên bộ truyện",

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
  try {
    const chapterUrl = `https://api.mangadex.org/chapter?includes[]=manga&includes[]=scanlation_group&order[readableAt]=desc&limit=${limit * 10}`;
    const chapterResponse = await fetch(chapterUrl);
    const chapterJson = await chapterResponse.json();
    console.log(chapterJson.data);
    const chaptersData = chapterJson.data;

    const uniqueChapters = [];
    const seenMangaIds = new Set();

    for (const chapter of chaptersData) {
      const attributes = chapter.attributes;

      const isInvalid =
        attributes.chapter === null || attributes.title === null || attributes.volume === null;
      if (isInvalid) continue;

      const mangaRelationship = chapter.relationships.find(
        (relationship) => relationship.type === "manga",
      );
      const mangaId = mangaRelationship?.id;

      if (mangaId && !seenMangaIds.has(mangaId)) {
        uniqueChapters.push({ chapter, mangaId });
        seenMangaIds.add(mangaId);
      }

      if (uniqueChapters.length === limit) break;
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

      console.log(groupRelationship?.attributes);

      return {
        mangaId: item.mangaId,
        chapterId: item.chapter.id,
        titleManga: Object.values(mangaRelationship?.attributes?.title),
        titleChapter: attributes.title,
        chapter: attributes.chapter,
        volume: attributes.volume,
        volumeChapterStr: StringVolumeAndChapter(attributes.chapter, attributes.volume, false),
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
