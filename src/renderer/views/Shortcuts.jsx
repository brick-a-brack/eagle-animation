import FormLayout from '@components/FormLayout';
import HeaderBar from '@components/HeaderBar';
import PageContent from '@components/PageContent';
import PageLayout from '@components/PageLayout';
import ShortcutsList from '@components/ShortcutsList';
import SHORTCUTS from '@core/shortcuts';
import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <PageLayout>
      <HeaderBar leftActions={['BACK']} onAction={handleBack} title={t('Shortcuts')} withBorder />
      <PageContent>
        <FormLayout>
          <ShortcutsList shortcuts={SHORTCUTS} />
        </FormLayout>
      </PageContent>
    </PageLayout>
  );
};

export default withTranslation()(SettingsView);
