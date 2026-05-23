import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Handshake, Mail, ClipboardList, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { MOCK_ALUMNI, MOCK_CAMPAIGNS, MOCK_SURVEY_RESPONSES } from "@/mocks";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const PIE_COLORS = ["#582C83", "#CFB87C", "#7A4FA0", "#A78AC9", "#3F2058", "#C39A52", "#8E6BB3"];

function Dashboard() {
  const active = MOCK_ALUMNI.filter((a) => !a.archived);
  const totalAlumni = active.length;
  const mentor = active.filter((a) => a.mentorship_interest).length;
  const sent = MOCK_CAMPAIGNS.filter((c) => c.status === "sent").length;
  const responses = MOCK_SURVEY_RESPONSES.length;

  const byYearMap = new Map<number, number>();
  active.forEach((a) => byYearMap.set(a.graduation_year, (byYearMap.get(a.graduation_year) ?? 0) + 1));
  const byYear = Array.from(byYearMap.entries()).sort(([a], [b]) => a - b).map(([year, count]) => ({ year: String(year), count }));

  const byIndustryMap = new Map<string, number>();
  active.forEach((a) => byIndustryMap.set(a.industry, (byIndustryMap.get(a.industry) ?? 0) + 1));
  const byIndustry = Array.from(byIndustryMap.entries()).map(([name, value]) => ({ name, value }));

  const employerMap = new Map<string, number>();
  active.forEach((a) => employerMap.set(a.company, (employerMap.get(a.company) ?? 0) + 1));
  const topEmployers = Array.from(employerMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const skillMap = new Map<string, number>();
  active.forEach((a) => a.technical_skills.forEach((s) => skillMap.set(s, (skillMap.get(s) ?? 0) + 1)));
  const topSkills = Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const stats = [
    { label: "Total Alumni", value: totalAlumni, icon: Users, to: "/alumni" },
    { label: "Mentorship Interested", value: mentor, icon: Handshake, to: "/mentorship" },
    { label: "Campaigns Sent", value: sent, icon: Mail, to: "/campaigns" },
    { label: "Survey Responses", value: responses, icon: ClipboardList, to: "/surveys" },
  ];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <PageHeader title="Dashboard" description="An overview of alumni engagement." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block">
            <Card className="p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-semibold mt-1">{s.value.toLocaleString()}</div>
                </div>
                <div className="size-10 rounded-md bg-accent text-accent-foreground grid place-items-center">
                  <s.icon className="size-5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <div className="font-medium mb-4">Alumni by graduation year</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear}>
                <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "var(--color-accent)" }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-medium mb-4">Alumni by industry</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byIndustry} dataKey="value" nameKey="name" outerRadius={90} innerRadius={48}>
                  {byIndustry.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="font-medium mb-4">Top 5 employers</div>
          <ul className="space-y-2">
            {topEmployers.map(([name, count]) => {
              const max = topEmployers[0][1];
              return (
                <li key={name} className="flex items-center gap-3">
                  <div className="w-40 text-sm truncate">{name}</div>
                  <div className="flex-1 h-2 bg-surface-200 rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <div className="text-sm tabular-nums w-8 text-right">{count}</div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="font-medium mb-4">Top 8 skills</div>
          <ul className="space-y-2">
            {topSkills.map(([name, count]) => {
              const max = topSkills[0][1];
              return (
                <li key={name} className="flex items-center gap-3">
                  <div className="w-40 text-sm truncate">{name}</div>
                  <div className="flex-1 h-2 bg-surface-200 rounded">
                    <div className="h-2 rounded" style={{ width: `${(count / max) * 100}%`, backgroundColor: "var(--color-gold)" }} />
                  </div>
                  <div className="text-sm tabular-nums w-8 text-right">{count}</div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-medium mb-3">Quick links</div>
        <div className="flex flex-wrap gap-2">
          {[
            { to: "/alumni", label: "Browse alumni" },
            { to: "/mentorship", label: "View mentors" },
            { to: "/campaigns", label: "Manage campaigns" },
            { to: "/surveys", label: "Manage surveys" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              {l.label} <ArrowRight className="size-3.5" />
            </Link>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
