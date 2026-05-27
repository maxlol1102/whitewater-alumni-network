import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs, PageContainer, PageHeader, PageSection } from "@/components/layout/Page";
import { importAlumniCsv } from "@/lib/alumni.functions";
import { toast } from "sonner";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/alumni/import")({ component: AlumniImport });

type Step = "upload" | "preview" | "result";
type Row = Record<string, string>;

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload file" },
  { id: "preview", label: "Review data" },
  { id: "result", label: "Done" },
];

function ImportStepper({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center py-1">
      {STEPS.map((s, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !done && !active && "border-2 border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5 stroke-[2.5]" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  active && "text-foreground",
                  done && "text-primary",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-6 mx-4 h-px w-24 transition-colors duration-200",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const HEADER_ALIASES: Record<string, string> = {
  name: "full_name",
  "full name": "full_name",
  full_name: "full_name",
  email: "email",
  "e-mail": "email",
  phone: "phone",
  linkedin: "linkedin_url",
  linkedin_url: "linkedin_url",
  grad_year: "graduation_year",
  "graduation year": "graduation_year",
  graduation_year: "graduation_year",
  year: "graduation_year",
  degree: "degree_program",
  degree_program: "degree_program",
  company: "company",
  employer: "company",
  job_title: "job_title",
  "job title": "job_title",
  title: "job_title",
  industry: "industry",
  location: "location",
  city: "location",
};

function parseCsv(text: string): Row[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (l: string) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        if (q && l[i + 1] === '"') { cur += '"'; i++; }
        else q = !q;
      } else if (c === "," && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map((h) =>
    HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase(),
  );
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const obj: Row = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
}

function AlumniImport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/alumni" });
  }, [user, navigate]);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    updated: number;
    errors: { row: number; reason: string }[];
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importFn = useServerFn(importAlumniCsv);

  const mutation = useMutation({
    mutationFn: () =>
      importFn({
        data: {
          rows: rows.map((r) => ({
            ...r,
            graduation_year: r.graduation_year ? Number(r.graduation_year) : null,
          })),
        },
      }),
    onSuccess: (res) => {
      setResult(res);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
      toast.success(`Imported ${res.inserted + res.updated} alumni`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      toast.error("CSV has no data rows.");
      return;
    }
    setFileName(file.name);
    setRows(parsed);
    setStep("preview");
  }

  const previewRows = rows.slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title="Import alumni"
        description="Bring in a spreadsheet export from LinkedIn, your department records, or any other source. We'll map the columns, deduplicate by email, and tell you exactly what changed."
        className="mb-0"
      />
      <Breadcrumbs items={[{ label: "Alumni", to: "/alumni" }, { label: "Import CSV" }]} />
      <PageSection>
        <Card>
          <CardHeader className="border-b border-border/70 px-8 py-6">
            <ImportStepper current={step} />
          </CardHeader>

          {step === "upload" && (
            <CardContent className="p-6">
              <div
                role="button"
                tabIndex={0}
                className={`border-2 border-dashed rounded-xl p-14 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) void onFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              >
                <UploadCloud className={`size-10 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-center">
                  <div className="font-semibold text-sm">
                    {dragOver ? "Release to upload" : "Drag and drop your CSV here, or click to browse"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Must include <strong>full_name</strong> and <strong>email</strong>. Everything else is optional: company, job_title, graduation_year, industry, location, linkedin_url, phone, degree_program.
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Column headers are flexible. "name", "full name", and "full_name" are all recognized, as are common variations for other fields. If a column doesn't match anything, it's ignored.
              </p>
            </CardContent>
          )}

          {step === "preview" && (
            <>
              <CardContent className="p-6 space-y-4">
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{fileName}</span> —{" "}
                  <Badge variant="secondary">{rows.length} {rows.length === 1 ? "row" : "rows"}</Badge> ready to import. Showing the first 5 below.
                </div>
                <Card className="overflow-hidden shadow-none border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left p-2 pl-4">#</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2 pr-4">Grad year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 pl-4 text-muted-foreground">{i + 1}</td>
                          <td className="p-2">{r.full_name || <em className="text-muted-foreground">—</em>}</td>
                          <td className="p-2">{r.email || <em className="text-muted-foreground">—</em>}</td>
                          <td className="p-2">{r.company ?? "—"}</td>
                          <td className="p-2 pr-4">{r.graduation_year ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                <p className="text-xs text-muted-foreground">
                  Each row is matched by email address. Alumni already in the directory get their profile updated with the new data. Rows with a new email create a fresh record. Anything missing a name or a valid email is skipped and listed in the summary after import.
                </p>
              </CardContent>
              <CardFooter className="justify-between border-t border-border/70 pt-6">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Back
                </Button>
                <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
                  {mutation.isPending ? "Importing…" : `Import ${rows.length} rows`}
                </Button>
              </CardFooter>
            </>
          )}

          {step === "result" && result && (
            <>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Rows detected", value: result.total },
                    { label: "Inserted", value: result.inserted },
                    { label: "Updated", value: result.updated },
                    { label: "Invalid", value: result.errors.length },
                  ].map((s) => (
                    <Card key={s.label} className="p-4 text-center shadow-none">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="text-2xl font-semibold mt-1">{s.value}</div>
                    </Card>
                  ))}
                </div>
                <Card className="p-4 flex items-start gap-3 text-sm shadow-none border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-emerald-800 dark:text-emerald-300">
                    {result.inserted > 0 && result.updated > 0 && (
                      <>{result.inserted} new {result.inserted === 1 ? "alumni was" : "alumni were"} added and {result.updated} existing {result.updated === 1 ? "record was" : "records were"} updated.</>
                    )}
                    {result.inserted > 0 && result.updated === 0 && (
                      <>{result.inserted} new {result.inserted === 1 ? "alumni was" : "alumni were"} added to the directory.</>
                    )}
                    {result.inserted === 0 && result.updated > 0 && (
                      <>{result.updated} existing {result.updated === 1 ? "record was" : "records were"} updated with the latest data.</>
                    )}
                    {result.inserted === 0 && result.updated === 0 && (
                      <>No new records were added or updated — the directory is already up to date.</>
                    )}
                  </div>
                </Card>
                {result.errors.length > 0 && (
                  <Card className="p-4 flex items-start gap-3 text-sm shadow-none border-destructive/30 bg-destructive/5">
                    <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium mb-1">{result.errors.length} {result.errors.length === 1 ? "row" : "rows"} couldn't be imported:</div>
                      <ul className="text-xs text-muted-foreground max-h-40 overflow-auto space-y-0.5">
                        {result.errors.slice(0, 20).map((e) => (
                          <li key={e.row}>
                            Row {e.row}: {e.reason}
                          </li>
                        ))}
                        {result.errors.length > 20 && <li>…and {result.errors.length - 20} more</li>}
                      </ul>
                    </div>
                  </Card>
                )}
              </CardContent>
              <CardFooter className="justify-end border-t border-border/70 pt-6">
                <Button onClick={() => navigate({ to: "/alumni" })}>
                  Back to alumni
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </PageSection>
    </PageContainer>
  );
}
