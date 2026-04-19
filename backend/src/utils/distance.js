const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const distanceKm = (origin, destination) => {
  const values = [origin?.lat, origin?.lng, destination?.lat, destination?.lng].map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [lat1, lng1, lat2, lng2] = values.map(toRadians);
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
