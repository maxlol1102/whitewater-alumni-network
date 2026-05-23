import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SurveyForm } from "@/components/surveys/SurveyForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/surveys/new")({ component: NewSurvey });

function NewSurvey() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !canEdit(user.role)) navigate({ to: "/dashboard" }); }, [user, navigate]);
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Surveys", to: "/surveys" }, { label: "New" }]} />
      <PageHeader title="Create survey" description="Link an external form and track responses by email." />
      <SurveyForm mode="create" />
    </PageContainer>
  );
}
