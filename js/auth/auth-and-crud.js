import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  writeBatch,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { app } from "../firebase-config.js";

import { set, get, unset } from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";

const db = getFirestore(app);

export function isLogin() {
  return new Promise((resolve) => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user ? user : null);
    });
  });
}

//==============
// localStorage
//==============

/**
 * tạo một key đơn giản trong localStorage
 * @param {string} nameKey - tên key cần tạo
 * @param {any} value - value của key sẽ tạo
 * @returns {boolean} kết quả trả về
 */
export function createSimpleLocalKey(nameKey, value) {
  try {
    if (localStorage.getItem(nameKey) == null) {
      localStorage.setItem(nameKey, value);
      return true;
    } else {
      console.error("key " + nameKey + " đã tồn tại");
      return false;
    }
  } catch (error) {
    console.error("Loi:" + error);
  }
}

/**
 * thêm một bộ truyện mới hoàn toàn vào mảng localStorage
 * @param {string} nameKey - tên mảng lưu trữ cần push
 * @param {object} newItem - object bộ truyện mới muốn thêm vào
 * @returns {boolean} kết quả trả về
 */
export function pushToArrayLocal(nameKey, newItem) {
  try {
    const firstData = localStorage.getItem(nameKey);

    //check key đã tồn tại? (vì push vào một localKey)
    if (firstData === null) {
      console.error("key " + nameKey + " chưa đc tạo");
      return false;
    }

    const list = JSON.parse(firstData);

    const isDup = list.some((item) => {
      return item.mangaId === newItem.mangaId;
    });

    //check nếu như mà mangaId có bị trùng (hàm này không update mà thêm vào một phần tử mới hoàn toàn)
    if (isDup) {
      console.error("mangaId bị trùng! : " + newItem.mangaId + " chưa đc tạo");
      return false;
    }

    list.push(newItem);
    localStorage.setItem(nameKey, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("Loi:" + error);
  }
}

/**
 * đọc một mảng hoặc object trong localStorage
 * @param {string} nameKey - tên key muốn đọc
 * @returns {any} mảng, object hoặc chuỗi thuần đọc đc
 */
export function readLocalKey(nameKey) {
  try {
    const temp = localStorage.getItem(nameKey);
    if (temp !== null) {
      //parse ra mảng hoặc object
      try {
        return JSON.parse(temp);
      } catch {
        return temp;
      }
    } else {
      console.error("key " + nameKey + " chưa đc tạo");
      return null;
    }
  } catch (error) {
    console.error("Loi:" + error);
  }
}

/**
 * cập nhật một vài thuộc tính của bộ truyện trong mảng localStorage
 * @param {string} nameKey - tên mảng lưu trữ cần sửa
 * @param {string} mangaId - Id bộ truyện cần tìm để sửa
 * @param {object} updateFields - các thuộc tính mới muốn ghi đè vào bộ truyện
 * @returns {boolean} kết quả trả về
 */
export function updateLocalKey(nameKey, mangaId, updateFields) {
  try {
    const firstData = localStorage.getItem(nameKey);

    if (firstData === null) {
      console.error("Key " + nameKey + " chưa đc tạo");
      return false;
    }

    const list = JSON.parse(firstData);
    const index = list.findIndex((item) => {
      return item.mangaId === mangaId;
    });

    if (index === -1) {
      console.error("Không tìm thấy mangaId: " + mangaId);
      return false;
    }

    list[index] = { ...list[index], ...updateFields };

    localStorage.setItem(nameKey, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("Loi:" + error);
  }
}

/**
 * xóa hoàn toàn một key trong localStorage
 * @param {string} nameKey - tên key cần xóa
 * @returns {boolean} kết quả trả về
 */
export function deleteLocalKey(nameKey) {
  try {
    if (localStorage.getItem(nameKey) === null) {
      console.error("key " + nameKey + " không tồn tại để xóa");
      return false;
    }
    localStorage.removeItem(nameKey);
    return true;
  } catch (error) {
    console.error("Loi:" + error);
  }
}

// ==================================
// sync from localStorage to Firebase
// ==================================

/**
 * merge localStorage(guest) đến Firestore(user)
 * @param {string} userId - id của người dùng Firebase
 * @param {Array} guestHistoryArray - array chứa lịch sử đọc của guest (localStorage)
 * @returns
 */
export async function syncGuestHistoryToFirebase(userId, guestHistoryArray) {
  if (!guestHistoryArray || !Array.isArray(guestHistoryArray) || guestHistoryArray.length === 0) {
    return false;
  }

  const batch = writeBatch(db);
  let hasUpdates = false;

  try {
    for (const guestManga of guestHistoryArray) {
      if (!guestManga.mangaId) continue;

      const bookmarkDocRef = doc(db, "users", userId, "bookmarks", guestManga.mangaId);
      const cloudDocSnap = await getDoc(bookmarkDocRef);

      const guestPage = get(guestManga, "page", 0);

      if (cloudDocSnap.exists()) {
        const cloudManga = cloudDocSnap.data();

        const cloudPage = get(cloudManga, "page", 0);

        if (guestPage > cloudPage) {
          batch.set(
            bookmarkDocRef,
            {
              ...guestManga,
              syncedAt: Date.now(),
            },
            { merge: true },
          );
          hasUpdates = true;
        } else {
          console.log(
            `${guestManga.mangaId} vì Cloud đang ở trang cao hơn (${cloudPage} >= ${guestPage})`,
          );
        }
      } else {
        batch.set(
          bookmarkDocRef,
          {
            ...guestManga,
            syncedAt: Date.now(),
          },
          { merge: true },
        );
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await batch.commit();
      console.log("Đồng bộ tiến trình đọc thành công");
    }

    return true;
  } catch (error) {
    console.error("Lỗi khi chạy sync so sánh dữ liệu: ", error);
    return false;
  }
}

// ============
// firebase
// ============

/**
 * kiểm tra và khởi tạo hồ sơ cho người dùng mới trên Firebase
 * @param {object} user - Object user nhận về từ Firebase Auth
 * @returns {Promise<boolean>} kết quả trả về
 */
export async function initUserOnFirebase(user) {
  if (!user) return false;

  const userDocRef = doc(db, "users", user.uid);

  try {
    // đọc thử dữ liệu hiện tại của user trên cloud
    const docSnap = await getDoc(userDocRef);

    const hasName = get(docSnap.data(), "name");

    // nếu tài liệu chưa tồn tại hoặc trường "name" chưa có=
    if (!docSnap.exists() || !hasName) {
      console.log("Người dùng mới");

      const defaultProfile = {
        name: user.displayName || "New member",
        email: user.email || "",
        avatar: user.photoURL || "../../image/catgirl-default-avatar.jpg",
        banner: "default-banner.jpg",
        age: null,
        manga_history: [],
        favorite: [],
        createdAt: Date.now(),
      };

      await setDoc(userDocRef, defaultProfile, { merge: true });
      console.log("Khởi tạo hồ sơ người dùng mới thành công");
      return true;
    }

    console.log("Người dùng cũ!");
    return false;
  } catch (error) {
    console.error("Lỗi: " + error);
    return false;
  }
}

/**
 * tạo một key-field thông thường trong Firebase
 * @param {string} userId - id của người dùng
 * @param {string} nameKey - tên key cần tạo
 * @param {any} newValue - value của key sẽ tạo
 */

export async function createFirebaseKey(userId, nameKey, newValue) {
  const userDocRef = doc(db, "users", userId);
  const dataToSet = {};

  set(dataToSet, nameKey, newValue);

  await setDoc(userDocRef, dataToSet);
}

/**
 * thêm phần tử mới hoàn toàn vào một key phải chứa array
 * @param {string} userId - id người dùng
 * @param {string} nameKey - tên key
 * @param {any} addValue - item cần thêm mới
 */
export async function pushItemToArray(userId, nameKey, addValue) {
  await updateFirebaseKey(userId, nameKey, arrayUnion(addValue));
}

/**
 * đọc một bookmark field trong Firebase
 * @param {string} userId - Id của người dùng
 * @param {string} mangaId - Id bộ truyện cần đọc
 * @param {string} fieldKey - Thuộc tính cần đọc trong bộ truyện
 * @param {any} defaultValue - Gía trị mặc định nếu có lỗi
 * @returns
 */

export async function readBookmarkField(userId, mangaId, fieldKey, defaultValue = null) {
  const bookmarkDocRef = doc(db, "users", userId, "bookmarks", mangaId);
  const docSnap = await getDoc(bookmarkDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return get(data, fieldKey, defaultValue);
  }

  return defaultValue;
}

/**
 * đọc một key-field trong firebase
 * @param {string} userId - Id của người dùng
 * @param {string} nameKey - Tên key muốn đọc
 * @param {any} defaultValue - Gía trị mặc định nếu có lỗi
 */

export async function readFirebaseKey(userId, nameKey, defaultValue = null) {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return get(data, nameKey, defaultValue);
  }
  return defaultValue;
}

/**
 * cập nhật một key-field trong firebase
 * @param {string} userId - Id của người dùng
 * @param {string} nameKey - Tên key cần đổi
 * @param {any} newValue - Gía trị mới muốn đổi
 * @returns {boolean} kết quả trả về
 */

export async function updateFirebaseKey(userId, nameKey, newValue) {
  const userDocRef = doc(db, "users", userId);

  // Dùng setDoc với merge: true để tự tạo document nếu user đó chưa từng tồn tại trên Cloud
  try {
    await setDoc(
      userDocRef,
      {
        [nameKey]: newValue,
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    return false;
    console.error(`Không thể cập nhật ${nameKey} với giá trị ${newValue}`);
  }
}

/**
 * xóa một key-field trong firebase
 * @param {string} userId - ID của người dùng
 * @param {string} nameKey -  Key cần xóa
 * @returns {boolean} - kết quả trả về
 */
export async function deleteFirebaseKey(userId, nameKey) {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);
  try {
    if (docSnap.exists()) {
      const data = docSnap.data();

      unset(data, nameKey);

      await setDoc(userDocRef, data);
      return true;
    }
  } catch (error) {
    return false;
    console.log("Không thể xóa " + { nameKey });
  }
}

/**
 * xóa một bộ truyện trong danh sách bookmark trong firebase
 * @param {string} userId - ID của người dùng
 * @param {string} mangaId - ID của bộ truyện cần xóa
 * @returns {boolean} - kết quả trả về
 */

export async function deleteMangaBookmark(userId, mangaId) {
  try {
    const bookmarkDocRef = doc(db, "users", userId, "bookmarks", mangaId);
    await deleteDoc(bookmarkDocRef);
    console.log(`Đã xóa truyện ${mangaId} khỏi bookmark của user ${userId}`);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa bookmark:", error);
    return false;
  }
}
