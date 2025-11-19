'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { POI } from '@/lib/types';

interface POIMapSelectorProps {
  pois: POI[];
  selectedPOIs: POI[];
  onPOISelect: (poi: POI) => void;
}

export function POIMapSelector({ pois, selectedPOIs, onPOISelect }: POIMapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [20.6, 38.18],
      zoom: 9.5
    });

    setMap(newMap);

    return () => newMap.remove();
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.poi-marker-custom');
    markers.forEach(m => m.remove());

    // Add POI markers
    pois.forEach(poi => {
      const isSelected = selectedPOIs.some(p => p.id === poi.id);

      const el = document.createElement('div');
      el.className = 'poi-marker-custom';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.background = isSelected ? '#10b981' : '#2563eb';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '16px';
      el.style.fontWeight = 'bold';
      el.style.transition = 'all 0.2s';

      el.textContent = isSelected ? '✓' : '+';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      el.addEventListener('click', () => {
        onPOISelect(poi);
      });

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong style="font-size: 14px;">${poi.name}</strong>
          <p style="font-size: 12px; margin: 4px 0 0 0; color: #666;">${poi.shortDesc}</p>
          <p style="font-size: 11px; margin: 4px 0 0 0; color: ${isSelected ? '#10b981' : '#2563eb'};">
            ${isSelected ? '✓ Added to trip' : 'Click to add'}
          </p>
        </div>
      `);

      new maplibregl.Marker({ element: el })
        .setLngLat([poi.lon, poi.lat])
        .setPopup(popup)
        .addTo(map);
    });
  }, [map, pois, selectedPOIs, onPOISelect]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg" />
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
          <span>Available POI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white"></div>
          <span>Selected POI</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Click markers to add/remove</p>
      </div>
    </div>
  );
}
