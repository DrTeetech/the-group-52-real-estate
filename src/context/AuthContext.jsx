import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = localStorage.getItem("group52_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem("group52_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  function login(data) {
    localStorage.setItem("group52_token", data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("group52_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
