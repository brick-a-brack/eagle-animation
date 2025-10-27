import HeaderBar from '@components/HeaderBar';
import LoadingPage from '@components/LoadingPage';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import SettingsForm from '@components/SettingsForm';
import useSettings from '@hooks/useSettings';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const { settings, actions: settingsActions } = useSettings();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <>
      <LoadingPage show={!settings} />
      <PageLayout>
        <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Settings')} withBorder />
        <PageContent>{settings && <SettingsForm settings={settings} onUpdate={settingsActions.setSettings} />}</PageContent>
      </PageLayout>
    </>
  );
};

export default withTranslation()(SettingsView);
