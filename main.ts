const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#6a7b8d',
      symbolColor: '#eee'
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nativeWindowOpen: true
    }
  })

  win.loadFile('index.html')
  // win.webContents.openDevTools()
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});