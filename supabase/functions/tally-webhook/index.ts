import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: unknown;
}

interface TallyPayload {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submittedAt: string;
    formId: string;
    formName: string;
    fields: TallyField[];
  };
}

function extractEmail(fields: TallyField[]): string | null {
  const emailField = fields.find(
    (f) =>
      f.type === "INPUT_EMAIL" ||
      f.label.toLowerCase() === "email" ||
      f.label.toLowerCase().includes("email address"),
  );
  if (!emailField) return null;
  const val = emailField.value;
  return typeof val === "string" && val.includes("@") ? val.trim().toLowerCase() : null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: TallyPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.eventType !== "FORM_RESPONSE") {
    return new Response("ok", { status: 200 });
  }

  const { formId, fields = [], responseId, submittedAt } = payload.data ?? {} as TallyPayload["data"];
  if (!formId) return new Response("Missing formId", { status: 400 });

  // Look up survey by tally_form_id
  const { data: survey } = await supabase
    .from("surveys")
    .select("id")
    .eq("tally_form_id", formId)
    .maybeSingle();

  if (!survey) {
    // Unknown form — return 200 so Tally doesn't retry
    return new Response("ok", { status: 200 });
  }

  const email = extractEmail(fields);
  if (!email) return new Response("No email field found", { status: 422 });

  // Match to alumni record
  const { data: alumni } = await supabase
    .from("alumni")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  // Skip duplicates (same survey + email)
  const { data: existing } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("survey_id", survey.id)
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    await supabase.from("survey_responses").insert({
      survey_id: survey.id,
      email,
      alumni_id: alumni?.id ?? null,
      submitted_at: submittedAt ?? new Date().toISOString(),
      payload: { responseId, fields },
    });

    // Sync response_count from actual row count
    const { count } = await supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", survey.id);

    await supabase
      .from("surveys")
      .update({ response_count: count ?? 0 })
      .eq("id", survey.id);
  }

  return new Response("ok", { status: 200 });
});
