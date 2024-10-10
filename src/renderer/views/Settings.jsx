import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ActionsBar from '../components/ActionsBar';
import SettingsForm from '../components/SettingsForm';
import useSettings from '../hooks/useSettings';
import LoadingPage from '../components/LoadingPage';

const SettingsView = () => {
  const [searchParams] = useSearchParams();
  const { settings, actions: settingsActions } = useSettings();
  const navigate = useNavigate();

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <>
      <LoadingPage show={!settings} />
      <ActionsBar actions={['BACK']} onAction={handleBack} />
      {settings && false && <SettingsForm settings={settings} onUpdate={settingsActions.setSettings} />}
    </>
  );
};

export default withTranslation()(SettingsView);
