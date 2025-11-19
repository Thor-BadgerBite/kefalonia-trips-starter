export type Lang = 'en'|'el'|'it'|'de';
export type VehicleType = 'sedan'|'minivan'|'minibus';
export type PriceType = 'fixed'|'per_person'|'hourly';

export interface POI {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lon: number;
  categories: string[];
  images: string[];
  shortDesc: string;
}

export interface POIStopType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  is_custom: boolean;
}

export interface TripPOI {
  id: string;
  trip_id: string;
  poi_id: string;
  order_index: number;
  duration_at_poi: number | null;
  stop_type_id: string | null;
  custom_stop_name: string | null;
  stop_description: string | null;
  stop_images: string[] | null;
  provider_tips: string | null;
  notes: string | null;
  poi?: POI;
  stop_type?: POIStopType;
}

export interface Provider {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  languages: Lang[];
  ratingAvg: number;
  ratingCount: number;
  vehicles: { type: VehicleType; seats: number; features: string[] }[];
}

export interface Trip {
  id: string;
  slug: string;
  title: string;
  providerId: string;
  poiIds: string[];
  durationMin: number;
  priceType: PriceType;
  priceAmount: number;
  currency: 'EUR';
  seatsMax: number;
  vehicleType: VehicleType;
  languages: Lang[];
  images: string[];
  includes: string[];
  exclusions: string[];
  ratingAvg: number;
  ratingCount: number;
}

export interface TransferRegion {
  id: string;
  name: string;
  slug: string;
  area_type: string;
  lat: number | null;
  lon: number | null;
}

export interface TransferPricelist {
  id: string;
  provider_id: string;
  from_region_id: string;
  to_region_id: string;
  vehicle_type: string;
  price_type: string;
  price_amount: number;
  currency: string;
  max_passengers: number | null;
  notes: string | null;
  from_region?: TransferRegion;
  to_region?: TransferRegion;
}

export interface ProviderPOITemplate {
  id: string;
  provider_id: string;
  poi_id: string;
  stop_type_id: string | null;
  custom_name: string | null;
  duration_minutes: number;
  description: string | null;
  images: string[] | null;
  tips: string | null;
  poi?: POI;
  stop_type?: POIStopType;
}

export interface Vehicle {
  id: string;
  provider_id: string;
  type: string;
  model: string;
  capacity: number;
  active: boolean;
  image_urls: string[];
  primary_image_url: string | null;
  description: string | null;
  features: string[];
  license_plate: string | null;
  year: number | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Availability {
  id: string;
  provider_id: string;
  vehicle_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  provider_id: string;
  trip_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  num_guests: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  special_requests: string | null;
  vehicle_id: string | null;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  vehicle?: Vehicle;
}

export interface WorkingHours {
  id: string;
  provider_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;
  end_time: string;
  active: boolean;
  label: string | null;
  created_at: string;
  updated_at: string;
}
