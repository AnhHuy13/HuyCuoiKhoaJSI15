export async function LayThongTinManga(mangaId) {
  try {
    const response = await fetch(
      `https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art&includes[]=author`,
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: Không tìm thấy truyện`);
    }

    const result = await response.json();
    console.log(result);

    const dataChain = result?.data?.attributes;
    const tags =
      dataChain?.tags?.map((tag) => ({
        name: tag?.attributes?.name?.en || "Unknown",
        id: tag?.id,
      })) || [];

    return {
      mangaId: mangaId,
      title: Object.values(dataChain?.title)[0],
      englishTitle: dataChain?.altTitles?.find((item) => item.en)?.en,
      author: result?.data?.relationships?.find((relationship) => relationship.type === "author")
        ?.attributes?.name,
      cover:
        "https://uploads.mangadex.org/covers/" +
        mangaId +
        "/" +
        (result?.data?.relationships?.find((i) => i.type === "cover_art")?.attributes?.fileName ??
          ""),
      tags: tags,
    };
  } catch (error) {
    console.error("Lỗi : ", error);
  }
}
