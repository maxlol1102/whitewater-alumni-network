# AGENTS.md — AI Agent Reference

> Read this file first. It is the canonical technical reference for AI coding sessions on this project.
> For the full knowledgebase, see `KNOWLEDGEBASE.md`. For UI patterns, see `CLAUDE.md`.

---

## Product

Alumni relationship CRM for the UWW CS department. Admins manage alumni records, send email campaigns, distribute surveys, coordinate mentorship, manage users, and maintain an audit log. Faculty and student users can read alumni data and create survey campaigns.

## Stack

| | |
|---|---|
| Framework | TanStack Start v1 (SSR + server functions) |
| Language | TypeScript, React 19 |
| Bundler | Vite 7 |
| Router | TanStack Router (file-based, generated `routeTree.gen.ts`) |
| Data fetching | TanStack Query |
| Database | Supabase (PostgreSQL 15), project `lahnnjgugabyqtnkhtgd` |
| Auth | Supabase Auth (email/password) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Radix UI |
| Forms | react-hook-form + zodResolver |
| Validation | Zod |
| Email | Resend (`RESEND_API_KEY` in `.env`) |
| Toasts | Sonner |
| Icons | Lucide React |

---

## Role Model

Stored in `profiles.account_role`. Never in localStorage, never derived from JWT claims alone.

| Role | Access |
|------|--------|
| `admin` | Everything |
| `user` | Read alumni, view campaigns/surveys, create survey campaigns |

User statuses: `invited` → `active` → `disabled` / `deleted`. Only `active` users can use the app.

Auth helpers in `src/lib/auth.tsx`:
- `isActive(user)` — status === "active"
- `canEdit(user)` — isActive AND account_role === "admin"

---

## Route Naming

All authenticated routes are under `_app` layout. Flat structure — no nested routes.

| Pattern | File | Example |
|---------|------|---------|
| List | `_app.{section}.index.tsx` | `_app.campaigns.index.tsx` |
| Create | `_app.{section}.new.tsx` | `_app.campaigns.new.tsx` |
| Detail | `_app.{section}.$id.tsx` | `_app.campaigns.$id.tsx` |
| Edit | `_app.{section}.$id_.edit.tsx` | `_app.campaigns.$id_.edit.tsx` |
| Nested create | `_app.{parent}_.{child}.tsx` | `_app.settings.users_.new.tsx` |
| Public | `{section}.$param.tsx` | `survey.respond.$token.tsx` |

The `_` suffix on a segment (e.g. `$id_`) breaks TanStack Router's automatic layout nesting.
**Never add `<Outlet />` to a list or detail page.**

---

## Server Function Pattern

All DB mutations live in `src/lib/*.functions.ts`. Components never call `supabase.from()` directly.

```ts
export const myFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])           // ALWAYS include
  .inputValidator((i) => ZodSchema.parse(i))  // ALWAYS validate with Zod
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    // Admin-only operations only:
    await assertCallerIsAdmin(supabase, userId);

    // DB access — service role, bypasses RLS:
    const { data: result, error } = await supabaseAdmin.from("table").select("*");
    if (error) throw new Error(error.message);

    // Required after every admin mutation:
    await writeAudit({
      actor_id: userId,
      actor_email: (claims as { email?: string })?.email ?? null,
      action: "entity.action",
      entity_type: "entity",
      entity_id: result.id,
      entity_label: result.name,
      summary: `Did X to ${result.name}`,
      before, after: result,
    });

    return result;
  });
```

**Not all functions need `assertCallerIsAdmin`.** Survey campaign creation, alumni reads, survey/campaign list reads, and help content reads are accessible to all active users. See `docs/PERMISSIONS.md` for the full matrix.

---

## Key Files

