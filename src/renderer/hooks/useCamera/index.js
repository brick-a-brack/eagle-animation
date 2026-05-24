import { useCallback, useEffect, useRef, useState } from 'react';

import { getCamera, getCameras, takePicture } from './modules';

const applyCameraLabel = (e, i) => ({ ...e, label: `[${i + 1}] ${e.label || ''}` });

function useCamera(options = {}) {
  const [devices, setDevices] = useState(null);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [currentCamera, setCurrentCamera] = useState(undefined);
  const [isReady, setIsReady] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState([]);
  const setStreamRef = useRef(null);
  const eventsRefs = useRef([
    ...(typeof options?.eventsHandlers?.connect === 'function' ? [['connect', options?.eventsHandlers?.connect]] : []),
    ...(typeof options?.eventsHandlers?.disconnect === 'function' ? [['disconnect', options?.eventsHandlers?.disconnect]] : []),
  ]);

  // Load cameras list at setup
  useEffect(() => {
    getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
  }, []);

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
    getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
  }, []);

  // Action to set stream callback
  const actionSetStream = useCallback(
    async (setStream) => {
      setStreamRef.current = setStream;
      if (currentCamera) {
        await currentCamera.connect({ setStream: setStreamRef.current }, options, () => {
          getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
        });
        triggerEvent('connect');
        currentCamera.getCapabilities().then(setCameraCapabilities);
      }
    },
    [currentCamera, options, triggerEvent]
  );

  // Action set camera
  const actionSetCamera = useCallback(
    async (cameraId) => {
      const cameras = await getCameras();
      const deviceId = cameras.find((e) => e.id === cameraId)?.id || cameras?.[0]?.id || null;
      if (deviceId !== currentCameraId) {
        if (currentCamera) {
          setCurrentCameraId(null);
          setCurrentCamera(null);
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
            await getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
            triggerEvent('connect');
          }
          setCurrentCamera(camera);
          camera?.getCapabilities().then(setCameraCapabilities);
        } else {
          setCurrentCameraId(null);
          setCurrentCamera(null);
          setCameraCapabilities([]);
        }
      }

      // Force refresh devices list, to handle permission issues on specific browsers
      getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
    },
    [currentCameraId, currentCamera, options, triggerEvent]
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

  console.log(currentCameraId, devices);

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
