import { ChuyenLocale, StringVolumeAndChapter } from "../helper/utility.js";

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

      if (!response.ok) {
        throw new Error(`error, status code: ${response.status}`);
      }

      const chapterChain = result?.data?.attributes;
      const mangaRelationship = result?.data?.relationships?.find((item) => item.type === "manga");
      const mangaChain = mangaRelationship?.attributes;
      const scanlationChain = result?.data?.relationships?.find(
        (item) => item.type === "scanlation_group",
      )?.attributes;

      const tags = mangaChain?.tags || [];
      const isLongStrip = tags.some(
        (tag) =>
          tag.id === "3e2b8dae-350e-4ab8-a907727d55a4" ||
          tag.attributes?.name?.en?.toLowerCase() === "long strip",
      );

      return {
        chapterInfo: {
          name: chapterChain?.title,
          chapter: chapterChain?.chapter,
          volume: chapterChain?.volume,
          translatedLanguage: ChuyenLocale(chapterChain?.translatedLanguage),
          volumeChapterStr: StringVolumeAndChapter(chapterChain?.chapter, chapterChain?.volume),
        },
        mangaInfo: {
          name: Object.values(mangaChain?.title || {})[0] || "Unknown Manga",
          originalLanguage: (ChuyenLocale(mangaChain?.originalLanguage) || "un").toLowerCase(),
          isLongStrip: isLongStrip,
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
