import { Phone } from "lucide-react";
import { AdherenceScore } from "@/components/family/AdherenceScore";
import { MedicationStatusList } from "@/components/family/MedicationStatusList";
import { MissedMedAlert } from "@/components/family/MissedMedAlert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/medication-logs";
import type { TodayMedStatus } from "@/lib/medication-logs";

export type PatientDashboardData = {
  id: string;
  full_name: string;
  phone: string | null;
  updated_at: string | null;
  adherence: number;
  todayMeds: TodayMedStatus[];
  recentMissed: { medication_name: string; scheduled_time: string }[];
};

type PatientCardProps = {
  patient: PatientDashboardData;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PatientCard({ patient }: PatientCardProps) {
  const firstName = patient.full_name.split(" ")[0] || patient.full_name;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>{initials(patient.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{patient.full_name}</CardTitle>
            <p className="text-base text-muted-foreground">{formatRelativeTime(patient.updated_at)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <MissedMedAlert missed={patient.recentMissed} />
        <AdherenceScore score={patient.adherence} />
        <div>
          <h3 className="mb-3 text-lg font-bold">Today&apos;s schedule</h3>
          <MedicationStatusList items={patient.todayMeds} />
        </div>
        {patient.phone ? (
          <Button size="lg" className="w-full" asChild>
            <a href={`tel:${patient.phone}`}>
              <Phone className="h-6 w-6" />
              Call {firstName}
            </a>
          </Button>
        ) : (
          <p className="text-base text-muted-foreground">No phone number on file for {firstName}.</p>
        )}
      </CardContent>
    </Card>
  );
}
