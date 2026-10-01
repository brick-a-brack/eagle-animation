import { useEffect } from 'react';

function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) {
      return;
    }

    let active = true;
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (active) {
          wakeLock = lock;
        } else {
          lock.release().catch(() => {});
        }
      } catch (err) {} // eslint-disable-line no-empty
    };

    // The wake lock is automatically released when the page is hidden, re-request it when visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLock?.release().catch(() => {});
    };
  }, []);
}

export default useWakeLock;
