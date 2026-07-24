export function updateURLFromFilters(filters, currentPage) {
  const urlParams = new URLSearchParams();

  if (filters.title) urlParams.set("title", filters.title);
  if (filters.sort && filters.sort !== "none") urlParams.set("sort", filters.sort);

  if (filters.includedTags && filters.includedTags.length > 0) {
    urlParams.set("includedTags", filters.includedTags.join(","));
  }
  if (filters.excludedTags && filters.excludedTags.length > 0) {
    urlParams.set("excludedTags", filters.excludedTags.join(","));
  }

  if (filters.includedTagsMode) urlParams.set("incMode", filters.includedTagsMode);
  if (filters.excludedTagsMode) urlParams.set("excMode", filters.excludedTagsMode);

  if (filters.contentRating && filters.contentRating.length > 0) {
    urlParams.set("contentRating", filters.contentRating.join(","));
  }
  if (filters.demographic && filters.demographic.length > 0) {
    urlParams.set("demographic", filters.demographic.join(","));
  }

  if (filters.authorName) urlParams.set("author", filters.authorName);
  if (filters.artistName) urlParams.set("artist", filters.artistName);

  if (filters.originalLanguage) {
    if (Array.isArray(filters.originalLanguage)) {
      if (filters.originalLanguage.length > 0) {
        urlParams.set("originalLanguage", filters.originalLanguage.join(","));
      }
    } else if (filters.originalLanguage !== "all") {
      urlParams.set("originalLanguage", filters.originalLanguage);
    }
  }

  if (filters.year) urlParams.set("year", filters.year);
  if (filters.status && filters.status !== "any") urlParams.set("status", filters.status);
  if (filters.hasTranslatedChapters) urlParams.set("hasTranslated", "true");

  if (filters.translatedLanguage) {
    if (Array.isArray(filters.translatedLanguage)) {
      if (filters.translatedLanguage.length > 0) {
        urlParams.set("translatedLanguage", filters.translatedLanguage.join(","));
      }
    } else if (filters.translatedLanguage !== "any") {
      urlParams.set("translatedLanguage", filters.translatedLanguage);
    }
  }

  if (currentPage > 1) {
    urlParams.set("page", currentPage);
  }

  const newRelativeQuery = window.location.pathname + "?" + urlParams.toString();
  window.history.pushState(null, "", newRelativeQuery);
}

export function parseFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const filters = {};

  if (urlParams.has("title")) filters.title = urlParams.get("title");
  if (urlParams.has("sort")) filters.sort = urlParams.get("sort");
  if (urlParams.has("includedTags"))
    filters.includedTags = urlParams.get("includedTags").split(",");
  if (urlParams.has("excludedTags"))
    filters.excludedTags = urlParams.get("excludedTags").split(",");
  if (urlParams.has("incMode")) filters.includedTagsMode = urlParams.get("incMode");
  if (urlParams.has("excMode")) filters.excludedTagsMode = urlParams.get("excMode");
  if (urlParams.has("contentRating"))
    filters.contentRating = urlParams.get("contentRating").split(",");
  if (urlParams.has("demographic")) filters.demographic = urlParams.get("demographic").split(",");
  if (urlParams.has("author")) filters.authorName = urlParams.get("author");
  if (urlParams.has("artist")) filters.artistName = urlParams.get("artist");

  if (urlParams.has("originalLanguage")) {
    const val = urlParams.get("originalLanguage");
    filters.originalLanguage = val.includes(",") ? val.split(",") : [val];
  }

  if (urlParams.has("year")) filters.year = parseInt(urlParams.get("year"));
  if (urlParams.has("status")) filters.status = urlParams.get("status");
  if (urlParams.has("hasTranslated"))
    filters.hasTranslatedChapters = urlParams.get("hasTranslated") === "true";

  if (urlParams.has("translatedLanguage")) {
    const val = urlParams.get("translatedLanguage");
    filters.translatedLanguage = val.includes(",") ? val.split(",") : [val];
  }

  if (urlParams.has("page")) filters.page = parseInt(urlParams.get("page"));

  return filters;
}

export function hydrateUIFromURL(tagStates) {
  const parsed = parseFiltersFromURL();
  if (Object.keys(parsed).length === 0) return false;

  if (parsed.title) {
    document.getElementById("main-search-input").value = parsed.title;
    document.getElementById("clear-search-btn").style.display = "block";
  }
  if (parsed.sort) document.getElementById("filter-sort").value = parsed.sort;
  if (parsed.includedTagsMode) {
    document.getElementById("filter-tags-mode").value = parsed.includedTagsMode;
  }
  if (parsed.excludedTagsMode) {
    document.getElementById("filter-tags-exclusion-mode").value = parsed.excludedTagsMode;
  }
  if (parsed.contentRating && parsed.contentRating.length > 0) {
    document.getElementById("filter-content-rating").value = parsed.contentRating[0];
  }
  if (parsed.demographic && parsed.demographic.length > 0) {
    document.getElementById("filter-demographic").value = parsed.demographic[0];
  }
  if (parsed.authorName) document.getElementById("filter-author").value = parsed.authorName;
  if (parsed.artistName) document.getElementById("filter-artist").value = parsed.artistName;
  if (parsed.year) document.getElementById("filter-year").value = parsed.year;
  if (parsed.status) document.getElementById("filter-status").value = parsed.status;

  if (parsed.hasTranslatedChapters) {
    document.getElementById("filter-has-translated").checked = true;
    document.getElementById("translated-lang-wrapper").style.display = "block";
  }

  if (parsed.originalLanguage) {
    selectedOriginalLanguages = parsed.originalLanguage;
  }
  if (parsed.translatedLanguage) {
    selectedTranslatedLanguages = parsed.translatedLanguage;
  }

  if (parsed.includedTags) {
    parsed.includedTags.forEach((id) => {
      tagStates[id] = "include";
    });
  }
  if (parsed.excludedTags) {
    parsed.excludedTags.forEach((id) => {
      tagStates[id] = "exclude";
    });
  }

  if (parsed.page) {
    currentPage = parsed.page;
  }

  return true;
}
