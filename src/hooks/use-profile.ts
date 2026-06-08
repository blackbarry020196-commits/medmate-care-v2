import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/integrations/supabase/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, phone")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as { full_name: string; role: UserRole; phone: string | null } | null;
    },
  });
}
