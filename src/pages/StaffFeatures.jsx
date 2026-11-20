import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiRequest } from '../utils/api';
import { API_BASE } from '../utils/api';
import { CalendarDays, Camera, Check, ChevronLeft, ChevronRight, Clock3, ImagePlus, LoaderCircle, Mail, Mic, MicOff, Play, Plus, Radio, ScreenShare, ScreenShareOff, Send, Square, Timer, UserRound, Video, VideoOff, X } from 'lucide-react';

function formatTracked(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

const API_ORIGIN = API_BASE.replace(/\/api$/, '');
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const PRIORITY_LABEL = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
const localDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export function TasksPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [timerBusy, setTimerBusy] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ title: '', description: '', assignedTo: '', priority: 'normal', dueAt: '' });
  const [openComments, setOpenComments] = useState(null);
  const [comments, setComments] = useState({});
  const [commentDraft, setCommentDraft] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const [taskResult, staffResult] = await Promise.all([
      apiRequest('/workspace/tasks'),
      apiRequest('/workspace/staff'),
    ]);
    setTasks(taskResult.tasks);
    setStaff(staffResult.staff);
  }, []);

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
        body: JSON.stringify({ ...draft, assignedTo: draft.assignedTo || null, dueAt: draft.dueAt || null }),
      });
      setDraft({ title: '', description: '', assignedTo: '', priority: 'normal', dueAt: '' });
      await load();
      setNotice('Task created. The assignee was notified by email and push if enabled.');
    } catch (requestError) {
      setError(requestError.message);
    } finally { setBusy(false); }
  }

  async function updateTask(task, changes) {
    setError('');
    try {
      const result = await apiRequest(`/workspace/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      setTasks((items) => items.map((item) => item.id === task.id ? result.task : item));
    } catch (requestError) { setError(requestError.message); }
  }

  async function toggleTaskTimer(task) {
    const running = Boolean(task.my_timer_started_at);
    setTimerBusy(task.id);
    setError('');
    try {
      const result = await apiRequest(`/workspace/tasks/${task.id}/timer/${running ? 'stop' : 'start'}`, { method: 'POST' });
      setTasks((items) => items.map((item) => item.id === task.id ? result.task : item.my_running_task_id === task.id ? { ...item, my_timer_started_at: null, my_running_task_id: null } : item));
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setTimerBusy(null); }
  }

  async function toggleComments(taskId) {
    if (openComments === taskId) { setOpenComments(null); return; }
    setOpenComments(taskId);
    if (!comments[taskId]) {
      try {
        const result = await apiRequest(`/workspace/tasks/${taskId}/comments`);
        setComments((items) => ({ ...items, [taskId]: result.comments }));
      } catch (requestError) { setError(requestError.message); }
    }
  }

  async function addComment(event, task) {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;
    try {
      const result = await apiRequest(`/workspace/tasks/${task.id}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
      setComments((items) => ({ ...items, [task.id]: [...(items[task.id] || []), result.comment] }));
      setCommentDraft('');
    } catch (requestError) { setError(requestError.message); }
  }

  const assigned = tasks.filter((task) => task.assigned_to === user.id);
  const overdue = (task) => task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done';

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-3">
      {[['All tasks', tasks.length], ['Assigned to me', assigned.length], ['Overdue', tasks.filter(overdue).length]].map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-display text-2xl font-bold text-slate-900">{value}</p></div>
      ))}
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-green-700" /><h2 className="font-display text-lg font-bold text-slate-900">Create a task</h2></div>
      <form onSubmit={createTask} className="grid gap-3 lg:grid-cols-2">
        <input required maxLength={180} placeholder="Task title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" />
        <select value={draft.assignedTo} onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Unassigned</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name} — {member.email}</option>)}</select>
        <textarea rows={2} maxLength={5000} placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select>
          <input type="datetime-local" value={draft.dueAt} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" aria-label="Due date" />
        </div>
        <div className="flex items-center justify-between gap-3 lg:col-span-2">{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p role="status" className="text-sm text-green-700">{notice}</p>}<button disabled={busy} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}Create task</button></div>
      </form>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5"><h2 className="font-display text-lg font-bold text-slate-900">Team task board</h2><p className="mt-1 text-xs text-slate-500">Assignments and status changes notify the relevant staff by email and browser push.</p></div>
      {loading ? <div className="p-8 text-sm text-slate-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading tasks…</div> : !tasks.length ? <p className="p-8 text-center text-sm text-slate-500">No tasks yet. Create the first one above.</p> : <div className="divide-y divide-slate-100">{tasks.map((task) => {
        const running = Boolean(task.my_timer_started_at);
        const runningSeconds = running ? Math.max(0, Math.floor((now - new Date(task.my_timer_started_at).getTime()) / 1000)) : 0;
        const myTracked = (Number(task.my_tracked_seconds) || 0) + runningSeconds;
        const totalTracked = (Number(task.total_tracked_seconds) || 0) + runningSeconds;
        const dueMs = task.due_at ? new Date(task.due_at).getTime() : null;
        const createdMs = task.created_at ? new Date(task.created_at).getTime() : null;
        const hasWindow = dueMs && createdMs && dueMs > createdMs;
        const remainingMs = dueMs ? dueMs - now : 0;
        const elapsedFraction = hasWindow ? Math.min(1, Math.max(0, (now - createdMs) / (dueMs - createdMs))) : 0;
        const juice = hasWindow ? 1 - elapsedFraction : 0;
        const quarter = !hasWindow ? 0 : elapsedFraction >= 1 ? 4 : Math.floor(elapsedFraction * 4) + 1;
        const quarterCaptions = {
          0: 'Set a due date to start the countdown.',
          1: 'Quarter 1 — fresh time in the tank. Move early.',
          2: 'Quarter 2 — halfway there. Keep momentum.',
          3: 'Quarter 3 — final stretch. Push hard.',
          4: 'Quarter 4 — time is up. Finish or reset the deadline.',
        };
        const juiceColor = remainingMs <= 0 ? 'bg-red-500' : juice > 0.5 ? 'bg-emerald-400' : juice > 0.25 ? 'bg-amber-400' : 'bg-orange-500';
        const countdownCaption = !dueMs
          ? 'No due date yet — add one to power the countdown and quarter reminders.'
          : remainingMs <= 0
            ? 'Countdown complete. This task is overdue — take action now.'
            : `${quarterCaptions[quarter]} Quarter reminders are sent as time passes.`;
        return <article key={task.id} className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900">{task.title}</h3>
            {task.description && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>}
            <p className="mt-2 text-xs text-slate-500">Assigned: {task.assignee_name || 'Unassigned'} · Created by {task.creator_name}</p>
            <div className={`mt-4 overflow-hidden rounded-2xl border p-4 sm:p-5 ${dueMs && remainingMs <= 0 ? 'border-red-300 bg-gradient-to-br from-red-950 via-rose-900 to-slate-950 text-white shadow-lg shadow-red-900/20' : 'border-emerald-300 bg-gradient-to-br from-emerald-950 via-green-900 to-slate-950 text-white shadow-lg shadow-emerald-900/20'}`}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300"><span className={`h-2.5 w-2.5 rounded-full ${dueMs && remainingMs > 0 ? 'animate-pulse bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.18)]' : 'bg-red-400 shadow-[0_0_0_6px_rgba(248,113,113,0.18)]'}`} />{dueMs ? (remainingMs <= 0 ? 'Countdown finished' : 'Deadline countdown') : 'Countdown idle'}</p>
                  <p className="mt-2 font-display text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{dueMs ? formatClock(Math.abs(Math.floor(remainingMs / 1000))) : '--:--:--'}</p>
                  <p className="mt-1 text-sm text-emerald-100/90">{dueMs ? (remainingMs <= 0 ? 'Time over — overdue' : 'Time left until due') : 'Waiting for a due date'}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-right text-xs text-emerald-50/90">
                  <p className="font-semibold text-emerald-200">Due</p>
                  <p className="mt-0.5 font-bold">{dueMs ? new Date(dueMs).toLocaleString() : 'Not set'}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-emerald-200/90"><span>Time juice</span><span>{hasWindow ? `${Math.round(juice * 100)}% left` : 'No window'}</span></div>
                <div className="relative h-5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
                  <div className={`h-full rounded-full transition-[width] duration-700 ease-linear ${juiceColor}`} style={{ width: `${hasWindow ? Math.max(remainingMs <= 0 ? 0 : 2, juice * 100) : 0}%` }} />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0.18)_70%,rgba(255,255,255,0)_100%)] opacity-40" />
                  {hasWindow && [25, 50, 75].map((mark) => <span key={mark} className="absolute top-0 h-full w-px bg-white/35" style={{ left: `${100 - mark}%` }} title={`Quarter at ${mark}% used`} />)}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-emerald-100/70"><span>Start</span><span>Q1</span><span>Q2</span><span>Q3</span><span>Due</span></div>
              </div>
              <p className="mt-3 text-sm text-emerald-50/95">{countdownCaption}</p>
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3 text-emerald-50/90">
                <div className="rounded-xl bg-white/10 px-3 py-2"><p className="font-semibold text-emerald-200">Current quarter</p><p className="mt-0.5 text-sm font-bold">{hasWindow ? `Quarter ${quarter} of 4` : '—'}</p></div>
                <div className="rounded-xl bg-white/10 px-3 py-2"><p className="font-semibold text-emerald-200">Quarter reminders</p><p className="mt-0.5 text-sm font-bold">Every 25% of time</p></div>
                <div className="rounded-xl bg-white/10 px-3 py-2"><p className="font-semibold text-emerald-200">Time tracked (you)</p><p className="mt-0.5 text-sm font-bold tabular-nums">{formatTracked(myTracked)}{running ? ' · tracking' : ''}</p></div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <button onClick={() => toggleTaskTimer(task)} disabled={timerBusy === task.id} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold disabled:opacity-50 ${running ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{timerBusy === task.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{running ? 'Stop focus tracking' : 'Start focus tracking'}</button>
              <span className="rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-600">Team tracked: {formatTracked(totalTracked)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2 lg:w-52 lg:flex-col lg:items-stretch">
            <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{PRIORITY_LABEL[task.priority]}</span>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Task status<select value={task.status} onChange={(event) => updateTask(task, { status: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 normal-case tracking-normal"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label>
            <button onClick={() => toggleComments(task.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Comments</button>
          </div>
        </div>
        {openComments === task.id && <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="space-y-2">{(comments[task.id] || []).map((comment) => <p key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs"><strong>{comment.author_name}</strong><span className="ml-2 text-slate-400">{new Date(comment.created_at).toLocaleString()}</span><span className="mt-1 block whitespace-pre-wrap text-slate-700">{comment.body}</span></p>)}{!(comments[task.id] || []).length && <p className="text-xs text-slate-400">No comments yet.</p>}</div>
          <form onSubmit={(event) => addComment(event, task)} className="mt-3 flex gap-2"><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={5000} placeholder="Add an update…" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button disabled={!commentDraft.trim()} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />Send</button></form>
        </div>}
      </article>; })}</div>}
    </section>
  </div>;
}

function MeetingRoom({ meeting, onClose, onEnd, canEnd }) {
  const localVideo = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef(new Map());
  const pendingCandidates = useRef(new Map());
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const displayStreamRef = useRef(null);
  const [remote, setRemote] = useState({});
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [sharingPeers, setSharingPeers] = useState({});
  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let peerNames = {};
    const socket = io(API_ORIGIN, { withCredentials: true });
    socketRef.current = socket;

    const emitSignal = (targetUserId, signal) => socket.emit('meeting:signal', { meetingId: meeting.id, targetUserId, signal });
    const flushCandidates = async (userId, pc) => {
      const queue = pendingCandidates.current.get(userId) || [];
      pendingCandidates.current.delete(userId);
      for (const candidate of queue) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* stale ICE candidates can be ignored */ }
      }
    };
    const getPeer = (userId, displayName = 'Teammate') => {
      peerNames[userId] = displayName;
      let pc = peerConnections.current.get(userId);
      if (pc) return pc;
      pc = new RTCPeerConnection({ iceServers });
      peerConnections.current.set(userId, pc);
      for (const track of localStreamRef.current?.getTracks() || []) pc.addTrack(track, localStreamRef.current);
      pc.onicecandidate = (event) => { if (event.candidate) emitSignal(userId, { type: 'candidate', candidate: event.candidate.toJSON() }); };
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        setRemote((items) => ({ ...items, [userId]: { name: peerNames[userId] || displayName, stream } }));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close(); peerConnections.current.delete(userId);
          setRemote((items) => { const next = { ...items }; delete next[userId]; return next; });
        }
      };
      return pc;
    };

    let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    async function start() {
      try {
        const result = await apiRequest(`/workspace/meetings/${meeting.id}/ice-servers`);
        iceServers = result.iceServers;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          socket.once('connect', resolve);
          socket.once('connect_error', reject);
          if (socket.connected) resolve();
        });
        socket.on('meeting:signal', async ({ from, signal }) => {
          try {
            const pc = getPeer(from.userId, from.name);
            if (signal.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
              await flushCandidates(from.userId, pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              emitSignal(from.userId, pc.localDescription.toJSON());
            } else if (signal.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
              await flushCandidates(from.userId, pc);
            } else if (signal.type === 'candidate' && signal.candidate) {
              if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              else pendingCandidates.current.set(from.userId, [...(pendingCandidates.current.get(from.userId) || []), signal.candidate]);
            }
          } catch (signalError) { console.warn('WebRTC signaling error:', signalError.message); }
        });
        socket.on('meeting:peer-joined', ({ userId, name }) => { peerNames[userId] = name; setStatus(`${name} is joining…`); });
        socket.on('meeting:peer-left', ({ userId }) => {
          peerConnections.current.get(userId)?.close(); peerConnections.current.delete(userId);
          delete peerNames[userId];
          setRemote((items) => { const next = { ...items }; delete next[userId]; return next; });
          setSharingPeers((items) => { const next = { ...items }; delete next[userId]; return next; });
        });
        socket.on('meeting:screen-share', ({ userId, sharing }) => setSharingPeers((items) => ({ ...items, [userId]: sharing })));
        socket.on('meeting:ended', () => { setStatus('Meeting ended by host.'); window.setTimeout(onClose, 800); });
        const joined = await new Promise((resolve) => socket.emit('meeting:join', { meetingId: meeting.id }, resolve));
        if (!joined?.ok) throw new Error(joined?.error || 'Could not join the meeting.');
        for (const peer of joined.peers) {
          const pc = getPeer(peer.userId, peer.name);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          emitSignal(peer.userId, pc.localDescription.toJSON());
        }
        setStatus('Connected. Share the meeting link with invited staff.');
      } catch (startError) {
        setError(startError.message || 'Camera or microphone access failed.');
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

  function toggleAudio() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  }
  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); }
  }

  function stopScreenShare() {
    const displayStream = displayStreamRef.current;
    if (!displayStream) return;
    socketRef.current?.emit('meeting:screen-share', { meetingId: meeting.id, sharing: false });
    displayStream.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    displayStreamRef.current = null;
    const cameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
    for (const pc of peerConnections.current.values()) {
      const sender = pc.getSenders().find((item) => item.track?.kind === 'video');
      if (sender && cameraTrack) sender.replaceTrack(cameraTrack).catch(() => { /* peer may have left */ });
    }
    if (cameraTrack) cameraTrack.enabled = !cameraOff;
    localStreamRef.current = cameraStreamRef.current;
    if (localVideo.current && cameraStreamRef.current) localVideo.current.srcObject = cameraStreamRef.current;
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

  return <div className="fixed inset-0 z-[100] flex flex-col bg-[#08110d] text-white">
    <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6"><div><p className="font-display font-bold">{meeting.title}</p><p className="text-xs text-white/50">{status}</p></div><button onClick={onClose} className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Leave meeting"><X className="h-5 w-5" /></button></header>
    {error && <p role="alert" className="m-4 rounded-lg bg-red-900/60 p-3 text-sm text-red-100">{error}</p>}
    <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto p-3 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
      <div className="relative min-h-56 overflow-hidden rounded-2xl bg-black"><video ref={localVideo} autoPlay muted playsInline className="h-full w-full object-cover" /><span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">You {screenSharing ? '(sharing screen)' : cameraOff ? '(camera off)' : ''}</span></div>
      {Object.entries(remote).map(([id, peer]) => <div key={id} className="relative min-h-56 overflow-hidden rounded-2xl bg-black"><video autoPlay playsInline ref={(element) => { if (element && element.srcObject !== peer.stream) element.srcObject = peer.stream; }} className="h-full w-full object-cover" /><span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">{peer.name}{sharingPeers[id] ? ' (sharing screen)' : ''}</span></div>)}
      {!Object.keys(remote).length && <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/55 sm:col-span-1"><Video className="h-8 w-8" /><p className="mt-3 text-sm">Waiting for invited teammates to join…</p></div>}
    </main>
    <footer className="flex flex-wrap justify-center gap-3 border-t border-white/10 p-4"><button onClick={toggleAudio} className={`rounded-full p-3 ${muted ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'}`} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}>{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button><button onClick={toggleCamera} disabled={screenSharing} className={`rounded-full p-3 ${cameraOff ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}>{cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}</button><button onClick={toggleScreenShare} className={`rounded-full p-3 ${screenSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-white/10 hover:bg-white/20'}`} aria-label={screenSharing ? 'Stop sharing screen' : 'Share screen'}>{screenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}</button>{canEnd && <button onClick={onEnd} className="rounded-full bg-amber-600 px-4 py-3 text-sm font-bold hover:bg-amber-500">End for everyone</button>}<button onClick={onClose} className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">Leave meeting</button></footer>
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
      {loading ? <p className="p-6 text-sm text-slate-500">Loading…</p> : !meetings.length ? <p className="p-8 text-center text-sm text-slate-500">No meetings scheduled yet.</p> : <div className="divide-y divide-slate-100">{meetings.map((meeting) => <article key={meeting.id} className="flex flex-wrap items-center gap-4 p-5">
        <span className={`rounded-full p-2 ${meeting.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}><Video className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900">{meeting.title}</h3><p className="mt-1 text-xs text-slate-500"><Clock3 className="mr-1 inline h-3 w-3" />{new Date(meeting.starts_at).toLocaleString()} · Hosted by {meeting.host_name}</p>{meeting.description && <p className="mt-1 text-sm text-slate-600">{meeting.description}</p>}<p className="mt-1 text-xs text-slate-400">{meeting.participants?.length || 0} invited: {(meeting.participants || []).map((person) => person.name).join(', ')}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${meeting.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{meeting.status}</span>
        {meeting.status !== 'ended' && meeting.status !== 'cancelled' && <button onClick={() => setActiveMeeting(meeting)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"><Video className="h-3.5 w-3.5" />Join</button>}
        {meeting.created_by === user.id && meeting.status === 'scheduled' && <button onClick={() => cancelMeeting(meeting)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-700">Cancel</button>}
        {(meeting.created_by === user.id || ['owner', 'admin'].includes(user.role)) && <button onClick={() => deleteMeeting(meeting)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>}
      </article>)}</div>}
    </section>
    {activeMeeting && <MeetingRoom meeting={activeMeeting} onClose={closeActiveMeeting} canEnd={activeMeeting.created_by === user.id} onEnd={() => endMeeting(activeMeeting)} />}
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
      setNotice(`Email accepted for ${result.accepted} recipient(s).`);
      setTo(''); setSubject(''); setText('');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-3xl space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-green-50 p-2.5 text-green-700"><Mail className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-bold text-slate-900">Send an email</h2><p className="text-xs text-slate-500">Send to staff or external recipients; they don’t need a workspace account.</p></div></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-xs font-bold text-slate-600">To (up to 5 addresses)<textarea required rows={2} value={to} onChange={(event) => setTo(event.target.value)} placeholder="person@example.com, another@example.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /><span className="mt-1 block font-normal text-slate-400">Separate addresses with commas or new lines. Replies go to your staff email: {user.email}.</span></label>
        <label className="block text-xs font-bold text-slate-600">Subject<input required maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
        <label className="block text-xs font-bold text-slate-600">Message<textarea required rows={10} maxLength={10000} value={text} onChange={(event) => setText(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal leading-6 text-slate-800" /><span className="mt-1 block text-right font-normal text-slate-400">{text.length}/10,000</span></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{busy ? 'Sending…' : 'Send email'}</button>
        <p className="text-xs text-slate-400">Sending is rate-limited and subject to your Resend account’s daily limits.</p>
      </form>
    </section>
  </div>;
}
