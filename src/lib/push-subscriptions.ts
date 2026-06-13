import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function fetchUserPushSubscriptions(userId: string) {
  const { data, error } = await supabase.from("push_subscriptions").select("id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function savePushSubscription(userId: string, subscription: PushSubscriptionJSON) {
  const endpoint = subscription.endpoint;

  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .filter("subscription->>endpoint", "eq", endpoint)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ subscription: subscription as unknown as Json })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: userId,
    subscription: subscription as unknown as Json,
  });
  if (error) throw new Error(error.message);
}

export async function removePushSubscription(userId: string, endpoint?: string) {
  let query = supabase.from("push_subscriptions").delete().eq("user_id", userId);
  if (endpoint) {
    query = query.filter("subscription->>endpoint", "eq", endpoint);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function notifyFamilyMissedMeds(accessToken: string) {
  const res = await fetch("/api/notify-family-missed", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not check for missed medications.");
  }

  return res.json() as Promise<{ ok: boolean; sent: number }>;
}
