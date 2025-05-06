"use client";
import React, { useState, useEffect, useCallback, useContext, createContext } from "react";
import { useRouter } from "next/navigation";

// Types
export interface User {
  _id: string;
  email: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHydrated(true);
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Save user/token to localStorage
  useEffect(() => {
    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [token, user]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server error. Please try again.");
    }
    if (!data.success) throw new Error(data.message || "Login failed");
    setToken(data.token);

    // Fetch full profile after login
    const profileRes = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    const profileData = await profileRes.json();
    if (profileData.success && profileData.user) {
      setUser(profileData.user);
    } else {
      setUser(data.user); // fallback
    }
  }, []);

  // Register
  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Registration failed");
    // Auto-login after register
    await login(email, password);
  }, [login]);

  // Logout
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/"); // Redirect to home page after logout
  }, [router]);

  // Modal controls
  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    openAuthModal,
    closeAuthModal,
    authModalOpen,
    setUser,
    setToken,
  };

  if (!hydrated) return <></>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
