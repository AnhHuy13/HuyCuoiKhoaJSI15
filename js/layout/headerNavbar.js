// js/layout/headerNavbar.js

const activePage = (() => {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("trangchu.html") || path.endsWith("/")) return "home";
  if (path.includes("favorite.html")) return "favorite";
  if (path.includes("readinghistory.html")) return "history";
  if (path.includes("account.html")) return "account";
  if (path.includes("lastestbook.html")) return "lastestBook";
  if (path.includes("advancedsearch.html")) return "advSearch";
  if (path.includes("list.html")) return "list";
  return "";
})();

const headerMarkup = `
  <div class="search-overlay" id="search-overlay"></div>
  <header class="navbar">
    <button class="toggle-menu-btn">
      <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914463/menu-white_qko9j7.svg" alt="" />
    </button>
    <a href="trangchu.html" class="brand-wrapper header-logo">
      <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914526/logo_wp43wq.png" alt="logo" class="logo-navbar" />
      <span>Manga.org</span>
    </a>

    <div class="search-box-container">
      <input type="text" placeholder="Search..." class="search-box" id="search-box" />
      <div class="search-query-container">
        <ul class="item-query-list" id="item-query-list">
          <li class="item-query">
            <div class="item-query-image"></div>
            <div class="item-query-info">
              <h1 class="item-query-name"></h1>
              <div class="item-query-stat">
                <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914434/star-f56540_khyczc.svg" alt="" />
                <p class="item-query-star-text"></p>
                <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914412/bookmark_khfizj.svg" alt="" />
                <p class="item-query-bookmark-text"></p>
                <img src="" alt="" />
              </div>
              <div class="item-query-status-container">
                <div class="item-query-status-dot"></div>
                <div class="item-query-status"></div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </header>

  <nav class="sidebar open">
    <a href="trangchu.html" class="brand-wrapper sidebar-logo">
      <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914526/logo_wp43wq.png" alt="logo" class="logo-navbar" />
      <span>Manga.org</span>
    </a>

    <ul class="nav-list">
        <li class="nav-item ${activePage === "home" ? "active" : ""}">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914483/home-white_tt5hfs.svg" alt="icon" class="icon-nav-link" />
            <a href="trangchu.html">Trang chủ</a>
        </li>

        <li class="nav-item ${activePage === "favorite" ? "active" : ""}" >
            <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%23FFFFFF'><path d='M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640h-80v280l-100-60-100 60v-280H240v640Zm0 0v-640 640Zm200-360 100-60 100 60-100-60-100 60Z'/></svg>" alt="icon" class="icon-nav-link" />
            <a href="favorite.html">Thư viện</a>
        </li>

        <li class="nav-item ${activePage === "history" ? "active" : ""}">
            <img 
              src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%23FFFFFF'><path d='M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z'/></svg>" 
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="readingHistory.html">Lịch sử đọc</a>
        </li>

        <li class="nav-item ${activePage === "lastestBook" ? "active" : ""}">
            <img
              src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914416/book_ro0m5e.svg"
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="lastestBook.html">Sách mới gần đây</a>
        </li>

        <li class="nav-item ${activePage === "advSearch" ? "active" : ""}">
            <img 
              src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23FFFFFF%22%3E%3Cpath%20d%3D%22M784-120%20532-372q-30%2024-69%2038t-83%2014q-109%200-184.5-75.5T120-580q0-109%2075.5-184.5T380-840q109%200%20184.5%2075.5T640-580q0%2044-14%2083t-38%2069l252%20252-56%2056ZM380-400q75%200%20127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75%200-127.5%2052.5T200-580q0%2075%2052.5%20127.5T380-400Z%22%2F%3E%3C%2Fsvg%3E" 
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="advancedSearch.html">Tìm kiếm nâng cao</a>
        </li>

        <li class="nav-item ${activePage === "list" ? "active" : ""}">
            <img 
              src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%23FFFFFF'><path d='M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z'/></svg>"
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="list.html">Danh sách đã lưu</a>
        </li>

        <li class="nav-item nav-item-bottom ${activePage === "account" ? "active" : ""}"> 
            <img
                src="https://res.cloudinary.com/rimebiqz/image/upload/co_rgb:000000,l_text:Arial_20_bold_normal_left:DEFAULT%250AAVATAR%2520/fl_layer_apply,fl_no_overflow,g_center,x_-50,y_19/defaul-avatar-1_yl9xfo.jpg"
                alt="Profile"
                class="avatar-icon"
                id="avatar-icon"
            />
            <a href="account.html">Tài khoản của bạn</a>
        </li>
    </ul>
  </nav>
`;

document.body.insertAdjacentHTML("afterbegin", headerMarkup);

async function updateNavbarAvatar() {
  try {
    const { isLogin, readFirebaseKey } = await import("../database/firebase.js");

    const user = await isLogin();
    const avatarIcon = document.getElementById("avatar-icon");
    if (!avatarIcon) return;

    if (user) {
      const dbAvatar = await readFirebaseKey(user.uid, "avatar");
      if (dbAvatar) {
        avatarIcon.src = dbAvatar;
      }
    }
  } catch (error) {
    console.warn("Không thể tải thông tin avatar động (Vẫn giữ avatar mặc định):", error);
  }
}

updateNavbarAvatar();
