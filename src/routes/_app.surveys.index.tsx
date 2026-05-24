import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ClipboardList } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";
import { listSurveys } from "@/lib/surveys.functions";
import { SurveyForm } from "@/components/surveys/SurveyForm";

export const Route = createFileRoute("/_app/surveys/")({ component: SurveysList });

function SurveysList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => { if (user && user.account_role !== "admin") navigate({ to: "/dashboard" }); }, [user, navigate]);
  const canMutate = canEdit(user);

  const listFn = useServerFn(listSurveys);
  const { data, isLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => listFn(),
    enabled: user?.account_role === "admin",
  });
  const surveys = data?.surveys ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Surveys" }]} />
      <PageHeader title="Surveys" description="External surveys and their imported responses." actions={canMutate && <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />Create survey</Button>} />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Linked campaign</TableHead>
              <TableHead>Responses</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">Loading surveys…</TableCell></TableRow>
            ) : surveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12">
                  <EmptyState icon={ClipboardList} title="No surveys yet" description="Create a survey to start collecting alumni responses." action={canMutate ? <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />Create survey</Button> : undefined} />
                </TableCell>
              </TableRow>
            ) : (
              surveys.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate({ to: "/surveys/$id", params: { id: s.id } })}>
                  <TableCell className="font-medium"><Link to="/surveys/$id" params={{ id: s.id }} className="hover:underline">{s.title}</Link></TableCell>
                  <TableCell className="text-muted-foreground">{s.campaign_name ?? "—"}</TableCell>
                  <TableCell>{s.response_count}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create survey</DialogTitle>
          </DialogHeader>
          <SurveyForm mode="create" inDialog onClose={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
