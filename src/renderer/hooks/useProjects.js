import { OptimizeFrame } from '@core/Optimizer';
import { useCallback, useEffect, useState } from 'react';

const getDefaultFrame = (data) => {
  for (let i = 0; i < (data?.project?.scenes?.length || 0); i++) {
    for (const picture of data?.project?.scenes?.[i]?.pictures || []) {
      if (!picture?.deleted && !picture?.hidden) {
        return { projectId: data?.id, sceneId: i, picture };
      }
    }
  }
  for (let i = 0; i < (data?.project?.scenes?.length || 0); i++) {
    for (const picture of data?.project?.scenes?.[i]?.pictures || []) {
      if (!picture?.deleted) {
        return { projectId: data?.id, sceneId: i, picture };
      }
    }
  }
  return null;
};

// Use loop for performance issues
const countFrames = (project) => {
  let count = 0;
  for (const scene of project.scenes) {
    for (const picture of scene.pictures) {
      if (!picture.deleted) {
        count++;
      }
    }
  }
  return count;
};

function useProjects(options) {
  const [projectsData, setProjectsData] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Initial load
  useEffect(() => {
    if (!options?.skip) {
      window.EA('GET_PROJECTS').then((data) => {
        setProjectsData(data);
      });
    }
  }, [options?.skip]);

  // Action refresh
  const actionRefresh = useCallback(async () => {
    window.EA('GET_PROJECTS').then((data) => {
      setProjectsData(data);
    });
  });

  useEffect(() => {
    if (!projectsData) {
      return;
    }
    Promise.all(
      projectsData.map(async (project) => {
        const defaultFrame = await getDefaultFrame(project);
        if (!defaultFrame?.picture) {
          return null;
        }
        const optimizedFrame = await OptimizeFrame(defaultFrame.projectId, defaultFrame.sceneId, defaultFrame.picture.id, 'preview', defaultFrame.picture.link);
        return optimizedFrame;
      })
    ).then((links) => {
      setPreviewUrls(links);
    });
  }, [projectsData]);

  // Action rename
  const actionRename = useCallback(async (projectId, title = '') => {
    setProjectsData((oldData) => {
      return oldData.map((e) => {
        let d = structuredClone(e);
        if (d.id === projectId) {
          d.project.title = title || '';
        }
        return d;
      });
    });

    let d = await window.EA('GET_PROJECT', { project_id: projectId });
    d.project.title = title || '';
    window.EA('SAVE_PROJECT', { project_id: projectId, data: d });
  });

  // Action create
  const actionCreate = useCallback(async (title = '') => {
    const project = await window.EA('NEW_PROJECT', { title });
    actionRefresh();
    return project;
  });

  return {
    projects: projectsData?.map((e, i) => ({ ...(e || {}), stats: { frames: countFrames(e.project) }, preview: previewUrls[i] || null })) || null,
    actions: {
      refresh: actionRefresh,
      create: actionCreate,
      rename: actionRename,
    },
  };
}

export default useProjects;
