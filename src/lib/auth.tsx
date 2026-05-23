import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOCK_USERS, type Profile, type Role } from "@/mocks";

type AuthCtx = {
  user: Profile | null;
  signIn: (role: Role | "disabled") => void;
  signOut: () => void;
  switchRole: (role: Role) => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "uww-mock-auth-user-id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (id) {
      const u = MOCK_USERS.find((m) => m.id === id) ?? null;
      setUser(u);
    }
  }, []);

  function signIn(role: Role | "disabled") {
    let u: Profile | undefined;
    if (role === "disabled") u = MOCK_USERS.find((m) => m.disabled_at);
    else u = MOCK_USERS.find((m) => m.role === role && !m.disabled_at);
    if (u) {
      localStorage.setItem(KEY, u.id);
      setUser(u);
    }
  }
  function switchRole(role: Role) {
    signIn(role);
  }
  function signOut() {
    localStorage.removeItem(KEY);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, signIn, signOut, switchRole }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export function canAccess(role: Role | undefined, route: string): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  if (route.startsWith("/settings") || route.startsWith("/settings/audit-log")) return false;
  if (role === "faculty") {
    return route === "/dashboard" || route.startsWith("/alumni") || route.startsWith("/mentorship");
  }
  return true; // admin
}

export function canEdit(role: Role | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
