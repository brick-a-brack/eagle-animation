import { withTranslation } from 'react-i18next';

import KeyPad from '../components/Keypad';
import useRemoteConnection from '../hooks/useRemoteConnection';

const RemoteView = ({ t }) => {
  const { deviceId, connections, actions } = useRemoteConnection();

  return (
    <>
      <KeyPad />
    </>
  );
};

export default withTranslation()(RemoteView);
