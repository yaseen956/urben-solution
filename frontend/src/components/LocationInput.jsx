import { useMemo, useState } from 'react';

const fallbackAddress = 'Location detected. Add house number or landmark for accuracy.';

export const geocodeTextAddress = async (address) => {
  const cleanAddress = address.trim();
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!cleanAddress || !key) return null;
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddress)}&key=${key}`);
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) return null;
  return {
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng
  };
};

export default function LocationInput({ value, onChange, label = 'Address', required = true }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const setValue = (patch) => onChange({ ...value, ...patch });

// this is  geolocation temmprory if  you dont have google geocoding api key
  const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();
  return data.display_name;
  };

  // this is geocoding using google api if you have key
  // const reverseGeocode = async (lat, lng) => {
  //   if (!key) return fallbackAddress;
  //   const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`);
  //   const data = await response.json();
  //   return data.results?.[0]?.formatted_address || fallbackAddress;
  // };

  const detectCurrentLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await reverseGeocode(lat, lng);
          setValue({ address, lat, lng });
        } catch {
          setError('Location found, but address lookup failed. Please enter the address manually.');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setError(geoError.code === 1 ? 'Location permission denied.' : 'Unable to detect current location.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const geocodeTypedAddress = async () => {
    if (!value.address?.trim()) return null;
    setError('');
    setLoading(true);
    try {
      const result = await geocodeTextAddress(value.address);
      if (result) {
        setValue(result);
        return result;
      }
      // if (!key) setError('Google Maps key is required to convert typed addresses.');
      // else setError('Could not find that address. Try a more complete address.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const mapUrl = useMemo(() => {
    if (!Number.isFinite(Number(value.lat)) || !Number.isFinite(Number(value.lng))) return '';
    if (key) return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${value.lat},${value.lng}&zoom=16`;
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    const delta = 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [key, value.lat, value.lng]);

  return (
    <div className="grid gap-3">
      <label className="text-sm font-semibold text-zinc-600">{label}</label>
      <textarea
        className="input min-h-24"
        name="address"
        placeholder="Enter your city/address (e.g., Kunraghat, Gorakhpur)"
        value={value.address || ''}
        onBlur={geocodeTypedAddress}
        onChange={(event) => setValue({ address: event.target.value, lat: '', lng: '' })}
        required={required}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="House / flat number" value={value.houseNumber || ''} onChange={(event) => setValue({ houseNumber: event.target.value })} />
        <input className="input" placeholder="Landmark" value={value.landmark || ''} onChange={(event) => setValue({ landmark: event.target.value })} />
      </div>
      <button className="btn-secondary" type="button" onClick={detectCurrentLocation} disabled={loading}>
        {loading ? 'Detecting location...' : 'Use Current Location'}
      </button>
      {mapUrl && <iframe className="h-56 w-full rounded-lg border border-zinc-200" src={mapUrl} title={`${label} map preview`} />}
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export const composeAddress = ({ houseNumber, address, landmark }) => {
  return [houseNumber, address, landmark ? `Landmark: ${landmark}` : ''].filter(Boolean).join(', ');
};
