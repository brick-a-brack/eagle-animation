import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import ActionsBar from '../components/ActionsBar';
import ControlBar from '../components/ControlBar';
import KeyboardHandler from '../components/KeyboardHandler';
import Player from '../components/Player';
import Timeline from '../components/Timeline';
import soundDelete from '~/resources/sounds/delete.mp3';
import soundShutter from '~/resources/sounds/shutter.mp3';
import soundError from '~/resources/sounds/error.mp3';
import DevicesInstance from '../core/Devices';
import { takePicture } from '../cameras';

const Camera = () => DevicesInstance.getMainCamera();

const timersApply = {};

let batteryInterval = null;

// Play sound
const playSound = (src, timeout = 2000) => {
  const e = document.createElement('audio');
  let clock = null;
  e.onended = function () {
    if (e) {
      e.remove();
    }
    clearTimeout(clock);
  };
  e.src = src;
  document.body.appendChild(e);
  e.play();
  clock = setTimeout(() => {
    if (e) {
      e.remove();
    }
  }, timeout);
};

// Get previous frame id
const getPreviousFrameId = (list, frameId) => {
  const frames = list.filter((pict) => !pict.deleted);
  if (frameId === false && frames.length) {
    return frames[frames.length - 1].id;
  }
  const frameIndex = frames.findIndex((f) => f.id === frameId);
  if (frameIndex === -1 || frameIndex === 0) {
    return frames[0].id;
  }
  return frames[frameIndex - 1].id;
};

// Get next frame id
const getNextFrameId = (list, frameId) => {
  const frames = list.filter((pict) => !pict.deleted);
  if (frameId === false) {
    return false;
  }
  const frameIndex = frames.findIndex((f) => f.id === frameId);
  if (frameIndex === -1 || frameIndex === frames.length - 1) {
    return false;
  }
  return frames[frameIndex + 1].id;
};

// Get first frame id
const getFirstFrameId = (list) => {
  const frames = list.filter((pict) => !pict.deleted);
  if (frames.length) {
    return frames[0].id;
  }
  return false;
};

