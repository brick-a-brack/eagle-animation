import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import HeaderBar from '../components/HeaderBar';
import LoadingPage from '../components/LoadingPage';
import RemoteCards from '../components/RemoteCards';
import useRemoteConnection from '../hooks/useRemoteConnection';

const RemoteView = ({ t }) => {
  const { deviceId, connections, actions } = useRemoteConnection();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <>
      <LoadingPage show={!deviceId} />
      <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Pair this device')} />
      <div style={{ padding: 16 }}>
        <RemoteCards deviceId={deviceId} connections={connections} actions={actions} t={t} />
      </div>
    </>
  );
};

export default withTranslation()(RemoteView);
