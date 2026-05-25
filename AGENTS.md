# AGENTS.md — AI Agent Reference

## Project
Alumni relationship CRM for a university CS department. Admins manage alumni records,
email campaigns, surveys, mentorship matching, users, and audit logs.

## Stack
- TanStack Start v1, React 19, TypeScript, Vite 7
- TanStack Router (file-based) + TanStack Query
- Supabase JS v2 (auth + database)
- Tailwind CSS v4, shadcn/ui (New York style), Radix UI
- Zod, react-hook-form, Sonner (toasts)

## Route Naming (flat, no nesting)
| Pattern | File |
|---------|------|
| List | `src/routes/_app.{section}.index.tsx` |
| Create | `src/routes/_app.{section}.new.tsx` |
| Detail | `src/routes/_app.{section}.$id.tsx` |
| Edit | `src/routes/_app.{section}.$id_.edit.tsx` |
| Nested new | `src/routes/_app.{parent}_.{child}.new.tsx` |

The `_` suffix on a segment breaks layout nesting (child renders under `_app`, not under the
detail route). Never add `<Outlet />` to a list or detail page.

## Server Functions — Required Pattern
All database mutations live in `src/lib/*.functions.ts` as `createServerFn`:

```ts
createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ZodSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    // ... mutation using context.supabase or supabaseAdmin
    await writeAudit({ ... });
    return result;
  });
```

- `requireSupabaseAuth` — validates Bearer token, attaches `supabase`, `userId`, `claims` to context
- `assertCallerIsAdmin` — throws if caller is not admin
- `writeAudit` — must be called after every successful admin mutation
- Reads may use either `GET` or `POST`; admin-only reads must still call `assertCallerIsAdmin`

Components call server functions via `useServerFn` + `useQuery`/`useMutation`. Never call
`supabase.from()` directly from a component.

## Role Model
Stored in `profiles` table. Never in localStorage.

| Field | Values |
|-------|--------|
| `account_role` | `admin` \| `user` |
| `status` | `invited` \| `active` \| `disabled` \| `deleted` |

- `canEdit(user)` → true only for active admins
- `canAccess(user, path)` → admins get everything; users get `/dashboard`, `/alumni`, `/mentorship`
- `is_admin(uuid)` is a server-side Postgres function — never call it from browser code

## Design System — Reuse These
Layout: `PageContainer`, `PageHeader`, `PageSection`, `Breadcrumbs` (`src/components/layout/Page.tsx`)
UI: `Button`, `Card`, `Table`, `Dialog`, `AlertDialog`, `Sheet`, `Badge`, `Skeleton`
Forms: `FormItemLayout`, `FormControl` (from shadcn/ui + react-hook-form)
Empty states: `<EmptyState icon={...} title="..." description="..." action={...} />`
Charts: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` (wraps recharts)
Tokens: `src/styles.css` — use `bg-background`, `text-foreground`, `text-muted-foreground`,
`border-border`. Never hard-code colors.

## Audit Log
Call `writeAudit({ actor, action, entity_type, entity_id, entity_label, summary, severity })`
after every admin mutation. Severity: `info` | `warning` | `critical`.
`audit_logs` table is admin-read-only; written via service role only.

## NEVER
- Commit `.env` or paste service role key anywhere other than `.env`
- Import `supabaseAdmin` or `SUPABASE_SERVICE_ROLE_KEY` in any route/component file
- Write `supabase.from(...)` mutations directly in components
- Skip Zod validation in server functions
- Skip `writeAudit` after admin mutations
- Create duplicate layout/UI components without checking existing ones
- Store `account_role` or permissions in localStorage
- Change `profiles.account_role` logic without explicit approval
- Loosen RLS policies casually
- Manually edit `src/integrations/supabase/types.ts` — regenerate it instead:
  ```bash
  npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
    > src/integrations/supabase/types.ts
  ```

## Key Files
| Purpose | Path |
|---------|------|
| Browser Supabase client | `src/integrations/supabase/client.ts` |
| Server Supabase admin client | `src/integrations/supabase/client.server.ts` |
| Auth middleware (server fn) | `src/integrations/supabase/auth-middleware.ts` |
| Auth context + guards | `src/lib/auth.tsx` |
| Audit write helper | `src/lib/audit.functions.ts` |
| User server utils | `src/lib/users.server.ts` |
| Alumni server utils | `src/lib/alumni.server.ts` |
| App shell + route guard | `src/components/layout/AppShell.tsx` |
| Sidebar + ⌘K palette | `src/components/layout/Sidebar.tsx`, `CommandPalette.tsx` |
| DB types | `src/integrations/supabase/types.ts` |
