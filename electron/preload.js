const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Información del sistema
  platform: process.platform,

  // Eventos de la app
  onWindowFocus: (callback) => ipcRenderer.on('window-focus', callback),
  onWindowBlur:  (callback) => ipcRenderer.on('window-blur', callback),

  // Utilidades
  log: (message) => ipcRenderer.send('log', message),
})
