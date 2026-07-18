/**
 * Hiển thị một hộp thoại xác nhận chuyên nghiệp dạng Promise.
 *
 * @param {string} message - Nội dung thông báo hiển thị.
 * @param {string} [confirmText="Xác nhận"] - Nhãn của nút xác nhận (trả về true).
 * @param {string} [cancelText="Hủy"] - Nhãn của nút hủy (trả về false). Nếu truyền `null`, nút hủy sẽ không hiển thị.
 * @returns {Promise<boolean>} Trả về `true` khi bấm nút xác nhận, ngược lại trả về `false` (hoặc null).
 */
export function hienThiHopThoai(message, confirmText = "Xác nhận", cancelText = "Hủy") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";

    const dialogBox = document.createElement("div");
    dialogBox.className = "dialog-box";

    const closeBtn = document.createElement("button");
    closeBtn.className = "dialog-close-btn";
    closeBtn.innerHTML = "&times;";

    const textNode = document.createElement("p");
    textNode.className = "dialog-message";
    textNode.textContent = message;

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "dialog-button-group";

    function dongHopThoai(result) {
      overlay.classList.remove("show");
      setTimeout(() => {
        if (overlay.parentNode) document.body.removeChild(overlay);
        resolve(result);
      }, 200);
    }

    closeBtn.onclick = () => dongHopThoai(false);
    overlay.onclick = (e) => {
      if (e.target === overlay) dongHopThoai(false);
    };

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "dialog-btn dialog-btn-confirm";
    confirmBtn.textContent = confirmText;
    confirmBtn.onclick = () => dongHopThoai(true);
    buttonGroup.appendChild(confirmBtn);

    if (cancelText) {
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "dialog-btn dialog-btn-cancel";
      cancelBtn.textContent = cancelText;
      cancelBtn.onclick = () => dongHopThoai(false);
      buttonGroup.appendChild(cancelBtn);
    }

    dialogBox.appendChild(closeBtn);
    dialogBox.appendChild(textNode);
    dialogBox.appendChild(buttonGroup);
    overlay.appendChild(dialogBox);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add("show"));
  });
}
