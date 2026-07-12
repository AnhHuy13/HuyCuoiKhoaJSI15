const activePage = (() => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("trangchu.html") || path.endsWith("/")) return "home";
  if (path.endsWith("manga.html")) return "manga";
  return "";
})();

const headerMarkup = `
  <div class="search-overlay" id="search-overlay"></div>
  <header class="navbar">
    <button class="toggle-menu-btn">
      <img src="../image/icon/menu/menu-white.svg" alt="" />
    </button>
    <a href="trangchu.html" class="brand-wrapper header-logo">
      <img src="../image/logo.png" alt="logo" class="logo-navbar" />
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
                <img src="../image/icon/star/star-f56540.svg" alt="" />
                <p class="item-query-star-text"></p>
                <img src="../image/icon/bookmark.svg" alt="" />
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
      <img src="../image/logo.png" alt="logo" class="logo-navbar" />
      <span>Manga.org</span>
    </a>

    <ul class="nav-list">
      <li class="nav-item ${activePage === "home" ? "active" : ""}">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiRo5RsazUIy3LPn-DG57NPTKgVyRcUqqJODFRmkEdbg&s=10"
          alt="Profile"
          class="avatar-icon"
          id="avatar-icon"
        />
        <a href="account.html">Tài khoản của bạn</a>
      </li>
      <li class="nav-item ${activePage === "home" ? "active" : ""}">
        <img src="../image/icon/home/home-white.svg" alt="icon" class="icon-nav-link" />
        <a href="trangchu.html">Trang chủ</a>
      </li>
      <li class="nav-item ${activePage === "manga" ? "active" : ""}">
        <img src="../image/icon/bookmark.svg" alt="icon" class="icon-nav-link" />
        <a href="trangchu.html">Yêu thích</a>
      </li>
      <li class="nav-item">
        <a href="trangchu.html">Cập nhật</a>
      </li>
      <li class="nav-item">
        <a href="trangchu.html">Thư viện</a>
      </li>
      <li class="nav-item">
        <a href="trangchu.html">Lịch sử đọc</a>
      </li>
      <li class="nav-item">
        <img src="../image/icon/book.svg" alt="icon" class="icon-nav-link" />
        <a href="trangchu.html">Sách</a>
      </li>
      <li class="nav-item">
        <a href="trangchu.html">Sách mới gần đây</a>
      </li>
      <li class="nav-item">
        <a href="trangchu.html">Sách mới cập nhật</a>
      </li>
    </ul>
  </nav>
`;

document.body.insertAdjacentHTML("afterbegin", headerMarkup);
