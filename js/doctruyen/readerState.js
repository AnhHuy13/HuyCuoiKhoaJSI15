const params = new URLSearchParams(window.location.search);

export const state = {
  mangaId: params.get("mangaId"),
  chapterId: params.get("chapterId"),
  mangaCurrentPage: 0,
  mangaMaxPage: 0,
  mangaLinkFileArray: [],
  allChaptersInLanguage: [],
  isLoadingContext: true,
  isLongStrip: false,
  originalLanguage: "",
  currentMode: "paginated",
  isDraggingSlider: false,
};
