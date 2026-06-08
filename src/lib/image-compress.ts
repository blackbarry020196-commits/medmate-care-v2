const MAX_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress the image."))),
      type,
      quality,
    );
  });
}

async function compressWithCanvas(file: File, maxBytes: number): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const mimeType = "image/jpeg";
  let scale = 1;
  let quality = 0.92;

  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process the image.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (blob.size <= maxBytes) {
      const compressedUrl = URL.createObjectURL(blob);
      const base64 = dataUrlToBase64(await readFileAsDataUrl(new File([blob], file.name, { type: mimeType })));
      return { base64, mimeType, previewUrl: compressedUrl };
    }

    quality -= 0.12;
    scale *= 0.85;
    if (quality < 0.4) quality = 0.4;
  }

  throw new Error("Image is too large. Please try a smaller photo.");
}

export async function prepareImageForScan(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  if (file.type === "application/pdf") {
    throw new Error("PDF is not supported yet. Please take a photo of your prescription or upload a JPG/PNG image.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a JPG, PNG, or HEIC image.");
  }

  if (file.size <= MAX_BYTES && (file.type === "image/jpeg" || file.type === "image/png")) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      base64: dataUrlToBase64(dataUrl),
      mimeType: file.type,
      previewUrl: dataUrl,
    };
  }

  return compressWithCanvas(file, MAX_BYTES);
}
