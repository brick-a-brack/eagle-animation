import { isIos } from '@braintree/browser-detection';
import DesktopNavigation from '@components/DesktopNavigation';
import HomeStats from '@components/HomeStats';
import HomeToolbar from '@components/HomeToolbar';
import MobileNavigation from '@components/MobileNavigation';
import NewProjectCard from '@components/NewProjectCard';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ProjectCard from '@components/ProjectCard';
import Tour from '@components/Tour';
import UpdateBanner from '@components/UpdateBanner';
import VersionTagOverlay from '@components/VersionTagOverlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAppCapabilities from '@hooks/useAppCapabilities';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useFullscreen from '@hooks/useFullscreen';
import useProjects from '@hooks/useProjects';
import useSettings from '@hooks/useSettings';
import faArrowLeft from '@icons/faArrowLeft';
import faDownLeftAndUpRightToCenter from '@icons/faDownLeftAndUpRightToCenter';
import faGear from '@icons/faGear';
import faKeyboard from '@icons/faKeyboard';
import faListCheck from '@icons/faListCheck';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import faUpRightAndDownLeftFromCenter from '@icons/faUpRightAndDownLeftFromCenter';
import { useEffect, useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as style from './Home.module.css';

const HomeView = ({ t }) => {
  const { appCapabilities } = useAppCapabilities();
  const { projects, actions: projectsActions } = useProjects();

  const { settings } = useSettings();
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  useDiscordActivity({ description: t('Ready to animate') });

  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState('UPDATED');

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

  const handleFavoriteProject = async (id, favorite) => {
    projectsActions.setFavorite(id, favorite);
    window.track('project_favorited', { projectId: id, favorite });
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

  // Only projects that actually contain frames are listed
  const realProjects = useMemo(() => (projects || []).filter((e) => Boolean(e?.stats?.frames || 0)), [projects]);

  const stats = useMemo(
    () => ({
      projectsCount: realProjects.length,
      photosCount: realProjects.reduce((acc, e) => acc + (e?.stats?.frames || 0), 0),
      durationSeconds: realProjects.reduce((acc, e) => acc + (e?.stats?.duration || 0), 0),
      favoritesCount: realProjects.filter((e) => e.favorite).length,
    }),
    [realProjects]
  );

  const visibleProjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = realProjects.filter((e) => {
      if (favoritesOnly && !e.favorite) {
        return false;
      }
      if (needle && !(e.project.title || '').toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (sort === 'CREATED') {
      sorted.sort((a, b) => (b.creation || 0) - (a.creation || 0));
    } else if (sort === 'NAME') {
      sorted.sort((a, b) => (a.project.title || t('Untitled')).localeCompare(b.project.title || t('Untitled')));
    } else if (sort === 'FRAMES') {
      sorted.sort((a, b) => (b?.stats?.frames || 0) - (a?.stats?.frames || 0));
    } else {
      sorted.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    }
    return sorted;
  }, [realProjects, search, favoritesOnly, sort, t]);

  const isFiltering = !!((search || '').trim() !== '' || favoritesOnly);
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
      <DesktopNavigation showLogo={true} leftActions={primaryActions} rightActions={secondaryActions} />
      <MobileNavigation showLogo={true} topLeftActions={primaryActions} bottomLeftActions={secondaryActions} showLeftActions={true} />
      <VersionTagOverlay />
      <PageContent>
        {projects !== null && (
          <>
            <div className={style.container}>
              <UpdateBanner />
              <div className={style.header}>
                <HomeStats projectsCount={stats.projectsCount} photosCount={stats.photosCount} durationSeconds={stats.durationSeconds} favoritesCount={stats.favoritesCount} />
                <HomeToolbar search={search} onSearchChange={setSearch} sort={sort} onSortChange={setSort} favoritesOnly={favoritesOnly} onToggleFavorites={setFavoritesOnly} />
              </div>
              {(visibleProjects.length > 0 || !isFiltering) && (
                <div className={style.grid}>
                  {!isFiltering && <NewProjectCard onClick={handleCreateProject} />}
                  {visibleProjects.map((e) => (
                    <ProjectCard
                      key={e.id}
                      id={e.id}
                      title={e.project.title}
                      picture={e.preview}
                      nbFrames={e?.stats?.frames || 0}
                      nbScenes={e?.stats?.scenes || 0}
                      duration={e?.stats?.duration}
                      creation={e.creation}
                      updated={e.updated}
                      favorite={e.favorite}
                      onClick={handleOpenProject}
                      onTitleChange={handleRenameProject}
                      onFavoriteToggle={handleFavoriteProject}
                    />
                  ))}
                </div>
              )}
            </div>
            {isFiltering && visibleProjects.length === 0 && (
              <div className={style.empty}>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <span>{t('No projects match your search')}</span>
              </div>
            )}
            <Tour tourKey="HOME" />
          </>
        )}
      </PageContent>
    </PageLayout>
  );
};

export default withTranslation()(HomeView);
