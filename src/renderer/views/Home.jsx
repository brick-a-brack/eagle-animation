import { isIos } from '@braintree/browser-detection';
import DesktopNavigation from '@components/DesktopNavigation';
import Logo from '@components/Logo';
import MobileNavigation from '@components/MobileNavigation';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ProjectCard from '@components/ProjectCard';
import ProjectsGrid from '@components/ProjectsGrid';
import VersionUpdater from '@components/VersionUpdater';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useAppVersion from '@hooks/useAppVersion';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useFullscreen from '@hooks/useFullscreen';
import useProjects from '@hooks/useProjects';
import useSettings from '@hooks/useSettings';
import faArrowLeft from '@icons/faArrowLeft';
import faDownLeftAndUpRightToCenter from '@icons/faDownLeftAndUpRightToCenter';
import faGear from '@icons/faGear';
import faKeyboard from '@icons/faKeyboard';
import faListCheck from '@icons/faListCheck';
import faUpRightAndDownLeftFromCenter from '@icons/faUpRightAndDownLeftFromCenter';
import { useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const HomeView = ({ t }) => {
  const { version, latestVersion, actions: versionActions } = useAppVersion();
  const { appCapabilities } = useAppCapabilities();
  const { projects, actions: projectsActions } = useProjects();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  useDiscordActivity({ description: t('Ready to animate') });

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

  const handleAction = (action) => () => {
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
    if (action === 'RETURN_TO_WEBSITE') {
      window.EA('OPEN_LINK', { link: 'https://eagle-animation.com/' });
    }
  };

  const primaryActions = [...(appCapabilities.includes('RETURN_TO_WEBSITE') ? [{ label: t('Back'), icon: faArrowLeft, onClick: handleAction('RETURN_TO_WEBSITE') }] : [])];

  const secondaryActions = [
    ...(settings?.EVENT_MODE_ENABLED ? [{ label: t('Sync list'), icon: faListCheck, onClick: handleAction('SYNC_LIST') }] : []),
    ...(!isIos()
      ? [
          isFullscreen
            ? { label: t('Exit fullscreen'), icon: faDownLeftAndUpRightToCenter, onClick: handleAction('EXIT_FULLSCREEN') }
            : { label: t('Fullscreen'), icon: faUpRightAndDownLeftFromCenter, onClick: handleAction('ENTER_FULLSCREEN') },
        ]
      : []),
    { label: t('Shortcuts'), icon: faKeyboard, onClick: handleAction('SHORTCUTS') },
    { label: t('Settings'), icon: faGear, onClick: handleAction('SETTINGS') },
  ];

  return (
    <PageLayout hasMobileLeftBar={true}>
      <DesktopNavigation
        leftChildren={<VersionUpdater onClick={handleLink} version={version} latestVersion={latestVersion} onLink={handleLink} />}
        leftActions={primaryActions}
        rightActions={secondaryActions}
        onAction={handleAction}
        withBorder
      >
        <Logo />
      </DesktopNavigation>
      <MobileNavigation showLogo={true} topLeftActions={primaryActions} bottomLeftActions={secondaryActions} showLeftActions={true} withBorder={true} />
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
