import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Pill } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { useAuth } from "@/lib/auth";
import {
  acceptInviteIfPending,
  getInvitePreview,
  savePendingInviteToken,
  type InvitePreview,
} from "@/lib/family";

export default function InvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    savePendingInviteToken(token);
    getInvitePreview(token)
      .then(setPreview)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (authLoading || !user || !token || !preview || preview.accepted) return;

    setAccepting(true);
    acceptInviteIfPending(user.id)
      .then(() => {
        toast.success(`You are now monitoring ${preview.patient_name}'s medications.`);
        navigate("/dashboard/family", { replace: true });
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setAccepting(false));
  }, [authLoading, user, token, preview, navigate]);

  if (loading || authLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
        <LoadingCard label="Loading invite…" />
      </main>
    );
  }

  if (!token || !preview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <p className="text-lg">This invite link is invalid or has expired.</p>
            <Button className="mt-6" asChild>
              <Link to="/login">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (preview.accepted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <p className="text-lg">This invite has already been used.</p>
            <Button className="mt-6" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
        <LoadingCard label={accepting ? "Linking your account…" : "Preparing your dashboard…"} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Heart className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold">MedMate Family</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">You&apos;re invited</CardTitle>
            <CardDescription className="text-base">
              You&apos;ve been invited to monitor <strong>{preview.patient_name}</strong>&apos;s medications. Create an
              account or sign in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button size="lg" className="w-full" asChild>
              <Link to={`/signup?invite=${token}`}>Create account</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link to={`/login?invite=${token}`}>Sign in</Link>
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Pill className="h-4 w-4" />
          MedMate helps families stay connected to daily medication routines.
        </p>
      </div>
    </main>
  );
}
