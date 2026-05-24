import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";

export type SurveyRow = {
  id: string;
  title: string;
  description: string;
  form_url: string;
  campaign_id: string | null;
  response_count: number;
  created_at: string;
  updated_at: string;
};

export type SurveyListItem = SurveyRow & { campaign_name: string | null };

export type SurveyResponseRow = {
  id: string;
  survey_id: string;
  email: string;
  alumni_id: string | null;
  submitted_at: string;
  alumni_name: string | null;
};

const SurveyInputSchema = z.object({
  title: z.string().min(1).max(200),
  form_url: z.string().url().max(1000),
  description: z.string().max(2000).optional().default(""),
  campaign_id: z.string().uuid().nullable().optional(),
});

const IdSchema = z.object({ id: z.string().uuid() });

export const listSurveys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("surveys")
      .select("*, campaigns(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const surveys: SurveyListItem[] = (data ?? []).map((s: Record<string, unknown>) => {
      const camp = s.campaigns as { name?: string } | null;
      const { campaigns: _c, ...rest } = s;
      return { ...(rest as SurveyRow), campaign_name: camp?.name ?? null };
    });
    return { surveys };
  });

export const getSurvey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { survey: (row ?? null) as SurveyRow | null };
  });

export const createSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SurveyInputSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: created, error } = await supabaseAdmin
      .from("surveys")
      .insert({
        title: data.title,
        form_url: data.form_url,
        description: data.description ?? "",
        campaign_id: data.campaign_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "survey.created",
      entity_type: "survey",
      entity_id: created.id,
      entity_label: created.title,
      summary: `Created survey ${created.title}`,
      after: created,
    });
    return { survey: created as SurveyRow };
  });

const UpdateSchema = SurveyInputSchema.and(z.object({ id: z.string().uuid() }));

export const updateSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpdateSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin.from("surveys").select("*").eq("id", data.id).maybeSingle();
    const { data: updated, error } = await supabaseAdmin
      .from("surveys")
      .update({
        title: data.title,
        form_url: data.form_url,
        description: data.description ?? "",
        campaign_id: data.campaign_id ?? null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "survey.updated",
      entity_type: "survey",
      entity_id: updated.id,
      entity_label: updated.title,
      summary: `Updated survey ${updated.title}`,
      before,
      after: updated,
    });
    return { survey: updated as SurveyRow };
  });

export const deleteSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => IdSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { data: before } = await supabaseAdmin.from("surveys").select("*").eq("id", data.id).maybeSingle();
    await supabaseAdmin.from("survey_responses").delete().eq("survey_id", data.id);
    const { error } = await supabaseAdmin.from("surveys").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "survey.deleted",
      entity_type: "survey",
      entity_id: data.id,
      entity_label: before?.title ?? null,
      summary: `Deleted survey ${before?.title ?? data.id}`,
      before,
    });
    return { ok: true };
  });

export const listSurveyResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ survey_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("survey_responses")
      .select("*, alumni(full_name)")
      .eq("survey_id", data.survey_id)
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    const responses: SurveyResponseRow[] = (rows ?? []).map((r: Record<string, unknown>) => {
      const a = r.alumni as { full_name?: string } | null;
      const { alumni: _a, ...rest } = r;
      return { ...(rest as Omit<SurveyResponseRow, "alumni_name">), alumni_name: a?.full_name ?? null };
    });
    return { responses };
  });
