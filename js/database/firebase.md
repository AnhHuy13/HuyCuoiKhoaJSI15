# Tài liệu Hướng dẫn API Firebase (`firebase.js`)

Tài liệu này cung cấp chi tiết cách sử dụng các hàm tiện ích được định nghĩa trong file `firebase.js` để tương tác với dịch vụ **Firebase Authentication** và **Cloud Firestore**.

---

## 🎯 Tra cứu nhanh theo nhu cầu thực tế

### 🔐 Xác thực & Người dùng

- Tôi muốn kiểm tra trạng thái **ĐĂNG NHẬP** của người dùng -> [isLogin()](#islogin)
- Tôi muốn **KHỞI TẠO HỒ SƠ** mặc định cho tài khoản mới đăng nhập -> [initUserOnFirebase(user)](#inituseronfirebase)
- Tôi muốn **ĐĂNG XUẤT** người dùng khỏi hệ thống -> [logoutFirebase()](#logoutfirebase)

### 👤 Thao tác dữ liệu cá nhân (Tài liệu User)

- Tôi muốn **ĐỌC TRƯỜNG DỮ LIỆU** cụ thể của người dùng (hỗ trợ đường dẫn lồng nhau "a.b") -> [readUserField()](#readuserfield)
- Tôi muốn **CẬP NHẬT HOẶC THÊM MỚI** các trường dữ liệu cho người dùng -> [updateUserFields()](#updateuserfields)
- Tôi muốn **XÓA TRƯỜNG DỮ LIỆU** khỏi hồ sơ người dùng -> [deleteUserField()](#deleteuserfield)
- Tôi muốn **THÊM PHẦN TỬ VÀO MẢNG** dữ liệu của người dùng -> [pushToUserArray()](#pushtouserarray)
- Tôi muốn **XÓA PHẦN TỬ KHỎI MẢNG** dữ liệu của người dùng -> [removeFromUserArray()](#removefromuserarray)

### 📂 Thao tác trên Subcollection của User (`users/{userId}/{subcollectionName}`)

- Tôi muốn **LƯU HOẶC CẬP NHẬT TÀI LIỆU** trong một subcollection con -> [writeSubcollectionDoc()](#writesubcollectiondoc)
- Tôi muốn **ĐỌC TOÀN BỘ TÀI LIỆU** trong một subcollection con -> [readSubcollectionDoc()](#readsubcollectiondoc)
- Tôi muốn **ĐỌC TRƯỜNG DỮ LIỆU CỦA TÀI LIỆU** thuộc subcollection con -> [readSubcollectionField()](#readsubcollectionfield)
- Tôi muốn **XÓA TÀI LIỆU** ra khỏi subcollection con -> [deleteSubcollectionDoc()](#deletesubcollectiondoc)
- Tôi muốn **LẤY DANH SÁCH TÀI LIỆU** từ một subcollection cụ thể -> [getSubcollectionDocs()](#getsubcollectiondocs)
- Tôi muốn **ĐỒNG BỘ LỊCH SỬ ĐỌC** của khách từ bộ nhớ cục bộ lên tài khoản người dùng -> [syncGuestHistoryToFirebase()](#syncguesthistorytofirebase)

### 🌐 Thao tác Đường dẫn Động (Đa cấp sâu)

- Tôi muốn **ĐỌC TOÀN BỘ COLLECTION** bất kỳ ở mọi độ sâu đường dẫn -> [readAnyCollection()](#readanycollection)
- Tôi muốn **ĐỌC DOCUMENT CỤ THỂ** bất kỳ ở mọi độ sâu đường dẫn -> [readAnyDoc()](#readanydoc)

---

## 1. Xác thực & Khởi tạo (Authentication & Initialization)

### <a id="islogin"></a>`isLogin()`

Kiểm tra trạng thái đăng nhập của người dùng hiện tại.

- **Tham số:** Không có.
- **Trả về:** `Promise<User | null>` (Đối tượng User của Firebase Auth hoặc `null` nếu chưa đăng nhập).
- **Ví dụ:**

```javascript
const user = await isLogin();
if (user) {
  console.log("Đã đăng nhập với UID:", user.uid);
} else {
  console.log("Chưa đăng nhập");
}
```

### <a id="inituseronfirebase"></a>`initUserOnFirebase(user)`

Khởi tạo hồ sơ người dùng mới với cấu hình mặc định (nếu chưa tồn tại tài liệu trong bộ sưu tập `users`) hoặc trả về thông tin hiện tại nếu tài khoản đã tồn tại.

- **Tham số:**
  - `user`: Đối tượng `User` nhận về từ Firebase Auth.
- **Trả về:** `Promise<Object | null>` (Dữ liệu hồ sơ người dùng).
- **Ví dụ:**

```javascript
const profile = await initUserOnFirebase(userAuthInstance);
console.log("Hồ sơ người dùng:", profile);
```

### <a id="logoutfirebase"></a>`logoutFirebase()`

Đăng xuất người dùng ra khỏi hệ thống.

- **Tham số:** Không có.
- **Trả về:** `Promise<boolean>` (`true` nếu thành công, `false` nếu thất bại).
- **Ví dụ:**

```javascript
const success = await logoutFirebase();
if (success) {
  window.location.href = "/login.html";
}
```

---

## 2. Thao tác trên User Document (`users/{userId}`)

### <a id="readuserfield"></a>`readUserField(userId, fieldPath, defaultValue)`

Đọc giá trị của một trường cụ thể trong tài liệu người dùng. Hỗ trợ đường dẫn thuộc tính lồng nhau (dạng `"a.b"`).

- **Tham số:**
  - `userId` (string): ID người dùng cần đọc.
  - `fieldPath` (string): Đường dẫn trường dữ liệu (ví dụ: `"age"` hoặc `"settings.theme"`).
  - `defaultValue` (any, mặc định `null`): Giá trị trả về nếu trường dữ liệu không tồn tại.
- **Trả về:** `Promise<any>`
- **Ví dụ:**

```javascript
const userAge = await readUserField(uid, "age", 18);
const currentTheme = await readUserField(uid, "settings.theme", "light");
```

### <a id="updateuserfields"></a>`updateUserFields(userId, data)`

Cập nhật hoặc thêm mới các trường dữ liệu vào tài liệu người dùng (sử dụng chế độ `merge`).

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `data` (Object): Đối tượng chứa các cặp khóa-giá trị cần cập nhật.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
await updateUserFields(uid, {
  age: 20,
  gender: "Nam",
});
```

### <a id="deleteuserfield"></a>`deleteUserField(userId, fieldKey)`

Xóa hoàn toàn một trường cụ thể khỏi tài liệu người dùng.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `fieldKey` (string): Tên trường dữ liệu cần xóa.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
await deleteUserField(uid, "age");
```

### <a id="pushtouserarray"></a>`pushToUserArray(userId, arrayField, value)`

Thêm một phần tử vào trường dữ liệu kiểu mảng trong tài liệu người dùng (không trùng lặp).

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `arrayField` (string): Tên trường kiểu mảng.
  - `value` (any): Giá trị cần thêm vào mảng.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
await pushToUserArray(uid, "favorite", "manga_123");
```

### <a id="removefromuserarray"></a>`removeFromUserArray(userId, arrayField, value)`

Xóa một phần tử khỏi trường dữ liệu kiểu mảng trong tài liệu người dùng.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `arrayField` (string): Tên trường kiểu mảng.
  - `value` (any): Giá trị cần xóa khỏi mảng.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
await removeFromUserArray(uid, "favorite", "manga_123");
```

---

## 3. Thao tác trên Subcollection 1 cấp (`users/{userId}/{subcollectionName}`)

### <a id="writesubcollectiondoc"></a>`writeSubcollectionDoc(userId, subcollectionName, docId, data)`

Lưu hoặc cập nhật một tài liệu trong một bộ sưu tập con của người dùng.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `subcollectionName` (string): Tên thư mục con (ví dụ: `"bookmarks"`).
  - `docId` (string): ID tài liệu cần ghi.
  - `data` (Object): Dữ liệu cần lưu.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
await writeSubcollectionDoc(uid, "bookmarks", "manga_01", { page: 5, updatedAt: Date.now() });
```

### <a id="readsubcollectiondoc"></a>`readSubcollectionDoc(userId, subcollectionName, docId)`

Đọc dữ liệu của một tài liệu trong subcollection của người dùng.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `subcollectionName` (string): Tên thư mục con.
  - `docId` (string): ID tài liệu.
- **Trả về:** `Promise<Object | null>`
- **Ví dụ:**

```javascript
const mangaData = await readSubcollectionDoc(uid, "bookmarks", "manga_01");
```

### <a id="readsubcollectionfield"></a>`readSubcollectionField(userId, subcollectionName, docId, fieldPath, defaultValue)`

Đọc giá trị của một trường cụ thể nằm trong tài liệu thuộc subcollection.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `subcollectionName` (string): Tên thư mục con.
  - `docId` (string): ID tài liệu.
  - `fieldPath` (string): Đường dẫn trường cần đọc.
  - `defaultValue` (any): Giá trị mặc định nếu không tìm thấy dữ liệu.
- **Trả về:** `Promise<any>`
- **Ví dụ:**

```javascript
const currentPage = await readSubcollectionField(uid, "bookmarks", "manga_01", "page", 1);
```

### <a id="deletesubcollectiondoc"></a>`deleteSubcollectionDoc(userId, subcollectionName, docId)`

Xóa một tài liệu cụ thể ra khỏi subcollection của người dùng.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `subcollectionName` (string): Tên thư mục con.
  - `docId` (string): ID tài liệu cần xóa.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
await deleteSubcollectionDoc(uid, "bookmarks", "manga_01");
```

### <a id="getsubcollectiondocs"></a>`getSubcollectionDocs(userId, subcollectionName)`

Lấy danh sách tất cả tài liệu từ một subcollection cụ thể của người dùng dưới dạng mảng.

- **Tham số:**
  - `userId` (string): ID người dùng.
  - `subcollectionName` (string): Tên thư mục con.
- **Trả về:** `Promise<Array<Object>>`
- **Ví dụ:**

```javascript
const allBookmarks = await getSubcollectionDocs(uid, "bookmarks");
```

### <a id="syncguesthistorytofirebase"></a>`syncGuestHistoryToFirebase(userId, guestHistoryArray)`

Đồng bộ lịch sử từ bộ nhớ cục bộ (local) của khách lên subcollection `"bookmarks"` của người dùng sau khi đăng nhập.

- **Tham số:**
  - `userId` (string): ID người dùng sau khi đăng nhập.
  - `guestHistoryArray` (Array): Mảng chứa lịch sử đọc từ client.
- **Trả về:** `Promise<boolean>`
- **Ví dụ:**

```javascript
const localHistory = JSON.parse(localStorage.getItem("guest_history") || "[]");
await syncGuestHistoryToFirebase(uid, localHistory);
```

---

## 4. Thao tác Đường dẫn Động (Đa cấp sâu)

### <a id="readanycollection"></a>`readAnyCollection(...pathSegments)`

Đọc danh sách toàn bộ tài liệu từ một collection hoặc subcollection bất kỳ tại mọi độ sâu.

- **Tham số:**
  - `...pathSegments` (string[]): Danh sách các phần tử tạo nên đường dẫn (đường dẫn lẻ phần tử).
- **Trả về:** `Promise<Array<Object>>`
- **Ví dụ:**

```javascript
// Đọc danh mục: users/{uid}/favorite/reading
const readingList = await readAnyCollection("users", uid, "favorite", "reading");
```

### <a id="readanydoc"></a>`readAnyDoc(...pathSegments)`

Đọc thông tin của một tài liệu cụ thể dựa trên đường dẫn có độ sâu bất kỳ.

- **Tham số:**
  - `...pathSegments` (string[]): Danh sách các phần tử tạo nên đường dẫn (đường dẫn chẵn phần tử).
- **Trả về:** `Promise<Object | null>`
- **Ví dụ:**

```javascript
// Đọc tài liệu: users/{uid}/favorite/reading/{mangaId}
const mangaDetails = await readAnyDoc("users", uid, "favorite", "reading", "manga_abc");
```

---

## 5. Danh sách Bí danh tương thích ngược (Aliases)

Các hàm dưới đây được giữ lại để tránh gây lỗi cho hệ thống sử dụng code cũ và tự động ánh xạ đến các hàm mới tương ứng:

| Tên hàm cũ                                     | Hàm mới tương ứng                                                | Mô tả ngắn                          |
| :--------------------------------------------- | :--------------------------------------------------------------- | :---------------------------------- |
| `readFirebaseKey(userId, key, default)`        | `readUserField(userId, key, default)`                            | Đọc dữ liệu từ tài liệu người dùng. |
| `createFirebaseKey(userId, key, value)`        | `updateUserFields(userId, { [key]: value })`                     | Khởi tạo trường dữ liệu mới.        |
| `updateFirebaseKey(userId, key, value)`        | `updateUserFields(userId, { [key]: value })`                     | Cập nhật trường dữ liệu hiện tại.   |
| `deleteFirebaseKey(userId, key)`               | `deleteUserField(userId, key)`                                   | Xóa một trường dữ liệu.             |
| `pushItemToArray(userId, key, value)`          | `pushToUserArray(userId, key, value)`                            | Thêm phần tử vào mảng của user.     |
| `readBookmarkField(userId, mangaId, key, def)` | `readSubcollectionField(userId, "bookmarks", mangaId, key, def)` | Đọc thuộc tính của bookmark truyện. |
| `deleteMangaBookmark(userId, mangaId)`         | `deleteSubcollectionDoc(userId, "bookmarks", mangaId)`           | Xóa truyện khỏi bookmark.           |

```

```
