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

## Server Functions (Supabase)

All data mutations go through `createServerFn` in `src/lib/*.functions.ts`.

- Always call `assertCallerIsAdmin` for admin-only operations.
- Use `requireSupabaseAuth` middleware on every server function.
- After a successful mutation, write an audit entry with `writeAudit`.
- Validate inputs with Zod schemas at the top of the file.

## Agent Instruction

When generating UI, think like a product designer first. Pick the correct pattern, then build with existing components. Do not redesign unrelated areas. Keep every feature consistent with the layout, form, table, empty state, modal, and navigation patterns above.
