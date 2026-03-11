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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_insights_cache: {
        Row: {
          actions: Json | null
          ad_account_id: string
          clicks: number
          date_preset: string
          id: string
          impressions: number
          reach: number
          spend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          ad_account_id: string
          clicks?: number
          date_preset: string
          id?: string
          impressions?: number
          reach?: number
          spend?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          ad_account_id?: string
          clicks?: number
          date_preset?: string
          id?: string
          impressions?: number
          reach?: number
          spend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_configurations: {
        Row: {
          api_key: string
          config_data: Json | null
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          max_tokens: number | null
          model_name: string | null
          provider: string
          temperature: number | null
          updated_at: string
        }
        Insert: {
          api_key: string
          config_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number | null
          model_name?: string | null
          provider: string
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          api_key?: string
          config_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number | null
          model_name?: string | null
          provider?: string
          temperature?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      asaas_config: {
        Row: {
          api_key: string | null
          created_at: string
          environment: string
          id: string
          is_active: boolean
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          environment: string
          id?: string
          is_active?: boolean
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      asaas_pending_checkouts: {
        Row: {
          asaas_checkout_id: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          environment: string
          id: string
          plan_code: string
          plan_id: string
          status: string
          updated_at: string
          user_email: string
        }
        Insert: {
          asaas_checkout_id?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          environment: string
          id?: string
          plan_code: string
          plan_id: string
          status?: string
          updated_at?: string
          user_email: string
        }
        Update: {
          asaas_checkout_id?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          environment?: string
          id?: string
          plan_code?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      asaas_plans: {
        Row: {
          amount: number
          billing_type: string
          charge_type: string
          created_at: string
          cycle: string
          description: string | null
          environment: string
          id: string
          internal_slug: string
          is_active: boolean
          is_default_annual: boolean
          is_default_monthly: boolean
          max_installment_count: number
          metadata: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          billing_type?: string
          charge_type?: string
          created_at?: string
          cycle: string
          description?: string | null
          environment: string
          id?: string
          internal_slug: string
          is_active?: boolean
          is_default_annual?: boolean
          is_default_monthly?: boolean
          max_installment_count?: number
          metadata?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_type?: string
          charge_type?: string
          created_at?: string
          cycle?: string
          description?: string | null
          environment?: string
          id?: string
          internal_slug?: string
          is_active?: boolean
          is_default_annual?: boolean
          is_default_monthly?: boolean
          max_installment_count?: number
          metadata?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      asaas_webhook_events: {
        Row: {
          created_at: string
          environment: string
          error_message: string | null
          event_type: string
          external_id: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          environment: string
          error_message?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          environment?: string
          error_message?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          business_description: string | null
          business_goals: string | null
          business_name: string | null
          campaign_profile_id: string | null
          category: string | null
          created_at: string
          id: string
          main_product: string | null
          odont_specialties: string[] | null
          specialty_tickets: Json | null
          strategic_notes: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_audience: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          business_description?: string | null
          business_goals?: string | null
          business_name?: string | null
          campaign_profile_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          main_product?: string | null
          odont_specialties?: string[] | null
          specialty_tickets?: Json | null
          strategic_notes?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          business_description?: string | null
          business_goals?: string | null
          business_name?: string | null
          campaign_profile_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          main_product?: string | null
          odont_specialties?: string[] | null
          specialty_tickets?: Json | null
          strategic_notes?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_campaign_profile_id_fkey"
            columns: ["campaign_profile_id"]
            isOneToOne: false
            referencedRelation: "campaign_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contingency: {
        Row: {
          access_token_preview: string | null
          ad_account_id: string | null
          admin_notes: string | null
          attempts: number | null
          campaign_data: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          error_message: string | null
          error_stack: string | null
          error_stage: string | null
          id: string
          instagram_id: string | null
          meta_api_trace_id: string | null
          page_id: string | null
          partial_meta_ad_id: string | null
          partial_meta_adset_id: string | null
          partial_meta_campaign_id: string | null
          partial_meta_creative_id: string | null
          retry_strategy: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_preview?: string | null
          ad_account_id?: string | null
          admin_notes?: string | null
          attempts?: number | null
          campaign_data: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_stage?: string | null
          id?: string
          instagram_id?: string | null
          meta_api_trace_id?: string | null
          page_id?: string | null
          partial_meta_ad_id?: string | null
          partial_meta_adset_id?: string | null
          partial_meta_campaign_id?: string | null
          partial_meta_creative_id?: string | null
          retry_strategy?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_preview?: string | null
          ad_account_id?: string | null
          admin_notes?: string | null
          attempts?: number | null
          campaign_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_stage?: string | null
          id?: string
          instagram_id?: string | null
          meta_api_trace_id?: string | null
          page_id?: string | null
          partial_meta_ad_id?: string | null
          partial_meta_adset_id?: string | null
          partial_meta_campaign_id?: string | null
          partial_meta_creative_id?: string | null
          retry_strategy?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contingency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_jobs: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          error_details: Json | null
          error_message: string | null
          id: string
          job_type: string
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_profiles: {
        Row: {
          age_max: number
          age_min: number
          created_at: string
          created_by: string | null
          description: string | null
          enable_language_targeting: boolean
          genders: string
          id: string
          interests: Json
          is_active: boolean
          label: string
          languages: Json
          placements: Json
          placements_mode: Database["public"]["Enums"]["placements_mode"]
          show_dental_specialties: boolean
          show_strategic_reports: boolean
          slug: string
          updated_at: string
          version: number
        }
        Insert: {
          age_max?: number
          age_min?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          enable_language_targeting?: boolean
          genders?: string
          id?: string
          interests?: Json
          is_active?: boolean
          label: string
          languages?: Json
          placements?: Json
          placements_mode?: Database["public"]["Enums"]["placements_mode"]
          show_dental_specialties?: boolean
          show_strategic_reports?: boolean
          slug: string
          updated_at?: string
          version?: number
        }
        Update: {
          age_max?: number
          age_min?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          enable_language_targeting?: boolean
          genders?: string
          id?: string
          interests?: Json
          is_active?: boolean
          label?: string
          languages?: Json
          placements?: Json
          placements_mode?: Database["public"]["Enums"]["placements_mode"]
          show_dental_specialties?: boolean
          show_strategic_reports?: boolean
          slug?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      campaign_sync_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          kind: string
          meta_campaign_id: string
          user_id: string
          visible_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          kind: string
          meta_campaign_id: string
          user_id: string
          visible_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          kind?: string
          meta_campaign_id?: string
          user_id?: string
          visible_at?: string | null
        }
        Relationships: []
      }
      campaign_templates: {
        Row: {
          best_practices: string[]
          created_at: string
          creative_guidelines: string[]
          description: string
          id: string
          is_active: boolean
          key_messages: string[]
          objective: string
          sector_id: string
          success_metrics: string[]
          suggested_budget_max: number
          suggested_budget_min: number
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          best_practices?: string[]
          created_at?: string
          creative_guidelines?: string[]
          description: string
          id?: string
          is_active?: boolean
          key_messages?: string[]
          objective: string
          sector_id: string
          success_metrics?: string[]
          suggested_budget_max: number
          suggested_budget_min: number
          target_audience: string
          title: string
          updated_at?: string
        }
        Update: {
          best_practices?: string[]
          created_at?: string
          creative_guidelines?: string[]
          description?: string
          id?: string
          is_active?: boolean
          key_messages?: string[]
          objective?: string
          sector_id?: string
          success_metrics?: string[]
          suggested_budget_max?: number
          suggested_budget_min?: number
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_templates_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sector_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_account_id: string | null
          ad_text: string | null
          ad_title: string | null
          age_max: number | null
          age_min: number | null
          applied_profile_id: string | null
          applied_profile_version: number | null
          budget_daily: number | null
          budget_total: number | null
          created_at: string
          deleted_at: string | null
          destination_url: string | null
          devices: Json | null
          end_date: string | null
          error_log: Json | null
          facebook_page: string | null
          gender: string | null
          id: string
          instagram_account: string | null
          interests: Json | null
          is_deleted_on_meta: boolean
          job_id: string | null
          last_discovered_at: string | null
          last_metrics_sync_at: string | null
          last_processed_at: string | null
          last_status_sync_at: string | null
          location_city: string | null
          location_country: string | null
          location_radius: number | null
          location_selected_locations: Json | null
          location_state: string | null
          media_file_id: string | null
          media_preview_url: string | null
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          meta_data: Json | null
          meta_data_cached_at: string | null
          meta_integration_status: string | null
          meta_updated_time: string | null
          metrics: Json | null
          metrics_window: string
          name: string
          needs_immediate_sync: boolean | null
          objective: string
          placements: Json | null
          processing_status: string | null
          retry_count: number | null
          selected_locations: Json | null
          source: string
          start_date: string | null
          status: string
          status_at_sync: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          ad_account_id?: string | null
          ad_text?: string | null
          ad_title?: string | null
          age_max?: number | null
          age_min?: number | null
          applied_profile_id?: string | null
          applied_profile_version?: number | null
          budget_daily?: number | null
          budget_total?: number | null
          created_at?: string
          deleted_at?: string | null
          destination_url?: string | null
          devices?: Json | null
          end_date?: string | null
          error_log?: Json | null
          facebook_page?: string | null
          gender?: string | null
          id?: string
          instagram_account?: string | null
          interests?: Json | null
          is_deleted_on_meta?: boolean
          job_id?: string | null
          last_discovered_at?: string | null
          last_metrics_sync_at?: string | null
          last_processed_at?: string | null
          last_status_sync_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_radius?: number | null
          location_selected_locations?: Json | null
          location_state?: string | null
          media_file_id?: string | null
          media_preview_url?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          meta_data?: Json | null
          meta_data_cached_at?: string | null
          meta_integration_status?: string | null
          meta_updated_time?: string | null
          metrics?: Json | null
          metrics_window?: string
          name: string
          needs_immediate_sync?: boolean | null
          objective: string
          placements?: Json | null
          processing_status?: string | null
          retry_count?: number | null
          selected_locations?: Json | null
          source?: string
          start_date?: string | null
          status?: string
          status_at_sync?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          ad_account_id?: string | null
          ad_text?: string | null
          ad_title?: string | null
          age_max?: number | null
          age_min?: number | null
          applied_profile_id?: string | null
          applied_profile_version?: number | null
          budget_daily?: number | null
          budget_total?: number | null
          created_at?: string
          deleted_at?: string | null
          destination_url?: string | null
          devices?: Json | null
          end_date?: string | null
          error_log?: Json | null
          facebook_page?: string | null
          gender?: string | null
          id?: string
          instagram_account?: string | null
          interests?: Json | null
          is_deleted_on_meta?: boolean
          job_id?: string | null
          last_discovered_at?: string | null
          last_metrics_sync_at?: string | null
          last_processed_at?: string | null
          last_status_sync_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_radius?: number | null
          location_selected_locations?: Json | null
          location_state?: string | null
          media_file_id?: string | null
          media_preview_url?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          meta_data?: Json | null
          meta_data_cached_at?: string | null
          meta_integration_status?: string | null
          meta_updated_time?: string | null
          metrics?: Json | null
          metrics_window?: string
          name?: string
          needs_immediate_sync?: boolean | null
          objective?: string
          placements?: Json | null
          processing_status?: string | null
          retry_count?: number | null
          selected_locations?: Json | null
          source?: string
          start_date?: string | null
          status?: string
          status_at_sync?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      code_snapshots: {
        Row: {
          created_at: string
          dependencies: Json | null
          description: string | null
          file_paths: Json | null
          files_data: Json
          id: string
          metadata: Json | null
          sector: string
          snapshot_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dependencies?: Json | null
          description?: string | null
          file_paths?: Json | null
          files_data?: Json
          id?: string
          metadata?: Json | null
          sector: string
          snapshot_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dependencies?: Json | null
          description?: string | null
          file_paths?: Json | null
          files_data?: Json
          id?: string
          metadata?: Json | null
          sector?: string
          snapshot_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expected_ad_set_settings: {
        Row: {
          ad_account_id: string
          ad_set_id: string | null
          campaign_id: string
          created_at: string
          error_details: Json | null
          expected_budget_amount: number
          expected_budget_type: string
          expected_instagram_profile_id: string | null
          expected_locality_json: Json
          expected_name: string
          id: string
          is_pending_verification: boolean | null
          last_verified_at: string | null
          updated_at: string
          user_id: string | null
          verification_status: string
        }
        Insert: {
          ad_account_id: string
          ad_set_id?: string | null
          campaign_id: string
          created_at?: string
          error_details?: Json | null
          expected_budget_amount: number
          expected_budget_type: string
          expected_instagram_profile_id?: string | null
          expected_locality_json: Json
          expected_name: string
          id?: string
          is_pending_verification?: boolean | null
          last_verified_at?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string
        }
        Update: {
          ad_account_id?: string
          ad_set_id?: string | null
          campaign_id?: string
          created_at?: string
          error_details?: Json | null
          expected_budget_amount?: number
          expected_budget_type?: string
          expected_instagram_profile_id?: string | null
          expected_locality_json?: Json
          expected_name?: string
          id?: string
          is_pending_verification?: boolean | null
          last_verified_at?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      integration_access_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          integration_id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          integration_id: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          integration_id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_access_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          ad_account_id: string | null
          app_id: string | null
          app_id_origem: string | null
          app_secret: string | null
          business_manager_id: string | null
          created_at: string
          id: string
          is_syncing_campaigns: boolean | null
          last_token_refresh: string | null
          meta_assets: Json | null
          page_id: string | null
          provider: string
          refresh_token: string | null
          selected_accounts: Json | null
          selected_ad_account_ids: string[] | null
          selected_business_id: string | null
          selected_instagram_ids: string[] | null
          selected_page_ids: string[] | null
          selected_pages: Json | null
          selected_waba_id: string | null
          selected_whatsapp_display: string | null
          selected_whatsapp_phone_id: string | null
          selected_whatsapp_verified_name: string | null
          status: string
          token_expires_at: string | null
          token_refresh_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          ad_account_id?: string | null
          app_id?: string | null
          app_id_origem?: string | null
          app_secret?: string | null
          business_manager_id?: string | null
          created_at?: string
          id?: string
          is_syncing_campaigns?: boolean | null
          last_token_refresh?: string | null
          meta_assets?: Json | null
          page_id?: string | null
          provider: string
          refresh_token?: string | null
          selected_accounts?: Json | null
          selected_ad_account_ids?: string[] | null
          selected_business_id?: string | null
          selected_instagram_ids?: string[] | null
          selected_page_ids?: string[] | null
          selected_pages?: Json | null
          selected_waba_id?: string | null
          selected_whatsapp_display?: string | null
          selected_whatsapp_phone_id?: string | null
          selected_whatsapp_verified_name?: string | null
          status?: string
          token_expires_at?: string | null
          token_refresh_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          ad_account_id?: string | null
          app_id?: string | null
          app_id_origem?: string | null
          app_secret?: string | null
          business_manager_id?: string | null
          created_at?: string
          id?: string
          is_syncing_campaigns?: boolean | null
          last_token_refresh?: string | null
          meta_assets?: Json | null
          page_id?: string | null
          provider?: string
          refresh_token?: string | null
          selected_accounts?: Json | null
          selected_ad_account_ids?: string[] | null
          selected_business_id?: string | null
          selected_instagram_ids?: string[] | null
          selected_page_ids?: string[] | null
          selected_pages?: Json | null
          selected_waba_id?: string | null
          selected_whatsapp_display?: string | null
          selected_whatsapp_phone_id?: string | null
          selected_whatsapp_verified_name?: string | null
          status?: string
          token_expires_at?: string | null
          token_refresh_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_rate_limit: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          last_submission: string
          submission_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: unknown
          last_submission?: string
          submission_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          last_submission?: string
          submission_count?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          answers: Json
          best_contact_time: string | null
          city: string | null
          clinic_name: string | null
          comments: Json | null
          created_at: string
          desired_monthly_spend_range: string | null
          device: string | null
          email: string | null
          expectations: string | null
          id: string
          instagram: string | null
          main_goal: string | null
          name: string | null
          notes: string | null
          owner_id: string | null
          page_path: string | null
          platforms: string[] | null
          preferred_channel: string | null
          prev_monthly_spend: number | null
          referrer: string | null
          specialties: string[] | null
          specialty: string | null
          start_timing: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          used_paid_traffic: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          website: string | null
          whatsapp_e164: string | null
        }
        Insert: {
          answers?: Json
          best_contact_time?: string | null
          city?: string | null
          clinic_name?: string | null
          comments?: Json | null
          created_at?: string
          desired_monthly_spend_range?: string | null
          device?: string | null
          email?: string | null
          expectations?: string | null
          id?: string
          instagram?: string | null
          main_goal?: string | null
          name?: string | null
          notes?: string | null
          owner_id?: string | null
          page_path?: string | null
          platforms?: string[] | null
          preferred_channel?: string | null
          prev_monthly_spend?: number | null
          referrer?: string | null
          specialties?: string[] | null
          specialty?: string | null
          start_timing?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          used_paid_traffic?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          website?: string | null
          whatsapp_e164?: string | null
        }
        Update: {
          answers?: Json
          best_contact_time?: string | null
          city?: string | null
          clinic_name?: string | null
          comments?: Json | null
          created_at?: string
          desired_monthly_spend_range?: string | null
          device?: string | null
          email?: string | null
          expectations?: string | null
          id?: string
          instagram?: string | null
          main_goal?: string | null
          name?: string | null
          notes?: string | null
          owner_id?: string | null
          page_path?: string | null
          platforms?: string[] | null
          preferred_channel?: string | null
          prev_monthly_spend?: number | null
          referrer?: string | null
          specialties?: string[] | null
          specialty?: string | null
          start_timing?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          used_paid_traffic?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          website?: string | null
          whatsapp_e164?: string | null
        }
        Relationships: []
      }
      learning_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_content_comments: {
        Row: {
          comment_text: string
          content_id: string
          created_at: string
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          content_id: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          content_id?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_learning_comments_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "learning_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_content_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "learning_content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_contents: {
        Row: {
          category_id: string | null
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          sort_order: number | null
          supplementary_material: Json | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          sort_order?: number | null
          supplementary_material?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          sort_order?: number | null
          supplementary_material?: Json | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_contents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          email: string | null
          id: string
          ip_address: string
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email?: string | null
          id?: string
          ip_address: string
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      media_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          filename: string
          id: string
          metadata: Json | null
          public_url: string | null
          source: string | null
          storage_path: string | null
          tags: string[] | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          metadata?: Json | null
          public_url?: string | null
          source?: string | null
          storage_path?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          metadata?: Json | null
          public_url?: string | null
          source?: string | null
          storage_path?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meta_ads_config: {
        Row: {
          app_id: string
          app_secret: string
          business_manager_id: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          app_id: string
          app_secret: string
          business_manager_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          app_secret?: string
          business_manager_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_rate_limits: {
        Row: {
          ad_account_id: string
          blocked_until: string | null
          created_at: string
          id: string
          last_error_at: string | null
          last_error_code: string | null
          updated_at: string
        }
        Insert: {
          ad_account_id: string
          blocked_until?: string | null
          created_at?: string
          id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          updated_at?: string
        }
        Update: {
          ad_account_id?: string
          blocked_until?: string | null
          created_at?: string
          id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meta_whatsapp_numbers: {
        Row: {
          business_id: string
          created_at: string | null
          display_phone_number: string | null
          id: string
          phone_number_id: string
          updated_at: string | null
          user_id: string
          verified_name: string | null
          waba_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          display_phone_number?: string | null
          id?: string
          phone_number_id: string
          updated_at?: string | null
          user_id: string
          verified_name?: string | null
          waba_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          display_phone_number?: string | null
          id?: string
          phone_number_id?: string
          updated_at?: string | null
          user_id?: string
          verified_name?: string | null
          waba_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pagarme_config: {
        Row: {
          account_id: string | null
          api_version: string | null
          billing_grace_days: number | null
          charge_day: number | null
          created_at: string | null
          encryption_key: string | null
          environment: string
          free_installments: number | null
          id: string
          installments_max: number | null
          interest_rate: number | null
          plan_id_anual: string | null
          plan_id_mensal: string | null
          public_key: string | null
          secret_key: string | null
          statement_descriptor: string | null
          stripe_custom_payment_method_id: string | null
          subscription_mode: string | null
          trial_days: number | null
          updated_at: string | null
          webhook_basic_password: string | null
          webhook_basic_user: string | null
          webhook_secret: string | null
        }
        Insert: {
          account_id?: string | null
          api_version?: string | null
          billing_grace_days?: number | null
          charge_day?: number | null
          created_at?: string | null
          encryption_key?: string | null
          environment?: string
          free_installments?: number | null
          id?: string
          installments_max?: number | null
          interest_rate?: number | null
          plan_id_anual?: string | null
          plan_id_mensal?: string | null
          public_key?: string | null
          secret_key?: string | null
          statement_descriptor?: string | null
          stripe_custom_payment_method_id?: string | null
          subscription_mode?: string | null
          trial_days?: number | null
          updated_at?: string | null
          webhook_basic_password?: string | null
          webhook_basic_user?: string | null
          webhook_secret?: string | null
        }
        Update: {
          account_id?: string | null
          api_version?: string | null
          billing_grace_days?: number | null
          charge_day?: number | null
          created_at?: string | null
          encryption_key?: string | null
          environment?: string
          free_installments?: number | null
          id?: string
          installments_max?: number | null
          interest_rate?: number | null
          plan_id_anual?: string | null
          plan_id_mensal?: string | null
          public_key?: string | null
          secret_key?: string | null
          statement_descriptor?: string | null
          stripe_custom_payment_method_id?: string | null
          subscription_mode?: string | null
          trial_days?: number | null
          updated_at?: string | null
          webhook_basic_password?: string | null
          webhook_basic_user?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      pagarme_config_audit: {
        Row: {
          action: string
          config_id: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          config_id?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          config_id?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      pagarme_customers: {
        Row: {
          created_at: string | null
          email: string
          environment: string
          id: string
          pagarme_customer_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          environment: string
          id?: string
          pagarme_customer_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          environment?: string
          id?: string
          pagarme_customer_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pagarme_event_log: {
        Row: {
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          raw_data: Json
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          raw_data: Json
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          raw_data?: Json
        }
        Relationships: []
      }
      pagarme_events: {
        Row: {
          environment: string
          event_type: string
          external_id: string | null
          id: number
          raw: Json
          received_at: string | null
        }
        Insert: {
          environment: string
          event_type: string
          external_id?: string | null
          id?: number
          raw: Json
          received_at?: string | null
        }
        Update: {
          environment?: string
          event_type?: string
          external_id?: string | null
          id?: number
          raw?: Json
          received_at?: string | null
        }
        Relationships: []
      }
      pagarme_settings: {
        Row: {
          active_environment: string
          created_at: string | null
          id: string
          live_account_id: string | null
          live_encryption_key: string | null
          live_plan_id_anual: string | null
          live_plan_id_mensal: string | null
          live_public_key: string | null
          live_secret_key: string | null
          live_webhook_secret: string | null
          test_account_id: string | null
          test_encryption_key: string | null
          test_plan_id_anual: string | null
          test_plan_id_mensal: string | null
          test_public_key: string | null
          test_secret_key: string | null
          test_webhook_secret: string | null
          updated_at: string | null
        }
        Insert: {
          active_environment?: string
          created_at?: string | null
          id?: string
          live_account_id?: string | null
          live_encryption_key?: string | null
          live_plan_id_anual?: string | null
          live_plan_id_mensal?: string | null
          live_public_key?: string | null
          live_secret_key?: string | null
          live_webhook_secret?: string | null
          test_account_id?: string | null
          test_encryption_key?: string | null
          test_plan_id_anual?: string | null
          test_plan_id_mensal?: string | null
          test_public_key?: string | null
          test_secret_key?: string | null
          test_webhook_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          active_environment?: string
          created_at?: string | null
          id?: string
          live_account_id?: string | null
          live_encryption_key?: string | null
          live_plan_id_anual?: string | null
          live_plan_id_mensal?: string | null
          live_public_key?: string | null
          live_secret_key?: string | null
          live_webhook_secret?: string | null
          test_account_id?: string | null
          test_encryption_key?: string | null
          test_plan_id_anual?: string | null
          test_plan_id_mensal?: string | null
          test_public_key?: string | null
          test_secret_key?: string | null
          test_webhook_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pagarme_subscriptions: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          current_period_end: string | null
          email: string
          environment: string
          id: string
          installments: number
          last_charge_id: string | null
          last_order_id: string | null
          pagarme_plan_id: string
          pagarme_subscription_id: string
          plan_code: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          current_period_end?: string | null
          email: string
          environment: string
          id?: string
          installments: number
          last_charge_id?: string | null
          last_order_id?: string | null
          pagarme_plan_id: string
          pagarme_subscription_id: string
          plan_code: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          current_period_end?: string | null
          email?: string
          environment?: string
          id?: string
          installments?: number
          last_charge_id?: string | null
          last_order_id?: string | null
          pagarme_plan_id?: string
          pagarme_subscription_id?: string
          plan_code?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_audit_log: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          provider: string
          ref_id: string | null
          source: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          provider: string
          ref_id?: string | null
          source: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          provider?: string
          ref_id?: string | null
          source?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cpmt_id: string | null
          created_at: string | null
          currency: string
          external_id: string | null
          external_raw: Json | null
          fee: number | null
          id: string
          installments: number | null
          metadata: Json | null
          motive: string | null
          net_amount: number | null
          provider: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          cpmt_id?: string | null
          created_at?: string | null
          currency?: string
          external_id?: string | null
          external_raw?: Json | null
          fee?: number | null
          id?: string
          installments?: number | null
          metadata?: Json | null
          motive?: string | null
          net_amount?: number | null
          provider: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          cpmt_id?: string | null
          created_at?: string | null
          currency?: string
          external_id?: string | null
          external_raw?: Json | null
          fee?: number | null
          id?: string
          installments?: number | null
          metadata?: Json | null
          motive?: string | null
          net_amount?: number | null
          provider?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          last_login_ip: string | null
          locked_until: string | null
          must_change_password: boolean | null
          name: string | null
          password_reset_expires: string | null
          password_reset_token: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          failed_login_attempts?: number | null
          id: string
          last_login_at?: string | null
          last_login_ip?: string | null
          locked_until?: string | null
          must_change_password?: boolean | null
          name?: string | null
          password_reset_expires?: string | null
          password_reset_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          locked_until?: string | null
          must_change_password?: boolean | null
          name?: string | null
          password_reset_expires?: string | null
          password_reset_token?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_leads: {
        Row: {
          ai_insights: Json | null
          company_name: string | null
          created_at: string | null
          device: string | null
          email: string | null
          id: string
          lead_name: string | null
          quiz_id: string | null
          referrer: string | null
          responses: Json
          score: number | null
          score_classification: string | null
          score_details: Json | null
          status: string | null
          updated_at: string | null
          utm_data: Json | null
          whatsapp: string | null
        }
        Insert: {
          ai_insights?: Json | null
          company_name?: string | null
          created_at?: string | null
          device?: string | null
          email?: string | null
          id?: string
          lead_name?: string | null
          quiz_id?: string | null
          referrer?: string | null
          responses?: Json
          score?: number | null
          score_classification?: string | null
          score_details?: Json | null
          status?: string | null
          updated_at?: string | null
          utm_data?: Json | null
          whatsapp?: string | null
        }
        Update: {
          ai_insights?: Json | null
          company_name?: string | null
          created_at?: string | null
          device?: string | null
          email?: string | null
          id?: string
          lead_name?: string | null
          quiz_id?: string | null
          referrer?: string | null
          responses?: Json
          score?: number | null
          score_classification?: string | null
          score_details?: Json | null
          status?: string | null
          updated_at?: string | null
          utm_data?: Json | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_leads_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_steps: {
        Row: {
          category: string | null
          conditional: Json | null
          created_at: string | null
          field_name: string
          id: string
          options: Json | null
          order_index: number
          quiz_id: string
          required: boolean | null
          subtitle: string | null
          title: string
          type: string
          updated_at: string | null
          validation: Json | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          conditional?: Json | null
          created_at?: string | null
          field_name: string
          id?: string
          options?: Json | null
          order_index: number
          quiz_id: string
          required?: boolean | null
          subtitle?: string | null
          title: string
          type: string
          updated_at?: string | null
          validation?: Json | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          conditional?: Json | null
          created_at?: string | null
          field_name?: string
          id?: string
          options?: Json | null
          order_index?: number
          quiz_id?: string
          required?: boolean | null
          subtitle?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          validation?: Json | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_steps_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          slug: string
          thank_you_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          thank_you_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          thank_you_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          ip_address: unknown
          operation_type: string
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          operation_type: string
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          operation_type?: string
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      sector_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sector_profiles: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          content_types: string[] | null
          created_at: string
          decision_factors: string[] | null
          demographic_details: Json | null
          gender_preference: string | null
          geographic_radius: number | null
          id: string
          income_range_max: number | null
          income_range_min: number | null
          keywords: string[] | null
          location_details: string | null
          location_type: string | null
          main_interests: string[] | null
          marketing_strategies: string[] | null
          mental_triggers: string[] | null
          meta_behaviors: string[] | null
          meta_interests: string[] | null
          payment_preferences: string[] | null
          preferred_channels: string[] | null
          price_sensitivity: string | null
          professions: string[] | null
          psychological_strategies: string[] | null
          purchase_behaviors: string[] | null
          related_topics: string[] | null
          research_habits: string[] | null
          sector_id: string
          social_class: string[] | null
          updated_at: string
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          content_types?: string[] | null
          created_at?: string
          decision_factors?: string[] | null
          demographic_details?: Json | null
          gender_preference?: string | null
          geographic_radius?: number | null
          id?: string
          income_range_max?: number | null
          income_range_min?: number | null
          keywords?: string[] | null
          location_details?: string | null
          location_type?: string | null
          main_interests?: string[] | null
          marketing_strategies?: string[] | null
          mental_triggers?: string[] | null
          meta_behaviors?: string[] | null
          meta_interests?: string[] | null
          payment_preferences?: string[] | null
          preferred_channels?: string[] | null
          price_sensitivity?: string | null
          professions?: string[] | null
          psychological_strategies?: string[] | null
          purchase_behaviors?: string[] | null
          related_topics?: string[] | null
          research_habits?: string[] | null
          sector_id: string
          social_class?: string[] | null
          updated_at?: string
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          content_types?: string[] | null
          created_at?: string
          decision_factors?: string[] | null
          demographic_details?: Json | null
          gender_preference?: string | null
          geographic_radius?: number | null
          id?: string
          income_range_max?: number | null
          income_range_min?: number | null
          keywords?: string[] | null
          location_details?: string | null
          location_type?: string | null
          main_interests?: string[] | null
          marketing_strategies?: string[] | null
          mental_triggers?: string[] | null
          meta_behaviors?: string[] | null
          meta_interests?: string[] | null
          payment_preferences?: string[] | null
          preferred_channels?: string[] | null
          price_sensitivity?: string | null
          professions?: string[] | null
          psychological_strategies?: string[] | null
          purchase_behaviors?: string[] | null
          related_topics?: string[] | null
          research_habits?: string[] | null
          sector_id?: string
          social_class?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      sector_specializations: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_specializations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sector_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      strategy_reports: {
        Row: {
          created_at: string
          id: string
          payload: Json
          result: Json
          snapshot_html: string | null
          source: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          result: Json
          snapshot_html?: string | null
          source?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          result?: Json
          snapshot_html?: string | null
          source?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_config: {
        Row: {
          created_at: string
          environment: string | null
          id: string
          publishable_key: string | null
          secret_key: string | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          environment?: string | null
          id?: string
          publishable_key?: string | null
          secret_key?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          environment?: string | null
          id?: string
          publishable_key?: string | null
          secret_key?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      stripe_config_audit: {
        Row: {
          action: string
          config_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          config_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          config_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_config_audit_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "stripe_config"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_event_log: {
        Row: {
          id: string
          received_at: string | null
        }
        Insert: {
          id: string
          received_at?: string | null
        }
        Update: {
          id?: string
          received_at?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          canceled_at: string | null
          created_at: string
          created_by_admin: boolean | null
          current_period_end: string | null
          email: string
          id: string
          is_active: boolean | null
          pagarme_customer_id: string | null
          pagarme_subscription_id: string | null
          plan_expires_at: string | null
          plan_type: string | null
          provider: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          canceled_at?: string | null
          created_at?: string
          created_by_admin?: boolean | null
          current_period_end?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          pagarme_customer_id?: string | null
          pagarme_subscription_id?: string | null
          plan_expires_at?: string | null
          plan_type?: string | null
          provider?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          canceled_at?: string | null
          created_at?: string
          created_by_admin?: boolean | null
          current_period_end?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          pagarme_customer_id?: string | null
          pagarme_subscription_id?: string | null
          plan_expires_at?: string | null
          plan_type?: string | null
          provider?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          allowed_installments: number[] | null
          created_at: string | null
          deprecated: boolean | null
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          limits: Json
          name: string
          pagarme_plan_id: string | null
          pagarme_plan_id_annual: string | null
          pagarme_plan_id_monthly: string | null
          plan_type: string
          price_annual: number | null
          price_monthly: number | null
          provider: string | null
          stripe_price_id_annual: string | null
          stripe_price_id_monthly: string | null
          trial_period_days: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_installments?: number[] | null
          created_at?: string | null
          deprecated?: boolean | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          limits?: Json
          name: string
          pagarme_plan_id?: string | null
          pagarme_plan_id_annual?: string | null
          pagarme_plan_id_monthly?: string | null
          plan_type: string
          price_annual?: number | null
          price_monthly?: number | null
          provider?: string | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_installments?: number[] | null
          created_at?: string | null
          deprecated?: boolean | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          limits?: Json
          name?: string
          pagarme_plan_id?: string | null
          pagarme_plan_id_annual?: string | null
          pagarme_plan_id_monthly?: string | null
          plan_type?: string
          price_annual?: number | null
          price_monthly?: number | null
          provider?: string | null
          stripe_price_id_annual?: string | null
          stripe_price_id_monthly?: string | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_pricing: {
        Row: {
          annual_price: number
          created_at: string
          id: string
          monthly_price: number
          updated_at: string
        }
        Insert: {
          annual_price?: number
          created_at?: string
          id?: string
          monthly_price?: number
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          id?: string
          monthly_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          resource_type: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          resource_type: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          resource_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          created_at: string | null
          id: string
          plan_code: string
          source: string
          status: string
          updated_at: string | null
          user_id: string
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_code: string
          source?: string
          status: string
          updated_at?: string | null
          user_id: string
          valid_until: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_code?: string
          source?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          valid_until?: string
        }
        Relationships: []
      }
      user_learning_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          content_id: string | null
          created_at: string
          id: string
          is_favorited: boolean | null
          progress_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          is_favorited?: boolean | null
          progress_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          is_favorited?: boolean | null
          progress_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "learning_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          daily_budget_brl: number
          estimated_clicks: number | null
          estimated_reach: number | null
          headline: string
          id: string
          location_display_name: string
          location_key: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_radius_km: number | null
          location_type: string
          media_file_name: string | null
          media_file_size: number | null
          media_file_type: string | null
          media_file_url: string | null
          message: string
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          status: string
          updated_at: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          campaign_name: string
          created_at?: string
          daily_budget_brl: number
          estimated_clicks?: number | null
          estimated_reach?: number | null
          headline: string
          id?: string
          location_display_name: string
          location_key?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_radius_km?: number | null
          location_type: string
          media_file_name?: string | null
          media_file_size?: number | null
          media_file_type?: string | null
          media_file_url?: string | null
          message: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          whatsapp_number: string
        }
        Update: {
          campaign_name?: string
          created_at?: string
          daily_budget_brl?: number
          estimated_clicks?: number | null
          estimated_reach?: number | null
          headline?: string
          id?: string
          location_display_name?: string
          location_key?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_radius_km?: number | null
          location_type?: string
          media_file_name?: string | null
          media_file_size?: number | null
          media_file_type?: string | null
          media_file_url?: string | null
          message?: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      whatsapp_numbers: {
        Row: {
          created_at: string | null
          id: string
          number: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          number: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          number?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_lead_comment_admin_safe: {
        Args: { p_comment: string; p_lead_id: string }
        Returns: boolean
      }
      anonymize_old_leads: { Args: never; Returns: undefined }
      check_rate_limit: {
        Args: {
          max_attempts?: number
          operation_type_param: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_user_limit: {
        Args: { resource_type_param: string; user_uuid?: string }
        Returns: boolean
      }
      create_campaign_template: {
        Args: {
          p_best_practices: string[]
          p_creative_guidelines: string[]
          p_description: string
          p_is_active: boolean
          p_key_messages: string[]
          p_objective: string
          p_sector_id: string
          p_success_metrics: string[]
          p_suggested_budget_max: number
          p_suggested_budget_min: number
          p_target_audience: string
          p_title: string
        }
        Returns: string
      }
      create_sector_category: {
        Args: { category_description?: string; category_name: string }
        Returns: string
      }
      create_sector_specialization: {
        Args: { p_category_id: string; p_description?: string; p_name: string }
        Returns: string
      }
      delete_campaign_template: { Args: { p_id: string }; Returns: undefined }
      delete_sector_category: {
        Args: { category_id: string }
        Returns: undefined
      }
      delete_sector_specialization: {
        Args: { p_id: string }
        Returns: undefined
      }
      get_active_pagarme_config: {
        Args: never
        Returns: {
          account_id: string
          encryption_key: string
          environment: string
          plan_anual_id: string
          plan_mensal_id: string
          public_key: string
          secret_key: string
          webhook_secret: string
        }[]
      }
      get_ad_set_settings_admin_safe: {
        Args: never
        Returns: {
          ad_account_id: string
          ad_set_id: string
          campaign_id: string
          created_at: string
          expected_budget_amount: number
          expected_budget_type: string
          expected_name: string
          id: string
          is_pending_verification: boolean
          updated_at: string
          user_id: string
          verification_status: string
        }[]
      }
      get_ai_configurations_admin_safe: {
        Args: never
        Returns: {
          created_at: string
          has_api_key: boolean
          id: string
          is_active: boolean
          is_default: boolean
          max_tokens: number
          model_name: string
          provider: string
          temperature: number
          updated_at: string
        }[]
      }
      get_ai_status: {
        Args: never
        Returns: {
          is_available: boolean
          model_name: string
          provider: string
        }[]
      }
      get_asaas_config_for_functions: {
        Args: { p_environment?: string }
        Returns: {
          api_key: string
          environment: string
          webhook_secret: string
        }[]
      }
      get_campaign_templates: {
        Args: never
        Returns: {
          best_practices: string[]
          created_at: string
          creative_guidelines: string[]
          description: string
          id: string
          is_active: boolean
          key_messages: string[]
          objective: string
          sector_id: string
          success_metrics: string[]
          suggested_budget_max: number
          suggested_budget_min: number
          target_audience: string
          title: string
          updated_at: string
        }[]
      }
      get_global_setting: {
        Args: { p_setting_key: string }
        Returns: {
          setting_value: Json
          updated_at: string
        }[]
      }
      get_integrations_admin_safe: {
        Args: never
        Returns: {
          access_token_status: string
          ad_account_id: string
          app_secret_status: string
          created_at: string
          id: string
          page_id: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_leads_admin_safe: {
        Args: never
        Returns: {
          answers: Json
          best_contact_time: string
          city: string
          clinic_name: string
          comments: Json
          created_at: string
          desired_monthly_spend_range: string
          device: string
          email: string
          expectations: string
          id: string
          instagram: string
          main_goal: string
          name: string
          notes: string
          owner_id: string
          page_path: string
          platforms: string[]
          preferred_channel: string
          referrer: string
          specialties: string[]
          specialty: string
          start_timing: string
          state: string
          status: string
          tags: string[]
          updated_at: string
          used_paid_traffic: string
          utm_campaign: string
          utm_content: string
          utm_medium: string
          utm_source: string
          utm_term: string
          website: string
          whatsapp_e164: string
        }[]
      }
      get_meta_ads_config: {
        Args: never
        Returns: {
          app_id: string
          app_secret: string
          business_manager_id: string
          created_at: string
          id: string
          updated_at: string
        }[]
      }
      get_pagarme_config_for_functions:
        | {
            Args: never
            Returns: {
              account_id: string
              environment: string
              free_installments: number
              installments_max: number
              interest_rate: number
              plan_id_anual: string
              plan_id_mensal: string
              public_key: string
              secret_key: string
              webhook_secret: string
            }[]
          }
        | {
            Args: { p_environment?: string }
            Returns: {
              account_id: string
              environment: string
              free_installments: number
              installments_max: number
              interest_rate: number
              plan_id_anual: string
              plan_id_mensal: string
              public_key: string
              secret_key: string
              webhook_secret: string
            }[]
          }
      get_pagarme_config_public: {
        Args: never
        Returns: {
          account_id: string
          created_at: string
          environment: string
          free_installments: number
          has_secret_key: boolean
          has_webhook_secret: boolean
          id: string
          installments_max: number
          interest_rate: number
          public_key: string
          statement_descriptor: string
          stripe_custom_payment_method_id: string
          updated_at: string
        }[]
      }
      get_pagarme_config_safe: {
        Args: never
        Returns: {
          account_id: string
          created_at: string
          environment: string
          free_installments: number
          has_secret_key: boolean
          has_webhook_secret: boolean
          id: string
          installments_max: number
          interest_rate: number
          public_key: string
          statement_descriptor: string
          stripe_custom_payment_method_id: string
          updated_at: string
        }[]
      }
      get_payment_setting: {
        Args: { p_setting_key: string }
        Returns: {
          setting_value: Json
          updated_at: string
        }[]
      }
      get_profiles_admin_safe: {
        Args: never
        Returns: {
          created_at: string
          id: string
          last_login_at: string
          name: string
          status: string
          updated_at: string
        }[]
      }
      get_profiles_admin_with_email: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_login_at: string
          name: string
          status: string
          updated_at: string
        }[]
      }
      get_sector_categories_with_specializations: {
        Args: never
        Returns: {
          description: string
          id: string
          name: string
          specializations: Json
        }[]
      }
      get_sector_specializations: {
        Args: never
        Returns: {
          category_id: string
          description: string
          id: string
          name: string
        }[]
      }
      get_stripe_config_for_functions: {
        Args: never
        Returns: {
          environment: string
          publishable_key: string
          secret_key: string
          webhook_secret: string
        }[]
      }
      get_stripe_config_safe: {
        Args: never
        Returns: {
          created_at: string
          environment: string
          has_webhook_secret: boolean
          id: string
          publishable_key: string
          updated_at: string
        }[]
      }
      get_user_subscription_with_plan: {
        Args: { user_uuid?: string }
        Returns: {
          created_by_admin: boolean
          email: string
          is_active: boolean
          plan_expires_at: string
          plan_features: string[]
          plan_limits: Json
          plan_name: string
          plan_type: string
          stripe_customer_id: string
          stripe_subscription_id: string
          subscriber_id: string
          subscription_status: string
        }[]
      }
      inc_view_count: { Args: { p_content: string }; Returns: undefined }
      increment_usage: {
        Args: {
          increment_by?: number
          resource_type_param: string
          user_uuid?: string
        }
        Returns: boolean
      }
      is_admin_or_super_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      log_security_audit: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      set_must_change_password: { Args: { flag: boolean }; Returns: undefined }
      sync_pagarme_plan: {
        Args: { p_pagarme_plan_id: string; p_plan_type: string }
        Returns: boolean
      }
      update_campaign_template: {
        Args: {
          p_best_practices?: string[]
          p_creative_guidelines?: string[]
          p_description?: string
          p_id: string
          p_is_active?: boolean
          p_key_messages?: string[]
          p_objective?: string
          p_success_metrics?: string[]
          p_suggested_budget_max?: number
          p_suggested_budget_min?: number
          p_target_audience?: string
          p_title?: string
        }
        Returns: undefined
      }
      update_lead_admin_safe: {
        Args: {
          p_lead_id: string
          p_notes?: string
          p_owner_id?: string
          p_status?: string
          p_tags?: string[]
        }
        Returns: boolean
      }
      update_sector_category: {
        Args: {
          category_description?: string
          category_id: string
          category_name: string
        }
        Returns: undefined
      }
      update_sector_specialization: {
        Args: { p_description?: string; p_id: string; p_name: string }
        Returns: undefined
      }
      upsert_global_setting: {
        Args: {
          p_description?: string
          p_setting_key: string
          p_setting_value: Json
        }
        Returns: string
      }
      upsert_meta_ads_config: {
        Args: {
          p_app_id: string
          p_app_secret: string
          p_business_manager_id?: string
        }
        Returns: string
      }
      upsert_payment_setting: {
        Args: {
          p_description?: string
          p_setting_key: string
          p_setting_value: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      placements_mode: "automatic" | "manual"
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
      app_role: ["user", "admin", "super_admin"],
      placements_mode: ["automatic", "manual"],
    },
  },
} as const
