export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: number
          business_name: string
          contact_first_name: string
          contact_last_name: string
          email: string
          phone: string
          address: string
          location: string
          website: string
          contact_method: string
          lifecycle: Database['public']['Enums']['customer_lifecycle']
          notes: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          business_name: string
          id?: number
          contact_first_name?: string
          contact_last_name?: string
          email?: string
          phone?: string
          address?: string
          location?: string
          website?: string
          contact_method?: string
          lifecycle?: Database['public']['Enums']['customer_lifecycle']
          notes?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
        Relationships: []
      }
      projects: {
        Row: {
          id: number
          customer_id: number
          name: string
          system_description: string
          stage: number
          step: number
          notes: string
          proposal: string
          proposal_artifact_id: number | null
          start_on: string | null
          deadline: string | null
          completed_on: string | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          customer_id: number
          name: string
          id?: number
          system_description?: string
          stage?: number
          step?: number
          notes?: string
          proposal?: string
          proposal_artifact_id?: number | null
          start_on?: string | null
          deadline?: string | null
          completed_on?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
        Relationships: []
      }
      project_stages: {
        Row: {
          stage: number
          step: number
          stage_name: string
          step_name: string
          ordinal: number
        }
        Insert: Database['public']['Tables']['project_stages']['Row']
        Update: Partial<Database['public']['Tables']['project_stages']['Row']>
        Relationships: []
      }
      assets: {
        Row: {
          id: number
          customer_id: number
          project_id: number | null
          asset_type: Database['public']['Enums']['asset_type']
          name: string
          asset_url: string
          health_score: number | null
          conversion_event_name: string
          gsc_status: Database['public']['Enums']['connection_status']
          ga4_status: Database['public']['Enums']['connection_status']
          wp_cli_status: Database['public']['Enums']['connection_status']
          hermes_profile: string
          telegram_topic: string
          workspace: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          customer_id: number
          id?: number
          project_id?: number | null
          asset_type?: Database['public']['Enums']['asset_type']
          name?: string
          asset_url?: string
          health_score?: number | null
          conversion_event_name?: string
          gsc_status?: Database['public']['Enums']['connection_status']
          ga4_status?: Database['public']['Enums']['connection_status']
          wp_cli_status?: Database['public']['Enums']['connection_status']
          hermes_profile?: string
          telegram_topic?: string
          workspace?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
        Relationships: []
      }
      project_deliverables: {
        Row: {
          id: number
          project_id: number
          title: string
          type: Database['public']['Enums']['deliverable_type']
          status: Database['public']['Enums']['deliverable_status']
          stage: number | null
          step: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: number
          title: string
          type: Database['public']['Enums']['deliverable_type']
          id?: number
          status?: Database['public']['Enums']['deliverable_status']
          stage?: number | null
          step?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['project_deliverables']['Insert']>
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          project_id: number | null
          asset_id: number | null
          customer_id: number | null
          title: string
          notes: string
          status: Database['public']['Enums']['task_status']
          task_type: Database['public']['Enums']['task_type']
          due_on: string | null
          assigned_to: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          id?: number
          project_id?: number | null
          asset_id?: number | null
          customer_id?: number | null
          notes?: string
          status?: Database['public']['Enums']['task_status']
          task_type?: Database['public']['Enums']['task_type']
          due_on?: string | null
          assigned_to?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
        Relationships: []
      }
      competitor_analysis_runs: {
        Row: {
          id: number
          asset_id: number
          search_location_code: number
          search_location_name: string
          search_language_code: string
          competitor_inputs: Json
          status: Database['public']['Enums']['competitor_run_status']
          error_message: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          asset_id: number
          id?: number
          search_location_code?: number
          search_location_name?: string
          search_language_code?: string
          competitor_inputs?: Json
          status?: Database['public']['Enums']['competitor_run_status']
          error_message?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['competitor_analysis_runs']['Insert']>
        Relationships: []
      }
      competitor_snapshots: {
        Row: {
          id: number
          asset_id: number
          run_id: number | null
          type: Database['public']['Enums']['competitor_type']
          business_name: string
          url: string
          location: string
          notes: string
          total_keywords: number | null
          organic_traffic: number | null
          traffic_value: number | null
          paid_traffic: number | null
          top_3_keywords: number | null
          top_10_keywords: number | null
          top_100_keywords: number | null
          position_1: number | null
          position_2_3: number | null
          position_4_10: number | null
          position_11_20: number | null
          position_21_50: number | null
          position_51_100: number | null
          keyword_gaps: number | null
          backlinks: number | null
          referring_domains: number | null
          domain_rank: number | null
          spam_score: number | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          asset_id: number
          type: Database['public']['Enums']['competitor_type']
          business_name: string
          id?: number
          run_id?: number | null
          url?: string
          location?: string
          notes?: string
          total_keywords?: number | null
          organic_traffic?: number | null
          traffic_value?: number | null
          paid_traffic?: number | null
          top_3_keywords?: number | null
          top_10_keywords?: number | null
          top_100_keywords?: number | null
          position_1?: number | null
          position_2_3?: number | null
          position_4_10?: number | null
          position_11_20?: number | null
          position_21_50?: number | null
          position_51_100?: number | null
          keyword_gaps?: number | null
          backlinks?: number | null
          referring_domains?: number | null
          domain_rank?: number | null
          spam_score?: number | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['competitor_snapshots']['Insert']>
        Relationships: []
      }
      metrics_snapshots: {
        Row: {
          id: number
          asset_id: number
          period_label: string
          snapshot_type: Database['public']['Enums']['snapshot_type']
          domain_rank: number | null
          domain_rank_delta: number | null
          clicks: number | null
          clicks_delta: number | null
          impressions: number | null
          impressions_delta: number | null
          ctr: number | null
          ctr_delta: number | null
          avg_rank: number | null
          avg_rank_delta: number | null
          conversions: number | null
          conversions_delta: number | null
          engagement_rate: number | null
          engagement_rate_delta: number | null
          avg_session_duration: number | null
          avg_session_duration_delta: number | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          asset_id: number
          period_label: string
          id?: number
          snapshot_type?: Database['public']['Enums']['snapshot_type']
          domain_rank?: number | null
          domain_rank_delta?: number | null
          clicks?: number | null
          clicks_delta?: number | null
          impressions?: number | null
          impressions_delta?: number | null
          ctr?: number | null
          ctr_delta?: number | null
          avg_rank?: number | null
          avg_rank_delta?: number | null
          conversions?: number | null
          conversions_delta?: number | null
          engagement_rate?: number | null
          engagement_rate_delta?: number | null
          avg_session_duration?: number | null
          avg_session_duration_delta?: number | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['metrics_snapshots']['Insert']>
        Relationships: []
      }
      asset_connections: {
        Row: {
          id: number
          asset_id: number
          provider: string
          status: Database['public']['Enums']['connection_status']
          config: Json
          secret_ref: string
          last_sync_at: string | null
          last_error: string
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          asset_id: number
          provider: string
          id?: number
          status?: Database['public']['Enums']['connection_status']
          config?: Json
          secret_ref?: string
          last_sync_at?: string | null
          last_error?: string
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['asset_connections']['Insert']>
        Relationships: []
      }
      asset_pages: {
        Row: {
          id: number
          asset_id: number
          url_path: string
          canonical_url: string
          wp_post_id: number | null
          wp_post_type: string
          title: string
          is_priority: boolean
          scos_next_step: string
          scos_index_status: string
          topic_slug: string
          cluster_slug: string
          wp_meta_snapshot: Json
          meta_synced_at: string | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          asset_id: number
          url_path: string
          id?: number
          canonical_url?: string
          wp_post_id?: number | null
          wp_post_type?: string
          title?: string
          is_priority?: boolean
          scos_next_step?: string
          scos_index_status?: string
          topic_slug?: string
          cluster_slug?: string
          wp_meta_snapshot?: Json
          meta_synced_at?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['asset_pages']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      customer_lifecycle: 'lead' | 'customer' | 'inactive'
      asset_type: 'website' | 'staging' | 'other' | 'managed_website'
      competitor_run_status: 'pending' | 'running' | 'done' | 'failed'
      competitor_type: 'competitor' | 'target' | 'business'
      connection_status: 'unknown' | 'connected' | 'error' | 'disconnected'
      deliverable_type: 'goal_target' | 'collection_of_work' | 'guaranteed_outcome'
      deliverable_status: 'planned' | 'in_progress' | 'done' | 'dropped'
      task_status: 'not_started' | 'in_progress' | 'blocked' | 'completed'
      task_type: 'task' | 'agent_task' | 'internal'
      snapshot_type: 'baseline' | 'update'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
