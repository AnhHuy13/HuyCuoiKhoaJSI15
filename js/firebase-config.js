import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbHHB9VsxqKUwTnUHATl8OfgFMKdYG56U",
  authDomain: "manga-org-project.firebaseapp.com",
  projectId: "manga-org-project",
  storageBucket: "manga-org-project.firebasestorage.app",
  messagingSenderId: "695005301242",
  appId: "1:695005301242:web:076a3834be038dc8ee3c43",
  measurementId: "G-0F89EFQCJY",
};

export const app = initializeApp(firebaseConfig);
