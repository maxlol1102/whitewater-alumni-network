import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOCK_USERS, type Profile } from "@/mocks";

export type IdentityKey =
  | "admin"
  | "faculty_user"
  | "student_user"
  | "invited"
  | "disabled";

export const IDENTITY_LABEL: Record<IdentityKey, string> = {
  admin: "Admin",
  faculty_user: "Faculty User",
  student_user: "Student User",
  invited: "Invited User (no access)",
  disabled: "Disabled User (no access)",
};

const IDENTITY_USER_ID: Record<IdentityKey, string> = {
  admin: "u-admin",
  faculty_user: "u-fac-1",
  student_user: "u-stu-1",
  invited: "u-inv-1",
  disabled: "u-dis-1",
};

type AuthCtx = {
  user: Profile | null;
  identity: IdentityKey | null;
  signInAs: (id: IdentityKey) => void;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "uww-mock-auth-user-id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (id) setUser(MOCK_USERS.find((m) => m.id === id) ?? null);
  }, []);

  function signInAs(id: IdentityKey) {
    const userId = IDENTITY_USER_ID[id];
    const u = MOCK_USERS.find((m) => m.id === userId) ?? null;
    if (u) {
      localStorage.setItem(KEY, u.id);
      setUser(u);
    }
  }

  function signOut() {
    localStorage.removeItem(KEY);
    setUser(null);
  }

  const identity = user ? identityOf(user) : null;

  return <Ctx.Provider value={{ user, identity, signInAs, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export function identityOf(user: Profile): IdentityKey {
  if (user.status === "invited") return "invited";
  if (user.status === "disabled" || user.status === "deleted") return "disabled";
  if (user.account_role === "admin") return "admin";
  return user.user_category === "student" ? "student_user" : "faculty_user";
}

export function isActive(user: Profile | null | undefined): user is Profile {
  return !!user && user.status === "active";
}

/** Routes available to active staff. */
function userCanRoute(route: string): boolean {
  return (
    route === "/dashboard" ||
    route.startsWith("/alumni") ||
    route.startsWith("/mentorship")
  );
}

export function canAccess(user: Profile | null | undefined, route: string): boolean {
  if (!isActive(user)) return false;
  if (user.account_role === "admin") return true;
  return userCanRoute(route);
}

/** Only super_admin can mutate domain data. */
export function canEdit(user: Profile | null | undefined): boolean {
  return isActive(user) && user.account_role === "admin";
}
