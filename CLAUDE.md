# CLAUDE.md — Engineering Guide

UI patterns, conventions, and rules for building features in this project.
For technical context (DB schema, server fn pattern, key files), see `AGENTS.md`.

---

## Engineering Process

### Core Principles
- **Simplicity first** — the best solution is usually the smallest one
- **Surgical changes** — touch only what the task requires; don't clean up unrelated code
- **Reuse before inventing** — check for existing utilities, components, and patterns before writing new ones
- **No new libraries** — use what's already installed; ask first if a new package is genuinely needed

### Before Making Changes
1. **Understand** — read the request carefully; ask if anything is ambiguous
2. **Inspect** — read the relevant files; find the exact lines that need changing
3. **Plan** — identify the smallest change that solves the problem; list the files that will be touched
4. **Implement** — make only the planned changes; do not refactor surrounding code
5. **Verify** — re-read edited code; confirm the change is correct and nothing unrelated shifted

### Response Format
After every code change, end with:

**What changed:** one-line summary
**Files touched:** list of modified files
**Why:** the reason for the approach chosen
**Testing:** how to verify the change works

### Golden Rule
> Think first. Build small. Touch only what matters.

---

## Data Safety

**Never do these — no exceptions:**
- Call `supabase.from(...).insert/update/delete` from a component or route
- Import `supabaseAdmin` or `client.server.ts` from client-side code
- Skip Zod validation in a server function
- Skip `writeAudit` after a successful admin mutation
- Store `account_role` or permissions in `localStorage`
- Use `VITE_` prefix on secret keys (embeds them in the browser bundle)
- Edit `src/integrations/supabase/types.ts` manually (auto-generated — will be overwritten)
- Commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` in any source file
- Add `<Outlet />` to a list or detail route

**`context.supabase` vs `supabaseAdmin`:**

| Client | Scope | Use for |
|--------|-------|---------|
| `context.supabase` | Request user's token | Reads where RLS should apply |
| `supabaseAdmin` (server-only) | Service role — bypasses RLS | All writes; admin reads |

All mutations use `supabaseAdmin`. Reads may use either depending on whether RLS should apply.

**Tables missing from generated types:**
```typescript
(supabaseAdmin as any).from("table_name")
```

---

## Server Functions

All mutations live in `src/lib/*.functions.ts`. Never call `supabase.from()` from a component.

**Builder pattern:**
```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCallerIsAdmin } from "./users.server";
import { writeAudit } from "./alumni.server";

const DeleteSchema = z.object({ id: z.string().uuid() });
export type DeleteInput = z.infer<typeof DeleteSchema>;

export const deleteAlumni = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCallerIsAdmin(supabase, userId);
    const { error } = await supabaseAdmin.from("alumni").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit({ actor_id: userId, action: "delete", entity_type: "alumni", entity_id: data.id });
  });
```

**Rules:**
- `requireSupabaseAuth` middleware on every function — injects `{ supabase, userId, claims }`
- `assertCallerIsAdmin(supabase, userId)` for admin-only operations; omit for user-accessible ones
- Zod schema defined before each function; export the inferred type alongside it
- `writeAudit` after every successful admin mutation
- Throw `new Error(error.message)` on DB errors — TanStack catches and surfaces these

---

## Data Fetching

Bind server functions with `useServerFn` before using them in queries or mutations.

**Query:**
```typescript
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAlumni } from "@/lib/alumni.functions";

const fetchAll = useServerFn(listAlumni);

const { data, isLoading, error } = useQuery({
  queryKey: ["alumni", filters],
  queryFn: () => fetchAll({ data: filters }),
  enabled: isActive(user),
});
```

**Mutation:**
```typescript
const doDelete = useServerFn(deleteAlumni);
const queryClient = useQueryClient();

const deleteMut = useMutation({
  mutationFn: (id: string) => doDelete({ data: { id } }),
  onSuccess: () => {
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["alumni"] });
    navigate({ to: "/alumni" });
  },
  onError: (e: Error) => toast.error(e.message),
});
```

**Rules:**
- `queryKey` must include every variable the query depends on
- `enabled: isActive(user)` for user-accessible data; `enabled: canEdit(user)` for admin-only
- `placeholderData: (prev) => prev` for paginated queries — prevents flash on page change
- Always `queryClient.invalidateQueries` then `navigate` on mutation success
- `loading={mutation.isPending}` on the submit button

---

## Layout Patterns

Pick the right container for the screen type:

| Screen type | Container |
|-------------|-----------|
| Lists, detail pages, full-width tables | `PageContainer` (no width constraint) |
| Forms, settings, config | `PageSection` (max-w-5xl; pass `className="max-w-6xl"` for two-column) |

**Parent pages** (list, landing): `PageContainer → PageHeader → content`

**Child pages** (create, edit, detail): `PageContainer → PageHeader (className="mb-0") → Breadcrumbs → content`

`Breadcrumbs` needs at least 2 items or it renders nothing.

### Route file naming

Every page is flat under `_app` — never nest pages inside `<Outlet>`.

| Pattern | File |
|---------|------|
| List | `_app.{section}.index.tsx` |
| Create | `_app.{section}.new.tsx` |
| Detail | `_app.{section}.$id.tsx` |
| Edit | `_app.{section}.$id_.edit.tsx` |
| Nested create | `_app.{parent}_.{child}.tsx` |

The `_` suffix on a segment breaks layout nesting. Never add `<Outlet />` to a list or detail page.

---

## Forms

Structure: `PageSection → Card → CardHeader → CardContent → CardFooter`

- Use `FormItemLayout` for labeled rows.
- Wrap controlled inputs in `FormControl` (Radix Slot — exactly one child).
- `form.formState.isDirty` to track dirty state.
- Disable save when form is unchanged; show Cancel only when dirty.
- `toast.success` / `toast.error` from `sonner` for feedback.
- `loading={mutation.isPending}` on the submit button.
- On success: `queryClient.invalidateQueries` then `navigate`.

---

## Tables

`Card → Table → TableHeader / TableBody`

Always include:
- Skeleton rows while loading (`Array.from({ length: N }).map(...)`)
- Empty state for no data
- Empty state for no search results (different message)

---

## Empty States

```tsx
<EmptyState
  icon={SomeIcon}
  title="No campaigns yet"
  description="Active verb sentence. No passive voice."
  action={<Button>...</Button>}
/>
```

Use active language: "Create alumni profile" not "No alumni found."

---

## Modality

| Component | When to use |
|-----------|-------------|
| `AlertDialog` | Destructive confirmation only. No forms inside. |
| `Dialog` | Short inline action, 1–3 fields. Confirm before closing if dirty. |
| Sheet | Longer edit panel, side view. |

Anything more than 3–4 fields → use a secondary page, not a modal.

---

## Button `asChild` Rule

`<Button asChild>` uses Radix Slot — it requires exactly one React element child.

```tsx
// correct
<Button asChild><Link to="/campaigns/new">Create</Link></Button>

// wrong — two children
<Button asChild><Plus /><Link to="/campaigns/new">Create</Link></Button>
```

The `loading` prop is ignored when `asChild=true`.

---

## User Roles & Route Guards

Two roles: `admin` and `user`. Helpers in `src/lib/auth.tsx`:

| Helper | Returns | True when |
|--------|---------|-----------|
| `isActive(user)` | `boolean` | status === "active" |
| `canEdit(user)` | `boolean` | isActive AND account_role === "admin" |
| `identityOf(user)` | string literal | `"admin" \| "faculty_user" \| "student_user" \| "invited" \| "disabled"` |

**Route guard pattern:**
```tsx
// Admin-only page
useEffect(() => {
  if (user && !canEdit(user)) navigate({ to: "/dashboard" });
}, [user, navigate]);

// All active users
useEffect(() => {
  if (user && !isActive(user)) navigate({ to: "/dashboard" });
}, [user, navigate]);
```

**Query `enabled` condition:**
```tsx
enabled: canEdit(user)   // admin-only data
enabled: isActive(user)  // all-user data
```

**Server-side guard (for cross-user operations):**
```typescript
import { guardDelete } from "@/lib/user-guards";
const result = guardDelete(actorProfile, targetProfile);
if (!result.ok) throw new Error(result.reason);
```

**Who can access what:**
- Alumni, Mentorship, Campaigns/Surveys list+detail: all active users
- Email campaign create, Alumni CRUD, Survey CRUD, User management, Audit log: admin only
- Survey campaign create: all active users

---

## Help Content

Feature-level explanatory text belongs in the `help_content` DB table, not hard-coded in JSX. Admins can update it from Settings → Help content without a deployment.

```tsx
import { HelpBlock } from "@/components/ui/HelpBlock";

// Below PageHeader, above the main content:
<HelpBlock
  helpKey="email_campaign"
  fallback={{ title: "Email campaigns", body: "Shown while loading or if key doesn't exist yet." }}
  className="mb-4"
/>
```

Existing keys: `email_campaign`, `survey_campaign`, `survey`, `mentorship`, `alumni_import`

To add a key: Settings → Help content → Add new, then add `<HelpBlock>` to the page.

---

## Copy & Style

**Language:**
- No em-dashes in PageHeader descriptions or prose. Use a period or comma instead.
- Em-dashes in null-value table cell placeholders (`{value ?? "—"}`) are fine.
- Descriptions: specific, active, benefit-first. Not "No alumni found" — "Add the first alumni record."

**Design tokens — never hard-code colors:**
`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-primary`, `text-primary-foreground`

UW brand colors `#582C83` (purple) and `#CFB87C` (gold) are acceptable only in charts and decorative artwork.

**Class merging:**
```typescript
import { cn } from "@/lib/utils";
<div className={cn("base-classes", condition && "conditional-class", className)} />
```
