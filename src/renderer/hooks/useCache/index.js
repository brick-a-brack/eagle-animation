import { useCallback, useEffect, useState } from 'react';

// `enabled` mirrors the CLEAR_CACHE capability: on backends without it the
// actions do not exist, so there is nothing to ask for.
function useCache(enabled = true) {
  const [size, setSize] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  // Action refresh the cache size
  const actionRefreshCacheSize = useCallback(async () => {
    if (!enabled) {
      setSize(null);
      return;
    }
    try {
      const cacheSize = await window.EA('GET_CACHE_SIZE');
      setSize(typeof cacheSize === 'number' ? cacheSize : null);
    } catch {
      setSize(null);
    }
  }, [enabled]);

  // Initial load
  useEffect(() => {
    actionRefreshCacheSize();
  }, [actionRefreshCacheSize]);

  // Action clear the cache
  const actionClearCache = useCallback(async () => {
    if (!enabled) return;
    setIsClearing(true);
    try {
      await window.EA('CLEAR_CACHE');
    } catch {
      // Ignored, the refresh below reflects whatever was actually freed
    }
    await actionRefreshCacheSize();
    setIsClearing(false);
  }, [enabled, actionRefreshCacheSize]);

  return {
    size,
    isClearing,
    actions: {
      refreshCacheSize: actionRefreshCacheSize,
      clearCache: actionClearCache,
    },
  };
}

export default useCache;
