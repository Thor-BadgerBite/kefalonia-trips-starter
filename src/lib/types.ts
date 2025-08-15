export type Lang = 'en'|'el'|'it'|'de';
export type VehicleType = 'sedan'|'minivan'|'minibus';

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
  priceType: 'fixed'|'per_person'|'hourly';
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
