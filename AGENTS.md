# AGENTS.md — Technical Reference

> AI agent context. Read this + `CLAUDE.md` before any session. For setup/features, see `README.md`.

---

## Product

Alumni CRM for UWW CS department. Admins manage alumni, send campaigns, run surveys, coordinate mentorship. Faculty/students can view alumni data and create survey campaigns.

## Stack

| | |
|---|---|
| Framework | TanStack Start v1 (SSR + server functions) |
| Language | TypeScript, React 19 |
| Router | TanStack Router (file-based, flat routing) |
| Database | Supabase PostgreSQL 15, project `lahnnjgugabyqtnkhtgd` |
| Auth | Supabase Auth (email/password) |
| Styling | Tailwind CSS v4, shadcn/ui New York, Radix UI |
| Forms | react-hook-form + zodResolver |
| Email | Resend (`RESEND_API_KEY`) |
| Toasts | Sonner |

## Role Model

Stored in `profiles.account_role`. Never in localStorage.

| Role | Access |
|------|--------|
| `admin` | Everything |
| `user` | Read alumni, view campaigns/surveys, create survey campaigns |

Statuses: `invited` → `active` → `disabled` / `deleted`. Only `active` users can use the app.

Auth helpers (`src/lib/auth.tsx`): `isActive(user)`, `canEdit(user)` (admin check).

## Database Tables

| Table | Key columns |
|-------|-------------|
| `profiles` | `id`, `account_role` (admin\|user), `user_category` (faculty\|student), `status` |
| `alumni` | `email` (unique), `tags[]`, `mentorship_interest`, `archived` |
| `campaigns` | `type` (email\|survey), `survey_id FK→surveys`, `tally_form_id`, `tally_form_url`, `status` |
| `surveys` | `form_url`, `tally_form_id`, `campaign_id FK→campaigns` (legacy reverse link) |
| `survey_recipients` | `campaign_id`, `token` (unique), `sent_at`, `opened_at`, `submitted_at` |
| `survey_responses` | `survey_id`, `email`, `alumni_id` — Tally webhook payloads |
| `audit_logs` | `actor_id`, `action`, `entity_type`, `before/after` (jsonb), `severity` |
| `help_content` | `key` (PK), `title`, `body` — admin-editable, served via `<HelpBlock>` |

**campaigns ↔ surveys:** `campaigns.survey_id` is the primary FK (campaign picks a survey). `surveys.campaign_id` is legacy. When a campaign is saved with a `survey_id`, the server copies `tally_form_id` and `form_url` from the survey.

## Server Function Pattern

All mutations live in `src/lib/*.functions.ts`. Components never call `supabase.from()` directly.

```ts
export const myFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])            // always
  .inputValidator((i) => ZodSchema.parse(i))   // always
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    await assertCallerIsAdmin(supabase, userId); // admin-only functions only

    const { data: result, error } = await supabaseAdmin.from("table").select("*");
    if (error) throw new Error(error.message);

    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "entity.action",
      entity_type: "entity",
      entity_id: result.id,
      entity_label: result.name,
      summary: `...',
      before, after: result,
    });

    return result;
  });
```

Not all functions need `assertCallerIsAdmin` — see `docs/ARCHITECTURE.md` for the full permission map.

## Key Files

| Purpose | Path |
|---------|------|
| Browser Supabase client | `src/integrations/supabase/client.ts` |
| Server Supabase admin client | `src/integrations/supabase/client.server.ts` |
| Auth middleware | `src/integrations/supabase/auth-middleware.ts` |
| Generated DB types | `src/integrations/supabase/types.ts` (never edit manually) |
| Auth context + guards | `src/lib/auth.tsx` |
| Admin assertion | `src/lib/users.server.ts` — `assertCallerIsAdmin` |
| Audit helper | `src/lib/alumni.server.ts` — `writeAudit` |
| Email send | `src/lib/email.server.ts` — `sendPersonalizedBatch` |
| Email HTML templates | `src/lib/email-templates.ts` |
| App shell / route guard | `src/components/layout/AppShell.tsx` |
| Layout components | `src/components/layout/Page.tsx` |
| Help block | `src/components/ui/HelpBlock.tsx` |

## NEVER

- Commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` in any source file
- Import `supabaseAdmin` or `client.server.ts` from a route or component
- Call `supabase.from(...).insert/update/delete` from a component
- Skip Zod validation in server functions
- Skip `writeAudit` after admin mutations
- Add `<Outlet />` to a list or detail route
- Edit `src/integrations/supabase/types.ts` manually — regenerate it
- Store `account_role` or permissions in localStorage
- Hard-code help text — use `<HelpBlock>` (see `CLAUDE.md`)

## Before Declaring Done

1. `npx tsc --noEmit` passes
2. `bun run build` passes
3. Happy path works in browser
4. Admin and user roles both work correctly
5. `writeAudit` called for every admin mutation
6. Loading, empty, and error states render
