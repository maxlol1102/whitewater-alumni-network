// Server-only helpers for alumni management. Never import from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function writeAudit(params: {
  actor_id: string;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string | null;
  entity_label?: string | null;
  summary?: string;
  before?: unknown;
  after?: unknown;
  severity?: string;
}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: params.actor_id,
    actor_email: params.actor_email ?? null,
    actor_role: params.actor_role ?? "admin",
    action: params.action,
    entity_type: params.entity_type ?? "alumni",
    entity_id: params.entity_id ?? null,
    entity_label: params.entity_label ?? null,
    summary: params.summary ?? "",
    before: (params.before ?? null) as never,
    after: (params.after ?? null) as never,
    severity: params.severity ?? "info",
  });
  if (error) console.error("[audit] failed:", error.message);
}
