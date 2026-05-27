import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Set new password — UWW CS Alumni" }],
  }),
  component: ResetPasswordPage,
});

type State = "waiting" | "ready" | "done" | "invalid";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash.
    // The PASSWORD_RECOVERY event fires once the exchange succeeds.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setState("ready");
    });

    // Guard: if we land here without a valid recovery token the event
    // never fires, so time out after 4 s and show an error state.
    const timeout = setTimeout(() => {
      setState((s) => (s === "waiting" ? "invalid" : s));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setState("done");
    setTimeout(() => navigate({ to: "/login" }), 2500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Left panel */}
      <div className="relative flex flex-col">
        <header className="flex justify-center px-6 pt-8 sm:px-12">
          <Link to="/" aria-label="Go to landing page">
            <img
              src="/uw-whitewater-logo.png"
              alt="University of Wisconsin Whitewater"
              className="h-auto w-[248px] sm:w-[293px]"
            />
          </Link>
        </header>

        <div className="flex-1 grid place-items-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[400px]">
            {state === "waiting" && (
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            )}

            {state === "invalid" && (
              <div className="space-y-4 text-center">
                <h1 className="text-[28px] font-semibold tracking-tight">
                  Link expired or invalid
                </h1>
                <p className="text-sm text-muted-foreground">
                  This password reset link has expired or has already been used. Request a new one
                  from the sign-in page.
                </p>
                <Button asChild className="mt-2">
                  <Link to="/login">Back to sign in</Link>
                </Button>
              </div>
            )}

            {state === "done" && (
              <div className="space-y-3 text-center">
                <div className="text-4xl">✓</div>
                <h1 className="text-[28px] font-semibold tracking-tight">Password updated</h1>
                <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
              </div>
            )}

            {state === "ready" && (
              <>
                <h1 className="text-[28px] font-semibold tracking-tight">Set new password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Choose a strong password for your account.
                </p>

                <form onSubmit={submit} className="mt-8 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">
                      New password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-11"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm" className="text-sm font-medium">
                      Confirm password
                    </Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 w-full text-sm font-medium"
                  >
                    {submitting ? "Updating…" : "Update password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right — gradient artwork (matches login page) */}
      <aside className="relative hidden overflow-hidden bg-surface-100 lg:block">
        <GradientArt />
      </aside>
    </div>
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
        <linearGradient id="rp-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.12 280)" />
          <stop offset="50%" stopColor="oklch(0.65 0.20 305)" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 330)" />
        </linearGradient>
        <linearGradient id="rp-g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 60)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.6 0.18 305)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rp-g3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.7 0.18 320)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.9 0.08 250)" stopOpacity="0" />
        </linearGradient>
        <filter id="rp-blur">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      <rect width="800" height="1000" fill="oklch(0.99 0.002 280)" />

      <g filter="url(#rp-blur)">
        <path d="M-100 250 Q 200 100 450 350 T 950 600 L 950 0 L -100 0 Z" fill="url(#rp-g1)" />
        <path
          d="M -50 700 Q 250 500 500 750 T 900 950 L 900 1050 L -50 1050 Z"
          fill="url(#rp-g2)"
        />
        <ellipse cx="550" cy="500" rx="280" ry="220" fill="url(#rp-g3)" />
        <ellipse cx="200" cy="850" rx="200" ry="160" fill="oklch(0.5 0.16 305)" opacity="0.35" />
      </g>
    </svg>
  );
}
