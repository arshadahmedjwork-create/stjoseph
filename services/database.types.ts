/**
 * TypeScript types for Supabase Database
 * Auto-generated from database schema
 * 
 * To regenerate:
 * supabase gen types typescript --local > services/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alumni_submissions: {
        Row: {
          id: string
          created_at: string
          full_name: string
          institution: string
          batch_year: number
          roll_number: string
          date_of_birth: string
          email: string
          phone: string | null
          message_text: string | null
          audio_path: string | null
          video_path: string | null
          consent_given: boolean
          tags: string[]
          top_tag: string
          tag_scores: Json
          review_status: string
          admin_notes: string | null
          rejected: boolean
          rejection_reason: string | null
        }
        Insert: {
          id: string
          created_at?: string
          full_name: string
          institution: string
          batch_year: number
          roll_number: string
          date_of_birth: string
          email: string
          phone?: string | null
          message_text?: string | null
          audio_path?: string | null
          video_path?: string | null
          consent_given: boolean
          tags: string[]
          top_tag: string
          tag_scores: Json
          review_status?: string
          admin_notes?: string | null
          rejected?: boolean
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          institution?: string
          batch_year?: number
          roll_number?: string
          date_of_birth?: string
          email?: string
          phone?: string | null
          message_text?: string | null
          audio_path?: string | null
          video_path?: string | null
          consent_given?: boolean
          tags?: string[]
          top_tag?: string
          tag_scores?: Json
          review_status?: string
          admin_notes?: string | null
          rejected?: boolean
          rejection_reason?: string | null
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
