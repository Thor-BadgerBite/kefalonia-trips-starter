import type { Provider } from '@/lib/types';

export const PROVIDERS: Provider[] = [
  {
    id: 'prov_ionian_rides',
    slug: 'ionian-rides',
    name: 'Ionian Rides',
    languages: ['en','el','it'],
    ratingAvg: 4.8,
    ratingCount: 132,
    vehicles: [
      { type: 'minivan', seats: 8, features: ['AC','Child seat','WiFi'] }
    ]
  },
  {
    id: 'prov_kefalonia_tours',
    slug: 'kefalonia-tours',
    name: 'Kefalonia Signature Tours',
    languages: ['en','de','el'],
    ratingAvg: 4.9,
    ratingCount: 201,
    vehicles: [
      { type: 'minivan', seats: 9, features: ['AC','Guide','WiFi'] },
      { type: 'sedan', seats: 4, features: ['AC'] }
    ]
  }
];
