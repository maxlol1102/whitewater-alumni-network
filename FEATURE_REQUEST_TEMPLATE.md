# Feature Request Template

Copy this template and fill it in when asking Claude Code to build a new feature.

---

```md
# Feature Request

## Feature Name
<short, specific — e.g. "Alumni bulk tag editor">

## Goal
<what this feature should accomplish and why>

## User Role
- [ ] Admin
- [ ] Faculty user
- [ ] Student user
- [ ] All authenticated
- [ ] Public

## User Flow
<step-by-step journey — e.g. "1. Admin opens Alumni list. 2. Selects rows. 3. Clicks 'Edit tags'. 4. Modal opens…">

## UI Requirements
- Page type: list / detail / form / settings / modal / sheet
- Where it appears in nav (or linked from which page)
- Breadcrumb path (if child page)
- Existing components to reuse
- Empty / loading / error states needed

## Data Needed
<fields the UI must read or write, with types>

## Supabase Changes Needed
- New tables / columns:
- New RLS policies:
- New DB functions or triggers:
- New indexes:
- If none: "none"

## Existing Files To Check First
- AGENTS.md
- src/lib/auth.tsx
- src/components/layout/AppShell.tsx
- src/components/layout/Page.tsx
- src/lib/<closest-feature>.functions.ts
- src/routes/_app.<closest-feature>.*.tsx
- src/integrations/supabase/types.ts

## Expected Behavior
<what should happen on the happy path>

## Edge Cases
- Empty state (no data yet)
- Permission denied (non-admin tries to access)
- Validation failures
- Network / server errors
- Concurrent edits / stale cache
- Search returns zero results

## Testing Checklist
- [ ] `bun run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Admin happy path works end-to-end
- [ ] Non-admin is blocked (redirected or 403)
- [ ] Audit log entry written after mutation
- [ ] RLS enforced (tested with non-admin token if applicable)
- [ ] Empty / loading / error states render correctly
- [ ] No new browser console errors
- [ ] No direct component-level Supabase writes
```
