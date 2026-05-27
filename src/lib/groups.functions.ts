import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";

// Cast to any — groups/alumni_groups tables are not in the generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

export type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  graduation_year: number | null;
  tags: string[];
  mentorship_interest: boolean;
};

const IdSchema = z.object({ id: z.string().uuid() });

const GroupInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
});

async function enrichWithCounts(groups: GroupRow[]): Promise<GroupRow[]> {
  if (!groups.length) return [];
  const { data: memberships } = await db
    .from("alumni_groups")
    .select("group_id")
    .in("group_id", groups.map((g) => g.id));
  const countMap: Record<string, number> = {};
  for (const m of memberships ?? []) {
    countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1;
  }
  return groups.map((g) => ({ ...g, member_count: countMap[g.id] ?? 0 }));
}

// ─── List ─────────────────────────────────────────────────────────────────

export const listGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await db.from("groups").select("*").order("name");
    if (error) throw new Error(error.message);
    const groups = await enrichWithCounts(data ?? []);
    return { groups };
  });

// ─── Get one ──────────────────────────────────────────────────────────────

export const getGroup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data }) => {
    const { data: group, error } = await db
      .from("groups")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!group) return { group: null as GroupRow | null, members: [] as GroupMember[] };

    const { data: memberships } = await db
      .from("alumni_groups")
      .select("alumni_id")
      .eq("group_id", data.id);
    const alumniIds = (memberships ?? []).map((m: { alumni_id: string }) => m.alumni_id);

    let members: GroupMember[] = [];
    if (alumniIds.length) {
      const { data: alumni, error: alumniErr } = await supabaseAdmin
        .from("alumni")
        .select("id, full_name, email, company, job_title, graduation_year, tags, mentorship_interest")
        .in("id", alumniIds)
        .order("full_name");
      if (alumniErr) throw new Error(alumniErr.message);
      members = (alumni ?? []) as unknown as GroupMember[];
    }

    const [enriched] = await enrichWithCounts([group]);
    return { group: enriched, members };
  });

// ─── Create ───────────────────────────────────────────────────────────────

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => GroupInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: created, error } = await db
      .from("groups")
      .insert({ name: data.name, description: data.description ?? null })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "group.created",
      entity_id: created.id,
      entity_label: created.name,
      summary: `Created group "${created.name}"`,
      after: created,
    });
    return { group: { ...created, member_count: 0 } as GroupRow };
  });

// ─── Update ───────────────────────────────────────────────────────────────

const UpdateGroupSchema = GroupInputSchema.extend({ id: z.string().uuid() });

export const updateGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpdateGroupSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { id, ...rest } = data;
    const { data: updated, error } = await db
      .from("groups")
      .update({ name: rest.name, description: rest.description ?? null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "group.updated",
      entity_id: id,
      entity_label: updated.name,
      summary: `Updated group "${updated.name}"`,
      after: updated,
    });
    const [enriched] = await enrichWithCounts([updated]);
    return { group: enriched };
  });

// ─── Delete ───────────────────────────────────────────────────────────────

export const deleteGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await db.from("groups").select("id, name").eq("id", data.id).maybeSingle();
    const { error } = await db.from("groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "group.deleted",
      entity_id: data.id,
      entity_label: before?.name ?? null,
      summary: `Deleted group "${before?.name ?? data.id}"`,
      before,
    });
    return { ok: true };
  });

// ─── Add members ──────────────────────────────────────────────────────────

const AddMembersSchema = z.object({
  groupId: z.string().uuid(),
  alumniIds: z.array(z.string().uuid()).min(1).max(500),
});

export const addAlumniToGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => AddMembersSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const rows = data.alumniIds.map((alumniId) => ({
      group_id: data.groupId,
      alumni_id: alumniId,
    }));
    // upsert to silently skip duplicates
    const { error } = await db.from("alumni_groups").upsert(rows, { onConflict: "alumni_id,group_id" });
    if (error) throw new Error(error.message);
    const { data: group } = await db.from("groups").select("name").eq("id", data.groupId).maybeSingle();
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "group.members_added",
      entity_id: data.groupId,
      entity_label: group?.name ?? null,
      summary: `Added ${data.alumniIds.length} alumni to group "${group?.name ?? data.groupId}"`,
      after: { count: data.alumniIds.length },
    });
    return { added: data.alumniIds.length };
  });

// ─── Remove member ────────────────────────────────────────────────────────

const RemoveMemberSchema = z.object({
  groupId: z.string().uuid(),
  alumniId: z.string().uuid(),
});

export const removeAlumniFromGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => RemoveMemberSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { error } = await db
      .from("alumni_groups")
      .delete()
      .eq("group_id", data.groupId)
      .eq("alumni_id", data.alumniId);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "group.member_removed",
      entity_id: data.groupId,
      summary: `Removed alumni from group`,
      before: { alumniId: data.alumniId },
    });
    return { ok: true };
  });
