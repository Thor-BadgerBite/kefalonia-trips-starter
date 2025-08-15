import { POIS } from '@/data/pois';
import { PROVIDERS } from '@/data/providers';
import { TRIPS } from '@/data/trips';

export function getPOIs() { return POIS; }
export function getPOIBySlug(slug: string) { return POIS.find(p => p.slug === slug); }

export function getProviders() { return PROVIDERS; }
export function getProviderBySlug(slug: string) { return PROVIDERS.find(p => p.slug === slug); }

export function getTrips() { return TRIPS; }
export function getTripBySlug(slug: string) { return TRIPS.find(t => t.slug === slug); }

export function getTripsByPOI(poiId: string) {
  return TRIPS.filter(t => t.poiIds.includes(poiId));
}
