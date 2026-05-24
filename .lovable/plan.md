## Plan

Apply both pending changes.

### 1. Tighten Alumni form width + attach action bar
**`src/components/alumni/AlumniForm.tsx`**
- Line 133: change form container `max-w-4xl` → `max-w-2xl` (~25% narrower, centered).
- Lines 249–260: remove the `fixed bottom-0 left-60 right-0 ... border-t` floating action bar. Render an inline right-aligned Cancel / Save row directly below the last section card, inside the same `max-w-2xl` wrapper so the buttons visually attach to the card stack.

### 2. Convert "Create campaign" to a modal
**`src/routes/_app.campaigns.index.tsx`**
- Add `const [createOpen, setCreateOpen] = useState(false)`.
- Replace both `navigate({ to: "/campaigns/new" })` calls (empty-state CTA + header button) with `setCreateOpen(true)`.
- Render `<Dialog open={createOpen} onOpenChange={setCreateOpen}>` with `DialogContent` (`max-w-2xl max-h-[85vh] overflow-y-auto`), `DialogHeader` ("Create campaign"), and `<CampaignForm mode="create" inDialog onClose={() => setCreateOpen(false)} />`.

**`src/components/campaigns/CampaignForm.tsx`**
- Add props `inDialog?: boolean` and `onClose?: () => void`.
- When `inDialog`, drop the fixed bottom footer and render an inline Cancel / Submit row at the end of the form.
- On successful create mutation, if `onClose` is provided, call it (dialog closes) instead of `navigate({ to: "/campaigns" })`. Existing `invalidateQueries(["campaigns"])` refreshes the list.

**`src/routes/_app.campaigns.new.tsx`** — leave as-is so `/campaigns/new` still works as a deep link.

### Out of scope
- Converting Add Alumni or Edit Campaign to modals.
- URL state (`?new=1`) for the campaign modal.
