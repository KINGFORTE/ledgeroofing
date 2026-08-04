import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title
      ? `${title} | Lege Roofing`
      : 'Lege Roofing — Building Strong Roofs. Protecting Homes.';
  }, [title]);
}
