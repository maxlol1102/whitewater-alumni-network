import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Users, MessageSquare, BarChart3, ShieldCheck } from "lucide-react";
import { useAuth, isActive } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "UWW CS Alumni — Sign in" },
      { name: "description", content: "Invitation-only alumni network for the UW–Whitewater Computer Science department. Connect, mentor, give back." },
      { property: "og:title", content: "UWW CS Alumni — Sign in" },
      { property: "og:description", content: "Invitation-only alumni network for the UW–Whitewater Computer Science department." },
    ],
  }),
  component: LandingLoginPage,
});

function LandingLoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("Invalid email or password");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">UWW CS Alumni</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Department Network</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#what" className="hover:text-foreground transition-colors">What you can do</a>
            <a href="#access" className="hover:text-foreground transition-colors">Access</a>
          </div>
          <a href="#signin" className="text-sm font-medium text-primary hover:underline underline-offset-4">
            Sign in →
          </a>
        </div>
      </header>

      {/* Hero + sign-in */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 lg:pt-24 pb-16 lg:pb-24 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-start">
        {/* Left — editorial copy */}
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            <span className="text-primary">00</span> · UW–Whitewater · Computer Science
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            A quiet, considered network for{" "}
            <span className="text-primary">CS alumni</span>,{" "}
            <span className="italic font-normal">faculty</span>, and{" "}
            <span className="italic font-normal">students</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Invitation-only. Maintained by the Department. No public registration, no
            algorithmic feed — just the people, the work, and the way forward.
          </p>

          <div className="mt-10 flex items-center gap-6 text-sm">
            <a
              href="#signin"
              className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
            >
              Sign in to continue
              <ArrowRight className="size-4" />
            </a>
            <span className="text-muted-foreground">
              Don't have an account?{" "}
              <span className="text-foreground">Ask your department admin.</span>
            </span>
          </div>

          {/* Stat strip */}
          <div className="mt-14 grid grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            <Stat n="1,240+" label="Alumni" />
            <Stat n="64" label="Mentors" />
            <Stat n="12" label="Active campaigns" />
          </div>
        </div>

        {/* Right — sign-in card */}
        <div id="signin" className="lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card shadow-[0_1px_0_0_var(--border)] overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-border/70">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="text-primary">01</span> · Sign in
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the email associated with your invitation.
              </p>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@uww.edu"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Forgot?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-destructive" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full h-11">
                Sign in
                <ArrowRight className="size-4 ml-1" />
              </Button>

              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Invitation-only · SSO coming soon
              </div>
            </form>
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            By signing in you agree to the department's{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground">acceptable use policy</a>.
          </p>
        </div>
      </section>

      {/* What you can do */}
      <section id="what" className="border-t border-border/60 bg-surface-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="text-primary">02</span> · What you can do
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
            One place for the things the department actually needs.
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            <Feature
              icon={<Users className="size-5" />}
              eyebrow="Alumni"
              title="A living directory"
              body="Search graduates by year, company, role, or expertise. Maintained by the department, not crowdsourced."
            />
            <Feature
              icon={<MessageSquare className="size-5" />}
              eyebrow="Mentorship"
              title="Match students with mentors"
              body="Faculty curate matches. Students get guidance from people who've walked the same path."
            />
            <Feature
              icon={<BarChart3 className="size-5" />}
              eyebrow="Campaigns & Surveys"
              title="Stay close to outcomes"
              body="Run targeted outreach and post-graduation surveys with full audit trails."
            />
          </div>
        </div>
      </section>

      {/* Access */}
      <section id="access" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24 grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="text-primary">03</span> · Access
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Three ways in.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The department admin issues every account. Roles are determined at invitation.
            </p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            <Role tag="Admin" body="Department staff. Manages users, campaigns, surveys, and audit logs." />
            <Role tag="Faculty" body="Reads alumni and runs mentorship; can be promoted by the admin." />
            <Role tag="Student" body="Browses alumni, requests mentors, responds to surveys." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="size-3.5" />
            </div>
            <div className="text-sm text-muted-foreground">
              UW–Whitewater Department of Computer Science
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} · Maintained by the department
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="bg-card p-5">
      <div className="text-2xl font-semibold tracking-tight">{n}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon, eyebrow, title, body,
}: { icon: React.ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <div className="bg-card p-8">
      <div className="size-10 rounded-md bg-accent text-accent-foreground grid place-items-center">
        {icon}
      </div>
      <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Role({ tag, body }: { tag: string; body: string }) {
  return (
    <div className="bg-card p-6">
      <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
        <span className="size-1 rounded-full bg-primary" />
        {tag}
      </div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
