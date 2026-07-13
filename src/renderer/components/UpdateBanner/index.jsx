import Action from '@components/Action';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAppVersion from '@hooks/useAppVersion';
import faRotate from '@icons/faRotate';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const UpdateBanner = ({ t }) => {
  const { currentVersion, latestVersion, canBeUpdated, actions } = useAppVersion();

  if (!canBeUpdated) {
    return null;
  }

  return (
    <Action onClick={canBeUpdated ? actions.openUpdatePage : undefined} role="button" tabIndex={0} className={style.banner}>
      <FontAwesomeIcon className={style.icon} icon={faRotate} />
      <span className={style.title}>{t('A new version is available')}</span>
      <span className={style.versions}>
        <span className={style.newVersion}>
          {currentVersion}
          <span className={style.arrow}>{' → '}</span>
          {latestVersion}
        </span>
      </span>
      <span className={style.cta}>{t('Update now')}</span>
    </Action>
  );
};

export default withTranslation()(UpdateBanner);
