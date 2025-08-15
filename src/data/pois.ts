import type { POI } from '@/lib/types';

export const POIS: POI[] = [
  {
    id: 'poi_myrtos',
    slug: 'myrtos-beach',
    name: 'Myrtos Beach',
    lat: 38.3269,
    lon: 20.5365,
    categories: ['Beaches','Scenic'],
    images: ['/images/myrtos.jpg'],
    shortDesc: 'Legendary white-pebble beach with dramatic cliffs and turquoise waters.'
  },
  {
    id: 'poi_melissani',
    slug: 'melissani-cave',
    name: 'Melissani Cave',
    lat: 38.2577,
    lon: 20.6006,
    categories: ['Caves','Nature'],
    images: ['/images/melissani.jpg'],
    shortDesc: 'Underground lake with ethereal blue light; boat tours available.'
  },
  {
    id: 'poi_assos',
    slug: 'assos-village',
    name: 'Assos Village',
    lat: 38.3785,
    lon: 20.5453,
    categories: ['Villages','Scenic'],
    images: ['/images/assos.jpg'],
    shortDesc: 'Colorful seaside village beneath a Venetian fortress.'
  },
  {
    id: 'poi_fiskardo',
    slug: 'fiskardo',
    name: 'Fiskardo',
    lat: 38.4568,
    lon: 20.5776,
    categories: ['Villages','Dining'],
    images: ['/images/fiskardo.jpg'],
    shortDesc: 'Chic harbor famous for yachts, pastel houses, and seafood.'
  },
  {
    id: 'poi_agia_efimia',
    slug: 'agia-efimia',
    name: 'Agia Efimia',
    lat: 38.3002,
    lon: 20.6002,
    categories: ['Villages','Harbors'],
    images: ['/images/agiaefimia.jpg'],
    shortDesc: 'Harbor village with cafés and access to hidden coves.'
  }
];
