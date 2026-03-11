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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_scores: {
        Row: {
          created_at: string
          creativity_originality: number
          emotional_impact: number
          feedback: string
          id: string
          model_used: string
          overall_score: number
          potential: number
          submission_id: string
          technical_skill: number
        }
        Insert: {
          created_at?: string
          creativity_originality: number
          emotional_impact: number
          feedback: string
          id?: string
          model_used?: string
          overall_score: number
          potential: number
          submission_id: string
          technical_skill: number
        }
        Update: {
          created_at?: string
          creativity_originality?: number
          emotional_impact?: number
          feedback?: string
          id?: string
          model_used?: string
          overall_score?: number
          potential?: number
          submission_id?: string
          technical_skill?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_potential_index: {
        Row: {
          ai_summary: string
          brand_identity_potential: number
          commercial_appeal: number
          created_at: string
          growth_potential: number
          id: string
          market_fit: Json
          memorability: number
          overall_score: number
          replay_value: number
          submission_id: string
        }
        Insert: {
          ai_summary: string
          brand_identity_potential: number
          commercial_appeal: number
          created_at?: string
          growth_potential: number
          id?: string
          market_fit?: Json
          memorability: number
          overall_score: number
          replay_value: number
          submission_id: string
        }
        Update: {
          ai_summary?: string
          brand_identity_potential?: number
          commercial_appeal?: number
          created_at?: string
          growth_potential?: number
          id?: string
          market_fit?: Json
          memorability?: number
          overall_score?: number
          replay_value?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_potential_index_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_breakout_potential: {
        Row: {
          ai_summary: string
          clipability: number
          created_at: string
          dance_compatibility: number
          discovery_potential: number
          emotional_reactivity: number
          hook_strength: number
          id: string
          overall_score: number
          submission_id: string
        }
        Insert: {
          ai_summary: string
          clipability: number
          created_at?: string
          dance_compatibility: number
          discovery_potential: number
          emotional_reactivity: number
          hook_strength: number
          id?: string
          overall_score: number
          submission_id: string
        }
        Update: {
          ai_summary?: string
          clipability?: number
          created_at?: string
          dance_compatibility?: number
          discovery_potential?: number
          emotional_reactivity?: number
          hook_strength?: number
          id?: string
          overall_score?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_breakout_potential_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          artist_name: string
          audio_analysis_status: string
          audio_url: string | null
          category: string
          content_text: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          content_url: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          origin: string | null
          platform: Database["public"]["Enums"]["platform_source"]
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          submitter_email: string | null
          title: string
          updated_at: string
        }
        Insert: {
          artist_name: string
          audio_analysis_status?: string
          audio_url?: string | null
          category: string
          content_text?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          origin?: string | null
          platform: Database["public"]["Enums"]["platform_source"]
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          submitter_email?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          artist_name?: string
          audio_analysis_status?: string
          audio_url?: string | null
          category?: string
          content_text?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          origin?: string | null
          platform?: Database["public"]["Enums"]["platform_source"]
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          submitter_email?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      vocal_dna: {
        Row: {
          analysis_engine: string | null
          analysis_raw_json: Json | null
          analysis_status: string
          created_at: string
          genre_probabilities: Json
          id: string
          is_placeholder: boolean
          performance_energy: number
          pitch_accuracy: number
          rhythm_timing: number
          submission_id: string
          tone_profiles: string[]
          vocal_classification: string
          vocal_range_high: string
          vocal_range_low: string
        }
        Insert: {
          analysis_engine?: string | null
          analysis_raw_json?: Json | null
          analysis_status?: string
          created_at?: string
          genre_probabilities?: Json
          id?: string
          is_placeholder?: boolean
          performance_energy: number
          pitch_accuracy: number
          rhythm_timing: number
          submission_id: string
          tone_profiles?: string[]
          vocal_classification: string
          vocal_range_high: string
          vocal_range_low: string
        }
        Update: {
          analysis_engine?: string | null
          analysis_raw_json?: Json | null
          analysis_status?: string
          created_at?: string
          genre_probabilities?: Json
          id?: string
          is_placeholder?: boolean
          performance_energy?: number
          pitch_accuracy?: number
          rhythm_timing?: number
          submission_id?: string
          tone_profiles?: string[]
          vocal_classification?: string
          vocal_range_high?: string
          vocal_range_low?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocal_dna_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_type: "audio" | "video" | "text" | "image"
      platform_source: "casablanca" | "growth-tour"
      submission_status: "pending" | "judging" | "scored"
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
      content_type: ["audio", "video", "text", "image"],
      platform_source: ["casablanca", "growth-tour"],
      submission_status: ["pending", "judging", "scored"],
    },
  },
} as const
