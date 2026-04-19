import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import BookingModal from '../components/BookingModal.jsx';

export default function Services() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryCategory = new URLSearchParams(location.search).get('category') || '';
  const { auth } = useAuth();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(queryCategory);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/services', { params: { search, category } });
      setServices(data.services);
    };
    load();
  }, [search, category]);

  const categories = useMemo(() => [...new Set(services.map((service) => service.category))], [services]);

  const book = (service) => {
    if (!auth) return navigate('/login');
    if (auth.type !== 'user') return setNotice('Use a customer account to book services.');
    setSelected(service);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-coral">Services</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Book a trusted expert</h1>
          <p className="mt-3 max-w-2xl text-zinc-600">Search by service, category, repair type or room. Filters call the backend API directly.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_240px] lg:w-[620px]">
          <input className="input" placeholder="Search cleaning, AC, salon..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      {notice && <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service._id} service={service} onBook={book} />
        ))}
      </div>
      {services.length === 0 && <p className="mt-10 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">No services found.</p>}
      {selected && (
        <BookingModal
          service={selected}
          onClose={() => setSelected(null)}
          onBooked={(result) => {
            setSelected(null);
            navigate(`/tracking/${result.booking._id}`, {
              state: { notifiedTechnicians: result.notifiedTechnicians || result.booking.broadcastedTo?.length || 0 }
            });
          }}
        />
      )}
    </section>
  );
}
