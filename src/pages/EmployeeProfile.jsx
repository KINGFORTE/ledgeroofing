import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Award, Briefcase, Building2, CheckCircle2, Clock,
  LoaderCircle, Mail, MapPin, MessageSquare, Pencil, Phone, Plus, Shield,
  Sparkles, Upload, UserRound, X,
} from 'lucide-react';
import { API_BASE, apiRequest } from '../utils/api';
import {
  ACHIEVEMENT_TYPES, AVAILABILITY_OPTIONS, PREFERRED_CONTACT_OPTIONS, achievementLabel,
  availabilityLabel, availabilityTone, employmentLabel, formatJoined, initialsFor, preferredContactLabel,
} from '../utils/staffProfile';
import './staff-dashboard.css';

const API_ORIGIN = API_BASE.replace(/\/api$/, '');

function imageUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${API_ORIGIN}${value}`;
  return value.startsWith('/api/') ? `${API_ORIGIN}${value}` : value;
}

function listToText(items) {
  return Array.isArray(items) ? items.join(', ') : '';
}

function textToList(value) {
  return String(value || '').split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

function statusDot(value) {
  return {
    available: 'bg-green-500', busy: 'bg-red-500', away: 'bg-amber-500',
    dnd: 'bg-slate-700', offline: 'bg-slate-300',
  }[value] || 'bg-slate-300';
}

function Avatar({ profile, size = 'h-24 w-24', online = false, ring = true }) {
  const initials = initialsFor(profile.preferredName || profile.name);
  return <div className={`relative ${size} shrink-0`}>
    <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-green-100 text-xl font-bold text-green-800 ${ring ? 'ring-4 ring-white shadow-lg' : ''}`}>
      {profile.avatarUrl ? <img crossOrigin="use-credentials" src={imageUrl(profile.avatarUrl)} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
    {online && <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" title="Online now" />}
  </div>;
}

function Section({ title, subtitle, icon: Icon, action, children }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        {Icon && <span className="rounded-xl bg-green-50 p-2 text-green-700"><Icon className="h-4 w-4" /></span>}
        <div><h3 className="font-display text-base font-bold text-slate-900">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}</div>
      </div>
      {action}
    </div>
    <div className="px-5 py-5 sm:px-6">{children}</div>
  </section>;
}

function ChipList({ items, empty = 'Nothing added yet.' }) {
  if (!items?.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return <div className="flex flex-wrap gap-2">{items.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{item}</span>)}</div>;
}

