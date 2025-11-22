import { initializeApp, getApps, getApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDhD343KwuTtGoHVk5mIOr7440y-zgOU2Y",

  authDomain: "online-notes-saver-ab1fe.firebaseapp.com",

  projectId: "online-notes-saver-ab1fe",

  storageBucket: "online-notes-saver-ab1fe.firebasestorage.app",

  messagingSenderId: "922414354949",

  appId: "1:922414354949:web:8cbb410895d26c2b0c826c",

  measurementId: "G-Z2H3WJLPH7"

};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// connectAuthEmulator(auth, "http://localhost:9099");
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
