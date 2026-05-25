// Static email template definitions for campaign creation.
// Templates pre-fill the campaign form — no DB, no admin UI.
// To add a template: add an object to EMAIL_TEMPLATES and re-deploy.

export type PlaceholderMeta = {
  key: string;
  label: string;
  /** "auto" = replaced at send time from alumni record. "manual" = user must fill before saving. */
  mode: "auto" | "manual";
  example: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  campaignType: "email" | "survey";
  subject: string;
  body: string;
  placeholders: PlaceholderMeta[];
  // future-ready (unused now):
  // category?: "outreach" | "newsletter" | "event" | "survey"
  // thumbnail?: string
};

// ---------------------------------------------------------------------------
// Shared HTML blocks
// ---------------------------------------------------------------------------

const HEADER = `
  <div style="background-color:#4B2E83;padding:28px 40px;">
    <div style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">UW–Whitewater</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.72);margin-top:3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:0.3px;">Computer Science Department</div>
  </div>`.trim();

const FOOTER = `
  <div style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      UW–Whitewater CS Department &nbsp;·&nbsp; 800 W Main St, Whitewater, WI 53190<br>
      You're receiving this as part of the UWW CS alumni network.
    </p>
  </div>`.trim();

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif`;

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    body{margin:0;padding:0;background-color:#f4f4f7;}
    *{box-sizing:border-box;}
    @media(max-width:600px){
      .container{width:100%!important;}
      .body-pad{padding:28px 20px!important;}
      .btn{display:block!important;text-align:center!important;}
    }
  </style>
</head>
<body>
  <div style="background-color:#f4f4f7;padding:32px 16px;">
    <div class="container" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
      ${HEADER}
      <div class="body-pad" style="padding:36px 40px;">
        ${content}
      </div>
      ${FOOTER}
    </div>
  </div>
</body>
</html>`.trim();
}

function btn(text: string, href: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a class="btn" href="${href}" style="display:inline-block;background-color:#4B2E83;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.1px;font-family:${FONT};">${text}</a>
  </div>`;
}

function card(content: string, bg = "#f9fafb"): string {
  return `<div style="background-color:${bg};border-radius:6px;padding:20px 24px;margin:24px 0;">${content}</div>`;
}

function accentCard(content: string): string {
  return `<div style="border-left:4px solid #4B2E83;background-color:#faf5ff;border-radius:0 6px 6px 0;padding:20px 24px;margin:24px 0;">${content}</div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">`;
}

const p = (text: string, style = "") =>
  `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.75;font-family:${FONT};${style}">${text}</p>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111827;line-height:1.3;font-family:${FONT};">${text}</h1>`;

const h2 = (text: string) =>
  `<h2 style="margin:0 0 12px;font-size:17px;font-weight:700;color:#111827;font-family:${FONT};">${text}</h2>`;

const eyebrow = (text: string) =>
  `<p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#4B2E83;text-transform:uppercase;letter-spacing:0.8px;font-family:${FONT};">${text}</p>`;

// ---------------------------------------------------------------------------
// Template 1 — Mentorship Invitation
// ---------------------------------------------------------------------------

const mentorshipBody = wrap(`
  ${eyebrow("Mentorship Program · {{graduation_year}} Alumni")}
  ${h1("Help shape the next generation of CS graduates")}
  ${p("Hi {{first_name}},")}
  ${p("Your career path is exactly what current UWW CS students need to hear about. We're looking for alumni like you to join our mentorship program — as little as one hour a month, on your schedule.")}
  ${p("Whether you want to review resumes, answer career questions, or share what you wish you'd known, students are eager to learn from your experience.")}
  ${btn("Sign Up to Mentor →", "{{rsvp_url}}")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">What mentors typically do</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.9;font-family:${FONT};">
      <li>1–2 virtual or in-person check-ins per semester</li>
      <li>Resume and LinkedIn profile reviews</li>
      <li>Career and interview prep conversations</li>
      <li>Share your industry network and experience</li>
    </ul>
  `)}
  ${p("Questions? Just reply to this email — we'd love to hear from you.", "margin-bottom:0;")}
`);

// ---------------------------------------------------------------------------
// Template 2 — Alumni Newsletter
// ---------------------------------------------------------------------------

const newsletterBody = wrap(`
  ${eyebrow("{{semester}} {{year}}")}
  ${h1("UWW CS Alumni Update")}
  ${p("Hi {{first_name}}, here's what's new in the UWW CS community this semester.")}
  ${divider()}
  ${h2("From the Department")}
  ${p("[[Replace with 2–3 sentences about department news: new courses, faculty updates, lab improvements, or research highlights.]]")}
  ${divider()}
  ${h2("Alumni Spotlight")}
  ${card(`
    <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827;font-family:${FONT};">[[Alumni Name]], Class of [[Year]]</p>
    <p style="margin:0 0 14px;font-size:13px;color:#6b7280;font-family:${FONT};">[[Job Title]] at [[Company]]</p>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.75;font-style:italic;font-family:${FONT};">"[[Replace with a short quote or insight from this alumni — career advice, a UWW memory, or what they're working on.]]"</p>
  `)}
  ${divider()}
  ${h2("Upcoming Events")}
  ${p("• [[Event 1]] — [[Date]]<br>• [[Event 2]] — [[Date]]<br>• [[Event 3]] — [[Date]]")}
  ${divider()}
  ${p("We'd love to feature your story in a future issue. Reply to this email to share an update about your career.")}
  ${btn("Update Your Profile →", "[[profile_url]]")}
