'use client';
import { useMemo } from 'react';

export function RatingStars({ value, count }: { value: number; count: number }) {
  const rounded = useMemo(() => Math.round(value * 10) / 10, [value]);
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rounded} out of 5 from ${count} reviews`}>
      <span className="text-amber-500">★</span>
      <span className="text-sm">{rounded}</span>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  );
}
