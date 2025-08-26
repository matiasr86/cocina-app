// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

// Lee variables de entorno (CRA)
const FB_CONFIG = {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: process.env.REACT_APP_FB_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FB_PROJECT_ID,
  appId: process.env.REACT_APP_FB_APP_ID,
  messagingSenderId: process.env.REACT_APP_FB_MESSAGING_SENDER_ID,
};
const ADMIN_EMAIL = (process.env.REACT_APP_ADMIN_EMAIL || '').trim();

const app = initializeApp(FB_CONFIG);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isAdmin = useMemo(() => {
    if (!user?.email || !ADMIN_EMAIL) return false;
    return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user]);

  const loginGoogle = async () => {
    setAdminError('');
    await signInWithPopup(auth, googleProvider);
  };

  const loginAdminWithPassword = async (email, password) => {
    setAdminError('');
    // Si querés forzar que SOLO el email admin pueda loguear con password:
    if (ADMIN_EMAIL && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      const msg = 'Este email no está autorizado como administrador.';
      setAdminError(msg);
      throw new Error(msg);
    }
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  };

  const logout = async () => {
    setAdminError('');
    await signOut(auth);
  };

  const value = {
    user,
    authReady,
    isAdmin,
    adminError,
    loginGoogle,
    loginAdminWithPassword, // 👈 ahora EXISTE
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
