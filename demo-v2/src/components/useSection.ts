import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Section links (/page?s=name) scroll to the element with id `sec-name`. */
export function useSection() {
  const [sp] = useSearchParams();
  const k = sp.get('s');
  useEffect(() => {
    if (!k) return;
    const t = setTimeout(() => document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [k]);
}