`);

// ---------------------------------------------------------------------------
// Template 3 — Event Invitation
// ---------------------------------------------------------------------------

const eventBody = wrap(`
  ${accentCard(`
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;font-family:${FONT};">{{event_name}}</p>
    <p style="margin:0;font-size:14px;color:#6b7280;font-family:${FONT};">{{event_date}} &nbsp;·&nbsp; {{event_location}}</p>
  `)}
  ${p("Hi {{first_name}},")}
  ${p("You're invited to join fellow UWW CS alumni and current students at <strong>{{event_name}}</strong>. [[Replace with 2–3 sentences describing the event, why it matters, and what attendees can expect.]]")}
  ${card(`
    <table style="width:100%;border-collapse:collapse;font-family:${FONT};">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;width:90px;vertical-align:top;">Date</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;">{{event_date}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Location</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">{{event_location}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Format</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">[[In-person / Virtual / Hybrid]]</td>
      </tr>
    </table>
  `, "#ffffff")}
  ${btn("RSVP Now →", "{{rsvp_url}}")}
  ${p("Spots are limited — reserve yours today. Questions? Reply to this email.", "margin-bottom:0;")}
`);

// ---------------------------------------------------------------------------
// Template 4 — Survey / Feedback Request
// ---------------------------------------------------------------------------

const surveyBody = wrap(`
  ${h1("Your feedback helps shape UWW CS")}
  ${p("Hi {{first_name}},")}
  ${p("We're running a short survey for UWW CS alumni. It covers [[replace with: career outcomes / mentorship interest / curriculum feedback / etc.]] and takes about 3 minutes to complete.")}
  ${p("Your responses directly influence how we improve the program for current and future students.")}
  ${btn("Take the Survey →", "{{survey_link}}")}
  ${card(`
    <p style="margin:0;font-size:13px;color:#374151;line-height:1.9;font-family:${FONT};">
      ✓ &nbsp;Takes about 3 minutes &nbsp;&nbsp;·&nbsp;&nbsp;
      ✓ &nbsp;Responses are confidential &nbsp;&nbsp;·&nbsp;&nbsp;
      ✓ &nbsp;Survey closes {{deadline}}
    </p>
  `, "#f0fdf4")}
  ${p("Thank you for staying connected with the UWW CS community.", "color:#6b7280;margin-bottom:0;")}
`);

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "mentorship-invite",
    name: "Mentorship Invitation",
    description: "Recruit alumni to mentor current CS students",
    campaignType: "email",
    subject: "You're invited to mentor UWW CS students this semester",
    body: mentorshipBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "{{graduation_year}}", label: "Graduation year", mode: "auto", example: "2019" },
      { key: "{{rsvp_url}}", label: "Sign-up URL", mode: "manual", example: "https://uww.edu/mentor-signup" },
    ],
  },
  {
    id: "newsletter",
    name: "Alumni Newsletter",
    description: "Quarterly department update with news, spotlight, and events",
    campaignType: "email",
    subject: "UWW CS Alumni Update — {{semester}} {{year}}",
    body: newsletterBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "{{semester}}", label: "Semester", mode: "manual", example: "Fall" },
      { key: "{{year}}", label: "Year", mode: "manual", example: "2025" },
    ],
  },
  {
    id: "event-invite",
    name: "Event Invitation",
    description: "Career fair, networking night, alumni panel, or reunion",
    campaignType: "email",
    subject: "You're invited: {{event_name}} — {{event_date}}",
    body: eventBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "{{event_name}}", label: "Event name", mode: "manual", example: "CS Career Night 2025" },
      { key: "{{event_date}}", label: "Date", mode: "manual", example: "Nov 14, 2025 · 5–7 PM" },
      { key: "{{event_location}}", label: "Location", mode: "manual", example: "Hyland Hall 1101" },
      { key: "{{rsvp_url}}", label: "RSVP link", mode: "manual", example: "https://uww.edu/rsvp" },
    ],
  },
  {
    id: "survey-request",
    name: "Survey / Feedback Request",
    description: "Collect alumni feedback with a Tally form and unique tracked links",
    campaignType: "survey",
    subject: "Quick survey for UWW CS alumni — takes 3 minutes",
    body: surveyBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "{{survey_link}}", label: "Unique survey link", mode: "auto", example: "https://app.com/survey/respond/abc123" },
      { key: "{{deadline}}", label: "Deadline", mode: "manual", example: "December 1, 2025" },
    ],
  },
];

export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export const AUTO_PLACEHOLDERS = ["{{first_name}}", "{{graduation_year}}", "{{survey_link}}"];
