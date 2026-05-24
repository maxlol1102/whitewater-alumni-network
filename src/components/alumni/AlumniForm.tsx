import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { PageSection } from "@/components/layout/Page";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItemLayout } from "@/components/ui/form";
import { MENTOR_CATEGORIES, MENTOR_CATEGORY_LABELS } from "@/mocks";
import { createAlumni, updateAlumni, type AlumniRow } from "@/lib/alumni.functions";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const ALUMNI_FORM_ID = "alumni-form";

const schema = z.object({
  full_name: z.string().min(1, "Required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().optional().or(z.literal("")),
  linkedin_url: z
    .string()
    .refine(
      (v) =>
        !v || v.startsWith("https://linkedin.com/") || v.startsWith("https://www.linkedin.com/"),
      "LinkedIn URL must start with https://linkedin.com/",
    )
    .optional()
    .or(z.literal("")),
  graduation_year: z.coerce
    .number()
    .min(1950)
    .max(currentYear + 5)
    .optional(),
  degree_program: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  job_title: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  technical_skills: z.array(z.string()),
  mentorship_interest: z.boolean(),
  mentorship_categories: z.array(z.string()),
  notes: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export function AlumniForm({ mode, initial }: { mode: "create" | "edit"; initial?: AlumniRow }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [skillInput, setSkillInput] = useState("");

  const create = useServerFn(createAlumni);
  const update = useServerFn(updateAlumni);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initial?.full_name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      linkedin_url: initial?.linkedin_url ?? "",
      graduation_year: initial?.graduation_year ?? undefined,
      degree_program: initial?.degree_program ?? "",
      company: initial?.company ?? "",
      job_title: initial?.job_title ?? "",
      industry: initial?.industry ?? "",
      location: initial?.location ?? "",
      technical_skills: initial?.technical_skills ?? [],
      mentorship_interest: initial?.mentorship_interest ?? false,
      mentorship_categories: initial?.mentorship_categories ?? [],
      notes: initial?.notes ?? "",
    },
  });

  const { isDirty } = form.formState;
  const mentorOn = form.watch("mentorship_interest");
  const skills = form.watch("technical_skills");

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload = {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        linkedin_url: values.linkedin_url || null,
        graduation_year: values.graduation_year ?? null,
        degree_program: values.degree_program || null,
        company: values.company || null,
        job_title: values.job_title || null,
        industry: values.industry || null,
        location: values.location || null,
        technical_skills: values.technical_skills,
        mentorship_interest: values.mentorship_interest,
        mentorship_categories: values.mentorship_interest ? values.mentorship_categories : [],
        tags: initial?.tags ?? [],
        notes: values.notes || null,
      };

      if (mode === "create") {
        return await create({ data: payload });
      }

      return await update({ data: { ...payload, id: initial!.id } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Alumni created." : "Alumni updated.");
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
      navigate({ to: "/alumni" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(values: FormData) {
    mutation.mutate(values);
  }

  function setSkills(next: string[]) {
    form.setValue("technical_skills", next, { shouldDirty: true, shouldValidate: true });
  }

  function addSkill() {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setSkillInput("");
  }

  return (
    <Form {...form}>
      <form id={ALUMNI_FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
        <PageSection>
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle>{mode === "create" ? "Alumni profile" : "Profile details"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FormSection title="Basic info">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Full name"
                      description="The name shown across alumni records."
                      required
                    >
                      <FormControl>
                        <Input {...field} />
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
                      description="Use the alumni's preferred contact email."
                      required
                    >
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Phone"
                      description="Optional direct contact number."
                    >
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="LinkedIn URL"
                      description="Must start with linkedin.com."
                    >
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/name" {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </FormSection>

              <FormSection title="Academic">
                <FormField
                  control={form.control}
                  name="graduation_year"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Graduation year"
                      description="Graduation year or expected year."
                    >
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="degree_program"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Degree program"
                      description="Program, major, or track."
                    >
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </FormSection>

              <FormSection title="Career">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Company"
                      description="Current organization, if known."
                    >
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Job title"
                      description="Current role or position."
                    >
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Industry"
                      description="Career field or area of work."
                    >
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Location"
                      description="City, state, or remote region."
                    >
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </FormSection>

              <FormSection title="Mentorship">
                <FormField
                  control={form.control}
                  name="technical_skills"
                  render={() => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Technical skills"
                      description="Add searchable skills one at a time."
                    >
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSkill();
                              }
                            }}
                            placeholder="Type a skill and press Enter"
                          />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={addSkill}>
                          Add
                        </Button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="gap-1">
                              {skill}
                              <button
                                type="button"
                                aria-label={`Remove ${skill}`}
                                onClick={() => setSkills(skills.filter((item) => item !== skill))}
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mentorship_interest"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Mentorship interest"
                      description="Let students know this alumni can help."
                    >
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                {mentorOn && (
                  <FormField
                    control={form.control}
                    name="mentorship_categories"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Mentorship categories"
                        description="Choose the ways they can support students."
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          {MENTOR_CATEGORIES.map((category) => (
                            <label key={category} className="flex items-center gap-2 text-sm">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(category)}
                                  onCheckedChange={(checked) =>
                                    field.onChange(
                                      checked
                                        ? [...field.value, category]
                                        : field.value.filter((item) => item !== category),
                                    )
                                  }
                                />
                              </FormControl>
                              {MENTOR_CATEGORY_LABELS[category]}
                            </label>
                          ))}
                        </div>
                      </FormItemLayout>
                    )}
                  />
                )}
              </FormSection>

              <FormSection title="Notes">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Notes"
                      description="Internal notes for department staff."
                    >
                      <FormControl>
                        <Textarea rows={5} {...field} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </FormSection>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t border-border/70 pt-6">
              {isDirty && (
                <Button type="button" variant="outline" onClick={() => navigate({ to: "/alumni" })}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                form={ALUMNI_FORM_ID}
                disabled={!isDirty}
                loading={mutation.isPending}
              >
                {mode === "create" ? "Create alumni" : "Save changes"}
              </Button>
            </CardFooter>
          </Card>
        </PageSection>
      </form>
    </Form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="border-b border-border/70 bg-muted/20 px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      {children}
    </section>
  );
}
