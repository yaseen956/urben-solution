import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [type, setType] = useState('user');
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: '',
    experience: '',
    location: ''
  });
  const [files, setFiles] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (type === 'technician') {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => formData.append(key, value));
        if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto);
        if (files.idProof) formData.append('idProof', files.idProof);
        await register({ type, formData });
        navigate('/technician');
      } else {
        await register({ type, values });
        navigate('/services');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <form className="panel p-6 sm:p-8" onSubmit={submit}>
        <p className="text-sm font-bold uppercase tracking-wide text-coral">Create account</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Start with Urben Solution</h1>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-cloud p-1">
          {['user', 'technician'].map((option) => (
            <button className={`rounded-md px-4 py-2 text-sm font-bold ${type === option ? 'bg-white text-coral shadow-sm' : 'text-zinc-600'}`} key={option} type="button" onClick={() => setType(option)}>
              {option === 'user' ? 'Customer' : 'Technician'}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className="input" name="name" placeholder="Full name" value={values.name} onChange={update} required />
          <input className="input" name="phone" placeholder="Phone" value={values.phone} onChange={update} required />
          <input className="input" type="email" name="email" placeholder="Email" value={values.email} onChange={update} required />
          <input className="input" type="password" name="password" placeholder="Password" value={values.password} onChange={update} required />
          {type === 'technician' && (
            <>
              <input className="input sm:col-span-2" name="skills" placeholder="Skills, comma separated" value={values.skills} onChange={update} required />
              <input className="input" type="number" name="experience" placeholder="Experience in years" value={values.experience} onChange={update} required />
              <input className="input" name="location" placeholder="Location" value={values.location} onChange={update} required />
              <label className="text-sm font-semibold text-zinc-600">
                Profile photo
                <input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, profilePhoto: e.target.files[0] })} />
              </label>
              <label className="text-sm font-semibold text-zinc-600">
                ID proof
                <input className="mt-2 block w-full text-sm" type="file" accept="image/*,.pdf" onChange={(e) => setFiles({ ...files, idProof: e.target.files[0] })} />
              </label>
            </>
          )}
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 w-full">Create account</button>
      </form>
    </section>
  );
}
