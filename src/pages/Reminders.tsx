import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/medmate/PageHeader";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { DAY_FULL_NAMES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { formatTime12h } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { ReminderWithMed } from "@/integrations/supabase/types";

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatDays(days: string[]) {
  if (days.length === 0) return "No days selected";
  if (days.length === 7) return "Every day";
  return DAY_FULL_NAMES.filter((d) => days.includes(d))
    .map((d) => d.slice(0, 3))
    .join(", ");
}

export default function RemindersPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const qc = useQueryClient();

  const remindersQ = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, medications!inner(id, name, dosage, instructions, is_active)")
        .eq("user_id", userId)
        .order("scheduled_time", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ReminderWithMed[];
    },
  });

  const medsQ = useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medications").select("id, name, dosage").eq("user_id", userId).eq("is_active", true);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [medId, setMedId] = useState("");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<string[]>([...DAY_FULL_NAMES]);
  const [confirmDelete, setConfirmDelete] = useState<ReminderWithMed | null>(null);

  const openAdd = () => {
    setMedId("");
    setTime("08:00");
    setDays([...DAY_FULL_NAMES]);
    setSheetOpen(true);
  };

  const toggleDay = (day: string) => {
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!medId) throw new Error("Please choose a medication.");
      if (days.length === 0) throw new Error("Please select at least one day.");
      const { error } = await supabase.from("reminders").insert({
        user_id: userId,
        medication_id: medId,
        scheduled_time: `${time}:00`,
        days_of_week: days,
        is_active: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Reminder added");
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
      setSheetOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("reminders").update({ is_active }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Reminder deleted");
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reminders = (remindersQ.data ?? []).filter((r) => r.medications?.is_active);
  const meds = medsQ.data ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: ReminderWithMed[] }>();
    for (const r of reminders) {
      const g = map.get(r.medication_id) ?? { name: r.medications.name, items: [] };
      g.items.push(r);
      map.set(r.medication_id, g);
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
    }));
  }, [reminders]);

  return (
    <>
      <PageHeader title="Reminders" subtitle="Daily reminders for each medication." />

      <Button size="lg" className="mb-6 w-full" onClick={openAdd} disabled={meds.length === 0}>
        <Plus className="h-6 w-6" />
        Add Reminder
      </Button>

      {meds.length === 0 && !medsQ.isLoading && (
        <Card className="mb-6">
          <CardContent className="p-6 text-lg text-muted-foreground">Add a medication first before creating reminders.</CardContent>
        </Card>
      )}

      {remindersQ.isLoading ? (
        <LoadingCard label="Loading your reminders…" />
      ) : reminders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2">No reminders yet</h3>
            <p className="mb-5 text-lg text-muted-foreground">
              {meds.length === 0 ? "Add a medication first, then set a reminder time." : "Tap Add Reminder to choose a time and days."}
            </p>
            {meds.length > 0 && (
              <Button size="lg" onClick={openAdd}>
                <Plus className="h-6 w-6" />
                Add Reminder
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.name}>
              <h2 className="mb-3 text-xl font-bold">{group.name}</h2>
              <ul className="space-y-4">
                {group.items.map((r) => (
                  <li key={r.id}>
                    <Card className={cn(!r.is_active && "opacity-60")}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-5 w-5" />
                          <span>Reminder</span>
                        </div>
                        <p className="mt-1 text-3xl font-bold">{formatTime12h(String(r.scheduled_time).slice(0, 5))}</p>
                        <p className="mt-2 text-lg">{formatDays(r.days_of_week)}</p>
                        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-4">
                          <Label htmlFor={`active-${r.id}`}>{r.is_active ? "Active" : "Paused"}</Label>
                          <Switch
                            id={`active-${r.id}`}
                            checked={r.is_active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: r.id, is_active: checked })}
                          />
                        </div>
                        <Button size="lg" variant="destructive" className="mt-4 w-full" onClick={() => setConfirmDelete(r)}>
                          <Trash2 className="h-6 w-6" />
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-6">
          <SheetHeader>
            <SheetTitle>Add reminder</SheetTitle>
            <SheetDescription>Pick the medication, time and days for your reminder.</SheetDescription>
          </SheetHeader>
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="rem-med">Medication</Label>
              <Select value={medId} onValueChange={setMedId}>
                <SelectTrigger id="rem-med">
                  <SelectValue placeholder="Choose a medication" />
                </SelectTrigger>
                <SelectContent>
                  {meds.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} — {m.dosage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rem-time">Time</Label>
              <Input id="rem-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Days</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setDays([...DAY_FULL_NAMES])}>
                  Every Day
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAY_FULL_NAMES.map((full, i) => {
                  const selected = days.includes(full);
                  return (
                    <button
                      key={full}
                      type="button"
                      onClick={() => toggleDay(full)}
                      aria-pressed={selected}
                      className={cn(
                        "h-14 rounded-xl border-2 text-base font-semibold transition",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      {DAY_SHORT[i]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button type="submit" size="lg" className="sm:flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save reminder"}
              </Button>
              <Button type="button" size="lg" variant="outline" className="sm:flex-1" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the {confirmDelete && formatTime12h(String(confirmDelete.scheduled_time).slice(0, 5))} reminder for{" "}
              <strong>{confirmDelete?.medications.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) deleteMutation.mutate(confirmDelete.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
