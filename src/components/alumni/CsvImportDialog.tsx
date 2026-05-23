import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { importAlumniCsv } from "@/lib/alumni.functions";
import { toast } from "sonner";

type Step = "upload" | "preview" | "result";

type Row = Record<string, string>;

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
        if (q && l[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === "," && !q) {
        out.push(cur);
        cur = "";
      } else cur += c;
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
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}

export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<{
    inserted: number;
    updated: number;
    errors: { row: number; reason: string }[];
    total: number;
  } | null>(null);

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

  function reset() {
    setStep("upload");
    setFileName(null);
    setRows([]);
    setResult(null);
  }
  function close(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  async function onFile(file: File) {
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
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import alumni from CSV</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {(["upload", "preview", "result"] as Step[]).map((s, i) => (
            <span
              key={s}
              className={`px-2 py-0.5 rounded ${step === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>

        {step === "upload" && (
          <div className="py-6">
            <label className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-75">
              <UploadCloud className="size-8 text-muted-foreground" />
              <div className="text-sm font-medium">Click to upload CSV</div>
              <div className="text-xs text-muted-foreground text-center max-w-md">
                Required columns: full_name, email. Optional: company, job_title, graduation_year,
                industry, location, linkedin_url, phone, degree_program.
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />
            </label>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              File: <span className="text-foreground font-medium">{fileName}</span> — {rows.length}{" "}
              rows detected, showing first 5
            </div>
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Row</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{r.full_name || <em className="text-muted-foreground">—</em>}</td>
                      <td className="p-2">{r.email || <em className="text-muted-foreground">—</em>}</td>
                      <td className="p-2">{r.company ?? ""}</td>
                      <td className="p-2">{r.graduation_year ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="text-xs text-muted-foreground">
              Matching is by email. Existing alumni with the same email will be updated; new emails
              will be inserted. Invalid rows are reported in the results.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? "Importing…" : "Apply import"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Rows detected", value: result.total },
                { label: "Inserted", value: result.inserted },
                { label: "Updated", value: result.updated },
                { label: "Invalid", value: result.errors.length },
              ].map((s) => (
                <Card key={s.label} className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-semibold mt-1">{s.value}</div>
                </Card>
              ))}
            </div>
            <Card className="p-3 flex items-start gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600 mt-0.5" />
              <div>
                Import complete. {result.inserted} new and {result.updated} updated alumni records.
              </div>
            </Card>
            {result.errors.length > 0 && (
              <Card className="p-3 flex items-start gap-2 text-sm">
                <AlertCircle className="size-4 text-destructive mt-0.5" />
                <div>
                  <div className="font-medium mb-1">{result.errors.length} invalid rows:</div>
                  <ul className="text-xs text-muted-foreground max-h-32 overflow-auto">
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
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
