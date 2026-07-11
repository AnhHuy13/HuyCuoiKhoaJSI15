export async function fetchManga(query, limit) {
  const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art`;
  const response = await fetch(url);
  const json = await response.json();

  if (!json.data || json.data.length === 0) return [];

  const mangaIds = json.data.map((manga) => manga.id);

  const statsUrl = `https://api.mangadex.org/statistics/manga?manga[]=${mangaIds.join("&manga[]=")}`;
  const statsResponse = await fetch(statsUrl);
  const statsJson = await statsResponse.json();
  const statistics = statsJson.statistics;

  return json.data.map((manga) => {
    const mangaId = manga.id;
    const stats = statistics[mangaId];

    const coverRelationship = manga.relationships.find((rel) => rel.type === "cover_art");
    const fileName = coverRelationship?.attributes?.fileName;
    const coverUrl = fileName
      ? `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.256.jpg`
      : "default-placeholder.jpg";

    return {
      id: mangaId,
      title: manga?.attributes?.title?.en || Object.values(manga.attributes.title)[0],
      coverUrl: coverUrl,
      status: manga?.attributes?.status,
      rating: stats?.rating?.average.toFixed(2) || 0,
      follows: stats?.follows || 0,
    };
  });
}
