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

  document.addEventListener("click", function (event) {
    var clickInsideSidebar = sidebar.contains(event.target);
    var clickOnButton = btnToggle.contains(event.target);

    if (!clickInsideSidebar && !clickOnButton) {
      sidebar.classList.remove("open");
      body.classList.remove("sidebar-open");
    }
  });
}

xuLySidebarAnHien();
