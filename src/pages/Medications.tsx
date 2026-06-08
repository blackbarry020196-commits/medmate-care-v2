import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Pencil, Pill, Plus, ScanLine, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { FREQUENCY_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Medication } from "@/integrations/supabase/types";

type FormState = {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  start_date: string;
};

const emptyForm = (): FormState => ({
  name: "",
  dosage: "",
  frequency: "",
  instructions: "",
  start_date: format(new Date(), "yyyy-MM-dd"),
});

export default function MedicationsPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const qc = useQueryClient();

  const medsQ = useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Medication[];
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Medication | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setSheetOpen(true);
  };

  const openEdit = (m: Medication) => {
    setEditing(m);
    setForm({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      instructions: m.instructions ?? "",
      start_date: m.start_date,
    });
    setSheetOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.dosage.trim() || !form.frequency) {
        throw new Error("Please fill in name, dosage, and frequency.");
      }
      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        instructions: form.instructions.trim() || null,
        start_date: form.start_date,
      };
      if (editing) {
        const { error } = await supabase.from("medications").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("medications").insert({ ...payload, user_id: userId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Medication updated" : "Medication added");
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
      setSheetOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medications").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Medication deleted");
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const meds = medsQ.data ?? [];

  return (
    <>
      <PageHeader title="Medications" subtitle="All the medications you take, in one place." />

      <Button size="lg" variant="secondary" className="mb-3 w-full" asChild>
        <Link to="/dashboard/scan">
          <ScanLine className="h-6 w-6" />
          Scan Prescription
        </Link>
      </Button>

      <Button size="lg" className="mb-6 w-full" onClick={openAdd}>
        <Plus className="h-6 w-6" />
        Add Medication
      </Button>

      {medsQ.isLoading ? (
        <LoadingCard label="Loading your medications…" />
      ) : meds.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
              <Pill className="h-8 w-8" />
            </div>
            <h3 className="mb-2">No medications yet</h3>
            <p className="mb-5 text-lg text-muted-foreground">Add your first medication to get started.</p>
            <Button size="lg" onClick={openAdd}>
              <Plus className="h-6 w-6" />
              Add Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {meds.map((m) => (
            <li key={m.id}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold">{m.name}</h3>
                  <p className="mt-2 text-lg">
                    <span className="text-muted-foreground">Dosage: </span>
                    {m.dosage}
                  </p>
                  <p className="mt-1 text-lg">
                    <span className="text-muted-foreground">Frequency: </span>
                    {m.frequency}
                  </p>
                  {m.instructions && <p className="mt-2 text-base text-muted-foreground">{m.instructions}</p>}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" variant="outline" className="sm:flex-1" onClick={() => openEdit(m)}>
                      <Pencil className="h-6 w-6" />
                      Edit
                    </Button>
                    <Button size="lg" variant="destructive" className="sm:flex-1" onClick={() => setConfirmDelete(m)}>
                      <Trash2 className="h-6 w-6" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-6">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit medication" : "Add medication"}</SheetTitle>
            <SheetDescription>Fill in the details below and tap save.</SheetDescription>
          </SheetHeader>
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="med-name">Medication name</Label>
              <Input id="med-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-dosage">Dosage</Label>
              <Input id="med-dosage" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-frequency">Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger id="med-frequency">
                  <SelectValue placeholder="How often do you take it?" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-instructions">Instructions (optional)</Label>
              <Textarea id="med-instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} maxLength={1000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-start">Start date</Label>
              <Input id="med-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button type="submit" size="lg" className="sm:flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save medication"}
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
            <AlertDialogTitle>Delete medication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{confirmDelete?.name}</strong> and its reminders. This cannot be undone.
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
