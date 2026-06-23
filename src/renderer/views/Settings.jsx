import HeaderBar from '@components/HeaderBar';
import LoadingPage from '@components/LoadingPage';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import SettingsForm from '@components/SettingsForm';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useSettings from '@hooks/useSettings';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import faArrowLeft from '@icons/faArrowLeft';
import MobileLayout from '@components/MobileLayout';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const { settings, actions: settingsActions } = useSettings();
  const navigate = useNavigate();
  useDiscordActivity({ description: t('Ready to animate') });

  const handleBack = () => {
    navigate(searchParams.get('back') || '/');
  };

   const primaryActions = [
    { label: t('Back'), icon: faArrowLeft, onClick: handleBack },
  ]

  
  return (
    <>
      <LoadingPage show={!settings} />
      <PageLayout>
        <HeaderBar leftActions={primaryActions} onAction={handleBack} title={t('Settings')} withBorder />
        <MobileLayout topLeftActions={primaryActions} showLeftActions={true} />
        <PageContent>{settings && <SettingsForm settings={settings} onUpdate={settingsActions.setSettings} />}</PageContent>
      </PageLayout>
    </>
  );
};

export default withTranslation()(SettingsView);
