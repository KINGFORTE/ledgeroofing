import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoaderCircle, Video } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { LOGO } from '../utils/constants';
import { MeetingRoom } from './StaffFeatures';

export default function GuestMeeting() {
  const { token } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiRequest(`/workspace/meetings/guest/${encodeURIComponent(token)}`)
      .then((result) => { if (alive) setMeeting(result.meeting); })
      .catch((e) => { if (alive) setError(e.message || 'This meeting link is not available.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#08110d] text-white"><div className="flex flex-col items-center gap-4 text-sm text-white/70"><img src={LOGO} alt="Ledge Roofing" className="h-14 w-14 rounded-xl bg-white/10 object-contain p-1.5" /><div className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin" />Loading meeting…</div></div></div>;
  }

  if (error || !meeting) {
    return <div className="flex min-h-screen items-center justify-center bg-[#08110d] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <img src={LOGO} alt="Ledge Roofing" className="mx-auto h-14 w-14 rounded-xl bg-white/10 object-contain p-1.5" />
        <h1 className="mt-4 font-display text-xl font-bold">Meeting unavailable</h1>
        <p className="mt-2 text-sm text-white/60">{error || 'This meeting link is not available.'}</p>
      </div>
    </div>;
  }

  if (joined) {
    const guestUser = { id: `guest-local-${token}`, name: name.trim(), guestRole: role.trim() || 'Guest', role: 'guest', avatarUrl: null };
    return <MeetingRoom
      meeting={{ id: meeting.id, title: meeting.title }}
      user={guestUser}
      guestToken={token}
      canEnd={false}
      onClose={() => { setJoined(false); }}
      onEnd={() => {}}
    />;
  }

  return <div className="flex min-h-screen items-center justify-center bg-[#08110d] px-6 py-12 text-white">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-4">
        <img src={LOGO} alt="Ledge Roofing" className="h-12 w-12 rounded-xl bg-white/10 object-contain p-1.5 ring-1 ring-white/10" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-400">Ledge Roofing Meeting</p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight">{meeting.title}</h1>
        </div>
      </div>
      {meeting.description && <p className="mt-4 text-sm text-white/65">{meeting.description}</p>}
      <p className="mt-3 text-xs text-white/45">Hosted by {meeting.hostName}{meeting.startsAt ? ` · ${new Date(meeting.startsAt).toLocaleString()}` : ''}</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim()) setJoined(true); }}>
        <label className="block text-xs font-bold text-white/70">
          Your name
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-green-400 focus:outline-none"
          />
        </label>
        <label className="block text-xs font-bold text-white/70">
          Your role <span className="font-normal text-white/40">(optional)</span>
          <input
            maxLength={80}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Client, Contractor, Project Manager"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-green-400 focus:outline-none"
          />
        </label>
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-500">
          <Video className="h-4 w-4" />Continue to meeting
        </button>
        <p className="text-center text-[11px] text-white/40">Camera and microphone stay off until you choose to turn them on.</p>
      </form>
    </div>
  </div>;
}
