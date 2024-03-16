import { useNavigate, useSearchParams } from 'react-router-dom';
import { withTranslation } from 'react-i18next';

import ActionsBar from '../components/ActionsBar';
import FormLayout from '../components/FormLayout';
import SHORTCUTS from '../common/shortcuts';
import ShortcutsList from '../components/ShortcutsList';

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
