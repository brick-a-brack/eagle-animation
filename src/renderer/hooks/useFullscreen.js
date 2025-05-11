import { useCallback, useLayoutEffect, useState } from 'react';

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Initial load
  useLayoutEffect(() => {
    const callback = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', callback);
    return () => document.removeEventListener('fullscreenchange', callback);
  }, []);

  // Action enable
  const actionEnable = useCallback(async () => {
    document.body.requestFullscreen();
  });

  // Action disable
  const actionDisable = useCallback(async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  });

  return {
    enterFullscreen: actionEnable,
    exitFullscreen: actionDisable,
    isFullscreen,
  };
}

export default useFullscreen;
