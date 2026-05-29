import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin, findAuthUserIdByEmail } from "./users.server";

const EmailSchema = z.string().email().max(255).transform((s) => s.toLowerCase().trim());

export type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
  account_role: "admin" | "user";
  user_category: "faculty" | "student" | null;
  status: "invited" | "active" | "disabled" | "deleted";
  invited_at: string | null;
  accepted_at: string | null;
  disabled_at: string | null;
  deleted_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
};

// ─── List users ──────────────────────────────────────────────────────────
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { users: (data ?? []) as AdminProfile[] };
  });

// ─── Invite / Create user ────────────────────────────────────────────────
const InviteSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: EmailSchema,
  user_category: z.enum(["faculty", "student"]),
  status: z.enum(["invited", "active", "disabled"]),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsAdmin(supabase, userId);

    // Reject duplicates (auth or profile).
    const existing = await findAuthUserIdByEmail(data.email);
    if (existing) throw new Error("A user with that email already exists.");

    let newUserId: string;
    if (data.status === "invited") {
      const appUrl = process.env.PUBLIC_HOST
        ? process.env.PUBLIC_HOST.startsWith("http")
          ? process.env.PUBLIC_HOST
          : `https://${process.env.PUBLIC_HOST}`
        : null;
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.email,
        {
          data: { full_name: data.full_name, user_category: data.user_category },
          ...(appUrl ? { redirectTo: `${appUrl}/reset-password` } : {}),
        },
      );
      if (error || !invited.user) throw new Error(error?.message ?? "Failed to invite user");
      newUserId = invited.user.id;
    } else {
      // active or disabled: create with a random password, email-confirmed.
      const tempPassword = `T${crypto.randomUUID()}!aA9`;
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: data.full_name, user_category: data.user_category },
      });
      if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");
      newUserId = created.user.id;
    }

    // Upsert profile with desired status (trigger may have created it with status=invited).
    const now = new Date().toISOString();
    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        email: data.email,
        full_name: data.full_name,
        account_role: "user",
        user_category: data.user_category,
        status: data.status,
        invited_at: now,
        accepted_at: data.status === "active" ? now : null,
        disabled_at: data.status === "disabled" ? now : null,
      }, { onConflict: "id" });
    if (upErr) throw new Error(upErr.message);

    return { id: newUserId };
  });

// ─── Update user ─────────────────────────────────────────────────────────
const UpdateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2).max(120),
  user_category: z.enum(["faculty", "student"]).nullable(),
  status: z.enum(["invited", "active", "disabled"]),
});

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsAdmin(supabase, userId);

    const { data: target, error: getErr } = await supabaseAdmin
      .from("profiles").select("*").eq("id", data.id).maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!target) throw new Error("User not found");
    if (target.account_role === "admin") throw new Error("Admin account is protected.");

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        user_category: data.user_category,
        status: data.status,
        disabled_at: data.status === "disabled" ? (target.disabled_at ?? now) : null,
        accepted_at: data.status === "active" && !target.accepted_at ? now : target.accepted_at,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Status actions ──────────────────────────────────────────────────────
const IdSchema = z.object({ id: z.string().uuid() });

async function guardNonAdmin(id: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles").select("account_role, email, status").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("User not found");
  if (data.account_role === "admin") throw new Error("Admin account is protected.");
  return data;
}

export const disableUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    await guardNonAdmin(data.id);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "disabled", disabled_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reactivateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    await guardNonAdmin(data.id);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "active", disabled_at: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    await guardNonAdmin(data.id);
    // Hard-delete the auth user; profile is cascade-deleted by FK (id → auth.users).
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (authErr) throw new Error(authErr.message);
    // If FK isn't set to cascade, ensure the profile row is gone / marked deleted.
    await supabaseAdmin
      .from("profiles")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const target = await guardNonAdmin(data.id);
    if (target.status !== "invited") throw new Error("User is not in invited state.");
    const { data: user, error: getErr } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (getErr || !user.user?.email) throw new Error(getErr?.message ?? "User email not found");
    const appUrl = process.env.PUBLIC_HOST
      ? process.env.PUBLIC_HOST.startsWith("http")
        ? process.env.PUBLIC_HOST
        : `https://${process.env.PUBLIC_HOST}`
      : null;
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(user.user.email, {
      ...(appUrl ? { redirectTo: `${appUrl}/reset-password` } : {}),
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("profiles")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const cancelInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const target = await guardNonAdmin(data.id);
    if (target.status !== "invited") throw new Error("User is not in invited state.");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    return { ok: true };
  });
