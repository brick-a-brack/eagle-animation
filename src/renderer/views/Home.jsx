import { CONTRIBUTE_REPOSITORY, VERSION } from '../config';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProjectsGrid from '../components/ProjectsGrid';
import ProjectCard from '../components/ProjectCard';
import { withTranslation } from 'react-i18next';
import ActionsBar from '../components/ActionsBar';
import useCamera from '../hooks/useCamera';

const HomeView = ({ t }) => {
  const [latestVersion, setLatestVersion] = useState(null);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const { actions: cameraActions } = useCamera();

  useEffect(() => {
    cameraActions.setCamera(null);
  }, []);

  useEffect(() => {
    (async () => {
      // Get projects
      setProjects(await window.EA('GET_PROJECTS'));

      // Fetch updates
      setLatestVersion((await window.EA('GET_LAST_VERSION').catch(() => null))?.version || null);

      // Trigger background sync
      window.EA('SYNC');
    })();
  }, []);

  const handleCreateProject = async (_, title) => {
    const project = await window.EA('NEW_PROJECT', { title });
    navigate(`/animator/${project.id}/0`);
  };

  const handleOpenProject = async (id) => {
    navigate(`/animator/${id}/0`);
  };

  const handleRenameProject = async (id, title) => {
    await window.EA('RENAME_PROJECT', { project_id: id, title: title || t('Untitled') });
  };

  const handleLink = () => {
    window.EA('OPEN_LINK', { link: `https://github.com/${CONTRIBUTE_REPOSITORY}/releases` });
  };

  const handleAction = (action) => {
    if (action === 'SETTINGS') {
      navigate('/settings?back=/');
    }
    if (action === 'SHORTCUTS') {
      navigate('/shortcuts?back=/');
    }
  };

  return (
    <>
      <Header action={handleLink} version={VERSION} latestVersion={latestVersion} />
      <ActionsBar actions={['SETTINGS', 'SHORTCUTS']} position="RIGHT" onAction={handleAction} />
      <ProjectsGrid>
        <ProjectCard placeholder={t('New project')} onClick={handleCreateProject} icon="ADD" />
        {[...projects]
          .sort((a, b) => b.project.updated - a.project.updated)
          .map((e) => (
            <ProjectCard key={e.id} id={e.id} title={e.project.title} picture={e.preview} onClick={handleOpenProject} onTitleChange={handleRenameProject} />
          ))}
      </ProjectsGrid>
    </>
  );
};

export default withTranslation()(HomeView);
