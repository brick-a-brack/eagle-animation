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

  // Action refresh
  const actionRefresh = useCallback(async () => {
    window.EA('GET_SYNC_LIST').then((d) => {
      setData(d);
    });
  }, []);

  return {
    items: Array.isArray(data) ? data : [],
    actions: {
      refresh: actionRefresh,
    },
  };
}

export default useSyncList;
