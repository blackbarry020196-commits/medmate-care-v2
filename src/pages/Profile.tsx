import { useQuery } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/medmate/PageHeader";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name, role").eq("id", user!.id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  }

  if (profileQ.isLoading) return <LoadingCard label="Loading profile…" />;

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profileQ.data?.full_name || "MedMate user"}</p>
              <p className="text-lg text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-lg">
            <p>
              <span className="text-muted-foreground">Account type: </span>
              {profileQ.data?.role === "family" ? "Family member" : "Patient"}
            </p>
          </div>

          <Button size="lg" variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-6 w-6" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
