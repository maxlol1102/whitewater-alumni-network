import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Upload, Download, Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { INDUSTRY_OPTIONS, TAG_OPTIONS } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";
import { CsvImportDialog } from "@/components/alumni/CsvImportDialog";
import { listAlumni } from "@/lib/alumni.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alumni/")({ component: AlumniList });

function AlumniList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canMutate = canEdit(user);
  const list = useServerFn(listAlumni);
  const { data, isLoading } = useQuery({
    queryKey: ["alumni", { archived: false }],
    queryFn: () => list({ data: { includeArchived: false } }),
  });
  const alumni = data?.alumni ?? [];

  const [q, setQ] = useState("");
  const [years, setYears] = useState<number[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mentorOnly, setMentorOnly] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const allYears = useMemo(
    () =>
      Array.from(
        new Set(alumni.map((a) => a.graduation_year).filter((y): y is number => y != null)),
      ).sort((a, b) => b - a),
    [alumni],
  );

  const rows = useMemo(() => {
    return alumni.filter((a) => {
      if (
        q &&
        !`${a.full_name} ${a.email} ${a.company ?? ""}`.toLowerCase().includes(q.toLowerCase())
      )
        return false;
      if (years.length && (a.graduation_year == null || !years.includes(a.graduation_year)))
        return false;
      if (industries.length && (!a.industry || !industries.includes(a.industry))) return false;
      if (tags.length && !a.tags.some((t) => tags.includes(t))) return false;
      if (mentorOnly && !a.mentorship_interest) return false;
      return true;
    });
  }, [alumni, q, years, industries, tags, mentorOnly]);

  function exportCsv() {
    const header = ["name", "email", "company", "job_title", "grad_year", "industry", "mentorship"];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        [
          r.full_name,
          r.email,
          r.company ?? "",
          r.job_title ?? "",
          r.graduation_year ?? "",
          r.industry ?? "",
          r.mentorship_interest,
        ].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alumni-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} alumni`);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Alumni"
        description="Browse, filter, and manage alumni records."
        actions={
          <>
            {canMutate && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Import CSV
              </Button>
            )}
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
            {canMutate && (
              <Button onClick={() => navigate({ to: "/alumni/new" })}>
                <Plus className="size-4" />
                Add Alumni
              </Button>
            )}
          </>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, company…"
              className="pl-8"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="size-4" />
                Filters{" "}
                {years.length + industries.length + tags.length + (mentorOnly ? 1 : 0) > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {years.length + industries.length + tags.length + (mentorOnly ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-4" align="end">
              <FilterMulti
                label="Graduation year"
                options={allYears.map((y) => ({ value: String(y), label: String(y) }))}
                value={years.map(String)}
                onChange={(v) => setYears(v.map(Number))}
              />
              <FilterMulti
                label="Industry"
                options={INDUSTRY_OPTIONS.map((i) => ({ value: i, label: i }))}
                value={industries}
                onChange={setIndustries}
              />
              <FilterMulti
                label="Tags"
                options={TAG_OPTIONS.map((t) => ({ value: t, label: t }))}
                value={tags}
                onChange={setTags}
              />
              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor="m">Mentorship only</Label>
                <Switch id="m" checked={mentorOnly} onCheckedChange={setMentorOnly} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setYears([]);
                  setIndustries([]);
                  setTags([]);
                  setMentorOnly(false);
                }}
              >
                Clear all
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Grad Year</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Mentorship</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><div className="flex gap-1"><Skeleton className="h-5 w-14 rounded-full" /><Skeleton className="h-5 w-14 rounded-full" /></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <EmptyState
                    icon={Users}
                    title={alumni.length === 0 ? "No alumni yet" : "No alumni match your filters"}
                    description={
                      alumni.length === 0
                        ? "Add your first alumni record or import a CSV to get started."
                        : "Try clearing some filters, or add a new alumni record."
                    }
                    action={
                      canMutate ? (
                        <Button onClick={() => navigate({ to: "/alumni/new" })}>
                          <Plus className="size-4" />
                          Add Alumni
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/alumni/$id", params: { id: a.id } })}
                >
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>{a.company ?? "—"}</TableCell>
                  <TableCell>{a.job_title ?? "—"}</TableCell>
                  <TableCell>{a.graduation_year ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {a.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                      {a.tags.length > 2 && <Badge variant="outline">+{a.tags.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.mentorship_interest && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">Mentor</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/alumni/$id"
                      params={{ id: a.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </PageContainer>
  );
}

function FilterMulti({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="max-h-40 overflow-auto space-y-1 pr-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={value.includes(o.value)}
              onCheckedChange={(c) =>
                onChange(c ? [...value, o.value] : value.filter((v) => v !== o.value))
              }
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
