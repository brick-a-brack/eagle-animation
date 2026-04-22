import Action from '@components/Action';
import { BUILD, IS_DEV } from '@config-web';
import { compareVersions } from 'compare-versions';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const VersionUpdater = ({ onClick = null, version, latestVersion, t }) => {
  const canBeUpdated = compareVersions(latestVersion || '0.0.0', version || '0.0.0') === 1 && !IS_DEV;
  const currentVersion = IS_DEV ? t('Development Version') : version || t('Unknown Version');

  return (
    <Action onClick={onClick} role="button" tabIndex={0} className={`${style.version} ${canBeUpdated ? style.update : ''}`}>
      {canBeUpdated && (
        <>
          <span>{t('Update available')}</span>
          <span title={BUILD}>{`${currentVersion} → ${latestVersion || t('Unknown Version')}`}</span>
        </>
      )}
      {!canBeUpdated && (
        <>
          <span title={BUILD}>{currentVersion}</span>
        </>
      )}
    </Action>
  );
};

export default withTranslation()(VersionUpdater);
