import type { VercelRequest, VercelResponse } from "@vercel/node";
import { formatMissedMedTime, sendPushToUser } from "./_lib/push";
import { getSupabaseAdmin } from "./_lib/supabase-admin";

type MissedLogRow = {
  id: string;
  patient_id: string;
  scheduled_time: string;
  medications: { name: string } | { name: string }[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const familyUserId = authData.user.id;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: links, error: linkError } = await supabase
      .from("family_links")
      .select("patient_id")
      .eq("family_user_id", familyUserId);

    if (linkError) throw new Error(linkError.message);

    const patientIds = (links ?? []).map((l) => l.patient_id);
    if (patientIds.length === 0) {
      return res.status(200).json({ ok: true, sent: 0 });
    }

    for (const patientId of patientIds) {
      await supabase.rpc("sync_medication_logs", { p_patient_id: patientId });
    }

    const { data: missedLogs, error } = await supabase
      .from("medication_logs")
      .select("id, patient_id, scheduled_time, medications!inner(name)")
      .in("patient_id", patientIds)
      .eq("status", "missed")
      .gte("scheduled_time", oneHourAgo)
      .order("scheduled_time", { ascending: false });

    if (error) throw new Error(error.message);

    let sent = 0;

    for (const log of (missedLogs ?? []) as MissedLogRow[]) {
      const { data: existing } = await supabase
        .from("push_notification_log")
        .select("id")
        .eq("medication_log_id", log.id)
        .eq("family_user_id", familyUserId)
        .maybeSingle();

      if (existing?.id) continue;

      const med = Array.isArray(log.medications) ? log.medications[0] : log.medications;
      const medName = med?.name ?? "medication";
      const timeLabel = formatMissedMedTime(log.scheduled_time);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", log.patient_id)
        .maybeSingle();

      const patientName = profile?.full_name ?? "Your relative";

      const result = await sendPushToUser(familyUserId, {
        title: "⚠️ Missed Medication Alert",
        body: `${patientName} missed ${medName} scheduled at ${timeLabel}`,
        url: "/dashboard/family",
      });

      if (result.sent > 0) {
        await supabase.from("push_notification_log").insert({
          medication_log_id: log.id,
          family_user_id: familyUserId,
        });
        sent += result.sent;
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (error) {
    console.error("notify-family-missed error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send alerts.",
    });
  }
}
