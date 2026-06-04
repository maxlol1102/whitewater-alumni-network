import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Profile } from "@/mocks";
import { supabase } from "@/integrations/supabase/client";

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

type AuthCtx = {
  user: Profile | null;
  identity: IdentityKey | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id;
      if (!uid) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Defer profile fetch to avoid deadlock inside the callback
      setTimeout(async () => {
        const p = await fetchProfile(uid);
        if (mounted) {
          setUser(p);
          setLoading(false);
        }
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) {
        if (mounted) setLoading(false);
        return;
      }
      const p = await fetchProfile(uid);
      if (mounted) {
        setUser(p);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function refreshProfile() {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (uid) {
      const p = await fetchProfile(uid);
      setUser(p);
    }
  }

  const identity = user ? identityOf(user) : null;

  return <Ctx.Provider value={{ user, identity, loading, signOut, refreshProfile }}>{children}</Ctx.Provider>;
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

export function canEdit(user: Profile | null | undefined): boolean {
  return isActive(user) && user.account_role === "admin";
}
