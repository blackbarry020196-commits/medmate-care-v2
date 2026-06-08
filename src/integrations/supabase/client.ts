import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://njagaleltosuqoazmokx.supabase.co";

/** Known typo from an earlier misconfigured Vercel env var. */
function normalizeSupabaseUrl(raw: string | undefined) {
  if (!raw) return SUPABASE_URL;
  return raw.replace("njagaleltostuqoazmokx", "njagaleltosuqoazmokx");
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!anonKey) {
  console.warn(
    "Missing VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and add your Supabase credentials.",
  );
}

export const supabase = createClient<Database>(url, anonKey ?? "placeholder");
