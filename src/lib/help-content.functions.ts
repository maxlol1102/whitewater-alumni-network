import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";

export type HelpContentRow = {
  key: string;
  title: string;
  body: string;
  updated_at: string;
  updated_by: string | null;
};

const UpsertSchema = z.object({
  key: z.string().min(1).max(120).regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores"),
  title: z.string().max(200).optional().transform((v) => v ?? ""),
  body: z.string().max(10_000),
});

// Any authenticated user can read — help content is not sensitive
export const getHelpContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ key: z.string() }).parse(i))
  .handler(async ({ data }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabaseAdmin as any)
      .from("help_content")
      .select("*")
      .eq("key", data.key)
      .maybeSingle();
    return { content: (row ?? null) as HelpContentRow | null };
  });

export const listHelpContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from("help_content")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as HelpContentRow[] };
  });

export const upsertHelpContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      key: data.key,
      title: data.title,
      body: data.body,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabaseAdmin as any)
      .from("help_content")
      .upsert(payload, { onConflict: "key" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "help_content.upserted",
      entity_type: "help_content",
      entity_id: data.key,
      entity_label: data.key,
      summary: `Updated help content for key "${data.key}"`,
      after: row,
    });

    return { content: row as HelpContentRow };
  });

export const deleteHelpContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ key: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
      .from("help_content")
      .delete()
      .eq("key", data.key);
    if (error) throw new Error(error.message);

    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "help_content.deleted",
      entity_type: "help_content",
      entity_id: data.key,
      entity_label: data.key,
      summary: `Deleted help content for key "${data.key}"`,
    });

    return { ok: true };
  });
