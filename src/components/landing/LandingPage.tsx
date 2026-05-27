import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Search,
  ShieldCheck,
  Handshake,
  BarChart3,
  Users,
  Database,
  FileDown,
  Send,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const viewport = { once: true, amount: 0.12 };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const softScale: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ─── HERO (dark purple) ─────────────────────────────────────────── */}
      <div
        className="relative"
        style={{ background: "linear-gradient(155deg, #1e0838 0%, #2e1260 55%, #150828 100%)" }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[360px] w-[900px] -translate-x-1/2 rounded-full bg-[#582C83] opacity-30 blur-[140px]" />
          <div className="absolute right-[8%] top-[30%] h-[240px] w-[240px] rounded-full bg-[#CFB87C] opacity-[0.07] blur-[80px]" />
        </div>
        {/* Dot-grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:30px_30px]" />

        {/* Header */}
        <motion.header
          className="relative z-30 mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img
              src="/uw-whitewater-logo.png"
              alt="University of Wisconsin Whitewater"
              className="h-auto w-[148px] brightness-0 invert sm:w-[175px]"
            />
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <span className="hidden text-xs font-semibold leading-tight text-white/55 sm:block">
              CS Alumni Network
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="default"
              className="hidden h-10 px-5 text-white/75 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="default"
              className="h-10 bg-[#CFB87C] px-5 font-semibold text-[#1a0535] hover:bg-[#d8c87e]"
            >
              <a href="mailto:?subject=UW-Whitewater%20CS%20Alumni%20Network%20Access">
                Request access
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </div>
        </motion.header>

        {/* Hero text */}
        <motion.div
          className="relative mx-auto max-w-5xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-20"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-medium text-white/70"
            variants={fadeUp}
          >
            <ShieldCheck className="size-3.5 text-[#CFB87C]" />
            University and faculty only
          </motion.div>

          <motion.h1
            className="mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]"
            variants={fadeUp}
          >
            One place for the network <span className="text-[#CFB87C]">behind every student.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-lg text-lg leading-8 text-white/55"
            variants={fadeUp}
          >
            Keep alumni records, mentorship signals, and outreach in one faculty-managed workspace —
            not scattered across inboxes and old spreadsheets.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            variants={fadeUp}
          >
            <Button
              asChild
              size="lg"
              className="border border-white/15 bg-white/10 px-8 text-white hover:bg-white/18 hover:text-white"
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-[#CFB87C] px-8 font-semibold text-[#1a0535] hover:bg-[#d8c87e]"
            >
              <a href="mailto:?subject=UW-Whitewater%20CS%20Alumni%20Network%20Access">
                Request access
              </a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Hero app mock */}
        <motion.div
          className="relative mx-auto max-w-5xl px-5 sm:px-8"
          initial={{ opacity: 0, y: 48, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="origin-bottom [transform:perspective(1400px)_rotateX(7deg)]">
            <HeroAppMock />
          </div>
        </motion.div>
      </div>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <motion.section
        className="relative border-t border-border bg-muted/30 px-5 py-24 sm:px-8"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <div className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} className="mb-14 text-center">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              From scattered records to an organized network.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
              Three steps. No IT ticket required. No public data, ever.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <WorkflowCard
              step="01"
              icon={<FileDown className="size-5 text-primary" />}
              iconBg="bg-primary/10"
              title="Capture your alumni"
              description="Import records from spreadsheets, update career outcomes, and build a faculty-managed database that actually stays current."
              variants={softScale}
            >
              <ImportMock />
            </WorkflowCard>

            <WorkflowCard
              step="02"
              icon={<Send className="size-5 text-sky-600" />}
              iconBg="bg-sky-500/10"
              title="Reach your network"
              description="Send targeted email campaigns and outcome surveys. See who opens, who responds, and which alumni stay engaged."
              variants={softScale}
            >
              <ReachMock />
            </WorkflowCard>

            <WorkflowCard
              step="03"
              icon={<GraduationCap className="size-5 text-amber-600" />}
              iconBg="bg-amber-500/10"
              title="Support your students"
              description="Match students with alumni who've been exactly where they are. Faculty stay in control of every connection."
              variants={softScale}
            >
              <SupportMock />
            </WorkflowCard>
          </div>
        </div>
      </motion.section>

      {/* ─── FEATURE BENTO ──────────────────────────────────────────────── */}
      <motion.section
        className="relative border-t border-border bg-background px-5 py-24 sm:px-8"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <div className="relative mx-auto max-w-6xl">
          <motion.div variants={fadeUp} className="mb-14">
            <p className="text-sm font-semibold text-primary">What's inside</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
              Built for how departments actually work.
            </h2>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              Every tool to manage alumni relationships. No SaaS budget, no IT ticket, no public
              profile.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureCard
              className="md:col-span-2"
              icon={<Users className="size-[18px] text-primary" />}
              iconBg="bg-primary/10"
              title="Alumni Directory"
              description="Search and filter the full network by graduation year, employer, skill, or industry. Every record, faculty-approved."
              variants={softScale}
            >
              <AlumniDirectoryMock />
            </FeatureCard>

            <FeatureCard
              icon={<Mail className="size-[18px] text-sky-600" />}
              iconBg="bg-sky-500/10"
              title="Email Campaigns"
              description="Send targeted outreach to the right alumni at the right time, with open-rate tracking built in."
              variants={softScale}
            >
              <CampaignMock />
            </FeatureCard>

            <FeatureCard
              icon={<BarChart3 className="size-[18px] text-emerald-600" />}
              iconBg="bg-emerald-500/10"
              title="Survey Tracking"
              description="Unique per-recipient links with first-open detection and response tracking — no login required for alumni."
              variants={softScale}
            >
              <SurveyMock />
            </FeatureCard>

            <FeatureCard
              icon={<Handshake className="size-[18px] text-amber-600" />}
              iconBg="bg-amber-500/10"
              title="Mentorship"
              description="Faculty-curated mentor profiles with availability signals. No public directory — invite only."
              variants={softScale}
            >
              <MentorshipMock />
            </FeatureCard>

            <FeatureCard
              icon={<Database className="size-[18px] text-violet-600" />}
              iconBg="bg-violet-500/10"
              title="Groups"
              description="Organize alumni into cohorts for campaigns, reporting, and audience filtering — in seconds."
              variants={softScale}
            >
              <GroupsMock />
            </FeatureCard>
          </div>
        </div>
      </motion.section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <motion.section
        className="border-t border-border bg-muted/30 px-5 py-24 sm:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="relative overflow-hidden rounded-3xl bg-[#1e0838] px-8 py-16 sm:px-14 sm:py-20"
            style={{ background: "linear-gradient(135deg, #1e0838 0%, #2e1260 60%, #150828 100%)" }}
          >
            {/* Dot grid */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
            />
            {/* Glows */}
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#582C83] opacity-25 blur-3xl" />
            <div className="absolute -bottom-16 left-1/3 size-64 rounded-full bg-[#CFB87C] opacity-10 blur-3xl" />

            <div className="relative grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
              {/* Left */}
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-white/65">
                  <ShieldCheck className="size-3.5 text-[#CFB87C]" />
                  Closed network · No public profiles
                </div>
                <h2 className="mt-5 max-w-lg text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Your alumni network, organized for good.
                </h2>
                <p className="mt-4 max-w-md text-base leading-7 text-white/60">
                  Request access and a faculty admin sets you up in minutes. No alumni logins
                  required. No public data. No complexity.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white px-8 text-[#1a0535] hover:bg-white/92 font-semibold"
                  >
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="border border-white/20 bg-white/10 px-8 text-white hover:bg-white/18 hover:text-white"
                  >
                    <a href="mailto:?subject=UW-Whitewater%20CS%20Alumni%20Network%20Access">
                      Request access
                      <ArrowRight className="size-4" />
                    </a>
                  </Button>
                </div>
                <p className="mt-5 text-xs text-white/35">
                  Access is managed by the UW-Whitewater CS Department.
                </p>
              </motion.div>

              {/* Right — access requirements card */}
              <motion.div variants={softScale} className="lg:w-72">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/6 backdrop-blur-sm">
                  <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                      Access requirements
                    </p>
                  </div>
                  <div className="divide-y divide-white/8">
                    {[
                      { label: "University account", note: "uww.edu email" },
                      { label: "Faculty or staff role", note: "Not public" },
                      { label: "Admin approval", note: "One-time setup" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between px-5 py-3.5"
                      >
                        <span className="text-sm font-medium text-white/85">{item.label}</span>
                        <span className="rounded-full bg-[#CFB87C]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#CFB87C]">
                          {item.note}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/50">System active · CS Department</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-background px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <img
            src="/uw-whitewater-logo.png"
            alt="University of Wisconsin Whitewater"
            className="h-auto w-[140px]"
          />
          <p className="text-sm text-muted-foreground">
            Invitation-only. Faculty-approved. Department-managed.
          </p>
        </div>
      </footer>
    </main>
  );
}

// ─── Workflow card shell ──────────────────────────────────────────────────────

function WorkflowCard({
  step,
  icon,
  iconBg,
  title,
  description,
  children,
  variants,
}: {
  step: string;
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children: ReactNode;
  variants?: Variants;
}) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
      variants={variants}
    >
      <div className="p-7 pb-4">
        <div className="flex items-start justify-between">
          <div className={`grid size-10 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
          <span className="text-4xl font-black text-foreground/[0.06] tabular-nums">{step}</span>
        </div>
        <h3 className="mt-4 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="relative px-5 pb-0">
        <div className="overflow-hidden rounded-t-xl border border-border bg-muted/20">
          {children}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-5 right-5 h-20 rounded-b-xl bg-gradient-to-t from-background to-transparent" />
      </div>
    </motion.div>
  );
}

// ─── Feature card shell ───────────────────────────────────────────────────────

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  children,
  className,
  variants,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-border bg-background ${className ?? ""}`}
      variants={variants}
    >
      <div className="p-6 pb-4">
        <div className={`grid size-9 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
        <h3 className="mt-4 text-lg font-bold">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="relative px-5 pb-0">
        <div className="overflow-hidden rounded-t-xl border border-border bg-muted/20">
          {children}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-5 right-5 h-24 rounded-b-xl bg-gradient-to-t from-background to-transparent" />
      </div>
    </motion.div>
  );
}

// ─── Hero app mock ────────────────────────────────────────────────────────────

function HeroAppMock() {
  return (
    <div className="overflow-hidden rounded-t-xl border border-white/12 bg-[#0d0520] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-white/15" />
          <div className="size-3 rounded-full bg-white/15" />
          <div className="size-3 rounded-full bg-white/15" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded bg-white/8 px-4 py-1 text-xs text-white/30">
          <Search className="size-3" />
          uww-alumni-network.edu
        </div>
      </div>

      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-white/8 bg-[#0a0318] p-3 sm:block">
          <div className="mb-4 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/30">
              Main menu
            </div>
          </div>
          {[
            { label: "Dashboard", active: false },
            { label: "Alumni", active: true },
            { label: "Campaigns", active: false },
            { label: "Mentorship", active: false },
            { label: "Surveys", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`mb-1 rounded-lg px-3 py-2 text-xs font-medium ${
                item.active ? "bg-[#582C83]/60 text-white" : "text-white/35"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="flex-1 p-5">
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Alumni", value: "499", color: "text-violet-400" },
              { label: "Mentors", value: "42", color: "text-amber-400" },
              { label: "Campaigns", value: "18", color: "text-sky-400" },
              { label: "Responses", value: "1.2k", color: "text-emerald-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/8 bg-white/5 p-3">
                <div className="text-[10px] text-white/35">{stat.label}</div>
                <div className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="mb-2 text-[11px] font-semibold text-white/35">Alumni · 499 total</div>
            {[
              {
                initials: "JK",
                name: "Jordan Kim",
                role: "Software Engineer · Google",
                year: "2022",
                mentor: true,
              },
              {
                initials: "AS",
                name: "Aisha Singh",
                role: "Product Manager · Stripe",
                year: "2021",
                mentor: false,
              },
              {
                initials: "MC",
                name: "Marcus Chen",
                role: "ML Engineer · OpenAI",
                year: "2023",
                mentor: true,
              },
              {
                initials: "PR",
                name: "Priya Rao",
                role: "UX Designer · Figma",
                year: "2022",
                mentor: false,
              },
            ].map((a) => (
              <div
                key={a.name}
                className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2.5"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#582C83]/60 text-[10px] font-bold text-white">
                  {a.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">{a.name}</div>
                  <div className="text-[10px] text-white/35">
                    {a.role} · {a.year}
                  </div>
                </div>
                {a.mentor && (
                  <span className="shrink-0 rounded-full bg-[#CFB87C]/15 px-2 py-0.5 text-[9px] font-semibold text-[#CFB87C]">
                    mentor
                  </span>
                )}
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                  active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workflow mocks ───────────────────────────────────────────────────────────

function ImportMock() {
  const rows = [
    { name: "Jordan Kim", email: "jkim@gmail.com", year: "2022", role: "Software Engineer" },
    { name: "Aisha Singh", email: "asingh@me.com", year: "2021", role: "Product Manager" },
    { name: "Marcus Chen", email: "mchen@pm.me", year: "2023", role: "ML Engineer" },
    { name: "Lisa Torres", email: "ltorres@hey.com", year: "2020", role: "Eng Manager" },
  ];
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
        <span className="text-[11px] font-semibold text-muted-foreground">
          alumni_export.csv — 4 rows ready
        </span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
          Ready to import
        </span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 bg-background px-4 py-2.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {r.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold">{r.name}</div>
              <div className="text-[10px] text-muted-foreground">{r.email}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-medium">{r.role}</div>
              <div className="text-[10px] text-muted-foreground">{r.year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReachMock() {
  return (
    <div className="p-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="mb-1 text-xs font-semibold">Spring 2025 Outreach</div>
        <div className="mb-4 text-[10px] text-muted-foreground">
          Email campaign · Sending to 124 alumni
        </div>
        <div className="space-y-2">
          {[
            { label: "Sent", val: 124, pct: 100, color: "bg-primary" },
            { label: "Opened", val: 89, pct: 72, color: "bg-sky-500" },
            { label: "Clicked", val: 41, pct: 33, color: "bg-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-[10px] text-muted-foreground">{s.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right text-[10px] font-bold tabular-nums">
                {s.val}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {[
          { label: "Class of 2024", count: 67 },
          { label: "Tech companies", count: 44 },
        ].map((f) => (
          <div
            key={f.label}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-center"
          >
            <div className="text-sm font-bold">{f.count}</div>
            <div className="text-[10px] text-muted-foreground">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportMock() {
  return (
    <div className="p-4">
      <div className="mb-3 rounded-xl border border-border bg-background p-4">
        <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Student need
        </div>
        <p className="text-xs font-medium leading-5">
          "Looking for advice on breaking into ML engineering after graduation."
        </p>
      </div>
      <div className="mb-1.5 text-[10px] font-semibold text-muted-foreground">
        2 matched mentors
      </div>
      {[
        {
          initials: "MC",
          name: "Marcus Chen",
          role: "ML Engineer · OpenAI",
          year: "2023",
          match: "98%",
        },
        {
          initials: "JK",
          name: "Jordan Kim",
          role: "Software Engineer · Google",
          year: "2022",
          match: "84%",
        },
      ].map((m) => (
        <div
          key={m.name}
          className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-background p-3"
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-700">
            {m.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold">{m.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {m.role} · {m.year}
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            {m.match}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Feature mocks ────────────────────────────────────────────────────────────

function AlumniDirectoryMock() {
  return (
    <div>
      <div className="border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
          <Search className="size-3 shrink-0" />
          Search by name, employer, or skill...
        </div>
        <div className="mt-2 flex gap-1.5">
          {["Class of 2024", "Mentors", "Tech"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {[
          { initials: "JK", name: "Jordan Kim", role: "Google · 2022", mentor: true },
          { initials: "AS", name: "Aisha Singh", role: "Stripe · 2021", mentor: false },
          { initials: "MC", name: "Marcus Chen", role: "OpenAI · 2023", mentor: true },
          { initials: "PR", name: "Priya Rao", role: "Figma · 2022", mentor: false },
          { initials: "LT", name: "Lisa Torres", role: "Stripe · 2020", mentor: false },
        ].map((a) => (
          <div key={a.name} className="flex items-center gap-3 bg-background px-4 py-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {a.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold">{a.name}</div>
              <div className="text-[10px] text-muted-foreground">{a.role}</div>
            </div>
            {a.mentor && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-600">
                mentor
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignMock() {
  return (
    <div className="p-4">
      <div className="mb-3 text-[11px] font-semibold text-muted-foreground">Recent campaigns</div>
      <div className="space-y-2.5">
        {[
          { name: "Spring 2025 Outreach", sent: 124, opened: 89, badge: "sent" },
          { name: "Mentorship Invite", sent: 42, opened: 38, badge: "sent" },
          { name: "Career Survey 2025", sent: 0, opened: 0, badge: "draft" },
          { name: "Alumni Day Notice", sent: 67, opened: 51, badge: "sent" },
        ].map((c) => (
          <div key={c.name} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{c.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  c.badge === "sent"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.badge}
              </span>
            </div>
            {c.sent > 0 && (
              <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                <span>
                  <strong className="text-foreground">{c.sent}</strong> sent
                </span>
                <span>
                  <strong className="text-foreground">{c.opened}</strong> opened
                </span>
                <span>
                  <strong className="text-sky-600">{Math.round((c.opened / c.sent) * 100)}%</strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SurveyMock() {
  return (
    <div className="p-4">
      <div className="mb-1 text-xs font-semibold">Career Outcomes 2025</div>
      <div className="mb-4 text-[10px] text-muted-foreground">124 recipients</div>
      <div className="space-y-3.5">
        {[
          { label: "Sent", value: 124, max: 124, color: "bg-primary" },
          { label: "Opened", value: 89, max: 124, color: "bg-sky-500" },
          { label: "Responded", value: 61, max: 124, color: "bg-emerald-500" },
        ].map((s) => (
          <div key={s.label}>
            <div className="mb-1.5 flex justify-between text-[10px]">
              <span className="font-medium text-muted-foreground">{s.label}</span>
              <span className="font-bold">{s.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className={`h-full rounded-full ${s.color}`}
                style={{ width: `${(s.value / s.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-black/[0.04] p-2.5">
        <div className="text-[9px] font-medium text-muted-foreground">
          Unique link per recipient
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px]">uww.edu/survey/f3a8b2c1…</div>
      </div>
    </div>
  );
}

function MentorshipMock() {
  return (
    <div className="p-4">
      <div className="mb-3 text-[11px] font-semibold text-muted-foreground">42 active mentors</div>
      <div className="space-y-2">
        {[
          {
            initials: "JK",
            name: "Jordan Kim",
            role: "Software Engineer · Google",
            available: true,
          },
          { initials: "MC", name: "Marcus Chen", role: "ML Engineer · OpenAI", available: true },
          { initials: "LT", name: "Lisa Torres", role: "Eng Manager · Stripe", available: false },
          { initials: "AS", name: "Aisha Singh", role: "Product · Figma", available: true },
        ].map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-700">
              {m.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold">{m.name}</div>
              <div className="text-[10px] text-muted-foreground">{m.role}</div>
            </div>
            <div
              className={`size-2 shrink-0 rounded-full ${m.available ? "bg-emerald-500" : "bg-muted-foreground/25"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupsMock() {
  return (
    <div className="p-4">
      <div className="mb-3 text-[11px] font-semibold text-muted-foreground">5 groups</div>
      <div className="space-y-2">
        {[
          { name: "Tech companies", count: 187, color: "bg-violet-500/10 text-violet-600" },
          { name: "Class of 2024", count: 67, color: "bg-sky-500/10 text-sky-600" },
          { name: "Mentors", count: 42, color: "bg-amber-500/10 text-amber-600" },
          { name: "Local employers", count: 34, color: "bg-emerald-500/10 text-emerald-600" },
          { name: "Graduate school", count: 21, color: "bg-primary/10 text-primary" },
        ].map((g) => (
          <div
            key={g.name}
            className="flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5"
          >
            <span className="text-xs font-semibold">{g.name}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${g.color}`}>
              {g.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
