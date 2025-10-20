import { useCallback, useEffect, useState } from 'react';

function useAppCapabilities() {
  const [appCapabilities, setAppCapabilities] = useState([]);

  // Initial load
  useEffect(() => {
    window.EA('APP_CAPABILITIES').then((capabilities) => {
      setAppCapabilities(capabilities);
    });
  }, []);

  // Action refresh
  const actionRefreshAppCapabilities = useCallback(async () => {
    const capabilities = await window.EA('APP_CAPABILITIES');
    setAppCapabilities(capabilities);
  }, []);

  return {
    appCapabilities,
    actions: {
      refreshAppCapabilities: actionRefreshAppCapabilities,
    },
  };
}

export default useAppCapabilities;
