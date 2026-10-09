import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_STORAGE_KEY, UNAUTHORIZED_EVENT } from "../services/apiClient.js";
import * as authService from "../services/authService.js";

const AuthContext = createContext(null);

function readStoredAuth() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    const auth = JSON.parse(stored);
    if (auth?.token && auth?.user) return auth;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    const clearAuth = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuth(null);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, clearAuth);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearAuth);
  }, []);

  async function signIn(email, password) {
    const nextAuth = await authService.login(email, password);
    if (nextAuth.user.role !== "customer") {
      throw new Error("This portal is available to customer accounts only.");
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    return nextAuth.user;
  }

  function signOut() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }

  const value = useMemo(
    () => ({
      user: auth?.user || null,
      isAuthenticated: Boolean(auth?.token),
      signIn,
      signOut,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
