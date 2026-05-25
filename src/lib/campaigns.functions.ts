import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";
import { sendBulkEmail } from "./email.server";

export type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  filter_mentorship_only: boolean;
  filter_tags: string[];
  filter_grad_years: number[];
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

const FiltersSchema = z.object({
  filter_mentorship_only: z.boolean().default(false),
  filter_tags: z.array(z.string().max(80)).max(50).default([]),
  filter_grad_years: z.array(z.number().int().min(1950).max(2100)).max(100).default([]),
});

const CampaignInputSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(100_000),
}).and(FiltersSchema);

const IdSchema = z.object({ id: z.string().uuid() });

async function countRecipients(filters: z.infer<typeof FiltersSchema>): Promise<number> {
  let q = supabaseAdmin.from("alumni").select("id", { count: "exact", head: true }).eq("archived", false);
  if (filters.filter_mentorship_only) q = q.eq("mentorship_interest", true);
  if (filters.filter_tags.length) q = q.overlaps("tags", filters.filter_tags);
  if (filters.filter_grad_years.length) q = q.in("graduation_year", filters.filter_grad_years);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getRecipientEmails(
  filters: z.infer<typeof FiltersSchema>,
): Promise<{ email: string; name: string }[]> {
  let q = supabaseAdmin.from("alumni").select("email, full_name").eq("archived", false);
  if (filters.filter_mentorship_only) q = q.eq("mentorship_interest", true);
  if (filters.filter_tags.length) q = q.overlaps("tags", filters.filter_tags);
  if (filters.filter_grad_years.length) q = q.in("graduation_year", filters.filter_grad_years);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ email: r.email as string, name: (r.full_name as string) ?? "" }));
}

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin.from("campaigns").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { campaigns: (data ?? []) as CampaignRow[] };
  });

export const getCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { data: row, error } = await supabaseAdmin.from("campaigns").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return { campaign: (row ?? null) as CampaignRow | null };
  });

export const previewRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => FiltersSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const count = await countRecipients(data);
    return { count };
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CampaignInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const recipient_count = await countRecipients(data);
    const { data: created, error } = await supabaseAdmin
      .from("campaigns")
      .insert({
        name: data.name,
        subject: data.subject,
        body: data.body,
        filter_mentorship_only: data.filter_mentorship_only,
        filter_tags: data.filter_tags,
        filter_grad_years: data.filter_grad_years,
        status: "draft",
        recipient_count,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "campaign.created",
      entity_type: "campaign",
      entity_id: created.id,
      entity_label: created.name,
      summary: `Created campaign ${created.name}`,
      after: created,
    });
    return { campaign: created as CampaignRow };
  });

const UpdateSchema = CampaignInputSchema.and(z.object({ id: z.string().uuid() }));

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpdateSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin.from("campaigns").select("*").eq("id", data.id).maybeSingle();
    if (before && before.status !== "draft") throw new Error("Only draft campaigns can be edited");
    const recipient_count = await countRecipients(data);
    const { data: updated, error } = await supabaseAdmin
      .from("campaigns")
      .update({
        name: data.name,
        subject: data.subject,
        body: data.body,
        filter_mentorship_only: data.filter_mentorship_only,
        filter_tags: data.filter_tags,
        filter_grad_years: data.filter_grad_years,
        recipient_count,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "campaign.updated",
      entity_type: "campaign",
      entity_id: updated.id,
      entity_label: updated.name,
      summary: `Updated campaign ${updated.name}`,
      before,
      after: updated,
    });
    return { campaign: updated as CampaignRow };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin.from("campaigns").select("*").eq("id", data.id).maybeSingle();
    if (before && before.status !== "draft") throw new Error("Only draft campaigns can be deleted");
    const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "campaign.deleted",
      entity_type: "campaign",
      entity_id: data.id,
      entity_label: before?.name ?? null,
      summary: `Deleted campaign ${before?.name ?? data.id}`,
      before,
    });
    return { ok: true };
  });

export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin.from("campaigns").select("*").eq("id", data.id).maybeSingle();
    if (!before) throw new Error("Not found");
    if (before.status !== "draft") throw new Error("Only draft campaigns can be sent");

    // Mark as sending immediately so UI reflects progress
    await supabaseAdmin.from("campaigns").update({ status: "sending" }).eq("id", data.id);

    try {
      const recipients = await getRecipientEmails({
        filter_mentorship_only: before.filter_mentorship_only,
        filter_tags: before.filter_tags ?? [],
        filter_grad_years: before.filter_grad_years ?? [],
      });

      await sendBulkEmail({ recipients, subject: before.subject, html: before.body });

      const sent_at = new Date().toISOString();
      const { data: updated, error } = await supabaseAdmin
        .from("campaigns")
        .update({ status: "sent", sent_at, recipient_count: recipients.length })
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);

      await writeAudit({
        actor_id: userId,
        actor_email: (claims as { email?: string })?.email ?? null,
        action: "campaign.sent",
        entity_type: "campaign",
        entity_id: updated.id,
        entity_label: updated.name,
        summary: `Sent campaign ${updated.name} to ${recipients.length} recipients`,
        before,
        after: updated,
      });
      return { campaign: updated as CampaignRow };
    } catch (err) {
      // Roll status back to failed so the admin can see what happened
      const { data: failed } = await supabaseAdmin
        .from("campaigns")
        .update({ status: "failed" })
        .eq("id", data.id)
        .select("*")
        .single();
      await writeAudit({
        actor_id: userId,
        actor_email: (claims as { email?: string })?.email ?? null,
        action: "campaign.failed",
        entity_type: "campaign",
        entity_id: data.id,
        entity_label: before.name,
        summary: `Campaign ${before.name} failed to send: ${(err as Error).message}`,
        before,
        after: failed,
        severity: "critical",
      });
      throw err;
    }
  });
