import { mimeTypeToExtension } from '@core/frameTypes';
import { useCallback, useEffect, useState } from 'react';
import { v4 } from 'uuid';

function useProject(options) {
  const [projectData, setProjectData] = useState(null);

  // Initial load
  useEffect(() => {
    window.EA('GET_PROJECT', { project_id: options.id }).then((data) => {
      setProjectData(data);
    });
  }, [options?.id]);

  // Auto save
  useEffect(() => {
    if (projectData) {
      let d = structuredClone(projectData);
      delete d._path;
      delete d._file;
      for (const trackIndex in d.project.scenes) {
        for (const pictureIndex in d.project.scenes[trackIndex].pictures) {
          delete d.project.scenes[trackIndex].pictures[pictureIndex].link;
          delete d.project.scenes[trackIndex].pictures[pictureIndex].metaLink;
          if (d.project.scenes[trackIndex].pictures[pictureIndex]?.masking?.background) {
            delete d.project.scenes[trackIndex].pictures[pictureIndex].masking.background.link;
            delete d.project.scenes[trackIndex].pictures[pictureIndex].masking.background.metaLink;
          }
          if (d.project.scenes[trackIndex].pictures[pictureIndex]?.masking?.foreground) {
            delete d.project.scenes[trackIndex].pictures[pictureIndex].masking.foreground.link;
            delete d.project.scenes[trackIndex].pictures[pictureIndex].masking.foreground.metaLink;
          }
          if (d.project.scenes[trackIndex].pictures[pictureIndex]?.masking?.transparent) {
            delete d.project.scenes[trackIndex].pictures[pictureIndex].masking.transparent.link;
            delete d.project.scenes[trackIndex].pictures[pictureIndex].masking.transparent.metaLink;
          }
        }
      }
      window.EA('SAVE_PROJECT', { project_id: options?.id, data: d });
    }
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

  // Action delete frame
  const actionDeleteFrame = useCallback(async (trackId, frameId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        d.project.scenes[sceneId].pictures = d.project.scenes[sceneId].pictures.map((p) => (`${p.id}` !== `${frameId}` ? p : { ...p, deleted: true }));
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

  return {
    project: projectData?.project || null,
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
    },
  };
}

export default useProject;
