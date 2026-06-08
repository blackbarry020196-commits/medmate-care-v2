import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatTime12h } from "@/lib/schedule";

type MissedMed = {
  medication_name: string;
  scheduled_time: string;
};

type MissedMedAlertProps = {
  missed: MissedMed[];
};

export function MissedMedAlert({ missed }: MissedMedAlertProps) {
  if (missed.length === 0) return null;

  const latest = missed[0];
  const time = formatTime12h(
    `${String(new Date(latest.scheduled_time).getHours()).padStart(2, "0")}:${String(new Date(latest.scheduled_time).getMinutes()).padStart(2, "0")}`,
  );

  return (
    <Alert className="border-red-200 bg-red-50 text-red-900">
      <AlertTitle>Missed medication</AlertTitle>
      <AlertDescription>
        {missed.length === 1 ? (
          <>
            ⚠️ {latest.medication_name} was missed at {time}
          </>
        ) : (
          <>
            ⚠️ {missed.length} medications missed in the last 24 hours, including {latest.medication_name} at {time}
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
