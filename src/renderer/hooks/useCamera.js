import { useState, useEffect, useCallback, useRef } from 'react';

import { getCamera, getCameras, takePicture } from '../cameras';

const applyCameraLabel = (e, i) => ({ ...e, label: `[${i}] ${e.label || ''}` });

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
  const [cameraCapabilities, setCameraCapabilities] = useState([]);
  const domRefs = useRef(null);

  // Initial load
  useEffect(() => {
    getCameras().then((cameras) => setDevices(cameras.map(applyCameraLabel)));
  }, []);

  // Battery refresh
  useEffect(() => {
    currentCamera?.batteryStatus()?.then(setBatteryStatus);
    const batteryInterval = setInterval(() => {
      currentCamera?.batteryStatus().then(setBatteryStatus);
    }, 10000);
    return () => clearInterval(batteryInterval);
  }, []);

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
      await currentCamera.connect({ videoDOM: domRefs.current.videoDOM, imageDOM: domRefs.current.imageDOM }, options);
      flushCanvas(domRefs.current.imageDOM);
      currentCamera?.batteryStatus().then(setBatteryStatus);
      currentCamera.getCapabilities().then(setCameraCapabilities);
    }
  });

  // Action set camera
  const actionSetCamera = useCallback(async (cameraId) => {
    if (cameraId !== currentCameraId) {
      if (currentCamera) {
        currentCamera?.disconnect();
        flushCanvas(domRefs.current.imageDOM);
      }
      if (cameraId) {
        setCurrentCameraId(cameraId);
        const camera = getCamera(cameraId);
        if (domRefs?.current?.videoDOM && domRefs?.current?.imageDOM) {
          await camera?.connect({ videoDOM: domRefs?.current?.videoDOM, imageDOM: domRefs?.current?.imageDOM }, options);
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
  });

  // Action take picture
  const actionTakePicture = useCallback((nbFramesToTake = 1) => {
    if (currentCamera) {
      return takePicture(currentCamera, nbFramesToTake);
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
    devices,
    currentCameraId,
    currentCameraCapabilities: cameraCapabilities || [],
    currentCamera: currentCamera || null,
    batteryStatus: batteryStatus || null,
    actions: {
      setDomRefs: actionSetDomRefs,
      setCamera: actionSetCamera,
      refreshDevices: actionRefreshDevices,
      takePicture: actionTakePicture,
      capabilitiesReset: actionCapabilitesReset,
      setCapability: actionSetCapability,
    },
  };
}

export default useCamera;
