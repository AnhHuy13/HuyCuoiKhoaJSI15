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

function dangNhapTaiKhoan(email, password) {
  auth.signInWithEmailAndPassword(email.trim(), password.trim())
    .then(() => {
      alert("Đăng nhập thành công!");
      window.location.href = "../html/trangchu.html";
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


function dangKyTaiKhoan(email, password) {
  auth.createUserWithEmailAndPassword(email.trim(), password.trim())
    .then(() => {
      alert("Đăng ký thành công!");
      window.location.href = "../html/trangchu.html";
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


function dangNhapGoogle() {
  auth.signInWithPopup(googleProvider)
    .then(() => {
      window.location.href = "../html/trangchu.html";
    })
    .catch((error) => {
      console.error("Lỗi Google:", error.message);
    });
}


function checkValidateforSignIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email) return showMessage("email-login-message", "Vui lòng nhập email!", "error");
  if (!password) return showMessage("password-login-message", "Vui lòng nhập mật khẩu!", "error");
  
  dangNhapTaiKhoan(email, password);
}


function checkValidateforSignUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const againPassword = document.getElementById("again-password").value;

  if (!email) return showMessage("email-signup-message", "Vui lòng nhập email!", "error");
  if (password.length < 6) return showMessage("password-signup-message", "Mật khẩu phải từ 6 ký tự!", "error");
  if (password !== againPassword) return showMessage("again-password-signup-message", "Mật khẩu xác nhận không khớp!", "error");

  dangKyTaiKhoan(email, password);
}