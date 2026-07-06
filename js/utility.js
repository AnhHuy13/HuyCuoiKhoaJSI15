/**
 * Chuyển từ mã Locale sang mã Quốc gia
 * Nếu Locale không hợp lệ hoặc không đổi được thì chuyển về 'un'
 * @param {string} code
 * @returns {string}
 */

const ngonNguMapping = {
  "es-la": "mx", // tiếng tây ban nha latinh
  "ja-ro": "jp", // tiếng nhật latinh (romaji)
  "ko-ro": "kr", // tiếng hàn latinh (romaji)
  "zh-ro": "cn", // tiếng trung latinh (romaji)
  "zh-hk": "hk", // tiếng trung hồng kông
  "zh-hans": "cn", // tiếng trung giản thể
  "zh-hant": "tw", // tiếng trung phồn thể
  "pt-br": "br", // tiếng bồ đào nha brazil
};

export function ChuyenLocale(code) {
  if (!code || typeof code !== "string") return "un";

  const normalizedCode = code.trim().toLowerCase();
  if (ngonNguMapping[normalizedCode]) {
    return ngonNguMapping[normalizedCode];
  }

  try {
    const locale = new Intl.Locale(normalizedCode).maximize();
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

/**
 * Làm cho chữ bự nhất có thể mà không bị overflow
 * Chỉ áp dụng cho phần tử con đầu tiên của container
 * @param {string|HTMLElement} containerSelector
 * @param {string|null} newText
 * @param {boolean} autoResize
 * @param {number} resizeScale
 */
export function fitTextToBox(containerSelector, newText = null, autoResize = false, options = {}) {
  const container =
    typeof containerSelector === "string"
      ? document.querySelector(containerSelector)
      : containerSelector;

  if (!container) {
    console.error("fitTextToBox: container not found", containerSelector);
    return null;
  }

  const textEl = container.firstElementChild;
  if (!textEl) {
    console.error("fitTextToBox: no child element found inside container", container);
    return null;
  }

  if (newText !== null && newText !== undefined) {
    textEl.innerText = String(newText);
  }

  const config =
    typeof options === "number"
      ? {
          minSize: 12,
          maxSize: 72,
          scale: options,
          lineHeight: 1.1,
          maxHeight: null,
        }
      : {
          minSize: 12,
          maxSize: 72,
          scale: 1,
          lineHeight: 1.1,
          maxHeight: null,
          ...options,
        };

  const resizeText = () => {
    textEl.style.display = "block";
    textEl.style.whiteSpace = "normal";
    textEl.style.wordBreak = "break-word";
    textEl.style.overflowWrap = "anywhere";
    textEl.style.lineHeight = `${config.lineHeight}`;
    textEl.style.margin = "0";
    textEl.style.padding = "0";
    textEl.style.width = "100%";

    const minSize = Math.max(12, config.minSize || 12);
    const maxSize = Math.max(minSize + 1, config.maxSize || 72);
    const containerWidth = container.clientWidth || container.getBoundingClientRect().width || 300;
    const containerHeight =
      container.clientHeight ||
      parseFloat(getComputedStyle(container).maxHeight) ||
      container.getBoundingClientRect().height ||
      120;
    const maxHeight = Math.max(24, config.maxHeight || containerHeight);

    let bestSize = minSize;
    let low = minSize;
    let high = maxSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      textEl.style.fontSize = `${mid}px`;

      const fitsWidth = textEl.scrollWidth <= containerWidth + 1;
      const fitsHeight = textEl.scrollHeight <= maxHeight + 1;

      if (fitsWidth && fitsHeight) {
        bestSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const finalSize = Math.max(minSize, bestSize);
    const scaledSize = Math.max(minSize, Math.floor(finalSize * config.scale));
    textEl.style.fontSize = `${scaledSize}px`;
    return scaledSize;
  };

  const finalSize = resizeText();

  if (!autoResize || typeof ResizeObserver === "undefined") {
    return finalSize;
  }

  let scheduled = false;
  const resizeObserver = new ResizeObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      resizeText();
      scheduled = false;
    });
  });

  resizeObserver.observe(container);
  return resizeObserver;
}

export function vietHoaChuCaiDauTien(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
