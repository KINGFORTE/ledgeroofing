import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import {
  ArrowDown, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, FileText, Hash, Home, Moon, Sun,
  ImagePlus, ListTodo, LoaderCircle, LogOut, MessageSquare, Paperclip, Plus, Search,
  Send, Shield, Trash2, UserRound, Users, Video, X,
} from 'lucide-react';
import { API_BASE, API_CONFIGURED, apiRequest } from '../utils/api';
import { AttendancePage, MeetingsPage, ProfilePage, TasksPage } from './StaffFeatures';

const API_ORIGIN = API_BASE.replace(/\/api$/, '');
const prettyRole = (role) => ({ owner: 'Owner', admin: 'Admin', editor: 'Editor', staff: 'Staff' }[role] || 'Staff');
const displayTime = (value) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function applicationServerKey(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101715] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-10 inline-flex items-center gap-3 text-white/75 hover:text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500 font-display text-xl font-bold">L</span>
          <span className="font-display text-lg font-bold">Ledge Roofing <span className="text-white/40">/ Staff</span></span>
        </Link>
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Private workspace</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Welcome back.</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">Sign in with the work account provided by your administrator.</p>
          <label className="mt-8 block text-sm font-semibold text-white/80">Work email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-green-500" />
          </label>
          <label className="mt-5 block text-sm font-semibold text-white/80">Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-green-500" />
          </label>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3.5 font-bold text-white transition hover:bg-green-400 disabled:opacity-60">
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Sign in
          </button>
          <p className="mt-6 text-center text-xs text-white/35">Staff accounts are invite-only. Contact your workspace admin if you need access.</p>
          {!API_CONFIGURED && <p className="mt-4 rounded-lg bg-amber-300/10 px-3 py-2 text-center text-[11px] text-amber-200">The Hostinger API is not connected yet. Set VITE_API_URL in Vercel after deployment.</p>}
        </form>
      </div>
    </div>
  );
}

