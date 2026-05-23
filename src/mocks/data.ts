export const MOCK_MODE = true;

export type Role = "super_admin" | "admin" | "faculty";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  disabled_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export type Alumni = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  graduation_year: number;
  degree_program: string;
  company: string;
  job_title: string;
  industry: string;
  location: string;
  technical_skills: string[];
  mentorship_interest: boolean;
  mentorship_categories: string[];
  tags: string[];
  notes?: string;
  archived: boolean;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  filter_mentorship_only: boolean;
  filter_tags: string[];
  filter_grad_years: number[];
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
  created_by: string;
};

export type Survey = {
  id: string;
  title: string;
  description: string;
  form_url: string;
  campaign_id: string | null;
  response_count: number;
  created_at: string;
};

export type SurveyResponse = {
  id: string;
  survey_id: string;
  email: string;
  alumni_id: string | null;
  submitted_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: Role;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

export const MOCK_USERS: Profile[] = [
  { id: "u-super", full_name: "Pat Reynolds", email: "pat.reynolds@uww.edu", role: "super_admin", disabled_at: null, created_at: "2024-01-12T10:00:00Z", last_sign_in_at: "2026-05-22T14:21:00Z" },
  { id: "u-admin", full_name: "Jamie Lee", email: "jamie.lee@uww.edu", role: "admin", disabled_at: null, created_at: "2024-03-22T10:00:00Z", last_sign_in_at: "2026-05-21T08:11:00Z" },
  { id: "u-faculty", full_name: "Dr. Morgan Choi", email: "morgan.choi@uww.edu", role: "faculty", disabled_at: null, created_at: "2024-05-01T10:00:00Z", last_sign_in_at: "2026-05-20T19:02:00Z" },
  { id: "u-admin2", full_name: "Riley Nguyen", email: "riley.nguyen@uww.edu", role: "admin", disabled_at: null, created_at: "2024-08-15T10:00:00Z", last_sign_in_at: "2026-05-19T11:45:00Z" },
  { id: "u-faculty2", full_name: "Dr. Alex Park", email: "alex.park@uww.edu", role: "faculty", disabled_at: "2026-04-10T10:00:00Z", created_at: "2024-09-01T10:00:00Z", last_sign_in_at: "2026-04-09T13:00:00Z" },
];

const COMPANIES = ["Epic Systems", "Microsoft", "Google", "Northwestern Mutual", "GE Healthcare", "Rockwell Automation", "Kohl's", "American Family Insurance", "Generac", "Fiserv", "Direct Supply", "Trek Bicycle"];
const TITLES = ["Software Engineer", "Senior Software Engineer", "Data Scientist", "Security Analyst", "Engineering Manager", "DevOps Engineer", "Product Manager", "ML Engineer", "QA Engineer", "Solutions Architect"];
const INDUSTRIES = ["Software", "Healthcare Tech", "Finance", "Cybersecurity", "Manufacturing", "Retail", "Insurance"];
const LOCATIONS = ["Madison, WI", "Milwaukee, WI", "Chicago, IL", "Minneapolis, MN", "Seattle, WA", "Austin, TX", "Remote"];
const PROGRAMS = ["B.S. Computer Science", "B.S. Computer Science — Cybersecurity", "B.S. Computer Science — Data Science", "M.S. Computer Science"];
const SKILL_POOL = ["TypeScript", "React", "Python", "Java", "Go", "Kubernetes", "AWS", "Azure", "SQL", "PostgreSQL", "Spark", "Kafka", "Terraform", "Docker", "GraphQL", "Node.js", ".NET", "C#", "Swift", "Rust"];
const TAG_POOL = ["donor", "speaker", "mentor-active", "hiring", "newsletter", "advisory-board"];
const MENTOR_CATS = ["software_engineering", "data_science", "cybersecurity", "healthcare_tech", "other"];
const FIRST = ["Avery", "Jordan", "Taylor", "Casey", "Sam", "Quinn", "Riley", "Drew", "Cameron", "Skyler", "Jesse", "Hayden", "Reese", "Rowan", "Emery", "Finley", "Logan", "Parker", "Sage", "Devin"];
const LAST = ["Anderson", "Brown", "Carter", "Davis", "Evans", "Fisher", "Garcia", "Hughes", "Iverson", "Johnson", "Kim", "Lewis", "Martinez", "Nguyen", "Olson", "Patel", "Quinn", "Rivera", "Smith", "Tran", "Walker", "Young"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed * 7 + i * 13) % arr.length]);
  return Array.from(new Set(out));
}

