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
      providers: {
        Row: {
          id: string
          user_id: string | null
          name: string
          slug: string
          email: string
          phone: string | null
          description: string | null
          logo_url: string | null
          verified: boolean
          languages: string[]
          rating_avg: number
          rating_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          slug: string
          email: string
          phone?: string | null
          description?: string | null
          logo_url?: string | null
          verified?: boolean
          languages?: string[]
          rating_avg?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          slug?: string
          email?: string
          phone?: string | null
          description?: string | null
          logo_url?: string | null
          verified?: boolean
          languages?: string[]
          rating_avg?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          provider_id: string
          type: string
          seats: number
          make: string | null
          model: string | null
          year: number | null
          license_plate: string | null
          features: string[]
          images: string[]
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          type: string
          seats: number
          make?: string | null
          model?: string | null
          year?: number | null
          license_plate?: string | null
          features?: string[]
          images?: string[]
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          type?: string
          seats?: number
          make?: string | null
          model?: string | null
          year?: number | null
          license_plate?: string | null
          features?: string[]
          images?: string[]
          active?: boolean
          created_at?: string
        }
      }
      pois: {
        Row: {
          id: string
          slug: string
          name: string
          lat: number
          lon: number
          categories: string[]
          short_desc: string | null
          long_desc: string | null
          images: string[]
          opening_hours: Json | null
          entry_fee: number | null
          featured: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          lat: number
          lon: number
          categories?: string[]
          short_desc?: string | null
          long_desc?: string | null
          images?: string[]
          opening_hours?: Json | null
          entry_fee?: number | null
          featured?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          lat?: number
          lon?: number
          categories?: string[]
          short_desc?: string | null
          long_desc?: string | null
          images?: string[]
          opening_hours?: Json | null
          entry_fee?: number | null
          featured?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          provider_id: string
          slug: string
          title: string
          description: string | null
          duration_minutes: number
          price_type: string
          price_amount: number
          currency: string
          seats_max: number
          vehicle_type: string
          languages: string[]
          images: string[]
          includes: string[]
          exclusions: string[]
          rating_avg: number
          rating_count: number
          active: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          slug: string
          title: string
          description?: string | null
          duration_minutes: number
          price_type: string
          price_amount: number
          currency?: string
          seats_max: number
          vehicle_type: string
          languages?: string[]
          images?: string[]
          includes?: string[]
          exclusions?: string[]
          rating_avg?: number
          rating_count?: number
          active?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          slug?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          price_type?: string
          price_amount?: number
          currency?: string
          seats_max?: number
          vehicle_type?: string
          languages?: string[]
          images?: string[]
          includes?: string[]
          exclusions?: string[]
          rating_avg?: number
          rating_count?: number
          active?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trip_pois: {
        Row: {
          id: string
          trip_id: string
          poi_id: string
          order_index: number
          duration_at_poi: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          poi_id: string
          order_index: number
          duration_at_poi?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          poi_id?: string
          order_index?: number
          duration_at_poi?: number | null
          notes?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          booking_number: string
          trip_id: string | null
          provider_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string | null
          party_size: number
          booking_date: string
          booking_time: string
          pickup_location: string | null
          status: string
          price_total: number
          payment_status: string
          payment_method: string | null
          special_requests: string | null
          internal_notes: string | null
          confirmed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_number?: string
          trip_id?: string | null
          provider_id?: string | null
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          party_size: number
          booking_date: string
          booking_time: string
          pickup_location?: string | null
          status?: string
          price_total: number
          payment_status?: string
          payment_method?: string | null
          special_requests?: string | null
          internal_notes?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_number?: string
          trip_id?: string | null
          provider_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          party_size?: number
          booking_date?: string
          booking_time?: string
          pickup_location?: string | null
          status?: string
          price_total?: number
          payment_status?: string
          payment_method?: string | null
          special_requests?: string | null
          internal_notes?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          provider_id: string
          vehicle_id: string | null
          date: string
          start_time: string
          end_time: string
          is_available: boolean
          max_bookings: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          vehicle_id?: string | null
          date: string
          start_time: string
          end_time: string
          is_available?: boolean
          max_bookings?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          vehicle_id?: string | null
          date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
          max_bookings?: number
          notes?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          trip_id: string
          provider_id: string
          customer_name: string
          customer_email: string
          rating: number
          rating_comfort: number | null
          rating_punctuality: number | null
          rating_value: number | null
          comment: string | null
          images: string[]
          provider_response: string | null
          provider_responded_at: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          trip_id: string
          provider_id: string
          customer_name: string
          customer_email: string
          rating: number
          rating_comfort?: number | null
          rating_punctuality?: number | null
          rating_value?: number | null
          comment?: string | null
          images?: string[]
          provider_response?: string | null
          provider_responded_at?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          trip_id?: string
          provider_id?: string
          customer_name?: string
          customer_email?: string
          rating?: number
          rating_comfort?: number | null
          rating_punctuality?: number | null
          rating_value?: number | null
          comment?: string | null
          images?: string[]
          provider_response?: string | null
          provider_responded_at?: string | null
          verified?: boolean
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
