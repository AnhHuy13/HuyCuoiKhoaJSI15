function xuLySidebarAnHien() {
  var btnToggle = document.querySelector(".toggle-menu-btn");
  var sidebar = document.querySelector(".sidebar");
  var loadingScreen;
  try {
    loadingScreen = document.querySelector(".loading-screen");
  } catch (error) {}
  var body = document.body;

  if (btnToggle === null || sidebar === null) {
    return;
  }

  if (window.innerWidth <= 991) {
    sidebar.classList.remove("open");
    try {
      loadingScreen.classList.remove("open");
    } catch (error) {}
    body.classList.remove("sidebar-open");
  }

  btnToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    sidebar.classList.toggle("open");
    try {
      loadingScreen.classList.toggle("open");
    } catch (error) {}
    body.classList.toggle("sidebar-open");
  });

  document.addEventListener("click", function (event) {
    if (window.innerWidth <= 991) {
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !btnToggle.contains(event.target)
      ) {
        try {
          loadingScreen.classList.remove("open");
        } catch (error) {}
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