| Purpose | Path |
|---------|------|
| Browser Supabase client | `src/integrations/supabase/client.ts` |
| Server Supabase admin client | `src/integrations/supabase/client.server.ts` |
| Auth middleware (server fn) | `src/integrations/supabase/auth-middleware.ts` |
| Generated DB types | `src/integrations/supabase/types.ts` |
| Auth context + guards | `src/lib/auth.tsx` |
| Admin assertion helper | `src/lib/users.server.ts` (`assertCallerIsAdmin`) |
| Audit write helper | `src/lib/alumni.server.ts` (`writeAudit`) |
| Email send helper | `src/lib/email.server.ts` (`sendPersonalizedBatch`) |
| Email HTML templates | `src/lib/email-templates.ts` |
| App shell + route guard | `src/components/layout/AppShell.tsx` |
| Sidebar nav | `src/components/layout/Sidebar.tsx` |
| Layout components | `src/components/layout/Page.tsx` |
| Help block component | `src/components/ui/HelpBlock.tsx` |

---

## Design System — Reuse These

**Layout:** `PageContainer`, `PageHeader`, `PageSection`, `Breadcrumbs`, `EmptyState`
(`src/components/layout/Page.tsx`)

**UI:** `Button`, `Card`, `Table`, `Dialog`, `AlertDialog`, `Sheet`, `Badge`, `Skeleton`, `Input`, `Textarea`, `Select`, `Switch`, `Checkbox`

**Empty states:** `<EmptyState icon={...} title="..." description="..." action={...} />`

**Help content:** `<HelpBlock helpKey="..." fallback={{ title: "...", body: "..." }} className="mb-4" />`
Place below PageHeader, above the main content. Use `HelpBlock` for all feature-level explanatory text — never hard-code it.

**Design tokens (never hard-code colors):**
`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-primary`, `text-primary-foreground`

---

## Database Tables (summary)

| Table | Purpose |
|-------|---------|
| `profiles` | Auth users mirror; `account_role`, `user_category`, `status` |
| `alumni` | Alumni records; `tags[]`, `mentorship_interest`, `archived` |
| `campaigns` | Email/survey outreach; `survey_id FK → surveys`, `type`, `status` |
| `surveys` | Tally.so form definitions; `tally_form_id`, `form_url` |
| `survey_recipients` | Per-recipient token rows for survey campaigns |
| `survey_responses` | Tally webhook payloads (one per submission) |
| `audit_logs` | Append-only admin action log |
| `help_content` | Admin-editable help text blocks, keyed by feature slug |

See `KNOWLEDGEBASE.md` for full column lists. See `docs/ARCHITECTURE.md` for ER diagram and RLS details.

---

## Audit Log

Call `writeAudit(...)` after every successful admin mutation. It writes to `audit_logs` via service role.

Required fields: `actor_id`, `actor_email`, `action`, `entity_type`, `entity_id`, `entity_label`, `summary`.
Optional: `before` (jsonb), `after` (jsonb), `severity` (default: `info`).

`audit_logs` is admin-read-only. It is never written from components.

---

## NEVER

- Commit `.env` or paste `SUPABASE_SERVICE_ROLE_KEY` anywhere in source
- Import `supabaseAdmin` or `client.server.ts` from a route or component file
- Call `supabase.from(...).insert/update/delete` directly from a component
- Skip Zod validation in server functions
- Skip `writeAudit` after admin mutations
- Add `<Outlet />` to a detail or list route
- Edit `src/integrations/supabase/types.ts` manually (regenerate instead)
- Store `account_role` or permissions in localStorage
- Change `profiles.account_role` logic without explicit approval
- Loosen RLS policies without understanding the security impact
- Hard-code help/documentation text — use `<HelpBlock>` instead
- Use em-dashes in PageHeader description copy (UI null-value dashes in tables are fine)

---

## How to Regenerate DB Types

Run after any schema change:
```bash
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
  > src/integrations/supabase/types.ts
```

Currently outdated — `tally_form_id` on surveys and `survey_id` on campaigns are missing.
Use `(supabaseAdmin as any).from(...)` as a workaround until regenerated.

---

## Before Declaring Done

1. `npx tsc --noEmit` — no TypeScript errors
2. `bun run build` — build succeeds
3. Happy path works end-to-end in browser
4. Admin and user role access both correct
5. Audit log entry written for every admin mutation
6. Loading, empty, and error states render correctly
7. No direct `supabase.from()` writes in components
