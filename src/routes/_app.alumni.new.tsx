import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlumniForm } from "@/components/alumni/AlumniForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/alumni/new")({ component: NewAlumni });

function NewAlumni() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);
  return (
    <PageContainer>
      <PageHeader title="Add Alumni" description="Add a graduate to the network. You can always enrich the profile later." className="mb-0" />
      <Breadcrumbs items={[{ label: "Alumni", to: "/alumni" }, { label: "New" }]} />
      <AlumniForm mode="create" />
    </PageContainer>
  );
}
