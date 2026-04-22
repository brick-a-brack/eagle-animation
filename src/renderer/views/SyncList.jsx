import EmptyState from '@components/EmptyState';
import HeaderBar from '@components/HeaderBar';
import LoadingPage from '@components/LoadingPage';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import SyncItem from '@components/SyncItem';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useSyncList from '@hooks/useSyncList';
import faFilm from '@icons/faFilm';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SyncListView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const { items } = useSyncList();
  const navigate = useNavigate();
  useDiscordActivity({ description: t('Ready to animate') });

  const handleBack = () => {
    navigate(searchParams.get('back') || '/');
  };

  const orderedItems = [...[...items].reverse().filter((item) => item.isUploaded === false), ...[...items].reverse().filter((item) => item.isUploaded === true)];

  return (
    <>
      <LoadingPage show={!items} />
      <PageLayout>
        <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Sync list')} withBorder />
        <PageContent>
          {orderedItems.length === 0 && <EmptyState message={t('No items to sync')} icon={faFilm} />}
          {orderedItems.length > 0 && (
            <div style={{ padding: '20px' }}>
              {orderedItems.map((item) => (
                <SyncItem key={item.filename} {...item} />
              ))}
            </div>
          )}
        </PageContent>
      </PageLayout>
    </>
  );
};

export default withTranslation()(SyncListView);