export const MOCK_ALUMNI: Alumni[] = Array.from({ length: 64 }, (_, i) => {
  const first = pick(FIRST, i * 3 + 1);
  const last = pick(LAST, i * 5 + 2);
  const grad = 1998 + (i % 27);
  const mentor = i % 3 === 0;
  return {
    id: `a-${i + 1}`,
    full_name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    phone: i % 4 === 0 ? `+1-608-555-${(1000 + i).toString().padStart(4, "0")}` : undefined,
    linkedin_url: i % 2 === 0 ? `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${i}` : undefined,
    graduation_year: grad,
    degree_program: pick(PROGRAMS, i),
    company: pick(COMPANIES, i),
    job_title: pick(TITLES, i + 1),
    industry: pick(INDUSTRIES, i),
    location: pick(LOCATIONS, i + 2),
    technical_skills: pickN(SKILL_POOL, 4 + (i % 3), i + 1),
    mentorship_interest: mentor,
    mentorship_categories: mentor ? pickN(MENTOR_CATS, 1 + (i % 2), i) : [],
    tags: pickN(TAG_POOL, (i % 3), i + 2),
    notes: i % 5 === 0 ? "Spoke at Spring 2025 alumni panel." : undefined,
    archived: i % 23 === 0,
    created_at: new Date(2024, i % 12, 1 + (i % 27)).toISOString(),
  };
});

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "c-1", name: "Spring Newsletter 2026", subject: "What's new in UWW CS this spring", body: "<p>Hello {{first_name}},</p><p>Here's what's happening...</p>", status: "sent", filter_mentorship_only: false, filter_tags: ["newsletter"], filter_grad_years: [], recipient_count: 542, sent_at: "2026-04-12T15:00:00Z", created_at: "2026-04-01T09:00:00Z", created_by: "u-admin" },
  { id: "c-2", name: "Mentor Recruitment Drive", subject: "Become a CS mentor", body: "<p>We need your help...</p>", status: "sent", filter_mentorship_only: true, filter_tags: [], filter_grad_years: [], recipient_count: 188, sent_at: "2026-03-02T15:00:00Z", created_at: "2026-02-20T09:00:00Z", created_by: "u-super" },
  { id: "c-3", name: "Career Fair Invite", subject: "Join us at the Fall Career Fair", body: "<p>Save the date...</p>", status: "draft", filter_mentorship_only: false, filter_tags: ["hiring"], filter_grad_years: [], recipient_count: 96, sent_at: null, created_at: "2026-05-15T09:00:00Z", created_by: "u-admin" },
  { id: "c-4", name: "Annual Giving Appeal", subject: "Support the next generation", body: "<p>Your gift matters...</p>", status: "scheduled", filter_mentorship_only: false, filter_tags: ["donor"], filter_grad_years: [], recipient_count: 64, sent_at: null, created_at: "2026-05-18T09:00:00Z", created_by: "u-super" },
  { id: "c-5", name: "Cyber Speaker Series", subject: "RSVP: Cybersecurity speaker night", body: "<p>Join us...</p>", status: "failed", filter_mentorship_only: false, filter_tags: ["speaker"], filter_grad_years: [], recipient_count: 32, sent_at: "2026-05-10T15:00:00Z", created_at: "2026-05-05T09:00:00Z", created_by: "u-admin2" },
];

export const MOCK_SURVEYS: Survey[] = [
  { id: "s-1", title: "2026 Alumni Career Outcomes", description: "Annual snapshot of where our alumni are working.", form_url: "https://forms.gle/example-2026-careers", campaign_id: "c-1", response_count: 134, created_at: "2026-04-01T09:00:00Z" },
  { id: "s-2", title: "Mentorship Program Feedback", description: "Help us improve the mentorship program.", form_url: "https://forms.gle/example-mentor-feedback", campaign_id: "c-2", response_count: 41, created_at: "2026-03-05T09:00:00Z" },
  { id: "s-3", title: "Curriculum Relevance 2026", description: "How well did your degree prepare you?", form_url: "https://forms.gle/example-curriculum", campaign_id: null, response_count: 0, created_at: "2026-05-12T09:00:00Z" },
];

