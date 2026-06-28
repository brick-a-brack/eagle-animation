import { useCallback, useEffect, useState } from 'react';

const getDefaultFrame = (data) => {
  for (let i = 0; i < (data?.project?.scenes?.length || 0); i++) {
    if (data?.project?.scenes?.[i]?.deleted) {
      continue;
    }
    for (const picture of data?.project?.scenes?.[i]?.pictures || []) {
      if (!picture?.deleted && !picture?.hidden) {
        return { projectId: data?.id, sceneId: i, picture };
      }
    }
  }
  for (let i = 0; i < (data?.project?.scenes?.length || 0); i++) {
    if (data?.project?.scenes?.[i]?.deleted) {
      continue;
    }
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
    if (scene.deleted) {
      continue;
    }
    for (const picture of scene.pictures) {
      if (!picture.deleted) {
        count++;
      }
    }
  }
  return count;
};

// Number of non-deleted scenes (including empty ones)
const countScenes = (project) => {
  let count = 0;
  for (const scene of project.scenes) {
    if (scene.deleted) {
      continue;
    }
    count++;
  }
  return count;
};

// Total animation duration in seconds (each scene played at its own framerate)
const computeDuration = (project) => {
  let seconds = 0;
  for (const scene of project.scenes) {
    if (scene.deleted) {
      continue;
    }
    const framerate = Number(scene.framerate) > 0 ? Number(scene.framerate) : 1;
    let frames = 0;
    for (const picture of scene.pictures) {
      if (!picture.deleted) {
        frames++;
      }
    }
    seconds += frames / framerate;
  }
  return seconds;
};

// Framerate to display for the project (first non-empty scene, fallback to first scene)
const getFramerate = (project) => {
  const sceneWithFrames = project.scenes.find((scene) => !scene.deleted && scene.pictures.some((p) => !p.deleted));
  const scene = sceneWithFrames || project.scenes.find((s) => !s.deleted) || project.scenes[0];
  return Number(scene?.framerate) || null;
};

function useProjects(options) {
  const [projectsData, setProjectsData] = useState(null);

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
  }, []);

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
  }, []);

  // Action toggle favorite
  const actionSetFavorite = useCallback(async (projectId, favorite) => {
    setProjectsData((oldData) => {
      return oldData.map((e) => {
        let d = structuredClone(e);
        if (d.id === projectId) {
          d.project.favorite = Boolean(favorite);
        }
        return d;
      });
    });

    let d = await window.EA('GET_PROJECT', { project_id: projectId });
    d.project.favorite = Boolean(favorite);
    window.EA('SAVE_PROJECT', { project_id: projectId, data: d });
  }, []);

  // Action create
  const actionCreate = useCallback(
    async (title = '') => {
      const project = await window.EA('NEW_PROJECT', { title });
      actionRefresh();
      return project;
    },
    [actionRefresh]
  );

  return {
    projects:
      projectsData?.map((e) => ({
        ...(e || {}),
        stats: {
          frames: countFrames(e.project),
          duration: computeDuration(e.project),
          framerate: getFramerate(e.project),
          scenes: countScenes(e.project),
        },
        favorite: Boolean(e?.project?.favorite),
        creation: e?.project?.creation || null,
        updated: e?.project?.updated || null,
        preview: getDefaultFrame(e)?.picture?.link || null,
      })) || null,
    actions: {
      refresh: actionRefresh,
      create: actionCreate,
      rename: actionRename,
      setFavorite: actionSetFavorite,
    },
  };
}

export default useProjects;
