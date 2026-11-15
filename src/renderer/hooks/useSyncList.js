import { useCallback, useEffect, useRef, useState } from 'react';

// Fallback in case an event is missed (e.g. sync started before the window was ready)
const POLL_INTERVAL_MS = 5000;

function useSyncList(options) {
  const [data, setData] = useState();
  const dataRef = useRef(data);
  dataRef.current = data;

  const actionRefresh = useCallback(async () => {
    const d = await window.EA('GET_SYNC_LIST');
    setData(d);
  }, []);

  // Initial load + periodic refresh
  useEffect(() => {
    if (options?.skip) {
      return;
    }
    actionRefresh();
    const interval = setInterval(actionRefresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [options?.skip, actionRefresh]);

  // Live updates pushed by the backend
  useEffect(() => {
    if (options?.skip) {
      return;
    }
    const unsubscribeProgress = window.EAEvents('SYNC_PROGRESS', (evt, state) => {
      // Unknown item: it was added after the last fetch
      if (Array.isArray(dataRef.current) && !dataRef.current.some((item) => item.fileName === state?.fileName)) {
        actionRefresh();
        return;
      }
      setData((items) => (Array.isArray(items) ? items.map((item) => (item.fileName === state?.fileName ? { ...item, ...state } : item)) : items));
    });
    const unsubscribeList = window.EAEvents('SYNC_LIST_UPDATED', () => actionRefresh());
    return () => {
      unsubscribeProgress();
      unsubscribeList();
    };
  }, [options?.skip, actionRefresh]);

  return {
    items: Array.isArray(data) ? data : [],
    isLoading: !Array.isArray(data),
    actions: {
      refresh: actionRefresh,
    },
  };
}

export default useSyncList;
