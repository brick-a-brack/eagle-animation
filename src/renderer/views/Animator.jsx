import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import soundDelete from '~/resources/sounds/delete.mp3';
import soundError from '~/resources/sounds/error.mp3';
import soundShutter from '~/resources/sounds/shutter.mp3';

import { parseRatio } from '../common/ratio';
import ActionsBar from '../components/ActionsBar';
import CameraSettingsWindow from '../components/CameraSettingsWindow';
import ControlBar from '../components/ControlBar';
import KeyboardHandler from '../components/KeyboardHandler';
import Player from '../components/Player';
import ProjectSettingsWindow from '../components/ProjectSettingsWindow';
import Timeline from '../components/Timeline';
import Window from '../components/Window';
import useAppCapabilities from '../hooks/useAppCapabilities';
import useCamera from '../hooks/useCamera';
import useProject from '../hooks/useProject';
import useSettings from '../hooks/useSettings';

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

  const [isPlaying, setIsPlaying] = useState(false);
  const { settings, actions: settingsActions } = useSettings();
  const { appCapabilities } = useAppCapabilities();
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loopStatus, setLoopStatus] = useState(false);
  const [shortPlayStatus, setShortPlayStatus] = useState(false);
  const [differenceStatus, setDifferenceStatus] = useState(false);
  const [fps, setFps] = useState(12);
  const [ratio, setRatio] = useState(null);
  const [onionValue, setOnionValue] = useState(1);
  const [gridStatus, setGridStatus] = useState(false);
  const [currentFrameId, setCurrentFrameId] = useState(false);
  const [disableKeyboardShortcuts, setDisableKeyboardShortcuts] = useState(false);

  const { project, actions: projectActions } = useProject({ id });

  const {
    isCameraReady,
    devices,
    currentCameraCapabilities,
    currentCamera,
    currentCameraId,
    batteryStatus,
    actions: cameraActions,
  } = useCamera({
    forceMaxQuality: !!settings?.FORCE_QUALITY,
    eventsHandlers: {
      connect: () => {
        playerRef?.current?.resize();
      },
      disconnect: () => {
        playerRef?.current?.resize();
      },
    },
  });

  // Sync framerate when project change
  useEffect(() => {
    setFps(project?.scenes?.[track]?.framerate);
  }, [project?.scenes?.[track]?.framerate]);

  // Sync ratio when project change
  useEffect(() => {
    setRatio(project?.scenes?.[track]?.ratio ? parseRatio(project?.scenes?.[track]?.ratio) : null);
  }, [project?.scenes?.[track]?.ratio]);

  // Select previously selected camera
  useEffect(() => {
    (async () => {
      if (settings) {
        await cameraActions.setCamera(settings?.CAMERA_ID);
      }
    })();
  }, [settings?.CAMERA_ID]);

  // Shortcut if informations are not ready
  if (!project || !settings || !devices) {
    return null;
  }

  // ---- RUNTIME LOGIC
  const pictures = project.scenes[track].pictures.filter((e) => !e.deleted);
  const framePosition = currentFrameId === false ? false : pictures.findIndex((p) => p.id === currentFrameId) + 1 || 1;
  const currentFrame = currentFrameId === false ? false : pictures.find((p) => p.id === currentFrameId) || false;

  const handleAction = (action, args = null) => {
    if (actionsEvents[action]) {
      actionsEvents[action](args);
    } else {
      console.log('💥 Unsupported event', action, args);
    }
  };

  const handleSelectFrame = (selectedFrame) => {
    playerRef.current.showFrame(selectedFrame === false ? false : selectedFrame.id);
  };

  const handleSettingsChange = async (values) => {
    settingsActions.setSettings(values);
  };

  const handleFrameMove = async (e) => {
    if (e.oldIndex === e.newIndex) {
      return;
    }

    const frameId = pictures[e.oldIndex].id;
    const beforeFrame = pictures?.[e.newIndex - (e.newIndex > e.oldIndex ? -1 : 0)]?.id;

    projectActions.moveFrame(track, frameId, beforeFrame);
    playerRef.current.showFrame(frameId);
  };

  const takePictures =
    (nbPicturesToTake = null) =>
    async () => {
      if (isTakingPicture || !currentCamera) {
        return;
      }
      flushSync(() => {
        setIsTakingPicture(true);
      });

      for (let i = 0; i < (Number(nbPicturesToTake !== null ? nbPicturesToTake : settings.CAPTURE_FRAMES) || 1); i++) {
        const nbFramesToTake = (settings.AVERAGING_ENABLED ? Number(settings.AVERAGING_VALUE) : 1) || 1;
        try {
          const { type, buffer } = await cameraActions.takePicture(nbFramesToTake);

          if (!isMuted && settings.SOUNDS) {
            playSound(soundShutter);
          }

          await projectActions.addFrame(track, buffer, type?.includes('png') ? 'png' : 'jpg', currentFrameId);
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
      projectActions.deleteFrame(track, currentFrameId);
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
      projectActions.changeFPS(track, v || '1');
      if (isPlaying) {
        playerRef?.current?.stop();
      }
    },
    RATIO_CHANGE: async (v) => {
      projectActions.changeRatio(track, v || null);
    },
    SETTINGS: () => {
      navigate(`/settings?back=/animator/${id}/${track}`);
    },
    PROJECT_SETTINGS: () => {
      setShowProjectSettings((v) => !v);
    },
    MORE: () => {},
    EXPORT: () => {
      navigate(`/export/${id}/${track}?back=/animator/${id}/${track}`);
    },
    HIDE_FRAME: async () => {
      projectActions.applyHiddenFrameStatus(track, currentFrameId, !currentFrame?.hidden);
    },
    DUPLICATE: async () => {
      projectActions.actionApplyDuplicateFrameOffset(track, currentFrameId, 1);
    },
    DEDUPLICATE: async () => {
      projectActions.actionApplyDuplicateFrameOffset(track, currentFrameId, -1);
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
    cameraActions.setDomRefs({ videoDOM, imageDOM });
  };

  const handleCapabilityChange = async (id, value) => {
    cameraActions.setCapability(id, value);
  };

  const handleCapabilitiesReset = async () => {
    cameraActions.capabilitiesReset();
  };

  const handleDevicesRefresh = async () => {
    cameraActions.refreshDevices();
  };

  const handleProjectSettingsChange = async (fields) => {
    projectActions.rename(fields.title || '');
    if (fields.fps) {
      setFps(fields.fps);
      handleAction('FPS_CHANGE', fields.fps);
    }

    setRatio(fields.ratio);
    handleAction('RATIO_CHANGE', fields?.ratio?.userValue || '');
  };

  return (
    <>
      <Player
        t={t}
        ref={playerRef}
        isCameraReady={isCameraReady}
        onInit={handlePlayerInit}
        onFrameChange={setCurrentFrameId}
        onPlayingStatusChange={setIsPlaying}
        showCameraSettings={showCameraSettings}
        pictures={pictures}
        onionValue={onionValue}
        showGrid={gridStatus}
        blendMode={differenceStatus}
        shortPlayStatus={shortPlayStatus}
        loopStatus={loopStatus}
        shortPlayFrames={Number(settings.SHORT_PLAY) || 1}
        cameraId={currentCameraId}
        cameraCapabilities={currentCameraCapabilities}
        fps={fps}
        batteryStatus={batteryStatus}
        gridModes={settings.GRID_MODES}
        gridOpacity={parseFloat(settings.GRID_OPACITY)}
        gridColumns={Number(settings.GRID_COLUMNS)}
        gridLines={Number(settings.GRID_LINES)}
        ratioLayerOpacity={settings.RATIO_OPACITY}
        videoRatio={ratio?.value || null}
      />
      <ActionsBar actions={['BACK']} position="LEFT" onAction={handleAction} />
      <ActionsBar
        actions={[
          'SETTINGS',
          ...(pictures?.length > 0 && (appCapabilities.includes('EXPORT_VIDEO') || appCapabilities.includes('EXPORT_FRAMES') || appCapabilities.includes('BACKGROUND_SYNC')) ? ['EXPORT'] : []),
          'PROJECT_SETTINGS',
        ]}
        position="RIGHT"
        onAction={handleAction}
      />
      <ControlBar
        onAction={handleAction}
        showCameraSettings={showCameraSettings}
        gridModes={settings.GRID_MODES}
        gridStatus={gridStatus}
        differenceStatus={differenceStatus}
        onionValue={onionValue}
        isPlaying={isPlaying}
        isCameraReady={!!currentCamera}
        isTakingPicture={isTakingPicture}
        shortPlayStatus={shortPlayStatus}
        loopStatus={loopStatus}
        fps={fps}
        canDeduplicate={currentFrame.length > 1}
        framePosition={framePosition}
        frameQuantity={pictures.length}
        isCurrentFrameHidden={!!currentFrame.hidden}
      />
      <Timeline pictures={pictures} onSelect={handleSelectFrame} onMove={handleFrameMove} select={currentFrameId} playing={isPlaying} />
      {!showCameraSettings && !showProjectSettings && <KeyboardHandler onAction={handleAction} disabled={disableKeyboardShortcuts} />}
      <Window isOpened={showCameraSettings} onClose={() => setShowCameraSettings(false)}>
        <CameraSettingsWindow
          cameraCapabilities={currentCameraCapabilities}
          onCapabilityChange={handleCapabilityChange}
          onSettingsChange={handleSettingsChange}
          onCapabilitiesReset={handleCapabilitiesReset}
          onDevicesListRefresh={handleDevicesRefresh}
          appCapabilities={appCapabilities}
          devices={devices}
          settings={settings}
        />
      </Window>
      <Window isOpened={showProjectSettings} onClose={() => setShowProjectSettings(false)}>
        <ProjectSettingsWindow
          fps={fps}
          title={project?.title || ''}
          ratio={ratio?.userValue || null}
          onProjectSettingsChange={handleProjectSettingsChange}
          onProjectDelete={() => handleAction('DELETE_PROJECT')}
        />
      </Window>
    </>
  );
};

export default withTranslation()(Animator);
