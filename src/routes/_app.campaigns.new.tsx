import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/campaigns/new")({ component: NewCampaign });

function NewCampaign() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !canEdit(user.role)) navigate({ to: "/dashboard" }); }, [user, navigate]);
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: "New" }]} />
      <PageHeader title="Create campaign" description="Compose an email and choose an alumni audience." />
      <CampaignForm mode="create" />
    </PageContainer>
  );
}
