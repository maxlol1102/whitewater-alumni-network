import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Mail, Linkedin } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { MENTOR_CATEGORIES, MENTOR_CATEGORY_LABELS } from "@/mocks";
import { listAlumni } from "@/lib/alumni.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/mentorship")({ component: MentorshipPage });

function MentorshipPage() {
  const { user } = useAuth();
  const listFn = useServerFn(listAlumni);
  const { data } = useQuery({
    queryKey: ["alumni", "for-mentorship"],
    queryFn: () => listFn({ data: {} }),
    enabled: !!user,
  });
  const mentors = useMemo(
    () => (data?.alumni ?? []).filter((a) => !a.archived && a.mentorship_interest),
    [data],
  );
  const [category, setCategory] = useState<string>("all");

  const filtered =
    category === "all"
      ? mentors
      : mentors.filter((m) => m.mentorship_categories.includes(category));

  const counts: Record<string, number> = { all: mentors.length };
  MENTOR_CATEGORIES.forEach((c) => {
    counts[c] = mentors.filter((m) => m.mentorship_categories.includes(c)).length;
  });

  const chartData = MENTOR_CATEGORIES.map((c) => ({
    name: MENTOR_CATEGORY_LABELS[c],
    count: counts[c],
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Mentorship"
        description="Alumni who have opted into mentoring current CS students."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <Chip
          label={`All (${counts.all})`}
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {MENTOR_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={`${MENTOR_CATEGORY_LABELS[c]} (${counts[c]})`}
            active={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      <Card className="overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="text-right">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  No mentors in this category yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const initials = m.full_name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("");
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold shrink-0">
                          {initials}
                        </div>
                        <span className="font-medium">{m.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.job_title ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.company ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.mentorship_categories.map((c) => (
                          <Badge key={c} className="bg-primary/10 text-primary border-primary/20">
                            {MENTOR_CATEGORY_LABELS[c]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button asChild variant="outline" size="sm">
                          <a href={`mailto:${m.email}`}>
                            <Mail className="size-4" />
                            Email
                          </a>
                        </Button>
                        {m.linkedin_url && (
                          <Button asChild variant="outline" size="sm">
                            <a href={m.linkedin_url} target="_blank" rel="noreferrer">
                              <Linkedin className="size-4" />
                              LinkedIn
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

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
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}
    >
      {label}
    </button>
  );
}
