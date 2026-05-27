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
  /** "bundle" = full campaign blueprint (name, filters, survey suggestion). "layout" = email body format only. */
  category: "bundle" | "layout";
  /** Pre-fills the campaign name field. */
  campaignName?: string;
  /** If set, CampaignForm will try to auto-select a survey whose title contains this string. */
  suggestedSurveyTitle?: string;
  /** Pre-fills audience filter toggles. */
  defaultFilters?: { mentorshipOnly?: boolean };
  /** For survey bundles: the data fields the linked Tally form should collect. Shown in picker and form sidebar. */
  surveyFields?: string[];
};

// ---------------------------------------------------------------------------
// Shared HTML blocks
// ---------------------------------------------------------------------------

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_PUBLIC_HOST?: string } }).env?.VITE_PUBLIC_HOST) ||
  (typeof process !== "undefined" && process.env?.PUBLIC_HOST) ||
  "";

const LOGO_SRC = `${BASE_URL}/uw-whitewater-logo.png`;

const HEADER = `
  <div style="background-color:#4B2E83;padding:24px 40px;">
    <img src="${LOGO_SRC}" alt="University of Wisconsin-Whitewater" width="200" height="auto" style="display:block;height:auto;filter:brightness(0)invert(1);max-width:200px;" />
    <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;letter-spacing:0.4px;text-transform:uppercase;">Computer Science Department</div>
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
// Survey bundle bodies
// ---------------------------------------------------------------------------

const alumniProfileBody = wrap(`
  ${eyebrow("UWW CS Alumni Directory")}
  ${h1("Keep your profile current, {{first_name}}")}
  ${p("Hi {{first_name}},")}
  ${p("We're building a richer alumni directory — one that helps current CS students find mentors by industry, see where graduates land, and understand what the careers available to them actually look like.")}
  ${p("Your profile is the foundation. A complete entry makes you discoverable to students exploring your field and to faculty looking for the right person to connect them with.")}
  ${btn("Update My Profile →", "{{survey_link}}")}
  ${card(
    `
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">The survey covers four areas</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;font-family:${FONT};">
      <li><strong>Professional</strong> &mdash; company, job title, department, industry, location</li>
      <li><strong>Career</strong> &mdash; years of experience, skills, certifications</li>
      <li><strong>Education</strong> &mdash; degree, graduation year</li>
      <li><strong>Contact</strong> &mdash; email, phone, LinkedIn, portfolio</li>
    </ul>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;font-family:${FONT};">About 4 minutes to complete.</p>
  `,
    "#f0fdf4",
  )}
  ${p("Your information stays within the UWW CS alumni network and is never shared externally.", "color:#6b7280;margin-bottom:0;")}
`);

const mentorshipInterestBody = wrap(`
  ${eyebrow("Mentorship Program")}
  ${h1("Would you mentor a UWW CS student, {{first_name}}?")}
  ${p("Hi {{first_name}},")}
  ${p("UWW CS students are navigating job searches, early career decisions, and technical growth — and the most valuable resource many of them say they want is time with someone who has done it before.")}
  ${p("We're expanding our mentorship directory so faculty can match the right students with the right alumni based on topics, availability, and format. A short survey lets you set your own preferences — no fixed schedule required.")}
  ${btn("Share My Interest →", "{{survey_link}}")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">We'll ask about</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;font-family:${FONT};">
      <li>Whether you're open to mentoring</li>
      <li>Topics you can speak to (career paths, interviews, specific tech, etc.)</li>
      <li>Your preferred format &mdash; email, video call, or in-person</li>
      <li>Your general availability (a few hours a semester is enough)</li>
      <li>Which student level you'd prefer to work with</li>
      <li>Whether you're open to casual one-off coffee chats</li>
    </ul>
  `)}
  ${p("Not interested right now? No problem &mdash; just ignore this email.", "color:#6b7280;margin-bottom:0;")}
`);

const hiringInterestBody = wrap(`
  ${eyebrow("UWW CS Career Network")}
  ${h1("Is your company hiring, {{first_name}}?")}
  ${p("Hi {{first_name}},")}
  ${p("UWW CS graduates this semester include strong candidates across software development, data engineering, cybersecurity, and systems design. Several employers have told us they'd rather hear directly from us than sort through applications &mdash; and our students feel the same way.")}
  ${p("If your company has open roles, or if you'd be willing to put in a word for a strong candidate, a short survey is the fastest way to make that connection happen.")}
  ${btn("Share Hiring Info →", "{{survey_link}}")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">The survey asks about</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;font-family:${FONT};">
      <li>Whether your company is currently hiring</li>
      <li>Open internship and full-time positions</li>
      <li>Your willingness to refer candidates</li>
      <li>The best recruiting contact at your company</li>
      <li>Your timeline for filling roles</li>
    </ul>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;font-family:${FONT};">We'll follow up with a curated shortlist of students who match your needs.</p>
  `)}
  ${p("Not hiring right now? You can still indicate you're open to referrals for strong candidates.", "color:#6b7280;margin-bottom:0;")}
