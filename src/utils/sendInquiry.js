import { apiRequest } from './api';

export async function sendInquiry(form) {
  const hasFiles = Array.isArray(form.files) && form.files.length > 0;
  let body;
  let headers = {};
  if (hasFiles) {
    const fd = new FormData();
    ['name', 'phone', 'email', 'service', 'message'].forEach((key) => {
      if (form[key] != null) fd.append(key, form[key]);
    });
    form.files.forEach((item) => {
      const file = item?.file || item;
      if (file instanceof File || file instanceof Blob) fd.append('files', file, file.name || item?.name || 'drawing');
    });
    body = fd;
  } else {
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({ ...form, files: [] });
  }

  return apiRequest('/contact', { method: 'POST', body, headers, timeout: 60000 });
}
