/**
 * Chuyển từ mã Locale sang mã Quốc gia
 * Nếu Locale không hợp lệ hoặc không đổi được thì chuyển về 'un'
 * @param {string} code
 * @returns {string}
 */

export function ChuyenLocale(code) {
  if (!code || typeof code !== "string") return "un";

  try {
    const locale = new Intl.Locale(code).maximize();
    const region = locale.region?.toLowerCase();

    return region || "un";
  } catch (e) {
    console.error("Lỗi chuyển từ Locale sang Mã Quốc gia:", code, e);
    return "un";
  }
}
