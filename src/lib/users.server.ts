// Server-only helpers for admin user management. Never import from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type SbClient = ReturnType<typeof supabaseAdmin extends infer T ? () => T : never>;

export async function assertCallerIsAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_role, status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.account_role !== "admin" || data.status !== "active") {
    throw new Error("Forbidden: admin access required");
  }
}

export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  // Search auth users by email via admin API (paginated; we only need exact match).
  let page = 1;
  const perPage = 200;
  // Safety cap
  while (page <= 25) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}
