// Modules to control application life and create native browser window
const { app, session, ipcMain, BrowserWindow } = require('electron')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const createContextMenu = require('electron-context-menu')
const { default: fetch } = require('node-fetch')
const ProxyAgent = require('proxy-agent')

const HTTP_PROXY = process.env.HTTP_PROXY
const httpProxyAgent = HTTP_PROXY && new ProxyAgent(HTTP_PROXY)

/** @type {typeof fetch} */
const fetchWithSystemProxy = (url, init) =>
  fetch(url, {
    agent: httpProxyAgent,
    ...init,
  })

// if (process.platform === 'linux') {
//   app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
//   app.commandLine.appendSwitch('enable-gpu-rasterization')
// }

const QUEUE = [
  {
    id: '1',
    ytID: 'ke5TOxeEL8Q',
    title: `Obama On Fireー☆`,
    channel: 'MikamiIsAJerk',
    requestedBy: 'GaZaTu',
    requestedByUserId: '',
    sent: false,
    done: false,
  },
  {
    id: '2',
    ytID: 'JQsdgenRLHY',
    title: `Oj Alija Aljo! - English Lyrics`,
    channel: 'João Karaś',
    requestedBy: 'Supinic is mega SMOL',
    requestedByUserId: '',
    sent: false,
    done: false,
  },
  // {
  //   id: '2',
  //   sent: false,
  //   done: true,
  // },
  {
    id: '3',
    ytID: 'UsGg0wFSkOY',
    title: `Pajlada Trick`,
    channel: 'TOP KEK',
    requestedBy: 'Supinic',
    requestedByUserId: '',
    sent: false,
    done: false,
  },
  // {
  //   id: '4',
  //   sent: false,
  //   done: true,
  // },
  {
    id: '5',
    ytID: 'Q0o8H7oDHB0',
    title: `♂ KUNG BILLY - TRUE ASS WARRIOR (from WRESTLERS: MUSCLE FANTASIES 2) ♂`,
    channel: 'BBilly BBerrington',
    requestedBy: 'GaZaTu',
    requestedByUserId: '',
    sent: false,
    done: false,
  },
  {
    id: '6',
    ytID: 'zxptc68Mpw4',
    title: `♂ GACHIBANK - BILL AUGHRIGHT ♂`,
    channel: 'BBilly BBerrington',
    requestedBy: 'GaZaTu',
    requestedByUserId: '',
    sent: false,
    done: false,
  },
]

const getNextInQueue = () => {
  const next = QUEUE.find(e => !e.sent)
  if (next) {
    next.sent = true
  }

  return Promise.resolve(next)
}

const finishInQueue = (find) => {
  if (!find) {
    return
  }

  const current = QUEUE.find(e => e.id === find.id)
  if (current) {
    current.done = true
  }

  return Promise.resolve(undefined)
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // title: 'YT-Playlist-Instrumentor',
    // icon: '',
    width: 850,
    height: 675,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
      preload: `${__dirname}/preload.js`,
    },
    autoHideMenuBar: true,
    resizable: false,
  })

  const metadata = {
    /** @type {any} */
    current: undefined,
    /** @type {any} */
    next: undefined,
  }

  ipcMain.on('log', (event, ...args) => {
    console.log(...args)
  })

  ipcMain.on('login', async (event, authToken) => {
    metadata.current = await getNextInQueue()
    metadata.next = await getNextInQueue()

    if (!metadata.next?.ytID) {
      metadata.next = undefined
    }

    const firstUrl = `https://www.youtube.com/watch?v=${metadata.current?.ytID}`
    await mainWindow.loadURL(firstUrl)
  })

  ipcMain.handle('getNextInQueue', async () => {
    metadata.current = metadata.next
    metadata.next = await getNextInQueue()

    if (!metadata.next?.ytID) {
      metadata.next = undefined
    }

    return metadata.next
  })

  ipcMain.on('getNextInQueueSync', (event) => {
    event.returnValue = metadata.next
  })

  ipcMain.handle('getCurrentInQueue', async () => {
    return metadata.current
  })

  ipcMain.on('emptied', async (event, current) => {
    await finishInQueue(current)
  })

  // await mainWindow.loadFile(`${__dirname}/login.html`)

  await mainWindow.loadURL('https://gazatu.xyz/login')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await session.defaultSession.setProxy({
    proxyRules: HTTP_PROXY,
  })

  const adBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetchWithSystemProxy)
  adBlocker.enableBlockingInSession(session.defaultSession)

  createContextMenu()
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
