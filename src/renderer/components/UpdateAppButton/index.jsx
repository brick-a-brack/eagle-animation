import Action from '@components/Action';
import useAppVersion from '@hooks/useAppVersion';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const UpdateBanner = ({ t }) => {
  const { currentVersion, latestVersion, canBeUpdated, actions } = useAppVersion();

  return (
    <Action onClick={canBeUpdated ? actions.openUpdatePage : undefined} role="button" tabIndex={canBeUpdated ? 0 : -1} className={`${style.button} ${canBeUpdated ? '' : style.disabled}`}>
      {canBeUpdated ? t('Update to {{version}}', { version: latestVersion }) : t('Already up to date ({{version}})', { version: currentVersion || t('Unknown') })}
    </Action>
  );
};

export default withTranslation()(UpdateBanner);
