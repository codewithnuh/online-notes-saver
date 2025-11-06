"use client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const GoogleLoginButton = () => {
  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Send user info to your database after this step
      await fetch("/api/syncUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
        }),
      });
    } catch (error: any) {
      if (error.code === "auth/invalid-api-key") {
        console.error(
          "Firebase Auth Error: Invalid API Key. Please check your Firebase configuration (.env file or firebase.ts).",
          error,
        );
        alert(
          "Authentication failed: Firebase API Key is misconfigured. Please contact support.",
        );
      } else {
        console.error("Error signing in with Google:", error);
        alert("Authentication failed. Please try again.");
      }
    }
  };
  return <button onClick={handleSignIn}>Sign in with Google</button>;
};
