import Image from 'next/image';
import Link from 'next/link';
import { RatingStars } from '@/components/RatingStars';

interface TripCardIndividualProps {
  slug: string;
  title: string;
  image: string;
  durationMin: number;
  priceType: 'fixed' | 'per_person' | 'hourly';
  priceAmount: number;
  currency: 'EUR';
  ratingAvg: number;
  ratingCount: number;
  vehicleType: string;
  languages: string[];
}

interface TripCardObjectProps {
  trip: {
    slug: string;
    title: string;
    images?: string[];
    duration_minutes: number;
    price_type: 'fixed' | 'per_person' | 'hourly';
    price_amount: number;
    currency: string;
    rating_avg: number;
    rating_count: number;
    vehicle_type: string;
    languages?: string[];
    trip_pois?: any[];
  };
}

type TripCardProps = TripCardIndividualProps | TripCardObjectProps;

export default function TripCard(props: TripCardProps) {
  // Normalize props to individual format
  const normalized = 'trip' in props ? {
    slug: props.trip.slug,
    title: props.trip.title,
    image: props.trip.images?.[0] || '/placeholder-trip.jpg',
    durationMin: props.trip.duration_minutes,
    priceType: props.trip.price_type,
    priceAmount: props.trip.price_amount,
    currency: props.trip.currency as 'EUR',
    ratingAvg: props.trip.rating_avg,
    ratingCount: props.trip.rating_count,
    vehicleType: props.trip.vehicle_type,
    languages: props.trip.languages || ['en'],
  } : props;

  const { slug, title, image, durationMin, priceType, priceAmount, ratingAvg, ratingCount, vehicleType, languages } = normalized;

  const priceLabel =
    priceType === 'per_person' ? `€${priceAmount} / person` :
    priceType === 'hourly' ? `€${priceAmount}/h` : `€${priceAmount} total`;

  return (
    <Link href={`/trip/${slug}`} className="block rounded-2xl overflow-hidden shadow hover:shadow-md transition bg-white">
      <div className="relative h-48 w-full">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
          <span className="text-sm px-2 py-1 rounded-full bg-gray-100 capitalize">{vehicleType}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{Math.round(durationMin/60)}h</span>
          <span>•</span>
          <span>{priceLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <RatingStars value={ratingAvg} count={ratingCount} />
          <div className="flex gap-1">
            {languages.slice(0, 2).map(l => <span key={l} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{l.toUpperCase()}</span>)}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Export both named and default
export { TripCard };
