import { useCallback, useEffect, useState } from 'react';

function useSyncList(options) {
  const [data, setData] = useState();

  // Initial load
  useEffect(() => {
    if (!options?.skip) {
      window.EA('GET_SYNC_LIST').then((d) => {
        setData(d);
      });
    }
  }, [options?.skip]);

  // Live upload progress pushed by the backend
  useEffect(() => {
    if (options?.skip) {
      return;
    }
    return window.EAEvents('SYNC_PROGRESS', (evt, state) => {
      setData((items) => (Array.isArray(items) ? items.map((item) => (item.fileName === state?.fileName ? { ...item, ...state } : item)) : items));
    });
  }, [options?.skip]);

  // Action refresh
  const actionRefresh = useCallback(async () => {
    window.EA('GET_SYNC_LIST').then((d) => {
      setData(d);
    });
  }, []);

  return {
    items: Array.isArray(data) ? data : [],
    isLoading: !Array.isArray(data),
    actions: {
      refresh: actionRefresh,
    },
  };
}

export default useSyncList;
