// Generated from Supabase (project English-Helper). Regenerate after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string
          id: string
          kind: string
          thumbnail_url: string | null
          title: string
          user_id: string
          youtube_channel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          thumbnail_url?: string | null
          title: string
          user_id?: string
          youtube_channel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          youtube_channel_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          completed_at: string
          day: string
          kind: string
          minutes: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          day: string
          kind: string
          minutes?: number
          user_id?: string
        }
        Update: {
          completed_at?: string
          day?: string
          kind?: string
          minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      extra_study: {
        Row: {
          channel_title: string
          created_at: string
          day: string
          kind: string
          minutes: number
          title: string
          user_id: string
          video_id: string
        }
        Insert: {
          channel_title?: string
          created_at?: string
          day: string
          kind: string
          minutes: number
          title: string
          user_id?: string
          video_id: string
        }
        Update: {
          channel_title?: string
          created_at?: string
          day?: string
          kind?: string
          minutes?: number
          title?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          p256dh: string
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          active_goal_min: number
          display_name: string | null
          passive_goal_min: number
          last_reminded_on: string | null
          leaderboard_anonymous: boolean
          reminder_time: string
          timezone: string
          updated_at: string
          user_id: string
          videos_per_channel: number
        }
        Insert: {
          active_goal_min?: number
          display_name?: string | null
          passive_goal_min?: number
          last_reminded_on?: string | null
          leaderboard_anonymous?: boolean
          reminder_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
          videos_per_channel?: number
        }
        Update: {
          active_goal_min?: number
          display_name?: string | null
          passive_goal_min?: number
          last_reminded_on?: string | null
          leaderboard_anonymous?: boolean
          reminder_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          videos_per_channel?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_vapid_public_key: {
        Args: never
        Returns: string
      }
      get_leaderboard: {
        Args: never
        Returns: {
          active_min: number
          anki_days: number
          current_streak: number
          display_name: string
          is_me: boolean
          passive_min: number
          perfect_days: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
