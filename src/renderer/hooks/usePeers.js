import { getToucanCameraServerHeaders, getToucanCameraServerUrl } from '@core/toucanCameraServer';
import { useCallback, useEffect, useState } from 'react';

// Fetch the registered peers from the Toucan Camera Server
const fetchPeers = async () => {
  const peers = await fetch(`${getToucanCameraServerUrl()}peers`, {
    method: 'GET',
    headers: {
      ...getToucanCameraServerHeaders(),
    },
  }).then((res) => res.json());

  return Array.isArray(peers) ? peers : [];
};

function usePeers(options = {}) {
  const [peers, setPeers] = useState([]);
  const [isLoading, setIsLoading] = useState(!options?.skip);

  // Action refresh peers list
  const actionRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPeers();
      setPeers(data);
      setIsLoading(false);
      return data;
    } catch (err) {
      console.error(err);
      setPeers([]);
      setIsLoading(false);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (options?.skip) {
      return;
    }

    let cancelled = false;

    fetchPeers()
      .catch((err) => {
        console.error(err);
        return [];
      })
      .then((data) => {
        if (!cancelled) {
          setPeers(data);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [options?.skip]);

  // Action add a peer — url may be "host:port" or "http://host:port", token is optional.
  // The server checks reachability/token and rejects invalid peers, so we surface failures.
  const actionAdd = useCallback(
    async (url, token = null) => {
      const res = await fetch(`${getToucanCameraServerUrl()}peers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getToucanCameraServerHeaders(),
        },
        body: JSON.stringify({ url, ...(token ? { token } : {}) }),
      });

      if (!res.ok) {
        const message = await res.text().catch(() => '');
        throw new Error(message || `Failed to add peer (${res.status})`);
      }

      const peer = await res.json().catch(() => null);
      await actionRefresh();
      return peer;
    },
    [actionRefresh]
  );

  // Action remove a peer by its id
  const actionRemove = useCallback(
    async (peerId) => {
      const res = await fetch(`${getToucanCameraServerUrl()}peers/${peerId}`, {
        method: 'DELETE',
        headers: {
          ...getToucanCameraServerHeaders(),
        },
      });

      if (!res.ok) {
        const message = await res.text().catch(() => '');
        throw new Error(message || `Failed to remove peer (${res.status})`);
      }

      await actionRefresh();
      return true;
    },
    [actionRefresh]
  );

  return {
    peers,
    isLoading,
    actions: {
      refresh: actionRefresh,
      add: actionAdd,
      remove: actionRemove,
    },
  };
}

export default usePeers;