const Animator = ({ t }) => {
  const { id, track } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  const [batteryStatus, setBatteryStatus] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loopStatus, setLoopStatus] = useState(false);
  const [shortPlayStatus, setShortPlayStatus] = useState(false);
  const [differenceStatus, setDifferenceStatus] = useState(false);
  const [fps, setFps] = useState(12);
  const [onionValue, setOnionValue] = useState(1);
  const [gridStatus, setGridStatus] = useState(false);
  const [currentFrameId, setCurrentFrameId] = useState(false);
  const [disableKeyboardShortcuts, setDisableKeyboardShortcuts] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState([]);
  const [capabilities, setCapabilities] = useState([]);

  const [project, setProject] = useState(null);

  useEffect(() => {
    (async () => {
      const updatedProject = await window.EA('GET_PROJECT', { project_id: id });
      setProject(updatedProject);
      setFps(updatedProject.project.scenes[track].framerate);
      const userSettings = await window.EA('GET_SETTINGS');
      setSettings({
        ...settings,
        ...userSettings,
      });

      await DevicesInstance.setMainCamera(userSettings.CAMERA_ID);

      const caps = await window.EA('APP_CAPABILITIES');
      setCapabilities(caps);
    })();
  }, []);

  useEffect(() => {
    Camera()?.batteryStatus().then(setBatteryStatus);
    clearInterval(batteryInterval);
    batteryInterval = setInterval(() => {
      Camera()?.batteryStatus().then(setBatteryStatus);
    }, 1000);
  }, []);

  if (!project || !settings) {
    return null;
  }

  // ---- RUNTIME LOGIC

  const pictures = project.project.scenes[track].pictures.filter((e) => !e.deleted);
  const framePosition = currentFrameId === false ? false : pictures.findIndex((p) => p.id === currentFrameId) + 1 || 1;
  const currentFrame = currentFrameId === false ? false : pictures.find((p) => p.id === currentFrameId) || false;

  const handleAction = (action, args = null) => {
    if (actionsEvents[action]) {
      actionsEvents[action](args);
    } else {
      console.log('UNSUPPORTED EVENT', action, args);
    }
  };

  const handleSelectFrame = (selectedFrame) => {
    playerRef.current.showFrame(selectedFrame === false ? false : selectedFrame.id);
  };

  const handleFrameMove = async (e) => {
    if (e.oldIndex === e.newIndex) {
      return;
    }

    const frameId = pictures[e.oldIndex].id;
    const beforeFrame = pictures?.[e.newIndex - (e.newIndex > e.oldIndex ? -1 : 0)]?.id;

    setProject(await window.EA('MOVE_FRAME', { project_id: id, track_id: track, frame_id: frameId, before_frame_id: beforeFrame === null ? false : beforeFrame }));

    playerRef.current.showFrame(frameId);
  };

  const takePictures =
    (nbPicturesToTake = null) =>
    async () => {
      if (isTakingPicture || !isCameraReady || !Camera()) {
        return;
      }
      flushSync(() => {
        setIsTakingPicture(true);
      });

      for (let i = 0; i < (Number(nbPicturesToTake !== null ? nbPicturesToTake : settings.CAPTURE_FRAMES) || 1); i++) {
        const nbFramesToTake = (settings.AVERAGING_ENABLED ? Number(settings.AVERAGING_VALUE) : 1) || 1;
        try {
          const buffer = await takePicture(Camera(), nbFramesToTake);

          if (!isMuted && settings.SOUNDS) {
            playSound(soundShutter);
          }

          setProject(await window.EA('TAKE_PICTURE', { project_id: id, track_id: track, buffer, before_frame_id: currentFrameId }));
        } catch (err) {
          if (!isMuted && settings.SOUNDS) {
            playSound(soundError);
          }
          console.error('Failed to take a picture', err);
        }
      }

      flushSync(() => {
        setIsTakingPicture(false);
      });
    };

  const actionsEvents = {
    PLAY: () => {
      if (isPlaying) {
        playerRef.current.stop();
      } else {
        playerRef.current.play();
      }
    },
    TAKE_PICTURE: takePictures(),
    TAKE_PICTURES_1: takePictures(1),
    TAKE_PICTURES_2: takePictures(2),
    TAKE_PICTURES_3: takePictures(3),
    TAKE_PICTURES_4: takePictures(4),
    TAKE_PICTURES_5: takePictures(5),
    TAKE_PICTURES_6: takePictures(6),
    TAKE_PICTURES_7: takePictures(7),
    TAKE_PICTURES_8: takePictures(8),
    TAKE_PICTURES_9: takePictures(9),
    TAKE_PICTURES_10: takePictures(10),
    LOOP: () => {
      setLoopStatus(!loopStatus);
    },
    SHORT_PLAY: () => {
      setShortPlayStatus(!shortPlayStatus);
    },
    CAMERA_SETTINGS: () => {
      setShowCameraSettings(!showCameraSettings);
    },
    DELETE_FRAME: async () => {
      if (currentFrameId === false) {
        return;
      }
      if (!isMuted && settings.SOUNDS) {
        playSound(soundDelete);
      }
      const newId = getPreviousFrameId(pictures, currentFrameId) !== currentFrameId ? getPreviousFrameId(pictures, currentFrameId) : getNextFrameId(pictures, currentFrameId);
      playerRef.current.showFrame(newId);
      setProject(await window.EA('DELETE_FRAME', { project_id: id, track_id: track, frame_id: currentFrameId }));
    },
    BACK: () => {
      navigate('/');
    },
    FRAME_LEFT: () => {
      const newId = getPreviousFrameId(pictures, currentFrameId);
      playerRef.current.showFrame(newId);
    },
    FRAME_RIGHT: () => {
      const newId = getNextFrameId(pictures, currentFrameId);
      playerRef.current.showFrame(newId);
    },
    FRAME_LIVE: () => {
      playerRef.current.showFrame(false);
    },
    FRAME_FIRST: () => {
      const newId = getFirstFrameId(pictures);
      playerRef.current.showFrame(newId);
    },
    ONION_LESS: () => {
      setOnionValue(Math.max(parseFloat(onionValue) - 0.1, 0));
    },
    ONION_MORE: () => {
      setOnionValue(Math.min(parseFloat(onionValue) + 0.1, 1));
    },
    ONION_CHANGE: (value) => {
      setOnionValue(value);
    },
    GRID: () => {
      setGridStatus(!gridStatus);
    },
    DIFFERENCE: () => {
      setDifferenceStatus(!differenceStatus);
    },
    FPS_CHANGE: async (v) => {
      setFps(v);
      setProject(await window.EA('UPDATE_FPS_VALUE', { project_id: id, track_id: track, fps: v }));
    },
    SETTINGS: () => {
      navigate(`/settings?back=/animator/${id}/${track}`);
    },
    MORE: () => {},
    EXPORT: () => {
      navigate(`/export/${id}/${track}?back=/animator/${id}/${track}`);
    },
    DUPLICATE: async () => {
      setProject(await window.EA('DUPLICATE_FRAME', { project_id: id, track_id: track, frame_id: currentFrameId }));
    },
    DEDUPLICATE: async () => {
      if (currentFrame.length <= 1) {
        return;
      }
      setProject(await window.EA('DEDUPLICATE_FRAME', { project_id: id, track_id: track, frame_id: currentFrameId }));
    },
    MUTE: () => {
      setIsMuted(!isMuted);
    },
    DELETE_PROJECT: async () => {
      await window.EA('DELETE_PROJECT', { project_id: id });
      navigate(`/`);
    },
    FPS_FOCUS: () => {
      setDisableKeyboardShortcuts(true);
    },
    FPS_BLUR: () => {
      setDisableKeyboardShortcuts(false);
    },
  };

  const handlePlayerInit = (videoDOM = null, imageDOM = null) => {
    if (!Camera()) {
      return;
    }

    Camera()
      .connect({ videoDOM, imageDOM }, { forceMaxQuality: !!settings.FORCE_QUALITY })
      .catch(() => {
        setIsCameraReady(false);
        Camera().getCapabilities().then(setCameraCapabilities);
      })
      .then(() => {
        setIsCameraReady(true);
        Camera().getCapabilities().then(setCameraCapabilities);
      });
  };

  const handleCapabilityChange = async (id, value) => {
    clearTimeout(timersApply[id]);
    timersApply[id] = setTimeout(async () => {
      await Camera().applyCapability(id, value);
      timersApply[id] = null;
      Camera()
        .getCapabilities()
        .then((realState) => {
          setCameraCapabilities((oldState) => {
            return realState.map((e) => {
              return oldState.find((item) => item.id === e.id) || e;
            });
          });
        });
    }, 10);

    Camera()
      .getCapabilities()
      .then(() => {
        setCameraCapabilities((oldState) => oldState.map((e) => (e.id === id ? { ...e, id, value } : e)));
      });
  };

  const handleCapabilityReset = async () => {
    setTimeout(async () => {
      await Camera().resetCapabilities();
      Camera().getCapabilities().then(setCameraCapabilities);
    }, 0);
  };

  return (
    <>
      <Player
        t={t}
        ref={playerRef}
        isCameraReady={isCameraReady}
        onInit={handlePlayerInit}
        onFrameChange={setCurrentFrameId}
        onCapabilityChange={handleCapabilityChange}
        onCapabilitiesReset={handleCapabilityReset}
        onPlayingStatusChange={setIsPlaying}
        showCameraSettings={showCameraSettings}
        pictures={pictures}
        onionValue={onionValue}
        showGrid={gridStatus}
        blendMode={differenceStatus}
        shortPlayStatus={shortPlayStatus}
        loopStatus={loopStatus}
        shortPlayFrames={Number(settings.SHORT_PLAY) || 1}
        capabilities={cameraCapabilities}
        fps={fps}
        batteryStatus={batteryStatus}
        gridModes={settings.GRID_MODES}
        gridOpacity={parseFloat(settings.GRID_OPACITY)}
        gridColumns={Number(settings.GRID_COLUMNS)}
        gridLines={Number(settings.GRID_LINES)}
      />
      <ActionsBar actions={['BACK']} position="LEFT" onAction={handleAction} />
      <ActionsBar
        actions={['SETTINGS', ...(capabilities.includes('EXPORT_VIDEO') || capabilities.includes('EXPORT_FRAMES') || capabilities.includes('BACKGROUND_SYNC') ? ['EXPORT'] : []), 'DELETE_PROJECT']}
        position="RIGHT"
        onAction={handleAction}
      />
      <ControlBar
        onAction={handleAction}
        showCameraSettings={showCameraSettings}
        cameraSettingsAvailable={cameraCapabilities.length > 0}
        gridModes={settings.GRID_MODES}
        gridStatus={gridStatus}
        differenceStatus={differenceStatus}
        onionValue={onionValue}
        isPlaying={isPlaying}
        isCameraReady={isCameraReady}
        isTakingPicture={isTakingPicture}
        shortPlayStatus={shortPlayStatus}
        loopStatus={loopStatus}
        fps={fps}
        canDeduplicate={currentFrame.length > 1}
        framePosition={framePosition}
        frameQuantity={pictures.length}
      />
      <Timeline pictures={pictures} onSelect={handleSelectFrame} onMove={handleFrameMove} select={currentFrameId} playing={isPlaying} />
      <KeyboardHandler onAction={handleAction} disabled={disableKeyboardShortcuts} />
    </>
  );
};

export default withTranslation()(Animator);
