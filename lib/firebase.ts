import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDhD343KwuTtGoHVk5mIOr7440y-zgOU2Y",//process.env.FIREBASE_API_KEY,
  authDomain: "online-notes-saver-ab1fe.firebaseapp.com",
  projectId: "online-notes-saver-ab1fe",
  storageBucket: "online-notes-saver-ab1fe.firebasestorage.app",
  messagingSenderId: "922414354949",
  appId: "1:922414354949:web:8cbb410895d26c2b0c826c",
  measurementId: "G-Z2H3WJLPH7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
