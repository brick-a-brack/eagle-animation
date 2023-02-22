const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('IPC', {
    call: (channel, data) => ipcRenderer.invoke(channel, data),
});
