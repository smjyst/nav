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
      alert_configs: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          coin_id: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          coin_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          coin_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_events: {
        Row: {
          alert_config_id: string | null
          alert_type: string
          body: string
          coin_id: string | null
          created_at: string
          id: string
          is_read: boolean
          payload: Json
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          user_id: string
        }
        Insert: {
          alert_config_id?: string | null
          alert_type: string
          body: string
          coin_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          user_id: string
        }
        Update: {
          alert_config_id?: string | null
          alert_type?: string
          body?: string
          coin_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "alert_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conviction_scores: {
        Row: {
          bear_case: string | null
          bull_case: string | null
          coin_id: string
          computed_at: string
          confidence: Database["public"]["Enums"]["conviction_confidence"]
          confidence_pct: number | null
          data_sources: string[]
          headline: string
          id: string
          outlook: Database["public"]["Enums"]["conviction_outlook"]
          score: number
          signals: Json
          summary: string
          symbol: string
          valid_until: string
        }
        Insert: {
          bear_case?: string | null
          bull_case?: string | null
          coin_id: string
          computed_at?: string
          confidence: Database["public"]["Enums"]["conviction_confidence"]
          confidence_pct?: number | null
          data_sources?: string[]
          headline: string
          id?: string
          outlook: Database["public"]["Enums"]["conviction_outlook"]
          score: number
          signals?: Json
          summary: string
          symbol: string
          valid_until: string
        }
        Update: {
          bear_case?: string | null
          bull_case?: string | null
          coin_id?: string
          computed_at?: string
          confidence?: Database["public"]["Enums"]["conviction_confidence"]
          confidence_pct?: number | null
          data_sources?: string[]
          headline?: string
          id?: string
          outlook?: Database["public"]["Enums"]["conviction_outlook"]
          score?: number
          signals?: Json
          summary?: string
          symbol?: string
          valid_until?: string
        }
        Relationships: []
      }
      copilot_conversations: {
        Row: {
          context_id: string | null
          context_type: string | null
          id: string
          last_message_at: string
          messages: Json
          started_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          id?: string
          last_message_at?: string
          messages?: Json
          started_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          id?: string
          last_message_at?: string
          messages?: Json
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefings: {
        Row: {
          briefing_date: string
          content: Json
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          briefing_date: string
          content: Json
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          briefing_date?: string
          content?: Json
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          average_buy_price: number | null
          coin_id: string
          created_at: string
          id: string
          name: string
          portfolio_id: string
          quantity: number
          symbol: string
          updated_at: string
        }
        Insert: {
          average_buy_price?: number | null
          coin_id: string
          created_at?: string
          id?: string
          name: string
          portfolio_id: string
          quantity: number
          symbol: string
          updated_at?: string
        }
        Update: {
          average_buy_price?: number | null
          coin_id?: string
          created_at?: string
          id?: string
          name?: string
          portfolio_id?: string
          quantity?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          briefing_enabled: boolean
          briefing_time: string
          created_at: string
          display_name: string | null
          email: string
          guidance_mode: Database["public"]["Enums"]["guidance_mode"]
          id: string
          onboarding_completed: boolean
          risk_profile: Database["public"]["Enums"]["risk_profile"]
          timezone: string
          updated_at: string
        }
        Insert: {
          briefing_enabled?: boolean
          briefing_time?: string
          created_at?: string
          display_name?: string | null
          email: string
          guidance_mode?: Database["public"]["Enums"]["guidance_mode"]
          id: string
          onboarding_completed?: boolean
          risk_profile?: Database["public"]["Enums"]["risk_profile"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          briefing_enabled?: boolean
          briefing_time?: string
          created_at?: string
          display_name?: string | null
          email?: string
          guidance_mode?: Database["public"]["Enums"]["guidance_mode"]
          id?: string
          onboarding_completed?: boolean
          risk_profile?: Database["public"]["Enums"]["risk_profile"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_scans: {
        Row: {
          chain: string | null
          coin_id: string | null
          green_flags: string[]
          id: string
          input: string
          legitimacy_score: number | null
          raw_data: Json
          red_flags: string[]
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          scanned_at: string
          summary: string | null
          timing_assessment: string | null
          user_id: string
        }
        Insert: {
          chain?: string | null
          coin_id?: string | null
          green_flags?: string[]
          id?: string
          input: string
          legitimacy_score?: number | null
          raw_data?: Json
          red_flags?: string[]
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scanned_at?: string
          summary?: string | null
          timing_assessment?: string | null
          user_id: string
        }
        Update: {
          chain?: string | null
          coin_id?: string | null
          green_flags?: string[]
          id?: string
          input?: string
          legitimacy_score?: number | null
          raw_data?: Json
          red_flags?: string[]
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scanned_at?: string
          summary?: string | null
          timing_assessment?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          coin_id: string
          created_at: string
          fee_usd: number
          id: string
          notes: string | null
          portfolio_id: string
          price_usd: number
          quantity: number
          transacted_at: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          coin_id: string
          created_at?: string
          fee_usd?: number
          id?: string
          notes?: string | null
          portfolio_id: string
          price_usd: number
          quantity: number
          transacted_at: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          coin_id?: string
          created_at?: string
          fee_usd?: number
          id?: string
          notes?: string | null
          portfolio_id?: string
          price_usd?: number
          quantity?: number
          transacted_at?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_analyses: {
        Row: {
          analyzed_at: string
          chain: string
          estimated_roi_pct: number | null
          first_tx_at: string | null
          hold_sell_signal:
            | Database["public"]["Enums"]["hold_sell_signal"]
            | null
          id: string
          portfolio_value_usd: number | null
          raw_data: Json
          summary: string | null
          top_holdings: Json
          user_id: string
          wallet_address: string
          wallet_age_days: number | null
          whale_tier: Database["public"]["Enums"]["whale_tier"] | null
        }
        Insert: {
          analyzed_at?: string
          chain?: string
          estimated_roi_pct?: number | null
          first_tx_at?: string | null
          hold_sell_signal?:
            | Database["public"]["Enums"]["hold_sell_signal"]
            | null
          id?: string
          portfolio_value_usd?: number | null
          raw_data?: Json
          summary?: string | null
          top_holdings?: Json
          user_id: string
          wallet_address: string
          wallet_age_days?: number | null
          whale_tier?: Database["public"]["Enums"]["whale_tier"] | null
        }
        Update: {
          analyzed_at?: string
          chain?: string
          estimated_roi_pct?: number | null
          first_tx_at?: string | null
          hold_sell_signal?:
            | Database["public"]["Enums"]["hold_sell_signal"]
            | null
          id?: string
          portfolio_value_usd?: number | null
          raw_data?: Json
          summary?: string | null
          top_holdings?: Json
          user_id?: string
          wallet_address?: string
          wallet_age_days?: number | null
          whale_tier?: Database["public"]["Enums"]["whale_tier"] | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          added_at: string
          coin_id: string
          id: string
          name: string
          symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string
          coin_id: string
          id?: string
          name: string
          symbol: string
          user_id: string
        }
        Update: {
          added_at?: string
          coin_id?: string
          id?: string
          name?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      alert_severity: "info" | "warning" | "critical"
      alert_type:
        | "conviction_change"
        | "price_threshold"
        | "whale_movement"
        | "risk_level"
        | "portfolio_health"
        | "scam_detection"
      conviction_confidence: "low" | "medium" | "high"
      conviction_outlook: "bull" | "neutral" | "bear"
      guidance_mode: "beginner" | "intermediate" | "advanced"
      hold_sell_signal:
        | "strong_hold"
        | "hold"
        | "neutral"
        | "sell"
        | "strong_sell"
      risk_level: "low" | "medium" | "high" | "critical"
      risk_profile: "conservative" | "moderate" | "aggressive"
      transaction_type: "buy" | "sell" | "transfer_in" | "transfer_out"
      whale_tier: "retail" | "mid" | "whale" | "mega_whale"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases used throughout the app
export type GuidanceMode = Database["public"]["Enums"]["guidance_mode"]
export type RiskProfile = Database["public"]["Enums"]["risk_profile"]
export type ConvictionOutlook = Database["public"]["Enums"]["conviction_outlook"]
export type ConvictionConfidence = Database["public"]["Enums"]["conviction_confidence"]
export type AlertType = Database["public"]["Enums"]["alert_type"]
export type AlertSeverity = Database["public"]["Enums"]["alert_severity"]
export type HoldSellSignal = Database["public"]["Enums"]["hold_sell_signal"]
export type WhaleTier = Database["public"]["Enums"]["whale_tier"]
export type TransactionType = Database["public"]["Enums"]["transaction_type"]
export type RiskLevel = Database["public"]["Enums"]["risk_level"]

// Table row type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