`);

const studentSupportBody = wrap(`
  ${eyebrow("Student Support Initiative")}
  ${h1("Can UWW CS students count on you, {{first_name}}?")}
  ${p("Hi {{first_name}},")}
  ${p("Finding a job after graduation is one challenge. Being ready for the work itself is another. CS students benefit enormously from alumni who can give them an honest look at what interviews actually test, what resumes need, and what the day-to-day job really involves.")}
  ${p("We're building a roster of alumni volunteers so faculty can quickly match students with the right person for what they need. You can say yes to as many or as few categories as you'd like.")}
  ${btn("Tell Us How You Can Help →", "{{survey_link}}")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">Six types of support</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;font-family:${FONT};">
      <li><strong>Resume reviews</strong> &mdash; one-time feedback on a student's resume</li>
      <li><strong>Mock interviews</strong> &mdash; practice technical or behavioral interviews</li>
      <li><strong>Guest speaking</strong> &mdash; share your career experience with a class</li>
      <li><strong>Workshops</strong> &mdash; lead a short session on a skill or topic you know well</li>
      <li><strong>Project mentorship</strong> &mdash; advise a student on a capstone or portfolio project</li>
      <li><strong>Networking introductions</strong> &mdash; make warm introductions within your industry</li>
    </ul>
  `)}
  ${p("No fixed commitment. Faculty will reach out directly for the specific support you've indicated.", "color:#6b7280;margin-bottom:0;")}
`);

const alumniEngagementBody = wrap(`
  ${eyebrow("UWW CS Alumni Community")}
  ${h1("How would you like to stay connected, {{first_name}}?")}
  ${p("Hi {{first_name}},")}
  ${p("We'd rather offer you ways to participate that match your interests than fill your inbox with invitations that don't apply.")}
  ${p("A short survey will help us understand what kinds of involvement make sense for you &mdash; so we can tailor what we send and make sure the alumni network delivers real value.")}
  ${btn("Share My Preferences →", "{{survey_link}}")}
  ${card(
    `
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">We'll ask about</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;font-family:${FONT};">
      <li>Types of events you'd attend &mdash; networking, career-focused, social, or virtual</li>
      <li>Interest in speaking at a department event or student session</li>
      <li>Staying connected with other alumni in your field</li>
      <li>Getting more involved with the department (advisory roles, curriculum input)</li>
      <li>Donations or sponsorship interest</li>
    </ul>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;font-family:${FONT};">About 2 minutes. No commitment required.</p>
  `,
    "#f0fdf4",
  )}
  ${p("Your feedback shapes how we run the alumni network.", "color:#6b7280;margin-bottom:0;")}
`);

// ---------------------------------------------------------------------------
// Email layout bodies
// ---------------------------------------------------------------------------

const mentorshipInviteBody = wrap(`
  ${eyebrow("Mentorship Program · {{graduation_year}} Alumni")}
  ${h1("Help shape the next generation of CS graduates")}
  ${p("Hi {{first_name}},")}
  ${p("Your career path is exactly what current UWW CS students need to hear about. We're expanding our mentorship program and looking for alumni who'd like to be matched with students based on industry, career stage, and areas of expertise.")}
  ${p("Whether you want to review a resume, share what interviews really look like, or answer a few questions over coffee &mdash; students are eager to learn from what you've built.")}
  ${btn("Sign Up to Mentor →", "[[signup_url]]")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">What mentors typically do</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.9;font-family:${FONT};">
      <li>1&ndash;2 virtual or in-person sessions per semester (flexible)</li>
      <li>Resume and LinkedIn profile reviews</li>
      <li>Career and interview prep conversations</li>
      <li>Share industry experience and network connections</li>
    </ul>
  `)}
  ${p("Questions? Just reply to this email &mdash; we'd love to hear from you.", "margin-bottom:0;")}
