import { useEffect, useRef } from 'react';

/**
 * Auto-refresh data setiap `interval` ms + langsung refresh saat tab aktif kembali.
 * @param {Function} fetchFn - fungsi fetch data
 * @param {number} interval - interval polling dalam ms (default 15 detik)
 */
export function useAutoRefresh(fetchFn, interval = 15000) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    const tick = () => fetchRef.current();

    // Polling interval
    const id = setInterval(tick, interval);

    // Refresh saat user kembali ke tab
    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [interval]);
}
