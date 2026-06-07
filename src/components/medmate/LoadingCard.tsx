import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard({ label = "Loading…" }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-3 p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">{label}</p>
      </CardContent>
    </Card>
  );
}
