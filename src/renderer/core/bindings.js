export const EA = async (action, data) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    return window.IPC.call(action, data);
  }

  // Web (Web browser backend)
  if (typeof window.IPC === 'undefined') {
    return import('../actions').then(({ Actions: WebActions }) => {
      if (WebActions[action]) {
        return WebActions[action](null, data);
      }
    });
  }
};

export const EAEvents = (name, callback = () => { }) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    if (typeof callback !== 'undefined') {
      window.IPC.stream(name, callback);
    }
  }

  // Web (Web browser backend)
  if (typeof window.IPC === 'undefined') {
    import('../actions').then(({ addEventListener }) => {
      addEventListener(name, callback);
    });
  }
};

