import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/medmate/PageHeader";
import { PushNotificationPrompt } from "@/components/medmate/PushNotificationPrompt";
import { PatientCard, type PatientDashboardData } from "@/components/family/PatientCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken, usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/lib/auth";
import { fetchLinkedPatients } from "@/lib/family";
import { notifyFamilyMissedMeds } from "@/lib/push-subscriptions";
import {
  ensureTodayMedicationLogs,
  fetchRecentMissedMeds,
  fetchTodayMedStatuses,
  fetchWeeklyAdherence,
} from "@/lib/medication-logs";
import { supabase } from "@/integrations/supabase/client";

async function loadPatientDashboard(patientId: string): Promise<PatientDashboardData> {
  await ensureTodayMedicationLogs(patientId);

  const [profileRes, adherence, todayMeds, recentMissed] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, updated_at").eq("id", patientId).single(),
    fetchWeeklyAdherence(patientId),
    fetchTodayMedStatuses(patientId),
    fetchRecentMissedMeds(patientId),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  const profile = profileRes.data;

  return {
    id: profile.id,
    full_name: profile.full_name,
    phone: profile.phone,
    updated_at: profile.updated_at,
    adherence,
    todayMeds,
    recentMissed,
  };
}

function PatientCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

export default function FamilyDashboardPage() {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | "all">("all");
  const push = usePushNotifications(user?.id);
  const missedCheckDone = useRef(false);

  const patientsQ = useQuery({
    queryKey: ["family", "patients", user!.id],
    queryFn: () => fetchLinkedPatients(user!.id),
  });

  const dashboardQ = useQuery({
    queryKey: ["family", "dashboard", patientsQ.data?.map((p) => p.id)],
    enabled: (patientsQ.data?.length ?? 0) > 0,
    queryFn: async () => {
      const patients = patientsQ.data ?? [];
      return Promise.all(patients.map((p) => loadPatientDashboard(p.id)));
    },
  });

  const patientCards = dashboardQ.data ?? [];
  const visibleCards =
    selectedPatientId === "all"
      ? patientCards
      : patientCards.filter((p) => p.id === selectedPatientId);

  useEffect(() => {
    if (!push.isSubscribed || missedCheckDone.current || patientsQ.isLoading) return;

    missedCheckDone.current = true;
    void (async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        await notifyFamilyMissedMeds(token);
      } catch (error) {
        console.error("Missed medication alert check failed:", error);
      }
    })();
  }, [push.isSubscribed, patientsQ.isLoading]);

  return (
    <>
      <PageHeader title="Family Dashboard" subtitle="Monitor your loved one's medication adherence." />

      <PushNotificationPrompt
        push={push}
        variant="banner"
        title="Get alerted when medications are missed"
        description="Enable browser notifications so you know right away if a dose is missed."
        buttonLabel="Enable Alerts"
      />

      {patientsQ.isLoading || dashboardQ.isLoading ? (
        <div className="space-y-4">
          <PatientCardSkeleton />
        </div>
      ) : patientCards.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-10 text-center">
            <Users className="mx-auto h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">No patients linked yet</h3>
            <p className="text-lg text-muted-foreground">
              Ask your family member to send you an invite link from their Profile page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {patientCards.length > 1 && (
            <div className="mb-4">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All patients</SelectItem>
                  {patientCards.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-6">
            {visibleCards.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
