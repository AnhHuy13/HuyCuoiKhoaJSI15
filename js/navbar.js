import { isLogin } from "./database/firebase.js";

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

async function capNhatLinkAccountTuDong() {
  try {
    const user = await isLogin();

    if (user) {
      const links = document.querySelectorAll('a[href*="account.html"]');
      links.forEach((link) => {
        const originalHref = link.getAttribute("href");

        if (originalHref && !originalHref.includes("userId=")) {
          const url = new URL(originalHref, window.location.href);
          url.searchParams.set("userId", user.uid);

          link.setAttribute("href", url.pathname + url.search);
        }
      });
    }

    if (window.location.pathname.includes("account.html")) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryUserId = urlParams.get("userId");

      const isOwn = user && queryUserId === user.uid;

      if (!isOwn) {
        const profileLinks = document.querySelectorAll('a[href*="account.html"]');
        profileLinks.forEach((link) => {
          link.classList.remove("active");

          const parentLi = link.closest("li");
          if (parentLi) {
            parentLi.classList.remove("active");
          }
        });
      }
    }
  } catch (error) {
    console.error("[Navbar] Lỗi khi xử lý liên kết và highlight động:", error);
  }
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
capNhatLinkAccountTuDong();
