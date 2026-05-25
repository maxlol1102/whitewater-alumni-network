import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageSection } from "@/components/layout/Page";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TAG_OPTIONS } from "@/mocks";
import { toast } from "sonner";
import {
  createCampaign,
  updateCampaign,
  previewRecipients,
  type CampaignRow,
} from "@/lib/campaigns.functions";
import { listAlumni } from "@/lib/alumni.functions";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Required"),
  subject: z.string().min(1, "Required"),
  body: z.string().min(1, "Required"),
  tally_form_id: z.string().optional(),
  tally_form_url: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function CampaignForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: CampaignRow;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [campaignType, setCampaignType] = useState<"email" | "survey">(
    initial?.type ?? "email",
  );
  const [mentorOnly, setMentorOnly] = useState(initial?.filter_mentorship_only ?? false);
  const [tags, setTags] = useState<string[]>(initial?.filter_tags ?? []);
  const [years, setYears] = useState<number[]>(initial?.filter_grad_years ?? []);

  const listAlumniFn = useServerFn(listAlumni);
  const { data: alumniData } = useQuery({
    queryKey: ["alumni", "for-campaign-years"],
    queryFn: () => listAlumniFn({ data: {} }),
  });
  const allYears = useMemo(() => {
    const ys = (alumniData?.alumni ?? [])
      .map((a) => a.graduation_year)
      .filter((y): y is number => typeof y === "number");
    return Array.from(new Set(ys)).sort((a, b) => b - a);
  }, [alumniData]);

  const previewFn = useServerFn(previewRecipients);
  const [matched, setMatched] = useState(initial?.recipient_count ?? 0);
  useEffect(() => {
    let cancelled = false;
    previewFn({
      data: { filter_mentorship_only: mentorOnly, filter_tags: tags, filter_grad_years: years },
    })
      .then((r) => {
        if (!cancelled) setMatched(r.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mentorOnly, tags, years, previewFn]);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      subject: initial?.subject ?? "",
      body: initial?.body ?? "",
      tally_form_id: initial?.tally_form_id ?? "",
      tally_form_url: initial?.tally_form_url ?? "",
    },
  });

  const createFn = useServerFn(createCampaign);
  const updateFn = useServerFn(updateCampaign);
  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (campaignType === "survey") {
        if (!values.tally_form_id?.trim()) {
          setError("tally_form_id", { message: "Required for survey campaigns" });
          throw new Error("Tally form ID is required");
        }
        if (!values.tally_form_url?.trim()) {
          setError("tally_form_url", { message: "Required for survey campaigns" });
          throw new Error("Tally form URL is required");
        }
      }
      const payload = {
        name: values.name,
        subject: values.subject,
        body: values.body,
        type: campaignType,
        tally_form_id: campaignType === "survey" ? (values.tally_form_id || null) : null,
        tally_form_url: campaignType === "survey" ? (values.tally_form_url || null) : null,
        filter_mentorship_only: mentorOnly,
        filter_tags: tags,
        filter_grad_years: years,
      };
      if (mode === "edit" && initial) {
        return updateFn({ data: { id: initial.id, ...payload } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(mode === "create" ? "Draft campaign saved" : "Campaign updated");
      navigate({ to: "/campaigns" });
    },
    onError: (e: Error) => {
      if (!e.message.includes("Required")) toast.error(e.message);
    },
  });

  return (
    <PageSection className="max-w-6xl">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Card>
          <CardHeader className="border-b border-border/70">
            <CardTitle>Campaign draft</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {/* Campaign type toggle */}
              <div className="space-y-1.5">
                <Label>Campaign type</Label>
                <div className="flex rounded-md border border-input overflow-hidden w-fit">
                  {(["email", "survey"] as const).map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCampaignType(t)}
                      className={cn(
                        "px-5 py-1.5 text-sm font-medium transition-colors",
                        i > 0 && "border-l border-input",
                        campaignType === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {t === "email" ? "Email" : "Survey"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input {...register("subject")} />
                {errors.subject && (
                  <p className="text-xs text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Email body <span className="text-destructive">*</span>
                </Label>
                {campaignType === "survey" && (
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{"{{survey_link}}"}</code> where you want each recipient's unique survey link to appear.
                  </p>
                )}
                <Textarea rows={14} className="font-mono text-xs" {...register("body")} />
                {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
              </div>

              {/* Survey-only fields */}
              {campaignType === "survey" && (
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-4">
                  <div className="text-sm font-medium">Tally form</div>
                  <div className="space-y-1.5">
                    <Label>
                      Tally form ID <span className="text-destructive">*</span>
                    </Label>
                    <Input placeholder="e.g. wkAlB0" {...register("tally_form_id")} />
                    <p className="text-xs text-muted-foreground">
                      Found in your Tally URL: tally.so/r/<strong>wkAlB0</strong>
                    </p>
                    {errors.tally_form_id && (
                      <p className="text-xs text-destructive">{errors.tally_form_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Tally form URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="https://tally.so/r/wkAlB0"
                      {...register("tally_form_url")}
                    />
                    <p className="text-xs text-muted-foreground">
                      The full URL to your Tally form. Alumni will see it embedded in a branded page.
                    </p>
                    {errors.tally_form_url && (
                      <p className="text-xs text-destructive">{errors.tally_form_url.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card className="bg-muted/20 p-5 shadow-none">
                <div className="font-medium">Audience filters</div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Mentorship only</Label>
                    <Switch checked={mentorOnly} onCheckedChange={setMentorOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tags
                    </Label>
                    <div className="space-y-1">
                      {TAG_OPTIONS.map((t) => (
                        <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={tags.includes(t)}
                            onCheckedChange={(c) =>
                              setTags(c ? [...tags, t] : tags.filter((x) => x !== t))
                            }
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Graduation years
                    </Label>
                    <div className="max-h-40 space-y-1 overflow-auto pr-1">
                      {allYears.length === 0 && (
                        <p className="text-xs text-muted-foreground">No graduation years yet.</p>
                      )}
                      {allYears.map((y) => (
                        <label key={y} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={years.includes(y)}
                            onCheckedChange={(c) =>
                              setYears(c ? [...years, y] : years.filter((x) => x !== y))
                            }
                          />
                          {y}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="bg-accent p-5 shadow-none">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recipients matching filters
                </div>
                <div className="mt-1 text-3xl font-semibold">{matched}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Excludes archived alumni and rows with missing emails.
                </p>
              </Card>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t border-border/70 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/campaigns" })}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save as draft
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageSection>
  );
}
