import HeaderBar from '@components/HeaderBar';
import LoadingPage from '@components/LoadingPage';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import SyncItem from '@components/SyncItem';
import useSyncList from '@hooks/useSyncList';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SyncListView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const { items } = useSyncList();
  const navigate = useNavigate();

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
          <div style={{ padding: '20px' }}>
            {orderedItems.map((item) => (
              <SyncItem key={item.filename} {...item} />
            ))}
          </div>
        </PageContent>
      </PageLayout>
    </>
  );
};

export default withTranslation()(SyncListView);
