import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, ScanLine, Shield, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/medmate/PageHeader";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { prepareImageForScan } from "@/lib/image-compress";
import { ACCEPTED_SCAN_EXTENSIONS, scanPrescriptionImage, type ScannedMedication } from "@/lib/prescription-scan";
import { saveScannedMedications } from "@/lib/save-scanned-meds";

type Step = "capture" | "preview" | "scanning" | "confirm" | "error";

export default function ScanPrescriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<{ base64: string; mimeType: string } | null>(null);
  const [medications, setMedications] = useState<ScannedMedication[]>([]);
  const [errorMessage, setErrorMessage] = useState(
    "We couldn't read this prescription clearly. Please try again or add medications manually.",
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;

    try {
      const prepared = await prepareImageForScan(file);
      setPreviewUrl(prepared.previewUrl);
      setImagePayload({ base64: prepared.base64, mimeType: prepared.mimeType });
      setStep("preview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the image.");
    }
  }

  async function runScan() {
    if (!imagePayload) return;
    setStep("scanning");

    try {
      const results = await scanPrescriptionImage(imagePayload.base64, imagePayload.mimeType);
      if (results.length === 0) {
        setErrorMessage(
          "We couldn't read this prescription clearly. Please try again or add medications manually.",
        );
        setStep("error");
        return;
      }
      setMedications(results);
      setStep("confirm");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't read this prescription clearly. Please try again or add medications manually.",
      );
      setStep("error");
    }
  }

  function resetScan() {
    setStep("capture");
    setPreviewUrl(null);
    setImagePayload(null);
    setMedications([]);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  function updateMedication(index: number, patch: Partial<ScannedMedication>) {
    setMedications((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateTimes(index: number, value: string) {
    const times = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateMedication(index, { times: times.length > 0 ? times : ["08:00"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const valid = medications.filter((m) => m.name.trim() && m.dosage.trim() && m.frequency.trim());
      if (valid.length === 0) throw new Error("Please fill in at least one medication.");
      await saveScannedMedications(user!.id, valid);
    },
    onSuccess: () => {
      toast.success(`${medications.length} medication${medications.length === 1 ? "" : "s"} added`);
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["schedule", "today"] });
      navigate("/medications");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (step === "scanning") {
    return (
      <>
        <PageHeader title="Scan prescription" subtitle="Reading your NHS prescription." />
        <LoadingCard label="Reading your prescription…" />
      </>
    );
  }

  if (step === "error") {
    return (
      <>
        <PageHeader title="Scan prescription" subtitle="Something went wrong." />
        <Card>
          <CardContent className="space-y-6 p-8 text-center">
            <ScanLine className="mx-auto h-14 w-14 text-muted-foreground" />
            <p className="text-lg">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={resetScan}>
                Scan Again
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/medications">Add medications manually</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (step === "confirm") {
    return (
      <>
        <PageHeader
          title="Confirm medications"
          subtitle="Check the details below, edit if needed, then add to your list."
        />

        <div className="space-y-4">
          {medications.map((med, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">Medication {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={med.name}
                    onChange={(e) => updateMedication(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                  <Input
                    id={`dosage-${index}`}
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                  <Input
                    id={`frequency-${index}`}
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, { frequency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`times-${index}`}>Times (comma separated, 24h)</Label>
                  <Input
                    id={`times-${index}`}
                    value={med.times.join(", ")}
                    onChange={(e) => updateTimes(index, e.target.value)}
                    placeholder="08:00, 20:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`duration-${index}`}>Duration</Label>
                  <Input
                    id={`duration-${index}`}
                    value={med.duration}
                    onChange={(e) => updateMedication(index, { duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`instructions-${index}`}>Instructions</Label>
                  <Textarea
                    id={`instructions-${index}`}
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, { instructions: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving…
              </>
            ) : (
              "Add All to My Meds"
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={resetScan}>
            Scan Again
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Scan prescription" subtitle="Add your medications quickly from an NHS prescription." />

      {step === "preview" && previewUrl && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Preview</CardTitle>
            <CardDescription>Make sure the text is clear before scanning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              src={previewUrl}
              alt="Prescription preview"
              className="max-h-80 w-full rounded-xl border object-contain"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="sm:flex-1" onClick={runScan}>
                <ScanLine className="h-6 w-6" />
                Read prescription
              </Button>
              <Button size="lg" variant="outline" className="sm:flex-1" onClick={resetScan}>
                Choose another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "capture" && (
        <>
          <Card className="mb-6">
            <CardContent className="space-y-6 p-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-accent text-primary">
                <Camera className="h-12 w-12" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Scan your prescription</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  Take a clear photo of your prescription in good lighting.
                </p>
              </div>

              <input
                ref={cameraRef}
                type="file"
                accept={ACCEPTED_SCAN_EXTENSIONS}
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={uploadRef}
                type="file"
                accept={ACCEPTED_SCAN_EXTENSIONS}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <div className="flex flex-col gap-3">
                <Button size="lg" className="w-full" onClick={() => cameraRef.current?.click()}>
                  <Camera className="h-6 w-6" />
                  Take a photo
                </Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => uploadRef.current?.click()}>
                  <Upload className="h-6 w-6" />
                  Upload an image
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-5 text-base text-muted-foreground">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p>Your prescription image is processed securely and never stored.</p>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
