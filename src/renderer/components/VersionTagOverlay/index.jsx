import useAppVersion from '@hooks/useAppVersion';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const VersionTagOverlay = () => {
  const { currentVersion, build } = useAppVersion();

  return (
    <span title={build} className={style.tag}>
      {currentVersion}
    </span>
  );
};

export default withTranslation()(VersionTagOverlay);
