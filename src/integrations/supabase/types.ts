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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      consumables: {
        Row: {
          cost: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      electricity_settings: {
        Row: {
          contracted_power_kva: number
          created_at: string
          daily_fixed_cost: number | null
          id: string
          name: string
          notes: string | null
          price_per_kwh: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contracted_power_kva?: number
          created_at?: string
          daily_fixed_cost?: number | null
          id?: string
          name: string
          notes?: string | null
          price_per_kwh?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contracted_power_kva?: number
          created_at?: string
          daily_fixed_cost?: number | null
          id?: string
          name?: string
          notes?: string | null
          price_per_kwh?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      filaments: {
        Row: {
          brand: string | null
          color: string | null
          cost_per_gram: number
          created_at: string
          id: string
          material: string | null
          name: string
          spool_cost: number | null
          spool_weight_grams: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          color?: string | null
          cost_per_gram?: number
          created_at?: string
          id?: string
          material?: string | null
          name: string
          spool_cost?: number | null
          spool_weight_grams?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          color?: string | null
          cost_per_gram?: number
          created_at?: string
          id?: string
          material?: string | null
          name?: string
          spool_cost?: number | null
          spool_weight_grams?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          monthly_amount: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_amount?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_amount?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      labor_settings: {
        Row: {
          created_at: string
          id: string
          post_processing_rate_per_hour: number
          preparation_rate_per_hour: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_processing_rate_per_hour?: number
          preparation_rate_per_hour?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_processing_rate_per_hour?: number
          preparation_rate_per_hour?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      print_templates: {
        Row: {
          additional_work_minutes: number | null
          clean_supports_minutes: number | null
          created_at: string
          electricity_settings_id: string | null
          filament_id: string | null
          id: string
          name: string
          preparation_time_minutes: number | null
          print_start_time_minutes: number | null
          printer_id: string | null
          profit_margin_percent: number | null
          remove_from_plate_minutes: number | null
          shipping_option_id: string | null
          slicing_time_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_work_minutes?: number | null
          clean_supports_minutes?: number | null
          created_at?: string
          electricity_settings_id?: string | null
          filament_id?: string | null
          id?: string
          name: string
          preparation_time_minutes?: number | null
          print_start_time_minutes?: number | null
          printer_id?: string | null
          profit_margin_percent?: number | null
          remove_from_plate_minutes?: number | null
          shipping_option_id?: string | null
          slicing_time_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_work_minutes?: number | null
          clean_supports_minutes?: number | null
          created_at?: string
          electricity_settings_id?: string | null
          filament_id?: string | null
          id?: string
          name?: string
          preparation_time_minutes?: number | null
          print_start_time_minutes?: number | null
          printer_id?: string | null
          profit_margin_percent?: number | null
          remove_from_plate_minutes?: number | null
          shipping_option_id?: string | null
          slicing_time_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_templates_electricity_settings_id_fkey"
            columns: ["electricity_settings_id"]
            isOneToOne: false
            referencedRelation: "electricity_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_templates_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_templates_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_templates_shipping_option_id_fkey"
            columns: ["shipping_option_id"]
            isOneToOne: false
            referencedRelation: "shipping_options"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          brand: string | null
          created_at: string
          default_electricity_settings_id: string | null
          depreciation_hours: number
          depreciation_months: number
          id: string
          maintenance_cost: number
          model: string | null
          name: string
          notes: string | null
          power_watts: number
          purchase_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          default_electricity_settings_id?: string | null
          depreciation_hours?: number
          depreciation_months?: number
          id?: string
          maintenance_cost?: number
          model?: string | null
          name: string
          notes?: string | null
          power_watts?: number
          purchase_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          default_electricity_settings_id?: string | null
          depreciation_hours?: number
          depreciation_months?: number
          id?: string
          maintenance_cost?: number
          model?: string | null
          name?: string
          notes?: string | null
          power_watts?: number
          purchase_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "printers_default_electricity_settings_id_fkey"
            columns: ["default_electricity_settings_id"]
            isOneToOne: false
            referencedRelation: "electricity_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      prints: {
        Row: {
          additional_work_minutes: number | null
          clean_supports_minutes: number | null
          consumables_cost: number | null
          created_at: string
          discount_percent: number | null
          electricity_settings_id: string | null
          extra_manual_costs: number | null
          filament_id: string
          filament_used_grams: number
          id: string
          name: string
          preparation_time_minutes: number | null
          print_start_time_minutes: number | null
          print_time_hours: number
          printer_id: string
          profit_margin_percent: number | null
          remove_from_plate_minutes: number | null
          shipping_option_id: string | null
          slicing_time_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_work_minutes?: number | null
          clean_supports_minutes?: number | null
          consumables_cost?: number | null
          created_at?: string
          discount_percent?: number | null
          electricity_settings_id?: string | null
          extra_manual_costs?: number | null
          filament_id: string
          filament_used_grams?: number
          id?: string
          name: string
          preparation_time_minutes?: number | null
          print_start_time_minutes?: number | null
          print_time_hours?: number
          printer_id: string
          profit_margin_percent?: number | null
          remove_from_plate_minutes?: number | null
          shipping_option_id?: string | null
          slicing_time_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_work_minutes?: number | null
          clean_supports_minutes?: number | null
          consumables_cost?: number | null
          created_at?: string
          discount_percent?: number | null
          electricity_settings_id?: string | null
          extra_manual_costs?: number | null
          filament_id?: string
          filament_used_grams?: number
          id?: string
          name?: string
          preparation_time_minutes?: number | null
          print_start_time_minutes?: number | null
          print_time_hours?: number
          printer_id?: string
          profit_margin_percent?: number | null
          remove_from_plate_minutes?: number | null
          shipping_option_id?: string | null
          slicing_time_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prints_electricity_settings_id_fkey"
            columns: ["electricity_settings_id"]
            isOneToOne: false
            referencedRelation: "electricity_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prints_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prints_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prints_shipping_option_id_fkey"
            columns: ["shipping_option_id"]
            isOneToOne: false
            referencedRelation: "shipping_options"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_options: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          max_prints: number
          plan_type: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_prints?: number
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_prints?: number
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
