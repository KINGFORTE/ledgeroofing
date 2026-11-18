import { API_BASE } from './api';

export async function sendInquiry(form) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });

  if (!res.ok) {
    throw new Error('Failed to send inquiry');
  }

  return res.json();
}
