import { getSupabaseAdmin } from "./supabase-admin";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function ensureTodayMedicationLogs(patientId: string) {
  const supabase = getSupabaseAdmin();
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
      const status = scheduled < now ? "missed" : "upcoming";
      await supabase.from("medication_logs").insert({
        patient_id: patientId,
        medication_id: med.id,
        scheduled_time: scheduled.toISOString(),
        status,
      });
    }
  }

  const { error: syncError } = await supabase.rpc("sync_medication_logs", { p_patient_id: patientId });
  if (syncError) throw new Error(syncError.message);
}

export async function ensureAllPatientLogsToday() {
  const supabase = getSupabaseAdmin();
  const { data: patients, error } = await supabase.from("profiles").select("id").eq("role", "patient");
  if (error) throw new Error(error.message);

  for (const patient of patients ?? []) {
    await ensureTodayMedicationLogs(patient.id);
  }
}
