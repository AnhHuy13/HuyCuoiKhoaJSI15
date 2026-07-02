/**
 * Chuyển từ mã Locale sang mã Quốc gia
 * Nếu Locale không hợp lệ hoặc không đổi được thì chuyển về 'un'
 * @param {string} code
 * @returns {string}
 */

export function ChuyenLocale(code) {
  if (!code || typeof code !== "string") return "un";

  try {
    const locale = new Intl.Locale(code).maximize();
    const region = locale.region?.toLowerCase();

    return region || "un";
  } catch (e) {
    console.error("Lỗi chuyển từ Locale sang Mã Quốc gia:", code, e);
    return "un";
  }
}

/**
 * Để Volume và Chapter cho dễ nhìn
 * thành "Vol. {volume} Ch. {chapter}"
 * hoặc "Vol. {volume}" , "Ch. {Chapter}"
 * không có thì ""
 * @param {number} volume
 * @param {number} chapter
 * @param {boolean} includeMinus Có include "-" hay không
 * @returns {string}
 */

export function StringVolumeAndChapter(volume, chapter, includeMinus) {
  if (includeMinus) {
    if (chapter && volume) {
      return `Vol. ${volume} Ch. ${chapter} - `;
    } else if (!chapter && volume) {
      return `Vol. ${volume} - `;
    } else if (!volume && chapter) {
      return `Ch. ${chapter} - `;
    } else if (!volume && !chapter) {
      return "";
    }
  } else if (!includeMinus) {
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
}

export async function getCoverUrls(mangaIds) {
  const uniqueMangaIds = [...new Set(mangaIds.filter(Boolean))];

  if (uniqueMangaIds.length === 0) {
    return {};
  }

  const response = await fetch(
    `https://api.mangadex.org/manga?includes[]=cover_art&ids[]=${uniqueMangaIds.join("&ids[]=")}`,
  );
  const responseData = await response.json();
  console.log("getCoverUrls: ");
  console.log(responseData);
  const mangaList = responseData.data;

  const coverUrlMap = {};

  for (const manga of mangaList) {
    const relationships = manga.relationships || [];
    const coverArtRelationship = relationships.find(
      (relationship) => relationship.type === "cover_art",
    );

    const fileName = coverArtRelationship?.attributes?.fileName;

    if (fileName) {
      coverUrlMap[manga.id] = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
    } else {
      coverUrlMap[manga.id] = null;
    }
  }

  return coverUrlMap;
}
