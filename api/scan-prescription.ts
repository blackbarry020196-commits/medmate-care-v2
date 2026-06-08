import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
  maxDuration: 60,
};

const SYSTEM_PROMPT = `You are a medical prescription reader. Extract all medications from this NHS prescription image. 
Return ONLY a JSON array with no extra text, in this format:
[
  {
    name: string,
    dosage: string,
    frequency: string,
    times: string[],
    duration: string,
    instructions: string
  }
]
If you cannot read the prescription clearly, return an empty array [].
Frequency examples: once daily, twice daily, three times daily.
Times examples: ['08:00'] or ['08:00', '20:00'] or ['08:00', '14:00', '20:00']`;

export type ScannedMedication = {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  duration: string;
  instructions: string;
};

function parseMedications(content: string): ScannedMedication[] {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      name: String(item.name ?? "").trim(),
      dosage: String(item.dosage ?? "").trim(),
      frequency: String(item.frequency ?? "").trim(),
      times: Array.isArray(item.times) ? item.times.map((t) => String(t).trim()).filter(Boolean) : [],
      duration: String(item.duration ?? "").trim(),
      instructions: String(item.instructions ?? "").trim(),
    }))
    .filter((item) => item.name.length > 0);
}

function openAiErrorMessage(status: number, errText: string): string {
  try {
    const parsed = JSON.parse(errText) as {
      error?: { message?: string; code?: string; type?: string };
    };
    const code = parsed.error?.code ?? "";
    const message = parsed.error?.message ?? "";

    if (status === 401 || code === "invalid_api_key") {
      return "OpenAI API key is invalid. In Vercel, set OPENAI_API_KEY to a valid key from platform.openai.com.";
    }
    if (code === "insufficient_quota" || message.toLowerCase().includes("quota")) {
      return "OpenAI account has no credits. Add billing at platform.openai.com, then try again.";
    }
    if (code === "model_not_found") {
      return "GPT-4o is not available on your OpenAI account. Check model access in OpenAI settings.";
    }
    if (message) return message;
  } catch {
    // fall through
  }
  return "Could not read the prescription. Please try again.";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === "your-openai-api-key") {
    return res.status(500).json({
      error: "OpenAI API key is not configured. Add OPENAI_API_KEY in Vercel → Settings → Environment Variables.",
    });
  }

  const body = req.body as { image?: string; mimeType?: string } | undefined;
  const image = body?.image;
  const mimeType = body?.mimeType ?? "image/jpeg";

  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Missing image data." });
  }

  if (!mimeType.startsWith("image/")) {
    return res.status(400).json({ error: "Only image files are supported. Please upload JPG or PNG." });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all medications from this NHS prescription image." },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${image}` },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", errText);
      return res.status(502).json({ error: openAiErrorMessage(openaiRes.status, errText) });
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "[]";
    const medications = parseMedications(content);

    return res.status(200).json({ medications });
  } catch (error) {
    console.error("Scan prescription error:", error);
    return res.status(500).json({ error: "Could not read the prescription. Please try again." });
  }
}
