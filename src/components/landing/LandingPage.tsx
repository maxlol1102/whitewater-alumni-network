import { Link } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Handshake, LockKeyhole, Mail, Search, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

const audience = ["University users", "Faculty", "Department admins", "Invited mentors"];

const workflow = [
  {
    title: "Capture",
    description:
      "Keep alumni records, survey updates, and career signals in one faculty-owned place.",
    icon: Search,
  },
  {
    title: "Curate",
    description:
      "Let faculty decide which contacts, opportunities, and mentorship paths are trusted.",
    icon: ShieldCheck,
  },
  {
    title: "Connect",
    description:
      "Move from a student need to the right alumni context without digging through old files.",
    icon: Handshake,
  },
];

const networkStats = [
  { value: "1", label: "faculty-owned source of truth" },
  { value: "4", label: "approved campus user groups" },
  { value: "100%", label: "university access model" },
  { value: "0", label: "open public profiles" },
];

const viewport = { once: true, amount: 0.24 };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const softScale: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export function LandingPage() {
  return (
    <main className="min-h-screen bg-surface-75 text-foreground">
      <motion.header
        className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Link
            to="/"
            aria-label="UW-Whitewater Computer Science Alumni Network"
            className="flex shrink-0 items-center gap-3"
          >
            <img
              src="/uw-whitewater-logo.png"
              alt="University of Wisconsin Whitewater"
              className="h-auto w-[150px] sm:w-[184px]"
            />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden max-w-[120px] text-xs font-semibold leading-tight text-foreground/75 sm:block">
              CS Alumni Network
            </span>
          </Link>

          <nav className="ml-8 hidden flex-1 items-center gap-8 text-sm font-medium text-foreground/65 md:flex">
            <a href="#why" className="transition-colors hover:text-foreground">
              Why
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              Workflow
            </a>
            <a href="#access" className="transition-colors hover:text-foreground">
              Access
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="default"
              className="hidden h-11 px-5 sm:inline-flex"
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="default" className="h-11 px-6">
              <a href="#access">
                Sign up
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.section
        className="bg-background px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-75 px-4 py-2 text-sm text-muted-foreground shadow-sm"
            variants={fadeUp}
          >
            <ShieldCheck className="size-4 text-primary" />
            University users and faculty only
          </motion.div>

          <motion.h1
            className="mx-auto mt-8 max-w-5xl text-5xl font-semibold leading-[0.98] sm:text-7xl lg:text-8xl"
            variants={fadeUp}
          >
            One place for the network behind every student.
          </motion.h1>

          <motion.p
            className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground"
            variants={fadeUp}
          >
            Faculty-approved alumni context, mentorship signals, and department memory.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            variants={fadeUp}
          >
            <Button asChild size="lg">
              <a href="#access">Sign up</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Log in</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div className="mx-auto mt-16 max-w-4xl" variants={softScale}>
          <HeroVisual />
        </motion.div>

        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-semibold text-muted-foreground"
          variants={stagger}
        >
          {audience.map((item) => (
            <motion.span key={item} variants={fadeUp}>
              {item}
            </motion.span>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        id="why"
        className="border-t border-border/70 bg-surface-75"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
          <motion.div className="mx-auto max-w-4xl text-center" variants={fadeUp}>
            <p className="text-sm font-semibold text-primary">Why it exists</p>
            <h2 className="mt-3 text-5xl font-semibold leading-[1.02] sm:text-6xl">
              The network already exists. It just needs a place to live.
            </h2>
          </motion.div>

          <motion.div className="mt-12 grid gap-5 lg:grid-cols-2" variants={stagger}>
            <StoryPanel
              title="Less institutional memory lost"
              description="Faculty should not have to remember which spreadsheet, inbox thread, or old survey holds the answer."
              visual={<MemoryVisual />}
            />
            <StoryPanel
              title="More student support found"
              description="When a student needs direction, faculty can quickly see which alumni paths are relevant and trusted."
              visual={<SupportVisual />}
            />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="workflow"
        className="border-t border-border/70 bg-background"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
          <motion.div className="mx-auto max-w-4xl text-center" variants={fadeUp}>
            <div>
              <p className="text-sm font-semibold text-primary">How it works</p>
              <h2 className="mt-3 text-5xl font-semibold leading-[1.02] sm:text-6xl">
                Three moves. One faculty workflow.
              </h2>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              The product is not trying to become a social network. It helps university users manage
              a trusted department network with clarity and control.
            </p>
          </motion.div>

          <motion.div className="mt-12 grid gap-5 lg:grid-cols-3" variants={stagger}>
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  className="overflow-hidden rounded-lg bg-surface-100"
                  variants={softScale}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="flex min-h-[270px] items-center justify-center bg-[linear-gradient(135deg,var(--surface-75),var(--surface-200))] p-8">
                    <div className="grid size-28 place-items-center rounded-lg bg-background shadow-xl shadow-foreground/5 ring-1 ring-border">
                      <Icon className="size-10 text-primary" />
                    </div>
                  </div>
                  <div className="px-7 py-7">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-lg leading-6 text-foreground">{item.description}</p>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="border-t border-border/70 bg-surface-75"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
          <motion.div className="mx-auto max-w-4xl text-center" variants={fadeUp}>
            <p className="text-sm font-semibold text-primary">Campus backbone</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-6xl">
              The quiet layer behind student opportunity.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A simple operating layer for faculty-approved alumni context, access, and student
              support.
            </p>
          </motion.div>

          <motion.div
            className="mt-12 grid overflow-hidden rounded-lg border border-border bg-background md:grid-cols-4"
            variants={stagger}
          >
            {networkStats.map((stat) => (
              <motion.div
                key={stat.label}
                className="border-t border-border px-5 py-8 text-center first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0"
                variants={fadeUp}
              >
                <div className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mx-auto mt-3 max-w-40 text-sm leading-5 text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="relative mt-5 h-[320px] overflow-hidden rounded-lg border border-border bg-background"
            variants={softScale}
          >
            <NetworkGradientVisual />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="border-t border-border/70 bg-surface-100"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={fadeUp}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <motion.div
            className="overflow-hidden rounded-lg bg-background p-8 shadow-sm ring-1 ring-border"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Access model</p>
                <p className="mt-1 text-sm text-muted-foreground">Faculty approved</p>
              </div>
              <LockKeyhole className="size-6 text-primary" />
            </div>
            <div className="mt-8 space-y-3">
              {["University account", "Faculty review", "Department-managed data"].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-lg bg-surface-75 p-4"
                >
                  <span className="text-sm font-medium">{item}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    required
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold text-primary">Trust</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              Access stays with the university.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Alumni information, mentorship workflows, and outcome tracking are for approved
              UW-Whitewater users. Faculty remain the stewards of what gets added, used, and shared.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="access"
        className="border-t border-border/70 bg-surface-75 px-5 py-28 sm:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={softScale}
      >
        <motion.div
          className="mx-auto max-w-6xl rounded-[2rem] bg-primary px-8 py-16 text-center text-primary-foreground sm:px-12"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-semibold text-primary-foreground/75">
            <Mail className="size-4" />
            University access only
          </div>
          <h2 className="mx-auto mt-7 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Log in or request access.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-primary-foreground/75">
            This network is only for approved UW-Whitewater users and faculty.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="px-7">
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-background px-7 text-foreground hover:bg-background/90"
            >
              <a href="mailto:?subject=UW-Whitewater%20CS%20Alumni%20Network%20Access">
                Request access
              </a>
            </Button>
          </div>
        </motion.div>
      </motion.section>

      <motion.footer
        className="px-4 pb-4 pt-4 sm:pt-6"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={fadeUp}
      >
        <div className="relative overflow-hidden rounded-t-[3rem] bg-foreground text-background sm:rounded-t-[4.5rem]">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:28px_28px]"
          />

          <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto mb-16 max-w-4xl text-center">
              <p className="text-sm font-semibold text-background/55">UWW CS Alumni Network</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
                A quieter home for the people behind the program.
              </h2>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <div>
                <img
                  src="/uw-whitewater-logo.png"
                  alt="University of Wisconsin Whitewater"
                  className="h-auto w-[220px] rounded-md bg-background p-3"
                />
                <p className="mt-6 max-w-sm text-sm leading-6 text-background/65">
                  A private Computer Science alumni workspace for approved university users and
                  faculty-led student support.
                </p>
              </div>

              <FooterColumn
                title="Product"
                links={[
                  { label: "Why", href: "#why" },
                  { label: "Workflow", href: "#workflow" },
                  { label: "Access", href: "#access" },
                ]}
              />
              <FooterColumn
                title="For campus"
                links={[
                  { label: "University users", href: "#access" },
                  { label: "Faculty", href: "#workflow" },
                  { label: "Department admins", href: "#access" },
                ]}
              />
              <FooterColumn
                title="Access"
                links={[
                  { label: "Log in", href: "/login" },
                  {
                    label: "Request sign up",
                    href: "mailto:?subject=UW-Whitewater%20CS%20Alumni%20Network%20Access",
                  },
                ]}
              />
            </div>

            <div className="mt-16 flex flex-col justify-between gap-4 border-t border-background/15 pt-6 text-xs text-background/50 sm:flex-row">
              <span>UW-Whitewater Computer Science Alumni Network</span>
              <span>Invitation-only. Faculty-approved. Department-managed.</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-background">{title}</h3>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-background/65 hover:text-background"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function NetworkGradientVisual() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_36%),radial-gradient(circle_at_20%_90%,rgba(244,114,182,0.16),transparent_34%),radial-gradient(circle_at_80%_82%,rgba(139,92,246,0.14),transparent_34%)]" />
      <div className="absolute left-1/2 top-[44%] h-28 w-[70rem] -translate-x-1/2 -rotate-6 rounded-full bg-[linear-gradient(90deg,transparent,rgba(244,114,182,0.18),rgba(244,114,182,0.72),rgba(139,92,246,0.72),rgba(139,92,246,0.16),transparent)] blur-2xl" />
      <div className="absolute left-1/2 top-[52%] h-1 w-[62rem] -translate-x-1/2 -rotate-6 rounded-full bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-55" />
      <div className="absolute left-1/2 top-[61%] h-1 w-[54rem] -translate-x-1/2 rotate-3 rounded-full bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-45" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:88px_88px] opacity-70" />
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-100 p-6 sm:p-8">
      <div className="absolute right-10 top-10 rotate-12 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-warning-foreground shadow-sm">
        faculty view
      </div>
      <div className="absolute bottom-10 left-8 -rotate-6 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm">
        trusted network
      </div>
      <div className="mx-auto max-w-[460px] rounded-lg border border-border bg-background p-5 shadow-xl shadow-foreground/5">
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <Search className="size-4" />
          Search alumni by career, year, skill
        </div>
        <div className="mt-5 space-y-3">
          {["Mentor-ready alumni", "Faculty-approved access", "Career outcomes"].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-lg bg-surface-75 p-3 text-sm"
            >
              <span>{item}</span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                live
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {["2022", "2023", "2024"].map((year, index) => (
            <div key={year} className="rounded-lg border border-border p-3 text-center">
              <div className="text-lg font-semibold">{24 + index * 9}</div>
              <div className="mt-1 text-xs text-muted-foreground">{year}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoryPanel({
  title,
  description,
  visual,
}: {
  title: string;
  description: string;
  visual: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-lg bg-surface-100">
      <div className="flex min-h-[330px] items-center justify-center bg-[linear-gradient(135deg,var(--surface-75),var(--surface-200))] p-8">
        {visual}
      </div>
      <div className="px-7 py-7">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-3 text-lg leading-6 text-foreground">{description}</p>
      </div>
    </article>
  );
}

function MemoryVisual() {
  return (
    <div className="grid w-full max-w-[380px] gap-3">
      {["Spreadsheet", "Inbox thread", "Survey export"].map((label, index) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-lg bg-background p-4 shadow-sm ring-1 ring-border"
          style={{ marginLeft: `${index * 18}px` }}
        >
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">scattered</span>
        </div>
      ))}
    </div>
  );
}

function SupportVisual() {
  return (
    <div className="w-full max-w-[380px] rounded-lg bg-background p-5 shadow-xl shadow-foreground/5 ring-1 ring-border">
      <div className="text-sm font-semibold">Student need</div>
      <p className="mt-1 text-sm text-muted-foreground">Looking for internship interview advice</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          MS
        </div>
        <div>
          <div className="text-sm font-medium">Matched alumni</div>
          <div className="text-xs text-muted-foreground">Software engineer, Class of 2021</div>
        </div>
      </div>
    </div>
  );
}
