import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_APP_KEY,
  authDomain: "online-notes-saver-ab1fe.firebaseapp.com",
  projectId: "online-notes-saver-ab1fe",
  storageBucket: "online-notes-saver-ab1fe.firebasestorage.app",
  messagingSenderId: "922414354949",
  appId: process.env.FIREBASE_APP_ID,
  measurementId: "G-Z2H3WJLPH7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
