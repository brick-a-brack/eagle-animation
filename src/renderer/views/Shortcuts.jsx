import DesktopNavigation from '@components/DesktopNavigation';
import FormLayout from '@components/FormLayout';
import MobileNavigation from '@components/MobileNavigation';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ShortcutsList from '@components/ShortcutsList';
import SHORTCUTS from '@core/shortcuts';
import useDiscordActivity from '@hooks/useDiscordActivity';
import faArrowLeft from '@icons/faArrowLeft';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useDiscordActivity({ description: t('Ready to animate') });

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  const primaryActions = [{ label: t('Back'), icon: faArrowLeft, onClick: handleBack }];

  return (
    <PageLayout hasMobileLeftBar={true}>
      <DesktopNavigation leftActions={primaryActions} onAction={handleBack} title={t('Shortcuts')} withBorder />
      <MobileNavigation topLeftActions={primaryActions} showLeftActions={true} withBorder={true} />
      <PageContent>
        <FormLayout>
          <ShortcutsList shortcuts={SHORTCUTS} />
        </FormLayout>
      </PageContent>
    </PageLayout>
  );
};

export default withTranslation()(SettingsView);
