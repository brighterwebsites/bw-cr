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
      artifacts: {
        Row: {
          artifact_type: Database["public"]["Enums"]["artifact_type"]
          asset_id: number | null
          bytes: number | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          customer_id: number
          id: number
          path_or_url: string
          project_id: number | null
          status: Database["public"]["Enums"]["artifact_status"]
          summary: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          artifact_type?: Database["public"]["Enums"]["artifact_type"]
          asset_id?: number | null
          bytes?: number | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          customer_id: number
          id?: number
          path_or_url?: string
          project_id?: number | null
          status?: Database["public"]["Enums"]["artifact_status"]
          summary?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          artifact_type?: Database["public"]["Enums"]["artifact_type"]
          asset_id?: number | null
          bytes?: number | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          customer_id?: number
          id?: number
          path_or_url?: string
          project_id?: number | null
          status?: Database["public"]["Enums"]["artifact_status"]
          summary?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_connection_secrets: {
        Row: {
          asset_connection_id: number
          refresh_token: string | null
          updated_at: string
          wp_app_password: string | null
          wp_username: string | null
        }
        Insert: {
          asset_connection_id: number
          refresh_token?: string | null
          updated_at?: string
          wp_app_password?: string | null
          wp_username?: string | null
        }
        Update: {
          asset_connection_id?: number
          refresh_token?: string | null
          updated_at?: string
          wp_app_password?: string | null
          wp_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_connection_secrets_asset_connection_id_fkey"
            columns: ["asset_connection_id"]
            isOneToOne: true
            referencedRelation: "asset_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_connections: {
        Row: {
          asset_id: number
          config: Json
          created_at: string
          id: number
          last_error: string
          last_sync_at: string | null
          provider: string
          secret_ref: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          version: number
        }
        Insert: {
          asset_id: number
          config?: Json
          created_at?: string
          id?: number
          last_error?: string
          last_sync_at?: string | null
          provider: string
          secret_ref?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          asset_id?: number
          config?: Json
          created_at?: string
          id?: number
          last_error?: string
          last_sync_at?: string | null
          provider?: string
          secret_ref?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_connections_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_pages: {
        Row: {
          asset_id: number
          canonical_url: string
          cluster_slug: string
          created_at: string
          id: number
          is_priority: boolean
          meta_synced_at: string | null
          scos_index_status: string
          scos_next_step: string
          title: string
          topic_slug: string
          updated_at: string
          url_path: string
          version: number
          wp_meta_snapshot: Json
          wp_post_id: number | null
          wp_post_type: string
        }
        Insert: {
          asset_id: number
          canonical_url?: string
          cluster_slug?: string
          created_at?: string
          id?: number
          is_priority?: boolean
          meta_synced_at?: string | null
          scos_index_status?: string
          scos_next_step?: string
          title?: string
          topic_slug?: string
          updated_at?: string
          url_path: string
          version?: number
          wp_meta_snapshot?: Json
          wp_post_id?: number | null
          wp_post_type?: string
        }
        Update: {
          asset_id?: number
          canonical_url?: string
          cluster_slug?: string
          created_at?: string
          id?: number
          is_priority?: boolean
          meta_synced_at?: string | null
          scos_index_status?: string
          scos_next_step?: string
          title?: string
          topic_slug?: string
          updated_at?: string
          url_path?: string
          version?: number
          wp_meta_snapshot?: Json
          wp_post_id?: number | null
          wp_post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_pages_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          asset_url: string
          conversion_event_name: string
          created_at: string
          customer_id: number
          ga4_status: Database["public"]["Enums"]["connection_status"]
          gsc_status: Database["public"]["Enums"]["connection_status"]
          health_score: number | null
          hermes_profile: string
          id: number
          name: string
          project_id: number | null
          telegram_topic: string
          updated_at: string
          version: number
          workspace: string
          wp_cli_status: Database["public"]["Enums"]["connection_status"]
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          asset_url?: string
          conversion_event_name?: string
          created_at?: string
          customer_id: number
          ga4_status?: Database["public"]["Enums"]["connection_status"]
          gsc_status?: Database["public"]["Enums"]["connection_status"]
          health_score?: number | null
          hermes_profile?: string
          id?: number
          name?: string
          project_id?: number | null
          telegram_topic?: string
          updated_at?: string
          version?: number
          workspace?: string
          wp_cli_status?: Database["public"]["Enums"]["connection_status"]
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          asset_url?: string
          conversion_event_name?: string
          created_at?: string
          customer_id?: number
          ga4_status?: Database["public"]["Enums"]["connection_status"]
          gsc_status?: Database["public"]["Enums"]["connection_status"]
          health_score?: number | null
          hermes_profile?: string
          id?: number
          name?: string
          project_id?: number | null
          telegram_topic?: string
          updated_at?: string
          version?: number
          workspace?: string
          wp_cli_status?: Database["public"]["Enums"]["connection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_analysis_runs: {
        Row: {
          asset_id: number
          competitor_inputs: Json
          created_at: string
          error_message: string
          id: number
          search_language_code: string
          search_location_code: number
          search_location_name: string
          status: Database["public"]["Enums"]["competitor_run_status"]
          updated_at: string
          version: number
        }
        Insert: {
          asset_id: number
          competitor_inputs?: Json
          created_at?: string
          error_message?: string
          id?: number
          search_language_code?: string
          search_location_code?: number
          search_location_name?: string
          status?: Database["public"]["Enums"]["competitor_run_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          asset_id?: number
          competitor_inputs?: Json
          created_at?: string
          error_message?: string
          id?: number
          search_language_code?: string
          search_location_code?: number
          search_location_name?: string
          status?: Database["public"]["Enums"]["competitor_run_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analysis_runs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_snapshots: {
        Row: {
          asset_id: number
          backlinks: number | null
          business_name: string
          created_at: string
          domain_rank: number | null
          id: number
          keyword_gaps: number | null
          location: string
          notes: string
          organic_traffic: number | null
          paid_traffic: number | null
          position_1: number | null
          position_11_20: number | null
          position_2_3: number | null
          position_21_50: number | null
          position_4_10: number | null
          position_51_100: number | null
          referring_domains: number | null
          run_id: number | null
          spam_score: number | null
          top_10_keywords: number | null
          top_100_keywords: number | null
          top_3_keywords: number | null
          total_keywords: number | null
          traffic_value: number | null
          type: Database["public"]["Enums"]["competitor_type"]
          updated_at: string
          url: string
          version: number
        }
        Insert: {
          asset_id: number
          backlinks?: number | null
          business_name: string
          created_at?: string
          domain_rank?: number | null
          id?: number
          keyword_gaps?: number | null
          location?: string
          notes?: string
          organic_traffic?: number | null
          paid_traffic?: number | null
          position_1?: number | null
          position_11_20?: number | null
          position_2_3?: number | null
          position_21_50?: number | null
          position_4_10?: number | null
          position_51_100?: number | null
          referring_domains?: number | null
          run_id?: number | null
          spam_score?: number | null
          top_10_keywords?: number | null
          top_100_keywords?: number | null
          top_3_keywords?: number | null
          total_keywords?: number | null
          traffic_value?: number | null
          type: Database["public"]["Enums"]["competitor_type"]
          updated_at?: string
          url?: string
          version?: number
        }
        Update: {
          asset_id?: number
          backlinks?: number | null
          business_name?: string
          created_at?: string
          domain_rank?: number | null
          id?: number
          keyword_gaps?: number | null
          location?: string
          notes?: string
          organic_traffic?: number | null
          paid_traffic?: number | null
          position_1?: number | null
          position_11_20?: number | null
          position_2_3?: number | null
          position_21_50?: number | null
          position_4_10?: number | null
          position_51_100?: number | null
          referring_domains?: number | null
          run_id?: number | null
          spam_score?: number | null
          top_10_keywords?: number | null
          top_100_keywords?: number | null
          top_3_keywords?: number | null
          total_keywords?: number | null
          traffic_value?: number | null
          type?: Database["public"]["Enums"]["competitor_type"]
          updated_at?: string
          url?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "competitor_analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          business_name: string
          contact_first_name: string
          contact_last_name: string
          contact_method: string
          created_at: string
          email: string
          id: number
          lifecycle: Database["public"]["Enums"]["customer_lifecycle"]
          location: string
          notes: string
          phone: string
          updated_at: string
          version: number
          website: string
        }
        Insert: {
          address?: string
          business_name: string
          contact_first_name?: string
          contact_last_name?: string
          contact_method?: string
          created_at?: string
          email?: string
          id?: number
          lifecycle?: Database["public"]["Enums"]["customer_lifecycle"]
          location?: string
          notes?: string
          phone?: string
          updated_at?: string
          version?: number
          website?: string
        }
        Update: {
          address?: string
          business_name?: string
          contact_first_name?: string
          contact_last_name?: string
          contact_method?: string
          created_at?: string
          email?: string
          id?: number
          lifecycle?: Database["public"]["Enums"]["customer_lifecycle"]
          location?: string
          notes?: string
          phone?: string
          updated_at?: string
          version?: number
          website?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json
          provider: string
          secret: string | null
          secret_last4: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          provider: string
          secret?: string | null
          secret_last4?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          provider?: string
          secret?: string | null
          secret_last4?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_snapshots: {
        Row: {
          asset_id: number
          avg_rank: number | null
          avg_rank_delta: number | null
          avg_session_duration: number | null
          avg_session_duration_delta: number | null
          clicks: number | null
          clicks_delta: number | null
          conversions: number | null
          conversions_delta: number | null
          created_at: string
          ctr: number | null
          ctr_delta: number | null
          domain_rank: number | null
          domain_rank_delta: number | null
          engagement_rate: number | null
          engagement_rate_delta: number | null
          id: number
          impressions: number | null
          impressions_delta: number | null
          period_label: string
          snapshot_type: Database["public"]["Enums"]["snapshot_type"]
          updated_at: string
          version: number
        }
        Insert: {
          asset_id: number
          avg_rank?: number | null
          avg_rank_delta?: number | null
          avg_session_duration?: number | null
          avg_session_duration_delta?: number | null
          clicks?: number | null
          clicks_delta?: number | null
          conversions?: number | null
          conversions_delta?: number | null
          created_at?: string
          ctr?: number | null
          ctr_delta?: number | null
          domain_rank?: number | null
          domain_rank_delta?: number | null
          engagement_rate?: number | null
          engagement_rate_delta?: number | null
          id?: number
          impressions?: number | null
          impressions_delta?: number | null
          period_label: string
          snapshot_type?: Database["public"]["Enums"]["snapshot_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          asset_id?: number
          avg_rank?: number | null
          avg_rank_delta?: number | null
          avg_session_duration?: number | null
          avg_session_duration_delta?: number | null
          clicks?: number | null
          clicks_delta?: number | null
          conversions?: number | null
          conversions_delta?: number | null
          created_at?: string
          ctr?: number | null
          ctr_delta?: number | null
          domain_rank?: number | null
          domain_rank_delta?: number | null
          engagement_rate?: number | null
          engagement_rate_delta?: number | null
          id?: number
          impressions?: number | null
          impressions_delta?: number | null
          period_label?: string
          snapshot_type?: Database["public"]["Enums"]["snapshot_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      page_metrics_current: {
        Row: {
          asset_page_id: number
          avg_position: number
          avg_position_delta: number
          clicks: number
          clicks_delta: number
          created_at: string
          ctr: number
          ctr_delta: number
          id: number
          impressions: number
          impressions_delta: number
          period_end: string
          period_start: string
          prior_period_end: string | null
          prior_period_start: string | null
          pulled_at: string
          updated_at: string
          version: number
        }
        Insert: {
          asset_page_id: number
          avg_position?: number
          avg_position_delta?: number
          clicks?: number
          clicks_delta?: number
          created_at?: string
          ctr?: number
          ctr_delta?: number
          id?: number
          impressions?: number
          impressions_delta?: number
          period_end: string
          period_start: string
          prior_period_end?: string | null
          prior_period_start?: string | null
          pulled_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          asset_page_id?: number
          avg_position?: number
          avg_position_delta?: number
          clicks?: number
          clicks_delta?: number
          created_at?: string
          ctr?: number
          ctr_delta?: number
          id?: number
          impressions?: number
          impressions_delta?: number
          period_end?: string
          period_start?: string
          prior_period_end?: string | null
          prior_period_start?: string | null
          pulled_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_metrics_current_asset_page_id_fkey"
            columns: ["asset_page_id"]
            isOneToOne: true
            referencedRelation: "asset_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          customer_id: number | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          customer_id?: number | null
          email?: string
          full_name?: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          customer_id?: number | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deliverables: {
        Row: {
          created_at: string
          id: number
          project_id: number
          stage: number | null
          status: Database["public"]["Enums"]["deliverable_status"]
          step: number | null
          title: string
          type: Database["public"]["Enums"]["deliverable_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          project_id: number
          stage?: number | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          step?: number | null
          title: string
          type: Database["public"]["Enums"]["deliverable_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          project_id?: number
          stage?: number | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          step?: number | null
          title?: string
          type?: Database["public"]["Enums"]["deliverable_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deliverables_stage_step_fkey"
            columns: ["stage", "step"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["stage", "step"]
          },
        ]
      }
      project_stages: {
        Row: {
          ordinal: number
          stage: number
          stage_name: string
          step: number
          step_name: string
        }
        Insert: {
          ordinal: number
          stage: number
          stage_name: string
          step: number
          step_name: string
        }
        Update: {
          ordinal?: number
          stage?: number
          stage_name?: string
          step?: number
          step_name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          completed_on: string | null
          created_at: string
          customer_id: number
          deadline: string | null
          id: number
          name: string
          notes: string
          proposal: string
          proposal_artifact_id: number | null
          stage: number
          start_on: string | null
          step: number
          system_description: string
          updated_at: string
          version: number
        }
        Insert: {
          completed_on?: string | null
          created_at?: string
          customer_id: number
          deadline?: string | null
          id?: number
          name: string
          notes?: string
          proposal?: string
          proposal_artifact_id?: number | null
          stage?: number
          start_on?: string | null
          step?: number
          system_description?: string
          updated_at?: string
          version?: number
        }
        Update: {
          completed_on?: string | null
          created_at?: string
          customer_id?: number
          deadline?: string | null
          id?: number
          name?: string
          notes?: string
          proposal?: string
          proposal_artifact_id?: number | null
          stage?: number
          start_on?: string | null
          step?: number
          system_description?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_proposal_artifact_id_fkey"
            columns: ["proposal_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_stage_step_fkey"
            columns: ["stage", "step"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["stage", "step"]
          },
        ]
      }
      seo_opportunities: {
        Row: {
          asset_id: number
          asset_page_id: number
          avg_position: number
          clicks: number
          created_at: string
          ctr: number
          detected_at: string
          evidence_json: Json
          id: number
          impact_score: number | null
          impressions: number
          opportunity_type: Database["public"]["Enums"]["seo_opportunity_type"]
          priority: Database["public"]["Enums"]["seo_opportunity_priority"]
          problem: string
          recommended_workflow: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["seo_opportunity_status"]
          task_id: number | null
          updated_at: string
          version: number
        }
        Insert: {
          asset_id: number
          asset_page_id: number
          avg_position?: number
          clicks?: number
          created_at?: string
          ctr?: number
          detected_at?: string
          evidence_json?: Json
          id?: number
          impact_score?: number | null
          impressions?: number
          opportunity_type: Database["public"]["Enums"]["seo_opportunity_type"]
          priority: Database["public"]["Enums"]["seo_opportunity_priority"]
          problem: string
          recommended_workflow?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["seo_opportunity_status"]
          task_id?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          asset_id?: number
          asset_page_id?: number
          avg_position?: number
          clicks?: number
          created_at?: string
          ctr?: number
          detected_at?: string
          evidence_json?: Json
          id?: number
          impact_score?: number | null
          impressions?: number
          opportunity_type?: Database["public"]["Enums"]["seo_opportunity_type"]
          priority?: Database["public"]["Enums"]["seo_opportunity_priority"]
          problem?: string
          recommended_workflow?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["seo_opportunity_status"]
          task_id?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "seo_opportunities_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_opportunities_asset_page_id_fkey"
            columns: ["asset_page_id"]
            isOneToOne: false
            referencedRelation: "asset_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_opportunities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agent_note: string
          asset_id: number | null
          assigned_to: string
          created_at: string
          customer_id: number | null
          due_on: string | null
          id: number
          notes: string
          page_url: string
          project_id: number | null
          seo_opportunity_id: number | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          agent_note?: string
          asset_id?: number | null
          assigned_to?: string
          created_at?: string
          customer_id?: number | null
          due_on?: string | null
          id?: number
          notes?: string
          page_url?: string
          project_id?: number | null
          seo_opportunity_id?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          agent_note?: string
          asset_id?: number | null
          assigned_to?: string
          created_at?: string
          customer_id?: number | null
          due_on?: string | null
          id?: number
          notes?: string
          page_url?: string
          project_id?: number | null
          seo_opportunity_id?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_seo_opportunity_id_fkey"
            columns: ["seo_opportunity_id"]
            isOneToOne: false
            referencedRelation: "seo_opportunities"
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
      app_role: "admin" | "designer" | "customer"
      artifact_status: "draft" | "final" | "archived"
      artifact_type: "report" | "data" | "proposal" | "other"
      asset_type: "website" | "staging" | "other" | "managed_website"
      competitor_run_status: "pending" | "running" | "done" | "failed"
      competitor_type: "competitor" | "target" | "business"
      connection_status: "unknown" | "connected" | "error" | "disconnected"
      content_type: "link" | "md" | "json" | "csv" | "other"
      customer_lifecycle: "lead" | "customer" | "inactive"
      deliverable_status: "planned" | "in_progress" | "done" | "dropped"
      deliverable_type:
        | "goal_target"
        | "collection_of_work"
        | "guaranteed_outcome"
      seo_opportunity_priority: "high" | "medium" | "low"
      seo_opportunity_status:
        | "open"
        | "task_created"
        | "complete"
        | "dismissed"
        | "snoozed"
      seo_opportunity_type:
        | "low_ctr"
        | "striking_distance"
        | "page_speed"
        | "content_refresh"
        | "serp_gap"
        | "indexation"
        | "thin_content"
        | "internal_link"
        | "other"
      snapshot_type: "baseline" | "update"
      task_status: "not_started" | "in_progress" | "blocked" | "completed"
      task_type: "task" | "agent_task" | "internal"
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
      app_role: ["admin", "designer", "customer"],
      artifact_status: ["draft", "final", "archived"],
      artifact_type: ["report", "data", "proposal", "other"],
      asset_type: ["website", "staging", "other", "managed_website"],
      competitor_run_status: ["pending", "running", "done", "failed"],
      competitor_type: ["competitor", "target", "business"],
      connection_status: ["unknown", "connected", "error", "disconnected"],
      content_type: ["link", "md", "json", "csv", "other"],
      customer_lifecycle: ["lead", "customer", "inactive"],
      deliverable_status: ["planned", "in_progress", "done", "dropped"],
      deliverable_type: [
        "goal_target",
        "collection_of_work",
        "guaranteed_outcome",
      ],
      seo_opportunity_priority: ["high", "medium", "low"],
      seo_opportunity_status: [
        "open",
        "task_created",
        "complete",
        "dismissed",
        "snoozed",
      ],
      seo_opportunity_type: [
        "low_ctr",
        "striking_distance",
        "page_speed",
        "content_refresh",
        "serp_gap",
        "indexation",
        "thin_content",
        "internal_link",
        "other",
      ],
      snapshot_type: ["baseline", "update"],
      task_status: ["not_started", "in_progress", "blocked", "completed"],
      task_type: ["task", "agent_task", "internal"],
    },
  },
} as const
