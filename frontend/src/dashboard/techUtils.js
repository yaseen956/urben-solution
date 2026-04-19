export const normalizeJob = (job) => ({
  ...job,
  _id: job._id || job.bookingId,
  status: job.status || 'broadcasted',
  serviceName: job.serviceName || job.service?.title || 'Service job',
  lat: job.lat ?? job.location?.coordinates?.[1],
  lng: job.lng ?? job.location?.coordinates?.[0],
  customerName: job.user?.name,
  customerPhone: job.user?.phone
});

export const distanceKm = (origin, destination) => {
  if (!origin || !destination) return null;
  const values = [origin.lat, origin.lng, destination.lat, destination.lng].map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [lat1, lng1, lat2, lng2] = values.map((value) => (value * Math.PI) / 180);
  const earthRadiusKm = 6371;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const playNewJobSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.08, context.currentTime);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
};
