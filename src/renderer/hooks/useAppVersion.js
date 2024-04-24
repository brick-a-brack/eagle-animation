import { useCallback, useEffect, useState } from 'react';

import { CONTRIBUTE_REPOSITORY, VERSION } from '../config';

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

  return {
    version: VERSION,
    latestVersion,
    actions: {
      openUpdatePage: actionOpenUpdatePage,
    },
  };
}

export default useAppVersion;
