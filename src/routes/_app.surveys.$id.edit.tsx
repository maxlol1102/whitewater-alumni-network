import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SurveyForm } from "@/components/surveys/SurveyForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";
import { getSurvey } from "@/lib/surveys.functions";

export const Route = createFileRoute("/_app/surveys/$id/edit")({ component: EditSurvey });

function EditSurvey() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !canEdit(user)) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const getFn = useServerFn(getSurvey);
  const { data, isLoading } = useQuery({
    queryKey: ["survey", id],
    queryFn: () => getFn({ data: { id } }),
    enabled: !!user,
  });
  const s = data?.survey ?? null;

  if (isLoading) return <PageContainer><p className="text-sm text-muted-foreground">Loading…</p></PageContainer>;
  if (!s) return <PageContainer><p>Not found.</p></PageContainer>;

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Surveys", to: "/surveys" }, { label: s.title, to: "/surveys" }, { label: "Edit" }]} />
      <PageHeader title={`Edit ${s.title}`} />
      <SurveyForm mode="edit" initial={s} />
    </PageContainer>
  );
}
