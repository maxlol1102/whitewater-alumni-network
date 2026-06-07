import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";
import { getSurvey, deleteSurvey, listSurveyResponses } from "@/lib/surveys.functions";

export const Route = createFileRoute("/_app/surveys/$id")({ component: SurveyDetail });

function SurveyDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);
  const canMutate = canEdit(user);

  const getFn = useServerFn(getSurvey);
  const listResponsesFn = useServerFn(listSurveyResponses);
  const deleteFn = useServerFn(deleteSurvey);

  const { data: surveyData, isLoading } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => getFn({ data: { id } }),
    enabled: canEdit(user),
  });
  const { data: responsesData } = useQuery({
    queryKey: ["survey", id, "responses"],
    queryFn: () => listResponsesFn({ data: { survey_id: id } }),
    enabled: canEdit(user),
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: () => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Survey deleted");
      navigate({ to: "/surveys" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <PageContainer>
        <Skeleton className="h-[72px] w-64 mb-10" />
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </PageContainer>
    );
  const s = surveyData?.survey ?? null;
  if (!s)
    return (
      <PageContainer>
        <p>Not found.</p>
      </PageContainer>
    );

  const responses = responsesData?.responses ?? [];

  return (
    <PageContainer>
      <PageHeader title={s.title} description={s.description} className="mb-0" />
      <Breadcrumbs items={[{ label: "Surveys", to: "/surveys" }, { label: s.title }]} />

      <Card className="p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <a
              href={s.form_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
            >
              {s.form_url} <ExternalLink className="size-3.5" />
            </a>
            <div className="text-sm mt-4">
              <span className="text-muted-foreground">Responses:</span>{" "}
              <span className="font-medium">{responses.length}</span>
            </div>
          </div>
          {canMutate && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/surveys/$id/edit" params={{ id }}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b font-medium">Responses</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-9">Email</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Alumni</TableHead>
              <TableHead className="pr-9">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No responses imported yet.
                </TableCell>
              </TableRow>
            ) : (
              responses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground pl-6">{r.email}</TableCell>
                  <TableCell>
                    {r.alumni_id ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        Matched
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unmatched</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.alumni_id && r.alumni_name ? (
                      <Link
                        to="/alumni/$id"
                        params={{ id: r.alumni_id }}
                        className="text-primary hover:underline"
                      >
                        {r.alumni_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground pr-6">
                    {new Date(r.submitted_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the survey and all imported responses. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
