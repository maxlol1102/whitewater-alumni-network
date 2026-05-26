import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect } from "react";
import { SurveyForm } from "@/components/surveys/SurveyForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/surveys/new")({
  validateSearch: z.object({ title: z.string().optional() }),
  component: NewSurvey,
});

function NewSurvey() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { title } = Route.useSearch();

  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  return (
    <PageContainer>
      <PageHeader
        title="New survey"
        description="Connect a Tally form and start capturing structured alumni feedback. No code, no manual imports."
        className="mb-0"
      />
      <Breadcrumbs items={[{ label: "Surveys", to: "/surveys" }, { label: "New" }]} />
      <SurveyForm mode="create" initialTitle={title} />
    </PageContainer>
  );
}
