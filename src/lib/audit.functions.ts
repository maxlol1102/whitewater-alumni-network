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

const FiltersSchema = z
  .object({
    actor_id: z.string().uuid().optional(),
    action: z.string().max(120).optional(),
    entity_type: z.string().max(120).optional(),
    q: z.string().max(200).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .optional();

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => FiltersSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    let q = supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data?.actor_id) q = q.eq("actor_id", data.actor_id);
    if (data?.action) q = q.eq("action", data.action);
    if (data?.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data?.from) q = q.gte("created_at", new Date(data.from).toISOString());
    if (data?.to) q = q.lte("created_at", new Date(data.to).toISOString());
    if (data?.q) {
      const term = data.q.replace(/[%,]/g, "");
      q = q.or(`summary.ilike.%${term}%,entity_label.ilike.%${term}%,actor_email.ilike.%${term}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: (rows ?? []) as AuditLogRow[] };
  });
