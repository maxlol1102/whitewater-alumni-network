import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";
import { sendPersonalizedBatch } from "./email.server";

export type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "email" | "survey";
  survey_id: string | null;
  tally_form_id: string | null;
  tally_form_url: string | null;
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

export type SurveyRecipientRow = {
  id: string;
  campaign_id: string;
  alumni_id: string | null;
  email: string;
  name: string;
  token: string;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  created_at: string;
};

const FiltersSchema = z.object({
  filter_mentorship_only: z.boolean().default(false),
  filter_tags: z.array(z.string().max(80)).max(50).default([]),
  filter_grad_years: z.array(z.number().int().min(1950).max(2100)).max(100).default([]),
});

const CampaignInputSchema = z
  .object({
    name: z.string().min(1).max(200),
    subject: z.string().min(1).max(300),
    body: z.string().min(1).max(100_000),
    type: z.enum(["email", "survey"]).default("email"),
    survey_id: z.string().uuid().nullable().optional(),
    tally_form_id: z.string().max(200).nullable().optional(),
    tally_form_url: z.string().url().max(2000).nullable().optional(),
  })
  .and(FiltersSchema);

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

async function getRecipients(
  filters: z.infer<typeof FiltersSchema>,
): Promise<{ id: string; email: string; name: string; graduation_year: number | null }[]> {
  let q = supabaseAdmin.from("alumni").select("id, email, full_name, graduation_year").eq("archived", false);
  if (filters.filter_mentorship_only) q = q.eq("mentorship_interest", true);
  if (filters.filter_tags.length) q = q.overlaps("tags", filters.filter_tags);
  if (filters.filter_grad_years.length) q = q.in("graduation_year", filters.filter_grad_years);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    email: r.email as string,
    name: (r.full_name as string) ?? "",
    graduation_year: (r.graduation_year as number | null) ?? null,
  }));
}

function personalizeBody(
  html: string,
  recipient: { name: string; graduation_year: number | null },
  surveyLink?: string,
): string {
  const firstName = recipient.name.split(" ")[0] || recipient.name;
  let out = html
    .replaceAll("{{first_name}}", firstName)
    .replaceAll("{{graduation_year}}", recipient.graduation_year ? String(recipient.graduation_year) : "");
  if (surveyLink !== undefined) {
    out = out.replaceAll("{{survey_link}}", surveyLink);
  }
  return out;
}

function getAppOrigin(): string {
  try {
    const req = getRequest();
    if (req) return new URL(req.url).origin;
  } catch {
    // no request context (e.g. called from edge fn)
  }
  const host = process.env.PUBLIC_HOST;
  if (host) return host.startsWith("http") ? host : `https://${host}`;
  return "http://localhost:3000";
}

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: _ctx }) => {
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { campaigns: (data ?? []) as unknown as CampaignRow[] };
  });

export const getCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context: _ctx }) => {
    const { data: row, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { campaign: (row ?? null) as unknown as CampaignRow | null };
  });

export const previewRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => FiltersSchema.parse(i))
  .handler(async ({ data, context: _ctx }) => {
    const count = await countRecipients(data);
    return { count };
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CampaignInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    // Email campaigns are admin-only; survey campaigns are open to all active users.
    if (data.type === "email") await assertCallerIsAdmin(supabase, userId);

    // Auto-fill tally fields from the linked survey when survey_id is provided.
    let tally_form_id = data.tally_form_id ?? null;
    let tally_form_url = data.tally_form_url ?? null;
    if (data.survey_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: survey } = await (supabaseAdmin as any)
        .from("surveys")
        .select("tally_form_id, form_url")
        .eq("id", data.survey_id)
        .maybeSingle();
      if (survey) {
        tally_form_id = (survey.tally_form_id as string | null) ?? null;
        tally_form_url = (survey.form_url as string | null) ?? null;
      }
    }

    const recipient_count = await countRecipients(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      name: data.name,
      subject: data.subject,
      body: data.body,
      type: data.type,
      survey_id: data.survey_id ?? null,
      tally_form_id,
      tally_form_url,
      filter_mentorship_only: data.filter_mentorship_only,
      filter_tags: data.filter_tags,
      filter_grad_years: data.filter_grad_years,
      status: "draft",
      recipient_count,
      created_by: userId,
    };
    const { data: created, error } = await supabaseAdmin
      .from("campaigns")
      .insert(payload)
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
      summary: `Created ${data.type} campaign ${created.name}`,
      after: created,
    });
    return { campaign: created as unknown as CampaignRow };
  });

