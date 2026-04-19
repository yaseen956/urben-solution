import { useState } from 'react';
import api from '../services/api.js';
import LocationInput, { composeAddress, geocodeTextAddress } from './LocationInput.jsx';

export default function BookingModal({ service, onClose, onBooked }) {
  const [form, setForm] = useState({
    scheduledDate: '',
    timeSlot: '10:00 AM - 12:00 PM',
    address: '',
    houseNumber: '',
    landmark: '',
    lat: '',
    lng: '',
    paymentMethod: 'razorpay'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
      document.body.appendChild(script);
    });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      let locationForm = form;
      if (form.address.trim() && (!Number.isFinite(Number(form.lat)) || !Number.isFinite(Number(form.lng)))) {
        const geocoded = await geocodeTextAddress(form.address);
        if (geocoded) {
          locationForm = { ...form, ...geocoded };
          setForm(locationForm);
        }
      }

      if (!locationForm.address.trim() || !Number.isFinite(Number(locationForm.lat)) || !Number.isFinite(Number(locationForm.lng))) {
        setError('Use current location or enter a valid address before payment.');
        setLoading(false);
        return;
      }
      const bookingPayload = {
        ...locationForm,
        address: composeAddress(locationForm)
      };
      await loadRazorpay();
      const orderRes = await api.post('/create-order', { amount: service.price });
      const order = orderRes.data;

      const options = {
        key: order.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Urben Solution',
        description: service.title,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const { data } = await api.post('/verify-payment', {
              ...response,
              booking: { ...bookingPayload, serviceId: service._id }
            });
            onBooked(data);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verified by Razorpay, but booking save failed.');
            setLoading(false);
          }
        },
        prefill: {},
        modal: {
          ondismiss: () => setLoading(false)
        },
        theme: { color: '#fb5d4f' }
      };

      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', (response) => {
        setError(response.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      checkout.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4">
      <form className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onSubmit={submit}>
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
          <LocationInput label="Service address" value={form} onChange={setForm} />
          <select className="input" name="paymentMethod" value={form.paymentMethod} onChange={update}>
            <option value="razorpay">Razorpay</option>
          </select>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? 'Opening payment...' : `Pay Now Rs. ${service.price}`}
        </button>
      </form>
    </div>
  );
}
