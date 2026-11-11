export const EA = async (action, data) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    return window.IPC.call(action, data);
  }

  // Web (Web browser backend)
  if (typeof window.IPC === 'undefined') {
    return import('../../backend-web/actions').then(({ Actions: WebActions }) => {
      if (WebActions[action]) {
        return WebActions[action](null, data);
      }
    });
  }
};

// Returns an unsubscribe function
export const EAEvents = (name, callback = () => {}) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    return window.IPC.stream(name, callback) || (() => {});
  }

  // Web (Web browser backend), the module loads asynchronously so an early unsubscribe must cancel the registration
  let unsubscribed = false;
  let unsubscribe = () => {
    unsubscribed = true;
  };
  import('../../backend-web/actions').then(({ addEventListener, removeEventListener }) => {
    if (unsubscribed) {
      return;
    }
    addEventListener(name, callback);
    unsubscribe = () => removeEventListener(name, callback);
  });
  return () => unsubscribe();
};
