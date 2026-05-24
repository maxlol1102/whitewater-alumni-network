import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type DashboardStats = {
  totalAlumni: number;
  mentorCount: number;
  campaignsSent: number;
  surveyResponses: number;
  byYear: { year: string; count: number }[];
  byIndustry: { name: string; value: number }[];
  topEmployers: { name: string; count: number }[];
  topSkills: { name: string; count: number }[];
};

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<DashboardStats> => {
    const [{ data: alumni, error: aerr }, { count: sent }, { count: responses }] =
      await Promise.all([
        supabaseAdmin
          .from("alumni")
          .select(
            "graduation_year, company, industry, technical_skills, mentorship_interest, archived",
          )
          .eq("archived", false),
        supabaseAdmin
          .from("campaigns")
          .select("*", { count: "exact", head: true })
          .eq("status", "sent"),
        supabaseAdmin
          .from("survey_responses")
          .select("*", { count: "exact", head: true }),
      ]);

    if (aerr) throw new Error(aerr.message);
    const rows = alumni ?? [];

    const totalAlumni = rows.length;
    const mentorCount = rows.filter((r) => r.mentorship_interest).length;

    const byYearMap = new Map<number, number>();
    const byIndustryMap = new Map<string, number>();
    const employerMap = new Map<string, number>();
    const skillMap = new Map<string, number>();

    for (const r of rows) {
      if (r.graduation_year != null) {
        byYearMap.set(r.graduation_year, (byYearMap.get(r.graduation_year) ?? 0) + 1);
      }
      if (r.industry) {
        byIndustryMap.set(r.industry, (byIndustryMap.get(r.industry) ?? 0) + 1);
      }
      if (r.company) {
        employerMap.set(r.company, (employerMap.get(r.company) ?? 0) + 1);
      }
      for (const s of r.technical_skills ?? []) {
        skillMap.set(s, (skillMap.get(s) ?? 0) + 1);
      }
    }

    const byYear = Array.from(byYearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, count]) => ({ year: String(year), count }));

    const byIndustry = Array.from(byIndustryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const topEmployers = Array.from(employerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topSkills = Array.from(skillMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return {
      totalAlumni,
      mentorCount,
      campaignsSent: sent ?? 0,
      surveyResponses: responses ?? 0,
      byYear,
      byIndustry,
      topEmployers,
      topSkills,
    };
  });
