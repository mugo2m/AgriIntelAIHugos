"use client";

import { useState, useEffect } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

// IMPORTANT: Import from firebase/client.ts (NOT admin)
import { auth } from "@/firebase/client";

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = () => firebaseSignOut(auth);
  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);
  const signUp = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  return {
    user,
    isLoading,
    signOut,
    signIn,
    signUp
  };
}
