import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { MOCK_CAMPAIGNS } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/campaigns/$id/edit")({ component: EditCampaign });

function EditCampaign() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const c = MOCK_CAMPAIGNS.find((x) => x.id === id);
  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/dashboard" });
    if (c && c.status !== "draft") { toast.error("Only draft campaigns can be edited"); navigate({ to: "/campaigns/$id", params: { id } }); }
  }, [user, navigate, c, id]);
  if (!c) return <PageContainer><p>Not found.</p></PageContainer>;
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: c.name, to: "/campaigns" }, { label: "Edit" }]} />
      <PageHeader title={`Edit ${c.name}`} />
      <CampaignForm mode="edit" initial={c} />
    </PageContainer>
  );
}
