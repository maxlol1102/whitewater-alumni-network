# CLAUDE.md — Engineering Guide

UI patterns, conventions, and rules for building features in this project.
For technical context (DB schema, server fn pattern, key files), see `AGENTS.md`.

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

## User Roles and Route Guards

Two roles: `admin` and `user`. Helpers in `src/lib/auth.tsx`:

| Helper | True when |
|--------|-----------|
| `isActive(user)` | status === "active" |
| `canEdit(user)` | isActive AND account_role === "admin" |

Route guard pattern:
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

Query `enabled` condition:
```tsx
enabled: canEdit(user)   // admin-only data
enabled: isActive(user)  // all-user data
```

**Who can access what:**
- Alumni, Mentorship, Campaigns/Surveys list+detail: all active users
- Email campaign create, Alumni CRUD, Survey CRUD, User management, Audit log: admin only
- Survey campaign create: all active users

---

## Server Functions

All mutations go through `createServerFn` in `src/lib/*.functions.ts`. Never call `supabase.from()` from a component.

- `requireSupabaseAuth` middleware on every function
- `assertCallerIsAdmin` for admin-only operations (omit for user-accessible ones)
- Zod validation at the top of the file
- `writeAudit` after every successful admin mutation
- For tables missing from generated types, cast: `(supabaseAdmin as any).from("table")`

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

## Copy Style

- No em-dashes in PageHeader descriptions or prose copy. Use a period or comma instead.
- Em-dashes in table cell null-value placeholders (`{value ?? "—"}`) are fine.
- Descriptions: specific, active, benefit-first. Write like the product does something useful, not like you're explaining what it is.

---

## Design Tokens

Never hard-code colors. Use:
`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-primary`, `text-primary-foreground`
