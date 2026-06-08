import { cn } from "@/lib/utils";

type AdherenceScoreProps = {
  score: number;
  className?: string;
};

export function AdherenceScore({ score, className }: AdherenceScoreProps) {
  const color =
    score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600";
  const bg =
    score >= 90 ? "bg-emerald-50" : score >= 70 ? "bg-amber-50" : "bg-red-50";

  return (
    <div className={cn("rounded-2xl p-4 text-center", bg, className)}>
      <p className="text-sm font-medium text-muted-foreground">Weekly adherence</p>
      <p className={cn("mt-1 text-4xl font-bold", color)}>{score}%</p>
    </div>
  );
}
