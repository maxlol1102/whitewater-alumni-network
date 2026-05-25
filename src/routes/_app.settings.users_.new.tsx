import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { UserForm } from "@/components/users/UserForm";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/settings/users_/new")({ component: NewUser });

function NewUser() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.account_role !== "admin") navigate({ to: "/dashboard" });
  }, [user, navigate]);

  return (
    <PageContainer>
      <PageHeader
        title="Invite User"
        description="Grant a faculty member or student access to the alumni network."
        className="mb-0"
      />
      <Breadcrumbs items={[{ label: "Users", to: "/settings/users" }, { label: "Create User" }]} />
      <UserForm />
    </PageContainer>
  );
}
