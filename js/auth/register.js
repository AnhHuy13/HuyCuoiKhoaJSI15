const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

function showMessage(elementId, message, type) {
  const messages = document.querySelectorAll(".message");
  messages.forEach((msg) => (msg.innerHTML = ""));

  const container = document.getElementById(elementId);
  if (!container) return;
  if (message) {
    container.innerHTML = `<p class="${type}">${message}</p>`;
  }
}

function dangKyTaiKhoan(email, password) {
  auth
    .createUserWithEmailAndPassword(email.trim(), password.trim())
    .then(() => {
      alert("Đăng ký thành công!");
      window.location.href = "../html/auth/dangnhap.html";
    })
    .catch((error) => {
      switch (error.code) {
        case "auth/email-already-in-use":
          showMessage("email-signup-message", "Email này đã có người dùng!", "error");
          break;
        case "auth/invalid-email":
          showMessage("email-signup-message", "Email không hợp lệ!", "error");
          break;
        case "auth/weak-password":
          showMessage("password-signup-message", "Mật khẩu quá yếu (trên 6 ký tự)!", "error");
          break;
        default:
          alert("Lỗi: " + error.message);
      }
    });
}

function checkValidateforSignUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const againPassword = document.getElementById("again-password").value;

  if (!email) return showMessage("email-signup-message", "Vui lòng nhập email!", "error");
  if (password.length < 6)
    return showMessage("password-signup-message", "Mật khẩu phải từ 6 ký tự!", "error");
  if (password !== againPassword)
    return showMessage("again-password-signup-message", "Mật khẩu xác nhận không khớp!", "error");

  dangKyTaiKhoan(email, password);
}

function dangNhapGoogle() {
  auth
    .signInWithPopup(googleProvider)
    .then(() => {
      window.location.href = "../html/trangchu.html";
    })
    .catch((error) => {
      console.error("Lỗi Google:", error.message);
    });
}
