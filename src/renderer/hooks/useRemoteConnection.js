import { useCallback, useEffect, useRef, useState } from 'react';

import remote from '../core/Remote';

const useRemoteConnection = () => {
  const [immediate, setImmediate] = useState(null);

  useEffect(() => {
    setInterval(() => {
      setImmediate(new Date().getTime());
    }, 500);
  });

  const actionConnectTo = useCallback((id) => {
    remote.connectTo(id);
  }, []);

  const actionAction = useCallback((id, action, data) => {
    remote.action(id, action, data);
  }, []);

  return {
    deviceId: remote.deviceId,
    connections: remote.connections,
    actions: {
      connectTo: actionConnectTo,
      action: actionAction,
    },
  };
};

export default useRemoteConnection;
