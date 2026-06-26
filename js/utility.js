/**
 * Chuyển từ mã Locale sang mã Quốc gia
 * Nếu Locale không hợp lệ hoặc không đổi được thì chuyển về 'un'
 * @param {string} code
 * @returns {string}
 */
export function ChuyenLocale(code) {
  try {
    const locale = new Intl.Locale(code).maximize();
    console.log(locale.region ? locale.region.toLowerCase() : "un");
    return locale.region ? locale.region.toLowerCase() : "un";
  } catch {
    return "un";
  }
}
