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
      ai_usage_events: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["ai_usage_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["ai_usage_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["ai_usage_kind"]
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          customer_id: string
          guests: number
          id: string
          status: string
          total_pkr: number
          tour_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          guests?: number
          id?: string
          status?: string
          total_pkr: number
          tour_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          guests?: number
          id?: string
          status?: string
          total_pkr?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_plans: {
        Row: {
          age_max: number
          age_min: number
          benefits: Json
          coverage_amount_pkr: number
          coverage_type: string
          created_at: string
          description: string
          duration_days: number
          exclusions: Json
          id: string
          image_url: string | null
          is_active: boolean
          plan_name: string
          price_pkr: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          age_max?: number
          age_min?: number
          benefits?: Json
          coverage_amount_pkr: number
          coverage_type: string
          created_at?: string
          description?: string
          duration_days?: number
          exclusions?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          plan_name: string
          price_pkr: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          age_max?: number
          age_min?: number
          benefits?: Json
          coverage_amount_pkr?: number
          coverage_type?: string
          created_at?: string
          description?: string
          duration_days?: number
          exclusions?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          plan_name?: string
          price_pkr?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plans_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          is_unlocked: boolean
          message: string | null
          notes: string | null
          service_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["service_lead_status"]
          tour_id: string | null
          unlocked_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          is_unlocked?: boolean
          message?: string | null
          notes?: string | null
          service_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_lead_status"]
          tour_id?: string | null
          unlocked_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          is_unlocked?: boolean
          message?: string | null
          notes?: string | null
          service_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["service_lead_status"]
          tour_id?: string | null
          unlocked_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_settings: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          method: string
          owner_id: string | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          method: string
          owner_id?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          method?: string
          owner_id?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          lead_credits_balance: number
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          vendor_services: Database["public"]["Enums"]["service_type"][]
          vendor_status: Database["public"]["Enums"]["vendor_status"]
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          lead_credits_balance?: number
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          vendor_services?: Database["public"]["Enums"]["service_type"][]
          vendor_status?: Database["public"]["Enums"]["vendor_status"]
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          lead_credits_balance?: number
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          vendor_services?: Database["public"]["Enums"]["service_type"][]
          vendor_status?: Database["public"]["Enums"]["vendor_status"]
        }
        Relationships: []
      }
      ticket_services: {
        Row: {
          airlines_supported: Json
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          refundable: boolean
          route_type: string
          sample_routes: Json
          service_fee_pkr: number
          service_name: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          airlines_supported?: Json
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          refundable?: boolean
          route_type: string
          sample_routes?: Json
          service_fee_pkr: number
          service_name: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          airlines_supported?: Json
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          refundable?: boolean
          route_type?: string
          sample_routes?: Json
          service_fee_pkr?: number
          service_name?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          accommodation: Json | null
          created_at: string
          departure_city: string
          description: string
          destination_country: string
          duration_days: number
          extra_notes: string | null
          id: string
          image_url: string | null
          is_active: boolean
          itinerary: Json
          price_pkr: number
          requirements: Json | null
          title: string
          total_seats: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          accommodation?: Json | null
          created_at?: string
          departure_city?: string
          description?: string
          destination_country: string
          duration_days?: number
          extra_notes?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          itinerary?: Json
          price_pkr: number
          requirements?: Json | null
          title: string
          total_seats?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          accommodation?: Json | null
          created_at?: string
          departure_city?: string
          description?: string
          destination_country?: string
          duration_days?: number
          extra_notes?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          itinerary?: Json
          price_pkr?: number
          requirements?: Json | null
          title?: string
          total_seats?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visa_services: {
        Row: {
          country: string
          created_at: string
          description: string
          documents_required: Json
          extra_notes: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price_pkr: number
          processing_days: number
          service_fee_pkr: number
          success_rate: number | null
          updated_at: string
          vendor_id: string
          visa_type: string
        }
        Insert: {
          country: string
          created_at?: string
          description?: string
          documents_required?: Json
          extra_notes?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_pkr: number
          processing_days?: number
          service_fee_pkr?: number
          success_rate?: number | null
          updated_at?: string
          vendor_id: string
          visa_type: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string
          documents_required?: Json
          extra_notes?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_pkr?: number
          processing_days?: number
          service_fee_pkr?: number
          success_rate?: number | null
          updated_at?: string
          vendor_id?: string
          visa_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unlock_lead: {
        Args: { _lead_id: string }
        Returns: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          is_unlocked: boolean
          message: string | null
          notes: string | null
          service_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["service_lead_status"]
          tour_id: string | null
          unlocked_at: string | null
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      ai_usage_kind: "description" | "plan"
      app_role: "admin" | "vendor" | "customer"
      service_lead_status: "new" | "contacted" | "won" | "lost"
      service_type: "tours" | "visa" | "insurance" | "tickets"
      subscription_tier: "free" | "starter" | "pro" | "agency"
      vendor_status: "pending" | "approved" | "banned"
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
      ai_usage_kind: ["description", "plan"],
      app_role: ["admin", "vendor", "customer"],
      service_lead_status: ["new", "contacted", "won", "lost"],
      service_type: ["tours", "visa", "insurance", "tickets"],
      subscription_tier: ["free", "starter", "pro", "agency"],
      vendor_status: ["pending", "approved", "banned"],
    },
  },
} as const
