import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [type, setType] = useState('user');
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const auth = await login({ ...values, type });
      if (auth.profile?.role === 'admin') navigate('/admin');
      else navigate(type === 'technician' ? '/technician' : '/services');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-160px)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <img className="hidden h-[560px] w-full rounded-lg object-cover lg:block" src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=80" alt="Service booking support team" />
      <form className="panel p-6 sm:p-8" onSubmit={submit}>
        <p className="text-sm font-bold uppercase tracking-wide text-coral">Welcome back</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Login to Urben Solution</h1>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-cloud p-1">
          {['user', 'technician'].map((option) => (
            <button
              className={`rounded-md px-4 py-2 text-sm font-bold ${type === option ? 'bg-white text-coral shadow-sm' : 'text-zinc-600'}`}
              key={option}
              type="button"
              onClick={() => setType(option)}
            >
              {option === 'user' ? 'User/Admin' : 'Technician'}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4">
          <input className="input" type="email" placeholder="Email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} required />
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 w-full">Login</button>
        <p className="mt-5 text-center text-sm text-zinc-600">
          New here?{' '}
          <Link className="font-bold text-coral" to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}
