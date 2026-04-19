import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/book/user').then(({ data }) => setBookings(data.bookings));
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-wide text-coral">History</p>
      <h1 className="mt-2 text-4xl font-black text-ink">My bookings</h1>
      <div className="mt-8 grid gap-4">
        {bookings.map((booking) => (
          <article className="panel p-5" key={booking._id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-ink">{booking.service?.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.timeSlot}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{booking.address}</p>
                {booking.technician && <p className="mt-2 text-sm text-zinc-600">Technician: {booking.technician.name}</p>}
              </div>
              <div className="text-left sm:text-right">
                <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{booking.status}</span>
                <p className="mt-3 text-xl font-black text-ink">Rs. {booking.price}</p>
                <p className="text-xs uppercase text-zinc-500">{booking.paymentStatus}</p>
                <Link className="mt-3 inline-flex rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold text-ink hover:border-coral hover:text-coral" to={`/tracking/${booking._id}`}>
                  Track live
                </Link>
              </div>
            </div>
          </article>
        ))}
        {bookings.length === 0 && <p className="panel p-8 text-center text-zinc-500">Your bookings will appear here.</p>}
      </div>
    </section>
  );
}
