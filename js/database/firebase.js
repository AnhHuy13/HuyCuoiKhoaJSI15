import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { app } from "../firebase-config.js";

// Khởi tạo Firestore sử dụng cấu hình Long Polling vượt tường lửa
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Hàm hỗ trợ đọc dữ liệu an toàn theo đường dẫn lồng nhau
function safeGet(obj, path, defaultValue = null) {
  if (!obj) return defaultValue;
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

export function isLogin() {
  return new Promise((resolve) => {
    console.log("[Firebase Auth] Đang gọi getAuth(app)...");
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "[Firebase Auth] Trạng thái đăng nhập thay đổi. User:",
        user ? user.uid : "Không có user",
      );
      unsubscribe();
      resolve(user ? user : null);
    });
  });
}

//=======================================
// 1. CÁC HÀM THAO TÁC TRÊN USER DOCUMENT
//=======================================

export async function readUserField(userId, fieldPath, defaultValue = null) {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return safeGet(docSnap.data(), fieldPath, defaultValue);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Lỗi khi đọc trường ${fieldPath} của user ${userId}:`, error);
    return defaultValue;
  }
}

export async function updateUserFields(userId, data) {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Lỗi khi cập nhật thông tin cho user ${userId}:`, error);
    return false;
  }
}

export async function deleteUserField(userId, fieldKey) {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      delete data[fieldKey];
      await setDoc(userDocRef, data);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Lỗi khi xóa trường ${fieldKey} của user ${userId}:`, error);
    return false;
  }
}

export async function pushToUserArray(userId, arrayField, value) {
  return await updateUserFields(userId, {
    [arrayField]: arrayUnion(value),
  });
}

export async function removeFromUserArray(userId, arrayField, value) {
  return await updateUserFields(userId, {
    [arrayField]: arrayRemove(value),
  });
}

//=======================================
// 2. CÁC HÀM THAO TÁC TRÊN SUBCOLLECTION
//=======================================

export async function writeSubcollectionDoc(userId, subcollectionName, docId, data) {
  try {
    const docRef = doc(db, "users", userId, subcollectionName, docId);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Lỗi khi ghi tài liệu vào danh sách ${subcollectionName}:`, error);
    return false;
  }
}

export async function readSubcollectionDoc(userId, subcollectionName, docId) {
  try {
    const docRef = doc(db, "users", userId, subcollectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error(`Lỗi khi đọc tài liệu trong danh sách ${subcollectionName}:`, error);
    return null;
  }
}

export async function readSubcollectionField(
  userId,
  subcollectionName,
  docId,
  fieldPath,
  defaultValue = null,
) {
  try {
    const data = await readSubcollectionDoc(userId, subcollectionName, docId);
    return safeGet(data, fieldPath, defaultValue);
  } catch (error) {
    console.error(`Lỗi khi đọc trường ${fieldPath} trong danh sách ${subcollectionName}:`, error);
    return defaultValue;
  }
}

export async function deleteSubcollectionDoc(userId, subcollectionName, docId) {
  try {
    const docRef = doc(db, "users", userId, subcollectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa tài liệu trong danh sách ${subcollectionName}:`, error);
    return false;
  }
}

export async function getSubcollectionDocs(userId, subcollectionName) {
  try {
    const colRef = collection(db, "users", userId, subcollectionName);
    const querySnapshot = await getDocs(colRef);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách từ ${subcollectionName}:`, error);
    return [];
  }
}

//==================================================
// 3. CÁC HÀM QUẢN LÝ TIẾN TRÌNH KHỞI TẠO VÀ ĐỒNG BỘ
//==================================================

export async function initUserOnFirebase(user) {
  if (!user) return null;
  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    const currentData = docSnap.data();
    const hasName = currentData?.name;

    if (!docSnap.exists() || !hasName) {
      console.log("Người dùng mới");
      const defaultProfile = {
        name: user.displayName || "New member",
        email: user.email || "",
        avatar:
          user.photoURL ||
          "https://res.cloudinary.com/rimebiqz/image/upload/co_rgb:000000,l_text:Arial_20_bold_normal_left:DEFAULT%250AAVATAR%2520/fl_layer_apply,fl_no_overflow,g_center,x_-50,y_19/defaul-avatar-1_yl9xfo.jpg",

        banner: "https://res.cloudinary.com/rimebiqz/image/upload/v1783914533/banner_qvydzf.jpg",

        age: null,
        manga_history: [],
        favorite: [],
        createdAt: Date.now(),
      };
      await setDoc(userDocRef, defaultProfile, { merge: true });
      console.log("Khởi tạo hồ sơ người dùng mới thành công");
      return defaultProfile;
    }

    console.log("Người dùng cũ!");
    return currentData;
  } catch (error) {
    console.error("Lỗi: " + error);
    return null;
  }
}

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
      const guestPage = guestManga?.page ?? 0;

      if (cloudDocSnap.exists()) {
        const cloudManga = cloudDocSnap.data();
        const cloudPage = cloudManga?.page ?? 0;

        if (guestPage > cloudPage) {
          batch.set(bookmarkDocRef, { ...guestManga, syncedAt: Date.now() }, { merge: true });
          hasUpdates = true;
        }
      } else {
        batch.set(bookmarkDocRef, { ...guestManga, syncedAt: Date.now() }, { merge: true });
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

export async function logoutFirebase() {
  const auth = getAuth(app);
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    return false;
  }
}

//=============================================================================
// 4. BÍ DANH (ALIAS) - ĐƯỢC GIỮ LẠI ĐỂ TƯƠNG THÍCH HOÀN TOÀN VỚI CODE CŨ KHÁC
//=============================================================================

export async function createFirebaseKey(userId, nameKey, newValue) {
  return await updateUserFields(userId, { [nameKey]: newValue });
}

export async function updateFirebaseKey(userId, nameKey, newValue) {
  return await updateUserFields(userId, { [nameKey]: newValue });
}

export async function readFirebaseKey(userId, nameKey, defaultValue = null) {
  return await readUserField(userId, nameKey, defaultValue);
}

export async function deleteFirebaseKey(userId, nameKey) {
  return await deleteUserField(userId, nameKey);
}

export async function pushItemToArray(userId, nameKey, addValue) {
  return await pushToUserArray(userId, nameKey, addValue);
}

export async function readBookmarkField(userId, mangaId, fieldKey, defaultValue = null) {
  return await readSubcollectionField(userId, "bookmarks", mangaId, fieldKey, defaultValue);
}

export async function deleteMangaBookmark(userId, mangaId) {
  return await deleteSubcollectionDoc(userId, "bookmarks", mangaId);
}
