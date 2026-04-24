import MapComponent from '../components/MapComponent.jsx';

export default function MapView({ origin, destination }) {
  return (
    <MapComponent
      title="Live navigation"
      center={origin || destination}
      zoom={13}
      markers={[
        ...(origin ? [{ id: 'technician', name: 'You', variant: 'user', location: origin }] : []),
        ...(destination ? [{ id: 'destination', name: 'Customer', variant: 'destination', location: destination }] : [])
      ]}
      route={origin && destination ? { start: origin, end: destination } : null}
      emptyMessage="Waiting for live location and destination."
      height={320}
    />
  );
}
