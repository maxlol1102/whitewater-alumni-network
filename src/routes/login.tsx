import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth, isActive } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — UWW CS Alumni" },
      { name: "description", content: "Sign in to the UW–Whitewater Computer Science alumni network. Invitation-only." },
      { property: "og:title", content: "Sign in — UWW CS Alumni" },
      { property: "og:description", content: "Sign in to the UW–Whitewater Computer Science alumni network. Invitation-only." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isActive(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    void remember;
  }



  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Left — sign-in */}
      <div className="relative flex flex-col">
        <header className="px-8 lg:px-12 pt-8 flex items-center gap-2.5">
          <div className="size-8 rounded-md bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">UWW CS Alumni</span>
        </header>

        <div className="flex-1 grid place-items-center px-6 sm:px-12 py-12">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[28px] font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <a href="#" className="text-sm text-primary hover:underline underline-offset-4">
                    Forgot your password?
                  </a>
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

              <label className="flex items-center gap-2 text-sm select-none">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(Boolean(v))}
                  className="size-4"
                />
                Remember me on this device
              </label>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={submitting} className="w-full h-11 text-sm font-medium">
                {submitting ? "Signing in…" : "Sign in"}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground">Or sign in with</span>
                </div>
              </div>

              <div className="space-y-2">
                <button type="button" disabled className="w-full h-11 rounded-md border border-border bg-card hover:bg-surface-100 transition-colors flex items-center justify-center gap-2.5 text-sm font-medium opacity-60 cursor-not-allowed">
                  <GoogleIcon className="size-4" />
                  Google
                </button>
                <button type="button" disabled className="w-full h-11 rounded-md border border-border bg-card hover:bg-surface-100 transition-colors flex items-center justify-center gap-2.5 text-sm font-medium opacity-60 cursor-not-allowed">
                  <KeyRound className="size-4 text-primary" />
                  Passkey
                </button>
                <button type="button" disabled className="w-full h-11 rounded-md border border-border bg-card hover:bg-surface-100 transition-colors flex items-center justify-center gap-2.5 text-sm font-medium opacity-60 cursor-not-allowed">
                  <ShieldCheck className="size-4 text-primary" />
                  SSO
                </button>
              </div>
            </form>


          </div>
        </div>

        <div className="border-t border-border bg-surface-100">
          <div className="px-6 sm:px-12 py-5 text-center text-sm text-muted-foreground">
            New here? <span className="text-foreground">Ask your department admin for an invitation.</span>
          </div>
        </div>

        <footer className="px-8 lg:px-12 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} UWW CS</span>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </footer>
      </div>

      {/* Right — gradient artwork */}
      <aside className="hidden lg:block relative overflow-hidden bg-surface-100">
        <GradientArt />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <figure className="max-w-lg text-foreground/90">
            <div className="text-5xl leading-none text-foreground/30 font-serif mb-4">“</div>
            <blockquote className="text-2xl sm:text-[26px] font-medium tracking-tight leading-snug text-foreground">
              A quiet, considered network for alumni, faculty, and students of
              UW–Whitewater Computer Science — invitation-only, maintained by
              the Department.
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="size-9 rounded-full bg-foreground/10 grid place-items-center text-xs font-medium text-foreground/70">
                CS
              </div>
              <div className="text-sm text-foreground/70">
                Department of Computer Science
              </div>
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

function GradientArt() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.12 280)" />
          <stop offset="50%" stopColor="oklch(0.65 0.20 305)" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 330)" />
        </linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 60)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.6 0.18 305)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.7 0.18 320)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.9 0.08 250)" stopOpacity="0" />
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="40" /></filter>
      </defs>

      <rect width="800" height="1000" fill="oklch(0.99 0.002 280)" />

      <g filter="url(#blur)">
        <path
          d="M-100 250 Q 200 100 450 350 T 950 600 L 950 0 L -100 0 Z"
          fill="url(#g1)"
        />
        <path
          d="M -50 700 Q 250 500 500 750 T 900 950 L 900 1050 L -50 1050 Z"
          fill="url(#g2)"
        />
        <ellipse cx="550" cy="500" rx="280" ry="220" fill="url(#g3)" />
        <ellipse cx="200" cy="850" rx="200" ry="160" fill="oklch(0.5 0.16 305)" opacity="0.35" />
      </g>

      {/* subtle grain overlay via dots */}
      <g opacity="0.05">
        <circle cx="100" cy="100" r="1.5" />
        <circle cx="300" cy="200" r="1.5" />
        <circle cx="500" cy="120" r="1.5" />
        <circle cx="700" cy="300" r="1.5" />
        <circle cx="200" cy="400" r="1.5" />
        <circle cx="600" cy="500" r="1.5" />
      </g>
    </svg>
  );
}
