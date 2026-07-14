/**
 * Tạo một key đơn giản trong localStorage
 * @param {string} nameKey - tên key cần tạo
 * @param {any} value - value của key sẽ tạo
 * @returns {boolean} kết quả trả về
 */
export function createSimpleLocalKey(nameKey, value) {
  try {
    if (localStorage.getItem(nameKey) == null) {
      localStorage.setItem(nameKey, value);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Lỗi localStorage:", error);
    return false;
  }
}

/**
 * Thêm một bộ truyện mới hoàn toàn vào mảng localStorage
 * @param {string} nameKey - tên mảng lưu trữ cần push
 * @param {object} newItem - object bộ truyện mới muốn thêm vào
 * @returns {boolean} kết quả trả về
 */
export function pushToArrayLocal(nameKey, newItem) {
  try {
    const firstData = localStorage.getItem(nameKey);
    if (firstData === null) return false;

    const list = JSON.parse(firstData);
    if (list.some((item) => item.mangaId === newItem.mangaId)) return false;

    list.push(newItem);
    localStorage.setItem(nameKey, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("Lỗi localStorage:", error);
    return false;
  }
}

/**
 * Đọc một mảng hoặc object trong localStorage
 * @param {string} nameKey - tên key muốn đọc
 * @returns {any} mảng, object hoặc chuỗi thuần đọc được
 */
export function readLocalKey(nameKey) {
  try {
    const temp = localStorage.getItem(nameKey);
    if (temp !== null) {
      try {
        return JSON.parse(temp);
      } catch {
        return temp;
      }
    }
    return null;
  } catch (error) {
    console.error("Lỗi localStorage:", error);
    return null;
  }
}

/**
 * Cập nhật một vài thuộc tính của bộ truyện trong mảng localStorage
 * @param {string} nameKey - tên mảng lưu trữ cần sửa
 * @param {string} mangaId - Id bộ truyện cần tìm để sửa
 * @param {object} updateFields - các thuộc tính mới muốn ghi đè vào bộ truyện
 * @returns {boolean} kết quả trả về
 */
export function updateLocalKey(nameKey, mangaId, updateFields) {
  try {
    const firstData = localStorage.getItem(nameKey);
    if (firstData === null) return false;

    const list = JSON.parse(firstData);
    const index = list.findIndex((item) => item.mangaId === mangaId);
    if (index === -1) return false;

    list[index] = { ...list[index], ...updateFields };
    localStorage.setItem(nameKey, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("Lỗi localStorage:", error);
    return false;
  }
}

/**
 * Xóa hoàn toàn một key trong localStorage
 * @param {string} nameKey - tên key cần xóa
 * @returns {boolean} kết quả trả về
 */
export function deleteLocalKey(nameKey) {
  try {
    if (localStorage.getItem(nameKey) === null) return false;
    localStorage.removeItem(nameKey);
    return true;
  } catch (error) {
    console.error("Lỗi localStorage:", error);
    return false;
  }
}
