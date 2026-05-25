# Handoff Documentation for Local AI Coding Agents

Before writing anything, one important correction: **this project has NOT been migrated off Lovable Cloud.** The runtime is still pointing at the Lovable-managed Supabase project `dflyfzcctmzxfkdzpynb`. The ID `lahnnjgugabyqtnkhtgd` only appears (inert) in `supabase/config.toml` and `VITE_SUPABASE_PROJECT_ID`. The actual `.env` `VITE_SUPABASE_URL` + publishable key, and all auth/data traffic, still hit `dflyfzcctmzxfkdzpynb`.

The plan below documents the project **as it exists today** so an external agent (Claude / Codex / Cursor) can work on a local clone. It will call out exactly what the user must change on their own machine to point at `lahnnjgugabyqtnkhtgd` once they've actually copied schema + data there, since Lovable will overwrite those edits inside this project.

## Deliverables (all written to `/mnt/documents/`)

1. **`AGENTS.md`** — single root-level agent context file covering:
   - Product summary (alumni CRM: admin manages alumni, runs email campaigns, sends surveys, mentorship matching, audit log; roles = admin vs faculty/student user vs invited/disabled; from `src/lib/auth.tsx` + routes).
   - Stack: TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + shadcn/ui + TanStack Query + Supabase JS + Zod + Sonner.
   - Folder map: `src/routes/` (flat dot-routing, `_app.*` = authed shell), `src/components/{layout,alumni,campaigns,surveys,users,ui}`, `src/lib/*.functions.ts` (server fns) + `*.server.ts` (admin-only helpers), `src/integrations/supabase/*` (auto-generated, never edit).
   - Auth: `src/lib/auth.tsx` (`AuthProvider`, `useAuth`, `identityOf`, `canAccess`, `canEdit`) + gate in `src/components/layout/AppShell.tsx`. Server-side: `requireSupabaseAuth` middleware + `assertCallerIsAdmin` pattern in `src/lib/*.functions.ts`.
   - Data access rule: **all writes go through `createServerFn` in `src/lib/*.functions.ts`**, never direct `supabase.from(...).insert/update` from components. Reads may use the browser client.
   - Supabase schema summary: tables `profiles`, `alumni`, `campaigns`, `surveys`, `survey_responses`, `audit_logs`; DB functions `is_admin`, `handle_new_user`, `set_updated_at`; RLS = admins full access via `is_admin(auth.uid())`, active users can read alumni, users can read/update own profile, audit_logs admin-read-only and write-only via server fn.
   - No storage buckets, no edge functions in use (any inherited ones are not part of the runtime).
   - Rules for Claude: read existing files first, reuse `PageContainer`/`PageHeader`/`PageSection`/`Breadcrumbs`/`FormItemLayout`/`EmptyState`, follow flat route naming (`_app.{section}.$id_.edit.tsx`), never edit auto-generated Supabase files, never store roles outside `profiles.account_role`, never bypass RLS from the browser, always `writeAudit` after admin mutations, always run `bun run build` + `bun run typecheck` before declaring done.

2. **`MIGRATION_TO_OWN_SUPABASE.md`** — concrete checklist for actually moving to `lahnnjgugabyqtnkhtgd` on the local clone:
   - What Lovable owns and will rewrite inside the Lovable project (`.env`, `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`) — so the migration only sticks **on the local clone, outside Lovable's sync**.
   - SQL to run on the new project: full schema dump derived from the live tables/RLS/functions listed above (single consolidated migration file).
   - Data copy options (`pg_dump --data-only` from old → new, or CSV per table).
   - Auth users: not transferable automatically; either re-invite via the app's existing invite flow or use Supabase admin API to bulk-create.
   - New env vars to set locally: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ `LOVABLE_API_KEY` only if keeping Lovable AI Gateway, otherwise remove any AI calls).
   - Regenerate `src/integrations/supabase/types.ts` via `supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd`.
   - Things still Lovable-specific to audit/remove on the local clone: `.lovable/` folder, `CLAUDE.md` if it references Lovable, any `LOVABLE_API_KEY` usage (Lovable AI Gateway), `data-lovable-*` attributes, `wrangler.jsonc` if not deploying to Cloudflare.

3. **`FEATURE_REQUEST_TEMPLATE.md`** — the exact 11-section template from the prompt, pre-filled with project-specific hints (e.g. "Existing Files Claude Should Check First" lists `src/lib/auth.tsx`, the relevant `src/lib/*.functions.ts`, matching route file, and `src/components/layout/*`).

4. **`HANDOFF_SUMMARY.md`** — one-page TL;DR pointing at the three docs above and listing the user's next 5 concrete steps locally.

## What I will NOT do

- Will not edit `.env`, `supabase/config.toml`, or any `src/integrations/supabase/*` file — Lovable will revert them and it would mask the real state.
- Will not run the schema migration against `lahnnjgugabyqtnkhtgd` — I don't have credentials for it and this project's tools only reach `dflyfzcctmzxfkdzpynb`.
- Will not invent features or rewrite components.

## After approval

I'll read a handful of files I haven't seen yet (`src/routes/__root.tsx`, `src/routes/_app.tsx`, `src/components/layout/Page.tsx`, one representative `*.functions.ts`, `package.json`) to make the docs accurate, then write the four markdown files to `/mnt/documents/` and surface them as artifacts.
