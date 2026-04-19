import { useMemo } from 'react';
import MapView from './MapView.jsx';

export default function ActiveJob({ job, currentLocation, etaText, onEta, onStatus }) {
  const destination = useMemo(() => {
    return job?.lat && job?.lng ? { lat: Number(job.lat), lng: Number(job.lng) } : null;
  }, [job?.lat, job?.lng]);

  if (!job) {
    return (
      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">Active job</h2>
        <p className="mt-4 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">Accept a job to start navigation and workflow controls.</p>
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-coral">Active service</p>
          <h2 className="mt-1 text-2xl font-black text-ink">{job.serviceName}</h2>
          <p className="mt-2 text-sm text-zinc-600">{job.address}</p>
          {etaText && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">Customer ETA {etaText}</p>}
        </div>
        <span className="rounded-md bg-cloud px-3 py-1 text-sm font-bold text-zinc-700">{job.status}</span>
      </div>
      <div className="mt-5">
        <MapView origin={currentLocation} destination={destination} onEta={onEta} />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button className="btn-secondary" onClick={() => onStatus(job._id, 'assigned')}>
          Arrived
        </button>
        <button className="btn-primary" onClick={() => onStatus(job._id, 'in_progress')}>
          Start Service
        </button>
        <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={() => onStatus(job._id, 'completed')}>
          Mark Completed
        </button>
      </div>
    </section>
  );
}
