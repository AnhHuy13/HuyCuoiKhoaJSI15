import _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";
import { fetchManga } from "./fetch/fetchSearch.js";

const searchBox = document.querySelector("#search-box");
const itemQueryList = document.querySelector("#item-query-list");
const searchOverlay = document.querySelector("#search-overlay");
const queryContainer = document.querySelector(".search-query-container");

function toggleSearchDisplay(isOpen) {
  if (!queryContainer || !searchOverlay) return;
  if (isOpen) {
    queryContainer.classList.add("active");
    searchOverlay.classList.add("active");
  } else {
    queryContainer.classList.remove("active");
    searchOverlay.classList.remove("active");
  }
}

const debouncedSearch = _.debounce(async (query) => {
  console.log(`Đang gửi yêu cầu tìm kiếm cho: "${query}"`);

  try {
    const results = await fetchManga(query, 5);

    console.log("Dữ liệu trả về từ MangaDex:");
    console.table(results);

    InsertItemQuery(results);

    if (results && results.length > 0) {
      toggleSearchDisplay(true);
    } else {
      toggleSearchDisplay(false);
    }
  } catch (error) {
    console.error("Không thể lấy dữ liệu:", error);
    toggleSearchDisplay(false);
  }
}, 500);

function InsertItemQuery(mangaList) {
  itemQueryList.innerHTML = "";
  let template = "";

  mangaList.forEach((data) => {
    template += `
      <li class="item-query" onclick="window.location.href='../html/manga.html?mangaId=${data.id}'">
        <div class="item-query-image" style="background-image: url('${data.coverUrl}'); background-size: cover; background-position: center;"></div>
        <div class="item-query-info">
          <h1 class="item-query-name">
            ${data.title}
          </h1>
          <div class="item-query-stat">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914434/star-f56540_khyczc.svg" alt="" />
            <p class="item-query-star-text">${data.rating}</p>
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914412/bookmark_khfizj.svg" alt="" />
            <p class="item-query-bookmark-text">${data.follows}</p>
            <img src="" alt="" />
          </div>
          <div class="item-query-status-container">
            <div class="item-query-status-dot"></div>
            <div class="item-query-status">${data.status}</div>
          </div>
        </div>
      </li>
    `;
  });

  itemQueryList.insertAdjacentHTML("beforeend", template);
}

if (searchBox && searchBox.value.trim() === "") {
  toggleSearchDisplay(false);
}

if (searchBox) {
  searchBox.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (query === "") {
      debouncedSearch.cancel();
      itemQueryList.innerHTML = "";
      toggleSearchDisplay(false);
      return;
    }

    console.log(`Người dùng gõ: "${query}"...`);
    debouncedSearch(query);
  });

  searchBox.addEventListener("focus", () => {
    if (searchBox.value.trim() !== "" && itemQueryList.children.length > 0) {
      toggleSearchDisplay(true);
    }
  });
}

if (searchOverlay) {
  searchOverlay.addEventListener("click", () => {
    toggleSearchDisplay(false);
  });
}
