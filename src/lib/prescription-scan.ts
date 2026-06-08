export type ScannedMedication = {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  duration: string;
  instructions: string;
};

export const ACCEPTED_SCAN_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "application/pdf"];
export const ACCEPTED_SCAN_EXTENSIONS = ".jpg,.jpeg,.png,.heic,.heif,.pdf";

export async function scanPrescriptionImage(imageBase64: string, mimeType: string): Promise<ScannedMedication[]> {
  const res = await fetch("/api/scan-prescription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, mimeType }),
  });

  const data = (await res.json()) as { medications?: ScannedMedication[]; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Could not read the prescription.");
  }

  return data.medications ?? [];
}
