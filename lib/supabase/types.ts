// Auto-generated types placeholder — run `supabase gen types typescript` after applying migrations
// to replace this file with full type definitions.

export type GuidanceMode = 'beginner' | 'intermediate' | 'advanced'
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'
export type ConvictionOutlook = 'bull' | 'neutral' | 'bear'
export type ConvictionConfidence = 'low' | 'medium' | 'high'
export type AlertType = 'conviction_change' | 'price_threshold' | 'whale_movement' | 'risk_level' | 'portfolio_health' | 'scam_detection'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type HoldSellSignal = 'strong_hold' | 'hold' | 'neutral' | 'sell' | 'strong_sell'
export type WhaleTier = 'retail' | 'mid' | 'whale' | 'mega_whale'
export type TransactionType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          guidance_mode: GuidanceMode
          risk_profile: RiskProfile
          onboarding_completed: boolean
          briefing_enabled: boolean
          briefing_time: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['portfolios']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['portfolios']['Insert']>
      }
      holdings: {
        Row: {
          id: string
          portfolio_id: string
          coin_id: string
          symbol: string
          name: string
          quantity: number
          average_buy_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['holdings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['holdings']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          portfolio_id: string
          coin_id: string
          type: TransactionType
          quantity: number
          price_usd: number
          fee_usd: number
          transacted_at: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          coin_id: string
          symbol: string
          name: string
          added_at: string
        }
        Insert: Omit<Database['public']['Tables']['watchlists']['Row'], 'id' | 'added_at'>
        Update: Partial<Database['public']['Tables']['watchlists']['Insert']>
      }
      conviction_scores: {
        Row: {
          id: string
          coin_id: string
          symbol: string
          outlook: ConvictionOutlook
          score: number
          confidence: ConvictionConfidence
          confidence_pct: number | null
          headline: string
          summary: string
          bull_case: string | null
          bear_case: string | null
          signals: Record<string, unknown>
          computed_at: string
          valid_until: string
          data_sources: string[]
        }
        Insert: Omit<Database['public']['Tables']['conviction_scores']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['conviction_scores']['Insert']>
      }
      alert_configs: {
        Row: {
          id: string
          user_id: string
          coin_id: string | null
          alert_type: AlertType
          config: Record<string, unknown>
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['alert_configs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['alert_configs']['Insert']>
      }
      alert_events: {
        Row: {
          id: string
          user_id: string
          alert_config_id: string | null
          coin_id: string | null
          alert_type: string
          severity: AlertSeverity
          title: string
          body: string
          payload: Record<string, unknown>
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['alert_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['alert_events']['Insert']>
      }
      daily_briefings: {
        Row: {
          id: string
          user_id: string
          briefing_date: string
          content: Record<string, unknown>
          generated_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_briefings']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['daily_briefings']['Insert']>
      }
      token_scans: {
        Row: {
          id: string
          user_id: string
          input: string
          chain: string | null
          coin_id: string | null
          legitimacy_score: number | null
          risk_level: RiskLevel | null
          red_flags: string[]
          green_flags: string[]
          timing_assessment: string | null
          summary: string | null
          raw_data: Record<string, unknown>
          scanned_at: string
        }
        Insert: Omit<Database['public']['Tables']['token_scans']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['token_scans']['Insert']>
      }
      wallet_analyses: {
        Row: {
          id: string
          user_id: string
          wallet_address: string
          chain: string
          portfolio_value_usd: number | null
          first_tx_at: string | null
          wallet_age_days: number | null
          top_holdings: unknown[]
          estimated_roi_pct: number | null
          hold_sell_signal: HoldSellSignal | null
          whale_tier: WhaleTier | null
          summary: string | null
          raw_data: Record<string, unknown>
          analyzed_at: string
        }
        Insert: Omit<Database['public']['Tables']['wallet_analyses']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['wallet_analyses']['Insert']>
      }
      copilot_conversations: {
        Row: {
          id: string
          user_id: string
          messages: unknown[]
          context_type: string | null
          context_id: string | null
          started_at: string
          last_message_at: string
        }
        Insert: Omit<Database['public']['Tables']['copilot_conversations']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['copilot_conversations']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
