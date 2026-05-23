import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Upload, Pencil, UploadCloud, CheckCircle2 } from "lucide-react";
import { Breadcrumbs, PageContainer } from "@/components/layout/Page";
import { MOCK_SURVEYS, MOCK_SURVEY_RESPONSES, MOCK_ALUMNI } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/surveys/$id")({ component: SurveyDetail });

function SurveyDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && user.role === "faculty") navigate({ to: "/dashboard" }); }, [user, navigate]);
  const canMutate = canEdit(user?.role);
  const s = MOCK_SURVEYS.find((x) => x.id === id);
  const [importOpen, setImportOpen] = useState(false);

  if (!s) return <PageContainer><p>Not found.</p></PageContainer>;

  const responses = MOCK_SURVEY_RESPONSES.filter((r) => r.survey_id === id);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Surveys", to: "/surveys" }, { label: s.title }]} />

      <Card className="p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{s.title}</h1>
            <p className="text-muted-foreground mt-1">{s.description}</p>
            <a href={s.form_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3">
              {s.form_url} <ExternalLink className="size-3.5" />
            </a>
            <div className="text-sm mt-4"><span className="text-muted-foreground">Responses:</span> <span className="font-medium">{s.response_count}</span></div>
          </div>
          {canMutate && (
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link to="/surveys/$id/edit" params={{ id }}><Pencil className="size-4" />Edit</Link></Button>
              <Button onClick={() => setImportOpen(true)}><Upload className="size-4" />Import responses</Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b font-medium">Responses</div>
        {responses.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No responses imported yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Alumni</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((r) => {
                const alumni = r.alumni_id ? MOCK_ALUMNI.find((a) => a.id === r.alumni_id) : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                    <TableCell>{alumni ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Matched</Badge> : <Badge variant="secondary">Unmatched</Badge>}</TableCell>
                    <TableCell>{alumni ? <Link to="/alumni/$id" params={{ id: alumni.id }} className="text-primary hover:underline">{alumni.full_name}</Link> : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <ImportResponsesDialog open={importOpen} onOpenChange={setImportOpen} />
    </PageContainer>
  );
}

function ImportResponsesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string | null>(null);

  function close(o: boolean) { if (!o) { setStep(1); setFileName(null); } onOpenChange(o); }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import survey responses</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`px-2 py-0.5 rounded ${step === n ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Step {n}</span>
          ))}
        </div>

        {step === 1 && (
          <label className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-75">
            <UploadCloud className="size-8 text-muted-foreground" />
            <div className="text-sm font-medium">Upload CSV</div>
            <div className="text-xs text-muted-foreground">Accepted email column headers: email, email_address, respondent_email</div>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setStep(2); } }} />
          </label>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">File: <span className="text-foreground font-medium">{fileName}</span> — first 5 rows</div>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-2">Detected email column: <code className="bg-muted px-1 rounded">respondent_email</code></div>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="text-left">Row</th><th className="text-left">respondent_email</th><th className="text-left">Q1</th></tr></thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-t"><td className="py-1">{i}</td><td>example{i}@uww.edu</td><td className="text-muted-foreground">…</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => { setStep(3); toast.success("Mock import complete"); }}>Confirm and import</Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 text-center"><div className="text-xs text-muted-foreground">Matched</div><div className="text-2xl font-semibold mt-1">36</div></Card>
              <Card className="p-3 text-center"><div className="text-xs text-muted-foreground">Unmatched</div><div className="text-2xl font-semibold mt-1">5</div></Card>
            </div>
            <Card className="p-3 flex items-start gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600 mt-0.5" />
              <div>Mock import complete. Phase B will create <code className="text-xs bg-muted px-1 rounded">survey.responses_imported</code> audit log entries.</div>
            </Card>
            <DialogFooter><Button onClick={() => close(false)}>Done</Button></DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
