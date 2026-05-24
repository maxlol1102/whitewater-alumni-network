import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageSection } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItemLayout } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserCategory, UserStatus } from "@/mocks";
import { inviteUser } from "@/lib/users.functions";
import { toast } from "sonner";

const USER_FORM_ID = "user-form";

const schema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  email: z.string().email("Enter a valid email."),
  user_category: z.enum(["faculty", "student"]),
  status: z.enum(["invited", "active", "disabled"]),
});

export type UserPayload = {
  full_name: string;
  email: string;
  user_category: UserCategory;
  status: Extract<UserStatus, "invited" | "active" | "disabled">;
};

export function UserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const invite = useServerFn(inviteUser);

  const form = useForm<UserPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      user_category: "faculty",
      status: "invited",
    },
  });

  const { isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (payload: UserPayload) =>
      invite({
        data: {
          ...payload,
          full_name: payload.full_name.trim(),
          email: payload.email.trim().toLowerCase(),
        },
      }),
    onSuccess: (_data, payload) => {
      toast.success(
        payload.status === "invited"
          ? `Invitation sent to ${payload.email}.`
          : `User ${payload.email} created.`,
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({ to: "/settings/users" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Form {...form}>
      <form id={USER_FORM_ID} onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <PageSection>
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle>User access</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Full name"
                    description="Name shown in admin records."
                    required
                  >
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Email"
                    description="Use a university-approved email address."
                    required
                  >
                    <FormControl>
                      <Input type="email" placeholder="jane@uww.edu" {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="user_category"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="User category"
                    description="Faculty and student users share the same non-admin access."
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Access state"
                    description="Invited sends an email. Active creates immediate access."
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t border-border/70 pt-6">
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/settings/users" })}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                form={USER_FORM_ID}
                disabled={!isDirty}
                loading={mutation.isPending}
              >
                Create User
              </Button>
            </CardFooter>
          </Card>
        </PageSection>
      </form>
    </Form>
  );
}
