const toRadians = (degrees) => (degrees * Math.PI) / 180;

const fallbackEta = (origin, destination) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(3, Math.ceil((distanceKm / 22) * 60));
};

const fetchMapplsEta = async (origin, destination) => {
  const token = process.env.MAPPLS_ACCESS_TOKEN;
  if (!token) return null;

  const routePath = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    alternatives: 'false',
    geometries: 'polyline',
    overview: 'false',
    resource: 'route_eta',
    steps: 'false',
    access_token: token
  });
  const response = await fetch(`https://route.mappls.com/route/direction/route_eta/driving/${routePath}?${params}`);
  if (!response.ok) {
    throw new Error(`Mappls route ETA failed with status ${response.status}`);
  }
  const data = await response.json();
  const seconds = data.routes?.[0]?.duration || data.routes?.[0]?.duration_in_traffic || data.duration;
  if (!Number.isFinite(seconds)) return null;
  return Math.max(1, Math.ceil(Number(seconds) / 60));
};

export const calculateEtaMinutes = async ({ technicianLocation, customerLocation }) => {
  if (!technicianLocation || !customerLocation) return null;
  const origin = { lat: Number(technicianLocation.lat), lng: Number(technicianLocation.lng) };
  const destination = { lat: Number(customerLocation.lat), lng: Number(customerLocation.lng) };
  if (![origin.lat, origin.lng, destination.lat, destination.lng].every(Number.isFinite)) return null;

  try {
    const mapplsEta = await fetchMapplsEta(origin, destination);
    if (mapplsEta) return mapplsEta;
  } catch (error) {
    console.warn(`Mappls ETA fallback used: ${error.message}`);
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return fallbackEta(origin, destination);

  try {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: 'driving',
      key
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    const data = await response.json();
    const seconds = data.routes?.[0]?.legs?.[0]?.duration?.value;
    if (Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds / 60));
  } catch (error) {
    console.warn(`ETA fallback used: ${error.message}`);
  }

  return fallbackEta(origin, destination);
};
