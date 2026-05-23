import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GraduationCap } from "lucide-react";
import { useAuth, IDENTITY_LABEL, isActive, type IdentityKey } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

const SWITCHER: IdentityKey[] = ["super_admin", "staff_faculty", "staff_student", "invited", "disabled"];

function LoginPage() {
  const { user, signInAs } = useAuth();
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

  function quick(id: IdentityKey) {
    signInAs(id);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-surface-100 grid place-items-center px-4">
      <Card className="w-full max-w-md overflow-hidden p-0">
        <div className="bg-primary text-primary-foreground p-6 flex items-center gap-3">
          <div className="size-10 rounded-md bg-primary-foreground/10 grid place-items-center">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h1 className="font-semibold">UWW CS Alumni</h1>
            <p className="text-xs opacity-80">Invitation-only · No public registration</p>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@uww.edu" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Sign in</Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute inset-0 grid place-items-center -top-2 text-xs text-muted-foreground bg-card px-2 w-fit mx-auto">mock mode</span>
          </div>
          <div className="grid gap-2">
            {SWITCHER.map((k) => (
              <Button key={k} type="button" variant="outline" onClick={() => quick(k)}>
                Continue as {IDENTITY_LABEL[k]}
              </Button>
            ))}
          </div>
        </form>
      </Card>
    </div>
  );
}
