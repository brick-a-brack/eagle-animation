import { CONTRIBUTE_REPOSITORY, DOWNLOAD_LINK, VERSION } from '@config-web';
import { BUILD, IS_DEV } from '@config-web';
import { compareVersions } from 'compare-versions';
import { useCallback, useEffect, useState } from 'react';

function useAppVersion() {
  const [latestVersion, setLatestVersion] = useState(null);

  // Initial load
  useEffect(() => {
    (async () => {
      setLatestVersion((await window.EA('GET_LAST_VERSION').catch(() => null))?.version || null);
    })();
  }, []);

  // Action open update page
  const actionOpenUpdatePage = useCallback(() => {
    window.EA('OPEN_LINK', { link: DOWNLOAD_LINK });
  }, []);

  // Action report
  const actionReportErrorPage = useCallback(() => {
    window.EA('OPEN_LINK', { link: `https://github.com/${CONTRIBUTE_REPOSITORY}/issues` });
  }, []);

  // Prepare variables
  const canBeUpdated = !IS_DEV && !!latestVersion && compareVersions(latestVersion, VERSION || '0.0.0') === 1;
  const currentVersionLabel = `v${VERSION}${IS_DEV ? '-dev' : ''}`;
  const latestVersionLabel = IS_DEV ? currentVersionLabel : `v${latestVersion}`;

  return {
    build: BUILD,
    currentVersion: currentVersionLabel,
    latestVersion: latestVersionLabel,
    canBeUpdated,
    actions: {
      openUpdatePage: actionOpenUpdatePage,
      openReportErrorPage: actionReportErrorPage,
    },
  };
}

export default useAppVersion;
