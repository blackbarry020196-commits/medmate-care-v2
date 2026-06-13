import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendPushToUser } from "./_lib/push";
import { getSupabaseAdmin, isAuthorizedInternalRequest } from "./_lib/supabase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as { userId?: string; title?: string; body?: string; url?: string } | undefined;
  const userId = body?.userId?.trim();
  const title = body?.title?.trim();
  const messageBody = body?.body?.trim();
  const url = body?.url?.trim() ?? "/";

  if (!userId || !title || !messageBody) {
    return res.status(400).json({ error: "Missing userId, title, or body." });
  }

  const authorizedInternal = isAuthorizedInternalRequest(req);

  if (!authorizedInternal) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid session" });
    }
    if (data.user.id !== userId) {
      return res.status(403).json({ error: "Cannot send notifications for another user." });
    }
  }

  try {
    const result = await sendPushToUser(userId, { title, body: messageBody, url });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("send-notification error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send notification.",
    });
  }
}
