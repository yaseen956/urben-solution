import { useState } from 'react';
import api from '../services/api.js';

export default function BookingModal({ service, onClose, onBooked }) {
  const [form, setForm] = useState({
    scheduledDate: '',
    timeSlot: '10:00 AM - 12:00 PM',
    address: '',
    paymentMethod: 'cash'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/book', { ...form, serviceId: service._id });
      onBooked(data.booking);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4">
      <form className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-coral">Book service</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{service.title}</h2>
          </div>
          <button type="button" className="rounded-md border border-zinc-200 px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          <input className="input" type="date" name="scheduledDate" value={form.scheduledDate} onChange={update} required />
          <select className="input" name="timeSlot" value={form.timeSlot} onChange={update}>
            <option>10:00 AM - 12:00 PM</option>
            <option>12:00 PM - 02:00 PM</option>
            <option>04:00 PM - 06:00 PM</option>
            <option>06:00 PM - 08:00 PM</option>
          </select>
          <textarea className="input min-h-28" name="address" placeholder="Full address" value={form.address} onChange={update} required />
          <select className="input" name="paymentMethod" value={form.paymentMethod} onChange={update}>
            <option value="cash">Cash after service</option>
            <option value="upi">UPI dummy payment</option>
            <option value="card">Card dummy payment</option>
          </select>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? 'Booking...' : `Confirm for Rs. ${service.price}`}
        </button>
      </form>
    </div>
  );
}
