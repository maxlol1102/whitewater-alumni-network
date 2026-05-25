# UI Pattern Guide

Before building UI, choose the correct pattern first. Do not randomly place components.

## Core Flow

For every feature:
1. Understand the user goal.
2. Identify the screen type.
3. Pick the correct UI pattern.
4. Reuse existing components.
5. Add loading, empty, error, and success states.
6. Keep the next action obvious.

## Layout

Use our project layout pattern:

- **Parent pages**: show main header only (`PageHeader` inside `PageContainer`).
- **Child pages**: show main header first, then `Breadcrumbs` row, then content. The `Breadcrumbs` component requires at least 2 items — if there are fewer it renders nothing.
- Use focused width for forms/settings: `PageSection` (defaults to `max-w-5xl`, pass `className="max-w-6xl"` for two-column forms).
- Use default width for lists/details: `PageContainer` with no width constraint.
- Use full width only for dense tables, logs, editors, charts.

### Route file naming (TanStack Router)

Every page is a **flat secondary page** — never nest a child page inside another page's `<Outlet>`.

| Pattern | File name | Example |
|---|---|---|
| Main list | `_app.{section}.index.tsx` | `_app.campaigns.index.tsx` |
| New / create | `_app.{section}.new.tsx` | `_app.campaigns.new.tsx` |
| Detail | `_app.{section}.$id.tsx` | `_app.campaigns.$id.tsx` |
| Edit | `_app.{section}.$id_.edit.tsx` | `_app.campaigns.$id_.edit.tsx` |
| Nested section new | `_app.{parent}_.{child}.tsx` | `_app.settings.users_.new.tsx` |

The `_` suffix on a segment (e.g. `$id_`, `users_`) breaks the layout nesting so the edit/new page is a direct child of `_app`, not of the detail route. **Never** add an `<Outlet />` to a detail or list page.

## Navigation

- Parent pages do not use breadcrumbs.
- Child pages use `<Breadcrumbs items={[{ label, to }, { label }]} />` below `<PageHeader>` with `className="mb-0"` on the header.
- Page titles should be clear and specific.
- Sidebar active state is handled automatically via `path.startsWith(item.to)`.

## Forms

Use forms for create, edit, settings, and configuration flows.

Structure: `PageSection → Card → CardHeader → CardContent → CardFooter`

Rules:
- Use `FormItemLayout` for labeled rows (`layout="flex-row-reverse"` for settings-style).
- Wrap controlled inputs in `FormControl` (uses Radix Slot — must receive exactly one child).
- Track dirty state with `form.formState.isDirty`.
- Disable save button when form is unchanged.
- Show Cancel button only when the form is dirty.
- Use `toast.success` / `toast.error` from `sonner` for feedback.
- Use `loading={mutation.isPending}` on the submit button.
- On success: `queryClient.invalidateQueries` then `navigate`.

## Tables

Use tables for structured records.

- **Simple table**: read-only or basic lists — `Card → Table → TableHeader / TableBody`.
- **Data table**: search, filter, sort, pagination, row actions.
- **Data grid**: only for spreadsheet-like editing or very large interactive datasets.

Always include empty states for both "no data" and "no search results."

## Empty States

Use `<EmptyState icon={...} title="..." description="..." action={...} />` when there is nothing to show.

- **Initial empty state**: guide the user toward the first action.
- **Zero results**: explain that search/filter returned nothing.
- **Missing route / not found**: show a clear message and a way back.

Use active language:
- Good: "Create alumni profile"
- Avoid: "No alumni found" unless it's a table/search result

## Modality

Use modals and sheets only when needed.

- **`AlertDialog`**: short confirmation (delete, destructive action). Do not put forms inside.
- **`Dialog`**: focused short action or inline edit. If dirty, confirm before closing.
- **Sheet**: longer forms, edit panels, detailed side views.

For anything more than 3–4 fields, use a secondary page instead of a modal.

## Button `asChild` Rule

When using `<Button asChild>`, the Button renders via Radix `Slot` which requires **exactly one React element child**. Do not add any siblings:

```tsx
// ✅ correct
<Button asChild>
  <Link to="/campaigns/new">Create campaign</Link>
</Button>

// ❌ wrong — two children passed to Slot
<Button asChild>
  <Plus />
  <Link to="/campaigns/new">Create campaign</Link>
</Button>
```