function ChangePassword({ user, onChanged, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (newPassword !== confirm) return setError('The new passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await apiRequest('/workspace/staff/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      onChanged({ ...user, mustChangePassword: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101715] px-5 py-12 text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
        <Shield className="h-8 w-8 text-green-400" />
        <h1 className="mt-5 font-display text-2xl font-bold">Set your password</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">For security, replace the temporary password before continuing.</p>
        <label className="mt-6 block text-sm font-semibold text-white/80">Temporary password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-green-500" /></label>
        <label className="mt-4 block text-sm font-semibold text-white/80">New password (12+ characters)<input required minLength={12} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-green-500" /></label>
        <label className="mt-4 block text-sm font-semibold text-white/80">Confirm new password<input required minLength={12} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-green-500" /></label>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3.5 font-bold text-white disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Update password</button>
        <button type="button" onClick={onLogout} className="mt-4 w-full text-center text-xs text-white/45 hover:text-white">Sign out</button>
      </form>
    </div>
  );
}

function Workspace({ user }) {
  const [channels, setChannels] = useState([]);
  const [staff, setStaff] = useState([]);
  const [dms, setDms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState({});
  const [typing, setTyping] = useState([]);
  const socketRef = useRef(null);
  const selectedRef = useRef(null);
  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadSidebar = useCallback(async () => {
    const [channelResult, staffResult, dmResult] = await Promise.all([
      apiRequest('/workspace/channels'), apiRequest('/workspace/staff'), apiRequest('/workspace/direct-messages'),
    ]);
    setChannels(channelResult.channels);
    setStaff(staffResult.staff);
    setDms(dmResult.conversations);
    setSelected((current) => current || (() => {
      const general = channelResult.channels.find((channel) => channel.name === 'general');
      return general ? { id: general.id, type: 'channel', label: general.name, joined: general.joined } : null;
    })());
  }, []);

  useEffect(() => {
    let alive = true;
    loadSidebar().catch((requestError) => alive && setError(requestError.message)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [loadSidebar]);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    const socket = io(API_ORIGIN, { withCredentials: true });
    socketRef.current = socket;
    socket.on('presence:list', (members) => setOnline(Object.fromEntries(members.map((member) => [member.userId, member.online]))));
    socket.on('presence:update', (update) => setOnline((current) => ({ ...current, [update.userId]: update.online })));
    socket.on('message:new', (message) => {
      if (selectedRef.current?.id === message.conversation_id) {
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]);
      }
    });
    socket.on('message:updated', (message) => {
      if (selectedRef.current?.id === message.conversation_id) setMessages((items) => items.map((item) => item.id === message.id ? { ...item, ...message } : item));
    });
    socket.on('reaction:changed', async () => {
      const current = selectedRef.current;
      if (!current) return;
      try {
        const result = await apiRequest(`/workspace/conversations/${current.id}/messages`);
        setMessages(result.messages);
      } catch { /* retain the messages already on screen if the refresh fails */ }
    });
    socket.on('typing:update', (update) => {
      if (update.typing) setTyping((items) => items.includes(update.name) ? items : [...items, update.name]);
      else setTyping((items) => items.filter((name) => name !== update.name));
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    let alive = true;
    setMessages([]);
    setTyping([]);
    async function loadMessages() {
      try {
        if (selected.type === 'channel' && !selected.joined) {
          await apiRequest(`/workspace/channels/${selected.id}/join`, { method: 'POST' });
          setChannels((items) => items.map((item) => item.id === selected.id ? { ...item, joined: true } : item));
        }
        const result = await apiRequest(`/workspace/conversations/${selected.id}/messages`);
        if (!alive) return;
        setMessages(result.messages);
        await apiRequest(`/workspace/conversations/${selected.id}/read`, { method: 'POST' });
        socketRef.current?.emit('conversation:join', selected.id);
      } catch (requestError) {
        if (alive) setError(requestError.message);
      }
    }
    loadMessages();
    return () => { alive = false; };
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function startDirectMessage(member) {
    try {
      const result = await apiRequest('/workspace/direct-messages', { method: 'POST', body: JSON.stringify({ userId: member.id }) });
      setSelected({ id: result.conversationId, type: 'dm', label: member.name, userId: member.id });
      setDms((items) => items.some((item) => item.conversation_id === result.conversationId) ? items : [...items, { conversation_id: result.conversationId, user_id: member.id, name: member.name }]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createChannel() {
    const name = window.prompt('Name your channel (lowercase, no spaces):');
    if (!name) return;
    try {
      const result = await apiRequest('/workspace/channels', { method: 'POST', body: JSON.stringify({ name }) });
      setChannels((items) => [...items, result.channel].sort((a, b) => a.name.localeCompare(b.name)));
      setSelected({ id: result.channel.id, type: 'channel', label: result.channel.name, joined: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!selected || (!body.trim() && !files.length)) return;
    setBusy(true);
    setError('');
    try {
      socketRef.current?.emit('typing:stop', selected.id);
      window.clearTimeout(typingTimerRef.current);
      let attachments = [];
      if (files.length) {
        const form = new FormData();
        form.append('scope', 'chat');
        files.forEach((file) => form.append('files', file));
        const result = await apiRequest('/uploads', { method: 'POST', body: form });
        attachments = result.files;
      }
      const result = await apiRequest(`/workspace/conversations/${selected.id}/messages`, {
        method: 'POST', body: JSON.stringify({ body: body.trim(), attachments }),
      });
      setMessages((items) => items.some((item) => item.id === result.message.id) ? items : [...items, result.message]);
      setBody('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function handleTyping(value) {
    setBody(value);
    if (!selected) return;
    window.clearTimeout(typingTimerRef.current);
    socketRef.current?.emit(value ? 'typing:start' : 'typing:stop', selected.id);
    if (value) typingTimerRef.current = window.setTimeout(() => socketRef.current?.emit('typing:stop', selected.id), 1500);
  }

  async function toggleReaction(messageId, emoji) {
    try {
      await apiRequest(`/workspace/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) });
      if (selectedRef.current) {
        const result = await apiRequest(`/workspace/conversations/${selectedRef.current.id}/messages`);
        setMessages(result.messages);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading workspace…</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[35rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Workspace</p><p className="mt-1 font-display font-bold text-slate-900">Ledge Team</p></div>
          <button onClick={createChannel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200" title="Create channel"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-2 pb-2 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Channels</p>
          <div className="space-y-1">
            {channels.map((channel) => <button key={channel.id} onClick={() => setSelected({ id: channel.id, type: 'channel', label: channel.name, joined: channel.joined })} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${selected?.id === channel.id ? 'bg-green-100 font-semibold text-green-900' : 'text-slate-600 hover:bg-slate-200'}`}><Hash className="h-4 w-4 opacity-55" />{channel.name}{channel.is_private && <Shield className="ml-auto h-3 w-3" />}</button>)}
          </div>
          <p className="px-2 pb-2 pt-7 text-[10px] font-bold uppercase tracking-widest text-slate-400">Direct messages</p>
          <div className="space-y-1">
            {dms.map((dm) => <button key={dm.conversation_id} onClick={() => setSelected({ id: dm.conversation_id, type: 'dm', label: dm.name, userId: dm.user_id })} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${selected?.id === dm.conversation_id ? 'bg-green-100 font-semibold text-green-900' : 'text-slate-600 hover:bg-slate-200'}`}><span className={`h-2 w-2 rounded-full ${online[dm.user_id] ? 'bg-green-500' : 'bg-slate-300'}`} />{dm.name}</button>)}
          </div>
          <p className="px-2 pb-2 pt-7 text-[10px] font-bold uppercase tracking-widest text-slate-400">Start a message</p>
          <div className="space-y-1">
            {staff.filter((member) => member.id !== user.id).slice(0, 8).map((member) => <button key={member.id} onClick={() => startDirectMessage(member)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-500 hover:bg-slate-200"><span className={`h-2 w-2 rounded-full ${online[member.id] ? 'bg-green-500' : 'bg-slate-300'}`} />{member.name}</button>)}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[4.25rem] items-center justify-between border-b border-slate-200 px-5 sm:px-7">
          <div className="flex items-center gap-2"><span className="rounded-lg bg-green-50 p-2 text-green-700">{selected?.type === 'channel' ? <Hash className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}</span><div><h2 className="font-display font-bold text-slate-900">{selected?.label || 'Choose a conversation'}</h2><p className="text-xs text-slate-500">{selected?.type === 'channel' ? 'Team channel' : selected ? (online[selected.userId] ? 'Online' : 'Direct message') : 'Messages are visible to workspace members'}</p></div></div>
          {selected?.type === 'channel' && <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex"><Users className="h-3.5 w-3.5" />{channels.find((channel) => channel.id === selected.id)?.member_count || 0}</span>}
        </header>
        <div className="border-b border-slate-100 px-4 py-2 md:hidden"><label className="sr-only" htmlFor="conversation-picker">Choose a conversation</label><select id="conversation-picker" value={selected?.id || ''} onChange={(event) => {
          const channel = channels.find((item) => item.id === event.target.value);
          if (channel) return setSelected({ id: channel.id, type: 'channel', label: channel.name, joined: channel.joined });
          const dm = dms.find((item) => item.conversation_id === event.target.value);
          if (dm) setSelected({ id: dm.conversation_id, type: 'dm', label: dm.name, userId: dm.user_id });
        }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          <optgroup label="Channels">{channels.map((channel) => <option key={channel.id} value={channel.id}># {channel.name}</option>)}</optgroup>
          <optgroup label="Direct messages">{dms.map((dm) => <option key={dm.conversation_id} value={dm.conversation_id}>{dm.name}</option>)}</optgroup>
        </select></div>
        {error && <div className="flex items-center justify-between bg-red-50 px-5 py-2 text-xs text-red-700">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button></div>}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-7">
          {!messages.length && <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-slate-400"><MessageSquare className="h-8 w-8 opacity-40" /><p className="mt-3 text-sm">{selected ? `This is the beginning of #${selected.label}.` : 'Select a channel or start a direct message.'}</p></div>}
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const grouped = previous?.sender_id === message.sender_id && new Date(message.created_at) - new Date(previous.created_at) < 5 * 60 * 1000;
            return <article key={message.id} className={`group flex gap-3 ${grouped ? 'pt-0' : 'pt-2'}`}>
              {grouped ? <div className="w-9 shrink-0 pt-1 text-right text-[9px] text-transparent group-hover:text-slate-400">{displayTime(message.created_at)}</div> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600">{(message.sender_name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>}
              <div className="min-w-0 flex-1"><div className="flex items-baseline gap-2"><span className="text-sm font-bold text-slate-800">{grouped ? '' : message.sender_name}</span>{!grouped && <time className="text-[10px] text-slate-400">{displayTime(message.created_at)}</time>}{message.edited_at && <span className="text-[10px] text-slate-400">edited</span>}</div>
                {message.body && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.body}</p>}
                {message.attachments?.map((attachment) => <a key={attachment.id} href={`${API_ORIGIN}${attachment.url}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-green-800 hover:bg-green-50"><Paperclip className="h-3.5 w-3.5" /><span className="truncate">{attachment.name}</span></a>)}
                {(message.reactions?.length > 0 || message.body) && <div className="mt-1.5 flex flex-wrap gap-1.5">{message.reactions?.map((reaction) => <button key={reaction.emoji} onClick={() => toggleReaction(message.id, reaction.emoji)} aria-label={`React ${reaction.emoji}`} className={`rounded-full border px-2 py-0.5 text-[11px] ${reaction.reacted ? 'border-green-300 bg-green-50 text-green-800' : 'border-slate-200 bg-white text-slate-500 hover:border-green-300'}`}>{reaction.emoji} {reaction.count}</button>)}{message.body && <button onClick={() => toggleReaction(message.id, '👍')} aria-label="Like message" className="rounded-full border border-transparent px-2 py-0.5 text-[11px] text-slate-300 opacity-0 transition group-hover:opacity-100 hover:border-slate-200 hover:bg-white hover:text-slate-600">＋</button>}</div>}
              </div>
            </article>;
          })}
          {typing.length > 0 && <p className="pl-12 text-xs italic text-slate-400">{typing.join(', ')} typing…</p>}
          <div ref={bottomRef} />
        </div>
        {files.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-2 sm:px-6">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs text-green-800">{file.name}<button onClick={() => setFiles((items) => items.filter((_, itemIndex) => index !== itemIndex))} aria-label={`Remove ${file.name}`}><X className="h-3 w-3" /></button></span>)}</div>}
        <form onSubmit={sendMessage} className="border-t border-slate-200 p-3 sm:p-5">
          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100">
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/mp4,video/webm,application/pdf" className="hidden" onChange={(event) => setFiles((items) => [...items, ...Array.from(event.target.files || [])].slice(0, 5))} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Attach files"><Paperclip className="h-4 w-4" /></button>
            <textarea value={body} onChange={(event) => handleTyping(event.target.value)} onBlur={() => { if (selected) socketRef.current?.emit('typing:stop', selected.id); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} rows={1} placeholder={selected ? `Message ${selected.type === 'channel' ? '#' : ''}${selected.label}…` : 'Select a conversation first'} disabled={!selected} className="max-h-32 min-h-10 flex-1 resize-y bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" />
            <button disabled={busy || !selected || (!body.trim() && !files.length)} className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white transition hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400" title="Send message"><Send className="h-4 w-4" /></button>
          </div>
          <p className="mt-2 pl-1 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line · Attachments up to 25 MB</p>
        </form>
      </section>
    </div>
  );
}

function ContentManager({ type, user }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const empty = useMemo(() => ({
    title: '', slug: '', excerpt: '', category: type === 'project' ? 'Asphalt Roofing' : 'Roofing Tips',
    coverImage: '', status: 'draft', featured: false, body: '', gallery: '', location: '', latitude: '', longitude: '', scope: '', year: '', tagline: '', description: '', fullDescription: '',
  }), [type]);

  const load = useCallback(() => apiRequest(`/content/manage/${type}`).then((result) => setItems(result.items)), [type]);
  useEffect(() => { load().catch((requestError) => setError(requestError.message)); }, [load]);

  function editItem(item) {
    const content = item.content || {};
    setEditing({
      id: item.id, title: item.title, slug: item.slug, excerpt: item.excerpt, category: item.category,
      coverImage: item.coverImage, status: item.status, featured: item.featured,
      body: content.body || '', gallery: Array.isArray(content.gallery) ? content.gallery.join('\n') : (content.gallery || ''),
      location: content.location || '', latitude: Array.isArray(content.coords) ? content.coords[0] : '', longitude: Array.isArray(content.coords) ? content.coords[1] : '', scope: content.scope || '', year: content.year || '',
      tagline: content.tagline || '', description: content.description || '', fullDescription: content.fullDescription || '',
    });
    setError('');
  }

  async function upload(files, field) {
    if (!files.length) return;
    const form = new FormData();
    files.slice(0, 5).forEach((file) => form.append('files', file));
    try {
      const result = await apiRequest('/uploads', { method: 'POST', body: form });
      setEditing((current) => ({ ...current, [field]: field === 'gallery' ? [current.gallery, ...result.files.map((file) => file.url)].filter(Boolean).join('\n') : result.files[0]?.url || current.coverImage }));
      setNotice('Upload complete. Remember to save your changes.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function save(event, status = editing.status) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      title: editing.title, slug: editing.slug, excerpt: editing.excerpt, category: editing.category,
      coverImage: editing.coverImage, status, featured: editing.featured,
      content: type === 'blog'
        ? { body: editing.body, read: `${Math.max(1, Math.ceil(editing.body.trim().split(/\s+/).filter(Boolean).length / 200))} min read` }
        : { gallery: editing.gallery.split('\n').map((url) => url.trim()).filter(Boolean), location: editing.location, scope: editing.scope, year: editing.year, tagline: editing.tagline, description: editing.description, fullDescription: editing.fullDescription, coords: editing.latitude !== '' && editing.longitude !== '' ? [Number(editing.latitude), Number(editing.longitude)] : null },
    };
    try {
      if (!payload.coverImage) throw new Error('Add a cover image before saving.');
      if (editing.id) await apiRequest(`/content/${type}/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiRequest(`/content/${type}`, { method: 'POST', body: JSON.stringify(payload) });
      await load();
      setEditing(null);
      setNotice(status === 'published' ? 'Published. It will appear on the public website shortly.' : 'Draft saved.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await apiRequest(`/content/${type}/${item.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editing?.id === item.id) setEditing(null);
    } catch (requestError) { setError(requestError.message); }
  }

  const visibleItems = items.filter((item) => `${item.title} ${item.slug}`.toLowerCase().includes(search.toLowerCase()));
  const editable = ['owner', 'admin', 'editor'].includes(user.role);
  const label = type === 'blog' ? 'Blog posts' : 'Projects';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Website content</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">{label}</h2></div>
          <button onClick={() => { setEditing({ ...empty }); setError(''); }} disabled={!editable} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-40"><Plus className="h-4 w-4" /> New {type}</button>
        </div>
        <div className="border-b border-slate-100 p-4"><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-400"><Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${type === 'blog' ? 'posts' : 'projects'}`} className="w-full text-sm text-slate-800 outline-none placeholder:text-slate-400" /></label></div>
        {notice && <p role="status" className="mx-4 mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
        {error && <p role="alert" className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="divide-y divide-slate-100">
          {visibleItems.map((item) => <article key={item.id} className="flex items-center gap-4 p-4 sm:px-6">
            <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">{item.coverImage ? <img src={item.coverImage.startsWith('/uploads/') ? `${API_ORIGIN}${item.coverImage}` : item.coverImage} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5" />}</div>
            <button onClick={() => editItem(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold text-slate-800">{item.title}</span><span className="mt-1 block truncate text-xs text-slate-400">/{type === 'blog' ? 'blog' : 'projects'}/{item.slug}</span></button>
            <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase sm:inline-flex ${item.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
            <button onClick={() => remove(item)} disabled={!['owner', 'admin'].includes(user.role)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:hidden" title="Delete"><X className="h-4 w-4" /></button>
          </article>)}
          {!visibleItems.length && <div className="p-10 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No {type === 'blog' ? 'posts' : 'projects'} yet. Create one to publish it on the website.</p></div>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {!editing ? <div className="flex h-full min-h-60 flex-col items-center justify-center text-center text-slate-400"><FileText className="h-8 w-8" /><h3 className="mt-3 font-display font-bold text-slate-600">Select an item to edit</h3><p className="mt-1 max-w-xs text-xs leading-5">Changes to published content appear on the public website through the API, without a redeploy.</p></div> : (
          <form onSubmit={(event) => save(event)} className="space-y-4">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">{editing.id ? 'Edit' : 'New'} {type}</p><h3 className="mt-1 font-display text-xl font-bold text-slate-900">Content editor</h3></div><button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <label className="block text-xs font-bold text-slate-600">Title<input required value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-green-500" /></label>
            <label className="block text-xs font-bold text-slate-600">URL slug<input value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} placeholder="Generated from title if left blank" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-green-500" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-600">Category<input value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-green-500" /></label><label className="flex items-end gap-2 pb-3 text-sm text-slate-600"><input type="checkbox" checked={editing.featured} onChange={(event) => setEditing({ ...editing, featured: event.target.checked })} className="accent-green-600" /> Feature on website</label></div>
            <label className="block text-xs font-bold text-slate-600">Short description / excerpt<textarea required rows={2} value={editing.excerpt} onChange={(event) => setEditing({ ...editing, excerpt: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-green-500" /></label>
            <label className="block text-xs font-bold text-slate-600">Cover image URL<input required value={editing.coverImage} onChange={(event) => setEditing({ ...editing, coverImage: event.target.value })} placeholder="https://… or upload below" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-green-500" /></label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-green-700 hover:text-green-800"><ImagePlus className="h-4 w-4" /> Upload cover image<input type="file" accept="image/*" className="hidden" onChange={(event) => upload(Array.from(event.target.files || []), 'coverImage')} /></label>
            {type === 'blog' ? <>
              <label className="block text-xs font-bold text-slate-600">Article text<textarea required rows={11} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} placeholder="Write the article here. Separate paragraphs with a blank line." className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal leading-6 text-slate-800 outline-none focus:border-green-500" /></label>
              <p className="-mt-2 text-[10px] text-slate-400">Plain text for now; blank lines become new paragraphs on the website.</p>
            </> : <>
              <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-600">Location<input value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label><label className="block text-xs font-bold text-slate-600">Year / scope<input value={editing.year} onChange={(event) => setEditing({ ...editing, year: event.target.value })} placeholder="Year" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label></div>
              <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-600">Map latitude<input type="number" step="any" min="-90" max="90" value={editing.latitude} onChange={(event) => setEditing({ ...editing, latitude: event.target.value })} placeholder="e.g. 6.5244" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label><label className="block text-xs font-bold text-slate-600">Map longitude<input type="number" step="any" min="-180" max="180" value={editing.longitude} onChange={(event) => setEditing({ ...editing, longitude: event.target.value })} placeholder="e.g. 3.3792" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label></div>
              <label className="block text-xs font-bold text-slate-600">Project tagline<input value={editing.tagline} onChange={(event) => setEditing({ ...editing, tagline: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
              <label className="block text-xs font-bold text-slate-600">Scope<textarea rows={2} value={editing.scope} onChange={(event) => setEditing({ ...editing, scope: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
              <label className="block text-xs font-bold text-slate-600">Full project description<textarea rows={4} value={editing.fullDescription} onChange={(event) => setEditing({ ...editing, fullDescription: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
              <label className="block text-xs font-bold text-slate-600">Gallery image/video URLs<textarea rows={3} value={editing.gallery} onChange={(event) => setEditing({ ...editing, gallery: event.target.value })} placeholder="One URL per line" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-green-700 hover:text-green-800"><ImagePlus className="h-4 w-4" /> Add gallery media<input type="file" multiple accept="image/*,video/mp4,video/webm" className="hidden" onChange={(event) => upload(Array.from(event.target.files || []), 'gallery')} /></label>
            </>}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={(event) => save(event, 'draft')} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save draft</button><button type="button" disabled={busy} onClick={(event) => save(event, 'published')} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Publish</button>{editing.status === 'published' && <span className="self-center text-[10px] text-green-700"><Check className="mr-1 inline h-3.5 w-3.5" />Live</span>}</div>
          </form>
        )}
      </section>
    </div>
  );
}

function TeamManager({ user }) {
  const [staff, setStaff] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const canManage = ['owner', 'admin'].includes(user.role);

  const load = useCallback(() => apiRequest('/workspace/staff').then((result) => setStaff(result.staff)), []);
  useEffect(() => { load().catch((requestError) => setError(requestError.message)); }, [load]);

  async function createStaff(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/workspace/staff', { method: 'POST', body: JSON.stringify({ name, email, role }) });
      setStaff((items) => [...items, result.user].sort((a, b) => a.name.localeCompare(b.name)));
      setNotice(`Invitation email sent to ${result.user.email}.`);
      setName(''); setEmail(''); setRole('staff');
    } catch (requestError) {
      setError(requestError.message);
    } finally { setBusy(false); }
  }

  async function removeStaff(member) {
    if (!window.confirm(`Remove ${member.name}'s workspace access? Existing tasks, meeting records and chat history will be retained.`)) return;
    setRemoving(member.id); setError(''); setNotice('');
    try {
      await apiRequest(`/workspace/staff/${member.id}`, { method: 'DELETE' });
      setStaff((items) => items.filter((item) => item.id !== member.id));
      setNotice(`${member.name}'s access was removed. Existing work history was kept.`);
    } catch (requestError) { setError(requestError.message); }
    finally { setRemoving(null); }
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-widest text-green-700">People</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">Workspace members</h2></div>
      <div className="divide-y divide-slate-100">{staff.map((member) => <div key={member.id} className="flex items-center gap-3 px-5 py-4"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-green-50 text-sm font-bold text-green-800">{member.avatarUrl ? <img crossOrigin="use-credentials" src={`${API_ORIGIN}${member.avatarUrl}`} alt="" className="h-full w-full object-cover" /> : member.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{member.name}{member.id === user.id && <span className="ml-2 text-[10px] font-normal text-slate-400">you</span>}</p><p className="truncate text-xs text-slate-400">{member.email}</p>{member.bio && <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">{member.bio}</p>}</div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{prettyRole(member.role)}</span>{canManage && member.id !== user.id && member.role !== 'owner' && (user.role === 'owner' || member.role !== 'admin') && <button type="button" onClick={() => removeStaff(member)} disabled={removing === member.id} aria-label={`Remove ${member.name}`} title="Remove access; keep history" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-display font-bold text-slate-900">Add a staff member</h3><p className="mt-1 text-xs leading-5 text-slate-500">Invites a staff member by work email with a temporary password; they set their own password on first sign-in. Removing a user disables access but keeps work history.</p>
      {!canManage ? <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Only workspace admins can add people.</p> : <form onSubmit={createStaff} className="mt-5 space-y-3">
        <label className="block text-xs font-bold text-slate-600">Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
        <label className="block text-xs font-bold text-slate-600">Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800" /></label>
        <label className="block text-xs font-bold text-slate-600">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="staff">Staff</option><option value="editor">Editor (content)</option>{user.role === 'owner' && <option value="admin">Admin</option>}</select></label>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-xs text-green-800">{notice}</p>}
        <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}<Plus className="h-4 w-4" /> Send invitation</button>
      </form>}
    </section>
  </div>;
}

function Overview({ user, navigate, onlineMembers = [] }) {
  const cards = [
    { icon: MessageSquare, title: 'Team workspace', text: 'Channels, direct messages, presence and file sharing.', action: 'Open workspace', to: '/staff/workspace' },
    { icon: ListTodo, title: 'Tasks', text: 'Assign work, follow due dates, and share updates with your team.', action: 'Open tasks', to: '/staff/tasks' },
    { icon: CalendarDays, title: 'Meetings', text: 'Schedule and join secure team video meetings.', action: 'Open meetings', to: '/staff/meetings' },
    { icon: FileText, title: 'Projects', text: 'Add completed work to the public website.', action: 'Manage projects', to: '/staff/projects' },
    { icon: BookOpen, title: 'Blog', text: 'Write, edit and publish roofing articles.', action: 'Manage blog', to: '/staff/blog' },
  ];
  return <>
    <div className="rounded-2xl bg-gradient-to-br from-[#123d2d] to-[#17241e] p-7 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">Staff dashboard</p><h2 className="mt-2 font-display text-3xl font-bold">Good to have you, {user.name.split(' ')[0]}.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Your team’s home for day-to-day collaboration and updates to the Ledge Roofing website.</p><button onClick={() => navigate('/staff/workspace')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold hover:bg-green-400">Go to workspace <ArrowUpRight className="h-4 w-4" /></button></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-3">{cards.map(({ icon: Icon, title, text, action, to }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="inline-flex rounded-xl bg-green-50 p-2.5 text-green-700"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-display font-bold text-slate-900">{title}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{text}</p><button onClick={() => navigate(to)} className="mt-4 text-xs font-bold text-green-700 hover:text-green-800">{action} →</button></article>)}</div>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-green-700">Team presence</p><h3 className="mt-1 font-display font-bold text-slate-900">{onlineMembers.length} online now</h3></div><Users className="h-5 w-5 text-green-700" /></div>
      <div className="mt-4 flex flex-wrap gap-2">{onlineMembers.length ? onlineMembers.map((member) => <span key={member.userId} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800"><span className="h-2 w-2 rounded-full bg-green-500" />{member.name}{member.userId === user.id ? ' (you)' : ''}</span>) : <p className="text-xs text-slate-500">No other staff are online right now.</p>}</div>
    </section>
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5"><Shield className="h-5 w-5 shrink-0 text-green-700" /><p className="text-xs leading-5 text-slate-500">You are signed in as <strong className="text-slate-800">{prettyRole(user.role)}</strong>. Staff pages are private and require an active account.</p></div>
  </>;
}

export default function StaffPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [pushMessage, setPushMessage] = useState('');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ledge-staff-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
    catch { return 'light'; }
  });
  const view = location.pathname.split('/')[2] || 'home';

  useEffect(() => {
    try { localStorage.setItem('ledge-staff-theme', theme); } catch { /* theme still works for this session */ }
  }, [theme]);

  useEffect(() => {
    let alive = true;
    apiRequest('/auth/me').then((result) => alive && setUser(result.user)).catch(() => alive && setUser(null)).finally(() => alive && setChecking(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    let alive = true;
    apiRequest('/workspace/notifications')
      .then((result) => alive && setNotifications(result.notifications))
      .catch(() => {});
    const socket = io(API_ORIGIN, { withCredentials: true });
    socket.on('presence:list', (members) => alive && setOnlineMembers(members.filter((member) => member.online)));
    socket.on('presence:update', (update) => alive && setOnlineMembers((members) => {
      const filtered = members.filter((member) => member.userId !== update.userId);
      return update.online ? [...filtered, { userId: update.userId, name: update.name, online: true }] : filtered;
    }));
    socket.on('notification:new', (notification) => alive && setNotifications((items) => [notification, ...items.filter((item) => item.id !== notification.id)].slice(0, 40)));
    return () => { alive = false; socket.disconnect(); };
  }, [user?.id]);

  async function markNotificationRead(notification) {
    try {
      await apiRequest(`/workspace/notifications/${notification.id}/read`, { method: 'POST' });
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
      setNotificationsOpen(false);
      navigate(notification.href || '/staff');
    } catch { /* keep the notification visible if the read request fails */ }
  }

  async function markAllNotificationsRead() {
    try {
      await apiRequest('/workspace/notifications/read-all', { method: 'POST' });
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    } catch { /* keep existing state */ }
  }

  async function enablePushNotifications() {
    setPushMessage('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('This browser does not support push notifications.');
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to enable push.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await apiRequest('/workspace/notifications/push/public-key');
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
      await apiRequest('/workspace/notifications/push/subscriptions', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
      setPushMessage('Browser push notifications are enabled on this device.');
    } catch (error) { setPushMessage(error.message); }
  }

  async function logout() {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch { /* clear local state even if the API is unavailable */ }
    setUser(null);
    navigate('/staff', { replace: true });
  }

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Checking staff session…</div>;
  if (!user) return <Login onLogin={setUser} />;
  if (user.mustChangePassword) return <ChangePassword user={user} onChanged={setUser} onLogout={logout} />;

  const nav = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'workspace', label: 'Workspace', icon: MessageSquare },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays },
    { id: 'profile', label: 'My profile', icon: UserRound },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'blog', label: 'Blog posts', icon: BookOpen },
    ...(user.role === 'owner' || user.role === 'admin' ? [{ id: 'people', label: 'People', icon: Users }] : []),
  ];
  const title = nav.find((item) => item.id === view)?.label || 'Overview';

  return (
    <div className="staff-dashboard min-h-screen bg-slate-50 text-slate-800" data-theme={theme}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-3"><Link to="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 font-display font-bold text-white">L</Link><div><p className="font-display text-sm font-bold leading-4">Ledge Roofing</p><p className="text-[10px] text-slate-400">Staff workspace</p></div><span className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" /><span className="hidden text-xs font-semibold text-slate-500 sm:block">{title}</span></div>
          <div className="relative flex items-center gap-3">
            <a href="/" className="hidden text-xs font-semibold text-slate-500 hover:text-green-700 sm:inline">View public site <ArrowUpRight className="ml-1 inline h-3 w-3" /></a>
            <button onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <div className="relative">
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="h-5 w-5" />{notifications.some((item) => !item.read_at) && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}</button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-2"><p className="text-sm font-bold text-slate-800">Notifications</p><button onClick={markAllNotificationsRead} className="text-[10px] font-bold text-green-700 hover:underline">Mark all read</button></div>
                <div className="max-h-72 overflow-auto">{notifications.slice(0, 12).map((item) => <button key={item.id} onClick={() => markNotificationRead(item)} className={`block w-full rounded-lg px-2 py-2.5 text-left hover:bg-slate-50 ${item.read_at ? 'opacity-60' : ''}`}><span className="block text-xs font-semibold text-slate-800">{item.title}</span><span className="mt-0.5 block text-[11px] text-slate-500">{item.body}</span><span className="mt-1 block text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString()}</span></button>)}{!notifications.length && <p className="p-4 text-center text-xs text-slate-400">You’re all caught up.</p>}</div>
                <button onClick={enablePushNotifications} className="mt-2 w-full rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-800 hover:bg-green-100">Enable browser push</button>{pushMessage && <p role="status" className="mt-2 text-[10px] text-slate-500">{pushMessage}</p>}
              </div>}
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-green-100 text-xs font-bold text-green-800">{user.avatarUrl ? <img crossOrigin="use-credentials" src={`${API_ORIGIN}${user.avatarUrl}`} alt="" className="h-full w-full object-cover" /> : user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="hidden text-left sm:block"><span className="block text-xs font-bold">{user.name}</span><span className="block text-[10px] text-slate-400">{prettyRole(user.role)}</span></span><ArrowDown className="h-3.5 w-3.5 text-slate-400" /></button>
            {menuOpen && <div className="absolute right-0 top-12 z-40 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button onClick={() => { setMenuOpen(false); navigate('/staff/profile'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-green-50 hover:text-green-800"><UserRound className="h-4 w-4" />My profile</button><button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-red-50 hover:text-red-700"><LogOut className="h-4 w-4" />Sign out</button></div>}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-6 md:flex">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspace</p>
          {nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(`/staff/${id === 'home' ? '' : id}`)} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${view === id ? 'bg-green-50 text-green-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon className="h-4 w-4" />{label}</button>)}
          <div className="mt-auto rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Public website</p><p className="mt-1 text-xs text-slate-600">Publishing content updates the site without a code deployment.</p><a href="/" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-green-700">Open website <ArrowUpRight className="h-3 w-3" /></a></div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8">
          <div className="mb-5 flex gap-2 overflow-x-auto md:hidden">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(`/staff/${id === 'home' ? '' : id}`)} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${view === id ? 'bg-green-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
          <h1 className="mb-5 font-display text-2xl font-bold text-slate-900">{title}</h1>
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            {view === 'workspace' ? <Workspace user={user} /> : view === 'tasks' ? <TasksPage user={user} /> : view === 'meetings' ? <MeetingsPage user={user} /> : view === 'attendance' ? <AttendancePage user={user} /> : view === 'profile' ? <ProfilePage user={user} onUpdated={setUser} /> : view === 'projects' ? <ContentManager key="project" type="project" user={user} /> : view === 'blog' ? <ContentManager key="blog" type="blog" user={user} /> : view === 'people' ? <TeamManager user={user} /> : <Overview user={user} navigate={navigate} onlineMembers={onlineMembers} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
