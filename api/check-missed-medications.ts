import type { VercelRequest, VercelResponse } from "@vercel/node";
import { formatMissedMedTime, sendPushToUser } from "./_lib/push";
import { ensureAllPatientLogsToday } from "./_lib/medication-logs-admin";
import { getSupabaseAdmin, isAuthorizedInternalRequest } from "./_lib/supabase-admin";

type MissedLogRow = {
  id: string;
  patient_id: string;
  scheduled_time: string;
  medications: { name: string } | { name: string }[];
};

async function syncAllPatientLogs() {
  await ensureAllPatientLogsToday();
}

async function notifyFamilyForMissedLogs(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: missedLogs, error } = await supabase
    .from("medication_logs")
    .select("id, patient_id, scheduled_time, medications!inner(name)")
    .eq("status", "missed")
    .gte("scheduled_time", oneHourAgo)
    .order("scheduled_time", { ascending: false });

  if (error) throw new Error(error.message);

  let notificationsSent = 0;

  for (const log of (missedLogs ?? []) as MissedLogRow[]) {
    const med = Array.isArray(log.medications) ? log.medications[0] : log.medications;
    const medName = med?.name ?? "medication";
    const timeLabel = formatMissedMedTime(log.scheduled_time);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", log.patient_id)
      .maybeSingle();

    const patientName = profile?.full_name ?? "Your relative";

    const { data: links, error: linkError } = await supabase
      .from("family_links")
      .select("family_user_id")
      .eq("patient_id", log.patient_id);

    if (linkError) throw new Error(linkError.message);

    for (const link of links ?? []) {
      const { data: existing } = await supabase
        .from("push_notification_log")
        .select("id")
        .eq("medication_log_id", log.id)
        .eq("family_user_id", link.family_user_id)
        .maybeSingle();

      if (existing?.id) continue;

      const result = await sendPushToUser(link.family_user_id, {
        title: "⚠️ Missed Medication Alert",
        body: `${patientName} missed ${medName} scheduled at ${timeLabel}`,
        url: "/dashboard/family",
      });

      if (result.sent > 0) {
        await supabase.from("push_notification_log").insert({
          medication_log_id: log.id,
          family_user_id: link.family_user_id,
        });
        notificationsSent += result.sent;
      }
    }
  }

  return notificationsSent;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const isCron = req.headers["x-vercel-cron"] === "1";
  if (!isCron && !isAuthorizedInternalRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabase = getSupabaseAdmin();
    await syncAllPatientLogs();
    const notificationsSent = await notifyFamilyForMissedLogs(supabase);
    return res.status(200).json({ ok: true, notificationsSent });
  } catch (error) {
    console.error("check-missed-medications error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to check missed medications.",
    });
  }
}
