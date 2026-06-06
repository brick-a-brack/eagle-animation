import { isIos } from '@braintree/browser-detection';
import HeaderBar from '@components/HeaderBar';
import HomeStats from '@components/HomeStats';
import HomeToolbar from '@components/HomeToolbar';
import Logo from '@components/Logo';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ProjectCard from '@components/ProjectCard';
import VersionUpdater from '@components/VersionUpdater';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAppVersion from '@hooks/useAppVersion';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useFullscreen from '@hooks/useFullscreen';
import useLocalStorage from '@hooks/useLocalStorage';
import useProjects from '@hooks/useProjects';
import useSettings from '@hooks/useSettings';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import { useEffect, useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as style from './Home.module.css';

const LS_HOME_VIEW = 'EA_HOME_VIEW';
const LS_HOME_SORT = 'EA_HOME_SORT';

const HomeView = ({ t }) => {
  const { version, latestVersion, actions: versionActions } = useAppVersion();
  const { projects, actions: projectsActions } = useProjects();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  useDiscordActivity({ description: t('Ready to animate') });

  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [view, setView] = useLocalStorage(LS_HOME_VIEW, 'GRID');
  const [sort, setSort] = useLocalStorage(LS_HOME_SORT, 'UPDATED');

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

  const isFiltering = search.trim() !== '' || favoritesOnly;
  const hasProjects = realProjects.length > 0;

  return (
    <PageLayout>
      <HeaderBar
        leftChildren={<VersionUpdater onClick={handleLink} version={version} latestVersion={latestVersion} onLink={handleLink} />}
        rightActions={[...(settings?.EVENT_MODE_ENABLED ? ['SYNC_LIST'] : []), ...(!isIos() ? [isFullscreen ? 'EXIT_FULLSCREEN' : 'ENTER_FULLSCREEN'] : []), 'SHORTCUTS', 'SETTINGS']}
        onAction={handleAction}
        withBorder
      >
        <Logo />
      </HeaderBar>
      <PageContent>
        {projects !== null && (
          <div className={style.container}>
            {hasProjects && (
              <div className={style.header}>
                <HomeStats projectsCount={stats.projectsCount} photosCount={stats.photosCount} durationSeconds={stats.durationSeconds} favoritesCount={stats.favoritesCount} />
                <HomeToolbar
                  search={search}
                  onSearchChange={setSearch}
                  sort={sort}
                  onSortChange={setSort}
                  favoritesOnly={favoritesOnly}
                  onToggleFavorites={setFavoritesOnly}
                  view={view}
                  onViewChange={setView}
                />
              </div>
            )}

            <div className={view === 'LIST' ? style.list : style.grid}>
              {!isFiltering && <ProjectCard placeholder={t('New project')} onClick={handleCreateProject} icon="ADD" layout={view} />}
              {visibleProjects.map((e) => (
                <ProjectCard
                  key={e.id}
                  id={e.id}
                  title={e.project.title}
                  picture={e.preview}
                  nbFrames={e?.stats?.frames || 0}
                  framerate={e?.stats?.framerate}
                  duration={e?.stats?.duration}
                  creation={e.creation}
                  updated={e.updated}
                  favorite={e.favorite}
                  onClick={handleOpenProject}
                  onTitleChange={handleRenameProject}
                  onFavoriteToggle={handleFavoriteProject}
                  layout={view}
                />
              ))}
            </div>

            {hasProjects && isFiltering && visibleProjects.length === 0 && (
              <div className={style.empty}>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <span>{t('No projects match your search')}</span>
              </div>
            )}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
};

export default withTranslation()(HomeView);
