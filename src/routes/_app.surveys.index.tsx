import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ClipboardList } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { MOCK_SURVEYS, MOCK_CAMPAIGNS } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/surveys/")({ component: SurveysList });

function SurveysList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && user.account_role !== "admin") navigate({ to: "/dashboard" }); }, [user, navigate]);
  const canMutate = canEdit(user);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Surveys" }]} />
      <PageHeader title="Surveys" description="External surveys and their imported responses." actions={canMutate && <Button onClick={() => navigate({ to: "/surveys/new" })}><Plus className="size-4" />Create survey</Button>} />

      {MOCK_SURVEYS.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No surveys yet" description="Create a survey to start collecting alumni responses." action={canMutate ? <Button onClick={() => navigate({ to: "/surveys/new" })}><Plus className="size-4" />Create survey</Button> : undefined} />
      ) : (
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
              {MOCK_SURVEYS.map((s) => {
                const linked = MOCK_CAMPAIGNS.find((c) => c.id === s.campaign_id);
                return (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate({ to: "/surveys/$id", params: { id: s.id } })}>
                    <TableCell className="font-medium"><Link to="/surveys/$id" params={{ id: s.id }} className="hover:underline">{s.title}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{linked?.name ?? "—"}</TableCell>
                    <TableCell>{s.response_count}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
