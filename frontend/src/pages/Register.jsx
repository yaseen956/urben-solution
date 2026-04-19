import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LocationInput, { composeAddress, geocodeTextAddress } from '../components/LocationInput.jsx';

const skillOptions = ['AC Repair', 'RO Repair', 'Cleaning', 'Electrician', 'Plumbing', 'Carpenter', 'Pest Control', 'Salon', 'Painting'];

export default function Register() {
  const [type, setType] = useState('user');
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: [],
    experience: '',
    address: '',
    houseNumber: '',
    landmark: '',
    lat: '',
    lng: ''
  });
  const [files, setFiles] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const toggleSkill = (skill) => {
    setValues((current) => ({
      ...current,
      skills: current.skills.includes(skill) ? current.skills.filter((item) => item !== skill) : [...current.skills, skill]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (type === 'technician') {
        let submitValues = values;
        if (values.address.trim() && (!Number.isFinite(Number(values.lat)) || !Number.isFinite(Number(values.lng)))) {
          const geocoded = await geocodeTextAddress(values.address);
          if (geocoded) {
            submitValues = { ...values, ...geocoded };
            setValues(submitValues);
          }
        }
        if (!submitValues.address.trim()) {
          setError('Technician address is required.');
          return;
        }
        if (!Number.isFinite(Number(submitValues.lat)) || !Number.isFinite(Number(submitValues.lng))) {
          setError('Enter a valid address or use current location so your service radius can be verified.');
          return;
        }
        if (submitValues.skills.length === 0) {
          setError('Select at least one technician skill.');
          return;
        }
        const formData = new FormData();
        Object.entries({ ...submitValues, address: composeAddress(submitValues) }).forEach(([key, value]) => {
          formData.append(key, Array.isArray(value) ? value.join(',') : value);
        });
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
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-zinc-600">Select skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-sm font-bold ${values.skills.includes(skill) ? 'border-coral bg-coral text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <input className="input" type="number" name="experience" placeholder="Experience in years" value={values.experience} onChange={update} required />
              <div className="sm:col-span-2">
                <LocationInput label="Technician address" value={values} onChange={setValues} />
              </div>
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
