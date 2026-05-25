# Email Templates

Static pre-fill templates for the campaign form. No DB, no admin UI — add a template by editing `src/lib/email-templates.ts` and redeploying.

## Available Templates

| ID | Name | Type |
|----|------|------|
| `mentorship-invite` | Mentorship Invitation | email |
| `newsletter` | Alumni Newsletter | email |
| `event-invite` | Event Invitation | email |
| `survey-request` | Survey / Feedback Request | survey |

## Placeholder System

Two kinds of placeholders:

**Auto-replaced at send time** (purple in UI) — replaced from each recipient's alumni record:
- `{{first_name}}` — first word of `full_name`
- `{{graduation_year}}` — alumni graduation year (blank if missing)
- `{{survey_link}}` — unique `/survey/respond/:token` URL (survey campaigns only)

**Manual — fill before saving** (amber in UI) — must be edited in the form body before saving the draft:
- `{{rsvp_url}}`, `{{event_name}}`, `{{event_date}}`, `{{event_location}}`, `{{semester}}`, `{{year}}`, `{{deadline}}`, etc.

The `PlaceholderHints` bar in the campaign form shows which placeholders are present and their type.

## Adding a Template

1. Open `src/lib/email-templates.ts`
2. Add an `EmailTemplate` object to `EMAIL_TEMPLATES`
3. Add an icon mapping in `src/components/campaigns/TemplatePicker.tsx` (`ICONS` map)
4. Redeploy

```ts
{
  id: "my-template",
  name: "My Template",
  description: "One-line description shown in the picker",
  campaignType: "email",          // or "survey"
  subject: "Subject line here",
  body: wrap(`...HTML content...`),
  placeholders: [
    { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
    { key: "{{my_var}}", label: "My variable", mode: "manual", example: "example value" },
  ],
}
```

## Email HTML Conventions

All template bodies use the `wrap()` helper which produces a full responsive HTML email:

- UWW purple header (`#4B2E83`)
- Max-width 600px centered container
- Inline styles everywhere (Gmail compatibility)
- `@media (max-width: 600px)` for mobile
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`
- No flexbox/grid in email body (Outlook incompatible)

Helper functions available in the file: `wrap()`, `btn()`, `card()`, `accentCard()`, `divider()`, `p()`, `h1()`, `h2()`, `eyebrow()`.
