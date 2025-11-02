import { isIos } from '@braintree/browser-detection';
import HeaderBar from '@components/HeaderBar';
import Logo from '@components/Logo';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ProjectCard from '@components/ProjectCard';
import ProjectsGrid from '@components/ProjectsGrid';
import VersionUpdater from '@components/VersionUpdater';
import useAppVersion from '@hooks/useAppVersion';
import useFullscreen from '@hooks/useFullscreen';
import useProjects from '@hooks/useProjects';
import useSettings from '@hooks/useSettings';
import { useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const HomeView = ({ t }) => {
  const { version, latestVersion, actions: versionActions } = useAppVersion();
  const { projects, actions: projectsActions } = useProjects();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();

  useEffect(() => {
    // Trigger background sync
    window.EA('SYNC');
  }, []);

  const handleCreateProject = async (_, title) => {
    const project = await projectsActions.create(title || '');
    navigate(`/animator/${project.id}/0`);
    window.track('project_created', { projectId: project.id });
  };

  const handleOpenProject = async (id) => {
    navigate(`/animator/${id}/0`);
    window.track('project_opened', { projectId: id });
  };

  const handleRenameProject = async (id, title) => {
    projectsActions.rename(id, title || '');
    window.track('project_renamed', { projectId: id });
  };

  const handleLink = () => {
    versionActions.openUpdatePage();
  };

  const handleAction = (action) => {
    if (action === 'SETTINGS') {
      navigate('/settings?back=/');
    }
    if (action === 'SHORTCUTS') {
      navigate('/shortcuts?back=/');
    }
    if (action === 'SYNC_LIST') {
      navigate('/sync-list?back=/');
    }
    if (action === 'ENTER_FULLSCREEN') {
      enterFullscreen();
    }
    if (action === 'EXIT_FULLSCREEN') {
      exitFullscreen();
    }
  };

  return (
    <PageLayout>
      <HeaderBar
        leftChildren={<VersionUpdater onClick={handleLink} version={version} latestVersion={latestVersion} onLink={handleLink} />}
        rightActions={[
          ...(settings?.EVENT_MODE_ENABLED && settings?.EVENT_API ? ['SYNC_LIST'] : []),
          ...(!isIos() ? [isFullscreen ? 'EXIT_FULLSCREEN' : 'ENTER_FULLSCREEN'] : []),
          'SHORTCUTS',
          'SETTINGS',
        ]}
        onAction={handleAction}
        withBorder
      >
        <Logo />
      </HeaderBar>
      <PageContent>
        {projects !== null && (
          <ProjectsGrid>
            <ProjectCard placeholder={t('New project')} onClick={handleCreateProject} icon="ADD" />
            {[...projects]
              .filter((e) => Boolean(e?.stats?.frames || 0))
              .sort((a, b) => b.project.updated - a.project.updated)
              .map((e) => (
                <ProjectCard key={e.id} id={e.id} title={e.project.title} picture={e.preview} nbFrames={e?.stats?.frames || 0} onClick={handleOpenProject} onTitleChange={handleRenameProject} />
              ))}
          </ProjectsGrid>
        )}
      </PageContent>
    </PageLayout>
  );
};

export default withTranslation()(HomeView);
