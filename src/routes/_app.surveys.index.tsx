import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { useAuth, canEdit, isActive } from "@/lib/auth";
import { listSurveys } from "@/lib/surveys.functions";

export const Route = createFileRoute("/_app/surveys/")({ component: SurveysList });

function SurveysList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && !isActive(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);
  const canMutate = canEdit(user);

  const listFn = useServerFn(listSurveys);
  const { data, isLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => listFn(),
    enabled: isActive(user),
  });
  const surveys = data?.surveys ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Surveys"
        description="Collect structured feedback from alumni. Responses flow in automatically the moment they submit."
        actions={
          canMutate && (
            <Button asChild>
              <Link to="/surveys/new">
                <Plus className="size-4" />
                Create survey
              </Link>
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-9">Title</TableHead>
              <TableHead>Linked campaign</TableHead>
              <TableHead>Responses</TableHead>
              <TableHead className="pr-9">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : surveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12">
                  <EmptyState
                    icon={ClipboardList}
                    title="No surveys yet"
                    description="Connect a Tally form and every submission lands here, automatically matched to the alumni record."
                    action={
                      canMutate ? (
                        <Button asChild>
                          <Link to="/surveys/new">
                            <Plus className="size-4" />
                            Create survey
                          </Link>
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              surveys.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/surveys/$id", params: { id: s.id } })}
                >
                  <TableCell className="font-medium pl-6">
                    <Link to="/surveys/$id" params={{ id: s.id }} className="hover:underline">
                      {s.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.campaign_name ?? "—"}</TableCell>
                  <TableCell>{s.response_count}</TableCell>
                  <TableCell className="text-muted-foreground pr-6">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </PageContainer>
  );
}
