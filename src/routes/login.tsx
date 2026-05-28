import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, isActive } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — UWW CS Alumni" },
      {
        name: "description",
        content: "Sign in to the UW–Whitewater Computer Science alumni network. Invitation-only.",
      },
      { property: "og:title", content: "Sign in — UWW CS Alumni" },
      {
        property: "og:description",
        content: "Sign in to the UW–Whitewater Computer Science alumni network. Invitation-only.",
      },
    ],
  }),
  component: LoginPage,
});

type Mode = "sign-in" | "forgot";

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot-password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSubmitting(false);
    if (err) {
      setResetError(err.message);
      return;
    }
    setResetSent(true);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetError(null);
    setResetSent(false);
  }

  return (
    <AuthShell>
      {/* ── Sign-in ── */}
      {mode === "sign-in" && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@uww.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm select-none text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
                className="size-4"
              />
              Remember me
            </label>

            {error && (
              <p className="rounded-md bg-destructive/8 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full h-10 text-sm font-medium">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </>
      )}

      {/* ── Forgot password ── */}
      {mode === "forgot" && (
        <>
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </button>

          {resetSent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-6">
                  We sent a reset link to{" "}
                  <span className="font-medium text-foreground">{resetEmail}</span>. Click the link
                  to set a new password.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={() => setResetSent(false)}
                  className="text-primary hover:underline underline-offset-4"
                >
                  Send again
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              <form onSubmit={sendReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@uww.edu"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="h-10"
                    autoFocus
                  />
                </div>

                {resetError && (
                  <p className="rounded-md bg-destructive/8 px-3 py-2 text-sm text-destructive">
                    {resetError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-full h-10 text-sm font-medium"
                >
                  {resetSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </>
      )}
    </AuthShell>
  );
}
