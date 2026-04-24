import { Suspense, lazy, useState } from 'react';

const MapComponent = lazy(() => import('./MapComponent.jsx'));

const fallbackAddress = 'Unable to fetch address. Please enter manually.';

export default function LocationInput({ value, onChange, label = 'Address', required = true }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasLocation = Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));

  const setValue = (patch) => onChange({ ...value, ...patch });

  const reverseGeocode = async (lat, lng) => {
    try {
      const key = import.meta.env.VITE_MAPPLS_API_KEY;
      if (!key || !String(key).trim()) {
        console.error('API KEY MISSING');
        return fallbackAddress;
      }

      console.log('LAT LNG:', lat, lng);
      const url = `https://apis.mappls.com/advancedmaps/v1/${String(key).trim()}/rev_geocode?lat=${lat}&lng=${lng}&region=IND`;
      console.log('Mappls URL:', url);

      const res = await fetch(url);
      if (!res.ok) {
        console.error('Reverse Geocode HTTP Error:', res.status, res.statusText);
        return fallbackAddress;
      }
      const data = await res.json();

      console.log('MAPPLS RESPONSE:', data);

      if (!data || !data.results || data.results.length === 0) {
        console.error('No results from Mappls API');
        return fallbackAddress;
      }

      const place = data.results[0];
      const address = [
        place.houseNumber,
        place.street,
        place.locality,
        place.city,
        place.state,
        place.pincode,
        place.country
      ]
        .filter(Boolean)
        .join(', ');

      return address || fallbackAddress;
    } catch (err) {
      console.error('Reverse Geocode Error:', err);
      return fallbackAddress;
    }
  };

  const detectCurrentLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await reverseGeocode(lat, lng);

          setValue({
            ...value,
            lat,
            lng,
            address
          });
        } catch {
          setError('Failed to get address');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setError(geoError.code === 1 ? 'Location permission denied' : 'Unable to detect current location.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="grid gap-3">
      <label className="text-sm font-semibold text-zinc-600">{label}</label>
      <textarea
        className="input min-h-24"
        name="address"
        placeholder="Enter your city/address (e.g., Kunraghat, Gorakhpur)"
        value={value.address || ''}
        onChange={(event) => setValue({ address: event.target.value })}
        required={required}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="House / flat number" value={value.houseNumber || ''} onChange={(event) => setValue({ houseNumber: event.target.value })} />
        <input className="input" placeholder="Landmark" value={value.landmark || ''} onChange={(event) => setValue({ landmark: event.target.value })} />
      </div>
      <button className="btn-secondary" type="button" onClick={detectCurrentLocation} disabled={loading}>
        {loading ? 'Detecting location...' : 'Use Current Location'}
      </button>
      {hasLocation && (
        <div className="mt-2 w-full overflow-hidden rounded-lg border border-zinc-200">
          <Suspense fallback={<div className="h-56 w-full bg-cloud" />}>
            <MapComponent
              title="Location preview"
              center={{ lat: Number(value.lat), lng: Number(value.lng) }}
              zoom={15}
              markers={[{ id: 'selected-location', name: 'You', variant: 'user', location: { lat: Number(value.lat), lng: Number(value.lng) } }]}
              height={224}
              showLegend={false}
            />
          </Suspense>
        </div>
      )}
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export const composeAddress = ({ houseNumber, address, landmark }) => {
  return [houseNumber, address, landmark ? `Landmark: ${landmark}` : ''].filter(Boolean).join(', ');
};
