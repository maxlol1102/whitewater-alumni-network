import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { TemplatePicker } from "@/components/campaigns/TemplatePicker";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, isActive } from "@/lib/auth";
import { useEffect } from "react";
import { getTemplate, BLANK_TEMPLATE } from "@/lib/email-templates";

export const Route = createFileRoute("/_app/campaigns/new")({
  validateSearch: z.object({ template: z.string().optional() }),
  component: NewCampaign,
});

function NewCampaign() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { template: templateId } = Route.useSearch();

  useEffect(() => {
    if (user && !isActive(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  // No ?template param → show picker
  if (!templateId) {
    return (
      <PageContainer>
        <PageHeader
          title="Create campaign"
          description="Choose a template or start blank."
          className="mb-0"
        />
        <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: "New" }]} />
        <TemplatePicker />
      </PageContainer>
    );
  }

  // ?template=blank → skeleton form; unknown id → also blank skeleton
  const template = templateId === "blank" ? BLANK_TEMPLATE : (getTemplate(templateId) ?? BLANK_TEMPLATE);

  return (
    <PageContainer>
      <PageHeader
        title={template ? `${template.name} campaign` : "New campaign"}
        description="Edit the pre-filled content, then save as draft."
        className="mb-0"
      />
      <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: "New" }]} />
      <CampaignForm mode="create" templateOverride={template} />
    </PageContainer>
  );
}
