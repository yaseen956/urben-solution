import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition hover:text-coral ${isActive ? 'text-coral' : 'text-zinc-700'}`;

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white">
            <Sparkles size={18} />
          </span>
          Urben Solution
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/services" className={linkClass}>
            Services
          </NavLink>
          {auth?.type === 'user' && (
            <NavLink to="/bookings" className={linkClass}>
              My bookings
            </NavLink>
          )}
          {auth?.type === 'technician' && (
            <NavLink to="/technician" className={linkClass}>
              Technician
            </NavLink>
          )}
          {auth?.profile?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {auth ? (
            <button className="btn-secondary py-2" onClick={signOut}>
              Logout
            </button>
          ) : (
            <Link className="btn-primary py-2" to="/login">
              Login
            </Link>
          )}
          <button className="rounded-md border border-zinc-200 p-2 md:hidden" aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
