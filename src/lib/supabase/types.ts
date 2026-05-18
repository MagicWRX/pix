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
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          emoji: string
          color: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          emoji?: string
          color?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          emoji?: string
          color?: string
          sort_order?: number
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          release_year: number | null
          genre: string
          studio: string
          duration_secs: number
          trailer_type: string
          category_id: string | null
          source_name: string
          source_url: string
          source_type: string
          thumbnail_url: string
          thumbnail_b2_key: string
          versions: Json
          is_featured: boolean
          view_count: number
          featured_order: number
          status: string
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string
          release_year?: number | null
          genre?: string
          studio?: string
          duration_secs?: number
          trailer_type?: string
          category_id?: string | null
          source_name?: string
          source_url?: string
          source_type?: string
          thumbnail_url?: string
          thumbnail_b2_key?: string
          versions?: Json
          is_featured?: boolean
          view_count?: number
          featured_order?: number
          status?: string
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string
          release_year?: number | null
          genre?: string
          studio?: string
          duration_secs?: number
          trailer_type?: string
          category_id?: string | null
          source_name?: string
          source_url?: string
          source_type?: string
          thumbnail_url?: string
          thumbnail_b2_key?: string
          versions?: Json
          is_featured?: boolean
          view_count?: number
          featured_order?: number
          status?: string
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      video_versions: {
        Row: {
          id: string
          video_id: string
          resolution: string
          file_url: string
          b2_key: string
          size_bytes: number
          format: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          resolution: string
          file_url: string
          b2_key: string
          size_bytes?: number
          format?: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          resolution?: string
          file_url?: string
          b2_key?: string
          size_bytes?: number
          format?: string
          created_at?: string
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