`);

const hiringOutreachBody = wrap(`
  ${eyebrow("UWW CS Career Network · Class of {{graduation_year}}")}
  ${h1("UWW CS graduates are ready")}
  ${p("Hi {{first_name}},")}
  ${p("This semester's graduates include strong candidates in software engineering, data science, cybersecurity, and systems design &mdash; many with project portfolios, internship experience, and references from faculty who know their work.")}
  ${p("If your company has openings, or if you'd be willing to make a referral, we'd like to connect the right students with the right opportunities.")}
  ${btn("Share a Job Opening →", "[[job_url]]")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">How it works</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.9;font-family:${FONT};">
      <li>Share an opening or indicate you can refer a candidate</li>
      <li>We match you with 1&ndash;3 students who fit your requirements</li>
      <li>You connect directly &mdash; no recruiter in the middle</li>
    </ul>
  `)}
  ${p("Reply to this email to share a posting directly or ask any questions.", "color:#6b7280;margin-bottom:0;")}
`);

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
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.75;font-style:italic;font-family:${FONT};">"[[Replace with a short quote or insight from this alumni &mdash; career advice, a UWW memory, or what they're working on.]]"</p>
  `)}
  ${divider()}
  ${h2("Upcoming Events")}
  ${p("• [[Event 1]] &mdash; [[Date]]<br>• [[Event 2]] &mdash; [[Date]]<br>• [[Event 3]] &mdash; [[Date]]")}
  ${divider()}
  ${p("We'd love to feature your story in a future issue. Reply to share an update about your career.")}
  ${btn("Update Your Profile →", "[[profile_url]]")}
`);

const networkingEventBody = wrap(`
  ${accentCard(`
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;font-family:${FONT};">[[Event Name]]</p>
    <p style="margin:0;font-size:14px;color:#6b7280;font-family:${FONT};">[[Date & Time]] &nbsp;&middot;&nbsp; [[Location]]</p>
  `)}
  ${p("Hi {{first_name}},")}
  ${p("You're invited to join UWW CS alumni and current students at <strong>[[Event Name]]</strong>. [[Replace with 2–3 sentences describing the event, what attendees can expect, and why it's worth the time.]]")}
  ${card(
    `
    <table style="width:100%;border-collapse:collapse;font-family:${FONT};">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;width:90px;vertical-align:top;">Date</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;">[[Date & Time]]</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Location</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">[[Location]]</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Format</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">[[In-person / Virtual / Hybrid]]</td>
      </tr>
    </table>
  `,
    "#ffffff",
  )}
  ${btn("RSVP Now →", "[[rsvp_url]]")}
  ${p("Spots are limited &mdash; reserve yours today. Questions? Reply to this email.", "margin-bottom:0;")}
`);

const careerPanelBody = wrap(`
  ${eyebrow("Career Panel · [[Date]]")}
  ${h1("Would you speak on our career panel, {{first_name}}?")}
  ${p("Hi {{first_name}},")}
  ${p("We're hosting a career panel for UWW CS students on <strong>[[Date]]</strong> and would love to have you share your perspective. Panels give students a direct line to alumni in their fields &mdash; honest conversations about career paths, day-to-day work, and what they should be doing right now to prepare.")}
  ${p("Panelists typically join for 45&ndash;60 minutes and take questions from students. [[Replace with any specific topic focus for this panel: e.g., industry trends, job search strategies, technical career paths.]]")}
  ${btn("I’m Interested →", "[[reply_url]]")}
  ${card(
    `
    <table style="width:100%;border-collapse:collapse;font-family:${FONT};">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;width:90px;vertical-align:top;">Date</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;">[[Date & Time]]</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Format</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">[[In-person / Virtual]]</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;vertical-align:top;">Audience</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">[[e.g., Junior and senior CS students]]</td>
      </tr>
    </table>
  `,
    "#ffffff",
  )}
  ${p("Just reply to this email to confirm or ask any questions. We'll handle the logistics.", "color:#6b7280;margin-bottom:0;")}
`);

const studentSupportEmailBody = wrap(`
  ${eyebrow("Student Support Request")}
  ${h1("UWW CS students could use your expertise, {{first_name}}")}
  ${p("Hi {{first_name}},")}
  ${p("CS students are preparing for a job market that rewards not just technical skills but the ability to present themselves, perform in interviews, and navigate professional relationships. Alumni who've been through this process are the most valuable resource we can offer them.")}
  ${p("We're looking for alumni willing to help in one or more of the following areas. No fixed schedule &mdash; faculty will coordinate with you based on your availability.")}
  ${btn("I Can Help →", "[[signup_url]]")}
  ${card(`
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT};">Ways to support students</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;font-family:${FONT};">
      <li><strong>Resume reviews</strong> &mdash; 30&ndash;45 minutes, one student at a time</li>
      <li><strong>Mock interviews</strong> &mdash; technical or behavioral, your choice</li>
      <li><strong>Guest speaking</strong> &mdash; share your career story with a class</li>
      <li><strong>Workshops</strong> &mdash; lead a focused session on a skill you use at work</li>
      <li><strong>Project mentorship</strong> &mdash; advise a student on a capstone or portfolio project</li>
      <li><strong>Networking introductions</strong> &mdash; open doors within your professional network</li>
    </ul>
  `)}
  ${p("Questions? Just reply to this email.", "color:#6b7280;margin-bottom:0;")}
`);

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "alumni-profile",
    category: "bundle",
    name: "Profile & Career Update",
    description: "Refresh core directory data and learn how alumni want to stay involved.",
    campaignType: "survey",
    campaignName: "Alumni Profile & Engagement Survey",
    subject: "Update your UWW CS alumni profile, {{first_name}}",
    body: alumniProfileBody,
    suggestedSurveyTitle: "Alumni Profile",
    surveyFields: [
      "Full name",
      "Preferred email",
      "Current company",
      "Job title",
      "Location",
      "Skills & expertise",
      "Graduation year",
      "LinkedIn / portfolio",
      "Ways to stay involved",
    ],
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      {
        key: "{{survey_link}}",
        label: "Unique survey link",
        mode: "auto",
        example: "https://app.com/survey/respond/abc123",
      },
    ],
  },
  {
    id: "mentorship-interest",
    category: "bundle",
    name: "Mentorship Interest",
    description: "Identify which alumni want to mentor students and understand their preferences.",
    campaignType: "survey",
    campaignName: "Mentorship Interest Survey",
    subject: "Would you mentor a UWW CS student, {{first_name}}?",
    body: mentorshipInterestBody,
    suggestedSurveyTitle: "Mentorship",
    defaultFilters: { mentorshipOnly: false },
    surveyFields: [
      "Willing to mentor",
      "Mentorship topics",
      "Preferred format",
      "Availability",
      "Student level preference",
      "Open to coffee chats",
    ],
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      {
        key: "{{survey_link}}",
        label: "Unique survey link",
        mode: "auto",
        example: "https://app.com/survey/respond/abc123",
      },
    ],
  },
  {
    id: "hiring-interest",
    category: "bundle",
    name: "Hiring & Referrals",
    description: "Ask alumni for openings, referrals, internships, and recruiting contacts.",
    campaignType: "survey",
    campaignName: "Hiring & Referral Survey",
    subject: "Is your company hiring, {{first_name}}?",
    body: hiringInterestBody,
    suggestedSurveyTitle: "Hiring",
    surveyFields: [
      "Company currently hiring?",
      "Internship openings?",
      "Full-time openings?",
      "Willing to refer candidates?",
      "Recruiting contact",
      "Hiring timeline",
    ],
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      {
        key: "{{survey_link}}",
        label: "Unique survey link",
        mode: "auto",
        example: "https://app.com/survey/respond/abc123",
      },
    ],
  },
  {
    id: "student-support",
    category: "bundle",
    name: "Student Support",
    description:
      "Find alumni who can review resumes, run mock interviews, speak in class, or lead workshops.",
    campaignType: "survey",
    campaignName: "Student Support Survey",
    subject: "Can UWW CS students count on you, {{first_name}}?",
    body: studentSupportBody,
    suggestedSurveyTitle: "Student Support",
    surveyFields: [
      "Resume reviews",
      "Mock interviews",
      "Guest speaking",
      "Workshops",
      "Project mentorship",
      "Networking introductions",
    ],
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      {
        key: "{{survey_link}}",
        label: "Unique survey link",
        mode: "auto",
        example: "https://app.com/survey/respond/abc123",
      },
    ],
  },
  {
    id: "alumni-engagement",
    category: "bundle",
    name: "Alumni Engagement",
    description:
      "Learn how alumni want to stay connected — events, speaking, networking, and more.",
    campaignType: "survey",
    campaignName: "Alumni Engagement Survey",
    subject: "How would you like to stay connected, {{first_name}}?",
    body: alumniEngagementBody,
    suggestedSurveyTitle: "Engagement",
    surveyFields: [
      "Event interest",
      "Speaking interest",
      "Networking",
      "Department involvement",
      "Donations / sponsorship",
    ],
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      {
        key: "{{survey_link}}",
        label: "Unique survey link",
        mode: "auto",
        example: "https://app.com/survey/respond/abc123",
      },
    ],
  },
  {
    id: "mentorship-invite",
    category: "layout",
    name: "Mentorship Invitation",
    campaignName: "Mentorship Invitation",
    description: "Invite alumni to sign up as mentors — no survey needed, just a direct ask.",
    campaignType: "email",
    subject: "Help shape the next generation of CS graduates, {{first_name}}",
    body: mentorshipInviteBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "{{graduation_year}}", label: "Graduation year", mode: "auto", example: "2020" },
      {
        key: "[[signup_url]]",
        label: "Sign-up URL",
        mode: "manual",
        example: "https://uww.edu/mentor-signup",
      },
    ],
  },
  {
    id: "hiring-outreach",
    category: "layout",
    name: "Hiring Outreach",
    campaignName: "Hiring Outreach",
    description:
      "Ask alumni whether their company is hiring and if they can refer graduating students.",
    campaignType: "email",
    subject: "UWW CS graduates are ready — is your company hiring?",
    body: hiringOutreachBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "{{graduation_year}}", label: "Graduation year", mode: "auto", example: "2020" },
      {
        key: "[[job_url]]",
        label: "Job listing URL",
        mode: "manual",
        example: "https://company.com/careers",
      },
    ],
  },
  {
    id: "newsletter",
    category: "layout",
    name: "Newsletter / Department Update",
    campaignName: "Alumni Newsletter",
    description: "A simple update format for department news, spotlights, and upcoming events.",
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
    id: "networking-event",
    category: "layout",
    name: "Event / Panel Invite",
    campaignName: "Alumni Event Invitation",
    description:
      "One flexible layout for networking nights, panels, guest talks, and RSVP-based events.",
    campaignType: "email",
    subject: "You're invited: [[Event Name]] — [[Date & Time]]",
    body: networkingEventBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "[[Event Name]]", label: "Event name", mode: "manual", example: "CS Alumni Night" },
      {
        key: "[[Date & Time]]",
        label: "Date and time",
        mode: "manual",
        example: "Nov 14, 2025 · 5-7 PM",
      },
      { key: "[[Location]]", label: "Location", mode: "manual", example: "Hyland Hall 1101" },
      { key: "[[rsvp_url]]", label: "RSVP link", mode: "manual", example: "https://uww.edu/rsvp" },
    ],
  },
  {
    id: "career-panel",
    category: "layout",
    name: "Career Panel Invite",
    campaignName: "Career Panel Invitation",
    description:
      "Invite alumni to speak on a student career panel — includes date and format fields.",
    campaignType: "email",
    subject: "Would you speak on our CS career panel, {{first_name}}?",
    body: careerPanelBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      { key: "[[Date]]", label: "Panel date", mode: "manual", example: "March 12, 2026" },
      {
        key: "[[Date & Time]]",
        label: "Date and time",
        mode: "manual",
        example: "March 12 · 4–5 PM",
      },
      {
        key: "[[In-person / Virtual]]",
        label: "Format",
        mode: "manual",
        example: "Virtual (Zoom)",
      },
      {
        key: "[[e.g., Junior and senior CS students]]",
        label: "Audience",
        mode: "manual",
        example: "Junior and senior CS students",
      },
      {
        key: "[[reply_url]]",
        label: "Reply / sign-up link",
        mode: "manual",
        example: "https://uww.edu/panel-signup",
      },
    ],
  },
  {
    id: "student-support-email",
    category: "layout",
    name: "Student Support Request",
    campaignName: "Student Support Request",
    description:
      "Ask alumni to volunteer for resume reviews, mock interviews, guest talks, or workshops.",
    campaignType: "email",
    subject: "UWW CS students could use your expertise, {{first_name}}",
    body: studentSupportEmailBody,
    placeholders: [
      { key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" },
      {
        key: "[[signup_url]]",
        label: "Sign-up URL",
        mode: "manual",
        example: "https://uww.edu/support-signup",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Blank skeleton — used when admin picks "Start blank"
// ---------------------------------------------------------------------------

const blankBody = wrap(`
  ${h1("[[Email headline]]")}
  ${p("Hi {{first_name}},")}
  ${p("[[Opening paragraph — introduce the purpose of this email in 2–3 sentences.]]")}
  ${p("[[Second paragraph — add more detail, context, or a supporting point.]]")}
  ${btn("[[Button label]]", "[[https://]]")}
  ${p("Thank you for staying connected with the UWW CS community.", "color:#6b7280;margin-bottom:0;")}
`);

export const BLANK_TEMPLATE: EmailTemplate = {
  id: "blank",
  category: "layout",
  name: "Blank",
  description: "Standard UWW structure — replace the bracketed content with your own.",
  campaignType: "email",
  subject: "",
  body: blankBody,
  placeholders: [{ key: "{{first_name}}", label: "First name", mode: "auto", example: "Jordan" }],
};

export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export const AUTO_PLACEHOLDERS = ["{{first_name}}", "{{graduation_year}}", "{{survey_link}}"];
