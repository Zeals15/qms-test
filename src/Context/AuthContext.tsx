// src/context/AuthContext.tsx
import { type ReactNode, useEffect, useState, createContext, useContext } from "react";
import { API_URL } from "../api"; // adjust if your api exports a different name

type Role = "admin" | "user" | "sales" | "viewer";
export type User = { id: number | string; email: string; name?: string; role?: Role } | null;

type AuthContextShape = {
  user: User;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  });
  const [user, setUser] = useState<User>(null);
  const isAuthenticated = !!token;

  // Helper: set token both in state and localStorage
  const setTokenAndStore = (t: string | null) => {
    try {
      if (t) localStorage.setItem("token", t);
      else localStorage.removeItem("token");
    } catch {}
    setToken(t);
  };

  // Fetch current user from API using stored token
  const fetchMe = async (currentToken?: string) => {
    const tk = currentToken ?? token;
    if (!tk) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (!res.ok) {
        // invalid token or expired
        setTokenAndStore(null);
        setUser(null);
        return;
      }
      const body = await res.json();
      // Expecting { user: { id, email, name, role } } or payload; adapt if your /api/me returns different shape
      const u = body.user ?? body;
      setUser({ id: u.id, email: u.email, name: u.name, role: u.role });
    } catch (err) {
      setTokenAndStore(null);
      setUser(null);
    }
  };

  // login stores token and fetches user
  const login = async (newToken: string) => {
    setTokenAndStore(newToken);
    await fetchMe(newToken);
  };

  const logout = () => {
    setTokenAndStore(null);
    setUser(null);
  };

  // Expose manual refresh
  const refresh = async () => {
    await fetchMe();
  };

  // When token changes (page load or manual set), try to get user
  useEffect(() => {
    // run once on mount / token change
    void fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
