# Architecture Decisions

Key decisions made during development, with rationale. Ordered most recent first.

---

## ADR-008 — Survey picker replaces manual Tally inputs (May 2026)

**Decision:** When creating a survey campaign, the user picks from existing surveys in the system rather than typing a Tally form ID and URL manually.

**Rationale:**
- Manual entry of Tally IDs is error-prone and disconnected from the surveys list
- A picker creates an explicit FK relationship between campaign and survey
- `tally_form_id` and `form_url` auto-fill server-side from the linked survey, eliminating duplication
- The survey definition becomes the authoritative source of Tally form coordinates

**Consequences:**
- `campaigns.survey_id` FK added; server copies tally fields on save
- The old `surveys.campaign_id` reverse FK still exists (legacy) but is not the primary relationship
- If a survey is deleted, `campaigns.survey_id` sets NULL (ON DELETE SET NULL)

---

## ADR-007 — Survey campaigns open to all active users, email campaigns admin-only (May 2026)

**Decision:** Any `active` user (faculty or student) can create survey campaigns. Email campaigns require admin.

**Rationale:**
- Faculty and students need to distribute surveys as part of research or coursework
- Email campaigns carry more risk (mass outreach, branding) so admin oversight is appropriate
- The split happens in `createCampaign`: `if (data.type === "email") await assertCallerIsAdmin(...)`

**Consequences:**
- Sidebar Campaigns/Surveys sections visible to all active users
- Route guards updated from admin-check to `isActive` check on list/detail pages
- CampaignForm hides the type toggle for non-admins (always survey)
- Editing, deleting, and sending campaigns remains admin-only

---

## ADR-006 — Dynamic help content in DB, not hard-coded (May 2026)

**Decision:** Feature-level explanatory text is stored in `help_content` table and served via `<HelpBlock>` component rather than hard-coded in JSX.

**Rationale:**
- Admins need to update terminology, add context, or fix typos without a code deployment
- The `<HelpBlock>` pattern decouples content management from engineering

**Consequences:**
- Every new feature page should include a `<HelpBlock helpKey="..." fallback={...} />` above the main content
- Admin must add the key to `help_content` table (or the fallback is shown permanently)
- React Query caches content for 5 minutes; changes propagate within one cache cycle

---

## ADR-005 — Email preview in sandboxed iframe, not dangerouslySetInnerHTML (May 2026)

**Decision:** The campaign form previews email HTML in an `<iframe srcDoc={...} sandbox="allow-same-origin">`.

**Rationale:**
- `dangerouslySetInnerHTML` would execute `<script>` tags from template HTML inside the app's DOM
- `sandbox="allow-same-origin"` blocks JavaScript execution entirely while allowing CSS
- Iframe isolates the email's styles from the app's Tailwind styles

**Consequences:**
- Preview shows accurate rendering: white background, email fonts, full responsive layout
- `applyPreviewSamples()` substitutes placeholders with realistic values for preview only

---

## ADR-004 — All mutations through server functions, never direct from components (May 2023)

**Decision:** `supabase.from(...).insert/update/delete` is only called inside `createServerFn` handlers in `src/lib/*.functions.ts`. Components call server functions via `useServerFn`.

**Rationale:**
- Server functions run on the server where the service role key is safe
- Centralizes authorization checks (`assertCallerIsAdmin`, Zod validation)
- Ensures `writeAudit` is called consistently after every mutation
- Prevents accidental RLS bypass from the browser

**Consequences:**
- `supabaseAdmin` imported only in `src/integrations/supabase/client.server.ts` and `*.server.ts` files
- Components never import `SUPABASE_SERVICE_ROLE_KEY`
- All server functions validate input with Zod before touching the DB

---

## ADR-003 — Flat file-based routing with `_` suffix to break layout nesting (May 2023)

**Decision:** All app routes are flat under `src/routes/_app.*.tsx`. The `_` suffix on a segment (e.g. `$id_`) breaks TanStack Router's automatic layout nesting.

**Rationale:**
- Nested layouts make it easy to accidentally render children inside parent components
- Flat routing forces explicit composition and makes each page self-contained
- Easier for AI agents to understand which file to edit for a given route

**Consequences:**
- `<Outlet />` is never added to list or detail pages
- Edit pages are named `_app.section.$id_.edit.tsx` (note the underscore after `$id`)
- The pattern is documented in `CLAUDE.md` and `AGENTS.md`

---

## ADR-002 — RLS stays on; service role only in server functions (May 2023)

**Decision:** Row Level Security is active on every table. The service role key is only used server-side.

**Rationale:**
- Defense in depth: even if a server function bug allows unauthorized access, RLS is a second guard
- Service role key exposure in browser code would give any user full DB access
- Supabase's `supabaseAdmin` (service role) is instantiated once in `client.server.ts` and never exported to browser code

**Consequences:**
- Every new table must have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and at least one policy
- Server functions that read-only (no admin check needed) still use `supabaseAdmin` to bypass RLS for performance (avoids redundant policy evaluation when the server function already enforces auth)
- Tables missing policies return empty results to authenticated users (not errors)

---

## ADR-001 — One admin account, user category required for all others (May 2023)

**Decision:** `account_role` has two values: `admin` and `user`. All non-admin profiles must have a `user_category` (`faculty` or `student`). This is enforced by a DB check constraint.

**Rationale:**
- The department runs a single admin account; role escalation is not self-service
- Category distinguishes faculty from students in mentorship and filtering contexts
- Check constraint at the DB layer prevents bypassing this via server function bugs

**Consequences:**
- `profiles` has `constraint profiles_category_required_for_user check (account_role = 'admin' or user_category is not null)`
- Creating a user requires specifying category; admin account is exempt
- `profiles.account_role` must never be changed without explicit approval
