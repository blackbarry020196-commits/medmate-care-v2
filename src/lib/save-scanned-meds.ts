import { format } from "date-fns";
import { DAY_FULL_NAMES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import type { ScannedMedication } from "@/lib/prescription-scan";

function buildInstructions(item: ScannedMedication): string | null {
  const parts = [item.instructions, item.duration ? `Duration: ${item.duration}` : ""].filter(Boolean);
  return parts.length > 0 ? parts.join(". ") : null;
}

function normalizeTime(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "08:00:00";
  const h = String(Math.min(23, Math.max(0, Number(match[1])))).padStart(2, "0");
  const m = String(Math.min(59, Math.max(0, Number(match[2])))).padStart(2, "0");
  return `${h}:${m}:00`;
}

export async function saveScannedMedications(userId: string, items: ScannedMedication[]) {
  const startDate = format(new Date(), "yyyy-MM-dd");
  const allDays = [...DAY_FULL_NAMES];

  for (const item of items) {
    const { data: med, error: medErr } = await supabase
      .from("medications")
      .insert({
        user_id: userId,
        name: item.name.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        instructions: buildInstructions(item),
        start_date: startDate,
        is_active: true,
      })
      .select("id")
      .single();

    if (medErr) throw new Error(medErr.message);

    const times = item.times.length > 0 ? item.times : ["08:00"];
    const reminders = times.map((time) => ({
      user_id: userId,
      medication_id: med.id,
      scheduled_time: normalizeTime(time),
      days_of_week: allDays,
      is_active: true,
    }));

    const { error: remErr } = await supabase.from("reminders").insert(reminders);
    if (remErr) throw new Error(remErr.message);
  }
}
