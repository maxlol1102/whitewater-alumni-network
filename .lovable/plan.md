
# Next phase — Alumni on Supabase (B6.2)

Phase B5 (Users) is live on the database. Next vertical from the queue is **Alumni**: list, detail, create, edit, archive/delete, and CSV import. The `alumni` table and RLS already exist (admin full access, all active users can read).

## Scope

1. **Server functions** — new `src/lib/alumni.functions.ts` (thin file, server-fn declarations only) backed by `src/lib/alumni.server.ts` helpers:
   - `listAlumni({ search, gradYear, tags, mentorshipOnly, archived })` — read for any active user
   - `getAlumni(id)` — read
   - `createAlumni(input)` — admin only
   - `updateAlumni(id, input)` — admin only
   - `archiveAlumni(id)` / `unarchiveAlumni(id)` — admin only (sets `archived` flag)
   - `deleteAlumni(id)` — admin only (hard delete)
   - `importAlumniCsv(rows)` — admin only, bulk upsert by email, returns `{ inserted, updated, skipped, errors[] }`
   - All admin mutations call `assertCallerIsAdmin` (reuse from `users.server.ts`) and write an `audit_logs` row (`alumni.created`, `alumni.updated`, `alumni.archived`, `alumni.unarchived`, `alumni.deleted`, `alumni.csv_imported`).
   - Input validation with zod (email format, grad year range, array bounds).

2. **Replace mocks in UI** — swap `MOCK_ALUMNI` usage for TanStack Query hooks in:
   - `src/routes/_app.alumni.index.tsx` (list + filters)
   - `src/routes/_app.alumni.$id.tsx` (detail)
   - `src/routes/_app.alumni.new.tsx` (create)
   - `src/routes/_app.alumni.$id.edit.tsx` (edit)
   - `src/components/alumni/AlumniForm.tsx` (wire submit to mutations)
   - `src/components/alumni/CsvImportDialog.tsx` (wire to `importAlumniCsv`, show per-row result summary)

3. **Audit actions** — add the new alumni actions to the audit_logs writer (no schema change; `action` is free-form text). Audit Log page already renders generically.

## Out of scope (next phases)

- Dashboard analytics (B6.3)
- Campaigns / Surveys / Audit Log viewer rewrites (B6.4–B6.6)
- Realtime subscriptions on alumni list
- Soft-delete column (we use `archived` for hide; `deleteAlumni` is hard delete)

## Technical notes

- New files only: `src/lib/alumni.functions.ts`, `src/lib/alumni.server.ts`. Keep `.functions.ts` thin (server-fn declarations + their imports only) to avoid leaking server-only imports into the client bundle.
- All mutations followed by `queryClient.invalidateQueries({ queryKey: ['alumni'] })`.
- CSV import: parse on the client (existing dialog uses PapaParse-style parsing), POST rows array to server fn in chunks of 500 to stay under request limits.
- Mocks file (`src/mocks/data.ts`) stays intact for now — only the alumni routes stop reading from it.

## Acceptance

- Admin can create, edit, archive, unarchive, delete, and CSV-import alumni against the real DB.
- Non-admin active users can browse the list and detail pages but see no edit affordances (already gated by `canEdit`).
- Every admin mutation produces a matching `audit_logs` row.
- Page loads, filters, and search hit the real DB with TanStack Query.

Reply "go" and I'll execute B6.2 in build mode.
