import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ActionsBar from '../components/ActionsBar';
import LoadingPage from '../components/LoadingPage';
import useRemoteConnection from '../hooks/useRemoteConnection';

const RemoteView = ({ t }) => {
  const { deviceId, connections, actions } = useRemoteConnection();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const onConnect = (id) => {
    actions.connectTo(document.getElementById('_ID').value);
  };

  const onCameras = async (id) => {
    console.log('cames');
    const data = await actions.action(id, 'LIST_CAMERAS', {});
    console.log('DDD', data);
  };

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <>
      <LoadingPage show={!deviceId} />
      <ActionsBar actions={['BACK']} onAction={handleBack} />
      My PEERID = {deviceId}
      <br />
      <input id="_ID" value="ea-firefox-test" />
      <button onClick={onConnect}>CONNECT</button>
      <br />
      <br />
      LIST:
      {connections.map((e) => (
        <div>
          {e.id}
          <button onClick={() => onCameras(e.id)}>ASK CAMERAS</button>
        </div>
      ))}
    </>
  );
};

export default withTranslation()(RemoteView);
