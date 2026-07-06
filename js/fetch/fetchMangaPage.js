export async function LayThongTinManga(mangaId) {
  try {
    const url = `https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: Không tìm thấy truyện`);
    }

    const result = await response.json();
    const data = result?.data;
    const attr = data?.attributes;
    const rels = data?.relationships || [];

    const author = rels.find((r) => r.type === "author")?.attributes?.name;
    const artist = rels.find((r) => r.type === "artist")?.attributes?.name;
    const coverFileName = rels.find((r) => r.type === "cover_art")?.attributes?.fileName;

    return {
      mangaId,
      title: Object.values(attr?.title || {})[0],
      englishTitle: attr?.altTitles?.find((item) => item.en)?.en,
      altTitles: attr?.altTitles || [],

      relations: {
        author: author || "Unknown",
        artist: artist || "Unknown",
      },

      externalLinks: attr?.links || {},

      cover: coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}` : "",
      tags:
        attr?.tags?.map((tag) => ({
          name: tag?.attributes?.name?.en || "Unknown",
          id: tag?.id,
        })) || [],
      status: attr?.status,
      desc: attr?.description?.en || attr?.description?.ja || "No description available",
    };
  } catch (error) {
    console.error("Lỗi rồi: ", error);
  }
}
