import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Step = "upload" | "preview" | "result";

const PREVIEW_ROWS = [
  { row: 1, full_name: "Alex Rivera", email: "alex.rivera@example.com", company: "Epic", grad_year: "2018", valid: true },
  { row: 2, full_name: "Jordan Kim", email: "jordan.kim@example.com", company: "Microsoft", grad_year: "2020", valid: true },
  { row: 3, full_name: "Taylor Brown", email: "taylor@example", company: "Google", grad_year: "2019", valid: false, reason: "Invalid email" },
  { row: 4, full_name: "Casey Lee", email: "casey.lee@example.com", company: "Northwestern Mutual", grad_year: "2021", valid: true },
  { row: 5, full_name: "Sam Olson", email: "", company: "GE Healthcare", grad_year: "1899", valid: false, reason: "Missing email; year out of range" },
];

export function CsvImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);

  function reset() { setStep("upload"); setFileName(null); }
  function close(o: boolean) { if (!o) reset(); onOpenChange(o); }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import alumni from CSV</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {(["upload", "preview", "result"] as Step[]).map((s, i) => (
            <span key={s} className={`px-2 py-0.5 rounded ${step === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{i + 1}. {s}</span>
          ))}
        </div>

        {step === "upload" && (
          <div className="py-6">
            <label className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-75">
              <UploadCloud className="size-8 text-muted-foreground" />
              <div className="text-sm font-medium">Click to upload CSV</div>
              <div className="text-xs text-muted-foreground">Required columns: full_name, email. Optional: company, job_title, graduation_year, industry, location, linkedin_url</div>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setStep("preview"); } }} />
            </label>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">File: <span className="text-foreground font-medium">{fileName}</span> — showing first 5 detected rows</div>
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr><th className="text-left p-2">Row</th><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="text-left p-2">Company</th><th className="text-left p-2">Year</th><th className="text-left p-2">Status</th></tr>
                </thead>
                <tbody>
                  {PREVIEW_ROWS.map((r) => (
                    <tr key={r.row} className="border-t">
                      <td className="p-2">{r.row}</td>
                      <td className="p-2">{r.full_name}</td>
                      <td className="p-2">{r.email || <span className="text-muted-foreground italic">—</span>}</td>
                      <td className="p-2">{r.company}</td>
                      <td className="p-2">{r.grad_year}</td>
                      <td className="p-2">{r.valid ? <Badge variant="secondary" className="text-emerald-700 bg-emerald-50">Valid</Badge> : <Badge variant="secondary" className="text-destructive bg-destructive/10">{r.reason}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="text-xs text-muted-foreground">Duplicate match is on normalized email. Invalid rows will be reported separately and not silently skipped.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={() => { setStep("result"); toast.success("Mock import applied"); }}>Apply import</Button>
            </DialogFooter>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Rows detected", value: 50 },
                { label: "New alumni", value: 38 },
                { label: "Matched", value: 9 },
                { label: "Invalid", value: 2 },
                { label: "Skipped", value: 1 },
              ].map((s) => (
                <Card key={s.label} className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-semibold mt-1">{s.value}</div>
                </Card>
              ))}
            </div>
            <Card className="p-3 flex items-start gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600 mt-0.5" />
              <div>Mock import complete. In Phase B this will create <code className="text-xs bg-muted px-1 rounded">alumni.imported</code> audit log entries.</div>
            </Card>
            <Card className="p-3 flex items-start gap-2 text-sm">
              <AlertCircle className="size-4 text-warning mt-0.5" />
              <div>2 invalid rows: row 3 (invalid email), row 5 (missing email; year out of range).</div>
            </Card>
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
