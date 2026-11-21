import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import { apiRequest } from '../utils/api';
import { API_BASE } from '../utils/api';
import { LOGO } from '../utils/constants';
import { WatchCountdown } from '@/components/animated-countdown/watch-countdown';
import { CalendarDays, Camera, Check, ChevronLeft, ChevronRight, Clock3, Copy, ImagePlus, Link2, LoaderCircle, Mail, Mic, MicOff, Plus, Radio, ScreenShare, ScreenShareOff, Send, UserRound, Video, VideoOff, X } from 'lucide-react';

const API_ORIGIN = API_BASE.replace(/\/api$/, '');
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const PRIORITY_LABEL = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
const localDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export function TasksPage({ user }) {
  const isManager = user.role === 'owner' || user.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ title: '', description: '', priority: 'normal', dueAt: '' });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const requests = [apiRequest('/workspace/tasks')];
    if (isManager) requests.push(apiRequest('/workspace/staff'));
    const [taskResult, staffResult] = await Promise.all(requests);
    setTasks(taskResult.tasks);
    setStaff(staffResult?.staff || []);
  }, [isManager]);

  useEffect(() => {
    load().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
    const socket = io(API_ORIGIN, { withCredentials: true });
    socket.on('task:updated', () => load().catch((requestError) => setError(requestError.message)));
    return () => socket.disconnect();
  }, [load]);

  async function createTask(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/workspace/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: draft.title, description: draft.description, priority: draft.priority, dueAt: draft.dueAt || null, ...(isManager ? {} : { assignedTo: user.id }) }),
      });
      setDraft({ title: '', description: '', priority: 'normal', dueAt: '' });
      await load();
      setNotice(isManager ? 'Task created.' : 'Task created for you. When it’s ready, request admin approval to mark it complete.');
    } catch (requestError) {
      setError(requestError.message);
    } finally { setBusy(false); }
  }

  async function updateTask(task, changes, successMessage = '') {
    setError('');
    setNotice('');
    try {
      const result = await apiRequest(`/workspace/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      setTasks((items) => items.map((item) => item.id === task.id ? result.task : item));
      if (successMessage) setNotice(successMessage);
    } catch (requestError) { setError(requestError.message); }
  }

  const ownTasks = tasks.filter((task) => task.assigned_to === user.id || task.created_by === user.id);
  const overdue = (task) => task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done';
  const pendingApproval = tasks.filter((task) => task.status === 'approval_requested').length;

  return <div className="tasks-page space-y-6">
    <div className={`grid gap-3 ${isManager ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
      {(isManager ? [
        ['All tasks', tasks.length, 'Visible to admins'],
        ['Pending approval', pendingApproval, 'Waiting for admin review'],
        ['Overdue', tasks.filter(overdue).length, 'Needs attention now'],
        ['Completed', tasks.filter((t) => t.status === 'done').length, 'Approved and done'],
      ] : [
        ['My tasks', ownTasks.length, 'Tasks you can see'],
        ['In progress', ownTasks.filter((t) => t.status === 'in_progress' || t.status === 'todo').length, 'Still on your plate'],
        ['Awaiting approval', ownTasks.filter((t) => t.status === 'approval_requested').length, 'Sent to admin'],
      ]).map(([label, value, hint]) => (
        <div key={label} className="tasks-stat-card rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
      ))}
    </div>

    <section className="tasks-panel rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-700" /><h2 className="font-display text-lg font-bold text-slate-900">Create a task</h2></div>
          <p className="mt-1 text-sm text-slate-500">{isManager ? 'Create and track team tasks. You can review and approve completion requests.' : 'Create a task for yourself. Only you and admins can see it, and an admin must approve it when you finish.'}</p>
        </div>
      </div>
      <form onSubmit={createTask} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">Task title
          <input required maxLength={180} placeholder="What needs to get done?" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-green-500" />
        </label>
        {isManager ? <label className="block text-sm font-semibold text-slate-700">Assign to
          <select value={draft.assignedTo || ''} onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">Unassigned</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name} — {member.email}</option>)}</select>
        </label> : <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"><p className="font-semibold">Assigned to you</p><p className="mt-1 text-xs text-green-800">You can create tasks for yourself only. Other staff cannot see your task or timer.</p></div>}
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">Description
          <textarea rows={3} maxLength={5000} placeholder="Add context, links, or steps..." value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-green-500" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">Priority
            <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Due date & time
            <input type="datetime-local" value={draft.dueAt} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2 border-t border-slate-100 pt-4">
          <div className="min-h-[1.25rem] text-sm">{error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status" className="text-green-700">{notice}</p>}</div>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}Create task</button>
        </div>
      </form>
    </section>

    <section className="tasks-panel overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">Juice countdown board</h2>
        <p className="mt-1 text-sm text-slate-500">{isManager ? 'View all staff tasks, monitor countdowns, and approve completion requests.' : 'Track your own tasks and timers. When finished, send a completion approval request to an admin.'}</p>
      </div>
      {loading ? <div className="p-8 text-sm text-slate-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading tasks…</div> : !tasks.length ? <p className="p-10 text-center text-sm text-slate-500">{isManager ? 'No tasks yet.' : 'No tasks yet. Create one for yourself above.'}</p> : <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">{tasks.map((task) => {
        const dueMs = task.due_at ? new Date(task.due_at).getTime() : null;
        const createdMs = task.created_at ? new Date(task.created_at).getTime() : null;
        const hasWindow = dueMs && createdMs && dueMs > createdMs;
        const remainingMs = dueMs ? dueMs - now : 0;
        const elapsedFraction = hasWindow ? Math.min(1, Math.max(0, (now - createdMs) / (dueMs - createdMs))) : 0;
        const juice = hasWindow ? 1 - elapsedFraction : 0;
        const quarter = !hasWindow ? 0 : elapsedFraction >= 1 ? 4 : Math.floor(elapsedFraction * 4) + 1;
        const done = task.status === 'done';
        const approvalRequested = task.status === 'approval_requested';
        const isOwner = task.assigned_to === user.id || task.created_by === user.id;
        const quarterCaptions = {
          0: 'No due date yet — set one so the juice can flow. Stuck already? Always remember to ask for help!',
          1: 'Quarter 1 — juice tank is full and you look unstoppable. If you get stuck, always remember to ask for help!',
          2: 'Quarter 2 — halfway there! The clock is cheering (probably). Always remember to ask for help if you need it.',
          3: 'Quarter 3 — final stretch! Sprint like your coffee depends on it. Always remember to ask for help.',
          4: 'Quarter 4 — time\'s up! The juice ran out, but you haven\'t. Always remember to ask for help and finish strong.',
        };
        const juiceColor = done ? 'bg-emerald-400' : remainingMs <= 0 ? 'bg-red-500' : juice > 0.5 ? 'bg-lime-400' : juice > 0.25 ? 'bg-amber-400' : 'bg-orange-500';
        const caption = done
          ? `Legendary work — "${task.title}" is approved and done! Celebrate responsibly. And always remember to ask for help on the next one.`
          : approvalRequested
            ? `Nice! "${task.title}" is waiting for admin approval. Grab some water, do a victory stretch, and always remember to ask for help if anything needs tweaking.`
            : !dueMs
              ? quarterCaptions[0]
              : `${quarterCaptions[quarter]} (${quarter}/4)`;
        const timerTitle = done ? 'Mission complete' : approvalRequested ? 'Awaiting admin approval' : !dueMs ? 'Waiting for due date' : remainingMs <= 0 ? 'Juice depleted' : 'Juice countdown';
        const priorityTone = task.priority === 'urgent' ? 'task-priority-urgent' : task.priority === 'high' ? 'task-priority-high' : task.priority === 'low' ? 'task-priority-low' : 'task-priority-normal';
        return <article key={task.id} className={`task-juice-card ${done ? 'is-done' : ''} ${dueMs && remainingMs <= 0 && !done ? 'is-overdue' : ''} ${approvalRequested ? 'is-approval' : ''}`}>
          <div className="task-juice-card__header">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`task-pill task-priority ${priorityTone}`}>{PRIORITY_LABEL[task.priority] || 'Normal'}</span>
                <span className="task-pill task-status-pill">{timerTitle}</span>
                {approvalRequested && <span className="task-pill task-status-pill">Approval requested</span>}
              </div>
              <h3 className="mt-3 font-display text-xl font-bold sm:text-2xl">{task.title}</h3>
              {task.description && <p className="mt-2 text-sm leading-6 opacity-80">{task.description}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium opacity-80">
                <span>Assigned: {task.assignee_name || 'Unassigned'}</span>
                {isManager && <span>Created by {task.creator_name || 'Team'}</span>}
                <span>{dueMs ? `Due ${new Date(dueMs).toLocaleString()}` : 'No due date set'}</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-wrap gap-2 justify-end">
              {done ? <span className="task-done-badge inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"><Check className="h-4 w-4" />Approved & done</span>
                : approvalRequested && isManager ? <>
                    <button onClick={() => updateTask(task, { status: 'done' }, 'Task approved and marked as done.')} className="task-done-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"><Check className="h-4 w-4" />Approve</button>
                    <button onClick={() => updateTask(task, { status: 'in_progress' }, 'Task sent back for changes.')} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold hover:bg-white/25">Send back</button>
                  </>
                : approvalRequested ? <span className="task-waiting-badge rounded-xl px-3 py-2 text-xs font-semibold">Awaiting admin approval</span>
                : isOwner ? <button onClick={() => updateTask(task, { status: 'approval_requested' }, 'Completion approval request sent to admins.')} className="task-done-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"><Check className="h-4 w-4" />Request completion approval</button>
                : isManager ? <span className="task-waiting-badge rounded-xl px-3 py-2 text-xs font-semibold">Waiting for assignee update</span>
                : <span className="task-waiting-badge rounded-xl px-3 py-2 text-xs font-semibold">Not available</span>}
            </div>
          </div>

          <div className="task-juice-card__timer">
            {done ? <p className="font-display text-5xl font-black tracking-tight sm:text-6xl">DONE!</p> : dueMs ? <WatchCountdown to={dueMs} title={timerTitle} className="!w-full !max-w-[360px] !bg-transparent !px-0 !pb-0 !pt-0 !shadow-none dark:!shadow-none" /> : <div className="flex w-full max-w-[360px] flex-col items-center rounded-[30px] px-6 py-8 text-center"><span className="text-[13px] font-medium uppercase tracking-[0.16em] opacity-60">{timerTitle}</span><p className="mt-4 font-display text-4xl font-black tabular-nums tracking-tight opacity-80">--:--:--</p></div>}
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={caption} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="task-caption">{caption}</motion.p>
            </AnimatePresence>
          </div>

          <div className="task-juice-card__juice">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide opacity-90"><span>Time juice</span><span>{done ? '100% victory' : hasWindow ? `${Math.round(juice * 100)}% left` : 'No window'}</span></div>
            <div className="task-juice-track relative h-6 overflow-hidden rounded-full">
              <div className={`h-full rounded-full transition-[width] duration-700 ease-linear ${juiceColor}`} style={{ width: `${done ? 100 : hasWindow ? Math.max(remainingMs <= 0 ? 0 : 3, juice * 100) : 0}%` }} />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0.18)_70%,rgba(255,255,255,0)_100%)] opacity-30" />
              {hasWindow && [25, 50, 75].map((mark) => <span key={mark} className="absolute top-0 h-full w-px bg-white/35" style={{ left: `${100 - mark}%` }} />)}
            </div>
            <div className="mt-1 flex justify-between text-[10px] opacity-70"><span>Start</span><span>Q1</span><span>Q2</span><span>Q3</span><span>Due</span></div>
            <p className="mt-3 text-xs opacity-75">{isManager ? 'Admins can approve completion requests. ' : 'Only you and admins can see this task and its timer. '}Quarter reminders run every 25% of the task window. Always remember to ask for help.</p>
          </div>
        </article>; })}</div>}
    </section>
  </div>;
}

function AudioBars({ active = false, participantId = 'local', audioLevelsRef }) {
  const barsRef = useRef([]);
  useEffect(() => {
    let raf = 0;
    const bars = barsRef.current;
    const smooth = Array(7).fill(0.08);
    const tick = () => {
      const levels = audioLevelsRef?.current?.[participantId] || [];
      for (let i = 0; i < bars.length; i += 1) {
        const el = bars[i];
        if (!el) continue;
        const raw = Math.max(0.06, levels[i] || 0);
        smooth[i] += (raw - smooth[i]) * 0.25;
        const h = 4 + smooth[i] * 26;
        el.style.height = `${h.toFixed(1)}px`;
        el.style.opacity = String(0.35 + smooth[i] * 0.65);
        el.style.boxShadow = active && smooth[i] > 0.2 ? `0 0 ${6 + smooth[i] * 12}px rgba(74,222,128,${0.35 + smooth[i] * 0.45})` : 'none';
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active, participantId, audioLevelsRef]);
  return (
    <div className={`mt-3 flex h-7 items-end gap-0.5 ${active ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className="w-1 rounded-full bg-green-400 transition-[background-color] duration-150"
          style={{ height: '4px', opacity: 0.25 }}
        />
      ))}
    </div>
  );
}

export function MeetingRoom({ meeting, onClose, onEnd, canEnd, user, avatarById = {}, guestToken = '' }) {
  const localVideo = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef(new Map());
  const pendingCandidates = useRef(new Map());
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const displayStreamRef = useRef(null);
  const [remote, setRemote] = useState({});
  const [muted, setMuted] = useState(true);
  const [cameraOff, setCameraOff] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMic, setHasMic] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [sharingPeers, setSharingPeers] = useState({});
  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState({});
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const audioContextRef = useRef(null);
  const analysersRef = useRef(new Map());
  const audioLevelsRef = useRef({});

  const avatarSrc = (url) => url ? `${url.startsWith('http') ? '' : API_ORIGIN}${url}` : null;
  const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'LR';

  useEffect(() => {
    let disposed = false;
    let peerNames = {};
    let peerMeta = {};
    let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    const socket = io(API_ORIGIN, guestToken
      ? { withCredentials: true, auth: { guestToken, guestName: user?.name || 'Guest', guestRole: user?.guestRole || user?.role || 'Guest' } }
      : { withCredentials: true });
    socketRef.current = socket;

    const emitSignal = (targetUserId, signal) => socket.emit('meeting:signal', { meetingId: meeting.id, targetUserId, signal });
    const flushCandidates = async (userId, pc) => {
      const queue = pendingCandidates.current.get(userId) || [];
      pendingCandidates.current.delete(userId);
      for (const candidate of queue) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* stale ICE candidates can be ignored */ }
      }
    };
    const renegotiate = async (userId, pc) => {
      try {
        if (pc.signalingState !== 'stable') return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        emitSignal(userId, pc.localDescription.toJSON());
      } catch (e) { console.warn('Renegotiation failed:', e.message); }
    };
    const getPeer = (userId, displayName = 'Teammate', meta = {}) => {
      peerNames[userId] = displayName;
      peerMeta[userId] = { ...(peerMeta[userId] || {}), ...meta, name: displayName };
      let pc = peerConnections.current.get(userId);
      if (pc) {
        setRemote((items) => items[userId] ? ({ ...items, [userId]: { ...items[userId], name: displayName, avatarUrl: meta.avatarUrl ?? items[userId].avatarUrl, cameraOff: meta.cameraOff ?? items[userId].cameraOff, isGuest: meta.isGuest ?? items[userId].isGuest, guestRole: meta.guestRole ?? items[userId].guestRole } }) : items);
        return pc;
      }
      pc = new RTCPeerConnection({ iceServers });
      peerConnections.current.set(userId, pc);
      for (const track of localStreamRef.current?.getTracks() || []) pc.addTrack(track, localStreamRef.current);
      pc.onicecandidate = (event) => { if (event.candidate) emitSignal(userId, { type: 'candidate', candidate: event.candidate.toJSON() }); };
      pc.onnegotiationneeded = () => { renegotiate(userId, pc); };
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        if (event.track.kind === 'video') {
          event.track.onmute = () => setRemote((items) => items[userId] ? ({ ...items, [userId]: { ...items[userId], cameraOff: true } }) : items);
          event.track.onunmute = () => setRemote((items) => items[userId] ? ({ ...items, [userId]: { ...items[userId], cameraOff: false } }) : items);
        }
        const current = peerMeta[userId] || {};
        setRemote((items) => ({ ...items, [userId]: { name: peerNames[userId] || displayName, stream, avatarUrl: current.avatarUrl || meta.avatarUrl || avatarById[userId] || null, cameraOff: current.cameraOff ?? meta.cameraOff ?? false, isGuest: current.isGuest ?? meta.isGuest === true, guestRole: current.guestRole || meta.guestRole || '' } }));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close(); peerConnections.current.delete(userId);
          setRemote((items) => { const next = { ...items }; delete next[userId]; return next; });
        }
      };
      setRemote((items) => items[userId] ? items : ({
        ...items,
        [userId]: {
          name: displayName,
          stream: null,
          avatarUrl: meta.avatarUrl || avatarById[userId] || null,
          cameraOff: meta.cameraOff ?? true,
          isGuest: meta.isGuest === true,
          guestRole: meta.guestRole || '',
        },
      }));
      return pc;
    };

    async function start() {
      try {
        const iceUrl = guestToken
          ? `/workspace/meetings/guest/${encodeURIComponent(guestToken)}/ice-servers`
          : `/workspace/meetings/${meeting.id}/ice-servers`;
        const icePromise = apiRequest(iceUrl).then((r) => r.iceServers || iceServers).catch(() => iceServers);
        // Join without requesting camera/mic so anyone can access immediately (no permission prompt block).
        setHasCamera(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
        setHasMic(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
        setCameraOff(true);
        setMuted(true);

        socket.on('meeting:signal', async ({ from, signal }) => {
          try {
            const pc = getPeer(from.userId, from.name, { avatarUrl: from.avatarUrl || avatarById[from.userId] || null, isGuest: from.isGuest === true, guestRole: from.guestRole || '' });
            if (signal.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
              await flushCandidates(from.userId, pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              emitSignal(from.userId, pc.localDescription.toJSON());
            } else if (signal.type === 'answer') {
              if (pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                await flushCandidates(from.userId, pc);
              }
            } else if (signal.type === 'candidate' && signal.candidate) {
              if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
              else pendingCandidates.current.set(from.userId, [...(pendingCandidates.current.get(from.userId) || []), signal.candidate]);
            }
          } catch (signalError) { console.warn('WebRTC signaling error:', signalError.message); }
        });
        socket.on('meeting:peer-joined', ({ userId, name, avatarUrl, cameraOff: peerCameraOff, isGuest, guestRole }) => {
          peerNames[userId] = name;
          peerMeta[userId] = { ...(peerMeta[userId] || {}), name, avatarUrl: avatarUrl || avatarById[userId] || null, cameraOff: peerCameraOff === true, isGuest: isGuest === true, guestRole: guestRole || '' };
          setStatus(`${name} joined`);
          setRemote((items) => ({
            ...items,
            [userId]: {
              ...(items[userId] || { stream: null }),
              name,
              avatarUrl: avatarUrl || avatarById[userId] || null,
              cameraOff: peerCameraOff === true,
              isGuest: isGuest === true,
              guestRole: guestRole || '',
            },
          }));
        });
        socket.on('meeting:peer-left', ({ userId }) => {
          peerConnections.current.get(userId)?.close(); peerConnections.current.delete(userId);
          delete peerNames[userId]; delete peerMeta[userId];
          setRemote((items) => { const next = { ...items }; delete next[userId]; return next; });
          setSharingPeers((items) => { const next = { ...items }; delete next[userId]; return next; });
        });
        socket.on('meeting:screen-share', ({ userId, sharing }) => setSharingPeers((items) => ({ ...items, [userId]: sharing })));
        socket.on('meeting:camera-state', ({ userId, cameraOff: peerCameraOff }) => {
          peerMeta[userId] = { ...(peerMeta[userId] || {}), cameraOff: peerCameraOff === true };
          setRemote((items) => items[userId] ? ({ ...items, [userId]: { ...items[userId], cameraOff: peerCameraOff === true } }) : items);
        });
        socket.on('meeting:ended', () => { setStatus('Meeting ended by host.'); window.setTimeout(onClose, 800); });

        const connectPromise = new Promise((resolve, reject) => {
          socket.once('connect', resolve);
          socket.once('connect_error', reject);
          if (socket.connected) resolve();
        });
        const [nextIceServers] = await Promise.all([icePromise, connectPromise]);
        iceServers = nextIceServers || iceServers;

        const joined = await new Promise((resolve) => socket.emit('meeting:join', { meetingId: meeting.id }, resolve));
        if (!joined?.ok) throw new Error(joined?.error || 'Could not join the meeting.');
        for (const peer of (joined.peers || [])) {
          peerNames[peer.userId] = peer.name;
          peerMeta[peer.userId] = { name: peer.name, avatarUrl: peer.avatarUrl || avatarById[peer.userId] || null, cameraOff: peer.cameraOff === true, isGuest: peer.isGuest === true, guestRole: peer.guestRole || '' };
        }
        await Promise.all((joined.peers || []).map(async (peer) => {
          const pc = getPeer(peer.userId, peer.name, peerMeta[peer.userId]);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          emitSignal(peer.userId, pc.localDescription.toJSON());
        }));
        socket.emit('meeting:camera-state', { meetingId: meeting.id, cameraOff: true });
        setStatus('Connected. Camera and microphone are off — tap to turn them on when you are ready.');
        setError('');
      } catch (startError) {
        setError(startError.message || 'Could not connect to the meeting.');
        setStatus('Unable to connect');
      }
    }
    start();

    return () => {
      disposed = true;
      socket.emit('meeting:leave', meeting.id);
      socket.disconnect();
      for (const pc of peerConnections.current.values()) pc.close();
      peerConnections.current.clear();
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      displayStreamRef.current = null;
      localStreamRef.current = null;
    };
  }, [meeting.id, onClose]);

  async function ensureAudio() {
    const existing = localStreamRef.current?.getAudioTracks()[0] || cameraStreamRef.current?.getAudioTracks()[0];
    if (existing) return existing;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone is not supported in this browser.');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error('No microphone was found.');
    if (!cameraStreamRef.current) cameraStreamRef.current = new MediaStream();
    if (!localStreamRef.current || localStreamRef.current === cameraStreamRef.current) localStreamRef.current = cameraStreamRef.current;
    cameraStreamRef.current.addTrack(track);
    setHasMic(true);
    for (const pc of peerConnections.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender) await sender.replaceTrack(track).catch(() => {});
      else pc.addTrack(track, cameraStreamRef.current);
    }
    return track;
  }

  async function ensureCamera() {
    const existing = cameraStreamRef.current?.getVideoTracks()[0];
    if (existing) return existing;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera is not supported in this browser.');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 }, facingMode: 'user' },
    });
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('No camera was found.');
    if (!cameraStreamRef.current) cameraStreamRef.current = new MediaStream();
    cameraStreamRef.current.addTrack(track);
    setHasCamera(true);
    // if not screen sharing, local preview should show camera stream
    if (!displayStreamRef.current) {
      localStreamRef.current = cameraStreamRef.current;
      if (localVideo.current) localVideo.current.srcObject = cameraStreamRef.current;
    }
    for (const pc of peerConnections.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(track).catch(() => {});
      else pc.addTrack(track, cameraStreamRef.current);
    }
    return track;
  }

  async function toggleAudio() {
    try {
      setError('');
      let track = localStreamRef.current?.getAudioTracks()[0] || cameraStreamRef.current?.getAudioTracks()[0];
      if (!track) track = await ensureAudio();
      const nextMuted = !track.enabled ? false : true; // if currently disabled, unmute (enabled true)
      track.enabled = !nextMuted;
      setMuted(nextMuted);
    } catch (e) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') setError('Microphone permission was denied. You can still stay in the meeting — allow mic access in browser settings to speak.');
      else setError(e.message || 'Microphone is unavailable.');
      setMuted(true);
    }
  }

  async function toggleCamera() {
    if (screenSharing) return;
    try {
      setError('');
      let track = cameraStreamRef.current?.getVideoTracks()[0];
      if (!track) track = await ensureCamera();
      const nextOff = track.enabled ? true : false;
      track.enabled = !nextOff;
      if (!displayStreamRef.current && localVideo.current && cameraStreamRef.current) localVideo.current.srcObject = cameraStreamRef.current;
      setCameraOff(nextOff);
      socketRef.current?.emit('meeting:camera-state', { meetingId: meeting.id, cameraOff: nextOff });
    } catch (e) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') setError('Camera permission was denied. You can still stay in the meeting — your profile picture will be shown instead.');
      else setError(e.message || 'Camera is unavailable.');
      setCameraOff(true);
      socketRef.current?.emit('meeting:camera-state', { meetingId: meeting.id, cameraOff: true });
    }
  }

  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return undefined;
    let raf = 0;
    const ensureCtx = () => {
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume().catch(() => {});
      return audioContextRef.current;
    };
    const attach = (id, stream) => {
      if (!stream) return;
      const audioTrack = stream.getAudioTracks?.()[0];
      if (!audioTrack) return;
      const existing = analysersRef.current.get(id);
      if (existing?.trackId === audioTrack.id) return;
      try {
        const ctx = ensureCtx();
        const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analysersRef.current.set(id, { analyser, source, trackId: audioTrack.id, data: new Uint8Array(analyser.frequencyBinCount) });
      } catch { /* ignore audio analysis failures */ }
    };
    const detachMissing = (activeIds) => {
      for (const [id, entry] of analysersRef.current.entries()) {
        if (activeIds.has(id)) continue;
        try { entry.source.disconnect(); } catch {}
        analysersRef.current.delete(id);
      }
    };

    const tick = () => {
      const activeIds = new Set(['local', ...Object.keys(remote)]);
      const localStream = localStreamRef.current || cameraStreamRef.current;
      attach('local', localStream);
      for (const [id, peer] of Object.entries(remote)) attach(id, peer.stream);
      detachMissing(activeIds);
      const next = {};
      const levels = {};
      for (const [id, entry] of analysersRef.current.entries()) {
        entry.analyser.getByteFrequencyData(entry.data);
        let sum = 0;
        for (let i = 0; i < entry.data.length; i += 1) sum += entry.data[i];
        const avg = sum / entry.data.length;
        next[id] = avg > 18;
        // 7 bands from low to high frequencies for a more reactive visualizer
        const bins = entry.data;
        const bandSize = Math.max(1, Math.floor(bins.length / 12));
        const picks = [0, 1, 2, 3, 5, 7, 10];
        levels[id] = picks.map((p, idx) => {
          const start = Math.min(bins.length - 1, p * bandSize);
          const end = Math.min(bins.length, start + bandSize);
          let bandSum = 0;
          for (let j = start; j < end; j += 1) bandSum += bins[j];
          const bandAvg = bandSum / Math.max(1, end - start);
          // normalize and add slight shape so center bars are naturally taller
          const shape = [0.75, 0.9, 1, 1.1, 1, 0.9, 0.75][idx] || 1;
          return Math.min(1, (bandAvg / 140) * shape);
        });
      }
      audioLevelsRef.current = levels;
      setSpeaking((prev) => {
        const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const key of keys) if (!!prev[key] !== !!next[key]) return next;
        return prev;
      });
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    const resume = () => { if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume().catch(() => {}); };
    window.addEventListener('click', resume);
    window.addEventListener('touchstart', resume);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('click', resume);
      window.removeEventListener('touchstart', resume);
      for (const entry of analysersRef.current.values()) { try { entry.source.disconnect(); } catch {} }
      analysersRef.current.clear();
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, [remote, muted, cameraOff, screenSharing]);

  function stopScreenShare() {
    const displayStream = displayStreamRef.current;
    if (!displayStream) return;
    socketRef.current?.emit('meeting:screen-share', { meetingId: meeting.id, sharing: false });
    displayStream.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    displayStreamRef.current = null;
    const cameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
    for (const pc of peerConnections.current.values()) {
      const sender = pc.getSenders().find((item) => item.track?.kind === 'video');
      if (sender) sender.replaceTrack(cameraTrack || null).catch(() => { /* peer may have left */ });
    }
    if (cameraTrack) cameraTrack.enabled = !cameraOff;
    localStreamRef.current = cameraStreamRef.current;
    if (localVideo.current) localVideo.current.srcObject = cameraStreamRef.current || null;
    setScreenSharing(false);
    setStatus('Connected. Share the meeting link with invited staff.');
  }

  async function toggleScreenShare() {
    if (displayStreamRef.current) { stopScreenShare(); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) { setError('Screen sharing is not supported in this browser.'); return; }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) { displayStream.getTracks().forEach((track) => track.stop()); throw new Error('No screen was selected.'); }
      const activeStream = new MediaStream([...(cameraStreamRef.current?.getAudioTracks() || []), screenTrack]);
      for (const pc of peerConnections.current.values()) {
        const sender = pc.getSenders().find((item) => item.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenTrack);
      }
      displayStreamRef.current = displayStream;
      localStreamRef.current = activeStream;
      if (localVideo.current) { localVideo.current.srcObject = activeStream; localVideo.current.play().catch(() => {}); }
      screenTrack.onended = () => stopScreenShare();
      socketRef.current?.emit('meeting:screen-share', { meetingId: meeting.id, sharing: true });
      setError('');
      setScreenSharing(true);
      setStatus('Sharing your screen with the meeting.');
    } catch (shareError) {
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
      if (shareError?.name === 'NotAllowedError' || shareError?.name === 'AbortError') setStatus('Screen sharing was cancelled. You are still connected.');
      else setError(shareError.message || 'Screen sharing failed.');
    }
  }

  const localAvatar = avatarSrc(user?.avatarUrl || avatarById[user?.id]);
  const showLocalVideo = screenSharing || (!cameraOff && hasCamera && !!cameraStreamRef.current?.getVideoTracks().length);
  const localSpeaking = speaking.local === true;
  const someoneSharing = screenSharing || Object.values(sharingPeers).some(Boolean);

  return <div className="fixed inset-0 z-[100] flex flex-col bg-[#08110d] text-white">
    <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <img src={LOGO} alt="Ledge Roofing" className="h-9 w-9 shrink-0 rounded-lg bg-white/10 object-contain p-1" />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold sm:text-lg">{meeting.title}</p>
          <p className="truncate text-xs text-white/50">Ledge Roofing · {status}</p>
        </div>
      </div>
      <button onClick={onClose} className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Leave meeting"><X className="h-5 w-5" /></button>
    </header>
    {error && <p role="alert" className="m-4 rounded-lg bg-red-900/60 p-3 text-sm text-red-100">{error}</p>}
    <main className={`grid min-h-0 flex-1 gap-3 overflow-auto p-3 sm:p-5 ${someoneSharing ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-[#0f1713] transition-shadow duration-300 ${screenSharing ? 'min-h-[320px] sm:min-h-[420px] lg:col-span-3 lg:row-span-2' : 'min-h-56'} ${localSpeaking && !muted ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-[#08110d] shadow-[0_0_0_6px_rgba(74,222,128,0.18),0_0_24px_rgba(74,222,128,0.2)]' : ''}`}>
        <video ref={localVideo} autoPlay muted playsInline className={`h-full w-full ${screenSharing ? 'object-contain bg-black' : 'object-cover'} ${showLocalVideo ? '' : 'hidden'}`} />
        {!showLocalVideo && <div className="flex h-full min-h-56 flex-col items-center justify-center bg-gradient-to-b from-white/5 to-transparent p-6 text-center">
          {localAvatar ? <img crossOrigin="use-credentials" src={localAvatar} alt="" className={`h-20 w-20 rounded-full object-cover ring-4 ${localSpeaking ? 'ring-green-400' : 'ring-white/10'}`} /> : <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-green-700 text-2xl font-bold text-white ring-4 ${localSpeaking ? 'ring-green-400' : 'ring-white/10'}`}>{initials(user?.name)}</div>}
          <p className="mt-4 text-sm font-semibold text-white/90">Camera off</p>
          <p className="mt-1 text-xs text-white/50">{hasCamera ? 'Your profile photo is shown instead.' : 'No camera available or permission denied.'}</p>
          <AudioBars active={localSpeaking && !muted} participantId="local" audioLevelsRef={audioLevelsRef} />
        </div>}
        <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">You {screenSharing ? '(sharing screen)' : cameraOff ? '(camera off)' : ''}{muted ? ' · muted' : ''}</span>
        {localSpeaking && !muted && <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black shadow-lg"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/70" />Speaking</span>}
      </div>
      {Object.entries(remote).map(([id, peer]) => {
        const peerAvatar = avatarSrc(peer.avatarUrl || avatarById[id]);
        const showRemoteVideo = !!peer.stream && (sharingPeers[id] || !peer.cameraOff);
        const isSpeaking = speaking[id] === true;
        const isSharing = sharingPeers[id] === true;
        return <div key={id} className={`relative overflow-hidden rounded-2xl bg-[#0f1713] transition-shadow duration-300 ${isSharing ? 'min-h-[320px] sm:min-h-[420px] lg:col-span-3 lg:row-span-2' : 'min-h-56'} ${isSpeaking ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-[#08110d] shadow-[0_0_0_6px_rgba(74,222,128,0.18),0_0_24px_rgba(74,222,128,0.2)]' : ''}`}>
          <video autoPlay playsInline ref={(element) => { if (element && element.srcObject !== peer.stream) element.srcObject = peer.stream; }} className={`h-full w-full ${isSharing ? 'object-contain bg-black' : 'object-cover'} ${showRemoteVideo ? '' : 'hidden'}`} />
          {!showRemoteVideo && <div className="flex h-full min-h-56 flex-col items-center justify-center bg-gradient-to-b from-white/5 to-transparent p-6 text-center">
            {peerAvatar ? <img crossOrigin="use-credentials" src={peerAvatar} alt="" className={`h-20 w-20 rounded-full object-cover ring-4 ${isSpeaking ? 'ring-green-400' : 'ring-white/10'}`} /> : <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold text-white ring-4 ${isSpeaking ? 'ring-green-400' : 'ring-white/10'}`}>{initials(peer.name)}</div>}
            <p className="mt-4 text-sm font-semibold text-white/90">{peer.name}</p>
            {peer.isGuest && peer.guestRole && <p className="mt-0.5 text-[11px] text-green-300/80">{peer.guestRole} · Guest</p>}
            <p className="mt-1 text-xs text-white/50">Camera off</p>
            <AudioBars active={isSpeaking} participantId={id} audioLevelsRef={audioLevelsRef} />
          </div>}
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">{peer.name}{peer.isGuest ? ' (Guest)' : ''}{isSharing ? ' (sharing screen)' : ''}</span>
          {isSpeaking && <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black shadow-lg"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/70" />Speaking</span>}
        </div>;
      })}
      {!Object.keys(remote).length && <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/55"><Video className="h-8 w-8" /><p className="mt-3 text-sm">{guestToken ? 'Waiting for others to join…' : 'Waiting for invited teammates to join…'}</p></div>}
    </main>
    {showDiagnostics && <div className="border-t border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">
      <p className="mb-2 font-semibold text-white/90">Connection diagnostics</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white/5 px-3 py-2">Socket: {socketRef.current?.connected ? 'connected' : 'disconnected'} · Peers: {peerConnections.current.size}</div>
        {[...peerConnections.current.entries()].map(([id, pc]) => <div key={id} className="rounded-lg bg-white/5 px-3 py-2">{remote[id]?.name || id.slice(0,8)}: {pc.connectionState} / {pc.iceConnectionState}</div>)}
        {!peerConnections.current.size && <div className="rounded-lg bg-white/5 px-3 py-2">No peer connections yet.</div>}
      </div>
    </div>}
    <footer className="flex flex-wrap justify-center gap-3 border-t border-white/10 p-4">
      <button onClick={toggleAudio} disabled={!hasMic} className={`rounded-full p-3 ${muted ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={!hasMic ? 'Microphone unavailable' : muted ? 'Unmute microphone' : 'Mute microphone'}>{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
      <button onClick={toggleCamera} disabled={screenSharing || !hasCamera} className={`rounded-full p-3 ${cameraOff ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'} title={!hasCamera ? 'Camera unavailable' : screenSharing ? 'Stop screen sharing to use camera' : cameraOff ? 'Turn camera on' : 'Turn camera off'}>{cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}</button>
      <button onClick={toggleScreenShare} className={`rounded-full p-3 ${screenSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-white/10 hover:bg-white/20'}`} aria-label={screenSharing ? 'Stop sharing screen' : 'Share screen'}>{screenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}</button>
      <button onClick={() => setShowDiagnostics((v) => !v)} className={`rounded-full px-4 py-3 text-sm font-semibold ${showDiagnostics ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>Diagnostics</button>
      {canEnd && <button onClick={onEnd} className="rounded-full bg-amber-600 px-4 py-3 text-sm font-bold hover:bg-amber-500">End for everyone</button>}
      <button onClick={onClose} className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">Leave meeting</button>
    </footer>
  </div>;
}

export function MeetingsPage({ user }) {
  const [meetings, setMeetings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [draft, setDraft] = useState({ title: '', description: '', startsAt: localDateTime() });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attendanceFor, setAttendanceFor] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const closeActiveMeeting = useCallback(() => setActiveMeeting(null), []);

  const load = useCallback(async () => {
    const [meetingResult, staffResult] = await Promise.all([
      apiRequest('/workspace/meetings'), apiRequest('/workspace/staff'),
    ]);
    setMeetings(meetingResult.meetings);
    setStaff(staffResult.staff.filter((member) => member.id !== user.id));
  }, [user.id]);
  useEffect(() => {
    load().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
    const socket = io(API_ORIGIN, { withCredentials: true });
    socket.on('meeting:updated', () => load().catch((requestError) => setError(requestError.message)));
    return () => socket.disconnect();
  }, [load]);

  async function createMeeting(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest('/workspace/meetings', {
        method: 'POST',
        body: JSON.stringify({ ...draft, startsAt: new Date(draft.startsAt).toISOString(), participantIds: selected }),
      });
      setMeetings((items) => [...items, result.meeting].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)));
      setSelected([]);
      setDraft({ title: '', description: '', startsAt: localDateTime() });
      setNotice('Meeting created. Invited staff were notified by email and push if enabled.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function cancelMeeting(meeting) {
    if (!window.confirm(`Cancel “${meeting.title}”?`)) return;
    try {
      await apiRequest(`/workspace/meetings/${meeting.id}/cancel`, { method: 'POST' });
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function endMeeting(meeting) {
    if (!window.confirm(`End “${meeting.title}” for everyone?`)) return;
    try {
      await apiRequest(`/workspace/meetings/${meeting.id}/end`, { method: 'POST' });
      closeActiveMeeting();
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function deleteMeeting(meeting) {
    if (!window.confirm(`Permanently delete “${meeting.title}” and its meeting record?`)) return;
    try {
      await apiRequest(`/workspace/meetings/${meeting.id}`, { method: 'DELETE' });
      if (activeMeeting?.id === meeting.id) closeActiveMeeting();
      setMeetings((items) => items.filter((item) => item.id !== meeting.id));
    } catch (requestError) { setError(requestError.message); }
  }

  async function toggleGuestAccess(meeting) {
    try {
      setError('');
      const enabled = !meeting.guest_access;
      const result = await apiRequest(`/workspace/meetings/${meeting.id}/guest-access`, { method: 'POST', body: JSON.stringify({ enabled }) });
      setMeetings((items) => items.map((item) => item.id === meeting.id ? { ...item, guest_access: result.guestAccess, guest_token: result.guestToken } : item));
      setNotice(enabled ? 'Guest link enabled. Anyone with the link can join by name and role.' : 'Guest link disabled.');
    } catch (requestError) { setError(requestError.message); }
  }

  async function copyGuestLink(meeting) {
    const link = `${window.location.origin}/meeting/${meeting.guest_token}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice('Guest meeting link copied.');
    } catch {
      window.prompt('Copy meeting link:', link);
    }
  }

  async function loadAttendance(meeting) {
    try {
      setError('');
      if (attendanceFor === meeting.id) { setAttendanceFor(null); setAttendanceRows([]); return; }
      const result = await apiRequest(`/workspace/meetings/${meeting.id}/attendance`);
      setAttendanceFor(meeting.id);
      setAttendanceRows(result.attendance || []);
    } catch (e) { setError(e.message || 'Could not load attendance.'); }
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-green-700" /><div><h2 className="font-display text-lg font-bold text-slate-900">Schedule a video meeting</h2><p className="text-xs text-slate-500">Small team calls support up to six people.</p></div></div>
      <form onSubmit={createMeeting} className="grid gap-3 lg:grid-cols-2">
        <input required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Meeting title" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <input type="datetime-local" required value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <textarea rows={2} maxLength={2000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Agenda or notes (optional)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <div className="rounded-xl border border-slate-200 p-3"><p className="mb-2 text-xs font-bold text-slate-600">Invite staff (max 5 others)</p><div className="max-h-28 space-y-1 overflow-auto">{staff.map((member) => <label key={member.id} className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={selected.includes(member.id)} disabled={!selected.includes(member.id) && selected.length >= 5} onChange={(event) => setSelected((items) => event.target.checked ? [...items, member.id] : items.filter((id) => id !== member.id))} />{member.name} <span className="text-slate-400">{member.email}</span></label>)}</div></div>
        {error && <p role="alert" className="text-sm text-red-700 lg:col-span-2">{error}</p>}{notice && <p role="status" className="text-sm text-green-700 lg:col-span-2">{notice}</p>}
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 lg:col-span-2">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}<Plus className="h-4 w-4" />Schedule meeting</button>
      </form>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5"><h2 className="font-display text-lg font-bold text-slate-900">Meetings</h2></div>
      {loading ? <p className="p-6 text-sm text-slate-500">Loading…</p> : !meetings.length ? <p className="p-8 text-center text-sm text-slate-500">No meetings scheduled yet.</p> : <div className="divide-y divide-slate-100">{meetings.map((meeting) => {
        const canManageMeeting = meeting.created_by === user.id || ['owner', 'admin'].includes(user.role);
        const guestLink = `${window.location.origin}/meeting/${meeting.guest_token}`;
        return <article key={meeting.id} className="flex flex-wrap items-center gap-4 p-5">
        <span className={`rounded-full p-2 ${meeting.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}><Video className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
          <p className="mt-1 text-xs text-slate-500"><Clock3 className="mr-1 inline h-3 w-3" />{new Date(meeting.starts_at).toLocaleString()} · Hosted by {meeting.host_name}</p>
          {meeting.description && <p className="mt-1 text-sm text-slate-600">{meeting.description}</p>}
          <p className="mt-1 text-xs text-slate-400">{meeting.participants?.length || 0} invited: {(meeting.participants || []).map((person) => person.name).join(', ')}</p>
          {meeting.guest_access && <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-green-700"><Link2 className="h-3.5 w-3.5" /><span className="font-semibold">Guest link on:</span><span className="truncate text-slate-500">{guestLink}</span></p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${meeting.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{meeting.status}</span>
        {meeting.status !== 'ended' && meeting.status !== 'cancelled' && <button onClick={() => setActiveMeeting(meeting)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"><Video className="h-3.5 w-3.5" />Join</button>}
        {canManageMeeting && meeting.status !== 'ended' && meeting.status !== 'cancelled' && <button onClick={() => toggleGuestAccess(meeting)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${meeting.guest_access ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Link2 className="h-3.5 w-3.5" />{meeting.guest_access ? 'Guest link on' : 'Enable guest link'}</button>}
        {meeting.guest_access && <button onClick={() => copyGuestLink(meeting)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" />Copy link</button>}
        <button onClick={() => loadAttendance(meeting)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">{attendanceFor === meeting.id ? 'Hide attendance' : 'Attendance'}</button>
        {meeting.created_by === user.id && meeting.status === 'scheduled' && <button onClick={() => cancelMeeting(meeting)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-700">Cancel</button>}
        {canManageMeeting && <button onClick={() => deleteMeeting(meeting)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>}
        {attendanceFor === meeting.id && <div className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-800">Attendance</p>
          {!attendanceRows.length ? <p className="text-slate-500">No attendance records yet.</p> : <div className="space-y-1">{attendanceRows.map((r) => <div key={r.user_id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white px-3 py-2"><span>{r.name} <span className="text-slate-400">({r.role})</span></span><span className="text-slate-500">{r.joined_at ? `Joined ${new Date(r.joined_at).toLocaleString()}` : 'Not joined'}{r.left_at ? ` · Left ${new Date(r.left_at).toLocaleString()}` : ''}</span></div>)}</div>}
        </div>}
      </article>; })}</div>}
    </section>
    {activeMeeting && <MeetingRoom meeting={activeMeeting} user={user} avatarById={Object.fromEntries([[user.id, user.avatarUrl], ...staff.map((member) => [member.id, member.avatarUrl])])} onClose={closeActiveMeeting} canEnd={activeMeeting.created_by === user.id} onEnd={() => endMeeting(activeMeeting)} />}
  </div>;
}


export function ProfilePage({ user, onUpdated }) {
  const [profile, setProfile] = useState({ name: user.name || '', bio: user.bio || '', avatarUrl: user.avatarUrl || null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const imageUrl = profile.avatarUrl?.startsWith('http') ? profile.avatarUrl : profile.avatarUrl ? `${API_ORIGIN}${profile.avatarUrl}` : null;

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest('/workspace/profile', { method: 'PATCH', body: JSON.stringify({ name: profile.name, bio: profile.bio }) });
      setProfile((current) => ({ ...current, ...result.profile }));
      onUpdated({ ...user, ...result.profile, mustChangePassword: user.mustChangePassword });
      setNotice('Profile saved.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function uploadAvatar(file) {
    if (!file) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const form = new FormData(); form.append('avatar', file);
      const result = await apiRequest('/workspace/profile/avatar', { method: 'POST', body: form });
      setProfile((current) => ({ ...current, ...result.profile }));
      onUpdated({ ...user, ...result.profile, mustChangePassword: user.mustChangePassword });
      setNotice('Profile photo updated.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-green-700 ring-4 ring-green-50">
          {imageUrl ? <img crossOrigin="use-credentials" loading="lazy" decoding="async" src={imageUrl} alt={`${profile.name} profile`} className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12" />}
        </div>
        <div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Your profile</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{profile.name}</h2><p className="mt-1 text-sm text-slate-500">{user.email}</p><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Camera className="h-4 w-4" />Change profile photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={busy} onChange={(event) => uploadAvatar(event.target.files?.[0])} /></label><p className="mt-2 text-[11px] text-slate-400">JPG, PNG, or WebP · up to 5 MB</p></div>
      </div>
    </section>
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h3 className="font-display text-lg font-bold text-slate-900">Profile details</h3>
      <label className="block text-xs font-bold text-slate-600">Display name<input required maxLength={80} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
      <label className="block text-xs font-bold text-slate-600">Bio<textarea rows={5} maxLength={800} value={profile.bio || ''} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Tell your teammates a little about your role and experience." className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /><span className="mt-1 block text-right text-[10px] font-normal text-slate-400">{(profile.bio || '').length}/800</span></label>
      <p className="text-xs text-slate-500">Work email: <strong>{user.email}</strong> <span className="ml-1">(managed by the workspace admin)</span></p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}<Check className="h-4 w-4" />Save profile</button>
    </form>
  </div>;
}

function attendanceGrid(year, records) {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const first = new Date(Date.UTC(year, 0, 1));
  const last = new Date(Date.UTC(year, 11, 31));
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const weeks = [];
  for (let cursor = new Date(start); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    const week = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(cursor);
      date.setUTCDate(cursor.getUTCDate() + day);
      const key = date.toISOString().slice(0, 10);
      week.push({ key, inYear: date.getUTCFullYear() === year, record: byDate.get(key) || null });
    }
    weeks.push(week);
  }
  return weeks;
}

export function AttendancePage({ user }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [staff, setStaff] = useState([]);
  const [selectedUser, setSelectedUser] = useState(user.id);
  const [attendance, setAttendance] = useState({ days: [], totalDays: 0, staff: user });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = ['owner', 'admin'].includes(user.role);
  const weeks = useMemo(() => attendanceGrid(year, attendance.days), [year, attendance.days]);

  const load = useCallback(async () => {
    const query = new URLSearchParams({ year: String(year), userId: selectedUser });
    const result = await apiRequest(`/workspace/attendance?${query}`);
    setAttendance(result);
  }, [selectedUser, year]);

  useEffect(() => {
    let alive = true;
    if (isAdmin) apiRequest('/workspace/attendance/staff').then((result) => alive && setStaff(result.staff)).catch((requestError) => alive && setError(requestError.message));
    return () => { alive = false; };
  }, [isAdmin]);

  useEffect(() => {
    let alive = true;
    load().catch((requestError) => alive && setError(requestError.message)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [load]);

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Attendance</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Sign-in activity</h2><p className="mt-1 text-xs text-slate-500">A day is recorded automatically on the first authenticated visit. Only you and workspace admins can see your calendar.</p></div>
        <div className="flex items-center gap-2">
          {isAdmin && <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} className="max-w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">{staff.map((member) => <option key={member.id} value={member.id}>{member.name} — {member.email}</option>)}</select>}
          <button disabled={year <= 2020} onClick={() => setYear((value) => value - 1)} aria-label="Previous year" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-12 text-center text-sm font-bold">{year}</span>
          <button disabled={year >= currentYear} onClick={() => setYear((value) => value + 1)} aria-label="Next year" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
        {loading ? <p className="text-sm text-slate-500">Loading attendance…</p> : <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span><strong className="text-slate-800">{attendance.staff?.name || user.name}</strong> · {attendance.totalDays} days present in {year}</span><span>Workday check-in is recorded in Africa/Lagos time.</span></div>
          <div className="overflow-x-auto pb-2"><div className="flex min-w-max gap-[3px]" role="grid" aria-label={`${year} attendance heatmap`}>
            {weeks.map((week, weekIndex) => <div key={weekIndex} className="flex flex-col gap-[3px]">{week.map((day) => {
              const record = day.record;
              const time = record ? new Date(record.first_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const label = day.inYear ? `${day.key}${record ? ` · first sign-in ${time}` : ' · no sign-in recorded'}` : '';
              return <div key={day.key} role="gridcell" title={label} aria-label={label} className={`h-3 w-3 rounded-[3px] ${!day.inYear ? 'bg-transparent' : record ? 'bg-green-600' : 'bg-slate-200'}`} />;
            })}</div>)}
          </div></div>
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-slate-500"><span>Less</span><span className="h-3 w-3 rounded-[3px] bg-slate-200" /><span className="h-3 w-3 rounded-[3px] bg-green-600" /><span>More</span></div>
        </>}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
  </div>;
}


export function EmailPage({ user }) {
  const canUseEmail = user.canManageEmail || user.role === 'owner' || user.role === 'admin';
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest('/workspace/email', { method: 'POST', body: JSON.stringify({ to, subject, text }) });
      setNotice(`Email accepted for ${result.accepted} recipient(s). Replies go to your staff mailbox (${user.email}).`);
      setTo(''); setSubject(''); setText('');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  if (!canUseEmail) {
    return <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-green-50 p-2.5 text-green-700"><Mail className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-bold text-slate-900">Email access restricted</h2><p className="text-xs text-slate-500">Only selected staff can send or reply from the dashboard.</p></div></div>
        <p className="mt-5 text-sm leading-6 text-slate-600">You do not currently have permission to send emails from the dashboard. Ask an admin to grant you email access.</p>
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Replies from recipients are delivered to the authorized sender’s staff mailbox. This dashboard does not yet show an inbox of incoming replies unless mailbox/inbound sync is configured.</p>
      </section>
    </div>;
  }

  return <div className="mx-auto max-w-3xl space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-green-50 p-2.5 text-green-700"><Mail className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-bold text-slate-900">Send an email</h2><p className="text-xs text-slate-500">Send to staff or external recipients. Only authorized users can send/reply from here.</p></div></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-xs font-bold text-slate-600">To (up to 5 addresses)<textarea required rows={2} value={to} onChange={(event) => setTo(event.target.value)} placeholder="person@example.com, another@example.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /><span className="mt-1 block font-normal text-slate-400">Separate addresses with commas or new lines. Replies go to your staff email: {user.email}. Check your mailbox to view incoming replies.</span></label>
        <label className="block text-xs font-bold text-slate-600">Subject<input required maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
        <label className="block text-xs font-bold text-slate-600">Message<textarea required rows={10} maxLength={10000} value={text} onChange={(event) => setText(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal leading-6 text-slate-800" /><span className="mt-1 block text-right font-normal text-slate-400">{text.length}/10,000</span></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{busy ? 'Sending…' : 'Send email'}</button>
        <p className="text-xs text-slate-400">Sending is rate-limited and subject to your provider limits. Incoming replies are not yet collected inside this dashboard.</p>
      </form>
    </section>
  </div>;
}

export function NotificationsPage({ navigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await apiRequest('/workspace/notifications');
      setItems(result.notifications || []);
    } catch (e) { setError(e.message || 'Could not load notifications.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((n) => filter === 'all' ? true : filter === 'unread' ? !n.read_at : n.read_at);
  const unread = items.filter((n) => !n.read_at).length;

  async function markRead(id) {
    try {
      await apiRequest(`/workspace/notifications/${id}/read`, { method: 'POST' });
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n));
    } catch {}
  }
  async function markAll() {
    try {
      await apiRequest('/workspace/notifications/read-all', { method: 'POST' });
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch {}
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-lg font-bold text-slate-900">Notifications</h2><p className="text-xs text-slate-500">{unread} unread · latest {items.length}</p></div>
        <div className="flex flex-wrap gap-2">
          {['all','unread','read'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter===f?'bg-green-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f[0].toUpperCase()+f.slice(1)}</button>)}
          <button onClick={markAll} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Mark all read</button>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
        {loading ? <p className="p-6 text-sm text-slate-500">Loading notifications…</p> : !filtered.length ? <p className="p-8 text-center text-sm text-slate-500">No notifications here.</p> : filtered.map((n) => (
          <button key={n.id} onClick={() => { if (!n.read_at) markRead(n.id); if (n.href) navigate(n.href); }} className={`flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50 ${n.read_at ? '' : 'bg-green-50/40'}`}>
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? 'bg-slate-200' : 'bg-green-500'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-slate-600">{n.body}</p>}
              <p className="mt-1 text-[11px] text-slate-400">{n.kind} · {new Date(n.created_at).toLocaleString()}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  </div>;
}

export function AuditLogPage({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canView = ['owner', 'admin'].includes(user.role);

  useEffect(() => {
    if (!canView) return;
    let alive = true;
    setLoading(true);
    apiRequest('/workspace/audit?limit=80')
      .then((r) => { if (alive) setEntries(r.entries || []); })
      .catch((e) => { if (alive) setError(e.message || 'Could not load audit log.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [canView]);

  if (!canView) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Only workspace admins can view the audit log.</div>;

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4"><h2 className="font-display text-lg font-bold text-slate-900">Audit log</h2><p className="text-xs text-slate-500">Recent sensitive workspace actions.</p></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3 font-semibold">Time</th><th className="px-4 py-3 font-semibold">Actor</th><th className="px-4 py-3 font-semibold">Action</th><th className="px-4 py-3 font-semibold">Entity</th><th className="px-4 py-3 font-semibold">Details</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>Loading…</td></tr> : !entries.length ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={5}>No audit entries yet.</td></tr> : entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-700">{e.actor_name || e.actor_id || 'System'}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{e.action}</td>
                <td className="px-4 py-3 text-slate-600">{e.entity_type}{e.entity_id ? ` · ${String(e.entity_id).slice(0,8)}` : ''}</td>
                <td className="max-w-[28rem] px-4 py-3 text-slate-500"><pre className="whitespace-pre-wrap break-words font-sans">{JSON.stringify(e.details || {})}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
