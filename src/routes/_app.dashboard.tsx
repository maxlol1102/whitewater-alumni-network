import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Users, Handshake, Mail, ClipboardList } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const INDUSTRY_COLORS = [
  "#582C83",
  "#CFB87C",
  "#7A4FA0",
  "#C39A52",
  "#A78AC9",
  "#8E6BB3",
  "#D4AB6A",
];

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-sm">
      <div className="text-xs text-muted-foreground mb-0.5">Class of {label}</div>
      <div className="font-semibold tabular-nums">
        {payload[0]?.value?.toLocaleString()}
        <span className="font-normal text-muted-foreground ml-1">alumni</span>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

  const mentorPct =
    data && data.totalAlumni > 0 ? Math.round((data.mentorCount / data.totalAlumni) * 100) : 0;

  const stats = [
    {
      label: "Total Alumni",
      value: data?.totalAlumni ?? 0,
      icon: Users,
      to: "/alumni",
      sub: null as string | null,
    },
    {
      label: "Mentors",
      value: data?.mentorCount ?? 0,
      icon: Handshake,
      to: "/mentorship",
      sub: isLoading ? null : `${mentorPct}% of alumni`,
    },
    {
      label: "Campaigns Sent",
      value: data?.campaignsSent ?? 0,
      icon: Mail,
      to: "/campaigns",
      sub: null as string | null,
    },
    {
      label: "Survey Responses",
      value: data?.surveyResponses ?? 0,
      icon: ClipboardList,
      to: "/surveys",
      sub: null as string | null,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Alumni network activity, reach, and program health at a glance."
      />

      {error && (
        <Card className="p-4 mb-4 text-sm text-destructive border-destructive/30">
          Failed to load dashboard: {(error as Error).message}
        </Card>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block group">
            <Card className="p-4 transition-colors group-hover:border-foreground/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                <s.icon className="size-5 text-muted-foreground/40 shrink-0" />
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                {isLoading ? <Skeleton className="h-7 w-12" /> : s.value.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 h-4">{s.sub ?? ""}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Bar chart — alumni by year */}
        <Card className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold mb-0.5">Alumni by graduation year</div>
          <div className="text-xs text-muted-foreground mb-5">Distribution across all cohorts</div>
          <div className="h-60">
            {isLoading ? (
              <SkeletonBars count={10} />
            ) : data && data.byYear.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byYear}
                  barCategoryGap="32%"
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeOpacity={0.7}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{
                      fill: "var(--color-muted)",
                      opacity: 0.5,
                      radius: 4,
                    }}
                  />
                  <Bar dataKey="count" fill="#582C83" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </Card>

        {/* Industry ranked list */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-0.5">Alumni by industry</div>
          <div className="text-xs text-muted-foreground mb-5">Top sectors represented</div>
          <IndustryList items={data?.byIndustry ?? []} loading={isLoading} />
        </Card>
      </div>

      {/* ── Bar lists row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold mb-0.5">Top employers</div>
          <div className="text-xs text-muted-foreground mb-5">Companies with the most alumni</div>
          <EmployerList items={data?.topEmployers ?? []} loading={isLoading} />
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold mb-0.5">Top skills</div>
          <div className="text-xs text-muted-foreground mb-5">Most common technical skills</div>
          <BgBarList
            items={data?.topSkills ?? []}
            loading={isLoading}
            color="#8B6914"
            fillClass="bg-[#CFB87C]/20"
            textClass="text-[#8B6914]"
          />
        </Card>
      </div>
    </PageContainer>
  );
}

// ── Industry list ─────────────────────────────────────────────────────────────

function IndustryList({
  items,
  loading,
}: {
  items: { name: string; value: number }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-3 w-4 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-5" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!items.length) return <EmptyChart />;
  const max = items[0].value;
  return (
    <ul className="space-y-3">
      {items.slice(0, 7).map(({ name, value }, i) => (
        <li key={name} className="flex items-center gap-2.5">
          <span className="w-4 shrink-0 text-center text-[10px] font-bold text-muted-foreground/40 tabular-nums">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-foreground">{name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(value / max) * 100}%`,
                  backgroundColor: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Employer ranked list ──────────────────────────────────────────────────────

function EmployerList({
  items,
  loading,
}: {
  items: { name: string; count: number }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-3 w-4 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-5" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!items.length) return <EmptyChart />;
  const max = items[0].count;
  return (
    <ul className="space-y-3">
      {items.slice(0, 7).map(({ name, count }, i) => (
        <li key={name} className="flex items-center gap-2.5">
          <span className="w-4 shrink-0 text-center text-[10px] font-bold text-muted-foreground/40 tabular-nums">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-foreground">{name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Background-fill bar list ──────────────────────────────────────────────────

function BgBarList({
  items,
  loading,
  fillClass,
  textClass,
}: {
  items: { name: string; count: number }[];
  loading: boolean;
  color: string;
  fillClass: string;
  textClass: string;
}) {
  if (loading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return <EmptyChart />;
  }
  const max = items[0].count;
  return (
    <ul className="space-y-1.5">
      {items.map(({ name, count }) => (
        <li key={name} className="relative h-8 overflow-hidden rounded-md">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-md transition-all duration-500",
              fillClass,
            )}
            style={{ width: `${(count / max) * 100}%` }}
          />
          <div className="relative flex h-full items-center justify-between px-2.5">
            <span className={cn("truncate text-xs font-medium", textClass)}>{name}</span>
            <span className={cn("ml-3 shrink-0 text-xs font-semibold tabular-nums", textClass)}>
              {count}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data yet
    </div>
  );
}

function SkeletonBars({ count }: { count: number }) {
  return (
    <div className="flex h-full items-end gap-1.5 pb-6 px-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ height: `${25 + ((i * 17 + 31) % 55)}%` }}
        />
      ))}
    </div>
  );
}
