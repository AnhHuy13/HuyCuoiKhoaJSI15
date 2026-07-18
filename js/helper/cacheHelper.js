export function luuCache(key, data) {
  try {
    const cacheObj = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(key, JSON.stringify(cacheObj));
    console.log(`[Cache] Đã ghi nhận dữ liệu vào bộ nhớ đệm: ${key}`);
  } catch (error) {
    console.warn("[Cache] Không thể lưu bộ nhớ đệm cục bộ:", error);
  }
}

export function layCache(key, ttlMs) {
  try {
    const rawData = localStorage.getItem(key);
    if (!rawData) return null;

    const cacheObj = JSON.parse(rawData);
    const thoiGianDaQua = Date.now() - cacheObj.timestamp;

    if (thoiGianDaQua > ttlMs) {
      console.log(`[Cache] Dữ liệu đệm quá hạn: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`[Cache] Sử dụng dữ liệu đệm thành công cho: ${key}`);
    return cacheObj.data;
  } catch (error) {
    console.warn("[Cache] Không thể phân tích dữ liệu đệm:", error);
    return null;
  }
}
