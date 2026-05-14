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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          role: 'admin' | 'manager' | 'worker'
          avatar_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'admin' | 'manager' | 'worker'
          avatar_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'admin' | 'manager' | 'worker'
          avatar_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          city: string | null
          state: string
          zip_code: string | null
          service_requested: string | null
          lead_source: string | null
          status: string
          priority: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to: string | null
          estimated_value: number | null
          notes: string | null
          last_contacted_at: string | null
          next_follow_up_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string
          zip_code?: string | null
          service_requested?: string | null
          lead_source?: string | null
          status?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to?: string | null
          estimated_value?: number | null
          notes?: string | null
          last_contacted_at?: string | null
          next_follow_up_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string
          zip_code?: string | null
          service_requested?: string | null
          lead_source?: string | null
          status?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          assigned_to?: string | null
          estimated_value?: number | null
          notes?: string | null
          last_contacted_at?: string | null
          next_follow_up_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          city: string | null
          state: string
          zip_code: string | null
          customer_type: 'residential' | 'commercial'
          notes: string | null
          total_spent: number
          last_service_date: string | null
          created_from_lead_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string
          zip_code?: string | null
          customer_type?: 'residential' | 'commercial'
          notes?: string | null
          total_spent?: number
          last_service_date?: string | null
          created_from_lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string
          zip_code?: string | null
          customer_type?: 'residential' | 'commercial'
          notes?: string | null
          total_spent?: number
          last_service_date?: string | null
          created_from_lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          lead_id: string | null
          customer_id: string | null
          quote_number: string
          service_type: string
          description: string | null
          quote_amount: number
          discount_amount: number
          final_amount: number
          status: string
          valid_until: string | null
          date_sent: string | null
          accepted_at: string | null
          declined_at: string | null
          follow_up_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          customer_id?: string | null
          quote_number?: string
          service_type: string
          description?: string | null
          quote_amount: number
          discount_amount?: number
          final_amount: number
          status?: string
          valid_until?: string | null
          date_sent?: string | null
          accepted_at?: string | null
          declined_at?: string | null
          follow_up_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          customer_id?: string | null
          quote_number?: string
          service_type?: string
          description?: string | null
          quote_amount?: number
          discount_amount?: number
          final_amount?: number
          status?: string
          valid_until?: string | null
          date_sent?: string | null
          accepted_at?: string | null
          declined_at?: string | null
          follow_up_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          service_name: string | null
          description: string | null
          quantity: number
          unit_price: number | null
          total_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          service_name?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number | null
          total_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          service_name?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number | null
          total_price?: number | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          customer_id: string | null
          lead_id: string | null
          quote_id: string | null
          job_number: string
          service_type: string
          address: string
          city: string | null
          state: string
          zip_code: string | null
          scheduled_date: string | null
          start_time: string | null
          end_time: string | null
          assigned_to: string | null
          crew_notes: string | null
          customer_notes: string | null
          internal_notes: string | null
          price: number | null
          status: string
          payment_status: string
          review_status: string
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          lead_id?: string | null
          quote_id?: string | null
          job_number?: string
          service_type: string
          address: string
          city?: string | null
          state?: string
          zip_code?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          end_time?: string | null
          assigned_to?: string | null
          crew_notes?: string | null
          customer_notes?: string | null
          internal_notes?: string | null
          price?: number | null
          status?: string
          payment_status?: string
          review_status?: string
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          lead_id?: string | null
          quote_id?: string | null
          job_number?: string
          service_type?: string
          address?: string
          city?: string | null
          state?: string
          zip_code?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          end_time?: string | null
          assigned_to?: string | null
          crew_notes?: string | null
          customer_notes?: string | null
          internal_notes?: string | null
          price?: number | null
          status?: string
          payment_status?: string
          review_status?: string
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_photos: {
        Row: {
          id: string
          job_id: string
          uploaded_by: string | null
          photo_url: string
          photo_type: 'before' | 'after' | 'damage' | 'other'
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          uploaded_by?: string | null
          photo_url: string
          photo_type?: 'before' | 'after' | 'damage' | 'other'
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          uploaded_by?: string | null
          photo_url?: string
          photo_type?: 'before' | 'after' | 'damage' | 'other'
          caption?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          job_id: string | null
          customer_id: string | null
          amount: number
          payment_method: string | null
          payment_status: string | null
          paid_at: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          customer_id?: string | null
          amount: number
          payment_method?: string | null
          payment_status?: string | null
          paid_at?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          customer_id?: string | null
          amount?: number
          payment_method?: string | null
          payment_status?: string | null
          paid_at?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          task_type: string | null
          lead_id: string | null
          customer_id: string | null
          quote_id: string | null
          job_id: string | null
          assigned_to: string | null
          due_date: string | null
          due_time: string | null
          status: 'open' | 'completed' | 'cancelled'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          task_type?: string | null
          lead_id?: string | null
          customer_id?: string | null
          quote_id?: string | null
          job_id?: string | null
          assigned_to?: string | null
          due_date?: string | null
          due_time?: string | null
          status?: 'open' | 'completed' | 'cancelled'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          task_type?: string | null
          lead_id?: string | null
          customer_id?: string | null
          quote_id?: string | null
          job_id?: string | null
          assigned_to?: string | null
          due_date?: string | null
          due_time?: string | null
          status?: 'open' | 'completed' | 'cancelled'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          note: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          note: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          note?: string
          created_by?: string | null
          created_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          entity_type: string
          entity_id: string
          action: string
          old_value: Json | null
          new_value: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          entity_type: string
          entity_id: string
          action: string
          old_value?: Json | null
          new_value?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          entity_type?: string
          entity_id?: string
          action?: string
          old_value?: Json | null
          new_value?: Json | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          job_id: string | null
          customer_id: string | null
          requested_at: string | null
          completed_at: string | null
          review_platform: string
          review_link: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          customer_id?: string | null
          requested_at?: string | null
          completed_at?: string | null
          review_platform?: string
          review_link?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          customer_id?: string | null
          requested_at?: string | null
          completed_at?: string | null
          review_platform?: string
          review_link?: string | null
          status?: string | null
          created_at?: string
        }
      }
      company_settings: {
        Row: {
          id: string
          company_name: string | null
          phone: string | null
          email: string | null
          website: string | null
          google_review_link: string | null
          default_service_area: string | null
          default_quote_expiration_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          google_review_link?: string | null
          default_service_area?: string | null
          default_quote_expiration_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          google_review_link?: string | null
          default_service_area?: string | null
          default_quote_expiration_days?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
