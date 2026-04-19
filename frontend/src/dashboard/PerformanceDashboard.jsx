import { useEffect, useState } from 'react';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    api.get('/technician/performance').then(({ data }) => setMetrics(data));
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-black text-ink">Performance</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Avg rating" value={metrics.avgRating || 0} />
        <StatCard label="Acceptance" value={`${metrics.acceptanceRate || 0}%`} />
        <StatCard label="Cancellation" value={`${metrics.cancellationRate || 0}%`} />
        <StatCard label="Avg completion" value={`${metrics.avgCompletionTime || 0} min`} />
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-md bg-cloud">
        <div className="h-full bg-coral" style={{ width: `${Math.min(metrics.acceptanceRate || 0, 100)}%` }} />
      </div>
    </section>
  );
}
