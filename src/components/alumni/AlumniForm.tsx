import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { MENTOR_CATEGORIES, MENTOR_CATEGORY_LABELS } from "@/mocks";
import { createAlumni, updateAlumni, type AlumniRow } from "@/lib/alumni.functions";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();

const schema = z.object({
  full_name: z.string().min(1, "Required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().optional().or(z.literal("")),
  linkedin_url: z
    .string()
    .refine(
      (v) => !v || v.startsWith("https://linkedin.com/") || v.startsWith("https://www.linkedin.com/"),
      "LinkedIn URL must start with https://linkedin.com/",
    )
    .optional()
    .or(z.literal("")),
  graduation_year: z.coerce.number().min(1950).max(currentYear + 5).optional(),
  degree_program: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  job_title: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  mentorship_interest: z.boolean(),
  mentorship_categories: z.array(z.string()),
  notes: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export function AlumniForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: AlumniRow;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState<string[]>(initial?.technical_skills ?? []);
  const [skillInput, setSkillInput] = useState("");

  const create = useServerFn(createAlumni);
  const update = useServerFn(updateAlumni);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
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
      mentorship_interest: initial?.mentorship_interest ?? false,
      mentorship_categories: initial?.mentorship_categories ?? [],
      notes: initial?.notes ?? "",
    },
  });

  const mentorOn = watch("mentorship_interest");

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
        technical_skills: skills,
        mentorship_interest: values.mentorship_interest,
        mentorship_categories: values.mentorship_interest ? values.mentorship_categories : [],
        tags: initial?.tags ?? [],
        notes: values.notes || null,
      };
      if (mode === "create") {
        return await create({ data: payload });
      } else {
        return await update({ data: { ...payload, id: initial!.id } });
      }
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Alumni created" : "Alumni updated");
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
      navigate({ to: "/alumni" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(values: FormData) {
    mutation.mutate(values);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
      <Section title="Basic Info">
        <Field label="Full name" error={errors.full_name?.message} required>
          <Input {...register("full_name")} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" {...register("email")} />
        </Field>
        <Field label="Phone">
          <Input {...register("phone")} />
        </Field>
        <Field label="LinkedIn URL" error={errors.linkedin_url?.message}>
          <Input placeholder="https://linkedin.com/in/…" {...register("linkedin_url")} />
        </Field>
      </Section>

      <Section title="Academic">
        <Field label="Graduation year" error={errors.graduation_year?.message}>
          <Input type="number" {...register("graduation_year")} />
        </Field>
        <Field label="Degree program">
          <Input {...register("degree_program")} />
        </Field>
      </Section>

      <Section title="Career">
        <Field label="Company">
          <Input {...register("company")} />
        </Field>
        <Field label="Job title">
          <Input {...register("job_title")} />
        </Field>
        <Field label="Industry">
          <Input {...register("industry")} />
        </Field>
        <Field label="Location">
          <Input {...register("location")} />
        </Field>
      </Section>

      <Section title="Skills & Mentorship">
        <Field label="Technical skills">
          <div className="flex gap-2">
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
            <Button type="button" variant="outline" onClick={addSkill}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </Field>
        <Controller
          control={control}
          name="mentorship_interest"
          render={({ field }) => (
            <Field label="Mentorship interest">
              <div className="flex items-center gap-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                <span className="text-sm text-muted-foreground">
                  Available to mentor current students
                </span>
              </div>
            </Field>
          )}
        />
        {mentorOn && (
          <Controller
            control={control}
            name="mentorship_categories"
            render={({ field }) => (
              <Field label="Mentorship categories">
                <div className="grid grid-cols-2 gap-2">
                  {MENTOR_CATEGORIES.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={field.value.includes(c)}
                        onCheckedChange={(v) =>
                          field.onChange(
                            v ? [...field.value, c] : field.value.filter((x) => x !== c),
                          )
                        }
                      />
                      {MENTOR_CATEGORY_LABELS[c]}
                    </label>
                  ))}
                </div>
              </Field>
            )}
          />
        )}
      </Section>

      <Section title="Notes">
        <Field label="Notes">
          <Textarea rows={4} {...register("notes")} />
        </Field>
      </Section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/alumni" })}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving…"
            : mode === "create"
              ? "Create alumni"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="font-medium mb-4">{title}</div>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </Card>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
