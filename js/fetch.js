import { ChuyenLocale } from "./utility.js";

const params = new URLSearchParams(window.location.search);
let mangaId = params.get("mangaId");
let chapterId = params.get("chapterId");
let mangaMaxPage = 0;
let mangaLinkFileArray;

function DoiThanhMangaLinkFileArray(baseUrl, hash, fileArray) {
  if (!fileArray || !hash || !baseUrl) return [];
  return fileArray.map((filename) => `${baseUrl}/data/${hash}/${filename}`);
}

function StringVolumeAndChapter(volume, chapter) {
  if (chapter && volume) {
    return `Vol. ${volume} Ch. ${chapter}`;
  } else if (!chapter && volume) {
    return `Vol. ${volume}`;
  } else if (!volume && chapter) {
    return `Ch. ${chapter}`;
  } else if (!volume && !chapter) {
    return "";
  }
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
        `https://api.mangadex.org/manga?order[followedCount]=desc&year=2021&contentRating[]=safe&limit=${limit}&includes[]=cover_art`,
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
    if (limit) {
      const response = await fetch(
        `https://api.mangadex.org/chapter?order[publishAt]=desc&includes[]=manga&includes[]=cover_art&includes[]=scanlation_group&limit=${limit}`,
      );
      const result = await response.json();
      console.log(result);

      if (!response.ok) {
        throw new Error(`error status code ${response.status}`);
      }

      return result?.data?.map((manga) => {
        const mangaChain = manga?.relationships?.find((i) => i.type === "manga")?.attributes;
        const scanlationChain = manga?.relationships?.find(
          (i) => i.type === "scanlation_group",
        )?.attributes;

        let chapter = manga?.attributes?.chapter;
        let volume = manga?.attributes?.volume;

        return {
          titleManga: Object.values(mangaChain?.title)[0],
          titleChapter: manga?.attributes?.title,
          chapter: chapter,
          volume: volume,
          volumeChapterStr: StringVolumeAndChapter(volume, chapter),
          translatedLanguage: ChuyenLocale(manga?.attributes?.translatedLanguage),
          scanlationGroup: scanlationChain?.name,
        };
      });
    } else {
      throw new Error("not enough argumen (no limit)");
    }
  } catch (error) {
    console.error("error!!! : " + error);
  }
}

const data = await LayLatestUpdate(5);
console.log(data);
