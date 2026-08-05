import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title
      ? `${title} | Ledge Roofing`
      : 'Ledge Roofing — Building Strong Roofs. Protecting Homes.';
  }, [title]);
}
