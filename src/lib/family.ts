import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/integrations/supabase/types";

export const INVITE_TOKEN_KEY = "medmate_invite_token";

export function savePendingInviteToken(token: string) {
  sessionStorage.setItem(INVITE_TOKEN_KEY, token);
}

export function getPendingInviteToken(): string | null {
  return sessionStorage.getItem(INVITE_TOKEN_KEY);
}

export function clearPendingInviteToken() {
  sessionStorage.removeItem(INVITE_TOKEN_KEY);
}

export async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.role as UserRole) ?? "patient";
}

export function dashboardPathForRole(role: UserRole): string {
  return role === "family" ? "/dashboard/family" : "/dashboard";
}

export async function resolvePostAuthPath(userId: string): Promise<string> {
  const token = getPendingInviteToken();
  if (token) {
    const { data, error } = await supabase.rpc("accept_family_invite", { invite_token: token });
    if (error) throw new Error(error.message);
    clearPendingInviteToken();
    if (data) return "/dashboard/family";
  }
  const role = await fetchUserRole(userId);
  return dashboardPathForRole(role);
}

export async function createFamilyInvite(patientId: string): Promise<string> {
  const token = crypto.randomUUID();
  const { error } = await supabase.from("family_invites").insert({
    patient_id: patientId,
    token,
  });
  if (error) throw new Error(error.message);
  return `${window.location.origin}/invite?token=${token}`;
}

export type InvitePreview = {
  invite_id: string;
  patient_name: string;
  accepted: boolean;
};

export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc("get_invite_preview", { invite_token: token });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as InvitePreview;
}

export async function acceptInviteIfPending(userId: string): Promise<boolean> {
  const token = getPendingInviteToken();
  if (!token) return false;
  const { error } = await supabase.rpc("accept_family_invite", { invite_token: token });
  if (error) throw new Error(error.message);
  clearPendingInviteToken();
  return true;
}

export async function fetchLinkedPatients(familyUserId: string) {
  const { data: links, error: linkErr } = await supabase
    .from("family_links")
    .select("patient_id")
    .eq("family_user_id", familyUserId);
  if (linkErr) throw new Error(linkErr.message);
  const patientIds = (links ?? []).map((l) => l.patient_id);
  if (patientIds.length === 0) return [];

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, full_name, phone, updated_at")
    .in("id", patientIds);
  if (profErr) throw new Error(profErr.message);
  return profiles ?? [];
}
