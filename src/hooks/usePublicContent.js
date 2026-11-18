import { useEffect, useState } from 'react';
import { API_BASE, API_CONFIGURED } from '../utils/api';

export default function usePublicContent(type, fallback, transform = (item) => item) {
  const [items, setItems] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_CONFIGURED) {
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    fetch(`${API_BASE}/content/${type}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Content unavailable'))))
      .then(({ items: remote = [] }) => {
        if (remote.length) {
          const remoteItems = remote.map(transform);
          const bySlug = new Map(remoteItems.map((item) => [item.slug, item]));
          const local = fallback.map((item) => {
            const replacement = bySlug.get(item.slug) || {};
            const definedValues = Object.fromEntries(Object.entries(replacement).filter(([, value]) => value !== undefined));
            return { ...item, ...definedValues };
          });
          const localSlugs = new Set(fallback.map((item) => item.slug));
          setItems([...remoteItems.filter((item) => !localSlugs.has(item.slug)), ...local]);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') console.info(`Using built-in ${type} content until the API is available.`);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [type, fallback, transform]);

  return { items, loading };
}
