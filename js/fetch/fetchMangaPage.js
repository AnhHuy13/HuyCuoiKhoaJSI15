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
