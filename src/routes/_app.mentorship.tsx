import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Mail, Linkedin } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { MOCK_ALUMNI, MENTOR_CATEGORIES, MENTOR_CATEGORY_LABELS } from "@/mocks";

export const Route = createFileRoute("/_app/mentorship")({ component: MentorshipPage });

function MentorshipPage() {
  const mentors = useMemo(() => MOCK_ALUMNI.filter((a) => !a.archived && a.mentorship_interest), []);
  const [category, setCategory] = useState<string>("all");

  const filtered = category === "all" ? mentors : mentors.filter((m) => m.mentorship_categories.includes(category));

  const counts: Record<string, number> = { all: mentors.length };
  MENTOR_CATEGORIES.forEach((c) => { counts[c] = mentors.filter((m) => m.mentorship_categories.includes(c)).length; });

  const chartData = MENTOR_CATEGORIES.map((c) => ({ name: MENTOR_CATEGORY_LABELS[c], count: counts[c] }));

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Mentorship" }]} />
      <PageHeader title="Mentorship" description="Alumni who have opted into mentoring current CS students." />

      <div className="flex flex-wrap gap-2 mb-6">
        <Chip label={`All (${counts.all})`} active={category === "all"} onClick={() => setCategory("all")} />
        {MENTOR_CATEGORIES.map((c) => (
          <Chip key={c} label={`${MENTOR_CATEGORY_LABELS[c]} (${counts[c]})`} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No mentors in this category yet.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {filtered.map((m) => {
            const initials = m.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("");
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{m.full_name}</div>
                    <div className="text-sm text-muted-foreground">{m.job_title} · {m.company}</div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {m.mentorship_categories.map((c) => <Badge key={c} className="bg-primary/10 text-primary border-primary/20">{MENTOR_CATEGORY_LABELS[c]}</Badge>)}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button asChild variant="outline" size="sm"><a href={`mailto:${m.email}`}><Mail className="size-4" />Email</a></Button>
                      {m.linkedin_url && <Button asChild variant="outline" size="sm"><a href={m.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="size-4" />LinkedIn</a></Button>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5">
        <div className="font-medium mb-4">Mentor count by category</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--color-accent)" }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PageContainer>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>{label}</button>
  );
}
