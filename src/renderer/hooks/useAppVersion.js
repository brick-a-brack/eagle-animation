import { CONTRIBUTE_REPOSITORY, VERSION } from '@config-web';
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
    window.EA('OPEN_LINK', { link: `https://github.com/${CONTRIBUTE_REPOSITORY}/releases` });
  }, [CONTRIBUTE_REPOSITORY]);

  // Action report
  const actionReportErrorPage = useCallback(() => {
    window.EA('OPEN_LINK', { link: `https://github.com/${CONTRIBUTE_REPOSITORY}/issues` });
  }, [CONTRIBUTE_REPOSITORY]);

  return {
    version: VERSION,
    latestVersion,
    actions: {
      openUpdatePage: actionOpenUpdatePage,
      openReportErrorPage: actionReportErrorPage,
    },
  };
}

export default useAppVersion;
