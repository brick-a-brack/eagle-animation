import { useCallback, useEffect, useState } from 'react';

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
  });

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
    projects: projectsData || [],
    actions: {
      refresh: actionRefresh,
      create: actionCreate,
      rename: actionRename,
    },
  };
}

export default useProjects;