export const MOCK_SURVEY_RESPONSES: SurveyResponse[] = Array.from({ length: 40 }, (_, i) => ({
  id: `sr-${i + 1}`,
  survey_id: i < 25 ? "s-1" : "s-2",
  email: i % 3 === 0 ? `unmatched${i}@example.com` : MOCK_ALUMNI[i % MOCK_ALUMNI.length].email,
  alumni_id: i % 3 === 0 ? null : MOCK_ALUMNI[i % MOCK_ALUMNI.length].id,
  submitted_at: new Date(2026, 3 + (i % 2), 1 + (i % 27)).toISOString(),
}));

const AUDIT_ACTIONS: Array<{ action: string; entity_type: string; severity: AuditLog["severity"]; summary: string }> = [
  { action: "user.invited", entity_type: "user", severity: "info", summary: "Invited new user as admin" },
  { action: "user.role_changed", entity_type: "user", severity: "warning", summary: "Changed role from faculty to admin" },
  { action: "user.disabled", entity_type: "user", severity: "warning", summary: "Disabled user account" },
  { action: "user.reactivated", entity_type: "user", severity: "info", summary: "Reactivated user account" },
  { action: "alumni.created", entity_type: "alumni", severity: "info", summary: "Created new alumni record" },
  { action: "alumni.updated", entity_type: "alumni", severity: "info", summary: "Updated alumni profile" },
  { action: "alumni.archived", entity_type: "alumni", severity: "warning", summary: "Archived alumni record" },
  { action: "alumni.imported", entity_type: "alumni", severity: "info", summary: "Imported 48 alumni from CSV" },
  { action: "alumni.exported", entity_type: "alumni", severity: "info", summary: "Exported alumni list to CSV" },
  { action: "campaign.created", entity_type: "campaign", severity: "info", summary: "Created draft campaign" },
  { action: "campaign.sent", entity_type: "campaign", severity: "warning", summary: "Sent campaign to 542 recipients" },
  { action: "campaign.deleted", entity_type: "campaign", severity: "warning", summary: "Deleted draft campaign" },
  { action: "survey.created", entity_type: "survey", severity: "info", summary: "Created new survey" },
  { action: "survey.responses_imported", entity_type: "survey", severity: "info", summary: "Imported 41 survey responses" },
  { action: "permission.denied", entity_type: "route", severity: "critical", summary: "Faculty attempted access to /settings/users" },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = Array.from({ length: 38 }, (_, i) => {
  const a = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const actor = MOCK_USERS[i % MOCK_USERS.length];
  return {
    id: `al-${i + 1}`,
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action: a.action,
    entity_type: a.entity_type,
    entity_id: `e-${i + 1}`,
    entity_label: a.entity_type === "alumni" ? MOCK_ALUMNI[i % MOCK_ALUMNI.length].full_name : a.entity_type === "campaign" ? MOCK_CAMPAIGNS[i % MOCK_CAMPAIGNS.length].name : a.entity_type === "survey" ? MOCK_SURVEYS[i % MOCK_SURVEYS.length].title : MOCK_USERS[(i + 1) % MOCK_USERS.length].email,
    summary: a.summary,
    severity: a.severity,
    ip_address: `10.0.${i % 255}.${(i * 7) % 255}`,
    user_agent: "Mozilla/5.0",
    created_at: new Date(2026, 4, 22 - (i % 22), 9 + (i % 10), (i * 3) % 60).toISOString(),
  };
});

export const TAG_OPTIONS = TAG_POOL;
export const INDUSTRY_OPTIONS = INDUSTRIES;
export const MENTOR_CATEGORIES = MENTOR_CATS;
export const MENTOR_CATEGORY_LABELS: Record<string, string> = {
  software_engineering: "Software Engineering",
  data_science: "Data Science",
  cybersecurity: "Cybersecurity",
  healthcare_tech: "Healthcare Tech",
  other: "Other",
};
