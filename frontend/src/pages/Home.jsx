import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Wrench } from 'lucide-react';

const categories = [
  {
    title: 'Home Cleaning & Pest Control',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
    items: 'Deep cleaning, kitchen, bathroom, sofa, carpet, pest control'
  },
  {
    title: 'Appliance Repair & Services',
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80',
    items: 'AC, washing machine, refrigerator, microwave, RO, chimney'
  },
  {
    title: 'Electrician, Plumber & Carpenter',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
    items: 'Wiring, leakage, pipe fitting, furniture, locks, modular work'
  },
  {
    title: 'Home Improvement & Construction',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    items: 'Painting, interiors, modular kitchen, ceiling, flooring'
  },
  {
    title: 'Beauty & Personal Care',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
    items: 'Salon, bridal makeup, spa, massage therapy'
  },
  {
    title: 'Specialized Services',
    image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=900&q=80',
    items: 'Packers, tutors, fitness trainers, photographers'
  }
];

export default function Home() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-coral">At-home services, without the chaos</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl lg:text-6xl">
              Book trusted professionals for every corner of your home.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Cleaning, pest control, repairs, beauty, interiors, tutors, movers and more. Choose a service, pick a slot, and track the job from request to completion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/services">
                Explore services
              </Link>
              <Link className="btn-secondary" to="/register">
                Join as technician
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              className="h-[420px] w-full rounded-lg object-cover"
              src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1100&q=80"
              alt="Professional home service technician"
            />
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 rounded-lg bg-white/95 p-3 shadow-lg">
              {[
                ['4.8', 'Avg rating'],
                ['27+', 'Services'],
                ['24h', 'Support']
              ].map(([value, label]) => (
                <div key={label} className="rounded-md bg-cloud p-3 text-center">
                  <p className="font-black text-ink">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [CalendarCheck, 'Easy booking', 'Pick your service, date, time and address in one flow.'],
            [ShieldCheck, 'Verified pros', 'Technician accounts can be approved before live assignments.'],
            [Wrench, 'Live job flow', 'Technicians accept requests and update status through a dashboard.']
          ].map(([Icon, title, text]) => (
            <div key={title} className="panel p-6">
              <Icon className="text-coral" />
              <h3 className="mt-4 text-xl font-black text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-coral">Categories</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Everything homes ask for</h2>
            </div>
            <Link className="btn-secondary" to="/services">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link to={`/services?category=${encodeURIComponent(category.title)}`} className="panel overflow-hidden transition hover:-translate-y-1 hover:shadow-md" key={category.title}>
                <img className="h-44 w-full object-cover" src={category.image} alt={category.title} />
                <div className="p-5">
                  <h3 className="text-lg font-black text-ink">{category.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{category.items}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
