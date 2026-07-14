import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { app } from "../firebase-config.js";
import { initUserOnFirebase, updateFirebaseKey } from "../database/firebase.js";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function showMessage(elementId, message, type) {
  const messages = document.querySelectorAll(".message");
  messages.forEach((msg) => (msg.innerHTML = ""));

  const container = document.getElementById(elementId);
  if (!container) return;
  if (message) {
    container.innerHTML = `<p class="${type}">${message}</p>`;
  }
}

function dangNhapTaiKhoan(email, password) {
  console.log("đang dangNhapTaiKhoan()");
  signInWithEmailAndPassword(auth, email.trim(), password.trim())
    .then(async (userCredential) => {
      const user = userCredential.user;

      const userData = await initUserOnFirebase(user);

      if (userData) {
        const customId = userData.customId;
        const name = userData.name;

        if (!customId || name === "New member") {
          showSetupProfileModal(user.uid, user.email, user.displayName);
        } else {
          alert("Đăng nhập thành công!");
          window.location.href = "../trangchu.html";
        }
      } else {
        alert("Lỗi tải cấu hình hồ sơ người dùng!");
      }
    })
    .catch((error) => {
      switch (error.code) {
        case "auth/invalid-email":
          showMessage("email-login-message", "Email không hợp lệ!", "error");
          break;
        case "auth/user-disabled":
          showMessage("email-login-message", "Tài khoản này đã bị khoá!", "error");
          break;
        case "auth/wrong-password":
          showMessage("password-login-message", "Mật khẩu không chính xác!", "error");
          break;
        case "auth/invalid-credential":
          showMessage("email-login-message", "Email hoặc mật khẩu không đúng!", "error");
          break;
        default:
          alert("Lỗi: " + error.message);
      }
    });
}

function dangNhapGoogle() {
  signInWithPopup(auth, googleProvider)
    .then(async (result) => {
      const user = result.user;

      const userData = await initUserOnFirebase(user);

      if (userData) {
        const customId = userData.customId;
        const name = userData.name;

        if (!customId || name === "New member") {
          showSetupProfileModal(user.uid, user.email, user.displayName);
        } else {
          window.location.href = "../trangchu.html";
        }
      } else {
        alert("Lỗi tải cấu hình hồ sơ người dùng!");
      }
    })
    .catch((error) => {
      console.error("Lỗi Google:", error.message);
    });
}

function showSetupProfileModal(userId, email, currentDisplayName) {
  const modal = document.getElementById("setup-profile-modal");
  if (!modal) {
    window.location.href = "../trangchu.html";
    return;
  }

  modal.classList.add("active");

  const nameInput = document.getElementById("modal-name");
  const customIdInput = document.getElementById("modal-custom-id");
  const saveBtn = document.getElementById("modal-save-btn");

  if (nameInput && currentDisplayName && currentDisplayName !== "New member") {
    nameInput.value = currentDisplayName;
  }

  saveBtn.onclick = async () => {
    const chosenName = nameInput.value.trim();
    const chosenCustomId = customIdInput.value.trim().toLowerCase();

    const nameErrorEl = document.getElementById("modal-name-error");
    const customIdErrorEl = document.getElementById("modal-custom-id-error");

    if (nameErrorEl) nameErrorEl.textContent = "";
    if (customIdErrorEl) customIdErrorEl.textContent = "";

    if (!chosenName) {
      if (nameErrorEl) nameErrorEl.textContent = "Vui lòng nhập Tên hiển thị!";
      return;
    }

    if (!chosenCustomId) {
      if (customIdErrorEl) customIdErrorEl.textContent = "Vui lòng nhập ID cá nhân!";
      return;
    }

    const idRegex = /^[a-z0-9_-]+$/;
    if (!idRegex.test(chosenCustomId)) {
      if (customIdErrorEl) {
        customIdErrorEl.textContent = "ID chỉ gồm chữ thường viết liền, số, dấu (_) hoặc (-)!";
      }
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Đang lưu cấu hình...";

      await updateFirebaseKey(userId, "name", chosenName);
      await updateFirebaseKey(userId, "customId", chosenCustomId);

      alert("Hoàn thiện hồ sơ tài khoản thành công!");
      window.location.href = "../trangchu.html";
    } catch (err) {
      console.error("Lỗi khi cập nhật hồ sơ mới:", err);
      alert("Đã xảy ra lỗi trong quá trình lưu dữ liệu. Vui lòng thử lại!");
      saveBtn.disabled = false;
      saveBtn.textContent = "Xác nhận & Vào trang chủ";
    }
  };
}

function checkValidateforSignIn() {
  console.log("checkValidateforSignIn đang chạy");
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email) return showMessage("email-login-message", "Vui lòng nhập email!", "error");
  if (!password) return showMessage("password-login-message", "Vui lòng nhập mật khẩu!", "error");

  console.log("check validate thành công, đang dangNhapTaiKhoan()");
  dangNhapTaiKhoan(email, password);
}

// Lắng nghe sự kiện trực tiếp không dùng "onclick" trong HTML
const loginBtn = document.querySelector(".login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", checkValidateforSignIn);
}

const googleBtn = document.querySelector(".btn-google");
if (googleBtn) {
  googleBtn.addEventListener("click", dangNhapGoogle);
}
