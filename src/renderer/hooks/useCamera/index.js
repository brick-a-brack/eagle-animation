import { useCallback, useEffect, useRef, useState } from 'react';

import { getCamera, getCameras, takePicture } from './modules';

const applyCameraLabel = (e, i) => ({ ...e, label: `[${i + 1}] ${e.label || ''}` });

function useCamera(options = {}) {
  const compatibilityMode = !!options?.compatibilityMode;
  const [devices, setDevices] = useState(null);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState([]);
  const setStreamRef = useRef(null);
  const eventsRefs = useRef([
    ...(typeof options?.eventsHandlers?.connect === 'function' ? [['connect', options?.eventsHandlers?.connect]] : []),
    ...(typeof options?.eventsHandlers?.disconnect === 'function' ? [['disconnect', options?.eventsHandlers?.disconnect]] : []),
  ]);

  // Derived from currentCameraId. getCamera() caches its instances, so this
  // returns a stable reference for a given id across renders (safe to use in
  // effect/callback dependency arrays) — no need to keep it in a state.
  const currentCamera = currentCameraId ? getCamera(currentCameraId) : null;

  // Load cameras list at setup; refresh when compatibility mode toggles.
  // We invalidate the current devices list (and selection) while the new one is
  // being fetched so consumers don't keep using a list that no longer matches
  // the active mode (which would lead to wrong default-camera fallbacks).
  useEffect(() => {
    let cancelled = false;
    setDevices(null);
    setCurrentCameraId(null);
    getCameras(compatibilityMode).then((cameras) => {
      if (cancelled) return;
      setDevices(cameras.map(applyCameraLabel));
    });
    return () => {
      cancelled = true;
    };
  }, [compatibilityMode]);

  // Trigger event
  const triggerEvent = useCallback((name, data = null) => {
    if (['connect', 'disconnect'].includes(name)) {
      setIsReady(name === 'connect');
    }
    for (const event of eventsRefs.current) {
      try {
        if (event[0] === name && typeof event[1] === 'function') {
          event[1](name, data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Action refresh devices list
  const actionRefreshDevices = useCallback(() => {
    getCameras(compatibilityMode).then((cameras) => setDevices(cameras.map(applyCameraLabel)));
  }, [compatibilityMode]);

  // Action to set stream callback
  const actionSetStream = useCallback(
    async (setStream) => {
      setStreamRef.current = setStream;
      if (currentCamera) {
        await currentCamera.connect({ setStream: setStreamRef.current }, options, () => {
          getCameras(compatibilityMode).then((cameras) => setDevices(cameras.map(applyCameraLabel)));
        });
        triggerEvent('connect');
        currentCamera.getCapabilities().then(setCameraCapabilities);
      }
    },
    [currentCamera, options, triggerEvent, compatibilityMode]
  );

  // Action set camera
  const actionSetCamera = useCallback(
    async (cameraId) => {
      const cameras = await getCameras(compatibilityMode);
      const deviceId = cameras.find((e) => e.id === cameraId)?.id || (!cameraId ? cameras?.[0]?.id || null : null);
      if (deviceId !== currentCameraId) {
        if (currentCamera) {
          try {
            currentCamera?.disconnect();
          } catch (e) {
            console.error(e);
          }
          triggerEvent('disconnect');
        }
        if (deviceId) {
          setCurrentCameraId(deviceId);
          const camera = getCamera(deviceId);
          if (setStreamRef?.current) {
            await camera?.connect({ setStream: setStreamRef.current }, options);
            await getCameras(compatibilityMode).then((cameras) => setDevices(cameras.map(applyCameraLabel)));
            triggerEvent('connect');
          }
          camera?.getCapabilities().then(setCameraCapabilities);
        } else {
          setCurrentCameraId(null);
          setCameraCapabilities([]);
        }
      }

      // Force refresh devices list, to handle permission issues on specific browsers
      getCameras(compatibilityMode).then((cameras) => setDevices(cameras.map(applyCameraLabel)));
    },
    [currentCameraId, currentCamera, options, triggerEvent, compatibilityMode]
  );

  // Action take picture
  const actionTakePicture = useCallback(
    async (nbFramesToTake = 1, reverseX = false, reverseY = false) => {
      if (currentCamera) {
        return takePicture(currentCamera, nbFramesToTake, reverseX, reverseY);
      }
      return null;
    },
    [currentCamera]
  );

  // Add event listener
  const actionAddEventListener = useCallback(async (name, callback) => {
    eventsRefs.current.push([name, callback]);
  }, []);

  // Remove event listener
  const actionRemoveEventListener = useCallback(async (name, callback) => {
    eventsRefs.current = eventsRefs.current.filter((e) => e[0] !== name || e[1] !== callback);
  }, []);

  // Action set capability
  const actionSetCapability = useCallback(
    async (id, value) => {
      if (currentCamera) {
        await currentCamera?.applyCapability(id, value);
        const newState = await currentCamera?.getCapabilities();
        setCameraCapabilities(newState);
      }
    },
    [currentCamera]
  );

  useEffect(() => {
    return () => {
      if (currentCamera) {
        try {
          currentCamera?.disconnect();
        } catch (e) {
          console.error(e);
        }
        triggerEvent('disconnect');
      }
    };
  }, [currentCamera, triggerEvent]);

  const isCurrentCameraConnected = currentCameraId && devices && devices.some((e) => `${e.id}` === `${currentCameraId}`);

  return {
    isCameraReady: isCurrentCameraConnected && isReady,
    devices,
    currentCameraId: isCurrentCameraConnected ? currentCameraId : null,
    currentCameraCapabilities: isCurrentCameraConnected ? cameraCapabilities || [] : [],
    currentCamera: (isCurrentCameraConnected && isReady ? currentCamera : null) || null,
    actions: {
      setStream: actionSetStream,
      setCamera: actionSetCamera,
      refreshDevices: actionRefreshDevices,
      takePicture: actionTakePicture,
      setCapability: actionSetCapability,
      addEventListener: actionAddEventListener,
      removeEventListener: actionRemoveEventListener,
    },
  };
}

export default useCamera;
