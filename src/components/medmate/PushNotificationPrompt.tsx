import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";

type PushState = ReturnType<typeof usePushNotifications>;

type PushNotificationPromptProps = {
  title: string;
  description: string;
  buttonLabel: string;
  push: PushState;
  variant?: "card" | "banner";
  onSubscribed?: () => void;
  onSkipped?: () => void;
  showSkip?: boolean;
};

export function PushNotificationPrompt({
  title,
  description,
  buttonLabel,
  push,
  variant = "card",
  onSubscribed,
  onSkipped,
  showSkip = false,
}: PushNotificationPromptProps) {

  if (push.isSubscribed || !push.isSupported) {
    return null;
  }

  async function handleSubscribe() {
    try {
      await push.subscribe();
      toast.success("Notifications enabled");
      onSubscribed?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not enable notifications.";
      if (!push.blockedMessage) toast.error(message);
    }
  }

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bell className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-base text-muted-foreground">{description}</p>
          {push.blockedMessage && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <BellOff className="h-4 w-4" />
              {push.blockedMessage}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="w-full sm:w-auto" disabled={push.loading} onClick={handleSubscribe}>
          {push.loading ? "Checking…" : buttonLabel}
        </Button>
        {showSkip && (
          <Button size="lg" variant="ghost" className="w-full sm:w-auto" onClick={onSkipped}>
            Not now
          </Button>
        )}
      </div>
    </>
  );

  if (variant === "banner") {
    return (
      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="space-y-4">{content}</div>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="space-y-4 p-6">{content}</CardContent>
    </Card>
  );
}
