export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounting_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          external_id: string | null
          id: string
          metadata: Json
          provider: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          external_id?: string | null
          id?: string
          metadata?: Json
          provider: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json
          provider?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alert_deliveries: {
        Row: {
          alert_id: string
          channel: string
          error: string | null
          id: string
          provider_id: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          alert_id: string
          channel: string
          error?: string | null
          id?: string
          provider_id?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          channel?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          amount: number
          channel: string | null
          created_at: string
          delivery_status: string
          id: string
          leak_id: string | null
          leak_type: string
          message: string
          read: boolean
          report_id: string | null
          severity: string
          thread: Json
          user_id: string
        }
        Insert: {
          amount?: number
          channel?: string | null
          created_at?: string
          delivery_status?: string
          id?: string
          leak_id?: string | null
          leak_type: string
          message: string
          read?: boolean
          report_id?: string | null
          severity?: string
          thread?: Json
          user_id: string
        }
        Update: {
          amount?: number
          channel?: string | null
          created_at?: string
          delivery_status?: string
          id?: string
          leak_id?: string | null
          leak_type?: string
          message?: string
          read?: boolean
          report_id?: string | null
          severity?: string
          thread?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string
          detail: Json
          event: string
          id: string
          ip: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: Json
          event: string
          id?: string
          ip?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: Json
          event?: string
          id?: string
          ip?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      finding_states: {
        Row: {
          assignee: string | null
          finding_key: string
          id: string
          note: string | null
          report_id: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee?: string | null
          finding_key: string
          id?: string
          note?: string | null
          report_id: string
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee?: string | null
          finding_key?: string
          id?: string
          note?: string | null
          report_id?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finding_states_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms_at: string | null
          accepted_terms_version: string | null
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          notify_email: boolean
          notify_whatsapp: boolean
          plan: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          upload_limit: number
          whatsapp: string | null
        }
        Insert: {
          accepted_terms_at?: string | null
          accepted_terms_version?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          notify_email?: boolean
          notify_whatsapp?: boolean
          plan?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          upload_limit?: number
          whatsapp?: string | null
        }
        Update: {
          accepted_terms_at?: string | null
          accepted_terms_version?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notify_email?: boolean
          notify_whatsapp?: boolean
          plan?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          upload_limit?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          user_id: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          bucket?: string
          count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          analysis_state: Json
          agent_results: Json
          alerts_sent_at: string | null
          business_name: string
          created_at: string
          extracted_text: string | null
          id: string
          methodology: Json
          narrative: Json | null
          payload: Json
          status: string
          report_version: number
          title: string
          totals: Json
          upload_ids: string[]
          user_id: string
        }
        Insert: {
          analysis_state?: Json
          agent_results?: Json
          alerts_sent_at?: string | null
          business_name: string
          created_at?: string
          extracted_text?: string | null
          id?: string
          methodology?: Json
          narrative?: Json | null
          payload: Json
          status?: string
          report_version?: number
          title?: string
          totals?: Json
          upload_ids?: string[]
          user_id: string
        }
        Update: {
          analysis_state?: Json
          agent_results?: Json
          alerts_sent_at?: string | null
          business_name?: string
          created_at?: string
          extracted_text?: string | null
          id?: string
          methodology?: Json
          narrative?: Json | null
          payload?: Json
          status?: string
          report_version?: number
          title?: string
          totals?: Json
          upload_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          content_hash: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          id: string
          mime_type: string | null
          report_id: string | null
          size: string | null
          source: string | null
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          report_id?: string | null
          size?: string | null
          source?: string | null
          status?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          report_id?: string | null
          size?: string | null
          source?: string | null
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          amount: number
          cost_cents: number
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          amount?: number
          cost_cents?: number
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          amount?: number
          cost_cents?: number
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rl_check: {
        Args: { _bucket: string; _limit: number; _window_minutes: number }
        Returns: boolean
      }
      rl_check_for: {
        Args: {
          _bucket: string
          _limit: number
          _user: string
          _window_minutes: number
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "accountant"],
    },
  },
} as const
