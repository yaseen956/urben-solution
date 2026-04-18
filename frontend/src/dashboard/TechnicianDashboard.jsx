import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';

export default function TechnicianDashboard() {
  const { auth, setAuth } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, completedJobs: 0 });

  const load = async () => {
    const [jobsRes, earningsRes] = await Promise.all([api.get('/technician/jobs'), api.get('/technician/earnings')]);
    setJobs(jobsRes.data.bookings);
    setEarnings(earningsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const setAvailability = async () => {
    const { data } = await api.put('/technician/availability', { isOnline: !auth.profile.isOnline });
    setAuth({ ...auth, profile: data.technician });
  };

  const updateStatus = async (bookingId, status) => {
    await api.put('/technician/status', { bookingId, status });
    load();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-coral">Technician panel</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Hello, {auth.profile.name}</h1>
          <p className="mt-2 text-zinc-600">{auth.profile.isApproved ? 'Approved account' : 'Waiting for admin approval'}</p>
        </div>
        <button className={auth.profile.isOnline ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-secondary'} onClick={setAvailability}>
          {auth.profile.isOnline ? 'Online' : 'Offline'}
        </button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total earnings" value={`Rs. ${earnings.total}`} />
        <StatCard label="Completed jobs" value={earnings.completedJobs} />
        <StatCard label="Assigned jobs" value={jobs.length} />
      </div>
      <div className="mt-8 grid gap-4">
        {jobs.map((job) => (
          <article className="panel p-5" key={job._id}>
            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div>
                <span className="rounded-md bg-cloud px-3 py-1 text-xs font-bold text-zinc-700">{job.status}</span>
                <h2 className="mt-3 text-xl font-black text-ink">{job.service?.title}</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Customer: {job.user?.name} | {job.user?.phone}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {new Date(job.scheduledDate).toLocaleDateString()} at {job.timeSlot}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{job.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {['Accepted', 'Rejected', 'In Progress', 'Completed'].map((status) => (
                  <button className="btn-secondary px-3 py-2" key={status} onClick={() => updateStatus(job._id, status)}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
        {jobs.length === 0 && <p className="panel p-8 text-center text-zinc-500">Assigned jobs will appear here when customers book matching services.</p>}
      </div>
    </section>
  );
}
