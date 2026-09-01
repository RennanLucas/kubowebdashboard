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
    PostgrestVersion: "14.15"
  }
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
      annotation_category: "campaign" | "content" | "feature" | "incident" | "other"
      app_role: "admin" | "user"
      feedback_priority: "low" | "normal" | "high" | "critical"
      feedback_status: "received" | "analyzing" | "planned" | "in_development" | "implemented" | "archived"
      feedback_type: "like" | "improvement" | "bug" | "suggestion" | "feature" | "quick_feedback" | "other"
      roadmap_status: "backlog" | "planned" | "in_development" | "testing" | "published"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aggregation_status: {
        Row: {
          last_aggregated_at: string
          project_id: string
        }
        Insert: {
          last_aggregated_at?: string
          project_id: string
        }
        Update: {
          last_aggregated_at?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregation_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          period_days: number
          project_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          period_days?: number
          project_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          period_days?: number
          project_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alert_preferences: {
        Row: {
          alert_types: Json
          created_at: string
          enabled: boolean
          frequency: string
          id: string
          leads_goal_daily: number | null
          notify_email: boolean
          notify_in_app: boolean
          project_id: string
          traffic_threshold_pct: number
          updated_at: string
        }
        Insert: {
          alert_types?: Json
          created_at?: string
          enabled?: boolean
          frequency?: string
          id?: string
          leads_goal_daily?: number | null
          notify_email?: boolean
          notify_in_app?: boolean
          project_id: string
          traffic_threshold_pct?: number
          updated_at?: string
        }
        Update: {
          alert_types?: Json
          created_at?: string
          enabled?: boolean
          frequency?: string
          id?: string
          leads_goal_daily?: number | null
          notify_email?: boolean
          notify_in_app?: boolean
          project_id?: string
          traffic_threshold_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_preferences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          project_id: string
          read: boolean
          severity: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          project_id: string
          read?: boolean
          severity?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          project_id?: string
          read?: boolean
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_events: {
        Row: {
          count: number
          date: string
          device: string
          event_type: string
          project_id: string
          source: string
        }
        Insert: {
          count?: number
          date: string
          device: string
          event_type: string
          project_id: string
          source: string
        }
        Update: {
          count?: number
          date?: string
          device?: string
          event_type?: string
          project_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_geo: {
        Row: {
          city: string
          country: string
          date: string
          device: string
          project_id: string
          source: string
          views: number
          visitors: number
        }
        Insert: {
          city: string
          country: string
          date: string
          device: string
          project_id: string
          source: string
          views?: number
          visitors?: number
        }
        Update: {
          city?: string
          country?: string
          date?: string
          device?: string
          project_id?: string
          source?: string
          views?: number
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_geo_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_overview: {
        Row: {
          bounces: number
          date: string
          device: string
          project_id: string
          sessions: number
          source: string
          total_duration: number
          views: number
          visitors: number
        }
        Insert: {
          bounces?: number
          date: string
          device: string
          project_id: string
          sessions?: number
          source: string
          total_duration?: number
          views?: number
          visitors?: number
        }
        Update: {
          bounces?: number
          date?: string
          device?: string
          project_id?: string
          sessions?: number
          source?: string
          total_duration?: number
          views?: number
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_overview_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_pages: {
        Row: {
          bounces: number
          date: string
          device: string
          page_path: string
          project_id: string
          sessions: number
          source: string
          total_duration: number
          views: number
          visitors: number
        }
        Insert: {
          bounces?: number
          date: string
          device: string
          page_path: string
          project_id: string
          sessions?: number
          source: string
          total_duration?: number
          views?: number
          visitors?: number
        }
        Update: {
          bounces?: number
          date?: string
          device?: string
          page_path?: string
          project_id?: string
          sessions?: number
          source?: string
          total_duration?: number
          views?: number
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_tech: {
        Row: {
          browser: string
          date: string
          device: string
          os: string
          project_id: string
          source: string
          views: number
          visitors: number
        }
        Insert: {
          browser: string
          date: string
          device: string
          os: string
          project_id: string
          source: string
          views?: number
          visitors?: number
        }
        Update: {
          browser?: string
          date?: string
          device?: string
          os?: string
          project_id?: string
          source?: string
          views?: number
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_tech_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      annotations: {
        Row: {
          category: Database["public"]["Enums"]["annotation_category"]
          created_at: string
          created_by: string
          date: string
          id: string
          label: string
          notes: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["annotation_category"]
          created_at?: string
          created_by: string
          date: string
          id?: string
          label: string
          notes?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["annotation_category"]
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          label?: string
          notes?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          analytics_property_id: string | null
          company_name: string
          created_at: string
          domain: string | null
          id: string
          lead_value: number
          monthly_ad_spend: number
          user_id: string
        }
        Insert: {
          analytics_property_id?: string | null
          company_name: string
          created_at?: string
          domain?: string | null
          id?: string
          lead_value?: number
          monthly_ad_spend?: number
          user_id: string
        }
        Update: {
          analytics_property_id?: string | null
          company_name?: string
          created_at?: string
          domain?: string | null
          id?: string
          lead_value?: number
          monthly_ad_spend?: number
          user_id?: string
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_label: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string
          project_id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_label?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string
          project_id: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_label?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string
          project_id?: string
          session_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_response: string | null
          category: string | null
          created_at: string
          customer_priority: Database["public"]["Enums"]["feedback_priority"]
          description: string | null
          id: string
          internal_priority: Database["public"]["Enums"]["feedback_priority"]
          organization_id: string
          origin: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          title: string | null
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          customer_priority?: Database["public"]["Enums"]["feedback_priority"]
          description?: string | null
          id?: string
          internal_priority?: Database["public"]["Enums"]["feedback_priority"]
          organization_id: string
          origin?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          customer_priority?: Database["public"]["Enums"]["feedback_priority"]
          description?: string | null
          id?: string
          internal_priority?: Database["public"]["Enums"]["feedback_priority"]
          organization_id?: string
          origin?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          leads_target: number
          month: string
          project_id: string
          revenue_target: number
          updated_at: string
          visitors_target: number
        }
        Insert: {
          created_at?: string
          id?: string
          leads_target?: number
          month: string
          project_id: string
          revenue_target?: number
          updated_at?: string
          visitors_target?: number
        }
        Update: {
          created_at?: string
          id?: string
          leads_target?: number
          month?: string
          project_id?: string
          revenue_target?: number
          updated_at?: string
          visitors_target?: number
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role: string
          status?: string
          token_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          analytics_property_id: string | null
          created_at: string
          domain: string | null
          id: string
          lead_value: number
          legacy_client_id: string | null
          monthly_ad_spend: number
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          analytics_property_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          lead_value?: number
          legacy_client_id?: string | null
          monthly_ad_spend?: number
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          analytics_property_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          lead_value?: number
          legacy_client_id?: string | null
          monthly_ad_spend?: number
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_metrics: {
        Row: {
          avg_time_on_page: number
          bounce_rate: number
          created_at: string
          date: string
          id: string
          page_path: string
          project_id: string
          views: number
        }
        Insert: {
          avg_time_on_page?: number
          bounce_rate?: number
          created_at?: string
          date: string
          id?: string
          page_path: string
          project_id: string
          views?: number
        }
        Update: {
          avg_time_on_page?: number
          bounce_rate?: number
          created_at?: string
          date?: string
          id?: string
          page_path?: string
          project_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pageviews: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          page_path: string
          project_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          page_path?: string
          project_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          page_path?: string
          project_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pageviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
          url: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          url?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          external_id: string | null
          id: string
          last_event_ts: string | null
          organization_id: string | null
          payer_email: string | null
          plan_id: string | null
          price_id: string | null
          product_id: string | null
          provider: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          external_id?: string | null
          id?: string
          last_event_ts?: string | null
          organization_id?: string | null
          payer_email?: string | null
          plan_id?: string | null
          price_id?: string | null
          product_id?: string | null
          provider?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          external_id?: string | null
          id?: string
          last_event_ts?: string | null
          organization_id?: string | null
          payer_email?: string | null
          plan_id?: string | null
          price_id?: string | null
          product_id?: string | null
          provider?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      traffic_sources: {
        Row: {
          created_at: string
          date: string
          id: string
          project_id: string
          source: string
          visitors: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          project_id: string
          source: string
          visitors?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          project_id?: string
          source?: string
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "traffic_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      web_vitals: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          metric_name: string
          page_path: string
          project_id: string
          rating: string | null
          session_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name: string
          page_path?: string
          project_id: string
          rating?: string | null
          session_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name?: string
          page_path?: string
          project_id?: string
          rating?: string | null
          session_id?: string | null
          value?: number
        }
        Relationships: []
      }
      website_metrics: {
        Row: {
          button_clicks: number
          conversion_rate: number
          created_at: string
          date: string
          estimated_value: number
          form_submissions: number
          id: string
          leads: number
          project_id: string
          visitors: number
          whatsapp_clicks: number
        }
        Insert: {
          button_clicks?: number
          conversion_rate?: number
          created_at?: string
          date: string
          estimated_value?: number
          form_submissions?: number
          id?: string
          leads?: number
          project_id: string
          visitors?: number
          whatsapp_clicks?: number
        }
        Update: {
          button_clicks?: number
          conversion_rate?: number
          created_at?: string
          date?: string
          estimated_value?: number
          form_submissions?: number
          id?: string
          leads?: number
          project_id?: string
          visitors?: number
          whatsapp_clicks?: number
        }
        Relationships: [
          {
            foreignKeyName: "website_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_analytics_jit: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      classify_source: { Args: { referrer: string }; Returns: string }
      create_organization: {
        Args: { org_name: string; org_domain: string; project_name: string }
        Returns: string
      }
      cleanup_old_raw_data: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_organizations: { Args: never; Returns: string[] }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      parse_browser: { Args: { ua: string }; Returns: string }
      parse_device: { Args: { ua: string }; Returns: string }
      parse_os: { Args: { ua: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      user_has_role: {
        Args: { p_org_id: string; p_required_roles: string[] }
        Returns: boolean
      }
    }
    Enums: {
      annotation_category: "campaign" | "launch" | "event" | "other"
      app_role: "admin" | "user"
      feedback_priority: "low" | "normal" | "high" | "critical"
      feedback_status: "received" | "analyzing" | "planned" | "in_development" | "implemented" | "archived"
      feedback_type: "like" | "improvement" | "bug" | "suggestion" | "feature" | "quick_feedback" | "other"
      roadmap_status: "backlog" | "planned" | "in_development" | "testing" | "published"
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
      annotation_category: ["campaign", "launch", "event", "other"],
      app_role: ["admin", "user"],
    },
  },
} as const