const UpdateSchema = CampaignInputSchema.and(z.object({ id: z.string().uuid() }));

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpdateSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (before && before.status !== "draft") throw new Error("Only draft campaigns can be edited");
    const recipient_count = await countRecipients(data);
    // Auto-fill tally fields from the linked survey when survey_id is provided.
    let update_tally_form_id = data.tally_form_id ?? null;
    let update_tally_form_url = data.tally_form_url ?? null;
    if (data.survey_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: survey } = await (supabaseAdmin as any)
        .from("surveys")
        .select("tally_form_id, form_url")
        .eq("id", data.survey_id)
        .maybeSingle();
      if (survey) {
        update_tally_form_id = (survey.tally_form_id as string | null) ?? null;
        update_tally_form_url = (survey.form_url as string | null) ?? null;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      name: data.name,
      subject: data.subject,
      body: data.body,
      type: data.type,
      survey_id: data.survey_id ?? null,
      tally_form_id: update_tally_form_id,
      tally_form_url: update_tally_form_url,
      filter_mentorship_only: data.filter_mentorship_only,
      filter_tags: data.filter_tags,
      filter_grad_years: data.filter_grad_years,
      recipient_count,
    };
    const { data: updated, error } = await supabaseAdmin
      .from("campaigns")
      .update(payload)
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
    return { campaign: updated as unknown as CampaignRow };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
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
    const { data: before } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!before) throw new Error("Not found");
    if (before.status !== "draft") throw new Error("Only draft campaigns can be sent");

    await supabaseAdmin.from("campaigns").update({ status: "sending" }).eq("id", data.id);

    try {
      const campaignType = (before as unknown as CampaignRow).type ?? "email";

      if (campaignType === "survey") {
        return await sendSurveyCampaign({ before, campaignId: data.id, userId, claims });
      }

      // --- Email campaign ---
      const recipients = await getRecipients({
        filter_mentorship_only: before.filter_mentorship_only,
        filter_tags: before.filter_tags ?? [],
        filter_grad_years: before.filter_grad_years ?? [],
      });

      const emailBatch = recipients.map((r) => ({
        to: r.email,
        subject: before.subject,
        html: personalizeBody(before.body, r),
      }));
      const emailResult = await sendPersonalizedBatch(emailBatch);

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
        summary: `Sent email campaign ${updated.name} to ${recipients.length} recipients`,
        before,
        after: updated,
      });

      return {
        campaign: updated as unknown as CampaignRow,
        warning: !emailResult.sent ? "email_not_configured" : undefined,
      };
    } catch (err) {
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
        summary: `Campaign ${before.name} failed: ${(err as Error).message}`,
        before,
        after: failed,
        severity: "critical",
      });
      throw err;
    }
  });

async function sendSurveyCampaign({
  before,
  campaignId,
  userId,
  claims,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  before: any;
  campaignId: string;
  userId: string;
  claims: unknown;
}) {
  const recipients = await getRecipients({
    filter_mentorship_only: before.filter_mentorship_only,
    filter_tags: before.filter_tags ?? [],
    filter_grad_years: before.filter_grad_years ?? [],
  });

  // Generate a unique token per recipient
  const recipientRows = recipients.map((r) => ({
    campaign_id: campaignId,
    alumni_id: r.id,
    email: r.email,
    name: r.name,
    token: crypto.randomUUID(),
    graduation_year: r.graduation_year,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (supabaseAdmin as any)
    .from("survey_recipients")
    .insert(recipientRows.map(({ graduation_year: _gy, ...rest }) => rest));
  if (insertErr) throw new Error(insertErr.message);

  // Build personalized emails with unique survey links
  const origin = getAppOrigin();
  const emailBatch = recipientRows.map((r) => {
    const surveyLink = `${origin}/survey/respond/${r.token}`;
    const html = personalizeBody(before.body, { name: r.name, graduation_year: r.graduation_year }, surveyLink);
    return { to: r.email, subject: before.subject, html };
  });

  const emailResult = await sendPersonalizedBatch(emailBatch);
  const notConfigured = !emailResult.sent && emailResult.reason === "not_configured";

  // Mark sent_at on all recipients if emails were delivered
  if (emailResult.sent) {
    const sentAt = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from("survey_recipients")
      .update({ sent_at: sentAt })
      .eq("campaign_id", campaignId);
  }

  const sent_at = new Date().toISOString();
  const { data: updated, error } = await supabaseAdmin
    .from("campaigns")
    .update({ status: "sent", sent_at, recipient_count: recipients.length })
    .eq("id", campaignId)
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
    summary: `Sent survey campaign ${updated.name} to ${recipients.length} recipients${notConfigured ? " (email provider not configured — links generated only)" : ""}`,
    before,
    after: updated,
  });

  return {
    campaign: updated as unknown as CampaignRow,
    warning: notConfigured ? "email_not_configured" : undefined,
  };
}

export const listSurveyRecipients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ campaign_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context: _ctx }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("survey_recipients")
      .select("*")
      .eq("campaign_id", data.campaign_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { recipients: (rows ?? []) as SurveyRecipientRow[] };
  });

// Public server function — no auth middleware. Uses supabaseAdmin (service role).
// Called from the public /survey/respond/:token page.
export const trackSurveyOpen = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ token: z.string() }).parse(i))
  .handler(async ({ data }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabaseAdmin as any)
      .from("survey_recipients")
      .select("id, opened_at, campaign_id")
      .eq("token", data.token)
      .maybeSingle();

    if (error || !row) return { ok: false as const, reason: "invalid_token" };

    if (!row.opened_at) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from("survey_recipients")
        .update({ opened_at: new Date().toISOString() })
        .eq("token", data.token);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign } = await (supabaseAdmin as any)
      .from("campaigns")
      .select("tally_form_url, name")
      .eq("id", row.campaign_id)
      .maybeSingle();

    return {
      ok: true as const,
      tally_form_url: (campaign?.tally_form_url ?? null) as string | null,
      campaign_name: (campaign?.name ?? "") as string,
    };
  });
