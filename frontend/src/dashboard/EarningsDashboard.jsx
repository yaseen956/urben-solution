import { useEffect, useState } from 'react';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function EarningsDashboard() {
  const [range, setRange] = useState('daily');
  const [data, setData] = useState({ total: 0, incentive: 0, averagePerOrder: 0, completedJobs: 0, jobs: [] });

  useEffect(() => {
    api.get('/technician/earnings', { params: { range } }).then(({ data: payload }) => setData(payload));
  }, [range]);

  return (
    <section className="panel p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-ink">Earnings</h2>
          <p className="mt-1 text-sm text-zinc-600">Completed-job earnings derived from bookings.</p>
        </div>
        <select className="input max-w-44" value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="daily">Today</option>
          <option value="weekly">This week</option>
          <option value="monthly">This month</option>
        </select>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={`Rs. ${data.total}`} />
        <StatCard label="Incentive" value={`Rs. ${data.incentive}`} />
        <StatCard label="Avg order" value={`Rs. ${data.averagePerOrder}`} />
        <StatCard label="Jobs" value={data.completedJobs} />
      </div>
      <button className="btn-secondary mt-5">Withdrawal request</button>
      <div className="mt-5 grid gap-3">
        {data.jobs.slice(0, 6).map((job) => (
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm" key={job._id}>
            <span className="font-bold text-ink">{job.service?.title}</span>
            <span className="text-zinc-600">Rs. {job.price}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
