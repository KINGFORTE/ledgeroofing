import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Check, FileText, Hash, LayoutGrid, LoaderCircle, MoreVertical, Paperclip, Phone,
  Plus, Search, Send, Smile, UserRound, Users, X,
} from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { avatarSrc, initials, shortTime } from './useMessagingDirectory';
import './messaging.css';

const API_ORIGIN = API_BASE.replace(/\/api$/, '');

function prettyRole(role = '') {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function MessagingAvatar({ avatar, name, online = false, size = 44, className = '' }) {
  return (
    <span
      className={`msg-avatar ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {avatar ? <img crossOrigin="use-credentials" src={avatar} alt="" /> : <span>{initials(name)}</span>}
      {online && <i className="msg-presence" />}
    </span>
  );
}

function SidebarRow({ item, active, onSelect, onCall, calling }) {
  return (
    <div className={`msg-row-wrap ${active ? 'is-active' : ''}`}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="msg-row-button"
        aria-current={active ? 'true' : undefined}
      >
        <MessagingAvatar avatar={avatarSrc(item.avatar)} name={item.name} online={item.online} />
        <span className="msg-row-copy">
          <span className="msg-row-top">
            <span className="msg-row-name">{item.name}</span>
            <span className="msg-row-time">{item.lastAt ? shortTime(item.lastAt) : ''}</span>
          </span>
          <span className="msg-row-bottom">
            <span className="msg-row-preview">
              {item.lastBody ? (item.mine ? `You: ${item.lastBody}` : item.lastBody) : item.lastAt ? item.lastBody : 'Tap to start a chat'}
            </span>
            {item.unread > 0 && <span className="msg-unread">{item.unread > 99 ? '99+' : item.unread}</span>}
          </span>
        </span>
      </button>
      {onCall && <button type="button" onClick={() => onCall(item)} disabled={calling} className="msg-row-call" aria-label={`Call ${item.name}`} title={`Call ${item.name}`}>{calling ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}</button>}
    </div>
  );
}

function MessagingSidebar({ user, items, channels, activeId, search, onSearch, searchRef, onSelect, onStart, onNavigate, onCall, callingId, loading, error }) {
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const term = search.trim().toLowerCase();
  const recent = term
    ? items.recent.filter((item) => `${item.name} ${item.email} ${item.lastBody}`.toLowerCase().includes(term))
    : items.recent;
  const people = term
    ? items.people.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(term))
    : items.people;

  function selectPerson(person) {
    setNewChatOpen(false);
    void onStart(person);
  }

  function go(path) {
    setMenuOpen(false);
    onNavigate(path);
  }

  return (
    <aside className="msg-sidebar" aria-label="Conversations">
      <div className="msg-sidebar-header">
        <MessagingAvatar avatar={avatarSrc(user.avatarUrl)} name={user.name} size={42} />
        <div className="msg-sidebar-identity">
          <p className="msg-sidebar-name">{user.name}</p>
          <p className="msg-sidebar-role">{prettyRole(user.role)}</p>
        </div>
        <div className="msg-sidebar-actions">
          <button type="button" onClick={() => { setNewChatOpen((open) => !open); setMenuOpen(false); }} aria-label="New chat" title="New chat"><Plus className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={() => searchRef.current?.focus()} aria-label="Search chats" title="Search chats"><Search className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={() => { setMenuOpen((open) => !open); setNewChatOpen(false); }} aria-label="Menu" title="Menu"><MoreVertical className="h-[18px] w-[18px]" /></button>
        </div>
      </div>

      {newChatOpen && <div className="msg-popover msg-popover-new">
        <p className="msg-popover-title">Start a new chat</p>
        <div className="msg-popover-list">
          {items.people.length ? items.people.map((person) => <button key={person.id} type="button" onClick={() => selectPerson(person)}><MessagingAvatar avatar={avatarSrc(person.avatar)} name={person.name} size={34} /><span className="min-w-0 flex-1 truncate">{person.name}</span><span className="text-[10px] text-slate-400">{prettyRole(person.role)}</span></button>) : <p className="px-3 py-4 text-center text-xs text-slate-400">Everyone is already in your chats.</p>}
        </div>
      </div>}

      {menuOpen && <div className="msg-popover msg-popover-menu">
        <button type="button" onClick={() => go('/staff')}><LayoutGrid className="h-4 w-4" />Dashboard</button>
        <button type="button" onClick={() => go('/staff/workspace')}><Users className="h-4 w-4" />Team channels</button>
        <button type="button" onClick={() => go('/staff/profile')}><UserRound className="h-4 w-4" />My profile</button>
      </div>}

      <div className="msg-search-row">
        <label className="msg-search">
          <Search className="msg-search-icon" />
          <input ref={searchRef} value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search or start a new chat" aria-label="Search or start a new chat" />
          {search && <button type="button" onClick={() => onSearch('')} aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
        </label>
      </div>

      <button type="button" onClick={() => go('/staff/workspace')} className="msg-channel-shortcut">
        <span className="msg-channel-icon"><Hash className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-semibold">Team channels</span>
          <span className="block text-[11px] text-slate-400">{channels.length} channel{channels.length === 1 ? '' : 's'} · workspace conversations</span>
        </span>
        <span className="text-slate-300">›</span>
      </button>

      <div className="msg-sidebar-list">
        {error && <p role="alert" className="msg-inline-error">{error}</p>}
        {loading ? <p className="msg-list-status"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading conversations…</p> : null}
        {!loading && !recent.length && !people.length ? <p className="msg-list-status">No conversations found.</p> : null}
        {!!recent.length && <p className="msg-section-label">Recent chats</p>}
        {recent.map((item) => <SidebarRow key={item.id} item={item} active={activeId === item.id} onSelect={onSelect} onCall={onCall} calling={callingId === item.userId} />)}
        {!!people.length && <p className="msg-section-label msg-section-spaced">People</p>}
        {people.map((item) => <SidebarRow key={item.id} item={item} active={false} onSelect={onSelect} onCall={onCall} calling={callingId === item.userId} />)}
      </div>
    </aside>
  );
}

function MessageBubble({ message, mine, showSender, query, onReact }) {
  const body = message.body || '';
  const matched = query && body.toLowerCase().includes(query.toLowerCase());
  return (
    <div className={`msg-bubble-row ${mine ? 'is-mine' : ''}`}>
      <article className={`msg-bubble ${mine ? 'is-mine' : ''} ${matched ? 'is-match' : ''}`}>
        {!mine && showSender && <p className="msg-sender">{message.sender_name || 'Teammate'}</p>}
        {body && <p className="msg-text">{body}</p>}
        {(message.attachments || []).map((attachment) => (
          <a key={attachment.id} href={`${API_ORIGIN}${attachment.url}`} target="_blank" rel="noreferrer" className="msg-attachment">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{attachment.name}</span>
          </a>
        ))}
        {(message.reactions?.length > 0 || body) && <div className="msg-reactions">
          {message.reactions?.map((reaction) => <button key={reaction.emoji} type="button" onClick={() => onReact(message.id, reaction.emoji)} className={reaction.reacted ? 'is-reacted' : ''} aria-label={`React ${reaction.emoji}`}>{reaction.emoji}<span>{reaction.count}</span></button>)}
          {body && <button type="button" onClick={() => onReact(message.id, '👍')} className="msg-add-reaction" aria-label="Like message">＋</button>}
        </div>}
        <div className="msg-meta">
          {message.edited_at && <span>edited</span>}
          <time>{shortTime(message.created_at)}</time>
          {mine && <Check className="h-3.5 w-3.5" aria-label="Sent" />}
        </div>
      </article>
    </div>
  );
}

function MessageList({ groups, messagesLoading, typing, query, onReact, listRef }) {
  const matches = useMemo(() => {
    if (!query) return 0;
    const needle = query.toLowerCase();
    return groups.reduce((total, group) => total + group.messages.filter((message) => `${message.body || ''} ${message.sender_name || ''}`.toLowerCase().includes(needle)).length, 0);
  }, [groups, query]);

  return (
    <div ref={listRef} className="msg-message-area" aria-live="polite">
      {query && <p className="msg-search-summary">{matches} match{matches === 1 ? '' : 'es'} in loaded messages</p>}
      {messagesLoading ? <p className="msg-list-status"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading messages…</p> : null}
      {!messagesLoading && !groups.length ? <div className="msg-thread-empty"><MessageCircleGlyph /><p>No messages yet. Say hello.</p></div> : null}
      {groups.map((group) => <div key={group.key} className="msg-day-group">
        <div className="msg-day-separator"><span>{group.label}</span></div>
        {group.messages.map((message, index) => {
          const previous = group.messages[index - 1];
          const showSender = !previous || previous.sender_id !== message.sender_id;
          return <MessageBubble key={message.id} message={message} mine={message.mine} showSender={showSender} query={query} onReact={onReact} />;
        })}
      </div>)}
      {typing && <div className="msg-typing-row" aria-hidden="true">
        <div className="msg-bubble msg-typing"><span /><span /><span /></div>
        <span className="msg-typing-label">{typing}</span>
      </div>}
    </div>
  );
}

function MessageCircleGlyph() {
  return <span className="msg-empty-glyph"><Users className="h-7 w-7" /></span>;
}

function Composer({ value, onChange, onBlur, onSend, files, onFiles, busy, disabled, placeholder }) {
  const [emojisOpen, setEmojisOpen] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend(event);
    }
  }

  return (
    <form className="msg-composer" onSubmit={onSend}>
      {emojisOpen && <div className="msg-emoji-panel" role="menu" aria-label="Emoji picker">
        {['😀', '😂', '👍', '❤️', '🙏', '🎉', '👏', '✅', '🔥', '👋'].map((emoji) => <button key={emoji} type="button" onClick={() => { onChange(`${value}${emoji}`); setEmojisOpen(false); inputRef.current?.focus(); }}>{emoji}</button>)}
      </div>}
      {!!files.length && <div className="msg-pending-files">
        {files.map((file, index) => <span key={`${file.name}-${index}`}>{file.name.slice(0, 28)}<button type="button" onClick={() => onFiles(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><X className="h-3 w-3" /></button></span>)}
      </div>}
      <div className="msg-composer-box">
        <input ref={fileRef} type="file" multiple hidden accept="image/*,video/mp4,video/webm,application/pdf" onChange={(event) => { onFiles(Array.from(event.target.files || []).slice(0, 5)); event.target.value = ''; }} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach files" title="Attach files" disabled={disabled}><Paperclip className="h-5 w-5" /></button>
        <button type="button" onClick={() => setEmojisOpen((open) => !open)} aria-label="Emojis" title="Emojis" disabled={disabled}><Smile className="h-5 w-5" /></button>
        <textarea ref={inputRef} rows={1} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={disabled} aria-label="Message" />
        <button type="submit" className="msg-send" disabled={disabled || busy || (!value.trim() && !files.length)} aria-label="Send message" title="Send message">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="msg-composer-hint">{busy ? 'Sending…' : 'Enter to send · Shift + Enter for a new line'}</p>
    </form>
  );
}

export default function MessagingShell({
  user, sidebar, active, groups, messagesLoading, typing, onReact, onBack, onCall, calling,
  onViewProfile, draft, onDraftChange, onDraftBlur, onSend, files, onFiles, sending, error,
}) {
  const [conversationSearchOpen, setConversationSearchOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (conversationSearch) return;
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [groups.length, typing, conversationSearch]);

  useEffect(() => {
    setConversationSearch('');
    setConversationSearchOpen(false);
    setHeaderMenuOpen(false);
  }, [active?.id]);

  return (
    <div className={`messaging-app ${active ? 'has-active' : ''}`}>
      <div className="msg-shell">
        <MessagingSidebar user={user} {...sidebar} />
        <main className="msg-main">
          {active ? <>
            <header className="msg-chat-header">
              <button type="button" onClick={onBack} className="msg-back" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></button>
              <MessagingAvatar avatar={avatarSrc(active.avatar)} name={active.name} online={active.online} size={40} />
              <div className="msg-chat-identity">
                <p className="msg-chat-name">{active.name}</p>
                <p
                  className={`msg-chat-status ${typing ? 'is-typing' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {typing || (active.online ? 'Online' : active.subtitle || 'Last seen recently')}
                </p>
              </div>
              <div className="msg-chat-actions">
                <button type="button" onClick={() => setConversationSearchOpen((open) => !open)} aria-label="Search in conversation" title="Search in conversation"><Search className="h-[18px] w-[18px]" /></button>
                <button type="button" onClick={onCall} disabled={calling} aria-label="Start call" title="Start call">{calling ? <LoaderCircle className="h-[18px] w-[18px] animate-spin" /> : <Phone className="h-[18px] w-[18px]" />}</button>
                <button type="button" onClick={() => setHeaderMenuOpen((open) => !open)} aria-label="More options" title="More options"><MoreVertical className="h-[18px] w-[18px]" /></button>
                {headerMenuOpen && <div className="msg-header-menu">
                  <button type="button" onClick={() => { setHeaderMenuOpen(false); onCall(); }} disabled={calling}><Phone className="h-4 w-4" />Start call</button>
                  <button type="button" onClick={() => { setHeaderMenuOpen(false); onViewProfile(); }}><UserRound className="h-4 w-4" />Team directory</button>
                  <button type="button" onClick={() => { setHeaderMenuOpen(false); onBack(); }}><ArrowLeft className="h-4 w-4" />Back to chats</button>
                </div>}
              </div>
            </header>
            {conversationSearchOpen && <div className="msg-conversation-search">
              <Search className="h-4 w-4" />
              <input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search this conversation" aria-label="Search this conversation" />
              <button type="button" onClick={() => { setConversationSearch(''); setConversationSearchOpen(false); }} aria-label="Close conversation search"><X className="h-4 w-4" /></button>
            </div>}
            {error && <p role="alert" className="msg-alert">{error}</p>}
            <MessageList groups={groups} messagesLoading={messagesLoading} typing={typing} query={conversationSearch} onReact={onReact} listRef={listRef} />
            <Composer value={draft} onChange={onDraftChange} onBlur={onDraftBlur} onSend={onSend} files={files} onFiles={onFiles} busy={sending} disabled={messagesLoading} placeholder="Type a message" />
          </> : <div className="msg-empty-state">
            <span className="msg-empty-art"><Users className="h-12 w-12" /><i /><i /></span>
            <h2>Keep your conversations going.</h2>
            <p>Select a conversation to start messaging.</p>
            {error && <p role="alert" className="msg-alert">{error}</p>}
          </div>}
        </main>
      </div>
    </div>
  );
}
