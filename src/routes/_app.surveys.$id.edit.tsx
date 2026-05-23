import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SurveyForm } from "@/components/surveys/SurveyForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { MOCK_SURVEYS } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/surveys/$id/edit")({ component: EditSurvey });

function EditSurvey() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !canEdit(user.role)) navigate({ to: "/dashboard" }); }, [user, navigate]);
  const s = MOCK_SURVEYS.find((x) => x.id === id);
  if (!s) return <PageContainer><p>Not found.</p></PageContainer>;
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Surveys", to: "/surveys" }, { label: s.title, to: "/surveys" }, { label: "Edit" }]} />
      <PageHeader title={`Edit ${s.title}`} />
      <SurveyForm mode="edit" initial={s} />
    </PageContainer>
  );
}
