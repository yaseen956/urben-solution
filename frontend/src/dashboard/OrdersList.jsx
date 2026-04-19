import { distanceKm } from './techUtils.js';

export default function OrdersList({ jobs, currentLocation, onAccept, onReject }) {
  const incoming = jobs.filter((job) => job.status === 'broadcasted');

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-ink">Incoming orders</h2>
          <p className="mt-1 text-sm text-zinc-600">Skill-matched jobs broadcast within 10 km appear here.</p>
        </div>
        <span className="rounded-md bg-coral px-3 py-1 text-sm font-black text-white">{incoming.length}</span>
      </div>
      <div className="mt-5 grid gap-4">
        {incoming.map((job) => {
          const km = distanceKm(currentLocation, { lat: job.lat, lng: job.lng });
          return (
            <article className="rounded-lg border border-zinc-200 p-4" key={job._id}>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-coral">New service request</p>
                  <h3 className="mt-1 text-lg font-black text-ink">{job.serviceName}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{job.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-600">
                    {km !== null && <span className="rounded-md bg-cloud px-3 py-1">{km.toFixed(1)} km away</span>}
                    {job.etaMinutes && <span className="rounded-md bg-cloud px-3 py-1">ETA {job.etaMinutes} min</span>}
                    {job.price && <span className="rounded-md bg-cloud px-3 py-1">Rs. {job.price}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-primary px-4 py-2" onClick={() => onAccept(job._id)}>
                    Accept
                  </button>
                  <button className="btn-secondary px-4 py-2" onClick={() => onReject(job._id)}>
                    Reject
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {incoming.length === 0 && <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">No incoming jobs right now.</p>}
      </div>
    </section>
  );
}
