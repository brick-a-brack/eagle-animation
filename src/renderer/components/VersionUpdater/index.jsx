import Action from '@components/Action';
import { compareVersions } from 'compare-versions';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const VersionUpdater = ({ onClick = null, version, latestVersion, t }) => {
  const canBeUpdated = compareVersions(latestVersion || '0.0.0', version || '0.0.0') === 1;

  return (
    <Action onClick={onClick} role="button" tabIndex={0} className={`${style.version} ${canBeUpdated ? style.update : ''}`}>
      {canBeUpdated && (
        <>
          <span>{t('Update available')}</span>
          <span>{`${version || ''} → ${latestVersion || ''}`}</span>
        </>
      )}
      {!canBeUpdated && (
        <>
          <span>{version}</span>
        </>
      )}
    </Action>
  );
};

export default withTranslation()(VersionUpdater);
