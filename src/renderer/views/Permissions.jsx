import { useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ActionCard from '../components/ActionCard';
import FormLayout from '../components/FormLayout';
import Header from '../components/Header';
import MediaStatus from '../components/MediaStatus';
import Text from '../components/Text';
import { LS_PERMISSIONS } from '../config';
import useAppVersion from '../hooks/useAppVersion';
import useCamera from '../hooks/useCamera';

const PermissionsView = ({ t }) => {
  const { version } = useAppVersion();
  const navigate = useNavigate();
  const { permissions, actions: cameraActions } = useCamera();

  const handleHome = async () => {
    localStorage.setItem(LS_PERMISSIONS, '1');
    navigate('/');
  };

  useEffect(() => {
    if (localStorage.getItem(LS_PERMISSIONS)) {
      navigate('/');
    }
  }, []);

  return (
    <>
      <Header action={null} version={version} latestVersion={null} />
      <FormLayout title={t('Permissions setup')}>
        <Text center>{t('Eagle Animation requires camera and microphone permissions to work, if skipped, you will be able to grant access in the settings.')}</Text>
        <br />
        <MediaStatus
          type={'camera'}
          permission={permissions?.camera}
          action={() => {
            cameraActions.askPermission('camera');
          }}
        />
        <MediaStatus
          title={'microphone'}
          permission={permissions?.microphone}
          action={() => {
            cameraActions.askPermission('microphone');
          }}
        />
        <br />
        <div style={{ display: 'flex', gap: 'var(--space-medium)', justifyContent: 'center' }}>
          <ActionCard sizeAuto={true} action={handleHome} title={permissions?.camera === 'granted' && permissions?.microphone === 'granted' ? t("Let's go!") : t('Skip setup')} secondary />
        </div>
      </FormLayout>
    </>
  );
};

export default withTranslation()(PermissionsView);
