import { formatTime12h } from "@/lib/schedule";
import type { TodayMedStatus } from "@/lib/medication-logs";
import { Badge } from "@/components/ui/badge";

type MedicationStatusListProps = {
  items: TodayMedStatus[];
};

function statusVariant(status: TodayMedStatus["status"]) {
  if (status === "taken") return "success" as const;
  if (status === "missed") return "danger" as const;
  return "muted" as const;
}

function statusLabel(status: TodayMedStatus["status"]) {
  if (status === "taken") return "Taken";
  if (status === "missed") return "Missed";
  return "Upcoming";
}

export function MedicationStatusList({ items }: MedicationStatusListProps) {
  if (items.length === 0) {
    return <p className="text-lg text-muted-foreground">No medications scheduled today.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
          <div>
            <p className="text-lg font-semibold">{item.medication_name}</p>
            <p className="text-base text-muted-foreground">{formatTime12h(item.scheduled_time)}</p>
          </div>
          <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
        </li>
      ))}
    </ul>
  );
}
