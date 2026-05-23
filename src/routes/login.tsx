import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useAuth, isActive } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "UWW CS Alumni — Sign in" },
      { name: "description", content: "Invitation-only alumni network for the UW–Whitewater Computer Science department." },
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Pill nav */}
      <header className="pt-6 px-4 flex justify-center">
        <nav className="flex items-center gap-1 bg-surface-100 border border-border/70 rounded-full pl-5 pr-1.5 py-1.5 shadow-sm">
          <a href="#" className="flex items-center gap-2 pr-6">
            <div className="size-6 rounded-md bg-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="size-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">UWW CS Alumni</span>
          </a>
          <a href="#about" className="px-4 py-1.5 text-sm text-foreground/70 hover:text-foreground rounded-full">About</a>
          <a href="#access" className="px-4 py-1.5 text-sm text-foreground/70 hover:text-foreground rounded-full">Access</a>
          <a href="#signin" className="px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-full">Sign in</a>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 grid place-items-center px-6 py-20">
        <div className="w-full max-w-3xl text-center">
          <div className="mx-auto mb-8 size-16 rounded-2xl bg-primary grid place-items-center text-primary-foreground shadow-sm">
            <GraduationCap className="size-7" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]">
            The <span className="text-primary">UWW CS</span><br />alumni network.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Invitation-only. Maintained by the Department —<br className="hidden sm:block" />
            connect, mentor, and stay close to the work.
          </p>

          {/* Sign-in card */}
          <form
            id="signin"
            onSubmit={submit}
            className="mt-12 mx-auto max-w-md text-left"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@uww.edu"
                required
                className="h-12 flex-1 rounded-full px-5 bg-surface-100 border-border/70"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="h-12 flex-1 rounded-full px-5 bg-surface-100 border-border/70"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-3">
              <Button type="submit" className="h-11 rounded-full px-7">Sign in</Button>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Forgot password?</a>
            </div>
            {error && (
              <p className="mt-3 text-center text-sm text-destructive">{error}</p>
            )}
          </form>

          <p className="mt-10 text-xs text-muted-foreground">
            No public registration. Ask your department admin for an invitation.
          </p>
        </div>
      </main>

      <footer id="about" className="py-8 px-6 text-center text-xs text-muted-foreground">
        © {new Action()} · UW–Whitewater Department of Computer Science
      </footer>
    </div>
  );
}

function Action() { return new Date().getFullYear() as unknown as object; }
