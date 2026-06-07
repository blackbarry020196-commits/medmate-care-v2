import { DAY_NAMES } from "@/lib/constants";
import type { ScheduleItem } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export async function getTodaySchedule(userId: string): Promise<ScheduleItem[]> {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: reminders, error: rErr } = await supabase
    .from("reminders")
    .select(
      "id, medication_id, scheduled_time, days_of_week, is_active, medications!inner(id, name, dosage, instructions, is_active)",
    )
    .eq("user_id", userId)
    .eq("is_active", true);

  if (rErr) throw new Error(rErr.message);

  const { data: logs, error: lErr } = await supabase
    .from("dose_logs")
    .select("id, reminder_id, status, scheduled_at")
    .eq("user_id", userId)
    .gte("scheduled_at", startOfDay.toISOString())
    .lte("scheduled_at", endOfDay.toISOString());

  if (lErr) throw new Error(lErr.message);

  const items: ScheduleItem[] = [];

  for (const r of reminders ?? []) {
    const med = r.medications as {
      id: string;
      name: string;
      dosage: string;
      instructions: string | null;
      is_active: boolean;
    };
    if (!med?.is_active) continue;

    const days = r.days_of_week ?? [];
    if (days.length > 0 && !days.includes(dayName)) continue;

    const [h, m] = String(r.scheduled_time).split(":").map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(h ?? 0, m ?? 0, 0, 0);

    const log = logs?.find((l) => l.reminder_id === r.id);

    items.push({
      reminder_id: r.id,
      medication_id: med.id,
      medication_name: med.name,
      dosage: med.dosage,
      instructions: med.instructions ?? null,
      scheduled_time: String(r.scheduled_time).slice(0, 5),
      scheduled_at: scheduled.toISOString(),
      status: (log?.status as ScheduleItem["status"]) ?? "pending",
      log_id: log?.id ?? null,
    });
  }

  items.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
  return items;
}

export async function markDoseTaken(
  userId: string,
  vars: { reminder_id: string; scheduled_at: string; log_id: string | null },
) {
  const now = new Date().toISOString();

  if (vars.log_id) {
    const { error } = await supabase
      .from("dose_logs")
      .update({ status: "taken", taken_at: now })
      .eq("id", vars.log_id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("dose_logs").insert({
    reminder_id: vars.reminder_id,
    user_id: userId,
    scheduled_at: vars.scheduled_at,
    taken_at: now,
    status: "taken",
  });
  if (error) throw new Error(error.message);
}

export function formatTime12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
