import { useCallback, useEffect, useState } from 'react';

function useSender() {
  const [queue, setQueue] = useState([]);

  // Initial load
  /* useEffect(() => {
    window.EA('APP_CAPABILITIES').then((capabilities) => {
      setAppCapabilities(capabilities);
    });
  }, []);

  // Action refresh
  const actionRefreshAppCapabilities = useCallback(async () => {
    const capabilities = await window.EA('APP_CAPABILITIES');
    setAppCapabilities(capabilities);
  }, []);*/

  return {
    queue,
    actions: {
      addTaskToQueue: null,
      removeTaskFromQueue: null,
    },
  };
}

export default useSender;
