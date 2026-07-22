import CameraSettingsWindow from '@components/CameraSettingsWindow';
import ControlBar from '@components/ControlBar';
import DesktopNavigation from '@components/DesktopNavigation';
import ImportOverlay from '@components/ImportOverlay';
import KeyboardHandler from '@components/KeyboardHandler';
import LimitWarning from '@components/LimitWarning';
import LoadingPage from '@components/LoadingPage';
import MaskingWindow from '@components/MaskingWindow';
import MobileNavigation from '@components/MobileNavigation';
import PageLayout from '@components/PageLayout';
import PictureWindow from '@components/PictureWindow';
import Player from '@components/Player';
import SceneSelector from '@components/SceneSelector';
import SceneSelectorWindow from '@components/SceneSelectorWindow';
import SceneSettingsWindow from '@components/SceneSettingsWindow';
import Timeline from '@components/Timeline';
import ToolsWindow from '@components/ToolsWindow';
import Tour from '@components/Tour';
import Window from '@components/Window';
import { parseRatio } from '@core/ratio';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useCamera from '@hooks/useCamera';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useProject from '@hooks/useProject';
import useSettings from '@hooks/useSettings';
import faArrowLeft from '@icons/faArrowLeft';
import faBoxArrowDown from '@icons/faBoxArrowDown';
import faCamera from '@icons/faCamera';
import faEllipsisVertical from '@icons/faEllipsisVertical';
import faEraser from '@icons/faEraser';
import faFolder from '@icons/faFolder';
import faImage from '@icons/faImage';
import faPlay from '@icons/faPlay';
import faSliders from '@icons/faSliders';
import faStop from '@icons/faStop';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { withTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import soundDelete from '~/resources/sounds/delete.mp3';
import soundDeleteConfirm from '~/resources/sounds/deleteConfirm.mp3';
import soundEagle from '~/resources/sounds/eagle.mp3';
import soundError from '~/resources/sounds/error.mp3';
import soundShutter from '~/resources/sounds/shutter.mp3';

const MASKING_MODES = {
  DISABLED: (t) => t('Disabled'),
  UNIQUE: (t) => t('Unique'),
  CONTINUOUS: (t) => t('Continuous'),
};

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
const getPreviousFrameId = (frames, frameId, skipHiddenFrames = false) => {
  let frameFound = false;
  for (const frame of frames.toReversed()) {
    if (frame.deleted) {
      continue;
    }

    const isShowable = !frame?.hidden || (!skipHiddenFrames && !!frame?.hidden);

    // Live view case, return the first showable frame
    if (frameId === false && isShowable) {
      return frame.id;
    }

    // Frame found, the next showable frame we find will be returned
    if (frame.id === frameId) {
      frameFound = true;
      continue;
    }

    // Return the current showable frame
    if (frameFound && isShowable) {
      return frame.id;
    }
  }

  // Fallback, return the initial frameId
  return frameId;
};

// Get last frame id
const getLastFrameId = (frames) => getPreviousFrameId(frames, false);

// Get next frame id
const getNextFrameId = (frames, frameId, skipHiddenFrames = false) => {
  let frameFound = false;
  for (const frame of frames) {
    if (frame.deleted) {
      continue;
    }

    const isShowable = !frame?.hidden || (!skipHiddenFrames && !!frame?.hidden);

    // Frame found, the next showable frame we find will be returned
    if (frame.id === frameId) {
      frameFound = true;
      continue;
    }

    // Return the current showable frame
    if (frameFound && isShowable) {
      return frame.id;
    }
  }

  // Fallback, return to the live view
  return false;
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
  const [activeWindow, setActiveWindow] = useState(null);
  const [maskingMode, setMaskingMode] = useState('DISABLED');
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [loopStatus, setLoopStatus] = useState(false);
  const [shortPlayStatus, setShortPlayStatus] = useState(false);
  const [differenceStatus, setDifferenceStatus] = useState(false);
  const [onionValue, setOnionValue] = useState(1);
  const [gridStatus, setGridStatus] = useState(false);
  const [currentFrameId, setCurrentFrameId] = useState(false);
  const [deleteOnLiveViewConfirmation, setDeleteOnLiveViewConfirmation] = useState(false);
  const [pendingBackgroundFrame, setPendingBackgroundFrame] = useState(false);
  const [sceneEditingIndex, setSceneEditingIndex] = useState(Number(track) || 0);
  const maskingEditorRef = useRef(null);

  const { project, actions: projectActions } = useProject({ id });

  const nbFrames = project?.scenes?.[track]?.pictures?.filter((e) => !e.deleted)?.length || 0;
  const fps = Math.min(60, Math.max(1, Number(project?.scenes?.[track]?.framerate) || 1));
  const ratio = project?.scenes?.[track]?.ratio ? parseRatio(project?.scenes?.[track]?.ratio) : null;

  useDiscordActivity({
    actionIcon: 'animating',
    actionTitle: project?.title || null,
    description:
      nbFrames === 0
        ? t('Capture in progress')
        : t('Captured: {{content}}', {
            content: [t('{{count}} frame', { count: nbFrames })].join(' • '),
          }),
  });

  const { isCameraReady, devices, currentCameraCapabilities, currentCamera, currentCameraId, actions: cameraActions } = useCamera({ compatibilityMode: !!settings?.COMPATIBILITY_MODE_CAMERAS });

  // Redirect to first available scene if current scene no longer exists (e.g. after undo or scene deletion)
  useEffect(() => {
    if (!project) return;
    const currentScene = project.scenes?.[track];
    if (!currentScene || currentScene.deleted) {
      const firstValid = project.scenes.findIndex((s) => !s.deleted);
      if (firstValid !== -1) {
        navigate(`/animator/${id}/${firstValid}`);
      }
    }
  }, [project, track, id, navigate]);

  // Disable frame deletion confirmation if we change the current frame
  useEffect(() => {
    (() => {
      setDeleteOnLiveViewConfirmation(false);
    })();
  }, [currentFrameId]);

  // Reset per-scene local state when switching scenes
  useEffect(() => {
    setCurrentFrameId(false);
    setPendingBackgroundFrame(false);
    setDeleteOnLiveViewConfirmation(false);
    if (playerRef.current) {
      playerRef.current.showFrame(false);
    }
  }, [track]);

  // Select default camera
  useEffect(() => {
    if (!devices?.length || !settings) {
      return;
    }

    const availableDevices = devices.filter((device) => !!device?.id);
    const currentIsValid = currentCameraId && availableDevices.some((device) => device.id === currentCameraId);
    if (currentIsValid) {
      return;
    }

    const savedCamera = availableDevices.find((device) => device.id === settings.CAMERA_ID);
    const defaultCamera = savedCamera || availableDevices[0] || null;
    if (!defaultCamera) {
      return;
    }

    cameraActions.setCamera(defaultCamera.id);

    // Only persist when we had to fall back to a different camera than the saved one,
    // so we don't overwrite a still-valid CAMERA_ID during transient device list updates
    // (e.g. compatibility mode toggle, slow device enumeration).
    if (!savedCamera) {
      settingsActions.setSettings({ CAMERA_ID: defaultCamera.id });
    }
  }, [devices, settings, currentCameraId]);

  const handleImportPicture = useCallback((blob) => projectActions.addFrame(track, blob), [projectActions, track]);

  const handleSelectFrame = useCallback((selectedFrameId) => {
    playerRef.current.showFrame(selectedFrameId === false ? false : selectedFrameId);
  }, []);

  // Shortcut if informations are not ready
  if (!project || !settings || !devices) {
    return (
      <>
        <LoadingPage show={true} />
      </>
    );
  }

  // ---- RUNTIME LOGIC
  const pictures = (project.scenes[track]?.pictures || []).filter((e) => !e.deleted);
  const framePosition = currentFrameId === false ? false : pictures.findIndex((p) => p.id === currentFrameId) + 1 || 1;
  const currentFrame = currentFrameId === false ? false : pictures.find((p) => p.id === currentFrameId) || false;
  const totalAnimationFrames = pictures.reduce((acc, e) => acc + (!e.deleted && !e.hidden ? e.length || 1 : 0), 0);

  const visibleScenes = project.scenes.map((s, index) => ({ ...s, index })).filter((s) => !s.deleted);
  const editingScene = project.scenes[sceneEditingIndex] || null;
  const editingFps = Math.min(60, Math.max(1, Number(editingScene?.framerate) || 1));
  const editingRatio = editingScene?.ratio ? parseRatio(editingScene.ratio) : null;

  const handleAction = (action, args = null) => {
    if (actionsEvents[action]) {
      actionsEvents[action](args);
    } else {
      console.log('💥 Unsupported event', action, args);
    }
  };

  const handleSettingsChange = async (values) => {
    if (values.CAMERA_ID !== currentCameraId) {
      cameraActions.setCamera(values.CAMERA_ID || null);
    }
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

      const numberOfFramesToTake = Number(nbPicturesToTake !== null ? nbPicturesToTake : settings.CAPTURE_FRAMES) || 1;
      for (let i = 0; i < numberOfFramesToTake; i++) {
        const nbFramesToTakeForAvg = (settings.AVERAGING_ENABLED ? Number(settings.AVERAGING_VALUE) : 1) || 1;
        try {
          const frame = await cameraActions.takePicture(nbFramesToTakeForAvg, settings.REVERSE_X, settings.REVERSE_Y);
          const frameType = maskingMode === 'DISABLED' ? 'NORMAL' : pendingBackgroundFrame ? 'FOREGROUND' : 'BACKGROUND';

          window.track('frame_captured', {
            projectId: `${id}`,
            trackId: `${track}`,
            reverseX: settings.REVERSE_X,
            reverseY: settings.REVERSE_Y,
            nbFrames: nbFramesToTakeForAvg,
            maskingMode,
            frameType,
          });

          if (settings.SOUNDS) {
            const isAprilFoolsDay = new Date().getDate() === 1 && new Date().getMonth() === 3;
            playSound(isAprilFoolsDay ? soundEagle : soundShutter);
          }

          // Save frame
          if (pendingBackgroundFrame || maskingMode === 'DISABLED') {
            await projectActions.addFrame(track, frame, isPlaying ? false : currentFrameId, pendingBackgroundFrame || null);
          } else if (maskingMode === 'UNIQUE' || !pendingBackgroundFrame) {
            setPendingBackgroundFrame(frame);
          }

          // Clean background
          if (maskingMode === 'DISABLED' || (maskingMode === 'UNIQUE' && pendingBackgroundFrame)) {
            setPendingBackgroundFrame(null);
          }
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
      setActiveWindow((v) => (v === 'camera' ? null : 'camera'));
    },
    DELETE_FRAME: async () => {
      if (pictures.length === 0) {
        return;
      }
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
      const newId = getPreviousFrameId(pictures, currentFrameId, settings.SKIP_HIDDEN_FRAMES);
      playerRef.current.showFrame(newId);
    },
    FRAME_RIGHT: () => {
      const newId = getNextFrameId(pictures, currentFrameId, settings.SKIP_HIDDEN_FRAMES);
      playerRef.current.showFrame(newId);
    },
    ALTERNATIVE_FRAME_LEFT: () => {
      const newId = getPreviousFrameId(pictures, currentFrameId, !settings.SKIP_HIDDEN_FRAMES);
      playerRef.current.showFrame(newId);
    },
    ALTERNATIVE_FRAME_RIGHT: () => {
      const newId = getNextFrameId(pictures, currentFrameId, !settings.SKIP_HIDDEN_FRAMES);
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
      if (!differenceStatus && framePosition === false) {
        setOnionValue(Math.max(parseFloat(onionValue) - 0.1, 0));
        window.track('animator_changed', { feature: 'onion', value: Math.max(parseFloat(onionValue) - 0.1, 0) });
      }
    },
    ONION_MORE: () => {
      if (!differenceStatus && framePosition === false) {
        setOnionValue(Math.min(parseFloat(onionValue) + 0.1, 1));
        window.track('animator_changed', { feature: 'onion', value: Math.min(parseFloat(onionValue) + 0.1, 1) });
      }
    },
    ONION_CHANGE: (value) => {
      setOnionValue(value);
      window.track('animator_changed', { feature: 'onion', value: value });
    },
    GRID: () => {
      if (framePosition === false) {
        setGridStatus(!gridStatus);
        window.track('animator_changed', { feature: 'grid', value: !gridStatus });
      }
    },
    DIFFERENCE: () => {
      if (framePosition === false) {
        setDifferenceStatus(!differenceStatus);
        window.track('animator_changed', { feature: 'difference', value: !differenceStatus });
      }
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
    PROJECT: () => {
      setActiveWindow((v) => (v === 'scenes' ? null : 'scenes'));
    },
    ADD_SCENE: async () => {
      const newIndex = project.scenes.length;
      const newVisualIndex = project.scenes.filter((s) => !s.deleted).length + 1; // To be displayed
      const currentFps = project?.scenes?.[track]?.framerate || 12;
      const currentRatio = project?.scenes?.[track]?.ratio || null;
      await projectActions.addScene(t('Untitled scene #{{index}}', { index: newVisualIndex }), currentFps, currentRatio);
      window.track('scene_added', { projectId: `${id}`, trackId: `${newIndex}` });
      navigate(`/animator/${id}/${newIndex}`);
      setActiveWindow(null);
    },
    DELETE_SCENE: async () => {
      const indexToDelete = Number(sceneEditingIndex);
      const aliveOthers = project.scenes.filter((s, i) => i !== indexToDelete && !s.deleted);
      if (aliveOthers.length === 0) {
        return;
      }
      projectActions.deleteScene(indexToDelete);
      setActiveWindow(null);
      window.track('scene_deleted', { projectId: `${id}`, trackId: `${indexToDelete}` });
    },
    UNDO: () => {
      if (!isPlaying) projectActions.undo();
    },
    REDO: () => {
      if (!isPlaying) projectActions.redo();
    },
    SHOW_TOOLS: () => {
      if (currentFrameId === false) {
        playerRef.current.showFrame(false);
        setActiveWindow((v) => (v === 'tools' ? null : 'tools'));
      }
    },
    SHOW_PICTURE_OPTIONS: () => {
      if (currentFrameId !== false) {
        setActiveWindow((v) => (v === 'picture' ? null : 'picture'));
      }
    },
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
    SET_DUPLICATE_COUNT: (value) => {
      const target = Math.max(1, Math.round(Number(value) || 1));
      const offset = target - (currentFrame?.length || 1);
      if (!offset) return;
      projectActions.applyDuplicateFrameOffset(track, currentFrameId, offset);
      window.track('frame_duplicated', { projectId: `${id}`, trackId: `${track}`, frameId: `${currentFrameId}`, offset });
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
    TOGGLE_MASKING_MODE: () => {
      const values = ['DISABLED', 'CONTINUOUS', 'UNIQUE'];
      const newMode = values?.[values?.indexOf(maskingMode) + 1] || values?.[0];
      if (newMode === 'DISABLED') {
        setPendingBackgroundFrame(null);
      }
      setMaskingMode(newMode);
      window.track('animator_changed', { feature: 'masking', value: newMode });
    },
    MASKING_EDITOR: () => {
      setActiveWindow('masking');
    },
  };

  const handlePlayerInit = (setStream) => {
    cameraActions.setStream(setStream);
  };

  const handleCapabilityChange = async (id, value) => {
    cameraActions.setCapability(id, value);
  };

  const handleDevicesRefresh = async () => {
    cameraActions.refreshDevices();
  };

  const handleSceneSettingsChange = async (fields) => {
    projectActions.renameScene(sceneEditingIndex, fields.title || '');
    if (fields.fps) {
      projectActions.changeFPS(sceneEditingIndex, fields.fps);
      if (Number(sceneEditingIndex) === Number(track) && isPlaying) {
        playerRef?.current?.stop();
      }
    }
    projectActions.changeRatio(sceneEditingIndex, fields?.ratio?.userValue || null);
  };

  const handleCloseMaskingEditor = async () => {
    // Get new images
    const d = await maskingEditorRef.current.exportLayers();
    if (d && d?.frame && d?.layers?.transparent) {
      await projectActions.updateFrame(track, currentFrame?.id, d.frame, undefined, undefined, d.layers.transparent);
    }

    // Close editor
    setActiveWindow(null);

    // Force player sync
    setTimeout(() => {
      playerRef.current.showFrame(currentFrame?.id);
    }, 0);
  };

  const frameCaptureMode = maskingMode !== 'DISABLED' && !isPlaying ? (pendingBackgroundFrame ? 'FOREGROUND' : 'BACKGROUND') : null;
  const canExport =
    pictures?.some((e) => !e?.hidden) &&
    (appCapabilities.includes('EXPORT_VIDEO') || appCapabilities.includes('EXPORT_FRAMES') || (appCapabilities.includes('BACKGROUND_SYNC') && settings?.EVENT_MODE_ENABLED));

  // Actions
  const primaryActions = [{ title: t('Back'), icon: faArrowLeft, onClick: handleAction.bind(null, 'BACK') }];

  const secondaryActions = canExport ? [{ title: t('Export'), icon: faBoxArrowDown, onClick: handleAction.bind(null, 'EXPORT') }] : [];

  const mobileActionsTop = [
    {
      title: currentFrame === false || isPlaying ? t('More') : t('Frame actions'),
      icon: currentFrame === false || isPlaying ? faEllipsisVertical : faImage,
      onClick: handleAction.bind(null, currentFrame === false || isPlaying ? 'SHOW_TOOLS' : 'SHOW_PICTURE_OPTIONS'),
      disabled: isPlaying,
    },
  ];

  const mobileActionsMiddle = [
    {
      title: t('Masking mode ({{status}})'),
      tag: maskingMode !== 'DISABLED' ? (MASKING_MODES[maskingMode] || MASKING_MODES.DISABLED)(t).slice(0, 1) : '',
      icon: faEraser,
      onClick: handleAction.bind(null, 'TOGGLE_MASKING_MODE'),
      selected: maskingMode !== 'DISABLED',
      disabled: isPlaying,
    },
    { title: t('Take a picture'), icon: faCamera, onClick: handleAction.bind(null, 'TAKE_PICTURE'), color: 'primary', disabled: isTakingPicture || !isCameraReady },
    { title: t('Camera settings'), icon: faSliders, onClick: handleAction.bind(null, 'CAMERA_SETTINGS'), disabled: isPlaying },
  ];

  const mobileActionsBottom = [
    { title: !isPlaying ? t('Play') : t('Stop'), icon: isPlaying ? faStop : faPlay, onClick: handleAction.bind(null, 'PLAY'), selectedColor: 'warning', selected: isPlaying },
  ];

  const projectAction = { title: t('Project'), icon: faFolder, onClick: handleAction.bind(null, 'PROJECT') };

  return (
    <>
      <LoadingPage show={false} />
      <PageLayout hasMobileLeftBar={true} hasMobileRightBar={true}>
        <DesktopNavigation leftActions={primaryActions} rightActions={secondaryActions} withBorder={false}>
          <SceneSelector
            scenes={visibleScenes.map((s) => ({ id: s.id, index: s.index, title: s.title, framerate: s.framerate, pictureCount: s.pictures?.filter((p) => !p.deleted).length ?? 0 }))}
            currentTrack={track}
            disabled={isPlaying}
            projectTitle={project?.title}
            onProjectTitleChange={(title) => projectActions.rename(title || '')}
            onProjectDelete={() => handleAction('DELETE_PROJECT')}
            onSelect={(newIndex) => {
              if (Number(newIndex) !== Number(track)) {
                navigate(`/animator/${id}/${newIndex}`);
              }
            }}
            onCreate={() => handleAction('ADD_SCENE')}
            onEditScene={(sceneIndex) => {
              setSceneEditingIndex(sceneIndex);
              setActiveWindow('scene');
            }}
          />
        </DesktopNavigation>
        <MobileNavigation
          topLeftActions={primaryActions}
          bottomLeftActions={[projectAction, ...secondaryActions]}
          topRightActions={mobileActionsTop}
          middleRightActions={mobileActionsMiddle}
          bottomRightActions={mobileActionsBottom}
          showLeftActions={true}
          showRightActions={true}
        />
        <Player
          t={t}
          ref={playerRef}
          isCameraReady={isCameraReady}
          onInit={handlePlayerInit}
          onFrameChange={setCurrentFrameId}
          onPlayingStatusChange={setIsPlaying}
          isPlaying={isPlaying}
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
            showCameraSettings={activeWindow === 'camera'}
            gridModes={settings.GRID_MODES}
            gridColumns={Number(settings.GRID_COLUMNS)}
            gridLines={Number(settings.GRID_LINES)}
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
            canUseMaskingEditor={!!currentFrame.masking}
            totalAnimationFrames={totalAnimationFrames}
            maskingMode={maskingMode}
          />
          <Timeline
            pictures={pictures}
            onSelect={handleSelectFrame}
            onMove={handleFrameMove}
            select={currentFrameId}
            playing={isPlaying}
            shortPlayStatus={shortPlayStatus}
            shortPlayFrames={Number(settings.SHORT_PLAY) || 1}
            frameCaptureMode={frameCaptureMode}
          />
        </div>
      </PageLayout>
      {activeWindow === null && !isPlaying && <ImportOverlay onPictureAdd={handleImportPicture} />}
      {activeWindow === null && <KeyboardHandler onAction={handleAction} />}
      {activeWindow === null && <Tour tourKey="ANIMATOR" />}
      {!isPlaying && (
        <>
          <Window isOpened={activeWindow === 'camera'} onClose={() => setActiveWindow(null)}>
            <CameraSettingsWindow
              cameraCapabilities={currentCameraCapabilities}
              onCapabilityChange={handleCapabilityChange}
              onSettingsChange={handleSettingsChange}
              onDevicesListRefresh={handleDevicesRefresh}
              appCapabilities={appCapabilities}
              devices={devices}
              settings={settings}
              currentCameraId={currentCameraId}
            />
          </Window>
          <Window isOpened={activeWindow === 'tools'} onClose={() => setActiveWindow(null)}>
            <ToolsWindow
              onAction={handleAction}
              gridStatus={gridStatus}
              differenceStatus={differenceStatus}
              onionValue={onionValue}
              loopStatus={loopStatus}
              shortPlayStatus={shortPlayStatus}
              fps={fps}
              framePosition={framePosition}
            />
          </Window>
          <Window isOpened={activeWindow === 'picture'} onClose={() => setActiveWindow(null)}>
            <PictureWindow
              onAction={(action, args) => {
                handleAction(action, args);
                // Close the sheet once the frame is gone (delete) — the other actions keep it open for quick edits
                if (action === 'DELETE_FRAME') {
                  setActiveWindow(null);
                }
              }}
              isHidden={!!currentFrame.hidden}
              duplicateCount={currentFrame.length || 1}
              canUseMaskingEditor={!!currentFrame.masking}
            />
          </Window>
          <Window isOpened={activeWindow === 'scenes'} onClose={() => setActiveWindow(null)}>
            <SceneSelectorWindow
              scenes={visibleScenes.map((s) => ({ id: s.id, index: s.index, title: s.title, framerate: s.framerate, pictureCount: s.pictures?.filter((p) => !p.deleted).length ?? 0 }))}
              currentTrack={track}
              projectTitle={project?.title}
              onProjectTitleChange={(title) => projectActions.rename(title || '')}
              onProjectDelete={() => handleAction('DELETE_PROJECT')}
              onSelect={(newIndex) => {
                if (Number(newIndex) !== Number(track)) {
                  navigate(`/animator/${id}/${newIndex}`);
                }
                setActiveWindow(null);
              }}
              onCreate={() => handleAction('ADD_SCENE')}
              onEditScene={(sceneIndex) => {
                setSceneEditingIndex(sceneIndex);
                setActiveWindow('scene');
              }}
            />
          </Window>
          <Window isOpened={activeWindow === 'scene'} onClose={() => setActiveWindow(null)}>
            <SceneSettingsWindow
              key={sceneEditingIndex}
              title={editingScene?.title || ''}
              fps={editingFps}
              ratio={editingRatio?.userValue || null}
              canDelete={visibleScenes.length > 1}
              onSceneSettingsChange={handleSceneSettingsChange}
              onSceneDelete={() => handleAction('DELETE_SCENE')}
            />
          </Window>
          <Window isOpened={activeWindow === 'masking' && !isPlaying} onClose={handleCloseMaskingEditor} isFullScreen={true}>
            {currentFrame && currentFrame?.masking && (
              <MaskingWindow
                key={currentFrame.id}
                ref={maskingEditorRef}
                backgroundLayer={currentFrame?.masking?.background?.link || null}
                foregroundLayer={currentFrame?.masking?.foreground?.link || null}
                transparentLayer={currentFrame?.masking?.transparent?.link || null}
              />
            )}
          </Window>
        </>
      )}
    </>
  );
};

export default withTranslation()(Animator);
