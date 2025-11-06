"use client";
import React, { useContext, useState, useEffect, createContext } from "react";
import { User, onAuthStateChanged, Auth } from "firebase/auth"; // Added 'Auth' type for declaration
declare const auth: Auth;

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// Define props for AuthProvider, explicitly including children.
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  return;
};
