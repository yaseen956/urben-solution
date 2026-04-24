import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { initializeMappls, markerIcon } from '../services/mappls.js';

const defaultCenter = { lng: 77.209, lat: 28.6139 };

const normalizePoint = (point) => {
  if (!point) return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const markerColor = (marker, highlightedId) => {
  if (highlightedId && String(marker.id) === String(highlightedId)) return '#2563eb';
  if (marker.variant === 'user') return '#ef4444';
  if (marker.variant === 'destination') return '#0f766e';
  return marker.isAvailable === false ? '#f59e0b' : '#16a34a';
};

export default function MapComponent({
  center,
  zoom = 12,
  markers = [],
  route = null,
  highlightedId = null,
  title = 'Mappls map',
  emptyMessage = 'Choose a location to see the map.',
  height = 400,
  className = '',
  showLegend = true
}) {
  const containerId = useId().replace(/:/g, '');
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);
  const sdkRef = useRef(null);
  const markerInstances = useRef([]);
  const directionInstance = useRef(null);
  const [error, setError] = useState('');

  const normalizedCenter = useMemo(() => normalizePoint(center), [center]);
  const normalizedRoute = useMemo(
    () =>
      route
        ? {
            start: normalizePoint(route.start),
            end: normalizePoint(route.end)
          }
        : null,
    [route]
  );
  const normalizedMarkers = useMemo(
    () =>
      markers
        .map((marker) => ({
          ...marker,
          id: marker.id || marker._id,
          point: normalizePoint(marker.location || marker.currentLocation || marker.position || marker)
        }))
        .filter((marker) => marker.point),
    [markers]
  );

  const effectiveCenter = normalizedCenter || normalizedRoute?.start || normalizedRoute?.end || normalizedMarkers[0]?.point || defaultCenter;

  useEffect(() => {
    let cancelled = false;

    const mountMap = async () => {
      try {
        const key = import.meta.env.VITE_MAPPLS_API_KEY;
        console.log('MAPPLS KEY:', key);
        const sdk = await initializeMappls();
        if (!sdk) {
          if (!cancelled) setError('Mappls key missing');
          return;
        }
        if (cancelled || !containerRef.current) return;
        sdkRef.current = sdk;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        mapRef.current = sdk.mapplsClassObject.Map({
          id: containerId,
          properties: {
            center: [effectiveCenter.lng, effectiveCenter.lat],
            zoom,
            zoomControl: true,
            fullscreenControl: true,
            location: true
          }
        });
        setError('');
      } catch (mountError) {
        if (!cancelled) setError(mountError.message || 'Unable to load Mappls map.');
      }
    };

    mountMap();

    return () => {
      cancelled = true;
      markerInstances.current.forEach((marker) => marker?.remove?.());
      markerInstances.current = [];
      directionInstance.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId, effectiveCenter.lat, effectiveCenter.lng, zoom]);

  useEffect(() => {
    if (!mapRef.current || !sdkRef.current) return;

    markerInstances.current.forEach((marker) => marker?.remove?.());
    markerInstances.current = [];

    const map = mapRef.current;
    const sdk = sdkRef.current;
    const bounds = [];

    normalizedMarkers.forEach((marker) => {
      bounds.push([marker.point.lng, marker.point.lat]);
      markerInstances.current.push(
        sdk.mapplsClassObject.Marker({
          map,
          position: marker.point,
          icon: markerIcon(markerColor(marker, highlightedId), marker.name || marker.serviceName || 'T'),
          title: [marker.name, marker.distanceKm ? `${marker.distanceKm} km` : '', marker.rating ? `Rating ${marker.rating}` : '']
            .filter(Boolean)
            .join(' | '),
          fitbounds: false
        })
      );
    });

    if (normalizedRoute?.start) bounds.push([normalizedRoute.start.lng, normalizedRoute.start.lat]);
    if (normalizedRoute?.end) bounds.push([normalizedRoute.end.lng, normalizedRoute.end.lat]);

    if (bounds.length > 1) {
      sdk.mapplsClassObject.fitBounds({ map, bounds, padding: 48 });
    } else {
      map.setCenter?.([effectiveCenter.lng, effectiveCenter.lat]);
      map.setZoom?.(zoom);
    }
  }, [effectiveCenter, highlightedId, normalizedMarkers, normalizedRoute, zoom]);

  useEffect(() => {
    if (!mapRef.current || !sdkRef.current || !normalizedRoute?.start || !normalizedRoute?.end) return;

    try {
      sdkRef.current.mapplsPluginObject.direction(
        {
          map: mapRef.current,
          divWidth: '0px',
          isDraggable: false,
          search: false,
          alternatives: false,
          Profile: ['driving'],
          start: {
            label: 'Start',
            geoposition: `${normalizedRoute.start.lat},${normalizedRoute.start.lng}`
          },
          end: {
            label: 'End',
            geoposition: `${normalizedRoute.end.lat},${normalizedRoute.end.lng}`
          }
        },
        (pluginInstance) => {
          directionInstance.current = pluginInstance || directionInstance.current;
        }
      );
    } catch (routeError) {
      console.warn('Mappls direction fallback used:', routeError.message);
    }
  }, [normalizedRoute]);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapperRef.current.requestFullscreen();
    } catch (fullscreenError) {
      setError(fullscreenError.message || 'Fullscreen is not available here.');
    }
  };

  if (error) {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 ${className}`}>
        {error}
      </div>
    );
  }

  if (!normalizedMarkers.length && !normalizedRoute?.start && !normalizedRoute?.end && !normalizedCenter) {
    return (
      <div className={`grid place-items-center rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-center text-sm text-zinc-500 ${className}`} style={{ width: '100%', height }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`flex w-full min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white ${className}`}
      style={{ width: '100%', height }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-xs text-zinc-500">Powered by Mappls</p>
        </div>
        <div className="flex items-center gap-2">
          {showLegend && (
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-600">
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Available</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Busy</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Closest</span>
            </div>
          )}
          <button type="button" className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700" onClick={toggleFullscreen}>
            Fullscreen
          </button>
        </div>
      </div>
      <div id={containerId} ref={containerRef} className="min-h-0 w-full flex-1" />
    </div>
  );
}
