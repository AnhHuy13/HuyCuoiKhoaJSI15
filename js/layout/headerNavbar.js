// js/layout/headerNavbar.js

const activePage = (() => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("trangchu.html") || path.endsWith("/")) return "home";
  if (path.endsWith("favorite.html")) return "favorite";
  if (path.endsWith("readinghistory.html")) return "history"; // Nhận diện khi ở trang Lịch sử đọc
  if (path.endsWith("account.html")) return "account";
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
        <li class="nav-item">
            <img
              src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914416/book_ro0m5e.svg"
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="">Sách mới gần đây</a>
        </li>
        <li class="nav-item">
            <img 
              src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%23FFFFFF'><path d='M440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6q47 0 91.5 10.5T440-278Zm40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q74 0 126 17t112 52q11 6 16.5 14t5.5 21v418q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-481q15 5 29.5 11t28.5 14q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm140-240v-440l120-40v440l-120 40Zm-340-99Z'/></svg>" 
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="">Sách mới cập nhật</a>
        </li>
        <li class="nav-item">
            <img 
              src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23FFFFFF%22%3E%3Cpath%20d%3D%22M784-120%20532-372q-30%2024-69%2038t-83%2014q-109%200-184.5-75.5T120-580q0-109%2075.5-184.5T380-840q109%200%20184.5%2075.5T640-580q0%2044-14%2083t-38%2069l252%20252-56%2056ZM380-400q75%200%20127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75%200-127.5%2052.5T200-580q0%2075%2052.5%20127.5T380-400Z%22%2F%3E%3C%2Fsvg%3E" 
              alt="icon" 
              class="icon-nav-link" 
            />
            <a href="advancedSearch.html">Tìm kiếm nâng cao</a>
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
