import {
  type ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { API_URL } from "../api";

/* ================= TYPES ================= */

type Role = "admin" | "user" | "sales" | "viewer";

export type User = {
  id: number | string;
  email: string;
  name: string;
  role?: Role;
} | null;

type Permissions = {
  isAdmin: boolean;
  canManageUsers: boolean;
  canApproveQuotation: boolean;
  canCreateQuotation: boolean;
  canViewReports: boolean;
};

type AuthContextShape = {
  user: User;
  isAuthenticated: boolean;
  permissions: Permissions;
  login: (token: string, immediateUser?: User) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

/* ================= HELPERS ================= */

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    if (typeof payload.exp === "number") {
      return payload.exp > now;
    }
    return true;
  } catch {
    return false;
  }
}

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User>(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = isTokenValid(token);

  /* ---------- ROLE & PERMISSIONS ---------- */

  const role: Role = user?.role ?? "viewer";

  const permissions: Permissions = {
    isAdmin: role === "admin",
    canManageUsers: role === "admin",
    canApproveQuotation: role === "admin",
    canCreateQuotation: role === "admin" || role === "sales",
    canViewReports: role === "admin" || role === "sales",
  };

  /* ---------- TOKEN HANDLING ---------- */

  const setTokenAndStore = (t: string | null) => {
    try {
      if (t) localStorage.setItem("token", t);
      else localStorage.removeItem("token");
    } catch {}
    setToken(t);
  };

  /* ---------- FETCH CURRENT USER ---------- */

  const fetchMe = async (passedToken?: string) => {
    const tk = passedToken ?? token;

    if (!tk || !isTokenValid(tk)) {
      setTokenAndStore(null);
      setUser(null);
      try {
        localStorage.removeItem("user");
      } catch {}
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tk}` },
      });

      if (!res.ok) {
        setTokenAndStore(null);
        setUser(null);
        try {
          localStorage.removeItem("user");
        } catch {}
        return;
      }

      const body = await res.json();
      const u = body.user;

      const mapped: User = u
        ? { id: u.id, email: u.email, name: u.name, role: u.role }
        : null;

      setUser(mapped);

      try {
        mapped
          ? localStorage.setItem("user", JSON.stringify(mapped))
          : localStorage.removeItem("user");
      } catch {}
    } catch (err) {
      console.error("fetchMe error", err);
      setTokenAndStore(null);
      setUser(null);
      try {
        localStorage.removeItem("user");
      } catch {}
    }
  };

  /* ---------- AUTH ACTIONS ---------- */

  const login = async (newToken: string, immediateUser?: User) => {
    setTokenAndStore(newToken);

    if (immediateUser) {
      setUser(immediateUser);
      try {
        localStorage.setItem("user", JSON.stringify(immediateUser));
      } catch {}
    }

    await fetchMe(newToken);
  };

  const logout = () => {
    setTokenAndStore(null);
    setUser(null);
    try {
      localStorage.removeItem("user");
    } catch {}
  };

  const refresh = async () => {
    await fetchMe();
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---------- PROVIDER ---------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        permissions,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
