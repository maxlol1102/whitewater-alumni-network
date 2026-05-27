import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  summary: string;
  severity: "info" | "warning" | "critical" | string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const PAGE_SIZE = 50;

const FiltersSchema = z
  .object({
    actor_id: z.string().uuid().optional(),
    action: z.string().max(120).optional(),
    entity_type: z.string().max(120).optional(),
    q: z.string().max(200).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.number().int().min(1).optional(),
  })
  .optional();

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => FiltersSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const page = data?.page ?? 1;
    const offset = (page - 1) * PAGE_SIZE;

    let q = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data?.actor_id) q = q.eq("actor_id", data.actor_id);
    if (data?.action) q = q.eq("action", data.action);
    if (data?.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data?.from) q = q.gte("created_at", new Date(data.from).toISOString());
    if (data?.to) q = q.lte("created_at", new Date(data.to).toISOString());
    if (data?.q) {
      const term = data.q.replace(/[%,]/g, "");
      q = q.or(`summary.ilike.%${term}%,entity_label.ilike.%${term}%,actor_email.ilike.%${term}%`);
    }

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return {
      logs: (rows ?? []) as AuditLogRow[],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    };
  });

export const getAuditLogFilters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin
      .from("audit_logs")
      .select("action, entity_type")
      .limit(5000);
    const actions = Array.from(new Set((data ?? []).map((r) => r.action))).sort();
    const entityTypes = Array.from(new Set((data ?? []).map((r) => r.entity_type))).sort();
    return { actions, entityTypes };
  });
