import { useCallback, useEffect, useState } from 'react';

function useDataFolder() {
  const [path, setPath] = useState(null);

  // Initial load
  useEffect(() => {
    window
      .EA('GET_DATA_FOLDER')
      .then((dataFolderPath) => {
        setPath(dataFolderPath || null);
      })
      .catch(() => {
        setPath(null);
      });
  }, []);

  // Action open the data folder in the OS file explorer
  const actionOpenDataFolder = useCallback(() => {
    window.EA('OPEN_DATA_FOLDER');
  }, []);

  return {
    path,
    actions: {
      openDataFolder: actionOpenDataFolder,
    },
  };
}

export default useDataFolder;
