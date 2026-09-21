import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("terminal_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("terminal_token") || null);
  const [loading, setLoading] = useState(true);

  // Check if token is still valid on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.success) {
          setUser(res.data.data);
          localStorage.setItem("terminal_user", JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();

    // Listen for auth-changed event from api interceptor
    const handleAuthChange = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, [token]);

  // Login method
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data && res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem("terminal_token", newToken);
      localStorage.setItem("terminal_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data?.error?.message || "Login failed");
  };

  // Register method
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data && res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem("terminal_token", newToken);
      localStorage.setItem("terminal_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data?.error?.message || "Registration failed");
  };

  // Logout method
  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("terminal_token");
      localStorage.removeItem("terminal_user");
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
