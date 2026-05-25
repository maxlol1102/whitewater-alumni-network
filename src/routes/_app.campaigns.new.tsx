import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { TemplatePicker } from "@/components/campaigns/TemplatePicker";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, isActive, canEdit } from "@/lib/auth";
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
  const isAdmin = canEdit(user);

  useEffect(() => {
    if (user && !isActive(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  // No template selected yet → show picker
  if (!templateId) {
    return (
      <PageContainer>
        <PageHeader
          title="New campaign"
          description="Campaign templates pre-fill everything — name, subject, email, and survey. Pick a layout to start from a formatted email body."
          className="mb-0"
        />
        <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: "New" }]} />
        {/* surveyOnly hides email layouts for non-admins who can't send email campaigns */}
        <TemplatePicker surveyOnly={!isAdmin} />
      </PageContainer>
    );
  }

  const template =
    templateId === "blank" ? BLANK_TEMPLATE : (getTemplate(templateId) ?? BLANK_TEMPLATE);

  return (
    <PageContainer>
      <PageHeader
        title={template ? `${template.name} campaign` : "New campaign"}
        description={
          template?.category === "bundle"
            ? "Campaign details are pre-filled from the template. Edit anything before saving."
            : "Replace the bracketed content with your own. Save as draft, then review and send when you're ready."
        }
        className="mb-0"
      />
      <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: "New" }]} />
      <CampaignForm mode="create" templateOverride={template} />
    </PageContainer>
  );
}
