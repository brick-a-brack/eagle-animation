const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('IPC', {
    call: (channel, data) => ipcRenderer.invoke(channel, data),
    stream: (channel, callback) => ipcRenderer.on(channel, callback),
});
