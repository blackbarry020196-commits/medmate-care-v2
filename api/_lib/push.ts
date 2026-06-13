import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { getSupabaseAdmin } from "./supabase-admin";

let configured = false;

function configureWebPush() {
  if (configured) return;

  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const email = process.env.VAPID_EMAIL?.trim() ?? "mailto:support@medmate.app";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured.");
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configureWebPush();
  const supabase = getSupabaseAdmin();

  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  if (!rows?.length) return { sent: 0, removed: 0 };

  let sent = 0;
  let removed = 0;
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  for (const row of rows) {
    const subscription = row.subscription as PushSubscription;
    try {
      await webpush.sendNotification(subscription, body);
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", row.id);
        removed += 1;
      } else {
        console.error("Push send failed:", err);
      }
    }
  }

  return { sent, removed };
}

export function formatMissedMedTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
