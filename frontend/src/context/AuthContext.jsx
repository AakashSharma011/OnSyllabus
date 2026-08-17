import { createContext, useState, useEffect } from "react";
import client from "../api/client.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("access_token", token);
      client.get("/auth/me").then(({ data }) => setUser(data)).catch(() => setUser(null));
    } else {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => setToken(newToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isAdmin: !!user?.is_admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}