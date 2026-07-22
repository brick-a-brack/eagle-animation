import Button from '@components/Button';
import useAppVersion from '@hooks/useAppVersion';
import { withTranslation } from 'react-i18next';

const UpdateAppButton = ({ t }) => {
  const { currentVersion, latestVersion, canBeUpdated, build, actions } = useAppVersion();

  return (
    <Button
      size="small"
      color="primary"
      title={build}
      disabled={!canBeUpdated}
      onClick={canBeUpdated ? actions.openUpdatePage : undefined}
      label={canBeUpdated ? t('Update to {{version}}', { version: latestVersion }) : t('Already up to date ({{version}})', { version: currentVersion || t('Unknown') })}
    />
  );
};

export default withTranslation()(UpdateAppButton);
