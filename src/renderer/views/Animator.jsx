import CameraSettingsWindow from '@components/CameraSettingsWindow';
import ControlBar from '@components/ControlBar';
import HeaderBar from '@components/HeaderBar';
import KeyboardHandler from '@components/KeyboardHandler';
import LimitWarning from '@components/LimitWarning';
import LoadingPage from '@components/LoadingPage';
import PageLayout from '@components/PageLayout';
import Player from '@components/Player';
import ProjectSettingsWindow from '@components/ProjectSettingsWindow';
import ProjectTitle from '@components/ProjectTitle';
import Timeline from '@components/Timeline';
import Window from '@components/Window';
import { parseRatio } from '@core/ratio';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useCamera from '@hooks/useCamera';
import useProject from '@hooks/useProject';
import useSettings from '@hooks/useSettings';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import soundDelete from '~/resources/sounds/delete.mp3';
import soundDeleteConfirm from '~/resources/sounds/deleteConfirm.mp3';
import soundEagle from '~/resources/sounds/eagle.mp3';
import soundError from '~/resources/sounds/error.mp3';
import soundShutter from '~/resources/sounds/shutter.mp3';

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

// Get last frame id
const getLastFrameId = (list) => getPreviousFrameId(list, false);

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

  const [startedAt, setStartedAt] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings, actions: settingsActions } = useSettings();
  const { appCapabilities } = useAppCapabilities();
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [loopStatus, setLoopStatus] = useState(false);
  const [shortPlayStatus, setShortPlayStatus] = useState(false);
  const [differenceStatus, setDifferenceStatus] = useState(false);
  const [fps, setFps] = useState(12);
  const [ratio, setRatio] = useState(null);
  const [onionValue, setOnionValue] = useState(1);
  const [gridStatus, setGridStatus] = useState(false);
  const [currentFrameId, setCurrentFrameId] = useState(false);
  const [deleteOnLiveViewConfirmation, setDeleteOnLiveViewConfirmation] = useState(false);
  const [disableKeyboardShortcuts, setDisableKeyboardShortcuts] = useState(false);

  const { project, actions: projectActions } = useProject({ id });

  const {
    isCameraReady,
    devices,
    currentCameraCapabilities,
    currentCamera,
    currentCameraId,
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

  // Disable frame deletion confirmation if we change the current frame
  useEffect(() => {
    (() => {
      setDeleteOnLiveViewConfirmation(false);
    })();
  }, [currentFrameId]);

  // Sync framerate when project change
  useEffect(() => {
    (() => {
      setFps(project?.scenes?.[track]?.framerate);
    })();
  }, [project?.scenes?.[track]?.framerate]);

  // Sync ratio when project change
  useEffect(() => {
    (() => {
      setRatio(project?.scenes?.[track]?.ratio ? parseRatio(project?.scenes?.[track]?.ratio) : null);
    })();
  }, [project?.scenes?.[track]?.ratio]);

  // Select default camera
  useEffect(() => {
    if (settings?.CAMERA_ID) {
      cameraActions.setCamera(settings?.CAMERA_ID || null);
    }
  }, [settings?.CAMERA_ID]);

  // Shortcut if informations are not ready
  if (!project || !settings || !devices) {
    return (
      <>
        <LoadingPage show={true} />
      </>
    );
  }

  // ---- RUNTIME LOGIC
  const pictures = project.scenes[track].pictures.filter((e) => !e.deleted);
  const framePosition = currentFrameId === false ? false : pictures.findIndex((p) => p.id === currentFrameId) + 1 || 1;
  const currentFrame = currentFrameId === false ? false : pictures.find((p) => p.id === currentFrameId) || false;
  const totalAnimationFrames = pictures.reduce((acc, e) => acc + (!e.deleted && !e.hidden ? e.length || 1 : 0), 0);

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
    window.track('frame_moved', { projectId: `${id}`, trackId: `${track}`, frameId: `${frameId}` });
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

      setStartedAt((oldValue) => (oldValue ? oldValue : new Date().getTime() / 1000));

      for (let i = 0; i < (Number(nbPicturesToTake !== null ? nbPicturesToTake : settings.CAPTURE_FRAMES) || 1); i++) {
        const nbFramesToTake = (settings.AVERAGING_ENABLED ? Number(settings.AVERAGING_VALUE) : 1) || 1;
        try {
          const { type, buffer } = await cameraActions.takePicture(nbFramesToTake, settings.REVERSE_X, settings.REVERSE_Y);

          window.track('frame_captured', { projectId: `${id}`, trackId: `${track}`, reverseX: settings.REVERSE_X, reverseY: settings.REVERSE_Y, nbFrames: nbFramesToTake });

          if (settings.SOUNDS) {
            const isAprilFoolsDay = new Date().getDate() === 1 && new Date().getMonth() === 3;
            playSound(isAprilFoolsDay ? soundEagle : soundShutter);
          }

          await projectActions.addFrame(track, Buffer.from(buffer), type?.includes('png') ? 'png' : 'jpg', isPlaying ? false : currentFrameId);
        } catch (err) {
          if (settings.SOUNDS) {
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
        playerRef.current.play(settings.PLAY_FROM_BEGINING);
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
      window.track('animator_changed', { feature: 'loop', value: !loopStatus });
    },
    SHORT_PLAY: () => {
      setShortPlayStatus(!shortPlayStatus);
      window.track('animator_changed', { feature: 'short_play', value: !shortPlayStatus });
    },
    CAMERA_SETTINGS: () => {
      playerRef.current.showFrame(false);
      setShowCameraSettings(!showCameraSettings);
    },
    DELETE_FRAME: async () => {
      let frameIdToDelete = currentFrameId;
      let newId = false;

      // If we are on the live view
      if (currentFrameId === false) {
        if (!deleteOnLiveViewConfirmation) {
          setDeleteOnLiveViewConfirmation(true);

          // Play sound
          if (settings.SOUNDS) {
            playSound(soundDeleteConfirm);
          }

          // Break here, don't delete
          return;
        }

        frameIdToDelete = getLastFrameId(pictures);
        setDeleteOnLiveViewConfirmation(false);
      } else {
        newId = getPreviousFrameId(pictures, frameIdToDelete) !== frameIdToDelete ? getPreviousFrameId(pictures, frameIdToDelete) : getNextFrameId(pictures, frameIdToDelete);
      }

      // Play sound
      if (settings.SOUNDS) {
        playSound(soundDelete);
      }

      // Show right frame and execute deletion
      playerRef.current.showFrame(newId);
      projectActions.deleteFrame(track, frameIdToDelete);
      window.track('frame_deleted', { projectId: `${id}`, trackId: `${track}`, frameId: `${frameIdToDelete}` });
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
      window.track('animator_changed', { feature: 'onion', value: Math.max(parseFloat(onionValue) - 0.1, 0) });
    },
    ONION_MORE: () => {
      setOnionValue(Math.min(parseFloat(onionValue) + 0.1, 1));
      window.track('animator_changed', { feature: 'onion', value: Math.min(parseFloat(onionValue) + 0.1, 1) });
    },
    ONION_CHANGE: (value) => {
      setOnionValue(value);
      window.track('animator_changed', { feature: 'onion', value: value });
    },
    GRID: () => {
      setGridStatus(!gridStatus);
      window.track('animator_changed', { feature: 'grid', value: !gridStatus });
    },
    DIFFERENCE: () => {
      setDifferenceStatus(!differenceStatus);
      window.track('animator_changed', { feature: 'difference', value: !differenceStatus });
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
      window.track('frame_hidden', { projectId: `${id}`, trackId: `${track}`, frameId: `${currentFrameId}`, hidden: !currentFrame?.hidden });
    },
    DUPLICATE: async () => {
      projectActions.applyDuplicateFrameOffset(track, currentFrameId, 1);
      window.track('frame_duplicated', { projectId: `${id}`, trackId: `${track}`, frameId: `${currentFrameId}`, offset: 1 });
    },
    CLONE: async () => {
      projectActions.cloneFrame(track, currentFrameId);
      window.track('frame_cloned', { projectId: `${id}`, trackId: `${track}`, frameId: `${currentFrameId}` });
    },
    DEDUPLICATE: async () => {
      projectActions.applyDuplicateFrameOffset(track, currentFrameId, -1);
      window.track('frame_duplicated', { projectId: `${id}`, trackId: `${track}`, frameId: `${currentFrameId}`, offset: -1 });
    },
    MUTE: () => {
      const newValue = !settings.SOUNDS;
      settingsActions.setSettings({ SOUNDS: newValue });
      window.track('animator_changed', { feature: 'mute', value: newValue });
    },
    DELETE_PROJECT: async () => {
      await window.EA('DELETE_PROJECT', { project_id: id });
      navigate(`/`);
      window.track('project_deleted', { projectId: id });
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
      <LoadingPage show={false} />
      <PageLayout>
        <HeaderBar
          leftActions={['BACK']}
          rightActions={[
            ...(pictures?.some((e) => !e?.hidden) &&
            (appCapabilities.includes('EXPORT_VIDEO') || appCapabilities.includes('EXPORT_FRAMES') || (appCapabilities.includes('BACKGROUND_SYNC') && settings?.EVENT_MODE_ENABLED))
              ? ['EXPORT']
              : []),
            'SETTINGS',
          ]}
          onAction={handleAction}
        >
          <ProjectTitle title={project?.title} onTitleChange={(title) => projectActions.rename(title || '')} onEdit={() => handleAction('PROJECT_SETTINGS')} />
        </HeaderBar>
        <Player
          t={t}
          ref={playerRef}
          isCameraReady={isCameraReady}
          onInit={handlePlayerInit}
          onFrameChange={setCurrentFrameId}
          onPlayingStatusChange={setIsPlaying}
          pictures={pictures}
          onionValue={onionValue}
          showGrid={gridStatus}
          blendMode={differenceStatus}
          shortPlayStatus={shortPlayStatus}
          shortPlayFrames={Number(settings.SHORT_PLAY) || 1}
          loopStatus={loopStatus}
          cameraId={currentCameraId}
          cameraCapabilities={currentCameraCapabilities}
          fps={fps}
          gridModes={settings.GRID_MODES}
          gridOpacity={parseFloat(settings.GRID_OPACITY)}
          gridColumns={Number(settings.GRID_COLUMNS)}
          gridLines={Number(settings.GRID_LINES)}
          ratioLayerOpacity={settings.RATIO_OPACITY}
          loopShowLive={settings.LOOP_SHOW_LIVE}
          videoRatio={ratio?.value || null}
          reverseX={settings.REVERSE_X}
          reverseY={settings.REVERSE_Y}
        />
        <div>
          {settings?.EVENT_MODE_ENABLED && (
            <LimitWarning nbFrames={pictures.length} nbFramesLimit={settings?.LIMIT_NUMBER_OF_FRAMES} startedAt={startedAt} activityDuration={settings?.LIMIT_ACTIVITY_DURATION} />
          )}
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
            totalAnimationFrames={totalAnimationFrames}
          />
          <Timeline
            pictures={pictures}
            onSelect={handleSelectFrame}
            onMove={handleFrameMove}
            select={currentFrameId}
            playing={isPlaying}
            shortPlayStatus={shortPlayStatus}
            shortPlayFrames={Number(settings.SHORT_PLAY) || 1}
          />
        </div>
      </PageLayout>
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
