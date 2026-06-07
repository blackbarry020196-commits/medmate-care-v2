import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and add your Supabase credentials.",
  );
}

export const supabase = createClient<Database>(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder",
);
