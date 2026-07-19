const activePage = (() => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("trangchu.html") || path.endsWith("/")) return "home";
  if (path.endsWith("favorite.html")) return "favorite";
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
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAADT0lEQVR4AeycMW4UURBEPdwBSC05gyPgxIGRLHwCjFMnCBw44QpOkOyAhBQfgUVkBDiHkASJDARHQFqqrZ9YYufjrR5q/kytupnFf/p3Vz11aN/a8EfqgAFI7d/YMAADEDsgbu8NMACxA+L23gADEDsgbp++Acvlcg95jnyP/I5sPUJDaAlNe9m8UgHA6TcYcIF8hnyIvItsPUJDaAlNi6IxTVMaAAy2xFQHyPEHN+FB0crdUqpTAGCg5+W+2TyyNNMAMMgDuH6GnFucFe2UbhoAuj9GzjVo7RkA7s3VfeimtWcAuI9B5hq09gwAt/vc75I/fb3WOauNV7mzV3ul9uo4A8DVRf5nPQcMYD3f0qoMIM3K9S4ygPV8S6v6jwDSZp7URQYgxmkABiB2QNzeG2AAYgfE7b0BBiB2QNzeG2AAYgfE7b0BAwOoXW8ANYcGPjeAgQ2uXW8ANYcGPjeAgQ2uXW8ANYcGPjeAgQ2uXT9FAF8h+lHJ+I6v442pATjpum4LuSi5BetPkKONqQB4DYc3YfpLPK9F+dkmfhjv4DGuaB3AR9i5D5OPkN/w/a8RZ8gjHO4jowaPcUSrAH7BvhfIHRj7Fs/rseJ/5d0dHEdt3IGv2mgRQPwWzi7MPEX+vql9UYM8Rd0uMu7CQxfNAYB5h8hPrGVxB/KQvYetbw4AK3hs9QYgJmIABiB2QNzeG2AAYgfE7b0BBiB2QNw+cQPEShptbwBicAZgAGIHxO29AQYgdkDc3htgAGIHxO29AQYgdkDc3htAAmDLDYB1kKw3ANJAttwAWAfJegMgDWTLDYB1kKw3ANJAttwAWAfJegMgDWTLDYB1kKw3ANJAtrxNAKzqEdUbgBiGARiA2AFxe2+AAYgdELfP2IAffRqWjX/6tOGsVzvOq5EB4HO1y3RfoLVnAPgyXX+rymjtGQDeVcec7gu0dhpA13UxxMV0PV6p7KJoX/nCvxzcAMDq6zDIk9Wn0zzJ0pwCICzGQB2ex8ipx3HRmqIzDUBMg8HO8dxGvkJ+QP5Eth6hIbSEpu2iMU1TKoCYCgNeIp8i4y+Z3MGz9QgNoSU0XYbGzEwHkDncHO4yADFlAzAAsQPi9t4AAxA7IG7vDagAGPr4DwAAAP//cnRWaAAAAAZJREFUAwDN9uzQ9xQ84wAAAABJRU5ErkJggg==" alt="icon" class="icon-nav-link" />
            <a href="favorite.html">Thư viện</a>
        </li>
        <li class="nav-item">
            <img 
              src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%23FFFFFF'><path d='M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z'/></svg>" 
              alt="icon" 
              class="icon-nav-link" 
            />

            <a href="readingHistory.html">Lịch sử đọc</a>
        </li>
        <li class="nav-item">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914416/book_ro0m5e.svg" alt="icon" class="icon-nav-link" />
            <a href="">Sách</a>
        </li>
        <li class="nav-item">
            <a href="">Sách mới gần đây</a>
        </li>
        <li class="nav-item">
            <a href="">Sách mới cập nhật</a>
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