function InfoRow({ label, value, icon: Icon }) {
  return <div className="flex items-start gap-3 py-2.5">
    {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-0.5 break-words text-sm font-semibold text-slate-700">{value || '—'}</p></div>
  </div>;
}

function MiniList({ title, items, render, empty }) {
  return <div>
    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
    {!items?.length ? <p className="text-sm text-slate-400">{empty}</p> : <div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700">{render(item)}</div>)}</div>}
  </div>;
}

function ProfileView({ data, online = false, onEdit, onMessage, onAchievementChange }) {
  const navigate = useNavigate();
  const [emailVisible, setEmailVisible] = useState(false);
  const profile = data.profile;
  const achievements = data.achievements || [];
  const work = data.work || {};
  const canAddAchievement = Boolean(profile.canEdit || profile.canManage);

  const workSections = useMemo(() => [
    { title: 'Project posts', items: work.projects, empty: 'No published project posts by this employee yet.', render: (item) => <><p className="font-bold text-slate-800">{item.title}</p>{item.excerpt && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.excerpt}</p>}</> },
    { title: 'Current responsibilities', items: work.responsibilities, empty: work.tasksRestricted ? 'Task details are private to the employee and managers.' : 'No open assigned tasks yet.', render: (item) => <><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-xs capitalize text-slate-500">{String(item.status).replaceAll('_', ' ')}{item.due_at ? ` · Due ${new Date(item.due_at).toLocaleDateString()}` : ''}</p></> },
    { title: 'Upcoming deadlines', items: work.upcomingTasks, empty: work.tasksRestricted ? 'Task details are private to the employee and managers.' : 'No task deadlines in the next 30 days.', render: (item) => <><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-xs text-slate-500">Due {new Date(item.due_at).toLocaleDateString()}</p></> },
    { title: 'Recently completed', items: work.completedTasks, empty: work.tasksRestricted ? 'Task details are private to the employee and managers.' : 'No completed tasks recorded yet.', render: (item) => <><p className="font-bold text-slate-800">{item.title}</p><p className="mt-1 text-xs text-slate-500">Completed {new Date(item.updated_at).toLocaleDateString()}</p></> },
    { title: 'Recent work updates', items: work.recentUpdates, empty: 'No recent notes or updates yet.', render: (item) => <><p className="line-clamp-2">{item.body}</p><p className="mt-1 text-xs text-slate-500">{item.kind === 'task_comment' ? `Comment on ${item.taskTitle}` : 'Team note'} · {new Date(item.createdAt).toLocaleDateString()}</p></> },
  ], [work]);

  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-36 bg-gradient-to-br from-green-700 via-emerald-600 to-slate-800 sm:h-44">
        {profile.coverUrl && <img crossOrigin="use-credentials" src={imageUrl(profile.coverUrl)} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent" />
        <div className="absolute left-5 top-4 sm:left-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Employee workspace</p></div>
      </div>
      <div className="relative px-5 pb-6 sm:px-8">
        <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar profile={profile} online={online} />
            <div className="pb-1">
              <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{profile.name}</h1>
              {profile.preferredName && profile.preferredName !== profile.name && <p className="text-sm text-slate-500">Preferred name: {profile.preferredName}</p>}
              <p className="mt-1 text-sm font-semibold text-green-700">{[profile.jobTitle, profile.department].filter(Boolean).join(' · ') || 'Team member'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.canEdit && <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-green-300 hover:text-green-700"><Pencil className="h-3.5 w-3.5" />Edit profile</button>}
            {!profile.canEdit && profile.id && onMessage && <button onClick={() => onMessage(profile.id)} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-700"><MessageSquare className="h-3.5 w-3.5" />Send message</button>}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${availabilityTone(profile.availabilityStatus)}`}><span className={`h-2 w-2 rounded-full ${statusDot(profile.availabilityStatus)}`} />{availabilityLabel(profile.availabilityStatus)}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{employmentLabel(profile.employmentStatus)}</span>
          {profile.employeeId && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">ID {profile.employeeId}</span>}
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Joined {formatJoined(profile.dateJoined)}</span>
          {online && <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">Online now</span>}
        </div>
      </div>
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <Section title="About me" subtitle="Professional background and expertise" icon={UserRound}>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{profile.bio || 'No professional biography added yet.'}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Skills & expertise</p><ChipList items={profile.skills} empty="No skills listed yet." /></div>
            <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Qualifications</p><ChipList items={profile.qualifications} empty="No qualifications listed yet." /></div>
            <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Languages</p><ChipList items={profile.languages} empty="No languages listed yet." /></div>
            <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Areas of interest</p><ChipList items={profile.interests} empty="No interests listed yet." /></div>
          </div>
          <div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Professional experience</p><ChipList items={profile.experience} empty="No experience entries added yet." /></div>
        </Section>

        <Section title="Work & projects" subtitle="Information recorded in the workspace" icon={Briefcase}>
          <div className="grid gap-5 sm:grid-cols-2">
            {workSections.map((section) => <MiniList key={section.title} {...section} />)}
          </div>
        </Section>

        <Section
          title="Achievements & recognition"
          subtitle="Milestones, training and official recognition"
          icon={Award}
          action={canAddAchievement ? <button onClick={onAchievementChange} className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"><Plus className="h-3.5 w-3.5" />Add</button> : null}
        >
          {!achievements.length ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-sm text-slate-500">No achievements recorded yet.</p></div> : <div className="relative space-y-4 border-l border-slate-200 pl-5">
            {achievements.map((item) => <div key={item.id} className="relative">
              <span className="absolute -left-[1.6rem] top-4 h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow" />
              <article className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{item.title}</p><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-green-700">{achievementLabel(item.type)}</span></div>
                {item.description && <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>}
                <p className="mt-2 text-[11px] text-slate-400">{item.occurredOn ? new Date(`${item.occurredOn}T00:00:00`).toLocaleDateString() : 'Date not set'} · Added by {item.createdByName}</p>
              </article>
            </div>)}
          </div>}
        </Section>
      </div>

      <aside className="space-y-6">
        <Section title="Contact information" subtitle="Work details only" icon={Mail}>
          <div className="divide-y divide-slate-100">
            <InfoRow icon={Mail} label="Work email" value={emailVisible ? profile.email : 'Hidden'} />
            <InfoRow icon={Phone} label="Work phone" value={profile.workPhone || 'Not provided'} />
            <InfoRow icon={Building2} label="Department" value={profile.department || 'Not provided'} />
            <InfoRow icon={MapPin} label="Office location" value={profile.officeLocation || 'Not provided'} />
            <InfoRow icon={Clock} label="Working hours" value={profile.workingHours || 'Not provided'} />
            <InfoRow icon={MessageSquare} label="Preferred contact" value={preferredContactLabel(profile.preferredContact)} />
          </div>
          <div className="mt-4 grid gap-2">
            <button onClick={() => setEmailVisible((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-green-300 hover:text-green-700">{emailVisible ? 'Hide email address' : 'View email address'}</button>
            {!profile.canEdit && onMessage && <button onClick={() => onMessage(profile.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"><MessageSquare className="h-3.5 w-3.5" />Send message</button>}
            {profile.department && <button onClick={() => navigate(`/staff/people?department=${encodeURIComponent(profile.department)}`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-green-300 hover:text-green-700"><Building2 className="h-3.5 w-3.5" />View department</button>}
          </div>
        </Section>

        <Section title="Quick facts" icon={Shield}>
          <div className="divide-y divide-slate-100">
            <InfoRow label="Employee ID" value={profile.employeeId || '—'} />
            <InfoRow label="Role" value={profile.role} />
            <InfoRow label="Employment status" value={employmentLabel(profile.employmentStatus)} />
            <InfoRow label="Availability" value={availabilityLabel(profile.availabilityStatus)} />
            <InfoRow label="Date joined" value={formatJoined(profile.dateJoined)} />
          </div>
        </Section>
      </aside>
    </div>
  </div>;
}

function ProfileEditor({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: profile.name,
    preferredName: profile.preferredName || '',
    bio: profile.bio || '',
    workPhone: profile.workPhone || '',
    officeLocation: profile.officeLocation || '',
    workingHours: profile.workingHours || '',
    preferredContact: profile.preferredContact || 'message',
    availabilityStatus: profile.availabilityStatus || 'available',
    skills: listToText(profile.skills),
    qualifications: listToText(profile.qualifications),
    languages: listToText(profile.languages),
    interests: listToText(profile.interests),
    experience: listToText(profile.experience),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest('/workspace/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          skills: textToList(form.skills),
          qualifications: textToList(form.qualifications),
          languages: textToList(form.languages),
          interests: textToList(form.interests),
          experience: textToList(form.experience),
        }),
      });
      setNotice('Profile saved.');
      onSaved(result.profile);
    } catch (requestError) {
      setError(requestError.message || 'Could not save your profile.');
    } finally { setBusy(false); }
  }

  async function upload(kind, file) {
    if (!file) return;
    setBusy(true); setError(''); setNotice('');
    const body = new FormData();
    body.append(kind, file);
    try {
      const result = await apiRequest(`/workspace/profile/${kind}`, { method: 'POST', body });
      setNotice(kind === 'avatar' ? 'Profile photo updated.' : 'Cover image updated.');
      onSaved(result.profile);
    } catch (requestError) {
      setError(requestError.message || 'Could not upload that image.');
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4" onClick={onClose}>
    <div className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-display text-lg font-bold text-slate-900">Edit profile</h2><p className="text-xs text-slate-500">Professional details are visible to workspace colleagues.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button></div>
      <form onSubmit={save} className="space-y-5 px-5 py-5 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-bold text-slate-600 hover:border-green-400 hover:text-green-700"><Upload className="h-4 w-4" />Profile photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => upload('avatar', event.target.files?.[0])} /></label>
          <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-bold text-slate-600 hover:border-green-400 hover:text-green-700"><Upload className="h-4 w-4" />Cover image<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => upload('cover', event.target.files?.[0])} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">Full name<input value={form.name} maxLength={80} onChange={(event) => update('name', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Preferred name<input value={form.preferredName} maxLength={60} onChange={(event) => update('preferredName', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        </div>
        <label className="block text-xs font-bold text-slate-600">Professional biography<textarea value={form.bio} maxLength={1500} rows={4} onChange={(event) => update('bio', event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /><span className="mt-1 block text-right text-[10px] text-slate-400">{form.bio.length}/1500</span></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">Work phone<input value={form.workPhone} maxLength={40} onChange={(event) => update('workPhone', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Office location<input value={form.officeLocation} maxLength={120} onChange={(event) => update('officeLocation', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Working hours<input value={form.workingHours} maxLength={120} onChange={(event) => update('workingHours', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Preferred contact<select value={form.preferredContact} onChange={(event) => update('preferredContact', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal">{PREFERRED_CONTACT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>
        <label className="block text-xs font-bold text-slate-600">Availability<select value={form.availabilityStatus} onChange={(event) => update('availabilityStatus', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal">{AVAILABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          {[['skills', 'Skills & expertise'], ['qualifications', 'Qualifications'], ['languages', 'Languages'], ['interests', 'Areas of interest'], ['experience', 'Professional experience']].map(([key, label]) => <label key={key} className="text-xs font-bold text-slate-600">{label}<textarea rows={2} value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder="Separate entries with commas" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>)}
        </div>
        {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{error}</p>}
        {notice && <p role="status" className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-800"><CheckCircle2 className="h-4 w-4" />{notice}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Save changes</button></div>
      </form>
    </div>
  </div>;
}

function AchievementDialog({ profile, onClose, onSaved }) {
  const types = profile.canManage ? ACHIEVEMENT_TYPES : ACHIEVEMENT_TYPES.filter((option) => ['training', 'certification'].includes(option.value));
  const [form, setForm] = useState({ type: types[0]?.value || 'certification', title: '', description: '', occurredOn: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await apiRequest('/workspace/profile/achievements', {
        method: 'POST',
        body: JSON.stringify({ ...form, userId: profile.id, occurredOn: form.occurredOn || null }),
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message || 'Could not add this achievement.');
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
    <form onSubmit={save} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-slate-900">Add recognition</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button></div>
      <div className="mt-5 space-y-3">
        <label className="block text-xs font-bold text-slate-600">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal">{types.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="block text-xs font-bold text-slate-600">Title<input required maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="block text-xs font-bold text-slate-600">Details<textarea rows={3} maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="block text-xs font-bold text-slate-600">Date<input type="date" value={form.occurredOn} onChange={(event) => setForm({ ...form, occurredOn: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}Add achievement</button></div>
    </form>
  </div>;
}

function useProfile(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { setData(await apiRequest(endpoint)); }
    catch (requestError) { setError(requestError.message || 'Could not load this profile.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [endpoint]);
  return { data, setData, loading, error, reload: load };
}

export function ProfilePage({ user, onUpdated, onlineMembers = [] }) {
  const { data, setData, loading, error, reload } = useProfile('/workspace/profile');
  const [editing, setEditing] = useState(false);
  const [addingAchievement, setAddingAchievement] = useState(false);

  if (loading) return <div className="flex min-h-[20rem] items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading your profile…</div>;
  if (error || !data) return <div className="mx-auto max-w-2xl px-4 py-10"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error || 'Profile unavailable.'}</p><button onClick={reload} className="mt-3 text-xs font-bold text-green-700">Try again</button></div>;

  return <>
    <ProfileView
      data={data}
      online={onlineMembers.some((member) => member.userId === user.id)}
      onEdit={() => setEditing(true)}
      onAchievementChange={() => setAddingAchievement(true)}
    />
    {editing && <ProfileEditor profile={data.profile} onClose={() => setEditing(false)} onSaved={(updated) => {
      setData((current) => ({ ...current, profile: { ...current.profile, ...updated } }));
      onUpdated?.({ ...user, ...updated, mustChangePassword: user.mustChangePassword });
    }} />}
    {addingAchievement && <AchievementDialog profile={data.profile} onClose={() => setAddingAchievement(false)} onSaved={() => { setAddingAchievement(false); void reload(); }} />}
  </>;
}

export function EmployeeProfilePage({ userId, onMessage, onlineMembers = [] }) {
  const { data, loading, error, reload } = useProfile(`/workspace/profile/${userId}`);
  const [addingAchievement, setAddingAchievement] = useState(false);

  if (loading) return <div className="flex min-h-[20rem] items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading employee workspace…</div>;
  if (error || !data) return <div className="mx-auto max-w-2xl px-4 py-10"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error || 'Profile unavailable.'}</p><button onClick={reload} className="mt-3 text-xs font-bold text-green-700">Try again</button></div>;

  return <>
    <ProfileView
      data={data}
      online={onlineMembers.some((member) => member.userId === userId)}
      onMessage={onMessage}
      onAchievementChange={() => setAddingAchievement(true)}
    />
    {addingAchievement && <AchievementDialog profile={data.profile} onClose={() => setAddingAchievement(false)} onSaved={() => { setAddingAchievement(false); void reload(); }} />}
  </>;
}
