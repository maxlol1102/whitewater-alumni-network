import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlumniForm } from "@/components/alumni/AlumniForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/alumni/new")({ component: NewAlumni });

function NewAlumni() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !canEdit(user)) navigate({ to: "/dashboard" }); }, [user, navigate]);
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Alumni", to: "/alumni" }, { label: "New" }]} />
      <PageHeader title="Add Alumni" description="Create a new alumni record." />
      <AlumniForm mode="create" />
    </PageContainer>
  );
}
