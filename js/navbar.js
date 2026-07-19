// js/navbar.js

function xuLySidebarAnHien() {
  var btnToggle = document.querySelector(".toggle-menu-btn");
  var sidebar = document.querySelector(".sidebar");
  var body = document.body;

  if (btnToggle === null || sidebar === null) {
    return;
  }

  // KHỞI TẠO ĐỒNG BỘ: Tự động khép menu khi người dùng truy cập bằng điện thoại lần đầu
  if (window.innerWidth <= 991) {
    sidebar.classList.remove("open");
    body.classList.remove("sidebar-open");
  }

  btnToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    sidebar.classList.toggle("open");
    body.classList.toggle("sidebar-open");
  });

  // TỐI ƯU CLICK-OUTSIDE: Đóng menu khi click ra ngoài vùng trống điện thoại
  document.addEventListener("click", function (event) {
    if (window.innerWidth <= 991) {
      // Chỉ khép lại khi: Menu đang mở, click KHÔNG trúng Sidebar và KHÔNG trúng nút Toggle Menu
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !btnToggle.contains(event.target)
      ) {
        sidebar.classList.remove("open");
        body.classList.remove("sidebar-open");
      }
    }
  });
}

window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

xuLySidebarAnHien();
