export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          height_cm: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          height_cm?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          height_cm?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      macro_targets: {
        Row: {
          id: string
          user_id: string
          type: 'rest' | 'training'
          calories: number
          protein: number
          carbs: number
          fat: number
          auto_adjust: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'rest' | 'training'
          calories: number
          protein: number
          carbs: number
          fat: number
          auto_adjust?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'rest' | 'training'
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          auto_adjust?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      weight_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          weight_kg: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          weight_kg: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          weight_kg?: number
          created_at?: string
        }
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          intake_oz: number
          goal_oz: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          intake_oz?: number
          goal_oz?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          intake_oz?: number
          goal_oz?: number
          created_at?: string
          updated_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          date: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          date: string
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          date?: string
          timestamp?: string
          created_at?: string
        }
      }
      food_items: {
        Row: {
          id: string
          user_id: string
          meal_id: string
          name: string
          quantity: number
          unit: string
          calories: number
          protein: number
          carbs: number
          fat: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meal_id: string
          name: string
          quantity: number
          unit: string
          calories: number
          protein: number
          carbs: number
          fat: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meal_id?: string
          name?: string
          quantity?: number
          unit?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
        }
      }
      quick_add_meals: {
        Row: {
          id: string
          user_id: string
          name: string
          items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          items: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          items?: Json
          created_at?: string
          updated_at?: string
        }
      }
      training_programs: {
        Row: {
          id: string
          user_id: string
          program_name: string
          description: string | null
          duration_weeks: number
          split_type: string
          workouts: Json
          preferences: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_name: string
          description?: string | null
          duration_weeks: number
          split_type: string
          workouts: Json
          preferences?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          program_name?: string
          description?: string | null
          duration_weeks?: number
          split_type?: string
          workouts?: Json
          preferences?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      saved_workouts: {
        Row: {
          id: string
          user_id: string
          program_name: string
          description: string | null
          duration_weeks: number
          split_type: string
          workouts: Json
          tags: string[]
          is_pinned: boolean
          last_performed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_name: string
          description?: string | null
          duration_weeks: number
          split_type: string
          workouts: Json
          tags?: string[]
          is_pinned?: boolean
          last_performed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          program_name?: string
          description?: string | null
          duration_weeks?: number
          split_type?: string
          workouts?: Json
          tags?: string[]
          is_pinned?: boolean
          last_performed?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workout_history: {
        Row: {
          id: string
          user_id: string
          workout_data: Json
          date_completed: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_data: Json
          date_completed: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_data?: Json
          date_completed?: string
          created_at?: string
        }
      }
      favorite_exercises: {
        Row: {
          id: string
          user_id: string
          exercise_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_data?: Json
          created_at?: string
        }
      }
      workout_drafts: {
        Row: {
          id: string
          user_id: string
          program_name: string | null
          workouts: Json
          last_modified: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_name?: string | null
          workouts: Json
          last_modified?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          program_name?: string | null
          workouts?: Json
          last_modified?: string
          created_at?: string
        }
      }
      photo_bundles: {
        Row: {
          id: string
          user_id: string
          date: string
          front_url: string | null
          side_url: string | null
          back_url: string | null
          weight_kg: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          front_url?: string | null
          side_url?: string | null
          back_url?: string | null
          weight_kg?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          front_url?: string | null
          side_url?: string | null
          back_url?: string | null
          weight_kg?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          description?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          description?: string | null
          date?: string
          created_at?: string
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          streak_type: 'workout' | 'nutrition' | 'water'
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_type: 'workout' | 'nutrition' | 'water'
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_type?: 'workout' | 'nutrition' | 'water'
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          plan_name: string
          description: string | null
          daily_plan: Json
          is_active: boolean
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_name: string
          description?: string | null
          daily_plan: Json
          is_active?: boolean
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_name?: string
          description?: string | null
          daily_plan?: Json
          is_active?: boolean
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          weight_unit: 'kg' | 'lbs'
          water_unit: 'oz' | 'ml'
          current_weight_kg: number | null
          weight_goal_kg: number | null
          progression_preference: 'Conservative' | 'Balanced' | 'Aggressive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight_unit?: 'kg' | 'lbs'
          water_unit?: 'oz' | 'ml'
          current_weight_kg?: number | null
          weight_goal_kg?: number | null
          progression_preference?: 'Conservative' | 'Balanced' | 'Aggressive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight_unit?: 'kg' | 'lbs'
          water_unit?: 'oz' | 'ml'
          current_weight_kg?: number | null
          weight_goal_kg?: number | null
          progression_preference?: 'Conservative' | 'Balanced' | 'Aggressive'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_streak: {
        Args: {
          p_user_id: string
          p_streak_type: 'workout' | 'nutrition' | 'water'
          p_activity_date?: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
