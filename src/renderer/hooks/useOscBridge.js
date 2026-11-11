import { OSC_DEFAULT_STATE } from '@common/osc';
import { useCallback, useEffect, useRef } from 'react';

const emit = (name, payload = {}) => window.EA('EVENT', { name, ...payload });

// Events deduced from two consecutive state snapshots, discrete events (capture, deletion…) are emitted by the caller
const emitStateChanges = (prev, state) => {
  if (!prev || prev.projectId !== state.projectId) {
    emit('project_opened', { projectId: state.projectId, projectName: state.projectName });
    if (state.cameraId) {
      emit('camera_changed', { cameraId: state.cameraId, cameraName: state.cameraName });
    }
    return;
  }

  if (prev.sceneIndex !== state.sceneIndex) emit('scene_changed', { sceneIndex: state.sceneIndex });
  if (prev.sceneIndex === state.sceneIndex && prev.fps !== state.fps) emit('fps_changed', { fps: state.fps });

  if (prev.playing !== state.playing) emit(state.playing ? 'play_started' : 'play_stopped');
  if (prev.liveView !== state.liveView) emit('live_view', { value: state.liveView });
  // Compared by id: deleting an earlier frame shifts the index without changing the selection
  if (!state.liveView && prev.frameId !== state.frameId) emit(state.playing ? 'frame_played' : 'frame_selected', { frameIndex: state.frameIndex });

  if (prev.loop !== state.loop) emit('loop_changed', { value: state.loop });
  if (prev.shortPlay !== state.shortPlay) emit('short_play_changed', { value: state.shortPlay });
  if (prev.onion !== state.onion) emit('onion_changed', { opacity: state.onion });
  if (prev.grid !== state.grid) emit('grid_changed', { value: state.grid });
  if (prev.mute !== state.mute) emit('mute_changed', { value: state.mute });

  if (prev.cameraId && prev.deviceIds.includes(prev.cameraId) && !state.deviceIds.includes(prev.cameraId)) {
    emit('camera_disconnected', { cameraId: prev.cameraId });
  }
  if (state.cameraId && prev.cameraId !== state.cameraId) emit('camera_changed', { cameraId: state.cameraId, cameraName: state.cameraName });
};

// Bridges the animator with the OSC backend: pushes its state, emits events and receives remote actions
function useOscBridge({ enabled = false, state = null, onAction = () => {} }) {
  const onActionRef = useRef(onAction);
  const previousStateRef = useRef(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onActionRef.current = onAction;
    enabledRef.current = enabled;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return window.EAEvents('OSC_ACTION', (evt, { action } = {}) => onActionRef.current(action));
  }, [enabled]);

  const stateKey = state ? JSON.stringify(state) : null;
  useEffect(() => {
    if (!enabled || !state) {
      return;
    }
    window.EA('OSC_SET_STATE', state);
    emitStateChanges(previousStateRef.current, state);
    previousStateRef.current = state;
  }, [enabled, stateKey]);

  // Leaving the animator closes the project
  useEffect(
    () => () => {
      if (enabledRef.current && previousStateRef.current) {
        window.EA('OSC_SET_STATE', OSC_DEFAULT_STATE);
        emit('project_closed');
      }
      previousStateRef.current = null;
    },
    []
  );

  const emitEvent = useCallback((name, payload = {}) => {
    if (enabledRef.current) {
      emit(name, payload);
    }
  }, []);

  return { emitEvent };
}

export default useOscBridge;
