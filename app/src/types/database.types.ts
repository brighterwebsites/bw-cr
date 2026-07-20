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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      customer_lifecycle: 'lead' | 'customer' | 'inactive'
      asset_type: 'website' | 'staging' | 'other'
      connection_status: 'unknown' | 'connected' | 'error' | 'disconnected'
      deliverable_type: 'goal_target' | 'collection_of_work' | 'guaranteed_outcome'
      deliverable_status: 'planned' | 'in_progress' | 'done' | 'dropped'
      task_status: 'not_started' | 'in_progress' | 'blocked' | 'completed'
      task_type: 'task' | 'agent_task' | 'internal'
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
