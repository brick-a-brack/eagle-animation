import { OptimizeFrame } from '@core/Optimizer';
import { useCallback, useEffect, useState } from 'react';

function useSyncList(options) {
  const [data, setData] = useState([
    {
        "apiKey": "00000000-0000-0000-0000-000000000000",
        "publicCode": "D328X2UO",
        "fileName": "D328X2UO.mp4",
        "fileExtension": "mp4",
        "isUploaded": true,
        "endpoint": "https://api.brickfilms.com/eagle-animation"
    },
    {
        "apiKey": "00000000-0000-0000-0000-000000000000",
        "publicCode": "Q45B5Z94",
        "fileName": "Q45B5Z94.mp4",
        "fileExtension": "mp4",
        "isUploaded": false,
        "endpoint": "https://api.brickfilms.com/eagle-animation"
    },
    {
        "apiKey": "00000000-0000-0000-0000-000000000000",
        "publicCode": "P6EJTETP",
        "fileName": "P6EJTETP.mp4",
        "fileExtension": "mp4",
        "isUploaded": true,
        "endpoint": "https://api.brickfilms.com/eagle-animation"
    },
    {
        "apiKey": "00000000-0000-0000-0000-000000000000",
        "publicCode": "P6EJTETP",
        "fileName": "P6EJTETP.mp4",
        "fileExtension": "mp4",
        "isUploaded": true,
        "endpoint": "https://api.brickfilms.com/eagle-animation"
    },
    {
        "apiKey": "00000000-0000-0000-0000-000000000000",
        "email": "m.baconnais@outlook.com",
        "fileName": "P6EJTETP.mp4",
        "fileExtension": "mp4",
        "isUploaded": true,
        "endpoint": "https://api.brickfilms.com/eagle-animation"
    }
]);

 /* // Initial load
  useEffect(() => {
    if (!options?.skip) {
      window.EA('GET_SYNC_LIST').then((d) => {
        setData(d);
      });
    }
  }, [options?.skip]);*/

  // Action refresh
  const actionRefresh = useCallback(async () => {
    window.EA('GET_SYNC_LIST').then((d) => {
      setData(d);
    });
  }, []);

  return {
    items: Array.isArray(data) ? data : [],
    actions: {
      refresh: actionRefresh,
    },
  };
}

export default useSyncList;
