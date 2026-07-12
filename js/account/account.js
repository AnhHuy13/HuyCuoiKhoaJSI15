const tabs = [
  { id: "profile", label: "Thống tin" },
  { id: "security", label: "Bảo mật" },
  { id: "history", label: "Lịch sử" },
  { id: "preferences", label: "Tùy chọn" },
];

const initialUser = {
  name: "Người dùng",
  email: "user@example.com",
  role: "Reader",
  joined: "2025-04-12",
  username: "mangafan",
};

export function initAccountPage() {
  renderTabs();
  renderProfile(initialUser);
  activateTab("profile");
  attachTabListeners();
}

function renderTabs() {
  const tabList = document.getElementById("account-tab-list");
  if (!tabList) return;

  tabList.innerHTML = tabs
    .map(
      (tab) => `
      <button type="button" class="account-tab" data-tab="${tab.id}">
        ${tab.label}
      </button>
    `,
    )
    .join("");
}

function attachTabListeners() {
  const tabList = document.getElementById("account-tab-list");
  if (!tabList) return;

  tabList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    activateTab(button.dataset.tab);
  });
}

function activateTab(tabId) {
  const allTabs = document.querySelectorAll(".account-tab");
  allTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  document.querySelectorAll(".account-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `account-${tabId}`);
  });
}

function renderProfile(user) {
  const summary = document.getElementById("account-profile-summary");
  if (!summary) return;

  summary.innerHTML = `
    <div class="account-user-card">
      <div class="account-avatar">${user.name.charAt(0)}</div>
      <div class="account-user-info">
        <h1>${user.name}</h1>
        <p>${user.role}</p>
        <div class="account-user-meta">
          <span>Email: ${user.email}</span>
          <span>Username: ${user.username}</span>
          <span>Join date: ${user.joined}</span>
        </div>
      </div>
    </div>

    <div class="account-actions">
      <button class="btn btn-primary">Chỉnh sửa hồ sơ</button>
      <button class="btn btn-outline-light">Đổi mật khẩu</button>
    </div>
  `;
}
