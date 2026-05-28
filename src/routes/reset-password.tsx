import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setState("ready");
    });

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
    <AuthShell>
      {/* Waiting — token exchange in progress */}
      {state === "waiting" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
        </div>
      )}

      {/* Invalid — token expired or missing */}
      {state === "invalid" && (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10">
            <XCircle className="size-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Link expired or invalid</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-6">
              This password reset link has expired or has already been used. Request a new one from
              the sign-in page.
            </p>
          </div>
          <Button asChild className="w-full h-10">
            <a href="/login">Back to sign in</a>
          </Button>
        </div>
      )}

      {/* Done — password updated */}
      {state === "done" && (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Password updated</h1>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in…</p>
          </div>
        </div>
      )}

      {/* Ready — form */}
      {state === "ready" && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 pr-10"
                  autoFocus
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
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-medium">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/8 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full h-10 text-sm font-medium">
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
