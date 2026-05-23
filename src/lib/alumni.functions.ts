import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";

const currentYear = new Date().getFullYear();

export type AlumniRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  graduation_year: number | null;
  degree_program: string | null;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  location: string | null;
  technical_skills: string[];
  mentorship_interest: boolean;
  mentorship_categories: string[];
  tags: string[];
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

const EmailSchema = z
  .string()
  .email()
  .max(255)
  .transform((s) => s.toLowerCase().trim());

const AlumniInputSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: EmailSchema,
  phone: z.string().max(50).nullable().optional(),
  linkedin_url: z.string().max(500).nullable().optional(),
  graduation_year: z.number().int().min(1950).max(currentYear + 5).nullable().optional(),
  degree_program: z.string().max(200).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  job_title: z.string().max(200).nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  technical_skills: z.array(z.string().max(80)).max(100).default([]),
  mentorship_interest: z.boolean().default(false),
  mentorship_categories: z.array(z.string().max(80)).max(50).default([]),
  tags: z.array(z.string().max(80)).max(50).default([]),
  notes: z.string().max(5000).nullable().optional(),
});

function normalize(input: z.infer<typeof AlumniInputSchema>) {
  return {
    full_name: input.full_name,
    email: input.email,
    phone: input.phone || null,
    linkedin_url: input.linkedin_url || null,
    graduation_year: input.graduation_year ?? null,
    degree_program: input.degree_program || null,
    company: input.company || null,
    job_title: input.job_title || null,
    industry: input.industry || null,
    location: input.location || null,
    technical_skills: input.technical_skills ?? [],
    mentorship_interest: !!input.mentorship_interest,
    mentorship_categories: input.mentorship_categories ?? [],
    tags: input.tags ?? [],
    notes: input.notes || null,
  };
}

// ─── List ────────────────────────────────────────────────────────────────
const ListSchema = z
  .object({
    includeArchived: z.boolean().optional(),
  })
  .optional();

export const listAlumni = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ListSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let query = supabase.from("alumni").select("*").order("created_at", { ascending: false });
    if (!data?.includeArchived) query = query.eq("archived", false);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { alumni: (rows ?? []) as AlumniRow[] };
  });

// ─── Get one ─────────────────────────────────────────────────────────────
const IdSchema = z.object({ id: z.string().uuid() });

export const getAlumni = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("alumni")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { alumni: (row ?? null) as AlumniRow | null };
  });

// ─── Create ──────────────────────────────────────────────────────────────
export const createAlumni = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AlumniInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const payload = normalize(data);
    const { data: created, error } = await supabaseAdmin
      .from("alumni")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "alumni.created",
      entity_id: created.id,
      entity_label: created.full_name,
      summary: `Created alumni ${created.full_name}`,
      after: created,
    });
    return { alumni: created as AlumniRow };
  });

// ─── Update ──────────────────────────────────────────────────────────────
const UpdateSchema = AlumniInputSchema.extend({ id: z.string().uuid() });

export const updateAlumni = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { id, ...rest } = data;
    const { data: before } = await supabaseAdmin.from("alumni").select("*").eq("id", id).maybeSingle();
    const payload = normalize(rest);
    const { data: updated, error } = await supabaseAdmin
      .from("alumni")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "alumni.updated",
      entity_id: id,
      entity_label: updated.full_name,
      summary: `Updated alumni ${updated.full_name}`,
      before,
      after: updated,
    });
    return { alumni: updated as AlumniRow };
  });

// ─── Archive / Unarchive / Delete ────────────────────────────────────────
async function setArchived(id: string, archived: boolean, userId: string, email?: string | null) {
  const { data: updated, error } = await supabaseAdmin
    .from("alumni")
    .update({ archived })
    .eq("id", id)
    .select("id, full_name")
    .single();
  if (error) throw new Error(error.message);
  await writeAudit({
    actor_id: userId,
    actor_email: email,
    action: archived ? "alumni.archived" : "alumni.unarchived",
    entity_id: id,
    entity_label: updated.full_name,
    summary: `${archived ? "Archived" : "Unarchived"} ${updated.full_name}`,
  });
}

export const archiveAlumni = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    await setArchived(data.id, true, context.userId, (context.claims as { email?: string })?.email ?? null);
    return { ok: true };
  });

export const unarchiveAlumni = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    await setArchived(data.id, false, context.userId, (context.claims as { email?: string })?.email ?? null);
    return { ok: true };
  });

export const deleteAlumni = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin.from("alumni").select("id, full_name").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("alumni").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "alumni.deleted",
      entity_id: data.id,
      entity_label: before?.full_name ?? null,
      summary: `Deleted alumni ${before?.full_name ?? data.id}`,
      before,
    });
    return { ok: true };
  });

// ─── CSV Import ──────────────────────────────────────────────────────────
const CsvRowSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: EmailSchema,
  phone: z.string().max(50).optional().nullable(),
  linkedin_url: z.string().max(500).optional().nullable(),
  graduation_year: z.number().int().min(1950).max(currentYear + 5).optional().nullable(),
  degree_program: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  job_title: z.string().max(200).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
});

const ImportSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).max(2000),
});

export const importAlumniCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ImportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);

    const errors: { row: number; reason: string }[] = [];
    const valid: z.infer<typeof CsvRowSchema>[] = [];

    data.rows.forEach((raw, i) => {
      const coerced = {
        ...raw,
        graduation_year:
          raw.graduation_year === "" || raw.graduation_year == null
            ? null
            : Number(raw.graduation_year),
      };
      const parsed = CsvRowSchema.safeParse(coerced);
      if (!parsed.success) {
        errors.push({ row: i + 1, reason: parsed.error.issues[0]?.message ?? "Invalid" });
        return;
      }
      valid.push(parsed.data);
    });

    if (valid.length === 0) {
      return { inserted: 0, updated: 0, errors, total: data.rows.length };
    }

    // Fetch existing emails to compute inserted vs updated.
    const emails = valid.map((r) => r.email);
    const { data: existing } = await supabaseAdmin
      .from("alumni")
      .select("email")
      .in("email", emails);
    const existingSet = new Set((existing ?? []).map((r) => r.email));

    const payload = valid.map((r) => ({
      full_name: r.full_name,
      email: r.email,
      phone: r.phone || null,
      linkedin_url: r.linkedin_url || null,
      graduation_year: r.graduation_year ?? null,
      degree_program: r.degree_program || null,
      company: r.company || null,
      job_title: r.job_title || null,
      industry: r.industry || null,
      location: r.location || null,
    }));

    const { error } = await supabaseAdmin
      .from("alumni")
      .upsert(payload, { onConflict: "email" });
    if (error) throw new Error(error.message);

    const inserted = valid.filter((r) => !existingSet.has(r.email)).length;
    const updated = valid.length - inserted;

    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "alumni.csv_imported",
      summary: `Imported CSV: ${inserted} new, ${updated} updated, ${errors.length} invalid`,
      after: { inserted, updated, invalid: errors.length, total: data.rows.length },
    });

    return { inserted, updated, errors, total: data.rows.length };
  });
