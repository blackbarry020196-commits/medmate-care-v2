import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/medmate/PageHeader";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { formatTime12h, getTodaySchedule, greeting, markDoseTaken } from "@/lib/schedule";
import { ensureTodayMedicationLogs } from "@/lib/medication-logs";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user!.id;

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const scheduleQ = useQuery({
    queryKey: ["schedule", "today"],
    queryFn: () => getTodaySchedule(userId),
  });

  useEffect(() => {
    ensureTodayMedicationLogs(userId).catch(() => undefined);
  }, [userId]);

  const markMutation = useMutation({
    mutationFn: (vars: {
      reminder_id: string;
      scheduled_at: string;
      log_id: string | null;
      medication_id: string;
    }) => markDoseTaken(userId, vars),
    onSuccess: () => {
      toast.success("Dose marked as taken");
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const firstName = profileQ.data?.full_name?.split(" ")[0] || "there";
  const items = scheduleQ.data ?? [];
  const taken = items.filter((i) => i.status === "taken").length;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName}`} subtitle={today} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <CalendarDays className="h-6 w-6 text-primary" />
            Today&apos;s progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {taken} <span className="font-medium text-muted-foreground">of</span> {items.length}
          </p>
          <p className="mt-1 text-lg text-muted-foreground">
            {items.length === 0 ? "No doses scheduled today" : "doses taken so far"}
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-4">Today&apos;s schedule</h2>

      {scheduleQ.isLoading ? (
        <LoadingCard label="Loading today's schedule…" />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2">Nothing scheduled today</h3>
            <p className="text-lg text-muted-foreground">
              Add a medication and reminder to see your daily schedule here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.reminder_id}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>{formatTime12h(item.scheduled_time)}</span>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold">{item.medication_name}</h3>
                  <p className="mt-1 text-lg">{item.dosage}</p>
                  {item.instructions && <p className="mt-2 text-base text-muted-foreground">{item.instructions}</p>}
                  {item.status === "taken" ? (
                    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-accent p-4 text-lg font-semibold text-primary">
                      <Check className="h-6 w-6" />
                      Taken
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="mt-5 w-full"
                      disabled={markMutation.isPending}
                      onClick={() =>
                        markMutation.mutate({
                          reminder_id: item.reminder_id,
                          scheduled_at: item.scheduled_at,
                          log_id: item.log_id,
                          medication_id: item.medication_id,
                        })
                      }
                    >
                      Mark as taken
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
