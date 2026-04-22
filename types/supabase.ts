export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address: string
          created_at: string | null
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          account_status: string
          branch_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          hire_date: string
          id: string
          last_name: string | null
          leave_date: string | null
          name: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_status?: string
          branch_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          hire_date: string
          id?: string
          last_name?: string | null
          leave_date?: string | null
          name: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_status?: string
          branch_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          hire_date?: string
          id?: string
          last_name?: string | null
          leave_date?: string | null
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      vehicle_accidents: {
        Row: {
          accident_date: string
          created_at: string | null
          description: string
          id: string
          repair_cost: number | null
          severity: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          accident_date: string
          created_at?: string | null
          description: string
          id?: string
          repair_cost?: number | null
          severity?: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          accident_date?: string
          created_at?: string | null
          description?: string
          id?: string
          repair_cost?: number | null
          severity?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_accidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_insurances: {
        Row: {
          company_name: string
          coverage_details: string | null
          created_at: string | null
          end_date: string
          id: string
          premium_amount: number | null
          start_date: string
          type: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          company_name: string
          coverage_details?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          premium_amount?: number | null
          start_date: string
          type: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          company_name?: string
          coverage_details?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          premium_amount?: number | null
          start_date?: string
          type?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_insurances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_leases: {
        Row: {
          contract_end_date: string
          contract_start_date: string
          created_at: string | null
          id: string
          lease_company: string
          monthly_fee: number
          vehicle_id: string | null
        }
        Insert: {
          contract_end_date: string
          contract_start_date: string
          created_at?: string | null
          id?: string
          lease_company: string
          monthly_fee: number
          vehicle_id?: string | null
        }
        Update: {
          contract_end_date?: string
          contract_start_date?: string
          created_at?: string | null
          id?: string
          lease_company?: string
          monthly_fee?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_leases_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_purchases: {
        Row: {
          acquisition_cost: number
          body_type: string
          created_at: string | null
          first_registration_date: string | null
          id: string
          is_new_car: boolean
          method: string
          purchase_date: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          acquisition_cost: number
          body_type?: string
          created_at?: string | null
          first_registration_date?: string | null
          id?: string
          is_new_car?: boolean
          method?: string
          purchase_date: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          acquisition_cost?: number
          body_type?: string
          created_at?: string | null
          first_registration_date?: string | null
          id?: string
          is_new_car?: boolean
          method?: string
          purchase_date?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_purchases_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          license_plate: string | null
          license_plate_color: string | null
          manufacturer: string
          model: string
          ownership_type: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          license_plate?: string | null
          license_plate_color?: string | null
          manufacturer: string
          model: string
          ownership_type?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          license_plate?: string | null
          license_plate_color?: string | null
          manufacturer?: string
          model?: string
          ownership_type?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      employment_category: "full_time" | "part_time" | "contract" | "dispatch"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      employment_category: ["full_time", "part_time", "contract", "dispatch"],
    },
  },
} as const

