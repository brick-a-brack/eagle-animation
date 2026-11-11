import { useEffect, useState } from 'react';

function useOscStatus(enabled = true) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    window.EA('OSC_GET_STATUS').then(setStatus);
    return window.EAEvents('OSC_STATUS', (evt, newStatus) => setStatus(newStatus));
  }, [enabled]);

  return { status };
}

export default useOscStatus;
