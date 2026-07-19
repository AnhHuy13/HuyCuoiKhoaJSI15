export function updateProgress(percentage, text) {
  const progressBar = document.getElementById("load-progress");
  const loadingText = document.querySelector(".loading-text");
  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (loadingText && text) loadingText.textContent = text;
}

export function showLoadingScreen(text = "Đang kết nối hệ thống...") {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.remove("fade-out");
    updateProgress(20, text);
  }
}

export function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
}

export function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "m";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

export function getFlagCountryCode(lang) {
  if (!lang) return "";
  const map = {
    ja: "jp",
    ko: "kr",
    zh: "cn",
    en: "us",
    vi: "vn",
    fr: "fr",
    es: "es",
  };
  return map[lang.toLowerCase()] || "";
}
