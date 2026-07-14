import { isLogin, readFirebaseKey } from "../database/firebase.js";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/rimebiqz/image/upload/co_rgb:000000,l_text:Arial_20_bold_normal_left:DEFAULT%250AAVATAR%2520/fl_layer_apply,fl_no_overflow,g_center,x_-50,y_19/defaul-avatar-1_yl9xfo.jpg";
const DEFAULT_BANNER =
  "https://res.cloudinary.com/rimebiqz/image/upload/v1783914533/banner_qvydzf.jpg";

function updateProgress(percentage, text) {
  const progressBar = document.getElementById("load-progress");
  const loadingText = document.querySelector(".loading-text");

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  if (loadingText && text) {
    loadingText.textContent = text;
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
}

async function initAccountPage() {
  console.log("[Account] --- BẮT ĐẦU KHỞI TẠO TRANG TÀI KHOẢN ---");

  try {
    updateProgress(20, "Đang xác minh tài khoản...");
    const user = await isLogin();

    if (!user) {
      updateProgress(40, "Xác minh thất bại. Đang chuyển hướng...");
      alert("Vui lòng đăng nhập để xem thông tin tài khoản!");
      window.location.href = "./auth/dangnhap.html";
      return;
    }

    const userId = user.uid;

    updateProgress(50, "Đang tải thông tin cá nhân...");
    const name = await readFirebaseKey(userId, "name", "Thành viên mới");

    updateProgress(70, "Đang tải mã định danh...");
    const customId = await readFirebaseKey(userId, "customId", "Chưa thiết lập ID");

    updateProgress(85, "Đang thiết lập hình ảnh hồ sơ...");
    const avatarUrl = await readFirebaseKey(userId, "avatar", DEFAULT_AVATAR);

    let bannerUrl = await readFirebaseKey(userId, "banner", DEFAULT_BANNER);
    if (!bannerUrl || bannerUrl === "default-banner.jpg") {
      bannerUrl = DEFAULT_BANNER;
    }

    updateProgress(95, "Đang tối ưu hóa giao diện...");

    const nameEl = document.querySelector(".name-account");
    const idEl = document.querySelector(".id-account");
    const avatarEl = document.querySelector(".avatar");
    const bannerEl = document.querySelector(".banner-profile");

    if (nameEl) nameEl.textContent = name;
    if (idEl) idEl.textContent = `ID: ${customId}`;
    if (avatarEl) avatarEl.src = avatarUrl;

    if (bannerEl) {
      bannerEl.style.backgroundImage = `url('${bannerUrl}')`;
      bannerEl.style.backgroundSize = "cover";
      bannerEl.style.backgroundPosition = "center";
    }

    updateProgress(100, "Hoàn tất!");
    setTimeout(() => {
      hideLoadingScreen();
    }, 400);
  } catch (error) {
    console.error("[Account] Gặp lỗi nghiêm trọng:", error);
    updateProgress(100, "Đã xảy ra lỗi tải dữ liệu.");
    hideLoadingScreen();
  }
}

initAccountPage();
