import { useCallback, useEffect, useRef, useState } from 'react';

import { OptimizeFrame } from '../core/Optimizer';

function useProject(options) {
  const [projectData, setProjectData] = useState(null);
  const [projectClock, setProjectClock] = useState(null);
  const framesCache = useRef({});

  // Initial load
  useEffect(() => {
    window.EA('GET_PROJECT', { project_id: options.id }).then((data) => {
      setProjectData(data);
    });
  }, [options.id]);

  // Project preview clock
  useEffect(() => {
    const clock = setInterval(() => {
      setProjectClock(new Date().getTime());
    }, 100);
    return () => clearInterval(clock);
  }, [projectClock]);

  // Auto save
  useEffect(() => {
    if (projectData) {
      let d = structuredClone(projectData);
      delete d._path;
      delete d._file;
      for (const trackIndex in d.project.scenes) {
        for (const pictureIndex in d.project.scenes[trackIndex].pictures) {
          delete d.project.scenes[trackIndex].pictures[pictureIndex].link;
        }
      }
      window.EA('SAVE_PROJECT', { project_id: options.id, data: d });
    }
  }, [JSON.stringify(projectData)]);

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
  });

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
  });

  // Action unhideFrame
  const actionApplyHiddenFrameStatus = useCallback(async (trackId, frameId, isHidden = false) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        d.project.scenes[sceneId].pictures = d.project.scenes[sceneId].pictures.map((p) => (`${p.id}` !== `${frameId}` ? p : { ...p, hidden: isHidden }));
      }
      return d;
    });
  });

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
  });

  // Action clone frame
  const actionCloneFrame = useCallback(async (trackId, frameId) => {
    const sceneId = Number(trackId);
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        const newId = Math.max(0, ...d.project.scenes[sceneId].pictures.map((e) => e.id)) + 1;
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
  });

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
  });

  // Action rename
  const actionRename = useCallback(async (title) => {
    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      d.project.title = title || '';
      return d;
    });
  });

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
  });

  // Action add frame
  const actionAddFrame = useCallback(async (trackId, buffer, extension = 'jpg', beforeFrameId = false) => {
    const sceneId = Number(trackId);
    const addedPicture = await window.EA('SAVE_PICTURE', {
      project_id: options?.id,
      track_id: sceneId,
      buffer,
      extension: ['png', 'jpg', 'webp'].includes(extension?.toLowerCase()) ? extension?.toLowerCase() : 'jpg',
    });

    setProjectData((oldData) => {
      let d = structuredClone(oldData);
      if (d.project.scenes[sceneId]) {
        const newId = Math.max(0, ...d.project.scenes[sceneId].pictures.map((e) => e.id)) + 1;
        const index = beforeFrameId === false ? -1 : d.project.scenes[sceneId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);
        if (index >= 0) {
          d.project.scenes[sceneId].pictures = [...d.project.scenes[sceneId].pictures.slice(0, index), { ...addedPicture, id: newId }, ...d.project.scenes[sceneId].pictures.slice(index)];
        } else {
          d.project.scenes[sceneId].pictures = [...d.project.scenes[sceneId].pictures, { ...addedPicture, id: newId }];
        }
      }
      return d;
    });
  });

  const bindPreviewPictures = (pData) => {
    if (!pData?.project) {
      return null;
    }

    let d = structuredClone(pData);

    for (let sceneId = 0; sceneId < d.project.scenes.length; sceneId++) {
      for (let frameIndex = 0; frameIndex < d.project.scenes[sceneId].pictures.length; frameIndex++) {
        const frame = d.project.scenes[sceneId].pictures[frameIndex];

        // THUMBNAIL SUPPORT
        if (framesCache.current[`${options?.id}_${sceneId}_${frame.id}_thumbnail`]) {
          d.project.scenes[sceneId].pictures[frameIndex].thumbnail = framesCache.current[`${options?.id}_${sceneId}_${frame.id}_thumbnail`] || null;
        } else {
          d.project.scenes[sceneId].pictures[frameIndex].thumbnail = null;
          (async () => {
            const url = await OptimizeFrame(options?.id, sceneId, frame.id, 'thumbnail', frame.link);
            if (url) {
              framesCache.current[`${options?.id}_${sceneId}_${frame.id}_thumbnail`] = url;
            }
          })();
        }

        // PREVIEW SUPPORT
        if (framesCache.current[`${options?.id}_${sceneId}_${frame.id}_preview`]) {
          d.project.scenes[sceneId].pictures[frameIndex].preview = framesCache.current[`${options?.id}_${sceneId}_${frame.id}_preview`] || null;
        } else {
          d.project.scenes[sceneId].pictures[frameIndex].preview = null;
          (async () => {
            const url = await OptimizeFrame(options?.id, sceneId, frame.id, 'preview', frame.link);
            if (url) {
              framesCache.current[`${options?.id}_${sceneId}_${frame.id}_preview`] = url;
            }
          })();
        }
      }
    }

    return d;
  };

  return {
    project: bindPreviewPictures(projectData)?.project || null,
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
    },
  };
}

export default useProject;
