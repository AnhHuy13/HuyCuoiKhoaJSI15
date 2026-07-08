export async function fetchManga(query, limit) {
  const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art`;

  const response = await fetch(url);
  const json = await response.json();

  return json.data.map((manga) => {
    const coverRelationship = manga.relationships.find((rel) => rel.type === "cover_art");
    const fileName = coverRelationship?.attributes?.fileName;
    const coverUrl = fileName
      ? `https://uploads.mangadex.org/covers/${id}/${fileName}.256.jpg`
      : "default-placeholder.jpg";

    return {
      id: manga?.id,
      title: manga?.attributes?.title?.en || Object.values(manga.attributes.title)[0],
      coverUrl: coverUrl,
      status: manga?.attributes?.status,
    };
  });
}
