import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TrackingPage() {
  const { id } = useParams();
  const location = useLocation();
  const { auth } = useAuth();
  const [booking, setBooking] = useState(null);
  const [customerPosition, setCustomerPosition] = useState(null);
  const [technicianPosition, setTechnicianPosition] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [notifiedTechnicians, setNotifiedTechnicians] = useState(location.state?.notifiedTechnicians || 0);

  useEffect(() => {
    api.get(`/book/user/${id}`).then(({ data }) => {
      setBooking(data.booking);
      const coordinates = data.booking.location?.coordinates;
      if (coordinates?.length === 2) setCustomerPosition({ lng: coordinates[0], lat: coordinates[1] });
      if (data.booking.broadcastedTo?.length) setNotifiedTechnicians(data.booking.broadcastedTo.length);
      if (data.booking.technician) {
        setTechnician(data.booking.technician);
        const techCoordinates = data.booking.technician.location?.coordinates;
        if (techCoordinates?.length === 2) setTechnicianPosition({ lng: techCoordinates[0], lat: techCoordinates[1] });
      }
      if (data.booking.etaMinutes) setEtaMinutes(data.booking.etaMinutes);
    });
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (auth?.profile?.id) socket.emit('join-user', auth.profile.id);
    socket.emit('join-booking', id);
    socket.on('booking-broadcasted', (payload) => {
      if (payload.bookingId === id) {
        setNotifiedTechnicians(payload.notifiedTechnicians || 0);
        setBooking((current) => (current ? { ...current, status: payload.status } : current));
      }
    });
    socket.on('job-assigned', (payload) => {
      if (payload.bookingId === id) {
        setTechnician(payload.technician);
        setTechnicianPosition(payload.technician?.currentLocation);
        setEtaMinutes(payload.etaMinutes);
        setBooking((current) => (current ? { ...current, status: payload.status, technician: payload.technician } : current));
      }
    });
    socket.on('location-update', (payload) => {
      if (payload.bookingId === id) {
        setTechnicianPosition({ lat: payload.lat, lng: payload.lng });
        setEtaMinutes(payload.etaMinutes);
      }
    });
    socket.on('technician-location', (payload) => {
      if (payload.bookingId === id) {
        setTechnicianPosition({ lat: payload.lat, lng: payload.lng });
        setEtaMinutes(payload.etaMinutes);
      }
    });
    socket.on('booking-updated', (payload) => {
      if (payload._id === id) setBooking(payload);
    });

    return () => {
      socket.off('booking-broadcasted');
      socket.off('job-assigned');
      socket.off('location-update');
      socket.off('technician-location');
      socket.off('booking-updated');
    };
  }, [auth?.profile?.id, id]);

  const mapUrl = useMemo(() => {
    const position = technicianPosition || customerPosition;
    if (!position) return '';
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (key) {
      if (technicianPosition && customerPosition) {
        return `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${technicianPosition.lat},${technicianPosition.lng}&destination=${customerPosition.lat},${customerPosition.lng}&mode=driving`;
      }
      return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${position.lat},${position.lng}&zoom=15`;
    }
    const delta = 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${position.lng - delta}%2C${position.lat - delta}%2C${position.lng + delta}%2C${position.lat + delta}&layer=mapnik&marker=${position.lat}%2C${position.lng}`;
  }, [customerPosition, technicianPosition]);

  const waiting = booking && ['broadcasted', 'pending', 'paid'].includes(booking.status) && !technician;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-wide text-coral">Live tracking</p>
      <h1 className="mt-2 text-4xl font-black text-ink">{booking?.service?.title || 'Tracking booking'}</h1>
      {waiting && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-black">Searching for nearby technicians...</p>
          <p className="mt-1 text-sm">{notifiedTechnicians} technician{notifiedTechnicians === 1 ? '' : 's'} notified within 10 km.</p>
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {mapUrl ? (
            <iframe title="Technician live location" className="h-[520px] w-full" src={mapUrl} />
          ) : (
            <div className="grid h-[520px] place-items-center text-zinc-500">Waiting for technician location...</div>
          )}
        </div>
        <aside className="panel p-5">
          <h2 className="text-xl font-black text-ink">Job details</h2>
          <p className="mt-4 text-sm text-zinc-600">{booking?.address}</p>
          <p className="mt-4 text-sm font-bold text-ink">Status: {booking?.status || 'Loading'}</p>
          <p className="mt-2 text-sm text-zinc-600">Technician: {technician?.name || booking?.technician?.name || 'Assigning nearby expert'}</p>
          {(technician?.address || booking?.technician?.address) && <p className="mt-2 text-sm text-zinc-600">Technician address: {technician?.address || booking?.technician?.address}</p>}
          {(technician?.phone || booking?.technician?.phone) && <p className="mt-2 text-sm text-zinc-600">Contact: {technician?.phone || booking?.technician?.phone}</p>}
          {(technician?.skills || booking?.technician?.skills) && (
            <p className="mt-2 text-sm text-zinc-600">Skills: {(technician?.skills || booking?.technician?.skills || []).join(', ')}</p>
          )}
          {etaMinutes && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Technician will arrive in ~{etaMinutes} minutes</p>}
        </aside>
      </div>
    </section>
  );
}
