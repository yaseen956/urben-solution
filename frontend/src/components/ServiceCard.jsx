import { Star } from 'lucide-react';
import { API_URL } from '../services/api.js';

export default function ServiceCard({ service, onBook }) {
  const image = service.image?.startsWith('/uploads') ? `${API_URL}${service.image}` : service.image;

  return (
    <article className="panel overflow-hidden">
      <img className="h-44 w-full object-cover" src={image} alt={service.title} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-coral">{service.category}</p>
            <h3 className="mt-1 text-lg font-bold text-ink">{service.title}</h3>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
            <Star size={14} fill="currentColor" /> {service.rating}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">{service.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-ink">Rs. {service.price}</p>
            <p className="text-xs text-zinc-500">{service.duration}</p>
          </div>
          <button className="btn-primary py-2" onClick={() => onBook(service)}>
            Book
          </button>
        </div>
      </div>
    </article>
  );
}
