import { DAY_NAMES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

export type MedLogStatus = "taken" | "missed" | "upcoming";

export type TodayMedStatus = {
  id: string;
  medication_id: string;
  medication_name: string;
  scheduled_time: string;
  scheduled_at: string;
  status: MedLogStatus;
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(-1);
  return end;
}

async function touchPatientActivity(patientId: string) {
  await supabase.from("profiles").update({ updated_at: new Date().toISOString() }).eq("id", patientId);
}

export async function syncMedicationLogs(patientId: string) {
  const { error } = await supabase.rpc("sync_medication_logs", { p_patient_id: patientId });
  if (error) throw new Error(error.message);
}

export async function ensureTodayMedicationLogs(patientId: string) {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: reminders, error: rErr } = await supabase
    .from("reminders")
    .select("id, medication_id, scheduled_time, days_of_week, medications!inner(id, name, is_active)")
    .eq("user_id", patientId)
    .eq("is_active", true);
  if (rErr) throw new Error(rErr.message);

  const { data: existing, error: eErr } = await supabase
    .from("medication_logs")
    .select("id, medication_id, scheduled_time, status, taken_at")
    .eq("patient_id", patientId)
    .gte("scheduled_time", startOfDay.toISOString())
    .lte("scheduled_time", endOfDay.toISOString());
  if (eErr) throw new Error(eErr.message);

  for (const r of reminders ?? []) {
    const med = r.medications as { id: string; name: string; is_active: boolean };
    if (!med?.is_active) continue;
    const days = r.days_of_week ?? [];
    if (days.length > 0 && !days.includes(dayName)) continue;

    const [h, m] = String(r.scheduled_time).split(":").map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(h ?? 0, m ?? 0, 0, 0);

    const match = existing?.find(
      (log) =>
        log.medication_id === med.id &&
        new Date(log.scheduled_time).getHours() === scheduled.getHours() &&
        new Date(log.scheduled_time).getMinutes() === scheduled.getMinutes(),
    );

    if (!match) {
      const status: MedLogStatus = scheduled < now ? "missed" : "upcoming";
      await supabase.from("medication_logs").insert({
        patient_id: patientId,
        medication_id: med.id,
        scheduled_time: scheduled.toISOString(),
        status,
      });
    }
  }

  await syncMedicationLogs(patientId);
}

export async function recordMedicationTaken(
  patientId: string,
  vars: { medication_id: string; scheduled_at: string },
) {
  const takenAt = new Date().toISOString();
  const scheduled = new Date(vars.scheduled_at);
  const rangeStart = new Date(scheduled);
  rangeStart.setSeconds(0, 0);
  const rangeEnd = new Date(scheduled);
  rangeEnd.setSeconds(59, 999);

  const { data: existing } = await supabase
    .from("medication_logs")
    .select("id")
    .eq("patient_id", patientId)
    .eq("medication_id", vars.medication_id)
    .gte("scheduled_time", rangeStart.toISOString())
    .lte("scheduled_time", rangeEnd.toISOString())
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("medication_logs")
      .update({ status: "taken", taken_at: takenAt })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("medication_logs").insert({
      patient_id: patientId,
      medication_id: vars.medication_id,
      scheduled_time: vars.scheduled_at,
      taken_at: takenAt,
      status: "taken",
    });
    if (error) throw new Error(error.message);
  }

  await touchPatientActivity(patientId);
}

export async function fetchTodayMedStatuses(patientId: string): Promise<TodayMedStatus[]> {
  await syncMedicationLogs(patientId);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: logs, error } = await supabase
    .from("medication_logs")
    .select("id, medication_id, scheduled_time, status, medications!inner(name)")
    .eq("patient_id", patientId)
    .gte("scheduled_time", startOfDay.toISOString())
    .lte("scheduled_time", endOfDay.toISOString())
    .order("scheduled_time", { ascending: true });
  if (error) throw new Error(error.message);

  return (logs ?? []).map((log) => {
    const med = log.medications as { name: string };
    const scheduled = new Date(log.scheduled_time);
    const hh = String(scheduled.getHours()).padStart(2, "0");
    const mm = String(scheduled.getMinutes()).padStart(2, "0");
    return {
      id: log.id,
      medication_id: log.medication_id,
      medication_name: med.name,
      scheduled_time: `${hh}:${mm}`,
      scheduled_at: log.scheduled_time,
      status: log.status as MedLogStatus,
    };
  });
}

export async function fetchWeeklyAdherence(patientId: string): Promise<number> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const { data: logs, error } = await supabase
    .from("medication_logs")
    .select("status, scheduled_time")
    .eq("patient_id", patientId)
    .gte("scheduled_time", weekStart.toISOString())
    .lte("scheduled_time", weekEnd.toISOString());
  if (error) throw new Error(error.message);

  const relevant = (logs ?? []).filter((l) => new Date(l.scheduled_time) <= now);
  if (relevant.length === 0) return 100;

  const taken = relevant.filter((l) => l.status === "taken").length;
  return Math.round((taken / relevant.length) * 100);
}

export async function fetchRecentMissedMeds(patientId: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("medication_logs")
    .select("scheduled_time, medications!inner(name)")
    .eq("patient_id", patientId)
    .eq("status", "missed")
    .gte("scheduled_time", since)
    .order("scheduled_time", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const med = row.medications as { name: string };
    return { medication_name: med.name, scheduled_time: row.scheduled_time };
  });
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "No recent activity";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Last seen just now";
  if (mins < 60) return `Last seen ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
}
