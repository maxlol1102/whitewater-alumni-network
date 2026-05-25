import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, Handshake, Mail, ClipboardList, ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { getDashboardStats } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const PIE_COLORS = ["#582C83", "#CFB87C", "#7A4FA0", "#A78AC9", "#3F2058", "#C39A52", "#8E6BB3"];

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

  const stats = [
    { label: "Total Alumni", value: data?.totalAlumni ?? 0, icon: Users, to: "/alumni" },
    {
      label: "Mentorship Interested",
      value: data?.mentorCount ?? 0,
      icon: Handshake,
      to: "/mentorship",
    },
    { label: "Campaigns Sent", value: data?.campaignsSent ?? 0, icon: Mail, to: "/campaigns" },
    {
      label: "Survey Responses",
      value: data?.surveyResponses ?? 0,
      icon: ClipboardList,
      to: "/surveys",
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Your alumni network at a glance — activity, reach, and program health." />

      {error && (
        <Card className="p-4 mb-4 text-sm text-destructive">
          Failed to load dashboard: {(error as Error).message}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block">
            <Card className="p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-semibold mt-1">
                    {isLoading ? "—" : s.value.toLocaleString()}
                  </div>
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
            {data && data.byYear.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byYear}>
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "var(--color-accent)" }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart loading={isLoading} />
            )}
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-medium mb-4">Alumni by industry</div>
          <div className="h-72">
            {data && data.byIndustry.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byIndustry}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={48}
                  >
                    {data.byIndustry.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart loading={isLoading} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="font-medium mb-4">Top 5 employers</div>
          <BarList
            items={data?.topEmployers ?? []}
            loading={isLoading}
            color="var(--color-primary)"
          />
        </Card>
        <Card className="p-5">
          <div className="font-medium mb-4">Top 8 skills</div>
          <BarList items={data?.topSkills ?? []} loading={isLoading} color="var(--color-gold)" />
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
            <Link
              key={l.to}
              to={l.to}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {l.label} <ArrowRight className="size-3.5" />
            </Link>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="h-full grid place-items-center text-sm text-muted-foreground">
      {loading ? "Loading…" : "No data yet"}
    </div>
  );
}

function BarList({
  items,
  loading,
  color,
}: {
  items: { name: string; count: number }[];
  loading: boolean;
  color: string;
}) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (items.length === 0) return <div className="text-sm text-muted-foreground">No data yet</div>;
  const max = items[0].count;
  return (
    <ul className="space-y-2">
      {items.map(({ name, count }) => (
        <li key={name} className="flex items-center gap-3">
          <div className="w-40 text-sm truncate">{name}</div>
          <div className="flex-1 h-2 bg-surface-200 rounded">
            <div
              className="h-2 rounded"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <div className="text-sm tabular-nums w-8 text-right">{count}</div>
        </li>
      ))}
    </ul>
  );
}