The `loading` prop on `Button` is ignored when `asChild=true` (Slot cannot host a spinner alongside the child).

## Copy Style

- **No em-dashes** in PageHeader descriptions or any UI prose copy. Use a period or comma instead.
- Em-dashes in table cell null-value placeholders (`{value ?? "—"}`) are fine — those are data display conventions, not prose.
- Write descriptions as a product designer would: specific, active, benefit-first.

## User Roles and Permissions

Two roles: `admin` and `user`. Check `src/lib/auth.tsx` for helpers.

| Helper | When true |
|--------|-----------|
| `isActive(user)` | user.status === "active" |
| `canEdit(user)` | isActive AND account_role === "admin" |

**Route guards:**
- Admin-only pages: `if (user && !canEdit(user)) navigate({ to: "/dashboard" })`
- Active-user pages: `if (user && !isActive(user)) navigate({ to: "/dashboard" })`

**Query `enabled` conditions:**
- Admin-only data: `enabled: canEdit(user)`
- All-user data: `enabled: isActive(user)`

**Feature access summary:**
- Alumni, Mentorship, Campaigns list/detail, Surveys list/detail: all active users
- Alumni CRUD, Email campaigns, Surveys CRUD, User management, Audit log: admin only
- Survey campaign creation: all active users
- See `docs/PERMISSIONS.md` for the complete matrix.

## Server Functions (Supabase)

All data mutations go through `createServerFn` in `src/lib/*.functions.ts`.

- Use `requireSupabaseAuth` middleware on every server function.
- Call `assertCallerIsAdmin` for admin-only operations. Some operations (e.g. survey campaign creation, reading alumni) are accessible to all active users — omit the admin check for those.
- After every successful admin mutation, write an audit entry with `writeAudit`.
- Validate inputs with Zod schemas at the top of the file.
- For tables not yet in the generated Supabase types, cast: `(supabaseAdmin as any).from("table_name")`.

## Help Content (HelpBlock)

Feature-level documentation blocks are stored in the `help_content` database table and rendered via `<HelpBlock>`. Do **not** hard-code explanatory text for features — use `HelpBlock` so admins can update it from Settings → Help content without a code change.

### Where help content lives
- **DB table**: `public.help_content` — columns: `key` (PK), `title`, `body`, `updated_at`, `updated_by`
- **Server functions**: `src/lib/help-content.functions.ts` — `getHelpContent`, `listHelpContent`, `upsertHelpContent`, `deleteHelpContent`
- **Component**: `src/components/ui/HelpBlock.tsx`
- **Admin UI**: Settings → Help content (`/settings/help-content`)

### Existing keys
| Key | Used on |
|-----|---------|
| `email_campaign` | Campaigns list, CampaignForm (email type) |
| `survey_campaign` | CampaignForm (survey type) |
| `survey` | Surveys list |
| `mentorship` | Mentorship page |
| `alumni_import` | CSV import dialog |

### Adding a new help key
1. Visit Settings → Help content → Add new (or insert directly into `help_content` table)
2. Set a key using `lowercase_with_underscores`
3. Add `<HelpBlock helpKey="your_key" fallback={{ title: "...", body: "..." }} />` to the page

### Using HelpBlock
```tsx
import { HelpBlock } from "@/components/ui/HelpBlock";

// Below PageHeader, above the table/form:
<HelpBlock
  helpKey="email_campaign"
  fallback={{ title: "Email campaigns", body: "Fallback shown if DB row doesn't exist yet." }}
  className="mb-4"
/>
```
- `helpKey` — matches a row in `help_content`
- `fallback` — shown while loading or if the key has no DB row (prevents blank screens on first deploy)
- Admins see a pencil icon that links directly to the edit dialog for that key
- Content is cached for 5 minutes via React Query

## Agent Instruction

When generating UI, think like a product designer first. Pick the correct pattern, then build with existing components. Do not redesign unrelated areas. Keep every feature consistent with the layout, form, table, empty state, modal, and navigation patterns above.

Use `HelpBlock` for any feature-level explanatory text. Never hard-code help/documentation content.
