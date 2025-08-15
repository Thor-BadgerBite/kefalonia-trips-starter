'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type POI = { lat:number; lon:number; name:string; slug:string; };

export default function MapCanvas({ pois }:{ pois: POI[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [20.6, 38.18],
      zoom: 9
    });

    pois.forEach(p => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '9999px';
      el.style.background = '#2563eb';
      el.style.cursor = 'pointer';
      el.title = p.name;
      el.addEventListener('click', () => {
        window.location.href = `/poi/${p.slug}`;
      });
      new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(map);
    });

    return () => map.remove();
  }, [pois]);

  return <div ref={ref} className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden shadow" />;
}
