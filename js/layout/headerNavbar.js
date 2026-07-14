// --- KHÔNG DÙNG IMPORT TĨNH Ở ĐÂU FILE ĐỂ TRÁNH LỖI CRASH GIAO DIỆN ---

const activePage = (() => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("trangchu.html") || path.endsWith("/")) return "home";
  if (path.endsWith("manga.html")) return "manga";
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
        <li class="nav-item ${activePage === "manga" ? "active" : ""}">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914412/bookmark_khfizj.svg" alt="icon" class="icon-nav-link" />
            <a href="trangchu.html">Yêu thích</a>
        </li>
        <li class="nav-item">
            <a href="trangchu.html">Thư viện</a>
        </li>
        <li class="nav-item">
            <a href="trangchu.html">Lịch sử đọc</a>
        </li>
        <li class="nav-item">
            <img src="https://res.cloudinary.com/rimebiqz/image/upload/v1783914416/book_ro0m5e.svg" alt="icon" class="icon-nav-link" />
            <a href="trangchu.html">Sách</a>
        </li>
        <li class="nav-item">
            <a href="trangchu.html">Sách mới gần đây</a>
        </li>
        <li class="nav-item">
            <a href="trangchu.html">Sách mới cập nhật</a>
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

// Lệnh này được chạy ngay lập tức khi file được tải, đảm bảo giao diện luôn hiển thị
document.body.insertAdjacentHTML("afterbegin", headerMarkup);

// Sử dụng Dynamic Import (nhập khẩu động) để xử lý logic người dùng một cách an toàn
async function updateNavbarAvatar() {
  try {
    // Chỉ nạp file auth khi cần thiết, nếu file lỗi hoặc sai đường dẫn, nó sẽ rơi vào khối catch thay vì làm sập trang
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
