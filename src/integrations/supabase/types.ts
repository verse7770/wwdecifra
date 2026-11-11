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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string | null
          id: string
          name: string
          xp: number | null
        }
        Insert: {
          code: string
          description: string
          icon?: string | null
          id?: string
          name: string
          xp?: number | null
        }
        Update: {
          code?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          xp?: number | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          chosen_label: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          simulation_id: string | null
          time_seconds: number | null
          user_id: string
        }
        Insert: {
          chosen_label: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          simulation_id?: string | null
          time_seconds?: number | null
          user_id: string
        }
        Update: {
          chosen_label?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          simulation_id?: string | null
          time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          id: string
          name: string
          slug: string
          sort: number | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort?: number | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort?: number | null
        }
        Relationships: []
      }
      essays: {
        Row: {
          content: string
          created_at: string | null
          feedback: string | null
          id: string
          scores: Json | null
          theme: string
          total: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          scores?: Json | null
          theme: string
          total?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          scores?: Json | null
          theme?: string
          total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          data_available: boolean
          edition: string | null
          id: string
          institution_id: string
          notes: string | null
          source_url: string | null
          updated_at: string
          validation: Database["public"]["Enums"]["validation_status"]
          year: number
        }
        Insert: {
          data_available?: boolean
          edition?: string | null
          id?: string
          institution_id: string
          notes?: string | null
          source_url?: string | null
          updated_at?: string
          validation?: Database["public"]["Enums"]["validation_status"]
          year: number
        }
        Update: {
          data_available?: boolean
          edition?: string | null
          id?: string
          institution_id?: string
          notes?: string | null
          source_url?: string | null
          updated_at?: string
          validation?: Database["public"]["Enums"]["validation_status"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "exams_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          board: string | null
          id: string
          kind: Database["public"]["Enums"]["exam_kind"]
          name: string
          website: string | null
        }
        Insert: {
          board?: string | null
          id?: string
          kind: Database["public"]["Enums"]["exam_kind"]
          name: string
          website?: string | null
        }
        Update: {
          board?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["exam_kind"]
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          created_at: string | null
          id: string
          published_at: string
          source_name: string
          source_url: string
          summary: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          published_at: string
          source_name: string
          source_url: string
          summary: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          published_at?: string
          source_name?: string
          source_url?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_goal_minutes: number
          difficult_subjects: string[] | null
          exam_date: string | null
          exam_kind: Database["public"]["Enums"]["exam_kind"] | null
          exam_name: string | null
          full_name: string | null
          goal: string | null
          id: string
          level: string | null
          onboarded: boolean
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number
          difficult_subjects?: string[] | null
          exam_date?: string | null
          exam_kind?: Database["public"]["Enums"]["exam_kind"] | null
          exam_name?: string | null
          full_name?: string | null
          goal?: string | null
          id: string
          level?: string | null
          onboarded?: boolean
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number
          difficult_subjects?: string[] | null
          exam_date?: string | null
          exam_kind?: Database["public"]["Enums"]["exam_kind"] | null
          exam_name?: string | null
          full_name?: string | null
          goal?: string | null
          id?: string
          level?: string | null
          onboarded?: boolean
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          label: string
          question_id: string
          text: string
        }
        Insert: {
          id?: string
          label: string
          question_id: string
          text: string
        }
        Update: {
          id?: string
          label?: string
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_label: string
          created_at: string
          created_by: string | null
          difficulty: number | null
          exam_id: string | null
          explanation: string | null
          id: string
          number: number | null
          origin: Database["public"]["Enums"]["question_origin"]
          skill: string | null
          source_url: string | null
          statement: string
          subject_id: string | null
          topic_id: string | null
          updated_at: string
          validation: Database["public"]["Enums"]["validation_status"]
        }
        Insert: {
          correct_label: string
          created_at?: string
          created_by?: string | null
          difficulty?: number | null
          exam_id?: string | null
          explanation?: string | null
          id?: string
          number?: number | null
          origin?: Database["public"]["Enums"]["question_origin"]
          skill?: string | null
          source_url?: string | null
          statement: string
          subject_id?: string | null
          topic_id?: string | null
          updated_at?: string
          validation?: Database["public"]["Enums"]["validation_status"]
        }
        Update: {
          correct_label?: string
          created_at?: string
          created_by?: string | null
          difficulty?: number | null
          exam_id?: string | null
          explanation?: string | null
          id?: string
          number?: number | null
          origin?: Database["public"]["Enums"]["question_origin"]
          skill?: string | null
          source_url?: string | null
          statement?: string
          subject_id?: string | null
          topic_id?: string | null
          updated_at?: string
          validation?: Database["public"]["Enums"]["validation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          correct: number | null
          created_at: string | null
          duration_minutes: number | null
          finished_at: string | null
          id: string
          mode: string
          question_ids: string[]
          started_at: string | null
          title: string
          total: number | null
          user_id: string
        }
        Insert: {
          correct?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          finished_at?: string | null
          id?: string
          mode: string
          question_ids: string[]
          started_at?: string | null
          title: string
          total?: number | null
          user_id: string
        }
        Update: {
          correct?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          finished_at?: string | null
          id?: string
          mode?: string
          question_ids?: string[]
          started_at?: string | null
          title?: string
          total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string | null
          id: string
          inputs: Json
          plan: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inputs: Json
          plan: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inputs?: Json
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          activity: string | null
          created_at: string | null
          id: string
          minutes: number
          studied_on: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          activity?: string | null
          created_at?: string | null
          id?: string
          minutes: number
          studied_on?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          activity?: string | null
          created_at?: string | null
          id?: string
          minutes?: number
          studied_on?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          area_id: string | null
          id: string
          name: string
          slug: string
          sort: number | null
        }
        Insert: {
          area_id?: string | null
          id?: string
          name: string
          slug: string
          sort?: number | null
        }
        Update: {
          area_id?: string | null
          id?: string
          name?: string
          slug?: string
          sort?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_incidence: {
        Row: {
          exam_id: string
          id: string
          question_count: number
          source_url: string | null
          topic_id: string
          updated_at: string
          validation: Database["public"]["Enums"]["validation_status"]
        }
        Insert: {
          exam_id: string
          id?: string
          question_count: number
          source_url?: string | null
          topic_id: string
          updated_at?: string
          validation?: Database["public"]["Enums"]["validation_status"]
        }
        Update: {
          exam_id?: string
          id?: string
          question_count?: number
          source_url?: string | null
          topic_id?: string
          updated_at?: string
          validation?: Database["public"]["Enums"]["validation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "topic_incidence_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_incidence_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          sort: number | null
          subject_id: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          sort?: number | null
          subject_id: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          sort?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      exam_kind: "enem" | "vestibular" | "concurso"
      question_origin: "oficial" | "autoral" | "ia"
      validation_status: "pendente" | "validado" | "rejeitado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
      exam_kind: ["enem", "vestibular", "concurso"],
      question_origin: ["oficial", "autoral", "ia"],
      validation_status: ["pendente", "validado", "rejeitado"],
    },
  },
} as const
