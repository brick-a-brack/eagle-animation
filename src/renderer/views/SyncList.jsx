import DesktopNavigation from '@components/DesktopNavigation';
import EmptyState from '@components/EmptyState';
import LoadingPage from '@components/LoadingPage';
import MobileNavigation from '@components/MobileNavigation';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import SyncItem, { getSyncStatus } from '@components/SyncItem';
import SyncStats from '@components/SyncStats';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useSyncList from '@hooks/useSyncList';
import faArrowLeft from '@icons/faArrowLeft';
import faFilm from '@icons/faFilm';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SyncListView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const { items, isLoading } = useSyncList();
  const navigate = useNavigate();
  useDiscordActivity({ description: t('Ready to animate') });

  const handleBack = () => {
    navigate(searchParams.get('back') || '/');
  };

  // Upload order: active upload, then the queue, then idle/failed items, then uploaded ones (newest first)
  const STATUS_RANK = { uploading: 0, retrying: 0, queued: 1, error: 2, pending: 2, uploaded: 3 };
  const orderedItems = items
    .map((item, index) => ({ item, index, rank: STATUS_RANK[getSyncStatus(item)] ?? 2 }))
    .sort((a, b) => a.rank - b.rank || (a.rank === 1 ? (a.item.queuePosition || 0) - (b.item.queuePosition || 0) : a.rank === 3 ? b.index - a.index : a.index - b.index))
    .map(({ item }) => item);

  const primaryActions = [{ label: t('Back'), icon: faArrowLeft, onClick: handleBack }];

  return (
    <>
      <LoadingPage show={isLoading} />
      <PageLayout hasMobileLeftBar={true}>
        <DesktopNavigation leftActions={primaryActions} title={t('Sync list')} />
        <MobileNavigation topLeftActions={primaryActions} showLeftActions={true} />
        <PageContent>
          {orderedItems.length === 0 && <EmptyState message={t('No items to sync')} icon={faFilm} />}
          {orderedItems.length > 0 && (
            <div style={{ padding: '20px' }}>
              <SyncStats items={items} />
              {orderedItems.map((item) => (
                <SyncItem key={item.fileName} {...item} />
              ))}
            </div>
          )}
        </PageContent>
      </PageLayout>
    </>
  );
};

export default withTranslation()(SyncListView);
