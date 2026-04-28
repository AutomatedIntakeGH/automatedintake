export type Trade = 'auto' | 'hvac' | 'plumbing' | 'electrical' | 'roofing' | 'landscaping' | 'contractor'
export type Plan = 'free' | 'solo' | 'pro' | 'shop' | 'enterprise'
export type WOStatus = 'draft' | 'final' | 'sent' | 'archived'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          shop_name: string | null
          trade: Trade | null
          plan: Plan
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          monthly_wo_count: number
          monthly_wo_reset_at: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          shop_name?: string | null
          trade?: Trade | null
          plan?: Plan
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_wo_count?: number
          monthly_wo_reset_at?: string
          created_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          shop_name?: string | null
          trade?: Trade | null
          plan?: Plan
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_wo_count?: number
          monthly_wo_reset_at?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          id: string
          user_id: string
          trade: string
          status: WOStatus
          customer: Record<string, unknown> | null
          vehicle: Record<string, unknown> | null
          property: Record<string, unknown> | null
          concerns: Record<string, unknown>[] | null
          notes: string | null
          recommended_actions: Record<string, unknown>[] | null
          follow_up_questions: Record<string, unknown>[] | null
          sentiment: string | null
          audio_url: string | null
          transcript: string | null
          raw_extraction: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trade: string
          status?: WOStatus
          customer?: Record<string, unknown> | null
          vehicle?: Record<string, unknown> | null
          property?: Record<string, unknown> | null
          concerns?: Record<string, unknown>[] | null
          notes?: string | null
          recommended_actions?: Record<string, unknown>[] | null
          follow_up_questions?: Record<string, unknown>[] | null
          sentiment?: string | null
          audio_url?: string | null
          transcript?: string | null
          raw_extraction?: Record<string, unknown> | null
        }
        Update: {
          trade?: string
          status?: WOStatus
          customer?: Record<string, unknown> | null
          vehicle?: Record<string, unknown> | null
          property?: Record<string, unknown> | null
          concerns?: Record<string, unknown>[] | null
          notes?: string | null
          recommended_actions?: Record<string, unknown>[] | null
          follow_up_questions?: Record<string, unknown>[] | null
          sentiment?: string | null
          audio_url?: string | null
          transcript?: string | null
          raw_extraction?: Record<string, unknown> | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
