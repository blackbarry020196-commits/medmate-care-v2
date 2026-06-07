export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "patient" | "family";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: "patient" | "family";
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: "patient" | "family";
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
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type DoseLog = Database["public"]["Tables"]["dose_logs"]["Row"];

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
