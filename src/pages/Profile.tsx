import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, LogOut, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/medmate/PageHeader";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/lib/auth";
import { createFamilyInvite } from "@/lib/family";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const push = usePushNotifications(user?.id);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, phone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => createFamilyInvite(user!.id),
    onSuccess: (link) => {
      setInviteLink(link);
      toast.success("Invite link created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const phoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const { error } = await supabase.from("profiles").update({ phone: phone.trim() || null }).eq("id", user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Phone number saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied — share via WhatsApp or text");
  }

  async function handleNotificationToggle(checked: boolean) {
    try {
      if (checked) {
        await push.subscribe();
        toast.success("Notifications enabled");
      } else {
        await push.unsubscribe();
        toast.success("Notifications disabled");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notifications.");
    }
  }

  if (profileQ.isLoading) return <LoadingCard label="Loading profile…" />;

  const isPatient = profileQ.data?.role !== "family";

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />

      <Card className="mb-6">
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
              {isPatient ? "Patient" : "Family member"}
            </p>
          </div>

          {isPatient && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number (for family to call you)</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={profileQ.data?.phone ?? ""}
                  placeholder="e.g. 07700 900123"
                  onBlur={(e) => {
                    if (e.target.value !== (profileQ.data?.phone ?? "")) {
                      phoneMutation.mutate(e.target.value);
                    }
                  }}
                />
              </div>

              <div className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="text-lg font-semibold">Invite a family member</p>
                </div>
                <p className="text-base text-muted-foreground">
                  Generate a link so a family member can monitor your medication adherence.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  disabled={inviteMutation.isPending}
                  onClick={() => inviteMutation.mutate()}
                >
                  {inviteMutation.isPending ? "Creating link…" : "Invite Family Member"}
                </Button>
                {inviteLink && (
                  <div className="space-y-2">
                    <Input readOnly value={inviteLink} className="text-sm" />
                    <Button size="lg" variant="outline" className="w-full" onClick={copyInviteLink}>
                      <Copy className="h-5 w-5" />
                      Copy Link
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {push.isSupported && (
            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    {isPatient ? "Medication reminders" : "Missed medication alerts"}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {isPatient
                      ? "Browser notifications for your medication schedule."
                      : "Get notified when your relative misses a dose."}
                  </p>
                </div>
                <Switch
                  checked={push.isSubscribed}
                  disabled={push.loading || push.permission === "denied"}
                  onCheckedChange={handleNotificationToggle}
                  aria-label={isPatient ? "Medication reminders" : "Missed medication alerts"}
                />
              </div>
              {push.blockedMessage && (
                <p className="text-sm text-destructive">{push.blockedMessage}</p>
              )}
            </div>
          )}

          <Button size="lg" variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-6 w-6" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
