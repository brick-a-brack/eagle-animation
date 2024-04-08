import { useNavigate, useSearchParams } from 'react-router-dom';
import { withTranslation } from 'react-i18next';

import ActionsBar from '../components/ActionsBar';
import useSettings from '../hooks/useSettings';
import SettingsForm from '../components/SettingsForm';

const SettingsView = () => {
  const [searchParams] = useSearchParams();
  const { settings, actions: settingsActions } = useSettings();
  const navigate = useNavigate();

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <>
      <ActionsBar actions={['BACK']} onAction={handleBack} />
      {settings && <SettingsForm settings={settings} onUpdate={settingsActions.setSettings} />}
    </>
  );
};

export default withTranslation()(SettingsView);
