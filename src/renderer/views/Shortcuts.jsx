import { withTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ActionsBar from '../components/ActionsBar';
import FormLayout from '../components/FormLayout';
import ShortcutsList from '../components/ShortcutsList';
import SHORTCUTS from '../core/shortcuts';

const SettingsView = ({ t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleBack = async () => {
    navigate(searchParams.get('back') || '/');
  };

  return (
    <>
      <ActionsBar actions={['BACK']} onAction={handleBack} />
      <FormLayout title={t('Shortcuts')}>
        <ShortcutsList shortcuts={SHORTCUTS} />
      </FormLayout>
    </>
  );
};

export default withTranslation()(SettingsView);
