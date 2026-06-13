export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "patient" | "family";
export type MedLogStatus = "taken" | "missed" | "upcoming";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
          phone?: string | null;
          updated_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string;
          frequency: string;
          instructions: string | null;
          start_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage: string;
          frequency: string;
          instructions?: string | null;
          start_date?: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          dosage?: string;
          frequency?: string;
          instructions?: string | null;
          start_date?: string;
          is_active?: boolean;
        };
      };
      reminders: {
        Row: {
          id: string;
          medication_id: string;
          user_id: string;
          scheduled_time: string;
          days_of_week: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          medication_id: string;
          user_id: string;
          scheduled_time: string;
          days_of_week: string[];
          is_active?: boolean;
        };
        Update: {
          scheduled_time?: string;
          days_of_week?: string[];
          is_active?: boolean;
        };
      };
      dose_logs: {
        Row: {
          id: string;
          reminder_id: string;
          user_id: string;
          scheduled_at: string;
          taken_at: string | null;
          status: "taken" | "missed" | "pending";
          created_at: string;
        };
        Insert: {
          id?: string;
          reminder_id: string;
          user_id: string;
          scheduled_at: string;
          taken_at?: string | null;
          status?: "taken" | "missed" | "pending";
        };
        Update: {
          taken_at?: string | null;
          status?: "taken" | "missed" | "pending";
        };
      };
      family_invites: {
        Row: {
          id: string;
          patient_id: string;
          email: string | null;
          token: string;
          accepted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          email?: string | null;
          token: string;
          accepted?: boolean;
        };
        Update: {
          email?: string | null;
          accepted?: boolean;
        };
      };
      family_links: {
        Row: {
          id: string;
          family_user_id: string;
          patient_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_user_id: string;
          patient_id: string;
        };
        Update: Record<string, never>;
      };
      medication_logs: {
        Row: {
          id: string;
          patient_id: string;
          medication_id: string;
          scheduled_time: string;
          taken_at: string | null;
          status: MedLogStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          medication_id: string;
          scheduled_time: string;
          taken_at?: string | null;
          status?: MedLogStatus;
        };
        Update: {
          taken_at?: string | null;
          status?: MedLogStatus;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription: Json;
        };
        Update: {
          subscription?: Json;
        };
      };
      push_notification_log: {
        Row: {
          id: string;
          medication_log_id: string;
          family_user_id: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          medication_log_id: string;
          family_user_id: string;
          sent_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Functions: {
      get_invite_preview: {
        Args: { invite_token: string };
        Returns: { invite_id: string; patient_name: string; accepted: boolean }[];
      };
      accept_family_invite: {
        Args: { invite_token: string };
        Returns: string;
      };
      sync_medication_logs: {
        Args: { p_patient_id: string };
        Returns: undefined;
      };
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type DoseLog = Database["public"]["Tables"]["dose_logs"]["Row"];
export type FamilyInvite = Database["public"]["Tables"]["family_invites"]["Row"];
export type FamilyLink = Database["public"]["Tables"]["family_links"]["Row"];
export type MedicationLog = Database["public"]["Tables"]["medication_logs"]["Row"];

export type ReminderWithMed = Reminder & {
  medications: Pick<Medication, "id" | "name" | "dosage" | "instructions" | "is_active">;
};

export type ScheduleItem = {
  reminder_id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  instructions: string | null;
  scheduled_time: string;
  scheduled_at: string;
  status: "taken" | "missed" | "pending";
  log_id: string | null;
};
