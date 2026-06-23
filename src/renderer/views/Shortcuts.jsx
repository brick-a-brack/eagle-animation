import FormLayout from '@components/FormLayout';
import HeaderBar from '@components/HeaderBar';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ShortcutsList from '@components/ShortcutsList';
import SHORTCUTS from '@core/shortcuts';
import useDiscordActivity from '@hooks/useDiscordActivity';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import faArrowLeft from '@icons/faArrowLeft';
import MobileLayout from '@components/MobileLayout';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useDiscordActivity({ description: t('Ready to animate') });

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

 const primaryActions = [
    { label: t('Back'), icon: faArrowLeft, onClick: handleBack },
  ]


  return (
    <PageLayout>
      <HeaderBar leftActions={primaryActions} onAction={handleBack} title={t('Shortcuts')} withBorder />
      <MobileLayout topLeftActions={primaryActions} showLeftActions={true} />
      <PageContent>
        <FormLayout>
          <ShortcutsList shortcuts={SHORTCUTS} />
        </FormLayout>
      </PageContent>
    </PageLayout>
  );
};

export default withTranslation()(SettingsView);
