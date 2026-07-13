import DesktopNavigation from '@components/DesktopNavigation';
import LoadingPage from '@components/LoadingPage';
import MobileNavigation from '@components/MobileNavigation';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import SettingsForm from '@components/SettingsForm';
import useDiscordActivity from '@hooks/useDiscordActivity';
import useSettings from '@hooks/useSettings';
import faArrowLeft from '@icons/faArrowLeft';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const { settings, actions: settingsActions } = useSettings();
  const navigate = useNavigate();
  useDiscordActivity({ description: t('Ready to animate') });

  const handleBack = () => {
    navigate(searchParams.get('back') || '/');
  };

  const primaryActions = [{ label: t('Back'), icon: faArrowLeft, onClick: handleBack }];

  return (
    <>
      <LoadingPage show={!settings} />
      <PageLayout hasMobileLeftBar={true}>
        <DesktopNavigation leftActions={primaryActions} title={t('Settings')} />
        <MobileNavigation topLeftActions={primaryActions} showLeftActions={true} />
        <PageContent>{settings && <SettingsForm settings={settings} onUpdate={settingsActions.setSettings} />}</PageContent>
      </PageLayout>
    </>
  );
};

export default withTranslation()(SettingsView);
