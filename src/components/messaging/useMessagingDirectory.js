import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, apiRequest } from '../../utils/api';
import { isNativeApp } from '../../utils/notifications';

const API_ORIGIN = API_BASE.replace(/\/api$/, '');

export function avatarSrc(value) {
  if (!value) return null;
  return String(value).startsWith('http') ? String(value) : `${API_ORIGIN}${value}`;
}

export function initials(name = '') {
  return String(name).split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'LR';
}

export function shortTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function useMessagingDirectory({ user, conversationId = null, onChatMessage, onMessageUpdated, onTyping }) {
  const [staff, setStaff] = useState([]);
  const [dms, setDms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const handlersRef = useRef({ onChatMessage, onMessageUpdated, onTyping });
  handlersRef.current = { onChatMessage, onMessageUpdated, onTyping };

  const refresh = useCallback(async () => {
    const [dmResult, staffResult, channelResult] = await Promise.all([
      apiRequest('/workspace/direct-messages'),
      apiRequest('/workspace/staff'),
      apiRequest('/workspace/channels').catch(() => ({ channels: [] })),
    ]);
    setDms(dmResult.conversations || []);
    setStaff((staffResult.staff || []).filter((person) => person.id !== user.id));
    setChannels(channelResult.channels || []);
  }, [user.id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    refresh()
      .catch((requestError) => { if (alive) setError(requestError.message || 'Could not load conversations.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    const socket = io(API_ORIGIN, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      auth: { platform: isNativeApp() ? 'android' : 'web' },
    });
    socketRef.current = socket;
    if (conversationId) socket.emit('conversation:join', conversationId);

    socket.on('presence:list', (members) => {
      setOnlineIds(new Set((members || []).filter((member) => member.online).map((member) => member.userId)));
    });
    socket.on('presence:update', (update) => {
      setOnlineIds((previous) => {
        const next = new Set(previous);
        if (update.online) next.add(update.userId);
        else next.delete(update.userId);
        return next;
      });
    });
    socket.on('message:new', (message) => {
      setDms((items) => {
        const index = items.findIndex((item) => item.conversation_id === message.conversation_id);
        const updated = index >= 0
          ? {
            ...items[index],
            last_message_at: message.created_at,
            last_body: message.body || 'Sent an attachment',
            last_sender_id: message.sender_id,
            unread_count: message.sender_id !== user.id ? Number(items[index].unread_count || 0) + 1 : 0,
          }
          : {
            conversation_id: message.conversation_id,
            user_id: message.sender_id,
            name: message.sender_name || 'Teammate',
            email: '',
            last_message_at: message.created_at,
            last_body: message.body || 'Sent an attachment',
            last_sender_id: message.sender_id,
            unread_count: message.sender_id !== user.id ? 1 : 0,
          };
        const next = index >= 0 ? [...items] : [updated, ...items];
        if (index >= 0) next[index] = updated;
        return next.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
      });
      if (conversationId && message.conversation_id === conversationId) {
        handlersRef.current.onChatMessage?.(message);
        if (message.sender_id !== user.id) {
          void apiRequest('/workspace/notifications/read-messages', { method: 'POST' })
            .then(() => window.dispatchEvent(new Event('ledge:messages-read')))
            .catch(() => {});
        }
      }
    });
    socket.on('message:updated', (message) => {
      if (conversationId && message.conversation_id === conversationId) handlersRef.current.onMessageUpdated?.(message);
    });
    socket.on('typing:update', (update) => {
      if (conversationId && update.conversationId === conversationId) handlersRef.current.onTyping?.(update);
    });
    socket.on('notification:new', (notification) => {
      if (notification.kind === 'new_message') void refresh().catch(() => {});
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, refresh, user.id]);

  const markConversationRead = useCallback((id) => {
    setDms((items) => items.map((item) => item.conversation_id === id ? { ...item, unread_count: 0 } : item));
  }, []);

  const startDirectMessage = useCallback(async (person) => {
    const result = await apiRequest('/workspace/direct-messages', {
      method: 'POST',
      body: JSON.stringify({ userId: person.id }),
    });
    setDms((items) => items.some((item) => item.conversation_id === result.conversationId)
      ? items
      : [{
        conversation_id: result.conversationId,
        user_id: person.id,
        name: person.name,
        email: person.email,
        last_message_at: new Date().toISOString(),
      }, ...items]);
    return result.conversationId;
  }, []);

  const items = useMemo(() => {
    const byUser = new Map(staff.map((person) => [person.id, person]));
    const recent = dms.map((dm) => {
      const profile = byUser.get(dm.user_id);
      return {
        kind: 'dm',
        id: dm.conversation_id,
        userId: dm.user_id,
        name: dm.name || profile?.name || 'Teammate',
        email: dm.email || profile?.email || '',
        role: profile?.role || '',
        avatar: profile?.avatarUrl || null,
        online: onlineIds.has(dm.user_id),
        lastBody: dm.last_body || '',
        lastAt: dm.last_message_at || null,
        unread: Number(dm.unread_count || 0),
        mine: dm.last_sender_id === user.id,
      };
    }).sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0) || a.name.localeCompare(b.name));
    const people = staff
      .filter((person) => !dms.some((dm) => dm.user_id === person.id))
      .map((person) => ({
        kind: 'person',
        id: person.id,
        userId: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        avatar: person.avatarUrl,
        online: onlineIds.has(person.id),
        lastBody: 'Start a conversation',
        lastAt: null,
        unread: 0,
      }));
    return { recent, people };
  }, [dms, staff, onlineIds, user.id]);

  return {
    staff,
    dms,
    channels,
    onlineIds,
    loading,
    error,
    refresh,
    startDirectMessage,
    markConversationRead,
    socketRef,
    items,
    setError,
  };
}
