'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Driver } from '@/types';

const REGIONS = [
  { id: 'all', name: '全体(中国四国)', center: [133.5, 34.3], zoom: 7 },
  { id: 'hiroshima', name: '広島', center: [132.7, 34.6], zoom: 8.5 },
  { id: 'yamaguchi', name: '山口', center: [131.5, 34.2], zoom: 8.5 },
  { id: 'shimane', name: '島根', center: [132.8, 35.1], zoom: 8.5 },
  { id: 'tottori', name: '鳥取', center: [133.9, 35.4], zoom: 8.5 },
  { id: 'okayama', name: '岡山', center: [133.9, 34.9], zoom: 8.5 },
  { id: 'ehime', name: '愛媛', center: [132.8, 33.7], zoom: 8.5 },
  { id: 'tokushima', name: '徳島', center: [134.3, 33.9], zoom: 8.5 },
  { id: 'kochi', name: '高知', center: [133.4, 33.6], zoom: 8.5 },
  { id: 'kagawa', name: '香川', center: [134.0, 34.2], zoom: 8.5 },
];

const REGION_PREF_MAP: Record<string, string> = {
  hiroshima: '広島',
  yamaguchi: '山口',
  shimane: '島根',
  tottori: '鳥取',
  okayama: '岡山',
  ehime: '愛媛',
  tokushima: '徳島',
  kochi: '高知',
  kagawa: '香川',
};

export default function MapBox({ drivers }: { drivers: Driver[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [activeRegion, setActiveRegion] = useState('all');

  const flyToRegion = (regionId: string) => {
    setActiveRegion(regionId);
    const region = REGIONS.find(r => r.id === regionId);
    if (region && map.current) {
      map.current.flyTo({
        center: region.center as [number, number],
        zoom: region.zoom,
        essential: true,
        duration: 1500,
      });
    }
  };

  useEffect(() => {
    if (!map.current) return;
    const updateHighlight = () => {
      if (!map.current?.getLayer('pref-fill')) return;
      if (activeRegion === 'all') {
        map.current.setFilter('pref-fill', null);
        map.current.setFilter('pref-border', null);
        map.current.setFilter('pref-border-glow', null);
      } else {
        const prefName = REGION_PREF_MAP[activeRegion];
        const filter: maplibregl.FilterSpecification = ['==', ['get', 'id'], prefName];
        map.current.setFilter('pref-fill', filter);
        map.current.setFilter('pref-border', filter);
        map.current.setFilter('pref-border-glow', filter);
      }
    };
    if (map.current.isStyleLoaded()) {
      updateHighlight();
    } else {
      map.current.once('styledata', updateHighlight);
    }
  }, [activeRegion]);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [133.5, 34.6],
      zoom: 7,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.current.addControl(
      new maplibregl.AttributionControl({
        customAttribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap',
      }),
      'bottom-left',
    );

    map.current.on('load', () => {
      if (!map.current) return;
      map.current.addSource('prefectures', {
        type: 'geojson',
        data: '/chugokushikoku.geojson',
      });

      map.current.addLayer({
        id: 'pref-fill',
        type: 'fill',
        source: 'prefectures',
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 },
        filter: ['==', ['get', 'id'], ''],
      });
      map.current.addLayer({
        id: 'pref-border-glow',
        type: 'line',
        source: 'prefectures',
        paint: { 'line-color': '#60a5fa', 'line-width': 6, 'line-opacity': 0.4, 'line-blur': 4 },
        filter: ['==', ['get', 'id'], ''],
      });
      map.current.addLayer({
        id: 'pref-border',
        type: 'line',
        source: 'prefectures',
        paint: { 'line-color': '#93c5fd', 'line-width': 2, 'line-opacity': 0.9 },
        filter: ['==', ['get', 'id'], ''],
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    drivers.forEach(driver => {
      let marker = markersRef.current[driver.id];

      if (!marker) {
        const el = document.createElement('div');
        el.className = `driver-marker status-${driver.status}`;
        el.innerHTML = driver.name.charAt(0);

        const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
          `<div style="color:#333;padding:4px;min-width:120px">
            <strong style="font-size:14px;margin-bottom:4px;display:block">${driver.name}</strong>
            <div style="font-size:12px;margin-bottom:2px">速度: ${driver.speed} km/h</div>
            <div style="font-size:12px;color:${driver.status === 'stopped' ? 'red' : '#666'}">状態: ${
              driver.status === 'driving' ? '走行中' : driver.status === 'stopped' ? `停車中 (${driver.stopDuration}分)` : 'オフライン'
            }</div>
          </div>`,
        );

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([driver.lng, driver.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current[driver.id] = marker;
      } else {
        marker.setLngLat([driver.lng, driver.lat]);
        const el = marker.getElement();
        el.className = `driver-marker status-${driver.status}`;
        marker.getPopup()?.setHTML(
          `<div style="color:#333;padding:4px;min-width:120px">
            <strong style="font-size:14px;margin-bottom:4px;display:block">${driver.name}</strong>
            <div style="font-size:12px;margin-bottom:2px">速度: ${driver.speed} km/h</div>
            <div style="font-size:12px;color:${driver.status === 'stopped' ? 'red' : '#666'}">状態: ${
              driver.status === 'driving' ? '走行中' : driver.status === 'stopped' ? `停車中 (${driver.stopDuration}分)` : 'オフライン'
            }</div>
          </div>`,
        );
      }
    });
  }, [drivers]);

  return (
    <>
      <div className="region-tabs">
        {REGIONS.map(region => (
          <button
            key={region.id}
            className={`region-tab ${activeRegion === region.id ? 'active' : ''}`}
            onClick={() => flyToRegion(region.id)}
          >
            {region.name}
          </button>
        ))}
      </div>
      <div ref={mapContainer} className="map-container" />
    </>
  );
}
