import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push-subscriptions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData], (char) => char.charCodeAt(0));
}

function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? "";
}

function getBrowserPushSupport() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getBrowserPushSubscription() {
  if (!getBrowserPushSupport()) return null;

  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    return (await registration?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

export function usePushNotifications(userId: string | undefined) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscriptionState = useCallback(async () => {
    if (!userId) {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const browserSubscription = await getBrowserPushSubscription();
      setIsSubscribed(Boolean(browserSubscription));
    } catch {
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setIsSupported(getBrowserPushSupport());
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "default");
    void refreshSubscriptionState();
  }, [refreshSubscriptionState]);

  const subscribe = useCallback(async () => {
    if (!userId) throw new Error("You must be signed in to enable notifications.");
    if (!isSupported) throw new Error("Push notifications are not supported in this browser.");
    if (!getVapidPublicKey()) {
      throw new Error("Push notifications are not configured for this app.");
    }

    setBlockedMessage(null);

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "denied") {
      setBlockedMessage(
        "Notifications are blocked. Please enable them in your browser settings.",
      );
      throw new Error("Notifications are blocked.");
    }

    if (result !== "granted") {
      throw new Error("Notification permission was not granted.");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
      }));

    await savePushSubscription(userId, subscription.toJSON());
    setIsSubscribed(true);
  }, [isSupported, userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return;

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removePushSubscription(userId, subscription.endpoint);
    } else {
      await removePushSubscription(userId);
    }

    setIsSubscribed(false);
  }, [userId]);

  return {
    isSubscribed,
    isSupported,
    permission,
    blockedMessage,
    loading,
    subscribe,
    unsubscribe,
    refreshSubscriptionState,
  };
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
