import { useCallback, useEffect, useRef, useState } from 'react';

import { getCamera, getCameras, takePicture } from '../cameras';

const applyCameraLabel = (e, i) => ({ ...e, label: `[${i + 1}] ${e.label || ''}` });

const flushCanvas = (dom) => {
  if (dom) {
    const ctx = dom.getContext('2d');
    ctx.clearRect(0, 0, dom.width, dom.height);
  }
};

function useCamera(options = {}) {
  const capabilitiesIntervals = useRef({});
  const [devices, setDevices] = useState(null);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [batteryStatus, setBatteryStatus] = useState(null);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState([]);
  const domRefs = useRef(null);
  const eventsRefs = useRef([
    ...(typeof options?.eventsHandlers?.connect === 'function' ? [['connect', options?.eventsHandlers?.connect]] : []),
    ...(typeof options?.eventsHandlers?.disconnect === 'function' ? [['disconnect', options?.eventsHandlers?.disconnect]] : []),
  ]);

  // Battery refresh
  useEffect(() => {
    currentCamera?.batteryStatus()?.then(setBatteryStatus);
    const batteryInterval = setInterval(() => {
      currentCamera?.batteryStatus().then(setBatteryStatus);
    }, 10000);
    return () => clearInterval(batteryInterval);
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
  });

  // Action refresh devices list
  const actionRefreshDevices = useCallback(() => {
    getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
  });

  // Action to set DOM refs
  const actionSetDomRefs = useCallback(async ({ videoDOM, imageDOM }) => {
    if (!domRefs.current) {
      domRefs.current = {};
    }
    domRefs.current.videoDOM = videoDOM;
    domRefs.current.imageDOM = imageDOM;
    if (currentCamera) {
      await currentCamera.connect({ videoDOM: domRefs.current.videoDOM, imageDOM: domRefs.current.imageDOM }, options, () => {
        getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
      });
      flushCanvas(domRefs.current.imageDOM);
      triggerEvent('connect');
      currentCamera?.batteryStatus().then(setBatteryStatus);
      currentCamera.getCapabilities().then(setCameraCapabilities);
    }
  });

  // Action set camera
  const actionSetCamera = useCallback(async (cameraId) => {
    const cameras = await getCameras();
    const deviceId = cameras.find((e) => e.id === cameraId)?.id || cameras?.[0]?.id || null;
    if (deviceId !== currentCameraId) {
      if (currentCamera) {
        setCurrentCameraId(null);
        setCurrentCamera(null);
        currentCamera?.disconnect();
        triggerEvent('disconnect');
        flushCanvas(domRefs.current.imageDOM);
      }
      if (deviceId) {
        setCurrentCameraId(deviceId);
        const camera = getCamera(deviceId);
        if (domRefs?.current?.videoDOM && domRefs?.current?.imageDOM) {
          await camera?.connect({ videoDOM: domRefs?.current?.videoDOM, imageDOM: domRefs?.current?.imageDOM }, options, () => {
            getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
          });
          triggerEvent('connect');
        }
        camera?.batteryStatus().then(setBatteryStatus);
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
  });

  // Action take picture
  const actionTakePicture = useCallback(async (nbFramesToTake = 1, reverseX = false, reverseY = false) => {
    if (currentCamera) {
      return takePicture(currentCamera, nbFramesToTake, reverseX, reverseY);
    }
    return null;
  });

  // Reset capabilities
  const actionCapabilitesReset = useCallback(async () => {
    setTimeout(async () => {
      if (currentCamera) {
        await currentCamera.resetCapabilities();
        capabilitiesIntervals.current = {};
        currentCamera.getCapabilities().then(setCameraCapabilities);
      }
    }, 0);
  });

  // Add event listener
  const actionAddEventListener = useCallback(async (name, callback) => {
    eventsRefs.current.push([name, callback]);
  });

  // Remove event listener
  const actionRemoveEventListener = useCallback(async (name, callback) => {
    eventsRefs.current = eventsRefs.current.filter((e) => e[0] !== name || e[1] !== callback);
  });

  // Action set capability
  const actionSetCapability = useCallback(async (id, value) => {
    clearTimeout(capabilitiesIntervals.current[id]);
    capabilitiesIntervals.current[id] = setTimeout(async () => {
      await currentCamera.applyCapability(id, value);
      capabilitiesIntervals.current[id] = null;
      currentCamera.getCapabilities().then((realState) => {
        setCameraCapabilities((oldState) => {
          return realState.map((e) => {
            return oldState.find((item) => item.id === e.id) || e;
          });
        });
      });
    }, 50);

    currentCamera.getCapabilities().then(() => {
      setCameraCapabilities((oldState) => oldState.map((e) => (e.id === id ? { ...e, id, value } : e)));
    });
  });

  return {
    isCameraReady: isReady,
    devices,
    currentCameraId,
    currentCameraCapabilities: cameraCapabilities || [],
    currentCamera: (isReady ? currentCamera : null) || null,
    batteryStatus: batteryStatus || null,
    actions: {
      setDomRefs: actionSetDomRefs,
      setCamera: actionSetCamera,
      refreshDevices: actionRefreshDevices,
      takePicture: actionTakePicture,
      capabilitiesReset: actionCapabilitesReset,
      setCapability: actionSetCapability,
      addEventListener: actionAddEventListener,
      removeEventListener: actionRemoveEventListener,
    },
  };
}

export default useCamera;
