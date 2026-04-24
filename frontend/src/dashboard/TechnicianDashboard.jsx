import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import { getSocket } from '../services/socket.js';
import ActiveJob from './ActiveJob.jsx';
import EarningsDashboard from './EarningsDashboard.jsx';
import OrdersList from './OrdersList.jsx';
import PerformanceDashboard from './PerformanceDashboard.jsx';
import ProfilePage from './ProfilePage.jsx';
import Support from './Support.jsx';
import { normalizeJob, playNewJobSound } from './techUtils.js';

const tabs = ['orders', 'earnings', 'performance', 'support', 'profile'];

export default function TechnicianDashboard() {
  const { auth, setAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [jobs, setJobs] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, completedJobs: 0 });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [etaText, setEtaText] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const lastLocationSentAt = useRef(0);

  const load = async () => {
    const [jobsRes, earningsRes] = await Promise.all([
      api.get('/technician/jobs'),
      api.get('/technician/earnings', { params: { range: 'monthly' } })
    ]);
    setJobs(jobsRes.data.bookings.map(normalizeJob));
    setEarnings(earningsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join-technician', auth.profile.id);

    socket.on('new-job', (job) => {
        const normalized = normalizeJob(job);
      playNewJobSound();
      setAlerts((current) => [{ id: Date.now(), text: `New ${normalized.serviceName} job nearby` }, ...current].slice(0, 5));
      setJobs((current) => (current.some((item) => item._id === normalized._id) ? current : [normalized, ...current]));
    });

    socket.on('job-accepted', (job) => {
      setJobs((current) =>
        current.map((item) =>
          item._id === job.bookingId || item._id === job._id
            ? normalizeJob({ ...item, ...job, _id: item._id, status: job.status || 'assigned' })
            : item
        )
      );
    });

    socket.on('job-locked', ({ bookingId }) => {
      setAlerts((current) => [{ id: Date.now(), text: 'A broadcasted job was accepted by another technician.' }, ...current].slice(0, 5));
      setJobs((current) => current.filter((item) => item._id !== bookingId));
    });

    socket.on('system-alert', (alert) => {
      setAlerts((current) => [{ id: Date.now(), text: alert.message || 'System alert received' }, ...current].slice(0, 5));
    });

    return () => {
      socket.off('new-job');
      socket.off('job-accepted');
      socket.off('job-locked');
      socket.off('system-alert');
    };
  }, [auth.profile.id]);

  const activeJob = useMemo(() => {
    return jobs.find((job) => ['accepted', 'assigned', 'in_progress'].includes(job.status));
  }, [jobs]);

  useEffect(() => {
    if (!auth.profile.isAvailable || !navigator.geolocation) return undefined;

    const socket = getSocket();
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(nextLocation);
        setTrackingError('');

        if (now - lastLocationSentAt.current < 6000) return;
        lastLocationSentAt.current = now;
        socket.emit('technician-location-update', {
          bookingId: activeJob?._id,
          technicianId: auth.profile.id,
          ...nextLocation
        });
        api.post('/location/update', {
          bookingId: activeJob?._id,
          ...nextLocation
        }).catch(() => null);
      },
      () => setTrackingError('Live location permission is needed for navigation and customer tracking.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeJob?._id, auth.profile.id, auth.profile.isAvailable]);

  const setAvailability = async () => {
    const { data } = await api.patch('/technician/status', { isAvailable: !auth.profile.isAvailable });
    setAuth({ ...auth, profile: data.technician });
  };

  const acceptJob = (bookingId) => {
    getSocket().emit('accept-job', { bookingId, technicianId: auth.profile.id });
  };

  const rejectJob = (bookingId) => {
    setJobs((current) => current.filter((job) => job._id !== bookingId));
    setAlerts((current) => [{ id: Date.now(), text: 'Job removed from your queue.' }, ...current].slice(0, 5));
  };

  const updateStatus = async (bookingId, status) => {
    const { data } = await api.patch(`/book/${bookingId}/status`, { status });
    setJobs((current) => current.map((job) => (job._id === bookingId ? normalizeJob(data.booking) : job)));
    if (status === 'completed') load();
  };

  const renderTab = () => {
    if (activeTab === 'earnings') return <EarningsDashboard />;
    if (activeTab === 'performance') return <PerformanceDashboard />;
    if (activeTab === 'support') return <Support activeJob={activeJob} />;
    if (activeTab === 'profile') return <ProfilePage />;
    return (
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <OrdersList jobs={jobs} currentLocation={currentLocation} onAccept={acceptJob} onReject={rejectJob} />
        <ActiveJob job={activeJob} currentLocation={currentLocation} etaText={etaText} onEta={setEtaText} onStatus={updateStatus} />
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-coral">Technician panel</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Hello, {auth.profile.name}</h1>
          <p className="mt-2 text-zinc-600">{auth.profile.isApproved ? 'Approved account' : 'Waiting for admin approval'}</p>
        </div>
        <button className={auth.profile.isAvailable ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-secondary'} onClick={setAvailability}>
          {auth.profile.isAvailable ? 'Online' : 'Offline'}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Monthly earnings" value={`Rs. ${earnings.total || 0}`} />
        <StatCard label="Completed jobs" value={earnings.completedJobs || 0} />
        <StatCard label="Incoming" value={jobs.filter((job) => ['broadcasted', 'pending'].includes(job.status)).length} />
        <StatCard label="Alerts" value={alerts.length} />
      </div>

      {trackingError && <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{trackingError}</p>}
      {alerts.length > 0 && (
        <div className="mt-6 grid gap-2">
          {alerts.map((alert) => (
            <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700" key={alert.id}>
              {alert.text}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            className={`rounded-md px-4 py-2 text-sm font-bold capitalize ${activeTab === tab ? 'bg-ink text-white' : 'border border-zinc-200 bg-white text-zinc-700'}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">{renderTab()}</div>
    </section>
  );
}
