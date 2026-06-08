import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Pill } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolvePostAuthPath, savePendingInviteToken } from "@/lib/family";
import { supabase } from "@/integrations/supabase/client";

export default function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const inviteToken = params.get("invite");

  useEffect(() => {
    if (inviteToken) savePendingInviteToken(inviteToken);
  }, [inviteToken]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: inviteToken ? "family" : "patient",
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      toast.error("Could not create account.");
      return;
    }

    try {
      const path = await resolvePostAuthPath(data.user.id);
      toast.success(inviteToken ? "Welcome to MedMate Family!" : "Account created. Welcome to MedMate!");
      navigate(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete signup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Pill className="h-7 w-7" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold">MedMate</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{inviteToken ? "Create family account" : "Create account"}</CardTitle>
            <CardDescription className="text-base">
              {inviteToken
                ? "Set up your account to monitor your family member's medications."
                : "Set up your medication reminders in a few steps."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Margaret Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-center text-base text-muted-foreground">
                Already have an account?{" "}
                <Link to={`/login${inviteToken ? `?invite=${inviteToken}` : ""}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
