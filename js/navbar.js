function xuLySidebarAnHien() {
  var btnToggle = document.querySelector(".toggle-menu-btn");
  var sidebar = document.querySelector(".sidebar");
  var body = document.body;

  if (btnToggle === null || sidebar === null) {
    return;
  }

  btnToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    sidebar.classList.toggle("open");
    body.classList.toggle("sidebar-open");
  });
}

window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");

  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});
xuLySidebarAnHien();
