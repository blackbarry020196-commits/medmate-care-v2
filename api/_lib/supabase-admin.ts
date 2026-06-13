import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "https://njagaleltosuqoazmokx.supabase.co";

export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient<Database>(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getPushApiSecret() {
  return process.env.PUSH_API_SECRET?.trim() ?? "";
}

export function isAuthorizedInternalRequest(req: { headers: Record<string, string | string[] | undefined> }) {
  const secret = getPushApiSecret();
  if (!secret) return false;
  const header = req.headers.authorization ?? req.headers["x-push-secret"];
  const value = Array.isArray(header) ? header[0] : header;
  return value === `Bearer ${secret}` || value === secret;
}
