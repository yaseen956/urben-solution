import { useEffect, useState } from 'react';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    const [statsRes, techRes, bookingRes, usersRes] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/technicians'),
      api.get('/admin/bookings'),
      api.get('/admin/users')
    ]);
    setStats(statsRes.data);
    setTechnicians(techRes.data.technicians);
    setBookings(bookingRes.data.bookings);
    setUsers(usersRes.data.users);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    await api.put(`/admin/technicians/${id}/approve`);
    load();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-wide text-coral">Admin panel</p>
      <h1 className="mt-2 text-4xl font-black text-ink">Marketplace control room</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Users" value={stats.users || 0} />
        <StatCard label="Technicians" value={stats.technicians || 0} />
        <StatCard label="Services" value={stats.services || 0} />
        <StatCard label="Bookings" value={stats.bookings || 0} />
        <StatCard label="Revenue" value={`Rs. ${stats.revenue || 0}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-xl font-black text-ink">Technicians</h2>
          <div className="mt-4 grid gap-3">
            {technicians.map((technician) => (
              <div className="rounded-lg border border-zinc-200 p-4" key={technician._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{technician.name}</p>
                    <p className="text-sm text-zinc-600">{technician.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">{technician.skills?.join(', ')}</p>
                  </div>
                  {technician.isApproved ? (
                    <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Approved</span>
                  ) : (
                    <button className="btn-primary px-3 py-2" onClick={() => approve(technician._id)}>
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-xl font-black text-ink">Recent bookings</h2>
          <div className="mt-4 grid gap-3">
            {bookings.slice(0, 8).map((booking) => (
              <div className="rounded-lg border border-zinc-200 p-4" key={booking._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{booking.service?.title}</p>
                    <p className="text-sm text-zinc-600">{booking.user?.name}</p>
                    <p className="text-xs text-zinc-500">{booking.technician?.name || 'Unassigned'}</p>
                  </div>
                  <span className="rounded-md bg-cloud px-3 py-1 text-xs font-bold text-zinc-700">{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel mt-8 overflow-hidden">
        <div className="border-b border-zinc-200 p-5">
          <h2 className="text-xl font-black text-ink">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cloud text-zinc-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-t border-zinc-100" key={user._id}>
                  <td className="px-5 py-3 font-semibold text-ink">{user.name}</td>
                  <td className="px-5 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-5 py-3 text-zinc-600">{user.phone}</td>
                  <td className="px-5 py-3 text-zinc-600">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
