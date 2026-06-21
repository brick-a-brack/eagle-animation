import { getAudioDurationFromArrayBuffer } from '@core/audio';
import { mimeTypeToExtension } from '@core/frameTypes';
import { useCallback, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import { useHistory } from './useHistory';

// Ensure a scene has an audioTracks array (older projects predate audio)
const ensureAudioTracks = (scene) => {
  if (!scene.audioTracks) {
    scene.audioTracks = [];
  }
  return scene.audioTracks;
};

function cleanProjectData(data) {
  const d = structuredClone(data);
  delete d._path;
  delete d._file;
  for (const scene of d.project.scenes) {
    for (const picture of scene.pictures) {
      delete picture.link;
      delete picture.metaLink;
      for (const layer of ['background', 'foreground', 'transparent']) {
        if (picture.masking?.[layer]) {
          delete picture.masking[layer].link;
          delete picture.masking[layer].metaLink;
        }
      }
    }
    for (const track of scene.audioTracks || []) {
      for (const chunk of track.chunks || []) {
        delete chunk.link;
        delete chunk.peaks;
      }
    }
  }
  return d;
}

function getFingerprint(data) {
  if (!data?.project) return null;
  const d = cleanProjectData(data);
  return JSON.stringify({ title: d.project.title, scenes: d.project.scenes });
}

function useProject(options) {
  const [projectData, setProjectData] = useState(null);

  const { push: pushHistory, undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useHistory({ key: options?.id, serialize: getFingerprint });

  // Initial load
  useEffect(() => {
    window.EA('GET_PROJECT', { project_id: options.id }).then((data) => {
      setProjectData(data);
    });
  }, [options?.id]);

  // Push to history on every real projectData change
  useEffect(() => {
    if (!projectData) return;
    pushHistory(projectData);
  }, [projectData, pushHistory]);

  // Auto save
  useEffect(() => {
    if (!projectData) return;
    window.EA('SAVE_PROJECT', { project_id: options?.id, data: cleanProjectData(projectData) });
  }, [projectData, options?.id]);

  // Action change FPS
  const actionChangeFPS = useCallback(async (trackId, fps = 1) => {
    if (Number(fps) > 0) {
      const sceneId = Number(trackId);
      setProjectData((oldData) => {
        let d = structuredClone(oldData);
        if (d.project.scenes[sceneId]) {
          d.project.scenes[sceneId].framerate = Number(fps);
        }
        return d;
      });
    }
  }, []);

  // Action change ratio
  const actionChangeRatio = useCallback(async (trackId, ratio = null) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        d.project.scenes[sceneId].ratio = ratio || null;
      }
      return d;
    });
  }, []);

  // Action unhide frame
  const actionApplyHiddenFrameStatus = useCallback(async (trackId, frameId, isHidden = false) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        d.project.scenes[sceneId].pictures = d.project.scenes[sceneId].pictures.map((p) => (`${p.id}` !== `${frameId}` ? p : { ...p, hidden: isHidden }));
      }
      return d;
    });
  }, []);

  // Action apply duplicate frame offset
  const actionApplyDuplicateFrameOffset = useCallback(async (trackId, frameId, offset = 0) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        d.project.scenes[sceneId].pictures = d.project.scenes[sceneId].pictures.map((p) => {
          if (`${p.id}` !== `${frameId}`) {
            return p;
          } else {
            const length = (p.length || 1) + offset || 1;
            return { ...p, length: length > 1 ? length : 1 };
          }
        });
      }
      return d;
    });
  }, []);

  // Action clone frame
  const actionCloneFrame = useCallback(async (trackId, frameId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        const newId = v4();
        d.project.scenes[sceneId].pictures = d.project.scenes[sceneId].pictures.reduce((acc, p) => {
          if (`${p.id}` !== `${frameId}`) {
            return [...acc, p];
          } else {
            return [...acc, p, { ...p, id: newId }];
          }
        }, []);
      }
      return d;
    });
  }, []);

  // Action delete frame — soft-deletes the picture and re-anchors any audio chunk
  // that pointed at it onto a neighbouring picture, keeping it at ~the same instant.
  const actionDeleteFrame = useCallback(async (trackId, frameId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      const scene = d.project.scenes[sceneId];
      if (!scene) {
        return d;
      }

      // Compute the re-anchor target while the frame is still alive
      const fps = Math.max(1, Number(scene.framerate) || 1);
      const alive = scene.pictures.filter((p) => !p.deleted);
      const delIdx = alive.findIndex((p) => `${p.id}` === `${frameId}`);
      let reanchor = null;
      if (delIdx !== -1) {
        const prev = alive[delIdx - 1];
        const next = alive[delIdx + 1];
        if (prev) {
          // Anchor to the previous picture; add its hold so the sound keeps its instant
          reanchor = { frameID: prev.id, deltaSeconds: (prev.length || 1) / fps };
        } else if (next) {
          // No previous picture: the next one slides into the freed slot, delay unchanged
          reanchor = { frameID: next.id, deltaSeconds: 0 };
        } else {
          // Last picture of the scene: fall back to the scene start
          reanchor = { frameID: null, deltaSeconds: 0 };
        }
      }

      // Soft delete the picture
      scene.pictures = scene.pictures.map((p) => (`${p.id}` !== `${frameId}` ? p : { ...p, deleted: true }));

      // Re-anchor chunks that pointed at the deleted frame
      if (reanchor) {
        for (const audioTrack of scene.audioTracks || []) {
          for (const chunk of audioTrack.chunks || []) {
            if (`${chunk.frameID}` === `${frameId}`) {
              chunk.frameID = reanchor.frameID;
              chunk.frameDelay = (chunk.frameDelay || 0) + reanchor.deltaSeconds;
            }
          }
        }
      }

      return d;
    });
  }, []);

  // Action rename
  const actionRename = useCallback(async (title) => {
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      d.project.title = title || '';
      return d;
    });
  }, []);

  // Action add scene (appended at the end, new index = previous scenes.length)
  const actionAddScene = useCallback(async (title, framerate = 12, ratio = null) => {
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      d.project.scenes.push({
        id: v4(),
        title: title || '',
        framerate: Number(framerate) || 12,
        ratio: ratio || null,
        pictures: [],
        deleted: false,
      });
      return d;
    });
  }, []);

  // Action rename scene
  const actionRenameScene = useCallback(async (trackId, title) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        d.project.scenes[sceneId].title = title || '';
      }
      return d;
    });
  }, []);

  // Action delete scene (soft delete — keeps disk files & stable indices)
  const actionDeleteScene = useCallback(async (trackId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (!d.project.scenes[sceneId]) {
        return d;
      }
      const aliveOthers = d.project.scenes.filter((s, i) => i !== sceneId && !s.deleted);
      if (aliveOthers.length === 0) {
        return d;
      }
      d.project.scenes[sceneId].deleted = true;
      return d;
    });
  }, []);

  // Action delete frame
  const actionMoveFrame = useCallback(async (trackId, frameId, beforeFrameId = false) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        const index = beforeFrameId === false ? -1 : d.project.scenes[sceneId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);
        const frame = d.project.scenes[sceneId].pictures.find((f) => `${f.id}` === `${frameId}`);
        if (frame) {
          if (index != -1) {
            d.project.scenes[sceneId].pictures = [
              ...d.project.scenes[sceneId].pictures.slice(0, index).filter((f) => `${f.id}` !== `${frameId}`),
              frame,
              ...d.project.scenes[sceneId].pictures.slice(index).filter((f) => `${f.id}` !== `${frameId}`),
            ];
          } else {
            d.project.scenes[sceneId].pictures = [...d.project.scenes[sceneId].pictures.filter((f) => `${f.id}` !== `${frameId}`), frame];
          }
        }
      }
      return d;
    });
  }, []);

  // Action update frame
  const actionUpdateFrame = useCallback(async (trackId, frameId, frameBuffer = null, backgroundBuffer = null, foregroundBuffer = null, transparentBuffer = null) => {
    const sceneId = Number(trackId);

    const [frameObject, backgroundObject, foregroundObject, transparentObject] = await Promise.all([
      frameBuffer
        ? window.EA('SAVE_PICTURE', {
            project_id: options?.id,
            track_id: sceneId,
            buffer: Buffer.from(await frameBuffer.arrayBuffer()),
            extension: mimeTypeToExtension(frameBuffer.type),
          })
        : null,
      backgroundBuffer
        ? window.EA('SAVE_PICTURE', {
            project_id: options?.id,
            track_id: sceneId,
            buffer: Buffer.from(await backgroundBuffer.arrayBuffer()),
            extension: mimeTypeToExtension(backgroundBuffer.type),
          })
        : null,
      foregroundBuffer
        ? window.EA('SAVE_PICTURE', {
            project_id: options?.id,
            track_id: sceneId,
            buffer: Buffer.from(await foregroundBuffer.arrayBuffer()),
            extension: mimeTypeToExtension(foregroundBuffer.type),
          })
        : null,
      transparentBuffer
        ? window.EA('SAVE_PICTURE', {
            project_id: options?.id,
            track_id: sceneId,
            buffer: Buffer.from(await transparentBuffer.arrayBuffer()),
            extension: mimeTypeToExtension(transparentBuffer.type),
          })
        : null,
    ]);

    const newIds = [v4(), v4(), v4(), v4()];

    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        for (let i = 0; i < d.project.scenes[sceneId].pictures.length; i++) {
          // Update main frame
          if (`${d.project.scenes[sceneId].pictures[i].id}` === `${frameId}`) {
            if (frameObject) {
              d.project.scenes[sceneId].pictures[i] = {
                ...d.project.scenes[sceneId].pictures[i],
                ...frameObject,
              };
            }

            // Update background frame
            if (d?.project?.scenes?.[sceneId]?.pictures?.[i]?.masking && backgroundObject) {
              d.project.scenes[sceneId].pictures[i].masking.background = { ...backgroundObject, id: newIds[1] };
            }

            // Update foreground frame
            if (d?.project?.scenes?.[sceneId]?.pictures?.[i]?.masking && foregroundObject) {
              d.project.scenes[sceneId].pictures[i].masking.foreground = { ...foregroundObject, id: newIds[2] };
            }

            // Update transparent frame
            if (d?.project?.scenes?.[sceneId]?.pictures?.[i]?.masking && transparentObject) {
              d.project.scenes[sceneId].pictures[i].masking.transparent = { ...transparentObject, id: newIds[3] };
            }
          }
        }
      }
      return d;
    });
  }, []);

  // Action add frame
  const actionAddFrame = useCallback(
    async (trackId, frameBlob, beforeFrameId = false, backgroundBlob = null) => {
      const frameBuffer = Buffer.from(frameBlob.buffer);
      const frameExtension = mimeTypeToExtension(frameBlob.type);
      const sceneId = Number(trackId);
      const addedPicture = await window.EA('SAVE_PICTURE', {
        project_id: options?.id,
        track_id: sceneId,
        buffer: frameBuffer,
        extension: frameExtension,
      });

      let backgroundPicture = null;
      if (backgroundBlob) {
        const backgroundBuffer = Buffer.from(backgroundBlob.buffer);
        const backgroundExtension = mimeTypeToExtension(backgroundBlob.type);
        backgroundPicture = await window.EA('SAVE_PICTURE', {
          project_id: options?.id,
          track_id: sceneId,
          buffer: backgroundBuffer,
          extension: backgroundExtension,
        });
      }

      setProjectData((oldData) => {
        let d = structuredClone(oldData);
        if (d.project.scenes[sceneId]) {
          const newIds = [v4(), v4(), v4()];
          const index = beforeFrameId === false ? -1 : d.project.scenes[sceneId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);
          const frameToAdd = {
            ...addedPicture,
            ...(backgroundPicture && {
              masking: {
                background: { ...backgroundPicture, id: newIds[1] },
                foreground: { ...addedPicture, id: newIds[2] },
                transparent: null,
              },
            }),
          };

          if (index >= 0) {
            d.project.scenes[sceneId].pictures = [...d.project.scenes[sceneId].pictures.slice(0, index), { ...frameToAdd, id: newIds[0] }, ...d.project.scenes[sceneId].pictures.slice(index)];
          } else {
            d.project.scenes[sceneId].pictures = [...d.project.scenes[sceneId].pictures, { ...frameToAdd, id: newIds[0] }];
          }
        }
        return d;
      });
    },
    [options?.id]
  );

  // Import an audio file: stores the bytes and decodes its duration.
  // Returns { src, sourceDuration } — does not mutate the project.
  const importAudio = useCallback(
    async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const sourceDuration = await getAudioDurationFromArrayBuffer(arrayBuffer);
      const { src } = await window.EA('IMPORT_AUDIO', {
        project_id: options?.id,
        buffer: new Uint8Array(arrayBuffer),
        extension: mimeTypeToExtension(file.type),
      });
      return { src, sourceDuration };
    },
    [options?.id]
  );

  // Action add audio track
  const actionAddAudioTrack = useCallback(async (trackId, title = '') => {
    const sceneId = Number(trackId);
    const id = v4();
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      const scene = d.project.scenes[sceneId];
      if (scene) {
        ensureAudioTracks(scene).push({ id, title, muted: false, volume: 1, chunks: [] });
      }
      return d;
    });
    return id;
  }, []);

  // Action remove audio track
  const actionRemoveAudioTrack = useCallback(async (trackId, audioTrackId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      const scene = d.project.scenes[sceneId];
      if (scene) {
        scene.audioTracks = ensureAudioTracks(scene).filter((t) => `${t.id}` !== `${audioTrackId}`);
      }
      return d;
    });
  }, []);

  // Action update audio track (title / muted / volume)
  const actionUpdateAudioTrack = useCallback(async (trackId, audioTrackId, patch = {}) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      const scene = d.project.scenes[sceneId];
      if (scene) {
        scene.audioTracks = ensureAudioTracks(scene).map((t) => (`${t.id}` !== `${audioTrackId}` ? t : { ...t, ...patch }));
      }
      return d;
    });
  }, []);

  // Action add audio chunk (imports the file, then anchors it on the track)
  const actionAddAudioChunk = useCallback(
    async (trackId, audioTrackId, file, { frameID = null, frameDelay = 0 } = {}) => {
      const sceneId = Number(trackId);
      const { src, sourceDuration } = await importAudio(file);
      const id = v4();
      setProjectData((oldData) => {
        let d = structuredClone(oldData);
        const scene = d.project.scenes[sceneId];
        if (scene) {
          const track = ensureAudioTracks(scene).find((t) => `${t.id}` === `${audioTrackId}`);
          if (track) {
            track.chunks = [...(track.chunks || []), { id, src, frameID, frameDelay, startAt: 0, duration: sourceDuration, sourceDuration }];
          }
        }
        return d;
      });
      return id;
    },
    [importAudio]
  );

  // Action update audio chunk (frameID / frameDelay / startAt / duration)
  const actionUpdateAudioChunk = useCallback(async (trackId, audioTrackId, chunkId, patch = {}) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      const scene = d.project.scenes[sceneId];
      if (scene) {
        const track = ensureAudioTracks(scene).find((t) => `${t.id}` === `${audioTrackId}`);
        if (track) {
          track.chunks = (track.chunks || []).map((c) => (`${c.id}` !== `${chunkId}` ? c : { ...c, ...patch }));
        }
      }
      return d;
    });
  }, []);

  // Action remove audio chunk
  const actionRemoveAudioChunk = useCallback(async (trackId, audioTrackId, chunkId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      const scene = d.project.scenes[sceneId];
      if (scene) {
        const track = ensureAudioTracks(scene).find((t) => `${t.id}` === `${audioTrackId}`);
        if (track) {
          track.chunks = (track.chunks || []).filter((c) => `${c.id}` !== `${chunkId}`);
        }
      }
      return d;
    });
  }, []);

  // Action Undo
  const actionUndo = useCallback(() => {
    const prev = historyUndo();
    if (prev) setProjectData(structuredClone(prev));
  }, [historyUndo]);

  // Action Redo
  const actionRedo = useCallback(() => {
    const next = historyRedo();
    if (next) setProjectData(structuredClone(next));
  }, [historyRedo]);

  return {
    project: projectData?.project || null,
    canUndo,
    canRedo,
    actions: {
      changeFPS: actionChangeFPS,
      changeRatio: actionChangeRatio,
      applyHiddenFrameStatus: actionApplyHiddenFrameStatus,
      applyDuplicateFrameOffset: actionApplyDuplicateFrameOffset,
      cloneFrame: actionCloneFrame,
      deleteFrame: actionDeleteFrame,
      rename: actionRename,
      moveFrame: actionMoveFrame,
      addFrame: actionAddFrame,
      updateFrame: actionUpdateFrame,
      addScene: actionAddScene,
      renameScene: actionRenameScene,
      deleteScene: actionDeleteScene,
      importAudio,
      addAudioTrack: actionAddAudioTrack,
      removeAudioTrack: actionRemoveAudioTrack,
      updateAudioTrack: actionUpdateAudioTrack,
      addAudioChunk: actionAddAudioChunk,
      updateAudioChunk: actionUpdateAudioChunk,
      removeAudioChunk: actionRemoveAudioChunk,
      undo: actionUndo,
      redo: actionRedo,
    },
  };
}

export default useProject;
