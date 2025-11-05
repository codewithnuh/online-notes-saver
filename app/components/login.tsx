"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInWithGoogle, signOutFromGoogle } from "@/lib/auth";

export default function Login() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {user ? (
        <div className="flex flex-col gap-4">
          <p className="text-lg">Welcome, {user.displayName}</p>
          <button onClick={signOutFromGoogle} className="p-2 border border-gray-300 rounded-md">Sign Out</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle} className="p-2 border border-gray-300 rounded-md">Sign In with Google</button>
      )}
    </div>
  );
}
