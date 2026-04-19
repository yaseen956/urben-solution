import { useState } from 'react';
import api from '../services/api.js';

export default function Support({ activeJob }) {
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (type) => {
    const text = message || (type === 'emergency' ? 'Emergency assistance requested' : 'Support requested');
    await api.post('/support/ticket', { bookingId: activeJob?._id, message: text, type });
    setNotice(type === 'emergency' ? 'Emergency alert sent.' : 'Support ticket created.');
    setMessage('');
  };

  return (
    <section className="panel p-5">
      <h2 className="text-xl font-black text-ink">Support and safety</h2>
      <p className="mt-2 text-sm text-zinc-600">Get help, report a service issue, or review emergency guidance.</p>
      <textarea className="input mt-5 min-h-24" placeholder="Describe the issue" value={message} onChange={(event) => setMessage(event.target.value)} />
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <a className="btn-secondary text-center" href="tel:+919000000000">
          Call support
        </a>
        <button className="btn-secondary" onClick={() => submit('chat')}>
          Chat
        </button>
        <button className="btn-primary" onClick={() => submit('issue')}>
          Report Issue
        </button>
        <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => submit('emergency')}>
          Emergency
        </button>
      </div>
      {notice && <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      <div className="mt-6 rounded-lg bg-cloud p-4 text-sm text-zinc-600">
        <p className="font-black text-ink">Safety and insurance</p>
        <p className="mt-2">Verified technicians are covered for platform-assigned jobs. Keep service conversations in-app and contact support for disputes, damage claims, or unsafe conditions.</p>
      </div>
    </section>
  );
}
