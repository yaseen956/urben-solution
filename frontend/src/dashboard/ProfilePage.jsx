import { useState } from 'react';
import api, { API_URL } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LocationInput, { composeAddress, geocodeTextAddress } from '../components/LocationInput.jsx';

const skillOptions = ['AC Repair', 'RO Repair', 'Cleaning', 'Electrician', 'Plumbing', 'Carpenter', 'Pest Control', 'Salon', 'Painting'];

export default function ProfilePage() {
  const { auth, setAuth } = useAuth();
  const [form, setForm] = useState({
    name: auth.profile.name || '',
    phone: auth.profile.phone || '',
    skills: Array.isArray(auth.profile.skills) ? auth.profile.skills : [],
    address: auth.profile.address || '',
    houseNumber: '',
    landmark: '',
    lat: auth.profile.location?.coordinates?.[1] || '',
    lng: auth.profile.location?.coordinates?.[0] || '',
    vehicleType: auth.profile.vehicleInfo?.type || '',
    vehicleNumber: auth.profile.vehicleInfo?.number || '',
    upiId: auth.profile.bankDetails?.upiId || ''
  });
  const [files, setFiles] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const toggleSkill = (skill) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skill) ? current.skills.filter((item) => item !== skill) : [...current.skills, skill]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    let submitForm = form;
    if (form.address.trim() && (!Number.isFinite(Number(form.lat)) || !Number.isFinite(Number(form.lng)))) {
      const geocoded = await geocodeTextAddress(form.address);
      if (geocoded) {
        submitForm = { ...form, ...geocoded };
        setForm(submitForm);
      }
    }
    if (!submitForm.address.trim()) {
      setError('Address is required.');
      return;
    }
    if (!Number.isFinite(Number(submitForm.lat)) || !Number.isFinite(Number(submitForm.lng))) {
      setError('Enter a valid address or use current location before saving profile.');
      return;
    }
    if (submitForm.skills.length === 0) {
      setError('Select at least one skill.');
      return;
    }
    const formData = new FormData();
    formData.append('name', submitForm.name);
    formData.append('phone', submitForm.phone);
    formData.append('skills', submitForm.skills.join(','));
    formData.append('address', composeAddress(submitForm));
    formData.append('lat', submitForm.lat);
    formData.append('lng', submitForm.lng);
    formData.append('vehicleInfo', JSON.stringify({ type: submitForm.vehicleType, number: submitForm.vehicleNumber }));
    formData.append('bankDetails', JSON.stringify({ upiId: submitForm.upiId }));
    if (files.dl) formData.append('dl', files.dl);
    if (files.idProof) formData.append('idProof', files.idProof);

    const { data } = await api.put('/technician/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setAuth({ ...auth, profile: data.technician });
    setNotice('Profile updated.');
  };

  const documentUrl = (path) => (path?.startsWith('/uploads') ? `${API_URL}${path}` : path);

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-black text-ink">Profile and documents</h2>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <input className="input" name="name" value={form.name} onChange={update} placeholder="Name" />
        <input className="input" name="phone" value={form.phone} onChange={update} placeholder="Phone" />
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-zinc-600">Select skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skillOptions.map((skill) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm font-bold ${form.skills.includes(skill) ? 'border-coral bg-coral text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <LocationInput label="Technician address" value={form} onChange={setForm} />
        </div>
        <input className="input" name="vehicleType" value={form.vehicleType} onChange={update} placeholder="Vehicle type" />
        <input className="input" name="vehicleNumber" value={form.vehicleNumber} onChange={update} placeholder="Vehicle number" />
        <input className="input" name="upiId" value={form.upiId} onChange={update} placeholder="UPI ID" />
        <label className="text-sm font-semibold text-zinc-600">
          Driving license
          <input className="mt-2 block w-full text-sm" type="file" accept="image/*,.pdf" onChange={(event) => setFiles({ ...files, dl: event.target.files[0] })} />
        </label>
        <label className="text-sm font-semibold text-zinc-600">
          ID proof
          <input className="mt-2 block w-full text-sm" type="file" accept="image/*,.pdf" onChange={(event) => setFiles({ ...files, idProof: event.target.files[0] })} />
        </label>
        <button className="btn-primary sm:col-span-2">Save profile</button>
      </form>
      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        {auth.profile.documents?.dl && <a className="font-bold text-coral" href={documentUrl(auth.profile.documents.dl)} target="_blank" rel="noreferrer">View DL</a>}
        {auth.profile.documents?.idProof && <a className="font-bold text-coral" href={documentUrl(auth.profile.documents.idProof)} target="_blank" rel="noreferrer">View ID proof</a>}
      </div>
    </section>
  );
}
