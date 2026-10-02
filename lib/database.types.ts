// Generated from Supabase (project English-Helper). Regenerate after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: boolean;
          transcripts_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          transcripts_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          transcripts_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      default_channels: {
        Row: {
          category_id: string | null;
          created_at: string;
          enabled: boolean;
          id: string;
          kind: string;
          thumbnail_url: string | null;
          title: string;
          youtube_channel_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          kind: string;
          thumbnail_url?: string | null;
          title: string;
          youtube_channel_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          kind?: string;
          thumbnail_url?: string | null;
          title?: string;
          youtube_channel_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "default_channels_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      hidden_default_channels: {
        Row: {
          default_channel_id: string;
          user_id: string;
        };
        Insert: {
          default_channel_id: string;
          user_id?: string;
        };
        Update: {
          default_channel_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hidden_default_channels_default_channel_id_fkey";
            columns: ["default_channel_id"];
            isOneToOne: false;
            referencedRelation: "default_channels";
            referencedColumns: ["id"];
          },
        ];
      };
      user_categories: {
        Row: {
          category_id: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          user_id?: string;
        };
        Update: {
          category_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      channels: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          thumbnail_url: string | null;
          title: string;
          user_id: string;
          youtube_channel_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          thumbnail_url?: string | null;
          title: string;
          user_id?: string;
          youtube_channel_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          thumbnail_url?: string | null;
          title?: string;
          user_id?: string;
          youtube_channel_id?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          completed_at: string;
          day: string;
          kind: string;
          minutes: number;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          day: string;
          kind: string;
          minutes?: number;
          user_id?: string;
        };
        Update: {
          completed_at?: string;
          day?: string;
          kind?: string;
          minutes?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      extra_study: {
        Row: {
          channel_title: string;
          created_at: string;
          day: string;
          kind: string;
          minutes: number;
          title: string;
          user_id: string;
          video_id: string;
        };
        Insert: {
          channel_title?: string;
          created_at?: string;
          day: string;
          kind: string;
          minutes: number;
          title: string;
          user_id?: string;
          video_id: string;
        };
        Update: {
          channel_title?: string;
          created_at?: string;
          day?: string;
          kind?: string;
          minutes?: number;
          title?: string;
          user_id?: string;
          video_id?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          p256dh: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          active_goal_min: number;
          display_name: string | null;
          passive_goal_min: number;
          last_reminded_on: string | null;
          leaderboard_anonymous: boolean;
          reminder_time: string;
          show_active_defaults: boolean;
          show_passive_defaults: boolean;
          timezone: string;
          updated_at: string;
          user_id: string;
          videos_per_channel: number;
        };
        Insert: {
          active_goal_min?: number;
          display_name?: string | null;
          passive_goal_min?: number;
          last_reminded_on?: string | null;
          leaderboard_anonymous?: boolean;
          reminder_time?: string;
          show_active_defaults?: boolean;
          show_passive_defaults?: boolean;
          timezone?: string;
          updated_at?: string;
          user_id: string;
          videos_per_channel?: number;
        };
        Update: {
          active_goal_min?: number;
          display_name?: string | null;
          passive_goal_min?: number;
          last_reminded_on?: string | null;
          leaderboard_anonymous?: boolean;
          reminder_time?: string;
          show_active_defaults?: boolean;
          show_passive_defaults?: boolean;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
          videos_per_channel?: number;
        };
        Relationships: [];
      };
      video_captions: {
        Row: {
          cues: Json | null;
          fetched_at: string;
          source: string;
          video_id: string;
        };
        Insert: {
          cues?: Json | null;
          fetched_at?: string;
          source: string;
          video_id: string;
        };
        Update: {
          cues?: Json | null;
          fetched_at?: string;
          source?: string;
          video_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_delete_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      admin_list_users: {
        Args: never;
        Returns: {
          blocked: boolean;
          created_at: string;
          display_name: string | null;
          email: string | null;
          last_sign_in_at: string | null;
          provider: string | null;
          timezone: string | null;
          user_id: string;
        }[];
      };
      admin_set_user_blocked: {
        Args: { p_blocked: boolean; p_user_id: string };
        Returns: undefined;
      };
      get_vapid_public_key: {
        Args: never;
        Returns: string;
      };
      is_admin: {
        Args: never;
        Returns: boolean;
      };
      get_leaderboard: {
        Args: never;
        Returns: {
          active_min: number;
          anki_days: number;
          current_streak: number;
          display_name: string;
          is_me: boolean;
          passive_min: number;
          perfect_days: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
