import { useEffect, useMemo, useRef, useState } from 'react';

let googleMapsPromise;

const loadGoogleMaps = (key) => {
  if (!key) return Promise.resolve(null);
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
      script.async = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
};

export default function MapView({ origin, destination, onEta }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const directionsRenderer = useRef(null);
  const [fallback, setFallback] = useState(false);
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!origin || !destination) return undefined;
    let cancelled = false;

    loadGoogleMaps(key)
      .then((maps) => {
        if (cancelled || !maps) {
          setFallback(true);
          return;
        }
        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center: origin,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true
          });
          directionsRenderer.current = new maps.DirectionsRenderer({ map: mapInstance.current, suppressMarkers: false });
        }
        const service = new maps.DirectionsService();
        service.route(
          {
            origin,
            destination,
            travelMode: maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === 'OK') {
              directionsRenderer.current.setDirections(result);
              const duration = result.routes?.[0]?.legs?.[0]?.duration?.text;
              if (duration) onEta?.(duration);
            } else {
              setFallback(true);
            }
          }
        );
      })
      .catch(() => setFallback(true));

    return () => {
      cancelled = true;
    };
  }, [destination, key, onEta, origin]);

  const fallbackUrl = useMemo(() => {
    const point = origin || destination;
    if (!point) return '';
    const delta = 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${point.lng - delta}%2C${point.lat - delta}%2C${point.lng + delta}%2C${point.lat + delta}&layer=mapnik&marker=${point.lat}%2C${point.lng}`;
  }, [destination, origin]);

  if (!origin || !destination) {
    return <div className="grid h-80 place-items-center rounded-lg bg-cloud text-sm text-zinc-500">Waiting for live location and destination.</div>;
  }

  if (fallback || !key) {
    return <iframe className="h-80 w-full rounded-lg border border-zinc-200" src={fallbackUrl} title="Technician location map" />;
  }

  return <div className="h-80 rounded-lg border border-zinc-200" ref={mapRef} />;
}
